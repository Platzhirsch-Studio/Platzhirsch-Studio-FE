"use client";
// Fehlerkatalog als Baum (10-konzept-service §2.11): role="tree", → auf/← zu, Enter öffnet das Code-Sheet,
// Buchstabe springt. Code-Sheet speichert 1 s nach der Eingabe (Leitung), Statuszeile „Gespeichert 14:05“.
import { useMemo, useRef, useState } from "react";
import { Icon } from "../icons";
import Schalter from "../Schalter";
import { Sheet } from "../Overlay";
import { Pille } from "../StatusBadge";
import { fehlercodeAction } from "@/lib/backoffice/service/actions";
import { ENTSCHEIDUNGEN } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

const FELDER = [
  ["bezeichnung", T.katalog.felder.bezeichnung, "input"],
  ["typische_ursache", T.katalog.felder.ursache, "textarea"],
  ["standardloesung", T.katalog.felder.loesung, "textarea"],
  ["pruefhinweis", T.katalog.felder.pruef, "textarea"],
  ["kundentext", T.katalog.felder.kundentext, "textarea"],
];

/** @param {{bereiche:object[], codes:object[], leitung:boolean, faelleJeCode:Record<string,number>}} p */
export default function KatalogBaum({ bereiche, codes, leitung, faelleJeCode = {} }) {
  const [q, setQ] = useState("");
  const [offen, setOffen] = useState(() => new Set(bereiche.slice(0, 2).map((b) => b.code || b.name)));
  const [wahl, setWahl] = useState(null);
  const [liste, setListe] = useState(codes);
  const [stand, setStand] = useState("");
  const timer = useRef(null);
  const baum = useRef(null);
  const sichtbar = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bereiche.map((b) => ({ ...b, codes: liste.filter((c) => c.bereich === (b.code || b.name) && (!s || `${c.code} ${c.bezeichnung}`.toLowerCase().includes(s))) })).filter((b) => !s || b.codes.length);
  }, [bereiche, liste, q]);
  const gewaehlt = liste.find((c) => c.code === wahl);

  const aendern = (feld, wert) => {
    setListe((l) => l.map((c) => (c.code === wahl ? { ...c, [feld]: wert } : c)));
    if (!leitung) return;
    setStand("Wird gespeichert …");
    clearTimeout(timer.current);
    const code = wahl;
    timer.current = setTimeout(async () => {
      const r = await fehlercodeAction({ code, werte: { [feld]: wert } });
      setStand(r.ok ? `${T.katalog.gespeichert} ${r.zeit}` : `Nicht gespeichert · ${r.message}`);
    }, 1000);
  };

  const taste = (e) => {
    const items = [...(baum.current?.querySelectorAll('[role="treeitem"]') || [])];
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const el = items[i];
    const bereich = el.dataset.bereich;
    if (e.key === "ArrowDown") items[i + 1]?.focus();
    else if (e.key === "ArrowUp") items[i - 1]?.focus();
    else if (e.key === "ArrowRight" && bereich) setOffen((o) => new Set([...o, bereich]));
    else if (e.key === "ArrowLeft") {
      if (bereich) setOffen((o) => new Set([...o].filter((x) => x !== bereich)));
      else baum.current?.querySelector(`[data-bereich="${el.dataset.eltern}"]`)?.focus();
    } else if (e.key === "Enter" && el.dataset.code) setWahl(el.dataset.code);
    else if (/^[a-z0-9]$/i.test(e.key)) items.slice(i + 1).concat(items.slice(0, i)).find((x) => x.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()))?.focus();
    else return;
    e.preventDefault();
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="bo-suche w-full sm:w-80">
          <Icon name="Search" className="size-4 shrink-0" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.katalog.suche} aria-label={T.katalog.suche} />
        </label>
      </div>
      {sichtbar.length === 0 ? (
        <p className="bo-svc-karte text-[14px]">{T.katalog.leer}</p>
      ) : (
        <ul className="bo-svc-baum" role="tree" aria-label={T.katalog.titel} ref={baum} onKeyDown={taste} data-testid="katalog-baum">
          {sichtbar.map((b) => {
            const id = b.code || b.name;
            const auf = offen.has(id) || !!q;
            return (
              <li key={id} className="bo-svc-baum__bereich" role="none">
                <button type="button" role="treeitem" aria-expanded={auf} aria-selected={false} data-bereich={id} className="bo-svc-baum__kopf" onClick={() => setOffen((o) => (o.has(id) ? new Set([...o].filter((x) => x !== id)) : new Set([...o, id])))} tabIndex={0}>
                  <Icon name={auf ? "ChevronDown" : "ChevronRight"} className="size-4 text-bo-text-soft" />
                  <span className="w-12 font-semibold tabular-nums">{id}</span>
                  <span className="min-w-0 flex-1 font-medium">{b.bezeichnung}</span>
                  <span className="text-[13px] text-bo-text-soft">
                    {T.katalog.codes(b.codes.length)} · {T.katalog.faelle(b.codes.reduce((a, c) => a + (faelleJeCode[c.code] || 0), 0))}
                  </span>
                </button>
                {auf && (
                  <ul role="group" className="pb-2">
                    {b.codes.length === 0 && <li className="px-11 py-2 text-[13px] text-bo-text-soft">{T.katalog.bereichLeer(b.bezeichnung)}</li>}
                    {b.codes.map((c) => (
                      <li key={c.code} role="treeitem" tabIndex={-1} aria-selected={wahl === c.code} data-code={c.code} data-eltern={id} className="bo-svc-baum__code" onClick={() => setWahl(c.code)}>
                        <span className="font-semibold tabular-nums">{c.code}</span>
                        <span className="min-w-0 truncate">{c.bezeichnung}</span>
                        <span className="flex items-center gap-2 text-[13px] text-bo-text-soft">
                          {Number(c.lieferantenrelevant) ? <Pille material="cognac" groesse="s">{T.katalog.lieferantHaftet}</Pille> : null}
                          {faelleJeCode[c.code] ? T.katalog.faelle(faelleJeCode[c.code]) : null}
                          {c.standard_entscheidung ? <span className="hidden lg:inline">{T.katalog.ueblich(c.standard_entscheidung)}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {gewaehlt && (
        <Sheet offen onSchliessen={() => setWahl(null)} titel={`${gewaehlt.code} ${gewaehlt.bezeichnung}`} unter={leitung ? stand || "Änderungen werden automatisch gespeichert" : T.katalog.nurLeitung} groesse="md" testid="code-sheet">
          <div className="grid gap-4">
            {FELDER.map(([f, label, art]) => (
              <label key={f} className="bo-svc-feld">
                <span>{label}</span>
                {art === "input" ? <input value={gewaehlt[f] || ""} disabled={!leitung} onChange={(e) => aendern(f, e.target.value)} /> : <textarea rows={2} value={gewaehlt[f] || ""} disabled={!leitung} onChange={(e) => aendern(f, e.target.value)} />}
              </label>
            ))}
            <label className="bo-svc-feld">
              <span>{T.katalog.felder.entscheidung}</span>
              <select value={gewaehlt.standard_entscheidung || ""} disabled={!leitung} onChange={(e) => aendern("standard_entscheidung", e.target.value)}>
                <option value="">–</option>
                {ENTSCHEIDUNGEN.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <Schalter label={T.katalog.felder.lieferant} an={!!Number(gewaehlt.lieferantenrelevant)} deaktiviert={!leitung} onWechsel={(v) => aendern("lieferantenrelevant", v ? 1 : 0)} />
            <Schalter label={T.katalog.felder.aktiv} an={!!Number(gewaehlt.aktiv ?? 1)} deaktiviert={!leitung} onWechsel={(v) => aendern("aktiv", v ? 1 : 0)} beschreibung="Deaktivieren statt löschen – bestehende Fälle behalten ihren Code." />
          </div>
        </Sheet>
      )}
    </div>
  );
}
