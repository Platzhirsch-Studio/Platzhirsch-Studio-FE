// Freie Zeiten für „Gespräch planen“ (Konzept § 6.2). Reines Modul, unit-getestet.
// Frei = keine geplanten Gespräche der Gesprächsführung, keine genehmigte/beantragte Abwesenheit oder
// Krankmeldung der Person, innerhalb der Öffnungszeit, Mo–Sa, nicht in der Vergangenheit.

import { plusTage, wochentag, zeitMin, minZeit } from "./zeit.js";

/** Belegte Zeiten einer Gesprächsführung als Einträge {start, ende, titel} („YYYY-MM-DD HH:MM“). */
export function belegteZeiten({ verantwortlich, gespraeche = [], abwesenheiten = [], tage = [], oeffnung = { von: "08:00", bis: "19:00" } }) {
  const out = [];
  for (const g of gespraeche) {
    if (g.verantwortlich !== verantwortlich || g.status !== "Geplant" || !g.start) continue;
    const start = String(g.start).slice(0, 16);
    const ende = g.ende ? String(g.ende).slice(0, 16) : plusMinutenText(start, Number(g.dauer_min) || 60);
    out.push({ id: g.name, start, ende, titel: "belegt" });
  }
  for (const a of abwesenheiten) {
    for (const d of tage) {
      if (a.von <= d && a.bis >= d) out.push({ id: `${a.name}-${d}`, start: `${d} ${oeffnung.von}`, ende: `${d} ${oeffnung.bis}`, titel: "abwesend", ganztag: true });
    }
  }
  return out;
}

function plusMinutenText(start, min) {
  const [d, t] = start.split(" ");
  const m = zeitMin(t) + min;
  return `${plusTage(d, Math.floor(m / 1440))} ${minZeit(m % 1440)}`;
}

/** Mo–Sa einer Woche ab Montag. */
export function wochenTageMoSa(montag) {
  return Array.from({ length: 6 }, (_, i) => plusTage(montag, i));
}

/**
 * Freie Startzeiten je Tag.
 * @returns {Array<{tag:string, zeiten:string[]}>}
 */
export function freieZeiten({ tage, belegt = [], dauer = 60, schritt = 30, oeffnung = { von: "08:00", bis: "19:00" }, jetzt = null }) {
  const von = zeitMin(oeffnung.von);
  const bis = zeitMin(oeffnung.bis);
  const jetztText = jetzt ? `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-${String(jetzt.getDate()).padStart(2, "0")} ${minZeit(jetzt.getHours() * 60 + jetzt.getMinutes())}` : null;
  return tage
    .filter((t) => wochentag(t) < 6)
    .map((tag) => {
      const zeiten = [];
      for (let m = von; m + dauer <= bis; m += schritt) {
        const s = `${tag} ${minZeit(m)}`;
        const e = `${tag} ${minZeit(m + dauer)}`;
        if (jetztText && s <= jetztText) continue;
        if (belegt.some((b) => b.start < e && b.ende > s)) continue;
        zeiten.push(minZeit(m));
      }
      return { tag, zeiten };
    });
}

export const hatFreieZeit = (liste) => liste.some((t) => t.zeiten.length > 0);
