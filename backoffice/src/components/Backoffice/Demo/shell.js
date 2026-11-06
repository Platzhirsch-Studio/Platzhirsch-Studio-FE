"use client";
// Demo „Shell“ (Team P0-7) für /einstellungen?tab=system&baustein=shell – nur Admin, nur Mock (Prüfung im
// demo-register). Zeigt die Bausteine der Shell v2 außerhalb ihres Platzes: FreigabeEintrag (geldwirksam,
// einfach, eigener Antrag), Glocken-Zeilen, Palette mit Präfixen, Hilfe-Panel, Erstbesuch-Band, Kundenmodus
// mit NurIntern und Rückkehr, Testband. Beispielwerte sind als solche benannt; Aktionen laufen im Demo-Modus
// nicht zum Server.

import { useState } from "react";
import Kachel, { Bento } from "../Kachel";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import FreigabeEintrag from "../Shell/FreigabeEintrag";
import Testband from "../Shell/Testband";
import HilfeArtikel from "../Shell/HilfeArtikel";
import { oeffnePalette } from "../Shell/Befehlspalette";
import { oeffneHilfe } from "../Shell/HilfePanel";
import Erstbesuch, { erstbesuchSchluessel } from "../Erstbesuch";
import { useShell } from "../Shell/ShellKontext";
import KundenmodusKnopf from "../Kundenmodus/KundenmodusKnopf";
import NurIntern from "../Kundenmodus/NurIntern";

const TEXTE = {
  titel: "Shell v2",
  team: "Baustein von Team P0-7",
  einleitung: "Schwebende Leiste, Pillen-Reiter, runde Knöpfe und durchscheinende Kopfzeile sind auf dieser Seite selbst zu sehen. Hier stehen die Teile, die sonst nur in Panels erscheinen.",
  freigaben: "Freigaben",
  freigabenUnter: "Beispieleinträge · Aktionen ohne Wirkung",
  glocke: "Mitteilungen",
  glockeUnter: "Zeilen der Glocke, gruppiert nach Tag",
  palette: "Befehlspalette",
  paletteUnter: "Strg K · Präfixe als Filter",
  hilfe: "Hilfe-Panel",
  hilfeUnter: "Taste ? · Artikel, Möglichkeiten, Kürzel",
  erstbesuch: "Erstbesuch",
  erstbesuchUnter: "Ein Band je Seite und Person",
  erstbesuchText: "Hier siehst du alle offenen Freigaben. Freigeben wirkt sofort, Ablehnen braucht einen Grund und wartet acht Sekunden.",
  erstbesuchZuruecksetzen: "Band wieder zeigen",
  kundenmodus: "Kundenmodus",
  kundenmodusUnter: "Leiste, Reiter, Glocke und interne Angaben aus",
  kundenmodusText: "Die Kundenansicht blendet Navigation, Mitteilungen und alles in NurIntern aus und vergrößert die Schrift. Zurück: Wortmarke 0,8 Sekunden drücken, dann PIN.",
  intern: "Marge (nur intern): Beispielwert",
  oeffentlich: "Angebotssumme: Beispielwert",
  testband: "Testband",
  testbandUnter: "Steht im Fluss, überdeckt nichts",
  oeffnen: "Öffnen",
  praefixe: [">", "/", "#", "@", "?"],
};

const BEISPIEL = {
  geld: {
    id: "freigabe:demo.beispiel:1", art: "freigabe", freigabeArt: "demo.beispiel", name: "1",
    titel: "Eingangsrechnung freigeben", hinweis: "Beispiel", objekt: { titel: "Beispiel-Beleg", href: "#" },
    antragsteller: { user: "lena@beispiel.invalid", name: "Lena Beispiel" }, betragCent: 128000, grund: "Ware vollständig geliefert, Preise wie Bestellung.",
    zeit: null, token: "", geldwirksam: true, folge: "Die Rechnung wird zur Zahlung freigegeben.", eigen: false,
  },
  einfach: {
    id: "freigabe:demo.beispiel:2", art: "freigabe", freigabeArt: "demo.beispiel", name: "2",
    titel: "Social-Beitrag veröffentlichen", hinweis: "Beispiel", objekt: { titel: "Beispiel-Beitrag", href: "#" },
    antragsteller: { user: "sarah@beispiel.invalid", name: "Sarah Beispiel" }, betragCent: null, grund: "",
    zeit: null, token: "", geldwirksam: false, folge: "", eigen: false,
  },
  eigen: {
    id: "freigabe:demo.beispiel:3", art: "freigabe", freigabeArt: "demo.beispiel", name: "3",
    titel: "Abwertung Lagerbestand", hinweis: "Beispiel", objekt: { titel: "Beispiel-Artikel", href: "#" },
    antragsteller: { user: "ich", name: "Du selbst" }, betragCent: 24000, grund: "Ausstellungsstück mit Kratzer.",
    zeit: null, token: "", geldwirksam: true, folge: "", eigen: true,
  },
};

// Form wie zerlegeMarkdown() aus lib/backoffice/hilfe.js (dort mit Dateizugriff, daher hier ausgeschrieben).
const ARTIKEL = {
  bloecke: [
    { art: "p", text: [{ t: "So sieht ein Hilfe-Artikel aus: kurze Absätze, " }, { t: "fett", fett: true }, { t: " für Begriffe." }] },
    { art: "h", text: [{ t: "Schritte" }] },
    { art: "liste", eintraege: [[{ t: "Liste öffnen" }], [{ t: "Zeile wählen" }], [{ t: "Mit Enter öffnen" }]] },
  ],
};

export default function ShellDemo() {
  const [erledigt, setErledigt] = useState([]);
  const { benutzerHash } = useShell();
  const [erstKey, setErstKey] = useState(0);
  const zeigen = (e) => !erledigt.includes(e.id);
  return (
    <div className="flex flex-col gap-6" data-testid="demo-shell">
      <header>
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel">{TEXTE.titel}</h2>
        <p className="bo-unterzeile mt-1 max-w-3xl">{TEXTE.einleitung}</p>
      </header>

      <Bento>
        <Kachel className="md:col-span-6" titel={TEXTE.freigaben} unter={TEXTE.freigabenUnter}>
          <div className="flex flex-col gap-3">
            {[BEISPIEL.geld, BEISPIEL.einfach, BEISPIEL.eigen].filter(zeigen).map((e) => (
              <FreigabeEintrag key={e.id} eintrag={e} demo onErledigt={(id) => setErledigt((l) => [...l, id])} />
            ))}
            {erledigt.length > 0 && (
              <Knopf size="s" variant="ghost" onClick={() => setErledigt([])}>
                {TEXTE.erstbesuchZuruecksetzen}
              </Knopf>
            )}
          </div>
        </Kachel>

        <Kachel className="md:col-span-6" titel={TEXTE.glocke} unter={TEXTE.glockeUnter}>
          <h3 className="bo-schale-gruppentitel">Heute</h3>
          {[
            { t: "Rückruf Familie Beispiel", h: "fällig heute · hohe Priorität", i: "CheckSquare", warn: true, neu: true },
            { t: "Aufmaß bestätigen", h: "fällig 06.11.", i: "CheckSquare", neu: true },
          ].map((z) => (
            <div key={z.t} className="bo-schale-zeile">
              <span className={`bo-schale-symbol${z.warn ? " bo-schale-symbol--warn" : ""}`} aria-hidden="true">
                <Icon name={z.i} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="bo-schale-zeile__titel">{z.t}</span>
                <span className="bo-schale-klein block">{z.h}</span>
              </span>
              {z.neu && <span className="bo-schale-neu" aria-label="neu" role="img" />}
            </div>
          ))}
          <h3 className="bo-schale-gruppentitel">Gestern</h3>
          <div className="bo-schale-zeile">
            <span className="bo-schale-symbol" aria-hidden="true">
              <Icon name="Bell" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="bo-schale-zeile__titel">Kalkulation geprüft</span>
              <span className="bo-schale-klein block">Beispielmitteilung</span>
            </span>
          </div>
        </Kachel>

        <Kachel className="md:col-span-4" titel={TEXTE.palette} unter={TEXTE.paletteUnter}>
          <div className="flex flex-wrap gap-2">
            {TEXTE.praefixe.map((p) => (
              <Knopf key={p} size="s" variant="secondary" onClick={() => oeffnePalette(p)}>
                <span className="font-semibold">{p}</span>
              </Knopf>
            ))}
          </div>
        </Kachel>

        <Kachel className="md:col-span-4" titel={TEXTE.hilfe} unter={TEXTE.hilfeUnter} werkzeuge={<Knopf size="s" variant="secondary" onClick={oeffneHilfe}>{TEXTE.oeffnen}</Knopf>}>
          <HilfeArtikel bloecke={ARTIKEL.bloecke} />
        </Kachel>

        <Kachel className="md:col-span-4" titel={TEXTE.testband} unter={TEXTE.testbandUnter}>
          <div className="[&_.bo-schale-band]:m-0">
            <Testband modus="mock" host="" />
          </div>
        </Kachel>

        <Kachel className="md:col-span-6" titel={TEXTE.erstbesuch} unter={TEXTE.erstbesuchUnter}>
          <Erstbesuch key={erstKey} route="/demo/erstbesuch" text={TEXTE.erstbesuchText} />
          <Knopf
            size="s"
            variant="ghost"
            onClick={() => {
              try {
                localStorage.removeItem(erstbesuchSchluessel(benutzerHash, "/demo/erstbesuch"));
              } catch {
                // ohne Speicher nichts zu tun
              }
              setErstKey((k) => k + 1);
            }}
          >
            {TEXTE.erstbesuchZuruecksetzen}
          </Knopf>
        </Kachel>

        <Kachel className="md:col-span-6" titel={TEXTE.kundenmodus} unter={TEXTE.kundenmodusUnter}>
          <p className="bo-unterzeile mb-4">{TEXTE.kundenmodusText}</p>
          <div className="mb-4 flex flex-col gap-2 rounded-bo-karte bg-bo-surface-2 p-4 text-sm">
            <span>{TEXTE.oeffentlich}</span>
            <NurIntern>
              <span className="text-bo-cognac-text">{TEXTE.intern}</span>
            </NurIntern>
          </div>
          <KundenmodusKnopf />
        </Kachel>
      </Bento>
    </div>
  );
}
