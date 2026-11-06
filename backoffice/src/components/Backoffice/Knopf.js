import Link from "next/link";
import { useId } from "react";
import cx from "./cx";
import { Icon } from "./icons";

// Schaltflächen des Backoffice im Lounge-Stil (art-direction/lounge.md §6, §8, §9).
// Server- und Client-tauglich (keine eigenen Effekte).
//
// `Knopf` – Pille ohne Rahmen, getragen von Fläche + weichem Schatten. Druck-Feder: beim Drücken
// sofort auf 0,97 (80 ms), beim Loslassen federt er zurück (Lounge-Feder). Höhen folgen der Dichte
// (globals.css): s 28/32 · m 32/40 · l 40/48 · kiosk 64; in [data-dichte="kiosk"] 44/48/56.
// Nur-Icon-Knöpfe bekommen über `.bo-ziel` 44 px Trefferfläche.
// Varianten: primary (Tinte, eine je Ansicht), secondary (Kachel-Fläche, Standard), ghost,
// danger (Ziegel-Schrift), danger-solid (Bestätigen im Dialog), link.
// laedt: Spinner statt Icon (Text bleibt, Breite springt nicht), aria-busy, nicht doppelt klickbar.
// grund: sichtbarer Satz unter dem deaktivierten Knopf (Q-I5, Q-A7 „Noch nicht verfügbar – …“).
//
// `RundKnopf` – runder Symbolknopf 40/44 (Suche, Glocke, Plus, Filter), optional Badge/Punkt,
// `aktiv` = gefüllter Tinte-Kreis. `PfeilKnopf` – runder Tinte-Knopf „öffnen“ unten rechts in
// Kacheln; der Pfeil dreht beim Hover der Kachel um 45°.
const BASE =
  "bo-knopf bo-motion relative inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none " +
  "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45";

const GROESSE = {
  s: "min-h-(--bo-control-h-s) px-3 text-[13px]",
  m: "min-h-(--bo-control-h) px-4 text-sm",
  l: "min-h-(--bo-control-h-l) px-5 text-[15px]",
  kiosk: "min-h-(--bo-key-h) px-7 text-[17px]",
};
const QUADRAT = {
  s: "size-(--bo-control-h-s) min-w-(--bo-control-h-s)",
  m: "size-(--bo-control-h) min-w-(--bo-control-h)",
  l: "size-(--bo-control-h-l) min-w-(--bo-control-h-l)",
  kiosk: "size-(--bo-key-h) min-w-(--bo-key-h)",
};
const ICON_GROESSE = { s: "size-4", m: "size-4", l: "size-5", kiosk: "size-6" };

const VARIANTE = {
  primary: "bo-knopf--primary",
  secondary: "bo-knopf--secondary",
  ghost: "bo-knopf--ghost",
  danger: "bo-knopf--danger",
  "danger-solid": "bo-knopf--danger-solid",
  link: "bo-knopf--link min-h-0 px-0 font-medium text-bo-text underline decoration-bo-line-strong underline-offset-[3px] hover:decoration-current",
};

export const KNOPF_VARIANTEN = Object.keys(VARIANTE);
export const KNOPF_GROESSEN = Object.keys(GROESSE);

function tastenHinweis(kuerzel) {
  return kuerzel ? kuerzel.replace(/Strg/g, "Control").replace(/⌘/g, "Meta").replace(/\s/g, "") : undefined;
}

/**
 * @param {object} p
 * @param {"primary"|"secondary"|"ghost"|"danger"|"danger-solid"|"link"} [p.variant]
 * @param {"s"|"m"|"l"|"kiosk"} [p.size]
 * @param {string} [p.href]          Link statt Knopf (deaktiviert → nicht klickbarer span)
 * @param {string} [p.icon]          Icon links (Name aus icons.js)
 * @param {string} [p.iconRechts]    Icon rechts (z. B. „ChevronDown“, „ArrowUpRight“)
 * @param {string} [p.label]         Nur-Icon-Knopf: Pflicht-Name (aria-label + Tooltip)
 * @param {string} [p.kuerzel]       Tastenkürzel als Hinweis („Strg+S“) → aria-keyshortcuts + Tooltip
 * @param {boolean} [p.laedt]        Spinner, aria-busy, gesperrt
 * @param {import("react").ReactNode} [p.grund]  Grund unter einem deaktivierten Knopf (12 px muted)
 */
export default function Knopf({ variant = "secondary", size = "m", href, icon, iconRechts, label, kuerzel, className, children, type = "button", laedt = false, grund, disabled, ...rest }) {
  const grundId = useId();
  const nurIcon = !children && (icon || label);
  const gesperrt = disabled || laedt;
  const v = VARIANTE[variant] ? variant : "secondary";
  const klassen = cx(
    BASE,
    nurIcon ? QUADRAT[size] || QUADRAT.m : GROESSE[size] || GROESSE.m,
    nurIcon && "bo-ziel px-0",
    VARIANTE[v],
    (label || kuerzel) && "bo-tip",
    className
  );
  const iconKlasse = ICON_GROESSE[size] || ICON_GROESSE.m;
  const tip = label && kuerzel ? `${label} · ${kuerzel}` : label || (kuerzel ? kuerzel : undefined);
  const a11y = {
    "aria-label": nurIcon ? label : undefined,
    "data-tip": tip,
    "aria-keyshortcuts": tastenHinweis(kuerzel),
    "aria-describedby": grund && gesperrt ? grundId : undefined,
    "data-variante": v,
  };

  // Spinner: mit Icon tauscht er das Icon (Text bleibt); ohne Icon liegt er mittig über dem
  // unsichtbar gemachten Text – die Breite bleibt in beiden Fällen gleich.
  const ohneIconLaden = laedt && !icon;
  const inhalt = (
    <>
      {icon && (laedt ? <span aria-hidden="true" className="bo-spinner" /> : <Icon name={icon} className={iconKlasse} />)}
      {ohneIconLaden ? <span className="inline-flex items-center gap-2 opacity-0">{children}</span> : children}
      {iconRechts && <Icon name={iconRechts} className={cx(iconKlasse, ohneIconLaden && "opacity-0")} />}
      {ohneIconLaden && (
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="bo-spinner" />
        </span>
      )}
    </>
  );

  let element;
  if (href && !gesperrt) {
    element = (
      <Link href={href} className={klassen} {...a11y} {...rest}>
        {inhalt}
      </Link>
    );
  } else if (href) {
    element = (
      <span role="link" aria-disabled="true" className={klassen} {...a11y} {...rest}>
        {inhalt}
      </span>
    );
  } else {
    element = (
      <button type={type} className={klassen} aria-busy={laedt || undefined} disabled={gesperrt} {...a11y} {...rest}>
        {inhalt}
      </button>
    );
  }

  if (!grund || !gesperrt || laedt) return element;
  return (
    <span className="inline-flex max-w-full flex-col items-start gap-1.5">
      {element}
      <span id={grundId} className="max-w-[36ch] text-xs leading-4 text-bo-text-faint">
        {grund}
      </span>
    </span>
  );
}

const RUND_GROESSE = { s: "bo-rund--s", m: "", l: "bo-rund--l" };
const RUND_ICON = { s: "size-4", m: "size-5", l: "size-5" };

/**
 * Runder Symbolknopf (Lounge „Rundknopf“): 40/44 je Dichte, Kachel-Fläche + Knopfschatten,
 * Druck-Feder 0,94. Immer mit Namen (aria-label + Tooltip).
 * @param {object} p
 * @param {string} p.icon
 * @param {string} p.label                 Pflicht: Name für Screenreader und Tooltip
 * @param {string} [p.href]
 * @param {boolean} [p.aktiv]              gefüllter Tinte-Kreis; als Umschalter mit aria-pressed
 * @param {boolean} [p.umschalter]         aria-pressed setzen (sonst nur Optik „aktiv“)
 * @param {number|boolean} [p.badge]       Zahl (Cognac-Kreis) oder true (Punkt „neu“)
 * @param {"s"|"m"|"l"} [p.groesse]
 * @param {boolean} [p.flach]              ohne Fläche/Schatten (in Material-Leisten)
 * @param {string} [p.kuerzel]
 * @param {string} [p.testid]
 */
export function RundKnopf({ icon, label, href, aktiv = false, umschalter = false, badge, groesse = "m", flach = false, kuerzel, disabled, className, testid, type = "button", ...rest }) {
  const klassen = cx("bo-rund bo-tip bo-ziel", RUND_GROESSE[groesse], flach && "bo-rund--flach", aktiv && !umschalter && "is-an", className);
  const zahl = typeof badge === "number" && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;
  const badgeText = zahl ? `, ${zahl} neu` : badge === true ? ", neu" : "";
  const a11y = {
    "aria-label": `${label}${badgeText}`,
    "data-tip": kuerzel ? `${label} · ${kuerzel}` : label,
    "aria-keyshortcuts": tastenHinweis(kuerzel),
    "data-testid": testid,
  };
  const inhalt = (
    <>
      <Icon name={icon} className={RUND_ICON[groesse] || RUND_ICON.m} />
      {zahl && (
        <span aria-hidden="true" className="bo-rund__badge">
          {zahl}
        </span>
      )}
      {badge === true && <span aria-hidden="true" className="bo-rund__badge bo-rund__badge--punkt" />}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={klassen} aria-current={aktiv ? "page" : undefined} {...a11y} {...rest}>
        {inhalt}
      </Link>
    );
  }
  return (
    <button type={type} className={klassen} disabled={disabled} aria-pressed={umschalter ? aktiv : undefined} {...a11y} {...rest}>
      {inhalt}
    </button>
  );
}

/**
 * Pfeil-Knopf „öffnen“ (Lounge): rund, Tinte (auf Akzentflächen `hell`), dreht beim Hover der
 * Kachel 45° mit Feder. `nurOptik`: nur das Symbol (aria-hidden), wenn die ganze Kachel der Link ist.
 * @param {object} p
 * @param {string} [p.href]
 * @param {string} [p.label]   Name, Standard „Öffnen“
 * @param {boolean} [p.hell]
 * @param {boolean} [p.nurOptik]
 * @param {"s"|"m"} [p.groesse]
 */
export function PfeilKnopf({ href, label = "Öffnen", hell = false, nurOptik = false, groesse = "m", onClick, className, testid, ...rest }) {
  const klassen = cx("bo-pfeil", groesse === "s" && "size-(--bo-rund-s)", hell && "bo-pfeil--hell", className);
  const pfeil = <Icon name="ArrowUpRight" className="size-5" />;
  if (nurOptik) {
    return (
      <span aria-hidden="true" className={klassen} data-testid={testid}>
        {pfeil}
      </span>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cx(klassen, "bo-ziel")} aria-label={label} data-testid={testid} {...rest}>
        {pfeil}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cx(klassen, "bo-ziel")} aria-label={label} data-testid={testid} {...rest}>
      {pfeil}
    </button>
  );
}
