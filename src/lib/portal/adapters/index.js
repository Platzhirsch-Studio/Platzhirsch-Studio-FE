import "server-only";
import { adapterName } from "../config";
import { assertAdapter } from "./interface";
import { frappeAdapter } from "./frappe";
import { mockAdapter } from "./mock";

const ADAPTERS = { mock: mockAdapter, frappe: frappeAdapter };

/** Raw adapter (unscoped). Use getPortal() from ../dal in pages instead. */
export function getAdapter() {
  const adapter = ADAPTERS[adapterName()];
  if (!adapter) throw new Error(`Unbekannter PORTAL_ADAPTER "${adapterName()}"`);
  return assertAdapter(adapter);
}
