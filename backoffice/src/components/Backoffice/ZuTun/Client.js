"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { ZUTUN } from "./texte";

/** „Erneut“ in einer fehlgeschlagenen Zu-tun-Zeile: lädt die Seite neu (nur diese Quelle zählt erneut). */
export function ErneutKnopf() {
  const router = useRouter();
  const [laedt, start] = useTransition();
  return (
    <Knopf size="s" variant="ghost" icon="RefreshCw" laedt={laedt} onClick={() => start(() => router.refresh())}>
      {ZUTUN.erneut}
    </Knopf>
  );
}

/**
 * Knopf einer Zu-tun-Zeile mit Server Action (statt Link): ruft `action({ id })` auf, Rückgabe
 * `{ ok, message }` (Q-A2), zeigt die Meldung und lädt danach neu. Die Action hat ihren Mock-Pfad selbst.
 * @param {{titel:string, id:string, action:(p:{id:string})=>Promise<{ok:boolean, message?:string}>}} p
 */
export function ZuTunAktion({ titel, id, action }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [laedt, start] = useTransition();
  return (
    <Knopf
      size="s"
      variant="secondary"
      laedt={laedt}
      onClick={() =>
        start(async () => {
          try {
            const r = await action({ id });
            zeige(r?.message || (r?.ok ? titel : ZUTUN.aktionFehler), { art: r?.ok ? "ok" : "fehler" });
            if (r?.ok) router.refresh();
          } catch {
            zeige(ZUTUN.aktionFehler, { art: "fehler" });
          }
        })
      }
    >
      {titel}
    </Knopf>
  );
}
