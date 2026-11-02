# Wachstumsrat: AGB, Verbraucherrecht, Fernabsatz, B2B-Verträge, Cookies (Kürzel `agb-verbraucher`)

**Gremium:** Juristinnen und Juristen für AGB-Recht, Konsumentenschutz und Fernabsatz (AT/DE/CH/FL), Werkvertrags- und Baurecht, B2B- und Contract-Verträge, TKG und Cookies · **Stand:** 28.10.2026 · **Status:** Gutachten. Am Code wurde nichts geändert, kein Formular wurde abgeschickt.

> **Keine Rechtsberatung.** Dieses Gutachten ist eine Vorprüfung, die das Mandat für eine in Österreich zugelassene Kanzlei vorbereitet. Normzitate, die nicht mit einer Quelle unten belegt sind, stammen aus eigener Kenntnis und sind vor Verwendung im RIS, auf gesetze-im-internet.de oder fedlex zu prüfen. **[anwaltlich prüfen]** = Rechtslage offen oder Formulierung riskant, **[Inhaber]** = Fakt oder Entscheidung des Inhabers, **[Schätzung]** = eigene Herleitung ohne Beleg.

**Geprüft (nur gelesen):** `Marktresearch/recht/00` bis `06` und `anwalt-vorschau.md`, `digital/wachstumsrat/hotel-contract.md` (Zahlungsmodell 3.6), dazu im Code: Cookie-Banner `src/components/Cookies/*`, `src/lib/legal/services.js`, `src/lib/attribution.js`, `src/messages/de.json` (Namespace `Cookies`), Gutschein- und Atelier-Logik `src/lib/commerce/*`, `src/components/Atelier/*`, Outdoor-Seite `src/app/[locale]/outdoor-gartenplanung/page.js`, Kundenportal `src/app/[locale]/portal/gewerke/page.js`, `src/components/Portal/Planung/PlanungWorkspace.js`, Küchenplaner `src/components/Labs/Kuechenplaner/ResultPanel.js`, Dreiländer-Rechner `src/components/Labs/Dreilaender/PriceCalculator.js`.

**Regeln für alle Textvorschläge:** Händler-Aussagen nur für **ClassiCon** und **Ezarri**. Kein Superlativ. Keine erfundenen Zahlen.

---

## 1. Urteil zum Ist-Stand

| Bereich | Note (1–10) | Begründung |
|---|---|---|
| AGB-Entwurf Verbraucher (`recht/01` Teil I) | **7** | Fachlich stark: VGG-Novelle 2026, EuGH *Möbel Kraft*, Rom-I-Hinweis, Naturmaterial-Bestätigungsblatt und Zahlungsplan mit 10 % Schlussrate sind richtig gesetzt. Abzüge gibt es für eine zu breite Definition der Maßanfertigung, fehlende Regeln für Baustoffe und Pool-Mosaik (Ezarri), fehlende Kostenvoranschlags-Regel und eine falsche Garantie-Fundstelle. Außerdem fehlt noch die Übergangsfassung für die MW GmbH. |
| AGB Teil II B2B (`recht/01` §§ 20–29) | **5** | Als Lieferbedingungen für Firmenkunden brauchbar. Für Hotel- und Contract-Projekte reicht es nicht. Es fehlen Sicherheiten nach § 1170b ABGB, Nachträge und Änderungen, Mock-up und Bemusterung, Nachkauf und Ersatzteile, die Abgrenzung zu koordinierten Gewerken und eine Antwort auf die Frage, die jedes Hotel wegen des negativen Eigenkapitals stellen wird: „Was passiert mit meiner Anzahlung?“ |
| Werkvertrag Planung und Montage | **4** | Es gibt Bausteine (AGB § 2.3, § 9, Montage-Term-Sheet `recht/05` D), aber keinen eigenen Planungsvertrag. Ungeregelt sind Warnpflicht, Kostenvoranschlag (§ 5 KSchG, § 1170a ABGB) und die Nutzungsrechte am Plan (nur ein Satz). |
| Haftung bei koordinierten Gewerken | **4** | Die Outdoor-Seite ist vorbildlich klar („Sie beauftragen jeden Fachbetrieb direkt“). Das **Kundenportal widerspricht dem** („Alles aus einer Hand“, „Sie müssen den Betrieb nicht selbst kontaktieren“). Eine Koordinationsvereinbarung gibt es nicht. Das Hotel-Gutachten plant ein Koordinationshonorar „ohne Haftung“ plus Provision. Beides ist so nicht haltbar (Abschnitt 2.4). |
| Fernabsatz und Widerruf | **6** | Die Weichen sind richtig gestellt: Gutschein per Anfrage ist Fernabsatz, der Shop ist bis zur Kanzleifreigabe technisch gesperrt (`mode.js`), die Portal-Freigabe ist ausdrücklich „kein Vertrag“. Es fehlen weiterhin die Widerrufsbelehrung, das Musterformular und die Seite „Vertrag widerrufen“. Eine Einschränkung im Gutscheintext ist riskant (M-07). |
| Cookie-Banner (TKG § 165 Abs 3) | **7** | Die Technik ist sehr gut: Consent Mode default „denied“, kein Google-Request ohne Einwilligung, gleichwertige Buttons, Widerruf im Footer, Attribution ohne Einwilligung nur im Arbeitsspeicher. **Die Texte sind noch die alten Vorlagentexte** und widersprechen der Technik (C1, C2, C5 aus `recht/02` sind nicht umgesetzt). |
| Preisangaben (PrAG AT, PAngV DE, PBV CH) | **7** | Auf der Website stehen kaum Preise. Wo welche stehen (Atelier, Küchenplaner), sind sie korrekt gekennzeichnet: brutto, kein Streichpreis, „unverbindlicher Rahmen“. Offen ist die Schweizer PBV (Detailpreis in CHF), sobald CH-Kunden online Preise sehen. |
| **Gesamt** | **6** | Das Fundament ist für einen Händler dieser Größe überdurchschnittlich. Bis Hotels und Gesamtprojekte Umsatz bringen, fehlen drei Dokumente: **Contract-Rahmenvertrag**, **Planungs- und Koordinationsvertrag**, **Widerrufspaket**. |

---

## 2. Befunde und Chancen

### 2.1 Der größte Hebel: Vertrauen in die Anzahlung ohne Bankgarantie

Hotels und größere Bauherren prüfen ihre Lieferanten (KSV1870, Creditreform, Firmenbuch). Das negative Eigenkapital (−2,67 Mio. €, `recht/00` 0.1) fällt dabei sofort auf. Eine Anzahlungsgarantie der Bank wird Platzhirsch in dieser Lage voraussichtlich nicht oder nur gegen Barhinterlegung bekommen [Schätzung]. Ohne Antwort auf diese Frage scheitern Contract-Aufträge, **bevor über Design gesprochen wird**.

Folgende Instrumente kosten kaum Kapital. Sie sind im Rahmenvertrag (Abschnitt 3.2, § 7) als Wahlmodule angelegt:

| Modul | Wie es funktioniert | Kapitalbedarf | Grenze |
|---|---|---|---|
| **A. Direktzahlung an den Hersteller** | Das Hotel zahlt die Hersteller-Anzahlung direkt an den Hersteller („Zahlung auf fremde Schuld“, Anweisung). Platzhirsch stellt nur die eigene Marge und Leistung in Rechnung. | null | Der Hersteller muss mitmachen. Die Marge wird für den Kunden sichtbar. |
| **B. Treuhandkonto** | Die Anzahlung fließt auf ein Anderkonto (Rechtsanwalt oder Notar). Freigabe an Platzhirsch erst gegen Nachweis der Herstellerbestellung bzw. Versandbereitschaft. | Treuhandgebühr, ca. 0,2–0,5 % [Schätzung] | Verzögert die Liquidität um wenige Tage. |
| **C. Eigentum Zug um Zug** | Mit Zahlung der zweiten Rate wird das Hotel Eigentümer der gefertigten und gekennzeichneten Ware beim Hersteller oder im Lager (Besitzkonstitut, Kennzeichnung je Stück). | null | Sachenrechtlich heikel: Publizität, Lager beim Dritten [anwaltlich prüfen]. |
| **D. Sicherungsabtretung der Lieferansprüche** | Platzhirsch tritt seine Liefer- und Gewährleistungsansprüche gegen den Hersteller **aufschiebend bedingt** für den Insolvenzfall an das Hotel ab. | null | Abtretungsverbote in Herstellerverträgen beachten [anwaltlich prüfen]. |
| **E. Vendor-Leasing** | Die Leasinggesellschaft zahlt bei Lieferung (Hotel-Gutachten 3.6). | null | Händlerrahmenvertrag nötig, Bonität des Hotels. |

**Wirkung:** Mit A oder B lässt sich ein Satz sagen, der wahr ist und Hotels überzeugt: „Ihre Anzahlung geht nicht in unser Unternehmen, bevor Ihre Ware bestellt ist.“ Das Wort „abgesichert“ wird nur verwendet, wenn Modul B tatsächlich vereinbart ist (§ 2 UWG, `recht/01` § 5.2).

**Wichtig:** Das ersetzt nicht die Vorfrage aus `recht/00` 0.1: Ob Platzhirsch vor der Fortbestehensprognose überhaupt Kundengeld annehmen darf, muss der Insolvenzrechtler klären. Modul B entschärft genau dieses Risiko, deshalb gehört es in dieses Gespräch.

### 2.2 Baurechtliche Sicherstellung nach § 1170b ABGB: das Gegenstück zur Anzahlung

Wer für ein Unternehmen einen **Teil eines Bauwerks** herstellt (Einbauten, Küchen, Wandverkleidungen, Mosaik mit Verlegung), kann vom Besteller ab Vertragsschluss eine **Sicherstellung von bis zu einem Fünftel des Entgelts verlangen, bei Verträgen mit bis zu drei Monaten Laufzeit bis zu zwei Fünftel**. Das Recht ist **unverzichtbar**. Leistet der Besteller die Sicherheit nicht, darf der Unternehmer die Leistung verweigern und nach Nachfrist zurücktreten. Nicht erfasst sind Verbraucher, juristische Personen des öffentlichen Rechts und **bloße Lieferungen** loser Möbel ([RIS § 1170b](https://www.ris.bka.gv.at/eli/jgs/1811/946/P1170b/NOR40070129), [Jusline-Kommentar](https://www.jusline.at/gesetzeskommentare/456478689)). Für DE gilt sinngemäß § 650f BGB (Bauhandwerkersicherung) [prüfen].

**Chance:** Bei Hotelprojekten mit Einbauten muss Platzhirsch nicht um Sicherheiten bitten. Das Gesetz gibt sie ihm. In den Rahmenvertrag gehört deshalb eine Klausel, die auf § 1170b verweist (Abschnitt 3.2, § 7.4). Ob Planungsleistungen vor Baubeginn schon gesichert werden können, ist strittig [anwaltlich prüfen].

### 2.3 Ezarri und Pool: das unterschätzte Gewährleistungsrisiko

Glasmosaik wird **fest in ein Bauwerk eingebaut** (Becken, Spa, Bad). Daraus folgen drei Punkte, die in keinem Entwurf geregelt sind:

1. **Aus- und Einbaukosten.** Ist ein Mosaik mangelhaft, umfasst die Gewährleistung auch den Ausbau der mangelhaften und den Einbau der neuen Ware oder die Kosten dafür (§ 13 Abs 3 VGG, schon in `recht/01` § 12.3 erwähnt; EuGH C‑65/09 und C‑87/09 *Weber/Putz*, gerade ein Fliesenfall; DE § 439 Abs 3 BGB, auch im B2B-Verhältnis). Bei einem Hotelpool kann der Ausbau ein Vielfaches des Warenwerts kosten. Dazu kommt bei Hotels der Betriebsausfall [Schätzung].
2. **Längere Fristen.** In DE verjähren Mängelansprüche für Sachen, die entsprechend ihrer üblichen Verwendung für ein Bauwerk verwendet wurden und dessen Mangelhaftigkeit verursacht haben, erst nach **5 Jahren** (§ 438 Abs 1 Nr. 2 lit. b BGB). In AT sind es bei Werkverträgen über unbewegliche Sachen **3 Jahre** (§ 933 ABGB). In CH sind es 5 Jahre für in ein Werk integrierte Sachen (Art. 210 Abs 2 OR, `recht/05`). Das muss im Händlervertrag mit Ezarri als **Regress über die volle Frist** abgesichert sein (§ 933b ABGB, § 445a BGB) [anwaltlich prüfen; Ezarri-Händlervertrag vorlegen].
3. **Verlegung durch Dritte.** Platzhirsch verkauft, der Fliesenleger verlegt. Mängel entstehen oft beim Kleber, bei der Fuge oder bei der Wasserchemie (Chlor, Salz). Ohne schriftliche Verlegevorgaben von Ezarri, eine Übergabe an den Verleger mit Unterschrift und eine Zuordnung im Angebot („Verlegung durch: …, Vertrag direkt mit Ihnen“) landet jeder Streit bei Platzhirsch.

**Versicherung:** Die Betriebshaftpflicht braucht eine **erweiterte Produkthaftpflicht mit Aus- und Einbaukosten-Deckung** (in DE „Aus- und Einbaukostenklausel“). Ohne diese Deckung ist das Pool-Geschäft für eine GmbH mit negativem Eigenkapital ein existenzielles Risiko [Inhaber, Versicherungsmakler].

### 2.4 Koordinierte Gewerke: drei Widersprüche, ein Dokument fehlt

| Fundstelle | Aussage | Rechtliche Wirkung |
|---|---|---|
| Outdoor-Seite (`outdoor-gartenplanung/page.js` Z. 49, 253) | „Sie beauftragen jeden Fachbetrieb direkt – wir koordinieren die Termine“, „Bauleitung … nicht selbst“ | **Richtig.** Klare Trennung, keine Bauleitung. |
| Kundenportal (`portal/gewerke/page.js` Z. 48–50, 108) | Überzeile „Alles aus einer Hand“, „Wir koordinieren Tischler, Elektriker, Installateur, Steinmetz …“, „Sie müssen den Betrieb nicht selbst kontaktieren“ | **Rechtsschein eines Generalunternehmers.** Ein Kunde kann daraus ableiten, Platzhirsch schulde den Gesamterfolg oder hafte für die Gewerke (Anscheinsvollmacht, Auslegung nach dem Empfängerhorizont) [anwaltlich prüfen]. Es fehlt die Angabe, **mit wem der Vertrag besteht**. |
| Hotel-Gutachten 3.6 | „Koordinationshonorar 5–8 % … ohne Haftung für deren Leistung“ plus „Provision“ | (a) Für **eigene** Koordinationsfehler (falsche Terminfolge, nicht weitergegebene Pläne, übersehene Schnittstellen) haftet Platzhirsch immer. Ein Ausschluss bei grober Fahrlässigkeit ist in AGB regelmäßig unwirksam (§ 879 Abs 3 ABGB). (b) Wer für den Kunden koordiniert, ist dessen **Beauftragter**. Nimmt er zusätzlich eine Provision vom Gewerk, entsteht ein Interessenkonflikt. Nach § 1013 ABGB darf der Gewalthaber von Dritten keine Geschenke für das Geschäft annehmen. Verdeckte Provisionen können dem Kunden herauszugeben sein [anwaltlich prüfen]. **Lösung:** offenlegen oder auf eine der beiden Vergütungen verzichten (`recht/05` B.4 hat dafür schon eine Musterformulierung). |

**Was fehlt:** eine kurze **Koordinationsvereinbarung**, die drei Dinge festhält: Was Platzhirsch tut (Termine, Zeitplan, Weitergabe von Plänen, Lieferungen der eigenen Ware). Was Platzhirsch nicht tut (Bauleitung, Bauaufsicht, Prüfung fremder Leistungen, Koordination nach BauKG). Wer welchen Vertrag hat. Kernklauseln stehen in Abschnitt 3.3.

**Gewerberecht:** Ob die reine Terminkoordination fremder Gewerke ohne Baumeister-Befugnis zulässig ist, hängt davon ab, dass sie nicht in „Bauführung“ übergeht (§ 99 GewO) [anwaltlich prüfen, Kurzfrage an WKO Vorarlberg genügt].

### 2.5 Fernabsatz: wo das „organisierte System“ inzwischen steht

Mit Portal, Video-Beratung, Online-Termin, Concierge, Raumplaner-Upload und Angebots-PDF per E-Mail **ist Platzhirsch ein organisiertes Fernabsatzsystem** im Sinne von § 3 Z 2 FAGG [anwaltlich prüfen, aber naheliegend]. Daraus folgt:

- Jeder Auftrag, den ein Verbraucher **ohne gleichzeitige Anwesenheit** annimmt (E-Mail, Portal-Dokument, DocuSign), ist Fernabsatz. Ausgenommen ist nur die Maßanfertigung (§ 18 Abs 1 Z 3 FAGG). Ein früherer Showroom-Besuch ändert daran nach dem Erwägungsgrund 20 der Verbraucherrechte-RL wenig (`recht/01` A.2).
- **Planungsleistungen** (Planungspauschale, Raumplaner „48 Stunden“, Yacht-Konzept) sind **Dienstleistungen**. Die Rücktrittsfrist läuft 14 Tage ab Vertragsschluss. Beginnt Platzhirsch vorher, braucht es das **ausdrückliche Verlangen auf dauerhaftem Datenträger** (§ 10 FAGG). Sonst schuldet der Kunde bei Rücktritt nichts für die Planung (§ 16 FAGG).
- **Ohne korrekte Belehrung verlängert sich die Frist um 12 Monate** (§ 12 FAGG). Bei einem Planungshonorar von wenigen tausend Euro ist das ärgerlich. Bei einer Küche, die nicht als Maßanfertigung gilt (2.6), wäre es ein Totalschaden.

### 2.6 „Maßanfertigung“ ist im Entwurf zu breit gefasst

`recht/01` § 6.1 zählt „Modulkombinationen“ und alle „von Ihnen gewählten … Bezüge, Farben“ zur Maßanfertigung. Das ist riskant:

- Nach der Linie des BGH zu „Build to order“ (BGH 19.03.2003, VIII ZR 295/01, Notebook aus Standardkomponenten) greift die Ausnahme **nicht**, wenn die Ware aus Serienteilen besteht, die sich **ohne Beschädigung und mit verhältnismäßigem Aufwand wieder trennen** lassen [Fundstelle prüfen].
- Ein Sofa aus Katalogmodulen in Standardstoff, eine Leuchte in Katalogfarbe oder ein Tisch in einer Katalogmaß-Variante ist deshalb **im Zweifel keine Maßanfertigung**. Ein Sofa mit Kundenbezug, das ab Werk für diesen Kunden genäht wird, eine Küche nach Aufmaß oder eine Steinplatte nach Maß ist eine.
- **Folge, wenn man sich irrt:** Rücktritt binnen 14 Tagen nach Lieferung, bei fehlender Belehrung binnen 12 Monaten, und Platzhirsch trägt den Wertverlust einer italienischen Bestellware.

**Lösung:** Im Angebot je Position ein Kennzeichen „M“ (nach Ihren Vorgaben gefertigt, kein Rücktritt) oder „S“ (Serienware, Rücktritt im Fernabsatz). Für S-Positionen die Belehrung mitsenden. Der Prüfschritt kostet im Verkauf eine Minute.

### 2.7 Kostenvoranschlag: eine stille Falle in jedem Planungsangebot

Gegenüber Verbrauchern gilt ein Kostenvoranschlag, der dem Vertrag zugrunde gelegt wird, als **verbindlich**, außer das Gegenteil ist **ausdrücklich** erklärt (§ 5 Abs 2 KSchG). Ein Entgelt für den Kostenvoranschlag selbst kann nur verlangt werden, wenn der Kunde **vorher** darauf hingewiesen wurde (§ 5 Abs 1 KSchG). Bei unverbindlichen Voranschlägen muss eine beträchtliche Überschreitung sofort angezeigt werden (§ 1170a Abs 2 ABGB).

- Der Küchenplaner macht es richtig: „Unverbindlicher Rahmen inkl. MwSt., kein Angebot“ (`ResultPanel.js` Z. 302).
- In den AGB fehlt eine Regel für Montage- und Regieleistungen, die nach Aufwand abgerechnet werden (Anpassungsarbeiten, Outdoor-Montage, Yacht-Einbau). **Empfehlung:** Montage zum Pauschalpreis anbieten. Wo das nicht geht: „Kostenvoranschlag ohne Gewähr für die Richtigkeit (§ 5 Abs 2 KSchG); Überschreitungen über 15 % zeigen wir vorher an“ [anwaltlich prüfen, Prozentsatz].

### 2.8 Cookies (TKG 2021 § 165 Abs 3; DE § 25 TDDDG; CH Art. 45c FMG)

**Technik in Ordnung:**
- `googleTag.js`: Consent Mode v2 default „denied“. gtag.js lädt nur mit Einwilligung **und** konfigurierter ID.
- `attribution.js`: ohne Ads-Einwilligung nur im Arbeitsspeicher. Mit Einwilligung `localStorage` 90 Tage. Beim Widerruf wird sofort gelöscht.
- „Alle akzeptieren“ und „Weiter ohne Einwilligung“ sind gleichwertig gestaltet. Der Widerruf ist über den Footer möglich. Das Banner ist als `<dialog>` mit Fokusfalle gebaut.
- Weitere lokale Speicher (Merkliste/Warenkorb `cart`, Sprache `preferredLocale`, Concierge `sessionStorage`, Popup-Zeitstempel) sind für einen vom Nutzer gewünschten Dienst nötig und fallen unter die Ausnahme des § 165 Abs 3. Sie müssen aber in der Datenschutzerklärung stehen. Den Popup-Zeitstempel (`vernissagePopup.js`) sollte die Kanzlei kurz einordnen.

**Texte nicht in Ordnung** (`src/messages/de.json`, Namespace `Cookies`, gleich in en/fr/it):

| # | Text heute | Problem | Fix |
|---|---|---|---|
| K1 | `bannerText`: „Wir verwenden Cookies, um Ihnen ein gutes Nutzererlebnis bieten zu können.“ | Nennt keinen Zweck, keine Dritten und keine USA-Übermittlung. Damit fehlt die Grundlage für eine „informierte“ Einwilligung (Art. 4 Nr. 11 DSGVO) | Text in Baustein 3.5 |
| K2 | `intro`: „… auf der Grundlage eines berechtigten Interesses …, dem Sie widersprechen können“ | Widerspricht § 165 Abs 3 TKG und der eigenen Technik. Für nicht notwendige Cookies trägt das berechtigte Interesse nicht. Das ist C1 aus `recht/02`, noch offen | Satz streichen, Text in 3.5 |
| K3 | `thirdCountryNotice`: „unsichere Drittländer … Art. 49 Abs. 1 lit. a“ | Falsche Rechtsgrundlage: Google ist nach dem EU-US Data Privacy Framework zertifiziert, und `services.js` nennt selbst `adequacy`. Das ist C2, noch offen | Text in 3.5 |
| K4 | `categories.functional.description`: „hübschere Schriftarten, Videowiedergabe, Web-2.0“ | Passt nicht zu den Diensten (Maps, YouTube-Facade, Termine). Das ist C5, noch offen | Text in 3.5 |
| K5 | Einwilligungscookie 365 Tage | Zulässig. Viele Behörden empfehlen, nach 6–12 Monaten erneut zu fragen [anwaltlich prüfen] | so lassen oder auf 6 Monate |

### 2.9 Preisangaben

- **AT (PrAG):** Atelier-Preise sind korrekt (`AtelierPrice.js`: Gesamtpreis inkl. USt, kein Streichpreis, UVP nur mit Beleg). Die 30-Tage-Regel aus § 9a PrAG ist in `recht/00` W8 sauber gelöst.
- **DE (PAngV):** Gesamtpreis inkl. USt ist richtig. Bei Lieferung nach DE gilt die **deutsche** USt (OSS, `recht/01` § 17). Ein AT-Bruttopreis mit 20 % ist für DE-Verbraucher ein falscher Gesamtpreis, sobald online nach DE verkauft wird.
- **CH (PBV):** Richtet sich ein Angebot (auch) an Konsumenten in der Schweiz, ist der tatsächlich zu zahlende **Detailpreis in CHF** anzugeben, inklusive aller nicht frei wählbaren Bestandteile. Versandkosten werden gesondert genannt. Ein Hinweis auf den Zollrechner kann für Zölle genügen ([it-recht-kanzlei PBV](https://www.it-recht-kanzlei.de/anforderungen-preisangaben-schweiz-deutsche-haendler.html), [SECO-Informationsblatt über newsd.admin.ch](https://www.newsd.admin.ch/newsd/message/attachments/54942.pdf)) [anwaltlich prüfen: gilt das schon für den Dreiländer-Rechner und die CH-Regionsseiten?]. Der Dreiländer-Rechner zeigt Franken nur mit gültigem Kurs und als „Richtwert“. Das ist vertretbar. Für echte Preisangaben an CH-Kunden (Atelier, Gutschein) aber CHF-Preise ergänzen.

### 2.10 Gewährleistung, Garantie, Lieferfristen: Kleinigkeiten mit Wirkung

- `recht/01` § 12.6 nennt für die Herstellergarantie „§ 9a KSchG“. Nach meinem Stand stand die vertragliche Garantie in § 9b KSchG. Mit der Umsetzung der Reparatur-Richtlinie (EU) 2024/1799 bekommt § 9b eine **Reparaturpflicht des Herstellers** (Regierungsvorlage, Umsetzung bis 31.07.2026; [Parlament RV 530 d.B.](https://www.parlament.gv.at/dokument/XXVIII/I/530/fname_1763562.pdf), [BGBl. I 60/2026](https://ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2026_I_60/BGBLA_2026_I_60.pdf)). **Die Fundstelle muss vor Verwendung im RIS geprüft werden** [anwaltlich prüfen].
- **Garantie-Werbung:** „5 Jahre Garantie“ auf Website oder Angebot nur, wenn eine Garantieerklärung **mit Garant, Inhalt, Dauer, Gebiet und dem Hinweis, dass die Gewährleistung unberührt bleibt**, vorliegt (Art. 17 Warenkauf-RL; EmpCo-RL ab 27.09.2026 mit neuem Garantie-Hinweis) [anwaltlich prüfen, Umsetzung in AT]. Herstellergarantien von Minotti und anderen Marken ohne Händlerstatus **nicht** weitergeben oder bewerben.
- **Lieferfristen:** § 8 des Entwurfs ist richtig (§ 7a KSchG: ohne Vereinbarung 30 Tage). Für Hotels kommt dazu: Liefertermine vor der Eröffnung sind faktisch Fixtermine. Diese gehören in den Projektvertrag, nicht in die AGB (Rahmenvertrag § 9).

### 2.11 Yacht-Interior: eine Spezialfrage

Wird das Interieur eines Sportboots so umgebaut, dass Gewicht, Stabilität oder Brandschutz betroffen sind, kann das ein **„wesentlicher Umbau“** im Sinne der Sportboot-Richtlinie 2013/53/EU sein. Wer ihn vornimmt, kann Herstellerpflichten bekommen (Konformitätsbewertung) [anwaltlich prüfen, Fundstelle prüfen]. Die Yacht-Seite vermeidet richtigerweise „marine-zertifiziert“ (`YachtLanding.js` Z. 20). Im Vertrag gehört festgehalten: Alle Eingriffe in Struktur, Elektrik, Gas und Brandschutz übernimmt die Werft im eigenen Vertrag mit dem Eigner. Platzhirsch liefert lose Ausstattung, Polster und Stoffe mit den Nachweisen, die der Hersteller liefert.

---

## 3. Fertige Bausteine

### 3.1 Mängelliste (Entwürfe und Website)

Prio: **P0** = vor dem ersten Contract-Auftrag bzw. vor Launch des Features, **P1** = vor Welle 2, **P2** = nachziehen, **P3** = Kür.

| ID | Prio | Fundstelle | Mangel | Risiko | Behebung |
|---|---|---|---|---|---|
| M-01 | P0 | `recht/01` Teil II | Kein Contract-Rahmenvertrag. Teil II reicht für Hotels nicht (Sicherheiten, Nachträge, Mock-up, Nachkauf, Schnittstellen) | Auftrag scheitert, oder Platzhirsch unterschreibt die Einkaufsbedingungen des Hotels mit unbegrenzter Haftung | Baustein 3.2 |
| M-02 | P0 | `portal/gewerke/page.js` Z. 48–50, 108 | „Alles aus einer Hand“, „Sie müssen den Betrieb nicht selbst kontaktieren“, es fehlt die Angabe des Vertragspartners je Gewerk | Rechtsschein eines Generalunternehmers, Haftung für fremde Gewerke | Text in 3.4. Feld `contractWith` je Gewerk („Vertrag: direkt mit Ihnen“ / „über Platzhirsch“) |
| M-03 | P0 | `hotel-contract.md` 3.6 | Koordinationshonorar „ohne Haftung“ plus Provision vom Gewerk | Haftungsausschluss unwirksam, Provision herauszugeben (§ 1013 ABGB) [anwaltlich prüfen] | Baustein 3.3, Offenlegung nach `recht/05` B.4 |
| M-04 | P0 | alle | Keine Antwort auf die Insolvenzfrage des Kunden; keine Anzahlungssicherung ohne Bank | Hotels springen ab | Module A–E (2.1), Rahmenvertrag § 7 |
| M-05 | P0 | `recht/01` § 12, AGB fehlt | Keine Regeln für Baustoffe und Pool-Mosaik (Aus- und Einbaukosten, 3/5-Jahres-Fristen, Verlegung durch Dritte); Regress im Ezarri-Vertrag ungeklärt | Schaden ein Vielfaches des Warenwerts | Klausel § 12 im Rahmenvertrag; AGB-Zusatz „Ezarri“ (3.6); Versicherung prüfen |
| M-06 | P0 | `recht/00` 1 | Widerrufsbelehrung (Waren und Dienstleistungen), Musterformular und Seite „Vertrag widerrufen“ fehlen | Frist +12 Monate (§ 12 FAGG) | Kanzlei-Mandat Punkt F1 (Abschnitt 5) |
| M-07 | P1 | `src/lib/commerce/voucherTerms.js` Punkt 8 | Rücktritt nur „solange der Gutschein noch nicht, auch nicht teilweise, eingelöst wurde“ und „ab Erhalt“ | § 18 FAGG zählt die Ausnahmen abschließend auf. Eine teilweise Einlösung schließt den Rücktritt nicht ausdrücklich aus. Der Fristbeginn hängt davon ab, ob der Gutschein Ware oder Dienstleistung ist [anwaltlich prüfen] | Kanzlei entscheidet. Vorsichtige Fassung: „Bei teilweiser Einlösung erstatten wir den nicht eingelösten Wert“ |
| M-08 | P1 | `recht/01` § 6.1 | „Modulkombinationen“ und Katalogvarianten pauschal als Maßanfertigung | Unwirksame Ausnahme, Rücktritt plus 12 Monate | M/S-Kennzeichen im Angebot (2.6) |
| M-09 | P1 | `recht/01` | Keine Regel zum Kostenvoranschlag (§ 5 KSchG, § 1170a ABGB) | Voranschlag gilt als verbindlich | Klausel 2.7 |
| M-10 | P1 | `recht/01` § 2.3 | Planung im Fernabsatz: Verlangen nach § 10 FAGG fehlt im Ablauf, kein eigener Planungsvertrag | Planung bleibt bei Rücktritt unbezahlt | Planungsvertrag (3.3 Teil A) |
| M-11 | P1 | `src/messages/*.json` `Cookies.bannerText`, `intro`, `thirdCountryNotice`, `categories.functional` | Vorlagentexte widersprechen der Technik (berechtigtes Interesse, Art. 49, „hübschere Schriftarten“) | Unwirksame Einwilligung, DSB-Beschwerde | Texte 3.5 |
| M-12 | P1 | `recht/01` § 27 | B2B-Haftungsausschluss bis zur „krass groben“ Fahrlässigkeit in AGB | Nach OGH-Linie in AGB regelmäßig unwirksam (§ 879 Abs 3 ABGB) [anwaltlich prüfen] | Rahmenvertrag § 13: leichte Fahrlässigkeit ausschließen, Deckel, grobe Fahrlässigkeit voll |
| M-13 | P1 | `recht/01` § 12.6 | Garantie-Fundstelle „§ 9a KSchG“ vermutlich falsch, Reparaturpflicht-Novelle 2026 | Falsche Pflichtinformation | RIS prüfen (2.10) |
| M-14 | P1 | `recht/01` Teil II § 22 vs. `hotel-contract` 3.6 | B2B-Anzahlung 30–50 % / 40-40-20 nicht abgestimmt, „Versandbereitschaft“ ohne Definition | Streit über Fälligkeit | Rahmenvertrag § 7 (Definition) |
| M-15 | P1 | `outdoor-gartenplanung/page.js` Z. 113 | „… sorgen dafür, dass die Möbel pünktlich zum Saisonstart stehen“ | Wird als Lieferzusage verstanden | „… planen die Lieferung der Möbel auf Ihren Saisonstart hin“ |
| M-16 | P2 | `recht/01` § 18, Website | CH: Detailpreis in CHF nach PBV fehlt bei Preisangaben an CH-Konsumenten | Beanstandung durch SECO bzw. Mitbewerber | CHF-Preis ergänzen, sobald Atelier/Gutschein an CH-Kunden gehen |
| M-17 | P2 | `recht/01` § 29 / `hotel-contract` 3.6 | Referenzklausel ohne Regelung für Gästedaten, Architektenurheberrecht, Fotografenrechte | Unterlassung, Bildrechte | Rahmenvertrag § 17 |
| M-18 | P2 | Yacht | Keine Abgrenzung zur Werft bei Eingriffen in Struktur, Elektrik und Brandschutz | Herstellerpflichten nach der Sportboot-RL | Vertragsklausel (2.11) |
| M-19 | P2 | `recht/01` Teil II | Kein Hinweis auf § 1170b ABGB | Verschenkte Sicherheit | Rahmenvertrag § 7.4 |
| M-20 | P2 | Formulare | Widerspruchshinweis nach § 174 Abs 4 TKG bei Erhebung der E-Mail (W13) | Ohne Hinweis kein Bestandskunden-Newsletter | Hinweis in Auftragsbestätigung und Formularen (`recht/02`) |
| M-21 | P3 | `vernissagePopup.js` | `localStorage`-Zeitstempel ohne Einwilligung | Gering, Einordnung „unbedingt erforderlich“ fraglich [anwaltlich prüfen] | in DSE nennen oder `sessionStorage` |
| M-22 | P3 | Cookie-Laufzeit | 365 Tage | Gering | ggf. 6 Monate |

### 3.2 Entwurf: Rahmenvertrag Contract (Hotel, Gastronomie, Chalet, Objekt)

> **ENTWURF – Gliederung und Kernklauseln. Vor Verwendung durch eine Kanzlei (Vertrags- und Baurecht AT; bei DE/CH-Projekten Gegenprüfung) zu prüfen und auszuformulieren.** Nur für Unternehmer (§ 1 KSchG, § 14 BGB). Bei öffentlichen Auftraggebern gelten Vergaberecht und gegebenenfalls ÖNORM B 2110. Der Entwurf ist für ein Modell geschrieben, in dem **Platzhirsch nicht Generalunternehmer ist**.

**Aufbau:** ein Rahmenvertrag, unter dem je Projekt bzw. Bauabschnitt ein **Projektabruf** (2–4 Seiten) geschlossen wird. So muss ein Hotel, das zuerst eine Etage und später die Lobby beauftragt, nicht jedes Mal den ganzen Vertrag verhandeln.

#### Gliederung

| § | Inhalt |
|---|---|
| 0 | Präambel (Rollenmodell) |
| 1 | Vertragsgegenstand, Leistungsbausteine L1–L5 |
| 2 | Vertragsbestandteile und Rangfolge |
| 3 | Projektabruf, Leistungsverzeichnis, FF&E-Liste |
| 4 | Planung, Bemusterung, Mock-up, Freigaben |
| 5 | Nachträge und Änderungen |
| 6 | Preise |
| 7 | Zahlung, Meilensteine, Sicherheiten beider Seiten |
| 8 | Bestellung beim Hersteller, Back-to-back |
| 9 | Termine, Fixtermine, Verzug, Vertragsstrafe |
| 10 | Lieferung, Logistik, Zwischenlager, Montage im laufenden Betrieb |
| 11 | Koordination fremder Gewerke (Schnittstellen) |
| 12 | Abnahme (auch Teilabnahme je Zimmer/Bereich), Gewährleistung, Einbauwaren |
| 13 | Haftung, Versicherung |
| 14 | Objekteignung, Brandschutz, Nachweise |
| 15 | Nachkauf, Ersatzteile, Wartung |
| 16 | Eigentumsvorbehalt, Gefahrübergang |
| 17 | Geistiges Eigentum, Pläne, Referenzen, Fotos |
| 18 | Vertraulichkeit, Datenschutz |
| 19 | Subunternehmer, Compliance (HFU, Entsendung) |
| 20 | Kündigung, Rücktritt, Insolvenz |
| 21 | Recht, Gerichtsstand, Streitbeilegung |
| Anl. | 1 Projektabruf (Muster) · 2 Zahlungs- und Sicherheitenmodul · 3 Schnittstellenmatrix · 4 Abnahmeprotokoll · 5 Nachtragsformular · 6 Pflichtenheft Objekteignung |

#### Kernklauseln

**§ 0 Präambel.**
„Platzhirsch plant und liefert die bewegliche Ausstattung (FF&E) und, soweit im Projektabruf vereinbart, Einbauten und deren Montage. Leistungen anderer Fachbetriebe (zum Beispiel Bau, Elektro, Installation, Fliesenverlegung, Großküche, Garten- und Landschaftsbau) beauftragt der Auftraggeber selbst, soweit sie nicht ausdrücklich als Leistung von Platzhirsch im Projektabruf stehen. Platzhirsch ist weder Generalunternehmer noch Bauleiter noch Baustellenkoordinator nach BauKG.“

**§ 1 Leistungsbausteine.** Jeder Projektabruf kreuzt an, was gilt:
- **L1 Konzept und Planung** (Moodboard, Grundrisse, FF&E-Liste, Musterzimmer) – Werkvertrag, Pauschalhonorar.
- **L2 Lieferung loser Ausstattung** – Kaufvertrag (UGB, Rügepflicht § 377).
- **L3 Einbauten mit Montage** (Tischler-, Stein- und Mosaikarbeiten über Platzhirsch) – Werkvertrag, § 1170b ABGB anwendbar.
- **L4 Koordination** fremder Gewerke nach § 11 – Geschäftsbesorgung, eigenes Honorar.
- **L5 Nachkauf und Service** nach § 15.

**§ 2 Rangfolge.** (1) Projektabruf mit Verhandlungsprotokoll, (2) Leistungsverzeichnis/FF&E-Liste, (3) dieser Rahmenvertrag, (4) Teil II der AGB, (5) Gesetz. Einkaufsbedingungen des Auftraggebers gelten nur, soweit sie im Projektabruf ausdrücklich genannt sind [anwaltlich prüfen: Kollision von AGB].

**§ 4 Freigaben und Mock-up.**
„4.1 Vor der Bestellung gibt der Auftraggeber je Position Modell, Maß, Bezug/Material (mit Muster), Menge und Liefertermin schriftlich frei (Freigabeliste). 4.2 Für Serien ab [10] gleichen Einheiten kann ein Musterzimmer bzw. Mock-up vereinbart werden. Dessen Abnahme gilt als Freigabe der Ausführung für die Serie. 4.3 Spätere Abweichungen vom freigegebenen Muster, die innerhalb der vom Hersteller angegebenen Toleranzen für Farbe, Maserung und Struktur liegen, sind kein Mangel. Die Toleranzen stehen in Anlage 6. 4.4 Verzögert sich eine Freigabe um mehr als [5] Werktage, verschieben sich die abhängigen Termine entsprechend.“

**§ 5 Nachträge.**
„5.1 Änderungen und Zusatzleistungen beauftragt der Auftraggeber schriftlich mit dem Nachtragsformular (Anlage 5). 5.2 Platzhirsch teilt binnen [5] Werktagen Mehr- oder Minderkosten und Terminfolgen mit. 5.3 Ohne schriftlichen Nachtrag besteht keine Pflicht zur Mehrleistung. Ausgenommen sind Maßnahmen, die zur Abwehr eines unmittelbar drohenden Schadens nötig sind. 5.4 Stornokosten des Herstellers für geänderte Positionen trägt der Auftraggeber in nachgewiesener Höhe.“

**§ 6 Preise.** Nettopreise. Festpreis für Positionen, die binnen [6] Monaten nach Freigabe abgerufen werden. Für spätere Abrufe gilt eine Anpassung an nachgewiesene Herstellerpreislisten. Senkungen werden weitergegeben. Bei einer Erhöhung über [8] % hat der Auftraggeber ein Rücktrittsrecht je Position (wie `recht/01` § 21).

**§ 7 Zahlung und Sicherheiten.**
„7.1 **Meilensteine Ware (L2):** 40 % mit Freigabe der Bestellung, 40 % bei Versandbereitschaft, 20 % nach Abnahme des jeweiligen Bereichs. ‚Versandbereitschaft‘ heißt: Der Hersteller hat die Fertigstellung schriftlich angezeigt. Platzhirsch legt die Anzeige vor. 7.2 **Einbauten (L3):** Abschlagsrechnungen nach Leistungsstand, 5 % Haftrücklass für [24] Monate, ablösbar durch Bankgarantie. 7.3 **Schutz der Anzahlung (Wahlmodul laut Anlage 2):** (a) Die Anzahlung für Herstellerware zahlt der Auftraggeber direkt an den Hersteller, oder (b) sie geht auf ein Treuhandkonto bei [Rechtsanwalt/Notar] und wird gegen Vorlage der Herstellerbestellungsbestätigung freigegeben, oder (c) mit Zahlung der zweiten Rate geht das Eigentum an der gekennzeichneten Ware auf den Auftraggeber über. Zusätzlich tritt Platzhirsch für den Fall seiner Zahlungsunfähigkeit seine Ansprüche gegen den Hersteller auf Lieferung und Gewährleistung für die bezahlten Positionen an den Auftraggeber ab [anwaltlich prüfen: Wirksamkeit, Abtretungsverbote, Insolvenzfestigkeit]. 7.4 **Sicherstellung des Auftraggebers:** Für Leistungen nach L3 kann Platzhirsch Sicherstellung nach § 1170b ABGB verlangen (bis 20 % bzw. 40 % bei kurzer Laufzeit). Für L2 ab einem Auftragswert von [100.000] € eine Zahlungsgarantie über die nicht durch Anzahlung gedeckten Beträge. 7.5 Platzhirsch bestellt beim Hersteller erst nach Eingang der Zahlung nach 7.1 bzw. nach Bestätigung des Treuhänders. 7.6 Verzugszinsen nach § 456 UGB, Pauschale nach § 458 UGB.“

> *Anmerkung:* Modul (a) oder (b) ist **der** Vertriebssatz gegenüber Hotels. Kosten für Platzhirsch: fast null. Gegen Bankgarantien und Vorfinanzierung durch Platzhirsch spricht die Kapitallage.

**§ 8 Back-to-back.** Liefertermine, Toleranzen, Gewährleistungsfristen und Stornobedingungen des Herstellers werden im Projektabruf je Position offengelegt. Platzhirsch schuldet keine günstigeren Bedingungen, als der Hersteller gewährt, soweit nicht ausdrücklich anders vereinbart [anwaltlich prüfen: Transparenz]. *Ausnahme:* die Gewährleistung für Einbauwaren nach § 12.3.

**§ 9 Termine.**
„9.1 Verbindlich sind nur Termine, die im Projektabruf als ‚Fixtermin‘ bezeichnet sind. Alle übrigen Termine haben eine Toleranz von [2] Wochen. 9.2 Fixtermine setzen voraus, dass Freigaben, Baufreiheit und Vorleistungen anderer Gewerke rechtzeitig vorliegen (Schnittstellenmatrix, Anlage 3). 9.3 Eine Vertragsstrafe gibt es nur bei Fixterminen: [0,2] % des Werts der betroffenen Positionen je Werktag, höchstens [5] %. Sie wird auf den Verzugsschaden angerechnet. 9.4 Werksferien in Italien (August, Weihnachten) sind in der Terminplanung zu berücksichtigen.“

**§ 10 Logistik und Montage im Betrieb.** Anlieferung je Zimmer bzw. Bereich nach Logistikplan. Zwischenlager auf Kosten des Auftraggebers ab [10] Werktagen nach Versandbereitschaft. Montage im laufenden Hotelbetrieb nur in vereinbarten Zeitfenstern. Lärm- und Hausregeln, Schlüsselvergabe und Brandmeldeabschaltung regelt der Auftraggeber. Verpackung wird entsorgt oder gegen Aufpreis zurückgenommen.

**§ 11 Koordination fremder Gewerke (L4).**
„11.1 Platzhirsch stimmt Termine und Lieferungen mit den vom Auftraggeber beauftragten Fachbetrieben ab, führt einen gemeinsamen Terminplan und gibt die eigenen Pläne und Maße an die Fachbetriebe weiter. 11.2 Platzhirsch schuldet weder Bauleitung noch Bauaufsicht noch die Prüfung der Leistungen anderer Fachbetriebe. Er haftet nicht für deren Mängel und Verzug. Für eigene Fehler bei der Koordination (zum Beispiel falsch weitergegebene Maße oder nicht abgestimmte Termine) haftet er nach § 13. 11.3 Erkennt Platzhirsch, dass die Vorleistung eines anderen Gewerks für seine eigene Leistung untauglich ist, warnt er den Auftraggeber schriftlich (§ 1168a ABGB). 11.4 **Vergütung und Offenlegung:** Platzhirsch erhält für L4 ein Honorar von [●] % der koordinierten Auftragssumme bzw. [●] € pauschal. Provisionen oder sonstige Vorteile von Fachbetrieben nimmt Platzhirsch nur an, wenn sie dem Auftraggeber vorher schriftlich offengelegt wurden und er zugestimmt hat. Sonst werden sie dem Auftraggeber gutgeschrieben (§ 1013 ABGB) [anwaltlich prüfen]. 11.5 Die Zuordnung jeder Leistung (Wer führt aus? Mit wem besteht der Vertrag?) steht in der Schnittstellenmatrix (Anlage 3).“

**§ 12 Abnahme und Gewährleistung.**
„12.1 Abnahme je Bereich (Zimmer, Etage, Lobby) mit Protokoll (Anlage 4) binnen [10] Werktagen nach Fertigmeldung. Inbetriebnahme gilt als Abnahme. Unwesentliche Mängel hindern die Abnahme nicht, werden aber protokolliert und binnen [20] Werktagen behoben. 12.2 Lose Ausstattung: Untersuchung und Rüge nach § 377 UGB binnen [7] Tagen. Gewährleistungsfrist [12/24] Monate ab Abnahme [Inhaber: 24 Monate sind für Hotels ein Verkaufsargument, wenn der Hersteller sie deckt]. 12.3 **Einbauwaren und Einbauten (Mosaik, Steinplatten, Einbaumöbel):** gesetzliche Frist (AT 3 Jahre für unbewegliche Sachen, § 933 ABGB; DE 5 Jahre, § 438 Abs 1 Nr. 2 BGB; CH 5 Jahre, Art. 371 Abs 2 OR), keine Verkürzung. Aus- und Einbaukosten nach Gesetz. Voraussetzung ist die Verlegung bzw. Montage nach den schriftlichen Vorgaben des Herstellers, die Platzhirsch vor Ausführung übergibt. 12.4 Für Schäden durch Wasserchemie, Reinigungsmittel oder Pflege entgegen der übergebenen Pflegeanleitung besteht keine Gewähr.“

**§ 13 Haftung und Versicherung.**
„13.1 Unbeschränkte Haftung für Vorsatz, grobe Fahrlässigkeit und Personenschäden sowie nach dem PHG. 13.2 Bei leichter Fahrlässigkeit ist die Haftung ausgeschlossen, außer bei Verletzung wesentlicher Vertragspflichten. Dann ist sie auf den vorhersehbaren, vertragstypischen Schaden begrenzt, höchstens auf den Wert des betroffenen Projektabrufs. 13.3 Für entgangenen Gewinn und Betriebsunterbrechung (zum Beispiel eine verschobene Eröffnung) haftet Platzhirsch nur bei grober Fahrlässigkeit und höchstens bis [●] € [anwaltlich prüfen; Ausschluss grober Fahrlässigkeit in AGB vermeiden]. 13.4 Platzhirsch unterhält eine Betriebshaftpflicht mit erweiterter Produkthaftpflicht einschließlich Aus- und Einbaukosten mit [●] € Deckung und legt den Nachweis auf Verlangen vor. 13.5 Schadenersatzansprüche verjähren in [2] Jahren ab Kenntnis.“

**§ 14 Objekteignung.**
„14.1 Der Auftraggeber nennt die Nutzung (Gästezimmer, Lobby, Gastronomie, Außenbereich, Spa) und legt das Brandschutzkonzept vor. 14.2 Platzhirsch legt je Position die Nachweise vor, die der Hersteller zur Verfügung stellt (zum Beispiel Entflammbarkeit von Polstern nach EN 1021‑1/‑2, Scheuerwert nach Martindale, Rutschhemmung bei Mosaik). Diese Werte sind vereinbarte Beschaffenheit. 14.3 Ob die Nachweise für das konkrete Objekt genügen, prüft der Brandschutzplaner des Auftraggebers. Platzhirsch schuldet keine Brandschutzplanung.“

**§ 15 Nachkauf.** Platzhirsch nennt im Projektabruf je Position, ob und wie lange der Hersteller Nachkauf bzw. Ersatzbezüge zusagt. Optional: Reservebestand (zum Beispiel 3 % der Bezugsstoffe) gegen Aufpreis. Wartungspaket L5 mit festen Servicetagen.

**§ 16 Eigentumsvorbehalt und Gefahr.** Eigentumsvorbehalt bis zur vollständigen Zahlung des Projektabrufs, außer bei Modul 7.3 (c). Gefahrübergang bei Lieferung durch eigene Leute mit Abladen, bei Montage mit Abnahme des Bereichs. Auf der Baustelle gelagerte Ware ab Übergabe auf Risiko des Auftraggebers. Diese Ware ist über die Bauwesenversicherung des Auftraggebers mitzuversichern.

**§ 17 Pläne, Referenzen, Fotos.**
„17.1 Pläne und Konzepte darf der Auftraggeber für dieses Objekt nutzen. Die Weitergabe an Dritte zur Umsetzung ist nur nach vollständiger Zahlung des Honorars für L1 erlaubt. 17.2 Referenz: Nach Fertigstellung darf Platzhirsch die eingerichteten Bereiche fotografieren und mit dem Namen des Hauses veröffentlichen. Gäste und Personal werden nicht erkennbar abgebildet. Urheberrechte der Architektin oder des Architekten bleiben vorbehalten. Gegenleistung: Projektnachlass [x] % auf L2 (Hotel-Gutachten 3.6). 17.3 Der Auftraggeber kann die Referenz bis zur Veröffentlichung schriftlich untersagen. Dann entfällt der Nachlass.“

**§ 19 Subunternehmer und Compliance.** Platzhirsch setzt für L3 nur Betriebe ein, die in der HFU-Gesamtliste stehen bzw. die Nachweise nach `recht/05` D.2 erbringen. Entsendemeldungen bei Projekten in CH und FL erledigt der jeweilige Arbeitgeber. Platzhirsch haftet für Subunternehmer wie für eigene Leute (§ 1313a ABGB).

**§ 20 Kündigung und Insolvenz.** Kündigt der Auftraggeber einen Werkvertragsteil ohne Grund, schuldet er das Entgelt abzüglich der Ersparnis (§ 1168 Abs 1 ABGB). Bei bestellter Herstellerware schuldet er mindestens die nachgewiesenen Stornokosten. Im Insolvenzfall einer Partei gelten die Module nach 7.3 [anwaltlich prüfen: § 21 IO, Wahlrecht des Insolvenzverwalters].

**§ 21 Recht und Gerichtsstand.** Österreichisches Recht ohne UN-Kaufrecht. Gerichtsstand ist das sachlich zuständige Gericht für 6911 Lochau. Für Auftraggeber in CH gilt eine schriftliche Gerichtsstandsvereinbarung (Art. 23 LugÜ). Für FL-Auftraggeber ist ein Schiedsgericht nach den Wiener Regeln (VIAC) zu erwägen [anwaltlich prüfen]. Vor einer Klage findet ein Eskalationsgespräch auf Geschäftsführungsebene binnen [14] Tagen statt.

#### Anlage 3: Schnittstellenmatrix (Muster)

| Leistung | Führt aus | Vertrag mit | Koordination | Abnahme durch |
|---|---|---|---|---|
| FF&E-Konzept, Musterzimmer | Platzhirsch | Platzhirsch (L1) | – | Auftraggeber |
| Lose Möbel, Leuchten, Textilien | Platzhirsch | Platzhirsch (L2) | Platzhirsch | Auftraggeber |
| Einbaumöbel, Rezeption | [Tischler] | [Platzhirsch (L3) / Auftraggeber direkt] | Platzhirsch | Auftraggeber |
| Glasmosaik Ezarri, Lieferung | Platzhirsch | Platzhirsch (L2) | Platzhirsch | Auftraggeber/Verleger |
| Mosaikverlegung | [Fliesenleger] | **Auftraggeber direkt** | Platzhirsch (Termin, Verlegevorgaben) | Bauleitung des Auftraggebers |
| Elektro, Installation | befugter Betrieb | Auftraggeber direkt | Platzhirsch (Termin) | Bauleitung des Auftraggebers |
| Bauleitung, BauKG-Koordination | Baumeister / Koordinator | Auftraggeber direkt | – | – |

### 3.3 Planungsvertrag und Koordinationsvereinbarung (Privatkunden und kleine Projekte)

**Teil A – Planungsvertrag (1 Seite, Kernklauseln)**
1. **Leistung:** [Küchenplanung / Raumkonzept / Outdoor-Konzept / Yacht-Konzept] mit [●] Entwürfen und [●] Überarbeitungsrunden. Ergebnis: Pläne, Visualisierungen, Stückliste.
2. **Honorar:** Pauschal [●] € brutto. Es wird bei einem Auftrag über die geplante Einrichtung binnen [6] Monaten **vollständig angerechnet**.
3. **Vor Fristende beginnen (nur Fernabsatz):** „Ich verlange ausdrücklich, dass Platzhirsch vor Ablauf der Rücktrittsfrist mit der Planung beginnt. Mir ist bekannt, dass ich bei einem Rücktritt einen anteiligen Betrag für die bis dahin erbrachte Leistung zahle und mein Rücktrittsrecht bei vollständiger Erbringung verliere.“ (§§ 10, 16, 18 Abs 1 Z 1 FAGG) – als eigenes, nicht vorausgewähltes Kästchen bzw. eigener Satz in der Annahme-Mail.
4. **Maße:** Verbindlich ist das Aufmaß von Platzhirsch. Liefert der Kunde oder sein Architekt die Maße, prüft Platzhirsch sie auf Plausibilität und warnt bei erkennbaren Fehlern (§ 1168a ABGB).
5. **Kostenrahmen:** „Die Kostenschätzung im Plan ist ein Kostenvoranschlag ohne Gewähr für die Richtigkeit (§ 5 Abs 2 KSchG). Verbindlich ist erst das Angebot.“
6. **Nutzung:** Die Pläne dürfen für das eigene Projekt genutzt werden. Die Weitergabe zur Umsetzung durch Dritte ist erst nach Zahlung des Honorars erlaubt.
7. **KI-Bilder:** Kennzeichnung nach Art. 50 AI Act, unverbindliche Darstellung (`recht/01` § 2.5).

**Teil B – Koordinationsvereinbarung (Outdoor, Gesamteinrichtung, Pool), Kernsätze**
- „Sie beauftragen die Fachbetriebe [Liste] selbst. Ihre Verträge bestehen direkt mit diesen Betrieben.“
- „Wir koordinieren Termine und Lieferungen, führen einen gemeinsamen Zeitplan und geben unsere Pläne an die Betriebe weiter. Bauleitung, Bauaufsicht und die Prüfung fremder Arbeiten übernehmen wir nicht.“
- „Für unsere eigene Koordination haften wir nach dem Gesetz. Für Mängel und Verzug der Fachbetriebe haften diese selbst.“
- „Für die Koordination berechnen wir [● € / nichts, sie ist im Möbelauftrag enthalten]. Von den Fachbetrieben erhalten wir [keine Provision / eine Provision von ● %, die wir Ihnen hiermit offenlegen].“

### 3.4 Texte für das Kundenportal (M-02)

| Stelle | Heute | Neu |
|---|---|---|
| Überzeile | „Alles aus einer Hand“ | „Ihr Projekt im Überblick“ |
| Intro | „Wir koordinieren Tischler, Elektriker, Installateur, Steinmetz und weitere Handwerker – Sie haben einen Ansprechpartner: uns.“ | „Wer arbeitet wann an Ihrem Projekt? Wir stimmen die Termine mit den Fachbetrieben ab und halten den Zeitplan aktuell. Bei jedem Gewerk steht, mit wem Sie den Vertrag haben.“ |
| Ansprechpartner-Fallback | „Koordination über … – Sie müssen den Betrieb nicht selbst kontaktieren.“ | „Termine stimmt {Name} mit dem Betrieb ab. Fragen zur Ausführung beantwortet der Betrieb, mit dem Sie den Vertrag haben.“ |
| Neue Zeile je Gewerk | – | „Vertrag: direkt mit Ihnen“ bzw. „Vertrag: über Platzhirsch“ (Datenfeld `contractWith`) |

### 3.5 Cookie-Texte (M-11), fertig zum Einsetzen nach Kanzlei-Kurzfreigabe

- **`bannerText`:** „Wir verwenden Cookies und ähnliche Techniken nur, wenn sie für die Website nötig sind oder Sie zustimmen. Mit Ihrer Zustimmung nutzen wir Google-Dienste für Statistik, Werbung und Karten. Dabei können Daten in die USA übermittelt werden. Ihre Wahl können Sie jederzeit unter ‚Privatsphäre-Einstellungen‘ unten auf jeder Seite ändern.“
- **`intro`:** „Wir setzen Cookies und vergleichbare Techniken (zum Beispiel Local Storage) nur ein, wenn sie für einen von Ihnen gewünschten Dienst unbedingt erforderlich sind oder Sie eingewilligt haben (§ 165 Abs 3 TKG 2021). ‚Weiter ohne Einwilligung‘ lädt keine Statistik-, Werbe- oder Kartendienste. Unten sehen Sie jeden Dienst mit Zweck, Speicherdauer und Empfänger und können einzeln zustimmen. Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.“
- **`thirdCountryNotice`:** „Einige Dienste übermitteln Daten in die USA. Die Anbieter sind nach dem EU-US Data Privacy Framework zertifiziert; ergänzend gelten Standardvertragsklauseln. Details stehen bei jedem Dienst unter ‚Details anzeigen‘.“
- **`categories.functional.description`:** „Karten, Terminkalender, Videos und andere eingebettete Dienste von Drittanbietern. Sie werden erst geladen, wenn Sie zustimmen oder den jeweiligen Inhalt per Klick freigeben.“

### 3.6 AGB-Zusatz „Glasmosaik und Einbauwaren“ (Ergänzung zu `recht/01` § 13)

„13.7 **Glasmosaik (Ezarri) und andere Einbauwaren.** Mosaik, Fliesen und Platten werden von einem Fachbetrieb verlegt, den Sie beauftragen, sofern die Verlegung nicht ausdrücklich bei uns bestellt ist. Mit der Ware erhalten Sie die Verlege- und Pflegevorgaben des Herstellers (Kleber, Fugenmaterial, Wasseraufbereitung). Bitte geben Sie sie vor Beginn an Ihren Fliesenleger weiter und lassen Sie sich den Erhalt bestätigen. Farbe und Struktur können zwischen Produktionschargen leicht abweichen. Bestellen Sie deshalb die Gesamtmenge inklusive Reserve auf einmal. Ihre gesetzlichen Gewährleistungsrechte, auch auf Aus- und Einbau mangelhafter Ware, bleiben unberührt.“

> *Anmerkung:* Der Chargenhinweis ist eine Information, kein Haftungsausschluss. Abweichungen, die über das Übliche hinausgehen, sind nur mit gesonderter Zustimmung nach § 6 Abs 1 Satz 2 VGG kein Mangel (Bestätigungsblatt, `recht/01` § 13.6).

---

## 4. Maßnahmen

| Prio | Maßnahme | Aufwand | Kosten grob | Erwarteter Umsatzeffekt (Begründung) | Wer |
|---|---|---|---|---|---|
| P0 | Contract-Rahmenvertrag (3.2) von Kanzlei ausformulieren lassen, mit Zahlungs- und Sicherheitenmodul (Direktzahlung/Treuhand) | M | 4–9 T€ [Schätzung] | **Hoch.** Ohne ihn ist kein Hotelauftrag unterschriftsreif. Ein einziges kleines Hotelprojekt mit 150–400 T€ FF&E deckt die Kosten um ein Vielfaches [Schätzung] | Inhaber + Kanzlei |
| P0 | Treuhand- oder Direktzahlungsmodell mit 2–3 Herstellern und einem Anwalt als Treuhänder vereinbaren (2.1) | M | Treuhandgebühr je Projekt | **Hoch.** Beantwortet die Bonitätsfrage, an der Contract-Aufträge sonst scheitern | Inhaber |
| P0 | Insolvenzrechtliche Vorfrage (Kundengeld vor Fortbestehensprognose) gemeinsam mit Modul B klären | S | im Mandat `recht/00` S1 | Schützt vor Haftung, Voraussetzung für jede Anzahlung | Inhaber + Kanzlei |
| P0 | Ezarri: Händlervertrag auf Regress (3/5 Jahre, Aus- und Einbaukosten) prüfen, Versicherung um Aus- und Einbaukosten erweitern | S | Prämie offen [Makler] | **Mittel bis hoch.** Ermöglicht Pool- und Spa-Projekte ohne existenzielles Risiko. Ohne Deckung sollte das Feld nicht beworben werden | Inhaber + Makler |
| P0 | Portal-Texte Gewerke (3.4) und Feld `contractWith` | S | – | Indirekt: verhindert Haftung für fremde Gewerke und Streit nach dem Projekt | Code-Team |
| P0 | Widerrufspaket: Belehrung für Waren und für Dienstleistungen, Musterformular, Seite „Vertrag widerrufen“ | M | 1,5–3 T€ [Schätzung] | **Mittel.** Voraussetzung für Gutschein, Atelier und Planungsverkauf auf Distanz (Weihnachten) | Kanzlei + Code-Team |
| P1 | Angebotsvorlage mit M/S-Kennzeichen je Position und Rücktrittshinweis (2.6) | S | – | Mittel: verhindert Rückabwicklungen italienischer Bestellware, deren Verlust schnell fünfstellig wird [Schätzung] | Inhaber (Vorlage) |
| P1 | Planungsvertrag und Koordinationsvereinbarung (3.3) | S | 1–2 T€ [Schätzung] | **Mittel.** Macht bezahlte Planung verkaufbar (Pauschale mit Anrechnung) und schützt Outdoor und Pool | Kanzlei + Inhaber |
| P1 | Cookie-Texte (3.5) in de/en/fr/it | S | – | Gering direkt. Eine korrekte Einwilligung ist die Grundlage für jede Ads-Messung im Q1 2027 | Code-Team nach Kurzfreigabe |
| P1 | Koordinations- und Provisionsmodell Hotel offenlegen (M-03) | S | – | Hält das Honorar von 5–8 % rechtlich fest, statt es zu riskieren | Inhaber |
| P1 | AGB-Korrekturen M-08, M-09, M-12, M-13, M-14 an Kanzlei übergeben | S | im AGB-Mandat | Gering, Risikominderung | Kanzlei |
| P2 | § 1170b-Sicherstellung als Standardschreiben bei Einbauten | S | – | Mittel: Liquidität ohne Bank bei B2B-Einbauten | Inhaber |
| P2 | CHF-Detailpreise nach PBV für CH-Konsumenten | S | – | Gering bis mittel: Vertrauen der CH-Kunden. Pflicht, sobald Preise an CH-Kunden gehen | Code-Team |
| P2 | Yacht-Vertragsklausel zur Abgrenzung von der Werft (2.11) | S | im Mandat | Gering, Risikominderung | Kanzlei |
| P3 | Cookie-Laufzeit 6 Monate, Popup-Speicher prüfen | S | – | keiner | Code-Team |

---

## 5. Fragen für die Kanzlei (Mandatsliste)

**Fernabsatz und Widerruf**
- F1. Bitte Widerrufsbelehrung (Waren / Dienstleistungen / gemischt), Musterformular und Text der Seite „Vertrag widerrufen“ erstellen. Ist § 13a FAGG (Widerrufsbutton) bei Anfrage plus Rechnung schon anwendbar?
- F2. Ist Platzhirsch mit Portal, Video-Beratung und Angebots-PDF ein „organisiertes Fernabsatzsystem“? Gilt das auch für Aufträge nach einem Showroom-Besuch, die per E-Mail angenommen werden?
- F3. Wie eng ist die Maßanfertigungs-Ausnahme bei Sofas aus Katalogmodulen mit Standardbezug, bei Küchen aus Serienkorpussen mit Platte nach Maß und bei Leuchten in Wahlfarbe? Ist ein M/S-Kennzeichen je Angebotsposition ausreichend?
- F4. Gutschein: Ware oder Dienstleistung für den Fristbeginn? Darf der Rücktritt bei teilweiser Einlösung ausgeschlossen werden (voucherTerms Punkt 8)?

**Verbraucher-AGB**
- F5. Fundstelle der vertraglichen Garantie und der neuen Reparaturpflicht nach der KSchG/VGG-Novelle 2026. Welche Garantie-Informationen gelten ab EmpCo (27.09.2026)?
- F6. Kostenvoranschlag: Ist die Formulierung „ohne Gewähr für die Richtigkeit“ in Planungsangeboten ausreichend? Wie hoch darf die Anzeigeschwelle sein?
- F7. Wann ist eine fest eingebaute Küche oder ein verlegtes Mosaik eine unbewegliche Sache (3 Jahre nach § 933 ABGB statt 2 Jahre nach VGG)? Gilt § 438 Abs 1 Nr. 2 lit. b BGB (5 Jahre) für DE-Kunden auch bei Kauf ohne Verlegung?

**B2B und Contract**
- F8. Wirksamkeit und Insolvenzfestigkeit der Module Treuhand, Eigentumsübergang Zug um Zug und aufschiebend bedingte Abtretung der Herstelleransprüche (Rahmenvertrag § 7.3).
- F9. Haftungsbegrenzung B2B in Formularverträgen: Was hält für Betriebsunterbrechung (Hotel-Eröffnung) vor dem OGH?
- F10. Koordination: Ist die Provision vom Gewerk neben einem Honorar vom Kunden mit Offenlegung zulässig (§ 1013 ABGB)? Ist reine Terminkoordination ohne Baumeister-Befugnis gewerberechtlich zulässig (§ 99 GewO)?
- F11. § 1170b ABGB: Gilt er für Einbaumöbel und Mosaikverlegung über Platzhirsch? Gilt er für Planungsleistungen vor Baubeginn?
- F12. Hotels in DE und CH: Gerichtsstand, § 650f BGB, Art. 371 OR, Schiedsklausel für FL.

**Cookies und Preise**
- F13. Kurzfreigabe der Cookie-Texte 3.5. Einordnung des Popup-Zeitstempels und der Merkliste als „unbedingt erforderlich“.
- F14. Ab wann gilt die Schweizer PBV für die Website (CH-Regionsseiten, Dreiländer-Rechner, Atelierpreise)?

**Yacht**
- F15. Kann ein Interieur-Umbau ein „wesentlicher Umbau“ nach der Sportboot-RL 2013/53/EU sein? Wie wird die Abgrenzung zur Werft vertraglich sauber gezogen?

---

## Quellen

- RIS, § 1170b ABGB (Sicherstellung bei Bauverträgen): https://www.ris.bka.gv.at/eli/jgs/1811/946/P1170b/NOR40070129
- Jusline, § 1170b ABGB und Kommentar: https://www.jusline.at/gesetz/abgb/paragraf/1170b · https://www.jusline.at/gesetzeskommentare/456478689
- gesetzefinden.at, § 1170b (Ausnahmen Verbraucher/öffentliche Hand): https://gesetzefinden.at/bundesrecht/bundesgesetze/abgb/para-1170b
- Wolf Theiss, Praxisfälle zu § 1170b ABGB (2023): https://www.wolftheiss.com/app/uploads/2024/01/2023_03-Aktuelle-Praxisfalle-zu-§1170b-ABGB.pdf
- Parlament, Regierungsvorlage 530 d.B. (XXVIII. GP) zur Reparatur-Richtlinie: https://www.parlament.gv.at/dokument/XXVIII/I/530/fname_1763562.pdf
- BGBl. I Nr. 60/2026: https://ris.bka.gv.at/Dokumente/BgblAuth/BGBLA_2026_I_60/BGBLA_2026_I_60.pdf
- OGH-Stellungnahme zur Umsetzung (Frist 31.07.2026): https://www.ogh.gv.at/media/509-pras-2526m-stellungnahme-ogh.pdf
- IT-Recht Kanzlei, Preisangaben Schweiz für ausländische Händler (PBV): https://www.it-recht-kanzlei.de/anforderungen-preisangaben-schweiz-deutsche-haendler.html
- SECO-Informationsblatt Onlinehandel (über newsd.admin.ch): https://www.newsd.admin.ch/newsd/message/attachments/54942.pdf
- Aus eigener Kenntnis, Fundstelle vor Verwendung prüfen: EuGH C‑529/19 *Möbel Kraft* (21.10.2020); EuGH C‑65/09 und C‑87/09 *Weber/Putz* (16.06.2011); BGH VIII ZR 295/01 (19.03.2003); §§ 5, 7a KSchG; §§ 3, 10, 12, 16, 18 FAGG; §§ 933, 933b, 1013, 1168, 1168a, 1170a ABGB; § 165 TKG 2021; § 438 BGB; § 650f BGB; RL 2013/53/EU.
- Interne Grundlagen: `Marktresearch/recht/00–06`, `anwalt-vorschau.md`, `digital/wachstumsrat/hotel-contract.md`.
