"use client";
// Portal-Ansicht „Ihr Raum“: Ebenen Raum · Planung · Skizze, Standpunkte,
// 3D-Ansicht (WebGL2) oder Standbilder, Planung als Tabelle und Grundriss,
// Kommentare an Raumpunkten. Ohne WebGL2: Standbilder + Liste, gleiche Kommentare.
/* eslint-disable @next/next/no-img-element -- private Skizzen über geschützte Route */
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Eye, Image as ImageIcon, PenLine, Ruler } from "lucide-react";
import { DATUM, MASS_HINWEIS } from "@/lib/raumzwilling/config";
import { MASS_HAFTUNG } from "@/lib/raumzwilling/einwilligung";
import { hatWebgl2 } from "./webgl";
import Standbilder from "./Standbilder";
import VolumenTabelle from "./VolumenTabelle";
import Grundriss from "./Grundriss";
import Kommentare from "./Kommentare";

const RaumViewer = dynamic(() => import("./RaumViewer"), {
  ssr: false,
  loading: () => <div className="grid h-[min(68vh,640px)] place-items-center border border-ink/15 bg-stone text-sm text-ink">3D-Ansicht wird vorbereitet …</div>,
});

const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const EBENEN = [
  { key: "raum", label: "Raum", Icon: Box },
  { key: "planung", label: "Planung", Icon: Ruler },
  { key: "skizze", label: "Skizze", Icon: PenLine },
];

function Skizzen({ projektId, skizzen }) {
  if (!skizzen.length) {
    return (
      <div className="border border-dashed border-ink/25 bg-bone p-5 text-[15px] leading-relaxed text-ink/85">
        <p className="font-semibold text-ink">Haralds Skizze folgt.</p>
        <p className="mt-1">
          Harald Menghin zeichnet Ihren Raum von Hand, sobald er ihn kennt: vor Ort oder anhand dieses Zwillings. Hier erscheint dann ein Scan seiner Originalzeichnung. Bis dahin zeigen wir bewusst nichts anderes an dieser Stelle.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {skizzen.map((s) => (
        <li key={s.id}>
          <figure className="m-0 border border-ink/10 bg-white p-3">
            <img src={`/api/portal/raum/${projektId}/datei/skizze/${s.datei.replace(/\.webp$/, "")}`} alt={`Handzeichnung von ${s.urheber}: ${s.titel}`} width={s.breite} height={s.hoehe} className="block h-auto w-full" loading="lazy" decoding="async" />
            <figcaption className="mt-2 text-xs text-ink/75">
              {s.titel} · {s.urheber}, Handzeichnung vom {DATUM.format(new Date(s.datum))} · Scan des Originals
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export default function RaumAnsicht({ projektId, raum, rolle }) {
  const [ebenen, setEbenen] = useState({ raum: true, planung: true, skizze: (raum.skizzen || []).length > 0 });
  const [webgl, setWebgl] = useState(null);
  const [nurBilder, setNurBilder] = useState(false);
  const [viewerFehler, setViewerFehler] = useState(false);
  const [auswahl, setAuswahl] = useState(null);
  const [kommentare, setKommentare] = useState(raum.kommentare || []);
  const [punkt, setPunkt] = useState(null);
  const [pickAktiv, setPickAktiv] = useState(false);
  const [fokusId, setFokusId] = useState(null);
  const [standpunkt, setStandpunkt] = useState(0);
  const viewer = useRef(null);
  const volumen = raum.platzierung?.volumen || [];
  const hat3d = Boolean(raum.splat) && raum.status === "bereit";

  useEffect(() => {
    // Erst im Browser entscheiden (SSR kennt kein WebGL2).
    const id = requestAnimationFrame(() => setWebgl(hatWebgl2()));
    return () => cancelAnimationFrame(id);
  }, []);

  const zeige3d = hat3d && webgl === true && !nurBilder && !viewerFehler;
  const onPickModus = useCallback((an) => {
    setPickAktiv(an);
    if (!an) setPunkt(null);
  }, []);

  const markierungen = punkt ? [{ welt: punkt, groesse: 0.04 }] : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      {raum.kennzeichnung && (
        <p className="border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-ink" data-testid="kennzeichnung">
          <strong className="font-semibold">Hinweis:</strong> {raum.kennzeichnung}
        </p>
      )}

      <section aria-labelledby="raum-ansicht" className="space-y-3">
        <h2 id="raum-ansicht" className="sr-only">
          Ihr Raum
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Ebenen" className="flex flex-wrap gap-2">
            {EBENEN.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={ebenen[key]}
                onClick={() => setEbenen((e) => ({ ...e, [key]: !e[key] }))}
                className={`inline-flex min-h-11 items-center gap-1.5 border px-4 text-sm ${fokus} ${ebenen[key] ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink/50"}`}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
          {hat3d && webgl && (
            <button type="button" onClick={() => setNurBilder((b) => !b)} className={`inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink ${fokus}`}>
              {nurBilder ? <Eye size={15} aria-hidden="true" /> : <ImageIcon size={15} aria-hidden="true" />}
              {nurBilder ? "3D-Ansicht zeigen" : "Als Standbilder ansehen"}
            </button>
          )}
        </div>

        <div className={ebenen.skizze ? "grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}>
          <div className="min-w-0 space-y-3">
            {zeige3d ? (
              <>
                {raum.standpunkte?.length > 0 && (
                  <div role="group" aria-label="Standpunkte im Raum" className="flex flex-wrap gap-2">
                    {raum.standpunkte.map((sp, i) => (
                      <button
                        key={sp.key}
                        type="button"
                        aria-pressed={standpunkt === i}
                        onClick={() => {
                          setStandpunkt(i);
                          viewer.current?.geheZu(sp);
                        }}
                        className={`min-h-11 border px-3 text-sm ${fokus} ${standpunkt === i ? "border-ink text-ink" : "border-ink/15 text-ink/80 hover:border-ink/40"} bg-white`}
                      >
                        Blick {sp.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className={ebenen.raum || ebenen.planung ? "" : "hidden"}>
                  <RaumViewer
                    ref={viewer}
                    basis={`/api/portal/raum/${projektId}/datei/splat`}
                    transform={raum.transform}
                    standpunkte={raum.standpunkte}
                    volumen={volumen}
                    auswahl={auswahl}
                    kommentare={kommentare}
                    ebenen={{ raum: ebenen.raum, planung: ebenen.planung }}
                    markierungen={markierungen}
                    pickAktiv={pickAktiv}
                    onPick={(p) => p && setPunkt(p.welt.map((v) => Math.round(v * 1000) / 1000))}
                    onFehler={() => setViewerFehler(true)}
                    onPinKlick={(id) => setFokusId(id)}
                    onVolumenKlick={(id) => setAuswahl((a) => (a === id ? null : id))}
                  />
                </div>
                <p className="text-xs text-ink/75">
                  Ziehen: umsehen · Zwei Finger oder Mausrad: näher und weiter · Pfeiltasten: umsehen und gehen
                  {pickAktiv ? " · Tippen: Stelle für Ihren Kommentar wählen" : ""}
                </p>
              </>
            ) : (
              <>
                {hat3d && webgl === false && <p className="bg-bone px-4 py-3 text-sm text-ink/85">Ihr Gerät zeigt keine 3D-Ansicht (WebGL 2 fehlt). Hier sind Standbilder aus Ihrem Raum; Planung und Kommentare stehen darunter vollständig.</p>}
                {viewerFehler && <p className="bg-bone px-4 py-3 text-sm text-ink/85">Die 3D-Ansicht ließ sich nicht laden. Hier sind Standbilder; Planung und Kommentare stehen darunter.</p>}
                {raum.status === "nur-fotos" && (
                  <p className="bg-bone px-4 py-3 text-sm text-ink/85">Aus Ihrem Video ließ sich kein verlässlicher 3D-Raum bauen (zum Beispiel wegen Glas oder wenig Platz). Wir arbeiten mit diesen Standbildern und dem Grundriss weiter, so wie mit Fotos.</p>
                )}
                {(ebenen.raum || ebenen.planung) && <Standbilder projektId={projektId} standbilder={raum.standbilder} kennzeichnung={raum.kennzeichnung} />}
              </>
            )}
            <p className="flex items-start gap-2 border-l-2 border-brass-500 bg-white px-3 py-2 text-sm text-ink" data-testid="mass-hinweis">
              <Ruler size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">{MASS_HINWEIS}.</strong> {MASS_HAFTUNG}
                {raum.massstab && (
                  <span className="text-ink/75">
                    {" "}
                    Maßstab gesetzt über {raum.massstab.quelle === "a4" ? "ein A4-Blatt im Video" : `eine bekannte Strecke${raum.massstab.bezeichnung ? ` (${raum.massstab.bezeichnung}, ${String(raum.massstab.meter).replace(".", ",")} m)` : ""}`}.
                  </span>
                )}
              </span>
            </p>
          </div>
          {ebenen.skizze && (
            <aside aria-labelledby="skizze-titel" className="min-w-0">
              <h3 id="skizze-titel" className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
                Skizze von Harald Menghin
              </h3>
              <Skizzen projektId={projektId} skizzen={raum.skizzen || []} />
            </aside>
          )}
        </div>
      </section>

      {ebenen.planung && (
        <section aria-labelledby="planung-titel" className="border border-ink/10 bg-white p-5 sm:p-7">
          <h2 id="planung-titel" className="font-display text-xl text-ink sm:text-2xl">
            Planung in Ihrem Raum
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/80">
            Die Stücke stehen als ruhige Volumen in echten Herstellermaßen im Raum, nicht als nachgebaute Möbel. So sehen Sie Platz und Wege. Wie es aussieht, zeigt Haralds Skizze und später das Rendering.
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <VolumenTabelle volumen={volumen} grundriss={raum.grundriss} auswahl={auswahl} onAuswahl={(id) => setAuswahl((a) => (a === id ? null : id))} />
            <Grundriss grundriss={raum.grundriss} volumen={volumen} kommentare={kommentare} auswahl={auswahl} titel="Grundriss Ihres Raums mit geplanten Stücken" />
          </div>
        </section>
      )}

      <section aria-labelledby="kommentare-titel" className="border border-ink/10 bg-white p-5 sm:p-7">
        <h2 id="kommentare-titel" className="mb-4 font-display text-xl text-ink sm:text-2xl">
          Ihre Hinweise im Raum
        </h2>
        <Kommentare
          projektId={projektId}
          kommentare={kommentare}
          volumen={volumen}
          grundriss={raum.grundriss}
          punkt={punkt}
          pickVerfuegbar={zeige3d}
          pickAktiv={pickAktiv}
          onPickModus={onPickModus}
          onNeu={(k) => {
            setKommentare((l) => [...l, k]);
            setPunkt(null);
          }}
          onGeloescht={(id) => setKommentare((l) => l.filter((k) => k.id !== id))}
          fokusId={fokusId}
          rolle={rolle}
        />
      </section>
    </div>
  );
}
