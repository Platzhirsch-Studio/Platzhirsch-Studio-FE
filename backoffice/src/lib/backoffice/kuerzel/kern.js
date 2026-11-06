// Kürzel-Register – reine Logik (G-02, Q-F1…Q-F8): Tasten normalisieren, Ereignisse auflösen,
// Einzeltasten erkennen, Eingabefelder schützen, Anzeige für Windows und Mac, Konsistenzprüfung.
// Browsertauglich, ohne React; der Hook liegt in kuerzel/useKuerzel.js, die Einträge in kuerzel/<datei>.js.
//
// Tastenschreibweise (kanonisch, klein): Modifikatoren in fester Reihenfolge "mod+alt+shift+<taste>".
//   mod = Strg (Windows/Linux) bzw. ⌘ (Mac) – MASTER: „Mac-Auflösung Strg → ⌘“.
//   Tasten: a–z, 0–9, f1–f12, enter, escape, space, tab, delete, arrowup/-down/-left/-right, Zeichen wie / ? [ ] + - *
//   Folgen: zwei Tasten mit Leerzeichen, z. B. "g c" (Gehe zu CRM, Fenster 1,5 s).

/** Kontexte (Q-F1). `@<bereich>` hängt Bereichseinträge an einen Grundkontext (z. B. "akte@faktura"). */
export const KONTEXTE = Object.freeze({
  global: "Überall",
  zentrale: "Zentrale",
  liste: "Listen",
  karten: "Kanban",
  akte: "Akte",
  palette: "Befehlspalette",
  glocke: "Benachrichtigungen",
  arbeitsplatz: "Arbeitsplatz wählen",
  kiosk: "Alle Arbeitsplätze (Kiosk)",
  "kiosk-kassa": "Kassa",
  "kiosk-packtisch": "Packtisch",
  "kiosk-mobil": "Montage und Technik",
});

/** Kontexte, die gemeinsam mit `global` aktiv sind (Backoffice-Seiten). */
export const SEITEN_KONTEXTE = ["zentrale", "liste", "karten", "akte", "arbeitsplatz"];
/** Modale Kontexte: solange offen, gelten nur ihre Tasten. */
export const MODALE_KONTEXTE = ["palette", "glocke"];
/** Kiosk-Kontexte: immer zusammen mit `kiosk`, nie mit `global`. */
export const KIOSK_KONTEXTE = ["kiosk-kassa", "kiosk-packtisch", "kiosk-mobil"];

/** Zeitfenster der Folge-Kürzel (G A, G C …). */
export const FOLGE_MS = 1500;

const MODIFIKATOREN = ["mod", "ctrl", "alt", "shift"];
const NAMEN = { esc: "escape", " ": "space", spacebar: "space", del: "delete", up: "arrowup", down: "arrowdown", left: "arrowleft", right: "arrowright", return: "enter" };

/** Grundkontext von "akte@faktura" → "akte". */
export function grundKontext(kontext) {
  return String(kontext || "").split("@")[0];
}

/**
 * Taste in die kanonische Form bringen: "Strg+Shift+P" → "mod+shift+p", "Ctrl+/" → "mod+/", "G C" → "g c".
 * @param {string} taste
 */
export function normalisiere(taste) {
  const t = String(taste || "").trim().toLowerCase();
  if (!t) return "";
  if (/\s/.test(t) && !t.includes("+")) return t.split(/\s+/).map(normalisiere).join(" ");
  // "+" als Taste selbst: "shift++" oder "+"
  const teile = t === "+" ? ["+"] : t.endsWith("++") ? [...t.slice(0, -2).split("+"), "+"] : t.split("+");
  const mods = new Set();
  let haupt = "";
  for (const roh of teile) {
    const p = { strg: "mod", ctrl: "mod", cmd: "mod", "⌘": "mod", meta: "mod", control: "mod", umschalt: "shift", option: "alt", wahl: "alt" }[roh] || roh;
    if (MODIFIKATOREN.includes(p)) mods.add(p);
    else haupt = NAMEN[p] || p;
  }
  if (mods.has("ctrl")) {
    mods.delete("ctrl");
    mods.add("mod");
  }
  return [...MODIFIKATOREN.filter((m) => mods.has(m)), haupt].join("+");
}

/** true, wenn die Taste ein „Einzeltasten-Kürzel“ ist (Zeichen ohne Strg/⌘/Alt, WCAG 2.1.4); Folgen zählen auch. */
export function istEinzeltaste(taste) {
  const n = normalisiere(taste);
  if (n.includes(" ")) return true;
  const teile = n === "+" ? ["+"] : n.endsWith("++") ? [...n.slice(0, -2).split("+"), "+"] : n.split("+");
  const haupt = teile.at(-1);
  if (teile.some((x) => x === "mod" || x === "alt")) return false;
  return haupt.length === 1;
}

/** Ziel eines Tastendrucks ist ein Eingabefeld (Einzeltasten wirken dort nie, Q-F6). */
export function istEingabeZiel(ziel) {
  if (!ziel || typeof ziel !== "object") return false;
  if (ziel.isContentEditable) return true;
  if (typeof ziel.closest === "function") return !!ziel.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-scan]');
  return /^(input|textarea|select)$/i.test(ziel.tagName || "");
}

/**
 * Tastatur-Ereignis → kanonische Taste (oder "" für reine Modifikator-Drücke).
 * @param {{key:string, code?:string, ctrlKey?:boolean, metaKey?:boolean, altKey?:boolean, shiftKey?:boolean}} e
 * @param {boolean} [mac]
 */
export function tasteAusEreignis(e, mac = false) {
  let key = String(e.key || "");
  if (!key || ["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "Dead", "Unidentified"].includes(key)) return "";
  const mod = mac ? !!e.metaKey : !!e.ctrlKey;
  const fremd = mac ? !!e.ctrlKey : !!e.metaKey; // Strg am Mac / Windows-Taste: nie unser Kürzel
  if (fremd) return "";
  // Alt verändert am Mac das Zeichen (Alt+1 → „¡“): dann zählt die physische Taste.
  if (e.altKey && e.code) {
    const m = /^(?:Digit|Numpad)(\d)$|^Key([A-Z])$/.exec(e.code);
    if (m) key = (m[1] ?? m[2]).toLowerCase();
  }
  let haupt = NAMEN[key.toLowerCase()] || key.toLowerCase();
  const zeichen = haupt.length === 1;
  const buchstabe = /^[a-z]$/.test(haupt);
  const mods = [];
  if (mod) mods.push("mod");
  if (e.altKey) mods.push("alt");
  // Umschalt nur bei Buchstaben und benannten Tasten; bei Zeichen steckt es schon im Zeichen („?“, „/“).
  if (e.shiftKey && (!zeichen || buchstabe)) mods.push("shift");
  if (haupt === "dead") haupt = "";
  return haupt ? [...mods, haupt].join("+") : "";
}

/**
 * Anzeige einer Taste: "mod+shift+p" → Windows „Strg+Umschalt+P“, Mac „⌘⇧P“; Folgen „G dann C“.
 * @param {string} taste
 * @param {boolean} [mac]
 * @returns {string[]} einzelne Tasten-Kappen für <kbd>
 */
export function anzeigeTasten(taste, mac = false) {
  const n = normalisiere(taste);
  if (n.includes(" ")) return n.split(" ").flatMap((t, i) => (i ? ["dann", ...anzeigeTasten(t, mac)] : anzeigeTasten(t, mac)));
  const teile = n === "+" ? ["+"] : n.endsWith("++") ? [...n.slice(0, -2).split("+"), "+"] : n.split("+");
  const namen = {
    mod: mac ? "⌘" : "Strg",
    alt: mac ? "⌥" : "Alt",
    shift: mac ? "⇧" : "Umschalt",
    enter: mac ? "↩" : "Enter",
    escape: "Esc",
    space: "Leertaste",
    tab: "Tab",
    delete: "Entf",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  };
  return teile.map((t) => namen[t] || (/^f\d+$/.test(t) ? t.toUpperCase() : t.length === 1 ? t.toUpperCase() : t));
}

/** Anzeige als Text („Strg+K“, „⌘K“, „G dann C“). */
export function anzeigeText(taste, mac = false) {
  const k = anzeigeTasten(taste, mac);
  if (k.includes("dann")) return k.join(" ");
  return mac ? k.join("") : k.join("+");
}

/**
 * Ereignis gegen einen Katalog auflösen.
 * @param {{key:string, code?:string, ctrlKey?:boolean, metaKey?:boolean, altKey?:boolean, shiftKey?:boolean, target?:any}} e
 * @param {Array<{kontext:string, taste:string, id:string, inEingabe?:boolean}>} katalog
 * @param {{kontexte:string[], mac?:boolean, einzeltasten?:boolean, folge?:{praefix:string, bis:number}|null, jetzt?:number}} opts
 * @returns {{art:"treffer", eintrag:object} | {art:"folge", praefix:string, bis:number, ziele:object[]} | {art:"abbruch"} | null}
 */
export function aufloesen(e, katalog, { kontexte, mac = false, einzeltasten = true, folge = null, jetzt = Date.now() }) {
  const taste = tasteAusEreignis(e, mac);
  if (!taste) return null;
  const aktiv = new Set(kontexte);
  const kandidaten = katalog.filter((k) => aktiv.has(k.kontext));
  const inEingabe = istEingabeZiel(e.target);

  if (folge && jetzt <= folge.bis) {
    if (taste === "escape") return { art: "abbruch" };
    const ganz = `${folge.praefix} ${taste}`;
    const t = kandidaten.find((k) => normalisiere(k.taste) === ganz);
    return t ? { art: "treffer", eintrag: t } : { art: "abbruch" };
  }

  const erlaubt = (k) => {
    const einzel = istEinzeltaste(k.taste);
    if (einzel && (!einzeltasten || inEingabe)) return false;
    if (inEingabe && k.inEingabe === false) return false;
    return true;
  };

  const direkt = kandidaten.find((k) => normalisiere(k.taste) === taste && erlaubt(k));
  if (direkt) return { art: "treffer", eintrag: direkt };

  const ziele = kandidaten.filter((k) => normalisiere(k.taste).startsWith(`${taste} `) && erlaubt(k));
  if (ziele.length) return { art: "folge", praefix: taste, bis: jetzt + FOLGE_MS, ziele };
  return null;
}

/**
 * Gruppen von Kontexten, die gleichzeitig aktiv sein können (für die Kollisionsprüfung).
 * @param {string[]} bereichsKontexte z. B. ["akte@faktura", "liste@crm"]
 */
export function aktiveGruppen(bereichsKontexte = []) {
  const gruppen = [];
  for (const k of SEITEN_KONTEXTE) {
    gruppen.push(["global", k]);
    for (const b of bereichsKontexte.filter((x) => grundKontext(x) === k)) gruppen.push(["global", k, b]);
  }
  for (const k of MODALE_KONTEXTE) gruppen.push([k]);
  gruppen.push(["kiosk"]);
  for (const k of KIOSK_KONTEXTE) {
    gruppen.push(["kiosk", k]);
    for (const b of bereichsKontexte.filter((x) => grundKontext(x) === k)) gruppen.push(["kiosk", k, b]);
  }
  return gruppen;
}

/**
 * Konsistenz des Katalogs (Unit-Test, Q-F1/Q-F5/Q-F7): doppelte IDs, Doppelbelegung in gleichzeitig aktiven
 * Kontexten, Taste zugleich Einzeltaste und Folge-Anfang, unbekannte Kontexte, Bereichsregeln
 * (nur Umschalt+Buchstabe, keine Folgen, kein Alt/Strg+Alt), Außenwirkung nur als Dialog, Kiosk ohne Buchstaben.
 * @param {Array<{kontext:string, taste:string, id:string, titel:string, bereich?:string, aussenwirkung?:boolean, nurDialog?:boolean}>} katalog
 * @returns {string[]}
 */
export function pruefeKuerzel(katalog) {
  const befunde = [];
  const ids = new Map();
  for (const k of katalog) {
    if (!k.id || !k.titel) befunde.push(`Kürzel ohne id/titel: ${JSON.stringify(k)}`);
    if (ids.has(k.id)) befunde.push(`Kürzel-ID doppelt: ${k.id}`);
    ids.set(k.id, k);
    const grund = grundKontext(k.kontext);
    if (!(grund in KONTEXTE)) befunde.push(`${k.id}: unbekannter Kontext ${k.kontext}`);
    const n = normalisiere(k.taste);
    if (!n) befunde.push(`${k.id}: Taste fehlt`);
    if (n !== String(k.taste).trim()) befunde.push(`${k.id}: Taste nicht kanonisch („${k.taste}“ → „${n}“)`);
    if (k.aussenwirkung && !k.nurDialog) befunde.push(`${k.id}: Aktion mit Außenwirkung (Mail, Geld, Kunde) darf höchstens einen Dialog öffnen (Q-F5)`);
    if (grund.startsWith("kiosk") && istEinzeltaste(n) && /(^|\+)[a-z]$/.test(n.split(" ").at(-1))) befunde.push(`${k.id}: Kiosk ohne Einzelbuchstaben (Q-F7)`);
    if (k.kontext.includes("@")) {
      if (grund === "global") befunde.push(`${k.id}: Bereiche tragen nicht in „global“ ein`);
      if (!grund.startsWith("kiosk")) {
        if (!/^shift\+[a-z]$/.test(n)) befunde.push(`${k.id}: Bereichsaktion nur als Umschalt+Buchstabe (Q-F5), nicht „${n}“`);
      }
      if (n.includes(" ")) befunde.push(`${k.id}: keine bereichseigenen Folgen (G-Akkorde)`);
    }
  }
  const bereichsKontexte = [...new Set(katalog.map((k) => k.kontext).filter((x) => x.includes("@")))];
  for (const gruppe of aktiveGruppen(bereichsKontexte)) {
    const inGruppe = katalog.filter((k) => gruppe.includes(k.kontext));
    const belegt = new Map();
    for (const k of inGruppe) {
      const n = normalisiere(k.taste);
      if (belegt.has(n) && belegt.get(n) !== k.id) befunde.push(`Doppelbelegung „${n}“ in [${gruppe.join(", ")}]: ${belegt.get(n)} und ${k.id}`);
      belegt.set(n, k.id);
    }
    for (const [n, id] of belegt) {
      if (n.includes(" ")) continue;
      const folge = [...belegt.keys()].find((x) => x.startsWith(`${n} `));
      if (folge) befunde.push(`„${n}“ (${id}) ist zugleich Anfang der Folge „${folge}“ in [${gruppe.join(", ")}]`);
    }
  }
  return [...new Set(befunde)];
}
