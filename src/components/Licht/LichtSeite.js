"use client";
// Bodensee-Licht (N4) – Seite /de/bodensee-licht: 3D-Bühne (Küche oder Pool),
// Lichtrad, Sonnenbahn, Fenster-Sonnenzeiten, Aktionen (Link, Merkliste,
// Lichtblatt/PDF, Anfrage). Lichtzustand lebt in der URL (replaceState).
// Ohne WebGL: Text + SVG-Sonnenbahn (immer sichtbar), keine leere Fläche.
//
// R4 technik P1-1 / neuland P1-4 (TBT 3,8 s mobil, leere Ladefläche):
//   - Erstbild ist ein vorgerendertes Poster aus einer Stundensequenz
//     (src/lib/licht/poster.js, als berechnete Darstellung beschriftet). Es
//     steht im Server-HTML und ist das LCP-Bild; die Uhrzeit (auch „Tag
//     abspielen“) und der Szenenwechsel blättern nur in der Sequenz.
//   - three.js (LichtSzene) lädt erst, wenn jemand die 3D-Ansicht will: Knopf
//     „In 3D ansehen“, Tippen/Klicken auf die Bühne, Blickwechsel oder eine
//     Änderung, die das Poster nicht zeigt (Ort, Fenster, Datum). Auf Geräten
//     mit Maus und breitem Bildschirm zusätzlich, sobald die Bühne sichtbar
//     und der Browser im Leerlauf ist (IntersectionObserver + requestIdleCallback).
//   - Sonnenbahn, Tag und Fensterzeiten rechnet ein Web Worker
//     (useLichtDaten → src/lib/licht/rechner.worker.js); das erste Ergebnis
//     kommt vom Server.
//   - Reduzierte Bewegung: keine Überblendung, kein automatischer Lauf.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { dauer, fensterSonne, himmelsrichtung, uhrzeit } from "@/lib/licht/sonne";
import { lichtWerte } from "@/lib/licht/himmel";
import { anfrageText, datumText, kurzText, lichtQuery, ortVon, SZENEN, werttext, zustandSchluessel } from "@/lib/licht/zustand";
import { posterFuer } from "@/lib/licht/poster";
import { useLichtDaten } from "./useLichtDaten";
import LichtRad from "./LichtRad";
import SonnenBahn from "./SonnenBahn";
import css from "./licht.module.css";

// three.js-Szene als eigener Chunk, geladen erst wenn 3D gewünscht ist. Bewusst
// kein next/dynamic: dessen Chunk lud der Browser schon beim Seitenaufruf mit
// (r5-perf-shell.spec.js); import() im Effekt holt ihn erst bei Bedarf.
const ladeSzene = () => import("./LichtSzene");

const PFAD = "/de/bodensee-licht";

function webglMoeglich() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const knopfSek =
  "inline-flex min-h-12 items-center justify-center border border-ink px-5 text-ui text-ink transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper";

// Änderungen, die die Stundensequenz zeigen kann (alles andere startet 3D).
const POSTER_FAEHIG = new Set(["minuten", "szene"]);
const posterGenuegt = (a, b) =>
  ["ort", "lat", "lon", "fenster", "datum", "minuten", "szene"].every((k) => POSTER_FAEHIG.has(k) || a[k] === b[k]);

export default function LichtSeite({ start, startDaten }) {
  const [z, setZ] = useState(start);
  // 3D gewünscht (Interaktion bzw. Desktop sichtbar + Leerlauf). Bis dahin Poster.
  const [aktiv, setAktiv] = useState(false);
  const [gl, setGl] = useState("pruefen"); // pruefen | an | aus | fehler
  const [geladen, setGeladen] = useState(false);
  const [blick, setBlick] = useState("raum");
  const [mobil, setMobil] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [standbild, setStandbild] = useState(null);
  const apiRef = useRef(null);
  const buehneRef = useRef(null);
  const { addToCart } = useCart();

  // WebGL erst nach dem ersten Bild prüfen (ein leerer Canvas, kein three.js).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMobil(window.matchMedia("(max-width: 767px), (pointer: coarse)").matches);
      setGl(webglMoeglich() ? "an" : "aus");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Desktop (Maus, ≥ 1024 px, kein Datensparmodus): 3D, sobald die Bühne
  // sichtbar ist und der Browser nichts zu tun hat. Handys laden 3D nur auf Wunsch.
  useEffect(() => {
    if (gl !== "an" || aktiv) return undefined;
    const desktop = window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
    if (!desktop || navigator.connection?.saveData) return undefined;
    const el = buehneRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    let idle = 0;
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    const cic = window.cancelIdleCallback || clearTimeout;
    const io = new IntersectionObserver((eintraege) => {
      if (!eintraege.some((e) => e.isIntersecting)) return;
      io.disconnect();
      idle = ric(() => setAktiv(true), { timeout: 4000 });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (idle) cic(idle);
    };
  }, [gl, aktiv]);

  // Zustand → URL (ohne neuen Verlaufseintrag, gebündelt)
  useEffect(() => {
    const t = setTimeout(() => {
      const ziel = `?${lichtQuery(z)}`;
      if (window.location.search !== ziel) window.history.replaceState(window.history.state, "", `${PFAD}${ziel}`);
    }, 250);
    return () => clearTimeout(t);
  }, [z]);

  const ort = ortVon(z);
  // Sonnenstand, Tag, Bahn und Fensterzeiten aus dem Worker (erstes Ergebnis vom Server).
  const { sonne, tag, bahn, fensterZeiten } = useLichtDaten(z, startDaten);
  const licht = lichtWerte(sonne.hoehe);
  const fs = fensterSonne(sonne, { azimut: z.fenster });
  const poster = useMemo(() => posterFuer(z), [z]);
  const pool = z.szene === "pool";
  const datumLabel = datumText(z.datum);

  const zRef = useRef(z);
  useEffect(() => {
    zRef.current = z;
  }, [z]);
  const onChange = useCallback((neu) => {
    // Ort, Fenster oder Datum zeigt das Poster nicht: dann die genaue 3D-Ansicht.
    if (!posterGenuegt(zRef.current, neu)) setAktiv(true);
    zRef.current = neu;
    setZ(neu);
  }, []);
  const starte3D = () => setAktiv(true);
  const absoluteUrl = () => `${window.location.origin}${PFAD}?${lichtQuery(z)}`;

  const teilen = async () => {
    const url = absoluteUrl();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Bodensee-Licht", text: kurzText(z), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setHinweis("Link kopiert. Er öffnet genau diese Lichtstimmung.");
    } catch {
      setHinweis(`Link: ${url}`);
    }
  };

  const merken = () => {
    const schluessel = zustandSchluessel(z);
    addToCart({
      id: `licht-${schluessel}`,
      name: `Lichtstudie: ${kurzText(z)}`,
      image: null,
      category: "Bodensee-Licht",
      kategories: "bodensee-licht",
      url_slug: "bodensee-licht",
      href: `${PFAD}?${lichtQuery(z)}`,
      produkte_id: `licht-${schluessel}`,
      licht: { ...z },
    });
  };

  const lichtblatt = async () => {
    let bild = null;
    try {
      bild = gl === "an" ? apiRef.current?.standbild?.(1200) || null : null;
      // Ohne 3D: das Poster, wenn es genau diese Lichtstimmung zeigt.
      if (!bild && poster.genau) bild = poster.srcSet.split(", ").at(-1).split(" ")[0];
    } catch {
      bild = null;
    }
    setStandbild(bild);
    await new Promise((r) => setTimeout(r, 80));
    window.print();
  };

  const anfrageHref = `/de/beratung?produkt=${encodeURIComponent(anfrageText(z, `https://platzhirsch.studio${PFAD}?${lichtQuery(z)}`))}`;

  const sonnenSatz = (() => {
    if (sonne.hoehe <= -0.833) return licht.kunstlicht.an ? "Die Sonne ist untergegangen. In der Szene brennt jetzt das Kunstlicht." : "Die Sonne steht knapp unter dem Horizont. Nur der Himmel leuchtet noch.";
    if (pool) return `Die Sonne steht ${Math.round(sonne.hoehe)}° hoch im ${himmelsrichtung(sonne.azimut).name}. ${sonne.hoehe < 15 ? "Lange Schatten liegen über der Terrasse." : "Das Mosaik bekommt direktes Licht."}`;
    if (!fs.scheint) return "Gerade fällt keine direkte Sonne durch das Fenster, der Raum bekommt Himmelslicht.";
    const tiefe = fs.tiefeMax > 6 ? "mehr als 6 m" : `etwa ${fs.tiefeMax.toFixed(1).replace(".", ",")} m`;
    return `Die Sonne scheint durchs Fenster. Der Lichtfleck reicht ${tiefe} in den Raum.`;
  })();

  const zeigeSzene = gl === "an" && aktiv;
  const [LichtSzene, setLichtSzene] = useState(null);
  useEffect(() => {
    if (!zeigeSzene || LichtSzene) return undefined;
    let aus = false;
    ladeSzene()
      .then((m) => !aus && setLichtSzene(() => m.default))
      .catch(() => !aus && setGl("fehler"));
    return () => {
      aus = true;
    };
  }, [zeigeSzene, LichtSzene]);
  const zeigePoster = !zeigeSzene || !geladen;

  return (
    <div className="mx-auto max-w-page px-gutter pb-section">
      {/* Ein Raster ohne Zwischen-Container: So klebt die Bühne mobil über
          allen Reglern (sticky gilt bis zum Ende des Rasters). Reihenfolge (DOM = Bild):
          Bühne, Lichtrad, Tag, Aktionen; ab lg klebt die Bühne links, rechts laufen Rad, Tag, Aktionen. */}
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
          <div ref={buehneRef} className={`${css.buehne} -mx-gutter self-start bg-paper sm:mx-0 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1`}>
            <div
              className="relative aspect-[4/3] max-h-[44svh] w-full overflow-hidden bg-stone sm:max-h-none"
              data-licht-buehne={gl}
              data-licht-modus={zeigePoster ? "poster" : "3d"}
              onClick={gl === "an" && !aktiv ? starte3D : undefined}
            >
              {zeigeSzene && LichtSzene ? (
                <LichtSzene zustand={z} blick={blick} mobil={mobil} apiRef={apiRef} onFehler={() => setGl("fehler")} onBereit={() => setGeladen(true)} />
              ) : null}
              {zeigePoster ? (
                <>
                  {/* Vorgerendertes Erstbild (LCP), steht im Server-HTML. Kein next/image:
                      die Sequenz liegt fertig skaliert als WebP in public/licht/poster. */}
                  <picture>
                    {/* R5 (neuland P1-4): AVIF zuerst (kleiner → schnelleres LCP), WebP als Rückfall */}
                    <source type="image/avif" srcSet={poster.avifSrcSet} sizes="(min-width: 1024px) 56vw, 100vw" />
                    <img
                      src={poster.src}
                      srcSet={poster.srcSet}
                      sizes="(min-width: 1024px) 56vw, 100vw"
                      width={1280}
                      height={960}
                      alt={poster.text}
                      fetchPriority="high"
                      className="absolute inset-0 h-full w-full object-cover"
                      data-licht-poster=""
                    />
                  </picture>
                  {/* Sichtbare Kennzeichnung im Bild (gerechnet, kein Foto) */}
                  <p className="pointer-events-none absolute left-3 top-3 bg-paper/90 px-2 py-1 text-small text-ink" aria-hidden="true" data-licht-kennzeichnung="">
                    Visualisierung · berechnet
                  </p>
                  <div className="absolute inset-x-3 top-3 flex justify-end">
                    {gl === "aus" || gl === "fehler" ? (
                      <p className="max-w-sm bg-paper/95 px-3 py-2 text-small text-ink" data-kein-webgl="">
                        {gl === "fehler" ? "Die 3D-Ansicht wurde vom Browser beendet." : "Ihr Browser zeigt hier keine 3D-Ansicht."} Sonnenstand, Sonnenbahn und Zeiten unten gelten trotzdem genau.
                      </p>
                    ) : zeigeSzene ? (
                      <p className="bg-paper/95 px-3 py-2 text-small text-ink" role="status">
                        3D-Ansicht wird geladen …
                      </p>
                    ) : gl === "an" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          starte3D();
                        }}
                        className="min-h-11 border border-ink bg-paper px-4 text-small font-medium text-ink transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper"
                        data-licht-3d=""
                      >
                        In 3D ansehen
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}
              <p className="pointer-events-none absolute bottom-0 left-0 right-0 bg-linear-to-t from-ink-deep/70 to-transparent px-4 pb-3 pt-8 text-small text-paper tabular-nums" aria-hidden="true">
                {werttext(sonne, z.minuten)}
              </p>
            </div>
            {/* Kennzeichnung (AI Act Art. 50 sinngemäß, Bibel: nur echtes Material als Foto):
                das Erstbild ist gerechnet, keine Aufnahme und kein KI-Bild. */}
            <p className="px-gutter pt-2 text-small text-ink-soft sm:px-0" data-licht-bildtext="">
              {zeigePoster
                ? `${poster.text}${poster.genau ? "" : " Ihre genaue Einstellung zeigt die 3D-Ansicht."}`
                : "Schematisches Raummodell, in Ihrem Browser berechnet. Kein Foto."}
            </p>
            <div className="flex flex-wrap items-center gap-2 border-b border-line py-3 sm:border-0">
              <div role="group" aria-label="Szene" className="flex">
                {SZENEN.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={z.szene === s.id}
                    onClick={() => setZ((v) => ({ ...v, szene: s.id }))}
                    className="min-h-11 border border-pebble px-4 text-small font-medium text-ink -ml-px first:ml-0 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {zeigeSzene ? (
                <div role="group" aria-label="Blick" className="ml-auto flex">
                  {[
                    { id: "raum", name: pool ? "Terrasse" : "Zum Fenster" },
                    { id: "fenster", name: pool ? "Vom Haus" : "In den Raum" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={blick === b.id}
                      onClick={() => setBlick(b.id)}
                      className="min-h-11 border border-pebble px-4 text-small font-medium text-ink -ml-px first:ml-0 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

        {/* Lichtrad */}
          <section aria-labelledby="licht-rad" className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <h2 id="licht-rad" className="text-title">
              Ort, Richtung, Tag und Stunde
            </h2>
            <div className="mt-6">
              <LichtRad
                wert={z}
                onChange={onChange}
                fensterLabel={pool ? "Blick vom Haus" : "Fensterrichtung"}
                fensterHinweis={pool ? "In welche Richtung schauen Sie vom Haus auf das Becken?" : "Wohin schaut das Fenster nach draußen?"}
              />
            </div>
          </section>

          {/* Sonnenbahn und Zahlen (auch der Rückfall ohne WebGL) */}
          <section aria-labelledby="licht-tag" className="border-t border-line pt-6 lg:col-span-5 lg:col-start-8 lg:row-start-2">
            <h2 id="licht-tag" className="text-title">
              Der Tag in {ort.name}
            </h2>
            <p className="mt-2 text-body text-ink-soft">{datumLabel}</p>
            <p className="mt-4 max-w-measure text-body" data-sonnen-satz="">
              {sonnenSatz}
            </p>
            <div className="mt-6">
              <SonnenBahn bahn={bahn} tag={tag} aktuell={{ minuten: z.minuten, hoehe: sonne.hoehe }} fensterZeiten={pool ? null : fensterZeiten} ortName={ort.name} datumLabel={datumLabel} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4 lg:grid-cols-2">
              <Fakt titel="Aufgang" wert={tag.aufgang != null ? `${uhrzeit(tag.aufgang)} Uhr` : "–"} zusatz={tag.aufgangAzimut != null ? `im ${himmelsrichtung(tag.aufgangAzimut).name}` : null} />
              <Fakt titel="Höchster Stand" wert={`${Math.round(tag.hoeheMittag)}°`} zusatz={`um ${uhrzeit(tag.mittag)} Uhr`} />
              <Fakt titel="Untergang" wert={tag.untergang != null ? `${uhrzeit(tag.untergang)} Uhr` : "–"} zusatz={tag.untergangAzimut != null ? `im ${himmelsrichtung(tag.untergangAzimut).name}` : null} />
              {pool ? (
                <Fakt titel="Tageslänge" wert={dauer(tag.tageslaenge)} zusatz={tag.sommerzeit ? "MESZ" : "MEZ"} />
              ) : (
                <Fakt
                  titel="Sonne durchs Fenster"
                  wert={fensterZeiten.summe ? dauer(fensterZeiten.summe) : "keine"}
                  zusatz={fensterZeiten.bereiche.map((b) => `${uhrzeit(b.von)}–${uhrzeit(b.bis)} Uhr`).join(", ") || `Fenster nach ${himmelsrichtung(z.fenster).name}`}
                  data="fenster-sonne"
                />
              )}
            </dl>
            {!pool ? (
              <p className="mt-4 text-small text-ink-soft">
                <span aria-hidden="true" className="mr-2 inline-block h-1.5 w-6 bg-brass-500 align-middle" />
                Messinglinie unter der Bahn: Zeiten mit direkter Sonne durch ein Fenster nach {himmelsrichtung(z.fenster).name}, ohne Berge, Bäume und Nachbarhäuser.
              </p>
            ) : null}
          </section>

          <section aria-labelledby="licht-aktion" className="border-t border-line pt-6 lg:col-span-5 lg:col-start-8 lg:row-start-3">
            <h2 id="licht-aktion" className="text-title">
              Diese Lichtstimmung mitnehmen
            </h2>
            <p className="mt-2 text-body text-ink-soft" data-kurztext="">
              {kurzText(z)}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={anfrageHref} className="inline-flex min-h-12 items-center justify-center bg-ink px-5 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-ink-deep" data-anfrage="">
                Mit dieser Lichtstudie anfragen
              </Link>
              <button type="button" className={knopfSek} onClick={merken} data-merken="">
                Merken
              </button>
              <button type="button" className={knopfSek} onClick={teilen}>
                Link teilen
              </button>
              <button type="button" className={knopfSek} onClick={lichtblatt} data-lichtblatt-knopf="">
                Lichtblatt drucken oder als PDF
              </button>
            </div>
            <p className="mt-3 min-h-6 text-small text-ink-soft" role="status">
              {hinweis}
            </p>
          </section>
      </div>

      <Lichtblatt z={z} sonne={sonne} tag={tag} bahn={bahn} fensterZeiten={fensterZeiten} standbild={standbild} pool={pool} />
    </div>
  );
}

function Fakt({ titel, wert, zusatz, data }) {
  return (
    <div data-fakt={data}>
      <dt className="text-overline uppercase text-ink-soft">{titel}</dt>
      <dd className="mt-1 text-ui tabular-nums">{wert}</dd>
      {zusatz ? <dd className="text-small text-ink-soft tabular-nums">{zusatz}</dd> : null}
    </div>
  );
}

/** Druck-/PDF-Blatt: auf dem Bildschirm unsichtbar, beim Drucken das Einzige. */
function Lichtblatt({ z, sonne, tag, bahn, fensterZeiten, standbild, pool }) {
  const ort = ortVon(z);
  const url = `https://platzhirsch.studio${PFAD}?${lichtQuery(z)}`;
  return (
    <>
      <style>{`
        [data-lichtblatt] { display: none; }
        @media print {
          @page { size: A4; margin: 16mm; }
          /* PDF-Muster 02.11.2026: Vorher „visibility: hidden“ für den Rest der Seite – die unsichtbare
             Seite nahm aber weiter Platz ein, das Lichtblatt (absolut oben) wurde von 7 leeren Seiten
             gefolgt. Jetzt verschwindet alles außer dem Blatt und seinen Vorfahren aus dem Fluss. */
          body *:not([data-lichtblatt]):not([data-lichtblatt] *):not(:has([data-lichtblatt])) { display: none !important; }
          body, body :has([data-lichtblatt]) { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: 0 !important; }
          [data-lichtblatt] { display: block; width: 100%; background: #fff; color: #30373e; }
        }
      `}</style>
      <article data-lichtblatt="" aria-hidden="true">
        <p style={{ font: "500 10pt var(--font-sans)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Platzhirsch Home Living · Bodensee-Licht</p>
        <p style={{ font: "400 26pt var(--font-display)", margin: "6mm 0 2mm" }}>Lichtstudie {pool ? "Pool" : "Küche"}</p>
        <p style={{ font: "400 12pt var(--font-sans)" }}>{kurzText(z)}</p>
        <p style={{ font: "400 12pt var(--font-sans)", marginTop: "2mm" }}>{werttext(sonne, z.minuten)} (Azimut {Math.round(sonne.azimut)}°).</p>
        {/* Druck 02.11.: Standbild (16:10, 60 % Breite) und Sonnen-Kennzahlen nebeneinander statt Bild in
            voller Breite + Kennzahlzeile darunter – vorher rutschten die Schlusszeilen allein auf Seite 2. */}
        <div style={{ display: "flex", gap: "6mm", alignItems: "flex-start", marginTop: "5mm" }}>
          {standbild ? (
            <figure style={{ margin: 0, flex: "0 0 60%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={standbild} alt="" style={{ display: "block", width: "100%", aspectRatio: "16 / 10", objectFit: "cover" }} />
              {/* Pflichtunterschrift bei Renderings (wie „Visualisierung · berechnet“ am Bildschirm) */}
              <figcaption style={{ font: "400 9pt var(--font-sans)", marginTop: "2mm", color: "#5b6168" }}>Visualisierung (Rendering) · schematisches Raummodell, berechnetes Licht – kein Foto.</figcaption>
            </figure>
          ) : null}
          <dl style={{ margin: 0, flex: "1 1 auto", font: "400 11pt var(--font-sans)", lineHeight: 1.4 }}>
            <dt style={{ color: "#5b6168", fontSize: "9pt" }}>Aufgang</dt>
            <dd style={{ margin: "0 0 2mm" }}>{tag.aufgang != null ? `${uhrzeit(tag.aufgang)} Uhr` : "–"}</dd>
            <dt style={{ color: "#5b6168", fontSize: "9pt" }}>Höchster Stand</dt>
            <dd style={{ margin: "0 0 2mm" }}>{Math.round(tag.hoeheMittag)}° um {uhrzeit(tag.mittag)} Uhr</dd>
            <dt style={{ color: "#5b6168", fontSize: "9pt" }}>Untergang</dt>
            <dd style={{ margin: "0 0 2mm" }}>{tag.untergang != null ? `${uhrzeit(tag.untergang)} Uhr` : "–"}</dd>
            {!pool ? (
              <>
                <dt style={{ color: "#5b6168", fontSize: "9pt" }}>Sonne durchs Fenster</dt>
                <dd style={{ margin: 0 }}>{fensterZeiten.summe ? fensterZeiten.bereiche.map((b) => `${uhrzeit(b.von)}–${uhrzeit(b.bis)}`).join(", ") + " Uhr" : "keine"}</dd>
              </>
            ) : null}
          </dl>
        </div>
        <div style={{ marginTop: "4mm" }}>
          <SonnenBahn id="blatt-bahn" bahn={bahn} tag={tag} aktuell={{ minuten: z.minuten, hoehe: sonne.hoehe }} fensterZeiten={pool ? null : fensterZeiten} ortName={ort.name} datumLabel={datumText(z.datum)} />
        </div>
        <p style={{ font: "400 10pt var(--font-sans)", marginTop: "5mm" }}>
          Berechnet nach dem NOAA-Sonnenstandsverfahren für {ort.name}. Berge, Bäume, Nachbarhäuser und Spiegelungen vom See sind nicht enthalten. Das Licht vor Ort sehen wir uns bei Ihnen an. Schematisches Raummodell, keine Planung.
        </p>
        <p style={{ font: "400 10pt var(--font-sans)", marginTop: "3mm" }}>Diese Lichtstimmung öffnen: {url}</p>
        <p style={{ font: "400 10pt var(--font-sans)", marginTop: "3mm" }} suppressHydrationWarning>
          Platzhirsch Home Living · Landstraße 11 · 6911 Lochau am Bodensee · +43 5574 46255 · info@platzhirsch.studio · Blatt erstellt am {new Intl.DateTimeFormat("de-AT", { dateStyle: "medium", timeZone: "Europe/Vienna" }).format(new Date())}
        </p>
      </article>
    </>
  );
}
