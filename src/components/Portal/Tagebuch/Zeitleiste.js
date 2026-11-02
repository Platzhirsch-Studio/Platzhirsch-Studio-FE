// Zeitleiste des Projekt-Tagebuchs (Server Component): Handzeichnung → Modell →
// Rendering → Lieferung → Montage → Vorher → Nachher. Leere Phasen sagen ehrlich,
// was fehlt; für Handzeichnung und Modell wird nie ein Ersatzbild gezeigt
// (Kern-USP Nr. 8: nur echtes Material).
import Link from "next/link";
import { PHASEN } from "@/lib/portal/tagebuch/config";
import { formatDate } from "@/lib/portal/format";
import { Badge } from "@/components/Portal/Core/ui";
import TagebuchBild, { privateUrl } from "./TagebuchBild";
import FotoLoeschen from "./FotoLoeschen";

/**
 * @param {{ projektId:string, gruppen:Record<string, object[]>, skizzen:object[], renderings:number, rolle:"kunde"|"team", s:(k:string,v?:object)=>string }} props
 */
export default function Zeitleiste({ projektId, gruppen, skizzen = [], renderings = 0, rolle, s }) {
  return (
    <ol className="relative space-y-8 border-l border-ink/15 pl-5 sm:pl-8" aria-label={s("timelineTitle")}>
      {PHASEN.map((p, i) => {
        const fotos = gruppen[p.key] || [];
        const raumSkizzen = p.key === "skizze" ? skizzen : [];
        const leer = fotos.length === 0 && raumSkizzen.length === 0;
        return (
          <li key={p.key} className="relative" aria-labelledby={`tb-phase-${p.key}`}>
            <span aria-hidden="true" className={`absolute top-1.5 -left-[25px] size-2.5 sm:-left-[37px] ${leer ? "border border-pebble bg-[#faf8f4]" : "bg-ink"}`} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/70">{String(i + 1).padStart(2, "0")}</p>
            <h3 id={`tb-phase-${p.key}`} className="mt-1 font-display text-xl text-ink sm:text-2xl">
              {s(`phase_${p.key}`)}
            </h3>
            <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-ink/80">{s(`phaseText_${p.key}`)}</p>

            {leer ? (
              <p className="mt-3 bg-bone px-4 py-3 text-sm text-ink/75">{p.nurTeam ? s("emptyStudio") : s("emptyOpen")}</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {raumSkizzen.map((sk) => (
                  <li key={sk.id}>
                    <figure className="m-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- private Route, kein Optimizer */}
                      <img
                        src={`/api/portal/raum/${encodeURIComponent(projektId)}/datei/skizze/${sk.id}`}
                        alt={sk.titel || s("phase_skizze")}
                        width={sk.breite}
                        height={sk.hoehe}
                        loading="lazy"
                        decoding="async"
                        className="block h-auto w-full bg-stone"
                        style={{ aspectRatio: `${sk.breite} / ${sk.hoehe}` }}
                      />
                      <figcaption className="mt-2 text-sm text-ink/80">
                        <span className="font-semibold text-ink">{sk.titel}</span>
                        <br />
                        <span className="text-xs text-ink/70">
                          {sk.urheber} · {s("sketchFromRoom")}
                        </span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
                {fotos.map((f) => (
                  <li key={f.id}>
                    <figure className="m-0">
                      <TagebuchBild foto={f} url={privateUrl(projektId, f.id)} alt={f.titel || `${s(`phase_${p.key}`)}, ${formatDate(f.hochgeladenAm)}`} />
                      <figcaption className="mt-2 flex items-start justify-between gap-2 text-sm text-ink/80">
                        <span className="min-w-0">
                          {f.titel && <span className="block font-semibold text-ink">{f.titel}</span>}
                          <span className="block text-xs text-ink/70">{s("byOn", { autor: f.autor, datum: formatDate(f.hochgeladenAm) })}</span>
                          <span className="mt-1 flex flex-wrap gap-1.5">
                            {f.beispiel && <Badge tone="ai">{s("example")}</Badge>}
                            {f.gpsEntfernt && <Badge>{s("gpsRemoved")}</Badge>}
                          </span>
                        </span>
                        {(rolle === "team" || f.von === "kunde") && !f.beispiel && <FotoLoeschen projektId={projektId} fotoId={f.id} titel={f.titel || s(`phase_${p.key}`)} />}
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            )}

            {p.key === "rendering" && renderings > 0 && rolle === "kunde" && (
              <p className="mt-3 text-sm">
                <Link
                  href={`/de/portal/projekte/${encodeURIComponent(projektId)}`}
                  className="inline-flex min-h-11 items-center text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {s("renderingsLink")}
                </Link>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
