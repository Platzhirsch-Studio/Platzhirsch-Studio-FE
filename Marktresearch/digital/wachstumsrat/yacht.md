# Wachstumsrat – Gremium Yacht-Interior (Kürzel: yacht)

**Stand:** 28.10.2026 · Gremium: Refit-Manager, Yachtdesigner, Bootssattler (gespielt)
**Geprüft:** `/de/yacht-interior` (Code: `src/app/[locale]/yacht-interior/page.js`, `src/components/Landing/Yacht/YachtLanding.js`, `src/lib/yacht/concepts.json`, `src/components/Yacht/NavettaReference.js`), Bericht [29](../../29-geschaeftsfeld-yacht-interior.md), Feature-Dokus `digital/features/yacht*.md`.
**Hinweis zur Prüfung:** Der Dev-Server lieferte während der Prüfung auf `localhost:3000/de/yacht-interior` HTTP 500, `localhost:4545` HTTP 404 (andere Teams bauen gerade). Wir haben deshalb keine Screenshots gemacht und den Inhalt aus dem Quellcode und den Konzeptdaten geprüft. Layout und 3D-Werfthalle hat das Gremium nicht visuell abgenommen.
**Regeln:** Schätzungen sind mit [Schätzung] markiert. Händler-Aussagen nur für ClassiCon und Ezarri; alle anderen Marken heißen „aus unserem Sortiment“.

---

## 1. Urteil zum Ist-Stand

**Note: 7/10. Fachlich sauber gedacht, rechtlich vorsichtig, an einigen Stellen bootsfachlich ungenau. Verkäuferisch steht sie noch still: Die Seite ist `noindex`, es gibt kein Anfrageformular, und die Leistung ist nicht als Paket greifbar.**

| Kriterium | Note | Kurz |
|---|---|---|
| Aufgabenteilung Platzhirsch / Sattler / Werft | 9 | sehr gut, so arbeiten Refit-Projekte wirklich; schützt vor GewO- und RCD-Risiken |
| Ehrlichkeit (KI-Kennzeichnung, keine Referenzen, keine Händlerbehauptung) | 9 | vorbildlich |
| Bootsfachliche Richtigkeit (Material, Feuchte, Gewicht, Brandschutz) | 6 | Fehler beim Schaum, Lücken bei Kondenswasser, Kompass, gewerblicher Nutzung und Brandschutz ab 24 m |
| Zielgruppen-Fit | 6 | „Motoryacht 20–30 m“ und „Superyacht ab 40 m“ liegen außerhalb des erreichbaren Marktes (8–20 m, Bericht 29) |
| Refit-Zeitfenster | 7 | richtig, aber Bestellschluss für italienische Designmöbel und Sattlerkapazität fehlen |
| Verkauf / Lead | 4 | nur `mailto` und Telefon, keine Bootsdaten-Abfrage, kein Einstiegsangebot; noindex |

---

## 2. Befunde und Chancen

### 2.1 Fachliche Befunde (Fehler oder Lücken)

| # | Stelle | Befund | Warum es zählt |
|---|---|---|---|
| F1 | `concepts.json` › segelyacht-nordwind › materialien: „Kaltschaum mit Drainage (Cockpitpolster)“ | **Fachlich falsch.** Kaltschaum (HR-PU) saugt Wasser auf und trocknet tagelang nicht. Ins Cockpit gehört **offenzelliger, retikulierter Schnelltrocknungsschaum**, in Verbindung mit einem Bezug, der Wasser durchlässt, oder mit Drainage-Netz unten. Kaltschaum nur unter Deck. | Ein Sattler, der das liest, nimmt die Seite nicht ernst. Im Cockpit kommt es sonst zu Schimmel und Reklamationen. |
| F2 | Kabine (alle Konzepte): „Kojenauflage nach Maß“ | Es fehlt die **Unterlüftung**. Unter der Koje liegt GFK oder Sperrholz, darauf bildet sich Kondenswasser, und die Matratze schimmelt. Branchenstandard ist eine Abstandsgewebe-Unterlage (z. B. HyperVent, DRYWEAVE, AIR Lift, siehe [Fisheries Supply](https://www.fisheriessupply.com/hypervent), [nauticexpo GisaTex](https://nauticexpo.com/prod/gisatex-gmbh-co-kg/product-29549-451281.html)). | Das ist die häufigste Reklamation bei Kojen. Die Unterlage ist zugleich ein günstiges Zusatzprodukt. |
| F3 | Materialien › Teak: „Ohne Öl wird er silbergrau.“ | Für **Teakdecks** gilt: nicht ölen. Die Lösungsmittel greifen die Fugenmasse an, und geölte Decks werden rutschig. Gereinigt wird mild, mit Seewasser oder milder Seife und weicher Bürste, ohne scharfe Reiniger ([CT DEEP Clean Marina](https://portal.ct.gov/deep/boating/clean-marina/teak-maintenance)). Für Teak-*Möbel* ist Öl optional. | Der Satz klingt, als solle man das Deck ölen. Ein Eigner, der Teak pflegt, merkt den Unterschied sofort. |
| F4 | Materialien › Edelstahl: „Legierung … klären wir“ | Das ist zu vage. Am Salzwasser gilt **A4 / 1.4401 / AISI 316**, A2 (304) läuft dort an. Am Bodensee (Süßwasser) genügt A2 meist. Aluminium mit seewasserbeständiger Legierung, eloxiert oder pulverbeschichtet. | Das Revier ist ein echter Unterschied zwischen Bodensee und Adria. Wer ihn nennt, zeigt Fachwissen. |
| F5 | Motoryacht-Konzept „20–30 m, Adria/Mittelmeer“ mit Minotti Lido im Salon | **Ab 24 m Rumpflänge gilt die Sportbootrichtlinie nicht mehr** (Geltungsbereich 2,5–24 m). Solche Yachten fahren oft gewerblich in Charter, unter REG Yacht Code bzw. Flaggenrecht. Gepolsterte Möbel brauchen dort **IMO FTP Code Teil 8** (Polstermöbel), Vorhänge Teil 7, Bettzeug Teil 9 ([Kothea](https://www.kothea.com/tag/imo-ftp-code/), [Yachting Pages](https://www.yachting-pages.com/articles/fire-safety-legislation-on-board-superyachts.html), [RISE](https://www.ri.se/en/what-we-do/services/fire-testing-according-to-imo-2010-ftp-code-part-8)). Ein Crib-5-Zertifikat (BS 5852) ersetzt den FTP-Nachweis nicht. Wohnmöbel aus dem Sortiment haben diesen Nachweis in der Regel nicht [zu prüfen je Modell]. | Wird ein Wohnsofa auf eine gewerbliche 28-m-Yacht geliefert, kann es bei der Besichtigung durch die Flagge durchfallen. Haftungsrisiko für Platzhirsch. |
| F6 | Superyacht-Konzept: Sifas „Kalife Daybed“ in Zone **flybridge**, Hinweis „an Bord nicht belegt“; Flos „Captain Flint Outdoor“ an **deck**, „Bordeinsatz nicht belegt“ | **Widerspruch:** Die Seite zeigt Produkte an Bord, die laut eigener Regel nicht an Bord gehören. | Dieselbe Seite verstößt gegen ihre eigene Eignungsregel. Das untergräbt die Glaubwürdigkeit. |
| F7 | Runabout › badeplattform: „Liegepolster auf dem Motordeckel“ | Der Motorraum hat Lüftungsöffnungen und muss im Notfall schnell zu öffnen sein (Feuerlöschöffnung, ISO 9094). Das Polster darf beides nicht verdecken und muss rutschfest sitzen. Nur mit Freigabe der Werft. | Brandschutz und Benzindämpfe. |
| F8 | Regeln an Bord (3 Regeln) | Der **Kompass** fehlt. Lautsprecher, Magnetverschlüsse, Stahlgestelle und Akkuleuchten mit Magnetfuß in der Nähe des Steuerkompasses verursachen Deviation. Hersteller nennen Schutzabstände, die Ausrüstung muss sie einhalten ([yacht.de](https://www.yacht.de/segelwissen/navigation/kalibrieren-magnetkompass-und-elektronischen-kompass-justieren/), [BinSchUO Anh. III](https://www.gesetze-im-internet.de/binschuo2018anh_iii/anlage.html)). | Dieser Punkt fällt jedem Skipper zuerst ein. Ein Designer-Gestell aus Stahl neben dem Steuerstand ist ein reales Problem. |
| F9 | Regel „Gewicht“ | Die **maximale Zuladung** auf der Herstellerplakette fehlt (CE-Plakette nach RCD). Jedes Kilo Ausstattung geht von der Zuladung für Personen, Wasser und Treibstoff ab. Bei Segelyachten wirkt Gewicht in Bug und Heck zusätzlich auf das Stampfen. | Mit der Plakette wird „jedes Kilo zählt“ konkret und prüfbar. |
| F10 | Akkuleuchten (Flos Unplugged etc.) | Es fehlt ein Hinweis zum **Laden**. Lithium-Akkus nur unter Aufsicht laden, nicht unbeaufsichtigt über Nacht am Landstrom, nicht in der Koje, und Schutzart beachten (IP laut Datenblatt). | Lithium-Brände an Bord sind ein bekanntes Versicherungsthema. |
| F11 | Kurs durchs Winterlager | Es fehlt der **Bestellschluss**. Italienische Designmöbel haben oft 8–14 Wochen Lieferzeit [Schätzung, je Hersteller bestätigen], Sattler sind ab Januar ausgebucht [Erfahrungswert Gremium]. Für die Übergabe im April heißt das: Aufmaß bis Ende November, Möbelbestellung bis Mitte Dezember, Stofffreigabe bis Mitte Januar. | Das erzeugt Dringlichkeit im Oktober und November, also jetzt. |
| F12 | Mittelmeer-Text | Es fehlen Zoll und Steuer bei Schweizer Booten bzw. Liegeplätzen. Lieferungen in die Schweiz sind Ausfuhren, dort fällt Einfuhr-MWST an (siehe [18](../../18-schweiz-recht-steuer-logistik.md)). Kroatien und Italien sind EU-Binnenmarkt und zollfrei. | Ein Drittel der Bodensee-Boote liegt in Schweizer Gewässern oder gehört Schweizer Eignern (11.323 CH-Boote, Bericht 29). |
| F13 | Gewerbliche Charter am Bodensee | Die Seite sagt nichts dazu. Bei Charter- und Fahrgastbetrieb gelten eigene Vorschriften (BSO, Schiffsuntersuchung). Charterkunden brauchen Nachweise zum Brandverhalten. | Eine Charterflotte ist ein B2B-Einstieg (Abschnitt 2.3). Dafür muss die Seite das Thema kennen. |
| F14 | Holz / Teak-Herkunft | Die EU-Entwaldungsverordnung (EUDR, VO 2023/1115) gilt ab **30.12.2026** für mittlere und große Unternehmen, ab 30.06.2027 für Klein- und Kleinstunternehmen. Die Sorgfaltserklärung gibt grundsätzlich der Erstinverkehrbringer ab ([CMS](https://cms.law/de/deu/legal-updates/eu-stoppt-den-countdown-und-verschiebt-eudr-erneut), [IHK Hannover](https://www.ihk.de/hannover/hauptnavigation/innovation/umwelt/nachhaltigkeit/eudr-entwaldungsverordnung-verschoben-und-verschlankt-6927688)). Wer Teak selbst importiert, ist betroffen. Bezug über EU-Hersteller entlastet. | Ein internes Risiko, kein Text für die Seite. Einkauf: Teak-Möbel nur über EU-Lieferanten mit Referenznummer. |

### 2.2 Was gut ist und bleiben soll

- Die Aufgabenteilung in drei Spalten (Platzhirsch / Bootssattler / Werft) und der Satz „Das halten wir in jedem Angebot schriftlich fest“ treffen genau das, was ein Refit-Manager sehen will.
- Das Eignungssystem in `concepts.json` (`aussen-marine-hersteller`, `aussen-katalog`, `innen-lose`) ist fachlich klug. Es braucht nur ein viertes Feld für Brandschutznachweise (Baustein B5).
- Die Saisonlogik September bis April stimmt für den Bodensee: Auswassern Oktober/November, Einwassern März bis Mai.
- KI-Kennzeichnung und Navetta-Disclaimer sind sauber.

### 2.3 Chancen

1. **Jetzt ist Winterlager.** Am 28.10.2026 kommen die Boote gerade an Land. Wer bis Mitte Dezember 3 Werften und 1 Sattler gewinnt, hat zur Saison 2027 echte Referenzen. Wer bis Januar wartet, verliert ein ganzes Jahr.
2. **Die Seite ist `noindex`, weil Freigaben für die Navetta-Fotos fehlen.** Ein einzelner Bildblock blockiert damit das ganze Geschäftsfeld bei Google. Lösung: Navetta-Block per Schalter ausblenden und die Seite ohne ihn indexieren (Entscheidung Inhaber, Baustein A0).
3. **„Bordtauglichkeits-Check“ als Einstiegsprodukt:** Platzhirsch prüft mit Sattler und Werft, was an Bord darf. Das schafft Vertrauen und ein bezahltes Erstgespräch (Baustein C3).
4. **Kojen-Paket mit Unterlüftung + Bettwäsche + Matratzenauflage** als wiederkehrendes Produkt mit kleinem Ticket. Alle 3–5 Jahre fällig [Schätzung], online verkaufbar.
5. **Saisonservice (Einlagern der Polster)** knüpft an die Outdoor-Einlagerung an und bringt jedes Jahr wiederkehrenden Kontakt.
6. **Charterflotten:** Schattmaier in Kressbronn betreibt rund 40 Yachten ([Schwäbische](https://www.schwaebische.de/regionale-unternehmen/schattmaier-segelschule-hotel-bootscharter-kressbronn-gohren-bodensee-142964)), Sporer Yachting in Lochau eine eigene Flotte ([Herold](https://www.herold.at/gelbe-seiten/lochau/hxm6h/sporer-yachting-segelschule-yachtcharter-yachthandel/)). Serienpakete mit Kissen, Handtüchern und Kojenunterlagen sind robust, B2B und planbar.
7. **Eigner mit Booten an der Adria:** Istrien und der Kvarner liegen 5–7 Autostunden von Lochau [Schätzung]. Marinas mit Winterlager sind z. B. Umag (475 Wasserplätze, 100-t-Travellift), Admiral Opatija und Mitan (neue Winterhalle, 3.350 m²) ([kroati.de Umag](https://www.kroati.de/kroatien-infos/marina-umag.html), [kroati.de Admiral](https://www.kroati.de/kroatien-infos/marina-admiral-opatija.html), [SeaHelp Mitan](https://www.sea-help.eu/advertorial/marina-mitan-novi-vinodolski-halle/)). Hier liegen die höheren Tickets.

---

## 3. Fertige Bausteine

### A. Fachliche Korrekturen für die Seite (direkt umsetzbar, Code-Team)

**A0 – Indexierung (Entscheidung Inhaber zuerst):** In `YachtLanding.js` wird `<NavettaReference />` hinter eine Konstante `SHOW_NAVETTA` gesetzt. Steht sie auf `false`, kann `index: true` gesetzt und der Eintrag in `extraPages.js` wieder ergänzt werden. Die Navetta kommt zurück, sobald Minotti und Custom Line freigegeben haben. *Nur umsetzen, wenn der Inhaber die Entscheidung vom 27.10. so anpasst.*

**A1 – `intro.rules`: von drei auf vier Regeln** (der Text ersetzt die bestehenden Regeln):

```js
rules: [
  { name: "Gewicht", text: "Jedes Kilo geht von der Zuladung ab, die auf der Herstellerplakette Ihres Bootes steht. Wir nennen die Gewichte mit dem Angebot, die Werft gibt sie frei." },
  { name: "Feuchte und Sonne", text: "Draußen nur, was der Hersteller für draußen vorsieht. Unter Deck braucht jede Koje eine belüftete Unterlage gegen Kondenswasser. Wohntextilien bleiben trocken." },
  { name: "Bewegung", text: "Was lose ist, muss sicher stehen: vor der Fahrt verstauen oder von der Werft sichern lassen. Lüftungen, Notausstiege und Motorraum bleiben frei." },
  { name: "Kompass", text: "Stahl, Magnete und Lautsprecher halten Abstand zum Steuerkompass. Wo etwas nahe am Steuerstand stehen soll, prüft die Werft die Ablenkung." },
],
```
Hinweis Code-Team: Das Raster ist derzeit `sm:grid-cols-3`. Bei vier Regeln `sm:grid-cols-2` verwenden.

**A2 – `materials.items` (ersetzen):**

```js
{ swatch: "teak", name: "Teak", text: "Robust und angenehm unter den Füßen. Teakdecks werden nicht geölt, sondern mild gereinigt. Teakmöbel werden ohne Öl mit der Zeit silbergrau." },
{ swatch: "weave", name: "Lösungsgefärbtes Acrylgewebe", text: "Sehr farbbeständig, trocknet schnell. Die Werte zu UV, Wasser und Brandverhalten nennt das Datenblatt des Herstellers." },
{ swatch: "foam", name: "Schnelltrocknender Schaum", text: "Offenzellig, lässt Wasser durchlaufen – für Cockpit- und Sonnenpolster. Unter Deck verwenden wir Komfortschaum." },
{ swatch: "leather", name: "Kunstleder für Bootspolster", text: "Pflegeleicht für Sitzbänke. Angaben zu UV, Kälte und Brandverhalten holen wir als Datenblatt ein." },
{ swatch: "steel", name: "Edelstahl und Aluminium", text: "Für Gestelle und Beschläge. Am Meer gehört Edelstahl A4 an Bord, am Bodensee reicht oft A2. Die Werft prüft Legierung und Befestigung." },
{ swatch: "linen", name: "Leinen und Baumwollsatin", text: "Für Salon und Kabine. Wohntextilien – unter Deck und trocken." },
```

**A3 – `course.items`, Schritte 2–4 (Text „us“ ergänzen) und Satz unter `course.text`:**

- `course.text` ergänzen: „**Für eine Übergabe im April: Aufmaß bis Ende November, Bestellung der Möbel bis Mitte Dezember, Stoffe bis Mitte Januar.** Italienische Möbel haben oft mehrere Monate Lieferzeit, und Bootssattler sind im Winter früh ausgebucht.“
- Schritt „Muster“: `us: "Muster im Showroom in Lochau oder an Bord; Bestellung der losen Ausstattung bis Mitte Dezember"`.

**A4 – `concepts.json` korrigieren:**

| Konzept | Feld | alt | neu |
|---|---|---|---|
| segelyacht-nordwind | materialien[1] | `Kaltschaum mit Drainage` / `Cockpitpolster` | `Schnelltrocknender, offenzelliger Schaum` / `Cockpitpolster` · hinweis: `Fertigung durch Bootssattler; Kaltschaum nur unter Deck` |
| alle mit Zone kabine | zonen.kabine | „Kojenauflage …“ | Satz anhängen: „ … auf einer belüfteten Unterlage gegen Kondenswasser.“ |
| runabout-mahagoni | zonen.badeplattform | „Liegepolster auf dem Motordeckel (falls vom Boot vorgesehen) …“ | „Liegepolster am Heck, wo das Boot es vorsieht – Lüftung und Zugang zum Motorraum bleiben frei; Freigabe durch die Werft. Handtuch-Set im Bootstaufach.“ |
| motoryacht-riviera | laenge | `20–30 m` | `15–24 m` |
| motoryacht-riviera | bootstyp | `Mittelmeer-Motoryacht` | `Motoryacht mit Flybridge` (Revier bleibt Adria/Mittelmeer) |
| motoryacht-riviera | werft | – | ergänzen: `Brandschutznachweise prüfen, falls die Yacht gewerblich verchartert wird` |
| superyacht-lounge | produkte Sifas Kalife | zone `flybridge` | **entfernen** oder in `bootshaus-ufer` verschieben (dort passt es, eignung `aussen-katalog`) |
| superyacht-lounge | produkte Flos Captain Flint Outdoor | zone `deck` | **entfernen** (Netzanschluss, Bordeinsatz nicht belegt) |
| superyacht-lounge | zonen.salon | „Hinweis: …“ | „Interior großer Yachten verantwortet das Designbüro der Werft. Wir liefern Deck-Möbel und Textilien in Abstimmung – mit den Brandschutznachweisen, die die Flagge verlangt.“ |
| alle Flos Unplugged | hinweis | – | `Akku nur unter Aufsicht laden; nicht in der Koje` |

Hinweis: `tests/unit/yacht-concepts.test.mjs` prüft öffentliche Felder. Die neuen Texte enthalten keine verbotenen Wörter. „Brandschutznachweise“ ist zulässig, weil es eine Prüfpflicht beschreibt und kein Versprechen.

**A5 – Neue FAQ-Einträge (an `faq.items` anhängen):**

```js
{
  q: "Welche Brandschutzregeln gelten an Bord?",
  a: "Für private Sportboote bis 24 m gilt die Sportbootrichtlinie mit der Brandschutznorm EN ISO 9094. Wird ein Boot gewerblich genutzt, etwa in der Charter, oder ist eine Yacht länger als 24 m, gelten zusätzliche Vorschriften – bei großen Yachten häufig die Prüfungen des IMO FTP Code für Polstermöbel, Vorhänge und Bettzeug. Wohnmöbel haben diese Nachweise meist nicht. Wir klären vor dem Angebot, welche Regeln für Ihr Boot gelten, und holen die Datenblätter der Hersteller ein.",
},
{
  q: "Wie verhindern Sie Schimmel in der Koje?",
  a: "Unter der Matratze liegt an Bord fast immer eine kalte Fläche aus GFK oder Holz, an der sich Kondenswasser bildet. Wir legen deshalb unter jede Kojenauflage eine belüftete Abstandsunterlage und empfehlen Bezüge mit Reißverschluss, die sich waschen lassen.",
},
{
  q: "Bis wann muss ich mich für die nächste Saison melden?",
  a: "Für eine Übergabe im April am besten bis Ende November: Dann bleibt Zeit für Aufmaß, Konzept und Bestellung. Möbel aus Italien bestellen wir bis Mitte Dezember, Stoffe für den Bootssattler bis Mitte Januar. Deck-Möbel, Textilien und Bootshäuser gehen auch während der Saison.",
},
{
  q: "Mein Boot liegt in der Schweiz – geht das auch?",
  a: "Ja. Bei Lieferungen in die Schweiz kümmern wir uns um die Ausfuhrpapiere. Die Schweizer Einfuhrsteuer wird bei der Einfuhr fällig; wie sie abgewickelt wird, steht im Angebot.",
},
```
(Der Schweiz-Eintrag erst nach Prüfung des Zollablaufs gemäß Bericht 18.)

**A6 – Anfrage strukturieren (statt nur `mailto`):** Das bestehende Beratungsformular bekommt die Variante „Boot“ mit diesen Feldern (alle optional außer Kontakt):
`Bootstyp (Runabout / Daycruiser / Segelyacht / Motoryacht / Hausboot / Bootshaus)` · `Länge (m)` · `Werft/Modell, Baujahr` · `Liegeplatz (Hafen)` · `Winterlager (Ort/Werft)` · `Zonen (Mehrfachauswahl: Cockpit, Flybridge, Salon, Kabine, Bad, Badeplattform, Steg)` · `Gewünschte Übergabe (Monat)` · `Gewerbliche Nutzung? ja/nein` · `Fotos (bis 5)` · `Freitext`.
Wenn ein Bootsdatenfeld befüllt ist, steht im Betreff „Anfrage Yacht Interior – {Bootstyp} {Länge} m – {Hafen}“. Für die Datenschutzerklärung gilt dasselbe wie beim bestehenden Upload (Recht prüfen).

### B. Fachspezifikation „Bordtauglichkeit“ (Daten und Prozess)

**B1 – Neue Felder pro Produkt in `concepts.json` (intern, nicht öffentlich):**

| Feld | Werte | Quelle |
|---|---|---|
| `gewichtKg` | Zahl | Herstellerdatenblatt |
| `schutzartIP` | z. B. IP65 | nur Leuchten |
| `brandnachweis` | `keiner` / `EN1021-1/2` / `BS5852-Crib5` / `IMO-FTP-Teil7/8/9` / `MED` | Datenblatt, Zertifikat |
| `salzwasser` | `ja-hersteller` / `nein` / `offen` | schriftliche Herstellerantwort |
| `magnetisch` | `ja` / `nein` | Stahlgestell, Magnet, Lautsprecher |
| `befestigung` | `lose` / `rutschhemmend` / `werft` | Gremium |
| `herstellerFreigabeDatum` | ISO-Datum | Mail des Herstellers |

**B2 – Regel:** Ein Produkt bekommt im Angebot für eine Zone an Deck nur dann den Status „bordtauglich“, wenn `salzwasser = ja-hersteller` (am Meer) oder ein Outdoor-Datenblatt vorliegt (Bodensee), `magnetisch = nein` oder Abstand geprüft ist und `gewichtKg` bekannt ist. Für gewerbliche Yachten ab 24 m gilt zusätzlich `brandnachweis` = IMO-FTP für Polster, Vorhänge und Bettzeug.

**B3 – Bord-Check-Protokoll (Formular für den Termin an Bord, 1 Seite):**
1. Boot: Werft/Modell, Länge, Baujahr, CE-Kategorie, max. Zuladung laut Plakette, privat/gewerblich, Flagge.
2. Revier: Bodensee / Meer (→ A2 oder A4, UV-Last).
3. Zonen mit Fotos und Maßen. Der Sattler fertigt Schablonen.
4. Gefahrenpunkte: Kompassposition, Motorraumlüftung, Notausstiege, Gas, Herd, Abgas, Batterien.
5. Befestigungspunkte vorhanden? (Druckknöpfe, Schienen) Neue Punkte nur durch die Werft.
6. Feuchte: Kondenswasser in Kojen, Bilge, Lüftung.
7. Unterschriften: Eigner, Platzhirsch, Sattler, Werft. Abgrenzung „keine Eingriffe in Struktur, Antrieb, Elektrik, Gas, Lüftung, Notausstiege durch Platzhirsch“.

### C. Akquiseplan November 2026 bis Oktober 2027

**Ziel [Schätzung, gestützt auf Bericht 29]:** 3 Pilotprojekte im Winterlager 2026/27, 15 Leads bis April, 8–12 Aufträge im Jahr 1, Umsatz 0,05–0,2 Mio. €. Kapitalbedarf bis April unter 5 T€ (Musterkoffer, Fahrten, Druck).

**C1 – Zielkunden, priorisiert**

| Prio | Segment | Erreichbar über | Einstiegsprodukt | Ticket [Schätzung] |
|---|---|---|---|---|
| 1 | Eigner 8–15 m am Ostufer im Winterlager | Werften Hard/Fußach, Ultramarin Kressbronn | Cockpit-Refresh (Paket M) | 4–12 T€ |
| 2 | Bootshaus- und Seegrundstückbesitzer | Bestandskunden, Architekten, Outdoor-Seite | Steg-Lounge + Schatten + Wärme | 15–60 T€ |
| 3 | Charterflotten (Schattmaier ~40 Yachten, Sporer) | Direktbesuch | Serienpaket Kojenunterlage + Bezüge + Handtücher je Yacht | 1,5–4 T€ je Boot |
| 4 | Vorarlberger, Allgäuer und Ostschweizer Eigner mit Boot an der Adria (Istrien, Kvarner, Friaul) | Kundenkartei, Yachtclubs, SeaHelp-Kanal [prüfen] | Interior-Refresh (Paket L) | 15–40 T€ |
| 5 | Klassiker-Runabouts | Klassiker-Werften (Michelsen), Klassik-Treffen | Polster + Persenning + Plaid | 5–15 T€ |

**C2 – Kanäle**

| Kanal | Konkret | Wann | Aktion |
|---|---|---|---|
| Werften AT-Ufer | Hartmann (Hard), Biatel (Hard), Sohm (Hard), Bilgeri (Fußach), Rohrspitz Salzmann (Fußach) | KW 45–48/2026 | Termin, Musterkoffer, Kooperationsangebot (Baustein D) |
| Werften DE/CH-Ufer | Ultramarin/Meichle & Mohr + Speedwave (Kressbronn), Michelsen (Seemoos), Steiner Bootbau (Altenrhein) | KW 47/2026–KW 3/2027 | wie oben |
| Bootssattler | Hillebrand (Langenargen) zuerst. WKO Vorarlberg nach befugten Sattlern bzw. Tapezierern in AT fragen | KW 45/2026 | Partnergespräch, ein Pilot |
| Yachtclubs | Yachtclub Bregenz (Hafen ca. 130 Boote, [PredictWind](https://www.predictwind.com/de/marinas/austria/vorarlberg/yachtclub-bregenz)), Lindauer Segler-Club (Versammlungen mit rund 200 Mitgliedern, [Schwäbische](https://www.schwaebische.de/regional/lindau/lindau/lsc-mitglieder-stimmen-fuer-projekt-schiffswerft-88820)), Yachtclub Hard, Seglerhafen Rorschach (76 Plätze, [PredictWind](https://explore.predictwind.com/marinas/switzerland/saint-gallen)), Club in Lochau [Name prüfen] | Jan–Mär 2027 (Clubabende im Winter) | Vortrag „Bootsinterior auffrischen – was an Bord darf“ (30 min, ohne Verkauf), danach Musterabend im Showroom-Café |
| Charter | Schattmaier (Kressbronn), Sporer (Lochau) | Nov 2026 | Angebot Serienpaket für 2–3 Boote als Pilot |
| boot Düsseldorf | 23.–31.01.2027, nur Besuch ([boot.com](https://www.boot.com/en/Media_News/Press/Press_Material/Press_Releases/Cast_off_for_boot_D%C3%BCsseldorf_2027)) | Jan 2027 | 2 Tage: Marinestoff-Lieferanten, Kojenunterlagen, Paola Lenti/Tuuci Yachting, Gespräche mit Werften |
| Interboot | 22.–26.09.2027 (laut Drittquellen, [travel2fair](https://travel2fair.com/exhibitions/interboot/22-september-2027-26-september-2027), bei der Messe bestätigen) | Anfrage März 2027 | Kein eigener Stand. Lounge-Ausstattung für den Stand einer Partnerwerft als Leihgabe gegen Nennung: kostet fast nur Logistik |
| Bestandskunden | Kartei nach Seeadresse, Bootsbesitz und Outdoor-Käufen filtern | Nov 2026 | persönlicher Brief + Einladung zum Musterabend |
| Online | Seite indexieren (A0), Google-Profil-Leistung „Yacht Interior“, Ratgeber „Kojenschimmel vermeiden“ und „Bootspolster erneuern: Zeitplan“ | ab Dez 2026 | SEO-Long-Tail mit wenig Wettbewerb |

**C3 – Angebotsleiter**

1. **Bord-Check** (Termin an Bord mit Protokoll B3, Moodboard und Kostenrahmen): 290 € [Vorschlag], bei Auftrag verrechnet. Er filtert unernste Anfragen und finanziert die Fahrten.
2. **Kojen-Paket** (Unterlüftung + Matratzenauflage + Bettwäsche): kleines Ticket, schnell lieferbar, online nachkaufbar.
3. **Cockpit-Refresh** (M), **Interior-Refresh** (L), **Bootshaus/Adria** (XL), wie Bericht 29, 6.2.
4. **Saisonservice**: Abholen, Reinigen, Einlagern und Zurückbringen der Polster. Jahresvertrag [Preis kalkulieren].

**C4 – 12-Wochen-Sprint ab sofort**

| Woche | Aufgabe | Wer |
|---|---|---|
| KW 44–45 | Musterkoffer (Marinestoffe, Schnelltrockenschaum, Kunstleder, Teakmuster, Abstandsgewebe, Beschläge A2/A4); GISA-Auszug; Makler (Obhutsschäden) | Inhaber |
| KW 45 | Hillebrand und ein AT-Sattler anfragen; Hersteller-Mails (Paola Lenti, Tuuci, Flos) mit Fragen aus B1 | Inhaber |
| KW 45–48 | 8 Werftbesuche (5 AT, 3 DE/CH); Charter-Termine Sporer und Schattmaier | Inhaber |
| KW 46 | Brief an Bestandskunden mit Seeadresse | Inhaber + Code-Team (Liste) |
| KW 47–50 | 3 Bord-Checks als Pilot. Ziel: 2 Aufträge | Inhaber + Sattler |
| KW 49 | Musterabend „Leben am See, auch an Bord“ im Café | Inhaber |
| KW 50–51 | Bestellungen der Pilotprojekte (Bestellschluss) | Inhaber |
| KW 1–3/2027 | Clubvorträge anfragen; boot Düsseldorf | Inhaber |

### D. Kooperationsmodell mit Werften und Sattlern

**Grundsatz:** Platzhirsch nimmt den Partnern nichts weg und bringt ihnen Aufträge, die sie allein nicht gewinnen: Design, Marken, Gesamtpaket. Wegen der angespannten Finanzlage gilt: **keine Vorfinanzierung von Fremdleistungen, getrennte Rechnungen als Standard.**

**D1 – Drei Stufen**

| Stufe | Werft | Sattler | Geld |
|---|---|---|---|
| **1 Empfehlung** | empfiehlt Platzhirsch an Eigner, Musterkoffer liegt im Werftbüro | – | Tippgeberprovision für die Werft 5 % auf den Platzhirsch-Warenumsatz [Vorschlag], **schriftlich und dem Kunden offengelegt** |
| **2 Projekt** (Standard) | Montage, Befestigung, Freigabe von Gewicht und Stabilität, Elektrik | Aufmaß, Fertigung, Einpassen | **Drei getrennte Rechnungen** an den Eigner. Platzhirsch: Ware + Gestaltungshonorar. Sattler und Werft: eigene Leistung. Gegenseitig keine Provision, nur Projektaustausch. |
| **3 Generalpaket** (nur auf Kundenwunsch) | Subunternehmer | Subunternehmer | Platzhirsch rechnet alles ab. Grenzen von § 32 Abs. 1a GewO beachten (reglementierte Fremdleistung max. 15 %). Deshalb **nur, wenn Sattler und Werft zusammen unter 15 % des Auftrags liegen**, sonst Stufe 2. Fremdleistungen erst nach Kundenanzahlung beauftragen. |

**D2 – Zahlungsplan Stufe 2 (Platzhirsch-Teil):** 50 % bei Bestellung, 40 % bei Lieferung, 10 % bei Übergabe. Möbel werden erst nach Eingang der Anzahlung bestellt.

**D3 – Eckpunkte Kooperationsvereinbarung (1–2 Seiten, vom Anwalt prüfen lassen):**
1. Gegenstand: Zusammenarbeit bei der Ausstattung von Booten. Keine Exklusivität im ersten Jahr, danach optional Exklusivität je Ufer.
2. Leistungsgrenzen: Platzhirsch ausschließlich Gestaltung, Handelsware und Koordination. Sattler: Polster, Persenning, Bimini. Werft: alles an Struktur, Rumpf, Elektrik, Gas, Lüftung, Befestigung sowie die Freigabe von Gewicht und Stabilität.
3. Haftung: Jeder haftet für seine Leistung. Aufmaß verantwortet der Sattler, Bohrungen die Werft, Produkteignung laut Herstellerangabe Platzhirsch.
4. Kundenschutz: Ein Eigner, den ein Partner bringt, bleibt dessen Kunde für dessen Gewerk.
5. Namensnennung auf der Website nur mit schriftlicher Zustimmung, mit Text und Logo vorab freigegeben.
6. Fotos: nur mit Freigabe des Eigners. Der Partner wird genannt.
7. Musterkoffer und Showroom: Die Werft darf Kunden in den Showroom schicken. Platzhirsch lädt Partner zu Musterabenden ein.
8. Provision (nur Stufe 1): Höhe, Fälligkeit nach Zahlungseingang, Offenlegung gegenüber dem Kunden.
9. Laufzeit 12 Monate, danach Bilanzgespräch (Oktober 2027).
10. Versicherung: Nachweis der Betriebshaftpflicht beider Seiten, bei Platzhirsch mit Obhutsschäden.

**D4 – Pitch für das Werftgespräch (2 Minuten):**
> „Ihre Kunden fragen im Winterlager nach neuen Polstern, Licht und Möbeln für Deck und Salon. Das ist nicht Ihr Kerngeschäft, aber ein Grund, warum Eigner wiederkommen. Wir übernehmen Gestaltung, Stoffe und Möbel aus unserem Sortiment und stimmen uns mit Ihnen und dem Sattler ab. Alles, was Technik und Sicherheit betrifft, bleibt bei Ihnen und wird von Ihnen abgerechnet. Wir bringen Ihnen damit Arbeit, wir nehmen Ihnen keine weg. Darf ich den Musterkoffer bei Ihnen lassen und im November drei Ihrer Eigner an Bord treffen?“

**D5 – Werften am Mittelmeer (für Adria-Kunden, Stufe 2 vor Ort):** Ein Partner pro Revier genügt. Platzhirsch liefert dann Konzept und Ware per Spedition, Montage und Einpassen übernimmt der örtliche Betrieb. Vorgehen: Über den Eigner kommt der Kontakt zu dessen Marina-Werft (z. B. Marinas Umag, Admiral Opatija, Mitan, siehe 2.3). Keine Partnerschaft auf Vorrat. Für Yachten ab 24 m: nur Deck-Möbel und Textilien mit Nachweisen, Interior bleibt beim Designbüro der Werft.

---

## 4. Maßnahmen-Tabelle

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Winterlager-Sprint: 8 Werftbesuche, 1 Sattler-Partner, 3 Bord-Checks bis KW 50 (C4) | M | < 2 T€ (Fahrten, Musterkoffer) | Hoch: Ohne Pilot im Winter 2026/27 kommen 2027 keine Referenzen und praktisch kein Umsatz. Pilot = 2–3 Aufträge à 4–12 T€ [Schätzung] | Inhaber |
| P0 | Fachkorrekturen A1–A4 (Schaum, Kojenunterlüftung, Teak, A4, Motoryacht 15–24 m, widersprüchliche Superyacht-Produkte) | S | 0 | Mittel, indirekt: Glaubwürdigkeit bei Werften und Sattlern als Türöffner, weniger Reklamationen | Code-Team |
| P0 | Entscheidung A0: Navetta-Block abschalten, Seite indexieren | S | 0 | Mittel: Die Seite ist heute für Google unsichtbar. Long-Tail „Bootspolster Bodensee“ u. ä. mit wenig Wettbewerb [Schätzung: 2–5 Leads/Monat in der Saison] | Inhaber, dann Code-Team |
| P1 | Anfrageformular „Boot“ (A6) statt `mailto` | M | intern | Mittel: Mehr und besser qualifizierte Leads, Bootsdaten vor dem ersten Gespräch | Code-Team |
| P1 | Kooperationsvereinbarung D3 juristisch prüfen, Standard „getrennte Rechnungen“ | S | 0,5–1 T€ Anwalt [Schätzung] | Schützt Liquidität und GewO-Status. Ohne Vertrag kein skalierbares Partnermodell | Inhaber + Anwalt |
| P1 | Charter-Serienpaket Schattmaier/Sporer | S | Muster | Mittel: 2–3 Boote Pilot à 1,5–4 T€, danach Flottenrollout möglich [Schätzung] | Inhaber |
| P1 | FAQ A5 (Brandschutz, Kojenschimmel, Bestellschluss, Schweiz) | S | 0 | Gering bis mittel: SEO-Fragen, Dringlichkeit, Vertrauen | Code-Team |
| P1 | Hersteller-Mails mit B1-Fragen (Gewicht, Salzwasser, Brandnachweis) | S | 0 | Voraussetzung für Angebote an Deck, besonders Adria | Inhaber |
| P2 | Datenfelder B1/B2 in `concepts.json` + interne Anzeige im Angebot | M | intern | Gering direkt, senkt Haftungsrisiko | Code-Team |
| P2 | Clubvorträge Jan–Mär 2027 + Musterabend im Café | S | < 0,5 T€ | Mittel: 5–10 Leads je Abend [Schätzung] | Inhaber |
| P2 | Kojen-Paket als Online-Produkt (Unterlage + Auflage + Bettwäsche) | M | Ware auf Abruf | Gering bis mittel, wiederkehrend, kein Termin nötig | Code-Team + Inhaber |
| P2 | Saisonservice Polster-Einlagerung (gemeinsam mit Outdoor) | M | Lagerfläche | Wiederkehrender Kontakt, Folgeaufträge | Inhaber |
| P3 | Interboot 2027: Lounge für Partnerwerft-Stand (Leihgabe) | M | Logistik 1–3 T€ [Schätzung] | Mittel: ~30 Termine fürs Winterlager 2027/28 (Bericht 29) | Inhaber + Partnerwerft |
| P3 | Ratgeber-Artikel „Kojenschimmel“, „Bootspolster erneuern: Zeitplan“, „Was an Bord darf“ | M | intern | Gering, langfristig SEO | Code-Team |
| P3 | Adria-Kanal (Kundenkartei, SeaHelp-Kooperation prüfen) | M | offen | Hohe Einzeltickets (15–40 T€), unregelmäßig | Inhaber |
| P3 | EUDR: Teak nur über EU-Lieferanten mit Referenznummer, keine eigenen Importe | S | 0 | Risikovermeidung | Inhaber (Einkauf) |

---

## 5. Quellen (neu in dieser Prüfung; ältere siehe Bericht 29)

- [Kothea – IMO FTP Code Part 7, 8 und MGN 580](https://www.kothea.com/tag/imo-ftp-code/)
- [Yachting Pages – Fire safety legislation on board superyachts](https://www.yachting-pages.com/articles/fire-safety-legislation-on-board-superyachts.html)
- [RISE – Fire testing IMO 2010 FTP Code Part 8](https://www.ri.se/en/what-we-do/services/fire-testing-according-to-imo-2010-ftp-code-part-8)
- [CT DEEP Clean Marina – Teak Maintenance](https://portal.ct.gov/deep/boating/clean-marina/teak-maintenance)
- [yacht.de – Kompass kalibrieren](https://www.yacht.de/segelwissen/navigation/kalibrieren-magnetkompass-und-elektronischen-kompass-justieren/)
- [BinSchUO 2018 Anhang III](https://www.gesetze-im-internet.de/binschuo2018anh_iii/anlage.html)
- [Fisheries Supply – HyperVent](https://www.fisheriessupply.com/hypervent) · [nauticexpo – GisaTex DRYWEAVE](https://nauticexpo.com/prod/gisatex-gmbh-co-kg/product-29549-451281.html)
- [CMS – EUDR erneut verschoben](https://cms.law/de/deu/legal-updates/eu-stoppt-den-countdown-und-verschiebt-eudr-erneut) · [IHK Hannover – EUDR](https://www.ihk.de/hannover/hauptnavigation/innovation/umwelt/nachhaltigkeit/eudr-entwaldungsverordnung-verschoben-und-verschlankt-6927688)
- [travel2fair – Interboot 2027](https://travel2fair.com/exhibitions/interboot/22-september-2027-26-september-2027) · [boot.com – boot 2027](https://www.boot.com/en/Media_News/Press/Press_Material/Press_Releases/Cast_off_for_boot_D%C3%BCsseldorf_2027)
- [PredictWind – Yachtclub Bregenz](https://www.predictwind.com/de/marinas/austria/vorarlberg/yachtclub-bregenz) · [PredictWind – St. Gallen/Rorschach](https://explore.predictwind.com/marinas/switzerland/saint-gallen)
- [Schwäbische – Lindauer Segler-Club](https://www.schwaebische.de/regional/lindau/lindau/lsc-mitglieder-stimmen-fuer-projekt-schiffswerft-88820) · [Schwäbische – Schattmaier](https://www.schwaebische.de/regionale-unternehmen/schattmaier-segelschule-hotel-bootscharter-kressbronn-gohren-bodensee-142964)
- [kroati.de – Marina Umag](https://www.kroati.de/kroatien-infos/marina-umag.html) · [kroati.de – Marina Admiral](https://www.kroati.de/kroatien-infos/marina-admiral-opatija.html) · [SeaHelp – Marina Mitan](https://www.sea-help.eu/advertorial/marina-mitan-novi-vinodolski-halle/)

**Offen [zu prüfen]:** genaue Fundstelle im REG Yacht Code zu FTP Teil 8; Interboot-2027-Termin bei der Messe; Name des Clubs in Lochau; Lieferzeiten der Hersteller; Brandnachweise je Modell; SeaHelp als Kanal.
