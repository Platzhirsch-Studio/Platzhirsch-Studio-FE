// Scanner-Erkennung (G-22 ScanTor) – reine Logik ohne DOM-Abhängigkeit, testbar mit node --test.
// Hand-Scanner arbeiten als Tastatur („Wedge“): Zeichen im Abstand von wenigen Millisekunden, am Ende
// Enter (manche Geräte Tab). Menschen tippen nie schneller als ~50 ms je Zeichen.

export const SCAN_ABSTAND_MS = 30; // MASTER G-22: Zeichenabstand < 30 ms
export const SCAN_MIN_LAENGE = 4;
const END_TASTEN = new Set(["Enter", "Tab"]);

/**
 * Zustandsautomat: taste(key, zeitMs) →
 *  { art: "scan", code }          Enter/Tab nach einer schnellen Folge (≥ minLaenge Zeichen)
 *  { art: "zeichen", folge }      druckbares Zeichen; folge = true, wenn es schneller als maxAbstand
 *                                 nach dem vorigen kam (dann gehört es sicher zu einem Scan)
 *  { art: "andere" }              sonstige Taste (setzt zurück)
 * @param {{maxAbstand?: number, minLaenge?: number}} [opt]
 */
export function erstelleScanErkenner({ maxAbstand = SCAN_ABSTAND_MS, minLaenge = SCAN_MIN_LAENGE } = {}) {
  let puffer = "";
  let letzte = -Infinity;
  let schnell = true;
  const reset = () => {
    puffer = "";
    schnell = true;
  };
  return {
    taste(key, zeit) {
      const abstand = zeit - letzte;
      letzte = zeit;
      if (END_TASTEN.has(key)) {
        const code = puffer;
        const war = schnell && abstand <= maxAbstand * 3;
        reset();
        if (war && code.length >= minLaenge) return { art: "scan", code };
        return { art: "andere" };
      }
      if (typeof key === "string" && key.length === 1) {
        if (abstand > maxAbstand || !puffer) {
          puffer = key;
          schnell = true;
          return { art: "zeichen", folge: false };
        }
        puffer += key;
        return { art: "zeichen", folge: true };
      }
      if (key === "Shift" || key === "CapsLock" || key === "AltGraph") return { art: "andere", neutral: true };
      reset();
      return { art: "andere" };
    },
    get puffer() {
      return puffer;
    },
    zuruecksetzen: reset,
  };
}

/**
 * Wohin gehört ein Scan an diesem Element?
 *  "aus"      – Opt-out (`data-scan="nein"` am Element oder einem Vorfahren) oder ScanTor gesperrt
 *  "feld"     – Eingabefeld mit `data-scan="ja"`: das Feld bekommt den Code (Ereignis „ph-bo:scan“)
 *  "tippen"   – anderes Eingabefeld (Backoffice): normale Eingabe, kein Scan
 *  "global"   – Kiosk außerhalb von Feldern: onScan der Seite
 *  "palette"  – Backoffice außerhalb von Feldern: Befehlspalette mit dem Code
 * `el` muss nur `closest(selector)`, `tagName`, `isContentEditable` können (DOM-Element oder Attrappe).
 * @param {{closest:(s:string)=>any, tagName?:string, isContentEditable?:boolean}|null} el
 * @param {"kiosk"|"backoffice"} modus
 */
export function scanZiel(el, modus = "backoffice") {
  const opt = el?.closest?.("[data-scan]");
  const wert = opt?.getAttribute ? opt.getAttribute("data-scan") : opt?.dataset?.scan;
  if (wert === "nein") return "aus";
  const istFeld = !!el && (/^(input|textarea|select)$/i.test(el.tagName || "") || !!el.isContentEditable);
  if (istFeld && wert === "ja") return "feld";
  if (istFeld) return modus === "kiosk" ? "global" : "tippen";
  return modus === "kiosk" ? "global" : "palette";
}

/** Kurzer Anzeigetext für erkannte Codes (Ansage in der Live-Region). */
export function scanAnsage(erkannt, code) {
  if (!erkannt || !erkannt.art || erkannt.art === "text") return `Code ${code} gelesen`;
  const NAMEN = {
    kundenkarte: "Kundenkarte",
    gutschein: "Gutschein",
    ean: "Artikel",
    beleg: "Beleg",
    kassenbeleg: "Kassenbeleg",
    "kassenbeleg-qr": "Kassenbeleg-Code",
    lageretikett: "Lagerplatz",
    "event-qr": "Event-Ticket",
    abholcode: "Abholcode",
    url: "Website-Link",
  };
  return `${NAMEN[erkannt.art] || "Code"} ${erkannt.wert || code} gelesen`;
}
