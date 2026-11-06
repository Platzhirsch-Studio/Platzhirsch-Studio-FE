"use client";
// Dialoge des Bereichs Kundenkarte (Konzept §3.3, §3.5.4–§3.5.6, §3.6). Bestätigungen nur nach Q-C6 (Folge in
// einem Satz, gefährlich → Fokus auf Abbrechen); Sperren/Übergabe/Einlösen als verzögerter Commit (8 s).

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Fakten } from "../Overlay";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { ABLEHNUNGSGRUENDE, ERSATZ_GRUENDE, SPERRGRUENDE, UEBERTRAGUNGSGRUENDE, WIDERRUF_KANAELE, sperrgrund } from "@/lib/backoffice/kundenkarte/labels";
import { antragAblehnenAction, antragDoppeltAction, einloesungStornierenAction, einwilligungBeendenAction, entsperrenAction, ersatzkarteAction, kontaktSuchenAction, kuendigenAction, sperrenPlanenAction, uebertragenAction, zusammenfuehrenAction } from "@/lib/backoffice/kundenkarte/actions";
import { T } from "@/lib/backoffice/kundenkarte/texte";

/** Chips als Radiogruppe (Pflichtauswahl). */
export function ChipWahl({ label, optionen, wert, onWert, name, testid }) {
  const id = useId();
  return (
    <fieldset className="min-w-0">
      <legend id={id} className="bo-kk-label">
        {label}
      </legend>
      <div className="bo-kk-chips" role="radiogroup" aria-labelledby={id} data-testid={testid}>
        {optionen.map((o) => {
          const w = typeof o === "string" ? o : o.wert;
          const t = typeof o === "string" ? o : o.label;
          return (
            <button key={w} type="button" role="radio" name={name} aria-checked={wert === w} className="bo-kk-chip" onClick={() => onWert(w)}>
              {t}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Textfeld({ label, wert, onWert, pflicht = false, mehrzeilig = false, max = 140, fehler, hilfe, testid, ...rest }) {
  const id = useId();
  const Tag = mehrzeilig ? "textarea" : "input";
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="bo-kk-label">
        {label}
        {pflicht && <span className="bo-kk-sr"> (Pflicht)</span>}
      </label>
      <Tag id={id} className="bo-kk-feld" value={wert} maxLength={max} onChange={(e) => onWert(e.target.value)} aria-invalid={fehler ? "true" : undefined} aria-describedby={fehler ? `${id}-f` : hilfe ? `${id}-h` : undefined} data-testid={testid} {...rest} />
      {fehler ? (
        <p id={`${id}-f`} className="bo-kk-fehler">
          {fehler}
        </p>
      ) : hilfe ? (
        <p id={`${id}-h`} className="bo-kk-hilfe">
          {hilfe}
        </p>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ Sperren --

export function SperrenDialog({ karten = [], onSchliessen, onGeplant, onZurueck, onErsatzVorschlag }) {
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [art, setArt] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  const sg = sperrgrund(art);
  const endgueltig = sg && !sg.entsperrbar;
  return (
    <Bestaetigen
      offen
      titel={karten.length === 1 ? `Karte ${karten[0]} sperren?` : `${karten.length} Karten sperren?`}
      text={T.sperren.satz}
      bestaetigen={T.sperren.knopf}
      gefaehrlich
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-sperren"
      onBestaetigen={() => {
        if (!art) return setFehler("Bitte einen Grund wählen.");
        if (art === "Sonstiges" && text.trim().length < 3) return setFehler("Bei „Sonstiges“ bitte kurz beschreiben.");
        starteTr(async () => {
          const r = await sperrenPlanenAction({ karten, art, text });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          const namen = r.plaene.map((p) => p.karte);
          onGeplant?.(namen);
          onSchliessen?.();
          for (const p of r.plaene) {
            starte(T.sperren.toast(p.karte), { token: p.plan.token, ms: p.plan.ms, objekt: p.plan.objekt, gruppe: "kundenkarte.sperren", sammel: (n) => `${n} Karten gesperrt`, fehlerText: `Sperren ${p.karte}`, onVerworfen: onZurueck, onFehler: onZurueck, onErfolg: onZurueck });
          }
          if (r.uebersprungen) zeige(`${r.uebersprungen} übersprungen – nur aktive oder beantragte Karten lassen sich sperren.`, { art: "info" });
          if (sg?.ersatzkarte && namen.length === 1) onErsatzVorschlag?.(art);
        });
      }}
    >
      <div className="flex flex-col gap-4 text-left">
        <ChipWahl label="Grund" optionen={SPERRGRUENDE.map((s) => ({ wert: s.wert, label: s.label }))} wert={art} onWert={(w) => (setArt(w), setFehler(""))} name="sperrgrund" testid="kk-sperrgrund" />
        <Textfeld label={T.sperren.text} wert={text} onWert={setText} pflicht={art === "Sonstiges"} hilfe={art === "Sonstiges" ? "Pflicht bei „Sonstiges“" : "optional"} />
        {endgueltig && <p className="bo-kk-warn">{T.sperren.endgueltig}</p>}
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Bestaetigen>
  );
}

// ---------------------------------------------------------------- Ersatzkarte --

export function ErsatzDialog({ karte, startArt = "", onSchliessen, onErgebnis }) {
  const [art, setArt] = useState(startArt && ERSATZ_GRUENDE.includes(startArt) ? startArt : "");
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  return (
    <Bestaetigen
      offen
      titel={T.ersatz.titel}
      text={T.ersatz.satz}
      bestaetigen={T.ersatz.knopf}
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-ersatz"
      onBestaetigen={() => {
        if (!art) return setFehler("Bitte einen Grund wählen.");
        starteTr(async () => {
          const r = await ersatzkarteAction({ karte, art, grund });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onErgebnis?.(r.karte);
        });
      }}
    >
      <div className="flex flex-col gap-4 text-left">
        <ChipWahl label="Grund" optionen={ERSATZ_GRUENDE.map((w) => ({ wert: w, label: sperrgrund(w).label }))} wert={art} onWert={(w) => (setArt(w), setFehler(""))} name="ersatzgrund" />
        <Textfeld label="Ergänzung" wert={grund} onWert={setGrund} hilfe="optional" />
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Bestaetigen>
  );
}

// ---------------------------------------------------------------- Kündigen --

export function KuendigenDialog({ karte, onSchliessen, onFertig }) {
  const [durch, setDurch] = useState("");
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  return (
    <Bestaetigen
      offen
      titel={`Karte ${karte} kündigen?`}
      text={T.kuendigen.satz}
      bestaetigen={T.kuendigen.knopf}
      gefaehrlich
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-kuendigen"
      onBestaetigen={() => {
        if (!durch || grund.trim().length < 3) return setFehler("Bitte angeben, wer kündigt, und einen Grund.");
        starteTr(async () => {
          const r = await kuendigenAction({ karte, durch, grund });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.();
        });
      }}
    >
      <div className="flex flex-col gap-4 text-left">
        <ChipWahl label={T.kuendigen.wer} optionen={[T.kuendigen.kundin, T.kuendigen.platzhirsch]} wert={durch} onWert={setDurch} name="kuendigung_durch" />
        <Textfeld label={T.kuendigen.grund} wert={grund} onWert={setGrund} pflicht />
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Bestaetigen>
  );
}

export function EntsperrenDialog({ karte, onSchliessen, onFertig }) {
  const [laeuft, starteTr] = useTransition();
  const [fehler, setFehler] = useState("");
  return (
    <Bestaetigen
      offen
      titel={T.entsperren.titel(karte)}
      text="Die Karte wird an der Kassa wieder angenommen."
      bestaetigen={T.entsperren.knopf}
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-entsperren"
      onBestaetigen={() =>
        starteTr(async () => {
          const r = await entsperrenAction({ karte });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.();
        })
      }
    >
      {fehler && (
        <p className="bo-kk-fehler" role="alert">
          {fehler}
        </p>
      )}
    </Bestaetigen>
  );
}

// ---------------------------------------------------------------- Übertragen --

export function UebertragenDialog({ karte, onSchliessen, onErgebnis }) {
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [ziel, setZiel] = useState(null);
  const [grundArt, setGrundArt] = useState("");
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  const suche = (t) => {
    setQ(t);
    setZiel(null);
    if (t.trim().length < 2) return setTreffer([]);
    kontaktSuchenAction({ q: t }).then((r) => setTreffer(r?.treffer || []));
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.uebertragen.titel}
      text={T.uebertragen.satz}
      groesse="md"
      sperren={laeuft}
      testid="kk-uebertragen"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            disabled={!ziel || !grundArt}
            onClick={() =>
              starteTr(async () => {
                const r = await uebertragenAction({ karte, zielKontakt: ziel?.name, grundArt, grund });
                if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
                onErgebnis?.(r.karte);
              })
            }
          >
            {T.uebertragen.knopf}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Textfeld label={T.uebertragen.ziel} wert={q} onWert={suche} placeholder={T.uebertragen.zielSuche} autoComplete="off" />
        {treffer.length > 0 && !ziel && (
          <ul className="bo-kk-zeilen" aria-label="Kontakte">
            {treffer.map((k) => (
              <li key={k.name} className="bo-kk-zeile">
                <button type="button" className="flex w-full items-center gap-3 text-left" disabled={Boolean(k.karte) || !k.privat} onClick={() => (setZiel(k), setQ(k.titel))}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{k.titel}</span>
                    <span className="block text-[12px] text-bo-text-soft">{[k.ort, k.karte ? `hat Karte ${k.karte}` : null, !k.privat ? "Firma" : null].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <ChipWahl label="Grund" optionen={UEBERTRAGUNGSGRUENDE} wert={grundArt} onWert={setGrundArt} name="uebertragung" />
        <Textfeld label="Beschreibung" wert={grund} onWert={setGrund} pflicht={grundArt === "Sonstiges"} hilfe={grundArt === "Sonstiges" ? "Pflicht bei „Sonstiges“" : "optional"} />
        <p className="bo-kk-hilfe">Einwilligung der neuen Person zur Auswertung wird danach an der neuen Karte erfasst – nur mit Nachweis.</p>
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------ Zusammenführen --

export function ZusammenDialog({ karte, vorschlag = "", onSchliessen, onFertig }) {
  const [andere, setAndere] = useState(vorschlag);
  const [plan, setPlan] = useState(null);
  const [trotz, setTrotz] = useState(false);
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  const planen = () =>
    starteTr(async () => {
      setFehler("");
      const r = await zusammenfuehrenAction({ karte, andere, trotz });
      if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
      setPlan(r.plan);
    });
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.zusammen.titel}
      groesse="md"
      sperren={laeuft}
      testid="kk-zusammen"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          {plan ? (
            <Knopf
              variant="primary"
              laedt={laeuft}
              onClick={() =>
                starteTr(async () => {
                  const r = await zusammenfuehrenAction({ karte, andere, trotz, ausfuehren: true });
                  if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
                  onFertig?.(r.plan.ziel);
                })
              }
            >
              {T.zusammen.knopf}
            </Knopf>
          ) : (
            <Knopf variant="primary" laedt={laeuft} disabled={andere.trim().length < 6} onClick={planen}>
              Plan zeigen
            </Knopf>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Textfeld label={T.zusammen.andere} wert={andere} onWert={(w) => (setAndere(w), setPlan(null))} placeholder="KK-…" autoCapitalize="characters" data-scan="ja" />
        {plan && (
          <Fakten
            eintraege={[
              { label: T.zusammen.plan, wert: T.zusammen.ziel(plan.ziel) },
              { label: "Quelle", wert: T.zusammen.quellen(plan.quellen.join(", ")) },
              { label: "Einlösungen", wert: T.zusammen.einl(plan.einloesungen ?? 0) },
              ...(plan.werte?.stufe ? [{ label: "Stufe", wert: `wird ${plan.werte.stufe}` }] : []),
              ...plan.warnungen.map((w) => ({ label: "Hinweis", wert: w })),
            ]}
          />
        )}
        {/verschiedenen Kontakten/.test(fehler) && (
          <label className="bo-kk-haken">
            <input type="checkbox" checked={trotz} onChange={(e) => setTrotz(e.target.checked)} />
            {T.zusammen.trotz}
          </label>
        )}
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Dialog>
  );
}

// --------------------------------------------------------- Auswertung beenden --

export function EinwilligungBeendenDialog({ karte, name, vonHand = false, onSchliessen, onFertig }) {
  const [kanal, setKanal] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  const folgen = T.einwilligung.beendenFolgen.map((f) => (vonHand && /Stufe/.test(f) ? T.einwilligung.beendenVonHand : f));
  return (
    <Bestaetigen
      offen
      titel={T.einwilligung.beendenTitel(name)}
      bestaetigen={T.einwilligung.beendenKnopf}
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-widerruf"
      fakten={folgen.map((f) => ({ label: "Folge", wert: f }))}
      onBestaetigen={() => {
        if (!kanal) return setFehler("Bitte angeben, wie widerrufen wurde.");
        starteTr(async () => {
          const r = await einwilligungBeendenAction({ karte, kanal });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.();
        });
      }}
    >
      <div className="flex flex-col gap-3 text-left">
        <ChipWahl label={T.einwilligung.beendenWie} optionen={WIDERRUF_KANAELE} wert={kanal} onWert={(w) => (setKanal(w), setFehler(""))} name="widerruf_kanal" />
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Bestaetigen>
  );
}

// ----------------------------------------------------------------- Anträge --

export function AblehnenDialog({ antraege = [], onSchliessen, onFertig }) {
  const [grund, setGrund] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  return (
    <Bestaetigen
      offen
      titel={antraege.length === 1 ? `Antrag ${antraege[0]} ablehnen?` : `${antraege.length} Anträge ablehnen?`}
      text={T.ablehnen.satz}
      bestaetigen={T.ablehnen.knopf}
      gefaehrlich
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-ablehnen"
      onBestaetigen={() => {
        if (!grund) return setFehler("Bitte einen Grund wählen.");
        if (grund === "Sonstiges" && text.trim().length < 3) return setFehler("Bei „Sonstiges“ bitte kurz beschreiben.");
        starteTr(async () => {
          const r = await antragAblehnenAction({ antraege, grund, text });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.(r);
        });
      }}
    >
      <div className="flex flex-col gap-4 text-left">
        <fieldset>
          <legend className="bo-kk-label">{T.ablehnen.grund}</legend>
          <div className="flex flex-col gap-1.5" role="radiogroup">
            {ABLEHNUNGSGRUENDE.map((g) => (
              <label key={g} className="bo-kk-haken py-2.5">
                <input type="radio" name="ablehngrund" value={g} checked={grund === g} onChange={() => (setGrund(g), setFehler(""))} />
                {g}
              </label>
            ))}
          </div>
        </fieldset>
        <Textfeld label={T.ablehnen.text} wert={text} onWert={setText} pflicht={grund === "Sonstiges"} hilfe={grund === "Sonstiges" ? "Pflicht bei „Sonstiges“ (höchstens 140 Zeichen)" : "optional"} />
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Bestaetigen>
  );
}

export function DoppeltDialog({ antraege = [], karte, onSchliessen, onFertig }) {
  const [laeuft, starteTr] = useTransition();
  const [fehler, setFehler] = useState("");
  return (
    <Bestaetigen
      offen
      titel={T.doppelt.titel}
      text={T.doppelt.satz(karte)}
      bestaetigen={T.doppelt.knopf}
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-doppelt"
      onBestaetigen={() =>
        starteTr(async () => {
          const r = await antragDoppeltAction({ antraege });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.(r);
        })
      }
    >
      {fehler && (
        <p className="bo-kk-fehler" role="alert">
          {fehler}
        </p>
      )}
    </Bestaetigen>
  );
}

// ----------------------------------------------------------------- Storno --

export function StornoDialog({ einloesung, titel, onSchliessen, onFertig }) {
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starteTr] = useTransition();
  const router = useRouter();
  return (
    <Bestaetigen
      offen
      titel={T.einloesungen.stornoTitel}
      text={T.einloesungen.stornoSatz}
      fakten={titel ? [{ label: "Einlösung", wert: titel }] : undefined}
      bestaetigen={T.einloesungen.stornoKnopf}
      gefaehrlich
      groesse="md"
      laeuft={laeuft}
      onAbbrechen={onSchliessen}
      testid="kk-storno"
      onBestaetigen={() => {
        if (grund.trim().length < 3) return setFehler("Bitte einen Grund angeben.");
        starteTr(async () => {
          const r = await einloesungStornierenAction({ einloesung, grund });
          if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
          onFertig?.();
          router.refresh();
        });
      }}
    >
      <div className="text-left">
        <Textfeld label={T.einloesungen.stornoGrund} wert={grund} onWert={(w) => (setGrund(w), setFehler(""))} pflicht fehler={fehler || undefined} />
      </div>
    </Bestaetigen>
  );
}
