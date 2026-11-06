// Bereich Sortiment – Rollenweichen (10-konzept-sortiment § 1.2, Leitsatz 6). Reines Modul.
// Leitung entscheidet über Geld und Außenwirkung; das Team bereitet vor. Admin/System Manager gelten im
// Backoffice als Leitung (Betrieb, Testmodus); die GF liest nur (permlevel 1 lesend: EK sichtbar).

const LEITUNG = ["PH Sortiment Leitung", "System Manager", "Administrator", "PH Backoffice-Admin"];

function rollen(session) {
  return Array.isArray(session?.roles) ? session.roles : [];
}

/** Leitung Sortiment (oder Admin). */
export function istLeitung(session) {
  return rollen(session).some((r) => LEITUNG.includes(r));
}

/** Team oder Leitung Sortiment. */
export function istSortiment(session) {
  return istLeitung(session) || rollen(session).includes("PH Sortiment Mitarbeiter");
}

/** Darf Einkaufspreise und interne Notizen sehen (permlevel 1: Leitung schreibend, GF lesend). */
export function siehtEk(session) {
  return istLeitung(session) || rollen(session).some((r) => r === "PH Geschäftsführung" || r === "PH Geschaeftsfuehrung");
}

/** Felder mit permlevel 1 (EK, Notizen) aus einem Dokument entfernen, wenn die Sitzung sie nicht sehen darf. */
export function ohneIntern(doc, session) {
  if (!doc || siehtEk(session)) return doc;
  const aus = ["einkaufspreis_cent", "einkaufspreise", "notizen", "notizen_intern", "summe_ek_cent", "zuschlaege_cent", "skonto_cent", "konditionen", "kalkulationsfaktor_promille", "vk_rundung", "kalkulation_kategorien", "haendlervertrag", "standard_rabatt_promille", "rabattstaffeln", "mindermengenzuschlag_cent", "fracht_pauschale_cent", "frachtfrei_ab_cent", "ek_cent", "wert_cent"];
  const out = { ...doc };
  for (const f of aus) delete out[f];
  if (Array.isArray(out.positionen)) out.positionen = out.positionen.map((p) => {
    const { ek_cent: _a, ab_ek_cent: _b, ...rest } = p;
    return rest;
  });
  if (Array.isArray(out.ab_abgleich)) out.ab_abgleich = out.ab_abgleich.map((z) => (z.feld === "Preis" ? { ...z, bestellt: "nur Leitung", bestaetigt: "nur Leitung", abweichung_text: "Preis weicht ab" } : z));
  return out;
}
