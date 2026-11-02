// src/lib/wunschliste/model.js — Datensatz und Regeln der teilbaren Wunschliste.
// Reine Funktionen ohne Speicher (der liegt in ./localStore.js bzw. später im
// Frappe-Doctype „Wunschliste“, siehe ./frappeAdapter.js). Keine "@/..."-
// Importe: direkt mit `node --test` geprüft (tests/unit/wunschliste.test.mjs).
//
// Datenschutz (Art. 5 Abs 1 lit c, Art. 25 DSGVO) – was wo sichtbar ist:
//   öffentlich (Teilen-Link): Anlass, Titel, Datum, Nachricht, Stücke (Bild,
//     Marke, Name – nie Preise) und je Stück nur „reserviert ja/nein“.
//     Keine Namen von Schenkenden, keine Beträge, keine Adressen.
//   Verwaltung (nur Ersteller): zusätzlich Name und Notiz bei Reservierungen
//     und Name, Gruß, vorgeschlagener Betrag der Beiträge – NIE die E-Mail
//     der Schenkenden (die ist nur für das Studio, um den Gutschein
//     abzustimmen).
//   Studio (Frappe): alles, inklusive E-Mail der Beitragenden.
import { LIMITS, OCCASIONS, retentionMonths, safeHref, safeImage } from "./config.js";
import { itemKeyOf, matchesHash, newIds, randomToken, sealShare, sha256, shortRef, unsealShare } from "./ids.js";
import { clean } from "./schemas.js";

export const RECORD_VERSION = 1;

export class WishlistError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** Merkliste-Einträge → bereinigte Stücke (ohne Doppelte, höchstens LIMITS.items). */
export function normalizeItems(raw) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(raw) ? raw : []) {
    const name = clean(item?.name).slice(0, 160);
    if (!name) continue;
    const key = itemKeyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      name,
      brand: clean(item?.category).slice(0, 120),
      image: safeImage(item?.image),
      href: safeHref(item?.href),
    });
    if (out.length >= LIMITS.items) break;
  }
  return out;
}

/** Ablaufdatum: Anlass bzw. Erstellung + Speicherfrist (Monate). */
export function expiryOf({ date, createdAt }, months = retentionMonths()) {
  const base = date ? new Date(`${date}T23:59:59Z`) : new Date(createdAt);
  const start = base.getTime() > new Date(createdAt).getTime() ? base : new Date(createdAt);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return end.toISOString();
}

export const isExpired = (record, now = new Date()) => new Date(record.expiresAt).getTime() <= now.getTime();

/**
 * Neuer Datensatz aus geprüfter Eingabe (CreateBody).
 * @returns {{ record: object, shareId: string, adminToken: string }}
 */
export function createRecord(input, { now = new Date(), ids = newIds(), ref = shortRef() } = {}) {
  if (!OCCASIONS.includes(input.occasion)) throw new WishlistError("bad_request");
  const items = normalizeItems(input.items);
  if (!items.length) throw new WishlistError("no_items");
  const createdAt = now.toISOString();
  const record = {
    v: RECORD_VERSION,
    listId: ids.listId,
    shareHash: sha256(ids.shareId),
    shareSealed: sealShare(ids.shareId, ids.adminSecret),
    adminHash: sha256(ids.adminSecret),
    ref,
    status: "aktiv",
    locale: input.locale || "de",
    occasion: input.occasion,
    title: input.title,
    date: input.date || null,
    message: input.message || "",
    items,
    reservations: {},
    contributions: [],
    createdAt,
    updatedAt: createdAt,
    expiresAt: null,
  };
  record.expiresAt = expiryOf(record);
  return { record, shareId: ids.shareId, adminToken: `${ids.listId}.${ids.adminSecret}` };
}

/** Öffentliche Ansicht (Teilen-Link). */
export function publicView(record) {
  return {
    ref: record.ref,
    locale: record.locale,
    occasion: record.occasion,
    title: record.title,
    date: record.date,
    message: record.message,
    items: record.items.map((item) => ({ ...item, reserved: Boolean(record.reservations[item.key]) })),
    expiresAt: record.expiresAt,
  };
}

/** Ansicht für den Ersteller: Reservierungen mit Name/Notiz, Beiträge ohne E-Mail. */
export function ownerView(record) {
  return {
    ...publicView(record),
    status: record.status,
    createdAt: record.createdAt,
    items: record.items.map((item) => {
      const r = record.reservations[item.key];
      return { ...item, reserved: Boolean(r), reservation: r ? { at: r.at, name: r.name || "", note: r.note || "" } : null };
    }),
    // Name und Gruß nur mit freiwilliger Einwilligung (showName); ältere
    // Einträge ohne Feld stammen aus der Pflicht-Einwilligung (= true).
    contributions: record.contributions.map(({ id, at, amount, name, message, status, channel, showName }) => {
      const visible = showName !== false;
      return { id, at, amount, name: visible ? name : "", message: visible ? message : "", anonymous: !visible, status, channel };
    }),
  };
}

export const ownsRecord = (record, secret) => matchesHash(secret, record?.adminHash);

/** Reserviert ein Stück; liefert den Storno-Schlüssel (nur einmal im Klartext). */
export function reserveItem(record, key, { name = "", note = "" } = {}, { now = new Date(), cancel = randomToken() } = {}) {
  if (record.status !== "aktiv") throw new WishlistError("inactive", 410);
  if (!record.items.some((i) => i.key === key)) throw new WishlistError("unknown_item", 404);
  if (record.reservations[key]) throw new WishlistError("already_reserved", 409);
  record.reservations[key] = { at: now.toISOString(), cancelHash: sha256(cancel), name, note };
  record.updatedAt = now.toISOString();
  return cancel;
}

/** Hebt eine Reservierung auf: Schenkende mit Storno-Schlüssel oder der Ersteller (owner=true). */
export function releaseItem(record, key, { cancel, owner = false } = {}, now = new Date()) {
  const r = record.reservations[key];
  if (!r) throw new WishlistError("not_reserved", 404);
  if (!owner && !matchesHash(cancel, r.cancelHash)) throw new WishlistError("forbidden", 403);
  delete record.reservations[key];
  record.updatedAt = now.toISOString();
}

/** Beitrag zum Gemeinschafts-Gutschein (Anfrage-Weg oder Zahlung über die Gutscheinstrecke). */
export function addContribution(record, { amount = null, name, email, message = "", consent = false }, { now = new Date(), channel = "anfrage", id = randomToken().slice(0, 12) } = {}) {
  if (record.status !== "aktiv") throw new WishlistError("inactive", 410);
  if (record.contributions.length >= 200) throw new WishlistError("too_many", 429);
  const entry = {
    id,
    at: now.toISOString(),
    amount: amount ?? null,
    name,
    email,
    message,
    // Freiwillige Einwilligung „Name und Gruß anzeigen“ mit Zeitpunkt (Nachweis Art. 7 Abs. 1).
    showName: consent === true,
    consentAt: consent === true ? now.toISOString() : null,
    channel, // "anfrage" | "stripe"
    status: channel === "stripe" ? "offen" : "angefragt",
  };
  record.contributions.push(entry);
  record.updatedAt = entry.at;
  return entry;
}

/**
 * Stücke mit der aktuellen Merkliste abgleichen. Reservierte Stücke bleiben
 * immer stehen (sonst verschwände ein schon gekauftes Geschenk aus der Liste).
 * @returns {{ kept: string[] }} Namen reservierter Stücke, die nicht mehr in der Merkliste sind
 */
export function syncItems(record, raw, now = new Date()) {
  const fresh = normalizeItems(raw);
  const freshKeys = new Set(fresh.map((i) => i.key));
  const kept = record.items.filter((i) => record.reservations[i.key] && !freshKeys.has(i.key));
  if (!fresh.length && !kept.length) throw new WishlistError("no_items");
  record.items = [...fresh, ...kept].slice(0, LIMITS.items + kept.length);
  record.updatedAt = now.toISOString();
  return { kept: kept.map((i) => i.name) };
}

/** Teilen-Link für den Ersteller wieder lesbar machen (null, wenn nicht entschlüsselbar). */
export const shareIdFor = (record, adminSecret) => unsealShare(record.shareSealed, adminSecret);

/** Neuer Teilen-Link; der alte ist sofort ungültig. */
export function rotateShare(record, adminSecret, { now = new Date(), shareId = randomToken() } = {}) {
  record.shareHash = sha256(shareId);
  record.shareSealed = sealShare(shareId, adminSecret);
  record.updatedAt = now.toISOString();
  return shareId;
}

export function setStatus(record, status, now = new Date()) {
  if (!["aktiv", "widerrufen"].includes(status)) throw new WishlistError("bad_request");
  record.status = status;
  record.updatedAt = now.toISOString();
}

export function updateDetails(record, { title, message, date }, now = new Date()) {
  if (typeof title === "string" && title.length >= 2) record.title = title;
  if (typeof message === "string") record.message = message;
  if (date !== undefined) {
    const d = date ? String(date) : "";
    if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new WishlistError("bad_request");
    record.date = d || null;
    record.expiresAt = expiryOf(record);
  }
  record.updatedAt = now.toISOString();
}
