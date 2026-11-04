"""Erstinstallation von ph_crm: Terminarten (Website types.js / Spec B7), Studio-Öffnungszeiten,
österreichische Feiertage, Mail-Vorlagen-Zuordnung. Idempotent, keine Personendaten, keine Geheimnisse."""

import frappe

# Quelle: src/lib/booking/types.js TERMINARTEN + Spec B7 (planung mit Themen und zwei Modi)
TERMINARTEN = [
    {"key": "studio", "titel_de": "Beratung im Studio", "titel_en": "Consultation at the studio", "titel_fr": "Conseil au studio", "titel_it": "Consulenza in studio", "modus": "Showroom", "dauer_min": 60, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 10, "hinweis_kunde": "Wir empfangen Sie mit einem Kaffee aus unserem Café in Lochau, Landstraße 11."},
    {"key": "video", "titel_de": "Videoberatung", "titel_en": "Video consultation", "titel_fr": "Conseil en visio", "titel_it": "Consulenza video", "modus": "Video", "dauer_min": 45, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 20, "hinweis_kunde": "Den Zugangslink erhalten Sie 15 Minuten vor Beginn. Alternativ rufen wir Sie an."},
    {"key": "vor_ort", "titel_de": "Beratung bei Ihnen vor Ort", "titel_en": "Consultation at your home", "titel_fr": "Conseil à domicile", "titel_it": "Consulenza a domicilio", "modus": "Vor Ort", "dauer_min": 90, "puffer_min": 60, "anfahrt_min": 60, "bestaetigung": "manuell", "feste_startzeiten": "10:00,14:00", "wochentage": "1,2,3,4", "sortierung": 30, "hinweis_kunde": "Unser Team bestätigt Termin und Anfahrt persönlich."},
    {"key": "planung", "titel_de": "Planungstermin", "titel_en": "Planning session", "titel_fr": "Rendez-vous de planification", "titel_it": "Appuntamento di progettazione", "modus": "", "modi_erlaubt": "Showroom,Video", "themen": "kueche,wohnen,ezarri,licht,yacht,hotel", "dauer_min": 90, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 40},
]

# Quelle: src/lib/site.js OPENING_HOURS (Di–Fr 10–18, Sa 10–14; So/Mo geschlossen)
OEFFNUNGSZEITEN = [("1 Dienstag", "10:00:00", "18:00:00"), ("2 Mittwoch", "10:00:00", "18:00:00"), ("3 Donnerstag", "10:00:00", "18:00:00"), ("4 Freitag", "10:00:00", "18:00:00"), ("5 Samstag", "10:00:00", "14:00:00")]


def after_install():
    terminarten_anlegen()
    einstellungen_anlegen()
    frappe.db.commit()


def terminarten_anlegen():
    for t in TERMINARTEN:
        if frappe.db.exists("PH Terminart", t["key"]):
            continue
        doc = frappe.get_doc({"doctype": "PH Terminart", "aktiv": 1, "website_sichtbar": 1, "vorlauf_stunden": 24, "max_tage_voraus": 60, **t})
        doc.insert(ignore_permissions=True)


def einstellungen_anlegen():
    from datetime import date

    doc = frappe.get_single("PH Termin Einstellungen")
    if not doc.oeffnungszeiten:
        for wochentag, von, bis in OEFFNUNGSZEITEN:
            doc.append("oeffnungszeiten", {"wochentag": wochentag, "von": von, "bis": bis})
    if not doc.feiertage:
        jahr = date.today().year
        _feiertage_anhaengen(doc, jahr)
        _feiertage_anhaengen(doc, jahr + 1)
    for feld, vorlage in (("vorlage_bestaetigung", "PH Termin Bestätigung"), ("vorlage_absage", "PH Termin Absage"), ("vorlage_erinnerung", "PH Termin Erinnerung")):
        if not doc.get(feld) and frappe.db.exists("Email Template", vorlage):
            doc.set(feld, vorlage)
    doc.save(ignore_permissions=True)


def _feiertage_anhaengen(doc, jahr):
    from ph_crm.utils.feiertage import feiertage_at

    vorhanden = {str(z.datum) for z in doc.feiertage}
    n = 0
    for tag, name in sorted(feiertage_at(jahr).items()):
        if str(tag) in vorhanden:
            continue
        doc.append("feiertage", {"datum": tag, "bezeichnung": name, "art": "Feiertag"})
        n += 1
    return n


@frappe.whitelist()
def feiertage_ergaenzen(jahr):
    """Button in PH Termin Einstellungen: Feiertage eines Jahres nachtragen."""
    frappe.only_for(("System Manager", "PH CRM Leitung", "PH Backoffice-Admin"))
    doc = frappe.get_single("PH Termin Einstellungen")
    n = _feiertage_anhaengen(doc, int(jahr))
    doc.save()
    return n
