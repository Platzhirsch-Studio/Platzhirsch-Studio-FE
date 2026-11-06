// src/lib/backend/newsletterAbmeldung.js – One-Click-Abmeldung nach RFC 8058
// (Route /api/newsletter/abmelden-1klick, Pfad = ph_marketing Einstellung
// one_click_pfad; die Mail trägt List-Unsubscribe: <…?token=…> und
// List-Unsubscribe-Post: List-Unsubscribe=One-Click, ph_marketing versand.abmelde_kopfzeilen).
//
//   ph  (Gruppe "newsletter"): POST ph_marketing.api.unsubscribe_one_click
//       { token, body: "List-Unsubscribe=One-Click" } → { status: abgemeldet | bereits_abgemeldet }
//       Fehler: invalid_token 404, invalid 400, sonst unavailable.
//   alt: platzhirsch_studio kennt keine Abmeldemethode (Newsletter Website hat
//       nur subscribe; ohne Double-Opt-in wird von dort nichts versendet). Der
//       bisherige Weg ist die Abmeldung durch das Team: die Anfrage wird als
//       Datei im Postausgang abgelegt (nur Hash des Tokens) und im Log gemeldet.
//
// Rein (relative Importe; fetch und Postausgang werden übergeben).
import { createHash } from "node:crypto";
import { phCall, resolveBackend } from "./config.js";

export const ONE_CLICK_BODY = "List-Unsubscribe=One-Click";
export const PH_ONE_CLICK_METHOD = "ph_marketing.api.unsubscribe_one_click";
export const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

/** RFC 8058 §3.1: der (form-encoded) Body enthält List-Unsubscribe=One-Click. */
export function isOneClickBody(text) {
  return String(text || "")
    .split("&")
    .map((t) => {
      try {
        return decodeURIComponent(t.replace(/\+/g, " ")).trim();
      } catch {
        return t.trim();
      }
    })
    .includes(ONE_CLICK_BODY);
}

export const tokenHash = (token) => createHash("sha256").update(String(token)).digest("hex");

/**
 * @param {{ token: string, env?: object, fetchImpl?: Function, outbox?: (entry: object) => Promise<unknown>, now?: Date }} o
 * @returns {Promise<{ ok: true, status: "abgemeldet"|"bereits_abgemeldet"|"vorgemerkt", generation: "alt"|"ph" } | { ok: false, code: string, generation: "alt"|"ph" }>}
 */
export async function unsubscribeOneClick({ token, env = process.env, fetchImpl = globalThis.fetch, outbox, now = new Date() } = {}) {
  const target = resolveBackend("newsletter", env);
  if (!TOKEN_RE.test(String(token || ""))) return { ok: false, code: "invalid_token", generation: target.generation };
  if (target.generation === "ph") {
    if (!target.ph) return { ok: false, code: "not_configured", generation: "ph" };
    const r = await phCall(target.ph, PH_ONE_CLICK_METHOD, { params: { token, body: ONE_CLICK_BODY }, fetchImpl });
    if (r.ok) return { ok: true, status: r.message?.status === "bereits_abgemeldet" ? "bereits_abgemeldet" : "abgemeldet", generation: "ph" };
    return { ok: false, code: r.code === "invalid_token" || r.code === "not_found" ? "invalid_token" : r.code === "invalid" ? "invalid" : "unavailable", generation: "ph" };
  }
  if (typeof outbox !== "function") return { ok: false, code: "unavailable", generation: "alt" };
  try {
    await outbox({ art: "newsletter-abmeldung-one-click", eingang: now.toISOString(), token_sha256: tokenHash(token) });
  } catch {
    return { ok: false, code: "unavailable", generation: "alt" };
  }
  return { ok: true, status: "vorgemerkt", generation: "alt" };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Kleine HTML-Seite (noindex, ohne Skript). */
export function abmeldeSeite({ titel, text, token = null, action = "" }) {
  const form = token
    ? `<form method="post" action="${esc(action)}?token=${esc(token)}"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit">Newsletter abbestellen</button></form>`
    : "";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(titel)} – Platzhirsch Home Living</title></head><body><main><h1>${esc(titel)}</h1><p>${esc(text)}</p>${form}<p><a href="/de">Zur Startseite</a> · Fragen: <a href="mailto:info@platzhirsch.studio">info@platzhirsch.studio</a></p></main></body></html>`;
}

export const SEITEN = Object.freeze({
  frage: { titel: "Newsletter abbestellen", text: "Möchten Sie keine Newsletter mehr von Platzhirsch Home Living erhalten? Ein Klick genügt." },
  abgemeldet: { titel: "Abgemeldet", text: "Sie erhalten keine Newsletter mehr von uns." },
  bereits_abgemeldet: { titel: "Bereits abgemeldet", text: "Diese Adresse erhält bereits keine Newsletter mehr." },
  vorgemerkt: { titel: "Abmeldung erhalten", text: "Wir haben Ihre Abmeldung erhalten und tragen Sie aus dem Verteiler aus." },
  invalid_token: { titel: "Link ungültig", text: "Dieser Abmeldelink ist ungültig oder abgelaufen. Schreiben Sie uns kurz, wir tragen Sie aus." },
  fehler: { titel: "Gerade nicht möglich", text: "Die Abmeldung ist gerade nicht möglich. Bitte versuchen Sie es später noch einmal oder schreiben Sie uns kurz." },
});
