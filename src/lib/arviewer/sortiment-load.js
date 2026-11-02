// AR-Viewer: Sortiment je Marke robust laden (QA R2 P1-1). Rein, ohne "server-only"
// und ohne "@/"-Importe, damit node --test es mit gemockten Fetchern prüfen kann.
//
// Ablauf je Marke:
//   1. live laden (fetchRows wirft bei Timeout/5xx/kaputter Antwort)
//   2. scheitert das: einmal nach retryMs (Standard 800 ms) wiederholen
//   3. scheitert auch das: die Zeilen dieser Marke aus dem letzten VOLLSTÄNDIGEN
//      Stand (Snapshot) nehmen → quelle "stand"
//   4. gibt es auch dort nichts: die Marke fehlt → quelle "fehlt"
// Ergebnis: rows je Marke plus failed (fehlt ganz) und stale (aus dem Stand).
// Ein Teilkatalog wird nie als vollständig gemeldet: complete === false, sobald
// eine Marke fehlt. Ein Snapshot wird nur aus einem vollständigen Live-Lauf gebaut.

export const RETRY_MS = 800;
export const CONCURRENCY = 6;

/** Schlanke Zeile: nur, was Liste, Filter und Karten brauchen (hält den Snapshot klein). */
export function slimRow(p) {
  const first = (p?.bild_anhangen || []).find((b) => b?.bild_anhangen);
  return {
    status: p?.status,
    path_field: p?.path_field,
    kategories: p?.kategories,
    produkt_name: p?.produkt_name,
    marken: p?.marken,
    bild_anhangen: first ? [{ bild_anhangen: first.bild_anhangen, alt_text: first.alt_text || null }] : [],
  };
}

async function pool(list, n, fn) {
  const out = new Array(list.length);
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, list.length) }, worker));
  return out;
}

/**
 * @param {object} o
 * @param {Array<{name:string}>|null} o.marken    aktive Marken (leer/null = Markenliste nicht geladen)
 * @param {(name:string)=>Promise<Array>} o.fetchRows   wirft bei Fehler
 * @param {{stand:string, marken:string[], rows:Record<string,Array>}|null} o.snapshot
 * @param {number} [o.retryMs]
 * @param {(ms:number)=>Promise<void>} [o.sleep]
 */
export async function loadSortimentRows({ marken, fetchRows, snapshot = null, retryMs = RETRY_MS, sleep, concurrency = CONCURRENCY }) {
  const wait = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const markenLive = Array.isArray(marken) && marken.length > 0;
  // Markenliste selbst nicht erreichbar → Marken aus dem letzten vollständigen Stand.
  const names = markenLive ? marken.map((m) => m.name).filter(Boolean) : snapshot?.marken || [];
  const results = await pool(names, concurrency, async (name) => {
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt) await wait(retryMs);
      try {
        const rows = await fetchRows(name);
        if (!Array.isArray(rows)) throw new Error("keine Liste");
        return { name, quelle: "live", rows, versuche: attempt + 1 };
      } catch (err) {
        lastErr = err;
      }
    }
    const fromSnap = snapshot?.rows?.[name];
    if (Array.isArray(fromSnap) && fromSnap.length) return { name, quelle: "stand", rows: fromSnap, versuche: 2, fehler: String(lastErr?.message || lastErr) };
    return { name, quelle: "fehlt", rows: [], versuche: 2, fehler: String(lastErr?.message || lastErr) };
  });
  const failed = results.filter((r) => r.quelle === "fehlt").map((r) => r.name);
  const stale = results.filter((r) => r.quelle === "stand").map((r) => r.name);
  const liveAll = markenLive && results.every((r) => r.quelle === "live");
  return {
    results,
    failed,
    stale,
    markenLive,
    // vollständig = keine Marke fehlt (Marken aus dem Stand zählen als vollständig, werden aber genannt)
    complete: names.length > 0 && failed.length === 0,
    // nur ein vollständiger LIVE-Lauf darf den Snapshot ersetzen
    snapshotCandidate: liveAll
      ? { marken: names, rows: Object.fromEntries(results.map((r) => [r.name, r.rows.map(slimRow)])) }
      : null,
    standVon: stale.length || !markenLive ? snapshot?.stand || null : null,
  };
}

/** Anzeige der Marken für den Hinweis („Minotti und Flos“). */
export function joinNames(list, display = (x) => x) {
  const n = [...new Set(list.map(display))];
  if (n.length <= 1) return n[0] || "";
  if (n.length > 4) return `${n.slice(0, 3).join(", ")} und ${n.length - 3} weitere Marken`;
  return `${n.slice(0, -1).join(", ")} und ${n.at(-1)}`;
}
