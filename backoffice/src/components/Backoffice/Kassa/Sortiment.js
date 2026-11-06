"use client";
// Kassa – linke Spalte (Team B-KAS, Lounge §7.4 + Konzept §3.1): EIN Suchfeld „Artikel, Kunde, Karte …“ als
// Fokus-Heimat (combobox mit gruppierten Treffern, Mengenvorwahl „3 ×“), runde Kategorien-Kacheln (60) und
// Produktkacheln mit Freisteller auf Leinen-Grund, Lager-Chip, Korb-Zähler (Feder-Pop) und rundem Plus.
// Eine Kachel ist EIN Knopf (kein verschachteltes Ziel, K36); das Plus ist Teil davon.

import Image from "next/image";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { Flame, Gem, Gift, Keyboard, Lamp, Layers, LayoutGrid, Package, Plus, ScanLine, UserRound, UserPlus, Wine } from "lucide-react";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { suchbar } from "@/lib/backoffice/kassa/codes";
import { KIOSK } from "@/lib/backoffice/kassa/texte";
import { sucheAction } from "@/lib/backoffice/kassa/actions";

const ICONS = { LayoutGrid, Lamp, Flame, Wine, Gem, Layers, Gift };
const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };

function Bild({ src, groesse = "220px", alt = "" }) {
  if (!src) return <Package size={28} strokeWidth={1.5} aria-hidden="true" />;
  return <Image src={src} alt={alt} fill sizes={groesse} unoptimized={src.startsWith("/api/")} />;
}

/**
 * Suchfeld als combobox (§2.4). Enter übernimmt den ersten Artikel bzw. den gewählten Treffer.
 * Über die Ref: fokus(), setzeText(t), kundenfilter().
 */
export const Suchfeld = forwardRef(function Suchfeld({ gesperrt, menge, onMenge, onArtikel, onKunde, onCode, kundenfilter, setKundenfilter, grob }, ref) {
  const id = useId();
  const input = useRef(null);
  const [text, setText] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [laedt, setLaedt] = useState(false);
  const [wahl, setWahl] = useState(0);
  const [tippen, setTippen] = useState(false);
  const lauf = useRef(0);

  useImperativeHandle(ref, () => ({
    fokus: () => input.current?.focus({ preventScroll: true }),
    tippen: () => {
      setTippen(true);
      setTimeout(() => input.current?.focus(), 0);
    },
    leeren: () => {
      setText("");
      setTreffer(null);
    },
    element: () => input.current,
  }));

  useEffect(() => {
    const t = text.trim();
    const q = t.replace(/^\d+\s*[*x×]\s*/i, "");
    if (!suchbar(q)) return;
    const nr = ++lauf.current;
    const timer = setTimeout(async () => {
      setLaedt(true);
      const r = await sucheAction({ q });
      if (nr !== lauf.current) return;
      setLaedt(false);
      setWahl(0);
      setTreffer(r.ok ? { artikel: kundenfilter ? [] : r.daten.artikel, kunden: r.daten.kunden, q } : { artikel: [], kunden: [], q });
    }, 120);
    return () => clearTimeout(timer);
  }, [text, kundenfilter]);

  const sichtbar = !!treffer && suchbar(text.trim().replace(/^\d+\s*[*x×]\s*/i, ""));
  const liste = sichtbar ? [...treffer.artikel.map((a) => ({ art: "artikel", a })), ...treffer.kunden.map((k) => ({ art: "kunde", k }))] : [];
  const uebernimm = (e) => {
    if (!e) return;
    if (e.art === "artikel") onArtikel(e.a);
    else onKunde(e.k);
    setText("");
    setTreffer(null);
    setKundenfilter(false);
    input.current?.focus({ preventScroll: true });
  };

  const taste = (e) => {
    if (e.key === "*" && /^\d{1,3}$/.test(text.trim())) {
      e.preventDefault();
      onMenge(Number(text.trim()));
      setText("");
      return;
    }
    if (e.key === "ArrowDown" && liste.length) {
      e.preventDefault();
      setWahl((w) => Math.min(liste.length - 1, w + 1));
    } else if (e.key === "ArrowUp" && liste.length) {
      e.preventDefault();
      setWahl((w) => Math.max(0, w - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (liste.length) uebernimm(liste[wahl] || liste[0]);
      else if (text.trim().length >= 4) {
        onCode(text.trim());
        setText("");
      }
    } else if (e.key === "Escape") {
      if (text || kundenfilter || menge > 1) {
        e.preventDefault();
        e.stopPropagation();
        setText("");
        setTreffer(null);
        setKundenfilter(false);
        onMenge(1);
      }
    }
  };

  const offen = sichtbar;
  return (
    <div className="bo-ka-suche">
      <label className="bo-ka-suche__feld">
        <ScanLine {...S} />
        {kundenfilter && <span className="bo-ka-suche__chip">Kunde:</span>}
        {menge > 1 && <span className="bo-ka-suche__chip" data-testid="kassa-mengenchip">{KIOSK.suche.mengenChip(menge)}</span>}
        <input
          ref={input}
          id={`${id}-q`}
          type="search"
          role="combobox"
          aria-expanded={offen}
          aria-controls={`${id}-liste`}
          aria-autocomplete="list"
          aria-label={KIOSK.suche.label}
          placeholder={KIOSK.suche.platzhalter}
          inputMode={grob && !tippen ? "none" : "search"}
          autoComplete="off"
          spellCheck={false}
          value={text}
          disabled={gesperrt}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={taste}
          onBlur={() => setTimeout(() => setTippen(false), 200)}
          data-testid="kassa-suche"
          data-fokus-rahmen="pille"
        />
        {grob && (
          <button type="button" className="bo-ka-suche__tippen" aria-pressed={tippen} onClick={() => {
            setTippen(true);
            setTimeout(() => input.current?.focus(), 0);
          }}>
            <Keyboard size={16} strokeWidth={1.75} aria-hidden="true" /> <span className="sr-only">{KIOSK.suche.tippen}</span>
          </button>
        )}
      </label>
      <button type="button" className="bo-ka-rund" aria-label={KIOSK.korb.kundeHinzu} aria-pressed={kundenfilter} onClick={() => {
        setKundenfilter(!kundenfilter);
        input.current?.focus();
      }} data-testid="kassa-kunde-suchen">
        <UserPlus {...S} />
      </button>
      {offen && (
        <div id={`${id}-liste`} role="listbox" className="bo-ka-treffer" aria-label={KIOSK.suche.label} data-testid="kassa-treffer">
          {liste.length === 0 && !laedt && (
            <p className="bo-ka-treffer__leer">
              {KIOSK.suche.keine(treffer.q)}
              <br />
              <small>{KIOSK.suche.keineHinweis}</small>
            </p>
          )}
          {treffer.artikel.length > 0 && (
            <div role="group" aria-label={KIOSK.suche.gruppen.artikel} className="bo-ka-treffer__gruppe">
              <p className="bo-ka-treffer__kopf" aria-hidden="true">{KIOSK.suche.gruppen.artikel}</p>
              {treffer.artikel.map((a, i) => (
                <div key={a.produkt} role="option" aria-selected={wahl === i} className="bo-ka-treffer__zeile" onPointerDown={(e) => e.preventDefault()} onClick={() => uebernimm({ art: "artikel", a })}>
                  <span className="bo-ka-treffer__bild"><Bild src={a.bild} groesse="44px" /></span>
                  <span className="min-w-0">
                    <span className="bo-ka-treffer__titel block truncate">{a.bezeichnung}</span>
                    <span className="bo-ka-treffer__unter block truncate">{[a.marke, a.ean].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="bo-ka-num bo-ka-strong">{a.einzel_brutto_cent ? euro(a.einzel_brutto_cent) : KIOSK.ohnePreis}</span>
                </div>
              ))}
            </div>
          )}
          {treffer.kunden.length > 0 && (
            <div role="group" aria-label={KIOSK.suche.gruppen.kunden} className="bo-ka-treffer__gruppe">
              <p className="bo-ka-treffer__kopf" aria-hidden="true">{KIOSK.suche.gruppen.kunden}</p>
              {treffer.kunden.map((k, j) => {
                const i = treffer.artikel.length + j;
                const offenSumme = [...(k.auftraege || []).map((a) => a.anzahlung_offen_cent || 0), ...(k.rechnungen || []).map((r) => r.offen_cent || 0)].reduce((s, x) => s + x, 0);
                return (
                  <div key={`${k.kontakt}-${j}`} role="option" aria-selected={wahl === i} className="bo-ka-treffer__zeile" onPointerDown={(e) => e.preventDefault()} onClick={() => uebernimm({ art: "kunde", k })}>
                    <span className="bo-ka-treffer__bild"><UserRound {...S} /></span>
                    <span className="min-w-0">
                      <span className="bo-ka-treffer__titel block truncate">{k.titel}</span>
                      <span className="bo-ka-treffer__unter block truncate">{[k.stufe && `Kundenkarte ${k.stufe}`, k.untertitel].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="bo-ka-muted text-[13px]">{offenSumme ? `${euro(offenSumme)} offen` : ""}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/** Runde Kategorien-Kacheln (Lounge §7.4). */
export function Kategorien({ kategorien, aktiv, onWahl }) {
  return (
    <nav className="bo-ka-kat" aria-label={KIOSK.kategorien}>
      {kategorien.map((k) => {
        const I = ICONS[k.icon] || LayoutGrid;
        return (
          <button key={k.id} type="button" className="bo-ka-kat__i" aria-pressed={aktiv === k.id} onClick={() => onWahl(k.id)} data-testid={`kassa-kat-${k.id}`}>
            <span className="bo-ka-kat__ico"><I size={24} strokeWidth={1.75} aria-hidden="true" /></span>
            <span className="bo-ka-kat__label">{k.titel}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Produktkacheln (Schnelltasten + Katalog der Kategorie). */
export function Produkte({ eintraege, mengeVon, onTipp, gesperrt }) {
  if (!eintraege.length) return <div className="bo-ka-sort__leer">{KIOSK.suche.keineHinweis}</div>;
  return (
    <ul className="bo-ka-prods" aria-label={KIOSK.sortiment} data-testid="kassa-produkte">
      {eintraege.map((p, i) => {
        const n = p.produkt ? mengeVon(p.produkt) : 0;
        const gs = p.aktion === "Gutschein Verkauf";
        const titel = p.bezeichnung;
        return (
          <li key={p.name || p.produkt} className="bo-ka-prod" style={{ "--i": i }}>
            <div className="bo-ka-prod__img">
              {gs ? (
                <span className="bo-ka-gutschein" aria-hidden="true">
                  <span>PLATZHIRSCH</span>
                  <b>{euro(p.betrag_cent).replace(",00", "")}</b>
                </span>
              ) : (
                <Bild src={p.bild} />
              )}
              {p.lager !== null && p.lager !== undefined && <span className="bo-ka-prod__lager">{KIOSK.lager(p.lager)}</span>}
              {n > 0 && (
                <span key={n} className="bo-ka-prod__n" aria-hidden="true">
                  {n}
                </span>
              )}
            </div>
            <div className="bo-ka-prod__txt">
              <p className="bo-ka-prod__marke">{gs ? "Platzhirsch" : p.marke || " "}</p>
              <p className="bo-ka-prod__name">{titel}</p>
              <div className="bo-ka-prod__foot">
                <span className="bo-ka-prod__preis">{p.betrag_cent ? euro(p.betrag_cent) : KIOSK.ohnePreis}</span>
                <span className="bo-ka-plus" aria-hidden="true">
                  <Plus {...S} />
                </span>
              </div>
            </div>
            <button
              type="button"
              className="bo-ka-prod__ganz"
              disabled={gesperrt}
              aria-label={`${KIOSK.hinzufuegen(titel)}${p.betrag_cent ? `, ${euro(p.betrag_cent)}` : ""}${n ? `, ${KIOSK.imKorb(n)}` : ""}`}
              onClick={() => onTipp(p)}
              data-testid="kassa-produkt"
              data-produkt={p.produkt || p.name}
            />
          </li>
        );
      })}
    </ul>
  );
}

export { Bild };
