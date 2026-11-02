#!/usr/bin/env node
// tools/legal/services-md.mjs — writes section 6 of the law-firm folder
// (Marktresearch/recht/anwalt-vorschau.md) from the sources:
//   - consent texts DPF/SCC (Cookies.intro, Cookies.thirdCountryNotice) in 4
//     languages from Marktresearch/digital/teamleiter/messages-r3-shell.json
//     next to today's live text from src/messages/*.json
//   - the service list from the Dienste-Register src/lib/legal/services.js
//   - the status of the banner changes C1–C16 (Rechtspaket 02 §4)
// Only the block between the markers is replaced; the rest of the file stays.
// Usage: node tools/legal/services-md.mjs [--check]   (--check: exit 1 if outdated)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const FILE = path.join(ROOT, "Marktresearch/recht/anwalt-vorschau.md");
const START = "<!-- r4-recht-consent:start (tools/legal/services-md.mjs) -->";
const END = "<!-- r4-recht-consent:end -->";

const { dseServiceRows, BANNER_SERVICES, GOOGLE_TAG_IDS } = await import(pathToFileURL(path.join(ROOT, "src/lib/legal/services.js")).href);
const proposal = JSON.parse(fs.readFileSync(path.join(ROOT, "Marktresearch/digital/teamleiter/messages-r3-shell.json"), "utf8"));
const LOCALES = ["de", "en", "fr", "it"];
const live = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, `src/messages/${l}.json`), "utf8")).Cookies || {}])
);

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const LANG = { de: "Deutsch", en: "Englisch", fr: "Französisch", it: "Italienisch" };

const C_STATUS = [
  ["C1", "`Cookies.intro` ohne „berechtigtes Interesse“", "Text liegt vor (unten, 4 Sprachen), **wartet auf Freigabe**; live noch alter Text"],
  ["C2", "`Cookies.thirdCountryNotice` DPF/SCC statt Art. 49", "Text liegt vor (unten, 4 Sprachen), **wartet auf Freigabe**"],
  ["C3", "Mechanismen DPF + SCC je Dienst, Länderliste kürzen", "offen; Banner zeigt die bisherige Liste (16 Länder), Register nennt „USA und weitere Länder laut Google“"],
  ["C4", "Google Tag Manager entfernen", "offen; es gibt keinen GTM-Container, nur gtag.js. Schlüssel `googleTagManager` bleibt im Cookie (Format), Schalter steuert nichts. Seit R4-Fix: „Funktional“ hängt nur an Google Maps, DSE-Anhang nennt die echte Ladelogik; Schalter aus dem Banner entfernen nach Freigabe"],
  ["C5", "Beschreibung „Funktional“ neu", "offen (Rechtstext, Freigabe)"],
  ["C6", "„Essenziell“ mit `cookieConsent` 12 Monate", "im Register und in der DSE-Vorschau; im Banner noch nicht sichtbar"],
  ["C7", "Google-Ads-Cookieliste aktualisieren", "offen, im Register als [anwaltlich prüfen] markiert"],
  ["C8", "Meta Pixel", "nicht eingesetzt (kein Konto)"],
  ["C9", "Terminkalender", "nicht eingesetzt; kommt hinter Schalter mit eigenem Eintrag"],
  ["C10", "Chat/Video-Widget", "nicht eingesetzt; KI-Concierge ist eigenes Widget ohne Cookies (Labs)"],
  ["C11", "Banner-Version im Consent-Objekt", "offen; ändert das Cookie-Format, eigenes Paket"],
  ["C12", "Consent-Protokoll serverseitig", "offen; eigenes Paket"],
  ["C13", "kein gtag ohne Einwilligung", "**umgesetzt und per Playwright am Netzwerk belegt** (0 Google-Requests vor der Wahl)"],
  ["C14", "`Cookies.embedText` mit Hinweis auf Übermittlung", "offen (Rechtstext)"],
  ["C15", "Übersetzungen prüfen", "offen"],
  ["C16", "Ads in zwei Schalter teilen (optional)", "offen [anwaltlich prüfen]"],
];

const rows = dseServiceRows();
const lines = [];
lines.push(START, "", "## 6. Runde 4: Consent-Texte (DPF/SCC) und Dienstliste", "");
lines.push(
  "Stand: 26.10.2026 · Paket R4-recht-consent · erzeugt mit `node tools/legal/services-md.mjs`. Nichts davon ist live geschaltet; die live Seiten `/datenschutz` und `/impressum` sind unverändert.",
  ""
);
lines.push("### 6.1 Ladelogik der Google-Dienste (technisch, zum Abgleich mit dem Text)", "");
lines.push(
  "- Vor jeder Wahl im Banner: **kein Request an Google** (auch nicht gtag.js). Consent Mode v2 steht auf „verweigert“.",
  "- gtag.js lädt nur, wenn mindestens eine Konfiguration erlaubt **und** vorhanden ist: **Statistik** (GA4) oder **Marketing** mit hinterlegter Ads-Kennung. „Nur Marketing“ ohne Kennung lädt nichts (Datenminimierung).",
  "- Der Banner-Schalter „Google Tag Manager“ (Funktional) steuert nichts; „Funktional“ hängt nur an Google Maps (C4).",
  `- GA4-Konfiguration (${GOOGLE_TAG_IDS.ga4}) nur mit **Statistik**; Ads-Konfiguration nur mit **Marketing** und erst, wenn eine Ads-Kennung hinterlegt ist (heute: ${GOOGLE_TAG_IDS.ads ? "`" + GOOGLE_TAG_IDS.ads + "`" : "keine"}).`,
  "- Widerruf: Consent-Update „verweigert“, die eigenen Cookies `_ga`, `_ga_*` bzw. `_gcl_*` werden gelöscht.",
  "- Google Maps / Street View: erst nach Einwilligung „Funktional“ oder Klick auf „Karte laden“.",
  "- Beleg: `tests/e2e/r4-recht-consent.spec.js` (Netzwerkmitschnitt), `tests/unit/r4-recht.test.mjs`.",
  ""
);
lines.push("### 6.2 Consent-Texte zur Freigabe (C1, C2)", "");
lines.push(
  "Vorschlag aus `Marktresearch/digital/teamleiter/messages-r3-shell.json` (nach Rechtspaket 02 §4 C1/C2). Er wird erst nach Ihrer Freigabe in `src/messages/*.json` übernommen; bis dahin zeigt das Banner den heutigen Text.",
  ""
);
for (const key of ["intro", "thirdCountryNotice"]) {
  lines.push(`**\`Cookies.${key}\`**`, "", "| Sprache | heute live | Vorschlag zur Freigabe |", "|---|---|---|");
  for (const l of LOCALES) lines.push(`| ${LANG[l]} | ${esc(live[l][key])} | ${esc(proposal[l]?.Cookies?.[key])} |`);
  lines.push("");
}
lines.push(
  "Prüffragen: Ist „zertifiziert bzw. es gelten Standardvertragsklauseln“ für jeden Dienst richtig (Google LLC: DPF-zertifiziert)? Braucht der Text die Schweiz (Swiss-US DPF)? Soll „[Meta]“ entfallen, solange kein Meta Pixel läuft (der Vorschlag nennt nur Google)?",
  ""
);
lines.push("### 6.3 Dienstliste aus dem Dienste-Register", "");
lines.push(
  `Quelle: \`src/lib/legal/services.js\`. Dieselben Einträge speisen das Cookie-Banner (${BANNER_SERVICES.length} schaltbare Dienste: ${BANNER_SERVICES.map((s) => "`" + s.key + "`").join(", ")}) und den Anhang „Eingesetzte Dienste“ der DSE-Vorschau (http://localhost:3000/de/preview/recht/datenschutz#dienste). Ein Unit-Test prüft, dass beide dieselben Schlüssel haben. Status: *aktiv* = live, *labs* = gebaut, nur auf Test-Routen oder hinter Schalter, *nicht eingesetzt* = geprüft, nicht im Code.`,
  ""
);
lines.push("| Dienst | Status | Im Banner | Zweck | Rechtsgrundlage | Empfänger | Drittland | Speicherdauer |", "|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  lines.push(`| ${esc(r.name)} | ${r.status} | ${esc(r.banner)} | ${esc(r.purpose)} | ${esc(r.legalBasis)} | ${esc(r.recipients)} | ${esc(r.thirdCountry)} | ${esc(r.retention)} |`);
}
lines.push("");
lines.push("### 6.4 Stand der Banner-Änderungen C1–C16 (Rechtspaket 02 §4)", "", "| # | Änderung | Stand |", "|---|---|---|");
for (const [n, what, status] of C_STATUS) lines.push(`| ${n} | ${what} | ${status} |`);
lines.push("");
lines.push("### 6.5 Bildregister", "");
lines.push(
  "`Marktresearch/recht/bildrechte.csv` (erzeugt mit `node tools/legal/image-audit.mjs`): alle Bilder aus `public/`, `src/lib/data/**`, den Hosts in `remotePatterns` und einer Stichprobe der Backoffice-Bilder auf 13 Seiten. Spalte „freigabe“ ist „offen“ außer bei den 5 Navetta-Fotos und `aboutHome.jpg` (Mails vom 28.10.2026, Inhaber-Entscheidung Nr. 11); Rechteinhaber und Umfang (Web/Ads/Feed/Bearbeitung/KI) trägt der Inhaber ein. Grundlage für Impressum Abschn. 11 (Bildnachweise).",
  "",
  END
);
const block = lines.join("\n");

const md = fs.readFileSync(FILE, "utf8");
const a = md.indexOf(START);
const b = md.indexOf(END);
const next = a >= 0 && b > a ? md.slice(0, a) + block + md.slice(b + END.length) : md.replace(/\s*$/, "\n\n") + block + "\n";
if (process.argv.includes("--check")) {
  if (next !== md) {
    console.error("anwalt-vorschau.md ist veraltet: node tools/legal/services-md.mjs");
    process.exit(1);
  }
  console.log("anwalt-vorschau.md aktuell");
} else {
  fs.writeFileSync(FILE, next);
  console.log(`anwalt-vorschau.md: Abschnitt 6 geschrieben (${rows.length} Dienste)`);
}
