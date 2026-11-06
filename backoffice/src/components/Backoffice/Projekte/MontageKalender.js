"use client";
// Montagekalender (10-konzept-projekte.md § 5.8) auf dem Fundament-Kalender (G-21): Montagen und Fremdgewerk-Termine,
// Ziehen/Umplanen nur für geplante Montagen (sofort + Rückgängig 8 s = alter Wert), danach Chip „Kunde nicht
// informiert“ als Toast-Hinweis mit Weg in die Mappe (§ 3.5). Öffnen = Montageauftrag.

import { useRouter } from "next/navigation";
import Kalender from "../Kalender/Kalender";
import Kanban from "../Kanban/Kanban";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { montageStatusAction, montageUmplanenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

const tt = (s) => `${s.slice(8, 10)}.${s.slice(5, 7)}. ${s.slice(11, 16)}`;

export function MontageKalender({ eintraege, datum, jetzt }) {
  const router = useRouter();
  const { zeige } = useToast();
  return (
    <Kalender
      eintraege={eintraege}
      startAnsicht="woche"
      startDatum={datum}
      jetzt={jetzt}
      von="07:00"
      bis="19:00"
      hoehe={620}
      label="Montagen"
      onOeffnen={(e) => e.href && router.push(e.href)}
      onVerschieben={async (e, neu) => {
        const r = await montageUmplanenAction({ name: e.id, start: neu.start, ende: neu.ende });
        if (!r?.ok) {
          zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
          return false;
        }
        zeige(TEXTE.montagen.umgeplant(tt(neu.start)), {
          art: "info",
          unter: TEXTE.montagen.kundeNichtInformiert,
          aktion: {
            titel: "Rückgängig",
            onClick: async () => {
              await montageUmplanenAction({ name: e.id, start: r.alt.start, ende: r.alt.ende });
              router.refresh();
            },
          },
        });
        router.refresh();
        return true;
      }}
    />
  );
}

/** Kanban „PH Montageaufträge“: Workflow als verzögerter Commit; „Abgenommen“ öffnet nur den Ablauf. */
export function MontageKanban({ spalten, uebergaenge, statusTon }) {
  const router = useRouter();
  const { starte } = useVerzoegerterCommit();
  return (
    <Kanban
      doctype="PH Montageauftrag"
      spalten={spalten}
      titelFeld="titel"
      kartenFelder={[{ fieldname: "termin", label: "Termin" }, { fieldname: "ort", label: "Ort" }, { fieldname: "montageleiter", label: "Montageleitung" }]}
      statusTon={statusTon}
      uebergaenge={uebergaenge}
      hrefBasis="/projekte/montagen"
      onVerschiebe={async ({ name, nach, action }) => {
        if (nach === "Abgenommen") {
          router.push(`/projekte/montagen/${encodeURIComponent(name)}?ablauf=abnahme`);
          return { ok: false, message: TEXTE.montage.abnahmeMitKunde };
        }
        const r = await montageStatusAction({ name, aktion: action });
        if (!r?.ok) return r || { ok: false };
        starte(`${action} · ${name}`, { token: r.token, ms: r.ms, objekt: r.objekt, onFehler: () => router.refresh(), onVerworfen: () => router.refresh() });
        return { ok: true };
      }}
    />
  );
}
