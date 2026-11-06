# Platzhirsch Ablage (`ph_ablage`) – App Nr. 13

Dateiablage wie ein Drive im eigenen Backoffice (Inhaber-Wunsch: „Word, Excel, CAD usw. wie eine App, die Drive als Speicher verwendet, aber unsichtbar per API“). Ordner, Namen, Tags, Rechte und Versionen stehen in Frappe; die Bytes liegen in einem **austauschbaren Speicher**, den kein Mitarbeiter sieht. Stand 04.11.2026, **nicht installiert**, nur Staging.

- Voraussetzung (`required_apps`): `frappe`, `ph_core`. Bezüge auf PH Kontakt (ph_crm), PH Projekt/PH Projekt Dokument (ph_projekte), PH Lieferant (ph_sortiment), PH Mitarbeiter (ph_personal), PH Servicefall (ph_service) sind **optional** (Dynamic Links, Zugriffe nur nach `frappe.db.exists("DocType", …)`).
- Regeln: `../CONVENTIONS.md` · Rollen `PH Ablage Mitarbeiter`, `PH Ablage Leitung` (ph_core `fixtures/role.json`) · Nummernkreise `PH Ordner` = `PH-ORD-.######`, `PH Datei` = `PH-DAT-.YYYY.-.######` (ph_core `utils/naming.py`).

## DocTypes (Modul „PH Ablage“)

| DocType | Zweck |
|---|---|
| **PH Ordner** (Baum, Nested Set) | Titel, Elternordner, Bezug (Dynamic Link Kontakt/Projekt/Lieferant/Mitarbeiter/Servicefall/frei), Stammordner-Kennzeichen, Vorlage, Rechte-Modus `intern`/`team`/`leitung` (leer = erben) → `effektiver_modus` (strengster der Kette), Mitglieder (Table MultiSelect `PH Ordner Mitglied`), Farbe, Symbol, Aufbewahrungsklasse für neue Dateien, geschützt (Vorlagenordner) |
| **PH Datei** | Dateiname, Ordner, Bezug (geerbt), aktuelle Version, MIME, Endung, Größe, SHA-256, Vorschau-Art/-Status, Tags, Beschreibung, Portal-Freigabe + Ablauf + Version, Check-out (`gesperrt_von/bis`), Aufbewahrungsklasse/Belegdatum/`aufbewahren_bis`/Löschsperre, Papierkorb (gelöscht am/von, endgültig ab), CAD-Metadaten, Volltext (versteckt) |
| PH Datei Version (Kindtabelle) | Nummer, **Speicher-Adapter + Speicher-Schlüssel**, Größe, Prüfsumme, geprüft, hochgeladen von/am, Kommentar, wiederhergestellt aus, Vorschau-Objekt |
| **PH Datei Freigabelink** (hash) | Token nur als SHA-256, Ablauf, Passwort (PBKDF2), Download-Zähler/-Limit, nur lesen, Status Aktiv/Abgelaufen/Aufgebraucht/Widerrufen |
| PH Ablage Einstellungen (Single) | Adapter, Schlüssel-Präfix, Status der site_config-Schlüssel (nur „gesetzt/fehlt“), Link-Gültigkeit, Teilgröße, Max-Größe, erlaubte/gesperrte Endungen, Duplikat-Verhalten, Ordnervorlagen (`PH Ablage Ordnervorlage`), Papierkorbfrist, Check-out-Dauer, Vorschau/LibreOffice/ffmpeg, Volltext, Freigabe-Basis-URL/Tage/Passwortpflicht |
| **PH Ablage Ereignis** (hash, nur anlegen) | Upload, Neue Version, Download, Freigabe erstellt/genutzt/widerrufen, Portal, Umbenannt, Verschoben, Gelöscht, Wiederhergestellt, Endgültig gelöscht, Check-out, Bestand, Umzug, Prüfsumme abweichend, Anonymisiert – **nie Inhalte**, Bezug als Text (blockiert kein Löschen) |

Desk: Workspace **„PH Ablage“** (sequence 13): 4 Number Cards (Dateien, Ausgecheckt, Freigabelinks, Papierkorb), 3 Charts (Uploads je Woche, Dateien je Bezug, je Endung), Baumansicht `PH Ordner`, Listen mit Indikatoren, Reports **PH Speicherbelegung** (je Bezug/Endung/Speicher/Stammordner/Status; aktuelle und alle Versionen) und **PH Freigaben aktiv** (Links + Portal) – beide nur Leitung/GF/Admin. Formular-Buttons: Herunterladen, Neue Version, Auschecken/Einchecken, Freigabelink, Vorschau neu, Papierkorb/Wiederherstellen; Ordner: Datei hochladen; Einstellungen: Speicher prüfen, Vorlagen zurücksetzen, Bestand übernehmen.

## Speicher-Adapter (`ph_ablage/speicher/`)

Gemeinsame Schnittstelle (`basis.py`): `put(schluessel, stream, mime)`, `get(schluessel) → stream`, `delete`, `presign_get(schluessel, sekunden, dateiname, inline)`, `presign_put(...)`, `exists`, `head`, `list(prefix)`, `pruefen()`. Fehler `NichtKonfiguriert` → API **503 `unavailable`** mit `fehlend: [Schlüsselnamen]`.

| Adapter | Stand | site_config (nur Namen) |
|---|---|---|
| `lokal` (Standard Entwicklung/Staging) | fertig, getestet | – (optional `ph_ablage_lokal_pfad`); Objekte unter `sites/<site>/private/files/ph_ablage/` **ohne** File-Datensatz (nicht auslieferbar, im Backup `--with-files` enthalten) |
| `s3` (S3-kompatibel, EU) | fertig, gegen Attrappe + AWS-Testvektoren getestet; **SigV4 selbst implementiert** (`sigv4.py`, nur hashlib/hmac + requests); Direkt-Upload per vorsignierter PUT-URL mit `x-amz-checksum-sha256`; Download vorsigniert mit echtem Dateinamen (`response-content-disposition`) | `ph_ablage_s3_endpoint`, `_region`, `_bucket`, `_key`, `_secret`; optional `ph_ablage_s3_boto3` |
| `google_drive` (Drive v3 REST, Dienstkonto-JWT RS256 via `cryptography`) | fertig gegen Attrappe; versteckter Stammordner, Objekte flach mit Schlüssel als Name; Download über Server-Proxy | `ph_ablage_gdrive_service_account`, `ph_ablage_gdrive_root_id` |
| `onedrive` (Microsoft Graph App-Only) | fertig gegen Attrappe; Upload-Session > 4 MB; optional Token aus **ph_microsoft** `graph_token()` | `ph_ablage_ms_tenant`, `_client_id`, `_client_secret`, `_drive_id`; optional `ph_ablage_ms_root_path`, `ph_ablage_ms_token_von_ph_microsoft` |
| `frappe_datei` (nur lesen) | Bestand verlinkt (Schlüssel = File-Name), nie gelöscht | – |

**Schlüssel-Schema (unveränderlich):** `[<praefix>/]<jahr>/<datei-id>/<version>-<sha8>.<endung>`, Vorschau `vorschau/<jahr>/<datei-id>/<version>-<sha8>.png|pdf`. Dateinamen nur in der Datenbank → Umbenennen/Verschieben/Tags ohne Speicherzugriff, im Speicher keine Kunden- oder Projektnamen. Jede Version merkt sich ihren Adapter: ein Wechsel in den Einstellungen gilt für neue Uploads, `ph_ablage.api.speicher_umziehen` kopiert den Bestand (Prüfsumme verifiziert, optional alte Objekte löschen).

## Automatische Ordner, Bestand, Mail-Anhänge

- `after_insert` auf PH Kontakt/Projekt/Lieferant/Mitarbeiter/Servicefall (nur wenn installiert, Hintergrundjob, idempotent): Bereichsordner („Projekte“, „Kontakte“, …) → Stammordner `<Name> · <Titel>` → Vorlage. Projekt: 01 Aufmaß, 02 Planung & Handzeichnung, 03 Renderings, 04 Angebote & Verträge (Beleg), 05 Herstellerunterlagen, 06 Montage & Abnahme, 07 Fotos, 08 Service. Mitarbeiter: alle Ordner `leitung` + Klasse Personal (nur PH Personal Leitung/GF). Vorlagen in den Einstellungen änderbar (`a > b` = Unterordner). `on_update` benennt den Stammordner nach, `on_trash` entfernt leere Ordner.
- **Bestand** (`patches/v0_1/bestand_uebernehmen` bzw. `ph_ablage.api.bestand_uebernehmen`): Frappe-Files an diesen DocTypes → „00 Bestand“, PH Projekt Dokument → passender Vorlagenordner (Kategorie), jeweils **verlinkt** (Adapter `frappe_datei`). Wird ein Original gelöscht, übernimmt `File.on_trash` den Inhalt vorher in den Speicher (≤ 100 MB).
- **Mail-Anhänge** (Hook `ph_microsoft_anhang_ablegen` → `ph_ablage.ph_ablage.mail.anhang_ablegen(datei, bezug_doctype, bezug_name, kontakt, quelle)`): Ordner „00 Mail-Anhänge“ des Bezugs (sonst des Kontakts), verlinkt, Duplikate je Bezug per SHA-256 übersprungen.

## Datenschutz und Aufbewahrung

Klassen (Vorschläge, Steuerberater bestätigen): **Beleg** 7 Jahre ab Jahresende (§ 132 BAO), Löschsperre (auch kein Papierkorb), löschen nur Leitung · **Personal** 7 Jahre, nur Personal-Leitung · **Projekt** 7 Jahre Empfehlung · **Marketing** 3 Jahre · **Allgemein** ohne Frist. Papierkorb 30 Tage, danach Scheduler 03:10 (Objekte aller Versionen + Vorschauen weg). Hooks Kundenakte (ph_crm): `ph_kontakt_datenauskunft` (nur Metadaten, auch Projekte/Servicefälle des Kontakts), `ph_kontakt_anonymisieren` (Belege mit Frist `aufbewahren`, alles andere `loeschen`, Stammordner ohne Namen), `ph_kontakt_zusammengefuehrt`. Rechte zusätzlich in Desk-Listen (`permission_query_conditions`) und Formularen (`has_permission`).

## Schnittstelle für das Backoffice

`POST /api/method/ph_ablage.api.<methode>` (Lesemethoden auch GET), Frappe-Sitzung des Mitarbeiters oder Service-Token. Alle `@ph_api(intern=True)`: Guest 403, Rate-Limit, PH API Protokoll, Fehler `{"code", "message", …}`. Zeiten ISO 8601 mit Offset, Größen in Bytes. **Datei-Antwort** = `{datei, dateiname, ordner, status, endung, mime, groesse, groesse_text, version, sha256, tags[], beschreibung, vorschau_art, vorschau_status, gesperrt_von, gesperrt_bis, portal_freigabe, portal_ablauf, freigabelinks_aktiv, aufbewahrungsklasse, aufbewahren_bis, loeschsperre, geloescht_am, papierkorb_bis, bezug_doctype, bezug_name, bezug_titel, hochgeladen_von, erstellt, geaendert}`. **Ordner-Antwort** = `{ordner, titel, eltern, pfad, bezug_doctype, bezug_name, bezug_titel, rechte_modus, effektiver_modus, farbe, icon, geschuetzt, ist_bezugswurzel, aufbewahrungsklasse, anzahl_dateien}`.

| Methode | Parameter | Antwort | Fehler (zusätzlich zu forbidden/not_found) |
|---|---|---|---|
| `einstellungen_info` | – | `{adapter, max_bytes, chunk_bytes, erlaubte_endungen, gesperrte_endungen, papierkorb_tage, sperre_stunden, freigabe_*, direkt_upload, office_vorschau, portal, aufbewahrungsklassen, modi, bezuege}` | – |
| `ordner_baum` | `bezug_doctype+bezug_name` **oder** `ordner` **oder** nichts; `tiefe?` (Bezug/Ordner 10, global 1) | `{wurzeln: [Ordner + kinder[]]}` – legt Stammordner+Vorlage bei Bedarf an, nur zugängliche Knoten | invalid, unavailable |
| `ordner_anlegen` (idempotent) | `titel, eltern?, bezug_doctype?, bezug_name?, rechte_modus?, farbe?, icon?, mitglieder?, aufbewahrungsklasse?` | Ordner | invalid, conflict (Name im Zielordner) |
| `ordner_verschieben` | `ordner, eltern?` (leer = oberste Ebene) | Ordner (Unterbaum + Dateien übernehmen Bezug/Modus) | invalid (in sich selbst), conflict |
| `ordner_umbenennen` | `ordner, titel` | Ordner | conflict |
| `ordner_einstellen` | `ordner, rechte_modus?, farbe?, icon?, mitglieder?, aufbewahrungsklasse?, beschreibung?` | Ordner (Lockern nur Leitung) | invalid |
| `ordner_loeschen` | `ordner` | `{ordner, geloescht}` – nur leer | conflict |
| `dateien` | `ordner` (oder `papierkorb=1` ohne Ordner), `suche?, tags?, sort? (name,-name,groesse,-groesse,geaendert,-geaendert,erstellt,-erstellt,endung), seite?=1, groesse?=50 (≤200), endung?` | `{items: [Datei], seite, groesse, gesamt, ordner}` | invalid |
| `datei` | `datei` | Datei + `versionen[], metadaten, freigabelinks[], ordner_pfad` | – |
| `suche` | `q (≥2 Zeichen, alle Begriffe), bezug_doctype?, bezug_name?, endung?, limit?=50` | `[Datei + treffer_in[name/tags/beschreibung/bezug/inhalt], schnipsel]` | invalid |
| `upload_start` | `ordner, dateiname, groesse, mime?, sha256?, kommentar?` | `{token, datei, version, ablauf, ziel, duplikate[]}`; `ziel.art = "direkt"` → `{url, methode: "PUT", header}` (S3 mit sha256: Browser lädt direkt hoch, Header exakt senden) oder `"teile"` → `{methode: "ph_ablage.api.upload_chunk", chunk_bytes}` | invalid, blocked_type 415, too_large 413, unavailable 503 |
| `upload_chunk` (900/min) | `token, offset, daten (Base64)` oder multipart-Feld `chunk` | `{erhalten, groesse, fertig}` – Wiederholung eines Teils harmlos | invalid_token, conflict (`offset`, `{erhalten}`), invalid |
| `upload_abschliessen` (idempotent) | `token, sha256, bei_duplikat? (melden/verwerfen)` | Datei + `{duplikat, verworfen, duplikate[]}` | checksum_mismatch 422, conflict (unvollständig/Größe), invalid_token |
| `neue_version` | `datei, groesse, dateiname?, mime?, sha256?, kommentar?, einchecken?=1` | wie `upload_start` (gleiche Endung) | locked 423, conflict, invalid |
| `download_link` | `datei, version?, inline?` | `{datei, url, art (direkt/proxy), ablauf, dateiname, groesse, mime, version}` (protokolliert) | conflict, unavailable |
| `vorschau_link` | `datei, version?` | `{vorschau_status, url?, …}` (Browser = Original inline) | – |
| `herunterladen` (GET, ohne ph_api) | `dl` | Datei (Content-Disposition mit DB-Namen); Token an Benutzer gebunden, `presign_sekunden` gültig | 403/404 als Frappe-Fehler |
| `umbenennen` | `datei, dateiname` (Endung bleibt) | Datei | invalid, locked |
| `verschieben` | `datei, ordner` | Datei | locked, forbidden (Personal nur in Personalordner) |
| `tags_setzen` | `datei, tags, beschreibung?` | Datei | – |
| `aufbewahrung_setzen` | `datei, aufbewahrungsklasse, belegdatum?` | Datei | invalid, forbidden |
| `sperren` / `entsperren` | `datei, stunden?, hinweis?` / `datei, erzwingen?` (Leitung) | Datei | locked 423 `{gesperrt_von, gesperrt_bis}` |
| `versionen` | `datei` | `{datei, aktuell, versionen[]}` | – |
| `version_wiederherstellen` | `datei, version, kommentar?` | Datei mit Versionen (neue Version, gleicher Schlüssel) | conflict, locked |
| `loeschen` / `wiederherstellen` | `datei` | Datei | locked 423 (Aufbewahrung, `aufbewahren_bis`), forbidden (nur Leitung), conflict |
| `endgueltig_loeschen` | `datei` (aus Papierkorb, Leitung) | `{datei, geloescht}` | conflict, locked, forbidden |
| `freigabelink_erstellen` | `datei, tage?, passwort? (≥6), max_downloads?, version?, empfaenger_hinweis? (keine E-Mail)` | `{freigabelink, token (nur hier!), url, ablauf, passwort, max_downloads, version}` | invalid, conflict |
| `freigabelinks` / `freigabelink_widerrufen` | `datei, alle?` / `freigabelink` | `{items[]}` / `{freigabelink, status}` | – |
| `freigabe_aufloesen` (30/min, Rolle PH Website Integration/Backoffice-Admin – öffentliche Seite des Backoffice serverseitig) | `token, passwort?, nur_info?` | `{dateiname, groesse, mime, ablauf, passwort_noetig, version}` + ohne nur_info `{url, art, url_ablauf}` (zählt) | invalid_token 404, expired 410, password_required 401 `{passwort_noetig}`, forbidden 403 |
| `portal_freigeben` | `datei, freigeben?=1, projekt?, kategorie?, titel?, bis?` | `{portal_freigabe, portal_dokument, portal_ablauf}` | unavailable (ph_projekte fehlt), invalid (kein Projekt), too_large 413 (> 25 MB), conflict |
| `bestand_uebernehmen` (Leitung) | `bezug_doctype?, limit?` | `{eingereiht}` | invalid |
| `speicher_umziehen` (Admin) | `ziel?, limit?, bestand_einbeziehen?, alte_loeschen?` | `{eingereiht, ziel}` | invalid, unavailable |

Hinweis Proxy-Download: `herunterladen` lädt die Datei in den Speicher des Workers (Frappe `response.type = "download"`) – für sehr große Dateien S3 (Direkt-Link) verwenden. `api_protokoll_nutzdaten` (ph_core) muss aus bleiben, sonst landen Freigabe-/Upload-Token im PH API Protokoll.

## Vorschau und Volltext (Hintergrund, Queue „long“)

Bilder → PNG-Thumbnail (Pillow, EXIF-Drehung); PDF → erste Seite nur mit `pypdfium2`, sonst „Browser“; Office → PDF per `soffice --headless` (Einstellung + Programm auf dem Server); CAD (DXF/DWG/SKP/3DM/IFC) → Metadaten (Version, Einheit, Ausdehnung, IFC-Schema) + Symbol, DXF-Zeichnungsvorschau späteres Ziel; Video → Poster per ffmpeg (optional). Volltext: TXT/CSV/MD/JSON/XML, DOCX/XLSX/PPTX/ODF ohne Bibliothek (ZIP + Regex, keine Entity-Expansion, Größenlimits), PDF mit pypdf (Frappe).

## Installation und Tests

```bash
bench get-app /pfad/zu/Backend-Import/ph_ablage && bench --site <site> install-app ph_ablage && bench --site <site> migrate
cd Backend-Import/ph_ablage && PYTHONPATH=. python -m unittest discover -s ph_ablage/tests -t .   # ohne Site: SigV4 (AWS-Vektoren), Schlüssel, Regeln, Aufbewahrung, Vorlagen, CAD, Volltext, Adapter-Attrappen
bench --site <site> run-tests --app ph_ablage                                                     # PH Datei, PH Ordner, PH Datei Freigabelink, Einstellungen, Ereignis
```

## Offen / Entscheidungen

1. **Speicher-Anbieter** für Produktion (Empfehlung: S3-kompatibel in der EU, z. B. Hetzner Object Storage Falkenstein/Nürnberg oder IONOS; Google Drive/OneDrive nur, wenn Microsoft-365-Lizenz ohnehin vorhanden – OneDrive kann den Token von ph_microsoft nutzen). Bucket mit Versionierung/Object-Lock für Belege prüfen.
2. **LibreOffice auf dem Server** (`soffice`, ca. 600 MB) für Office-Vorschauen – heute aus; ohne bleibt „Nicht moeglich“ (Download/Office-Online im Backoffice).
3. Aufbewahrungsfristen Personal/Projekt/Marketing vom Steuerberater bestätigen.
4. Anfrage ph_core: `PH Ablage Mitarbeiter/Leitung` in `hooks.py PH_ROLLEN` (Fixture-Export) und in Rollenprofile aufnehmen.
5. Anfrage ph_projekte: Portal liest heute nur Frappe-Files → Ablage legt für das Portal eine Kopie (≤ 25 MB) an PH Projekt Dokument; besser Hook in `portal_file`, der direkt aus der Ablage liest.
6. Next.js-Backoffice: Drive-Oberfläche und öffentliche Freigabeseite `/f/<token>` (ruft `freigabe_aufloesen`), Freigabe-Basis-URL in den Einstellungen eintragen.
