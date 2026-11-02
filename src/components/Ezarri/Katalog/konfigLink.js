// Links aus dem Katalog in den Konfigurator (Team B), Vertrag §7.4 Nr. 1:
// ?k=<encodeState(...)> mit der Mischung, dazu ?m=<konf-id> für ein einzelnes
// Mosaik (Konzept §3.5). Rein, auch serverseitig.
import { DEFAULT_STATE, MAX_MIX, encodeState, to100 } from "@/lib/ezarri/konfigurator/state";

const FORMAT_OF = { "25mm": "25", "50mm": "50", hexa: "hexa" };

/**
 * @param {Array<{konfId:string, ref?:string, anteil?:number}>} items Konfigurator-IDs (max. 4);
 *   `anteil` optional (Rezept laut Ezarri, QM Runde 2 P2-2), sonst gleich verteilt
 * @param {string} [formatId] Filter-ID "25mm" | "50mm" | "hexa"
 */
export function konfiguratorHref(items, formatId) {
  const list = items.filter((x) => x?.konfId).slice(0, MAX_MIX);
  if (!list.length) return "/ezarri/konfigurator";
  const anteile = to100(list.map((x) => (Number(x.anteil) > 0 ? Number(x.anteil) : 100 / list.length)));
  const state = {
    ...DEFAULT_STATE,
    format: FORMAT_OF[formatId] ?? DEFAULT_STATE.format,
    modus: list.length > 1 ? "mix" : "mosaik",
    mix: list.map((x, i) => ({ id: String(x.konfId), anteil: anteile[i], ...(x.ref ? { ref: x.ref } : {}) })),
  };
  const p = new URLSearchParams();
  if (list.length === 1) p.set("m", String(list[0].konfId));
  p.set("k", encodeState(state));
  return `/ezarri/konfigurator?${p.toString()}`;
}
