"use client";
// Kopf der Karten-Akte (Konzept §3.5.1) als Hero-Kachel im Lounge-Stil: große Karte in Stufenfarbe (dreht auf
// die Rückseite), Name 34/600, Zeile mit StufenKennzeichen (Popover „Stufe festlegen“), Kartennummer zum
// Kopieren, Berater; rechts genau eine Primäraktion je Zustand (Strg/⌘+Enter) + Aktionsmenü.

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import { Dialog, Menue, MenuePunkt, MenueTrenner, Popover } from "../Overlay";
import { useToast } from "../Toast";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import LeitungBitten from "../LeitungBitten";
import DruckPanel, { useDruckTaste } from "../Druck/DruckPanel";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import MiniKarte from "./MiniKarte";
import StufenKennzeichen from "./StufenKennzeichen";
import { BelegWahl, useEinloesen } from "./Einloesen";
import { ChipWahl, EntsperrenDialog, ErsatzDialog, KuendigenDialog, SperrenDialog, Textfeld, UebertragenDialog, ZusammenDialog } from "./Dialoge";
import { VorteilIcon } from "./VorteilIcon";
import { automatikZulassenAction, stufeFestlegenAction, stufeZuruecksetzenAction, uebergabePlanenAction, walletErneuernAction } from "@/lib/backoffice/kundenkarte/actions";
import { KARTE_STATUS, STUFE_GRUENDE, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { primaeraktion } from "@/lib/backoffice/kundenkarte/regeln";
import { datum } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

function Kopieren({ nr }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <button
        type="button"
        className="bo-rund bo-rund--s bo-rund--flach bo-tip"
        aria-label={T.akte.kopieren}
        data-tip={T.akte.kopieren}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(nr);
          } catch {
            /* Zwischenablage nicht erlaubt – Nummer steht sichtbar daneben */
          }
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
      >
        {ok ? <Check aria-hidden="true" className="size-3.5" strokeWidth={1.75} /> : <Copy aria-hidden="true" className="size-3.5" strokeWidth={1.75} />}
      </button>
      <span className="bo-kk-sr" role="status">
        {ok ? T.akte.kopiert : ""}
      </span>
    </>
  );
}

function StufePopover({ karte, stufe, farbe, stufen, manuell, leitung, darfBitten }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const [wahl, setWahl] = useState(stufe);
  const [grund, setGrund] = useState("");
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const festlegen = () => {
    if (!grund) return setFehler("Bitte einen Grund wählen.");
    starte(async () => {
      const r = await stufeFestlegenAction({ karte, stufe: wahl, grund, freitext: text });
      if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
      setOffen(false);
      router.refresh();
      zeige(T.stufe.toast(wahl), {
        art: "ok",
        dauer: 8000,
        aktion: {
          titel: "Rückgängig",
          onClick: async () => {
            await stufeZuruecksetzenAction({ karte, stufe: r.undo.stufe, manuell: r.undo.manuell });
            router.refresh();
          },
        },
      });
    });
  };
  return (
    <Popover
      label={T.stufe.titel}
      fokusfalle
      breite={360}
      offen={offen}
      onOffen={setOffen}
      testid="kk-stufe-popover"
      ausloeser={(p) => <StufenKennzeichen {...p} als="button" stufe={stufe} farbe={farbe} groesse="l" zusatz={manuell ? T.akte.vonHand : undefined} data-testid="kk-stufe-knopf" />}
    >
      <div className="flex w-[min(360px,calc(100vw-48px))] flex-col gap-4 p-4">
        <p className="text-[15px] font-semibold">{T.stufe.titel}</p>
        {!leitung && (
          <div className="flex flex-col gap-2">
            <p className="bo-kk-satz">{T.akte.stufeLeitung}</p>
            <LeitungBitten erlaubt={darfBitten} bereich="kundenkarte" bereichTitel="Kundenkarte" aktion="stufe" aktionTitel="Stufe festlegen" objekt={{ doctype: "PH Kundenkarte", name: karte }} />
          </div>
        )}
        <fieldset disabled={!leitung} className="flex flex-col gap-1.5">
          <legend className="bo-kk-label">{T.karten.stufe}</legend>
          {stufen.map((s) => (
            <label key={s.name} className="bo-kk-haken py-2">
              <input type="radio" name="stufe" value={s.name} checked={wahl === s.name} onChange={() => setWahl(s.name)} />
              <StufenKennzeichen stufe={s.stufenname} farbe={s.farbe} groesse="s" />
            </label>
          ))}
        </fieldset>
        {leitung && (
          <>
            <ChipWahl label={T.stufe.grund} optionen={STUFE_GRUENDE} wert={grund} onWert={(w) => (setGrund(w), setFehler(""))} name="stufe_grund" />
            <Textfeld label={T.stufe.freitext} wert={text} onWert={setText} hilfe="optional" />
            <p className="bo-kk-satz">{T.stufe.folge}</p>
            {fehler && (
              <p className="bo-kk-fehler" role="alert">
                {fehler}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Knopf size="s" onClick={() => setOffen(false)}>
                Abbrechen
              </Knopf>
              <Knopf size="s" variant="primary" laedt={laeuft} disabled={wahl === stufe && manuell} onClick={festlegen}>
                {T.stufe.knopf}
              </Knopf>
            </div>
          </>
        )}
      </div>
    </Popover>
  );
}

/** Dialog „Vorteil einlösen“ (Primäraktion): erst Vorteil, dann Beleg. */
function EinloeseDialog({ karte, kunde, vorteile, onSchliessen }) {
  const verfuegbar = vorteile.filter((v) => v.verfuegbar);
  const [wahl, setWahl] = useState(verfuegbar.length === 1 ? verfuegbar[0] : null);
  const einloesen = useEinloesen({ karte, kunde });
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={T.einloesen.dialogTitel} text={kunde} groesse="md" testid="kk-einloese-dialog">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={T.einloesen.vorteil}>
          {verfuegbar.map((v) => (
            <button key={v.vorteil} type="button" role="radio" aria-checked={wahl?.vorteil === v.vorteil} className="bo-kk-chip" onClick={() => setWahl(v)}>
              <VorteilIcon art={v.art} className="size-4" />
              {v.titel}
            </button>
          ))}
          {verfuegbar.length === 0 && <p className="text-[14px] text-bo-text-soft">Gerade ist kein Vorteil einlösbar.</p>}
        </div>
        {wahl && (
          <BelegWahl
            key={wahl.vorteil}
            karte={karte}
            vorteil={wahl.vorteil}
            art={wahl.art}
            autoFokus={false}
            onWahl={async (w) => {
              onSchliessen();
              await einloesen({ vorteil: wahl.vorteil, titel: wahl.titel, ...w });
            }}
          />
        )}
      </div>
    </Dialog>
  );
}

export default function KarteKopf({ karte, uebersicht, stufen = [], rolle, darfSchreiben = false, leitung = false, darfBitten = false, datenschutz = "", pdf = false, startEinloesen = false, startDruck = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [dialog, setDialog] = useState(startEinloesen && karte.status === "Aktiv" && darfSchreiben ? { art: "einloesen" } : null);
  const [ergebnis, setErgebnis] = useState(null);
  const [status, setStatus] = useState(karte.status);
  const [druck, setDruck] = useDruckTaste({ kontext: "akte" });
  const druckStart = useRef(startDruck);
  useEffect(() => {
    if (!druckStart.current) return undefined;
    druckStart.current = false;
    const t = setTimeout(() => setDruck(true), 0);
    return () => clearTimeout(t);
  }, [setDruck]);
  const [, starteTr] = useTransition();
  const st = stufen.find((s) => s.name === karte.stufe);
  const p = primaeraktion({ ...karte, status }, rolle);

  const primaer = () => {
    if (!p || p.gesperrt) return;
    if (p.id === "einloesen") setDialog({ art: "einloesen" });
    else if (p.id === "uebergabe")
      starteTr(async () => {
        const r = await uebergabePlanenAction({ karte: karte.name });
        if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
        setStatus("Aktiv");
        starte(T.uebergabe.toast(karte.name), { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: `Übergabe ${karte.name}`, onVerworfen: () => setStatus("Beantragt"), onFehler: () => setStatus("Beantragt"), onErfolg: () => router.refresh() });
      });
    else if (p.id === "entsperren") setDialog({ art: "entsperren" });
    else if (p.id === "ersatz") setDialog({ art: "ersatz", startArt: karte.sperrgrund_art });
    else if (p.id === "neu") router.push(`/kundenkarte/karten/neu?kontakt=${encodeURIComponent(karte.kontakt || "")}`);
    else if (p.id === "zurNeuen") router.push(`/kundenkarte/karten/${p.ziel}`);
  };
  useKuerzel("akte", { "akte.primaer": () => primaer() });
  useKuerzel("akte@kundenkarte", { "kundenkarte.einloesen": () => (status === "Aktiv" && darfSchreiben ? setDialog({ art: "einloesen" }) : false) });

  const fertig = () => {
    setDialog(null);
    router.refresh();
  };
  const offen = ["Aktiv", "Beantragt", "Gesperrt"].includes(status);

  return (
    <section className="bo-kachel" aria-labelledby="kk-karte-titel" data-testid="kk-kopf">
      <div className="bo-kk-kopf">
        <MiniKarte nr={karte.name} name={karte.kunde_name} stufe={karte.stufe} farbe={st?.farbe} qrSvg={karte.qr_svg} datenschutz={datenschutz} gross />
        <div className="bo-kk-kopf__mitte">
          <div className="bo-kk-kopf__name">
            <h1 id="kk-karte-titel" className="bo-kk-kopf__titel">
              {karte.kunde_name}
            </h1>
            {status !== "Aktiv" && <StatusBadge wert={status} text={statusLabel(KARTE_STATUS, status)} ton={statusTon(KARTE_STATUS, status)} groesse="m" />}
          </div>
          <div className="bo-kk-kopf__zeile">
            <StufePopover karte={karte.name} stufe={karte.stufe} farbe={st?.farbe} stufen={stufen.filter((s) => s.aktiv)} manuell={Number(karte.stufe_manuell) === 1} leitung={leitung} darfBitten={darfBitten} />
            {karte.stufe_seit && <span>{T.akte.seit(datum(karte.stufe_seit))}</span>}
            {leitung && Number(karte.stufe_manuell) === 1 && (
              <button
                type="button"
                className="text-[13px] font-medium text-bo-text underline decoration-bo-line-strong underline-offset-4"
                onClick={() =>
                  starteTr(async () => {
                    const r = await automatikZulassenAction({ karte: karte.name });
                    if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
                    router.refresh();
                    zeige(T.stufe.automatik, { art: "ok", dauer: 8000, aktion: { titel: "Rückgängig", onClick: async () => (await stufeZuruecksetzenAction({ karte: karte.name, stufe: r.undo.stufe, manuell: 1 }), router.refresh()) } });
                  })
                }
              >
                {T.akte.automatik}
              </button>
            )}
          </div>
          <div className="bo-kk-kopf__zeile">
            <span className="bo-kk-nr" data-testid="kk-nummer">
              {karte.name}
              <Kopieren nr={karte.name} />
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="User" className="size-3.5" />
              {T.akte.berater}: {karte.berater_name || T.akte.keinBerater}
            </span>
            {karte.kontakt && (
              <Link href={`/kunden/${encodeURIComponent(karte.kontakt)}`} className="inline-flex items-center gap-1 font-medium text-bo-text underline decoration-bo-line-strong underline-offset-4">
                {T.akte.kundenakte}
                <Icon name="ArrowUpRight" className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
        <div className="bo-kk-kopf__aktionen">
          {p && (
            <Knopf variant="primary" icon={p.icon} onClick={primaer} disabled={p.gesperrt} grund={p.gesperrt ? p.grund : undefined} kuerzel="Strg+Enter" data-testid="kk-primaer">
              {p.titel}
            </Knopf>
          )}
          {p?.gesperrt && <LeitungBitten erlaubt={darfBitten} bereich="kundenkarte" bereichTitel="Kundenkarte" aktion="entsperren" aktionTitel="Karte entsperren" objekt={{ doctype: "PH Kundenkarte", name: karte.name, titel: karte.kunde_name }} />}
          <Menue label={T.akte.aktionen} platzierung="unten-ende" breite={280} ausloeser={(pp) => <Knopf {...pp} icon="Ellipsis" label={T.akte.aktionen} data-testid="kk-menue" />}>
            <MenuePunkt icon="Printer" kuerzel="Strg+P" onWaehlen={() => setDruck(true)}>
              {T.akte.drucken} …
            </MenuePunkt>
            {darfSchreiben && (
              <MenuePunkt
                icon="Wallet"
                onWaehlen={() =>
                  starteTr(async () => {
                    const r = await walletErneuernAction({ karte: karte.name });
                    zeige(r?.ok ? T.akte.walletErneuert : T.akte.walletFehler, { art: r?.ok ? "ok" : "fehler" });
                  })
                }
                deaktiviert={!offen}
                grund="Nur für gültige Karten."
              >
                {T.akte.walletErneuern}
              </MenuePunkt>
            )}
            {darfSchreiben && (
              <>
                <MenueTrenner />
                <MenuePunkt icon="CreditCard" onWaehlen={() => setDialog({ art: "ersatz" })} deaktiviert={!(status === "Aktiv" || (status === "Gesperrt" && ["Verlust", "Diebstahl", "Beschaedigt"].includes(karte.sperrgrund_art)))} grund="Nur für aktive oder wegen Verlust, Diebstahl oder Beschädigung gesperrte Karten.">
                  Ersatzkarte …
                </MenuePunkt>
                <MenuePunkt icon="Lock" onWaehlen={() => setDialog({ art: "sperren" })} deaktiviert={!["Aktiv", "Beantragt"].includes(status)} grund="Nur aktive oder beantragte Karten.">
                  Sperren …
                </MenuePunkt>
                <MenuePunkt icon="Users" onWaehlen={() => setDialog({ art: "uebertragen" })} deaktiviert={!leitung || !["Aktiv", "Gesperrt"].includes(status)} grund={leitung ? "Nur aktive oder gesperrte Karten." : T.akte.uebertragenGrund}>
                  Übertragen …
                </MenuePunkt>
                <MenuePunkt icon="Layers" onWaehlen={() => setDialog({ art: "zusammen" })} deaktiviert={!leitung || !offen} grund={leitung ? "Nur für offene Karten." : T.akte.zusammenGrund}>
                  Zusammenführen …
                </MenuePunkt>
                <MenuePunkt icon="X" gefaehrlich onWaehlen={() => setDialog({ art: "kuendigen" })} deaktiviert={!leitung || !offen} grund={leitung ? "Karte ist bereits beendet." : T.akte.kuendigenGrund}>
                  Kündigen …
                </MenuePunkt>
                {!leitung && <LeitungBitten variante="menue" erlaubt={darfBitten} bereich="kundenkarte" bereichTitel="Kundenkarte" aktion="kuendigen" aktionTitel="Karte kündigen" objekt={{ doctype: "PH Kundenkarte", name: karte.name, titel: karte.kunde_name }} />}
              </>
            )}
            <MenueTrenner />
            {darfSchreiben && (
              <MenuePunkt icon="CheckSquare" href={`/d/ph-aufgabe/neu?referenz_doctype=PH%20Kundenkarte&referenz_name=${encodeURIComponent(karte.name)}&kontakt=${encodeURIComponent(karte.kontakt || "")}`}>
                {T.akte.aufgabe}
              </MenuePunkt>
            )}
            {karte.kontakt && (
              <MenuePunkt icon="Contact" href={`/kunden/${encodeURIComponent(karte.kontakt)}`}>
                {T.akte.kundenakte}
              </MenuePunkt>
            )}
            {leitung && karte.kontakt && (
              <MenuePunkt icon="Shield" href={`/kunden/${encodeURIComponent(karte.kontakt)}?tab=mehr`}>
                {T.akte.datenschutz}
              </MenuePunkt>
            )}
          </Menue>
        </div>
      </div>

      {dialog?.art === "einloesen" && <EinloeseDialog karte={karte.name} kunde={karte.kunde_name} vorteile={uebersicht.vorteile || []} onSchliessen={() => setDialog(null)} />}
      {dialog?.art === "sperren" && <SperrenDialog karten={[karte.name]} onSchliessen={() => setDialog(null)} onGeplant={() => setStatus("Gesperrt")} onZurueck={() => router.refresh()} onErsatzVorschlag={(a) => zeige(`${T.sperren.vorschlag}?`, { art: "info", dauer: 8000, aktion: { titel: T.sperren.vorschlag, onClick: () => setDialog({ art: "ersatz", startArt: a }) } })} />}
      {dialog?.art === "ersatz" && <ErsatzDialog karte={karte.name} startArt={dialog.startArt} onSchliessen={() => setDialog(null)} onErgebnis={(nr) => (setDialog(null), setErgebnis({ titel: T.ersatz.ergebnis(nr), nr }), router.refresh())} />}
      {dialog?.art === "entsperren" && <EntsperrenDialog karte={karte.name} onSchliessen={() => setDialog(null)} onFertig={() => (fertig(), setStatus("Aktiv"), zeige(T.entsperren.ergebnis(karte.name), { art: "ok" }))} />}
      {dialog?.art === "kuendigen" && <KuendigenDialog karte={karte.name} onSchliessen={() => setDialog(null)} onFertig={() => (fertig(), setStatus("Gekuendigt"), zeige(T.kuendigen.ergebnis(karte.name), { art: "ok" }))} />}
      {dialog?.art === "uebertragen" && <UebertragenDialog karte={karte.name} onSchliessen={() => setDialog(null)} onErgebnis={(nr) => (setDialog(null), setErgebnis({ titel: T.uebertragen.ergebnis(nr), nr }), router.refresh())} />}
      {dialog?.art === "zusammen" && <ZusammenDialog karte={karte.name} onSchliessen={() => setDialog(null)} onFertig={(ziel) => (setDialog(null), zeige(T.zusammen.ergebnis(ziel), { art: "ok" }), router.push(`/kundenkarte/karten/${ziel}`))} />}
      {ergebnis && (
        <Dialog offen onSchliessen={() => setErgebnis(null)} titel={ergebnis.titel} groesse="md" testid="kk-ergebnis">
          <ErgebnisKarte ohneKachel titel={ergebnis.titel} unter="Die alte Karte ist ab sofort ungültig." weiter={{ titel: "Karte öffnen", href: `/kundenkarte/karten/${ergebnis.nr}` }} aktionen={[{ titel: "Karte drucken", href: `/kundenkarte/karten/${ergebnis.nr}?druck=1`, icon: "Printer" }]} />
        </Dialog>
      )}
      <DruckPanel offen={druck} onSchliessen={() => setDruck(false)} doctype="PH Kundenkarte" name={karte.name} titel={`Kundenkarte ${karte.name}`} pdf={pdf} />
    </section>
  );
}
