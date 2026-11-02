import Link from "next/link";
import { IS_PRODUCTION, SESSION_COOKIE } from "@/lib/portal/config";
import {
  ACCOUNT_RETENTION,
  FEEDBACK_RETENTION,
  MAGIC_LINK_MINUTES,
  OWNER_CONFIRMED,
  RECIPIENTS,
  SESSION_DAYS,
  VOICE_RETENTION,
} from "@/lib/portal/privacy";
import { Card, Notice } from "@/components/Portal/Core/ui";
import { portalMetadata } from "@/lib/portal/metadata";

// /de/portal/datenschutz – information under Art. 13 GDPR for the customer
// portal. Public (no login): every portal form links here, also the login.
// Retention periods and recipients come from @/lib/portal/privacy.

export const generateMetadata = portalMetadata({
  title: "Datenschutz im Kundenportal",
  robots: { index: false, follow: false },
});

const link = "py-1 text-ink underline underline-offset-2 hover:text-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="border-t border-ink/10 pt-6 first:border-t-0 first:pt-0">
      <h2 id={id} className="font-display text-xl text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink/85">{children}</div>
    </section>
  );
}

export default function PortalPrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">Rechtliches</p>
      <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">Datenschutz im Kundenportal</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
        Informationen nach Art. 13 DSGVO zum Kundenportal „Mein Platzhirsch“. Sie ergänzen unsere allgemeine{" "}
        <Link href="/de/datenschutz" className={link}>
          Datenschutzerklärung
        </Link>
        .
      </p>

      {!OWNER_CONFIRMED && !IS_PRODUCTION && (
        <div className="mt-5">
          <Notice tone="dev">
            <strong>Entwicklung:</strong> Speicherfristen und Empfänger sind ein Vorschlag des Entwicklers (src/lib/portal/privacy.js); die Bestätigung durch das Unternehmen steht aus.
          </Notice>
        </div>
      )}

      <Card as="div" className="mt-6 space-y-6 sm:mt-8">
        <Section id="ds-verantwortlich" title="Verantwortlicher">
          <p>
            MW Immobilienverwaltungs GmbH, Platzhirsch Home Living
            <br />
            Landstraße 11, 6911 Lochau, Österreich
            <br />
            E-Mail:{" "}
            <a href="mailto:info@platzhirsch.studio" className={link}>
              info@platzhirsch.studio
            </a>{" "}
            · Telefon:{" "}
            <a href="tel:+43557446255" className={link}>
              +43 5574 46255
            </a>
          </p>
        </Section>

        <Section id="ds-zweck" title="Zweck und Rechtsgrundlagen">
          <p>
            Über das Kundenportal stellen wir Ihnen die Unterlagen zu Ihrem Auftrag bereit (Projekte, Planungen, Angebote, Auftragsbestätigungen, Lieferscheine, Rechnungen,
            Termine, Produktpässe, Gewerke) und nehmen Ihre Rückmeldungen und Anfragen entgegen.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Vertrag und vorvertragliche Maßnahmen</strong> (Art. 6 Abs. 1 lit. b DSGVO): Anmeldung, Anzeige Ihrer Projektdaten, Kommentare, Markierungen in
              Planungen, Bewertungen, Freigaben, Nachrichten, Termin-, Service- und Planungsanfragen.
            </li>
            <li>
              <strong>Einwilligung</strong> (Art. 6 Abs. 1 lit. a DSGVO): Sprachnachrichten. Sie können die Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen,
              z. B. per E-Mail an info@platzhirsch.studio.
            </li>
            <li>
              <strong>Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f DSGVO): Schutz des Portals vor Missbrauch, z. B. eine kurzzeitige Begrenzung der
              Anmeldeversuche pro IP-Adresse und E-Mail-Adresse (nur im Arbeitsspeicher des Servers, nicht dauerhaft gespeichert).
            </li>
          </ul>
        </Section>

        <Section id="ds-anmeldung" title="Anmeldung per E-Mail-Link">
          <p>
            Sie melden sich ohne Passwort an: Wir senden einen Anmeldelink an die E-Mail-Adresse, die Sie bei uns hinterlegt haben. Der Link ist {MAGIC_LINK_MINUTES} Minuten
            gültig und funktioniert nur einmal. Gespeichert werden dafür nur ein Prüfwert des Links (kein Klartext), Ihre Kundennummer und der Ablaufzeitpunkt; abgelaufene und
            verwendete Einträge werden bei der nächsten Anmeldung entfernt. Ist eine Adresse nicht bei uns hinterlegt, wird kein Link erzeugt.
          </p>
        </Section>

        <Section id="ds-cookie" title="Cookie für Ihre Sitzung">
          <p>
            Nach der Anmeldung setzen wir das Cookie <code className="bg-bone px-1.5 py-0.5 text-sm">{SESSION_COOKIE}</code>. Es enthält eine signierte
            Sitzungskennung und Ihre Kundennummer, ist für Skripte nicht lesbar (HttpOnly), wird nur über HTTPS übertragen und läuft nach {SESSION_DAYS} Tagen ab oder
            wenn Sie sich abmelden. Das Cookie ist technisch notwendig, damit nur Sie Ihre Daten sehen; dafür ist keine Einwilligung erforderlich (§ 165 Abs. 3 TKG
            2021, § 25 Abs. 2 TDDDG). Im Portal setzen wir keine Analyse- oder Marketing-Cookies.
          </p>
        </Section>

        <Section id="ds-speicherdauer" title="Speicherdauer">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Portalkonto und Projektdaten: {ACCOUNT_RETENTION}.</li>
            <li>Kommentare, Markierungen, Bewertungen, Freigaben und Nachrichten: {FEEDBACK_RETENTION}.</li>
            <li>Sprachnachrichten: Löschung {VOICE_RETENTION}, früher auf Ihren Wunsch oder bei Widerruf der Einwilligung.</li>
            <li>Rechnungen und andere Buchhaltungsbelege: gesetzliche Aufbewahrungsfrist (in Österreich 7 Jahre, § 132 BAO).</li>
            <li>Anmeldelinks: bis zum Ablauf nach {MAGIC_LINK_MINUTES} Minuten bzw. bis zur Verwendung; Sitzungscookie: {SESSION_DAYS} Tage.</li>
          </ul>
        </Section>

        <Section id="ds-empfaenger" title="Empfänger">
          <ul className="list-disc space-y-1.5 pl-5">
            {RECIPIENTS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>
            Wir setzen nur Dienstleister ein, die Daten in der EU bzw. im EWR verarbeiten oder geeignete Garantien nach Art. 44 ff. DSGVO bieten. Eine automatisierte
            Entscheidungsfindung einschließlich Profiling findet nicht statt.
          </p>
        </Section>

        <Section id="ds-ki" title="Visualisierungen mit KI">
          <p>
            Einzelne Planungsbilder erstellen oder bearbeiten wir mit KI. Sie sind im Portal als „KI-generiert“ gekennzeichnet (Art. 50 KI-Verordnung) und nicht
            maßstäblich.
          </p>
        </Section>

        <Section id="ds-rechte" title="Ihre Rechte">
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit
            (Art. 20) und Widerspruch (Art. 21 DSGVO). Die Daten Ihrer Produktpässe können Sie im Portal jederzeit maschinenlesbar herunterladen (JSON). Für alle
            anderen Anliegen genügt eine E-Mail an{" "}
            <a href="mailto:info@platzhirsch.studio" className={link}>
              info@platzhirsch.studio
            </a>
            .
          </p>
          <p>
            Sie können sich bei einer Aufsichtsbehörde beschweren, in Österreich bei der Datenschutzbehörde, Barichgasse 40–42, 1030 Wien,{" "}
            <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className={link}>
              www.dsb.gv.at
            </a>
            .
          </p>
          <p>
            Die Nutzung des Portals ist freiwillig. Ohne hinterlegte E-Mail-Adresse ist keine Anmeldung möglich; Ihre Unterlagen erhalten Sie dann auf dem gewohnten Weg.
          </p>
        </Section>
      </Card>

      <p className="mt-6 text-sm">
        <Link href="/de/portal" className={link}>
          Zum Kundenportal
        </Link>
      </p>
    </div>
  );
}
