# Pflege-Abo – Schnittstellen Website ↔ Frappe ↔ Kundenbetreuung

**Stand:** 29.10.2026 · Team Pflege (Service 4) · Frappe-Code geschrieben, nicht ausgeführt. Backoffice ist produktiv: nichts davon ist dort installiert.

## 1. Website → Backoffice (Anfrage)
- Formular `/de|en/pflege-service#anfrage` → `POST /api/upload/inquiry/beratung` → `/api/beratung_anfrage` → Frappe `Anfrage.create_anfrage` (bestehender Weg, keine neue Route).
- `bei_meiner_anfrage_geht_es_um`: `Pflege-Service: Leder, Holz/Furnier · Abo` · `das_projekt_soll_verwirklicht_werden`: Wunschzeitraum (DE).
- Text enthält `Lead-Kontext: pflege`, Materialien, Art, Wunschzeitraum, Ort (PLZ/Ort), Stücke, Nachricht, Einwilligung Nachkauf (ja + Version `pflege-nachkauf-v1-2026-10-29` / nein) und den Herkunftsblock mit `Kontext: Pflege-Service (pflege)`.
- Fotos: Erfolgskarte → Handy-Upload (Ticket aus der Beratungsantwort, nur DE). Fotos privat, GPS-Entfernung bei JPEG.
- **Studio legt danach von Hand** ein `Pflege Abo` an (Status „Angefragt“ → „Angeboten“ → „Aktiv“) und übernimmt Einwilligung + Textversion. Vorschlag für später: Button „Pflege Abo aus Anfrage“ (erkennt `Lead-Kontext: pflege`).

## 2. Frappe-App `../platzhirsch-frappe-service` (Modul Pflege)
| Doctype | Zweck |
|---|---|
| `Pflege Abo` (PFL-YYYY-#####) | Kunde, Status, Art (Einmalig/Jahres-Abo), Intervall, nächster Termin, Erinnerung Tage vorher, Stücke, Konditionen (Preis leer = auf Anfrage), Einwilligung Nachkauf (Zeitpunkt, Textversion, Widerruf), Protokolle, lead_ref |
| `Pflege Abo Stueck` (Tabelle) | Bezeichnung, Marke, Material, `portal_item_id`, `produktpass_id`, Hinweis |
| `Pflege Abo Protokoll` (Tabelle) | Datum, durchgeführt von, Leistungen, empfohlene Pflegemittel, Fotos (privat), im Portal zeigen |

Scheduler `platzhirsch_service.pflege.tasks.erinnerungen_planen` (täglich 06:30):
1. **Termin-Erinnerung** (Abo aktiv, Fenster `naechster_termin − erinnerung_tage_vorher`, einmal je Termin).
2. **Nachkauf-Hinweis** (nur mit Einwilligung, ohne Widerruf, 14 Tage nach dem letzten Protokoll mit „empfohlene Pflegemittel“, einmal je Protokoll).

## 3. Schnittstelle zur Kundenbetreuung (`platzhirsch_kundenbetreuung`, nicht angefasst)
Die Pflege-App **versendet selbst nichts**. Sie legt je fälligem Ereignis einen `PH Reise Versand` an – nur wenn die App installiert ist und die Reise aktiv ist:

| Feld | Termin-Erinnerung | Nachkauf-Hinweis |
|---|---|---|
| `reise` (PH Kundenreise.reise_id) | `pflege_termin` | `pflege_nachkauf` |
| `grundlage` / `werbung` | V / 0 | E / 1 |
| `schluessel` | `pflege_abo:<name>:termin:<datum>` | `pflege_abo:<name>:nachkauf:<datum>` |
| `empfaenger` | `Pflege Abo.kontakt_email` | dito |
| `referenz_doctype/_name` | `Pflege Abo` / name | dito |
| `kontext_json` | `{termin, stuecke[], portal_url}` | `{produkte, stuecke[], hinweis:"Preis auf Anfrage"}` |
| `status` / `geplant_am` | `geplant` / heute | dito |

**Von der Kundenbetreuung gebraucht (Vorschlag an das Team):** zwei Reisen `pflege_termin` (V, Vorlage „Ihr Pflegetermin steht an“) und `pflege_nachkauf` (E, `zweck` `pflege_nachkauf` in `PH Einwilligung` + Kundenreise) als Fixtures mit `aktiv = 0`; `senden()` liest `kontext_json`. Fehlt das: ToDo an `Pflege Abo.berater`, keine Kundenmail.

## 4. Kundenportal (`/de/portal/pflege`)
- Heute: Stücke aus `Project.items` (bestellt/geliefert/montiert) + `ProductPass` (Material, Pflegehinweise, `deliveredAt`) + `Appointments` mit `kind: "pflege"` (falls vorhanden).
- **Erweiterung des Adapter-Vertrags (Integration, `src/lib/portal/adapters/interface.js`, `mock.js`, `frappe.js`, `dal.js` bind):**
  `listCareSubscriptions(customerId) → Promise<Array<{id, status:"aktiv"|…, art:"abo"|"einmalig", naechsterTermin, itemIds[], passIds[], protokolle[]}>>`
  Frappe: `GET /api/method/platzhirsch_service.pflege.api.abos_fuer_kunde?customer=<id>` (API-Key, Leserecht). Die Seite ruft die Methode nur, wenn `portal.listCareSubscriptions` existiert.
- Optional: `APPOINTMENT_KINDS.pflege = "Pflegetermin"` in `src/lib/portal/constants.js`.

## 5. Einwilligungsnachweis Nachkauf (Nachbesserung 29.10.2026)
Solange `Pflege Abo` nicht installiert ist, trägt der Anfragetext eine eigene Zeile:
`Einwilligungsnachweis: zweck=pflege_nachkauf; version=pflege-nachkauf-v1-2026-10-29; zeitpunkt=<ISO UTC>; sprache=de|en; wortlaut="<Text, den die Person gesehen hat>"`.
Die Kundenbetreuung liest sie beim Import (Regex wie `parseNachkaufNachweis` in `src/lib/service/pflege/anfrage.js`) und legt einen Datensatz `PH Einwilligung` (Zweck `pflege_nachkauf`, Quelle = Anfrage-Name) an. Ohne diese Zeile: keine Nachkauf-Mails.
Pflichtbaustein Journey `pflege_termin`: vor Beginn der Kündigungsfrist der Hinweis auf die Bedeutung des Schweigens (§ 6 Abs 1 Z 2 KSchG), sonst keine automatische Verlängerung.

## 6. Winterlager (Service 3) ↔ Kundenbetreuung (nicht angefasst)
- **Eingang:** Formular `/de|en/outdoor-winterservice` → `POST /api/upload/inquiry/beratung` → Backoffice „Anfrage“. Thema „Outdoor-Winterlager & Pflege“, Kontextzeile im Herkunftsblock `Kontext: Outdoor-Winterlager (winterlager)` (seit 29.10., vorher doppelt `Kontext: Lead-Kontext: winterlager`), Feld `das_projekt_soll_verwirklicht_werden` = Zeitraum (`Zeitraum: Abholung …, Rückbringung …`; der Abholort steht nur in `Adresse:`), Beschreibung beginnt mit `[winterlager] Winterlager-Anmeldung`, eine Angabe je Zeile (`Variante:`, `Möbelliste:` mit `- n × Art · Material · Notiz`, `Zusätzlich:`, `Adresse:`, `Zugang:`, `Wunsch Abholung:`, `Wunsch Rückbringung:`, `Hinweis zum Termin:`, `Nachricht:`). Parser: `parseDescription()` in `src/lib/service/winterlager/form.js` (gleiche Logik für die Frappe-Seite vorgesehen in `platzhirsch_service/winterlager/parse.py`, noch nicht geschrieben).
- **Vorgeschlagene Journeys (aktiv = 0):** `winterlager_saison` (Saison-Mail vor Abholzeitraum an Abo-Kunden, mit KSchG-Hinweis zur Verlängerung), `winterlager_rueckgabe` (Terminabstimmung Frühling). Kein Versand ohne Freigabe der Abo-Bedingungen (service-recht-vorschlag.md Winterlager B).
- **Vorgeschlagene Doctypes:** „Service Auftrag“ (Art winterlager/pflege, Kunde, Adresse, Positionen, Übernahmeliste mit Fotos, Status angefragt → angeboten → abgeholt → eingelagert → zurückgebracht) und „Service Abo“ (Kunde, Art, Laufzeit, Kündigungsfrist, nächste Saison). Erst nach Freigabe durch den Inhaber vom Frappe-Entwickler anlegen; das Backoffice ist produktiv.
