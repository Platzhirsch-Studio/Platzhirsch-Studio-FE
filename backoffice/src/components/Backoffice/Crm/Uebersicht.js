"use client";
// Übersicht `/crm` (§ 3.1): „Zu erledigen“ (eine Arbeitsliste, je Zeile genau ein Knopf; erledigte Zeilen
// klappen zu) und „Mein Tag“ (aktiver Termin als eingelassene Karte wie Lounge-Zentrale, Folgetermine kompakt).

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf, { RundKnopf } from "../Knopf";
import Avatar from "../Avatar";
import Leer from "../Leer";
import { Symbol } from "./Teile";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { annehmenAction, aufgabeStatusAction, protokollSchreibenAction, terminBestaetigenAction } from "@/lib/backoffice/crm/actions";

const SYMBOL = { neu: ["Inbox", "cognac"], bestaetigen: ["CalendarDays", "eiche"], protokoll: ["PenTool", "see"], entfallen: ["CalendarPlus", "ziegel"], nachfassen: ["Clock", "eiche"], aufgabe: ["CheckSquare", "salbei"], datenschutz: ["Shield", "ziegel"] };

export function ZuErledigen({ zeilen = [], max = 8, alleHref }) {
  const router = useRouter();
  const { fuehre } = useCrmAktion();
  const [weg, setWeg] = useState(() => new Set());
  const [laeuft, setLaeuft] = useState(null);
  const sicht = zeilen.filter((z) => !weg.has(z.id));
  const ausfuehren = async (z) => {
    setLaeuft(z.id);
    let r;
    if (z.knopf.aktion === "annehmen") r = await fuehre(() => annehmenAction({ namen: [z.objekt.name] }), { text: T.toast.angenommen, fehlerText: "Annehmen", objekt: z.objekt, onZurueck: () => setWeg((w) => new Set([...w].filter((x) => x !== z.id))) });
    else if (z.knopf.aktion === "bestaetigen") r = await fuehre(() => terminBestaetigenAction({ name: z.objekt.name, mail: true }), { text: T.toast.bestaetigt, fehlerText: "Bestätigen", objekt: z.objekt });
    else if (z.knopf.aktion === "aufgabeErledigt") r = await fuehre(() => aufgabeStatusAction({ name: z.objekt.name, status: "Erledigt" }), { text: "Aufgabe erledigt" });
    else if (z.knopf.aktion === "protokoll") {
      r = await protokollSchreibenAction({ termin: z.objekt.name });
      if (r?.ok && r.name) return router.push(`/crm/gespraeche/${encodeURIComponent(r.name)}`);
    }
    setLaeuft(null);
    if (r?.ok) setWeg((w) => new Set(w).add(z.id));
  };
  if (!sicht.length) return <Leer art="erledigt" groesse="karte" text={T.uebersicht.alles} testid="crm-zu-erledigen-leer" />;
  return (
    <div className="grid gap-1" data-testid="crm-zu-erledigen">
      <ul className="grid gap-1">
        {sicht.slice(0, max).map((z) => {
          const [icon, ton] = SYMBOL[z.art] || ["Info", undefined];
          return (
            <li key={z.id} className="bo-crm-zeile" data-art={z.art} data-testid="crm-zeile">
              <Symbol icon={icon} ton={ton} />
              <Link href={z.href} className="min-w-0">
                <span className="bo-crm-typ block">{z.typ}</span>
                <span className="block truncate text-[15px] font-semibold leading-5">{z.titel}</span>
                {z.unter && <span className={`block truncate text-[13px] ${z.wort === T.alter.ueberfaellig ? "text-bo-danger-text" : z.wort ? "text-bo-warning-text" : "text-bo-text-soft"}`}>{z.unter}</span>}
              </Link>
              {z.knopf.href ? (
                <Knopf size="s" variant="secondary" href={z.knopf.href}>{z.knopf.titel}</Knopf>
              ) : (
                <Knopf size="s" variant="secondary" laedt={laeuft === z.id} onClick={() => ausfuehren(z)} data-testid={`crm-zeile-${z.knopf.aktion}`}>{z.knopf.titel}</Knopf>
              )}
              <RundKnopf icon="ChevronRight" label={`${z.typ} öffnen`} href={z.href} groesse="s" flach />
            </li>
          );
        })}
      </ul>
      {sicht.length > max && alleHref && <div className="pt-2"><Knopf size="s" variant="ghost" href={alleHref} iconRechts="ArrowRight">{T.uebersicht.alleAnzeigen(sicht.length)}</Knopf></div>}
    </div>
  );
}

export function MeinTag({ termine = [], naechster, jetzt: jetztIso }) {
  const router = useRouter();
  const { fuehre } = useCrmAktion();
  const jetzt = jetztIso ? new Date(jetztIso) : new Date();
  const [laeuft, setLaeuft] = useState(false);
  const offen = termine.filter((t) => t.status !== "Erledigt");
  if (!offen.length) {
    return (
      <div className="grid gap-3" data-testid="crm-mein-tag-leer">
        <Leer groesse="karte" text={T.uebersicht.keineTermine} />
        {naechster && <Link href={`/crm/termine/${encodeURIComponent(naechster.name)}`} className="text-[14px] text-bo-text-soft hover:underline">{T.uebersicht.naechster(String(naechster.start).slice(0, 16).replace(" ", ", "), naechster.person)}</Link>}
      </div>
    );
  }
  const z = (s) => String(s || "").slice(11, 16);
  const aktivIndex = Math.max(0, offen.findIndex((t) => new Date(String(t.ende || t.start).replace(" ", "T")) > jetzt));
  const aktiv = offen[aktivIndex];
  const rest = offen.filter((t) => t !== aktiv);
  const gestartet = new Date(String(aktiv.start).replace(" ", "T")) <= jetzt;
  const primaer = async () => {
    if (aktiv.status === "Unbestaetigt") return fuehre(() => terminBestaetigenAction({ name: aktiv.name, mail: true }), { text: T.toast.bestaetigt, objekt: { doctype: "PH Termin", name: aktiv.name } });
    if (aktiv.beratungsgespraech) return router.push(`/crm/gespraeche/${encodeURIComponent(aktiv.beratungsgespraech)}`);
    setLaeuft(true);
    const r = await protokollSchreibenAction({ termin: aktiv.name });
    setLaeuft(false);
    if (r?.ok && r.name) router.push(`/crm/gespraeche/${encodeURIComponent(r.name)}`);
  };
  return (
    <div className="grid gap-2.5" data-testid="crm-mein-tag">
      <div className="bo-crm-tag-aktiv">
        <div className="flex items-center gap-3">
          <Avatar name={aktiv.person || aktiv.titel} groesse={48} />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold leading-6">{aktiv.person || aktiv.titel}</p>
            <p className="truncate text-[14px] text-bo-cognac-text">{[T.modus[aktiv.modus], aktiv.thema].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div><dt className="text-[12px] text-bo-text-soft">Zeit</dt><dd className="text-[17px] font-semibold tabular-nums">{z(aktiv.start)} – {z(aktiv.ende)}</dd></div>
          <div><dt className="text-[12px] text-bo-text-soft">{aktiv.status === "Unbestaetigt" ? "Status" : "Berater"}</dt><dd className="truncate text-[17px] font-semibold">{aktiv.status === "Unbestaetigt" ? T.status.termin.Unbestaetigt : aktiv.beraterName || "–"}</dd></div>
        </dl>
        <div className="mt-4 flex items-center gap-2">
          <Knopf variant="primary" icon={aktiv.status === "Unbestaetigt" ? "Check" : "PenTool"} laedt={laeuft} onClick={primaer} data-testid="crm-mein-tag-primaer">
            {aktiv.status === "Unbestaetigt" ? T.knopf.bestaetigen : gestartet ? T.knopf.protokoll : aktiv.modus === "Video" ? T.knopf.raumOeffnen : T.knopf.protokoll}
          </Knopf>
          <RundKnopf icon="ArrowUpRight" label="Termin öffnen" href={`/crm/termine/${encodeURIComponent(aktiv.name)}`} />
        </div>
      </div>
      {rest.map((t) => (
        <Link key={t.name} href={`/crm/termine/${encodeURIComponent(t.name)}`} className="bo-crm-tag-folge hover:bg-bo-fill-2">
          <span className="min-w-0"><span className="block truncate text-[15px] font-medium">{t.person || t.titel}</span><span className="block truncate text-[13px] text-bo-cognac-text">{[T.modus[t.modus], t.thema].filter(Boolean).join(" · ")}</span></span>
          <span className="text-[17px] font-semibold tabular-nums">{z(t.start)}</span>
        </Link>
      ))}
    </div>
  );
}
