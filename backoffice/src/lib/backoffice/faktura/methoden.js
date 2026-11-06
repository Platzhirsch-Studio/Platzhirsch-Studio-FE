// Eine Stelle für Frappe-Dokumentmethoden des Bereichs Faktura: Frappe → runDocMethod (ph_faktura), Mock → fachliche
// Nachbildung (mock-methoden.js). Kein "@/"-Import, damit Unit-Tests es laden können.

import { mockMethode, mockNeu } from "./mock-methoden.js";

/** Dokumentmethode ausführen (Frappe prüft Rechte und Regeln erneut). */
export async function methode(client, doctype, name, methodeName, args = {}) {
  if (client?.modus === "mock") return mockMethode(client, doctype, name, methodeName, args);
  const r = await client.runDocMethod(doctype, name, methodeName, args);
  return r?.message ?? r;
}

/** Neuen Beleg anlegen (Mock: Nummernkreis wie Frappe – Rechnungen/Gutschriften als ENTW-…). */
export async function neuerBeleg(client, doctype, werte) {
  if (client?.modus === "mock") return mockNeu(client, doctype, werte);
  return client.insert(doctype, werte);
}

/** Whitelist-API (ph_faktura.api.*, ph_projekte.api.*) – im Mock ohne Wirkung mit Rückfall. */
export async function api(client, methodName, args = {}, rueckfall = null) {
  if (client?.modus === "mock") return rueckfall;
  try {
    const r = await client.call(methodName, args);
    return r?.message ?? r;
  } catch {
    return rueckfall;
  }
}
