// src/lib/kundenkarte/adapters/index.js – Adapter je Betriebsart (config.js).
// null bei "off": die Routen antworten dann 503 not_configured.
// Keine "@/..."-Importe.
import { dataDir, frappeCredentials, kundenkarteMode } from "../config.js";
import { createFrappeAdapter } from "./frappe.js";
import { assertAdapter } from "./interface.js";
import { createMockAdapter } from "./mock.js";

export function kundenkarteAdapter(env = process.env) {
  const mode = kundenkarteMode(env);
  if (mode === "frappe") return assertAdapter(createFrappeAdapter(frappeCredentials(env)));
  if (mode === "mock") return assertAdapter(createMockAdapter({ dir: dataDir(env) }));
  return null;
}
