"use client";
// Terminkalender (§ 3.6) auf dem Fundament-Kalender (role="grid", Woche/Monat/Tag, Ziehen = Verschieben mit
// Slot-Prüfung, Tastatur, Kollisionen als Text). Datum und Ansicht stehen in der URL; Klick öffnet die Termin-Akte,
// Klick in eine freie Zelle öffnet den Assistenten „Termin anlegen“.

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Kalender } from "../Kalender";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { useCrmAktion } from "./useCrmAktion";
import { terminVerschiebenAction } from "@/lib/backoffice/crm/actions";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";

export default function TerminKalender({ eintraege = [], datum, ansicht = "woche", berater = [], ich }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const { fuehre } = useCrmAktion();
  const [neu, setNeu] = useState(false);
  const setze = (k, v) => {
    const q = new URLSearchParams(sp?.toString() || "");
    q.set(k, v);
    router.replace(`${pfad}?${q}`, { scroll: false });
  };
  return (
    <>
      <Kalender
        eintraege={eintraege}
        quellen={["termin"]}
        datum={datum}
        onDatum={(d) => setze("datum", d)}
        ansicht={ansicht}
        onAnsicht={(a) => setze("kal", a)}
        von="08:00"
        bis="19:00"
        hoehe={680}
        label={T.seiten.termine}
        onOeffnen={(e) => e?.href && router.push(e.href)}
        onNeu={() => setNeu(true)}
        onVerschieben={async (e, z) => {
          const r = await fuehre(() => terminVerschiebenAction({ name: e.id, start: z.start.length === 16 ? `${z.start}:00` : z.start }), { text: T.toast.verschoben(z.start.slice(11, 16)), fehlerText: T.knopf.verschieben, objekt: { doctype: "PH Termin", name: e.id } });
          if (!r?.ok) throw new Error(r?.message || T.fehler.slot);
          return r;
        }}
        testid="crm-kalender"
      />
      {neu && <TerminAnlegenDialog offen onSchliessen={() => setNeu(false)} berater={berater} ich={ich} />}
    </>
  );
}
