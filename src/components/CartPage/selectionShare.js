// src/components/CartPage/selectionShare.js
// Rat 9,5 B9 (T2): „Ihre Auswahl“ teilen, ohne Konto und ohne Server.
// Die Stücke der Merkliste (localStorage) stehen als kompakte Liste im
// #Fragment des Links (/de/merkliste#auswahl=<base64url>) – das Fragment
// geht nie an den Server (kein Log, kein Referrer). Beim Öffnen zeigt die
// Seite die geteilten Stücke und bietet „In meine Auswahl übernehmen“ an.
// Nur Produktdaten, keine persönlichen Daten; alles wird beim Lesen geprüft
// (nur interne Pfade für Link und Bild, kurze Texte).
// Rein, ohne "@/..."-Importe (node --test tests/unit/rat95-t2-auswahl.test.mjs).

export const SHARE_HASH = "auswahl";
export const SHARE_MAX_ITEMS = 30;
const TEXT_MAX = 120;
const PATH_MAX = 300;

const HREF_RE = /^\/[A-Za-z0-9._~%\-/]*$/;
const IMAGE_RE = /^\/(?:cmx|cms|Images|ezarri|files)\/[A-Za-z0-9._~%\-/ ()]+$/;

const text = (v) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, TEXT_MAX) : "");
const path = (v, re) => (typeof v === "string" && v.length <= PATH_MAX && re.test(v) && !v.startsWith("//") && !v.includes("..") ? v : null);
const idOf = (v) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^[A-Za-z0-9._-]{1,64}$/.test(v) ? v : null);

function toB64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(b64) {
  const s = String(b64).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Ein Merkliste-Stück → geprüftes Stück (oder null). */
export function cleanItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = text(raw.name);
  const id = idOf(raw.id);
  if (!name || id === null) return null;
  const out = { id, name };
  const category = text(raw.category);
  if (category) out.category = category;
  const pid = idOf(raw.produkte_id);
  if (pid !== null) out.produkte_id = pid;
  const href = path(raw.href, HREF_RE);
  if (href) out.href = href;
  const image = path(raw.image, IMAGE_RE);
  if (image) out.image = image;
  return out;
}

/** Stücke → Fragment-Wert (base64url), höchstens SHARE_MAX_ITEMS. */
export function encodeSelection(items) {
  const rows = (Array.isArray(items) ? items : [])
    .map(cleanItem)
    .filter(Boolean)
    .slice(0, SHARE_MAX_ITEMS)
    .map((i) => [i.id, i.name, i.category || "", i.href || "", i.image || "", i.produkte_id ?? ""]);
  return rows.length ? toB64Url(JSON.stringify({ v: 1, i: rows })) : "";
}

/** Fragment-Wert → geprüfte Stücke ([] bei kaputtem oder fremdem Inhalt). */
export function decodeSelection(value) {
  if (typeof value !== "string" || !value || value.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(value)) return [];
  let data;
  try {
    data = JSON.parse(fromB64Url(value));
  } catch {
    return [];
  }
  if (!data || data.v !== 1 || !Array.isArray(data.i)) return [];
  return data.i
    .slice(0, SHARE_MAX_ITEMS)
    .map((r) => (Array.isArray(r) ? cleanItem({ id: r[0], name: r[1], category: r[2], href: r[3] || undefined, image: r[4] || undefined, produkte_id: r[5] === "" ? undefined : r[5] }) : null))
    .filter(Boolean);
}

/** Absoluter Teilen-Link: <origin>/<pfad>#auswahl=… */
export function selectionShareUrl({ origin, pathname, items }) {
  const code = encodeSelection(items);
  return code ? `${origin}${pathname}#${SHARE_HASH}=${code}` : "";
}

/** Wert aus location.hash ("#auswahl=…") oder "". */
export function shareFromHash(hash) {
  const m = /^#?auswahl=([A-Za-z0-9_-]+)$/.exec(String(hash || ""));
  return m ? m[1] : "";
}
