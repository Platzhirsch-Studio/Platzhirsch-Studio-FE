// Reine Logik für „Kunden informieren“ (G-18) und „Leitung bitten“ (G-05) – Team P0-5c.
// Ohne "@/"-Importe, testbar mit node --test (tests/unit/backoffice-p05c.test.mjs).

export const KANAELE = Object.freeze(["email", "telefon", "brief"]);
const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/;
const PLATZHALTER = /\{([a-z_][a-z0-9_]*)\}/gi;

export function istEmail(text) {
  return typeof text === "string" && text.length <= 254 && EMAIL.test(text.trim());
}

/**
 * Vorlage füllen: {kunde}, {termin} … aus `werte`. Fehlende Werte bleiben sichtbar stehen und werden gemeldet –
 * nie still leer (Q-A6).
 * @returns {{text:string, fehlende:string[]}}
 */
export function fuelleVorlage(text, werte = {}) {
  const fehlende = new Set();
  const aus = String(text ?? "").replace(PLATZHALTER, (ganz, schluessel) => {
    const w = werte?.[schluessel];
    if (w === undefined || w === null || w === "") {
      fehlende.add(schluessel);
      return ganz;
    }
    return String(w);
  });
  return { text: aus, fehlende: [...fehlende] };
}

/**
 * Welche Kanäle gehen für diesen Empfänger? E-Mail nur mit Adresse und Versandweg; Telefon/Brief sind Erfassungen
 * und gehen immer (Brief braucht keine Adresse im System, die steht am Beleg).
 * @param {{email?:string, telefon?:string}} empfaenger
 * @param {{versand?:boolean}} [o]  versand = es gibt einen Mailweg (Exchange oder Bereichsmethode)
 * @returns {{id:string, an:boolean, grund:"keine-email"|"kein-versand"|null}[]}
 */
export function kanaeleFuer(empfaenger = {}, { versand = true } = {}) {
  const mail = istEmail(empfaenger.email || "");
  return [
    { id: "email", an: mail && versand, grund: !mail ? "keine-email" : !versand ? "kein-versand" : null },
    { id: "telefon", an: true, grund: null },
    { id: "brief", an: true, grund: null },
  ];
}

/** Startkanal: bevorzugter Kanal, wenn möglich, sonst E-Mail, sonst Telefon. */
export function startKanal(kanaele, bevorzugt) {
  const frei = (id) => kanaele.find((k) => k.id === id && k.an);
  const b = normKanal(bevorzugt);
  if (b && frei(b)) return b;
  if (frei("email")) return "email";
  return "telefon";
}

/** „E-Mail“, „Telefon“, „Brief“, „WhatsApp“ (aus PH Kontakt.kommunikation_bevorzugt) → Kanal-ID oder null. */
export function normKanal(wert) {
  const w = String(wert || "").toLowerCase();
  if (/mail/.test(w)) return "email";
  if (/telefon|anruf|phone/.test(w)) return "telefon";
  if (/brief|post/.test(w)) return "brief";
  return null;
}

/** Text → schlichtes HTML (Absätze, Zeilenumbrüche, maskiert). Für den Exchange-Weg (mail_senden erwartet html). */
export function textZuHtml(text) {
  const maske = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((absatz) => absatz.trim())
    .filter(Boolean)
    .map((absatz) => `<p>${maske(absatz).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/**
 * Eingaben des Sheets prüfen (Server Action ruft das erneut auf).
 * @returns {{ok:true, wert:object} | {ok:false, fehler:Record<string,string>}}
 */
export function pruefeInformieren(e = {}, texte) {
  const fehler = {};
  const kanal = KANAELE.includes(e.kanal) ? e.kanal : null;
  if (!kanal) fehler.kanal = "Kanal fehlt.";
  const betreff = String(e.betreff ?? "").trim();
  const nachricht = String(e.nachricht ?? "").trim();
  if (kanal === "email") {
    if (!betreff) fehler.betreff = texte?.pflicht?.betreff || "Betreff fehlt.";
    if (!nachricht) fehler.nachricht = texte?.pflicht?.nachricht || "Nachricht fehlt.";
    if (!istEmail(e.an || "")) fehler.an = "E-Mail-Adresse fehlt.";
  } else if (kanal && !nachricht) fehler.nachricht = texte?.pflicht?.notiz || "Notiz fehlt.";
  if (betreff.length > 200) fehler.betreff = "Betreff ist zu lang.";
  if (nachricht.length > 10000) fehler.nachricht = "Nachricht ist zu lang.";
  if (Object.keys(fehler).length) return { ok: false, fehler };
  return { ok: true, wert: { kanal, betreff, nachricht, an: kanal === "email" ? String(e.an).trim() : null } };
}

const DOCTYPE = /^PH [A-Za-zÄÖÜäöüß ]{2,60}$/;
const NAME = /^[\w.\- /:]{1,140}$/u;

/** Objekt-Bezug prüfen ({doctype:"PH …", name}). */
export function pruefeObjekt(o) {
  if (!o || typeof o !== "object") return null;
  const doctype = String(o.doctype || "");
  const name = String(o.name || "");
  if (!DOCTYPE.test(doctype) || !NAME.test(name)) return null;
  return { doctype, name, titel: o.titel ? String(o.titel).slice(0, 140) : name };
}

/**
 * Kennung einer Bitte an die Leitung, idempotent je Objekt/Aktion/Tag (Q-C11, Faktura E12):
 * `<bereich>:bitte:<doctype>:<name>:<aktion>`. Der Tag steckt im Abfragefilter (erstellt ≥ heute), nicht in der Kennung.
 */
export function leitungSchluessel({ bereich, aktion, doctype, name }) {
  return `${bereich}:bitte:${doctype}:${name}:${aktion}`;
}

/** Rolle der Bereichsleitung aus dem Register-Rollennamen („CRM“ → „PH CRM Leitung“). */
export function leitungsRolle(rollenName) {
  return rollenName ? `PH ${rollenName} Leitung` : null;
}

/** Datum JJJJ-MM-TT (lokal) für „heute“-Filter. */
export function tagIso(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Kurze Zeitangabe für Zustände („09:14“ heute, sonst „04.11. 09:14“). Q-A5: relativ nur am selben Tag.
 * @param {string|Date|number} wert
 */
export function zeitKurz(wert, jetzt = new Date()) {
  const d = wert instanceof Date ? wert : new Date(typeof wert === "string" ? wert.replace(" ", "T") : wert);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  const uhr = `${p(d.getHours())}:${p(d.getMinutes())}`;
  if (tagIso(d) === tagIso(jetzt)) return `heute ${uhr}`;
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}. ${uhr}`;
}

// ------------------------------------------------------------------ An der Kassa (G-19) --

export const KASSA_VARIANTEN = Object.freeze(["zahlung", "erstattung", "gutschein"]);
const KENNUNG = /^[\w.\-/]{1,140}$/u;

/** Ziel-URL der Kassa mit Kunde/Beleg (nur gültige Kennungen, Rest wird weggelassen). */
export function kassaHref({ kunde, beleg, variante = "zahlung" } = {}) {
  const p = new URLSearchParams();
  if (kunde && KENNUNG.test(String(kunde))) p.set("kunde", String(kunde));
  if (beleg && KENNUNG.test(String(beleg))) p.set("beleg", String(beleg));
  if (variante !== "zahlung" && KASSA_VARIANTEN.includes(variante)) p.set("art", variante);
  const q = p.toString();
  return q ? `/kassa?${q}` : "/kassa";
}
