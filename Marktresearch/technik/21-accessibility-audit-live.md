# 21 – Barrierefreiheits-Audit der laufenden Seite (WCAG 2.2 AA, BaFG/BFSG)

**Stand:** 26.10.2026 · **Rolle:** Barrierefreiheits-Prüfer · **Geprüft:** `http://localhost:3000/de` (lokaler Dev-Server, aktueller Arbeitsstand von `main` inkl. uncommitteter Änderungen)

> Teil 3 (Barrierefreiheitserklärung) ist ein **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.** Die rechtliche Einordnung in Teil 2 ist keine Rechtsberatung.

---

## 0. Kurzfassung

1. **Technisch ist die Basis gut:** `lang="de"`, ein `<main id="main">`, je Seite genau ein H1, alle Bilder mit `alt`, kein `tabindex>0`, kein Zoom-Verbot, Umbruch auf 320 px ohne Querscrollen, Marken-Laufband respektiert `prefers-reduced-motion`, Consent-Dialog mit Escape und Fokus.
2. **Echte Fehler gibt es trotzdem**, und zwar genau an den Stellen, an denen Kunden handeln: Produktgalerie (28 fokussierbare Elemente in versteckten Slides, Lightbox ohne Fokusführung), Kontaktformular (keine sichtbaren Labels, Felder ohne erkennbaren Rand, Gold-Text 2,06:1), Beratungsstrecke (Fokus fällt nach jedem Schritt auf `<body>`), Filter (Zähler 1,97:1). **Kein Skip-Link.**
3. **Recht:** BaFG (AT) und BFSG (DE) gelten seit 28.06.2025 für „Dienstleistungen im elektronischen Geschäftsverkehr“, also Websites, über die ein Verbrauchervertrag geschlossen wird. Die heutige Anfrage-Website fällt nach herrschender Lesart nicht darunter [anwaltlich prüfen]. **Mit dem geplanten Gutschein-Shop (vor Weihnachten 2026) ist die Pflicht sehr wahrscheinlich da**, außer der Rechtsträger ist Kleinstunternehmen. Mit der Ausnahme sollte man nicht planen (Abschnitt 2.3).
4. **Aufwand bis „AA-konform auf den 5 Kernseiten“:** ca. 3–5 Entwicklertage [Schätzung: 14 Fundstellen, davon 9 unter 2 Stunden, Galerie und Formulare je ca. 1 Tag].

---

## 1. Prüfmethode

| Schritt | Werkzeug | Umfang |
|---|---|---|
| Automatischer Test | `axe-core` (im Projekt unter `node_modules/axe-core` vorhanden) in Chromium über `playwright` (ebenfalls vorhanden), Regelsätze `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice` | Startseite, Produktübersicht `/de/produkte`, Kategorie `/de/produkte/armchairs-stools`, Produkt `/de/produkte/armchairs-stools/armchairs-libra`, Kontakt `/de/kontakt`, Beratung `/de/beratung`; Desktop 1366 px und Mobil 390 px |
| Tastatur | Skript: 25× Tab ab Seitenanfang, protokolliert Element, Fokusrahmen, Größe, Lage in `aria-hidden` | alle 6 Seiten |
| Dialoge/Fokus | Lightbox per Enter öffnen, Tab, Escape; Beratungsschritt per Enter auswählen | Produkt, Beratung |
| Umbruch | Viewport 320 × 640, `scrollWidth` | 5 Seiten |
| Kontraste | Formel nach WCAG 2.x (relative Luminanz) auf die Farbwerte aus `src/app/globals.css` und Tailwind-Klassen; axe-Messwerte | Code-weit |
| Code-Abgleich | `grep` über `src/components/**` | Fundstellen mit Zeile |

**Grenzen:** Automatische Tests finden nur einen Teil der WCAG-Fehler. Nicht geprüft wurden: Screenreader-Praxistest (NVDA/VoiceOver), Texte über Fotos (axe meldet je Seite 7–62 Kontraste als „nicht prüfbar“, vor allem Hero und Kacheln mit Bildhintergrund), FR/IT/EN-Seiten, Merkliste, Newsletter, Produktanfrage-Formular (`AnfrageFormProduct.js`). Messwerte stammen vom Dev-Server, die Live-Seite platzhirsch.studio kann abweichen.

---

## 2. Rechtliche Einordnung: Ab wann betrifft es Platzhirsch?

### 2.1 Was das Gesetz sagt (Österreich, BaFG, BGBl. I Nr. 76/2023)

| Regel | Fundstelle | Inhalt |
|---|---|---|
| Geltung | § 2 Abs. 2 Z 6, § 37 Abs. 1 | Gilt für Dienstleistungen, die **nach dem 28.06.2025** für Verbraucher erbracht werden, darunter „Dienstleistungen im elektronischen Geschäftsverkehr“. In Kraft seit 28.06.2025 |
| Begriff E-Commerce | § 3 Z 27 | Elektronisch und auf individuelle Anfrage eines Verbrauchers erbrachte Fernabsatz-Dienstleistungen über Websites und Apps, die **im Hinblick auf den Abschluss eines Verbrauchervertrags** erbracht werden |
| Kleinstunternehmen | § 3 Z 19, § 6 Abs. 1 | Weniger als **10 Beschäftigte** und Jahresumsatz **oder** Jahresbilanzsumme **≤ 2 Mio. €**. Kleinstunternehmen, die Dienstleistungen erbringen, sind von den Anforderungen ausgenommen |
| Informationspflicht | § 14 Abs. 2, Anlage 3 | Angaben, wie die Dienstleistung die Anforderungen erfüllt, **in den AGB oder auf vergleichbare Weise**, schriftlich und barrierefrei |
| E-Commerce-Anforderungen | Anlage 1, 4. Abschnitt lit. g | Barrierefreiheitsinfos zu Produkten (soweit vom Hersteller geliefert), barrierefreie Identifizierungs-, Sicherheits- und **Zahlungsfunktionen** |
| Ausnahmen | §§ 17, 18 | „Grundlegende Veränderung“ oder „unverhältnismäßige Belastung“ nur mit **dokumentierter Bewertung**, 5 Jahre aufbewahren, mindestens alle 5 Jahre wiederholen |
| Behörde, Beschwerden | §§ 21, 28, 35 | Sozialministeriumservice. Beschwerden auch durch VKI, Behindertenrat, Arbeiterkammer, **WKO**. Mindestens 10 Werktage Frist zur Stellungnahme vor Maßnahmen |
| Strafen | § 36 | Bis 80.000 € (KMU bis 50.000 €) bei Verstößen gegen § 14. Informations- und Kennzeichnungsverstöße bis 40.000 € (KMU 25.000 €) |
| Übergang | § 37 Abs. 2 | Altverträge vor dem 28.06.2025 höchstens 5 Jahre. Für einen **neuen** Shop gibt es keine Übergangsfrist |

Quelle: [RIS, BGBl. I Nr. 76/2023](https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2023_I_76/BGBLA_2023_I_76.html) (Erstfassung; die konsolidierte Fassung ist vor Verwendung zu prüfen).

### 2.2 Deutschland (BFSG), Schweiz, Liechtenstein

| Land | Regel | Bedeutung für Platzhirsch |
|---|---|---|
| **DE – BFSG** | § 1 Abs. 3 Nr. 5, § 2 Nr. 17 (Kleinstunternehmen, gleiche Schwellen), § 2 Nr. 26, § 3 Abs. 3, § 14 + Anlage 3 (Angaben „in AGB oder auf andere deutlich wahrnehmbare Weise“, **mit Nennung der Marktüberwachungsbehörde**), § 37 (Bußgeld bis **100.000 €**) – [gesetze-im-internet.de/bfsg](https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html) | Wer DE-Verbrauchern (Bodensee, Allgäu) gezielt online verkauft, sollte das BFSG mit einplanen [anwaltlich prüfen: Marktortprinzip]. Die Behörde ist nach Landesrecht zuständig (§ 20). Nach Fachwissen ist das die gemeinsame **Marktüberwachungsstelle der Länder für die Barrierefreiheit (MLBF), Magdeburg** [anwaltlich prüfen] |
| **CH** | Der EAA gilt nicht. Das BehiG verpflichtet vor allem den Bund, Private nur beim Diskriminierungsverbot [aus Fachwissen, nicht neu geprüft] | Keine Erklärungspflicht. WCAG trotzdem einhalten, dieselbe Seite bedient die Schweiz |
| **FL** | EWR-Staat. Ob und wie die RL (EU) 2019/882 übernommen ist, wurde nicht geprüft [anwaltlich prüfen] | Vorsorglich wie AT behandeln |

Ergänzend: Zwei Suchwege waren in diesem Lauf erschöpft (Websuche-Budget aufgebraucht). Die Quellen oben stammen aus direktem Abruf von RIS und gesetze-im-internet.de.

### 2.3 Anwendung auf Platzhirsch

**Heute (Merkliste + Anfrageformular, kein Kauf, keine Bezahlung):** Über die Website wird kein Vertrag geschlossen. Nach herrschender Lesart ist das **keine** „Dienstleistung im elektronischen Geschäftsverkehr“ (so auch `digital/14`, F10). Der Wortlaut „im Hinblick auf den Abschluss eines Verbrauchervertrags“ ist aber weit. Ein Produktkatalog mit Anfrage-Funnel ließe sich auch als Anbahnung lesen [anwaltlich prüfen]. **Risiko heute: gering.**

**Auslöser, ab dem die Pflicht greift:**

| Geplantes Feature | Verbrauchervertrag online? | Einschätzung |
|---|---|---|
| Gutschein-Shop | ja (Kauf und Zahlung) | **erfasst**, auch über einen Drittanbieter-Checkout. Die Zahlungsfunktion muss barrierefrei sein (Anlage 1 lit. g bb/cc) |
| Outlet mit Preisen und „Jetzt kaufen“/Reservierung mit Anzahlung | ja | **erfasst** |
| Online-Terminbuchung (kostenlos) | eher nein | Grauzone, weil sie auf einen späteren Kauf zielt [anwaltlich prüfen] |
| Video-Beratung kostenpflichtig | ja | **erfasst** |
| Events mit Online-Ticket | ja | **erfasst** |
| Newsletter, Bewertungen, KI-Concierge ohne Kauf | nein | nicht unmittelbar erfasst. Alles, was in einem Kaufprozess liegt, ist aber mit erfasst |

**Kleinstunternehmen-Ausnahme:** Es gelten **beide** Bedingungen: weniger als 10 Beschäftigte **und** Umsatz **oder** Bilanzsumme ≤ 2 Mio. €.

| Rechtsträger | Beschäftigte | Umsatz | Bilanzsumme | Ergebnis |
|---|---|---|---|---|
| MW Immobilienverwaltungs GmbH (heute) | Möbelhandel ca. 5, **plus Café und Verwaltung** [vom Unternehmen auszufüllen: Köpfe und VZÄ 2025] | Möbel ca. 1,3 Mio. € p. a. [Schätzung, 23] + Café + Mieten [vom Unternehmen auszufüllen] | 2,92 Mio. € (2024, belegt) | Bilanzsumme > 2 Mio. €, also hängt alles an **Umsatz ≤ 2 Mio. € UND < 10 Beschäftigte**. Mit Café wahrscheinlich **≥ 10 Beschäftigte, dann keine Ausnahme** [Schätzung] |
| Neue Handels-GmbH (geplant) | ca. 5–8 im 1. Jahr [Schätzung] | Plan Jahr 1 ≈ 1,9 Mio. €, Jahr 2 ≈ 3,3 Mio. € (23, Szenario „realistisch“) | anfangs vermutlich < 2 Mio. € [Schätzung] | Im 1. Jahr **wahrscheinlich Kleinstunternehmen**. Wächst der Umsatz über 2 Mio. €, bleibt die Ausnahme nur, solange die Bilanzsumme ≤ 2 Mio. € **und** das Team < 10 ist. Spätestens ab dem 10. Mitarbeitenden ist die Ausnahme weg |

Die Zählweise (Köpfe oder Jahresarbeitseinheiten nach EU-Empfehlung 2003/361, Konzernverbund mit der MW GmbH als Gesellschafterin) muss anwaltlich geklärt werden. **Verbundene Unternehmen können zusammengerechnet werden** [anwaltlich prüfen]. Dann fällt auch die neue GmbH nicht unter die Ausnahme.

**Empfehlung:** Nicht auf die Ausnahme bauen. Die Ausnahme spart nur die Erklärung und die Haftung, aber kaum Technikkosten, weil die Fixes ohnehin klein sind. Wer gegen Höttges, Dolce Vita und Connox mit „transparent und barrierearm“ wirbt (`digital/14`), braucht die Erklärung so oder so. **Spätestens mit dem Start des Gutschein-Shops müssen P1 und P2 aus Abschnitt 4 erledigt und die Erklärung online sein.**

---

## 3. Entwurf: Erklärung zur Barrierefreiheit

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Ort: neue Seite `src/app/[locale]/barrierefreiheit/page.js` (FR: accessibilite, IT: accessibilita, EN: accessibility). Link im Footer neben Impressum und Datenschutz und in den AGB/Gutscheinbedingungen (Anlage 3 BaFG / Anlage 3 BFSG). Texte in `src/messages/*.json`. Als HTML, nicht als PDF.

---

**Erklärung zur Barrierefreiheit**

[vom Unternehmen auszufüllen: Rechtsträger, z. B. „Platzhirsch Handels GmbH“ oder „MW Immobilienverwaltungs GmbH“], Landstraße [9 oder 11 – vom Unternehmen auszufüllen, einheitlich mit Impressum], 6911 Lochau, Österreich, möchte, dass alle Menschen die Website platzhirsch.studio gut nutzen können, auch mit Screenreader, Tastatur, Vergrößerung oder Sprachsteuerung.

**Geltungsbereich**
Diese Erklärung gilt für die Website https://platzhirsch.studio in allen Sprachversionen [und für den Gutschein-Shop unter … – vom Unternehmen auszufüllen].

**Rechtsgrundlage und Standard**
Wir richten uns nach dem österreichischen Barrierefreiheitsgesetz (BaFG) und, für Kundinnen und Kunden in Deutschland, nach dem Barrierefreiheitsstärkungsgesetz (BFSG) [anwaltlich prüfen: ob BFSG anwendbar]. Technischer Maßstab ist die harmonisierte Norm EN 301 549 V3.2.1, die die Web Content Accessibility Guidelines (WCAG) 2.1 Stufe AA übernimmt. Unser Ziel ist WCAG 2.2 Stufe AA.

**Stand der Vereinbarkeit**
Diese Website ist **teilweise vereinbar** mit den genannten Anforderungen. [Nach Umsetzung von Abschnitt 4 P1–P2 und erneuter Prüfung: „weitgehend vereinbar“ – vom Unternehmen auszufüllen]

**Nicht barrierefreie Inhalte** [vor Veröffentlichung mit dem tatsächlichen Stand abgleichen]
- Einzelne Texte in Gold auf hellem Hintergrund haben zu wenig Kontrast. Wir stellen sie bis [Datum] auf eine dunklere Goldtönung um.
- In der Produktbildergalerie sind einzelne Bedienelemente noch englisch beschriftet, und die Vollbildansicht hält den Tastaturfokus noch nicht im Fenster.
- Produktbeschreibungen und Bildtexte stammen teilweise von den Herstellern. Sie sind nicht immer vollständig strukturiert oder auf Deutsch.
- Herstellerdokumente (PDF-Kataloge, Datenblätter) sind Inhalte Dritter und meist nicht barrierefrei. Auf Wunsch senden wir die Informationen in einem zugänglichen Format.
- Eingebettete Karten (Google Maps) laden erst nach Zustimmung. Die Adresse und ein Link zur Routenplanung stehen immer als Text daneben.
- [vom Unternehmen auszufüllen: Drittanbieter für Gutscheinkauf, Zahlung, Terminbuchung oder Chat; deren Barrierefreiheit und Ansprechpartner]

**Wie die Dienstleistung die Anforderungen erfüllt** (Angaben nach Anlage 3 BaFG / BFSG)
- *Beschreibung der Dienstleistung:* Auf der Website können Sie Möbel, Leuchten und Küchen ansehen, eine Merkliste anlegen, Beratung anfragen [und Geschenkgutscheine kaufen und bezahlen – vom Unternehmen auszufüllen].
- *Wahrnehmbar:* Alle informativen Bilder haben Textalternativen. Texte erfüllen das Kontrastverhältnis von mindestens 4,5:1. Inhalte lassen sich bis 200 % vergrößern und bleiben ab 320 px Breite ohne waagrechtes Scrollen lesbar. Bewegte Elemente stoppen, wenn Ihr System „Bewegung reduzieren“ meldet, und lassen sich anhalten.
- *Bedienbar:* Alle Funktionen sind mit der Tastatur bedienbar. Der Fokus ist sichtbar. Ein Link „Zum Inhalt springen“ überspringt die Navigation. Es gibt keine Zeitlimits.
- *Verständlich:* Jede Sprachversion ist korrekt ausgezeichnet. Formularfelder haben sichtbare Beschriftungen. Fehler werden am Feld in Textform erklärt.
- *Robust:* Standard-HTML mit gültigen ARIA-Attributen. Getestet mit [vom Unternehmen auszufüllen, z. B. NVDA 2026 + Firefox, VoiceOver iOS + Safari].
- *Zahlung und Identifizierung:* [vom Unternehmen auszufüllen: Zahlungsanbieter, Nachweis/Erklärung des Anbieters zur Barrierefreiheit; kein Bild-CAPTCHA].
- *Barrierefreiheitsinformationen zu Produkten:* Soweit die Hersteller sie liefern, z. B. Sitzhöhe, Armlehnen, Aufstehhilfe, Bedienbarkeit von Küchenfronten, geben wir sie auf der Produktseite oder auf Anfrage weiter.

**Erstellung dieser Erklärung**
Erstellt am [Datum]. Grundlage: Selbstbewertung mit automatisierten Tests (axe-core) und manueller Prüfung mit Tastatur [und Screenreader]. Letzte Überprüfung: [Datum]. Wir prüfen mindestens einmal im Jahr und bei jeder größeren Änderung.

**Feedback und Kontakt**
Haben Sie eine Barriere bemerkt oder brauchen Sie Informationen in einem anderen Format? Schreiben Sie uns an [barrierefreiheit@platzhirsch.studio – vom Unternehmen anzulegen oder info@], rufen Sie uns an unter +43 5574 46255 oder kommen Sie während der Öffnungszeiten ins Studio. Wir antworten innerhalb von [10 Werktagen – vom Unternehmen festzulegen].

**Beschwerde bei der Behörde**
Wenn Sie mit unserer Antwort nicht zufrieden sind, können Sie sich in Österreich an die Marktüberwachungsbehörde wenden: Bundesamt für Soziales und Behindertenwesen (Sozialministeriumservice), [Adresse und Kontakt – anwaltlich prüfen / aktuelle Angabe auf sozialministeriumservice.at]. Für Deutschland: [Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und Dienstleistungen (MLBF), Magdeburg – anwaltlich prüfen].

---

## 4. Fundstellen mit Datei und Fix

Priorität: **P1** = WCAG-AA-Verstoß an einer Kernfunktion (vor jedem Shop beheben), **P2** = AA-Verstoß, aber Nebenstelle oder Risiko, **P3** = Best Practice.

| # | Prio | WCAG 2.2 | Befund (gemessen) | Datei / Zeile | Fix |
|---|---|---|---|---|---|
| 1 | P1 | 2.4.1 Blöcke umgehen | **Kein Skip-Link.** Der erste Tab-Stopp ist die Telefonnummer, erst Stopp 16 ist Inhalt (Desktop). `<main id="main">` ist vorhanden | `src/app/[locale]/client-layout.js` Z. 25–28 | Vor `<Navbar>`: `<a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:bg-ink focus:px-4 focus:py-3 focus:text-white">{t("skipToContent")}</a>`. `<main id="main" tabIndex={-1}>`. Text in 4 `messages/*.json` („Zum Inhalt springen“) |
| 2 | P1 | 4.1.2, 2.4.3, 1.3.1 | **Produktgalerie:** axe `aria-hidden-focus` (serious) **28×**. Beide react-slick-Slider (Hauptbild 12 Slides, Thumbnails 22 inkl. 12 Klonen) lassen Buttons in `aria-hidden="true"`-Slides fokussierbar. Tab landet 5× nacheinander auf unsichtbaren „Open full-screen view“-Buttons (586×586 px) | `src/components/ShopCatalog/productGallery.js` Z. 250–350 (Slider + Slides) | In jedem nicht aktiven Slide `tabIndex={-1}` auf Buttons setzen (`i === index ? 0 : -1`), beim Thumbnail-Slider `infinite={false}` (keine Klone) oder Thumbnails als einfache Button-Leiste ohne Slider (`.scrollbar-hide` ist schon da). Alternativ react-slick ersetzen: Embla Carousel (MIT) oder CSS-Scroll-Snap |
| 3 | P1 | 2.4.3, 2.1.2-Risiko, 4.1.2 | **Lightbox** (`role="dialog" aria-modal="true"`): Beim Öffnen bleibt der Fokus auf dem Auslöser **hinter** dem Dialog. 3× Tab landet außerhalb (`inDialog=false`). Escape funktioniert | `productGallery.js` Z. 164–180 (Key-Handler), Z. 210–230 und 366–400 (Dialog) | Native `<dialog>` mit `showModal()` (Fokusfalle, Escape und `inert` gratis) **oder** beim Öffnen `closeButtonRef.current.focus()`, Tab-Zyklus im Dialog, beim Schließen Fokus zurück auf den Auslöser |
| 4 | P1 | 3.1.2 Sprache von Teilen / 2.4.6 | Englische Bedienbeschriftungen auf DE-Seiten: „Previous image“, „Next image“, „Open full-screen view“, „Show image 1“, „Close full-screen view“. Breadcrumb „Armchairs Stools“ (aus Slug) | `productGallery.js` Z. 26–81, 188, 203, 219, 266, 285, 328, 376, 415; Breadcrumb-Label in `src/app/[locale]/produkte/[category]/…` | `useTranslations("Gallery")` mit Schlüsseln `prev/next/open/close/showImage` in 4 Sprachen. Breadcrumb aus dem übersetzten Kategorienamen statt Slug |
| 5 | P1 | 1.4.3 Kontrast | **Kontakt:** 4 Fehler à 2,06:1: Eyebrow `text-[#d1b250]` (Z. 176), H2 „Kontaktformular“ in Gold (Z. 325), Button „Route planen“ **weiß auf Gold** (Z. 288). Code-weit noch **161× `text-[#d1b250]`** in 41 Dateien und **58× `bg-[#d1b250]`** (viele davon auf Dunkel, dort ok: Gold auf `#30373e` = 5,85:1) | `src/components/Kontakt/kontakt.js` Z. 176, 288, 325; Liste der übrigen Dateien: `grep -rc "text-\[#d1b250\]" src` (Spitzen: `navbar.js` 26, `collectionDetail.js` 12, `markenitems.js` 10, `landingPage.js` 9, `karriereposition.js` 9, `adventsabend/page.js` 7) | Auf hellem Grund `text-gold-text` (`#7a5f17` = **6,04:1** auf Weiß, 5,36:1 auf Beige). Gold-Flächen mit `text-ink` (5,85:1) statt Weiß. Betroffen auch `adventsabend/page.js` Z. 154, `jobdetailsclient.js` Z. 483, `Beratung/advice.js` Z. 108, `karriereposition.js` Z. 213. Danach ESLint-Regel `no-restricted-syntax` gegen `text-[#d1b250]` |
| 6 | P1 | 3.3.2 Beschriftungen, 1.4.3 | **Kontaktformular:** 5 Felder nur mit `placeholder` + `aria-label`, **keine sichtbaren Labels**. Platzhalter = Ink 50 % ≈ **2,8:1** auf Weiß (auf `bg-gray-100` darunter). Das Label verschwindet beim Tippen | `kontakt.js` Z. 348–410; gleiches Muster `BeratungClient.js` Z. 229, 405–434 | Sichtbares `<label htmlFor>` über jedem Feld (`text-sm text-ink`), Pflicht als Text „(Pflichtfeld)“ statt nur „*“. Platzhalter nur als Beispiel („z. B. 0664 …“) |
| 7 | P1 | 1.4.11 Nicht-Text-Kontrast | Formularfelder `bg-gray-100` **ohne Rand**: Feldgrenze ≈ 1,1:1 zu Weiß. Beratung: `border-gray-300` (#d1d5db) ≈ 1,5:1 | `kontakt.js` Z. 358 ff.; `BeratungClient.js` Z. 226, 426 | `border border-ink/50` (Ink 50 % = 2,79:1, reicht nicht) → `border-ink/60` (3,62:1) oder `border-[#767b80]` (≥ 4:1) |
| 8 | P1 | 3.3.1 / 3.3.3 Fehler, 4.1.3 | Fehler erscheinen nur als Sammelmeldung oben (`role="alert"`, gut), **ohne Bezug zum Feld** (kein `aria-invalid`, kein `aria-describedby`) und **verschwinden nach 5 s** (`setTimeout(() => setMessage(null), 5000)`) | `kontakt.js` Z. 80–118, 153; `BeratungClient.js` Z. 148–153 (Erfolg/Reset nach 5 s) | Fehlermeldung je Feld unter dem Feld mit `id`, Feld `aria-invalid="true" aria-describedby="…-error"`, Fokus auf das erste fehlerhafte Feld. Meldungen nicht automatisch ausblenden. Beratung: kein Auto-Reset auf Schritt 1 |
| 9 | P1 | 2.4.3 Fokusreihenfolge, 3.2.2 | **Beratung:** Nach Auswahl einer Option springt die Strecke nach 500 ms selbst weiter. Der gedrückte Button verschwindet, **der Fokus fällt auf `<body>`** (gemessen). Screenreader hören nichts | `src/components/BeratungClient/BeratungClient.js` Z. 71–80 | Kein Auto-Weiter: Auswahl markieren (`aria-pressed` ist schon da) + Knopf „Weiter“. Bei Schrittwechsel Fokus auf die Schritt-Überschrift (`h3 tabIndex={-1}` + `ref.focus()`) und Fortschritt „Schritt 2 von 4“ als Text. Optionen als `<fieldset><legend>` statt H3 „Bei meiner Anfrage geht es um“ |
| 10 | P2 | 1.4.11 / 2.4.7 Fokus sichtbar | Globaler Fokusrahmen `2px solid #d1b250` = **2,06:1** auf Weiß. Gemessen wurden Zwischenfarben (z. B. `rgb(183,158,77)`), weil `transition-colors` die Outline-Farbe animiert: Der Ring blendet ein, statt sofort da zu sein | `src/app/globals.css` Z. 130–133 | Zweifarbiger Ring, auf Hell und Dunkel ≥ 3:1: `outline: 2px solid #30373e; outline-offset: 2px; box-shadow: 0 0 0 4px #d1b250;` und `transition: none` für `outline-color` (bzw. `transition-property` ohne outline) |
| 11 | P2 | 1.4.3 Kontrast | **Kategorie-Filter:** Treffer-Zähler `text-[#30373e]/35` = **1,97:1** (axe 6×). Code-weit zu hell für Fließtext: `text-[#30373e]/50` (2,79:1) 11×, `/55` 4×, `text-ink/60` (3,62:1) 18× (v. a. Labs), `text-gray-400` | `src/components/ShopCatalog/shopCatalog.js` Z. 135; `brandDesignerShowcase.js` Z. 108; `navbar.js` Z. 374–494 (Mega-Menü-Zwischenüberschriften und Untertitel `/50`); `MarkenItems/collectionDetail.js` Z. 24, 47, 186 (`/55`) | Mindestens **`/70`** (4,79:1) für Text, besser `/75` (5,54:1). Nur rein dekorative Icons dürfen heller sein |
| 12 | P2 | 2.2.2 Pausieren | Marken-Laufband (48 s, endlos, `aria-hidden`): Pause nur bei Hover/Fokus. Auf Touch gibt es keinen Pause-Weg, außer der Systemeinstellung „Bewegung reduzieren“ (die ist umgesetzt) | `src/components/Home/BrandWall.js` Z. 31–39, `globals.css` Z. 108–125 | Kleiner Knopf „Laufband anhalten/fortsetzen“ (≥ 24 px, `aria-pressed`) rechts am Band, setzt eine Klasse mit `animation-play-state: paused` |
| 13 | P2 | 1.3.1 / 2.4.6 Überschriften | **Produktseite:** Nur H1 „Libra“, danach direkt **H4 „Ausführungen“** (axe `heading-order`). Die H4 kommt aus dem Backoffice-HTML der Beschreibung. Beschreibung, Maße und Ausführungen haben keine H2. Beratung: H4-Schritte unter H3 (ok), aber H2 „Unser Prozess“ und H3 doppeln sich | `src/components/ShopCatalog/productInfoTabs.js` Z. 103–108 (`dangerouslySetInnerHTML`) | Beim Rendern Überschriften normalisieren: `h1–h4` im CMS-HTML auf `h3` abbilden (Regex bzw. `sanitize-html` `transformTags`). Tabs bzw. Abschnitte bekommen eine H2 (visuell ggf. `sr-only`) |
| 14 | P2 | 4.1.2 / APG-Tabs | Produkt-Tabs: `role="tablist/tab/tabpanel"` mit `aria-selected`, aber **ohne `aria-controls`/`id`/`aria-labelledby`**, ohne Pfeiltasten, alle Tabs im Tab-Lauf | `productInfoTabs.js` Z. 72–165 | Entweder APG-Tabs vollständig (Roving `tabIndex`, ←/→, `aria-controls`, Panel `aria-labelledby`, `tabIndex={0}`) **oder** einfacher: Rollen entfernen und als `<details>`/Abschnitte mit H2 zeigen |
| 15 | P2 | 2.5.8 Zielgröße (min.) | Merkliste-Icon **22 × 22 px**, Such-Button 41 × 17 px, Topbar-Telefon 91 × 16 px, Breadcrumbs 16 px hoch. Die Abstandsregel könnte einzelne retten, das ist aber nicht geprüft | `src/components/Navbar/navbar.js` (Merkliste, Suche, Topbar), `src/components/Reusable/breadcrumbBar.js` | `min-h-6 min-w-6` (24 px), besser 44 px auf Mobil (`p-2.5` um Icons). Breadcrumb-Links `py-1` |
| 16 | P3 | 1.3.1 Landmarks | Mehrere `<nav>` ohne eindeutigen Namen (axe `landmark-unique`), zweites `<nav>` im Mobilmenü ohne `aria-label`. Mobil: `MobileCtaBar` und ein `.z-40`-Element liegen außerhalb von Landmarks (axe `region`) | `navbar.js` Z. 949; `src/components/Reusable/MobileCtaBar.js` Z. 26 | `<nav aria-label={t("mobileNavigation")}>`; CTA-Leiste als `<aside aria-label="Schnellkontakt">` oder in `<footer>`. Positiv: `aria-hidden` + `tabIndex=-1` bei ausgeblendeter Leiste ist korrekt |
| 17 | P3 | 2.4.11 Fokus nicht verdeckt | Fixierte `MobileCtaBar` (ca. 52 px) unten, `scroll-padding-bottom` fehlt. Felder oder Links am unteren Rand können beim Tabben verdeckt sein | `globals.css` Z. 27–31 | `@media (max-width:1023px){html{scroll-padding-bottom:4.5rem}}` |
| 18 | P3 | 2.4.3 / Consent | Cookie-Banner (`role="region"`) steht am DOM-Ende. Tastaturnutzer erreichen „Ablehnen/Akzeptieren“ erst nach der ganzen Seite | `src/components/Cookies/cookiecomponent.js` Z. 380 ff., `client-layout.js` Z. 31 | Banner im DOM vor `<Navbar>` rendern (optisch bleibt er unten) oder beim ersten Tab hinspringen. Gleichwertige Buttons beibehalten (keine Dark Patterns) |
| 19 | P3 | 1.4.3 (offen) | axe konnte 7–62 Kontraste je Seite nicht automatisch prüfen (Text über Fotos/Verläufen: Hero, Kategoriekacheln, Showroom-Karte) | `src/components/Home/*`, `ShopCatalog/shopCategoryGrid.js` | Manuell mit Pipette prüfen. Overlay `bg-ink/55` oder Textfeld hinter weißem Text garantiert ≥ 4,5:1 auf jedem Foto |

**Was bereits gut ist (nicht anfassen):** `<html lang={locale}>` (`layout.js` Z. 216), Sprachumschalter mit `lang`/`hrefLang` pro Eintrag (`navbar.js` Z. 677), Breadcrumb mit `aria-label` und `aria-current`, alle `<img>` mit `alt` (Deko leer, Produkte „Minotti Libra“), keine namenlosen Links oder Buttons, Kategorie-Checkboxen in `<label>`, `autocomplete` im Kontaktformular, Reflow 320 px ohne Querscroll auf allen 5 Seiten, `prefers-reduced-motion` für alle CSS-Animationen, Cookie-Einstellungsdialog mit `aria-modal`, Fokus und Escape, `ConsentEmbed` mit Text-Alternative zur Karte, keine positiven `tabindex`, kein `maximum-scale`.

---

## 5. Umsetzungsreihenfolge und Absicherung

| Paket | Inhalt | Aufwand [Schätzung] |
|---|---|---|
| A – Sofort (1 Tag) | #1 Skip-Link, #5 Gold-Kontrast Kontakt + 6 Buttons, #10 Fokusring, #11 Zähler/Mega-Menü `/70`, #16, #17 | 0,5–1 PT |
| B – Formulare (1–1,5 Tage) | #6, #7, #8, #9 in `kontakt.js` und `BeratungClient.js`, dasselbe Muster sofort auch in `AnfrageFormProduct.js`, `newsletter.js`, `AdventsabendForm.js` (nicht geprüft, gleiche Bauart) | 1–1,5 PT |
| C – Galerie (1 Tag) | #2, #3, #4, #14 | 1 PT |
| D – Rest + Absicherung (1 Tag) | #12, #13, #15, #18, #19, Gold-Klassen code-weit (161 Stellen per Suchen/Ersetzen nach Kontext) | 1–1,5 PT |
| E – Dauerhaft | `tests/a11y.spec.js` mit `@axe-core/playwright` auf 10 Kernseiten im CI (Build bricht bei „serious/critical“), `eslint-plugin-jsx-a11y` auf „error“ (Vorschlag aus `digital/13`, F7). Vor jedem Feature mit Kasse: Tastatur- und NVDA-Durchlauf des gesamten Kaufwegs inkl. Zahlungsanbieter | 0,5 PT + 1 h pro Release |

**Abnahmekriterium vor Start des Gutschein-Shops:** axe ohne „serious/critical“ auf Start, Produktliste, Produkt, Kontakt, Beratung, Merkliste, Gutschein-Kasse, Widerruf. Ganzer Kaufweg nur mit Tastatur abschließbar. Erklärung (Abschnitt 3) veröffentlicht und in AGB/Gutscheinbedingungen verlinkt. Kleinstunternehmen-Entscheidung schriftlich dokumentiert.

---

## 6. Was der Inhaber entscheiden oder liefern muss

1. **Rechtsträger und Zahlen für die Kleinstunternehmen-Prüfung:** Köpfe und VZÄ 2025 (getrennt Möbel/Café/Verwaltung), Umsatz 2025, Bilanzsumme, Verbund zur MW GmbH. Danach entscheidet der Anwalt, ob die Ausnahme gilt. **Empfehlung: trotzdem umsetzen.**
2. **Freigabe der Gold-Regel:** Gold `#d1b250` nur noch als Fläche, Linie oder auf Dunkel, Goldtext auf Hell in `#7a5f17`. Das ist eine Markenentscheidung (mit `digital/01` und Expertenrat abstimmen).
3. **Kontaktadresse für Barrieren** (eigene Mailadresse oder info@) und eine zugesagte Antwortfrist.
4. **Auswahl des Gutschein- und Zahlungsanbieters** nur mit dessen schriftlicher Barrierefreiheitsangabe (Anlage 1 lit. g BaFG).
5. **Anwaltliche Prüfung** der Erklärung (Abschnitt 3), der BFSG-Anwendbarkeit für DE-Kunden und der FL-Lage. Danach die Übersetzung in FR/IT/EN.
6. **Hausnummer 9 oder 11** einheitlich festlegen (Erklärung, Impressum, Karte).

---

### Quellen

- BaFG, BGBl. I Nr. 76/2023: https://www.ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2023_I_76/BGBLA_2023_I_76.html (§§ 2, 3 Z 19/27, 6, 14, 17, 18, 21, 28, 35, 36, 37, Anlagen 1 und 3; abgerufen 26.10.2026)
- BFSG: https://www.gesetze-im-internet.de/bfsg/BJNR297010021.html (§§ 1 Abs. 3, 2 Nr. 17/26, 3 Abs. 3, 14, 20, 37, 38, Anlage 3; abgerufen 26.10.2026)
- W3C, WCAG 2.2 (Erfolgskriterien 1.4.3, 1.4.11, 2.2.2, 2.4.1, 2.4.3, 2.4.11, 2.5.8, 3.3.1, 3.3.2, 4.1.2): https://www.w3.org/TR/WCAG22/ [aus Fachwissen, nicht neu abgerufen]
- EN 301 549 V3.2.1 (harmonisierte Norm, WCAG 2.1 AA) [aus Fachwissen]
- Eigene Messung: axe-core + Playwright auf `localhost:3000`, Rohdaten im Session-Scratchpad (`result.json`), nicht im Repo
- Projektberichte: `Marktresearch/digital/13-performance-a11y-engineering.md` (1.3, F7), `digital/14-recht-compliance-digital.md` (F10), `23-masterkonzept.md` (Umsatz, Team, Bilanz)
