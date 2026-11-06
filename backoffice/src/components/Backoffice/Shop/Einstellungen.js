"use client";
// Shop-Einstellungen (10-konzept-shop § 4.10, E18): Block „Shop-Modus“ mit Prüfliste (Live nur bei vollständiger
// Liste, zurück auf Test mit Undo 8 s), Formulare je Reiter (⌘S, Toast „Gespeichert · Rückgängig“), sensible
// Felder fragen vor dem Speichern nach. `shop_modus` ist nie ein Formularfeld.
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Bestaetigen from "@/components/Backoffice/Bestaetigen";
import BetragFeld from "@/components/Backoffice/Eingabe/BetragFeld";
import Segment from "@/components/Backoffice/Segment";
import Schalter from "@/components/Backoffice/Schalter";
import { useToast } from "@/components/Backoffice/Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { einstellungenSpeichernAction, shopModusAction, ustFreigabeAction } from "@/lib/backoffice/shop/actions";
import { DatumDialog } from "./Dialoge";
import ShopIcon from "./ShopIcon";

export function ShopModusBlock({ modus, pruefliste = [], leitung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [frage, setFrage] = useState(false);
  const [stb, setStb] = useState(false);
  const [kanzlei, setKanzlei] = useState("");
  const [laeuft, start] = useTransition();
  const voll = pruefliste.every((p) => p.ok);
  return (
    <Kachel titel="Shop-Modus" unter={modus === "live" ? "Zahlungen laufen über Stripe, Mails gehen an Kunden." : modus === "test" ? "Testmodus – Mails gehen an die Testadresse." : "Shop ist aus."} testid="shop-modus"
      werkzeuge={leitung ? (modus === "live" ? <Knopf onClick={() => start(async () => { const r = await shopModusAction({ ziel: "test" }); if (!r.ok) return zeige(r.message, { art: "fehler" }); starte(r.text, { token: r.token, ms: r.ms, objekt: r.objekt, onErfolg: () => router.refresh() }); })}>Zurück auf Test …</Knopf> : <Knopf variant="primary" disabled={!voll} grund={voll ? undefined : "Prüfliste offen"} onClick={() => setFrage(true)} data-testid="live-schalten">Live schalten …</Knopf>) : null}>
      <ul className="bo-shop-zeilen" aria-label="Prüfliste">
        {pruefliste.map((p) => (
          <li key={p.id} className="bo-shop-zeile">
            <span className="bo-shop-zeile__ico" data-ton={p.ok ? "salbei" : "ziegel"} aria-hidden="true"><ShopIcon name={p.ok ? "Check" : "X"} /></span>
            <span className="min-w-0"><span className="bo-shop-zeile__titel block">{p.titel}</span><span className="bo-shop-unter">{p.ok ? p.hinweis || "erledigt" : "offen"}</span></span>
            {p.id === "stb" && !p.ok && leitung ? <Knopf size="s" variant="ghost" onClick={() => setStb(true)}>Freigabe erfassen</Knopf> : <span />}
          </li>
        ))}
      </ul>
      <Bestaetigen offen={frage} titel="Shop live schalten?" text="Ab jetzt werden Zahlungen über Stripe ausgeführt und Mails gehen an Kunden." bestaetigen="Live schalten" laeuft={laeuft} onAbbrechen={() => setFrage(false)}
        onBestaetigen={() => start(async () => { const r = await shopModusAction({ ziel: "live" }); setFrage(false); if (!r.ok) zeige(r.message, { art: "fehler" }); else { zeige("Shop ist live", { art: "ok" }); router.refresh(); } })} />
      {stb && (
        <DatumDialog titel="USt-Freigabe des Steuerberaters erfassen" wert="" hinweis={<span className="flex flex-col gap-2"><span>Name der Kanzlei</span><input className="bo-shop-input" value={kanzlei} onChange={(e) => setKanzlei(e.target.value)} aria-label="Kanzlei" /></span>} laeuft={laeuft} bestaetigen="Freigabe erfassen" onSchliessen={() => setStb(false)}
          onDatum={(d) => start(async () => { const r = await ustFreigabeAction({ datum: d, kanzlei }); if (!r.ok) zeige(r.message, { art: "fehler" }); else { setStb(false); router.refresh(); } })} />
      )}
    </Kachel>
  );
}

/**
 * Formular eines Reiters. felder: [{name, label, typ:"zahl"|"cent"|"text"|"schalter"|"segment"|"lesen", hinweis?, optionen?, sensibel?:string}]
 */
export function EinstellungenForm({ art, felder, werte: start, darf }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [werte, setWerte] = useState(start);
  const [fehler, setFehler] = useState({});
  const [frage, setFrage] = useState(null);
  const [laeuft, los] = useTransition();
  const geaendert = felder.some((f) => String(werte[f.name] ?? "") !== String(start[f.name] ?? ""));
  const speichern = (bestaetigt = false) => {
    const sensibel = felder.find((f) => f.sensibel && String(werte[f.name] ?? "") !== String(start[f.name] ?? ""));
    if (sensibel && !bestaetigt) return setFrage(sensibel);
    los(async () => {
      const aenderung = Object.fromEntries(felder.filter((f) => f.typ !== "lesen" && String(werte[f.name] ?? "") !== String(start[f.name] ?? "")).map((f) => [f.name, werte[f.name]]));
      const r = await einstellungenSpeichernAction({ art, werte: aenderung });
      if (!r.ok) {
        setFehler(r.fehler || {});
        return zeige(r.message, { art: "fehler" });
      }
      setFehler({});
      zeige("Gespeichert", { art: "ok", aktion: { titel: "Rückgängig", onClick: async () => { await einstellungenSpeichernAction({ art, werte: r.ergebnis.alt }); router.refresh(); } } });
      router.refresh();
    });
  };
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (geaendert && darf) speichern();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  const setze = (n, v) => setWerte((w) => ({ ...w, [n]: v }));
  return (
    <Kachel testid={`einstellungen-${art}`}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {felder.map((f) => (
          <div key={f.name} className={`bo-shop-feld${f.typ === "segment" || f.breit ? " md:col-span-2" : ""}`}>
            {f.typ !== "schalter" && <span className="bo-shop-label">{f.label}</span>}
            {f.typ === "cent" && <BetragFeld value={Number(werte[f.name]) || 0} onChange={(c) => setze(f.name, c ?? 0)} disabled={!darf} aria-label={f.label} />}
            {f.typ === "zahl" && <input className="bo-shop-input tabular-nums" inputMode="numeric" value={werte[f.name] ?? ""} onChange={(e) => setze(f.name, e.target.value.replace(/\D/g, ""))} disabled={!darf} aria-label={f.label} aria-invalid={fehler[f.name] ? "true" : undefined} />}
            {f.typ === "text" && <input className="bo-shop-input" value={werte[f.name] ?? ""} onChange={(e) => setze(f.name, e.target.value)} disabled={!darf} aria-label={f.label} />}
            {f.typ === "lesen" && <p className="text-[15px] font-medium">{f.wert ?? werte[f.name] ?? "–"}</p>}
            {f.typ === "schalter" && <Schalter label={f.label} an={!!Number(werte[f.name])} onWechsel={(an) => setze(f.name, an ? 1 : 0)} deaktiviert={!darf} beschreibung={f.hinweis} />}
            {f.typ === "segment" && <Segment label={f.label} wert={werte[f.name]} onWechsel={(v) => darf && setze(f.name, v)} optionen={f.optionen} />}
            {fehler[f.name] ? <p className="bo-shop-fehler">{fehler[f.name]}</p> : f.hinweis && f.typ !== "schalter" ? <p className="bo-shop-hinweis">{f.hinweis}</p> : null}
          </div>
        ))}
      </div>
      {darf && (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-[13px] text-bo-text-soft">{geaendert ? "Ungespeichert" : "Keine Änderungen"}</span>
          {geaendert && <Knopf variant="ghost" onClick={() => setWerte(start)}>Verwerfen</Knopf>}
          <Knopf variant="primary" disabled={!geaendert} laedt={laeuft} onClick={() => speichern()} kuerzel="Strg+S" data-testid="einstellungen-speichern">Speichern</Knopf>
        </div>
      )}
      <Bestaetigen offen={!!frage} titel={`${frage?.label} ändern?`} text={frage?.sensibel} bestaetigen="Speichern" onAbbrechen={() => setFrage(null)} onBestaetigen={() => { setFrage(null); speichern(true); }} />
    </Kachel>
  );
}
