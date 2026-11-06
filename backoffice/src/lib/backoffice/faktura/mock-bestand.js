// Mock-Bestand sicherstellen: Der Dev-Server hält die Mock-Datenbank prozessweit (globalThis). Wurde sie vor dem
// Faktura-Nachlauf gebaut, fehlt der fachliche Bestand. Dieser Abgleich spielt einmal je Prozess nur die
// Faktura-Tabellen aus mock/seed/faktura.js nach (kein Neustart nötig). Nur Mock, nie Frappe.

import nachlauf from "../mock/seed/faktura.js";

const MARKE = "RE-2026-00042";

export function stelleMockBestandSicher(client) {
  if (client?.modus !== "mock" || !client.db?.db) return false;
  const db = client.db.db;
  if (db.get("PH Rechnung")?.has(MARKE) || globalThis.__phFakturaBestand === client.db) return false;
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  const zaehler = client.db.zaehler || new Map();
  const naechste = (prefix) => {
    const n = (zaehler.get(prefix) || 0) + 1;
    zaehler.set(prefix, n);
    return n;
  };
  const kontakte = [...(db.get("PH Kontakt")?.values() || [])];
  nachlauf(db, { tabelle, naechste, index: client.index, kontakte });
  globalThis.__phFakturaBestand = client.db;
  return true;
}
