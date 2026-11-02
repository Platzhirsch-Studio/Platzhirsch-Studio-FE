// src/lib/commerce/shipping/index.js
// Versand: Adapterwahl und Tarifberechnung für den Warenkorb.
//   shippingAdapterFor(env, mode)  → LetMeShip (Testumgebung/live) | Mock | null
//   versandTarif({...})            → { ok, cent, quelle, dienst, … } | { ok: false, fehler }
// Regeln (Inhaber 31.10.2026): live über LetMeShip; Pauschale NUR, wenn die
// API nicht antwortet UND eine Pauschale konfiguriert ist; sonst Meldung +
// Abholung. Abholung im Showroom → kein Aufruf. Riedel/Glas → versichert.
// Keine "@/"-Importe.
import { PAUSCHALE_CENT, VERSAND_QUELLE, paketeOf, versandLandOk } from "./config.js";
import { createLetMeShipAdapter, letmeshipCredentials, letmeshipEnv } from "./letmeship.js";
import { createMockShippingAdapter } from "./mock.js";

/**
 * @param {object} env
 * @param {"off"|"test"|"live"} mode  Shop-Modus
 */
export function shippingAdapterFor(env, mode, { fetchImpl, mockFail } = {}) {
  if (mode === "off") return null;
  const cred = letmeshipCredentials(env);
  if (mode === "test") {
    // Im Test NIE die Live-Umgebung: mit Zugangsdaten nur die LetMeShip-Testumgebung.
    if (cred && letmeshipEnv(env) === "test" && env.LETMESHIP_IM_TEST === "1") return createLetMeShipAdapter(env, { fetchImpl, forceEnv: "test" });
    return createMockShippingAdapter({ fail: mockFail || env.SHOP_SHIPPING_MOCK_FAIL === "1" });
  }
  return cred && letmeshipEnv(env) === "live" ? createLetMeShipAdapter(env, { fetchImpl, forceEnv: "live" }) : null;
}

const naechsterWerktag = (ms) => {
  const d = new Date(ms + 86_400_000);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Versandtarif für einen bepreisten Warenkorb.
 * @param {{ adapter: object|null, zeilen: object[], ziel: { land, plz, ort, strasse?, hausnr?, name?, email?, telefon? }, warenwertCent: number, now: number }} a
 */
export async function versandTarif({ adapter, zeilen, ziel, warenwertCent, now, mode }) {
  if (!versandLandOk(ziel?.land)) return { ok: false, fehler: ziel?.land === "CH" ? "land_ch" : "land" };
  if (!zeilen?.length) return { ok: false, fehler: "leer" };
  const mock = Boolean(adapter?.mock);
  // Geschätzte Paketprofile (geprueft: false) nur im Testmodus; ohne Angabe aus dem
  // Adapter abgeleitet (Mock/LetMeShip-Testumgebung = test, sonst streng wie live).
  const profilModus = mode ?? (mock || adapter?.umgebung === "test" ? "test" : "live");
  const pk = paketeOf(zeilen, { mock, mode: profilModus });
  const hinweise = { versichert: pk.versichern, zerbrechlich: pk.zerbrechlich, kerze: pk.kerze };
  if (VERSAND_QUELLE === "pauschale") {
    const c = PAUSCHALE_CENT[ziel.land];
    return c ? { ok: true, cent: c, quelle: "pauschale", dienst: null, ...hinweise } : { ok: false, fehler: "keine_pauschale", ...hinweise };
  }
  if (pk.fehlend.length) return { ok: false, fehler: "profil_fehlt", kategorien: pk.fehlend, gesperrt: pk.gesperrt, ...hinweise };
  if (!adapter) return rueckfall(ziel.land, "nicht_konfiguriert", hinweise);
  try {
    const q = await adapter.quote({ ziel, pakete: pk.pakete, versichern: pk.versichern, warenwertCent, datum: naechsterWerktag(now) });
    return { ok: true, cent: q.cent, quelle: adapter.mock ? "mock" : "letmeship", dienst: { id: q.serviceId, carrier: q.carrier, name: q.name, tage: q.tage }, service: q.raw, pakete: pk.pakete, ...hinweise };
  } catch (err) {
    console.warn(`[shop] versand: tarif ${err?.code || "fehler"}`);
    return rueckfall(ziel.land, err?.code === "keine_tarife" ? "keine_tarife" : "api", hinweise);
  }
}

function rueckfall(land, grund, hinweise) {
  const c = PAUSCHALE_CENT[land];
  if (c && grund === "api") return { ok: true, cent: c, quelle: "pauschale", dienst: null, rueckfall: true, ...hinweise };
  return { ok: false, fehler: grund, ...hinweise };
}
