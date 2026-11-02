# Markenstimme „Der Gastgeber“

Stand: 26.10.2026 · Paket R5-content (Masterplan AP7 Nr. 1 und 4, Bericht 12 C1/C10) · Status: **Entwurf, Freigabe durch die Inhaberin offen**. FR- und IT-Fassungen sollen Muttersprachler gegenlesen.

Diese Datei fasst zusammen, was in den verbindlichen Unterlagen steht. Sie erfindet nichts dazu. Bei einem Widerspruch gilt die Design-Bibel.

Quellen:

- Design-Bibel `Marktresearch/digital/expertenrat/00-design-bibel.md`: §1 (Markenkern, Stimme), §2 (P1, P5, P8), §8.2 (Zahlen), §11 (Verbote), §14 (Recht)
- Bericht 12 `Marktresearch/digital/12-content-storytelling.md`: §1.3 (Textfehler), §3.1 (Stimme, Wortliste), C5, C8, C10
- Masterplan `Marktresearch/digital/00-digital-masterplan.md`: §4.1 Bau-Regel 7 (Claims), AP7
- Claim-Guard `src/lib/legal/claims.js`: Händlerstatus nur bei ClassiCon
- Runde-5-Plan: IT-Ton „tu“ (Entscheidung R3)

---

## 1. Kern

Platzhirsch spricht wie ein Gastgeber, der viel weiß und das nicht vorführt. Der Hintergrund: italienisches Wohnen, alemannische Bodenhaftung und der Blick über drei Grenzen (Bericht 12 §3.1).

- **Wir sind Gastgeber, nicht Händler.** Bei uns sitzen Sie im Café, nicht im Lager. Status zeigen wir über Ort, Material, Projekte und Menschen, nicht über Logos, Gold oder Superlative (Bibel §1 Nr. 2).
- **Leitsatz:** „Nehmen Sie Platz.“ (Bibel §1 Nr. 3)
- **Konkret statt Behauptung:** Maße, Preisrahmen, Lieferzeit, Ansprechperson und Öffnungszeit stehen sichtbar auf der Seite (Bibel P5).
- **Fair überzeugen:** kein Druck, keine Tricks (Bibel P8).

Drei Sätze aus Bericht 12, die noch getestet werden (keine freigegebenen Claims):

1. „Italienisch wohnen. Am Bodensee zuhause.“
2. „Bei uns sitzen Sie im Café, nicht im Lager.“
3. „Ein Ansprechpartner. Drei Länder. Ein Zuhause.“

## 2. So schreiben wir

| Wir sind | Beispiel | Wir sind nicht |
|---|---|---|
| gastfreundlich | „Kommen Sie auf einen Kaffee vorbei, wir legen die Stoffe schon bereit.“ | servil, Ausrufezeichen, „Lassen Sie sich begeistern!“ |
| kundig und konkret | Maße, Materialien, Lieferzeit, ehrliche Preisrahmen | vage („höchste Qualität“, „zeitlos elegant“, „einzigartig“) |
| regional | Pfänder, Lindau, Rheintal, Föhn, Seeluft, Bregenzerwälder Handwerk | austauschbar („in Ihrer Nähe“) |
| italienisch im Geschmack | Materialkultur, Familienunternehmen, Mailand im April | italienische Floskeln, „Dolce Vita“ (auch ein Wettbewerbername) |
| ruhig | kurze Sätze, ein Gedanke pro Absatz | Werbesprech, Superlative, „Traum…“ |
| ehrlich | „Diese Marke zeigen wir in Lochau.“ | „offizieller/autorisierter Händler“ (außer ClassiCon) |

Regeln (Bibel §1 „Stimme“, Bericht 12 §3.1):

- **Anrede:** DE „Sie“, auch auf Instagram und im Newsletter-Betreff, dort darf der Ton wärmer sein. EN „you“. FR „vous“. **IT „tu“**, verbindlich seit R3, kein „Lei“ und kein „voi“.
- **Kurze Sätze, Fakten statt Adjektive, kein Ausrufezeichen.** Bericht 12 C10 nennt als Prüfgrenze 25 Wörter pro Satz.
- **Marken** werden „gezeigt“, „geplant“ oder „beraten“, nie „offiziell vertreten“.
- **Zahlen** stehen nur mit Beleg im Text (siehe §5). Hochzählende Preise, Sterne, Lagerbestände und „x Personen sehen gerade“ sind verboten (Bibel §8.2).
- **Herkunft:** „Italienisch“ beschreibt die Haltung, nicht jedes Produkt. Das Herstellungsland steht beim Produkt. Die Binni-Küchenlinie wird nie „italienisch“ genannt (Bibel §1, §14).

Vorher und nachher (Bericht 12 §3.1, `About.ourMissionDesc`):

- *Vorher:* „…kreative und durchdachte Lösungen zu entwickeln, die Markenidentitäten stärken…“
- *Nachher:* „Wir richten Häuser und Wohnungen am Bodensee ein. Sofa, Küche, Terrasse – geplant als ein Projekt, geliefert und montiert von unserem Team. Und bevor wir über Stoffe sprechen, gibt es einen Espresso.“

## 3. Verbotsliste

Gilt für alle Texte: Website, Messages, Ratgeber, Produkttexte, Meta-Texte, `llms.txt`, Newsletter, Social Media, KI-Entwürfe. Technisch prüfen `npm run check:claims` (Claim-Guard) und `node tools/content/check-facts.mjs` (Zahlen).

### 3.1 Händler- und Statusbehauptungen (UWG, außer ClassiCon)

Verboten, wenn es um eine Marke geht (Masterplan Bau-Regel 7, `src/lib/legal/claims.js`):

| DE | EN | FR | IT |
|---|---|---|---|
| Händler, Fachhändler, Vertragshändler, „Minotti-Händler“ | dealer, retailer, stockist, reseller, distributor | revendeur, distributeur, concessionnaire | rivenditore, distributore, concessionario |
| offiziell, autorisiert | official, authorised/authorized | officiel, agréé | ufficiale, autorizzato |
| Partner, Vertragspartner, Vertriebspartner, Exklusivpartner, Premium-Partner | partner, contract partner | partenaire | partner |
| Store, Flagship, Filiale | store, flagship | boutique officielle, flagship | store, flagship |
| zertifiziert/lizenziert als Händler oder Studio | certified/licensed dealer | certifié | certificato |
| Herstellerlogo als Siegel | – | – | – |

**Ausnahme:** ClassiCon. Dort ist der Händlerstatus belegt (Händlerverzeichnis, `CLAIM_REGISTER` in `src/lib/legal/claims.js`). Neue Ausnahmen gibt es nur mit schriftlichem Beleg des Herstellers.

**Erlaubte Formel:** „Minotti in unserer Ausstellung in Lochau“, „Minotti im Showroom erleben“, „wir beraten zu Minotti“, „Minotti-Ausstellung in Lochau“ (Bericht 12 §3.1, Bibel §14). Vor der Veröffentlichung prüft das der Anwalt.

### 3.2 Superlative und leere Wörter

Verboten (Bibel §1, Bericht 12 §3.1 und C10):

- größte, beste, führend, Nr. 1, #1, einzigartig, einmalig
- Luxus, exklusiv, Traum…, Trauminterieur
- höchste Qualität, zeitlos elegant
- „in der heutigen schnelllebigen Zeit“, „eintauchen“, „Welt von …“
- Ausrufezeichen

Ein Vergleich wie „Minotti oder B&B Italia?“ ist erlaubt, wenn er sachlich bleibt und niemanden herabsetzt (Masterplan AP7, Recht).

### 3.3 Rabatt-, Preis- und Druckwerbung

- **Rabatte** nur mit dem niedrigsten Preis der letzten 30 Tage, Gesamtpreis inklusive MwSt. (PAngV, PrAG; Bibel §14). Alte Rabatt-News wie „bis zu 60 %“ bleiben ausgeblendet.
- **Kein Discount-Ton:** statt „Rabatte und Aktionen“ lieber „Einladungen zu Abenden im Showroom, neue Stücke vor allen anderen, Ausstellungsstücke zuerst“ (Bericht 12 §1.3).
- **Ausstellungsstück** statt „B-Ware“ oder „Abverkauf“.
- **„0 %“-Finanzierung** nur mit einem repräsentativen Beispiel (Bibel §14).
- **Keine „abgesicherte Anzahlung“** und kein „Festpreis“-Versprechen, solange kein Vertrag mit Bank oder Versicherer unterschrieben ist (Bibel §1 Nr. 1 GP).
- **Preise** nur als datierte Rahmen, ohne UVP-Listen (Masterplan AP7, Recht).
- **K.-o.-Verbote** (Bibel §11): Countdown, falsche Knappheit oder Nachfrage („3 sehen sich das an“), Confirmshaming, vorangekreuzte Einwilligungen, versteckte Kosten, Exit-Intent, Newsletter-Overlay.

### 3.4 Erfundenes

- Keine erfundenen Zahlen, Jahreszahlen, Preise, Referenzen, Kunden, Zitate oder Auszeichnungen.
- Projekte nur mit schriftlicher Einwilligung, ohne Adresse und mit entfernten EXIF-Daten (Masterplan AP7, Recht).
- Keine KI-Bilder als echte Räume. Generierte Räume, Menschen und Seeblicke sind verboten. Visualisierungen bekommen ein sichtbares Etikett (Bibel §7 Nr. 7, AI Act Art. 50).
- Offene Stellen in Entwürfen markieren wir als `[prüfen: …]`. Der Ratgeber-Filter blendet solche Stellen aus.

## 4. Glossar

Die DE-Begriffe kommen aus Bericht 12 §3.1. EN, FR und IT stehen so, wie sie heute in `src/messages/*.json` verwendet werden (Stand 26.10.2026). Wo es noch keine Übersetzung gibt, steht „[offen]“.

| DE (verbindlich) | EN | FR | IT | statt | Beleg in den Messages |
|---|---|---|---|---|---|
| Showroom in Lochau | showroom in Lochau | showroom de Lochau | showroom di Lochau | Store, Filiale | `HomePage.house.imageAlt` |
| Ausstellung | showroom | showroom | showroom | Lager | `HomePage.cta.text` |
| Showroom & Café | Showroom & café | Showroom & café | Showroom & caffè | – | `HomePage.house.eyebrow` |
| Ausstellungsstück | [offen] | [offen] | [offen] | B-Ware, Abverkauf | – |
| Ihre Auswahl | Your selection | Votre sélection | La tua selezione | Warenkorb, Merkliste (im Text) | `Shell.header.selectionCount` |
| Stück, Stücke | piece, pieces | meuble, meubles | pezzo, pezzi | Artikel, Produkt (im Fließtext) | `Shell.header.selectionCount` |
| Termin | appointment | rendez-vous | appuntamento | Meeting | `HomePage.cta.eyebrow` |
| Termin wählen | Choose an appointment | Choisir un rendez-vous | Scegli un appuntamento | Jetzt buchen! | `HomePage.hero.cta` |
| Gastgeber | host | hôte | padrone di casa | – | `HomePage.host.title` |
| Probesitzen | Sit, touch, compare | S’asseoir et comparer | Sedersi e confrontare | – | `HomePage.host.items.touch.title` |
| Lieferung und Montage (auf Wunsch) | delivery and assembly (on request) | livraison et montage (sur demande) | consegna e montaggio (su richiesta) | Rundum-sorglos | `HomePage.host.items.finish.text` |
| bezugsfertig | [offen] | [offen] | [offen] | schlüsselfertig (bei Möbeln) | – |
| Italienisches Wohnen am Bodensee | Italian living on Lake Constance | Vivre à l’italienne au bord du lac de Constance | Abitare italiano sul Lago di Costanza | Dolce Vita | `HomePage.hero.title` |

**Schweiz-Texte (de-CH):** *Offerte*, *Stockwerkeigentum*, *Schreiner*, *MWST*, kein „ß“ (Bericht 12 §3.1). Das gilt nur für die Schweiz-Inhaltsvariante innerhalb von `de` (Bericht 12 C8).

**Marken** schreiben wir so wie der Hersteller: `next125` klein, `Tréca` mit Akzent, `B&B Italia`, `Molteni&C`.

## 5. Zahlen und Fakten (Qualitätskette)

Bericht 12 C10 Schritt 3/4, Masterplan AP7 Nr. 4:

1. Entwürfe (auch KI-Entwürfe) verwenden nur Fakten aus der Quellenliste `tools/content/facts.json`. Lücken werden als `[prüfen: …]` markiert.
2. `node tools/content/check-facts.mjs` meldet jede Zahl, Jahreszahl, Prozent- und Mengenangabe in `src/messages/*.json`, im Ratgeber und in den Produkttexten, die keine Zeile in `facts.json` belegt, mit Datei und Zeile. Das Skript ändert keine Datei.
3. Eine neue Zeile kommt nur mit Quelle in die Liste: Grundfakten in `tools/content/facts.core.json`, Produktfakten über `Marktresearch/content/produkte/*.json`. Danach `node tools/content/build-facts.mjs` ausführen.
4. Fachliche Freigabe durch einen Menschen. Bei Schweiz, Zoll und Recht prüfen Steuerberater bzw. Anwalt.

## 6. Kurz-Prüfliste vor jeder Veröffentlichung

- [ ] Sie-Form (IT „tu“), kurze Sätze, kein Ausrufezeichen
- [ ] keine Wörter aus §3.1 und §3.2 (außer ClassiCon-Status)
- [ ] keine Rabatt- oder Druckwerbung nach §3.3
- [ ] jede Zahl belegt (`check-facts.mjs` ohne neue Funde)
- [ ] `npm run check:claims` ohne neue Funde
- [ ] Bilder mit Eintrag im Bildregister, keine KI-Räume, keine Stockfotos
- [ ] ein eigener Gedanke, ein eigenes Foto, ein konkretes Beispiel aus Lochau („3-E-Regel“, Bericht 12 C10 Schritt 6)
