# Expertenrat 02 – Verkaufspsychologie und Beratung: vom Website-Besuch zum Auftrag

**Rolle:** Verkaufspsychologe und Verkaufstrainer für Premium-Retail
**Stand:** 26.10.2026
**Grundlage:** `digital/01, 02, 05, 11, 12, 13, 14`, `23-masterkonzept.md` (Abschnitt 4), Code-Stand `src/components/BeratungClient/BeratungClient.js`, `src/components/Reusable/MobileCtaBar.js`, `src/messages/de.json`.
**Prototypen:** `src/app/[locale]/preview/{galerie,buehne,dreilaendereck}` gab es beim Schreiben noch nicht (Ordner nicht vorhanden). Die Checkliste in Abschnitt 5 ist so gebaut, dass sie ohne Vorwissen auf jeden Prototyp passt.

**Leitsatz dieser Disziplin:** Eine Luxus-Website verkauft kein Sofa. Sie verkauft **den nächsten kleinen, sicheren Schritt zum Menschen**: ein Gespräch, einen Termin, einen Rückruf. Jede Seite hat genau eine Aufgabe: Unsicherheit abbauen, bis dieser Schritt leichter ist als das Wegklicken.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

### E1 – Geschwindigkeit entscheidet mehr als Rhetorik
Unternehmen, die eine Web-Anfrage **innerhalb einer Stunde** beantworten, haben eine fast **7-mal höhere Chance**, den Lead zu qualifizieren (echtes Gespräch mit dem Entscheider), als Unternehmen, die eine Stunde länger brauchen, und eine **über 60-mal höhere** als Unternehmen nach 24 Stunden. Grundlage: 1,25 Mio. Leads von 42 US-Unternehmen. Im Test der Autoren antworteten nur 37 % von 2.241 Firmen innerhalb einer Stunde, 23 % gar nicht. Der Schnitt lag bei 42 Stunden.
*Quelle:* Oldroyd, McElheran, Elkington (2011): „The Short Life of Online Sales Leads“, *Harvard Business Review*, März 2011 ([BYU ScholarsArchive](https://scholarsarchive.byu.edu/facpub/9711)).
**Für Platzhirsch:** Höttges lässt den „Termin“ per E-Mail anfragen (05, 2.2), die heutige Strecke setzt nach 5 s auf Schritt 1 zurück, ohne dass ein nächster Schritt angeboten wird (05, 1.1). Mit einem Antwortversprechen, das gemessen und eingehalten wird, gewinnt Platzhirsch schon, bevor das Gespräch beginnt.

### E2 – Erinnerungen halbieren die Termin-Verluste nicht, senken sie aber deutlich, und mehrere wirken besser als eine
Eine Meta-Analyse über 21 Studien zeigt: Wer eine digitale Erinnerung bekommt, erscheint mit **23 % höherer Wahrscheinlichkeit** (67 % gegenüber 54 %), die No-Show-Quote sinkt um **25 %** (15 % gegenüber 21 %). **Mehrere Erinnerungen** wirken besser als eine.
*Quelle:* Robotham et al. (2016): „Using digital notifications to improve attendance in clinic“, *BMJ Open* ([PubMed 27798006](https://pubmed.ncbi.nlm.nih.gov/27798006/)). Ein großes RCT mit 161.587 Personen zeigt außerdem, dass der **Wortlaut** der Erinnerung die No-Show-Quote stark verändert ([PMC7310733](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7310733/)).
**Für Platzhirsch:** Der Termin wird nicht nur gebucht, sondern **vorbereitet**: Bestätigung, Erinnerung T−48 h mit „Was wir für Sie vorbereitet haben“, Erinnerung T−3 h mit Anfahrt und Parken. Die Formulierung mit Schuldgefühl aus dem RCT wird **nicht** übernommen (sie passt nicht zu einem Gastgeber), wohl aber das Prinzip: Konkretes schlägt Allgemeines.

### E3 – Kleine Zusagen, die man selbst plant, werden eingehalten (Commitment und Umsetzungsabsicht)
Wer eine konkrete „Wenn-dann“-Absicht formuliert (wann, wo, wie), setzt sein Vorhaben deutlich öfter um. Meta-Analyse über 94 Studien: mittlerer bis großer Effekt, **d = 0,65**. Die Technik des „Fuß in der Tür“ wirkt verlässlich, aber nur moderat, und nur dann, wenn der erste Schritt freiwillig und sinnvoll ist (Burger 1999, Meta-Analyse).
*Quellen:* Gollwitzer & Sheeran (2006), *Advances in Experimental Social Psychology* 38; Burger (1999), *Personality and Social Psychology Review* 3(4).
**Für Platzhirsch:** Der Weg ist eine **Leiter aus freiwilligen Mikro-Zusagen**: Stück ansehen → in „Ihre Auswahl“ legen → Beratungsart wählen → Uhrzeit wählen → (optional) Grundriss hochladen. Jeder Schritt ist auch ohne den nächsten nützlich. Der Kalender mit **sichtbaren Uhrzeiten** ist eine eingebaute Umsetzungsabsicht („Samstag, 10:30, Lochau“). Ein Formular „Termin anfragen“ ist das nicht.

### E4 – Offenheit über Preise und Kosten schafft Vertrauen, das Verkauf auslöst
Freiwillige Kostentransparenz erhöhte die Kaufwahrscheinlichkeit in Experimenten um rund 21 %, im Feldtest stieg der Absatz eines Händlers um 22 %. Der Effekt kippt nur, wenn hohe Margen auffallen.
*Quelle:* Mohan, Buell & John (2020): „Lifting the Veil: The Benefits of Cost Transparency“, *Marketing Science* ([INFORMS-Mitteilung](https://informs.org/News-Room/INFORMS-Releases/News-Releases/New-Research-Finds-Cost-Transparency-Can-Increase-Sales-20), [HBS Working Paper](https://dash.harvard.edu/handle/1/13360007)). Verwandt: Buell & Norton (2011), „The Labor Illusion“, *Management Science* 57(9): Sichtbar gemachte Arbeit erhöht den wahrgenommenen Wert.
**Für Platzhirsch:** Kein Premium-Händler im Umkreis zeigt Preise (23, 4.2 Nr. 4). Offene **Preisrahmen** im Ratgeber („Was kostet ein Minotti-Sofa? Spanne, Treiber, Beispiel“) und ein **aufgeschlüsseltes Angebot** (Ware, Lieferung, Montage, Verzollung, Elektro-Partner) beantworten den Preiseinwand, bevor er im Gespräch kommt. Rechtsrahmen für „ab“-Preise: 14, F4. Wir zeigen **nicht die Marge**, sondern die Leistung (Arbeitsschritte, Montage-Team, Zollabwicklung).

### E5 – Bei emotionalen Käufen wirken runde Preise „richtig“
Runde Preise (z. B. 9.000 €) werden flüssiger verarbeitet und passen zu Entscheidungen aus dem Gefühl. Krumme Preise (8.987 €) passen zu nüchternen, nutzenorientierten Entscheidungen. Fünf Studien.
*Quelle:* Wadhwa & Zhang (2015): „This Number Just Feels Right“, *Journal of Consumer Research* 41(5), 1172–1185 ([RePEc](https://ideas.repec.org/a/oup/jconrs/doi10.1086-678484.html)). Hinweis: Laborstudien, der Feldbeleg fehlt.
**Für Platzhirsch:** Preisrahmen auf der Website und Paketpreise im Angebot **gerundet auf 100 € bzw. 100 CHF**, keine 9er-Endungen („.990“), die nach Discount aussehen. Ausnahme ist die Positionsliste im Angebot. Dort stehen exakte Beträge, weil sie geprüft werden (nüchterner Modus).

### E6 – Unsicheres Warten fühlt sich länger an als erklärtes Warten
„Unerklärte Wartezeiten wirken länger als erklärte, unbestimmte länger als bekannte“, und Angst verlängert das Warten. Das ist ein Grundsatz der Service-Psychologie.
*Quelle:* Maister (1985): „The Psychology of Waiting Lines“, in Czepiel et al., *The Service Encounter*. Bestätigt durch die Forschung zur „operational transparency“ (Buell & Norton 2011).
**Für Platzhirsch:** Der Einwand gegen die Lieferzeit (italienische Manufakturen: oft 8–16 Wochen, je nach Modell [prüfen je Marke]) wird nicht kleingeredet. Er wird **erklärt und begleitet**: Was in welcher Woche passiert (Zuschnitt, Bezug, Versand, Verzollung, Montage), mit 4 Status-Nachrichten (siehe 2.8).

### E7 – Der Höhepunkt und das Ende prägen die Erinnerung
Menschen bewerten ein Erlebnis vor allem nach dem intensivsten Moment und nach dem Ende, die Dauer zählt kaum („Peak-End-Regel“).
*Quelle:* Kahneman, Fredrickson, Schreiber & Redelmeier (1993), *Psychological Science* 4(6); Redelmeier & Kahneman (1996), *Pain* 66.
**Für Platzhirsch:** Zwei Momente bewusst gestalten. **Höhepunkt:** Der Kunde kommt in den Showroom, und seine Auswahl aus der Website steht schon da (Stoffmuster auf dem Tisch, das Stück vorbereitet), dazu Espresso. **Ende:** Übergabe nach der Montage mit Pflegekarte und QR-Karte für die Bewertung (14, F11), keine Rechnung als letzter Kontakt.

### E8 – Weniger, gut erklärte Optionen erleichtern die Entscheidung, aber nicht immer
Das berühmte Marmeladen-Experiment (24 statt 6 Sorten: 3 % statt 30 % Kauf) zeigt, dass zu viel Auswahl lähmen kann (Iyengar & Lepper 2000, *JPSP* 79(6)). Eine Meta-Analyse über 50 Experimente findet aber im Mittel **keinen** stabilen Effekt. Er tritt vor allem auf, wenn die Optionen schwer vergleichbar sind und der Kunde keine klaren Vorlieben hat (Scheibehenne, Greifeneder & Todd 2010, *Journal of Consumer Research* 37(3)). Wer drei Optionen bekommt, wählt häufig die mittlere (Kompromiss-Effekt, Simonson 1989, *JCR* 16(2)).
**Für Platzhirsch:** Bei 1.765 Produkten und 36 Marken trifft das genau zu. Neue Kunden haben noch keine Vorlieben, die Stücke sind schwer vergleichbar. Darum: **höchstens 3–4 Beratungsarten**, **3 Angebotsvarianten** (aber jede ehrlich gemeint und lieferbar, keine Lockvogel-Variante), im Katalog ein „Von uns ausgewählt“-Einstieg.

### E9 – Wer Manipulation bemerkt, verliert Vertrauen dauerhaft, und in der EU ist es verboten
Nach dem „Persuasion Knowledge Model“ erkennen Konsumenten Beeinflussungstaktiken und werten sie ab, sobald sie sie bemerken (Friestad & Wright 1994, *JCR* 21(1)). Zweiseitige Botschaften (die auch Nachteile offen nennen) erhöhen die Glaubwürdigkeit nachweisbar (Eisend 2006, Meta-Analyse, *Marketing Letters* 17). Der EU-Sweep 2023 fand manipulative Muster in **148 von 399** Online-Shops, darunter 42 mit **falschen Countdowns** ([EU-Kommission IP/23/418](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_23_418/IP_23_418_EN.pdf)). Unzulässig ist unter anderem die falsche Behauptung, ein Angebot gebe es nur kurze Zeit (UGP-RL 2005/29/EG, Anhang I Nr. 7; AT UWG Anhang Z 7; DE UWG Anhang Nr. 7). DSA Art. 25 gilt für Online-**Plattformen** und nicht direkt für die eigene Händler-Website. Der geplante **Digital Fairness Act** soll Dark Patterns für alle B2C-Anbieter regeln. Der Vorschlag ist für 2026 angekündigt ([CMS](https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing)).
**Für Platzhirsch:** Luxus lebt von Begehren, nicht von Druck (Kapferer & Bastien 2009, *The Luxury Strategy*: „Luxus verkauft nicht, er lässt sich kaufen“). Und nach drei regionalen Insolvenzen (23, 2.2) ist **Vertrauen** das teuerste Gut. Ein einziger Fake-Timer kostet mehr, als er einbringt.

### E10 – Die Fragetechnik im Erstgespräch erklärt den Abschluss bei großen Käufen besser als die Abschlusstechnik
In der Auswertung von rund 35.000 Verkaufsgesprächen (Huthwaite) hingen große Aufträge an **Fragen zur Situation, zum Problem, zu den Folgen und zum Nutzen** (SPIN). Klassische Abschluss-Techniken wirkten bei großen Käufen eher negativ.
*Quelle:* Rackham (1988): *SPIN Selling*, McGraw-Hill.
**Für Platzhirsch:** Der Leitfaden in 2.6 basiert auf Fragen, nicht auf Präsentation. Ein 60-minütiger Termin besteht zu mindestens **50 % aus Zuhören**.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Der Pfad: sechs Stufen und ihre Zielwerte

| Stufe | Was der Kunde tut | Was die Website und das Team liefern | Messpunkt (GA4 / Frappe) | Zielwert M6 [Schätzung, nach 3 Monaten Messung anpassen] |
|---|---|---|---|---|
| 0 Besuch | liest, schaut | Ruhe, Bilder, Preisrahmen, Ort | `page_view` | – |
| 1 Interesse | legt ein Stück in „Ihre Auswahl“, öffnet Ratgeber, startet WhatsApp | Auswahl ohne Login, „Auswahl im Showroom ansehen“ | `add_to_wishlist`, `contact_click` | ≥ 4 % der Sitzungen |
| 2 Kontakt | bucht einen Termin, wünscht einen Rückruf, stellt eine Anfrage | Kalender, Rückruf, kurzes Formular | `generate_lead` (`form: termin/rueckruf/beratung`) | ≥ 1,2 % der Sitzungen, davon ≥ 50 % als Termin |
| 3 Erstgespräch | erscheint | Erinnerungen, Vorbereitung, Gastgeber | Frappe Stufe 3 | No-Show ≤ 10 % |
| 4 Angebot | bekommt ein Angebot | Angebot in ≤ 5 Werktagen, persönlich erklärt | Frappe Stufe 4 | ≥ 60 % der Erstgespräche |
| 5 Auftrag | zahlt an | Nachfassen 3/14/45, Einwand-Antworten | Frappe Stufe 6 | ≥ 30 % der Angebote |

**Regel:** Jede Seite der Website hat **einen** Haupt-Schritt (Stufe 1 oder 2) und **einen** leisen Alternativ-Schritt. Nie mehr als zwei Handlungsaufforderungen im sichtbaren Bereich.

### 2.2 CTA-Formulierungen

**Bauregeln:**
1. **Verb + konkreter Gegenstand**, 2–4 Wörter. Kein „Jetzt“, kein Ausrufezeichen, kein „Mehr erfahren“ als Haupt-CTA.
2. Darunter **eine Zeile Mikrotext**, die die drei häufigsten Unsicherheiten beantwortet: **Dauer · Kosten · Verpflichtung**. Schriftgröße 13–14 px, Kontrast ≥ 4,5:1 (13, A11y).
3. Der Knopftext beschreibt, **was nach dem Klick passiert** („Uhrzeit wählen“ öffnet den Kalender). Er darf nichts versprechen, was danach nicht kommt.
4. **Sie**-Form, Gastgeber-Ton (12, 3.1). Keine Zweite-Person-Befehle wie „Sichern Sie sich…“.
5. Primär-CTA: gefüllte Fläche, Mindestgröße **44 × 44 px** Touch-Ziel (WCAG 2.5.5 empfiehlt 44 px, 2.5.8 verlangt mindestens 24 px). Sekundär: Textlink mit Unterstreichung. Höchstens **ein** gefüllter Knopf pro Viewport.
6. Gleiche Handlung = gleiches Wort auf der ganzen Website (Konsistenz senkt Denkaufwand). Das Glossar wird in `src/messages/*.json` hinterlegt.

**Formulierungen je Ort (DE, verbindlich als Ausgangspunkt für A/B-Tests):**

| Ort | Primär | Mikrotext darunter | Sekundär |
|---|---|---|---|
| Startseite, Hero | **Besuch im Showroom planen** | 60 Minuten · kostenlos · auch samstags · Espresso inklusive | Live per Video beraten lassen |
| Produktseite | **Dieses Stück im Showroom sehen** | Wir stellen es mit Stoffmustern für Sie bereit [nur wenn Ausstellungs-Flag; sonst: „Wir beraten Sie zu Ausführungen und Stoffen“] | In Ihre Auswahl · Per WhatsApp fragen |
| „Ihre Auswahl“ (Merkliste) | **Auswahl im Showroom ansehen** | Wir bereiten Ihre Stücke vor dem Termin vor | Als PDF mitnehmen · Rückruf wünschen |
| Markenseite (z. B. Minotti) | **Minotti in Lochau erleben** | Beratung zu Modellen, Bezügen und Lieferzeit | Preisrahmen ansehen (Ratgeber) |
| Küche | **Küchenplanung besprechen** | 120 Minuten · Grundriss gern mitbringen oder hochladen | Beispielprojekte ansehen |
| Schweiz / FL | **Projekt in Franken besprechen** | Lieferung, Verzollung und Montage aus einer Hand. Preis verbindlich in der Offerte | Video-Beratung aus der Schweiz |
| Ratgeber-Artikel | **Frage an unser Team** (WhatsApp/Formular) | Antwort am selben Werktag | Termin wählen |
| Mobile Leiste (`MobileCtaBar`) | **Termin wählen** | – | Anrufen · WhatsApp (3 Felder, nicht 2) |
| Danke-Seite nach Anfrage | **Jetzt gleich Uhrzeit wählen** | Dann bereiten wir alles vor | Per WhatsApp weiterschreiben · Anfahrt |

Heute steht dort „Termin anfragen“ (`de.json: mobileAppointment`) und „Anfrage senden“. „Anfragen“ klingt nach Warten und Unsicherheit („Bekomme ich einen?“). **„Wählen“** gibt Kontrolle und sofortige Gewissheit.

**Formulierungen, die nicht verwendet werden:** „Jetzt zuschlagen“, „Nur noch heute“, „Unverbindlich anfragen!“ (Ausrufezeichen, Defensiv-Ton), „Kostenloses Erstgespräch sichern“ (Kampf-Wort), „Minotti-Händler“ (23, 2.3 Nr. 1), „Nein danke, ich will kein schönes Zuhause“ (Confirmshaming).

### 2.3 Terminangebote

**Vier Beratungsarten, eine Leiste.** Mehr ist schwer vergleichbar (E8). Die Hausbesuche/Aufmaß entstehen erst aus dem Erstgespräch und werden nicht öffentlich gebucht (05, 3).

| Art | Dauer | Für wen | Vorlauf min. | Zeiten | Was der Kunde vorher angibt (max. 3 Pflichtfragen) |
|---|---|---|---|---|---|
| **Showroom-Besuch** | 60 min | Wohnen, Outdoor, Licht | 4 h | Mo–Fr 10–18, **Sa 10–16** (23 empfiehlt Samstag bis 16/17 Uhr zu testen), Do bis 20 Uhr (langer Donnerstag) | Raum · Zeitrahmen · Land |
| **Planung Küche / Gesamtprojekt** | 120 min | Bauherren, Wohnungskäufer, Architekten | 24 h | wie oben, kein Slot nach 17 Uhr | Projektart · Bauphase · Grundriss (optional) |
| **Video-Rundgang live** | 30 min | CH, FL, DE-Nordufer, Arlberg-Zweitwohnsitz | 4 h | Mo–Sa, zusätzlich Abendslots Di/Do 18:30 und 19:15 | Raum · Wunschstücke · Sprache |
| **Rückruf** | 15 min | wer reden, aber nicht reisen will | 30 min | Öffnungszeiten | Telefon · Thema · Wunsch-Zeitfenster |

**Regeln für den Kalender:**
- **Zuerst die nächsten 3 freien Uhrzeiten zeigen** (z. B. „Do 29.10., 16:30 · Sa 31.10., 10:00 · Sa 31.10., 11:30“), dazu „Weitere Termine“. Das senkt die Entscheidung auf einen Klick und ist eine Umsetzungsabsicht (E3).
- **Echte Verfügbarkeit, keine Hinweise auf Knappheit.** Kein „Nur noch 2 Termine frei“, auch dann nicht, wenn es stimmt. Das ist kein Gastgeber-Ton und für Kunden nicht prüfbar.
- **Berater mit Foto und Vornamen** in der Buchung zeigen („Sie werden von Andreas empfangen“). Sympathie und Ähnlichkeit (Cialdini) wirken nur, wenn es einen echten Menschen gibt.
- **Umbuchen und Absagen mit einem Klick** in jeder Bestätigung. Wer leicht absagen kann, sagt ab statt einfach wegzubleiben. Damit wird der Slot wieder frei.
- **Erinnerungen** (E2), transaktional, ohne Werbung (14, F8):
  - Sofort: Bestätigung mit Datum, Berater, Adresse, Parken, „Was Sie mitbringen können: Fotos, Grundriss, Maße“.
  - **T−48 h:** „Wir haben für Sie vorbereitet: [Stücke aus Ihrer Auswahl], Stoffmuster in [Farbe]. Passt der Termin noch?“ (Bestätigen / Umbuchen)
  - **T−3 h:** Anfahrt, Parkplatz, Tisch im Café ist reserviert.
- **No-Show:** Am selben Tag eine freundliche Nachricht („Wir haben Sie vermisst. Hier ist ein neuer Termin, wenn es passt“), **kein** Vorwurf, kein zweiter Versuch per Telefon am selben Tag. Nach 7 Tagen einmal persönlich anrufen, danach Ruhe.
- **Ziel:** Buchung in **≤ 4 Klicks** und **≤ 60 s** ab dem Klick auf den CTA, gemessen im Nutzertest mit 5 Personen ab 55 Jahren.

### 2.4 Formulare und Rückruf

**Pflichtfelder höchstens 3 bei Termin/Rückruf, höchstens 4 bei der Anfrage.** Baymard zeigt seit Jahren, dass unnötige Felder die häufigste vermeidbare Hürde in Formularen sind (Baymard Institute, Checkout-Benchmark: Ø 11 Felder, möglich wären 8). Heute: 8 Pflichtfelder inkl. Adresse und UID in der Produktanfrage (05, 1.2).

| Formular | Pflicht | Optional | Fällt weg |
|---|---|---|---|
| Rückruf | Vorname, Telefon, Zeitfenster (heute vormittags / nachmittags / morgen / Datum) | Thema, Produkt (vorbefüllt) | E-Mail, Adresse |
| Termin | Name, E-Mail **oder** Telefon, Beratungsart + Uhrzeit | Raum, Land, Zeitrahmen, Grundriss | Adresse, UID |
| Anfrage | Name, E-Mail oder Telefon, Land, Nachricht (vorbefüllt mit Produkt/Auswahl) | Budget **als Spanne**, Zeitrahmen | Adresse, Stadt, UID („für das Angebot später“) |

- **Budget-Frage** nie als Pflichtfeld und nie als offene Zahl. Formulierung: „Haben Sie schon einen Rahmen im Kopf? Das hilft uns, passende Stücke vorzubereiten.“ Antworten: *noch offen · bis 10.000 € · 10.000–30.000 € · 30.000–80.000 € · über 80.000 €* (CH-Seite in CHF). „Noch offen“ steht **oben**, damit sich niemand gezwungen fühlt.
- **Telefon ist nie Pflicht, außer beim Rückruf.** Wer es nicht hergibt, will vorerst schreiben.
- **Antwortversprechen** sichtbar über dem Absenden-Knopf: „Wir melden uns am selben Werktag, spätestens bis 12 Uhr am nächsten.“ Es wird nur versprochen, was das Team einhält (siehe 2.5).
- **Danke-Zustand** (heute nach 5 s weg) bleibt stehen und bietet sofort die Uhrzeit-Wahl an (E3, 2.2).

**Rückruf-Service:**
- **SLA:** innerhalb von **2 Stunden** während der Öffnungszeiten (05, F7), sonst bis **10:00 Uhr am nächsten Werktag**. Messung: Zeitstempel Anfrage → erster Anruf in Frappe, Ziel ≥ 90 % innerhalb des SLA (E1).
- Wer anruft, nennt im **ersten Satz Namen, Grund und Zeitbedarf**: „Grüß Gott, Andreas Wegscheider von Platzhirsch in Lochau. Sie haben einen Rückruf zum Minotti-Sofa gewünscht. Passen fünf Minuten gerade?“
- Ziel des Rückrufs ist **nicht** das Verkaufen, sondern **eine** Klärung und **ein** Termin. Ende immer mit einer Wahl aus zwei echten Uhrzeiten („Wäre Donnerstag 16:30 oder Samstag 10:00 besser?“). Das ist eine Wahl, keine Falle, solange „Keiner davon“ selbstverständlich akzeptiert wird.
- Nicht erreicht: SMS/WhatsApp „Ich habe Sie gerade nicht erreicht, ich versuche es um [Uhrzeit] noch einmal. Oder Sie wählen hier selbst einen Termin: [Link]“. **Höchstens 3 Versuche in 3 Tagen**, dann Ruhe.

### 2.5 Teamregeln, ohne die die Website nichts nützt
- Ein **Dienst-Plan „Erste Antwort“**: jeden Tag eine benannte Person, die neue Leads zuerst bearbeitet (5-Personen-Team, 05, Pflege).
- **Erstkontakt < 24 h** ist der Mindestwert (11, 3.1), **Zielwert < 1 h** in den Öffnungszeiten (E1).
- Jede Anfrage bekommt in Frappe **Herkunft, Land, Kanal, Beratungsart** (11, F1). Ohne diese Felder lässt sich keine Vorgabe dieses Papiers prüfen.

### 2.6 Erstgespräch-Leitfaden (Showroom, 60 Minuten)

**Vorbereitung (15 min vorher):** Anfrage und „Ihre Auswahl“ lesen. Die Stücke (sofern ausgestellt) frei räumen, Stoff-/Materialmuster der Wunsch-Ausführung auf den Tisch, Café-Tisch reservieren, Name auf einer Tischkarte. Das ist der **Höhepunkt** (E7) und echte Gegenseitigkeit: Der Kunde bekommt Arbeit geschenkt, die er sieht (Labor Illusion, E4).

| Minute | Phase | Ziel | Formulierungen / Fragen | Vermeiden |
|---|---|---|---|---|
| 0–5 | **Ankommen** | Gast, nicht Kunde | „Schön, dass Sie da sind. Espresso oder lieber etwas Kaltes?“ – „Wir haben Ihre Auswahl schon vorbereitet, schauen wir zuerst in Ruhe.“ | Sofort ins Produkt springen, Visitenkarte vor dem Kaffee |
| 5–10 | **Rahmen setzen** | Kontrolle beim Kunden | „Wir haben eine Stunde. Ich würde gern zuerst verstehen, wie Sie wohnen, dann zeigen wir passende Stücke, und am Ende sagen Sie mir, ob ein Angebot sinnvoll ist. Passt das so?“ | „Ich zeig Ihnen mal alles“ |
| 10–25 | **Situation und Problem** (SPIN, E10) | Projekt verstehen | „Erzählen Sie mir von dem Raum: Größe, Licht, Blick?“ – „Wer wohnt dort, und wie wird der Raum am Abend genutzt?“ – „Was stört Sie heute am meisten?“ – „Bis wann soll es fertig sein, und was hängt daran (Einzug, Saison, Vermietung)?“ | Mehr als 3 Fragen ohne Zuhören. Fragen, deren Antwort schon in der Anfrage stand |
| 25–40 | **Zeigen, testen, anfassen** | Erleben statt erklären | Höchstens **3 Stücke** pro Kategorie zeigen (E8). „Setzen Sie sich bitte quer, so sitzen Sie abends.“ – Stoff an das Fenster halten, Muster mitgeben. Maße am Grundriss mit Klebeband auf dem Boden markieren | 10 Alternativen; Fachjargon ohne Nutzen |
| 40–50 | **Rahmen klären** | Budget, Entscheider, Ablauf | „Damit ich ein Angebot mache, das zu Ihnen passt: Welcher Rahmen fühlt sich für das ganze Projekt richtig an?“ – „Wer entscheidet mit? Wollen wir die Person beim nächsten Mal per Video dazu holen?“ – Bei CH/FL: „Soll die Offerte in Franken mit Verzollung und Montage kommen?“ | Budget als Erstes fragen; Druck auf sofortige Entscheidung |
| 50–60 | **Nächster Schritt** | Eine konkrete Vereinbarung | Zusammenfassung in 3 Sätzen („Sie wollen …, wichtig ist …, bis …“), dann: „Ich schicke Ihnen bis **Mittwoch** zwei Varianten. Wollen wir gleich einen Termin von 30 Minuten ausmachen, in dem ich sie Ihnen erkläre, vor Ort oder per Video?“ | „Melden Sie sich einfach“; Rabatt anbieten, um zu „schließen“ |

**Nach dem Termin (am selben Tag, spätestens 18 Uhr):** persönliche E-Mail mit 3–5 Fotos der gezeigten Stücke, den besprochenen Maßen, dem Liefertermin des Angebots. Aus Frappe heraus, damit die Antwort im Datensatz landet (11, F3).

**Video-Rundgang (30 min):** gleiche Phasen, gekürzt: 3 min Ankommen, 7 min Situation, 15 min Rundgang mit dem Gimbal (nur Stücke, keine anderen Besucher im Bild, 05, F4), 5 min nächster Schritt. Fragen per Formular vorab beantworten lassen.

### 2.7 Angebotsphase

**Regeln:**
1. **Angebot in ≤ 5 Werktagen** nach dem Erstgespräch (Küche/Gesamtprojekt: ≤ 10 Werktage), Datum im Gespräch nennen und halten.
2. **Angebot nie nur per PDF.** Immer ein Erklärtermin von 30 min (Showroom oder Video). Ohne Erklärung bleibt nur die Summe hängen, und die Summe ist der Einwand.
3. **Aufbau** (eine Seite Überblick, dann Positionen):
   - Ihr Projekt in 3 Sätzen (Wiederholung der Ziele des Kunden, mit seinen Worten).
   - **Zwei bis drei Varianten**, die jeweils komplett lieferbar sind: z. B. *A „Ihr Wunsch“*, *B „Gleiche Wirkung, andere Ausführung“* (anderer Bezug, Varenna statt Poliform), *C „In zwei Etappen“* (Wohnzimmer jetzt, Terrasse im Frühling). Keine künstlich überteuerte Lockvariante (E8, das wäre ein Decoy, das das Vertrauen kippt, sobald es auffällt).
   - **Alles drin, was am Ende bezahlt wird:** Ware, Lieferung, Montage, Entsorgung der Verpackung, bei CH/FL Verzollung, MWST 8,1 %, Elektro-Partner. Keine Kosten, die erst später auftauchen (UGP: versteckte Kosten). Für CH-Konsumenten Preis in **CHF inkl. MWST und Abgaben** (PBV, 14, F7).
   - **Was Platzhirsch tut** in einer Liste mit 6–8 Arbeitsschritten (Aufmaß, Bestellung, Kontrolle der Ware im Lager, Verzollung, Montage-Team, Übergabe, Wintereinlagerung Outdoor). Das ist sichtbare Arbeit (E4).
   - **Lieferplan** mit Wochen statt „ca. 12 Wochen“ (siehe 2.9 Lieferzeit).
   - **Zahlungsweise:** Anzahlung, Rest bei Lieferung. „Ihre Anzahlung ist abgesichert“ **nur**, wenn Garantie/Aval wirklich besteht, mit Garant und Bedingungen (14, F16). Finanzierung nur mit Standardinformation und repräsentativem Beispiel (14, F16).
   - **Gültigkeit:** 30 Tage, **mit dem echten Grund** („weil die Hersteller ihre Preislisten in der Regel zum Jahreswechsel bzw. nach dem Salone im April anpassen“ [je Marke prüfen]). Kein künstliches Ablaufdatum, um Druck zu machen.
4. **Runde Paketpreise** in der Übersicht (E5), exakte Positionen darunter.
5. **Rabatte:** Kein unaufgeforderter Rabatt. Wenn verhandelt wird, tauscht man Leistung gegen Leistung („Wenn Sie die Lieferung im Januar nehmen, wenn Montage und Abholung gebündelt werden können …“) statt einfach Prozente. Das schützt den Wert der Marke und das Verhältnis zu den Herstellern (14, F4: keine Preisbindung, aber Lieferbeziehung).

### 2.8 Nachfassen (Ergänzung zu 11, F3)

| Zeitpunkt | Kanal | Text (Kern, gekürzt) | Prinzip |
|---|---|---|---|
| Tag 0 (nach Erstgespräch) | E-Mail, persönlich | „Danke für Ihren Besuch. Hier die Fotos und Maße von heute. Das Angebot kommt bis Mittwoch.“ | Commitment: das Gesagte schriftlich |
| Angebot +1 | Erklärtermin | siehe 2.7 Nr. 2 | – |
| **+3** | Anruf (Aufgabe) | „Ist das Angebot gut angekommen? Gibt es eine Position, die wir noch einmal anschauen sollten?“ | Offene Frage, kein „Haben Sie sich entschieden?“ |
| **+14** | E-Mail, persönlich | Eine **passende** Referenz (gleiche Region oder gleicher Raumtyp: „Penthouse in Lindau, ähnlicher Grundriss“), ein neues Stoffmuster per Post anbieten, Café-Einladung. Anzahlung-/Finanzierungshinweis **nur**, wenn belegt (14) | Sozialer Beweis (ähnliche Personen), Gegenseitigkeit (Muster) |
| **+45** | Anruf + E-Mail | „Wie steht Ihr Projekt? Wenn es gerade ruht, ist das völlig in Ordnung. Darf ich mich im [Monat] wieder melden?“ Wenn nein: Verlustgrund erfassen (Preis, Lieferzeit, Wettbewerber, verschoben) | Respekt vor dem Nein; die Erlaubnis zum Wiederkommen holen |
| Ruhend +6 Monate | E-Mail | Nur mit echtem Anlass: neue Kollektion vom Salone, Ausstellungsstück aus der gezeigten Linie | Kein „Nur mal nachfragen“ |

**Nach dem Auftrag (Lieferzeit begleiten, E6):** 4 Status-Nachrichten. **Bestellt** (mit Wochenplan) → **In Fertigung** (wenn möglich ein Foto von der Manufaktur oder vom Stoff [nur mit Freigabe]) → **Unterwegs / verzollt** → **Montage-Termin** mit Namen des Teams. Ende: Übergabe-Ritual (E7) mit Pflegekarte und QR-Karte zur Bewertung (14, F11, ohne Review-Gating, 11, F7).

**Stopp-Regel:** Alle Nachfass-Schritte enden automatisch, wenn der Kunde antwortet, auftragt oder „Bitte nicht mehr“ sagt. Marketing-Mails nur mit Einwilligung (14, F17).

### 2.9 Einwände: Haltung, Satz, Beweis, Ort auf der Website

**Grundhaltung (Methode „Anerkennen – Fragen – Erklären – Prüfen“):** Ein Einwand ist eine Bitte um Information, kein Angriff. Nie „Ja, aber“, nie den Einwand kleinreden. Zuerst **eine** Rückfrage: Was steckt dahinter?

| Einwand | Was oft dahinter steckt | Antwort im Gespräch | Beweis | Wo auf der Website vorab beantwortet |
|---|---|---|---|---|
| **„Das ist mir zu teuer.“** | Fehlender Vergleich, Angst vor Fehlkauf, wirklich zu hohes Budget | „Danke, dass Sie das offen sagen. Zu teuer im Vergleich zu was – zu Ihrem Rahmen oder zu einem anderen Angebot?“ → Rahmen: Variante B/C zeigen. → Vergleich: Positionen nebeneinander (Montage, Verzollung, Lieferung inklusive?). → Wert: Lebensdauer, Bezug austauschbar, Wiederverkaufswert [nur, wenn belegbar] | Aufgeschlüsseltes Angebot, Ausstellungsstücke als echte Alternative | Ratgeber „Was kostet ein … ?“ mit Spannen und Kostentreibern (E4), Ausstellungsstücke mit echtem Preis (14, F4/F5) |
| **„Im Internet gibt es das günstiger.“** | Preisvergleich mit Online-Händlern ohne Leistung | „Das kann gut sein. Darf ich kurz zeigen, was in unserem Preis drin ist?“ → Aufmaß, Prüfung im Lager, Montage, Reklamation vor Ort, Wintereinlagerung. „Wenn Sie das alles nicht brauchen, ist der Online-Kauf vielleicht wirklich besser für Sie.“ | Leistungsliste (2.7) | Seite „Was wir tun“ mit den 8 Arbeitsschritten und Fotos vom Montage-Team |
| **„Die Lieferzeit ist zu lang.“** | Fester Termin (Einzug, Saison), Unsicherheit | „Bis wann muss es stehen, und was passiert, wenn es später kommt?“ → **Wochenplan rückwärts vom Einzugstermin**, offener Hinweis auf Risiken (Manufaktur-Ferien im August [prüfen]). → Alternativen: Ausstellungsstück, schneller lieferbare Ausführung, Übergangslösung (Leihstück aus der Ausstellung [nur wenn vertretbar]) | Status-Nachrichten (2.8) | Auf der Produktseite **Lieferzeit-Spanne** (Backoffice-Feld, 05, F5) und „So läuft Ihre Bestellung“ in 5 Schritten (E6) |
| **„Wie läuft das über die Grenze? Zoll ist mir zu kompliziert.“** (CH/FL) | Angst vor Zusatzkosten, Aufwand, Ärger am Zoll | „Das nehmen wir Ihnen ab. Sie bekommen eine Offerte in Franken, mit MWST 8,1 %, Verzollung, Lieferung und Montage. Der Zoll selbst ist für Möbel seit 2024 abgeschafft, die Anmeldung erledigt unser Spediteur.“ Ehrlich: „Für die Montage in der Schweiz brauchen wir 8 Tage Vorlauf für die Meldung, darum planen wir feste Service-Tage.“ (23, 2.3 Nr. 16) | Musterofferte (anonymisiert), Name des Zollpartners | Seite Schweiz/FL: Ablauf in 4 Schritten, Rechner als „unverbindliche Kostenschätzung“ (14, F7). **Kein** „Festpreis“-Claim, bevor der Prozess steht (14, F7) |
| **„Ich muss das mit meinem Partner / Architekten besprechen.“** | Echte Mitentscheidung oder höfliches Nein | „Natürlich. Was wäre für ihn/sie wichtig? Sollen wir einen kurzen Video-Termin zu dritt machen, oder schicke ich Ihnen eine Zusammenfassung, die Sie weitergeben können?“ | 1-Seiten-Zusammenfassung, Architekten-Datenblatt (CAD/Maße) | „Für Architekten“-Bereich mit Datenblättern (23, 8.1) |
| **„Das gibt es bei Höttges / in Dornbirn auch.“** | Vergleich, Loyalität, Nähe | Wettbewerber **nie** schlechtreden (Vergleichswerbung, 14, F16). „Gut, dass Sie vergleichen. Was ist Ihnen bei der Wahl des Hauses wichtig?“ Dann eigene Stärken, die stimmen: Samstag offen, Café, Gesamtprojekt Küche + Wohnen + Outdoor, Nordufer, CHF-Offerte (23, 4.3) | – | Keine Wettbewerber-Namen auf der Website |
| **„Gibt es Sie in zwei Jahren noch?“** (nach den regionalen Insolvenzen, 23, 2.2) | Angst um Anzahlung und Gewährleistung | Nicht ausweichen. Nur sagen, was belegt ist: Anzahlungssicherung (wenn vorhanden), Zahlungsplan mit kleiner Anzahlung, Herstellergarantie läuft über die Marke [je Marke prüfen]. Nie „Wir sind kerngesund“ ohne Beleg (UWG § 2 AT, Irreführung) | Garantie-Dokument (wenn vorhanden) | Seite „Sicherheit für Ihre Anzahlung“ erst, wenn das Aval besteht (14, F16) |
| **„Ich schau mich erst noch um.“** | Frühe Phase | „Sehr gern. Darf ich Ihnen Ihre Auswahl als PDF mitgeben, mit Maßen und Stoffmustern? Dann haben Sie beim Vergleichen alles dabei.“ | Auswahl-PDF (01, F9) | „Als PDF mitnehmen“ in „Ihre Auswahl“ |

### 2.10 Cialdinis sieben Prinzipien: richtig und falsch angewandt

Grundlage: Cialdini (2021), *Influence, New and Expanded* (7 Prinzipien inkl. „Einheit“); Goldstein, Cialdini & Griskevicius (2008), *JCR* 35(3) (sozialer Beweis wirkt stärker, wenn die Bezugsgruppe ähnlich ist). **Ethik-Test vor jedem Einsatz:** *Würde das Prinzip noch wirken, wenn der Kunde genau wüsste, was wir tun und warum?* Wenn nein, wird es nicht verwendet (E9).

| Prinzip | Richtig (wird umgesetzt) | Falsch (verboten) | Ort |
|---|---|---|---|
| **Gegenseitigkeit** | Echte Vorleistung ohne Bedingung: Espresso, vorbereitete Muster, ein Ratgeber mit Preisspannen, Stoffmuster per Post, Auswahl-PDF | „Geschenk“ nur gegen E-Mail-Adresse und Werbe-Einwilligung, die man nicht merkt | Ratgeber, Termin, Nachfassen +14 |
| **Commitment und Konsistenz** | Freiwillige Mikro-Schritte (Auswahl, Beratungsart, Uhrzeit); Zusammenfassung mit den Worten des Kunden | Vorausgewählte Häkchen, „Sie haben doch gesagt …“ als Druckmittel, Abo-Fallen | Buchung, Erstgespräch, Angebot |
| **Sozialer Beweis** | Echte Bewertungen mit Datum und Prüf-Hinweis (14, F11); Referenzen aus **ähnlichen** Situationen („Chalet in Lech“, „Stockwerkeigentum in St. Gallen“), mit Freigabe | Gekaufte/selektierte Bewertungen, „1.000 zufriedene Kunden“ ohne Beleg, Fake-Live-Hinweise („Gerade sehen sich 5 Personen dieses Sofa an“), `aggregateRating` aus Google-Bewertungen | Referenzen, Regionsseiten, Footer |
| **Sympathie** | Echte Gesichter und Vornamen des Teams, regionale Sprache (Pfänder, Föhn), Gemeinsamkeiten wirklich zeigen | Stockfotos von „Beratern“, gespielte Freundschaft, Schmeichelei | Über uns, Buchung |
| **Autorität** | Belegtes Wissen: Ratgeber mit Autorennamen, Materialkunde, Reisen nach Mailand, Architekten-Partner; nur **ClassiCon** als „offizieller Händler“ | „Minotti-Händler“, „autorisiert“, erfundene Auszeichnungen, Fake-Siegel | Ratgeber, Marken, Footer |
| **Knappheit** | **Nur echte Einzelstücke:** „Ausstellungsstück, einmal vorhanden“ (stimmt bei Ausstellungsstücken); echte Event-Plätze („Adventsabend: 40 Plätze, weil das Café 40 Plätze hat“) | Countdown-Timer, „Nur noch heute“, „Nur 2 Termine frei“, künstliche Angebotsfristen (UGP Anhang I Nr. 7) | Atelierverkauf, Events |
| **Einheit** (Unity) | Echte Zugehörigkeit: „Am Bodensee zuhause“, Nachbarschaft über drei Grenzen, Lochauer Gespräche für Architekten | Vereinnahmung („Wir Bodensee-Menschen kaufen bei …“), Nationalismus, Ausgrenzung | Markenstimme, Events |

### 2.11 KPI-Tafel für diese Disziplin (monatlich, Frappe + GA4)

| Kennzahl | Definition | Ziel M6 [Schätzung] |
|---|---|---|
| Antwortzeit Median | Anfrage → erster persönlicher Kontakt (Öffnungszeiten) | ≤ 60 min |
| SLA-Quote Rückruf | Anteil Rückrufe innerhalb von 2 h | ≥ 90 % |
| Termin-Anteil | Termine / alle Leads | ≥ 50 % |
| No-Show-Quote | nicht erschienen / gebuchte Termine | ≤ 10 % |
| Angebotsquote | Angebote / stattgefundene Erstgespräche | ≥ 60 % |
| Angebot pünktlich | Angebote zum zugesagten Datum | ≥ 95 % |
| Abschlussquote | Aufträge / Angebote | ≥ 30 % |
| Verlustgründe | Anteil Preis / Lieferzeit / Wettbewerb / verschoben | erfasst bei 100 % |
| Bewertung nach Lieferung | QR-Karte → Bewertung | ≥ 30 % |

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Ihre Auswahl wartet auf Sie.“** Wer online drei Stücke in die Auswahl legt und einen Termin bucht, findet sie im Showroom **vorbereitet**: Stücke frei geräumt, Stoffmuster auf dem Tisch, Tischkarte mit Namen. Höttges verlangt eine E-Mail, um überhaupt einen Termin zu bekommen (05, 2.2). Diese Idee verbindet Website, Café und Beratung, also die Alleinstellung Nr. 1 (23, 4.2).
2. **Die nächsten drei Uhrzeiten direkt im Hero.** Statt „Kontakt“ steht auf der Startseite: „Do 16:30 · Sa 10:00 · Sa 11:30 – Espresso inklusive“. Ein Klick, dann Name. Kein Wettbewerber im Dreiländereck zeigt Uhrzeiten auf der Startseite.
3. **Musterbox nach Hause.** Nach dem Video-Rundgang schickt Platzhirsch 3–5 Stoff-/Materialmuster der besprochenen Ausführungen kostenlos in die Schweiz, nach FL oder an den Arlberg (Gegenseitigkeit, E7). Für Zweitwohnsitze, die nicht nach Lochau kommen, ist das der fehlende Schritt.
4. **Offene Preisrahmen.** Ratgeber „Was kostet eine Poliform-Küche?“ mit Spannen, Treibern und einem Beispiel: Kein Premium-Haus in der Region tut das (23, 4.2 Nr. 4). Der Preiseinwand ist entschärft, bevor der Kunde kommt (E4).
5. **Lieferzeit als Logbuch.** Nach dem Auftrag bekommt der Kunde vier Status-Nachrichten mit Wochenplan, in der Fertigung ein Foto aus der Manufaktur, wenn freigegeben (E6). Aus der Wartezeit wird Vorfreude statt Sorge.
6. **Offerte in Franken mit Erklärtermin.** CH-Kunden bekommen keine PDF-Summe, sondern 30 Minuten Video, in denen MWST, Verzollung und Montage-Service-Tage Zeile für Zeile erklärt werden. Fretz nennt weder CHF-Preise noch Verzollung (23, 4.2 Nr. 5).
7. **„Zweite Meinung zu Ihrem Grundriss“ für Bauherren.** Grundriss hochladen, in 3 Werktagen kommt eine Skizze mit Möblierungsvorschlag und Maßen (Leistung für den Erstgesprächstermin, nicht als kostenlose Komplettplanung). Wer seinen Grundriss schickt, hat schon investiert (Commitment, E3) und der IKEA-Effekt (Norton, Mochon & Ariely 2012, *Journal of Consumer Psychology* 22(3)) macht die eigene Mitarbeit wertvoll.
8. **Das Übergabe-Ritual.** Montage-Team, Pflegekarte mit dem Stoffnamen, ein kleines Café-Geschenk (Bohnen aus dem Café), QR-Karte für die Bewertung. Das Ende wird zum Höhepunkt (E7). Das bringt die Bewertungen, die Platzhirsch heute fehlen (6 Bewertungen, letzte 2022, 23, 2.1).
9. **„Ehrliche Antworten“-Block auf jeder Markenseite.** Drei Fragen, die Kunden wirklich stellen, mit zweiseitigen Antworten (E9, Eisend 2006): „Wie empfindlich ist Leinen?“, „Wie lange dauert die Lieferung?“, „Was kostet ein Bezugswechsel?“. Das wirkt glaubwürdiger als jede Werbezeile.
10. **Architekten-Direktbuchung.** Eigener Termintyp „Material-Session für Planer (45 min)“, mit Musterbibliothek und CAD-Daten am Ende. So kommt ein Architekt mit Bauherr ins Haus, bevor ein Wettbewerber davon weiß (23, 8.1).

---

## 4. Was man auf keinen Fall tun darf

| Verbot | Warum |
|---|---|
| Countdown-Timer, „Nur noch heute“, künstliche Angebotsfristen | UGP-RL Anhang I Nr. 7, AT/DE UWG Anhang Nr. 7; EU-Sweep 2023: 42 Shops mit Fake-Countdown (E9); für Luxus markenschädlich |
| „Nur noch 2 Termine frei“, „5 Personen sehen sich das gerade an“ | Nicht prüfbar, Druck statt Gastgeber; Irreführungsrisiko |
| Confirmshaming („Nein danke, ich brauche keine Beratung“) | Dark Pattern nach EU-Leitlinien; zerstört den Ton der Marke |
| Vorausgewählte Häkchen für Newsletter oder Werbe-Einwilligung | DSGVO Art. 7 / EuGH Planet49 (C-673/17) |
| Telefon als Pflichtfeld außerhalb des Rückrufs; Adresse/UID bei der Erstanfrage | Unnötige Hürde (05, 1.2) |
| Versteckte Kosten (Lieferung, Montage, Verzollung erst im Angebot oder danach) | UGP, PrAG/PAngV, PBV (14, F4/F7) |
| „Minotti-Händler“, „autorisiert“, „offizieller Partner“ (außer ClassiCon) | 23, 2.3 Nr. 1; 12, 3.1 |
| „Ihre Anzahlung ist abgesichert“, „Festpreis“, „0 % Finanzierung“ ohne bestehende Grundlage | Irreführung (§ 2 UWG AT), VKrG/PAngV (14, F16) |
| Wettbewerber schlechtreden, im Gespräch oder online | Vergleichswerbung, Stil |
| Unaufgeforderter Rabatt zum „Schließen“ | Entwertet Marke und Angebot; trainiert Kunden zum Verhandeln |
| Lockvogel-Variante im Angebot, die niemand kaufen soll | Wird erkannt, kostet Vertrauen (E9) |
| Bewertungen nur von zufriedenen Kunden erbitten (Review-Gating), Anreize für Bewertungen | Google-Richtlinie, UWG/Omnibus (14, F11) |
| Mehr als 3 Nachfass-Versuche ohne Antwort; Nachfassen nach einem klaren Nein | Belästigung; Marketing-Mails nur mit Einwilligung (14, F17) |
| Live-Chat-Fenster, das „Wir sind gleich für Sie da“ verspricht, ohne dass jemand da ist | Enttäuschung im ersten Kontakt (05, F6) |
| Lieferzeit schönreden („ca. 6 Wochen“, wenn es 12 werden) | Der teuerste Einwand ist der, der erst nach dem Auftrag kommt |
| Pop-up mit Newsletter in den ersten 30 s oder vor dem ersten Scroll | Unterbricht genau den Moment, in dem Vertrauen entsteht; Google straft aufdringliche Interstitials auf Mobilgeräten ab |

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Vorgehen:** Jeder Prototyp wird von 2 Personen unabhängig bewertet (mobil 390 px und Desktop 1440 px). Zusätzlich ein kurzer Nutzertest mit 5 Personen (davon mindestens 2 über 55 Jahre und 1 Person aus der Schweiz): Aufgabe „Buchen Sie einen Showroom-Termin für Samstag“ und „Finden Sie heraus, was ein Sofa dieser Marke ungefähr kostet“.

**Skala je Kriterium:** 0 = fehlt oder schadet · 1 = vorhanden, aber schwach/unklar · 2 = gut · 3 = vorbildlich, besser als jeder Wettbewerber. **Gewicht** multipliziert die Punkte.

### A. Weg zum Termin (Gewicht 3)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| A1 | Ein Primär-CTA zum Termin im ersten Viewport (mobil und Desktop) | keiner oder mehrere gleich laute | genau einer, mit Mikrotext Dauer · Kosten · Verpflichtung |
| A2 | Klicks und Zeit bis zur gebuchten Uhrzeit | > 6 Klicks oder nur Anfrage-Formular | ≤ 4 Klicks, ≤ 60 s im Test |
| A3 | Konkrete Uhrzeiten sichtbar (oder als Platzhalter vorgesehen) | nein | nächste 3 Uhrzeiten direkt sichtbar |
| A4 | Beratungsarten (Showroom, Küche, Video, Rückruf) | keine Wahl | 3–4 Arten, klar beschrieben, keine mehr |
| A5 | Rückruf-Option mit Zeitfenster und Antwortversprechen | fehlt | vorhanden, Versprechen konkret (2 h) |

### B. Hürden und Formulare (Gewicht 2)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| B1 | Pflichtfelder | > 5 oder Telefon/Adresse Pflicht | ≤ 3 (Termin/Rückruf), ≤ 4 (Anfrage) |
| B2 | Budget-Frage | Pflicht oder offene Zahl | optional, Spannen, „noch offen“ zuerst |
| B3 | Kontext wird übernommen (Produkt, Auswahl) | Kunde tippt alles neu | vorbefüllt, sichtbar und änderbar |
| B4 | Danke-Zustand | verschwindet / Sackgasse | bleibt, bietet Uhrzeit, WhatsApp, Anfahrt |
| B5 | Datenschutzhinweis und Fehlerzustände | fehlen oder technisch | kurz, verständlich, barrierefrei angekündigt |

### C. CTA-Sprache und Ton (Gewicht 2)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| C1 | CTAs: Verb + Gegenstand, 2–4 Wörter, beschreiben das Danach | „Mehr“, „Absenden“, „Jetzt …!“ | durchgehend nach 2.2 |
| C2 | Gastgeber-Ton (Sie, ruhig, konkret, keine Superlative) | Werbesprech | wie 12, 3.1, Café als Teil der Einladung |
| C3 | Konsistenz: gleiche Handlung = gleiches Wort | wechselnd | einheitlich auf allen Seiten |
| C4 | Touch-Ziele und Kontrast der CTAs | < 24 px oder Kontrast < 4,5:1 | ≥ 44 px, Kontrast ≥ 4,5:1, Fokus sichtbar |

### D. Vertrauen und Einwände vorab (Gewicht 3)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| D1 | Preis: Rahmen oder Weg zum Preisrahmen sichtbar | „Preis auf Anfrage“ ohne Hilfe | Preisspanne/Ratgeber-Link am Produkt oder an der Marke |
| D2 | Lieferzeit: Spanne und Ablauf erklärt | fehlt | Spanne + „So läuft Ihre Bestellung“ |
| D3 | Grenze/Zoll: Ablauf CH/FL in klaren Schritten | fehlt oder „steuerfrei!“ | 4 Schritte, CHF, MWST, Kostenschätzung als solche gekennzeichnet |
| D4 | Menschen: echte Gesichter, Namen, Ort | Stockfotos oder anonym | Team mit Namen, Café, Showroom echt |
| D5 | Sozialer Beweis | Fake oder `aggregateRating` | echte Referenzen ähnlicher Kunden, Bewertungen mit Prüf-Hinweis |

### E. Ethik und Recht (Gewicht 3, **K.-o.-Kriterium**: eine 0 hier bedeutet, dass der Prototyp so nicht live geht)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| E1 | Keine künstliche Knappheit, keine Countdowns, kein Zeitdruck | vorhanden | nichts davon; Knappheit nur bei echten Einzelstücken/Event-Plätzen |
| E2 | Kein Confirmshaming, keine vorausgewählten Häkchen, keine aufdringlichen Pop-ups | vorhanden | nichts davon |
| E3 | Keine Händler-Behauptungen außer ClassiCon; keine unbelegten Claims (Anzahlung, Festpreis, 0 %) | vorhanden | sauber nach 12, 3.1 und 14 |
| E4 | Keine versteckten Kosten | Kosten tauchen später auf | Liefer-/Montage-/Zollhinweis sichtbar, wo Preise stehen |

### F. Erlebnis-Brücke Website → Showroom (Gewicht 2)
| # | Kriterium | 0 | 3 |
|---|---|---|---|
| F1 | „Ihre Auswahl“ führt zum Termin („Auswahl im Showroom ansehen“) | Sackgasse | direkter Weg, Auswahl wird mitgegeben |
| F2 | Video-Weg für CH/FL/Arlberg sichtbar | fehlt | eigener, gut sichtbarer Einstieg |
| F3 | Café/Gastgeber als Grund zum Kommen | fehlt | ist Teil des Terminangebots, nicht nur der „Über uns“-Seite |
| F4 | Mobile Leiste: Anrufen · WhatsApp · Termin | fehlt oder verdeckt Inhalte | 3 Wege, erscheint nach dem ersten Screen, verdeckt nichts |

### Auswertung
- **Maximal:** A 5×3×3 = 45 · B 5×3×2 = 30 · C 4×3×2 = 24 · D 5×3×3 = 45 · E 4×3×3 = 36 · F 4×3×2 = 24 → **204 Punkte**.
- **≥ 163 (80 %)**: Vorlage für den Neuauftritt. **122–162**: gut, gezielte Nacharbeit an den schwächsten Kriterien. **< 122**: nicht weiterverfolgen, Ideen einzeln übernehmen.
- **K.-o.:** Jede **0 in Block E** sperrt den Prototyp, egal wie viele Punkte er sonst hat.
- **Nutzertest-Schwelle:** Mindestens 4 von 5 Testpersonen buchen ohne Hilfe einen Samstagstermin, und mindestens 3 von 5 finden eine Preisvorstellung.
- Auch Prototypen, die nur Gestaltung zeigen (z. B. mit Platzhalter-Kalender), werden bewertet. Ein Platzhalter zählt dann als 2, wenn Ort, Wortlaut und Ablauf erkennbar festgelegt sind.

---

## Quellen

- Oldroyd, J., McElheran, K., Elkington, D. (2011): The Short Life of Online Sales Leads. *Harvard Business Review*, März 2011. [BYU ScholarsArchive](https://scholarsarchive.byu.edu/facpub/9711)
- Robotham, D. et al. (2016): Using digital notifications to improve attendance in clinic: systematic review and meta-analysis. *BMJ Open* 6. [PubMed 27798006](https://pubmed.ncbi.nlm.nih.gov/27798006/)
- Berliner Senderey, A. et al. (2020): It's how you say it: Systematic A/B testing of digital messaging cut hospital no-show rates. *PLOS ONE*. [PMC7310733](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7310733/)
- Gollwitzer, P. M., Sheeran, P. (2006): Implementation intentions and goal achievement: A meta-analysis. *Advances in Experimental Social Psychology* 38, 69–119.
- Burger, J. M. (1999): The foot-in-the-door compliance procedure: A multiple-process analysis and review. *Personality and Social Psychology Review* 3(4), 303–325.
- Mohan, B., Buell, R. W., John, L. K. (2020): Lifting the Veil: The Benefits of Cost Transparency. *Marketing Science* 39(6). [INFORMS](https://informs.org/News-Room/INFORMS-Releases/News-Releases/New-Research-Finds-Cost-Transparency-Can-Increase-Sales-20), [HBS Working Paper 15-017](https://dash.harvard.edu/handle/1/13360007)
- Buell, R. W., Norton, M. I. (2011): The Labor Illusion: How Operational Transparency Increases Perceived Value. *Management Science* 57(9), 1564–1579.
- Wadhwa, M., Zhang, K. (2015): This Number Just Feels Right: The Impact of Roundedness of Price Numbers on Product Evaluations. *Journal of Consumer Research* 41(5), 1172–1185. [RePEc](https://ideas.repec.org/a/oup/jconrs/doi10.1086-678484.html)
- Maister, D. H. (1985): The Psychology of Waiting Lines. In: Czepiel, Solomon, Surprenant (Hrsg.), *The Service Encounter*, Lexington Books.
- Kahneman, D., Fredrickson, B. L., Schreiber, C. A., Redelmeier, D. A. (1993): When More Pain Is Preferred to Less: Adding a Better End. *Psychological Science* 4(6), 401–405.
- Iyengar, S. S., Lepper, M. R. (2000): When choice is demotivating. *Journal of Personality and Social Psychology* 79(6), 995–1006.
- Scheibehenne, B., Greifeneder, R., Todd, P. M. (2010): Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload. *Journal of Consumer Research* 37(3), 409–425.
- Simonson, I. (1989): Choice Based on Reasons: The Case of Attraction and Compromise Effects. *Journal of Consumer Research* 16(2), 158–174.
- Friestad, M., Wright, P. (1994): The Persuasion Knowledge Model. *Journal of Consumer Research* 21(1), 1–31.
- Eisend, M. (2006): Two-sided advertising: A meta-analysis. *International Journal of Research in Marketing* 23(2), 187–198.
- Norton, M. I., Mochon, D., Ariely, D. (2012): The IKEA effect: When labor leads to love. *Journal of Consumer Psychology* 22(3), 453–460.
- Rackham, N. (1988): *SPIN Selling*. McGraw-Hill.
- Cialdini, R. B. (2021): *Influence, New and Expanded: The Psychology of Persuasion*. Harper Business.
- Goldstein, N. J., Cialdini, R. B., Griskevicius, V. (2008): A Room with a Viewpoint. *Journal of Consumer Research* 35(3), 472–482.
- Kapferer, J.-N., Bastien, V. (2009): *The Luxury Strategy*. Kogan Page.
- Baymard Institute: Checkout Usability / Form Field Benchmark (laufend aktualisiert), baymard.com/research/checkout-usability.
- Europäische Kommission (2023): Pressemitteilung IP/23/418, Sweep zu manipulativen Online-Praktiken. [PDF](https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_23_418/IP_23_418_EN.pdf)
- Richtlinie 2005/29/EG (UGP-Richtlinie), Anhang I Nr. 7; Verordnung (EU) 2022/2065 (DSA) Art. 25 (gilt für Online-Plattformen); EuGH C-673/17 (Planet49).
- CMS (2025): Inside the EU's planned Digital Fairness Act. [cms.law](https://cms.law/en/aut/legal-updates/inside-the-eu-s-planned-digital-fairness-act-digital-design-subscription-traps-and-influencer-marketing)
- WCAG 2.2: Erfolgskriterien 2.5.5 (Target Size Enhanced, 44 px) und 2.5.8 (Target Size Minimum, 24 px).
- Interne Berichte: `Marktresearch/23-masterkonzept.md`, `digital/05-online-beratung.md`, `digital/11-crm-automation.md`, `digital/12-content-storytelling.md`, `digital/14-recht-compliance-digital.md`, `digital/01-luxus-design-ux.md`.

*Hinweis: Studienwerte stammen zum Teil aus Medizin (No-Shows) und US-Vertrieb (Lead-Antwortzeit). Die Richtung ist gut belegt, die genaue Höhe für Premium-Möbel am Bodensee ist es nicht. Alle Zielwerte mit [Schätzung] werden nach 3 Monaten eigener Messung neu gesetzt. Keine Rechtsberatung, die rechtlichen Punkte stimmt ihr mit der Kanzlei aus Bericht 14 ab.*
