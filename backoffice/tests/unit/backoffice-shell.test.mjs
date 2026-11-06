// Shell v2 (Team P0-7, G-15 · G-20 · G-26 · G-27): Hilfe-Lader, Glocke, Freigabe-Register, Navigation
// der Leiste/Reiter, Palette-Logik, Erstbesuch-Schlüssel, Kundenmodus-Grenzen (keine Hex-Farben, nur Token).
//   node --test tests/unit/backoffice-shell.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { artikelDatei, bereichFuerPfad, hilfeKandidaten, kuerzelFuerSeite, kuerzelKontexte, ladeHilfe, normalisierePfad, wasKannIch, zerlegeMarkdown } from "../../src/lib/backoffice/hilfe.js";
import { alsDatum, faelligText, gelesenFuer, glockeStand, gruppiereNachTag, ladeGlocke, markiereGelesen, tagGruppe, zaehlerSteigt } from "../../src/lib/backoffice/benachrichtigungen.js";
import { FREIGABE_BEREICHE, alleFreigabeArten, fuehreAblehnungAus, fuehreFreigabeAus, istEigenerAntrag, ladeFreigaben, pruefeFreigaben, pruefeGrund } from "../../src/lib/backoffice/freigaben/index.js";
import { aktiveNavigation, passung, teileReiter } from "../../src/components/Backoffice/Shell/navigation.js";
import { datensatzAusPfad, erstbesuchSchluessel, filtereGruppen, zerlegeEingabe } from "../../src/components/Backoffice/Shell/logik.js";
import { BEREICHE, navigationFuer } from "../../src/lib/backoffice/bereiche/index.js";
import { darf } from "../../src/lib/backoffice/auth/rechte.js";

const GF = { user: "gf@demo.local", roles: ["PH Geschäftsführung"] };
const SHOP = { user: "shop@demo.local", roles: ["PH Shop Mitarbeiter"] };
const CRM_LEITUNG = { user: "crm-leitung@demo.local", roles: ["PH CRM Leitung"] };
const CRM = { user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] };
const FAKTURA_LEITUNG = { user: "faktura-leitung@demo.local", roles: ["PH Faktura Leitung"] };

// ------------------------------------------------------------------ Hilfe --

test("Hilfe: Kandidaten je Route, spezifischster zuerst", () => {
  assert.deepEqual(hilfeKandidaten("/"), ["zentrale/start"]);
  assert.deepEqual(hilfeKandidaten("/crm"), ["crm/start"]);
  assert.deepEqual(hilfeKandidaten("/crm/anfragen?status=Neu"), ["crm/anfragen", "crm/start"]);
  assert.deepEqual(hilfeKandidaten("/crm/anfragen/A-1187"), ["crm/anfragen-akte", "crm/anfragen", "crm/start"]);
  assert.deepEqual(hilfeKandidaten("/d/ph-anfrage"), ["d/ph-anfrage", "allgemein/liste"]);
  assert.deepEqual(hilfeKandidaten("/d/ph-anfrage/PH-ANF-2026-00001"), ["d/ph-anfrage-akte", "d/ph-anfrage", "allgemein/formular"]);
  assert.deepEqual(hilfeKandidaten("/einstellungen"), ["zentrale/einstellungen", "zentrale/start"]);
  assert.equal(normalisierePfad("/crm/"), "/crm");
  assert.equal(bereichFuerPfad("/einstellungen"), "zentrale");
  assert.equal(bereichFuerPfad("/kassa/verwaltung"), "kassa");
});

test("Hilfe: Dateipfad bleibt im Hilfe-Ordner (kein ../, keine Sonderzeichen)", () => {
  const ordner = path.join("C:", "x", "hilfe");
  assert.equal(artikelDatei("crm/anfragen", ordner), path.join(ordner, "crm", "anfragen.md"));
  for (const boese of ["../geheim", "crm/../../x", "crm/a/b", "CRM/Start", "crm/an fragen", "", "crm/"]) assert.equal(artikelDatei(boese, ordner), null, boese);
});

test("Hilfe: Markdown → sichere Blöcke (Titel, Absatz, Liste, Fett; kein HTML, Links nur Text)", () => {
  const r = zerlegeMarkdown("---\nautor: q5\n---\n# Anfragen\n\nHier stehen **neue** Anfragen.\n<script>x</script> [Link](javascript:x)\n\n## Schritte\n- Filter wählen\n1. Zeile öffnen");
  assert.equal(r.titel, "Anfragen");
  assert.deepEqual(r.bloecke[0], { art: "p", text: [{ t: "Hier stehen " }, { t: "neue", fett: true }, { t: " Anfragen. x Link" }] });
  assert.deepEqual(r.bloecke[1], { art: "h", text: [{ t: "Schritte" }] });
  assert.deepEqual(r.bloecke[2], { art: "liste", eintraege: [[{ t: "Filter wählen" }], [{ t: "Zeile öffnen" }]] });
  assert.ok(!JSON.stringify(r).includes("<"), "kein HTML im Ergebnis");
});

test("Hilfe: ladeHilfe nimmt den ersten vorhandenen Kandidaten, sonst null", async () => {
  const ordner = path.join("C:", "h");
  const dateien = { [path.join(ordner, "crm", "start.md")]: "# CRM\n\nÜberblick." };
  const lesen = async (d) => {
    if (dateien[d]) return dateien[d];
    throw Object.assign(new Error("fehlt"), { code: "ENOENT" });
  };
  const a = await ladeHilfe("/crm/anfragen", { ordner, lesen });
  assert.equal(a.schluessel, "crm/start");
  assert.equal(a.titel, "CRM");
  assert.equal(a.href, "/hilfe/crm/start");
  assert.equal(await ladeHilfe("/shop", { ordner, lesen }), null);
});

test("Hilfe: „Was kann ich hier tun?“ nur mit Recht; Kürzel der Seite seitenspezifisch zuerst", () => {
  const crm = wasKannIch("/crm", (b, a) => darf(CRM, b, a));
  assert.equal(crm.bereich, "crm");
  assert.ok(crm.seiten.length > 0 && crm.seiten.every((s) => s.href !== "/crm"));
  assert.ok(crm.aktionen.some((a) => a.titel === "Neue Anfrage"));
  const shop = wasKannIch("/crm", (b, a) => darf(SHOP, b, a));
  assert.deepEqual([shop.seiten, shop.aktionen], [[], []]);
  assert.deepEqual(kuerzelKontexte("/d/ph-anfrage/X"), ["akte", "global"]);
  assert.deepEqual(kuerzelKontexte("/d/ph-anfrage"), ["liste", "global"]);
  const k = kuerzelFuerSeite("/d/ph-anfrage");
  assert.ok(k.length > 0 && k.length <= 12);
  assert.ok(k.findIndex((x) => x.titel === "Vorschau") < k.findIndex((x) => x.titel === "Befehlspalette öffnen"), "Liste vor global");
});

// ------------------------------------------------------------------ Glocke --

test("Glocke: Tagesgruppen (Wiener Kalendertag), Fälligkeit, Zähler-Pop nur bei Zunahme", () => {
  const jetzt = new Date("2026-11-04T10:00:00+01:00");
  assert.equal(tagGruppe("2026-11-04 08:41:00", jetzt), "heute");
  assert.equal(tagGruppe("2026-11-03 23:50:00", jetzt), "gestern");
  assert.equal(tagGruppe("2026-10-30", jetzt), "aelter");
  assert.equal(tagGruppe(null, jetzt), "aelter");
  const g = gruppiereNachTag([{ id: 1, zeit: "2026-10-01" }, { id: 2, zeit: "2026-11-04 09:00:00" }, { id: 3, zeit: "2026-11-03 12:00:00" }], jetzt);
  assert.deepEqual(g.map((x) => [x.schluessel, x.eintraege.map((e) => e.id)]), [["heute", [2]], ["gestern", [3]], ["aelter", [1]]]);
  assert.equal(faelligText("2026-11-04", jetzt), "fällig heute");
  assert.equal(faelligText("2026-11-02", jetzt), "überfällig seit 02.11.");
  assert.equal(faelligText("2026-11-06", jetzt), "fällig 06.11.");
  assert.equal(faelligText(null, jetzt), "ohne Fälligkeit");
  assert.equal(zaehlerSteigt(2, 3), true);
  assert.equal(zaehlerSteigt(3, 3), false);
  assert.equal(zaehlerSteigt(3, 1), false);
  assert.ok(alsDatum("2026-11-04") instanceof Date);
});

function attrappe({ modus = "mock", aufgaben = [], team = [], logs = [], fehler = false } = {}) {
  const aufrufe = [];
  return {
    modus,
    aufrufe,
    async getList(doctype, opts) {
      aufrufe.push([doctype, opts]);
      if (fehler) throw new Error("forbidden");
      if (doctype === "Notification Log") return logs;
      return opts.filters.some((f) => f[1] === "is") ? team : aufgaben;
    },
    async setValue(...a) {
      aufrufe.push(["setValue", ...a]);
    },
  };
}

test("Glocke: Quellen je Reiter, Lesezustand, Rechtefehler → leer statt Absturz", async () => {
  const jetzt = new Date("2026-11-04T10:00:00+01:00");
  const session = { user: `glocke-${Date.now()}@demo.local`, roles: ["PH CRM Mitarbeiter"] };
  const client = attrappe({
    aufgaben: [{ name: "PH-AUF-1", titel: "Rückruf", faellig: "2026-11-02", prioritaet: "Normal", modified: "2026-11-04 08:00:00" }],
    team: [{ name: "PH-AUF-2", titel: "Ohne Zuständigkeit", faellig: null, modified: "2026-11-01 08:00:00" }],
  });
  const freigaben = [{ id: "freigabe:faktura.x:1", titel: "Rechnung", zeit: "2026-11-04 09:00:00" }];
  const g = await ladeGlocke(client, session, { freigaben, jetzt });
  assert.deepEqual(g.tabs["fuer-mich"].map((e) => e.id), ["freigabe:faktura.x:1", "aufgabe:PH-AUF-1"]);
  assert.equal(g.tabs["fuer-mich"][1].dringend, true, "überfällig = dringend");
  assert.deepEqual(g.tabs.team.map((e) => e.id), ["aufgabe:PH-AUF-2"]);
  assert.deepEqual(g.tabs.system, [], "Mock kennt kein Notification Log");
  assert.ok(!client.aufrufe.some(([dt]) => dt === "Notification Log"));
  assert.equal(g.anzahl, 2);
  const stand1 = g.stand;
  const r = await markiereGelesen(client, session, ["aufgabe:PH-AUF-1", "unsinn", "log:N1"]);
  assert.equal(r.anzahl, 1, "Log nur in Frappe, ungültige IDs ignoriert");
  assert.ok(gelesenFuer(session.user).has("aufgabe:PH-AUF-1"));
  const g2 = await ladeGlocke(client, session, { freigaben, jetzt });
  assert.equal(g2.anzahl, 1);
  assert.notEqual(g2.stand, stand1);
  assert.equal(glockeStand(g2), g2.stand);
  const leer = await ladeGlocke(attrappe({ fehler: true }), session, { jetzt });
  assert.equal(leer.anzahl, 0);
});

test("Glocke: Frappe-Modus liest Notification Log (System getrennt) und setzt read über den Client", async () => {
  const session = { user: "u@x", roles: ["PH CRM Mitarbeiter"] };
  const client = attrappe({
    modus: "frappe",
    logs: [
      { name: "N1", subject: "<b>Lena</b> hat dich erwähnt", type: "Mention", document_type: "PH Anfrage", document_name: "PH-ANF-1", read: 0, creation: "2026-11-04 08:00:00" },
      { name: "N2", subject: "Kalkulation rot", type: "Alert", read: 1, creation: "2026-11-03 08:00:00" },
    ],
  });
  const g = await ladeGlocke(client, session);
  assert.equal(g.tabs["fuer-mich"][0].titel, "Lena hat dich erwähnt");
  assert.equal(g.tabs["fuer-mich"][0].href, "/d/ph-anfrage/PH-ANF-1");
  assert.deepEqual(g.tabs.system.map((e) => [e.id, e.gelesen]), [["log:N2", true]]);
  await markiereGelesen(client, session, ["log:N1"]);
  assert.deepEqual(client.aufrufe.at(-1), ["setValue", "Notification Log", "N1", "read", 1]);
});

// ------------------------------------------------------------------ Freigaben --

function register({ offen }) {
  const log = [];
  return {
    log,
    reg: {
      faktura: [
        {
          art: "faktura.eingangsrechnung",
          titel: "Eingangsrechnung",
          geldwirksam: true,
          laden: async () => offen,
          freigeben: async (_s, _c, a) => log.push(["frei", a]),
          ablehnen: async (_s, _c, a) => log.push(["ab", a]),
        },
      ],
    },
  };
}

test("Freigaben: Register leer und gültig; Prüfung meldet fehlerhafte Arten", () => {
  assert.deepEqual(pruefeFreigaben(), []);
  assert.deepEqual(alleFreigabeArten(FREIGABE_BEREICHE), []);
  const b = pruefeFreigaben({ crm: [{ art: "faktura.x", titel: "", laden: () => [] }, { art: "crm.y", titel: "Y", laden() {}, freigeben() {}, ablehnen() {}, geldwirksam: false }, { art: "crm.y", titel: "Y", laden() {}, freigeben() {}, ablehnen() {}, geldwirksam: false }] });
  assert.ok(b.some((x) => x.includes("Präfix")));
  assert.ok(b.some((x) => x.includes("titel fehlt")));
  assert.ok(b.some((x) => x.includes("freigeben() fehlt")));
  assert.ok(b.some((x) => x.includes("doppelt")));
});

test("Freigaben: Leitung sieht, Mitarbeiter nicht; eigener Antrag gesperrt; Token-Konflikt; Pflichtgrund", async () => {
  const L = FAKTURA_LEITUNG;
  const fremd = { name: "ER-1", titel: "Lieferant A", antragsteller: { user: "crm@demo.local", name: "Clara" }, betragCent: 128000, token: "t1", zeit: "2026-11-04 09:00:00" };
  const eigen = { ...fremd, name: "ER-2", antragsteller: { user: "faktura-leitung@demo.local", name: "Fritz" } };
  const { reg, log } = register({ offen: [fremd, eigen] });
  const liste = await ladeFreigaben(L, {}, { register: reg });
  assert.deepEqual(liste.map((e) => [e.id, e.eigen, e.geldwirksam, e.betragCent]), [["freigabe:faktura.eingangsrechnung:ER-1", false, true, 128000], ["freigabe:faktura.eingangsrechnung:ER-2", true, true, 128000]]);
  assert.deepEqual(await ladeFreigaben(CRM, {}, { register: reg }), [], "ohne Leitungsrecht keine Freigaben");
  assert.deepEqual(await ladeFreigaben(GF, {}, { register: reg }), [], "GF liest nur – freigeben darf die Leitung des Bereichs");
  assert.equal(istEigenerAntrag(eigen, L), true);
  assert.equal((await fuehreFreigabeAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-2" }, { register: reg })).code, "forbidden");
  assert.equal((await fuehreFreigabeAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-1", token: "alt" }, { register: reg })).code, "conflict");
  assert.equal((await fuehreFreigabeAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-9" }, { register: reg })).code, "conflict");
  assert.equal((await fuehreFreigabeAus(CRM_LEITUNG, {}, { art: "faktura.eingangsrechnung", name: "ER-1" }, { register: reg })).code, "forbidden");
  assert.deepEqual(await fuehreFreigabeAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-1", token: "t1" }, { register: reg }), { ok: true });
  assert.equal((await fuehreAblehnungAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-1", grund: "zu" }, { register: reg })).code, "invalid");
  assert.deepEqual(await fuehreAblehnungAus(L, {}, { art: "faktura.eingangsrechnung", name: "ER-1", grund: "  Preis weicht ab  " }, { register: reg }), { ok: true });
  assert.deepEqual(log, [["frei", { name: "ER-1", token: "t1" }], ["ab", { name: "ER-1", grund: "Preis weicht ab" }]]);
  assert.equal(pruefeGrund("a".repeat(501)) !== null, true);
  assert.equal(pruefeGrund("Passt nicht"), null);
});

// ------------------------------------------------------------------ Navigation (Leiste, Reiter) --

function sichtbar(session) {
  return BEREICHE.filter((b) => darf(session, b.slug, "read")).map((b) => ({ slug: b.slug, startseite: b.startseite, navigation: navigationFuer(b, { erlaubt: (r) => darf(session, r.bereich, r.aktion) }) }));
}

test("Navigation: aktiver Bereich und Unterbereich – längster Treffer gewinnt", () => {
  const b = sichtbar(GF);
  assert.deepEqual(aktiveNavigation(b, "/"), { bereich: "zentrale", eintrag: "/" });
  assert.equal(aktiveNavigation(b, "/d/ph-aufgabe").bereich, "zentrale");
  assert.equal(aktiveNavigation(b, "/d/ph-aufgabe/PH-AUF-1").eintrag, "/d/ph-aufgabe");
  assert.equal(aktiveNavigation(b, "/d/ph-anfrage/PH-ANF-2026-00001").bereich, "crm");
  assert.equal(aktiveNavigation(b, "/einstellungen").eintrag, "/einstellungen");
  assert.equal(aktiveNavigation(b, "/crm").bereich, "crm");
  assert.equal(aktiveNavigation(b, "/hilfe").bereich, "zentrale", "ohne Treffer Zentrale");
  assert.equal(passung("/", "/crm"), -1);
  assert.equal(passung("/crm", "/crmx"), -1);
  assert.equal(passung("/d/ph-aufgabe?ansicht=kanban", "/d/ph-aufgabe"), "/d/ph-aufgabe".length);
});

test("Reiter: höchstens 6 sichtbar, aktiver bleibt sichtbar, Rest unter „Mehr“", () => {
  const nav = Array.from({ length: 8 }, (_, i) => ({ titel: `R${i}`, href: `/r/${i}` }));
  const a = teileReiter(nav, "/r/1");
  assert.deepEqual([a.sichtbar.length, a.mehr.length], [5, 3]);
  const b = teileReiter(nav, "/r/7");
  assert.equal(b.sichtbar.at(-1).href, "/r/7");
  assert.ok(!b.mehr.some((n) => n.href === "/r/7"));
  assert.deepEqual(teileReiter(nav.slice(0, 4), null).mehr, []);
});

// ------------------------------------------------------------------ Palette, Erstbesuch --

test("Palette: Präfixe als Filter, Betrag erkannt, Datensatz-Kontext", () => {
  assert.deepEqual(zerlegeEingabe("> neu"), { praefix: ">", text: "neu", betrag: null });
  assert.deepEqual(zerlegeEingabe("#PH-ANF"), { praefix: "#", text: "PH-ANF", betrag: null });
  assert.equal(zerlegeEingabe("1.234,50").betrag, "1.234,50");
  assert.equal(zerlegeEingabe("12,5").betrag, "12,5");
  assert.equal(zerlegeEingabe("2026").betrag, null);
  const gruppen = [
    { titel: "Bereiche", eintraege: [{ titel: "Anfrage" }] },
    { titel: "Aktionen", eintraege: [{ titel: "Neue Anfrage" }] },
    { titel: "Datensätze", eintraege: [{ titel: "Stadler", hinweis: "Kontakt · PH-KON-1" }, { titel: "A-1", hinweis: "Anfrage · PH-ANF-1" }] },
  ];
  assert.deepEqual(filtereGruppen(gruppen, ">").map((g) => g.titel), ["Aktionen"]);
  assert.deepEqual(filtereGruppen(gruppen, "/").map((g) => g.titel), ["Bereiche"]);
  assert.deepEqual(filtereGruppen(gruppen, "@")[0].eintraege.map((e) => e.titel), ["Stadler"]);
  assert.equal(filtereGruppen(gruppen, null), gruppen);
  assert.deepEqual(datensatzAusPfad("/d/ph-anfrage/PH-ANF-2026-00001"), { slug: "ph-anfrage", name: "PH-ANF-2026-00001" });
  assert.equal(datensatzAusPfad("/d/ph-anfrage/neu"), null);
  assert.equal(datensatzAusPfad("/d/ph-anfrage"), null);
});

test("Erstbesuch: Schlüssel je Benutzer-Hash und Route (ohne Query, klein)", () => {
  assert.equal(erstbesuchSchluessel("abc123", "/CRM/Anfragen?status=Neu"), "ph-bo:abc123:erstbesuch:/crm/anfragen");
  assert.equal(erstbesuchSchluessel("", ""), "ph-bo:anonym:erstbesuch:/");
});

// ------------------------------------------------------------------ Gestaltung --

test("Shell-Dateien: keine Hex-Farben, nur Token; keine Versalien-Klassen; Lounge-Maße", () => {
  const ordner = path.join("src", "components", "Backoffice");
  const dateien = [
    ...readdirSync(path.join(ordner, "Shell")).map((f) => path.join(ordner, "Shell", f)),
    ...readdirSync(path.join(ordner, "Kundenmodus")).map((f) => path.join(ordner, "Kundenmodus", f)),
    path.join(ordner, "Erstbesuch.js"),
  ];
  for (const d of dateien) {
    const text = readFileSync(d, "utf8");
    assert.ok(!/(^|[^&\w#])#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})(?![\w-])/i.test(text.replace(/href="#[^"]*"|"#bo-inhalt"/g, "")), `Hex-Farbe in ${d}`);
    assert.ok(!/\buppercase\b/.test(text), `Versalien in ${d}`);
  }
  const css = readFileSync(path.join(ordner, "Shell", "shell.css"), "utf8");
  for (const m of ["--leiste-b: 72px", "--leiste-x: 16px", "border-radius: 36px", "height: 88px", "blur(32px) saturate(180%)", "var(--color-bo-action)"]) assert.ok(css.includes(m), m);
  assert.ok(!/\bborder:\s*1px solid/.test(css), "keine Rahmen als Gliederung");
});
