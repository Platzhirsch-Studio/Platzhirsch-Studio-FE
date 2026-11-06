import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// ESLint des Backoffice (eigene App). Gleiche Basis wie das Root-Projekt
// (eslint-config-next, Flat Config); die Website-Schutzregeln (Gold-Text,
// Händler-Claims) betreffen öffentliche Texte und gelten hier nicht.
//
// Eigene Regeln (Team P0-9, MASTER Q-G1 und § 2.D) als Inline-Plugin `platzhirsch`
// – kein zusätzliches Paket:
//   platzhirsch/keine-hex-farbe    Hex-Farben (#abc, #aabbcc, #aabbccdd, auch in
//                                  Tailwind-Klassen wie `text-[#8fbdb8]`) in
//                                  Komponenten und Seiten. Farben kommen nur über
//                                  die Rollen-Token `--color-bo-*` aus globals.css.
//                                  Ausnahme: Wert/Startwert eines `<input type="color">`
//                                  (das Element verlangt Hex).
//   platzhirsch/kein-datum-input   `<input type="date|datetime-local|month|week">`.
//                                  Stattdessen `Formular/Datumsfeld` (deutsches Format,
//                                  Wert ISO).
//   platzhirsch/keine-versalien    (Warnung) Tailwind-Klasse `uppercase` bzw.
//                                  `textTransform: "uppercase"` in Komponenten und
//                                  Seiten. Lounge (art-direction/lounge.md, Inhaber
//                                  Nr. 51/53): keine VERSALIEN-Etiketten, Etiketten
//                                  in Satzschreibung. Warnung statt Fehler, bis der
//                                  Altbestand auf Lounge umgestellt ist.

const HEX = /(^|[^&\w#])#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i;
const VERSALIEN = /(^|[\s:"'`])uppercase(?=$|[\s"'`])/;
const DATUM_TYPEN = new Set(["date", "datetime-local", "month", "week"]);

/** Statischer Wert eines JSX-Attributs (String oder `{"..."}`), sonst null. */
function attributWert(attr) {
  const v = attr?.value;
  if (!v) return null;
  if (v.type === "Literal" && typeof v.value === "string") return v.value;
  if (v.type === "JSXExpressionContainer" && v.expression.type === "Literal" && typeof v.expression.value === "string") return v.expression.value;
  if (v.type === "JSXExpressionContainer" && v.expression.type === "TemplateLiteral" && v.expression.expressions.length === 0) return v.expression.quasis[0].value.cooked;
  return null;
}

function attribut(openingElement, name) {
  return openingElement.attributes.find((a) => a.type === "JSXAttribute" && a.name?.name === name);
}

/** Liegt der Knoten im value/defaultValue eines <input type="color">? */
function imFarbwaehler(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === "JSXAttribute") {
      if (!["value", "defaultValue"].includes(a.name?.name)) return false;
      const el = ancestors[i - 1];
      return el?.type === "JSXOpeningElement" && el.name?.name === "input" && attributWert(attribut(el, "type")) === "color";
    }
  }
  return false;
}

const platzhirsch = {
  meta: { name: "platzhirsch-backoffice" },
  rules: {
    "keine-hex-farbe": {
      meta: {
        type: "problem",
        docs: { description: "Keine Hex-Farben in Komponenten – nur Rollen-Token --color-bo-* (Q-G1)" },
        schema: [],
        messages: {
          hex: "Hex-Farbe „{{wert}}“ in einer Komponente. Farben nur über Rollen-Token (--color-bo-*, Tailwind-Klassen wie text-bo-text, bg-bo-surface) aus src/app/globals.css (MASTER Q-G1).",
        },
      },
      create(context) {
        const pruefe = (node, text) => {
          if (typeof text !== "string" || !text.includes("#")) return;
          const m = HEX.exec(text);
          if (!m) return;
          if (imFarbwaehler(context.sourceCode.getAncestors(node))) return;
          context.report({ node, messageId: "hex", data: { wert: `#${m[2]}` } });
        };
        return {
          Literal(node) {
            pruefe(node, node.value);
          },
          TemplateElement(node) {
            pruefe(node, node.value.cooked ?? node.value.raw);
          },
        };
      },
    },
    "keine-versalien": {
      meta: {
        type: "suggestion",
        docs: { description: "Keine Versalien-Etiketten (Lounge, Inhaber Nr. 51/53)" },
        schema: [],
        messages: {
          versal: "Versalien („uppercase“) widersprechen der Lounge-Gestaltung. Etiketten in Satzschreibung (Gewicht 500, Text 2/3), siehe art-direction/lounge.md.",
        },
      },
      create(context) {
        const pruefe = (node, text) => {
          if (typeof text === "string" && text.includes("uppercase") && VERSALIEN.test(text)) context.report({ node, messageId: "versal" });
        };
        return {
          Literal(node) {
            pruefe(node, node.value);
          },
          TemplateElement(node) {
            pruefe(node, node.value.cooked ?? node.value.raw);
          },
        };
      },
    },
    "kein-datum-input": {
      meta: {
        type: "problem",
        docs: { description: "Kein natives Datumsfeld – Formular/Datumsfeld verwenden" },
        schema: [],
        messages: {
          datum: "<input type=\"{{typ}}\"> zeigt das Browserformat statt TT.MM.JJJJ. Bitte components/Backoffice/Formular/Datumsfeld verwenden (Wert bleibt ISO).",
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (node.name?.name !== "input") return;
            const attr = attribut(node, "type");
            const typ = attributWert(attr);
            if (typ && DATUM_TYPEN.has(typ.toLowerCase())) context.report({ node: attr, messageId: "datum", data: { typ } });
          },
        };
      },
    },
  },
};

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "test-results/**", "playwright-report/**", "qa-screenshots/**"]),
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    plugins: { platzhirsch },
    rules: {
      "platzhirsch/kein-datum-input": "error",
    },
  },
  {
    // Komponenten und Seiten; Seed-/Mock-Daten in src/lib dürfen Farbwerte als Daten tragen.
    files: ["src/components/**/*.{js,jsx,mjs}", "src/app/**/*.{js,jsx,mjs}"],
    rules: {
      "platzhirsch/keine-hex-farbe": "error",
      "platzhirsch/keine-versalien": "warn",
    },
  },
  {
    // Seed-/Musterdaten der Entwürfe (Stoff- und Materialmuster als Farbwerte) sind Daten, keine
    // Gestaltung – wie src/lib. Komponenten der Entwürfe bleiben unter der Regel.
    files: ["src/components/Entwurf/**/data.js"],
    rules: {
      "platzhirsch/keine-hex-farbe": "off",
    },
  },
]);
