"use client";
// Demo „Grundbausteine“ (Team P0-2, Fundament v2 im Lounge-Stil) für
// /einstellungen?tab=system&baustein=grundbausteine – nur Admin, nur Mock (Prüfung im
// demo-register). Zeigt Token (hell/dunkel, Material), Kachel/Bento/Akzentkachel, Knopf,
// Rundknopf, Pfeil-Knopf, Status-Pille, Material-Pille, Avatar + Reihe, Schalter, Kennzahl
// (Hochzählen), Segment (gleitender Indikator), Leer, Fehler, Charts und die Dichte-Umschaltung.
// Alle Zahlen und Namen sind Beispielwerte (Mock), als solche gekennzeichnet.

import { useState } from "react";
import Knopf, { KNOPF_GROESSEN, PfeilKnopf, RundKnopf } from "../Knopf";
import StatusBadge, { MATERIALIEN, Pille, TOENE } from "../StatusBadge";
import Kennzahl from "../Kennzahl";
import Leer from "../Leer";
import Fehler from "../Fehler";
import Segment, { DichteSchalter } from "../Segment";
import Schalter from "../Schalter";
import Avatar, { AvatarReihe } from "../Avatar";
import Kachel, { Akzentkachel, Bento } from "../Kachel";
import { Balken, ChartSkeleton, Donut, KeineDaten, Linie, Sparkline } from "../Charts";
import { Icon } from "../icons";
import cx from "../cx";

const TEXTE = {
  marke: "Baustein · P0-2",
  titel: "Grundbausteine",
  einleitung: "Token und Bausteine des Fundaments im Lounge-Stil, in allen Zuständen. Alle Zahlen und Namen sind Beispielwerte.",
  inhalt: "Inhalt",
  abschnitte: {
    lounge: "Lounge",
    token: "Token",
    dichte: "Dichte",
    knopf: "Knöpfe",
    status: "Status und Pillen",
    avatar: "Avatare",
    schalter: "Schalter",
    kennzahl: "Kennzahl",
    segment: "Segment",
    leer: "Leer",
    fehler: "Fehler",
    charts: "Charts",
  },
  dichteText: "Wirkt sofort auf Knöpfe, Eingaben, Segmente und Kacheln dieser Seite. Kiosk-Bereiche sind fix.",
  kioskProbe: "Kiosk-Dichte (fix)",
  kompaktProbe: "Kompakt erzwungen",
  eingabe: "Eingabe",
  laden: "Laden zeigen",
  speichern: "Speichern",
  verwerfen: "Verwerfen",
  loeschen: "Löschen",
  stornieren: "Stornieren",
  mehr: "Mehr",
  hilfe: "Hilfe",
  drucken: "Drucken",
  oeffnen: "In Liste öffnen",
  gesperrt: "Rechnung stellen",
  grund: "Noch nicht verfügbar – Rechnung im Frappe-Desk stellen",
  wertAendern: "Wert ändern",
  grosserSprung: "Großer Sprung",
  status: ["Entwurf", "Neu", "Qualifiziert", "In Arbeit", "Bezahlt", "Storniert", "Training"],
  materialien: { stein: "Ruhend", cognac: "Neu", eiche: "Bestellung", salbei: "Montage", messing: "Angebot", see: "Planung", nuss: "Werkstatt", travertin: "Muster" },
  heute: { titel: "Heute", unter: "Beispieltermine", aktiv: "Präsentation 3D-Planung Küche", zeit: "Zeit", ort: "Ort", zeitWert: "10:00 – 11:30", ortWert: "Küchenwelt", starten: "Beratung starten", verschieben: "Verschieben" },
  wartet: { titel: "Braucht deine Antwort", zitat: "Angebot Outdoor-Lounge liegt seit sechs Tagen offen – die Kundin hat gestern zweimal angerufen.", von: "Beispiel · Verkauf" },
  akzent1: { titel: "Neu seit gestern", text: "Anfragen warten auf den Erstkontakt." },
  akzent2: { titel: "Diese Woche", text: "Montagen, alle Teams bestätigt." },
  werkzeuge: { suche: "Suchen", glocke: "Benachrichtigungen", neu: "Neu anlegen", filter: "Filter", kalender: "Kalender", teilen: "Teilen" },
  schalter: {
    beleg: "Beleg per E-Mail senden",
    belegText: "Die Kundin bekommt den Beleg an die hinterlegte Adresse.",
    anrede: "Vorname am Kundendisplay",
    druck: "Bon drucken",
    gesperrt: "Kassenlade öffnen",
    gesperrtText: "Nur an der Kassa möglich.",
    klein: "Kompakter Schalter",
    gewaehlt: (an) => (an ? "an" : "aus"),
  },
  avatarText: "Initialen im Materialverlauf, nie Fotos. Gleiche Person, gleiche Farbe.",
  segmentText: "iOS-Vorbild: Kapsel, gleitender Indikator mit Feder, Zähler gedimmt.",
};

const TEAM = ["Lena Moosbrugger", "Sarah Bösch", "Theresa Rhomberg", "Jonas Fink", "Markus Gmeiner", "David Natter"];

const BEISPIEL_WOCHEN = [
  { label: "KW 38", wert: 6 },
  { label: "KW 39", wert: 9 },
  { label: "KW 40", wert: 7 },
  { label: "KW 41", wert: 12 },
  { label: "KW 42", wert: 10 },
  { label: "KW 43", wert: 14 },
  { label: "KW 44", wert: 11 },
  { label: "KW 45", wert: 8 },
];
const BEISPIEL_UMSATZ = [
  { label: "Jun", wert: 152 },
  { label: "Jul", wert: 148 },
  { label: "Aug", wert: 121 },
  { label: "Sep", wert: 196 },
  { label: "Okt", wert: 214 },
  { label: "Nov", wert: 88 },
];
const BEISPIEL_MONATE = ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"].map((m, i) => ({ label: m, wert: [120, 140, 135, 160, 180, 150, 130, 145, 170, 190, 175, 200][i] * 10000 }));
const BEISPIEL_VORJAHR = BEISPIEL_MONATE.map((p, i) => ({ label: p.label, wert: [100, 120, 130, 125, 150, 140, 120, 130, 150, 160, 150, 170][i] * 10000 }));
const BEISPIEL_SALDO = [
  { label: "Jul", wert: 400000 },
  { label: "Aug", wert: -150000 },
  { label: "Sep", wert: 250000 },
  { label: "Okt", wert: -50000 },
  { label: "Nov", wert: 300000 },
];
const BEISPIEL_ANTEILE = [
  { label: "Küche", wert: 42 },
  { label: "Wohnen", wert: 27 },
  { label: "Schlafen", wert: 14 },
  { label: "Bad", wert: 9 },
  { label: "Outdoor", wert: 5 },
  { label: "Sonstiges", wert: 3 },
];

const FLAECHEN = [
  ["bo-bg", "bg-bo-bg"],
  ["bo-surface", "bg-bo-surface"],
  ["bo-surface-2", "bg-bo-surface-2"],
  ["bo-surface-3", "bg-bo-surface-3"],
  ["bo-fill-2", "bg-bo-fill-2"],
  ["bo-action", "bg-bo-action"],
  ["bo-accent", "bg-bo-accent"],
  ["bo-overlay", "bg-bo-overlay"],
];
const SCHATTEN = ["--bo-sh-btn", "--bo-sh-card", "--bo-sh-tile", "--bo-sh-lift", "--bo-sh-float"];
const CHART_TOKEN = ["--color-chart-1", "--color-chart-2", "--color-chart-3", "--color-chart-4", "--color-chart-5"];
const SEQ_TOKEN = ["--color-chart-seq-1", "--color-chart-seq-2", "--color-chart-seq-3", "--color-chart-seq-4", "--color-chart-seq-5"];

function Abschnitt({ id, titel, text, children, className }) {
  return (
    <section id={id} aria-labelledby={`${id}-titel`} className={cx("scroll-mt-24", className)} data-testid={`demo-${id}`}>
      <h2 id={`${id}-titel`} className="bo-titel">
        {titel}
      </h2>
      {text && <p className="mt-1 max-w-2xl text-sm text-bo-text-soft">{text}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Zeile({ children, className }) {
  return <div className={cx("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

export default function GrundbausteineDemo() {
  const [laedt, setLaedt] = useState(false);
  const [offen, setOffen] = useState(12);
  const [umsatz, setUmsatz] = useState(4823000);
  const [ansicht, setAnsicht] = useState("netto");
  const [zeitraum, setZeitraum] = useState("monat");
  const [filter, setFilter] = useState("alle");
  const [schluessel, setSchluessel] = useState(0);
  const [beleg, setBeleg] = useState(true);
  const [anrede, setAnrede] = useState(false);

  return (
    <div className="space-y-14 pb-10" data-testid="demo-grundbausteine">
      <header>
        <p className="text-[13px] font-medium text-bo-text-soft">{TEXTE.marke}</p>
        <h1 className="bo-titel-gross mt-1">{TEXTE.titel}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
        <nav aria-label={TEXTE.inhalt} className="mt-5 flex flex-wrap gap-2">
          {Object.entries(TEXTE.abschnitte).map(([id, t]) => (
            <a key={id} href={`#${id}`} className="bo-knopf inline-flex h-8 items-center rounded-pill bg-bo-fill-2 px-3.5 text-[13px] font-medium text-bo-text-soft hover:bg-bo-surface hover:text-bo-text">
              {t}
            </a>
          ))}
        </nav>
      </header>

      <Abschnitt id="lounge" titel={TEXTE.abschnitte.lounge}>
        <Bento>
          <Kachel
            className="md:col-span-6 xl:col-span-3 xl:row-span-2"
            dicht
            titel={TEXTE.heute.titel}
            unter={TEXTE.heute.unter}
            werkzeuge={<RundKnopf icon="Plus" label={TEXTE.werkzeuge.neu} groesse="s" />}
          >
            <Kachel as="div" eingelassen dicht className="gap-4">
              <div className="flex items-center gap-3">
                <Avatar name="Familie Brändle" kuerzel="FB" material="travertin" groesse={44} />
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold leading-[22px] tracking-[-0.012em]">Familie Brändle</p>
                  <p className="text-[13px] font-medium leading-[18px] text-bo-cognac-text">{TEXTE.heute.aktiv}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-bo-text-soft">{TEXTE.heute.zeit}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold">{TEXTE.heute.zeitWert}</dd>
                </div>
                <div>
                  <dt className="text-xs text-bo-text-soft">{TEXTE.heute.ort}</dt>
                  <dd className="mt-0.5 text-[15px] font-semibold">{TEXTE.heute.ortWert}</dd>
                </div>
              </dl>
              <div className="flex items-center gap-2">
                <Knopf variant="primary" size="l" icon="Play">
                  {TEXTE.heute.starten}
                </Knopf>
                <RundKnopf icon="Clock" label={TEXTE.heute.verschieben} groesse="s" />
              </div>
            </Kachel>
            <ul className="mt-3 space-y-2">
              {[
                ["Dr. Miriam Köhler", "Beratung Wohnen", "12:00", "text-bo-cognac-text"],
                ["Hotel Seeblick, Lindau", "Objekt · Bemusterung", "14:00", "text-bo-see-text"],
                ["Familie Nägele", "Abnahme Bad", "17:15", "text-bo-salbei-text"],
              ].map(([n, a, z, m]) => (
                <li key={n} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-surface-2 px-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium leading-5">{n}</span>
                    <span className={cx("block text-[13px] leading-[18px]", m)}>{a}</span>
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums">{z}</span>
                </li>
              ))}
            </ul>
          </Kachel>

          <Kachel className="md:col-span-6 xl:col-span-5" titel={TEXTE.wartet.titel} href="#lounge" oeffnenLabel="Angebot öffnen" fuss={<AvatarReihe personen={TEAM.slice(0, 3)} mehr={2} />}>
            <blockquote className="max-w-[34ch] border-l-2 border-bo-text pl-4 text-xl leading-7 tracking-[-0.016em]">{TEXTE.wartet.zitat}</blockquote>
            <p className="ml-[18px] mt-3 text-[13px] text-bo-text-soft">{TEXTE.wartet.von}</p>
          </Kachel>

          <Akzentkachel className="col-span-6 md:col-span-3 xl:col-span-2" ton="cognac" titel={TEXTE.akzent1.titel} text={TEXTE.akzent1.text} zahl={7} href="#lounge" />
          <Akzentkachel className="col-span-6 md:col-span-3 xl:col-span-2" ton="salbei" titel={TEXTE.akzent2.titel} text={TEXTE.akzent2.text} zahl={4} href="#lounge" />

          <Kennzahl className="md:col-span-6 xl:col-span-2" titel="Offene Angebote" wert={18640000} format="cent-rund" trend={{ richtung: "auf", text: "+12 % ggü. Vorjahr" }} href="#lounge" />
          <Kennzahl className="md:col-span-6 xl:col-span-3" titel="Abschlussquote" wert={32} einheit="%" zusatz="53 Vorgänge offen" />
          <Balken className="md:col-span-6 xl:col-span-4" titel="Umsatz" untertitel="Netto je Monat, in T€ (Beispielwerte)" punkte={BEISPIEL_UMSATZ} hervorheben={4} laufend="letzter" hoehe={150} testid="demo-balken-lounge" />
        </Bento>
      </Abschnitt>

      <Abschnitt id="token" titel={TEXTE.abschnitte.token}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Kachel titel="Flächen und Rollen" unter="Kalk · Kachel · eingelassen · Tinte · Cognac">
            <div className="grid grid-cols-4 gap-3">
              {FLAECHEN.map(([name, klasse]) => (
                <div key={name} className="min-w-0">
                  <div className={cx("h-14 rounded-bo-zeile shadow-[inset_0_0_0_var(--bo-hair)_var(--color-bo-line)]", klasse)} />
                  <p className="mt-1.5 truncate font-mono text-[11px] text-bo-text-soft">{name}</p>
                </div>
              ))}
            </div>
          </Kachel>
          <Kachel titel="Schatten und Material" unter="Knopf · Karte · Kachel · Lift · Float">
            <div className="grid grid-cols-5 gap-4 rounded-bo-karte bg-bo-bg p-5">
              {SCHATTEN.map((s) => (
                <div key={s} className="min-w-0 text-center">
                  <div className="mx-auto h-14 w-full rounded-bo-karte bg-bo-surface" style={{ boxShadow: `var(${s})` }} />
                  <p className="mt-2 truncate font-mono text-[11px] text-bo-text-soft">{s.replace("--bo-sh-", "")}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-[11px] text-bo-text-soft">
              <span className="flex items-center gap-1.5">
                {CHART_TOKEN.map((t) => (
                  <span key={t} aria-hidden="true" className="size-5 rounded-pill" style={{ background: `var(${t})` }} />
                ))}
                <span className="ml-1 font-mono">chart-1…5</span>
              </span>
              <span className="flex items-center gap-0.5">
                {SEQ_TOKEN.map((t) => (
                  <span key={t} aria-hidden="true" className="h-5 w-6 first:rounded-l-pill last:rounded-r-pill" style={{ background: `var(${t})` }} />
                ))}
                <span className="ml-2 font-mono">chart-seq-1…5</span>
              </span>
            </div>
          </Kachel>
        </div>
      </Abschnitt>

      <Abschnitt id="dichte" titel={TEXTE.abschnitte.dichte} text={TEXTE.dichteText}>
        <DichteSchalter mitHinweis />
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            ["kompakt", TEXTE.kompaktProbe],
            ["kiosk", TEXTE.kioskProbe],
          ].map(([d, t]) => (
            <div key={d} data-dichte={d} className="bo-kachel">
              <p className="mb-3 text-[13px] text-bo-text-soft">{t}</p>
              <Zeile>
                <input className="bo-input w-40" aria-label={`${TEXTE.eingabe} ${t}`} defaultValue="AN-2026-0012" />
                <Knopf variant="primary" icon="Check">
                  {TEXTE.speichern}
                </Knopf>
                <Knopf icon="Ellipsis" label={TEXTE.mehr} />
                <RundKnopf icon="Search" label={TEXTE.werkzeuge.suche} />
              </Zeile>
            </div>
          ))}
        </div>
      </Abschnitt>

      <Abschnitt id="knopf" titel={TEXTE.abschnitte.knopf}>
        <Kachel>
          <div className="space-y-5">
            <Zeile>
              <Knopf variant="primary" icon="Plus" kuerzel="Strg+S">
                {TEXTE.speichern}
              </Knopf>
              <Knopf>{TEXTE.verwerfen}</Knopf>
              <Knopf variant="ghost" icon="Printer">
                {TEXTE.drucken}
              </Knopf>
              <Knopf variant="danger" icon="Trash2">
                {TEXTE.loeschen}
              </Knopf>
              <Knopf variant="danger-solid">{TEXTE.stornieren}</Knopf>
              <Knopf variant="link" iconRechts="ArrowUpRight" href="#knopf">
                {TEXTE.oeffnen}
              </Knopf>
            </Zeile>
            <Zeile>
              {KNOPF_GROESSEN.map((g) => (
                <Knopf key={g} size={g} icon="Plus">
                  {`Größe ${g}`}
                </Knopf>
              ))}
            </Zeile>
            <Zeile>
              <RundKnopf icon="Search" label={TEXTE.werkzeuge.suche} kuerzel="Strg+K" />
              <RundKnopf icon="Bell" label={TEXTE.werkzeuge.glocke} badge={3} />
              <RundKnopf icon="Inbox" label="Anfragen" badge />
              <RundKnopf icon="Plus" label={TEXTE.werkzeuge.neu} />
              <RundKnopf icon="SlidersHorizontal" label={TEXTE.werkzeuge.filter} aktiv umschalter />
              <RundKnopf icon="Calendar" label={TEXTE.werkzeuge.kalender} groesse="s" />
              <RundKnopf icon="Share2" label={TEXTE.werkzeuge.teilen} flach />
              <PfeilKnopf href="#knopf" label="Beispiel öffnen" />
              <span className="inline-flex rounded-pill bg-[image:var(--bo-ak-cognac)] p-2">
                <PfeilKnopf label="Auf Cognac öffnen" hell />
              </span>
            </Zeile>
            <Zeile>
              <Knopf icon="Pencil" label="Bearbeiten" kuerzel="E" />
              <Knopf variant="ghost" icon="Ellipsis" label={TEXTE.mehr} />
              <Knopf variant="ghost" size="s" icon="Keyboard" label={TEXTE.hilfe} />
              <Knopf variant="primary" laedt={laedt} icon="Check" onClick={() => setLaedt((v) => !v)} data-testid="demo-knopf-laedt">
                {TEXTE.speichern}
              </Knopf>
              <Knopf laedt={laedt}>{TEXTE.verwerfen}</Knopf>
              <Knopf variant="ghost" onClick={() => setLaedt((v) => !v)}>
                {TEXTE.laden}
              </Knopf>
            </Zeile>
            <Zeile className="items-start">
              <Knopf variant="primary" disabled grund={TEXTE.grund} icon="FileText">
                {TEXTE.gesperrt}
              </Knopf>
              <Knopf disabled>{TEXTE.verwerfen}</Knopf>
              <Knopf href="#knopf" disabled>
                {TEXTE.oeffnen}
              </Knopf>
            </Zeile>
          </div>
        </Kachel>
      </Abschnitt>

      <Abschnitt id="status" titel={TEXTE.abschnitte.status}>
        <Kachel>
          <Zeile>
            {TOENE.map((t, i) => (
              <StatusBadge key={t} ton={t} wert={TEXTE.status[i]} />
            ))}
          </Zeile>
          <Zeile className="mt-3">
            {TOENE.map((t, i) => (
              <StatusBadge key={t} ton={t} wert={TEXTE.status[i]} groesse="xs" />
            ))}
          </Zeile>
          <Zeile className="mt-3">
            <StatusBadge ton="gruen" wert="Bezahlt" gebucht />
            <StatusBadge ton="rot" wert="Storniert" storniert />
            <StatusBadge ton="orange" wert="Gemahnt" text="Gemahnt · Stufe 2" />
            <StatusBadge ton="tuerkis" wert="Geprueft" />
            <StatusBadge wert="" />
          </Zeile>
          <Zeile className="mt-5">
            {MATERIALIEN.map((m) => (
              <Pille key={m} material={m}>
                {TEXTE.materialien[m]}
              </Pille>
            ))}
          </Zeile>
        </Kachel>
      </Abschnitt>

      <Abschnitt id="avatar" titel={TEXTE.abschnitte.avatar} text={TEXTE.avatarText}>
        <Kachel>
          <Zeile className="gap-4">
            {TEAM.map((n) => (
              <Avatar key={n} name={n} groesse={40} />
            ))}
            <Avatar name="Familie Brändle" kuerzel="FB" material="travertin" groesse={56} />
          </Zeile>
          <Zeile className="mt-5 gap-8">
            <AvatarReihe personen={TEAM.slice(0, 4)} />
            <AvatarReihe personen={TEAM} max={3} groesse={32} />
            <AvatarReihe personen={TEAM.slice(0, 2)} groesse={24} />
          </Zeile>
        </Kachel>
      </Abschnitt>

      <Abschnitt id="schalter" titel={TEXTE.abschnitte.schalter}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bo-material-stark rounded-bo-fenster px-5 py-2">
            <div className="divide-y divide-bo-line">
              <Schalter label={TEXTE.schalter.beleg} beschreibung={TEXTE.schalter.belegText} an={beleg} onWechsel={setBeleg} testid="demo-schalter-beleg" />
              <Schalter label={TEXTE.schalter.anrede} an={anrede} onWechsel={setAnrede} />
              <Schalter label={TEXTE.schalter.druck} standard />
              <Schalter label={TEXTE.schalter.gesperrt} beschreibung={TEXTE.schalter.gesperrtText} deaktiviert />
            </div>
          </div>
          <Kachel>
            <Zeile className="gap-6">
              <Schalter label={TEXTE.schalter.klein} zeile={false} groesse="s" standard />
              <Schalter label={TEXTE.schalter.klein} zeile={false} groesse="s" />
              <span className="text-[13px] text-bo-text-soft">{`${TEXTE.schalter.beleg}: ${TEXTE.schalter.gewaehlt(beleg)}`}</span>
            </Zeile>
          </Kachel>
        </div>
      </Abschnitt>

      <Abschnitt id="kennzahl" titel={TEXTE.abschnitte.kennzahl}>
        <Zeile className="mb-4">
          <Knopf size="s" onClick={() => setOffen((v) => v + 3)} data-testid="demo-zahl-plus">
            {TEXTE.wertAendern}
          </Knopf>
          <Knopf size="s" onClick={() => setUmsatz((v) => v + 125050)}>
            {`${TEXTE.wertAendern} (€)`}
          </Knopf>
          <Knopf size="s" variant="ghost" onClick={() => setOffen((v) => (v > 50000 ? 12 : v + 80000))}>
            {TEXTE.grosserSprung}
          </Knopf>
        </Zeile>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
          <Kennzahl titel="Offene Anfragen" wert={offen} href="#kennzahl" trend={{ richtung: "auf", text: "3 zur Vorwoche", gut: "neutral" }} testid="demo-kennzahl-offen" />
          <Kennzahl titel="Umsatz bezahlt" wert={umsatz} format="cent" trend={{ richtung: "auf", text: "4,2 % zum Vormonat" }} verlauf={[3, 4, 3.5, 5, 4.8, 6]} hilfe="Bezahlte Zahlungseingänge im laufenden Monat (Beispielwerte)." />
          <Kennzahl titel="Überfällige Rechnungen" wert={4} trend={{ richtung: "auf", text: "1 mehr als gestern", gut: "niedrig" }} />
          <Kennzahl titel="Montagen diese Woche" wert={7} ziel={{ wert: 7, ziel: 10, text: "7 von 10 Plätzen" }} trend={null} />
          <Kennzahl titel="Lagerwert" wert={0} format="cent" zusatz="Noch keine Bewegungen" />
          <Kennzahl titel="Rücklaufquote Newsletter-Anmeldungen" wert={null} zusatz="Noch keine Werte" />
          <Kennzahl titel="Offene Posten" fehler />
          <Kennzahl titel="Termine heute" laedt />
          <Kennzahl titel="Neue Anfragen" wert={7} ton="cognac" href="#kennzahl" zusatz="seit gestern" />
          <Kennzahl titel="Montagen" wert={4} ton="salbei" zusatz="alle Teams bestätigt" />
        </div>
      </Abschnitt>

      <Abschnitt id="segment" titel={TEXTE.abschnitte.segment} text={TEXTE.segmentText}>
        <Kachel>
          <Zeile>
            <Segment
              label="Anfragen filtern"
              wert={filter}
              onWechsel={setFilter}
              optionen={[
                { wert: "alle", titel: "Alle", anzahl: 24 },
                { wert: "neu", titel: "Neu", anzahl: 7 },
                { wert: "beratung", titel: "Beratung", anzahl: 9 },
                { wert: "angebot", titel: "Angebot", anzahl: 5 },
                { wert: "ruhend", titel: "Ruhend", anzahl: 3 },
              ]}
            />
          </Zeile>
          <Zeile className="mt-4">
            <Segment label="Ansicht" aktiv="liste" optionen={[{ wert: "liste", titel: "Liste", href: "#segment", icon: "Rows4" }, { wert: "kanban", titel: "Kanban", href: "#segment", icon: "Columns3" }]} />
            <Segment label="Beträge" wert={ansicht} onWechsel={setAnsicht} testid="demo-segment-betrag" variante="hell" optionen={[{ wert: "netto", titel: "Netto" }, { wert: "brutto", titel: "Brutto" }]} />
            <Segment label="Zeitraum" wert={zeitraum} onWechsel={(w) => { setZeitraum(w); setSchluessel((k) => k + 1); }} optionen={[{ wert: "woche", titel: "Woche" }, { wert: "monat", titel: "Monat" }, { wert: "jahr", titel: "Jahr" }, { wert: "frei", titel: "Frei", deaktiviert: true }]} />
            <Segment label="Größe s" groesse="s" optionen={[{ wert: "a", titel: "Heute" }, { wert: "b", titel: "Morgen" }]} />
          </Zeile>
          <div className="mt-4 max-w-md">
            <Segment label="Zahlart" breit optionen={[{ wert: "karte", titel: "Karte", icon: "CreditCard" }, { wert: "bar", titel: "Bar", icon: "Banknote" }, { wert: "gutschein", titel: "Gutschein", icon: "Gift" }]} />
          </div>
          <p className="mt-3 text-xs text-bo-text-faint">{`Gewählt: ${ansicht === "netto" ? "Netto" : "Brutto"} · ${zeitraum} · ${filter}`}</p>
        </Kachel>
      </Abschnitt>

      <Abschnitt id="leer" titel={TEXTE.abschnitte.leer}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Leer titel="Noch keine Anfragen" text="Anfragen kommen von der Website oder werden hier angelegt." aktion={<Knopf variant="primary" icon="Plus">Anfrage anlegen</Knopf>} nebenaktion={<Knopf variant="link" iconRechts="ArrowUpRight" href="#leer">Mehr zu Anfragen</Knopf>} />
          <Leer art="gefiltert" zuruecksetzenHref="#leer" />
          <Leer art="erledigt" text="Alle Rückrufe von heute sind erledigt." />
          <Leer art="recht" titel="Kein Zugriff auf Bankumsätze" />
          <Kachel titel="Aufgaben" dicht>
            <Leer groesse="karte" titel="Keine offenen Aufgaben" />
          </Kachel>
          <Kachel titel="Rückrufe" dicht>
            <Leer groesse="karte" art="erledigt" />
          </Kachel>
        </div>
      </Abschnitt>

      <Abschnitt id="fehler" titel={TEXTE.abschnitte.fehler}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Fehler code="unavailable" onRetry={() => setSchluessel((k) => k + 1)} />
          <Fehler code="forbidden" message="Dafür fehlt dir die Berechtigung (Rolle Faktura Leitung)." />
          <Fehler code="not_found" zurueckHref="#fehler" />
          <Fehler code="conflict" message="Der Datensatz wurde inzwischen geändert." onRetry={() => setSchluessel((k) => k + 1)} />
          <Fehler code="rate_limited" wartezeit={588} message="Zu viele Versuche." onRetry={() => setSchluessel((k) => k + 1)} />
          <Fehler code="auth" anmeldenHref="/login" />
          <Fehler code="irgendwas" nummer="7f3a" onRetry={() => setSchluessel((k) => k + 1)} />
          <Fehler kompakt code="unavailable" message="Die Liste ist gerade nicht erreichbar." onRetry={() => setSchluessel((k) => k + 1)} />
        </div>
      </Abschnitt>

      <Abschnitt id="charts" titel={TEXTE.abschnitte.charts}>
        <div key={schluessel} className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <Balken titel="Anfragen je Woche" untertitel="Beispielwerte · letzte 8 Wochen" punkte={BEISPIEL_WOCHEN} hervorheben="letzter" einblenden={schluessel > 0} testid="demo-balken" />
          <Linie titel="Umsatz je Monat" untertitel="Beispielwerte · Vorjahr gestrichelt" punkte={BEISPIEL_MONATE} vergleich={BEISPIEL_VORJAHR} name="2026" vergleichName="2025" format="cent-rund" einblenden={schluessel > 0} testid="demo-linie" />
          <Balken titel="Saldo je Monat" untertitel="Beispielwerte · negative Werte unter der Nulllinie" punkte={BEISPIEL_SALDO} format="cent-rund" einblenden={schluessel > 0} />
          <Donut titel="Anfragen nach Bereich" untertitel="Beispielwerte · mehr als 5 Teile als „Weitere“" teile={BEISPIEL_ANTEILE} einblenden={schluessel > 0} testid="demo-donut" />
          <KeineDaten titel="Retouren je Woche" untertitel="Leerer Zustand" />
          <ChartSkeleton titel="Lieferungen je Tag" />
        </div>
        <Zeile className="mt-4 text-[13px] text-bo-text-soft">
          <span>Sparkline</span>
          <Sparkline werte={[3, 5, 4, 6, 5, 8, 7]} label="Beispielverlauf" />
          <Sparkline werte={[8, 6, 7, 4, 5, 3]} breite={120} hoehe={32} label="Beispielverlauf groß" />
          <Knopf size="s" variant="ghost" icon="RefreshCw" onClick={() => setSchluessel((k) => k + 1)} data-testid="demo-charts-einblenden">
            Einblenden zeigen
          </Knopf>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="Info" className="size-4" />
            Balken: Hover zeigt den Wert als Pille.
          </span>
        </Zeile>
      </Abschnitt>
    </div>
  );
}
