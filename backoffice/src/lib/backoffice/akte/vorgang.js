// Reine Logik der Vorgangsleiste (G-12, Team P0-5a) – ohne React, unit-getestet.
//
// Datenform (eingefroren, siehe README „Akte und Vorgang (Team P0-5a)“):
//   schritte: [{
//     id, titel,                                   // Stufe („Angebot & Auftrag“, „Rechnung“)
//     zustand?: "erledigt"|"aktuell"|"teilweise"|"offen"|"uebersprungen",  // fehlt → aus aufgaben abgeleitet
//     datum?: string,   // Eintritt (ISO oder fertiger Text)
//     plan?: string,    // geplant („KW 50“)
//     objekte?: [{ titel, href?, info? }],          // Belege/Vorgänge der Stufe (Popover am Stufennamen)
//     aufgaben?: [{ id?, titel, person?, datum?, zustand?, href? }],  // Schritte in der Stufe (Kundenreise)
//   }]
// Bereiche liefern die Stufen aus ihren Daten (Projekte: PH Projekt.status + Phasen, CRM: vorgang.js,
// Faktura: Belegkette, Service: get_next_steps). Die Leiste rechnet nichts Fachliches selbst.

export const ZUSTAENDE = Object.freeze(["erledigt", "aktuell", "teilweise", "offen", "uebersprungen"]);

/** Gleichbedeutende Schreibweisen (Entwurf „Lounge“, Backend-Status) → Zustand der Leiste. */
const ALIAS = Object.freeze({
  fertig: "erledigt",
  done: "erledigt",
  erledigt: "erledigt",
  abgeschlossen: "erledigt",
  aktiv: "aktuell",
  aktuell: "aktuell",
  laeuft: "aktuell",
  "läuft": "aktuell",
  teilweise: "teilweise",
  teil: "teilweise",
  offen: "offen",
  geplant: "offen",
  uebersprungen: "uebersprungen",
  "übersprungen": "uebersprungen",
  entfaellt: "uebersprungen",
  "entfällt": "uebersprungen",
});

/** Zustand vereinheitlichen; Unbekanntes zählt als „offen“ (nie als erledigt). */
export function zustandVon(wert) {
  if (typeof wert !== "string") return "offen";
  return ALIAS[wert.trim().toLowerCase()] || "offen";
}

const istFertig = (z) => z === "erledigt" || z === "uebersprungen";

/** Zustand einer Stufe aus ihren Aufgaben (wenn die Stufe selbst keinen trägt). */
export function stufenZustand(aufgaben = []) {
  if (!aufgaben.length) return "offen";
  const z = aufgaben.map((a) => zustandVon(a.zustand));
  if (z.every(istFertig)) return z.every((x) => x === "uebersprungen") ? "uebersprungen" : "erledigt";
  if (z.includes("aktuell")) return "aktuell";
  if (z.some((x) => x === "erledigt" || x === "teilweise")) return "teilweise";
  return "offen";
}

function text(wert) {
  if (wert === null || wert === undefined) return "";
  return String(wert).trim();
}

/**
 * Stufen vereinheitlichen: Zustände normiert, Aufgaben-Ids vergeben, Stufen ohne Aufgaben bekommen
 * genau eine abgeleitete Karte (Titel = letztes Objekt bzw. leer, Datum/Plan der Stufe), damit jede
 * Spalte dieselbe Form hat. Doppelte oder fehlende Stufen-Ids werden eindeutig gemacht.
 * @param {Array<object>} schritte
 */
export function normalisiereSchritte(schritte = []) {
  const gesehen = new Set();
  return (Array.isArray(schritte) ? schritte : []).filter(Boolean).map((s, i) => {
    let id = text(s.id) || `stufe-${i + 1}`;
    while (gesehen.has(id)) id = `${id}-${i + 1}`;
    gesehen.add(id);
    const objekte = (Array.isArray(s.objekte) ? s.objekte : []).filter((o) => o && text(o.titel)).map((o) => ({ titel: text(o.titel), href: o.href || null, info: text(o.info) || null }));
    const roh = Array.isArray(s.aufgaben) ? s.aufgaben.filter((a) => a && text(a.titel)) : [];
    const aufgaben = roh.map((a, j) => ({
      id: text(a.id) || `${id}-${j + 1}`,
      titel: text(a.titel),
      person: a.person || null,
      datum: text(a.datum) || null,
      zustand: zustandVon(a.zustand),
      href: a.href || null,
    }));
    const zustand = s.zustand ? zustandVon(s.zustand) : stufenZustand(aufgaben);
    return {
      id,
      titel: text(s.titel) || `Stufe ${i + 1}`,
      zustand,
      datum: text(s.datum) || null,
      plan: text(s.plan) || null,
      objekte,
      aufgaben,
      abgeleitet: aufgaben.length === 0,
    };
  });
}

/**
 * Karten einer Stufe für die Darstellung: die Aufgaben oder – ohne Aufgaben – eine Karte aus der
 * Stufe selbst (Titel = letztes Objekt, sonst „noch keins“ bei offenen Stufen).
 * @param {ReturnType<typeof normalisiereSchritte>[number]} stufe
 * @param {{nochKeins?: string}} [opt]
 */
export function kartenDerStufe(stufe, { nochKeins = "noch keins" } = {}) {
  if (stufe.aufgaben.length) return stufe.aufgaben;
  const letztes = stufe.objekte[stufe.objekte.length - 1];
  return [{
    id: `${stufe.id}-1`,
    titel: letztes ? letztes.titel : stufe.zustand === "offen" ? nochKeins : stufe.titel,
    person: null,
    datum: stufe.datum || stufe.plan || null,
    zustand: stufe.zustand === "teilweise" ? "aktuell" : stufe.zustand,
    href: letztes?.href || null,
    leer: !letztes && stufe.zustand === "offen",
    abgeleitet: true,
  }];
}

/** Index der aktuellen Stufe: erste „aktuell“, sonst erste „teilweise“, sonst erste offene nach der letzten erledigten. */
export function aktuellerIndex(stufen = []) {
  const a = stufen.findIndex((s) => s.zustand === "aktuell");
  if (a >= 0) return a;
  const t = stufen.findIndex((s) => s.zustand === "teilweise");
  if (t >= 0) return t;
  let letzte = -1;
  stufen.forEach((s, i) => {
    if (istFertig(s.zustand)) letzte = i;
  });
  if (letzte === stufen.length - 1) return -1; // alles erledigt
  const naechste = stufen.findIndex((s, i) => i > letzte && s.zustand === "offen");
  return naechste;
}

/**
 * Fortschritt: zählt Aufgaben (Kundenreise) bzw. Stufen (ohne Aufgaben). Übersprungenes zählt nicht mit.
 * @returns {{erledigt:number, gesamt:number, aktuell:number, nr:number, stufen:number}}
 */
export function fortschritt(stufen = []) {
  let erledigt = 0;
  let gesamt = 0;
  for (const s of stufen) {
    const posten = s.aufgaben.length ? s.aufgaben : [{ zustand: s.zustand }];
    for (const p of posten) {
      if (p.zustand === "uebersprungen") continue;
      gesamt++;
      if (p.zustand === "erledigt") erledigt++;
    }
  }
  const aktuell = aktuellerIndex(stufen);
  return { erledigt, gesamt, aktuell, nr: aktuell >= 0 ? aktuell + 1 : stufen.length, stufen: stufen.length };
}

/** Personen der Reise (eindeutig, Reihenfolge des ersten Auftretens) für die Avatar-Reihe. */
export function personenDerReise(stufen = []) {
  const m = new Map();
  for (const s of stufen) {
    for (const a of s.aufgaben) {
      const p = a.person;
      if (!p) continue;
      const obj = typeof p === "string" ? { name: p } : p;
      const schluessel = obj.name || obj.kuerzel;
      if (schluessel && !m.has(schluessel)) m.set(schluessel, obj);
    }
  }
  return [...m.values()];
}

/**
 * Verbindungslinien zwischen Spalten (SVG, gemessen per ResizeObserver).
 * `spalten`: je Spalte `{ links, rechts, karten:[{ mitte, offen }] }` in Koordinaten des Behälters.
 * Von der letzten nicht offenen Karte der Spalte i (sonst der letzten) zur ersten Karte der Spalte i+1.
 * Offen = die Zielkarte ist offen (gestrichelt).
 * @returns {Array<{x1:number,y1:number,x2:number,y2:number,offen:boolean,d:string}>}
 */
export function verbindungen(spalten = []) {
  const out = [];
  for (let i = 0; i < spalten.length - 1; i++) {
    const a = spalten[i];
    const b = spalten[i + 1];
    if (!a?.karten?.length || !b?.karten?.length) continue;
    let von = -1;
    a.karten.forEach((k, j) => {
      if (!k.offen) von = j;
    });
    const quelle = a.karten[von >= 0 ? von : a.karten.length - 1];
    const ziel = b.karten[0];
    const x1 = a.rechts;
    const y1 = quelle.mitte;
    const x2 = b.links;
    const y2 = ziel.mitte;
    out.push({ x1, y1, x2, y2, offen: !!ziel.offen, d: bezier(x1, y1, x2, y2) });
  }
  return out;
}

/** S-Kurve wie im Entwurf (Kontrollpunkte 75 % der Strecke waagrecht). Werte auf 0,5 px gerundet. */
export function bezier(x1, y1, x2, y2) {
  const r = (v) => Math.round(v * 2) / 2;
  const dx = (x2 - x1) * 0.75;
  return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)}, ${r(x2 - dx)} ${r(y2)}, ${r(x2)} ${r(y2)}`;
}

/** Kurzform (Liste/Karte): ein Punkt je Stufe mit title-Text. */
export function kompaktePunkte(stufen = [], zustandText = (z) => z) {
  return stufen.map((s) => ({ id: s.id, zustand: s.zustand, title: `${s.titel}: ${zustandText(s.zustand)}${s.datum ? ` · ${s.datum}` : ""}` }));
}
