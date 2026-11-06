"use client";
// Einheitlicher Ablauf für Marketing-Aktionen im Client (MASTER Q-C2/Q-C3):
//   sofort(fn, { ok })              → Server Action, Toast „… gespeichert“, Seite neu laden
//   verzoegert(fn, { text, … })     → Server Action plant (planeCommit), Undo-Toast 8 s, danach ausführen + neu laden
// Fehler erscheinen dort, wo gearbeitet wurde (Toast „fehler“ bleibt bis geschlossen), nie als roher Text.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";

export default function useAktion() {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte, flush } = useVerzoegerterCommit();
  const [laeuft, setLaeuft] = useState(false);

  const sofort = useCallback(
    async (fn, { ok, unter, onOk, neuLaden = true } = {}) => {
      setLaeuft(true);
      let r;
      try {
        r = await fn();
      } catch {
        r = { ok: false, message: "Unerwarteter Fehler. Bitte erneut versuchen." };
      }
      setLaeuft(false);
      if (!r?.ok) {
        zeige(r?.message || "Nicht gespeichert.", { art: r?.code === "invalid" ? "warnung" : "fehler" });
        return r;
      }
      if (ok) zeige(typeof ok === "function" ? ok(r) : ok, { art: "ok", unter });
      if (neuLaden) router.refresh();
      onOk?.(r);
      return r;
    },
    [router, zeige]
  );

  const verzoegert = useCallback(
    async (fn, { text, gruppe, sammel, fehlerText, onVerworfen, onErfolg } = {}) => {
      setLaeuft(true);
      let r;
      try {
        r = await fn();
      } catch {
        r = { ok: false, message: "Unerwarteter Fehler. Bitte erneut versuchen." };
      }
      setLaeuft(false);
      if (!r?.ok) {
        zeige(r?.message || "Nicht ausgeführt.", { art: r?.code === "invalid" ? "warnung" : "fehler" });
        return r;
      }
      starte(typeof text === "function" ? text(r) : text, {
        token: r.token,
        ms: r.ms,
        objekt: r.objekt,
        gruppe,
        sammel,
        fehlerText,
        onErfolg: (e) => {
          onErfolg?.(e);
          router.refresh();
        },
        onVerworfen: () => {
          onVerworfen?.();
          router.refresh();
        },
        onFehler: () => {
          onVerworfen?.();
          router.refresh();
        },
      });
      return r;
    },
    [router, starte, zeige]
  );

  return { sofort, verzoegert, laeuft, zeige, flush, router };
}
