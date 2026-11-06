"""Erstinstallation ph_kundenkarte: Stufen, Vorteilskatalog, Zuordnung, Einstellungen. Idempotent, ohne Personendaten.

Schwellen der Stufen Plus/Privé sind Platzhalter (Inhaber-Entscheidung offen, README „Offene Punkte“);
die Startstufe hat Schwelle 0. Alle Texte: Sie-Form, Leistungen statt Rabatte, keine Superlative.
"""

import frappe

# stufenname, reihenfolge, schwelle_cent, farbe, beschreibung_kunde, beschreibung_intern
STUFEN = [
    ("Platzhirsch", 1, 0, "#30373e", "Ihre Kundenkarte: persönliche Beratung, Einladungen zu Abenden im Showroom und ein Gruß zum Geburtstag.", "Startstufe für alle Karten."),
    ("Platzhirsch Plus", 2, 1_000_000, "#8a7a66", "Zusätzlich zur Kundenkarte: Lieferung im Liefergebiet und verlängerte Umtauschfrist für Lagerware.", "Schwelle 10.000 € im Bewertungszeitraum – Platzhalter, Inhaber-Entscheidung offen."),
    ("Platzhirsch Privé", 3, 5_000_000, "#1d4ed8", "Zusätzlich zu Platzhirsch Plus: Montage durch unser Team und ein Pflegetermin im Jahr.", "Schwelle 50.000 € im Bewertungszeitraum – Platzhalter, Inhaber-Entscheidung offen."),
]

# schluessel, titel, art, einloesbar_pro_jahr, gilt_ab_stufe, beschreibung_kunde, beschreibung_intern, reihenfolge
VORTEILE = [
    ("beratung", "Persönliche Beratung", "Persoenlich", 0, "Platzhirsch", "Eine feste Ansprechperson begleitet Sie bei Planung, Auswahl und Service.", "Berater an der Karte; keine Einlösung nötig, nur Zuordnung.", 10),
    ("events", "Vorab-Zugang zu Abenden im Showroom", "Event", 0, "Platzhirsch", "Sie erhalten Einladungen zu Veranstaltungen und zum Adventsabend vor der allgemeinen Ankündigung – sofern Sie Einladungen zugestimmt haben.", "Versand nur mit Einwilligung „einladungen“ (ph_marketing). Einlösung: Anmeldung über PH Event.", 20),
    ("geburtstag", "Gruß zum Geburtstag", "Persoenlich", 1, "Platzhirsch", "Zu Ihrem Geburtstag melden wir uns persönlich – wenn Sie uns das Datum freiwillig nennen.", "Scheduler legt am Geburtstag eine PH Aufgabe für den Berater an; keine automatische Mail.", 30),
    ("lieferung", "Lieferung im Liefergebiet", "Lieferung", 0, "Platzhirsch Plus", "Wir liefern Ihre Bestellung im Liefergebiet des Studios ohne gesonderte Lieferpauschale.", "Einlösung mit Bezug PH Bestellung oder PH Rechnung; Liefergebiet laut ph_logistik.", 40),
    ("umtausch", "Verlängerte Umtauschfrist", "Service", 0, "Platzhirsch Plus", "Für Lagerware verlängert sich die Frist für Umtausch oder Gutschrift.", "Frist laut Teilnahmebedingungen (Kanzlei-Freigabe). Einlösung mit Bezug PH Kassenbeleg/PH Rechnung.", 50),
    ("montage", "Montage durch unser Team", "Montage", 0, "Platzhirsch Privé", "Aufbau und Einrichtung durch unser Montageteam sind Teil Ihrer Lieferung.", "Einlösung mit Bezug PH Rechnung/PH Bestellung; Montageauftrag in ph_projekte.", 60),
    ("pflege", "Pflegetermin im Jahr", "Pflege", 1, "Platzhirsch Privé", "Einmal im Jahr pflegen wir Leder, Stoff, Holz oder Stein bei Ihnen zu Hause.", "Einlösung mit Bezug PH Pflege Abo oder PH Serviceauftrag (ph_service); 1 je Kalenderjahr.", 70),
]

ZUORDNUNG = {
    "Platzhirsch": ["beratung", "events", "geburtstag"],
    "Platzhirsch Plus": ["lieferung", "umtausch"],
    "Platzhirsch Privé": ["montage", "pflege"],
}

TEXT_BEGRUESSUNG = (
    "<p>Herzlich willkommen,</p><p>mit Ihrer Platzhirsch Kundenkarte erhalten Sie persönliche Beratung, Einladungen zu "
    "Abenden im Showroom und – je nach Stufe – Leistungen rund um Lieferung, Montage und Pflege. Die Karte ist "
    "personengebunden und hat keinen Geldwert.</p><p>Wir freuen uns auf Ihren nächsten Besuch in Lochau.</p>"
)


def after_install():
    stufen_anlegen()
    vorteile_anlegen()
    zuordnen()
    einstellungen_anlegen()
    frappe.db.commit()


def stufen_anlegen():
    for name, reihe, schwelle, farbe, kunde, intern in STUFEN:
        if frappe.db.exists("PH Kundenkarte Stufe", name):
            continue
        frappe.get_doc({"doctype": "PH Kundenkarte Stufe", "stufenname": name, "reihenfolge": reihe, "schwelle_jahresumsatz_cent": schwelle, "farbe": farbe, "beschreibung_kunde": kunde, "beschreibung_intern": intern, "aktiv": 1}).insert(ignore_permissions=True)


def _vorteil_name(titel):
    return frappe.db.get_value("PH Kundenkarte Vorteil", {"titel": titel}, "name")


def vorteile_anlegen():
    for _schluessel, titel, art, limit, ab, kunde, intern, reihe in VORTEILE:
        if _vorteil_name(titel):
            continue
        frappe.get_doc(
            {
                "doctype": "PH Kundenkarte Vorteil",
                "titel": titel,
                "art": art,
                "einloesbar_pro_jahr": limit,
                "gilt_ab_stufe": ab if frappe.db.exists("PH Kundenkarte Stufe", ab) else None,
                "beschreibung_kunde": kunde,
                "beschreibung_intern": intern,
                "reihenfolge": reihe,
                "aktiv": 1,
                "quelle": "install",
            }
        ).insert(ignore_permissions=True)


def zuordnen():
    titel_je_schluessel = {v[0]: v[1] for v in VORTEILE}
    for stufe, schluessel in ZUORDNUNG.items():
        if not frappe.db.exists("PH Kundenkarte Stufe", stufe):
            continue
        doc = frappe.get_doc("PH Kundenkarte Stufe", stufe)
        vorhanden = {z.vorteil for z in doc.vorteile}
        geaendert = False
        for s in schluessel:
            name = _vorteil_name(titel_je_schluessel[s])
            if name and name not in vorhanden:
                doc.append("vorteile", {"vorteil": name})
                geaendert = True
        if geaendert:
            doc.flags.ignore_permissions = True
            doc.save()


def einstellungen_anlegen():
    doc = frappe.get_single("PH Kundenkarte Einstellungen")
    if not doc.startstufe and frappe.db.exists("PH Kundenkarte Stufe", "Platzhirsch"):
        doc.startstufe = "Platzhirsch"
    if not doc.text_begruessung:
        doc.text_begruessung = TEXT_BEGRUESSUNG
    doc.save(ignore_permissions=True)
