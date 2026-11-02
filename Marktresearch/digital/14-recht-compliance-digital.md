# 14 – Recht & Compliance Digital (AT/DE/CH): Bauplan mit Launch-Checklisten

**Stand:** 26.10.2026 · Rolle: Recht & Compliance Digital · Grundlage: Code-Audit `src/` (nur gelesen, nichts geändert), Berichte 00, 23 (Abschn. 1, 4, 9, 10), 25, digital/01, 04, 05, 06, 09, Web-Recherche (Quellen am Ende).

> **Keine Rechtsberatung.** Dieses Dokument nennt Normen, Urteile und Behördenhinweise und übersetzt sie in Bau-Regeln. Vor dem Launch von Shop/Kasse, Gutscheinen, KI-Funktionen und Preisangaben gehört je ein Termin bei einer Kanzlei für IT-/Wettbewerbsrecht (AT) dazu, für CH-Themen zusätzlich eine Rückfrage bei einer CH-Kanzlei bzw. beim Steuerberater (Bericht 18). Markierung **[prüfen]** = Rechtslage oder Fakten nicht abschließend gesichert.

**Leitsatz:** Rechtssicherheit ist hier kein Bremsklotz, sondern ein Wettbewerbsvorteil. Die regionalen Händler haben weder Preise noch Shop, weder Barrierefreiheitserklärung noch saubere Bewertungs-Hinweise. Wer als Erster Preise, Kasse und KI anbietet, muss es auch als Erster *richtig* machen, sonst ist der Vorsprung über eine Abmahnung (DE: Mitbewerber und Verbände; AT: Mitbewerber, WKO-Schutzverband, VKI) schnell wieder weg.

---

## 1. Ist-Zustand im Code (rechtlich relevant)

### 1.1 Was gut ist

| Bereich | Befund | Datei |
|---|---|---|
| Consent | Eigenes Consent-Tool mit **Consent Mode v2**, Default „denied“ vor dem Laden von gtag, „Alle akzeptieren“ und „Weiter ohne Einwilligung“ **auf der ersten Ebene**, Einzeldienste (Google Maps, GTM, GA, Google Ads), Löschen der `_ga`-Cookies bei Widerruf, Wiederaufruf über Footer „Privatsphäre-Einstellungen“ | `src/components/Cookies/cookiecomponent.js`, `src/components/Reusable/Footer.js` |
| Einbettungen | Google Maps erst nach Klick bzw. Consent (`ConsentEmbed`) | `src/components/Cookies/ConsentEmbed.js`, `src/components/Kontakt/kontakt.js` |
| Tracking | `trackEvent`/`trackLead` sind ohne gtag ein No-op, also ohne Einwilligung keine Speicherung | `src/lib/analytics.js` |
| Fonts | Selbst gehostet über `next/font` (kein Google-Fonts-Abruf → kein „Google-Fonts-Abmahnungs“-Risiko wie LG München I, 3 O 17493/20) | `src/app/[locale]/layout.js` |
| Händler-Aussagen | Markentitel ohne „Händler“, Kommentar „erst mit schriftlichem Vertrag wieder ‚Händler‘“; llms.txt bereinigt | `src/app/[locale]/ueber-uns/marken/[title]/page.js`, `src/app/llms.txt/route.js` |
| Strukturierte Daten | `Product` bewusst **ohne** `offers`/Preis (keine falschen Preisangaben in Google) | `src/lib/seo/structuredData.js` (Z. 35 ff.) |
| Formulare | Honeypot, minimale Fehlermeldungen, Backend-Adresse serverseitig | `src/app/api/newsletter_subscribe/route.js`, `src/app/api/kontakt/route.js` |
| Kein Kauf | Merkliste/Anfrage statt Warenkorb → heute **kein Fernabsatzvertrag über die Website**, daher entfallen FAGG-Kassenpflichten, Widerrufsbutton und (je nach Lesart) BaFG-Pflichten | `src/context/CartContext.js`, `src/components/CartPage/CartPage.js` |

### 1.2 Was fehlt oder falsch ist (sofort behebbar, ohne Backoffice)

| # | Befund | Datei | Rechtsgrundlage | Schwere |
|---|---|---|---|---|
| R1 | Datenschutzerklärung stützt GA auf den **„Privacy Shield“** – seit EuGH C-311/18 (Schrems II, 16.07.2020) ungültig. Richtig: EU-US Data Privacy Framework (Angemessenheitsbeschluss 10.07.2023) + Einwilligung | `src/components/Datenschutz/datenschutz.js` | Art. 13, 44 ff. DSGVO | **hoch** (falsche Pflichtinformation) |
| R2 | Verweis auf **„TKG 2003“ / „§ 96 Abs 3 TKG“** – seit 01.11.2021 gilt **§ 165 Abs 3 TKG 2021** | dito | § 165 TKG 2021 | mittel |
| R3 | GA-Rechtsgrundlage „Einwilligung **und/oder berechtigtes Interesse**“ und „verhindern Sie es über Browsereinstellungen“ – passt nicht zum (korrekten) Opt-in-Tool. Analyse-Cookies nur mit Einwilligung (AT: DSB 2022 zu GA; DE: § 25 TDDDG) | dito | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 | hoch |
| R4 | Nicht genannt: **Google Ads/Consent Mode, Google Maps, Google Tag Manager, Hosting/Server (pm2, `ecosystem.config.js`), Frappe-Backoffice als Auftragsverarbeiter, E-Mail-Versand, Bild-Proxy**, Empfänger, Drittlandübermittlung je Dienst, Speicherdauer je Zweck, Rechte inkl. Beschwerde bei der **österreichischen DSB (Barichgasse 40–42, 1030 Wien)** | dito | Art. 13 DSGVO; CH: Art. 19 revDSG (Länder der Übermittlung nennen) | hoch |
| R5 | Newsletter-Text sagt „Interessen, Geburtstag, PLZ“ werden erhoben – das Formular fragt **nur die E-Mail** ab. Double-Opt-in ist beschrieben, aber nur im Frappe-Backend umgesetzt (nicht verifizierbar) | `datenschutz.js` vs. `src/components/Newsletter/newsletter.js` | Art. 5 Abs 1 lit a, 7 Abs 1 DSGVO (Nachweis), § 174 TKG 2021 | mittel |
| R6 | **Kein Datenschutzhinweis an den Formularen** (Kontakt, Produktanfrage, Beratung, Newsletter). Kein Link „Wie wir Ihre Daten verarbeiten“ unter dem Absenden-Knopf | `kontakt.js`, `AnfrageFormProduct.js`, `BeratungClient.js`, `newsletter.js` | Art. 13 DSGVO („zum Zeitpunkt der Erhebung“) | mittel |
| R7 | Impressum: es fehlen **Kammer/Berufsverband** (WKO Vorarlberg, Fachgruppe), **anwendbare gewerberechtliche Vorschriften** (GewO + Link RIS) und die **Offenlegung nach § 25 MedienG** (Medieninhaber, Unternehmensgegenstand; bei „kleiner“ Website reicht das Grundgerüst). Marketingtext („Herzlich willkommen …“) ist entbehrlich | `src/components/Impressum/impressum.js` | § 5 ECG, § 14 UGB, § 25 MedienG | mittel |
| R8 | **Adresse uneinheitlich** (Impressum/Datenschutz: Landstraße 9; Bericht 00: 9 oder 11 offen). Für Impressum und `LocalBusiness`-JSON-LD muss die ladungsfähige Anschrift stimmen | `impressum.js`, `datenschutz.js`, `src/app/[locale]/layout.js` | § 5 Abs 1 Z 2 ECG | mittel |
| R9 | **Rechtsträger wechselt bald** (geplante Handels-GmbH, Bericht 23 Abschn. 11). Dann alle Stellen gleichzeitig ändern: Impressum, Datenschutz (Verantwortlicher), AGB, JSON-LD `Organization`, Google-Profil, Formular-E-Mails | dito | § 5 ECG, Art. 13 DSGVO | Merkposten |
| R10 | Rechtstexte nur **Deutsch**, auch unter `/en`, `/fr`, `/it`. Für reine Anfragen tragbar; sobald verkauft wird, müssen Vertragsinformationen in der Sprache des Angebots klar verständlich sein | `src/app/[locale]/impressum/page.js`, `datenschutz/page.js` | § 4 FAGG, Art. 6 VRRL | niedrig (heute), hoch (mit Shop) |
| R11 | **Herstellerbilder per Hotlink/Proxy** von Markenservern (`www.next125.com` u. a. in `next.config.js` `remotePatterns`) und Stockbilder (`images.unsplash.com`); Hero = Minotti-Foto (01) | `next.config.js`, `src/app/api/image/route.js`, `src/lib/data/importedProducts/*` | § 74 UrhG AT (Lichtbild), § 72 UrhG DE, EuGH C-161/17 *Renckhoff* (Neuveröffentlichung braucht Erlaubnis) | **hoch**, je nach Freigabe |
| R12 | Superlative ohne Beleg im Umlauf: „größte Minotti-Ausstellung Westösterreichs“ (Bericht 23, Abschn. 1; prüfen, ob auf Website, Google-Profil oder Backoffice-Texten) | Backoffice-Texte, Google-Profil | § 2 UWG AT (Alleinstellung muss wahr und belegbar sein), § 5 UWG DE | mittel |
| R13 | Backoffice-Felder `dealers_title`/`dealers_description` werden ungeprüft auf Markenseiten ausgegeben – mögliche Händler-Aussagen im CMS | `src/components/MarkenItems/markenitems.js` Z. 115–430 | § 2 UWG AT, § 5 Abs 1 Nr. 3 UWG DE, Anhang Nr. 2/4 („Gütezeichen/Zulassung“) | hoch, blockiert (Backoffice) |
| R14 | Keine **Barrierefreiheitserklärung**; ob BaFG greift, hängt am Rechtsträger (siehe 5.3) | – | BaFG § 3, § 14 | mittel |

**Kein Fehler, nur Hinweis:** Ein Link zur EU-OS-Plattform fehlt – das ist richtig so. Die Plattform wurde am **20.07.2025** abgeschaltet (VO (EU) 2024/3228), Verweise darauf müssen entfernt bleiben.

---

## 2. Benchmark: Wie die Besten Compliance zeigen – und was die Region nicht hat

| Anbieter | Was rechtlich sichtbar ist | Lehre für Platzhirsch |
|---|---|---|
| **connox.at** | Footer: Impressum, Datenschutz, AGB, **Widerrufsrecht + Widerrufsformular**, Cookie-Einstellungen, **Gutscheinbedingungen**, Versand AT, Rückgabe, **Entsorgung** (geprüft 26.10.2026). Kein Text-Hinweis auf Barrierefreiheit, kein klar beschrifteter „Vertrag widerrufen“-Button gefunden | Volle Shop-Pflichtseiten als Standard; aber selbst Connox wirkt beim Widerrufsbutton/BaFG noch unvollständig → Chance, es sichtbar besser zu machen |
| **AmbienteDirect, RH, Conran Shop** | Shop-Standard: AGB, Widerruf, Versand-/Zahlungsseiten, Herstellerangaben, Bewertungs-Hinweise; Conran (UK) mit Accessibility-Statement [aus Fachwissen, nicht neu geprüft] | Rechtstexte als **eigene, verlinkbare Seiten** in allen Sprachen, nicht als PDF |
| **minotti.com / poliform.it** | Händlerverzeichnis („Store Locator“) definiert, wer „Händler“ ist; Bild- und Pressebereiche mit Nutzungsbedingungen | Händlerstatus = Eintrag im Verzeichnis. Bilder aus Pressebereichen nur gemäß deren Bedingungen |
| **Höttges (hoettges.at)** | Impressum, Datenschutz, **AGB nur als PDF**; keine Preise, kein Shop, keine Bewertungen, kein Chat, keine Barrierefreiheitserklärung erkennbar; **keine** „offizieller Händler“-Formel im Text, aber Markenlogos (Minotti, Poliform, Edra) (geprüft 26.10.2026) | Selbst der gelistete Händler wirbt zurückhaltend. Platzhirsch darf nicht offensiver formulieren als der echte Händler |
| **reiter design, Dolce Vita, Hutle, Fretz, Gamma** | Nach Berichten 20/23: keine Preise, keine Kasse (Ausnahme Teile bei Fretz/Gamma: Online-Termin). reiter-design.at war am 26.10.2026 nicht erreichbar (DNS-Fehler) | **Niemand in der Region hat Barrierefreiheitserklärung, Bewertungsprüf-Hinweis, KI-Kennzeichnung oder CHF-Preisangaben nach PBV.** Das sind Vertrauenssignale, die man ausspielen kann („transparent, geprüft, barrierearm“) |

---

## 3. Konzept/Zielbild: „Compliance by Design“ mit fast null Pflegeaufwand

1. **Eine Quelle für Rechtsdaten.** Neue Datei `src/lib/legal/company.js` (Firma, FN, UID, Adresse, Kammer, GF, Aufsichtsbehörde, Kontakt). Impressum, Datenschutz, JSON-LD `Organization`/`LocalBusiness`, E-Mail-Signaturen der Formulare und AGB lesen nur dort. Ein Rechtsträgerwechsel ist dann **eine** Änderung.
2. **Dienste-Register = Consent-Register = Datenschutzerklärung.** `cookieServices` in `cookiecomponent.js` ist schon fast ein Verzeichnis. Erweitern um Felder `processor`, `country`, `transferBasis` (DPF/SCC), `retention`, `privacyUrl` und daraus den Datenschutz-Abschnitt „Eingesetzte Dienste“ **automatisch rendern**. Neuer Dienst = ein Eintrag, nie wieder vergessene Abschnitte.
3. **Claims-Register.** Jede werbliche Tatsachenbehauptung (Superlative, „Händler“, „abgesichert“, „0 %“, „sofort verfügbar“, Bewertungsschnitt) steht in `src/lib/legal/claims.js` mit Beleg, Datum und Prüfer. Komponenten verwenden nur freigegebene Claims. Alles andere fliegt im Lint/Review auf.
4. **Bildregister.** Jedes Bild hat Herkunft, Lizenz, Freigabedatum, erlaubte Nutzung (Web, Ads, Social, Bearbeitung ja/nein, KI-Input ja/nein). Ohne Eintrag kein Einsatz in Hero, Ads und Merchant Center.
5. **Kasse erst, wenn die Pflichtkette steht.** Für Atelierverkauf, Accessoires und Gutscheine wird eine kleine, gehostete Kasse (Stripe Checkout/Mollie) genutzt. Pflichtseiten, Widerrufsbutton, Bestellbestätigung und Gewährleistungsregeln für Ausstellungsstücke sind fester Teil des Bausteins, kein Nachtrag.
6. **KI nur mit Etikett und lokaler Verarbeitung wo möglich.** Chatbot mit Hinweis „KI-Assistent“ (Art. 50 Abs 1 AI Act), KI-Visualisierungen sichtbar und maschinenlesbar (C2PA) gekennzeichnet, Kundenfotos lokal auf der NVIDIA-GPU verarbeiten statt an US-Dienste zu schicken.
7. **Barrierefreiheit als Qualitätsstandard WCAG 2.2 AA** – unabhängig davon, ob das BaFG den Rechtsträger formal erfasst – mit automatischen Tests im Build.

---

## 4. Features mit Rechtscheck und Launch-Checkliste

Legende Aufwand: **S** ≤ 3 Tage, **M** 1–3 Wochen, **L** > 3 Wochen. „Blockiert“ = braucht Backoffice-Felder, Verträge oder Freigaben Dritter.

### F1 – Rechts-Basis sanieren (Impressum, Datenschutz, Formular-Hinweise)
- **Nutzen:** Abmahnrisiko runter, Vertrauen (E-E-A-T, „wer steht dahinter“) rauf; Voraussetzung für Ads, Merchant Center und jede weitere Funktion. Google Merchant Center und Ads prüfen Impressum/Datenschutz/Rückgaberegeln.
- **Aufwand:** S (Code) + Rechtstext-Review extern.
- **Abhängigkeiten:** Entscheidung Hausnummer, Rechtsträger (MW Immobilienverwaltungs GmbH vs. neue Handels-GmbH), Hosting-Standort und AV-Verträge (Server, Frappe, Mail).
- **Dateien:** neu `src/lib/legal/company.js`; ändern `src/components/Impressum/impressum.js`, `src/components/Datenschutz/datenschutz.js` (Inhalte aus Registry), `src/components/Cookies/cookiecomponent.js` (Dienstfelder), Formulare `Kontakt/kontakt.js`, `AnfrageFormProduct/AnfrageFormProduct.js`, `BeratungClient/BeratungClient.js`, `Newsletter/newsletter.js` (Hinweiszeile), `src/messages/{de,en,fr,it}.json`.
- **Bibliotheken:** keine nötig (0 kB).
- **Muss vor Launch erledigt sein:**
  - [ ] Privacy Shield → DPF + Einwilligung; TKG 2003 → § 165 Abs 3 TKG 2021; „berechtigtes Interesse“ für GA streichen (R1–R3)
  - [ ] Alle Dienste mit Zweck, Rechtsgrundlage, Empfänger, Drittland, Speicherdauer (R4); CH-Zusatz: Länder der Übermittlung (Art. 19 revDSG), Hinweis auf EDÖB-Beschwerderecht für CH-Personen
  - [ ] Newsletter-Text an tatsächliche Felder anpassen; Double-Opt-in im Frappe-Backend nachweisbar protokolliert (Zeitstempel, IP, Text der Einwilligung)
  - [ ] Unter jedem Formular: „Wir verwenden Ihre Angaben zur Bearbeitung der Anfrage. Details: Datenschutzerklärung.“ Keine Pflicht-Checkbox (Art. 6 Abs 1 lit b DSGVO, vorvertraglich); Checkbox nur für Newsletter-Zusatz
  - [ ] Impressum: Kammer, Gewerbe, GewO-Link, § 25 MedienG-Offenlegung, eine Adresse, Werbetext raus
  - [ ] Kein OS-Plattform-Link (abgeschaltet 20.07.2025)
  - [ ] Speicherfrist „6 Monate“ für Anfragen mit dem Backoffice abgleichen (wenn Anfragen zu Aufträgen werden, gelten §§ 132 BAO/212 UGB: 7 Jahre für Buchungsbelege)

### F2 – Händler- und Marken-Kommunikation (UWG, Markenrecht) inkl. Claims-Register
- **Nutzen:** Schützt die Verhandlung mit Minotti/Poliform (Gate 0) und das Ranking (Abmahnung/Unterlassung würde Markenseiten treffen). Markennamen bleiben als Suchbegriff erhalten.
- **Aufwand:** S (Code) + laufende 15 Min./Monat Review.
- **Abhängigkeiten:** Backoffice-Zugang für `dealers_title`/`dealers_description` (R13) – bis dahin im Code filtern (s. u.); Händlerverträge.
- **Dateien:** neu `src/lib/legal/claims.js`; ändern `src/components/MarkenItems/markenitems.js` (Backoffice-Händlerfelder nur rendern, wenn Marke in Allowlist `officialDealer: ["classicon"]`), `src/lib/seo/brandSchema.js`, Landingpages `src/app/[locale]/designermoebel-*`, `src/lib/content/landingPages.js`, `src/app/llms.txt/route.js`.
- **Bibliotheken:** keine; optional eigene ESLint-Regel (`no-restricted-syntax` auf Strings wie „Händler“, „offiziell“, „autorisiert“, „Nr. 1“, „größte“) in `eslint.config.mjs` – 0 kB.
- **Rechtliche Leitplanken:**
  - **Markennamen dürfen genannt werden**, um echte Ware anzubieten (Erschöpfung, Art. 15 UMV; EuGH C-63/97 *BMW/Deenik*), solange **kein Eindruck einer Handelsbeziehung/Vertragshändlerschaft** entsteht. Formel: „Minotti in unserer Ausstellung in Lochau“, „Wir planen mit Minotti“. **Nicht:** „Minotti Store“, „Minotti Partner“, „offizieller Händler“, Markenlogo als Siegel/Gütezeichen.
  - **URLs/Meta** wie `/ueber-uns/marken/minotti`, Title „Minotti in Vorarlberg – Ausstellung Lochau“: zulässige beschreibende Benutzung. **Keine** Domains/Subdomains mit Fremdmarke (z. B. `minotti-vorarlberg.at`) – das ist markenmäßige Benutzung mit Verwechslungsgefahr.
  - **Google Ads:** Fremdmarken als Keyword grundsätzlich zulässig (EuGH C-236/08 *Google France*, C-323/09 *Interflora*), wenn die Anzeige klar macht, dass kein Herstellerangebot vorliegt. Marken im Anzeigentext: Google-Markenrichtlinie (Händler-Ausnahme verlangt, dass die Landingpage die Ware tatsächlich anbietet; Markeninhaber können Beschwerden hinterlegen) [prüfen je Marke]. **Wettbewerbernamen** (Höttges, reiter) als Keyword: rechtlich möglich, **nicht** im Anzeigentext; Imagerisiko in einer kleinen Region → Empfehlung: nicht tun.
  - **„Nr. 1“, „größte“, „führend“:** Alleinstellungswerbung muss zum Zeitpunkt der Werbung wahr und beweisbar sein (Beweislast faktisch beim Werbenden). „Größte Minotti-Ausstellung Westösterreichs“ nur mit dokumentiertem Flächen-/Stückvergleich, sonst streichen. Zielbild „Platz 1 bei Google“ ist ein internes Ziel, **kein** Werbeclaim.
  - **Vergleichswerbung** (§ 2a UWG AT, § 6 UWG DE, Art. 3 lit. e UWG CH): nur nachprüfbare, wesentliche Eigenschaften, keine Herabsetzung. „Samstag geöffnet – im Gegensatz zu Höttges“ = unnötig riskant; „Samstag 10–17 Uhr“ reicht.
  - **CH-Kunden:** Schweizer UWG gilt bei Marktauswirkung in CH (Art. 136 IPRG); Art. 3 Abs 1 lit. b (unrichtige Angaben) entspricht im Ergebnis dem EU-Recht.
- **Muss vor Launch erledigt sein:**
  - [ ] Allowlist „offizieller Händler“ nur ClassiCon (belegt), mit Link auf deren Verzeichnis als Beleg im Claims-Register
  - [ ] Backoffice-Händlerfelder bis zur Prüfung im Code ausblenden
  - [ ] Superlative inventarisieren (Website, Google-Profil, Instagram-Bio, Backoffice-Texte) und belegen oder streichen
  - [ ] Markenlogos durch typografische Namen ersetzen (01 F4) oder Logo-Nutzung schriftlich freigeben lassen

### F3 – Bildrechte-Register und Bild-Pipeline (Urheberrecht, 3D/CAD)
- **Nutzen:** Ohne Bildrechte keine Ads-Bilder, kein Merchant Center, kein Pinterest/Meta-Katalog; ein einziges Abmahnschreiben eines Fotografen kann 1.765 Produktseiten betreffen. Eigene Fotos ranken zudem besser in der Google-Bildersuche (Originalität).
- **Aufwand:** M (Register + Code-Gate); Freigaben einholen laufend.
- **Abhängigkeiten:** Freigaben der Marken (mit Listungsanfragen bündeln, 25 H7); Backoffice-Feld `image_license` je Bild [blockiert]; eigene Fotos (Showroom, Projekte).
- **Dateien:** neu `src/lib/legal/imageRegister.js` (Übergang, bis Backoffice-Feld existiert), `scripts/image-audit.mjs` (listet alle Bild-URLs aus `src/lib/data`, Backoffice-Feeds und `public/` mit Host); ändern `next.config.js` (`remotePatterns` nur freigegebene Hosts, `images.unsplash.com` raus, sobald ungenutzt), `src/app/api/image/route.js` (nur Backoffice-Pfade).
- **Bibliotheken:** `sharp` 0.35.x (Apache-2.0, nur Server/Build, 0 kB Client) für eigene Fotos: Metadaten entfernen (EXIF/GPS von Kundenfotos), dafür `©`-IPTC-Feld setzen.
- **Rechtliche Leitplanken:**
  - Herstellerfotos sind mindestens Lichtbilder (AT § 74 UrhG: 50 Jahre; DE § 72 UrhG). „Vom Hersteller bekommen“ ist keine Lizenz für jede Nutzung; erneutes Hochladen braucht Erlaubnis (EuGH C-161/17 *Renckhoff*). Hotlinking/Framing frei zugänglicher Bilder ist nach EuGH C-466/12 *Svensson* bzw. C-392/19 *VG Bild-Kunst* zwar meist keine neue öffentliche Wiedergabe, umgeht aber Schutzmaßnahmen nicht und hilft nicht bei Bearbeitung, Ads oder Feeds.
  - **Bearbeitung** (Zuschnitt, Duotone, Freistellen, KI-Hintergrund) ist ein eigenes Recht; Minotti-Bedingungen verbieten Veränderung (01). Für KI-Input (img2img, Raumplaner) ausdrücklich in der Freigabe nennen.
  - **Designs selbst:** Nach EuGH C-580/23 und C-795/23 (*Mio/konektra*, 04.12.2025) gelten für Möbel als Werke der angewandten Kunst **keine höheren Originalitätsanforderungen** als für andere Werke; BGH hat USM Haller am 02.07.2026 (I ZR 96/22) zurückverwiesen. Folge: **Eigene 3D-Modelle oder detailgetreue Renderings von Designermöbeln** können Vervielfältigungen geschützter Werke sein. 3D nur mit Herstellerdaten und deren Lizenz (Roomle/Hersteller-CAD), 2D-Schemazeichnungen aus Maßen (04) sind unkritisch.
  - **CAD/BIM-Downloads** der Hersteller (DWG/Revit) unterliegen deren Nutzungsbedingungen – verlinken statt selbst hosten.
  - Stockbilder (Unsplash-Lizenz): erlaubt, aber nicht als „unser Projekt“ ausgeben (UWG).
- **Muss vor Launch erledigt sein (für Ads, Feeds, neue Hero-Bilder):**
  - [ ] Bildaudit-Skript laufen lassen, Register befüllen (Quelle, Rechteinhaber, Freigabe-Mail, Umfang)
  - [ ] Hero, Haus, Projekte: eigene Fotos (Fotografenvertrag mit **Nutzungsrechten unbefristet, alle Medien, inkl. Bearbeitung und KI-Nutzung**)
  - [ ] Personen auf Projektfotos: schriftliche Einwilligung (Bildnisschutz § 78 UrhG AT, § 22 KUG DE; DSGVO)
  - [ ] Kundenwohnungen: Einwilligung, keine Adresse/Hausnummer, EXIF/GPS entfernt

### F4 – Preise, „ab“-Preise, `Offer`-Schema, Merchant Center (PrAG/PAngV/PBV)
- **Nutzen:** Größter SEO-Hebel nach 25 (H1/H2): Preis-Snippets, kostenlose Shopping-Einträge, Antworten auf „Was kostet ein Minotti-Sofa?“. Kein Regionalhändler zeigt Preise.
- **Aufwand:** M (Code), **blockiert** durch Backoffice-Preisfeld.
- **Abhängigkeiten:** Backoffice-Felder `price_from`, `price_currency`, `price_valid_from`, `price_basis` („UVP Hersteller“, „Ausstellungspreis“), `availability`; Hersteller-Konditionen (UVP-Listen); für Merchant Center echte, kaufbare Preise.
- **Dateien:** `src/lib/seo/structuredData.js` (`productSchema` + `offers` nur bei gefülltem Feld), `src/app/[locale]/produkte/[category]/[product]/page.js`, neu `src/components/Price/PriceTag.js`, neu `src/lib/legal/priceRules.js` (eine Funktion erzeugt alle Pflichtzusätze).
- **Bibliotheken:** `schema-dts` 2.1.0 (Apache-2.0, nur TypeScript-Typen, 0 kB) – optional, da Projekt JavaScript ist; sonst keine.
- **Rechtliche Leitplanken:**
  - **Gesamtpreis inkl. USt** (AT § 9 PrAG; DE § 3 PAngV); Liefer-/Montagekosten angeben oder klar „zzgl. Lieferung, nach Aufwand“. „Preis auf Anfrage“ ist zulässig, aber dann kein `Offer` im Schema.
  - **„ab“-Preise** sind zulässig, wenn der genannte Preis für eine **real bestellbare Ausführung** gilt (konkret benennen: „ab 8.940 € in Stoff Kategorie A, 3-Sitzer, Breite 238 cm“). Ein „ab“-Preis, zu dem man nicht kaufen kann = Irreführung.
  - **Preisermäßigungen** („statt“, „-30 %“, Atelierverkauf): Bezugspreis = **niedrigster Preis der letzten 30 Tage** (AT § 9a PrAG; DE § 11 PAngV). Bei Ausstellungsstücken, die nie zum Normalpreis angeboten wurden: nicht „statt“, sondern „UVP des Herstellers für Neuware: …“ (UVP-Vergleich zulässig, wenn die UVP echt und aktuell ist).
  - **Grundpreis** nur für Ware, die nach Menge angeboten wird (Raumdüfte/Diffuser in ml, ggf. Kerzen nach Gewicht [prüfen]): je Liter/100 ml (DE § 4 PAngV; AT Grundpreisauszeichnung nach PrAG/VO). Möbel: kein Grundpreis.
  - **CHF-Preise für CH-Kunden:** Preisbekanntgabeverordnung (PBV) verlangt bei Angeboten an Konsumenten in der Schweiz tatsächlich zu bezahlende Preise in **Schweizer Franken inkl. MWST und öffentlicher Abgaben**. Ein CHF-Rechner, der nur „ca.“ zeigt, als „Kostenschätzung“ kennzeichnen [prüfen mit CH-Kanzlei, ob ein AT-Händler mit CH-Angebotsseite erfasst ist].
  - **Preisbindung**: Hersteller dürfen UVP nennen, aber **keine Mindestpreise vorschreiben** (Art. 101 AEUV, Art. 4 lit. a Vertikal-GVO 2022/720). Als Nicht-Vertragshändler riskiert man trotzdem die Lieferbeziehung → vor Start mit den Marken abstimmen (25 H2).
  - **Merchant Center:** Preis muss auf der Landingpage identisch und kaufbar sein; „ab“-Preise werden abgelehnt. Also nur Outlet/Accessoires in den Feed, Hauptmodelle nur als Preis-Snippet auf der Seite.
- **Muss vor Launch erledigt sein:**
  - [ ] Preisregel-Funktion mit Pflichtzusätzen (inkl. MwSt., Lieferung, „ab“-Ausführung, Datum der Preisangabe)
  - [ ] 30-Tage-Tiefstpreis-Historie im Backoffice (sonst keine Streichpreise)
  - [ ] Schriftliche Zustimmung/Klarstellung der Marken zu Online-Preisen
  - [ ] `Offer.priceValidUntil` gesetzt, Preise automatisch ausblenden, wenn älter als 12 Monate

### F5 – Atelierverkauf/Outlet und Accessoire-Shop mit Kasse (FAGG, Widerrufsbutton, Gewährleistung, GPSR)
- **Nutzen:** 100–300 T€ Liquidität (00, Punkt 2), Merchant-Center-fähige echte Preise, erste Online-Umsätze.
- **Aufwand:** L (Kasse, Bestellprozess, Pflichtseiten, E-Mails); mit gehostetem Checkout M.
- **Abhängigkeiten:** Zahlungsanbieter-Vertrag (Stripe, Mollie oder Unzer; Klarna optional), AGB, Inventur mit Zustand/Fotos (eigene Fotos!), Versand-/Montagekonditionen, Entscheidung Rechtsträger, Steuerberater (OSS bei Lieferungen nach DE > 10.000 €/Jahr EU-weit; CH-Ausfuhr nach Bericht 18).
- **Dateien:** neu `src/app/[locale]/atelier/` (Liste/Detail), `src/app/api/checkout/route.js` (Server: Session erzeugen), `src/app/api/checkout/webhook/route.js`, neu `src/app/[locale]/agb`, `widerruf`, `versand-zahlung`, `src/app/[locale]/vertrag-widerrufen/page.js` + `src/app/api/widerruf/route.js`, `src/components/Checkout/*`; Merkliste (`CartContext.js`) bleibt für Anfragen, eine **getrennte** Kasse nur für kaufbare Artikel.
- **Bibliotheken:** `stripe` 22.6.x (MIT, nur Server, 0 kB Client; 23.0 ist erst 4 Tage alt) mit **Stripe Checkout (gehostet)** → keine Kartendaten auf eigenem Server (PCI DSS SAQ A), Apple/Google Pay, EPS, Klarna. Alternative `@mollie/api-client` 4.6.0 (BSD-3-Clause, Server, EU-Anbieter NL). `zod` 4.6.x (MIT, Server-Validierung, im Client ~2 kB als `zod/mini`).
- **Rechtliche Leitplanken:**
  - **Informationspflichten** vor Vertragsschluss (§ 4 FAGG; DE Art. 246a EGBGB), **Bestellbutton „zahlungspflichtig bestellen“** (§ 8 Abs 2 FAGG; § 312j Abs 3 BGB), Eingangs- und Vertragsbestätigung auf dauerhaftem Datenträger (§ 7 FAGG), AGB speicherbar.
  - **Rücktrittsrecht 14 Tage** (§ 11 FAGG). **Ausnahme Maßanfertigung** (§ 18 Abs 1 Z 3 FAGG; § 312g Abs 2 Nr. 1 BGB) gilt für nach Kundenwünschen gefertigte Ware (Sofa in gewähltem Bezug und Modulmaß), auch wenn die Produktion noch nicht begonnen hat (EuGH C-529/19 *Möbel Kraft*, 21.10.2020). **Ausstellungsstücke und Accessoires sind keine Maßanfertigung → Rücktrittsrecht gilt.** Rücksendekosten für sperrige Ware: Kunde trägt sie nur bei vorheriger Information mit Kostenschätzung (§ 15 FAGG).
  - **Widerrufsbutton „Vertrag widerrufen“** (RL (EU) 2023/2673, Art. 11a VRRL): **DE seit 19.06.2026** (§ 356a BGB), **AT seit 01.10.2026** (§ 13a FAGG idF VerbRÄG 2026, BGBl. 28.07.2026, für Verträge ab 01.10.2026 – laut WKO). Pflicht: gut sichtbar während der Frist, Formular (Name, Vertragsnummer, Kommunikationsweg, Teilwiderruf), Bestätigungsknopf „Widerruf bestätigen“, sofortige Eingangsbestätigung per E-Mail mit Datum/Uhrzeit. Muster-Widerrufsformular bleibt Pflicht.
  - **Gewährleistung für Ausstellungsstücke** (AT VGG 2022; DE §§ 434, 476 BGB): Mängel wie Kratzer gelten nur dann nicht als Mangel, wenn der Verbraucher **vor Vertragsschluss eigens darauf hingewiesen wurde und der Abweichung ausdrücklich und gesondert zugestimmt** hat (VGG [Paragraf prüfen] / § 476 Abs 1 S. 2 BGB) → je Artikel Zustandsbeschreibung + Fotos + **eigene Checkbox** „Ich akzeptiere den beschriebenen Zustand“. Pauschales „Gekauft wie gesehen“ ist unwirksam. Verkürzung der Frist auf 1 Jahr nur bei **gebrauchten** Waren (Circle, F12), nicht bei neuwertigen Ausstellungsstücken [prüfen, wann ein Ausstellungsstück „gebraucht“ ist].
  - **GPSR** (VO (EU) 2023/988, seit 13.12.2024), Art. 19: bei Online-Angeboten **Name und Anschrift des Herstellers** (und ggf. der verantwortlichen Person in der EU), Produktidentifikation, Warn- und Sicherheitshinweise (z. B. Kerzen, Akkuleuchten, Outdoor-Schirme: Windlast). Backoffice-Felder `manufacturer_name`, `manufacturer_address`, `safety_notes` [blockiert]; bis dahin statische Tabelle je Marke in `src/lib/marken/*`.
  - **Elektrogeräte/Batterien** (Akkuleuchten): Rücknahme- und Entsorgungshinweise (AT EAG-VO/BatterieVO; DE ElektroG/BattDG), ggf. Registrierung bei Lieferung nach DE [prüfen] – Connox hat dafür eine eigene Seite „Entsorgung“.
  - **Verpackungen** bei Versand nach DE: LUCID-Registrierung (VerpackG) [prüfen, wenn Versand nach DE].
  - **CH-Kunden:** kein gesetzliches Widerrufsrecht, aber Pflichtangaben Art. 3 Abs 1 lit. s UWG CH (Identität, Kontakt, Schritte zum Vertragsschluss, Korrekturmöglichkeit, Bestätigung). MWST/Zoll nach Bericht 18.
- **Muss vor Launch erledigt sein:**
  - [ ] AGB, Widerrufsbelehrung (mit Hinweis auf Widerrufsfunktion), Muster-Formular, Versand/Zahlung, Entsorgung – in allen Shop-Sprachen
  - [ ] „Vertrag widerrufen“-Seite + Bestätigungs-E-Mail getestet
  - [ ] Zustandsbeschreibung + gesonderte Zustimmung je Ausstellungsstück
  - [ ] GPSR-Angaben je Artikel
  - [ ] Zahlungsanbieter-AVV/DSGVO-Hinweise, Bestell-E-Mails mit Pflichtinhalt
  - [ ] Steuerberater: OSS, Rechnungen, CH-Ausfuhr
  - [ ] Barrierefreiheit des Bestellprozesses (F10) – ab der Kasse greift das BaFG ggf. voll

### F6 – Geschenkgutscheine online (Gutscheinrecht AT/DE/CH)
- **Nutzen:** 5–20 T€ bis Weihnachten (00, Punkt 4), Neukunden, Firmengeschenke.
- **Aufwand:** M (mit gehostetem Checkout aus F5) – oder **S als „Gutschein per Anfrage“**: Formular → Rechnung/Überweisung → PDF-Gutschein manuell (kein Fernabsatz-Checkout, sofort startbar).
- **Abhängigkeiten:** Gutscheinbedingungen, Code-Verwaltung im Backoffice (Einlösung im Showroom!), Steuerberater (Einzweck-/Mehrzweckgutschein: Umsatzsteuer bei Ausgabe vs. Einlösung, § 4 Abs 3a UStG AT, § 3 Abs 13–15 UStG DE).
- **Dateien:** neu `src/app/[locale]/gutscheine/page.js`, `src/app/api/gutschein_anfrage/route.js`, `src/app/[locale]/gutscheinbedingungen/page.js`; PDF-Erzeugung serverseitig.
- **Bibliotheken:** `pdf-lib` 1.17.1 (MIT, nur Server, 0 kB Client; alt, aber stabil) für PDF-Gutscheine.
- **Rechtliche Leitplanken:**
  - **AT:** Ohne Befristung gilt ein Gutschein **30 Jahre** (§ 1478 ABGB). Befristungen in AGB bei entgeltlichen Gutscheinen von **3 Jahren oder weniger** sind nach OGH-Rspr. (u. a. 7 Ob 22/12d; Thermengutschein 2 Jahre unwirksam) in der Regel unzulässig (WKO). → Empfehlung Bericht 00 richtig: **unbefristet**.
  - **DE:** regelmäßige Verjährung 3 Jahre ab Jahresende (§§ 195, 199 BGB); kürzere Fristen in AGB oft unwirksam.
  - **CH:** 10 Jahre (Art. 127 OR); kürzere Fristen möglich, wenn klar vereinbart [prüfen].
  - Kein Barauszahlungs-Ausschluss in AGB, der Teilwert verfallen lässt; Restguthaben bleibt. Gutscheine mit Rabatt-Aktion („100 € für 90 €“) sind Preisermäßigungs-Werbung, aber keine § 9a-PrAG-Konstellation [prüfen].
  - Online-Kauf = Fernabsatz → 14 Tage Rücktrittsrecht, solange nicht eingelöst.
- **Muss vor Launch erledigt sein:**
  - [ ] Gutscheinbedingungen (unbefristet, Teileinlösung, keine Barablöse aber Restguthaben, Verlust/Missbrauch)
  - [ ] Eindeutige, nicht erratbare Codes; Einlöse-Register im Backoffice (sonst Doppel-Einlösung)
  - [ ] USt-Behandlung mit Steuerberater geklärt

### F7 – CHF-/Dreiländer-Rechner und Schweiz-Seite (PBV, Steuer-Aussagen)
- **Nutzen:** Größter Umsatzhebel (00, Abschn. 6.1); Ratgeber-Ranking „Möbel aus Österreich in die Schweiz“.
- **Aufwand:** M.
- **Abhängigkeiten:** Bericht 18 (Wege A/B), Zollspediteur, Steuerberater; Kursquelle.
- **Dateien:** neu `src/app/[locale]/schweiz-liechtenstein/page.js`, `src/components/ChfRechner/ChfRechner.js` (Client, reine Rechenlogik), `src/lib/legal/priceRules.js` (Disclaimer-Texte).
- **Bibliotheken:** keine (Kurs per Server-Fetch, z. B. EZB-Referenzkurs als XML, 0 kB).
- **Rechtliche Leitplanken:**
  - Rechner als **unverbindliche Kostenschätzung** kennzeichnen; verbindlich ist die Offerte (PBV/UWG CH: keine Irreführung über den Endpreis).
  - MWST 8,1 % CH korrekt und datiert; Hinweis, dass die **österreichische USt bei Ausfuhr nur mit Ausfuhrnachweis** entfällt – keine „steuerfrei“-Werbung ohne Ablauf.
  - **Keine Steuerberatung** auf der Seite („Wir arrangieren Verzollung über Partner X“, nicht „Sie sparen garantiert 20 %“).
  - Montage in CH: Meldeverfahren/8-Tage-Regel (Bericht 18) – nicht „kein Problem“ versprechen.
  - Datenschutz: Rechner ohne Speicherung; bei „Offerte anfordern“ gilt F1-Hinweis; CH-DSG-Hinweis in der Datenschutzerklärung.
- **Muss vor Launch erledigt sein:**
  - [ ] Text von Steuerberater/Zollspediteur gegengelesen
  - [ ] Kurs mit Datum und Quelle angezeigt; Rundung und Sicherheitszuschlag offen ausgewiesen
  - [ ] Kein „Festpreis“-Claim, bevor der Prozess (Garantie/Kursrisiko) steht

### F8 – Online-Termin, WhatsApp, Video-Beratung (DSGVO, TKG, Drittland)
- **Nutzen:** mehr Termine aus DE/CH/FL (05); nur 4 Wettbewerber haben einen Kalender.
- **Aufwand:** S–M.
- **Abhängigkeiten:** Wahl des Kalender-Tools (Cal.com Cloud mit EU-Datenhaltung [prüfen] oder Microsoft Bookings im bestehenden M365 [prüfen, ob vorhanden]), WhatsApp-Business-Nummer.
- **Dateien:** wie 05 (`src/components/Booking/BookingEmbed.js`, Eintrag `calCom` in `cookieServices`), WhatsApp-Link mit Hinweis.
- **Bibliotheken:** `@calcom/embed-react` 1.5.3 (eigene Lizenz „SEE LICENSE IN LICENSE“ – vor Einsatz prüfen; nur nach Klick laden) **oder** einfacher Buchungslink (0 kB).
- **Rechtliche Leitplanken:**
  - Einbettung lädt Drittanbieter-Code/Cookies → erst nach Klick bzw. Einwilligung (§ 165 Abs 3 TKG 2021; § 25 TDDDG; CH Art. 45c FMG: Information + Ablehnungsmöglichkeit). Muster `ConsentEmbed` wiederverwenden.
  - AV-Vertrag (Art. 28 DSGVO), Drittland: Anbieter DPF-zertifiziert oder SCC; in der Datenschutzerklärung nennen.
  - **WhatsApp:** Click-to-Chat-Link ist unkritisch, wenn der Nutzer selbst startet; Hinweis auf Meta als eigener Verantwortlicher. **Kein** Adressbuch-Sync des Firmenhandys mit Kundendaten (WhatsApp-App liest Kontakte) → WhatsApp Business **auf getrenntem Gerät** oder Business Platform (API).
  - Video-Beratung: keine Aufzeichnung ohne Einwilligung aller Teilnehmer.
- **Muss vor Launch erledigt sein:**
  - [ ] Consent-Eintrag + Datenschutz-Abschnitt je Dienst
  - [ ] AVV abgeschlossen, Datenregion EU gewählt
  - [ ] Erinnerungs-E-Mails nur transaktional (kein Marketing ohne Einwilligung)

### F9 – KI-Berater/Chatbot (AI Act Art. 50, DSGVO, Chat-Protokolle)
- **Nutzen:** 24/7-Antworten auf Kauffragen (Lieferzeit, Schweiz, Marken), Lead-Qualifizierung; Daten für Ratgeberseiten.
- **Aufwand:** M (RAG über eigenen Katalog/Ratgeber), L mit Backoffice-Anbindung.
- **Abhängigkeiten:** LLM-Anbieter mit EU-Datenverarbeitung und Zero-Retention **oder** lokales Modell auf der NVIDIA-GPU (06), freigegebene Wissensbasis (keine Händler-Aussagen!), Eskalationsweg zu Menschen.
- **Dateien:** neu `src/app/api/assistant/route.js`, `src/components/Assistant/*`, `src/lib/legal/aiNotices.js`; Consent-Eintrag `assistant`.
- **Bibliotheken:** siehe Bauplan der KI-Rolle; aus Compliance-Sicht: `zod` 4.6.x für Ein-/Ausgabevalidierung (Server).
- **Rechtliche Leitplanken:**
  - **AI Act Art. 50 Abs 1 gilt seit 02.08.2026**: Nutzer müssen informiert werden, dass sie mit einem KI-System interagieren (z. B. Kopfzeile „KI-Assistent – Antworten können Fehler enthalten. Persönliche Beratung: Termin“). Der Digital Omnibus (VO (EU) 2026/1744) hat Art. 50 **nicht** verschoben; Übergangsfrist bis 02.12.2026 nur für Art. 50 Abs 2 bei Altsystemen. Leitlinien der Kommission zu Art. 50 vom 20.07.2026 beachten.
  - **Haftung für Aussagen:** Der Bot spricht für das Unternehmen. Er darf keine Preise, Lieferzeiten, Händlerstatus oder Rabatte zusagen, die nicht im Claims-/Preisregister stehen (UWG; Vertragsrecht – „Air Canada“-Fall als Warnbeispiel). System-Prompt + Ausgabefilter.
  - **DSGVO:** Rechtsgrundlage Art. 6 Abs 1 lit b (Anfrage) bzw. f; **Chat-Protokolle** Speicherfrist festlegen (Empfehlung 30 Tage, bei Lead-Übergabe ins Backoffice nach Anfragefrist), keine Nutzung für Modelltraining beim Anbieter, Hinweis „Bitte keine sensiblen Daten eingeben“. DSFA empfehlenswert (neue Technologie, Profilbildung) [prüfen, ob Pflicht nach DSB-Liste].
  - Laden des Chat-Widgets: wenn es Drittanbieter-Code oder Cookies setzt → Consent; eigenes Widget mit Server-Proxy ohne Cookies → kein Consent nötig (TKG § 165 Ausnahme „unbedingt erforderlich“ nur, wenn Nutzer es aktiv öffnet).
  - CH: revDSG – Information über Drittland, Art. 21 (automatisierte Einzelentscheidung) nicht einschlägig, solange keine Entscheidung mit Rechtswirkung fällt.
- **Muss vor Launch erledigt sein:**
  - [ ] KI-Hinweis sichtbar vor der ersten Eingabe
  - [ ] Antwort-Leitplanken (keine Preis-/Händler-/Rabattzusagen) und Test mit 50 kritischen Fragen
  - [ ] AVV, Zero-Retention, EU-Region oder lokales Modell; Datenschutz-Abschnitt
  - [ ] Speicherfrist technisch umgesetzt (Löschjob)

### F10 – Barrierefreiheit (BaFG AT / BFSG DE) und Barrierefreiheitserklärung
- **Nutzen:** Rechtssicherheit ab Kasse; bessere Bedienbarkeit = mehr Anfragen (ältere, kaufkräftige Zielgruppe!), SEO-Nebeneffekt (Alt-Texte, Semantik, Core Web Vitals).
- **Aufwand:** M (Audit + Fixes), dann S/Quartal.
- **Abhängigkeiten:** keine Backoffice-Abhängigkeit, außer Alt-Texten aus dem CMS.
- **Dateien:** neu `src/app/[locale]/barrierefreiheit/page.js`; Prüfpunkte quer durch `src/components/**` (Navbar 1.239 Zeilen, Slick-Karussell, Formulare, Consent-Modal: Fokusfalle, Kontrast der Ablehnen-Option), `eslint.config.mjs`, neu `tests/a11y.spec.js`.
- **Bibliotheken (alle dev-only, 0 kB im Bundle):** `@playwright/test` 1.63.0 (Apache-2.0), `@axe-core/playwright` 4.13.0 (MPL-2.0), `@lhci/cli` 0.15.1 (Apache-2.0) für Lighthouse-Accessibility-Score im CI; `eslint-plugin-jsx-a11y` 6.10.2 (MIT) ist über `eslint-config-next` schon installiert – Regeln auf „error“ schalten.
- **Rechtliche Leitplanken:**
  - BaFG (AT) und BFSG (DE) gelten seit **28.06.2025** für „Dienstleistungen im elektronischen Geschäftsverkehr“ an Verbraucher, d. h. Websites, **über die ein Verbrauchervertrag geschlossen wird**. Reines Anfrage-/Merklisten-System ohne Kasse ist nach herrschender Lesart nicht erfasst; **mit Shop/Gutschein-Checkout (F5/F6) ja**.
  - **Kleinstunternehmen-Ausnahme** (nur für Dienstleister): **weniger als 10 Beschäftigte UND** Jahresumsatz **oder** Bilanzsumme ≤ 2 Mio. € (WKO). Achtung: Maßgeblich ist der **Rechtsträger** – die MW Immobilienverwaltungs GmbH mit Café und Immobilienverwaltung hat womöglich ≥ 10 Beschäftigte (VZÄ) [prüfen]; eine neue schlanke Handels-GmbH könnte darunter fallen. Für DE-Kunden gilt das BFSG mit derselben Schwelle.
  - Standard: EN 301 549 ≈ **WCAG 2.1 AA**; Ziel WCAG 2.2 AA. Barrierefreiheitserklärung mit Konformitätsstand, Kontakt für Barrieren, Hinweis auf Marktüberwachung (AT: Sozialministeriumservice).
  - Barrierefrei muss der **gesamte Kaufprozess** sein (Konfigurator-Ergebnis, Kasse, Widerrufsbutton, Consent-Banner, CAPTCHA – kein Bild-CAPTCHA; Honeypot ist gut).
- **Muss vor Launch erledigt sein (spätestens mit F5/F6):**
  - [ ] axe-Test ohne „serious/critical“-Fehler auf Startseite, Produkt, Merkliste, Formular, Kasse, Widerruf
  - [ ] Tastaturbedienung Navbar/Mega-Menü/Karussell/Modal; sichtbarer Fokus (vorhanden)
  - [ ] Alt-Texte: dekorativ `alt=""`, Produktbilder „Marke Modell, Material, Farbe“ (heute 13× `alt=""` bei 81 Bild-Stellen – prüfen)
  - [ ] Barrierefreiheitserklärung veröffentlicht, im Footer verlinkt
  - [ ] Entscheidung dokumentiert: Kleinstunternehmen ja/nein (VZÄ-Rechnung)

### F11 – Bewertungen und Reputation (Omnibus, UWG, TKG/UWG für Bewertungsmails)
- **Nutzen:** Local Pack (25 H3), Vertrauen; Ziel 30+ bis Januar.
- **Aufwand:** S.
- **Abhängigkeiten:** Google-Profil, Liefer-Prozess im Backoffice (Zeitpunkt für die Bitte).
- **Dateien:** neu `src/components/Reviews/ReviewSummary.js` (statische Anzeige Sternwert + Anzahl + Datum + Link zu Google, **kein** eingebettetes Google-Widget ohne Consent), Hinweistext `src/messages/*.json`.
- **Bibliotheken:** keine.
- **Rechtliche Leitplanken:**
  - **Omnibus-RL (AT: UWG idF MoRUG 2022; DE: § 5b Abs 3 UWG + Anhang Nr. 23b/c):** Wer Bewertungen zeigt, muss angeben, **ob und wie geprüft** wird, dass sie von echten Kunden stammen („Wir zeigen Google-Bewertungen; Google prüft nicht, ob ein Kauf stattfand“). Gefälschte, gekaufte oder selektiv nur positive Bewertungen als repräsentativ darzustellen = Black-List-Verstoß.
  - **Keine Anreize ohne Offenlegung** (Gutschein für Bewertung), kein „Review Gating“ (nur zufriedene Kunden fragen) – Google-Richtlinie und UWG.
  - **Bewertungsbitte per E-Mail** ist Werbung (BGH VI ZR 225/17, 10.07.2018) → nur mit Einwilligung oder im Rahmen der Bestandskunden-Ausnahme (AT § 174 Abs 4 TKG 2021; DE § 7 Abs 3 UWG: eigene E-Mail aus Kauf, Widerspruchshinweis bei Erhebung **und** in jeder Mail). Sicherer: **QR-Karte bei Lieferung** (keine elektronische Post) und Einwilligungs-Checkbox in der Auftragsbestätigung.
  - JSON-LD: **kein** `aggregateRating` aus Google-Bewertungen auf eigenen Seiten auszeichnen (Google-Richtlinie „self-serving reviews“; Irreführungsrisiko).
  - Kundenzitate/Referenzen: schriftliche Freigabe, echter Name oder klar „Familie M., Lindau“, Datum.
  - Auf negative Bewertungen sachlich antworten, keine Kundendaten nennen (DSGVO).
- **Muss vor Launch erledigt sein:**
  - [ ] Prüf-Hinweis neben jeder Bewertungsanzeige
  - [ ] Prozess „QR-Karte + Einwilligung“ statt Massenmail an Altkunden
  - [ ] Mitarbeitende und Angehörige bewerten nicht

### F12 – Platzhirsch Circle, Inzahlungnahme, digitaler Produktpass (später)
- **Nutzen:** Wiederkehrender Umsatz, Nachhaltigkeit, Vorbereitung auf Ökodesign/Digitalen Produktpass (ESPR, VO (EU) 2024/1781; Möbel-Delegationsakt voraussichtlich ab ~2028 [vorläufig]).
- **Aufwand:** L. **Abhängigkeiten:** Backoffice-Datenmodell, Aufbereiter-Partner.
- **Rechtliche Leitplanken:** Gebrauchtwaren-Gewährleistung auf 1 Jahr verkürzbar (AT VGG § 10 [prüfen Paragraf]; DE § 476 Abs 2 BGB, gesondert vereinbart); Differenzbesteuerung (§ 24 UStG AT) mit Steuerberater; **Kommissionsware**: Eigentümer- und Haftungsfragen vertraglich; „wie neu“/„geprüft“ nur mit dokumentiertem Prüfprotokoll (UWG); Markenrecht: Weiterverkauf echter Gebrauchtware zulässig (Erschöpfung), Aufbereitung darf den Zustand nicht so verändern, dass die Marke beeinträchtigt wird (Art. 15 Abs 2 UMV, „berechtigte Gründe“) – keine Umpolsterung mit Fremdstoffen unter Original-Markennamen ohne Hinweis.

### F13 – Tracking, Google Ads, Conversion-Import (Consent, TKG/TDDDG)
- **Nutzen:** Ads-Steuerung (3–8 T€/Monat ab Q1 2027 nur mit Tracking, 23 Abschn. 9), Lead-Herkunft je Kanal.
- **Aufwand:** S.
- **Abhängigkeiten:** Google-Ads-Konto, Conversion-Import, Backoffice-Feld `lead_source`/`gclid` [blockiert für Offline-Conversions].
- **Dateien:** `src/lib/analytics.js` (vorhanden), `src/components/Cookies/cookiecomponent.js`, Formular-Routen in `src/app/api/*` (gclid/UTM nur mit Ads-Consent mitsenden).
- **Bibliotheken:** keine (bestehendes gtag). **Kein** Server-Side-GTM ohne neuen Datenschutz-Abschnitt.
- **Rechtliche Leitplanken:**
  - `ad_user_data` und `ad_personalization` (Consent Mode v2) müssen getrennt von `analytics_storage` abgefragt werden – heute gekoppelt an „googleAds“, das ist ok, solange der Banner-Text Personalisierung und Datenweitergabe an Google nennt [Banner-Text prüfen].
  - **Enhanced Conversions** (gehashte E-Mail an Google) nur mit Ads-Einwilligung und eigenem Datenschutz-Abschnitt; sonst nicht aktivieren.
  - gclid/UTM in Anfragen an das Backoffice: Personenbezug → nur mit Marketing-Consent speichern, Löschfrist wie Anfrage.
  - Consent-Cookie-Laufzeit 12 Monate (vorhanden) – gut; Banner nach 12 Monaten erneut zeigen (DSB-Praxis).
  - Banner-Gestaltung: „Weiter ohne Einwilligung“ muss **gleich prominent** wie „Alle akzeptieren“ sein (DSB AT, EDSA-Cookie-Banner-Taskforce 2023; in DE LG/OLG-Rspr.) [Farbe/Gewicht der Knöpfe prüfen].
- **Muss vor Launch erledigt sein:**
  - [ ] Banner-Text nennt Google Ads, Personalisierung, Drittland
  - [ ] gleichwertige Knöpfe (visuell)
  - [ ] Ads-Conversion-Import ohne Personendaten, solange kein Consent

### F14 – KI-Raumplaner mit Kundenfotos auf eigener NVIDIA-GPU (AI Act Art. 50 Abs 2/4, DSGVO, Urheberrecht)
- **Nutzen:** Alleinstellung (23 Abschn. 10 Nr. 4), „Ihr Raum in 48 Stunden“.
- **Aufwand:** L. Masterkonzept: zuerst manuell, KI erst nach Bildfreigabe, DSGVO und Wirkungsnachweis.
- **Abhängigkeiten:** Bildfreigaben der Marken **für KI-Input** (F3), lokale GPU-Pipeline (06), Upload-Speicher.
- **Dateien:** neu `src/app/[locale]/raumplaner/page.js`, `src/app/api/raumplaner/upload/route.js` (Größe/Typ prüfen, EXIF/GPS mit `sharp` entfernen, verschlüsselt ablegen), Löschjob; Kennzeichnungs-Komponente `src/components/Ai/AiLabel.js`.
- **Bibliotheken:** `sharp` 0.35.x (Apache-2.0, Server) zum Entfernen der Metadaten; `@contentauth/c2pa-node` 0.9.9 (MIT, Server, 0 kB Client; 0.9.10 ist < 2 Wochen alt) zum **maschinenlesbaren C2PA-Herkunftsnachweis** der erzeugten Bilder.
- **Rechtliche Leitplanken:**
  - **AI Act Art. 50 Abs 2** (seit 02.08.2026): Anbieter von KI-Systemen, die Bilder erzeugen, müssen die Ausgaben **maschinenlesbar** als KI-generiert markieren. Wer ein Open-Source-Modell auf eigener GPU zu einem Dienst zusammenbaut und anbietet, ist selbst „Anbieter“ [prüfen; Leitlinien Art. 50]. → C2PA-Manifest + IPTC `DigitalSourceType = trainedAlgorithmicMedia`.
  - **Art. 50 Abs 4** (Deepfake): Realistische Darstellung des echten Raums des Kunden mit Möbeln kann als „Deepfake“ (realistisch wirkender, nicht echter Ort/Gegenstand) gelten → **sichtbares Etikett** „KI-Visualisierung, nicht maßstabsgetreu“ auf jedem Bild und PDF, auch bei Weitergabe an Social Media.
  - **UWG:** Visualisierung darf Produkte nicht besser darstellen (Farben, Proportionen) – Hinweis „Farbwiedergabe und Maße unverbindlich; verbindlich ist die Offerte“.
  - **DSGVO:** Fotos der Wohnung sind personenbezogen (Personen, Familienfotos, Adresse durch Fensterblick). Rechtsgrundlage: Vertrag/Anfrage (Art. 6 Abs 1 lit b); **Training/Verbesserung des Modells nur mit gesonderter, freiwilliger Einwilligung** (lit a), sonst nicht. Speicherfrist 30 Tage nach Ergebnis, automatisch löschen; Hinweis „Bitte keine Personen fotografieren“, optional automatische Gesichtsunschärfe. Lokale Verarbeitung auf eigener GPU vermeidet Drittlandübermittlung – das ist das stärkste Argument für die lokale Lösung. DSFA durchführen (neue Technologie + Wohnraumbilder).
  - **Urheberrecht:** Herstellerbilder als Input/Referenz nur mit ausdrücklicher Freigabe; KI-Ausgaben sind mangels menschlicher Schöpfung meist nicht geschützt → Platzhirsch hat an den Bildern keine starken eigenen Rechte. Lizenz des Modells prüfen (z. B. kommerzielle Nutzung, Ausschlusslisten).
- **Muss vor Launch erledigt sein:**
  - [ ] Sichtbares Etikett + C2PA auf jedem Ergebnis
  - [ ] Freigaben der Marken für KI-Input
  - [ ] Upload-Hinweis, gesonderte Trainings-Einwilligung (Standard: aus), Löschjob, DSFA
  - [ ] Modell-Lizenz geprüft

### F15 – 2D-Planer/Konfigurator (04) und 3D (später)
- **Nutzen:** qualifizierte Anfragen; 2D ohne Bildrechte sofort baubar.
- **Aufwand:** M (2D). **Rechtliches:** 2D aus Maßen = Fakten, unkritisch (04). Preisrahmen nur nach F4-Regeln. Ergebnis-PDF: „unverbindliche Planung“. 3D/Roomle nur mit Herstellerdaten (F3, *Mio/konektra*) und Consent für iframe. Konfiguration nach Kundenwunsch = **Maßanfertigung** → beim späteren Online-Kauf Ausnahme vom Rücktrittsrecht (EuGH C-529/19) – das muss dann **vor** Vertragsschluss klar gesagt werden.

### F16 – Stadt-/Regionsseiten, Ratgeber, Finanzierungs- und Sicherheits-Claims
- **Nutzen:** 25 H4/H5. **Aufwand:** S je Seite.
- **Rechtliche Leitplanken:**
  - Steuer-/Zollaussagen datieren und belegen (wie heute schon auf `designermoebel-st-gallen` mit BAZG-Verweis – gut).
  - Referenzprojekte nur echte, freigegebene; keine Kundennamen ohne Einwilligung.
  - **„0 %-Finanzierung“**: Werbung für Verbraucherkredite braucht Standardinformationen mit repräsentativem Beispiel (AT § 5 VKrG; DE § 17 PAngV); Kreditvermittlung kann eine **Gewerbeberechtigung** erfordern (AT § 136a GewO, Ausnahme für Vertragsanbahnung als „gebundener“ Händler [prüfen mit Bank]).
  - **„Ihre Anzahlung ist abgesichert“** (23 Abschn. 4.2 Nr. 3): nur wenn Garantie/Aval tatsächlich besteht; Umfang, Garant und Bedingungen verlinken. Sonst Irreführung (§ 2 UWG) – gerade bei der bekannten Bilanzlage ein heikles Thema.
  - Ratgeber „Minotti oder B&B Italia?“: sachlich, nachprüfbar, keine Herabsetzung (Vergleichswerbung).

### F17 – Newsletter und E-Mail-Marketing
- **Aufwand:** S. **Leitplanken:** Double-Opt-in mit Protokoll; Einwilligungstext nennt Inhalte und Frequenz; Abmeldelink in jeder Mail; Bestandskunden-Ausnahme (§ 174 Abs 4 TKG 2021) nur für ähnliche eigene Produkte und mit Widerspruchsmöglichkeit schon bei Erhebung; Newsletter-Tool im Datenschutz nennen; Geburtstag/PLZ nur erheben, wenn wirklich genutzt (Datenminimierung).

---

## 5. Risiken (Performance, Recht, Pflege)

### 5.1 Recht – Top-Risiken nach Wahrscheinlichkeit × Schaden

| # | Risiko | Wahrscheinlichkeit | Schaden | Gegenmaßnahme |
|---|---|---|---|---|
| 1 | Händler-Anmutung (Texte, Logos, Backoffice-Felder, Ads) | mittel | hoch (Unterlassung, Verhandlung mit Minotti/Poliform gefährdet) | F2, Allowlist, Claims-Register |
| 2 | Fotografen-/Bildagentur-Abmahnung für Herstellerbilder, v. a. in Ads/Feeds | mittel | mittel–hoch (Lizenzschaden je Bild, oft 3-stellig, × Anzahl) | F3, nichts in Ads/Feeds ohne Registereintrag |
| 3 | Falsche Pflichtinformationen Datenschutz (Privacy Shield) | hoch (öffentlich sichtbar) | niedrig–mittel (Beschwerde DSB, Abmahnung DE strittig) | F1 sofort |
| 4 | Preisangaben/„statt“-Preise im Atelierverkauf falsch | mittel | mittel (Abmahnung DE durch Verbände häufig) | F4-Regeln, 30-Tage-Historie |
| 5 | Shop ohne Widerrufsbutton/Pflichtseiten | hoch, falls ohne F5-Kette gestartet | mittel; zusätzlich **verlängerte Rücktrittsfrist** bis 12 Monate + 14 Tage bei fehlender Belehrung (§ 12 FAGG) | F5-Checkliste |
| 6 | Ausstellungsstücke ohne gesonderte Mangelvereinbarung | hoch | mittel (Gewährleistung für Kratzer) | F5 Checkbox |
| 7 | KI ohne Kennzeichnung / KI-Zusagen | niedrig (noch nicht gebaut) | mittel (AI-Act-Bußgelder bis 15 Mio./3 %, praktisch eher UWG) | F9/F14 |
| 8 | Bewertungsmails ohne Einwilligung | mittel | niedrig–mittel (TKG-Strafe bis 37.000 €, Abmahnung DE) | F11 QR-Karte |
| 9 | BaFG-Pflicht übersehen beim Start der Kasse | mittel | mittel (Marktüberwachung, Verbandsklage) | F10 vor F5 |

### 5.2 Performance
- Alle Compliance-Bausteine sind **0 kB** im Client-Bundle (Registry-Dateien, Server-Routen, dev-only-Tests). Einziges Client-Risiko: Drittanbieter-Embeds (Kalender, Chat, 3D) → nur nach Klick laden (Muster `ConsentEmbed`).
- Gehosteter Checkout (Stripe/Mollie) statt eingebetteter Payment-Elemente spart ~40–80 kB JS und PCI-Aufwand.

### 5.3 Pflege (5-Personen-Team)
- **Eine** Rechtsdaten-Datei, **ein** Dienste-Register, **ein** Claims- und Bildregister → Änderungen ohne Entwickler-Suche.
- Quartalsroutine (1 Stunde): Claims prüfen, Dienste-Register vs. tatsächliche Skripte (Browser-Netzwerk-Tab), axe-Lauf, Preise älter als 12 Monate.
- Ereignis-Trigger: Rechtsträgerwechsel, neuer Dienst, neuer Händlervertrag (dann Allowlist erweitern und Titel wieder „Händler“), neue Marke mit Bildfreigabe.
- Rechtstext-Service: Für AGB/Widerruf/Datenschutz lohnt ein Abo-Generator mit Update-Service für AT (z. B. über WKO-Muster oder einen Rechtstexte-Dienst mit AT-Fokus) [Anbieterwahl prüfen] – sonst veralten Texte wie heute (Privacy Shield).

---

## 6. Priorisierte Reihenfolge

### 6.1 Sofort baubar ohne Backoffice-Zugang (nächste 2–4 Wochen)

| Rang | Maßnahme | Aufwand | Warum jetzt |
|---|---|---|---|
| 1 | **F1 Rechts-Basis** (Datenschutz neu, Impressum ergänzt, Formular-Hinweise, `company.js`, Dienste-Register) | S | Sichtbare Fehler, Voraussetzung für Ads/Merchant Center |
| 2 | **F2 Händler-Filter + Claims-Register** (Backoffice-Händlerfelder im Code ausblenden, Superlative raus) | S | Schützt Gate 0 (Verhandlung) |
| 3 | **F3 Bildaudit-Skript + Register (Übergangsdatei)**, Hero auf eigenes Foto, `remotePatterns` straffen | M | Vor jeder Ads-/Feed-Kampagne nötig |
| 4 | **F13 Banner-/Ads-Consent-Feinschliff** | S | Ads ab Q1 2027 |
| 5 | **F11 Bewertungen**: QR-Karte, Prüfhinweis-Komponente | S | Ziel 30 Bewertungen bis Januar |
| 6 | **F10 Barrierefreiheit**: Tests im CI, Fixes Navbar/Modal/Formulare, Erklärung | M | Muss vor jeder Kasse stehen |
| 7 | **F6 Gutscheine als „Anfrage + Rechnung“** (ohne Checkout), Bedingungen unbefristet | S | Weihnachten 2026 |
| 8 | **F7 CHF-Rechner als Kostenschätzung** (nach Steuerberater-Text) | M | Größter Umsatzhebel |
| 9 | **F8 Termin-Link/Kalender nach Klick, WhatsApp-Link** | S | mehr Termine aus DE/CH/FL |
| 10 | **F15 2D-Planer** (Rechtlich unkritisch) | M | Leads ohne Bildrechte |

### 6.2 Blockiert (Backoffice-Felder, Verträge, Freigaben)

| Maßnahme | Blocker |
|---|---|
| F4 Preise/`Offer`/Merchant Center | Backoffice-Preisfelder, 30-Tage-Preishistorie, Abstimmung mit Marken |
| F5 Atelier-/Accessoire-Shop mit Kasse | Zahlungsanbieter-Vertrag, AGB, Inventur mit Zustand, GPSR-Felder, Steuerberater (OSS/CH), Rechtsträger-Entscheidung, F10 fertig |
| F6 Gutscheine mit Online-Kasse | wie F5 + Einlöse-Register im Backoffice |
| F2 vollständig | Backoffice-Zugang zum Bereinigen von `dealers_title`/`dealers_description`; Händlerverträge |
| F3 vollständig | Freigaben der Marken, Backoffice-Feld `image_license` |
| F9 KI-Berater | Anbieter-/GPU-Entscheidung, AVV, freigegebene Wissensbasis |
| F14 KI-Raumplaner | Bildfreigaben für KI-Input, DSFA, GPU-Pipeline (06); Masterkonzept: frühestens 2028 |
| F12 Circle/Produktpass | Backoffice-Datenmodell, Steuerberater (Differenzbesteuerung) |
| F16 Finanzierungs-/Sicherheits-Claims | Bankvertrag, Garantie/Aval, ggf. Gewerbeberechtigung |

---

## Quellen (Auswahl, abgerufen 26.10.2026)

- WKO: Widerrufsbutton im Webshop (Stand 29.07.2026, § 13a FAGG, Inkrafttreten 01.10.2026) – <https://www.wko.at/internetrecht/e-commerce-widerrufsbutton-webshop>
- IHK Rheinhessen: Widerrufsbutton ab Juni 2026 (DE, § 356a BGB) – <https://www.ihk.de/rheinhessen/recht-steuern/aktuelles/widerrufsbutton-7034868>
- WKO: Barrierefreiheitsgesetz im E-Commerce – FAQ – <https://www.wko.at/internetrecht/barrierefreiheitsgesetz-im-e-commerce-faq>
- Händlerbund: Berechnung der Mitarbeiterzahl BFSG – <https://ohn.haendlerbund.de/recht/rechtsfragen/barrierefreiheit-wie-berechnet-man-die-mitarbeiterzahl>
- Baker Botts: EU AI Act Article 50 transparency obligations go live (09/2026) – <https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live>
- DPO Centre: AI Act Omnibus und Transparenzregeln – <https://www.dpocentre.com/news/eu-ai-act-updates-omnibus-transparency-rules/>
- Stephenson Harwood: Kommissions-Leitlinien zu Art. 50 – <https://perspectives.stephensonharwood.com/post/102nfqh/eu-ai-act-update-european-commission-adopts-guidelines-on-article-50-transparenc>
- IT-Recht Kanzlei: Abschaltung OS-Plattform – <https://www.it-recht-kanzlei.de/abschaltung-os-plattform.html>; WKO OÖ: OS-Plattform – <https://www.wko.at/ooe/news/os-plattform>
- WKO: Gutscheine – Befristung – <https://www.wko.at/vertragsrecht/gutscheine-befristung>; VKI zu Paylife-Gutscheinkarten (OGH 2023) – <https://vki.at/system/files/2023-06/2023-06-01_PA_Paylife_Gutscheinkarten_OGH.pdf>
- Taylor Wessing: Copyright after Mio and konektra (07/2026) – <https://www.taylorwessing.com/de/insights-and-events/insights/2026/07/copyright-after-mio-and-konektra>; CMS: EuGH angewandte Kunst – <https://cms.law/de/deu/legal-updates/update-des-eugh-zur-urheberrechtlichen-schutzfaehigkeit-von-werken-der-angewandten-kunst>
- Benchmarks: <https://www.connox.at> (Footer-Pflichtseiten), <https://www.hoettges.at> (Impressum, Datenschutz, AGB-PDF, keine Händlerformel)
- Urteile (aus Fachwissen, Volltext in RIS/Curia/dejure prüfen): EuGH C-311/18 *Schrems II*; C-161/17 *Renckhoff*; C-466/12 *Svensson*; C-392/19 *VG Bild-Kunst*; C-63/97 *BMW/Deenik*; C-236/08 *Google France*; C-323/09 *Interflora*; C-529/19 *Möbel Kraft*; BGH VI ZR 225/17 (Feedback-Mail); OGH 7 Ob 22/12d (Gutscheinbefristung)
- npm-Registry (Versionen/Lizenzen am 26.10.2026): `stripe`, `@mollie/api-client`, `zod`, `sharp`, `pdf-lib`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli`, `@contentauth/c2pa-node`, `@calcom/embed-react`, `schema-dts`
