// Plantafel (10-konzept-logistik § 4.6): Raster Tag × Fahrzeug, Tour-Karten mit Warnungen, Ablage
// (Ohne Tour · Zurück im Fahrzeug · Montagen ohne Tour · Speditionen). Datenquelle im Frappe-Modus
// `ph_tour.plantafel(von, bis)`, im Mock dieselbe Form aus getList. Reines Modul.

import { tourAuslastung } from "./auslastung.js";

const TAG_MS = 86_400_000;
const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function d(iso) {
  return new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
}
export function iso(dt) {
  return dt.toISOString().slice(0, 10);
}
export function plusTage(isoDatum, n) {
  return iso(new Date(d(isoDatum).getTime() + n * TAG_MS));
}
export function montag(isoDatum) {
  const t = d(isoDatum);
  const wt = (t.getUTCDay() + 6) % 7;
  return iso(new Date(t.getTime() - wt * TAG_MS));
}
/** ISO-Kalenderwoche. */
export function kw(isoDatum) {
  const t = d(isoDatum);
  const do_ = new Date(t.getTime() + (3 - ((t.getUTCDay() + 6) % 7)) * TAG_MS);
  const jan4 = new Date(Date.UTC(do_.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((do_ - jan4) / TAG_MS - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}
export function tagKopf(isoDatum) {
  const t = d(isoDatum);
  return `${WOCHENTAG[t.getUTCDay()]} ${String(t.getUTCDate()).padStart(2, "0")}.${String(t.getUTCMonth() + 1).padStart(2, "0")}.`;
}

/**
 * Zeitraum der Ansicht. Woche = Mo–Fr (Sa, wenn Touren am Samstag liegen), 3 Tage ab Datum, Tag.
 * @param {"woche"|"3tage"|"tag"} ansicht
 * @param {string} datum ISO
 */
export function zeitraum(ansicht, datum, { samstag = false } = {}) {
  if (ansicht === "tag") return { von: datum, bis: datum, tage: [datum] };
  if (ansicht === "3tage") {
    const tage = [];
    let t = datum;
    while (tage.length < 3) {
      const wt = d(t).getUTCDay();
      if (wt !== 0 && (wt !== 6 || samstag)) tage.push(t);
      t = plusTage(t, 1);
    }
    return { von: tage[0], bis: tage[2], tage };
  }
  const mo = montag(datum);
  const n = samstag ? 6 : 5;
  const tage = Array.from({ length: n }, (_, i) => plusTage(mo, i));
  return { von: mo, bis: tage[n - 1], tage };
}

/** Vorheriger/nächster Zeitraum. */
export function blaettern(ansicht, datum, richtung) {
  const schritt = ansicht === "tag" ? 1 : ansicht === "3tage" ? 3 : 7;
  return plusTage(datum, richtung * schritt);
}

function teamVon(t) {
  return [t.fahrer, ...(t.team || []).map((m) => m.user)].filter(Boolean);
}

/**
 * Warnungen je Tour (Popover in der Karte).
 * @returns {string[]}
 */
export function tourWarnungen(tour, { touren = [], fahrzeug = null, lieferscheine = new Map(), anzahlungOffen = new Set(), abwesend = new Set() } = {}) {
  const w = [];
  if (!tour.fahrer) w.push("Kein Fahrer");
  const gleicherTag = touren.filter((t) => t.name !== tour.name && t.datum === tour.datum && !["Abgebrochen"].includes(t.status));
  if (tour.fahrzeug && gleicherTag.some((t) => t.fahrzeug === tour.fahrzeug)) w.push("Fahrzeug doppelt belegt");
  if (tour.fahrer && gleicherTag.some((t) => teamVon(t).includes(tour.fahrer))) w.push("Fahrer doppelt belegt");
  for (const u of teamVon(tour)) if (abwesend.has(`${u}|${tour.datum}`)) w.push("Teammitglied abwesend");
  if (fahrzeug?.naechster_service && fahrzeug.naechster_service <= tour.datum) w.push("Fahrzeug-Service fällig");
  const stopps = tour.stopps || [];
  if (stopps.some((s) => s.lieferschein && lieferscheine.get(s.lieferschein)?.status === "Entwurf")) w.push("Lieferschein noch nicht gepackt");
  if (stopps.some((s) => Number(s.zeitfenster_konflikt))) w.push("Zeitfenster-Konflikt");
  if (stopps.some((s) => s.lieferschein && anzahlungOffen.has(s.lieferschein))) w.push("Anzahlung offen");
  return [...new Set(w)];
}

/**
 * Baut das Raster.
 * @param {{touren:object[], fahrzeuge:object[], lieferscheine:object[], speditionen?:object[], montagen?:object[], tage:string[], anzahlungOffen?:Set<string>, abwesend?:Set<string>}} p
 */
export function baueTafel({ touren = [], fahrzeuge = [], lieferscheine = [], speditionen = [], montagen = [], tage = [], anzahlungOffen = new Set(), abwesend = new Set() }) {
  const lsMap = new Map(lieferscheine.map((l) => [l.name, l]));
  const fzMap = new Map(fahrzeuge.map((f) => [f.name, f]));
  const imZeitraum = touren.filter((t) => tage.includes(t.datum));
  const karten = imZeitraum.map((t) => {
    const fz = fzMap.get(t.fahrzeug) || null;
    const ls = (t.stopps || []).map((s) => lsMap.get(s.lieferschein)).filter(Boolean);
    const aus = tourAuslastung(ls, fz);
    const erledigt = (t.stopps || []).filter((s) => ["erledigt", "nicht angetroffen", "verschoben"].includes(s.status)).length;
    return {
      name: t.name,
      datum: t.datum,
      fahrzeug: t.fahrzeug || "",
      status: t.status,
      fahrer: t.fahrer || "",
      team: (t.team || []).map((m) => m.user).filter(Boolean),
      stopps: (t.stopps || []).length,
      erledigt,
      region: t.region || "",
      auslastung: aus,
      warnungen: tourWarnungen(t, { touren, fahrzeug: fz, lieferscheine: lsMap, anzahlungOffen, abwesend }),
    };
  });
  const zeilenNamen = fahrzeuge.filter((f) => Number(f.aktiv ?? 1)).map((f) => f.name);
  if (karten.some((k) => !k.fahrzeug)) zeilenNamen.push("");
  const zeilen = zeilenNamen.map((fz) => ({
    fahrzeug: fz,
    titel: fz ? fzMap.get(fz)?.bezeichnung || fz : "Ohne Fahrzeug",
    kennzeichen: fz,
    zuladung: fzMap.get(fz)?.zuladung_kg || 0,
    zellen: tage.map((tag) => ({ tag, touren: karten.filter((k) => k.datum === tag && (k.fahrzeug || "") === fz) })),
  }));

  const inTour = new Set(touren.filter((t) => !["Abgebrochen"].includes(t.status)).flatMap((t) => (t.stopps || []).map((s) => s.lieferschein)).filter(Boolean));
  const ohneTour = lieferscheine
    .filter((l) => ["Eigenlieferung", "Spedition"].includes(l.lieferart) && ["Entwurf", "Gepackt"].includes(l.status) && !l.tour && !inTour.has(l.name))
    .sort((a, b) => String(a.wunschtermin || "9999").localeCompare(String(b.wunschtermin || "9999")) || String(a.liefer_plz || "").localeCompare(String(b.liefer_plz || "")));
  const zurueck = [];
  for (const t of touren) {
    if (!["Abgeschlossen", "Abgebrochen"].includes(t.status)) continue;
    for (const s of t.stopps || []) {
      const l = lsMap.get(s.lieferschein);
      if (l && l.status === "Uebergeben" && (t.status === "Abgebrochen" || ["nicht angetroffen", "verschoben", "offen", "unterwegs"].includes(s.status))) zurueck.push({ ...l, tourName: t.name, stoppStatus: s.status });
    }
  }
  const montageRefs = new Set(touren.flatMap((t) => (t.stopps || []).map((s) => s.montage_referenz)).filter(Boolean));
  return {
    tage,
    zeilen,
    karten,
    ablage: {
      ohneTour,
      zurueck,
      montagen: montagen.filter((m) => !montageRefs.has(m.name)),
      speditionen: speditionen.filter((s) => tage.some((t) => s.zustell_datum === t) && !["Storniert", "Zugestellt"].includes(s.status)),
    },
  };
}
