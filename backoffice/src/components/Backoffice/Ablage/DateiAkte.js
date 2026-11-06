"use client";
// Datei-Akte (Konzept §3.3): Kopf-Aktionen, Band (max. 1), Reiter Vorschau · Versionen · Freigaben · Details ·
// Verlauf, rechte Spalte mit Fakten und Bezügen. PDF-Vorschau als blob-URL (die App sendet X-Frame-Options: DENY,
// eigene Seiten nie per iframe src), Bilder direkt, Office/CAD als Endungs-Kachel mit ehrlichem Satz.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Globe, History, Link2, Lock, Maximize2, RotateCcw, Share2, Tag, Trash2, Upload } from "lucide-react";
import Knopf from "../Knopf";
import Kachel from "../Kachel";
import Avatar from "../Avatar";
import { Pille } from "../StatusBadge";
import { Menue } from "../Overlay/Popover";
import Lightbox from "../Overlay/Lightbox";
import Leer from "../Leer";
import Segment from "../Segment";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { BEZUG, FREIGABE_STATUS } from "@/lib/backoffice/ablage/labels";
import { darstellung, freigabeStatus, resttage, sperreArt } from "@/lib/backoffice/ablage/regeln";
import { anzeige } from "@/lib/backoffice/labels";
import { T } from "@/lib/backoffice/ablage/texte";
import Vorschaubild, { vorschauSrc } from "./Vorschaubild";
import useDateiWerkzeug, { ladenHref } from "./DateiWerkzeug";
import UploadSchlange from "./UploadSchlange";
import useUpload from "./useUpload";
import { datumKurz, datumZeit, person, titelZeit, wann } from "./zeit";

const EREIGNIS_ICON = { Upload, "Neue Version": Upload, Download, Gesperrt: Lock, Entsperrt: Lock, Geloescht: Trash2, Wiederhergestellt: RotateCcw, "Freigabe erstellt": Link2, "Freigabe genutzt": Link2, "Freigabe widerrufen": Link2, Tags: Tag, "Portal freigegeben": Globe, "Portal zurueckgezogen": Globe };

function PdfBuehne({ d }) {
  const [url, setUrl] = useState(null);
  const [fehler, setFehler] = useState(false);
  useEffect(() => {
    let weg = false;
    let objekt = null;
    fetch(ladenHref(d, { inline: true, version: d.version }))
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((b) => {
        if (weg) return;
        objekt = URL.createObjectURL(new Blob([b], { type: "application/pdf" }));
        setUrl(objekt);
      })
      .catch(() => !weg && setFehler(true));
    return () => {
      weg = true;
      if (objekt) URL.revokeObjectURL(objekt);
    };
  }, [d]);
  if (fehler) return <Vorschaubild datei={{ ...d, vorschau_art: "pdf", vorschau_status: "Fehler" }} />;
  if (!url) return <div className="bo-skeleton h-[60vh] w-full" aria-hidden="true" />;
  return <iframe src={url} title={d.dateiname} data-testid="abl-pdf" />;
}

/** Kopf-Knöpfe der Akte (im Server-Seitenkopf). */
export function DateiAkteKopf({ datei: d, info, user, rollen, schreiben, linkMailen }) {
  const router = useRouter();
  const upload = useUpload({ info, onFertig: () => router.refresh() });
  const w = useDateiWerkzeug({ info, rollen, user, schreiben, linkMailen, onNeueVersion: (f, x) => upload.starte([f], { ordner: x.ordner, zielDatei: x.datei }), onEntfernt: () => router.refresh() });
  const a = w.rechte(d);
  useKuerzel("akte@ablage", {
    "ablage.akte-teilen": () => (a.teilen.an ? w.h.teilen(d) : false),
    "ablage.akte-herunterladen": () => (a.herunterladen.an ? w.h.herunterladen(d) : false),
    "ablage.umbenennen": () => (a.umbenennen.an ? w.h.umbenennen(d) : false),
    "ablage.auschecken": () => (a.einchecken.an ? w.h.einchecken(d) : a.auschecken.an ? w.h.auschecken(d) : false),
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {d.status === "Papierkorb" ? (
        a.wiederherstellen.an && (
          <Knopf variant="primary" icon="RotateCcw" onClick={() => w.h.wiederherstellen(d)} data-testid="abl-akte-wiederherstellen">
            {T.aktionen.wiederherstellen}
          </Knopf>
        )
      ) : (
        <>
          {a.teilen.an && (
            <Knopf variant="secondary" icon="Share2" onClick={() => w.h.teilen(d)} kuerzel="Umschalt+L" data-testid="abl-akte-teilen">
              {T.panel.teilen}
            </Knopf>
          )}
          <Knopf variant="primary" icon="Download" href={ladenHref(d)} kuerzel="Umschalt+H" data-testid="abl-akte-laden">
            {T.aktionen.herunterladen}
          </Knopf>
        </>
      )}
      <Menue label={T.aktionen.menue} platzierung="unten-ende" ausloeser={(p) => <Knopf variant="secondary" icon="Ellipsis" label={T.aktionen.menue} {...p} data-testid="abl-akte-menue" />}>
        {w.menue(d, { ohne: ["herunterladen", "teilen"] })}
      </Menue>
      {w.dialoge}
      <UploadSchlange eintraege={upload.eintraege} onAbbrechen={upload.abbrechen} onErneut={upload.erneut} onLeeren={upload.leeren} />
    </div>
  );
}

/**
 * @param {object} p
 * @param {object} p.datei      Antwort von `datei` inkl. versionen, freigabelinks, kette
 * @param {object[]} p.links    alle Freigabelinks
 * @param {object[]|null} p.verlauf  Ereignisse (null = kein Recht)
 */
export default function DateiAkte({ datei: d, links = [], verlauf, tab, info, user, rollen, schreiben, namen = {}, linkMailen }) {
  const router = useRouter();
  const [lightbox, setLightbox] = useState(false);
  const w = useDateiWerkzeug({ info, rollen, user, schreiben, linkMailen, onEntfernt: () => router.refresh() });
  const a = w.rechte(d);
  const art = darstellung(d, { officeVorschau: info?.office_vorschau });
  const sperre = sperreArt(d, user);
  const aktiveLinks = links.filter((l) => l.status === "Aktiv").length;
  const reiter = [
    ["vorschau", T.akte.reiter.vorschau],
    ["versionen", T.akte.reiter.versionen, d.versionen?.length || d.version || 1],
    ["freigaben", T.akte.reiter.freigaben, aktiveLinks || undefined],
    ["details", T.akte.reiter.details],
    ["verlauf", T.akte.reiter.verlauf],
  ];
  const aktiv = reiter.some(([k]) => k === tab) ? tab : "vorschau";
  const ordner = d.kette?.[d.kette.length - 1];
  const bezug = d.bezug_doctype && BEZUG[d.bezug_doctype] && d.bezug_name ? { titel: d.bezug_titel || d.bezug_name, art: BEZUG[d.bezug_doctype].titel, href: BEZUG[d.bezug_doctype].href(d.bezug_name) } : null;

  let band = null;
  if (d.status === "Papierkorb") band = { ton: "eiche", text: T.akte.bandPapierkorb(datumKurz(d.papierkorb_bis)) };
  else if (sperre === "fremd") band = { ton: "eiche", text: T.akte.bandGesperrt(person(d.gesperrt_von, namen), datumZeit(d.gesperrt_bis)) };
  else if (d.vorschau_status === "Ausstehend") band = { ton: "info", text: T.akte.bandVorschau };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" data-testid="abl-akte">
      <div className="flex min-w-0 flex-col gap-5">
        {band && (
          <div className="bo-abl-eingelassen flex items-center gap-3 text-sm" data-ton={band.ton} role="status" data-testid="abl-band">
            <Lock className="size-4 shrink-0 text-bo-eiche-text" strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1">{band.text}</span>
            {d.status === "Papierkorb" && a.wiederherstellen.an && (
              <Knopf size="s" variant="secondary" icon="RotateCcw" onClick={() => w.h.wiederherstellen(d)}>
                {T.aktionen.wiederherstellen}
              </Knopf>
            )}
            {sperre === "fremd" && a.aufheben.an && (
              <Knopf size="s" variant="secondary" onClick={() => w.h.aufheben(d)}>
                {T.aktionen.aufheben}
              </Knopf>
            )}
          </div>
        )}

        <div className="self-start">
          <Segment label="Reiter" aktiv={aktiv} optionen={reiter.map(([k, titel, anzahl]) => ({ wert: k, titel, anzahl, href: `?tab=${k}`, testid: `abl-reiter-${k}` }))} testid="abl-reiter" />
        </div>

        {aktiv === "vorschau" && (
          <div className="bo-abl-buehne" data-testid="abl-buehne">
            {art === "bild" ? (
              <button type="button" className="contents" onClick={() => setLightbox(true)} aria-label={T.akte.groesser}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Datei aus dem eigenen Speicher */}
                <img src={ladenHref(d, { inline: true, version: d.version })} alt={d.dateiname} />
              </button>
            ) : art === "pdf" ? (
              <PdfBuehne d={d} />
            ) : art === "video" ? (
              <video src={ladenHref(d, { inline: true, version: d.version })} controls className="max-h-[640px] w-full" />
            ) : (
              <div className="flex w-full flex-col items-center gap-4 py-10">
                <div className="relative h-56 w-full max-w-md overflow-hidden rounded-[20px]">
                  <Vorschaubild datei={d} />
                </div>
                <p className="max-w-md px-6 text-center text-sm text-bo-text-soft">{d.vorschau_art === "office" ? T.akte.officeOhneVorschau : T.akte.keineVorschau}</p>
                {d.vorschau_art === "cad" && d.metadaten && (
                  <dl className="bo-abl-fakten bo-abl-eingelassen w-full max-w-md">
                    {Object.entries(d.metadaten).map(([k, v]) => (
                      <div key={k}>
                        <dt>{anzeige(k.charAt(0).toUpperCase() + k.slice(1))}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <Knopf variant="secondary" icon="Download" href={ladenHref(d)}>
                  {T.aktionen.herunterladen}
                </Knopf>
              </div>
            )}
            {["bild", "pdf"].includes(art) && (
              <div className="bo-abl-buehne__werkzeug">
                {art === "bild" && (
                  <button type="button" className="bo-abl-glasknopf bo-glas" onClick={() => setLightbox(true)} aria-label={T.akte.groesser}>
                    <Maximize2 className="size-[18px]" strokeWidth={1.75} />
                  </button>
                )}
                <a className="bo-abl-glasknopf bo-glas" href={ladenHref(d, { inline: true, version: d.version })} target="_blank" rel="noopener noreferrer" aria-label={T.akte.neuerTab}>
                  <ExternalLink className="size-[18px]" strokeWidth={1.75} />
                </a>
              </div>
            )}
          </div>
        )}

        {aktiv === "versionen" && (
          <Kachel titel={T.akte.reiter.versionen} unter={T.status.version(d.version)} testid="abl-versionen">
            <ol className="bo-abl-versionen">
              {(d.versionen || []).map((v) => {
                const aktuell = v.version === d.version;
                return (
                  <li key={v.version} className="bo-abl-version" data-aktuell={aktuell ? "true" : undefined}>
                    <span className="bo-abl-version__nr">{v.version}</span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <span suppressHydrationWarning title={titelZeit(v.hochgeladen_am)}>
                          {wann(v.hochgeladen_am)}
                        </span>
                        {aktuell && <Pille material="salbei">{T.akte.versionAktuell}</Pille>}
                        {v.wiederhergestellt_aus && <Pille material="stein">{T.akte.wiederhergestelltAus(v.wiederhergestellt_aus)}</Pille>}
                      </span>
                      {v.kommentar && <span className="text-sm text-bo-text">{v.kommentar}</span>}
                      <span className="flex items-center gap-2 text-xs text-bo-text-soft tabular-nums">
                        <Avatar name={person(v.hochgeladen_von, namen)} groesse={20} dekorativ />
                        {person(v.hochgeladen_von, namen)} · {Math.round((v.groesse || 0) / 1024).toLocaleString("de-AT")} KB
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Knopf variant="ghost" size="s" icon="Download" label={`Version ${v.version} laden`} href={ladenHref(d, { version: v.version })} />
                      {!aktuell && a.versionWiederherstellen.an && (
                        <Knopf variant="secondary" size="s" icon="RotateCcw" onClick={() => w.h.versionWiederherstellen(d, v.version)} data-testid="abl-version-wiederherstellen">
                          {T.aktionen.versionWiederherstellen}
                        </Knopf>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            {(d.versionen || []).length <= 1 && <p className="pt-2 text-sm text-bo-text-soft">{T.leer.versionen}</p>}
            {a.neueVersion.an && (
              <div className="pt-4">
                <Knopf variant="secondary" icon="Plus" onClick={() => w.h.neueVersion(d)}>
                  {T.aktionen.neueVersion}
                </Knopf>
              </div>
            )}
          </Kachel>
        )}

        {aktiv === "freigaben" && (
          <Kachel
            titel={T.akte.reiter.freigaben}
            werkzeuge={
              a.teilen.an ? (
                <Knopf size="s" variant="secondary" icon="Share2" onClick={() => w.h.teilen(d)}>
                  {T.aktionen.teilen}
                </Knopf>
              ) : null
            }
            testid="abl-freigaben-reiter"
          >
            {d.portal_freigabe ? (
              <p className="bo-abl-hinweis mb-3">
                <Globe className="size-4" strokeWidth={1.75} />
                {T.status.portal}
                {d.portal_ablauf ? ` · ${T.teilen.ablauf(datumKurz(d.portal_ablauf))}` : ""}
              </p>
            ) : null}
            {links.length ? (
              <ul>
                {links.map((l) => {
                  const st = freigabeStatus(l);
                  return (
                    <li key={l.freigabelink} className="bo-abl-linkzeile">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bo-surface-2">
                        <Link2 className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{l.empfaenger_hinweis || T.teilen.link}</span>
                        <span className="block text-xs text-bo-text-soft tabular-nums">
                          {T.teilen.ablauf(datumKurz(l.ablauf))} · {T.teilen.downloads(l.downloads, l.max_downloads)}
                          {l.passwort ? ` · ${T.teilen.mitPasswort}` : ""} · {person(l.erstellt_von, namen)}
                        </span>
                      </span>
                      <Pille material={FREIGABE_STATUS[st]?.material || "stein"}>{FREIGABE_STATUS[st]?.titel || st}</Pille>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Leer titel={T.teilen.keineAktiv} groesse="karte" />
            )}
          </Kachel>
        )}

        {aktiv === "details" && (
          <Kachel titel={T.akte.reiter.details} testid="abl-details">
            <dl className="bo-abl-fakten">
              <div>
                <dt>{T.akte.details.tags}</dt>
                <dd>{d.tags?.length ? d.tags.join(", ") : "–"}</dd>
              </div>
              <div>
                <dt>{T.akte.details.klasse}</dt>
                <dd>{d.aufbewahrungsklasse || "Allgemein"}</dd>
              </div>
              <div className="col-span-2">
                <dt>{T.akte.details.beschreibung}</dt>
                <dd className="font-normal">{d.beschreibung || "–"}</dd>
              </div>
              <div>
                <dt>{T.akte.details.bis}</dt>
                <dd>{d.aufbewahren_bis ? datumKurz(d.aufbewahren_bis) : "–"}</dd>
              </div>
              <div>
                <dt>{T.akte.details.loeschsperre}</dt>
                <dd>{d.loeschsperre ? T.akte.details.ja : T.akte.details.nein}</dd>
              </div>
              <div className="col-span-2">
                <dt>{T.akte.details.pruefsumme}</dt>
                <dd className="font-mono text-xs break-all">{d.sha256 || "–"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-5">
              {a.tags.an && (
                <Knopf size="s" variant="secondary" icon="Tag" onClick={() => w.h.tags(d)}>
                  {T.aktionen.tags}
                </Knopf>
              )}
              {(a.aufbewahrung.an || a.aufbewahrung.grund) && (
                <Knopf size="s" variant="secondary" icon="Shield" onClick={() => w.h.aufbewahrung(d)} disabled={!a.aufbewahrung.an} grund={a.aufbewahrung.grund || undefined}>
                  {T.aktionen.aufbewahrung}
                </Knopf>
              )}
            </div>
          </Kachel>
        )}

        {aktiv === "verlauf" && (
          <Kachel titel={T.akte.reiter.verlauf} testid="abl-verlauf">
            {verlauf === null ? (
              <p className="text-sm text-bo-text-soft">{T.akte.verlaufNurLeitung}</p>
            ) : verlauf.length ? (
              <ol className="bo-abl-zeitleiste">
                {verlauf.map((e) => {
                  const Ico = EREIGNIS_ICON[e.art] || History;
                  return (
                    <li key={e.name}>
                      <span className="bo-abl-zeitleiste__ico">
                        <Ico className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{anzeige(e.art)}</span>
                        <span className="block truncate text-xs text-bo-text-soft">
                          {person(e.benutzer, namen)}
                          {e.version ? ` · Version ${e.version}` : ""}
                          {e.hinweis ? ` · ${e.hinweis}` : ""}
                        </span>
                      </span>
                      <span className="text-xs whitespace-nowrap text-bo-text-soft" suppressHydrationWarning title={titelZeit(e.zeitpunkt)}>
                        {wann(e.zeitpunkt)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-bo-text-soft">{T.leer.verlauf}</p>
            )}
          </Kachel>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-6" aria-label="Details">
        <Kachel titel={T.akte.reiter.details} dicht>
          <dl className="bo-abl-fakten">
            <div>
              <dt>{T.akte.details.art}</dt>
              <dd>{(d.endung || "–").toUpperCase()}</dd>
            </div>
            <div>
              <dt>{T.panel.fakten.groesse}</dt>
              <dd className="tabular-nums">{d.groesse_text}</dd>
            </div>
            <div>
              <dt>{T.panel.fakten.version}</dt>
              <dd className="tabular-nums">{d.version}</dd>
            </div>
            <div>
              <dt>{T.panel.fakten.geaendert}</dt>
              <dd suppressHydrationWarning title={titelZeit(d.geaendert)}>
                {wann(d.geaendert)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt>{T.panel.fakten.von}</dt>
              <dd>
                <Avatar name={person(d.hochgeladen_von, namen)} groesse={24} dekorativ />
                {person(d.hochgeladen_von, namen)}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-4">
            {sperre && <Pille material={sperre === "fremd" ? "eiche" : "see"}>{sperre === "fremd" ? "Ausgecheckt" : "Von dir ausgecheckt"}</Pille>}
            {d.aufbewahrungsklasse === "Beleg" && <Pille material="cognac">{T.status.beleg(datumKurz(d.aufbewahren_bis))}</Pille>}
            {d.portal_freigabe ? <Pille material="messing">{T.status.portal}</Pille> : null}
            {d.status === "Papierkorb" && <Pille material="stein">{T.status.papierkorb(resttage(d.papierkorb_bis))}</Pille>}
          </div>
        </Kachel>
        <Kachel titel="Bezüge" dicht>
          <ul className="flex flex-col gap-1 text-sm">
            {ordner && (
              <li>
                <Link className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-bo-fill" href={`/ablage?ordner=${encodeURIComponent(ordner.ordner)}`}>
                  <span className="text-xs text-bo-text-soft">{T.akte.details.ordner}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-medium">{ordner.titel}</span>
                </Link>
              </li>
            )}
            {bezug && (
              <li>
                <Link className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-bo-fill" href={bezug.href}>
                  <span className="text-xs text-bo-text-soft">{bezug.art}</span>
                  <span className="min-w-0 flex-1 truncate text-right font-medium">{bezug.titel}</span>
                </Link>
              </li>
            )}
            <li className="flex items-center gap-3 px-2 py-2">
              <span className="text-xs text-bo-text-soft">Nummer</span>
              <span className="min-w-0 flex-1 truncate text-right font-mono text-xs">{d.datei}</span>
            </li>
          </ul>
        </Kachel>
      </aside>

      {art === "bild" && (
        <Lightbox
          offen={lightbox}
          onSchliessen={() => setLightbox(false)}
          medien={[{ src: ladenHref(d, { inline: true, version: d.version }), titel: d.dateiname, vorschau: vorschauSrc(d), download: ladenHref(d) }]}
          titel={d.dateiname}
          herunterladen={a.herunterladen.an}
        />
      )}
      {w.dialoge}
    </div>
  );
}
