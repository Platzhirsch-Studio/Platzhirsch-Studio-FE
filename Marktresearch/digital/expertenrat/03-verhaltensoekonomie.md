# 03 – Verhaltensökonomie: Entscheidungsarchitektur ohne Manipulation

**Rolle:** Verhaltensökonom im Expertenrat · **Stand:** 26.10.2026 · **Bezug:** digital/01, 02, 12, 13, 14; 23-Masterkonzept Abschnitt 4

> **Leitsatz:** Wer 15.000 € für ein Sofa ausgibt, kauft vor allem *Sicherheit*: Er will sicher sein, das Richtige gewählt zu haben, den richtigen Preis zu zahlen und dem richtigen Haus zu vertrauen. Jeder Baustein der Website soll eine dieser drei Unsicherheiten verringern. Kein Baustein darf Druck erzeugen. Druck bringt kurzfristig Klicks. Bei einem Kaufzyklus von 8–16 Wochen und Empfehlungsgeschäft zerstört er die Marge, die Platzhirsch über Vertrauen verdient (Positionierungssatz: „Festpreis … sichern Ihre Anzahlung ab … im Café, nicht im Lager“).

**Zur Prüfung der Prototypen:** Am 26.10.2026 lagen unter `src/components/Preview/galerie/` nur `Logo.js`, `content.js` und `fonts.js` vor. `/de/preview/galerie` antwortete mit 404, `buehne` und `dreilaendereck` gab es noch nicht. Die Checkliste in Abschnitt 5 ist deshalb so gebaut, dass man sie nach Fertigstellung direkt anwenden kann. Eine Bewertung der Prototypen ist in diesem Dokument noch nicht enthalten.

---

## 1. Die 9 wichtigsten Erkenntnisse für dieses Projekt

| # | Erkenntnis | Bedeutung für Platzhirsch | Quelle |
|---|---|---|---|
| E1 | **Choice Overload gibt es, aber nur unter bestimmten Bedingungen.** Die Meta-Analyse über 99 Effekte (N = 7.202) nennt vier Verstärker: komplexes Sortiment, schwere Aufgabe, unklare eigene Präferenz und das Ziel, Aufwand zu sparen. Die Folgen sind messbar: Kunden schieben die Entscheidung auf, bereuen sie häufiger und sind weniger zufrieden. Eine frühere Meta-Analyse fand im Mittel fast keinen Effekt, aber eine große Streuung zwischen den Studien. | Bei 1.765 Produkten kommen alle vier Verstärker zusammen: Ein Bauherr kennt seine Präferenz noch nicht, die Aufgabe (ganze Wohnung) ist schwer, die Modulsofas sind komplex. Die Antwort ist **nicht weniger Sortiment, sondern ein kuratierter Einstieg** und der volle Katalog als zweite Ebene. | Chernev, Böckenholt & Goodman 2015, *J. Consumer Psychology* 25(2) ([Kellogg](https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual)); Scheibehenne et al. 2010 ([PDF](https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.options.2010.pdf)) |
| E2 | **Defaults wirken stark:** im Mittel d = 0,68 über 58 Studien, im Konsumbereich stärker als anderswo. Am besten wirken sie, wenn der Nutzer sie als **Empfehlung** versteht oder als etwas, das ihm schon gehört. | Voreinstellungen sind nie neutral, deshalb muss jede eine ehrliche Empfehlung sein: Währung nach Land, Termin „vor Ort im Café, 60 min“, Newsletter **nicht** vorangekreuzt. | Jachimowicz et al. 2019, *Behavioural Public Policy* 3(2) ([RePEc](https://ideas.repec.org/a/cup/bpubpo/v3y2019i02p159-186_00.html)) |
| E3 | **Der erste Preis wird zum Anker.** Die erste Zahl prägt die Einschätzung aller folgenden Zahlen, auch wenn sie nichts damit zu tun hat (Anchoring and Adjustment). Eine Mittel-Option zwischen zwei Extremen wird überproportional gewählt (Compromise Effect). | „ab“-Preise und Pakete setzen den Anker. Der Anker muss **eine real bestellbare Ausführung** sein (Recht: 14, F4). Pakete in drei Stufen sind zulässig und hilfreich, wenn jede Stufe für sich ein ehrliches Angebot ist und keine Attrappe, die nur eine andere Stufe gut aussehen lassen soll. | Tversky & Kahneman 1974, *Science* 185; Simonson 1989, *J. Consumer Research* 16; Huber, Payne & Puto 1982, *JCR* 9 |
| E4 | **Runde Preise wirken über das Gefühl, krumme über den Verstand.** Bei hedonischen Käufen schneiden runde Preise besser ab, bei nutzenorientierten die nicht gerundeten. | Ein Sofa, eine Leuchte oder ein Gutschein ist ein Gefühlskauf, also **runde Preise** („ab 9.400 €“). Die Küche mit Steinplatte wird rational verglichen, also **genaue Preise mit Aufschlüsselung** („Arbeitsplatte Binni, 3 cm, 4,20 m: 2.380 €“). Preise auf ,99 sind für eine Luxusmarke tabu. | Wadhwa & Zhang 2015, *JCR* 41(5) ([PDF](https://wiki.agepoly.ch/finance/sponsoring/wadhwa-zhang-2015.pdf)) |
| E5 | **Der Nennwert einer Währung verzerrt das Preisgefühl:** Wie teuer etwas wirkt, hängt von der Zahl ab, nicht vom Wert. CHF und EUR stehen heute fast 1:1. Darin liegt eine Chance: Schweizer Kunden sehen fast dieselbe Zahl wie zuhause und erkennen den Preisvorteil sofort. | Für CH-Kunden den Preis in **CHF inkl. 8,1 % MWST, Verzollung und Lieferung** zeigen, also in der Währung, in der sie denken. Einen EUR-Preis ohne Abgaben würden sie im Kopf falsch umrechnen und später bei der Rechnung als Täuschung erleben. | Raghubir & Srivastava 2002, *JCR* 29(3) ([RePEc](https://ideas.repec.org/a/eee/jbrese/v66y2013i6p745-751.html) zitiert); Recht: PBV (CH), 14 F4 |
| E6 | **Bewertungen wirken bei teuren, risikoreichen Käufen am stärksten.** Die Kaufwahrscheinlichkeit ist bei einem Schnitt von 4,2–4,5 am höchsten, bei 5,0 sinkt sie wieder („zu schön, um wahr zu sein“). Einzelne kritische Stimmen *erhöhen* die Glaubwürdigkeit. | Ehrlichen Social Proof zeigen: **alle** Google-Bewertungen mit Link, auch die mit 3 Sternen, und dazu die Antwort des Hauses. Nicht nur 5-Sterne-Zitate auswählen. Gesetzlich verlangt ist ein Hinweis, ob die Bewertungen geprüft werden (Omnibus-RL, 14 F11). | Spiegel Research Center / PowerReviews 2017 „From Reviews to Revenue“ ([Retail TouchPoints](https://www.retailtouchpoints.com/topics/customer-experience/purchase-likelihood-highest-for-products-rated-between-4-2-and-4-5-out-of-5-stars)) |
| E7 | **Kleine, abgeschlossene Schritte bauen Bindung auf.** Was man selbst zusammengestellt hat, schätzt man höher, aber nur, wenn man die Aufgabe *abschließt* (IKEA-Effekt). Sichtbarer Anfangsfortschritt erhöht die Abschlussquote: 34 % statt 19 % bei gleicher Restleistung. Allerdings wirkt das nur mit einem *ehrlichen* Grund für den Vorsprung. | Kette **Merken → „Ihre Auswahl“ teilen → Termin**. Die Merkliste ist ein Werkstück des Kunden, kein Warenkorb. Sobald ein Termin gebucht ist, gilt das Beratungsformular als zu 50 % erledigt, weil die Auswahl schon vorliegt. Das stimmt tatsächlich und ist deshalb kein Trick. | Norton, Mochon & Ariely 2012, *JCP* 22(3) ([Harvard DASH](https://dash.harvard.edu/handle/1/12136084)); Nunes & Drèze 2006, *JCR* 32(4) ([Wharton](https://knowledge.wharton.upenn.edu/?p=5630)) |
| E8 | **Ein Verlust wiegt etwa doppelt so schwer wie ein gleich großer Gewinn.** Wer mit Verlust argumentiert, erreicht viel, kippt aber schnell in Angstmacherei. | Verlustaversion nur in **schützender** Richtung nutzen: „Ihre Anzahlung ist abgesichert“, „Gutschein unbefristet, Restguthaben bleibt erhalten“. Gerade die Befreiung von der Verlustangst ist hier das Verkaufsargument. **Nie** mit der Angst des Kunden arbeiten („Nur noch heute“, „Ihr Gutschein verfällt“). | Kahneman & Tversky 1979, *Econometrica* 47; Recht AT: Gutschein unbefristet (OGH 7 Ob 22/12d, 14 F6) |
| E9 | **Manipulatives Design ist verbreitet, und die Aufsicht greift durch.** Auf 11 % von 11.000 Shops fanden sich Dark Patterns, auf 183 Seiten davon ausdrücklich täuschende. Die EU-Kommission definiert Dark Patterns als unlautere Praktiken „through the structure, design or functionalities of digital interfaces“. Laut einer Studie im Fitness Check setzen 97 % der populärsten Seiten mindestens eines ein. Der Digital Fairness Act ist angekündigt; laut CMS wird der Entwurf für den 11.11.2026 erwartet [prüfen]. | Wer hier sauber arbeitet, hebt sich ab und ist für das kommende Recht schon vorbereitet. Ehrliche Gestaltung ist für Platzhirsch kein Verzicht, sondern ein Argument, das sich zeigen lässt. | Mathur et al. 2019, *PACM HCI* 3 CSCW ([arXiv](https://arxiv.org/abs/1907.07032v2)); [CMS zum DFA](https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing); DSA Art. 25; UGP-RL Anh. I Nr. 7 |

**Ergänzende Belege, die das Design leiten** (aus der Fachliteratur, nicht neu abgerufen):
- *Operational Transparency:* Kunden bewerten einen Dienst höher, wenn sie die Arbeit dahinter sehen, auch bei längerer Wartezeit (Buell & Norton 2011, *Management Science* 57(9)). Für die Website heißt das: zeigen, *was* in den 8–16 Wochen Lieferzeit passiert.
- *Kostentransparenz:* Die Offenlegung der Kostenbestandteile erhöht die Kaufbereitschaft (Mohan, Buell & John 2020, *Management Science* 66(11)). Für die Website heißt das: CHF-Festpreis aufgeschlüsselt nach Ware, MWST, Verzollung, Lieferung und Montage.
- *Aufgeteilte Preise:* Zuschläge, die erst später auftauchen, senken das Vertrauen, sobald der Kunde sie bemerkt. Erwartet wird ein „All-in“-Preis (Morwitz, Greenleaf & Johnson 1998, *JMR* 35).
- *Deskriptive Normen:* Konkrete Hinweise, wie es andere in der gleichen Lage machen, wirken stärker als allgemeine (Goldstein, Cialdini & Griskevicius 2008, *JCR* 35). Für die Website heißt das: Referenzen nach Situation zeigen („Zweitwohnsitz Lech“, „Penthouse Bregenz“) statt „1.000 zufriedene Kunden“.

---

## 2. Konkrete Vorgaben für den Neuauftritt (messbar, umsetzbar)

### 2.1 Kuratierte Auswahl gegen Choice Overload (1.765 Produkte)

| Regel | Vorgabe | Messgröße |
|---|---|---|
| R1 Drei Einstiegsebenen | **Ebene 1 „Kuratiert“:** pro Kategorie 6–12 Stücke, „vom Team in Lochau ausgewählt“, mit Namen und Foto der Person. **Ebene 2 „Nach Situation“:** 4–6 Wege (Erstbezug Wohnung, Chalet/Zweitwohnsitz, Küche + Wohnen, Outdoor am See, Hotel/Objekt, Architekt). **Ebene 3 „Gesamter Katalog“** mit Filtern. | Ebene 1 ist der Standard beim Einstieg in eine Kategorie. Der Link „Alle 487 Minotti-Produkte ansehen“ steht immer sichtbar darunter, ohne Klick-Hürde. |
| R2 Zahl der Optionen pro Bildschirm | Startseite: höchstens **3 Handlungsoptionen** gleichzeitig im ersten Viewport (Termin, Kollektion entdecken, Showroom/Café). Kategorie-Einstieg: **höchstens 12 Kacheln** vor der ersten redaktionellen Pause (entspricht 01, F-Katalog). Produktseite: genau **1 Hauptaktion** („Ins Café zur Beratung“ oder „Termin“) und 1 Nebenaktion („Merken“). | Hick-Hyman: Die Entscheidungszeit steigt mit der Zahl der Optionen. Ziel: Median der Zeit bis zur ersten Interaktion auf der Startseite unter 8 s (Messung in Analytics, `src/lib/analytics.js`). |
| R3 Filter, die Präferenzen *erzeugen* | Der Kunde kennt seine Präferenz noch nicht, deshalb sind die Filter in seiner Sprache formuliert. Erste Filterreihe: **Raum, Sitzgefühl (fest/mittel/weich), Breite in cm (Schieberegler 160–400), Bezug (Stoff/Leder/outdoorfest), Lieferzeit (ab Lager / 8–12 / 12–16 Wochen), „im Showroom zu sehen“**. Marke und Designer kommen in die zweite Reihe. | Filternutzung über 25 % der Katalogbesuche; Rate der Suchen ohne Treffer unter 5 %. |
| R4 Vergleich statt Scrollen | Funktion „Vergleichen“ für höchstens **3 Stücke** nebeneinander: Maße, Sitzhöhe, Bezugskategorien, „ab“-Preis, Lieferzeit, im Showroom ja/nein. | Wer drei Optionen vergleicht, findet leichter eine Präferenz. Messgröße: Anteil der Vergleiche, die in die Merkliste übergehen. |
| R5 Empfehlung mit Begründung | Jedes kuratierte Stück trägt **einen Satz Begründung** von einer realen Person: „Unser Favorit für kleine Räume am See: nur 92 cm tief.“ – *Susanne Messmer*. | Begründete Empfehlungen sind als Endorsement-Default am wirksamsten (E2). Pflicht: kein bezahlter Platz, kein Hersteller-Werbetext. |
| R6 Ein Schritt zurück ist immer möglich | Filter und Auswahl bleiben beim Zurück-Navigieren erhalten (URL-Parameter). „Alle Filter zurücksetzen“ steht sichtbar daneben. | 0 Fälle, in denen der Filterzustand verloren geht (Test in 5 Szenarien). |

### 2.2 Ankereffekt: „ab“-Preise und Pakete

| Regel | Vorgabe |
|---|---|
| R7 Ehrlicher Anker | „ab“-Preis nur mit **benannter, real bestellbarer Ausführung** direkt darunter, in gleicher Schriftgröße minus 2 px (z. B. 17 px / 15 px): „ab 9.400 € · 3-Sitzer, 238 cm, Stoff Kat. A · inkl. 20 % MwSt., zzgl. Lieferung · Stand 11/2026“. Die Pflichtzusätze erzeugt eine zentrale Funktion `priceRules` (14, F4). |
| R8 Preisspanne statt Einzelanker bei Konfigurationsprodukten | Für Modulsofas und Küchen eine **Spanne mit drei Beispielen** zeigen: „Typische Projekte: 9.400 € / 16.800 € / 28.500 €“, jeweils mit Ausführung. Die mittlere Stufe ist ein echtes Durchschnittsprojekt aus den Angeboten der letzten 12 Monaten, keine gesetzte „Wunschmitte“. Die Spanne schützt vor dem Schock, den ein zu tief gesetzter „ab“-Preis im Gespräch auslöst. |
| R9 Pakete in drei Stufen, ohne Lockvogel | Beispiele: **Firmengeschenke** 3 Pakete (z. B. 85 / 180 / 450 € netto), **Küche mit Binni-Steinplatte** 3 Linien, **Planung** („Erstgespräch kostenlos 60 min“ / „Raumkonzept“ / „Gesamtplanung“, Anrechnung bei Auftrag). Prüffrage für jede Stufe: *Würden wir sie auch dann anbieten, wenn es die anderen beiden nicht gäbe?* Wenn nein, ist es eine Lockvogel-Stufe und fliegt raus. |
| R10 Reihenfolge der Anker | Pakete werden **aufsteigend** angezeigt (links günstig, rechts umfassend). Absteigend wäre ein künstlich hoher Anker und unnötig. Hervorhebung höchstens als „Am häufigsten gewählt“, und das nur, wenn es durch Bestellzahlen belegt ist (Claims-Register `src/lib/legal/claims.js`). |
| R11 Keine Streichpreise ohne 30-Tage-Basis | Im Atelierverkauf gilt „UVP des Herstellers für Neuware: 12.600 €“ statt „~~12.600 €~~“, solange keine 30-Tage-Tiefstpreis-Historie existiert (§ 9a PrAG / § 11 PAngV). Rabattangaben in % sind höchstens 13 px groß, in `--color-ink` und **nie in Rot**. |
| R12 Runde vs. genaue Zahlen | Wohnen, Leuchten, Outdoor und Gutscheine bekommen **runde Hunderter** (9.400 €). Küchenpositionen und Steinplatten-Quadratmeter **genau** (2.380 €, 640 €/m²). Nie ,99 und nie ,90. Zahlen in `tabular-nums` (01). |

### 2.3 Framing in CHF und EUR

| Regel | Vorgabe |
|---|---|
| R13 Währungs-Default nach Herkunft, offen umschaltbar | Default = Sprache/Region des Nutzers: `de-CH` und Besuche über die Regionsseiten Appenzell, Rheintal oder Liechtenstein bekommen **CHF**, alle anderen **EUR**. Der Umschalter „€ / CHF“ steht sichtbar im Kopf jeder Preisanzeige, nicht versteckt im Footer. Die Wahl wird nur für diesen Besucher gespeichert (localStorage mit try/catch, 13). |
| R14 CHF heißt All-in | Der CHF-Preis enthält **8,1 % MWST, Verzollung, Lieferung und Montage**, mit einem Aufklapp-Element „So setzt sich der Preis zusammen“ (Ware netto · MWST CH · Zoll/Abwicklung · Lieferung · Montage). Ohne vollständigen Festpreis steht dort „Kostenschätzung CHF ca. …, verbindlich im Angebot“ (PBV, 14 F4 [prüfen]). |
| R15 Kein Kurs-Framing als Rabatt | Nicht „10 % sparen gegenüber der Schweiz“ (laut 23 bewusst kein USP mehr und ohne Beleg irreführend). Stattdessen ein Sachsatz: „Festpreis in Franken. Sie zahlen keine Nachforderungen an der Grenze.“ Gewinnframing geht nur über Sicherheit, nicht über den Preis. |
| R16 Kursangabe mit Datum | Bei Umrechnung den Kurs und das Datum nennen: „1 € = 0,94 CHF, Stand 26.10.2026; der Festpreis im Angebot gilt 30 Tage“. Das Datum ist Pflicht. Den Kurswert selbst täglich aus dem Backoffice ziehen und nicht im Code festschreiben [Kurswert vor Launch aktualisieren]. |

### 2.4 Ehrlicher Social Proof

| Regel | Vorgabe |
|---|---|
| R17 Schwelle | Das Modul „Stimmen“ erscheint erst ab **20 echten Google-Bewertungen** (01, 23). Es zeigt den Schnitt mit einer Nachkommastelle, die Zahl der Bewertungen, den Link zum Google-Profil und den Prüf-Hinweis: „Wir zeigen Google-Bewertungen. Google prüft nicht, ob ein Kauf stattgefunden hat.“ |
| R18 Keine Auswahl nach Sternen | Das Karussell zeigt die **neuesten** 6 Bewertungen nach Datum, nicht die besten. Mindestens 1 Bewertung unter 5 Sternen bleibt sichtbar, wenn es eine gibt, zusammen mit der Antwort des Hauses. Ein 4,6er-Schnitt mit Antworten wirkt glaubwürdiger als 5,0 (E6). |
| R19 Referenzen nach Situation | Das Projekt-Archiv ist nach Situation gefiltert (Privat am See, Zweitwohnsitz Arlberg, Hotel, Büro, Kunde aus CH/FL). Jedes Projekt nennt Ort (Gemeinde, ohne Adresse), Umfang, Dauer und die verwendeten Marken, und es liegt eine **schriftliche Freigabe** vor. |
| R20 Zahlen nur mit Beleg | „Seit 20XX“, „über N Projekte“, „N Kunden aus der Schweiz“ stehen nur im Claims-Register mit Quelle und Datum. Keine Live-Zähler („3 Personen sehen sich das gerade an“). |
| R21 Architekten als Autorität, nicht als Werbefläche | Architektenstimmen nur mit Namen, Büro und Projekt. Wenn eine Geschäftsbeziehung besteht (Provision, Kooperation), wird sie offengelegt: „Kooperationspartner“. |

### 2.5 Commitment in kleinen Schritten: Merkliste → Termin

**Pfad (jeder Schritt ist für sich abgeschlossen und nützlich):**

```
1 Merken (Herz, ohne Konto)
   └ Feedback 200 ms: Herz füllt sich, Zähler im Kopf +1, Hinweis „In Ihrer Auswahl“ (nicht „Warenkorb“)
2 Auswahl ansehen: Raum-Gruppierung automatisch (Wohnen / Essen / Outdoor), Summe der „ab“-Preise als Orientierung
3 Auswahl sichern oder teilen: Link kopieren / an Partner oder Architekt senden / als PDF (ohne Konto, ohne E-Mail-Pflicht)
4 „Mit dieser Auswahl ins Café kommen“: Terminwahl, die Auswahl wird automatisch an die Beratung übergeben
5 Bestätigung: Name der Beraterin + Foto, Kalendereintrag, Anfahrt, Parken, „Kaffee geht auf uns“
```

| Regel | Vorgabe |
|---|---|
| R22 Kein Konto als Hürde | Merken und Teilen gehen ohne Registrierung. Ein Konto wird höchstens *nach* dem Termin angeboten („Auswahl auf allen Geräten“), nie als Schranke davor. |
| R23 Formular kurz halten | Terminformular mit höchstens **4 Pflichtfeldern** (Name, E-Mail **oder** Telefon, Wunschtermin, Kontaktweg). Projektart, Budget und Zeitpunkt sind freiwillig und als Auswahl-Chips gestaltet, nicht als Freitext. Das Budget-Feld bietet die Option „Weiß ich noch nicht“, die dort **voreingestellt** ist. |
| R24 Ehrlicher Fortschritt | Fortschrittsanzeige nur bei mehrstufigen Formularen, mit echten Schritten („Schritt 2 von 3“). Ist die Auswahl schon übergeben, startet die Anzeige bei Schritt 2. Das ist ehrlicher Endowed Progress (E7), weil die Arbeit tatsächlich schon getan ist. |
| R25 Termin-Defaults | Vorausgewählt: **„Im Showroom Lochau, 60 min“**. Daneben gleichrangig: „Video 30 min“ und „Bei Ihnen vor Ort“ (Arlberg/Projekt). Die Slots kommen aus dem echten Kalender. Wenig freie Slots werden **nicht** als Knappheit hervorgehoben. Der Samstag wird als Vorteil gezeigt („auch samstags“), nicht als „fast ausgebucht“. |
| R26 Reaktionszeit als Versprechen | Nach dem Absenden steht dort: „Wir melden uns bis morgen 12 Uhr“ (nur wenn intern erfüllbar, Ziel über 90 %). Ein Versprechen, das eingehalten wird, wirkt als Commitment des *Hauses*. |
| R27 Mikro-Schritte vor dem Termin | Weitere niederschwellige Schritte: Materialmuster bestellen (bis zu 3 Stoffproben, kostenlos), „Ein Stück, eine Minute“-Video, Ratgeber-PDF. Jeder davon führt *wahlweise* zum Termin, ohne Pop-up-Kaskade. |

### 2.6 Verlustaversion bei Gutscheinen (nur schützend)

| Regel | Vorgabe |
|---|---|
| R28 Sicherheit statt Verfall | Kernbotschaft im Gutschein-Kopf: **„Unbefristet gültig · Restguthaben bleibt erhalten · im Showroom und online einlösbar“**. Das nimmt dem Schenkenden die Angst, dass das Geschenk „verfällt“, und ist zugleich die Rechtslage in AT (14, F6). |
| R29 Beträge mit Ankern, die zu den Käufen passen | Wertstufen **100 / 250 / 500 / frei wählbar**, dazu jeweils ein Satz, was man dafür bekommt: „250 € – z. B. eine Flos-Tischleuchte oder ein Abend Tafel für zwei mit Planungsgespräch“ (nur mit realen Produkten zu aktuellen Preisen). Keine Voreinstellung auf die höchste Stufe. Voreingestellt ist **keine** Stufe, oder höchstens 250 € als Empfehlung mit Begründung. |
| R30 Erinnerung ist Service, nicht Druck | Beschenkte erhalten eine Erinnerung nur mit Einwilligung, frühestens nach 6 Monaten, und als Einladung formuliert („Ihr Gutschein über 250 € wartet, gerne beim Adventsabend“). Nie „läuft bald ab“, denn er läuft nicht ab. |
| R31 Aktionen transparent | „100 € schenken, 110 € Wert“ ist nur mit klarer Laufzeit der *Aktion* zulässig. Der Gutschein selbst bleibt unbefristet. Ein Enddatum in Klartext („bis 24.12.2026“) ist erlaubt, ein laufender Countdown-Zähler nicht. |

### 2.7 Default-Tabelle (alle Voreinstellungen auf einen Blick)

| Stelle | Default | Begründung |
|---|---|---|
| Cookie-Banner | Keine Vorauswahl; „Ablehnen“ und „Akzeptieren“ **gleich groß, gleiche Farbe und gleiches Gewicht** | DSB AT / EDSA (14) |
| Newsletter bei Terminbuchung | **nicht** angekreuzt | Einwilligung muss aktiv sein (DSGVO Art. 7, EuGH *Planet49* C-673/17) |
| Währung | nach Region, umschaltbar (R13) | Empfehlung, kein Zwang |
| Termin-Art | Showroom 60 min (R25) | stärkstes USP: Café |
| Budget im Formular | „Weiß ich noch nicht“ | senkt die Hürde, kein Anker nach oben |
| Lieferung/Montage | im CHF-Preis enthalten; in EUR „Lieferung + Montage in Vorarlberg: ab X €“ sichtbar | keine versteckten Kosten |
| Gutscheinwert | keiner oder 250 € mit Begründung (R29) | kein Ankern nach oben |
| Sortierung Katalog | „Empfehlung des Hauses“ mit **offengelegter Logik** („im Showroom zu sehen, dann Lieferzeit“), Alternativen: Neu, Preis auf-/absteigend | Transparenz der Rangfolge (DSA-Geist, P2B-Logik) |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Der ehrliche Preis“-Modul:** Auf jeder Produktseite mit Preisfeld drei echte Beispielprojekte (R8) plus ein Aufklapp-Element „Was den Preis bestimmt“ (Bezugskategorie A–X, Modulzahl, Lieferzeit). Kein Wettbewerber im Umkreis zeigt überhaupt Preise (23, 4.2 Nr. 4). Platzhirsch wäre der erste mit Preisen, und dann gleich *erklärt*.
2. **Dreiländer-Preisrechner mit Aufschlüsselung:** Der Kunde wählt sein Land (AT / DE / CH / FL) und sieht den gleichen Preis vollständig in seiner Währung: Ware, Steuer, Zoll, Lieferung, Montage. Abschluss mit dem Satz „Keine Nachforderung an der Grenze“. Das löst die Unsicherheit, die Fretz und Gamma offenlassen.
3. **„Ihre Auswahl“ als Moodboard für Paare und Architekten:** Ein Teilen-Link, unter dem der Partner Stücke mit „gefällt mir / eher nicht“ markiert (zwei Knöpfe, ohne Konto). Ins Café kommt das Paar dann mit einer gemeinsamen Vorentscheidung. Hier wirkt der IKEA-Effekt zu zweit, und das Ergebnis wird direkt in die Beratung übergeben.
4. **„Was in Ihren 12 Wochen passiert“:** Eine Lieferzeit-Zeitleiste mit realen Schritten (Bestellung beim Hersteller, Produktion in Meda/Brianza, Spedition, Zoll, Montage) und ein Status-Update per E-Mail an jedem Meilenstein. Die Wartezeit wird so als Teil der Qualität erlebt (Operational Transparency).
5. **Kuratoren mit Gesicht:** „Susannes 8 für den See“ und „Die 6 Outdoor-Stücke, die einen Arlberg-Winter überstehen“ als Einstieg in die Kategorien. Jedes Stück trägt eine Begründung (R5). Das ersetzt den Marktplatz-Katalog durch eine Empfehlung, wie man sie aus einem Gespräch im Café kennt.
6. **Transparenz-Seite „Wie wir verkaufen“:** Keine Countdowns, keine erfundenen Rabatte, Bewertungen ungefiltert, Anzahlung abgesichert, Gutscheine unbefristet. Das ist ein öffentliches Versprechen mit Datum. Es zahlt auf den kommenden Digital Fairness Act ein und macht die Gegenseite sichtbar.
7. **Stoffmuster als erster Kaufschritt:** Bis zu 3 Muster kostenlos per Post, mit Rückantwort-Karte „Termin vereinbaren“. Eine physische Probe gibt das Gefühl, das Stück schon zu besitzen (Endowment), ohne dass der Kunde etwas bezahlen oder zusagen muss.

---

## 4. Was man auf keinen Fall tun darf

| Verbot | Warum (Recht + Marke) |
|---|---|
| **Countdown-Zähler** oder „Nur noch heute“ bei Aktionen, Gutscheinen, Atelierverkauf | UGP-RL Anh. I Nr. 7 (falsche Behauptung begrenzter Verfügbarkeit); bei Luxus Zeichen von Ramsch |
| **Fake-Knappheit** („Nur noch 1 auf Lager“, „3 andere sehen sich das an“), außer es ist wahr *und* entscheidungsrelevant (Ausstellungsstück: „Einzelstück“ ist wahr und zulässig, ohne Zähler) | UWG § 2 AT / § 5 DE; Mathur et al. 2019 |
| **Confirmshaming** („Nein danke, ich mag keine schönen Dinge“) beim Newsletter oder Exit | DSA Art. 25 (für Plattformen), UGP-Generalklausel; respektlos gegenüber der Zielgruppe |
| **Exit-Intent-Pop-ups** mit Rabatt | Sie bringen einem Premium-Kunden bei, auf den Rabatt zu warten, und entwerten jeden Preis. |
| **Voreingestellte Häkchen** (Newsletter, Zusatzleistungen, Versicherung) | EuGH C-673/17 *Planet49*; Art. 22 VRRL |
| **Drip Pricing:** Lieferung, Montage oder Zoll erst im letzten Schritt | Art. 6 VRRL, § 9 PrAG, PBV; zerstört den Festpreis-USP |
| **Lockvogel-Pakete**, deren einziger Zweck es ist, ein anderes Paket gut aussehen zu lassen | Irreführung durch Vergleich; untergräbt das Vertrauen in alle Preise |
| **„ab“-Preise ohne bestellbare Ausführung**, Streichpreise ohne 30-Tage-Basis | § 9a PrAG / § 11 PAngV (14 F4) |
| **Bewertungen filtern** (nur 5 Sterne), Bewertungen gegen Gutschein ohne Offenlegung, Review Gating | UGP Anh. I Nr. 23b/c; Google-Richtlinie |
| **Gutschein-Verfall andeuten** oder Befristung unter 30 Jahren in AGB | OGH 7 Ob 22/12d; Vertrauensbruch beim Schenkenden |
| **Versteckte Abmeldung**, Konto-Zwang zum Löschen der Merkliste, „Roach Motel“ | DSGVO Art. 7(3), DSA Art. 25 |
| **Händler-Behauptungen** („offizieller Minotti-Partner“) ohne schriftlichen Beleg | 14; 23 – Claims-Register |
| **Gold-Signalfarbe für Druck-Elemente:** Gold `#d1b250` bleibt Mikroakzent (01), nie Hintergrund von Rabatt- oder Dringlichkeitsflächen. Kein Rot `#c00`-Bereich für Preise. | Markenwahrnehmung, Konsistenz mit 01 |

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Skala je Kriterium:** 0 = fehlt oder manipulativ · 1 = vorhanden, aber unklar oder nur teilweise · 2 = gut umgesetzt · 3 = vorbildlich und messbar. Ein **K.-o.-Kriterium** (markiert mit ⛔) ergibt bei 0 Punkten die Gesamtnote „nicht freigabefähig“, egal wie hoch die Summe ist.

| # | Kriterium | Prüfmethode | 0 | 3 |
|---|---|---|---|---|
| P1 | Optionen im ersten Viewport (Desktop 1440×900, Mobil 390×844) | Zählen der klickbaren Handlungsaufforderungen ohne Navigation | > 6 | ≤ 3, eine klar primär |
| P2 | Kuratierter Einstieg vor dem Katalog | Weg Startseite → Kategorie prüfen | sofort 1.765er-Raster | 6–12 kuratierte Stücke mit Begründung + Link „alle ansehen“ |
| P3 | Situationswege (Erstbezug, Chalet, Küche + Wohnen, Outdoor, Hotel, Architekt) | Navigation/Startseite | keine | ≥ 4 Wege, jeder mit eigener Zielseite |
| P4 | ⛔ Preisdarstellung ehrlich | Jede Preisangabe prüfen | „ab“ ohne Ausführung, ,99, Streichpreis ohne Basis | „ab“ + Ausführung + Pflichtzusätze + Datum, runde/genaue Zahlen nach R12 |
| P5 | Paket-/Stufenlogik | Pakete ansehen (falls vorhanden) | Lockvogel oder absteigend mit Druck | 3 eigenständige Stufen, aufsteigend, „beliebt“ nur belegt |
| P6 | CHF-/EUR-Framing | Umschalter, `de-CH`-Aufruf | nur EUR oder CHF ohne Abgaben | Default nach Region, sichtbarer Umschalter, CHF all-in mit Aufschlüsselung |
| P7 | ⛔ Social Proof echt | Stimmen-/Referenzmodul | erfundene Zitate, Platzhalter-Sterne als echt dargestellt | Schwelle 20, Prüf-Hinweis, Link zu Google, chronologisch, Referenzen mit Freigabe (im Prototyp: klar als Platzhalter markiert = 2) |
| P8 | Merkliste als „Ihre Auswahl“ | Herz klicken, Liste öffnen | Warenkorb-Sprache, Konto-Zwang | ohne Konto, Feedback ≤ 200 ms, teilbar, nach Raum gruppiert |
| P9 | Übergang Auswahl → Termin | Von der Liste zum Termin | Auswahl geht verloren | Auswahl wird automatisch übergeben, Fortschritt startet ehrlich bei Schritt 2 |
| P10 | Formular-Hürde | Pflichtfelder zählen | > 6 Pflichtfelder, Budget als Pflicht | ≤ 4 Pflichtfelder, Budget optional mit „Weiß ich noch nicht“ |
| P11 | ⛔ Defaults fair | Alle Checkboxen, Cookie-Banner, Vorauswahlen | vorangekreuzter Newsletter, ungleiche Cookie-Knöpfe | alle Defaults nach Tabelle 2.7 |
| P12 | ⛔ Keine Dark Patterns | Suche nach Countdown, Zählern, Exit-Pop-up, Confirmshaming, Fake-Knappheit | mindestens eines vorhanden | keines; Einzelstück-Hinweise nur wahr und ruhig |
| P13 | Verlustaversion nur schützend | Gutschein- und Anzahlungs-Texte | „verfällt“, „nur noch heute“ | „unbefristet“, „Restguthaben bleibt“, „Anzahlung abgesichert“ (nur mit Beleg) |
| P14 | Gesicht und Verantwortung | Gibt es reale Personen mit Namen bei Empfehlung und Termin? | anonym | Kuratorin mit Foto, Beraterin in Bestätigung |
| P15 | Transparenz über Abläufe | Lieferzeit, Kostenbestandteile, Reaktionszeit | nicht genannt | Zeitleiste, Aufschlüsselung, eingehaltenes Antwortversprechen |
| P16 | Rücknahme und Kontrolle | Filter zurück, Auswahl löschen, Abmeldung | Zustand geht verloren, Löschen versteckt | alles in ≤ 2 Klicks, URL-Zustand erhalten |

**Auswertung:** höchstens 48 Punkte.
- **≥ 40:** freigabefähig für den Ausbau.
- **30–39:** gut, aber mit konkreten Nacharbeiten (Liste der Kriterien unter 2 Punkten).
- **< 30 oder ein ⛔ mit 0:** nicht freigabefähig.

**Gewichtung beim Vergleich der Prototypen:** P2, P4, P9 und P12 zählen doppelt, weil sie Choice Overload, Preisvertrauen, den Anfragepfad und die Rechtssicherheit direkt bestimmen. Mit Gewichtung liegt das Maximum bei 60.

**Messplan nach dem Launch** (Erfolg dieser Disziplin, monatlich in der KPI-Tafel 23, 12.3):
- Rate Merken → Termin (Ziel ≥ 8 % der Sitzungen mit Merkliste)
- Rate „Termin-Start → Termin abgeschickt“ (Ziel ≥ 60 %)
- Anteil der Besuche im kuratierten Einstieg, die ins Produkt gehen (≥ 35 %)
- Absprungrate auf dem Katalog nach Filteränderung
- Anteil der No-Shows bei Terminen (≤ 10 %)
- Beschwerden über Preisabweichungen zwischen Website und Angebot (Ziel 0)
- Google-Schnitt und -Anzahl (≥ 30 Bewertungen bis Januar 2027, 14 F11)

A/B-Tests nur zwischen **ehrlichen** Varianten (z. B. Spanne vs. Einzel-„ab“-Preis, 6 vs. 12 kuratierte Stücke). Eine Variante mit Druck-Element wird nie getestet, auch nicht „nur zum Vergleich“.

---

### Quellen
- Chernev, A., Böckenholt, U., Goodman, J. (2015). When product assortment leads to choice overload. *J. Consumer Psychology* 25(2), 333–358. <https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual>
- Scheibehenne, B., Greifeneder, R., Todd, P. (2010). Can there ever be too many options? *JCR* 37. <https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.options.2010.pdf>
- Jachimowicz, J. et al. (2019). When and why defaults influence decisions. *Behavioural Public Policy* 3(2), 159–186. <https://ideas.repec.org/a/cup/bpubpo/v3y2019i02p159-186_00.html>
- Wadhwa, M., Zhang, K. (2015). This number just feels right. *JCR* 41(5), 1172–1185. <https://wiki.agepoly.ch/finance/sponsoring/wadhwa-zhang-2015.pdf>
- Raghubir, P., Srivastava, J. (2002). Effect of face value on product valuation in foreign currencies. *JCR* 29(3), 335–347. Sekundär: <https://www.stern.nyu.edu/experience-stern/news/professor-priya-raghubir-s-joint-research-spending-and-currency-featured>
- Spiegel Research Center / PowerReviews (2017). From Reviews to Revenue. <https://www.retailtouchpoints.com/topics/customer-experience/purchase-likelihood-highest-for-products-rated-between-4-2-and-4-5-out-of-5-stars>
- Norton, M., Mochon, D., Ariely, D. (2012). The IKEA effect. *JCP* 22(3), 453–460. <https://dash.harvard.edu/handle/1/12136084>
- Nunes, J., Drèze, X. (2006). The endowed progress effect. *JCR* 32(4). <https://knowledge.wharton.upenn.edu/?p=5630>
- Mathur, A. et al. (2019). Dark patterns at scale. *PACM HCI* 3(CSCW), Art. 81. <https://arxiv.org/abs/1907.07032v2>
- CMS (2026). Inside the EU's planned Digital Fairness Act. <https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing>
- Aus der Fachliteratur, nicht neu abgerufen: Tversky & Kahneman 1974 (*Science* 185); Kahneman & Tversky 1979 (*Econometrica* 47); Huber, Payne & Puto 1982 (*JCR* 9); Simonson 1989 (*JCR* 16); Morwitz, Greenleaf & Johnson 1998 (*JMR* 35); Goldstein, Cialdini & Griskevicius 2008 (*JCR* 35); Buell & Norton 2011 (*Mgmt Sci* 57); Mohan, Buell & John 2020 (*Mgmt Sci* 66); EuGH C-673/17 *Planet49*.
- Projektintern: Marktresearch/digital/01, 12, 13, 14; Marktresearch/23-masterkonzept.md (Abschnitt 4).

*Hinweis: Rechtliche Aussagen sind aus Bericht 14 übernommen und keine Rechtsberatung. Die Paketpreise (85/180/450 €), die Beispielpreise (9.400 € usw.) und der Wechselkurs sind Platzhalter zur Veranschaulichung und vor der Verwendung durch echte Werte aus dem Backoffice zu ersetzen.*
