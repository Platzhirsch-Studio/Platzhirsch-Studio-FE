# Ratgeber: offene Prüfstellen der 5 nicht freigegebenen Artikel

**Stand:** 29.10.2026 · Team Ratgeber (Welle 2)

Freigegeben am 29.10.2026 (Inhaber-Auftrag): `was-kostet-ein-minotti-sofa`, `was-kostet-eine-designerkueche`, `moebel-aus-oesterreich-in-die-schweiz`. Die Artikel enthalten keine Marker mehr. Die Details stehen jeweils im Prüfvermerk am Ende der Datei.

Die folgenden 5 Artikel bleiben Entwurf: in Produktion 404, im Dev-Modus `noindex`. Der Review-Filter blendet jede markierte Stelle aus. Zeilennummern beziehen sich auf `src/content/ratgeber/<datei>.md`.

Für alle fünf gilt: `reviewedBy` ist leer. Die Zeile „Geprüft von [Name, Funktion]“ wird ersetzt, sobald der Inhaber einen Prüfer nennt, oder durch eine Stand-Zeile wie in den freigegebenen Artikeln. Lieferung und Montage formulieren wir nach Inhaber-Entscheidung Nr. 3: „auf Wunsch“, keine Zusage für bestimmte Länder, kein „eigenes Team“. Ausstellungsstand nennen wir nur als „sagen wir Ihnen vorab am Telefon“. Händler-Aussagen sind nur für ClassiCon und Ezarri erlaubt.

## designmoebel-pflegen-leder-stoff-holz
| Zeile | Stelle | Wer / wie |
|---|---|---|
| 81 | Aufarbeitung von Leder: Verfahren im Detail nicht in der DGM-Quelle | Quelle suchen oder Satz streichen |
| 120 | „Trockenrisse naturbedingt“: Aussage von TEAM 7 nicht abrufbar | Quelle (TEAM 7 / Holzforschung) oder weich formulieren |
| 134 | Imprägnierung von Marmor schützt nicht vor Säure | Quelle (Steinmetz-Fachverband / Hersteller) ergänzen |
| 149 | Ausstellung (Minotti, weitere Marken) | auf „vorab am Telefon“ umstellen |
| 155 | Öffnungszeiten (längere Samstagszeiten im Test) | mit src/lib/site.js abgleichen |

## designsofa-kaufen-checkliste
| Zeile | Stelle | Wer / wie |
|---|---|---|
| 171 | „Geprüft von [Name, Funktion]“ | Prüfer nennen oder Stand-Zeile. Danach ist der Artikel freigabefähig, Faktencheck-Tool: 30 Zahlen „unbelegt“ zeilenweise prüfen |

## kuechenarbeitsplatte-marmor-keramik-quarz
| Zeile | Stelle | Wer / wie |
|---|---|---|
| 17 | Status: Fachprüfung Küchenplanung/Steinmetz | Fachprüfung |
| 57, 60 | Quarzkomposit: Säure, Kanten | Herstellerangaben (Caesarstone, Silestone) |
| 75 | Säure auf Marmor/Kalkstein: matte Flecken | Fachprüfung Steinmetz oder Quelle |
| 94 | Dekor nur an der Oberfläche | je Serie aus dem Datenblatt |
| 131 | „planen Küchen von next125/Schüller, zeigen Poliform/Varenna“ | Bezugsweg klären, keine Händler-Aussage. Formulierung wie im freigegebenen Küchen-Artikel |
| 133 | Abschnitt über den Manufakturpartner (Embargo, Bericht 26) | bis zur Vertragsklärung streichen |
| 140 | „eigenes Team“, Liechtenstein | Inhaber Nr. 3: „auf Wunsch“ |

## lieferzeiten-italienische-designmoebel
| Zeile | Stelle | Wer / wie |
|---|---|---|
| 55 | Liefertermin als Kalenderwoche | mit echten Auftragsbestätigungen abgleichen |
| 97 | Transport aus Italien | Erfahrungswert des Teams oder Zeile streichen |
| 129 | Küchenmarken und Embargo-Absatz | streichen bzw. „vorab am Telefon“ |
| 133 | Marken der Ausstellung (Minotti, Poliform, Rimadesio, Paola Lenti) | Ausstellungsstand nicht behaupten |
| 140 | Leistungsliste | mit der Geschäftsführung abstimmen |
| 166 | „Geprüft von [Name, Funktion]“ | Prüfer oder Stand-Zeile |

## outdoor-moebel-am-see-material
| Zeile | Stelle | Wer / wie |
|---|---|---|
| 70 | Gebürstete Oberflächen halten Schmutz eher fest | Quelle (Edelstahl-Merkblatt) oder streichen |
| 82 | Paola Lenti: Garne Rope/Aquatech (Herstellerangaben) | Quelle verlinken |
| 123 | Outdoor-Markenliste der Ausstellung | Ausstellungsstand nicht behaupten |
| 153 | „Geprüft von [Name, Funktion]“ | Prüfer oder Stand-Zeile |

## Für alle Artikel, auch die freigegebenen
- `node tools/content/check-facts.mjs` meldet Zahlen in Tabellenzeilen als „unbelegt“, weil das Tool zeilenweise prüft. Die Quelle steht bei uns im Absatz über der Tabelle. Das ist kein Release-Gate, denn `--strict` prüft nur die Messages. Für `--strict=all` müssten Zeilen in `tools/content/facts.json` ergänzt werden.
- Empfehlung: Den Schweiz-Artikel vor bezahlter Bewerbung von Steuerberatung oder Spediteur gegenlesen lassen.
