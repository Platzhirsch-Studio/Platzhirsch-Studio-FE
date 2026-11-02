// src/lib/ideenboard/model.js — Karten, Board und geteilte Fassung (rein).
// Keine "@/..."-Importe: direkt mit `node --test` geprüft
// (tests/unit/pinterest-ideenboard.test.mjs). Client und Server nutzen
// dieselbe Bereinigung: was der Browser speichert, kann der Server ohne
// Vertrauen übernehmen.
import { CARD_TYPES, LIMITS, RETENTION_MONTHS, safeHref, safeImage } from "./config.js";
import { pinRights } from "../pinterest/rights.js";

const text = (v, max) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/[<>]/g, "")
        .trim()
        .slice(0, max)
    : "";

const ID_RE = /^[a-z0-9-]{4,40}$/;

/** Stabile Kennung einer Quelle (gleiches Bild zweimal = eine Karte). */
export function cardKey({ type, href, image, title }) {
  const raw = `${type}|${href || ""}|${image || ""}|${type === "notiz" ? title || "" : ""}`;
  // FNV-1a 32 bit, zweimal (rein, ohne crypto) → 16 Zeichen base36
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x811c9dc5) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`.padStart(8, "0").slice(0, 16);
}

/**
 * Eine Karte bereinigen; null, wenn sie unbrauchbar ist.
 * @param {object} input {type, title, subtitle?, href?, image?, quelle?, room?, note?, addedAt?, id?}
 */
export function sanitizeCard(input) {
  if (!input || typeof input !== "object") return null;
  const type = CARD_TYPES.includes(input.type) ? input.type : null;
  if (!type) return null;
  const title = text(input.title, LIMITS.title);
  const note = text(input.note, LIMITS.note);
  if (!title && !(type === "notiz" && note)) return null;
  const href = type === "notiz" ? null : safeHref(input.href);
  const image = type === "notiz" ? null : safeImage(input.image);
  const card = {
    id: "",
    type,
    title: title || note.slice(0, 60),
    subtitle: text(input.subtitle, LIMITS.subtitle) || null,
    href,
    image,
    quelle: text(input.quelle, LIMITS.quelle) || null,
    room: text(input.room, LIMITS.room) || null,
    note,
    addedAt: isIso(input.addedAt) ? input.addedAt : new Date().toISOString(),
  };
  // Quelle ohne Pinterest-Recht trotz freigegebenem Pfad (z. B. Projekt ohne
  // Einwilligung „pinterest“): nie einen Merken-Link anbieten.
  if (input.nopin === true) card.nopin = true;
  card.id = typeof input.id === "string" && ID_RE.test(input.id) ? input.id : cardKey(card);
  return card;
}

const isIso = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));

/** Ganzes Board: bereinigte Karten, ohne Dubletten, höchstens LIMITS.cards. */
export function sanitizeBoard(input) {
  const list = Array.isArray(input?.cards) ? input.cards : Array.isArray(input) ? input : [];
  const seen = new Set();
  const cards = [];
  for (const raw of list) {
    const c = sanitizeCard(raw);
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    cards.push(c);
    if (cards.length >= LIMITS.cards) break;
  }
  return { v: 1, cards };
}

/** Karte hinzufügen (vorne nicht, sondern hinten: Reihenfolge = Sammelfolge). */
export function addCard(board, input) {
  const b = sanitizeBoard(board);
  const card = sanitizeCard(input);
  if (!card) return { board: b, added: false, card: null, reason: "invalid" };
  if (b.cards.some((c) => c.id === card.id)) return { board: b, added: false, card, reason: "exists" };
  if (b.cards.length >= LIMITS.cards) return { board: b, added: false, card, reason: "full" };
  return { board: { ...b, cards: [...b.cards, card] }, added: true, card };
}

export function removeCard(board, id) {
  const b = sanitizeBoard(board);
  return { ...b, cards: b.cards.filter((c) => c.id !== id) };
}

/** Karte von Position `from` nach `to` (0-basiert, begrenzt). */
export function moveCard(board, from, to) {
  const b = sanitizeBoard(board);
  const n = b.cards.length;
  if (from < 0 || from >= n) return b;
  const target = Math.max(0, Math.min(n - 1, to));
  if (target === from) return b;
  const cards = b.cards.slice();
  const [c] = cards.splice(from, 1);
  cards.splice(target, 0, c);
  return { ...b, cards };
}

export function setNote(board, id, note) {
  const b = sanitizeBoard(board);
  return { ...b, cards: b.cards.map((c) => (c.id === id ? { ...c, note: text(note, LIMITS.note) } : c)) };
}

const LOCALE_PREFIX_RE = /^\/(?:de|en|fr|it)(?:\/|$|\?)/;

/** Karten-Links tragen immer die Sprache ("/de/…"): "/produkte/x" → "/de/produkte/x". */
export function withLocale(href, locale = "de") {
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return null;
  return LOCALE_PREFIX_RE.test(href) ? href : `/${locale}${href === "/" ? "" : href}`;
}

/** Merkliste-Einträge (CartContext, localStorage "cart") → Möbel-Karten. */
export function cardsFromMerkliste(items, locale = "de") {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) =>
      sanitizeCard({
        type: String(it?.kategories || "").toLowerCase() === "ezarri" ? "ezarriMix" : "moebel",
        title: it?.name,
        subtitle: it?.category && it.category !== "default" ? it.category : null,
        href: withLocale(it?.href, locale),
        image: it?.image || null,
      })
    )
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Pinterest-Übernahme: pro Karte ein Merken-Link (nur freigegebene Bilder)
// und die CSV für die Pin-Massenerstellung (Pinterest Business: Spalten
// Title, Media URL, Pinterest board, Thumbnail, Description, Link,
// Publish date, Keywords).

export function pinnable(card) {
  return Boolean(card?.image && !card.nopin && pinRights(card.image).ok);
}

/** Quellenangabe einer Karte: freigegebene Quelle, sonst Marke (Möbel-Herstellerbild, § 74 UrhG) oder null. */
export function cardSource(card) {
  if (!card?.image || card.type === "notiz") return null;
  const r = pinRights(card.image);
  if (r.ok) return r.quelle;
  if (card.quelle) return card.quelle;
  return card.type === "moebel" && card.subtitle ? card.subtitle : null;
}

const CSV_HEAD = ["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"];
const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keine Formeln in Tabellenprogrammen
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** URL für die Massenerstellung kodieren (Leerzeichen, Klammern …), ohne schon kodierte %XX doppelt zu kodieren. */
export function encodeUrlPath(p) {
  const s = String(p ?? "");
  try {
    return encodeURI(decodeURI(s));
  } catch {
    return encodeURI(s);
  }
}

/**
 * @param {{cards: object[]}} board
 * @param {{boardName: string, site: string, describe: (card) => string}} o
 */
export function pinterestCsv(board, { boardName, site, describe }) {
  const rows = [CSV_HEAD];
  for (const c of sanitizeBoard(board).cards) {
    if (!pinnable(c)) continue;
    rows.push([
      c.title.slice(0, 100),
      `${site}${encodeUrlPath(c.image)}`,
      String(boardName || "").slice(0, 100),
      "",
      describe(c),
      c.href ? `${site}${encodeUrlPath(c.href)}` : site,
      "",
      [c.room, c.quelle].filter(Boolean).join(", "),
    ]);
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Textliste „Titel – Link“ zum Kopieren (alle Karten, auch ohne Pin-Recht). */
export function boardAsText(board, { site, labels }) {
  return sanitizeBoard(board)
    .cards.map((c, i) => {
      const head = `${i + 1}. ${labels?.[c.type] ? `${labels[c.type]}: ` : ""}${c.title}`;
      const lines = [head];
      if (c.subtitle) lines.push(`   ${c.subtitle}`);
      if (c.href) lines.push(`   ${site}${c.href}`);
      if (c.note) lines.push(`   „${c.note}“`);
      return lines.join("\n");
    })
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Geteilte Fassung (Server-Datensatz)

export class BoardError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/** Datensatz für den Speicher (nur Hashes der Schlüssel). */
export function createRecord({ board, ids, hashes, now = new Date() }) {
  const b = sanitizeBoard(board);
  if (!b.cards.length) throw new BoardError("empty", 400);
  const iso = now.toISOString();
  return {
    v: 1,
    boardId: ids.boardId,
    shareHash: hashes.share,
    adminHash: hashes.admin,
    status: "aktiv",
    createdAt: iso,
    updatedAt: iso,
    expiresAt: addMonths(now, RETENTION_MONTHS).toISOString(),
    cards: b.cards,
  };
}

export function syncRecord(record, board, now = new Date()) {
  const b = sanitizeBoard(board);
  if (!b.cards.length) throw new BoardError("empty", 400);
  record.cards = b.cards;
  record.updatedAt = now.toISOString();
  record.expiresAt = addMonths(now, RETENTION_MONTHS).toISOString();
  return record;
}

export const isExpired = (record, now = Date.now()) => !record?.expiresAt || Date.parse(record.expiresAt) <= now;

/** Was der Teilen-Link zeigt: Karten, Stand. Keine Kennungen, keine Hashes. */
export function publicView(record) {
  return {
    updatedAt: record.updatedAt,
    cards: sanitizeBoard(record.cards).cards.map(({ addedAt, ...c }) => c),
  };
}

export function ownerView(record) {
  return { status: record.status, createdAt: record.createdAt, updatedAt: record.updatedAt, expiresAt: record.expiresAt, count: record.cards?.length || 0 };
}
