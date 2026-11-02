// Vorschau der öffentlichen Projektseite (/de/projekte/<slug>) aus Auswahl und
// Nennung, so wie ProjektArtikel sie zeigt: Titel, Faktenzeile, Totale, weitere
// Bilder mit Bildnachweis. Titel und Text sind Platzhalter, bis das Studio sie
// formuliert (oder, im Team-Formular, die Entwürfe des Studios).
import TagebuchBild from "./TagebuchBild";
import { fotografVon, nennungVon, oeffentlicherOrt } from "@/lib/portal/tagebuch/anzeige";

/**
 * @param {{ projektId:string, fotos:object[], anzeige:{art:string, vorname?:string, ort?:string}, s:Function, titel?:string, text?:string }} props
 */
export default function ReferenzVorschau({ projektId, fotos, anzeige, s, titel, text }) {
  const url = (fotoId) => (datei) => `/api/portal/tagebuch/${encodeURIComponent(projektId)}/bild/${fotoId}-${datei}`;
  const nennung = nennungVon(anzeige);
  const [erstes, ...weitere] = fotos;
  return (
    <div className="border border-ink/15 bg-[#faf8f4] p-4 sm:p-6" aria-label={s("refStep3")} role="group">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-text">Projekt</p>
      <p className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">{titel || s("refPreviewTitle")}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-ink/10 pt-3 text-sm">
        <dt className="text-ink/70">{s("refPreviewPlace")}</dt>
        <dd className="m-0 text-ink">{oeffentlicherOrt(anzeige)}</dd>
        <dt className="text-ink/70">{s("refPreviewBy")}</dt>
        <dd className="m-0 text-ink">{nennung || s("refPreviewAnon")}</dd>
      </dl>
      {erstes && (
        <figure className="m-0 mt-4">
          <TagebuchBild foto={erstes} url={url(erstes.id)} alt={erstes.titel || ""} sizes="(min-width: 1024px) 720px, 100vw" />
          <figcaption className="mt-1 text-xs text-ink/70">{s("refPreviewPhoto", { wer: fotografVon(erstes, anzeige) })}</figcaption>
        </figure>
      )}
      <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-ink/85">{text || s("refPreviewText")}</p>
      {weitere.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {weitere.map((f) => (
            <li key={f.id}>
              <figure className="m-0">
                <TagebuchBild foto={f} url={url(f.id)} alt={f.titel || ""} sizes="(min-width: 640px) 240px, 50vw" />
                <figcaption className="mt-1 text-xs text-ink/70">{s("refPreviewPhoto", { wer: fotografVon(f, anzeige) })}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
