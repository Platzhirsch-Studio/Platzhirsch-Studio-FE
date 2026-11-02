// src/lib/agent/deps.js – Server-Verdrahtung: Concierge-Katalog, Produktdetails, Modus, Mail.
// Nur hier stehen "server-only" und "@/"-Importe; adapter.js bleibt rein.
import "server-only";
import { createHmac } from "node:crypto";
import { brandOverview, listBrands, listCategories, productsInCategory, searchProducts } from "@/lib/concierge/catalog";
import { fetchProduktNewByPathField } from "@/lib/api/fetchAllProdukte";
import { dimensionsSummaryMap, parseDimensionTable } from "@/lib/shop/dimensions";
import { forwardJson } from "@/lib/forms/forward";
import { createAdapter } from "./adapter";
import { appointmentMode, secretFrom } from "./config";
import { BACKOFFICE_URL, createUsedSet, createWebhookMailer } from "./appointment";
import { createAgentLimiter } from "./rate";
import { bookingAdapter } from "@/lib/booking/adapters";
import { localYmd } from "@/lib/booking/time";

/** Maße eines Produkts: Tabelle in cm, wo eindeutig beschriftet, sonst der Originaltext. */
export function dimensionsOf(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const summary = dimensionsSummaryMap(parseDimensionTable(raw));
  return summary ? { unit: "cm", ...summary, text: raw.trim().slice(0, 300) } : { text: raw.trim().slice(0, 300) };
}

// Detailabruf je Produkt (Next-Datencache 1 h, wie die Produktseite). Fällt er
// aus, fehlen nur Maße/Designer – die Karte bleibt.
async function productDetails(card) {
  const slug = String(card.href || "").split("?")[0].split("/").filter(Boolean).pop();
  const locale = String(card.href || "").split("/")[1] || "de";
  if (!slug) return null;
  const detail = await fetchProduktNewByPathField(slug, locale);
  if (!detail) return null;
  const info = (detail.additional_information || [])[0] || {};
  return { designer: detail.designer || null, dimensions: dimensionsOf(info.dimensions) };
}

const log = (msg, err) => console.error(msg, err?.message || err || "");

function mailer() {
  const url = process.env.AGENT_MAIL_WEBHOOK_URL;
  const secret = process.env.AGENT_MAIL_WEBHOOK_SECRET;
  return createWebhookMailer({ url, secret, hmac: (body, s) => createHmac("sha256", s).update(body).digest("hex") });
}

let warned = false;
/** Modus + Geheimnis + Mailer, bei jedem Aufruf frisch (Env kann sich zwischen Deploys ändern). */
export function appointmentContext() {
  const { mode, requested, reason } = appointmentMode(process.env);
  if (reason && !warned) {
    console.warn(`[agent] AGENT_APPOINTMENT_MODE=${requested} → ${mode} (${reason})`);
    warned = true;
  }
  return { mode, secret: secretFrom(process.env), sendMail: mode === "live" ? mailer() : undefined };
}

const KEY = Symbol.for("platzhirsch.agent.runtime");

/** Freie Termine (free_appointment_slots, nur lesend): null, wenn der Online-Kalender aus ist. */
function slotsContext() {
  const booking = bookingAdapter();
  if (!booking) return null;
  return { test: booking.test === true, today: localYmd(new Date()), fetch: (q) => booking.slots(q) };
}

const adapter = createAdapter({
  catalog: { searchProducts, listCategories, productsInCategory, listBrands, brandOverview, productDetails },
  appointment: appointmentContext,
  slots: slotsContext,
  log,
});

/** Limiter und Einmal-Liste: eine Instanz je Server-Prozess (auch über Dev-HMR). */
export function agentRuntime() {
  const state = (globalThis[KEY] ||= {
    limiter: createAgentLimiter({ onStoreError: (e) => log("[agent] limit store failed", e) }),
    used: createUsedSet(),
  });
  return { adapter, limiter: state.limiter, used: state.used, log };
}

/** Bestätigung an das Backoffice – NUR im Livebetrieb in Produktion. */
export function confirmContext() {
  const { mode } = appointmentMode(process.env);
  const live = mode === "live" && process.env.NODE_ENV === "production";
  return {
    secret: secretFrom(process.env),
    live,
    forward: live ? (payload) => forwardJson(BACKOFFICE_URL, payload) : async () => ({ kind: "blocked" }),
  };
}
