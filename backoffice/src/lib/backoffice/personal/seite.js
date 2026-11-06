import "server-only";
// Gemeinsamer Seitenstart des Bereichs Personal: Sitzung, Bereichsrecht, Rollen-Weiche, Kontext.
// Jede Seite prüft selbst (kein Schutz im Layout, README UI-Kit). Ohne Recht → /kein-zugriff (Q-B11).

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { kontext } from "./daten";
import { T } from "./texte";

export const KRUMEN_BASIS = Object.freeze([{ titel: T.krumen.zentrale, href: "/" }, { titel: T.krumen.personal, href: "/personal" }]);

/** searchParams → einfache Strings. */
export function params(sp) {
  return Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v ?? "")]));
}

/**
 * @param {string} pfad          Rückkehrpfad für die Anmeldung
 * @param {object} sp            searchParams (bereits aufgelöst)
 * @param {(rolle:string|null, ctx:object) => boolean} [erlaubt]  Rollen-Weiche; false → /kein-zugriff
 */
export async function seitenStart(pfad, sp = {}, erlaubt = null) {
  const session = await requireSession(pfad);
  if (!darf(session, "personal", "read")) redirect(`/kein-zugriff?von=${encodeURIComponent(pfad)}`);
  const ctx = await kontext(session, sp);
  if (erlaubt && !erlaubt(ctx.rolle, ctx)) redirect(`/kein-zugriff?von=${encodeURIComponent(pfad)}`);
  return ctx;
}

/** Monat aus „?monat=2026-11“ (sonst laufender). */
export function monatAus(sp, heute) {
  const m = /^(\d{4})-(\d{2})$/.exec(sp?.monat || "");
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { jahr: Number(m[1]), monat: Number(m[2]) };
  return { jahr: Number(heute.slice(0, 4)), monat: Number(heute.slice(5, 7)) };
}

export function monatSchluessel(jahr, monat, plus = 0) {
  const d = new Date(jahr, monat - 1 + plus, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
