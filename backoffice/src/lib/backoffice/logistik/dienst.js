// Dienst-Schicht Logistik: jede Mutation mit Frappe-Pfad (Methoden der App ph_logistik, Signaturen exakt aus
// Backend-Import) und Mock-Pfad (MASTER § 5.3 Nr. 5). Der Mock bildet die Server-Methode nach (Status, Felder,
// Bewegungen, Aufgaben, Kommentare) – so bleiben Oberfläche und Tests im Mock vollständig.
// Rechte und Fachregeln prüft die Server Action davor (actions.js); hier nur, was die App selbst prüft.
// Reines Modul (nur relative Importe), damit Unit-Tests und Commit-Aktionen es ohne Next laden.

import { BackofficeError } from "../frappe/errors.js";
import { neuerName } from "../mock/engine.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { findePosition, mengePruefen, posId, setzeMenge, verpackenPruefen } from "./packen.js";
import { bewertungsZeilen, differenz, plaetzeVorschlagen, platzListe, platzliste } from "./inventur.js";

const APP = "ph_logistik.ph_logistik";
export const M = Object.freeze({
  offene: `${APP}.packtisch.offene`,
  statistik: `${APP}.packtisch.statistik`,
  lsAusBestellung: `${APP}.packtisch.lieferschein_aus_bestellung`,
  packansicht: `${APP}.packtisch.packansicht`,
  packansichtZusatz: `${APP}.packtisch_ablauf.packansicht_zusatz`,
  vorgangScannen: `${APP}.packtisch_ablauf.vorgang_scannen`,
  scanMenge: `${APP}.packtisch_ablauf.scan_menge`,
  handBestaetigen: `${APP}.packtisch_ablauf.hand_bestaetigen`,
  paketeMitInhalt: `${APP}.packtisch_ablauf.pakete_mit_inhalt`,
  hinweiseBestaetigen: `${APP}.packtisch_ablauf.packhinweise_bestaetigen`,
  zurueckstellen: `${APP}.packtisch_ablauf.zurueckstellen`,
  fortsetzen: `${APP}.packtisch_ablauf.fortsetzen`,
  teillieferung: `${APP}.packtisch_ablauf.teillieferung_aus_gescannten`,
  verpacken: `${APP}.packtisch_ablauf.verpacken`,
  positionenSetzen: `${APP}.packtisch.positionen_setzen`,
  positionMinus: `${APP}.packtisch.position_minus`,
  paketeVorschlagen: `${APP}.packtisch.pakete_vorschlagen`,
  alsGepackt: `${APP}.packtisch.als_gepackt`,
  tarife: `${APP}.packtisch.tarife`,
  etikett: `${APP}.packtisch.etikett_erzeugen`,
  abholung: `${APP}.packtisch.abholung_buchen`,
  problem: `${APP}.packtisch.problem_melden`,
  lsAusAuftrag: "ph_logistik.api.lieferschein_aus_auftrag",
  lsAusBestellungApi: "ph_logistik.api.lieferschein_aus_bestellung",
  lsAusKommission: `${APP}.lager.lieferschein_aus_kommission`,
  kommissionsliste: `${APP}.lager.kommissionsliste`,
  platzScan: `${APP}.lager.platz_scan`,
  umlagernScan: `${APP}.lager.umlagern_scan`,
  tracking: `${APP}.tasks.tracking_aktualisieren`,
  plantafel: `${APP}.doctype.ph_tour.ph_tour.plantafel`,
  tourStarten: `${APP}.tour_mobil.starten`,
  tourAbschliessen: `${APP}.tour_mobil.abschliessen`,
  stoppStatus: `${APP}.tour_mobil.stopp_status`,
  meineTouren: `${APP}.tour_mobil.meine_touren`,
  invScan: `${APP}.inventur_mobil.scan`,
  invZaehlen: `${APP}.inventur_mobil.zaehlen`,
  invZaehlenPlus: `${APP}.inventur_mobil.zaehlen_plus`,
  invFund: `${APP}.inventur_mobil.fund`,
  invStarten: `${APP}.inventur_mobil.starten`,
  teilinventur: `${APP}.inventur_plan.teilinventur_anlegen`,
  nachbestellen: `${APP}.nachbestellung.bestellungen_aus_vorschlaegen`,
});

export function istMock(client) {
  return client?.modus === "mock";
}

// ------------------------------------------------------------- Mock-Helfer --

function roh(client, dt, name) {
  const doc = client.tabelle(dt).get(name);
  if (!doc) throw new BackofficeError("not_found", `${dt} ${name} wurde nicht gefunden.`);
  return doc;
}

function klon(x) {
  return x === undefined ? undefined : JSON.parse(JSON.stringify(x));
}

/** Schreibt wie eine Server-Methode (ohne Workflow-Sperre des Clients), mit Version und Stempel. */
function schreibe(client, dt, name, werte) {
  const alt = roh(client, dt, name);
  const vorher = klon(alt);
  Object.assign(alt, klon(werte));
  if ("status" in werte && client.meta(dt).fields.some((f) => f.fieldname === "workflow_state")) alt.workflow_state = `PH ${werte.status}`;
  client.stempel(alt);
  client.version(dt, name, vorher, alt);
  return klon(alt);
}

function anlegen(client, dt, werte) {
  const meta = client.meta(dt);
  const doc = { doctype: dt, ...klon(werte) };
  const name = doc.name || neuerName(meta, doc, (p) => client.naechsteNummer(p), client.jetzt());
  doc.name = name;
  for (const f of meta.fields) {
    if (f.fieldtype === "Table" && Array.isArray(doc[f.fieldname])) doc[f.fieldname] = doc[f.fieldname].map((z, i) => ({ ...z, doctype: f.options, name: z.name || `${name}-${f.fieldname}-${i + 1}`, idx: i + 1, parentfield: f.fieldname, parenttype: dt }));
  }
  if (doc.status && meta.fields.some((f) => f.fieldname === "workflow_state")) doc.workflow_state = `PH ${doc.status}`;
  client.stempel(doc, true);
  client.tabelle(dt).set(name, doc);
  client.version(dt, name, null, doc);
  return klon(doc);
}

function jetzt(client) {
  return isoDatumZeit(client.jetzt());
}
function heute(client) {
  return isoDatum(client.jetzt());
}
function benutzer(client) {
  return client.session?.user || "Administrator";
}

/** PH Aufgabe (ehrlicher Ersatzweg, E18). */
export async function aufgabe(client, { titel, beschreibung = "", referenz_doctype = "", referenz_name = "", zugewiesen_an = "", faelligTage = 1, prioritaet = "Normal" }) {
  const faellig = isoDatum(new Date(client.jetzt().getTime() + faelligTage * 86_400_000));
  const werte = { naming_series: "PH-AUF-.YYYY.-.#####", titel, status: "Offen", prioritaet, faellig, zugewiesen_an, referenz_doctype, referenz_name, beschreibung, quelle: "workflow" };
  if (istMock(client)) return anlegen(client, "PH Aufgabe", werte);
  return client.insert("PH Aufgabe", werte);
}

async function kommentar(client, dt, name, text) {
  return client.kommentar(dt, name, text, "Comment");
}

/** Lagerbewegung im Mock (Journal). */
function bewegung(client, werte) {
  return anlegen(client, "PH Lagerbewegung", { naming_series: "PH-LBW-.YYYY.-.#####", status: "Gebucht", datum: jetzt(client), von_user: benutzer(client), quelle: "backoffice", titel: `${werte.art}: ${werte.produkt_name || ""}`.trim(), ...werte });
}

function bestandNeuRechnen(b) {
  const gesperrt = Number(b.gesperrt) || b.status === "Gesperrt";
  if (["Verkauft", "Ausgeschieden"].includes(b.status)) return { ...b, verfuegbar: 0 };
  const verf = gesperrt || b.status === "Kommission" ? 0 : Math.max(Number(b.menge || 0) - Number(b.reserviert || 0), 0);
  let status = b.status;
  if (!gesperrt && b.status !== "Kommission") status = Number(b.menge) <= 0 ? "Ausgeschieden" : Number(b.reserviert) > 0 ? "Reserviert" : "Verfuegbar";
  return { ...b, verfuegbar: verf, status };
}

// ---------------------------------------------------------------- Packtisch --

function lsPosition(ls, id) {
  return (ls.positionen || []).find((p) => posId(p) === id || p.name === id);
}

/** Pack-Ansicht: Lieferschein, Positionen, Pakete, Profile, Sendungen, Zusatz (Hinweise, Dokumente). */
export async function packansicht(client, { lieferschein, packplatz }) {
  if (!istMock(client)) {
    const [basis, zusatz] = await Promise.all([client.call(M.packansicht, { lieferschein }), client.call(M.packansichtZusatz, { lieferschein, packplatz }).catch(() => null)]);
    return { ...basis, zusatz };
  }
  const ls = await client.getDoc("PH Lieferschein", lieferschein);
  const [profile, sendungen, regeln] = await Promise.all([
    client.getList("PH Paketprofil", { fields: ["*"], filters: { aktiv: 1 }, limit: 100 }).catch(() => []),
    client.getList("PH Sendung", { fields: ["name", "status", "richtung", "carrier", "service_name", "tracking_nr", "tracking_url", "etikett", "preis_brutto_cent", "env"], filters: { lieferschein }, limit: 20 }).catch(() => []),
    client.getList("PH Packhinweis Regel", { fields: ["*"], filters: { aktiv: 1 }, limit: 50 }).catch(() => []),
  ]);
  return { lieferschein: ls, positionen: ls.positionen || [], pakete: ls.pakete || [], profile, sendungen, regeln, zusatz: null };
}

/**
 * Scan mit Menge (JTL M3) – `scan_menge(lieferschein, code, anzahl, bestaetigt)`.
 * @returns {{treffer:string|null, beschreibung?:string, ergebnis:string, ist?:number, soll?:number, offen?:number, ton:string|null}}
 */
export async function scanMenge(client, { lieferschein, code, anzahl = 1, bestaetigt = false, packplatz }) {
  if (!istMock(client)) {
    const r = await client.call(M.scanMenge, { lieferschein, code, anzahl, bestaetigt: bestaetigt ? 1 : 0, packplatz });
    return { ...r, ergebnis: r.treffer ? (r.bestaetigen ? "bestaetigen" : r.fehler || "erkannt") : "unbekannt" };
  }
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (ls.status !== "Entwurf") throw new BackofficeError("invalid", "Gepackt – Scannen nur im Entwurf.");
  const p = findePosition(ls.positionen || [], code);
  if (!p) return { treffer: null, ergebnis: "unbekannt", ton: "fehler" };
  const m = mengePruefen(p, anzahl, { mengenBestaetigen: true, bestaetigt });
  if (m.bestaetigen) return { treffer: posId(p), beschreibung: p.beschreibung, ergebnis: "bestaetigen", offen: m.offen, ton: null };
  if (!m.ok) return { treffer: posId(p), beschreibung: p.beschreibung, ergebnis: m.fehler, offen: m.offen, ist: Number(p.menge_gepackt || 0), soll: Number(p.menge || 0), ton: "fehler" };
  const neu = setzeMenge(ls.positionen, posId(p), Number(p.menge_gepackt || 0) + m.anzahl);
  schreibe(client, "PH Lieferschein", lieferschein, { positionen: neu, packplatz: packplatz || ls.packplatz || "" });
  const q = lsPosition(roh(client, "PH Lieferschein", lieferschein), posId(p));
  return { treffer: posId(p), beschreibung: p.beschreibung, ergebnis: "erkannt", ist: Number(q.menge_gepackt), soll: Number(q.menge), offen: Number(q.menge) - Number(q.menge_gepackt), ton: null };
}

/** Hand-Bestätigung für Positionen ohne Barcode (M4). */
export async function handBestaetigen(client, { lieferschein, position, anzahl = null, packplatz }) {
  if (!istMock(client)) return client.call(M.handBestaetigen, { lieferschein, position, anzahl, packplatz });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const p = lsPosition(ls, position);
  if (!p) throw new BackofficeError("not_found", "Position nicht gefunden.");
  const neu = setzeMenge(ls.positionen, posId(p), anzahl === null ? Number(p.menge) : Number(p.menge_gepackt || 0) + Number(anzahl)).map((x) => (posId(x) === posId(p) ? { ...x, hand_bestaetigt: 1, hand_bestaetigt_von: benutzer(client) } : x));
  schreibe(client, "PH Lieferschein", lieferschein, { positionen: neu });
  return { position: posId(p), menge_gepackt: lsPosition(roh(client, "PH Lieferschein", lieferschein), posId(p)).menge_gepackt };
}

/** Absoluter Stand (Offline-Puffer, Undo) – `positionen_setzen(stand, idempotency_key)`. */
export async function positionenSetzen(client, { lieferschein, stand, idempotency }) {
  if (!istMock(client)) return client.call(M.positionenSetzen, { lieferschein, stand: JSON.stringify(stand), idempotency_key: idempotency });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (idempotency && ls.idempotency_key === idempotency) return { wiederholt: true };
  let pos = ls.positionen || [];
  for (const [id, m] of Object.entries(stand || {})) pos = setzeMenge(pos, id, m);
  schreibe(client, "PH Lieferschein", lieferschein, { positionen: pos, idempotency_key: idempotency || ls.idempotency_key || "" });
  return { ok: true };
}

export async function positionMinus(client, { lieferschein, position }) {
  if (!istMock(client)) return client.call(M.positionMinus, { lieferschein, position });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const p = lsPosition(ls, position);
  if (!p) throw new BackofficeError("not_found", "Position nicht gefunden.");
  return positionenSetzen(client, { lieferschein, stand: { [posId(p)]: Math.max(Number(p.menge_gepackt || 0) - 1, 0) } });
}

/** Pakete mit Inhalt und manuellem Gewicht (M6/M7) – `pakete_mit_inhalt`. */
export async function paketeSpeichern(client, { lieferschein, pakete, versichern, versicherungswertCent, packplatz }) {
  if (!istMock(client)) return client.call(M.paketeMitInhalt, { lieferschein, pakete: JSON.stringify(pakete), packplatz, versicherungswert_cent: versicherungswertCent, versichern: versichern === undefined ? undefined : versichern ? 1 : 0 });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (!["Entwurf", "Gepackt"].includes(ls.status)) throw new BackofficeError("forbidden", "Beleg – Pakete nur bis „Gepackt“ änderbar.");
  const neu = (pakete || []).map((p, i) => ({ paket_nr: p.paket_nr || i + 1, paketprofil: p.paketprofil || "", art: p.art || "Paket", laenge_cm: Number(p.laenge_cm || 0), breite_cm: Number(p.breite_cm || 0), hoehe_cm: Number(p.hoehe_cm || 0), gewicht_g: Number(p.gewicht_g || 0), gewicht_vorschlag_g: Number(p.gewicht_vorschlag_g || 0), gewicht_manuell: p.gewicht_g ? 1 : 0, zerbrechlich: p.zerbrechlich ? 1 : 0, inhalt: p.inhalt || "", stapelbar: p.stapelbar ? 1 : 0 }))
    .map((p, i) => ({ ...p, doctype: "PH Lieferschein Paket", name: `${lieferschein}-pakete-${i + 1}`, idx: i + 1, parentfield: "pakete", parenttype: "PH Lieferschein" }));
  const werte = { pakete: neu, gesamtgewicht_g: neu.reduce((s, p) => s + p.gewicht_g, 0) };
  if (versichern !== undefined) werte.versichern = versichern ? 1 : 0;
  if (versicherungswertCent !== undefined) werte.versicherungswert_cent = Number(versicherungswertCent || 0);
  const r = schreibe(client, "PH Lieferschein", lieferschein, werte);
  return { pakete: r.pakete, gesamtgewicht_g: r.gesamtgewicht_g };
}

export async function paketeVorschlagen(client, { lieferschein }) {
  if (!istMock(client)) return client.call(M.paketeVorschlagen, { lieferschein });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const profile = [...client.tabelle("PH Paketprofil").values()];
  const familien = new Map();
  for (const p of ls.positionen || []) {
    const k = p.paketprofil || "karton-m";
    familien.set(k, [...(familien.get(k) || []), p]);
  }
  const pakete = [...familien.entries()].map(([key, ps], i) => {
    const pr = profile.find((x) => x.name === key) || {};
    return { paket_nr: i + 1, paketprofil: key, art: key === "palette" ? "Palette" : "Paket", laenge_cm: pr.laenge_cm || 0, breite_cm: pr.breite_cm || 0, hoehe_cm: pr.hoehe_cm || 0, gewicht_g: 0, gewicht_vorschlag_g: Number(pr.gewicht_g || 0), zerbrechlich: ps.some((x) => Number(x.zerbrechlich)) ? 1 : 0, inhalt: ps.map((x) => `${x.menge}× ${x.beschreibung}`).join(", ").slice(0, 140) };
  });
  return paketeSpeichern(client, { lieferschein, pakete });
}

/** Tarife (Testmodus: Muster-Tarife der App ohne Netz). */
export async function tarife(client, { lieferschein, neu = false }) {
  if (!istMock(client)) return client.call(M.tarife, { lieferschein, neu: neu ? 1 : 0 });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (ls.liefer_land === "CH") throw new BackofficeError("invalid", "Versand in die Schweiz ist nicht eingerichtet (Zoll). Eigenlieferung oder Spedition wählen.");
  const gesperrt = (ls.positionen || []).map((p) => client.tabelle("PH Paketprofil").get(p.paketprofil)).find((pr) => pr && Number(pr.versand_gesperrt));
  const gueltig = new Date(client.jetzt().getTime() + 30 * 60_000);
  return {
    tarife: [
      { id: "muster-dpd-classic", carrier: "DPD", service: "DPD Classic", laufzeit: "1–2 Tage", brutto_cent: 1100, empfohlen: 1 },
      { id: "muster-gls-business", carrier: "GLS", service: "GLS Business", laufzeit: "1–2 Tage", brutto_cent: 1240, empfohlen: 0 },
      { id: "muster-dhl-paket", carrier: "DHL", service: "DHL Paket", laufzeit: "2 Tage", brutto_cent: 1310, empfohlen: 0 },
    ],
    berechnet_cent: 990,
    gueltig_bis: isoDatumZeit(gueltig),
    test: 1,
    warnung: gesperrt ? gesperrt.hinweis || "Versand gesperrt – Gefahrgut. Abholung statt Versand." : null,
  };
}

/** Etikett buchen (LetMeShip; Mock = Muster-Etikett). Prüft vorher aktive Sendung. */
export async function etikettErzeugen(client, { lieferschein, tarifId }) {
  if (!istMock(client)) return client.call(M.etikett, { lieferschein, tarif_id: tarifId });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const aktiv = [...client.tabelle("PH Sendung").values()].find((s) => s.lieferschein === lieferschein && s.richtung === "Ausgang" && ["Etikett", "Unterwegs"].includes(s.status));
  if (aktiv) throw new BackofficeError("conflict", `Es gibt bereits eine aktive Sendung ${aktiv.name}.`);
  const t = (await tarife(client, { lieferschein })).tarife.find((x) => x.id === tarifId) || (await tarife(client, { lieferschein })).tarife[0];
  const nr = `TEST${String(Date.now()).slice(-10)}`;
  const s = anlegen(client, "PH Sendung", {
    naming_series: "PH-SND-.YYYY.-.#####", titel: `Sendung ${ls.kunde_name}`, status: "Etikett", richtung: "Ausgang", dienstleister: "LetMeShip", env: "mock", lieferschein, kontakt: ls.kontakt, carrier: t.carrier, service_name: t.service,
    service_id: t.id, preis_brutto_cent: t.brutto_cent, preis_netto_cent: Math.round(t.brutto_cent / 1.2), berechnet_cent: 990, waehrung: "EUR", anzahl_pakete: (ls.pakete || []).length || 1, gewicht_g: ls.gesamtgewicht_g, tracking_nr: nr,
    tracking_url: "", etikett: "/private/files/etikett-muster.pdf", gebucht_am: jetzt(client), empf_name: ls.liefer_name || ls.kunde_name, empf_strasse: ls.liefer_strasse, empf_hausnr: ls.liefer_hausnr, empf_plz: ls.liefer_plz, empf_ort: ls.liefer_ort, empf_land: ls.liefer_land, empf_email: ls.kunde_email, tracking_verlauf: [],
  });
  return { name: s.name, status: s.status, carrier: s.carrier, tracking_nr: s.tracking_nr, etikett: s.etikett, env: s.env };
}

function verkaufBuchen(client, ls) {
  for (const p of ls.positionen || []) {
    if (!p.lagerbestand) continue;
    const b = client.tabelle("PH Lagerbestand").get(p.lagerbestand);
    if (!b) continue;
    const schon = [...client.tabelle("PH Lagerbewegung").values()].some((x) => x.bezug === ls.name && x.lagerbestand === b.name && x.art === "Verkauf" && x.status === "Gebucht");
    if (schon) continue;
    const menge = Math.min(Number(p.menge_gepackt || p.menge || 0), Number(b.menge || 0));
    schreibe(client, "PH Lagerbestand", b.name, bestandNeuRechnen({ ...b, menge: Number(b.menge) - menge, reserviert: Math.max(Number(b.reserviert || 0) - menge, 0), status: b.status === "Kommission" && Number(b.menge) - menge <= 0 ? "Verkauft" : b.status }));
    bewegung(client, { art: "Verkauf", lagerbestand: b.name, produkt: b.produkt, produkt_name: b.produkt_name, menge: -menge, lagerort_von: b.lagerort, platz_von: b.platz, bezug_doctype: "PH Lieferschein", bezug: ls.name });
  }
}

/** Gepackt melden (nach dem verzögerten Commit). Abholung ohne E-Mail → Aufgabe „Kunde anrufen“. */
export async function alsGepackt(client, { lieferschein }) {
  if (!istMock(client)) {
    const r = await client.call(M.alsGepackt, { lieferschein });
    return { status: "Gepackt", ergebnis: r };
  }
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (ls.status !== "Entwurf") return { status: ls.status, wiederholt: true };
  const offen = (ls.positionen || []).some((p) => Number(p.menge_gepackt || 0) < Number(p.menge || 0));
  if (offen || !(ls.positionen || []).length) throw new BackofficeError("invalid", "Noch nicht alle Positionen gepackt.");
  const r = schreibe(client, "PH Lieferschein", lieferschein, { status: "Gepackt", gepackt_am: jetzt(client), gepackt_von: benutzer(client) });
  verkaufBuchen(client, r);
  let aufgabeName = null;
  if (ls.lieferart === "Abholung") {
    if (ls.kunde_email) await kommentar(client, "PH Lieferschein", lieferschein, `Abholbereit-Mail an ${ls.kunde_email} gesendet (Mock).`);
    else aufgabeName = (await aufgabe(client, { titel: `Kunde anrufen: ${ls.kunde_name} – Abholung bereit`, beschreibung: `Telefon ${ls.kunde_telefon || "–"}`, referenz_doctype: "PH Lieferschein", referenz_name: lieferschein })).name;
  }
  return { status: "Gepackt", aufgabe: aufgabeName };
}

/**
 * Abschluss „Verpacken“ (M8/M9): Prüfung, Etikett (Versand), Gepackt, Bestand, Dokumente.
 * @returns {{status:string, sendung:object|null, dokumente:string[]}}
 */
export async function verpacken(client, { lieferschein, packplatz, tarifId, teillieferung = false }) {
  if (!istMock(client)) return client.call(M.verpacken, { lieferschein, packplatz, tarif_id: tarifId, teillieferung: teillieferung ? 1 : 0 });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const gruende = verpackenPruefen({ positionen: ls.positionen || [], pakete: ls.pakete || [], lieferart: ls.lieferart, zurueckgestellt: !!Number(ls.zurueckgestellt), teillieferung });
  if (gruende.length) throw new BackofficeError("invalid", `Noch nicht bereit: ${gruende.join(", ")}`);
  let sendung = null;
  if (ls.lieferart === "Versand") sendung = await etikettErzeugen(client, { lieferschein, tarifId });
  await alsGepackt(client, { lieferschein });
  return { status: "Gepackt", sendung, dokumente: Number(ls.geschenk) ? ["Lieferschein"] : ["Lieferschein", "Rechnung"], spedition: ls.lieferart === "Spedition" };
}

export async function packhinweiseBestaetigen(client, { lieferschein }) {
  if (!istMock(client)) return client.call(M.hinweiseBestaetigen, { lieferschein });
  return schreibe(client, "PH Lieferschein", lieferschein, { packhinweise_bestaetigt: 1 });
}

export async function zurueckstellen(client, { lieferschein, grund, text }) {
  if (!istMock(client)) return client.call(M.zurueckstellen, { lieferschein, grund, text });
  schreibe(client, "PH Lieferschein", lieferschein, { zurueckgestellt: 1, zurueckgestellt_grund: grund, zurueckgestellt_text: text || "", zurueckgestellt_am: jetzt(client), zurueckgestellt_von: benutzer(client), problem_grund: grund === "Kunde Rueckfrage" ? "Sonstiges" : grund, problem_text: text || "", problem_am: jetzt(client) });
  await aufgabe(client, { titel: `Zurückgestellt: ${lieferschein} – ${grund}`, beschreibung: text || "", referenz_doctype: "PH Lieferschein", referenz_name: lieferschein });
  return { zurueckgestellt: 1, grund };
}

export async function fortsetzen(client, { lieferschein }) {
  if (!istMock(client)) return client.call(M.fortsetzen, { lieferschein });
  return schreibe(client, "PH Lieferschein", lieferschein, { zurueckgestellt: 0 });
}

/** Problem am Lieferschein: Kommentar + Aufgabe (Beschädigt → Servicefall-Hinweis). */
export async function problemMelden(client, { lieferschein, grund, text, fotos = [] }) {
  if (!istMock(client)) return client.call(M.problem, { lieferschein, grund, text, fotos: JSON.stringify(fotos) });
  schreibe(client, "PH Lieferschein", lieferschein, { problem_grund: grund, problem_text: text || "", problem_am: jetzt(client) });
  await kommentar(client, "PH Lieferschein", lieferschein, `Problem: ${grund}${text ? ` – ${text}` : ""}`);
  const a = await aufgabe(client, { titel: `Problem ${lieferschein}: ${grund}`, beschreibung: text || "", referenz_doctype: "PH Lieferschein", referenz_name: lieferschein, prioritaet: "Hoch" });
  return { aufgabe: a.name, servicefall: grund === "Beschaedigt" ? "(Mock)" : null };
}

/** Teillieferung bewusst auslösen (M11): Gescanntes bleibt, Rest als neuer Entwurf. */
export async function teillieferung(client, { lieferschein }) {
  if (!istMock(client)) return client.call(M.teillieferung, { lieferschein });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  const bleibt = [];
  const rest = [];
  for (const p of ls.positionen || []) {
    const g = Number(p.menge_gepackt || 0);
    if (g > 0) bleibt.push({ ...p, menge: g, gepackt: 1 });
    if (Number(p.menge) - g > 0) rest.push({ ...p, name: undefined, menge: Number(p.menge) - g, menge_gepackt: 0, gepackt: 0 });
  }
  if (!rest.length) return { lieferschein, rest: null };
  schreibe(client, "PH Lieferschein", lieferschein, { positionen: bleibt, teillieferung: 1 });
  const { name: _n, creation: _c, modified: _m, positionen: _p, pakete: _k, ...kopf } = klon(ls);
  const neu = anlegen(client, "PH Lieferschein", { ...kopf, status: "Entwurf", positionen: rest, pakete: [], teillieferung: 1, teillieferung_von: lieferschein, zurueckgestellt: 0 });
  return { lieferschein, rest: neu.name };
}

/** Packtisch-Startseite: Lieferscheine Entwurf/Gepackt + bezahlte Shop-Bestellungen ohne Lieferschein. */
export async function offene(client) {
  if (!istMock(client)) return client.call(M.offene, {});
  const ls = await client.getList("PH Lieferschein", { fields: ["*"], filters: [["status", "in", ["Entwurf", "Gepackt"]]], orderBy: "datum asc", limit: 200 });
  const voll = ls.map((l) => {
    const d = client.tabelle("PH Lieferschein").get(l.name) || {};
    const pos = d.positionen || [];
    const sendung = [...client.tabelle("PH Sendung").values()].find((s) => s.lieferschein === l.name && s.richtung === "Ausgang" && ["Angelegt", "Etikett", "Unterwegs"].includes(s.status));
    return { ...l, positionen: pos.length, offen: pos.filter((p) => !Number(p.gepackt) && Number(p.menge_gepackt || 0) < Number(p.menge || 0)).length, sendung: sendung?.name || null, sendung_status: sendung?.status || null };
  });
  const mitLs = new Set([...client.tabelle("PH Lieferschein").values()].filter((l) => l.bestellung && l.status !== "Storniert").map((l) => l.bestellung));
  const bestellungen = (await client.getList("PH Bestellung", { fields: ["name", "status", "kunde_name", "lieferart", "gesamt_cent", "bezahlt_am", "offen_cent", "modified", "adresse_ort", "adresse_land"], filters: [["status", "in", ["bezahlt", "versandbereit", "reserviert", "abholbereit"]]], limit: 200 }).catch(() => [])).filter((b) => !mitLs.has(b.name));
  const einst = client.tabelle("PH Logistik Einstellungen").get("PH Logistik Einstellungen") || {};
  return { lieferscheine: voll, bestellungen, hinweis: einst.packtisch_hinweis || "", mock: true };
}

/** Bezahlte Bestellung → Lieferschein (still beim Antippen). */
export async function lieferscheinAusBestellung(client, { bestellung }) {
  if (!istMock(client)) return client.call(M.lsAusBestellung, { bestellung });
  const vorhanden = [...client.tabelle("PH Lieferschein").values()].find((l) => l.bestellung === bestellung && l.status !== "Storniert");
  if (vorhanden) return vorhanden.name;
  const b = roh(client, "PH Bestellung", bestellung);
  const ls = anlegen(client, "PH Lieferschein", {
    naming_series: "LS-.YYYY.-.#####", titel: `Lieferschein ${b.kunde_name}`, status: "Entwurf", lieferart: b.lieferart === "abholung" ? "Abholung" : "Versand", datum: heute(client), bestellung, kontakt: b.kontakt || "", kunde_name: b.kunde_name, kunde_email: b.kunde_email || "",
    kunde_telefon: b.kunde_telefon || "", sprache: b.sprache || "de", liefer_name: b.kunde_name, liefer_strasse: b.adresse_strasse || "", liefer_hausnr: b.adresse_hausnr || "", liefer_plz: b.adresse_plz || "", liefer_ort: b.adresse_ort || "", liefer_land: b.adresse_land || "AT", quelle: "packtisch",
    positionen: (b.positionen || []).map((p) => ({ produkt: p.produkt || "", beschreibung: p.bezeichnung || p.variante_name || p.slug || "Artikel", marke: p.marke || "", slug: p.slug || "", menge: Number(p.menge || 1), menge_gepackt: 0, gepackt: 0, ean: "", ohne_barcode: 1, zerbrechlich: Number(p.zerbrechlich || 0), einzel_cent: Number(p.einzel_cent || 0) })),
    pakete: [],
  });
  return ls.name;
}

/** Erster Scan identifiziert den Vorgang (M1). */
export async function vorgangScannen(client, { code, packplatz }) {
  if (!istMock(client)) return client.call(M.vorgangScannen, { code, packplatz });
  const c = String(code || "").trim();
  const t = client.tabelle("PH Lieferschein");
  if (t.has(c)) return { lieferschein: c, art: "lieferschein", kandidaten: [c] };
  const ab = [...t.values()].find((l) => l.abholcode && l.abholcode.toUpperCase() === c.toUpperCase() && l.status === "Gepackt");
  if (ab) return { lieferschein: ab.name, art: "abholcode", kandidaten: [ab.name] };
  if (client.tabelle("PH Bestellung").has(c)) {
    const name = await lieferscheinAusBestellung(client, { bestellung: c });
    return { lieferschein: name, art: "bestellung", kandidaten: [name] };
  }
  const kom = c.replace(/^KOM:\s*/i, "");
  const k = [...t.values()].filter((l) => l.kommission === kom && l.status === "Entwurf");
  if (k.length) return { lieferschein: k[0].name, art: "kommission", kandidaten: k.map((x) => x.name) };
  const art = [...t.values()].filter((l) => l.status === "Entwurf" && !Number(l.zurueckgestellt) && findePosition(l.positionen || [], c))
    .sort((a, b) => (a.positionen || []).filter((p) => !Number(p.gepackt)).length - (b.positionen || []).filter((p) => !Number(p.gepackt)).length || String(a.datum).localeCompare(String(b.datum)));
  if (art.length) return { lieferschein: art[0].name, art: "artikel", kandidaten: art.map((x) => x.name) };
  return { lieferschein: null, art: null, kandidaten: [] };
}

// --------------------------------------------------------- Lieferschein-Akte --

export async function uebergeben(client, { lieferschein, an = "Dienstleister" }) {
  if (!istMock(client)) return client.runDocMethod("PH Lieferschein", lieferschein, "uebergeben", { an });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (ls.status !== "Gepackt") throw new BackofficeError("invalid", "Übergeben geht nur aus „Gepackt“.");
  return schreibe(client, "PH Lieferschein", lieferschein, { status: "Uebergeben", uebergeben_am: jetzt(client), uebergeben_an: an });
}

export async function alsZugestellt(client, { lieferschein, empfaengerName, unterschrift, abholcode }) {
  if (!istMock(client)) {
    const ls = await client.getDoc("PH Lieferschein", lieferschein);
    if (ls.lieferart === "Abholung") return client.call(M.abholung, { lieferschein, empfaenger_name: empfaengerName, unterschrift, abholcode });
    return client.runDocMethod("PH Lieferschein", lieferschein, "als_zugestellt", { empfaenger_name: empfaengerName, unterschrift, abholcode });
  }
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (ls.lieferart === "Abholung") {
    if (ls.status !== "Gepackt") throw new BackofficeError("invalid", "Ausgeben geht nur aus „Gepackt“.");
    if (ls.abholcode && abholcode && String(abholcode).toUpperCase().replace(/\s/g, "") !== ls.abholcode) throw new BackofficeError("invalid", "Abholcode stimmt nicht.", { detail: { fehler: { abholcode: "Abholcode stimmt nicht." } } });
  } else if (!["Uebergeben", "Gepackt"].includes(ls.status)) throw new BackofficeError("invalid", "Zustellen geht nur nach dem Übergeben.");
  const r = schreibe(client, "PH Lieferschein", lieferschein, { status: "Zugestellt", zugestellt_am: jetzt(client), empfaenger_name: empfaengerName || "", unterschrift_empfaenger: unterschrift ? "/private/files/unterschrift-mock.png" : ls.unterschrift_empfaenger || "", uebergeben_am: ls.uebergeben_am || jetzt(client), uebergeben_an: ls.uebergeben_an || (ls.lieferart === "Abholung" ? "Kunde" : "Fahrer") });
  if (ls.auftrag && ls.status === "Gepackt") await kommentar(client, "PH Lieferschein", lieferschein, `Liefermengen an ${ls.auftrag} gemeldet (Mock).`);
  return r;
}

export async function stornieren(client, { lieferschein, grund }) {
  if (!istMock(client)) return client.runDocMethod("PH Lieferschein", lieferschein, "stornieren", { grund });
  const ls = roh(client, "PH Lieferschein", lieferschein);
  if (!["Entwurf", "Gepackt"].includes(ls.status)) throw new BackofficeError("forbidden", "Beleg – Änderungen nur über Storno oder Warenrücknahme");
  if (ls.tour) await stoppEntfernenNachLs(client, ls.tour, lieferschein);
  for (const s of [...client.tabelle("PH Sendung").values()].filter((x) => x.lieferschein === lieferschein && ["Angelegt", "Etikett"].includes(x.status))) schreibe(client, "PH Sendung", s.name, { status: "Storniert", storniert_am: jetzt(client) });
  for (const b of [...client.tabelle("PH Lagerbewegung").values()].filter((x) => x.bezug === lieferschein && x.art === "Verkauf" && x.status === "Gebucht")) await bewegungStornieren(client, { name: b.name });
  return schreibe(client, "PH Lieferschein", lieferschein, { status: "Storniert", storno_grund: grund, tour: "" });
}

export async function zurueckAufEntwurf(client, { lieferschein }) {
  if (!istMock(client)) return client.workflowAction("PH Lieferschein", lieferschein, "Zurück auf Entwurf");
  return schreibe(client, "PH Lieferschein", lieferschein, { status: "Entwurf" });
}

/** Dokumentmethoden ohne eigene Logik im Mock (Mail-Versand → Kommentar + Datum). */
export async function lsMethode(client, { lieferschein, methode }) {
  const erlaubt = ["lieferbestaetigung_senden", "abholbereit_melden", "teilrechnung_erstellen", "produktpaesse_erzeugen", "speditionsauftrag_anlegen", "warenruecknahme_anlegen", "retourenetikett", "nach_erfuellung_aufteilen"];
  if (!erlaubt.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) return client.runDocMethod("PH Lieferschein", lieferschein, methode, {});
  const ls = roh(client, "PH Lieferschein", lieferschein);
  switch (methode) {
    case "lieferbestaetigung_senden":
      if (!ls.kunde_email) throw new BackofficeError("invalid", "Keine E-Mail-Adresse beim Kunden.");
      schreibe(client, "PH Lieferschein", lieferschein, { lieferbestaetigung_gesendet_am: jetzt(client) });
      await kommentar(client, "PH Lieferschein", lieferschein, `Lieferbestätigung an ${ls.kunde_email} gesendet (Mock).`);
      return { gesendet: 1 };
    case "abholbereit_melden":
      if (!ls.kunde_email) return { gesendet: 0, aufgabe: (await aufgabe(client, { titel: `Kunde anrufen: ${ls.kunde_name} – Abholung bereit`, referenz_doctype: "PH Lieferschein", referenz_name: lieferschein })).name };
      await kommentar(client, "PH Lieferschein", lieferschein, `Abholbereit-Mail an ${ls.kunde_email} gesendet (Mock).`);
      return { gesendet: 1 };
    case "speditionsauftrag_anlegen": {
      const vorhanden = [...client.tabelle("PH Speditionsauftrag").values()].find((s) => s.lieferschein === lieferschein && s.status !== "Storniert");
      if (vorhanden) return vorhanden.name;
      const s = anlegen(client, "PH Speditionsauftrag", { naming_series: "PH-SPA-.YYYY.-.####", titel: `Spedition ${ls.kunde_name}`, status: "Entwurf", richtung: "Lager an Kunde", lieferschein, kunde_name: ls.kunde_name, kontakt: ls.kontakt, ziel_name: ls.liefer_name || ls.kunde_name, ziel_strasse: `${ls.liefer_strasse || ""} ${ls.liefer_hausnr || ""}`.trim(), ziel_plz: ls.liefer_plz, ziel_ort: ls.liefer_ort, ziel_land: ls.liefer_land, zustell_datum: ls.wunschtermin || "", packstuecke: (ls.pakete || []).map((p) => ({ art: p.art === "Palette" ? "Palette" : "Kolli", anzahl: 1, laenge_cm: p.laenge_cm, breite_cm: p.breite_cm, hoehe_cm: p.hoehe_cm, gewicht_g: p.gewicht_g })) });
      return s.name;
    }
    case "warenruecknahme_anlegen": {
      const w = anlegen(client, "PH Warenruecknahme", { naming_series: "PH-WR-.YYYY.-.####", titel: `Rücknahme ${ls.kunde_name}`, status: "Angemeldet", anlass: "Kundenrueckgabe", kunde_name: ls.kunde_name, kontakt: ls.kontakt, lieferschein, positionen: (ls.positionen || []).map((p) => ({ produkt: p.produkt, produkt_name: p.beschreibung, menge: p.menge, zustand: "", entscheidung: "" })) });
      return w.name;
    }
    default:
      await kommentar(client, "PH Lieferschein", lieferschein, `${methode} (Mock)`);
      return { ok: true };
  }
}

/** Lieferschein aus AB/Bestellung/Kommission (§ 5.1) mit geprüften Mengen. */
export async function lieferscheinErzeugen(client, { quelle, name, positionen = [], lieferart, wunschtermin, idempotency }) {
  if (!istMock(client)) {
    let ls;
    if (quelle === "auftrag") ls = await client.call(M.lsAusAuftrag, { auftrag: name, positionen: JSON.stringify(positionen.map((p) => ({ beleg_position: p.schluessel, menge: p.menge }))), lieferart });
    else if (quelle === "bestellung") ls = await client.call(M.lsAusBestellungApi, { bestellung: name, lieferart });
    else ls = await client.call(M.lsAusKommission, { kommission: name, lieferart, wunschtermin });
    const lsName = typeof ls === "string" ? ls : ls?.name;
    if (wunschtermin && lsName && quelle !== "kommission") {
      const doc = await client.getDoc("PH Lieferschein", lsName);
      await client.save("PH Lieferschein", { name: lsName, wunschtermin }, { modified: doc.modified });
    }
    return { name: lsName };
  }
  const t = client.tabelle("PH Lieferschein");
  if (idempotency) {
    const schon = [...t.values()].find((l) => l.idempotency_key === idempotency);
    if (schon) return { name: schon.name, wiederholt: true };
  }
  if (quelle === "auftrag") {
    const ab = roh(client, "PH Auftragsbestaetigung", name);
    const zeilen = (ab.positionen || []).map((z) => ({ z, key: z.name || `${name}:${z.idx}` }));
    const pos = positionen.map((p) => {
      const z = zeilen.find((x) => x.key === p.schluessel)?.z || {};
      return { produkt: z.produkt || "", beschreibung: z.bezeichnung || z.beschreibung || "Position", ausfuehrung_text: z.ausfuehrung_text || "", marke: z.marke || "", bereich: z.raum || "", menge: p.menge, menge_gepackt: 0, gepackt: 0, ohne_barcode: 1, beleg_position: p.schluessel, einzel_cent: Number(z.einzel_netto_cent || 0) };
    });
    const ls = anlegen(client, "PH Lieferschein", {
      naming_series: "LS-.YYYY.-.#####", titel: `Lieferschein ${ab.kunde_name}`, status: "Entwurf", lieferart: lieferart || "Eigenlieferung", datum: heute(client), wunschtermin: wunschtermin || "", auftrag: name, projekt: ab.projekt || "", kontakt: ab.kontakt || "", kunde_name: ab.kunde_name, liefer_name: ab.kunde_name,
      liefer_strasse: ab.strasse || "", liefer_plz: ab.plz || "", liefer_ort: ab.ort || "", liefer_land: ab.land || "AT", lieferhinweis: ab.lieferhinweis || "", teillieferung: 1, positionen: pos, pakete: [], quelle: "backoffice", idempotency_key: idempotency || "",
    });
    return { name: ls.name };
  }
  if (quelle === "bestellung") return { name: await lieferscheinAusBestellung(client, { bestellung: name }) };
  // Kommission: Bestände der Kommission (nicht gesperrt, nicht auf offenem Lieferschein)
  const belegt = new Set([...t.values()].filter((l) => !["Storniert", "Zugestellt"].includes(l.status)).flatMap((l) => (l.positionen || []).map((p) => p.lagerbestand)).filter(Boolean));
  const bestaende = [...client.tabelle("PH Lagerbestand").values()].filter((b) => b.kommission === name && !Number(b.gesperrt) && !belegt.has(b.name) && Number(b.menge) > 0);
  if (!bestaende.length) throw new BackofficeError("invalid", "Keine freie Ware zu dieser Kommission.");
  const ls = anlegen(client, "PH Lieferschein", {
    naming_series: "LS-.YYYY.-.#####", titel: `Lieferschein Kommission ${name}`, status: "Entwurf", lieferart: lieferart || "Eigenlieferung", datum: heute(client), wunschtermin: wunschtermin || "", kommission: name, projekt: name, kunde_name: `Kommission ${name}`, liefer_land: "AT", quelle: "backoffice", idempotency_key: idempotency || "",
    positionen: bestaende.map((b) => ({ produkt: b.produkt, beschreibung: b.produkt_name, marke: b.marke, menge: Number(b.menge), menge_gepackt: 0, gepackt: 0, ean: b.ean || "", seriennummer: b.seriennummer || "", ohne_barcode: b.ean || b.seriennummer ? 0 : 1, lagerbestand: b.name })), pakete: [],
  });
  return { name: ls.name };
}

/** Lieferschein speichern (Belegsperre prüft die Action vorher). */
export async function lieferscheinSpeichern(client, { name, werte, modified }) {
  return client.save("PH Lieferschein", { ...werte, name }, { modified });
}

/** Entnahme setzen (Lagerbestand an Position). */
export async function entnahmeSetzen(client, { lieferschein, position, lagerbestand }) {
  if (!istMock(client)) {
    const ls = await client.getDoc("PH Lieferschein", lieferschein);
    const pos = (ls.positionen || []).map((p) => (p.name === position ? { ...p, lagerbestand } : p));
    return client.save("PH Lieferschein", { name: lieferschein, positionen: pos }, { modified: ls.modified });
  }
  const ls = roh(client, "PH Lieferschein", lieferschein);
  return schreibe(client, "PH Lieferschein", lieferschein, { positionen: (ls.positionen || []).map((p) => (posId(p) === position ? { ...p, lagerbestand } : p)) });
}

// ------------------------------------------------------------------- Sendung --

export const SENDUNG_METHODEN = ["buchen", "tracking_aktualisieren", "problem_melden", "manuell_zugestellt", "retourenlabel", "stornieren"];

export async function sendungMethode(client, { name, methode, args = {} }) {
  if (!SENDUNG_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) return client.runDocMethod("PH Sendung", name, methode, args);
  const s = roh(client, "PH Sendung", name);
  switch (methode) {
    case "buchen":
      return schreibe(client, "PH Sendung", name, { status: "Etikett", gebucht_am: jetzt(client), tracking_nr: s.tracking_nr || `TEST${String(Date.now()).slice(-10)}`, etikett: "/private/files/etikett-muster.pdf", carrier: s.carrier || "DPD", service_name: s.service_name || "DPD Classic", fehler: "" });
    case "tracking_aktualisieren":
      return schreibe(client, "PH Sendung", name, { letzter_abgleich: jetzt(client) });
    case "problem_melden":
      return schreibe(client, "PH Sendung", name, { status: "Problem", fehler: args.text || "Problem gemeldet" });
    case "manuell_zugestellt": {
      const r = schreibe(client, "PH Sendung", name, { status: "Zugestellt", zugestellt_am: jetzt(client) });
      if (s.lieferschein && roh(client, "PH Lieferschein", s.lieferschein).status === "Uebergeben") schreibe(client, "PH Lieferschein", s.lieferschein, { status: "Zugestellt", zugestellt_am: jetzt(client) });
      return r;
    }
    case "retourenlabel":
      return anlegen(client, "PH Sendung", { ...klon(s), name: undefined, richtung: "Retoure", status: "Etikett", tracking_nr: `TESTR${String(Date.now()).slice(-9)}`, gebucht_am: jetzt(client), tracking_verlauf: [] });
    case "stornieren":
      if (s.status === "Unterwegs") throw new BackofficeError("invalid", "Sendung ist beim Carrier – Storno telefonisch");
      return schreibe(client, "PH Sendung", name, { status: "Storniert", storniert_am: jetzt(client) });
    default:
      return null;
  }
}

export async function trackingAlle(client) {
  if (!istMock(client)) return client.call(M.tracking, { sofort: 1 });
  const offen = [...client.tabelle("PH Sendung").values()].filter((s) => ["Etikett", "Unterwegs", "Problem"].includes(s.status));
  for (const s of offen) schreibe(client, "PH Sendung", s.name, { letzter_abgleich: jetzt(client) });
  return { abgeglichen: offen.length };
}

// --------------------------------------------------------------------- Tour --

function stoppAusLs(ls, reihenfolge, einst = {}) {
  return {
    reihenfolge, art: "Lieferung", lieferschein: ls.name, kontakt: ls.kontakt || "", kunde_name: ls.kunde_name, adresse: `${ls.liefer_strasse || ""} ${ls.liefer_hausnr || ""}`.trim(), plz: ls.liefer_plz || "", ort: ls.liefer_ort || "", land: ls.liefer_land || "AT",
    telefon: ls.liefer_telefon || ls.kunde_telefon || "", zeitfenster_von: "", zeitfenster_bis: "", fahrt_min: Number(einst.fahrt_min_standard || 0), dauer_min: Number(einst.stopp_dauer_min_standard || 0), montage_min: 0, status: "offen", notiz: "",
  };
}

function nummeriere(stopps) {
  return stopps.map((s, i) => ({ ...s, reihenfolge: i + 1, idx: i + 1 }));
}

async function stoppEntfernenNachLs(client, tour, lieferschein) {
  const t = client.tabelle("PH Tour").get(tour);
  if (!t) return;
  schreibe(client, "PH Tour", tour, { stopps: nummeriere((t.stopps || []).filter((s) => s.lieferschein !== lieferschein)) });
}

export async function stoppsHinzufuegen(client, { tour, lieferscheine = [] }) {
  if (!istMock(client)) return client.runDocMethod("PH Tour", tour, "stopps_hinzufuegen", { lieferscheine: JSON.stringify(lieferscheine) });
  const t = roh(client, "PH Tour", tour);
  const einst = client.tabelle("PH Logistik Einstellungen").get("PH Logistik Einstellungen") || {};
  const neu = [...(t.stopps || [])];
  for (const n of lieferscheine) {
    const ls = roh(client, "PH Lieferschein", n);
    if (neu.some((s) => s.lieferschein === n)) continue;
    neu.push(stoppAusLs(ls, neu.length + 1, einst));
    schreibe(client, "PH Lieferschein", n, { tour });
  }
  return schreibe(client, "PH Tour", tour, { stopps: nummeriere(neu) });
}

export async function stoppEntfernen(client, { tour, stopp }) {
  if (!istMock(client)) return client.runDocMethod("PH Tour", tour, "stopp_entfernen", { stopp });
  const t = roh(client, "PH Tour", tour);
  const s = (t.stopps || []).find((x) => x.name === stopp || x.lieferschein === stopp || String(x.reihenfolge) === String(stopp));
  if (!s) throw new BackofficeError("not_found", "Stopp nicht gefunden.");
  if (["erledigt", "nicht angetroffen"].includes(s.status)) throw new BackofficeError("invalid", "Beendete Stopps bleiben in der Tour.");
  if (s.lieferschein && client.tabelle("PH Lieferschein").has(s.lieferschein)) schreibe(client, "PH Lieferschein", s.lieferschein, { tour: "" });
  return schreibe(client, "PH Tour", tour, { stopps: nummeriere((t.stopps || []).filter((x) => x !== s)) });
}

/** Reihenfolge speichern (Liste von Stopp-Namen) oder nach PLZ sortieren (`reihenfolge_optimieren`). */
export async function reihenfolge(client, { tour, reihenfolge: liste, plz = false }) {
  if (!istMock(client)) {
    if (plz) return client.runDocMethod("PH Tour", tour, "reihenfolge_optimieren", {});
    const t = await client.getDoc("PH Tour", tour);
    const sortiert = liste.map((n, i) => ({ ...(t.stopps || []).find((s) => s.name === n), reihenfolge: i + 1, idx: i + 1 }));
    return client.save("PH Tour", { name: tour, stopps: sortiert }, { modified: t.modified });
  }
  const t = roh(client, "PH Tour", tour);
  const stopps = t.stopps || [];
  const neu = plz ? stopps.slice().sort((a, b) => String(a.plz || "").localeCompare(String(b.plz || ""))) : liste.map((n) => stopps.find((s) => s.name === n)).filter(Boolean);
  if (neu.length !== stopps.length) throw new BackofficeError("conflict", "Die Tour wurde zwischenzeitlich geändert. Bitte neu laden.");
  return schreibe(client, "PH Tour", tour, { stopps: nummeriere(neu) });
}

export async function tourAnlegen(client, { datum, fahrzeug, fahrer, startZeit }) {
  const fz = fahrzeug ? await client.getDoc("PH Fahrzeug", fahrzeug).catch(() => null) : null;
  const werte = { naming_series: "PH-TOUR-.YYYY.-.####", titel: `Tour ${datum}`, status: "Geplant", datum, fahrzeug: fahrzeug || "", fahrer: fahrer || fz?.standard_fahrer || "", start_zeit: startZeit || "07:30:00", start_lagerort: "", team: [], stopps: [], quelle: "backoffice" };
  if (!istMock(client)) return client.insert("PH Tour", werte);
  return anlegen(client, "PH Tour", werte);
}

export const TOUR_METHODEN = ["freigeben", "abbrechen", "avis_senden", "abschliessen", "starten"];

export async function tourMethode(client, { name, methode, args = {} }) {
  if (!TOUR_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) {
    if (methode === "starten") return client.call(M.tourStarten, { tour: name, km_start: args.km_start });
    if (methode === "abschliessen") return client.call(M.tourAbschliessen, { tour: name, km_ende: args.km_ende });
    return client.runDocMethod("PH Tour", name, methode, args);
  }
  const t = roh(client, "PH Tour", name);
  switch (methode) {
    case "freigeben":
      if (t.status !== "Geplant") return { status: t.status, wiederholt: true };
      return schreibe(client, "PH Tour", name, { status: "Freigegeben", freigegeben_von: benutzer(client), freigegeben_am: jetzt(client) });
    case "starten":
      if (t.status !== "Freigegeben") throw new BackofficeError("invalid", "Starten geht nur bei freigegebenen Touren.");
      for (const s of t.stopps || []) if (s.lieferschein && roh(client, "PH Lieferschein", s.lieferschein).status === "Gepackt") schreibe(client, "PH Lieferschein", s.lieferschein, { status: "Uebergeben", uebergeben_am: jetzt(client), uebergeben_an: "Fahrer" });
      return schreibe(client, "PH Tour", name, { status: "Unterwegs", km_start: Number(args.km_start || t.km_start || 0) });
    case "abschliessen":
      if ((t.stopps || []).some((s) => ["offen", "unterwegs"].includes(s.status))) throw new BackofficeError("invalid", "Es sind noch Stopps offen.");
      return schreibe(client, "PH Tour", name, { status: "Abgeschlossen", km_ende: Number(args.km_ende || 0) });
    case "abbrechen":
      return schreibe(client, "PH Tour", name, { status: "Abgebrochen", notiz_intern: `${t.notiz_intern ? `${t.notiz_intern}\n` : ""}Abgebrochen: ${args.grund || ""}` });
    case "avis_senden": {
      const stopps = (t.stopps || []).filter((s) => !args.stopps || args.stopps.includes(s.name));
      let gesendet = 0;
      const ohne = [];
      const neu = (t.stopps || []).map((s) => {
        if (!stopps.includes(s)) return s;
        const ls = s.lieferschein ? client.tabelle("PH Lieferschein").get(s.lieferschein) : null;
        if (ls?.kunde_email) {
          gesendet++;
          return { ...s, avis_gesendet_am: jetzt(client), avis_kanal: args.kanal || "mail" };
        }
        ohne.push(s.kunde_name || `Stopp ${s.reihenfolge}`);
        return s;
      });
      schreibe(client, "PH Tour", name, { stopps: neu });
      return { gesendet, ohne };
    }
    default:
      return null;
  }
}

export async function tourVerschieben(client, { name, datum, fahrzeug }) {
  const werte = { datum };
  if (fahrzeug !== undefined) werte.fahrzeug = fahrzeug;
  if (!istMock(client)) {
    const t = await client.getDoc("PH Tour", name);
    return client.save("PH Tour", { name, ...werte }, { modified: t.modified });
  }
  const t = roh(client, "PH Tour", name);
  return schreibe(client, "PH Tour", name, { ...werte, ...(t.status === "Freigegeben" ? { status: "Geplant" } : {}) });
}

export async function tourSpeichern(client, { name, werte, modified }) {
  return client.save("PH Tour", { ...werte, name }, { modified });
}

/** Stopp-Status (Montage mobil / Akte) – `tour_mobil.stopp_status`. */
export async function stoppStatus(client, { tour, stopp, status, notiz, unterschrift, unterschriftName, idempotency }) {
  if (!istMock(client)) return client.call(M.stoppStatus, { tour, stopp, status, notiz, unterschrift, unterschrift_name: unterschriftName, idempotency_key: idempotency });
  const t = roh(client, "PH Tour", tour);
  const neu = (t.stopps || []).map((s) => (s.name === stopp || String(s.reihenfolge) === String(stopp) ? { ...s, status, notiz: notiz || s.notiz, unterschrift_name: unterschriftName || s.unterschrift_name } : s));
  const s = neu.find((x) => x.name === stopp || String(x.reihenfolge) === String(stopp));
  if (!s) throw new BackofficeError("not_found", "Stopp nicht gefunden.");
  schreibe(client, "PH Tour", tour, { stopps: neu });
  if (status === "erledigt" && s.lieferschein) {
    const ls = roh(client, "PH Lieferschein", s.lieferschein);
    if (["Uebergeben", "Gepackt"].includes(ls.status)) schreibe(client, "PH Lieferschein", s.lieferschein, { status: "Zugestellt", zugestellt_am: jetzt(client), empfaenger_name: unterschriftName || "" });
  }
  return { stopp: s.name, status };
}

// --------------------------------------------------------------- Spedition --

export const SPEDITION_METHODEN = ["per_email_senden", "bestaetigen", "abgeholt", "zugestellt", "stornieren"];

export async function speditionMethode(client, { name, methode, args = {} }) {
  if (!SPEDITION_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) return client.runDocMethod("PH Speditionsauftrag", name, methode, args);
  const s = roh(client, "PH Speditionsauftrag", name);
  switch (methode) {
    case "per_email_senden":
      if (!s.spediteur_email) throw new BackofficeError("invalid", "Ohne E-Mail der Spedition nicht sendbar");
      await kommentar(client, "PH Speditionsauftrag", name, `Auftrag an ${args.an || s.spediteur_email} gesendet (Mock).`);
      return schreibe(client, "PH Speditionsauftrag", name, { status: "Gesendet" });
    case "bestaetigen":
      return schreibe(client, "PH Speditionsauftrag", name, { status: "Bestaetigt", preis_bestaetigt_cent: Number(args.preis_cent || 0), abhol_datum: args.abhol_datum || s.abhol_datum, zustell_datum: args.zustell_datum || s.zustell_datum, spediteur_referenz: args.referenz || s.spediteur_referenz });
    case "abgeholt":
      if (s.lieferschein && roh(client, "PH Lieferschein", s.lieferschein).status === "Gepackt") schreibe(client, "PH Lieferschein", s.lieferschein, { status: "Uebergeben", uebergeben_am: jetzt(client), uebergeben_an: "Spedition" });
      return schreibe(client, "PH Speditionsauftrag", name, { status: "Abgeholt" });
    case "zugestellt":
      if (s.lieferschein && client.tabelle("PH Lieferschein").get(s.lieferschein)?.status === "Uebergeben") schreibe(client, "PH Lieferschein", s.lieferschein, { status: "Zugestellt", zugestellt_am: jetzt(client), empfaenger_name: args.empfaenger_name || "" });
      if (s.richtung === "Hersteller an Lager") await aufgabe(client, { titel: `Wareneingang erfassen: ${name}`, referenz_doctype: "PH Speditionsauftrag", referenz_name: name });
      return schreibe(client, "PH Speditionsauftrag", name, { status: "Zugestellt" });
    case "stornieren":
      return schreibe(client, "PH Speditionsauftrag", name, { status: "Storniert", hinweise: `${s.hinweise || ""}\nStorno: ${args.grund || ""}`.trim() });
    default:
      return null;
  }
}

// --------------------------------------------------------------- Rücknahme --

export const RUECKNAHME_METHODEN = ["annehmen", "pruefung_buchen", "servicefall_anlegen", "abschliessen", "stornieren"];

export async function ruecknahmeMethode(client, { name, methode, args = {} }) {
  if (!RUECKNAHME_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) {
    if (methode === "pruefung_buchen" && args.positionen) {
      const d = await client.getDoc("PH Warenruecknahme", name);
      await client.save("PH Warenruecknahme", { name, positionen: args.positionen }, { modified: d.modified });
      const r = await client.runDocMethod("PH Warenruecknahme", name, "pruefung_buchen", {});
      await client.workflowAction("PH Warenruecknahme", name, "Prüfen").catch(() => null);
      return r;
    }
    return client.runDocMethod("PH Warenruecknahme", name, methode, args);
  }
  const w = roh(client, "PH Warenruecknahme", name);
  switch (methode) {
    case "annehmen":
      return schreibe(client, "PH Warenruecknahme", name, { status: "Angenommen", eingegangen_am: jetzt(client), unterschrift_name: args.unterschrift_name || "" });
    case "pruefung_buchen": {
      const pos = (args.positionen || w.positionen || []).map((p, i) => ({ ...(w.positionen || [])[i], ...p }));
      for (const p of pos) if (p.entscheidung === "Wiedereinlagern" || p.entscheidung === "B-Ware") bewegung(client, { art: "Retoure", produkt: p.produkt, produkt_name: p.produkt_name, menge: Number(p.menge || 1), lagerort_nach: w.lagerort || "", platz_nach: p.platz || "", bezug_doctype: "PH Warenruecknahme", bezug: name, grund: p.entscheidung });
      return schreibe(client, "PH Warenruecknahme", name, { positionen: pos, status: "Geprueft", geprueft_am: jetzt(client), geprueft_von: benutzer(client), alle_gebucht: 1 });
    }
    case "servicefall_anlegen":
      await kommentar(client, "PH Warenruecknahme", name, "Servicefall angelegt (Mock).");
      return { servicefall: "(Mock)" };
    case "abschliessen":
      return schreibe(client, "PH Warenruecknahme", name, { status: "Abgeschlossen", abgeschlossen_am: jetzt(client) });
    case "stornieren":
      return schreibe(client, "PH Warenruecknahme", name, { status: "Storniert", storno_grund: args.grund || "" });
    default:
      return null;
  }
}

// ----------------------------------------------------------------- Bestand --

export const BESTAND_METHODEN = ["umlagern", "reservieren", "freigeben", "sperren", "entsperren", "ausbuchen"];

export async function bestandMethode(client, { name, methode, args = {} }) {
  if (!BESTAND_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) return client.runDocMethod("PH Lagerbestand", name, methode, args);
  const b = roh(client, "PH Lagerbestand", name);
  const basis = { produkt: b.produkt, produkt_name: b.produkt_name, lagerbestand: name };
  switch (methode) {
    case "umlagern": {
      const nachOrt = args.lagerort_nach || b.lagerort;
      const nachPlatz = args.platz_nach ?? b.platz;
      const menge = Number(args.menge || b.menge);
      if (Number(b.gesperrt) && nachOrt !== b.lagerort) throw new BackofficeError("invalid", "Gesperrter Bestand bleibt am Lagerort – zuerst entsperren.");
      if (menge > Number(b.menge)) throw new BackofficeError("invalid", `Nur ${b.menge} am Platz.`);
      if (menge < Number(b.menge)) {
        schreibe(client, "PH Lagerbestand", name, bestandNeuRechnen({ ...b, menge: Number(b.menge) - menge }));
        const ziel = anlegen(client, "PH Lagerbestand", bestandNeuRechnen({ ...klon(b), name: undefined, menge, reserviert: 0, lagerort: nachOrt, platz: nachPlatz, status: "Verfuegbar" }));
        bewegung(client, { ...basis, art: "Umlagerung", lagerbestand: ziel.name, lagerbestand_von: name, menge, lagerort_von: b.lagerort, platz_von: b.platz, lagerort_nach: nachOrt, platz_nach: nachPlatz });
        return { umgelagert: menge, ziel: ziel.name };
      }
      schreibe(client, "PH Lagerbestand", name, { lagerort: nachOrt, platz: nachPlatz });
      bewegung(client, { ...basis, art: "Umlagerung", menge, lagerort_von: b.lagerort, platz_von: b.platz, lagerort_nach: nachOrt, platz_nach: nachPlatz });
      return { umgelagert: menge, von: { lagerort: b.lagerort, platz: b.platz } };
    }
    case "reservieren": {
      const menge = Number(args.menge || 1);
      if (Number(b.gesperrt) || b.status === "Kommission") throw new BackofficeError("invalid", b.status === "Kommission" ? "Kommissionsware ist bereits gebunden." : "Gesperrt – zuerst entsperren (Leitung)");
      if (menge > Number(b.verfuegbar)) throw new BackofficeError("invalid", `Nur ${b.verfuegbar} verfügbar.`);
      schreibe(client, "PH Lagerbestand", name, bestandNeuRechnen({ ...b, reserviert: Number(b.reserviert || 0) + menge, reserviert_fuer_doctype: args.bezug_doctype, reserviert_fuer: args.bezug, reserviert_bis: args.bis || "", reserviert_kontakt: args.kontakt || "", reserviert_kunde_name: args.kunde_name || "" }));
      bewegung(client, { ...basis, art: "Reservierung", menge, bezug_doctype: args.bezug_doctype, bezug: args.bezug });
      return { reserviert: menge };
    }
    case "freigeben": {
      const menge = Number(args.menge || b.reserviert || 0);
      schreibe(client, "PH Lagerbestand", name, bestandNeuRechnen({ ...b, reserviert: Math.max(Number(b.reserviert || 0) - menge, 0), ...(Number(b.reserviert || 0) - menge <= 0 ? { reserviert_fuer: "", reserviert_fuer_doctype: "", reserviert_bis: "", reserviert_kunde_name: "" } : {}) }));
      bewegung(client, { ...basis, art: "Freigabe", menge });
      return { freigegeben: menge };
    }
    case "sperren":
      return schreibe(client, "PH Lagerbestand", name, { gesperrt: 1, sperrgrund: args.grund, status: "Gesperrt", verfuegbar: 0, _vorher: b.status });
    case "entsperren":
      return schreibe(client, "PH Lagerbestand", name, bestandNeuRechnen({ ...b, gesperrt: 0, sperrgrund: "", status: b._vorher && b._vorher !== "Gesperrt" ? b._vorher : "Verfuegbar" }));
    case "ausbuchen": {
      const menge = Number(args.menge || 0);
      if (!(menge > 0) || menge > Number(b.verfuegbar)) throw new BackofficeError("invalid", "Menge größer als verfügbar – reservierte Menge zuerst freigeben.");
      const r = schreibe(client, "PH Lagerbestand", name, bestandNeuRechnen({ ...b, menge: Number(b.menge) - menge, ...(Number(b.menge) - menge <= 0 ? { ausgeschieden_am: heute(client) } : {}) }));
      bewegung(client, { ...basis, art: "Ausbuchung", menge: -menge, lagerort_von: b.lagerort, platz_von: b.platz, grund: args.grund });
      return r;
    }
    default:
      return null;
  }
}

/** Platz-QR → Bestände am Platz – `lager.platz_scan(code)`. */
export async function platzScan(client, { code }) {
  if (!istMock(client)) return client.call(M.platzScan, { code });
  const i = String(code).indexOf("/");
  const lagerort = String(code).slice(0, i);
  const platz = String(code).slice(i + 1);
  if (!client.tabelle("PH Lagerort").has(lagerort)) throw new BackofficeError("not_found", "Unbekannter Platz.");
  const bestaende = [...client.tabelle("PH Lagerbestand").values()].filter((b) => b.lagerort === lagerort && b.platz === platz && Number(b.menge) > 0).map(klon);
  return { lagerort, platz, bestaende };
}

/** Umlagern per Scan (Bestand → Platz-QR). */
export async function umlagernScan(client, { lagerbestand, platzCode, menge }) {
  if (!istMock(client)) return client.call(M.umlagernScan, { lagerbestand, platz_code: platzCode, menge });
  const i = String(platzCode).indexOf("/");
  return bestandMethode(client, { name: lagerbestand, methode: "umlagern", args: { lagerort_nach: String(platzCode).slice(0, i), platz_nach: String(platzCode).slice(i + 1), menge } });
}

export async function bewegungBuchen(client, { werte }) {
  const w = { naming_series: "PH-LBW-.YYYY.-.#####", status: "Gebucht", datum: jetzt(client), von_user: benutzer(client), quelle: "backoffice", ...werte };
  if (!istMock(client)) return client.insert("PH Lagerbewegung", w);
  const r = bewegung(client, w);
  if (werte.lagerbestand && client.tabelle("PH Lagerbestand").has(werte.lagerbestand)) {
    const b = roh(client, "PH Lagerbestand", werte.lagerbestand);
    const delta = werte.art === "Ausbuchung" ? -Math.abs(Number(werte.menge)) : werte.art === "Wareneingang" || werte.art === "Retoure" ? Math.abs(Number(werte.menge)) : 0;
    if (delta) schreibe(client, "PH Lagerbestand", b.name, bestandNeuRechnen({ ...b, menge: Number(b.menge) + delta }));
  }
  return r;
}

export async function bewegungStornieren(client, { name }) {
  if (!istMock(client)) return client.runDocMethod("PH Lagerbewegung", name, "stornieren", {});
  const b = roh(client, "PH Lagerbewegung", name);
  if (b.status === "Storniert") return klon(b);
  schreibe(client, "PH Lagerbewegung", name, { status: "Storniert" });
  const { name: _n, creation: _c, modified: _m, ...rest } = klon(b);
  return bewegung(client, { ...rest, status: "Gebucht", menge: -Number(b.menge), lagerort_von: b.lagerort_nach, platz_von: b.platz_nach, lagerort_nach: b.lagerort_von, platz_nach: b.platz_von, storno_von: name, titel: `Storno ${name}` });
}

/** Kommissionsliste – `lager.kommissionsliste(kommission)`. */
export async function kommissionsliste(client, { kommission }) {
  if (!istMock(client)) return client.call(M.kommissionsliste, { kommission });
  const im = [...client.tabelle("PH Lagerbestand").values()].filter((b) => b.kommission === kommission && Number(b.menge) > 0).map(klon);
  const hb = client.tabelle("PH Herstellerbestellung") ? [...client.tabelle("PH Herstellerbestellung").values()].filter((h) => h.kommission === kommission || h.projekt === kommission) : [];
  const erwartet = hb.flatMap((h) => (h.positionen || []).map((p) => ({ herstellerbestellung: h.name, bezeichnung: p.bezeichnung || p.beschreibung || "Position", menge: p.menge, liefertermin: h.liefertermin || h.voraussichtlich_am || "" })));
  return { kommission, im_lager: im, erwartet, summe_stueck: im.reduce((s, b) => s + Number(b.menge), 0) };
}

// ------------------------------------------------------------------ Inventur --

function invPos(inv, lagerbestand) {
  return (inv.positionen || []).find((p) => p.lagerbestand === lagerbestand || p.name === lagerbestand);
}

function invZusammen(pos) {
  return { anzahl_positionen: pos.length, anzahl_gezaehlt: pos.filter((p) => Number(p.gezaehlt)).length, differenz_positionen: pos.filter((p) => (differenz(p) ?? 0) !== 0).length, differenz_summe: pos.reduce((s, p) => s + (differenz(p) ?? 0), 0) };
}

export async function inventurAnlegen(client, { lagerort, datum, nurAusstellung = false, art = "Stichtag", plaetze = "", anlass = "" }) {
  const werte = { naming_series: "PH-INV-.YYYY.-.####", titel: `${art === "Teilinventur" ? "Teilinventur" : "Inventur"} ${lagerort}`, status: "Geplant", lagerort, datum, inventur_art: art, plaetze, anlass, nur_ausstellungsstuecke: nurAusstellung ? 1 : 0, positionen: [], quelle: "backoffice" };
  const neu = istMock(client) ? anlegen(client, "PH Inventur", werte) : await client.insert("PH Inventur", werte);
  await inventurMethode(client, { name: neu.name, methode: "zaehlliste_erzeugen" });
  return neu;
}

export async function teilinventurAnlegen(client, { lagerort, anzahl }) {
  if (!istMock(client)) return client.call(M.teilinventur, { lagerort, anzahl });
  const l = roh(client, "PH Lagerort", lagerort);
  const vorschlag = plaetzeVorschlagen(platzListe([l]), heute(client), 1, Number(anzahl) || 8).map((p) => p.platz);
  const inv = await inventurAnlegen(client, { lagerort, datum: heute(client), art: "Teilinventur", plaetze: vorschlag.join("\n") });
  return { inventur: inv.name, plaetze: vorschlag };
}

export const INVENTUR_METHODEN = ["zaehlliste_erzeugen", "starten", "zaehlen", "zaehlen_plus", "position_hinzufuegen", "verwerfen", "freigeben", "plaetze_vorschlagen"];

export async function inventurMethode(client, { name, methode, args = {} }) {
  if (!INVENTUR_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) {
    if (methode === "zaehlen") return client.call(M.invZaehlen, { inventur: name, lagerbestand: args.lagerbestand, ist: args.ist, idempotency_key: args.idempotency });
    if (methode === "zaehlen_plus") return client.call(M.invZaehlenPlus, { inventur: name, code: args.code, anzahl: args.anzahl || 1, idempotency_key: args.idempotency });
    if (methode === "position_hinzufuegen") return client.call(M.invFund, { inventur: name, ...args });
    if (methode === "starten") return client.call(M.invStarten, { inventur: name });
    return client.runDocMethod("PH Inventur", name, methode, args);
  }
  const inv = roh(client, "PH Inventur", name);
  switch (methode) {
    case "zaehlliste_erzeugen": {
      if (inv.status !== "Geplant") throw new BackofficeError("invalid", "Zählliste nur in „Geplant“.");
      const plaetze = new Set(platzliste(inv.plaetze));
      const bestaende = [...client.tabelle("PH Lagerbestand").values()].filter((b) => b.lagerort === inv.lagerort && !["Verkauft", "Ausgeschieden"].includes(b.status) && (!Number(inv.nur_ausstellungsstuecke) || Number(b.ausstellungsstueck)) && (!plaetze.size || plaetze.has(b.platz || "(ohne Platz)")));
      const pos = bestaende.map((b) => ({ lagerbestand: b.name, produkt: b.produkt, produkt_name: b.produkt_name, platz: b.platz, seriennummer: b.seriennummer || "", ean: b.ean || "", fund: 0, soll: Number(b.menge), ist: 0, gezaehlt: 0, differenz: 0, grund: "", bemerkung: "" }));
      return schreibe(client, "PH Inventur", name, { positionen: pos.map((p, i) => ({ ...p, doctype: "PH Inventur Position", name: `${name}-positionen-${i + 1}`, idx: i + 1, parentfield: "positionen", parenttype: "PH Inventur" })), ...invZusammen(pos) });
    }
    case "starten":
      if (inv.status !== "Geplant") return { status: inv.status };
      await kommentar(client, "PH Inventur", name, "Zählung gestartet");
      return schreibe(client, "PH Inventur", name, { status: "Laufend", gezaehlt_von: inv.gezaehlt_von || benutzer(client) });
    case "zaehlen": {
      if (inv.status !== "Laufend") throw new BackofficeError("invalid", "Zählen geht nur bei laufender Zählung.");
      if (args.idempotency && inv.idempotency_key === args.idempotency) return { wiederholt: true };
      const p = invPos(inv, args.lagerbestand);
      if (!p) throw new BackofficeError("not_found", "Nicht in dieser Zählliste");
      const ist = Math.max(0, Math.trunc(Number(args.ist)));
      const pos = inv.positionen.map((x) => (x === p ? { ...x, ist, gezaehlt: 1, differenz: ist - Number(x.soll || 0), grund: args.grund ?? x.grund, bemerkung: args.bemerkung ?? x.bemerkung } : x));
      schreibe(client, "PH Inventur", name, { positionen: pos, ...invZusammen(pos), gezaehlt_von: inv.gezaehlt_von || benutzer(client), idempotency_key: args.idempotency || inv.idempotency_key || "" });
      const q = pos.find((x) => x.lagerbestand === p.lagerbestand);
      return { position: q, differenz: q.differenz };
    }
    case "zaehlen_plus": {
      const c = String(args.code || "").trim();
      const p = (inv.positionen || []).find((x) => x.lagerbestand === c || (x.seriennummer && x.seriennummer === c) || (x.ean && x.ean === c));
      if (!p) throw new BackofficeError("not_found", "Nicht in dieser Zählliste");
      return inventurMethode(client, { name, methode: "zaehlen", args: { lagerbestand: p.lagerbestand, ist: Number(p.ist || 0) + Number(args.anzahl || 1), idempotency: args.idempotency } });
    }
    case "position_hinzufuegen": {
      if (args.lagerbestand) {
        const b = client.tabelle("PH Lagerbestand").get(args.lagerbestand);
        if (b && b.lagerort !== inv.lagerort) throw new BackofficeError("invalid", `${b.produkt_name || b.name} gehört zu ${b.lagerort} – bitte zuerst umlagern.`);
      }
      const pos = [...(inv.positionen || []), { doctype: "PH Inventur Position", name: `${name}-positionen-${(inv.positionen || []).length + 1}`, lagerbestand: args.lagerbestand || "", produkt: args.produkt || "", produkt_name: args.produkt_name || args.seriennummer || "Fund", platz: args.platz || "", seriennummer: args.seriennummer || "", ean: args.ean || "", fund: 1, soll: 0, ist: Number(args.ist || 1), gezaehlt: 1, differenz: Number(args.ist || 1), grund: "", bemerkung: args.bemerkung || "Fund", idx: (inv.positionen || []).length + 1, parentfield: "positionen", parenttype: "PH Inventur" }];
      return schreibe(client, "PH Inventur", name, { positionen: pos, ...invZusammen(pos) });
    }
    case "freigeben": {
      const diffs = (inv.positionen || []).filter((p) => (differenz(p) ?? 0) !== 0);
      for (const p of diffs) {
        const b = p.lagerbestand ? client.tabelle("PH Lagerbestand").get(p.lagerbestand) : null;
        if (b) schreibe(client, "PH Lagerbestand", b.name, bestandNeuRechnen({ ...b, menge: Number(p.ist), inventur_am: heute(client) }));
        bewegung(client, { art: "Inventur", lagerbestand: p.lagerbestand, produkt: p.produkt, produkt_name: p.produkt_name, menge: differenz(p), lagerort_nach: inv.lagerort, platz_nach: p.platz, grund: p.grund, bezug_doctype: "PH Inventur", bezug: name });
      }
      const l = client.tabelle("PH Lagerort").get(inv.lagerort);
      if (l) {
        const gez = new Set((inv.positionen || []).filter((p) => Number(p.gezaehlt)).map((p) => p.platz));
        schreibe(client, "PH Lagerort", l.name, { zuletzt_gezaehlt: heute(client), zuletzt_inventur: name, plaetze: (l.plaetze || []).map((p) => (gez.has(p.platz) ? { ...p, zuletzt_gezaehlt: heute(client), zuletzt_inventur: name } : p)) });
      }
      schreibe(client, "PH Inventur", name, { status: "Abgeschlossen", freigegeben_von: benutzer(client), freigegeben_am: jetzt(client), gezaehlte_plaetze: [...new Set((inv.positionen || []).filter((p) => Number(p.gezaehlt)).map((p) => p.platz))].join("\n") });
      return { bewegungen: diffs.length };
    }
    case "verwerfen":
      return schreibe(client, "PH Inventur", name, { status: "Verworfen" });
    case "plaetze_vorschlagen": {
      const l = roh(client, "PH Lagerort", inv.lagerort);
      return plaetzeVorschlagen(platzListe([l]), heute(client), 1, Number(args.anzahl) || 8).map((p) => p.platz);
    }
    default:
      return null;
  }
}

export async function inventurGrund(client, { name, lagerbestand, grund, bemerkung }) {
  if (!istMock(client)) {
    const inv = await client.getDoc("PH Inventur", name);
    const pos = (inv.positionen || []).map((p) => (p.lagerbestand === lagerbestand ? { ...p, grund, bemerkung: bemerkung ?? p.bemerkung } : p));
    return client.save("PH Inventur", { name, positionen: pos }, { modified: inv.modified });
  }
  const inv = roh(client, "PH Inventur", name);
  return schreibe(client, "PH Inventur", name, { positionen: (inv.positionen || []).map((p) => (p.lagerbestand === lagerbestand ? { ...p, grund, bemerkung: bemerkung ?? p.bemerkung } : p)) });
}

// -------------------------------------------------------- Inventurbewertung --

export const BEWERTUNG_METHODEN = ["berechnen", "festschreiben", "verwerfen", "csv_exportieren"];

export async function bewertungAnlegen(client, { stichtag, lagerort = "", methode }) {
  const werte = { naming_series: "PH-IB-.YYYY.-.####", titel: `Inventurbewertung ${stichtag}`, status: "Entwurf", stichtag, lagerort, methode: methode || "Gleitender Durchschnitt", abwertung_platzhalter: 1, positionen: [], quelle: "backoffice" };
  const neu = istMock(client) ? anlegen(client, "PH Inventurbewertung", werte) : await client.insert("PH Inventurbewertung", werte);
  await bewertungMethode(client, { name: neu.name, methode: "berechnen" });
  return neu;
}

export async function bewertungMethode(client, { name, methode }) {
  if (!BEWERTUNG_METHODEN.includes(methode)) throw new BackofficeError("invalid", "Unbekannte Aktion.");
  if (!istMock(client)) return client.runDocMethod("PH Inventurbewertung", name, methode, {});
  const ib = roh(client, "PH Inventurbewertung", name);
  if (ib.status !== "Entwurf" && methode !== "csv_exportieren") throw new BackofficeError("forbidden", "Festgeschrieben – unveränderlich");
  switch (methode) {
    case "berechnen": {
      const bestaende = [...client.tabelle("PH Lagerbestand").values()].filter((b) => !ib.lagerort || b.lagerort === ib.lagerort);
      const z = bewertungsZeilen(bestaende, ib.stichtag);
      return schreibe(client, "PH Inventurbewertung", name, {
        positionen: z.map(({ niederstwert: _n, ...r }, i) => ({ ...r, doctype: "PH Inventurbewertung Position", name: `${name}-positionen-${i + 1}`, idx: i + 1, parentfield: "positionen", parenttype: "PH Inventurbewertung" })),
        anzahl_positionen: z.length, menge_gesamt: z.reduce((s, x) => s + x.menge, 0), ohne_ek: z.filter((x) => !x.einstandspreis_cent).length, wert_ak_cent: z.reduce((s, x) => s + x.wert_ak_cent, 0), abwertung_cent: z.reduce((s, x) => s + x.abwertung_cent, 0), wert_cent: z.reduce((s, x) => s + x.wert_cent, 0), berechnet_am: jetzt(client), erstellt_von: benutzer(client),
      });
    }
    case "festschreiben":
      return schreibe(client, "PH Inventurbewertung", name, { status: "Festgeschrieben", festgeschrieben_von: benutzer(client), festgeschrieben_am: jetzt(client) });
    case "verwerfen":
      return schreibe(client, "PH Inventurbewertung", name, { status: "Verworfen" });
    case "csv_exportieren":
      return { datei: null };
    default:
      return null;
  }
}

// ------------------------------------------------------------ Nachbestellung --

export async function nachbestellen(client, { namen, idempotency }) {
  if (!istMock(client)) return client.call(M.nachbestellen, { namen: JSON.stringify(namen), idempotency_key: idempotency });
  const out = [];
  for (const n of namen) {
    const v = roh(client, "PH Bestellvorschlag", n);
    if (v.status !== "Offen") continue;
    schreibe(client, "PH Bestellvorschlag", n, { status: "Bestellt", bestellt_am: jetzt(client), bestellt_von: benutzer(client) });
    out.push(n);
  }
  return { bestellt: out, herstellerbestellungen: [] };
}

// --------------------------------------------------------------- Stammdaten --

export const STAMMDATEN_DOCTYPES = ["PH Lagerort", "PH Fahrzeug", "PH Paketprofil", "PH Packplatz", "PH Logistik Einstellungen"];

export async function stammdatenSpeichern(client, { doctype, werte, modified, neu = false }) {
  if (!STAMMDATEN_DOCTYPES.includes(doctype)) throw new BackofficeError("invalid", "Unbekannte Stammdaten.");
  if (neu) return client.insert(doctype, werte);
  return client.save(doctype, werte, { modified });
}
