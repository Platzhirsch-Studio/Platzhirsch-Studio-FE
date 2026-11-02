// src/lib/booking/adapters/mock.js – lokaler Kalender für Entwicklung und Tests.
// Buchungen in .data/booking/bookings.json, simulierte Fremdtermine aus
// slots.js (mockBusyBlocks), Videoraum = Test-Raum der Website
// (/{locale}/termin/testraum, deutlich als Test markiert). Kein Netzwerk.
// Double-Opt-in: Neue Buchungen stehen auf "unbestaetigt" und halten die
// Uhrzeit 30 Minuten (reservedUntil); erst confirm() mit dem Link aus der
// Mail setzt "bestaetigt" bzw. bei Vor Ort "angefragt". Gespeichert ist nur
// der Hash des Bestätigungslinks (verifyHash).
// Aufbewahrung: Buchungen 30 Tage nach Terminende werden gelöscht,
// unbestätigte einen Tag nach Ablauf der Reservierung.
// Keine "@/..."-Importe.
import { VERIFY_TTL_MIN } from "../constants.js";
import { buildDays, checkStart, mockBusyBlocks } from "../slots.js";
import { updateStore, readStore } from "../store.js";
import { newReference, verifyMatches } from "../token.js";
import { TERMINARTEN, modusOf } from "../types.js";

const FILE = "bookings";
const KEEP_MS = 30 * 86400000;
const KEEP_UNCONFIRMED_MS = 86400000;

const prune = (list, now) =>
  list.filter((b) => (b.status === "unbestaetigt" ? Date.parse(b.reservedUntil) + KEEP_UNCONFIRMED_MS > now : Date.parse(b.end) + KEEP_MS > now));

const contactOf = (input, modus) => ({
  locale: input.locale,
  vorname: input.vorname,
  nachname: input.nachname,
  email: input.email,
  telefon: input.telefon || "",
  plzOrt: modus === "vor_ort" ? input.plzOrt : "",
  anliegen: input.anliegen || "",
});

export function createMockAdapter({ dir, now: clock = () => Date.now(), simulateBusy = true } = {}) {
  const busy = simulateBusy ? mockBusyBlocks : null;

  const all = () => readStore(FILE, [], dir);

  return {
    kind: "mock",
    test: true,

    async slots({ art, von, bis, excludeRef = null }) {
      return buildDays({ art, from: von, to: bis, now: clock(), bookings: await all(), busy, excludeRef });
    },

    async create(input) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const current = prune(list, now);
          if (input.idem) {
            const startIso = Number.isFinite(Date.parse(input.start)) ? new Date(Date.parse(input.start)).toISOString() : null;
            const same = current.find((x) => x.idem === input.idem && x.start === startIso);
            // Noch unbestätigt (z. B. Adresse korrigiert): Kontakt + Bestätigungslink erneuern, gleiche Uhrzeit.
            if (same && same.status === "unbestaetigt" && Date.parse(same.reservedUntil) > now) {
              const next = { ...same, ...contactOf(input, same.modus), verifyHash: input.verifyHash, reservedUntil: new Date(now + VERIFY_TTL_MIN * 60000).toISOString(), updatedAt: new Date(now).toISOString() };
              return { value: current.map((b) => (b.ref === same.ref ? next : b)), result: { ok: true, booking: next, renewed: true } };
            }
            if (same && same.email === input.email) return { value: current, result: { ok: true, booking: same, replay: true }, write: false };
          }
          const check = checkStart({ art: input.art, modus: input.modus, start: input.start, now, bookings: current, busy });
          if (!check.ok) return { value: current, result: check, write: false };
          let ref = newReference();
          while (current.some((b) => b.ref === ref)) ref = newReference();
          const t = TERMINARTEN[input.art];
          const modus = modusOf(input.art, input.modus);
          const booking = {
            ref,
            art: input.art,
            modus,
            thema: input.thema || null,
            start: check.start,
            end: check.end,
            status: "unbestaetigt",
            final: t.bestaetigung === "anfrage" ? "angefragt" : "bestaetigt",
            verifyHash: input.verifyHash,
            reservedUntil: new Date(now + VERIFY_TTL_MIN * 60000).toISOString(),
            version: 1,
            sequence: 0,
            ...contactOf(input, modus),
            consent: modus === "video" ? { video: true, at: new Date(now).toISOString(), version: input.consentVersion } : null,
            meetUrl: modus === "video" ? `/${input.locale}/termin/testraum` : null,
            quelle: "website",
            idem: input.idem || null,
            createdAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          };
          return { value: [...current, booking], result: { ok: true, booking } };
        },
        dir
      );
    },

    async get(ref) {
      return (await all()).find((b) => b.ref === ref) || null;
    },

    /** Bestätigungslink aus der Mail → { ok, booking, already? } | { ok: false, code } */
    async confirm(ref, token) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const b = list.find((x) => x.ref === ref);
          if (!b || !verifyMatches(token, b.verifyHash)) return { value: list, result: { ok: false, code: "invalid_token" }, write: false };
          if (b.status === "storniert") return { value: list, result: { ok: false, code: "cancelled" }, write: false };
          if (b.status !== "unbestaetigt") return { value: list, result: { ok: true, booking: b, already: true }, write: false };
          if (Date.parse(b.reservedUntil) <= now) {
            // Abgelaufen: Uhrzeit nur übernehmen, wenn sie noch frei ist.
            const check = checkStart({ art: b.art, modus: b.modus, start: b.start, now, bookings: list, busy, excludeRef: ref });
            if (!check.ok) return { value: list, result: { ok: false, code: check.code === "slot_taken" ? "slot_taken" : "verify_expired" }, write: false };
          }
          const next = { ...b, status: b.final || "bestaetigt", reservedUntil: null, verifiedAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() };
          return { value: list.map((x) => (x.ref === ref ? next : x)), result: { ok: true, booking: next } };
        },
        dir
      );
    },

    async cancel(ref, version) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const b = list.find((x) => x.ref === ref);
          if (!b || b.version !== version || b.status === "unbestaetigt") return { value: list, result: { ok: false, code: "invalid_token" }, write: false };
          if (b.status === "storniert") return { value: list, result: { ok: true, booking: b, already: true }, write: false };
          if (Date.parse(b.start) <= now) return { value: list, result: { ok: false, code: "too_late_to_change" }, write: false };
          const next = { ...b, status: "storniert", sequence: b.sequence + 1, meetUrl: null, updatedAt: new Date(now).toISOString() };
          return { value: list.map((x) => (x.ref === ref ? next : x)), result: { ok: true, booking: next } };
        },
        dir
      );
    },

    async reschedule(ref, version, start) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const b = list.find((x) => x.ref === ref);
          if (!b || b.version !== version || b.status === "storniert" || b.status === "unbestaetigt") return { value: list, result: { ok: false, code: "invalid_token" }, write: false };
          if (Date.parse(b.start) <= now) return { value: list, result: { ok: false, code: "too_late_to_change" }, write: false };
          const check = checkStart({ art: b.art, modus: b.modus, start, now, bookings: list, busy, excludeRef: ref });
          if (!check.ok) return { value: list, result: check, write: false };
          const next = { ...b, start: check.start, end: check.end, version: b.version + 1, sequence: b.sequence + 1, updatedAt: new Date(now).toISOString() };
          return { value: list.map((x) => (x.ref === ref ? next : x)), result: { ok: true, booking: next } };
        },
        dir
      );
    },
  };
}
