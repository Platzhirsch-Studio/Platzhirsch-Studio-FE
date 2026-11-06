import "server-only";
// Daten für das Sheet „Montage planen“ und die Personenauswahl (10-konzept-projekte.md § 6.2).

import { DEMO_BENUTZER } from "@/lib/backoffice/auth/mockUsers";
import { ladeEinstellungen, ladeMontagen, personen } from "./lesen.js";
import { kapazitaet, leistungenAusPositionen } from "./montage.js";

const sicher = async (fn, ersatz) => {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
};

// ------------------------------------------------------------------ Montage planen (Sheet-Daten) --

/** Monteure/Teams zur Auswahl: Montageleiter, Monteure der Projekte und Mitglieder bisheriger Montagen. */
export async function montagePersonen(client) {
  const montagen = await sicher(() => client.getList("PH Montageauftrag", { fields: ["montageleiter"], limit: 300 }), []);
  const users = new Set(montagen.map((m) => m.montageleiter).filter(Boolean));
  if (client.modus !== "frappe") for (const u of DEMO_BENUTZER) if (u.roles.includes("PH Montage") || u.roles.includes("PH Techniker")) users.add(u.email);
  const p = await personen(client, [...users]);
  return Object.values(p).map((x) => ({ user: x.email, name: x.name }));
}

/** Daten für das Sheet „Montage planen“ (§ 6.2): zehn Werktage ab morgen mit Kapazität je Tag. */
export async function planenDaten(client, m, { heute }) {
  const einst = await ladeEinstellungen(client);
  const tage = [];
  const d = new Date(`${heute}T12:00:00`);
  while (tage.length < 10) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) tage.push(d.toISOString().slice(0, 10));
  }
  const montagen = await ladeMontagen(client, { von: tage[0], bis: tage[tage.length - 1] });
  const kap = kapazitaet(montagen, tage, { monteure: 2, tagesstunden: Number(einst.montage_tagesstunden) || 8 });
  const { montierbar, fehlend } = leistungenAusPositionen(m.positionen || []);
  const leute = await montagePersonen(client);
  const vorschlag = [m.projekt.montageleiter, ...(m.team || []).filter((t) => t.rolle === "Monteur").map((t) => t.user)].filter((u, i, a) => u && a.indexOf(u) === i && leute.some((l) => l.user === u));
  const ab = (m.auftraege || [])[0];
  return {
    projekt: { name: m.projekt.name, titel: m.projekt.titel, objekt_land: m.projekt.objekt_land },
    tage: kap,
    leute,
    vorschlag,
    leistungen: { anzahl: montierbar.length, stunden: 0, fehlen: fehlend.length },
    fagg: !!(ab?.fagg_frist_ende && String(ab.fagg_frist_ende).slice(0, 10) >= heute),
    unterlagen: [...(m.planungen || []).filter((p) => p.status === "Freigegeben").map((p) => `${p.bezeichnung} v${p.version}`), ...(m.renderings || []).filter((r) => r.status === "Freigegeben").map((r) => `Rendering ${r.variante} v${r.version}`)],
  };
}
