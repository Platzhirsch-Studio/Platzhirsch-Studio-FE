"use client";
// G-18 `Informieren` (Team P0-5c) – „Kunden informieren“ überall gleich (Q-C9, Projekte § 3.5):
// 1. Nach einer kundenrelevanten Änderung bleibt am Objekt der Chip „Kunde nicht informiert · Informieren …“.
// 2. Sheet „Kunden informieren“: Empfänger, Kanal (E-Mail · Telefon · Brief), Vorlage, Vorschau wie eine Mail,
//    Bearbeiten auf Wunsch; Telefon/Brief werden erfasst (Zeitleiste), nicht gesendet.
// 3. „Senden“ = verzögerter Commit 8 s mit Rückgängig (G-03). Weg: Exchange (Postfach des Benutzers) oder die
//    Sende-Methode des Bereichs am Dokument (Mailversand des Servers) – entscheidet der Server.
// 4. Ergebnis am Chip: „Kunde informiert · E-Mail heute 14:05“ bzw. „Nicht gesendet“ mit Ausweg Telefon/Brief.
//
//   <Informieren objekt={{ doctype: "PH Projekt", name: "PRJ-2026-021", titel: "Haus am See" }}
//     empfaenger={{ name: "Familie Stadler", email: "stadler@beispiel.invalid", telefon: "+43 …", bevorzugt: "E-Mail" }}
//     vorlagen={[{ id: "liefertermin", titel: "Liefertermin", betreff: "Neuer Liefertermin {termin}", text: "…{kunde}…",
//                 methode: { name: "kunde_informieren", args: { vorlage: "termin" }, felder: { nachricht: "zusatz" } } }]}
//     werte={{ kunde: "Familie Stadler", termin: "KW 48" }} versand={versand} offen={nichtInformiert} pfad="/projekte/PRJ-2026-021" />
//
// `versand` kommt vom Server: `await informierenVersand(session)` (Informieren/server.js).

import { useEffect, useId, useMemo, useState } from "react";
import cx from "../cx";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Avatar from "../Avatar";
import Ausstehend from "../Ausstehend";
import { Icon } from "../icons";
import { Menue, MenuePunkt, Sheet } from "../Overlay";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { informierenErfassenAction, informierenPlanenAction } from "./aktionen";
import { fuelleVorlage, kanaeleFuer, startKanal, zeitKurz } from "./logik";
import { INFORMIEREN_TEXTE as T } from "./texte";

/**
 * Chip am Objekt. Zustände: offen (Eiche, „Kunde nicht informiert · Informieren …“) · informiert (Salbei, Häkchen)
 * · fehler (Ziegel, „Nicht gesendet“). Während des Rückgängig-Fensters zeigt er die Ausstehend-Pille.
 */
export function InformierenChip({ zustand = "offen", text, objekt, onOeffnen, onNichtNoetig, testid = "informieren-chip" }) {
  if (zustand === "informiert") {
    return (
      <span className="inline-flex h-(--bo-pille-h) items-center gap-1.5 rounded-pill bg-bo-salbei-soft px-3 text-[13px] font-medium text-bo-salbei-text" data-testid={testid} data-zustand="informiert">
        <Icon name="Check" className="size-3.5" strokeWidth={2.25} />
        <span className="truncate">{text}</span>
      </span>
    );
  }
  const fehler = zustand === "fehler";
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" data-testid={testid} data-zustand={zustand}>
      <Ausstehend objekt={objekt} />
      <span className={cx("inline-flex min-w-0 items-stretch overflow-hidden rounded-pill text-[13px] font-medium", fehler ? "bg-bo-danger-soft text-bo-danger-text" : "bg-bo-warning-soft text-bo-warning-text")}>
        <button type="button" onClick={onOeffnen} className="bo-motion inline-flex h-(--bo-pille-h) min-w-0 items-center gap-1.5 pr-2.5 pl-3 transition-[background-color] hover:bg-bo-fill focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none active:scale-[0.98]" data-testid={`${testid}-oeffnen`}>
          <Icon name={fehler ? "TriangleAlert" : "Mail"} className="size-3.5 shrink-0" />
          <span className="truncate">{fehler ? T.ergebnis.nichtGesendet : T.chip}</span>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <span className="shrink-0 underline decoration-current/30 underline-offset-2">{fehler ? T.ergebnis.erneut : T.chipAktion}</span>
        </button>
        {onNichtNoetig && !fehler && (
          <Menue
            label={T.chipMenue}
            breite={220}
            ausloeser={(p) => (
              <button type="button" {...p} aria-label={T.chipMenue} className="bo-motion grid h-(--bo-pille-h) w-8 place-items-center transition-[background-color] hover:bg-bo-fill focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none">
                <Icon name="Ellipsis" className="size-3.5" />
              </button>
            )}
          >
            <MenuePunkt icon="Check" onWaehlen={onNichtNoetig} testid={`${testid}-nicht-noetig`}>
              {T.nichtNoetig}
            </MenuePunkt>
          </Menue>
        )}
      </span>
    </span>
  );
}

function Feld({ label, id, fehler, children, unter }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="px-1 text-[13px] leading-[18px] font-medium text-bo-text-soft">
        {label}
      </label>
      {children}
      {fehler ? (
        <p id={`${id}-fehler`} className="px-1 text-[12px] leading-4 text-bo-danger-text">
          {fehler}
        </p>
      ) : unter ? (
        <p className="px-1 text-[12px] leading-4 text-bo-text-faint">{unter}</p>
      ) : null}
    </div>
  );
}

const EINGABE = "bo-input rounded-bo-zeile bg-bo-surface px-4 text-[15px] leading-[22px] shadow-(--bo-sh-card) border-transparent";

/**
 * Sheet „Kunden informieren“. Einzeln nutzbar (z. B. aus dem Druckpanel „Per E-Mail“).
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {{doctype:string, name:string, titel?:string}} p.objekt
 * @param {{name:string, email?:string, telefon?:string, bevorzugt?:string}} p.empfaenger
 * @param {Array<{id:string, titel:string, betreff:string, text:string, methode?:{name:string, args?:object, felder?:{an?:string, betreff?:string, nachricht?:string}}}>} p.vorlagen
 * @param {Record<string,string>} [p.werte]     Platzhalter {kunde}, {termin} …
 * @param {{exchange:boolean}} [p.versand]      vom Server (informierenVersand)
 * @param {string} [p.pfad]                     Seite zum Neuladen nach dem Senden
 * @param {string} [p.briefHref]                Druckansicht für den Brief (z. B. Statusbericht)
 * @param {(e:{art:"gesendet"|"fehler"|"erfasst", kanal:string, zeit:string, an?:string, testmodus?:boolean}) => void} [p.onErgebnis]
 */
export function InformierenSheet({ offen, onSchliessen, objekt, empfaenger = {}, vorlagen = [], werte = {}, versand = { exchange: false }, pfad, briefHref, onErgebnis, testid = "informieren-sheet" }) {
  const id = useId();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const versandMoeglich = versand?.exchange || vorlagen.some((v) => v.methode?.name);
  const kanaele = useMemo(() => kanaeleFuer(empfaenger, { versand: versandMoeglich }), [empfaenger, versandMoeglich]);
  const [kanal, setKanal] = useState(() => startKanal(kanaele, empfaenger.bevorzugt));
  const [vorlageId, setVorlageId] = useState(vorlagen[0]?.id || "");
  const vorlage = vorlagen.find((v) => v.id === vorlageId) || vorlagen[0] || null;
  const gefuellt = useMemo(() => ({ betreff: fuelleVorlage(vorlage?.betreff || "", werte), text: fuelleVorlage(vorlage?.text || "", werte) }), [vorlage, werte]);
  const [entwurf, setEntwurf] = useState(null); // {betreff, nachricht} sobald bearbeitet
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState({});
  const [laeuft, setLaeuft] = useState(false);

  // Beim erneuten Öffnen frisch beginnen (Vorlage kann sich geändert haben).
  useEffect(() => {
    if (!offen) return;
    setEntwurf(null); // eslint-disable-line react-hooks/set-state-in-effect
    setNotiz("");
    setFehler({});
    setKanal(startKanal(kanaele, empfaenger.bevorzugt));
  }, [offen]); // eslint-disable-line react-hooks/exhaustive-deps

  const textFrei = !!versand?.exchange || !!vorlage?.methode?.felder?.nachricht;
  const betreff = entwurf?.betreff ?? gefuellt.betreff.text;
  const nachricht = entwurf?.nachricht ?? gefuellt.text.text;
  const fehlende = [...new Set([...gefuellt.betreff.fehlende, ...gefuellt.text.fehlende])];
  const mail = kanaele.find((k) => k.id === "email");
  const name = empfaenger.name || objekt?.titel || "";

  const senden = async () => {
    if (laeuft) return;
    setLaeuft(true);
    setFehler({});
    try {
      if (kanal === "email") {
        const r = await informierenPlanenAction({ objekt, kanal, an: empfaenger.email, betreff, nachricht, methode: versand?.exchange ? undefined : vorlage?.methode, pfad, empfaengerName: name });
        if (!r?.ok) {
          if (r?.fehler) setFehler(r.fehler);
          else zeige(r?.message || T.ergebnis.nichtGesendet, { art: "fehler" });
          return;
        }
        onSchliessen?.();
        starte(T.toastSenden(name), {
          token: r.token,
          ms: r.ms,
          objekt: r.objekt,
          fehlerText: T.fehlerText(name),
          onErfolg: (e) => onErgebnis?.({ art: "gesendet", kanal: "email", zeit: new Date().toISOString(), an: empfaenger.email, testmodus: !!e?.ergebnis?.testmodus }),
          onFehler: () => onErgebnis?.({ art: "fehler", kanal: "email", zeit: new Date().toISOString() }),
        });
        return;
      }
      const r = await informierenErfassenAction({ objekt, kanal, nachricht: notiz });
      if (!r?.ok) {
        if (r?.fehler) setFehler({ notiz: r.fehler.nachricht || Object.values(r.fehler)[0] });
        else zeige(r?.message || T.ergebnis.nichtGesendet, { art: "fehler" });
        return;
      }
      onSchliessen?.();
      zeige(T.erfasst(T.kanaele[kanal]), { art: "ok" });
      onErgebnis?.({ art: "erfasst", kanal, zeit: r.zeit });
    } finally {
      setLaeuft(false);
    }
  };

  useKuerzel("akte", { "akte.primaer": () => senden() }, { aktiv: offen });

  const fuss = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      {kanal === "email" && <p className="mr-auto min-w-0 text-[12px] leading-4 text-bo-text-faint">{versand?.exchange ? T.absender.exchange() : T.absender.frappe}</p>}
      <Knopf variant="primary" size="l" icon={kanal === "email" ? "Mail" : "Check"} kuerzel={T.sendenTaste} laedt={laeuft} disabled={kanal === "email" && !mail?.an} onClick={senden} data-testid={`${testid}-senden`}>
        {kanal === "email" ? T.senden : T.erfassen}
      </Knopf>
    </div>
  );

  const ungespeichert = kanal === "email" ? entwurf !== null : notiz.trim().length > 0;

  return (
    <Sheet offen={offen} onSchliessen={onSchliessen} titel={T.titel} unter={objekt?.titel} groesse="md" fuss={fuss} ungespeichert={ungespeichert && !laeuft} testid={testid}>
      <div className="grid gap-5">
        {/* Empfänger */}
        <div className="flex min-w-0 items-center gap-3 rounded-bo-karte bg-bo-surface p-4 shadow-(--bo-sh-card)">
          <Avatar name={name} groesse={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] leading-6 font-semibold tracking-[-0.012em]">{name}</p>
            <p className="truncate text-[13px] leading-[18px] text-bo-text-soft">{[empfaenger.email, empfaenger.telefon].filter(Boolean).join(" · ") || "–"}</p>
          </div>
        </div>

        <Segment
          label={T.kanal}
          breit
          wert={kanal}
          onWechsel={setKanal}
          optionen={kanaele.map((k) => ({ wert: k.id, titel: T.kanaele[k.id], icon: k.id === "email" ? "Mail" : k.id === "telefon" ? "Phone" : "FileText", deaktiviert: !k.an, testid: `${testid}-kanal-${k.id}` }))}
          testid={`${testid}-kanal`}
        />
        {!mail?.an && (
          <p className="-mt-3 flex items-start gap-2 px-1 text-[13px] leading-[18px] text-bo-text-soft" data-testid={`${testid}-ohne-email`}>
            <Icon name="Info" className="mt-0.5 size-4 shrink-0" />
            <span>{mail?.grund === "keine-email" ? `${T.keineEmail(name)} ${T.keineEmailAusweg}` : T.versandNichtVerfuegbar}</span>
          </p>
        )}

        {kanal === "email" && mail?.an && (
          <>
            {vorlagen.length > 1 && <Segment label={T.vorlage} groesse="s" variante="hell" wert={vorlage?.id} onWechsel={(w) => (setVorlageId(w), setEntwurf(null))} optionen={vorlagen.map((v) => ({ wert: v.id, titel: v.titel }))} testid={`${testid}-vorlage`} />}

            {entwurf === null ? (
              <article className="overflow-hidden rounded-bo-karte bg-bo-surface shadow-(--bo-sh-card)" aria-label={T.vorschau} data-testid={`${testid}-vorschau`}>
                <header className="grid gap-1 px-5 pt-4 pb-3">
                  <p className="text-[13px] leading-[18px] text-bo-text-soft">
                    {T.an} <span className="text-bo-text">{empfaenger.email}</span>
                  </p>
                  <p className="text-[17px] leading-6 font-semibold tracking-[-0.012em]">{betreff || "–"}</p>
                </header>
                <div className="mx-5 h-px bg-bo-line" aria-hidden="true" />
                <div className="px-5 pt-3 pb-5 text-[15px] leading-[22px] whitespace-pre-line">{nachricht || "–"}</div>
                <footer className="flex items-center justify-between gap-3 bg-bo-surface-2 px-5 py-3">
                  <span className="text-[12px] leading-4 text-bo-text-faint">{T.spracheHinweis}</span>
                  {textFrei && (
                    <Knopf size="s" variant="ghost" icon="Pencil" onClick={() => setEntwurf({ betreff, nachricht })} data-testid={`${testid}-bearbeiten`}>
                      {T.bearbeiten}
                    </Knopf>
                  )}
                </footer>
              </article>
            ) : (
              <div className="grid gap-4">
                <Feld label={T.betreff} id={`${id}-betreff`} fehler={fehler.betreff}>
                  <input id={`${id}-betreff`} className={cx(EINGABE, "h-12")} value={entwurf.betreff} onChange={(e) => setEntwurf((x) => ({ ...x, betreff: e.target.value }))} aria-invalid={!!fehler.betreff} aria-describedby={fehler.betreff ? `${id}-betreff-fehler` : undefined} maxLength={200} />
                </Feld>
                <Feld label={T.nachricht} id={`${id}-nachricht`} fehler={fehler.nachricht}>
                  <textarea id={`${id}-nachricht`} rows={9} className={cx(EINGABE, "resize-y py-3")} value={entwurf.nachricht} onChange={(e) => setEntwurf((x) => ({ ...x, nachricht: e.target.value }))} aria-invalid={!!fehler.nachricht} aria-describedby={fehler.nachricht ? `${id}-nachricht-fehler` : undefined} />
                </Feld>
              </div>
            )}
            {fehlende.length > 0 && (
              <p className="px-1 text-[12px] leading-4 text-bo-warning-text" data-testid={`${testid}-fehlende`}>
                {T.fehlendeWerte(fehlende.map((f) => `{${f}}`).join(", "))}
              </p>
            )}
            {fehler.an && <p className="px-1 text-[12px] leading-4 text-bo-danger-text">{fehler.an}</p>}
          </>
        )}

        {kanal !== "email" && (
          <div className="grid gap-4">
            {kanal === "telefon" ? (
              empfaenger.telefon ? (
                <Knopf variant="secondary" size="l" icon="Phone" href={`tel:${empfaenger.telefon.replace(/[^\d+]/g, "")}`} className="justify-self-start">
                  {T.anrufen(empfaenger.telefon)}
                </Knopf>
              ) : (
                <p className="px-1 text-[13px] text-bo-text-soft">{T.keineNummer}</p>
              )
            ) : briefHref ? (
              <Knopf variant="secondary" size="l" icon="Printer" href={briefHref} target="_blank" rel="noopener" className="justify-self-start">
                {T.briefDrucken}
              </Knopf>
            ) : null}
            <Feld label={kanal === "telefon" ? T.telefonFeld : T.briefFeld} id={`${id}-notiz`} fehler={fehler.notiz}>
              <textarea id={`${id}-notiz`} rows={5} className={cx(EINGABE, "resize-y py-3")} value={notiz} placeholder={kanal === "telefon" ? T.telefonPlatzhalter : T.briefPlatzhalter} onChange={(e) => setNotiz(e.target.value)} aria-invalid={!!fehler.notiz} aria-describedby={fehler.notiz ? `${id}-notiz-fehler` : undefined} data-testid={`${testid}-notiz`} />
            </Feld>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/**
 * Chip + Sheet als ein Baustein. `offen` = es gibt eine kundenrelevante Änderung ohne Information.
 * `informiert` = letzter Stand vom Server ({zeit, kanal}) – dann Salbei-Chip.
 */
export default function Informieren({ objekt, empfaenger, vorlagen, werte, versand, pfad, briefHref, offen: offenStart = true, informiert: informiertStart = null, testid = "informieren" }) {
  const [sheet, setSheet] = useState(false);
  const [ergebnis, setErgebnis] = useState(informiertStart ? { art: "gesendet", ...informiertStart } : offenStart ? null : { art: "keiner" });
  const { zeige } = useToast();

  const onErgebnis = (e) => {
    setErgebnis(e);
    if (e.art === "gesendet") zeige(T.ergebnis.gesendet, { art: "ok", unter: e.testmodus ? T.ergebnis.testmodus : T.ergebnis.gesendetUnter(e.an, zeitKurz(e.zeit)) });
    if (e.art === "fehler") zeige(T.ergebnis.nichtGesendet, { art: "fehler", unter: T.ergebnis.nichtGesendetAusweg });
  };

  const nichtNoetig = async () => {
    const r = await informierenErfassenAction({ objekt, kanal: "keiner" });
    if (r?.ok) setErgebnis({ art: "keiner", kanal: "keiner", zeit: r.zeit });
    else zeige(r?.message || T.ergebnis.nichtGesendet, { art: "fehler" });
  };

  let chip = null;
  if (!ergebnis) chip = <InformierenChip objekt={objekt} onOeffnen={() => setSheet(true)} onNichtNoetig={nichtNoetig} testid={`${testid}-chip`} />;
  else if (ergebnis.art === "fehler") chip = <InformierenChip zustand="fehler" objekt={objekt} onOeffnen={() => setSheet(true)} testid={`${testid}-chip`} />;
  else if (ergebnis.art === "gesendet" || ergebnis.art === "erfasst") chip = <InformierenChip zustand="informiert" text={T.informiert(T.kanaele[ergebnis.kanal] || "", zeitKurz(ergebnis.zeit))} testid={`${testid}-chip`} />;

  return (
    <>
      {chip}
      <InformierenSheet offen={sheet} onSchliessen={() => setSheet(false)} objekt={objekt} empfaenger={empfaenger} vorlagen={vorlagen} werte={werte} versand={versand} pfad={pfad} briefHref={briefHref} onErgebnis={onErgebnis} testid={`${testid}-sheet`} />
    </>
  );
}
