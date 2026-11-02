# 18 – Ideen und Kreativdirektion: Leitidee, Signature-Moment, Formate, Aktionen

**Stand:** 26.10.2026 · Rolle: Ideen-Profi und Kreativdirektor · Expertenrat Neuauftritt Platzhirsch Home Living
**Grundlagen:** `digital/01` (Designsystem 2.0, Startseiten-Dramaturgie F3), `02` (Motion „Ruhige Exklusivität“, CWV-Budget), `12` (Stimme „Der Gastgeber“, fünf Erzählsäulen, Video-Serien, „Post aus Lochau“, Fotostil „Seelicht“), `13` (Performance/A11y-Leitplanken), `14` (Claims-Register, Bewertungen, Händlerformeln), `23` Abschnitt 4 (Positionierungssatz, sechs Alleinstellungen, Wettbewerber), `23` Abschnitt 9–10 (Erlebnis, Innovation). Gesichtet: Prototypen `preview/galerie` und `preview/buehne` (Code in `src/app/[locale]/preview/*` und `src/components/Preview/*`; Logo-Konzept „Der Platz“ in `galerie`, `SmoothScroll.js` in `buehne`). `dreilaendereck` hatte beim Lesen erst einen Komponentenordner, noch keine Route.
**Kennzeichnung:** [belegt] = Quelle angegeben · [Schätzung] = eigene Einschätzung des Kreativdirektors · [prüfen] = vor Umsetzung klären.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt

**E1 – Gefühl schlägt Argument, auf lange Sicht.**
Die Meta-Analyse von Binet & Field (IPA-Datenbank, 996 Kampagnen, 700 Marken, 83 Kategorien) zeigt: Emotionale Kampagnen bringen mehr Marken- und Geschäftseffekte als rationale und erreichen langfristig fast doppelt so oft ein Spitzen-Gewinnwachstum. Rationale Botschaften wirken eher kurzfristig auf den Abverkauf. Als Ausgangswert für die Budgetaufteilung nennen sie 60 % Markenaufbau zu 40 % Aktivierung, je nach Kategorie unterschiedlich ([IPA, Präsentation](https://ipa.co.uk/media/14463/long_and_short_of_it_presentation_final_030424.pdf), [IPA-Blog](https://ipa.co.uk/knowledge/ipa-blog/the-next-chapter-for-the-long-and-the-short-of-it/), [Zusammenfassung Murrell](https://www.alexmurrell.co.uk/summaries/les-binet-and-peter-field-the-long-and-the-short-of-it)).
**Folgerung:** Die Leitidee muss ein Gefühl tragen (ankommen, Platz nehmen, Gast sein). Die Argumente (Festpreis CHF, abgesicherte Anzahlung, Samstag offen) sind die Beweise *unter* der Idee, nicht die Idee selbst. Die regionalen Wettbewerber werben fast nur mit Marken und Fläche, also rational.

**E2 – Eine Marke braucht wenige, immer gleiche Wiedererkennungszeichen.**
Romaniuk (Ehrenberg-Bass) misst den Wert eines Markenelements an *Bekanntheit* (wie viele Käufer es mit der Marke verbinden) und *Einzigartigkeit* (wie exklusiv es nur diese Marke auslöst). Sie warnt vor häufigem Wechsel: Erst Konstanz in der Form baut die Verknüpfung auf, erst danach darf man variieren. Marketer überschätzen die Bekanntheit ihrer eigenen Zeichen regelmäßig ([Marketing Week](https://www.marketingweek.com/marketers-judgement-strength-brand-assets-rarely-accurate/), [Contagious](https://contagious.com/io/article/jenni-romaniuk-on-distinctive-assets), [Empathy Lab](https://www.empathylab.com/en/news-and-insights/the-distinctive-asset-dilemma-when-brands-should-change-or-not)).
**Folgerung:** Höchstens **drei** Signaturen festlegen und drei Jahre nicht ändern: (1) die **Horizontlinie** (1 px, Ink 24 %, aus dem Logo „Der Platz“ abgeleitet), (2) das **Seelicht** (gleiche Raumvignette in vier Tageslichtern), (3) der Satz **„Nehmen Sie Platz.“** Alles andere darf wechseln.

**E3 – Menschen erinnern Spitzen und Enden, nicht die Dauer.**
Fredrickson & Kahneman (1993) zeigten „duration neglect“: Die Länge eines Erlebnisses spielt für das rückblickende Urteil kaum eine Rolle, Höhepunkt und Ende dominieren ([Originalpaper, PDF](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/fredr-kahneman-jpsp1993.pdf)). Eine Meta-Analyse von 2022 mit 174 Effektgrößen bestätigt die Peak-End-Regel stark ([IDEAS/RePEc](https://ideas.repec.org/a/eee/jobhdp/v170y2022ics0749597822000334.html)). Einschränkung: Außerhalb des Labors sind die Befunde gemischter ([SAGE 2024](https://journals.sagepub.com/doi/10.1177/08902070241235969)).
**Folgerung:** Ein Einrichtungsprojekt dauert 3–9 Monate. Wir gestalten bewusst **drei Spitzen** (Ankunft im Showroom, Moment der Materialwahl, Montage-Tag) und **ein Ende** (Übergabe mit Karte, Pflegebox, Produktpass). Auf der Website entspricht das einem Signature-Moment oben und einem echten Abschluss nach der Terminbuchung, nicht einer generischen „Danke“-Seite.

**E4 – Luxus wird nicht verkauft, er wird erzählt und gewährt.**
Kapferer & Bastien (*The Luxury Strategy*, „Anti-Laws of Marketing“, Nr. 15 „Do not sell“): Man erzählt die Geschichte und die Fakten des Produkts, drängt aber nicht zum Kauf an Ort und Stelle. Wohlhabende Kunden erreicht man am besten, indem man sie kommen lässt ([Branding Strategy Insider](https://brandingstrategyinsider.com/2009/10/the-antilaws-of-luxury-marketing-15/), [HEC](https://china.exed.hec.edu/en/node/612)).
**Folgerung:** Keine Pop-ups, keine Rabatt-Banner, kein „Jetzt zugreifen“. Die Handlung heißt „Termin“ und „Platz nehmen“, das Angebot heißt „Espresso und Stoffe liegen bereit“. Dieselbe Haltung verlangt die Stimme „Der Gastgeber“ (12, 3.1).

**E5 – Was man selbst mitgestaltet hat, schätzt man höher, wenn es gelingt.**
Norton, Mochon & Ariely (2012, *Journal of Consumer Psychology* 22(3), 453–460): Selbst zusammengebaute Produkte werden höher bewertet, aber **nur, wenn die Aufgabe erfolgreich abgeschlossen wird**. Bei Abbruch oder Misserfolg verschwindet der Effekt ([Harvard DASH, Volltext](https://dash.harvard.edu/handle/1/12136084)).
**Folgerung:** Kunden sollen kleine, sicher lösbare Teile selbst gestalten: Stoffmuster wählen, eine Steinplatte reservieren, eine „Auswahl“ zusammenstellen. Jede Aufgabe ist in unter 3 Minuten fertig und endet mit einem sichtbaren Ergebnis (Musterpost unterwegs, Platte Nr. 0412 reserviert). Lange Konfiguratoren mit offenem Ende machen das Gegenteil.

**E6 – Die Entscheidung fällt in der „unordentlichen Mitte“, nicht im Funnel.**
Googles Studie *Decoding Decisions* (2020, beobachtete Einkaufsaufgaben, Experiment mit 310.000 simulierten Kaufszenarien) beschreibt eine Schleife aus *Erkunden* (erweiternd) und *Bewerten* (eingrenzend), die Käufer beliebig oft durchlaufen ([Think with Google DE](https://thinkwithgoogle.com/intl/de-de/insights/customer-journey/kaufverhalten-verstehen), [WARC](https://www.warc.com/content/article/mrs-awards/google-decoding-decisions--making-sense-of-the-messy-middle/en-gb/134965)).
**Folgerung:** Jedes Format braucht beides: etwas zum Erkunden (Projekte, Seelicht, Tafel-Geschichten) **und** etwas zum Bewerten (Maße, Lieferzeit, Preisrahmen, CHF-Festpreis, Beraterinnensatz). Die Konkurrenz liefert meist nur das Erkunden (Höttges: schöne Projekte, keine Preise, „Termin“ öffnet nur eine Mail, 01, 2.2) oder nur das Bewerten (Connox-Optik).

**E7 – Ein Ort, der Erlebnis ist, wird zur Werbung.**
Pine & Gilmore (*Harvard Business Review*, 1998, „Welcome to the Experience Economy“) beschreiben inszenierte Erlebnisse als eigene Wertstufe über Ware und Dienstleistung. RH zeigt das mit seinen Galleries samt Restaurant, Aesop mit einer eigenen Architekturgeschichte für jeden Laden (01, 2.1).
**Folgerung:** Die stärkste Alleinstellung ist laut Masterkonzept der **Gastgeberort**: Café, Showroom und künftig eine Live-Küche, was kein Wettbewerber hat und was schwer kopierbar ist (23, 4.2 Nr. 1). Jede große Idee in diesem Papier führt deshalb physisch nach Lochau oder kommt von dort.

**E8 – Glaubwürdigkeit ist im Luxus ein Teil der Ästhetik.**
In der EU sind manipulative Oberflächen verboten (DSA Art. 25 für Plattformen, UGP-Richtlinie 2005/29/EG mit Schwarzer Liste, z. B. Nr. 7 falsche Knappheit, umgesetzt in UWG AT/DE). Das Claims-Register (14, F2) verbietet „offizieller Händler“ außer bei ClassiCon, Superlative ohne Beleg und Vergleiche mit Höttges. Bewertungen brauchen einen Hinweis zur Prüfung, Review Gating ist unzulässig (14, F11).
**Folgerung:** Unsere Überraschungen arbeiten mit **echter** Knappheit (eine Steinplatte gibt es nur einmal, an der Tafel sind 14 Plätze) und **echter** Live-Information (Café heute bis 18 Uhr geöffnet). Nichts davon wird künstlich verknappt oder getaktet.

---

## 2. Konkrete Vorgaben für den Neuauftritt

### 2.1 Leitidee: „Nehmen Sie Platz.“

**Gedanke:** Der Name sagt *Platz*. Statt „der Dominante am Ort“ (laut, siehe 06, E1) deuten wir ihn als **Gastgeber, der Ihnen einen Platz anbietet**: am Café-Tisch, auf dem Sofa zur Sitzprobe, an der Tafel, in Ihrem Haus am See. Das Logo-Konzept „Der Platz“ aus dem Prototyp `galerie` trägt das bereits.

| Ebene | Formulierung | Einsatz |
|---|---|---|
| Leitsatz (Kampagne, 3 Jahre fest) | **„Nehmen Sie Platz.“** | Hero-Overline, Einladungen, Lieferkarte, Instagram-Bio, Schaufenster |
| Positionierung (aus 23, 4.1) | „Das Haus für italienisches Wohnen am Bodensee.“ | H1 der Startseite, Meta-Title |
| Beweissatz | „Bei uns sitzen Sie im Café, nicht im Lager.“ | Haus-Intro, Google-Profil |
| Dreiländer-Satz | „Ein Ansprechpartner. Drei Länder. Ein Festpreis.“ | Schweiz-, Lindau-, FL-Seiten |
| Handlung | „Termin wählen“ / „Platz reservieren“ (Tafel) | einziger gefüllter Button im Header |

**Regeln:**
- „Nehmen Sie Platz.“ erscheint **pro Seite höchstens einmal**, immer mit Punkt, immer in Bodoni Moda 400, nie in Versalien, nie mit Ausrufezeichen.
- Die Kampagne wird in Varianten gespielt, das Verb bleibt gleich: „Nehmen Sie Platz. Am See.“ · „… An der Tafel.“ · „… In Lech.“ · „… In Lindau, fünf Minuten von hier.“ Höchstens 5 Varianten im Jahr.
- Kein Wortspiel mit „Hirsch“ (Geweih-Witze, „hirschig“). Der Hirsch lebt im Zeichen (06), nicht im Text.

### 2.2 Signature-Moment der Startseite: „Seelicht“

**Was man sieht:** Der Hero zeigt **eine feste Raumvignette im Showroom Lochau**, viermal fotografiert, vom gleichen Stativpunkt, mit gleicher Brennweite, nur das Tageslicht ändert sich. Die Website zeigt das Bild, das zur **aktuellen Uhrzeit in Lochau (Europe/Vienna)** passt. Darunter steht eine Zeile mit echter Live-Information.

| Zeitfenster (Lochau) | Bild | Live-Zeile (Beispiel) | Farbtemperatur Foto |
|---|---|---|---|
| 06:00–10:59 | Morgen, flaches Licht vom See | „Guten Morgen aus Lochau. Das Café öffnet um 9 Uhr.“ | ca. 4.500 K |
| 11:00–15:59 | Mittag, helles Streulicht | „Heute bis 18 Uhr geöffnet. Der Espresso ist fertig.“ | ca. 5.500 K |
| 16:00–19:59 | Nachmittag, warmes Seitenlicht | „Noch zwei Stunden geöffnet. Am Samstag 10–17 Uhr.“ | ca. 3.800 K |
| 20:00–05:59 | Abend, Leuchten an (Flos), Fenster blau | „Jetzt geschlossen. Termin für morgen wählen?“ | Mischlicht 2.700 K innen |

**Technische Vorgaben (mit 02 und 13 abgestimmt):**
- Das Bild ist das **LCP-Element** und wird **nicht** eingeblendet: kein Fade, kein Zoom beim Laden. Die Auswahl erfolgt serverseitig mit kurzer Revalidierung (ISR, 15 Minuten) oder als vier `<picture>`-Quellen, von denen ein winziges Inline-Skript vor dem Paint eine sichtbar schaltet. Ziel LCP ≤ 2,0 s p75 Handy (02, 3.3).
- Formate fest: 21:9 Desktop (2.560 × 1.097 px), 4:5 Handy (1.080 × 1.350 px), AVIF ≤ 180 kB Desktop / ≤ 110 kB Handy.
- Wechselt das Zeitfenster, während die Seite offen ist, gibt es einen **Crossfade von 1.200 ms** (`--ease-quiet-inout`), höchstens einmal pro Besuch. Bei `prefers-reduced-motion: reduce` wird ohne Übergang beim nächsten Laden gewechselt.
- Die Live-Zeile kommt aus **einer** Quelle für Öffnungszeiten (auch für JSON-LD `openingHoursSpecification` und Google-Profil), damit sie nie falsch ist. Feiertage AT und Betriebsurlaub als Ausnahmeliste.
- Ein kleiner Textlink unter dem Bild „Seelicht ansehen“ öffnet alle vier Lichtstimmungen nebeneinander (Erkunden, E6). Kein Slider mit Autoplay.
- **Kein** Wetter-Widget, kein Webcam-Livestream (Datenschutz, Pflege, Bildqualität).

**Warum das funktioniert:** Der Moment ist (a) nur in Lochau wahr, (b) beweist, dass es den Ort wirklich gibt (Gastgeberort, 23, 4.2 Nr. 1), (c) kostet fast kein JavaScript, (d) bringt Wiederkehrer dazu, „wie es heute aussieht“, und (e) wird zum Instagram-Format (ein Raum, vier Lichter, Reel 12 s). Die Wettbewerber zeigen statische Herstellerfotos.

**Aufwand:** 1 Shooting-Tag (4 Lichtstimmungen, 2 Formate) + 2–3 Entwicklertage. **Pflege:** neue Vignette pro Saison (4 × im Jahr), also 4 Shooting-Tage pro Jahr.

### 2.3 Zweiter Signature-Baustein: die Horizontlinie

- Eine **1-px-Linie** in Ink 24 % (`#30373e` mit Alpha 0,24), über die volle Containerbreite (max. 1.440 px), immer auf **38 % der Höhe** eines Abschnitts (Horizont im goldenen Schnitt, abgeleitet von der Seelinie der Hero-Fotos).
- Sie trennt Abschnitte statt Schatten oder Goldstriche (01, 3.1 „Material statt Dekor“).
- Einzige Animation: Beim ersten Erscheinen „zeichnet“ sie sich per `clip-path` von links nach rechts, 800 ms, `--ease-quiet`, nur `motion-safe`, nur einmal pro Seite. Per Scroll-Driven Animation (CSS `animation-timeline: view()`), 0 kB JavaScript.
- Offline: Die gleiche Linie erscheint als Messing-Prägung auf Lieferkarte, Visitenkarte, Tafel-Menükarte und als Messingleiste am Eingang des Showrooms [Schätzung: 600–1.200 € Schlosser].

### 2.4 Wiederkehrende Formate (feste Namen, fester Takt, fester Look)

| Format | Takt | Länge/Umfang | Ort online | Ort offline | Messgröße |
|---|---|---|---|---|---|
| **„Ein Raum, drei Länder“** | quartalsweise | 1 Raum, 3 Häuser, 9 Bilder, 600 Wörter, 1 Reel 45 s | Journal, Seiten Lindau/CH/FL | Vignette im Showroom | Anfragen von CH/DE/FL-Seiten |
| **„Platzhirsch Tafel“** | monatlich, ab Live-Küche | 12–16 Gäste, 1 Film 60–90 s | Tafel-Seite mit echten Plätzen | Café + Küche | Projekte je Abend (Ziel 1–2, 23, Abschn. 9) |
| **„Ein Stück, eine Minute“** | wöchentlich | 30–60 s hochkant, 1 Satz Beratung | Produktseite | Sitzprobe im Showroom | Video-Plays → Termin |
| **„Seelicht“** | saisonal | 4 Bilder, 1 Reel 12 s | Startseite | – | Wiederkehr-Rate |
| **„Der Satz der Beraterin“** | laufend | 1 Satz, Name, Foto, ≤ 140 Zeichen | jede Top-Produktseite | QR-Karte am Stück | Verweildauer, E-E-A-T |
| **„Lochauer Gespräche“** | 4 × pro Jahr | 45 min Gespräch, 20 Architektinnen | Architekten-Bereich, Journal | Showroom abends | Architekten-Leads |
| **„Post aus Lochau“** (aus 12, C7) | monatlich, 1. Donnerstag 18 Uhr | 5 Blöcke | Newsletter-Archiv | gedruckte Fassung im Café | Öffnungsrate, Terminklicks |

**Format-Regeln:**
- Jedes Format hat **denselben Vorspann**: Overline in Versalien 12 px, Sperrung 0,14 em (z. B. „EIN RAUM, DREI LÄNDER · NO. 03“), Nummerierung fortlaufend. Die Nummer schafft Sammelcharakter, ohne Druck.
- Jede Folge endet mit **genau einer Handlung** (Termin, Platz reservieren, Musterpost), nicht mit drei.
- Jede Folge braucht **eigene Fotos** und eine schriftliche Freigabe von Kunden für Hausfotos (14, F3/F11). Ohne Freigabe nur Detailbilder ohne Ortbezug.

### 2.5 Überraschungen, präzise dosiert

Regel: **höchstens 3 Überraschungen pro Seitentyp**, jede hilft bei einer Entscheidung (E6), keine ist reine Show.

1. **„Passt durch Ihre Tür?“** auf Sofa-, Tisch- und Küchenseiten: Eingabe von Türbreite und Treppenhaus-Wendung in cm, Antwort „passt“ oder „wir liefern in Modulen, das ist üblich“ aus den Maßen im Katalog (1.765 Produkte mit Maßen, 23, 10 Nr. 4). Keine Speicherung, kein Login.
2. **Streiflicht auf Material**: Auf Stoff-, Leder- und Steinmustern bewegt sich ein weiches Licht mit dem Zeiger bzw. der Neigung des Handys (Gradient per CSS-Variable, 160 ms Nachlauf, kein WebGL). Bei reduzierter Bewegung statisch.
3. **1:1-Silhouette**: Sofaumriss neben einer stilisierten 1,75-m-Person und einer Normtür (80 × 200 cm). Erklärt Proportion schneller als jede Maßtabelle.
4. **Nach der Terminbuchung**: Die Bestätigung zeigt Datum, Name der Beraterin mit Foto und die Frage „Was dürfen wir Ihnen hinstellen? Espresso, Cappuccino, Tee, Wasser“. Ein Klick, ohne Pflichtfeld. Das ist der Peak-End-Moment der Website (E3).
5. **Sprachumschalter mit Ortsbezug**: Bei de-CH steht „Offerte“, „MWST“ und die Preise in CHF neben Euro (12, 3.1 Wortliste), statt nur derselbe Text.

### 2.6 Offline-Online-Verbindung (Showroom, Café, Lieferung)

| Kontaktpunkt | Was dort ist | Wohin es führt | Vorgabe |
|---|---|---|---|
| **QR-Karte an jedem Ausstellungsstück** (Format A7, 74 × 105 mm, Papier 350 g, Messing-Horizontlinie) | Name, Marke, „Satz der Beraterin“, QR | `/de/s/<code>`: Maße, Stoffe, Lieferzeit, Preisrahmen, „In Ihre Auswahl“ | QR mindestens 20 × 20 mm, Kurz-URL zusätzlich lesbar, UTM `src=showroom` |
| **Café-Tisch** | Untersetzer mit Frage „Welcher Stuhl ist das?“ + QR | Stuhlseite (z. B. ClassiCon) | wechselt mit den Café-Möbeln, „Shop the Room“ (23, Abschn. 9) |
| **Ihre Auswahl** | Merkliste online | Beraterin sieht die Auswahl beim Termin (mit Einwilligung) | Übergabe per Code, kein Konto nötig |
| **Musterpost** | Box mit 3–5 Mustern | nach Hause, Rücksendung frankiert | online bestellbar in < 3 min |
| **Lieferkarte** | Dank, Pflegehinweis, QR | Produktpass + Bewertungsseite `/de/bewerten` | QR-Karte statt Massenmail (14, F11) |
| **Schaufenster** | ein Satz „Nehmen Sie Platz.“ + Öffnungszeiten | Termin-Seite | Text in Bodoni auf Glas, 120 mm Versalhöhe [Schätzung] |

### 2.7 Messgrößen (über `src/lib/analytics.js`, nur mit Consent)

- Termin-Klicks von der Startseite: **+30 %** gegenüber Ist (Ziel aus 01, F3).
- Anteil Termine aus DE/CH/FL: Basis messen, Ziel **≥ 35 %** nach 12 Monaten [Schätzung].
- QR-Scans je Woche im Showroom: Ziel **≥ 40** nach 3 Monaten [Schätzung].
- Musterpost-Bestellungen → Termin innerhalb 30 Tagen: Ziel **≥ 25 %** [Schätzung].
- Tafel: Ziel 1–2 Projekte je Abend (23, Abschn. 9), nach 6 Monaten prüfen.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

Aufwand: **S** = bis 3 Personentage oder < 1.000 € · **M** = 1–3 Wochen oder 1.000–8.000 € · **L** = über 3 Wochen oder > 8.000 € [alles Schätzung]. Wirkung: ★ bis ★★★★★ auf Anfragen, Bekanntheit und Abstand zur Konkurrenz [Schätzung].

| # | Idee | Was genau | Aufwand | Wirkung | Warum die Konkurrenz alt aussieht |
|---|---|---|---|---|---|
| 1 | **Kampagne „Nehmen Sie Platz.“** | Leitsatz auf Website, Schaufenster, Lieferkarte, Ads, Tafel-Einladung. 3 Jahre unverändert | S | ★★★★★ | Höttges, reiter, Gamma werben mit Marken und Fläche. Niemand hat einen Satz, der einlädt |
| 2 | **Seelicht-Hero** (2.2) | Gleiche Vignette in 4 Tageslichtern, Live-Zeile mit echten Öffnungszeiten | S–M | ★★★★★ | Statische Herstellerbilder vs. ein Ort, der lebt. Nicht kopierbar ohne eigenen Showroom am See |
| 3 | **„Ein Raum, drei Länder“** | Ein Möbelensemble (z. B. Minotti-Sofa + Rimadesio-Regal + Flos-Leuchte) in drei echten Kundenhäusern: Lindau (DE), Rheintal (CH), Lech (AT). Gleicher Kamerastandpunkt, dazu der Lieferweg: Verzollung, CHF-Festpreis inkl. 8,1 % MWST, Montage-Tag | M (pro Folge) | ★★★★★ | Zeigt Alleinstellung Nr. 5 (Dreiländer-Festpreis, 23, 4.2) als Geschichte statt Behauptung. Fretz zeigt keinen CHF-Preis, keine Verzollung |
| 4 | **Platzhirsch Tafel mit echten Plätzen** | Monatlich 14 Plätze, Menü aus der Live-Küche, ein Gastgeber-Thema (Stein, Licht, Outdoor). Online: Datum, Thema, „noch 6 von 14 Plätzen“ nur als echter Zähler aus der Anmeldung, „ausgebucht“ mit Warteliste | M | ★★★★★ | Kein Wettbewerber hat Café + Küche + Showroom (23, 4.2 Nr. 1) |
| 5 | **Die Steinbibliothek** | Jede Steinplatte der Küchenlinie (Binni, Kosovo) einzeln fotografiert (Vorder- und Rückseite, Maß, Stärke, Charge), online mit Nummer. „Platte für 14 Tage unverbindlich reservieren“. Echte Einmaligkeit, kein Knappheits-Trick | M | ★★★★☆ | Küchenstudios zeigen Musterfotos. Hier sieht man *die* Platte. Leistbare Küchenlinie bekommt ein Luxus-Ritual |
| 6 | **Musterpost** | Box mit 3–5 Stoff-, Leder- oder Steinmustern, Horizontlinie in Messing auf dem Deckel, Begleitkarte „Satz der Beraterin“. Kostenlos bis 5 Muster, frankierte Rücksendung. Ablauf < 3 min (E5) | M | ★★★★☆ | Haptik nach Hause in drei Länder. Lokale Händler haben das nicht online |
| 7 | **QR an jedem Stück + „Ihre Auswahl“** (2.6) | Showroom wird durchsuchbar, Auswahl geht mit nach Hause und zurück zum Termin | S | ★★★★☆ | Verbindet Katalogtiefe (1.765 Produkte) mit Ort. Höttges hat keine Produkte online |
| 8 | **„Der Satz der Beraterin“** | Auf den 60 Top-Produktseiten ein signierter Praxis-Satz („Lawrence gibt es auch 10 cm tiefer, für große Menschen die bessere Wahl.“) | S | ★★★★☆ | Menschliche Expertise sichtbar (E-E-A-T). Herstellertexte sind austauschbar |
| 9 | **Mit dem Schiff zum Showroom** | Im Sommer Kooperation mit der Bodensee-Schifffahrt: Gäste aus Lindau, Bregenz, Rorschach bekommen gegen Ticket einen Espresso und einen Tafel-Gutschein. Alternativ Shuttle ab Bahnhof Lindau-Reutin, 10 min [prüfen: Anlegestelle Lochau, Fahrplan, Partner] | M | ★★★★☆ | PR-tauglich („Möbel kaufen per Schiff“), macht das Dreiländereck erlebbar |
| 10 | **Der längste Tisch am See** | Einmal im Jahr (Juni) eine Tafel mit 80–120 Plätzen an der Lochauer Seepromenade, Outdoor-Möbel (Paola Lenti, Tuuci-Schirme), Gäste aus 4 Ländern, Erlös an eine regionale Initiative [prüfen: Gemeinde, Gastgewerbe, Versicherung, Leihfreigabe der Marken] | L | ★★★★★ | Medientaugliches Bild, regionales Gespräch. Stellt Outdoor als Stärke dar (23, 4.3) |
| 11 | **Föhn-Post** | An echten Föhntagen (Fernsicht über den See) ein kurzer Instagram-Post und ein Hinweis auf der Startseite: „Heute Fernsicht bis zum Säntis. Kaffee auf der Terrasse ab 9 Uhr.“ [prüfen: Sichtachse vom Showroom] | S | ★★★☆☆ | Regionales Gefühl, das keine Kette und kein Online-Händler kann |
| 12 | **Salone in Lochau** | April: „Salone-Tagebuch“ (täglich 1 Beitrag aus Mailand, eigene Fotos). Mai: Abend „Salone in Lochau“ mit 10 Neuheiten, die im Showroom zu sehen sind | M | ★★★★☆ | Säule „Herkunft“ (12, 3.2). Zeigt Nähe zu Italien ohne Händler-Behauptung |
| 13 | **Ihr Raum in 48 Stunden** (23, 10 Nr. 4) | Grundriss oder Foto hochladen, in 48 h eine von Hand erstellte Skizze mit 3 Varianten und Preisrahmen, gegen anrechenbare Pauschale (z. B. 190 € [Schätzung]) | M | ★★★★☆ | Konkreter Bewertungsschritt (E6) mit erfolgreichem Ende (E5). Reiter und Höttges bieten nur „Kontakt“ |
| 14 | **Der Montagetag** (Serie „Unterwegs“, 12, C5) | Zeitraffer + 3 O-Töne der Crew, Kran am See, Abdecken, Übergabe. Abspann: „Wir sind erst fertig, wenn Sie Platz genommen haben.“ | S pro Folge | ★★★★☆ | Zeigt das Ende des Erlebnisses (E3) und baut Vertrauen nach regionalen Insolvenzen auf (23, 10 Nr. 1) |
| 15 | **Übergabe-Ritual + Produktpass** | Lieferkarte mit Messinglinie, Pflegebox (Stoffspray, Lederpflege des Herstellers), QR zum Produktpass (Stück, Bezug, Kaufdatum, Pflege, Gewährleistung, später Circle) | M | ★★★★☆ | Echtes Ende statt Rechnung. Bereitet Platzhirsch Circle (23, 10 Nr. 3) und EU-Produktpass vor |
| 16 | **Chalet aufsperren** | Jedes Jahr im Dezember die Folge zum Second-Home-Service: ein Chalet am Arlberg wird geöffnet, aufgefrischt, Textilien getauscht (23, 10 Nr. 5) | M | ★★★☆☆ | Spricht Zweitwohnsitze direkt an. Kein Anbieter in der Region (23, 10) |
| 17 | **Künstler-Edition der Lieferkarte** | Jährlich ein:e Vorarlberger Künstler:in, die im Showroom ausstellt, gestaltet die Lieferkarte und die Tafel-Menükarte (Kunst erhöht Luxuswahrnehmung, 06, E7) | S | ★★★☆☆ | Sammelobjekt, Vernissage-Anlass, Presse in VN und Lindauer Zeitung |
| 18 | **„Lochauer Gespräche“** | 4 Abende/Jahr für Architektinnen und Innenarchitekten: ein Thema (Stein in der Küche, Licht im Altbau, Outdoor am See), 20 Gäste, Mitschnitt als Journal-Artikel | M | ★★★★☆ | Architektenkanal (23, Abschn. 8.1), Höttges ist vai-Mitglied, also muss Platzhirsch inhaltlich gegenhalten |
| 19 | **Tafel-Gutschein** | „Ein Platz an der Tafel“ als Geschenk (Firmengeschenke, Advent). Gutschein unbefristet (14, F6) | S | ★★★☆☆ | Macht den Ort verschenkbar, nicht nur Ware |
| 20 | **Die Horizontlinie im Showroom** | Messingleiste am Eingang auf 1,05 m Höhe (Fensterbrüstung), Lieferkarte, Website-Trenner. Eine Linie für online und offline | S | ★★★☆☆ | Ein Erkennungszeichen über alle Kanäle (E2) |

**Reihenfolge-Empfehlung [Schätzung]:**
- **Bis Adventsabend 26.11.2026:** 1, 2 (Shooting KW 45), 7, 8 (für 20 Stücke), 19.
- **Q1 2027:** 3 (Folge 1 Lindau), 6, 13, 14, 15, 20.
- **Ab Live-Küche:** 4, 5, 18.
- **Q2 2027:** 9, 10 (nur mit Genehmigungen), 12.
- **Winter 2027/28:** 16, 17.

---

## 4. Was man auf keinen Fall tun darf

1. **Keine falsche Knappheit und keine Countdowns.** Kein „Nur noch heute“, kein „3 andere sehen sich das an“, keine ablaufenden Rabatt-Timer. Echte Zähler (Tafel-Plätze, eine reservierte Steinplatte) nur aus echten Daten, mit Stand-Zeit. Rechtsgrundlage: UGP-Richtlinie, Anhang I Nr. 7; DSA Art. 25.
2. **Kein Confirmshaming.** Ablehnen heißt „Nein, danke“, nicht „Nein, ich mag es ungemütlich“. Newsletter-Abfrage nie als Pop-up beim Laden, höchstens am Seitenende oder nach dem Termin.
3. **Keine Händler-Behauptungen.** Nicht „Minotti-Händler“, „offizieller Partner“, „autorisiert“ (Ausnahme ClassiCon, belegt). Formeln: „Minotti in unserer Ausstellung in Lochau“, „Wir planen mit Poliform“ (14, F2). Keine Markenlogos als Siegel.
4. **Keine Superlative und keine Vergleiche.** Nicht „Platz 1“, „größte Auswahl“, „besser als …“. „Samstag 10–17 Uhr“ reicht, ohne „im Gegensatz zu Höttges“ (14, F2). Der Name Platzhirsch selbst ist genug Selbstbewusstsein.
5. **Keine KI-Räume als echte Projekte.** Jedes Bild in „Ein Raum, drei Länder“, Projekte und Montagetag ist echt und freigegeben. KI-Visualisierungen nur als solche gekennzeichnet (AI Act Art. 50, UWG).
6. **Keine Scroll-Entführung für den Signature-Moment.** Kein Pinning über mehrere Bildschirme, kein Scroll-Jacking. Wenn Lenis (`buehne/SmoothScroll.js`) bleibt, dann nur mit nativem Scroll-Gefühl, abgeschaltet bei `prefers-reduced-motion` und nur, solange INP ≤ 150 ms p75 hält (02 und 13 raten von Smooth-Scroll ab). Die Idee darf nicht davon abhängen.
7. **Kein Autoplay-Video mit Ton, kein Hero-Slider.** Höchstens ein stummes Loop-Video 8–12 s, ≤ 1,2 MB Handy, mit Pause-Knopf (WCAG 2.2.2).
8. **Kein Gamification-Spielplatz.** Keine Punkte, Abzeichen, Glücksräder oder „Gewinnspiel gegen E-Mail“. Überraschungen helfen bei einer Entscheidung oder fallen weg.
9. **Kein Review Gating, keine Bewertung gegen Belohnung ohne Offenlegung.** Alle Kunden bekommen die QR-Karte, nicht nur zufriedene (14, F11).
10. **Kein Formatwechsel nach drei Monaten.** Formate, Leitsatz und Horizontlinie bleiben mindestens 3 Jahre (E2). Neue Ideen kommen als *Folge* eines bestehenden Formats.
11. **Kein Event, das nicht stattfindet.** Tafel, Gespräche, Schiff und längster Tisch erscheinen erst online, wenn Datum, Ort und Genehmigung feststehen.
12. **Keine Herstellerbilder ohne Freigabe** in Formaten, die als eigene Projekte wirken (14, F3).

---

## 5. Prüf-Checkliste für die drei Prototypen (galerie, buehne, dreilaendereck)

**Skala je Kriterium:** 0 = fehlt / verstößt · 1 = angedeutet · 2 = vorhanden, aber austauschbar · 3 = gut, klar Platzhirsch · 4 = herausragend, so hat es kein Wettbewerber.
**Gewicht:** Punkte × Gewicht. **K.-o.:** Ein Kriterium aus Block F mit 0 Punkten = Prototyp in dieser Form nicht freigeben.
**Vorgehen:** Startseite auf Handy (390 × 844) und Desktop (1.440 × 900) ansehen, `curl http://localhost:3000/de/preview/<name>` für Text und Struktur, 5-Sekunden-Test mit 5 Personen aus der Zielgruppe („Was ist das hier? Wo ist das? Was soll ich tun?“).

### A. Leitidee (Gewicht 3)
| # | Kriterium | Prüfung |
|---|---|---|
| A1 | Es gibt **einen** tragenden Gedanken, der in einem Satz sagbar ist | Nach 5 s können 4 von 5 Testpersonen sagen „Einrichtungshaus mit Café am Bodensee“ |
| A2 | Der Gedanke ist ein Gefühl, keine Markenliste (E1) | Hero ohne Markenzeile, ohne Häkchen-Liste |
| A3 | Name und Haltung passen zusammen: selbstbewusst im Namen, gastfreundlich im Ton | Keine Superlative, Sie-Form, kein Ausrufezeichen |
| A4 | Die Idee lässt sich offline fortsetzen (Karte, Schaufenster, Tafel) | Mindestens 2 Offline-Anwendungen denkbar, ohne neu zu erfinden |

### B. Signature-Moment (Gewicht 3)
| # | Kriterium | Prüfung |
|---|---|---|
| B1 | Ein unverwechselbarer Moment auf der Startseite, der nur für Lochau wahr ist | Würde der Moment bei Höttges oder Fretz auch funktionieren? Wenn ja, max. 2 Punkte |
| B2 | Der Moment beweist den echten Ort (eigene Fotos, Café, Live-Information) | Keine Stock- oder reinen Herstellerbilder im Hero |
| B3 | Der Moment kostet keine Ladezeit | LCP-Element nicht animiert eingeblendet, LCP ≤ 2,0 s (Lighthouse mobil) |
| B4 | Der Moment funktioniert ohne Bewegung | Bei `prefers-reduced-motion` gleiche Aussage, keine Lücke |

### C. Formate und Wiedererkennung (Gewicht 2)
| # | Kriterium | Prüfung |
|---|---|---|
| C1 | Höchstens 3 feste Signaturen, konsequent eingesetzt (E2) | Linie, Licht, Satz o. ä. auf jeder Seite gleich |
| C2 | Mindestens 2 wiederkehrende Formate erkennbar angelegt (Tafel, Ein Raum drei Länder, Ein Stück eine Minute) | Eigener Vorspann, Nummer, eine Handlung |
| C3 | Dreiländereck wird als Geschichte gezeigt, nicht nur als Liste (AT/DE/CH/FL) | Konkreter Weg: Festpreis CHF, Verzollung, Montage |
| C4 | Menschen sichtbar (Beraterin, Crew, Gastgeberin) | Mindestens 1 Gesicht mit Name auf der Startseite |

### D. Erkunden und Bewerten (Gewicht 2)
| # | Kriterium | Prüfung |
|---|---|---|
| D1 | Jeder Abschnitt bietet Erkunden **und** einen Bewertungsschritt (E6) | Maße, Lieferzeit, Preisrahmen oder Öffnungszeiten in Reichweite |
| D2 | Genau eine Hauptaktion pro Abschnitt, „Termin“ als einziger gefüllter Button | Zählen der gefüllten Buttons im ersten Bildschirm: 1 |
| D3 | Es gibt einen echten Abschluss nach der Handlung (Peak-End, E3) | Bestätigungsseite/-zustand mit Name, Datum, nächstem Schritt |
| D4 | Offline-Brücke angelegt (QR, Auswahl, Musterpost) | Mindestens ein Einstiegspunkt erkennbar |

### E. Handwerk (Gewicht 2)
| # | Kriterium | Prüfung |
|---|---|---|
| E1 | Bewegung leise: Eintritt 500–800 ms, Wege 12–32 px, Scale ≤ 1,06 (02, 3.1) | DevTools-Animationspanel |
| E2 | Kein Scroll-Jacking, Smooth-Scroll höchstens optional | Mausrad/Trackpad fühlt sich nativ an, INP ≤ 150 ms |
| E3 | Typografie: Bodoni nur ab 32 px, Grotesk für Text, Versalien nur Overlines | Stichprobe 10 Textelemente |
| E4 | Farbe: max. 1 dunkle Fläche pro Seite, Gold < 2 % der Fläche (01, 3.2) | Screenshot-Sichtung |

### F. Recht und Ethik (Gewicht 3, K.-o.)
| # | Kriterium | Prüfung |
|---|---|---|
| F1 | Keine Händler-Behauptung außer ClassiCon | Volltextsuche nach „Händler“, „offiziell“, „autorisiert“, „Partner“ |
| F2 | Keine Superlative ohne Beleg, keine Vergleiche mit Wettbewerbern | Suche nach „größte“, „beste“, „Nr. 1“, „führend“, Wettbewerbernamen |
| F3 | Keine Dark Patterns (falsche Knappheit, Countdown, Confirmshaming, vorangekreuzte Felder) | Formulare und Banner durchgehen |
| F4 | Bilder echt und mit Rechten, keine KI-Räume als Projekte | Bildliste gegen Bildrechte-Register (14, F3) |

### Auswertung
- **Maximal:** A 4×4×3 = 48 · B 48 · C 32 · D 32 · E 32 · F 48 = **240 Punkte**.
- **≥ 190:** Basis für den Neuauftritt. **150–189:** gute Teile übernehmen, Leitidee schärfen. **< 150 oder ein K.-o.:** nicht weiterverfolgen.
- Erwartung nach Code-Sichtung [Schätzung]: `galerie` stark in A und E (Logo „Der Platz“, ruhige Tafel-Typografie), `buehne` stark in B (dunkle Bühne, Abendstimmung), Risiko in E2 wegen `SmoothScroll.js`. `dreilaendereck` sollte C3 auf 4 bringen. Die beste Lösung ist voraussichtlich **Galerie-Haltung + Seelicht-Moment + Dreiländer-Format**.

---

## Quellen

- Binet, L. & Field, P.: *The Long and the Short of It*, IPA. [IPA-Präsentation](https://ipa.co.uk/media/14463/long_and_short_of_it_presentation_final_030424.pdf) · [IPA-Blog](https://ipa.co.uk/knowledge/ipa-blog/the-next-chapter-for-the-long-and-the-short-of-it/) · [Zusammenfassung](https://www.alexmurrell.co.uk/summaries/les-binet-and-peter-field-the-long-and-the-short-of-it)
- Romaniuk, J. (Ehrenberg-Bass): Distinctive Brand Assets. [Marketing Week](https://www.marketingweek.com/marketers-judgement-strength-brand-assets-rarely-accurate/) · [Contagious](https://contagious.com/io/article/jenni-romaniuk-on-distinctive-assets) · [Empathy Lab](https://www.empathylab.com/en/news-and-insights/the-distinctive-asset-dilemma-when-brands-should-change-or-not)
- Fredrickson, B. & Kahneman, D. (1993): Duration Neglect in Retrospective Evaluations of Affective Episodes, *JPSP*. [PDF](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/fredr-kahneman-jpsp1993.pdf) · Meta-Analyse 2022: [IDEAS/RePEc](https://ideas.repec.org/a/eee/jobhdp/v170y2022ics0749597822000334.html) · Feldbefunde: [SAGE 2024](https://journals.sagepub.com/doi/10.1177/08902070241235969)
- Kapferer, J.-N. & Bastien, V.: *The Luxury Strategy*. [Branding Strategy Insider, Anti-Law 15](https://brandingstrategyinsider.com/2009/10/the-antilaws-of-luxury-marketing-15/) · [HEC](https://china.exed.hec.edu/en/node/612)
- Norton, M., Mochon, D. & Ariely, D. (2012): The IKEA Effect, *Journal of Consumer Psychology* 22(3). [Harvard DASH](https://dash.harvard.edu/handle/1/12136084)
- Google: *Decoding Decisions – The Messy Middle* (2020). [Think with Google DE](https://thinkwithgoogle.com/intl/de-de/insights/customer-journey/kaufverhalten-verstehen) · [WARC](https://www.warc.com/content/article/mrs-awards/google-decoding-decisions--making-sense-of-the-messy-middle/en-gb/134965)
- Pine, B. J. & Gilmore, J. H. (1998): Welcome to the Experience Economy, *Harvard Business Review* 76(4).
- Richtlinie 2005/29/EG (UGP), Anhang I · Verordnung (EU) 2022/2065 (DSA), Art. 25 · Verordnung (EU) 2024/1689 (AI Act), Art. 50.
- Interne Berichte: `Marktresearch/digital/01`, `02`, `12`, `13`, `14`, `expertenrat/06`, `Marktresearch/23-masterkonzept.md`.
