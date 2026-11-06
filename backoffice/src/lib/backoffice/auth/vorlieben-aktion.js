"use server";
// Server Actions der Vorlieben (P0-8). Jede Aktion prüft die Sitzung selbst (nie dem Client vertrauen).
// Mock und Frappe gehen denselben Weg: Vorlieben liegen im Sitzungs-Store (vorlieben.js), nicht in Frappe.
// Rückgabe { ok:true, vorlieben } | { ok:false, code, message }.

import { cookies } from "next/headers";
import { getSession } from "./dal.js";
import { AUTH_TEXTE } from "./texte.js";
import { patchUngueltig, vorliebenCookieOptionen, vorliebenCookieWerte, vorliebenLesen, vorliebenAusCookies, vorliebenSpeichern } from "./vorlieben.js";

async function cookiesSetzen(v) {
  const store = await cookies();
  for (const [name, wert] of Object.entries(vorliebenCookieWerte(v))) store.set(name, wert, vorliebenCookieOptionen);
}

/** Eine oder mehrere Vorlieben speichern, z. B. { theme: "dunkel" } · { dichte: "kompakt" } · { einzeltasten: false }. */
export async function vorliebeSpeichernAction(patch) {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", message: "Nicht angemeldet." };
  if (patchUngueltig(patch)) return { ok: false, code: "invalid", message: AUTH_TEXTE.vorliebeUngueltig };
  try {
    const store = await cookies();
    const basis = vorliebenAusCookies((n) => store.get(n)?.value);
    const vorlieben = await vorliebenSpeichern(session.user, patch, { basis });
    await cookiesSetzen(vorlieben);
    return { ok: true, vorlieben };
  } catch (err) {
    console.error("[backoffice] Vorlieben nicht gespeichert", err?.name || err);
    return { ok: false, code: "unavailable", message: AUTH_TEXTE.storeNichtErreichbar };
  }
}

/** Gespeicherte Vorlieben der angemeldeten Person (oder die Cookie-Werte, solange nichts gespeichert ist). */
export async function vorliebenLadenAction() {
  const session = await getSession();
  if (!session) return { ok: false, code: "auth", message: "Nicht angemeldet." };
  try {
    const store = await cookies();
    const vorlieben = (await vorliebenLesen(session.user)) || vorliebenAusCookies((n) => store.get(n)?.value);
    return { ok: true, vorlieben };
  } catch {
    return { ok: false, code: "unavailable", message: AUTH_TEXTE.storeNichtErreichbar };
  }
}
