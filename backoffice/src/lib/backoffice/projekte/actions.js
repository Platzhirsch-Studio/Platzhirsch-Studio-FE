"use server";
// Server Actions des Bereichs Projekte (10-konzept-projekte.md § 16.3). Jede Action prüft Sitzung und Recht erneut,
// validiert, wirft nie und gibt { ok:true, … } | { ok:false, code, message, fehler? } zurück.
// Workflow-Vorwärtsaktionen und Außenwirkung laufen als verzögerter Commit (G-03, fundament.workflow/-methode);
// einfache Feldwerte speichern sofort. Jede Action hat einen Mock-Pfad (MockClient kennt die ph_*-Methoden nicht:
// dort setzt die Action die Felder selbst, wie es die Methode im Frappe-Modus täte).

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf, darfDoc } from "@/lib/backoffice/auth/rechte";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { planeCommit } from "@/lib/backoffice/commit/server";
import { COMMIT_MS, COMMIT_MS_KIOSK } from "@/lib/backoffice/commit/konstanten";
import { isoDatumZeit } from "@/lib/backoffice/format";
import { TEXTE, PROJEKTARTEN, RAUM_VORSCHLAEGE, PHASEN, statusText } from "./texte.js";
import { parseDauer } from "./zeit.js";
import { leistungenAusPositionen } from "./montage.js";
import { phaseSchieben, zuruecksetzenSchritte } from "./phase.js";
import { offeneAbnahmeMaengel } from "./maengel.js";
import { fremdgewerkErlaubt } from "./regeln.js";

const F = TEXTE.fehler;
const NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,139}$/;
const KEIN_RECHT = { ok: false, code: "forbidden", message: F.keinRecht };
const UNGUELTIG = { ok: false, code: "invalid", message: F.unbekannt };

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  console.error("[projekte] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: F.unbekannt };
}

const leitung = (s) => darf(s, "projekte", "cancel");
const pfadProjekt = (name) => `/projekte/${encodeURIComponent(name)}`;
const text = (v, max = 2000) => String(v ?? "").trim().slice(0, max);
const istName = (v) => typeof v === "string" && NAME.test(v);

async function kontext(doctype, aktion = "write") {
  const session = await requireSession();
  const client = backoffice(session);
  const meta = await ladeMeta(client, doctype);
  if (!darfDoc(session, meta, aktion)) return { session, client, verboten: true };
  return { session, client };
}

/** Transition erlaubt? (Frappe/Mock prüfen beim Ausführen erneut.) */
async function uebergangErlaubt(client, doctype, name, aktion) {
  const t = await client.getTransitions(doctype, name);
  return t.some((x) => x.action === aktion);
}

async function planeWorkflow(session, client, { doctype, name, aktion, titel, pfad, kiosk = false }) {
  if (!istName(name) || typeof aktion !== "string") return UNGUELTIG;
  if (!(await uebergangErlaubt(client, doctype, name, aktion))) return { ok: false, code: "forbidden", message: TEXTE.liste.kanbanNichtVorgesehen };
  const r = await planeCommit(session, { action: "fundament.workflow", args: { doctype, name, aktion, pfad }, schluessel: `wf:${doctype}:${name}:${aktion}`, objekt: { doctype, name, titel }, titel: `${aktion} · ${titel || name}`, ms: kiosk ? COMMIT_MS_KIOSK : COMMIT_MS });
  return r?.ok === false ? r : { ...r, ok: true };
}

// ------------------------------------------------------------------ Projekt anlegen (PA1) --

/** @param {{kontakt:string, anfrage?:string, projektart:string, titel?:string, kurzbeschreibung?:string, prioritaet?:string, objekt?:object, raeume?:string[], idempotency?:string}} e */
export async function projektAnlegenAction(e = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "create");
    if (verboten) return KEIN_RECHT;
    const fehlerFelder = {};
    if (!istName(e.kontakt)) fehlerFelder.kontakt = TEXTE.neu.kundeFehlt;
    if (!PROJEKTARTEN.includes(e.projektart)) fehlerFelder.projektart = TEXTE.neu.artFehlt;
    if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: Object.values(fehlerFelder)[0], fehler: fehlerFelder };
    const prio = ["Normal", "Hoch", "Niedrig"].includes(e.prioritaet) ? e.prioritaet : "Normal";
    const titel = text(e.titel, 140);
    const raeume = (Array.isArray(e.raeume) ? e.raeume : RAUM_VORSCHLAEGE[e.projektart] || []).map((r) => text(r, 60)).filter(Boolean).slice(0, 20);
    const o = e.objekt || {};
    const zusatz = { kurzbeschreibung: text(e.kurzbeschreibung, 300), prioritaet: prio, objekt_strasse: text(o.strasse, 140), objekt_plz: text(o.plz, 10), objekt_ort: text(o.ort, 80), objekt_land: text(o.land, 40) || "Österreich", objekt_hinweis: text(o.hinweis, 300), berater: session.user, raeume: raeume.map((raum) => ({ raum, status: "geplant" })) };
    let name;
    if (e.anfrage && istName(e.anfrage) && client.modus === "frappe") {
      name = await client.call("ph_projekte.api.projekt_aus_anfrage", { anfrage: e.anfrage, projektart: e.projektart, titel: titel || undefined });
      const doc = await client.getDoc("PH Projekt", name);
      await client.save("PH Projekt", { name, ...zusatz }, { modified: doc.modified });
    } else {
      const schluessel = istName(e.idempotency) ? `projekt-neu:${e.kontakt}:${e.idempotency}` : "";
      if (schluessel) {
        const da = await client.getList("PH Projekt", { fields: ["name"], filters: [["idempotency_key", "=", schluessel]], limit: 1 });
        if (da.length) return { ok: true, name: da[0].name, bestand: true, href: pfadProjekt(da[0].name) };
      }
      const kunde = text(e.kundeName, 140);
      const doc = await client.insert("PH Projekt", { titel: titel || `${statusText("PH Projekt", e.projektart)} ${kunde}`.trim(), projektart: e.projektart, status: "Anfrage", kontakt: e.kontakt, kunde_name: kunde, anfrage: istName(e.anfrage) ? e.anfrage : "", eingang: isoDatumZeit(new Date()), idempotency_key: schluessel, quelle: "backoffice", ...zusatz });
      name = doc.name;
    }
    revalidatePath("/projekte");
    return { ok: true, name, href: pfadProjekt(name) };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Kopf / Details inline --

const FELDER_MITARBEITER = new Set(["titel", "prioritaet", "projektart", "liefertermin_geplant", "berater", "planer", "montageleiter", "kurzbeschreibung", "objekt_strasse", "objekt_plz", "objekt_ort", "objekt_land", "objekt_hinweis", "baustelle_kontakt", "baustelle_telefon", "portal_sichtbar", "portal_hinweis"]);
const FELDER_LEITUNG = new Set(["notiz_intern"]);

/** Ein Feld sofort speichern (Undo = Gegenwert). Nie `uebergabe_am`, `status`, `workflow_state` (E7). */
export async function projektFeldAction({ name, feld, wert, modified } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten) return KEIN_RECHT;
    if (!istName(name)) return UNGUELTIG;
    if (feld === "uebergabe_am") return { ok: false, code: "forbidden", message: F.uebergabeNie };
    if (!FELDER_MITARBEITER.has(feld) && !(FELDER_LEITUNG.has(feld) && leitung(session))) return { ok: false, code: "forbidden", message: F.feldGesperrt };
    const doc = await client.getDoc("PH Projekt", name);
    if (["Abgeschlossen", "Abgebrochen"].includes(doc.status) && !leitung(session)) return { ok: false, code: "forbidden", message: TEXTE.mappe.readonly };
    if (modified && doc.modified && String(modified) !== String(doc.modified)) return { ok: false, code: "conflict", message: "Von jemand anderem geändert – bitte neu laden." };
    const v = feld === "portal_sichtbar" ? (wert ? 1 : 0) : text(wert, 300);
    const alt = doc[feld] ?? "";
    const neu = await client.setValue("PH Projekt", name, feld, v);
    revalidatePath(pfadProjekt(name));
    return { ok: true, alt, wert: v, modified: neu.modified };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Phase --

/** Workflow-Vorwärtsaktion (verzögerter Commit, E2). */
export async function phasePlanenAction({ name, aktion, kiosk = false } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten) return KEIN_RECHT;
    if (aktion === "Abschließen" || aktion === "Abbrechen") return { ok: false, code: "invalid", message: aktion === "Abschließen" ? TEXTE.liste.kanbanAbschluss : TEXTE.liste.kanbanAbbruch };
    const doc = await client.getDoc("PH Projekt", name);
    return planeWorkflow(session, client, { doctype: "PH Projekt", name, aktion, titel: doc.titel, pfad: pfadProjekt(name), kiosk });
  } catch (err) {
    return fehler(err);
  }
}

/** Phase zurücksetzen (Leitung, schrittweise mit Stopp). */
export async function phaseZuruecksetzenAction({ name, ziel } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten || !leitung(session)) return KEIN_RECHT;
    const doc = await client.getDoc("PH Projekt", name);
    const n = zuruecksetzenSchritte(doc.status, ziel);
    if (!n) return UNGUELTIG;
    let erledigt = 0;
    for (let i = 0; i < n; i++) {
      try {
        await client.workflowAction("PH Projekt", name, "Zurück");
        erledigt++;
      } catch (err) {
        const aktuell = (await client.getDoc("PH Projekt", name)).status;
        return { ok: false, code: "conflict", message: `Bei ${aktuell} angehalten – Grund: ${istBackofficeError(err) ? err.message : F.unbekannt}`, erledigt, von: n };
      }
    }
    await client.kommentar("PH Projekt", name, `Phase zurückgesetzt auf ${ziel}`, "Comment");
    revalidatePath(pfadProjekt(name));
    return { ok: true, erledigt, von: n };
  } catch (err) {
    return fehler(err);
  }
}

/** E4: operative Fakten schieben die Phase (sofort, mit Systemeintrag). */
export async function phaseSchiebenAction({ name } = {}) {
  try {
    const { client, verboten } = await kontext("PH Projekt", "write");
    if (verboten) return KEIN_RECHT;
    const projekt = await client.getDoc("PH Projekt", name);
    const montagen = await client.getList("PH Montageauftrag", { fields: ["name", "status"], filters: [["projekt", "=", name]], limit: 50 });
    const abnahmen = await client.getList("PH Abnahme", { fields: ["name", "status"], filters: [["projekt", "=", name]], limit: 20 });
    const s = phaseSchieben({ projekt, montagen, abnahmen, positionen: projekt.positionen || [] });
    if (!s) return { ok: true, geschoben: false };
    if (!(await uebergangErlaubt(client, "PH Projekt", name, s.aktion))) return { ok: false, code: "forbidden", message: TEXTE.mappe.phaseAnpassen };
    await client.workflowAction("PH Projekt", name, s.aktion);
    await client.kommentar("PH Projekt", name, `System: ${s.grund}`, "Info");
    revalidatePath(pfadProjekt(name));
    return { ok: true, geschoben: true, ziel: s.ziel };
  } catch (err) {
    return fehler(err);
  }
}

/** PA8 – Abschließen (Leitung), Begründung Pflicht bei offenen Punkten. */
export async function abschliessenAction({ name, begruendung = "", offen = 0 } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten || !leitung(session)) return KEIN_RECHT;
    const b = text(begruendung, 500);
    if (Number(offen) > 0 && b.length < 5) return { ok: false, code: "invalid", message: "Bitte begründen, warum trotz offener Punkte abgeschlossen wird.", fehler: { begruendung: "Begründung fehlt" } };
    await client.workflowAction("PH Projekt", name, "Abschließen");
    await client.kommentar("PH Projekt", name, b ? `Abgeschlossen trotz offener Punkte: ${b}` : "Projekt abgeschlossen (Prüfliste erfüllt)", "Comment");
    revalidatePath(pfadProjekt(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** PA9 – Abbrechen (Leitung): Grund, Workflow, offene Montagen/Aufgaben je Haken. */
export async function abbrechenAction({ name, grund, folgen = [] } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten || !leitung(session)) return KEIN_RECHT;
    const g = text(grund, 500);
    if (g.length < 5) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben.", fehler: { grund: "Grund fehlt" } };
    await client.setValue("PH Projekt", name, "abgebrochen_grund", g);
    await client.workflowAction("PH Projekt", name, "Abbrechen");
    const ergebnisse = [];
    if (folgen.includes("montagen")) {
      for (const m of await client.getList("PH Montageauftrag", { fields: ["name", "status"], filters: [["projekt", "=", name], ["status", "in", ["Geplant", "Unterwegs", "In Arbeit"]]], limit: 50 })) {
        try {
          await client.setValue("PH Montageauftrag", m.name, "abbruch_grund", g);
          await client.workflowAction("PH Montageauftrag", m.name, "Abbrechen");
          ergebnisse.push({ titel: m.name, ok: true });
        } catch (err) {
          ergebnisse.push({ titel: m.name, ok: false, grund: istBackofficeError(err) ? err.message : F.unbekannt });
        }
      }
    }
    if (folgen.includes("aufgaben")) {
      for (const a of await client.getList("PH Projekt Aufgabe", { fields: ["name"], filters: [["projekt", "=", name], ["status", "in", ["Offen", "In Arbeit"]]], limit: 100 })) {
        try {
          await client.setValue("PH Projekt Aufgabe", a.name, "status", "Verworfen");
          ergebnisse.push({ titel: a.name, ok: true });
        } catch (err) {
          ergebnisse.push({ titel: a.name, ok: false, grund: istBackofficeError(err) ? err.message : F.unbekannt });
        }
      }
    }
    revalidatePath(pfadProjekt(name));
    return { ok: true, ergebnisse };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Aktivität --

/** Interne Notiz (sofort). */
export async function notizAction({ projekt, text: t } = {}) {
  try {
    const { client, verboten } = await kontext("PH Projekt", "write");
    if (verboten) return KEIN_RECHT;
    const inhalt = text(t);
    if (!inhalt) return { ok: false, code: "invalid", message: F.leerText };
    const k = await client.kommentar("PH Projekt", projekt, inhalt, "Comment");
    revalidatePath(pfadProjekt(projekt));
    return { ok: true, kommentar: k };
  } catch (err) {
    return fehler(err);
  }
}

/** Nachricht an den Kunden (verzögerter Commit, `portal_status_senden`). Ohne E-Mail kein Aufruf (§ 3.5 Punkt 5). */
export async function anKundeAction({ projekt, text: t, email } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt", "write");
    if (verboten) return KEIN_RECHT;
    const inhalt = text(t);
    if (!inhalt) return { ok: false, code: "invalid", message: F.leerText };
    if (!email) return { ok: false, code: "kein_email", message: TEXTE.mappe.keinPortal };
    const doc = await client.getDoc("PH Projekt", projekt);
    const r = await planeCommit(session, { action: "fundament.methode", args: { doctype: "PH Projekt", name: projekt, methode: "portal_status_senden", args: { text: inhalt }, pfad: pfadProjekt(projekt) }, objekt: { doctype: "PH Projekt", name: projekt, titel: doc.titel }, titel: `Nachricht an ${doc.kunde_name || "Kunde"}`, ms: COMMIT_MS });
    return r?.ok === false ? r : { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Montage --

/** Montage planen (Sheet § 6.2): Kette montageauftrag_anlegen → save. Mock: direkt anlegen. */
export async function montagePlanenAction({ projekt, datum, von = "08:00", bis = "16:00", team = [], fahrzeug = "", faggNachweis = false, idempotency } = {}) {
  try {
    const { client, verboten } = await kontext("PH Montageauftrag", "create");
    if (verboten) return KEIN_RECHT;
    if (!istName(projekt) || !/^\d{4}-\d{2}-\d{2}$/.test(String(datum)) || !/^\d{2}:\d{2}$/.test(von) || !/^\d{2}:\d{2}$/.test(bis) || bis <= von) return { ok: false, code: "invalid", message: "Bitte Datum und Zeit prüfen.", fehler: { datum: "Datum fehlt" } };
    const p = await client.getDoc("PH Projekt", projekt);
    if (idempotency && istName(idempotency)) {
      const da = await client.getList("PH Montageauftrag", { fields: ["name"], filters: [["projekt", "=", projekt], ["start", "=", `${datum} ${von}:00`]], limit: 1 });
      if (da.length) return { ok: true, name: da[0].name, bestand: true };
    }
    const { montierbar } = leistungenAusPositionen(p.positionen || []);
    const stunden = Math.max(0, (Number(bis.slice(0, 2)) * 60 + Number(bis.slice(3)) - Number(von.slice(0, 2)) * 60 - Number(von.slice(3))) / 60);
    const leute = [...new Set((Array.isArray(team) ? team : []).filter(istName))];
    const werte = { team: leute.map((user, i) => ({ user, rolle: i === 0 ? "Montageleiter" : "Monteur" })), leistungen: montierbar, stunden_geplant: stunden, fahrzeug: text(fahrzeug, 40) };
    let name;
    if (client.modus === "frappe") {
      const r = await client.runDocMethod("PH Projekt", projekt, "montageauftrag_anlegen", { start: `${datum} ${von}:00`, ende: `${datum} ${bis}:00`, montageleiter: leute[0] || p.montageleiter });
      name = r?.message || r;
      try {
        const m = await client.getDoc("PH Montageauftrag", name);
        await client.save("PH Montageauftrag", { name, ...werte }, { modified: m.modified });
      } catch (err) {
        return { ok: true, name, teilfehler: TEXTE.planenSheet.angelegt, band: `Team nicht gespeichert – ${istBackofficeError(err) ? err.message : F.unbekannt}` };
      }
    } else {
      const m = await client.insert("PH Montageauftrag", { titel: `Montage ${p.titel}`, projekt, kontakt: p.kontakt, status: "Geplant", start: `${datum} ${von}:00`, ende: `${datum} ${bis}:00`, montageleiter: leute[0] || p.montageleiter, strasse: p.objekt_strasse, plz: p.objekt_plz, ort: p.objekt_ort, hinweis_ort: p.objekt_hinweis, kunde_anwesend: p.baustelle_kontakt, telefon_vor_ort: p.baustelle_telefon, quelle: "backoffice", ...werte });
      name = m.name;
    }
    if (faggNachweis) await client.kommentar("PH Projekt", projekt, "Montage innerhalb der Rücktrittsfrist auf ausdrückliches Verlangen des Kunden.", "Comment");
    revalidatePath(pfadProjekt(projekt));
    revalidatePath("/projekte/montagen");
    return { ok: true, name, href: `/projekte/montagen/${encodeURIComponent(name)}` };
  } catch (err) {
    return fehler(err);
  }
}

/** Montage umplanen (sofort, Undo = alter Wert). */
export async function montageUmplanenAction({ name, start, ende } = {}) {
  try {
    const { client, verboten } = await kontext("PH Montageauftrag", "write");
    if (verboten) return KEIN_RECHT;
    const z = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
    if (!istName(name) || !z.test(start) || (ende && !z.test(ende))) return UNGUELTIG;
    const alt = await client.getDoc("PH Montageauftrag", name);
    if (!["Geplant", "Unterwegs"].includes(alt.status)) return { ok: false, code: "invalid", message: "Nur geplante Montagen lassen sich verschieben." };
    await client.setValue("PH Montageauftrag", name, { start: start.length === 16 ? `${start}:00` : start, ende: ende ? (ende.length === 16 ? `${ende}:00` : ende) : alt.ende });
    revalidatePath("/projekte/montagen");
    return { ok: true, alt: { start: alt.start, ende: alt.ende } };
  } catch (err) {
    return fehler(err);
  }
}

/** Montage-Status (Kiosk/Desktop): verzögerter Commit (Kiosk 6 s). */
export async function montageStatusAction({ name, aktion, kiosk = false } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Montageauftrag", "write");
    if (verboten) return KEIN_RECHT;
    if (!["Losfahren", "Beginnen", "Erledigt melden", "Zurück"].includes(aktion)) return UNGUELTIG;
    const doc = await client.getDoc("PH Montageauftrag", name);
    return planeWorkflow(session, client, { doctype: "PH Montageauftrag", name, aktion, titel: doc.titel, pfad: `/projekte/montagen/${encodeURIComponent(name)}`, kiosk });
  } catch (err) {
    return fehler(err);
  }
}

/** Leistung abhaken (sofort, Undo = Gegenwert). */
export async function leistungAction({ montage, zeile, erledigt } = {}) {
  try {
    const { client, verboten } = await kontext("PH Montageauftrag", "write");
    if (verboten) return KEIN_RECHT;
    const doc = await client.getDoc("PH Montageauftrag", montage);
    const leistungen = (doc.leistungen || []).map((l) => (l.name === zeile ? { ...l, erledigt: erledigt ? 1 : 0 } : l));
    if (!leistungen.some((l) => l.name === zeile)) return UNGUELTIG;
    await client.save("PH Montageauftrag", { name: montage, leistungen }, { modified: doc.modified });
    revalidatePath(`/projekte/montagen/${encodeURIComponent(montage)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Mangel an einer Montage erfassen (Kiosk/Desktop). */
export async function mangelErfassenAction({ montage, beschreibung, fristTage = 7, verantwortlich = "Studio", foto = "" } = {}) {
  try {
    const { client, verboten } = await kontext("PH Montageauftrag", "write");
    if (verboten) return KEIN_RECHT;
    const b = text(beschreibung, 140);
    if (!b) return { ok: false, code: "invalid", message: TEXTE.abnahme.beschreibungPflicht, fehler: { beschreibung: TEXTE.abnahme.beschreibungPflicht } };
    const doc = await client.getDoc("PH Montageauftrag", montage);
    const frist = new Date();
    frist.setDate(frist.getDate() + Math.min(60, Math.max(1, Number(fristTage) || 7)));
    const maengel = [...(doc.maengel || []), { beschreibung: b, frist: frist.toISOString().slice(0, 10), verantwortlich: ["Studio", "Lieferant", "Fremdgewerk"].includes(verantwortlich) ? verantwortlich : "Studio", status: "offen", foto: typeof foto === "string" ? foto.slice(0, 300) : "" }];
    await client.save("PH Montageauftrag", { name: montage, maengel }, { modified: doc.modified });
    revalidatePath(`/projekte/montagen/${encodeURIComponent(montage)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Mangel erledigt / an Service – drei Quellen (§ 5.11). */
export async function mangelAction({ quelle, doc, zeile, aktion } = {}) {
  try {
    const dt = { montage: "PH Montageauftrag", abnahme: "PH Abnahme", fremdgewerk: "PH Fremdgewerk" }[quelle];
    if (!dt || !istName(doc) || !istName(zeile) || !["erledigt", "service"].includes(aktion)) return UNGUELTIG;
    const { client, verboten } = await kontext(dt, "write");
    if (verboten) return KEIN_RECHT;
    if (aktion === "service") {
      if (dt === "PH Fremdgewerk") return UNGUELTIG;
      const r = await client.runDocMethod(dt, doc, "mangel_an_service", { zeile });
      revalidatePath("/projekte/maengel");
      return { ok: true, ergebnis: r };
    }
    if (dt === "PH Abnahme") {
      if (client.modus === "frappe") await client.runDocMethod(dt, doc, "mangel_erledigt", { zeile });
      else {
        const a = await client.getDoc(dt, doc);
        const positionen = (a.positionen || []).map((z) => (z.name === zeile ? { ...z, erledigt: 1, erledigt_am: new Date().toISOString().slice(0, 10) } : z));
        await client.setValue(dt, doc, { positionen, maengel_offen: offeneAbnahmeMaengel({ positionen }) });
      }
    } else {
      const d = await client.getDoc(dt, doc);
      const maengel = (d.maengel || []).map((z) => (z.name === zeile ? { ...z, status: "behoben", behoben_am: new Date().toISOString().slice(0, 10) } : z));
      await client.save(dt, { name: doc, maengel }, { modified: d.modified });
    }
    revalidatePath("/projekte/maengel");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Abnahme mit Kunde (§ 6.5, E3/E11) --

/**
 * Kette: abnahme_anlegen → Positionen → Prüfung „noch keine Unterschrift“ → Unterschrift (Abnahme + Montage) →
 * Workflow Montage „Abnehmen“ → Workflow Abnahme „Unterzeichnen“/„Mängel feststellen“ → Protokoll.
 * Kunde unterschreibt genau einmal unter einem Text (E3).
 */
export async function abnahmeMitKundeAction({ montageauftrag, positionen = [], nameKunde, unterschriftKunde, unterschriftStudio, kopieKanal = "portal", vorbehalte = "", nurNachweis = false, abwesendGrund = "" } = {}) {
  try {
    const { client, verboten } = await kontext("PH Abnahme", "create");
    if (verboten) return KEIN_RECHT;
    if (!istName(montageauftrag)) return UNGUELTIG;
    const m = await client.getDoc("PH Montageauftrag", montageauftrag);
    if (m.status !== "Erledigt") return { ok: false, code: "invalid", message: "Abnahme erst, wenn die Montage fertig ist." };
    const nk = text(nameKunde, 140);
    const sig = typeof unterschriftKunde === "string" && unterschriftKunde.startsWith("data:image/") ? unterschriftKunde.slice(0, 400_000) : "";
    // Studio: gezeichnete Signatur oder Bestätigung „Als … unterschreiben“ (gespeicherte Monteur-Signatur fehlt noch → Kommentar).
    const sigStudio = typeof unterschriftStudio === "string" && unterschriftStudio.startsWith("data:image/") ? unterschriftStudio.slice(0, 400_000) : "";
    if (nurNachweis) {
      if (!sig) {
        await client.kommentar("PH Montageauftrag", montageauftrag, `Leistungsnachweis ohne Unterschrift – ${text(abwesendGrund, 200) || "Kunde abwesend"}`, "Comment");
        return { ok: true, nachweis: true, unterschrieben: false };
      }
      if (m.unterschrift_kunde) return { ok: false, code: "conflict", message: TEXTE.abnahme.schonUnterschrieben };
      if (client.modus === "frappe") await client.runDocMethod("PH Montageauftrag", montageauftrag, "unterschrift_erfassen", { unterschrift: sig, name_kunde: nk });
      else await client.setValue("PH Montageauftrag", montageauftrag, { unterschrift_kunde: sig, unterschrift_name: nk, unterschrift_am: isoDatumZeit(new Date()) });
      return { ok: true, nachweis: true, unterschrieben: true };
    }
    if (!sig || !nk) return { ok: false, code: "invalid", message: "Unterschrift und Name des Kunden fehlen.", fehler: { unterschrift: "Unterschrift fehlt" } };
    const zeilen = (Array.isArray(positionen) ? positionen : []).slice(0, 200).map((z) => ({ bezeichnung: text(z.bezeichnung, 140), zustand: ["ok", "Mangel", "Nacharbeit"].includes(z.zustand) ? z.zustand : "ok", beschreibung: text(z.beschreibung, 300), frist: /^\d{4}-\d{2}-\d{2}$/.test(z.frist || "") ? z.frist : "", verantwortlich: ["Studio", "Lieferant", "Fremdgewerk"].includes(z.verantwortlich) ? z.verantwortlich : "" }));
    const ohneText = zeilen.findIndex((z) => z.zustand !== "ok" && !z.beschreibung);
    if (ohneText >= 0) return { ok: false, code: "invalid", message: TEXTE.abnahme.beschreibungPflicht, fehler: { [`zeile-${ohneText}`]: TEXTE.abnahme.beschreibungPflicht } };
    const offen = zeilen.filter((z) => z.zustand !== "ok").length;
    let abn;
    if (client.modus === "frappe") {
      const r = await client.runDocMethod("PH Montageauftrag", montageauftrag, "abnahme_anlegen", {});
      abn = r?.message || r;
    } else {
      const da = await client.getList("PH Abnahme", { fields: ["name"], filters: [["projekt", "=", m.projekt]], limit: 1 });
      abn = da[0]?.name || (await client.insert("PH Abnahme", { titel: `Schlussabnahme ${m.titel.replace(/^Montage /, "")}`, projekt: m.projekt, kontakt: m.kontakt, montageauftrag, status: "Entwurf", datum: new Date().toISOString().slice(0, 10), ort: m.ort, sprache: "de", positionen: zeilen, quelle: "backoffice" })).name;
    }
    const a = await client.getDoc("PH Abnahme", abn);
    if (a.unterschrift_kunde) return { ok: false, code: "conflict", message: TEXTE.abnahme.schonUnterschrieben, abnahme: abn };
    await client.save("PH Abnahme", { name: abn, positionen: zeilen, vorbehalte: text(vorbehalte, 500), abnahme_erklaert: 1, maengel_offen: offen }, { modified: a.modified });
    if (client.modus === "frappe") {
      await client.runDocMethod("PH Abnahme", abn, "unterschrift_erfassen", { unterschrift_kunde: sig, name_kunde: nk, unterschrift_studio: sigStudio });
      await client.runDocMethod("PH Montageauftrag", montageauftrag, "unterschrift_erfassen", { unterschrift: sig, name_kunde: nk });
    } else {
      await client.setValue("PH Abnahme", abn, { unterschrift_kunde: sig, unterschrift_kunde_name: nk, unterschrift_studio: sigStudio, unterzeichnet_am: isoDatumZeit(new Date()) });
      await client.setValue("PH Montageauftrag", montageauftrag, { unterschrift_kunde: sig, unterschrift_name: nk, unterschrift_am: isoDatumZeit(new Date()), abgenommen_am: isoDatumZeit(new Date()) });
    }
    await client.kommentar("PH Montageauftrag", montageauftrag, `Unterschrift aus Abnahme ${abn}`, "Info");
    if (!sigStudio && typeof unterschriftStudio === "string" && unterschriftStudio.startsWith("studio:")) await client.kommentar("PH Abnahme", abn, `Studio bestätigt durch ${text(unterschriftStudio.slice(7), 80)} (ohne gespeicherte Signatur)`, "Comment");
    await client.workflowAction("PH Montageauftrag", montageauftrag, "Abnehmen");
    await client.workflowAction("PH Abnahme", abn, offen ? "Mängel feststellen" : "Unterzeichnen");
    if (client.modus === "frappe") await client.runDocMethod("PH Abnahme", abn, "protokoll_als_dokument", {});
    await client.kommentar("PH Abnahme", abn, `Kopie an Kunde: ${kopieKanal === "papier" ? TEXTE.abnahme.papier : TEXTE.abnahme.portalMail}`, "Comment");
    revalidatePath(`/projekte/montagen/${encodeURIComponent(montageauftrag)}`);
    return { ok: true, abnahme: abn, offen, href: `/projekte/abnahmen/${encodeURIComponent(abn)}` };
  } catch (err) {
    return fehler(err);
  }
}

/** Abnahme abschließen (nur ohne offene Mängel). */
export async function abnahmeAbschliessenAction({ name } = {}) {
  try {
    const { client, verboten } = await kontext("PH Abnahme", "write");
    if (verboten) return KEIN_RECHT;
    const a = await client.getDoc("PH Abnahme", name);
    const offen = offeneAbnahmeMaengel(a);
    if (offen) return { ok: false, code: "invalid", message: TEXTE.abnahme.abschliessenGrund(offen) };
    if (client.modus !== "frappe" && a.maengel_offen) await client.setValue("PH Abnahme", name, "maengel_offen", 0);
    await client.workflowAction("PH Abnahme", name, "Abschließen");
    revalidatePath(`/projekte/abnahmen/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Rückmeldungen / Rendering --

/** Rückmeldung erledigt (verzögerter Commit; Gegenmethode fehlt – A15). */
export async function rueckmeldungErledigtAction({ doctype, name } = {}) {
  try {
    if (!["PH Rendering Feedback", "PH Projekt Nachricht"].includes(doctype) || !istName(name)) return UNGUELTIG;
    const { session, client, verboten } = await kontext(doctype, "write");
    if (verboten) return KEIN_RECHT;
    const methode = doctype === "PH Projekt Nachricht" ? "als_gelesen" : "erledigt";
    const r = await planeCommit(session, { action: "fundament.methode", args: { doctype, name, methode, pfad: "/projekte/rueckmeldungen" }, schluessel: `erledigt:${name}`, objekt: { doctype, name }, titel: TEXTE.rueckmeldungen.erledigtToast, ms: COMMIT_MS });
    return r?.ok === false ? r : { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Antwort auf eine Rückmeldung / Nachricht (sofort; Antworten sind Studio-Einträge im Faden). */
export async function antwortenAction({ doctype, name, text: t } = {}) {
  try {
    if (!["PH Rendering Feedback", "PH Projekt Nachricht", "PH Rendering"].includes(doctype) || !istName(name)) return UNGUELTIG;
    const { session, client, verboten } = await kontext(doctype, "write");
    if (verboten) return KEIN_RECHT;
    const inhalt = text(t);
    if (!inhalt) return { ok: false, code: "invalid", message: F.leerText };
    if (client.modus === "frappe") {
      await client.runDocMethod(doctype, name, "antworten", { text: inhalt });
    } else if (doctype === "PH Projekt Nachricht") {
      const n = await client.getDoc(doctype, name);
      await client.insert("PH Projekt Nachricht", { kontakt: n.kontakt, projekt: n.projekt, richtung: "ausgehend", status: "Gelesen", text: inhalt, autor: session.name, von_user: session.user, gesendet_am: isoDatumZeit(new Date()), quelle: "backoffice" });
      await client.setValue(doctype, name, { status: "Gelesen", gelesen_am: isoDatumZeit(new Date()) });
    } else {
      const f = doctype === "PH Rendering" ? await client.getDoc("PH Rendering", name) : await client.getDoc(doctype, name);
      await client.insert("PH Rendering Feedback", { projekt: f.projekt, rendering: doctype === "PH Rendering" ? name : f.rendering, kontakt: f.kontakt || "", art: "kommentar", von: "studio", status: "Beantwortet", text: inhalt, autor: session.name, antwort_auf: doctype === "PH Rendering Feedback" ? name : "", erstellt_am: isoDatumZeit(new Date()), quelle: "backoffice" });
      if (doctype === "PH Rendering Feedback") await client.setValue(doctype, name, { status: "Beantwortet", beantwortet_am: isoDatumZeit(new Date()) });
    }
    revalidatePath("/projekte/rueckmeldungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Studio-Pin setzen (Modus „Pin“). */
export async function pinSetzenAction({ rendering, x, y, text: t } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Rendering Feedback", "create");
    if (verboten) return KEIN_RECHT;
    const px = Math.round(Number(x) * 10) / 10;
    const py = Math.round(Number(y) * 10) / 10;
    if (!istName(rendering) || !(px >= 0 && px <= 100 && py >= 0 && py <= 100)) return UNGUELTIG;
    const r = await client.getDoc("PH Rendering", rendering);
    const doc = await client.insert("PH Rendering Feedback", { projekt: r.projekt, rendering, art: "annotation", von: "studio", status: "Offen", text: text(t, 500) || "Pin", autor: session.name, punkt_x: px, punkt_y: py, erstellt_am: isoDatumZeit(new Date()), quelle: "backoffice" });
    revalidatePath(`/projekte/${encodeURIComponent(r.projekt)}/renderings/${encodeURIComponent(rendering)}`);
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Rendering-Workflow (Vorlegen, Freigabe übernehmen, Verwerfen) – verzögerter Commit. */
export async function renderingStatusAction({ name, aktion } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Rendering", "write");
    if (verboten) return KEIN_RECHT;
    if (!["Kunden vorlegen", "Freigeben", "Verwerfen", "Beantwortet"].includes(aktion)) return UNGUELTIG;
    const r = await client.getDoc("PH Rendering", name);
    if (aktion === "Kunden vorlegen" && !r.bild) return { ok: false, code: "invalid", message: TEXTE.rendering.keinBild };
    return planeWorkflow(session, client, { doctype: "PH Rendering", name, aktion, titel: r.titel, pfad: `/projekte/${encodeURIComponent(r.projekt)}/renderings/${encodeURIComponent(name)}` });
  } catch (err) {
    return fehler(err);
  }
}

/** Planung: Methoden-Whitelist (Mock setzt den Status wie die Methode). */
export async function planungAction({ name, methode, kommentar = "" } = {}) {
  const ERLAUBT = ["kunden_vorlegen", "freigeben", "verwerfen", "neue_version", "positionen_ins_projekt"];
  try {
    if (!ERLAUBT.includes(methode) || !istName(name)) return UNGUELTIG;
    const { client, verboten } = await kontext("PH Planung", "write");
    if (verboten) return KEIN_RECHT;
    const p = await client.getDoc("PH Planung", name);
    let ergebnis = null;
    if (client.modus === "frappe") {
      ergebnis = await client.runDocMethod("PH Planung", name, methode, methode === "freigeben" ? { durch_kunde: 1, kommentar: text(kommentar, 300) } : {});
    } else {
      const jetzt = isoDatumZeit(new Date());
      if (methode === "kunden_vorlegen") await client.setValue("PH Planung", name, { status: "Kunde vorgelegt", vorgelegt_am: jetzt, kunde_sichtbar: 1, kunde_entscheidung: "offen" });
      if (methode === "freigeben") await client.setValue("PH Planung", name, { status: "Freigegeben", freigabe_durch_kunde_am: jetzt, freigabe_quelle: "backoffice", kunde_entscheidung: "freigegeben" });
      if (methode === "verwerfen") await client.setValue("PH Planung", name, { status: "Verworfen", kunde_sichtbar: 0 });
      if (methode === "neue_version") {
        const { name: _n, creation: _c, modified: _m, ...rest } = p;
        const neu = await client.insert("PH Planung", { ...rest, version: Number(p.version || 1) + 1, status: "Entwurf", vorgaenger: name, kunde_entscheidung: "", kunde_kommentar: "", vorgelegt_am: "", kunde_sichtbar: 0, titel: `${p.bezeichnung} v${Number(p.version || 1) + 1}` });
        ergebnis = neu.name;
      }
      if (methode === "positionen_ins_projekt") await client.kommentar("PH Projekt", p.projekt, `Positionen aus ${p.titel} übernommen`, "Info");
    }
    revalidatePath(`/projekte/${encodeURIComponent(p.projekt)}`);
    return { ok: true, ergebnis, projekt: p.projekt };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Nachtrag --

/** Freigabe vor Ort mit Unterschrift (ohne Unterschrift nicht speicherbar). */
export async function nachtragFreigabeAction({ name, unterschrift, nameKunde } = {}) {
  try {
    const { client, verboten } = await kontext("PH Nachtrag", "write");
    if (verboten) return KEIN_RECHT;
    const sig = typeof unterschrift === "string" && unterschrift.startsWith("data:image/") ? unterschrift.slice(0, 400_000) : "";
    if (!sig || !text(nameKunde)) return { ok: false, code: "invalid", message: TEXTE.nachtrag.unterschriftPflicht };
    const n = await client.getDoc("PH Nachtrag", name);
    if (n.unterschrift_kunde) return { ok: false, code: "conflict", message: TEXTE.abnahme.schonUnterschrieben };
    if (client.modus === "frappe") await client.runDocMethod("PH Nachtrag", name, "freigabe_erfassen", { unterschrift: sig, name_kunde: text(nameKunde, 140) });
    else {
      await client.setValue("PH Nachtrag", name, { unterschrift_kunde: sig, unterschrift_name: text(nameKunde, 140), entscheidung_quelle: "backoffice", entscheidung_am: isoDatumZeit(new Date()) });
      await client.workflowAction("PH Nachtrag", name, "Freigeben");
    }
    revalidatePath(`/projekte/${encodeURIComponent(n.projekt)}/nachtraege/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Nachtrag vorlegen (verzögerter Commit, Workflow „Kunden vorlegen“). */
export async function nachtragVorlegenAction({ name } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Nachtrag", "write");
    if (verboten) return KEIN_RECHT;
    const n = await client.getDoc("PH Nachtrag", name);
    return planeWorkflow(session, client, { doctype: "PH Nachtrag", name, aktion: "Kunden vorlegen", titel: n.titel, pfad: `/projekte/${encodeURIComponent(n.projekt)}/nachtraege/${encodeURIComponent(name)}` });
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Aufgaben, Zeiten --

export async function aufgabeAnlegenAction({ projekt, titel, faellig = "", zugewiesen_an = "", prioritaet = "Normal" } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekt Aufgabe", "create");
    if (verboten) return KEIN_RECHT;
    const t = text(titel, 140);
    if (!istName(projekt)) return { ok: false, code: "invalid", message: TEXTE.aufgaben.projektPflicht, fehler: { projekt: TEXTE.aufgaben.projektPflicht } };
    if (!t) return { ok: false, code: "invalid", message: F.leerText, fehler: { titel: F.leerText } };
    const doc = await client.insert("PH Projekt Aufgabe", { projekt, titel: t, status: "Offen", faellig: /^\d{4}-\d{2}-\d{2}$/.test(faellig) ? faellig : "", zugewiesen_an: istName(zugewiesen_an) ? zugewiesen_an : session.user, prioritaet: ["Normal", "Hoch", "Niedrig"].includes(prioritaet) ? prioritaet : "Normal", quelle: "backoffice" });
    revalidatePath("/projekte/aufgaben");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Aufgabenstatus (sofort, Undo = alter Status; DocType ohne Workflow). */
export async function aufgabeStatusAction({ name, status } = {}) {
  try {
    if (!["Offen", "In Arbeit", "Erledigt", "Verworfen"].includes(status)) return UNGUELTIG;
    const { client, verboten } = await kontext("PH Projekt Aufgabe", "write");
    if (verboten) return KEIN_RECHT;
    const alt = await client.getDoc("PH Projekt Aufgabe", name);
    await client.setValue("PH Projekt Aufgabe", name, { status, erledigt_am: status === "Erledigt" ? isoDatumZeit(new Date()) : "" });
    revalidatePath("/projekte/aufgaben");
    return { ok: true, alt: alt.status };
  } catch (err) {
    return fehler(err);
  }
}

/** Zeit buchen (§ 5.15) – für andere nur Leitung. */
export async function zeitBuchenAction({ projekt, dauer, datum, taetigkeit = "Planung", beschreibung = "", abrechenbar = true, user, montageauftrag = "" } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projektzeit", "create");
    if (verboten) return KEIN_RECHT;
    if (!istName(projekt)) return { ok: false, code: "invalid", message: TEXTE.aufgaben.projektPflicht, fehler: { projekt: TEXTE.aufgaben.projektPflicht } };
    const d = parseDauer(dauer);
    if (!d.ok) return { ok: false, code: "invalid", message: d.fehler === "zuviel" ? TEXTE.zeiten.zuViel : TEXTE.zeiten.unklar, fehler: { dauer: d.fehler === "zuviel" ? TEXTE.zeiten.zuViel : TEXTE.zeiten.unklar } };
    const fuer = istName(user) ? user : session.user;
    if (fuer !== session.user && !leitung(session)) return KEIN_RECHT;
    const tag = /^\d{4}-\d{2}-\d{2}$/.test(datum || "") ? datum : new Date().toISOString().slice(0, 10);
    const t = ["Planung", "Beratung", "Montage", "Fahrt", "Koordination", "Service", "Buero", "Sonstiges"].includes(taetigkeit) ? taetigkeit : "Sonstiges";
    const doc = await client.insert("PH Projektzeit", { projekt, user: fuer, status: abrechenbar ? "Offen" : "Nicht abrechenbar", taetigkeit: t, datum: tag, dauer_min: d.minuten, abrechenbar: abrechenbar ? 1 : 0, beschreibung: text(beschreibung, 300), montageauftrag: istName(montageauftrag) ? montageauftrag : "", quelle: "backoffice", titel: `${t} ${d.text}` });
    revalidatePath(pfadProjekt(projekt));
    return { ok: true, name: doc.name, text: d.text };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Dokumente, Referenzen, Fremdgewerke, Produktpässe --

/** Kunde sieht an/aus (sofort, Undo = Gegenaufruf). */
export async function dokumentPortalAction({ name, freigeben } = {}) {
  try {
    const { client, verboten } = await kontext("PH Projekt Dokument", "write");
    if (verboten) return KEIN_RECHT;
    if (client.modus === "frappe") await client.runDocMethod("PH Projekt Dokument", name, "portal_freigeben", { freigeben: freigeben ? 1 : 0 });
    else await client.setValue("PH Projekt Dokument", name, { kunde_sichtbar: freigeben ? 1 : 0, portal_freigabe_am: freigeben ? isoDatumZeit(new Date()) : "" });
    revalidatePath("/projekte/dokumente");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Referenz prüfen: Methoden (Frappe) bzw. Workflow (Mock). Veröffentlichen nur Leitung. */
export async function referenzAction({ name, methode, notiz = "" } = {}) {
  const WF = { veroeffentlichen: "Veröffentlichen", ablehnen: "Ablehnen", zurueckziehen: "Zurückziehen", widerruf_erfassen: "Widerrufen" };
  try {
    if (!WF[methode]) return UNGUELTIG;
    const { session, client, verboten } = await kontext("PH Referenz", "write");
    if (verboten) return KEIN_RECHT;
    if (methode === "veroeffentlichen" && !leitung(session)) return KEIN_RECHT;
    if ((methode === "ablehnen" || methode === "zurueckziehen") && text(notiz).length < 3) return { ok: false, code: "invalid", message: "Bitte eine Notiz angeben.", fehler: { notiz: "Notiz fehlt" } };
    if (client.modus === "frappe") await client.runDocMethod("PH Referenz", name, methode, methode === "widerruf_erfassen" ? { kanal: "E-Mail" } : methode === "veroeffentlichen" ? {} : { notiz: text(notiz, 300) });
    else {
      await client.workflowAction("PH Referenz", name, WF[methode]);
      if (notiz) await client.kommentar("PH Referenz", name, text(notiz, 300), "Comment");
    }
    revalidatePath("/projekte/referenzen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Fremdgewerk-Status (§ 7.5, Übergänge exakt). */
export async function fremdgewerkStatusAction({ name, status } = {}) {
  try {
    const { client, verboten } = await kontext("PH Fremdgewerk", "write");
    if (verboten) return KEIN_RECHT;
    const g = await client.getDoc("PH Fremdgewerk", name);
    if (!fremdgewerkErlaubt(g.status, status)) return { ok: false, code: "invalid", message: TEXTE.liste.kanbanNichtVorgesehen };
    if (status === "Geplant" && !g.termin_von && !(g.termine || []).length) return { ok: false, code: "invalid", message: TEXTE.fremdgewerke.terminFehlt };
    if (client.modus === "frappe") await client.runDocMethod("PH Fremdgewerk", name, "status_setzen", { status });
    else await client.setValue("PH Fremdgewerk", name, "status", status);
    revalidatePath("/projekte/fremdgewerke");
    return { ok: true, alt: g.status };
  } catch (err) {
    return fehler(err);
  }
}

/** Produktpässe erzeugen – nur geliefert/montiert, Lieferdatum Pflicht (nie „heute“ vorbelegt). */
export async function produktpaesseAction({ projekt, positionen = [] } = {}) {
  try {
    const { client, verboten } = await kontext("PH Produktpass", "create");
    if (verboten) return KEIN_RECHT;
    const p = await client.getDoc("PH Projekt", projekt);
    const wahl = (Array.isArray(positionen) ? positionen : []).filter((z) => istName(z.zeile) && /^\d{4}-\d{2}-\d{2}$/.test(z.lieferdatum || ""));
    if (!wahl.length) return { ok: false, code: "invalid", message: TEXTE.produktpaesse.lieferdatumPflicht };
    let n = 0;
    for (const z of wahl) {
      const pos = (p.positionen || []).find((x) => x.name === z.zeile);
      if (!pos || !["geliefert", "montiert"].includes(pos.lieferstatus) || pos.produktpass) continue;
      await client.insert("PH Produktpass", { titel: pos.bezeichnung, kontakt: p.kontakt, projekt, position: pos.name, status: "Aktiv", lieferdatum: z.lieferdatum, produkt_name: pos.bezeichnung, marke: pos.marke || "", seriennummer: text(z.seriennummer, 60), kunde_sichtbar: z.kundeSieht === false ? 0 : 1, quelle: "backoffice" });
      n++;
    }
    revalidatePath(pfadProjekt(projekt));
    return { ok: true, anzahl: n };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Einstellungen --

const EINSTELLUNG_FELDER = { feedback_erinnerung_tage: "int", max_audio_mb: "int", max_fotos_je_projekt: "int", tagebuch_aktiv: "check", referenz_freigabe_aktiv: "check", portal_token_tage: "int", montage_tagesstunden: "float", maengel_erinnerung_tage: "int", liefertermin_kunde_automatisch: "check", haftungshinweis_fremdgewerke: "text", montagebericht_fusstext: "text", abnahme_fusstext: "text" };

export async function einstellungenAction({ werte = {}, modified } = {}) {
  try {
    const { session, client, verboten } = await kontext("PH Projekte Einstellungen", "write");
    if (verboten || !leitung(session)) return KEIN_RECHT;
    const doc = await client.getDoc("PH Projekte Einstellungen", "PH Projekte Einstellungen");
    const neu = {};
    const fehlerFelder = {};
    for (const [k, art] of Object.entries(EINSTELLUNG_FELDER)) {
      if (!(k in werte)) continue;
      const v = werte[k];
      if (art === "check") neu[k] = v ? 1 : 0;
      else if (art === "text") neu[k] = text(v, 1000);
      else {
        const n = Number(String(v).replace(",", "."));
        if (!Number.isFinite(n) || n < 0 || (art === "int" && !Number.isInteger(n))) fehlerFelder[k] = "Bitte eine Zahl ≥ 0.";
        else neu[k] = n;
      }
    }
    if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: Object.values(fehlerFelder)[0], fehler: fehlerFelder };
    const r = await client.save("PH Projekte Einstellungen", { name: "PH Projekte Einstellungen", ...neu }, { modified: modified || doc.modified });
    revalidatePath("/projekte/einstellungen");
    return { ok: true, modified: r.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Phasen-Liste für Prüfungen im Client (keine Logik im Client duplizieren). */
export async function phasenAction() {
  return { ok: true, phasen: PHASEN };
}
