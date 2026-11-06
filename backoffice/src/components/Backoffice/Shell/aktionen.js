"use server";
// Server Actions der Shell v2 (Team P0-7). Jede Aktion prüft die Sitzung erneut und gibt
// { ok:true, … } | { ok:false, code, message } zurück – nie werfen. Mock-Pfad: derselbe Client
// (MockClient / mock/core.js), Lesezustand der Glocke im Prozess-Speicher.

import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { phCore } from "@/lib/backoffice/frappe/core";
import { anmeldenMitPin } from "@/lib/backoffice/auth/login";
import { ladeGlocke, markiereGelesen } from "@/lib/backoffice/benachrichtigungen";
import { fuehreAblehnungAus, fuehreFreigabeAus, ladeFreigaben } from "@/lib/backoffice/freigaben/index";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  console.error("[backoffice] Shell-Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: "Gerade nicht erreichbar. Bitte erneut versuchen." };
}

/** Glocke frisch laden (nach SSE-Ereignis oder beim Öffnen). */
export async function glockeLadenAction() {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const freigaben = await ladeFreigaben(session, client);
    return { ok: true, glocke: await ladeGlocke(client, session, { freigaben }) };
  } catch (err) {
    return fehler(err);
  }
}

/** Einträge als gelesen markieren ({ ids: ["aufgabe:…", "log:…"] }). */
export async function gelesenAction({ ids = [] } = {}) {
  const session = await requireSession();
  if (!Array.isArray(ids)) return { ok: false, code: "invalid", message: "Ungültige Auswahl." };
  try {
    return await markiereGelesen(backoffice(session), session, ids.map(String));
  } catch (err) {
    return fehler(err);
  }
}

/** Freigeben (G-15). Geldwirksame Freigaben bestätigt der Client vorher im Dialog. */
export async function freigebenAction({ art, name, token } = {}) {
  const session = await requireSession();
  try {
    return await fuehreFreigabeAus(session, backoffice(session), { art: String(art || ""), name: String(name || ""), token: token ? String(token) : "" });
  } catch (err) {
    return fehler(err);
  }
}

/** Ablehnen mit Pflichtgrund (der Client sendet erst nach 8 s Rückgängig-Fenster). */
export async function ablehnenAction({ art, name, grund } = {}) {
  const session = await requireSession();
  try {
    return await fuehreAblehnungAus(session, backoffice(session), { art: String(art || ""), name: String(name || ""), grund: String(grund || "") });
  } catch (err) {
    return fehler(err);
  }
}

/** Eigene PIN setzen (ph_core.api.bediener.set_pin; Mock: mock/core.js). useActionState-Form. */
export async function pinSetzenAction(_prev, formData) {
  const session = await requireSession();
  const pin = String(formData.get("pin") || "").trim();
  const wiederholung = String(formData.get("pin2") || "").trim();
  if (!/^\d{4,6}$/.test(pin)) return { ok: false, code: "invalid", message: "PIN muss aus 4 bis 6 Ziffern bestehen." };
  if (pin !== wiederholung) return { ok: false, code: "invalid", message: "Die beiden Eingaben stimmen nicht überein." };
  try {
    const client = backoffice(session);
    await phCore(client.modus).setPin({ pin }, { client, session });
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Kundenmodus beenden (G-20, M-10: Langdruck + PIN). Prüft die PIN der angemeldeten Person
 * (registriertes Gerät: ph_core verify_pin; Mock ohne Gerät: Demo-PIN). Ohne Gerät im Frappe-Modus
 * ist keine PIN-Prüfung möglich → { ok:true, ohnePin:true } (Langdruck genügt, siehe Übergabe).
 */
export async function kundenmodusBeendenAction({ pin } = {}) {
  const session = await requireSession();
  const p = String(pin || "").trim();
  if (!/^\d{4,6}$/.test(p)) return { ok: false, code: "invalid", message: "PIN muss aus 4 bis 6 Ziffern bestehen." };
  try {
    await anmeldenMitPin({ email: session.user, pin: p });
    return { ok: true };
  } catch (err) {
    if (istBackofficeError(err) && err.code === "forbidden" && /registrierten Gerät/.test(err.message)) return { ok: true, ohnePin: true };
    return fehler(err);
  }
}
