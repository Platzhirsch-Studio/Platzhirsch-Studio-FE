// Kassa – Bon-Zustand (Team B-KAS). Reiner Reducer für den offenen Bon (Konzept §3.1, §6.1) und die
// Zahlmaske (§3.3): Positionen, Kunde + Kundenkarte (nur Stufe und Leistungsvorteile – ohne Geldwert,
// Inhaber Nr. 46–53), vorgemerkte Vorteile, Zahlungszeilen (Split), Rechnungsantwort. Keine Seiteneffekte;
// der Client spiegelt den Zustand in IndexedDB (Entwurf) und sendet ihn an Kundendisplay und Server.

import { summen } from "./betraege.js";

export const MAX_MENGE = 999;

let laufNr = 0;
/** Lokale Zeilen-ID (stabil für React-Keys und Roving-Fokus). */
export function neueId(praefix = "z") {
  laufNr += 1;
  return `${praefix}${Date.now().toString(36)}${laufNr.toString(36)}`;
}

export function leererBon(entwurfUuid = neueId("b")) {
  return { entwurf_uuid: entwurfUuid, positionen: [], kunde: null, vorgemerkt: [], auftrag: null, rechnung: null, bestellung: null, zahlungsplan_position: null, rechnungsantwort: null, aktiv: null, neu: null, geaendert: 0 };
}

const gleicheZeile = (p, q) => p.art === "Artikel" && q.art === "Artikel" && p.produkt && p.produkt === q.produkt && p.einzel_brutto_cent === q.einzel_brutto_cent && !p.rabatt_promille && !p.rabatt_cent;

/**
 * @param {ReturnType<typeof leererBon>} bon
 * @param {{typ:string, [k:string]:any}} a
 */
export function bonReducer(bon, a) {
  const fertig = (b) => ({ ...b, geaendert: (bon.geaendert || 0) + 1 });
  switch (a.typ) {
    case "artikel": {
      const p = a.position;
      const menge = Math.max(1, Math.min(MAX_MENGE, Math.trunc(a.menge || p.menge || 1)));
      const da = bon.positionen.find((q) => gleicheZeile(q, { ...p, art: p.art || "Artikel" }));
      if (da) {
        const positionen = bon.positionen.map((q) => (q.id === da.id ? { ...q, menge: Math.min(MAX_MENGE, q.menge + menge) } : q));
        return fertig({ ...bon, positionen, aktiv: da.id, neu: da.id });
      }
      const id = a.id || neueId();
      const zeile = { art: "Artikel", steuersatz: "Normal 20", ...p, id, menge };
      return fertig({ ...bon, positionen: [...bon.positionen, zeile], aktiv: id, neu: id });
    }
    case "freitext":
    case "gutschein-verkauf":
    case "anzahlung": {
      const id = a.id || neueId();
      const art = a.typ === "freitext" ? "Freitext" : a.typ === "gutschein-verkauf" ? "Gutschein Verkauf" : a.art || "Anzahlung";
      const zeile = { steuersatz: "Normal 20", ...a.position, art, id, menge: 1 };
      const extra = a.typ === "anzahlung" ? { auftrag: a.auftrag || bon.auftrag, rechnung: a.rechnung || bon.rechnung, zahlungsplan_position: a.zahlungsplan_position || null } : {};
      return fertig({ ...bon, ...extra, positionen: [...bon.positionen, zeile], aktiv: id, neu: id });
    }
    case "menge": {
      const positionen = bon.positionen
        .map((q) => {
          if (q.id !== a.id) return q;
          if (q.art !== "Artikel" && q.art !== "Freitext") return q; // Gutschein/Anzahlung: Menge 1
          const neu = a.wert !== undefined ? Math.trunc(a.wert) : q.menge + Math.trunc(a.delta || 0);
          return { ...q, menge: Math.min(MAX_MENGE, neu) };
        })
        .filter((q) => q.menge > 0);
      const aktiv = positionen.some((q) => q.id === bon.aktiv) ? bon.aktiv : positionen.at(-1)?.id || null;
      return fertig({ ...bon, positionen, aktiv, neu: null });
    }
    case "entfernen": {
      const i = bon.positionen.findIndex((q) => q.id === a.id);
      const positionen = bon.positionen.filter((q) => q.id !== a.id);
      const aktiv = positionen[Math.min(i, positionen.length - 1)]?.id || null;
      const ohneAuftrag = !positionen.some((q) => ["Anzahlung", "Teilzahlung", "Schlusszahlung"].includes(q.art));
      return fertig({ ...bon, positionen, aktiv, neu: null, ...(ohneAuftrag ? { auftrag: null, rechnung: null, zahlungsplan_position: null } : {}) });
    }
    case "zeile": {
      const positionen = bon.positionen.map((q) => (q.id === a.id ? { ...q, ...a.werte } : q));
      return fertig({ ...bon, positionen });
    }
    case "aktiv":
      return { ...bon, aktiv: a.id };
    case "kunde": {
      // Gleicher Kontakt (z. B. Karte erneut gescannt, Vorteile nachgeladen) behält die Vormerkungen.
      const gleich = bon.kunde && a.kunde && bon.kunde.kontakt && bon.kunde.kontakt === a.kunde.kontakt;
      return fertig({ ...bon, kunde: a.kunde, vorgemerkt: gleich ? bon.vorgemerkt : [], rechnungsantwort: gleich ? bon.rechnungsantwort : null });
    }
    case "kunde-weg":
      return fertig({ ...bon, kunde: null, vorgemerkt: [], auftrag: null, rechnung: null });
    case "vorteil": {
      const an = bon.vorgemerkt.includes(a.id);
      return fertig({ ...bon, vorgemerkt: an ? bon.vorgemerkt.filter((v) => v !== a.id) : [...bon.vorgemerkt, a.id] });
    }
    case "rechnungsantwort":
      return fertig({ ...bon, rechnungsantwort: a.antwort });
    case "laden":
      return { ...leererBon(), ...a.bon, geaendert: (bon.geaendert || 0) + 1 };
    case "leeren":
      return leererBon();
    default:
      return bon;
  }
}

/** Positionen für Server/Berechnung (ohne lokale Felder). */
export function positionenFuerServer(bon) {
  return bon.positionen.map((p) => {
    const out = { art: p.art, bezeichnung: p.bezeichnung, menge: p.menge, einzel_brutto_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz };
    for (const k of ["produkt", "zusatz", "listenpreis_cent", "rabatt_promille", "rabatt_cent", "rabatt_grund", "gutschein", "bezug_doctype", "bezug", "bezug_zeile", "lagerbestand_ref"]) if (p[k] !== undefined && p[k] !== null && p[k] !== "") out[k] = p[k];
    return out;
  });
}

/** Summen des Bons (fehlerfest: ungültige Zeilen werfen nicht in der Oberfläche). */
export function bonSummen(bon) {
  try {
    return summen(positionenFuerServer(bon));
  } catch {
    return { gesamt_cent: 0, netto_cent: 0, ust_cent: 0, je_satz: {}, rksv: {}, positionen: [] };
  }
}

export function stueckzahl(bon) {
  return bon.positionen.reduce((a, p) => a + (p.art === "Artikel" || p.art === "Freitext" ? Number(p.menge) || 0 : 1), 0);
}

/** Menge eines Produkts im Bon (Zähler auf der Produktkachel). */
export function mengeVon(bon, produkt) {
  return bon.positionen.filter((p) => p.produkt === produkt && p.art === "Artikel").reduce((a, p) => a + p.menge, 0);
}

// ------------------------------------------------------------------ Zahlung --

/** Zahlart-Schlüssel der Oberfläche → Backend-Select. */
export const ZAHLART_BACKEND = Object.freeze({ bar: "Bar", karte: "Karte Stripe Terminal", "karte-extern": "Karte extern", gutschein: "Gutschein", ueberweisung: "Ueberweisung" });
export const ZAHLART_UI = Object.freeze(Object.fromEntries(Object.entries(ZAHLART_BACKEND).map(([k, v]) => [v, k])));

/**
 * Stand der Zahlmaske. zeilen: [{art:"bar"|"karte"|"gutschein"|…, betrag_cent, gegeben_cent?, bezahlt?, gutschein?, rest_cent?}]
 * Regel (§3.3.3): jede Zeile hat einen Anteil; nur Bar darf „gegeben“ > Anteil haben (Rückgeld).
 * @returns {{gesamt:number, gedeckt:number, offen:number, rueckgeld:number, fertig:boolean, karteOffen:boolean}}
 */
export function zahlstand(gesamtCent, zeilen = []) {
  const gesamt = Math.trunc(gesamtCent);
  let gedeckt = 0;
  let rueckgeld = 0;
  let karteOffen = false;
  for (const z of zeilen) {
    const anteil = Math.max(0, Math.trunc(z.betrag_cent || 0));
    if (z.art === "bar") {
      const gegeben = Math.max(0, Math.trunc(z.gegeben_cent ?? anteil));
      gedeckt += Math.min(gegeben, anteil);
      rueckgeld += Math.max(0, gegeben - anteil);
    } else if (z.art === "karte") {
      if (z.bezahlt) gedeckt += anteil;
      else karteOffen = true;
    } else gedeckt += anteil;
  }
  const offen = Math.max(0, gesamt - gedeckt);
  return { gesamt, gedeckt, offen, rueckgeld, fertig: offen === 0 && gesamt > 0 && !karteOffen, karteOffen };
}

/** Bar-Zeile mit „Gegeben“ = Rest vorbelegen (§3.3.2). */
export function barZeile(gesamtCent, zeilen = []) {
  const ohneBar = zeilen.filter((z) => z.art !== "bar");
  const rest = Math.max(0, gesamtCent - ohneBar.reduce((a, z) => a + Math.trunc(z.betrag_cent || 0), 0));
  return { art: "bar", betrag_cent: rest, gegeben_cent: rest };
}

/** Zahlungszeilen → Backend-Zahlarten (für beleg_buchen). */
export function zahlartenFuerServer(gesamtCent, zeilen = []) {
  const ohneBar = zeilen.filter((z) => z.art !== "bar").reduce((a, z) => a + Math.trunc(z.betrag_cent || 0), 0);
  return zeilen.map((z) => {
    const out = { zahlart: ZAHLART_BACKEND[z.art] || z.art, betrag_cent: Math.trunc(z.betrag_cent || 0) };
    if (z.art === "bar") {
      out.betrag_cent = Math.max(0, gesamtCent - ohneBar);
      out.gegeben_cent = Math.trunc(z.gegeben_cent ?? out.betrag_cent);
    }
    if (z.gutschein) out.gutschein = z.gutschein;
    if (z.rest_cent !== undefined) out.rest_cent = z.rest_cent;
    if (z.terminal_payment_intent) out.terminal_payment_intent = z.terminal_payment_intent;
    if (z.terminal) out.terminal = z.terminal;
    return out;
  });
}

/** Idempotenz-Schlüssel je Kassieren-Versuch (gleich bei „Erneut buchen“, §3.3.6). */
export function idempotenzSchluessel(kasse, entwurfUuid) {
  return `kassa:${kasse}:${entwurfUuid}`;
}
