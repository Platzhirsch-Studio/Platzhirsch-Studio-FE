"use client";
// „Zu erledigen“ (Konzept § 5.1): Zeilen nach Fälligkeit, höchstens 8, dann „… und n weitere“ (aufklappbar).
// Inline-Aktionen je Zeile: Genehmigen · Ablehnen … (A), Bestätigung erhalten (A), Sichten (Sichtungsmodus),
// Ergebnis erfassen, Gehen nachtragen (Inline-Zeitfeld, B), Korrektur übernehmen, +60 Tage (A).
// Leer: „Alles erledigt“ mit ruhigem Häkchen.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Knopf from "../Knopf";
import Leer from "../Leer";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { buchungKorrigierenAction, korrekturEntscheidenAction, stelleVerlaengernAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { langDatum } from "@/lib/backoffice/personal/zeit";
import { AntragKnoepfe, KrankKnoepfe } from "./Abwesenheit";
import { InlineZeit } from "./Zeiten";
import "./personal.css";

const MAX = 8;

function Aktion({ z, heute, leitung, onErledigt }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [, start] = useTransition();
  if (z.art === "antrag") return <AntragKnoepfe antrag={z.antrag} entscheidbar={z.entscheidbar} onErledigt={onErledigt} kompakt />;
  if (z.art === "krank") return <KrankKnoepfe krank={{ name: z.krank.name, status: "Gemeldet" }} heute={heute} leitung={leitung} kompakt />;
  if (z.art === "gehen")
    return (
      <InlineZeit
        label={`${T.zeiten.spalten.gehen} ${langDatum(z.buchung.datum)}`}
        onSpeichern={async (w) => {
          const r = await buchungKorrigierenAction({ buchung: z.buchung.name, gehen: w });
          if (!r.ok) {
            zeige(r.message, { art: "fehler" });
            return r;
          }
          zeige(T.team.gespeichert, { art: "ok" });
          onErledigt(true);
          start(() => router.refresh());
          return r;
        }}
        testid={`per-zutun-gehen-${z.buchung.name}`}
      />
    );
  if (z.art === "korrektur")
    return (
      <span className="inline-flex gap-1.5">
        <Knopf
          size="s"
          variant="secondary"
          onClick={async () => {
            const r = await korrekturEntscheidenAction({ buchung: z.korrektur.name, bestaetigen: true });
            if (!r.ok) return zeige(r.message, { art: "fehler" });
            zeige(T.zeiten.korrekturBestaetigt, { art: "ok" });
            onErledigt(true);
            start(() => router.refresh());
          }}
        >
          {T.zeilen.knopf.uebernehmen}
        </Knopf>
        <Knopf
          size="s"
          variant="ghost"
          onClick={async () => {
            const r = await korrekturEntscheidenAction({ buchung: z.korrektur.name, bestaetigen: false });
            if (!r.ok) return zeige(r.message, { art: "fehler" });
            zeige(T.zeiten.korrekturAbgelehnt, { art: "ok" });
            onErledigt(true);
            start(() => router.refresh());
          }}
        >
          {T.zeilen.knopf.ablehnen.replace(" …", "")}
        </Knopf>
      </span>
    );
  if (z.art === "stelle")
    return (
      <Knopf
        size="s"
        variant="secondary"
        onClick={async () => {
          const r = await stelleVerlaengernAction({ name: z.stelle.name });
          if (!r.ok) return zeige(r.message, { art: "fehler" });
          onErledigt(true);
          starte(T.stellen.verlaengert(langDatum(r.bis)), { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: T.stellen.verlaengern, onVerworfen: () => onErledigt(false), onFehler: () => onErledigt(false), onErfolg: () => start(() => router.refresh()) });
        }}
        data-testid={`per-zutun-verlaengern-${z.stelle.name}`}
      >
        {z.knopf}
      </Knopf>
    );
  if (z.href)
    return (
      <Knopf size="s" variant={z.art === "sichten" ? "primary" : "secondary"} href={z.href} data-testid={`per-zutun-${z.art}`}>
        {z.knopf}
      </Knopf>
    );
  return null;
}

export default function ZuErledigen({ zeilen = [], heute, leitung = false }) {
  const [alle, setAlle] = useState(false);
  const [erledigt, setErledigt] = useState(() => new Set());
  const sichtbar = zeilen.filter((z) => !erledigt.has(z.id));
  const liste = alle ? sichtbar : sichtbar.slice(0, MAX);
  if (!sichtbar.length) return <Leer art="erledigt" groesse="karte" titel={T.uebersicht.allesErledigt} text="" testid="per-zutun-leer" />;
  return (
    <>
      <ul className="bo-per-zeilen" data-testid="per-zutun">
        {liste.map((z) => (
          <li key={z.id} className="bo-per-zeile" data-testid={`per-zutun-${z.id}`}>
            <span className="bo-per-zeile__icon" data-ton={z.ton} aria-hidden="true">
              <Icon name={z.icon} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="bo-per-zeile__titel">{z.titel}</span>
              {z.unter && (
                <span className="bo-per-zeile__unter" data-warn={z.warn ? "" : undefined}>
                  {z.unter}
                </span>
              )}
            </span>
            <span className="bo-per-zeile__aktionen">
              <Aktion
                z={z}
                heute={heute}
                leitung={leitung}
                onErledigt={(ja) =>
                  setErledigt((s) => {
                    const n = new Set(s);
                    if (ja) n.add(z.id);
                    else n.delete(z.id);
                    return n;
                  })
                }
              />
            </span>
          </li>
        ))}
      </ul>
      {sichtbar.length > MAX && (
        <button type="button" className="bo-per-link mt-3 ml-3 text-[14px]" onClick={() => setAlle((x) => !x)} aria-expanded={alle}>
          {alle ? T.bewerbung.ausblenden : T.uebersicht.weitere(sichtbar.length - MAX)}
        </button>
      )}
    </>
  );
}
