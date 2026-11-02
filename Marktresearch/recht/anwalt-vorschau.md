# Anwalts-Vorschau der Rechtstexte – Mappe für die Kanzlei

> **Entwurf – vor Verwendung durch eine Rechtsanwältin/einen Rechtsanwalt prüfen lassen.** Keine Rechtsberatung.
> Stand: 26.10.2026 · Paket R3-recht-vorschau · Nichts davon ist veröffentlicht. Die live Seiten `/datenschutz` und `/impressum` sind unverändert.

## 1. Links

Die Entwürfe aus diesem Ordner sind im Layout der Website gerendert. Jede eckige Klammer des Entwurfs ist als offene Stelle markiert (gestrichelt unterstrichen). Am Ende jeder Seite steht eine Liste „Alle offenen Stellen“ mit Sprungmarken.

| Seite | Lokal (Dev-Server) | Grundlage | Offene Stellen (davon [anwaltlich prüfen]) |
|---|---|---|---|
| Übersicht | http://localhost:3000/de/preview/recht | – | – |
| Datenschutzerklärung | http://localhost:3000/de/preview/recht/datenschutz | `02-datenschutzerklaerung-entwurf.md` Abschn. 2 + Feature-Dokus | 123 (37), davon 34 (15) im Anhang „Eingesetzte Dienste“ (R4) |
| Impressum | http://localhost:3000/de/preview/recht/impressum | `04-impressum-pflichtangaben.md` Abschn. 5, Variante A (+ B) | 28 (5) |
| AGB | http://localhost:3000/de/preview/recht/agb | `01-agb-entwurf.md` Teil B (§§ 1–29) und Teil C | 112 (37), dazu 6 innere Klammern |
| Barrierefreiheit | http://localhost:3000/de/preview/recht/barrierefreiheit | `04` Abschn. 3 (es gibt noch **keinen** Textentwurf, nur die Gliederung nach § 14 BaFG) | 11 (3) |

**Zählregel:** Eine offene Stelle ist jede **äußere** eckige Klammer. Klammern innerhalb einer Stelle (z. B. AGB „[nur nach Vereinbarung, höchstens [3–5] % …]“) gehören zu dieser Stelle, werden mit ihr erledigt und nicht gesondert gezählt; sie sind punktiert unterstrichen statt hinterlegt. Abschnitts-Badges, Summe im Kanzlei-Kasten, Markierungen im Text und die Schlussliste „Alle offenen Stellen“ ergeben damit dieselbe Zahl (per Test abgesichert). Innere Klammern: AGB 6, sonst keine.

**Erreichbarkeit:** nur im Entwicklungsmodus oder in einem Produktions-Build mit der Umgebungsvariable `LEGAL_PREVIEW=1` (z. B. auf einem Staging-Server für die Kanzlei). Auf einer Vercel-Produktionsumgebung (`VERCEL_ENV=production`) bleibt die Vorschau auch mit `LEGAL_PREVIEW=1` aus. Ohne die Variable antwortet jede Vorschau-Adresse mit 404. Immer `noindex, nofollow`, in keiner Sitemap, nur Deutsch (`/en|fr|it/…` → 404).

**Woher die Daten kommen:** Anschrift, Telefon, E-Mail und Social-Media-Profile ausschließlich aus `src/lib/site.js` (Landstraße 11 laut Firmenbuch, Rechtspaket W1). Firmenbuchdaten (FN, UID, Geschäftsführung) aus dem Impressum-Entwurf 04, Variante A. Fristen von Kundenportal, Upload und KI-Concierge direkt aus dem Code (`src/lib/portal/privacy.js`, `src/lib/upload/config.js`, `src/lib/concierge/config.js`) – ändert sich dort ein Wert, ändert sich die Vorschau mit.

**Legende der Markierungen:** *anwaltlich prüfen* = Rechtsfrage · *vom Unternehmen auszufüllen* = Fakt oder Entscheidung des Inhabers (auch kurze Platzhalter wie [14], [●]) · *prüfen* = Anbieterangabe im Originaldokument nachlesen. Kästen „Anmerkung des Entwurfs“, „Rechtspaket 00, W…“ und „Hinweis zur Vorschau“ sind nicht Teil des Textes.

## 2. Die 5 bekannten Fehler der heutigen Datenschutzerklärung

Quelle: `02`, Befund 1 und Tabelle 1.1. Die live Seite (`src/components/Datenschutz/datenschutz.js`) enthält sie weiterhin; geändert wird erst nach Freigabe.

| # | Fehler heute | Richtig | Wo in der Vorschau korrigiert |
|---|---|---|---|
| D2 | US-Übermittlung auf den **Privacy Shield** gestützt (ungültig seit EuGH C-311/18, 16.07.2020) | EU-US Data Privacy Framework (Durchführungsbeschluss (EU) 2023/1795) + Einwilligung, ergänzend SCC | 5.2, 5.3, 5.4, 7 |
| D1 | „TKG 2003“, „§ 96 Abs 3 TKG“ (außer Kraft seit 01.11.2021) | § 165 Abs 3 TKG 2021 | 2, 4, 5.2–5.5 |
| D3 | Google Analytics auf Art. 6 Abs 1 lit a „und/oder f“ | nur Einwilligung, lit a | 5.2 |
| D5 | GA-Speicherdauer **26 Monate** | GA4 kennt 2 oder 14 Monate; tatsächliche Einstellung eintragen | 5.2 |
| D8 | Newsletter-Felder „Interessengebiete, Geburtstag, PLZ“ | nur, was das Formular erhebt (heute: E-Mail) | 5.6 |

Weitere Mängel (D4, D6, D7, D9–D13) stehen in `02`, Tabelle 1.1.

## 3. Prüfliste je Abschnitt

### 3.1 Datenschutzerklärung

| Abschnitt | Prüfen (Schwerpunkt) | Offen (anw./gesamt) |
|---|---|---|
| Kopf | Datum, Version | 0/2 |
| 1 Verantwortlicher | Postfach `datenschutz@` anlegen; Rechtsträgerwechsel (Art. 26 DSGVO); kein DSB nach Art. 37 | 2/4 |
| 2 Überblick | Rechtsgrundlagen-Liste, keine automatisierten Entscheidungen | 0/0 |
| 3 Website | Hoster, Log-Frist [14 Tage], Spam-Schutz (Turnstile?) | 1/4 |
| 4 Cookies | Consent-Protokoll-Frist [3 Jahre]; **neu:** Portal-Cookie, Local Storage Sofaplaner, sessionStorage Concierge in „unbedingt erforderlich“ aufnehmen | 2/4 |
| 5.1 Anfragen | Frappe-Betrieb (AV?), Binni/Kosovo ohne Angemessenheit, Frist [12 Monate] | 1/4 |
| 5.2 GA4 | Aufbewahrung, Signals, DPF | 0/4 |
| 5.3 Google Ads | Rollen Auftragsverarbeiter/Verantwortlicher | 1/2 |
| 5.4 Meta (Modul) | Controller Addendum, DPF | 0/2 |
| 5.5 Maps | – | 0/0 |
| 5.6 Newsletter | Öffnungsmessung gesondert einwilligen? Bestandskunden (W13), Nachweisfrist | 3/10 |
| 5.7 Termine (Modul) | Anbieter offen; cal.eu-Einstellung (W9) | 0/6 |
| 5.8 Video (Modul) | Dienst offen | 0/2 |
| 5.9 WhatsApp (Modul) | Business Platform = AV | 1/3 |
| 5.10 KI-Concierge (Modul) | **Entwurf vs. Labs-Code:** lit b/30 Tage/Bedrock-EU (Entwurf, W12) gegen Einwilligung/90 Tage/Anthropic USA (Code). Vereinheitlichen; DPA, Zero-Data-Retention, DSFA | 1/8 |
| 5.11 KI-Raumplaner (Modul) | Frist 30 Tage nach W10; TOM des Team-Rechners (DSFA) | 1/3 |
| 5.12 Bestellungen (Modul) | Zahlungsanbieter, Gutscheinfristen, Bonitätsprüfung | 2/8 |
| 5.13 Lieferung CH/FL (Modul) | Spediteure, Steuervertreter | 0/2 |
| 5.14 Bewertungen (Modul) | Prüfhinweis-Text (UWG) | 1/1 |
| 5.15 Veranstaltungen (Modul) | Allergien (Art. 9), Fotos/Bildnisschutz | 1/4 |
| 5.16 Social Media | weitere Kanäle | 0/1 |
| 5.17 Bewerbungen | ganzer Abschnitt offen | 1/1 |
| **5.18 Kundenportal – neu** | aus `features/kundenportal.md` + `src/lib/portal/privacy.js`: Magic Link 15 Min., Cookie `ph_portal_session` 30 Tage, Sprachnachrichten mit Einwilligung, Fristen (Vorschlag des Entwicklers, Inhaber bestätigt noch). Mit der bestehenden Seite `/de/portal/datenschutz` zusammenführen oder verlinken; dort Kontakt `info@` statt `datenschutz@` | 1/3 |
| **5.19 Uploads – neu** | aus `features/handy-upload.md` + `src/lib/upload/config.js`: Einwilligung (lit a) vs. lit b; Frist 180 Tage = Platzhalter; **GPS wird nur bei JPEG entfernt** (HEIC/PNG/WebP nicht, laut `src/lib/upload/exif.js`) | 2/4 |
| **5.20 Online-Planer – neu** | Textentwurf aus `features/kuechenplaner.md` (P2-2) + `sofaplaner.md`: Checkbox im Küchenplaner als Einwilligung formuliert, Entwurf nennt lit b; Redis-Anbieter; 180 Tage | 1/3 |
| 6 Rechte | Behördenadressen FL/CH | 0/2 |
| 7 Schweiz | Empfängerstaaten je aktivem Dienst | 0/1 |
| 8 Sicherheit | Zwei-Faktor im Backoffice | 0/1 |
| 9 Änderungen | – | 0/0 |
| **A Anhang Eingesetzte Dienste – neu (R4)** | aus dem Dienste-Register `src/lib/legal/services.js` (dieselbe Quelle wie das Cookie-Banner): je Dienst Zweck, Rechtsgrundlage, Empfänger, Drittland, Speicherdauer; Liste auch in Abschnitt 6.3 | 15/50 |

### 3.2 Impressum

| Abschnitt | Prüfen | Offen |
|---|---|---|
| 1 Anbieter | amtliche Adresse bei der Gemeinde bestätigen (W1) | 0/1 |
| 3 Unternehmensdaten | UID gültig, Vertretungsregel | 0/2 |
| 4 Gegenstand | laut GISA/Gesellschaftsvertrag | 0/1 |
| 5 Gewerberecht | Gewerbeberechtigungen, WKO-Fachgruppen, Immobilientreuhänder (DLG)? | 1/4 |
| 6 Offenlegung § 25 MedienG | „große“ Offenlegung, Anteile | 1/2 |
| 7 Geltungsbereich | weitere Profile | 0/1 |
| 8 Streitbeilegung | Option 1 oder 2, Stelle wählen; kein OS-Link | 1/4 |
| 9 Preisangaben (Modul) | erst mit Online-Preisen | 0/2 |
| 10 Markenhinweis | Formulierung, ClassiCon | 1/1 |
| 11 Bildnachweise | Bildregister | 0/1 |
| 12 DSA-Kontaktstelle (Modul) | ab Upload/Bewertungen; „Hosting“? | 1/3 |
| 13 Variante B | erst nach Eintragung der Handels-GmbH (W14) | 0/6 |

### 3.3 AGB

| § | Prüfen (Schwerpunkt) | Offen |
|---|---|---|
| Kopf | Übergangsfassung für die MW GmbH fehlt (W14) | 1/3 |
| 1 | Vertragspartner, FN, UID | 0/4 |
| 2 | Urheberrecht an Plänen | 1/3 |
| 3 | Bonitätsprüfung, Vertragssprache | 1/4 |
| 4 | Variante A/B, Streichpreise (W8) | 2/4 |
| 5 | **Zahlungsplan widerspricht W6** (max. 50 %, Rest Zug um Zug); Garantie-Absatz nur bei echter Garantie, Mustersatz bewusst ausgeblendet | 4/10 |
| 6 | Stornopauschale 25 % | 1/2 |
| 7 | Widerrufsbelehrung + Musterformular fehlen als Entwurf; Hygieneartikel | 2/6 |
| 8 | Lieferzeiten; **Verweis in 8.3 auf „§ 13“ falsch (Haftung = § 16)** | 2/7 |
| 9 | Preisliste, Einlagerung | 1/11 |
| 10 | – | 0/0 |
| 11 | Einbauküche als Bestandteil | 1/1 |
| 12 | KSchG-Nummerierung 2026; Einbauküche 2 oder 3 Jahre | 2/3 |
| 13 | RAL-Verweis, Binni-Plattenauswahl | 1/4 |
| 14 | **14.3 auf „wir verkürzen nicht“ (W7)** | 3/4 |
| 15 | Barablöse; Café-Gutschein getrennt (W15); Aussteller | 2/8 |
| 16 | Haftung leichte Fahrlässigkeit AT/DE | 1/1 |
| 17 | DE-Liefergebiet, USt | 0/2 |
| 18 | Art. 120 IPRG, FL nicht LugÜ | 2/8 |
| 19 | Schlichtung, § 36 VSBG | 2/6 |
| Teil II (§§ 20–29) | battle of forms, Haftrücklass, B2B-Gewährleistung/Regress, Gerichtsstand, Schiedsklausel FL | 7/19 |
| Teil C | Punkt 3 an W6 angleichen | 1/2 |

### 3.4 Barrierefreiheit

| Abschnitt | Prüfen | Offen |
|---|---|---|
| Vorbemerkung | Greift die Kleinstunternehmen-Ausnahme? (VZÄ, Umsatz, Bilanzsumme) | 1/3 |
| 1 Dienstleistung | welche Online-Verträge es tatsächlich gibt | 0/2 |
| 2 Anforderungen | EN 301 549 oder WCAG 2.2 AA nennen; Prüfergebnis einfügen (nicht mehr behaupten als getestet) | 1/2 |
| 3 Nicht barrierefrei | Liste mit Begründung | 0/1 |
| 4 Barriere melden | zuständige Person, Antwortfrist | 0/1 |
| 5 Marktüberwachung | Sozialministeriumservice: Anschrift; weitere Stelle nötig? | 1/2 |

## 4. Was bewusst nicht in der Vorschau steht

- Teil A (Vorbemerkungen) und Teil D (Prüfliste) der AGB, das Arbeitspapier der Datenschutzerklärung (Abschn. 3–9: Fristen-Tabelle, Banner-Änderungen C1–C16, AVV-Liste, Verarbeitungsverzeichnis, DSFA, revDSG) – sie sind Arbeitsunterlagen, keine Webtexte.
- Der Mustersatz zur Anzahlungsgarantie (AGB 5.2): Es gibt keine Garantie, die Website darf keine gesicherte Anzahlung behaupten.
- Keine erfundenen Fristen, Anbieter oder Auftragsverarbeiter: Wo der Entwurf eine Lücke hat, steht die Lücke.

## 5. Ablauf bis zum Livegang

1. Kanzlei prüft in der Vorschau, Inhaber füllt die Stellen „vom Unternehmen auszufüllen“.
2. Änderungen in `src/components/LegalDrafts/docs/*.js` nachziehen (eine Datei je Text).
3. Livegang: die live Seiten `/datenschutz`, `/impressum` (und neu `/agb`, `/barrierefreiheit`) auf dieselben Daten umstellen, Module ohne Live-Funktion weglassen, Übersetzungen EN/FR/IT.

<!-- r4-recht-consent:start (tools/legal/services-md.mjs) -->

## 6. Runde 4: Consent-Texte (DPF/SCC) und Dienstliste

Stand: 26.10.2026 · Paket R4-recht-consent · erzeugt mit `node tools/legal/services-md.mjs`. Nichts davon ist live geschaltet; die live Seiten `/datenschutz` und `/impressum` sind unverändert.

### 6.1 Ladelogik der Google-Dienste (technisch, zum Abgleich mit dem Text)

- Vor jeder Wahl im Banner: **kein Request an Google** (auch nicht gtag.js). Consent Mode v2 steht auf „verweigert“.
- gtag.js lädt nur, wenn mindestens eine Konfiguration erlaubt **und** vorhanden ist: **Statistik** (GA4) oder **Marketing** mit hinterlegter Ads-Kennung. „Nur Marketing“ ohne Kennung lädt nichts (Datenminimierung).
- Der Banner-Schalter „Google Tag Manager“ (Funktional) steuert nichts; „Funktional“ hängt nur an Google Maps (C4).
- GA4-Konfiguration (G-1YCM6K57YG) nur mit **Statistik**; Ads-Konfiguration nur mit **Marketing** und erst, wenn eine Ads-Kennung hinterlegt ist (heute: keine).
- Widerruf: Consent-Update „verweigert“, die eigenen Cookies `_ga`, `_ga_*` bzw. `_gcl_*` werden gelöscht.
- Google Maps / Street View: erst nach Einwilligung „Funktional“ oder Klick auf „Karte laden“.
- Beleg: `tests/e2e/r4-recht-consent.spec.js` (Netzwerkmitschnitt), `tests/unit/r4-recht.test.mjs`.

### 6.2 Consent-Texte zur Freigabe (C1, C2)

Vorschlag aus `Marktresearch/digital/teamleiter/messages-r3-shell.json` (nach Rechtspaket 02 §4 C1/C2). Er wird erst nach Ihrer Freigabe in `src/messages/*.json` übernommen; bis dahin zeigt das Banner den heutigen Text.

**`Cookies.intro`**

| Sprache | heute live | Vorschlag zur Freigabe |
|---|---|---|
| Deutsch | Wir verwenden Cookies und ähnliche Techniken nur mit Ihrer Einwilligung, außer sie sind für die Website unbedingt nötig. Mit Ihrer Einwilligung übermitteln wir Daten an Google, teils in die USA. Sie können Ihre Wahl jederzeit unter „Privatsphäre-Einstellungen“ im Fuß der Seite ändern. | Wir verwenden Cookies und ähnliche Techniken nur mit Ihrer Einwilligung, außer sie sind für die Website unbedingt nötig. Mit Ihrer Einwilligung übermitteln wir Daten an Google, teils in die USA. Sie können Ihre Wahl jederzeit unter „Privatsphäre-Einstellungen“ im Fuß der Seite ändern. |
| Englisch | We use cookies and similar technologies only with your consent, unless they are strictly necessary for the website. With your consent we transfer data to Google, in part to the USA. You can change your choice at any time under “Privacy Settings” at the bottom of the page. | We use cookies and similar technologies only with your consent, unless they are strictly necessary for the website. With your consent we transfer data to Google, in part to the USA. You can change your choice at any time under “Privacy Settings” at the bottom of the page. |
| Französisch | Nous utilisons des cookies et des technologies similaires uniquement avec votre consentement, sauf s’ils sont strictement nécessaires au fonctionnement du site. Avec votre consentement, nous transmettons des données à Google, en partie vers les États-Unis. Vous pouvez modifier votre choix à tout moment sous « Paramètres de confidentialité » en bas de page. | Nous utilisons des cookies et des technologies similaires uniquement avec votre consentement, sauf s’ils sont strictement nécessaires au fonctionnement du site. Avec votre consentement, nous transmettons des données à Google, en partie vers les États-Unis. Vous pouvez modifier votre choix à tout moment sous « Paramètres de confidentialité » en bas de page. |
| Italienisch | Utilizziamo cookie e tecnologie simili solo con il vostro consenso, salvo quelli strettamente necessari al funzionamento del sito. Con il vostro consenso trasmettiamo dati a Google, in parte negli Stati Uniti. Potete modificare la vostra scelta in qualsiasi momento in «Impostazioni privacy» in fondo alla pagina. | Utilizziamo cookie e tecnologie simili solo con il suo consenso, salvo quelli strettamente necessari al funzionamento del sito. Con il suo consenso trasmettiamo dati a Google, in parte negli Stati Uniti. Può modificare la sua scelta in qualsiasi momento in «Impostazioni privacy» in fondo alla pagina. |

**`Cookies.thirdCountryNotice`**

| Sprache | heute live | Vorschlag zur Freigabe |
|---|---|---|
| Deutsch | Einige Dienste übermitteln Daten in die USA. Die Anbieter sind nach dem EU-US Data Privacy Framework zertifiziert bzw. es gelten Standardvertragsklauseln. Details je Dienst unter „Details anzeigen“. | Einige Dienste übermitteln Daten in die USA. Die Anbieter sind nach dem EU-US Data Privacy Framework zertifiziert bzw. es gelten Standardvertragsklauseln. Details je Dienst unter „Details anzeigen“. |
| Englisch | Some services transfer data to the USA. The providers are certified under the EU-US Data Privacy Framework or standard contractual clauses apply. Details for each service under “Show details”. | Some services transfer data to the USA. The providers are certified under the EU-US Data Privacy Framework or standard contractual clauses apply. Details for each service under “Show details”. |
| Französisch | Certains services transmettent des données vers les États-Unis. Les fournisseurs sont certifiés selon le EU-US Data Privacy Framework ou des clauses contractuelles types s’appliquent. Détails par service sous « Afficher les détails ». | Certains services transmettent des données vers les États-Unis. Les fournisseurs sont certifiés selon le EU-US Data Privacy Framework ou des clauses contractuelles types s’appliquent. Détails par service sous « Afficher les détails ». |
| Italienisch | Alcuni servizi trasmettono dati negli Stati Uniti. I fornitori sono certificati secondo l’EU-US Data Privacy Framework oppure si applicano clausole contrattuali tipo. Dettagli per ogni servizio in «Mostrate i dettagli». | Alcuni servizi trasmettono dati negli Stati Uniti. I fornitori sono certificati secondo l’EU-US Data Privacy Framework oppure si applicano clausole contrattuali tipo. Dettagli per ogni servizio in «Mostra dettagli». |

Prüffragen: Ist „zertifiziert bzw. es gelten Standardvertragsklauseln“ für jeden Dienst richtig (Google LLC: DPF-zertifiziert)? Braucht der Text die Schweiz (Swiss-US DPF)? Soll „[Meta]“ entfallen, solange kein Meta Pixel läuft (der Vorschlag nennt nur Google)?

### 6.3 Dienstliste aus dem Dienste-Register

Quelle: `src/lib/legal/services.js`. Dieselben Einträge speisen das Cookie-Banner (5 schaltbare Dienste: `googleMaps`, `googleTagManager`, `googleAnalytics`, `googleAds`, `einblicke`) und den Anhang „Eingesetzte Dienste“ der DSE-Vorschau (http://localhost:3000/de/preview/recht/datenschutz#dienste). Ein Unit-Test prüft, dass beide dieselben Schlüssel haben. Status: *aktiv* = live, *labs* = gebaut, nur auf Test-Routen oder hinter Schalter, *nicht eingesetzt* = geprüft, nicht im Code.

| Dienst | Status | Im Banner | Zweck | Rechtsgrundlage | Empfänger | Drittland | Speicherdauer |
|---|---|---|---|---|---|---|---|
| Einwilligungs-Cookie „cookieConsent“ | aktiv | nein | Speichert Ihre Auswahl im Cookie-Banner, damit wir nicht bei jedem Aufruf neu fragen (C6). | § 165 Abs 3 TKG 2021 (unbedingt erforderlich); Art. 6 Abs 1 lit c DSGVO (Nachweis der Einwilligung, Art. 7 Abs 1) [anwaltlich prüfen] | keine | keine | 12 Monate (Cookie, Erstanbieter) |
| Hosting der Website | aktiv | nein | Auslieferung der Website; Server-Protokolle (IP-Adresse, Zeit, aufgerufene Adresse, Browser) zur Sicherheit und Fehlersuche. | Art. 6 Abs 1 lit f DSGVO (sicherer Betrieb) | Hoster als Auftragsverarbeiter [AV-Vertrag – vom Unternehmen zu bestätigen] | [vom Unternehmen auszufüllen; Ziel: EU] | Server-Protokolle [14 Tage – vom Unternehmen festzulegen] |
| Schriften (selbst gehostet) | aktiv | nein | Darstellung der Schriften Bodoni Moda, Instrument Sans und Montserrat. Sie werden beim Build über next/font geladen und von unserem Server ausgeliefert; Ihr Browser fragt dafür nicht bei Google an. | keine Übermittlung an Dritte; Teil der Auslieferung (Art. 6 Abs 1 lit f DSGVO) | keine | keine | keine Speicherung personenbezogener Daten |
| Backoffice (Frappe) auf backoffice.platzhirsch.studio | aktiv | nein | Empfang und Bearbeitung von Kontakt-, Produkt- und Beratungsanfragen sowie Newsletter-Anmeldungen (über unseren Server, nicht direkt aus dem Browser); Produkt-, Marken- und Bilddaten der Website (Bilder über /cmx). | Anfragen: Art. 6 Abs 1 lit b DSGVO (vorvertraglich); Newsletter: Art. 6 Abs 1 lit a DSGVO; Bildauslieferung: lit f | Mitarbeitende mit eigenem Backoffice-Konto; Entwicklungsdienstleister [Sitz und AV-Vertrag – anwaltlich prüfen, siehe 5.1] | [vom Unternehmen auszufüllen; Fernzugriff des Dienstleisters aus einem Land ohne Angemessenheitsbeschluss – anwaltlich prüfen] | Anfragen [12 Monate nach Abschluss – vom Unternehmen festzulegen]; Newsletter bis zum Widerruf |
| Google Maps (Karte und Street-View-Ansicht der Ausstellung) | aktiv | ja, unter Funktional | Eingebettete Karte (Kontaktseite) und Street-View-Ansicht der Ausstellung (Seite Das Haus). Geladen erst nach Einwilligung oder Klick auf „Karte laden“; dabei gehen IP-Adresse und Browserdaten an Google. | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (Einwilligung) | Google Ireland Limited, Google LLC | USA und weitere Länder laut Google; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss (EU) 2023/1795), ergänzend Standardvertragsklauseln [anwaltlich prüfen: Länderliste kürzen, C3] | Cookies laut Liste im Banner (bis 13 Monate); Daten bei Google laut Google-Datenschutzerklärung |
| Google-Tag-Bibliothek (gtag.js von googletagmanager.com) | aktiv | ja, unter Funktional (Schalter ohne Wirkung, lädt nur mit Statistik oder Marketing; C4) | Die Bibliothek gtag.js wird von www.googletagmanager.com geladen, und zwar nur zusammen mit einer Konfiguration: mit Ihrer Einwilligung in Statistik (GA4) oder in Marketing, sobald eine Ads-Kennung hinterlegt ist. Einen Google-Tag-Manager-Container setzen wir nicht ein. Der eigene Schalter „Google Tag Manager“ unter „Funktional“ im Banner steuert nichts [anwaltlich prüfen: Schalter nach C4 entfernen; der Schlüssel bleibt bis dahin im Cookie]. | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (über die Einwilligung in Statistik oder Marketing) | Google Ireland Limited, Google LLC | USA und weitere Länder laut Google; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss (EU) 2023/1795), ergänzend Standardvertragsklauseln [anwaltlich prüfen: Länderliste kürzen, C3] | setzt selbst keine Cookies |
| Google Analytics 4 | aktiv | ja, unter Statistik | Reichweitenmessung (Seitenaufrufe, Geräte, Herkunft, Ereignisse wie Anfragen und Klicks auf Telefon/E-Mail). Mess-ID G-1YCM6K57YG. GA4-Konfiguration nur mit Einwilligung in Statistik; Google Consent Mode v2, Voreinstellung „verweigert“. | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (nur Einwilligung, kein berechtigtes Interesse; D3) | Google Ireland Limited (Auftragsverarbeiter), Google LLC | USA und weitere Länder laut Google; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss (EU) 2023/1795), ergänzend Standardvertragsklauseln [anwaltlich prüfen: Länderliste kürzen, C3] | Cookies 24 Monate; Ereignisdaten in GA4 [2 oder 14 Monate – vom Unternehmen in der GA4-Verwaltung einzustellen, Empfehlung 14 Monate; D5] |
| Google Ads (Conversion-Messung, Remarketing) | aktiv | ja, unter Marketing | Messung, ob eine Anzeige zu einer Anfrage geführt hat, und Remarketing. gtag.js und die Ads-Konfiguration laden nur mit dieser Einwilligung und erst, wenn eine Ads-Kennung hinterlegt ist; bis dahin geht bei „nur Marketing“ nichts an Google [vom Unternehmen: Ads-Konto, Kennung AW-…]. Erweiterte Conversions (gehashte E-Mail) sind nicht aktiv. | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (Einwilligung) | Google Ireland Limited [Rolle Auftragsverarbeiter oder eigener Verantwortlicher – anwaltlich prüfen] | USA und weitere Länder laut Google; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss (EU) 2023/1795), ergänzend Standardvertragsklauseln [anwaltlich prüfen: Länderliste kürzen, C3] | Cookies laut Banner [Liste nach C7 aktualisieren: _gcl_au/_gcl_aw 90 Tage, IDE 13 Monate, test_cookie 15 Min., CONSENT 18 Jahre streichen – anwaltlich prüfen] |
| Besucher-Einblicke (eigene Heatmap, kein Drittanbieter) | aktiv | ja, unter Statistik | Eigene, anonymisierte Heatmap: Klickpositionen und angeklickte Elemente, Mausbewegung im 40-px-Raster (nur Desktop), Scrolltiefe, Sichtzeit je Abschnitt, Namen berührter Formularfelder (nie Inhalte, keine Tastatureingaben), Validierungs- und JavaScript-Fehlertypen, Ziele (z. B. Termin, Anfrage) und Planer-Schritte, Herkunftskanal, Gerätegruppe und Fensterbreite. Keine Sitzungsaufzeichnung, keine IP-Adresse, kein Fingerprinting, keine Drittanbieter; Do-Not-Track und Global Privacy Control werden beachtet. | Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 / § 25 Abs 1 TDDDG (eigene Einwilligung „einblicke“, unabhängig von Google Analytics) | keine Dritten; Tagesaggregate im eigenen Backoffice (Frappe, Rolle „Einblicke Leser“) [Hoster und AV-Vertrag – vom Unternehmen zu bestätigen] | keine [Serverstandort von Website und Backoffice – vom Unternehmen zu bestätigen; Ziel: EU/CH] | Zufällige Sitzungs-ID „ph_eb“ im sessionStorage, 30 Minuten; pseudonyme Rohdaten (ohne IP) höchstens 14 Tage, im Code erzwungen; danach nur anonyme Tagesaggregate (mindestens 5 Besuche je Seite und Gerät) im Backoffice, Voreinstellung 395 Tage (13 Monate) |
| KI-Concierge (Chat-Assistent, Labs) | labs | nein | Antworten auf Fragen zu Marken, Produkten und Terminen. Ihre Nachrichten gehen über unseren Server an die Claude API; ohne Einwilligung im Chat startet er nicht. | Code: Einwilligung im Chat (Art. 6 Abs 1 lit a DSGVO); Entwurf 5.10: lit b [anwaltlich prüfen: vereinheitlichen] | Anthropic als Auftragsverarbeiter [DPA, Zero Data Retention – anwaltlich prüfen] | USA [Zertifizierung nach dem EU-US Data Privacy Framework prüfen, sonst Standardvertragsklauseln] | Einwilligungs-Token 12 Stunden (sessionStorage); gespeicherte Gesprächsverläufe 30 Tage (Code und Entwurf, Rechtspaket 4.6) [anwaltlich prüfen] |
| Kundenportal „Mein Platzhirsch“ (Labs) | labs | nein | Projektunterlagen, Termine und Rückmeldungen für Kundinnen und Kunden; Anmeldung per E-Mail-Link (15 Minuten gültig). | Art. 6 Abs 1 lit b DSGVO (Vertrag); Sprachnachrichten: lit a | Backoffice (Frappe); Versand der Anmelde-Mail über [Resend, Postmark, Frappe-Mailkonto oder eigenes Relay – vom Unternehmen festzulegen] | [abhängig vom Mail-Anbieter – vom Unternehmen auszufüllen] | Sitzungs-Cookie „ph_portal_session“ 30 Tage; weitere Fristen in Abschnitt 5.18 [vom Unternehmen zu bestätigen] |
| E-Mail-Versand (Anmeldelink Kundenportal, Moodboard-PDF Stil-Finder) | labs | nein | Versand des Anmeldelinks zum Kundenportal (src/lib/portal/mailer.js, PORTAL_MAIL_PROVIDER) und des Moodboard-PDF aus dem Stil-Finder (src/lib/stilfinder/mail.js, STILFINDER_MAIL_PROVIDER). Ohne vollständige Konfiguration wird nichts versendet (Entwicklungs-Postausgang). Anfrageformulare versenden keine Mail über diese Dienste: src/lib/forms/forward.js leitet sie nur an das Backoffice weiter. | Art. 6 Abs 1 lit b DSGVO (vom Nutzer angeforderter Versand) [Kanzlei prüfen] | Mail-Versanddienst als Auftragsverarbeiter [AV-Vertrag – vom Unternehmen zu bestätigen] | USA bei Resend oder Postmark [Kanzlei prüfen: DPF-Zertifizierung oder Standardvertragsklauseln] | Versandprotokolle beim Anbieter [Frist laut Anbieter – vom Unternehmen festzulegen]; der Stil-Finder speichert die Angaben nach dem Versand nicht |
| Handy-Upload von Fotos, Videos und Plänen (Labs) | labs | nein | Fotos, Videos und Pläne zu einer bestehenden Anfrage per QR-Code hochladen; Ablage im Backoffice. GPS-Daten werden heute nur bei JPEG entfernt. | Code: Einwilligung beim Upload (Art. 6 Abs 1 lit a DSGVO); Entwurf: lit b [anwaltlich prüfen] | Backoffice (Frappe) | keine [Serverstandort – vom Unternehmen zu bestätigen] | 180 Tage nach Ablauf des Links [Vorschlag, Bestätigung durch das Unternehmen offen; bis dahin nimmt der Upload nichts an (UPLOAD_CONFIG.retentionConfirmed)] |
| Online-Planer (Küchenplaner, Sofa-Modulplaner, Labs) | labs | nein | Entwurf im Browser planen; auf Wunsch an uns senden. Der Sofa-Planer speichert den Entwurf im Local Storage Ihres Browsers. | Senden: Art. 6 Abs 1 lit b DSGVO [Checkbox im Küchenplaner als Einwilligung formuliert – anwaltlich prüfen]; Local Storage: § 165 Abs 3 TKG 2021 (vom Nutzer ausgelöst) | Backoffice (Frappe); Zwischenspeicher [Redis-Anbieter – vom Unternehmen auszufüllen] | [vom Unternehmen auszufüllen] | 180 Tage [vom Unternehmen zu bestätigen] |
| Wechselkurse der Europäischen Zentralbank (Labs) | labs | nein | CHF-Umrechnung im Dreiländer-Rechner. Unser Server lädt die Kurse; Ihr Browser fragt nicht bei der EZB an. | keine personenbezogenen Daten | keine | keine | keine Speicherung personenbezogener Daten |
| Links zu Instagram, Facebook und LinkedIn | aktiv | nein | Einfache Links in Fuß und Kontaktbereich, keine eingebetteten Plugins. Daten gehen erst an die Plattform, wenn Sie den Link öffnen. | keine Übermittlung durch uns | keine | keine | keine |
| YouTube- oder Vimeo-Videos | nicht eingesetzt | nein | Kein Video-Einbettung im Code (Inventur 26.10.2026). Falls Videos kommen: nur nach Klick über ConsentEmbed und mit eigenem Banner-Eintrag (AP2). | – | – | – | – |
| Online-Terminkalender mit Videoberatung (eigene Seite /termin) | labs | nein | Terminwahl (Studio, Video, vor Ort, Planungstermin), Bestätigung per E-Mail-Link (Double-Opt-in), Ändern/Absagen über einen signierten Link. Ohne Frappe-Schlüssel nur Testbetrieb im Dev. In Produktion erst mit freigegebenem DSE-Abschnitt (Vorschlag termin-dse-vorschlag.md). | Art. 6 Abs 1 lit b DSGVO; Video zusätzlich Einwilligung lit a [anwaltlich prüfen] | Backoffice (Frappe); Termin-Mails über Resend [AV-Vertrag – vom Unternehmen zu bestätigen] | USA beim Mailversand über Resend (wie Abschnitt E-Mail-Versand) [anwaltlich prüfen] | [6 Monate nach dem Termin ohne Auftrag – Vorschlag, Kanzlei] |
| Meta Pixel | nicht eingesetzt | nein | Nicht eingebunden. Erst mit Konto und eigenem Banner-Eintrag (C8, Welle 2). | – | – | – | – |

### 6.4 Stand der Banner-Änderungen C1–C16 (Rechtspaket 02 §4)

| # | Änderung | Stand |
|---|---|---|
| C1 | `Cookies.intro` ohne „berechtigtes Interesse“ | Text liegt vor (unten, 4 Sprachen), **wartet auf Freigabe**; live noch alter Text |
| C2 | `Cookies.thirdCountryNotice` DPF/SCC statt Art. 49 | Text liegt vor (unten, 4 Sprachen), **wartet auf Freigabe** |
| C3 | Mechanismen DPF + SCC je Dienst, Länderliste kürzen | offen; Banner zeigt die bisherige Liste (16 Länder), Register nennt „USA und weitere Länder laut Google“ |
| C4 | Google Tag Manager entfernen | offen; es gibt keinen GTM-Container, nur gtag.js. Schlüssel `googleTagManager` bleibt im Cookie (Format), Schalter steuert nichts. Seit R4-Fix: „Funktional“ hängt nur an Google Maps, DSE-Anhang nennt die echte Ladelogik; Schalter aus dem Banner entfernen nach Freigabe |
| C5 | Beschreibung „Funktional“ neu | offen (Rechtstext, Freigabe) |
| C6 | „Essenziell“ mit `cookieConsent` 12 Monate | im Register und in der DSE-Vorschau; im Banner noch nicht sichtbar |
| C7 | Google-Ads-Cookieliste aktualisieren | offen, im Register als [anwaltlich prüfen] markiert |
| C8 | Meta Pixel | nicht eingesetzt (kein Konto) |
| C9 | Terminkalender | nicht eingesetzt; kommt hinter Schalter mit eigenem Eintrag |
| C10 | Chat/Video-Widget | nicht eingesetzt; KI-Concierge ist eigenes Widget ohne Cookies (Labs) |
| C11 | Banner-Version im Consent-Objekt | offen; ändert das Cookie-Format, eigenes Paket |
| C12 | Consent-Protokoll serverseitig | offen; eigenes Paket |
| C13 | kein gtag ohne Einwilligung | **umgesetzt und per Playwright am Netzwerk belegt** (0 Google-Requests vor der Wahl) |
| C14 | `Cookies.embedText` mit Hinweis auf Übermittlung | offen (Rechtstext) |
| C15 | Übersetzungen prüfen | offen |
| C16 | Ads in zwei Schalter teilen (optional) | offen [anwaltlich prüfen] |

### 6.5 Bildregister

`Marktresearch/recht/bildrechte.csv` (erzeugt mit `node tools/legal/image-audit.mjs`): alle Bilder aus `public/`, `src/lib/data/**`, den Hosts in `remotePatterns` und einer Stichprobe der Backoffice-Bilder auf 13 Seiten. Spalte „freigabe“ ist „offen“ außer bei den 5 Navetta-Fotos und `aboutHome.jpg` (Mails vom 28.10.2026, Inhaber-Entscheidung Nr. 11); Rechteinhaber und Umfang (Web/Ads/Feed/Bearbeitung/KI) trägt der Inhaber ein. Grundlage für Impressum Abschn. 11 (Bildnachweise).

<!-- r4-recht-consent:end -->
