// src/lib/kundenkarte/adapters/mock.js – Mock ohne Backend: Anträge in
// .data/kundenkarte/antraege.json, Karte des Portals aus portalMock.js.
// Gleiche Antworten und Fehlercodes wie der Frappe-Adapter (interface.js).
// Keine "@/..."-Importe (node --test mit eigenem `dir`).
import { CONFIRM_TTL_MS } from "../config.js";
import { buildDemoCard } from "../portalMock.js";
import { readStore, updateStore } from "../store.js";
import { confirmMatches, mockCardNumber, newReference } from "../token.js";

const FILE = "antraege";

/** Abgelaufene, nie bestätigte Anträge verwerfen (Datensparsamkeit). */
export function prune(list, now) {
  return list.filter((a) => a.status !== "unbestaetigt" || Date.parse(a.confirmUntil) > now - 7 * 24 * 60 * 60 * 1000);
}

export function createMockAdapter({ dir, now: clock = () => Date.now() } = {}) {
  const all = () => readStore(FILE, [], dir);

  return {
    kind: "mock",
    test: true,

    async create(input) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const current = prune(list, now);
          const email = String(input.email).toLowerCase();
          const existing = current.find((a) => a.email === email);
          if (existing && existing.status === "aktiv") return { value: current, result: { ok: false, code: "conflict" }, write: false };
          if (existing && existing.idem && existing.idem === input.idem) return { value: current, result: { ok: true, application: existing, replay: true }, write: false };
          const iso = new Date(now).toISOString();
          const base = {
            vorname: input.vorname,
            nachname: input.nachname,
            email,
            telefon: input.telefon || "",
            plz: input.plz || "",
            ort: input.ort || "",
            geburtstag: input.geburtstag || "",
            interessen: input.interessen || [],
            einwilligungAuswertung: Boolean(input.einwilligung_auswertung),
            einwilligungNewsletter: Boolean(input.einwilligung_newsletter),
            einwilligungTextVersion: input.einwilligung_text_version || "",
            sprache: input.sprache || "de",
            confirmHash: input.confirmHash,
            confirmUntil: new Date(now + CONFIRM_TTL_MS).toISOString(),
            quelle: "website",
            idem: input.idem || null,
            updatedAt: iso,
          };
          if (existing) {
            // Noch unbestätigt: Angaben und Link erneuern, Antragsnummer bleibt.
            const next = { ...existing, ...base };
            return { value: current.map((a) => (a.ref === existing.ref ? next : a)), result: { ok: true, application: next, renewed: true } };
          }
          let ref = newReference();
          while (current.some((a) => a.ref === ref)) ref = newReference();
          const application = { ref, status: "unbestaetigt", kartennummer: null, createdAt: iso, ...base };
          return { value: [...current, application], result: { ok: true, application } };
        },
        dir
      );
    },

    async confirm(ref, secret) {
      return updateStore(
        FILE,
        [],
        (list) => {
          const now = clock();
          const a = list.find((x) => x.ref === ref);
          if (!a || !confirmMatches(secret, a.confirmHash)) return { value: list, result: { ok: false, code: "invalid_token" }, write: false };
          if (a.status === "aktiv") return { value: list, result: { ok: true, application: a, already: true }, write: false };
          if (a.status !== "unbestaetigt") return { value: list, result: { ok: false, code: "invalid_token" }, write: false };
          if (Date.parse(a.confirmUntil) <= now) return { value: list, result: { ok: false, code: "expired" }, write: false };
          const index = list.filter((x) => x.status === "aktiv").length + 1;
          const next = { ...a, status: "aktiv", kartennummer: mockCardNumber(index, new Date(now).getFullYear()), confirmedAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() };
          return { value: list.map((x) => (x.ref === ref ? next : x)), result: { ok: true, application: next } };
        },
        dir
      );
    },

    async status(email) {
      const a = (await all()).find((x) => x.email === String(email).toLowerCase());
      return a ? { found: true, status: a.status } : { found: false, status: null };
    },

    async portalCard(kontakt) {
      if (!kontakt) return null;
      return buildDemoCard();
    },

    async walletPass() {
      // Bis das Backend signiert: nicht verfügbar (Seite zeigt „in Vorbereitung“).
      return { ok: false, code: "unavailable" };
    },
  };
}
