// Auslastung je Tour (10-konzept-logistik § 4.6): Gewicht gegen Zuladung, Volumen nur wenn alle Lieferscheine
// Pakete mit Maßen haben („Volumen unbekannt (n)“ statt Schätzung), Vorschau „danach“ beim Zuordnen. Reines Modul.

/** Gewicht eines Lieferscheins in g: Gesamtgewicht, sonst Summe der Pakete. */
export function lieferscheinGewichtG(ls) {
  if (Number(ls?.gesamtgewicht_g) > 0) return Number(ls.gesamtgewicht_g);
  return (ls?.pakete || []).reduce((s, p) => s + Number(p.gewicht_g || 0), 0);
}

/** Volumen in m³ oder null, wenn ein Paket ohne Maße ist. */
export function lieferscheinVolumenM3(ls) {
  const pakete = ls?.pakete || [];
  if (!pakete.length) return null;
  let v = 0;
  for (const p of pakete) {
    const l = Number(p.laenge_cm), b = Number(p.breite_cm), h = Number(p.hoehe_cm);
    if (!(l > 0 && b > 0 && h > 0)) return null;
    v += (l * b * h) / 1_000_000;
  }
  return v;
}

export function kg(g) {
  return Math.round(Number(g || 0) / 100) / 10;
}

function zahl(n) {
  return new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 }).format(n);
}

/**
 * @param {object[]} lieferscheine  Lieferscheine der Stopps
 * @param {{zuladung_kg?:number, ladevolumen_m3?:number}|null} fahrzeug
 * @param {number} [plusG]  Vorschau: zusätzliches Gewicht
 */
export function tourAuslastung(lieferscheine = [], fahrzeug = null, plusG = 0) {
  const g = lieferscheine.reduce((s, ls) => s + lieferscheinGewichtG(ls), 0) + Number(plusG || 0);
  const maxKg = Number(fahrzeug?.zuladung_kg || 0);
  const istKg = kg(g);
  const anteil = maxKg > 0 ? istKg / maxKg : 0;
  let unbekannt = 0;
  let vol = 0;
  for (const ls of lieferscheine) {
    const v = lieferscheinVolumenM3(ls);
    if (v === null) unbekannt++;
    else vol += v;
  }
  const ueberKg = maxKg > 0 && istKg > maxKg ? Math.round((istKg - maxKg) * 10) / 10 : 0;
  return {
    kg: istKg,
    maxKg,
    anteil: Math.min(anteil, 1.5),
    ueber: ueberKg > 0,
    ueberKg,
    text: maxKg > 0 ? `${zahl(istKg)} / ${zahl(maxKg)} kg` : `${zahl(istKg)} kg`,
    warnText: ueberKg > 0 ? `Zuladung überschritten um ${zahl(ueberKg)} kg` : "",
    volumenM3: unbekannt ? null : Math.round(vol * 100) / 100,
    volumenText: unbekannt ? `Volumen unbekannt (${unbekannt})` : `${zahl(vol)} m³`,
  };
}

/** Vorschau „+120 kg → 532 / 1 100 kg“. */
export function vorschauDanach(lieferscheine, fahrzeug, neu) {
  const plus = lieferscheinGewichtG(neu);
  const a = tourAuslastung(lieferscheine, fahrzeug, plus);
  return { ...a, plusKg: kg(plus), text: `+${zahl(kg(plus))} kg → ${a.text}` };
}
