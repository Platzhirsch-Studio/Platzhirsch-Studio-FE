// Einstellungs-Dienste der Zentrale, die über Server-Methoden der Fach-Apps laufen – je mit Mock-Pfad (Q-A3):
//   Kalkulation   ph_projekte.api.kalkulation_einstellungen() / kalkulation_einstellungen_speichern(...)
//                 Mock: Single „PH Projekte Einstellungen“ (gleiche Kindtabellen) über getDoc/save
//   Microsoft     ph_microsoft.api.status() (nur GF/Admin/System Manager) + Single „PH Microsoft Einstellungen“
//   Ablage        Single „PH Ablage Einstellungen“ (ph_ablage)
// Signaturen und Felder exakt aus Backend-Import (04.11.2026). Reines Modul (Client wird übergeben).

import { BackofficeError } from "../frappe/errors.js";

export const KALK_SPALTEN = {
  kostensaetze: ["taetigkeit", "rolle", "mitarbeiter", "satz_cent", "gueltig_ab", "platzhalter", "notiz"],
  ziel_db: ["projektart", "ziel_db1", "ziel_db2", "ziel_db3", "ampel_gelb_unter", "ampel_rot_unter", "budget_gelb", "budget_rot", "gueltig_ab", "notiz"],
  gemeinkosten: ["projektart", "art", "prozent", "betrag_je_stunde_cent", "gueltig_ab", "notiz"],
};
export const KALK_SCHWELLEN = ["budget_gelb_prozent", "budget_rot_prozent", "ampel_gelb_unter", "ampel_rot_unter", "abweichung_kommentar_prozent", "kalkulation_warnung_aktiv", "budget_bei_auftrag_vorbelegen"];
export const TAETIGKEITEN = ["Montage", "Fahrt", "Planung", "Beratung", "Projektleitung", "Aufmass", "Service", "Koordination", "Buero", "Sonstiges", "Alle"];
export const PROJEKTARTEN = ["Alle", "Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Yacht", "Outdoor", "Sonstiges"];
export const ZUSCHLAG_ARTEN = ["Aus", "Prozent auf Wareneinsatz", "Prozent auf Gesamtkosten", "Prozent auf Erloes", "Betrag je Projektstunde"];
/** Wer Kalkulation pflegt (ph_projekte.api.kalkulation.SCHREIBEN). */
export const KALK_SCHREIBEN = ["PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"];

export function darfKalkulation(session) {
  return (session?.roles || []).some((r) => KALK_SCHREIBEN.includes(r));
}

function zeilen(liste, spalten) {
  return (Array.isArray(liste) ? liste : []).map((z) => Object.fromEntries(spalten.map((k) => [k, z?.[k] ?? (k === "platzhalter" ? 0 : null)])));
}

/** Kalkulationseinstellungen laden → { kostensaetze, ziel_db, gemeinkosten, schwellen, projektarten, taetigkeiten, zuschlag_arten, eingerichtet } */
export async function kalkulationLaden(client) {
  if (client.modus === "frappe") return client.call("ph_projekte.api.kalkulation_einstellungen", {});
  const e = await client.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen");
  const k = zeilen(e.kostensaetze, KALK_SPALTEN.kostensaetze);
  const z = zeilen(e.ziel_db, KALK_SPALTEN.ziel_db);
  const g = zeilen(e.gemeinkosten_regeln, KALK_SPALTEN.gemeinkosten);
  return {
    kostensaetze: k,
    ziel_db: z,
    gemeinkosten: g,
    schwellen: Object.fromEntries(KALK_SCHWELLEN.map((f) => [f, e[f] ?? null])),
    projektarten: PROJEKTARTEN,
    taetigkeiten: TAETIGKEITEN,
    zuschlag_arten: ZUSCHLAG_ARTEN,
    eingerichtet: k.length > 0 && z.length > 0,
  };
}

/**
 * Prüfung wie ph_projekte.utils.kalkulation.einstellungen_pruefen (Kern): Pflicht-Gültigkeit, keine doppelte
 * Gültigkeit je Schlüssel, Prozente 0–100, gelb ≤ rot. Rückgabe: Liste deutscher Fehlertexte.
 */
export function pruefeKalkulation({ kostensaetze = [], ziel_db = [], gemeinkosten = [], schwellen = {} } = {}) {
  const fehler = [];
  const doppelt = (liste, schluessel, titel) => {
    const gesehen = new Set();
    liste.forEach((z, i) => {
      if (!z.gueltig_ab) fehler.push(`${titel}, Zeile ${i + 1}: Gültig ab fehlt.`);
      const k = `${schluessel(z)}::${z.gueltig_ab}`;
      if (gesehen.has(k)) fehler.push(`${titel}, Zeile ${i + 1}: Gleiche Gültigkeit doppelt.`);
      gesehen.add(k);
    });
  };
  doppelt(kostensaetze, (z) => `${z.taetigkeit}|${z.rolle || ""}|${z.mitarbeiter || ""}`, "Kostensätze");
  doppelt(ziel_db, (z) => z.projektart || "Alle", "Ziel-DB");
  doppelt(gemeinkosten, (z) => z.projektart || "Alle", "Gemeinkosten");
  kostensaetze.forEach((z, i) => {
    if (!z.taetigkeit) fehler.push(`Kostensätze, Zeile ${i + 1}: Tätigkeit fehlt.`);
    if (z.satz_cent !== null && z.satz_cent !== "" && (!Number.isInteger(Number(z.satz_cent)) || Number(z.satz_cent) < 0)) fehler.push(`Kostensätze, Zeile ${i + 1}: Satz ungültig.`);
  });
  const prozent = (v) => v === null || v === "" || v === undefined || (Number(v) >= 0 && Number(v) <= 100);
  ziel_db.forEach((z, i) => {
    for (const f of ["ziel_db1", "ziel_db2", "ziel_db3", "budget_gelb", "budget_rot"]) if (!prozent(z[f])) fehler.push(`Ziel-DB, Zeile ${i + 1}: Prozentwert außerhalb 0–100.`);
    if (z.ampel_gelb_unter !== null && z.ampel_rot_unter !== null && z.ampel_gelb_unter !== "" && z.ampel_rot_unter !== "" && Number(z.ampel_gelb_unter) > Number(z.ampel_rot_unter)) fehler.push(`Ziel-DB, Zeile ${i + 1}: Gelb muss vor Rot liegen.`);
  });
  gemeinkosten.forEach((z, i) => {
    if (!ZUSCHLAG_ARTEN.includes(z.art)) fehler.push(`Gemeinkosten, Zeile ${i + 1}: Zuschlagsart fehlt.`);
    if (!prozent(z.prozent)) fehler.push(`Gemeinkosten, Zeile ${i + 1}: Prozent außerhalb 0–100.`);
  });
  const s = schwellen || {};
  if (!prozent(s.budget_gelb_prozent) && Number(s.budget_gelb_prozent) > 200) fehler.push("Schwellen: Budget gelb ungültig.");
  if (s.budget_gelb_prozent !== undefined && s.budget_rot_prozent !== undefined && Number(s.budget_gelb_prozent) > Number(s.budget_rot_prozent)) fehler.push("Schwellen: Budget gelb muss unter rot liegen.");
  if (s.ampel_gelb_unter !== undefined && s.ampel_rot_unter !== undefined && Number(s.ampel_gelb_unter) > Number(s.ampel_rot_unter)) fehler.push("Schwellen: DB gelb muss vor rot liegen.");
  return fehler;
}

/** Speichern: Frappe-Methode bzw. Mock-Single. Nur übergebene Teile werden ersetzt (wie der Server). */
export async function kalkulationSpeichern(client, { kostensaetze, ziel_db, gemeinkosten, schwellen, begruendung } = {}) {
  const fehler = pruefeKalkulation({ kostensaetze: kostensaetze || [], ziel_db: ziel_db || [], gemeinkosten: gemeinkosten || [], schwellen: schwellen || {} });
  if (fehler.length) throw new BackofficeError("invalid", fehler.join(" "));
  if (client.modus === "frappe") {
    const args = {};
    if (kostensaetze) args.kostensaetze = JSON.stringify(zeilen(kostensaetze, KALK_SPALTEN.kostensaetze));
    if (ziel_db) args.ziel_db = JSON.stringify(zeilen(ziel_db, KALK_SPALTEN.ziel_db));
    if (gemeinkosten) args.gemeinkosten = JSON.stringify(zeilen(gemeinkosten, KALK_SPALTEN.gemeinkosten));
    if (schwellen) args.schwellen = JSON.stringify(Object.fromEntries(Object.entries(schwellen).filter(([k]) => KALK_SCHWELLEN.includes(k))));
    if (begruendung) args.begruendung = String(begruendung).slice(0, 500);
    return client.call("ph_projekte.api.kalkulation_einstellungen_speichern", args);
  }
  const werte = {};
  if (kostensaetze) werte.kostensaetze = zeilen(kostensaetze, KALK_SPALTEN.kostensaetze);
  if (ziel_db) werte.ziel_db = zeilen(ziel_db, KALK_SPALTEN.ziel_db);
  if (gemeinkosten) werte.gemeinkosten_regeln = zeilen(gemeinkosten, KALK_SPALTEN.gemeinkosten);
  if (schwellen) for (const k of KALK_SCHWELLEN) if (k in schwellen) werte[k] = schwellen[k];
  if (Object.keys(werte).length) await client.save("PH Projekte Einstellungen", werte);
  return kalkulationLaden(client);
}

/** Status-Schlüssel von ph_microsoft.api.status() (für Parität und Anzeige). */
export const MS_STATUS_SCHLUESSEL = ["konfiguriert", "sso_aktiv", "letzte_mail_sync", "letzte_kalender_sync", "letzte_abo_pruefung", "fehler_24h", "konflikte_24h", "abos_aktiv", "abos_laufen_ab_24h", "abos_gestoert", "postfaecher_aktiv", "postfaecher_fehler", "kalender_aktiv"];

/** Microsoft-Status: Frappe ph_microsoft.api.status(); Mock aus dem Single (keine Verbindung eingerichtet). */
export async function microsoftStatus(client) {
  if (client.modus === "frappe") {
    const r = await client.call("ph_microsoft.api.status", {});
    return r?.message ?? r;
  }
  const e = await client.getDoc("PH Microsoft Einstellungen", "PH Microsoft Einstellungen");
  return {
    konfiguriert: false,
    sso_aktiv: Number(e.sso_aktiv) || 0,
    letzte_mail_sync: e.letzte_mail_sync || "",
    letzte_kalender_sync: e.letzte_kalender_sync || "",
    letzte_abo_pruefung: e.letzte_abo_pruefung || "",
    fehler_24h: 0,
    konflikte_24h: 0,
    abos_aktiv: 0,
    abos_laufen_ab_24h: 0,
    abos_gestoert: 0,
    postfaecher_aktiv: 0,
    postfaecher_fehler: 0,
    kalender_aktiv: 0,
  };
}

/** Wer den Microsoft-Status sehen darf (status() prüft dieselben Rollen). */
export function darfMicrosoftStatus(session) {
  return (session?.roles || []).some((r) => ["System Manager", "PH Backoffice-Admin", "PH Geschäftsführung"].includes(r));
}
