// Zugriff auf ph_service – eine Stelle für Mock und Frappe. Im Frappe-Modus laufen die echten App-Methoden
// (run_doc_method bzw. whitelisted Endpunkte), im Mock deren Nachbau aus mock.js. Seiten und Actions rufen nur
// diese Funktionen, nie runDocMethod direkt (sonst hätte der Mock keine Wirkung).
// Reines Modul (keine "@/"-Importe).

import { mockAkte, mockHatMethode, mockMethode, mockNaechsteSchritte, mockSlots, sichereServiceSeed } from "./mock.js";

export { sichereServiceSeed };

export const API = Object.freeze({
  naechsteSchritte: "ph_service.api.get_next_steps",
  akte: "ph_service.api.get_service_case_file",
  slots: "ph_service.api.get_technician_slots",
  katalog: "ph_service.api.get_fehlerkatalog",
});

export function istMock(client) {
  return client?.modus !== "frappe";
}

/** Dokumentmethode einer ph_service-DocType (Mock: Nachbau, Frappe: run_doc_method). */
export async function methode(client, doctype, name, m, args = {}) {
  if (istMock(client)) {
    if (!mockHatMethode(doctype, m)) throw Object.assign(new Error(`Methode ${m} fehlt im Testmodus.`), { code: "not_found" });
    return mockMethode(client, doctype, name, m, args);
  }
  return client.runDocMethod(doctype, name, m, args);
}

/** Nächster Schritt je Fall (max. 200) → { name: {schritt, aktion, faellig, rang} }. */
export async function naechsteSchritte(client, names) {
  const liste = [...new Set((names || []).filter(Boolean))].slice(0, 200);
  if (!liste.length) return {};
  if (istMock(client)) return mockNaechsteSchritte(client, liste);
  return (await client.call(API.naechsteSchritte, { names: JSON.stringify(liste) })) || {};
}

/** Akte in einem Aufruf (Fall, Einsätze, Bestellungen, Regresse, nächster Schritt, Fristen, SLA). */
export async function akte(client, name, { kostenSichtbar = false } = {}) {
  if (istMock(client)) return mockAkte(client, name, { kostenSichtbar });
  return client.call(API.akte, { name });
}

/** Freie Zeitfenster je Techniker an einem Tag. */
export async function slots(client, { datum, dauer_min = 60, techniker = null }) {
  if (istMock(client)) return mockSlots(client, { datum, dauer_min, techniker });
  return client.call(API.slots, { datum, dauer_min, techniker: techniker || undefined });
}
