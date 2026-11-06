import { redirect } from "next/navigation";
import { getGeraet, requireSession } from "@/lib/backoffice/auth/dal";
import { darfDoc, erlaubteArbeitsplaetze } from "@/lib/backoffice/auth/rechte";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { doctypeLabel } from "@/lib/backoffice/labels";

/** Sitzung + Arbeitsplatz-Recht für die Kiosk-Routen; liefert { session, geraet, benutzer }. */
export async function kioskZugang(slug) {
  const session = await requireSession(`/${slug}`);
  if (!erlaubteArbeitsplaetze(session.roles).some((a) => a.slug === slug)) redirect(`/kein-zugriff?bereich=${slug}&aktion=arbeitsplatz`);
  const geraet = await getGeraet();
  return { session, geraet: geraet ? { name: geraet.name, standort: geraet.standort } : null, benutzer: { name: session.name } };
}

/**
 * Links eines Kiosk-Platzhalters auf die generischen Listen – nur DocTypes mit Leserecht.
 * @param {object} session
 * @param {Array<{doctype:string, text?:string, icon?:string}>} eintraege
 */
export async function kioskLinks(session, eintraege) {
  const client = backoffice(session);
  const out = await Promise.all(
    eintraege.map(async (e) => {
      try {
        const meta = await ladeMeta(client, e.doctype);
        if (!meta || !darfDoc(session, meta, "read")) return null;
        return { titel: doctypeLabel(e.doctype), href: `/d/${meta.slug}`, text: e.text, icon: e.icon };
      } catch {
        return null;
      }
    })
  );
  return out.filter(Boolean);
}
