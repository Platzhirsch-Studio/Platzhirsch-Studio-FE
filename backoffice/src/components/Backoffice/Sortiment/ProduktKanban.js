"use client";
// Kanban „Weg zur Veröffentlichung“ (§ 3.2): Entwurf · Wartet auf Veröffentlichung · Veröffentlicht (14 Tage) ·
// Pausiert. Ziehen mit Maus/Stift; derselbe Weg über das Menü „Verschieben nach …“ (Tastatur, Touch; WCAG 2.5.7).
// Ziel „Veröffentlicht“ öffnet denselben Dialog wie der Knopf (Vorprüfung), alles läuft als verzögerter Commit.
// Für das Team ist die Spalte „Veröffentlicht“ kein Ziel (Hinweis „Veröffentlichen: Leitung“).
import { useState } from "react";
import Link from "next/link";
import { Menue, MenuePunkt } from "../Overlay";
import { RundKnopf } from "../Knopf";
import { PreisZelle, ProduktBild } from "./Bausteine";
import WorkflowDialog from "./WorkflowDialog";
import { produktUebergaenge, bilderZustand } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, PRODUKTE } from "@/lib/backoffice/sortiment/texte";

const NACH = { Geprueft: "Prüfen", Aktiv: "Veröffentlichen", Pausiert: "Pausieren", Entwurf: "Zurück auf Entwurf" };

function aktionFuer(von, nach, leitung) {
  if (von === "Pausiert" && nach === "Aktiv") return leitung ? "Reaktivieren" : null;
  const a = NACH[nach];
  return produktUebergaenge(von, { leitung }).some((t) => t.aktion === a) ? a : null;
}

/** @param {{spalten:Array<{status:string, karten:object[]}>, leitung:boolean, darfSchreiben:boolean}} p */
export default function ProduktKanban({ spalten, leitung, darfSchreiben }) {
  const [dialog, setDialog] = useState(null);
  const [ziehe, setZiehe] = useState(null);
  const [ueber, setUeber] = useState(null);
  const [verschoben, setVerschoben] = useState(() => new Map());

  const board = spalten.map((s) => ({
    ...s,
    karten: [...s.karten.filter((k) => !verschoben.has(k.name)), ...spalten.flatMap((x) => x.karten).filter((k) => verschoben.get(k.name) === s.status).map((k) => ({ ...k, _laeuft: true }))],
  }));

  const verschiebe = (karte, nach) => {
    const aktion = aktionFuer(karte.status, nach, leitung);
    if (!aktion) return;
    setDialog({ aktion, namen: [karte.name], nach });
  };

  return (
    <>
      <div className="bo-sor-kanban" role="list" aria-label="Weg zur Veröffentlichung" data-testid="produkt-kanban">
        {board.map((s) => {
          const zielMoeglich = ziehe && ziehe.status !== s.status && aktionFuer(ziehe.status, s.status, leitung);
          return (
            <section
              key={s.status}
              role="listitem"
              aria-label={PRODUKTE.kanbanSpalten[s.status]}
              className="bo-sor-kanban__spalte"
              data-ziel={ueber === s.status && zielMoeglich ? "true" : undefined}
              onDragOver={(e) => {
                if (zielMoeglich) {
                  e.preventDefault();
                  setUeber(s.status);
                }
              }}
              onDragLeave={() => setUeber((u) => (u === s.status ? null : u))}
              onDrop={(e) => {
                e.preventDefault();
                setUeber(null);
                if (ziehe && zielMoeglich) verschiebe(ziehe, s.status);
                setZiehe(null);
              }}
            >
              <header className="bo-sor-kanban__kopf">
                <h2 className="text-[14px] font-semibold">{PRODUKTE.kanbanSpalten[s.status]}</h2>
                <span className="bo-sor-zutun__zahl" aria-label={`${s.karten.length} Produkte`}>
                  {s.karten.length}
                </span>
              </header>
              {s.status === "Aktiv" && !leitung && <p className="bo-sor-klein px-1.5">{PRODUKTE.kanbanTeam}</p>}
              <ul className="flex flex-col gap-2.5">
                {s.karten.length === 0 && <li className="bo-sor-kanban__leer">Keine Produkte</li>}
                {s.karten.map((k) => {
                  const ziele = ["Entwurf", "Geprueft", "Aktiv", "Pausiert"].filter((z) => z !== k.status && aktionFuer(k.status, z, leitung));
                  return (
                    <li
                      key={k.name}
                      className="bo-sor-kanban__karte"
                      draggable={darfSchreiben && ziele.length > 0 && !k._laeuft}
                      data-laeuft={k._laeuft ? "true" : undefined}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", k.name);
                        setZiehe(k);
                      }}
                      onDragEnd={() => {
                        setZiehe(null);
                        setUeber(null);
                      }}
                    >
                      <ProduktBild src={k.bild_hauptbild} alt="" groesse={48} zustand={bilderZustand(k).art} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/sortiment/produkte/${encodeURIComponent(k.name)}`} className="bo-sor-link bo-sor-link--zeile line-clamp-2 text-[14px] font-semibold leading-5">
                          {k.titel}
                        </Link>
                        <p className="bo-sor-klein truncate">{k.marke}</p>
                        <div className="mt-1 text-[13px]">
                          <PreisZelle produkt={k} rechts={false} />
                        </div>
                      </div>
                      {darfSchreiben && ziele.length > 0 && (
                        <div className="relative z-[1] self-start">
                          <Menue label={`${k.titel}: Verschieben nach …`} ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Verschieben nach …" groesse="s" flach />}>
                            {ziele.map((z) => (
                              <MenuePunkt key={z} onWaehlen={() => verschiebe(k, z)}>
                                {GLOSSAR.produktAktion[aktionFuer(k.status, z, leitung)]}
                              </MenuePunkt>
                            ))}
                          </Menue>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {s.status === "Aktiv" && (
                <Link href="/sortiment/produkte?status=Aktiv" className="bo-sor-zutun__alle">
                  {PRODUKTE.kanbanAeltere}
                </Link>
              )}
            </section>
          );
        })}
      </div>
      {dialog && (
        <WorkflowDialog
          offen
          namen={dialog.namen}
          aktion={dialog.aktion}
          onSchliessen={() => setDialog(null)}
          onGeplant={(namen) => setVerschoben((alt) => new Map([...alt, ...namen.map((n) => [n, dialog.nach])]))}
          onVerworfen={() => setVerschoben(new Map())}
        />
      )}
    </>
  );
}
