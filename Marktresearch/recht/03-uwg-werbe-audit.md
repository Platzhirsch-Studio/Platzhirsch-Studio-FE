# 03 – UWG- und Werberechts-Audit der Website platzhirsch.studio (AT / DE / CH)

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Dieses Audit ist eine fachliche Vorprüfung und keine Rechtsberatung. Offene Punkte: **[vom Unternehmen auszufüllen]** (Fakten, Belege, Verträge) und **[anwaltlich prüfen]** (Auslegungsfragen).

**Stand:** 26.10.2026 · **Rolle:** UWG- und Werberechts-Spezialist · **Geprüft:**
- **Repo** (`src/messages/*.json`, alle Landingpages `src/app/[locale]/*`, Markenseite `ueber-uns/marken/[title]`, `llms.txt`, JSON-LD in `src/app/[locale]/layout.js` und `src/lib/seo/*`, `src/lib/content/*`, neue Seiten `bewerten`, `adventsabend`).
- **Live-Website** (am 26.10.2026 per HTTP abgerufen): alle 36 Markenseiten `/de/ueber-uns/marken/*`, Startseite, Über uns, Beratung, Produkte, News-Übersicht und einzelne News-Artikel. Dabei ist auch Text aus dem **Backoffice/CMS** sichtbar geworden, der nicht im Repo steht.

**Wichtig vorab:** Die Händler-Korrekturen im Repo (Markentitel, `llms.txt`) sind **nicht committet und nicht live**. Die Live-Seite wirbt heute weiter mit „Minotti Händler Vorarlberg“, „Autorisierter Händler von über 35 … Marken“ und auf **allen 36 Markenseiten** mit „Ihr (offizieller) [Marke] Händler in Vorarlberg“ (Backoffice-Feld `dealers_description_*`).

---

## 0. Die fünf größten Risiken auf einen Blick

| # | Befund | Wo (live) | Risiko | Sofortmaßnahme |
|---|---|---|---|---|
| 1 | **„Ihr offizieller [Marke] Händler in Vorarlberg“** bei 17 Marken, „Ihr [Marke] Händler“ bei 19 weiteren. Beleg gibt es nur für ClassiCon | Backoffice `dealers_description_de/en/fr/it`, angezeigt über `src/components/MarkenItems/markenitems.js` Z. 115–116, 423–431 | **sehr hoch** (Black List, Unterlassung, Vertragsstrafe, gefährdet die Gespräche mit Minotti/Poliform) | Felder heute im Backoffice leeren oder im Code ausblenden (Allowlist) |
| 2 | **Titel „Minotti/Poliform/Tonon/Next125 Händler Vorarlberg“** und `llms.txt` „Autorisierter Händler“ | live, Repo schon korrigiert, aber nicht deployt | **sehr hoch** | Repo-Stand committen und deployen |
| 3 | **Lagerabverkauf-/Sortimentswechsel-News** (14.01.2025): „bis zu 60 % reduziert“, „statt € 47.520,- um € 27.000,-“, „statt € 43.911,-“, ohne 30-Tage-Tiefstpreis, ohne Laufzeit, Aktion seit fast zwei Jahren online | `/de/news/platzhirsch-lagerabverkauf-kuechen-betten-und-sofas`, `/de/news/sortimentswechsel-stuehle-sessel-und-accessoires` (Backoffice, 4 Sprachen) | **hoch** (§ 9a PrAG, § 11 PAngV, Lockangebot) | Depublizieren oder deutlich als „beendet“ ohne Preise kennzeichnen |
| 4 | **Alleinstellung ohne Beleg:** „größte Minotti-Ausstellung Westösterreichs“, „die größte [Ausstellung italienischer Möbel] im Umkreis von 500 Kilometern“ | News „Grand Opening“ und eine weitere News, auch in den Keywords | **hoch** | Streichen oder mit Messung belegen |
| 5 | **Pauschale Umweltaussagen** („überwiegend nachhaltig orientierte Möbelmarken“, „Nachhaltigkeit“ als Markenkern, „nachhaltig“ in fast allen Marken-Meta-Beschreibungen). Seit **27.09.2026** gelten dafür die EmpCo-Regeln | `de.json` Z. 858, 863, Backoffice-Metadaten fast aller Marken | **hoch**, neu | Pauschale Aussagen streichen, konkrete Aussagen mit Beleg verwenden |

---

## 1. Rechtsrahmen kurz (nur das, was hier gebraucht wird)

| Thema | Österreich | Deutschland | Schweiz (bei Marktauswirkung in CH, Art. 136 IPRG) |
|---|---|---|---|
| Irreführung allgemein | § 2 UWG | § 5 UWG | Art. 3 Abs. 1 lit. b UWG |
| Behauptete Zulassung / Beziehung zum Hersteller | § 2 Abs. 1 Z 7 UWG („Status, Zulassung, Beziehungen“); Anhang Z 4 (fälschlich „genehmigt/gebilligt“) | § 5 Abs. 2 Nr. 4 UWG; Anhang Nr. 4 zu § 3 Abs. 3 | Art. 3 Abs. 1 lit. b und c UWG |
| Alleinstellung („größte“, „Nr. 1“) | § 2 UWG; Beweislastumkehr § 1 Abs. 5 UWG | § 5 UWG; Beweislast faktisch beim Werbenden | Art. 3 Abs. 1 lit. b UWG |
| Vergleichende Werbung | § 2a UWG | § 6 UWG | Art. 3 Abs. 1 lit. e UWG |
| Preisermäßigung (Omnibus) | **§ 9a PrAG** (seit 20.07.2022): niedrigster Preis der letzten 30 Tage im selben Vertriebskanal angeben | **§ 11 PAngV** | **Art. 16 PBV** (Selbstvergleich: Vergleichspreis höchstens halb so lange wie vorher verlangt, max. 2 Monate, **oder** neu seit 01.01.2025 vorher mindestens 30 Tage am Stück verlangt) |
| Preisangaben allgemein | PrAG (Bruttopreise) | PAngV (Gesamtpreis inkl. USt.) | PBV Art. 3 ff.: Preis in **CHF inkl. MWST** |
| Lockangebote | Anhang Z 5 UWG | Anhang Nr. 5 UWG | Art. 3 Abs. 1 lit. f UWG |
| Bewertungen | Anhang Z 23b/23c UWG; Infopflicht zur Echtheitsprüfung (MoRUG 2022) | § 5b Abs. 3, Anhang Nr. 23b/23c UWG | Art. 3 Abs. 1 lit. b UWG (allgemein) |
| Umweltaussagen | UWG-Novelle zur RL (EU) 2024/825, NR-Beschluss 07.07.2026; Anwendung ab 27.09.2026 [BGBl-Nummer und Inkrafttreten anwaltlich prüfen] | Drittes UWG-Änderungsgesetz, verkündet Feb. 2026, gilt ab **27.09.2026** (§ 5 Abs. 3, Anhang Nr. 2a, 4a, 4b, 4c, 10a) | Art. 3 Abs. 1 lit. x UWG CH (Klimaaussagen, seit 01.01.2025: „klimaneutral“ u. ä. nur mit Belegen) [anwaltlich prüfen] |
| Herkunftsangaben | § 2 Abs. 1 Z 2 UWG (geografische Herkunft) | § 5 Abs. 2 Nr. 1 UWG, § 127 MarkenG | Art. 47–49 MSchG („Swissness“), Art. 3 lit. b UWG |
| Fremde Marken | Art. 9, 14 Abs. 1 lit. c, 15 UMV; § 10 ff. MSchG AT; EuGH C-63/97 *BMW/Deenik*, C-236/08 *Google France*, C-323/09 *Interflora*, C-558/08 *Portakabin* | wie AT, §§ 14, 23, 24 MarkenG | Art. 13 MSchG; Erschöpfung Art. 13 Abs. 2bis |
| Wer klagt | Mitbewerber, WKO/Schutzverband, VKI, AK (§ 14 UWG) | Mitbewerber, Wettbewerbszentrale, vzbv, IHK (§ 8 UWG); Abmahnung mit Kosten | Mitbewerber, Konsumentenorganisationen, Bund (SECO) |

**Praxisregel:** Eine Aussage ist dann zulässig, wenn sie am Tag der Veröffentlichung **wahr, belegbar und vollständig** ist. Platzhirsch muss den Beleg selbst vorlegen können.

---

## 2. Fundstellen: Händler- und Partner-Behauptungen

| # | Datei / Ort | Zeile | Text heute | Risiko | Vorschlag |
|---|---|---|---|---|---|
| H1 | **Backoffice** `Marken.dealers_description_de` (+ en/fr/it), ausgegeben über `src/components/MarkenItems/markenitems.js` | 115–116, 423–431 | „Platzhirsch Studio ist Ihr **offizieller** Minotti Händler in Vorarlberg …“ (ebenso Agape, Alonpi, antoniolupi, Baobab, ClassiCon, Eichholtz, Flos, Gloster, Paola Lenti, Poliform, Quasar, Rimadesio, Schüller, Tonon u. a., insgesamt 17×) | **sehr hoch**: Minotti und Poliform führen Platzhirsch nicht im Händlerverzeichnis (Bericht 16), beide Marken verhandeln gerade mit Platzhirsch (Gate 0) | Nur ClassiCon darf „offizieller Händler“ bleiben, mit Beleg [Link zum ClassiCon-Store-Locator, vom Unternehmen auszufüllen]. Alle anderen: **„Minotti in unserer Ausstellung in Lochau. Wir beraten Sie zu den Kollektionen von Minotti und planen mit Ihnen Ihren Raum.“** |
| H2 | Backoffice `dealers_description_de` | dto. | „Ihr [Marke] Händler in Vorarlberg“ (101 Copenhagen, Bombyxx, Brand van Egmond, Bullfrog, Desalto, EMU, Frost, Heatsail, Lambert, Livintwist, Next125, Papadatos, Pomax, Qeeboo, Sifas, Solpuri, Tom Dixon, Trapa, Treca, Tuuci, Umbrosa) | **mittel bis hoch**: „Händler“ ist nicht so stark wie „offizieller Händler“, wird aber als Vertriebsbeziehung verstanden. Zulässig nur, wenn Platzhirsch die Ware **direkt beim Hersteller oder beim autorisierten Importeur** bezieht | Je Marke belegen [vom Unternehmen auszufüllen: Bezugsweg]. Ohne Beleg: „[Marke] bei Platzhirsch in Lochau“ |
| H3 | Live-Titel Markenseiten (`src/app/[locale]/ueber-uns/marken/[title]/page.js`, **alter, deployter Stand**) | 26–57 (alt) | „Minotti Händler Vorarlberg“, „Poliform Dealer Vorarlberg“, „Tonon Rivenditore …“, „Next125 Küchen Händler …“ | **sehr hoch** | Der Repo-Stand ist richtig („Minotti Vorarlberg & Bodensee – Ausstellung Lochau“). **Committen und deployen.** |
| H4 | `ueber-uns/marken/[title]/page.js` | 46–49 | „**Paola Lenti Showroom Österreich**“ | **mittel**: „[Marke] Showroom [Land]“ klingt nach dem offiziellen Showroom der Marke für ganz Österreich | „Paola Lenti in Vorarlberg – Ausstellung Lochau \| Platzhirsch“ |
| H5 | `src/app/llms.txt/route.js` (**live** alt) | 18 | „**Autorisierter Händler** von über 35 internationalen Premium-Marken wie Minotti, Poliform …“ | **sehr hoch**, denn KI-Antwortmaschinen geben das weiter | Repo-Stand („Ausstellung und Beratung für über 35 …“) deployen |
| H6 | `src/lib/seo/brandSchema.js` | 7–8 (Kommentar), 50–59 | Brand-Knoten mit `@id` auf platzhirsch.studio, `logo` aus dem CMS, `sameAs` auf die Herstellerseite. Ziel laut Kommentar: der Cluster „[Marke] händler/kaufen“ | **niedrig bis mittel**: Strukturierte Daten sind Werbung. Eine eigene Brand-Entität mit Herstellerlogo kann eine Verbindung nahelegen | `logo` weglassen oder nur bei Marken mit Bildfreigabe setzen. Den Kommentar „brand-dealer cluster“ nicht als Zielvorgabe für Texte verwenden |
| H7 | `src/components/MarkenItems/markenitems.js` (Panel „SHOWROOM / DEALER“) | 415 | Code-Kommentar; das Feld `dealers_title` heißt im CMS „Minotti bei Platzhirsch Studio“ | niedrig | Der Titel ist in Ordnung. Das Problem ist die Beschreibung (H1) |
| H8 | `de.json` (+ en/fr/it) | 692, 758 | Linktext „Offizielle Website“ (zur Herstellerseite) | niedrig | In Ordnung, weil die Website des Herstellers gemeint ist. Klarer: „Website von Minotti“ |
| H9 | `kuechen-vorarlberg/page.js` | 15, 36, 44–60, 92 | „Unsere Küchenmarken“: Poliform und next125. „Im Küchenbereich **arbeiten wir mit** Poliform und next125“ | **mittel**: „arbeiten mit“ und „unsere Küchenmarken“ klingen nach Vertragsbeziehung. Schüller fehlt, obwohl er im CMS als „offizieller Schüller Händler“ steht. Die Binni-Linie fehlt noch | Formulieren: „In unserer Ausstellung zeigen wir Küchen von next125 und Schüller [vom Unternehmen auszufüllen: welche Küchen stehen tatsächlich]. Poliform-Küchen planen wir auf Anfrage“ (nur wenn Bezug gesichert) |
| H10 | `src/lib/content/homeSeo.js` | 13, 17 (+ en/fr/it 26, 30, 39, 43, 52, 56) | „Auf unserer Ausstellungsfläche stehen **Originalstücke** von Minotti, Poliform, Rimadesio …“ | **niedrig** bei echter Ausstellung | Zulässig, wenn die Stücke wirklich dort stehen [vom Unternehmen auszufüllen: Inventarliste Ausstellung je Marke] |
| H11 | `de.json` | 1123 | „**Jede Marke** ist im Showroom mit Originalstücken, Stoffen und Oberflächen vertreten – nicht nur im Katalog.“ | **mittel**: bei 36 Marken (u. a. Agape, antoniolupi, Frost, Trapa, Heatsail) nicht überprüft | Entweder belegen oder: „Die meisten unserer Marken erleben Sie im Showroom im Original. Was ausgestellt ist, sagen wir Ihnen gern vorab.“ |
| H12 | `src/lib/seo/shopSeoCopy.js` | 81–88 | „{count} Designer Sofas von … – **im Showroom in Lochau erleben**“ | **mittel**: Zahlen wie „124 Sofas“ mit „im Showroom erleben“ heißen für den Leser: alle 124 stehen dort | „{count} Designer Sofas … – Auswahl im Showroom in Lochau, alle Modelle auf Bestellung“ |
| H13 | `de.json` Partner | 594–620 | Partnerbetriebe (Immobilien, Solar, Dach, Elektro) | niedrig | Zulässig, wenn die Zusammenarbeit vereinbart ist und die Logos freigegeben sind [vom Unternehmen auszufüllen: schriftliche Zustimmung der Partner] |

**Grundsatz für alle Marken:** Markennamen dürfen genannt werden, um echte Ware anzubieten (Art. 14 Abs. 1 lit. c und Art. 15 UMV, *BMW/Deenik*). Es darf aber kein Eindruck einer Vertragshändlerschaft, Generalvertretung oder Herstellerfiliale entstehen. **Verboten** ohne Vertrag: „Händler“, „offizieller/autorisierter Händler“, „Partner“, „Vertragspartner“, „Store“, „Flagship“, „[Marke] Showroom [Region]“, Markenlogo als Siegel oder Gütezeichen.

---

## 3. Fundstellen: Alleinstellung und Superlative

| # | Datei / Ort | Zeile | Text | Risiko | Vorschlag |
|---|---|---|---|---|---|
| A1 | Backoffice News `/de/news/platzhirsch-home-living-grand-opening` (+ Keywords) | – | „… die **größte Minotti-Ausstellung Westösterreichs** feierlich zu eröffnen“ | **hoch**: Alleinstellungsbehauptung. Im Streit muss Platzhirsch belegen, dass das heute stimmt; Höttges (Dornbirn) ist gelisteter Minotti-Händler | Streichen. Oder als Zitat mit Datum: „Bei der Eröffnung 2019 sprach Alessio Minotti von …“ nur mit Beleg. Besser: „Minotti ist seit der Eröffnung 2019 ein Schwerpunkt unserer Ausstellung.“ |
| A2 | Backoffice News (Abschnitt „800 Quadratmeter“) + Keywords „größte italienische Möbelausstellung“ | – | „Die Ausstellung … mit Möbeln aus Italien ist **die größte im Umkreis von 500 Kilometern**.“ | **hoch**: 500 km umfasst Mailand (Hauptsitze, Flagships). Fast sicher unwahr | Streichen. Erlaubt: „Rund 800 m² Ausstellung in Lochau“ [vom Unternehmen auszufüllen: aktuelle Fläche] |
| A3 | `de.json` | 339 | „IHRE BESTE WAHL“ | niedrig (reine Anpreisung, nicht nachprüfbar) | Darf bleiben. Besser konkret: „Ihr Studio für Einrichtung am Bodensee“ |
| A4 | `kuechen-vorarlberg/page.js` Z. 100; `interior-design-vorarlberg/page.js` Z. 16; `wohnzimmer-einrichten-vorarlberg/page.js` Z. 32; `layout.js` Z. 54 | – | „**führender** Designmarken/Marken“ | niedrig: bezieht sich auf die Marken, nicht auf Platzhirsch | In Ordnung. Nie „führendes Einrichtungshaus“ ohne Marktdaten |
| A5 | `de.json` 226, 241, 496, 500, 508, 537, 540, 560, 570, 715, 717, 720, 744, 746, 858 (+ Übersetzungen); `kuechen-vorarlberg` 13, 23 | – | „**exklusiv(e)**“ (Marken, Outdoor-Kollektionen, Küchen, Einrichtungsstudio) | **niedrig bis mittel**: meist Anpreisung („edel“). In Verbindung mit Marken („exklusive Outdoor-Kollektionen von Minotti“, Z. 744) kann man es aber als **Exklusivvertrieb** lesen | Bei Marken ersetzen: „ausgewählte“, „hochwertige“. Z. 744: „Die Outdoor-Kollektionen von Minotti, Solpuri und EMU“ |
| A6 | `de.json` | 1113 | „Ihr Einrichtungsstudio für Vorarlberg, Bodensee und Ostschweiz“ | niedrig | In Ordnung |
| A7 | Ziel „Platz 1 im Dreiländereck“, „Nr. 1 im östlichen Bodenseeraum“ (Masterkonzept) | – | interne Ziele | – | **Nie** als Werbeaussage verwenden, auch nicht in Ads oder im Google-Profil |

---

## 4. Fundstellen: Preise, Rabatte, Aktionen

Auf der Website stehen derzeit **keine Shop-Preise** (`ShopCatalog`, `CartPage` zeigen keine Preise, `productSchema` bewusst ohne `offers`). Die Risiken liegen in den News und in Versprechen:

| # | Ort | Text | Risiko | Vorschlag |
|---|---|---|---|---|
| P1 | News `platzhirsch-lagerabverkauf-kuechen-betten-und-sofas` (14.01.2025, 4 Sprachen, indexiert) | „bis zu 60 % reduziert“, „Twelve Alea inkl. Geräte von Miele **statt € 43.911,-**“, „**statt € 47.520,- um € 27.000,-**“ | **hoch**: (1) § 9a PrAG / § 11 PAngV verlangen bei jeder Preisermäßigung den niedrigsten Preis der letzten 30 Tage. Bei Ausstellungsstücken ist das meist der frühere Ausstellungspreis, nicht der Listenpreis. (2) „statt“ verweist auf einen Preis, den Platzhirsch selbst verlangt haben muss. Eine UVP/Listenpreis muss als solche benannt werden. (3) Seit fast 2 Jahren online, ohne Ende und ohne „ausverkauft“ → Lockangebot (Anhang Z 5 AT / Nr. 5 DE). (4) „bis zu 60 %“ ist nur zulässig, wenn ein nennenswerter Teil der Ware wirklich so reduziert war | **Sofort** depublizieren oder Preise entfernen und kennzeichnen: „Diese Aktion ist beendet.“ |
| P2 | News `sortimentswechsel-stuehle-sessel-und-accessoires` | „bis zu 60 % Rabatt“ | wie P1 | wie P1 |
| P3 | `de.json` (+ en/fr/it) | 719: „**Rabatte und Aktionen, die nur für Newsletter-Abonnenten** zugänglich sind“ | **mittel**: Wenn es solche Rabatte nicht gibt, ist das irreführend. Wenn es sie gibt, gilt für bezifferte Rabatte wieder § 9a PrAG / § 11 PAngV [anwaltlich prüfen, ob ein Abonnenten-Rabatt eine „Bekanntgabe“ ist]. Außerdem darf der Newsletter-Vorteil nicht als Bedingung für die Einwilligung wirken (DSGVO Art. 7 Abs. 4) | Nur behaupten, was es gibt: „Einladungen zu Events und Hinweise auf Aktionen im Showroom“ |
| P4 | `de.json` 722 | „kostenlos, unverbindlich und jederzeit abbestellbar“ | niedrig | In Ordnung |
| P5 | Landingpages `designermoebel-appenzell` Z. 108, 112, 140–148; `-rheintal` 101–113, 140–153; `-liechtenstein` 85–89, 124–136; `-st-gallen` 73, 98; `-kempten` 77, 102; `-konstanz` 102; `-ravensburg` 101–102; `-lindau`/`-friedrichshafen` 96 | Steuer- und Zollhinweise (8,1 % MWST, Zollabbau 2024, 75-€-Grenze, 3/6 Monate) | **niedrig**: Die Aussagen sind sachlich und verweisen auf das BAZG. Ein Risiko entsteht, wenn sich ein Satz ändert (MWST CH) | „Stand: [Monat/Jahr]“ einfügen und halbjährlich prüfen. Nie „steuerfrei einkaufen“ oder „spart 20 %“ ohne Einzelfall |
| P6 | Schema `layout.js` | 65: `priceRange: "€€€"` | niedrig | In Ordnung |

**Künftig (Outlet, Gutscheine, Binni-Festpreise, CH-Preise):** siehe Regeln R-P1 bis R-P8 in Abschnitt 9.

---

## 5. Fundstellen: Herkunft, „Made in“, Italien

| # | Ort | Text | Risiko | Vorschlag |
|---|---|---|---|---|
| M1 | `de.json` 1120 / en 1138 / fr 1134 / it 1134 | „**Italienische Designmöbel**, Küchen und Licht …“ (Hero) | **mittel**: Das Sortiment ist nicht nur italienisch: ClassiCon, Bullfrog, next125, Schüller, Solpuri (DE), Tréca (FR), Eichholtz (NL), Tom Dixon (UK), Gloster, Tuuci, Trapa (AT). Mit der Binni-Linie (Kosovo) wird die Aussage falsch für den wichtigsten neuen Bereich | „Designermöbel, Küchen und Licht internationaler Marken, viele davon aus Italien …“ |
| M2 | `homeSeo.js` | 50: IT-Titel „**Mobili di design italiani** in Austria …“ | mittel (wie M1) | „Mobili di design in Austria: showroom sul Lago di Costanza …“ |
| M3 | `kuechen-vorarlberg/page.js` | 52: Poliform „Italienische Küchen“; 58: next125 „Deutsche Präzision“ | niedrig, stimmt | In Ordnung |
| M4 | Backoffice Markentexte | „100 % Made in Italy“ mit Ursprungszertifikat (Poliform), „Made in Italy“ (EMU, Qeeboo), „Made in Germany“ (Bullfrog, Schüller), „in Österreich produziert“ (Trapa) | **niedrig bis mittel**: Herstellerangaben übernommen. Platzhirsch haftet für eigene Werbung, auch wenn er nur abschreibt | Nur übernehmen, wenn der Hersteller es selbst so auf seiner Website sagt; Quelle im Claims-Register ablegen. Sonst: „Hersteller mit Sitz in …“ |
| M5 | **Binni-Linie (geplant)** | – | **hoch, wenn falsch gemacht**: Italienischer Produktname („Platzhirsch Cucina“, Bericht 26), Abbildung neben Minotti/Poliform oder Steinherkunft „Carrara“ ohne Fertigungsort = Irreführung über die Herkunft (§ 2 Abs. 1 Z 2 UWG AT, § 5 Abs. 2 Nr. 1 UWG DE) | Siehe Regeln R-H1 bis R-H6 |

---

## 6. Fundstellen: Umweltaussagen (Green Claims, neu seit 27.09.2026)

Seit **27.09.2026** gelten in AT und DE die EmpCo-Regeln (RL (EU) 2024/825). Danach sind ohne Weiteres verboten (Black List):
- **allgemeine Umweltaussagen** („nachhaltig“, „umweltfreundlich“, „grün“, „ökologisch“), wenn keine anerkannte hervorragende Umweltleistung nachgewiesen ist;
- Aussagen über das **ganze Produkt oder Unternehmen**, die nur für einen Teil stimmen;
- Nachhaltigkeitssiegel ohne Zertifizierungssystem;
- Klimaneutralität durch Kompensation.

Zukunftsaussagen („bis 2030 klimaneutral“) brauchen einen überprüften Umsetzungsplan.

| # | Ort | Text | Risiko | Vorschlag |
|---|---|---|---|---|
| G1 | `de.json` 863 (+ en 881, fr/it entspr.), erscheint auf Über-uns- **und** allen Markenseiten | „… unserer anspruchsvollen, **überwiegend nachhaltig orientierten Möbelmarken** wie Minotti, Poliform …“ | **hoch**: allgemeine Umweltaussage über das ganze Sortiment, ohne Beleg | „… unserer Möbelmarken wie Minotti, Poliform, …“. Konkretes nur auf der jeweiligen Markenseite mit Quelle |
| G2 | `de.json` 858 (+ Übers.) | „Was uns ausmacht, ist die Leidenschaft für zeitloses Design, handwerkliche Qualität und **Nachhaltigkeit**“ | **mittel bis hoch**: Unternehmensbezogene allgemeine Umweltaussage | „… zeitloses Design, handwerkliche Qualität und Möbel, die viele Jahre halten.“ (Langlebigkeit nur, wenn die Gewährleistung oder Herstellerangaben das stützen) |
| G3 | `de.json` 258 | „… Lösungen …, die **nachhaltig** im Gedächtnis bleiben“ | keine Umweltaussage (Bedeutung „dauerhaft“) | Sonst problemlos, aber der ganze Text Z. 258–261 (Mission/Vision) passt nicht: „Markenidentitäten stärken“, „Markenstrategien“ ist **Agenturtext**, der die Tätigkeit falsch beschreibt (§ 2 UWG, gering). Neu schreiben |
| G4 | Backoffice Meta-Beschreibungen/Keywords: Alonpi, Bombyxx, Bullfrog, Desalto, EMU, Frost, Gloster, Heatsail, Livintwist, Next125, Papadatos, Rimadesio, Sifas, Solpuri, Tonon, Trapa, Umbrosa | z. B. „nachhaltige Designküchen“ (Next125), „nachhaltige und **umweltfreundliche** Outdoor-Möbelmarken“ (Sifas), „stilvoll, nachhaltig & einzigartig“ (Bombyxx), „nachhaltige Infrarot-Heizsysteme“ (Heatsail), Kapitel „NACHHALTIGE FERTIGUNG/FÄRBUNG/MATERIALWAHL“ | **hoch** (Masse an Fundstellen). Für die Suche bringen sie nichts | Pauschalwörter in **allen** Backoffice-Feldern (Meta, Keywords, Texte) streichen. Ersetzen durch belegte Einzelfakten mit Quelle, z. B. „Teak aus FSC-zertifizierten Plantagen“ (nur mit Lizenznummer oder Herstellerbeleg), „Rahmen zu rund 65 % aus recyceltem Aluminium (Herstellerangabe Rimadesio, Stand …)“ |
| G5 | Backoffice Agape | „nach **LEED-zertifizierten**, umweltverantwortlichen Standards“ | **mittel**: LEED zertifiziert Gebäude, keine Produkte. Klingt nach Produktsiegel | Nur übernehmen, wenn Agape es genau so sagt. Dann: „Produktionsstätte nach LEED zertifiziert (Angabe Agape)“ |
| G6 | News `paola-lenti-technologie-und-nachhaltigkeit` | „tiefes Bewusstsein für die Umwelt“, „setzt Maßstäbe in der Branche“ | **mittel** | Konkretisieren („recycelbare Garne der Kollektion …, Herstellerangabe“) oder Satz streichen |
| G7 | Bildname `schueller-green-kitchen` | – | keine Aussage (Farbe) | – |

---

## 7. Fundstellen: Leistungsversprechen (Lieferung, Montage, Gebiet)

| # | Ort | Text | Risiko | Vorschlag |
|---|---|---|---|---|
| L1 | `de.json` 1107, en 1125, fr 1121, it 1121 | Trust-Leiste: „**Lieferung & Montage in AT · DE · CH**“ | **mittel bis hoch**: Widerspricht der restlichen Website („für DE/CH sprechen Sie uns an“, Benefits Z. 277, homeSeo Z. 14/18, alle Landingpages). Montage in CH braucht Meldeverfahren und Entsendung (Bericht 18), CH-Lieferservice ist nur geplant | „Lieferung & Montage in Österreich · DE, CH, FL auf Anfrage“ |
| L2 | `de.json` 1124, 1125 | „Alle Stücke … liefern sie **montiert**“, „Wir kommen zu Ihnen – zum Ausmessen, Planen und Montieren“ | niedrig bis mittel (Accessoires, Kerzen, Abholung) | „Möbel liefern und montieren wir auf Wunsch“ |
| L3 | `de.json` 777 | „österreichweiter Lieferservice“, „Katalog-Bestellungen“ | niedrig | In Ordnung |
| L4 | `layout.js` 75–81 | `areaServed`: AT, DE, CH, FL | niedrig: Beratung von Kunden aus diesen Ländern stimmt | In Ordnung, solange L1 korrigiert ist |
| L5 | `designermoebel-feldkirch` 103 | „Fallen … Zoll oder ausländische Steuern an? **Nein.**“ | niedrig, stimmt (Inland) | In Ordnung |
| L6 | `designermoebel-liechtenstein` 97 | Meldeverfahren FL „ohne die achttägige Wartefrist“ | niedrig bis mittel: Rechtsauskunft auf der Website | [anwaltlich prüfen] und „Stand“ angeben |

---

## 8. Bewertungen, Vergleichswerbung, Fremdmarken in Ads/URLs

**Bewertungen (Fundstelle `src/app/[locale]/bewerten/page.js`, neu, nicht live):**
- Die Seite zeigt allen Besuchern beide Wege, „Auf Google bewerten“ und „Lieber direkt an uns?“. Das ist in Ordnung.
- **Kein Review-Gating:** Die Seite darf nicht nur an zufriedene Kunden gehen. Ein Filter wie „Zufrieden? → Google, unzufrieden? → E-Mail“ ist ebenfalls verboten (Google-Richtlinie, unlautere Irreführung über repräsentative Bewertungen).
- Für die Bewertung gibt es **keine Gegenleistung** (Gutschein, Verlosung), es sei denn, sie wird offengelegt und nicht vom Inhalt der Bewertung abhängig gemacht. Empfehlung: gar keine Gegenleistung.
- Werden Sterne oder Zitate auf der Website gezeigt, braucht es einen Hinweis direkt dabei: „Bewertungen von Google. Google prüft nicht, ob die Bewerter bei uns gekauft haben. Wir zeigen alle Bewertungen ungefiltert, sortiert nach Datum.“ (AT Anhang Z 23b/c, DE § 5b Abs. 3 UWG).
- **Kein `aggregateRating` im JSON-LD** für den eigenen LocalBusiness-Eintrag. Google wertet es ohnehin nicht aus (Self-serving Reviews), und es birgt nur Risiko.
- Bewertungsbitten per E-Mail sind Werbung. Siehe Bericht `digital/14`, F11, und `recht/06`.

**Vergleichswerbung:** Auf der Website wurde **keine** gefunden. Gut so. Künftig:
- Höttges, reiter, Fretz, Gamma u. a. nicht namentlich nennen.
- Keine Formulierungen wie „im Gegensatz zu anderen“, „günstiger als in der Schweiz“.
- Preisvergleiche AT/CH nur mit konkretem, belegtem Beispiel und Datum, und nur ohne Herabsetzung (§ 2a UWG AT, § 6 UWG DE, Art. 3 lit. e UWG CH).

**Fremdmarken in URLs und Ads:**
- URLs `/ueber-uns/marken/minotti`, `/produkte/minotti` sind in Ordnung: Sie beschreiben, welche Ware angeboten wird.
- **Nicht** registrieren oder verwenden: Domains/Subdomains/Profile mit Marke + Ort (z. B. `minotti-vorarlberg.at`, `poliform-bodensee.de`, Instagram „@minotti.lochau“). Das verletzt das Markenrecht und erweckt den Eindruck eines Händlers.
- **Google/Meta Ads:** Markennamen als Keyword sind grundsätzlich zulässig (*Google France*, *Interflora*). Im **Anzeigentext** gilt:
  - kein „Händler“, „offiziell“, „Store“;
  - Formulierung: „Minotti in der Ausstellung Lochau – Beratung & Planung“;
  - die Landingpage muss die Marke tatsächlich zeigen;
  - Markeninhaber können über die Google-Markenbeschwerde den Markennamen im Anzeigentext sperren lassen [je Marke prüfen].
  - Wettbewerbernamen nicht als Keyword verwenden (rechtlich möglich, in der kleinen Region aber ein Imagerisiko).
- **Logos:** Herstellerlogos nur nach Freigabe [vom Unternehmen auszufüllen: Freigaben je Marke]. Nie als „Partnerleiste“ unter der Überschrift „Unsere Partner“.

---

## 9. Regeln für künftige Texte (verbindlich für Website, Backoffice, Ads, Google-Profil, Social, KI-Concierge)

### Händler und Marken
- **R-M1:** „Händler“, „offiziell“, „autorisiert“, „Partner“, „Vertretung“, „Store“ nur für Marken in der Allowlist. Stand heute ist das **nur ClassiCon**. Neue Marken kommen erst mit schriftlichem Vertrag oder Eintrag im Herstellerverzeichnis dazu (Beleg ins Claims-Register).
- **R-M2:** Standardformel ohne Vertrag: „[Marke] in unserer Ausstellung in Lochau“, „Wir beraten und planen mit [Marke]“, „Kollektionen von [Marke] auf Bestellung“.
- **R-M3:** Das Backoffice ist Werbung. Felder `dealers_title`, `dealers_description_*`, `metadata_*`, `keywords_*`, News-Texte gehen vor der Veröffentlichung durch dieselbe Prüfung wie Code.
- **R-M4:** Der KI-Concierge bekommt dieselben Verbote im System-Prompt und einen Ausgabefilter (Händler, Rabatt, Lieferzusage, „größte“).

### Alleinstellung
- **R-A1:** Keine Aussagen wie „größte“, „führend“, „Nr. 1“, „einzig“, „erste“, „beste“ über Platzhirsch. Ausnahme: Es liegt ein schriftlicher, datierter Beleg vor (Messung, Vergleich, Quelle), der regelmäßig erneuert wird.
- **R-A2:** Fakten statt Superlativ: „rund 800 m² Ausstellung“, „36 Marken“, „seit 2019 in Lochau“ [vom Unternehmen auszufüllen: Zahlen bestätigen].
- **R-A3:** „exklusiv“ nie in Verbindung mit einer Marke oder einem Gebiet verwenden.

### Preise und Rabatte (Outlet, Gutschein-Shop, Binni, Aktionen)
- **R-P1:** Jeder angezeigte Preis ist ein **Endpreis inkl. USt.** In AT/DE in EUR. Für Konsumenten in CH zusätzlich in **CHF inkl. MWST** oder klar als „unverbindliche Umrechnung“ gekennzeichnet (PBV Art. 3 ff.) [anwaltlich prüfen, ob die PBV für einen AT-Anbieter mit CH-Zielseite gilt].
- **R-P2:** Bei jeder Preisermäßigung (Prozent, Betrag, „statt“, durchgestrichener Preis, „Sale“-Hervorhebung) zusätzlich angeben: **„Niedrigster Preis der letzten 30 Tage: … €“** (§ 9a PrAG, § 11 PAngV, EuGH C-330/23 *Aldi Süd*). Online und Showroom sind getrennte Vertriebskanäle.
- **R-P3:** Bei Outlet- und Ausstellungsstücken gilt als Bezugspreis der eigene frühere Verkaufspreis. Eine UVP darf daneben nur stehen, wenn sie als „unverbindliche Preisempfehlung des Herstellers“ bezeichnet ist und tatsächlich besteht. Für CH beim Selbstvergleich Art. 16 PBV beachten (½ der Zeit / max. 2 Monate oder 30-Tage-Regel).
- **R-P4:** Jede Aktion hat Start- und Enddatum. Danach wird sie automatisch depubliziert oder als „beendet“ angezeigt. Bei Einzelstücken: Stückzahl und „verkauft“-Status. Kein „nur noch heute“, wenn es morgen weitergeht (Black List Z 7 AT / Nr. 7 DE).
- **R-P5:** „bis zu X %“ nur, wenn ein relevanter Teil des Angebots wirklich X % reduziert ist [anwaltlich prüfen: Rechtsprechung verlangt nicht unerheblichen Anteil].
- **R-P6:** „ab … €“ bei Binni-Küchen nur mit genau beschriebener Beispielkonfiguration (Maße, Fronten, Stein, Geräte, Montage ja/nein, Lieferung), die man zu diesem Preis wirklich kaufen kann.
- **R-P7:** Gutscheine: Wert, Gültigkeit (in AT 30 Jahre Verjährung; Befristung kürzer nur sachlich gerechtfertigt [anwaltlich prüfen]), Einlösebedingungen klar angeben. Siehe `recht/06`.
- **R-P8:** „0 % Finanzierung“ nur mit Standardinformationen und repräsentativem Beispiel (§ 5 VKrG AT, § 17 PAngV DE) und mit geklärter Kreditvermittler-Berechtigung.
- **R-P9:** Keine Fake-Knappheit, keine Countdown-Timer, keine „X Personen sehen sich das gerade an“ (Dark Patterns, Black List).

### Herkunft und Binni
- **R-H1:** Fertigungsort klar und gut sichtbar nennen: **„Gefertigt von unserem Manufakturpartner Binni in Kosovo“**. Nicht im Kleingedruckten verstecken.
- **R-H2:** Kein italienisch oder französisch klingender Produktname für die Binni-Linie („Cucina“, „Atelier Milano“). Die Gesamtaufmachung darf keine italienische Herkunft nahelegen. Empfehlung: deutsch- oder neutralsprachiger Name [Markenrecherche vom Unternehmen auszufüllen].
- **R-H3:** Stein getrennt angeben: „Arbeitsplatte aus [Gestein], Herkunft [Bruch/Land], verarbeitet in Kosovo“ [vom Unternehmen auszufüllen: Steinarten und Herkunft je Sorte].
- **R-H4:** „Manufaktur“ und „handgefertigt“ nur, wenn ein wesentlicher Teil handwerklich gefertigt wird [vom Unternehmen auszufüllen: Fertigungsbeschreibung Binni]. „Design aus Vorarlberg“ nur, wenn der Entwurf wirklich von Platzhirsch stammt.
- **R-H5:** Binni-Küchen nicht neben Minotti/Poliform so zeigen, dass man sie für Teil dieser Marken halten könnte. Eigene Seite, eigene Bildsprache.
- **R-H6:** „Made in EU“ ist falsch (Kosovo ist nicht in der EU). „Europäische Fertigung“ ist zulässig, aber nur zusammen mit R-H1. Für CH-Kunden kein „Swiss“-Bezug (Art. 47 ff. MSchG).

### Umwelt
- **R-G1:** Keine Pauschalwörter: nachhaltig, umweltfreundlich, grün, öko, klimaneutral, CO₂-neutral, „bewusst“, „verantwortungsvoll“.
- **R-G2:** Nur konkrete, belegte Einzelaussagen mit Quelle und Bezug auf ein bestimmtes Produkt („Gestell aus 65 % recyceltem Aluminium – Angabe Rimadesio, Stand 10/2026“). Siegel nur, wenn das Produkt sie wirklich trägt (FSC/PEFC mit Lizenznummer, Blauer Engel, EU Ecolabel).
- **R-G3:** Langlebigkeit nur mit Fakten: Gewährleistung, Herstellergarantie mit Bedingungen, Ersatzteil- oder Aufpolsterservice.
- **R-G4:** Kein Klimaneutralitätsversprechen für den Betrieb, Lieferungen oder Events.

### Bewertungen und Social Proof
- **R-B1:** Nur echte Kundenbewertungen. Keine selbst geschriebenen oder gekauften. Kein Filter nach positiv/negativ. Hinweis zur Echtheitsprüfung direkt bei der Anzeige.
- **R-B2:** Referenzprojekte, Kundenzitate und Fotos nur mit schriftlicher Zustimmung. Stockfotos nie als „unser Projekt“ zeigen. Visualisierungen (KI-Raumplaner) als solche kennzeichnen.
- **R-B3:** Influencer und Kooperationen kennzeichnen („Werbung/Anzeige“), auch bei Sachleistungen (§ 6 ECG/MedienG AT, § 5a Abs. 4 UWG DE).

### Leistungsversprechen
- **R-L1:** Lieferung und Montage nur dort versprechen, wo sie wirklich angeboten werden. Heute ist das AT. DE, CH und FL: „auf Anfrage“, bis ein Prozess steht.
- **R-L2:** Lieferzeiten nie pauschal versprechen („in 48 Stunden“), nur „voraussichtlich, verbindlich in der Auftragsbestätigung“.
- **R-L3:** Steuer- und Zollhinweise mit „Stand“ datieren. Keine Sparversprechen („20 % sparen“).

### Prozess
- **R-X1:** **Claims-Register** (z. B. `src/lib/legal/claims.js` oder Tabelle) mit Spalten: Aussage, Beleg, Quelle, Datum, Prüfer, Ablauf.
- **R-X2:** **Lint- und Review-Liste** für Code und Backoffice-Export: händler|dealer|revendeur|rivenditore|offiziell|official|autoris|größte|grösste|largest|führende[sr]? (Händler|Anbieter|Studio)|Nr\. ?1|einzig|nachhaltig|sustainab|umweltfreundlich|klimaneutral|statt €|bis zu \d+ ?%|Made in.
- **R-X3:** Zweimal im Jahr ein vollständiger Live-Scan aller Seiten (wie in diesem Audit), zusätzlich bei jedem neuen Händlervertrag, Rechtsträgerwechsel (Ausgliederung in die Handels-GmbH) und Aktionsstart.

---

## 10. Sonstige Beobachtungen mit UWG-Bezug

- **Rechtsträger:** Nach der geplanten Ausgliederung muss die Handels-GmbH als Werbender genannt werden (Impressum, E-Mails, Ads-Konten). Aussagen wie „seit 2019“ gelten dann für die Marke Platzhirsch, nicht für die neue GmbH. Formulieren: „Platzhirsch Home Living – seit 2019 in Lochau“ [anwaltlich prüfen]. Siehe `recht/04`.
- **Hausnummer 9/11:** In Code und Schema steht einheitlich „Landstraße 9“. Firmenbuch und Google-Profil angleichen [vom Unternehmen auszufüllen].
- **Presse** (`de.json` 570): „exklusives Bildmaterial“ zum Download nur mit eigenen Bildern oder Bildern mit Weitergaberecht. Herstellerbilder sind meist nicht an Dritte weiterlizenzierbar.
- **Alte News 2022–2025** (Kollektion 2022, Gartensaison 2023, Öffnungszeiten 2023/24) mit Aktionen oder Terminen: archivieren oder datieren. Veraltete Angebote wirken als Lockangebot.
- **Englisch/Französisch/Italienisch:** Dieselben Befunde gelten in allen Sprachen, auch im Backoffice (`dealers_description_en/fr/it`, Keywords „official dealer“, „revendeur“). Jede Korrektur in allen vier Sprachen ausführen.

---

## 11. Maßnahmenliste nach Priorität

| Prio | Maßnahme | Aufwand | Wer |
|---|---|---|---|
| 1 (heute) | Backoffice: `dealers_description_*` aller Marken außer ClassiCon auf die Standardformel umstellen. Übergangsweise im Code nur Allowlist rendern (`markenitems.js` Z. 115–116) | S | Backoffice + Dev |
| 1 (heute) | Repo-Stand Markentitel und `llms.txt` committen und deployen | S | Dev |
| 1 (heute) | News Lagerabverkauf und Sortimentswechsel depublizieren oder Preise entfernen | S | Backoffice |
| 2 (Woche 1) | News „Grand Opening“ und 800-m²-Text: Superlative streichen | S | Backoffice |
| 2 (Woche 1) | `de.json` 863 und 858 (+ 3 Sprachen): Nachhaltigkeitsaussagen streichen. Backoffice-Metas und Keywords aller Marken bereinigen | M | Text + Backoffice |
| 2 (Woche 1) | Trust-Leiste 1107 (+ 3 Sprachen) auf „AT · DE/CH/FL auf Anfrage“; Hero 1120 und `homeSeo.js` Z. 50 „italienisch“ relativieren; 1123 „Jede Marke“ belegen oder abschwächen; 719 Newsletter-Rabatte | S | Text |
| 3 (Monat 1) | Claims-Register, Lint-Regel, Backoffice-Freigabeprozess | M | Dev + Inhaber |
| 3 (vor Start) | Preis-/Rabattlogik für Outlet und Shop mit 30-Tage-Tiefstpreis-Speicherung je Kanal; CHF-Anzeige; Binni-Herkunftsangaben | M–L | Dev + Anwalt |

---

## 12. Was der Inhaber liefern oder entscheiden muss

1. **Händlerstatus je Marke** (36 Marken): Bezugsweg (direkt vom Hersteller, über einen Importeur oder über einen anderen Händler), Vertrag ja/nein, Eintrag im Herstellerverzeichnis. [vom Unternehmen auszufüllen]
2. **Ausstellungsinventar:** Welche Marken stehen wirklich im Showroom? Aktuelle Fläche in m². [vom Unternehmen auszufüllen]
3. **Entscheidung:** Die Lagerabverkauf-News löschen oder nur als beendet kennzeichnen. Gibt es den Newsletter-Rabatt wirklich?
4. **Liefergebiet:** Wird heute in DE, CH und FL tatsächlich geliefert und montiert? Wenn ja, unter welchen Bedingungen?
5. **Binni:** Produktname, Fertigungsorte, Steinherkunft je Sorte, Anteil Handarbeit, Designer. Freigabe der Formel „gefertigt von Binni in Kosovo“.
6. **Logo- und Bildfreigaben** der Hersteller und der Partnerbetriebe.
7. **Backoffice-Zugang** oder Zuständigkeit für die Bereinigung der CMS-Texte in vier Sprachen.
8. **Anwaltliche Prüfung** der mit [anwaltlich prüfen] markierten Punkte, vor allem: Bestand des AT-Umsetzungsgesetzes zu EmpCo, Anwendbarkeit der PBV für CH-Kunden, Gutscheinbefristung, Outlet-Preislogik.

---

## Quellen

**Gesetze und Behörden**
- RIS – UWG AT: <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002665>
- RIS – Preisauszeichnungsgesetz AT (§ 9a): <https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10007222>
- BMWET – Preisauszeichnung: <https://www.bmwet.gv.at/Themen/Europa/Wettbewerbspolitik/Preisauszeichnung.html>
- WKO – Änderungen in § 9a PrAG (Einrichtungsfachhandel): <https://www.wko.at/handel/elektro-einrichtungsfachhandel/aenderungen-in-9a-preisauszeichnungsgesetz>
- Parlament AT – Bericht Wirtschaftsausschuss BR zur UWG-Änderung (RL 2024/825, NR-Beschluss 07.07.2026): <https://www.parlament.gv.at/dokument/BR/I-BR/11863/fname_1772085.pdf>
- gesetze-im-internet – UWG DE: <https://www.gesetze-im-internet.de/uwg_2004/>
- gesetze-im-internet – PAngV (§ 11): <https://www.gesetze-im-internet.de/pangv_2022/__11.html>
- Bundesrat DE – Regierungsentwurf Drittes UWG-Änderungsgesetz, Drs. 438/25: <https://dserver.bundestag.de/brd/2025/0438-25.pdf>
- Bundestag – Drs. 21/3327: <https://dserver.bundestag.de/btd/21/033/2103327.pdf>
- fedlex – UWG CH (SR 241): <https://www.fedlex.admin.ch/eli/cc/1988/223_223_223/de>
- fedlex – PBV (SR 942.211): <https://www.fedlex.admin.ch/eli/cc/1978/1640_1640_1640/de>
- SECO – Informationsblatt Selbstvergleich Art. 16 PBV: <https://www.seco.admin.ch/dam/seco/de/dokumente/Werbe_Geschaeftsmethoden/Preisbekanntgabe/PBV-%20Selbstvergleich%20nach%20Art.%2016%20DE.pdf.download.pdf/PBV-%20Selbstvergleich%20nach%20Art.%2016%20DE.pdf>
- Handelsverband Schweiz – Vereinfachung Selbstvergleich (30-Tage-Regel ab 01.01.2025): <https://handelsverband.swiss/?p=54860>
- EUR-Lex – RL (EU) 2024/825 (EmpCo): <https://eur-lex.europa.eu/eli/dir/2024/825/oj>
- EUR-Lex – UMV 2017/1001: <https://eur-lex.europa.eu/eli/reg/2017/1001/oj>

**Rechtsprechung**
- EuGH C-330/23 *Aldi Süd* (26.09.2024), Preisermäßigung und 30-Tage-Preis
- EuGH C-63/97 *BMW/Deenik*; C-236/08 *Google France*; C-323/09 *Interflora*; C-558/08 *Portakabin*

**Fachbeiträge**
- Taylor Wessing – Amendment to the German Unfair Competition Act (02/2026): <https://www.taylorwessing.com/de/insights-and-events/insights/2026/02/amendment-to-the-german-unfair-competition-act>
- Osborne Clarke – Greenwashing und Green Claims: <https://www.osborneclarke.com/de/insights/greenwashing-und-green-claims-neuer-rechtsrahmen-fuer-nachhaltigkeitskommunikation>
- CHEManager – UWG-Novelle zur EmpCo-Richtlinie: <https://chemanager-online.com/de/themen/uwg-novelle-zur-empco-richtlinie-verschaerft-die-anforderungen-an-umweltaussagen>
- Vienna.at – neue Regeln für Umweltwerbung ab 27.09.2026: <https://www.vienna.at/diese-begriffe-sind-auf-verpackungen-bald-verboten/10403519>
- Retailreport/Handelsverband – Werben mit Rabatten (10/2025): <https://retailreport.at/sites/default/files/2025-11/2025-10-werben-mit-rabatten.pdf>

**Interne Berichte:** 00, 16 (Händlerverzeichnisse), 18 (Schweiz), 23, 26 (Binni), `digital/14` (Recht & Compliance, R12/R13, F2, F11), `recht/04`, `recht/06`.

**Live-Abruf** platzhirsch.studio am 26.10.2026: 36 Markenseiten, `/llms.txt`, Start-, Über-uns-, Beratungs-, Produkt- und News-Seiten. Die Rohdaten liegen im Scratchpad dieser Sitzung und sind nicht Teil des Repos.
