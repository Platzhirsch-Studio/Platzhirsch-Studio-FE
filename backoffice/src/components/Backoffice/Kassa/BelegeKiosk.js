"use client";
// Kassa – Belege heute / Beleg suchen (Team B-KAS, Konzept §3.9, §3.6 Storno, §3.5 Rücknahme). Links die Belege
// des Tages als ruhige Tabelle in einer Kachel (Zeile 64, Auswahl = Fläche + Tinte-Kante), rechts die
// Bon-Vorschau mit Aktionen: Nachdruck · Per E-Mail · Stornieren (Grund, Freigabe am Ende) · Zurücknehmen.
// Gesperrte Wege nennen ihren Grund als Text (K-00f); der Bon-QR-Scan öffnet den Beleg direkt.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, Gift, Mail, Printer, Receipt, RotateCcw, Search, Undo2, TriangleAlert } from "lucide-react";
import KioskShell from "../Kiosk/KioskShell";
import { useToast } from "../Toast";
import Leer from "../Leer";
import { Pille } from "../StatusBadge";
import Sheet from "./Sheet";
import Freigabe from "./Freigabe";
import { euro, menge as mengeText } from "@/lib/backoffice/kassa/betraege";
import { stornoGesperrt } from "@/lib/backoffice/kassa/regeln";
import { erkennen } from "@/lib/backoffice/kassa/codes";
import { BELEGART_TITEL, KIOSK, ZAHLART_BACKEND_TITEL } from "@/lib/backoffice/kassa/texte";
import { belegDatenAction, belegDruckenAction, belegMailenAction, belegeHeuteAction, stornoAction } from "@/lib/backoffice/kassa/actions";
import "./kassa.css";

const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const ZI = { Bar: Banknote, "Karte Stripe Terminal": CreditCard, "Karte extern": CreditCard, Gutschein: Gift };
const uhr = (dt) => String(dt || "").slice(11, 16);

export default function BelegeKiosk({ kontext, belege: start, leitung, faehig, benutzer, auswahl: startAuswahl, retoure }) {
  return (
    <KioskShell titel={kontext.kasse_doc?.bezeichnung || KIOSK.titel} geraet={{ name: kontext.kasse_doc?.standort || "" }} benutzer={benutzer} kontext={KIOSK.belege.titel} zurueckHref="/kassa" hilfe={[]}>
      <Inhalt kontext={kontext} start={start} leitung={leitung} faehig={faehig} startAuswahl={startAuswahl} retoure={retoure} />
    </KioskShell>
  );
}

function Inhalt({ kontext, start, leitung, faehig, startAuswahl, retoure }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [belege, setBelege] = useState(start);
  const [q, setQ] = useState("");
  const [wahl, setWahl] = useState(startAuswahl || start[0]?.name || null);
  const [doc, setDoc] = useState(null);
  const [storno, setStorno] = useState(null); // {grund}
  const [freigabe, setFreigabe] = useState(null);
  const [mail, setMail] = useState(null);

  const laden = useCallback(async (name) => {
    if (!name) return setDoc(null);
    const r = await belegDatenAction({ name });
    setDoc(r.ok ? r.daten : null);
    if (!r.ok) zeige(r.message, { art: "fehler" });
  }, [zeige]);
  useEffect(() => {
    laden(wahl); // eslint-disable-line react-hooks/set-state-in-effect -- lädt den gewählten Beleg vom Server
  }, [wahl, laden]);

  const neuLaden = async () => {
    const r = await belegeHeuteAction({ kasse: kontext.kasse });
    if (r.ok) setBelege(r.daten);
  };

  const sicht = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return belege;
    return belege.filter((b) => [b.name, String(b.belegnummer), b.kunde_name].some((x) => String(x || "").toLowerCase().includes(t)));
  }, [belege, q]);

  const suchen = (e) => {
    if (e.key !== "Enter") return;
    const c = q.trim();
    const er = erkennen(c);
    if (er.art === "kassenbeleg" || er.art === "rksv_qr" || /^\d+$/.test(c)) {
      const treffer = belege.find((b) => b.name === er.wert || String(b.belegnummer) === c);
      setWahl(treffer?.name || er.wert);
    }
  };

  const gesperrt = doc ? stornoGesperrt({ ...doc, storniert: !!doc.storniert_durch }, { terminal_erstatten: faehig.terminal_erstatten?.an, storno_ursprung: faehig.storno_ursprung?.an }) : null;

  const stornieren = async (fg = null) => {
    const grund = storno.grund === "Sonstiges" ? storno.text?.trim() || "" : storno.grund;
    const r = await stornoAction({ beleg: doc.name, grund, freigabe: fg });
    if (r.ok) {
      setStorno(null);
      setFreigabe(null);
      zeige(KIOSK.storno.fertig(r.daten.belegnummer), { art: "ok" });
      await neuLaden();
      setWahl(r.daten.beleg);
      return { ok: true };
    }
    if (r.code === "freigabe") {
      setFreigabe({ gruende: r.daten?.gruende || [] });
      return { ok: false, message: fg ? r.message : undefined };
    }
    if (fg) return { ok: false, message: r.message };
    zeige(r.message, { art: "fehler" });
    return { ok: false };
  };

  return (
    <div className="bo-ka" data-testid="kassa-belege">
      <div className="bo-ka-zwei">
        <section className="bo-ka-kachel" aria-label={KIOSK.belege.titel}>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="bo-titel-gross flex-1" style={{ fontSize: 28, lineHeight: "34px" }}>{KIOSK.belege.titel}</h1>
            <span className="bo-ka-muted text-[13px]">{belege.length} · {euro(belege.filter((b) => !b.trainings).reduce((a, b) => a + (b.gesamt_cent || 0), 0))}</span>
          </div>
          <label className="bo-ka-suche__feld" style={{ marginBottom: 8 }}>
            <Search size={20} strokeWidth={1.75} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={suchen} placeholder={KIOSK.belege.suchen} aria-label={KIOSK.belege.suchen} data-testid="belege-suche" data-fokus-rahmen="pille" />
          </label>
          {sicht.length === 0 ? (
            <Leer art={q ? "gefiltert" : "leer"} titel={q ? undefined : KIOSK.belege.leer} text={q ? undefined : KIOSK.belege.leerText} groesse="karte" />
          ) : (
            <div className="bo-ka-tabelle" role="listbox" aria-label={KIOSK.belege.titel}>
              {sicht.map((b) => (
                <div key={b.name} role="option" tabIndex={0} aria-selected={wahl === b.name} className="bo-ka-tzeile" onClick={() => setWahl(b.name)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setWahl(b.name))} data-testid="beleg-zeile">
                  <span>
                    <span className="bo-ka-tzeile__zeit block">{uhr(b.datum_uhrzeit)}</span>
                    <span className="bo-ka-tzeile__nr block">Nr. {b.belegnummer}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium">{b.kunde_name || BELEGART_TITEL[b.belegart] || b.belegart}</span>
                    <span className="flex gap-1.5 mt-0.5 text-bo-text-soft">
                      {(b.zahlarten || []).map((z, i) => {
                        const I = ZI[z] || Receipt;
                        return <I key={i} {...s16} />;
                      })}
                      <span className="text-[12px]">{b.positionen_anzahl ? `${b.positionen_anzahl} Pos.` : ""}</span>
                    </span>
                  </span>
                  <span>
                    {b.storniert_durch ? <Pille material="stein">{KIOSK.belege.storniert}</Pille> : b.belegart === "Stornobeleg" ? <Pille material="eiche">{BELEGART_TITEL.Stornobeleg}</Pille> : b.trainings ? <Pille material="messing">{KIOSK.belege.training}</Pille> : null}
                  </span>
                  <span className="bo-ka-num font-semibold text-[15px] text-right">{euro(b.gesamt_cent)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="bo-ka-korb" style={{ position: "sticky", top: 92, maxHeight: "calc(100dvh - 120px)" }} aria-label="Beleg" data-testid="beleg-vorschau">
          {!doc ? (
            <div className="bo-ka-korb__leer">
              <span className="bo-ka-korb__leer-ico"><Receipt size={24} strokeWidth={1.5} aria-hidden="true" /></span>
              <b>{KIOSK.belege.oeffnen}</b>
            </div>
          ) : (
            <>
              <div className="bo-ka-korb__kopf">
                <h2>
                  {BELEGART_TITEL[doc.belegart] || doc.belegart} {doc.belegnummer}
                </h2>
                <span className="bo-ka-muted text-[13px]">{String(doc.datum_uhrzeit).slice(0, 16).replace(/^(\d{4})-(\d\d)-(\d\d)/, "$3.$2.$1")}</span>
              </div>
              {doc.storniert_durch && <p className="bo-ka-hinweis" data-ton="warnung">{`Storniert durch ${doc.storniert_durch}`}</p>}
              {doc.storno_von && <p className="bo-ka-hinweis">{`Storno von ${doc.storno_von}${doc.storno_grund ? ` · ${doc.storno_grund}` : ""}`}</p>}
              <div className="bo-ka-liste">
                {(doc.positionen || []).map((p) => (
                  <div key={p.name || p.idx} className="bo-ka-zeile" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}>
                    <span className="bo-ka-zeile__txt">
                      <span className="bo-ka-strong">{p.bezeichnung}</span>
                      <span className="bo-ka-muted">{mengeText(p.menge)} × {euro(p.einzel_brutto_cent)}</span>
                    </span>
                    <span className="bo-ka-num bo-ka-strong">{euro(p.brutto_cent)}</span>
                  </div>
                ))}
              </div>
              <div className="bo-ka-summen">
                {(doc.zahlarten || []).map((z) => (
                  <div key={z.idx} className="bo-ka-sumrow bo-ka-sumrow--klein">
                    <span>{ZAHLART_BACKEND_TITEL[z.zahlart] || z.zahlart}{z.retour_cent ? ` · Rückgeld ${euro(z.retour_cent)}` : ""}</span>
                    <span className="bo-ka-num">{euro(z.betrag_cent)}</span>
                  </div>
                ))}
                <div className="bo-ka-sumrow bo-ka-sumrow--total">
                  <span>{KIOSK.korb.gesamt}</span>
                  <span className="bo-ka-num">{euro(doc.gesamt_cent)}</span>
                </div>
              </div>
              <div className="bo-ka-reihe">
                <button type="button" className="bo-ka-zweit" onClick={async () => {
                  const r = await belegDruckenAction({ beleg: doc.name });
                  zeige(r.ok ? KIOSK.ergebnis.gedruckt : r.message, { art: r.ok ? "ok" : "fehler" });
                }} data-testid="beleg-nachdruck">
                  <Printer {...s16} />
                  {KIOSK.belege.nachdruck}
                </button>
                <button type="button" className="bo-ka-zweit" onClick={() => setMail({ adresse: doc.kundenbeleg_email || "" })}>
                  <Mail {...s16} />
                  {KIOSK.belege.mail}
                </button>
              </div>
              <div className="bo-ka-reihe">
                <button type="button" className="bo-ka-zweit bo-ka-zweit--rand" disabled={!!gesperrt} onClick={() => setStorno({ grund: null })} data-testid="beleg-stornieren">
                  <Undo2 {...s16} />
                  {KIOSK.belege.stornieren}
                </button>
                <button type="button" className="bo-ka-zweit bo-ka-zweit--rand" disabled={!faehig.retoure?.an || !!doc.storniert_durch || doc.belegart !== "Standard"} onClick={() => router.push(`/kassa/retoure?beleg=${encodeURIComponent(doc.name)}`)} data-testid="beleg-zuruecknehmen">
                  <RotateCcw {...s16} />
                  {KIOSK.belege.zuruecknehmen}
                </button>
              </div>
              {gesperrt && gesperrt !== "bereits" && (
                <p className="bo-ka-grund">
                  <TriangleAlert {...s16} style={{ display: "inline", marginRight: 6, verticalAlign: "-3px" }} />
                  {KIOSK.storno.gesperrt[gesperrt]}
                </p>
              )}
              {!faehig.retoure?.an && <p className="bo-ka-grund">{faehig.retoure?.grund} – {faehig.retoure?.ersatz}</p>}
            </>
          )}
        </aside>
      </div>

      <Sheet offen={!!storno && !freigabe} onSchliessen={() => setStorno(null)} titel={`${KIOSK.storno.titel} ${doc?.belegnummer || ""}`} text={doc ? `${euro(doc.gesamt_cent)} · ${(doc.zahlarten || []).map((z) => ZAHLART_BACKEND_TITEL[z.zahlart] || z.zahlart).join(" + ")}` : ""} breit testid="storno-dialog">
        <p className="bo-ka-label">{KIOSK.storno.grund}</p>
        <div className="bo-ka-chips" role="radiogroup" aria-label={KIOSK.storno.grund}>
          {KIOSK.storno.gruende.map((g) => (
            <button key={g} type="button" role="radio" aria-checked={storno?.grund === g} className="bo-ka-chip" onClick={() => setStorno((s) => ({ ...s, grund: g }))} data-testid="storno-grund">
              {g}
            </button>
          ))}
        </div>
        {storno?.grund === "Sonstiges" && <input className="bo-ka-eingabe" data-scan="nein" placeholder={KIOSK.storno.sonstiges} value={storno.text || ""} onChange={(e) => setStorno((s) => ({ ...s, text: e.target.value }))} />}
        <p className="bo-ka-hinweis">
          <RotateCcw {...s16} />
          <span>
            {KIOSK.storno.kundeWill}{" "}
            {faehig.retoure?.an && doc && (
              <button type="button" className="underline font-semibold" onClick={() => router.push(`/kassa/retoure?beleg=${encodeURIComponent(doc.name)}`)}>
                {KIOSK.storno.zuruecknehmen}
              </button>
            )}
          </span>
        </p>
        <div className="bo-ka-reihe">
          <button type="button" className="bo-ka-zweit" onClick={() => setStorno(null)}>{KIOSK.abbrechen}</button>
          <button type="button" className="bo-ka-primaer" disabled={!storno?.grund || (storno.grund === "Sonstiges" && !(storno.text || "").trim())} onClick={() => stornieren()} data-testid="storno-ok">
            {KIOSK.storno.knopf}
          </button>
        </div>
      </Sheet>
      <Freigabe key={freigabe ? "f" : "z"} offen={!!freigabe} gruende={freigabe?.gruende || []} zusammenfassung={doc ? `${KIOSK.storno.titel} ${doc.belegnummer} · ${euro(doc.gesamt_cent)}` : ""} leitung={leitung} onFreigabe={(f) => stornieren(f)} onAbbrechen={() => setFreigabe(null)} />
      <Sheet offen={!!mail} onSchliessen={() => setMail(null)} titel={KIOSK.belege.mail} breit>
        <input className="bo-ka-eingabe" type="email" data-scan="nein" data-autofokus placeholder={KIOSK.ergebnis.mailAdresse} value={mail?.adresse || ""} onChange={(e) => setMail({ adresse: e.target.value })} />
        <div className="bo-ka-reihe">
          <button type="button" className="bo-ka-zweit" onClick={() => setMail(null)}>{KIOSK.abbrechen}</button>
          <button type="button" className="bo-ka-primaer" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail?.adresse || "")} onClick={async () => {
            const r = await belegMailenAction({ beleg: doc.name, email: mail.adresse });
            zeige(r.ok ? KIOSK.ergebnis.mailGesendet(mail.adresse) : r.message, { art: r.ok ? "ok" : "fehler" });
            if (r.ok) setMail(null);
          }}>{KIOSK.ergebnis.mailSenden}</button>
        </div>
      </Sheet>
      {retoure && !faehig.retoure?.an && <p className="sr-only" role="status">{faehig.retoure?.grund}</p>}
    </div>
  );
}
