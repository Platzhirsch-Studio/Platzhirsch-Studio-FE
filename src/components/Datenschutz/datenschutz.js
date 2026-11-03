import React from "react";
import Link from "next/link";
import LegalProse from "@/components/Impressum/LegalProse";
import { ADDRESS, EMAIL, EMAIL_HREF, LEGAL_NAME, PHONE_DISPLAY, PHONE_HREF, SITE_NAME } from "@/lib/site";
import { consentPolicySections } from "@/lib/legal/services";
import { UPLOAD_CONFIG, uploadsAccepting } from "@/lib/upload/config";
import { RAUM_CONFIG } from "@/lib/raumzwilling/config";
import { RETENTION_DAYS as CONCIERGE_RETENTION_DAYS } from "@/lib/concierge/retention";
import { CONFIRM_TTL_MS, appointmentMode } from "@/lib/agent/config";
import { MAGIC_LINK_MINUTES, SESSION_DAYS } from "@/lib/portal/privacy";
// Rat 9,5 B4: vorbereitete Ergänzungen, je einzeln abschaltbar (src/lib/legal/dseSections.js).
import {
  ArAbschnitt,
  EinblickeAbschnitt,
  EmpfehlungAbschnitt,
  IdeenboardAbschnitt,
  ServiceAnfragenAbschnitt,
  TagebuchAbschnitt,
  TerminAbschnitt,
  TerminMailsSatz,
  WhatsappAbschnitt,
  WunschlisteAbschnitt,
} from "@/components/LegalDrafts/dseErgaenzungen";

// Datenschutzerklärung, live page /<locale>/datenschutz (German text in all
// four languages, as before).
//
// FREIGEGEBEN – Kanzlei-Freigabe der Rechtstexte laut Inhaber-Entscheidung
// Nr. 11 (29.10.2026, src/components/LegalDrafts/liveStatus.js), inkl. der
// Abschnitte Concierge, Upload, Kundenportal, E-Mail-Versand und Bewerbungen.
// Ein Abschnitt Online-Zahlung (Stripe) steht hier erst, wenn die Kaufstrecke
// live ist (VOUCHER_MODE=stripe); der Text dazu liegt im Kanzlei-Entwurf 5.12.
// Fix-Runde 1 (F4, r1-recht-inhalt P0-1) hat nur
//   1. falsche Tatsachen berichtigt: „Privacy Shield“ (EuGH C-311/18) → EU-US
//      Data Privacy Framework (Durchführungsbeschluss (EU) 2023/1795),
//      „TKG 2003“/„§ 96 Abs 3 TKG“ → § 165 Abs 3 TKG 2021, „Komission“,
//      Google Analytics nur mit Einwilligung (keine lit f), GA-Dauer „26
//      Monate“ → tatsächliche Höchstdauer, Newsletter nur E-Mail-Adresse;
//   2. die Abschnitte ergänzt, die die eingeschalteten Funktionen beschreiben
//      (Concierge/Anthropic, Handy-Upload, Portal/Raumzwilling, Planer,
//      Ezarri-Anfrage, KI-Assistenten/Terminwunsch), Werte aus dem Code bzw.
//      aus src/lib/legal/services.js.
// Bewusst NICHT entschieden und deshalb nicht behauptet (keine Platzhalter
// im Text, sondern neutral formuliert): Name/Sitz des Hosters, Abschluss von
// AV-Verträgen, DPF-Zertifizierung von Anthropic, Rechtsgrundlage Concierge
// (Code: Einwilligung; Entwurf 02: lit b), feste Frist für Anfragen und
// Server-Protokolle, eigenes Postfach datenschutz@. Die Fassung für die
// Kanzlei mit allen offenen Punkten: /de/preview/recht/datenschutz
// (src/components/LegalDrafts/docs/datenschutz.js, Marktresearch/recht/02).
// Abschnitte, die von Schaltern abhängen (Upload, Terminwunsch, Google Ads),
// lesen den Schalter selbst, damit der Text nie mehr verspricht als läuft.
// Runde 8 (r3-recht-inhalt P1-3/P1-4, gesamtwerk P1-6):
//   - Einwilligungs-Abschnitte nur für Dienste mit sichtbarem Schalter im
//     Dialog (services.js consentPolicySections). Ohne Ads-Kennung gibt es
//     keinen Marketing-Schalter, also auch keinen Google-Ads-Abschnitt; der
//     Text dazu steht im Entwurf (/de/preview/recht/datenschutz#google-ads).
//   - Google Maps: „Street-View-Ansicht“ statt „Rundgang“ (der 3D-Rundgang
//     /showroom ist ohne echte Aufnahme nicht live und bräuchte als
//     selbst gehostete Seite ohnehin keine Einwilligung).
//   - Neuer Abschnitt „E-Mail-Versand“ nach dem Code: Formulare gehen nur ans
//     Backoffice (src/lib/forms/forward.js); automatische Mails (Portal-Link,
//     Stil-Finder-PDF) je nach Einrichtung über Resend oder Postmark (USA),
//     src/lib/portal/mailer.js, src/lib/stilfinder/mail.js. Rechtsgrundlage
//     [Kanzlei prüfen] steht nur hier und im Register (mailDelivery), nicht
//     sichtbar. Hoster ist im Repo nicht belegt: öffentlich neutral, offen im
//     Register (hosting).
// Runde 4 (r4-recht-inhalt P1-2/P1-3, Fix-Team P6):
//   - E-Mail-Versand: nur noch EIN Dienst, Resend. Begründung aus dem Code:
//     Resend ist der einzige Versanddienst, den alle drei Mail-Wege kennen
//     (src/lib/portal/mailer.js, src/lib/stilfinder/mail.js,
//     src/lib/payments/mailer.js – Letzterer kennt nur Resend) und den die
//     Feature-Dokus für den Deploy nennen (stilfinder.md, stripe-zahlung.md).
//     Die Oder-Formulierung (Postmark, Backoffice-Mailkonto) ist gestrichen.
//     Deploy-Auflage: PORTAL_MAIL_PROVIDER und STILFINDER_MAIL_PROVIDER =
//     resend, sonst stimmt dieser Abschnitt nicht (MAIL_SERVICE.provider).
//     Die Übermittlungsgrundlage USA steht als Platzhalter-Satz
//     (MAIL_SERVICE.transferBasis, lawFirmConfirmed: false): DPF-Eintrag von
//     Resend prüfen, sonst SCC; AVV (DPA von Resend) ablegen.
//   - Neuer Abschnitt „Bewerbungen“ (Art. 13 ab Eingang der Bewerbung):
//     Zweck, Art. 6 Abs. 1 lit. b, Speicherdauer als Vorschlag
//     (APPLICATION_RETENTION.ownerConfirmed: false, Inhaber bestätigt).
// 02.11.2026 (Inhaber: „Rechtstexte fertig machen“):
//   - Ergänzungsblöcke (LegalDrafts/dseErgaenzungen.js): Platzhalter aus dem
//     Code geschlossen, kein Entwurfs-/Verfasserhinweis mehr im Besuchertext,
//     nur „Stand: 02.11.2026“. Status in den Daten bleibt „entwurf“.
//   - Live erreichbare Funktionen ohne Schalter (Service-Formulare Hotel/
//     Architekten/Winterservice/Pflege, 3D-/AR-Ansicht) erscheinen jetzt auch
//     in Produktion (dseSections.js `oeffentlich`). Termin, WhatsApp,
//     Einblicke, Ideenboard-Teilen, Wunschliste, Empfehlung, Tagebuch bleiben
//     in Produktion gesperrt und ohne Abschnitt, bis sie freigegeben sind.
//   - Online-Zahlung/Versand (Stripe, LetMeShip): weiter nur im Shop-Testmodus,
//     Text in src/lib/shop/legalTexte.js, gilt ab Freischaltung des Onlineshops.
export const MAIL_SERVICE = Object.freeze({
  provider: "resend",
  name: "Resend",
  seatCountry: "USA",
  // Satz von der Kanzlei freigegeben (Inhaber-Entscheidung Nr. 11). Er gilt
  // nur, wenn der AV-Vertrag (DPA) mit Resend abgeschlossen ist – Deploy-
  // Auflage, vor dem Livegang durch den Inhaber (freigaben-recht.md).
  transferBasis:
    "Die Übermittlung in die USA stützen wir auf die Zertifizierung von Resend nach dem EU-US Data Privacy Framework (Angemessenheitsbeschluss der Europäischen Kommission, Art. 45 DSGVO); soweit diese nicht greift, auf die Standardvertragsklauseln der Europäischen Kommission (Art. 46 Abs. 2 lit. c DSGVO), die Teil des Auftragsverarbeitungsvertrags mit Resend sind.",
  lawFirmConfirmed: true,
});

// Bewerbungen: Löschfrist als Vorschlag (7 Monate nach Abschluss des
// Verfahrens = 6 Monate Frist für Ansprüche nach dem Gleichbehandlungsgesetz
// plus Zustellpuffer, r4-recht-inhalt P1-3). Inhaber bestätigt, Kanzlei prüft.
export const APPLICATION_RETENTION = Object.freeze({ months: 7, ownerConfirmed: false });

export const DATENSCHUTZ_LIVE_STATUS = Object.freeze({
  stand: "2026-11-02",
  lawyerApproved: true,
  approvedAt: "2026-10-29",
  approvedBy: "Kanzlei (Inhaber-Entscheidung Nr. 11)",
  basis: ["Marktresearch/recht/02-datenschutzerklaerung-entwurf.md", "src/lib/legal/services.js", "qa-screenshots/fertig/r1-recht-inhalt.md P0-1"],
  // Von der Kanzlei mit dem Wortlaut freigegeben (vorher offen für die Kanzlei):
  approvedByLawFirm: [
    "Concierge: Rechtsgrundlage und Drittlandgrundlage Anthropic, wie im Abschnitt #ki-concierge",
    "E-Mail-Versand: Anbieter Resend (einziger Dienst in allen Mail-Wegen des Codes), Rechtsgrundlage lit b, Drittlandgrundlage USA (DPF, sonst SCC): Kanzlei freigegeben",
    "Bewerbungen: Speicherdauer 7 Monate nach Abschluss des Verfahrens und Evidenz nur mit Einwilligung: Kanzlei freigegeben",
    "Hoster neutral als „Hosting-Dienstleister“, Fristen für Anfragen und Server-Protokolle neutral formuliert",
  ],
  // Bleibt beim Inhaber (vor dem Livegang, nicht Text, sondern Verträge/Schalter):
  openForOwner: [
    "AV-Verträge ablegen: Anthropic (Concierge), Resend (Mailversand), Hoster – Concierge (ANTHROPIC_API_KEY) und Mailversand erst danach einschalten",
    "Mail-Dienst in Frappe/Server: bleibt es nicht bei Resend, müssen MAIL_SERVICE und der Abschnitt E-Mail-Versand vor dem Livegang angepasst und von der Kanzlei bestätigt werden",
    "Kundenportal: Speicherfristen und Empfänger in src/lib/portal/privacy.js bestätigen, danach OWNER_CONFIRMED = true",
    "Upload-Löschfrist bestätigen, danach UPLOAD_CONFIG.retentionConfirmed = true (bis dahin nimmt der Upload nichts an)",
    "Bewerbungen: 7 Monate bestätigen, danach APPLICATION_RETENTION.ownerConfirmed = true",
    "Google Ads: Abschnitt erst mit Ads-Kennung und Marketing-Schalter (Text im Entwurf #google-ads)",
  ],
  // Hoster: im Repo nicht belegt (kein Anbieter in next.config.js, keine
  // Deploy-Konfiguration). Öffentlich nur „Hosting-Dienstleister“.
  hosterInRepo: false,
});

const STAND = "2. November 2026";

const ul = "mt-3 list-disc space-y-2 pl-5 marker:text-text-soft";
const h3 = "mt-8 text-lead font-medium text-text";

function H3({ id, children }) {
  return (
    <h3 id={id} className={h3}>
      {children}
    </h3>
  );
}

const Datenschutz = () => {
  const accepting = uploadsAccepting();
  const appointmentLive = appointmentMode(process.env).mode === "live";
  const consentSections = new Set(consentPolicySections().map((section) => section.id));
  const confirmHours = Math.round(CONFIRM_TTL_MS / (60 * 60 * 1000));

  return (
    <LegalProse>
      <p>
        <strong>Stand: {STAND}</strong>
      </p>
      <p>
        Der Schutz Ihrer persönlichen Daten ist uns wichtig. Wir verarbeiten sie auf Grundlage der Datenschutz-Grundverordnung
        (DSGVO), des österreichischen Datenschutzgesetzes (DSG) und des Telekommunikationsgesetzes 2021 (TKG 2021). Hier
        erfahren Sie, welche Daten wir auf dieser Website und bei Anfragen verarbeiten, wozu, auf welcher Rechtsgrundlage, an wen
        sie gehen und wie lange wir sie aufbewahren.
      </p>

      <h2 id="verantwortlich">Verantwortlich</h2>
      <p>
        <strong>{LEGAL_NAME}</strong>
        <br />
        Geschäftsbezeichnung: {SITE_NAME}
        <br />
        {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.country}
        <br />
        Telefon: <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
        <br />
        E-Mail: <a href={EMAIL_HREF}>{EMAIL}</a>
      </p>
      <p>Für alle Fragen zum Datenschutz und für Ihre Anliegen nach Abschnitt „Ihre Rechte“ erreichen Sie uns unter dieser Adresse.</p>

      <h2 id="grundlagen">Rechtsgrundlagen im Überblick</h2>
      <ul className={ul}>
        <li>
          <strong>Anfrage und Vertrag</strong> (Art. 6 Abs. 1 lit. b DSGVO): wenn Sie uns anfragen, einen Termin wünschen oder einen
          Auftrag erteilen.
        </li>
        <li>
          <strong>Rechtliche Pflicht</strong> (Art. 6 Abs. 1 lit. c DSGVO): etwa die Aufbewahrung von Rechnungen (§ 132 BAO, § 212 UGB).
        </li>
        <li>
          <strong>Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f DSGVO): sicherer Betrieb der Website und Schutz vor Missbrauch.
          Dagegen können Sie Widerspruch einlegen.
        </li>
        <li>
          <strong>Einwilligung</strong> (Art. 6 Abs. 1 lit. a DSGVO; bei Cookies und ähnlichen Techniken zusätzlich § 165 Abs. 3 TKG
          2021): Sie können eine Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, für Cookies über
          „Privatsphäre-Einstellungen“ im Fuß jeder Seite.
        </li>
      </ul>
      <p>Automatisierte Entscheidungen im Sinne von Art. 22 DSGVO treffen wir nicht.</p>

      <h2 id="website">Besuch der Website</h2>
      <p>
        Bei jedem Aufruf verarbeitet unser Server technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse,
        zuvor besuchte Seite, Browser und Betriebssystem. Das dient der Auslieferung der Seite, der Sicherheit und der Fehlersuche
        (Art. 6 Abs. 1 lit. f DSGVO). Die Website wird bei einem Hosting-Dienstleister betrieben, der diese Daten in unserem Auftrag
        verarbeitet. Server-Protokolle bewahren wir nur so lange auf, wie es für Sicherheit und Fehlersuche nötig ist.
      </p>
      <p>
        Schriften liefern wir von unserem eigenen Server aus; Ihr Browser baut dafür keine Verbindung zu Google Fonts oder anderen
        Schriftdiensten auf. Produktdaten und Bilder laden wir serverseitig aus unserem Verwaltungssystem (Backoffice); dabei gehen
        keine Daten Ihres Browsers an Dritte.
      </p>
      <p>
        Instagram, Facebook und LinkedIn verlinken wir nur. Daten gehen an diese Plattformen erst, wenn Sie einen Link öffnen.
      </p>

      <h2 id="cookies">Cookies und Einwilligung</h2>
      <p>
        Cookies und vergleichbare Techniken (etwa der Speicher Ihres Browsers) setzen wir nur ein, wenn sie für die von Ihnen
        gewünschte Funktion unbedingt nötig sind oder Sie eingewilligt haben (§ 165 Abs. 3 TKG 2021). Beim ersten Besuch fragen wir
        Sie in einem Banner. „Weiter ohne Einwilligung“ ist genauso einfach wie „Alle akzeptieren“. Ohne Einwilligung laden wir
        keine Karten- oder Analysedienste.
      </p>
      <p>Unbedingt nötig und ohne Einwilligung gesetzt:</p>
      <ul className={ul}>
        <li>
          <code>cookieConsent</code>: speichert Ihre Auswahl im Banner, 12 Monate.
        </li>
        <li>
          {/* R9-P5 (recht P1-4): Vertrag aus src/components/Navbar/LanguageSwitcher.js (rememberLocale) –
              NEXT_LOCALE und preferredLocale werden nur gesetzt, wenn der Besucher aktiv die Sprache wechselt. */}
          <code>NEXT_LOCALE</code> (Cookie, 12 Monate) und <code>preferredLocale</code> (Speicher Ihres Browsers): merken sich
          die gewählte Sprache. Beide werden nur gesetzt, wenn Sie aktiv die Sprache wechseln, nicht schon beim ersten Besuch oder
          beim bloßen Aufruf einer Seite.
        </li>
      </ul>
      <p>
        Welche Dienste, Cookies und Laufzeiten im Einzelnen dazugehören, sehen Sie jederzeit unter „Privatsphäre-Einstellungen“.
        Dort können Sie Ihre Auswahl auch ändern oder widerrufen.
      </p>

      <h2 id="anfragen">Anfragen per Formular, E-Mail und Telefon</h2>
      <p>
        Das gilt für die Kontakt-, Beratungs- und Produktanfrage, die Anfrage zu Ezarri-Glasmosaik und für E-Mails und Anrufe.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> Name, E-Mail-Adresse, Telefonnummer (soweit angegeben), bei Produkt- und Ezarri-Anfragen Land oder
          Ort, Ihre Nachricht und Ihre Angaben zum Vorhaben (etwa Art des Projekts, Fläche, Zeitraum, gemerkte Produkte).
        </li>
        <li>
          <strong>Zweck und Rechtsgrundlage:</strong> Beantwortung Ihrer Anfrage, Angebot, Rückfragen (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Weg und Empfänger:</strong> Die Formulare senden an unseren Server, der die Anfrage an unser Backoffice
          weitergibt. Zugriff haben nur die zuständigen Mitarbeitenden. Ist es für ein Angebot nötig, geben wir einzelne Angaben (etwa
          Maße und Lieferort) an den jeweiligen Hersteller weiter. Zum Schutz vor Missbrauch zählen wir Formularsendungen kurzzeitig je
          IP-Adresse (Art. 6 Abs. 1 lit. f DSGVO).
        </li>
        <li>
          <strong>Speicherdauer:</strong> bis Ihre Anfrage erledigt ist und danach, solange mit Rückfragen zu rechnen ist. Wird ein
          Auftrag daraus, gelten die gesetzlichen Aufbewahrungsfristen (in Österreich 7 Jahre, § 132 BAO).
        </li>
      </ul>

      <ServiceAnfragenAbschnitt />
      <WhatsappAbschnitt />
      <TerminAbschnitt />

      <h2 id="newsletter">Newsletter</h2>
      <p>
        Für den Newsletter brauchen wir nur Ihre E-Mail-Adresse und Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 174 TKG 2021).
        Nach der Anmeldung senden wir Ihnen eine E-Mail mit einem Link zur Bestätigung. Die Anmeldung speichern wir in unserem
        Backoffice. Abmelden können Sie sich jederzeit über den Link im Newsletter oder per E-Mail an{" "}
        <a href="mailto:marketing@platzhirsch.studio">marketing@platzhirsch.studio</a>. Danach löschen wir Ihre Adresse aus dem
        Verteiler. Die Rechtmäßigkeit der Verarbeitung bis zum Widerruf bleibt unberührt.
      </p>

      <h2 id="google">Google-Dienste (nur mit Einwilligung)</h2>
      <p>
        Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Daten können an die Google LLC in den
        USA übermittelt werden. Die Google LLC ist nach dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss der
        Europäischen Kommission, Durchführungsbeschluss (EU) 2023/1795, Art. 45 DSGVO); ergänzend gelten Standardvertragsklauseln.
        Rechtsgrundlage ist jeweils Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 165 Abs. 3 TKG 2021).
      </p>
      {consentSections.has("google-maps") && (
        <>
          <H3 id="google-maps">Google Maps</H3>
          <p>
            Karte und Street-View-Ansicht der Ausstellung laden erst nach Ihrer Einwilligung im Banner oder nach Klick auf
            „Karte laden“. Dann gehen IP-Adresse und Browserdaten an Google, und Google kann Cookies setzen. Ohne Karte finden Sie
            Adresse und Routenlink direkt auf der Seite.
          </p>
        </>
      )}
      {consentSections.has("google-analytics") && (
        <>
          <H3 id="google-analytics">Google Analytics 4 (Statistik)</H3>
          <p>
            Mit Ihrer Einwilligung in „Statistik“ messen wir Seitenaufrufe, Gerätetyp, ungefähre Herkunft und Ereignisse wie das
            Absenden einer Anfrage oder den Klick auf Telefon und E-Mail. Namen, E-Mail-Adressen oder Nachrichten übermitteln wir
            nicht. Wir nutzen den Einwilligungsmodus von Google: Ohne Ihre Einwilligung wird Google Analytics nicht geladen.
            Cookies <code>_ga</code> und <code>_ga_*</code> bis 24 Monate; Ereignisdaten bewahrt Google höchstens 14 Monate auf.
          </p>
        </>
      )}
      {consentSections.has("google-ads") && (
        <>
          <H3 id="google-ads">Google Ads (Marketing)</H3>
          <p>
            Mit Ihrer Einwilligung in „Marketing“ messen wir, ob eine Google-Anzeige zu einer Anfrage geführt hat, und Google kann
            Ihnen auf anderen Websites Anzeigen von uns zeigen. Dafür setzt Google Cookies wie <code>_gcl_au</code>. Ohne diese
            Einwilligung wird nichts geladen.
          </p>
        </>
      )}

      {consentSections.has("besucher-einblicke") && <EinblickeAbschnitt />}

      <h2 id="ki-concierge">KI-Concierge</h2>
      <p>
        Der Concierge ist ein KI-System (Claude der Anthropic PBC, USA), kein Mensch (Hinweis nach Art. 50 KI-Verordnung). Er
        beantwortet Fragen zu Marken, Produkten, Showroom und Terminen. Antworten können Fehler enthalten; verbindlich sind nur
        Auskünfte unseres Teams.
      </p>
      <ul className={ul}>
        <li>
          <strong>Start nur mit Einwilligung:</strong> Vor der ersten Nachricht fragen wir Sie (Art. 6 Abs. 1 lit. a DSGVO). Ihre
          Eingaben und die Adresse der Seite gehen dann über unseren Server an die Anthropic PBC in den USA, damit das Modell
          antworten kann. In den USA besteht nicht in jedem Fall ein Datenschutzniveau wie in der EU. Ihre Einwilligung merkt sich
          Ihr Browser für 12 Stunden.
        </li>
        <li>
          <strong>Bitte keine persönlichen Daten</strong> wie Gesundheitsangaben, Ausweis- oder Kontonummern eingeben. Einen Namen
          brauchen wir nicht.
        </li>
        <li>
          <strong>Verlauf:</strong> Ohne Ihre eigene Zustimmung speichern wir den Verlauf nicht. Mit Zustimmung speichern wir ihn
          ohne IP-Adresse und löschen ihn nach {CONCIERGE_RETENTION_DAYS} Tagen. „Einwilligung widerrufen“ im Chat löscht einen
          gespeicherten Verlauf der Sitzung sofort.
        </li>
        <li>
          <strong>Schutz vor Missbrauch:</strong> Wir zählen Anfragen kurzzeitig je IP-Adresse (Art. 6 Abs. 1 lit. f DSGVO).
        </li>
      </ul>

      <h2 id="ki-assistenten">KI-Assistenten (MCP-Schnittstelle)</h2>
      <p>
        Über unsere Schnittstelle für KI-Assistenten (Seite <Link href="/de/ki-assistenten">KI-Assistenten</Link>) fragen Assistenten
        Katalog, Showroom und Arbeitsweise bei uns ab. Diese Anfragen enthalten keine Personendaten; ihren Inhalt speichern wir
        nicht. Zum Schutz vor Missbrauch zählen wir Anfragen je IP-Adresse für höchstens einen Tag (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      {appointmentLive ? (
        <p>
          <strong>Terminwunsch über einen Assistenten:</strong> Bitten Sie Ihren Assistenten um einen Termin, übergibt er Name,
          E-Mail, Telefon, Thema und Wunschzeiten an uns. Sie erhalten eine E-Mail mit Bestätigungslink ({confirmHours} Stunden
          gültig). Erst nach Ihrer Bestätigung sehen wir den Wunsch und behandeln ihn wie eine Beratungsanfrage (Abschnitt
          „Anfragen“). Ohne Bestätigung speichern wir nichts und geben nichts weiter.
        </p>
      ) : (
        <p>
          Terminwünsche nehmen wir über Assistenten nicht entgegen. Ihr Assistent erhält stattdessen den Link zu unserer
          Terminanfrage.
        </p>
      )}

      <h2 id="upload">Fotos, Videos und Pläne zu Ihrer Anfrage</h2>
      {accepting ? (
        <ul className={ul}>
          <li>
            <strong>Was:</strong> Nach einer Anfrage erhalten Sie einen persönlichen Link (auch als QR-Code), über den Sie Fotos,
            Videos und Pläne Ihres Raums vom Handy senden und eine Notiz ergänzen. Der Link nimmt {UPLOAD_CONFIG.tokenTtlDays} Tage
            lang Dateien an. Der Upload ist freiwillig; Ihre Anfrage gilt auch ohne.
          </li>
          <li>
            <strong>Rechtsgrundlage:</strong> Ihre Einwilligung vor dem ersten Upload (Art. 6 Abs. 1 lit. a DSGVO), jederzeit per
            E-Mail an <a href={EMAIL_HREF}>{EMAIL}</a> widerrufbar.
          </li>
          <li>
            <strong>Speicherung:</strong> Die Dateien liegen auf unserem Server, sind nicht öffentlich abrufbar und dienen nur Ihrer
            Anfrage. Bei JPEG-Fotos entfernen wir beim Hochladen die GPS-Standortdaten. Wir löschen die Dateien{" "}
            {UPLOAD_CONFIG.retentionDays} Tage nach Ablauf des Links, außer sie werden für einen Auftrag gebraucht.
          </li>
        </ul>
      ) : (
        <p>
          Fotos und Pläne zu Ihrer Anfrage nehmen wir derzeit per E-Mail entgegen. Sie werden wie Ihre Anfrage behandelt
          (Abschnitt „Anfragen“). Bitte senden Sie keine Aufnahmen von Personen ohne deren Einverständnis.
        </p>
      )}

      <h2 id="portal">Kundenportal und 3D-Raum</h2>
      <p>
        Das Kundenportal „Mein Platzhirsch“ stellt Kundinnen und Kunden die Unterlagen zu ihrem Projekt bereit und nimmt
        Rückmeldungen entgegen (Art. 6 Abs. 1 lit. b DSGVO; Sprachnachrichten nur mit Einwilligung). Die Anmeldung erfolgt ohne
        Passwort über einen E-Mail-Link, der {MAGIC_LINK_MINUTES} Minuten gilt; danach setzt das Portal das technisch nötige Cookie{" "}
        <code>ph_portal_session</code> ({SESSION_DAYS} Tage oder bis zur Abmeldung). Empfänger, Fristen und Einzelheiten stehen in der{" "}
        <Link href="/de/portal/datenschutz">Datenschutzinformation zum Kundenportal</Link>.
      </p>
      <p>
        <strong>3D-Raum aus einem Video:</strong> Mit eigener Einwilligung können Sie im Portal ein Video Ihres Raums hochladen. Wir
        erstellen daraus auf einem Rechner im Studio in Lochau einen 3D-Raum für die Planung, ohne fremde Cloud. Ortsangaben im
        Video entfernen wir, das Originalvideo löschen wir nach der Verarbeitung. 3D-Raum, Standbilder und Kommentare löschen wir{" "}
        {RAUM_CONFIG.retentionDays} Tage nach dem letzten Upload, außer sie werden für Ihren Auftrag gebraucht. Mit „Raum löschen“
        im Portal widerrufen Sie jederzeit; dann löschen wir sofort.
      </p>

      <TagebuchAbschnitt />

      <h2 id="planer">Online-Planer und Stil-Finder</h2>
      <ul className={ul}>
        <li>
          <strong>Küchen- und Sofaplaner:</strong> Ihre Planung entsteht im Browser. Der Sofaplaner merkt sich Entwurf und Merkliste
          im Speicher Ihres Browsers, eine von Ihnen ausgelöste Funktion. Speichern Sie eine Planung oder einen Teilen-Link, liegt
          sie auf unserem Server und wird nach höchstens 180 Tagen gelöscht. Wer einen Teilen-Link kennt, kann die Planung sehen;
          bitte keine persönlichen Daten als Plannamen.
        </li>
        <li>
          <strong>Anfrage aus einem Planer:</strong> Senden Sie uns eine Planung mit Ihren Kontaktdaten, gilt der Abschnitt
          „Anfragen“ (Art. 6 Abs. 1 lit. b DSGVO). Zum Schutz vor Missbrauch verarbeiten wir Ihre IP-Adresse nur gekürzt als Prüfwert
          und nur kurzzeitig.
        </li>
        <li>
          <strong>Moodboard als PDF (Stil-Finder):</strong> Ihre E-Mail-Adresse und freiwillige Angaben wie Name, Projektart und
          Region verwenden wir, um Ihnen das PDF zu senden (Versand siehe Abschnitt „E-Mail-Versand“). Eine
          Newsletter-Anmeldung ist davon getrennt und nur mit eigenem Häkchen möglich.
        </li>
      </ul>

      <IdeenboardAbschnitt />
      <WunschlisteAbschnitt />
      <ArAbschnitt />

      <h2 id="mailversand">E-Mail-Versand</h2>
      <p>
        Ihre Anfragen über die Formulare gibt unser Server nur an unser Backoffice weiter; dafür nutzen wir keinen
        E-Mail-Versanddienst. Automatisch versenden wir zwei Arten von E-Mails: den Anmeldelink zum Kundenportal und das
        Moodboard-PDF aus dem Stil-Finder, jeweils nur, wenn Sie sie anfordern.
      </p>
      <TerminMailsSatz />
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> Ihre E-Mail-Adresse und der Inhalt der E-Mail (Anmeldelink bzw. PDF, beim Moodboard auch ein
          freiwillig angegebener Name).
        </li>
        <li>
          <strong>Rechtsgrundlage:</strong> Ihre Anforderung (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Empfänger:</strong> Diese E-Mails versenden wir über den E-Mail-Versanddienst {MAIL_SERVICE.name}, der sie in
          unserem Auftrag zustellt. {MAIL_SERVICE.name} hat seinen Sitz in den USA; Ihre E-Mail-Adresse und der Inhalt der E-Mail
          werden dabei in die USA übermittelt.
        </li>
        <li data-transfer-basis={MAIL_SERVICE.lawFirmConfirmed ? "bestaetigt" : "entwurf"}>
          <strong>Übermittlung in die USA:</strong> {MAIL_SERVICE.transferBasis}
        </li>
        <li>
          <strong>Speicherdauer:</strong> Die Angaben aus dem Stil-Finder speichern wir nach dem Versand nicht. Für das Kundenportal
          gilt die <Link href="/de/portal/datenschutz">Datenschutzinformation zum Kundenportal</Link>.
        </li>
      </ul>

      <EmpfehlungAbschnitt />

      <h2 id="bewerbungen">Bewerbungen</h2>
      <p>
        Bewerbungen nehmen wir per E-Mail an <a href={EMAIL_HREF}>{EMAIL}</a> entgegen, für ausgeschriebene Stellen und
        initiativ.
      </p>
      <ul className={ul}>
        <li>
          <strong>Daten:</strong> die Angaben und Unterlagen, die Sie uns senden, etwa Name, Kontaktdaten, Anschreiben,
          Lebenslauf und Zeugnisse. Bitte senden Sie uns nur, was für die Stelle nötig ist.
        </li>
        <li>
          <strong>Zweck und Rechtsgrundlage:</strong> Prüfung Ihrer Bewerbung und Durchführung des Bewerbungsverfahrens, also die
          Anbahnung eines Arbeitsverhältnisses (Art. 6 Abs. 1 lit. b DSGVO).
        </li>
        <li>
          <strong>Empfänger:</strong> nur die Personen in unserem Haus, die über die Besetzung der Stelle entscheiden. An Dritte
          geben wir Ihre Bewerbung nicht weiter.
        </li>
        <li data-retention={APPLICATION_RETENTION.ownerConfirmed ? "bestaetigt" : "vorschlag"}>
          <strong>Speicherdauer:</strong> Kommt kein Arbeitsverhältnis zustande, löschen wir Ihre Unterlagen{" "}
          {APPLICATION_RETENTION.months} Monate nach Abschluss des Verfahrens. So lange brauchen wir sie, um uns gegen Ansprüche
          nach dem Gleichbehandlungsgesetz verteidigen zu können. Länger, etwa für künftige Stellen, bewahren wir sie nur mit Ihrer
          Einwilligung auf (Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit widerrufen können. Werden Sie bei uns angestellt,
          kommen die Unterlagen in Ihren Personalakt.
        </li>
      </ul>

      <h2 id="rechte">Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und
        Widerspruch sowie auf Widerruf erteilter Einwilligungen (Art. 15 bis 21 und Art. 7 Abs. 3 DSGVO). Schreiben Sie uns an{" "}
        <a href={EMAIL_HREF}>{EMAIL}</a> oder an die Postadresse oben. Wir antworten innerhalb eines Monats.
      </p>
      <p>
        Sie können sich außerdem bei einer Aufsichtsbehörde beschweren, in Österreich bei der Österreichischen
        Datenschutzbehörde, Barichgasse 40–42, 1030 Wien, <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a>,{" "}
        <a href="https://www.dsb.gv.at" rel="noopener noreferrer">
          www.dsb.gv.at
        </a>
        , oder bei der Behörde Ihres Wohnsitzlandes.
      </p>

      <h2 id="aenderungen">Änderungen</h2>
      <p>
        Wir passen diese Erklärung an, wenn wir neue Funktionen oder Dienste einsetzen oder sich die Rechtslage ändert. Es gilt die
        hier veröffentlichte Fassung.
      </p>
    </LegalProse>
  );
};

export default Datenschutz;
