"use client";
// Kanban-Board des Bereichs (Konzept § 5.3/§ 5.5, Lounge § 6): Spalten als eingelassene Flächen (Radius 24), Karten
// schweben (Radius 20, Hub 2 px). Ziehen mit Maus (HTML-Drag), gleiche Wege per Tastatur und Touch über das Menü
// „Verschieben nach …“ an jeder Karte (Q-I4). Gesperrte Ziele stehen im Menü mit sichtbarem Grund; beim Ablegen auf
// ein gesperrtes Ziel kehrt die Karte zurück und eine Statusmeldung nennt den Grund. Was ein Zug auslöst (Commit,
// Sheet, Assistent, Dialog), entscheidet der Aufrufer über `onZug`.

import { useRef, useState } from "react";
import { Menue, MenuePunkt } from "../Overlay/Popover";
import { RundKnopf } from "../Knopf";
import { T } from "@/lib/backoffice/personal/texte";
import "./personal.css";

/**
 * @param {{spalten:Array<{status:string, titel:string, karten:object[], leer?:string, kopf?:import("react").ReactNode}>,
 *   karte:(k:object)=>import("react").ReactNode, ziele:(k:object)=>Array<{nach:string, titel:string, erlaubt:boolean, grund?:string}>,
 *   onZug:(k:object, nach:string)=>void, label:string, testid?:string, laufend?:Set<string>}} p
 */
export default function Board({ spalten, karte, ziele, onZug, onGesperrt, label, testid = "per-board", laufend = new Set() }) {
  const [zieht, setZieht] = useState(null); // { name, von }
  const [ueber, setUeber] = useState(null);
  const [ansage, setAnsage] = useState("");
  const ref = useRef(null);
  const zielInfo = (k, nach) => ziele(k).find((z) => z.nach === nach);
  const kartenVon = (name) => spalten.flatMap((s) => s.karten).find((k) => k.name === name);

  return (
    <div>
      <div className="bo-per-board" ref={ref} role="group" aria-label={label} data-testid={testid}>
        {spalten.map((s) => {
          const zk = zieht ? kartenVon(zieht.name) : null;
          const zi = zk && zieht.von !== s.status ? zielInfo(zk, s.status) : null;
          return (
            <section
              key={s.status}
              className="bo-per-spalte"
              aria-label={`${s.titel}, ${s.karten.length}`}
              data-ziel={ueber === s.status && zieht ? (zi?.erlaubt ? "ja" : "nein") : undefined}
              data-testid={`per-spalte-${s.status}`}
              onDragOver={(e) => {
                if (!zieht) return;
                e.preventDefault();
                setUeber(s.status);
              }}
              onDragLeave={() => setUeber((u) => (u === s.status ? null : u))}
              onDrop={(e) => {
                e.preventDefault();
                const k = zieht ? kartenVon(zieht.name) : null;
                setUeber(null);
                setZieht(null);
                if (!k || zieht.von === s.status) return;
                const z = zielInfo(k, s.status);
                if (!z) return setAnsage(`${s.titel}: nicht möglich`);
                if (!z.erlaubt) {
                  setAnsage(z.grund || T.fehler.keinRecht);
                  onGesperrt?.(k, z);
                  return;
                }
                onZug(k, s.status);
              }}
            >
              <div className="bo-per-spalte__kopf">
                <h3 className="bo-per-spalte__titel">
                  {s.titel}
                  <span className="bo-per-spalte__n">{s.karten.length}</span>
                </h3>
                {s.kopf}
              </div>
              <ul className="flex flex-col gap-2.5" aria-label={s.titel}>
                {s.karten.map((k) => (
                  <li
                    key={k.name}
                    className="bo-per-karte"
                    draggable={!laufend.has(k.name)}
                    data-zieht={zieht?.name === k.name ? "" : undefined}
                    data-laeuft={laufend.has(k.name) ? "" : undefined}
                    data-testid={`per-karte-${k.name}`}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", k.name);
                      setZieht({ name: k.name, von: s.status });
                    }}
                    onDragEnd={() => {
                      setZieht(null);
                      setUeber(null);
                    }}
                  >
                    {karte(k)}
                    <div className="absolute top-2.5 right-2.5 z-[2]">
                      <Menue
                        label={T.bewerbung.verschieben}
                        platzierung="unten-ende"
                        breite={260}
                        ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label={`${T.bewerbung.verschieben} – ${k.person || k.titel || k.name}`} groesse="s" flach testid={`per-menue-${k.name}`} />}
                      >
                        {ziele(k)
                          .filter((z) => z.nach !== s.status)
                          .map((z) => (
                            <MenuePunkt key={z.nach} icon="ArrowRight" deaktiviert={!z.erlaubt} grund={!z.erlaubt ? z.grund : undefined} onWaehlen={() => onZug(k, z.nach)} testid={`per-ziel-${z.nach}`}>
                              {z.titel}
                            </MenuePunkt>
                          ))}
                      </Menue>
                    </div>
                  </li>
                ))}
              </ul>
              {s.karten.length === 0 && <p className="bo-per-spalte__leer">{s.leer || T.bewerbung.keineKarten}</p>}
              {s.fuss}
            </section>
          );
        })}
      </div>
      <p className="bo-per-sr" role="status" aria-live="polite">
        {ansage}
      </p>
    </div>
  );
}
