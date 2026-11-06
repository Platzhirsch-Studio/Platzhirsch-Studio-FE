"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import cx from "../cx";
import { useToast } from "../Toast";
import { useGleiter } from "../motion";
import Feld from "./Feld";
import Kindtabelle from "./Kindtabelle";
import Speicherleiste, { SpeicherAnzeige } from "./Speicherleiste";
import { useAutosave } from "./useAutosave";
import { LAYOUT_FELDTYPEN, NICHT_ANZEIGEN } from "@/lib/backoffice/frappe/feldtypen";
import { bearbeitbareFelder, validiere } from "@/lib/backoffice/validierung";
import { speichernDokumentAction } from "@/lib/backoffice/actions";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";
import { datumZeit } from "@/lib/backoffice/format";
import { uhrzeit } from "./autosave";
import { FORMULAR, SPEICHERN } from "./texte";
import "./formular.css";

/**
 * Generisches Dokument-Formular aus Meta im Lounge-Stil (Team P0-5b): Tab Break → Reiter (Kapsel mit
 * gleitender Tinte-Pille, ←/→), Section Break → Abschnitt als Kachel (Radius 28, ohne Rahmen),
 * Column Break → Spalten. Felder als eingelassene Flächen. Prüfung mit zod aus Meta, Konflikt über
 * `modified`, Leseansicht für Nicht-Berechtigte.
 *
 * Speichern (G-09, Q-D1): `Speicherleiste` am Formularende – haftet als Material-Kapsel unten, sobald es
 * etwas zu speichern gibt („Ungespeichert · Verwerfen · Speichern“, Strg/⌘+S). Mit `autosave` speichern
 * Entwürfe 1 s nach der letzten Eingabe selbst (useAutosave); die Leiste zeigt dann „Gespeichert 14:05“.
 *
 * @param {{meta:object, kinderMeta?:Record<string,object>, doc:object|null, neu:boolean, nurLesen:boolean, listeHref:string,
 *   nachSpeichernBasis?:string, autosave?:boolean, onSpeichern?:(p:{doctype,name,modified,werte})=>Promise<object>}} props
 *   `onSpeichern` ersetzt die Server Action (Demo/Bereiche mit eigener Action, gleiche Rückgabe `{ok, name, modified, fehler?, message?}`).
 */
export default function Formular({ meta, kinderMeta = {}, doc, neu, nurLesen, listeHref, nachSpeichernBasis, autosave: mitAutosave = false, onSpeichern }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  const [werte, setWerte] = useState(() => startwerte(meta, doc, neu));
  const [fehler, setFehler] = useState({});
  const [tab, setTab] = useState(0);
  const [geaendert, setGeaendert] = useState(false);
  const modified = useRef(doc?.modified);
  const werteRef = useRef(werte);
  const formRef = useRef(null);
  const struktur = useMemo(() => baueStruktur(meta), [meta]);
  const editierbar = useMemo(() => new Set(bearbeitbareFelder(meta, { neu }).map((f) => f.fieldname)), [meta, neu]);
  const autoAn = mitAutosave && !neu && !nurLesen && (doc?.docstatus ?? 0) === 0;
  const { ref: reiterRef, indikator } = useGleiter(tab, { selektor: '[aria-selected="true"]' });

  const sende = (w) => (onSpeichern || speichernDokumentAction)({ doctype: meta.name, name: neu ? null : doc?.name, modified: modified.current, werte: w });

  const auto = useAutosave({
    aktiv: autoAn,
    tastenkuerzel: autoAn,
    startZeit: doc?.modified ? uhrzeit(new Date(String(doc.modified).replace(" ", "T"))) : null,
    speichern: async (w) => {
      const v = validiere(meta, w, { neu: false });
      if (!v.ok) {
        setFehler(v.fehler);
        return { ok: false, message: SPEICHERN.pruefen };
      }
      const r = await sende(v.werte);
      if (r.ok) {
        modified.current = r.modified || modified.current;
        setGeaendert(false);
      } else if (r.fehler) setFehler(r.fehler);
      return r;
    },
  });

  const setze = (k, v) => {
    const neuWerte = { ...werteRef.current, [k]: v };
    werteRef.current = neuWerte;
    setWerte(neuWerte);
    if (autoAn) auto.aendern(neuWerte);
    setGeaendert(true);
    if (fehler[k]) setFehler((f) => ({ ...f, [k]: undefined }));
  };

  const verwerfen = () => {
    const start0 = startwerte(meta, doc, neu);
    werteRef.current = start0;
    setWerte(start0);
    setFehler({});
    setGeaendert(false);
    auto.verwerfen();
    zeige(SPEICHERN.verworfen, { art: "info" });
  };

  const speichern = (e) => {
    e?.preventDefault?.();
    if (autoAn) {
      auto.jetzt();
      return;
    }
    const v = validiere(meta, werte, { neu });
    if (!v.ok) {
      setFehler(v.fehler);
      zeige(SPEICHERN.pruefen, { art: "fehler" });
      springeZuFehler(struktur, v.fehler, setTab);
      return;
    }
    start(async () => {
      const r = await sende(v.werte);
      if (!r.ok) {
        if (r.fehler) {
          setFehler(r.fehler);
          springeZuFehler(struktur, r.fehler, setTab);
        }
        zeige(r.message, { art: "fehler" });
        return;
      }
      modified.current = r.modified || modified.current;
      setGeaendert(false);
      zeige(neu ? SPEICHERN.angelegt(doctypeLabel(meta.name), r.name) : SPEICHERN.gespeichertToast, { art: "ok" });
      if (neu && nachSpeichernBasis) router.push(`${nachSpeichernBasis}/${encodeURIComponent(r.name)}`);
      else router.refresh();
    });
  };

  // Strg+S / ⌘S speichert (ohne Autosave; mit Autosave fängt useAutosave die Taste ab).
  useEffect(() => {
    if (nurLesen || autoAn) return undefined;
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (neu || geaendert) formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [nurLesen, neu, geaendert, autoAn]);

  const zuSpeichern = autoAn ? auto.status === "fehler" : neu || geaendert;

  const sichtbar = (f) => {
    if (!f.depends_on || typeof f.depends_on !== "string") return true;
    // einfache eval:-Bedingungen "eval:doc.x" / "eval:doc.x=='y'" und Feldnamen
    const d = f.depends_on.replace(/^eval:/, "").trim();
    const m = /^doc\.([a-z0-9_]+)\s*(==|!=)\s*['"]([^'"]*)['"]$/i.exec(d);
    if (m) return m[2] === "==" ? String(werte[m[1]] ?? "") === m[3] : String(werte[m[1]] ?? "") !== m[3];
    const n = /^(?:doc\.)?!?([a-z0-9_]+)$/i.exec(d);
    if (n) {
      const wahr = !!werte[n[1]] && werte[n[1]] !== "0";
      return d.includes("!") ? !wahr : wahr;
    }
    return true;
  };

  return (
    <form ref={formRef} onSubmit={speichern} noValidate className="bo-formular min-w-0 space-y-6" data-testid="formular">
      {(struktur.tabs.length > 1 || autoAn) && (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          {struktur.tabs.length > 1 ? (
            <div
              ref={reiterRef}
              role="tablist"
              aria-label={FORMULAR.abschnitte}
              className="bo-fo-reiter"
              data-gemessen={indikator ? "" : undefined}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                const n = (tab + (e.key === "ArrowRight" ? 1 : -1) + struktur.tabs.length) % struktur.tabs.length;
                setTab(n);
                document.getElementById(`bo-tab-${n}`)?.focus();
              }}
            >
              {indikator && <span {...indikator} className={cx(indikator.className, "bo-fo-reiter__ind")} />}
              {struktur.tabs.map((t, i) => (
                <button key={t.label + i} role="tab" type="button" id={`bo-tab-${i}`} tabIndex={tab === i ? 0 : -1} aria-selected={tab === i} aria-controls={`bo-panel-${i}`} onClick={() => setTab(i)} className="bo-fo-reiter__i">
                  {anzeige(t.label)}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          {autoAn && <SpeicherAnzeige autosave={auto} />}
        </div>
      )}
      {struktur.tabs.map((t, i) => (
        <div key={t.label + i} role={struktur.tabs.length > 1 ? "tabpanel" : undefined} id={`bo-panel-${i}`} aria-labelledby={struktur.tabs.length > 1 ? `bo-tab-${i}` : undefined} hidden={tab !== i} className="space-y-6">
          {t.sections.map((s, j) => {
            const felder = s.columns.flat().filter((f) => sichtbar(f));
            if (!felder.length) return null;
            return (
              <section key={(s.label || "abschnitt") + j} className="bo-fo-abschnitt">
                {s.label && <h2 className="bo-fo-abschnitt__titel">{anzeige(s.label)}</h2>}
                <div className={cx("grid grid-cols-1 gap-x-6 gap-y-5", s.columns.length > 1 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3")}>
                  {s.columns.map((col, k) => (
                    <div key={k} className={cx("min-w-0 space-y-5", s.columns.length > 1 ? "" : "contents")}>
                      {col.filter(sichtbar).map((f) =>
                        f.fieldtype === "Table" ? (
                          <Kindtabelle key={f.fieldname} feld={f} kindMeta={kinderMeta[f.options]} zeilen={werte[f.fieldname] || []} onChange={(v) => setze(f.fieldname, v)} nurLesen={nurLesen || !editierbar.has(f.fieldname)} fehler={fehler[f.fieldname]} />
                        ) : (
                          <Feld key={f.fieldname} feld={f} wert={werte[f.fieldname]} onChange={(v) => setze(f.fieldname, v)} fehler={fehler[f.fieldname]} nurLesen={nurLesen || !editierbar.has(f.fieldname)} />
                        )
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ))}
      {!nurLesen && (
        <Speicherleiste
          zuSpeichern={zuSpeichern}
          geaendert={geaendert && !autoAn}
          laedt={pending || (autoAn && auto.status === "speichert")}
          neu={neu}
          onVerwerfen={verwerfen}
          abbrechenHref={listeHref}
          stand={!neu && doc?.modified && !autoAn ? datumZeit(doc.modified) : undefined}
          autosave={autoAn ? auto : undefined}
        />
      )}
    </form>
  );
}

function startwerte(meta, doc, neu) {
  const w = {};
  for (const f of meta.fields) {
    if (LAYOUT_FELDTYPEN.has(f.fieldtype) || NICHT_ANZEIGEN.has(f.fieldtype)) continue;
    const v = doc?.[f.fieldname];
    if (f.fieldtype === "Table") w[f.fieldname] = Array.isArray(v) ? v : [];
    else if (v !== undefined && v !== null) w[f.fieldname] = v;
    else if (neu && f.default !== undefined) w[f.fieldname] = f.default === "Today" ? new Date().toISOString().slice(0, 10) : f.default === "Now" ? new Date().toISOString().slice(0, 16) : f.default;
    else w[f.fieldname] = f.fieldtype === "Check" ? 0 : "";
  }
  return w;
}

/** Felder → Tabs → Abschnitte → Spalten. */
export function baueStruktur(meta) {
  const tabs = [];
  let tabAkt = { label: "Details", sections: [] };
  let sec = { label: "", columns: [[]] };
  const flush = () => {
    if (sec.columns.some((c) => c.length)) tabAkt.sections.push(sec);
    sec = { label: "", columns: [[]] };
  };
  for (const f of meta.fields) {
    if (f.hidden) continue;
    if (f.fieldtype === "Tab Break") {
      flush();
      if (tabAkt.sections.length) tabs.push(tabAkt);
      tabAkt = { label: f.label || "Weitere", sections: [] };
      continue;
    }
    if (f.fieldtype === "Section Break") {
      flush();
      sec.label = f.label || "";
      continue;
    }
    if (f.fieldtype === "Column Break") {
      sec.columns.push([]);
      continue;
    }
    if (NICHT_ANZEIGEN.has(f.fieldtype)) continue;
    sec.columns[sec.columns.length - 1].push(f);
  }
  flush();
  if (tabAkt.sections.length) tabs.push(tabAkt);
  if (!tabs.length) tabs.push({ label: "Details", sections: [{ label: "", columns: [[]] }] });
  return { tabs };
}

function springeZuFehler(struktur, fehler, setTab) {
  const erstes = Object.keys(fehler).find((k) => fehler[k]);
  if (!erstes) return;
  const i = struktur.tabs.findIndex((t) => t.sections.some((s) => s.columns.flat().some((f) => f.fieldname === erstes)));
  if (i >= 0) setTab(i);
  setTimeout(() => document.getElementById(`f-${erstes}`)?.focus(), 30);
}
