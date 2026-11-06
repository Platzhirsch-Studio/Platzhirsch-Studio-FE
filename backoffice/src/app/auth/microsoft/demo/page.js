import { notFound } from "next/navigation";
import { DEMO_BENUTZER } from "@/lib/backoffice/auth/mockUsers";
import { CALLBACK_PFAD, DEMO_CLIENT_ID, demoAktiv } from "@/lib/backoffice/auth/microsoft";
import Knopf from "@/components/Backoffice/Knopf";

// Demo-„Microsoft“-Kontowahl des lokalen Test-Issuers (nur Mock-Modus). Nimmt dieselben Parameter wie der
// echte Autorisierungsendpunkt (client_id, redirect_uri, state, nonce, code_challenge S256) und leitet mit
// einem einmaligen Code (über /auth/microsoft/demo/autorisieren, echte Browser-Navigation) an
// /auth/microsoft/callback zurück. Gestaltung bewusst neutral.

export const metadata = { title: "Demo-Anmeldung (Microsoft)" };

const PARAM = ["client_id", "redirect_uri", "state", "nonce", "code_challenge", "code_challenge_method"];

export default async function DemoMicrosoftSeite({ searchParams }) {
  if (!demoAktiv()) notFound();
  const sp = await searchParams;
  const p = Object.fromEntries(PARAM.map((k) => [k, typeof sp?.[k] === "string" ? sp[k] : ""]));
  const gueltig = p.client_id === DEMO_CLIENT_ID && p.redirect_uri === CALLBACK_PFAD && p.state && p.nonce && p.code_challenge_method === "S256";
  const hint = typeof sp?.login_hint === "string" ? sp.login_hint : "";
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-bo-line bg-bo-surface p-6 shadow-bo sm:p-8">
        <p className="text-xs font-medium tracking-wide text-bo-text-soft uppercase">Demo · lokaler Test-Issuer</p>
        <h1 className="mt-1 text-lg font-semibold">Konto auswählen</h1>
        <p className="mt-1 text-sm text-bo-text-soft">Simuliert die Microsoft-Kontowahl. Es wird keine Verbindung zu Microsoft aufgebaut.</p>
        {!gueltig ? (
          <p role="alert" className="mt-4 text-sm text-bo-danger" data-testid="ms-demo-ungueltig">
            Ungültige Anfrage. Bitte die Anmeldung neu starten.
          </p>
        ) : (
          <form action="/auth/microsoft/demo/autorisieren" method="get" className="mt-5 space-y-4" data-testid="ms-demo">
            {PARAM.map((k) => (
              <input key={k} type="hidden" name={k} value={p[k]} />
            ))}
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-bo-text-soft">Demo-Konto</legend>
              <div className="grid max-h-72 gap-1 overflow-y-auto">
                {DEMO_BENUTZER.map((u, i) => (
                  <label key={u.email} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-bo px-2 text-sm hover:bg-bo-surface-2">
                    <input type="radio" name="email" value={u.email} defaultChecked={hint ? hint === u.email : i === 0} />
                    <span>
                      {u.name} <span className="text-bo-text-soft">· {u.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Knopf type="submit" variant="primary" size="l" className="w-full" data-testid="ms-demo-weiter">
              Weiter
            </Knopf>
            <Knopf type="submit" name="abbrechen" value="1" variant="ghost" size="m" className="w-full" data-testid="ms-demo-abbrechen">
              Abbrechen
            </Knopf>
          </form>
        )}
      </div>
    </main>
  );
}
