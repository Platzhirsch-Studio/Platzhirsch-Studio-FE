// Kundendisplay-Kanal (Team P0-6): Nachrichtenform zwischen Kassa und Kundendisplay – reine Logik, Browser
// und Server. Kopplung (lounge.md §10, 10-konzept-kassa §9, Inhaber Nr. 51): gleiches Gerät über
// BroadcastChannel „ph-kassa-<Kasse>“, zweites Gerät über den SSE-Kanal des Fundaments
// (`/api/kassa/display?kasse=K1`, Rückfall Polling 2 s); ohne Verbindung Ruhebild + „Anzeige pausiert“.
//
// Datensparsam (R10, K26): Es gehen nur Positionen, Beträge, Zahlart, Kundenkarten-STUFE und Vorteile
// durch den Kanal – nie E-Mail, Telefon, Adresse, Kundennummer oder Punkte/Guthaben (Kundenkarte ohne
// Geldwert, Nr. 46–53). Name nur nach Einstellung `kundendisplay_anrede` (aus · vorname · name), nie Anrede.

export const KANAL_PFAD = "/api/kassa/display";
export const KASSE_MUSTER = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;
export const ZUSTAENDE = ["ruhe", "einkauf", "bezahlen", "danke"];
export const MAX_POSITIONEN = 6;
export const PULS_MS = 5000;
export const PAUSE_NACH_MS = 15000;

/** Zustandsnamen aus ph_kassa (`_display`: positionen, karte, fertig, beleg, terminal) → Lounge. */
const AUS_PH_KASSA = { positionen: "einkauf", karte: "bezahlen", terminal: "bezahlen", fertig: "danke", beleg: "danke", leer: "ruhe" };

export function kanalName(kasse) {
  return `ph-kassa-${kasse}`;
}

export function kasseGueltig(kasse) {
  return typeof kasse === "string" && KASSE_MUSTER.test(kasse);
}

const cent = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
const text = (v, max = 120) => (v === null || v === undefined ? "" : String(v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max));
const ANREDE = /^(frau|herr|fr\.|hr\.|mr\.?|mrs\.?|ms\.?|dr\.?|mag\.?|ing\.?|di\.?)\s+/i;

/** Name nach Einstellung – nie Anrede, nie Titel. */
export function anzeigeName(kunde, anrede = "aus") {
  if (!kunde || anrede === "aus") return "";
  let vor = text(kunde.vorname, 40);
  let nach = text(kunde.nachname, 60);
  if (!vor && !nach && kunde.name) {
    const teile = text(kunde.name, 100).replace(ANREDE, "").replace(ANREDE, "").split(/\s+/);
    vor = teile[0] || "";
    nach = teile.slice(1).join(" ");
  }
  vor = vor.replace(ANREDE, "");
  if (anrede === "vorname") return vor;
  if (anrede === "name") return [vor, nach].filter(Boolean).join(" ");
  return "";
}

/**
 * Nachricht für das Display bereinigen (Whitelist). Unbekannte Felder fallen weg.
 * @param {object} roh
 * @param {{anrede?: "aus"|"vorname"|"name", seq?: number, jetzt?: string}} [opt]
 * @returns {object|null} null, wenn der Zustand unbekannt ist
 */
export function bereinige(roh, { anrede = "aus", seq = 0, jetzt } = {}) {
  if (!roh || typeof roh !== "object") return null;
  const zustand = ZUSTAENDE.includes(roh.zustand) ? roh.zustand : AUS_PH_KASSA[roh.zustand];
  if (!zustand) return null;
  const positionen = Array.isArray(roh.positionen)
    ? roh.positionen.slice(-MAX_POSITIONEN).map((p) => ({
        titel: text(p?.titel ?? p?.bezeichnung, 80),
        unter: text(p?.unter ?? p?.marke, 60),
        menge: Math.max(0, Math.round(Number(p?.menge) || 0)),
        einzel_cent: cent(p?.einzel_cent ?? p?.einzel_brutto_cent),
        betrag_cent: cent(p?.betrag_cent ?? p?.brutto_cent),
        bild: typeof p?.bild === "string" && /^\/(?!\/)[^\s"'<>]{1,240}$/.test(p.bild) ? p.bild : "",
        neu: !!p?.neu,
      }))
    : [];
  const kk = roh.kundenkarte && typeof roh.kundenkarte === "object" ? { stufe: text(roh.kundenkarte.stufe, 40), vorteile: (Array.isArray(roh.kundenkarte.vorteile) ? roh.kundenkarte.vorteile : []).slice(0, 4).map((v) => ({ titel: text(v?.titel ?? v, 60), eingeloest: !!v?.eingeloest })) } : null;
  return {
    zustand,
    seq,
    zeit: jetzt || new Date().toISOString(),
    positionen,
    anzahl: Math.max(0, Math.round(Number(roh.anzahl) || positionen.reduce((s, p) => s + p.menge, 0))),
    zwischensumme_cent: cent(roh.zwischensumme_cent),
    gutschein_cent: cent(roh.gutschein_cent),
    ust_cent: cent(roh.ust_cent),
    gesamt_cent: cent(roh.gesamt_cent),
    gegeben_cent: cent(roh.gegeben_cent),
    rueckgeld_cent: cent(roh.rueckgeld_cent),
    zahlart: ["karte", "bar", "gutschein", "rechnung"].includes(roh.zahlart) ? roh.zahlart : roh.zustand === "karte" ? "karte" : "",
    kundenkarte: kk && kk.stufe ? kk : null,
    name: anzeigeName(roh.kunde, anrede),
    qr: typeof roh.qr === "string" ? roh.qr.slice(0, 512) : "",
    text: text(roh.text, 280),
    training: !!roh.training,
  };
}

/** Nachricht plausibel? (Empfänger prüft, bevor er anzeigt.) */
export function nachrichtGueltig(n) {
  return !!n && typeof n === "object" && ZUSTAENDE.includes(n.zustand) && Number.isFinite(n.seq) && Array.isArray(n.positionen) && n.positionen.length <= MAX_POSITIONEN;
}

/** Neuere Nachricht? (seq aufsteigend, gleiche seq = gleich) */
export function istNeuer(n, alt) {
  if (!alt) return true;
  return (n?.seq ?? 0) > (alt?.seq ?? 0);
}
