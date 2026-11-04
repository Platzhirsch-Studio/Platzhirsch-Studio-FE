# Platzhirsch Sortiment (`ph_sortiment`)

Marken mit Händlerstatus/Claims, Produkte mit Ausführungen, Bildern (Quelle + Freigabe) und Preisen mit Stand, Kategorien/Welten, Lieferzeiten, Lieferanten, Herstellerbestellungen mit AB-Abgleich (Prüfprotokoll wie SHD/kiwi), Wareneingang, Import-Werkzeuge und die Website-API in der heutigen Antwortform von `Produkte New`/`Marken`.

Arbeitspaket WP3 (`../PLAN.md`), Regeln `../CONVENTIONS.md`, Vorbild `ph_crm/PH Anfrage`. Voraussetzungen: `frappe`, `ph_core`. **Nur Staging** – das produktive Backoffice wird nicht angefasst, Minotti-Daten/-Bilder werden von keinem Importer verändert.

## DocTypes (Modul PH Sortiment)

| DocType | Zweck | Felder |
|---|---|---|
| **PH Marke** | Hersteller/Marke: Händlerstatus (Keiner/Haendler/Vertragshaendler/Exklusiv/Partner/Anfrage laeuft) mit Vertrag (permlevel 1), Beleg-URL, Wortlaut wie `src/lib/legal/claims.js`, freigegebene Claims, Bildfreigabe (Status/Beleg), Markenbilder mit Quelle/Freigabe, Ansprechpartner, Lieferant/Bestellweg, Texte de/en/fr/it (Kurz, Story, Produkte-Text), Website-Felder (`bild_anhagen`, `es_gibt_produkte`) | 68 (+ Kind: PH Marke Bild 12, PH Marke Claim 7, PH Sortiment Ansprechpartner 5) |
| **PH Lieferant** | Bezugsquelle: Bestellweg (E-Mail/Portal/IWOfurn/pCon/EDI/Fax), Bestell-E-Mail, Kundennummer, Konditionen (permlevel 1), AB-Frist | 32 |
| **PH Kategorie** | Kategorie/Subkategorie (`key` = category_key/Website-Slug), Label je Sprache, Welt, Bereiche, USt-Klasse, Grundpreispflicht | 29 |
| **PH Merkmal** | Farbe/Material/Oberfläche/Duftfamilie (`color_key`/`material_key`, Hex, Bild) | 17 |
| **PH Produkt** | Artikel: Tabs Stammdaten · Texte · Bilder/Dokumente · Ausführungen · Preise/Lieferzeit · Shop/Versand · Website/SEO · System; Bildvorschau, berechnete Felder (`bild_freigegeben`, `aktueller_preis_cent`, `preisstand_alt`), Lieferzeit mit Freigabe (FAGG), Claim-Guard in Texten | 112 (+ Kind: Bild 15, Preis 19, Merkmal 6, Mass 2, Dokument 5, Ausfuehrung Gruppe 7, Zubehoer 5, Verwandt 1, Kategorie 1, 3D Modell 5) |
| **PH Produkt Ausfuehrung** | Option einer Gruppe (`produkt::gruppe::option`), Name je Sprache, Code/RAL, Farbe, Bild, Standard, Aufpreis/Preis, SKU | 25 |
| **PH Preisliste Import** | Herstellerpreisliste mit Stand: CSV einlesen, prüfen (Abweichung > Schwelle), übernehmen (Leitung) → Preise mit Stand | 22 (+ Zeile 8) |
| **PH Herstellerbestellung** | Bestellung `HB-.YYYY.-.#####`: Positionen (EK permlevel 1, VK, Wunschtermin), AB (Nummer, Datum, Datei), **AB-Abgleich** (Soll/Ist je Feld Preis/Menge/Termin/Artikel mit Bewertung offen/ok/pruefen/abgelehnt), Lieferadresse, Lieferverfolgung, Bezug (Dynamic Link auf AB/Projekt/Bestellung) | 53 (+ Position 20, PH AB Abgleich 11) |
| **PH Wareneingang** | Eingang `WE-.YYYY.-.#####` je Lieferung: erwartet/erhalten, Zustand (ok/Transportschaden/beschaedigt/falsch/fehlt), Fotos, Reklamation; verbucht Mengen in die Bestellung | 24 (+ Position 10, Foto 2) |
| **PH Sortiment Einstellungen** | Single: Revalidate, API-Cache, Claim-Guard, Höchstalter Preise (3/6 Monate), Preislisten-Schwelle, AB-Toleranzen, Standard-Lieferadresse, Druckformat | 25 |

Rechte: Matrix aus `ph_core/utils/berechtigungen.py` („Sortiment“), `PH Website Integration` liest Produkt/Marke/Kategorie/Merkmal/Ausführung; `permlevel 1` (Vertrag, EK, Konditionen, Notizen) nur Leitung/Geschäftsführung/Admin.

## Workflows, Kanban, Buttons

- **PH Produkt**: Entwurf → Geprueft (Mitarbeiter; Kategorie, Marke, DE-Text) → **Aktiv = veröffentlicht** (Leitung; Bedingung: freigegebenes Bild, Marke aktiv) → Pausiert / Ausgelaufen; Rückwege Leitung. Der Statuswert `Aktiv` bleibt, weil die Website heute `status === "Aktiv"` filtert.
- **PH Herstellerbestellung**: Entwurf → Gesendet (bestellt) → AB erhalten → AB geprueft (Mitarbeiter nur ohne Abweichungen, Leitung wenn alle bewertet) → Teilgeliefert/Geliefert (Wareneingang) → Abgeschlossen (keine offenen Abweichungen); Storniert (Leitung).
- **PH Preisliste Import**: Hochgeladen → Geprueft → Uebernommen (Leitung) / Verworfen.
- Kanban: `PH Produkte`, `PH Herstellerbestellungen`.
- Buttons: Produkt – Preis mit Stand hinzufügen, Ausführung anlegen, Website-Cache erneuern, Vorschau auf Website, Duplizieren, Als Ausstellungsstück anlegen · Marke – Händlerstatus/Claims prüfen, Bildfreigabe anfordern (Mail), Lieferant anlegen · Herstellerbestellung – Per E-Mail senden (PDF), AB einlesen (Dialog je Position), AB-Abgleich erzeugen, Abweichung bewerten, Wareneingang anlegen, Als IWOfurn/pCon exportieren (CSV-Platzhalter) · Wareneingang – Reklamation an Lieferant · Preisliste – Datei einlesen, Prüfen, Übernehmen.

## Druck, Dashboard, Berichte

Druckformate (Jinja, `ph_basis.html`): **PH Herstellerbestellung Standard** (an Lieferanten, ohne VK), **PH Wareneingang Protokoll** (mit Fotos, Unterschriften, Vorbehaltshinweis), **PH AB Abgleich Protokoll**, **PH Produkt Datenblatt**.
Workspace **PH Sortiment** (sequence 3): 6 Number Cards (Aktive Produkte, ohne Bildfreigabe, Preisstand veraltet, offene Bestellungen, AB mit Abweichung, Marken ohne Händlerstatus), 4 Charts (Produkte je Marke, Bestellungen nach Status, Bestellungen je Monat, Lieferterminabweichung je Lieferant), Kanban- und Report-Shortcuts.
Reports: `PH Preisstand aelter als 3 Monate` (Script), `PH Produkte ohne Bildfreigabe` (Script), `PH Lieferantenbestellungen offen` (Query), `PH AB Abweichungen` (Script), `PH Claims-Pruefung` (Script, Abgleich mit `claims.js VERIFIED_DEALER_BRANDS`), `PH Liefertermintreue je Lieferant` (Script, Chart-Quelle).
Scheduler: 05:10 Preisstand prüfen (3/6 Monate → `preisstand_alt`), 08:00 Mo–Fr AB-Erinnerung (ToDo Leitung), 02:30 Zähler je Marke/Kategorie.

## Website-API (`ph_sortiment.api`, lesend, guest, gleiche Feldnamen wie heute)

| heute (`platzhirsch_studio…`) | neu | Website-Datei |
|---|---|---|
| `produkte_new.api.get_produkte_by_kategorie` | `ph_sortiment.api.get_produkte_by_kategorie` | `src/lib/api/fetchAllProdukte.js` |
| `produkte_new.api.get_produkte_by_marke_api` | `ph_sortiment.api.get_produkte_by_marke_api` | ebd. |
| `produkte_new.api.search_produkte` | `ph_sortiment.api.search_produkte` | ebd. |
| `produkte_new.api.get_all_kategorien` | `ph_sortiment.api.get_all_kategorien` | ebd. |
| `produkte_new.api.get_kategorien_by_marke` | `ph_sortiment.api.get_kategorien_by_marke` | `fetchKategorien.js` |
| `produkte_new.api.get_collections` | `ph_sortiment.api.get_collections` | `fetchCollections.js` |
| `produkte_new.api.get_produkt_by_path_field_api` | `ph_sortiment.api.get_produkt_by_path_field_api` | `fetchAllProdukte.js`, `produktDetail.js` |
| `produkte_new.api.get_produkte_paths` | `ph_sortiment.api.get_produkte_paths` | ebd. |
| `produkte_new.api.related_products` | `ph_sortiment.api.related_products` | ebd. |
| `marken.api.marken_data` | `ph_sortiment.api.marken_data` | `fetchMarkenData.js` |
| `produkte_kategorie.api.get_all_kategorien_api` | `ph_sortiment.api.get_all_kategorien_api` | `fetchKategorien.js` |
| `sub_kategorie.api.get_all_sub_kategorien_api` | `ph_sortiment.api.get_all_sub_kategorien_api` | `fetchSubKategorien.js` |
| `produkte_farbe.api.get_all_farben_api` | `ph_sortiment.api.get_all_farben_api` | `fetchFarben.js` |
| `produkte_material.api.get_all_materialien_api` | `ph_sortiment.api.get_all_materialien_api` | `fetchMaterialien.js` |
| – | `ph_sortiment.api.get_preise(slugs)` | Shop: gültige Verkaufspreise mit Stand (nur freigegeben, ≤ 3 Monate, nicht pausiert), USt-Klasse, Versand, Lieferzeit |
| – | `ph_sortiment.api.get_katalog_version()` | Versionsstempel |

Antwortfelder wie heute (`name`, `produkt_name`, `path_field`, `url_slug`, `marken`, `kategories`, `status`, `collection`, `designer`, `modified`, `bild_anhangen[]`, `pdf_produkte[]`, `additional_information[]`, `beschreibung/_en/_fr/_it`, `mehr_beschreibung…`, `metadata_*`; Marken `name1`, `logo`, `status`, `produkte…`, `bild_anhagen`, `es_gibt_produkte`, `grundungsjahr`, `herkunftsland`, `website`) plus neue Zusatzfelder (`preis`, `preise`, `ausfuehrungen`, `lieferzeit`, `shop`, `merkmale`, `masse`). Nur `status = Aktiv` und `website_sichtbar`. Cache 1 h (`frappe.cache`, geleert bei jeder Änderung), **ETag** + `X-PH-Katalog-Version` auf jeder Antwort, `If-None-Match` → 304. Nach Änderungen an Produkt/Marke/Kategorie wird `ph_website_revalidate_url` (site_config, Tags `products`/`marken`/`kategorien`) gedrosselt per Hintergrundjob aufgerufen (bevorzugt `ph_core.utils.website.revalidate`, s. `../ANFRAGEN-AN-CORE.md`).

Umstellung der Website: `NEW_API_BASE_URL` beibehalten, nur die Methodenpfade in den genannten Dateien tauschen (oder eine Konstante `PRODUKTE_NEW_API = …ph_sortiment.api`). Bis zur Migration liest die Website weiter `platzhirsch_studio`.

## Import

1. **Statischer Katalog** (`src/lib/katalog/marken/*.js`, 25 Marken): im Website-Repo `node Backend-Import/ph_sortiment/tools/export_katalog.mjs --out=/tmp/ph-katalog.json` (liest nur, schreibt JSON + CSV-Vorlage). Dann auf der Staging-Bench Trockenlauf `bench --site <site> execute ph_sortiment.importer.katalog.importieren --kwargs '{"datei": "/tmp/ph-katalog.json", "trockenlauf": 1}'` (Protokoll: neu/aktualisiert/übersprungen/Fehler, nichts geschrieben), danach mit `"trockenlauf": 0`. Optionen: `nur_marke`, `bilder_freigeben` (nur wenn die Herstellerfreigabe vorliegt). Produkte entstehen als **Entwurf**, Preise mit Stand/Quelle freigegeben (Verkaufspreis in Cent), Händlerstatus aus dem `dealer`-Flag mit Aktenhinweis, Preise pausierter Marken (Assouline, Tom Dixon) bleiben ohne Online-Verkauf. Wiederholbar: Freigaben und Preishistorie bleiben erhalten.
2. **Altbestand `platzhirsch_studio`** (Staging-Kopie, PLAN M2/M3): `bench --site <staging> execute ph_sortiment.importer.altbestand.importieren --kwargs '{"trockenlauf": 1}'` → Marken, Produkte Kategorie/Sub Kategorie, Produkte Farbe/Material, Produkte New (idempotent über `sync_quelle`; Bilder als File-Verweise, Freigabe offen).
3. **Data Import** im Desk: `allow_import` ist für alle Haupt-DocTypes gesetzt; die CSV aus Schritt 1 (`import_vorlagen/ph-katalog.csv`) ist eine flache Vorlage für PH Produkt.
4. **Preislisten**: PH Preisliste Import mit CSV `hersteller_artikelnr;neu;bezeichnung` (`import_vorlagen/README.md`).

## Tests

```bash
cd Backend-Import/ph_sortiment && PYTHONPATH=. python -m unittest discover -s ph_sortiment/tests -t .   # ohne Site: Preise, AB-Abgleich, Katalog-Mapping, Slug
bench --site <site> run-tests --app ph_sortiment   # mit Site: PH Produkt (Preis mit Stand, Aktiv ohne Bildfreigabe, Claim-Guard, API-Antwortform), PH Herstellerbestellung (AB-Abgleich, Wareneingang), PH Marke (Händlerstatus, Claims)
python Backend-Import/tools/check.py
```

## Offen / Hinweise

- Nummernkreis `PH-PLI-.YYYY.-.####` (Preisliste Import) in `ph_core NUMMERNKREISE` eintragen; Website-Revalidate ausschließlich über `ph_core.utils.website.revalidate` (Pfade produkte/marken; `ereignisse.TAG_PFAD`). `required_apps` enthält seit 04.11. `ph_crm` (Custom Field `PH Anfrage Produkt.ph_sortiment_produkt`, doc_events PH Anfrage).
- Link-Felder auf fremde Apps (PH Paketprofil, PH Lagerort, PH Servicefall, PH Auftragsbestaetigung, PH Projekt, PH Bestellung) kommen als Custom Fields der jeweiligen App; hier Textfelder/Dynamic Link.
- IWOfurn/pCon-Export ist ein CSV-Platzhalter (Schnittstellenpaket später).
- Bildfreigabe und Händlerverträge: Importe setzen nie „erteilt“ ohne Beleg – der Inhaber gibt im Desk frei.
