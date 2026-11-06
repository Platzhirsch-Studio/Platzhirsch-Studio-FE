"""Geteiltes Ideenboard als Speicher der Website (Frappe-Seite von src/lib/ideenboard/localStore.js).

Die Website behält Kennungen, Hash-Prüfung und Verwaltungslogik (service.js manageShared); dieses Modul ist der
Speicher mit derselben Schnittstelle: create / get / getByShare / update / remove / sweep. Reine Regeln:
ph_marketing/utils/ideenboard.py. Zeiten: Datetime-Felder in Site-Zeitzone, nach außen ISO wie toISOString (UTC, Z).
Löschung: 12 Monate nach der letzten Änderung (expiresAt), täglich über tasks.datenschutz_aufraeumen.
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import frappe
from frappe import _
from frappe.utils import get_datetime, get_system_timezone

from ph_core.api import ApiFehler
from ph_marketing.utils import ideenboard as ib

DT = "PH Ideenboard"


def _tz():
    return ZoneInfo(get_system_timezone() or "Europe/Vienna")


def _lokal(iso):
    """ISO (UTC/Offset) → naive Site-Zeit für Datetime-Felder."""
    return ib.iso_zu_utc(iso).astimezone(_tz()).replace(tzinfo=None)


def _iso(wert):
    if not wert:
        return None
    dt = get_datetime(wert)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_tz())
    return ib.utc_iso(dt)


def _fehler(e):
    meldung = _("Das Ideenboard enthält keine gültigen Karten.") if e.code == "empty" else _("Ungültiger Wert: {0}").format(e.feld)
    return ApiFehler(e.code, 400, meldung, {"field": e.feld} if e.feld else None)


def _record(doc):
    """DocType → Website-Datensatz (model.js createRecord-Form, inkl. Hashes – nur für den Website-Server)."""
    karten = [ib.zeile_zu_karte(z.as_dict()) for z in sorted(doc.karten, key=lambda z: z.position or z.idx)]
    return {
        "v": 1,
        "boardId": doc.board_id,
        "shareHash": doc.share_hash,
        "adminHash": doc.admin_hash,
        "status": ib.STATUS_ZU_WEBSITE.get(doc.status, "aktiv"),
        "createdAt": _iso(doc.erstellt_am),
        "updatedAt": _iso(doc.aktualisiert_am),
        "expiresAt": _iso(doc.laeuft_ab_am),
        "cards": karten,
    }


def _setzen(doc, werte):
    doc.share_hash = werte["share_hash"]
    doc.status = ib.STATUS_ZU_DOCTYPE[werte["status"]]
    if werte.get("created_at"):
        doc.erstellt_am = _lokal(werte["created_at"])
    doc.aktualisiert_am = _lokal(werte["updated_at"])
    doc.laeuft_ab_am = _lokal(werte["expires_at"])
    doc.set("karten", [])
    for i, karte in enumerate(werte["cards"], start=1):
        doc.append("karten", ib.karte_zu_zeile(karte, i))


def _abgelaufen(doc):
    return ib.abgelaufen(_iso(doc.laeuft_ab_am), datetime.now(timezone.utc))


def _laden(board_id, for_update=False):
    if not ib.ist_token(board_id) or not frappe.db.exists(DT, board_id):
        return None
    return frappe.get_doc(DT, board_id, for_update=for_update)


def anlegen(record, idempotency_key=None):
    try:
        werte = ib.record_pruefen(record, neu=True)
    except ib.BoardFehler as e:
        raise _fehler(e)
    if frappe.db.exists(DT, werte["board_id"]) or frappe.db.exists(DT, {"share_hash": werte["share_hash"]}):
        raise ApiFehler("conflict", 409, _("Ideenboard existiert bereits."))
    doc = frappe.new_doc(DT)
    doc.board_id = werte["board_id"]
    doc.admin_hash = werte["admin_hash"]
    doc.idempotency_key = idempotency_key or None
    doc.quelle = "website"
    _setzen(doc, werte)
    doc.insert(ignore_permissions=True)
    return _record(doc)


def lesen(board_id):
    """localStore.get(): Datensatz oder None. Abgelaufene werden sofort gelöscht (service.js tut dasselbe)."""
    doc = _laden(board_id)
    if not doc:
        return None
    if _abgelaufen(doc):
        frappe.delete_doc(DT, doc.name, ignore_permissions=True, force=True)
        return None
    return _record(doc)


def lesen_per_share(share_hash=None, share_id=None):
    """localStore.getByShare(): bevorzugt mit share_hash (sha256(shareId)); share_id wird hier gehasht."""
    if not share_hash and share_id:
        if not ib.ist_token(share_id):
            return None
        share_hash = ib.sha256(share_id)
    if not ib.ist_hash(share_hash):
        return None
    name = frappe.db.get_value(DT, {"share_hash": share_hash}, "name")
    return lesen(name) if name else None


def aendern(board_id, record, erwartet=None):
    """localStore.update(): Karten, Status, shareHash (renew), updatedAt, expiresAt ersetzen.

    adminHash und createdAt bleiben. erwartet = updatedAt, den die Website gelesen hat → 409 conflict, wenn inzwischen
    jemand anderes geschrieben hat (Ersatz für das Datei-Lock in localStore.js).
    """
    doc = _laden(board_id, for_update=True)
    if not doc or _abgelaufen(doc):
        raise ApiFehler("not_found", 404, _("Ideenboard nicht gefunden."))
    if erwartet and erwartet != _iso(doc.aktualisiert_am):
        raise ApiFehler("conflict", 409, _("Das Ideenboard wurde inzwischen geändert."), {"updatedAt": _iso(doc.aktualisiert_am)})
    try:
        werte = ib.record_pruefen(record, neu=False)
    except ib.BoardFehler as e:
        raise _fehler(e)
    if record.get("adminHash") and record["adminHash"] != doc.admin_hash:
        raise ApiFehler("invalid", 400, _("adminHash ist unveränderlich."), {"field": "adminHash"})
    andere = frappe.db.get_value(DT, {"share_hash": werte["share_hash"], "name": ("!=", doc.name)}, "name")
    if andere:
        raise ApiFehler("conflict", 409, _("Teilen-Link ist bereits vergeben."))
    werte.pop("created_at", None)
    _setzen(doc, werte)
    doc.save(ignore_permissions=True)
    return _record(doc)


def entfernen(board_id):
    doc = _laden(board_id)
    if not doc:
        return False
    frappe.delete_doc(DT, doc.name, ignore_permissions=True, force=True)
    return True


def abgelaufene_loeschen(limit=2000):
    """localStore.sweep(): {checked, removed, orphans} – Verweise gibt es hier nicht (orphans = 0)."""
    jetzt = datetime.now(_tz()).replace(tzinfo=None)
    namen = frappe.get_all(DT, filters={"laeuft_ab_am": ("<=", jetzt)}, pluck="name", limit=limit)
    ohne_ablauf = frappe.get_all(DT, filters={"laeuft_ab_am": ("is", "not set")}, pluck="name", limit=limit)
    for name in namen + ohne_ablauf:
        frappe.delete_doc(DT, name, ignore_permissions=True, force=True)
    frappe.db.commit()
    return {"checked": frappe.db.count(DT) + len(namen) + len(ohne_ablauf), "removed": len(namen) + len(ohne_ablauf), "orphans": 0}
