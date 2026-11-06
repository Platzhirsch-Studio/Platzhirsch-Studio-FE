// Client für den Bereich Logistik: `backoffice(session)` plus Mock-Stand-Sicherung.
// Der Mock baut seine Datenbank einmal je Prozess (globalThis). Läuft der Dev-Server schon länger als der
// Logistik-Seed (z. B. nach einem Update ohne Neustart), ergänzt `mockStandSichern` die Logistik-Tabellen
// einmalig mit dem aktuellen Nachlauf – nur im Mock, nie in Produktion, andere Bereiche bleiben unberührt
// (deren angehängte Lieferscheine LS-…-9xxxx bleiben erhalten). Reines Modul.

import { backoffice } from "../frappe/index.js";
import nachlauf, { SEED_STAND } from "../mock/seed/logistik.js";
import { erzeugeDokument, rng, tage } from "../mock/seed/basis.js";
import { neuerName } from "../mock/engine.js";

export { SEED_STAND };

/** Prüft/ergänzt den Logistik-Stand der Mock-Datenbank (idempotent). */
export function mockStandSichern(client) {
  if (client?.modus !== "mock" || !client.db?.db) return false;
  const db = client.db;
  if (db.logistikStand === SEED_STAND) return false;
  if (db.db.get("PH Logistik Einstellungen")?.get("PH Logistik Einstellungen")?._b_log_seed === SEED_STAND) {
    db.logistikStand = SEED_STAND;
    return false;
  }
  const tabelle = (dt) => {
    if (!db.db.has(dt)) db.db.set(dt, new Map());
    return db.db.get(dt);
  };
  const fremd = [...tabelle("PH Lieferschein").values()].filter((d) => /^LS-\d{4}-9\d{4}$/.test(d.name));
  nachlauf(db.db, { rng: rng(4711), tage, index: client.index, tabelle, naechste: (p) => client.naechsteNummer(p), erzeugeDokument, neuerName, kontakte: [...tabelle("PH Kontakt").values()] });
  for (const d of fremd) tabelle("PH Lieferschein").set(d.name, d);
  db.logistikStand = SEED_STAND;
  return true;
}

/** backoffice(session) mit gesichertem Mock-Stand. */
export function logistikClient(session) {
  const client = backoffice(session);
  mockStandSichern(client);
  return client;
}
