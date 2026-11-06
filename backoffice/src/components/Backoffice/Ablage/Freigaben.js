"use client";
// Freigaben (Konzept §3.4): alle Links für Externe mit Restlaufzeit, Downloads und Status; Widerrufen mit
// Bestätigung (Q-C6: Externe verlieren den Zugriff). Darunter Dateien im Kundenportal (Rücknahme = verzögerter
// Commit über useDateiWerkzeug). Tabelle in Kachel, am Telefon Karten.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import Knopf from "../Knopf";
import Kachel from "../Kachel";
import Avatar from "../Avatar";
import Leer from "../Leer";
import Bestaetigen from "../Bestaetigen";
import { Pille } from "../StatusBadge";
import { useToast } from "../Toast";
import { FREIGABE_STATUS } from "@/lib/backoffice/ablage/labels";
import { freigabeStatus, resttage } from "@/lib/backoffice/ablage/regeln";
import { freigabelinkWiderrufenAction } from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";
import Vorschaubild from "./Vorschaubild";
import useDateiWerkzeug from "./DateiWerkzeug";
import { datumKurz, person } from "./zeit";

export default function Freigaben({ links: start, portal = [], beendet = false, info, user, rollen, schreiben, namen = {} }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [links, setLinks] = useState(start);
  const [quelle, setQuelle] = useState(start);
  if (quelle !== start) {
    setQuelle(start);
    setLinks(start);
  }
  const [frage, setFrage] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const werkzeug = useDateiWerkzeug({ info, rollen, user, schreiben, onGeaendert: () => router.refresh() });

  const widerrufen = async () => {
    setLaeuft(true);
    const r = await freigabelinkWiderrufenAction({ freigabelink: frage.freigabelink });
    setLaeuft(false);
    const l = frage;
    setFrage(null);
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    setLinks((x) => x.filter((y) => y.freigabelink !== l.freigabelink));
    zeige(T.toast.widerrufen, { art: "ok" });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <Kachel flach titel={beendet ? "Beendete Links" : "Links für Externe"} unter={`${links.length} ${links.length === 1 ? "Link" : "Links"}`} testid="abl-freigaben">
        {links.length ? (
          <div className="overflow-x-auto px-3 pb-3">
            <table className="bo-abl-liste">
              <thead>
                <tr>
                  <th scope="col">{T.freigaben.spalten.datei}</th>
                  <th scope="col" className="bo-abl-spalte-weg">
                    {T.freigaben.spalten.fuer}
                  </th>
                  <th scope="col" className="bo-abl-spalte-weg">
                    {T.freigaben.spalten.von}
                  </th>
                  <th scope="col">{T.freigaben.spalten.ablauf}</th>
                  <th scope="col" className="bo-rechts bo-abl-spalte-weg">
                    {T.freigaben.spalten.downloads}
                  </th>
                  <th scope="col">{T.freigaben.spalten.status}</th>
                  <th scope="col">
                    <span className="sr-only">Aktion</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => {
                  const st = freigabeStatus(l);
                  const rest = resttage(l.ablauf);
                  const d = l.dateiDaten;
                  return (
                    <tr key={l.freigabelink} data-testid="abl-freigabe-zeile">
                      <td className="min-w-[240px]">
                        <Link href={`/ablage/datei/${encodeURIComponent(l.datei)}?tab=freigaben`} className="bo-abl-liste__name">
                          <span className="bo-abl-liste__daumen">{d && <Vorschaubild datei={d} klein />}</span>
                          <span className="flex min-w-0 flex-col">
                            <span className="bo-abl-liste__titel">{d?.dateiname || l.datei}</span>
                            <span className="bo-abl-liste__unter">{d?.bezug_titel || ""}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="bo-abl-spalte-weg min-w-40 text-bo-text-soft">{l.empfaenger_hinweis || "–"}</td>
                      <td className="bo-abl-spalte-weg">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={person(l.erstellt_von, namen)} groesse={24} dekorativ />
                          {person(l.erstellt_von, namen)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="flex flex-col">
                          <span>{datumKurz(l.ablauf)}</span>
                          {!beendet && <span className={`text-xs ${rest !== null && rest <= 3 ? "text-bo-eiche-text" : "text-bo-text-soft"}`}>{T.freigaben.restTage(rest ?? 0)}</span>}
                        </span>
                      </td>
                      <td className="bo-rechts bo-abl-spalte-weg whitespace-nowrap">
                        {l.max_downloads ? `${l.downloads} / ${l.max_downloads}` : l.downloads}
                        {l.passwort ? <KeyRound className="ml-2 inline size-3.5 text-bo-messing-text" aria-label={T.teilen.mitPasswort} /> : null}
                      </td>
                      <td>
                        <Pille material={FREIGABE_STATUS[st]?.material || "stein"}>{FREIGABE_STATUS[st]?.titel || st}</Pille>
                      </td>
                      <td className="text-right">
                        {!beendet && schreiben && st === "Aktiv" && (
                          <Knopf size="s" variant="ghost" onClick={() => setFrage(l)} data-testid="abl-widerrufen">
                            {T.aktionen.widerrufen}
                          </Knopf>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 pb-6">
            <Leer titel={beendet ? T.leer.freigabenAlt.titel : T.leer.freigaben.titel} text={beendet ? T.leer.freigabenAlt.text : T.leer.freigaben.text} groesse="karte" testid="abl-leer" />
          </div>
        )}
      </Kachel>

      {!beendet && (
        <Kachel titel={T.freigaben.portal} unter={`${portal.length} ${portal.length === 1 ? "Datei" : "Dateien"}`} testid="abl-portal">
          {portal.length ? (
            <ul className="bo-abl-slot__raster">
              {portal.map((d) => (
                <li key={d.datei} className="bo-abl-slot__datei">
                  <Link href={`/ablage/datei/${encodeURIComponent(d.datei)}`} className="flex flex-col gap-1.5">
                    <span className="bo-abl-slot__daumen">
                      <Vorschaubild datei={d} />
                    </span>
                    <span className="truncate text-[13px] font-semibold">{d.dateiname}</span>
                    <span className="truncate text-xs text-bo-text-soft">{d.bezug_titel || ""}</span>
                  </Link>
                  {schreiben && (
                    <Knopf size="s" variant="ghost" onClick={() => werkzeug.h.portal(d, false)}>
                      {T.aktionen.portalZurueck}
                    </Knopf>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bo-text-soft">Keine Dateien im Kundenportal.</p>
          )}
        </Kachel>
      )}

      <Bestaetigen
        offen={!!frage}
        titel={T.dialog.widerrufenFrage}
        text={T.dialog.widerrufenText}
        fakten={frage ? [{ label: T.freigaben.spalten.datei, wert: frage.dateiDaten?.dateiname || frage.datei }, { label: T.freigaben.spalten.fuer, wert: frage.empfaenger_hinweis || "–" }] : []}
        bestaetigen={T.aktionen.widerrufen}
        gefaehrlich
        laeuft={laeuft}
        onAbbrechen={() => setFrage(null)}
        onBestaetigen={widerrufen}
        testid="abl-widerrufen-frage"
      />
      {werkzeug.dialoge}
    </div>
  );
}
