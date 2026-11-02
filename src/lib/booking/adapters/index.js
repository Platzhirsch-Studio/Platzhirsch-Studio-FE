// src/lib/booking/adapters/index.js – wählt den Adapter nach terminMode().
// Pro Aufruf neu ausgewertet: Ein Wechsel von BOOKING_MOCK greift im Dev
// ohne Neustart. "off" → null (Routen antworten 503 not_configured).
import { dataDir, frappeCredentials, terminMode } from "../config.js";
import { createFrappeAdapter } from "./frappe.js";
import { createMockAdapter } from "./mock.js";

export function bookingAdapter(env = process.env) {
  const mode = terminMode(env);
  if (mode === "frappe") return createFrappeAdapter(frappeCredentials(env));
  if (mode === "mock") return createMockAdapter({ dir: dataDir(env) });
  return null;
}
