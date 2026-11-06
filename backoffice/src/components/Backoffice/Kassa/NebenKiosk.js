"use client";
// Kassa – Geparkte Bons (Konzept §3.13, A11) und Rücknahme-Assistent (Konzept §3.5, A13, Fähigkeit `retoure`).
// Team B-KAS. Geparkte Bons liegen je Gerät und Kasse in IndexedDB (speicher.js). Die Rücknahme lädt die
// Originalzeilen (rücknehmbare Menge), Grund bestimmt den Weg: Umtausch/Kulanz → Gutschein, Mangel/Rücktritt →
// ursprünglicher Zahlungsweg; bar außerhalb der Regel nur mit Freigabe der Leitung (Freigabe am Ende).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, History, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import KioskShell from "../Kiosk/KioskShell";
import { useToast } from "../Toast";
import Leer from "../Leer";
import Knopf from "../Knopf";
import Freigabe from "./Freigabe";
import { Haken } from "./Sheet";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { idempotenzSchluessel, neueId } from "@/lib/backoffice/kassa/bon";
import { KIOSK, ZAHLART_BACKEND_TITEL } from "@/lib/backoffice/kassa/texte";
import { kassierenAction, retoureLadenAction } from "@/lib/backoffice/kassa/actions";
import { lese, schluessel, schreibe } from "./speicher";
import "./kassa.css";

const s16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

function Rahmen({ kontext, benutzer, titel, children }) {
  return (
    <KioskShell titel={kontext.kasse_doc?.bezeichnung || KIOSK.titel} geraet={{ name: kontext.kasse_doc?.standort || "" }} benutzer={benutzer} kontext={titel} zurueckHref="/kassa" hilfe={[]}>
      {children}
    </KioskShell>
  );
}

// ------------------------------------------------------------------- Geparkt

export function GeparktKiosk({ kontext, benutzer }) {
  return (
    <Rahmen kontext={kontext} benutzer={benutzer} titel={KIOSK.geparktSeite.titel}>
      <Geparkt kontext={kontext} benutzer={benutzer} />
    </Rahmen>
  );
}

function Geparkt({ kontext, benutzer }) {
  const router = useRouter();
  const [liste, setListe] = useState(null);
  useEffect(() => {
    lese(schluessel.geparkt(kontext.kasse)).then((l) => setListe(Array.isArray(l) ? l : []));
  }, [kontext.kasse]);
  const speichern = async (l) => {
    setListe(l);
    await schreibe(schluessel.geparkt(kontext.kasse), l);
  };
  const weiter = async (b, i) => {
    await schreibe(schluessel.entwurf(kontext.kasse, benutzer.email), { ...b, geparkt_am: undefined, von: undefined });
    await speichern(liste.filter((_, j) => j !== i));
    router.push("/kassa");
  };
  return (
    <div className="bo-ka bo-ka-seite" style={{ maxWidth: 880 }} data-testid="kassa-geparkt">
      <div className="bo-ka-seite__kopf">
        <h1>{KIOSK.geparktSeite.titel}</h1>
      </div>
      {liste === null ? null : liste.length === 0 ? (
        <section className="bo-ka-kachel">
          <Leer titel={KIOSK.geparktSeite.leer} text={KIOSK.geparktSeite.leerText} icon="History" groesse="karte" aktion={<Knopf href="/kassa">{KIOSK.titel}</Knopf>} />
        </section>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {liste.map((b, i) => {
            const summe = b.positionen.reduce((a, p) => a + Math.round(p.einzel_brutto_cent * p.menge), 0);
            return (
              <article key={b.entwurf_uuid || i} className="bo-ka-kachel flex flex-col gap-2" style={{ "--i": i }}>
                <div className="flex items-center gap-2">
                  <History {...s16} />
                  <span className="bo-ka-muted text-[13px]">{KIOSK.geparktSeite.von(b.von || "", new Date(b.geparkt_am).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }))}</span>
                </div>
                <p className="text-[17px] font-semibold">{b.kunde?.titel || KIOSK.korb.ohneKunde}</p>
                <p className="bo-ka-muted text-[13px] line-clamp-2">{b.positionen.map((p) => `${p.menge} × ${p.bezeichnung}`).join(", ")}</p>
                <p className="bo-ka-num text-[28px] font-semibold tracking-tight">{euro(summe)}</p>
                <div className="bo-ka-reihe">
                  <button type="button" className="bo-ka-zweit bo-ka-zweit--rand" onClick={() => speichern(liste.filter((_, j) => j !== i))} aria-label={`${KIOSK.geparktSeite.verwerfen}: ${b.kunde?.titel || ""}`}>
                    <Trash2 {...s16} />
                  </button>
                  <button type="button" className="bo-ka-primaer" style={{ height: 48 }} onClick={() => weiter(b, i)} data-testid="geparkt-weiter">
                    {KIOSK.geparktSeite.weiter}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------- Retoure

export function RetoureKiosk({ kontext, benutzer, daten, leitung, faehig }) {
  return (
    <Rahmen kontext={kontext} benutzer={benutzer} titel={KIOSK.retoure.titel}>
      <Retoure kontext={kontext} daten={daten} leitung={leitung} faehig={faehig} />
    </Rahmen>
  );
}

function Retoure({ kontext, daten, leitung, faehig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [menge, setMenge] = useState({});
  const [grund, setGrund] = useState(null);
  const [freigabe, setFreigabe] = useState(null);
  const [fertig, setFertig] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [key] = useState(() => idempotenzSchluessel(kontext.kasse, neueId("r")));

  if (!faehig.retoure?.an) {
    return (
      <div className="bo-ka bo-ka-seite" style={{ maxWidth: 720 }} data-testid="kassa-retoure">
        <section className="bo-ka-kachel">
          <Leer art="leer" titel={faehig.retoure?.titel || KIOSK.retoure.titel} text={`${faehig.retoure?.grund || ""} – ${faehig.retoure?.ersatz || ""}`} icon="RotateCcw" groesse="karte" aktion={<Knopf href="/kassa/belege">{KIOSK.belege.titel}</Knopf>} />
        </section>
      </div>
    );
  }
  if (!daten) {
    return (
      <div className="bo-ka bo-ka-seite" style={{ maxWidth: 720 }} data-testid="kassa-retoure">
        <section className="bo-ka-kachel">
          <Leer titel={KIOSK.retoure.titel} text={KIOSK.retoure.belegScannen} icon="ScanLine" groesse="karte" aktion={<Knopf href="/kassa/belege">{KIOSK.belege.titel}</Knopf>} />
        </section>
      </div>
    );
  }
  const zeilen = daten.zeilen || [];
  const g = KIOSK.retoure.gruende.find((x) => x.id === grund);
  const auswahl = Object.fromEntries(Object.entries(menge).filter(([, m]) => m > 0));
  const betrag = zeilen.reduce((a, z) => a + (menge[z.name] || 0) * Math.abs(z.einzel_brutto_cent), 0);
  const mitKarte = (daten.zahlarten || []).includes("Karte Stripe Terminal");

  const buchen = async (fg = null) => {
    setLaeuft(true);
    const v = await retoureLadenAction({ beleg: daten.beleg, auswahl, grund: g.titel });
    if (!v.ok) {
      setLaeuft(false);
      zeige(v.message, { art: "fehler" });
      return { ok: false };
    }
    const pos = v.daten.positionen || [];
    const summe = Math.abs(v.daten.betrag_cent);
    const gutschein = g.weg === "gutschein";
    const positionen = gutschein ? [...pos, { art: "Gutschein Verkauf", bezeichnung: "Gutschein aus Rücknahme", menge: 1, einzel_brutto_cent: summe, steuersatz: "Null 0" }] : pos;
    const zahlarten = gutschein ? [] : (v.daten.rueckzahlung || [{ zahlart: mitKarte ? "Karte Stripe Terminal" : "Bar", betrag_cent: -summe }]).map((z) => ({ zahlart: z.zahlart, betrag_cent: -Math.abs(z.betrag_cent) }));
    const r = await kassierenAction({ entwurf: { kasse: kontext.kasse, positionen, zahlarten, kontakt: daten.kontakt || undefined, retoure_original: daten.beleg }, idempotencyKey: key, freigabe: fg });
    setLaeuft(false);
    if (r.ok) {
      setFreigabe(null);
      setFertig({ ...r.daten, summe, gutschein });
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

  if (fertig) {
    return (
      <div className="bo-ka bo-ka-seite" style={{ maxWidth: 640 }} data-testid="kassa-retoure-fertig">
        <section className="bo-ka-kachel flex flex-col items-center text-center gap-2">
          <Haken />
          <h1 className="bo-titel">{KIOSK.ergebnis.beleg(fertig.belegnummer)}</h1>
          <p className="bo-ka-num text-[34px] font-semibold">{euro(fertig.summe)}</p>
          {(fertig.gutschein_codes || []).map((c) => (
            <p key={c.code} className="bo-ka-code">{c.code}</p>
          ))}
          {!fertig.gutschein && <p className="bo-ka-muted">{KIOSK.retoure.original}</p>}
          <button type="button" className="bo-ka-primaer" style={{ maxWidth: 320, marginTop: 12 }} onClick={() => router.push("/kassa")} data-autofokus>{KIOSK.titel}</button>
        </section>
      </div>
    );
  }

  return (
    <div className="bo-ka bo-ka-seite" data-testid="kassa-retoure">
      <div className="bo-ka-seite__kopf">
        <h1>{KIOSK.retoure.titel}</h1>
        <span className="bo-ka-muted">{`Beleg ${daten.beleg}${daten.kunde_name ? ` · ${daten.kunde_name}` : ""}`}</span>
      </div>
      <div className="bo-ka-zwei">
        <section className="bo-ka-kachel">
          <div className="flex items-center mb-2">
            <h2 className="flex-1">Positionen</h2>
            <button type="button" className="bo-ka-zweit" style={{ height: 40 }} onClick={() => setMenge(Object.fromEntries(zeilen.map((z) => [z.name, z.ruecknehmbar])))}>{KIOSK.retoure.alle}</button>
          </div>
          {zeilen.every((z) => !z.ruecknehmbar) && <p className="bo-ka-hinweis">{KIOSK.retoure.keine}</p>}
          <div className="bo-ka-tabelle">
            {zeilen.map((z) => (
              <div key={z.name} className="bo-ka-tzeile" style={{ gridTemplateColumns: "minmax(0,1fr) auto auto" }}>
                <span className="min-w-0">
                  <span className="block font-medium truncate">{z.bezeichnung}</span>
                  <span className="block bo-ka-muted text-[13px]">{z.ruecknehmbar} von {z.menge} rücknehmbar · {euro(Math.abs(z.einzel_brutto_cent))}</span>
                </span>
                <span className="bo-ka-stepper" style={{ height: 44 }} role="group" aria-label={`Menge ${z.bezeichnung}`}>
                  <button type="button" style={{ width: 44, height: 44 }} aria-label={KIOSK.korb.weniger} disabled={!menge[z.name]} onClick={() => setMenge((m) => ({ ...m, [z.name]: Math.max(0, (m[z.name] || 0) - 1) }))}><Minus {...s16} /></button>
                  <span className="bo-ka-num">{menge[z.name] || 0}</span>
                  <button type="button" style={{ width: 44, height: 44 }} aria-label={KIOSK.korb.mehr} disabled={(menge[z.name] || 0) >= z.ruecknehmbar} onClick={() => setMenge((m) => ({ ...m, [z.name]: Math.min(z.ruecknehmbar, (m[z.name] || 0) + 1) }))} data-testid="retoure-plus"><Plus {...s16} /></button>
                </span>
                <span className="bo-ka-num font-semibold w-24 text-right">{euro((menge[z.name] || 0) * Math.abs(z.einzel_brutto_cent))}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="bo-ka-korb">
          <p className="bo-ka-label">{KIOSK.retoure.grund}</p>
          <div className="bo-ka-chips" role="radiogroup" aria-label={KIOSK.retoure.grund}>
            {KIOSK.retoure.gruende.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={grund === x.id} className="bo-ka-chip" onClick={() => setGrund(x.id)} data-testid="retoure-grund">{x.titel}</button>
            ))}
          </div>
          {g && (
            <p className="bo-ka-hinweis">
              <Check {...s16} />
              {KIOSK.retoure.weg}: {g.weg === "gutschein" ? KIOSK.retoure.gutschein : `${KIOSK.retoure.original} (${(daten.zahlarten || []).map((z) => ZAHLART_BACKEND_TITEL[z] || z).join(" + ")})`}
            </p>
          )}
          <div className="flex-1" />
          <button type="button" className="bo-ka-pay" disabled={!g || !betrag || laeuft} onClick={() => buchen()} data-testid="retoure-buchen">
            <span className="inline-flex items-center gap-2"><RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />{KIOSK.retoure.titel}</span>
            <span className="bo-ka-num">{euro(betrag)}</span>
          </button>
        </aside>
      </div>
      <Freigabe key={freigabe ? "f" : "z"} offen={!!freigabe} gruende={freigabe?.gruende || []} zusammenfassung={`${KIOSK.retoure.titel} · ${euro(betrag)}`} leitung={leitung} onFreigabe={(f) => buchen(f)} onAbbrechen={() => setFreigabe(null)} />
    </div>
  );
}
