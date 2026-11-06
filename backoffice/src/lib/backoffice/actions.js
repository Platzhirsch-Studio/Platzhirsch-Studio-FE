"use server";
// Server Actions des Fundaments. Jede Aktion prüft die Sitzung und das Recht
// erneut (nie dem Client vertrauen) und gibt serialisierbare Ergebnisse zurück:
//   { ok: true, ... } | { ok: false, code, message, fehler? }
// Fachbereichs-Agenten legen eigene Actions in src/lib/backoffice/<bereich>/actions.js
// nach demselben Muster an und nutzen requireSession/requireDocRecht aus auth/dal.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BACKOFFICE_LOGIN_PATH, LOGIN_RATE_LIMIT, backofficeMode } from "./config.js";
import { ARBEITSPLATZ_COOKIE, clientIp, endSession, getGeraet, getSession, requireSession, setzeArbeitsplatz, startSession } from "./auth/dal.js";
import { anmelden, anmeldenMitPin } from "./auth/login.js";
import { ipHash, rateLimit, rateLimitStatus } from "./auth/rateLimit.js";
import { arbeitsplatz, darf, darfDoc, darfGeraeteVerwalten, erlaubteArbeitsplaetze, istAdmin } from "./auth/rechte.js";
import { GERAET_COOKIE, geraetCookieOptions, geraetEntfernen, geraetSpeichern } from "./auth/geraet.js";
import { backoffice, ladeMeta } from "./frappe/index.js";
import { istBackofficeError } from "./frappe/errors.js";
import { formDataZuWerte, validiere } from "./validierung.js";
import { alsCsv } from "./csv.js";
import { listenFelder, listenSpalten } from "./frappe/meta.js";
import { cookies } from "next/headers";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, detail: err.detail };
  console.error("[backoffice] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: "Unerwarteter Fehler. Bitte erneut versuchen." };
}

function sicheresZiel(next, standard = "/") {
  return typeof next === "string" && /^\/(?!\/)[a-z0-9\-/?=&%._]*$/i.test(next) ? next : standard;
}

// ---------------------------------------------------------------- Anmeldung --

export async function anmeldenAction(prevState, formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 254);
  const passwort = String(formData.get("passwort") || "");
  const otp = String(formData.get("otp") || "").trim();
  const tmpId = String(formData.get("tmpId") || "");
  const next = sicheresZiel(formData.get("next"), "");
  const ip = await clientIp();
  const schluessel = `login:${ipHash(ip)}:${ipHash(email)}`;
  const limit = rateLimitStatus(schluessel, LOGIN_RATE_LIMIT);
  if (!limit.ok) return { ok: false, code: "rate_limited", message: `Zu viele Fehlversuche. Bitte in ${Math.ceil(limit.retryAfterSec / 60)} Minuten erneut versuchen.` };
  if (!email || (!passwort && !tmpId)) return { ok: false, code: "invalid", message: "Bitte E-Mail und Passwort eingeben." };
  let r;
  try {
    r = await anmelden({ email, passwort, otp: otp || undefined, tmpId: tmpId || undefined });
  } catch (err) {
    rateLimit(schluessel, LOGIN_RATE_LIMIT); // Fehlversuch zählen
    return fehler(err);
  }
  if (!r.ok && r.verification) return { ok: false, code: "verification", tmpId: r.tmpId, message: r.hinweis, email };
  if (!r.ok) {
    rateLimit(schluessel, LOGIN_RATE_LIMIT); // falsches Passwort (Frappe-Modus) zählen
    return { ok: false, code: r.code || "auth", message: r.message || "E-Mail oder Passwort stimmen nicht." };
  }
  const geraet = await getGeraet();
  const plaetze = erlaubteArbeitsplaetze(r.roles);
  const startplatz = geraet?.arbeitsplatz && plaetze.some((p) => p.slug === geraet.arbeitsplatz) ? geraet.arbeitsplatz : plaetze.length === 1 ? plaetze[0].slug : null;
  await startSession({ user: r.user, name: r.name, roles: r.roles, frappeSid: r.frappeSid, standort: r.standort, arbeitsplatz: startplatz, kiosk: !!arbeitsplatz(startplatz)?.kiosk });
  if (next) redirect(next);
  if (startplatz) redirect(arbeitsplatz(startplatz).href);
  redirect(plaetze.length > 1 ? "/arbeitsplatz" : "/");
}

export async function abmeldenAction() {
  await endSession();
  redirect(`${BACKOFFICE_LOGIN_PATH}?abgemeldet=1`);
}

export async function arbeitsplatzWaehlenAction(formData) {
  const session = await requireSession();
  const slug = String(formData.get("arbeitsplatz") || "");
  const ap = arbeitsplatz(slug);
  if (!ap || !erlaubteArbeitsplaetze(session.roles).some((p) => p.slug === slug)) redirect("/arbeitsplatz?fehler=1");
  await setzeArbeitsplatz(slug);
  redirect(ap.href);
}

/** Bedienerwechsel an Kassa/Packtisch: PIN statt Passwort, neue Sitzung, Idle 15 min. */
export async function bedienerWechselAction(prevState, formData) {
  const alt = await getSession();
  const geraet = await getGeraet();
  if (!alt && !geraet) return { ok: false, code: "forbidden", message: "Bedienerwechsel nur an einem registrierten Gerät oder in laufender Sitzung." };
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const pin = String(formData.get("pin") || "").trim();
  const ip = await clientIp();
  const limit = rateLimitStatus(`pin:${ipHash(ip)}`, LOGIN_RATE_LIMIT);
  if (!limit.ok) return { ok: false, code: "rate_limited", message: "Zu viele Versuche. Bitte kurz warten." };
  let r;
  try {
    r = await anmeldenMitPin({ email, pin });
  } catch (err) {
    rateLimit(`pin:${ipHash(ip)}`, LOGIN_RATE_LIMIT); // Fehlversuch zählen
    return fehler(err);
  }
  if (!r.ok) {
    rateLimit(`pin:${ipHash(ip)}`, LOGIN_RATE_LIMIT);
    return { ok: false, code: r.code || "auth", message: r.message || "PIN stimmt nicht." };
  }
  const ziel = (await cookies()).get(ARBEITSPLATZ_COOKIE)?.value || geraet?.arbeitsplatz || "kassa";
  if (alt) await endSession();
  await startSession({ user: r.user, name: r.name, roles: r.roles, frappeSid: null, standort: r.standort, arbeitsplatz: ziel, kiosk: true });
  redirect(arbeitsplatz(ziel)?.href || "/");
}

export async function geraetRegistrierenAction(prevState, formData) {
  const session = await requireSession("/geraet");
  if (!darfGeraeteVerwalten(session)) {
    return { ok: false, code: "forbidden", message: "Geräte registrieren dürfen nur die Backoffice-Administration und Leitungen. Bitte die Leitung des Bereichs fragen." };
  }
  const geraet = {
    name: String(formData.get("name") || "").trim().slice(0, 80),
    standort: String(formData.get("standort") || "").trim().slice(0, 80),
    typ: String(formData.get("typ") || ""),
    kasse: String(formData.get("kasse") || "").slice(0, 80),
    drucker: String(formData.get("drucker") || "").trim().slice(0, 80),
    registriertVon: session.user,
  };
  if (!geraet.name || !geraet.standort || !geraet.typ) return { ok: false, code: "invalid", message: "Name, Standort und Typ sind Pflicht." };
  try {
    const token = await geraetSpeichern(geraet, { session });
    (await cookies()).set(GERAET_COOKIE, token, geraetCookieOptions);
  } catch (err) {
    return fehler(err);
  }
  return { ok: true, message: `Gerät „${geraet.name}“ registriert.` };
}

/** Gerät sperren/entsperren (PH Geraet.sperren()/entsperren(); Mock: Speicher). */
export async function geraetSperrenAction({ geraet, sperren = true, grund = "" } = {}) {
  const session = await requireSession("/geraet");
  if (!darfGeraeteVerwalten(session)) return { ok: false, code: "forbidden", message: "Geräte sperren dürfen nur die Backoffice-Administration und Leitungen." };
  const id = String(geraet || "").slice(0, 140);
  if (!id) return { ok: false, code: "invalid", message: "Kein Gerät angegeben." };
  try {
    if (backofficeMode() === "mock") {
      const { mockGeraetSperren } = await import("./mock/core.js");
      if (!mockGeraetSperren(id, String(grund || "Gesperrt").slice(0, 140), !!sperren)) return { ok: false, code: "not_found", message: "Gerät nicht gefunden." };
    } else {
      await backoffice(session).runDocMethod("PH Geraet", id, sperren ? "sperren" : "entsperren", sperren ? { grund: String(grund || "").slice(0, 140) } : {});
    }
  } catch (err) {
    return fehler(err);
  }
  revalidatePath("/geraet");
  return { ok: true, message: sperren ? "Gerät gesperrt." : "Gerät entsperrt." };
}

export async function geraetEntfernenAction() {
  await requireSession("/geraet");
  const store = await cookies();
  await geraetEntfernen(store.get(GERAET_COOKIE)?.value);
  store.set(GERAET_COOKIE, "", { ...geraetCookieOptions, maxAge: 0 });
  redirect("/geraet?entfernt=1");
}

// ------------------------------------------------------------------ Dokumente --

/**
 * Speichert ein Dokument (neu oder bestehend) aus FormData oder Werten.
 * @param {{doctype:string, name?:string|null, modified?:string, werte?:object}} p
 * @param {FormData} [formData]
 */
export async function speichernDokumentAction(p, formData) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const meta = await ladeMeta(client, p.doctype);
    const neu = !p.name || p.name === "neu";
    if (!darfDoc(session, meta, neu ? "create" : "write")) return { ok: false, code: "forbidden", message: "Keine Berechtigung zum Speichern." };
    const roh = formData ? formDataZuWerte(formData, meta) : p.werte || {};
    const v = validiere(meta, roh, { neu });
    if (!v.ok) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: v.fehler };
    let doc;
    if (neu) doc = await client.insert(meta.name, v.werte);
    else doc = await client.save(meta.name, { ...v.werte, name: p.name }, { modified: p.modified });
    revalidatePath(`/d/${meta.slug}`);
    return { ok: true, name: doc.name, modified: doc.modified, doc };
  } catch (err) {
    return fehler(err);
  }
}

export async function workflowAktionAction({ doctype, name, action }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const doc = await client.workflowAction(doctype, name, action);
    revalidatePath(`/d`);
    return { ok: true, doc };
  } catch (err) {
    return fehler(err);
  }
}

/** Direkter Feldwert (Kanban ohne Workflow, Schnellbearbeitung). */
export async function setzeWertAction({ doctype, name, feld, wert }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const doc = await client.setValue(doctype, name, feld, wert);
    return { ok: true, doc };
  } catch (err) {
    return fehler(err);
  }
}

export async function loescheDokumentAction({ doctype, name }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    await client.delete(doctype, name);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function buchenAction({ doctype, name, storno = false }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const doc = storno ? await client.cancel(doctype, name) : await client.submit(doctype, name);
    return { ok: true, doc };
  } catch (err) {
    return fehler(err);
  }
}

export async function kommentarAction({ doctype, name, text }) {
  const session = await requireSession();
  const t = String(text || "").trim().slice(0, 2000);
  if (!t) return { ok: false, code: "invalid", message: "Kommentar ist leer." };
  try {
    const client = backoffice(session);
    const k = await client.kommentar(doctype, name, t);
    return { ok: true, kommentar: k };
  } catch (err) {
    return fehler(err);
  }
}

/** Dokumentmethode (Buttons der Fachbereiche): run_doc_method bzw. Mock-Protokoll. */
export async function dokumentMethodeAction({ doctype, name, method, args }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const r = await client.runDocMethod(doctype, name, method, args || {});
    return { ok: true, ergebnis: r };
  } catch (err) {
    return fehler(err);
  }
}

/** Massenaktion der DataTable: Workflow-Aktion oder Feldwert für mehrere Namen. */
export async function massenaktionAction({ doctype, namen, aktion, feld, wert }) {
  const session = await requireSession();
  const liste = Array.isArray(namen) ? namen.slice(0, 200) : [];
  const ergebnisse = [];
  try {
    const client = backoffice(session);
    for (const n of liste) {
      try {
        if (aktion) await client.workflowAction(doctype, n, aktion);
        else if (feld) await client.setValue(doctype, n, feld, wert);
        ergebnisse.push({ name: n, ok: true });
      } catch (err) {
        ergebnisse.push({ name: n, ok: false, message: istBackofficeError(err) ? err.message : "Fehler" });
      }
    }
    return { ok: true, ergebnisse, fehlgeschlagen: ergebnisse.filter((e) => !e.ok).length };
  } catch (err) {
    return fehler(err);
  }
}

/** CSV-Export einer Liste (nur mit export-Recht). */
export async function exportCsvAction({ doctype, filters, orFilters, orderBy, felder }) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    const meta = await ladeMeta(client, doctype);
    if (!darfDoc(session, meta, "export")) return { ok: false, code: "forbidden", message: "Export erfordert das Recht „export“ (Leitung, Admin, Geschäftsführung)." };
    const spalten = listenSpalten(meta, 20).filter((s) => !felder || felder.includes(s.fieldname));
    const zeilen = await client.getList(meta.name, { fields: listenFelder(meta), filters, orFilters, orderBy, limit: 5000 });
    return { ok: true, csv: alsCsv(spalten, zeilen), dateiname: `${meta.slug}-${new Date().toISOString().slice(0, 10)}.csv` };
  } catch (err) {
    return fehler(err);
  }
}

/** Benutzerverwaltung: Rolle zuweisen/entziehen (Frappe User.roles). Nur Admin. */
export async function rolleAendernAction({ user, rolle, entfernen = false }) {
  const session = await requireSession();
  if (!istAdmin(session)) return { ok: false, code: "forbidden", message: "Rollen ändern darf nur der Backoffice-Admin." };
  if (!/^PH /.test(rolle) && rolle !== "System Manager") return { ok: false, code: "invalid", message: "Nur PH-Rollen können hier vergeben werden." };
  try {
    const client = backoffice(session);
    const doc = await client.getDoc("User", user);
    const roles = (doc.roles || []).filter((r) => r.role !== rolle).map((r) => ({ ...r }));
    if (!entfernen) roles.push({ doctype: "Has Role", role: rolle });
    const neu = await client.save("User", { ...doc, roles }, { modified: doc.modified });
    revalidatePath("/benutzer");
    return { ok: true, roles: (neu.roles || []).map((r) => r.role) };
  } catch (err) {
    return fehler(err);
  }
}
