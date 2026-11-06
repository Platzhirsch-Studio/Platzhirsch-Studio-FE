// Projektnachkalkulation – Darstellung und Mock-Pfad (Inhaber-Wunsch 04.11.2026, 51-backend-luecken „Projektnachkalkulation“).
// Im Frappe-Modus liefert `ph_projekte.api.projekt_kalkulation_v2(projekt)` die fertige Struktur; im Mock rechnet
// `kalkulationV2(e)` – eine wortgetreue Übertragung von ph_projekte/utils/kalkulation.py (kalkulation_v2 und Helfer) –
// aus den Seed-Daten. Gleiche Feldnamen wie die API. Beträge in Cent, Prozente als Zahl (35.0 = 35 %). Reines Modul.

export const STUFEN = Object.freeze(["DB1", "DB2", "DB3"]);
export const STUFE_LABEL = Object.freeze({ DB1: "Wareneinsatz", DB2: "Montage, Fremdleistung, Material", DB3: "Planung, Beratung, Nachlauf" });
const AMPEL_RANG = { "": 0, gruen: 1, gelb: 2, rot: 3 };
export const PHASE_GRAD = Object.freeze({ Anfrage: 0, Planung: 5, Angebot: 5, Auftrag: 10, Bestellung: 20, Lieferung: 40, Montage: 60, Uebergabe: 95, Abgeschlossen: 100, Abgebrochen: 0 });
const GEWICHT_FERTIG = { phase: 20, lieferung: 40, montage: 40 };

const int = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : 0;
};
const flt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const g = (z, k) => (z && typeof z === "object" ? z[k] : undefined);
const datum = (d) => String(d || "").slice(0, 10);

export function prozent(teil, basis, stellen = 1) {
  const b = int(basis);
  if (!b) return null;
  const f = 10 ** stellen;
  return Math.round(((int(teil) * 100) / b) * f) / f;
}

function gueltigeZeile(zeilen = [], dat, schluessel = {}) {
  const tag = datum(dat) || "9999-12-31";
  let beste = null;
  let besteRang = -1;
  for (const z of zeilen || []) {
    if (datum(g(z, "gueltig_ab")) > tag) continue;
    let rang = 0;
    let passt = true;
    for (const [k, v] of Object.entries(schluessel)) {
      const w = g(z, k);
      if (w && w !== "Alle") {
        if (w !== v) {
          passt = false;
          break;
        }
        rang += 5;
      }
    }
    if (!passt) continue;
    const r = rang * 1e9 + Number(datum(g(z, "gueltig_ab")).replace(/-/g, "") || 0);
    if (r > besteRang) {
      beste = z;
      besteRang = r;
    }
  }
  return beste;
}

export function gemeinkosten(regel, ware = 0, gesamt = 0, erloes = 0, std = 0) {
  if (!regel) return null;
  const art = g(regel, "art") || "Aus";
  const p = flt(g(regel, "prozent"));
  if (art === "Prozent auf Wareneinsatz") return Math.round((int(ware) * p) / 100);
  if (art === "Prozent auf Gesamtkosten") return Math.round((int(gesamt) * p) / 100);
  if (art === "Prozent auf Erloes") return Math.round((flt(erloes) * p) / 100);
  if (art === "Betrag je Projektstunde") return Math.round(flt(std) * int(g(regel, "betrag_je_stunde_cent")));
  return null;
}

export function parameter(einst = {}, projektart, dat, abweichung = {}) {
  const z = gueltigeZeile(einst.ziel_db, dat, { projektart }) || {};
  const gk = gueltigeZeile(einst.gemeinkosten, dat, { projektart }) || {};
  const wahl = (standard, ...werte) => {
    for (const w of werte) if (w !== null && w !== undefined && w !== "") return flt(w);
    return standard;
  };
  const p = {
    ziel: Object.fromEntries(["ziel_db1", "ziel_db2", "ziel_db3"].map((k) => [k, wahl(null, g(z, k))])),
    ampel_gelb_unter: wahl(0, g(z, "ampel_gelb_unter"), einst.ampel_gelb_unter),
    ampel_rot_unter: wahl(5, g(z, "ampel_rot_unter"), einst.ampel_rot_unter),
    budget_gelb: wahl(90, g(z, "budget_gelb"), einst.budget_gelb),
    budget_rot: wahl(100, g(z, "budget_rot"), einst.budget_rot),
    gemeinkosten: { art: g(gk, "art") || "Aus", prozent: flt(g(gk, "prozent")), betrag_je_stunde_cent: int(g(gk, "betrag_je_stunde_cent")) },
    abweichung: false,
  };
  if (abweichung?.aktiv) {
    p.abweichung = true;
    for (const k of ["ziel_db1", "ziel_db2", "ziel_db3"]) if (abweichung[k] !== null && abweichung[k] !== undefined && abweichung[k] !== "") p.ziel[k] = flt(abweichung[k]);
    if (abweichung.gemeinkosten_art) p.gemeinkosten = { art: abweichung.gemeinkosten_art, prozent: flt(abweichung.gemeinkosten_prozent), betrag_je_stunde_cent: int(abweichung.gemeinkosten_je_h_cent) };
  }
  return p;
}

export function erloes({ auftrag_netto_cent = 0, nachtraege_cent = 0, rechnungen = [], gutschriften_netto_cent = 0, skonto_gewaehrt_cent = 0, kassa_netto_cent = 0 } = {}) {
  let gestellt = 0;
  let schluss = false;
  for (const r of rechnungen || []) {
    const art = g(r, "art") || "Rechnung";
    const status = g(r, "status") || "";
    if (art === "Anzahlungsrechnung" || art === "Anzahlung" || status === "Entwurf" || status === "Storniert") continue;
    gestellt += int(g(r, "netto_cent"));
    schluss = schluss || art === "Schlussrechnung" || art === "Barverkauf" || (art === "Rechnung" && !int(auftrag_netto_cent));
  }
  gestellt += int(kassa_netto_cent) - int(gutschriften_netto_cent) - int(skonto_gewaehrt_cent);
  const auftragswert = int(auftrag_netto_cent) + int(nachtraege_cent);
  const [wert, basis] = schluss ? [gestellt, "gestellt"] : [auftragswert - int(skonto_gewaehrt_cent) + int(kassa_netto_cent), "auftrag"];
  return { erloes_cent: wert, basis, auftragswert_cent: auftragswert, gestellt_cent: gestellt, gutschriften_cent: int(gutschriften_netto_cent), skonto_cent: int(skonto_gewaehrt_cent), kassa_cent: int(kassa_netto_cent) };
}

export function summeJe(zeilen = [], feld = "kostenart") {
  const s = {};
  for (const z of zeilen || []) {
    const k = g(z, feld) || "Sonstiges";
    s[k] = (s[k] || 0) + int(g(z, "betrag_cent"));
  }
  return s;
}

export function stufen(erloesCent, kostenJe = {}, stufeJe = {}, gk = null) {
  const e = int(erloesCent);
  const kosten = Object.fromEntries(STUFEN.map((s) => [s, 0]));
  for (const [ka, c] of Object.entries(kostenJe || {})) {
    const st = (stufeJe || {})[ka] || "DB2";
    kosten[STUFEN.includes(st) ? st : "DB2"] += int(c);
  }
  const out = { erloes_cent: e, kosten_je_stufe: kosten };
  let db = e;
  for (const s of STUFEN) {
    db -= kosten[s];
    out[`${s.toLowerCase()}_cent`] = db;
    out[`${s.toLowerCase()}_prozent`] = prozent(db, e);
  }
  if (gk !== null && gk !== undefined) {
    out.gemeinkosten_cent = int(gk);
    out.db4_cent = db - int(gk);
    out.db4_prozent = prozent(out.db4_cent, e);
  }
  out.kosten_gesamt_cent = Object.values(kosten).reduce((a, b) => a + b, 0) + (gk !== null && gk !== undefined ? int(gk) : 0);
  return out;
}

export function prognoseZeile(budget, ist, obligo, manuell = null) {
  const b = int(budget);
  const i = int(ist);
  const o = int(obligo);
  const istManuell = manuell !== null && manuell !== undefined && manuell !== "";
  const rest = istManuell ? Math.max(int(manuell), 0) : Math.max(b - i - o, 0);
  const gesamt = i + o + rest;
  return { budget_cent: b, ist_cent: i, obligo_cent: o, rest_cent: rest, rest_manuell: istManuell, prognose_cent: gesamt, abweichung_cent: gesamt - b, verbrauch_prozent: prozent(i + o, b), prognose_prozent: prozent(gesamt, b) };
}

export function ampelBudget(budget, ist, obligo, prognose = null, gelb = 90, rot = 100) {
  const b = int(budget);
  const verbrauch = int(ist) + int(obligo);
  if (b <= 0) return Math.max(verbrauch, int(prognose)) > 0 ? "gelb" : "";
  if ((Math.max(verbrauch, int(prognose)) * 100) / b > flt(rot)) return "rot";
  return (verbrauch * 100) / b >= flt(gelb) ? "gelb" : "gruen";
}

export function ampelDb(dbProzent, ziel, gelbUnter = 0, rotUnter = 5) {
  if (ziel === null || ziel === undefined || ziel === "" || dbProzent === null || dbProzent === undefined) return "";
  const abstand = flt(ziel) - flt(dbProzent);
  if (abstand <= 0) return "gruen";
  if (abstand >= flt(rotUnter)) return "rot";
  return abstand >= flt(gelbUnter) ? "gelb" : "gruen";
}

export function ampelGesamt(ampeln = []) {
  let beste = "";
  for (const a of ampeln) if ((AMPEL_RANG[a || ""] || 0) > AMPEL_RANG[beste]) beste = a;
  return beste;
}

export function fertigstellungsgrad({ phase, positionen = [], montage_h_ist = 0, montage_h_plan = 0 } = {}) {
  const basis = PHASE_GRAD[phase || ""] || 0;
  if (phase === "Abgeschlossen") return { grad: 100, komponenten: { phase: 100 }, methode: "Phase Abgeschlossen" };
  const pos = (positionen || []).filter((p) => (g(p, "lieferstatus") || "") !== "storniert");
  const menge = pos.reduce((s, p) => s + Math.max(int(g(p, "menge")), 1), 0);
  const komp = { phase: basis };
  if (menge) komp.lieferung = Math.round((pos.reduce((s, p) => s + Math.min(int(g(p, "menge_geliefert")), Math.max(int(g(p, "menge")), 1)), 0) * 1000) / menge) / 10;
  if (flt(montage_h_plan) > 0) komp.montage = Math.round(Math.min(flt(montage_h_ist) / flt(montage_h_plan), 1) * 1000) / 10;
  else if (menge && pos.some((p) => int(g(p, "menge_montiert")))) komp.montage = Math.round((pos.reduce((s, p) => s + Math.min(int(g(p, "menge_montiert")), Math.max(int(g(p, "menge")), 1)), 0) * 1000) / menge) / 10;
  const gew = Object.keys(komp).reduce((s, k) => s + GEWICHT_FERTIG[k], 0);
  let grad = gew ? Math.round(Object.keys(komp).reduce((s, k) => s + komp[k] * GEWICHT_FERTIG[k], 0) / gew) : basis;
  grad = Math.max(grad, basis);
  if (phase === "Uebergabe") grad = Math.max(grad, 95);
  return { grad: Math.min(grad, 100), komponenten: komp, methode: "Phase 20 % · Lieferquote 40 % · Montage Ist/Plan 40 %" };
}

/** ISO-Woche „2026-W45“. */
export function woche(d) {
  const s = datum(d);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const dt = new Date(`${s}T12:00:00Z`);
  const tag = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - tag + 3);
  const jahr = dt.getUTCFullYear();
  const erster = new Date(Date.UTC(jahr, 0, 4));
  const w = 1 + Math.round(((dt - erster) / 86400000 - 3 + ((erster.getUTCDay() + 6) % 7)) / 7);
  return `${jahr}-W${String(w).padStart(2, "0")}`;
}

export function zeitreihe(ist = [], obligo = []) {
  const w = {};
  for (const [feld, zeilen] of [["ist_cent", ist], ["obligo_cent", obligo]]) {
    for (const z of zeilen || []) {
      const k = woche(g(z, "datum"));
      if (k && int(g(z, "betrag_cent"))) {
        w[k] = w[k] || { woche: k, ist_cent: 0, obligo_cent: 0 };
        w[k][feld] += int(g(z, "betrag_cent"));
      }
    }
  }
  let kum = 0;
  return Object.keys(w)
    .sort()
    .map((k) => {
      kum += w[k].ist_cent;
      return { ...w[k], ist_kumuliert_cent: kum };
    });
}

/** Gesamtstruktur wie utils/kalkulation.kalkulation_v2(e). */
export function kalkulationV2(e = {}) {
  const par = e.parameter || parameter({}, null);
  const er = erloes(e.erloes || {});
  const kas = [...(e.kostenarten || [])].sort((a, b) => int(g(a, "reihenfolge")) - int(g(b, "reihenfolge")) || String(g(a, "name")).localeCompare(String(g(b, "name"))));
  const meta = Object.fromEntries(kas.map((k) => [g(k, "name"), k]));
  const stufeJe = Object.fromEntries(Object.entries(meta).map(([n, k]) => [n, g(k, "db_stufe") || "DB2"]));
  const istJe = summeJe(e.ist);
  const oblJe = summeJe(e.obligo);
  const budgetJe = Object.fromEntries((e.budget || []).map((b) => [g(b, "kostenart"), b]));
  const extra = [...new Set([...Object.keys(istJe), ...Object.keys(oblJe), ...Object.keys(budgetJe)])].filter((k) => !(k in meta)).sort();
  const zeilen = [];
  for (const ka of [...Object.keys(meta), ...extra]) {
    const b = budgetJe[ka] || {};
    const aktuell = g(b, "budget_aktuell_cent");
    const budget = aktuell !== null && aktuell !== undefined && aktuell !== "" ? int(aktuell) : int(g(b, "budget_auftrag_cent"));
    const pz = prognoseZeile(budget, istJe[ka] || 0, oblJe[ka] || 0, g(b, "prognose_rest_manuell_cent"));
    if (!(budget || pz.ist_cent || pz.obligo_cent || pz.rest_cent || int(g(b, "budget_auftrag_cent")))) continue;
    zeilen.push({ kostenart: ka, bezeichnung: g(meta[ka], "bezeichnung") || ka, db_stufe: stufeJe[ka] || "DB2", budget_auftrag_cent: int(g(b, "budget_auftrag_cent")), ...pz, prognose_begruendung: g(b, "prognose_begruendung") || "", ampel: ampelBudget(budget, pz.ist_cent, pz.obligo_cent, pz.prognose_cent, par.budget_gelb, par.budget_rot) });
  }
  const summe = Object.fromEntries(["budget_auftrag_cent", "budget_cent", "ist_cent", "obligo_cent", "rest_cent", "prognose_cent", "abweichung_cent"].map((k) => [k, zeilen.reduce((s, z) => s + z[k], 0)]));
  const fort = fertigstellungsgrad(e.fortschritt || {});
  const gk = par.gemeinkosten;
  const an = (gk.art || "Aus") !== "Aus";
  const ware = (werte) => Object.entries(werte).reduce((s, [k, v]) => s + (stufeJe[k] === "DB1" ? v : 0), 0);
  const progJe = Object.fromEntries(zeilen.map((z) => [z.kostenart, z.prognose_cent]));
  const gkIst = an ? gemeinkosten(gk, ware(istJe), summe.ist_cent, (er.erloes_cent * fort.grad) / 100, e.stunden_ist) : null;
  const gkProg = an ? gemeinkosten(gk, ware(progJe), summe.prognose_cent, er.erloes_cent, e.stunden_prognose || e.stunden_ist) : null;
  const stIst = stufen(er.erloes_cent, istJe, stufeJe, gkIst);
  const stProg = stufen(er.erloes_cent, progJe, stufeJe, gkProg);
  const stBudget = stufen(er.auftragswert_cent, Object.fromEntries(zeilen.map((z) => [z.kostenart, z.budget_cent])), stufeJe);
  const erloesAnteilig = Math.round((er.erloes_cent * fort.grad) / 100);
  const dbLauf = erloesAnteilig - summe.ist_cent - (gkIst || 0);
  const letzte = an ? "db4" : "db3";
  const ziel = par.ziel;
  const ampelDbWert = ampelGesamt([1, 2, 3].map((n) => ampelDb(stProg[`db${n}_prozent`], ziel[`ziel_db${n}`], par.ampel_gelb_unter, par.ampel_rot_unter)));
  const gesamtBudget = summe.budget_cent ? ampelBudget(summe.budget_cent, summe.ist_cent, summe.obligo_cent, summe.prognose_cent, par.budget_gelb, par.budget_rot) : "";
  const ampelKosten = ampelGesamt([...zeilen.filter((z) => z.budget_cent).map((z) => z.ampel), gesamtBudget]);
  return {
    kopf: {
      erloes_cent: er.erloes_cent, erloes_basis: er.basis, auftragswert_cent: er.auftragswert_cent, gestellt_cent: er.gestellt_cent,
      kosten_ist_cent: summe.ist_cent, obligo_cent: summe.obligo_cent, budget_cent: summe.budget_cent, budget_auftrag_cent: summe.budget_auftrag_cent,
      prognose_kosten_cent: summe.prognose_cent, abweichung_cent: summe.abweichung_cent, fertigstellungsgrad: fort.grad,
      erloes_anteilig_cent: erloesAnteilig, db_laufend_cent: dbLauf, db_laufend_prozent: prozent(dbLauf, erloesAnteilig),
      db_prognose_cent: stProg[`${letzte}_cent`], db_prognose_prozent: stProg[`${letzte}_prozent`], db_prognose_stufe: letzte.toUpperCase(),
      db1_prozent_ist: stIst.db1_prozent, db1_prozent_prognose: stProg.db1_prozent,
      ueber_budget: !!(summe.budget_cent && summe.prognose_cent > summe.budget_cent),
      ampel_kosten: ampelKosten, ampel_db: ampelDbWert, ampel: ampelGesamt([ampelKosten, ampelDbWert]),
    },
    erloes: er, stufen_ist: stIst, stufen_prognose: stProg, stufen_budget: stBudget, kostenarten: zeilen, summe,
    fertigstellung: fort, parameter: par, gemeinkosten_aktiv: an,
    zeitreihe: zeitreihe(e.ist, e.obligo),
    quellen: [...(e.ist || []).map((z) => ({ ...z, typ: "ist" })), ...(e.obligo || []).filter((z) => int(g(z, "betrag_cent"))).map((z) => ({ ...z, typ: "obligo" }))],
    hinweise: [...(e.hinweise || [])],
  };
}

/** Ampel → Material/Text für Pillen (Status nie Farbe allein). */
export function ampelMaterial(a) {
  return { gruen: "salbei", gelb: "eiche", rot: "cognac" }[a || ""] || "stein";
}
