// Reine Logik des Kiosk-Kerns v2 (G-24, Team P0-6): Bänder, Idle-Sperre, Warteschlangen-Text, Wischen,
// Stepper, Positionsgrid. Ohne React/DOM, testbar mit node --test.

/**
 * Bänder nach Rang (Q-J4): nie blinkend, höchstens 2 sichtbar + „+n“. Ton: Offline `warnung`,
 * `gefahr` nur bei „Zahlung ohne Beleg“. Unbekannte Arten stehen hinten.
 */
export const BAND_RANG = Object.freeze({
  "zahlung-ohne-beleg": { rang: 0, ton: "gefahr", icon: "TriangleAlert" },
  idle: { rang: 1, ton: "info", icon: "Hourglass" },
  gesperrt: { rang: 2, ton: "warnung", icon: "Lock" },
  offline: { rang: 3, ton: "warnung", icon: "WifiOff" },
  see: { rang: 4, ton: "warnung", icon: "ShieldAlert" },
  training: { rang: 5, ton: "info", icon: "Info" },
  warteschlange: { rang: 6, ton: "info", icon: "RefreshCw" },
});

/**
 * @param {Array<{art:string, text:string, aktion?:object}>} baender
 * @param {number} [max]
 * @returns {{sichtbar: Array, weitere: number, verborgen: Array}}
 */
export function ordneBaender(baender = [], max = 2) {
  const liste = baender
    .filter((b) => b && b.text)
    .map((b, i) => ({ ...b, ton: b.ton || BAND_RANG[b.art]?.ton || "info", icon: b.icon || BAND_RANG[b.art]?.icon || "Info", _r: BAND_RANG[b.art]?.rang ?? 50, _i: i }))
    .sort((a, b) => a._r - b._r || a._i - b._i)
    .map(({ _r, _i, ...b }) => b);
  return { sichtbar: liste.slice(0, max), verborgen: liste.slice(max), weitere: Math.max(0, liste.length - max) };
}

/**
 * Idle-Phase der Kiosk-Sitzung (Q-E5, Q-J2): nach `idleMs` ohne Bedienung Sperrbild; die letzten `warnMs`
 * davor ein Band mit Rest-Sekunden.
 * @returns {{phase:"aktiv"|"warnung"|"gesperrt", rest:number}}  rest in ganzen Sekunden bis zur Sperre
 */
export function idlePhase(ruheMs, { idleMs = 15 * 60_000, warnMs = 30_000 } = {}) {
  const rest = Math.max(0, Math.ceil((idleMs - ruheMs) / 1000));
  if (ruheMs >= idleMs) return { phase: "gesperrt", rest: 0 };
  if (ruheMs >= idleMs - warnMs) return { phase: "warnung", rest };
  return { phase: "aktiv", rest };
}

const ARTEN = {
  foto: ["Foto", "Fotos"],
  unterschrift: ["Unterschrift", "Unterschriften"],
  status: ["Statusmeldung", "Statusmeldungen"],
  datei: ["Datei", "Dateien"],
};

/**
 * Sichtbarer Zähler der Upload-Warteschlange (Q-J6): „2 Fotos werden gesendet“,
 * „1 Foto und 1 Unterschrift warten auf Verbindung“, „1 Foto konnte nicht gesendet werden“.
 * @param {Array<{art:string, zustand:"wartet"|"sendet"|"fehler"}>} eintraege
 * @param {{online?: boolean}} [opt]
 */
export function warteschlangenText(eintraege = [], { online = true } = {}) {
  const fehler = eintraege.filter((e) => e.zustand === "fehler");
  const offen = eintraege.filter((e) => e.zustand !== "fehler");
  if (!offen.length && !fehler.length) return "";
  if (!offen.length) return `${aufzaehlen(fehler)} ${fehler.length === 1 ? "konnte" : "konnten"} nicht gesendet werden`;
  const verb = online ? (offen.length === 1 ? "wird gesendet" : "werden gesendet") : offen.length === 1 ? "wartet auf Verbindung" : "warten auf Verbindung";
  return `${aufzaehlen(offen)} ${verb}`;
}

function aufzaehlen(liste) {
  const zahl = new Map();
  for (const e of liste) zahl.set(e.art, (zahl.get(e.art) || 0) + 1);
  const teile = [...zahl.entries()].map(([art, n]) => {
    const w = ARTEN[art] || ARTEN.datei;
    return `${n} ${n === 1 ? w[0] : w[1]}`;
  });
  return teile.length > 1 ? `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}` : teile[0];
}

/**
 * Wischaktion: Entscheidung beim Loslassen. Ausgelöst, wenn der Weg ≥ `schwelle` × Breite ist oder
 * schnell geworfen wurde (≥ 0,6 px/ms und ≥ 48 px). Richtung nur, wenn dafür eine Aktion existiert.
 * @returns {"links"|"rechts"|null}
 */
export function wischEntscheidung({ dx, breite, geschwindigkeit = 0, links = true, rechts = true, schwelle = 0.35 }) {
  const weit = breite > 0 && Math.abs(dx) >= breite * schwelle;
  const wurf = Math.abs(geschwindigkeit) >= 0.6 && Math.abs(dx) >= 48 && Math.sign(geschwindigkeit) === Math.sign(dx);
  if (!weit && !wurf) return null;
  if (dx < 0 && links) return "links";
  if (dx > 0 && rechts) return "rechts";
  return null;
}

/** Wischweg mit Gummiband jenseits der Aktion (wie iOS): bis `grenze` 1:1, danach gedämpft. */
export function gummiband(dx, grenze, { links = true, rechts = true } = {}) {
  if ((dx < 0 && !links) || (dx > 0 && !rechts)) return dx * 0.15;
  const abs = Math.abs(dx);
  if (abs <= grenze) return dx;
  return Math.sign(dx) * (grenze + (abs - grenze) * 0.3);
}

/** Stepper: ganzzahlig, begrenzt. */
export function stepperWert(wert, delta, { min = 0, max = 999, schritt = 1 } = {}) {
  const n = Math.round(Number(wert) || 0) + delta * schritt;
  return Math.min(max, Math.max(min, n));
}

/**
 * Positionsgrid (role="grid", Roving-Tabindex): Bewegung um Zeile/Spalte.
 * @returns {{zeile:number, spalte:number}|null}
 */
export function gridBewegung({ zeile, spalte }, taste, { zeilen, spalten, strg = false }) {
  if (!zeilen || !spalten) return null;
  let z = zeile;
  let s = spalte;
  switch (taste) {
    case "ArrowUp":
      z -= 1;
      break;
    case "ArrowDown":
      z += 1;
      break;
    case "ArrowLeft":
      s -= 1;
      break;
    case "ArrowRight":
      s += 1;
      break;
    case "Home":
      if (strg) z = 0;
      s = 0;
      break;
    case "End":
      if (strg) z = zeilen - 1;
      s = spalten - 1;
      break;
    case "PageUp":
      z -= 5;
      break;
    case "PageDown":
      z += 5;
      break;
    default:
      return null;
  }
  return { zeile: Math.min(zeilen - 1, Math.max(0, z)), spalte: Math.min(spalten - 1, Math.max(0, s)) };
}

/** Tastatur angeschlossen? Erkennung über echte Tastendrücke (nicht über Touch/Bildschirmtastatur). */
export function istPhysischeTaste(e) {
  if (!e || e.isComposing) return false;
  if (e.key === "Unidentified" || e.key === "Process") return false;
  return /^F\d{1,2}$/.test(e.key) || e.key === "Tab" || e.key === "Escape" || e.ctrlKey || e.metaKey || e.altKey || /^Arrow/.test(e.key);
}
