"use client";
// Dialoge für Bank, Eingangsrechnung, Angebot, Auftrag und Export (10-konzept-faktura § 3.5, § 3.6, § 5.5–§ 5.7,
// § 5.11, § 5.14, § 5.15) im Lounge-Stil.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Fakten, Sheet } from "../Overlay";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import BetragFeld from "../Eingabe/BetragFeld";
import Datumsfeld from "../Formular/Datumsfeld";
import Unterschrift from "../Eingabe/Unterschrift";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import { useToast } from "../Toast";
import { cent } from "@/lib/backoffice/format";
import { BANK, ER, ANGEBOT, AUFTRAG, EXPORT, AKTION, KASSA } from "@/lib/backoffice/faktura/texte";
import { zahlungsplanAus, zahlungsplanPruefen, belegSummen } from "@/lib/backoffice/faktura/betraege";
import { bankIgnorierenAction, bankImportAction, bankAnzahlungZuordnenAction, erAnlegenAction, erAktionAction, angebotAnlegenAction, annehmenAction, auftragUebernehmenAction, anzahlungAnfordernAction, auftragAktionAction, ruecktrittAction, exportErzeugenAction } from "@/lib/backoffice/faktura/actions";
import { Feld, Hinweis, FIcon } from "./teile";
import { neuerSchluessel, useVorgang, deutsch, heuteIso, plusTage } from "./hilfen";

// --------------------------------------------------------------------- Bank --

export function IgnorierenDialog({ offen, onSchliessen, ziel, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [grund, setGrund] = useState(BANK.ignorierenGruende[0]);
  const v = useVorgang();
  async function los() {
    await v.start(async () => {
      const r = await bankIgnorierenAction({ umsatz: ziel.name, grund });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige(BANK.ignoriert, { art: "ok" });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} groesse="sm" titel={`${ziel?.titel || ""} ignorieren?`} text={cent(Math.abs(ziel?.betrag_cent || 0))} fuss={<><Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={los} laedt={v.zeigen} disabled={v.laeuft}>{AKTION.ignorieren}</Knopf></>}>
      <Feld label={BANK.ignorierenGrund}>
        <div className="flex flex-col gap-1" role="radiogroup" aria-label={BANK.ignorierenGrund}>
          {BANK.ignorierenGruende.map((g) => (
            <label key={g} className="flex cursor-pointer items-center gap-2.5 rounded-bo-zeile px-3 py-2 text-[14px] hover:bg-bo-fill">
              <input type="radio" name="grund" checked={grund === g} onChange={() => setGrund(g)} /> {g}
            </label>
          ))}
        </div>
      </Feld>
    </Dialog>
  );
}

/** Zuordnen-Dialog (§ 5.11): Vorschlag + Alternativen + Suche, Teilbetrag, AB erkannt → Anzahlungsrechnung stellen und zuordnen. */
export function ZuordnenDialog({ offen, onSchliessen, ziel, offeneBelege = [], onZuordnen, onFertig }) {
  const router = useRouter();
  const d = ziel?.daten || {};
  const v0 = d.vorschlag;
  const [q, setQ] = useState("");
  const [wahl, setWahl] = useState(v0?.auftrag ? null : v0?.beleg || null);
  const [betrag, setBetrag] = useState(d.rest_cent || 0);
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("bank-anzahlung"));
  const vg = useVorgang();
  const ausgang = (ziel?.betrag_cent || 0) < 0;
  const liste = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = offeneBelege.filter((b) => (ausgang ? b.doctype === "PH Eingangsrechnung" : b.doctype !== "PH Eingangsrechnung"));
    if (!s) return pool.slice(0, 8);
    return pool.filter((b) => [b.name, b.kunde, String(b.offen_cent / 100)].some((x) => String(x || "").toLowerCase().includes(s.replace(",", ".")))).slice(0, 12);
  }, [q, offeneBelege, ausgang]);
  const gewaehlt = offeneBelege.find((b) => b.name === wahl);
  const zuHoch = gewaehlt && betrag > gewaehlt.offen_cent;
  const differenz = gewaehlt && betrag < gewaehlt.offen_cent && betrag === d.rest_cent ? gewaehlt.offen_cent - betrag : 0;

  async function anzahlung() {
    await vg.start(async () => {
      const r = await bankAnzahlungZuordnenAction({ umsatz: ziel.name, auftrag: v0.beleg, zeile: 1, idempotency: schluessel });
      if (!r.ok) return setFehler(r.message), setErgebnis({ teil: true, schritte: r.schritte || [] });
      setErgebnis(r);
      router.refresh();
      onFertig?.(r);
    });
  }

  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !vg.laeuft && onSchliessen()}
      groesse="lg"
      titel={`${ziel?.titel || ""} · ${cent(Math.abs(ziel?.betrag_cent || 0))}`}
      text={d.zweck}
      testid="zuordnen-dialog"
      fuss={
        ergebnis ? null : v0?.auftrag && !wahl ? (
          <>
            <Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf>
            <Knopf variant="primary" onClick={anzahlung} laedt={vg.zeigen} disabled={vg.laeuft} data-testid="anzahlung-zuordnen">{BANK.anzahlungZuordnen}</Knopf>
          </>
        ) : (
          <>
            <Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf>
            <Knopf variant="primary" disabled={!gewaehlt || !betrag || zuHoch} onClick={() => { onZuordnen?.({ beleg: gewaehlt, betrag }); onSchliessen(); }} kuerzel="⇧↵" data-testid="zuordnen-primaer">{AKTION.zuordnen}</Knopf>
          </>
        )
      }
    >
      {ergebnis ? (
        <ErgebnisKarte ohneKachel primaer={false} titel={ergebnis.teil ? "Teilweise ausgeführt" : `Anzahlungsrechnung ${ergebnis.rechnung} gestellt und zugeordnet`} unter={fehler || undefined} dokumente={(ergebnis.schritte || []).map((s) => ({ titel: s.titel, icon: "Check" }))} aktionen={ergebnis.teil ? [{ titel: AKTION.fortsetzen, onClick: () => { setErgebnis(null); setFehler(null); } }] : [{ titel: AKTION.schliessen, onClick: onSchliessen }]} />
      ) : (
        <div className="flex flex-col gap-4">
          {v0 && (
            <div className="rounded-bo-karte bg-bo-surface-2 p-3.5">
              <p className="text-[13px] text-bo-text-soft">{BANK.sicherheitAria(v0.wort, v0.grund)} · {v0.zahl}</p>
              <p className="mt-1 text-[15px] font-semibold">{v0.beleg}{d.beleg?.kunde ? ` · ${d.beleg.kunde}` : ""}{d.beleg ? ` · offen ${cent(d.beleg.offen_cent)}` : ""}</p>
              {v0.auftrag && <p className="mt-1 text-[13px] text-bo-text-soft">{KASSA.anzahlung(v0.beleg).split("–")[0]}</p>}
            </div>
          )}
          <Feld label={BANK.alternativen}>
            <input className="bo-fk-feld" placeholder={BANK.suche} value={q} onChange={(e) => setQ(e.target.value)} aria-label={BANK.suche} />
          </Feld>
          {liste.length === 0 ? (
            <p className="text-[14px] text-bo-text-soft">{q ? `Kein offener Beleg passt zu „${q}“. Betrag oder Kundennamen versuchen.` : "Keine offenen Belege."} {q && <button type="button" className="font-medium underline" onClick={() => setQ("")}>{BANK.suchenLeeren}</button>}</p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-1 overflow-auto" role="radiogroup" aria-label={BANK.alternativen}>
              {liste.map((b) => (
                <li key={b.name}>
                  <label className="grid cursor-pointer grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 rounded-bo-zeile px-3 py-2 hover:bg-bo-fill" data-gewaehlt={wahl === b.name || undefined}>
                    <input type="radio" name="beleg" checked={wahl === b.name} onChange={() => { setWahl(b.name); setBetrag(Math.min(d.rest_cent, b.offen_cent)); }} />
                    <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{b.name} · {b.kunde}</span><span className="block text-[12px] text-bo-text-faint">fällig {deutsch(b.faellig)}</span></span>
                    <span className="text-[14px] tabular-nums">{cent(b.offen_cent)}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {gewaehlt && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Feld label="Betrag" id="zu-betrag" fehler={zuHoch ? `Höchstens ${cent(gewaehlt.offen_cent)}` : null} hilfe={betrag < d.rest_cent ? BANK.teilweise : differenz ? BANK.differenzOffen(cent(differenz)) : null}>
                <BetragFeld id="zu-betrag" value={betrag} onChange={(c) => setBetrag(c || 0)} />
              </Feld>
            </div>
          )}
          {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
        </div>
      )}
    </Dialog>
  );
}

/** Import-Sheet (§ 3.5): Dropzone, Konto, Fehler im Sheet (Datei bleibt), Ergebnis-Karte ohne Häkchen-Zeichnen. */
export function ImportSheet({ offen, onSchliessen, konten = [], autoErlaubt = false }) {
  const router = useRouter();
  const [konto, setKonto] = useState(konten[0]?.name || "");
  const [datei, setDatei] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();
  async function importieren() {
    const fd = new FormData();
    fd.set("datei", datei);
    fd.set("konto", konto);
    await v.start(async () => {
      const r = await bankImportAction(fd);
      if (!r.ok) return setFehler(r);
      setFehler(null);
      setErgebnis(r);
      router.refresh();
    });
  }
  return (
    <Sheet offen={offen} onSchliessen={onSchliessen} titel={BANK.importTitel} groesse="md" panel="import" testid="import-sheet" fuss={ergebnis ? <Knopf variant="primary" href="/faktura/bank?r=offen" onClick={onSchliessen}>{BANK.offeneAnsehen}</Knopf> : <Knopf variant="primary" onClick={importieren} laedt={v.zeigen} disabled={!datei || v.laeuft} data-testid="import-los">Importieren</Knopf>}>
      {ergebnis ? (
        <ErgebnisKarte ohneKachel primaer={false} titel={BANK.importErgebnis(ergebnis.anzahl, ergebnis.neu, ergebnis.doppelt, ergebnis.vorschlag, ergebnis.zugeordnet)} />
      ) : (
        <div className="flex flex-col gap-4">
          <Feld label={BANK.konto} id="imp-konto">
            <select id="imp-konto" className="bo-fk-feld" value={konto} onChange={(e) => setKonto(e.target.value)}>
              {konten.map((k) => <option key={k.name} value={k.name}>{k.name}{k.iban ? ` · … ${k.iban.replace(/\s/g, "").slice(-4)}` : ""}</option>)}
            </select>
          </Feld>
          <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-bo-karte bg-bo-surface-2 p-6 text-center text-[14px] text-bo-text-soft hover:bg-bo-fill-2" data-testid="import-dropzone">
            <FIcon name="Download" className="size-6" />
            <span className="font-medium text-bo-text">{datei ? datei.name : BANK.datei}</span>
            <input type="file" accept=".xml,.camt,.053,text/xml,application/xml" className="sr-only" onChange={(e) => { setDatei(e.target.files?.[0] || null); setFehler(null); }} />
          </label>
          {autoErlaubt && <Schalter label={BANK.autoZuordnen} standard={false} />}
          {fehler && (
            <Hinweis ton="gefahr" testid="import-fehler" aktion={fehler.art === "konto" ? <Knopf size="s" variant="ghost" onClick={() => setFehler(null)}>Andere Datei</Knopf> : fehler.import ? <Knopf size="s" variant="ghost" href="/faktura/bank/importe">Ansehen</Knopf> : null}>
              {fehler.message}
            </Hinweis>
          )}
        </div>
      )}
    </Sheet>
  );
}

// --------------------------------------------------------- Eingangsrechnung --

/** Neu-Sheet (§ 3.6): Dropzone zuerst, Doppelerfassung live, Brutto = Netto + USt, Fremdwährung abgelehnt (E9). */
export function ErNeuSheet({ offen, onSchliessen, projekte = [] }) {
  const router = useRouter();
  const [werte, setWerte] = useState({ datum: heuteIso(), faellig: "", skonto_bis: "", netto_cent: 0, ust_cent: 0, brutto_cent: 0, ust_fall: "Vorsteuer AT" });
  const [datei, setDatei] = useState(null);
  const [mehr, setMehr] = useState(false);
  const [fremd, setFremd] = useState(false);
  const [fehler, setFehler] = useState({});
  const [allg, setAllg] = useState(null);
  const v = useVorgang();
  const set = (k) => (x) => setWerte((w) => ({ ...w, [k]: x?.target ? x.target.value : x }));
  const bruttoFalsch = werte.brutto_cent && werte.netto_cent + werte.ust_cent !== werte.brutto_cent;

  async function anlegen(pruefen) {
    const fd = new FormData();
    for (const [k, x] of Object.entries(werte)) fd.set(k, String(x ?? ""));
    if (datei) fd.set("datei", datei);
    fd.set("pruefen", pruefen ? "1" : "0");
    fd.set("fremdwaehrung", fremd ? "1" : "0");
    await v.start(async () => {
      const r = await erAnlegenAction(fd);
      if (!r.ok) {
        setFehler(Object.fromEntries((r.fehler || [{ feld: r.feld || "allg", text: r.message }]).map((f) => [f.feld || "allg", f.text])));
        setAllg(r.feld ? null : r.message);
        return;
      }
      onSchliessen();
      router.push(`/faktura/eingangsrechnungen/${encodeURIComponent(r.name)}?tab=kosten`);
    });
  }

  return (
    <Sheet offen={offen} onSchliessen={onSchliessen} titel={ER.neuTitel} groesse="lg" panel="neu" ungespeichert={!!werte.lieferant_name} testid="er-neu-sheet" fuss={<><Knopf variant="secondary" onClick={() => anlegen(false)} disabled={v.laeuft}>{ER.anlegen}</Knopf><Knopf variant="primary" onClick={() => anlegen(true)} laedt={v.zeigen} disabled={v.laeuft} data-testid="er-anlegen-pruefen">{ER.anlegenPruefen}</Knopf></>}>
      <div className="flex flex-col gap-4">
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-bo-karte bg-bo-surface-2 p-5 text-center text-[14px] text-bo-text-soft hover:bg-bo-fill-2">
          <FIcon name="FileText" className="size-6" />
          <span className="font-medium text-bo-text">{datei ? datei.name : ER.dropzone}</span>
          <span className="text-[12px]">{ER.keineOcr}</span>
          <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => setDatei(e.target.files?.[0] || null)} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld label={ER.lieferant} id="er-l" fehler={fehler.lieferant_name}><input id="er-l" className="bo-fk-feld" value={werte.lieferant_name || ""} onChange={set("lieferant_name")} /></Feld>
          <Feld label={ER.rechnungsnummer} id="er-r" fehler={fehler.rechnungsnummer_lieferant}><input id="er-r" className="bo-fk-feld" value={werte.rechnungsnummer_lieferant || ""} onChange={set("rechnungsnummer_lieferant")} /></Feld>
          <Feld label={ER.datum} id="er-d" fehler={fehler.datum}><Datumsfeld id="er-d" value={werte.datum} onChange={set("datum")} /></Feld>
          <Feld label={ER.faellig} id="er-f"><Datumsfeld id="er-f" value={werte.faellig} onChange={set("faellig")} /></Feld>
          <Feld label={ER.netto} id="er-n"><BetragFeld id="er-n" value={werte.netto_cent} onChange={(c) => setWerte((w) => ({ ...w, netto_cent: c || 0, ust_cent: Math.round((c || 0) * 0.2), brutto_cent: (c || 0) + Math.round((c || 0) * 0.2) }))} /></Feld>
          <Feld label={ER.ust} id="er-u"><BetragFeld id="er-u" value={werte.ust_cent} onChange={(c) => setWerte((w) => ({ ...w, ust_cent: c || 0 }))} /></Feld>
          <Feld label={ER.brutto} id="er-b" fehler={bruttoFalsch ? ER.bruttoFehler : fehler.brutto_cent}><BetragFeld id="er-b" value={werte.brutto_cent} onChange={(c) => setWerte((w) => ({ ...w, brutto_cent: c || 0 }))} /></Feld>
          <Feld label={ER.steuerfall} id="er-s">
            <select id="er-s" className="bo-fk-feld" value={werte.ust_fall} onChange={set("ust_fall")}>
              {["Vorsteuer AT", "Reverse Charge EU", "Innergemeinschaftlicher Erwerb", "Einfuhr Drittland", "Keine Vorsteuer"].map((s) => <option key={s} value={s}>{s === "Vorsteuer AT" ? "Inland mit Vorsteuer" : s === "Reverse Charge EU" ? "Einkauf EU (Steuerschuld)" : s === "Innergemeinschaftlicher Erwerb" ? "Einkauf EU" : s === "Einfuhr Drittland" ? "Einfuhr" : "Ohne Vorsteuer"}</option>)}
            </select>
          </Feld>
          <Feld label={ER.skonto} id="er-sk"><input id="er-sk" className="bo-fk-feld" inputMode="decimal" value={werte.skonto_promille ? werte.skonto_promille / 10 : ""} onChange={(e) => setWerte((w) => ({ ...w, skonto_promille: Math.round((Number(e.target.value.replace(",", ".")) || 0) * 10) }))} /></Feld>
          <Feld label={ER.skontoBis} id="er-sb"><Datumsfeld id="er-sb" value={werte.skonto_bis} onChange={set("skonto_bis")} /></Feld>
          <Feld label={ER.bezug} id="er-p" className="sm:col-span-2">
            <select id="er-p" className="bo-fk-feld" value={werte.projekt || ""} onChange={set("projekt")}>
              <option value="">Kein Projekt</option>
              {projekte.map((p) => <option key={p.wert} value={p.wert}>{p.titel} · {p.wert}</option>)}
            </select>
          </Feld>
        </div>
        <button type="button" className="self-start text-[13px] font-medium text-bo-text-soft hover:underline" aria-expanded={mehr} onClick={() => setMehr((m) => !m)}>{ER.weitere}</button>
        {mehr && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feld label="IBAN" id="er-i"><input id="er-i" className="bo-fk-feld" value={werte.iban || ""} onChange={set("iban")} /></Feld>
            <Feld label="Zahlungsreferenz" id="er-ref"><input id="er-ref" className="bo-fk-feld" value={werte.referenz || ""} onChange={set("referenz")} /></Feld>
            <Feld label="Notiz" id="er-no" className="sm:col-span-2"><textarea id="er-no" className="bo-fk-feld" rows={2} value={werte.notiz || ""} onChange={set("notiz")} /></Feld>
          </div>
        )}
        <Schalter label={ER.fremdwaehrung} an={fremd} onWechsel={setFremd} groesse="s" />
        {fremd && <Hinweis ton="warnung">{ER.fremdHinweis}</Hinweis>}
        {(fehler.allg || allg || fehler.fremdwaehrung) && <Hinweis ton="gefahr">{fehler.allg || allg || fehler.fremdwaehrung}</Hinweis>}
      </div>
    </Sheet>
  );
}

export function ErAktionDialog({ offen, onSchliessen, ziel, aktion, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [textWert, setTextWert] = useState("");
  const [datum, setDatum] = useState(heuteIso());
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();
  const titel = aktion === "ablehnen" ? `${ziel?.name} ablehnen?` : aktion === "als_bezahlt_buchen" ? `${ziel?.name} als bezahlt buchen?` : `${ziel?.name} sachlich prüfen`;
  async function los() {
    await v.start(async () => {
      const r = await erAktionAction({ name: ziel.name, aktion, vermerk: textWert, grund: textWert, datum });
      if (!r.ok) return setFehler(r.message);
      zeige(aktion === "ablehnen" ? ER.abgelehnt(ziel.name) : aktion === "als_bezahlt_buchen" ? ER.bezahlt(1) : ER.geprueft(ziel.name), { art: "ok" });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} groesse="sm" titel={titel} text={ziel?.daten?.zahlbetrag_cent ? `${ziel?.titel || ""} · ${cent(ziel.daten.zahlbetrag_cent)}` : undefined} testid="er-aktion-dialog"
      fuss={<><Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf><Knopf variant={aktion === "ablehnen" ? "danger-solid" : "primary"} onClick={los} laedt={v.zeigen} disabled={v.laeuft || (aktion === "ablehnen" && !textWert.trim())}>{aktion === "ablehnen" ? AKTION.ablehnen : aktion === "als_bezahlt_buchen" ? AKTION.alsBezahlt : AKTION.sachlichPruefen}</Knopf></>}>
      <div className="flex flex-col gap-3">
        {aktion === "als_bezahlt_buchen" ? (
          <Feld label="Bezahlt am" id="er-bez"><Datumsfeld id="er-bez" value={datum} onChange={setDatum} /></Feld>
        ) : (
          <Feld label={aktion === "ablehnen" ? ER.ablehnGrund : ER.pruefvermerk} id="er-txt"><textarea id="er-txt" className="bo-fk-feld" rows={3} value={textWert} onChange={(e) => setTextWert(e.target.value)} /></Feld>
        )}
        {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Angebot --

export function AngebotAnlegenDialog({ offen, onSchliessen, kontakte = [], projekte = [], bedingungen = [], vorgabe = {} }) {
  const router = useRouter();
  const [w, setW] = useState({ kontakt: vorgabe.kontakt || "", projekt: vorgabe.projekt || "", titel: vorgabe.titel || "", zahlungsbedingung: bedingungen.find((b) => b.standard)?.name || bedingungen[0]?.name || "", vertragsort: "Showroom" });
  const [fehler, setFehler] = useState({});
  const v = useVorgang();
  const set = (k) => (e) => setW((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  async function anlegen() {
    await v.start(async () => {
      const r = await angebotAnlegenAction(w);
      if (!r.ok) return setFehler({ [r.feld || "allg"]: r.message });
      onSchliessen();
      router.push(`/faktura/angebote/${encodeURIComponent(r.name)}?tab=positionen`);
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} groesse="md" titel={ANGEBOT.anlegenTitel} testid="angebot-anlegen"
      fuss={<><Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={anlegen} laedt={v.zeigen} disabled={v.laeuft} data-testid="angebot-anlegen-primaer">{AKTION.anlegen}</Knopf></>}>
      <div className="grid grid-cols-1 gap-4">
        <Feld label={ANGEBOT.kunde} id="an-k" fehler={fehler.kontakt}>
          <select id="an-k" className="bo-fk-feld" value={w.kontakt} onChange={set("kontakt")}>
            <option value="">Kunde wählen …</option>
            {kontakte.map((k) => <option key={k.wert} value={k.wert}>{k.titel} · {k.unter}</option>)}
          </select>
        </Feld>
        <Feld label={ANGEBOT.projekt} id="an-p">
          <select id="an-p" className="bo-fk-feld" value={w.projekt} onChange={set("projekt")}>
            <option value="">Ohne Projekt</option>
            {projekte.map((p) => <option key={p.wert} value={p.wert}>{p.titel} · {p.wert}</option>)}
          </select>
        </Feld>
        <Feld label={ANGEBOT.titel} id="an-t" fehler={fehler.titel}><input id="an-t" className="bo-fk-feld" value={w.titel} onChange={set("titel")} /></Feld>
        <Feld label={ANGEBOT.zahlungsbedingung} id="an-z">
          <select id="an-z" className="bo-fk-feld" value={w.zahlungsbedingung} onChange={set("zahlungsbedingung")}>
            {bedingungen.map((b) => <option key={b.name} value={b.name}>{b.titel}</option>)}
          </select>
        </Feld>
        <Feld label={ANGEBOT.vertragsort}><Segment label={ANGEBOT.vertragsort} wert={w.vertragsort} onWechsel={set("vertragsort")} optionen={ANGEBOT.vertragsorte.map((o) => ({ wert: o, titel: o }))} /></Feld>
        {fehler.allg && <Hinweis ton="gefahr">{fehler.allg}</Hinweis>}
      </div>
    </Dialog>
  );
}

/** Annehmen (§ 5.6): „Annahme über“ Pflicht, Unterschrift im Showroom (Fundament-Baustein) oder Papier. */
export function AnnehmenDialog({ offen, onSchliessen, ziel, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [art, setArt] = useState("");
  const [datum, setDatum] = useState(heuteIso());
  const [papier, setPapier] = useState(false);
  const [unterschrift, setUnterschrift] = useState("");
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();
  async function annehmen() {
    await v.start(async () => {
      const r = await annehmenAction({ name: ziel.name, annahmeArt: art, datum, unterschrift, papier });
      if (!r.ok) return setFehler(r.message);
      zeige(ANGEBOT.angenommen, { art: "ok", aktion: { titel: AKTION.alsAuftrag, onClick: () => router.push(`/faktura/angebote/${encodeURIComponent(ziel.name)}?aktion=uebernehmen`) } });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} groesse="md" titel={ANGEBOT.annehmenTitel(ziel?.name || "")} testid="annehmen-dialog"
      fuss={<><Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={annehmen} laedt={v.zeigen} disabled={!art || v.laeuft} grund={!art ? "Annahme über fehlt" : null}>{AKTION.annehmen}</Knopf></>}>
      <div className="flex flex-col gap-4">
        <Feld label={ANGEBOT.annahmeUeber}>
          <Segment label={ANGEBOT.annahmeUeber} wert={art} onWechsel={setArt} optionen={ANGEBOT.annahmeArten.map((a) => ({ wert: a, titel: a.replace("Unterschrift ", "") }))} />
        </Feld>
        <Feld label="Datum" id="ann-d"><Datumsfeld id="ann-d" value={datum} onChange={setDatum} /></Feld>
        {art === "Unterschrift Showroom" && (
          <>
            {!papier && <Unterschrift erklaerung={`Ich nehme das Angebot ${ziel?.name} an.`} name={ziel?.daten?.kunde} aktion={async (p) => { setUnterschrift(p?.png || p?.bild || "liegt vor"); return { ok: true }; }} />}
            <Schalter label={ANGEBOT.papier} an={papier} onWechsel={setPapier} groesse="s" />
          </>
        )}
        {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

/** Als Auftrag übernehmen (§ 5.7): ein Dialog mit Alternativen, Zahlungsplan (Summe = Brutto) und Terminen. */
export function UebernehmenDialog({ offen, onSchliessen, angebot, bedingung = {} }) {
  const router = useRouter();
  const alternativen = (angebot?.positionen || []).filter((p) => p.alternativ);
  const [wahl, setWahl] = useState([]);
  const brutto = useMemo(() => belegSummen((angebot?.positionen || []).map((p) => (wahl.includes(p.pos) ? { ...p, alternativ: 0 } : p))).brutto_cent, [angebot, wahl]);
  const [plan, setPlan] = useState(() => zahlungsplanAus(bedingung, brutto));
  const [liefer, setLiefer] = useState("");
  const [montage, setMontage] = useState(true);
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("auftrag"));
  const v = useVorgang();
  useEffect(() => setPlan(zahlungsplanAus(bedingung, brutto)), [brutto]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  const pr = zahlungsplanPruefen(plan, brutto);
  async function anlegen() {
    await v.start(async () => {
      const r = await auftragUebernehmenAction({ angebot: angebot.name, alternativen: wahl, zahlungsplan: plan, liefertermin: liefer, montage, idempotency: schluessel });
      if (!r.ok) return setFehler(r.message);
      setErgebnis(r);
      router.refresh();
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={() => !v.laeuft && onSchliessen()} groesse="lg" titel={ergebnis ? "" : AUFTRAG.uebernehmenTitel(angebot?.name || "")} testid="uebernehmen-dialog"
      fuss={ergebnis ? null : <><span className="mr-auto hidden text-[13px] text-bo-text-soft sm:block">{AUFTRAG.folge("AB-…")}</span><Knopf variant="secondary" onClick={onSchliessen}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={anlegen} laedt={v.zeigen} disabled={!pr.ok || v.laeuft} grund={!pr.ok ? AUFTRAG.planFehler(cent(pr.summe_cent), cent(brutto)) : null} data-testid="auftrag-anlegen">{AKTION.auftragAnlegen}</Knopf></>}>
      {ergebnis ? (
        <ErgebnisKarte ohneKachel titel={AUFTRAG.angelegt(ergebnis.auftrag)} dokumente={[{ titel: ergebnis.auftrag, info: "Auftragsbestätigung", href: `/faktura/auftraege/${encodeURIComponent(ergebnis.auftrag)}` }, ergebnis.anzahlungsrechnung && { titel: "Anzahlungsrechnung (Entwurf)", info: ergebnis.anzahlungsrechnung, href: `/faktura/rechnungen/${encodeURIComponent(ergebnis.anzahlungsrechnung)}` }].filter(Boolean)} weiter={{ titel: AKTION.anzahlungAnfordern, href: `/faktura/auftraege/${encodeURIComponent(ergebnis.auftrag)}?aktion=anzahlung` }} />
      ) : (
        <div className="flex flex-col gap-5">
          {alternativen.length > 0 && (
            <section>
              <h3 className="bo-titel-kachel mb-1.5">{AUFTRAG.alternativen}</h3>
              <p className="mb-2 text-[13px] text-bo-text-soft">{AUFTRAG.alternativenHinweis}</p>
              {alternativen.map((p) => (
                <label key={p.pos} className="flex items-center gap-2.5 rounded-bo-zeile px-3 py-2 text-[14px] hover:bg-bo-fill">
                  <input type="checkbox" checked={wahl.includes(p.pos)} onChange={() => setWahl((w) => (w.includes(p.pos) ? w.filter((x) => x !== p.pos) : [...w, p.pos]))} />
                  <span className="flex-1">{p.bezeichnung}</span>
                  <span className="tabular-nums">{cent(Math.round(p.menge * p.einzel_netto_cent * 1.2))}</span>
                </label>
              ))}
            </section>
          )}
          <section>
            <h3 className="bo-titel-kachel mb-2">{AUFTRAG.zahlungsplan} · {cent(brutto)}</h3>
            <div className="flex flex-col gap-2">
              {plan.map((z, i) => (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_80px_140px] items-center gap-2 text-[14px]">
                  <span>{z.art} · fällig bei {z.faellig_bei}</span>
                  <input className="bo-fk-feld text-right" aria-label={`${z.art} Prozent`} inputMode="numeric" value={z.prozent} onChange={(e) => setPlan((p) => p.map((x, j) => (j === i ? { ...x, prozent: Number(e.target.value) || 0, betrag_cent: Math.round((brutto * (Number(e.target.value) || 0)) / 100) } : x)))} />
                  <BetragFeld value={z.betrag_cent} aria-label={`${z.art} Betrag`} onChange={(c) => setPlan((p) => p.map((x, j) => (j === i ? { ...x, betrag_cent: c || 0 } : x)))} />
                </div>
              ))}
            </div>
            {!pr.ok && <p className="bo-fk-fehler" role="alert">{AUFTRAG.planFehler(cent(pr.summe_cent), cent(brutto))}</p>}
          </section>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h3 className="bo-titel-kachel sm:col-span-2">{AUFTRAG.termine}</h3>
            <Feld label="Liefertermin geplant" id="ue-l"><Datumsfeld id="ue-l" value={liefer} onChange={setLiefer} /></Feld>
            <div className="self-end"><Schalter label="Montage durch Platzhirsch" an={montage} onWechsel={setMontage} /></div>
          </section>
          {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ Auftrag --

/** Anzahlung anfordern (§ 5.3): legt die Anzahlungsrechnung an und reicht sie an den Stellen-Dialog weiter. */
export function AnzahlungDialog({ offen, onSchliessen, ziel, onWeiter }) {
  const zeilen = (ziel?.daten?.zeilen || []).filter((z) => z.art === "Anzahlung" && z.status === "Offen");
  const [zeile, setZeile] = useState(zeilen[0]?.zeile || 1);
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();
  async function weiter(nurEntwurf) {
    await v.start(async () => {
      const r = await anzahlungAnfordernAction({ auftrag: ziel.name, zeile });
      if (!r.ok) return setFehler(r.message);
      onWeiter?.(r.rechnung, nurEntwurf);
    });
  }
  const z = zeilen.find((x) => x.zeile === zeile) || zeilen[0];
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} groesse="md" titel={AUFTRAG.anzahlungTitel(ziel?.name || "")} text={z ? `${cent(z.betrag_cent)} (${z.prozent} %)` : undefined} testid="anzahlung-dialog"
      fuss={<><Knopf variant="secondary" onClick={() => weiter(true)} disabled={v.laeuft || !z}>{AUFTRAG.nurEntwurf}</Knopf><Knopf variant="primary" onClick={() => weiter(false)} laedt={v.zeigen} disabled={v.laeuft || !z} data-testid="anzahlung-weiter">{AUFTRAG.modusRechnung}</Knopf></>}>
      <div className="flex flex-col gap-4">
        {zeilen.length > 1 && <Segment label={AUFTRAG.zeile} wert={zeile} onWechsel={setZeile} optionen={zeilen.map((x) => ({ wert: x.zeile, titel: `${x.prozent} % · ${cent(x.betrag_cent)}` }))} />}
        {!z && <Hinweis ton="info">Keine offene Anzahlungszeile im Zahlungsplan.</Hinweis>}
        <Hinweis ton="info">{KASSA.anzahlung(ziel?.name || "")}</Hinweis>
        {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

/** Rücktritt (FAGG) bzw. Storno (§ 5.14) als Teilschritte mit Ergebnis-Karte und „Fortsetzen“. */
export function RuecktrittDialog({ offen, onSchliessen, ziel, storno = false, rechnungen = [] }) {
  const router = useRouter();
  const [datum, setDatum] = useState(heuteIso());
  const [kanal, setKanal] = useState("E-Mail");
  const [grund, setGrund] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("ruecktritt"));
  const v = useVorgang();
  const gestellt = rechnungen.filter((r) => Number(r.docstatus) === 1 && !["Storniert", "Uneinbringlich"].includes(r.status));
  async function los() {
    await v.start(async () => {
      const r = storno ? await auftragAktionAction({ name: ziel.name, aktion: "stornieren", grund }) : await ruecktrittAction({ auftrag: ziel.name, datum, kanal, idempotency: schluessel });
      setErgebnis(r);
      if (r.ok) router.refresh();
    });
  }
  return (
    <Dialog offen={offen} onSchliessen={() => !v.laeuft && onSchliessen()} groesse="md" titel={ergebnis ? "" : storno ? AUFTRAG.stornoTitel(ziel?.name || "") : AUFTRAG.ruecktrittTitel(ziel?.name || "", ziel?.daten?.kunde || "")} testid="ruecktritt-dialog"
      fuss={ergebnis ? null : <><Knopf variant="secondary" onClick={onSchliessen} autoFocus>{AKTION.abbrechen}</Knopf><Knopf variant="danger-solid" onClick={los} laedt={v.zeigen} disabled={v.laeuft || (storno && !grund.trim())}>{storno ? AKTION.stornieren : AUFTRAG.ruecktrittBuchen}</Knopf></>}>
      {ergebnis ? (
        <ErgebnisKarte ohneKachel primaer={false} titel={ergebnis.ok ? (storno ? `Auftrag ${ziel.name} storniert` : `Rücktritt zu ${ziel.name} gebucht`) : "Teilweise ausgeführt"} unter={ergebnis.ok ? (ergebnis.rueckzahlung_cent ? `Rückzahlung ${cent(ergebnis.rueckzahlung_cent)} bis ${deutsch(plusTage(datum, 14))}` : undefined) : ergebnis.message} dokumente={(ergebnis.schritte || []).map((s) => ({ titel: s.titel, icon: "Check" }))} aktionen={ergebnis.ok ? [{ titel: AKTION.schliessen, onClick: onSchliessen }] : [{ titel: AKTION.fortsetzen, onClick: los }]} />
      ) : (
        <div className="flex flex-col gap-4">
          {!storno && (
            <>
              <Fakten eintraege={[{ label: "Vertragsort", wert: ziel?.daten?.vertragsort || "–" }, { label: "Frist", wert: AUFTRAG.faggOhne }]} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Feld label="Rücktritt am" id="rt-d"><Datumsfeld id="rt-d" value={datum} onChange={setDatum} /></Feld>
                <Feld label="Eingang über" id="rt-k"><select id="rt-k" className="bo-fk-feld" value={kanal} onChange={(e) => setKanal(e.target.value)}>{["E-Mail", "Brief", "Telefon", "Persönlich"].map((k) => <option key={k}>{k}</option>)}</select></Feld>
              </div>
            </>
          )}
          {storno && <Feld label="Grund" id="st-g"><textarea id="st-g" className="bo-fk-feld" rows={3} value={grund} onChange={(e) => setGrund(e.target.value)} /></Feld>}
          <section>
            <h3 className="bo-titel-kachel mb-2">{AUFTRAG.ruecktrittFolgen}</h3>
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {gestellt.map((r) => <li key={r.name}>{r.name} ({cent(r.brutto_cent)}{Number(r.bezahlt_cent) > 0 ? ", bezahlt" : ""}) → Gutschrift Storno</li>)}
              {gestellt.some((r) => Number(r.bezahlt_cent) > 0) && <li>Rückzahlung {cent(gestellt.reduce((s, r) => s + (Number(r.bezahlt_cent) || 0), 0))} binnen 14 Tagen</li>}
              <li>Auftrag → Storniert</li>
            </ul>
          </section>
        </div>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------- Export --

/** Export-Sheet (§ 5.15): Zeitraum (Vormonat), Format, Prüfung automatisch, Vorschau, Rückfrage, Ergebnis. */
export function ExportSheet({ offen, onSchliessen, vorschlag = {}, pruefung = [], format = "BMD CSV" }) {
  const router = useRouter();
  const [von, setVon] = useState(vorschlag.von || "");
  const [bis, setBis] = useState(vorschlag.bis || "");
  const [fmt, setFmt] = useState(format);
  const [nurNeue, setNurNeue] = useState(true);
  const [frage, setFrage] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("export"));
  const v = useVorgang();
  const rot = pruefung.filter((p) => p.schwere === "rot");
  async function erzeugen() {
    await v.start(async () => {
      const r = await exportErzeugenAction({ von, bis, format: fmt, nurNeue, idempotency: schluessel });
      setFrage(false);
      setErgebnis(r);
      router.refresh();
    });
  }
  return (
    <>
      <Sheet offen={offen} onSchliessen={() => !v.laeuft && onSchliessen()} titel={EXPORT.sheetTitel} groesse="lg" panel="export" testid="export-sheet" fuss={ergebnis ? null : <Knopf variant="primary" onClick={() => setFrage(true)} disabled={!!rot.length || !von || !bis || v.laeuft} grund={rot.length ? "Zuerst die rot markierten Punkte lösen" : null} data-testid="export-erzeugen">{AKTION.erzeugen}</Knopf>}>
        {ergebnis ? (
          ergebnis.ok ? (
            <ErgebnisKarte ohneKachel primaer={false} titel={EXPORT.ergebnis(ergebnis.name, ergebnis.anzahl)} aktionen={[{ titel: AKTION.herunterladen, href: `/faktura/export/${encodeURIComponent(ergebnis.name)}` }, { titel: "Protokoll", href: `/faktura/export/${encodeURIComponent(ergebnis.name)}?tab=belege` }]} />
          ) : (
            <Hinweis ton="gefahr" aktion={<Knopf size="s" variant="ghost" onClick={() => setErgebnis(null)}>Erneut erzeugen</Knopf>}>{EXPORT.abbruch}</Hinweis>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Feld label="Von" id="ex-v"><Datumsfeld id="ex-v" value={von} onChange={setVon} /></Feld>
              <Feld label="Bis" id="ex-b"><Datumsfeld id="ex-b" value={bis} onChange={setBis} /></Feld>
            </div>
            <Feld label={EXPORT.format}><Segment label={EXPORT.format} wert={fmt} onWechsel={setFmt} optionen={[{ wert: "BMD CSV", titel: "BMD" }, { wert: "RZL CSV", titel: "RZL" }, { wert: "DATEV Buchungsstapel", titel: "DATEV" }, { wert: "CSV generisch", titel: "CSV" }]} /></Feld>
            <Schalter label={EXPORT.nurNeue} an={nurNeue} onWechsel={setNurNeue} />
            <section>
              <h3 className="bo-titel-kachel mb-2">{EXPORT.pruefung}</h3>
              {pruefung.length === 0 ? <Hinweis ton="ok">{EXPORT.pruefOk}</Hinweis> : (
                <ul className="flex flex-col gap-1.5">
                  {pruefung.map((p) => <li key={p.id}><Hinweis ton={p.schwere === "rot" ? "gefahr" : "warnung"} aktion={p.href ? <Knopf size="s" variant="ghost" href={p.href} iconRechts="ArrowRight">Ansehen</Knopf> : null}>{p.text}</Hinweis></li>)}
                </ul>
              )}
            </section>
            {vorschlag.anzahl !== undefined && (
              <section className="rounded-bo-karte bg-bo-surface-2 p-3.5 text-[14px]">
                <h3 className="font-semibold">{EXPORT.vorschau}</h3>
                <p className="mt-1 tabular-nums text-bo-text-soft">{vorschlag.anzahl} Belege · {cent(vorschlag.summe_cent)}</p>
              </section>
            )}
          </div>
        )}
      </Sheet>
      <Dialog offen={frage} onSchliessen={() => setFrage(false)} groesse="sm" art="bestaetigen" titel={`Export ${deutsch(von)}–${deutsch(bis)} erzeugen?`} text={EXPORT.frage(vorschlag.anzahl ?? "Alle")} sperren={v.laeuft} fuss={<><Knopf variant="secondary" onClick={() => setFrage(false)}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={erzeugen} laedt={v.zeigen} data-testid="export-bestaetigen">{AKTION.erzeugen}</Knopf></>} />
    </>
  );
}
