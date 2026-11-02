// Sofaplaner – Texte je Sprache (eigene Copy-Dateien, Fix-Runde 1, F2).
// Der Planer selbst ist deutsch; die Hinweise liegen für alle vier Sprachen
// bereit (Marken-/Landingseiten können sie übernehmen).
import de from "./de.js";
import en from "./en.js";
import fr from "./fr.js";
import it from "./it.js";
import { SOURCE_COPY } from "../consent.js";
import { planTerminHref } from "../../kuechenplaner/planTermin.js";

const COPY = { de, en, fr, it };

/** Texte für eine Sprache, Rückfall Deutsch. */
export function sofaplanerCopy(locale = "de") {
  return COPY[locale] || COPY.de;
}

/** Früher Ausgang zum Termin (ab Schritt 1), mit Planer-Kontext (Rat 9,5 A12: überall thema=sofa&planer=sofaplaner). */
export const TERMIN_HREF = planTerminHref({ locale: "de", planer: "sofaplaner", produkt: SOURCE_COPY.terminProdukt });
