import "server-only";
import { adapterName, sessionSecret } from "../config";
import { readJson, updateJson } from "../store";
import { resolveBackend } from "../../backend/config.js";
import { assertAdapter } from "./interface";
import { frappeAdapter } from "./frappe";
import { mockAdapter } from "./mock";
import { createPhPortalAdapter } from "./ph.js";
import { createTokenStore } from "./phTokenStore.js";

const ADAPTERS = { mock: mockAdapter, frappe: frappeAdapter };

const TOKEN_FILE = "ph-kunde-token";
let phAdapter = null;

// PORTAL_ADAPTER=frappe + BACKEND_GENERATION (Gruppe "portal") = ph →
// ph_projekte.api.portal_* (adapters/ph.js). Ohne ph-Zugang bleibt der
// (nicht angebundene) frappe-Platzhalter – wie bisher.
function frappeOrPh() {
  const backend = resolveBackend("portal");
  if (backend.generation !== "ph" || !backend.ph) return frappeAdapter;
  if (!phAdapter) {
    const tokenStore = createTokenStore({
      read: () => readJson(TOKEN_FILE, {}),
      update: (fn) => updateJson(TOKEN_FILE, {}, (all) => ({ value: fn(all), result: null })),
      secret: sessionSecret,
    });
    phAdapter = createPhPortalAdapter({ cfg: backend.ph, tokenStore });
  }
  return phAdapter;
}

/** Raw adapter (unscoped). Use getPortal() from ../dal in pages instead. */
export function getAdapter() {
  const name = adapterName();
  const adapter = name === "frappe" ? frappeOrPh() : ADAPTERS[name];
  if (!adapter) throw new Error(`Unbekannter PORTAL_ADAPTER "${adapterName()}"`);
  return assertAdapter(adapter);
}
