"use client";
// Demo „Eingabe und Kiosk“ (Team P0-6) für /einstellungen?tab=system&baustein=eingabe – nur Admin, nur Mock
// (Prüfung im demo-register). Zeigt G-21 Kalender/Slotraster/Raster/BetragFeld, G-22 ScanTor/ScanFeld/
// KameraScan, G-23 Unterschrift, G-24 Zahlentastatur/Stepper48/Wischaktion/Positionsgrid + Warteschlange,
// G-30 FotoAufnahme und den Kundendisplay-Kanal. Musterdaten aus dem freigegebenen Lounge-Entwurf (keine
// echten Kunden), feste Demo-Zeit Mittwoch, 4. November 2026, 14:32. Server Actions laufen im Mock-Pfad.

import { useMemo, useState } from "react";
import { Hand, ScanLine } from "lucide-react";
import Kachel, { Bento } from "../Kachel";
import Knopf from "../Knopf";
import { Pille } from "../StatusBadge";
import cx from "../cx";
import { Kalender, Raster, Slotraster } from "../Kalender";
import { BetragFeld, FotoAufnahme, ScanFeld, ScanTor, Unterschrift } from "../Eingabe";
import { formatBetrag } from "../Eingabe/betrag";
import { unterschriftSpeichernAction } from "../Eingabe/aktionen";
import { Positionsgrid, Stepper48, Wischaktion, Zahlentastatur } from "../Kiosk";
import { useKundendisplay, useKundendisplaySender } from "@/lib/backoffice/kanal/browser";
import { KANAL_TEXTE } from "@/lib/backoffice/kanal";

const JETZT = "2026-11-04 14:32";
const BILD = (n) => `/entwurf/lounge/${n}`;

const TEXTE = {
  team: "Bausteine von Team P0-6",
  titel: "Eingabe und Kiosk",
  einleitung: "Kalender und Plantafel, Beträge, Scanner und Kamera, Unterschrift und Fotos, dazu die Bausteine der Kiosk-Arbeitsplätze und der Kanal zum Kundendisplay.",
  kalender: { titel: "Kalender", unter: "Woche, Monat, Tag · Quellen ein- und ausblenden · Pfeiltasten, T, W, M, D · Ziehen oder „Umplanen …“" },
  slots: { titel: "Freie Zeiten", unter: "Beratung, 60 Minuten, im 30-Minuten-Raster" },
  raster: { titel: "Plantafel", unter: "Montage-Teams × Tage · Umschalt+Pfeil verschiebt" },
  betrag: { titel: "Beträge", unter: "Komma-Modell, Wert in Cent", anzahlung: "Anzahlung", gutschrift: "Gutschrift", falsch: "Mit Fehler" },
  scan: { titel: "Scannen", unter: "Scanner, Tippen oder Kamera · Codes werden erkannt", simulieren: "Scan vorführen", unbekannt: "Fehlscan vorführen" },
  unterschrift: { titel: "Unterschrift", unter: "Einmal übernommen, nicht mehr änderbar", erklaerung: "Ware vollständig und unbeschädigt erhalten. Lieferschein LS-2026-0418, Familie Brändle.", name: "Familie Brändle" },
  foto: { titel: "Fotos", unter: "Kamera oder Datei · Aufnahmezeit · Warteschlange", label: "Fotos zur Montage" },
  tastatur: { titel: "Zahlentastatur", unter: "Gegeben an der Kassa · Schnellbeträge in der vierten Spalte", label: "Gegeben", passend: "Passend", rueckgeld: "Rückgeld" },
  stepper: { titel: "Menge", unter: "Stepper 48 · ganze Stück" },
  wisch: { titel: "Wischen", unter: "Nach rechts erledigt, nach links Problem – Knöpfe stehen immer daneben", erledigt: "Erledigt", problem: "Problem", erledigtMeldung: "erledigt", problemMeldung: "Problem gemeldet" },
  grid: { titel: "Positionen", unter: "Raster mit Roving-Fokus · Enter wählt", label: "Positionen Auftrag A-2611-0213", spalten: { artikel: "Artikel", menge: "Ist / Soll", status: "Status" }, vollstaendig: "Vollständig", offen: "Offen", bestaetigen: "Ohne Barcode", gerade: "Gerade +1" },
  kanal: { titel: "Kundendisplay-Kanal", unter: "Kassa sendet, Display empfängt – hier im selben Fenster über den Kanal", ruhe: "Ruhe", einkauf: "Einkauf", bezahlen: "Bezahlen", danke: "Danke", empfangen: "Am Display", keine: "Noch nichts gesendet", gesamt: "Gesamt", stufe: "Kundenkarte" },
};

const TEAM = { mg: "Markus Gmeiner", jf: "Jonas Feurstein", lm: "Lena Moser", sb: "Sarah Bösch", dn: "David Natter", ek: "Elif Kaya" };

const EINTRAEGE = [
  { id: "t1", quelle: "termin", titel: "Familie Brändle · 3D-Planung Küche", start: "2026-11-04 10:00", ende: "2026-11-04 11:30", ort: "Showroom OG", personen: [TEAM.lm] },
  { id: "t2", quelle: "termin", titel: "Dr. Miriam Köhler · Beratung Wohnen", start: "2026-11-04 12:00", ende: "2026-11-04 13:00", ort: "Showroom EG", personen: [TEAM.lm] },
  { id: "t3", quelle: "termin", titel: "Hotel Seeblick · Bemusterung", start: "2026-11-04 14:00", ende: "2026-11-04 15:30", ort: "Lindau", personen: [TEAM.sb] },
  { id: "t4", quelle: "termin", titel: "Yacht „Aurelia“ · Aufmaß Salon", start: "2026-11-04 15:30", ende: "2026-11-04 17:00", ort: "Hafen Bregenz", personen: [TEAM.jf] },
  { id: "t5", quelle: "termin", titel: "Familie Nägele · Abnahme Bad", start: "2026-11-04 17:15", ende: "2026-11-04 18:00", personen: [TEAM.lm] },
  { id: "t6", quelle: "termin", titel: "Rückruf Stadler", start: "2026-11-04 12:30", ende: "2026-11-04 13:00", personen: [TEAM.lm] },
  { id: "m1", quelle: "montage", titel: "Montage Küche Brändle", start: "2026-11-05 07:30", ende: "2026-11-05 15:00", ort: "Lochau", personen: [TEAM.mg] },
  { id: "m2", quelle: "montage", titel: "Montage Bad Nägele", start: "2026-11-06 08:00", ende: "2026-11-06 12:00", ort: "Hard", personen: [TEAM.mg] },
  { id: "s1", quelle: "einsatz", titel: "Service Dunstabzug", start: "2026-11-03 09:00", ende: "2026-11-03 10:30", ort: "Dornbirn", personen: [TEAM.jf] },
  { id: "r1", quelle: "tour", titel: "Tour 3 · Lochau, Hard", start: "2026-11-05 07:00", ende: "2026-11-05 11:00", personen: [TEAM.dn] },
  { id: "a1", quelle: "abwesenheit", titel: "Urlaub", start: "2026-11-06", ende: "2026-11-07", ganztag: true, personen: [TEAM.sb] },
  { id: "e1", quelle: "event", titel: "Abend der offenen Tür", start: "2026-11-06 18:00", ende: "2026-11-06 21:00", ort: "Showroom", personen: [TEAM.lm, TEAM.ek] },
  { id: "x1", quelle: "social", titel: "Beitrag Küchenwelt", start: "2026-11-02 11:00", ende: "2026-11-02 11:30" },
  { id: "t7", quelle: "termin", titel: "Beratung Familie Moosbrugger", start: "2026-11-02 16:00", ende: "2026-11-02 17:00", personen: [TEAM.sb] },
];

const PLANTAFEL = [
  { id: "mg", titel: "Team Gmeiner", unter: "Montage Küche", icon: "Hammer", balken: [{ id: "b1", titel: "Küche Brändle", start: "2026-11-05", ende: "2026-11-06", material: "eiche" }, { id: "b2", titel: "Bad Nägele", start: "2026-11-09", ende: "2026-11-10", material: "salbei" }] },
  { id: "jf", titel: "Team Feurstein", unter: "Service", icon: "Wrench", balken: [{ id: "b3", titel: "Dunstabzug Dornbirn", start: "2026-11-03", ende: "2026-11-03", material: "see" }, { id: "b4", titel: "Yacht Aurelia", start: "2026-11-11", ende: "2026-11-13", material: "cognac" }, { id: "b5", titel: "Nachbesserung Köhler", start: "2026-11-12", ende: "2026-11-12", material: "see" }] },
  { id: "dn", titel: "Tour 3", unter: "Lkw 7,5 t", icon: "Truck", balken: [{ id: "b6", titel: "Lochau, Hard", start: "2026-11-05", ende: "2026-11-05", material: "salbei" }, { id: "b7", titel: "Lindau, Hotel Seeblick", start: "2026-11-10", ende: "2026-11-11", material: "salbei" }] },
  { id: "sb", titel: "Sarah Bösch", unter: "Innenarchitektur", icon: "Ruler", balken: [{ id: "b8", titel: "Urlaub", start: "2026-11-06", ende: "2026-11-07", material: "stein", verschiebbar: false }] },
];

const POSITIONEN = [
  { id: "5", name: "Bordeaux Glas", marke: "Zalto · 9008564001014", bild: "p-zalto-bordeaux.webp", soll: 6, ist: 4, ton: "aktiv" },
  { id: "6", name: "Plaid Alpaka, Sand", marke: "Weberei Saurer · ohne Barcode", bild: null, soll: 1, ist: 0, ton: "warnung" },
  { id: "1", name: "Bell Portable", marke: "Tom Dixon · 5056394707181", bild: "p-bell-leuchte.webp", soll: 1, ist: 1, ton: "erledigt" },
  { id: "2", name: "Altaïr Duftkerze 270 g", marke: "Trudon · 3700773700159", bild: "p-trudon-kerze.webp", soll: 2, ist: 2, ton: "erledigt" },
];

const KORB = [
  { titel: "Stone Portable", unter: "Tom Dixon", menge: 1, einzel_cent: 39500, betrag_cent: 39500, bild: BILD("p-stone-leuchte.webp") },
  { titel: "Altaïr Duftkerze", unter: "Trudon", menge: 2, einzel_cent: 12500, betrag_cent: 25000, bild: BILD("p-trudon-kerze.webp") },
  { titel: "Bordeaux Glas", unter: "Zalto", menge: 6, einzel_cent: 6900, betrag_cent: 41400, bild: BILD("p-zalto-bordeaux.webp"), neu: true },
];

function tastenFolge(code, ziel) {
  // Führt einen Hand-Scanner vor: Zeichen im Abstand < 30 ms, dann Enter (gleicher Weg wie echte Geräte).
  const el = ziel || document.activeElement || document.body;
  [...code, "Enter"].forEach((k, i) => setTimeout(() => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })), i * 8));
}

export default function DemoEingabe() {
  const [meldung, setMeldung] = useState("");
  const [slot, setSlot] = useState("2026-11-05 10:00");
  const [eintraege, setEintraege] = useState(EINTRAEGE);
  const [plantafel, setPlantafel] = useState(PLANTAFEL);
  const [anzahlung, setAnzahlung] = useState(240000);
  const [gutschrift, setGutschrift] = useState(-4950);
  const [zuletzt, setZuletzt] = useState({ text: "Bordeaux Glas", ergebnis: "erkannt" });
  const [gegeben, setGegeben] = useState(null);
  const [menge, setMenge] = useState(1);
  const [aktiv, setAktiv] = useState("5");
  const [wisch, setWisch] = useState([
    { id: "w1", titel: "Küche Brändle · Oberschränke hängen", unter: "Lochau · 07:30" },
    { id: "w2", titel: "Arbeitsplatte einpassen", unter: "Lochau · 10:00" },
    { id: "w3", titel: "Geräte anschließen", unter: "Lochau · 13:00" },
  ]);
  const senden = useKundendisplaySender("DEMO", { fern: false });
  const display = useKundendisplay("DEMO", { fern: false, pauseNachMs: 60_000 });
  const korbSumme = KORB.reduce((s, p) => s + p.betrag_cent, 0);

  const tage = useMemo(() => ["2026-11-04", "2026-11-05", "2026-11-06", "2026-11-09", "2026-11-10"], []);

  const scan = (code, erkannt, quelle) => {
    const art = erkannt?.art;
    const bekannt = art && art !== "text";
    setZuletzt({ text: code, ergebnis: bekannt ? "erkannt" : "unbekannt" });
    setMeldung(`${quelle === "kamera" ? "Kamera" : quelle === "tippen" ? "Getippt" : "Scanner"}: ${code} (${bekannt ? art : "unbekannt"})`);
  };

  return (
    <div className="grid gap-6" data-testid="demo-eingabe">
      <ScanTor modus="backoffice" onScan={(code) => (setMeldung(`Außerhalb eines Feldes gescannt: ${code} – öffnet die Befehlspalette`), false)} />
      <header className="grid gap-1">
        <p className="text-[13px] font-medium text-bo-text-soft">{TEXTE.team}</p>
        <h1 className="bo-titel-gross">{TEXTE.titel}</h1>
        <p className="max-w-[72ch] text-[15px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>
      <p className="sr-only" aria-live="polite">
        {meldung}
      </p>

      <Kachel titel={TEXTE.kalender.titel} unter={TEXTE.kalender.unter} testid="demo-kalender">
        <Kalender
          eintraege={eintraege}
          startDatum="2026-11-04"
          jetzt={JETZT}
          von="07:00"
          bis="21:00"
          hoehe={560}
          onOeffnen={(e) => setMeldung(`Öffnen: ${e.titel}`)}
          onNeu={(z) => setMeldung(`Neu ab ${z.start}`)}
          onVerschieben={(e, neu) => setEintraege((l) => l.map((x) => (x.id === e.id ? { ...x, ...neu } : x)))}
        />
      </Kachel>

      <Bento einblenden={false}>
        <Kachel className="md:col-span-7" titel={TEXTE.slots.titel} unter={TEXTE.slots.unter} testid="demo-slots">
          <Slotraster tage={tage} belegt={eintraege} von="09:00" bis="18:00" dauer={60} wert={slot} onWahl={(w) => setSlot(w.start)} jetzt={JETZT} />
        </Kachel>
        <Kachel className="md:col-span-5" titel={TEXTE.betrag.titel} unter={TEXTE.betrag.unter} testid="demo-betrag">
          <div className="grid gap-4">
            <label className="grid gap-1.5 text-[13px] font-medium text-bo-text-soft">
              {TEXTE.betrag.anzahlung}
              <BetragFeld value={anzahlung} onChange={(c) => setAnzahlung(c)} name="anzahlung_cent" testid="demo-betrag-anzahlung" />
            </label>
            <label className="grid gap-1.5 text-[13px] font-medium text-bo-text-soft">
              {TEXTE.betrag.gutschrift}
              <BetragFeld value={gutschrift} onChange={(c) => setGutschrift(c)} negativ />
            </label>
            <label className="grid gap-1.5 text-[13px] font-medium text-bo-text-soft">
              {TEXTE.betrag.falsch}
              <BetragFeld defaultValue={null} fehler="Betrag im Format 1.234,50" testid="demo-betrag-fehler" />
            </label>
            <p className="text-[13px] tabular-nums text-bo-text-soft">
              {formatBetrag(anzahlung, { waehrung: true })} · {formatBetrag(gutschrift, { waehrung: true })}
            </p>
          </div>
        </Kachel>
      </Bento>

      <Kachel titel={TEXTE.raster.titel} unter={TEXTE.raster.unter} testid="demo-raster">
        <Raster
          von="2026-11-02"
          bis="2026-11-15"
          heute="2026-11-04"
          zeilen={plantafel}
          onOeffnen={(b) => setMeldung(`Öffnen: ${b.titel}`)}
          onNeu={({ zeile, tag }) => setMeldung(`Neu: ${zeile.titel} am ${tag}`)}
          onVerschieben={(b, neu, z) => setPlantafel((l) => l.map((zl) => (zl.id === z.id ? { ...zl, balken: zl.balken.map((x) => (x.id === b.id ? { ...x, ...neu } : x)) } : zl)))}
        />
      </Kachel>

      <Bento einblenden={false}>
        <Kachel className="md:col-span-7" titel={TEXTE.scan.titel} unter={TEXTE.scan.unter} testid="demo-scan">
          <div className="grid gap-4">
            <ScanFeld onScan={scan} zuletzt={zuletzt} kamera testid="demo-scanfeld" />
            <div className="flex flex-wrap gap-2">
              <Knopf
                onClick={() => {
                  const feld = document.querySelector('[data-testid="demo-scanfeld"] input');
                  feld?.focus();
                  tastenFolge("9008564001014", feld);
                }}
                data-testid="demo-scan-simulieren"
              >
                <ScanLine aria-hidden="true" className="size-4" strokeWidth={1.75} />
                {TEXTE.scan.simulieren}
              </Knopf>
              <Knopf
                variant="ghost"
                onClick={() => {
                  const feld = document.querySelector('[data-testid="demo-scanfeld"] input');
                  feld?.focus();
                  tastenFolge("4006381333931X", feld);
                }}
              >
                {TEXTE.scan.unbekannt}
              </Knopf>
            </div>
            <p className="text-[13px] text-bo-text-soft" data-testid="demo-scan-meldung">
              {meldung}
            </p>
          </div>
        </Kachel>
        <Kachel className="md:col-span-5" titel={TEXTE.stepper.titel} unter={TEXTE.stepper.unter}>
          <div className="flex items-center gap-4" data-dichte="kiosk">
            <Stepper48 wert={menge} onWert={setMenge} min={0} max={6} label="Menge Bordeaux Glas" testid="demo-stepper" />
            <span className="text-[15px] text-bo-text-soft tabular-nums">{menge} / 6</span>
          </div>
        </Kachel>
      </Bento>

      <Bento einblenden={false}>
        <Kachel className="md:col-span-7" titel={TEXTE.unterschrift.titel} unter={TEXTE.unterschrift.unter} testid="demo-unterschrift">
          <Unterschrift
            erklaerung={TEXTE.unterschrift.erklaerung}
            name={TEXTE.unterschrift.name}
            alternativen={[
              { wert: "name", titel: "Name bestätigt", feld: { label: "Name in Druckbuchstaben" } },
              { wert: "abgestellt", titel: "Abgestellt laut Absprache", fotoPflicht: true },
            ]}
            aktion={(e) => unterschriftSpeichernAction({ ...e, demo: "lieferschein" })}
          />
        </Kachel>
        <Kachel className="md:col-span-5" titel={TEXTE.foto.titel} unter={TEXTE.foto.unter} testid="demo-foto">
          <FotoAufnahme label={TEXTE.foto.label} warteschlange max={6} />
        </Kachel>
      </Bento>

      <div data-dichte="kiosk" className="grid gap-6">
        <Bento einblenden={false}>
          <Kachel className="md:col-span-5" titel={TEXTE.tastatur.titel} unter={TEXTE.tastatur.unter} testid="demo-zahlentastatur">
            <Zahlentastatur
              label={TEXTE.tastatur.label}
              onWert={(w) => setGegeben(w)}
              spalte4={[
                { titel: "10 €", wert: 1000 },
                { titel: "20 €", wert: 2000 },
                { titel: "50 €", wert: 5000 },
                { titel: TEXTE.tastatur.passend, wert: korbSumme, primaer: true },
              ]}
              uebernehmen={false}
            />
            <p className="mt-3 text-[15px] tabular-nums text-bo-text-soft">
              {TEXTE.tastatur.rueckgeld}: {gegeben !== null && gegeben >= 2000 ? formatBetrag(Math.max(0, gegeben - 2000), { waehrung: true }) : "–"}
            </p>
          </Kachel>
          <Kachel className="md:col-span-7" titel={TEXTE.grid.titel} unter={TEXTE.grid.unter} testid="demo-positionsgrid">
            <Positionsgrid
              label={TEXTE.grid.label}
              aktiv={aktiv}
              onOeffnen={setAktiv}
              spalten={[
                { key: "artikel", titel: TEXTE.grid.spalten.artikel },
                { key: "menge", titel: TEXTE.grid.spalten.menge, breite: "88px", ausrichtung: "rechts" },
                { key: "status", titel: TEXTE.grid.spalten.status, breite: "minmax(132px,auto)", ausrichtung: "rechts" },
              ]}
              zeilen={POSITIONEN.map((p) => ({
                id: p.id,
                ton: p.id === aktiv ? "aktiv" : p.ton === "aktiv" ? "offen" : p.ton,
                label: p.name,
                zellen: {
                  artikel: (
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-bo-surface">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Demo-Bild aus public */}
                        {p.bild ? <img src={BILD(p.bild)} alt="" className="size-12 object-contain" /> : <Hand aria-hidden="true" className="size-5 text-bo-text-soft" strokeWidth={1.75} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">{p.name}</span>
                        <span className="block truncate text-[13px] text-bo-text-soft">{p.marke}</span>
                      </span>
                    </span>
                  ),
                  menge: (
                    <span className="tabular-nums">
                      <span className="text-[22px] font-semibold">{p.ist}</span>
                      <span className="text-[15px] text-bo-text-soft"> / {p.soll}</span>
                    </span>
                  ),
                  status:
                    p.ist >= p.soll ? (
                      <Pille material="salbei">{TEXTE.grid.vollstaendig}
                      </Pille>
                    ) : p.ton === "warnung" ? (
                      <Pille material="messing">{TEXTE.grid.bestaetigen}</Pille>
                    ) : p.id === aktiv ? (
                      <Pille material="salbei">{TEXTE.grid.gerade}</Pille>
                    ) : (
                      <Pille material="stein">{TEXTE.grid.offen}</Pille>
                    ),
                },
              }))}
            />
          </Kachel>
        </Bento>

        <Bento einblenden={false}>
          <Kachel className="md:col-span-6" titel={TEXTE.wisch.titel} unter={TEXTE.wisch.unter} testid="demo-wisch">
            <div className="grid gap-2">
              {wisch.map((w) => (
                <Wischaktion
                  key={w.id}
                  label={w.titel}
                  rechts={{ titel: TEXTE.wisch.erledigt, icon: "Check", ton: "salbei", onAusloesen: () => (setWisch((l) => l.filter((x) => x.id !== w.id)), setMeldung(`${w.titel} ${TEXTE.wisch.erledigtMeldung}`)) }}
                  links={{ titel: TEXTE.wisch.problem, icon: "TriangleAlert", ton: "eiche", onAusloesen: () => setMeldung(`${w.titel}: ${TEXTE.wisch.problemMeldung}`) }}
                >
                  <span className="block text-[15px] font-semibold">{w.titel}</span>
                  <span className="block text-[13px] text-bo-text-soft">{w.unter}</span>
                </Wischaktion>
              ))}
            </div>
          </Kachel>
          <Kachel className="md:col-span-6" titel={TEXTE.kanal.titel} unter={TEXTE.kanal.unter} testid="demo-kanal">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Knopf size="m" onClick={() => senden({ zustand: "ruhe", text: "Schön, dass Sie da sind." })}>
                  {TEXTE.kanal.ruhe}
                </Knopf>
                <Knopf size="m" onClick={() => senden({ zustand: "einkauf", positionen: KORB, gesamt_cent: korbSumme, ust_cent: Math.round((korbSumme / 1.2) * 0.2), kundenkarte: { stufe: "Platzhirsch Plus", vorteile: [{ titel: "Lieferung frei", eingeloest: true }] }, kunde: { name: "Dr. Miriam Köhler", email: "nie@im.kanal" } })} data-testid="demo-kanal-einkauf">
                  {TEXTE.kanal.einkauf}
                </Knopf>
                <Knopf size="m" onClick={() => senden({ zustand: "bezahlen", zahlart: "karte", gesamt_cent: korbSumme })}>
                  {TEXTE.kanal.bezahlen}
                </Knopf>
                <Knopf size="m" onClick={() => senden({ zustand: "danke", zahlart: "bar", gesamt_cent: korbSumme, gegeben_cent: 110000, rueckgeld_cent: 110000 - korbSumme })}>
                  {TEXTE.kanal.danke}
                </Knopf>
              </div>
              <div className="rounded-[20px] bg-bo-surface-2 p-5" data-testid="demo-kanal-display">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-bo-text-soft">{TEXTE.kanal.empfangen}</p>
                  <Pille material={display.verbunden ? "salbei" : "eiche"}>{display.verbunden ? KANAL_TEXTE.verbunden : KANAL_TEXTE.pausiert}</Pille>
                </div>
                {display.nachricht ? (
                  <div className="mt-3 grid gap-1">
                    <p className="text-[22px] font-semibold capitalize">{TEXTE.kanal[display.nachricht.zustand] || display.nachricht.zustand}</p>
                    {display.nachricht.positionen.map((p) => (
                      <p key={p.titel} className="flex justify-between gap-3 text-[15px] tabular-nums">
                        <span className={cx(p.neu && "font-semibold")}>
                          {p.menge} × {p.titel}
                        </span>
                        <span>{formatBetrag(p.betrag_cent, { waehrung: true })}</span>
                      </p>
                    ))}
                    {display.nachricht.kundenkarte && (
                      <p className="text-[13px] text-bo-text-soft">
                        {TEXTE.kanal.stufe}: {display.nachricht.kundenkarte.stufe}
                      </p>
                    )}
                    {display.nachricht.gesamt_cent !== null && (
                      <p className="mt-2 flex justify-between text-[17px] font-semibold tabular-nums">
                        <span>{TEXTE.kanal.gesamt}</span>
                        <span>{formatBetrag(display.nachricht.gesamt_cent, { waehrung: true })}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[15px] text-bo-text-soft">{TEXTE.kanal.keine}</p>
                )}
              </div>
            </div>
          </Kachel>
        </Bento>
      </div>
    </div>
  );
}
