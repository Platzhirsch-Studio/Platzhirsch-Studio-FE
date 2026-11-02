// src/lib/kundenbetreuung/generate-frappe.mjs
// Schreibt aus den Website-Quellen (reisen.js, systemMails.js,
// newsletter/ausgaben.js) die generierten Teile der Frappe-App
// ../platzhirsch-frappe-kundenbetreuung:
//   - Doctype-Definitionen (JSON) aus den kompakten Specs unten
//   - Jinja-Mailvorlagen templates/emails/*.html und templates/newsletter/*.html
//   - Fixtures fixtures/ph_mail_vorlage.json, fixtures/ph_kundenreise.json
// Die Python-Dateien (engine.py, api.py …) sind handgeschrieben und werden
// NICHT überschrieben.
//
//   node src/lib/kundenbetreuung/generate-frappe.mjs [zielordner]
//
// Nichts davon läuft gegen ein Backoffice; die Datei schreibt nur lokal.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PFLEGE_MODULE, REISEN } from "./reisen.js";
import { reiseMailHtml } from "./mail.js";
import { SYSTEM_MAILS, systemMailHtml } from "./systemMails.js";
import { AUSGABEN } from "./newsletter/ausgaben.js";
import { ausgabeMailHtml, offeneSlots, versandbereit } from "./newsletter/newsletter.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.argv[2] || path.join(here, "../../../../platzhirsch-frappe-kundenbetreuung"));
const APP = path.join(ROOT, "platzhirsch_kundenbetreuung");
const MODULE = "Kundenbetreuung";
const MOD_DIR = path.join(APP, "kundenbetreuung");
const STAND = "2026-10-29";

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.endsWith("\n") ? content : `${content}\n`, "utf8");
};
const snake = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

// ── Doctype-Specs: [fieldname, fieldtype, label, extra] ─────────────────────
const SEL = (...o) => ({ options: o.join("\n") });
const DOCTYPES = [
  {
    name: "PH Kundenbetreuung Einstellungen",
    issingle: 1,
    description: "Schalter, Datenquelle und Absender der automatischen Kundenbetreuung",
    fields: [
      ["sb_schalter", "Section Break", "Schalter"],
      ["aktiv", "Check", "Automatik aktiv", { default: "0", description: "Erst einschalten, wenn Mail-Dienst, SPF/DKIM/DMARC und die Kanzlei-Freigabe der Fußzeilen vorliegen." }],
      ["testmodus", "Check", "Testmodus", { default: "1", description: "Alle Mails gehen nur an die Testadresse, Betreff mit [TEST]." }],
      ["test_empfaenger", "Data", "Testadresse", { options: "Email" }],
      ["kanzlei_fusszeilen_freigegeben", "Check", "Fußzeilen A/B von der Kanzlei freigegeben", { default: "0" }],
      ["kanzlei_b_einladung_bestaetigt", "Check", "Kanzlei: Einladung an Bestandskunden ohne Einwilligung zulässig (B)", { default: "0" }],
      ["ecg_abgleich_gueltig_bis", "Date", "ECG-Liste abgeglichen, gültig bis", { description: "Ohne gültigen Abgleich gehen keine Mails mit Grundlage B raus. Gesperrte Adressen als Email Unsubscribe (global) importieren." }],
      ["cb_1", "Column Break", ""],
      ["website_url", "Data", "Website", { default: "https://platzhirsch.studio" }],
      ["absender_gastgeberin", "Data", "Absender Gastgeberin (E-Mail)", { options: "Email" }],
      ["absender_gastgeberin_name", "Data", "Absender Gastgeberin (Name)", { default: "Susanne Messmer · Platzhirsch" }],
      ["sb_quelle", "Section Break", "Datenquelle Aufträge"],
      ["quelle_doctype", "Link", "Auftrags-Doctype", { options: "DocType", default: "Sales Order" }],
      ["feld_email", "Data", "Feld E-Mail", { default: "contact_email" }],
      ["feld_name", "Data", "Feld Name", { default: "customer_name" }],
      ["feld_anrede", "Data", "Feld Anrede (optional)", { default: "" }],
      ["feld_lieferdatum", "Data", "Feld Lieferdatum", { default: "delivery_date" }],
      ["feld_berater", "Data", "Feld Berater (User)", { default: "owner" }],
      ["feld_produkt", "Data", "Feld Produktbezeichnung", { default: "ph_produkt_kurz" }],
      ["feld_storniert", "Data", "Feld storniert (Check/Status)", { default: "status" }],
      ["wert_storniert", "Data", "Wert für storniert", { default: "Cancelled" }],
      ["cb_2", "Column Break", ""],
      ["positionen_tabelle", "Data", "Positions-Tabelle", { default: "items" }],
      ["feld_pflegekategorie", "Data", "Feld Pflegekategorie (Position)", { default: "ph_pflege_kategorie" }],
      ["feld_outdoor", "Data", "Feld Outdoor (Position, Check)", { default: "ph_outdoor" }],
      ["feld_reklamation_offen", "Data", "Feld Reklamation offen (Auftrag, Check)", { default: "ph_reklamation_offen" }],
      ["feld_nicht_kontaktieren", "Data", "Feld nicht kontaktieren (Auftrag oder Kunde, Check)", { default: "ph_nicht_kontaktieren" }],
      ["feld_widerspruchshinweis_am", "Data", "Feld Widerspruchshinweis beim Kauf (Auftrag, Datum)", { default: "ph_widerspruchshinweis_am", description: "§ 174 Abs. 4 Z 3 TKG: Datum, an dem beim Kauf auf das Recht hingewiesen wurde, Werbe-Mails abzulehnen. Leer = keine Mail mit Grundlage B (Brief statt Mail)." }],
      ["feld_widerspruchshinweis_quelle", "Data", "Feld Quelle des Widerspruchshinweises (Auftrag)", { default: "ph_widerspruchshinweis_quelle", description: "z. B. Kaufvertrag, Auftragsbestätigung, Webshop-Kasse" }],
      ["sb_empfehlung", "Section Break", "Empfehlungsprogramm"],
      ["empfehlung_gutschein_wert", "Currency", "Gutscheinwert je erfolgreicher Empfehlung", { description: "Legt der Inhaber fest. Leer = Mail nennt keinen Betrag." }],
      ["empfehlung_ruecktritt_tage", "Int", "Rücktrittsfrist in Tagen bis zur Gutscheinausgabe", { default: "14" }],
      ["empfehlung_bedingungen_url", "Data", "Link Teilnahmebedingungen (nach Freigabe)"],
      ["sb_newsletter", "Section Break", "Newsletter / Double-Opt-in"],
      ["newsletter_email_group", "Link", "Email Group Newsletter", { options: "Email Group" }],
      ["einladungen_email_group", "Link", "Email Group Einladungen", { options: "Email Group" }],
      ["doi_gueltig_stunden", "Int", "DOI-Link gültig (Stunden)", { default: "48" }],
      ["einwilligung_textversion", "Data", "Aktuelle Textversion der Einwilligung", { default: "nl-2026-10-29" }],
    ],
  },
  {
    name: "PH Kundenreise",
    autoname: "field:reise_id",
    description: "Eine automatische Kundenreise (z. B. Pflegetipps nach zwei Wochen) mit Rechtsgrundlage",
    fields: [
      ["reise_id", "Data", "Kennung", { reqd: 1, unique: 1, in_list_view: 1 }],
      ["titel", "Data", "Titel", { reqd: 1, in_list_view: 1 }],
      ["aktiv", "Check", "Aktiv", { default: "0", in_list_view: 1 }],
      ["ziel", "Small Text", "Ziel"],
      ["vorlage", "Link", "Mail-Vorlage", { options: "PH Mail Vorlage", reqd: 1 }],
      ["absender", "Select", "Absender", SEL("berater", "gastgeberin")],
      ["cb_1", "Column Break", ""],
      ["werbung", "Check", "Werbung (B/E nötig, Abmeldelink)", { default: "0" }],
      ["grundlage_v", "Check", "Grundlage V: Vertrag/Service"],
      ["grundlage_b", "Check", "Grundlage B: Bestandskunde ohne Widerspruch"],
      ["grundlage_e", "Check", "Grundlage E: Einwilligung (DOI)"],
      ["zweck", "Select", "Zweck der Einwilligung (bei E)", SEL("", "newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung")],
      ["aehnliche_produkte", "Small Text", "Begründung eigene, ähnliche Produkte (bei B)"],
      ["b_nur_mit_kanzlei", "Check", "B erst nach Kanzlei-Bestätigung"],
      ["sb_ablauf", "Section Break", "Auslöser"],
      ["trigger", "Table", "Trigger", { options: "PH Reise Trigger" }],
      ["sb_regeln", "Section Break", "Regeln"],
      ["segment_outdoor", "Check", "Nur Aufträge mit Outdoor-Position (oder Einwilligung mit Interesse Outdoor)"],
      ["segment_pflege", "Check", "Nur Aufträge mit Pflegekategorie"],
      ["einmalig", "Check", "Höchstens einmal je Kontakt"],
      ["max_je_kontakt", "Int", "Höchstzahl je Kontakt (0 = ohne)"],
      ["stopp_regeln", "Small Text", "Stopp-Regeln (Doku)"],
      ["quelle", "Data", "Textquelle"],
      ["hinweis", "Small Text", "Hinweis"],
    ],
  },
  {
    name: "PH Reise Trigger",
    istable: 1,
    fields: [
      ["ausloeser_typ", "Select", "Auslöser", { ...SEL("datum", "jahrestag", "jaehrlich", "termin", "einwilligung"), reqd: 1, in_list_view: 1 }],
      ["feld", "Data", "Datumsfeld (Auftrag)", { in_list_view: 1, description: "z. B. lieferdatum = Feld laut Einstellungen" }],
      ["versatz_tage", "Int", "Versatz in Tagen", { in_list_view: 1 }],
      ["tag_monat", "Data", "Tag-Monat (MM-TT) bei jährlich", { in_list_view: 1 }],
      ["termin", "Link", "Termin", { options: "PH Termin" }],
      ["zwecke", "Data", "Einwilligungs-Zwecke (Komma) bei einwilligung"],
    ],
  },
  {
    name: "PH Mail Vorlage",
    autoname: "field:vorlage_id",
    description: "Jinja-Mailvorlage (generiert aus der Website, src/lib/kundenbetreuung)",
    fields: [
      ["vorlage_id", "Data", "Kennung", { reqd: 1, unique: 1, in_list_view: 1 }],
      ["betreff", "Data", "Betreff", { reqd: 1, in_list_view: 1 }],
      ["preheader", "Data", "Preheader"],
      ["sprache", "Select", "Sprache", SEL("de", "en")],
      ["fusszeile", "Select", "Fußzeile", SEL("V", "S", "A", "B", "je Empfänger")],
      ["rechtsgrundlage", "Small Text", "Rechtsgrundlage (Doku)"],
      ["quelle", "Data", "Textquelle"],
      ["stand", "Date", "Stand"],
      ["html", "Code", "HTML (Jinja)", { options: "HTML", reqd: 1 }],
    ],
  },
  {
    name: "PH Empfehlung",
    autoname: "field:code",
    description: "Empfehlungsprogramm „Unter Freunden“: ein Code je empfehlender Person",
    fields: [
      ["code", "Data", "Code", { unique: 1, read_only: 1, in_list_view: 1, description: "Wird beim Speichern erzeugt (EMP-XXXXXX)." }],
      ["status", "Select", "Status", { ...SEL("Code ausgegeben", "Anfrage eingegangen", "Auftrag erteilt", "Gutschein fällig", "Gutschein ausgegeben", "Verfallen", "Abgelehnt"), default: "Code ausgegeben", in_list_view: 1 }],
      ["empfehler_name", "Data", "Empfehlende Person", { reqd: 1, in_list_view: 1 }],
      ["empfehler_email", "Data", "E-Mail empfehlende Person", { options: "Email", reqd: 1 }],
      ["empfehler_auftrag", "Data", "Eigener Auftrag der empfehlenden Person (Nachweis Kundin/Kunde)", { reqd: 1 }],
      ["cb_1", "Column Break", ""],
      ["empfohlen_name", "Data", "Empfohlene Person"],
      ["empfohlen_email", "Data", "E-Mail empfohlene Person", { options: "Email" }],
      ["einwilligung_empfohlen", "Check", "Empfohlene Person hat in die Zuordnung eingewilligt", { read_only: 1 }],
      ["einwilligung_zeit", "Datetime", "Zeitpunkt der Einwilligung", { read_only: 1 }],
      ["anfrage_referenz", "Data", "Anfrage (Kontakt Form / Referenz)"],
      ["sb_auftrag", "Section Break", "Auftrag und Gutschein"],
      ["auftrag", "Data", "Erster Auftrag der empfohlenen Person"],
      ["auftrag_datum", "Date", "Auftragsdatum"],
      ["ruecktritt_ende", "Date", "Rücktrittsfrist endet", { read_only: 1 }],
      ["gutschein_code_letzte4", "Data", "Gutschein (letzte 4 Zeichen)"],
      ["gutschein_ausgegeben_am", "Date", "Gutschein ausgegeben am"],
      ["notiz", "Small Text", "Notiz"],
    ],
  },
  {
    name: "PH Einwilligung",
    autoname: "hash",
    description: "Einwilligungs-Protokoll je Zweck (Art. 7 Abs. 1 DSGVO)",
    fields: [
      ["email", "Data", "E-Mail", { options: "Email", reqd: 1, in_list_view: 1 }],
      ["zweck", "Select", "Zweck", { ...SEL("newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung"), reqd: 1, in_list_view: 1 }],
      ["textversion", "Data", "Textversion", { reqd: 1 }],
      ["quelle", "Data", "Quelle (Seite/Formular)"],
      ["interessen", "Small Text", "Interessen (Komma)"],
      ["zeitpunkt", "Datetime", "Zeitpunkt", { reqd: 1 }],
      ["ip_hash", "Data", "IP (Hash)"],
      ["doi_token_hash", "Data", "DOI-Token (SHA-256)", { read_only: 1 }],
      ["doi_bestaetigt_am", "Datetime", "DOI bestätigt am", { in_list_view: 1 }],
      ["widerrufen_am", "Datetime", "Widerrufen am", { in_list_view: 1 }],
      ["daten_json", "Code", "Zusatzdaten (z. B. gemerkte Stücke)", { options: "JSON" }],
    ],
  },
  {
    name: "PH Reise Versand",
    autoname: "hash",
    description: "Protokoll jeder geplanten und gesendeten Mail (verhindert Doppelversand)",
    fields: [
      ["schluessel", "Data", "Schlüssel", { unique: 1, read_only: 1 }],
      ["reise", "Link", "Kundenreise", { options: "PH Kundenreise", in_list_view: 1 }],
      ["empfaenger", "Data", "Empfänger", { options: "Email", in_list_view: 1 }],
      ["grundlage", "Select", "Grundlage", SEL("V", "B", "E")],
      ["werbung", "Check", "Werbung"],
      ["status", "Select", "Status", { ...SEL("geplant", "gesendet", "übersprungen", "fehler"), in_list_view: 1 }],
      ["grund", "Data", "Grund"],
      ["referenz_doctype", "Link", "Referenz-Doctype", { options: "DocType" }],
      ["referenz_name", "Dynamic Link", "Referenz", { options: "referenz_doctype" }],
      ["kontext_json", "Code", "Kontext", { options: "JSON" }],
      ["geplant_am", "Date", "Geplant für"],
      ["gesendet_am", "Datetime", "Gesendet am"],
    ],
  },
  {
    name: "PH Termin",
    autoname: "field:termin_id",
    description: "Termine für Einladungen (z. B. Adventsabend) – nur bestätigte Angaben",
    fields: [
      ["termin_id", "Data", "Kennung", { reqd: 1, unique: 1 }],
      ["titel", "Data", "Titel", { reqd: 1, in_list_view: 1 }],
      ["datum", "Date", "Datum", { reqd: 1, in_list_view: 1 }],
      ["uhrzeit", "Data", "Uhrzeit (z. B. 18:00 Uhr) – erst nach Bestätigung"],
      ["programm", "Small Text", "Programm – nur fest Zugesagtes"],
      ["url", "Data", "Anmeldeseite"],
    ],
  },
];

function doctypeJson(spec) {
  const fields = spec.fields.map(([fieldname, fieldtype, label, extra = {}]) => ({ fieldname, fieldtype, label, ...extra }));
  const perm = (role, extra = {}) => ({ role, read: 1, write: 1, create: 1, delete: 1, report: 1, export: 1, print: 1, email: 1, share: 1, ...extra });
  return {
    doctype: "DocType",
    name: spec.name,
    module: MODULE,
    custom: 0,
    engine: "InnoDB",
    track_changes: spec.istable ? 0 : 1,
    istable: spec.istable || 0,
    issingle: spec.issingle || 0,
    ...(spec.autoname ? { autoname: spec.autoname } : {}),
    ...(spec.description ? { description: spec.description } : {}),
    field_order: fields.map((f) => f.fieldname),
    fields,
    permissions: spec.istable ? [] : spec.issingle ? [perm("System Manager", { create: 1, delete: 0 })] : [perm("System Manager"), perm("Sales Manager", { delete: 0 })],
    sort_field: "modified",
    sort_order: "DESC",
    states: [],
    modified: `${STAND} 12:00:00.000000`,
    owner: "Administrator",
  };
}

// ── schreiben ───────────────────────────────────────────────────────────────
for (const spec of DOCTYPES) {
  const dir = path.join(MOD_DIR, "doctype", snake(spec.name));
  write(path.join(dir, `${snake(spec.name)}.json`), JSON.stringify(doctypeJson(spec), null, 1));
  if (!fs.existsSync(path.join(dir, "__init__.py"))) write(path.join(dir, "__init__.py"), "");
}

const vorlagen = [];
for (const r of REISEN) {
  const html = reiseMailHtml(r);
  write(path.join(APP, "templates", "emails", `reise_${r.id}.html`), html);
  vorlagen.push({
    doctype: "PH Mail Vorlage",
    vorlage_id: `reise_${r.id}`,
    betreff: r.vorlage.betreff,
    preheader: r.vorlage.preheader,
    sprache: "de",
    fusszeile: !r.werbung ? "V" : r.rechtsgrundlage.length > 1 ? "je Empfänger" : "A",
    rechtsgrundlage: `${r.rechtsgrundlage.join(" oder ")}${r.aehnlicheProdukte ? ` – ähnliche Produkte: ${r.aehnlicheProdukte}` : ""}${r.hinweis ? ` – ${r.hinweis}` : ""}`,
    quelle: r.quelle,
    stand: STAND,
    html,
  });
}
for (const m of SYSTEM_MAILS) {
  const html = systemMailHtml(m);
  write(path.join(APP, "templates", "emails", `${m.id}.html`), html);
  vorlagen.push({ doctype: "PH Mail Vorlage", vorlage_id: m.id, betreff: m.betreff, preheader: m.preheader, sprache: "de", fusszeile: "S", rechtsgrundlage: `V/S – ${m.zweck}`, quelle: "src/lib/kundenbetreuung/systemMails.js", stand: STAND, html });
}
write(path.join(APP, "fixtures", "ph_mail_vorlage.json"), JSON.stringify(vorlagen, null, 1));

const trig = (r) => {
  const a = r.ausloeser;
  if (a.typ === "einwilligung") return a.versatzTage.map((v) => ({ doctype: "PH Reise Trigger", ausloeser_typ: "einwilligung", versatz_tage: v, zwecke: a.zweck.join(",") }));
  if (a.typ === "jaehrlich") return [{ doctype: "PH Reise Trigger", ausloeser_typ: "jaehrlich", tag_monat: a.tag }];
  if (a.typ === "termin") return [{ doctype: "PH Reise Trigger", ausloeser_typ: "termin", termin: a.termin, versatz_tage: a.versatzTage }];
  if (a.typ === "jahrestag") return [{ doctype: "PH Reise Trigger", ausloeser_typ: "jahrestag", feld: a.feld }];
  return [{ doctype: "PH Reise Trigger", ausloeser_typ: "datum", feld: a.feld, versatz_tage: a.versatzTage }];
};
const reisen = REISEN.map((r) => ({
  doctype: "PH Kundenreise",
  reise_id: r.id,
  titel: r.name,
  aktiv: 0, // bewusst AUS: einschalten erst nach Freigaben (README, Abschn. „Vor dem Einschalten“)
  ziel: r.ziel,
  vorlage: `reise_${r.id}`,
  absender: r.absender,
  werbung: r.werbung ? 1 : 0,
  grundlage_v: r.rechtsgrundlage.includes("V") ? 1 : 0,
  grundlage_b: r.rechtsgrundlage.includes("B") ? 1 : 0,
  grundlage_e: r.rechtsgrundlage.includes("E") ? 1 : 0,
  zweck: r.zweck || "",
  aehnliche_produkte: r.aehnlicheProdukte || "",
  b_nur_mit_kanzlei: r.bKanzleiPruefen ? 1 : 0,
  segment_outdoor: r.segment?.mitOutdoor ? 1 : 0,
  segment_pflege: r.segment?.mitPflegekategorie ? 1 : 0,
  einmalig: r.einmalig || r.ausloeser.typ === "datum" ? 1 : 0,
  max_je_kontakt: r.id === "merkliste" ? 2 : 0,
  stopp_regeln: (r.stopp || []).join(", "),
  quelle: r.quelle,
  hinweis: [r.hinweis, r.voraussetzung].filter(Boolean).join(" "),
  trigger: trig(r),
}));
write(path.join(APP, "fixtures", "ph_kundenreise.json"), JSON.stringify(reisen, null, 1));
write(
  path.join(APP, "fixtures", "ph_termin.json"),
  JSON.stringify(
    [{ doctype: "PH Termin", termin_id: "adventsabend-2026", titel: "Adventsabend im Showroom", datum: "2026-11-26", uhrzeit: "", programm: "", url: "https://platzhirsch.studio/de/adventsabend" }],
    null,
    1
  )
);

write(
  path.join(MOD_DIR, "pflege.py"),
  `# GENERIERT aus src/lib/kundenbetreuung/reisen.js (PFLEGE_MODULE) – nicht von Hand ändern.
# Schlüssel = Feld ph_pflege_kategorie der Auftragsposition.
PFLEGE_MODULE = ${JSON.stringify(PFLEGE_MODULE, null, 4)}
`
);

const nlInfo = [];
for (const a of AUSGABEN) {
  write(path.join(APP, "templates", "newsletter", `post-aus-lochau-${a.slug}.html`), ausgabeMailHtml(a));
  nlInfo.push(`- ${a.slug} (Nr. ${a.nr}, Versand geplant ${a.versandGeplant}): versandbereit=${versandbereit(a)}; offene Slots: ${offeneSlots(a).join(", ") || "keine"}`);
}
write(
  path.join(APP, "templates", "newsletter", "STATUS.md"),
  `# Newsletter-Ausgaben (generiert ${STAND})\n\nQuelle: src/lib/kundenbetreuung/newsletter/ausgaben.js. Leere Slots erscheinen nicht im HTML.\nNach dem Befüllen der Slots: \`node src/lib/kundenbetreuung/generate-frappe.mjs\` erneut ausführen.\n\n${nlInfo.join("\n")}\n`
);

console.log(`Frappe-App aktualisiert: ${ROOT}`);
console.log(`  ${DOCTYPES.length} Doctypes, ${vorlagen.length} Mail-Vorlagen, ${reisen.length} Kundenreisen, ${AUSGABEN.length} Newsletter-Ausgaben`);
