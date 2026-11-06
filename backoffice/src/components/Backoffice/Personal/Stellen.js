"use client";
// Stellen (Konzept § 5.3/§ 5.4): Liste | Kanban, Status-Pillen, Inline „+60 Tage“, Zeilenmenü (Öffnen · Auf Website
// ansehen · Duplizieren · Aushang drucken · Pausieren/Wieder aktivieren/Archivieren), Neu-Dialog „Stelle anlegen“
// (3 Felder, Live-Vorschau der Adresse auf der Website), Workflow-Knöpfe und GlBG-Checkliste der Stellenakte.
// Workflow-Übergänge als verzögerter Commit (8 s); Duplizieren sofort, Rückgängig löscht die Kopie (Variante B).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Knopf, { RundKnopf } from "../Knopf";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { stelleAnlegenAction, stelleWorkflowAction, stelleVerlaengernAction, stelleMethodeAction, stelleEntwurfLoeschenAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { statusText, statusTon, ausmassText } from "@/lib/backoffice/personal/status";
import { slugAusTitel, pruefeTitel } from "@/lib/backoffice/personal/titelpruefung";
import { kurzDatum, langDatum, relativTage } from "@/lib/backoffice/personal/zeit";
import { aktivOhneEntgelt } from "@/lib/backoffice/personal/regeln";
import Board from "./Board";
import "../DataTable/datatable.css";
import "./personal.css";
import { useWechsel } from "./hooks";

const euro = (cent) => new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format((Number(cent) || 0) / 100);
const KANBAN = ["Entwurf", "Aktiv", "Pausiert", "Besetzt"];

/** Workflow einer Stelle als verzögerter Commit; `optimistisch(neuerStatus|null)`. */
function useStelleWorkflow() {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [, start] = useTransition();
  return async (s, aktion, { optimistisch, bewerbung } = {}) => {
    const r = await stelleWorkflowAction({ name: s.name, aktion, bewerbung });
    if (!r.ok) {
      zeige(r.message || T.fehler.allgemein, { art: "fehler" });
      return r;
    }
    const ziel = { Veröffentlichen: "Aktiv", Pausieren: "Pausiert", "Wieder aktivieren": "Aktiv", "Als besetzt schließen": "Besetzt", Archivieren: "Archiviert", "Zurück auf Entwurf": "Entwurf" }[aktion];
    optimistisch?.(ziel);
    starte(`${T.stellen.workflowToast[aktion] || aktion} · ${s.titel}`, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: T.stellen.aktion[aktion] || aktion, onVerworfen: () => optimistisch?.(null), onFehler: () => optimistisch?.(null), onErfolg: () => start(() => router.refresh()) });
    return r;
  };
}

function Entgelt({ s }) {
  if (!s.entgeltOk) return <StatusBadge wert="fehlt" text={T.stellen.entgeltFehlt} ton={s.status === "Aktiv" ? "rot" : "grau"} groesse="xs" />;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon name="Check" className="size-3.5 text-bo-salbei-text" label="vollständig" />
      <span className="bo-per-zahl">{euro(s.kv_mindest_brutto_cent)}</span>
      <span className="text-[12px] text-bo-text-faint">/{s.entgelt_zeitraum === "Stunde" ? "h" : s.entgelt_zeitraum === "Jahr" ? "J." : "Mon."}</span>
    </span>
  );
}

function Verlaengern({ s, leitung, onNeu }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [, start] = useTransition();
  if (!leitung) return null;
  return (
    <Knopf
      size="s"
      variant="ghost"
      onClick={async () => {
        const r = await stelleVerlaengernAction({ name: s.name });
        if (!r.ok) return zeige(r.message, { art: "fehler" });
        onNeu?.(r.bis);
        starte(T.stellen.verlaengert(langDatum(r.bis)), { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: T.stellen.verlaengern, onVerworfen: () => onNeu?.(null), onFehler: () => onNeu?.(null), onErfolg: () => start(() => router.refresh()) });
      }}
      data-testid={`per-verlaengern-${s.name}`}
    >
      {T.stellen.verlaengern}
    </Knopf>
  );
}

function GueltigBis({ s, heute, leitung }) {
  const [neu, setNeu] = useState(null);
  const bis = neu || s.gueltig_bis;
  if (!bis) return <span className="text-bo-text-faint">–</span>;
  const g = s.gueltig;
  const ton = neu ? null : g?.ton;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 whitespace-nowrap">
      <span className={ton === "danger" ? "font-medium text-bo-ziegel-text" : ton === "warn" ? "font-medium text-bo-eiche-text" : ""} title={langDatum(bis)}>
        {ton ? relativTage(bis, heute).replace(/^in /, "in ") : kurzDatum(bis)}
      </span>
      {!neu && ton && <Verlaengern s={s} leitung={leitung} onNeu={setNeu} />}
    </span>
  );
}

/** Zeilenmenü einer Stelle. */
function StelleMenue({ s, rolle, aendern }) {
  const router = useRouter();
  const { zeige } = useToast();
  const wf = useStelleWorkflow();
  const leitung = rolle === "leitung";
  const darf = leitung || rolle === "sachbearbeitung";
  const [, start] = useTransition();
  const duplizieren = async () => {
    const r = await stelleMethodeAction({ name: s.name, methode: "duplizieren" });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    start(() => router.refresh());
    zeige(T.stellen.dupliziert, {
      art: "ok",
      aktion: {
        titel: T.zeiten.rueck,
        onClick: async () => {
          await stelleEntwurfLoeschenAction({ name: r.ergebnis });
          start(() => router.refresh());
        },
      },
    });
  };
  return (
    <Menue label={`Aktionen ${s.titel}`} platzierung="unten-ende" ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label={`Aktionen ${s.titel}`} groesse="s" flach testid={`per-stelle-menue-${s.name}`} />}>
      <MenuePunkt icon="ArrowUpRight" href={`/personal/stellen/${encodeURIComponent(s.name)}`}>
        {T.oeffnen}
      </MenuePunkt>
      {s.status === "Aktiv" && (
        <MenuePunkt icon="Eye" href={`/de/karriere/${s.name}`}>
          {T.stellen.aufWebsite}
        </MenuePunkt>
      )}
      {darf && (
        <MenuePunkt icon="Layers" onWaehlen={duplizieren}>
          {T.stellen.duplizieren}
        </MenuePunkt>
      )}
      <MenuePunkt icon="Printer" href={`/druck/ph-stelle/${encodeURIComponent(s.name)}?format=${encodeURIComponent("PH Stelle Aushang")}`}>
        {T.stellen.aushang}
      </MenuePunkt>
      <MenueTrenner />
      {s.status === "Aktiv" && darf && (
        <MenuePunkt icon="Hourglass" onWaehlen={() => wf(s, "Pausieren", { optimistisch: (z) => aendern(s.name, z) })}>
          {T.stellen.aktion.Pausieren}
        </MenuePunkt>
      )}
      {s.status === "Pausiert" && (
        <MenuePunkt icon="RotateCcw" deaktiviert={!leitung} grund={!leitung ? T.stellen.nurLeitungAktivieren : undefined} onWaehlen={() => wf(s, "Wieder aktivieren", { optimistisch: (z) => aendern(s.name, z) })}>
          {T.stellen.aktion["Wieder aktivieren"]}
        </MenuePunkt>
      )}
      {s.status !== "Archiviert" && (
        <MenuePunkt icon="Trash2" deaktiviert={!leitung} grund={!leitung ? T.bewerbung.nurLeitung : undefined} onWaehlen={() => wf(s, "Archivieren", { optimistisch: (z) => aendern(s.name, z) })}>
          {T.stellen.aktion.Archivieren}
        </MenuePunkt>
      )}
    </Menue>
  );
}

/**
 * Stellen-Liste bzw. -Kanban.
 * @param {{zeilen:object[], ansicht:"liste"|"kanban", heute:string, rolle:string, darfAnlegen:boolean, vorlagen:Array<{name,titel}>,
 *   neuOffen:boolean, gefiltert:string|null}} p
 */
export default function StellenAnsicht({ zeilen, ansicht, heute, rolle, darfAnlegen, vorlagen = [], neuOffen = false, gefiltert = null, zuruecksetzenHref }) {
  const [status, setStatus] = useState({});
  const [neu, setNeu] = useState(neuOffen);
  const wf = useStelleWorkflow();
  const { zeige } = useToast();
  const leitung = rolle === "leitung";
  const aendern = (name, z) =>
    setStatus((s) => {
      const n = { ...s };
      if (z) n[name] = z;
      else delete n[name];
      return n;
    });
  const liste = zeilen.map((s) => (status[s.name] ? { ...s, status: status[s.name] } : s));
  const neuDialog = darfAnlegen ? <NeueStelleDialog offen={neu} onSchliessen={() => setNeu(false)} vorlagen={vorlagen} /> : null;

  if (!zeilen.length)
    return (
      <>
        <Leer
          art={gefiltert ? "gefiltert" : "leer"}
          titel={gefiltert ? T.stellen.gefiltert(gefiltert) : T.stellen.leer}
          text={gefiltert ? undefined : T.stellen.leerText}
          zuruecksetzenHref={zuruecksetzenHref}
          icon="Megaphone"
          aktion={!gefiltert && darfAnlegen ? <Knopf variant="primary" icon="Plus" onClick={() => setNeu(true)}>{T.stellen.anlegen}</Knopf> : undefined}
          testid="per-stellen-leer"
        />
        {neuDialog}
      </>
    );

  if (ansicht === "kanban") {
    const ZUEGE = { "Entwurf>Aktiv": "Veröffentlichen", "Aktiv>Pausiert": "Pausieren", "Pausiert>Aktiv": "Wieder aktivieren", "Aktiv>Besetzt": "Als besetzt schließen", "Pausiert>Besetzt": "Als besetzt schließen", "Besetzt>Aktiv": "Wieder aktivieren" };
    const ziele = (s) =>
      KANBAN.filter((n) => ZUEGE[`${s.status}>${n}`]).map((n) => {
        const a = ZUEGE[`${s.status}>${n}`];
        const nurL = a !== "Pausieren";
        const ok = nurL ? leitung : leitung || rolle === "sachbearbeitung";
        const block = a === "Veröffentlichen" && !s.entgeltOk ? T.stellen.check.entgelt : null;
        return { nach: n, titel: `${T.stellen.aktion[a]} → ${statusText("stelle", n)}`, erlaubt: ok && !block, grund: !ok ? T.bewerbung.nurLeitung : block };
      });
    return (
      <>
        <Board
          label={T.stellen.titel}
          testid="per-stellen-board"
          spalten={KANBAN.map((st) => ({ status: st, titel: statusText("stelle", st), karten: liste.filter((s) => s.status === st), leer: "Keine Stellen" }))}
          ziele={ziele}
          onGesperrt={(s, z) => zeige(z.grund || T.fehler.keinRecht, { art: "warnung" })}
          onZug={(s, nach) => wf(s, ZUEGE[`${s.status}>${nach}`], { optimistisch: (z) => aendern(s.name, z) })}
          karte={(s) => (
            <>
              <span className="bo-per-karte__name pr-10">
                <Link href={`/personal/stellen/${encodeURIComponent(s.name)}`}>{s.titel}</Link>
              </span>
              <span className="bo-per-karte__zeile">
                {s.kategorie} · {ausmassText(s.beschaeftigungsart)}
              </span>
              <span className="bo-per-karte__fuss">
                <Entgelt s={s} />
                <span className="bo-per-karte__anh">
                  <Icon name="Inbox" className="size-3.5" />
                  {s.bewerbungen}
                </span>
              </span>
            </>
          )}
        />
        {neuDialog}
      </>
    );
  }

  return (
    <div className="bo-dt" data-testid="per-stellen-liste">
      <div className="overflow-x-auto">
        <table className="bo-dt__tabelle">
          <thead>
            <tr>
              <th scope="col">{T.stellen.spalten.titel}</th>
              <th scope="col">{T.stellen.spalten.ausmass}</th>
              <th scope="col">{T.stellen.spalten.entgelt}</th>
              <th scope="col">{T.stellen.spalten.gueltig}</th>
              <th scope="col" data-rechts>{T.stellen.spalten.bew}</th>
              <th scope="col">{T.stellen.spalten.status}</th>
              <th scope="col"><span className="bo-per-sr">Aktionen</span></th>
            </tr>
          </thead>
          <tbody>
            {liste.map((s) => (
              <tr key={s.name} data-testid={`per-stelle-${s.name}`}>
                <td className="bo-dt__kopfzelle">
                  <span className="bo-dt-objekt">
                    <span className="bo-dt-bild grid place-items-center text-bo-text-soft" aria-hidden="true">
                      <Icon name="Megaphone" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <Link href={`/personal/stellen/${encodeURIComponent(s.name)}`} className="bo-dt-objekt__titel bo-dt-objekt__link line-clamp-2">
                        {s.titel}
                      </Link>
                      <span className="bo-dt-objekt__unter">{s.kategorie}</span>
                    </span>
                  </span>
                </td>
                <td className="whitespace-nowrap">{ausmassText(s.beschaeftigungsart)}</td>
                <td>
                  <Entgelt s={s} />
                </td>
                <td>
                  <GueltigBis s={s} heute={heute} leitung={leitung} />
                </td>
                <td data-rechts className="bo-per-zahl">
                  {s.bewerbungen}
                  {s.neu > 0 && <span className="ml-1 text-[12px] text-bo-cognac-text">+{s.neu}</span>}
                </td>
                <td>
                  {aktivOhneEntgelt(s) ? <StatusBadge wert="Aktiv" text={T.stellen.ohneEntgelt} ton="rot" groesse="m" /> : <StatusBadge wert={s.status} text={statusText("stelle", s.status)} ton={statusTon("stelle", s.status)} groesse="m" />}
                </td>
                <td data-rechts>
                  <StelleMenue s={s} rolle={rolle} aendern={aendern} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {neuDialog}
    </div>
  );
}

/** „Stelle anlegen“ (§ 5.3): Titel (Adresse live), Bereich, Ausmaß; optional „Von Stelle kopieren“. */
export function NeueStelleDialog({ offen, onSchliessen, vorlagen = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const [w, setW] = useState({ titel: "", kategorie: "", beschaeftigungsart: "Vollzeit", vorlage: "" });
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => {
    if (!o) return;
    setW({ titel: "", kategorie: "", beschaeftigungsart: "Vollzeit", vorlage: "" });
    setFehler({});
  });
  const pruefung = w.titel ? pruefeTitel(w.titel) : null;
  const senden = () =>
    start(async () => {
      const r = await stelleAnlegenAction(w);
      if (!r.ok) return setFehler(r.fehler || { titel: r.message });
      zeige(T.stellen.angelegt(w.titel || "Kopie"), { art: "ok" });
      onSchliessen();
      router.push(`/personal/stellen/${encodeURIComponent(r.name)}`);
    });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.stellen.neuTitel}
      groesse="md"
      testid="per-stelle-neu"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>
            {T.abbrechen}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={senden} data-testid="per-stelle-anlegen">
            {T.bewerbung.anlegen}
          </Knopf>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
      >
        <div className="bo-per-feld">
          <label htmlFor={`${id}-t`}>{T.stellen.spalten.titel}</label>
          <input id={`${id}-t`} className="bo-per-auswahl" value={w.titel} onChange={(e) => setW({ ...w, titel: e.target.value })} aria-invalid={fehler.titel ? "true" : undefined} autoFocus data-testid="per-stelle-titel" />
          {w.titel && (
            <span className="bo-per-feld__hilfe">
              {T.stellen.adresse}: …/karriere/{slugAusTitel(w.titel)}
            </span>
          )}
          {pruefung && !pruefung.neutral && <span className="bo-per-feld__hilfe text-bo-eiche-text">{pruefung.hinweis}</span>}
          {fehler.titel && <span className="bo-per-feld__fehler">{fehler.titel}</span>}
        </div>
        <div className="bo-per-raster2">
          <label className="bo-per-feld">
            <span>{T.stellen.spalten.bereich}</span>
            <select className="bo-per-auswahl" value={w.kategorie} onChange={(e) => setW({ ...w, kategorie: e.target.value })} aria-invalid={fehler.kategorie ? "true" : undefined} data-testid="per-stelle-kategorie">
              <option value="">–</option>
              {["Planung", "Verkauf", "Montage", "Verwaltung", "Lehre"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            {fehler.kategorie && <span className="bo-per-feld__fehler">{fehler.kategorie}</span>}
          </label>
          <label className="bo-per-feld">
            <span>{T.stellen.spalten.ausmass}</span>
            <select className="bo-per-auswahl" value={w.beschaeftigungsart} onChange={(e) => setW({ ...w, beschaeftigungsart: e.target.value })}>
              {["Vollzeit", "Teilzeit", "Vollzeit oder Teilzeit", "Lehre", "Praktikum", "Geringfuegig"].map((k) => (
                <option key={k} value={k}>
                  {ausmassText(k)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {vorlagen.length > 0 && (
          <label className="bo-per-feld">
            <span>{T.stellen.vonKopieren}</span>
            <select className="bo-per-auswahl" value={w.vorlage} onChange={(e) => setW({ ...w, vorlage: e.target.value })}>
              <option value="">{T.stellen.keineVorlage}</option>
              {vorlagen.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.titel}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>
    </Dialog>
  );
}

/** Knopf, der den Neu-Dialog öffnet (Seitenkopf). */
export function StelleAnlegenKnopf({ vorlagen, startOffen = false }) {
  const [offen, setOffen] = useState(startOffen);
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} kuerzel="Strg+Enter" data-testid="per-stelle-neu-knopf">
        {T.stellen.anlegen}
      </Knopf>
      <NeueStelleDialog offen={offen} onSchliessen={() => setOffen(false)} vorlagen={vorlagen} />
    </>
  );
}

/** Workflow-Knöpfe der Stellenakte (nur aus getTransitions) + GlBG-Checkliste-Sperre für „Veröffentlichen“. */
export function StelleWorkflowKnoepfe({ stelle, aktionen = [], checklisteOffen = false, besetztDurch = null }) {
  const wf = useStelleWorkflow();
  const [status, setStatus] = useState(stelle.status);
  useWechsel(stelle.status, setStatus);
  const s = { ...stelle, status };
  const primaer = aktionen.find((a) => a === "Veröffentlichen") || null;
  const neben = aktionen.filter((a) => a !== primaer);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="per-stelle-workflow">
      {neben.map((a) => (
        <Knopf key={a} variant="secondary" onClick={() => wf(s, a, { optimistisch: (z) => setStatus(z || stelle.status), bewerbung: a === "Als besetzt schließen" ? besetztDurch : undefined })} data-testid={`per-wf-${a}`}>
          {T.stellen.aktion[a] || a}
        </Knopf>
      ))}
      {primaer && (
        <Knopf variant="primary" icon="Megaphone" disabled={checklisteOffen} grund={checklisteOffen ? T.stellen.veroeffentlichenGrund : undefined} onClick={() => wf(s, primaer, { optimistisch: (z) => setStatus(z || stelle.status) })} kuerzel="Strg+Enter" data-testid="per-wf-veroeffentlichen">
          {T.stellen.veroeffentlichen}
        </Knopf>
      )}
    </div>
  );
}
