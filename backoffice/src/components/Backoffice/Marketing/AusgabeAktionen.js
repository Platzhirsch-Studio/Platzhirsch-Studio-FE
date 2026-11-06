"use client";
// Ausgabe-Akte, Kopf (10-konzept-marketing § 2.3 Primäraktion je Zustand, § 4.4 D1/D7): genau eine Primäraktion,
// daneben Testmail, `⋯` für Seltenes. Zur Freigabe = verzögerter Commit; Freigeben = Dialog D1 mit Vorschau,
// Prüfliste und Termin im Knopf (Sperrtage nicht wählbar); Jetzt versenden / Abbrechen = Bestätigung mit Fakten.
// Fortschritt beim Versand: Abfrage alle 15 s (L17), Balken 2 px Cognac, kein Puls.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { MailVorschau } from "./Kleinteile";
import { Balken, Pruefzeile } from "./Bausteine";
import useAktion from "./useAktion";
import {
  ausgabeAbbrechenAction, ausgabeDuplizierenAction, ausgabeFreigebenAction, ausgabeJetztVersendenAction, ausgabeTerminAction, ausgabeVersandStandAction,
  ausgabeVorschauAction, ausgabeZurFreigabeAction, ausgabeZurueckAufEntwurfAction, testmailAction, zurueckgebenAction,
} from "@/lib/backoffice/marketing/actions";
import { kurzDatum, monatAusSlug, pruefeVersandtermin } from "@/lib/backoffice/marketing/regeln";
import { FREIGABE, NEWSLETTER, TESTMAIL, VERSAND } from "@/lib/backoffice/marketing/texte";
import { zahl } from "@/lib/backoffice/format";

const isoMinute = (v) => (v ? String(v).slice(0, 16).replace("T", " ") : "");

export default function AusgabeAktionen({ name, doc, bereit, leitung, team, letzteTestmail, testmodus, testadresse, fenster, dialog, vorschlag, empfaenger }) {
  const router = useRouter();
  const { sofort, verzoegert, zeige, laeuft } = useAktion();
  const [offen, setOffen] = useState(dialog === "freigeben" ? "freigeben" : null);
  const monat = monatAusSlug(doc.slug);
  const status = doc.status;

  useKuerzel("akte@marketing", { "marketing.testmail": () => setOffen("testmail") });

  const zurFreigabe = () =>
    verzoegert(() => ausgabeZurFreigabeAction({ name }), {
      text: NEWSLETTER.zurFreigabeToast(monat),
      gruppe: "marketing.nl-freigabe",
      fehlerText: `Zur Freigabe ${monat}`,
    });

  const primaer = (() => {
    if (status === "Entwurf") {
      if (leitung) return { titel: NEWSLETTER.freigebenUndPlanen, onClick: () => setOffen("freigeben"), deaktiviert: !bereit.bereit, grund: bereit.bereit ? null : NEWSLETTER.nichtBereit(bereit.fehlt), testid: "primaer-freigeben" };
      if (team) return { titel: NEWSLETTER.zurFreigabe, onClick: zurFreigabe, deaktiviert: !bereit.bereit, grund: bereit.bereit ? null : NEWSLETTER.nichtBereit(bereit.fehlt), testid: "primaer-zur-freigabe" };
    }
    if (status === "Freigabe" && leitung) return { titel: NEWSLETTER.freigeben, onClick: () => setOffen("freigeben"), testid: "primaer-freigeben" };
    if (status === "Geplant" && leitung) return { titel: NEWSLETTER.jetztVersenden, onClick: () => setOffen("jetzt"), testid: "primaer-jetzt" };
    if (status === "Versendet") return { titel: NEWSLETTER.protokoll, href: `/marketing/newsletter/${encodeURIComponent(name)}?tab=protokoll`, testid: "primaer-protokoll" };
    if (status === "Abgebrochen" && team) return { titel: "Duplizieren", onClick: () => duplizieren(), testid: "primaer-duplizieren" };
    return null;
  })();

  const duplizieren = () =>
    sofort(() => ausgabeDuplizierenAction({ name }), {
      neuLaden: false,
      onOk: (r) => router.push(`/marketing/newsletter/${encodeURIComponent(r.name)}?fokus=betreff`),
      ok: (r) => `Ausgabe ${r.monat} angelegt`,
    });

  useKuerzel("akte", { "akte.primaer": () => primaer && !primaer.deaktiviert && (primaer.onClick ? primaer.onClick() : router.push(primaer.href)) });

  return (
    <div className="bo-mar-aktionen" data-testid="ausgabe-aktionen">
      {status === "Wird versendet" && <VersandFortschritt name={name} doc={doc} />}
      {["Entwurf", "Freigabe", "Geplant"].includes(status) && team && (
        <Knopf icon="Mail" onClick={() => setOffen("testmail")} data-testid="testmail-oeffnen">
          {NEWSLETTER.testmail}
        </Knopf>
      )}
      {status === "Freigabe" && leitung && (
        <Knopf onClick={() => setOffen("zurueck")} data-testid="zurueckgeben">
          {NEWSLETTER.zurueckgeben}
        </Knopf>
      )}
      {status === "Geplant" && leitung && (
        <Knopf icon="Calendar" onClick={() => setOffen("termin")}>
          {NEWSLETTER.terminAendern}
        </Knopf>
      )}
      {status === "Versendet" && team && <Knopf onClick={duplizieren}>{NEWSLETTER.duplizieren}</Knopf>}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" />}>
        {team && status !== "Abgebrochen" && <MenuePunkt icon="Layers" onWaehlen={duplizieren}>Duplizieren</MenuePunkt>}
        <MenuePunkt icon="Printer" onWaehlen={() => window.print()}>
          {NEWSLETTER.drucken}
        </MenuePunkt>
        {status === "Freigabe" && (team || leitung) && <MenuePunkt icon="Undo2" onWaehlen={() => sofort(() => ausgabeZurueckAufEntwurfAction({ name }), { ok: NEWSLETTER.zurueckToast })}>{NEWSLETTER.zurueckAufEntwurf}</MenuePunkt>}
        {status === "Geplant" && leitung && <MenuePunkt icon="Undo2" onWaehlen={() => sofort(() => ausgabeZurueckAufEntwurfAction({ name }), { ok: NEWSLETTER.zurueckToast })}>{NEWSLETTER.zurueckAufEntwurf}</MenuePunkt>}
        {["Entwurf", "Geplant", "Wird versendet"].includes(status) && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="CircleX" gefaehrlich deaktiviert={!leitung} grund={!leitung ? "Nur Leitung Marketing" : undefined} onWaehlen={() => setOffen("abbrechen")}>
              {NEWSLETTER.abbrechen}
            </MenuePunkt>
          </>
        )}
      </Menue>
      {primaer &&
        (primaer.href ? (
          <Knopf variant="primary" href={primaer.href} data-testid={primaer.testid} kuerzel="mod+enter">
            {primaer.titel}
          </Knopf>
        ) : (
          <span className="inline-flex flex-col items-end">
            <Knopf variant="primary" onClick={primaer.onClick} disabled={primaer.deaktiviert || laeuft} laedt={laeuft} data-testid={primaer.testid} kuerzel="mod+enter">
              {primaer.titel}
            </Knopf>
            {primaer.grund && (
              <a href={`?block=${bereit.fehltBlock}`} className="bo-mar-klein bo-mar-warn mt-1 underline underline-offset-2" data-testid="nicht-bereit">
                {primaer.grund} – zum Teil springen
              </a>
            )}
          </span>
        ))}
      {status === "Freigabe" && !leitung && <span className="bo-mar-klein" data-testid="wartet-badge">{NEWSLETTER.wartetBadge}</span>}

      <TestmailDialog offen={offen === "testmail"} onSchliessen={() => setOffen(null)} doctype="PH Newsletter Ausgabe" name={name} vorbelegt={testadresse} />
      {offen === "freigeben" && <FreigabeDialog name={name} doc={doc} bereit={bereit} letzteTestmail={letzteTestmail} empfaenger={empfaenger} vorschlag={vorschlag} fenster={fenster} onSchliessen={() => setOffen(null)} onZurueck={() => setOffen("zurueck")} />}
      <ZurueckgebenDialog offen={offen === "zurueck"} onSchliessen={() => setOffen(null)} doctype="PH Newsletter Ausgabe" name={name} titel={`Ausgabe ${monat}`} />
      <Bestaetigen
        offen={offen === "jetzt"}
        titel={VERSAND.jetztTitel(monat)}
        text={VERSAND.jetztText}
        fakten={[
          { label: VERSAND.fakten.empfaenger, wert: zahl(empfaenger ?? doc.empfaenger_anzahl ?? 0) },
          { label: VERSAND.fakten.zielgruppe, wert: doc.zielgruppe },
          { label: VERSAND.fakten.testmail, wert: letzteTestmail ? kurzDatum(letzteTestmail, { zeit: true }) : FREIGABE.keineTestmail },
          testmodus ? { label: VERSAND.fakten.testmodus, wert: "an – Mails gehen an die Testadresse" } : null,
        ].filter(Boolean)}
        bestaetigen={VERSAND.jetztKnopf}
        laeuft={laeuft}
        onAbbrechen={() => setOffen(null)}
        onBestaetigen={async () => {
          await sofort(() => ausgabeJetztVersendenAction({ name }), { ok: VERSAND.versendet(monat) });
          setOffen(null);
        }}
      />
      <AbbrechenDialog offen={offen === "abbrechen"} onSchliessen={() => setOffen(null)} name={name} monat={monat} />
      <TerminDialog offen={offen === "termin"} onSchliessen={() => setOffen(null)} name={name} termin={doc.versand_geplant} fenster={fenster} />
      {/* Hinweis bei Rückweg ohne Recht */}
      {zeige && null}
    </div>
  );
}

function VersandFortschritt({ name, doc }) {
  const router = useRouter();
  const [stand, setStand] = useState({ gesendet: doc.gesendet || 0, fehler: doc.fehler || 0, empfaenger: doc.empfaenger_anzahl || 0 });
  useEffect(() => {
    const t = setInterval(async () => {
      const r = await ausgabeVersandStandAction({ name });
      if (r?.ok) {
        setStand(r);
        if (r.status !== "Wird versendet") router.refresh();
      }
    }, 15000);
    return () => clearInterval(t);
  }, [name, router]);
  return (
    <span className="inline-flex min-w-[220px] flex-col gap-1" data-testid="versand-fortschritt">
      <span className="bo-mar-klein tabular-nums" aria-live="off">
        {NEWSLETTER.fortschritt(zahl(stand.gesendet), zahl(stand.empfaenger), stand.fehler)}
      </span>
      <Balken fortschritt anteil={stand.empfaenger ? stand.gesendet / stand.empfaenger : 0} label={NEWSLETTER.fortschritt(stand.gesendet, stand.empfaenger, stand.fehler)} />
    </span>
  );
}

export function TestmailDialog({ offen, onSchliessen, doctype, name, vorbelegt = "" }) {
  const [adresse, setAdresse] = useState(vorbelegt);
  const [fehler, setFehler] = useState(null);
  const { sofort, laeuft } = useAktion();
  const senden = async () => {
    setFehler(null);
    const r = await sofort(() => testmailAction({ doctype, name, empfaenger: adresse }), { ok: (x) => TESTMAIL.gesendet(x.empfaenger) });
    if (r?.ok) onSchliessen();
    else setFehler(r?.fehler?.empfaenger || r?.message);
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={TESTMAIL.titel}
      groesse="sm"
      testid="testmail-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} disabled={laeuft || !adresse} data-testid="testmail-senden">
            {TESTMAIL.senden}
          </Knopf>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
      >
        <label className="bo-mar-feld">
          <span>{TESTMAIL.adresse}</span>
          <input className="bo-mar-eingabe" type="email" value={adresse} onChange={(e) => setAdresse(e.target.value)} aria-invalid={fehler ? "true" : undefined} aria-describedby="tm-f" autoFocus data-testid="testmail-adresse" />
          <span id="tm-f" className={fehler ? "bo-mar-feld__fehler" : "bo-mar-feld__hinweis"}>
            {fehler || TESTMAIL.nurIntern}
          </span>
        </label>
      </form>
    </Dialog>
  );
}

export function ZurueckgebenDialog({ offen, onSchliessen, doctype, name, titel }) {
  const [text, setText] = useState("");
  const [fehler, setFehler] = useState(null);
  const { sofort, laeuft } = useAktion();
  const los = async () => {
    if (text.trim().length < 3) {
      setFehler(FREIGABE.grundPflicht);
      return;
    }
    const r = await sofort(() => zurueckgebenAction({ doctype, name, kommentar: text }), { ok: FREIGABE.zurueckgegeben(titel) });
    if (r?.ok) onSchliessen();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={`${titel} zurückgeben`}
      text="Die Person, die eingereicht hat, bekommt eine Aufgabe mit deinem Satz."
      groesse="sm"
      testid="zurueckgeben-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" onClick={los} laedt={laeuft} disabled={laeuft}>
            Zurückgeben
          </Knopf>
        </>
      }
    >
      <label className="bo-mar-feld">
        <span>{FREIGABE.grund}</span>
        <textarea className="bo-mar-eingabe" rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={fehler ? "true" : undefined} autoFocus />
        {fehler && <span className="bo-mar-feld__fehler">{fehler}</span>}
      </label>
    </Dialog>
  );
}

function AbbrechenDialog({ offen, onSchliessen, name, monat }) {
  const [grund, setGrund] = useState("");
  const { sofort, laeuft } = useAktion();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={VERSAND.abbrechenTitel(monat)}
      text={VERSAND.abbrechenText}
      groesse="sm"
      art="bestaetigen"
      rolle="alertdialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen} autoFocus>
            Abbrechen
          </Knopf>
          <Knopf
            variant="danger-solid"
            laedt={laeuft}
            disabled={laeuft || grund.trim().length < 3}
            onClick={async () => {
              const r = await sofort(() => ausgabeAbbrechenAction({ name, grund }), { ok: VERSAND.abgebrochen(monat) });
              if (r?.ok) onSchliessen();
            }}
          >
            {VERSAND.abbrechenKnopf}
          </Knopf>
        </>
      }
    >
      <label className="bo-mar-feld">
        <span>{VERSAND.grund}</span>
        <input className="bo-mar-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} />
      </label>
    </Dialog>
  );
}

function TerminDialog({ offen, onSchliessen, name, termin, fenster }) {
  const [wert, setWert] = useState(isoMinute(termin));
  const { verzoegert, laeuft } = useAktion();
  const p = pruefeVersandtermin(wert, { ...fenster, jetzt: new Date() });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={VERSAND.terminTitel}
      groesse="sm"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            disabled={laeuft || p.gesperrt}
            onClick={async () => {
              const r = await verzoegert(() => ausgabeTerminAction({ name, termin: wert }), { text: VERSAND.terminVerschoben(kurzDatum(wert, { zeit: true })) });
              if (r?.ok) onSchliessen();
            }}
          >
            Verschieben
          </Knopf>
        </>
      }
    >
      <div className="bo-mar-feld">
        <span id="termin-l">{NEWSLETTER.felder.versand_geplant}</span>
        <Datumsfeld value={wert} onChange={setWert} mitZeit gruppeLabelId="termin-l" invalid={p.gesperrt} />
        {p.gesperrt ? <span className="bo-mar-feld__fehler">{p.grund}</span> : p.hinweis ? <span className="bo-mar-feld__hinweis">{p.hinweis}</span> : null}
      </div>
    </Dialog>
  );
}

/** D1 – Newsletter freigeben: links Vorschau, rechts Prüfliste und Versandzeit; Knopftext trägt den Termin. */
function FreigabeDialog({ name, doc, bereit, letzteTestmail, empfaenger, vorschlag, fenster, onSchliessen, onZurueck }) {
  const [termin, setTermin] = useState(isoMinute(doc.versand_geplant) || vorschlag);
  const [vorschau, setVorschau] = useState({ html: null, fehler: null, laedt: true });
  const [fotosOk, setFotosOk] = useState(false);
  const { verzoegert, laeuft } = useAktion();
  const router = useRouter();
  const monat = monatAusSlug(doc.slug);
  const p = useMemo(() => pruefeVersandtermin(termin, { ...fenster, jetzt: new Date() }), [termin, fenster]);
  const kundenFotos = (doc.bloecke || []).some((b) => /kundenprojekt/i.test(b.quelle || ""));

  const lade = useCallback(async (anzeigen = true) => {
    if (anzeigen) setVorschau((v) => ({ ...v, laedt: true }));
    const r = await ausgabeVorschauAction({ name });
    setVorschau(r?.ok ? { html: r.html, fehler: null, laedt: false } : { html: null, fehler: r?.message || NEWSLETTER.vorschauFehler, laedt: false });
  }, [name]);
  useEffect(() => {
    Promise.resolve().then(() => lade(false));
  }, [lade]);

  const sperre = !bereit.bereit ? NEWSLETTER.nichtBereit(bereit.fehlt) : vorschau.fehler ? NEWSLETTER.ohneVorschau : p.gesperrt ? p.grund : kundenFotos && !fotosOk ? "Einwilligung Foto-Referenz bestätigen" : null;
  const freigeben = async () => {
    const r = await verzoegert(() => ausgabeFreigebenAction({ name, versand_geplant: termin, vorschauOk: !vorschau.fehler }), {
      text: NEWSLETTER.freigegebenToast(monat, kurzDatum(termin, { zeit: true })),
      gruppe: "marketing.nl-freigeben",
      fehlerText: `Freigeben ${monat}`,
    });
    if (r?.ok) {
      onSchliessen();
      router.replace(`/marketing/newsletter/${encodeURIComponent(name)}`, { scroll: false });
    }
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={FREIGABE.titelAusgabe(monat)}
      groesse="lg"
      testid="freigabe-dialog"
      fuss={
        <>
          <Knopf onClick={onZurueck}>{FREIGABE.zurueckgeben}</Knopf>
          <span className="inline-flex flex-col items-end">
            <Knopf variant="primary" onClick={freigeben} disabled={!!sperre || laeuft} laedt={laeuft} data-testid="freigeben-knopf" kuerzel="mod+enter">
              {FREIGABE.knopf(kurzDatum(termin, { zeit: true }))}
            </Knopf>
            {sperre && <span className="bo-mar-klein bo-mar-warn mt-1">{sperre}</span>}
          </span>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
        <MailVorschau html={vorschau.html} titel={NEWSLETTER.vorschauTitel(monat, "Freigabe")} fehler={vorschau.fehler} laedt={vorschau.laedt} onErneut={lade} hoehe={420} testid="freigabe-vorschau" />
        <div className="flex flex-col gap-4">
          <div>
            <p className="bo-mar-titel mb-2">{FREIGABE.pruefliste}</p>
            <ul className="bo-mar-check">
              <Pruefzeile ok={bereit.bereit} text={bereit.bereit ? `${FREIGABE.bereit} · ${bereit.ok} von ${bereit.gesamt}` : NEWSLETTER.nichtBereit(bereit.fehlt)} />
              <Pruefzeile ok={letzteTestmail ? true : false} text={letzteTestmail ? FREIGABE.testmail(kurzDatum(letzteTestmail, { zeit: true })) : FREIGABE.keineTestmail} />
              <Pruefzeile ok={(empfaenger ?? 0) > 0} text={FREIGABE.empfaenger(zahl(empfaenger ?? 0))} />
              <Pruefzeile ok={kundenFotos ? fotosOk : null} text={kundenFotos ? FREIGABE.fotos : `${FREIGABE.fotos}: keine`} />
            </ul>
            {kundenFotos && (
              <label className="bo-mar-haken mt-2">
                <input type="checkbox" checked={fotosOk} onChange={(e) => setFotosOk(e.target.checked)} />
                <span>{FREIGABE.kundenprojektHaken}</span>
              </label>
            )}
          </div>
          <div className="bo-mar-feld">
            <span id="fg-termin">{FREIGABE.versandzeit}</span>
            <Datumsfeld value={termin} onChange={setTermin} mitZeit gruppeLabelId="fg-termin" invalid={p.gesperrt} />
            {p.gesperrt ? <span className="bo-mar-feld__fehler" data-testid="sperrtag">{p.grund}</span> : p.hinweis ? <span className="bo-mar-feld__hinweis">{p.hinweis}</span> : <span className="bo-mar-feld__hinweis">Vorschlag: erster Donnerstag, 18:00</span>}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
