// src/lib/portal/tagebuch/service.js — Abläufe des Projekt-Tagebuchs (server-only).
// Seiten und Route Handler rufen nur diese Funktionen; der Speicher kommt aus adapter.js.
import "server-only";
import { randomBytes } from "node:crypto";
import { BILD_BREITEN, EINWILLIGUNG, LIMITS, PHASEN_KEYS, phase, referenzFreigabeAktiv, referenzTauglich, tagebuchVerfuegbar } from "./config.js";
import { tagebuchAdapter } from "./adapter.js";
import { freigabeZuProjekt, pruefeVeroeffentlichung, WIDERRUFBAR } from "./schemas.js";
import { listFreigegebeneProjekte } from "@/lib/content/projekte";
import { stelleTagebuchDemoBereit } from "./seed.js";

const zufall = () => {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(randomBytes(10), (b) => a[b % 36]).join("");
};
export const neueFotoId = () => `f-${zufall()}`;
export const neueFreigabeId = () => `fg-${zufall()}`;

export class TagebuchFehler extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Legt das Tagebuch beim ersten Öffnen durch den Kunden an (Dev-Adapter) und gibt es zurück. */
export async function ladeTagebuch(projekt, kundeId) {
  const a = tagebuchAdapter();
  if (!a.verbunden) return { projektId: projekt.id, titel: projekt.title, fotos: [], nichtVerbunden: true };
  let tb = await a.leseTagebuch(projekt.id);
  if (!tb && kundeId) {
    tb = await a.aendereTagebuch(projekt.id, async (alt) => {
      if (alt) return { tagebuch: null, ergebnis: alt };
      const neu = { projektId: projekt.id, kundeId, titel: projekt.title, raum: projekt.room || "", fotos: [], erstellt: new Date().toISOString() };
      return { tagebuch: neu, ergebnis: neu };
    });
  }
  if (tb && kundeId) tb = (await stelleTagebuchDemoBereit(projekt.id, kundeId)) || tb;
  return tb || { projektId: projekt.id, titel: projekt.title, fotos: [] };
}

/** Fotos nach Phase gruppiert, in Phasen-Reihenfolge, neueste zuletzt. */
export function nachPhasen(fotos = []) {
  const map = Object.fromEntries(PHASEN_KEYS.map((k) => [k, []]));
  for (const f of fotos) (map[f.phase] || (map[f.phase] = [])).push(f);
  for (const k of Object.keys(map)) map[k].sort((a, b) => String(a.hochgeladenAm).localeCompare(String(b.hochgeladenAm)));
  return map;
}

/**
 * Speichert ein verarbeitetes Foto. `z` ist der Zugriff (zugriff.js), `bild`
 * das Ergebnis von verarbeiteBild().
 */
export async function fotoHinzufuegen(projektId, z, form, bild, autor) {
  const p = phase(form.phase);
  if (!tagebuchVerfuegbar(tagebuchAdapter())) throw new TagebuchFehler(503, "Das Projekt-Tagebuch ist noch nicht verfügbar.");
  if (p.nurTeam && z.rolle !== "team") throw new TagebuchFehler(403, `Fotos der Phase „${p.label}“ lädt das Studio-Team hoch.`);
  const a = tagebuchAdapter();
  const tb = await a.leseTagebuch(projektId);
  if (!tb) throw new TagebuchFehler(404, "Tagebuch nicht gefunden");
  if ((tb.fotos || []).length >= LIMITS.maxFotosJeProjekt) throw new TagebuchFehler(409, `Höchstens ${LIMITS.maxFotosJeProjekt} Fotos je Projekt.`);
  const id = neueFotoId();
  for (const d of bild.dateien) await a.schreibeBild(projektId, `${id}-${d.w}.${d.fmt}`, d.daten);
  const foto = {
    id,
    phase: p.key,
    titel: form.titel || "",
    von: z.rolle,
    autor,
    hochgeladenAm: new Date().toISOString(),
    breite: bild.breite,
    hoehe: bild.hoehe,
    varianten: [...new Map(bild.dateien.map((d) => [d.w, { w: d.w, h: d.h }])).values()],
    metadatenEntfernt: true,
    gpsEntfernt: bild.gpsGefunden,
    ...(p.echtPflicht ? { echtBestaetigt: true, urheber: p.key === "skizze" ? "Harald Menghin" : "Platzhirsch Home Living" } : {}),
    beispiel: false,
  };
  await a.aendereTagebuch(projektId, async (alt) => {
    if (!alt) return { tagebuch: null, ergebnis: null };
    alt.fotos = [...(alt.fotos || []), foto];
    return { tagebuch: alt, ergebnis: null };
  });
  return foto;
}

/** Kunde löscht eigene Fotos, Team alle. Fotos in einer aktiven Freigabe erst nach Widerruf. */
export async function fotoLoeschen(projektId, z, fotoId) {
  const a = tagebuchAdapter();
  const aktiv = await a.listeFreigaben({ projektId, status: WIDERRUFBAR });
  if (aktiv.some((f) => f.bilder.some((b) => b.id === fotoId)))
    throw new TagebuchFehler(409, "Dieses Foto ist Teil einer Referenz-Freigabe. Bitte zuerst die Freigabe widerrufen.");
  const weg = await a.aendereTagebuch(projektId, async (tb) => {
    const f = tb?.fotos?.find((x) => x.id === fotoId);
    if (!f) return { tagebuch: null, ergebnis: { status: 404 } };
    if (z.rolle !== "team" && f.von !== "kunde") return { tagebuch: null, ergebnis: { status: 403 } };
    tb.fotos = tb.fotos.filter((x) => x.id !== fotoId);
    return { tagebuch: tb, ergebnis: { status: 200 } };
  });
  if (weg.status === 404) throw new TagebuchFehler(404, "Foto nicht gefunden");
  if (weg.status === 403) throw new TagebuchFehler(403, "Fotos des Studio-Teams kann nur das Team entfernen.");
  await a.loescheBilder(projektId, fotoId);
}

/** „Als Referenz freigeben“: legt eine Freigabe im Status „eingereicht“ an. */
export async function freigabeAnlegen(projektId, z, input) {
  if (z.rolle !== "kunde") throw new TagebuchFehler(403, "Nur die Bauherren selbst können ein Projekt freigeben.");
  if (!referenzFreigabeAktiv()) throw new TagebuchFehler(503, "Die Referenz-Freigabe ist noch nicht verfügbar.");
  const a = tagebuchAdapter();
  const tb = await a.leseTagebuch(projektId);
  const fotos = (tb?.fotos || []).filter((f) => !f.beispiel || process.env.NODE_ENV !== "production");
  const auswahl = input.fotoIds.map((id) => fotos.find((f) => f.id === id));
  if (auswahl.some((f) => !f)) throw new TagebuchFehler(400, "Ein ausgewähltes Foto gibt es nicht mehr.");
  if (auswahl.some((f) => !referenzTauglich(f))) throw new TagebuchFehler(400, "Handzeichnungen und Modellfotos werden nicht als Referenz veröffentlicht.");
  const offen = await a.listeFreigaben({ projektId, status: WIDERRUFBAR });
  if (offen.length) throw new TagebuchFehler(409, "Für dieses Projekt gibt es schon eine aktive Freigabe. Widerrufen Sie sie, um eine neue zu erstellen.");
  const jetzt = new Date().toISOString();
  const freigabe = {
    id: neueFreigabeId(),
    projektId,
    kundeId: z.kunde.id,
    status: "eingereicht",
    erstellt: jetzt,
    beispiel: auswahl.some((f) => f.beispiel),
    anzeige: input.anzeige === "vorname_ort" ? { art: "vorname_ort", vorname: input.vorname, ort: input.ort } : { art: "anonym" },
    bilder: auswahl.map((f) => ({ id: f.id, phase: f.phase, titel: f.titel, von: f.von, breite: f.breite, hoehe: f.hoehe, varianten: f.varianten })),
    einwilligung: {
      erteilt: true,
      version: EINWILLIGUNG.version,
      textStatus: EINWILLIGUNG.status,
      text: EINWILLIGUNG.absaetze,
      zeitpunkt: jetzt,
      kanal: "Kundenportal",
    },
    verlauf: [{ am: jetzt, was: "eingereicht", von: "kunde" }],
  };
  await a.legeFreigabeAn(freigabe);
  return freigabe;
}

/** Widerruf durch den Kunden: Seite sofort offline, Bildkopien gelöscht. */
export async function widerrufen(projektId, z, freigabeId) {
  if (z.rolle !== "kunde") throw new TagebuchFehler(403, "Nur die Bauherren können ihre Einwilligung widerrufen.");
  const a = tagebuchAdapter();
  const r = await a.aendereFreigabe(freigabeId, async (f) => {
    if (!f || f.projektId !== projektId || f.kundeId !== z.kunde.id) return { freigabe: null, ergebnis: 404 };
    if (!WIDERRUFBAR.includes(f.status)) return { freigabe: null, ergebnis: 409 };
    const jetzt = new Date().toISOString();
    f.status = "widerrufen";
    f.widerruf = { zeitpunkt: jetzt, kanal: "Kundenportal" };
    f.verlauf = [...(f.verlauf || []), { am: jetzt, was: "widerrufen", von: "kunde" }];
    return { freigabe: f, ergebnis: 200 };
  });
  if (r === 404) throw new TagebuchFehler(404, "Freigabe nicht gefunden");
  if (r === 409) throw new TagebuchFehler(409, "Diese Freigabe ist nicht mehr aktiv.");
  await a.loescheReferenzBilder(freigabeId);
}

/** Studio-Prüfung: veröffentlichen (nur wenn der Eintrag projekte.js-gültig ist), ablehnen oder zurückziehen. */
export async function pruefen(freigabeId, team, input) {
  const a = tagebuchAdapter();
  // Persönliches Konto (konten.js): Name UND Kennung im Nachweis, wer geprüft/veröffentlicht hat.
  const von = team?.id ? `${team.name || team.id} (${team.id})` : team?.name || "Team";
  const r = await a.aendereFreigabe(freigabeId, async (f) => {
    if (!f) return { freigabe: null, ergebnis: { status: 404 } };
    const jetzt = new Date().toISOString();
    if (input.aktion === "veroeffentlichen") {
      if (f.status !== "eingereicht") return { freigabe: null, ergebnis: { status: 409, fehler: ["Nur eingereichte Freigaben können veröffentlicht werden."] } };
      if (f.beispiel && process.env.NODE_ENV === "production") return { freigabe: null, ergebnis: { status: 409, fehler: ["Beispielbilder werden nie veröffentlicht."] } };
      const { aktion, ...pruefung } = input;
      void aktion;
      const v = pruefeVeroeffentlichung(f, pruefung, von, jetzt);
      if (!v.ok) return { freigabe: null, ergebnis: { status: 422, fehler: v.errors } };
      const andere = await a.listeFreigaben({ status: "veroeffentlicht" });
      if (andere.some((x) => x.id !== f.id && x.pruefung?.slug === pruefung.slug) || listFreigegebeneProjekte().some((p) => p.slug === pruefung.slug))
        return { freigabe: null, ergebnis: { status: 409, fehler: ["Diese Adresse (Slug) ist schon vergeben."] } };
      f.status = "veroeffentlicht";
      f.pruefung = { ...pruefung, von, am: jetzt };
    } else if (input.aktion === "ablehnen") {
      if (f.status !== "eingereicht") return { freigabe: null, ergebnis: { status: 409, fehler: ["Nur eingereichte Freigaben können abgelehnt werden."] } };
      f.status = "abgelehnt";
      f.pruefung = { ...(f.pruefung || {}), notiz: input.notiz, von, am: jetzt };
    } else {
      if (f.status !== "veroeffentlicht") return { freigabe: null, ergebnis: { status: 409, fehler: ["Nur veröffentlichte Referenzen können zurückgezogen werden."] } };
      f.status = "eingereicht";
      f.pruefung = { ...(f.pruefung || {}), notiz: input.notiz, von, am: jetzt };
    }
    f.verlauf = [...(f.verlauf || []), { am: jetzt, was: input.aktion, von }];
    return { freigabe: f, ergebnis: { status: 200, freigabe: f } };
  });
  return r;
}

/** Freigaben eines Projekts für den Kunden (ohne Einwilligungstext-Kopie). */
export async function freigabenDesProjekts(projektId) {
  return tagebuchAdapter().listeFreigaben({ projektId });
}

/**
 * Veröffentlichte Referenzen aus dem Tagebuch, im Format von projekte.js und
 * mit projektSchema geprüft. Beispiel-Freigaben (Mock-Bilder) nie in Produktion.
 */
export async function veroeffentlichteReferenzen() {
  let liste = [];
  try {
    liste = await tagebuchAdapter().listeFreigaben({ status: "veroeffentlicht" });
  } catch (err) {
    console.warn("[tagebuch] Referenzen nicht lesbar:", err?.message);
    return [];
  }
  const prod = process.env.NODE_ENV === "production";
  const eintraege = liste.filter((f) => !(prod && f.beispiel)).map((f) => ({ ...freigabeZuProjekt(f), beispiel: Boolean(f.beispiel), freigabeId: f.id }));
  const gueltig = listFreigegebeneProjekte(eintraege);
  return gueltig.map((p) => ({ ...p, beispiel: eintraege.find((e) => e.slug === p.slug)?.beispiel || false }));
}

export const BREITEN = BILD_BREITEN;
