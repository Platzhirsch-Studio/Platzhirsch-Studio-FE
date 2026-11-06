// Lesefunktionen Logistik (10-konzept-logistik § 14.4): Übersicht, Akten-Aggregate, Packtisch, Plantafel, Bestand,
// Inventur, Kommission, Berichte. Mock und Frappe über dieselbe Client-Schnittstelle; wo die App ein Aggregat
// hat (`plantafel`, `packtisch.offene`, `kommissionsliste`), nutzt der Frappe-Pfad es. Reines Modul.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatum } from "../format.js";
import { BEISPIEL_BILDER } from "../mock/seed/logistik.js";
import { M, istMock, kommissionsliste, offene, packansicht } from "./dienst.js";
import { entnahmeVorschlag } from "./entnahme.js";
import { anzahlungStatus, steuernachweisNoetig, warenwertAnzeige, zahlungsSperre } from "./zahlung.js";
import { baueTafel, zeitraum } from "./plantafel.js";
import { abdeckung, freigabePruefen, inventurFortschritt, platzListe, plaetzeJeWoche } from "./inventur.js";
import { stornoMoeglich } from "./belegsperre.js";
import { packhinweise } from "./packen.js";
import { schalter as leseSchalter } from "./schalter.js";

const sicher = async (p, ersatz) => {
  try {
    return await p;
  } catch {
    return ersatz;
  }
};

export function heute(client) {
  return isoDatum(client?.jetzt ? client.jetzt() : new Date());
}

/** PH Logistik Einstellungen (Single). */
export async function einstellungen(client) {
  return sicher(client.getDoc("PH Logistik Einstellungen", "PH Logistik Einstellungen"), {});
}

export function testmodus(e) {
  return !!Number(e?.letmeship_testmodus) || !Number(e?.letmeship_konfiguriert);
}

/** Anzeigename eines Benutzers (ohne Rollenzusatz in Klammern). */
export async function personName(client, user) {
  if (!user) return "";
  const u = await sicher(client.getDoc("User", user), null);
  return String(u?.full_name || user.split("@")[0]).replace(/s*(.*)$/, "");
}

export function bildFuer(position, produkt) {
  return produkt?.bild_hauptbild || BEISPIEL_BILDER[position?.ean] || null;
}

// ---------------------------------------------------------------- Übersicht --

/** Vier Kennzahlen (§ 4.1), Filter identisch zu den Number Cards. */
export async function kennzahlen(client) {
  const h = heute(client);
  const [zuPacken, zuPackenAlt, ohneEtikett, unterwegs, tourenHeute] = await Promise.all([
    client.count("PH Lieferschein", { filters: [["status", "=", "Entwurf"]] }),
    client.count("PH Lieferschein", { filters: [["status", "=", "Entwurf"], ["datum", "<", h]] }),
    client.count("PH Sendung", { filters: [["status", "=", "Angelegt"]] }),
    client.count("PH Sendung", { filters: [["status", "=", "Unterwegs"]] }),
    client.getList("PH Tour", { fields: ["name", "status"], filters: [["datum", "=", h], ["status", "!=", "Abgebrochen"]], limit: 20 }),
  ]);
  const stopps = istMock(client) ? tourenHeute.reduce((s, t) => s + ((client.tabelle("PH Tour").get(t.name)?.stopps || []).length), 0) : null;
  return { zuPacken, zuPackenAlt, ohneEtikett, unterwegs, tourenHeute: tourenHeute.length, stopps };
}

/** Zu packen nach Wunschtermin (max. 5). */
export async function zuPackenListe(client, n = 5) {
  const zeilen = await client.getList("PH Lieferschein", { fields: ["name", "kunde_name", "lieferart", "wunschtermin", "liefer_ort", "zerbrechlich", "status", "tour"], filters: [["status", "=", "Entwurf"]], orderBy: "wunschtermin asc", limit: 50 });
  return zeilen.sort((a, b) => String(a.wunschtermin || "9999").localeCompare(String(b.wunschtermin || "9999"))).slice(0, n);
}

/** Touren dieser Woche je Tag. */
export async function tourenWoche(client) {
  const { tage, von, bis } = zeitraum("woche", heute(client));
  const touren = await client.getList("PH Tour", { fields: ["name", "datum", "status", "fahrzeug"], filters: [["datum", "between", [von, bis]], ["status", "!=", "Abgebrochen"]], limit: 50 });
  return tage.map((tag) => {
    const t = touren.filter((x) => x.datum === tag);
    const stopps = istMock(client) ? t.reduce((s, x) => s + (client.tabelle("PH Tour").get(x.name)?.stopps || []).length, 0) : null;
    return { tag, touren: t.length, stopps, fahrzeuge: [...new Set(t.map((x) => x.fahrzeug).filter(Boolean))] };
  });
}

/** Auswertung (eingeklappt): Lieferscheine je Woche, Versandkosten vs. berechnet, Positionen je Lagerort. */
export async function auswertung(client) {
  const [ls, snd, best] = await Promise.all([
    client.getList("PH Lieferschein", { fields: ["datum", "status"], filters: [["status", "!=", "Storniert"]], limit: 500 }),
    client.getList("PH Sendung", { fields: ["preis_brutto_cent", "berechnet_cent", "status"], filters: [["status", "!=", "Storniert"]], limit: 500 }),
    client.getList("PH Lagerbestand", { fields: ["lagerort", "menge"], filters: [["menge", ">", 0]], limit: 1000 }),
  ]);
  const h = heute(client);
  const wochen = [];
  for (let i = 5; i >= 0; i--) {
    const bis = isoDatum(new Date(new Date(`${h}T00:00:00Z`).getTime() - i * 7 * 86_400_000));
    const von = isoDatum(new Date(new Date(`${bis}T00:00:00Z`).getTime() - 6 * 86_400_000));
    wochen.push({ label: `${von.slice(8, 10)}.${von.slice(5, 7)}.`, wert: ls.filter((x) => x.datum >= von && x.datum <= bis).length });
  }
  const orte = new Map();
  for (const b of best) orte.set(b.lagerort || "–", (orte.get(b.lagerort || "–") || 0) + 1);
  return {
    wochen,
    versand: [{ label: "Kosten", wert: snd.reduce((s, x) => s + Number(x.preis_brutto_cent || 0), 0) }, { label: "Berechnet", wert: snd.reduce((s, x) => s + Number(x.berechnet_cent || 0), 0) }],
    orte: [...orte.entries()].map(([label, wert]) => ({ label, wert })).sort((a, b) => b.wert - a.wert),
  };
}

// ----------------------------------------------------------- Lieferschein-Akte --

/** Kommentare mit „Liefermengen an … gemeldet“ (App beim Verlassen von Gepackt). */
function abGemeldet(docinfo, ab) {
  return (docinfo?.comments || []).some((c) => String(c.content || "").includes("Liefermengen") && String(c.content || "").includes(ab || ""));
}

/**
 * Alles für die Lieferschein-Akte: Dokument, Verlauf, Quelle (AB/Bestellung), Sendungen, Tour, Bewegungen, Bänder, Primäraktion.
 */
export async function lieferscheinAkte(client, name, { session, leitung = false } = {}) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Lieferschein", name);
  const [ab, bestellung, sendungen, bewegungen, speditionen, ruecknahmen, tour] = await Promise.all([
    doc.auftrag ? sicher(client.getDoc("PH Auftragsbestaetigung", doc.auftrag), null) : null,
    doc.bestellung ? sicher(client.getDoc("PH Bestellung", doc.bestellung), null) : null,
    sicher(client.getList("PH Sendung", { fields: ["name", "status", "richtung", "carrier", "service_name", "tracking_nr", "tracking_url", "preis_brutto_cent", "env", "gebucht_am", "letzter_abgleich", "fehler"], filters: { lieferschein: name }, limit: 20 }), []),
    sicher(client.getList("PH Lagerbewegung", { fields: ["name", "art", "menge", "lagerbestand", "datum", "status"], filters: { bezug: name }, limit: 50 }), []),
    sicher(client.getList("PH Speditionsauftrag", { fields: ["name", "status"], filters: { lieferschein: name }, limit: 5 }), []),
    sicher(client.getList("PH Warenruecknahme", { fields: ["name", "status"], filters: { lieferschein: name }, limit: 5 }), []),
    doc.tour ? sicher(client.getDoc("PH Tour", doc.tour), null) : null,
  ]);
  const s = leseSchalter();
  const sperre = zahlungsSperre({ ab, bestellung, schalter: s, aktion: doc.lieferart === "Abholung" ? "ausgeben" : "uebergeben" });
  const anz = anzahlungStatus(ab);
  const baender = [];
  const istTourLieferung = tour && doc.lieferart === "Eigenlieferung";
  if (doc.status === "Storniert") baender.push({ id: "storniert", ton: "gefahr", rang: 0 });
  if (doc.auftrag && doc.status === "Zugestellt" && istTourLieferung && !abGemeldet(docinfo, doc.auftrag)) baender.push({ id: "ab", ton: "gefahr", rang: 1 });
  const ohneVerkauf = ["Gepackt", "Uebergeben", "Zugestellt"].includes(doc.status) ? (doc.positionen || []).filter((p) => p.lagerbestand && !bewegungen.some((b) => b.lagerbestand === p.lagerbestand && b.art === "Verkauf" && b.status === "Gebucht")).length : 0;
  if (ohneVerkauf) baender.push({ id: "bestand", ton: "gefahr", rang: 2, n: ohneVerkauf });
  if (anz.offen && !["Zugestellt", "Storniert"].includes(doc.status)) baender.push({ id: "anzahlung", ton: "warnung", rang: 3, anz });
  if (steuernachweisNoetig(ab) && doc.status !== "Storniert") baender.push({ id: "steuer", ton: "warnung", rang: 4 });
  if (doc.problem_grund) baender.push({ id: "problem", ton: "neutral", rang: 5 });
  if (Number(doc.zurueckgestellt)) baender.push({ id: "zurueckgestellt", ton: "warnung", rang: 6 });
  const aktiveSendung = sendungen.find((x) => x.richtung === "Ausgang" && ["Angelegt", "Etikett", "Unterwegs"].includes(x.status)) || null;
  return {
    doc, docinfo, ab, bestellung, sendungen, aktiveSendung, bewegungen, speditionen, ruecknahmen, tour, baender: baender.sort((a, b) => a.rang - b.rang), sperre,
    warenwert: warenwertAnzeige(doc, ab), storno: stornoMoeglich(doc, { leitung }), schalter: s, session: session ? { user: session.user } : null,
  };
}

// ---------------------------------------------------------------- Packtisch --

export async function packtischStart(client) {
  const [o, we, abholung] = await Promise.all([
    offene(client),
    sicher(client.getList("PH Wareneingang", { fields: ["name", "status", "lieferant", "herstellerbestellung", "datum", "modified"], filters: [["status", "in", ["Offen", "Teilweise"]]], limit: 50 }), []),
    sicher(client.getList("PH Lieferschein", { fields: ["name", "kunde_name", "kunde_email", "bestellung", "auftrag", "gepackt_am", "modified"], filters: [["status", "=", "Gepackt"], ["lieferart", "=", "Abholung"]], limit: 50 }), []),
  ]);
  const h = heute(client);
  const morgen = isoDatum(new Date(new Date(`${h}T00:00:00Z`).getTime() + 86_400_000));
  const packen = [
    ...o.lieferscheine.filter((l) => l.status === "Entwurf" || (l.status === "Gepackt" && l.lieferart === "Versand" && !l.sendung_status) || (l.status === "Gepackt" && l.lieferart === "Versand" && l.sendung_status === "Angelegt")).map((l) => ({
      typ: "lieferschein", name: l.name, kunde: l.kunde_name, lieferart: l.lieferart, ort: [l.liefer_ort, l.liefer_land && l.liefer_land !== "AT" ? l.liefer_land : ""].filter(Boolean).join(" "), status: l.status,
      heute: l.status === "Entwurf" && l.wunschtermin && l.wunschtermin <= morgen, etikettFehlt: l.status === "Gepackt", zerbrechlich: !!Number(l.zerbrechlich), tour: l.tour || "", zurueckgestellt: !!Number(l.zurueckgestellt),
      positionen: l.positionen, gepackt: l.positionen - l.offen, alter: l.modified, wunschtermin: l.wunschtermin || "",
    })),
    ...o.bestellungen.filter((b) => b.bezahlt_am && !(Number(b.offen_cent) > 0)).map((b) => ({ typ: "bestellung", name: b.name, kunde: b.kunde_name, lieferart: b.lieferart === "abholung" ? "Abholung" : "Versand", ort: b.adresse_ort || "", neu: true, alter: b.modified, positionen: 0, gepackt: 0 })),
  ].sort((a, b) => (b.heute ? 1 : 0) - (a.heute ? 1 : 0) || (b.etikettFehlt ? 1 : 0) - (a.etikettFehlt ? 1 : 0) || String(a.alter || "").localeCompare(String(b.alter || "")));
  const best = await Promise.all(abholung.map((l) => (l.bestellung ? sicher(client.getDoc("PH Bestellung", l.bestellung), null) : null)));
  const abs = await Promise.all(abholung.map((l) => (l.auftrag ? sicher(client.getDoc("PH Auftragsbestaetigung", l.auftrag), null) : null)));
  const abholKarten = abholung.map((l, i) => {
    const sp = zahlungsSperre({ bestellung: best[i], ab: abs[i], aktion: "ausgeben", schalter: leseSchalter() });
    return { name: l.name, kunde: l.kunde_name, ohneMail: !l.kunde_email, bereitSeit: l.gepackt_am || l.modified, bezahlt: !sp.gesperrt, offenCent: sp.fehltCent, frist: best[i]?.abholung_bis && best[i].abholung_bis < h };
  });
  return { packen, abholung: abholKarten, wareneingang: we, hinweis: o.hinweis, test: o.mock };
}

/** Pack-Ansicht inkl. Entnahme-Vorschlag, Bildern, Packplatz, Hinweisen, Zahlung. */
export async function packDaten(client, name, { packplatz = "Packtisch 1", session } = {}) {
  const pa = await packansicht(client, { lieferschein: name, packplatz });
  const ls = pa.lieferschein;
  const [pp, einst, bestaende, ab, bestellung, tour] = await Promise.all([
    sicher(client.getDoc("PH Packplatz", packplatz), null),
    einstellungen(client),
    sicher(client.getList("PH Lagerbestand", { fields: ["name", "produkt", "produkt_name", "ean", "seriennummer", "lagerort", "platz", "status", "gesperrt", "verfuegbar", "menge", "kommission", "reserviert_fuer"], filters: [["status", "in", ["Verfuegbar", "Reserviert", "Kommission"]]], limit: 1000 }), []),
    ls.auftrag ? sicher(client.getDoc("PH Auftragsbestaetigung", ls.auftrag), null) : null,
    ls.bestellung ? sicher(client.getDoc("PH Bestellung", ls.bestellung), null) : null,
    ls.tour ? sicher(client.getDoc("PH Tour", ls.tour), null) : null,
  ]);
  const produkte = new Map();
  for (const id of [...new Set((pa.positionen || []).map((p) => p.produkt).filter(Boolean))]) produkte.set(id, await sicher(client.getDoc("PH Produkt", id), null));
  const positionen = (pa.positionen || []).map((p) => ({
    ...p,
    bild: bildFuer(p, produkte.get(p.produkt)),
    entnahme: entnahmeVorschlag(p, bestaende, { auftrag: ls.auftrag, bestellung: ls.bestellung, kommission: ls.kommission, packtischLagerort: pp?.lagerort || einst.packtisch_lagerort, standardLagerort: einst.standard_lagerort }),
  }));
  const zweite = ls.modified_by && session?.user && ls.modified_by !== session.user && ls.status === "Entwurf" && Date.now() - new Date(String(ls.modified).replace(" ", "T")).getTime() < 2 * 60_000 ? { wer: ls.modified_by, seit: ls.modified } : null;
  return {
    lieferschein: ls,
    positionen,
    pakete: pa.pakete || [],
    profile: pa.profile || [],
    sendungen: pa.sendungen || [],
    hinweise: pa.zusatz?.packhinweise ? pa.zusatz.packhinweise.map((h, i) => ({ id: `r${i}`, text: h.hinweis || h.bezeichnung, ton: "eiche", icon: "Wine", bestaetigen: !!h.bestaetigen })) : packhinweise(ls, pa.regeln || []),
    packplatz: pp ? { name: pp.name, ton: !!Number(pp.ton_fehler), mengenBestaetigen: !!Number(pp.mengen_bestaetigen ?? 1), gewichtPflicht: !!Number(pp.gewicht_pflicht ?? 1), toleranzPromille: Number(pp.gewicht_toleranz_promille || 250), toleranzMinG: Number(pp.gewicht_toleranz_min_g || 300) } : { name: packplatz, ton: true, mengenBestaetigen: true, gewichtPflicht: true, toleranzPromille: 250, toleranzMinG: 300 },
    zahlung: zahlungsSperre({ ab, bestellung, aktion: ls.lieferart === "Abholung" ? "ausgeben" : "uebergeben", schalter: leseSchalter() }),
    quelle: ls.bestellung ? { art: "shop", nr: ls.bestellung, bezahlt: !!bestellung?.bezahlt_am } : ls.auftrag ? { art: "auftrag", nr: ls.auftrag } : ls.kommission ? { art: "kommission", nr: ls.kommission } : { art: "ohne", nr: "" },
    tour: tour ? { name: tour.name, datum: tour.datum, fahrer: tour.fahrer, fahrerName: await personName(client, tour.fahrer), start_zeit: tour.start_zeit, start_lagerort: tour.start_lagerort } : null,
    test: testmodus(einst),
    zweite,
  };
}

/** Nächster Lieferschein am Packtisch (gesamt, Paket, Sperrgut) – für „Nächster ›“ und das Segment im Kopf. */
export async function naechsteVorgaenge(client, aktuell) {
  const zeilen = await client.getList("PH Lieferschein", { fields: ["name", "lieferart", "wunschtermin", "zurueckgestellt"], filters: [["status", "=", "Entwurf"], ["name", "!=", aktuell]], orderBy: "wunschtermin asc", limit: 100 });
  const offen = zeilen.filter((z) => !Number(z.zurueckgestellt)).sort((a, b) => String(a.wunschtermin || "9999").localeCompare(String(b.wunschtermin || "9999")));
  return { naechster: offen[0]?.name || null, paket: offen.find((z) => z.lieferart === "Versand")?.name || null, sperrgut: offen.find((z) => z.lieferart !== "Versand")?.name || null };
}

// ----------------------------------------------------------------- Plantafel --

export async function plantafel(client, { ansicht = "woche", datum }) {
  const z = zeitraum(ansicht, datum || heute(client));
  const fahrzeuge = await client.getList("PH Fahrzeug", { fields: ["name", "bezeichnung", "kennzeichen", "zuladung_kg", "ladevolumen_m3", "naechster_service", "aktiv", "standard_fahrer"], limit: 50 });
  let touren;
  let lieferscheine;
  let speditionen = [];
  if (!istMock(client)) {
    const r = await client.call(M.plantafel, { von: z.von, bis: z.bis });
    touren = r.touren || [];
    lieferscheine = [...(r.ungeplant || r.lieferscheine || []), ...touren.flatMap((t) => t.lieferscheine || [])];
    speditionen = r.speditionen || [];
  } else {
    const kurz = await client.getList("PH Tour", { fields: ["name"], filters: [["datum", "between", [isoDatum(new Date(new Date(`${z.von}T00:00:00Z`).getTime() - 21 * 86_400_000)), z.bis]]], limit: 200 });
    touren = await Promise.all(kurz.map((t) => client.getDoc("PH Tour", t.name)));
    const lsKurz = await client.getList("PH Lieferschein", { fields: ["name"], filters: [["status", "in", ["Entwurf", "Gepackt", "Uebergeben"]]], limit: 500 });
    lieferscheine = await Promise.all(lsKurz.map((l) => client.getDoc("PH Lieferschein", l.name)));
    speditionen = await sicher(client.getList("PH Speditionsauftrag", { fields: ["name", "status", "kunde_name", "zustell_datum", "ziel_ort", "spediteur"], filters: [["zustell_datum", "between", [z.von, z.bis]]], limit: 50 }), []);
  }
  const montagen = await sicher(client.getList("PH Montageauftrag", { fields: ["name", "titel", "status", "kunde_name", "ort"], filters: [["status", "=", "Geplant"]], limit: 50 }), null);
  const abs = await Promise.all([...new Set(lieferscheine.map((l) => l.auftrag).filter(Boolean))].map((a) => sicher(client.getDoc("PH Auftragsbestaetigung", a), null)));
  const anzahlungOffen = new Set(lieferscheine.filter((l) => abs.find((a) => a?.name === l.auftrag && anzahlungStatus(a).offen)).map((l) => l.name));
  const tafel = baueTafel({ touren, fahrzeuge, lieferscheine, speditionen, montagen: montagen || [], tage: z.tage, anzahlungOffen });
  return { ...tafel, zeitraum: z, montagenFehler: montagen === null, fahrzeuge, touren: touren.filter((t) => z.tage.includes(t.datum)), lieferscheine };
}

// ----------------------------------------------------------------- Tour-Akte --

export async function tourAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Tour", name);
  const [fahrzeug, lieferscheine] = await Promise.all([
    doc.fahrzeug ? sicher(client.getDoc("PH Fahrzeug", doc.fahrzeug), null) : null,
    Promise.all((doc.stopps || []).filter((s) => s.lieferschein).map((s) => sicher(client.getDoc("PH Lieferschein", s.lieferschein), null))),
  ]);
  const ls = lieferscheine.filter(Boolean);
  const abs = await Promise.all([...new Set(ls.map((l) => l.auftrag).filter(Boolean))].map((a) => sicher(client.getDoc("PH Auftragsbestaetigung", a), null)));
  const anzahlung = ls.filter((l) => abs.some((a) => a?.name === l.auftrag && anzahlungStatus(a).offen)).map((l) => l.name);
  const ohneTour = await client.count("PH Lieferschein", { filters: [["status", "in", ["Entwurf", "Gepackt"]], ["lieferart", "in", ["Eigenlieferung", "Spedition"]], ["tour", "in", ["", null]]] }).catch(() => 0);
  const letzte = doc.fahrzeug ? await sicher(client.getList("PH Tour", { fields: ["name", "km_ende"], filters: [["fahrzeug", "=", doc.fahrzeug], ["status", "=", "Abgeschlossen"]], orderBy: "datum desc", limit: 1 }), []) : [];
  return { doc, docinfo, fahrzeug, lieferscheine: ls, anzahlung, ohneTour, kmVorschlag: Number(letzte[0]?.km_ende || 0) || null, fahrerName: await personName(client, doc.fahrer) };
}

// ------------------------------------------------------------------- Bestand --

export const BESTAND_ANSICHTEN = {
  alle: [],
  showroom: [["lagerort", "=", "Showroom Lochau"]],
  lager: [["lagerort", "in", ["Lager Lochau", "Außenlager Hard"]]],
  fahrzeuge: [["lagerort", "like", "Fahrzeug%"]],
  kommission: [["status", "=", "Kommission"]],
  gesperrt: [["status", "=", "Gesperrt"]],
};

/** Bestand gruppiert nach Lagerort (je Gruppe 25 Zeilen + „Weitere 25“). */
export async function bestandGruppen(client, { ansicht = "alle", status, q, mehr = {} }) {
  const filters = [...(BESTAND_ANSICHTEN[ansicht] || []), ["status", "not in", ["Verkauft", "Ausgeschieden"]]];
  if (status) filters.push(["status", "in", String(status).split(",")]);
  const orFilters = q ? ["produkt_name", "seriennummer", "platz", "ean", "marke", "name"].map((f) => [f, "like", `%${q}%`]) : undefined;
  const zeilen = await client.getList("PH Lagerbestand", { fields: ["*"], filters, orFilters, orderBy: "lagerort asc", limit: 2000 });
  const gruppen = new Map();
  for (const z of zeilen) {
    const g = gruppen.get(z.lagerort || "–") || { lagerort: z.lagerort || "–", zeilen: [], stueck: 0 };
    g.zeilen.push(z);
    g.stueck += Number(z.menge || 0);
    gruppen.set(g.lagerort, g);
  }
  return [...gruppen.values()].map((g) => {
    const n = 25 * (1 + Number(mehr[g.lagerort] || 0));
    const sortiert = g.zeilen.sort((a, b) => String(a.platz || "").localeCompare(String(b.platz || ""), "de"));
    return { ...g, gesamt: g.zeilen.length, zeilen: sortiert.slice(0, n), weitere: Math.max(0, g.zeilen.length - n) };
  });
}

export async function bestandAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Lagerbestand", name);
  const [bewegungen, andere] = await Promise.all([
    sicher(client.getList("PH Lagerbewegung", { fields: ["*"], filters: { lagerbestand: name }, orderBy: "datum asc", limit: 200 }), []),
    doc.produkt || doc.ean ? sicher(client.getList("PH Lagerbestand", { fields: ["name", "lagerort", "platz", "menge", "status", "verfuegbar"], filters: doc.produkt ? [["produkt", "=", doc.produkt], ["name", "!=", name]] : [["ean", "=", doc.ean], ["name", "!=", name]], limit: 50 }), []) : [],
  ]);
  let saldo = 0;
  const journal = bewegungen.map((b) => {
    if (b.status === "Gebucht" && ["Wareneingang", "Verkauf", "Ausbuchung", "Retoure", "Inventur"].includes(b.art)) saldo += Number(b.menge || 0);
    return { ...b, saldo };
  });
  return { doc, docinfo, journal: journal.reverse(), andere };
}

export async function lagerorte(client) {
  const kurz = await client.getList("PH Lagerort", { fields: ["name"], limit: 100 });
  return Promise.all(kurz.map((l) => client.getDoc("PH Lagerort", l.name)));
}

// ------------------------------------------------------------------ Inventur --

/** Zählbeginn: Kommentar „Zählung gestartet“, sonst Stichtag 00:00. */
export function zaehlbeginn(inv, docinfo) {
  const k = (docinfo?.comments || []).filter((c) => String(c.content || "").includes("Zählung gestartet")).map((c) => c.creation).sort()[0];
  return k || `${inv.datum || ""} 00:00:00`;
}

export async function inventurAkte(client, name, { session, leitung = false } = {}) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Inventur", name);
  const einst = await einstellungen(client);
  const beginn = zaehlbeginn(doc, docinfo);
  const bewegungen = doc.status === "Laufend" && doc.lagerort
    ? (await sicher(client.getList("PH Lagerbewegung", { fields: ["name", "art", "menge", "lagerbestand", "datum", "lagerort_von", "lagerort_nach", "platz_von", "platz_nach", "status", "von_user"], filters: [["datum", ">=", beginn], ["status", "=", "Gebucht"], ["art", "!=", "Inventur"]], limit: 200 }), [])).filter((b) => b.lagerort_von === doc.lagerort || b.lagerort_nach === doc.lagerort)
    : [];
  const fortschritt = inventurFortschritt(doc.positionen || []);
  const freigabe = freigabePruefen({ inventur: doc, benutzer: session?.user, leitung, bewegungenSeitStart: bewegungen, vierAugen: einst.inventur_vier_augen === undefined ? true : !!Number(einst.inventur_vier_augen) });
  return { doc, docinfo, fortschritt, freigabe, bewegungenSeitStart: bewegungen, beginn, sollAusblenden: !!Number(einst.inventur_soll_ausblenden) && !leitung };
}

export async function inventurAbdeckung(client) {
  const [orte, einst] = await Promise.all([lagerorte(client), einstellungen(client)]);
  const bm = Number(einst.geschaeftsjahr_beginn_monat || 1);
  const h = heute(client);
  return orte
    .filter((l) => l.art !== "Fahrzeug" && (l.plaetze || []).length)
    .map((l) => {
      const p = platzListe([l]);
      const a = abdeckung(p, h, bm);
      return { lagerort: l.name, ...a, jeWoche: plaetzeJeWoche(a.offen, h, bm) };
    });
}

// ----------------------------------------------------------------- Kommission --

export async function kommission(client, k) {
  if (!k) return null;
  return kommissionsliste(client, { kommission: k });
}

// ------------------------------------------------------------------- Berichte --

/** Berichte: Frappe `getReport`, Mock rechnet aus den Daten (gleiche Spalten wie die Script Reports). */
export async function bericht(client, report, filter = {}) {
  if (!istMock(client)) return client.getReport(report, filter);
  const R = (columns, result) => ({ columns, result });
  switch (report) {
    case "PH Versandkosten vs berechnet": {
      const s = await client.getList("PH Sendung", { fields: ["name", "carrier", "service_name", "empf_ort", "preis_brutto_cent", "berechnet_cent", "status", "gebucht_am"], filters: [["status", "!=", "Storniert"], ["richtung", "=", "Ausgang"]], limit: 500 });
      return R([{ fieldname: "name", label: "Sendung" }, { fieldname: "carrier", label: "Carrier" }, { fieldname: "empf_ort", label: "Ort" }, { fieldname: "preis_brutto_cent", label: "Kosten", fieldtype: "Currency", cent: true }, { fieldname: "berechnet_cent", label: "Berechnet", fieldtype: "Currency", cent: true }, { fieldname: "differenz_cent", label: "Differenz", fieldtype: "Currency", cent: true }],
        s.map((x) => ({ ...x, differenz_cent: Number(x.berechnet_cent || 0) - Number(x.preis_brutto_cent || 0) })));
    }
    case "PH Laufzeiten":
    case "PH Zustellprobleme": {
      const s = await client.getList("PH Sendung", { fields: ["name", "carrier", "status", "gebucht_am", "zugestellt_am", "fehler", "empf_ort"], filters: report === "PH Zustellprobleme" ? [["fehler", "!=", ""]] : [["status", "=", "Zugestellt"]], limit: 500 });
      return R([{ fieldname: "name", label: "Sendung" }, { fieldname: "carrier", label: "Carrier" }, { fieldname: "empf_ort", label: "Ort" }, { fieldname: report === "PH Zustellprobleme" ? "fehler" : "tage", label: report === "PH Zustellprobleme" ? "Problem" : "Tage", fieldtype: report === "PH Zustellprobleme" ? "Data" : "Int" }, { fieldname: "status", label: "Status" }],
        s.map((x) => ({ ...x, tage: x.zugestellt_am && x.gebucht_am ? Math.max(0, Math.round((new Date(x.zugestellt_am.replace(" ", "T")) - new Date(x.gebucht_am.replace(" ", "T"))) / 86_400_000)) : null })));
    }
    case "PH Bestandsliste":
    case "PH Ausstellungsstuecke": {
      const filters = [["status", "not in", ["Verkauft", "Ausgeschieden"]]];
      if (report === "PH Ausstellungsstuecke") filters.push(["ausstellungsstueck", "=", 1]);
      const b = await client.getList("PH Lagerbestand", { fields: ["name", "produkt_name", "lagerort", "platz", "menge", "verfuegbar", "ek_cent", "vk_cent_ausstellung", "eingang_am", "status"], filters, limit: 1000 });
      const h = heute(client);
      return R([{ fieldname: "produkt_name", label: "Artikel" }, { fieldname: "lagerort", label: "Lagerort" }, { fieldname: "platz", label: "Platz" }, { fieldname: "menge", label: "Menge", fieldtype: "Int" }, report === "PH Ausstellungsstuecke" ? { fieldname: "alter", label: "Alter (Monate)", fieldtype: "Int" } : { fieldname: "verfuegbar", label: "Verfügbar", fieldtype: "Int" }, { fieldname: "wert_cent", label: report === "PH Ausstellungsstuecke" ? "VK Ausstellung" : "Wert (EK)", fieldtype: "Currency", cent: true }],
        b.map((x) => ({ ...x, alter: x.eingang_am ? Math.floor((new Date(h) - new Date(x.eingang_am)) / (30.44 * 86_400_000)) : null, wert_cent: report === "PH Ausstellungsstuecke" ? Number(x.vk_cent_ausstellung || 0) : Number(x.menge || 0) * Number(x.ek_cent || 0) })));
    }
    case "PH Inventurdifferenzen": {
      const inv = await client.getList("PH Inventur", { fields: ["name"], filters: [["status", "in", ["Abgeschlossen", "Laufend"]]], limit: 50 });
      const docs = await Promise.all(inv.map((i) => client.getDoc("PH Inventur", i.name)));
      return R([{ fieldname: "inventur", label: "Inventur" }, { fieldname: "produkt_name", label: "Artikel" }, { fieldname: "platz", label: "Platz" }, { fieldname: "soll", label: "Soll", fieldtype: "Int" }, { fieldname: "ist", label: "Ist", fieldtype: "Int" }, { fieldname: "differenz", label: "Differenz", fieldtype: "Int" }, { fieldname: "grund", label: "Grund" }],
        docs.flatMap((d) => (d.positionen || []).filter((p) => Number(p.gezaehlt) && Number(p.ist) !== Number(p.soll)).map((p) => ({ inventur: d.name, ...p, differenz: Number(p.ist) - Number(p.soll) }))));
    }
    case "PH Touren Auslastung": {
      const t = await client.getList("PH Tour", { fields: ["name"], filters: [["status", "!=", "Abgebrochen"]], limit: 200 });
      const docs = await Promise.all(t.map((x) => client.getDoc("PH Tour", x.name)));
      return R([{ fieldname: "datum", label: "Datum", fieldtype: "Date" }, { fieldname: "fahrzeug", label: "Fahrzeug" }, { fieldname: "stopps", label: "Stopps", fieldtype: "Int" }, { fieldname: "erledigt", label: "Erledigt", fieldtype: "Int" }, { fieldname: "km", label: "km", fieldtype: "Int" }, { fieldname: "status", label: "Status" }],
        docs.map((d) => ({ datum: d.datum, fahrzeug: d.fahrzeug, stopps: (d.stopps || []).length, erledigt: (d.stopps || []).filter((s) => s.status === "erledigt").length, km: d.km_ende && d.km_start ? d.km_ende - d.km_start : null, status: d.status })));
    }
    case "PH Kommissionsware": {
      const b = await client.getList("PH Lagerbestand", { fields: ["kommission", "produkt_name", "lagerort", "platz", "menge", "gesperrt"], filters: [["kommission", "!=", ""]], limit: 500 });
      return R([{ fieldname: "kommission", label: "Kommission" }, { fieldname: "produkt_name", label: "Artikel" }, { fieldname: "lagerort", label: "Lagerort" }, { fieldname: "platz", label: "Platz" }, { fieldname: "menge", label: "Menge", fieldtype: "Int" }], b);
    }
    case "PH Inventur Abdeckung": {
      const a = await inventurAbdeckung(client);
      return R([{ fieldname: "lagerort", label: "Lagerort" }, { fieldname: "gesamt", label: "Plätze", fieldtype: "Int" }, { fieldname: "gezaehlt", label: "Gezählt", fieldtype: "Int" }, { fieldname: "quote", label: "Abdeckung %", fieldtype: "Int" }, { fieldname: "soll", label: "Plan %", fieldtype: "Int" }, { fieldname: "rueckstand", label: "Rückstand", fieldtype: "Int" }, { fieldname: "jeWoche", label: "Plätze je Woche", fieldtype: "Int" }],
        a.map((x) => ({ ...x, quote: Math.round(x.quotePromille / 10), soll: Math.round(x.sollPromille / 10) })));
    }
    case "PH Nachbestellvorschlag": {
      const v = await client.getList("PH Bestellvorschlag", { fields: ["name", "produkt_name", "marke", "verfuegbar", "meldebestand", "vorschlag_menge", "wert_cent", "status"], filters: [["status", "=", "Offen"]], limit: 200 });
      return R([{ fieldname: "produkt_name", label: "Artikel" }, { fieldname: "marke", label: "Marke" }, { fieldname: "verfuegbar", label: "Verfügbar", fieldtype: "Int" }, { fieldname: "meldebestand", label: "Meldebestand", fieldtype: "Int" }, { fieldname: "vorschlag_menge", label: "Vorschlag", fieldtype: "Int" }, { fieldname: "wert_cent", label: "Wert", fieldtype: "Currency", cent: true }], v);
    }
    default:
      throw new BackofficeError("not_found", `Bericht ${report} ist nicht bekannt.`);
  }
}
