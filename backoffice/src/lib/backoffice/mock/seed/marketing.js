// Mock-Seed – Bereich Marketing (G-01, MASTER § 3.5). Schreibt: Team B-MAR.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-MAR (10-konzept-marketing § 13.3 mock): `anzahl` und `kern` bleiben unverändert (Zufallsfolge aller Bereiche).
// Der Nachlauf ersetzt die generischen Marketing-Datensätze durch einen fachlich stimmigen Bestand, der jeden Status
// und jeden Leer-/Fehlerfall abdeckt: 6 Ausgaben (Entwurf, Wartet auf Freigabe, Geplant, Versendet, Abgebrochen),
// 32 Abos in allen Status, Einwilligungen aller neun Zwecke, 7 Kundenreisen und 17 Vorlagen wie install.py,
// 3 Zielgruppen, 6 Kampagnen (auch CHF), 6 Events (heute mit Check-in, Geplant ohne Uhrzeit, Ausgebucht mit Warteliste,
// Durchgeführt, Abgesagt, Adventsabend wie install.py), 14 Social-Beiträge, 6 Empfehlungen, Einblicke 45 Tage.
// Bezug ist der feste Seed-Tag 04.11.2026 (basis.tage); nur das Check-in-Event liegt auf dem echten heutigen Tag.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Newsletter Ausgabe": 6,
  "PH Event": 5,
  "PH Mail Vorlage": 4,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Newsletter Ausgabe": (doc, { i, r }) => {
    doc.status = ["Entwurf", "Freigabe", "Geplant", "Versendet", "Versendet", "Abgebrochen"][i] || "Entwurf";
    doc.betreff = r.pick(["Neues aus dem Studio", "Einladung Vernissage", "Herbst-Impulse fürs Wohnen", "Küchen-Tage im November", "Outdoor-Vorschau"]);
    doc.titel = doc.betreff;
    doc.slug = `${doc.betreff.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`;
    doc.zielgruppe = "Alle aktiven Abos";
    doc.versand_geplant = doc.status === "Geplant" ? isoDatumZeit(tage(5, r)) : "";
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Event": (doc, { i, r }) => {
    doc.event_id = `EV-2026-${String(i + 1).padStart(2, "0")}`;
    doc.name = doc.event_id;
    doc.titel = r.pick(["Adventsabend", "Vernissage Studio", "Küchen-Tage", "Outdoor-Abend", "Designgespräch"]);
    doc.status = r.pick(["Geplant", "Offen", "Offen", "Ausgebucht", "Durchgefuehrt"]);
    doc.datum = isoDatum(tage(r.int(-30, 60)));
  },
};

// ------------------------------------------------------------------------------------------------ Bestand

/** Version des fachlichen Bestands; eine laufende Mock-Datenbank zieht ihn einmal nach (marketing/daten.js). */
export const SEED_VERSION = "b-mar-3";
export const SEED_MARKE = "_seed_marketing";
export const EINST = "PH Marketing Einstellungen";

const DOMAIN = "beispiel.invalid";
const VOR = ["Maria", "Peter", "Anna", "Lukas", "Sophie", "Felix", "Laura", "David", "Julia", "Simon", "Clara", "Tobias", "Erika", "Paul", "Lena", "Jonas"];
const NACH = ["Muster", "Beispiel", "Probe", "Testner", "Demo", "Vorlage", "Platzhalter", "Schema", "Musterfrau", "Mustermann"];
const BILD = (n) => `/entwurf/lounge/${n}`;
const BILDER = ["r-kueche-eiche.jpg", "r-garten-lounge.jpg", "r-terrasse-see.jpg", "r-wohnen-sofa.jpg", "r-essen-licht.jpg", "r-hero-essraum.jpg", "r-terrasse-hotel.jpg", "r-schlafen.webp", "r-bad.webp"];
const BENUTZER = { leitung: "admin@demo.local", team: "marketing@demo.local", gf: "gf@demo.local" };

const ts = (d) => isoDatumZeit(d);
const tag = (d) => isoDatum(d);
const mitZeit = (offset, h, m = 0) => {
  const d = tage(offset);
  d.setHours(h, m, 0, 0);
  return d;
};

function person(i) {
  const v = VOR[i % VOR.length];
  const n = NACH[(i * 3 + Math.floor(i / VOR.length)) % NACH.length];
  return { vorname: v, nachname: n, name: `${v} ${n}`, email: `${v}.${n}${i > 15 ? i : ""}`.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue") + `@${DOMAIN}` };
}

function stempel(doc, offset = -3) {
  const t = ts(mitZeit(offset, 10));
  return { owner: BENUTZER.team, creation: doc.creation || t, modified: doc.modified || t, modified_by: BENUTZER.team, docstatus: 0, idx: 0, ...doc };
}

function setze(db, doctype, docs) {
  const t = new Map();
  for (const d of docs) t.set(d.name, stempel({ doctype, ...d }));
  db.set(doctype, t);
}

function kinder(parent, parenttype, parentfield, kinddoctype, zeilen) {
  return zeilen.map((z, i) => ({ ...z, doctype: kinddoctype, idx: i + 1, parent, parenttype, parentfield, name: z.name || `${parentfield}-${i + 1}` }));
}

// ------------------------------------------------------------------------------------------------ Vorlagen (install.py)

const VORLAGEN = [
  ["doi_bestaetigen", "Bitte bestätigen Sie Ihre Anmeldung", "Ein Klick, dann ist Ihre Anmeldung abgeschlossen.", "System", "S"],
  ["doi_erinnerung", "Ihre Anmeldung wartet noch", "Ein Klick, dann ist Ihre Anmeldung abgeschlossen.", "System", "S"],
  ["event_bestaetigung", "Ihre Anmeldung: {{ event_titel }}", "Wir freuen uns auf Sie in Lochau.", "Event", "S"],
  ["event_erinnerung", "Erinnerung: {{ event_titel }} am {{ event_datum }}", "Bis bald in Lochau.", "Event", "S"],
  ["newsletter_basis", "{{ betreff }}", "{{ preheader }}", "Newsletter", "A"],
  ["event_nachgerueckt", "Ein Platz ist frei: {{ event_titel }}", "Ein Platz ist frei geworden.", "Event", "S"],
  ["event_absage", "Abgesagt: {{ event_titel }} am {{ event_datum }}", "Leider müssen wir absagen.", "Event", "S"],
  ["event_einladung", "Einladung: {{ event_titel }}", "Eine Einladung aus Lochau.", "Event", "A"],
  ["empfehlung_code", "Ihr persönlicher Empfehlungscode", "Code und Link zum Weitergeben.", "System", "S"],
  ["empfehlung_danke", "Danke für Ihre Empfehlung", "Ihr Gutschein liegt bei.", "System", "S"],
  ["reise_danke", "Willkommen zuhause", "Danke und ein paar Hinweise für die ersten Wochen.", "Kundenreise", "V"],
  ["reise_pflege", "So bleibt {{ produkt }} lange schön", "Unsere Pflegehinweise für Ihre Materialien, kurz zusammengefasst.", "Kundenreise", "V"],
  ["reise_bewertung", "Wie wohnt es sich mit {{ produkt }}?", "Ihre ehrliche Meinung hilft anderen bei der Entscheidung.", "Kundenreise", "A"],
  ["reise_outdoor", "Die Terrasse wartet", "Was Ihre Outdoor-Möbel nach dem Winter brauchen.", "Kundenreise", "je Empfänger"],
  ["reise_advent", "Einladung: {{ event_titel }}", "Ein Abend im Showroom und Café in Lochau.", "Kundenreise", "je Empfänger"],
  ["reise_jahrestag", "Ein Jahr mit {{ produkt }}", "Ein kleiner Gruß aus Lochau.", "Kundenreise", "je Empfänger"],
  ["reise_merkliste", "Ihre Auswahl liegt bereit", "Die Stücke, die Sie sich gemerkt haben, auf einen Blick.", "Kundenreise", "A"],
];

function vorlageHtml(id, betreff, art, fuss) {
  const werbend = ["A", "je Empfänger"].includes(fuss);
  const absatz = {
    reise_danke: "<p>{{ anrede }},</p><p>danke, dass Sie sich für {{ produkt }} entschieden haben. Wenn etwas nicht passt, rufen Sie {{ berater_name }} unter {{ berater_telefon }} an.</p>",
    reise_pflege: "<p>{{ anrede }},</p><p>zwei Wochen mit {{ produkt }}: Hier die Hinweise zu Ihren Materialien.</p>{{ pflege_module }}",
    event_bestaetigung: "<p>{{ anrede }},</p><p>Sie sind angemeldet: {{ event_titel }} am {{ event_datum }} um {{ event_uhrzeit }}.</p>",
  }[id] || `<p>{{ anrede }},</p><p>${betreff.replace(/\{\{[^}]+\}\}/g, "…")}</p>`;
  return `<!-- ${art} -->\n<div class="mail">\n  ${absatz}\n  ${werbend ? "{{ fusszeile_html }}\n  <a href=\"{{ abmelde_url }}\">Abmelden</a>" : "<p>Platzhirsch Home Living · Lochau</p>"}\n</div>`;
}

// ------------------------------------------------------------------------------------------------ Kundenreisen (install.py)

const REISEN = [
  { reise_id: "danke", titel: "Danke nach dem Kauf", ziel: "Beziehung, Vertrauen nach der Lieferung", vorlage: "reise_danke", absender: "berater", werbung: 0, grundlage_v: 1, zweck: "", einmalig: 1, stopp_regeln: "storniert", trigger: [{ ausloeser_typ: "datum", feld: "lieferdatum", versatz_tage: 1 }], status: "Aktiv", aktiv: 1, gesendet_gesamt: 14, letzter: -1 },
  { reise_id: "pflege", titel: "Pflegetipps nach zwei Wochen", ziel: "Service: das Stück bleibt lange schön", vorlage: "reise_pflege", absender: "berater", werbung: 0, grundlage_v: 1, zweck: "", segment_pflege: 1, einmalig: 1, stopp_regeln: "storniert, reklamation_offen_bis_erledigt", trigger: [{ ausloeser_typ: "datum", feld: "lieferdatum", versatz_tage: 14 }], status: "Aktiv", aktiv: 1, gesendet_gesamt: 9, letzter: -2 },
  { reise_id: "bewertung", titel: "Zufriedenheit und Bewertung nach sechs Wochen", ziel: "Rückmeldung, an alle Kunden, ohne Filter und ohne Anreiz", vorlage: "reise_bewertung", absender: "berater", werbung: 1, grundlage_e: 1, zweck: "rueckmeldung", einmalig: 1, stopp_regeln: "widerspruch, ecg_liste, storniert", trigger: [{ ausloeser_typ: "datum", feld: "lieferdatum", versatz_tage: 42 }], status: "Entwurf" },
  { reise_id: "outdoor", titel: "Outdoor im Frühling", ziel: "Saisonstart: Pflege nach dem Winter", vorlage: "reise_outdoor", absender: "gastgeberin", werbung: 1, grundlage_b: 1, grundlage_e: 1, zweck: "newsletter", aehnliche_produkte: "Outdoor-Möbel und Pflege aus dem eigenen Sortiment, passend zum gekauften Outdoor-Stück", segment_outdoor: 1, stopp_regeln: "widerspruch, ecg_liste, reklamation_offen, anfrage_offen, frequenzgrenze", trigger: [{ ausloeser_typ: "jaehrlich", tag_monat: "03-10" }], status: "Pausiert" },
  { reise_id: "advent", titel: "Einladung zum Adventsabend", ziel: "Besuch im Showroom und Café", vorlage: "reise_advent", absender: "gastgeberin", werbung: 1, grundlage_b: 1, grundlage_e: 1, zweck: "einladungen", aehnliche_produkte: "Abend im eigenen Showroom mit dem eigenen Sortiment [Kanzlei bestätigt]", b_nur_mit_kanzlei: 1, stopp_regeln: "widerspruch, ecg_liste, reklamation_offen, frequenzgrenze, bereits_angemeldet", trigger: [{ ausloeser_typ: "event", event: "adventsabend-2026", versatz_tage: -21 }], status: "Entwurf" },
  { reise_id: "jahrestag", titel: "Ein Jahr zuhause", ziel: "Gruß zum Jahrestag der Lieferung", vorlage: "reise_jahrestag", absender: "gastgeberin", werbung: 1, grundlage_b: 1, grundlage_e: 1, zweck: "newsletter", aehnliche_produkte: "Hinweis auf eine weitere Planung im eigenen Kundenportal (eigene Leistung)", stopp_regeln: "widerspruch, ecg_liste, reklamation_offen, frequenzgrenze", trigger: [{ ausloeser_typ: "jahrestag", feld: "lieferdatum" }], status: "Entwurf" },
  { reise_id: "merkliste", titel: "Erinnerung an Merkliste oder Planer", ziel: "Höchstens zwei Erinnerungen nach Einwilligung", vorlage: "reise_merkliste", absender: "gastgeberin", werbung: 1, grundlage_e: 1, zweck: "merkliste_erinnerung", max_je_kontakt: 2, stopp_regeln: "widerruf, anfrage_gestellt, termin_gebucht, max_2_erinnerungen", trigger: [{ ausloeser_typ: "einwilligung", versatz_tage: 3, zwecke: "merkliste_erinnerung,planer_erinnerung" }, { ausloeser_typ: "einwilligung", versatz_tage: 14, zwecke: "merkliste_erinnerung,planer_erinnerung" }], status: "Entwurf" },
];

// ------------------------------------------------------------------------------------------------ Nachlauf

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  void hilfe;
  const heute = new Date();
  const kontakte = [...(db.get("PH Kontakt")?.values() || [])].slice(0, 12);
  const aufraege = [...(db.get("PH Auftragsbestaetigung")?.values() || [])];

  // Interessen
  setze(db, "PH Interesse", [["Wohnen", "Living", 10], ["Küche", "Kitchen", 20], ["Outdoor", "Outdoor", 30], ["Pool & Spa", "Pool & Spa", 40], ["Licht", "Lighting", 50], ["Accessoires", "Accessories", 60], ["Events", "Events", 70], ["Yacht & Objekt", "Yacht & Contract", 80]].map(([n, en, s]) => ({ name: n, interesse: n, label_en: en, sortierung: s, aktiv: 1 })));

  // Vorlagen
  setze(db, "PH Mail Vorlage", VORLAGEN.map(([id, betreff, pre, art, fuss]) => ({ name: id, vorlage_id: id, betreff, preheader: pre, art, sprache: "de", fusszeile: fuss, quelle: "ph_marketing", stand: "2026-11-04", html: vorlageHtml(id, betreff, art, fuss) })));

  // Abos (32) – alle Status, Altbestand, Unbestätigt frisch und über 48 Std.
  const INTERESSEN = ["Küche", "Outdoor", "Wohnen", "Licht", "Pool & Spa", "Events"];
  const aboPlan = [
    ...Array.from({ length: 20 }, () => "Aktiv"),
    "Angemeldet unbestaetigt", "Angemeldet unbestaetigt", "Angemeldet unbestaetigt", "Angemeldet unbestaetigt", "Angemeldet unbestaetigt",
    "Abgemeldet", "Abgemeldet", "Abgemeldet", "Abgemeldet", "Bounce", "Bounce", "Beschwerde",
  ];
  const quellen = ["website", "website", "showroom", "event", "website", "shop", "backoffice", "import"];
  const abos = [];
  const einwilligungen = [];
  aboPlan.forEach((status, i) => {
    const p = person(i);
    const angemeldet = status === "Angemeldet unbestaetigt" ? [mitZeit(-3, 9, 12), mitZeit(-2, 16, 40), mitZeit(0, 8, 45), mitZeit(-1, 20, 5), mitZeit(0, 9, 30)][i - 20] : mitZeit(-60 + i * 2, 9 + (i % 8), (i * 7) % 60);
    const kontakt = i < kontakte.length ? kontakte[i]?.name : "";
    const name = p.email;
    const bestaetigt = status !== "Angemeldet unbestaetigt" ? ts(new Date(angemeldet.getTime() + 88 * 60000)) : "";
    abos.push({
      name, titel: p.name, email: p.email, status, sprache: i % 9 === 4 ? "en" : "de", kontakt, quelle: quellen[i % quellen.length], anrede_name: i % 4 === 0 ? "" : p.name,
      interessen: kinder(name, "PH Newsletter Abo", "interessen", "PH Newsletter Abo Interesse", [INTERESSEN[i % 6], ...(i % 3 === 0 ? [INTERESSEN[(i + 2) % 6]] : [])].map((x) => ({ interesse: x }))),
      angemeldet_am: ts(angemeldet), doi_gesendet_am: ts(angemeldet), doi_bestaetigt_am: bestaetigt,
      abgemeldet_am: status === "Abgemeldet" ? ts(mitZeit(-10 - i, 11)) : "", abmelde_kanal: status === "Abgemeldet" ? ["link", "antwort_mail", "one_click", "backoffice"][i % 4] : status === "Bounce" ? "bounce" : status === "Beschwerde" ? "beschwerde" : "",
      letzte_zustellung: status === "Aktiv" ? ts(mitZeit(-34, 18, 4)) : "", bounce_count: status === "Bounce" ? 3 : 0, letzter_bounce_typ: status === "Bounce" ? "hart" : "",
      textversion: "nl-2026-10-29", altbestand_ohne_doi: i === 18 || i === 19 ? 1 : 0, einwilligung: `EW-NL-${i + 1}`,
      creation: ts(angemeldet), modified: ts(angemeldet),
    });
    if (i !== 18 && i !== 19) {
      einwilligungen.push({
        name: `EW-NL-${i + 1}`, titel: `${p.name} · Newsletter`, email: p.email, kontakt, zweck: "newsletter",
        status: status === "Aktiv" ? "Bestaetigt" : status === "Angemeldet unbestaetigt" ? "Offen" : "Widerrufen",
        zeitpunkt: ts(angemeldet), kanal: quellen[i % quellen.length] === "showroom" ? "showroom" : "website", textversion: "nl-2026-10-29", sprache: "de", doi_noetig: 1,
        doi_gesendet_am: ts(angemeldet), doi_bestaetigt_am: bestaetigt, doi_bestaetigt_kanal: bestaetigt ? "link" : "",
        widerrufen_am: ["Abgemeldet", "Bounce", "Beschwerde"].includes(status) ? ts(mitZeit(-10 - i, 11)) : "", widerruf_kanal: status === "Abgemeldet" ? "link" : status === "Bounce" ? "bounce" : status === "Beschwerde" ? "beschwerde" : "",
        quelle: "website:newsletter", creation: ts(angemeldet), modified: ts(angemeldet),
      });
    }
  });
  // weitere Zwecke: Einladungen (Papier mit Beleg), Foto-Referenz, Pflege, Merkliste, Rückmeldung, Abgelaufen, Widerrufen
  const weitere = [
    [0, "einladungen", "Bestaetigt", "papier", -7, { erteilung_beleg: "/private/files/einwilligung-einladungen-0001.pdf", doi_noetig: 0 }],
    [2, "einladungen", "Bestaetigt", "papier", -12, { erteilung_beleg: "/private/files/einwilligung-einladungen-0002.pdf", doi_noetig: 0 }],
    [4, "foto_referenz", "Bestaetigt", "papier", -40, { erteilung_beleg: "/private/files/foto-referenz-0003.pdf", doi_noetig: 0, referenz_doctype: "PH Kontakt", referenz_name: kontakte[4]?.name || "" }],
    [1, "pflege_nachkauf", "Bestaetigt", "website", -20, {}],
    [6, "merkliste_erinnerung", "Bestaetigt", "website", -5, {}],
    [7, "rueckmeldung", "Offen", "website", -1, {}],
    [8, "planer_erinnerung", "Abgelaufen", "website", -50, {}],
    [3, "einladungen", "Widerrufen", "website", -80, { widerrufen_am: ts(mitZeit(-30, 10)), widerruf_kanal: "antwort_mail", widerruf_grund: "möchte keine Einladungen" }],
    [9, "kundenkarte_auswertung", "Bestaetigt", "showroom", -15, { doi_noetig: 0, erteilung_beleg: "/private/files/kundenkarte-0009.pdf" }],
    [10, "whatsapp", "Bestaetigt", "papier", -25, { doi_noetig: 0, erteilung_beleg: "/private/files/whatsapp-0010.pdf" }],
  ];
  weitere.forEach(([pi, zweck, status, kanal, off, extra], j) => {
    const p = person(pi);
    const z = mitZeit(off, 11, 20);
    einwilligungen.push({
      name: `EW-${zweck.slice(0, 3).toUpperCase()}-${j + 1}`, titel: `${p.name} · ${zweck}`, email: p.email, kontakt: kontakte[pi]?.name || "", zweck, status, zeitpunkt: ts(z), kanal,
      textversion: zweck === "einladungen" ? "event-2026-10" : "nl-2026-10-29", sprache: "de", doi_noetig: 1, doi_gesendet_am: kanal === "website" ? ts(z) : "", doi_bestaetigt_am: status === "Bestaetigt" && kanal === "website" ? ts(new Date(z.getTime() + 3600000)) : "",
      quelle: `${kanal}:${zweck}`, creation: ts(z), modified: ts(z), ...extra,
    });
  });
  setze(db, "PH Newsletter Abo", abos);
  setze(db, "PH Einwilligung", einwilligungen);

  // Newsletter-Ausgaben (PH-NL-2026-0xx)
  const block = (typ, felder) => ({ typ, ...felder });
  const voll = (monat, bild) => [
    block("brief", { absender: "Susanne Messmer", text: `<p>Liebe Leserinnen und Leser,</p><p>im ${monat} riecht der Showroom nach Holz und Kaffee. Wir zeigen, was den Winter wohnlich macht.</p>` }),
    block("neueStuecke", { titel: "Neue Stücke in der Ausstellung", text: "<p>Ein Esstisch aus geräucherter Eiche, zwei Sessel in Bouclé – im Showroom zum Probesitzen.</p>", bild: BILD(bild), bild_alt: "Esstisch aus Eiche im Showroom Lochau", bildquelle: "eigen", marke: "im Showroom", url: "https://platzhirsch.studio/de/showroom", link_label: "Showroom ansehen" }),
    block("skizze", { titel: "", text: "", bild: "", bild_alt: "", bildquelle: "" }),
    block("termine", { titel: "Termine", event: "kuechenabend-2026", text: "" }),
    block("gutZuWissen", { titel: "Ein Tipp", text: "<p>Holzoberflächen im Winter nicht direkt neben die Heizung stellen.</p>" }),
  ];
  const ausgaben = [
    { slug: "2026-07", nummer: 7, status: "Abgebrochen", betreff: "Sommer am See", versand: mitZeit(-120, 18), bloecke: voll("Juli", "r-terrasse-see.jpg"), abbruch_grund: "Falsches Bild im Brief", gesendet: 0 },
    { slug: "2026-09", nummer: 9, status: "Versendet", betreff: "Herbst-Impulse fürs Wohnen", versand: mitZeit(-62, 18), bloecke: voll("September", "r-wohnen-sofa.jpg"), gesendet: 1180, fehler: 0, empfaenger: 1180 },
    { slug: "2026-10", nummer: 10, status: "Versendet", betreff: "Was im Oktober neu im Showroom steht", versand: mitZeit(-34, 18), bloecke: voll("Oktober", "r-essen-licht.jpg"), gesendet: 1231, fehler: 2, empfaenger: 1231 },
    { slug: "2026-11", nummer: 11, status: "Freigabe", betreff: "Was den Winter wohnlich macht", versand: mitZeit(1, 18), bloecke: voll("November", "r-kueche-eiche.jpg"), empfaenger: 20 },
    { slug: "2026-11-en", nummer: 0, status: "Geplant", betreff: "What makes winter feel like home", versand: mitZeit(8, 18), sprache: "en", zielgruppe: "Sprache", bloecke: voll("November", "r-hero-essraum.jpg"), empfaenger: 2 },
    { slug: "2026-12", nummer: 12, status: "Entwurf", betreff: "", versand: null, bloecke: [block("brief", { absender: "Susanne Messmer", text: "" }), block("neueStuecke", { titel: "Neue Stücke", text: "<p>Leuchten aus mundgeblasenem Glas.</p>", bild: BILD("r-hero-essraum.jpg"), bild_alt: "", bildquelle: "eigen" }), block("skizze", {}), block("termine", { titel: "Termine", text: "" }), block("gutZuWissen", {})] },
  ];
  const ausgDocs = ausgaben.map((a, i) => {
    const name = `PH-NL-2026-${String(i + 1).padStart(3, "0")}`;
    const bereit = a.status !== "Entwurf";
    return {
      name, naming_series: "PH-NL-.YYYY.-.###", slug: a.slug, nummer: a.nummer, titel: a.nummer ? `Post aus Lochau Nr. ${a.nummer} · ${a.slug}` : `Post aus Lochau · ${a.slug}`,
      status: a.status, workflow_state: `PH ${a.status}`, betreff: a.betreff, preheader: "", sprache: a.sprache || "de", kampagne: a.slug === "2026-11" ? "PH-KAM-2026-0005" : "",
      zielgruppe: a.zielgruppe || "Alle aktiven Abos", empfaenger_anzahl: a.empfaenger || 0, versand_geplant: a.versand ? ts(a.versand) : "",
      versand_begonnen: a.status === "Versendet" ? ts(a.versand) : "", versendet_am: a.status === "Versendet" ? ts(new Date(a.versand.getTime() + 4 * 60000)) : "",
      versandweg: a.status === "Versendet" ? "Frappe Email Queue" : "", bloecke: kinder(name, "PH Newsletter Ausgabe", "bloecke", "PH Newsletter Block", a.bloecke),
      versandbereit: bereit ? 1 : 0, offene_slots: "skizze", gesendet: a.gesendet || 0, fehler: a.fehler || 0, uebersprungen: 0,
      freigegeben_von: ["Geplant", "Versendet"].includes(a.status) ? BENUTZER.leitung : "", freigegeben_am: ["Geplant", "Versendet"].includes(a.status) ? ts(mitZeit(-40 + i * 6, 15)) : "",
      abbruch_grund: a.abbruch_grund || "", owner: a.status === "Freigabe" ? BENUTZER.team : BENUTZER.leitung,
      creation: ts(mitZeit(-130 + i * 22, 10)), modified: ts(mitZeit(a.status === "Freigabe" ? 0 : -30 + i * 5, a.status === "Freigabe" ? 7 : 12)),
    };
  });
  setze(db, "PH Newsletter Ausgabe", ausgDocs);

  // Versandprotokoll Oktober (je aktivem Abo eine Zeile, 2 Fehler) + September
  const versand = [];
  const aktive = abos.filter((a) => a.status === "Aktiv" || a.status === "Bounce" || a.status === "Abgemeldet");
  for (const [ausgabe, off] of [["PH-NL-2026-003", -34], ["PH-NL-2026-002", -62]]) {
    aktive.forEach((a, i) => {
      const st = a.status === "Bounce" ? "bounce_hart" : a.status === "Abgemeldet" && off === -34 ? "abgemeldet" : i === 3 && off === -34 ? "bounce_weich" : "zugestellt";
      versand.push({ name: `NLV-${ausgabe.slice(-3)}-${i + 1}`, ausgabe, abo: a.name, email: a.email, status: st, versandweg: "Frappe Email Queue", gesendet_am: ts(mitZeit(off, 18, 1 + (i % 4))), zugestellt_am: st === "zugestellt" ? ts(mitZeit(off, 18, 3 + (i % 4))) : "", grund: st === "bounce_hart" ? "Postfach existiert nicht" : st === "bounce_weich" ? "Postfach voll" : st === "abgemeldet" ? "über den Abmeldelink" : "" });
    });
  }
  setze(db, "PH Newsletter Versand", versand);

  // Zielgruppen
  setze(db, "PH Segment", [
    { name: "kueche-bodensee", segment_id: "kueche-bodensee", titel: "Küche, Kauf im letzten Jahr", status: "Aktiv", zweck: "newsletter", verknuepfung: "UND", zustaendig: BENUTZER.team, regeln: kinder("kueche-bodensee", "PH Segment", "regeln", "PH Segment Regel", [{ kriterium: "interesse", operator: "ist", wert: "Küche" }, { kriterium: "kauf_in_tagen", operator: "mindestens", wert: "365" }]), vorschau_treffer: 9, vorschau_empfaenger: 6, vorschau_ausgeschlossen: "ohne_einwilligung: 2, nicht_kontaktieren: 1", vorschau_am: ts(mitZeit(0, 10, 12)), beschreibung: "Für die Küchen-Ausgabe im Frühjahr" },
    { name: "outdoor-schweiz", segment_id: "outdoor-schweiz", titel: "Outdoor, Schweiz", status: "Aktiv", zweck: "newsletter", verknuepfung: "UND", regeln: kinder("outdoor-schweiz", "PH Segment", "regeln", "PH Segment Regel", [{ kriterium: "interesse", operator: "ist", wert: "Outdoor" }, { kriterium: "land", operator: "ist", wert: "Schweiz" }]), vorschau_treffer: 4, vorschau_empfaenger: 3, vorschau_ausgeschlossen: "ohne_einwilligung: 1", vorschau_am: ts(mitZeit(-6, 9)) },
    { name: "einladung-advent", segment_id: "einladung-advent", titel: "Einladung Adventsabend", status: "Archiviert", zweck: "einladungen", verknuepfung: "ODER", regeln: kinder("einladung-advent", "PH Segment", "regeln", "PH Segment Regel", [{ kriterium: "event", operator: "ist", wert: "Herbstabend" }, { kriterium: "plz", operator: "beginnt mit", wert: "69" }]), vorschau_treffer: 0, vorschau_empfaenger: 0, vorschau_am: "" },
  ]);

  // Kundenreisen
  setze(db, "PH Kundenreise", REISEN.map((r) => ({
    name: r.reise_id, reise_id: r.reise_id, titel: r.titel, status: r.status, aktiv: r.aktiv || 0, ziel: r.ziel, vorlage: r.vorlage, absender: r.absender, werbung: r.werbung,
    grundlage_v: r.grundlage_v || 0, grundlage_b: r.grundlage_b || 0, grundlage_e: r.grundlage_e || 0, zweck: r.zweck || "", aehnliche_produkte: r.aehnliche_produkte || "", b_nur_mit_kanzlei: r.b_nur_mit_kanzlei || 0,
    segment_outdoor: r.segment_outdoor || 0, segment_pflege: r.segment_pflege || 0, einmalig: r.einmalig || 0, max_je_kontakt: r.max_je_kontakt || 0, stopp_regeln: r.stopp_regeln, quelle: "install.py", hinweis: "",
    trigger: kinder(r.reise_id, "PH Kundenreise", "trigger", "PH Reise Trigger", r.trigger), gesendet_gesamt: r.gesendet_gesamt || 0, uebersprungen_gesamt: r.gesendet_gesamt ? 2 : 0, letzter_versand: r.letzter ? ts(mitZeit(r.letzter, 9)) : "",
  })));
  const reiseVersand = [];
  for (const [reise, n, off] of [["danke", 6, -1], ["pflege", 4, -2]]) {
    for (let i = 0; i < n; i++) {
      const p = person(i + 3);
      const st = i === n - 1 ? "uebersprungen" : "gesendet";
      reiseVersand.push({ name: `RV-${reise}-${i + 1}`, schluessel: `${reise}:${i}`, reise, empfaenger: p.email, status: st, grundlage: "V", werbung: 0, grund: st === "uebersprungen" ? "storniert" : "", referenz_doctype: "PH Auftragsbestaetigung", referenz_name: aufraege[i]?.name || "", geplant_am: tag(tage(off - i)), gesendet_am: st === "gesendet" ? ts(mitZeit(off - i, 9, 2)) : "" });
    }
  }
  setze(db, "PH Reise Versand", reiseVersand);

  // Kampagnen
  const kennzahlenReihe = (name, n, basis) =>
    kinder(name, "PH Kampagne", "kennzahlen", "PH Kampagne Kennzahl", Array.from({ length: n }, (_, i) => ({ datum: tag(tage(-7 * (n - i))), impressionen: basis * (8 + i), klicks: Math.round(basis * (8 + i) * 0.012), kosten_cent: 15000 + i * 2500, anfragen: i % 3 === 0 ? 1 : 0, notiz: i === 0 ? "Start der Anzeigen" : "" })));
  const k1 = kennzahlenReihe("PH-KAM-2026-0001", 4, 1000);
  const k3 = kennzahlenReihe("PH-KAM-2026-0003", 6, 800);
  const summe = (ks, f) => ks.reduce((a, z) => a + Number(z[f] || 0), 0);
  const kampagne = (name, w) => ({ name, naming_series: "PH-KAM-.YYYY.-.####", waehrung: "EUR", attribution_modell: "", workflow_state: `PH ${w.status}`, ...w });
  setze(db, "PH Kampagne", [
    kampagne("PH-KAM-2026-0001", { titel: "Küche Bodensee Herbst", kanal: "Meta", status: "Aktiv", zustaendig: BENUTZER.team, zeitraum_von: tag(tage(-34)), zeitraum_bis: tag(tage(26)), budget_cent: 200000, ausgaben_cent: summe(k1, "kosten_cent"), ziel_kennzahl: "Anfragen", ziel_wert: 20, ziel_ist: 9, landingpage: "https://platzhirsch.studio/de/kueche", utm_source: "meta", utm_medium: "paid-social", utm_campaign: "kueche-bodensee-herbst", beschreibung: "<p>Küchen mit Blick auf den See – Anzeigen in Vorarlberg und Lindau.</p>", kennzahlen: k1, impressionen_gesamt: summe(k1, "impressionen"), klicks_gesamt: summe(k1, "klicks"), anfragen_gesamt: 9, kosten_je_anfrage_cent: Math.round(summe(k1, "kosten_cent") / 9), klickrate_promille: 12, kontaktpunkte_gesamt: 11, attribution_am: ts(mitZeit(0, 6)) }),
    kampagne("PH-KAM-2026-0002", { titel: "Adventsabend 2026", kanal: "Event", status: "Aktiv", zustaendig: BENUTZER.leitung, zeitraum_von: tag(tage(-4)), zeitraum_bis: tag(tage(22)), budget_cent: 30000, ausgaben_cent: 0, ziel_kennzahl: "Event-Anmeldungen", ziel_wert: 60, kennzahlen: [], anfragen_gesamt: 0, landingpage: "https://platzhirsch.studio/de/adventsabend", utm_source: "newsletter", utm_medium: "email", utm_campaign: "adventsabend-2026" }),
    kampagne("PH-KAM-2026-0003", { titel: "Pinterest Outdoor Frühling", kanal: "Pinterest", status: "Beendet", zustaendig: BENUTZER.team, zeitraum_von: tag(tage(-210)), zeitraum_bis: tag(tage(-150)), budget_cent: 120000, ausgaben_cent: summe(k3, "kosten_cent"), ziel_kennzahl: "Klicks", ziel_wert: 900, ziel_ist: summe(k3, "klicks"), kennzahlen: k3, impressionen_gesamt: summe(k3, "impressionen"), klicks_gesamt: summe(k3, "klicks"), anfragen_gesamt: 5, kosten_je_anfrage_cent: Math.round(summe(k3, "kosten_cent") / 5), klickrate_promille: 12, auswertung_notiz: "<p>Boards Outdoor und Pool &amp; Spa trugen die Klicks.</p>", landingpage: "https://platzhirsch.studio/de/outdoor", utm_source: "pinterest", utm_medium: "paid", utm_campaign: "outdoor-fruehling" }),
    kampagne("PH-KAM-2026-0004", { titel: "Bodensee-Magazin Winter", kanal: "Print", status: "Pausiert", zeitraum_von: tag(tage(-20)), zeitraum_bis: tag(tage(40)), budget_cent: 90000, ausgaben_cent: 45000, kennzahlen: kinder("PH-KAM-2026-0004", "PH Kampagne", "kennzahlen", "PH Kampagne Kennzahl", [{ datum: tag(tage(-18)), impressionen: 0, klicks: 0, kosten_cent: 45000, anfragen: 1, notiz: "Anzeige halbe Seite" }]), anfragen_gesamt: 1 }),
    kampagne("PH-KAM-2026-0005", { titel: "Newsletter Winter", kanal: "Newsletter", status: "Entwurf", zeitraum_von: tag(tage(1)), zeitraum_bis: tag(tage(60)), budget_cent: 0, ausgaben_cent: 0, kennzahlen: [] }),
    kampagne("PH-KAM-2026-0006", { titel: "Messe St. Gallen", kanal: "Event", status: "Aktiv", waehrung: "CHF", zeitraum_von: tag(tage(-40)), zeitraum_bis: tag(tage(-3)), budget_cent: 250000, ausgaben_cent: 230000, kennzahlen: kinder("PH-KAM-2026-0006", "PH Kampagne", "kennzahlen", "PH Kampagne Kennzahl", [{ datum: tag(tage(-21)), impressionen: 0, klicks: 0, kosten_cent: 230000, anfragen: 4, notiz: "Standmiete" }]), anfragen_gesamt: 4 }),
  ]);
  setze(db, "PH Kampagne Kontaktpunkt", Array.from({ length: 6 }, (_, i) => ({ name: `KP-${i + 1}`, kampagne: "PH-KAM-2026-0001", art: ["Anfrage", "Newsletter-Anmeldung", "Anfrage", "Termin", "Anfrage", "Event-Anmeldung"][i], zeit: ts(mitZeit(-30 + i * 4, 14)), email: person(i).email, utm_source: "meta", utm_medium: "paid-social", utm_campaign: "kueche-bodensee-herbst" })));
  // CRM-Anfragen der Kampagne zuordnen (Custom Field ph_marketing_kampagne), nur fehlende Bezüge.
  const anfragen = [...(db.get("PH Anfrage")?.values() || [])];
  anfragen.slice(0, 4).forEach((a) => { if (!a.ph_marketing_kampagne) a.ph_marketing_kampagne = "PH-KAM-2026-0001"; });

  // Events
  const anm = (eventId, liste) => kinder(eventId, "PH Event", "anmeldungen", "PH Event Anmeldung", liste);
  const gaeste = (start, n, opts = {}) =>
    Array.from({ length: n }, (_, i) => {
      const p = person(start + i);
      const st = typeof opts.status === "function" ? opts.status(i) : opts.status || "angemeldet";
      return {
        name_person: i % 5 === 0 ? `Familie ${p.nachname}` : p.name, email: p.email, telefon: i % 4 === 1 ? `+43 664 000 ${String(1000 + start + i).slice(-4)}` : "", personen: opts.personen ? opts.personen(i) : i % 3 === 0 ? 2 : 1,
        status: st, quelle: ["website", "telefon", "showroom", "website", "email"][i % 5], angemeldet_am: ts(mitZeit(-20 + (i % 15), 10 + (i % 8), (i * 11) % 60)),
        nachricht: i % 7 === 2 ? "vegetarisch" : "", bestaetigung_gesendet_am: ts(mitZeit(-20 + (i % 15), 10 + (i % 8), (i * 11) % 60)), erschienen_am: st === "erschienen" ? ts(new Date(new Date().setHours(17, 50 + (i % 9), 0, 0))) : "",
        textversion: "event-2026-10",
      };
    });
  const heuteIso = tag(heute);
  const events = [
    { event_id: "adventsabend-2026", titel: "Adventsabend im Showroom", status: "Geplant", art: "Abend im Showroom", datum: "2026-11-26", url: "https://platzhirsch.studio/de/adventsabend", kampagne: "PH-KAM-2026-0002", beschreibung: "Showroom und Café im Advent. Uhrzeit, Programm und Plätze erst nach Bestätigung des Inhabers eintragen.", anmeldungen: [] },
    { event_id: "designabend-licht", titel: "Designabend Licht", status: "Offen", art: "Markenpräsentation", datum: heuteIso, uhrzeit_von: "18:00:00", uhrzeit_bis: "21:00:00", kapazitaet: 40, warteliste: 1, programm: "<p>Leuchten aus Glas und Stein, kurze Einführung um 18:30.</p>", anmeldungen: gaeste(0, 20, { status: (i) => (i === 2 || i === 9 ? "erschienen" : i === 15 ? "abgesagt" : i === 18 ? "warteliste" : i % 4 === 0 ? "bestaetigt" : "angemeldet") }) },
    { event_id: "kuechenabend-2026", titel: "Küchenabend mit Kochvorführung", status: "Ausgebucht", art: "Workshop", datum: tag(tage(14)), uhrzeit_von: "18:30:00", uhrzeit_bis: "21:30:00", kapazitaet: 12, warteliste: 1, nachruecken_automatisch: 0, max_personen_je_anmeldung: 2, erinnerung_tage_vorher: 2, anmeldungen: gaeste(4, 9, { personen: (i) => (i < 3 ? 2 : 1), status: (i) => (i >= 8 ? "warteliste" : i === 7 ? "abgesagt" : "angemeldet") }).concat(gaeste(14, 2, { status: "warteliste" })) },
    { event_id: "pflege-workshop", titel: "Workshop Holzpflege", status: "Geplant", art: "Workshop", datum: tag(tage(16)), kapazitaet: 10, anmeldungen: [] },
    { event_id: "herbstabend-2026", titel: "Herbstabend am See", status: "Durchgefuehrt", art: "Abend im Showroom", datum: tag(tage(-20)), uhrzeit_von: "18:00:00", uhrzeit_bis: "21:00:00", kapazitaet: 50, erinnerung_gesendet_am: ts(mitZeit(-22, 8)), anmeldungen: gaeste(2, 18, { status: (i) => (i % 6 === 5 ? "nicht erschienen" : i === 3 ? "abgesagt" : "erschienen") }) },
    { event_id: "markenabend-sep", titel: "Markenabend Outdoor", status: "Abgesagt", art: "Markenpräsentation", datum: tag(tage(-50)), uhrzeit_von: "19:00:00", kapazitaet: 30, anmeldungen: gaeste(8, 4, { status: "abgesagt" }) },
  ];
  setze(db, "PH Event", events.map((e) => {
    const plaetze = (e.anmeldungen || []).filter((a) => ["angemeldet", "bestaetigt", "erschienen"].includes(a.status)).reduce((s, a) => s + (a.personen || 1), 0);
    return {
      name: e.event_id, ort: "Showroom und Café, Landstraße 11, 6911 Lochau", kostenlos: 1, max_personen_je_anmeldung: 10, nachruecken_automatisch: 1, erinnerung_tage_vorher: 2, loeschfrist_monate: 3, einwilligung_textversion: "event-2026-10",
      bestaetigung_vorlage: "event_bestaetigung", erinnerung_vorlage: "event_erinnerung", nachrueck_vorlage: "event_nachgerueckt", absage_vorlage: "event_absage", einladung_vorlage: "event_einladung", workflow_state: `PH ${e.status}`,
      plaetze_belegt: plaetze, plaetze_frei: e.kapazitaet ? Math.max(0, e.kapazitaet - plaetze) : 0,
      ...e, anmeldungen: anm(e.event_id, e.anmeldungen || []),
      creation: ts(mitZeit(-40, 10)), modified: ts(mitZeit(-2, 10)),
    };
  }));

  // Social-Beiträge (diese Woche und Umgebung)
  const montag = (() => {
    const d = tage(0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  })();
  const amTag = (n) => tag(new Date(montag.getFullYear(), montag.getMonth(), montag.getDate() + n));
  const beitraege = [
    ["Bodensee-Küche in Eiche", "Pinterest", "Pin", "Geplant", 1, "bodensee", "r-kueche-eiche.jpg", "eigen"],
    ["Advent im Showroom", "Instagram", "Post", "Entwurf", 3, "", "r-hero-essraum.jpg", "eigen", { wartet: true }],
    ["Terrasse am See", "Instagram", "Karussell", "Veroeffentlicht", -5, "", "r-terrasse-see.jpg", "eigen", { veroeffentlicht_url: "https://www.instagram.com/p/beispiel-1", reichweite: 1800, likes: 140, saves: 22, klicks: 31, kommentare: 6 }],
    ["Licht für dunkle Abende", "Pinterest", "Pin", "Freigegeben", 2, "", "r-essen-licht.jpg", "Hersteller freigegeben", { marke_name: "Vitra", bild_credit: "Vitra", bildfreigabe_status: "schriftlich erteilt" }],
    ["Pool und Spa im Hotel", "Pinterest", "Board", "Idee", 4, "pool-spa", "", "offen"],
    ["Ski-Chalet Wohnzimmer", "Instagram", "Reel", "Idee", 6, "", "", "offen"],
    ["Gartenlounge im Herbst", "Instagram", "Post", "Entwurf", 5, "", "r-garten-lounge.jpg", "offen"],
    ["Schlafzimmer in Leinen", "Pinterest", "Pin", "Geplant", 2, "chalet", "r-schlafen.webp", "eigen"],
    ["Badgestaltung mit Naturstein", "LinkedIn", "Post", "Verworfen", 1, "", "r-bad.webp", "eigen"],
    ["Essplatz für zwölf", "Pinterest", "Pin", "Veroeffentlicht", -3, "kueche", "r-hero-essraum.jpg", "eigen", { veroeffentlicht_url: "https://www.pinterest.com/pin/beispiel-2", reichweite: 2400, saves: 85, klicks: 52 }],
    ["Hotelterrasse Lindau", "LinkedIn", "Karussell", "Entwurf", 8, "", "r-terrasse-hotel.jpg", "eigen", { kampagne: "PH-KAM-2026-0001" }],
    ["Wohnzimmer mit Seeblick", "Instagram", "Story", "Geplant", 9, "", "r-wohnen-sofa.jpg", "eigen"],
    ["Adventsabend – Einladung", "Facebook", "Post", "Idee", 10, "", "", "offen", { kampagne: "PH-KAM-2026-0002" }],
    ["Kochinsel im Detail", "Pinterest", "Video", "Entwurf", -1, "kueche", "r-kueche-eiche.jpg", "eigen"],
  ];
  setze(db, "PH Social Beitrag", beitraege.map(([titel, kanal, format, status, off, board, bild, quelle, extra = {}], i) => {
    const name = `PH-SOC-2026-${String(i + 1).padStart(4, "0")}`;
    const { wartet, ...rest } = extra;
    return {
      name, naming_series: "PH-SOC-.YYYY.-.####", titel, kanal, format, status, workflow_state: `PH ${status}`, datum_geplant: amTag(off), uhrzeit_geplant: status === "Geplant" ? "10:00:00" : "", zustaendig: i % 3 === 0 ? BENUTZER.leitung : BENUTZER.team,
      board, overline: "", text: `<p>${titel}. Im Showroom in Lochau zu sehen.${extra.marke_name ? " Anzeige – in Kooperation mit dem Hersteller." : ""}</p>`, hashtags: "#platzhirsch #lochau #bodensee", link: "https://platzhirsch.studio/de/showroom", sprache: "de",
      alt_text: bild ? `${titel} – Raumbild` : "", bild: bild ? BILD(bild) : "", bildquelle_freigabe: quelle, bild_credit: quelle === "eigen" ? "Platzhirsch Home Living" : "",
      freigegeben_von: ["Freigegeben", "Geplant", "Veroeffentlicht"].includes(status) ? BENUTZER.leitung : "", freigegeben_am: ["Freigegeben", "Geplant", "Veroeffentlicht"].includes(status) ? ts(mitZeit(off - 2, 15)) : "",
      veroeffentlicht_am: status === "Veroeffentlicht" ? ts(mitZeit(off, 10)) : "", kennzahlen_stand: status === "Veroeffentlicht" ? tag(tage(0)) : "", _wartet: wartet ? 1 : 0, ...rest,
      creation: ts(mitZeit(off - 6, 9)), modified: ts(mitZeit(Math.min(0, off - 1), 11)),
    };
  }));

  // Empfehlungen
  const ab = (i) => aufraege[i]?.name || `AB-2026-0000${i + 1}`;
  setze(db, "PH Empfehlung", [
    { code: "EMP-7K3QX9", status: "Gutschein faellig", empfehler_name: person(0).name, empfehler_email: person(0).email, empfehler_kontakt: kontakte[0]?.name || "", empfehler_auftrag: ab(0), empfohlen_name: person(1).name, empfohlen_email: person(1).email, einwilligung_empfohlen: 1, einwilligung_zeit: ts(mitZeit(-15, 14, 2)), auftrag: ab(1), auftrag_datum: tag(tage(-40)), ruecktritt_ende: tag(tage(-6)), code_gesendet_am: ts(mitZeit(-23, 10)) },
    { code: "EMP-2B8MN4", status: "Code ausgegeben", empfehler_name: person(5).name, empfehler_email: person(5).email, empfehler_auftrag: ab(2), code_gesendet_am: "" },
    { code: "EMP-4H6TR2", status: "Anfrage eingegangen", empfehler_name: person(6).name, empfehler_email: person(6).email, empfehler_auftrag: ab(3), empfohlen_name: person(7).name, empfohlen_email: person(7).email, einwilligung_empfohlen: 1, einwilligung_zeit: ts(mitZeit(-3, 11)), anfrage: anfragen[0]?.name || "", code_gesendet_am: ts(mitZeit(-12, 9)) },
    { code: "EMP-9PL3WS", status: "Auftrag erteilt", empfehler_name: person(8).name, empfehler_email: person(8).email, empfehler_auftrag: ab(0), empfohlen_name: person(9).name, empfohlen_email: person(9).email, einwilligung_empfohlen: 1, einwilligung_zeit: ts(mitZeit(-30, 16)), auftrag: ab(2), auftrag_datum: tag(tage(-12)), code_gesendet_am: ts(mitZeit(-35, 9)) },
    { code: "EMP-3QX8ZD", status: "Gutschein ausgegeben", empfehler_name: person(10).name, empfehler_email: person(10).email, empfehler_auftrag: ab(3), empfohlen_name: person(11).name, empfohlen_email: person(11).email, einwilligung_empfohlen: 1, auftrag: ab(4), gutschein_code_letzte4: "7KQ2", gutschein_ausgegeben_am: tag(tage(-9)), code_gesendet_am: ts(mitZeit(-90, 9)) },
    { code: "EMP-6VN2HA", status: "Abgelehnt", empfehler_name: person(12).name, empfehler_email: person(12).email, empfehler_auftrag: ab(1), empfohlen_name: person(13).name, notiz: "Empfohlene Person war bereits Kundin", code_gesendet_am: ts(mitZeit(-70, 9)) },
  ].map((e) => ({ name: e.code, titel: `${e.empfehler_name} · ${e.code}`, ...e })));

  // Einblicke (45 Tage, 3 Lücken)
  const seiten = ["/de/kueche", "/de/outdoor", "/de/showroom", "/de/adventsabend", "/de/marken/vitra", "/de/newsletter", "/de/pool-spa", "/de/licht", "/de/schlafen", "/de/bad", "/de/kontakt", "/de/yacht"];
  const einblick = [];
  for (let i = 45; i >= 1; i--) {
    if ([7, 19, 33].includes(i)) continue;
    const d = tage(-i);
    const besuche = 120 + ((i * 37) % 90);
    einblick.push({ name: tag(d), datum: tag(d), titel: tag(d), schema: "1", status: i === 2 ? "Teilweise" : "Vollstaendig", empfangen_am: ts(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 2, 10)), besuche, seiten_json: JSON.stringify(seiten.map((s, j) => ({ pfad: s, besuche: Math.max(3, Math.round(besuche / (j + 2))), scroll: 40 + ((i + j * 7) % 50), ziele: j < 3 ? (i + j) % 3 : 0 }))) });
  }
  setze(db, "PH Einblick Tag", einblick);

  // Mail-Ereignisse (Zustellmeldungen)
  setze(db, "PH Mail Ereignis", versand.filter((v) => v.status !== "zugestellt").map((v, i) => ({ name: `ME-${i + 1}`, ereignis_id: `evt-${i + 1}`, typ: v.status, art: v.status.startsWith("bounce") ? "bounce" : v.status === "abgemeldet" ? "abgemeldet" : "zugestellt", bounce_typ: v.status === "bounce_hart" ? "hart" : v.status === "bounce_weich" ? "weich" : "", email: v.email, empfangen_am: v.gesendet_am, versand: v.name, ergebnis: "verarbeitet" })));

  // Einstellungen (Single)
  const e = db.get(EINST)?.get(EINST) || { doctype: EINST, name: EINST };
  Object.assign(e, {
    automatik_aktiv: 0, test_empfaenger: `team@${DOMAIN}`, kanzlei_fusszeilen_freigegeben: 0, kanzlei_b_einladung_bestaetigt: 0, ecg_abgleich_gueltig_bis: "",
    website_url: "https://platzhirsch.studio", absender_name: "Platzhirsch Home Living", absender_gastgeberin_name: "Susanne Messmer · Platzhirsch", absender_gastgeberin: `gastgeberin@${DOMAIN}`, antwort_an: `info@${DOMAIN}`,
    versandweg: "Frappe Email Queue", versand_stapel: 200, doi_gueltig_stunden: 48, doi_erinnerung_nach_stunden: 24, unbestaetigt_loeschen_tage: 30, ip_hash_speichern: 0, einwilligung_textversion: "nl-2026-10-29",
    bestaetigen_pfad: "/de/newsletter/bestaetigen", abmelden_pfad: "/de/newsletter/abmelden", werbung_pro_30_tage: 2, werbung_wochentage: "2,3,4", sperrtage: "12-24,12-25,12-26,12-31,01-01",
    auftrags_doctype: "PH Auftragsbestaetigung", feld_name: "kunde_name", feld_lieferdatum: "liefertermin_bestaetigt", feld_berater: "zugewiesen_an", feld_produkt: "titel", feld_storniert: "status", wert_storniert: "Storniert", positionen_tabelle: "positionen", feld_kontakt: "kontakt",
    empfehlung_gutschein_cent: 10000, empfehlung_ruecktritt_tage: 14, empfehlung_bedingungen_url: "https://platzhirsch.studio/de/empfehlung", event_erinnerung_tage: 2, event_loeschfrist_monate: 3,
    resend_webhook_aktiv: 0, soft_bounce_grenze: 3, mail_ereignis_aufbewahren_tage: 180, attribution_modell: "last", attribution_fenster_tage: 180, kampagne_nachlauf_tage: 30,
    [SEED_MARKE]: SEED_VERSION, modified: ts(mitZeit(-1, 9)),
  });
  if (!db.has(EINST)) db.set(EINST, new Map());
  db.get(EINST).set(EINST, e);
}
