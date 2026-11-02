"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { findDock, topology } from "../../../lib/sofaplaner/geometry.js";
import { KINDS, KIND_ORDER, MEASURE_LABEL } from "../../../lib/sofaplaner/normalize.js";
import { plainLabel, sideLabel } from "./model";
import { Glyph } from "./Glyph";
import { useNarrow } from "./storage";
import s from "./sofaplaner.module.css";
import { useT } from "./useT";

function Pict({ el }) {
  const t = topology(el);
  const w = el.w || 100,
    d = el.d || 100;
  const pad = 8;
  return (
    <svg viewBox={`${-w / 2 - pad} ${-d / 2 - pad} ${w + pad * 2} ${d + pad * 2}`} className={s.tileIcon} aria-hidden="true" focusable="false">
      <Glyph soft w={w} d={d} backs={t.backs} closed={t.closed} kind={el.kind} shape={el.shape} />
      {(!el.w || !el.d) && <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="none" stroke="var(--color-notice)" strokeWidth="4" strokeDasharray="10 8" />}
    </svg>
  );
}

// Short reason on the tile; the full explanation appears when the tile is tapped.
const SHORT = {
  closed: "Nicht anschließbar: alle Enden sind abgeschlossen",
  line: "Andere Linie als Ihr Sofa",
  module: "Andere Sitzmodul-Breite als Ihr Sofa",
  space: "Kein Platz an den freien Seiten",
  dims: "Maß fehlt – im Showroom bestätigen",
};

const PHONE_TILES = 6;

/** Element tiles grouped by kind. Simple mode: SX/DX of one element = one tile, side chosen automatically. */
export default function Palette({ family, plan, lookup, selectedId, expert, onAdd, onReject }) {
  const T = useT();
  const [kind, setKind] = useState("passend");
  const [line, setLine] = useState("");
  // QM R2 P2-D: phones/tablets show the first PHONE_TILES tiles, then „Alle n zeigen“
  const compact = useNarrow();
  const [showAll, setShowAll] = useState(false);
  const pickKind = (k) => {
    setKind(k);
    setShowAll(false);
  };

  const groups = useMemo(() => {
    const els = family.elements.filter((e) => e.role !== "acc" && (!line || e.line === line));
    const map = new Map();
    for (const e of els) {
      const key = expert ? e.code : e.group;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()].map(([key, variants]) => ({ key, variants, el: variants[0] }));
  }, [family, expert, line]);

  const status = useMemo(() => {
    const out = new Map();
    for (const g of groups) {
      const v = g.variants.filter((e) => e.w && e.d);
      if (!v.length) {
        out.set(g.key, { ok: false, reason: "Breite oder Tiefe nicht veröffentlicht – Maß im Showroom bestätigen.", code: "dims" });
        continue;
      }
      const role = v[0].role;
      if (role === "free" || role === "loose") {
        out.set(g.key, { ok: true, free: true });
        continue;
      }
      if (!plan.items.length) {
        out.set(g.key, { ok: true });
        continue;
      }
      const r = findDock(plan.items, lookup, v, { prefer: selectedId, room: plan.room });
      out.set(g.key, r.item ? { ok: true, outside: r.outside } : { ok: false, reason: r.reason, code: r.code });
    }
    return out;
  }, [groups, plan.items, plan.room, lookup, selectedId]);

  const kinds = KIND_ORDER.filter((k) => k !== "zubehoer" && groups.some((g) => g.el.kind === k));
  const okCount = groups.filter((g) => status.get(g.key)?.ok && !status.get(g.key)?.free).length;
  const shown = groups
    .filter((g) => (kind === "passend" ? status.get(g.key)?.ok && (!status.get(g.key).free || !okCount) : g.el.kind === kind))
    .sort((a, b) => Number(!status.get(a.key)?.ok) - Number(!status.get(b.key)?.ok) || KIND_ORDER.indexOf(a.el.kind) - KIND_ORDER.indexOf(b.el.kind) || (a.el.w || 0) - (b.el.w || 0));
  const limited = compact && !showAll && shown.length > PHONE_TILES + 1;
  const visible = limited ? shown.slice(0, PHONE_TILES) : shown;
  const closedAll = plan.items.length > 0 && [...status.values()].some((x) => x.code === "closed");
  const lines = [...new Set(family.elements.map((e) => e.line).filter(Boolean))];

  return (
    <div className={s.stack}>
      <div className={s.strip} role="radiogroup" aria-label={T("Elementart")}>
        <button type="button" role="radio" aria-checked={kind === "passend"} className={s.chip} onClick={() => pickKind("passend")}>
          {T("Passt jetzt")} <span className={s.chipCount}>{okCount || groups.filter((g) => status.get(g.key)?.ok).length}</span>
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} className={s.chip} onClick={() => pickKind(k)}>
            {T(KINDS[k].label)} <span className={s.chipCount}>{groups.filter((g) => g.el.kind === k).length}</span>
          </button>
        ))}
      </div>
      {expert && lines.length > 1 && (
        <label className={s.field}>
          <span>{T("Linie")}</span>
          <select className={s.input} value={line} onChange={(e) => setLine(e.target.value)}>
            <option value="">{T("Alle Linien")}</option>
            {lines.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
      )}
      {closedAll && (
        <p className={s.note}>
          {T("Ihre Komposition ist an allen Enden mit Armlehnen abgeschlossen. Um ein Element anzubauen, ein Endelement auswählen und „Entfernen“ – oder frei stellbare Stücke wie Hocker hinzufügen.")}
        </p>
      )}
      {selectedId && kind === "passend" && <p className={s.small}>{T("Anschließbare Elemente docken bevorzugt an das ausgewählte Element an. Frei stellbare Stücke wie Hocker oder Daybeds stellt der Planer an einen freien Platz im Raum.")}</p>}
      {shown.length === 0 ? (
        <p className={s.note}>{T(kind === "passend" ? "Gerade passt kein weiteres Element an. Wählen Sie oben eine Elementart, um alle mit Begründung zu sehen." : "Keine Elemente in dieser Gruppe.")}</p>
      ) : (
        <ul className={s.tiles} data-palette>
          {visible.map((g) => {
            const st = status.get(g.key) || { ok: false };
            const el = g.el;
            const both = g.variants.length > 1;
            const missing = [...new Set(g.variants.flatMap((v) => v.missing))];
            const reasonId = `sp-r-${g.key.replace(/[^a-z0-9]/gi, "")}`;
            return (
              <li key={g.key}>
                <button
                  type="button"
                  className={s.tile}
                  aria-disabled={!st.ok || undefined}
                  aria-describedby={!st.ok ? reasonId : undefined}
                  draggable={st.ok}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/x-sofaelement", el.code);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => (st.ok ? onAdd(g.variants) : onReject(T.dyn(st.reason)))}
                  aria-label={`${plainLabel(el)}${both ? ` ${T("(links oder rechts)")}` : el.side ? `, ${T.dyn(sideLabel(el))}` : ""}, ${T.cm(el.w)} × ${T.cm(el.d)} cm${st.ok ? ` ${T("hinzufügen")}` : `, ${T("nicht anschließbar")}`}`}
                >
                  <Pict el={el} />
                  <span className={s.tileText}>
                    <span className={s.tileName}>{plainLabel(el)}</span>
                    <span className={s.tileDim}>
                      {T.cm(el.w)} × {T.cm(el.d)} cm{el.h ? `, H ${T.cm(el.h)}` : ""}
                    </span>
                    {(both || el.side) && <span className={s.tileMeta}>{both ? T("Links oder rechts – passt sich an") : T.dyn(sideLabel(el))}</span>}
                    {el.line && <span className={s.tileMeta}>{T("Linie")} {el.line}</span>}
                    {expert && <span className={s.tileCode}>{el.code}</span>}
                    {missing.length > 0 && <span className={s.tileMissing}>{T("Maß bestätigen:")} {missing.map((k) => T(MEASURE_LABEL[k])).join(", ")}</span>}
                    {st.ok && st.free && <span className={s.tileMeta}>{T("Frei stellbar")}</span>}
                    {!st.ok && (
                      <span id={reasonId} className={s.tileReason}>
                        {T(SHORT[st.code] || "") || T.dyn(st.reason)}
                      </span>
                    )}
                  </span>
                  {st.ok && <Plus size={16} aria-hidden="true" className={s.tilePlus} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {limited && (
        <button type="button" className={s.btnGhost} onClick={() => setShowAll(true)}>
          {T("Alle {n} zeigen", { n: shown.length })}
        </button>
      )}
    </div>
  );
}
