import { Box, Clapperboard, FileSpreadsheet, FileText, FileType, Image as ImageIcon, Music, TriangleAlert } from "lucide-react";
import cx from "../cx";
import { darstellung, typKuerzel, vorschauArt } from "@/lib/backoffice/ablage/regeln";

// Vorschaubild einer Datei (Lounge: echte Raum-/Produktbilder, sonst Endungs-Kachel auf Materialfläche).
// Server- und Client-tauglich (keine Hooks). Bild kommt lazy über /ablage/laden/<datei>?vorschau=1 –
// der Browser spricht nie mit Frappe (Route im Backoffice).

const ICON = { pdf: FileText, office: FileSpreadsheet, cad: Box, video: Clapperboard, audio: Music, text: FileType, bild: ImageIcon, keine: FileText };

export function vorschauSrc(d, { gross = false } = {}) {
  return `/ablage/laden/${encodeURIComponent(d.datei)}?vorschau=1&v=${d.version || 1}${gross ? "&gross=1" : ""}`;
}

/** Gruppe für die Farbe der Endungs-Kachel. */
export function gruppe(d) {
  const art = d?.vorschau_art || vorschauArt(d?.endung);
  return ["pdf", "office", "cad", "video", "audio", "bild", "text"].includes(art) ? art : "sonst";
}

/**
 * @param {object} p
 * @param {object} p.datei   Datei-Antwort (datei, endung, vorschau_art, vorschau_status, version)
 * @param {boolean} [p.klein]  Daumen in Listen (ohne Kürzel)
 * @param {boolean} [p.officeVorschau]
 * @param {"lazy"|"eager"} [p.laden]
 */
export default function Vorschaubild({ datei, klein = false, officeVorschau = false, laden = "lazy", className }) {
  const art = darstellung(datei, { officeVorschau });
  const bildOk = art === "bild" && ["Fertig", "Browser"].includes(datei?.vorschau_status || "Fertig");
  if (bildOk) {
    // eslint-disable-next-line @next/next/no-img-element -- Vorschau aus dem eigenen Speicher, Größe unbekannt
    return <img src={vorschauSrc(datei)} alt="" loading={laden} decoding="async" className={cx("bo-abl-bild", className)} draggable={false} />;
  }
  const g = gruppe(datei);
  const Ico = ICON[g] || FileText;
  const fehler = datei?.vorschau_status === "Fehler";
  return (
    <div className={cx("bo-abl-typ", klein && "bo-abl-typ--klein", className)} data-gruppe={g} aria-hidden="true">
      <span className="bo-abl-typ__blatt">
        <Ico className={klein ? "size-4" : "size-6"} strokeWidth={1.75} />
      </span>
      {typKuerzel(datei?.endung) && <span className="bo-abl-typ__kuerzel">{typKuerzel(datei?.endung)}</span>}
      {fehler && !klein && (
        <span className="bo-abl-typ__status">
          <TriangleAlert className="size-4" strokeWidth={1.75} />
        </span>
      )}
    </div>
  );
}
