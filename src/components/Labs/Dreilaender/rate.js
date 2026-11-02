// EUR/CHF-Kurs: reine Logik (Server, Client, Unit-Tests) – kein fetch, kein fs.
// ecb.server.js steckt die echten Quellen hinein, tests/unit/labs-dreilaender-rate.test.mjs
// prüft die Fallback-Kette mit Attrappen.
//
// Regel: nie stillschweigend falsch rechnen. Jeder Kurs trägt Quelle, Datum
// und Alter in Tagen; ist er älter als STALE_DAYS, sagt die Seite das deutlich.
// Gibt es gar keinen gültigen Kurs, rechnet der Rechner für CH/FL nicht.
import * as z from "../zod.js"; // benannte Re-Exporte statt ganzem zod-Namensraum (Bundle, R4)

// Die EZB veröffentlicht an Arbeitstagen gegen 16 Uhr MEZ. Freitag → Montag
// sind 3 Tage, mit Feiertag (z. B. Ostermontag) 4. Darüber ist der Kurs alt.
export const STALE_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

export const rateSchema = z.object({
  rate: z.number().min(0.5).max(2),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function parseEcbXml(xml) {
  const text = String(xml ?? "");
  const date = text.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  const rate = Number(text.match(/<Cube\s+currency=['"]CHF['"]\s+rate=['"]([\d.]+)['"]/)?.[1]);
  return rateSchema.parse({ rate, date });
}

// Ganze Kalendertage zwischen Kursdatum (UTC) und heute; nie negativ.
export function ageDays(date, now = Date.now()) {
  const t = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(t)) return null;
  const today = Date.parse(new Date(now).toISOString().slice(0, 10) + "T00:00:00Z");
  return Math.max(0, Math.round((today - t) / DAY_MS));
}

function withAge(entry, source, fallback, now) {
  const age = ageDays(entry.date, now);
  return { rate: entry.rate, date: entry.date, source, fallback, ageDays: age, stale: age == null || age > STALE_DAYS };
}

// Fallback-Kette: EZB → zuletzt gespeicherter Kurs → Festwert aus der
// Konfiguration → kein Kurs (rate: null). Alle Quellen werden mit zod geprüft.
// deps: { fetchXml(): Promise<string>, readLast(): Promise<unknown>,
//         saveLast(entry): Promise<void>, fixed: unknown, now?: number, warn?: fn }
export async function resolveEurChf({ fetchXml, readLast, saveLast, fixed, now = Date.now(), warn = () => {} }) {
  try {
    const parsed = parseEcbXml(await fetchXml());
    try {
      await saveLast?.(parsed);
    } catch {
      // Speichern ist nur Komfort.
    }
    return withAge(parsed, "ezb", false, now);
  } catch (err) {
    warn(err);
  }
  let last = null;
  try {
    last = rateSchema.safeParse(await readLast?.());
  } catch {
    last = null;
  }
  const fix = rateSchema.safeParse(fixed);
  // Den jüngeren der beiden Ersatzwerte nehmen (Festwert kann neuer sein als ein alter Speicherstand).
  const candidates = [
    last?.success ? withAge(last.data, "zwischenspeicher", true, now) : null,
    fix.success ? withAge(fix.data, "festwert", true, now) : null,
  ].filter(Boolean);
  candidates.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (candidates.length) return candidates[0];
  return { rate: null, date: null, source: "keiner", fallback: true, ageDays: null, stale: true };
}

export const hasRate = (info) => rateSchema.safeParse({ rate: info?.rate, date: info?.date }).success;

// Anzeige-Texte zum Kurs (eine Quelle für Hero, Rechner und Ergebnis).
// level: "ok" | "fallback" | "stale" | "none"
// `text` (optional): EN/FR/IT-Fassung vom Server (src/lib/dreilaender/copy-intl.js, client.rate).
export function rateNotice(info, fmt = { date: (d) => d, rate: (r) => String(r) }, text = null) {
  if (text) return rateNoticeText(info, fmt, text);
  if (!hasRate(info)) {
    return {
      level: "none",
      label: "Kein Kurs",
      text: "Der EUR/CHF-Kurs ist gerade nicht verfügbar. Beträge in Franken rechnen wir deshalb nicht – bitte später erneut versuchen oder persönlich anfragen.",
    };
  }
  const d = fmt.date(info.date);
  const r = fmt.rate(info.rate);
  if (!info.fallback && !info.stale) {
    return { level: "ok", label: "EZB-Referenzkurs", text: `EZB-Referenzkurs vom ${d}: 1 € = ${r} CHF` };
  }
  const days = info.ageDays == null ? "" : ` (vor ${info.ageDays} ${info.ageDays === 1 ? "Tag" : "Tagen"})`;
  if (info.stale) {
    return {
      level: "stale",
      label: "Letzter EZB-Kurs",
      text: `Achtung: Der letzte verfügbare EZB-Kurs ist vom ${d}${days}: 1 € = ${r} CHF. Ein aktueller Kurs war nicht abrufbar, die Beträge in Franken können deshalb vom heutigen Kurs abweichen.`,
    };
  }
  return {
    level: "fallback",
    label: "Letzter EZB-Kurs",
    text: `Letzter verfügbarer EZB-Kurs vom ${d}: 1 € = ${r} CHF – der aktuelle Kurs war gerade nicht abrufbar.`,
  };
}

const fillText = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

/** rateNotice() mit übersetzten Texten (gleiche Stufen wie die deutsche Fassung). */
function rateNoticeText(info, fmt, t) {
  if (!hasRate(info)) return { level: "none", label: t.noneLabel, text: t.noneText };
  const vars = { date: fmt.date(info.date), rate: fmt.rate(info.rate) };
  if (!info.fallback && !info.stale) return { level: "ok", label: t.okLabel, text: fillText(t.okText, vars) };
  vars.ago = info.ageDays == null ? "" : fillText(t.ago, { n: info.ageDays, unit: info.ageDays === 1 ? t.day : t.days });
  if (info.stale) return { level: "stale", label: t.lastLabel, text: fillText(t.staleText, vars) };
  return { level: "fallback", label: t.lastLabel, text: fillText(t.fallbackText, vars) };
}
