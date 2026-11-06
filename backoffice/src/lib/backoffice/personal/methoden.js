// Aufrufe der Frappe-App ph_personal – mit Mock-Pfad (MASTER Q-A3, § 5.3 Nr. 5: jede Server Action läuft im Mock).
// Frappe: Dokumentmethoden über client.runDocMethod, Modulmethoden über client.call – Signaturen exakt wie in
// Backend-Import/ph_personal (api/__init__.py, doctype/*/…py). Mock: dieselben Regeln gegen die Mock-Datenbank
// (Statuswechsel, Löschfrist, Pause, Überschneidung), damit Oberfläche und E2E echtes Verhalten sehen.
// Reines Modul mit relativen Importen (läuft im Commit-Register und unter node --test).

import { BackofficeError } from "../frappe/errors.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { zeitMin, minZeit, pauseVorschlag, plusTage } from "./zeit.js";
import { slugAusTitel } from "./titelpruefung.js";
import { entgeltVollstaendig, entgeltSatz } from "./regeln.js";

export const M = Object.freeze({
  stempeln: "ph_personal.api.stempeln",
  krank_melden: "ph_personal.api.krank_melden",
  korrektur_beantragen: "ph_personal.api.korrektur_beantragen",
  urlaubskonto: "ph_personal.api.urlaubskonto",
  monatsuebersicht: "ph_personal.api.monatsuebersicht",
  anzahl_heute_abwesend: "ph_personal.api.anzahl_heute_abwesend",
  teamkalender: "ph_personal.api.teamkalender",
});

const DT = Object.freeze({ stelle: "PH Stelle", bewerbung: "PH Bewerbung", gespraech: "PH Bewerbungsgespraech", ma: "PH Mitarbeiter", zeit: "PH Zeiterfassung", abw: "PH Abwesenheit", krank: "PH Krankmeldung", einst: "PH Personal Einstellungen" });
export { DT };

const LEITUNG = ["PH Personal Leitung", "System Manager", "Administrator"];
const PERSONAL = [...LEITUNG, "PH Personal Mitarbeiter", "PH Backoffice-Admin"];
const istMock = (client) => client?.modus !== "frappe";
const OFFEN = ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"];
const ENDE = ["Eingestellt", "Abgesagt", "Zurueckgezogen"];

/** Dokumentmethode (Frappe oder Mock). */
export async function methode(client, doctype, name, method, args = {}) {
  if (!istMock(client)) {
    const r = await client.runDocMethod(doctype, name, method, args);
    return r && typeof r === "object" && "message" in r ? r.message : r;
  }
  const fn = MOCK_DOC[doctype]?.[method];
  if (!fn) throw new BackofficeError("not_found", "Diese Funktion ist im Testbetrieb nicht hinterlegt.");
  return fn(client, name, args || {});
}

/** Modulmethode (Frappe oder Mock). */
export async function aufruf(client, pfad, args = {}) {
  if (!istMock(client)) return client.call(pfad, args);
  const fn = MOCK_MODUL[pfad];
  if (!fn) throw new BackofficeError("not_found", "Diese Funktion ist im Testbetrieb nicht hinterlegt.");
  return fn(client, args || {});
}

// ================================================================ Mock-Kern ==

const tab = (c, dt) => c.tabelle(dt);
function hole(c, dt, name) {
  const d = tab(c, dt).get(name);
  if (!d) throw new BackofficeError("not_found", "Der Datensatz wurde nicht gefunden.");
  return d;
}
const jetzt = (c) => (c.jetzt ? c.jetzt() : new Date());
const user = (c) => c.session?.user || "Administrator";
const rollen = (c) => c.session?.roles || [];
const leitung = (c) => rollen(c).some((r) => LEITUNG.includes(r));
const personal = (c) => rollen(c).some((r) => PERSONAL.includes(r));
const heute = (c) => isoDatum(jetzt(c));
const zeitText = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

function speichere(c, dt, alt, neu) {
  c.stempel(neu);
  tab(c, dt).set(neu.name, neu);
  c.version(dt, neu.name, alt, neu);
  return neu;
}
function lege(c, dt, doc, prefix, breite) {
  const name = doc.name || `${prefix}${String(c.naechsteNummer(prefix)).padStart(breite, "0")}`;
  const neu = { doctype: dt, ...doc, name, docstatus: 0 };
  c.stempel(neu, true);
  tab(c, dt).set(name, neu);
  c.version(dt, name, null, neu);
  return neu;
}
function einst(c) {
  return tab(c, DT.einst).get(DT.einst) || {};
}
function eigenerMa(c) {
  return [...tab(c, DT.ma).values()].find((m) => m.user && m.user === user(c))?.name || null;
}
function eigenerOderPersonal(c, mitarbeiter) {
  const eigen = eigenerMa(c);
  if (mitarbeiter && mitarbeiter !== eigen && !personal(c)) throw new BackofficeError("forbidden", "Keine Berechtigung für andere Mitarbeiter.");
  const ma = mitarbeiter || eigen;
  if (!ma) throw new BackofficeError("invalid", "Ihrem Benutzer ist kein Mitarbeiter-Datensatz zugeordnet.");
  return ma;
}

/** Netto und Pause wie der Controller: Pause ab pause_ab_minuten vorschlagen, wenn keine eingetragen ist. */
function berechneBuchung(c, d) {
  const k = zeitMin(d.kommen);
  const g = zeitMin(d.gehen);
  if (g == null) return { ...d, status: d.status === "Korrigiert" ? "Korrigiert" : "Offen", dauer_min: 0, dauer_text: "" };
  if (g <= k) throw new BackofficeError("invalid", "„Gehen“ liegt vor „Kommen“.", { detail: { feld: "gehen" } });
  const e = einst(c);
  let pause = Number(d.pause_min) || 0;
  if (!pause) pause = pauseVorschlag(g - k, { pauseAb: Number(e.pause_ab_minuten) || 360, pause: Number(e.pause_minuten) || 30 });
  const dauer = Math.max(0, g - k - pause);
  return { ...d, pause_min: pause, dauer_min: dauer, dauer_text: `${Math.floor(dauer / 60)}:${String(dauer % 60).padStart(2, "0")} h`, status: d.status === "Korrigiert" ? "Korrigiert" : "Erfasst" };
}

/** Prüfungen des Controllers (validate): Zukunft, Überschneidung, zweite offene Buchung. */
export function pruefeBuchung(c, d) {
  const h = heute(c);
  if (d.datum > h) throw new BackofficeError("invalid", "Zeitbuchungen in der Zukunft sind nicht möglich.", { detail: { feld: "datum" } });
  if (d.datum === h && zeitMin(d.kommen) > jetzt(c).getHours() * 60 + jetzt(c).getMinutes() + 1) throw new BackofficeError("invalid", "Zeitbuchungen in der Zukunft sind nicht möglich.", { detail: { feld: "kommen" } });
  const andere = [...tab(c, DT.zeit).values()].filter((x) => x.mitarbeiter === d.mitarbeiter && x.datum === d.datum && x.name !== d.name);
  for (const a of andere) {
    if (a.status === "Offen" && !a.gehen && !d.gehen) throw new BackofficeError("invalid", `Es gibt bereits eine offene Buchung (${a.name}) für diesen Tag.`, { detail: { feld: "kommen" } });
    if (a.gehen && d.gehen && zeitMin(a.kommen) < zeitMin(d.gehen) && zeitMin(d.kommen) < zeitMin(a.gehen)) throw new BackofficeError("invalid", `Überschneidung mit Buchung ${a.name} (${a.kommen.slice(0, 5)}–${a.gehen.slice(0, 5)}).`, { detail: { feld: "kommen" } });
  }
}

function setzeStatus(c, b, status, notiz) {
  const alt = { ...b };
  const neu = { ...b, status, workflow_state: `PH ${status}` };
  const t = isoDatumZeit(jetzt(c));
  if (status === "Gesichtet" && !neu.gesichtet_am) neu.gesichtet_am = t;
  if (status === "Gespraech") {
    neu.gespraech_am = neu.gespraech_am || t;
    neu.gesichtet_am = neu.gesichtet_am || t;
  }
  if (status === "Angebot") neu.angebot_am = t;
  if (ENDE.includes(status)) {
    neu.entschieden_am = t;
    const monate = Number(einst(c).loeschfrist_monate) || 7;
    const d = new Date(jetzt(c));
    d.setMonth(d.getMonth() + monate);
    neu.loeschfrist = isoDatum(d);
  }
  speichere(c, DT.bewerbung, alt, neu);
  c.kommentar(DT.bewerbung, b.name, `Workflow: ${notiz || status}`, "Workflow");
  return neu;
}

// --------------------------------------------------------- Modulmethoden --

const MOCK_MODUL = {
  [M.stempeln]: (c, { mitarbeiter, art = "Arbeit" }) => {
    const ma = eigenerOderPersonal(c, mitarbeiter);
    const m = hole(c, DT.ma, ma);
    const j = jetzt(c);
    const h = heute(c);
    const heuteListe = [...tab(c, DT.zeit).values()].filter((z) => z.mitarbeiter === ma && z.datum === h);
    const letzte = heuteListe.sort((a, b) => String(b.modified).localeCompare(String(a.modified)))[0];
    if (letzte && j - new Date(String(letzte.modified).slice(0, 19).replace(" ", "T")) < 60_000) return { ok: false, status: letzte.status, name: letzte.name, meldung: "Gerade eben gebucht – bitte kurz warten." };
    const offen = heuteListe.find((z) => z.status === "Offen" && !z.gehen);
    if (offen) {
      const neu = berechneBuchung(c, { ...offen, gehen: zeitText(j) });
      speichere(c, DT.zeit, offen, neu);
      return { ok: true, status: neu.status, name: neu.name, meldung: `Gehen gebucht: ${minZeit(zeitMin(neu.gehen))} (${neu.dauer_text})`, pause_bestaetigen: Boolean(neu.pause_min && !neu.pause_bestaetigt), pause_min: neu.pause_min };
    }
    const doc = lege(c, DT.zeit, { naming_series: "PH-ZEIT-.YYYY.-.######", titel: `${m.titel} ${h}`, mitarbeiter: ma, mitarbeiter_name: m.titel, datum: h, kommen: zeitText(j), gehen: "", pause_min: 0, art: ["Arbeit", "Montage", "Fortbildung", "Zeitausgleich"].includes(art) ? art : "Arbeit", status: "Offen", quelle: "Stempel", pause_bestaetigt: 0 }, `PH-ZEIT-${h.slice(0, 4)}-`, 6);
    return { ok: true, status: "Offen", name: doc.name, meldung: `Kommen gebucht: ${minZeit(zeitMin(doc.kommen))}` };
  },

  [M.krank_melden]: (c, { von, bis_voraussichtlich, mitarbeiter, meldeweg }) => {
    const ma = eigenerOderPersonal(c, mitarbeiter);
    if (ma !== eigenerMa(c) && !leitung(c)) throw new BackofficeError("forbidden", "Krankmeldungen für andere erfasst die Personal-Leitung.");
    const m = hole(c, DT.ma, ma);
    const ab = von || heute(c);
    const urlaub = [...tab(c, DT.abw).values()].find((a) => a.mitarbeiter === ma && a.status === "Genehmigt" && a.art === "Urlaub" && a.von <= (bis_voraussichtlich || ab) && a.bis >= ab);
    const doc = lege(c, DT.krank, { naming_series: "PH-KRANK-.YYYY.-.#####", titel: `${m.titel}: Krankmeldung ${ab}`, mitarbeiter: ma, mitarbeiter_name: m.titel, status: "Gemeldet", von: ab, bis_offen: bis_voraussichtlich ? 0 : 1, bis_voraussichtlich: bis_voraussichtlich || "", bis: "", meldeweg: meldeweg || (ma === eigenerMa(c) ? "Selbstservice" : "Telefon"), gemeldet_am: isoDatumZeit(jetzt(c)), gemeldet_von: user(c), arbeitsunfall: 0, urlaub_unterbrochen: urlaub?.name || "" }, `PH-KRANK-${ab.slice(0, 4)}-`, 5);
    if (urlaub) c.kommentar(DT.abw, urlaub.name, `Urlaub durch Krankmeldung ${doc.name} unterbrochen (UrlG § 5)`, "Info");
    return { name: doc.name, status: doc.status, meldung: "Gute Besserung – die Leitung ist informiert.", urlaub_unterbrochen: urlaub?.name || null };
  },

  [M.korrektur_beantragen]: (c, { buchung, kommen, gehen, pause_min, grund }) => methode(c, DT.zeit, buchung, "korrektur_beantragen", { kommen, gehen, pause_min, grund }),

  // Wie api.teamkalender: Krankmeldungen für Nicht-Leitung nur als „abwesend“, ohne Namen des Datensatzes.
  [M.teamkalender]: (c, { start, end }) => {
    const voll = leitung(c) || rollen(c).includes("PH Geschäftsführung");
    const out = [];
    for (const k of tab(c, DT.krank).values()) {
      if (!["Gemeldet", "Bestaetigt", "Beendet"].includes(k.status) || k.von > end) continue;
      const ende = k.bis || (Number(k.bis_offen) ? end : k.bis_voraussichtlich) || end;
      if (ende < start) continue;
      out.push({ name: voll ? k.name : null, quelle: "krank", mitarbeiter_name: k.mitarbeiter_name, art: voll ? "Krankenstand" : "abwesend", von: k.von, bis: plusTage(ende, 1), status: "Genehmigt" });
    }
    return out;
  },

  [M.anzahl_heute_abwesend]: (c) => {
    const h = heute(c);
    const weg = new Set([...tab(c, DT.abw).values()].filter((a) => a.status === "Genehmigt" && a.von <= h && a.bis >= h).map((a) => a.mitarbeiter));
    for (const k of tab(c, DT.krank).values()) if (["Gemeldet", "Bestaetigt"].includes(k.status) && k.von <= h && (Number(k.bis_offen) || (k.bis || k.bis_voraussichtlich) >= h)) weg.add(k.mitarbeiter);
    return { value: weg.size, fieldtype: "Int" };
  },
};

// ------------------------------------------------------ Dokumentmethoden --

const MOCK_DOC = {
  [DT.bewerbung]: {
    gespraech_anlegen: (c, name, { start, dauer_min = 60, modus = "Vor Ort", ort = "", verantwortlich }) => {
      const b = hole(c, DT.bewerbung, name);
      if (ENDE.includes(b.status)) throw new BackofficeError("invalid", "Die Bewerbung ist bereits abgeschlossen.");
      if (!start) throw new BackofficeError("invalid", "Bitte einen Termin wählen.", { detail: { feld: "start" } });
      const s = new Date(String(start).replace(" ", "T"));
      const ende = new Date(s.getTime() + (Number(dauer_min) || 60) * 60000);
      const g = lege(c, DT.gespraech, { naming_series: "PH-GSP-.YYYY.-.#####", titel: `Gespräch ${b.vorname} ${b.nachname}`, bewerbung: name, stelle: b.stelle, bewerber: `${b.vorname} ${b.nachname}`, status: "Geplant", start: isoDatumZeit(s), dauer_min: Number(dauer_min) || 60, ende: isoDatumZeit(ende), modus, ort, verantwortlich: verantwortlich || b.zugewiesen_an || user(c), ergebnis: "" }, `PH-GSP-${isoDatum(s).slice(0, 4)}-`, 5);
      if (b.status === "Eingegangen" || b.status === "Gesichtet") setzeStatus(c, b, "Gespraech", `Gespräch ${g.name} vereinbart`);
      return g.name;
    },
    absage_senden: (c, name, { grund = "Anderer Kandidat", per_mail = 1 }) => {
      const b = hole(c, DT.bewerbung, name);
      if (b.status === "Eingestellt") throw new BackofficeError("invalid", "Eingestellte Bewerbungen können nicht abgesagt werden.");
      const neu = setzeStatus(c, { ...b, absage_grund: grund || "Sonstiges" }, "Abgesagt", "Absagen → Abgesagt");
      if (Number(per_mail) && b.email) {
        const t = isoDatumZeit(jetzt(c));
        speichere(c, DT.bewerbung, neu, { ...neu, absage_gesendet_am: t, absage_versand: "E-Mail", absage_versand_am: t });
        c.kommentar(DT.bewerbung, name, "Absage per E-Mail gesendet (Testbetrieb: keine echte E-Mail)", "Info");
      }
      return "Abgesagt";
    },
    absage_dokumentieren: (c, name, { versand, am }) => {
      const b = hole(c, DT.bewerbung, name);
      if (!["E-Mail", "Post", "Telefon", "Persönlich"].includes(versand)) throw new BackofficeError("invalid", "Unbekannter Versandweg.");
      if (b.status !== "Abgesagt") throw new BackofficeError("invalid", "Nur für abgesagte Bewerbungen.");
      speichere(c, DT.bewerbung, b, { ...b, absage_versand: versand, absage_versand_am: am || isoDatumZeit(jetzt(c)) });
      c.kommentar(DT.bewerbung, name, `Absage per ${versand} am ${isoDatum(jetzt(c))}`, "Info");
      return b.loeschfrist;
    },
    einstellen: (c, name, { eintritt, rolle_intern = "Verkauf", stelle_schliessen = 0, beschaeftigungsart, wochenstunden, urlaubsanspruch_tage, user: u }) => {
      const b = hole(c, DT.bewerbung, name);
      if (b.mitarbeiter) return b.mitarbeiter;
      if (!["Gespraech", "Angebot"].includes(b.status)) throw new BackofficeError("invalid", "Einstellen ist erst nach Gespräch oder Angebot möglich.");
      if (!eintritt) throw new BackofficeError("invalid", "Bitte das Eintrittsdatum angeben.", { detail: { feld: "eintritt" } });
      const m = lege(c, DT.ma, { naming_series: "PH-MA-.####", titel: `${b.vorname} ${b.nachname}`, vorname: b.vorname, nachname: b.nachname, rolle_intern, eintritt, status: "Aktiv", bewerbung: name, beschaeftigungsart: beschaeftigungsart || "Vollzeit", wochenstunden: wochenstunden ? Number(wochenstunden) : 38.5, urlaubsanspruch_tage: urlaubsanspruch_tage ? Number(urlaubsanspruch_tage) : 25, user: u || "", team_verkauf: rolle_intern === "Verkauf" ? 1 : 0, team_planung: rolle_intern === "Planung" ? 1 : 0, team_montage: rolle_intern === "Montage" ? 1 : 0, checkliste: [], arbeitsmittel: [], dokumente: [], arbeitszeiten: [] }, "PH-MA-", 4);
      setzeStatus(c, { ...b, mitarbeiter: m.name, zusage_gesendet_am: isoDatumZeit(jetzt(c)) }, "Eingestellt", `Eingestellt – Mitarbeiter ${m.name}`);
      if (Number(stelle_schliessen) && b.stelle) MOCK_DOC[DT.stelle].als_besetzt(c, b.stelle, { bewerbung: name });
      return m.name;
    },
    unterlagen_loeschen: (c, name) => {
      if (!leitung(c)) throw new BackofficeError("forbidden", "Löschen darf nur die Personal-Leitung.");
      const b = hole(c, DT.bewerbung, name);
      if (OFFEN.includes(b.status)) throw new BackofficeError("invalid", "Offene Bewerbungen zuerst abschließen (Absage oder Rückzug).");
      const t = isoDatumZeit(jetzt(c));
      speichere(c, DT.bewerbung, b, { ...b, vorname: "", nachname: "Personendaten gelöscht", titel: `Personendaten gelöscht – ${b.stelle_titel || "Initiativbewerbung"}`, email: "", telefon: "", plz_ort: "", anschreiben: "", unterlagen: [], eindruck: "", notiz_intern: "", bewertung: 0, gehaltsvorstellung_cent: 0, verfuegbar_ab: "", anrede: "", pseudonymisiert: 1, unterlagen_geloescht_am: t });
      for (const g of tab(c, DT.gespraech).values()) {
        if (g.bewerbung !== name) continue;
        speichere(c, DT.gespraech, g, { ...g, bewerber: "", notiz: "", bewertung: 0, weitere_teilnehmer: "", ort: "", titel: "Gespräch (Personendaten gelöscht)", kalender_event: "" });
      }
      c.db.kommentare.set(`${DT.bewerbung}::${name}`, []);
      c.kommentar(DT.bewerbung, name, "Personendaten gelöscht (manuell)", "Info");
      return true;
    },
    evidenz_verlaengern: (c, name, { bis }) => {
      const b = hole(c, DT.bewerbung, name);
      if (!bis || bis <= heute(c)) throw new BackofficeError("invalid", "Das Datum muss in der Zukunft liegen.", { detail: { feld: "bis" } });
      speichere(c, DT.bewerbung, b, { ...b, einwilligung_evidenz: 1, einwilligung_evidenz_bis: bis });
      c.kommentar(DT.bewerbung, name, `Einwilligung zur längeren Aufbewahrung bis ${bis} erfasst`, "Info");
      return b.loeschfrist;
    },
    eingang_bestaetigen: (c, name, { per_mail = 1 }) => {
      const b = hole(c, DT.bewerbung, name);
      if (b.eingang_bestaetigt_am) return b.eingang_bestaetigt_am;
      const t = isoDatumZeit(jetzt(c));
      speichere(c, DT.bewerbung, b, { ...b, eingang_bestaetigt_am: t, datenschutzinfo_am: b.datenschutzinfo_am || t, datenschutzinfo_art: b.datenschutzinfo_art || (Number(per_mail) && b.email ? "E-Mail" : "Post") });
      if (Number(per_mail) && b.email) c.kommentar(DT.bewerbung, name, "Eingangsbestätigung mit Datenschutzinformation gesendet (Testbetrieb: keine echte E-Mail)", "Info");
      return t;
    },
  },

  [DT.gespraech]: {
    kalender_eintragen: (c, name) => {
      const g = hole(c, DT.gespraech, name);
      if (g.kalender_event) return g.kalender_event;
      speichere(c, DT.gespraech, g, { ...g, kalender_event: `EV-${name}` });
      return `EV-${name}`;
    },
    abschliessen: (c, name, { ergebnis = "Offen", naechster_schritt = "" }) => {
      const g = hole(c, DT.gespraech, name);
      speichere(c, DT.gespraech, g, { ...g, status: "Durchgefuehrt", ergebnis, naechster_schritt });
      const b = tab(c, DT.bewerbung).get(g.bewerbung);
      if (b && ergebnis === "Angebot" && ["Gesichtet", "Gespraech"].includes(b.status)) setzeStatus(c, b, "Angebot", `Angebot nach Gespräch ${name}`);
      else if (b && ergebnis === "Absage") c.kommentar(DT.bewerbung, b.name, `Gespräch ${name}: Ergebnis Absage – bitte „Absage senden“ ausführen.`, "Info");
      return "Durchgefuehrt";
    },
  },

  [DT.stelle]: {
    duplizieren: (c, name) => {
      const s = hole(c, DT.stelle, name);
      const titel = `${s.titel} (Kopie)`;
      let slug = slugAusTitel(titel);
      while (tab(c, DT.stelle).has(slug)) slug = `${slug}-2`;
      const kopie = lege(c, DT.stelle, { ...JSON.parse(JSON.stringify(s)), name: slug, slug, titel, status: "Entwurf", workflow_state: "PH Entwurf", veroeffentlicht: "", gueltig_bis: "", besetzt_am: "", besetzt_durch: "", quelle: "Duplikat", sync_quelle: "", website_url: "" });
      return kopie.name;
    },
    als_besetzt: (c, name, { bewerbung } = {}) => {
      const s = hole(c, DT.stelle, name);
      if (bewerbung && tab(c, DT.bewerbung).get(bewerbung)?.stelle !== name) throw new BackofficeError("invalid", "Die Bewerbung gehört zu einer anderen Stelle.");
      speichere(c, DT.stelle, s, { ...s, status: "Besetzt", workflow_state: "PH Besetzt", besetzt_am: heute(c), besetzt_durch: bewerbung || "", website_url: "" });
      c.kommentar(DT.stelle, name, "Als besetzt geschlossen", "Info");
      return "Besetzt";
    },
    website_cache_erneuern: (c, name) => {
      hole(c, DT.stelle, name);
      c.kommentar(DT.stelle, name, "Website aktualisiert (Testbetrieb: kein Aufruf der Website)", "Info");
      return { ok: true };
    },
    pruefen: (c, name) => {
      const s = hole(c, DT.stelle, name);
      const fehlt = [];
      if (!entgeltVollstaendig(s)) fehlt.push("Entgeltangabe nach § 9 Abs 2 GlBG");
      if (!String(s.stellenbeschreibung || "").trim()) fehlt.push("Stellenbeschreibung");
      if (!(s.aufgaben_de || []).length) fehlt.push("Aufgaben");
      if (!(s.anforderungen_de || []).length) fehlt.push("Anforderungen");
      return fehlt;
    },
  },

  [DT.ma]: {
    austritt_erfassen: (c, name, { datum }) => {
      const m = hole(c, DT.ma, name);
      if (!datum) throw new BackofficeError("invalid", "Bitte das Austrittsdatum eintragen.", { detail: { feld: "datum" } });
      if (m.eintritt && datum < m.eintritt) throw new BackofficeError("invalid", "Austritt liegt vor dem Eintritt.", { detail: { feld: "datum" } });
      speichere(c, DT.ma, m, { ...m, austritt: datum, status: datum < heute(c) ? "Ausgetreten" : m.status });
      c.kommentar(DT.ma, name, `Austritt erfasst: ${datum}`, "Info");
      return datum < heute(c) ? "Ausgetreten" : m.status;
    },
    zugang_jetzt_entziehen: (c, name) => {
      if (!leitung(c)) throw new BackofficeError("forbidden", "Nur die Personal-Leitung.");
      const m = hole(c, DT.ma, name);
      const t = isoDatumZeit(jetzt(c));
      speichere(c, DT.ma, m, { ...m, zugang_entzogen_am: t });
      return t;
    },
  },

  [DT.zeit]: {
    gehen_jetzt: (c, name) => {
      const z = hole(c, DT.zeit, name);
      if (z.gehen) return z.status;
      if (z.datum !== heute(c)) throw new BackofficeError("invalid", "Die Buchung ist von einem anderen Tag – bitte „Gehen“ manuell eintragen.");
      const neu = berechneBuchung(c, { ...z, gehen: zeitText(jetzt(c)) });
      speichere(c, DT.zeit, z, neu);
      return neu.status;
    },
    pause_bestaetigen: (c, name, { pause_min }) => {
      const z = hole(c, DT.zeit, name);
      const p = pause_min == null || pause_min === "" ? Number(z.pause_min) || 0 : Math.max(0, Number(pause_min) || 0);
      const neu = { ...z, pause_min: p, pause_bestaetigt: 1 };
      const dauer = Math.max(0, zeitMin(z.gehen) - zeitMin(z.kommen) - p);
      Object.assign(neu, { dauer_min: dauer, dauer_text: `${Math.floor(dauer / 60)}:${String(dauer % 60).padStart(2, "0")} h` });
      speichere(c, DT.zeit, z, neu);
      return p;
    },
    korrektur_beantragen: (c, name, { kommen, gehen, pause_min, grund }) => {
      const z = hole(c, DT.zeit, name);
      if (!String(grund || "").trim()) throw new BackofficeError("invalid", "Bitte einen Grund angeben.", { detail: { feld: "grund" } });
      if (z.korrektur_status === "Beantragt") throw new BackofficeError("invalid", "Für diese Buchung ist bereits eine Korrektur beantragt.");
      speichere(c, DT.zeit, z, { ...z, korrektur_status: "Beantragt", korrektur_grund: grund, korrektur_kommen: kommen || z.kommen, korrektur_gehen: gehen || z.gehen, korrektur_pause_min: pause_min == null || pause_min === "" ? z.pause_min : Number(pause_min), korrektur_beantragt_von: user(c) });
      return "Beantragt";
    },
    korrektur_entscheiden: (c, name, { bestaetigen = 1, notiz }) => {
      if (!leitung(c)) throw new BackofficeError("forbidden", "Nur die Personal-Leitung entscheidet über Korrekturen.");
      const z = hole(c, DT.zeit, name);
      if (z.korrektur_status !== "Beantragt") throw new BackofficeError("invalid", "Keine offene Korrektur.");
      let neu = { ...z, korrektur_entschieden_von: user(c), notiz: notiz ? `${z.notiz || ""}\n${notiz}`.trim() : z.notiz };
      if (Number(bestaetigen)) {
        neu = berechneBuchung(c, { ...neu, kommen: z.korrektur_kommen || z.kommen, gehen: z.korrektur_gehen || z.gehen, pause_min: z.korrektur_pause_min ?? z.pause_min, pause_bestaetigt: 1, korrektur_status: "Bestaetigt", status: "Korrigiert", korrigiert_von: user(c), korrigiert_am: isoDatumZeit(jetzt(c)) });
      } else neu.korrektur_status = "Abgelehnt";
      speichere(c, DT.zeit, z, neu);
      return neu.korrektur_status;
    },
  },

  [DT.abw]: {
    stornieren: (c, name) => {
      const a = hole(c, DT.abw, name);
      if (!["Beantragt", "Genehmigt"].includes(a.status)) throw new BackofficeError("invalid", "Nur offene oder genehmigte Anträge lassen sich stornieren.");
      speichere(c, DT.abw, a, { ...a, status: "Storniert", workflow_state: "PH Storniert" });
      c.kommentar(DT.abw, name, "Workflow: Stornieren → Storniert", "Workflow");
      return "Storniert";
    },
  },

  [DT.krank]: {
    bestaetigung_erfasst: (c, name, { datum }) => {
      const k = hole(c, DT.krank, name);
      if (k.status === "Storniert") throw new BackofficeError("invalid", "Die Krankmeldung ist storniert.");
      speichere(c, DT.krank, k, { ...k, bestaetigung_eingelangt_am: datum || heute(c), status: k.status === "Gemeldet" ? "Bestaetigt" : k.status });
      return "Bestaetigt";
    },
    gesund_melden: (c, name, { bis }) => {
      const k = hole(c, DT.krank, name);
      if (!bis || bis < k.von) throw new BackofficeError("invalid", "Der letzte Krankenstandstag liegt vor dem ersten.", { detail: { feld: "bis" } });
      speichere(c, DT.krank, k, { ...k, bis, bis_offen: 0, status: "Beendet" });
      return "Beendet";
    },
    verlaengern: (c, name, { bis_voraussichtlich }) => {
      const k = hole(c, DT.krank, name);
      if (!bis_voraussichtlich || bis_voraussichtlich < k.von) throw new BackofficeError("invalid", "Das Datum liegt vor dem Beginn.", { detail: { feld: "bis" } });
      speichere(c, DT.krank, k, { ...k, bis_offen: 0, bis_voraussichtlich });
      return bis_voraussichtlich;
    },
    stornieren: (c, name, { grund }) => {
      if (!leitung(c)) throw new BackofficeError("forbidden", "Nur die Personal-Leitung kann Krankmeldungen stornieren.");
      if (!String(grund || "").trim()) throw new BackofficeError("invalid", "Bitte einen Grund angeben.", { detail: { feld: "grund" } });
      const k = hole(c, DT.krank, name);
      speichere(c, DT.krank, k, { ...k, status: "Storniert" });
      return "Storniert";
    },
  },
};

/**
 * Workflow-Übergang. Frappe: workflowAction (prüft Rolle und Bedingung selbst). Mock: PH Abwesenheit wird hier
 * nachgebildet, weil die Bedingungen der Fixtures Python-Ausdrücke mit frappe.db sind (Selbstgenehmigung,
 * „vor Beginn“), die der Mock-Ausdrucksleser nicht auswerten kann; alle übrigen DocTypes über den MockClient.
 */
export async function workflow(client, doctype, name, aktion) {
  if (!istMock(client) || doctype !== DT.abw) return client.workflowAction(doctype, name, aktion);
  const c = client;
  const a = hole(c, DT.abw, name);
  const m = tab(c, DT.ma).get(a.mitarbeiter);
  const r = rollen(c);
  const darfL = leitung(c) || r.includes("PH Geschäftsführung");
  const eigen = Boolean(m?.user) && m.user === user(c);
  const vorBeginn = String(a.von) > heute(c);
  const UEB = {
    "Beantragt:Genehmigen": { nach: "Genehmigt", ok: darfL && !eigen },
    "Beantragt:Ablehnen": { nach: "Abgelehnt", ok: darfL && !eigen },
    "Beantragt:Stornieren": { nach: "Storniert", ok: eigen || darfL },
    "Genehmigt:Stornieren": { nach: "Storniert", ok: leitung(c) || (eigen && vorBeginn) },
    "Genehmigt:Wieder öffnen": { nach: "Beantragt", ok: leitung(c) && vorBeginn },
    "Abgelehnt:Erneut beantragen": { nach: "Beantragt", ok: eigen },
    "Storniert:Erneut beantragen": { nach: "Beantragt", ok: eigen && vorBeginn },
  };
  const u = UEB[`${a.status}:${aktion}`];
  if (!u) throw new BackofficeError("invalid", `Aktion „${aktion}“ ist im Zustand „${a.status}“ nicht möglich.`);
  if (!u.ok) throw new BackofficeError("forbidden", eigen ? "Über eigene Anträge entscheidet eine andere Person mit Leitungsrecht." : "Dafür fehlt das Recht.");
  const t = isoDatumZeit(jetzt(c));
  const neu = { ...a, status: u.nach, workflow_state: `PH ${u.nach}`, ...(u.nach === "Genehmigt" || u.nach === "Abgelehnt" ? { genehmigt_von: user(c), genehmigt_am: t } : {}) };
  speichere(c, DT.abw, a, neu);
  c.kommentar(DT.abw, name, `Workflow: ${aktion} → ${u.nach}`, "Workflow");
  return neu;
}

/** Prüfungen wie PH Abwesenheit.validate (Texte wie im Konzept § 5.2). Rein, auch für den Client nutzbar. */
export function pruefeAbwesenheit(w, bestehende = []) {
  if (!w.von || !w.bis) return { feld: "von", text: "Bitte einen Zeitraum wählen." };
  if (w.bis < w.von) return { feld: "bis", text: "Das Ende liegt vor dem Beginn." };
  if (Number(w.halbtags) && w.von !== w.bis) return { feld: "halbtags", text: "Halber Tag nur bei einem einzelnen Tag" };
  let arbeitstag = false;
  for (let d = w.von; d <= w.bis; d = plusTage(d, 1)) {
    const wt = new Date(`${d}T12:00:00`).getDay();
    if (wt !== 0 && wt !== 6) arbeitstag = true;
  }
  if (!arbeitstag) return { feld: "von", text: "Der Zeitraum enthält keinen Arbeitstag" };
  if (w.vertretung && w.vertretung === w.mitarbeiter) return { feld: "vertretung", text: "Vertretung kann nicht die Person selbst sein" };
  const ueber = bestehende.find((a) => a.mitarbeiter === w.mitarbeiter && a.name !== w.name && ["Beantragt", "Genehmigt"].includes(a.status) && a.von <= w.bis && a.bis >= w.von);
  if (ueber) return { feld: "von", text: `Überschneidung mit ${ueber.art} ${ueber.von === ueber.bis ? ueber.von : `${ueber.von} bis ${ueber.bis}`}` };
  return null;
}

/** Abwesenheit anlegen (Frappe: insert, Controller prüft; Mock: gleiche Prüfung). */
export async function abwesenheitAnlegen(client, werte) {
  if (!istMock(client)) return client.insert(DT.abw, werte);
  const c = client;
  const m = hole(c, DT.ma, werte.mitarbeiter);
  const f = pruefeAbwesenheit(werte, [...tab(c, DT.abw).values()]);
  if (f) throw new BackofficeError("invalid", f.text, { detail: { feld: f.feld } });
  return lege(c, DT.abw, { naming_series: "PH-ABW-.YYYY.-.#####", titel: `${m.titel}: ${werte.art} ${werte.von}`, mitarbeiter_name: m.titel, status: "Beantragt", workflow_state: "PH Beantragt", beantragt_von: user(c), beantragt_am: isoDatumZeit(jetzt(c)), halbtags: 0, begruendung: "", vertretung: "", ablehnungsgrund: "", ...werte }, `PH-ABW-${String(werte.von).slice(0, 4)}-`, 5);
}

/** Mock: Buchung speichern wie der Controller (validate + Netto/Pause). */
export function mockBuchungSpeichern(c, alt, werte) {
  const d = { ...alt, ...werte };
  pruefeBuchung(c, d);
  const neu = berechneBuchung(c, d);
  if (alt) speichere(c, DT.zeit, alt, neu);
  else return lege(c, DT.zeit, neu, `PH-ZEIT-${d.datum.slice(0, 4)}-`, 6);
  return neu;
}

/** Mock: Stelle anlegen (Slug aus Titel, eindeutig). */
export function mockStelleAnlegen(c, werte) {
  let slug = slugAusTitel(werte.titel);
  if (!slug) throw new BackofficeError("invalid", "Bitte einen Titel eingeben.", { detail: { feld: "titel" } });
  if (tab(c, DT.stelle).has(slug)) throw new BackofficeError("conflict", "Eine Stelle mit dieser Adresse auf der Website gibt es schon.", { detail: { feld: "titel" } });
  return lege(c, DT.stelle, { name: slug, slug, status: "Entwurf", workflow_state: "PH Entwurf", positionen_anzahl: 1, start: "ab sofort", standort: einst(c).standort || "", entgelt_zeitraum: "Monat", aufgaben_de: [], anforderungen_de: [], leistungen_de: [], quelle: "Backoffice", ...werte });
}

/** Mock: abgeleitete Felder einer Stelle (entgelt_vollstaendig, entgelt_text) wie validate(). */
export function stelleAbleiten(s) {
  return { ...s, entgelt_vollstaendig: entgeltVollstaendig(s) ? 1 : 0, entgelt_text: entgeltSatz(s) };
}

export const _intern = { berechneBuchung, eigenerMa, plusTage };
