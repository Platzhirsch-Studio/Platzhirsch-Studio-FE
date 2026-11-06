"use client";
// Projekt anlegen (PA1, 10-konzept-projekte.md § 5.3) – ein Bildschirm: Kunde, Anfrage (optional), Projektart als
// Pillen, Titel; „Objekt und Team“ und „Räume“ eingeklappt und vorbelegt. Satz „Legt … an“ über dem Knopf.
// Ergebnis: Mappe öffnen, Toast „Projekt angelegt“. Idempotenz-Schlüssel je Bildschirm (Doppelklick legt nie zwei an).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { projektAnlegenAction } from "@/lib/backoffice/projekte/actions";
import { PROJEKTARTEN, RAUM_VORSCHLAEGE, TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import cx from "../cx";
import "./projekte.css";

const T = TEXTE.neu;

export default function ProjektNeu({ kontakte = [], anfragen = [], vorwahl = {}, kontakteGesperrt = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [kontakt, setKontakt] = useState(vorwahl.kontakt || "");
  const [suche, setSuche] = useState("");
  const [anfrage, setAnfrage] = useState(vorwahl.anfrage || "");
  const [art, setArt] = useState(vorwahl.projektart || "");
  const [titel, setTitel] = useState("");
  const [kurz, setKurz] = useState("");
  const [prio, setPrio] = useState("Normal");
  const [objekt, setObjekt] = useState({ strasse: "", plz: "", ort: "", land: "Österreich", hinweis: "" });
  const [abgewaehlt, setAbgewaehlt] = useState([]);
  const [fehler, setFehler] = useState({});
  const [pending, start] = useTransition();
  const [idem] = useState(() => `neu${Math.random().toString(36).slice(2, 10)}`);
  const k = kontakte.find((x) => x.name === kontakt);
  const treffer = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return (q ? kontakte.filter((x) => `${x.titel} ${x.name} ${x.ort || ""}`.toLowerCase().includes(q)) : kontakte).slice(0, 8);
  }, [kontakte, suche]);
  const raeume = (RAUM_VORSCHLAEGE[art] || []).filter((r) => !abgewaehlt.includes(r));
  const titelText = titel.trim() || (art && k ? `${statusText("PH Projekt", art)} ${k.titel}` : "");
  const satz = kontakt && art ? T.satz({ titel: titelText, kunde: k?.titel || kontakt, anfrage }) : T.satzLeer;
  const los = () =>
    start(async () => {
      const r = await projektAnlegenAction({ kontakt, kundeName: k?.titel || "", anfrage, projektart: art, titel, kurzbeschreibung: kurz, prioritaet: prio, objekt, raeume, idempotency: idem });
      if (!r?.ok) return setFehler(r?.fehler || { allgemein: r?.message });
      zeige(r.bestand ? T.bestand : T.angelegt, { art: "ok" });
      router.push(r.href);
    });
  const ausKunde = () => k && setObjekt((o) => ({ ...o, strasse: k.strasse || o.strasse, plz: k.plz || o.plz, ort: k.ort || o.ort }));

  return (
    <form className="mx-auto flex max-w-[880px] flex-col gap-6" onSubmit={(e) => (e.preventDefault(), kontakt && art && los())} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && kontakt && art) { e.preventDefault(); los(); } }} data-testid="projekt-neu">
      <Kachel titel={T.kunde} unter={kontakteGesperrt ? "Kundenliste nicht lesbar – Projekt aus der Anfrage im CRM anlegen." : T.kundeHilfe}>
        {k ? (
          <div className="flex items-center justify-between gap-3 rounded-[20px] bg-bo-surface-2 px-4 py-3">
            <div className="min-w-0">
              <p className="bo-prj-titel">{k.titel}</p>
              <p className="bo-prj-unter">{[k.name, k.ort].filter(Boolean).join(" · ")}</p>
            </div>
            <Knopf size="s" variant="ghost" onClick={() => setKontakt("")}>Ändern</Knopf>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input className="bo-input w-full" placeholder={T.kundeHilfe} value={suche} onChange={(e) => setSuche(e.target.value)} aria-label={T.kunde} aria-invalid={!!fehler.kontakt} data-testid="kunde-suche" disabled={kontakteGesperrt} />
            <ul className="flex flex-col gap-1.5" role="listbox" aria-label={T.kunde}>
              {treffer.map((x) => (
                <li key={x.name}>
                  <button type="button" role="option" aria-selected={false} onClick={() => setKontakt(x.name)} className="bo-motion flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors hover:bg-bo-fill focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none" data-testid="kunde-treffer">
                    <span className="min-w-0">
                      <span className="bo-prj-titel block truncate text-[15px]">{x.titel}</span>
                      <span className="bo-prj-unter block">{[x.name, x.ort].filter(Boolean).join(" · ")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {fehler.kontakt && <p className="text-[12px] text-bo-danger-text">{fehler.kontakt}</p>}
          </div>
        )}
        {anfragen.length > 0 && (
          <label className="mt-4 block">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.anfrage}</span>
            <select className="bo-input mt-1 w-full" value={anfrage} onChange={(e) => setAnfrage(e.target.value)}>
              <option value="">{T.anfrageHilfe}</option>
              {anfragen.filter((a) => !kontakt || !a.kontakt || a.kontakt === kontakt).map((a) => (
                <option key={a.name} value={a.name}>{`${a.name} · ${a.titel || ""}`}</option>
              ))}
            </select>
          </label>
        )}
      </Kachel>

      <Kachel titel={T.art}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={T.art}>
          {PROJEKTARTEN.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={art === a} onClick={() => (setArt(a), setAbgewaehlt([]))}
              className={cx("bo-motion h-11 rounded-full px-5 text-[15px] font-medium transition-[background-color,transform] active:scale-[0.97] focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none", art === a ? "bg-bo-ink text-bo-surface shadow-(--bo-sh-ink)" : "bg-bo-surface-2 hover:bg-bo-fill-2")} data-testid={`art-${a}`}>
              {statusText("PH Projekt", a)}
            </button>
          ))}
        </div>
        {fehler.projektart && <p className="mt-2 text-[12px] text-bo-danger-text">{fehler.projektart}</p>}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.titelFeld}</span>
            <input className="bo-input mt-1 w-full" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder={titelText || T.titelHilfe} />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.prioritaet}</span>
            <select className="bo-input mt-1 w-full" value={prio} onChange={(e) => setPrio(e.target.value)}>
              {["Normal", "Hoch", "Niedrig"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.kurz}</span>
            <textarea className="bo-input mt-1 min-h-20 w-full" value={kurz} onChange={(e) => setKurz(e.target.value)} />
          </label>
        </div>
      </Kachel>

      <details className="bo-kachel group">
        <summary className="bo-kachel__titel flex cursor-pointer list-none items-center justify-between">
          {T.objekt}
          <span className="text-[13px] font-normal text-bo-text-soft">{objekt.ort || "eingeklappt"}</span>
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-6">
          {k?.ort && <Knopf size="s" variant="ghost" className="sm:col-span-6 justify-self-start" onClick={ausKunde}>Adresse des Kunden übernehmen</Knopf>}
          {[["strasse", T.strasse, "sm:col-span-6"], ["plz", T.plz, "sm:col-span-2"], ["ort", T.ort, "sm:col-span-2"], ["land", T.land, "sm:col-span-2"], ["hinweis", T.hinweis, "sm:col-span-6"]].map(([f, l, c]) => (
            <label key={f} className={`block ${c}`}>
              <span className="text-[13px] font-medium text-bo-text-soft">{l}</span>
              <input className="bo-input mt-1 w-full" value={objekt[f]} onChange={(e) => setObjekt((o) => ({ ...o, [f]: e.target.value }))} />
            </label>
          ))}
        </div>
      </details>

      {art && (RAUM_VORSCHLAEGE[art] || []).length > 0 && (
        <Kachel titel={T.raeume} unter={T.raeumeHilfe}>
          <div className="flex flex-wrap gap-2">
            {(RAUM_VORSCHLAEGE[art] || []).map((r) => {
              const an = !abgewaehlt.includes(r);
              return (
                <button key={r} type="button" aria-pressed={an} onClick={() => setAbgewaehlt((a) => (an ? [...a, r] : a.filter((x) => x !== r)))}
                  className={cx("bo-motion h-10 rounded-full px-4 text-[14px] font-medium transition-[background-color,transform] active:scale-[0.97] focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none", an ? "bg-bo-salbei-soft text-bo-salbei-text" : "bg-bo-fill text-bo-text-soft line-through")}>
                  {r}
                </button>
              );
            })}
          </div>
        </Kachel>
      )}

      <div className="bo-material sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-5 py-3 shadow-(--bo-sh-float)">
        <p className="min-w-0 text-[15px] leading-[22px]" data-testid="neu-satz">{satz}</p>
        {fehler.allgemein && <p role="alert" className="text-[13px] text-bo-danger-text">{fehler.allgemein}</p>}
        <div className="flex gap-2">
          <Knopf href="/projekte">{T.abbrechen}</Knopf>
          <Knopf type="submit" variant="primary" kuerzel="Strg+Enter" laedt={pending} disabled={!kontakt || !art} grund={!kontakt || !art ? T.satzLeer : undefined} data-testid="anlegen">{T.anlegen}</Knopf>
        </div>
      </div>
    </form>
  );
}
