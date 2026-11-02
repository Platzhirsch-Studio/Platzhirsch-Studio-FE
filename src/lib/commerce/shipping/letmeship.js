// src/lib/commerce/shipping/letmeship.js
// Versand-Adapter LetMeShip (REST, JSON, HTTP Basic Auth). SERVERSEITIG:
// Zugangsdaten nur aus der Server-Umgebung, nie im Client, nie im Log.
//
//   LETMESHIP_API_ID         API-ID (LetMeShip-Geschäftskonto → Versand-API)
//   LETMESHIP_API_PASSWORD   API-Passwort
//   LETMESHIP_ENV            test (Standard) | live
//
// Grundlage (öffentlich): LetMeShip-Seite „Versand-API“ (Doku nur auf
// Anfrage, Englisch) und die quelloffene Frappe/ERPNext-Shipping-Integration
// (github.com/frappe/erpnext-shipping, doctype letmeship), die dieselbe API
// nutzt. Daraus übernommen:
//   Basis   https://api.letmeship.com/v1 (live), https://api.test.letmeship.com/v1 (test)
//   POST    available                         Tarife (serviceList[].baseServiceDetails{id,name,carrier,priceInfo})
//   POST    shipments                         Sendung anlegen (→ shipmentId)
//   GET     shipments/{id}                    → trackingData.awbNumber
//   GET     shipments/{id}/documents?types=LABEL → documents[].data (Etikett, Base64-PDF)
//   GET     tracking?shipmentid={id}          → lmsTrackingStatus
//   Antwort status.code !== "0" = Fehler.
// VOR DEM LIVEGANG mit der offiziellen API-Doku abgleichen (README „LetMeShip“):
// Feldnamen für Brutto-/Nettopreis, Laufzeit und Versicherungsbetrag.
// Im Testmodus wird dieser Adapter nur mit LETMESHIP_ENV=test (Testumgebung)
// benutzt, ohne Zugangsdaten immer der Mock (mock.js).
// Keine "@/"-Importe.
import { ABSENDER, AUFSCHLAG_CENT, DIENST_WAHL, VERSAND_UST_SATZ } from "./config.js";

export const LMS_BASE = Object.freeze({ live: "https://api.letmeship.com/v1", test: "https://api.test.letmeship.com/v1" });
export const LMS_TIMEOUT_MS = 10_000;

/** Zugangsdaten vorhanden? (nur ja/nein) */
export function letmeshipCredentials(env = process.env) {
  const id = String(env.LETMESHIP_API_ID ?? "").trim();
  const pw = String(env.LETMESHIP_API_PASSWORD ?? "").trim();
  return id && pw ? { id, pw } : null;
}
export const letmeshipEnv = (env = process.env) => (String(env.LETMESHIP_ENV ?? "").trim().toLowerCase() === "live" ? "live" : "test");

export class ShippingError extends Error {
  constructor(code, detail) {
    super(`letmeship ${code}`);
    this.code = code; // "timeout" | "http" | "api" | "auth" | "keine_tarife"
    this.detail = detail;
  }
}

const address = (a) => ({
  countryCode: a.land,
  zip: a.plz,
  city: a.ort,
  street: a.strasse || "",
  houseNo: a.hausnr || "",
  addressInfo1: a.zusatz || "",
});
const party = (a) => {
  const [firstname, ...rest] = String(a.name || a.firma || "").trim().split(/\s+/);
  return {
    address: address(a),
    company: String(a.firma || "").slice(0, 30),
    person: { firstname: firstname || "", lastname: rest.join(" ") || firstname || "" },
    phone: { phoneNumber: String(a.telefon || "").replace(/[^\d+]/g, "").slice(3), phoneNumberPrefix: String(a.telefon || "").replace(/[^\d+]/g, "").slice(0, 3) },
    email: a.email || "",
  };
};

/** shipmentDetails für available/shipments (Gewicht kg, Maße cm). */
export function shipmentDetails({ pakete, versichern, warenwertCent, datum }) {
  return {
    contentDescription: "Wohnaccessoires",
    shipmentType: "PARCEL",
    shipmentSettings: { saturdayDelivery: false, ddp: false, insurance: Boolean(versichern), pickupOrder: false, pickupTailLift: false, deliveryTailLift: false, holidayDelivery: false },
    goodsValue: Math.round(warenwertCent) / 100,
    parcelList: pakete.map((p) => ({ height: Math.ceil(p.hoeheCm), width: Math.ceil(p.breiteCm), length: Math.ceil(p.laengeCm), weight: Math.round(p.gewichtG) / 1000, quantity: p.menge, contentDescription: String(p.inhalt || "").slice(0, 35) })),
    pickupInterval: { date: datum },
  };
}

/**
 * Kundenpreis eines Tarifs in Cent: Bruttowert, falls LetMeShip ihn liefert
 * (priceInfo.totalPrice), sonst Netto + USt (VERSAND_UST_SATZ), plus Aufschlag.
 * Kein Schätzen: ohne Preisfeld → null.
 */
export function kundenCent(priceInfo) {
  const total = Number(priceInfo?.totalPrice);
  const net = Number(priceInfo?.netPrice);
  let cent = null;
  if (Number.isFinite(total) && total > 0) cent = Math.round(total * 100);
  else if (Number.isFinite(net) && net > 0) cent = Math.round(net * 100 * (1 + VERSAND_UST_SATZ / 100));
  return cent == null ? null : cent + AUFSCHLAG_CENT;
}

/** Tarifliste normalisieren und nach DIENST_WAHL wählen. */
export function pickService(serviceList, wahl = DIENST_WAHL) {
  const list = (serviceList || [])
    .map((s) => {
      const b = s?.baseServiceDetails || {};
      const cent = kundenCent(b.priceInfo);
      const tage = Number(b.transferTime ?? s?.serviceInfo?.transferTime);
      return cent ? { id: String(b.id), carrier: String(b.carrier || ""), name: String(b.name || ""), cent, tage: Number.isFinite(tage) ? tage : null, raw: s } : null;
    })
    .filter(Boolean);
  if (!list.length) return null;
  if (wahl === "schnellster" && list.some((s) => s.tage != null)) return [...list].sort((a, b) => (a.tage ?? 99) - (b.tage ?? 99) || a.cent - b.cent)[0];
  return [...list].sort((a, b) => a.cent - b.cent)[0];
}

/**
 * Echter Adapter. fetchImpl für Tests. Wirft ShippingError (ohne Zugangsdaten
 * oder Antworttexte im Fehlertext).
 */
export function createLetMeShipAdapter(env = process.env, { fetchImpl = fetch, forceEnv } = {}) {
  const cred = letmeshipCredentials(env);
  if (!cred) return null;
  const which = forceEnv || letmeshipEnv(env);
  const base = LMS_BASE[which];
  const auth = `Basic ${Buffer.from(`${cred.id}:${cred.pw}`).toString("base64")}`;

  async function call(method, path, body) {
    let res;
    try {
      res = await fetchImpl(`${base}/${path}`, {
        method,
        headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(LMS_TIMEOUT_MS),
      });
    } catch (err) {
      throw new ShippingError(err?.name === "TimeoutError" || err?.name === "AbortError" ? "timeout" : "http");
    }
    if (res.status === 401 || res.status === 403) throw new ShippingError("auth", res.status);
    if (!res.ok) throw new ShippingError("http", res.status);
    const data = await res.json().catch(() => null);
    if (!data) throw new ShippingError("http", "json");
    if (data.status && String(data.status.code) !== "0") throw new ShippingError("api", String(data.status.code));
    return data;
  }

  return {
    kind: "letmeship",
    umgebung: which,
    mock: false,
    /** → { serviceId, carrier, name, cent, tage, raw } */
    async quote({ ziel, pakete, versichern, warenwertCent, datum }) {
      const data = await call("POST", "available", { pickupInfo: party(ABSENDER), deliveryInfo: party(ziel), shipmentDetails: shipmentDetails({ pakete, versichern, warenwertCent, datum }) });
      const s = pickService(data.serviceList);
      if (!s) throw new ShippingError("keine_tarife");
      return { serviceId: s.id, carrier: s.carrier, name: s.name, cent: s.cent, tage: s.tage, raw: s.raw };
    },
    /** Sendung anlegen + Tracking + Etikett. → { shipmentId, awb, carrier, labelPdfBase64 } */
    async createShipment({ ziel, pakete, versichern, warenwertCent, datum, service, referenz }) {
      const created = await call("POST", "shipments", {
        pickupInfo: party(ABSENDER),
        deliveryInfo: party(ziel),
        shipmentDetails: { ...shipmentDetails({ pakete, versichern, warenwertCent, datum }), reference: referenz },
        service,
        shipmentNotification: { trackingNotification: { deliveryNotification: true, problemNotification: true } },
        labelEmail: false,
      });
      const shipmentId = String(created.shipmentId || "");
      if (!shipmentId) throw new ShippingError("api", "no_id");
      const detail = await call("GET", `shipments/${encodeURIComponent(shipmentId)}`);
      const docs = await call("GET", `shipments/${encodeURIComponent(shipmentId)}/documents?types=LABEL`);
      return {
        shipmentId,
        awb: detail?.trackingData?.awbNumber || null,
        carrier: created?.service?.baseServiceDetails?.carrier || service?.baseServiceDetails?.carrier || "",
        labelPdfBase64: docs?.documents?.[0]?.data || null,
      };
    },
    async tracking(shipmentId) {
      const d = await call("GET", `tracking?shipmentid=${encodeURIComponent(shipmentId)}`);
      return { awb: d?.awbNumber || null, status: d?.lmsTrackingStatus || null, carrier: d?.carrier || null };
    },
  };
}

/**
 * Öffentliche Sendungsverfolgung des Carriers (Link für die Bestellseite).
 * Muster der öffentlichen Tracking-Seiten; vor Livegang je Dienst prüfen.
 */
const TRACKING = [
  [/dhl/i, (n) => `https://www.dhl.com/at-de/home/tracking.html?tracking-id=${n}`],
  [/dpd/i, (n) => `https://tracking.dpd.de/status/de_DE/parcel/${n}`],
  [/ups/i, (n) => `https://www.ups.com/track?tracknum=${n}`],
  [/gls/i, (n) => `https://gls-group.com/AT/de/paketverfolgung?match=${n}`],
  [/post|ö?sterreichische post/i, (n) => `https://www.post.at/s/sendungssuche?snr=${n}`],
];
export function trackingLink(carrier, awb) {
  if (!awb) return null;
  const n = encodeURIComponent(String(awb));
  const hit = TRACKING.find(([re]) => re.test(String(carrier || "")));
  return hit ? hit[1](n) : null;
}
