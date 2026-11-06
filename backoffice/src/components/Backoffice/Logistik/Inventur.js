"use client";
// Inventur (10-konzept-logistik § 4.13, § 8.1; README ph_logistik „Lager & Inventur“):
// Zaehlliste – Ist inline (Enter → nächste Zeile), Differenz live, Grund optional beim Zählen, Pflicht vor Freigabe.
// ZaehlModus – mobile Zählung am iPhone/iPad: Bereich wählen, scannen (Bestand/SN/EAN/Platz), Zahlenfeld mit ±,
// Stückscan (+1 je Scan), „Als Fund erfassen“, Fortschritt; Soll nur ohne Blindzählung.

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ScanLine, Check } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import { useToast } from "../Toast";
import { differenz, inventurFortschritt, zaehlReihenfolge, GRUENDE } from "@/lib/backoffice/logistik/inventur";
import { wertText } from "@/lib/backoffice/logistik/status";
import { DIALOG, INVENTUR as T } from "@/lib/backoffice/logistik/texte";
import { Balken } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };

export function Zaehlliste({ inventur, positionen: start, laufend, sollAusblenden, aktion, grundAktion, nurDifferenzen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pos, setPos] = useState(start);
  const [, los] = useTransition();
  const felder = useRef([]);
  const liste = nurDifferenzen ? pos.filter((p) => (differenz(p) ?? 0) !== 0).sort((a, b) => Math.abs(differenz(b)) - Math.abs(differenz(a))) : zaehlReihenfolge(pos);

  const zaehlen = (p, wert, i) => {
    const ist = Math.trunc(Number(wert));
    if (!Number.isFinite(ist) || ist < 0 || String(wert).trim() === "") return;
    if (Number(p.gezaehlt) && Number(p.ist) === ist) return felder.current[i + 1]?.focus();
    const alt = { ist: p.ist, gezaehlt: p.gezaehlt };
    setPos((x) => x.map((y) => (y.lagerbestand === p.lagerbestand ? { ...y, ist, gezaehlt: 1, differenz: ist - Number(y.soll || 0) } : y)));
    felder.current[i + 1]?.focus();
    los(async () => {
      const r = await aktion({ name: inventur, methode: "zaehlen", args: { lagerbestand: p.lagerbestand, ist } });
      if (!r.ok) {
        setPos((x) => x.map((y) => (y.lagerbestand === p.lagerbestand ? { ...y, ...alt } : y)));
        return zeige(r.message, { art: "fehler" });
      }
      zeige(`Ist ${ist}: ${p.produkt_name}`, { art: "ok", aktion: Number(alt.gezaehlt) ? { titel: DIALOG.rueckgaengig, onClick: async () => { await aktion({ name: inventur, methode: "zaehlen", args: { lagerbestand: p.lagerbestand, ist: Number(alt.ist) } }); router.refresh(); } } : undefined });
    });
  };
  const grund = (p, g) =>
    los(async () => {
      setPos((x) => x.map((y) => (y.lagerbestand === p.lagerbestand ? { ...y, grund: g } : y)));
      const r = await grundAktion({ name: inventur, lagerbestand: p.lagerbestand, grund: g });
      if (!r.ok) zeige(r.message, { art: "fehler" });
      else router.refresh();
    });

  if (!liste.length) return <p className="bo-log-cap">{nurDifferenzen ? "Keine Differenzen – alle gezählten Positionen stimmen." : "Noch keine Zählliste."}</p>;
  return (
    <div className="bo-log-tabhuelle">
      <table className="bo-log-tab" data-testid={nurDifferenzen ? "differenzen" : "zaehlliste"}>
        <thead><tr><th>Platz</th><th>Artikel</th>{!sollAusblenden ? <th className="r">{T.zaehlen.soll}</th> : null}<th className="r">{T.zaehlen.ist}</th><th className="r">Differenz</th><th>Grund</th></tr></thead>
        <tbody>
          {liste.map((p, i) => {
            const d = differenz(p);
            return (
              <tr key={p.lagerbestand || p.name} data-markiert={d ? "true" : undefined}>
                <td><span className="bo-log-platz">{p.platz || "–"}</span></td>
                <td><b className="font-semibold">{p.produkt_name}</b>{p.seriennummer ? <span className="bo-log-mono block">SN {p.seriennummer}</span> : null}{Number(p.fund) ? <span className="bo-log-cap block">Fund</span> : null}</td>
                {!sollAusblenden ? <td className="r">{p.soll}</td> : null}
                <td className="r">
                  {laufend ? (
                    <input ref={(el) => (felder.current[i] = el)} className="h-10 w-20 rounded-[12px] bg-bo-surface-2 px-2 text-right tabular-nums outline-none focus-visible:shadow-(--bo-sh-focus)" inputMode="numeric" defaultValue={Number(p.gezaehlt) ? p.ist : ""} aria-label={`Ist ${p.produkt_name}`}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); zaehlen(p, e.currentTarget.value, i); } }} onBlur={(e) => zaehlen(p, e.currentTarget.value, i)} data-scan="nein" />
                  ) : Number(p.gezaehlt) ? p.ist : "–"}
                </td>
                <td className="r">{d === null ? "–" : d > 0 ? `+${d}` : d}</td>
                <td>
                  {d ? (
                    laufend ? (
                      <select className="h-10 rounded-[12px] bg-bo-surface-2 px-2 outline-none focus-visible:shadow-(--bo-sh-focus)" value={p.grund || ""} onChange={(e) => grund(p, e.target.value)} aria-label={`Grund ${p.produkt_name}`}>
                        <option value="">Grund wählen</option>
                        {GRUENDE.map((g) => <option key={g} value={g}>{wertText(g)}</option>)}
                      </select>
                    ) : wertText(p.grund) || "–"
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Mobile Zählung (§ 8.1, ph_logistik inventur_mobil). */
export function ZaehlModus({ inventur, titel, positionen: start, sollAusblenden, aktion, laufend }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pos, setPos] = useState(start);
  const [bereich, setBereich] = useState("");
  const [code, setCode] = useState("");
  const [aktiv, setAktiv] = useState(null);
  const [ist, setIst] = useState("");
  const [stueck, setStueck] = useState(false);
  const [fund, setFund] = useState(null);
  const [laeuft, los] = useTransition();
  const bereiche = useMemo(() => [...new Set(start.map((p) => String(p.platz || "").split("-")[0]).filter(Boolean))], [start]);
  const liste = zaehlReihenfolge(pos, bereich);
  const f = inventurFortschritt(liste);
  const offen = liste.filter((p) => !Number(p.gezaehlt));
  const akt = aktiv ? pos.find((p) => p.lagerbestand === aktiv) : offen[0] || null;

  const speichern = (p, wert) =>
    los(async () => {
      const n = Math.max(0, Math.trunc(Number(wert)));
      const r = await aktion({ name: inventur, methode: "zaehlen", args: { lagerbestand: p.lagerbestand, ist: n, idempotency: `${inventur}:${p.lagerbestand}:${n}:${Date.now()}` } });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      setPos((x) => x.map((y) => (y.lagerbestand === p.lagerbestand ? { ...y, ist: n, gezaehlt: 1, differenz: n - Number(y.soll || 0) } : y)));
      const d = n - Number(p.soll || 0);
      zeige(sollAusblenden || !d ? `Gezählt: ${p.produkt_name}` : T.zaehlen.differenz(d), { art: d && !sollAusblenden ? "warnung" : "ok" });
      setAktiv(null);
      setIst("");
    });

  const scan = (c) => {
    const t = c.trim();
    if (!t) return;
    setCode("");
    if (t.includes("/")) {
      const platz = t.split("/").pop();
      setBereich(String(platz).split("-")[0]);
      return zeige(`Platz ${platz}`, { art: "info" });
    }
    const p = pos.find((x) => x.lagerbestand === t || (x.seriennummer && x.seriennummer === t) || (x.ean && x.ean === t));
    if (!p) {
      setFund(t);
      return zeige(T.nichtInListe, { art: "warnung" });
    }
    if (stueck)
      return los(async () => {
        const r = await aktion({ name: inventur, methode: "zaehlen_plus", args: { code: t, anzahl: 1, idempotency: `${inventur}:${t}:${Date.now()}` } });
        if (!r.ok) return zeige(r.message, { art: "fehler" });
        setPos((x) => x.map((y) => (y.lagerbestand === p.lagerbestand ? { ...y, ist: Number(y.ist || 0) + 1, gezaehlt: 1 } : y)));
        zeige(`+1 ${p.produkt_name}`, { art: "ok" });
      });
    setAktiv(p.lagerbestand);
    setIst(p.seriennummer ? "1" : "");
  };

  if (!laufend) return <p className="bo-log-cap">Zählen geht nur bei laufender Zählung.</p>;
  return (
    <div className="bo-log-zaehlen" data-testid="zaehlmodus">
      <div className="bo-log-zaehlen__karte">
        <p className="bo-log-cap">{titel}</p>
        <div className="flex items-center justify-between gap-3">
          <b className="text-[22px] font-semibold tabular-nums">{f.gezaehlt}/{f.positionen}</b>
          <span className="bo-log-cap">{bereich ? `Bereich ${bereich}-*` : T.zaehlen.alleBereiche}</span>
        </div>
        <Balken anteil={f.anteil} label={`${f.gezaehlt} von ${f.positionen} gezählt`} />
        {bereiche.length > 1 ? <Segment label={T.zaehlen.bereich} wert={bereich} onWechsel={setBereich} groesse="s" optionen={[{ wert: "", titel: "Alle" }, ...bereiche.map((b) => ({ wert: b, titel: `${b}-*` }))]} /> : null}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); scan(code); }}>
        <label className="bo-log-scan">
          <ScanLine {...S} />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.zaehlen.scan} aria-label={T.zaehlen.scan} data-scan="nein" data-testid="zaehl-scan" />
        </label>
      </form>
      <Schalter label={T.zaehlen.stueckModus} an={stueck} onWechsel={setStueck} />
      {fund ? (
        <div className="bo-log-zaehlen__karte" role="alert">
          <b>{T.nichtInListe}: {fund}</b>
          <div className="flex gap-2">
            <Knopf variant="primary" onClick={() => los(async () => { const r = await aktion({ name: inventur, methode: "position_hinzufuegen", args: { seriennummer: fund, produkt_name: fund, ist: 1, bemerkung: "Fund" } }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige("Als Fund erfasst", { art: "ok" }); setFund(null); router.refresh(); })}>{T.fund}</Knopf>
            <Knopf variant="ghost" onClick={() => setFund(null)}>{DIALOG.abbrechen}</Knopf>
          </div>
        </div>
      ) : null}
      {akt ? (
        <div className="bo-log-zaehlen__karte" data-testid="zaehl-karte">
          <div className="flex items-start justify-between gap-3">
            <span>
              <b className="block text-[19px] font-semibold">{akt.produkt_name}</b>
              <span className="bo-log-cap">{akt.platz || "ohne Platz"}{akt.seriennummer ? ` · SN ${akt.seriennummer}` : ""}{!sollAusblenden ? ` · ${T.zaehlen.soll} ${akt.soll}` : ""}</span>
            </span>
            <span className="bo-log-platz">{akt.platz || "–"}</span>
          </div>
          <div className="bo-log-zaehlen__ist">
            <button type="button" onClick={() => setIst((x) => String(Math.max(0, Number(x || 0) - 1)))} aria-label="Eins weniger"><Minus {...S} /></button>
            <input value={ist} onChange={(e) => setIst(e.target.value.replace(/\D/g, ""))} inputMode="numeric" aria-label={T.zaehlen.ist} placeholder="0" data-scan="nein" data-testid="zaehl-ist" />
            <button type="button" onClick={() => setIst((x) => String(Number(x || 0) + 1))} aria-label="Eins mehr"><Plus {...S} /></button>
          </div>
          {!sollAusblenden && ist !== "" && Number(ist) !== Number(akt.soll) ? <p className="bo-log-hinweis" data-ton="eiche">{T.zaehlen.differenz(Number(ist) - Number(akt.soll))}</p> : null}
          <Knopf variant="primary" size="l" icon="Check" laedt={laeuft} disabled={ist === ""} onClick={() => speichern(akt, ist)} data-testid="zaehl-speichern">{T.zaehlen.speichern}</Knopf>
        </div>
      ) : (
        <div className="bo-log-zaehlen__karte"><p className="flex items-center gap-2"><Check {...S} />{T.zaehlen.fertig}</p></div>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="bo-log-gruppe-titel">{T.zaehlen.nochNicht} · {offen.length}</h2>
        {liste.slice(0, 40).map((p) => (
          <button key={p.lagerbestand} type="button" className="bo-log-zaehl-zeile" data-gezaehlt={Number(p.gezaehlt) && !differenz(p) ? "true" : undefined} data-diff={differenz(p) ? "true" : undefined} aria-current={akt?.lagerbestand === p.lagerbestand ? "true" : undefined} onClick={() => { setAktiv(p.lagerbestand); setIst(Number(p.gezaehlt) ? String(p.ist) : ""); }}>
            <span className="bo-log-platz">{p.platz || "–"}</span>
            <span className="min-w-0 truncate text-[15px]">{p.produkt_name}</span>
            <span className="tabular-nums text-[15px] font-semibold">{Number(p.gezaehlt) ? p.ist : "–"}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
