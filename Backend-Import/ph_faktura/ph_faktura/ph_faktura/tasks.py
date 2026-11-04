"""Scheduler-Funktionen (hooks.scheduler_events, Europe/Vienna). Idempotent, Fehler nur protokolliert."""

import frappe
from frappe import _
from frappe.utils import add_days, cint, getdate, now_datetime, nowdate

from ph_faktura import einstellungen
from ph_faktura.rechenwerk import mahnen as M


def ueberfaellig_pruefen():
    """Täglich 06:00: Gestellt/Teilbezahlt mit Fälligkeit < heute → Ueberfaellig."""
    from ph_faktura.ph_faktura.doctype.ph_rechnung.ph_rechnung import ueberfaellig_setzen

    try:
        n = ueberfaellig_setzen()
        frappe.db.commit()
        return n
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_faktura.tasks.ueberfaellig_pruefen")


def angebote_ablaufen():
    from ph_faktura.ph_faktura.doctype.ph_angebot.ph_angebot import angebote_ablaufen_lassen

    try:
        n = angebote_ablaufen_lassen()
        frappe.db.commit()
        return n
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_faktura.tasks.angebote_ablaufen")


def mahnlauf_automatisch():
    """Mo–Fr 06:30, nur wenn PH Mahnwesen Einstellungen.automatisch gesetzt ist."""
    einst = einstellungen.mahnwesen()
    if not einst.get("aktiv") or not einst.get("automatisch"):
        return []
    return mahnlauf()


def mahnlauf(stichtag=None, nur_vorschlag=False):
    """Mahnlauf: überfällige Rechnungen → nächste Mahnstufe (Entwurf oder gesendet laut Einstellung).
    → Liste {rechnung, stufe, offen_cent, mahnung}"""
    einst = einstellungen.mahnwesen()
    if not einst.get("aktiv"):
        return []
    stichtag = getdate(stichtag or nowdate())
    lauf = now_datetime().strftime("%Y-%m-%d %H:%M")
    ergebnis = []
    rows = frappe.get_all("PH Rechnung", filters={"docstatus": 1, "offen_cent": (">", cint(einst.get("mindestbetrag_cent") or 0)), "status": ("in", ("Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt")), "mahnsperre": 0, "faellig": ("<", stichtag)},
                          fields=["name", "faellig", "offen_cent", "mahnstufe", "letzte_mahnung", "kontakt"])
    for r in rows:
        tage = M.verzugstage(getdate(r.faellig), stichtag, cint(einst.get("karenz_tage") or 0))
        seit = (stichtag - getdate(r.letzte_mahnung)).days if r.letzte_mahnung else None
        stufe = M.stufe_bestimmen(tage, einst, letzte_stufe=cint(r.mahnstufe), tage_seit_letzter=seit)
        if not stufe:
            continue
        if frappe.db.exists("PH Mahnung", {"rechnung": r.name, "stufe": stufe, "status": ("in", ("Entwurf", "Gesendet"))}):
            continue
        eintrag = {"rechnung": r.name, "stufe": stufe, "offen_cent": r.offen_cent, "verzugstage": tage, "mahnung": None}
        if not nur_vorschlag:
            try:
                ma = frappe.get_doc({"doctype": "PH Mahnung", "rechnung": r.name, "stufe": stufe, "datum": stichtag, "mahnlauf": lauf}).insert(ignore_permissions=True)
                eintrag["mahnung"] = ma.name
                if not einst.get("entwurf_statt_senden"):
                    email = None
                    if r.kontakt and frappe.db.exists("DocType", "PH Kontakt"):
                        email = frappe.db.get_value("PH Kontakt", r.kontakt, "email")
                    if email:
                        ma.senden(email)
                frappe.db.commit()
            except Exception:  # noqa: BLE001
                frappe.db.rollback()
                frappe.log_error(title=f"ph_faktura.tasks.mahnlauf {r.name}")
        ergebnis.append(eintrag)
    return ergebnis


def oss_schwelle_pruefen():
    """Montags: EU-Fernverkäufe (B2C, Land ≠ AT, EU) im Kalenderjahr summieren; Warnung ab 80 % der Lieferschwelle."""
    from ph_faktura.rechenwerk.steuer import EU_LAENDER

    e = einstellungen.faktura()
    jahr = getdate(nowdate()).year
    rows = frappe.get_all("PH Rechnung", filters={"docstatus": 1, "status": ("!=", "Storniert"), "datum": ("between", [f"{jahr}-01-01", f"{jahr}-12-31"]), "land": ("!=", "AT"), "uid_empfaenger": ("in", ("", None))}, fields=["land", "netto_cent"])
    summe = sum(cint(r.netto_cent) for r in rows if r.land in EU_LAENDER)
    frappe.db.set_single_value("PH Faktura Einstellungen", "fernverkaeufe_eu_laufend_cent", summe)
    einstellungen.cache_leeren()
    schwelle = cint(e.get("lieferschwelle_eu_netto_cent") or 1000000)
    if not e.get("oss_aktiv") and summe >= schwelle * 0.8:
        _aufgabe(_("OSS-Lieferschwelle: EU-Fernverkäufe {0} € von {1} € erreicht – OSS-Registrierung prüfen (Steuerberater).").format(summe / 100, schwelle / 100))
    frappe.db.commit()
    return summe


def uva_entwurf_monat():
    """Am 1. des Monats: UVA-Auswertung für den Vormonat anlegen und berechnen."""
    heute = getdate(nowdate())
    vormonat = add_days(heute.replace(day=1), -1)
    if frappe.db.exists("PH UVA Auswertung", {"zeitraum_art": "Monat", "jahr": vormonat.year, "periode": vormonat.month}):
        return
    try:
        uva = frappe.get_doc({"doctype": "PH UVA Auswertung", "zeitraum_art": "Monat", "jahr": vormonat.year, "periode": vormonat.month}).insert(ignore_permissions=True)
        uva.berechnen()
        frappe.db.commit()
        return uva.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_faktura.tasks.uva_entwurf_monat")


def export_erinnerung():
    """Am 5.: offene (nicht exportierte) Belege des Vormonats → Aufgabe an die Buchhaltung."""
    heute = getdate(nowdate())
    vormonat_ende = add_days(heute.replace(day=1), -1)
    n = frappe.db.count("PH Rechnung", {"docstatus": 1, "export_status": "offen", "datum": ("<=", vormonat_ende)})
    n += frappe.db.count("PH Gutschrift", {"docstatus": 1, "export_status": "offen", "datum": ("<=", vormonat_ende)})
    n += frappe.db.count("PH Eingangsrechnung", {"status": ("in", ("Freigegeben", "Bezahlt")), "export_status": "offen", "datum": ("<=", vormonat_ende)})
    if n:
        _aufgabe(_("Export Steuerberater: {0} Belege bis {1} noch nicht übergeben (PH Export Lauf).").format(n, frappe.utils.formatdate(vormonat_ende)))
        frappe.db.commit()
    return n


def _aufgabe(text):
    try:
        frappe.get_doc({"doctype": "ToDo", "description": text, "reference_type": "PH Faktura Einstellungen", "reference_name": "PH Faktura Einstellungen", "priority": "High", "assigned_by": "Administrator"}).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_faktura.tasks: Aufgabe")
