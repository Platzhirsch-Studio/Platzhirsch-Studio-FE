"use client";
// Demo „PersonZelle“ (Team P0-5a, G-28) für /einstellungen?tab=system&baustein=person – nur Admin, nur
// Mock. Größen 32/24, Rolle, Abwesenheit (fremd nur „abwesend“, eigene mit Art), niemand zugewiesen,
// nur Avatar, als Link und in einer Tabellenzeile. Erfundene Personen.

import Kachel from "../Kachel";
import PersonZelle from "../PersonZelle";
import { Pille } from "../StatusBadge";
import { TEAM } from "./akte-daten";

const TEXTE = {
  titel: "PersonZelle",
  team: "Baustein von Team P0-5a",
  einleitung: "Eine Person sieht überall gleich aus: Initialen im Materialkreis, Name, Rolle. Bei anderen Personen steht nur „abwesend“, nie der Grund.",
  groessen: "Größen und Rollen",
  groessenUnter: "32 mit Rolle, 24 in dichten Listen",
  abwesenheit: "Abwesenheit",
  abwesenheitUnter: "Fremd nur „abwesend“, die eigene Person mit Art",
  tabelle: "In einer Tabelle",
  tabelleUnter: "Zuständig-Spalte einer Liste",
  spalten: { vorgang: "Vorgang", zustaendig: "Zuständig", status: "Status" },
  zeilen: [
    ["AN-2026-0431 · Küche Lochau", TEAM.LM, "Neu", "cognac"],
    ["AN-2026-0429 · Bad Bregenz", { ...TEAM.JF, abwesend: { art: "Urlaub", bis: "12.11." } }, "Beratung", "see"],
    ["AN-2026-0426 · Garten Hard", null, "Angebot", "eiche"],
  ],
  eigen: "Du (eigene Person)",
};

export default function PersonDemo() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6" data-testid="demo-person">
      <header className="min-w-0 pb-2">
        <p className="bo-unterzeile">{TEXTE.team}</p>
        <h2 className="bo-titel-gross mt-1">{TEXTE.titel}</h2>
        <p className="mt-2 max-w-3xl text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      </header>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <Kachel titel={TEXTE.groessen} unter={TEXTE.groessenUnter} className="lg:col-span-6" testid="demo-person-groessen">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.values(TEAM).slice(0, 4).map((p) => (
              <PersonZelle key={p.name} person={p} />
            ))}
            {Object.values(TEAM).slice(0, 4).map((p) => (
              <PersonZelle key={`${p.name}-24`} person={p} groesse={24} />
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2">
            {Object.values(TEAM).map((p) => (
              <PersonZelle key={`${p.name}-av`} person={p} nurAvatar href="#person" />
            ))}
            <PersonZelle person={null} nurAvatar />
          </div>
        </Kachel>

        <Kachel titel={TEXTE.abwesenheit} unter={TEXTE.abwesenheitUnter} className="lg:col-span-6" testid="demo-person-abwesend">
          <div className="grid grid-cols-1 gap-4">
            <PersonZelle person={{ ...TEAM.SB, abwesend: { art: "Krankenstand", bis: "07.11." } }} testid="demo-person-fremd" />
            <PersonZelle person={{ ...TEAM.SB, name: TEXTE.eigen, abwesend: { art: "Urlaub", bis: "12.11." } }} eigen testid="demo-person-eigen" />
            <PersonZelle person={{ ...TEAM.MG, abwesend: true }} groesse={24} />
            <PersonZelle person={null} testid="demo-person-leer" />
          </div>
        </Kachel>

        <Kachel titel={TEXTE.tabelle} unter={TEXTE.tabelleUnter} className="lg:col-span-12" testid="demo-person-tabelle">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-[13px] text-bo-text-soft">
                  <th scope="col" className="pb-2 font-medium">{TEXTE.spalten.vorgang}</th>
                  <th scope="col" className="pb-2 font-medium">{TEXTE.spalten.zustaendig}</th>
                  <th scope="col" className="pb-2 font-medium">{TEXTE.spalten.status}</th>
                </tr>
              </thead>
              <tbody>
                {TEXTE.zeilen.map(([vorgang, person, status, material]) => (
                  <tr key={vorgang} className="h-[72px] shadow-[0_calc(-1*var(--bo-hair))_0_var(--color-bo-line)]">
                    <td className="pr-4 font-semibold">{vorgang}</td>
                    <td className="pr-4">
                      <PersonZelle person={person} groesse={24} />
                    </td>
                    <td>
                      <Pille material={material}>{status}</Pille>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kachel>
      </div>
    </div>
  );
}
