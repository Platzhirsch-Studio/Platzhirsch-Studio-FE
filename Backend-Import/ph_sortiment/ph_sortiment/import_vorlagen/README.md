# Import-Vorlagen

Hier legt `tools/export_katalog.mjs` die Dateien `ph-katalog.json` (vollständig, für `ph_sortiment.importer.katalog`) und `ph-katalog.csv` (flache Data-Import-Vorlage für **PH Produkt**) ab. Die Dateien sind erzeugte Artefakte, werden nicht eingecheckt und nie automatisch gesendet.

Preislisten-CSV für **PH Preisliste Import** (Trenner `;`, UTF-8):

```
hersteller_artikelnr;neu;bezeichnung
DGC7865;4990,00;DGC 7865 Dampfgarer mit Backofen
```

`neu` in Euro (Komma oder Punkt) oder Spalte `neu_cent` in Cent.
