import "server-only";
// Gemeinsamer Seitenanfang des Bereichs (Q-A2): Sitzung → Bereichsrecht → Kontext.
// Kassa-/Logistik-Rollen haben keinen Bereich und keine Akte (Konzept §2.2): Listen → /kein-zugriff,
// Akten → 404 (wie fehlendes Recht, 05 §8.3).

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
 * @param {{akte?: boolean}} [opt]  akte: ohne Recht 404 statt /kein-zugriff
 */
export async function seitenStart(pfad, sp = {}, { akte = false } = {}) {
  const session = await requireSession(pfad);
  const ctx = kontext(session, sp);
  if (!ctx.rolle || !darf(session, "kundenkarte", "read")) {
    if (akte) notFound();
    redirect(`/kein-zugriff?bereich=kundenkarte&aktion=read`);
  }
  return ctx;
}

export const KRUMEN_BASIS = [
  { titel: "Zentrale", href: "/" },
  { titel: "Kundenkarte", href: "/kundenkarte" },
];
