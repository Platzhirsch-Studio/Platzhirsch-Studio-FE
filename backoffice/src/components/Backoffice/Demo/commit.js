"use client";
// Demo „commit“ (Team P0-3, G-03) für /einstellungen?tab=system&baustein=commit – nur Admin, nur Mock
// (Prüfung im demo-register und in planeDemoCommit). Zeigt den verzögerten Commit an einer kleinen
// Anfragen-Liste (Ausstehend-Pille, Rückgängig, Zusammenfassen, Fehlerfall, Hervorhebung nach dem Speichern),
// die Meldungsarten und den Zustand am Server. Gestaltung Lounge: Bento, Kacheln ohne Rahmen, Zeilen als Fläche.

import { useState } from "react";
import Kachel, { Bento } from "../Kachel";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import Ausstehend, { useCommitMarke } from "../Ausstehend";
import { ToastKarte, useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { commitStatusAction, planeDemoCommit } from "@/lib/backoffice/commit/actions";
import { COMMIT_DEMO_TEXTE as T } from "@/lib/backoffice/commit/texte";

const ANFRAGEN = [
  { name: "A-1187", kunde: "Katharina & Paul Stadler", ort: "Lindau", berater: "Lena Moosbrugger" },
  { name: "A-1186", kunde: "Yacht „Aurelia“", ort: "Hafen Lindau", berater: "Tobias Rhomberg" },
  { name: "A-1183", kunde: "Dr. Miriam Köhler", ort: "Bregenz", berater: "Lena Moosbrugger" },
];

function Zeile({ a, status, onAnnehmen, onFehler }) {
  const objekt = { doctype: "Demo", name: a.name };
  const ref = useCommitMarke(objekt);
  const angenommen = status === "Angenommen";
  return (
    <li ref={ref} className="bo-row flex min-w-0 flex-wrap items-center gap-3 rounded-bo-zeile px-3 py-3 hover:bg-bo-fill" data-testid={`demo-zeile-${a.name}`}>
      <Avatar name={a.berater} groesse={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{a.kunde}</p>
        <p className="truncate text-[13px] text-bo-text-soft">
          {a.ort} · {a.name}
        </p>
      </div>
      <div className="flex basis-full flex-wrap items-center gap-2 pl-12 xl:basis-auto xl:pl-0">
        <Ausstehend objekt={objekt} />
        <StatusBadge wert={status} ton={angenommen ? "gruen" : "blau"} />
      </div>
      <div className="flex basis-full gap-1.5 pl-12 xl:basis-auto xl:pl-0">
        <Knopf size="s" variant="secondary" disabled={angenommen} onClick={onAnnehmen} data-testid={`demo-annehmen-${a.name}`}>
          {T.annehmen}
        </Knopf>
        <Knopf size="s" variant="ghost" disabled={angenommen} onClick={onFehler} data-testid={`demo-fehler-${a.name}`}>
          {T.annehmenFehler}
        </Knopf>
      </div>
    </li>
  );
}

export default function DemoCommit() {
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [status, setStatus] = useState(() => Object.fromEntries(ANFRAGEN.map((a) => [a.name, "Neu"])));
  const [tokens, setTokens] = useState([]);
  const [stand, setStand] = useState([]);

  const setze = (name, wert) => setStatus((s) => ({ ...s, [name]: wert }));

  async function annehmen(a, { fehler = false } = {}) {
    const r = await planeDemoCommit({ name: a.name, titel: a.name, fehler });
    if (!r.ok) return zeige(r.message || T.nurMock, { art: "fehler" });
    setTokens((t) => [r.token, ...t].slice(0, 8));
    setze(a.name, "Angenommen");
    starte(T.angenommen, {
      token: r.token,
      ms: r.ms,
      objekt: r.objekt,
      gruppe: "demo.annehmen",
      sammel: T.mehrere,
      fehlerText: `Annehmen von ${a.name}`,
      onVerworfen: () => setze(a.name, "Neu"),
      onFehler: () => setze(a.name, "Neu"),
    });
    return undefined;
  }

  async function aktualisieren() {
    if (!tokens.length) return setStand([]);
    const r = await commitStatusAction({ tokens });
    setStand(r.ok ? r.ergebnisse : []);
    return undefined;
  }

  return (
    <div className="space-y-6" data-testid="demo-commit">
      <header className="space-y-1">
        <p className="text-[13px] font-medium text-bo-text-soft">{T.team}</p>
        <h1 className="bo-titel-gross">{T.titel}</h1>
        <p className="max-w-2xl text-[15px] text-bo-text-soft">{T.einleitung}</p>
      </header>
      <Bento>
        <Kachel className="md:col-span-7" titel={T.liste} unter={T.listeUnter} werkzeuge={
          <Knopf size="s" variant="primary" onClick={() => ANFRAGEN.filter((a) => status[a.name] !== "Angenommen").forEach((a) => annehmen(a))} data-testid="demo-alle">
            {T.alleAnnehmen}
          </Knopf>
        }>
          <ul className="-mx-3 mt-2 space-y-1">
            {ANFRAGEN.map((a) => (
              <Zeile key={a.name} a={a} status={status[a.name]} onAnnehmen={() => annehmen(a)} onFehler={() => annehmen(a, { fehler: true })} />
            ))}
          </ul>
        </Kachel>

        <Kachel className="md:col-span-5" titel={T.arten} unter={T.artenUnter}>
          <div className="mt-2 flex flex-wrap gap-2">
            <Knopf size="s" onClick={() => zeige(T.gespeichert, { art: "ok" })} data-testid="demo-ok">{T.artName.ok}</Knopf>
            <Knopf size="s" onClick={() => zeige(T.info, { art: "info" })} data-testid="demo-info">{T.artName.info}</Knopf>
            <Knopf size="s" onClick={() => zeige(T.warnung, { art: "warnung", aktion: { titel: T.verlaengern, onClick: () => zeige(T.gespeichert, { art: "ok" }) } })} data-testid="demo-warnung">{T.artName.warnung}</Knopf>
            <Knopf size="s" onClick={() => zeige(T.fehler, { art: "fehler" })} data-testid="demo-fehler">{T.artName.fehler}</Knopf>
            <Knopf size="s" variant="ghost" onClick={() => [0, 1, 2].forEach(() => zeige(T.gespeichert, { art: "ok" }))} data-testid="demo-gruppe">{T.gruppe}</Knopf>
          </div>
        </Kachel>

        <Kachel className="md:col-span-7" titel={T.ansicht} unter={T.ansichtUnter}>
          <div className="mt-2 grid grid-cols-1 gap-3 rounded-bo-karte bg-bo-bg p-4 lg:grid-cols-2" data-testid="demo-ansicht">
            <ToastKarte statisch art="undo" text={T.angenommen} sekunden={6} ms={8000} />
            <ToastKarte statisch art="undo" text={T.mehrere(3)} sekunden={6} ms={8000} reduziert />
            <ToastKarte statisch art="ok" text={T.gespeichert} anzahl={3} />
            <ToastKarte statisch art="info" text={T.info} />
            <ToastKarte statisch art="warnung" text={T.warnung} aktion={{ titel: T.verlaengern }} />
            <ToastKarte statisch art="fehler" text="Annehmen von A-1183 hat nicht geklappt – Die Anfrage wurde inzwischen von jemand anderem bearbeitet" />
          </div>
        </Kachel>

        <Kachel className="md:col-span-5" titel={T.server} unter={T.serverUnter} werkzeuge={<Knopf size="s" variant="ghost" icon="RefreshCw" onClick={aktualisieren} data-testid="demo-aktualisieren">{T.aktualisieren}</Knopf>}>
          {stand.length ? (
            <ul className="mt-2 space-y-1" data-testid="demo-stand">
              {stand.map((s) => (
                <li key={s.token} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-surface-2 px-3 py-2.5 text-[13px]" data-zustand={s.zustand} data-quelle={s.quelle || ""}>
                  <span className="font-medium">{s.objekt?.name || "–"}</span>
                  <span className="text-bo-text-soft">
                    {T.zustand[s.zustand] || s.zustand}
                    {s.quelle ? ` · ${T.quelle[s.quelle] || s.quelle}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-bo-text-soft">{T.leer}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-bo-text-soft">
            <Ausstehend objekt={{ doctype: "Demo", name: "A-1187" }} nurSymbol />
          </div>
        </Kachel>
      </Bento>
    </div>
  );
}
