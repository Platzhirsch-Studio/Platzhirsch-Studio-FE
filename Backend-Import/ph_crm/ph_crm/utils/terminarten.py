"""Standard-Terminarten der Website – reine Daten ohne Frappe (install.py, Patch v0_2.terminarten_website,
Test ph_crm/tests/test_terminarten.py)."""

# Quelle: src/lib/booking/types.js TERMINARTEN (Dauer, Puffer, vorher → anfahrt_min, starts, days, themen,
# bestaetigung sofort/anfrage → automatisch/manuell) + Spec B7; beschreibung = copy.js arten.<key>.text (de).
# Wochentage: Website 0 = So (days [2,3,4,5] = Di–Fr) → PH Terminart 0 = Mo ("1,2,3,4").
# Bewusst KEIN Fixture: ein Fixture-Sync löscht und ersetzt den Datensatz samt Berater-Tabelle bei jeder
# Desk-Änderung. Anlage idempotent hier + Patch v0_2.terminarten_website (ergänzt nur Fehlendes).
# Abgleich mit types.js: ph_crm/tests/test_terminarten.py.
TERMINARTEN = [
    {"key": "studio", "beschreibung": "Mit Kaffee aus unserem Café. Sie sehen Stoffe, Materialien und Möbel im Original.", "titel_de": "Beratung im Studio", "titel_en": "Consultation at the studio", "titel_fr": "Conseil au studio", "titel_it": "Consulenza in studio", "modus": "Showroom", "dauer_min": 60, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 10, "hinweis_kunde": "Wir empfangen Sie mit einem Kaffee aus unserem Café in Lochau, Landstraße 11."},
    {"key": "video", "beschreibung": "Von zu Hause aus, im Browser, ohne App. Pläne und Muster zeigen wir am Bildschirm. Nichts wird aufgezeichnet.", "titel_de": "Videoberatung", "titel_en": "Video consultation", "titel_fr": "Conseil en visio", "titel_it": "Consulenza video", "modus": "Video", "dauer_min": 45, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 20, "hinweis_kunde": "Den Zugangslink erhalten Sie 15 Minuten vor Beginn. Alternativ rufen wir Sie an."},
    {"key": "vor_ort", "beschreibung": "Wir sehen uns Räume, Licht und Umgebung an. Wenn Ihr Projekt es braucht, auch ein, zwei Tage.", "titel_de": "Beratung bei Ihnen vor Ort", "titel_en": "Consultation at your home", "titel_fr": "Conseil à domicile", "titel_it": "Consulenza a domicilio", "modus": "Vor Ort", "dauer_min": 90, "puffer_min": 60, "anfahrt_min": 60, "bestaetigung": "manuell", "feste_startzeiten": "10:00,14:00", "wochentage": "1,2,3,4", "sortierung": 30, "hinweis_kunde": "Unser Team bestätigt Termin und Anfahrt persönlich."},
    {"key": "planung", "beschreibung": "Für ein konkretes Vorhaben, zum Beispiel Küche oder Pool. Im Studio oder per Video.", "titel_de": "Planungstermin", "titel_en": "Planning session", "titel_fr": "Rendez-vous de planification", "titel_it": "Appuntamento di progettazione", "modus": "", "modi_erlaubt": "Showroom,Video", "themen": "kueche,wohnen,ezarri,licht,yacht,hotel", "dauer_min": 90, "puffer_min": 15, "anfahrt_min": 0, "bestaetigung": "automatisch", "sortierung": 40},
]
