"use client";
import { useActionState } from "react";
import { anmeldenAction } from "@/lib/backoffice/actions";
import Knopf from "@/components/Backoffice/Knopf";
import { Icon } from "@/components/Backoffice/icons";

export default function LoginForm({ next, demo }) {
  const [state, action, pending] = useActionState(anmeldenAction, null);
  const zweiterSchritt = state?.code === "verification";
  return (
    <form action={action} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state && !state.ok && state.code !== "verification" && (
        <p role="alert" className="rounded-bo border border-bo-danger/40 bg-bo-danger-soft px-3 py-2 text-sm" data-testid="login-fehler">
          {state.message}
        </p>
      )}
      {zweiterSchritt ? (
        <>
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="tmpId" value={state.tmpId} />
          <p className="text-sm text-bo-text-soft">{state.message}</p>
          <div>
            <label htmlFor="otp" className="mb-1 block text-xs font-medium text-bo-text-soft">
              Bestätigungscode
            </label>
            <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" required maxLength={8} className="bo-input min-h-12 text-lg tracking-widest" autoFocus />
          </div>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-bo-text-soft">
              E-Mail
            </label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} className="bo-input min-h-12" placeholder="name@platzhirsch.studio" defaultValue={demo ? "gf@demo.local" : ""} />
          </div>
          <div>
            <label htmlFor="passwort" className="mb-1 block text-xs font-medium text-bo-text-soft">
              Passwort
            </label>
            <input id="passwort" name="passwort" type="password" autoComplete="current-password" required className="bo-input min-h-12" />
          </div>
        </>
      )}
      <Knopf type="submit" variant="primary" size="l" className="group w-full" disabled={pending} laedt={pending} data-testid="login-senden">
        {pending ? "Bitte warten …" : zweiterSchritt ? "Code bestätigen" : "Anmelden"}
        {!pending && <Icon name="ArrowRight" className="size-4 transition-transform duration-[120ms] group-hover:translate-x-0.5" />}
      </Knopf>
    </form>
  );
}
