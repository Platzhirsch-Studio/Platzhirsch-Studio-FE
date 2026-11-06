// Reine Logik der Overlay-Bausteine (Team P0-4, G-06 · G-07 · G-08) – ohne DOM, unit-getestet
// (tests/unit/backoffice-overlay.test.mjs). Positionieren mit Flip, Blättern, Zoom, Ziehen des
// Sheets, Tooltip-Gruppe, Panel-Parameter in der URL, Tipp-Suche im Menü.

/** Unter dieser Breite werden Popover, Dialog und Sheet zum Bottom-Sheet (MASTER G-06/G-07). */
export const SCHMAL_BIS = 640;

/** Dialoggrößen (Q-G8) und Sheet-Breiten (G-07: sm 400 · md 480 · lg 640). */
export const DIALOG_BREITE = Object.freeze({ sm: 400, md: 560, lg: 800 });
export const SHEET_BREITE = Object.freeze({ sm: 400, md: 480, lg: 640 });

/** Abstand Popover ↔ Auslöser und Mindestabstand zum Fensterrand (px). */
export const ABSTAND = 8;
export const RAND = 8;

/** Tooltip: Verzögerung 400 ms, innerhalb einer Gruppe (zuletzt vor < 300 ms gezeigt) sofort. */
export const TOOLTIP_VERZOEGERUNG = 400;
export const TOOLTIP_GRUPPE_MS = 300;

/** @param {number} breite */
export function istSchmal(breite) {
  return Number.isFinite(breite) && breite < SCHMAL_BIS;
}

/** @param {"sm"|"md"|"lg"|string} groesse  @param {"dialog"|"sheet"} art */
export function breiteFuer(groesse, art = "dialog") {
  const tabelle = art === "sheet" ? SHEET_BREITE : DIALOG_BREITE;
  return tabelle[groesse] ?? tabelle.md;
}

const SEITEN = ["unten", "oben", "rechts", "links"];
const GEGEN = { unten: "oben", oben: "unten", rechts: "links", links: "rechts" };

/** „unten-start“ → { seite: "unten", ausrichtung: "start" } */
export function zerlegePlatzierung(p = "unten-start") {
  const [s, a] = String(p).split("-");
  return { seite: SEITEN.includes(s) ? s : "unten", ausrichtung: a === "ende" || a === "mitte" ? a : "start" };
}

function klemme(wert, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(wert, min), max);
}

/**
 * Lage eines schwebenden Panels neben einem Anker (Rechteck in Viewport-Koordinaten).
 * Kippt auf die Gegenseite, wenn der Platz fehlt und dort mehr ist; schiebt sonst in den Sichtbereich.
 * @param {{anker:{x:number,y:number,w:number,h:number}, panel:{w:number,h:number}, viewport:{w:number,h:number}, platzierung?:string, abstand?:number, rand?:number}} p
 * @returns {{x:number, y:number, seite:string, ausrichtung:string, ursprung:string, maxHoehe:number}}
 */
export function platziere({ anker, panel, viewport, platzierung = "unten-start", abstand = ABSTAND, rand = RAND }) {
  let { seite, ausrichtung } = zerlegePlatzierung(platzierung);
  const platz = {
    unten: viewport.h - (anker.y + anker.h) - abstand - rand,
    oben: anker.y - abstand - rand,
    rechts: viewport.w - (anker.x + anker.w) - abstand - rand,
    links: anker.x - abstand - rand,
  };
  const bedarf = seite === "unten" || seite === "oben" ? panel.h : panel.w;
  if (platz[seite] < bedarf && platz[GEGEN[seite]] > platz[seite]) seite = GEGEN[seite];

  let x;
  let y;
  if (seite === "unten" || seite === "oben") {
    y = seite === "unten" ? anker.y + anker.h + abstand : anker.y - abstand - panel.h;
    if (ausrichtung === "start") x = anker.x;
    else if (ausrichtung === "ende") x = anker.x + anker.w - panel.w;
    else x = anker.x + anker.w / 2 - panel.w / 2;
    x = klemme(x, rand, viewport.w - rand - panel.w);
    y = klemme(y, rand, viewport.h - rand - panel.h);
  } else {
    x = seite === "rechts" ? anker.x + anker.w + abstand : anker.x - abstand - panel.w;
    if (ausrichtung === "start") y = anker.y;
    else if (ausrichtung === "ende") y = anker.y + anker.h - panel.h;
    else y = anker.y + anker.h / 2 - panel.h / 2;
    y = klemme(y, rand, viewport.h - rand - panel.h);
    x = klemme(x, rand, viewport.w - rand - panel.w);
  }
  const maxHoehe = Math.max(120, seite === "oben" ? anker.y - abstand - rand : seite === "unten" ? viewport.h - (anker.y + anker.h) - abstand - rand : viewport.h - 2 * rand);
  const ursprungY = seite === "unten" ? "top" : seite === "oben" ? "bottom" : "center";
  const ursprungX = seite === "rechts" ? "left" : seite === "links" ? "right" : ausrichtung === "ende" ? "right" : ausrichtung === "mitte" ? "center" : "left";
  return { x: Math.round(x), y: Math.round(y), seite, ausrichtung, ursprung: `${ursprungX} ${ursprungY}`, maxHoehe: Math.round(maxHoehe) };
}

/**
 * Lage eines Kontextmenüs am Zeiger: rechts unterhalb, sonst gekippt; nie aus dem Fenster.
 * @param {{punkt:{x:number,y:number}, panel:{w:number,h:number}, viewport:{w:number,h:number}, rand?:number}} p
 */
export function platziereAmPunkt({ punkt, panel, viewport, rand = RAND }) {
  let x = punkt.x;
  let y = punkt.y;
  let ux = "left";
  let uy = "top";
  if (x + panel.w > viewport.w - rand && punkt.x - panel.w >= rand) {
    x = punkt.x - panel.w;
    ux = "right";
  }
  if (y + panel.h > viewport.h - rand && punkt.y - panel.h >= rand) {
    y = punkt.y - panel.h;
    uy = "bottom";
  }
  return { x: Math.round(klemme(x, rand, viewport.w - rand - panel.w)), y: Math.round(klemme(y, rand, viewport.h - rand - panel.h)), ursprung: `${ux} ${uy}` };
}

/**
 * Nächster Index beim Blättern (Peek J/K, Menü ↑/↓, Lightbox ←/→).
 * @param {number} i  aktueller Index (-1 = keiner)
 * @param {number} n  Anzahl
 * @param {number|"anfang"|"ende"} schritt
 * @param {{umbruch?:boolean, gesperrt?:(i:number)=>boolean}} [opt]
 */
export function naechsterIndex(i, n, schritt, { umbruch = false, gesperrt } = {}) {
  if (!n || n < 1) return -1;
  if (schritt === "anfang" || schritt === "ende") {
    const start = schritt === "anfang" ? 0 : n - 1;
    const r = schritt === "anfang" ? 1 : -1;
    for (let k = 0, j = start; k < n; k++, j += r) if (!gesperrt?.(j)) return j;
    return -1;
  }
  const r = schritt < 0 ? -1 : 1;
  let j = i < 0 ? (r > 0 ? -1 : n) : i;
  for (let k = 0; k < n; k++) {
    j += r;
    if (j >= n || j < 0) {
      if (!umbruch) return i < 0 ? -1 : i;
      j = (j + n) % n;
    }
    if (!gesperrt?.(j)) return j;
  }
  return i;
}

/** Zoomstufen der Lightbox (G-08: 1× / 2×). */
export const ZOOM_STUFEN = Object.freeze([1, 2]);

/** @param {number} z  @param {"+"|"-"|"wechsel"} aktion */
export function naechsterZoom(z, aktion) {
  if (aktion === "+") return 2;
  if (aktion === "-") return 1;
  return z === 2 ? 1 : 2;
}

/**
 * Verschiebung eines vergrößerten Bildes begrenzen, damit kein leerer Rand ins Bild läuft.
 * @param {{dx:number, dy:number, zoom:number, breite:number, hoehe:number}} p  breite/hoehe = sichtbares Bild bei 1×
 */
export function begrenzeVerschiebung({ dx, dy, zoom, breite, hoehe }) {
  if (zoom <= 1) return { dx: 0, dy: 0 };
  const mx = ((zoom - 1) * breite) / 2;
  const my = ((zoom - 1) * hoehe) / 2;
  return { dx: klemme(dx, -mx, mx), dy: klemme(dy, -my, my) };
}

/**
 * Entscheidung nach dem Ziehen eines Bottom-Sheets am Griff.
 * Schließt ab 30 % der Höhe (mind. 96 px) oder bei schnellem Wurf nach unten (> 0,5 px/ms, mind. 24 px).
 * @param {{dy:number, vy:number, hoehe:number}} p  dy px nach unten, vy px/ms
 * @returns {"schliessen"|"zurueck"}
 */
export function zieheEntscheidung({ dy, vy, hoehe }) {
  const schwelle = Math.max(96, (hoehe || 0) * 0.3);
  if (dy >= schwelle) return "schliessen";
  if (vy > 0.5 && dy > 24) return "schliessen";
  return "zurueck";
}

/** Widerstand beim Ziehen nach oben (Gummiband, wie iOS). */
export function gummiband(dy) {
  if (dy >= 0) return dy;
  return -Math.round(Math.sqrt(-dy) * 4);
}

/**
 * Tooltip-Verzögerung: 400 ms, in einer Gruppe 0 ms (Q-H3, G-06).
 * @param {number|null} zuletztGeschlossen  Zeitpunkt (ms) des letzten Schließens eines Tooltips
 * @param {number} jetzt
 */
export function tooltipVerzoegerung(zuletztGeschlossen, jetzt) {
  if (zuletztGeschlossen == null) return TOOLTIP_VERZOEGERUNG;
  return jetzt - zuletztGeschlossen < TOOLTIP_GRUPPE_MS ? 0 : TOOLTIP_VERZOEGERUNG;
}

const PANEL_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * URL mit gesetztem bzw. entferntem `?panel=<name>` (G-07). Andere Parameter und Hash bleiben.
 * @param {string} href  aktuelle URL (absolut oder relativ mit Pfad)
 * @param {string|null} name  null = Parameter entfernen
 * @returns {string} Pfad + Suche + Hash
 */
export function panelUrl(href, name) {
  const u = new URL(href, "http://x.invalid");
  if (name && PANEL_NAME.test(name)) u.searchParams.set("panel", name);
  else u.searchParams.delete("panel");
  const q = u.searchParams.toString();
  return `${u.pathname}${q ? `?${q}` : ""}${u.hash}`;
}

/** Panel-Name aus einer Suche („?panel=vorschau“) oder null. */
export function panelAusSuche(suche) {
  const w = new URLSearchParams(suche || "").get("panel");
  return w && PANEL_NAME.test(w) ? w : null;
}

/**
 * Tipp-Suche im Menü: erster nicht gesperrter Eintrag ab `start + 1`, dessen Titel mit `puffer` beginnt.
 * @param {string[]} titel  @param {number} start  @param {string} puffer  @param {(i:number)=>boolean} [gesperrt]
 */
export function tippSuche(titel, start, puffer, gesperrt) {
  const p = String(puffer || "").toLocaleLowerCase("de");
  if (!p || !titel.length) return -1;
  const n = titel.length;
  for (let k = 1; k <= n; k++) {
    const j = (start + k + n) % n;
    if (!gesperrt?.(j) && String(titel[j] || "").toLocaleLowerCase("de").startsWith(p)) return j;
  }
  return -1;
}

/**
 * Position eines Mediums in der Lightbox als Text-Bausteine (für Ansage und Zähler).
 * @param {{typ?:string, src?:string, titel?:string}} m
 */
export function medienArt(m) {
  if (!m) return "unbekannt";
  if (m.typ === "pdf" || m.typ === "bild") return m.typ;
  return /\.pdf($|[?#])/i.test(m.src || "") ? "pdf" : "bild";
}

/** Darf ein Medium heruntergeladen werden? Nur mit Recht und freigegebenem Umfang (Sortiment). */
export function darfHerunterladen(m, recht) {
  if (!recht || !m || !m.src) return false;
  if (m.download === false) return false;
  return !m.freigabe || m.freigabe.download !== false;
}
