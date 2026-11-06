// Mock-Pfad der ph_service-Methoden (Bauauftrag §14: „Mock-Modus Pflicht“). Der MockClient des Fundaments kennt
// nur generische Methoden (runDocMethod protokolliert ohne Wirkung) – hier stehen die Wirkungen der App-Methoden
// nachgebaut, so wie ph_service sie ausführt (Felder, Status, Verlauf, Folge-Datensätze). Im Frappe-Modus wird
// dieses Modul nie benutzt; dort laufen die echten Methoden (runDocMethod / call).
// Reines Modul (keine "@/"-Importe), testbar mit node --test.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatumZeit } from "../format.js";
import { naechsterSchritt } from "./naechsterSchritt.js";
import { fallZaehler } from "./regeln.js";
import { fristen, monateDazu, iso } from "./fristen.js";
import serviceNachlauf, { SEED_VERSION } from "../mock/seed/service.js";
import { rng, tage as seedTage } from "../mock/seed/basis.js";
import { neuerName } from "../mock/engine.js";

/**
 * Lang laufender Dev-Server: die Mock-Datenbank lebt im Prozess (globalThis) und wurde ggf. vor dem Service-Seed
 * gebaut. Fehlt die Seed-Version, legt der Service-Nachlauf seine Tabellen einmal neu an (nur Service-DocTypes und
 * die zwei zusätzlichen Techniker-Benutzer; andere Bereiche bleiben unberührt).
 */
export function sichereServiceSeed(client) {
  const db = client?.db?.db;
  if (!db || client.modus === "frappe" || db.__serviceSeed === SEED_VERSION) return false;
  const zaehler = client.db.zaehler || new Map();
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  serviceNachlauf(db, { rng: rng(4242), tage: seedTage, index: client.index, tabelle, naechste: (prefix) => { const n = (zaehler.get(prefix) || 0) + 1; zaehler.set(prefix, n); return n; }, erzeugeDokument: null, neuerName, kontakte: [...tabelle("PH Kontakt").values()] });
  return true;
}

const TAG_MS = 86_400_000;

function jetzt(client) {
  return isoDatumZeit(client.jetzt ? client.jetzt() : new Date());
}
function heute(client) {
  return jetzt(client).slice(0, 10);
}
function cent(n) {
  return `${((Number(n) || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
function fehler(text, code = "invalid") {
  return new BackofficeError(code, text);
}
function istLeitung(session) {
  const r = session?.roles || [];
  return r.includes("PH Service Leitung") || r.includes("System Manager") || r.includes("Administrator");
}

/** Direkter Zugriff auf eine Tabelle des Mock (ohne Rechteprüfung – die Action hat vorher geprüft). */
function tab(client, dt) {
  return client.tabelle(dt);
}
async function hole(client, dt, name) {
  const doc = tab(client, dt).get(name);
  if (!doc) throw fehler(`${dt} ${name} wurde nicht gefunden.`, "not_found");
  return JSON.parse(JSON.stringify(doc));
}

/** Verlaufszeile anhängen (wie kom.verlauf). */
function verlaufZeile(client, fall, ereignis, hinweis, status = fall.status) {
  const v = [...(fall.verlauf || [])];
  v.push({ doctype: "PH Servicefall Verlauf", idx: v.length + 1, parentfield: "verlauf", parenttype: "PH Servicefall", zeit: jetzt(client), ereignis, status, hinweis, von: client.session?.user || "" });
  return v;
}

async function setze(client, dt, name, werte) {
  return client.setValue(dt, name, werte);
}

/** Status ohne Workflow-Klick (wie _status_setzen in ph_servicefall.py). */
async function fallStatus(client, fall, status, hinweis) {
  const t = tab(client, "PH Servicefall");
  const alt = t.get(fall.name);
  const neu = { ...alt, status, workflow_state: `PH ${status}`, verlauf: hinweis ? verlaufZeile(client, alt, "Notiz", hinweis, status) : alt.verlauf };
  client.stempel(neu);
  t.set(fall.name, neu);
  client.version("PH Servicefall", fall.name, alt, neu);
  return neu;
}

async function workflow(client, dt, name, aktion) {
  return client.workflowAction(dt, name, aktion);
}

function einstellungen(client) {
  return tab(client, "PH Service Einstellungen").get("PH Service Einstellungen") || {};
}

// --------------------------------------------------------------- Servicefall --

const FALL = {
  async erstreaktion_erfassen(client, fall, { kanal = "Telefon", notiz = "" } = {}) {
    if (!["Telefon", "Vor Ort", "Rückruf", "E-Mail", "Portal"].includes(kanal)) throw fehler("Unbekannter Kanal.");
    if (fall.erstreaktion_am) return fall.erstreaktion_am;
    await setze(client, "PH Servicefall", fall.name, { erstreaktion_am: jetzt(client), erstreaktion_kanal: kanal, erstreaktion_notiz: String(notiz || "").slice(0, 140), verlauf: verlaufZeile(client, fall, "Kommunikation", `Erstreaktion per ${kanal}${notiz ? `: ${notiz}` : ""}`) });
    return jetzt(client);
  },

  async kunde_informieren(client, fall, { vorlage = "eingang", zusatz = "", betreff = null } = {}) {
    if (!["eingang", "termin", "abschluss", "ablehnung", "frei"].includes(vorlage)) throw fehler("Unbekannte Vorlage.");
    if (vorlage === "frei" && !String(zusatz || "").trim()) throw fehler("Nachricht eingeben.");
    if (!fall.kunde_email) throw fehler("Keine E-Mail-Adresse am Fall hinterlegt.");
    const werte = { kunde_informiert_am: jetzt(client), verlauf: verlaufZeile(client, fall, "Kommunikation", `Mail an ${fall.kunde_email} (Vorlage ${vorlage})${zusatz ? " mit Zusatztext" : ""}`) };
    if (!fall.erstreaktion_am) Object.assign(werte, { erstreaktion_am: jetzt(client), erstreaktion_kanal: "E-Mail" });
    await setze(client, "PH Servicefall", fall.name, werte);
    return betreff || `Ihre Servicemeldung ${fall.name}`;
  },

  async kulanz_anfordern(client, fall) {
    if (fall.kulanz_freigabe_status !== "Angefordert") throw fehler("Für diesen Betrag ist keine Freigabe nötig oder sie liegt bereits vor.");
    await setze(client, "PH Servicefall", fall.name, { verlauf: verlaufZeile(client, fall, "Kulanz", "Kulanz-Freigabe erneut angefragt") });
    return fall.kulanz_freigabe_status;
  },

  async kulanz_freigeben(client, fall, { kommentar = "", betrag_cent = null } = {}) {
    if (!istLeitung(client.session)) throw fehler("Kulanz freigeben darf nur die Service-Leitung.", "forbidden");
    if (betrag_cent !== null && betrag_cent !== "" && Number(betrag_cent) !== Number(fall.kulanz_cent)) throw fehler(`Der Kulanzbetrag wurde inzwischen auf ${cent(fall.kulanz_cent)} geändert – bitte neu prüfen.`, "conflict");
    await setze(client, "PH Servicefall", fall.name, { kulanz_freigabe_status: "Freigegeben", kulanz_freigegeben_von: client.session.user, kulanz_freigegeben_am: jetzt(client), kulanz_freigegeben_cent: Number(fall.kulanz_cent) || 0, kulanz_abgelehnt_cent: 0, kulanz_freigabe_kommentar: kommentar || "", verlauf: verlaufZeile(client, fall, "Kulanz", `Kulanz ${cent(fall.kulanz_cent)} freigegeben${kommentar ? `: ${kommentar}` : ""}`) });
    return "Freigegeben";
  },

  async kulanz_ablehnen(client, fall, { grund = "" } = {}) {
    if (!istLeitung(client.session)) throw fehler("Kulanz ablehnen darf nur die Service-Leitung.", "forbidden");
    if (!String(grund).trim()) throw fehler("Grund angeben.");
    await setze(client, "PH Servicefall", fall.name, { kulanz_freigabe_status: "Abgelehnt", kulanz_abgelehnt_cent: Number(fall.kulanz_cent) || 0, kulanz_freigabe_kommentar: String(grund).slice(0, 500), verlauf: verlaufZeile(client, fall, "Kulanz", `Kulanz ${cent(fall.kulanz_cent)} abgelehnt: ${grund}`) });
    return "Abgelehnt";
  },

  async einsatz_anlegen(client, fall, { datum, zeit_von = null, zeit_bis = null, techniker = null, hinweis = null, art = "Reparatur" } = {}) {
    if (!datum) throw fehler("Datum fehlt.");
    const e = await client.insert("PH Serviceeinsatz", { status: "Geplant", art, servicefall: fall.name, kontakt: fall.kontakt, kunde_name: fall.kunde_name, techniker: techniker || einstellungen(client).techniker_standard || "techniker@demo.local", datum, zeit_von, zeit_bis, hinweis_intern: hinweis || "", strasse: fall.einsatz_strasse, plz: fall.einsatz_plz, ort: fall.einsatz_ort, land: fall.einsatz_land, titel: `${art}: ${fall.kunde_name || ""} – ${fall.produkt_name || ""}` });
    if (fall.entscheidung && ["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung"].includes(fall.status)) await fallStatus(client, fall, "Einsatz geplant", `Einsatz ${e.name} am ${datum}`);
    else await setze(client, "PH Servicefall", fall.name, { verlauf: verlaufZeile(client, fall, "Einsatz", `Einsatz ${e.name} am ${datum}`) });
    return e.name;
  },

  async ersatzteile_bestellen(client, fall, { lieferant = null, zeilen = null, lieferadresse = null, wunschtermin = null } = {}) {
    const auswahl = Array.isArray(zeilen) ? zeilen.map(String) : null;
    const offen = (fall.ersatzteile || []).filter((z, i) => z.status === "Benoetigt" && !z.bestellung && (!auswahl?.length || auswahl.includes(String(z.name || z.idx || i + 1))));
    if (!offen.length) throw fehler("Keine Ersatzteil-Zeile mit Status „Benötigt“ ohne Bestellung.");
    const l = lieferant || fall.lieferant;
    if (!l) throw fehler("Lieferant fehlt (am Servicefall oder im Dialog).");
    const b = await client.insert("PH Ersatzteilbestellung", { status: "Entwurf", lieferant: l, marke: fall.marke, servicefall: fall.name, kostentraeger: offen[0].kostentraeger || "Gewaehrleistung", kommission: `${fall.name} / ${fall.kunde_name || ""}`.slice(0, 140), lieferadresse: lieferadresse || "Lager", datum: heute(client), positionen: offen.map((z, i) => ({ idx: i + 1, ersatzteil: z.ersatzteil, bezeichnung: z.bezeichnung, hersteller_nr: z.hersteller_nr, menge: z.menge || 1, menge_erhalten: 0, servicefall_zeile: String(z.name || z.idx), wunschtermin, ek_cent: z.ek_cent || 0 })), titel: `${l}: ${offen.map((z) => z.bezeichnung).join(", ")}`.slice(0, 140) });
    const neu = (fall.ersatzteile || []).map((z) => (offen.includes(z) ? { ...z, status: "Bestellt", bestellung: b.name } : z));
    await setze(client, "PH Servicefall", fall.name, { ersatzteile: neu, verlauf: verlaufZeile(client, fall, "Ersatzteil", `Ersatzteilbestellung ${b.name} (${offen.length} Positionen)`) });
    return b.name;
  },

  async regress_anlegen(client, fall, { betrag_cent = null } = {}) {
    if (!fall.lieferant) throw fehler("Lieferant fehlt – Regress braucht einen Vormann (§ 933b ABGB).");
    const vorhanden = [...tab(client, "PH Lieferantenregress").values()].find((r) => r.servicefall === fall.name && !["Abgelehnt", "Verrechnet"].includes(r.status));
    if (vorhanden) return vorhanden.name;
    const betrag = betrag_cent === null ? Number(fall.kosten_gesamt_cent) || 0 : Number(betrag_cent) || 0;
    const r = await client.insert("PH Lieferantenregress", { status: "Offen", workflow_state: "PH Regress offen", servicefall: fall.name, lieferant: fall.lieferant, marke: fall.marke, betrag_gefordert_cent: betrag, beschreibung: String(fall.beschreibung || "").replace(/<[^>]+>/g, "").slice(0, 2000), frist_bis: fall.regress_frist_bis || "", abgleich_status: "Offen", titel: `Regress ${fall.kunde_name || ""} – ${fall.lieferant}` });
    const f2 = await hole(client, "PH Servicefall", fall.name);
    await setze(client, "PH Servicefall", fall.name, { regress_status: "Offen", verlauf: verlaufZeile(client, f2, "Regress", `Regress ${r.name} angelegt (${cent(betrag)})`) });
    return r.name;
  },

  async lieferant_informieren(client, fall, { empfaenger = null, zusatz = "" } = {}) {
    if (!fall.lieferant) throw fehler("Lieferant fehlt.");
    if (!empfaenger) throw fehler("Keine E-Mail des Lieferanten bekannt – bitte im Dialog eingeben.");
    let regress = null;
    if (Number(fall.lieferantenrelevant) || fall.art === "Transportschaden") regress = await FALL.regress_anlegen(client, fall, {});
    if (regress) {
      const r = await hole(client, "PH Lieferantenregress", regress);
      if (r.status === "Offen" && Number(r.betrag_gefordert_cent) >= 0) {
        // Mock: Anzeige an den Lieferanten = „Beim Lieferanten melden“ (Workflow verlangt Betrag + Beschreibung).
        await setze(client, "PH Lieferantenregress", regress, { gemeldet_am: heute(client), betrag_gefordert_cent: Number(r.betrag_gefordert_cent) || 1, beschreibung: r.beschreibung || fall.titel });
        try {
          await workflow(client, "PH Lieferantenregress", regress, "Beim Lieferanten melden");
        } catch {
          /* Bedingung nicht erfüllt → bleibt Offen */
        }
      }
    }
    const f2 = await hole(client, "PH Servicefall", fall.name);
    await setze(client, "PH Servicefall", fall.name, { regress_status: regress ? "Gemeldet" : f2.regress_status, verlauf: verlaufZeile(client, f2, "Kommunikation", `Mängelanzeige an ${empfaenger} (Vorlage regress)${zusatz ? " mit Zusatztext" : ""}`) });
    return regress;
  },

  async erledigt_melden(client, fall, { abschlussbericht = null } = {}) {
    if (abschlussbericht) await setze(client, "PH Servicefall", fall.name, { abschlussbericht });
    const f2 = await hole(client, "PH Servicefall", fall.name);
    if (!f2.abschlussbericht) throw fehler("Abschlussbericht fehlt.");
    await workflow(client, "PH Servicefall", fall.name, "Erledigt melden");
    const erledigt = jetzt(client);
    const f3 = await hole(client, "PH Servicefall", fall.name);
    const tage = Math.max(0, Math.round((Date.parse(erledigt.slice(0, 10)) - Date.parse(String(f3.gemeldet_am).slice(0, 10))) / TAG_MS));
    await setze(client, "PH Servicefall", fall.name, { erledigt_am: erledigt, dauer_tage: tage, regress_frist_bis: iso(monateDazu(erledigt, 2)), sla_status: "Erfuellt" });
    return "Erledigt";
  },

  async ablehnen(client, fall, { grund, begruendung, kunde_informieren = 0 } = {}) {
    if (!istLeitung(client.session)) throw fehler("Ablehnen darf nur die Service-Leitung.", "forbidden");
    if (!grund || !String(begruendung || "").trim()) throw fehler("Grund und Begründung angeben.");
    await setze(client, "PH Servicefall", fall.name, { ablehnungsgrund: grund, entscheidung: "Abgelehnt", entscheidung_begruendung: begruendung, abschlussbericht: fall.abschlussbericht || `Abgelehnt: ${grund}. ${begruendung}` });
    await workflow(client, "PH Servicefall", fall.name, "Ablehnen");
    if (Number(kunde_informieren) && fall.kunde_email) await FALL.kunde_informieren(client, await hole(client, "PH Servicefall", fall.name), { vorlage: "ablehnung" });
    return "Abgelehnt";
  },

  async abnahme_erfassen(client, fall, { name, unterschrift = null, zufriedenheit = null, kommentar = null } = {}) {
    if (Number(fall.abnahme_bestaetigt) && !istLeitung(client.session)) throw fehler("Abnahme liegt bereits vor.", "conflict");
    await setze(client, "PH Servicefall", fall.name, { abnahme_bestaetigt: 1, abnahme_am: jetzt(client), abnahme_name: name || fall.kunde_name, abnahme_unterschrift: unterschrift || "", zufriedenheit: zufriedenheit ?? fall.zufriedenheit, zufriedenheit_kommentar: kommentar || "", verlauf: verlaufZeile(client, fall, "Kommunikation", `Abnahme bestätigt (${name || fall.kunde_name})`) });
    return true;
  },

  async neu_oeffnen(client, fall, { grund = "" } = {}) {
    if (!istLeitung(client.session)) throw fehler("Wieder öffnen darf nur die Service-Leitung.", "forbidden");
    await workflow(client, "PH Servicefall", fall.name, "Wieder öffnen");
    const f2 = await hole(client, "PH Servicefall", fall.name);
    await setze(client, "PH Servicefall", fall.name, { verlauf: verlaufZeile(client, f2, "Status", `Wieder geöffnet: ${grund}`) });
    return f2.status;
  },
};

// ---------------------------------------------------------------- Einsatz --

async function einsatzStatus(client, e, status, werte = {}, hinweis = "") {
  await client.setValue("PH Serviceeinsatz", e.name, { ...werte, status });
  if (e.servicefall && tab(client, "PH Servicefall").has(e.servicefall)) {
    const f = await hole(client, "PH Servicefall", e.servicefall);
    await setze(client, "PH Servicefall", f.name, { verlauf: verlaufZeile(client, f, "Einsatz", hinweis || `Einsatz ${e.name}: ${status}`) });
  }
}

/** Fall zurück in Bearbeitung, wenn kein Einsatz mehr offen ist (ereignisse.serviceeinsatz_aktualisiert). */
async function fallNachEinsatz(client, e) {
  if (!e.servicefall || !tab(client, "PH Servicefall").has(e.servicefall)) return;
  const f = await hole(client, "PH Servicefall", e.servicefall);
  const offen = [...tab(client, "PH Serviceeinsatz").values()].some((x) => x.servicefall === f.name && x.name !== e.name && ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"].includes(x.status));
  if (f.status === "Einsatz geplant" && !offen) await fallStatus(client, f, "In Bearbeitung", `Einsatz ${e.name} beendet`);
}

const EINSATZ = {
  async bestaetigen(client, e) {
    if (!["Geplant"].includes(e.status)) throw fehler("Nur geplante Einsätze können bestätigt werden.");
    await einsatzStatus(client, e, "Bestaetigt", { bestaetigt_kunde_am: jetzt(client) }, `Einsatz ${e.name}: Kunde hat bestätigt`);
    return "Bestaetigt";
  },
  async unterwegs(client, e) {
    if (!["Geplant", "Bestaetigt"].includes(e.status)) throw fehler("Der Einsatz ist nicht mehr geplant.");
    await einsatzStatus(client, e, "Unterwegs", {}, `Einsatz ${e.name}: Techniker unterwegs`);
    return "Unterwegs";
  },
  async starten(client, e) {
    if (!["Geplant", "Bestaetigt", "Unterwegs"].includes(e.status)) throw fehler("Der Einsatz kann nicht gestartet werden.");
    await einsatzStatus(client, e, "In Arbeit", { ankunft: jetzt(client) }, `Einsatz ${e.name}: Ankunft gemeldet`);
    return "In Arbeit";
  },
  async nicht_angetroffen(client, e, { hinweis = "" } = {}) {
    await einsatzStatus(client, e, "Nicht angetroffen", { bericht: hinweis, folgeeinsatz_noetig: 1 }, `Einsatz ${e.name}: nicht angetroffen${hinweis ? ` (${hinweis})` : ""}`);
    await fallNachEinsatz(client, e);
    return "Nicht angetroffen";
  },
  async abschliessen(client, e, { ergebnis, bericht = null, unterschrift = null, unterschrift_name = null, zufriedenheit = null, pause_min = 0, unterschrift_art = null } = {}) {
    if (!ergebnis) throw fehler("Ergebnis wählen.");
    if (["Erledigt", "Abgebrochen"].includes(e.status)) return e.name; // idempotent
    const ankunft = e.ankunft || jetzt(client);
    const ende = jetzt(client);
    const brutto = Math.max(0, Math.round((Date.parse(ende.replace(" ", "T")) - Date.parse(String(ankunft).replace(" ", "T"))) / 60_000));
    const arbeit = Math.max(0, brutto - (Number(pause_min) || 0));
    const takt = Number(einstellungen(client).einsatz_takt_min) || 15;
    await einsatzStatus(client, e, "Erledigt", { ergebnis, bericht: bericht || "", unterschrift_kunde: unterschrift || "", unterschrift_name: unterschrift_name || "", unterschrift_art: unterschrift_art || "", unterschrift_am: jetzt(client), zufriedenheit: zufriedenheit ?? 0, ankunft, abfahrt: ende, zeit_pause_min: Number(pause_min) || 0, zeit_arbeit_min: arbeit, zeit_abrechenbar_min: Math.ceil(arbeit / takt) * takt, folgeeinsatz_noetig: ["Weiterer Einsatz noetig", "Ersatzteil noetig"].includes(ergebnis) ? 1 : 0 }, `Einsatz ${e.name} abgeschlossen: ${ergebnis}`);
    await fallNachEinsatz(client, e);
    return e.name;
  },
  async bericht_senden(client, e) {
    await client.setValue("PH Serviceeinsatz", e.name, { bericht_gesendet_am: jetzt(client) });
    return true;
  },
  async umplanen(client, e, { datum, zeit_von = null, zeit_bis = null, techniker = null, grund = null } = {}) {
    if (!["Geplant", "Bestaetigt"].includes(e.status)) throw fehler("Läuft – Verschieben nicht möglich.");
    if (!datum) throw fehler("Datum fehlt.");
    await einsatzStatus(client, e, "Geplant", { datum, zeit_von: zeit_von || e.zeit_von, zeit_bis: zeit_bis || e.zeit_bis, techniker: techniker || e.techniker, bestaetigt_kunde_am: "", umgeplant_am: jetzt(client) }, `Einsatz ${e.name} umgeplant auf ${datum}${grund ? ` (${grund})` : ""}`);
    return "Geplant";
  },
  async abbrechen(client, e, { grund = "" } = {}) {
    if (!String(grund).trim()) throw fehler("Grund angeben.");
    if (["Erledigt", "Abgebrochen"].includes(e.status)) throw fehler("Der Einsatz ist bereits abgeschlossen.");
    await einsatzStatus(client, e, "Abgebrochen", { abbruch_grund: grund }, `Einsatz ${e.name} abgesagt: ${grund}`);
    await fallNachEinsatz(client, e);
    return "Abgebrochen";
  },
  async folgeeinsatz_anlegen(client, e, { datum, zeit_von = null, zeit_bis = null } = {}) {
    const neu = await client.insert("PH Serviceeinsatz", { ...Object.fromEntries(Object.entries(e).filter(([k]) => ["art", "servicefall", "pflege_abo", "kontakt", "kunde_name", "techniker", "strasse", "plz", "ort", "land", "titel"].includes(k))), status: "Geplant", datum, zeit_von, zeit_bis });
    await client.setValue("PH Serviceeinsatz", e.name, { folgeeinsatz: neu.name });
    return neu.name;
  },
  async termin_anlegen(client, e) {
    client.kommentar("PH Serviceeinsatz", e.name, "Kalendertermin angelegt (Testmodus).", "Info");
    return null;
  },
};

// ------------------------------------------------- Ersatzteil, Bestellung --

const ERSATZTEIL = {
  async bewegung_buchen(client, t, { art, menge, hinweis = "" } = {}) {
    const m = Math.trunc(Number(menge));
    if (!["Zugang", "Verbrauch", "Inventur"].includes(art)) throw fehler("Unbekannte Bewegungsart.");
    if (!Number.isFinite(m) || m < 0 || (art !== "Inventur" && m === 0)) throw fehler("Menge angeben.");
    if (!Number(t.bestand_fuehren)) throw fehler("Für dieses Teil wird hier kein Bestand geführt.");
    const bestand = art === "Zugang" ? t.bestand + m : art === "Verbrauch" ? t.bestand - m : m;
    if (bestand < 0) throw fehler(`Bestand ${t.bezeichnung} würde negativ (${bestand}).`);
    const bew = [...(t.bewegungen || []), { doctype: "PH Ersatzteil Bewegung", idx: (t.bewegungen || []).length + 1, parentfield: "bewegungen", parenttype: "PH Ersatzteil", datum: heute(client), art, menge: art === "Verbrauch" ? -m : m, hinweis }];
    await client.setValue("PH Ersatzteil", t.name, { bestand, verfuegbar: Math.max(0, bestand - (Number(t.reserviert) || 0)), bewegungen: bew });
    return bestand;
  },
};

const BESTELLUNG = {
  async senden(client, b, { empfaenger = null } = {}) {
    if (b.status !== "Entwurf") throw fehler("Nur Entwürfe können gesendet werden.");
    if (!empfaenger) throw fehler("Empfänger angeben.");
    if (!(b.positionen || []).length) throw fehler("Noch keine Position.");
    await client.setValue("PH Ersatzteilbestellung", b.name, { status: "Gesendet", gesendet_am: jetzt(client), gesendet_an: empfaenger, bestellweg: "E-Mail" });
    return "Gesendet";
  },
  async als_gesendet(client, b, { bestellweg = "Portal", referenz = null } = {}) {
    await client.setValue("PH Ersatzteilbestellung", b.name, { status: "Gesendet", gesendet_am: jetzt(client), bestellweg, lieferant_referenz: referenz || b.lieferant_referenz || "" });
    return "Gesendet";
  },
  async bestaetigen(client, b, { referenz = null, erwartet_am = null } = {}) {
    await client.setValue("PH Ersatzteilbestellung", b.name, { status: "Bestaetigt", lieferant_referenz: referenz || b.lieferant_referenz || "", erwartet_am: erwartet_am || b.erwartet_am || "" });
    return "Bestaetigt";
  },
  async wareneingang(client, b, { mengen = null, alles = 0 } = {}) {
    if (!["Gesendet", "Bestaetigt", "Teilgeliefert"].includes(b.status)) throw fehler("Wareneingang nur für gesendete oder bestätigte Bestellungen.");
    const pos = (b.positionen || []).map((p, i) => {
      const rest = Math.max(0, (p.menge || 0) - (p.menge_erhalten || 0));
      const schl = String(p.name || p.idx || i + 1);
      const jetztMenge = Number(alles) ? rest : Math.min(rest, Math.max(0, Math.trunc(Number(mengen?.[schl] ?? 0))));
      return { ...p, menge_erhalten: (p.menge_erhalten || 0) + jetztMenge, eingetroffen_am: jetztMenge ? heute(client) : p.eingetroffen_am };
    });
    const voll = pos.every((p) => (p.menge_erhalten || 0) >= (p.menge || 0));
    const teil = pos.some((p) => (p.menge_erhalten || 0) > 0);
    await client.setValue("PH Ersatzteilbestellung", b.name, { positionen: pos, status: voll ? "Geliefert" : teil ? "Teilgeliefert" : b.status, geliefert_am: voll ? heute(client) : "", ueberfaellig: voll ? 0 : b.ueberfaellig });
    if (b.servicefall && tab(client, "PH Servicefall").has(b.servicefall)) {
      const f = await hole(client, "PH Servicefall", b.servicefall);
      const zeilen = (f.ersatzteile || []).map((z) => (z.bestellung === b.name && voll ? { ...z, status: "Eingetroffen" } : z));
      await setze(client, "PH Servicefall", f.name, { ersatzteile: zeilen, verlauf: verlaufZeile(client, f, "Ersatzteil", `Wareneingang ${b.name}${voll ? " – vollständig" : " – teilweise"}`) });
    } else {
      for (const p of pos) {
        const alt = (b.positionen || []).find((x) => x.idx === p.idx);
        const neu = (p.menge_erhalten || 0) - (alt?.menge_erhalten || 0);
        const t = p.ersatzteil && tab(client, "PH Ersatzteil").get(p.ersatzteil);
        if (t && neu > 0 && Number(t.bestand_fuehren)) await ERSATZTEIL.bewegung_buchen(client, JSON.parse(JSON.stringify(t)), { art: "Zugang", menge: neu, hinweis: `Wareneingang ${b.name}` });
      }
    }
    return voll ? "Geliefert" : "Teilgeliefert";
  },
  async stornieren(client, b, { grund = "" } = {}) {
    if (!String(grund).trim()) throw fehler("Grund angeben.");
    if (!["Entwurf", "Gesendet", "Bestaetigt"].includes(b.status)) throw fehler("Teilweise geliefert – Reststorno beim Lieferanten anfragen.");
    await client.setValue("PH Ersatzteilbestellung", b.name, { status: "Storniert", notizen: `${b.notizen ? `${b.notizen}\n` : ""}Storniert: ${grund}` });
    if (b.servicefall && tab(client, "PH Servicefall").has(b.servicefall)) {
      const f = await hole(client, "PH Servicefall", b.servicefall);
      await setze(client, "PH Servicefall", f.name, { ersatzteile: (f.ersatzteile || []).map((z) => (z.bestellung === b.name ? { ...z, status: "Benoetigt", bestellung: "" } : z)) });
    }
    return "Storniert";
  },
};

// ------------------------------------------------------------------ Regress --

function abgleich(r, toleranz = 100) {
  const soll = Number(r.betrag_anerkannt_cent) || Number(r.betrag_gefordert_cent) || 0;
  const ist = Number(r.betrag_erhalten_cent) || 0;
  const diff = ist - soll;
  const status = Math.abs(diff) <= toleranz ? "Ausgeglichen" : diff < 0 ? "Unterdeckung" : "Ueberdeckung";
  return { differenz_cent: diff, abgleich_status: ist ? status : "Offen", quote_promille: soll ? Math.round((ist / soll) * 1000) : 0 };
}

const REGRESS = {
  async gutschrift_erfassen(client, r, { betrag_cent, nummer = null, datum = null, eingangsrechnung = null } = {}) {
    const b = Math.trunc(Number(betrag_cent));
    if (!Number.isFinite(b) || b <= 0) throw fehler("Betrag angeben.");
    const neu = { ...r, betrag_erhalten_cent: (Number(r.betrag_erhalten_cent) || 0) + b, gutschrift_nummer: nummer || r.gutschrift_nummer || "", gutschrift_datum: datum || heute(client), eingangsrechnung: eingangsrechnung || r.eingangsrechnung || "" };
    if (!Number(neu.betrag_anerkannt_cent)) neu.betrag_anerkannt_cent = neu.betrag_erhalten_cent;
    const ab = abgleich(neu, Number(einstellungen(client).regress_toleranz_cent) || 100);
    await client.setValue("PH Lieferantenregress", r.name, { betrag_erhalten_cent: neu.betrag_erhalten_cent, betrag_anerkannt_cent: neu.betrag_anerkannt_cent, gutschrift_nummer: neu.gutschrift_nummer, gutschrift_datum: neu.gutschrift_datum, eingangsrechnung: neu.eingangsrechnung, ...ab });
    // Workflow: Gemeldet → Anerkannt → Verrechnet (wie gutschrift_erfassen setzt die App Anerkannt/Verrechnet)
    try {
      if (r.status === "Gemeldet") await workflow(client, "PH Lieferantenregress", r.name, "Regress anerkannt");
      const r2 = await hole(client, "PH Lieferantenregress", r.name);
      if (r2.status === "Anerkannt" && ab.abgleich_status === "Ausgeglichen" && istLeitung(client.session)) await workflow(client, "PH Lieferantenregress", r.name, "Regress verrechnet");
    } catch {
      /* Workflow-Bedingung nicht erfüllt → Status bleibt */
    }
    return ab.abgleich_status;
  },
  async differenz_ausbuchen(client, r, { grund = "" } = {}) {
    if (!istLeitung(client.session)) throw fehler("Differenz ausbuchen darf nur die Service-Leitung.", "forbidden");
    if (!String(grund).trim()) throw fehler("Grund angeben.");
    await client.setValue("PH Lieferantenregress", r.name, { abgleich_status: "Ausgebucht", ausgebucht_grund: grund, ausgebucht_von: client.session.user });
    return "Ausgebucht";
  },
  async erinnern(client, r) {
    await client.setValue("PH Lieferantenregress", r.name, { letzte_erinnerung: heute(client), mahnstufe: (Number(r.mahnstufe) || 0) + 1 });
    return true;
  },
};

// ------------------------------------------------------- Pflege, Auftrag --

const PFLEGE = {
  async einsatz_planen(client, p, { datum, zeit_von = null, zeit_bis = null, techniker = null } = {}) {
    if (!datum) throw fehler("Datum fehlt.");
    const e = await client.insert("PH Serviceeinsatz", { status: "Geplant", art: p.art === "Wartungsvertrag" ? "Wartung" : "Pflege", pflege_abo: p.name, kontakt: p.kontakt, kunde_name: p.kunde_name, techniker: techniker || p.techniker || "techniker@demo.local", datum, zeit_von, zeit_bis, strasse: p.strasse, plz: p.plz, ort: p.ort, land: p.land, titel: `${p.art === "Wartungsvertrag" ? "Wartung" : "Pflege"} ${p.bereich}: ${p.kunde_name}` });
    await client.setValue("PH Pflege Abo", p.name, { naechster_einsatz: e.name, naechster_termin: datum });
    return e.name;
  },
  async erinnerung_senden(client, p) {
    if (!p.kontakt_email) throw fehler("Keine E-Mail hinterlegt – Erinnerung als Anruf.");
    await client.setValue("PH Pflege Abo", p.name, { letzte_erinnerung: heute(client) });
    return true;
  },
  async protokoll_erfassen(client, p, { datum, leistungen, durchgefuehrt_von = null, empfohlene_produkte = null, im_portal = 1 } = {}) {
    if (!datum || !String(leistungen || "").trim()) throw fehler("Datum und Leistungen angeben.");
    const prot = [...(p.protokolle || []), { doctype: "PH Pflege Abo Protokoll", idx: (p.protokolle || []).length + 1, parentfield: "protokolle", parenttype: "PH Pflege Abo", datum, leistungen, durchgefuehrt_von: durchgefuehrt_von || client.session.user, empfohlene_produkte: empfohlene_produkte || "", im_portal: Number(im_portal) ? 1 : 0 }];
    const naechster = Number(p.intervall_monate) ? iso(monateDazu(datum, p.intervall_monate)) : p.naechster_termin;
    await client.setValue("PH Pflege Abo", p.name, { protokolle: prot, letzte_wartung: datum, naechster_termin: naechster, ueberfaellig: 0 });
    return naechster;
  },
  async geplante_termine(client, p, { anzahl = 6 } = {}) {
    const start = p.naechster_termin || p.startdatum;
    if (!start || !Number(p.intervall_monate)) return [];
    return Array.from({ length: Number(anzahl) || 6 }, (_, i) => iso(monateDazu(start, i * Number(p.intervall_monate))));
  },
};

const AUFTRAG = {
  async uebernahme_erfassen(client, a, { positionen = null, name_bestaetigt = null, lagerort = null } = {}) {
    await client.setValue("PH Serviceauftrag", a.name, { positionen: positionen || a.positionen, uebernahme_am: jetzt(client), lagerort: lagerort || a.lagerort || "", notizen: `${a.notizen || ""}${name_bestaetigt ? `\nÜbernahme bestätigt: ${name_bestaetigt}` : ""}`.trim() });
    if (a.status === "Beauftragt") await workflow(client, "PH Serviceauftrag", a.name, "Abholen");
    return true;
  },
  async rueckgabe_erfassen(client, a, { positionen = null, name_bestaetigt = null } = {}) {
    await client.setValue("PH Serviceauftrag", a.name, { positionen: positionen || a.positionen, rueckgabe_am_unterschrift: jetzt(client), notizen: `${a.notizen || ""}${name_bestaetigt ? `\nRückgabe bestätigt: ${name_bestaetigt}` : ""}`.trim() });
    if (["Eingelagert", "In Arbeit"].includes(a.status)) await workflow(client, "PH Serviceauftrag", a.name, "Zurückbringen");
    return true;
  },
};

const METHODEN = {
  "PH Servicefall": FALL,
  "PH Serviceeinsatz": EINSATZ,
  "PH Ersatzteil": ERSATZTEIL,
  "PH Ersatzteilbestellung": BESTELLUNG,
  "PH Lieferantenregress": REGRESS,
  "PH Pflege Abo": PFLEGE,
  "PH Serviceauftrag": AUFTRAG,
};

/** Gibt es die Methode im Mock? */
export function mockHatMethode(doctype, methode) {
  return typeof METHODEN[doctype]?.[methode] === "function";
}

/**
 * Dokumentmethode im Mock ausführen (Recht wird vorher in der Action geprüft; hier zusätzlich „write“).
 * @returns {Promise<any>} Rückgabe wie die App-Methode (message)
 */
export async function mockMethode(client, doctype, name, methode, args = {}) {
  const fn = METHODEN[doctype]?.[methode];
  if (!fn) throw fehler(`Methode ${methode} ist im Testmodus nicht hinterlegt.`, "not_found");
  client.pruefe(client.meta(doctype), "write");
  const doc = await hole(client, doctype, name);
  return fn(client, doc, args || {});
}

// -------------------------------------------------------- Lesende Endpunkte --

const FALL_LISTE = ["name", "status", "erstreaktion_am", "frist_reaktion", "frist_loesung", "fehlercode", "entscheidung", "kulanz_freigabe_status", "lieferantenrelevant", "kunde_informiert_am", "abnahme_bestaetigt", "regress_frist_bis"];

function teilListen(client, names) {
  const set = new Set(names);
  const faelle = [...tab(client, "PH Servicefall").values()].filter((f) => set.has(f.name));
  return {
    faelle,
    einsaetze: [...tab(client, "PH Serviceeinsatz").values()].filter((e) => set.has(e.servicefall)),
    regresse: [...tab(client, "PH Lieferantenregress").values()].filter((r) => set.has(r.servicefall)),
    bestellungen: [...tab(client, "PH Ersatzteilbestellung").values()].filter((b) => set.has(b.servicefall)),
  };
}

/** Spiegel von ph_service.api.get_next_steps(names). */
export function mockNaechsteSchritte(client, names) {
  const liste = (Array.isArray(names) ? names : [names]).map(String).slice(0, 200);
  const t = teilListen(client, liste);
  const out = {};
  for (const f of t.faelle) {
    const z = fallZaehler(f.name, { ersatzteile: f.ersatzteile || [], einsaetze: t.einsaetze, regresse: t.regresse, bestellungen: t.bestellungen });
    const flach = Object.fromEntries(FALL_LISTE.map((k) => [k, f[k]]));
    out[f.name] = naechsterSchritt({ ...flach, ...z }, heute(client));
  }
  return out;
}

/** Spiegel von ph_service.api.get_service_case_file(name). Kosten nur mit Leitung/GF (permlevel 1). */
export function mockAkte(client, name, { kostenSichtbar = false } = {}) {
  const f = tab(client, "PH Servicefall").get(name);
  if (!f) throw fehler(`Servicefall ${name} wurde nicht gefunden.`, "not_found");
  client.pruefe(client.meta("PH Servicefall"), "read");
  const fall = JSON.parse(JSON.stringify(f));
  if (!kostenSichtbar) for (const k of ["notiz_intern", "kosten", "kosten_intern_cent", "kosten_extern_cent", "netto_kosten_cent"]) delete fall[k];
  const t = teilListen(client, [name]);
  const z = fallZaehler(name, { ersatzteile: f.ersatzteile || [], einsaetze: t.einsaetze, regresse: t.regresse, bestellungen: t.bestellungen });
  const fr = fristen({ kaufdatum: f.kaufdatum, uebergabe: f.uebergabe_datum, kundentyp: f.kundentyp, garantie_monate: f.garantie_monate, erledigt_am: f.erledigt_am, lieferung_an_haendler: f.lieferung_an_haendler, heute: heute(client) });
  const sortiert = (a, b, k) => String(b[k] || "").localeCompare(String(a[k] || ""));
  return {
    fall,
    einsaetze: t.einsaetze.map((e) => ({ name: e.name, titel: e.titel, status: e.status, datum: e.datum, zeit_von: e.zeit_von, zeit_bis: e.zeit_bis, techniker: e.techniker, ergebnis: e.ergebnis, bestaetigt_kunde_am: e.bestaetigt_kunde_am, bericht_gesendet_am: e.bericht_gesendet_am, umgeplant_am: e.umgeplant_am, unterschrift_art: e.unterschrift_art, bericht: e.bericht })).sort((a, b) => sortiert(a, b, "datum")),
    ersatzteilbestellungen: t.bestellungen.map((b) => ({ name: b.name, titel: b.titel, status: b.status, erwartet_am: b.erwartet_am, geliefert_am: b.geliefert_am, ueberfaellig: b.ueberfaellig })),
    regresse: t.regresse.map((r) => ({ name: r.name, status: r.status, betrag_gefordert_cent: r.betrag_gefordert_cent, betrag_anerkannt_cent: r.betrag_anerkannt_cent, betrag_erhalten_cent: r.betrag_erhalten_cent, abgleich_status: r.abgleich_status, differenz_cent: r.differenz_cent, frist_bis: r.frist_bis, lieferant: r.lieferant, gemeldet_am: r.gemeldet_am })),
    naechsterSchritt: naechsterSchritt({ ...f, ...z }, heute(client)),
    fristen: fr,
    sla: { status: f.sla_status, frist_reaktion: f.frist_reaktion, frist_loesung: f.frist_loesung, reaktion_verletzt: !!Number(f.sla_reaktion_verletzt), loesung_verletzt: !!Number(f.sla_loesung_verletzt), pausiert: !!f.sla_pausiert_seit },
  };
}

function minuten(zeit) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(zeit || ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function zeit(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** freie_fenster() aus utils/einsatz.py: belegte Blöcke + Puffer, Raster 30 min. */
export function freieFenster(belegt, von = "08:00", bis = "17:00", dauer = 60, schritt = 30, puffer = 30) {
  const a = minuten(von);
  const b = minuten(bis);
  const bloecke = belegt.map(([x, y]) => [minuten(x) ?? a, (minuten(y) ?? (minuten(x) ?? a) + 60)]).map(([x, y]) => [x - puffer, y + puffer]);
  const out = [];
  for (let s = a; s + dauer <= b; s += schritt) {
    const e = s + dauer;
    if (bloecke.some(([x, y]) => s < y && e > x)) continue;
    out.push([zeit(s), zeit(e)]);
  }
  return out;
}

/** Spiegel von ph_service.api.get_technician_slots(datum, dauer_min, techniker). */
export function mockSlots(client, { datum, dauer_min = 60, techniker = null } = {}) {
  const einst = einstellungen(client);
  const users = [...tab(client, "User").values()].filter((u) => Number(u.enabled ?? 1) && (u.roles || []).some((r) => r.role === "PH Techniker")).map((u) => u.name);
  const liste = techniker ? [techniker] : [...new Set(users)].sort();
  const out = {};
  for (const t of liste) {
    const belegt = [...tab(client, "PH Serviceeinsatz").values()].filter((e) => e.datum === datum && ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"].includes(e.status) && (e.techniker === t || e.techniker_2 === t)).map((e) => [String(e.zeit_von || "08:00").slice(0, 5), String(e.zeit_bis || "").slice(0, 5)]);
    out[t] = freieFenster(belegt, String(einst.techniker_tag_von || "08:00").slice(0, 5), String(einst.techniker_tag_bis || "17:00").slice(0, 5), Number(dauer_min) || 60, 30, Number(einst.einsatz_puffer_min ?? 30)).map(([von, bis]) => ({ von, bis }));
  }
  return { datum: String(datum), dauerMin: Number(dauer_min) || 60, techniker: out };
}
