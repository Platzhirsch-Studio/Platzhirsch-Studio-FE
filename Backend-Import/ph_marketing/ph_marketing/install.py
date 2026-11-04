"""Erstinstallation von ph_marketing: Standarddaten ohne Geheimnisse, idempotent (after_install, auch per bench execute).

Legt an: Interessen, Mail-Vorlagen (templates/emails/*.html), Kundenreisen aus dem Website-Generator (alle aktiv = 0,
src/lib/kundenbetreuung/reisen.js), Event „Adventsabend 2026“ (Status Geplant, Uhrzeit offen – event.js), Einstellungen.
"""

import os

import frappe

HIER = os.path.dirname(__file__)

INTERESSEN = [("Wohnen", "Living", 10), ("Küche", "Kitchen", 20), ("Outdoor", "Outdoor", 30), ("Pool & Spa", "Pool & Spa", 40), ("Licht", "Lighting", 50), ("Accessoires", "Accessories", 60), ("Events", "Events", 70), ("Yacht & Objekt", "Yacht & Contract", 80)]

# vorlage_id, betreff, preheader, art, fusszeile, rechtsgrundlage, quelle
VORLAGEN = [
    ("doi_bestaetigen", "Bitte bestätigen Sie Ihre Anmeldung", "Ein Klick, dann ist Ihre Anmeldung abgeschlossen.", "System", "S", "V/S – Double-Opt-in (transaktional)", "src/lib/kundenbetreuung/systemMails.js"),
    ("doi_erinnerung", "Ihre Anmeldung wartet noch", "Ein Klick, dann ist Ihre Anmeldung abgeschlossen.", "System", "S", "V/S – einmalige DOI-Erinnerung innerhalb der Linkgültigkeit", "ph_marketing"),
    ("event_bestaetigung", "Ihre Anmeldung: {{ event_titel }}", "Wir freuen uns auf Sie in Lochau.", "Event", "S", "Art. 6 Abs. 1 lit. b – Bestätigung der Anmeldung", "ph_marketing"),
    ("event_erinnerung", "Erinnerung: {{ event_titel }} am {{ event_datum }}", "Bis bald in Lochau.", "Event", "S", "Art. 6 Abs. 1 lit. b – Erinnerung an die eigene Anmeldung", "ph_marketing"),
    ("newsletter_basis", "{{ betreff }}", "{{ preheader }}", "Newsletter", "A", "E – Einwilligung mit DOI, Fußzeile A mit Abmeldelink", "src/lib/kundenbetreuung/newsletter/newsletter.js"),
    ("empfehlung_code", "Ihr persönlicher Empfehlungscode", "Code und Link zum Weitergeben.", "System", "S", "V/S – angefordert", "src/lib/kundenbetreuung/systemMails.js"),
    ("empfehlung_danke", "Danke für Ihre Empfehlung", "Ihr Gutschein liegt bei.", "System", "S", "V/S – Teil des Programms", "src/lib/kundenbetreuung/systemMails.js"),
    ("reise_danke", "Willkommen zuhause", "Danke und ein paar Hinweise für die ersten Wochen.", "Kundenreise", "V", "V", "email-flows.md 3.1"),
    ("reise_pflege", "So bleibt {{ produkt }} lange schön", "Unsere Pflegehinweise für Ihre Materialien, kurz zusammengefasst.", "Kundenreise", "V", "V", "email-flows.md 3.2"),
    ("reise_bewertung", "Wie wohnt es sich mit {{ produkt }}?", "Ihre ehrliche Meinung hilft anderen bei der Entscheidung.", "Kundenreise", "A", "E – Bewertungsbitte nur mit Einwilligung (Kanzlei klärt B)", "email-flows.md 3.3"),
    ("reise_outdoor", "Die Terrasse wartet", "Was Ihre Outdoor-Möbel nach dem Winter brauchen.", "Kundenreise", "je Empfänger", "B oder E – ähnliche Produkte: Outdoor-Möbel und Pflege, passend zum gekauften Outdoor-Stück", "crm-wiederkauf.md 3.6 Vorlage C"),
    ("reise_advent", "Einladung: {{ event_titel }}", "Ein Abend im Showroom und Café in Lochau.", "Kundenreise", "je Empfänger", "E oder B – B nur nach Kanzlei-Bestätigung", "email-flows.md 5.1"),
    ("reise_jahrestag", "Ein Jahr mit {{ produkt }}", "Ein kleiner Gruß aus Lochau.", "Kundenreise", "je Empfänger", "B oder E – Hinweis auf weitere Planung im eigenen Kundenportal", "crm-wiederkauf.md 3.6 Vorlage B"),
    ("reise_merkliste", "Ihre Auswahl liegt bereit", "Die Stücke, die Sie sich gemerkt haben, auf einen Blick.", "Kundenreise", "A", "E – nur mit Einwilligung", "crm-wiederkauf.md 3.1 Trigger 14, 3.5 D3"),
]

# 1:1 aus src/lib/kundenbetreuung/generate-frappe.mjs (fixtures/ph_kundenreise.json), Trigger „termin“ → „event“.
REISEN = [
    {"reise_id": "danke", "titel": "Danke nach dem Kauf", "ziel": "Beziehung, Vertrauen nach der Lieferung", "vorlage": "reise_danke", "absender": "berater", "werbung": 0, "grundlage_v": 1, "grundlage_b": 0, "grundlage_e": 0, "zweck": "", "aehnliche_produkte": "", "b_nur_mit_kanzlei": 0, "segment_outdoor": 0, "segment_pflege": 0, "einmalig": 1, "max_je_kontakt": 0, "stopp_regeln": "storniert", "quelle": "email-flows.md 3.1", "hinweis": "", "trigger": [{"ausloeser_typ": "datum", "feld": "lieferdatum", "versatz_tage": 1}]},
    {"reise_id": "pflege", "titel": "Pflegetipps nach zwei Wochen", "ziel": "Service: das Stück bleibt lange schön (Material aus dem Auftrag)", "vorlage": "reise_pflege", "absender": "berater", "werbung": 0, "grundlage_v": 1, "grundlage_b": 0, "grundlage_e": 0, "zweck": "", "aehnliche_produkte": "", "b_nur_mit_kanzlei": 0, "segment_outdoor": 0, "segment_pflege": 1, "einmalig": 1, "max_je_kontakt": 0, "stopp_regeln": "storniert, reklamation_offen_bis_erledigt", "quelle": "email-flows.md 3.2", "hinweis": "", "trigger": [{"ausloeser_typ": "datum", "feld": "lieferdatum", "versatz_tage": 14}]},
    {"reise_id": "bewertung", "titel": "Zufriedenheit und Bewertung nach sechs Wochen", "ziel": "Rückmeldung und ehrliche Google-Bewertung, an ALLE Kunden, ohne Filter und ohne Anreiz", "vorlage": "reise_bewertung", "absender": "berater", "werbung": 1, "grundlage_v": 0, "grundlage_b": 0, "grundlage_e": 1, "zweck": "rueckmeldung", "aehnliche_produkte": "", "b_nur_mit_kanzlei": 0, "segment_outdoor": 0, "segment_pflege": 0, "einmalig": 1, "max_je_kontakt": 0, "stopp_regeln": "widerspruch, ecg_liste, storniert", "quelle": "email-flows.md 3.3", "hinweis": "Keine Erinnerung, kein Anreiz, kein Mitarbeitername, nicht an das Empfehlungsprogramm koppeln (Google-Richtlinie, UWG Anh. Nr. 23b/c). Einwilligung zweck=rueckmeldung (eigenes, nicht vorangekreuztes Häkchen beim Kauf) – noch nicht gebaut; Kanzlei klärt, ob B genügt", "trigger": [{"ausloeser_typ": "datum", "feld": "lieferdatum", "versatz_tage": 42}]},
    {"reise_id": "outdoor", "titel": "Outdoor im Frühling", "ziel": "Saisonstart: Pflege nach dem Winter, Probesitzen im Garten vor dem Showroom", "vorlage": "reise_outdoor", "absender": "gastgeberin", "werbung": 1, "grundlage_v": 0, "grundlage_b": 1, "grundlage_e": 1, "zweck": "newsletter", "aehnliche_produkte": "Outdoor-Möbel und Pflege aus dem eigenen Sortiment, passend zum gekauften Outdoor-Stück", "b_nur_mit_kanzlei": 0, "segment_outdoor": 1, "segment_pflege": 0, "einmalig": 0, "max_je_kontakt": 0, "stopp_regeln": "widerspruch, ecg_liste, reklamation_offen, anfrage_offen, frequenzgrenze", "quelle": "crm-wiederkauf.md 3.6 Vorlage C", "hinweis": "", "trigger": [{"ausloeser_typ": "jaehrlich", "tag_monat": "03-10"}]},
    {"reise_id": "advent", "titel": "Einladung zum Adventsabend", "ziel": "Besuch im Showroom und Café, persönliche Begegnung", "vorlage": "reise_advent", "absender": "gastgeberin", "werbung": 1, "grundlage_v": 0, "grundlage_b": 1, "grundlage_e": 1, "zweck": "einladungen", "aehnliche_produkte": "Abend im eigenen Showroom mit dem eigenen Sortiment [Kanzlei bestätigt]", "b_nur_mit_kanzlei": 1, "segment_outdoor": 0, "segment_pflege": 0, "einmalig": 0, "max_je_kontakt": 0, "stopp_regeln": "widerspruch, ecg_liste, reklamation_offen, frequenzgrenze, bereits_angemeldet", "quelle": "email-flows.md 5.1", "hinweis": "", "trigger": [{"ausloeser_typ": "event", "event": "adventsabend-2026", "versatz_tage": -21}]},
    {"reise_id": "jahrestag", "titel": "Ein Jahr zuhause", "ziel": "Bindung: Gruß zum Jahrestag der Lieferung, Pflegehinweis, Besuch im Café", "vorlage": "reise_jahrestag", "absender": "gastgeberin", "werbung": 1, "grundlage_v": 0, "grundlage_b": 1, "grundlage_e": 1, "zweck": "newsletter", "aehnliche_produkte": "Hinweis auf eine weitere Planung im eigenen Kundenportal (eigene Leistung)", "b_nur_mit_kanzlei": 0, "segment_outdoor": 0, "segment_pflege": 0, "einmalig": 0, "max_je_kontakt": 0, "stopp_regeln": "widerspruch, ecg_liste, reklamation_offen, frequenzgrenze", "quelle": "crm-wiederkauf.md 3.6 Vorlage B", "hinweis": "", "trigger": [{"ausloeser_typ": "jahrestag", "feld": "lieferdatum"}]},
    {"reise_id": "merkliste", "titel": "Erinnerung an Merkliste oder Planer", "ziel": "Wer gemerkte Stücke oder einen Planer-Stand per Mail gesichert und eingewilligt hat, bekommt höchstens zwei Erinnerungen", "vorlage": "reise_merkliste", "absender": "gastgeberin", "werbung": 1, "grundlage_v": 0, "grundlage_b": 0, "grundlage_e": 1, "zweck": "merkliste_erinnerung", "aehnliche_produkte": "", "b_nur_mit_kanzlei": 0, "segment_outdoor": 0, "segment_pflege": 0, "einmalig": 0, "max_je_kontakt": 2, "stopp_regeln": "widerruf, anfrage_gestellt, termin_gebucht, max_2_erinnerungen", "quelle": "crm-wiederkauf.md 3.1 Trigger 14, 3.5 D3", "hinweis": "Merkliste/Planer senden zweck + textversion + quelle an PH Einwilligung (noch nicht gebaut)", "trigger": [{"ausloeser_typ": "einwilligung", "versatz_tage": 3, "zwecke": "merkliste_erinnerung,planer_erinnerung"}, {"ausloeser_typ": "einwilligung", "versatz_tage": 14, "zwecke": "merkliste_erinnerung,planer_erinnerung"}]},
]

# src/app/[locale]/adventsabend/event.js – Uhrzeit, Programm, Kapazität offen beim Inhaber: nichts schätzen.
EVENT = {"event_id": "adventsabend-2026", "titel": "Adventsabend im Showroom", "datum": "2026-11-26", "art": "Abend im Showroom", "ort": "Showroom und Café, Landstraße 11, 6911 Lochau", "url": "https://platzhirsch.studio/de/adventsabend", "status": "Geplant", "kostenlos": 1, "loeschfrist_monate": 3, "einwilligung_textversion": "event-2026-10", "beschreibung": "Showroom und Café im Advent. Uhrzeit, Programm und Plätze erst nach Bestätigung des Inhabers eintragen (event.js startTime/capacity)."}


def after_install():
    interessen_anlegen()
    vorlagen_anlegen()
    event_anlegen()
    reisen_anlegen()
    einstellungen_anlegen()
    frappe.db.commit()


def interessen_anlegen():
    for name, en, sort in INTERESSEN:
        if not frappe.db.exists("PH Interesse", name):
            frappe.get_doc({"doctype": "PH Interesse", "interesse": name, "label_en": en, "sortierung": sort, "aktiv": 1}).insert(ignore_permissions=True)


def vorlage_html(vorlage_id):
    pfad = os.path.join(HIER, "templates", "emails", f"{vorlage_id}.html")
    with open(pfad, encoding="utf-8") as fh:
        return fh.read()


def vorlagen_anlegen(ueberschreiben=False):
    for vid, betreff, pre, art, fuss, recht, quelle in VORLAGEN:
        werte = {"doctype": "PH Mail Vorlage", "vorlage_id": vid, "betreff": betreff, "preheader": pre, "art": art, "sprache": "de", "fusszeile": fuss, "rechtsgrundlage": recht, "quelle": quelle, "stand": "2026-11-04", "html": vorlage_html(vid)}
        if frappe.db.exists("PH Mail Vorlage", vid):
            if ueberschreiben:
                doc = frappe.get_doc("PH Mail Vorlage", vid)
                doc.update(werte)
                doc.save(ignore_permissions=True)
            continue
        frappe.get_doc(werte).insert(ignore_permissions=True)


def event_anlegen():
    if frappe.db.exists("PH Event", EVENT["event_id"]):
        return
    doc = frappe.get_doc({"doctype": "PH Event", **EVENT})
    doc.flags.ignore_workflow = True
    doc.insert(ignore_permissions=True)


def reisen_anlegen():
    for r in REISEN:
        if frappe.db.exists("PH Kundenreise", r["reise_id"]):
            continue
        doc = frappe.get_doc({"doctype": "PH Kundenreise", "aktiv": 0, "status": "Entwurf", **r})
        doc.insert(ignore_permissions=True)


def einstellungen_anlegen():
    doc = frappe.get_single("PH Marketing Einstellungen")
    if not doc.einwilligung_textversion:
        doc.einwilligung_textversion = "nl-2026-10-29"
    doc.save(ignore_permissions=True)
