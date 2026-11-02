# 09 – UX-Research und User-Testing: Testplan für die drei Prototypen

**Rolle:** UX-Researcher und User-Tester · **Stand:** 26.10.2026 · **Grundlage:** digital/01, 02, 12, 13, 14, Masterkonzept 23 (Abschnitt 4), Code in `src/components/Preview/galerie/*`, Live-Site `http://localhost:3000/de`

**Stand der Prototypen beim Schreiben:** `/de/preview/galerie`, `/buehne` und `/dreilaendereck` liefern noch **HTTP 404** (Route nicht angelegt). Vom Prototyp „Galerie“ gibt es nur Inhalt, Logo und Schriften (`src/components/Preview/galerie/content.js`, `Logo.js`, `fonts.js`). Die heuristische Evaluation in Abschnitt 6 betrifft deshalb (a) die **Live-Site als Ausgangswert** und (b) den **Inhalts- und Navigationsplan der „Galerie“** auf Code-Ebene. Sobald die Routen laufen, wird sie mit der Checkliste aus Abschnitt 5 für alle drei wiederholt.

---

## 1. Die wichtigsten Erkenntnisse für dieses Projekt (mit Quelle)

1. **Fünf Personen pro Runde reichen, wenn man oft testet.** Nielsen und Landauer zeigen: 5 Testpersonen finden rund 85 % der Probleme, die eine homogene Gruppe hat. Danach folgt eine neue Runde mit dem verbesserten Entwurf. Für **zwei klar verschiedene Gruppen** (Bauherren und Architekten) braucht es 3–4 Personen je Gruppe. ([NN/g: Why You Only Need to Test with 5 Users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/); Nielsen & Landauer 1993, INTERCHI)
   → Für Platzhirsch heißt das: 3 Runden zu 5–6 Personen sind besser als eine Runde mit 18.

2. **Der erste Eindruck entsteht in 50 ms und bleibt stabil.** In 50 ms bilden Menschen ein Urteil über die Ästhetik einer Website. Es stimmt stark mit dem Urteil nach längerer Betrachtung überein. ([Lindgaard et al. 2006, Behaviour & IT 25(2)](https://doi.org/10.1080/01449290500330448)) Die wahrgenommene Ästhetik färbt danach auch das Urteil über die Bedienbarkeit („aesthetic-usability effect“, [Tractinsky et al. 2000](https://doi.org/10.1016/S0953-5438(00)00031-X)).
   → Für eine Luxusmarke ist der **5-Sekunden-Test** der wichtigste Einzeltest. Er prüft, ob „italienisch, ruhig, Gastgeber am Bodensee“ ankommt oder nur „schöne Bilder“.

3. **Schöne Gestaltung kann Bedienprobleme im Test verdecken.** Wegen des Ästhetik-Effekts bewerten Testpersonen schöne Prototypen milder, und Fehler bleiben unentdeckt ([NN/g: Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/)).
   → Bei editorialen Entwürfen mit wenig Text und großen Bildern zählt deshalb das **Verhalten** (Aufgabenerfolg, Zeit, Irrwege) mehr als die Aussage „gefällt mir“.

4. **SUS ist der Standard für Bedienbarkeit, der Mittelwert liegt bei 68.** Ein SUS-Wert von 68 entspricht dem 50. Perzentil, 75 dem 73. Perzentil, 80,3 entspricht Note A– (Sauro/Lewis, curved grading scale). ([MeasuringU: 5 Ways to Interpret a SUS Score](https://measuringu.com/interpret-sus-score/)) Ab etwa 12 Personen ist der SUS stabil genug für Vergleiche (Tullis & Stetson 2004).
   → Die Zielwerte und die deutsche SUS-Fassung stehen in Abschnitt 2.5.

5. **Für Luxus misst der UEQ, was der SUS nicht misst.** Der UEQ hat 26 Items auf 6 Skalen. Attraktivität, Durchschaubarkeit, Effizienz und Verlässlichkeit erfassen die pragmatische Qualität, **Stimulation und Originalität die hedonische**. Werte reichen von −3 bis +3, ein Benchmark-Datensatz ordnet sie in Klassen von „exzellent“ bis „schlecht“ ein. Der UEQ wurde auf Deutsch entwickelt (Laugwitz, Held, Schrepp 2008). ([UEQ-Handbuch](https://www.ueq-online.org/Material/Handbook.pdf); [Benchmark UEQ-S, Hinderks/Schrepp/Thomaschewski 2018](https://www.scitepress.org/Papers/2018/71883/71883.pdf); [UEQ+-Benchmark, IJIMAI 2023](https://reunir.unir.net/handle/123456789/14811))
   → „Originalität“ ist die Skala, auf der die Website gegen Höttges, Fretz und Gamma gewinnen muss.

6. **Bei so wenig Traffic ist ein A/B-Test auf Anfragen statistisch nicht machbar.** Kohavi, Tang und Xu geben als Faustregel n ≈ 16·σ²/δ² pro Variante an (Power 80 %, α = 5 %). ([Kohavi et al., *Trustworthy Online Controlled Experiments*, Cambridge 2020](https://experimentguide.com/)) Rechnung für Platzhirsch: Bei 1,5 % Anfrage-Quote und dem Ziel, 20 % relative Steigerung zu erkennen (1,5 → 1,8 %), braucht es **rund 26.300 Sitzungen pro Variante**. Das Masterkonzept geht von 40–90 Anfragen pro Monat aus (23, 12.3).
   → A/B-Tests laufen deshalb auf **Mikro-Konversionen** (Termin-Klick, Produkt-zu-Auswahl). Für das Hauptziel gelten qualitative Tests und Vorher-nachher-Zeitreihen.

7. **Heatmaps und Session-Recordings brauchen eine Einwilligung.** Microsoft Clarity setzt Cookies und zeichnet Sitzungen auf. Seit **31.10.2025** erzwingt Clarity für Besuche aus EWR, UK und **Schweiz** ein Consent-Signal: Ohne Signal fallen Cookies und Sitzungsverknüpfung weg. Microsoft empfiehlt, die Consent-API direkt nach dem Laden aufzurufen, vor jedem Cookie. ([Microsoft Learn: Clarity Consent Management](https://learn.microsoft.com/de-de/clarity/consent-management); [Usercentrics zur Durchsetzung](https://usercentrics.com/knowledge-hub/microsoft-clarity-consent-signal-enforcement/)) Rechtlicher Rahmen: § 165 Abs 3 TKG 2021 (AT), § 25 TDDDG (DE), Art. 45c FMG (CH), siehe digital/14, F8/F13.

8. **Die wichtigste Zielgruppe ist älter und kaufkräftig. Für sie ist Bedienbarkeit Umsatz.** Digital/14 (F10) beschreibt die Zielgruppe als ältere, vermögende Bauherren. NN/g misst für Nutzer ab 65 Jahren eine um 43 % schlechtere Erfolgsquote und deutlich längere Aufgabenzeiten als bei 21- bis 55-Jährigen. ([NN/g: Usability for Seniors](https://www.nngroup.com/articles/usability-for-senior-citizens/)) Hauchdünne Bodoni-Schrift unter 32 px, graue Haarlinien und Gold auf Weiß (2,05:1, digital/13 1.3) treffen genau diese Gruppe.
   → Jede Testrunde enthält mindestens 2 Personen ab 55 Jahren und eine Person mit Gleitsicht- oder Lesebrille.

9. **Navigation scheitert an der „Informationsfährte“ (information scent).** Menschen klicken auf den Link, dessen Wortlaut ihrem Ziel am nächsten ist ([NN/g: Information Scent](https://www.nngroup.com/articles/information-scent/); Pirolli & Card 1999). Live-Befund: Die Kategorien unter `/de/produkte` tragen englische Slugs (`lounge-furniture-daybeds`, `garden-chairs`). Eine eigene Kategorie „Outdoor-Sofas“ gibt es nicht. Im „Galerie“-Plan verlinkt die Kachel „Outdoor“ auf den **gesamten Katalog** (`SITE.produkte`).
   → Die Aufgabe „Finden Sie ein Outdoor-Sofa“ ist ein guter Prüfstein dafür.

10. **Dark Patterns sind messbar und verboten.** Die EU-Kommission fand bei 148 von 399 geprüften Shops mindestens ein manipulatives Muster ([EU-Sweep 2022](https://ec.europa.eu/commission/presscorner/detail/en/ip_23_418)). DSA Art. 25 und die UGP-Richtlinie (in AT umgesetzt im UWG) verbieten sie. In Tests zeigt sich Manipulation als Vertrauensverlust: Testpersonen sagen dann „wirkt billig“ oder „wie ein Möbelhaus-Prospekt“.
   → Jede Testrunde enthält deshalb die Frage nach dem Vertrauen (Abschnitt 2.4, Frage V3).

---

## 2. Konkrete Vorgaben für den Neuauftritt (messbar, umsetzbar)

### 2.1 Forschungsfragen (was die Tests klären müssen)

| # | Frage | Methode | Entscheidet über |
|---|---|---|---|
| F1 | Erkennen Besucher in 5 s, **was** Platzhirsch ist (Einrichtungshaus mit italienischen Marken), **wo** (Bodensee/Lochau) und dass es **ein Café/Gastgeberort** ist? | 5-Sekunden-Test | Hero, Claim, Logo, Bildwahl |
| F2 | Welcher der drei Prototypen wird als **eigenständig, hochwertig, nicht austauschbar** wahrgenommen? | UEQ-S + Präferenz + Wortwahl (Microsoft Product Reaction Cards) | Auswahl des Leitentwurfs |
| F3 | Finden Menschen **Raum → Produkt → Termin** ohne Hilfe? | Aufgabenbasierter Test, moderiert | IA, Mega-Menü, CTA-Platzierung |
| F4 | Verstehen CH-, FL- und DE-Kunden, **was** über die Grenze geliefert wird und **wie** es abläuft (ohne Versprechen, die es noch nicht gibt)? | Aufgabe T5, Verständnisfragen | Dreiländer-Seite, Wortlaut |
| F5 | Finden Architekten in 60 s die Dinge, die sie brauchen (Ansprechperson, Downloads/Datenblätter, Referenzen, Musterbestellung)? | Aufgabe T6, Interviews | Architekten-Bereich |
| F6 | Behindert die Gestaltung (Kontrast, dünne Schrift, Bewegung) Ältere oder Menschen mit Einschränkungen? | Test mit 55+, Tastatur-/Screenreader-Durchlauf, axe | Typo-Skala, Motion-Tokens |

### 2.2 Phasen und Zeitplan

| Phase | Zeitraum (Vorschlag) | Was | Personen | Dauer pro Person |
|---|---|---|---|---|
| **R0 – Heuristik** | sobald die Routen laufen (1 Tag) | 2 Gutachter je Prototyp, Nielsen-Heuristiken plus Luxus-Kriterien (Abschnitt 5) | intern | – |
| **R1 – Erster Eindruck** | Woche 1 | 5-Sekunden-Test und Präferenztest **remote, unmoderiert**, alle 3 Prototypen, Reihenfolge rotiert | **3 × 20 = 60** (Bestandskunden-Newsletter, Instagram, Café-Gäste) | 6–8 min |
| **R2 – Aufgaben moderiert** | Woche 2–3 | 2 Favoriten aus R1, je Person beide Entwürfe (Reihenfolge ausbalanciert) | **10**: 5 Bauherren/Käufer, 3 Architekten/Innenarchitekten, 2 CH/FL-Kunden | 50 min |
| **R3 – Nachtest** | Woche 5 | Überarbeiteter Leitentwurf, gleiche Aufgaben | **6** (neue Personen) | 40 min |
| **R4 – Barrierefreiheit** | parallel zu R3 | Tastatur, VoiceOver iOS, NVDA, 200 % Zoom, `prefers-reduced-motion` | 1 Experte + 2 Personen 65+ | 30 min |
| **Nach Launch** | ab Monat 1 | Clarity (mit Consent), GA4-Trichter, A/B auf Mikro-Konversionen, SUS/UEQ-S-Kurzumfrage nach Termin | alle | – |

### 2.3 Rekrutierung (konkret)

| Gruppe | Woher | Filterfragen (Screener) | Dank |
|---|---|---|---|
| **Bestandskunden** (Kauf ≥ 3.000 €, letzte 36 Monate) | Backoffice-Kundenliste, persönliche Mail vom Inhaber, Ansprache im Café | „Planen Sie in den nächsten 24 Monaten ein Einrichtungsprojekt?“ (ja/vielleicht = bevorzugt) | Einladung „Platzhirsch Tafel“ für 2 Personen oder 50-€-Gutschein |
| **Interessenten ohne Kauf** | Anfragen der letzten 12 Monate ohne Auftrag, Newsletter | Haushaltsbudget fürs Projekt ≥ 20.000 € (Spannen, nicht exakt) | 50-€-Gutschein |
| **Architekten / Innenarchitekten** | Architekten-Programm, vai, Kammer Vorarlberg, eigene Kontakte | Mindestens 1 Wohn- oder Hotelprojekt pro Jahr mit losen Möbeln | 100 € Honorar oder Einladung „Lochauer Gespräche“ |
| **CH/FL/DE** | Kunden aus St. Gallen, Rheintal, Vaduz, Lindau | Wohnsitz im jeweiligen Land | wie oben |
| **Zweitwohnsitz Arlberg / Hotel** | Netzwerk, Bauträger | Verantwortlich für Einrichtung | 100 € |

Regeln für die Rekrutierung:
- **Keine Mitarbeitenden, keine Familie, keine Agentur.** Höchstens 1 Person pro Runde, die die Live-Site gut kennt.
- **Mischung pro Runde:** mindestens 40 % Frauen, mindestens 2 Personen ab 55, mindestens 1 Person aus CH oder FL, mindestens 30 % testen auf dem **Handy** (das Masterkonzept rechnet mit Instagram- und Maps-Traffic, der fast nur mobil kommt).
- **Einwilligung** (Art. 6 Abs. 1 lit. a, Art. 7 DSGVO): schriftlich, getrennt für Bildschirmaufnahme, Ton und Gesicht. Löschung der Aufnahmen nach 6 Monaten. Für Bestandskunden ist die Testeinladung eine Einzelmail mit Bezug auf das Kundenverhältnis, keine Newsletter-Werbung (TKG § 174 / UWG § 7 beachten, digital/14 F17).
- **Tools:** für moderierte Tests Microsoft Teams oder ein Termin vor Ort im Showroom; für unmoderierte Tests ein EU-gehostetes Tool (z. B. Lyssna oder Maze, vorher AVV prüfen). Gastgeber-Idee: R2 vor Ort im Café, mit Espresso. Das ist zugleich Kundenpflege.

### 2.4 Die Tests im Detail

#### A. 5-Sekunden-Test (R1)
- Startseite auf Desktop 1440 × 900 und Handy 390 × 844 zeigen, **5 s**, danach ausblenden.
- Fragen (offen, in dieser Reihenfolge):
  1. „Was bietet dieses Unternehmen an?“
  2. „Wo ist es zu Hause?“
  3. „Für wen ist es gemacht?“
  4. „Welche drei Wörter beschreiben den Eindruck?“
  5. „Was würden Sie als Nächstes tun?“
- Danach ein **Präferenztest**: alle drei Startseiten nebeneinander (Reihenfolge zufällig), „Bei welchem Haus würden Sie einen Termin vereinbaren? Warum?“
- **Kodierung:** Antwort 1 gilt als richtig, wenn sie *Möbel/Einrichtung/Interior* **und** *hochwertig/Design/italienisch* nennt. Antwort 2 gilt als richtig bei *Bodensee, Lochau, Bregenz, Vorarlberg*. Zwei Personen kodieren unabhängig, bei Uneinigkeit entscheidet eine Diskussion (Cohen's κ ≥ 0,7 anstreben).

| Kennzahl | Ziel Leitentwurf | Abbruch-Grenze |
|---|---|---|
| Angebot richtig erkannt | ≥ 80 % | < 60 % → Hero überarbeiten |
| Ort richtig erkannt | ≥ 60 % | < 40 % |
| „Café/Gastgeber“ spontan genannt | ≥ 25 % | – (Tendenz) |
| Wörter aus dem Zielfeld (ruhig, italienisch, hochwertig, einladend, Handwerk, See) unter den drei Wörtern | ≥ 50 % der Nennungen | Nennungen „kalt, leer, teuer-abweisend, Möbelhaus, Rabatt“ > 20 % |
| Präferenz | Favorit ≥ 45 % | Bei < 40 % für alle: Hybrid aus den zwei Besten |

#### B. Aufgabenbasierter Test (R2, R3), moderiert, Think-Aloud
Szenario am Anfang: „Sie haben ein Haus am See gekauft und richten Wohnzimmer und Terrasse neu ein. Ihr Budget ist großzügig, Ihre Zeit knapp.“

| # | Aufgabe (wörtlich vorlesen) | Erfolg, wenn | Zeitlimit | Ziel Erfolg / Median-Zeit |
|---|---|---|---|---|
| T1 | „Finden Sie ein Sofa für die **Terrasse**, das Ihnen gefällt, und **vereinbaren Sie einen Termin**, um es anzusehen.“ | Outdoor-Sofa-Detailseite erreicht **und** Terminformular bzw. Kalender bis zum letzten Schritt (vor dem Absenden) | 4 min | ≥ 80 % / ≤ 2:30 |
| T2 | „Sie möchten wissen, ob Sie das Sofa **in Lochau sehen** können und wann das Haus samstags offen hat.“ | Öffnungszeiten richtig genannt (live: Sa 10–14 Uhr), „im Showroom zu sehen“ gefunden oder Frage dazu gestellt | 2 min | ≥ 90 % / ≤ 1:00 |
| T3 | „Merken Sie sich **zwei Produkte von Minotti** und schicken Sie die Auswahl als Anfrage.“ | 2 Produkte in „Ihre Auswahl“, Formular erreicht | 4 min | ≥ 80 % / ≤ 3:00 |
| T4 | „Wie viel kostet so ein Sofa **ungefähr**?“ | Preisrahmen gefunden **oder** klar verstanden, wie man ihn erfährt | 2 min | ≥ 70 % (es gibt noch keine Preise, deshalb ist das ein Verständnistest) |
| T5 (CH/FL) | „Sie wohnen in **St. Gallen**. Finden Sie heraus, ob und wie Platzhirsch zu Ihnen liefert.“ | Dreiländer-Information gefunden, Ablauf mit eigenen Worten richtig erklärt, **keine** falsche Erwartung (z. B. „Festpreis in CHF inklusive Zoll“, solange das nicht angeboten wird) | 3 min | ≥ 80 % |
| T6 (Architekten) | „Sie planen eine Hotel-Lounge. Finden Sie eine **Ansprechperson für Architekten** und **Referenzprojekte**.“ | Name/Kontakt und mindestens 1 Projekt erreicht | 3 min | ≥ 80 % / ≤ 1:30 |
| T7 | „Planen Sie eine **Küche**. Was wäre der erste Schritt?“ | Küchenseite plus Planungsgespräch/Termin gefunden | 3 min | ≥ 80 % |
| T8 (Handy) | T1 auf dem Smartphone, eine Hand | wie T1, ohne Zoom-Geste | 4 min | ≥ 80 % |

**Messung pro Aufgabe:** Erfolg (1 = ohne Hilfe, 0,5 = mit einem Hinweis, 0 = abgebrochen), Zeit, Anzahl Irrwege (Klicks außerhalb des idealen Pfads), **SEQ** (Single Ease Question, 1–7, Ziel ≥ 5,5; Benchmark-Mittel ≈ 5,5 laut [MeasuringU](https://measuringu.com/seq10/)), Zitate.

**Moderation:** neutrale Sprache. Nie das Wort aus der Navigation in der Aufgabe benutzen. Darum heißt es in T1 „Sofa für die Terrasse“, nicht „Outdoor“. Nicht helfen, bevor 60 s Stillstand vorbei sind.

#### C. Fragebögen (nach den Aufgaben)
1. **SUS**, deutsche Fassung (Rummel/SAP, positiv-negativ wechselnd, 10 Items, 1–5). Auswertung: (Summe der ungeraden Items − 5) + (25 − Summe der geraden Items), mal 2,5.
2. **UEQ-S** (8 Items, −3 bis +3, pragmatische und hedonische Qualität). Bei R3 den vollen **UEQ** (26 Items) für den Leitentwurf.
3. **Vertrauen und Marke** (eigene Items, 1–7, nicht standardisiert, nur zum Vergleich der Varianten):
   - V1 „Dieses Haus versteht etwas von italienischem Design.“
   - V2 „Ich würde hier ohne Hemmung nachfragen, auch ohne festen Kaufplan.“ (Gegenmittel zur Schwellenangst vor Luxus)
   - V3 „Ich fühle mich nicht unter Druck gesetzt.“
   - V4 „Dieses Haus wirkt anders als die anderen Einrichtungshäuser, die ich kenne.“
4. **Microsoft Product Reaction Cards** (Benedek & Miner 2002): 118 Wörter, Auswahl von 5. Daraus wird eine Wortwolke pro Prototyp.

### 2.5 Erfolgsmetriken und Zielwerte

| Ebene | Kennzahl | Ziel Leitentwurf vor Launch | Ziel 6 Monate nach Launch | Heute (falls bekannt) |
|---|---|---|---|---|
| Bedienbarkeit | SUS (Mittel) | **≥ 80** (A–) | ≥ 80 (Kurzumfrage) | nicht gemessen → in R2 die Live-Site als Kontrolle mittesten |
| Erlebnis | UEQ Attraktivität / Stimulation / **Originalität** | jeweils **≥ +1,5**, Originalität ≥ +1,2 (UEQ-Benchmark „gut“ bis „exzellent“) | – | – |
| Aufgaben | Erfolgsquote über T1–T8 | **≥ 85 %**, keine Aufgabe < 70 % | – | – |
| Aufgaben | SEQ je Aufgabe | ≥ 5,5 | – | – |
| Eindruck | 5-s-Erkennung Angebot | ≥ 80 % | – | – |
| Geschäft | Termin-Anfragen online / Monat | – | **+50 %** ggü. Mittel der 3 Monate vor Launch | GA4 `generate_lead`, `form=beratung` |
| Geschäft | Qualifizierte Anfragen / Monat | – | 40 (Masterkonzept KPI M12) | Backoffice |
| Mikro | Klick „Termin“ / Sitzung | – | ≥ 4 % | GA4 |
| Mikro | Produktseite → „Ihre Auswahl“ | – | ≥ 6 % der Produktseiten-Aufrufe | GA4 |
| Mikro | Formular-Abbruch (Start → Absenden) | – | ≤ 40 % | GA4 `form_start` vs. `generate_lead` |
| Technik | LCP / INP / CLS p75 mobil | ≤ 2,0 s / ≤ 150 ms / ≤ 0,05 (digital/13 3.3) | dito | 3,4–3,8 s / – / 0 |
| Barrierefreiheit | axe serious/critical | 0 | 0 | – |

**Neue GA4-Events** (über `trackEvent` in `src/lib/analytics.js`, nur nach Consent): `form_start` (erstes Feld fokussiert, `form`), `cta_click` (`cta=termin|anrufen|whatsapp`, `position=header|hero|produkt|footer|mobilbar`), `wishlist_add`, `filter_use`, `scroll_depth` (25/50/75/90). Ohne `form_start` lässt sich der Formular-Abbruch nicht messen.

### 2.6 Heatmaps und Recordings nach Launch (datenschutzkonform)

1. **Microsoft Clarity** als Kategorie „Statistik/Analyse“ im Consent-Banner, **standardmäßig aus**. Das Skript wird **erst nach Einwilligung** per `next/script strategy="lazyOnload"` geladen. Direkt danach folgt `window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })`. Bei Widerruf: `clarity('consentv2', {analytics_Storage:'denied'})` und Clarity-Cookies (`_clck`, `_clsk`) löschen. Im Clarity-Projekt den **Consent Mode einschalten**.
2. **Maskierung „Strict“**: alle Texteingaben und Formulare maskiert, also auch Name, Telefon, E-Mail und Nachricht. Seiten `/merkliste`, `/kontakt`, `/beratung` zusätzlich per `data-clarity-mask="true"` am Formular-Container.
3. **IP-Kürzung/Region:** Clarity speichert in Azure (USA, DPF). Microsoft in der Datenschutzerklärung als Empfänger nennen, Drittland und DPF-Zertifizierung angeben, AV-Bedingungen (Microsoft DPA) dokumentieren.
4. **Aufbewahrung:** Recordings 30 Tage (Clarity-Standard), nur 2 Personen mit Zugriff. Keine Weitergabe von Aufnahmen an Dritte.
5. **Auswertung monatlich, fester Ablauf:** 20 Recordings mit Abbruch im Formular, 20 mit „Rage Clicks“ oder „Dead Clicks“, Scroll-Heatmap der Startseite und von 3 Top-Produktseiten. Zu jedem Befund ein Ticket mit Hypothese.
6. **Alternative ohne Cookies:** Vercel/Plausible/Matomo (selbst gehostet, cookielos) **nur** für Seitenaufrufe. Für Heatmaps gibt es keine cookielose Lösung, die sauber ist. Lieber weniger Daten als ein Consent-Verstoß.

### 2.7 A/B-Tests nach Launch (realistisch für diesen Traffic)

**Grundsatz:** Ein A/B-Test lohnt nur, wenn die Mindestgröße pro Variante in **≤ 6 Wochen** erreichbar ist. Rechenbeispiel (Power 80 %, α = 5 %, n ≈ 16·p(1−p)/δ²):

| Metrik | Ausgangswert (Annahme) | Gewünschte Erkennung | n pro Variante | Machbar? |
|---|---|---|---|---|
| Anfrage pro Sitzung | 1,5 % | +20 % rel. (→ 1,8 %) | ~26.300 | **nein** (Zeitreihe statt A/B) |
| Termin-Klick pro Sitzung | 4 % | +25 % rel. (→ 5 %) | ~6.100 | ja, bei ≥ 3.000 Sitzungen/Woche |
| Produkt → Auswahl | 6 % | +25 % rel. (→ 7,5 %) | ~4.000 Produktseiten-Aufrufe | ja |

**Testreihenfolge (Hypothesen aus den Nutzertests, je 1 Variable):**
1. Termin-CTA im Header: „Termin“ vs. „Besuch planen“ (Gastgeber-Sprache, digital/12).
2. Produktseite: Block „Im Showroom Lochau zu sehen“ mit Foto der Ansprechperson **über** dem Anfrageknopf vs. darunter.
3. Startseite: Hero mit Café-Szene vs. Hero mit Wohnszene (Hypothese aus dem 5-s-Test).
4. Schrift: Instrument Sans vs. Montserrat (digital/01, 3.2). Metrik: Scroll-Tiefe und Termin-Klick.

**Regeln:** Test serverseitig ausspielen (Cookie für die Zuordnung zur Variante erst nach Statistik-Consent, sonst nach Sitzung). Kein Flackern, sonst leidet der CLS. Laufzeit **mindestens 2 volle Wochen** (Wochentag-Effekt: Mo Ruhetag). Kein Abbruch, nur weil das Ergebnis zwischendurch „signifikant“ aussieht (kein Peeking). Sample-Ratio-Mismatch prüfen (χ², p < 0,001 = Test ungültig). Ergebnisse in einem Testlog festhalten.

---

## 3. Ideen, die die Konkurrenz alt aussehen lassen

1. **„Testen im Café“ als Markenritual.** Die Nutzertests finden im Showroom statt, mit Espresso und 45 Minuten. Die Teilnehmenden werden später zu „Erstbesuchern“ der neuen Website und zu Gästen beim Launch-Abend. Kein Wettbewerber in der Region bezieht Kunden so in die Gestaltung ein. Als Text auf der Website erst nach dem Launch: „Diese Website haben 30 Kundinnen, Kunden und Architekten mit uns getestet.“ Die Aussage ist wahr und belegbar.
2. **Architekten-Beirat (5 Personen, 2× pro Jahr).** Er testet den Architekten-Bereich, Downloads und das Musterbestell-Formular. Das ist UX-Research und Vertrieb zugleich (Masterkonzept 8, Architekten-Programm).
3. **Nach-Termin-Mikroumfrage (2 Fragen).** 24 h nach jedem Showroom-Termin kommt eine transaktionale Mail: „Wie leicht war es, den Termin zu vereinbaren?“ (SEQ 1–7) und „Was hätte Ihnen online gefehlt?“ (offen). Die Mail ist **Teil der Terminbestätigung**, also keine Werbung, und es gibt keine Bewertungsbitte im selben Schritt. So entsteht ein laufender UX-Messwert, den kein Wettbewerber hat.
4. **„Jobs-to-be-done“-Interviews mit 8 Bestandskunden** vor der finalen IA: „Erzählen Sie, wie Sie zu Ihrem Sofa gekommen sind, vom ersten Gedanken bis zur Lieferung.“ Die Interviews zeigen die echten Auslöser (Hauskauf, Umzug an den See, Zweitwohnsitz). Daraus entstehen Einstiege wie „Ich ziehe an den See“, „Ich richte ein Chalet ein“ statt nur Produktkategorien.
5. **Vergleichs-Benchmark gegen die Wettbewerber.** In R2 löst jede Person T1 und T2 **zusätzlich auf hoettges.at oder gamma.ch** (rotiert). So entsteht ein harter Beleg: „Termin in 1:40 statt 4:10“, zuerst nur für die Inhaberrunde, nicht als Werbeaussage (vergleichende Werbung nach § 2a UWG nur mit Anwalt).
6. **Öffentliche „Was wir geändert haben“-Notiz im Journal** nach jeder Testrunde, z. B. „Sie haben uns gesagt, die Öffnungszeiten seien schwer zu finden. Jetzt stehen sie oben.“ Das wirkt nahbar und gastgeberhaft.
7. **Barrierefreiheit als Qualitätsmerkmal testen und zeigen.** Ein Test mit Personen ab 65 und eine veröffentlichte Barrierefreiheitserklärung, die konform ist. Bei Luxus-Wettbewerbern in der Region ist das bisher nicht belegt.

---

## 4. Was man auf keinen Fall tun darf

1. **Nicht nur „Gefällt es Ihnen?“ fragen.** Wegen des Ästhetik-Effekts sagt die Antwort nichts über Bedienbarkeit. Es zählt das Verhalten (Erfolg, Zeit, Irrwege).
2. **Nicht mit Mitarbeitenden, Familie oder der Agentur testen** und deren Urteil als Nutzerurteil ausgeben.
3. **Keine Aufgaben mit Navigations-Wörtern** („Klicken Sie auf Outdoor“). Das verfälscht die Ergebnisse.
4. **Clarity, Hotjar oder andere Recorder nicht vor dem Consent laden.** Auch nicht „nur kurz für den Launch“. Kein Recording ohne Maskierung der Formulare.
5. **Kein A/B-Test auf Anfragen bei < 25.000 Sitzungen pro Variante.** Kein vorzeitiger Abbruch, kein „Gewinner“ nach 4 Tagen.
6. **Keine Dark Patterns als Testvariante**, auch nicht „zum Ausprobieren“: kein „Nur noch 1 Ausstellungsstück“ ohne echten Bestand, keine Countdown-Termine, kein vorab angehakter Newsletter im Terminformular, kein Confirmshaming („Nein, ich brauche keine Beratung“). Das verstößt gegen DSA Art. 25, UGP-RL Anh. I Nr. 7 und das UWG und beschädigt die Marke.
7. **Consent-Banner nicht per A/B-Test auf eine höhere Zustimmungsquote optimieren.** „Ablehnen“ bleibt gleich prominent (DSB AT, EDSA-Cookie-Banner-Taskforce 2023, digital/14 F13).
8. **Keine Testberichte mit erfundenen Zitaten oder Kundenstimmen** auf die Website übernehmen. Zitate nur mit schriftlicher Freigabe, wörtlich und mit Vornamen und Ort, wenn die Person zustimmt.
9. **Keine Händler-Behauptungen in Testmaterial oder Prototypen** („offizieller Minotti-Händler“). Testpersonen merken sich das, und es landet sonst in Zitaten (digital/12, 3.1).
10. **Keine Aufnahmen ohne getrennte Einwilligung** (Bildschirm, Ton, Gesicht). Keine Speicherung länger als 6 Monate.

---

## 5. Prüf-Checkliste für die drei Prototypen (Galerie, Bühne, Dreiländereck)

**Skala je Kriterium:** 0 = fehlt oder verletzt · 1 = ansatzweise · 2 = erfüllt mit Schwächen · 3 = vorbildlich. **Gewichtung** in der Spalte G. Zwei Gutachter bewerten unabhängig, danach wird der Mittelwert gebildet. Bei einer Abweichung von > 1 Punkt wird das Kriterium besprochen.

### 5.1 Nielsen-Heuristiken, auf diese Website bezogen

| # | Kriterium (prüfbar) | G |
|---|---|---|
| H1 | **Sichtbarkeit des Systemstatus:** Auswahl-Zähler aktualisiert sich sichtbar (≤ 160 ms Rückmeldung); Formular zeigt Senden/Erfolg/Fehler; aktiver Menüpunkt markiert | 1 |
| H2 | **Sprache der Nutzer:** deutsche Kategorienamen („Outdoor-Sofas“, nicht `lounge-furniture-daybeds`), Gastgeber-Ton, CH-Fassung mit „Offerte“/„MWST“ | 2 |
| H3 | **Kontrolle und Freiheit:** Zurück-Taste funktioniert (bfcache), Mega-Menü per Esc schließbar, Formular-Eingaben bleiben beim Zurückgehen erhalten | 1 |
| H4 | **Konsistenz:** ein Primärbutton-Stil (Ink, `rounded-none`), eine CTA-Bezeichnung für denselben Zweck, gleiche Bildformate (4:5 / 3:2 / 21:9) | 1 |
| H5 | **Fehler vermeiden:** Telefon-/E-Mail-Validierung inline, Pflichtfelder markiert, kein Auto-Weiterspringen (heute 500 ms im Beratungsformular, WCAG 3.2.2) | 1 |
| H6 | **Wiedererkennen statt Erinnern:** Raum-Navigation (Wohnen, Küche, Outdoor) immer sichtbar; zuletzt angesehene Produkte; Auswahl mit Bildern | 1 |
| H7 | **Flexibilität:** Suche mit Marken- und Modellnamen (z. B. „Andersen“, „Daniels“), Filter nach Indoor/Outdoor, Telefon, WhatsApp und Termin als gleichwertige Wege | 1 |
| H8 | **Ästhetik und Reduktion:** ein Gedanke pro Bildschirm; Hero mit ≤ 3 Ebenen über dem Falz (heute 6); Gold < 2 % der Fläche | 2 |
| H9 | **Fehler erkennen und beheben:** Fehlermeldung am Feld (`aria-invalid`, `aria-describedby`), verständlich, mit Lösung; eigene 404 mit Raum-Navigation und Termin | 1 |
| H10 | **Hilfe:** Öffnungszeiten, Anfahrt und Ansprechperson in ≤ 1 Klick von jeder Seite; FAQ zu Lieferung CH/FL | 1 |

### 5.2 Kriterien für Luxus, Marke und Konversion

| # | Kriterium | G |
|---|---|---|
| L1 | **5-Sekunden-Klarheit:** Was, wo und für wen ist im ersten Bildschirm erkennbar, ohne Scrollen (Desktop 1440 × 900, Handy 390 × 844) | 3 |
| L2 | **Gastgeber vor Händler:** Showroom und Café sind auf der Startseite **in den ersten 2 Bildschirmen** sichtbar (heute ganz unten) | 2 |
| L3 | **Eigenständigkeit:** Logo und Gestaltung sind nicht mit Minotti/Poliform/Höttges verwechselbar (Test: Logo und Seiten-Ausschnitt ohne Namen zeigen, „Von wem ist das?“) | 2 |
| L4 | **Pfad Raum → Produkt → Termin** in ≤ 4 Klicks, Termin-CTA auf jeder Produktseite über dem Falz | 3 |
| L5 | **Outdoor eigenständig auffindbar** (eigener Menüpunkt bzw. eigene Kategorie, nicht nur der Gesamtkatalog) | 2 |
| L6 | **Dreiländer-Information** ehrlich und vollständig: was heute geht, was „auf Anfrage“ ist; kein CHF-Festpreis-Versprechen, solange das Angebot nicht steht | 2 |
| L7 | **Architekten-Einstieg** in ≤ 2 Klicks (Ansprechperson, Datenblätter, Referenzen) | 1 |
| L8 | **Vertrauen ohne Druck:** echte Menschen (Team mit Gesicht), echte Projekte, keine Dark Patterns, keine Superlative, keine Händler-Behauptungen | 3 |
| L9 | **Mobile zuerst:** Mobilleiste „Anrufen · Termin“ überdeckt weder den Cookie-Banner noch den Fokus (WCAG 2.4.11); Ziele ≥ 44 × 44 px | 2 |

### 5.3 Technik, Bewegung, Barrierefreiheit

| # | Kriterium (Messwert) | G |
|---|---|---|
| T1 | Lighthouse mobil: LCP ≤ 2,5 s (Labor), CLS ≤ 0,1, TBT ≤ 200 ms; JS initial ≤ 170 KB gzip | 2 |
| T2 | Bewegung: Eintritt 500–800 ms, Austritt 150–200 ms, nur `transform`/`opacity`, **kein Inhalt mit `opacity:0` vor Hydration**, Lenis nicht auf dem Main-Thread-Pfad der Interaktion (INP), `prefers-reduced-motion` schaltet Bewegung ab | 2 |
| T3 | Kontrast ≥ 4,5:1 für Text (Gold-Text `#7a5f17` statt `#d1b250`), Fokus ≥ 3:1, Display-Schrift (Bodoni) nicht unter 32 px | 2 |
| T4 | Tastatur: Skip-Link, Mega-Menü, Karussell (Embla mit Pause-Knopf), Formulare vollständig bedienbar; axe ohne serious/critical | 2 |
| T5 | Formulare: sichtbare Labels, ≤ 5 Pflichtfelder für einen Termin, Einwilligung nicht vorab angehakt | 2 |

### 5.4 Wertung

- **Max. Punkte:** Summe aller Gewichte (H: 12, L: 20, T: 10 = 42) × 3 = **126**.
- **Ergebnis in %** = erreichte gewichtete Punkte / 126.
- **Schwellen:** ≥ 80 % → Leitentwurf-fähig · 65–79 % → überarbeiten, dann R2 · < 65 % → verwerfen oder nur Einzelideen übernehmen.
- **K.-o.-Kriterien** (unabhängig von der Summe): L8 = 0 (Dark Pattern oder Händler-Behauptung) · T3 = 0 · L4 = 0. Ein Prototyp mit K.-o. darf erst nach Behebung in den Nutzertest.
- **Gesamtentscheidung** nach R2: 40 % Heuristik-Wert, 30 % Aufgabenerfolg, 15 % SUS, 15 % UEQ-Originalität und Attraktivität.

---

## 6. Heuristische Evaluation (Stand heute)

### 6.1 Live-Site `/de` als Ausgangswert (Kontrolle für R2)

| Heuristik | Befund | Schwere (0–4 nach Nielsen) |
|---|---|---|
| H2 Sprache | Kategorie-URLs und vermutlich Filterbegriffe auf Englisch (`/de/produkte/lounge-furniture-daybeds`, `garden-chairs`, `sun-loungers`); kein Begriff „Outdoor-Sofa“ | **3** |
| H8 Reduktion | Hero mit 6 Ebenen über dem Falz, Häkchen-Liste, 10 gleich gewichtete Abschnitte (digital/01 1.2) | 2 |
| L2 Gastgeber | Showroom-/Café-CTA erst am Ende der Startseite | **3** |
| H10 Hilfe | Termin ist gut erreichbar (5 Links auf `/de/beratung` auf der Startseite), Mobilleiste vorhanden; Kollision mit Cookie-Banner (digital/01) | 2 |
| H5 Fehler | Beratungsformular springt nach 500 ms automatisch weiter (WCAG 3.2.2); Feldfehler werden nicht am Feld angesagt | **3** |
| T3 Kontrast | 151× Gold-Text auf Weiß = 2,05:1; Fokusring < 3:1 (digital/13 1.3) | **3** |
| H3 Kontrolle | bfcache aus, die Zurück-Taste lädt neu (digital/13 B1) | 2 |
| H4 Konsistenz | Zwei typografische Stimmen (Bodoni/Montserrat in Versalien), Rundungen und Schatten neben eckigen Buttons | 1 |

### 6.2 Prototyp „Galerie“ (Inhalt und Navigation, Code-Stand)

| Befund | Datei | Bewertung / Empfehlung |
|---|---|---|
| Hauptnavigation `Wohnen · Marken · Das Haus · Service`. **Küche und Outdoor fehlen als Menüpunkte**, und es gibt keinen „Termin“ in `NAV` | `content.js` `NAV` | Schwere 3 für T1/T7. Vorgabe aus digital/01 3.3: `Wohnen · Küche · Outdoor · Marken · Projekte · Das Haus` plus gefüllter Knopf „Termin“ |
| Raum-Kachel „Outdoor“ verlinkt auf `/de/produkte` (gesamter Katalog) | `content.js` `ROOMS` | Schwere 3 (Informationsfährte bricht ab). Ziel: Outdoor-Übersicht oder eine gefilterte Kategorie |
| Ehrliche Dreiländer-Texte ohne CHF-Festpreis-Versprechen | `content.js` `COUNTRIES` | **gut** (L6). Im Test T5 prüfen, ob „klären wir im Einzelnen“ zu vage wirkt. Gegenmittel: 3 Ablaufschritte nennen |
| Marken mit „führen wir in der Ausstellung“, keine Händler-Behauptung | `content.js` `BRANDS` | **gut** (L8) |
| Alt-Texte beschreibend und konkret | `content.js` `IMAGES` | **gut** (WCAG 1.1.1) |
| Öffnungszeiten vorhanden (Sa 10–14 Uhr), Ort und Telefon als `tel:`-Link | `content.js` `STUDIO` | gut für T2, sofern im Header oder in der ersten Sektion „Das Haus“ sichtbar |
| Ein Link `Minotti` auf eine Prototyp-Markenseite, alle anderen auf die Live-Site | `content.js` `BRANDS` | Für den Test **alle verlinkten Ziele kennzeichnen**, sonst bewerten Testpersonen den Bruch zwischen Prototyp und Live-Site |

**Folgerung für die Prototyp-Teams (vor R1):** In allen drei Prototypen müssen Küche, Outdoor und Termin direkt in der Hauptnavigation stehen, und Outdoor braucht ein eigenes Ziel. Sonst misst T1 nur einen bekannten Fehler.

---

## Quellen
- Nielsen, J. & Landauer, T. (1993); [NN/g: Why You Only Need to Test with 5 Users](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/)
- [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) · [Severity Ratings](https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/)
- Lindgaard, G. et al. (2006): Attention web designers: You have 50 milliseconds to make a good first impression! *Behaviour & Information Technology* 25(2), [doi:10.1080/01449290500330448](https://doi.org/10.1080/01449290500330448)
- Tractinsky, N., Katz, A., Ikar, D. (2000): What is beautiful is usable, *Interacting with Computers* 13(2)
- [NN/g: Aesthetic-Usability Effect](https://www.nngroup.com/articles/aesthetic-usability-effect/) · [Information Scent](https://www.nngroup.com/articles/information-scent/) · [Usability for Seniors](https://www.nngroup.com/articles/usability-for-senior-citizens/)
- [MeasuringU: 5 Ways to Interpret a SUS Score](https://measuringu.com/interpret-sus-score/) · [SEQ](https://measuringu.com/seq10/); Sauro & Lewis (2016), *Quantifying the User Experience*, 2. Aufl.
- Tullis, T. & Stetson, J. (2004): A Comparison of Questionnaires for Assessing Website Usability, UPA
- [UEQ-Handbuch (Schrepp)](https://www.ueq-online.org/Material/Handbook.pdf) · [UEQ-S-Benchmark (2018)](https://www.scitepress.org/Papers/2018/71883/71883.pdf) · [UEQ+-Benchmark (IJIMAI 2023)](https://reunir.unir.net/handle/123456789/14811); Laugwitz, Held, Schrepp (2008)
- Benedek, J. & Miner, T. (2002): Measuring Desirability (Microsoft Product Reaction Cards), UPA
- Kohavi, R., Tang, D., Xu, Y. (2020): *Trustworthy Online Controlled Experiments*, Cambridge University Press
- [Microsoft Learn: Clarity Consent Management](https://learn.microsoft.com/de-de/clarity/consent-management) · [Usercentrics: Clarity Consent Signal Enforcement](https://usercentrics.com/knowledge-hub/microsoft-clarity-consent-signal-enforcement/) · [CookieHub: Clarity Consent API v2](https://www.cookiehub.com/clarity-consent-api)
- [EU-Kommission: Sweep zu Dark Patterns (2023)](https://ec.europa.eu/commission/presscorner/detail/en/ip_23_418); DSA Art. 25; UGP-RL 2005/29/EG; EDSA Cookie Banner Taskforce Report (2023)
- Projektintern: digital/01 (1.2, 3.2, 3.3), digital/02 (3.1–3.3), digital/12 (3.1), digital/13 (1.1, 1.3, 3.3), digital/14 (F8, F10, F13, F17), 23-masterkonzept (4, 12.3)
