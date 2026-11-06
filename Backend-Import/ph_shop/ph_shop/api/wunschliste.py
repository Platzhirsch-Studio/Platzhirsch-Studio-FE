"""Wunschliste-Speicher für die Website (Token website@platzhirsch.studio, Rolle PH Website Integration).

Schnittstelle wie der Speicher der Website (src/lib/wunschliste/localStore.js bzw. frappeAdapter.js:
create / get / getByShare / update / remove). Ausgetauscht wird der ganze Datensatz aus model.js
(camelCase, RECORD_VERSION 1); ph_shop speichert ihn strukturiert (PH Wunschliste + Kindtabellen).

  create_wishlist(record)                                   → {referenz, list_id, ref, share_hash, modified[, bereits_vorhanden]}
  get_wishlist(list_id, admin_hash=None)                    → {found, record, modified, referenz}   found:false → null
  get_wishlist_by_share(share_hash)                         → {found, record, modified, referenz}   share_hash = sha256(shareId)
  update_wishlist(list_id, record, expected_modified=None, admin_hash=None) → {found, record, modified, referenz}
  remove_wishlist(list_id, admin_hash=None)                 → {deleted}

Optimistische Sperre: update mit expected_modified (Wert `modified` der letzten Antwort); weicht er ab →
409 conflict (zwei gleichzeitige Reservierungen desselben Stücks gelingen nicht beide). Der Adapter liest
dann neu und wendet seine Änderung erneut an (localStore.update(listId, fn)).
admin_hash (optional, sha256(adminSecret)): wenn übergeben, muss er passen, sonst 404 – ohne Aussage, ob
die Liste existiert. Die Ownership-Prüfung selbst macht die Website (model.js ownsRecord).
E-Mails der Beitragenden kommen maskiert zurück (CONVENTIONS 11); beim Speichern bleibt die gespeicherte
Adresse, wenn die maskierte/leere zurückkommt. Abgelaufene Listen: Website löscht beim Zugriff,
Scheduler täglich (PH Wunschliste.abgelaufene_loeschen).
"""

import json

import frappe
from frappe.utils import get_datetime

from ph_core.api import ApiFehler, ip_hash, ph_api, text
from ph_shop import wunschliste as wl
from ph_shop.ph_shop.doctype.ph_wunschliste.ph_wunschliste import als_record, zeit_ein

DT = "PH Wunschliste"


def _record(wert):
    if isinstance(wert, str):
        try:
            wert = json.loads(wert)
        except ValueError:
            raise ApiFehler("invalid", 400, "Ungültiges JSON.", {"field": "record"})
    if not isinstance(wert, dict):
        raise ApiFehler("invalid", 400, "Datensatz fehlt.", {"field": "record"})
    return wert


def _werte(record, alte_beitraege=None):
    try:
        return wl.record_zu_werten(record, zeit_ein, alte_beitraege)
    except wl.RecordFehler as e:
        raise ApiFehler("invalid", 400, str(e), {"field": e.feld})


def _name_zu(list_id, admin_hash=None):
    lid = text(list_id, 40)
    if not wl.TOKEN_RE.match(lid):
        raise ApiFehler("invalid", 400, "list_id ungültig.", {"field": "list_id"})
    name = frappe.db.get_value(DT, {"list_id": lid}, "name")
    if name and admin_hash and not wl.hash_gleich(frappe.db.get_value(DT, name, "admin_hash"), text(admin_hash, 64)):
        return None
    return name


def _antwort(doc):
    doc.reload()
    return {"found": True, "referenz": doc.name, "record": als_record(doc), "modified": str(doc.modified)}


def _kinder_setzen(doc, werte):
    for k, v in werte.items():
        if k not in ("positionen", "beitraege"):
            doc.set(k, v)
    doc.set("positionen", werte["positionen"])
    doc.set("beitraege", werte["beitraege"])


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(idempotent=True, limit_pro_minute=60, referenz=lambda r: (DT, r["referenz"]))
def create_wishlist(record=None, **d):
    r = _record(record if record is not None else d)
    werte = _werte(r)
    vorhanden = frappe.db.get_value(DT, {"list_id": werte["list_id"]}, ["name", "admin_hash", "share_hash", "ref", "modified"], as_dict=True)
    if vorhanden:
        if not wl.hash_gleich(vorhanden.admin_hash, werte["admin_hash"]):
            raise ApiFehler("conflict", 409, "Listen-ID ist vergeben.")
        return {"referenz": vorhanden.name, "list_id": werte["list_id"], "ref": vorhanden.ref, "share_hash": vorhanden.share_hash, "modified": str(vorhanden.modified), "bereits_vorhanden": True}
    if frappe.db.exists(DT, {"share_hash": werte["share_hash"]}):
        raise ApiFehler("conflict", 409, "Teilen-Hash ist vergeben.")
    doc = frappe.new_doc(DT)
    _kinder_setzen(doc, werte)
    doc.quelle = "website"
    doc.ip_hash = ip_hash()
    doc.insert()
    return {"referenz": doc.name, "list_id": doc.list_id, "ref": doc.ref, "share_hash": doc.share_hash, "modified": str(doc.modified)}


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=240)
def get_wishlist(list_id, admin_hash=None):
    name = _name_zu(list_id, admin_hash)
    if not name:
        return {"found": False}
    return _antwort(frappe.get_doc(DT, name))


@frappe.whitelist(allow_guest=False, methods=["GET", "POST"])
@ph_api(limit_pro_minute=240)
def get_wishlist_by_share(share_hash):
    h = text(share_hash, 64).lower()
    if not wl.HASH_RE.match(h):
        raise ApiFehler("invalid", 400, "share_hash muss sha256(shareId) sein.", {"field": "share_hash"})
    name = frappe.db.get_value(DT, {"share_hash": h}, "name")
    if not name:
        return {"found": False}
    return _antwort(frappe.get_doc(DT, name))


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=120, referenz=lambda r: (DT, r.get("referenz")))
def update_wishlist(list_id, record=None, expected_modified=None, admin_hash=None):
    name = _name_zu(list_id, admin_hash)
    if not name:
        raise ApiFehler("not_found", 404, "Wunschliste nicht gefunden.")
    # Zeile sperren, dann Stand vergleichen (zwei Reservierungen gleichzeitig → eine bekommt 409).
    aktuell = frappe.db.get_value(DT, name, ["modified", "admin_hash"], as_dict=True, for_update=True)
    if expected_modified and get_datetime(expected_modified) != get_datetime(aktuell.modified):
        raise ApiFehler("conflict", 409, "Die Liste wurde inzwischen geändert.", {"modified": str(aktuell.modified)})
    r = _record(record)
    try:
        wl.pruefe_record(r, list_id=text(list_id, 40))
    except wl.RecordFehler as e:
        raise ApiFehler("invalid", 400, str(e), {"field": e.feld})
    if not wl.hash_gleich(aktuell.admin_hash, r.get("adminHash")):
        raise ApiFehler("invalid", 400, "adminHash ist unveränderlich.", {"field": "adminHash"})
    doc = frappe.get_doc(DT, name)
    alte = {b.beitrag_id: b.schenker_email for b in doc.beitraege if b.schenker_email}
    _kinder_setzen(doc, _werte(r, alte))
    doc.save()
    return _antwort(doc)


@frappe.whitelist(allow_guest=False, methods=["POST"])
@ph_api(limit_pro_minute=60)
def remove_wishlist(list_id, admin_hash=None):
    name = _name_zu(list_id, admin_hash)
    if not name:
        return {"deleted": False}
    # Website-Rolle hat kein delete-Recht (CONVENTIONS 5); Löschen nur über diese geprüfte Methode.
    frappe.delete_doc(DT, name, ignore_permissions=True, force=True)
    return {"deleted": True}
