"""Projektnachkalkulation für das Backoffice (Desk-Token, nur Leitung/Geschäftsführung).

  projekt_kalkulation_v2(projekt)                → {projekt, kopf, erloes, stufen_ist, stufen_prognose, stufen_budget,
                                                    kostenarten[], summe, fertigstellung, parameter, zeitreihe[] (je Woche
                                                    Ist/Obligo/kumuliert), quellen[] (Belege mit link), erloes_quellen[],
                                                    hinweise[], stichtag, eingerichtet}
  kalkulation_einstellungen()                    → {kostensaetze[], ziel_db[], gemeinkosten[], schwellen{}, projektarten[],
                                                    taetigkeiten[], zuschlag_arten[], kostenarten[], eingerichtet}
  kalkulation_einstellungen_speichern(kostensaetze?, ziel_db?, gemeinkosten?, schwellen?, begruendung?)
                                                 → wie kalkulation_einstellungen(); nur übergebene Teile werden ersetzt;
                                                    Validierung: keine doppelten Gültigkeiten, Prozente 0–100, gelb ≤ rot.
Beträge in Cent, Prozente als Zahl (35.0 = 35 %). Jede Änderung → PH Kalkulation Protokoll.
"""

import frappe
from frappe import _
from frappe.utils import cint

from ph_projekte.ph_projekte import nachkalkulation as nk
from ph_projekte.utils import kalkulation as kalk

SCHREIBEN = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"}
SCHWELLEN = ("budget_gelb_prozent", "budget_rot_prozent", "ampel_gelb_unter", "ampel_rot_unter", "abweichung_kommentar_prozent",
             "kalkulation_warnung_aktiv", "budget_bei_auftrag_vorbelegen")
SPALTEN = {
    "kostensaetze": ("taetigkeit", "rolle", "mitarbeiter", "satz_cent", "gueltig_ab", "platzhalter", "notiz"),
    "ziel_db": ("projektart", "ziel_db1", "ziel_db2", "ziel_db3", "ampel_gelb_unter", "ampel_rot_unter", "budget_gelb", "budget_rot", "gueltig_ab", "notiz"),
    "gemeinkosten_regeln": ("projektart", "art", "prozent", "betrag_je_stunde_cent", "gueltig_ab", "notiz"),
}


@frappe.whitelist()
def projekt_kalkulation_v2(projekt):
    nk.pruefe_leitung()
    doc = frappe.get_doc("PH Projekt", projekt)
    doc.check_permission("read")
    r = nk.berechnen(doc)
    nk.cache_schreiben(doc.name, r)
    return r


def _zeilen(doc, feld):
    return [{k: z.get(k) for k in SPALTEN[feld]} for z in doc.get(feld) or []]


@frappe.whitelist()
def kalkulation_einstellungen():
    nk.pruefe_leitung()
    e = frappe.get_single("PH Projekte Einstellungen")
    taet = (frappe.get_meta("PH Kostensatz").get_field("taetigkeit").options or "").split("\n")
    return {
        "kostensaetze": _zeilen(e, "kostensaetze"), "ziel_db": _zeilen(e, "ziel_db"), "gemeinkosten": _zeilen(e, "gemeinkosten_regeln"),
        "schwellen": {f: e.get(f) for f in SCHWELLEN}, "projektarten": ["Alle"] + nk.projektarten(), "taetigkeiten": [t for t in taet if t],
        "zuschlag_arten": list(kalk.ZUSCHLAG_ARTEN), "kostenarten": frappe.get_all("PH Kostenart", fields=["name", "bezeichnung", "db_stufe", "reihenfolge", "aktiv"], order_by="reihenfolge asc"),
        "eingerichtet": bool(nk.eingerichtet(e)),
    }


@frappe.whitelist(methods=["POST"])
def kalkulation_einstellungen_speichern(kostensaetze=None, ziel_db=None, gemeinkosten=None, schwellen=None, begruendung=None):
    if not SCHREIBEN & set(frappe.get_roles()):
        frappe.throw(_("Kalkulationseinstellungen pflegen nur Leitung und Geschäftsführung."), frappe.PermissionError)
    e = frappe.get_single("PH Projekte Einstellungen")
    teile = {"kostensaetze": kostensaetze, "ziel_db": ziel_db, "gemeinkosten_regeln": gemeinkosten}
    for feld, zeilen in teile.items():
        if zeilen is None:
            continue
        zeilen = frappe.parse_json(zeilen) if isinstance(zeilen, str) else zeilen
        if not isinstance(zeilen, list):
            frappe.throw(_("{0}: Liste erwartet.").format(feld))
        e.set(feld, [{k: z.get(k) for k in SPALTEN[feld] if k in z} for z in zeilen])
    if schwellen is not None:
        schwellen = frappe.parse_json(schwellen) if isinstance(schwellen, str) else schwellen
        for k, v in (schwellen or {}).items():
            if k not in SCHWELLEN:
                frappe.throw(_("Unbekannte Einstellung {0}.").format(k))
            e.set(k, cint(v) if k in ("kalkulation_warnung_aktiv", "budget_bei_auftrag_vorbelegen") else v)
    # Prüfung vorab (gleiche Regeln wie validate), damit die API eine klare Fehlerliste liefert
    fehler = kalk.einstellungen_pruefen(e.kostensaetze, e.ziel_db, e.gemeinkosten_regeln, nk.projektarten())
    if fehler:
        frappe.throw("<br>".join(frappe.utils.escape_html(x) for x in fehler), title=_("Kalkulation: Einstellungen prüfen"))
    e.flags.kalk_begruendung = begruendung
    e.save(ignore_permissions=True)
    return kalkulation_einstellungen()
