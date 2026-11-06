import "server-only";
// Lesen für den Bereich Shop (10-konzept-shop § 15.4): Listen, Akten, Bezüge, Kennzahlen, Einstellungen.
// Alle Aufrufe serverseitig über backoffice(session) (Q-A1). Fehlende Leserechte an Nachbar-DocTypes
// (Lieferschein, Rechnung) führen zu leeren Bezügen, nie zu einem Seitenfehler.

import { backoffice } from "../frappe/index.js";
import { faehigkeiten } from "../faehigkeiten.js";
import { istBackofficeError } from "../frappe/errors.js";
import { SHOP, SHOP_FAEHIGKEITEN } from "./faehigkeiten.js";
import { istLeitung, istGF, darfSchreiben, siehtGeld } from "./rechte.js";
import { heute } from "./fristen.js";

export const LISTEN_LIMIT = 500;

/** Kontext je Anfrage: Client, Rollen, heute, Fähigkeiten (an/aus). */
export async function shopKontext(session) {
  const client = backoffice(session);
  await seedSicherstellen(client);
  const f = await faehigkeiten(session, SHOP_FAEHIGKEITEN, { katalog: SHOP, client });
  const an = Object.fromEntries(Object.entries(f).map(([id, s]) => [id.replace(/^shop\./, ""), !!s.an]));
  return { client, session, leitung: istLeitung(session), gf: istGF(session), schreiben: darfSchreiben(session), geld: siehtGeld(session), heute: heute(), user: session.user, faehigkeiten: an, faehigkeitStatus: f };
}

/**
 * Mock: Shop-Fälle (mock/seed/shop.js, Nachlauf) auch in einer schon laufenden Mock-Datenbank sicherstellen –
 * der Dev-Server baut die Datenbank nur einmal je Prozess. Ersetzt nur Shop-Tabellen (idempotent über eine Marke).
 */
async function seedSicherstellen(client) {
  if (client.modus !== "mock" || typeof client.tabelle !== "function") return;
  const db = client.db;
  if (db.__shopSeed === 3) return;
  if (client.tabelle("PH Bestellung").get("PH-S-261104-00012")?.kunde_name !== "Anna Beispiel") {
    const { default: nachlauf } = await import("../mock/seed/shop.js");
    const kontakte = [...client.tabelle("PH Kontakt").values()];
    nachlauf(db.db, { kontakte });
  }
  db.__shopSeed = 3;
}

/** Alle Datensätze eines DocType (bis LISTEN_LIMIT), ohne Kindtabellen. Fehler → { fehler }. */
export async function alle(client, doctype, { filters, fields = ["*"], orderBy = "modified desc" } = {}) {
  try {
    return { zeilen: await client.getList(doctype, { fields, filters, orderBy, limit: LISTEN_LIMIT }) };
  } catch (err) {
    return { zeilen: [], fehler: istBackofficeError(err) ? { code: err.code, message: err.message } : { code: "unavailable", message: "Nicht geladen" } };
  }
}

/** Sicher lesen: Fehler (z. B. kein Leserecht am Nachbar-DocType) → Ersatzwert. */
export async function sicher(fn, ersatz = []) {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
}

/** Positionen (Bild, Bezeichnung) je Bestellung – für Listen-Bilder und Kanban-Karten. */
export async function positionenFuer(client, namen) {
  const out = {};
  if (!namen.length) return out;
  if (client.modus === "mock") {
    await Promise.all(namen.map(async (n) => {
      const d = await sicher(() => client.getDoc("PH Bestellung", n), null);
      out[n] = (d?.positionen || []).map((p) => ({ bezeichnung: p.bezeichnung, menge: p.menge, bild: p.bild || "" }));
    }));
    return out;
  }
  const zeilen = await sicher(() => client.getList("PH Bestellung Position", { fields: ["parent", "idx", "bezeichnung", "menge", "bild"], filters: [["parent", "in", namen]], orderBy: "idx asc", limit: namen.length * 6 }), []);
  for (const z of zeilen) (out[z.parent] ||= []).push({ bezeichnung: z.bezeichnung, menge: z.menge, bild: z.bild || "" });
  return out;
}

/** Bezüge einer Bestellung: Zahlungen, Lieferscheine, Rechnungen, Widerrufe, Retouren. */
export async function bestellBezuege(client, name) {
  const [zahlungen, lieferscheine, rechnungen, widerrufe, retouren] = await Promise.all([
    sicher(() => client.getList("PH Zahlung", { fields: ["*"], filters: [["bezug_doctype", "=", "PH Bestellung"], ["bezug", "=", name]], orderBy: "zeitpunkt asc", limit: 50 })),
    sicher(() => client.getList("PH Lieferschein", { fields: ["name", "status", "datum", "bestellung", "zugestellt_am", "uebergeben_am"], filters: [["bestellung", "=", name]], limit: 10 })),
    sicher(() => client.getList("PH Rechnung", { fields: ["name", "status", "docstatus", "bestellung"], filters: [["bestellung", "=", name]], limit: 10 })),
    sicher(() => client.getList("PH Widerruf", { fields: ["name", "status", "eingegangen_am"], filters: [["bestellung", "=", name]], limit: 10 })),
    sicher(() => client.getList("PH Retoure", { fields: ["name", "status", "angekuendigt_am"], filters: [["bestellung", "=", name]], limit: 10 })),
  ]);
  return { zahlungen, lieferscheine, rechnungen, widerrufe, retouren };
}

/** Akte: Dokument + Verlauf (Versionen, Kommentare). null bei nicht gefunden/kein Recht (→ notFound). */
export async function akte(client, doctype, name) {
  try {
    return await client.getDocMitInfo(doctype, name);
  } catch (err) {
    if (istBackofficeError(err) && ["not_found", "forbidden"].includes(err.code)) return null;
    throw err;
  }
}

/** Einstellungen (Singles). */
export async function einstellungen(client) {
  const [shop, stripe] = await Promise.all([sicher(() => client.getDoc("PH Shop Einstellungen", "PH Shop Einstellungen"), {}), sicher(() => client.getDoc("PH Stripe Einstellungen", "PH Stripe Einstellungen"), {})]);
  return { shop, stripe };
}

/** Lieferscheine zu mehreren Bestellungen (Fristen, abschliessenAb). */
export async function lieferscheineFuer(client, namen) {
  if (!namen.length) return [];
  return sicher(() => client.getList("PH Lieferschein", { fields: ["name", "bestellung", "zugestellt_am", "status"], filters: [["bestellung", "in", namen]], limit: namen.length * 3 }));
}

/** Daten der Übersicht (Kennzahlen, Zu tun) in einer Welle (Q-L3: ≤ 12 Aufrufe). */
export async function uebersichtDaten(client) {
  const [b, z, g, w, e, eins] = await Promise.all([
    alle(client, "PH Bestellung"),
    alle(client, "PH Zahlung"),
    alle(client, "PH Gutschein"),
    alle(client, "PH Widerruf"),
    alle(client, "PH Stripe Ereignis", { fields: ["name", "status", "empfangen_am", "typ"] }),
    einstellungen(client),
  ]);
  return { bestellungen: b.zeilen, zahlungen: z.zeilen, gutscheine: g.zeilen, widerrufe: w.zeilen, ereignisse: e.zeilen, stripe: eins.stripe, shop: eins.shop, fehler: b.fehler || null };
}
