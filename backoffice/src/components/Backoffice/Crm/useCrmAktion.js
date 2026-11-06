"use client";
// Gemeinsamer Ablauf für CRM-Aktionen im Client (§ 2.4): Server Action aufrufen, Ergebnis rückmelden.
//   token     → verzögerter Commit mit „Rückgängig“ (useVerzoegerterCommit, 8 s / Mail 10 s)
//   undoToken → Mock: wirkt sofort, Toast mit „Rückgängig“ (rueckgaengigAction)
//   ok        → Toast „ok“
//   Fehler    → Fehler-Toast mit Satz (nie Code)
// Danach router.refresh(), damit Server-Listen den neuen Stand zeigen.

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { rueckgaengigAction } from "@/lib/backoffice/crm/actions";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";

export function useCrmAktion() {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte, flush } = useVerzoegerterCommit();
  const [laeuft, start] = useTransition();

  const melde = useCallback(
    (r, { text, fehlerText, objekt, onFertig, onZurueck } = {}) => {
      if (!r) return r;
      if (!r.ok && !r.ergebnisse) {
        zeige(fehlerText ? T.toast.fehler(fehlerText, r.message || T.fehler.unbekannt) : r.message || T.fehler.unbekannt, { art: "fehler" });
        return r;
      }
      const teile = r.ergebnisse || [r];
      const ok = teile.filter((x) => x.ok);
      for (const x of ok) {
        if (x.token) {
          starte(typeof text === "function" ? text(ok.length) : text, {
            token: x.token, ms: x.ms, objekt: x.objekt || objekt, gruppe: fehlerText, sammel: typeof text === "function" ? text : undefined, fehlerText,
            onErfolg: () => router.refresh(), onVerworfen: () => (onZurueck?.(), router.refresh()), onFehler: () => (onZurueck?.(), router.refresh()),
          });
        }
      }
      const sofort = ok.filter((x) => x.undoToken);
      if (sofort.length) {
        const tokens = sofort.map((x) => x.undoToken);
        zeige(typeof text === "function" ? text(sofort.length) : text, {
          art: "ok",
          dauer: 8000,
          aktion: {
            titel: "Rückgängig",
            onClick: async () => {
              for (const undoToken of tokens) await rueckgaengigAction({ undoToken });
              onZurueck?.();
              router.refresh();
            },
          },
        });
      } else if (ok.length && !ok.some((x) => x.token) && text) {
        zeige(typeof text === "function" ? text(ok.length) : text, { art: "ok" });
      }
      const fehl = teile.filter((x) => !x.ok);
      if (fehl.length) zeige(`${fehl.length} nicht möglich – ${fehl[0].message || T.fehler.unbekannt}`, { art: "fehler" });
      onFertig?.(r);
      router.refresh();
      return r;
    },
    [router, starte, zeige]
  );

  /** führe(() => action(args), { text, fehlerText, objekt }) */
  const fuehre = useCallback(
    (aufruf, opts = {}) =>
      new Promise((resolve) => {
        start(async () => {
          try {
            if (opts.objekt) await flush(opts.objekt);
            const r = await aufruf();
            resolve(melde(r, opts));
          } catch {
            zeige(T.fehler.unavailable, { art: "fehler" });
            resolve({ ok: false, code: "unavailable" });
          }
        });
      }),
    [flush, melde, zeige]
  );

  return { fuehre, laeuft, zeige, router };
}

export default useCrmAktion;
