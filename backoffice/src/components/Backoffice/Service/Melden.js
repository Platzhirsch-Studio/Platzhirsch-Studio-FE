"use client";
// S1 – Servicefall melden (10-konzept-service §2.3): S1-Schnell als Sheet über jeder Service-Seite und die
// Bausteine Kontakt-Suche und Fehler-Combobox (auch für S1-Vollständig und S2). Esc schließt ohne Rückfrage.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import { Sheet } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { fallAnlegenAction, kontaktInfoAction } from "@/lib/backoffice/service/actions";
import { ARTEN, ARTEN_HAUPT, KANAELE, KUNDENWUENSCHE, PRIORITAETEN, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import "./service.css";

// --------------------------------------------------------------- Kontakt --

/** Kontakt-Suche (ab 2 Zeichen, Enter wählt den ersten Treffer) über /api/link. */
export function KontaktSuche({ wert, onWahl, fehler, autoFocus = false }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const [gesperrt, setGesperrt] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) return undefined;
    const ab = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/link?doctype=${encodeURIComponent("PH Kontakt")}&q=${encodeURIComponent(q.trim())}`, { signal: ab.signal })
        .then((r) => {
          if (r.status === 403) setGesperrt(true);
          return r.json();
        })
        .then((d) => {
          setTreffer(d.treffer || []);
          setAktiv(0);
          setOffen(true);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ab.abort();
    };
  }, [q]);
  const waehle = async (t) => {
    setOffen(false);
    setQ("");
    const r = await kontaktInfoAction({ name: t.value });
    onWahl(r.ok ? r.kontakt : { name: t.value, anzeige: t.description || t.value, email: "", telefon: "" });
  };
  if (wert) {
    return (
      <div className="bo-svc-karte flex min-w-0 items-center gap-3" data-testid="kontakt-gewaehlt">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{wert.anzeige}</span>
          <span className="block truncate text-[13px] text-bo-text-soft">{[wert.ort, wert.unternehmer ? "Unternehmer" : "Verbraucher", wert.email || T.melden.keineEmail].filter(Boolean).join(" · ")}</span>
        </span>
        <Knopf size="s" variant="ghost" onClick={() => onWahl(null)}>
          Ändern
        </Knopf>
      </div>
    );
  }
  return (
    <div className="relative">
      <label className="bo-svc-feld" data-fehler={fehler ? "" : undefined}>
        <span id={`${id}-l`}>{T.melden.kontakt}</span>
        <input
          role="combobox"
          aria-expanded={offen}
          aria-controls={`${id}-liste`}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          value={q}
          placeholder={T.melden.kontaktSuche}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 2) setOffen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setAktiv((a) => Math.min(a + 1, treffer.length - 1));
            else if (e.key === "ArrowUp") setAktiv((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && treffer[aktiv]) {
              e.preventDefault();
              waehle(treffer[aktiv]);
            } else return;
            e.preventDefault();
          }}
          data-testid="kontakt-suche"
        />
      </label>
      {fehler && <p className="bo-svc-fehler mt-1">{fehler}</p>}
      {offen && (
        <div id={`${id}-liste`} role="listbox" className="bo-svc-treffer absolute inset-x-0 top-[calc(100%+6px)] z-30">
          {gesperrt ? (
            <p className="px-3 py-2 text-[14px] text-bo-text-soft">{T.melden.kontaktGesperrt}</p>
          ) : treffer.length === 0 ? (
            <p className="px-3 py-2 text-[14px] text-bo-text-soft">{T.melden.kontaktLeer(q)}</p>
          ) : (
            treffer.map((t, i) => (
              <div key={t.value} role="option" aria-selected={i === aktiv} className="bo-svc-treffer__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => waehle(t)}>
                <span className="bo-svc-treffer__code">{t.description?.split(" · ")[0] || t.value}</span>
                <span className="truncate text-bo-text-soft">{t.value}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------- Fehler-Combobox --

/** Eine Combobox für Bereich + Code (N11): Suche über Code, Bezeichnung, Bereich, Ursache; Treffer gruppiert. */
export function FehlerCombobox({ katalog, wert, onWahl, fehler, label = T.melden.fehler }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const bereiche = useMemo(() => Object.fromEntries((katalog?.bereiche || []).map((b) => [b.code || b.name, b.bezeichnung])), [katalog]);
  const treffer = useMemo(() => {
    const s = q.trim().toLowerCase();
    const liste = (katalog?.codes || []).filter((c) => !s || [c.code, c.bezeichnung, bereiche[c.bereich], c.typische_ursache].some((x) => String(x || "").toLowerCase().includes(s)));
    return liste.slice(0, 40);
  }, [q, katalog, bereiche]);
  const gewaehlt = (katalog?.codes || []).find((c) => c.code === wert);
  const gruppen = useMemo(() => {
    const g = [];
    for (const c of treffer) {
      const last = g[g.length - 1];
      if (last?.bereich === c.bereich) last.codes.push(c);
      else g.push({ bereich: c.bereich, codes: [c] });
    }
    return g;
  }, [treffer]);
  const waehle = (c) => {
    onWahl(c);
    setOffen(false);
    setQ("");
  };
  return (
    <div className="relative grid gap-2">
      <label className="bo-svc-feld" data-fehler={fehler ? "" : undefined}>
        <span>{label}</span>
        <input
          role="combobox"
          aria-expanded={offen}
          aria-controls={`${id}-liste`}
          aria-autocomplete="list"
          value={offen ? q : gewaehlt ? `${gewaehlt.code} ${gewaehlt.bezeichnung}` : q}
          placeholder={T.melden.fehlerSuche}
          onFocus={() => setOffen(true)}
          onBlur={() => setTimeout(() => setOffen(false), 120)}
          onChange={(e) => {
            setQ(e.target.value);
            setOffen(true);
            setAktiv(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setAktiv((a) => Math.min(a + 1, treffer.length - 1));
            else if (e.key === "ArrowUp") setAktiv((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && offen && treffer[aktiv]) waehle(treffer[aktiv]);
            else if (e.key === "Escape" && offen) setOffen(false);
            else return;
            e.preventDefault();
            e.stopPropagation();
          }}
          data-testid="fehler-combobox"
        />
      </label>
      {fehler && <p className="bo-svc-fehler">{fehler}</p>}
      {offen && (
        <div id={`${id}-liste`} role="listbox" className="bo-svc-treffer absolute inset-x-0 top-[76px] z-30">
          {gruppen.length === 0 && <p className="px-3 py-2 text-[14px] text-bo-text-soft">{T.melden.fehlerLeer}</p>}
          {gruppen.map((g) => (
            <div key={g.bereich} role="group" aria-label={bereiche[g.bereich] || g.bereich}>
              <p className="bo-svc-treffer__gruppe">{bereiche[g.bereich] || g.bereich}</p>
              {g.codes.map((c) => {
                const i = treffer.indexOf(c);
                return (
                  <div key={c.code} role="option" aria-selected={i === aktiv} className="bo-svc-treffer__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => waehle(c)}>
                    <span className="bo-svc-treffer__code">{c.code}</span>
                    <span className="min-w-0 truncate">{c.bezeichnung}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {gewaehlt?.standardloesung && (
        <p className="bo-svc-hinweis">
          {T.melden.standardloesung}: {gewaehlt.standardloesung}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Art-Wahl --

/** Art-Chips + „Weitere“ + Weiterleitungen (Widerruf, Falschlieferung), die keinen Fall anlegen (P-R6). */
export function ArtWahl({ wert, onWahl, weiterleitung, onWeiterleitung }) {
  const weitere = ARTEN.filter((a) => !ARTEN_HAUPT.includes(a));
  return (
    <div className="grid gap-2">
      <span className="bo-svc-label" id="art-label">
        {T.melden.art}
      </span>
      <div className="bo-svc-chips" role="radiogroup" aria-labelledby="art-label">
        {ARTEN_HAUPT.map((a) => (
          <button key={a} type="button" role="radio" aria-checked={wert === a && !weiterleitung} className="bo-svc-wahl" onClick={() => (onWeiterleitung(null), onWahl(a))}>
            {a}
          </button>
        ))}
        <select aria-label={T.melden.weitere} className="bo-svc-wahl" value={weitere.includes(wert) && !weiterleitung ? wert : weiterleitung || ""} onChange={(e) => (["widerruf", "falsch"].includes(e.target.value) ? onWeiterleitung(e.target.value) : (onWeiterleitung(null), onWahl(e.target.value || "Mangel")))}>
          <option value="">{T.melden.weitere} …</option>
          {weitere.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value="widerruf">{T.melden.widerruf}</option>
          <option value="falsch">{T.melden.falsch}</option>
        </select>
      </div>
      {weiterleitung && (
        <div className="bo-svc-karte grid gap-3" role="status">
          <p className="text-[14px]">{weiterleitung === "widerruf" ? T.melden.widerrufText : T.melden.falschText}</p>
          <div className="flex flex-wrap gap-2">
            {weiterleitung === "widerruf" ? (
              <Knopf size="s" href="/shop" iconRechts="ArrowRight">
                {T.melden.widerrufLink}
              </Knopf>
            ) : (
              <Knopf size="s" href="/logistik" iconRechts="ArrowRight">
                {T.melden.falschLink}
              </Knopf>
            )}
            {weiterleitung === "falsch" && (
              <Knopf size="s" variant="ghost" onClick={() => (onWeiterleitung(null), onWahl("Transportschaden"))}>
                {T.melden.trotzdem}
              </Knopf>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------- S1-Schnell --

const LEER = { kontakt: null, art: "Mangel", fehlercode: "", beschreibung: "", kanal: "Telefon", eingang: true, telefonat: false, ort_am_stueck: "", erstauftreten: "", kundenwunsch: "Offen", seriennummer: "", produkt_name: "", prioritaet: "Normal", sachart: "Beweglich" };

/**
 * Knopf „Servicefall melden“ + Sheet (S1-Schnell). Öffnet sich auch über ?melden=1 (Palette, Kürzel).
 * @param {{katalog:{bereiche:object[], codes:object[]}, telefonIstErstreaktion?:boolean, primaer?:boolean, groesse?:string}} p
 */
export function MeldenKnopf({ katalog, telefonIstErstreaktion = true, primaer = true, groesse = "m" }) {
  const sp = useSearchParams();
  const [offen, setOffen] = useState(() => sp?.get("melden") === "1");
  return (
    <>
      <Knopf variant={primaer ? "primary" : "secondary"} size={groesse} icon="Plus" onClick={() => setOffen(true)} testid="melden-knopf" data-testid="melden-knopf">
        {T.start.melden}
      </Knopf>
      <MeldenSheet offen={offen} onSchliessen={() => setOffen(false)} katalog={katalog} telefonIstErstreaktion={telefonIstErstreaktion} />
    </>
  );
}

export function MeldenSheet({ offen, onSchliessen, katalog, telefonIstErstreaktion = true }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [w, setW] = useState(LEER);
  const [weiterleitung, setWeiterleitung] = useState(null);
  const [fehler, setFehler] = useState({});
  const [laeuft, setLaeuft] = useState(false);
  const formRef = useRef(null);
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const telefonKanal = ["Telefon", "Showroom"].includes(w.kanal);

  const anlegen = async (oeffnen) => {
    if (weiterleitung) return;
    const f = {};
    if (!w.kontakt) f.kontakt = T.melden.pflicht;
    if (!w.fehlercode) f.fehlercode = T.melden.pflicht;
    if (!w.beschreibung.trim()) f.beschreibung = T.melden.pflicht;
    setFehler(f);
    if (Object.keys(f).length) {
      formRef.current?.querySelector("[data-fehler] input, [data-fehler] textarea")?.focus();
      return;
    }
    setLaeuft(true);
    const r = await fallAnlegenAction({ ...w, kontakt: w.kontakt.name, kunde_name: w.kontakt.anzeige, kunde_email: w.kontakt.email, kunde_telefon: w.kontakt.telefon, kundentyp: w.kontakt.unternehmer ? "Unternehmer" : "Verbraucher", eingang: w.eingang && !!w.kontakt.email });
    setLaeuft(false);
    if (!r.ok) {
      if (r.fehler) setFehler(r.fehler);
      else zeige(`Nicht gespeichert – ${r.message}`, { art: "fehler" });
      return;
    }
    if (r.eingang?.verzoegert) starte(T.dialog.eingang.gesendet(r.email), { token: r.eingang.token, ms: r.eingang.ms, objekt: r.eingang.objekt });
    zeige(T.melden.angelegt(r.name, r.frist), { art: "ok", aktion: { titel: "Öffnen", onClick: () => router.push(`/service/faelle/${r.name}`) } });
    setW(LEER);
    setFehler({});
    if (oeffnen) {
      onSchliessen();
      router.push(`/service/faelle/${r.name}`);
    } else router.refresh();
  };

  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.melden.titel}
      groesse="lg"
      werkzeuge={
        <Knopf size="s" variant="ghost" href="/service/faelle/neu" iconRechts="ChevronRight">
          {T.melden.vollstaendig}
        </Knopf>
      }
      fuss={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Knopf variant="secondary" onClick={() => anlegen(true)} disabled={laeuft || !!weiterleitung}>
            {T.melden.anlegenOeffnen}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} disabled={!!weiterleitung} kuerzel="Strg+Enter" onClick={() => anlegen(false)} data-testid="melden-anlegen">
            {T.melden.anlegen}
          </Knopf>
        </div>
      }
      testid="melden-sheet"
    >
      <form
        ref={formRef}
        className="grid gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          anlegen(false);
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            anlegen(false);
          }
        }}
      >
        <KontaktSuche wert={w.kontakt} onWahl={(k) => setze("kontakt", k)} fehler={fehler.kontakt} autoFocus />
        <ArtWahl wert={w.art} onWahl={(a) => setze("art", a)} weiterleitung={weiterleitung} onWeiterleitung={setWeiterleitung} />
        {!weiterleitung && (
          <>
            <FehlerCombobox katalog={katalog} wert={w.fehlercode} onWahl={(c) => setze("fehlercode", c.code)} fehler={fehler.fehlercode} />
            <label className="bo-svc-feld" data-fehler={fehler.beschreibung ? "" : undefined}>
              <span>{T.melden.beschreibung}</span>
              <textarea rows={3} value={w.beschreibung} onChange={(e) => setze("beschreibung", e.target.value)} data-testid="melden-beschreibung" />
              {fehler.beschreibung && <span className="bo-svc-fehler">{fehler.beschreibung}</span>}
            </label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-end">
              <label className="bo-svc-feld">
                <span>{T.melden.kanal}</span>
                <select value={w.kanal} onChange={(e) => setze("kanal", e.target.value)}>
                  {KANAELE.filter((k) => !["Montage", "Wareneingang", "Website", "Portal"].includes(k)).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              {telefonKanal && telefonIstErstreaktion ? (
                <p className="bo-svc-hinweis pb-3" data-ton="ok">
                  <Icon name="Check" className="mr-1 inline size-3.5" />
                  {T.melden.kontaktiert(w.kanal === "Showroom" ? "vor Ort" : "Telefon")}
                </p>
              ) : (
                <Schalter label={T.melden.telefonatJetzt} an={w.telefonat} onWechsel={(v) => setze("telefonat", v)} groesse="s" />
              )}
            </div>
            {w.kontakt?.email ? <Schalter label={`${T.melden.eingang} an ${w.kontakt.email}`} an={w.eingang} onWechsel={(v) => setze("eingang", v)} /> : w.kontakt ? <p className="bo-svc-hinweis">{T.melden.eingang}: {T.melden.keineEmail}</p> : null}
            <details className="bo-svc-karte">
              <summary className="cursor-pointer text-[14px] font-medium">{T.melden.mehr}</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="bo-svc-feld">
                  <span>{T.melden.stelle}</span>
                  <input value={w.ort_am_stueck} onChange={(e) => setze("ort_am_stueck", e.target.value)} />
                </label>
                <div className="bo-svc-feld">
                  <span id="seit-label">{T.melden.seit}</span>
                  <Datumsfeld value={w.erstauftreten} onChange={(v) => setze("erstauftreten", v)} aria-label={T.melden.seit} />
                </div>
                <label className="bo-svc-feld">
                  <span>{T.melden.wunsch}</span>
                  <select value={w.kundenwunsch} onChange={(e) => setze("kundenwunsch", e.target.value)}>
                    {KUNDENWUENSCHE.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="bo-svc-feld">
                  <span>{T.melden.prioritaet}</span>
                  <select value={w.prioritaet} onChange={(e) => setze("prioritaet", e.target.value)}>
                    {PRIORITAETEN.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="bo-svc-feld">
                  <span>{T.melden.produkt}</span>
                  <input value={w.produkt_name} onChange={(e) => setze("produkt_name", e.target.value)} />
                </label>
                <label className="bo-svc-feld">
                  <span>{T.melden.seriennummer}</span>
                  <input value={w.seriennummer} onChange={(e) => setze("seriennummer", e.target.value)} />
                </label>
                <div className="bo-svc-feld sm:col-span-2">
                  <span>{T.melden.sachart}</span>
                  <div className="bo-svc-chips" role="radiogroup" aria-label={T.melden.sachart}>
                    {[
                      ["Beweglich", T.melden.beweglich],
                      ["Unbeweglich", T.melden.fest],
                    ].map(([v, t]) => (
                      <button key={v} type="button" role="radio" aria-checked={w.sachart === v} className="bo-svc-wahl" onClick={() => setze("sachart", v)}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {w.sachart === "Unbeweglich" && <span className="bo-svc-hinweis">{T.melden.festTip}</span>}
                </div>
              </div>
            </details>
            <p className="bo-svc-hinweis">{w.kontakt?.unternehmer ? T.melden.unternehmerHinweis : T.melden.gewaehrleistungOhne}</p>
          </>
        )}
      </form>
    </Sheet>
  );
}

export { anzeigeText };
