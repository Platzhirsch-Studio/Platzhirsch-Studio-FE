"use server";
// Server Actions des Bereichs Kundenkarte (Konzept §16.3). Jede Action: Sitzung + Rolle prüfen, Eingaben
// prüfen, Frappe-Methoden über methoden.js (Mock-Pfad inklusive), Ergebnis { ok, code?, message?, daten? } –
// nie werfen, nie Rohfehler an den Client. Verzögerte Commits (Variante A) planen hier und laufen über
// lib/backoffice/commit/aktionen/kundenkarte.js nach 8 s.

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { planeCommit } from "@/lib/backoffice/commit/server";
import { sessionStore } from "@/lib/backoffice/auth/store";
import { isoDatum, isoDatumZeit } from "@/lib/backoffice/format";
import { DT, ERSATZ_GRUENDE, OFFENE_STATUS, STUFE_GRUENDE, UEBERTRAGUNGSGRUENDE, WIDERRUF_KANAELE, EINWILLIGUNG_KANAELE, ABLEHNUNGSGRUENDE, sperrgrund } from "./labels";
import { M, aufruf, methode } from "./methoden";
import { istKartennummer, normalisiereKartennummer } from "./kartennummer";
import { ablehnGrundText, bezugsTypen, darfBetraege, darfSchreiben, geburtstagParsen, idempotenzSchluessel, istLeitung, kanaeleFuer, ohneBelegErlaubt, rolleVon, stornoErlaubt, stufenplanFehler, giltAbAusZuordnung, kanalVorschau } from "./regeln";
import { pruefeKundentexte } from "./textpruefung";
import { kontext, offeneBelege, sucheBeleg, findeKarte, ladeKarte, ladeVerlauf } from "./daten";
import { SOFORT_FELDER } from "./felder";
import { DATENSCHUTZINFO_VERSION, EINWILLIGUNG_TEXTVERSION, T } from "./texte";

const UNGUELTIG = { ok: false, code: "invalid", message: "Unvollständige Angaben." };
const KEIN_RECHT = { ok: false, code: "forbidden", message: T.fehler.recht };
const NUR_LEITUNG = { ok: false, code: "forbidden", message: "Das darf die Leitung." };

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, detail: err.detail?.code ? { code: err.detail.code } : undefined };
  console.error("[kundenkarte] Action", err?.name || err);
  return { ok: false, code: "unavailable", message: T.fehler.allgemein };
}

const istNr = (x) => typeof x === "string" && istKartennummer(x) && normalisiereKartennummer(x) === x;
const text = (x, max = 140) => String(x ?? "").trim().slice(0, max);
const NAME_RE = /^[\w.@ -]{3,80}$/;

async function sitzung({ schreiben = false, leitung = false } = {}) {
  const session = await requireSession();
  const rolle = rolleVon(session);
  if (!rolle || !darf(session, "kundenkarte", "read")) return { fehler: KEIN_RECHT };
  if (schreiben && !darfSchreiben(rolle)) return { fehler: KEIN_RECHT };
  if (leitung && !istLeitung(rolle)) return { fehler: NUR_LEITUNG };
  const ctx = kontext(session);
  return { ctx, session, rolle };
}

function neuLaden(karte) {
  if (karte) revalidatePath(`/kundenkarte/karten/${karte}`);
  revalidatePath("/kundenkarte/karten");
  revalidatePath("/kundenkarte");
}

// ------------------------------------------------------------- Suche/Scan --

/** Scan/Eingabe → { href } wenn eine Karte existiert; sonst Treffer nach Name. */
export async function karteSuchenAction({ q } = {}) {
  const s = await sitzung();
  if (s.fehler) return s.fehler;
  const roh = text(q, 60);
  if (!roh) return { ok: true, treffer: [] };
  try {
    if (istKartennummer(roh)) {
      const nr = await findeKarte(s.ctx, roh);
      return nr ? { ok: true, href: `/kundenkarte/karten/${nr}`, karte: nr } : { ok: true, unbekannt: normalisiereKartennummer(roh), treffer: [] };
    }
    const treffer = await s.ctx.client.getList(DT.karte, { fields: ["name", "kunde_name", "stufe", "status"], orFilters: [["kunde_name", "like", `%${roh}%`], ["name", "like", `%${roh.toUpperCase()}%`]], limit: 8, orderBy: "kunde_name asc" });
    return { ok: true, treffer };
  } catch (err) {
    return fehler(err);
  }
}

/** Vorschau (Peek): Kopf, Vorteile, letzte 5 Verlaufseinträge – gefiltert je Rolle. */
export async function kartePeekAction({ karte } = {}) {
  const s = await sitzung();
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    const { karte: k, uebersicht, stufen, kommentare } = await ladeKarte(s.ctx, karte);
    const verlauf = (await ladeVerlauf(s.ctx, k, kommentare)).slice(0, 5);
    const st = stufen.find((x) => x.name === k.stufe);
    return { ok: true, karte: { name: k.name, kunde_name: k.kunde_name, status: k.status, stufe: k.stufe, farbe: st?.farbe || "", stufe_seit: k.stufe_seit, sperrgrund_art: k.sperrgrund_art }, vorteile: uebersicht.vorteile, verlauf };
  } catch (err) {
    return fehler(err);
  }
}

// --------------------------------------------------------------- Einlösen --

export async function belegeAction({ karte, vorteil } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !vorteil) return UNGUELTIG;
  try {
    const [k, v] = await Promise.all([s.ctx.client.getDoc(DT.karte, karte), s.ctx.client.getDoc(DT.vorteil, vorteil)]);
    const belege = await offeneBelege(s.ctx, k, v.art);
    return { ok: true, belege, ohneBeleg: ohneBelegErlaubt(v.art) };
  } catch (err) {
    return fehler(err);
  }
}

export async function belegSuchenAction({ karte, vorteil, q } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !vorteil) return UNGUELTIG;
  try {
    const [k, v] = await Promise.all([s.ctx.client.getDoc(DT.karte, karte), s.ctx.client.getDoc(DT.vorteil, vorteil)]);
    return { ok: true, belege: await sucheBeleg(s.ctx, k, v.art, text(q, 40)) };
  } catch (err) {
    return fehler(err);
  }
}

/** Einlösung planen (Variante A, 8 s). Prüft Bezugsregel §4.6 und Verfügbarkeit vorab. */
export async function einloesenPlanenAction({ karte, vorteil, bezugDoctype, bezug, kommentar, ort } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || typeof vorteil !== "string") return UNGUELTIG;
  try {
    const [k, v, u] = await Promise.all([s.ctx.client.getDoc(DT.karte, karte), s.ctx.client.getDoc(DT.vorteil, vorteil), methode(s.ctx.client, DT.karte, karte, "portal_daten", {})]);
    if (!bezug && !ohneBelegErlaubt(v.art)) return { ok: false, code: "invalid", message: "Bitte Auftrag, Lieferschein, Montageauftrag oder Beleg wählen." };
    if (bezug && !bezugsTypen(v.art).includes(bezugDoctype)) return { ok: false, code: "invalid", message: "Dieser Beleg passt nicht zum Vorteil." };
    const zeile = (u.vorteile || []).find((x) => x.vorteil === vorteil);
    if (!zeile) return { ok: false, code: "invalid", message: "Der Vorteil ist der Stufe nicht zugeordnet." };
    if (!zeile.verfuegbar) return { ok: false, code: "conflict", message: k.status !== "Aktiv" ? "Die Karte ist nicht aktiv." : "Limit erreicht.", detail: { code: k.status !== "Aktiv" ? "card_inactive" : "limit_reached" } };
    const ortWert = ["Showroom", "Kassa", "Packtisch", "Service", "Event", "Backoffice"].includes(ort) ? ort : "Showroom";
    const r = await planeCommit(s.session, {
      action: "kundenkarte.einloesen",
      args: { karte, vorteil, bezug_doctype: bezug ? bezugDoctype : null, bezug: bezug || null, kommentar: text(kommentar, 500) || null, ort: ortWert },
      schluessel: `einloesen:${karte}:${vorteil}:${Date.now()}`,
      objekt: { doctype: DT.karte, name: karte, titel: k.kunde_name },
      titel: `Einlösung ${v.titel} für ${k.kunde_name}`,
    });
    return { ...r, vorteilTitel: v.titel, kunde: k.kunde_name };
  } catch (err) {
    return fehler(err);
  }
}

export async function uebergabePlanenAction({ karte } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    const k = await s.ctx.client.getDoc(DT.karte, karte);
    if (k.status !== "Beantragt") return { ok: false, code: "conflict", message: "Die Karte ist nicht mehr beantragt." };
    return await planeCommit(s.session, { action: "kundenkarte.uebergabe", args: { karte, ort: "Showroom" }, schluessel: `uebergabe:${karte}`, objekt: { doctype: DT.karte, name: karte, titel: k.kunde_name }, titel: `Übergabe ${karte}` });
  } catch (err) {
    return fehler(err);
  }
}

/** Sperren planen – eine oder mehrere Karten (Massenaktion nur aktive). */
export async function sperrenPlanenAction({ karten, art, text: freitext } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(karten) ? karten : [karten]).filter(istNr).slice(0, 100);
  if (!liste.length || !sperrgrund(art)) return UNGUELTIG;
  if (art === "Sonstiges" && text(freitext).length < 3) return { ok: false, code: "invalid", message: "Bei „Sonstiges“ bitte kurz beschreiben." };
  try {
    const plaene = [];
    let uebersprungen = 0;
    for (const karte of liste) {
      const k = await s.ctx.client.getDoc(DT.karte, karte);
      if (!["Aktiv", "Beantragt"].includes(k.status)) {
        uebersprungen++;
        continue;
      }
      plaene.push({ karte, plan: await planeCommit(s.session, { action: "kundenkarte.sperren", args: { karte, art, text: text(freitext) }, schluessel: `sperren:${karte}`, objekt: { doctype: DT.karte, name: karte, titel: k.kunde_name }, titel: `Sperren ${karte}` }) });
    }
    return { ok: true, plaene, uebersprungen };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------------------------- Lebenszyklus --

export async function entsperrenAction({ karte } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    await methode(s.ctx.client, DT.karte, karte, "entsperren", {});
    neuLaden(karte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function kuendigenAction({ karte, durch, grund } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !["Kundin", "Platzhirsch"].includes(durch) || text(grund).length < 3) return { ok: false, code: "invalid", message: "Bitte angeben, wer kündigt, und einen Grund." };
  try {
    await methode(s.ctx.client, DT.karte, karte, "kuendigen", { grund: `Kündigung durch ${durch}: ${text(grund)}` });
    await s.ctx.client.kommentar(DT.karte, karte, `Kündigung durch ${durch} – ${text(grund)}`);
    neuLaden(karte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ersatzkarteAction({ karte, art, grund } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !ERSATZ_GRUENDE.includes(art)) return UNGUELTIG;
  try {
    const neu = await methode(s.ctx.client, DT.karte, karte, "ersatzkarte_ausstellen", { sperrgrund_art: art, grund: text(grund) || null });
    neuLaden(karte);
    return { ok: true, karte: neu };
  } catch (err) {
    return fehler(err);
  }
}

export async function uebertragenAction({ karte, zielKontakt, grundArt, grund } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !NAME_RE.test(String(zielKontakt || "")) || !UEBERTRAGUNGSGRUENDE.includes(grundArt)) return UNGUELTIG;
  try {
    const neu = await methode(s.ctx.client, DT.karte, karte, "uebertragen", { ziel_kontakt: zielKontakt, grund_art: grundArt, grund: text(grund) || null, einwilligung_auswertung: 0 });
    neuLaden(karte);
    return { ok: true, karte: neu };
  } catch (err) {
    return fehler(err);
  }
}

export async function zusammenfuehrenAction({ karte, andere, ausfuehren = false, trotz = false } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !istKartennummer(andere)) return UNGUELTIG;
  try {
    const plan = await methode(s.ctx.client, DT.karte, karte, "zusammenfuehren_mit", { andere_karte: normalisiereKartennummer(andere), nur_plan: ausfuehren ? 0 : 1, trotz_verschiedener_kontakte: trotz ? 1 : 0 });
    if (ausfuehren) neuLaden(karte);
    return { ok: true, plan };
  } catch (err) {
    return fehler(err);
  }
}

export async function kontaktSuchenAction({ q } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const t = text(q, 60);
  if (t.length < 2) return { ok: true, treffer: [] };
  try {
    const liste = await s.ctx.client.getList(DT.kontakt, { fields: ["name", "titel", "plz", "ort", "kontaktart", "ph_kundenkarte_karte"], orFilters: [["titel", "like", `%${t}%`], ["name", "like", `%${t}%`], ["nachname", "like", `%${t}%`]], limit: 8 });
    return { ok: true, treffer: liste.map((k) => ({ name: k.name, titel: k.titel, ort: [k.plz, k.ort].filter(Boolean).join(" "), privat: k.kontaktart !== "Geschaeft", karte: k.ph_kundenkarte_karte || null })) };
  } catch (err) {
    if (istBackofficeError(err) && err.code === "forbidden") return { ok: true, treffer: [], ohneRecht: true };
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Stufe --

/** Stufe festlegen (Leitung, Grund Pflicht) – sofort, Undo 8 s über stufeZuruecksetzenAction (Variante B). */
export async function stufeFestlegenAction({ karte, stufe, grund, freitext } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || typeof stufe !== "string" || !STUFE_GRUENDE.includes(grund)) return { ok: false, code: "invalid", message: "Bitte Stufe und Grund wählen." };
  try {
    const c = s.ctx.client;
    const alt = await c.getDoc(DT.karte, karte);
    await c.getDoc(DT.stufe, stufe);
    await c.save(DT.karte, { name: karte, stufe, stufe_manuell: 1 });
    const g = `${grund}${text(freitext) ? ` – ${text(freitext)}` : ""}`;
    await c.kommentar(DT.karte, karte, `Stufe festgelegt – Grund: ${g}`);
    if (c.modus !== "frappe") {
      // Ereignis wie der Controller (Stufenwechsel von Hand)
      await c.insert(DT.ereignis, { kundenkarte: karte, art: "Stufenwechsel", zeitpunkt: isoDatumZeit(new Date()), von: s.session.user, alt: alt.stufe, neu: stufe, hinweis: `Stufe festgelegt – Grund: ${g}`, automatisch: 0, titel: `Stufenwechsel · ${alt.kunde_name}` }).catch(() => null);
    }
    neuLaden(karte);
    return { ok: true, undo: { stufe: alt.stufe, manuell: Number(alt.stufe_manuell) || 0 } };
  } catch (err) {
    return fehler(err);
  }
}

export async function stufeZuruecksetzenAction({ karte, stufe, manuell } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || typeof stufe !== "string") return UNGUELTIG;
  try {
    await s.ctx.client.save(DT.karte, { name: karte, stufe, stufe_manuell: Number(manuell) ? 1 : 0 });
    await s.ctx.client.kommentar(DT.karte, karte, "Stufe festlegen rückgängig gemacht");
    neuLaden(karte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function automatikZulassenAction({ karte } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    const alt = await s.ctx.client.getDoc(DT.karte, karte);
    await s.ctx.client.save(DT.karte, { name: karte, stufe_manuell: 0 });
    await methode(s.ctx.client, DT.karte, karte, "umsatz_neu_berechnen", {}).catch(() => null);
    neuLaden(karte);
    return { ok: true, undo: { stufe: alt.stufe, manuell: 1 } };
  } catch (err) {
    return fehler(err);
  }
}

export async function neuBerechnenAction({ karte } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    const r = await methode(s.ctx.client, DT.karte, karte, "umsatz_neu_berechnen", {});
    neuLaden(karte);
    return { ok: true, belege: r?.belege ?? null, wechsel: r?.wechsel ? { alt: r.wechsel.alt, neu: r.wechsel.neu } : null, berechnet: r?.berechnet !== false };
  } catch (err) {
    return fehler(err);
  }
}

export async function walletErneuernAction({ karte } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    await methode(s.ctx.client, DT.karte, karte, "wallet_pass_erneuern", {});
    neuLaden(karte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ----------------------------------------------------------- Einwilligung --

/** Einwilligung mit Nachweis (Art. 7 Abs. 1 DSGVO). formData: karte, kanal, datenschutz=1, datei | kundenmodus. */
export async function einwilligungErfassenAction(formData) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const karte = String(formData?.get?.("karte") || "");
  const kanal = String(formData?.get?.("kanal") || "");
  const datenschutz = String(formData?.get?.("datenschutz") || "") === "1";
  const datei = formData?.get?.("datei");
  const km = String(formData?.get?.("kundenmodus") || "");
  if (!istNr(karte) || !EINWILLIGUNG_KANAELE.some((k) => k.wert === kanal)) return UNGUELTIG;
  if (!datenschutz) return { ok: false, code: "invalid", message: T.einwilligung.fehltHaken, feld: "datenschutz" };
  try {
    const c = s.ctx.client;
    let nachweis = "";
    if (km) {
      const sitz = await sessionStore().wertLesen(`kk:${km}`).catch(() => null);
      if (!sitz?.bestaetigt || sitz.karte !== karte) return { ok: false, code: "invalid", message: T.einwilligung.fehltNachweis, feld: "nachweis" };
      nachweis = `Tablet-Bestätigung ${sitz.bestaetigt}`;
    } else {
      if (!datei || typeof datei.arrayBuffer !== "function" || !datei.size) return { ok: false, code: "invalid", message: T.einwilligung.fehltNachweis, feld: "nachweis" };
      if (datei.size > 10 * 1024 * 1024) return { ok: false, code: "invalid", message: "Datei zu groß (höchstens 10 MB).", feld: "nachweis" };
      const inhalt = new Uint8Array(await datei.arrayBuffer());
      const name = `einwilligung-${karte}-${Date.now()}.${/pdf/.test(datei.type) ? "pdf" : "jpg"}`;
      const r = await c.uploadFile({ doctype: DT.karte, name: karte, dateiname: name, inhalt, privat: true, typ: datei.type || "application/octet-stream" });
      nachweis = r?.file_name || name;
    }
    await c.save(DT.karte, { name: karte, einwilligung_auswertung: 1, einwilligung_textversion: EINWILLIGUNG_TEXTVERSION });
    const kanalLabel = EINWILLIGUNG_KANAELE.find((k) => k.wert === kanal)?.label || kanal;
    await c.kommentar(DT.karte, karte, `Einwilligung erfasst · Kanal ${kanalLabel} · Nachweis ${nachweis} · Datenschutzinfo ${DATENSCHUTZINFO_VERSION}`);
    if (c.modus !== "frappe") {
      await c.setValue(DT.karte, karte, { einwilligung_am: isoDatumZeit(new Date()), einwilligung_widerrufen_am: null });
      await c.insert(DT.ereignis, { kundenkarte: karte, art: "Einwilligung", zeitpunkt: isoDatumZeit(new Date()), von: s.session.user, hinweis: `Textversion ${EINWILLIGUNG_TEXTVERSION} · ${kanalLabel}`, automatisch: 0, titel: `Einwilligung · ${karte}` }).catch(() => null);
    }
    const r = await methode(c, DT.karte, karte, "umsatz_neu_berechnen", {}).catch(() => null);
    neuLaden(karte);
    return { ok: true, wechsel: r?.wechsel || null };
  } catch (err) {
    return fehler(err);
  }
}

export async function einwilligungBeendenAction({ karte, kanal } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !WIDERRUF_KANAELE.includes(kanal)) return { ok: false, code: "invalid", message: "Bitte angeben, wie widerrufen wurde." };
  try {
    const c = s.ctx.client;
    const k = await c.getDoc(DT.karte, karte);
    await c.save(DT.karte, { name: karte, einwilligung_auswertung: 0 });
    await c.kommentar(DT.karte, karte, `Auswertung beendet · Widerruf über ${kanal}`);
    if (c.modus !== "frappe") {
      const ein = (await c.getDoc(DT.einstellungen, DT.einstellungen).catch(() => ({}))).startstufe || k.stufe;
      await c.setValue(DT.karte, karte, { jahresumsatz_cent: 0, gesamtumsatz_cent: 0, letzter_einkauf: null, umsatz_berechnet_am: null, einwilligung_widerrufen_am: isoDatumZeit(new Date()), ...(Number(k.stufe_manuell) ? {} : { stufe: ein, stufe_seit: isoDatum(new Date()) }) });
      await c.insert(DT.ereignis, { kundenkarte: karte, art: "Widerruf", zeitpunkt: isoDatumZeit(new Date()), von: s.session.user, hinweis: `über ${kanal}`, automatisch: 0, titel: `Widerruf · ${karte}` }).catch(() => null);
    }
    neuLaden(karte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------ Einzelfelder --

/** Einzelfeld sofort (Variante B: Rückgabe des alten Werts für Undo), Konflikt über modified. */
export async function feldSetzenAction({ karte, feld, wert, modified } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte) || !SOFORT_FELDER.includes(feld)) return UNGUELTIG;
  let w = text(wert, 140);
  if (feld === "geburtstag_tag_monat") {
    const g = geburtstagParsen(w);
    if (!g.ok) return { ok: false, code: "invalid", message: g.message };
    w = g.wert;
  }
  if (feld === "kanal" && !["showroom", "website", "kassa"].includes(w)) return UNGUELTIG;
  if (feld === "persoenlicher_berater" && w && !NAME_RE.test(w)) return UNGUELTIG;
  try {
    const c = s.ctx.client;
    const alt = await c.getDoc(DT.karte, karte);
    if (modified && alt.modified && String(alt.modified) !== String(modified) && String(alt[feld] ?? "") !== String(w)) {
      return { ok: false, code: "conflict", message: T.details.konflikt(String(alt.modified_by || "").split("@")[0]), aktuell: alt[feld] ?? "", modified: alt.modified };
    }
    const neu = await c.setValue(DT.karte, karte, feld, w || null);
    neuLaden(karte);
    return { ok: true, alt: alt[feld] ?? "", modified: neu?.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Berater für mehrere Karten (Massenaktion) – liefert alte Werte für Rückgängig. */
export async function beraterSetzenAction({ karten, berater } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(karten) ? karten : []).filter(istNr).slice(0, 200);
  const b = text(berater, 80);
  if (!liste.length || (b && !NAME_RE.test(b))) return UNGUELTIG;
  try {
    const alt = [];
    let hatten = 0;
    for (const k of liste) {
      const d = await s.ctx.client.getDoc(DT.karte, k);
      if (d.persoenlicher_berater && d.persoenlicher_berater !== b) hatten++;
      alt.push({ karte: k, wert: d.persoenlicher_berater || "" });
      await s.ctx.client.setValue(DT.karte, k, "persoenlicher_berater", b || null);
    }
    neuLaden();
    return { ok: true, alt, hatten };
  } catch (err) {
    return fehler(err);
  }
}

export async function beraterZuruecksetzenAction({ werte } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(werte) ? werte : []).filter((x) => istNr(x?.karte)).slice(0, 200);
  try {
    for (const x of liste) await s.ctx.client.setValue(DT.karte, x.karte, "persoenlicher_berater", text(x.wert, 80) || null);
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function notizSpeichernAction({ karte, text: t } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  if (!istNr(karte)) return UNGUELTIG;
  try {
    await s.ctx.client.setValue(DT.karte, karte, "notizen_intern", String(t ?? "").slice(0, 4000));
    return { ok: true, zeit: new Date().toISOString() };
  } catch (err) {
    return fehler(err);
  }
}

export async function kommentarAction({ doctype = DT.karte, name, text: t } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (![DT.karte, DT.einloesung, DT.antrag].includes(doctype) || !NAME_RE.test(String(name || "")) || !String(t || "").trim()) return UNGUELTIG;
  try {
    await s.ctx.client.kommentar(doctype, name, String(t).trim().slice(0, 2000));
    if (doctype === DT.karte) neuLaden(name);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Persönliche Aufgaben an die Berater mit Kanalprüfung (TKG § 174, §8.2). `nurVorschau` zählt nur. */
export async function aufgabenAnBeraterAction({ karten, nurVorschau = false } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(karten) ? karten : []).filter(istNr).slice(0, 200);
  if (!liste.length) return UNGUELTIG;
  try {
    const c = s.ctx.client;
    const eintraege = [];
    for (const nr of liste) {
      const k = await c.getDoc(DT.karte, nr);
      const kontakt = k.kontakt ? await c.getDoc(DT.kontakt, k.kontakt).catch(() => ({})) : {};
      eintraege.push({ karte: k, kontakt: { nicht_kontaktieren: kontakt.nicht_kontaktieren, werbung_email: false, werbung_telefon: false }, nichtBeurteilbar: !Number(k.einwilligung_auswertung) });
    }
    const vorschau = kanalVorschau(eintraege);
    if (nurVorschau) return { ok: true, vorschau };
    let angelegt = 0;
    for (const e of eintraege) {
      const kan = kanaeleFuer(e.kontakt);
      if (!kan.erlaubt) continue;
      await c.insert(DT.aufgabe, { naming_series: "PH-AUF-.YYYY.-.#####", titel: `Persönlich melden – ${kan.titelZusatz}: ${e.karte.kunde_name}`.slice(0, 140), status: "Offen", faellig: isoDatum(new Date(Date.now() + 7 * 86400000)), zugewiesen_an: e.karte.persoenlicher_berater || "", referenz_doctype: DT.karte, referenz_name: e.karte.name, kontakt: e.karte.kontakt, quelle: "manuell" });
      angelegt++;
    }
    return { ok: true, vorschau, angelegt };
  } catch (err) {
    return fehler(err);
  }
}

/** Mehrere Karten neu einstufen (nur mit Einwilligung). */
export async function neuEinstufenAction({ karten } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(karten) ? karten : []).filter(istNr).slice(0, 100);
  if (!liste.length) return UNGUELTIG;
  try {
    let moeglich = 0;
    let ohne = 0;
    for (const nr of liste) {
      const k = await s.ctx.client.getDoc(DT.karte, nr);
      if (!Number(k.einwilligung_auswertung)) {
        ohne++;
        continue;
      }
      await methode(s.ctx.client, DT.karte, nr, "umsatz_neu_berechnen", {});
      moeglich++;
    }
    neuLaden();
    return { ok: true, moeglich, ohne };
  } catch (err) {
    return fehler(err);
  }
}

/** CSV der Karten (Leitung/GF, Allowlist). */
export async function kartenExportAction({ status } = {}) {
  const s = await sitzung();
  if (s.fehler) return s.fehler;
  if (!darfBetraege(s.rolle)) return KEIN_RECHT;
  try {
    const st = String(status || "Aktiv,Beantragt,Gesperrt").split(",").filter((x) => /^[A-Za-z]+$/.test(x));
    const zeilen = await s.ctx.client.getList(DT.karte, { fields: ["name", "kunde_name", "status", "stufe", "stufe_seit", "persoenlicher_berater", "letzter_einkauf", "einwilligung_auswertung", "ausgestellt_am"], filters: [["status", "in", st]], limit: 10000, orderBy: "kunde_name asc" });
    const kopf = ["Karte", "Name", "Status", "Stufe", "Stufe seit", "Berater", "Letzter Einkauf", "Auswertung", "Ausgestellt"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [kopf.join(";"), ...zeilen.map((z) => [z.name, z.kunde_name, z.status, z.stufe, z.stufe_seit, z.persoenlicher_berater, Number(z.einwilligung_auswertung) ? z.letzter_einkauf : "", Number(z.einwilligung_auswertung) ? "ja" : "nein", z.ausgestellt_am].map(esc).join(";"))].join("\n");
    console.info("[kundenkarte] CSV-Export Karten", s.session.user, zeilen.length);
    return { ok: true, csv, datei: `kundenkarten-${isoDatum(new Date())}.csv` };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Anträge --

/** Karte aus einem Antrag ausstellen (§3.3). kontakt = Name | "neu"; begruendung Pflicht ohne Mail-Bestätigung (Leitung). */
export async function antragAusstellenAction({ antrag, kontakt, stufe, sofortAktiv = true, begruendung } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!NAME_RE.test(String(antrag || ""))) return UNGUELTIG;
  try {
    const c = s.ctx.client;
    const a = await c.getDoc(DT.antrag, antrag);
    if (!["Neu", "Bestaetigt"].includes(a.status)) {
      return a.kundenkarte ? { ok: true, karte: a.kundenkarte, bereits: true } : { ok: false, code: "conflict", message: "Der Antrag ist bereits entschieden." };
    }
    const ohneMail = a.status === "Neu" && Number(a.doi_noetig);
    if (ohneMail && !istLeitung(s.rolle)) return { ok: false, code: "forbidden", message: "Ohne bestätigte E-Mail darf nur die Leitung annehmen." };
    if (ohneMail && text(begruendung).length < 5) return { ok: false, code: "invalid", message: "Bitte begründen, warum ohne Bestätigung ausgestellt wird.", feld: "begruendung" };
    if (stufe && stufe !== a.startstufe && !istLeitung(s.rolle)) return NUR_LEITUNG;
    let k = null;
    if (kontakt && kontakt !== "neu") {
      if (!NAME_RE.test(kontakt)) return UNGUELTIG;
      k = kontakt;
    }
    if (!k && kontakt !== "neu" && !a.kontakt) return { ok: false, code: "invalid", message: "Bitte Kontakt wählen oder „Neu anlegen“.", feld: "kontakt" };
    if (ohneMail) await c.kommentar(DT.antrag, antrag, `Ohne E-Mail-Bestätigung ausgestellt – Begründung: ${text(begruendung, 500)}`);
    const perMail = a.quelle === "website" && Boolean(a.bestaetigt_am);
    const args = { kontakt: k || a.kontakt || null, stufe: stufe || null, aktiv: perMail ? 1 : 0 };
    if (a.quelle !== "website") args.sofort_aktiv = sofortAktiv ? 1 : 0;
    const r = await methode(c, DT.antrag, antrag, "annehmen", args);
    revalidatePath("/kundenkarte/antraege");
    revalidatePath(`/kundenkarte/antraege/${antrag}`);
    neuLaden();
    if (r === "Doppelt") {
      const d = await c.getDoc(DT.antrag, antrag);
      return { ok: true, doppelt: true, karte: d.doppelt_zu };
    }
    const karte = await c.getDoc(DT.karte, r).catch(() => null);
    return { ok: true, karte: r, status: karte?.status || "Aktiv" };
  } catch (err) {
    if (istBackofficeError(err) && /Duplicate/i.test(err.excType || "")) {
      const a = await s.ctx.client.getDoc(DT.antrag, antrag).catch(() => null);
      if (a?.kundenkarte) return { ok: true, karte: a.kundenkarte, bereits: true };
    }
    return fehler(err);
  }
}

export async function antragAblehnenAction({ antraege, grund, text: freitext } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(antraege) ? antraege : [antraege]).filter((x) => NAME_RE.test(String(x || ""))).slice(0, 100);
  if (!liste.length || !ABLEHNUNGSGRUENDE.includes(grund)) return { ok: false, code: "invalid", message: "Bitte einen Grund wählen." };
  const g = ablehnGrundText(grund, freitext);
  if (!g.ok) return { ok: false, code: "invalid", message: g.message, feld: "text" };
  try {
    let erledigt = 0;
    let uebersprungen = 0;
    for (const a of liste) {
      const d = await s.ctx.client.getDoc(DT.antrag, a);
      if (!["Neu", "Bestaetigt"].includes(d.status)) {
        uebersprungen++;
        continue;
      }
      await methode(s.ctx.client, DT.antrag, a, "ablehnen", { grund: g.wert });
      erledigt++;
    }
    revalidatePath("/kundenkarte/antraege");
    for (const a of liste) revalidatePath(`/kundenkarte/antraege/${a}`);
    return { ok: true, erledigt, uebersprungen };
  } catch (err) {
    return fehler(err);
  }
}

export async function antragDoppeltAction({ antraege } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const liste = (Array.isArray(antraege) ? antraege : [antraege]).filter((x) => NAME_RE.test(String(x || ""))).slice(0, 100);
  if (!liste.length) return UNGUELTIG;
  try {
    let erledigt = 0;
    let uebersprungen = 0;
    for (const a of liste) {
      const d = await s.ctx.client.getDoc(DT.antrag, a);
      const karte = d.kontakt ? (await s.ctx.client.getList(DT.karte, { fields: ["name"], filters: [["kontakt", "=", d.kontakt], ["status", "in", OFFENE_STATUS]], limit: 1 }))[0]?.name : null;
      if (!["Neu", "Bestaetigt"].includes(d.status) || !karte) {
        uebersprungen++;
        continue;
      }
      await methode(s.ctx.client, DT.antrag, a, "als_doppelt", { karte, kontakt: d.kontakt });
      erledigt++;
    }
    revalidatePath("/kundenkarte/antraege");
    return { ok: true, erledigt, uebersprungen };
  } catch (err) {
    return fehler(err);
  }
}

export async function antragKontaktAction({ antrag, kontakt } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!NAME_RE.test(String(antrag || "")) || (kontakt && !NAME_RE.test(String(kontakt)))) return UNGUELTIG;
  try {
    await s.ctx.client.setValue(DT.antrag, antrag, "kontakt", kontakt || null);
    revalidatePath(`/kundenkarte/antraege/${antrag}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------------------------- Neue Karte --

/**
 * Neue Karte im Showroom (§3.10): insert Antrag (idempotent) → Nachweis → Vermerk → annehmen.
 * formData: kontakt | vorname, nachname, email, telefon, plz, ort, sprache; teilnahme, datenschutz, volljaehrig (=1);
 * auswertung (=1) + datei | kundenmodus; newsletter; geburtstag; interessen; berater; stufe (Leitung); spaeter; uuid.
 */
export async function neueKarteAction(formData) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const f = (k, max = 140) => text(formData?.get?.(k), max);
  const an = (k) => f(k) === "1";
  const fehlerFelder = {};
  const kontakt = f("kontakt", 80);
  const vorname = f("vorname", 80);
  const nachname = f("nachname", 80);
  const email = f("email", 140).toLowerCase();
  if (!kontakt) {
    if (!vorname) fehlerFelder.vorname = "Vorname fehlt.";
    if (!nachname) fehlerFelder.nachname = "Nachname fehlt.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fehlerFelder.email = "E-Mail im Format name@beispiel.at.";
  }
  if (!an("teilnahme") || !an("datenschutz") || !an("volljaehrig")) fehlerFelder.haken = T.neu.fehltHaken;
  const auswertung = an("auswertung");
  const datei = formData?.get?.("datei");
  const km = f("kundenmodus", 60);
  if (auswertung && !km && (!datei || typeof datei.arrayBuffer !== "function" || !datei.size)) fehlerFelder.nachweis = T.einwilligung.fehltNachweis;
  const geb = geburtstagParsen(f("geburtstag", 10));
  if (!geb.ok) fehlerFelder.geburtstag = geb.message;
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: Object.values(fehlerFelder)[0], fehler: fehlerFelder };
  const stufe = f("stufe", 80);
  if (stufe && !istLeitung(s.rolle)) return NUR_LEITUNG;
  try {
    const c = s.ctx.client;
    const einst = await c.getDoc(DT.einstellungen, DT.einstellungen).catch(() => ({}));
    if (!einst.bedingungen_version) return { ok: false, code: "invalid", message: T.neu.ohneVersion };
    let k = null;
    if (kontakt) {
      k = await c.getDoc(DT.kontakt, kontakt).catch(() => ({ name: kontakt }));
      if (k.kontaktart === "Geschaeft") return { ok: false, code: "invalid", message: T.neu.geschaeft };
      const offen = await c.getList(DT.karte, { fields: ["name"], filters: [["kontakt", "=", kontakt], ["status", "in", OFFENE_STATUS]], limit: 1 });
      if (offen.length) return { ok: false, code: "conflict", message: T.neu.hatKarte(offen[0].name), karte: offen[0].name };
    }
    const uuid = f("uuid", 40) || String(Date.now());
    const schluessel = idempotenzSchluessel("kk-neu", kontakt || email, uuid);
    const vorhanden = await c.getList(DT.antrag, { fields: ["name", "kundenkarte", "status"], filters: [["idempotency_key", "=", schluessel]], limit: 1 });
    if (vorhanden[0]?.kundenkarte) return { ok: true, karte: vorhanden[0].kundenkarte, bereits: true };
    const antrag =
      vorhanden[0] ||
      (await c.insert(DT.antrag, {
        naming_series: "PH-KKA-.YYYY.-.#####",
        quelle: "showroom",
        status: "Bestaetigt",
        eingang: isoDatumZeit(new Date()),
        kontakt: kontakt || null,
        vorname: vorname || k?.vorname || String(k?.titel || "").split(" ")[0] || "–",
        nachname: nachname || k?.nachname || String(k?.titel || "").split(" ").slice(-1)[0] || "–",
        email: email || k?.email || "",
        telefon: f("telefon", 40),
        plz: f("plz", 10) || k?.plz || "",
        ort: f("ort", 80) || k?.ort || "",
        sprache: ["de", "en", "fr", "it"].includes(f("sprache")) ? f("sprache") : "de",
        interessen: f("interessen", 500),
        geburtstag_tag_monat: geb.wert,
        vertragsdaten_akzeptiert: 1,
        bedingungen_version: einst.bedingungen_version,
        einwilligung_auswertung: auswertung ? 1 : 0,
        einwilligung_textversion: auswertung ? EINWILLIGUNG_TEXTVERSION : "",
        einwilligung_newsletter: an("newsletter") ? 1 : 0,
        einwilligung_zeitpunkt: isoDatumZeit(new Date()),
        nachweis_art: auswertung ? (km ? "Unterschrift Tablet" : "Unterschrift Formular") : "",
        doi_noetig: 0,
        idempotency_key: schluessel,
        startstufe: stufe || einst.startstufe || null,
      }));
    if (auswertung && !km && datei?.size) {
      const inhalt = new Uint8Array(await datei.arrayBuffer());
      const r = await c.uploadFile({ doctype: DT.antrag, name: antrag.name, dateiname: `nachweis-${antrag.name}.${/pdf/.test(datei.type) ? "pdf" : "jpg"}`, inhalt, privat: true, typ: datei.type || "application/octet-stream" });
      if (r?.file_url) await c.setValue(DT.antrag, antrag.name, "nachweis", r.file_url).catch(() => null);
    }
    await c.kommentar(DT.antrag, antrag.name, `Datenschutzinformation übergeben (Version ${DATENSCHUTZINFO_VERSION}) · Volljährig bestätigt · erfasst von ${s.session.name || s.session.user}`);
    const berater = f("berater", 80);
    const karte = await methode(c, DT.antrag, antrag.name, "annehmen", { kontakt: kontakt || null, stufe: stufe || null, sofort_aktiv: an("spaeter") ? 0 : 1 });
    if (karte === "Doppelt") {
      const d = await c.getDoc(DT.antrag, antrag.name);
      return { ok: true, doppelt: true, karte: d.doppelt_zu };
    }
    if (berater && NAME_RE.test(berater)) await c.setValue(DT.karte, karte, "persoenlicher_berater", berater).catch(() => null);
    const kd = await c.getDoc(DT.karte, karte);
    neuLaden();
    revalidatePath("/kundenkarte/antraege");
    return { ok: true, karte, status: kd.status, stufe: kd.stufe, name: kd.kunde_name };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------ Einlösungen --

export async function einloesungStornierenAction({ einloesung, grund } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!NAME_RE.test(String(einloesung || "")) || text(grund).length < 3) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben.", feld: "grund" };
  try {
    const e = await s.ctx.client.getDoc(DT.einloesung, einloesung);
    const r = stornoErlaubt(e, { user: s.session.user, leitung: istLeitung(s.rolle) });
    if (!r.ok) return { ok: false, code: "forbidden", message: r.grund };
    await methode(s.ctx.client, DT.einloesung, einloesung, "stornieren", { grund: text(grund) });
    revalidatePath("/kundenkarte/einloesungen");
    neuLaden(e.kundenkarte);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function einloesungKommentarAction({ einloesung, kommentar } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (!NAME_RE.test(String(einloesung || ""))) return UNGUELTIG;
  try {
    await s.ctx.client.setValue(DT.einloesung, einloesung, "kommentar", text(kommentar, 500));
    revalidatePath("/kundenkarte/einloesungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------- Stufenplan --

function plan(stufen) {
  return (Array.isArray(stufen) ? stufen : []).slice(0, 12).map((x) => ({
    stufenname: text(x.stufenname, 80),
    reihenfolge: Math.round(Number(x.reihenfolge) || 0),
    schwelle_jahresumsatz_cent: Math.max(0, Math.round(Number(x.schwelle_jahresumsatz_cent) || 0)),
    aktiv: Number(x.aktiv ?? 1) ? 1 : 0,
    farbe: /^#[0-9a-f]{6}$/i.test(String(x.farbe || "")) ? x.farbe : "",
    beschreibung_kunde: text(x.beschreibung_kunde, 1000),
    beschreibung_intern: text(x.beschreibung_intern, 1000),
    vorteile: (Array.isArray(x.vorteile) ? x.vorteile : []).filter((z) => NAME_RE.test(String(z.vorteil || ""))).map((z) => ({ vorteil: z.vorteil, hinweis: text(z.hinweis, 140) })),
  }));
}

export async function stufenplanVorschauAction({ stufen } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  try {
    return { ok: true, vorschau: await aufruf(s.ctx.client, M.stufenplan_vorschau, { stufen: JSON.stringify(plan(stufen)) }) };
  } catch (err) {
    return fehler(err);
  }
}

/** Stufen speichern (eine Wahrheit: Zuordnung → gilt_ab_stufe). Teilfehler → Rücknahme der gespeicherten. */
export async function stufenplanSpeichernAction({ stufen } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  const neu = plan(stufen);
  const fehlerFelder = stufenplanFehler(neu);
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: "Nicht gespeichert – Schwelle muss mit der Reihenfolge steigen.", fehler: fehlerFelder };
  for (const x of neu) {
    const t = pruefeKundentexte(x.beschreibung_kunde);
    if (!t.ok) return { ok: false, code: "invalid", message: t.text, fehler: { [x.stufenname]: t.text } };
  }
  const c = s.ctx.client;
  const gesichert = [];
  try {
    for (const x of neu) {
      const alt = await c.getDoc(DT.stufe, x.stufenname);
      gesichert.push(alt);
      await c.save(DT.stufe, { name: x.stufenname, reihenfolge: x.reihenfolge, schwelle_jahresumsatz_cent: x.schwelle_jahresumsatz_cent, aktiv: x.aktiv, ...(x.farbe ? { farbe: x.farbe } : {}), beschreibung_kunde: x.beschreibung_kunde, beschreibung_intern: x.beschreibung_intern, vorteile: x.vorteile });
    }
    const giltAb = giltAbAusZuordnung(neu);
    for (const [vorteil, stufe] of Object.entries(giltAb)) {
      const v = await c.getDoc(DT.vorteil, vorteil);
      if (v.gilt_ab_stufe !== stufe) await c.setValue(DT.vorteil, vorteil, "gilt_ab_stufe", stufe);
    }
    await aufruf(c, M.umsatz_alle, {}).catch(() => null);
    revalidatePath("/kundenkarte/stufen");
    return { ok: true };
  } catch (err) {
    for (const alt of gesichert) await c.save(DT.stufe, { name: alt.name, reihenfolge: alt.reihenfolge, schwelle_jahresumsatz_cent: alt.schwelle_jahresumsatz_cent, aktiv: alt.aktiv, farbe: alt.farbe, beschreibung_kunde: alt.beschreibung_kunde, beschreibung_intern: alt.beschreibung_intern, vorteile: alt.vorteile }).catch(() => null);
    return fehler(err);
  }
}

export async function vorteilSpeichernAction({ vorteil } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  const v = vorteil || {};
  const titel = text(v.titel, 140);
  if (!titel || !["Lieferung", "Montage", "Pflege", "Event", "Service", "Persoenlich", "Sonstiges"].includes(v.art)) return { ok: false, code: "invalid", message: "Titel und Art sind Pflicht." };
  const t = pruefeKundentexte(titel, v.beschreibung_kunde);
  if (!t.ok) return { ok: false, code: "invalid", message: t.text, feld: "beschreibung_kunde" };
  const werte = { titel, art: v.art, aktiv: Number(v.aktiv ?? 1) ? 1 : 0, einloesbar_pro_jahr: Math.max(0, Math.round(Number(v.einloesbar_pro_jahr) || 0)), reihenfolge: Math.round(Number(v.reihenfolge) || 10), beschreibung_kunde: text(v.beschreibung_kunde, 1000), beschreibung_intern: text(v.beschreibung_intern, 1000) };
  try {
    const doc = v.name ? await s.ctx.client.save(DT.vorteil, { name: v.name, ...werte }) : await s.ctx.client.insert(DT.vorteil, { naming_series: "PH-KKV-.YYYY.-.#####", quelle: "backoffice", ...werte });
    revalidatePath("/kundenkarte/stufen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function stammdatenAction() {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  try {
    const r = await aufruf(s.ctx.client, M.stammdaten_anlegen, {});
    revalidatePath("/kundenkarte/stufen");
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

// ----------------------------------------------------------- Einstellungen --

const EINST_FELDER = ["startstufe", "bewertungszeitraum_monate", "herabstufung_erlaubt", "doi_pflicht", "doi_gueltig_stunden", "website_automatisch_annehmen", "berater_standard", "bedingungen_version", "text_begruessung", "text_datenschutz_karte", "wallet_pass_type_id", "wallet_team_id", "wallet_organisation"];

export async function einstellungenSpeichernAction({ werte, modified } = {}) {
  const s = await sitzung({ leitung: true });
  if (s.fehler) return s.fehler;
  const w = {};
  for (const f of EINST_FELDER) if (werte && f in werte) w[f] = typeof werte[f] === "string" ? werte[f].slice(0, 4000) : werte[f];
  for (const f of ["bewertungszeitraum_monate", "doi_gueltig_stunden"]) if (f in w) w[f] = Math.max(1, Math.round(Number(w[f]) || 1));
  for (const f of ["herabstufung_erlaubt", "doi_pflicht", "website_automatisch_annehmen"]) if (f in w) w[f] = Number(w[f]) ? 1 : 0;
  const t = pruefeKundentexte(String(w.text_begruessung || "").replace(/<[^>]+>/g, " "), w.text_datenschutz_karte);
  if (!t.ok) return { ok: false, code: "invalid", message: t.text };
  try {
    await s.ctx.client.save(DT.einstellungen, { name: DT.einstellungen, ...w }, { modified });
    revalidatePath("/kundenkarte/einstellungen");
    revalidatePath("/kundenkarte");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------- Kundenmodus --

/** Kundenmodus-Sitzung (15 min) für die Einwilligung am iPad (§3.12). */
export async function kundenmodusStartenAction({ karte, zweck = "einwilligung" } = {}) {
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  if (karte && !istNr(karte)) return UNGUELTIG;
  try {
    const name = karte ? (await s.ctx.client.getDoc(DT.karte, karte)).kunde_name : "";
    const id = crypto.randomUUID().replace(/-/g, "");
    await sessionStore().wertSetzen(`kk:${id}`, { karte: karte || null, zweck, name, von: s.session.user, start: new Date().toISOString(), bestaetigt: null, schalter: {} }, { ttlSekunden: 15 * 60 });
    return { ok: true, sitzung: id, href: `/kundenkarte/kundenmodus/${id}` };
  } catch (err) {
    return fehler(err);
  }
}

export async function kundenmodusStandAction({ sitzung: id } = {}) {
  await requireSession();
  if (!/^[a-f0-9]{32}$/.test(String(id || ""))) return UNGUELTIG;
  const w = await sessionStore().wertLesen(`kk:${id}`).catch(() => null);
  return w ? { ok: true, bestaetigt: w.bestaetigt, schalter: w.schalter, karte: w.karte } : { ok: false, code: "not_found", message: T.kundenmodus.abgelaufen };
}

/** Bestätigung der Kundin (Unterschrift-Ergebnis + Schalter). Nur Prüfwert und Zeit werden gemerkt. */
export async function kundenmodusBestaetigenAction({ sitzung: id, schalter, unterschrift } = {}) {
  await requireSession();
  if (!/^[a-f0-9]{32}$/.test(String(id || ""))) return UNGUELTIG;
  const store = sessionStore();
  const w = await store.wertLesen(`kk:${id}`).catch(() => null);
  if (!w) return { ok: false, code: "not_found", message: T.kundenmodus.abgelaufen };
  if (!unterschrift?.pruefwert) return { ok: false, code: "invalid", message: "Bitte unterschreiben." };
  const zeit = new Date().toISOString();
  await store.wertSetzen(`kk:${id}`, { ...w, bestaetigt: zeit, pruefwert: String(unterschrift.pruefwert).slice(0, 80), schalter: { auswertung: Boolean(schalter?.auswertung), newsletter: Boolean(schalter?.newsletter) } }, { ttlSekunden: 15 * 60 });
  return { ok: true, zeit };
}


// ------------------------------------------------------------ Kiosk-Stub --
// Für Kassa (B-KAS) und Packtisch (B-LOG), Konzept §7.3/§7.4: Nachschlagen nur mit Name, Stufe, Vorteilen –
// nie Kontaktdaten oder Umsatz (K13). Frappe: api.lookup_card; Mock: gleiche Regeln (methoden.lookupImMock).

const KIOSK_ROLLEN = ["PH Kassa Mitarbeiter", "PH Kassa Leitung", "PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Kundenkarte Mitarbeiter", "PH Kundenkarte Leitung", "System Manager", "PH Backoffice-Admin"];

export async function kioskKarteAction({ kartennummer } = {}) {
  const session = await requireSession();
  if (!(session.roles || []).some((r) => KIOSK_ROLLEN.includes(r))) return KEIN_RECHT;
  if (!istKartennummer(kartennummer)) return { ok: false, code: "invalid", message: "Code nicht erkannt" };
  try {
    const r = await aufruf(kontext(session).client, M.lookup_card, { kartennummer: normalisiereKartennummer(kartennummer) });
    const erlaubt = ["ok", "code", "text", "kartennummer", "name", "stufe", "stufe_farbe", "stufe_seit", "weitergeleitet_von", "vorteile"];
    const sauber = Object.fromEntries(Object.entries(r || {}).filter(([k]) => erlaubt.includes(k)));
    return { ...sauber, ok: Boolean(r?.ok), vorteile: (r?.vorteile || []).map((v) => ({ vorteil: v.vorteil, titel: v.titel, art: v.art, verbleibend: v.verbleibend, verfuegbar: v.verfuegbar })) };
  } catch (err) {
    return fehler(err);
  }
}
