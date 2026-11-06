// Übersicht /personal (Konzept § 5.1, E9) – Server-Bausteine, je Kachel eigener Suspense-/Fehlerrand.
// „Zu erledigen“ zuerst, höchstens 4 Kennzahlen, „Heute im Haus“ ohne Uhrzeiten (Leitung/GF), Diagramm erst ab
// 20 Bewerbungen im Zeitraum, „Kürzlich“ ohne Inhalte aus permlevel 1.

import Link from "next/link";
import Kachel from "../Kachel";
import Kennzahl from "../Kennzahl";
import Fehler from "../Fehler";
import Avatar from "../Avatar";
import { Icon } from "../icons";
import { T } from "@/lib/backoffice/personal/texte";
import { sicher, ladeZuErledigen, ladeKennzahlen, ladeHeuteImHaus, ladeQuellen, ladeKuerzlich } from "@/lib/backoffice/personal/daten";
import { darfArtSehen, darfBewerbungen, istLeitung } from "@/lib/backoffice/personal/rollen";
import { artText } from "@/lib/backoffice/personal/status";
import { kurzDatum } from "@/lib/backoffice/personal/zeit";
import { relativ, datumZeit } from "@/lib/backoffice/format";
import ZuErledigen from "./ZuErledigen";
import "./personal.css";

function NichtGeladen({ titel, fehler, className }) {
  return (
    <Kachel titel={titel} className={className}>
      <Fehler code={fehler?.code || "unavailable"} kompakt />
    </Kachel>
  );
}

export async function ZuErledigenKachel({ ctx, className }) {
  const r = await sicher(() => ladeZuErledigen(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.zuErledigen} fehler={r.fehler} className={className} />;
  return (
    <Kachel className={className} titel={T.uebersicht.zuErledigen} unter={r.daten.length ? T.uebersicht.zuErledigenUnter : undefined} testid="per-zuerledigen">
      <ZuErledigen zeilen={r.daten} heute={ctx.heute} leitung={istLeitung(ctx.rolle)} />
    </Kachel>
  );
}

export async function KennzahlenReihe({ ctx }) {
  const r = await sicher(() => ladeKennzahlen(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.kennzahlen.stellen} fehler={r.fehler} className="md:col-span-12" />;
  const k = r.daten;
  const arten = k.abwesendArten ? Object.entries(k.abwesendArten).map(([a, n]) => `${n} ${artText(a)}`).join(" · ") : undefined;
  return (
    <>
      <Kennzahl className="md:col-span-3" titel={T.uebersicht.kennzahlen.stellen} wert={k.stellen} ton="salbei" zusatz={k.ohneEntgelt ? T.uebersicht.ohneEntgelt(k.ohneEntgelt) : undefined} href="/personal/stellen?status=Aktiv" testid="per-kz-stellen" />
      {darfBewerbungen(ctx.rolle) && <Kennzahl className="md:col-span-3" titel={T.uebersicht.kennzahlen.offeneBew} wert={k.offeneBew} ton="cognac" zusatz={k.aelteste ? T.uebersicht.aelteste(k.aelteste) : undefined} href="/personal/bewerbungen" testid="per-kz-bewerbungen" />}
      <Kennzahl className="md:col-span-3" titel={T.uebersicht.kennzahlen.abwesend} wert={k.abwesend} zusatz={arten} href="/personal/team" testid="per-kz-abwesend" />
      {istLeitung(ctx.rolle) && <Kennzahl className="md:col-span-3" titel={T.uebersicht.kennzahlen.loeschfrist} wert={k.loeschFaellig} zusatz={k.naechsteFrist ? T.uebersicht.naechsteFrist(k.naechsteFrist) : T.uebersicht.keineFrist} href="/personal/datenschutz" testid="per-kz-loeschfrist" />}
    </>
  );
}

export async function HeuteImHausKachel({ ctx, className }) {
  if (!darfArtSehen(ctx.rolle)) return null;
  const r = await sicher(() => ladeHeuteImHaus(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.heuteImHaus} fehler={r.fehler} className={className} />;
  const keiner = r.daten.every((p) => p.zustand === "keine" || p.zustand === "abwesend");
  return (
    <Kachel className={className} titel={T.uebersicht.heuteImHaus} unter={T.uebersicht.heuteImHausUnter} href="/personal/team" oeffnenLabel="Team öffnen" testid="per-heute-im-haus">
      {keiner && <p className="mb-3 text-[14px] text-bo-text-soft">{T.uebersicht.nochNiemand}</p>}
      <ul className="bo-per-haus">
        {r.daten.map((p) => (
          <li key={p.name}>
            <Avatar name={p.titel} groesse={32} />
            <span className="min-w-0">
              <Link href={`/personal/mitarbeiter/${encodeURIComponent(p.name)}`} className="bo-per-link block truncate text-[14px]">
                {p.titel}
              </Link>
              <span className="bo-per-haus__zustand">
                <span className="bo-per-haus__punkt" data-zustand={p.zustand} aria-hidden="true" />
                {p.zustand === "imHaus" ? T.uebersicht.imHaus : p.zustand === "abwesend" ? [p.art ? artText(p.art) : T.zeiten.abwesend, p.bis ? T.uebersicht.abwesendBis(kurzDatum(p.bis)) : null].filter(Boolean).join(" · ") : "–"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Kachel>
  );
}

export async function QuellenKachel({ ctx, className }) {
  if (!darfBewerbungen(ctx.rolle)) return null;
  const r = await sicher(() => ladeQuellen(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.quelle} fehler={r.fehler} className={className} />;
  const max = Math.max(1, ...r.daten.punkte.map((p) => p.wert));
  return (
    <Kachel className={className} titel={T.uebersicht.quelle} unter="Letzte 90 Tage" href="/personal/berichte/bewerbungsstatistik" oeffnenLabel={T.uebersicht.berichtOeffnen} testid="per-quellen">
      {r.daten.n < 20 ? (
        <p className="py-4 text-[14px] text-bo-text-soft">{T.uebersicht.zuWenig}</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label={T.uebersicht.quelle}>
          {r.daten.punkte.map((p, i) => (
            <li key={p.label} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-3 text-[14px]" aria-label={`${p.label}: ${p.wert}`}>
              <span className="truncate text-bo-text-soft">{p.label}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-bo-fill-2" aria-hidden="true">
                <span className="bo-wachsen-x block h-full rounded-full bg-bo-ink" style={{ width: `${(p.wert / max) * 100}%`, "--i": i }} />
              </span>
              <span className="bo-per-zahl text-right font-medium">{p.wert}</span>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export async function KuerzlichKachel({ ctx, className }) {
  const r = await sicher(() => ladeKuerzlich(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.kuerzlich} fehler={r.fehler} className={className} />;
  return (
    <Kachel className={className} titel={T.uebersicht.kuerzlich} testid="per-kuerzlich">
      {r.daten.length === 0 ? (
        <p className="py-6 text-[14px] text-bo-text-soft">{T.uebersicht.keineAktivitaet}</p>
      ) : (
        <ul className="bo-per-zeilen">
          {r.daten.map((z) => (
            <li key={z.id} className="bo-per-zeile">
              <Avatar name={z.wer || "–"} groesse={36} />
              <span className="min-w-0">
                <Link href={z.href} className="bo-per-zeile__titel bo-per-link block truncate">
                  {z.text}
                </Link>
                <span className="bo-per-zeile__unter">{z.wer}</span>
              </span>
              <time className="text-[13px] whitespace-nowrap text-bo-text-faint" dateTime={String(z.zeit).replace(" ", "T")} title={datumZeit(z.zeit)} suppressHydrationWarning>
                {relativ(z.zeit, ctx.jetzt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export function KachelSkelett({ className, hoehe = 240 }) {
  return <div className={`bo-kachel bo-skeleton ${className || ""}`} style={{ minHeight: hoehe }} aria-hidden="true" />;
}

export { Icon };
