"use client";
// Client-Teile der Demo „seitenmuster“ (Team P0-5b): Unternav, Zwei-Klick-Knopf, Speicherleiste + useAutosave,
// Formular mit eigener Speicherfunktion, DataTable mit Bildern, Kanban mit lokalem Verschieben.
// Nur Beispieldaten; nichts wird gespeichert (Mock-Demo, nur Admin).

import { useState } from "react";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import Unternav from "../Unternav";
import ZweiKlickKnopf from "../ZweiKlickKnopf";
import { useToast } from "../Toast";
import Speicherleiste, { SpeicherAnzeige } from "../Formular/Speicherleiste";
import { useAutosave } from "../Formular/useAutosave";
import Formular from "../Formular/Formular";
import DataTable from "../DataTable/DataTable";
import Kanban from "../Kanban/Kanban";

export const T = {
  unternav: "Akte",
  zweiKlickTitel: "Zwei-Klick-Knopf",
  zweiKlickUnter: "Erster Klick fragt nach, zweiter führt aus. Nach 3 s fällt er zurück.",
  zweiKlick: "Position entfernen",
  zweiKlickVerb: "entfernen",
  entfernt: "Position entfernt",
  autosaveTitel: "Automatisch speichern",
  autosaveUnter: "1 s nach der letzten Eingabe; Fehlerfall mit „Erneut“.",
  notiz: "Notiz zum Termin",
  notizStart: "Muster Eiche geräuchert liegen bereit.",
  fehlerSchalter: "Nächstes Speichern schlägt fehl",
  fehlerText: "Verbindung unterbrochen",
  leisteTitel: "Speicherleiste",
  leisteUnter: "Haftet unten, sobald es etwas zu speichern gibt.",
  aendern: "Etwas ändern",
  gespeichert: "Gespeichert",
  formularTitel: "Formular",
  formularUnter: "Abschnitte als Kacheln, Felder als eingelassene Flächen, Reiter als Kapsel.",
};

const AKTE_REITER = [
  { titel: "Reise", href: "/einstellungen?tab=system&baustein=seitenmuster" },
  { titel: "Planung", href: "/einstellungen?tab=system&baustein=seitenmuster&r=planung", zaehler: 14 },
  { titel: "Angebote", href: "/einstellungen?tab=system&baustein=seitenmuster&r=angebote", zaehler: 3 },
  { titel: "Bestellungen", href: "/einstellungen?tab=system&baustein=seitenmuster&r=bestellungen" },
  { titel: "Dokumente", href: "/einstellungen?tab=system&baustein=seitenmuster&r=dokumente", zaehler: 23 },
  { titel: "Notizen", href: "/einstellungen?tab=system&baustein=seitenmuster&r=notizen" },
  { titel: "Montage", href: "/einstellungen?tab=system&baustein=seitenmuster&r=montage" },
  { titel: "Service", href: "/einstellungen?tab=system&baustein=seitenmuster&r=service" },
  { titel: "Kundenkarte", href: "/einstellungen?tab=system&baustein=seitenmuster&r=kundenkarte", recht: false },
];

export function DemoUnternav() {
  return <Unternav label={T.unternav} eintraege={AKTE_REITER} aktiv={AKTE_REITER[0].href} testid="demo-unternav" />;
}

export function DemoZweiKlick() {
  const { zeige } = useToast();
  return (
    <Kachel titel={T.zweiKlickTitel} unter={T.zweiKlickUnter} testid="demo-zweiklick">
      <div className="flex flex-wrap items-center gap-3">
        <ZweiKlickKnopf verb={T.zweiKlickVerb} icon="Trash2" onBestaetigt={() => zeige(T.entfernt, { art: "ok" })}>
          {T.zweiKlick}
        </ZweiKlickKnopf>
      </div>
    </Kachel>
  );
}

export function DemoAutosave() {
  const [text, setText] = useState(T.notizStart);
  const [fehler, setFehler] = useState(false);
  const auto = useAutosave({
    startZeit: "09:12",
    speichern: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return fehler ? { ok: false, message: T.fehlerText } : { ok: true };
    },
  });
  return (
    <Kachel titel={T.autosaveTitel} unter={T.autosaveUnter} werkzeuge={<SpeicherAnzeige autosave={auto} />} testid="demo-autosave">
      <label htmlFor="demo-notiz" className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
        {T.notiz}
      </label>
      <textarea
        id="demo-notiz"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          auto.aendern(e.target.value);
        }}
        className="bo-input rounded-[14px]! border-transparent! bg-bo-surface-2!"
      />
      <div className="mt-4">
        <Schalter label={T.fehlerSchalter} an={fehler} onWechsel={setFehler} groesse="s" />
      </div>
    </Kachel>
  );
}

export function DemoSpeicherleiste() {
  const [geaendert, setGeaendert] = useState(true);
  const [laedt, setLaedt] = useState(false);
  const { zeige } = useToast();
  return (
    <Kachel titel={T.leisteTitel} unter={T.leisteUnter} testid="demo-speicherleiste">
      <Knopf variant="secondary" size="s" onClick={() => setGeaendert(true)} className="mb-4 self-start">
        {T.aendern}
      </Knopf>
      <Speicherleiste
        zuSpeichern={geaendert}
        geaendert={geaendert}
        laedt={laedt}
        stand="04.11.2026 09:12"
        onVerwerfen={() => setGeaendert(false)}
        onSpeichern={() => {
          setLaedt(true);
          setTimeout(() => {
            setLaedt(false);
            setGeaendert(false);
            zeige(T.gespeichert, { art: "ok" });
          }, 600);
        }}
        testid="demo-speicherleiste-leiste"
      />
    </Kachel>
  );
}

const META = {
  name: "Demo Termin",
  fields: [
    { fieldname: "tab_termin", fieldtype: "Tab Break", label: "Termin" },
    { fieldname: "sb_kunde", fieldtype: "Section Break", label: "Kunde" },
    { fieldname: "kunde", fieldtype: "Data", label: "Kunde", reqd: 1 },
    { fieldname: "ort", fieldtype: "Data", label: "Ort" },
    { fieldname: "cb1", fieldtype: "Column Break" },
    { fieldname: "beginn", fieldtype: "Datetime", label: "Beginn" },
    { fieldname: "art", fieldtype: "Select", label: "Art", options: "Beratung\nAufmaß\nPräsentation", auswahl: ["Beratung", "Aufmaß", "Präsentation"] },
    { fieldname: "sb_notiz", fieldtype: "Section Break", label: "Vorbereitung" },
    { fieldname: "notiz", fieldtype: "Small Text", label: "Notiz", description: "Was im Showroom bereitliegen soll." },
    { fieldname: "erinnerung", fieldtype: "Check", label: "Erinnerung am Vortag" },
    { fieldname: "tab_mehr", fieldtype: "Tab Break", label: "Weitere Angaben" },
    { fieldname: "quelle", fieldtype: "Data", label: "Quelle" },
  ],
};
const DOC = { name: "TER-2026-0412", modified: "2026-11-04 09:12:00", kunde: "Familie Brändle", ort: "Showroom Lochau", beginn: "2026-11-04 10:00", art: "Präsentation", notiz: "Muster Eiche geräuchert liegen bereit.", erinnerung: 1, quelle: "Website" };

export function DemoFormular() {
  return (
    <div className="min-w-0" data-testid="demo-formular">
      <Formular meta={META} doc={DOC} neu={false} nurLesen={false} listeHref="/einstellungen?tab=system&baustein=seitenmuster" onSpeichern={async () => ({ ok: true, name: DOC.name, modified: "2026-11-04 14:05:00" })} />
    </div>
  );
}

const SPALTEN = [
  { fieldname: "name", label: "Nr.", fieldtype: "Data" },
  { fieldname: "kunde", label: "Kunde", fieldtype: "Data" },
  { fieldname: "bereich", label: "Bereich", fieldtype: "Data" },
  { fieldname: "kanal", label: "Kanal", fieldtype: "Select" },
  { fieldname: "budget_cent", label: "Budget", fieldtype: "Int", cent: true },
  { fieldname: "eingang", label: "Eingang", fieldtype: "Datetime" },
  { fieldname: "berater", label: "Berater", fieldtype: "Link", options: "User" },
  { fieldname: "status", label: "Status", fieldtype: "Select" },
];
const ZEILEN = [
  { name: "A-1187", kunde: "Katharina & Paul Stadler", ort: "Lindau", bereich: "Küche", kanal: "Website", budget_cent: 7000000, eingang: "2026-11-04 08:41", berater: "lena.moser@beispiel.invalid", status: "Neu", bild: "/entwurf/lounge/r-kueche-eiche.jpg" },
  { name: "A-1186", kunde: "Yacht „Aurelia“", ort: "Hafen Lindau", bereich: "Yacht", kanal: "Telefon", budget_cent: null, eingang: "2026-11-04 07:55", berater: "theresa.ritter@beispiel.invalid", status: "Neu", bild: "/entwurf/lounge/r-wohnen-sofa.jpg" },
  { name: "A-1183", kunde: "Dr. Miriam Köhler", ort: "Bregenz", bereich: "Wohnen", kanal: "Showroom", budget_cent: 9000000, eingang: "2026-11-03 16:20", berater: "lena.moser@beispiel.invalid", status: "Beratung", bild: "/entwurf/lounge/r-hero-essraum.jpg" },
  { name: "A-1179", kunde: "Hotel Seeblick", ort: "Lindau", bereich: "Objekt", kanal: "E-Mail", budget_cent: 40000000, eingang: "2026-11-02 10:05", berater: "theresa.ritter@beispiel.invalid", status: "Planung", bild: "/entwurf/lounge/r-terrasse-hotel.jpg" },
  { name: "A-1176", kunde: "Familie Nägele", ort: "Hard", bereich: "Bad", kanal: "Website", budget_cent: 3500000, eingang: "2026-10-30 12:00", berater: "markus.gmeiner@beispiel.invalid", status: "Angebot", bild: "/entwurf/lounge/r-bad.webp" },
  { name: "A-1160", kunde: "Johanna Fink", ort: "Wasserburg", bereich: "Essen", kanal: "Showroom", budget_cent: 1750000, eingang: "2026-10-21 15:30", berater: "sarah.boesch@beispiel.invalid", status: "Ruhend", bild: "/entwurf/lounge/r-essen-licht.jpg" },
];
const TON = { Neu: "blau", Beratung: "orange", Planung: "tuerkis", Angebot: "orange", Ruhend: "grau" };

export function DemoTabelle() {
  return (
    <DataTable
      doctype="Demo Anfrage"
      spalten={SPALTEN}
      zeilen={ZEILEN.map((z) => ({ ...z, kunde: z.kunde }))}
      gesamt={24}
      seite={1}
      groesse={6}
      basis="/einstellungen"
      params={{ tab: "system", baustein: "seitenmuster" }}
      zeilenHref={() => "/einstellungen?tab=system&baustein=seitenmuster"}
      statusTon={TON}
      bildFeld="bild"
      unterFelder={["ort"]}
      testid="demo-tabelle"
    />
  );
}

const KARTEN = [
  { status: "Offen", karten: [
    { name: "AUF-0412", titel: "Liefertermin Küche bestätigen", faellig: "2026-11-05", zugewiesen_an: "lena.moser@beispiel.invalid" },
    { name: "AUF-0415", titel: "Muster an Hotel Seeblick senden", faellig: "2026-11-06", zugewiesen_an: "theresa.ritter@beispiel.invalid" },
  ] },
  { status: "In Arbeit", karten: [{ name: "AUF-0409", titel: "3D-Planung Penthouse überarbeiten", faellig: "2026-11-04", zugewiesen_an: "sarah.boesch@beispiel.invalid" }] },
  { status: "Erledigt", karten: [] },
];

export function DemoKanban() {
  return (
    <Kanban
      doctype="Demo Aufgabe"
      spalten={KARTEN}
      kartenFelder={[
        { fieldname: "faellig", label: "Fällig", fieldtype: "Date" },
        { fieldname: "zugewiesen_an", label: "Zuständig", fieldtype: "Link", options: "User" },
      ]}
      titelFeld="titel"
      statusTon={{ Offen: "blau", "In Arbeit": "tuerkis", Erledigt: "gruen" }}
      hrefBasis="/einstellungen?tab=system&baustein=seitenmuster&karte="
      onVerschiebe={async () => ({ ok: true })}
    />
  );
}
