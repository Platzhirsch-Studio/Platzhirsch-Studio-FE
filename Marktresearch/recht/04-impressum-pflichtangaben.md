# 04 – Impressum und Pflichtangaben (ECG, UGB, GewO, MedienG, DSA, BaFG)

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Keine Rechtsberatung. Markierungen: **[vom Unternehmen auszufüllen]** = Fakten fehlen, **[anwaltlich prüfen]** = Rechtsfrage nicht abschließend geklärt.

**Stand:** 26.10.2026 · Rolle: Jurist für Informationspflichten · Grundlage: Code-Audit (nur gelesen) von `src/components/Impressum/impressum.js`, `src/components/Datenschutz/datenschutz.js`, `src/components/Reusable/Footer.js`, `src/app/[locale]/layout.js` (JSON-LD), `src/lib/seo/structuredData.js`, `src/messages/de.json`, dazu die Berichte 00, 01, 21, 23, digital/14 und Primärquellen (RIS, Firmenbuch-Auszug evi.gv.at, WKO, EU-Amtsblatt). Quellen am Ende.

---

## 0. Ergebnis in fünf Punkten

1. **Die Hausnummer ist entschieden – vom Firmenbuch.** Laut Ediktsdatei/Firmenbuch (evi.gv.at, FN 443753d) lautet die Geschäftsanschrift der MW Immobilienverwaltungs GmbH **Landstraße 11, 6911 Lochau**. Die Website (Impressum, Datenschutz, Footer, JSON-LD, alle vier Sprachdateien) sagt **Landstraße 9**. Entweder die Website auf 11 umstellen oder – falls 9 die richtige Gebäudeadresse ist – die Geschäftsanschrift im Firmenbuch berichtigen lassen. Bis dahin ist das Impressum in einem Kernpunkt (§ 5 Abs 1 Z 2 ECG, „geografische Anschrift“) widersprüchlich.
2. **Im Impressum fehlen drei Pflichtangaben:** WKO-Mitgliedschaft (Kammer/Fachgruppen), Hinweis auf die Gewerbeordnung mit Zugang (RIS-Link) und die Offenlegung nach § 25 MedienG (Unternehmensgegenstand; empfohlen „große“ Offenlegung mit Gesellschaftern und Blattlinie, weil Ratgeber- und Regionsseiten über reine Eigenwerbung hinausgehen können). Dazu: Firmenbuchgericht als „Landesgericht Feldkirch“ ausschreiben, Werbetexte entfernen.
3. **OS-Plattform:** Seit **20.07.2025** abgeschaltet, die ODR-VO aufgehoben (VO (EU) 2024/3228). **Kein Link** setzen – richtig so. Es bleibt aber **§ 19 AStG** (AT): Hinweis auf eine Schlichtungsstelle nur, wenn man sich zur Teilnahme verpflichtet; bei einem ungelösten Streit muss der Kunde immer schriftlich auf die zuständige AS-Stelle hingewiesen werden. Für DE-Kunden ggf. **§ 36 VSBG** (ab > 10 Beschäftigten). Empfehlung: ein Satz zur Streitbeilegung ins Impressum/AGB.
4. **Rechtsträgerwechsel vorbereiten:** Die geplante Handels-GmbH braucht vor dem ersten Online-Verkauf eigene FN, UID, Gewerbeberechtigung (GISA), WKO-Zuordnung und ein eigenes Impressum. In der Übergangszeit muss klar sein, **wer** Vertragspartner ist (Café/Immobilien = MW GmbH, Möbel/Küchen = neue GmbH). Am einfachsten über eine zentrale Datei `src/lib/legal/company.js` (siehe digital/14, Abschn. 3).
5. **BaFG und DSA hängen an den neuen Funktionen:** Heute (nur Anfragen) ist eine Barrierefreiheits-/Konformitätsinformation nach WKO nicht zwingend, mit Gutschein-Shop, Outlet-Kasse und Online-Terminbuchung **schon** – außer der Rechtsträger ist Kleinstunternehmen. Sobald Kunden Fotos hochladen (KI-Raumplaner) oder Bewertungen öffentlich gezeigt werden, kommen DSA-Kontaktstellen (Art. 11, 12) und ein Meldeweg (Art. 16) dazu.

---

## 1. Ist-Analyse des heutigen Impressums

Quelle: `src/components/Impressum/impressum.js` (wird unter `/de|en|fr|it/impressum` ausgeliefert, nur auf Deutsch), Footer-Link in `src/components/Reusable/Footer.js` Z. 177 – auf jeder Seite erreichbar (gut).

| Pflichtangabe | Rechtsgrundlage | Heute im Impressum | Bewertung |
|---|---|---|---|
| Firma (Firmenwortlaut) | § 5 Abs 1 Z 1 ECG; § 14 Abs 1 UGB | „MW Immobilien­verwaltungs GmbH“ (mit weichem Trennstrich), darüber fett „Platzhirsch Home Living“ | **ok**, aber: Firma muss klar als Anbieter erkennbar sein; „Platzhirsch Home Living“ ist nur Geschäftsbezeichnung. Formulierung „betrieben von“ ergänzen |
| Rechtsform | § 14 Abs 1 UGB | „Gesellschaft mit beschränkter Haftung“ | ok (ergibt sich schon aus „GmbH“) |
| Sitz | § 14 Abs 1 UGB | „Sitz: Landstraße 9, 6911 Lochau“ | **unscharf**: Sitz ist die Gemeinde laut Firmenbuch (Lochau); die Straße gehört zur Anschrift |
| Geografische Anschrift | § 5 Abs 1 Z 2 ECG | Landstraße 9 | **widerspricht Firmenbuch** (Landstraße 11, evi.gv.at) und Google/ClassiCon/Herold (11, Bericht 01/23) |
| Kontakt inkl. E-Mail | § 5 Abs 1 Z 3 ECG | E-Mail + Telefon | ok (WKO: mind. zwei Wege; für Webshops nach FAGG Telefon + E-Mail Pflicht) |
| FN | § 5 Abs 1 Z 4 ECG; § 14 UGB | FN 443753 d | ok (bestätigt durch evi.gv.at) |
| Firmenbuchgericht | dito | „Feldkirch“ | korrekt, besser **„Landesgericht Feldkirch“** |
| UID | § 5 Abs 1 Z 7 ECG | ATU70035339 | ok [vom Unternehmen auszufüllen: Gültigkeit per MIAS/FinanzOnline bestätigen] |
| Aufsichtsbehörde | § 5 Abs 1 Z 5 ECG | „Bezirkshauptmannschaft Bregenz“ | ok (Gewerbebehörde für Lochau; WKO empfiehlt die Angabe immer) |
| Kammer/Berufsverband | § 5 Abs 1 Z 6 ECG | **fehlt** | **Pflicht** für Gewerbetreibende (WKO-Muster: „Mitglied der WKÖ, WK Vorarlberg, Fachgruppe/Gremium …“) |
| Anwendbare Vorschriften + Zugang | § 5 Abs 1 Z 6 ECG | **fehlt** | **Pflicht**: „Gewerbeordnung, abrufbar unter www.ris.bka.gv.at“ |
| Berufsbezeichnung, Verleihungsstaat | § 5 Abs 1 Z 6 ECG | – | nur falls vorhanden (z. B. Meistertitel Tischler, falls ein Tischlergewerbe besteht) [vom Unternehmen auszufüllen] |
| Geschäftsführung | DE-Praxis; MedienG „große“ Offenlegung | Susanne Messmer, Andreas Wegscheider | ok. Firmenbuch schreibt **„Messmer“** (evi.gv.at), Bericht 01 nennt „Meßmer“ (firmenabc) – Schreibweise laut Firmenbuch verwenden |
| Offenlegung § 25 MedienG | § 25 Abs 2–5 MedienG | **fehlt** (Unternehmensgegenstand, ggf. Gesellschafter, Blattlinie) | **Pflicht** für jede Website, auch kleine |
| Streitbeilegung | § 19 AStG; (DE) § 36 VSBG | fehlt | heute nur bedingt Pflicht, Satz empfohlen (Abschn. 4) |
| OS-Link | ehem. Art. 14 ODR-VO | fehlt | **richtig** – Plattform am 20.07.2025 eingestellt |
| Datenschutz | Art. 13 DSGVO | eigene Seite, Footer-Link | ok; aber Verantwortlicher dort ebenfalls „Landstraße 9“ (`datenschutz.js` Z. 106 f.) |
| Werbe-/Füllsätze | – | 4 Absätze Marketingtext | entfernen: verschleiert die Pflichtangaben, kein Nutzen |

**Weitere Fundstellen derselben Daten (müssen identisch werden):**

| Stelle | Datei | Inhalt heute |
|---|---|---|
| JSON-LD `Organization`/`FurnitureStore` | `src/app/[locale]/layout.js` Z. 43–115 | Name „Platzhirsch Home Living“, `streetAddress` „Landstraße 9“; **kein** `legalName`, **kein** `vatID`; `sameAs` Instagram, LinkedIn, Facebook |
| JSON-LD (Seiten-Schema) | `src/lib/seo/structuredData.js` Z. 155 | „Landstraße 9“ |
| Footer-Adresse | `src/messages/{de,en,fr,it}.json` → `Footer.address.line1` | „Landstraße 9“ |
| Kontakt-/Showroom-Texte | `src/messages/*.json` (`address`, `location`) | „Landstraße 9“ bzw. „Landstrasse 9“ |
| Datenschutz (Verantwortlicher) | `src/components/Datenschutz/datenschutz.js` Z. 106 f. | MW Immobilienverwaltungs GmbH, Landstraße 9 |
| Café-Website | https://platzhirsch.cafe/ (im Footer verlinkt) | [vom Unternehmen auszufüllen: Impressum dort mit gleicher Firma/Anschrift abgleichen – nicht geprüft] |
| Google-Unternehmensprofil, Herold, ClassiCon-Händlerliste | extern | Landstraße 11 (Bericht 01/23) |

---

## 2. Rechtslage je Pflicht – kurz und konkret

### 2.1 ECG (§ 5, § 6)
- **§ 5 Abs 1 ECG**: Die Angaben müssen „ständig leicht und unmittelbar zugänglich“ sein. Footer-Link „Impressum“ auf jeder Seite erfüllt das. Achtung beim Consent-Banner: Er darf den Impressums- und Datenschutz-Link nicht verdecken (sonst nicht „unmittelbar zugänglich“) – in `cookiecomponent.js` testen.
- **Kammer und Vorschriften (Z 6)**: Die GmbH ist Gewerbetreibende (Einrichtungshandel, Gastgewerbe, ggf. Immobilienverwaltung) und damit Pflichtmitglied der Wirtschaftskammer. Anzugeben sind alle Fachorganisationen, denen sie wegen ihrer Gewerbe angehört. Welche das sind, steht im **WKO Firmen A-Z** des Unternehmens [vom Unternehmen auszufüllen: Auszug firmen.wko.at bzw. GISA-Auszug aller Gewerbeberechtigungen mit Standort].
- **§ 5 Abs 2 ECG (Preise)**: Werden Preise genannt (Outlet, Gutscheine, „ab“-Preise), müssen sie leicht lesbar und zuordenbar sein, und es muss **eindeutig** erkennbar sein, ob sie USt und sonstige Abgaben enthalten und ob Versandkosten inkludiert sind. Details Abschn. 6.
- **§ 6 ECG (kommerzielle Kommunikation)**: Newsletter, Social-Media-Posts, Ads müssen als Werbung erkennbar sein, den Auftraggeber erkennen lassen; Gewinnspiele und Zugaben (z. B. „Gutschein bei Termin“) mit leicht zugänglichen Teilnahmebedingungen.
- **Herkunftslandprinzip (§ 20 ECG)**: Für die Impressumspflicht gilt österreichisches Recht – auch gegenüber Kunden in DE und FL (EWR). Das deutsche DDG-Impressum ist nicht zusätzlich nötig; inhaltlich deckt das AT-Impressum es ohnehin ab, zumal die Geschäftsführung genannt wird (WKO-Tipp für international tätige Unternehmen).

### 2.2 UGB (§ 14) – auch für E-Mails und Formulare
- Firma, Rechtsform, **Sitz**, FN, Firmenbuchgericht auf Website **und** auf Geschäftsbriefen/E-Mails, Bestellscheinen. Prüfen: automatische E-Mails der Formulare (`src/app/api/kontakt`, `newsletter_subscribe`, Beratung), Angebots-PDFs aus dem Backoffice, E-Mail-Signaturen aller Mitarbeitenden [vom Unternehmen auszufüllen].
- Werden Angaben zum Stammkapital gemacht, müssen auch nicht eingezahlte Einlagen genannt werden → **kein Stammkapital ins Impressum schreiben** (nicht Pflicht).
- Bei Liquidation Zusatz „in Liqu.“ – derzeit nicht relevant.

### 2.3 GewO
- § 63 GewO gilt nur für **nicht** im Firmenbuch eingetragene Gewerbetreibende – hier nicht einschlägig (WKO). Relevant ist die GewO über § 5 Abs 1 Z 6 ECG (Hinweis + Zugang).
- **Gewerbe mit Haftpflichtversicherung (DLG)**: Falls die MW GmbH das reglementierte Gewerbe Immobilientreuhänder (Immobilienverwalter) ausübt, verlangt das Dienstleistungsgesetz Angaben zur Berufshaftpflichtversicherung (Versicherer, räumlicher Geltungsbereich) – das betrifft aber die Immobilienverwaltung, nicht die Einrichtungs-Website. Mit dem Wechsel zur Handels-GmbH entfällt das für platzhirsch.studio. [anwaltlich prüfen, ob die MW GmbH dieses Gewerbe hat]
- **Berufsbezeichnungen**: Begriffe wie „Innenarchitekt“, „Tischler(meister)“, „Küchenplaner“ in Team- oder Leistungstexten nur verwenden, wenn die Befähigung bzw. Berechtigung besteht [vom Unternehmen auszufüllen; anwaltlich prüfen bei „Innenarchitektur“].

### 2.4 MedienG (§ 24 Impressum, § 25 Offenlegung)
- **Website = periodisches elektronisches Medium** → Offenlegung immer (§ 25). „Kleine“ Website (§ 25 Abs 5): nur Name/Firma, Unternehmensgegenstand, Sitz des Medieninhabers.
- **„Große“ Website** (§ 25 Abs 2–4): zusätzlich vertretungsbefugte Organe, alle direkten/indirekten Gesellschafter mit Anteilen (inkl. Treuhand, stille Beteiligungen) und die **Blattlinie**. WKO: Grenzfall ist schon ein Hotel, das auf Sehenswürdigkeiten hinweist.
- **Einschätzung Platzhirsch:** Geplant bzw. im Bau sind Ratgeber (Schweiz-Zoll, Material), Regionsseiten (`designermoebel-*`), News, Zukunfts-/Trendinhalte. Das kann über die reine Eigenpräsentation hinausgehen. **Empfehlung: „große“ Offenlegung**. Aufwand gering, die Angaben stehen ohnehin im Firmenbuch. [anwaltlich prüfen]
- **Newsletter** (≥ 4×/Jahr = wiederkehrendes elektronisches Medium): in **jeder Ausgabe** Name/Firma und Anschrift von Medieninhaber und Herausgeber (§ 24 Abs 3) plus Link zur Offenlegung. Gehört in die Fußzeile der Newsletter-Vorlage (Frappe-Backend) [vom Unternehmen auszufüllen].
- **Social-Media-Profile**: WKO: Die Pflichten gelten „für jede Form von elektronischen Inhalten und daher auch in sozialen Medien“. Siehe Abschn. 7.

### 2.5 DSA (VO (EU) 2022/2065)
- Eine Unternehmenswebsite ohne nutzergenerierte Inhalte ist **kein Vermittlungsdienst** → DSA heute nicht einschlägig.
- **Wird es mit:** (a) öffentlich angezeigten Kundenbewertungen auf der eigenen Website, (b) Kommentar-/Galerie-Funktionen, (c) gespeicherten Kundenfotos im **KI-Raumplaner** (Speicherung von Informationen im Auftrag des Nutzers = Hostingdienst, Art. 3 lit. g iii) [anwaltlich prüfen, ob eine bloß kurzfristige Verarbeitung zur Bildberechnung schon „Hosting“ ist].
- Dann für **alle** Hostingdienste, auch Kleinstunternehmen: **Art. 11** (Kontaktstelle für Behörden, Sprachen), **Art. 12** (Kontaktstelle für Nutzer, nicht nur automatisiert), **Art. 14** (Inhaltsregeln in den Nutzungsbedingungen), **Art. 16** (Melde- und Abhilfeverfahren), **Art. 17** (Begründung bei Löschung). Die Plattformpflichten (Art. 19 ff.) entfallen für Klein- und Kleinstunternehmen.
- **Bauvorgabe:** Im Impressum einen vorbereiteten, zunächst auskommentierten Block „Kontaktstelle nach Art. 11 und 12 DSA“ vorsehen; bei Launch von Upload/Bewertungen aktivieren.

### 2.6 Online-Streitbeilegung und Schlichtung (aktueller Stand)
- **ODR-Verordnung (EU) 524/2013 aufgehoben**, OS-Plattform seit **20.07.2025** abgeschaltet (VO (EU) 2024/3228). WKO-Merkblatt (Stand 08/2025): Hinweis und Link „sollten von den Webseiten entfernt werden“; IHK: verbleibende Links können abgemahnt werden. → **Kein OS-Link** – auch nicht in künftigen AGB, Bestell-E-Mails, Marktplatz-Profilen.
- **ADR-Richtlinie geändert** durch RL (EU) 2025/2647 (ABl. 30.12.2025, in Kraft 19.01.2026, Umsetzung bis 2028; u. a. Antwortpflicht des Unternehmers binnen 20 Arbeitstagen). Österreich hat noch nicht umgesetzt; **§ 19 AStG gilt unverändert** (letzte Änderung BGBl. I 32/2018):
  - Abs 1–2: Hinweis auf AS-Stelle mit Website-Adresse auf der Website/AGB **nur**, wenn sich das Unternehmen zur Teilnahme verpflichtet hat oder verpflichtet ist.
  - Abs 3: **Immer**: Kommt es zu keiner Einigung, muss der Kunde auf Papier/dauerhaftem Datenträger auf die zuständige AS-Stelle hingewiesen werden, mit der Angabe, ob man teilnimmt. → Textbaustein für die Reklamationsabwicklung (nicht fürs Impressum).
- **DE (§ 36 VSBG)**: Informationspflicht (bereit/nicht bereit/verpflichtet) für Unternehmer mit Website oder AGB, ausgenommen ≤ 10 Beschäftigte am 31.12. des Vorjahres. Ob ein AT-Unternehmer gegenüber DE-Verbrauchern erfasst ist, ist strittig [anwaltlich prüfen]; die MW GmbH (inkl. Café) könnte über 10 liegen [vom Unternehmen auszufüllen: Beschäftigte 31.12.2025]. Eine freiwillige, klare Aussage schadet nicht.
- **Empfehlung (Entscheidung Inhaber):** Teilnahme an der **Schlichtung für Verbrauchergeschäfte** bzw. dem **Internet Ombudsrat** (AT) anbieten – ein Vertrauenssignal, das kein Wettbewerber zeigt. Alternative: neutral „nicht verpflichtet und nicht bereit“. [vom Unternehmen auszufüllen]

---

## 3. Barrierefreiheit (BaFG) – was ins Impressum/Footer gehört

- **Anwendungsbereich:** BaFG seit 28.06.2025 für Dienstleistungen im elektronischen Geschäftsverkehr an Verbraucher. WKO-FAQ: Website **ohne** Shop, Bestellung oder Buchung → BaFG gilt nicht; **Kontaktformular strittig** (strenge Ansicht: erfasst). Tipp der WKO: mindestens das Formular barrierefrei machen.
- **Kippt mit:** Gutschein-Shop, Outlet-Kasse, **Online-Terminbuchung** (Buchung einer Dienstleistung), Video-Beratung mit Buchung.
- **Kleinstunternehmen-Ausnahme:** < 10 Beschäftigte (Jahresarbeitseinheiten, Lehrlinge zählen nicht) **und** Jahresumsatz **oder** Bilanzsumme ≤ 2 Mio. €. Maßgeblich ist das **Unternehmen**, nicht der Shop → die MW GmbH (Café + Immobilien + Handel) liegt vermutlich darüber; eine neue Handels-GmbH mit ~5 Personen könnte darunter fallen, Umsatz aber sehr wahrscheinlich > 2 Mio. € [Schätzung: Bericht 00 nennt 80–200 T€/Monat → ~1–2,4 Mio. €/Jahr; Bilanzsumme der neuen GmbH unbekannt]. [vom Unternehmen auszufüllen: VZÄ-Rechnung, Umsatz, Bilanzsumme]
- **Pflichtinhalt, wenn erfasst:** Information über die Konformität nach **§ 14 Abs 2 BaFG iVm Anlage 3** (in AGB oder auf andere deutlich wahrnehmbare Weise, barrierefrei, schriftlich und mündlich verfügbar, solange die Dienstleistung angeboten wird). Inhalt: Beschreibung der Dienstleistung, Erfüllung der Anforderungen (Norm: EN 301 549 ≈ WCAG 2.1 AA; empfohlen WCAG 2.2 AA), nicht erfüllte Teile mit Begründung (unverhältnismäßige Belastung dokumentieren, alle 5 Jahre neu bewerten), Kontakt für Barrieren, Hinweis auf die Marktüberwachung (**Sozialministeriumservice**). Nichtkonformität ist dem Sozialministeriumservice zu melden (§ 14 Abs 4 BaFG).
- **Bauvorgabe:** Eigene Seite `/barrierefreiheit`, Footer-Link neben Impressum/Datenschutz. Ein freiwilliger Hinweis schon heute („Wir arbeiten nach WCAG 2.2 AA; Barriere melden: …“) ist rechtlich unschädlich, solange er nicht mehr behauptet, als getestet ist (UWG).

---

## 4. Die neue Handels-GmbH – was vor dem ersten Tag feststehen muss

| Punkt | Inhalt | Wer |
|---|---|---|
| Firmenwortlaut | z. B. „Platzhirsch Home Living GmbH“ – Unterscheidungskraft/Verwechslung (§ 18, § 29 UGB) und Markenrecherche („Platzhirsch“ ist häufig) | Notar/Anwalt, Firmenbuch-Vorabprüfung |
| FN, Firmenbuchgericht | nach Eintragung (Landesgericht Feldkirch) | Notar |
| Sitz + Geschäftsanschrift | **gleiche, endgültige Hausnummer** wie Website und Google-Profil | Inhaber |
| UID | Antrag beim Finanzamt nach Gründung | Steuerberater |
| Gewerbeberechtigung | Handelsgewerbe (freies Gewerbe) am Standort Lochau; Montage-/Tischlerleistungen und Raumplanung nur im Rahmen der Nebenrechte (§ 32 GewO) oder mit eigener Berechtigung; gewerberechtlicher Geschäftsführer bei reglementierten Gewerben [anwaltlich prüfen] | Gewerbebehörde BH Bregenz, WKO Gründerservice |
| Kammer | WKO Vorarlberg, Sparte Handel, zuständiges Landesgremium [vom Unternehmen auszufüllen nach Zuordnung] | WKO |
| Medieninhaber | neue GmbH, sobald sie die Website-Inhalte verantwortet; Domain-Inhaberschaft `platzhirsch.studio` umschreiben [vom Unternehmen auszufüllen: wer ist heute Domaininhaber?] | Inhaber |
| Datenschutz | neue GmbH = Verantwortliche; bei gemeinsamer Kundendatenbank mit MW GmbH: Art. 26 DSGVO (gemeinsam Verantwortliche) oder Auftragsverarbeitung; Übertragung des Kundenstamms nur mit Rechtsgrundlage [anwaltlich prüfen] | Anwalt |
| Übergangszeit | Impressum nennt den **Website-Betreiber**; zusätzlich Satz „Vertragspartner für Möbel, Küchen, Gutscheine und Online-Bestellungen ist ab [Datum] die … GmbH. Das Platzhirsch Café wird von der MW Immobilienverwaltungs GmbH betrieben.“ | Inhaber |
| Altgutscheine/Altaufträge | Wer schuldet bereits verkaufte Gutscheine (30 Jahre gültig, § 1478 ABGB) und laufende Aufträge? Schuldübernahme vertraglich regeln, Kunden informieren | Anwalt (Gläubigerschutz, Bericht 21) |
| Alle Stellen gleichzeitig | Impressum, Datenschutz, AGB, JSON-LD (`legalName`, `vatID`), Footer, Formular-E-Mails, E-Mail-Signaturen, Angebots-/Rechnungsvorlagen, Google-Profil, Social-Media-Profile, Newsletter-Fußzeile, Zahlungsanbieter-Konto, Merchant Center | Agentur/Bau-Agenten über `src/lib/legal/company.js` |

---

## 5. Entwurf: neues Impressum

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.**
> Variante A gilt bis zur Ausgliederung (heutiger Rechtsträger). Variante B ist die Vorlage für die Handels-GmbH. Alle Angaben aus einer zentralen Datei rendern; die Seite in DE ausführlich, in EN/FR/IT mit übersetzten Überschriften (Inhalt identisch).

### Variante A – MW Immobilienverwaltungs GmbH (heute)

---

**Impressum**

Informationen nach § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB) und Offenlegung nach § 25 Mediengesetz (MedienG)

**Anbieter und Medieninhaber**
MW Immobilienverwaltungs GmbH
Geschäftsbezeichnung: Platzhirsch Home Living
Landstraße [11 – vom Unternehmen zu bestätigen, siehe Abschn. 1], 6911 Lochau, Österreich

**Kontakt**
Telefon: +43 5574 46255
E-Mail: info@platzhirsch.studio

**Unternehmensdaten**
Rechtsform: Gesellschaft mit beschränkter Haftung
Sitz: Lochau
Firmenbuchnummer: FN 443753 d
Firmenbuchgericht: Landesgericht Feldkirch
UID-Nummer: ATU70035339
Geschäftsführung: Susanne Messmer, Andreas Wegscheider (jeweils selbständig vertretungsbefugt) [vom Unternehmen auszufüllen: Vertretungsregel laut Firmenbuch bestätigen]

**Unternehmensgegenstand**
Handel mit Möbeln, Küchen, Leuchten und Wohnaccessoires, Einrichtungsplanung; Betrieb eines Cafés; Immobilienverwaltung [vom Unternehmen auszufüllen: laut GISA/Gesellschaftsvertrag]

**Gewerberecht und Aufsicht**
Gewerbeberechtigungen: [vom Unternehmen auszufüllen: z. B. Handelsgewerbe; Gastgewerbe in der Betriebsart …; ggf. Immobilientreuhänder (Immobilienverwalter)], Standort 6911 Lochau
Mitglied der Wirtschaftskammer Vorarlberg, [vom Unternehmen auszufüllen: Sparte Handel – Landesgremium …; Sparte Tourismus und Freizeitwirtschaft – Fachgruppe Gastronomie; ggf. Sparte Information und Consulting – Fachgruppe Immobilien- und Vermögenstreuhänder]
Anwendbare Rechtsvorschriften: Gewerbeordnung 1994, abrufbar unter www.ris.bka.gv.at
Gewerbebehörde/Aufsichtsbehörde: Bezirkshauptmannschaft Bregenz
[Nur falls zutreffend: Berufsbezeichnung … , verliehen in Österreich]

**Offenlegung nach § 25 MedienG**
Medieninhaber: MW Immobilienverwaltungs GmbH, Sitz Lochau (Angaben siehe oben)
Gesellschafter: Susanne Messmer (50 %), Andreas Wegscheider (50 %) [vom Unternehmen auszufüllen: Anteile laut Firmenbuch bestätigen; Treuhandverhältnisse/stille Beteiligungen: keine bzw. …]
Grundlegende Richtung (Blattlinie): Information über die Produkte, Marken, Planungs- und Serviceleistungen von Platzhirsch Home Living sowie Einrichtungs- und Kaufratgeber für Kundinnen und Kunden in Österreich, Deutschland, der Schweiz und Liechtenstein.

**Geltungsbereich**
Dieses Impressum gilt für platzhirsch.studio sowie für unsere Profile auf Instagram (@platzhirsch.studio), Facebook (/platzhirsch.studio) und LinkedIn (platzhirsch-studio) und für unseren Newsletter. [vom Unternehmen auszufüllen: weitere Profile, z. B. Pinterest, YouTube, WhatsApp Business]

**Streitbeilegung**
[Option 1 – empfohlen] Wir sind bereit, an Verfahren zur alternativen Streitbeilegung vor der [Schlichtung für Verbrauchergeschäfte, www.verbraucherschlichtung.at / Internet Ombudsstelle, www.ombudsstelle.at] teilzunehmen. [anwaltlich prüfen, Stelle wählen]
[Option 2] Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

**Preisangaben**
[Erst aktivieren, wenn Preise online stehen] Alle Preise in Euro inklusive der gesetzlichen Umsatzsteuer. Liefer- und Montagekosten sind nicht enthalten, sofern nicht ausdrücklich angegeben; sie werden vor Vertragsabschluss genannt. Für Kundinnen und Kunden in der Schweiz und in Liechtenstein siehe [Seite Schweiz/Liechtenstein].

**Markenhinweis**
Die genannten Marken- und Produktnamen sind Marken ihrer jeweiligen Inhaber. Ihre Nennung beschreibt Produkte, die in unserer Ausstellung gezeigt oder über uns bezogen werden können. Sie bedeutet keine Partnerschaft oder Vertragshändlerschaft, soweit diese nicht ausdrücklich angegeben ist. [anwaltlich prüfen; ClassiCon als belegter Händlereintrag darf genannt werden]

**Bildnachweise**
[vom Unternehmen auszufüllen aus dem Bildregister: Fotografen, Herstellerfreigaben, Stockbilder]

[Vorbereitet, inaktiv bis Launch KI-Raumplaner/Bewertungen] **Kontaktstelle nach Art. 11 und 12 DSA:** dsa@platzhirsch.studio (Deutsch, Englisch) – [vom Unternehmen auszufüllen]

---

### Variante B – Handels-GmbH (nach Ausgliederung)

Wie Variante A, mit diesen Änderungen:

- Anbieter und Medieninhaber: **[Firmenwortlaut, z. B. Platzhirsch Home Living GmbH]**, Landstraße [9/11], 6911 Lochau
- FN [vom Unternehmen auszufüllen], Landesgericht Feldkirch; UID [vom Unternehmen auszufüllen]
- Geschäftsführung, Gesellschafter mit Anteilen [vom Unternehmen auszufüllen; bei Gesellschafter-GmbHs deren Gesellschafter ebenfalls nennen, § 25 Abs 2 MedienG]
- Unternehmensgegenstand: Handel mit Möbeln, Küchen, Leuchten, Outdoor-Möbeln und Wohnaccessoires; Einrichtungsplanung; Lieferung und Montage
- Gewerbe: Handelsgewerbe [ggf. weitere], WKO Vorarlberg, Sparte Handel, [Landesgremium]
- **Neuer Absatz „Verbundene Angebote“:** „Das Platzhirsch Café (platzhirsch.cafe) wird von der MW Immobilienverwaltungs GmbH, Landstraße [9/11], 6911 Lochau, FN 443753 d, betrieben.“
- Barrierefreiheit: Link auf `/barrierefreiheit` (Konformitätsinformation nach § 14 BaFG), sofern keine Kleinstunternehmen-Ausnahme
- Shop-Sprachen: Impressum, AGB, Widerrufsbelehrung in allen Sprachen, in denen verkauft wird (FAGG § 4)

### Technische Umsetzung (Hinweis an die Bau-Agenten, kein Code geändert)
- Neue Datei `src/lib/legal/company.js` als einzige Quelle; `impressum.js`, `datenschutz.js`, `Footer.js`, `layout.js` (JSON-LD: `legalName`, `vatID`, `address`), `structuredData.js`, `messages/*.json` (`Footer.address`) lesen daraus.
- JSON-LD ergänzen: `"legalName": "MW Immobilienverwaltungs GmbH"`, `"vatID": "ATU70035339"`, `streetAddress` identisch mit Impressum. Google gleicht NAP-Daten ab; Abweichungen kosten Local-SEO (Bericht 25).
- Impressum per HTML-Text (kein Bild, kein PDF), semantische Überschriften, `<address>`-Element, Telefon/E-Mail als Links – barrierefrei und maschinenlesbar.

---

## 6. Preisangaben (für Outlet, Gutscheine, „ab“-Preise, CHF)

| Regel | Norm | Konkret für Platzhirsch |
|---|---|---|
| Bruttopreis klar, Versand/Lieferung erkennbar | § 5 Abs 2 ECG; § 9 PrAG; § 4 Abs 1 Z 4 FAGG | „1.290 € inkl. 20 % USt, zzgl. Lieferung (Lochau–Bregenz pauschal … €, sonst nach Angebot)“ |
| Streichpreise | § 9a PrAG (niedrigster Preis der letzten 30 Tage) | Outlet: nicht „statt“, sondern „UVP des Herstellers für Neuware“ mit Datum, wenn nie zum Normalpreis angeboten |
| „ab“-Preise | § 2 UWG (Irreführung) | nur für eine real bestellbare Ausführung, diese benennen |
| „Preis auf Anfrage“ | zulässig | dann kein `Offer` im Schema |
| DE-Kunden | PAngV (Gesamtpreis, Grundpreis bei Mengenware) | Anwendbarkeit neben AT-Recht bei Ausrichtung auf DE [anwaltlich prüfen]; inhaltlich deckungsgleich umsetzen |
| CH-Kunden | PBV (Preise in CHF inkl. MWST, öffentliche Abgaben); Art. 3 Abs 1 lit. s UWG CH (Identität, Kontakt im E-Commerce) | CHF-Rechner nur als „unverbindliche Kostenschätzung“; verbindlich ist die Offerte; Erfassung eines AT-Anbieters durch die PBV [anwaltlich prüfen, CH-Kanzlei] |

Ausführlich: digital/14, F4–F7.

---

## 7. Social-Media-Profile, Newsletter, E-Mail, Marktplätze

| Kanal | Pflicht | Umsetzung |
|---|---|---|
| Instagram @platzhirsch.studio | ECG/MedienG gelten auch in sozialen Medien (WKO); Erreichbarkeit „leicht und unmittelbar“ – in DE als Maßstab: zwei Klicks genügen (BGH I ZR 228/03 *Anbieterkennzeichnung im Internet*, 20.07.2006) | Bio: „Impressum & Datenschutz: platzhirsch.studio/de/impressum“ bzw. Link-Liste mit Eintrag „Impressum“. Kein reiner Linktree ohne Impressums-Eintrag |
| Facebook /platzhirsch.studio | dito | Feld „Impressum“ in den Seiteninfos mit vollständigen Angaben oder Link |
| LinkedIn platzhirsch-studio | dito | Im Info-Text „Impressum: …“-Link |
| Google-Unternehmensprofil | kein eigenes Medium, aber NAP-Konsistenz und UWG | Name „Platzhirsch Home Living“, Adresse = Impressum, Website-Link |
| WhatsApp Business (geplant) | ECG § 5 | Profilbeschreibung mit Firma, Adresse, Link zum Impressum |
| YouTube/Pinterest (falls geplant) | dito | „Info“-Bereich mit Link |
| Newsletter | § 24 Abs 3 MedienG; § 6 ECG; § 174 TKG 2021 | Fußzeile: Firma, Anschrift, Link Offenlegung/Impressum, Abmeldelink, Werbung erkennbar |
| E-Mails (Formular-Auto-Mails, Signaturen, Angebote) | § 14 UGB | Firma, Rechtsform, Sitz, FN, Firmenbuchgericht in jeder Signatur/Vorlage |
| Influencer/Kooperationen | § 6 ECG; § 26 MedienG (Kennzeichnung entgeltlicher Veröffentlichungen) | „Werbung“/„Anzeige“ bei bezahlten oder mit Gratisware abgegoltenen Posts – auch auf den eigenen Kanälen bei Herstellerkooperationen |

---

## 8. Was der Inhaber entscheiden oder liefern muss

| # | Entscheidung/Lieferung | Warum | Frist |
|---|---|---|---|
| 1 | **Hausnummer** 9 oder 11 – amtliche Adresse bei der Gemeinde Lochau bestätigen; danach Firmenbuch oder Website angleichen | § 5 Abs 1 Z 2 ECG, Local SEO | sofort |
| 2 | **GISA-Auszug** aller Gewerbeberechtigungen und **WKO-Firmen-A-Z-Auszug** (Fachgruppen) | § 5 Abs 1 Z 6 ECG | sofort |
| 3 | Gesellschafter und Anteile bestätigen, Treuhand/stille Beteiligungen ja/nein | § 25 Abs 2 MedienG | sofort |
| 4 | Streitbeilegung: Teilnahme an Schlichtung ja/nein; Beschäftigtenzahl 31.12.2025 | § 19 AStG, § 36 VSBG | vor Shop |
| 5 | Wer ist Domaininhaber und Betreiber der Social-Media-Konten? | Medieninhaber, Rechtsträgerwechsel | vor Ausgliederung |
| 6 | Firmenwortlaut, Starttermin und Aufgabenteilung der Handels-GmbH; Regelung für Altgutscheine/Altaufträge | Impressum B, Gläubigerschutz | mit Gründung |
| 7 | VZÄ/Umsatz/Bilanzsumme des künftigen Shop-Betreibers (Kleinstunternehmen BaFG) | § 14 BaFG | vor Gutschein-Shop/Terminbuchung |
| 8 | Liste aller Profile/Kanäle und Zugriff zum Einfügen der Impressums-Links | ECG/MedienG | 2 Wochen |
| 9 | Freigabe des Impressum-Entwurfs durch Rechtsanwältin/Rechtsanwalt | – | vor Veröffentlichung |

---

## 9. „Auf keinen Fall“

- Keinen OS-Plattform-Link wieder einbauen (Vorlagen aus Generatoren enthalten ihn oft noch).
- Nicht „Minotti-Händler“, „offizieller Partner“ oder Markenlogos als Siegel im Impressum oder in Profil-Bios.
- Kein Impressum als Bild oder PDF; nicht hinter Consent-Banner oder Login.
- Keine zwei verschiedenen Adressen auf Website, Google und Firmenbuch.
- Kein Stammkapital nennen (löst Zusatzpflicht aus).
- Nach der Ausgliederung nicht weiter die MW GmbH als Anbieter führen, wenn die neue GmbH verkauft – sonst falscher Vertragspartner, Haftungs- und UWG-Risiko.

---

## Quellen (abgerufen 26.10.2026)

- § 5, § 6 ECG – RIS: https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703
- §§ 24, 25 MedienG – RIS: https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10000719
- § 19 AStG – RIS: https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20009242
- Firmenbuch-Daten MW Immobilienverwaltungs GmbH (Geschäftsanschrift Landstraße 11, GF seit 16.12.2015, JAb 18.09.2026): https://www.evi.gv.at/f/443753d
- WKO: „Das korrekte Website-Impressum“, Stand August 2025 (Pflichtangaben, Musterimpressum GmbH, kleine/große Website, Social Media, Aufhebung ODR-VO): https://www.wko.at/sbg/wirtschaftsrecht-gewerberecht/das-korrekte-website-impressum.pdf
- WKO: Barrierefreiheitsgesetz im E-Commerce – FAQ: https://www.wko.at/internetrecht/barrierefreiheitsgesetz-im-e-commerce-faq
- § 14 BaFG – jusline: https://www.jusline.at/gesetz/bafg/paragraf/14.pdf ; Regierungsvorlage mit Anlage 3: https://www.parlament.gv.at/dokument/XXVII/ME/225/fname_1469270.pdf
- USP: Offenlegungspflicht § 25 MedienG: https://www.usp.gv.at/brancheninformationen/information-und-kommunikation/offenlegungspflicht-gemaess-para-25-mediengesetz.html
- IHK Bayreuth: Anpassung des Impressums nach Abschaltung der OS-Plattform: https://www.ihk.de/bayreuth/hauptnavigation/service/recht/allgemeine-rechtsthemen/anpassung-des-internet-impressums-erforderlich--6512524
- RL (EU) 2025/2647 (Änderung ADR-RL): https://umwelt-online.de/recht/eu/25d/25d_2647.htm ; Otto Schmidt ZKM-Report: https://www.otto-schmidt.de/blog/zkm-report/eu-verabschiedet-uberarbeitete-richtlinie-zur-alternativen-streitbeilegung-ZKMR0001800.html
- VO (EU) 2022/2065 (DSA), Art. 3, 11, 12, 14, 16, 17, 19 [aus Normtext, nicht neu abgerufen]
- BGH, Urt. v. 20.07.2006, I ZR 228/03 – Anbieterkennzeichnung im Internet [aus Fachwissen]
- Interne Berichte: 00, 01 (Abschn. 1), 21 (Teil B/C), 23 (Abschn. 2), digital/14 (R7–R9, R14, F1, F4, F10)
