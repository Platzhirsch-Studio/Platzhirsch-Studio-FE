"use client";
// Bewerberakte (Konzept § 5.6): Dokumentansicht ohne Klick (Lebenslauf zuerst), Sichtungsmodus mit Fußleiste
// (Strg/⌘+Enter = Gesichtet + nächste, Alt+↓ = Später), Primäraktion je Status, Absage-Dialog (Grund-Chips,
// Versandweg, Vorschau, 10 s Rückgängig, Serie mit Ausreißern), Bewertung (permlevel 1, Sterne als radiogroup),
// Datenschutz (Löschfrist mit Herkunft, Aufbewahrung verlängern mit Pflicht-Haken, sofort löschen mit Tippfeld).

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Knopf, { RundKnopf } from "../Knopf";
import Segment from "../Segment";
import BetragFeld from "../Eingabe/BetragFeld";
import Datumsfeld from "../Formular/Datumsfeld";
import { Haken } from "../motion";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { absageAction, bewerbungWorkflowAction, bewertungSpeichernAction, aufbewahrungAction, aufbewahrungZurueckAction, bewerberDatenLoeschenAction, bewerbungZuweisenAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { langDatum, plusTage } from "@/lib/backoffice/personal/zeit";
import { GespraechSheet, ErgebnisDialog } from "./Gespraeche";
import "./personal.css";
import { useWechsel } from "./hooks";

// --------------------------------------------------------------- Absage

/**
 * @param {{offen:boolean, onSchliessen:()=>void, bewerbungen:Array<{name, person, email?, sprache?, anrede?, stelle_titel?}>, absageText?:string,
 *   onGeplant?:()=>void, onVerworfen?:()=>void}} p
 */
export function AbsageDialog({ offen, onSchliessen, bewerbungen = [], absageText = "", onGeplant, onVerworfen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [grund, setGrund] = useState("Anderer Kandidat");
  const ohneMail = bewerbungen.some((b) => !b.email);
  const [weg, setWeg] = useState("E-Mail");
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => o && setWeg(bewerbungen.length === 1 && !bewerbungen[0]?.email ? "Post" : "E-Mail"));
  const serie = bewerbungen.length > 1;
  const b = bewerbungen[0] || {};
  const anrede = b.anrede === "Frau" ? `Sehr geehrte Frau ${b.nachname || ""},` : b.anrede === "Herr" ? `Sehr geehrter Herr ${b.nachname || ""},` : `Guten Tag ${b.person || ""},`;
  const ausreisser = bewerbungen.filter((x) => !x.email || (x.sprache && x.sprache !== "de"));
  const senden = () =>
    start(async () => {
      const r = await absageAction({ namen: bewerbungen.map((x) => x.name), grund, versand: weg });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      onGeplant?.();
      onSchliessen();
      starte(T.absage.wird, {
        token: r.token,
        ms: r.ms,
        objekt: r.objekt,
        fehlerText: T.absage.senden,
        onVerworfen,
        onFehler: onVerworfen,
        onErfolg: () => {
          zeige(serie ? `${bewerbungen.length} Absagen gesendet` : T.absage.gesendet(b.person, "in sieben Monaten"), { art: "ok", aktion: weg === "Post" ? { titel: T.absage.briefDrucken, onClick: () => router.push(`/druck/ph-bewerbung/${encodeURIComponent(b.name)}?format=${encodeURIComponent("PH Bewerbung Absage")}`) } : undefined });
          router.refresh();
        },
      });
    });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={serie ? T.absage.serieTitel(bewerbungen.length) : T.absage.titel(b.person || "")}
      groesse="lg"
      testid="per-absage-dialog"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>{T.abbrechen}</Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={senden} data-testid="per-absage-senden">{T.absage.senden}</Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="bo-per-feld">
          <span>{T.absage.grund}</span>
          <div className="bo-per-chips" role="radiogroup" aria-label={T.absage.grund}>
            {T.absage.gruende.map((g) => (
              <button key={g} type="button" role="radio" aria-checked={grund === g} className="bo-per-chip" onClick={() => setGrund(g)}>{g}</button>
            ))}
          </div>
        </div>
        <div className="bo-per-feld">
          <span>{T.absage.weg}</span>
          <Segment label={T.absage.weg} wert={weg} onWechsel={setWeg} optionen={T.absage.wege.map((w) => ({ wert: w, titel: w, deaktiviert: w === "E-Mail" && ohneMail && !serie }))} />
          {ohneMail && !serie && <span className="bo-per-feld__hilfe">{T.absage.ohneEmail}</span>}
        </div>
        {b.sprache && b.sprache !== "de" && !serie && <p className="bo-per-band-hinweis" data-ton="eiche">{T.absage.sprache}</p>}
        {serie && ausreisser.length > 0 && (
          <div className="bo-per-band-hinweis" data-ton="eiche">
            <span>{`${T.absage.ausreisser}: ${ausreisser.map((x) => x.person).join(", ")}`}</span>
          </div>
        )}
        {weg === "E-Mail" && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-bo-text-soft">{T.absage.vorschau}</p>
            <div className="bo-per-vorschau" data-testid="per-absage-vorschau">
              <p className="font-semibold">{T.absage.betreff(b.stelle_titel || "Initiativbewerbung")}</p>
              <p>{serie ? T.absage.anredeJe : anrede}</p>
              <div dangerouslySetInnerHTML={{ __html: String(absageText || "<p>vielen Dank für Ihre Bewerbung.</p>").replace(/<(?!\/?p>|br\s*\/?>)[^>]*>/g, "") }} />
              <p>Mit freundlichen Grüßen<br />Platzhirsch Home Living</p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// --------------------------------------------------------------- Dokument

/** Dokumentansicht: Reiter je Unterlage; im Testbetrieb ein ehrliches Beispielblatt statt einer Datei. */
export function DokumentAnsicht({ unterlagen = [], person, mock = true }) {
  const sortiert = useMemo(() => [...unterlagen].sort((a, b) => (a.art === "Lebenslauf" ? -1 : b.art === "Lebenslauf" ? 1 : 0)), [unterlagen]);
  const [aktiv, setAktiv] = useState(sortiert[0]?.name || null);
  const u = sortiert.find((x) => x.name === aktiv) || sortiert[0];
  if (!u)
    return (
      <div className="bo-per-dok__flaeche" data-testid="per-dokument-leer">
        <p className="max-w-xs text-center text-[14px] text-bo-text-soft">
          <Icon name="Paperclip" className="mx-auto mb-3 size-6" />
          {T.akte.keineUnterlagen}
        </p>
      </div>
    );
  const href = `/api/datei?url=${encodeURIComponent(u.datei)}`;
  return (
    <div className="bo-per-dok" data-testid="per-dokument">
      <div className="bo-per-dok__reiter" role="tablist" aria-label="Unterlagen">
        {sortiert.map((x) => (
          <button key={x.name} type="button" role="tab" aria-selected={x.name === u.name} className="bo-per-chip" data-aktiv={x.name === u.name ? "" : undefined} onClick={() => setAktiv(x.name)}>
            <Icon name="FileText" className="size-4" />
            {x.art}
          </button>
        ))}
      </div>
      <div className="bo-per-dok__flaeche" role="tabpanel">
        {mock ? (
          <>
            <div className="bo-per-papier" aria-label={`${u.art} ${person}`}>
              <h3>{person}</h3>
              <span className="text-[11px] text-bo-text-soft">{u.art}</span>
              <span className="bo-per-papier__abschnitt">Berufserfahrung</span>
              <span className="bo-per-papier__linie" />
              <span className="bo-per-papier__linie" data-mittel />
              <span className="bo-per-papier__linie" data-kurz />
              <span className="bo-per-papier__abschnitt">Ausbildung</span>
              <span className="bo-per-papier__linie" data-mittel />
              <span className="bo-per-papier__linie" data-kurz />
              <span className="bo-per-papier__abschnitt">Kenntnisse</span>
              <span className="bo-per-papier__linie" />
              <span className="bo-per-papier__linie" data-kurz />
            </div>
            <p className="bo-per-dok__hinweis bo-per-kennzeichen">{T.akte.vorschauTest}</p>
          </>
        ) : (
          <object data={href} type="application/pdf" className="h-[70vh] w-full rounded-2xl" aria-label={u.bezeichnung || u.art}>
            <a href={href} target="_blank" rel="noreferrer" className="bo-per-link">{T.akte.neuerTab}</a>
          </object>
        )}
        <div className="bo-per-dok__werkzeug">
          <RundKnopf icon="ArrowUpRight" label={T.akte.neuerTab} href={href} groesse="s" />
        </div>
      </div>
      <div className="bo-per-dok__info">
        <span>{u.bezeichnung || u.art}{u.groesse_kb ? ` · ${u.groesse_kb} kB` : ""}</span>
        <span>{T.akte.seite(1, 1)}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------- Aktionen

/**
 * Primär- und Nebenaktionen im Kopf der Bewerberakte.
 * @param {{b:object, rolle:string, primaer:{id:string}|null, personen:Array, heute:string, gespraechOffen:object|null,
 *   absageText:string, sichtung?:boolean}} p
 */
export function BewerberAktionen({ b, rolle, primaer, personen, heute, gespraechOffen, absageText, startGespraech = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [gespraech, setGespraech] = useState(startGespraech);
  const [absage, setAbsage] = useState(false);
  const [ergebnis, setErgebnis] = useState(false);
  const [, start] = useTransition();
  const leitung = rolle === "leitung";
  const darf = leitung || rolle === "sachbearbeitung";
  const person = `${b.vorname || ""} ${b.nachname || ""}`.trim();
  const wf = async (aktion, text) => {
    const r = await bewerbungWorkflowAction({ name: b.name, aktion });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    starte(text, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: aktion, onErfolg: () => start(() => router.refresh()) });
  };
  const P = T.akte.primaer;
  const primaerKnopf = (() => {
    if (!primaer) return null;
    switch (primaer.id) {
      case "gespraech":
        return <Knopf variant="primary" icon="CalendarPlus" onClick={() => setGespraech(true)} kuerzel="Strg+Enter" data-testid="per-primaer">{P.gespraech}</Knopf>;
      case "neuerTermin":
        return <Knopf variant="primary" icon="CalendarPlus" onClick={() => setGespraech(true)} data-testid="per-primaer">{P.neuerTermin}</Knopf>;
      case "ergebnis":
        return <Knopf variant="primary" onClick={() => setErgebnis(true)} data-testid="per-primaer">{P.ergebnis}</Knopf>;
      case "angebot":
        return <Knopf variant="primary" onClick={() => wf("Angebot erstellen", T.bewerbung.angebot(person))} data-testid="per-primaer">{P.angebot}</Knopf>;
      case "einstellen":
        return <Knopf variant="primary" icon="UserPlus" href={`/personal/bewerbungen/${encodeURIComponent(b.name)}?einstellen=1`} data-testid="per-primaer">{P.einstellen}</Knopf>;
      case "absagebrief":
        return <Knopf variant="primary" icon="Printer" href={`/druck/ph-bewerbung/${encodeURIComponent(b.name)}?format=${encodeURIComponent("PH Bewerbung Absage")}`} data-testid="per-primaer">{P.absagebrief}</Knopf>;
      case "personalakte":
        return <Knopf variant="primary" href={`/personal/mitarbeiter/${encodeURIComponent(b.mitarbeiter)}`} data-testid="per-primaer">{P.personalakte}</Knopf>;
      default:
        return null;
    }
  })();
  const offen = ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"].includes(b.status);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="per-akte-aktionen">
      {b.status === "Eingegangen" && darf && <Knopf variant="secondary" icon="Check" onClick={() => wf("Sichten", T.bewerbung.gesichtet(person))} data-testid="per-gesichtet">{T.akte.gesichtetKnopf}</Knopf>}
      {offen && leitung && <Knopf variant="secondary" onClick={() => setAbsage(true)} data-testid="per-absage-oeffnen">{T.akte.absage}</Knopf>}
      {b.status === "Angebot" && !leitung && <span className="text-[12px] text-bo-text-faint">{T.akte.einstellenNurLeitung}</span>}
      <Menue
        label="Weitere Aktionen"
        platzierung="unten-ende"
        ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Weitere Aktionen" testid="per-akte-menue" />}
      >
        {offen && darf && <MenuePunkt icon="Undo2" onWaehlen={() => wf("Zurückziehen", T.bewerbung.zurueckgezogen(person))}>{T.akte.menue.zurueckziehen}</MenuePunkt>}
        {darf && (
          <MenuePunkt
            icon="UserPlus"
            onWaehlen={async () => {
              const r = await bewerbungZuweisenAction({ name: b.name, user: personen[0]?.wert === b.zugewiesen_an ? personen[1]?.wert : personen.find((p) => p.wert !== b.zugewiesen_an)?.wert });
              if (!r.ok) return zeige(r.message, { art: "fehler" });
              zeige(T.bewerbung.zugewiesen(""), { art: "ok", aktion: { titel: T.zeiten.rueck, onClick: async () => { await bewerbungZuweisenAction({ name: b.name, user: r.alt }); router.refresh(); } } });
              router.refresh();
            }}
          >
            {T.akte.menue.zuweisen}
          </MenuePunkt>
        )}
        <MenuePunkt icon="Printer" href={`/druck/ph-bewerbung/${encodeURIComponent(b.name)}?format=${encodeURIComponent("PH Bewerbung Deckblatt")}`}>{T.akte.menue.blatt}</MenuePunkt>
        {b.status === "Abgesagt" && <MenuePunkt icon="Printer" href={`/druck/ph-bewerbung/${encodeURIComponent(b.name)}?format=${encodeURIComponent("PH Bewerbung Absage")}`}>{T.akte.menue.brief}</MenuePunkt>}
        {b.email && <MenuePunkt icon="Mail" href={`mailto:${b.email}`}>{T.akte.menue.mail}</MenuePunkt>}
        {["Abgesagt", "Zurueckgezogen"].includes(b.status) && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="RotateCcw" deaktiviert={!leitung} grund={!leitung ? T.bewerbung.nurLeitung : undefined} onWaehlen={() => wf("Zurück auf Gesichtet", T.bewerbung.zurueck(person))}>{T.akte.menue.zurueck}</MenuePunkt>
          </>
        )}
      </Menue>
      {primaerKnopf}
      <GespraechSheet offen={gespraech} onSchliessen={() => setGespraech(false)} bewerbung={{ name: b.name, person }} personen={personen} standardFuehrung={b.zugewiesen_an || personen[0]?.wert} heute={heute} />
      <AbsageDialog offen={absage} onSchliessen={() => setAbsage(false)} bewerbungen={[{ ...b, person }]} absageText={absageText} />
      <ErgebnisDialog offen={ergebnis} onSchliessen={() => setErgebnis(false)} gespraech={gespraechOffen ? { ...gespraechOffen, bewerber: person } : null} leitung={leitung} />
    </div>
  );
}

/** Sichtungsmodus: Fußleiste „2 von 3 · Absage … · Später · Gesichtet →“, Strg/⌘+Enter und Alt+↓. */
export function Sichtungsleiste({ b, folge, rolle }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const i = folge.indexOf(b.name);
  const naechste = folge.slice(i + 1).concat(folge.slice(0, Math.max(0, i))).find((n) => n !== b.name) || null;
  const weiter = () => router.push(naechste ? `/personal/bewerbungen/${encodeURIComponent(naechste)}?modus=sichten` : "/personal/bewerbungen?gesichtet=1");
  const gesichtet = async () => {
    const r = await bewerbungWorkflowAction({ name: b.name, aktion: "Sichten" });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    starte(T.bewerbung.gesichtet(`${b.vorname} ${b.nachname}`), { token: r.token, ms: r.ms, objekt: r.objekt, gruppe: "personal.sichten", sammel: (n) => T.bewerbung.gesichtet(`${n} Bewerbungen`) });
    weiter();
  };
  useEffect(() => {
    const f = (e) => {
      if (e.target.closest?.("input, textarea, select, dialog")) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        gesichtet();
      }
      if (e.altKey && e.key === "ArrowDown") {
        e.preventDefault();
        weiter();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  if (b.status !== "Eingegangen" || !(rolle === "leitung" || rolle === "sachbearbeitung")) return null;
  return (
    <div className="bo-per-sichtung bo-material-stark" role="toolbar" aria-label="Sichtung" data-testid="per-sichtungsleiste">
      <span className="bo-per-sichtung__n">{`${Math.max(1, i + 1)} von ${folge.length}`}</span>
      <Knopf variant="ghost" onClick={weiter} kuerzel="Alt+↓">Später</Knopf>
      <Knopf variant="primary" iconRechts="ArrowRight" onClick={gesichtet} kuerzel="Strg+Enter" data-testid="per-sichten-weiter">{T.akte.gesichtetKnopf}</Knopf>
    </div>
  );
}

/** Ende des Sichtungsmodus: „Alles gesichtet“. */
export function AllesGesichtet() {
  return (
    <div className="bo-per-ergebnis mb-6" role="status" data-testid="per-alles-gesichtet">
      <Haken groesse={26} />
      <span>Alles gesichtet</span>
    </div>
  );
}

// -------------------------------------------------------------- Bewertung

export function BewertungTab({ b, darf }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [sterne, setSterne] = useState(Math.round((Number(b.bewertung) || 0) * 5));
  const [eindruck, setEindruck] = useState(b.eindruck || "");
  const [gehalt, setGehalt] = useState(Number(b.gehaltsvorstellung_cent) || null);
  const [notiz, setNotiz] = useState(b.notiz_intern || "");
  const [laeuft, start] = useTransition();
  const id = useId();
  const speichern = () =>
    start(async () => {
      const r = await bewertungSpeichernAction({ name: b.name, bewertung: sterne / 5, eindruck, gehaltsvorstellung_cent: gehalt || 0, notiz_intern: notiz });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige(T.akte.gespeichert, { art: "ok" });
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-5" data-testid="per-bewertung">
      <p className="bo-per-band-hinweis"><Icon name="Lock" className="mt-0.5 size-4 flex-none" />{T.akte.bewertungBand}</p>
      <div className="bo-per-feld">
        <span id={`${id}-s`}>Bewertung</span>
        <div className="bo-per-sterne" role="radiogroup" aria-labelledby={`${id}-s`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={sterne === n} aria-label={T.akte.sterne(n)} className="bo-per-stern" data-an={n <= sterne ? "" : undefined} disabled={!darf} tabIndex={sterne === n || (!sterne && n === 1) ? 0 : -1} onClick={() => setSterne(n)} onKeyDown={(e) => { if (e.key === "ArrowRight") setSterne(Math.min(5, sterne + 1)); if (e.key === "ArrowLeft") setSterne(Math.max(1, sterne - 1)); if (/^[1-5]$/.test(e.key)) setSterne(Number(e.key)); }}>
              <Icon name="Star" className="size-5" fill={n <= sterne ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <span className="bo-per-feld__hilfe">{T.akte.sterne(sterne)}</span>
      </div>
      <label className="bo-per-feld"><span>{T.akte.eindruck}</span><textarea className="bo-per-auswahl bo-per-text" value={eindruck} onChange={(e) => setEindruck(e.target.value)} disabled={!darf} /><span className="bo-per-feld__hilfe">{T.akte.bewertungHilfe}</span></label>
      <div className="bo-per-feld max-w-xs"><span>{T.akte.gehalt}</span><BetragFeld value={gehalt} onChange={setGehalt} disabled={!darf} /></div>
      <label className="bo-per-feld"><span>{T.akte.notiz}</span><textarea className="bo-per-auswahl bo-per-text" value={notiz} onChange={(e) => setNotiz(e.target.value)} disabled={!darf} /><span className="bo-per-feld__hilfe">{T.akte.bewertungHilfe}</span></label>
      {darf && <div><Knopf variant="primary" laedt={laeuft} onClick={speichern} kuerzel="Strg+S">{T.speichern}</Knopf></div>}
    </div>
  );
}

// ------------------------------------------------------------- Datenschutz

export function DatenschutzTab({ b, frist, monate, leitung, heute }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [verl, setVerl] = useState(false);
  const [loeschen, setLoeschen] = useState(false);
  const [bis, setBis] = useState(plusTage(heute, 365));
  const [ok, setOk] = useState(false);
  const [tipp, setTipp] = useState("");
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  const offen = ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"].includes(b.status);
  const person = `${b.vorname || ""} ${b.nachname || ""}`.trim();
  return (
    <div className="flex flex-col gap-5" data-testid="per-datenschutz">
      <div className="bo-per-frist" data-warn={frist?.warnung ? "" : undefined}>
        <span className="text-[13px] font-medium text-bo-text-soft">{T.akte.loeschfrist}</span>
        {frist?.datum ? (
          <>
            <span className="bo-per-frist__datum">{langDatum(frist.datum)}</span>
            <span className="bo-per-frist__rest">{T.akte.restTage(frist.rest)}</span>
            <span className="text-[12px] text-bo-text-faint">{frist.aufbewahrung ? `${T.akte.evidenz} bis ${langDatum(b.einwilligung_evidenz_bis)}` : T.akte.herkunft(langDatum(String(b.entschieden_am).slice(0, 10)), monate)}</span>
          </>
        ) : (
          <span className="bo-per-frist__rest">{T.akte.loeschfristOffen}</span>
        )}
      </div>
      <dl className="bo-per-fakten">
        <div><dt>{T.akte.datenschutzInfo}</dt><dd>{b.datenschutzinfo_am ? `${langDatum(String(b.datenschutzinfo_am).slice(0, 10))} · ${b.datenschutzinfo_art || "–"}` : "–"}</dd></div>
        <div><dt>{T.akte.evidenz}</dt><dd>{Number(b.einwilligung_evidenz) ? `bis ${langDatum(b.einwilligung_evidenz_bis)}` : "nein"}</dd></div>
      </dl>
      {leitung && (
        <div className="flex flex-wrap gap-2">
          <Knopf variant="secondary" onClick={() => setVerl(true)} data-testid="per-aufbewahrung">{T.akte.verlaengern}</Knopf>
          <Knopf variant="danger" disabled={offen} grund={offen ? T.akte.loeschenOffen : undefined} onClick={() => setLoeschen(true)} data-testid="per-sofort-loeschen">{T.akte.sofortLoeschen}</Knopf>
        </div>
      )}
      <Dialog
        offen={verl}
        onSchliessen={() => setVerl(false)}
        titel={T.akte.verlaengern}
        text={T.akte.verlaengernHilfe}
        fuss={
          <>
            <Knopf variant="ghost" onClick={() => setVerl(false)}>{T.abbrechen}</Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={!ok} onClick={() => start(async () => {
              const r = await aufbewahrungAction({ name: b.name, bis, bestaetigt: ok });
              if (!r.ok) return setFehler(r.message);
              setVerl(false);
              zeige(T.akte.verlaengert(langDatum(bis)), { art: "ok", aktion: { titel: T.zeiten.rueck, onClick: async () => { await aufbewahrungZurueckAction({ name: b.name, alt: r.alt }); router.refresh(); } } });
              router.refresh();
            })} data-testid="per-aufbewahrung-senden">{T.speichern}</Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bo-per-feld"><span>{T.akte.verlaengernBis}</span><Datumsfeld value={bis} onChange={setBis} aria-label={T.akte.verlaengernBis} invalid={Boolean(fehler)} />{fehler && <span className="bo-per-feld__fehler">{fehler}</span>}</div>
          <label className="bo-per-check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /><span>{T.akte.verlaengernCheck}</span></label>
        </div>
      </Dialog>
      <Dialog
        offen={loeschen}
        onSchliessen={() => setLoeschen(false)}
        titel={T.akte.loeschenTitel(person)}
        rolle="alertdialog"
        sperren={laeuft}
        fuss={
          <>
            <Knopf variant="ghost" onClick={() => setLoeschen(false)} autoFocus>{T.abbrechen}</Knopf>
            <Knopf variant="danger-solid" laedt={laeuft} disabled={tipp.trim().toLowerCase() !== "löschen"} onClick={() => start(async () => {
              const r = await bewerberDatenLoeschenAction({ namen: [b.name], bestaetigung: tipp });
              if (!r.ok) return setFehler(r.message);
              setLoeschen(false);
              zeige(T.akte.geloeschtToast, { art: "ok" });
              router.refresh();
            })} data-testid="per-loeschen-senden">{T.akte.loeschenKnopf}</Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ul className="list-disc pl-5 text-[14px] leading-6 text-bo-text-soft">{T.akte.loeschenListe.map((x) => <li key={x}>{x}</li>)}</ul>
          <label className="bo-per-feld"><span>{T.akte.tippe}</span><input className="bo-per-auswahl" value={tipp} onChange={(e) => setTipp(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} data-testid="per-loeschen-tipp" /></label>
          {fehler && <span className="bo-per-feld__fehler">{fehler}</span>}
        </div>
      </Dialog>
    </div>
  );
}
