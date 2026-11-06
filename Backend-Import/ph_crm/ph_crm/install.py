"""Erstinstallation von ph_crm: Terminarten (Website types.js / Spec B7), Studio-Öffnungszeiten,
österreichische Feiertage, Mail-Vorlagen-Zuordnung. Idempotent, keine Personendaten, keine Geheimnisse."""

import frappe

from ph_crm.utils.terminarten import TERMINARTEN  # noqa: E402 – Daten ohne Frappe (Test gegen types.js)

# Quelle: src/lib/site.js OPENING_HOURS (Di–Fr 10–18, Sa 10–14; So/Mo geschlossen)
OEFFNUNGSZEITEN = [("1 Dienstag", "10:00:00", "18:00:00"), ("2 Mittwoch", "10:00:00", "18:00:00"), ("3 Donnerstag", "10:00:00", "18:00:00"), ("4 Freitag", "10:00:00", "18:00:00"), ("5 Samstag", "10:00:00", "14:00:00")]


# Gesprächsleitfäden je Raumtyp (Konzept CRM §3.4, 30-marktfunktionen.md: strukturierte Bedarfsanalyse)
BERATUNGSVORLAGEN = {
    "Küche": ("Kueche", None, [
        ("Wer kocht wie oft, wie viele Personen im Haushalt?", 1), ("Grundriss/Maße vorhanden? (Plan, Foto, Aufmaß nötig)", 1),
        ("Wasser-, Strom-, Abluftanschlüsse: Lage, Umbau möglich?", 1), ("Insel/Halbinsel/Zeile – Sitzplätze gewünscht?", 0),
        ("Geräte: Marken, Induktion/Kochfeldabzug, Dampfgarer, Kühlschrank-Breite", 0), ("Fronten/Arbeitsplatte: Material, Farbe, Pflegeaufwand", 0),
        ("Stauraum: Vorrat, Hochschrank, Müllsystem", 0), ("Altküche: Abbau/Entsorgung durch uns?", 0), ("Liefer-/Montagetermin, Baufortschritt", 1),
    ]),
    "Wohnen": ("Wohnen", None, [
        ("Raummaße, Fenster/Türen, Heizkörper, Fußboden", 1), ("Sitzgewohnheiten: Liegen, Gäste, Haustiere, Kinder", 0),
        ("Sofa: Breite/Tiefe, Bezug (Stoff/Leder), Farbe, Sitzhärte", 0), ("Medienwand/TV-Größe, Lautsprecher, Kabelführung", 0),
        ("Licht: Grund-, Akzent-, Leselicht, Steuerung", 0), ("Teppich, Vorhänge, Accessoires gewünscht?", 0), ("Lieferweg: Stockwerk, Lift, Treppenbreite", 1),
    ]),
    "Schlafen": ("Schlafen", None, [
        ("Bettmaß, Liegehöhe, Matratze (Härte, Allergien)", 1), ("Schrank: Breite/Höhe, Dachschräge, Innenausstattung", 0),
        ("Nachttische, Leselicht, Steckdosen", 0), ("Verdunkelung, Akustik", 0),
    ]),
    "Bad": ("Bad", None, [
        ("Grundriss, Anschlüsse, Fenster, Lüftung", 1), ("Dusche/Wanne, bodeneben, Armaturen-Oberfläche", 0),
        ("Waschtisch: Einzel/Doppel, Unterschrank, Spiegelschrank, Licht", 0), ("Feuchtraum-geeignete Materialien, Pflege", 1), ("Barrierefreiheit gewünscht?", 0),
    ]),
    "Outdoor und Pool": ("Outdoor", None, [
        ("Fläche, Untergrund, Ausrichtung/Sonne, Wind", 1), ("Nutzung: Essen, Lounge, Sonnenliegen, Anzahl Personen", 0),
        ("Materialien wetterfest, Winterlager/Schutzhüllen", 1), ("Pool (Ezarri): Becken, Mosaik, Farbwelt, Bauzeitplan", 0), ("Beschattung, Licht, Heizstrahler", 0),
    ]),
    "Hotelzimmer (Objekt)": ("Hotelzimmer", "Hotel", [
        ("Anzahl Zimmer je Kategorie, Musterzimmer gewünscht?", 1), ("Brandschutz/Objektzulassung (B1, Schwerentflammbarkeit), Strapazierfähigkeit", 1),
        ("Zeitplan: Saisonpause, Eröffnung, Etappen", 1), ("Budget je Zimmer, Abrechnung je Bauabschnitt", 1), ("Ansprechpartner: Hotelier, Architekt, Bauleitung", 1),
        ("Lieferung/Montage: Zufahrt, Lager vor Ort, Entsorgung Altmöbel", 0), ("Nachkaufgarantie/Ersatzteile für Folgejahre", 0),
    ]),
}


def after_install():
    terminarten_anlegen()
    einstellungen_anlegen()
    beratungsvorlagen_anlegen()
    frappe.db.commit()


def beratungsvorlagen_anlegen():
    if not frappe.db.exists("DocType", "PH Beratungsvorlage"):
        return
    for name, (raum, objektart, fragen) in BERATUNGSVORLAGEN.items():
        if frappe.db.exists("PH Beratungsvorlage", name):
            continue
        frappe.get_doc({"doctype": "PH Beratungsvorlage", "vorlage_name": name, "aktiv": 1, "raumtyp": raum, "objektart": objektart, "fragen": [{"raum": raum, "frage": f, "pflicht": p} for f, p in fragen]}).insert(ignore_permissions=True)


def terminarten_anlegen():
    for t in TERMINARTEN:
        if frappe.db.exists("PH Terminart", t["key"]):
            # Bestand: nur leere Texte nachtragen, Desk-Pflege (Dauer, Berater, Texte) bleibt unangetastet
            leer = {f: t[f] for f in ("beschreibung", "hinweis_kunde", "titel_en", "titel_fr", "titel_it") if t.get(f) and not frappe.db.get_value("PH Terminart", t["key"], f)}
            if leer:
                frappe.db.set_value("PH Terminart", t["key"], leer, update_modified=False)
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
