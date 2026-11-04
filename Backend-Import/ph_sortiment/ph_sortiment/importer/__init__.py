"""Import-Werkzeuge von ph_sortiment (nur Staging, nie gegen das Produktiv-Backoffice).

katalog.py     Statischer Herstellerkatalog der Website (src/lib/katalog/marken/*.js) → PH Marke/Kategorie/Produkt/Ausführung.
               Schritt 1 (Node, im Website-Repo):  node Backend-Import/ph_sortiment/tools/export_katalog.mjs --out=/tmp/ph-katalog.json
               Schritt 2 (Bench, Trockenlauf):     bench --site <site> execute ph_sortiment.importer.katalog.importieren --kwargs '{"datei": "/tmp/ph-katalog.json", "trockenlauf": 1}'
               Schritt 3 (Bench, echt):            … --kwargs '{"datei": "/tmp/ph-katalog.json", "trockenlauf": 0}'
altbestand.py  Altes Backoffice (platzhirsch_studio: Marken, Produkte Kategorie, Sub Kategorie, Produkte Farbe,
               Produkte Material, Produkte New) → PH-DocTypes, auf der Staging-Kopie (PLAN.md M2/M3), idempotent über sync_quelle.
               bench --site <staging> execute ph_sortiment.importer.altbestand.importieren --kwargs '{"trockenlauf": 1}'
Beide Importer sind idempotent (Schlüssel: slug/key/sync_quelle) und schreiben ein Protokoll (dict) zurück.
Minotti-Daten und -Bilder werden nie verändert (Arbeitsregel): Datensätze der Marke „Minotti“ werden übersprungen.
"""
