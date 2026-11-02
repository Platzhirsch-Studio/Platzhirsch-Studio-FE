import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/portal/dal";
import { IS_PRODUCTION, hasSessionSecret } from "@/lib/portal/config";
import { AuthPanel, Notice, PrimaryButton } from "@/components/Portal/Core/ui";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Anmelden",
  robots: { index: false, follow: false },
});

const ERRORS = {
  email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  zuviele: "Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut.",
  ungueltig: "Dieser Anmeldelink ist ungültig oder wurde bereits verwendet. Fordern Sie einfach einen neuen an.",
  abgelaufen: "Dieser Anmeldelink ist abgelaufen. Fordern Sie einfach einen neuen an.",
  technik: "Technischer Fehler. Bitte versuchen Sie es später erneut oder rufen Sie uns an: +43 5574 46255.",
};

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/de/portal");

  const available = hasSessionSecret();
  const error = available ? ERRORS[sp?.fehler] : null;
  const next = typeof sp?.next === "string" && /^\/de\/portal(\/[a-z0-9\-/]*)?$/i.test(sp.next) ? sp.next : "";

  return (
    <AuthPanel title="Anmelden">
      <p>Ihr persönlicher Bereich für Projekte, Termine und Dokumente. Wir senden Ihnen einen Anmeldelink per E-Mail – ganz ohne Passwort.</p>

      {sp?.abgemeldet && <Notice>Sie wurden abgemeldet.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {!available && (
        <Notice tone="error">
          Die Anmeldung ist gerade nicht verfügbar. Für Fragen zu Ihrem Projekt rufen Sie uns bitte an: <a href="tel:+43557446255" className="underline underline-offset-2">+43 5574 46255</a>.
        </Notice>
      )}

      {available && (
      <form action="/api/portal/auth/request" method="post" className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label htmlFor="portal-email" className="block text-sm font-semibold text-ink">
            E-Mail-Adresse
          </label>
          <input
            id="portal-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            aria-describedby="portal-email-hint"
            aria-invalid={sp?.fehler === "email" ? true : undefined}
            className="mt-1.5 block min-h-12 w-full border border-ink/25 bg-white px-4 text-base text-ink placeholder:text-ink/50 focus:border-ink focus:outline-2 focus:outline-offset-2 focus:outline-gold"
            placeholder="name@beispiel.at"
          />
          <p id="portal-email-hint" className="mt-1.5 text-xs text-ink/70">
            Die Adresse, die Sie bei uns im Studio hinterlegt haben.
          </p>
        </div>
        <PrimaryButton type="submit">Anmeldelink senden</PrimaryButton>
      </form>
      )}

      <p className="text-xs leading-relaxed text-ink/70">
        Wir verwenden Ihre E-Mail-Adresse ausschließlich, um Ihnen den Anmeldelink zu senden und Sie Ihrem Kundenkonto zuzuordnen.
        Nach der Anmeldung speichert ein technisch notwendiges Cookie Ihre Sitzung für 30 Tage. Details in unserer{" "}
        <Link href="/de/portal/datenschutz" className="py-1 underline underline-offset-2 hover:text-ink">
          Datenschutzerklärung
        </Link>
        .
      </p>

      {!IS_PRODUCTION && (
        <Notice tone="dev">
          <strong>Entwicklung:</strong> Demo-Adresse <code className="select-all">demo@kunde.example</code>. Es wird keine E-Mail
          versendet – der Link erscheint in der Server-Konsole und unter{" "}
          <Link href="/de/portal/login/dev" className="underline underline-offset-2">
            Dev-Postausgang
          </Link>
          .
        </Notice>
      )}
    </AuthPanel>
  );
}
