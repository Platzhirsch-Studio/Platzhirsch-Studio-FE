// Reine Logik für Kalender, Slotraster und Raster (G-21, Team P0-6) – ohne React, testbar mit node --test.
// Zeitpunkte: "JJJJ-MM-TT HH:MM" (lokal), Tage: "JJJJ-MM-TT". Minuten im Tag: 0…1440.

import {
  minutenZwischen,
  monatsRaster,
  monatTitel,
  plusMinuten,
  spanneTitel,
  tageZwischen,
  tagLang,
  verbindeDatumZeit,
  verschiebe,
  wochenTage,
  kalenderwoche,
  zeitZuMinuten,
  zeitpunktMinuten,
  zerlegeDatumZeit,
  ausIso,
} from "../../../lib/backoffice/datum.js";

/**
 * Quellen des Kalenders (MASTER G-21). Farbe = Material (lounge.md §3), immer zusammen mit Symbol und
 * Wort. Abwesenheiten zeigen nie die Art (Datenschutz, Personal-Konzept): nur „Abwesend“.
 */
export const QUELLEN = Object.freeze({
  termin: { titel: "Termine", einzeln: "Termin", material: "cognac", icon: "CalendarDays" },
  montage: { titel: "Montagen", einzeln: "Montage", material: "eiche", icon: "Hammer" },
  einsatz: { titel: "Serviceeinsätze", einzeln: "Serviceeinsatz", material: "see", icon: "Wrench" },
  tour: { titel: "Touren", einzeln: "Tour", material: "salbei", icon: "Truck" },
  abwesenheit: { titel: "Abwesenheiten", einzeln: "Abwesend", material: "stein", icon: "Moon" },
  social: { titel: "Social Media", einzeln: "Beitrag", material: "messing", icon: "Megaphone" },
  event: { titel: "Events", einzeln: "Event", material: "nuss", icon: "Ticket" },
});
export const QUELLEN_REIHE = Object.keys(QUELLEN);
export const ANSICHTEN = ["tag", "woche", "monat"];

const STANDARD_DAUER = 60;

/**
 * Einträge vereinheitlichen. Erwartet je Eintrag mindestens `id`, `quelle`, `start`.
 * Ergebnis: { id, quelle, titel, start, ende, ganztag, personen[], ort, href, verschiebbar, status, unter }
 * - ohne Ende: 60 min (ganztägig: gleicher Tag)
 * - Ende vor Start: Ende = Start + 60 min
 * - Abwesenheit: Titel „Abwesend“ (+ Person), Art und Notiz fallen weg
 * - unbekannte Quelle → „termin“
 */
export function normalisiere(eintraege = []) {
  const aus = [];
  for (const roh of eintraege) {
    if (!roh || roh.id == null) continue;
    const quelle = QUELLEN[roh.quelle] ? roh.quelle : "termin";
    const s = zerlegeDatumZeit(roh.start);
    if (!s.datum) continue;
    const ganztag = !!roh.ganztag || !s.zeit;
    const start = ganztag ? s.datum : verbindeDatumZeit(s.datum, s.zeit);
    let ende;
    if (ganztag) {
      const e = zerlegeDatumZeit(roh.ende);
      ende = e.datum && e.datum >= s.datum ? e.datum : s.datum;
    } else {
      const e = zerlegeDatumZeit(roh.ende);
      ende = e.datum ? verbindeDatumZeit(e.datum, e.zeit || "00:00") : "";
      if (!ende || minutenZwischen(start, ende) <= 0) ende = plusMinuten(start, STANDARD_DAUER);
    }
    const personen = Array.isArray(roh.personen) ? roh.personen.filter(Boolean).map(String) : [];
    const abwesend = quelle === "abwesenheit";
    aus.push({
      id: String(roh.id),
      quelle,
      titel: abwesend ? (personen.length ? `${QUELLEN.abwesenheit.einzeln} · ${personen.join(", ")}` : QUELLEN.abwesenheit.einzeln) : String(roh.titel || QUELLEN[quelle].einzeln),
      unter: abwesend ? "" : String(roh.unter || ""),
      start,
      ende,
      ganztag,
      personen,
      ort: abwesend ? "" : String(roh.ort || ""),
      href: roh.href || "",
      status: abwesend ? "" : String(roh.status || ""),
      verschiebbar: !abwesend && roh.verschiebbar !== false && !ganztag,
    });
  }
  return aus.sort((a, b) => (zeitpunktMinuten(a.start) ?? 0) - (zeitpunktMinuten(b.start) ?? 0) || a.id.localeCompare(b.id));
}

/** Liegt der Eintrag (auch teilweise) am Tag? */
export function amTag(e, tag) {
  const s = zerlegeDatumZeit(e.start).datum;
  const en = zerlegeDatumZeit(e.ende);
  // Ende genau um 00:00 zählt nicht mehr zum Folgetag.
  const letzter = !e.ganztag && en.zeit === "00:00" && en.datum > s ? verschiebe(en.datum, { tage: -1 }) : en.datum;
  return s <= tag && tag <= letzter;
}

/** Zeitfenster eines Eintrags an einem Tag in Minuten { von, bis } (abgeschnitten auf 0…1440). */
export function fensterAmTag(e, tag) {
  const tagStart = zeitpunktMinuten(tag);
  const a = zeitpunktMinuten(e.start) - tagStart;
  const b = zeitpunktMinuten(e.ende) - tagStart;
  return { von: Math.max(0, a), bis: Math.min(1440, b), beginntVorher: a < 0, endetNachher: b > 1440 };
}

/**
 * Spalten-Layout überlappender Einträge eines Tages (wie Apple Kalender): jede Gruppe zusammenhängender
 * Überlappungen teilt sich die Breite. Ergebnis je Eintrag { eintrag, von, bis, spalte, spalten }.
 */
export function layoutTag(eintraege, tag) {
  const zeit = eintraege.filter((e) => !e.ganztag && amTag(e, tag)).map((e) => ({ eintrag: e, ...fensterAmTag(e, tag) }));
  zeit.sort((a, b) => a.von - b.von || b.bis - a.bis);
  const aus = [];
  let gruppe = [];
  let gruppeEnde = -1;
  const schliesse = () => {
    const spaltenEnde = [];
    for (const g of gruppe) {
      let s = spaltenEnde.findIndex((ende) => ende <= g.von);
      if (s < 0) {
        s = spaltenEnde.length;
        spaltenEnde.push(g.bis);
      } else spaltenEnde[s] = g.bis;
      g.spalte = s;
    }
    for (const g of gruppe) aus.push({ ...g, spalten: spaltenEnde.length });
    gruppe = [];
  };
  for (const z of zeit) {
    if (gruppe.length && z.von >= gruppeEnde) schliesse();
    gruppe.push(z);
    gruppeEnde = Math.max(gruppeEnde, z.bis);
  }
  if (gruppe.length) schliesse();
  return aus;
}

function ueberlappen(a, b) {
  return zeitpunktMinuten(a.start) < zeitpunktMinuten(b.ende) && zeitpunktMinuten(b.start) < zeitpunktMinuten(a.ende);
}

/**
 * Kollisionen: zwei Einträge überschneiden sich zeitlich UND betreffen dieselbe Person (oder einer von
 * beiden hat keine Personen – dann gilt der ganze Kalender als eine Ressource). Ganztägige Abwesenheiten
 * kollidieren mit allem derselben Person an dem Tag. Ergebnis: Map id → [{ id, titel }].
 */
export function kollisionen(eintraege) {
  const map = new Map();
  const liste = eintraege.map((e) => (e.ganztag ? { ...e, start: e.start, ende: plusMinuten(e.ende, 1440) } : e));
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i];
      const b = liste[j];
      if (a.ganztag && b.ganztag) continue;
      if (a.ganztag !== b.ganztag && a.quelle !== "abwesenheit" && b.quelle !== "abwesenheit") continue;
      if (!ueberlappen(a, b)) continue;
      const geteilt = !a.personen.length || !b.personen.length || a.personen.some((p) => b.personen.includes(p));
      if (!geteilt) continue;
      if (!map.has(a.id)) map.set(a.id, []);
      if (!map.has(b.id)) map.set(b.id, []);
      map.get(a.id).push({ id: b.id, titel: b.titel });
      map.get(b.id).push({ id: a.id, titel: a.titel });
    }
  }
  return map;
}

/** Text zur Kollision (immer Text + Symbol, nie Farbe allein). */
export function kollisionsText(liste = []) {
  if (!liste.length) return "";
  if (liste.length === 1) return `Überschneidet sich mit „${liste[0].titel}“`;
  return `Überschneidet sich mit ${liste.length} Einträgen`;
}

/** Zeitraum der Ansicht: { von, bis, tage[], titel, kurztitel }. Monat: 42 Tage ab Montag. */
export function zeitraum(ansicht, iso) {
  if (ansicht === "tag") return { von: iso, bis: iso, tage: [iso], titel: tagLang(iso), kurztitel: tagLang(iso) };
  if (ansicht === "monat") {
    const d = ausIso(iso);
    const raster = monatsRaster(d.getFullYear(), d.getMonth());
    return { von: raster[0].iso, bis: raster[41].iso, tage: raster.map((r) => r.iso), raster, titel: monatTitel(iso), kurztitel: monatTitel(iso) };
  }
  const tage = wochenTage(iso);
  return { von: tage[0], bis: tage[6], tage, titel: spanneTitel(tage[0], tage[6]), kurztitel: `KW ${kalenderwoche(iso)}` };
}

/** Vor/Zurück je Ansicht. */
export function blaettern(ansicht, iso, richtung) {
  if (ansicht === "tag") return verschiebe(iso, { tage: richtung });
  if (ansicht === "monat") return verschiebe(iso, { monate: richtung });
  return verschiebe(iso, { tage: 7 * richtung });
}

/**
 * Roving-Fokus im Raster. fokus = { tag, min } (min = Slotbeginn in Minuten; Monat: min wird ignoriert).
 * ←/→ Tag, ↑/↓ Slot (Monat: Woche), Pos1/Ende erster/letzter Tag der Ansicht, Bild↑/↓ erster/letzter Slot.
 * Gibt den neuen Fokus zurück oder null, wenn die Taste nichts bewegt. `aussen` = Ziel liegt außerhalb
 * des Zeitraums (Ansicht muss blättern).
 */
export function bewegeFokus(fokus, taste, { ansicht = "woche", tage = [], von = 420, bis = 1200, schritt = 30 } = {}) {
  let { tag, min } = fokus;
  const letzterSlot = bis - schritt;
  switch (taste) {
    case "ArrowLeft":
      tag = verschiebe(tag, { tage: -1 });
      break;
    case "ArrowRight":
      tag = verschiebe(tag, { tage: 1 });
      break;
    case "ArrowUp":
      if (ansicht === "monat") tag = verschiebe(tag, { tage: -7 });
      else min = Math.max(von, min - schritt);
      break;
    case "ArrowDown":
      if (ansicht === "monat") tag = verschiebe(tag, { tage: 7 });
      else min = Math.min(letzterSlot, min + schritt);
      break;
    case "Home":
      tag = tage[0] || tag;
      break;
    case "End":
      tag = tage[tage.length - 1] || tag;
      break;
    case "PageUp":
      if (ansicht === "monat") return null;
      min = von;
      break;
    case "PageDown":
      if (ansicht === "monat") return null;
      min = letzterSlot;
      break;
    default:
      return null;
  }
  const aussen = tage.length > 0 && !tage.includes(tag);
  return { tag, min, aussen };
}

/** Slots eines Tages im Raster: [von, von+schritt, …] bis ausschließlich bis. */
export function slots(von = 420, bis = 1200, schritt = 30) {
  const aus = [];
  for (let m = von; m < bis; m += schritt) aus.push(m);
  return aus;
}

/**
 * Freie Zeiten für das Slotraster (30 min): jeder Beginn im Raster, an dem `dauer` Minuten frei sind.
 * belegt: Einträge oder {start, ende}; ganztägige Einträge (Abwesenheit) sperren den ganzen Tag.
 * Vergangene Slots (vor `jetzt`) sind nicht frei.
 */
export function freieSlots({ tag, von = 540, bis = 1080, schritt = 30, dauer = 30, belegt = [], jetzt = null } = {}) {
  const tagStart = zeitpunktMinuten(tag);
  if (tagStart === null) return [];
  const bloecke = [];
  for (const b of belegt) {
    if (b.ganztag) {
      if (amTag({ ...b, ganztag: true }, tag)) return [];
      continue;
    }
    const a = zeitpunktMinuten(b.start);
    const e = zeitpunktMinuten(b.ende);
    if (a === null || e === null) continue;
    bloecke.push([a - tagStart, e - tagStart]);
  }
  const grenze = jetzt ? zeitpunktMinuten(jetzt) - tagStart : -Infinity;
  const aus = [];
  for (let m = von; m + dauer <= bis; m += schritt) {
    if (m < grenze) continue;
    if (bloecke.some(([a, e]) => m < e && a < m + dauer)) continue;
    aus.push({ start: plusMinuten(tag, m), ende: plusMinuten(tag, m + dauer), min: m });
  }
  return aus;
}

/** Eintrag auf neuen Beginn legen, Dauer bleibt. */
export function verschiebeEintrag(e, neuerStart) {
  const dauer = minutenZwischen(e.start, e.ende) ?? STANDARD_DAUER;
  return { start: neuerStart, ende: plusMinuten(neuerStart, dauer) };
}

/** Pixel-Lage innerhalb der Tagesspalte → Minuten im Raster (eingerastet auf `raster`). */
export function minutenAusLage(y, hoehe, { von = 420, bis = 1200, raster = 15 } = {}) {
  if (!(hoehe > 0)) return von;
  const roh = von + (Math.min(Math.max(y, 0), hoehe) / hoehe) * (bis - von);
  return Math.min(bis - raster, Math.max(von, Math.round(roh / raster) * raster));
}

/** Lage eines Zeitfensters in der Tagesspalte (0…1). */
export function lageImTag({ von: a, bis: b }, { von = 420, bis = 1200 } = {}) {
  const spanne = bis - von;
  const oben = (Math.max(a, von) - von) / spanne;
  const unten = (Math.min(b, bis) - von) / spanne;
  return { oben: Math.max(0, oben), hoehe: Math.max(0, unten - Math.max(0, oben)), sichtbar: b > von && a < bis };
}

/** Einträge je Tag (Monatsansicht): Map tag → Einträge (ganztägige zuerst). */
export function proTag(eintraege, tage) {
  const map = new Map(tage.map((t) => [t, []]));
  for (const e of eintraege) for (const t of tage) if (amTag(e, t)) map.get(t).push(e);
  for (const liste of map.values()) liste.sort((a, b) => Number(b.ganztag) - Number(a.ganztag) || (zeitpunktMinuten(a.start) ?? 0) - (zeitpunktMinuten(b.start) ?? 0));
  return map;
}

/** Uhrzeit-Spanne als Text: „10:00–11:30“ / „ganztägig“ / „ab 22:00“. */
export function zeitText(e, tag) {
  if (e.ganztag) return "ganztägig";
  const s = zerlegeDatumZeit(e.start);
  const en = zerlegeDatumZeit(e.ende);
  if (tag && s.datum < tag && en.datum > tag) return "ganztägig";
  if (tag && s.datum < tag) return `bis ${en.zeit}`;
  if (tag && en.datum > tag && en.zeit !== "00:00") return `ab ${s.zeit}`;
  return `${s.zeit}–${en.zeit}`;
}

/** Gefilterte Quellen. */
export function filtereQuellen(eintraege, aktiv) {
  if (!aktiv) return eintraege;
  const set = new Set(aktiv);
  return eintraege.filter((e) => set.has(e.quelle));
}

// ---- Raster (Plantafel, Mini-Gantt) ----------------------------------------------------------

/** Tage von…bis (inklusive). */
export function tageVonBis(von, bis) {
  const n = tageZwischen(von, bis);
  if (n === null || n < 0) return [];
  return Array.from({ length: n + 1 }, (_, i) => verschiebe(von, { tage: i }));
}

/**
 * Balken im Tagesraster: { start, laenge, abgeschnittenLinks, abgeschnittenRechts } in Tagen ab `von`,
 * oder null, wenn außerhalb. Balken-Start/Ende sind Tage (inklusive).
 */
export function balkenLage(balken, von, bis) {
  const s = zerlegeDatumZeit(balken.start).datum;
  const e = zerlegeDatumZeit(balken.ende || balken.start).datum || s;
  if (!s || e < von || s > bis) return null;
  const a = s < von ? von : s;
  const b = e > bis ? bis : e;
  return { start: tageZwischen(von, a), laenge: tageZwischen(a, b) + 1, abgeschnittenLinks: s < von, abgeschnittenRechts: e > bis };
}

/** Balken um n Tage verschieben (Dauer bleibt). */
export function verschiebeBalken(balken, tage) {
  const s = zerlegeDatumZeit(balken.start).datum;
  const e = zerlegeDatumZeit(balken.ende || balken.start).datum || s;
  return { start: verschiebe(s, { tage }), ende: verschiebe(e, { tage }) };
}

/** Balken einer Zeile auf Bahnen verteilen, damit sich nichts überdeckt: [{ ...balken, bahn }], bahnen. */
export function bahnen(balkenListe, von, bis) {
  const liste = balkenListe
    .map((b) => ({ b, lage: balkenLage(b, von, bis) }))
    .filter((x) => x.lage)
    .sort((x, y) => x.lage.start - y.lage.start);
  const enden = [];
  const aus = [];
  for (const x of liste) {
    let bahn = enden.findIndex((ende) => ende <= x.lage.start);
    if (bahn < 0) {
      bahn = enden.length;
      enden.push(0);
    }
    enden[bahn] = x.lage.start + x.lage.laenge;
    aus.push({ ...x.b, lage: x.lage, bahn });
  }
  return { balken: aus, bahnen: Math.max(1, enden.length) };
}

/** Minuten im Tag aus "HH:MM" mit Rückfall. */
export function minuten(zeit, ersatz) {
  const m = zeitZuMinuten(zeit);
  return m === null ? ersatz : m;
}
