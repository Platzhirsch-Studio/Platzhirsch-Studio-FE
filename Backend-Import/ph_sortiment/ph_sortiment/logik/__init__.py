"""Reine Fachlogik von ph_sortiment ohne Frappe-Import (testbar mit python -m unittest, CONVENTIONS 15).

preise.py    Preis mit Stand: gültiger Preis, Höchstalter, Cent-Umrechnung (Quelle: src/lib/katalog/schema.js PREIS_ARTEN).
abgleich.py  AB-Abgleich: Soll/Ist je Position → Prüfprotokoll (SHD/kiwi-Vorbild).
katalog.py   Abbildung Katalogprodukt (src/lib/katalog/marken/*.js, via tools/export_katalog.mjs) → PH Produkt.
slug.py      Slug-Bildung wie src/lib/legal/claims.js toBrandSlug.
preislisten_format.py  Hersteller-CSV, DataNorm 4, XML/IDM-Preset → Zeilen in Cent, Zuordnung Artikelnr./EAN/SKU.
kalkulation.py  Netto-EK mit Gültigkeit, Kalkulationsfaktor je Marke/Kategorie, VK-Rundung, Variantenmatrix.
bestellung.py   Lieferzeit/Liefertermin mit Betriebsurlaub, Sammeln je Lieferant, Liefertermin-Änderungen.
"""
