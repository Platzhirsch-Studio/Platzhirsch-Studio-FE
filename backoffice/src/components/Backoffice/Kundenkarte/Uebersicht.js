import Link from "next/link";
import cx from "../cx";
import Kachel from "../Kachel";
import Kennzahl from "../Kennzahl";
import Leer from "../Leer";
import { Icon } from "../icons";
import { Balken } from "../Charts";
import Fehler from "../Fehler";
import StatusBadge from "../StatusBadge";
import Avatar from "../Avatar";
import { stufenStil } from "./StufenKennzeichen";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import { ANTRAG_STATUS, EINLOESUNG_STATUS, KARTE_STATUS, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { ladeEinrichtung, ladeUebersicht, ladeZuTun, ladeZuletzt, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import "./kundenkarte.css";

// Übersicht /kundenkarte (Konzept §3.1) – Server-Bausteine, je Kachel eigener Suspense-Rand (Seite).

function NichtGeladen({ titel, fehler, className }) {
  return (
    <Kachel titel={titel} className={className}>
      <Fehler code={fehler?.code || "unavailable"} kompakt />
    </Kachel>
  );
}

/** Heute-Leiste: Arbeitszähler als Pillen; 0 = gedämpft, nicht klickbar. */
export function HeuteLeiste({ heute }) {
  const chips = [
    { id: "antraege", titel: T.uebersicht.chipAntraege, n: heute.zuEntscheiden, href: "/kundenkarte/antraege?reiter=entscheiden" },
    { id: "geburtstage", titel: T.uebersicht.chipGeburtstage, n: heute.geburtstage, href: "/?zutun=mir" },
    { id: "einloesungen", titel: T.uebersicht.chipEinloesungen, n: heute.einlHeute, href: "/kundenkarte/einloesungen?zeitraum=1" },
  ];
  return (
    <nav className="bo-kk-heute" aria-label={T.uebersicht.heute} data-testid="kk-heute">
      <span className="mr-1 text-[13px] font-medium text-bo-text-soft">{T.uebersicht.heute}</span>
      {chips.map((c) =>
        c.n > 0 ? (
          <Link key={c.id} href={c.href} className="bo-kk-heute__chip" data-testid={`kk-heute-${c.id}`}>
            {c.titel}
            <span className="bo-kk-heute__n">{c.n}</span>
          </Link>
        ) : (
          <span key={c.id} className="bo-kk-heute__chip" aria-disabled="true" data-testid={`kk-heute-${c.id}`}>
            {c.titel}
            <span className="bo-kk-heute__n">0</span>
          </span>
        )
      )}
    </nav>
  );
}

export async function UebersichtKennzahlen({ ctx }) {
  const r = await sicher(() => ladeUebersicht(ctx));
  if (!r.ok) {
    return (
      <>
        <NichtGeladen titel={T.uebersicht.aktive} fehler={r.fehler} className="md:col-span-12" />
      </>
    );
  }
  const d = r.daten;
  return (
    <>
      <div className="md:col-span-12">
        <HeuteLeiste heute={d.heute} />
      </div>
      <Kennzahl className="md:col-span-4" titel={T.uebersicht.aktive} wert={d.kennzahlen.aktive} href="/kundenkarte/karten?status=Aktiv" testid="kk-kz-aktive" />
      <Kennzahl className="md:col-span-4" titel={T.uebersicht.neue30} wert={d.kennzahlen.neue30} href="/kundenkarte/karten" testid="kk-kz-neue" />
      <Kennzahl className="md:col-span-4" titel={T.uebersicht.einl30} wert={d.kennzahlen.einl30} zusatz={d.kennzahlen.storniert30 ? T.uebersicht.davonStorniert(d.kennzahlen.storniert30) : undefined} href="/kundenkarte/einloesungen" testid="kk-kz-einl" />
      {!d.leer && (
        <Kachel className="md:col-span-5" titel={T.uebersicht.jeStufe} unter={T.uebersicht.jeStufeUnter} href="/kundenkarte/stufen" oeffnenLabel="Stufen & Vorteile öffnen" testid="kk-je-stufe">
          <StufenBalken punkte={d.jeStufe} />
        </Kachel>
      )}
      {!d.leer && <Balken className="md:col-span-7" titel={T.uebersicht.jeMonat} untertitel={T.uebersicht.jeMonatUnter} punkte={d.jeMonat} hervorheben={d.jeMonat.length - 2} laufend="letzter" einblenden testid="kk-je-monat" />}
    </>
  );
}

export function StufenBalken({ punkte = [] }) {
  const max = Math.max(1, ...punkte.map((p) => p.wert));
  return (
    <ul className="bo-kk-stufenbalken" aria-label={T.uebersicht.jeStufe}>
      {punkte.map((p, i) => (
        <li key={p.label} className="bo-kk-stufenbalken__zeile" aria-label={`${p.label}: ${p.wert}`}>
          <span className="flex min-w-0 items-center gap-2 font-medium text-bo-text">
            <span aria-hidden="true" className="inline-block size-2.5 flex-none rounded-full" style={{ background: p.farbe || "var(--color-bo-ink)" }} />
            <span className="truncate">{p.label}</span>
          </span>
          <span className="bo-kk-stufenbalken__spur" aria-hidden="true">
            <span className="bo-kk-stufenbalken__wert" style={{ ...stufenStil(p.farbe), width: `${Math.max(2, (p.wert / max) * 100)}%`, "--i": i }} />
          </span>
          <span className="bo-kk-stufenbalken__n">{p.wert}</span>
        </li>
      ))}
    </ul>
  );
}

export async function ZuTunKachel({ ctx, className }) {
  const r = await sicher(() => ladeZuTun(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.zutun} fehler={r.fehler} className={className} />;
  return (
    <Kachel className={className} titel={T.uebersicht.zutun} unter={T.uebersicht.zutunUnter} testid="kk-zutun">
      {r.daten.length === 0 ? (
        <Leer art="erledigt" groesse="karte" titel={T.uebersicht.zutunLeer} text="" />
      ) : (
        <ul className="bo-kk-zeilen">
          {r.daten.map((z) => (
            <li key={z.id} className="bo-kk-zeile">
              <span className="bo-kk-zeile__icon" data-ton={z.ton} aria-hidden="true">
                <Icon name={z.icon} className="size-4" />
              </span>
              <span className="bo-kk-zeile__text">
                <span className="bo-kk-zeile__titel block">{T.zutun[z.id](z.n)}</span>
                {z.id === "gesperrt" && <span className="bo-kk-zeile__unter block">{T.zutun.gesperrtUnter}</span>}
              </span>
              <Link href={z.href} className="bo-knopf bo-knopf--secondary inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold">
                {z.knopf}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export async function EinrichtungKachel({ ctx }) {
  const r = await sicher(() => ladeEinrichtung(ctx));
  if (!r.ok || !r.daten) return null;
  const offen = T.einrichtung.filter((e) => !r.daten[e.id]);
  if (!offen.length || offen.every((e) => e.id === "wallet")) return null;
  return (
    <Kachel className="md:col-span-12" titel={T.uebersicht.einrichten} unter={T.uebersicht.einrichtenUnter} testid="kk-einrichtung">
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {T.einrichtung.map((e) => {
          const fertig = r.daten[e.id];
          return (
            <li key={e.id}>
              <Link href={e.href} className={cx("flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-bo-surface-2", fertig && "text-bo-text-soft")}>
                <span aria-hidden="true" className={cx("grid size-7 flex-none place-items-center rounded-full", fertig ? "bg-bo-salbei-soft text-bo-salbei-text" : "bg-bo-fill text-bo-text-soft")}>
                  <Icon name={fertig ? "Check" : "CircleDashed"} className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className={cx("block text-[14px] font-medium", fertig && "line-through decoration-bo-line-strong")}>{e.titel}</span>
                  {e.unter && <span className="block text-[12px] text-bo-text-faint">{e.unter}</span>}
                  <span className="bo-kk-sr">{fertig ? "erledigt" : "offen"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Kachel>
  );
}

const ART_ICON = { karte: "CreditCard", antrag: "Inbox", einloesung: "CheckCheck" };
const ART_TAB = { karte: KARTE_STATUS, antrag: ANTRAG_STATUS, einloesung: EINLOESUNG_STATUS };

export async function ZuletztKachel({ ctx, className }) {
  const r = await sicher(() => ladeZuletzt(ctx));
  if (!r.ok) return <NichtGeladen titel={T.uebersicht.zuletzt} fehler={r.fehler} className={className} />;
  return (
    <Kachel className={className} titel={T.uebersicht.zuletzt} testid="kk-zuletzt">
      {r.daten.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-bo-text-soft">{T.uebersicht.zuletztLeer}</p>
      ) : (
        <ul className="bo-kk-zeilen">
          {r.daten.map((z) => (
            <li key={`${z.art}-${z.name}`} className="bo-kk-zeile">
              <span className="bo-kk-zeile__icon" aria-hidden="true">
                <Icon name={ART_ICON[z.art]} className="size-4" />
              </span>
              <span className="bo-kk-zeile__text">
                <Link href={z.href} className="bo-kk-zeile__titel bo-kk-zeile__link block truncate">
                  {z.titel}
                </Link>
                <span className="bo-kk-zeile__unter block truncate">{z.unter}</span>
              </span>
              <StatusBadge wert={z.status} text={statusLabel(ART_TAB[z.art], z.status)} ton={statusTon(ART_TAB[z.art], z.status)} groesse="xs" className="hidden sm:inline-flex" />
              {z.wer && <Avatar name={z.wer.split("@")[0]} groesse={24} className="hidden md:inline-grid" />}
              <time className="bo-kk-zeile__zeit" dateTime={String(z.zeit).replace(" ", "T")} title={datumZeit(z.zeit)} suppressHydrationWarning>
                {relativ(z.zeit, ctx.jetzt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}
