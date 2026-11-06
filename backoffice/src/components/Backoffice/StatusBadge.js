import cx from "./cx";
import { Icon } from "./icons";
import { anzeige } from "@/lib/backoffice/labels";

// Status-Pille im Lounge-Stil (lounge.md §6 „Status-Pille“, 03 §8.9, Q-G2): weiche Materialfläche,
// Punkt bzw. Symbol + Wort – nie Farbe allein. Ton kommt aus statusTon() in
// lib/backoffice/frappe/meta.js. Der angezeigte Text läuft durch anzeige() („Geprueft“ → „Geprüft“),
// der Wert selbst bleibt unverändert.
// Töne (API unverändert) → Material: grau → Stein · blau → Cognac (neu/offen) · tuerkis → See
// (in Arbeit) · orange → Eiche (wartet) · gruen → Salbei (erledigt) · lila → Messing · rot → Ziegel
// (nur Abbruch/Problem). Formen bleiben als zweites Merkmal: Punkt, halber Punkt (in Arbeit),
// Haken (erledigt), Dreieck (Problem), Ring (ruhend/neutral).
export const TOENE = ["grau", "blau", "tuerkis", "orange", "gruen", "rot", "lila"];

const TON = {
  blau: { flaeche: "bg-bo-info-soft text-bo-info-text", marke: "text-bo-info", form: "punkt" },
  tuerkis: { flaeche: "bg-bo-progress-soft text-bo-progress-text", marke: "text-bo-progress", form: "halb" },
  orange: { flaeche: "bg-bo-warning-soft text-bo-warning-text", marke: "text-bo-warning", form: "punkt" },
  gruen: { flaeche: "bg-bo-success-soft text-bo-success-text", marke: "text-bo-success", form: "haken" },
  rot: { flaeche: "bg-bo-danger-soft text-bo-danger-text", marke: "text-bo-danger", form: "dreieck" },
  lila: { flaeche: "bg-bo-special-soft text-bo-special-text", marke: "text-bo-special", form: "punkt" },
  grau: { flaeche: "bg-bo-neutral-soft text-bo-neutral-text", marke: "text-bo-neutral", form: "ring" },
};

// xs 20 (dichte Zeilen) · sm folgt der Dichte (26 kompakt / 28 komfortabel / 32 Kiosk) · m 28 fest
const GROESSE = {
  xs: "h-5 px-2 text-[11px] gap-1",
  sm: "h-(--bo-pille-h) px-2.5 text-xs gap-1.5",
  m: "h-7 px-3 text-[13px] gap-1.5",
};

function Marke({ form, className }) {
  if (form === "haken") return <Icon name="Check" className={cx("size-3 shrink-0", className)} strokeWidth={2.5} />;
  if (form === "dreieck") return <Icon name="TriangleAlert" className={cx("size-3 shrink-0", className)} strokeWidth={2.25} />;
  if (form === "ring") return <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill border-[1.5px] border-current", className)} />;
  if (form === "halb") return <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill border-[1.5px] border-current [background:linear-gradient(90deg,currentColor_50%,transparent_50%)]", className)} />;
  return <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill bg-current", className)} />;
}

/**
 * @param {object} p
 * @param {string} p.wert             Statuswert aus Frappe (unverändert)
 * @param {"blau"|"gruen"|"orange"|"rot"|"lila"|"tuerkis"|"grau"} [p.ton]
 * @param {"xs"|"sm"|"m"} [p.groesse]  20 · nach Dichte (Standard) · 28 px
 * @param {string} [p.text]           abweichender Anzeigetext (z. B. „Gemahnt · Stufe 2“)
 * @param {string} [p.beschreibung]   Tooltip (Workflow-Beschreibung)
 * @param {boolean} [p.gebucht]       docstatus 1: Schloss neben dem Status
 * @param {boolean} [p.storniert]     docstatus 2: Text durchgestrichen (immer zusätzlich Banner in der Akte)
 */
export default function StatusBadge({ wert, ton = "grau", groesse = "sm", text, beschreibung, gebucht = false, storniert = false, className }) {
  if (!wert && !text) return <span className="text-bo-text-faint">–</span>;
  const t = TON[ton] || TON.grau;
  const anzeigeText = text || anzeige(String(wert).replace(/^PH /, ""));
  const titel = [anzeigeText, gebucht ? "gebucht" : null, storniert ? "storniert" : null, beschreibung].filter(Boolean).join(" · ");
  return (
    <span className={cx("bo-pille", GROESSE[groesse] || GROESSE.sm, t.flaeche, className)} title={titel} data-ton={ton}>
      <Marke form={t.form} className={t.marke} />
      <span className={cx("truncate", storniert && "line-through decoration-1")}>{anzeigeText}</span>
      {gebucht && (
        <>
          <Icon name="Lock" className="size-3 shrink-0 opacity-80" />
          <span className="sr-only">, gebucht</span>
        </>
      )}
      {storniert && <span className="sr-only">, storniert</span>}
    </span>
  );
}

/** Weiche Material-Pille ohne Status-Bedeutung (Stufe, Bereich, Kanal) – Punkt + Wort. */
export const MATERIALIEN = ["stein", "cognac", "eiche", "salbei", "messing", "see", "nuss", "travertin"];
const MATERIAL_KLASSE = {
  stein: "bg-bo-stein-soft text-bo-stein-text",
  cognac: "bg-bo-cognac-soft text-bo-cognac-text",
  eiche: "bg-bo-eiche-soft text-bo-eiche-text",
  salbei: "bg-bo-salbei-soft text-bo-salbei-text",
  messing: "bg-bo-messing-soft text-bo-messing-text",
  see: "bg-bo-see-soft text-bo-see-text",
  nuss: "bg-bo-nuss-soft text-bo-nuss-text",
  travertin: "bg-bo-travertin-soft text-bo-travertin-text",
};
const MATERIAL_PUNKT = {
  stein: "bg-bo-stein",
  cognac: "bg-bo-cognac",
  eiche: "bg-bo-eiche",
  salbei: "bg-bo-salbei",
  messing: "bg-bo-messing",
  see: "bg-bo-see",
  nuss: "bg-bo-nuss",
  travertin: "bg-bo-travertin",
};

/**
 * @param {object} p
 * @param {"stein"|"cognac"|"eiche"|"salbei"|"messing"|"see"|"nuss"|"travertin"} [p.material]
 * @param {boolean} [p.punkt]   Punkt vor dem Wort (Standard ja)
 * @param {"xs"|"sm"|"m"} [p.groesse]
 */
export function Pille({ material = "stein", punkt = true, groesse = "m", className, children, testid }) {
  const m = MATERIAL_KLASSE[material] ? material : "stein";
  return (
    <span className={cx("bo-pille", GROESSE[groesse] || GROESSE.m, MATERIAL_KLASSE[m], className)} data-material={m} data-testid={testid}>
      {punkt && <span aria-hidden="true" className={cx("size-1.5 shrink-0 rounded-pill", MATERIAL_PUNKT[m])} />}
      <span className="truncate">{children}</span>
    </span>
  );
}
