// src/lib/ezarri/lang.js – Sprache der Ezarri-Welt (Welle 2: Deutsch + Englisch).
//
// Inhaber-Auftrag 29.10.2026 (Nr. 13): Ezarri auf Englisch für internationale
// Eigner und Schweizer Kunden. Deutsch bleibt die Quelle (copy.js); die
// englischen Texte stehen in copy.en.js mit denselben Export-Namen, damit
// Seiten nur die Quelle tauschen: `const { HUB, LINKS } = ezCopy(locale)`.
//
// Client-Komponenten importieren die beiden Fassungen benannt (Tree-Shaking)
// und wählen mit ezLang(useLocale()); dieses Modul zieht beide Texte ganz.
//
// Werte aus den Ezarri-Daten (references.json: farben, oberflaeche, Varianten-
// gruppen) sind deutsch erfasst → wert() übersetzt sie für die Anzeige.
//
// Rein: keine Pakete, keine "@/"-Aliase. Server, Client und node --test.
import { ezLang } from "./werte.js";
import * as DE from "./copy.js";
import * as EN from "./copy.en.js";
import * as FR from "./copy.fr.js";
import * as IT from "./copy.it.js";
import * as KONF_DE from "./konfigurator/copy.js";
import * as KONF_EN from "./konfigurator/copy.en.js";
import * as RECHNER_DE from "./rechner/copy.js";
import * as RECHNER_EN from "./rechner/copy.en.js";

export { ezLang, ezT, wert, dezimal, herstellerText } from "./werte.js";

const COPY = { de: DE, en: EN, fr: FR, it: IT };

/** Alle Texte von copy.js bzw. copy.en.js / copy.fr.js / copy.it.js (01.11.2026: fr/it für die Ezarri-Welt). */
export const ezCopy = (locale) => COPY[ezLang(locale)];

// Werkzeuge (Konfigurator, Rechner, Custom Mix, Anfrage) gibt es nur auf
// Deutsch und Englisch; fr/it bekommen die englischen Texte (Links aus der
// Welt führen auf fr/it ohnehin zur englischen Fassung, deLinks.ezLinkProps).
const toolLang = (locale) => (ezLang(locale) === "de" ? "de" : "en");

/** Texte des Konfigurators (konfigurator/copy.js bzw. copy.en.js). */
export const ezKonfCopy = (locale) => (toolLang(locale) === "en" ? KONF_EN : KONF_DE);

/** Texte von Rechner, Custom Mix und Anfrage (rechner/copy.js bzw. copy.en.js). */
export const ezRechnerCopy = (locale) => (toolLang(locale) === "en" ? RECHNER_EN : RECHNER_DE);

