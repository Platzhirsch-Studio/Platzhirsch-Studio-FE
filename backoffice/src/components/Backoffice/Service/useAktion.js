"use client";
// Ausführen einer Service-Action mit Rückmeldung: Fehler als Toast, Erfolg als Toast oder – wenn die Action
// einen verzögerten Commit geplant hat – als Undo-Toast (8 s, „Rückgängig“). Danach router.refresh().
import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";

export function useAktion() {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [laeuft, start] = useTransition();

  const ausfuehren = useCallback(
    (fn, args, { ok, fehlerText, onOk, onFehler, ohneRefresh = false } = {}) =>
      new Promise((resolve) => {
        start(async () => {
          let r;
          try {
            r = await fn(args);
          } catch {
            r = { ok: false, code: "unavailable", message: "Verbindung unterbrochen – bitte erneut versuchen." };
          }
          if (!r?.ok) {
            if (!r?.fehler || !Object.keys(r.fehler).length) zeige(fehlerText ? `${fehlerText} – ${r?.message || ""}` : r?.message || "Das hat nicht geklappt.", { art: "fehler" });
            onFehler?.(r);
            resolve(r);
            return;
          }
          const geplant = r.verzoegert ? [r] : (r.ergebnisse || []).filter((e) => e.ok && e.verzoegert);
          if (geplant.length) {
            const text = typeof ok === "function" ? ok(r) : ok;
            starte(text || "Wird ausgeführt", { tokens: geplant.map((g) => g.token), token: geplant[0].token, ms: geplant[0].ms, objekt: geplant[0].objekt, onErfolg: () => router.refresh(), onVerworfen: () => router.refresh(), onFehler: () => router.refresh(), fehlerText });
          } else if (ok) {
            zeige(typeof ok === "function" ? ok(r) : ok, { art: "ok" });
          }
          const nicht = (r.ergebnisse || []).filter((e) => !e.ok);
          if (nicht.length) zeige(`${nicht.length} nicht ausgeführt: ${nicht[0].message || ""}`, { art: "warnung" });
          onOk?.(r);
          if (!ohneRefresh) router.refresh();
          resolve(r);
        });
      }),
    [router, starte, zeige]
  );

  return { ausfuehren, laeuft };
}
