"use client";
// Kampagnen (10-konzept-marketing § 2.7): Liste mit Budget-Balkenzelle, Zeilenknopf „Kennzahl“ (Shift+K auf der Fokuszeile),
// Summenzeile nur Euro (Fremdwährung je eigene Zeile), Massenaktionen Pausieren/Fortsetzen (verzögert), Beenden (Leitung,
// Bestätigung). Akte: Kennzahl-Dialog (Euro mit Komma → Cent), CSV-Import mit Vorschau, Kampagnen-Link, Workflow-Knöpfe.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import useAktion from "./useAktion";
import { KopierKnopf } from "./Kleinteile";
import { Balken, Status } from "./Bausteine";
import { kampagneAnlegenAction, kampagneSpeichernAction, kampagneWorkflowAction, kennzahlErfassenAction, kennzahlenCsvAction } from "@/lib/backoffice/marketing/actions";
import { isoTag, kampagnenLink, kampagnenSummen, kennungAusTitel, kostenJeAnfrage, kurzDatum, prozent } from "@/lib/backoffice/marketing/regeln";
import { KAMPAGNEN, KAMPAGNE_KANAL, ZIEL_KENNZAHL } from "@/lib/backoffice/marketing/texte";
import { cent } from "@/lib/backoffice/format";

const betrag = (c, w = "EUR") => (w && w !== "EUR" ? cent(c).replace("€", w) : cent(c));

export function KampagnenListe({ zeilen = [], darf, leitung }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [kennzahl, setKennzahl] = useState(null);
  const [aktiv, setAktiv] = useState(null);
  const [beenden, setBeenden] = useState(false);
  const { verzoegert, sofort, laeuft } = useAktion();
  const auswahl = zeilen.filter((k) => gewaehlt.has(k.name));
  const summen = useMemo(() => kampagnenSummen(zeilen), [zeilen]);
  useKuerzel("liste@marketing", { "marketing.kennzahl": () => darf && aktiv && setKennzahl(zeilen.find((z) => z.name === aktiv)) });
  const wf = (aktion, ziel) => {
    const namen = auswahl.filter((k) => (aktion === "Pausieren" ? k.status === "Aktiv" : aktion === "Fortsetzen" ? k.status === "Pausiert" : ["Aktiv", "Pausiert"].includes(k.status))).map((k) => k.name);
    if (!namen.length) return;
    if (ziel === "verzoegert") verzoegert(() => kampagneWorkflowAction({ namen, aktion }), { text: `${namen.length} ${aktion === "Pausieren" ? "pausiert" : "fortgesetzt"}` });
    setGewaehlt(new Set());
  };
  return (
    <>
      <div className="bo-mar-tabelle-huelle overflow-x-auto">
        <table className="bo-mar-tabelle" data-testid="kampagnen-liste">
          <thead>
            <tr>
              {darf && <th scope="col" className="w-8"><span className="sr-only">Auswahl</span></th>}
              <th scope="col">{KAMPAGNEN.spalten.kampagne}</th>
              <th scope="col">{KAMPAGNEN.spalten.budget}</th>
              <th scope="col" className="r">{KAMPAGNEN.spalten.anfragen}</th>
              <th scope="col" className="r max-lg:hidden">{KAMPAGNEN.spalten.jeAnfrage}</th>
              <th scope="col">{KAMPAGNEN.spalten.status}</th>
              {darf && <th scope="col"><span className="sr-only">Kennzahl</span></th>}
            </tr>
          </thead>
          <tbody>
            {zeilen.map((k) => {
              const anteil = k.budget_cent ? k.ausgaben_cent / k.budget_cent : 0;
              const jeA = kostenJeAnfrage(k);
              return (
                <tr key={k.name} tabIndex={-1} onFocus={() => setAktiv(k.name)} data-gewaehlt={gewaehlt.has(k.name) ? "true" : undefined} data-warn={k.signal ? "true" : undefined} data-testid="kampagne-zeile">
                  {darf && <td><input type="checkbox" className="size-4 accent-current" checked={gewaehlt.has(k.name)} onChange={() => setGewaehlt((a) => { const n = new Set(a); if (n.has(k.name)) n.delete(k.name); else n.add(k.name); return n; })} aria-label={`${k.titel} auswählen`} /></td>}
                  <td>
                    <Link href={`/marketing/kampagnen/${encodeURIComponent(k.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{k.titel}</Link>
                    <p className="bo-mar-unter">
                      {k.kanal} · {kurzDatum(k.zeitraum_von)}–{k.zeitraum_bis ? kurzDatum(k.zeitraum_bis) : "offen"}
                      {k.signal?.art === "vorbei" && <span className="bo-mar-warn"> · {KAMPAGNEN.zeitraumVorbei}</span>}
                      {k.signal?.art === "ruht" && <span className="bo-mar-warn"> · {KAMPAGNEN.ruht(k.signal.tage)}</span>}
                    </p>
                  </td>
                  <td className="min-w-[200px]">
                    <span className="bo-mar-klein tabular-nums">{betrag(k.ausgaben_cent, k.waehrung)} / {k.budget_cent ? betrag(k.budget_cent, k.waehrung) : "–"}</span>
                    {k.budget_cent ? <Balken className="mt-1" anteil={anteil} ton={anteil > 1 ? "gefahr" : anteil > 0.85 ? "warn" : undefined} label={`${Math.round(anteil * 100)} % des Budgets`} /> : null}
                  </td>
                  <td className="r bo-mar-zahl">{k.anfragen_gesamt || "–"}</td>
                  <td className="r bo-mar-zahl max-lg:hidden">{jeA != null ? betrag(jeA, k.waehrung) : "–"}</td>
                  <td><Status gruppe="kampagne" wert={k.status} /></td>
                  {darf && <td className="w-28"><Knopf size="s" icon="Plus" onClick={() => setKennzahl(k)} disabled={k.status === "Entwurf"} data-testid="kennzahl-knopf">{KAMPAGNEN.kennzahl}</Knopf></td>}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {Object.entries(summen).map(([w, s]) => (
              <tr key={w}><td colSpan={darf ? 7 : 5} data-testid={`summe-${w}`}>{w === "EUR" ? KAMPAGNEN.summe(betrag(s.budget), betrag(s.ausgaben), s.anfragen) : `${KAMPAGNEN.summeWaehrung(w)}: Budget ${betrag(s.budget, w)} · Ausgaben ${betrag(s.ausgaben, w)} · Anfragen ${s.anfragen}`}</td></tr>
            ))}
          </tfoot>
        </table>
      </div>
      <ul className="bo-mar-karten">
        {zeilen.map((k) => (
          <li key={k.name} className="bo-mar-karte-zeile">
            <div className="min-w-0 flex-1">
              <Link href={`/marketing/kampagnen/${encodeURIComponent(k.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{k.titel}</Link>
              <p className="bo-mar-klein">{k.kanal} · {betrag(k.ausgaben_cent, k.waehrung)}</p>
            </div>
            <Status gruppe="kampagne" wert={k.status} />
          </li>
        ))}
      </ul>
      {darf && auswahl.length > 0 && (
        <div className="bo-mar-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen">
          <span className="bo-mar-auswahl__zahl">{auswahl.length} ausgewählt</span>
          <Knopf size="s" onClick={() => wf("Pausieren", "verzoegert")} disabled={!auswahl.some((k) => k.status === "Aktiv")}>{KAMPAGNEN.pausieren}</Knopf>
          <Knopf size="s" onClick={() => wf("Fortsetzen", "verzoegert")} disabled={!auswahl.some((k) => k.status === "Pausiert")}>{KAMPAGNEN.fortsetzen}</Knopf>
          {leitung && <Knopf size="s" onClick={() => setBeenden(true)} disabled={!auswahl.some((k) => ["Aktiv", "Pausiert"].includes(k.status))}>{KAMPAGNEN.beenden}</Knopf>}
          <Knopf size="s" icon="Printer" href={`/druck/ph-kampagne/${encodeURIComponent(auswahl[0].name)}?format=${encodeURIComponent("PH Kampagnenbericht")}`}>Bericht drucken</Knopf>
        </div>
      )}
      {kennzahl && <KennzahlDialog k={kennzahl} onSchliessen={() => setKennzahl(null)} />}
      <Bestaetigen offen={beenden} titel={`${auswahl.length} ${auswahl.length === 1 ? "Kampagne" : "Kampagnen"} beenden?`} text={KAMPAGNEN.beendenText(30)} bestaetigen="Beenden" laeuft={laeuft} onAbbrechen={() => setBeenden(false)} onBestaetigen={async () => { await sofort(() => kampagneWorkflowAction({ namen: auswahl.filter((k) => ["Aktiv", "Pausiert"].includes(k.status)).map((k) => k.name), aktion: "Beenden" }), { ok: "Beendet" }); setBeenden(false); setGewaehlt(new Set()); }} />
    </>
  );
}

export function KennzahlDialog({ k, onSchliessen }) {
  const [w, setW] = useState({ datum: isoTag(new Date()), impressionen: "", klicks: "", kosten: "", anfragen: "", notiz: "" });
  const [fehler, setFehler] = useState({});
  const [ueber, setUeber] = useState(false);
  const { sofort, laeuft } = useAktion();
  const los = async () => {
    const r = await sofort(() => kennzahlErfassenAction({ name: k.name, ...w }), { ok: KAMPAGNEN.kennzahlOk });
    if (r?.ok) {
      if (r.ueberBudget) setUeber(true);
      else onSchliessen();
    } else setFehler(r?.fehler || {});
  };
  const F = KAMPAGNEN.kennzahlFelder;
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={KAMPAGNEN.kennzahlTitel(k.titel)} groesse="sm" testid="kennzahl-dialog" fuss={<><Knopf onClick={onSchliessen}>{ueber ? "Schließen" : "Abbrechen"}</Knopf>{!ueber && <Knopf variant="primary" onClick={los} laedt={laeuft} disabled={laeuft} data-testid="kennzahl-speichern">Speichern</Knopf>}</>}>
      {ueber ? (
        <p className="bo-mar-gefahr text-[15px]" role="alert">{KAMPAGNEN.ueberBudget}</p>
      ) : (
        <form className="bo-mar-felder" onSubmit={(e) => { e.preventDefault(); los(); }}>
          <div className="bo-mar-feld voll"><span>{F.datum}</span><Datumsfeld value={w.datum} onChange={(v) => setW({ ...w, datum: v })} aria-label={F.datum} invalid={!!fehler.datum} /></div>
          {["impressionen", "klicks"].map((f) => (
            <label key={f} className="bo-mar-feld"><span>{F[f]}</span><input className="bo-mar-eingabe" inputMode="numeric" value={w[f]} onChange={(e) => setW({ ...w, [f]: e.target.value })} aria-invalid={fehler[f] ? "true" : undefined} />{fehler[f] && <span className="bo-mar-feld__fehler">{fehler[f]}</span>}</label>
          ))}
          <label className="bo-mar-feld"><span>{F.kosten} {k.waehrung && k.waehrung !== "EUR" ? `(${k.waehrung})` : "(€)"}</span><input className="bo-mar-eingabe" inputMode="decimal" autoFocus value={w.kosten} onChange={(e) => setW({ ...w, kosten: e.target.value })} aria-invalid={fehler.kosten ? "true" : undefined} data-testid="kennzahl-kosten" /><span className={fehler.kosten ? "bo-mar-feld__fehler" : "bo-mar-feld__hinweis"}>{fehler.kosten || KAMPAGNEN.kostenHinweis}</span></label>
          <label className="bo-mar-feld"><span>{F.anfragen}</span><input className="bo-mar-eingabe" inputMode="numeric" value={w.anfragen} onChange={(e) => setW({ ...w, anfragen: e.target.value })} /><span className="bo-mar-feld__hinweis">{KAMPAGNEN.anfragenHinweis}</span></label>
          <label className="bo-mar-feld voll"><span>{F.notiz}</span><input className="bo-mar-eingabe" value={w.notiz} onChange={(e) => setW({ ...w, notiz: e.target.value })} /></label>
          <button type="submit" className="sr-only">Speichern</button>
        </form>
      )}
    </Dialog>
  );
}

export function KampagneAnlegenKnopf({ auto = false }) {
  const [offen, setOffen] = useState(auto);
  const router = useRouter();
  const [w, setW] = useState({ titel: "", kanal: "Meta", zeitraum_von: isoTag(new Date()), zeitraum_bis: "", budget: "", ziel_kennzahl: "Anfragen", ziel_wert: "", landingpage: "" });
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const los = async () => {
    const r = await sofort(() => kampagneAnlegenAction(w), { ok: KAMPAGNEN.angelegt(w.titel), neuLaden: false });
    if (r?.ok) router.push(`/marketing/kampagnen/${encodeURIComponent(r.name)}`);
    else setFehler(r?.fehler || {});
  };
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} data-testid="neue-kampagne">{KAMPAGNEN.neu}</Knopf>
      {offen && (
        <Dialog offen onSchliessen={() => setOffen(false)} titel={KAMPAGNEN.neu} groesse="md" testid="kampagne-anlegen" fuss={<><Knopf onClick={() => setOffen(false)}>Abbrechen</Knopf><Knopf variant="primary" onClick={los} laedt={laeuft} disabled={laeuft}>Anlegen</Knopf></>}>
          <div className="bo-mar-felder">
            <label className="bo-mar-feld voll"><span>{KAMPAGNEN.felder.titel}</span><input className="bo-mar-eingabe" autoFocus value={w.titel} onChange={(e) => setW({ ...w, titel: e.target.value })} aria-invalid={fehler.titel ? "true" : undefined} />{fehler.titel && <span className="bo-mar-feld__fehler">{fehler.titel}</span>}</label>
            <label className="bo-mar-feld"><span>{KAMPAGNEN.felder.kanal}</span><select className="bo-mar-eingabe" value={w.kanal} onChange={(e) => setW({ ...w, kanal: e.target.value })}>{KAMPAGNE_KANAL.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="bo-mar-feld"><span>{KAMPAGNEN.felder.budget} (€)</span><input className="bo-mar-eingabe" inputMode="decimal" value={w.budget} onChange={(e) => setW({ ...w, budget: e.target.value })} aria-invalid={fehler.budget ? "true" : undefined} />{fehler.budget && <span className="bo-mar-feld__fehler">{fehler.budget}</span>}</label>
            <div className="bo-mar-feld"><span>{KAMPAGNEN.felder.zeitraum_von}</span><Datumsfeld value={w.zeitraum_von} onChange={(v) => setW({ ...w, zeitraum_von: v })} aria-label={KAMPAGNEN.felder.zeitraum_von} /></div>
            <div className="bo-mar-feld"><span>{KAMPAGNEN.felder.zeitraum_bis}</span><Datumsfeld value={w.zeitraum_bis} onChange={(v) => setW({ ...w, zeitraum_bis: v })} aria-label={KAMPAGNEN.felder.zeitraum_bis} invalid={!!fehler.zeitraum_bis} />{fehler.zeitraum_bis && <span className="bo-mar-feld__fehler">{fehler.zeitraum_bis}</span>}</div>
            <label className="bo-mar-feld"><span>{KAMPAGNEN.felder.ziel_kennzahl}</span><select className="bo-mar-eingabe" value={w.ziel_kennzahl} onChange={(e) => setW({ ...w, ziel_kennzahl: e.target.value })}>{ZIEL_KENNZAHL.map((k) => <option key={k}>{k}</option>)}</select></label>
            <label className="bo-mar-feld"><span>{KAMPAGNEN.felder.ziel_wert}</span><input className="bo-mar-eingabe" inputMode="numeric" value={w.ziel_wert} onChange={(e) => setW({ ...w, ziel_wert: e.target.value })} /></label>
            <label className="bo-mar-feld voll"><span>{KAMPAGNEN.felder.landingpage}</span><input className="bo-mar-eingabe" type="url" value={w.landingpage} onChange={(e) => setW({ ...w, landingpage: e.target.value })} placeholder="https://platzhirsch.studio/…" /><span className="bo-mar-feld__hinweis">Kampagnen-Kennung: {kennungAusTitel(w.titel) || "–"}</span></label>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function KampagneAktionen({ k, leitung, team, nachlauf = 30 }) {
  const [offen, setOffen] = useState(null);
  const { sofort, verzoegert, laeuft } = useAktion();
  useKuerzel("akte@marketing", { "marketing.akte-kennzahl": () => team && setOffen("kennzahl") });
  const prim =
    k.status === "Entwurf" && leitung ? { t: KAMPAGNEN.aktivieren, f: () => verzoegert(() => kampagneWorkflowAction({ namen: [k.name], aktion: "Aktivieren" }), { text: KAMPAGNEN.aktiviert(k.titel) }), grund: !k.zeitraum_von ? KAMPAGNEN.zeitraumFehlt : null }
    : k.status === "Aktiv" && team ? { t: KAMPAGNEN.pausieren, f: () => verzoegert(() => kampagneWorkflowAction({ namen: [k.name], aktion: "Pausieren" }), { text: KAMPAGNEN.pausiert(k.titel) }) }
    : k.status === "Pausiert" && team ? { t: KAMPAGNEN.fortsetzen, f: () => verzoegert(() => kampagneWorkflowAction({ namen: [k.name], aktion: "Fortsetzen" }), { text: KAMPAGNEN.fortgesetzt(k.titel) }) }
    : k.status === "Beendet" && leitung ? { t: KAMPAGNEN.wiederAktivieren, f: () => setOffen("wieder") }
    : null;
  return (
    <div className="bo-mar-aktionen">
      {team && k.status !== "Entwurf" && <Knopf icon="Plus" onClick={() => setOffen("kennzahl")} data-testid="kennzahl-erfassen">Kennzahl erfassen</Knopf>}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" />}>
        <MenuePunkt icon="Printer" href={`/druck/ph-kampagne/${encodeURIComponent(k.name)}?format=${encodeURIComponent("PH Kampagnenbericht")}`}>{KAMPAGNEN.bericht}</MenuePunkt>
        {leitung && ["Aktiv", "Pausiert"].includes(k.status) && (<><MenueTrenner /><MenuePunkt icon="CircleX" onWaehlen={() => setOffen("beenden")}>{KAMPAGNEN.beenden}</MenuePunkt></>)}
      </Menue>
      {prim && <span className="inline-flex flex-col items-end"><Knopf variant="primary" onClick={prim.f} disabled={!!prim.grund || laeuft} data-testid="kampagne-primaer">{prim.t}</Knopf>{prim.grund && <span className="bo-mar-klein bo-mar-warn mt-1">{prim.grund}</span>}</span>}
      {offen === "kennzahl" && <KennzahlDialog k={k} onSchliessen={() => setOffen(null)} />}
      <Bestaetigen offen={offen === "beenden"} titel={KAMPAGNEN.beendenTitel(k.titel)} text={KAMPAGNEN.beendenText(nachlauf)} bestaetigen="Beenden" laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => kampagneWorkflowAction({ namen: [k.name], aktion: "Beenden" }), { ok: KAMPAGNEN.beendet(k.titel) }); setOffen(null); }} />
      <Bestaetigen offen={offen === "wieder"} titel={KAMPAGNEN.wiederTitel(k.titel)} bestaetigen="Wieder aktivieren" laeuft={laeuft} onAbbrechen={() => setOffen(null)} onBestaetigen={async () => { await sofort(() => kampagneWorkflowAction({ namen: [k.name], aktion: "Wieder" }), { ok: KAMPAGNEN.aktiviert(k.titel) }); setOffen(null); }} />
    </div>
  );
}

export function KampagnenLinkKachel({ k, darf }) {
  const [w, setW] = useState({ landingpage: k.landingpage || "", utm_source: k.utm_source || "", utm_medium: k.utm_medium || "", utm_campaign: k.utm_campaign || kennungAusTitel(k.titel) });
  const { sofort, laeuft } = useAktion();
  const link = kampagnenLink(w);
  return (
    <section className="bo-kachel" style={{ padding: 24 }} data-testid="kampagnen-link">
      <h2 className="bo-titel-kachel">{KAMPAGNEN.kampagnenLink}</h2>
      <p className="bo-mar-unter mt-1">{KAMPAGNEN.linkSatz}</p>
      <div className="bo-mar-felder mt-4">
        {["landingpage", "utm_source", "utm_medium", "utm_campaign"].map((f) => (
          <label key={f} className={`bo-mar-feld ${f === "landingpage" ? "voll" : ""}`}><span>{KAMPAGNEN.felder[f]}</span><input className="bo-mar-eingabe" value={w[f]} disabled={!darf} onChange={(e) => setW({ ...w, [f]: e.target.value })} /></label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <code className="bo-mar-mono min-w-0 flex-1 break-all rounded-[14px] bg-(--color-bo-surface-2) px-3 py-2">{link || "Zielseite eintragen"}</code>
        {link && <KopierKnopf text={link} titel={KAMPAGNEN.kopieren} ok={KAMPAGNEN.kopiert} size="s" />}
        {darf && <Knopf size="s" laedt={laeuft} onClick={() => sofort(() => kampagneSpeichernAction({ name: k.name, werte: w }), { ok: "Kampagnen-Link gespeichert" })}>Speichern</Knopf>}
      </div>
    </section>
  );
}

export function CsvImport({ name }) {
  const [offen, setOffen] = useState(false);
  const [text, setText] = useState("");
  const [vorschau, setVorschau] = useState(null);
  const { sofort, laeuft } = useAktion();
  const lesen = async (datei) => {
    const t = await datei.text();
    setText(t);
    const r = await kennzahlenCsvAction({ name, csv: t });
    setVorschau(r?.ok ? r : { zeilen: [], fehler: [r?.message] });
  };
  return (
    <>
      <Knopf icon="Download" onClick={() => setOffen(true)} data-testid="csv-import">{KAMPAGNEN.csvImport}</Knopf>
      {offen && (
        <Dialog offen onSchliessen={() => setOffen(false)} titel={KAMPAGNEN.csvImport.replace(" …", "")} groesse="md" fuss={<><Knopf onClick={() => setOffen(false)}>Abbrechen</Knopf><Knopf variant="primary" disabled={!vorschau?.anzahl || laeuft} laedt={laeuft} onClick={async () => { const r = await sofort(() => kennzahlenCsvAction({ name, csv: text, uebernehmen: true }), { ok: (x) => KAMPAGNEN.csvOk(x.uebernommen) }); if (r?.ok) setOffen(false); }}>{KAMPAGNEN.csvUebernehmen(vorschau?.anzahl || 0)}</Knopf></>}>
          <div className="flex flex-col gap-4">
            <input type="file" accept=".csv,text/csv,text/plain" onChange={(e) => e.target.files?.[0] && lesen(e.target.files[0])} />
            {vorschau && (
              <>
                <p className="bo-mar-unter">{vorschau.anzahl ? KAMPAGNEN.csvVorschau(vorschau.anzahl, vorschau.fehler?.length) : KAMPAGNEN.csvLeer}</p>
                {vorschau.fehler?.length > 0 && <ul className="bo-mar-klein bo-mar-warn">{vorschau.fehler.slice(0, 5).map((f) => <li key={f}>{f}</li>)}</ul>}
                {vorschau.zeilen?.length > 0 && (
                  <table className="bo-mar-tabelle"><thead><tr><th>Datum</th><th className="r">Impressionen</th><th className="r">Klicks</th><th className="r">Kosten</th></tr></thead><tbody>{vorschau.zeilen.slice(0, 8).map((z, i) => <tr key={i}><td>{kurzDatum(z.datum)}</td><td className="r bo-mar-zahl">{z.impressionen}</td><td className="r bo-mar-zahl">{z.klicks}</td><td className="r bo-mar-zahl">{cent(z.kosten_cent)}</td></tr>)}</tbody></table>
                )}
              </>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}

export { prozent };
