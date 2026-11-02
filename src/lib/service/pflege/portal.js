// src/lib/service/pflege/portal.js – „Meine Stücke & Pflege“ im Kundenportal.
//
// Baut die Liste NUR aus Daten, die das Portal schon hat:
//   Project.items (status, productPassId), ProductPass (materials, care,
//   deliveredAt), Appointments (künftig kind "pflege") und – sobald der
//   Adapter es liefert – Pflege-Abos aus Frappe (Doctype „Pflege Abo“,
//   Schnittstelle: Marktresearch/digital/features/service-pflege-schnittstelle.md).
// Rein, ohne "server-only" und ohne "@/..." (node --test).

import { materialsOf } from "./materials.js";
import { PFLEGE_CONFIG } from "./config.js";

const SHOWN_STATUS = new Set(["bestellt", "geliefert", "montiert"]);

/** ISO-Datum + Monate (UTC), null bei ungültigem Datum. */
export function addMonths(iso, months) {
  if (!iso || !Number.isFinite(months)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

const isFuture = (iso, now) => {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= now.getTime();
};

/**
 * Nächster Pflegetermin eines Stücks.
 * Vorrang: bestätigter/angefragter Termin (Appointment kind "pflege") →
 * Abo-Datum aus Frappe → Lieferung + Intervall (nur mit Abo) → offen.
 * @returns {{kind:"geplant"|"faellig"|"abLieferung"|"offen", date:string|null}}
 */
export function nextCare({ item, pass, abo, appointments = [], now = new Date(), intervalMonths = PFLEGE_CONFIG.intervallMonate }) {
  const appt = appointments
    .filter((a) => a && a.kind === "pflege" && a.status !== "abgesagt" && isFuture(a.start, now))
    .filter((a) => !a.itemIds || a.itemIds.includes(item.id))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))[0];
  if (appt) return { kind: "geplant", date: appt.start };
  if (abo?.naechsterTermin) return { kind: "faellig", date: abo.naechsterTermin };
  const delivered = pass?.deliveredAt || null;
  if (abo && delivered) return { kind: "faellig", date: addMonths(delivered, intervalMonths) };
  if (item.status === "bestellt") return { kind: "abLieferung", date: null };
  return { kind: "offen", date: null };
}

/** Abo zu einem Stück (über Position oder Produktpass). */
export function aboFor(item, subscriptions = []) {
  return (
    subscriptions.find(
      (s) => s && ["aktiv", "Aktiv"].includes(s.status) && (s.itemIds?.includes(item.id) || (item.productPassId && s.passIds?.includes(item.productPassId)))
    ) || null
  );
}

/**
 * Einträge für die Portal-Seite.
 * @param {{projects:object[], passes:Record<string,object|null>, appointments?:object[], subscriptions?:object[], now?:Date}} input
 * @returns {Array<{item, pass, project:{id,title}, materials:string[], care:string[], abo:object|null, next:{kind,date}}>}
 */
export function buildCareEntries({ projects = [], passes = {}, appointments = [], subscriptions = [], now = new Date() }) {
  const out = [];
  for (const project of projects) {
    for (const item of project.items || []) {
      if (!SHOWN_STATUS.has(item.status)) continue;
      const pass = item.productPassId ? passes[item.productPassId] || null : null;
      const materials = materialsOf(pass?.materials, item.variant, item.category, item.name);
      const abo = aboFor(item, subscriptions);
      out.push({
        item,
        pass,
        project: { id: project.id, title: project.title },
        materials,
        care: Array.isArray(pass?.care) ? pass.care.filter((c) => typeof c === "string" && c.trim()) : [],
        abo,
        next: nextCare({ item, pass, abo, appointments, now }),
      });
    }
  }
  return out;
}
