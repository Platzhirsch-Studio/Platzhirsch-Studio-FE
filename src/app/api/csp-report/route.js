// /api/csp-report – Empfänger der CSP-Verstoßmeldungen (F5-shell-technik-release,
// Runde 1; Expertenrat security P1 / Gesamturteil Nr. 34, Go-live-Liste E11).
//
// next.config.js schickt die Report-Only-Policy mit `report-uri /api/csp-report`
// und `report-to csp` (Header `Reporting-Endpoints`). Damit
//   - meldet der Browser echte Verstöße hierher statt nur in die Konsole,
//   - entfällt die WebKit-Konsolenmeldung „delivered in report-only mode, but
//     does not specify a 'report-uri'" (iOS/Safari, release-check.md R6.5).
//
// Datensparsam: gespeichert wird nichts. Pro Meldung eine Logzeile mit
// Richtlinie, blockierter Quelle (nur Origin bzw. Schlüsselwort) und Pfad der
// Seite (ohne Query und Fragment). Keine IP, kein User-Agent, kein Body-Rest.
// Grenzen: 16 KB je Anfrage (Runde 4, technik P2-9): größer → 413, geprüft
// zuerst am Content-Length-Header und dann beim Lesen des Streams, der nach
// 16 KB abgebrochen wird – ein 2-MB-POST wird nie ganz eingelesen. Höchstens
// 20 Meldungen je Anfrage, 60 Anfragen pro Minute und Prozess (danach 204
// ohne Log). Sonst Antwort immer 204, auch bei Müll – ein Angreifer erfährt
// nichts.

const MAX_BYTES = 16 * 1024;
const MAX_ITEMS = 20;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

let windowStart = 0;
let windowCount = 0;

function allow(now = Date.now()) {
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount <= MAX_PER_WINDOW;
}

/** Nur Origin oder Schlüsselwort (inline, eval, data …), nie Pfad oder Query. */
function sourceOf(value) {
  const s = String(value ?? "").slice(0, 300);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : u.protocol.replace(/:$/, "");
  } catch {
    return s.replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  }
}

/** Nur der Pfad der Seite. */
function pathOf(value) {
  try {
    return new URL(String(value ?? "")).pathname.slice(0, 200);
  } catch {
    return "";
  }
}

/** Beide Formate: application/csp-report (report-uri) und application/reports+json (report-to). */
function normalizeReports(body) {
  const items = Array.isArray(body) ? body : [body];
  const out = [];
  for (const item of items.slice(0, MAX_ITEMS)) {
    if (!item || typeof item !== "object") continue;
    const r = item["csp-report"] || (item.type === "csp-violation" ? item.body : null);
    if (!r || typeof r !== "object") continue;
    out.push({
      directive: String(r["effective-directive"] || r.effectiveDirective || r["violated-directive"] || "").slice(0, 60),
      blocked: sourceOf(r["blocked-uri"] ?? r.blockedURL),
      page: pathOf(r["document-uri"] ?? r.documentURL ?? item.url),
      disposition: String(r.disposition || "").slice(0, 12),
    });
  }
  return out;
}

const NO_STORE = { "Cache-Control": "no-store" };
const tooLarge = () => new Response(null, { status: 413, headers: NO_STORE });

/**
 * Body als Text, höchstens `limit` Bytes. null = zu groß (Stream wird
 * abgebrochen, der Rest nie gelesen).
 */
async function readLimited(request, limit = MAX_BYTES) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function POST(request) {
  let text;
  try {
    text = await readLimited(request);
  } catch {
    text = "";
  }
  if (text === null) return tooLarge();
  if (!allow()) return new Response(null, { status: 204, headers: NO_STORE });
  try {
    for (const r of normalizeReports(JSON.parse(text))) {
      console.warn(JSON.stringify({ src: "csp", level: "warn", ...r }));
    }
  } catch {
    /* kein gültiges JSON: still verwerfen */
  }
  return new Response(null, { status: 204, headers: NO_STORE });
}
