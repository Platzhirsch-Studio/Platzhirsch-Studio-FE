import cx from "./cx";
import { Icon } from "./icons";
import Knopf from "./Knopf";

// Leerer Zustand im Lounge-Stil (03 §8.18, Q-E2): kein gestrichelter Rahmen, sondern eine ruhige,
// eingelassene Fläche (Radius 20) mit Symbol im weichen Kreis, Titel 17/600 und einem Satz.
// Drei Fälle mit eigenem Text, dazu „kein Recht“:
//   art="leer"       noch nie Daten: Erklärung + erster Schritt (`aktion`)
//   art="gefiltert"  Filter ohne Treffer: „Filter zurücksetzen“ (`zuruecksetzenHref`)
//   art="erledigt"   alles erledigt: ruhiges Häkchen in Salbei, keine Aktion
//   art="recht"      kein Zugriff: Schloss, „Bitte Leitung fragen“, keine Aktion
// Mindesthöhe 240 px (Seite/Tabelle) bzw. 160 px in Karten (`groesse="karte"`, kleineres Symbol,
// ohne eigene Fläche). Max. 2 Zeilen Text, keine Ausrufezeichen, keine Zahlen.
export const TEXTE = {
  leer: { titel: "Keine Einträge", icon: "Inbox" },
  gefiltert: { titel: "Keine Treffer", text: "Für die gewählten Filter gibt es nichts.", icon: "SearchX", aktion: "Filter zurücksetzen" },
  erledigt: { titel: "Alles erledigt", text: "Hier ist gerade nichts zu tun.", icon: "Check" },
  recht: { titel: "Kein Zugriff", text: "Bitte Leitung fragen.", icon: "Lock" },
};

/**
 * @param {object} p
 * @param {"leer"|"gefiltert"|"erledigt"|"recht"} [p.art]
 * @param {string} [p.titel]
 * @param {string} [p.text]
 * @param {import("react").ReactNode} [p.aktion]   erster Schritt (meist ein Knopf); nur bei „leer“
 * @param {import("react").ReactNode} [p.nebenaktion]  z. B. „Mehr zu Anfragen“
 * @param {string} [p.zuruecksetzenHref]           bei „gefiltert“: Link „Filter zurücksetzen“
 * @param {string} [p.icon]
 * @param {"seite"|"karte"} [p.groesse]
 * @param {boolean} [p.rahmen]  eingelassene Fläche (Standard ja bei „seite“); Name aus v1 beibehalten
 */
export default function Leer({ art = "leer", titel, text, aktion, nebenaktion, zuruecksetzenHref, icon, groesse = "seite", rahmen, className, testid }) {
  const t = TEXTE[art] || TEXTE.leer;
  const karte = groesse === "karte";
  const mitFlaeche = rahmen ?? !karte;
  const symbol = icon || t.icon;
  const erledigt = art === "erledigt";
  const aktionen =
    art === "erledigt" || art === "recht"
      ? null
      : art === "gefiltert"
        ? aktion || (zuruecksetzenHref ? <Knopf href={zuruecksetzenHref} icon="X">{t.aktion}</Knopf> : null)
        : aktion;
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center px-6 text-center",
        karte ? "min-h-40 py-6" : "min-h-60 py-10",
        mitFlaeche && "rounded-bo-karte bg-bo-surface-2 shadow-[inset_0_0_0_var(--bo-hair)_var(--color-bo-line)]",
        className
      )}
      data-leer={art}
      data-testid={testid}
    >
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex items-center justify-center rounded-pill",
          karte ? "mb-3 size-10" : "mb-4 size-14",
          erledigt ? "bg-bo-salbei-soft text-bo-salbei-text" : "bg-bo-fill-2 text-bo-text-soft"
        )}
      >
        <Icon name={erledigt ? "Check" : symbol} className={karte ? "size-5" : "size-6"} />
      </span>
      <p className={cx("font-semibold text-bo-text", karte ? "text-[15px] leading-[22px]" : "text-[17px] leading-6 tracking-[-0.012em]")}>{titel || t.titel}</p>
      {(text || t.text) && <p className="mt-1 line-clamp-2 max-w-[44ch] text-sm leading-5 text-bo-text-soft">{text || t.text}</p>}
      {(aktionen || nebenaktion) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {aktionen}
          {nebenaktion}
        </div>
      )}
    </div>
  );
}
