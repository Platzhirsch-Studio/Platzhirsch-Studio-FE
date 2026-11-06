"use client";
// Aktionen der Akte Servicefall (10-konzept-service §3.4–§3.7, §4.1–§4.5): genau ein Primärknopf (Server-Schritt),
// „⋯“ mit allen erlaubten Aktionen, und die Assistenten/Dialoge. Gesteuert über ?aktion=… (auch von Zeilen-
// knöpfen in Liste und „Jetzt dran“), Schließen entfernt den Parameter.
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import BetragFeld from "../Eingabe/BetragFeld";
import Bestaetigen from "../Bestaetigen";
import { Dialog, Sheet, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { TelefonatDialog } from "./JetztDran";
import { FehlerCombobox } from "./Melden";
import { useAktion } from "./useAktion";
import {
  ablehnenAction, bestellenAction, eingangAction, erledigtAction, ersatzteilHinzufuegenAction, forderungAction, informierenAction,
  kulanzAction, maengelanzeigeAction, pruefenEntscheidenAction, schliessenAction, wiederOeffnenAction, zuordnungAction,
} from "@/lib/backoffice/service/actions";
import { ABLEHNUNGSGRUENDE, ENTSCHEIDUNGEN, KOSTENTRAEGER, URSACHEN, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { euro } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

/** Öffnet eine Aktion der Akte über ?aktion= (für Knöpfe in den Reitern). */
export function AktionKnopf({ aktion, children, variant = "secondary", size = "s", icon }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const href = useMemo(() => {
    const p = new URLSearchParams(sp?.toString() || "");
    p.set("aktion", aktion);
    return `${pfad}?${p.toString()}`;
  }, [aktion, pfad, sp]);
  return (
    <Knopf variant={variant} size={size} icon={icon} onClick={() => router.replace(href, { scroll: false })}>
      {children}
    </Knopf>
  );
}

function Feld({ label, fehler, children, className }) {
  return (
    <label className={`bo-svc-feld ${className || ""}`} data-fehler={fehler ? "" : undefined}>
      <span>{label}</span>
      {children}
      {fehler && <span className="bo-svc-fehler">{fehler}</span>}
    </label>
  );
}

function Wahl({ label, werte, wert, onWahl, anzeige = (x) => x, gesperrt = () => false }) {
  return (
    <div className="grid gap-2">
      <span className="bo-svc-label">{label}</span>
      <div className="bo-svc-chips" role="radiogroup" aria-label={label}>
        {werte.map((w) => (
          <button key={w} type="button" role="radio" aria-checked={wert === w} className="bo-svc-wahl" disabled={gesperrt(w)} onClick={() => onWahl(w)}>
            {anzeige(w)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * @param {{fall:object, knopf:object, regresse:object[], einsaetze:object[], katalog:object, code:object|null, sicht:object,
 *   schwelleCent:number, schliessbar:{ok:boolean, grund:string|null}, mitgeteilt:boolean, teile:object[], letzterEinsatz:object|null, lieferantEmail:string}} p
 */
export default function FallAktionen({ fall, knopf, regresse = [], katalog, code, sicht, schwelleCent, schliessbar, mitgeteilt, teile = [], letzterEinsatz, lieferantEmail = "" }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const offen = sp?.get("aktion") || null;
  const { ausfuehren, laeuft } = useAktion();
  const name = fall.name;
  const kunde = fall.kunde_name || name;

  const oeffne = useCallback(
    (a) => {
      const p = new URLSearchParams(sp?.toString() || "");
      if (a) p.set("aktion", a);
      else p.delete("aktion");
      const qs = p.toString();
      router.replace(qs ? `${pfad}?${qs}` : pfad, { scroll: false });
    },
    [pfad, router, sp]
  );
  const zu = () => oeffne(null);
  const geschlossen = ["Geschlossen", "Abgelehnt"].includes(fall.status);

  const eingang = () => ausfuehren(eingangAction, { names: [name] }, { ok: T.dialog.eingang.gesendet(fall.kunde_email) });
  const schliessen = () => ausfuehren(schliessenAction, { names: [name] }, { ok: `${name} wird geschlossen` });

  const primaer = () => {
    switch (knopf.id) {
      case "eingang-senden":
        return eingang();
      case "einsatz-planen":
        return router.push(`/service/einsaetze/neu?fall=${encodeURIComponent(name)}`);
      case "schliessen":
        return schliessen();
      default:
        return oeffne({ telefonat: "telefonat", pruefen: "pruefen", entscheiden: "pruefen", "kulanz-freigeben": "kulanz", "ersatzteile-bestellen": "bestellen", "erledigt-melden": "erledigt", "forderung-stellen": "forderung", "abschluss-mitteilen": "informieren" }[knopf.id] || null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" data-testid="akte-aktionen">
        {knopf.neben && !geschlossen && sicht.schreiben && (
          <Knopf variant="secondary" icon="Phone" onClick={() => oeffne("telefonat")}>
            {knopf.neben.titel}
          </Knopf>
        )}
        {knopf.art === "primaer" && sicht.schreiben && (
          <Knopf variant="primary" onClick={primaer} laedt={laeuft} disabled={knopf.id === "schliessen" && !schliessbar.ok} grund={knopf.id === "schliessen" && !schliessbar.ok ? schliessbar.grund : undefined} data-testid="akte-primaer">
            {knopf.titel}
          </Knopf>
        )}
        {knopf.art === "blocker" && <span className="rounded-pill bg-bo-fill-2 px-3 py-1.5 text-[13px] font-medium text-bo-text-soft">{knopf.titel}</span>}
        {sicht.schreiben && (
          <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
            {fall.status === "Gemeldet" && !fall.erstreaktion_am && <MenuePunkt icon="Phone" onWaehlen={() => oeffne("telefonat")}>{T.aktionen.telefonat}</MenuePunkt>}
            {["Gemeldet", "Geprueft", "Entscheidung"].includes(fall.status) && <MenuePunkt icon="CheckSquare" onWaehlen={() => oeffne("pruefen")}>{T.aktionen.pruefen}</MenuePunkt>}
            {!geschlossen && <MenuePunkt icon="Mail" onWaehlen={() => oeffne("informieren")}>{T.aktionen.informieren}</MenuePunkt>}
            {!geschlossen && fall.status !== "Gemeldet" && <MenuePunkt icon="CalendarPlus" href={`/service/einsaetze/neu?fall=${encodeURIComponent(name)}`}>{T.aktionen.einsatz}</MenuePunkt>}
            {!geschlossen && <MenuePunkt icon="Package" onWaehlen={() => oeffne("teil")}>{T.aktionen.teil}</MenuePunkt>}
            {teile.some((t) => t.status === "Benoetigt" && !t.bestellung) && <MenuePunkt icon="Truck" onWaehlen={() => oeffne("bestellen")}>{T.aktionen.bestellen}</MenuePunkt>}
            {fall.lieferant && !geschlossen && fall.status !== "Gemeldet" && <MenuePunkt icon="Truck" onWaehlen={() => oeffne("maengelanzeige")}>{T.aktionen.maengelanzeige}</MenuePunkt>}
            {fall.status === "Erledigt" && fall.lieferant && <MenuePunkt icon="Banknote" onWaehlen={() => oeffne("forderung")}>{T.aktionen.forderung}</MenuePunkt>}
            {["In Bearbeitung", "Einsatz geplant"].includes(fall.status) && <MenuePunkt icon="CircleCheck" onWaehlen={() => oeffne("erledigt")}>{T.aktionen.erledigt}</MenuePunkt>}
            {fall.status === "Erledigt" && (
              <MenuePunkt icon="Lock" onWaehlen={schliessen} deaktiviert={!schliessbar.ok} grund={schliessbar.grund || undefined}>
                {T.aktionen.schliessen}
              </MenuePunkt>
            )}
            {fall.quelle === "website" && !Number(fall.portal_sichtbar) && <MenuePunkt icon="UserCog" onWaehlen={() => ausfuehren(zuordnungAction, { name }, { ok: T.dialog.zuordnung.ok })}>{T.aktionen.zuordnen}</MenuePunkt>}
            <MenueTrenner />
            <MenuePunkt icon="Printer" href={`/druck/ph-servicefall/${encodeURIComponent(name)}?format=${encodeURIComponent("PH Servicefall Reklamationsmeldung")}`}>{T.aktionen.drucken}</MenuePunkt>
            {fall.kontakt && <MenuePunkt icon="Contact" href={`/d/ph-kontakt/${encodeURIComponent(fall.kontakt)}`}>{T.akte.kundenakte}</MenuePunkt>}
            {sicht.leitung && ["Geprueft", "Entscheidung"].includes(fall.status) && (
              <>
                <MenueTrenner />
                <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => oeffne("ablehnen")}>{T.aktionen.ablehnen}</MenuePunkt>
              </>
            )}
            {sicht.leitung && ["Erledigt", "Geschlossen", "Abgelehnt"].includes(fall.status) && <MenuePunkt icon="RotateCcw" onWaehlen={() => oeffne("oeffnen")}>{T.aktionen.oeffnen}</MenuePunkt>}
          </Menue>
        )}
      </div>

      {offen === "telefonat" && <TelefonatDialog offen onSchliessen={zu} name={name} kunde={kunde} />}
      {offen === "pruefen" && <PruefenSheet fall={fall} katalog={katalog} code={code} sicht={sicht} schwelleCent={schwelleCent} onSchliessen={zu} />}
      {offen === "informieren" && <InformierenDialog fall={fall} onSchliessen={zu} vorlage={fall.status === "Erledigt" ? "abschluss" : fall.status === "Gemeldet" ? "eingang" : "frei"} />}
      {offen === "ablehnen" && <AblehnenDialog fall={fall} onSchliessen={zu} />}
      {offen === "oeffnen" && <OeffnenDialog fall={fall} onSchliessen={zu} />}
      {offen === "kulanz" && <KulanzDialog fall={fall} sicht={sicht} onSchliessen={zu} />}
      {offen === "teil" && <TeilDialog fall={fall} onSchliessen={zu} onBestellen={() => oeffne("bestellen")} />}
      {offen === "bestellen" && <BestellenSheet fall={fall} teile={teile} onSchliessen={zu} />}
      {offen === "maengelanzeige" && <MaengelanzeigeSheet fall={fall} onSchliessen={zu} lieferantEmail={lieferantEmail} />}
      {offen === "forderung" && <ForderungSheet fall={fall} regresse={regresse} onSchliessen={zu} lieferantEmail={lieferantEmail} />}
      {offen === "erledigt" && <ErledigtSheet fall={fall} code={code} letzterEinsatz={letzterEinsatz} schliessbarNachher={!regresse.length && !Number(fall.lieferantenrelevant)} mitgeteilt={mitgeteilt} teile={teile} onSchliessen={zu} />}
    </>
  );
}

// ---------------------------------------------------------------- S2 --

function PruefenSheet({ fall, katalog, code, sicht, schwelleCent, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const teil1 = fall.status === "Gemeldet";
  const [p, setP] = useState({ mangel_bestaetigt: fall.mangel_bestaetigt && fall.mangel_bestaetigt !== "Offen" ? fall.mangel_bestaetigt : "", ursache: fall.ursache || "", pruefergebnis: fall.pruefergebnis || "", fehlercode: fall.fehlercode || "" });
  const [e, setE] = useState({ entscheidung: fall.entscheidung || code?.standard_entscheidung || "", begruendung: fall.entscheidung_begruendung || "", betrag_cent: fall.kulanz_cent || fall.preisminderung_cent || null, vggBestaetigt: false });
  const [fehler, setFehler] = useState({});
  const betragNoetig = ["Preisminderung", "Kulanz"].includes(e.entscheidung);
  const ueber = betragNoetig && (Number(e.betrag_cent) || 0) > schwelleCent;
  const vgg = ["Preisminderung", "Wandlung"].includes(e.entscheidung) && fall.kundentyp !== "Unternehmer" && p.mangel_bestaetigt !== "Nein";
  const senden = (modus) =>
    ausfuehren(pruefenEntscheidenAction, { name: fall.name, pruefung: p, entscheidung: e, modus }, {
      ok: (r) => (r.freigabe ? "Entschieden · Freigabe bei der Leitung angefragt" : T.dialog.pruefen.erfolg(anzeigeText(r.status) === "Entschieden" ? "entschieden" : anzeigeText(r.status).toLowerCase())),
      onOk: onSchliessen,
      onFehler: (r) => r.fehler && setFehler(r.fehler),
    });
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.pruefen.titel}
      unter={`${fall.name} · ${fall.kunde_name}`}
      groesse="lg"
      testid="sheet-pruefen"
      fuss={
        <div className="flex w-full flex-wrap justify-end gap-2">
          {teil1 && (
            <Knopf variant="secondary" onClick={() => senden("pruefen")} disabled={laeuft}>
              {T.dialog.pruefen.nurPruefen}
            </Knopf>
          )}
          <Knopf variant="secondary" onClick={() => senden("entscheiden")} disabled={laeuft}>
            {T.dialog.pruefen.nurEntscheiden}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={() => senden("bearbeiten")} data-testid="pruefen-ok">
            {ueber && !sicht.leitung ? T.dialog.pruefen.entscheidenFreigabe : T.dialog.pruefen.entscheidenBearbeiten}
          </Knopf>
        </div>
      }
    >
      <div className="grid gap-6">
        {teil1 && (
          <section className="grid gap-4">
            <h3 className="bo-titel-kachel">{T.dialog.pruefen.teil1}</h3>
            <FehlerCombobox katalog={katalog} wert={p.fehlercode} onWahl={(c) => setP({ ...p, fehlercode: c.code })} fehler={fehler.fehlercode} label={T.dialog.pruefen.fehlercode} />
            {code?.pruefhinweis && (
              <p className="bo-svc-karte text-[14px]">
                <b className="block text-[13px] font-medium text-bo-text-soft">{T.melden.pruefhinweis}</b>
                {code.pruefhinweis}
              </p>
            )}
            <Wahl label={T.dialog.pruefen.mangel} werte={["Ja", "Teilweise", "Nein"]} wert={p.mangel_bestaetigt} onWahl={(v) => setP({ ...p, mangel_bestaetigt: v })} />
            {fehler.mangel_bestaetigt && <p className="bo-svc-fehler">{fehler.mangel_bestaetigt}</p>}
            <Feld label={T.dialog.pruefen.ursache}>
              <select value={p.ursache} onChange={(x) => setP({ ...p, ursache: x.target.value })}>
                <option value="">–</option>
                {URSACHEN.map((u) => (
                  <option key={u} value={u}>
                    {anzeigeText(u)}
                  </option>
                ))}
              </select>
            </Feld>
            <Feld label={T.dialog.pruefen.ergebnis}>
              <textarea rows={2} value={p.pruefergebnis} onChange={(x) => setP({ ...p, pruefergebnis: x.target.value })} />
            </Feld>
          </section>
        )}
        <section className="grid gap-4">
          <h3 className="bo-titel-kachel">{T.dialog.pruefen.teil2}</h3>
          <Wahl label={T.dialog.pruefen.entscheidung} werte={ENTSCHEIDUNGEN} wert={e.entscheidung} onWahl={(v) => setE({ ...e, entscheidung: v })} gesperrt={(v) => v === "Abgelehnt" && !sicht.leitung} />
          {!sicht.leitung && <p className="bo-svc-hinweis">{T.dialog.pruefen.abgelehntNurLeitung}</p>}
          {fehler.entscheidung && <p className="bo-svc-fehler">{fehler.entscheidung}</p>}
          {vgg && (
            <div className="bo-svc-karte grid gap-3">
              <p className="text-[14px]" id="vgg-hinweis">
                {T.dialog.pruefen.vgg}
              </p>
              <label className="flex items-start gap-3 text-[14px]">
                <input type="checkbox" className="mt-1 size-[18px] accent-(--color-bo-action)" checked={e.vggBestaetigt} aria-describedby="vgg-hinweis" onChange={(x) => setE({ ...e, vggBestaetigt: x.target.checked })} />
                {T.dialog.pruefen.vggPflicht}
              </label>
              {fehler.vgg && <p className="bo-svc-fehler">{fehler.vgg}</p>}
            </div>
          )}
          {betragNoetig && (
            <div className="bo-svc-feld" data-fehler={fehler.betrag ? "" : undefined}>
              <span>{T.dialog.pruefen.betrag}</span>
              <BetragFeld value={e.betrag_cent} onChange={(c) => setE({ ...e, betrag_cent: c })} aria-label={T.dialog.pruefen.betrag} />
              <span className="bo-svc-hinweis" data-ton={ueber ? "warn" : undefined}>
                {T.dialog.pruefen.schwelle(euro(schwelleCent))}
              </span>
              {fehler.betrag && <span className="bo-svc-fehler">{fehler.betrag}</span>}
            </div>
          )}
          <Feld label={T.dialog.pruefen.begruendung} fehler={fehler.begruendung}>
            <textarea rows={3} value={e.begruendung} onChange={(x) => setE({ ...e, begruendung: x.target.value })} />
          </Feld>
          {code?.kundentext && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="bo-svc-label">{T.dialog.pruefen.textbausteine}</span>
              <button type="button" className="bo-svc-wahl" onClick={() => setE({ ...e, begruendung: `${e.begruendung ? `${e.begruendung}\n` : ""}${code.kundentext}` })}>
                {code.code}: Kundentext
              </button>
              {code.standardloesung && (
                <button type="button" className="bo-svc-wahl" onClick={() => setE({ ...e, begruendung: `${e.begruendung ? `${e.begruendung}\n` : ""}${code.standardloesung}` })}>
                  Standardlösung
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------- Kunde informieren --

function InformierenDialog({ fall, onSchliessen, vorlage: start }) {
  const { ausfuehren, laeuft } = useAktion();
  const [vorlage, setVorlage] = useState(start);
  const [kanal, setKanal] = useState(fall.kunde_email ? "email" : "brief");
  const [zusatz, setZusatz] = useState("");
  const [notiz, setNotiz] = useState("");
  const [gedruckt, setGedruckt] = useState(false);
  const [fehler, setFehler] = useState({});
  const V = T.dialog.informieren;
  const senden = () => ausfuehren(informierenAction, { name: fall.name, vorlage, kanal, zusatz, notiz }, { ok: V.ok, onOk: onSchliessen, onFehler: (r) => r.fehler && setFehler(r.fehler) });
  const sperre = kanal === "brief" && !gedruckt;
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={`${V.titel} · ${V.vorlagen[vorlage]}`}
      groesse="md"
      testid="dialog-informieren"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {T.aktionen.abbrechen}
          </Knopf>
          {kanal === "brief" && (
            <Knopf variant="secondary" icon="Printer" href={`/druck/ph-servicefall/${encodeURIComponent(fall.name)}?format=${encodeURIComponent("PH Servicefall Abnahmebestätigung")}`} target="_blank" onClick={() => setGedruckt(true)}>
              {V.pdf}
            </Knopf>
          )}
          <Knopf variant="primary" laedt={laeuft} disabled={sperre} onClick={senden} data-testid="informieren-ok">
            {sperre ? V.erstDrucken : kanal === "email" ? V.senden : V.erfassen}
          </Knopf>
        </>
      }
    >
      <div className="grid gap-4">
        <Feld label={V.vorlage}>
          <select value={vorlage} onChange={(x) => setVorlage(x.target.value)}>
            {Object.entries(V.vorlagen).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </Feld>
        <div className="grid gap-2">
          <span className="bo-svc-label">{V.kanal}</span>
          <div className="bo-svc-chips" role="radiogroup" aria-label={V.kanal}>
            {Object.entries(V.kanaele).map(([k, t]) => (
              <button key={k} type="button" role="radio" aria-checked={kanal === k} className="bo-svc-wahl" disabled={k === "email" && !fall.kunde_email} onClick={() => setKanal(k)}>
                {k === "email" && fall.kunde_email ? `${t} ${fall.kunde_email}` : t}
              </button>
            ))}
          </div>
          {!fall.kunde_email && <p className="bo-svc-hinweis">E-Mail: {V.ohneEmail}</p>}
        </div>
        {kanal === "email" ? (
          <Feld label={V.zusatz} fehler={fehler.zusatz}>
            <textarea rows={3} value={zusatz} onChange={(x) => setZusatz(x.target.value)} />
          </Feld>
        ) : (
          <Feld label={kanal === "brief" ? `${V.notiz} (optional)` : V.notiz} fehler={fehler.notiz}>
            <input value={notiz} onChange={(x) => setNotiz(x.target.value)} />
          </Feld>
        )}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------- Leitung-Dialoge --

function AblehnenDialog({ fall, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const [grund, setGrund] = useState("");
  const [begruendung, setBegruendung] = useState(fall.entscheidung_begruendung || "");
  const [informieren, setInformieren] = useState(!!fall.kunde_email);
  const abgelaufen = fall.fristen_status === "Abgelaufen";
  const V = T.dialog.ablehnen;
  return (
    <Bestaetigen
      offen
      titel={V.titel}
      text={V.folge}
      bestaetigen={V.ok}
      gefaehrlich
      laeuft={laeuft}
      groesse="md"
      onAbbrechen={onSchliessen}
      onBestaetigen={() => ausfuehren(ablehnenAction, { name: fall.name, grund, begruendung, informieren }, { ok: "Fall abgelehnt", onOk: onSchliessen })}
    >
      <div className="grid gap-4 text-left">
        <Feld label={V.grund}>
          <select value={grund} onChange={(x) => setGrund(x.target.value)}>
            <option value="">–</option>
            {ABLEHNUNGSGRUENDE.map((g) => (
              <option key={g} value={g} disabled={g === "Frist abgelaufen" && !abgelaufen}>
                {g}
              </option>
            ))}
          </select>
        </Feld>
        {!abgelaufen && <p className="bo-svc-hinweis">{V.fristNur}</p>}
        <Feld label={V.begruendung}>
          <textarea rows={3} value={begruendung} onChange={(x) => setBegruendung(x.target.value)} />
        </Feld>
        {fall.kunde_email ? <Schalter label={V.informieren} an={informieren} onWechsel={setInformieren} /> : <p className="bo-svc-hinweis">{V.ohneEmail}</p>}
      </div>
    </Bestaetigen>
  );
}

function OeffnenDialog({ fall, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const [grund, setGrund] = useState("");
  return (
    <Bestaetigen offen titel={T.dialog.oeffnen.titel} bestaetigen={T.dialog.oeffnen.ok} laeuft={laeuft} onAbbrechen={onSchliessen} onBestaetigen={() => ausfuehren(wiederOeffnenAction, { name: fall.name, grund }, { ok: "Fall wieder geöffnet", onOk: onSchliessen })}>
      <Feld label={T.dialog.oeffnen.grund}>
        <input value={grund} onChange={(x) => setGrund(x.target.value)} />
      </Feld>
    </Bestaetigen>
  );
}

function KulanzDialog({ fall, sicht, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const [art, setArt] = useState(sicht.leitung ? "freigeben" : "erneut");
  const [text, setText] = useState("");
  const eigen = fall.entschieden_von && fall.entschieden_von === sicht.user;
  if (!sicht.leitung) {
    return (
      <Bestaetigen offen titel="Kulanz-Freigabe erneut anfragen?" text={`Die Leitung wird erneut benachrichtigt (${euro(fall.kulanz_cent)}).`} bestaetigen={T.aktionen.kulanzErneut} laeuft={laeuft} onAbbrechen={onSchliessen} onBestaetigen={() => ausfuehren(kulanzAction, { name: fall.name, art: "erneut" }, { ok: "Leitung erneut angefragt", onOk: onSchliessen })} />
    );
  }
  return (
    <Bestaetigen
      offen
      titel={art === "freigeben" ? T.dialog.kulanz.freigebenTitel : T.dialog.kulanz.ablehnenTitel}
      text={art === "freigeben" ? T.dialog.kulanz.folgeFrei : undefined}
      fakten={[{ label: "Betrag brutto an den Kunden", wert: euro(fall.kulanz_cent) }, { label: "Fall", wert: `${fall.name} · ${fall.kunde_name}` }]}
      bestaetigen={art === "freigeben" ? T.dialog.kulanz.ok : T.dialog.kulanz.nein}
      gefaehrlich={art === "ablehnen"}
      laeuft={laeuft}
      groesse="md"
      onAbbrechen={onSchliessen}
      onBestaetigen={() => ausfuehren(kulanzAction, { name: fall.name, art, kommentar: text, grund: text, betrag_cent: fall.kulanz_cent }, { ok: art === "freigeben" ? "Kulanz freigegeben" : "Kulanz abgelehnt", onOk: onSchliessen })}
    >
      <div className="grid gap-3 text-left">
        <div className="bo-svc-chips" role="radiogroup" aria-label="Entscheidung">
          <button type="button" role="radio" aria-checked={art === "freigeben"} className="bo-svc-wahl" onClick={() => setArt("freigeben")}>
            Freigeben
          </button>
          <button type="button" role="radio" aria-checked={art === "ablehnen"} className="bo-svc-wahl" onClick={() => setArt("ablehnen")}>
            Ablehnen
          </button>
        </div>
        {eigen && <p className="bo-svc-hinweis" data-ton="warn">Eigener Antrag – zweite Person nötig.</p>}
        <Feld label={art === "freigeben" ? T.dialog.kulanz.kommentar : T.dialog.kulanz.grund}>
          <input value={text} onChange={(x) => setText(x.target.value)} />
        </Feld>
      </div>
    </Bestaetigen>
  );
}

// ----------------------------------------------------- Ersatzteile --

function TeilDialog({ fall, onSchliessen, onBestellen }) {
  const { ausfuehren, laeuft } = useAktion();
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [teil, setTeil] = useState(null);
  const [frei, setFrei] = useState({ bezeichnung: "", hersteller_nr: "" });
  const [menge, setMenge] = useState(1);
  const [quelle, setQuelle] = useState("bestellen");
  const [kostentraeger, setKostentraeger] = useState("Gewaehrleistung");
  const [fehler, setFehler] = useState({});
  useEffect(() => {
    if (q.trim().length < 2) return undefined;
    const ab = new AbortController();
    const t = setTimeout(() => fetch(`/api/link?doctype=${encodeURIComponent("PH Ersatzteil")}&q=${encodeURIComponent(q)}`, { signal: ab.signal }).then((r) => r.json()).then((d) => setTreffer(d.treffer || [])).catch(() => {}), 160);
    return () => (clearTimeout(t), ab.abort());
  }, [q]);
  const senden = (dannBestellen) =>
    ausfuehren(ersatzteilHinzufuegenAction, { name: fall.name, ersatzteil: teil?.value || null, ...frei, menge, quelle, kostentraeger }, { ok: "Ersatzteil hinzugefügt", onOk: () => (dannBestellen ? onBestellen() : onSchliessen()), onFehler: (r) => r.fehler && setFehler(r.fehler) });
  const V = T.dialog.teil;
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={V.titel}
      groesse="md"
      testid="dialog-teil"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {T.aktionen.abbrechen}
          </Knopf>
          {quelle === "bestellen" && (
            <Knopf variant="secondary" onClick={() => senden(true)} disabled={laeuft}>
              Hinzufügen und bestellen
            </Knopf>
          )}
          <Knopf variant="primary" laedt={laeuft} onClick={() => senden(false)} data-testid="teil-ok">
            {V.ok}
          </Knopf>
        </>
      }
    >
      <div className="grid gap-4">
        {teil ? (
          <div className="bo-svc-karte flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{teil.value}</span>
              <span className="block truncate text-[13px] text-bo-text-soft">{teil.description}</span>
            </span>
            <Knopf size="s" variant="ghost" onClick={() => setTeil(null)}>
              Ändern
            </Knopf>
          </div>
        ) : (
          <Feld label={V.teil} fehler={fehler.ersatzteil}>
            <input value={q} placeholder={V.suche} onChange={(x) => setQ(x.target.value)} />
            {treffer.length > 0 && q.length >= 2 && (
              <div className="bo-svc-treffer">
                {treffer.map((t) => (
                  <button key={t.value} type="button" className="bo-svc-treffer__opt text-left" onClick={() => (setTeil(t), setTreffer([]), setQ(""))}>
                    <span className="bo-svc-treffer__code">{t.value}</span>
                    <span className="truncate text-bo-text-soft">{t.description}</span>
                  </button>
                ))}
              </div>
            )}
          </Feld>
        )}
        {!teil && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Feld label={`${V.frei}: ${V.bezeichnung}`}>
              <input value={frei.bezeichnung} onChange={(x) => setFrei({ ...frei, bezeichnung: x.target.value })} />
            </Feld>
            <Feld label={V.nr}>
              <input value={frei.hersteller_nr} onChange={(x) => setFrei({ ...frei, hersteller_nr: x.target.value })} />
            </Feld>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Feld label={V.menge} fehler={fehler.menge}>
            <input type="number" min={1} max={999} value={menge} onChange={(x) => setMenge(Number(x.target.value))} />
          </Feld>
          <Feld label={V.kostentraeger}>
            <select value={kostentraeger} onChange={(x) => setKostentraeger(x.target.value)}>
              {KOSTENTRAEGER.map((k) => (
                <option key={k} value={k}>
                  {anzeigeText(k)}
                </option>
              ))}
            </select>
          </Feld>
        </div>
        <Wahl label={V.quelle} werte={["bestand", "bestellen"]} wert={quelle} onWahl={setQuelle} anzeige={(w) => (w === "bestand" ? V.ausBestand : V.bestellen)} gesperrt={(w) => w === "bestand" && !teil} />
        {fehler.quelle && <p className="bo-svc-fehler">{fehler.quelle}</p>}
      </div>
    </Dialog>
  );
}

function BestellenSheet({ fall, teile, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const offen = teile.map((t, i) => ({ ...t, schluessel: String(t.name || t.idx || i + 1) })).filter((t) => t.status === "Benoetigt" && !t.bestellung);
  const [wahl, setWahl] = useState(() => new Set(offen.map((t) => t.schluessel)));
  const [w, setW] = useState({ lieferant: fall.lieferant || "", lieferadresse: "Lager", wunschtermin: "", empfaenger: "" });
  const V = T.dialog.bestellen;
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={V.titel}
      unter={fall.name}
      groesse="md"
      testid="sheet-bestellen"
      fuss={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="bo-svc-hinweis">{V.folge(wahl.size)}</span>
          <Knopf variant="primary" laedt={laeuft} disabled={!wahl.size} onClick={() => ausfuehren(bestellenAction, { name: fall.name, zeilen: [...wahl], ...w }, { ok: (r) => `Bestellung ${r.bestellung} angelegt`, onOk: onSchliessen })} data-testid="bestellen-ok">
            {V.ok}
          </Knopf>
        </div>
      }
    >
      <div className="grid gap-4">
        <fieldset className="grid gap-2">
          <legend className="bo-svc-label mb-2">{V.zeilen}</legend>
          {offen.length === 0 && <p className="bo-svc-hinweis">Keine Zeile mit Status „Benötigt“ ohne Bestellung.</p>}
          {offen.map((t) => (
            <label key={t.schluessel} className="bo-svc-karte flex items-center gap-3">
              <input type="checkbox" className="size-[18px] accent-(--color-bo-action)" checked={wahl.has(t.schluessel)} onChange={() => setWahl((s) => (s.has(t.schluessel) ? new Set([...s].filter((x) => x !== t.schluessel)) : new Set([...s, t.schluessel])))} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t.bezeichnung}</span>
                <span className="block text-[13px] text-bo-text-soft">
                  {t.menge} × · {t.hersteller_nr || "ohne Nr."} · {anzeigeText(t.kostentraeger)}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <Feld label={V.lieferant}>
          <input value={w.lieferant} onChange={(x) => setW({ ...w, lieferant: x.target.value })} />
        </Feld>
        <Wahl label={V.adresse} werte={["Lager", "Showroom", "Kunde direkt"]} wert={w.lieferadresse} onWahl={(v) => setW({ ...w, lieferadresse: v })} />
        <Feld label={`${V.empfaenger} – leer lassen, um nur den Entwurf anzulegen`}>
          <input type="email" value={w.empfaenger} onChange={(x) => setW({ ...w, empfaenger: x.target.value })} />
        </Feld>
      </div>
    </Sheet>
  );
}

// -------------------------------------------------------- Lieferant --

function MaengelanzeigeSheet({ fall, onSchliessen, lieferantEmail }) {
  const { ausfuehren, laeuft } = useAktion();
  const [empfaenger, setEmpfaenger] = useState(lieferantEmail);
  const [zusatz, setZusatz] = useState("");
  const [fotos, setFotos] = useState(() => new Set());
  const [fehler, setFehler] = useState({});
  const V = T.dialog.maengelanzeige;
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={V.titel}
      unter={`${fall.lieferant || ""} · ${fall.name}`}
      groesse="md"
      testid="sheet-maengelanzeige"
      fuss={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="bo-svc-hinweis">{V.folge(fall.lieferant || "den Lieferanten")}</span>
          <Knopf variant="primary" laedt={laeuft} onClick={() => ausfuehren(maengelanzeigeAction, { name: fall.name, empfaenger, zusatz, fotos: [...fotos] }, { ok: "Mängelanzeige gesendet · Regress angelegt", onOk: onSchliessen, onFehler: (r) => r.fehler && setFehler(r.fehler) })} data-testid="maengelanzeige-ok">
            {V.ok}
          </Knopf>
        </div>
      }
    >
      <div className="grid gap-4">
        <Feld label={V.empfaenger} fehler={fehler.empfaenger}>
          <input type="email" value={empfaenger} onChange={(x) => setEmpfaenger(x.target.value)} />
        </Feld>
        {(fall.fotos || []).length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="bo-svc-label mb-1">{V.fotos}</legend>
            <p className="bo-svc-hinweis" data-ton="warn">
              {V.fotoHinweis}
            </p>
            <div className="bo-svc-galerie">
              {fall.fotos.map((f, i) => (
                <label key={i} className="bo-svc-foto cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Fotos des Falls */}
                  <img src={f.bild} alt={f.hinweis || `Foto ${i + 1}`} />
                  <span className="bo-svc-foto__fuss">
                    <span className="rounded-pill bg-bo-glass px-2 py-0.5 text-[12px] font-medium backdrop-blur">{f.quelle}</span>
                    <input type="checkbox" className="size-5 accent-(--color-bo-action)" aria-label={`Foto ${i + 1} an den Lieferanten`} checked={fotos.has(i + 1)} onChange={() => setFotos((s) => (s.has(i + 1) ? new Set([...s].filter((x) => x !== i + 1)) : new Set([...s, i + 1])))} />
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Feld label={V.zusatz}>
          <textarea rows={3} value={zusatz} onChange={(x) => setZusatz(x.target.value)} />
        </Feld>
      </div>
    </Sheet>
  );
}

function ForderungSheet({ fall, regresse, onSchliessen, lieferantEmail }) {
  const { ausfuehren, laeuft } = useAktion();
  const [betrag, setBetrag] = useState(Number(fall.kosten_extern_cent || 0) + Number(fall.kosten_intern_cent || 0) || Number(fall.regress_gefordert_cent || 0) || null);
  const [empfaenger, setEmpfaenger] = useState(lieferantEmail);
  const [zusatz, setZusatz] = useState("");
  const [fehler, setFehler] = useState({});
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.forderung.titel}
      unter={`${fall.lieferant || ""} · Frist bis ${fall.regress_frist_bis || "–"}`}
      groesse="md"
      testid="sheet-forderung"
      fuss={
        <Knopf variant="primary" laedt={laeuft} onClick={() => ausfuehren(forderungAction, { name: fall.name, betrag_cent: betrag, empfaenger, zusatz }, { ok: `Forderung ${euro(betrag)} gestellt – gewahrt erst mit Anerkenntnis`, onOk: onSchliessen, onFehler: (r) => r.fehler && setFehler(r.fehler) })} data-testid="forderung-ok">
          {T.dialog.forderung.ok}
        </Knopf>
      }
    >
      <div className="grid gap-4">
        <div className="bo-svc-feld" data-fehler={fehler.betrag ? "" : undefined}>
          <span>{T.dialog.forderung.betrag}</span>
          <BetragFeld value={betrag} onChange={setBetrag} aria-label={T.dialog.forderung.betrag} />
          {fehler.betrag && <span className="bo-svc-fehler">{fehler.betrag}</span>}
        </div>
        {!regresse.length && (
          <Feld label={T.dialog.maengelanzeige.empfaenger} fehler={fehler.empfaenger}>
            <input type="email" value={empfaenger} onChange={(x) => setEmpfaenger(x.target.value)} />
          </Feld>
        )}
        <Feld label={T.dialog.maengelanzeige.zusatz}>
          <textarea rows={3} value={zusatz} onChange={(x) => setZusatz(x.target.value)} />
        </Feld>
        <p className="bo-svc-hinweis">{fall.kundentyp === "Unternehmer" || fall.entscheidung === "Kulanz" ? T.akte.keinRegress933b : "Die Regressfrist ist erst mit Anerkenntnis oder Klage gewahrt – „Gemeldet“ genügt nicht."}</p>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------- S5 --

function ErledigtSheet({ fall, code, letzterEinsatz, schliessbarNachher, mitgeteilt, teile, onSchliessen }) {
  const { ausfuehren, laeuft } = useAktion();
  const liegtVor = ["Unterschrift", "Name bestätigt"].includes(letzterEinsatz?.unterschrift_art);
  const [bericht, setBericht] = useState(fall.abschlussbericht || letzterEinsatz?.bericht || code?.kundentext || "");
  const [bestaetigung, setBestaetigung] = useState(liegtVor ? "liegt-vor" : "ohne");
  const [informieren, setInformieren] = useState(fall.kunde_email ? "email" : "keine");
  const [schliessen, setSchliessen] = useState(false);
  const [fehler, setFehler] = useState({});
  const V = T.dialog.erledigt;
  const darfSchliessen = schliessbarNachher && (bestaetigung !== "ohne" || informieren === "email" || mitgeteilt);
  const offeneTeile = teile.filter((t) => ["Benoetigt", "Bestellt", "Eingetroffen"].includes(t.status)).length;
  return (
    <Sheet
      offen
      onSchliessen={onSchliessen}
      titel={V.titel}
      unter={`${fall.name} · ${fall.kunde_name}`}
      groesse="lg"
      testid="sheet-erledigt"
      fuss={
        <Knopf variant="primary" laedt={laeuft} onClick={() => ausfuehren(erledigtAction, { name: fall.name, bericht, bestaetigung, abnahmeName: fall.kunde_name, informieren, schliessen: schliessen && darfSchliessen }, { ok: (r) => V.erfolg(r.dauer), onOk: onSchliessen, onFehler: (r) => r.fehler && setFehler(r.fehler) })} data-testid="erledigt-ok">
          {informieren === "email" ? V.okInformieren : V.ok}
        </Knopf>
      }
    >
      <div className="grid gap-5">
        <Feld label={V.bericht} fehler={fehler.bericht}>
          <textarea rows={4} value={bericht} onChange={(x) => setBericht(x.target.value)} />
        </Feld>
        <Wahl
          label={V.bestaetigung}
          werte={liegtVor ? ["liegt-vor", "ohne"] : ["unterschrift", "ohne"]}
          wert={bestaetigung}
          onWahl={setBestaetigung}
          anzeige={(w) => (w === "liegt-vor" ? V.liegtVor(`Einsatz: ${letzterEinsatz?.unterschrift_art}`) : w === "unterschrift" ? "Kunde ist hier – Abnahme erfassen" : V.ohne)}
        />
        {letzterEinsatz && ["Verweigert", "Kunde abwesend"].includes(letzterEinsatz.unterschrift_art) && <p className="bo-svc-hinweis">Letzter Einsatz: {letzterEinsatz.unterschrift_art} – keine Abnahme.</p>}
        <Wahl label={V.informieren} werte={fall.kunde_email ? ["email", "keine"] : ["keine"]} wert={informieren} onWahl={setInformieren} anzeige={(w) => (w === "email" ? `E-Mail an ${fall.kunde_email}` : "Später informieren")} />
        {offeneTeile > 0 && (
          <p className="bo-svc-hinweis" data-ton="warn">
            {V.teileOffen(offeneTeile)}
          </p>
        )}
        {darfSchliessen ? <Schalter label={V.schliessen} an={schliessen} onWechsel={setSchliessen} /> : <p className="bo-svc-hinweis">{Number(fall.lieferantenrelevant) ? `Schließen nach „Forderung stellen“` : V.schliessenNicht}</p>}
      </div>
    </Sheet>
  );
}
