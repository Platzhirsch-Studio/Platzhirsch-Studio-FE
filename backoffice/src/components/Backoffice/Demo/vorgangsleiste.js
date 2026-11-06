"use client";
// Demo „Vorgangsleiste“ (Team P0-5a, G-12) für /einstellungen?tab=system&baustein=vorgangsleiste – nur
// Admin, nur Mock. Eine Leiste für alle Ketten: Kundenreise der Mappe (Stufen mit Schritten und
// Personen), CRM-Vorgang und Faktura-Belegkette (Stufen mit Belegen im Popover), Service-Phasen mit
// übersprungener Stufe und Blocker-Satz, Kurzform für Listen und der Leer-Zustand. Beispielwerte.

import Kachel from "../Kachel";
import Vorgangsleiste from "../Akte/Vorgangsleiste";
import { BELEGKETTE, CRM_VORGANG, REISE, SERVICE } from "./akte-daten";

const TEXTE = {
  titel: "Vorgangsleiste",
  team: "Baustein von Team P0-5a",
  einleitung: "Stufen als verbundene Spalten, der aktuelle Schritt in Tinte, offene Wege gestrichelt. Stufen mit Belegen öffnen beim Antippen ihre Liste. Am Telefon wird daraus eine senkrechte Liste.",
  crm: "Vorgang",
  faktura: "Belegkette",
  service: "Servicefall",
  kompakt: "Kurzform in Listen",
  kompaktUnter: "Punkte ohne Text, Stand als Tooltip und für Screenreader",
  leer: "Ohne Stufen",
  zeilen: [
    ["Haus am See", REISE],
    ["Anfrage Küche Lochau", CRM_VORGANG],
    ["RE-2026-0251", BELEGKETTE],
    ["Servicefall Sofa", SERVICE],
  ],
  crmNaechster: "Gesprächsprotokoll abschließen",
  crmAktion: "Protokoll öffnen",
  serviceNaechster: "Einsatz Do 06.11. durchführen",
  serviceBlocker: "Ersatzteil vom Hersteller",
  serviceBlockerLink: "Bestellung ansehen",
};

export default function VorgangsleisteDemo() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-vorgangsleiste">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>

      <Vorgangsleiste schritte={REISE} testid="demo-reise" />

      <Vorgangsleiste
        titel={TEXTE.crm}
        schritte={CRM_VORGANG}
        testid="demo-crm"
        naechster={{ titel: TEXTE.crmNaechster, aktion: { titel: TEXTE.crmAktion, href: "#protokoll" } }}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <Vorgangsleiste titel={TEXTE.faktura} schritte={BELEGKETTE} testid="demo-faktura" />
        <Vorgangsleiste
          titel={TEXTE.service}
          schritte={SERVICE}
          testid="demo-service"
          naechster={{ titel: TEXTE.serviceNaechster, blocker: { text: TEXTE.serviceBlocker, href: "#bestellung", linkText: TEXTE.serviceBlockerLink } }}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <Kachel titel={TEXTE.kompakt} unter={TEXTE.kompaktUnter} className="lg:col-span-7" testid="demo-kompakt">
          <ul className="flex flex-col">
            {TEXTE.zeilen.map(([name, schritte], i) => (
              <li key={name} className={`flex min-h-14 items-center justify-between gap-4 ${i ? "shadow-[0_calc(-1*var(--bo-hair))_0_var(--color-bo-line)]" : ""}`}>
                <span className="truncate text-[15px] font-semibold">{name}</span>
                <Vorgangsleiste kompakt mitText schritte={schritte} />
              </li>
            ))}
          </ul>
        </Kachel>
        <div className="lg:col-span-5">
          <Vorgangsleiste titel={TEXTE.leer} schritte={[]} testid="demo-leer" />
        </div>
      </div>
    </div>
  );
}
