"""Anbieter für den Kontakt-Hook-Vertrag von ph_crm (Zeitleiste, DSGVO-Auskunft, Löschen/Anonymisieren, Zusammenführen).

Registriert in hooks.py:
  ph_kontakt_zeitleiste        fn(kontakt, vor=None, limit=30) -> [dict(zeit, art, doctype, name, titel, text, app)]
  ph_kontakt_datenauskunft     fn(kontakt) -> [dict(abschnitt, doctype, name, daten)]
  ph_kontakt_anonymisieren     fn(kontakt, ausfuehren=False) -> [dict(doctype, name, aktion, grund, frist_bis)]
  ph_kontakt_zusammengefuehrt  fn(alt, neu)
Aufbewahrungsregeln: ph_service/utils/aufbewahrung.py (Gewährleistung/Garantie/Regress). Belege (Rechnung, Gutschrift)
liegen in ph_faktura und werden dort nach BAO behandelt.
"""

import frappe
from frappe import _
from frappe.utils import get_datetime, getdate

from ph_service.ph_service import fristen as fr
from ph_service.utils import aufbewahrung as auf

APP = "ph_service"
ANONYM = "Anonymisiert"

# DocType → Felder mit Personendaten, die beim Anonymisieren geleert/ersetzt werden
FELDER_ANONYM = {
    "PH Servicefall": {
        "kunde_name": ANONYM, "kunde_email": None, "kunde_telefon": None, "einsatz_strasse": None, "einsatz_plz": None,
        "einsatz_ort": None, "abnahme_name": None, "abnahme_unterschrift": None, "zufriedenheit_kommentar": None,
        "notiz_intern": None, "ip_hash": None, "seriennummer": None,
    },
    "PH Serviceeinsatz": {
        "kunde_name": ANONYM, "strasse": None, "plz": None, "ort": None, "unterschrift_kunde": None, "unterschrift_name": None,
        "hinweis_intern": None,
    },
    "PH Pflege Abo": {
        "kunde_name": ANONYM, "kontakt_email": None, "strasse": None, "plz": None, "ort": None, "notizen": None, "anfrage_text": None,
        "lead_ref": None,
    },
    "PH Serviceauftrag": {
        "kunde_name": ANONYM, "strasse": None, "plz": None, "ort": None, "uebernahme_unterschrift": None, "rueckgabe_unterschrift": None,
        "notizen": None,
    },
}
FOTO_TABELLEN = {"PH Servicefall": "PH Servicefall Foto", "PH Serviceeinsatz": "PH Serviceeinsatz Foto"}


def _iso(wert):
    return get_datetime(wert).isoformat() if wert else None


def _dts():
    return [dt for dt in FELDER_ANONYM if frappe.db.exists("DocType", dt)]


# ── Zeitleiste ──────────────────────────────────────────────────────────────


def zeitleiste(kontakt, vor=None, limit=30):
    limit = max(1, min(int(limit or 30), 200))
    grenze = get_datetime(vor) if vor else None
    out = []
    faelle = frappe.get_all("PH Servicefall", filters={"kontakt": kontakt}, fields=["name", "titel", "status", "gemeldet_am", "creation", "art"], order_by="creation desc", limit=limit)
    for f in faelle:
        out.append({"zeit": _iso(f.gemeldet_am or f.creation), "art": "servicefall", "doctype": "PH Servicefall", "name": f.name, "titel": f.titel, "text": _("Servicefall gemeldet ({0}) · {1}").format(_(f.art), _(f.status)), "app": APP})
    if faelle:
        for v in frappe.get_all("PH Servicefall Verlauf", filters={"parenttype": "PH Servicefall", "parent": ("in", [f.name for f in faelle]), "ereignis": ("in", ["Status", "Kommunikation", "Einsatz", "Kulanz"])}, fields=["parent", "zeit", "ereignis", "hinweis"], order_by="zeit desc", limit=limit * 3):
            out.append({"zeit": _iso(v.zeit), "art": f"servicefall_{v.ereignis.lower()}", "doctype": "PH Servicefall", "name": v.parent, "titel": v.parent, "text": v.hinweis, "app": APP})
    for e in frappe.get_all("PH Serviceeinsatz", filters={"kontakt": kontakt}, fields=["name", "titel", "status", "datum", "zeit_von", "art"], order_by="datum desc", limit=limit):
        zeit = get_datetime(f"{e.datum} {e.zeit_von or '08:00:00'}") if e.datum else None
        out.append({"zeit": _iso(zeit), "art": "serviceeinsatz", "doctype": "PH Serviceeinsatz", "name": e.name, "titel": e.titel, "text": _("Serviceeinsatz {0} · {1}").format(_(e.art), _(e.status)), "app": APP})
    for a in frappe.get_all("PH Pflege Abo", filters={"kontakt": kontakt}, fields=["name", "titel", "status", "creation", "art"], limit=limit):
        out.append({"zeit": _iso(a.creation), "art": "pflegevertrag", "doctype": "PH Pflege Abo", "name": a.name, "titel": a.titel, "text": _("{0} · {1}").format(_(a.art), _(a.status)), "app": APP})
    for s in frappe.get_all("PH Serviceauftrag", filters={"kontakt": kontakt}, fields=["name", "titel", "status", "creation", "art"], limit=limit):
        out.append({"zeit": _iso(s.creation), "art": "serviceauftrag", "doctype": "PH Serviceauftrag", "name": s.name, "titel": s.titel, "text": _("Serviceauftrag {0} · {1}").format(_(s.art), _(s.status)), "app": APP})
    out = [z for z in out if z["zeit"] and (not grenze or get_datetime(z["zeit"]) < grenze)]
    out.sort(key=lambda z: z["zeit"], reverse=True)
    return out[:limit]


# ── Auskunft (Art. 15 DSGVO) ────────────────────────────────────────────────


def datenauskunft(kontakt):
    out = []
    for dt in _dts():
        for name in frappe.get_all(dt, filters={"kontakt": kontakt}, pluck="name"):
            doc = frappe.get_doc(dt, name)
            daten = doc.as_dict(no_default_fields=True, convert_dates_to_str=True)
            # Kindtabellen bleiben enthalten (Verlauf, Fotos als Dateiverweise, Protokolle)
            out.append({"abschnitt": _("Service: {0}").format(_(dt)), "doctype": dt, "name": name, "daten": daten})
    return out


# ── Löschen/Anonymisieren (Art. 17 DSGVO mit Ausnahmen Abs 3) ───────────────


def _plan(kontakt):
    plan = []
    heute = getdate()
    fall_aktion = {}
    for f in frappe.get_all("PH Servicefall", filters={"kontakt": kontakt}, fields=["name", "status", "verjaehrung_bis", "garantie_bis", "lieferung_an_haendler"]):
        regress_offen = bool(frappe.db.exists("PH Lieferantenregress", {"servicefall": f.name, "status": ("in", ["Offen", "Gemeldet", "Anerkannt"])}))
        absolut = fr.monate_dazu(getdate(f.lieferung_an_haendler), fr.REGRESS_ABSOLUT_JAHRE * 12) if f.lieferung_an_haendler else None
        aktion, grund, frist = auf.servicefall(f.status, f.verjaehrung_bis, f.garantie_bis, absolut, regress_offen, heute)
        fall_aktion[f.name] = aktion
        plan.append({"doctype": "PH Servicefall", "name": f.name, "aktion": aktion, "grund": grund, "frist_bis": str(frist) if frist else None})
    for e in frappe.get_all("PH Serviceeinsatz", filters={"kontakt": kontakt}, fields=["name", "status", "servicefall"]):
        aktion, grund, frist = auf.einsatz(e.status, fall_aktion.get(e.servicefall))
        plan.append({"doctype": "PH Serviceeinsatz", "name": e.name, "aktion": aktion, "grund": grund, "frist_bis": None})
    for dt in ("PH Pflege Abo", "PH Serviceauftrag"):
        for r in frappe.get_all(dt, filters={"kontakt": kontakt}, fields=["name", "status"]):
            status = "Aktiv" if dt == "PH Serviceauftrag" and r.status not in ("Abgerechnet", "Storniert", "Zurueckgebracht") else r.status
            aktion, grund, frist = auf.vertrag(status)
            plan.append({"doctype": dt, "name": r.name, "aktion": aktion, "grund": grund, "frist_bis": None})
    return plan


def _fotos_loeschen(dt, name):
    tabelle = FOTO_TABELLEN.get(dt)
    if not tabelle:
        return
    for url in frappe.get_all(tabelle, filters={"parent": name, "parenttype": dt}, pluck="bild"):
        for fid in frappe.get_all("File", filters={"file_url": url}, pluck="name") if url else []:
            frappe.delete_doc("File", fid, ignore_permissions=True, force=True)
    frappe.db.delete(tabelle, {"parent": name, "parenttype": dt})


def anonymisieren(kontakt, ausfuehren=False):
    """Plan (ausfuehren=False) oder Ausführung: anonymisiert nur Datensätze mit Aktion „anonymisieren“;
    „aufbewahren“ bleibt unverändert und wird mit Frist gemeldet (ph_crm plant die Wiedervorlage)."""
    plan = _plan(kontakt)
    if not int(ausfuehren or 0):
        return plan
    for p in plan:
        if p["aktion"] != auf.ANONYMISIEREN:
            continue
        try:
            felder = {k: v for k, v in FELDER_ANONYM[p["doctype"]].items() if frappe.get_meta(p["doctype"]).has_field(k)}
            frappe.db.set_value(p["doctype"], p["name"], felder, update_modified=False)
            _fotos_loeschen(p["doctype"], p["name"])
            frappe.db.delete("Version", {"ref_doctype": p["doctype"], "docname": p["name"]})  # alte Werte stehen in Versionen
            frappe.get_doc(p["doctype"], p["name"]).add_comment("Info", _("Personendaten anonymisiert (DSGVO Art. 17)"))
        except Exception:  # noqa: BLE001
            frappe.log_error(title=f"ph_service.anonymisieren {p['doctype']} {p['name']}")
            p["aktion"] = "fehler"
    return plan


# ── Zusammenführen ──────────────────────────────────────────────────────────


def zusammengefuehrt(alt, neu):
    """Dublette alt → neu: alle Service-Datensätze auf den verbleibenden Kontakt umhängen."""
    for dt in _dts():
        for name in frappe.get_all(dt, filters={"kontakt": alt}, pluck="name"):
            try:
                frappe.db.set_value(dt, name, "kontakt", neu, update_modified=False)
                frappe.get_doc(dt, name).add_comment("Info", _("Kontakt {0} mit {1} zusammengeführt").format(alt, neu))
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"ph_service.zusammengefuehrt {dt} {name}")
