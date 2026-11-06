"use client";
// Kassa – Warenkorb als schwebende Karte (Team B-KAS, Lounge §7.4): Kundin + Stufe, Leistungsvorteile als
// Chips (Antippen = vormerken, K-05; Kundenkarte ohne Geldwert), Positionen als `role="grid"` mit Roving-
// Tabindex (K-13) und Stepper, Summe mit enthaltener USt., Vorteil als Bon-Hinweis „inklusive“, Zahlart-
// Segment und EIN Primärknopf „Kassieren 1.059,00 €“ (64 hoch, F12).

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Check, ChevronDown, FileText, Gift, Lock, Minus, Package, PenLine, Plus, ShoppingBag, Sparkles, Ticket, Truck, X, ArrowLeftRight, CreditCard, Banknote, Wallet } from "lucide-react";
import Avatar from "../Avatar";
import Segment from "../Segment";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { STEUERSAETZE, euro, menge as mengeText } from "@/lib/backoffice/kassa/betraege";
import { KIOSK } from "@/lib/backoffice/kassa/texte";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
export const VORTEIL_ICON = { lieferung: Truck, pflege: Sparkles, event: Ticket };
const STUFE_KURZ = { Platzhirsch: "P", Select: "S", Plus: "P+", "Privé": "Pr" };

/** „Platzhirsch Plus“ / „Plus“ → „P+“ (Monogramm im Stufen-Chip). */
export function stufeKurz(stufe) {
  const s = String(stufe || "").replace(/^Platzhirsch\s+/, "");
  return STUFE_KURZ[s] || STUFE_KURZ[stufe] || s.slice(0, 2) || "P";
}

/** Anzeige der Stufe: immer mit „Platzhirsch“ davor, nie doppelt. */
export function stufeName(stufe) {
  const s = String(stufe || "").trim();
  if (!s) return "";
  return /^Platzhirsch/.test(s) ? s : `Platzhirsch ${s}`;
}

function ZeilenBild({ p }) {
  if (p.art === "Gutschein Verkauf") return <span className="bo-ka-zeile__img bo-ka-zeile__img--gs"><Gift {...S} /></span>;
  if (["Anzahlung", "Teilzahlung", "Schlusszahlung"].includes(p.art)) return <span className="bo-ka-zeile__img bo-ka-zeile__img--ico"><Wallet {...S} /></span>;
  if (p.art === "Freitext") return <span className="bo-ka-zeile__img bo-ka-zeile__img--ico"><PenLine {...S} /></span>;
  return <span className="bo-ka-zeile__img">{p.bild ? <Image src={p.bild} alt="" fill sizes="48px" unoptimized={p.bild.startsWith("/api/")} /> : <Package {...S} />}</span>;
}

/**
 * @param {object} p
 */
export default function Korb({ bon, summe, zahlart, setZahlart, zahlarten, gesperrt, kassierenGrund, onKassieren, onMenge, onEntfernen, onAktiv, onKundeEntfernen, onKundeSuchen, onVorteil, onOffen, onMenue, geparktAnzahl, faehig, sperre, onZeile, sucheFokus }) {
  const grid = useRef(null);
  const kunde = bon.kunde;
  const anzahl = bon.positionen.reduce((a, p) => a + (p.art === "Artikel" || p.art === "Freitext" ? p.menge : 1), 0);

  // Neue/aktive Zeile sichtbar halten (ohne Fokus zu stehlen).
  useEffect(() => {
    if (!bon.aktiv) return;
    grid.current?.querySelector(`[data-id="${bon.aktiv}"]`)?.scrollIntoView({ block: "nearest" });
  }, [bon.aktiv, bon.geaendert]);

  const zeilenTaste = (e, p, i) => {
    const zeilen = bon.positionen;
    const fokus = (j) => {
      const z = zeilen[Math.max(0, Math.min(zeilen.length - 1, j))];
      if (!z) return;
      onAktiv(z.id);
      requestAnimationFrame(() => grid.current?.querySelector(`[data-id="${z.id}"]`)?.focus());
    };
    if (e.key === "ArrowDown") {
      e.preventDefault();
      fokus(i + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      fokus(i - 1);
    } else if (e.key === "+") {
      e.preventDefault();
      onMenge(p.id, 1);
    } else if (e.key === "-") {
      e.preventDefault();
      onMenge(p.id, -1);
    } else if (e.key === "Delete") {
      e.preventDefault();
      onEntfernen(p.id);
    } else if (e.key === "Enter" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      onZeile(p.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      sucheFokus();
    }
  };

  const saetze = Object.entries(summe.je_satz || {}).filter(([, s]) => s.ust_cent);
  const vorgemerkt = (kunde?.vorteile || []).filter((v) => bon.vorgemerkt.includes(v.vorteil));

  return (
    <aside className="bo-ka-korb" aria-label={KIOSK.korb.titel} data-testid="kassa-korb">
      {kunde ? (
        <div className="bo-ka-kunde" data-testid="kassa-kunde">
          <Avatar name={kunde.titel} groesse={44} ring={false} material="cognac" dekorativ />
          <div className="bo-ka-kunde__name">
            <p>{kunde.titel}</p>
            <p className="bo-ka-kunde__stufe">
              {kunde.stufe ? (
                <>
                  <span className="bo-ka-chip-stufe" aria-hidden="true">{stufeKurz(kunde.stufe)}</span>
                  {stufeName(kunde.stufe)}
                </>
              ) : (
                kunde.untertitel || KIOSK.korb.ohneKunde
              )}
            </p>
          </div>
          <button type="button" className="bo-ka-rund bo-ka-rund--s" aria-label={KIOSK.korb.kundeWechseln} onClick={onKundeSuchen} disabled={gesperrt}>
            <ArrowLeftRight {...s16} />
          </button>
          <button type="button" className="bo-ka-rund bo-ka-rund--s" aria-label={KIOSK.korb.kundeEntfernen} onClick={onKundeEntfernen} disabled={gesperrt} data-testid="kassa-kunde-weg">
            <X {...s16} />
          </button>
        </div>
      ) : (
        <button type="button" className="bo-ka-kunde bo-ka-kunde--leer bo-ka-druck" onClick={onKundeSuchen} disabled={gesperrt}>
          <span className="bo-ka-rund bo-ka-rund--s" aria-hidden="true" style={{ boxShadow: "none", background: "var(--tile-2)" }}>
            <Plus {...s16} />
          </span>
          <span className="flex-1 text-left">{KIOSK.korb.ohneKunde} · Kundenkarte scannen</span>
        </button>
      )}
      {kunde && ((kunde.auftraege || []).some((a) => a.anzahlung_offen_cent > 0) || (kunde.rechnungen || []).length > 0) && (
        <div className="bo-ka-kunde__offen">
          {(kunde.auftraege || []).filter((a) => a.anzahlung_offen_cent > 0).slice(0, 2).map((a) => (
            <button key={a.auftrag} type="button" className="bo-ka-ochip bo-ka-druck" onClick={() => onOffen({ art: "Anzahlung", auftrag: a.auftrag, offen_cent: a.anzahlung_offen_cent, steuersatz: a.steuersatz })} disabled={gesperrt}>
              <Wallet {...s16} />
              {KIOSK.korb.offen("Anzahlung", a.auftrag, euro(a.anzahlung_offen_cent))}
            </button>
          ))}
          {(kunde.rechnungen || []).slice(0, 2).map((r) => (
            <button key={r.rechnung} type="button" className="bo-ka-ochip bo-ka-druck" onClick={() => onOffen({ art: "Teilzahlung", rechnung: r.rechnung, offen_cent: r.offen_cent, steuersatz: r.steuersatz })} disabled={gesperrt}>
              <FileText {...s16} />
              {KIOSK.korb.offen("Rechnung", r.rechnung, euro(r.offen_cent))}
            </button>
          ))}
        </div>
      )}
      {kunde?.vorteile?.length > 0 && (
        <div className="bo-ka-vorteile" role="group" aria-label={KIOSK.korb.vorteile}>
          {kunde.vorteile.map((v) => {
            const I = VORTEIL_ICON[v.vorteil] || Sparkles;
            const an = bon.vorgemerkt.includes(v.vorteil);
            return (
              <button key={v.vorteil} type="button" className="bo-ka-vchip" aria-pressed={an} disabled={gesperrt || v.verfuegbar === false} onClick={() => onVorteil(v.vorteil)} data-testid="kassa-vorteil">
                {an ? <Check {...s16} /> : <I {...s16} />}
                {v.titel}
              </button>
            );
          })}
        </div>
      )}

      <div className="bo-ka-korb__kopf">
        <h2>{KIOSK.korb.titel}</h2>
        <div className="bo-ka-korb__werkzeuge">
          <span className="bo-ka-muted text-[13px]">{KIOSK.korb.artikel(anzahl)}</span>
          <Menue
            label="Bon"
            platzierung="unten-ende"
            ausloeser={(p) => (
              <button type="button" {...p} className="bo-ka-suche__tippen" style={{ display: "inline-flex", alignItems: "center", gap: 4 }} data-testid="kassa-bon-menue">
                Bon <ChevronDown {...s16} />
              </button>
            )}
          >
            <MenuePunkt icon="Pencil" kuerzel="F4" onWaehlen={() => onMenue("freitext")} deaktiviert={gesperrt}>
              Freitext
            </MenuePunkt>
            <MenuePunkt icon="Gift" kuerzel="F6" onWaehlen={() => onMenue("gutschein")} deaktiviert={gesperrt || !faehig.gutschein_verkauf?.an} grund={faehig.gutschein_verkauf?.an ? undefined : faehig.gutschein_verkauf?.grund}>
              Gutschein verkaufen
            </MenuePunkt>
            <MenueTrenner />
            <MenuePunkt icon="Inbox" kuerzel="⇧F6" onWaehlen={() => onMenue("parken")} deaktiviert={gesperrt || !bon.positionen.length}>
              {KIOSK.korb.parken}
            </MenuePunkt>
            <MenuePunkt icon="History" href="/kassa/geparkt">
              {KIOSK.geparkt(geparktAnzahl)}
            </MenuePunkt>
            <MenuePunkt icon="Monitor" onWaehlen={() => onMenue("display")}>
              {KIOSK.displayOeffnen}
            </MenuePunkt>
            <MenueTrenner />
            <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={() => onMenue("verwerfen")} deaktiviert={gesperrt || !bon.positionen.length}>
              {KIOSK.korb.verwerfen}
            </MenuePunkt>
          </Menue>
        </div>
      </div>

      {bon.positionen.length === 0 ? (
        <div className="bo-ka-korb__leer" data-testid="kassa-korb-leer">
          <span className="bo-ka-korb__leer-ico"><ShoppingBag size={24} strokeWidth={1.5} aria-hidden="true" /></span>
          <b>{KIOSK.korb.leer}</b>
          <span className="text-[14px]">{KIOSK.korb.leerText}</span>
        </div>
      ) : (
        <div ref={grid} className="bo-ka-liste" role="grid" aria-label={KIOSK.korb.titel} aria-rowcount={bon.positionen.length} data-testid="kassa-positionen">
          {bon.positionen.map((p, i) => {
            const betrag = Math.round(p.einzel_brutto_cent * p.menge) * (p.art === "Gutschein Einloesung" ? -1 : 1);
            const aktiv = bon.aktiv === p.id;
            const stueck = p.art === "Artikel" || p.art === "Freitext";
            return (
              <div
                key={p.id}
                role="row"
                aria-rowindex={i + 1}
                aria-selected={aktiv}
                tabIndex={aktiv || (!bon.aktiv && i === bon.positionen.length - 1) ? 0 : -1}
                data-id={p.id}
                className="bo-ka-zeile"
                onFocus={() => !aktiv && onAktiv(p.id)}
                onKeyDown={(e) => zeilenTaste(e, p, i)}
                aria-label={KIOSK.korb.zeile(p.bezeichnung, mengeText(p.menge), euro(betrag))}
                data-testid="kassa-zeile"
              >
                <span role="gridcell" aria-hidden="true">
                  <ZeilenBild p={p} />
                </span>
                <span role="gridcell" className="bo-ka-zeile__txt">
                  <span className="bo-ka-strong">{p.bezeichnung}</span>
                  <span className="bo-ka-muted">
                    {[p.art !== "Artikel" ? KIOSK_ART(p) : p.marke, p.menge > 1 ? `${mengeText(p.menge)} × ${euro(p.einzel_brutto_cent)}` : ""].filter(Boolean).join(" · ") || " "}
                  </span>
                </span>
                <span role="gridcell" className="bo-ka-zeile__r">
                  <span className="bo-ka-num bo-ka-strong">{euro(betrag)}</span>
                  {stueck ? (
                    <span className="bo-ka-stepper" role="group" aria-label={KIOSK.korb.menge(p.bezeichnung)}>
                      <button type="button" tabIndex={-1} aria-label={KIOSK.korb.weniger} onClick={() => onMenge(p.id, -1)} disabled={gesperrt}>
                        <Minus {...s16} />
                      </button>
                      <span className="bo-ka-num" aria-hidden="true">{mengeText(p.menge)}</span>
                      <button type="button" tabIndex={-1} aria-label={KIOSK.korb.mehr} onClick={() => onMenge(p.id, 1)} disabled={gesperrt}>
                        <Plus {...s16} />
                      </button>
                    </span>
                  ) : (
                    <span className="bo-ka-stepper" role="group" aria-label={KIOSK.korb.entfernen}>
                      <button type="button" tabIndex={-1} aria-label={`${p.bezeichnung} ${KIOSK.korb.entfernen}`} onClick={() => onEntfernen(p.id)} disabled={gesperrt}>
                        <X {...s16} />
                      </button>
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="bo-ka-summen" data-testid="kassa-summen">
        <div className="bo-ka-sumrow">
          <span>{KIOSK.korb.zwischensumme}</span>
          <span className="bo-ka-num">{euro(summe.gesamt_cent)}</span>
        </div>
        {saetze.map(([s, w]) => (
          <div key={s} className="bo-ka-sumrow bo-ka-sumrow--klein">
            <span>{KIOSK.korb.darinUst(`${STEUERSAETZE[s] / 100} %`)}</span>
            <span className="bo-ka-num">{euro(w.ust_cent)}</span>
          </div>
        ))}
        {vorgemerkt.map((v) => (
          <div key={v.vorteil} className="bo-ka-sumrow bo-ka-sumrow--vorteil">
            <span>
              <Gift {...s16} />
              <span className="truncate">{KIOSK.korb.vorteilAm(v.titel)}</span>
            </span>
            <span>{KIOSK.korb.inklusive}</span>
          </div>
        ))}
        <div className="bo-ka-sumrow bo-ka-sumrow--total">
          <span>{KIOSK.korb.gesamt}</span>
          <span className="bo-ka-num" aria-live="off" data-testid="kassa-gesamt">{euro(summe.gesamt_cent)}</span>
        </div>
      </div>
      <Segment
        label={KIOSK.zahlart}
        breit
        wert={zahlart}
        onWechsel={setZahlart}
        optionen={zahlarten.map((z) => ({ wert: z.wert, titel: z.titel, icon: z.icon, deaktiviert: z.deaktiviert || gesperrt, testid: `kassa-zahlart-${z.wert}` }))}
        testid="kassa-zahlart"
      />
      {kassierenGrund && <p className="bo-ka-grund">{kassierenGrund}</p>}
      <button type="button" className="bo-ka-pay" onClick={onKassieren} disabled={gesperrt || !bon.positionen.length || !!kassierenGrund} style={sperre ? { pointerEvents: "none" } : undefined} data-testid="kassa-kassieren">
        <span className="inline-flex items-center gap-2">
          {gesperrt ? <Lock {...S} /> : zahlart === "karte" ? <CreditCard {...S} /> : zahlart === "bar" ? <Banknote {...S} /> : null}
          {KIOSK.zahlung.kassieren}
          <kbd>F12</kbd>
        </span>
        <span className="bo-ka-num">{euro(summe.gesamt_cent)}</span>
      </button>
    </aside>
  );
}

function KIOSK_ART(p) {
  if (p.art === "Gutschein Verkauf") return "Gutschein";
  if (p.art === "Freitext") return p.zusatz || "Freitext";
  if (p.auftrag || p.bezug) return p.bezug || p.auftrag;
  return p.art;
}
