// Lesende Datenschicht des Bereichs Service (Server Components). Je Seite wenige Frappe-Aufrufe
// (Liste ≤ 3, Akte ≤ 4, 10-konzept-service §14.7); Mock und Frappe über dieselben Client-Methoden bzw. dienst.js.
import "server-only";

import { darf } from "../auth/rechte.js";
import { isoDatum } from "../format.js";
import { wochenStart, verschiebe } from "../datum.js";
import { akte as akteLaden, istMock, naechsteSchritte, sichereServiceSeed, slots as slotsLaden } from "./dienst.js";
import { backoffice } from "../frappe/index.js";
import { EINSATZ_OFFEN, OFFEN } from "./labels.js";
import { eskalationsstufe, gewaehrleistungEndetBald, maengelanzeigeOffen, reaktionUeberfaellig, regressFristKritisch } from "./regeln.js";
import { normalisiereTelefon, istTelefon } from "./telefon.js";
import { tageBis } from "./fristen.js";
import { personName } from "./anzeige.js";

export const EINSTELLUNGEN_STANDARD = Object.freeze({
  gewaehrleistung_monate: 24, verjaehrung_monate: 3, fristwarnung_tage: 60, vermutung_verbraucher_monate: 12, vermutung_unternehmer_monate: 6, regress_monate: 2,
  reaktion_werktage: 2, eskalation_tage: 5, kulanz_schwelle_cent: 50000, standard_prioritaet: "Normal", einsatz_takt_min: 15, einsatz_puffer_min: 30,
  techniker_tag_von: "08:00:00", techniker_tag_bis: "17:00:00", regress_toleranz_cent: 100, telefon_ist_erstreaktion: 1, erinnerung_tage_vorher: 42,
});

/** Client der Sitzung; im Mock einmalig mit Service-Seed (siehe mock.sichereServiceSeed). */
export function serviceClient(session) {
  const client = backoffice(session);
  sichereServiceSeed(client);
  return client;
}

/** Rollen-Sicht des Bereichs. */
export function sicht(session) {
  const r = session?.roles || [];
  const leitung = darf(session, "service", "cancel");
  const gf = r.includes("PH Geschäftsführung") || r.includes("PH Geschaeftsfuehrung");
  const techniker = r.includes("PH Techniker") && !r.some((x) => /^PH Service /.test(x)) && !leitung;
  return { leitung, gf, techniker, mitarbeiter: darf(session, "service", "write") && !techniker, schreiben: darf(session, "service", "write"), kosten: leitung || gf, export: darf(session, "service", "export") };
}

export async function ladeEinstellungen(client) {
  try {
    const d = await client.getDoc("PH Service Einstellungen", "PH Service Einstellungen");
    return { ...EINSTELLUNGEN_STANDARD, ...Object.fromEntries(Object.entries(d || {}).filter(([, v]) => v !== "" && v !== null && v !== undefined)) };
  } catch {
    return { ...EINSTELLUNGEN_STANDARD };
  }
}

/** E-Mail → Name (Benutzer); Mock aus der User-Tabelle, Frappe per get_list. */
export async function personen(client) {
  if (istMock(client)) {
    return Object.fromEntries([...client.tabelle("User").values()].map((u) => [u.name, u.full_name || u.name]));
  }
  try {
    const liste = await client.getList("User", { fields: ["name", "full_name"], filters: [["enabled", "=", 1], ["user_type", "=", "System User"]], limit: 500 });
    return Object.fromEntries(liste.map((u) => [u.name, u.full_name || u.name]));
  } catch {
    return {};
  }
}

/** Techniker = Benutzer mit Rolle PH Techniker. */
export async function technikerListe(client) {
  if (istMock(client)) {
    return [...client.tabelle("User").values()].filter((u) => Number(u.enabled ?? 1) && (u.roles || []).some((r) => r.role === "PH Techniker")).map((u) => ({ email: u.name, name: u.full_name || u.name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  try {
    const rollen = await client.getList("Has Role", { fields: ["parent"], filters: [["role", "=", "PH Techniker"], ["parenttype", "=", "User"]], limit: 200 });
    const p = await personen(client);
    return [...new Set(rollen.map((r) => r.parent))].filter((u) => u !== "Administrator" && u !== "Guest").map((email) => ({ email, name: p[email] || email })).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export const FALL_FELDER = ["name", "titel", "status", "art", "prioritaet", "kunde_name", "kontakt", "kunde_email", "kunde_telefon", "produkt_name", "marke", "lieferant", "fehlercode", "fehlercode_bezeichnung", "fehlerbereich", "verantwortlich", "gemeldet_am", "frist_reaktion", "frist_loesung", "erstreaktion_am", "gewaehrleistung_bis", "beweislast_bis", "erstauftreten", "kundentyp", "sla_status", "sla_reaktion_verletzt", "sla_loesung_verletzt", "eskalationsstufe", "sla_eskalationsstufe", "quelle", "kanal", "entscheidung", "kulanz_freigabe_status", "kulanz_cent", "lieferantenrelevant", "mangel_bestaetigt", "kunde_informiert_am", "abnahme_bestaetigt", "regress_frist_bis", "regress_status", "regress_gefordert_cent", "letzte_bewegung", "einsatz_ort", "portal_sichtbar", "seriennummer", "erledigt_am", "dauer_tage", "modified"];

/** Bild je Fall (erstes Foto) – Mock aus der Kindtabelle; Frappe über PH Servicefall Foto. */
async function bilder(client, names) {
  if (!names.length) return {};
  if (istMock(client)) {
    const t = client.tabelle("PH Servicefall");
    return Object.fromEntries(names.map((n) => [n, t.get(n)?.fotos?.find((f) => f.medientyp !== "Video" && f.medientyp !== "PDF")?.bild || null]));
  }
  try {
    const liste = await client.getList("PH Servicefall Foto", { fields: ["parent", "bild"], filters: [["parent", "in", names], ["parenttype", "=", "PH Servicefall"]], limit: names.length * 3 });
    const out = {};
    for (const f of liste) out[f.parent] ||= f.bild;
    return out;
  } catch {
    return {};
  }
}

/** Reiter der Fall-Liste → Frappe-Filter. */
export function reiterFilter(reiter, { user, heute = isoDatum(), warnTage = 60 } = {}) {
  const offen = ["status", "in", OFFEN];
  switch (reiter) {
    case "meine":
      return [["verantwortlich", "=", user], offen];
    case "neu":
      return [["quelle", "in", ["portal", "website"]], ["erstreaktion_am", "is", "not set"], offen];
    case "reaktion":
      return [["status", "=", "Gemeldet"], ["erstreaktion_am", "is", "not set"], ["frist_reaktion", "<", heute]];
    case "gewaehrleistung":
      return [offen, ["gewaehrleistung_bis", ">=", heute], ["gewaehrleistung_bis", "<=", isoDatum(verschiebeTage(heute, warnTage))]];
    case "eskaliert":
      return [offen];
    case "erledigt":
      return [["status", "in", ["Erledigt", "Geschlossen", "Abgelehnt"]]];
    default:
      return [];
  }
}

function verschiebeTage(isoText, n) {
  return verschiebe(isoText, { tage: n });
}

/**
 * Fall-Liste mit nächstem Schritt (≤ 3 Aufrufe: Liste, Zähler, get_next_steps).
 * @param {object} client
 * @param {{reiter?:string, q?:string, status?:string, art?:string, seite?:number, groesse?:number}} p
 */
export async function ladeFaelle(client, session, p = {}) {
  const heute = isoDatum();
  const einst = await ladeEinstellungen(client);
  const filters = [...reiterFilter(p.reiter, { user: session.user, heute, warnTage: Number(einst.fristwarnung_tage) || 60 })];
  if (p.status) filters.push(["status", "in", String(p.status).split(",")]);
  if (p.art) filters.push(["art", "=", p.art]);
  if (p.verantwortlich) filters.push(["verantwortlich", "=", p.verantwortlich]);
  const q = String(p.q || "").trim();
  let orFilters;
  if (q) {
    if (istTelefon(q)) orFilters = [["kunde_telefon", "like", `%${normalisiereTelefon(q).slice(-6)}%`]];
    else orFilters = ["kunde_name", "produkt_name", "marke", "fehlercode", "seriennummer", "name", "referenz_website", "titel"].map((f) => [f, "like", `%${q}%`]);
  }
  const groesse = Math.min(100, Math.max(10, Number(p.groesse) || 50));
  const seite = Math.max(1, Number(p.seite) || 1);
  let [zeilen, gesamt] = await Promise.all([
    client.getList("PH Servicefall", { fields: FALL_FELDER, filters, orFilters, orderBy: "frist_reaktion asc, frist_loesung asc, gemeldet_am desc", limit: p.reiter === "eskaliert" ? 500 : groesse, start: p.reiter === "eskaliert" ? 0 : (seite - 1) * groesse }),
    client.count("PH Servicefall", { filters, orFilters }),
  ]);
  if (istTelefon(q) && istMock(client)) zeilen = zeilen.filter((z) => normalisiereTelefon(z.kunde_telefon).includes(normalisiereTelefon(q).slice(-6)));
  if (p.reiter === "eskaliert") {
    zeilen = zeilen.filter((z) => eskalationsstufe(z) > 0);
    gesamt = zeilen.length;
  }
  const [schritte, bild] = await Promise.all([naechsteSchritte(client, zeilen.map((z) => z.name)), bilder(client, zeilen.map((z) => z.name))]);
  zeilen = zeilen.map((z) => ({ ...z, schritt: schritte[z.name] || null, bild: bild[z.name] || null }));
  zeilen.sort((a, b) => (a.schritt?.rang ?? 99999) - (b.schritt?.rang ?? 99999));
  return { zeilen, gesamt, seite, groesse, einst };
}

/** Zähler „Reaktion überfällig“ (für Reiter und Navigation). */
export async function zaehleReaktion(client, heute = isoDatum()) {
  try {
    return await client.count("PH Servicefall", { filters: reiterFilter("reaktion", { heute }) });
  } catch {
    return 0;
  }
}

/** Bereichsstart: Heute-Leiste, Kennzahlen, Jetzt dran, Listen, Charts (jede Quelle fängt ihre Fehler). */
export async function ladeStart(client, session) {
  const heute = isoDatum();
  const s = sicht(session);
  const einst = await ladeEinstellungen(client);
  const sicher = async (fn, ersatz) => {
    try {
      return await fn();
    } catch {
      return ersatz;
    }
  };
  const wStart = wochenStart(heute);
  const wEnde = verschiebe(wStart, { tage: 6 });
  const [offeneFaelle, alleAnzahl, einsaetzeWoche, regresse, teile, pflege, bestellungen] = await Promise.all([
    sicher(() => client.getList("PH Servicefall", { fields: [...FALL_FELDER, "verlauf"].filter((f) => f !== "verlauf"), filters: [["status", "in", OFFEN]], orderBy: "frist_reaktion asc", limit: 200 }), null),
    sicher(() => client.count("PH Servicefall", {}), null),
    sicher(() => client.getList("PH Serviceeinsatz", { fields: ["name", "titel", "status", "art", "datum", "zeit_von", "zeit_bis", "techniker", "kunde_name", "ort", "servicefall", "bestaetigt_kunde_am", "umgeplant_am"], filters: [["datum", "between", [wStart, wEnde]], ["status", "!=", "Abgebrochen"]], orderBy: "datum asc, zeit_von asc", limit: 200 }), null),
    sicher(() => client.getList("PH Lieferantenregress", { fields: ["name", "status", "frist_bis", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "servicefall", "abgleich_status"], filters: [["status", "in", ["Offen", "Gemeldet", "Anerkannt"]]], limit: 200 }), null),
    sicher(() => client.getList("PH Ersatzteil", { fields: ["name", "bestand_fuehren", "verfuegbar", "mindestbestand", "produkt", "kategorie"], filters: [["status", "!=", "Inaktiv"]], limit: 500 }), null),
    sicher(() => client.getList("PH Pflege Abo", { fields: ["name", "status", "ueberfaellig"], filters: [["status", "=", "Aktiv"], ["ueberfaellig", "=", 1]], limit: 200 }), null),
    sicher(() => client.getList("PH Ersatzteilbestellung", { fields: ["name", "erwartet_am", "status"], filters: [["erwartet_am", "between", [wStart, wEnde]], ["status", "in", ["Gesendet", "Bestaetigt", "Teilgeliefert"]]], limit: 100 }), null),
  ]);
  const faelle = offeneFaelle || [];
  const [schritte, bild] = await Promise.all([sicher(() => naechsteSchritte(client, faelle.map((f) => f.name)), {}), sicher(() => bilder(client, faelle.map((f) => f.name)), {})]);
  const p = await personen(client);
  const eigene = (e) => !s.techniker || e.techniker === session.user;
  const regressNachFall = new Map((regresse || []).map((r) => [r.servicefall, r]));
  const heuteEinsaetze = (einsaetzeWoche || []).filter((e) => e.datum === heute && eigene(e)).map((e) => ({ ...e, technikerName: personName(e.techniker, p) }));
  const unterMindest = (teile || []).filter((t) => Number(t.bestand_fuehren) && !t.produkt && t.kategorie !== "Pflegemittel" && Number(t.verfuegbar) < Number(t.mindestbestand)).length;
  const regressOffen = (regresse || []).reduce((sum, r) => sum + (r.status === "Anerkannt" ? Math.max(0, (Number(r.betrag_anerkannt_cent) || 0) - (Number(r.betrag_erhalten_cent) || 0)) : Number(r.betrag_gefordert_cent) || 0), 0);
  const jetztDran = faelle
    .map((f) => ({ ...f, schritt: schritte[f.name] || null, bild: bild[f.name] || null, verantwortlichName: personName(f.verantwortlich, p) }))
    .filter((f) => f.schritt?.aktion)
    .sort((a, b) => (a.schritt.rang ?? 99999) - (b.schritt.rang ?? 99999));

  const erledigt90 = await sicher(() => client.getList("PH Servicefall", { fields: ["name", "dauer_tage"], filters: [["status", "in", ["Erledigt", "Geschlossen"]], ["erledigt_am", ">=", verschiebe(heute, { tage: -90 })]], limit: 500 }), []);
  const mitDauer = erledigt90.filter((f) => Number(f.dauer_tage) > 0);
  const durchlauf = mitDauer.length ? Math.round(mitDauer.reduce((a, f) => a + Number(f.dauer_tage), 0) / mitDauer.length) : null;

  let charts = null;
  if (s.leitung || s.gf) {
    const alle = await sicher(() => client.getList("PH Servicefall", { fields: ["name", "gemeldet_am", "art", "fehlerbereich", "status"], filters: [["gemeldet_am", ">=", verschiebe(heute, { monate: -11 }).slice(0, 8) + "01"]], limit: 2000 }), []);
    const monate = Array.from({ length: 12 }, (_, i) => verschiebe(heute.slice(0, 8) + "01", { monate: i - 11 }).slice(0, 7));
    const kurz = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    const jeMonat = monate.map((m) => ({ label: kurz[Number(m.slice(5, 7)) - 1], wert: alle.filter((f) => String(f.gemeldet_am).slice(0, 7) === m).length }));
    const zaehl = (k) => Object.entries(alle.reduce((acc, f) => ((acc[f[k] || "Ohne Code"] = (acc[f[k] || "Ohne Code"] || 0) + 1), acc), {})).map(([label, wert]) => ({ label, wert })).sort((a, b) => b.wert - a.wert);
    charts = { jeMonat, nachArt: zaehl("art"), nachBereich: zaehl("fehlerbereich").slice(0, 8) };
  }

  return {
    sicht: s,
    einst,
    nieFaelle: alleAnzahl === 0,
    fehler: { faelle: offeneFaelle === null, einsaetze: einsaetzeWoche === null },
    heute: {
      reaktion: faelle.filter((f) => reaktionUeberfaellig(f, heute)).length,
      maengelanzeige: faelle.filter((f) => maengelanzeigeOffen(f, { regresse: regressNachFall.has(f.name) ? [regressNachFall.get(f.name)] : [], verlauf: [] })).length,
      regressfrist: (regresse || []).filter((r) => regressFristKritisch(r, heute)).length,
      kulanz: s.leitung ? faelle.filter((f) => f.kulanz_freigabe_status === "Angefordert").length : 0,
      wartung: (pflege || []).length,
    },
    kennzahlen: {
      offen: offeneFaelle ? faelle.length : null,
      gewaehrleistung60: faelle.filter((f) => gewaehrleistungEndetBald(f, Number(einst.fristwarnung_tage) || 60, heute)).length,
      einsaetzeWoche: einsaetzeWoche ? einsaetzeWoche.filter(eigene).length : null,
      regressOffen: regresse ? regressOffen : null,
      unterMindest: teile ? unterMindest : null,
      unbestaetigt: (einsaetzeWoche || []).filter((e) => e.status === "Geplant" && !e.bestaetigt_kunde_am && e.datum >= heute).length,
      erwartet: bestellungen ? bestellungen.length : null,
      durchlauf,
      durchlaufBasis: mitDauer.length,
    },
    jetztDran,
    einsaetzeHeute: heuteEinsaetze,
    gewaehrleistung14: faelle.filter((f) => gewaehrleistungEndetBald(f, 14, heute)).map((f) => ({ name: f.name, kunde_name: f.kunde_name, titel: f.titel, gewaehrleistung_bis: f.gewaehrleistung_bis, tage: tageBis(f.gewaehrleistung_bis, heute) })),
    charts,
    regresse: regresse || [],
  };
}

/** Akte eines Falls: Aggregat + Verlauf/Kommentare + Fehlercode-Wissen + Personen (≤ 4 Aufrufe). */
export async function ladeAkte(client, session, name) {
  const s = sicht(session);
  const [daten, info, p, einst] = await Promise.all([akteLaden(client, name, { kostenSichtbar: s.kosten }), client.docinfo ? client.docinfo("PH Servicefall", name).catch(() => ({})) : client.getDocMitInfo("PH Servicefall", name).then((r) => r.docinfo).catch(() => ({})), personen(client), ladeEinstellungen(client)]);
  let code = null;
  if (daten?.fall?.fehlercode) {
    try {
      code = await client.getDoc("PH Fehlercode", daten.fall.fehlercode);
    } catch {
      code = null;
    }
  }
  return { ...daten, docinfo: info || {}, personen: p, code, einst, sicht: s };
}

/** Fehlerkatalog (aktive Codes; Bereiche). */
export async function ladeKatalog(client, { inaktive = false } = {}) {
  const [bereiche, codes] = await Promise.all([
    client.getList("PH Fehlerbereich", { fields: ["name", "code", "bezeichnung", "aktiv", "sortierung", "beschreibung"], orderBy: "sortierung asc", limit: 200 }),
    client.getList("PH Fehlercode", { fields: ["name", "code", "bereich", "bezeichnung", "gruppe", "lieferantenrelevant", "aktiv", "standardloesung", "pruefhinweis", "typische_ursache", "kundentext", "standard_entscheidung", "anzahl_faelle", "sortierung"], filters: inaktive ? [] : [["aktiv", "=", 1]], orderBy: "sortierung asc", limit: 1000 }),
  ]);
  return { bereiche: bereiche.filter((b) => inaktive || Number(b.aktiv ?? 1)), codes };
}

/** Einsätze eines Zeitraums (+ Techniker). */
export async function ladeEinsaetze(client, { von, bis, filter = [] } = {}) {
  const [einsaetze, techniker] = await Promise.all([
    client.getList("PH Serviceeinsatz", { fields: ["name", "titel", "status", "art", "datum", "zeit_von", "zeit_bis", "techniker", "techniker_2", "kunde_name", "ort", "plz", "strasse", "servicefall", "pflege_abo", "bestaetigt_kunde_am", "umgeplant_am", "ergebnis", "folgeeinsatz_noetig", "folgeeinsatz"], filters: [...(von && bis ? [["datum", "between", [von, bis]]] : []), ...filter], orderBy: "datum asc, zeit_von asc", limit: 500 }),
    technikerListe(client),
  ]);
  return { einsaetze, techniker };
}

/** Freie Fenster je Tag (parallel, ein Aufruf je Tag). */
export async function ladeSlots(client, { tage, dauer = 60, techniker = null }) {
  const liste = await Promise.all(tage.map((datum) => slotsLaden(client, { datum, dauer_min: dauer, techniker }).catch(() => ({ datum, techniker: {} }))));
  return Object.fromEntries(liste.map((x, i) => [tage[i], x.techniker || {}]));
}

export { EINSATZ_OFFEN };
