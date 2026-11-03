// src/lib/legal/services.js — Dienste-Register (R4-recht-consent, AP2 Nr. 3).
//
// The ONE source for
//   - the consent banner: `cookieServices` (Cookies/cookiecomponent.js) is
//     built from the entries with `banner`, in this order;
//   - the section "Eingesetzte Dienste" of the privacy-policy preview
//     (LegalDrafts/docs/datenschutz.js, /de/preview/recht/datenschutz);
//   - the service list in the law-firm folder (tools/legal/services-md.mjs →
//     Marktresearch/recht/anwalt-vorschau.md).
// tests/unit/r4-recht.test.mjs checks that banner and preview carry the same
// keys and that the values quoted from feature code match that code.
//
// Code inventory 26.10.2026 (grep over src/ for external hosts, iframes,
// script injection, fetch targets, next/font, env-configured providers):
//   active   Google tag (gtag.js) for GA4 / Ads, Google Maps + Street View
//            iframes (Kontakt, Ausstellung; behind ConsentEmbed), Frappe
//            backoffice (forms, product data, /cmx images, portal, upload),
//            hosting, consent cookie, self-hosted fonts (next/font)
//   labs     KI-Concierge (Anthropic API), Kundenportal (+ login mail
//            provider), Handy-Upload, Online-Planer, ECB exchange rates
//   none     YouTube/Vimeo embeds, Google Tag Manager container, Meta Pixel,
//            booking widget, social plugins (Instagram/Facebook/LinkedIn are
//            plain links), Google Fonts from Google's servers
// Plain data, no "server-only": the client banner imports it. Values that
// live in server-only feature config are quoted here and compared by the
// unit test (concierge RETENTION_DAYS, portal SESSION_DAYS, upload days).
//
// Texts are German (the drafts and the law firm are German). The visible
// banner texts stay in src/messages (namespace "Cookies"), keyed by `key`.
// Square brackets are open points, exactly like in the drafts.

import { SHOWROOM_PUBLIC } from "../showroom/config.js";
import { einblickeOn } from "../einblicke/config.js";

export const GOOGLE_TAG_IDS = {
  ga4: "G-1YCM6K57YG",
  // Google Ads conversion ID ("AW-…"). Not created yet (owner: Ads account);
  // without it an Ads-only consent loads nothing (no config, no purpose).
  ads: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "",
};

const GOOGLE = {
  name: "Google Ireland Limited",
  address: "Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland",
  phone: "+1 650 253 0000",
  email: "dpo-google@google.com",
  privacy: "https://policies.google.com/privacy",
};

// Third countries as the banner shows them today (codes are translated via
// Cookies.countries). Sub "A": adequacy decision; "B": standard contractual
// clauses. C3 (shorter list "USA und weitere Länder laut Google") is open for
// the law firm – the banner list stays as it is until then.
const ADEQUACY_COUNTRIES = ["US", "CA", "IL", "JP", "KR", "CH", "GB"];
const THIRD_COUNTRIES = ["US", "AU", "BR", "CA", "CL", "HK", "IN", "ID", "IL", "JP", "KR", "QA", "SG", "CH", "TW", "GB"];
const thirdCountries = (otherSub) =>
  THIRD_COUNTRIES.map((code) => ({ code, sub: ADEQUACY_COUNTRIES.includes(code) ? "A" : otherSub }));
const GOOGLE_DATA_PROCESSING = {
  countries: thirdCountries("B"),
  mechanisms: [
    { key: "adequacy", sub: "A" },
    { key: "scc", sub: "B" },
  ],
};
const GOOGLE_TRANSFER =
  "USA und weitere Länder laut Google; Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss (EU) 2023/1795), ergänzend Standardvertragsklauseln [anwaltlich prüfen: Länderliste kürzen, C3]";

const months = (count) => ({ count, unit: "month" });
const NO_EXPIRY = { unit: "none" };
const SELF = "Platzhirsch Home Living (eigener Server)";

/** Consent categories of the banner, in display order. */
export const BANNER_CATEGORIES = ["functional", "statistics", "marketing"];

/**
 * Status: "aktiv" = on the live site; "labs" = built, only on noindex test
 * routes or behind a switch; "nicht eingesetzt" = checked, not in the code
 * (listed so the law firm sees it was looked at).
 */
export const SERVICES = [
  {
    key: "consentCookie",
    name: "Einwilligungs-Cookie „cookieConsent“",
    status: "aktiv",
    banner: null,
    category: "essential",
    provider: SELF,
    purpose: "Speichert Ihre Auswahl im Cookie-Banner, damit wir nicht bei jedem Aufruf neu fragen (C6).",
    legalBasis: "§ 165 Abs 3 TKG 2021 (unbedingt erforderlich); Art. 6 Abs 1 lit c DSGVO (Nachweis der Einwilligung, Art. 7 Abs 1) [anwaltlich prüfen]",
    recipients: "keine",
    thirdCountry: "keine",
    retention: "12 Monate (Cookie, Erstanbieter)",
    code: ["src/components/Cookies/cookiecomponent.js", "src/components/Cookies/ConsentEmbed.js"],
    dseSection: "cookies",
  },
  {
    key: "hosting",
    name: "Hosting der Website",
    status: "aktiv",
    banner: null,
    category: "essential",
    provider: "[Hoster und Serverstandort – vom Unternehmen auszufüllen]",
    purpose: "Auslieferung der Website; Server-Protokolle (IP-Adresse, Zeit, aufgerufene Adresse, Browser) zur Sicherheit und Fehlersuche.",
    legalBasis: "Art. 6 Abs 1 lit f DSGVO (sicherer Betrieb)",
    recipients: "Hoster als Auftragsverarbeiter [AV-Vertrag – vom Unternehmen zu bestätigen]",
    thirdCountry: "[vom Unternehmen auszufüllen; Ziel: EU]",
    retention: "Server-Protokolle [14 Tage – vom Unternehmen festzulegen]",
    code: ["next.config.js", "src/proxy.js"],
    dseSection: "website",
  },
  {
    key: "fonts",
    name: "Schriften (selbst gehostet)",
    status: "aktiv",
    banner: null,
    category: "essential",
    provider: SELF,
    purpose: "Darstellung der Schriften Bodoni Moda, Instrument Sans und Montserrat. Sie werden beim Build über next/font geladen und von unserem Server ausgeliefert; Ihr Browser fragt dafür nicht bei Google an.",
    legalBasis: "keine Übermittlung an Dritte; Teil der Auslieferung (Art. 6 Abs 1 lit f DSGVO)",
    recipients: "keine",
    thirdCountry: "keine",
    retention: "keine Speicherung personenbezogener Daten",
    code: ["src/app/[locale]/layout.js"],
    dseSection: "website",
  },
  {
    key: "backoffice",
    name: "Backoffice (Frappe) auf backoffice.platzhirsch.studio",
    status: "aktiv",
    banner: null,
    category: "essential",
    provider: "Platzhirsch Home Living; Betrieb des Backoffice-Servers [Betreiber/Hoster – vom Unternehmen auszufüllen]",
    purpose: "Empfang und Bearbeitung von Kontakt-, Produkt- und Beratungsanfragen sowie Newsletter-Anmeldungen (über unseren Server, nicht direkt aus dem Browser); Produkt-, Marken- und Bilddaten der Website (Bilder über /cmx).",
    legalBasis: "Anfragen: Art. 6 Abs 1 lit b DSGVO (vorvertraglich); Newsletter: Art. 6 Abs 1 lit a DSGVO; Bildauslieferung: lit f",
    recipients: "Mitarbeitende mit eigenem Backoffice-Konto; Entwicklungsdienstleister [Sitz und AV-Vertrag – anwaltlich prüfen, siehe 5.1]",
    thirdCountry: "[vom Unternehmen auszufüllen; Fernzugriff des Dienstleisters aus einem Land ohne Angemessenheitsbeschluss – anwaltlich prüfen]",
    retention: "Anfragen: bis sie erledigt sind und solange mit Rückfragen zu rechnen ist, bei Auftrag 7 Jahre (§ 132 BAO) – freigegebener Wortlaut #anfragen; Newsletter bis zum Widerruf",
    code: ["src/app/api/kontakt/route.js", "src/app/api/anfrage_produkt/route.js", "src/app/api/beratung_anfrage/route.js", "src/app/api/newsletter_subscribe/route.js", "src/app/cmx/", "src/lib/api/"],
    dseSection: "anfragen",
  },
  {
    key: "googleMaps",
    name: "Google Maps (Karte und Street-View-Ansicht der Ausstellung)",
    status: "aktiv",
    banner: {
      category: "functional",
      title: "Google Maps",
      contactPhone: "+1 650 253 0000",
      cookies: [
        { name: "NID", type: "http", duration: months(6) },
        { name: "__Secure-3PSIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "__Secure-1PSIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "SIDCC", type: "http", duration: { count: 1, unit: "year" } },
        { name: "__Secure-3PAPISID", type: "http", duration: months(13) },
        { name: "SSID", type: "http", duration: months(13) },
        { name: "__Secure-1PAPISID", type: "http", duration: months(13) },
        { name: "__Secure-3PSID", type: "http", duration: months(13) },
        { name: "__Secure-1PSID", type: "http", duration: months(13) },
        { name: "SID", type: "http", duration: months(13) },
        { name: "SAPISID", type: "http", duration: months(13) },
        { name: "APISID", type: "http", duration: months(13) },
        { name: "CONSENT", type: "http", duration: months(13) },
        { name: "__Secure-ENID", type: "http", duration: months(13) },
        { name: "_c;;i", type: "localStorage", duration: NO_EXPIRY },
        { name: "LH;;s-*", type: "localStorage", duration: NO_EXPIRY },
        { name: "sb_wiz.zpc.gws-wiz.", type: "localStorage", duration: NO_EXPIRY },
        { name: "sb_wiz.ueh", type: "localStorage", duration: NO_EXPIRY },
      ],
      dataProcessing: { countries: thirdCountries(undefined), mechanisms: [{ key: "adequacy", sub: "A" }] },
    },
    category: "functional",
    provider: GOOGLE,
    purpose: "Eingebettete Karte (Kontaktseite) und Street-View-Ansicht der Ausstellung (Seite Das Haus). Geladen erst nach Einwilligung oder Klick auf „Karte laden“; dabei gehen IP-Adresse und Browserdaten an Google.",
    legalBasis: "Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (Einwilligung)",
    recipients: "Google Ireland Limited, Google LLC",
    thirdCountry: GOOGLE_TRANSFER,
    retention: "Cookies laut Liste im Banner (bis 13 Monate); Daten bei Google laut Google-Datenschutzerklärung",
    code: ["src/components/Cookies/ConsentEmbed.js", "src/components/Kontakt/kontakt.js", "src/components/UberUns/austellung.js"],
    dseSection: "google-maps",
  },
  {
    key: "googleTagManager",
    name: "Google-Tag-Bibliothek (gtag.js von googletagmanager.com)",
    status: "aktiv",
    banner: {
      category: "functional",
      title: "Google Tag Manager",
      contactPhone: "+1 650 253 0000",
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
    // Real category = the consent that loads it (QA r4 P2-2), not the
    // banner group it is listed in.
    category: "loader",
    bannerNote: "Schalter ohne Wirkung, lädt nur mit Statistik oder Marketing; C4",
    provider: GOOGLE,
    purpose: "Die Bibliothek gtag.js wird von www.googletagmanager.com geladen, und zwar nur zusammen mit einer Konfiguration: mit Ihrer Einwilligung in Statistik (GA4) oder in Marketing, sobald eine Ads-Kennung hinterlegt ist. Einen Google-Tag-Manager-Container setzen wir nicht ein. Der eigene Schalter „Google Tag Manager“ unter „Funktional“ im Banner steuert nichts [anwaltlich prüfen: Schalter nach C4 entfernen; der Schlüssel bleibt bis dahin im Cookie].",
    legalBasis: "Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (über die Einwilligung in Statistik oder Marketing)",
    recipients: "Google Ireland Limited, Google LLC",
    thirdCountry: GOOGLE_TRANSFER,
    retention: "setzt selbst keine Cookies",
    code: ["src/components/Cookies/googleTag.js"],
    dseSection: "google-analytics",
  },
  {
    key: "googleAnalytics",
    name: "Google Analytics 4",
    status: "aktiv",
    banner: {
      category: "statistics",
      title: "Google Analytics",
      contactPhone: "+353 1 543 1000",
      cookies: [
        { name: "_ga", type: "http", duration: months(24) },
        { name: "_ga_*", type: "http", duration: months(24) },
      ],
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
    category: "statistics",
    provider: GOOGLE,
    purpose: `Reichweitenmessung (Seitenaufrufe, Geräte, Herkunft, Ereignisse wie Anfragen und Klicks auf Telefon/E-Mail). Mess-ID ${GOOGLE_TAG_IDS.ga4}. GA4-Konfiguration nur mit Einwilligung in Statistik; Google Consent Mode v2, Voreinstellung „verweigert“.`,
    legalBasis: "Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (nur Einwilligung, kein berechtigtes Interesse; D3)",
    recipients: "Google Ireland Limited (Auftragsverarbeiter), Google LLC",
    thirdCountry: GOOGLE_TRANSFER,
    retention: "Cookies 24 Monate; Ereignisdaten in GA4 höchstens 14 Monate (freigegebener Wortlaut #google-analytics) [Einstellung „Datenaufbewahrung“ in der GA4-Verwaltung – vom Unternehmen zu bestätigen; D5]",
    code: ["src/components/Cookies/googleTag.js", "src/lib/analytics.js"],
    dseSection: "google-analytics",
  },
  {
    key: "googleAds",
    name: "Google Ads (Conversion-Messung, Remarketing)",
    status: "aktiv",
    banner: {
      category: "marketing",
      title: "Google Ads",
      contactPhone: "+1 650 253 0000",
      cookies: [
        { name: "test_cookie", type: "http", duration: { count: 1, unit: "day" } },
        { name: "IDE", type: "http", duration: { count: 1, unit: "year" } },
        { name: "CONSENT", type: "http", duration: { count: 18, unit: "year" } },
        { name: "1P_JAR", type: "http", duration: months(1) },
        { name: "_gcl_au", type: "http", duration: months(3) },
      ],
      dataProcessing: GOOGLE_DATA_PROCESSING,
    },
    category: "marketing",
    provider: GOOGLE,
    purpose: "Messung, ob eine Anzeige zu einer Anfrage geführt hat, und Remarketing. gtag.js und die Ads-Konfiguration laden nur mit dieser Einwilligung und erst, wenn eine Ads-Kennung hinterlegt ist; bis dahin geht bei „nur Marketing“ nichts an Google [vom Unternehmen: Ads-Konto, Kennung AW-…]. Erweiterte Conversions (gehashte E-Mail) sind nicht aktiv.",
    legalBasis: "Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 (Einwilligung)",
    recipients: "Google Ireland Limited [Rolle Auftragsverarbeiter oder eigener Verantwortlicher – anwaltlich prüfen]",
    thirdCountry: GOOGLE_TRANSFER,
    retention: "Cookies laut Banner [Liste nach C7 aktualisieren: _gcl_au/_gcl_aw 90 Tage, IDE 13 Monate, test_cookie 15 Min., CONSENT 18 Jahre streichen – anwaltlich prüfen]",
    code: ["src/components/Cookies/googleTag.js"],
    dseSection: "google-ads",
  },
  {
    // QA Recht Einblicke P1-1 (29.10.2026): own service with its own consent
    // key "einblicke" (cookie key = this key), category Statistik, chosen
    // independently of Google Analytics. Switch visible only while the
    // feature runs (EINBLICKE_ACTIVE = NEXT_PUBLIC_EINBLICKE, see below).
    // Privacy-policy text: proposal Marktresearch/digital/features/
    // einblicke-dse-vorschlag.md (law firm); no public section before that.
    key: "einblicke",
    name: "Besucher-Einblicke (eigene Heatmap, kein Drittanbieter)",
    status: "aktiv",
    banner: {
      category: "statistics",
      title: "Besucher-Einblicke (eigene Heatmap)",
      contactPhone: "+43 5574 46255",
      cookies: [{ name: "ph_eb", type: "sessionStorage", duration: { count: 30, unit: "minute" } }],
      dataProcessing: { countries: [], mechanisms: [] },
    },
    category: "statistics",
    provider: {
      name: "Platzhirsch Home Living (eigener Server und eigenes Backoffice)",
      address: "Platzhirsch Home Living, Landstraße 11, 6911 Lochau, Österreich (eigener Server, kein Drittanbieter)",
      phone: "+43 5574 46255",
      email: "info@platzhirsch.studio",
      privacy: "/datenschutz",
    },
    purpose:
      "Eigene, anonymisierte Heatmap: Klickpositionen und angeklickte Elemente, Mausbewegung im 40-px-Raster (nur Desktop), Scrolltiefe, Sichtzeit je Abschnitt, Namen berührter Formularfelder (nie Inhalte, keine Tastatureingaben), Validierungs- und JavaScript-Fehlertypen, Ziele (z. B. Termin, Anfrage) und Planer-Schritte, Herkunftskanal, Gerätegruppe und Fensterbreite. Keine Sitzungsaufzeichnung, keine IP-Adresse, kein Fingerprinting, keine Drittanbieter; Do-Not-Track und Global Privacy Control werden beachtet.",
    legalBasis: "Art. 6 Abs 1 lit a DSGVO, § 165 Abs 3 TKG 2021 / § 25 Abs 1 TDDDG (eigene Einwilligung „einblicke“, unabhängig von Google Analytics)",
    recipients: "keine Dritten; Tagesaggregate im eigenen Backoffice (Frappe, Rolle „Einblicke Leser“) [Hoster und AV-Vertrag – vom Unternehmen zu bestätigen]",
    thirdCountry: "keine [Serverstandort von Website und Backoffice – vom Unternehmen zu bestätigen; Ziel: EU/CH]",
    retention:
      "Zufällige Sitzungs-ID „ph_eb“ im sessionStorage, 30 Minuten; pseudonyme Rohdaten (ohne IP) höchstens 14 Tage, im Code erzwungen (SERVER.rawMaxDays); danach nur anonyme Tagesaggregate (mindestens 5 Besuche je Seite und Gerät) im Backoffice; deren Aufbewahrung wird im Backoffice eingestellt (Konzept: Voreinstellung 395 Tage) [vom Unternehmen zu bestätigen]",
    code: ["src/lib/einblicke/", "src/components/Einblicke/", "src/app/api/einblicke/"],
    dseSection: null,
  },
  {
    key: "concierge",
    name: "KI-Concierge (Chat-Assistent)",
    status: "labs",
    banner: null,
    category: "feature",
    provider: "Anthropic PBC, 548 Market Street, San Francisco, CA 94104, USA – Claude API, angebunden über das Anthropic-SDK (src/lib/concierge/run.js); läuft nur mit ANTHROPIC_API_KEY (conciergeLive) [Vertragspartner laut AVV – vom Unternehmen zu bestätigen]",
    purpose: "Antworten auf Fragen zu Marken, Produkten, Showroom und Terminen. Ihre Nachrichten und die Adresse der Seite gehen über unseren Server an die Claude API; ohne Einwilligung im Chat startet er nicht. Kennzeichnung als KI-System (Art. 50 KI-VO) im Chat und in der Datenschutzerklärung.",
    legalBasis: "Einwilligung im Chat (Art. 6 Abs 1 lit a DSGVO) – Code (CONSENT_VERSION) und freigegebener Wortlaut #ki-concierge (Kanzlei 29.10.2026)",
    recipients: "Anthropic als Auftragsverarbeiter [AVV/DPA ablegen – vom Unternehmen, bevor der Schlüssel in Produktion gesetzt wird]",
    thirdCountry: "USA; der freigegebene Wortlaut weist darauf hin, dass dort nicht in jedem Fall ein EU-gleichwertiges Datenschutzniveau besteht [DPF-Eintrag von Anthropic – vom Unternehmen zu prüfen]",
    retention: "Einwilligungs-Token 12 Stunden (sessionStorage, CONSENT_TTL_MS); gespeicherte Gesprächsverläufe nur mit eigener Zustimmung, ohne IP-Adresse, 30 Tage (RETENTION_DAYS) – freigegebener Wortlaut",
    code: ["src/lib/concierge/config.js", "src/lib/concierge/run.js", "src/app/api/labs/concierge/"],
    dseSection: "ki-concierge",
    quoted: { conciergeRetentionDays: 30 },
  },
  {
    key: "portal",
    name: "Kundenportal „Mein Platzhirsch“",
    status: "labs",
    banner: null,
    category: "feature",
    provider: SELF,
    purpose: "Projektunterlagen, Termine und Rückmeldungen für Kundinnen und Kunden; Anmeldung per E-Mail-Link (15 Minuten gültig).",
    legalBasis: "Art. 6 Abs 1 lit b DSGVO (Vertrag); Sprachnachrichten: lit a",
    recipients: "Backoffice (Frappe); Versand der Anmelde-Mail über Resend (einziger Dienst in allen Mail-Wegen des Codes; Deploy-Auflage PORTAL_MAIL_PROVIDER=resend, freigegebener Wortlaut #mailversand)",
    thirdCountry: "USA beim Mailversand über Resend (DPF, sonst SCC – freigegebener Wortlaut) [AVV mit Resend – vom Unternehmen abzulegen]",
    retention: "Sitzungs-Cookie „ph_portal_session“ 30 Tage; weitere Fristen in Abschnitt 5.18 [vom Unternehmen zu bestätigen]",
    code: ["src/lib/portal/privacy.js", "src/lib/portal/mailer.js", "src/app/[locale]/portal/"],
    dseSection: "kundenportal",
    quoted: { portalSessionDays: 30 },
  },
  {
    key: "mailDelivery",
    name: "E-Mail-Versand (Anmeldelink Kundenportal, Moodboard-PDF Stil-Finder, Termin-Mails)",
    status: "labs",
    banner: null,
    category: "feature",
    provider: "Resend (api.resend.com), Sitz USA – der einzige Versanddienst, den alle Mail-Wege des Codes kennen (portal/mailer.js, stilfinder/mail.js, booking/mailer.js, payments/mailer.js); Deploy-Auflage PORTAL_MAIL_PROVIDER=resend und STILFINDER_MAIL_PROVIDER=resend (MAIL_SERVICE in Datenschutz/datenschutz.js)",
    purpose: "Versand des Anmeldelinks zum Kundenportal (src/lib/portal/mailer.js), des Moodboard-PDF aus dem Stil-Finder (src/lib/stilfinder/mail.js) und – sobald der Online-Kalender läuft – der Termin-Mails (src/lib/booking/mailer.js). Ohne vollständige Konfiguration wird nichts versendet (Entwicklungs-Postausgang). Anfrageformulare versenden keine Mail über diesen Dienst: src/lib/forms/forward.js leitet sie nur an das Backoffice weiter.",
    legalBasis: "Art. 6 Abs 1 lit b DSGVO (vom Nutzer angeforderter Versand) – Kanzlei freigegeben 29.10.2026 (#mailversand)",
    recipients: "Resend als Auftragsverarbeiter [AV-Vertrag (DPA von Resend) – vom Unternehmen abzulegen, vor dem Einschalten des Versands]",
    thirdCountry: "USA: Zertifizierung von Resend nach dem EU-US Data Privacy Framework, sonst Standardvertragsklauseln – freigegebener Wortlaut (MAIL_SERVICE.transferBasis)",
    retention: "Versandprotokolle bei Resend nach dessen Bedingungen; der Stil-Finder speichert die Angaben nach dem Versand nicht",
    code: ["src/lib/portal/mailer.js", "src/lib/stilfinder/mail.js", "src/lib/stilfinder/config.js", "src/lib/booking/mailer.js", "src/lib/forms/forward.js"],
    dseSection: "kundenportal",
  },
  {
    key: "upload",
    name: "Handy-Upload von Fotos, Videos und Plänen",
    status: "labs",
    banner: null,
    category: "feature",
    provider: SELF,
    purpose: "Fotos, Videos und Pläne zu einer bestehenden Anfrage per QR-Code hochladen; Ablage im Backoffice. GPS-Daten werden heute nur bei JPEG entfernt.",
    legalBasis: "Einwilligung beim Upload (Art. 6 Abs 1 lit a DSGVO) – Code (CONSENT_VERSION) und freigegebener Wortlaut #upload",
    recipients: "Backoffice (Frappe)",
    thirdCountry: "keine [Serverstandort – vom Unternehmen zu bestätigen]",
    retention: "180 Tage nach Ablauf des Links [Vorschlag, Bestätigung durch das Unternehmen offen; bis dahin nimmt der Upload nichts an (UPLOAD_CONFIG.retentionConfirmed)]",
    code: ["src/lib/upload/config.js", "src/lib/upload/frappeAdapter.js", "src/app/api/upload/"],
    dseSection: "upload",
    quoted: { uploadRetentionDays: 180 },
  },
  {
    key: "planner",
    name: "Online-Planer (Küchenplaner, Sofa-Modulplaner)",
    status: "labs",
    banner: null,
    category: "feature",
    provider: SELF,
    purpose: "Entwurf im Browser planen; auf Wunsch an uns senden. Der Sofa-Planer speichert den Entwurf im Local Storage Ihres Browsers.",
    legalBasis: "Senden: Art. 6 Abs 1 lit b DSGVO [Checkbox im Küchenplaner als Einwilligung formuliert – anwaltlich prüfen]; Local Storage: § 165 Abs 3 TKG 2021 (vom Nutzer ausgelöst)",
    recipients: "Backoffice (Frappe); Drosselzähler nur im Arbeitsspeicher des Servers (src/lib/forms/rateLimit.js, kein Redis konfiguriert)",
    thirdCountry: "keine [Serverstandort – vom Unternehmen zu bestätigen]",
    retention: "gespeicherte Planungen und Teilen-Links 180 Tage – freigegebener Wortlaut #planer",
    code: ["src/components/Labs/", "src/app/api/labs/"],
    dseSection: "online-planer",
  },
  {
    key: "ecbRates",
    name: "Wechselkurse der Europäischen Zentralbank",
    status: "labs",
    banner: null,
    category: "feature",
    provider: "Europäische Zentralbank (öffentliche Referenzkurse)",
    purpose: "CHF-Umrechnung im Dreiländer-Rechner. Unser Server lädt die Kurse; Ihr Browser fragt nicht bei der EZB an.",
    legalBasis: "keine personenbezogenen Daten",
    recipients: "keine",
    thirdCountry: "keine",
    retention: "keine Speicherung personenbezogener Daten",
    code: ["src/components/Labs/Dreilaender/ecb.server.js"],
    dseSection: null,
  },
  {
    key: "socialLinks",
    name: "Links zu Instagram, Facebook und LinkedIn",
    status: "aktiv",
    banner: null,
    category: "essential",
    provider: "–",
    purpose: "Einfache Links in Fuß und Kontaktbereich, keine eingebetteten Plugins. Daten gehen erst an die Plattform, wenn Sie den Link öffnen.",
    legalBasis: "keine Übermittlung durch uns",
    recipients: "keine",
    thirdCountry: "keine",
    retention: "keine",
    code: ["src/lib/site.js"],
    dseSection: "social-media",
  },
  {
    key: "youtube",
    name: "YouTube- oder Vimeo-Videos",
    status: "nicht eingesetzt",
    banner: null,
    category: "functional",
    provider: GOOGLE,
    purpose: "Kein Video-Einbettung im Code (Inventur 26.10.2026). Falls Videos kommen: nur nach Klick über ConsentEmbed und mit eigenem Banner-Eintrag (AP2).",
    legalBasis: "–",
    recipients: "–",
    thirdCountry: "–",
    retention: "–",
    code: [],
    dseSection: "video",
  },
  {
    // Rat 9,5 B3: eigener Kalender /termin (kein fremdes Widget, daher kein
    // Banner-Eintrag). In Produktion "off", bis der Abschnitt #termin freigegeben
    // ist (src/lib/legal/dseSections.js → src/lib/booking/config.js terminMode).
    key: "booking",
    name: "Online-Terminkalender mit Videoberatung (eigene Seite /termin)",
    status: "labs",
    banner: null,
    category: "feature",
    provider: "Platzhirsch Home Living (eigener Server); Termine und Videoraum im eigenen Backoffice (Frappe; Inhaber-Entscheidung Nr. 12, meetUrl aus src/lib/booking/adapters/frappe.js), kein externer Kalender- oder Videodienst [Hoster des Backoffice – vom Unternehmen]",
    purpose: "Terminwahl (Studio, Video, vor Ort, Planungstermin), Bestätigung per E-Mail-Link (Double-Opt-in, 30 Minuten Vormerkung), Ändern/Absagen über einen signierten Link, Videoraum-Link ab 15 Minuten vor Beginn nur auf der Terminseite. Ohne Frappe-Schlüssel nur Testbetrieb im Dev. In Produktion erst mit freigegebenem DSE-Abschnitt #termin.",
    legalBasis: "Art. 6 Abs 1 lit b DSGVO; Video zusätzlich Einwilligung lit a (Wortlaut #termin) [anwaltlich prüfen]",
    recipients: "Backoffice (Frappe); Termin-Mails über Resend (wie E-Mail-Versand) [AV-Vertrag – vom Unternehmen zu bestätigen]",
    thirdCountry: "USA beim Mailversand über Resend (freigegebener Wortlaut E-Mail-Versand)",
    retention: "Wortlaut #termin: bis der Termin stattgefunden hat und solange Rückfragen zu erwarten sind, bei Auftrag 7 Jahre; unbestätigte Vormerkungen einen Tag nach Ablauf (Code); Mock-Adapter löscht 30 Tage nach Terminende [feste Frist im Backoffice – Inhaber, Kanzlei]",
    code: ["src/lib/booking/", "src/app/[locale]/termin/", "src/app/api/termin/"],
    dseSection: "terminbuchung",
  },
  {
    key: "metaPixel",
    name: "Meta Pixel",
    status: "nicht eingesetzt",
    banner: null,
    category: "marketing",
    provider: "Meta Platforms Ireland Limited",
    purpose: "Nicht eingebunden. Erst mit Konto und eigenem Banner-Eintrag (C8, Welle 2).",
    legalBasis: "–",
    recipients: "–",
    thirdCountry: "–",
    retention: "–",
    code: [],
    dseSection: "meta",
  },
];

export const SERVICE_KEYS = SERVICES.map((s) => s.key);

// ---------------------------------------------------------------------------
// What the consent dialog actually shows (r7-p1 recht P1-4, R3 recht P1-4):
// the privacy policy may only describe a consent category that has a visible
// switch (tests/unit/r8-recht-consent.test.mjs).
//   - "Google Tag Manager" is the loader of GA4 and has no switch of its own
//     (Register C4); it follows Statistik.
//   - "Google Ads" (Marketing) only while an Ads ID is configured. Without it
//     the dialog hides the switch AND the public privacy policy drops the
//     Google-Ads section (it stays in the draft for the law firm,
//     LegalDrafts/docs/datenschutz.js #google-ads, and in this register).
// ---------------------------------------------------------------------------
export const ADS_ACTIVE = Boolean(GOOGLE_TAG_IDS.ads);
// "Besucher-Einblicke" (own heatmap): switch only while the feature runs
// (NEXT_PUBLIC_EINBLICKE, src/lib/einblicke/config.js; production default
// off). Before NEXT_PUBLIC_EINBLICKE=1 goes live, the law firm approves the
// texts and the privacy-policy section (einblicke-dse-vorschlag.md).
export const EINBLICKE_ACTIVE = einblickeOn();

/** { functional: ["googleMaps"], statistics: ["googleAnalytics", "einblicke"?], marketing?: ["googleAds"] } */
export function visibleConsentServices({ adsActive = ADS_ACTIVE, einblickeActive = EINBLICKE_ACTIVE } = {}) {
  return Object.fromEntries(
    Object.entries(servicesByCategory())
      .map(([category, keys]) => [
        category,
        keys.filter((id) => id !== "googleTagManager" && (adsActive || id !== "googleAds") && (einblickeActive || id !== "einblicke")),
      ])
      .filter(([, keys]) => keys.length > 0)
  );
}

/**
 * Consent-based sections of the public privacy policy (/datenschutz): section
 * id and the banner service it describes. Only services with a visible
 * switch get a section.
 */
export function consentPolicySections({ adsActive = ADS_ACTIVE, einblickeActive = EINBLICKE_ACTIVE } = {}) {
  const visible = new Set(Object.values(visibleConsentServices({ adsActive, einblickeActive })).flat());
  return [
    { id: "google-maps", service: "googleMaps" },
    { id: "google-analytics", service: "googleAnalytics" },
    { id: "google-ads", service: "googleAds" },
    // Text: proposal einblicke-dse-vorschlag.md, after approval by the law firm.
    { id: "besucher-einblicke", service: "einblicke" },
  ].filter((s) => visible.has(s.service));
}

// ---------------------------------------------------------------------------
// "Rundgang" in consent texts (gesamtwerk R3 P1-6): the word may only appear
// while the showroom tour is live with a real recording
// (src/lib/showroom/config.js SHOWROOM_PUBLIC = switch + real splat in the
// manifest). Until then banner, dialog and privacy policy name what Google
// Maps really loads: the map and the Street View image of the showroom
// (UberUns/austellung.js), without "Rundgang"/"tour"/"visite".
// The texts in src/messages (Cookies.bannerText, categories.functional,
// services.googleMaps) come back as soon as the tour is live.
// ---------------------------------------------------------------------------
export const SHOWROOM_TOUR_LIVE = SHOWROOM_PUBLIC;

export const MAPS_CONSENT_NEUTRAL = Object.freeze({
  de: {
    bannerText: "Mit Ihrer Einwilligung laden wir Google Maps (Karte und Street View) und zählen Besuche mit Google Analytics. Ohne Einwilligung funktioniert die Seite vollständig.",
    "categories.functional.description": "Google Maps: die Karte auf der Kontaktseite und die Street-View-Ansicht unserer Ausstellung. Ohne Einwilligung sehen Sie dort einen Platzhalter und können die Karte einzeln laden.",
    "services.googleMaps.description": "Karte auf der Kontaktseite und Street-View-Ansicht der Ausstellung.",
  },
  en: {
    bannerText: "With your consent we load Google Maps (map and Street View) and count visits with Google Analytics. Without consent the site works fully.",
    "categories.functional.description": "Google Maps: the map on the contact page and the Street View image of our showroom. Without consent you see a placeholder there and can load the map individually.",
    "services.googleMaps.description": "Map on the contact page and Street View image of the showroom.",
  },
  fr: {
    bannerText: "Avec votre consentement, nous chargeons Google Maps (carte et Street View) et comptons les visites avec Google Analytics. Sans consentement, le site fonctionne entièrement.",
    "categories.functional.description": "Google Maps : la carte de la page contact et la vue Street View de notre showroom. Sans consentement, vous y voyez un espace réservé et pouvez charger la carte individuellement.",
    "services.googleMaps.description": "Carte de la page contact et vue Street View du showroom.",
  },
  it: {
    bannerText: "Con il vostro consenso carichiamo Google Maps (mappa e Street View) e contiamo le visite con Google Analytics. Senza consenso il sito funziona completamente.",
    "categories.functional.description": "Google Maps: la mappa nella pagina contatti e la vista Street View del nostro showroom. Senza consenso vedete un segnaposto e potete caricare la mappa singolarmente.",
    "services.googleMaps.description": "Mappa nella pagina contatti e vista Street View dello showroom.",
  },
});

/**
 * Consent text for `key` (namespace Cookies): the neutral wording while the
 * tour is not live, otherwise null (= use the message from src/messages).
 */
export function mapsConsentOverride(key, locale, { tourLive = SHOWROOM_TOUR_LIVE } = {}) {
  if (tourLive) return null;
  const copy = MAPS_CONSENT_NEUTRAL[locale] || MAPS_CONSENT_NEUTRAL.de;
  return copy[key] ?? null;
}

export function getService(key) {
  return SERVICES.find((s) => s.key === key) || null;
}

/** Services the visitor can switch in the banner (status "aktiv" + banner). */
export const BANNER_SERVICES = SERVICES.filter((s) => s.banner && s.status === "aktiv");

const providerName = (p) => (typeof p === "string" ? p : p.name);

/**
 * `cookieServices` in the shape the banner has always used:
 * { functional: { googleMaps: { id, title, provider, contact, cookies, dataProcessing } }, … }
 */
export function buildCookieServices(services = BANNER_SERVICES) {
  const out = Object.fromEntries(BANNER_CATEGORIES.map((c) => [c, {}]));
  for (const s of services) {
    const b = s.banner;
    const p = typeof s.provider === "string" ? { address: s.provider } : s.provider;
    out[b.category][s.key] = {
      id: s.key,
      title: b.title,
      provider: p.address,
      contact: { phone: b.contactPhone || p.phone, email: p.email, privacy: p.privacy },
      ...(b.cookies ? { cookies: b.cookies } : {}),
      ...(b.storage ? { storage: b.storage } : {}),
      dataProcessing: b.dataProcessing,
    };
  }
  return out;
}

/** { functional: ["googleMaps", …], statistics: […], marketing: […] } */
export function servicesByCategory(services = BANNER_SERVICES) {
  const out = Object.fromEntries(BANNER_CATEGORIES.map((c) => [c, []]));
  for (const s of services) out[s.banner.category].push(s.key);
  return out;
}

const CATEGORY_LABEL = {
  essential: "Essenziell",
  functional: "Funktional",
  statistics: "Statistik",
  marketing: "Marketing",
  feature: "Funktion der Website",
  loader: "Statistik oder Marketing (technische Ladebibliothek)",
};

/** Rows for the privacy-policy preview and the law-firm folder (one per service). */
export function dseServiceRows(services = SERVICES) {
  return services.map((s) => ({
    key: s.key,
    name: s.name,
    status: s.status,
    category: CATEGORY_LABEL[s.category] || s.category,
    banner: s.banner ? `ja, unter ${CATEGORY_LABEL[s.banner.category]}${s.bannerNote ? ` (${s.bannerNote})` : ""}` : "nein",
    provider: providerName(s.provider),
    purpose: s.purpose,
    legalBasis: s.legalBasis,
    recipients: s.recipients,
    thirdCountry: s.thirdCountry,
    retention: s.retention,
    code: s.code,
    dseSection: s.dseSection,
  }));
}
