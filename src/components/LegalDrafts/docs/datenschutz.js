// Datenschutzerklärung – Anwalts-Vorschau.
// Text: Marktresearch/recht/02-datenschutzerklaerung-entwurf.md, Abschnitt 2
// (Webtext), word for word; markers [ … ] are the draft's open points.
// Changes against the draft, each visible on the page:
//  - address/phone from src/lib/site.js (Rechtspaket 00, W1)
//  - 5.11 deletion period per Rechtspaket 00, W10
//  - 5.10 note "Stand der Umsetzung" (Labs code differs from the draft)
//  - NEW 5.18 Kundenportal, 5.19 Uploads, 5.20 Online-Planer from the feature
//    docs (digital/features/*.md) and the values in the feature code.
import { ACCOUNT_RETENTION, FEEDBACK_RETENTION, MAGIC_LINK_MINUTES, OWNER_CONFIRMED, RECIPIENTS, SESSION_DAYS, VOICE_RETENTION } from "@/lib/portal/privacy";
import { CONSENT_VERSION as UPLOAD_CONSENT_VERSION, UPLOAD_CONFIG } from "@/lib/upload/config";
import { RETENTION_DAYS as CONCIERGE_RETENTION_DAYS } from "@/lib/concierge/config";
import { EMAIL, PHONE_DISPLAY, REGISTER, SITE_NAME, STREET_LINE } from "../company";
import { dseServiceRows } from "@/lib/legal/services";

// Section "Eingesetzte Dienste" (R4-recht-consent): generated from the
// Dienste-Register src/lib/legal/services.js, the same source as the consent
// banner (unit test: same key set). Change a service there, not here.
const SERVICE_ROWS = dseServiceRows();
const serviceBlocks = [
  "Diese Liste entsteht automatisch aus dem Dienste-Register der Website (`src/lib/legal/services.js`). Aus derselben Quelle kommen die Dienste im Cookie-Banner. Grundlage ist eine Inventur des Codes vom 26.10.2026: alle externen Adressen, eingebetteten Inhalte, nachgeladenen Skripte und konfigurierten Anbieter.",
  {
    table: {
      caption: "Eingesetzte Dienste – Überblick",
      head: ["Dienst", "Status", "Im Banner", "Abschnitt"],
      rows: [], // filled at the end of this file, with the section numbers
    },
  },
  ...SERVICE_ROWS.flatMap((r) => [
    { h: `${r.name} (${r.status})` },
    {
      ul: [
        `**Anbieter:** ${r.provider}`,
        `**Zweck:** ${r.purpose}`,
        `**Rechtsgrundlage:** ${r.legalBasis}`,
        `**Empfänger:** ${r.recipients}`,
        `**Drittland:** ${r.thirdCountry}`,
        `**Speicherdauer:** ${r.retention}`,
        ...(r.code.length ? [`**Im Code:** ${r.code.map((c) => "`" + c + "`").join(", ")}`] : []),
      ],
    },
  ]),
];

const ownerNote = OWNER_CONFIRMED ? "" : " [Fristen aus src/lib/portal/privacy.js sind ein Vorschlag des Entwicklers – vom Unternehmen zu bestätigen]";
// Law-firm preview: an unconfirmed period stays an open point (the live
// upload takes nothing until it is confirmed, r1-recht-inhalt P0-4).
const uploadDays = UPLOAD_CONFIG.retentionConfirmed
  ? `${UPLOAD_CONFIG.retentionDays} Tage`
  : `${UPLOAD_CONFIG.retentionDays} Tage [Vorschlag, Bestätigung durch das Unternehmen offen; bis dahin nimmt der Upload nichts an]`;

const DATENSCHUTZ = {
  slug: "datenschutz",
  title: "Datenschutzerklärung",
  heading: "Datenschutz­erklärung",
  navLabel: "Datenschutz",
  livePath: "/datenschutz",
  lead: "Neue Datenschutzerklärung in Modulen, ergänzt um Kundenportal, Uploads, Online-Planer und KI-Concierge. Abschnitte mit „Modul“ erscheinen nur, wenn die Funktion live ist.",
  sources: [
    "Marktresearch/recht/02-datenschutzerklaerung-entwurf.md, Abschnitt 2",
    "Marktresearch/recht/00-rechtspaket-uebersicht.md, Abschnitt 2 (W1, W9, W10, W12)",
    "Marktresearch/digital/features/kundenportal.md, handy-upload.md, kuechenplaner.md, sofaplaner.md, concierge.md",
  ],
  version: "Stand: [Datum der Veröffentlichung – vom Unternehmen auszufüllen] · Version [x.y – vom Unternehmen auszufüllen]",
  // The five errors of today's live page (02, Befund 1 und Tabelle 1.1).
  knownErrors: [
    { id: "D2", title: "Privacy Shield", text: "Die heutige Erklärung stützt US-Übermittlungen auf den „Privacy Shield“. Der Beschluss 2016/1250 ist seit EuGH C-311/18 (16.07.2020) ungültig. Richtig: EU-US Data Privacy Framework (Durchführungsbeschluss (EU) 2023/1795) und Einwilligung." },
    { id: "D1", title: "TKG 2003", text: "Sie nennt „TKG 2003“ und „§ 96 Abs 3 TKG“. Das TKG 2003 ist seit 01.11.2021 außer Kraft. Richtig: § 165 Abs 3 TKG 2021." },
    { id: "D3", title: "Google Analytics auf berechtigtes Interesse", text: "Sie stützt Google Analytics auf Art. 6 Abs 1 lit a „und/oder f“. Analyse-Cookies brauchen eine Einwilligung (§ 165 Abs 3 TKG 2021); der Banner fragt sie auch ab. Richtig: nur lit a." },
    { id: "D5", title: "Speicherdauer 26 Monate", text: "Sie nennt eine GA-Speicherdauer von 26 Monaten. GA4 kennt für Ereignisdaten nur 2 oder 14 Monate. Richtig: die tatsächliche Einstellung, Empfehlung 14 Monate." },
    { id: "D8", title: "Newsletter-Felder", text: "Sie nennt für den Newsletter „Interessengebiete, Geburtstag, PLZ“. Das Formular fragt nur die E-Mail-Adresse ab. Richtig: nur die Felder, die das Formular wirklich erhebt." },
  ],
  sections: [
    {
      id: "verantwortlich",
      num: "1",
      title: "Wer ist verantwortlich?",
      source: "02, Abschn. 2.1",
      blocks: [
        "Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten auf platzhirsch.studio und in unserem Showroom ist:",
        {
          address: [
            `**${REGISTER.legalName}**, Marke „${SITE_NAME}“`,
            STREET_LINE,
            `Firmenbuch: ${REGISTER.fn}, ${REGISTER.court}`,
            `Telefon: ${PHONE_DISPLAY} · E-Mail für Datenschutzanliegen: **datenschutz@platzhirsch.studio** [vom Unternehmen anzulegen]`,
          ],
        },
        { label: "Hinweis zur Vorschau", note: "Anschrift und Telefon kommen aus src/lib/site.js (Landstraße 11 laut Firmenbuch, Rechtspaket 00, W1). Der Entwurf hatte hier einen Platzhalter für die Hausnummer (9 oder 11); die Angabe muss mit dem Impressum identisch sein – das ist durch die gemeinsame Quelle gesichert." },
        "*[Nach der Ausgliederung: neuen Rechtsträger eintragen. Falls beide Gesellschaften Kundendaten gemeinsam nutzen (z. B. Café-Gutscheine im Shop), Vereinbarung nach Art. 26 DSGVO – anwaltlich prüfen.]*",
        "Einen Datenschutzbeauftragten haben wir nicht bestellt, weil die Voraussetzungen des Art. 37 DSGVO nicht vorliegen. *[anwaltlich prüfen; bei KI-Profiling oder umfangreichem Ads-Abgleich neu bewerten]*",
        "**Für Personen in der Schweiz:** Diese Erklärung gilt auch nach dem Schweizer Datenschutzgesetz (DSG). Begriffe wie „Verarbeitung“ und „personenbezogene Daten“ entsprechen „Bearbeitung“ und „Personendaten“ im DSG. *[Vertreter in der Schweiz nach Art. 14 DSG: siehe Abschnitt 7 des Arbeitspapiers – voraussichtlich nicht nötig.]*",
      ],
    },
    {
      id: "ueberblick",
      num: "2",
      title: "Überblick: Was wir verarbeiten und warum",
      source: "02, Abschn. 2.2",
      blocks: [
        "Wir verarbeiten Daten nur, soweit es für den jeweiligen Zweck nötig ist. Für jede Verarbeitung nennen wir unten Zweck, Rechtsgrundlage, Empfänger, Übermittlung in Drittländer und Speicherdauer. Rechtsgrundlagen sind:",
        {
          ul: [
            "**Vertrag oder vorvertragliche Anfrage** – Art. 6 Abs 1 lit b DSGVO (z. B. Ihre Anfrage, Ihr Termin, Ihre Bestellung)",
            "**Rechtliche Pflicht** – Art. 6 Abs 1 lit c DSGVO (z. B. Aufbewahrung von Rechnungen nach § 132 BAO und § 212 UGB)",
            "**Berechtigtes Interesse** – Art. 6 Abs 1 lit f DSGVO (z. B. sicherer Betrieb der Website, Abwehr von Spam). Dagegen können Sie jederzeit Widerspruch einlegen (Abschnitt 6).",
            "**Einwilligung** – Art. 6 Abs 1 lit a DSGVO, bei Cookies und ähnlichen Techniken zusätzlich § 165 Abs 3 TKG 2021 (für Besucher aus Deutschland: § 25 TDDDG). Eine Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen, über **„Privatsphäre-Einstellungen“ im Fuß jeder Seite** oder per E-Mail.",
          ],
        },
        "Wir treffen **keine automatisierten Entscheidungen** im Sinne von Art. 22 DSGVO bzw. Art. 21 DSG, die Ihnen gegenüber rechtliche Wirkung entfalten.",
      ],
    },
    {
      id: "website",
      num: "3",
      title: "Besuch der Website",
      source: "02, Abschn. 2.3",
      blocks: [
        "**3.1 Hosting und Server-Protokolle.** Die Website läuft auf einem Server von [Hosting-Anbieter, Sitz, Rechenzentrumsstandort – vom Unternehmen auszufüllen]. Bei jedem Aufruf verarbeitet der Server technisch notwendig: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, Referrer, Browser und Betriebssystem, Statuscode und Datenmenge. Zweck: Auslieferung der Seite, Sicherheit, Fehlersuche. Rechtsgrundlage: Art. 6 Abs 1 lit f DSGVO (berechtigtes Interesse an einem sicheren, funktionsfähigen Angebot). Speicherdauer der Protokolle: [14] Tage [vom Unternehmen festzulegen und technisch umzusetzen, Logs unter `/var/log`], danach Löschung, außer ein Sicherheitsvorfall erfordert längere Aufbewahrung. Der Hosting-Anbieter ist unser Auftragsverarbeiter.",
        "**3.2 Produktdaten und Bilder.** Produktdaten und Bilder laden wir serverseitig aus unserem eigenen Verwaltungssystem. Dabei werden keine Daten Ihres Browsers an Dritte übermittelt.",
        "**3.3 Schriften.** Wir binden Schriften lokal ein. Es wird keine Verbindung zu Google Fonts oder anderen Schriftdiensten aufgebaut.",
        "**3.4 [MODUL, nur wenn eingesetzt] Spam-Schutz.** Unsere Formulare enthalten ein für Menschen unsichtbares Feld, das automatisierte Eingaben erkennt. Dabei werden keine zusätzlichen Daten erhoben. *[Falls Cloudflare Turnstile o. ä. eingesetzt wird (Bericht 06): Anbieter, Daten (IP, Browsermerkmale), Rechtsgrundlage und Drittland ergänzen; ob Einwilligung nötig ist – anwaltlich prüfen. Datensparsamere Alternative: Honeypot + Rate-Limit ohne Drittanbieter.]*",
      ],
    },
    {
      id: "cookies",
      num: "4",
      title: "Cookies, Einwilligungen und Ihre Wahl",
      source: "02, Abschn. 2.4",
      blocks: [
        "Wir setzen Cookies und vergleichbare Techniken (Local Storage, Pixel) nur ein, wenn sie für den von Ihnen gewünschten Dienst unbedingt erforderlich sind oder Sie eingewilligt haben (§ 165 Abs 3 TKG 2021). Beim ersten Besuch fragen wir Sie in einem Banner. „Weiter ohne Einwilligung“ ist genauso einfach wie „Alle akzeptieren“. Ohne Einwilligung laden wir keine Analyse-, Werbe- oder Kartendienste.",
        "**Unbedingt erforderlich:** Cookie `cookieConsent` (speichert Ihre Auswahl, 12 Monate, Erstanbieter). *[Bei Shop: Warenkorb-/Session-Cookie ergänzen; bei Sprachwahl ggf. `NEXT_LOCALE`.]* Nach 12 Monaten oder wenn wir neue Dienste einsetzen, fragen wir erneut.",
        "**Einwilligungsnachweis:** [MODUL] Um nachweisen zu können, dass Sie eingewilligt haben (Art. 7 Abs 1 DSGVO), speichern wir auf unserem Server eine zufällige Kennung, Zeitpunkt, Version des Banners und Ihre Auswahl, ohne IP-Adresse, für [3 Jahre] nach Ende der Einwilligung [anwaltlich prüfen: Frist].",
        "Die einzelnen Dienste, Cookie-Namen und Laufzeiten finden Sie jederzeit unter **„Privatsphäre-Einstellungen“ → „Details anzeigen“**.",
        { label: "Ergänzung aus den Feature-Dokus", note: "Kundenportal: Session-Cookie `ph_portal_session` (5.18). Sofa-Modulplaner: Entwurf und Merkliste im Local Storage des Browsers, vom Nutzer ausgelöst, nach § 165 Abs 3 TKG 2021 „unbedingt erforderlich“ (sofaplaner.md, „Rechtliches“). KI-Concierge: Einwilligungs-Token im sessionStorage (concierge.md). [anwaltlich prüfen: in der Liste „Unbedingt erforderlich“ nennen]" },
      ],
    },
    {
      id: "verarbeitungen",
      num: "5",
      title: "Die einzelnen Verarbeitungen",
      source: "02, Abschn. 2.5",
      blocks: [],
      sub: [
        {
          id: "anfragen",
          num: "5.1",
          title: "Kontaktformular, Produktanfrage, Beratungsanfrage, E-Mail und Telefon",
          blocks: [
            {
              ul: [
                "**Daten:** Name, E-Mail, Telefon (soweit angegeben), Wohnort/Land/Adresse (bei Produktanfragen für Lieferung und Angebot), Inhalt Ihrer Nachricht, Thema, Zeitrahmen und gemerkte Produkte.",
                "**Zweck:** Beantwortung Ihrer Anfrage, Erstellung eines Angebots, Rückfragen.",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (vorvertragliche Maßnahme auf Ihre Anfrage). Pflichtfelder sind markiert; ohne sie können wir die Anfrage nicht bearbeiten.",
                "**Empfänger:** Ihre Angaben werden über unseren Server an unser Kunden- und Warenwirtschaftssystem (Frappe/ERPNext) übermittelt, das [von uns selbst auf Servern von … / von … als Auftragsverarbeiter – vom Unternehmen auszufüllen] betrieben wird. Intern erhalten nur die zuständigen Beraterinnen und Berater Zugriff. Bei Küchen- und Möbelprojekten geben wir notwendige Angaben (Maße, Lieferort, ggf. Name) an den jeweiligen Hersteller oder Planungspartner weiter, wenn das für das Angebot erforderlich ist (Art. 6 Abs 1 lit b). *[Hersteller in Drittländern, z. B. Manufakturpartner Binni im Kosovo (kein Angemessenheitsbeschluss): nur Maße und Projektdaten ohne Namen übermitteln oder SCC abschließen – anwaltlich prüfen; siehe Bericht 26.]*",
                "**Speicherdauer:** Kommt kein Auftrag zustande, löschen wir die Anfrage **[12] Monate nach dem letzten Kontakt** [vom Unternehmen festzulegen; Küchenprojekte haben lange Entscheidungszeiten, die alte Frist „6 Monate“ ist nur zu halten, wenn das Backoffice das auch tut]. Wird ein Auftrag daraus, gelten die Fristen in 5.12.",
                "**Herkunft der Anfrage (Werbeerfolg):** [MODUL] Wenn Sie in Marketing-Dienste eingewilligt haben, speichern wir zusammen mit der Anfrage, über welche Anzeige oder Kampagne Sie gekommen sind (z. B. `gclid`, `fbclid`, UTM-Parameter). Ohne Einwilligung speichern wir das nicht. Speicherdauer wie die Anfrage.",
              ],
            },
          ],
        },
        {
          id: "google-analytics",
          num: "5.2",
          title: "Google Analytics 4 (Statistik, nur mit Einwilligung)",
          blocks: [
            {
              ul: [
                "**Anbieter:** Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland (Auftragsverarbeiter); Muttergesellschaft Google LLC, USA.",
                "**Was:** Seitenaufrufe, Verweildauer, Gerätetyp, Browser, ungefährer Standort (Land/Stadt, aus der IP abgeleitet; GA4 speichert laut Google keine IP-Adressen), Herkunft (Referrer, Kampagne) und folgende Ereignisse: **`generate_lead`** (Absenden eines Anfrageformulars, mit Formulartyp und Anzahl gemerkter Produkte), **`contact_click`** (Klick auf Telefon-, E-Mail- oder WhatsApp-Link, mit Art des Kontakts und Seite), **`sign_up`** (Newsletter-Anmeldung). Wir übermitteln **keine** Namen, E-Mail-Adressen oder Nachrichteninhalte an Google Analytics. *[Bei Shop: `purchase` mit Bestellnummer und Wert ergänzen.]*",
                "**Cookies:** `_ga`, `_ga_<ID>` (bis 24 Monate).",
                "**Zweck:** Reichweitenmessung, Verbesserung der Website, Messung, welche Seiten zu Anfragen führen.",
                "**Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021.",
                "**Speicherdauer bei Google:** [14] Monate [vom Unternehmen in GA4 → Datenaufbewahrung prüfen und eintragen]. Google Signals und Datenfreigabe an Google zu Produktzwecken: [deaktiviert – vom Unternehmen zu bestätigen].",
                "**Drittland:** Übermittlung an Google LLC in die USA möglich; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023, Art. 45 DSGVO); für die Schweiz Swiss-US DPF (seit 15.09.2024 im Anhang 1 der DSV). Ergänzend Standardvertragsklauseln.",
                "**Widerruf:** „Privatsphäre-Einstellungen“; dabei löschen wir die `_ga`-Cookies in Ihrem Browser.",
              ],
            },
          ],
        },
        {
          id: "google-ads",
          num: "5.3",
          title: "Google Ads: Conversion-Messung, Remarketing, erweiterte Conversions (nur mit Einwilligung)",
          blocks: [
            {
              ul: [
                "**Anbieter:** Google Ireland Limited (siehe 5.2).",
                "**Was:** Ob Sie über eine Google-Anzeige zu uns kamen und danach eine Anfrage, einen Anruf-Klick, eine Newsletter-Anmeldung oder einen Kauf ausgelöst haben; Anzeigenklick-Kennung (`gclid`), Cookies `_gcl_au`, `_gcl_aw` (bis 90 Tage) und Cookies von Google-Domains (z. B. `IDE`, bis 13 Monate).",
                "**Remarketing:** Mit Ihrer Einwilligung kann Google Ihnen auf anderen Websites Anzeigen von uns zeigen.",
                "**Erweiterte Conversions [MODUL]:** Wenn Sie in „Google Ads“ eingewilligt haben und ein Formular absenden, übermitteln wir Ihre E-Mail-Adresse und ggf. Telefonnummer **verschlüsselt als Hashwert (SHA-256)** an Google. Google gleicht diesen Wert mit angemeldeten Google-Konten ab, um die Anfrage einer Anzeige zuzuordnen, und löscht ihn danach [prüfen: Frist laut Google Ads-Datenverarbeitungsbedingungen].",
                "**Offline-Conversions [MODUL]:** Wird aus einer Anfrage ein Auftrag, melden wir Google mit der gespeicherten Klick-Kennung, dass die Anzeige erfolgreich war (ohne Namen).",
                "**Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021. Wir nutzen den Google Consent Mode: Ohne Einwilligung werden keine Google-Ads-Cookies gesetzt und keine Daten an Google übermittelt.",
                "**Rollen:** Für Conversion-Messung und erweiterte Conversions handelt Google als Auftragsverarbeiter, für Remarketing und eigene Zwecke als eigener Verantwortlicher [anwaltlich prüfen anhand Google Ads Data Processing Terms und Controller-Controller Terms].",
                "**Drittland:** wie 5.2.",
              ],
            },
          ],
        },
        {
          id: "meta",
          num: "5.4",
          module: true,
          title: "Meta Pixel und Conversions API (Facebook/Instagram, nur mit Einwilligung)",
          blocks: [
            {
              ul: [
                "**Anbieter:** Meta Platforms Ireland Limited, Merrion Road, Dublin 4, D04 X2K5, Irland; Muttergesellschaft Meta Platforms, Inc., USA.",
                "**Was:** Seitenaufrufe und Ereignisse (z. B. Anfrage gesendet, Newsletter-Anmeldung), Browser- und Geräteinformationen, IP-Adresse, Cookies `_fbp` (90 Tage), ggf. `fbclid`/`_fbc`; bei serverseitiger Übermittlung (Conversions API) zusätzlich gehashte E-Mail/Telefonnummer und eine Ereignis-ID, damit Meta doppelte Meldungen erkennt.",
                "**Zweck:** Erfolgsmessung von Anzeigen auf Facebook und Instagram, Bildung von Zielgruppen (z. B. Besucher der Küchenseiten), ähnliche Zielgruppen.",
                "**Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021. Ohne Einwilligung wird der Pixel nicht geladen und die Conversions API sendet nichts.",
                "**Gemeinsame Verantwortlichkeit:** Für die Erhebung und Übermittlung der Daten an Meta sind wir mit Meta gemeinsam verantwortlich (Art. 26 DSGVO, EuGH C-40/17 *Fashion ID*). Wir haben dazu die Vereinbarung von Meta abgeschlossen (Controller Addendum: [Link vom Unternehmen einzufügen, nach Abschluss im Business Manager]). Meta ist danach für die Erfüllung Ihrer Rechte hinsichtlich der weiteren Verarbeitung bei Meta zuständig; Sie können sich an beide wenden. Für die weitere Verarbeitung (Anzeigenauslieferung, Berichte) ist Meta allein verantwortlich.",
                "**Drittland:** Meta Platforms, Inc. ist nach dem EU-US DPF zertifiziert [prüfen auf dataprivacyframework.gov]; ergänzend SCC.",
              ],
            },
          ],
        },
        {
          id: "google-maps",
          num: "5.5",
          title: "Google Maps (nur nach Klick bzw. Einwilligung)",
          blocks: [
            {
              ul: [
                "**Anbieter:** Google Ireland Limited.",
                "**Was:** Beim Laden der Karte übermittelt Ihr Browser IP-Adresse, Gerätedaten und die aufgerufene Seite an Google; Google kann Cookies setzen (z. B. `NID`, 6 Monate) und, wenn Sie bei Google angemeldet sind, den Besuch Ihrem Konto zuordnen.",
                "**Zweck:** Anfahrt zu unserem Showroom.",
                "**Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 – erteilt über den Banner oder den Knopf „Karte laden“.",
                "**Verantwortung:** Google verarbeitet die Daten als eigener Verantwortlicher. Drittland wie 5.2.",
                "**Alternative ohne Datenübermittlung:** Adresse und Link „Route in Google Maps öffnen“ (öffnet die Seite von Google in neuem Fenster).",
              ],
            },
          ],
        },
        {
          id: "newsletter",
          num: "5.6",
          title: "Newsletter (Double-Opt-in, Anbieter Brevo)",
          blocks: [
            {
              ul: [
                "**Daten:** E-Mail-Adresse (Pflicht); freiwillig: Sprache, Interessen (z. B. Wohnen, Küche, Outdoor, Licht, Atelierverkauf, Events), „Ich bin Privatkunde/Architekt/Hotel/Bauträger“, Land. *[Nur aufnehmen, was das Formular tatsächlich abfragt. Geburtstag und PLZ nicht erheben, solange sie nicht genutzt werden (Datenminimierung).]*",
                "**Anmeldung:** Nach dem Absenden erhalten Sie eine E-Mail mit Bestätigungslink. Erst nach Klick sind Sie angemeldet (Double-Opt-in). Wir speichern Zeitpunkt der Anmeldung und Bestätigung, IP-Adresse zu beiden Zeitpunkten, Quelle (Seite) und den Wortlaut der Einwilligung, um die Einwilligung nachzuweisen.",
                "**Inhalt und Frequenz:** Neuheiten aus dem Showroom, Einladungen zu Veranstaltungen, Atelierverkauf und Angebote von Platzhirsch Home Living, etwa [1–2] Mal im Monat [vom Unternehmen festzulegen].",
                "**Erfolgsmessung:** [Entscheidung nötig] Wir messen, ob ein Newsletter geöffnet und welche Links angeklickt wurden (Zählpixel und personalisierte Links), um Inhalte zu verbessern. Diese Messung ist Teil Ihrer Einwilligung; sie endet mit der Abmeldung. *[Alternative datensparsam: Öffnungsmessung in Brevo deaktivieren, nur Klicks anonym zählen. Ob die Messung gesondert eingewilligt werden muss – anwaltlich prüfen.]*",
                "**Rechtsgrundlage:** Einwilligung, Art. 6 Abs 1 lit a DSGVO, § 174 Abs 3 TKG 2021 (für DE: § 7 Abs 2 Nr. 2 UWG). Nachweis-Protokoll: Art. 6 Abs 1 lit c i. V. m. Art. 7 Abs 1 DSGVO.",
                "**Bestandskunden [MODUL, anwaltlich prüfen]:** Wenn Sie bei uns gekauft haben, dürfen wir Ihnen ohne gesonderte Einwilligung Informationen zu ähnlichen eigenen Produkten an die beim Kauf angegebene E-Mail senden, wenn wir Sie beim Kauf und in jeder E-Mail auf Ihr Widerspruchsrecht hinweisen (§ 174 Abs 4 TKG 2021; DE: § 7 Abs 3 UWG). Rechtsgrundlage dann Art. 6 Abs 1 lit f.",
                "**Dienstleister:** Brevo (Sendinblue SAS, 106 Boulevard Haussmann, 75008 Paris, Frankreich) als Auftragsverarbeiter [prüfen: Vertragspartner für AT-Kunden ggf. Sendinblue GmbH, Berlin]; die Anmeldung wird zusätzlich in unserem Backoffice (Frappe) gespeichert. Brevo gibt an, Daten in der EU zu speichern [prüfen in der aktuellen Unterauftragsverarbeiterliste].",
                "**Abmeldung:** jederzeit über den Link in jeder E-Mail oder an datenschutz@platzhirsch.studio. Wir löschen Ihre Adresse dann aus dem Verteiler; den Nachweis der früheren Einwilligung und die Abmeldung bewahren wir [3 Jahre] auf (Abwehr von Ansprüchen, Art. 17 Abs 3 lit e) [anwaltlich prüfen]. Ihre Adresse kommt auf eine Sperrliste, damit Sie nicht erneut angeschrieben werden.",
              ],
            },
            { label: "Rechtspaket 00, W13", note: "Für heutige Altkunden steht die Bestandskunden-Ausnahme in der Regel nicht zur Verfügung, weil Formulare und Aufträge bisher keinen Widerspruchshinweis enthalten haben [anwaltlich prüfen je Kanal]." },
          ],
        },
        {
          id: "terminbuchung",
          num: "5.7",
          module: true,
          title: "Online-Terminbuchung",
          blocks: [
            {
              ul: [
                "**Anbieter:** [Cal.com, Inc., 3500 South DuPont Highway, Dover, Delaware 19901, USA – prüfen] *oder* [Alternative – vom Unternehmen zu entscheiden].",
                "**Daten:** Name, E-Mail, Telefon (optional), gewählter Termin und Termintyp (Showroom, Video, Hausbesuch, Küchenplanung), Ihre Notiz, Zeitzone; Bestätigungs- und Erinnerungsmails.",
                "**Zweck:** Vereinbarung und Durchführung des Termins. Die Buchung wird automatisch als Anfrage in unser Backoffice übernommen (siehe 5.1).",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO. Das Laden des Buchungskalenders setzt Daten des Anbieters ein; wir laden ihn daher erst nach Ihrem Klick bzw. Ihrer Einwilligung (§ 165 Abs 3 TKG 2021).",
                "**Speicherdauer:** beim Anbieter [6] Monate nach dem Termin [vom Unternehmen festzulegen, Löschung im Konto einrichten]; im Backoffice wie 5.1.",
                "**Drittland:** [USA: DPF-Zertifizierung prüfen; sonst SCC] – *Achtung: Laut Drittquellen wird die EU-Instanz cal.eu zum 01.11.2026 eingestellt; vor Vertragsschluss schriftlich bestätigen lassen.*",
                "Erinnerungen per E-Mail/SMS sind **reine Terminhinweise**, keine Werbung.",
              ],
            },
            { label: "Rechtspaket 00, W9", note: "Nicht mit der EU-Region von Cal.com planen, bis Cal.com schriftlich etwas anderes bestätigt [prüfen]. Der Abschnitt bleibt anbieterneutral, bis entschieden ist." },
          ],
        },
        {
          id: "video",
          num: "5.8",
          module: true,
          title: "Video-Beratung",
          blocks: [
            {
              ul: [
                "**Dienst:** [Microsoft Teams / Google Meet / Cal Video (Daily.co, USA) / Whereby (Norwegen) – vom Unternehmen zu entscheiden].",
                "**Daten:** Name, E-Mail, Bild und Ton während des Gesprächs, gezeigte Räume, Chat, technische Verbindungsdaten (IP, Gerät).",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO.",
                "**Keine Aufzeichnung.** Wir zeichnen Gespräche nicht auf. Screenshots von Räumen machen wir nur, wenn Sie das im Gespräch ausdrücklich erlauben, und behandeln sie wie Raumfotos (5.11).",
                "**Tipp:** Sie können die Kamera ausschalten oder einen Hintergrund verwenden; zeigen Sie keine Dokumente oder Personen, die nicht teilnehmen.",
                "**Drittland/Auftragsverarbeitung:** [je nach Dienst ergänzen].",
              ],
            },
          ],
        },
        {
          id: "whatsapp",
          num: "5.9",
          module: true,
          title: "WhatsApp",
          blocks: [
            {
              ul: [
                "Wenn Sie uns über den WhatsApp-Link schreiben, nutzen Sie den Dienst von **WhatsApp Ireland Limited**, Merrion Road, Dublin 4, Irland (Teil von Meta). WhatsApp verarbeitet Ihre Nummer, Ihr Profil und Metadaten als eigener Verantwortlicher nach seinen Bedingungen; Inhalte sind Ende-zu-Ende-verschlüsselt [gilt nicht für die WhatsApp Business Platform/Cloud API – dort ergänzen, dass Meta als Auftragsverarbeiter Nachrichten verarbeitet; anwaltlich prüfen].",
                "**Wir** verarbeiten Ihre Nummer und Ihre Nachrichten, um Ihre Anfrage zu beantworten (Art. 6 Abs 1 lit b). Wir nutzen WhatsApp auf einem eigenen Geschäftsgerät **ohne Abgleich des Adressbuchs** mit anderen Kundendaten. Relevante Inhalte übernehmen wir in unser Backoffice (5.1); den Chat löschen wir nach [12 Monaten] [vom Unternehmen festzulegen].",
                "Werbung per WhatsApp senden wir nur mit Ihrer ausdrücklichen Einwilligung.",
                "Der Link selbst überträgt beim Anzeigen der Seite keine Daten an WhatsApp. Klicken Sie ihn an, wird (mit Ihrer Statistik-Einwilligung) nur das Ereignis „WhatsApp-Klick“ an Google Analytics gemeldet (5.2).",
                "Wenn Sie WhatsApp nicht nutzen möchten: Telefon, E-Mail oder Formular.",
              ],
            },
          ],
        },
        {
          id: "ki-concierge",
          num: "5.10",
          module: true,
          title: "KI-Concierge (Chat-Assistent)",
          blocks: [
            {
              ul: [
                "**Hinweis:** Sie sprechen mit einem **KI-System**, nicht mit einem Menschen (Art. 50 Abs 1 KI-Verordnung (EU) 2024/1689). Antworten können Fehler enthalten. Verbindlich sind nur Angebote unserer Beraterinnen und Berater.",
                "**Anbieter des Sprachmodells:** Anthropic [PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA, bzw. Anthropic Ireland, Limited – Vertragspartner laut Commercial Terms prüfen] über die Claude API, *oder* [Amazon Web Services EMEA SARL, Luxemburg, über Amazon Bedrock in der Region Frankfurt (eu-central-1) – Entscheidung nötig, siehe Arbeitspapier 3.3].",
                "**Daten:** Ihre Eingaben, die Antworten, Zeitpunkt, Sprache und die Seite, auf der Sie den Chat geöffnet haben. Wir verlangen keinen Namen. Wenn Sie im Chat um Rückruf oder Angebot bitten, fragen wir nach Name und Kontaktdaten und übergeben das Gespräch als Anfrage an unser Backoffice (5.1).",
                "**Zweck:** Beantwortung Ihrer Fragen zu Sortiment, Marken, Lieferung, Schweiz-Service und Terminen; Weitergabe an einen Menschen auf Ihren Wunsch.",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (Ihre Anfrage), für die Auswertung zur Qualitätsverbesserung Art. 6 Abs 1 lit f (berechtigtes Interesse an richtigen Antworten), für die Übergabe an das Backoffice Ihre Bitte darum.",
                "**Cookies:** Der Chat wird von unserem eigenen Server ausgeliefert und setzt keine Cookies [technisch sicherstellen; sonst Consent-Eintrag].",
                "**Kein Training:** Der Anbieter verwendet Ihre Eingaben nach unserem Vertrag nicht zum Training seiner Modelle. Speicherung beim Anbieter: [laut Anbieter-Dokumentation keine bzw. bis 30 Tage, u. a. zur Missbrauchserkennung – im Vertrag prüfen und konkrete Zahl eintragen].",
                "**Speicherdauer bei uns:** Chatprotokolle [30 Tage], danach automatische Löschung; übergebene Anfragen wie 5.1.",
                "**Bitte keine sensiblen Daten** (Gesundheit, Ausweis- oder Kontonummern) in den Chat eingeben.",
                "**Drittland:** [Claude API: Übermittlung in die USA; Grundlage Standardvertragsklauseln im Data Processing Addendum von Anthropic; DPF-Zertifizierung nicht verifiziert – prüfen] / [Bedrock EU: Verarbeitung in der EU; Zugriff aus den USA im Supportfall möglich, AWS ist DPF-zertifiziert – prüfen].",
                "**Widerspruch:** gegen die Auswertung zur Qualitätsverbesserung jederzeit (Abschnitt 6).",
              ],
            },
            {
              label: "Stand der Umsetzung (Labs) – weicht vom Entwurf ab",
              note: [
                `Der Labs-Prototyp (concierge.md, „Rechtliches“) fragt vor der ersten Übermittlung eine **Einwilligung** ab (Art. 6 Abs 1 lit a, signiertes Token mit Version), nennt als Empfänger **Anthropic PBC, USA**, als Auftragsverarbeiter, mit Drittlandübermittlung auf Grundlage des EU-US Data Privacy Framework bzw. von Standardvertragsklauseln. Ein Verlauf wird nur mit eigener Checkbox gespeichert, **ohne IP-Adresse**, und nach **${CONCIERGE_RETENTION_DAYS} Tagen** gelöscht (src/lib/concierge/config.js). „Einwilligung widerrufen“ im Chat löscht den gespeicherten Verlauf der Sitzung sofort.`,
                "Der Entwurf oben nennt dagegen lit b/lit f, Chatprotokolle 30 Tage (auch Rechtspaket 00, Abschn. 4.6) und empfiehlt für die Produktion Amazon Bedrock mit EU-Inferenzprofil (00, W12). [anwaltlich prüfen: Rechtsgrundlage, Löschfrist und Anbieter vereinheitlichen, bevor der Concierge außerhalb von Labs läuft; AVV/DPA mit dem Anbieter inkl. Zero-Data-Retention prüfen]",
              ],
            },
          ],
        },
        {
          id: "raumplaner",
          num: "5.11",
          module: true,
          title: "KI-Raumplaner „Ihr Raum in 48 Stunden“ (Fotos Ihrer Räume)",
          blocks: [
            {
              ul: [
                "**Daten:** die Fotos, die Sie hochladen, Ihre Angaben zum Raum (Maße, Stil, Budgetrahmen), Name und E-Mail für die Zusendung. Fotos können zeigen, wie und wo Sie wohnen.",
                "**Bevor Sie hochladen:** Bitte fotografieren Sie **keine Personen**, Familienfotos, Dokumente oder Bildschirme und nach Möglichkeit keinen Blick aus dem Fenster, der Ihre Adresse verrät.",
                "**Was wir tun:** Beim Hochladen entfernen wir automatisch Metadaten (EXIF, auch GPS-Standort). Die Fotos speichern wir verschlüsselt bei [Anbieter Objektspeicher, z. B. Hetzner Online GmbH, Gunzenhausen, Rechenzentrum Falkenstein/Nürnberg, oder Exoscale/A1 Digital, Wien – vom Unternehmen auszufüllen] in der EU. Unser Team erstellt die Visualisierung auf **eigenen Rechnern in Lochau** mit KI-Werkzeugen und prüft jedes Bild von Hand. In dieser Stufe verlassen Ihre Fotos die EU nicht und gehen an keinen KI-Cloud-Anbieter. *[MODUL Stufe 3 – Cloud-Generierung: Anbieter, Sitz, Drittland, Garantien, Speicherfrist beim Anbieter und „kein Training“ ergänzen; DSFA vor Start.]*",
                "**Kennzeichnung:** Jede Visualisierung ist als KI-erzeugt gekennzeichnet, sichtbar und maschinenlesbar (Art. 50 Abs 2 und 4 KI-Verordnung). Sie ist nicht maßstabsgetreu; Farben und Maße sind unverbindlich.",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (die von Ihnen bestellte Visualisierung). Sollten auf Ihren Fotos Dritte erkennbar sein, verarbeiten wir diese Bildteile nur, soweit unvermeidbar (Art. 6 Abs 1 lit f) und machen sie auf Wunsch unkenntlich.",
                "**Training nur mit gesonderter Einwilligung:** Wir verwenden Ihre Fotos **nicht** zum Training oder zur Verbesserung von KI-Modellen und nicht als Referenz auf unserer Website, außer Sie kreuzen das gesondert an (Art. 6 Abs 1 lit a; standardmäßig nicht angekreuzt, jederzeit widerrufbar).",
                "**Speicherdauer:** Fotos und Ergebnisse löschen wir automatisch 30 Tage nach Zusendung des Ergebnisses [Frist laut Rechtspaket 00, W10; der Entwurf 02 nannte „30 oder 90 Tage“ – vom Unternehmen zu bestätigen], außer daraus wird ein Auftrag (dann Teil der Projektakte, 5.12).",
              ],
            },
            { label: "Rechtspaket 00, W10", note: "Der Team-Rechner in Lochau braucht beschriebene technisch-organisatorische Maßnahmen (Verschlüsselung, Zugriff, automatische Löschung) [anwaltlich prüfen im Rahmen der DSFA]." },
          ],
        },
        {
          id: "bestellungen",
          num: "5.12",
          module: true,
          title: "Bestellungen, Gutscheine, Outlet, Anzahlungen und Zahlung",
          blocks: [
            {
              ul: [
                "**Daten:** Name, Rechnungs- und Lieferadresse, E-Mail, Telefon, Bestellinhalt, Preis, Zahlungsart und -status, bei Gutscheinen ggf. Name und E-Mail des Beschenkten und Ihr Grußtext; Gutscheincode und Restwert.",
                "**Zweck und Rechtsgrundlage:** Vertragsabwicklung (Art. 6 Abs 1 lit b), Buchhaltung und Steuer (Art. 6 Abs 1 lit c, § 132 BAO, § 212 UGB), Betrugsabwehr (lit f).",
                "**Zahlungsdienstleister:** Die Zahlung läuft über die Bezahlseite des Anbieters; Kartendaten erreichen unseren Server nicht.",
              ],
            },
            {
              ul: [
                "**Stripe Payments Europe, Limited**, 1 Grand Canal Street Lower, Dublin 2, Irland – für Kartenzahlung, Apple Pay/Google Pay, EPS, TWINT [prüfen Verfügbarkeit] und Rechnungen. Stripe verarbeitet Zahlungsdaten zum Teil als eigener Verantwortlicher (Geldwäsche- und Betrugsprävention). Übermittlung an Stripe, Inc. (USA): DPF/SCC [prüfen].",
                "**PayPal (Europe) S.à r.l. et Cie, S.C.A.**, 22–24 Boulevard Royal, L-2449 Luxemburg – eigener Verantwortlicher.",
                "**TWINT** [TWINT AG, Stauffacherstrasse 31, 3014 Bern, Schweiz – Schweiz mit Angemessenheitsbeschluss der EU] – wenn über Stripe abgewickelt, bei Stripe nennen.",
                "*[Klarna, falls Finanzierung angeboten wird: eigener Abschnitt inkl. Bonitätsprüfung durch Klarna – anwaltlich prüfen.]*",
              ],
            },
            {
              ul: [
                "**Gutschein an Dritte:** Wenn Sie einen Gutschein an eine andere Person senden lassen, verwenden wir deren Name und E-Mail nur zur Zustellung und Einlösung. Bitte informieren Sie die Person darüber (Art. 14 DSGVO).",
                "**Speicherdauer:** Rechnungen und Buchungsbelege 7 Jahre (§ 132 BAO, § 212 UGB), bei Liegenschafts-/Bauleistungen ggf. länger [Steuerberatung]. Gutscheindaten, solange der Gutschein eingelöst werden kann (in Österreich bis zu 30 Jahre, § 1478 ABGB [anwaltlich prüfen anhand der Gutscheinbedingungen]) und danach die Belegfrist. Kundenkonto- und Auftragsdaten bis zum Ende von Gewährleistung und Verjährung [3] Jahre nach Lieferung.",
                "**Bonitätsprüfung:** findet nicht statt [vom Unternehmen zu bestätigen; bei Vorkasse/Anzahlung entbehrlich].",
              ],
            },
          ],
        },
        {
          id: "lieferung",
          num: "5.13",
          module: true,
          title: "Lieferung und Montage, auch in die Schweiz und nach Liechtenstein",
          blocks: [
            "Für Lieferung und Montage geben wir Name, Lieferadresse, Telefon und Liefertermin an Spediteure und Montagepartner weiter [Liste vom Unternehmen auszufüllen]. Bei Lieferungen in die Schweiz/nach Liechtenstein übermitteln wir die für Ausfuhr, Einfuhr und Mehrwertsteuer nötigen Daten an den Spediteur, unseren Schweizer Steuervertreter [Name] und die Zollbehörden (österreichisches Zollamt, Bundesamt für Zoll und Grenzsicherheit BAZG). Rechtsgrundlage: Art. 6 Abs 1 lit b und c DSGVO. Die Schweiz hat einen Angemessenheitsbeschluss der EU-Kommission. Spediteure und Steuervertreter sind je nach Vertrag eigene Verantwortliche oder Auftragsverarbeiter.",
          ],
        },
        {
          id: "bewertungen",
          num: "5.14",
          module: true,
          title: "Bewertungen",
          blocks: [
            {
              ul: [
                "**Anzeige:** Wir zeigen auf unserer Website die Sterne-Bewertung und Anzahl unserer Google-Bewertungen als Text mit Link zu Google. Dabei wird keine Verbindung zu Google aufgebaut. **Hinweis nach § 2 Abs 6 UWG/ § 5b Abs 3 UWG (DE):** Google prüft nach unserer Kenntnis nicht, ob Bewertende bei uns gekauft haben; wir zeigen alle Bewertungen ungefiltert [Text mit Bericht 14/F11 und Rechtsanwalt abstimmen].",
                "**Bitte um Bewertung:** Wir bitten Sie per QR-Karte bei der Lieferung um eine Bewertung. Per E-Mail nur, wenn Sie eingewilligt haben oder als Bestandskunde nicht widersprochen haben (§ 174 TKG 2021; BGH VI ZR 225/17).",
                "**Kundenstimmen/Referenzen auf der Website:** nur mit Ihrer schriftlichen Einwilligung, in der vereinbarten Form (z. B. „Familie M., Lindau“), widerrufbar.",
                "**Antworten auf Bewertungen:** Wir antworten öffentlich auf Google, ohne Details aus Ihrem Auftrag zu nennen (Art. 6 Abs 1 lit f).",
              ],
            },
          ],
        },
        {
          id: "veranstaltungen",
          num: "5.15",
          module: true,
          title: "Veranstaltungen (Vernissagen, Adventsabend, Kochabende)",
          blocks: [
            {
              ul: [
                "**Anmeldung:** Name, E-Mail, Anzahl der Begleitpersonen, ggf. Telefon. Rechtsgrundlage Art. 6 Abs 1 lit b. Löschung [3] Monate nach der Veranstaltung, außer Sie abonnieren den Newsletter (gesonderte Checkbox, nicht vorausgewählt).",
                "**Unverträglichkeiten/Allergien** (Café, Kochabend): Das sind Gesundheitsdaten (Art. 9 DSGVO). Wir fragen sie nur als **freiwillige** Angabe mit ausdrücklicher Einwilligung (Art. 9 Abs 2 lit a) ab, nutzen sie nur für die Verpflegung und löschen sie unmittelbar nach der Veranstaltung. *[Datensparsame Alternative: „Bitte sprechen Sie unser Café-Team vor Ort an“.]*",
                "**Fotos und Videos:** Auf Veranstaltungen fotografieren wir für Berichte auf Website, Newsletter und Social Media. Rechtsgrundlage: Art. 6 Abs 1 lit f (Berichterstattung über unsere Veranstaltung). Wir weisen in der Einladung und am Eingang darauf hin; wer nicht fotografiert werden möchte, erhält [einen Anstecker] und wird nicht gezeigt. Porträts und Bilder, auf denen einzelne Personen im Mittelpunkt stehen, veröffentlichen wir nur mit Einwilligung. Kinder fotografieren wir nicht ohne Einwilligung der Eltern. *[§ 78 UrhG (Bildnisschutz AT) und KUG (DE) – anwaltlich prüfen.]*",
              ],
            },
          ],
        },
        {
          id: "social-media",
          num: "5.16",
          title: "Unsere Auftritte in sozialen Netzwerken",
          blocks: [
            "Wir betreiben Seiten auf Instagram und Facebook [weitere: Pinterest, LinkedIn – vom Unternehmen auszufüllen]. Für die Seiten-Statistiken („Insights“) sind wir mit Meta gemeinsam verantwortlich (EuGH C-210/16 *Wirtschaftsakademie*; Page Insights Controller Addendum von Meta). Wenn Sie uns dort Nachrichten schreiben, verarbeiten wir diese zur Beantwortung (Art. 6 Abs 1 lit b bzw. f). Für alles Weitere gilt die Datenschutzerklärung des jeweiligen Netzwerks.",
          ],
        },
        {
          id: "bewerbungen",
          num: "5.17",
          title: "Bewerbungen",
          // Runde 4 (r4-recht-inhalt P1-3): the career page takes applications by
          // e-mail to info@ (karriereposition.js) – the section is live
          // (src/components/Datenschutz/datenschutz.js #bewerbungen). Still ONE
          // open point (count in tests/unit/r3-recht.test.mjs unchanged).
          blocks: [
            {
              ul: [
                "**Daten:** die Angaben und Unterlagen Ihrer Bewerbung per E-Mail an " + EMAIL + " (Name, Kontaktdaten, Anschreiben, Lebenslauf, Zeugnisse).",
                "**Zweck und Rechtsgrundlage:** Prüfung der Bewerbung und Anbahnung eines Arbeitsverhältnisses (Art. 6 Abs 1 lit b DSGVO).",
                "**Empfänger:** nur die mit der Stellenbesetzung befassten Personen im Unternehmen.",
                "**Speicherdauer:** ohne Einstellung 7 Monate nach Abschluss des Verfahrens (Frist für Ansprüche nach dem GlBG plus Zustellpuffer), länger (Evidenz) nur mit Einwilligung (Art. 6 Abs 1 lit a). [Frist ist ein Vorschlag – vom Unternehmen zu bestätigen, GlBG-Frist anwaltlich prüfen]",
              ],
            },
          ],
        },
        {
          id: "kundenportal",
          num: "5.18",
          module: true,
          added: "kundenportal.md (Abschn. 1–4, „Rechtliches“), Werte aus src/lib/portal/privacy.js",
          title: "Kundenportal „Mein Platzhirsch“",
          blocks: [
            {
              ul: [
                "**Zweck:** Über das Kundenportal stellen wir Ihnen die Unterlagen zu Ihrem Auftrag bereit (Projekte, Planungen, Angebote, Auftragsbestätigungen, Lieferscheine, Rechnungen, Termine, Produktpässe, Gewerke) und nehmen Ihre Rückmeldungen und Anfragen entgegen (Nachrichten, Termin-, Service- und Planungsanfragen, Kommentare, Markierungen, Bewertungen und Freigaben von Planungen, Sprachnachrichten).",
                `**Anmeldung per E-Mail-Link:** Sie melden sich ohne Passwort an. Wir senden einen Anmeldelink an die E-Mail-Adresse, die Sie bei uns hinterlegt haben. Der Link ist ${MAGIC_LINK_MINUTES} Minuten gültig und funktioniert nur einmal. Gespeichert werden dafür nur ein Prüfwert des Links (kein Klartext), Ihre Kundennummer und der Ablaufzeitpunkt. Ist eine Adresse nicht bei uns hinterlegt, wird kein Link erzeugt.`,
                `**Cookie:** Nach der Anmeldung setzen wir das Cookie \`ph_portal_session\`. Es enthält eine signierte Sitzungskennung und Ihre Kundennummer, ist für Skripte nicht lesbar (HttpOnly), wird nur über HTTPS übertragen und läuft nach ${SESSION_DAYS} Tagen ab oder wenn Sie sich abmelden. Es ist technisch notwendig; dafür ist keine Einwilligung erforderlich (§ 165 Abs 3 TKG 2021, § 25 Abs 2 TDDDG). Im Portal setzen wir keine Analyse- oder Marketing-Cookies.`,
                "**Rechtsgrundlagen:** Vertrag und vorvertragliche Maßnahmen (Art. 6 Abs 1 lit b DSGVO) für Anmeldung, Anzeige Ihrer Projektdaten, Rückmeldungen, Nachrichten und Anfragen; Einwilligung (Art. 6 Abs 1 lit a) für Sprachnachrichten, jederzeit mit Wirkung für die Zukunft widerrufbar; berechtigtes Interesse (Art. 6 Abs 1 lit f) für den Schutz vor Missbrauch, z. B. eine kurzzeitige Begrenzung der Anmeldeversuche pro IP-Adresse und E-Mail-Adresse (nur im Arbeitsspeicher des Servers, nicht dauerhaft gespeichert).",
                `**Empfänger:** ${RECIPIENTS.join("; ")}. [Hosting-Anbieter und E-Mail-Versanddienstleister – vom Unternehmen auszufüllen]`,
                `**Speicherdauer:** Portalkonto und Projektdaten ${ACCOUNT_RETENTION}. Kommentare, Markierungen, Bewertungen, Freigaben und Nachrichten ${FEEDBACK_RETENTION}. Sprachnachrichten: Löschung ${VOICE_RETENTION}, früher auf Ihren Wunsch oder bei Widerruf der Einwilligung. Rechnungen: 7 Jahre (§ 132 BAO).${ownerNote}`,
                "**Visualisierungen mit KI:** Einzelne Planungsbilder erstellen oder bearbeiten wir mit KI. Sie sind im Portal als „KI-generiert“ gekennzeichnet (Art. 50 KI-Verordnung) und nicht maßstäblich.",
                "**Ihre Rechte:** wie Abschnitt 6. Die Daten Ihrer Produktpässe können Sie im Portal maschinenlesbar herunterladen (JSON).",
              ],
            },
            {
              label: "Hinweis zur Vorschau",
              note: "Das Portal hat schon eine eigene Seite /de/portal/datenschutz mit denselben Werten (kundenportal.md, P1-4). Der Text hier folgt ihr. [anwaltlich prüfen: Portal-Seite und allgemeine Erklärung zusammenführen oder hier nur kurz fassen und verlinken; die Portal-Seite nennt als Datenschutzkontakt info@ statt datenschutz@ (Entwurf D13)]",
            },
          ],
        },
        {
          id: "upload",
          num: "5.19",
          module: true,
          added: "handy-upload.md („Rechtliches“), Werte aus src/lib/upload/config.js",
          title: "Upload von Fotos, Videos und Plänen nach einer Anfrage",
          blocks: [
            {
              ul: [
                `**Was:** Nach einer Kontakt-, Beratungs- oder Produktanfrage erhalten Sie einen persönlichen Link (auch als QR-Code), über den Sie Fotos, Videos und Pläne Ihres Raums vom Handy hochladen und eine Notiz ergänzen können. Der Link nimmt ${UPLOAD_CONFIG.tokenTtlDays} Tage lang Dateien an. Der Upload ist freiwillig; Ihre Anfrage gilt auch ohne.`,
                "**Daten:** die hochgeladenen Dateien, Ihre Notiz, die Zuordnung zu Ihrer Anfrage, Zeitpunkt und Version Ihrer Einwilligung, ggf. Ihre E-Mail-Adresse als Hinweis zur Anfrage.",
                "**Metadaten:** Bei JPEG-Fotos entfernen wir beim Hochladen die GPS-Standortdaten. [HEIC-, PNG- und WebP-Dateien werden laut Code (src/lib/upload/exif.js) nicht bereinigt – vom Unternehmen technisch zu lösen oder hier zu nennen; anwaltlich prüfen]",
                "**Rechtsgrundlage:** Einwilligung (Art. 6 Abs 1 lit a DSGVO), die Sie vor dem ersten Upload per Checkbox erteilen. Sie können sie jederzeit per E-Mail an " + EMAIL + " widerrufen.",
                "**Speicherort und Empfänger:** Die Dateien liegen auf unserem Server [Hoster, Speicherort – vom Unternehmen auszufüllen], sind nicht öffentlich abrufbar und werden nur zur Bearbeitung Ihrer Anfrage verwendet. Wird ein Auftrag daraus, übernehmen wir sie in die Projektakte im Backoffice (5.1).",
                `**Speicherdauer:** ${uploadDays} nach Ablauf des Links, außer die Unterlagen werden für einen Auftrag benötigt.`,
                "**Bitte beachten:** Nehmen Sie keine Personen ohne deren Einverständnis auf. Eine KI-Auswertung der Uploads findet nicht statt.",
              ],
            },
            { label: "Hinweis zur Vorschau", note: "Die Einwilligung im Upload ist heute als Kurzsatz mit aufklappbarem Volltext umgesetzt (src/components/Upload/ConsentText.js, Version " + UPLOAD_CONSENT_VERSION + "). [anwaltlich prüfen: Einwilligung oder Art. 6 Abs 1 lit b wie beim Raumplaner (5.11)]" },
          ],
        },
        {
          id: "online-planer",
          num: "5.20",
          module: true,
          added: "kuechenplaner.md (P2-2, Entwurf 5.x), sofaplaner.md („Rechtliches“)",
          title: "Online-Planer (Küchenplaner, Sofa-Modulplaner)",
          blocks: [
            {
              ul: [
                "**Daten:** Ihre Planung (Raummaße, Module, Materialien), bei der Küche auf Wunsch ein Bild der 3D-Ansicht, beim Sofa ein frei wählbarer Planname. Bei einer Anfrage zusätzlich Name, E-Mail, Telefon und Ihre Nachricht. Zur Missbrauchsabwehr verarbeiten wir Ihre IP-Adresse kurzzeitig, und zwar nur als verkürzten Hashwert für höchstens 10 Minuten.",
                "**Zweck:** die Planung berechnen und anzeigen, einen Teilen-Link erzeugen und Ihre Anfrage bearbeiten.",
                "**Rechtsgrundlage:** Art. 6 Abs 1 lit b DSGVO (Anfrage, vorvertragliche Maßnahme). Für die Missbrauchsabwehr Art. 6 Abs 1 lit f (berechtigtes Interesse an einem stabilen Betrieb).",
                "**Speicherort und Empfänger:** Die Planung wird im Browser berechnet. Gespeicherte Planungen und Teilen-Links liegen auf unserem Server [Hoster – vom Unternehmen auszufüllen]. Kontaktdaten gehen wie in 5.1 an das Backoffice (Frappe/ERPNext). Die Drosselzähler liegen bei [Redis-Anbieter, Region – vom Unternehmen auszufüllen, Auftragsverarbeitung].",
                "**Speicherdauer:** Gespeicherte Planungen, Bilder und Teilen-Links löschen wir nach 180 Tagen automatisch. Für die Anfrage selbst gilt die Frist aus 5.1.",
                "**Teilen-Links:** Wer den Link kennt, kann die Planung sehen. Bitte tragen Sie keine persönlichen Daten als Plannamen ein.",
                "**Im Browser:** Der Sofa-Modulplaner speichert Ihren Entwurf und Ihre Merkliste im Local Storage Ihres Browsers. Das ist eine von Ihnen ausgelöste Funktion (§ 165 Abs 3 TKG 2021).",
              ],
            },
            {
              label: "Hinweis zur Vorschau",
              note: "Der Küchenplaner verlangt zum Absenden eine Checkbox, die als Einwilligung formuliert ist und auch die Speicherung von Konfiguration und Bild abdeckt (kuechenplaner.md); der Textentwurf nennt dagegen Art. 6 Abs 1 lit b. Live-Senden erst mit `NEXT_PUBLIC_LABS_PLANER_SENDEN=1`, nachdem dieser Abschnitt online ist. [anwaltlich prüfen: Rechtsgrundlage und Checkbox-Text abstimmen]",
            },
          ],
        },
      ],
    },
    {
      id: "rechte",
      num: "6",
      title: "Ihre Rechte",
      source: "02, Abschn. 2.6",
      blocks: [
        "Sie haben das Recht auf **Auskunft** (Art. 15), **Berichtigung** (Art. 16), **Löschung** (Art. 17), **Einschränkung** (Art. 18), **Datenübertragbarkeit** (Art. 20) und **Widerruf** erteilter Einwilligungen (Art. 7 Abs 3). Sie können der Verarbeitung auf Grundlage berechtigter Interessen aus Gründen Ihrer besonderen Situation **widersprechen** (Art. 21 Abs 1) und der Verarbeitung für Direktwerbung **jederzeit ohne Begründung** (Art. 21 Abs 2).",
        "Schreiben Sie an datenschutz@platzhirsch.studio oder an die Postadresse oben. Wir antworten innerhalb eines Monats (Art. 12 Abs 3) und prüfen ggf. Ihre Identität.",
        "**Beschwerde bei einer Aufsichtsbehörde** (Art. 77 DSGVO), insbesondere in Ihrem Wohnsitzland:",
        {
          ul: [
            "**Österreich:** Österreichische Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, dsb@dsb.gv.at, www.dsb.gv.at",
            "**Deutschland:** die Aufsichtsbehörde Ihres Bundeslandes, z. B. Bayerisches Landesamt für Datenschutzaufsicht (Ansbach) oder Landesbeauftragter für Datenschutz Baden-Württemberg (Stuttgart)",
            "**Liechtenstein:** Datenschutzstelle Liechtenstein, Städtle 38, 9490 Vaduz [prüfen]",
            "**Schweiz:** Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB), Feldeggweg 1, 3003 Bern [prüfen]",
          ],
        },
      ],
    },
    {
      id: "schweiz",
      num: "7",
      title: "Hinweise für Personen in der Schweiz",
      source: "02, Abschn. 2.7",
      blocks: [
        {
          ul: [
            "Wir bearbeiten Ihre Personendaten nach der DSGVO und, soweit anwendbar, nach dem Bundesgesetz über den Datenschutz (DSG, SR 235.1).",
            "**Länder, in die Daten bekanntgegeben werden** (Art. 19 Abs 4 DSG): EU/EWR (insbesondere Österreich, Irland, Frankreich, Deutschland, Luxemburg) und die USA [ergänzen je nach aktiven Diensten: Google, Meta, Cal.com, Anthropic/AWS, Stripe]. Für die EU/den EWR besteht nach Anhang 1 der Datenschutzverordnung (DSV) ein angemessenes Schutzniveau; für die USA nur bei Empfängern, die nach dem Swiss-US Data Privacy Framework zertifiziert sind (seit 15.09.2024); im Übrigen stützen wir uns auf die vom EDÖB anerkannten Standardvertragsklauseln der EU-Kommission mit Schweizer Anpassungen (Art. 16 Abs 2 lit d DSG) oder Ihre Einwilligung (Art. 17 Abs 1 lit a DSG).",
            "Ihre Rechte nach Art. 25–29 und 32 DSG (Auskunft, Datenherausgabe, Berichtigung, Löschung, Widerspruch) können Sie bei uns geltend machen; Beschwerde/Anzeige beim EDÖB.",
          ],
        },
      ],
    },
    {
      id: "sicherheit",
      num: "8",
      title: "Datensicherheit",
      source: "02, Abschn. 2.8",
      blocks: [
        "Wir übertragen Daten verschlüsselt (TLS). Zugriff im Backoffice haben nur berechtigte Mitarbeitende mit eigenem Konto [Zwei-Faktor-Anmeldung – vom Unternehmen zu bestätigen]. Formulardaten gehen nicht direkt aus Ihrem Browser an Dritte, sondern über unseren Server.",
      ],
    },
    {
      id: "aenderungen",
      num: "9",
      title: "Änderungen",
      source: "02, Abschn. 2.9",
      blocks: [
        "Wir passen diese Erklärung an, wenn wir neue Dienste einsetzen oder sich die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung. Bei neuen einwilligungspflichtigen Diensten fragen wir Sie erneut.",
      ],
    },
    {
      id: "dienste",
      num: "A",
      title: "Anhang: Eingesetzte Dienste",
      added: "dem Dienste-Register src/lib/legal/services.js (R4-recht-consent)",
      serviceKeys: SERVICE_ROWS.map((r) => r.key),
      blocks: serviceBlocks,
    },
  ],
};

// Overview table: every service links to its section, shown with its number.
const sectionNums = new Map(DATENSCHUTZ.sections.flatMap((s) => [[s.id, s.num], ...(s.sub || []).map((x) => [x.id, x.num])]));
serviceBlocks[1].table.rows = SERVICE_ROWS.map((r) => [
  r.name,
  r.status,
  r.banner,
  r.dseSection && sectionNums.has(r.dseSection) ? `[${sectionNums.get(r.dseSection)}](#${r.dseSection})` : "–",
]);

export default DATENSCHUTZ;
