import "server-only";
// Gemeinsamer Seitenanfang des Bereichs (Q-A2): Sitzung → Bereichsrecht → Kontext.

import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { kontext } from "./daten";

/** Parameter als einfache Strings. */
export function params(sp = {}) {
  return Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "")]));
}

/**
 * @param {string} pfad   Rücksprung nach dem Login
 * @param {object} sp     searchParams (aufgelöst)
 * @param {{akte?: boolean, leitung?: boolean}} [opt]
 */
export async function seitenStart(pfad, sp = {}, { akte = false, leitung = false } = {}) {
  const session = await requireSession(pfad);
  if (!darf(session, "ablage", "read")) {
    if (akte) notFound();
    redirect("/kein-zugriff?bereich=ablage&aktion=read");
  }
  const ctx = kontext(session, sp);
  if (leitung && !ctx.leitung) redirect("/kein-zugriff?bereich=ablage&aktion=export");
  return ctx;
}

export const KRUMEN_BASIS = [
  { titel: "Zentrale", href: "/" },
  { titel: "Ablage", href: "/ablage" },
];

/** URL der Drive-Seite mit Parametern (leere entfallen). */
export function driveHref(p = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `/ablage?${s}` : "/ablage";
}
