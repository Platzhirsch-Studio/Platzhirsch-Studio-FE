import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Native flat config from eslint-config-next (Next 16). The old FlatCompat
// wrapper crashed with a circular-structure error, and `next lint` no longer exists.

// --- Schutzregeln (Masterplan AP1.6, R4-plattform-ci) -----------------------
// R6-release: "error" (vorher "warn"). Vor dem Umstellen 0 Funde außerhalb der
// begründeten Ausnahmen unten (Beleg: Marktresearch/digital/teamleiter/r6-R6-release.md).
// Die vollständige rechtliche Prüfung bleibt
// tools/checks/check-claims.mjs (src/lib/legal/claims.js); diese Regeln geben
// nur früh im Editor einen Hinweis.
//
// 1) Gold #d1b250 als Textfarbe hat zu wenig Kontrast (WCAG 1.4.3). Text in
//    Gold nur als `text-gold-text` (#7a5f17); #d1b250 nur als Fläche/Linie.
const GOLD_TEXT = String.raw`/(^|[\s:"'\x60])text-\[#d1b250\]/i`;
const GOLD_MESSAGE =
  "Gold #d1b250 als Textfarbe ist zu kontrastarm (WCAG 1.4.3). Nutze text-gold-text (#7a5f17); #d1b250 nur als Fläche oder Linie.";

// 2) Händler-Behauptungen (UWG): belegt sind nur ClassiCon (Händlerverzeichnis)
//    und Ezarri (Händlervertrag, Inhaber-Entscheidung Nr. 7 vom 28.10.2026),
//    Register: src/lib/legal/claims.js (CLAIM_REGISTER). Ein Text, der eine
//    dieser beiden Marken selbst nennt, ist erlaubt (DEALER_OK); jede andere
//    Händler-/Offiziell-Formulierung bleibt ein Fehler. Formel für alle anderen
//    Marken: "Minotti in unserer Ausstellung in Lochau". Ob die Aussage im
//    gerenderten HTML wirklich nur bei ClassiCon/Ezarri steht, prüft weiter
//    tools/checks/check-claims.mjs.
const DEALER = String.raw`/h(ä|ae)ndler|autorisiert|offizielle[nrs]? (partner|vertrieb)|authori[sz]ed (dealer|retailer|partner)|official (dealer|retailer|partner|stockist)|revendeur|concessionnaire|rivenditore|distributore (ufficiale|autorizzato)/i`;
const DEALER_OK = String.raw`/classicon|ezarri/i`;
const DEALER_MESSAGE =
  "Händler-/Offiziell-Behauptung im Code. Belegt sind nur ClassiCon und Ezarri (src/lib/legal/claims.js); der Text muss die Marke selbst nennen. Formel für andere Marken: \"<Marke> in unserer Ausstellung in Lochau\".";

const goldSelectors = [
  { selector: `Literal[value=${GOLD_TEXT}]`, message: GOLD_MESSAGE },
  { selector: `TemplateElement[value.raw=${GOLD_TEXT}]`, message: GOLD_MESSAGE },
];
const dealerSelectors = [
  { selector: `Literal[value=${DEALER}]:not([value=${DEALER_OK}])`, message: DEALER_MESSAGE },
  { selector: `TemplateElement[value.raw=${DEALER}]:not([value.raw=${DEALER_OK}])`, message: DEALER_MESSAGE },
  { selector: `JSXText[value=${DEALER}]:not([value=${DEALER_OK}])`, message: DEALER_MESSAGE },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    name: "platzhirsch/schutzregeln",
    files: ["src/**/*.{js,jsx,mjs}"],
    rules: {
      "no-restricted-syntax": ["error", ...goldSelectors, ...dealerSelectors],
    },
  },
  {
    // Der Claim-Guard selbst und seine Register nennen die Wörter zwangsläufig.
    // Nur die Händler-Regel entfällt hier; die Gold-Regel gilt weiter.
    name: "platzhirsch/schutzregeln-claim-guard",
    // R6-release: ebenso die Rechtsentwürfe (Klauseln, die eine Händlerschaft
    // ausdrücklich verneinen, z. B. "keine … Vertragshändlerschaft") und der
    // Concierge-Prompt, der dem Modell solche Behauptungen verbietet.
    // check-claims.mjs prüft das gerenderte HTML dieser Seiten weiter.
    files: ["src/lib/legal/**", "src/components/LegalDrafts/docs/**", "src/lib/concierge/systemPrompt.js"],
    rules: {
      "no-restricted-syntax": ["error", ...goldSelectors],
    },
  },
  {
    // R6-release: Gold als Text nur auf dunkler Fläche, dort reicht der Kontrast
    // (WCAG 1.4.3, gerechnet): Vernissage-Popup auf #272d34/#30373e/#23282e
    // 6,75/5,85/7,21 : 1; Bühnen-Vorschau nur aria-hidden-Icons auf #171513
    // (8,84 : 1). Auf Weiß wären es 2,06 : 1, deshalb gilt die Regel sonst überall.
    name: "platzhirsch/schutzregeln-dunkle-flaeche",
    files: ["src/components/Home/vernissagePopup.js", "src/app/*/preview/buehne/**"],
    rules: {
      "no-restricted-syntax": ["error", ...dealerSelectors],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not part of the app:
    "archive/**",
    "public/**",
    // Generated QA artefacts (Playwright HTML reports, traces, screenshots):
    // bundled third-party code, it made `eslint .` fail with 840 errors.
    "qa-screenshots/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
