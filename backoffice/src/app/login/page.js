import { redirect } from "next/navigation";
import { getSession } from "@/lib/backoffice/auth/dal";
import { backofficeMode, hasSessionSecret } from "@/lib/backoffice/config";
import { demoZugaenge } from "@/lib/backoffice/auth/login";
import { MS_FEHLER, loginArten, microsoftAbmeldeUrl, microsoftVerfuegbar, notfallAdmins } from "@/lib/backoffice/auth/microsoft";
import LoginForm from "./LoginForm";
import MicrosoftKnopf from "./MicrosoftKnopf";
import { rollenLabel } from "@/lib/backoffice/labels";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await getSession()) redirect("/");
  const verfuegbar = hasSessionSecret();
  const modus = backofficeMode();
  const next = typeof sp?.next === "string" && /^\/[a-z0-9\-/?=&%._]*$/i.test(sp.next) ? sp.next : "";
  // Anmeldearten in Anzeigereihenfolge (BACKOFFICE_LOGIN_ARTEN); ohne "passwort" nur Notfall-Zugang für Admins.
  const arten = loginArten();
  const notfall = !arten.includes("passwort") && notfallAdmins().length > 0;
  const msFehler = typeof sp?.ms_fehler === "string" && Object.hasOwn(MS_FEHLER, sp.ms_fehler) ? MS_FEHLER[sp.ms_fehler] : null;
  const msAbmelden = sp?.abgemeldet ? await microsoftAbmeldeUrl() : null;
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <p className="bo-wortmarke mb-8 text-center text-lg">PLATZHIRSCH</p>
        <div className="rounded-2xl border border-bo-line bg-bo-surface p-6 shadow-bo sm:p-8">
          <h1 className="text-lg font-semibold">Backoffice</h1>
          <p className="mt-1 text-sm text-bo-text-soft">Interner Bereich. Bitte mit dem Backoffice-Konto anmelden.</p>
          {sp?.abgemeldet && (
            <p role="status" className="mt-3 rounded-bo bg-bo-surface-3 px-3 py-2 text-sm">
              Abgemeldet.
            </p>
          )}
          {sp?.abgelaufen && (
            <p role="status" className="mt-3 rounded-bo bg-bo-surface-3 px-3 py-2 text-sm">
              Die Sitzung ist abgelaufen. Bitte neu anmelden.
            </p>
          )}
          {msAbmelden && (
            <p className="mt-2 text-sm">
              <a href={msAbmelden} className="underline underline-offset-2" data-testid="ms-abmelden">
                Auch bei Microsoft abmelden
              </a>
            </p>
          )}
          {msFehler && (
            <p role="alert" className="mt-3 rounded-bo border border-bo-danger/40 bg-bo-danger-soft px-3 py-2 text-sm" data-testid="ms-fehler">
              {msFehler}
            </p>
          )}
          {!verfuegbar ? (
            <p role="alert" className="mt-4 text-sm text-bo-danger">
              Die Anmeldung ist nicht verfügbar: Sitzungs-Secret fehlt (BACKOFFICE_SESSION_SECRET).
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {arten.map((art, i) => (
                <div key={art}>
                  {i > 0 && (
                    <p className="mb-5 flex items-center gap-3 text-xs text-bo-text-soft" aria-hidden="true">
                      <span className="h-px flex-1 bg-bo-line" />
                      oder
                      <span className="h-px flex-1 bg-bo-line" />
                    </p>
                  )}
                  {art === "microsoft" ? (
                    <MicrosoftKnopf next={next} demo={modus === "mock"} verfuegbar={microsoftVerfuegbar({ modus })} primaer={i === 0} />
                  ) : (
                    <LoginForm next={next} demo={modus === "mock"} />
                  )}
                </div>
              ))}
              {notfall && (
                <details className="rounded-bo border border-bo-line p-3 text-sm" data-testid="login-notfall">
                  <summary className="cursor-pointer text-xs font-medium text-bo-text-soft">Notfall-Anmeldung mit Passwort (nur Admins)</summary>
                  <div className="mt-3">
                    <LoginForm next={next} demo={false} />
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
        {modus === "mock" && (
          <details className="mt-4 rounded-bo border border-bo-line bg-bo-surface-2 p-3 text-xs text-bo-text-soft">
            <summary className="cursor-pointer font-medium">Demo-Zugänge (Testmodus)</summary>
            <p className="mt-2">Passwort für alle: <code>demo</code> (bzw. BACKOFFICE_MOCK_PASSWORD). „Mit Microsoft anmelden (Demo)“ nutzt dieselben Konten über einen lokalen Test-Issuer.</p>
            <ul className="mt-2 grid gap-0.5">
              {demoZugaenge().map((u) => (
                <li key={u.email}>
                  <code>{u.email}</code> – {u.roles.map(rollenLabel).join(", ")}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </main>
  );
}
