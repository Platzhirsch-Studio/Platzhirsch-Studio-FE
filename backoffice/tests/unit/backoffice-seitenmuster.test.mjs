// Seitenmuster v2 (Team P0-5b, MASTER G-09 · G-10 · G-11 · G-13 · G-29): Unternav, Zwei-Klick-Knopf,
// Autosave, Zu-tun-Register, Berichtslogik, Listen-Aufbau, Gestaltungsregeln der eigenen Dateien.
//   node --test tests/unit/backoffice-seitenmuster.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { UNTERNAV_MAX, ZWEI_KLICK_MS, aktiverEintrag, teileUnternav, zweiKlick } from "../../src/components/Backoffice/ZuTun/logik.js";
import { ZUTUN, BEREICH_START, SEITE } from "../../src/components/Backoffice/ZuTun/texte.js";
import { autosaveSchritt, deuteErgebnis, speicherAnzeige, uhrzeit } from "../../src/components/Backoffice/Formular/autosave.js";
import { ZUTUN_BEREICHE, alleQuellen, generischeQuellen, heuteIso, mitZeitlimit, pruefeQuelle, pruefeQuellen, sichtbareQuellen, zaehleQuelle, zeileAus } from "../../src/lib/backoffice/aufgaben/index.js";
import { berichtCsv, berichtDateiname, ladeBericht, summen, summierbar } from "../../src/components/Backoffice/Bericht/logik.js";
import { hatFilter, istPersonSpalte, personName, zeilenAufbau } from "../../src/components/Backoffice/DataTable/logik.js";
import { DEMOS, demoFuer } from "../../src/lib/backoffice/demo-register.js";

const CRM = { user: "crm@demo.local", roles: ["PH CRM Mitarbeiter"] };
const SHOP = { user: "shop@demo.local", roles: ["PH Shop Mitarbeiter"] };

test("Unternav: höchstens 7 sichtbar, aktiver bleibt sichtbar, Rest unter „Mehr“, ohne Recht entfällt", () => {
  const e = Array.from({ length: 10 }, (_, i) => ({ titel: `R${i}`, href: `/x/${i}` }));
  const { sichtbar, mehr } = teileUnternav(e, "/x/0");
  assert.equal(UNTERNAV_MAX, 7);
  assert.equal(sichtbar.length, 6);
  assert.equal(mehr.length, 4);
  const t2 = teileUnternav(e, "/x/9");
  assert.ok(t2.sichtbar.some((x) => x.href === "/x/9"));
  assert.equal(t2.sichtbar.length + t2.mehr.length, 10);
  assert.equal(teileUnternav([...e.slice(0, 3), { titel: "Geheim", href: "/g", recht: false }], "/x/0").sichtbar.length, 3);
  assert.equal(teileUnternav(e.slice(0, 7), "/x/6").mehr.length, 0);
});

test("Unternav: aktiver Eintrag – exakt vor längstem Präfix, Query wird ignoriert", () => {
  const e = [{ href: "/crm" }, { href: "/crm/anfragen" }, { href: "/crm/anfragen/kanban" }, { href: "/akte?r=planung" }];
  assert.equal(aktiverEintrag(e, "/crm/anfragen"), "/crm/anfragen");
  assert.equal(aktiverEintrag(e, "/crm/anfragen/PH-ANF-1"), "/crm/anfragen");
  assert.equal(aktiverEintrag(e, "/akte"), "/akte?r=planung");
  assert.equal(aktiverEintrag(e, "/faktura"), null);
});

test("Zwei-Klick: erster Klick scharf, zweiter innerhalb 3 s führt aus, danach/Abbruch zurück", () => {
  assert.equal(ZWEI_KLICK_MS, 3000);
  let r = zweiKlick(null, "klick", 1000);
  assert.deepEqual([r.zustand.scharf, r.ausfuehren], [true, false]);
  r = zweiKlick(r.zustand, "klick", 3999);
  assert.deepEqual([r.zustand.scharf, r.ausfuehren], [false, true]);
  r = zweiKlick({ scharf: true, seit: 0 }, "klick", 3001);
  assert.equal(r.ausfuehren, false, "zu spät: erneut scharf statt ausführen");
  assert.equal(r.zustand.scharf, true);
  assert.equal(zweiKlick({ scharf: true, seit: 0 }, "abbruch", 10).zustand.scharf, false);
  assert.equal(zweiKlick({ scharf: true, seit: 0 }, "ablauf", 10).ausfuehren, false);
  assert.equal(SEITE.wirklich("entfernen"), "Wirklich entfernen?");
});

test("Autosave: Zustandsfolge gespeichert → nicht gespeichert → speichert → gespeichert; Änderung während Speichern bleibt offen", () => {
  let z = autosaveSchritt(undefined, { typ: "aendern" });
  assert.equal(z.status, "nicht-gespeichert");
  z = autosaveSchritt(z, { typ: "start" });
  assert.equal(z.status, "speichert");
  const waehrend = autosaveSchritt(z, { typ: "aendern" });
  assert.equal(waehrend.status, "speichert");
  assert.equal(autosaveSchritt(waehrend, { typ: "ok", zeit: "14:05" }).status, "nicht-gespeichert");
  z = autosaveSchritt(z, { typ: "ok", zeit: "14:05" });
  assert.deepEqual([z.status, z.zeit], ["gespeichert", "14:05"]);
  assert.equal(speicherAnzeige(z).text, "Gespeichert 14:05");
  const f = autosaveSchritt(z, { typ: "fehler", fehler: "Konflikt" });
  assert.equal(f.status, "fehler");
  assert.equal(speicherAnzeige(f).ton, "fehler");
  assert.match(speicherAnzeige(f).text, /^Nicht gespeichert – Konflikt$/);
  assert.equal(speicherAnzeige({ status: "nicht-gespeichert" }).ton, "warnung");
  assert.equal(autosaveSchritt(f, { typ: "verwerfen" }).status, "gespeichert");
});

test("Autosave: Ergebnis deuten (Q-A2) und Uhrzeit HH:MM (Wien)", () => {
  assert.deepEqual(deuteErgebnis(undefined), { ok: true });
  assert.deepEqual(deuteErgebnis({ ok: true, name: "X" }), { ok: true });
  assert.deepEqual(deuteErgebnis({ ok: false, message: "Konflikt" }), { ok: false, fehler: "Konflikt" });
  assert.equal(deuteErgebnis(false).ok, false);
  assert.equal(uhrzeit(new Date("2026-11-04T13:05:00Z")), "14:05");
  assert.equal(uhrzeit("kein Datum"), "");
});

const quelle = (p = {}) => ({ id: "crm.test", bereich: "crm", icon: "Inbox", satz: (n) => `${n} Anfragen warten`, zaehle: async () => 3, knopf: { titel: "Ansehen", href: "/crm/anfragen" }, ...p });

test("Zu tun: Register leer und gültig; Prüfung meldet fehlerhafte Quellen", () => {
  assert.deepEqual(pruefeQuellen(ZUTUN_BEREICHE), []);
  assert.deepEqual(pruefeQuelle(quelle()), []);
  assert.ok(pruefeQuelle(quelle({ id: "Falsch" })).some((b) => b.includes("ID ungültig")));
  assert.ok(pruefeQuelle(quelle({ id: "faktura.x" })).some((b) => b.includes("Präfix")));
  assert.ok(pruefeQuelle(quelle({ knopf: { titel: "A" } })).some((b) => b.includes("href oder action")));
  assert.ok(pruefeQuelle(quelle({ knopf: { titel: "A", href: "/x", action: () => {} } })).some((b) => b.includes("genau eins")));
  assert.ok(pruefeQuelle(quelle({ satz: "kein Satz" })).some((b) => b.includes("satz(n)")));
  assert.ok(pruefeQuellen({ crm: [quelle(), quelle()] }).some((b) => b.includes("doppelt")));
  assert.deepEqual(alleQuellen({ crm: [quelle({ id: "crm.b", rang: 5 }), quelle({ id: "crm.a", rang: 1 })] }).map((q) => q.id), ["crm.a", "crm.b"]);
});

test("Zu tun: Rechte je Bereich und Sicht-Filter", () => {
  const q = [quelle(), quelle({ id: "crm.mir", sichten: ["mir"] }), quelle({ id: "fundament.x", bereich: "fundament" })];
  assert.equal(sichtbareQuellen(q, { session: CRM }).length, 3);
  assert.deepEqual(sichtbareQuellen(q, { session: SHOP }).map((x) => x.id), ["fundament.x"]);
  assert.deepEqual(sichtbareQuellen(q, { session: CRM, sicht: "team" }).map((x) => x.id), ["crm.test", "fundament.x"]);
});

test("Zu tun: Zählen nie werfend – ok, Fehler, ungültig, Zeitlimit; Zeile serialisierbar", async () => {
  assert.deepEqual(await zaehleQuelle(quelle(), {}), { status: "ok", n: 3 });
  assert.equal((await zaehleQuelle(quelle({ zaehle: async () => { throw new Error("weg"); } }), {})).status, "fehler");
  assert.equal((await zaehleQuelle(quelle({ zaehle: () => { throw new Error("sofort"); } }), {})).status, "fehler");
  assert.equal((await zaehleQuelle(quelle({ zaehle: async () => -1 }), {})).status, "fehler");
  assert.equal((await zaehleQuelle(quelle({ zaehle: () => new Promise((r) => setTimeout(() => r(1), 200)) }), {}, { zeitlimitMs: 20 })).status, "zeitlimit");
  assert.deepEqual(await mitZeitlimit(Promise.resolve(5), 50), { status: "ok", wert: 5 });
  const z = zeileAus(quelle({ unter: (n) => `seit ${n} Tagen`, knopf: { titel: "Öffnen", href: ({ session }) => `/x?u=${session.user}` } }), 4, { session: CRM });
  assert.deepEqual(z, { id: "crm.test", icon: "Inbox", ton: "stein", satz: "4 Anfragen warten", unter: "seit 4 Tagen", n: 4, knopf: { titel: "Öffnen", href: "/x?u=crm@demo.local", action: null } });
  assert.doesNotThrow(() => JSON.stringify(z));
});

test("Zu tun: generische Quellen aus echten Daten (Aufgaben fällig, erster Ablaufschritt)", async () => {
  const aufrufe = [];
  const client = { count: async (dt, opt) => (aufrufe.push([dt, opt]), dt === "PH Aufgabe" ? 2 : 5) };
  const b = { slug: "crm", doctypes: ["PH Anfrage", "PH Aufgabe"] };
  const listen = [
    { dt: "PH Anfrage", meta: { slug: "ph-anfrage", statusOptionen: ["Neu", "Qualifiziert", "Abgeschlossen"] }, label: "Anfrage", href: "/d/ph-anfrage" },
    { dt: "PH Kontakt", meta: { slug: "ph-kontakt", statusOptionen: [] }, label: "Kontakt", href: "/d/ph-kontakt" },
  ];
  const q = generischeQuellen(b, listen, { texte: ZUTUN, aufgaben: true });
  assert.deepEqual(q.map((x) => x.id), ["fundament.aufgaben-crm", "fundament.crm-ph-anfrage"]);
  for (const x of q) assert.deepEqual(pruefeQuelle(x), []);
  const n = await zaehleQuelle(q[0], { session: CRM, client });
  assert.equal(n.n, 2);
  const f = aufrufe[0][1].filters;
  assert.deepEqual(f[0], ["zugewiesen_an", "=", "crm@demo.local"]);
  assert.deepEqual(f[2], ["faellig", "<=", heuteIso()]);
  assert.deepEqual(f[3], ["referenz_doctype", "in", ["PH Anfrage"]]);
  assert.equal(zeileAus(q[1], 5).satz, "Anfrage: 5 Einträge im Status „Neu“");
  assert.equal(zeileAus(q[1], 5).knopf.href, "/d/ph-anfrage?status=Neu");
  assert.equal(generischeQuellen(b, listen, { texte: ZUTUN }).length, 1, "ohne Leserecht auf Aufgaben keine Aufgaben-Zeile");
  assert.match(heuteIso(new Date("2026-11-04T23:30:00Z")), /^2026-11-05$/, "Wiener Datum");
});

test("Bericht: Summen nur für Beträge/Zahlen, CSV mit Summenzeile, Dateiname, Zeitlimit", async () => {
  const sp = [
    { fieldname: "monat", label: "Monat", fieldtype: "Data" },
    { fieldname: "n", label: "Anfragen", fieldtype: "Int" },
    { fieldname: "quote", label: "Quote", fieldtype: "Percent" },
    { fieldname: "u", label: "Umsatz", fieldtype: "Int", cent: true },
    { fieldname: "jahr", label: "Jahr", fieldtype: "Int", summe: false },
  ];
  const z = [{ monat: "Okt", n: 3, quote: 50, u: 123450, jahr: 2026 }, { monat: "Nov", n: 2, quote: 25, u: 50, jahr: 2026 }, { monat: "Dez", n: "", u: null, jahr: 2026 }];
  assert.deepEqual(summen(sp, z), { n: 5, u: 123500 });
  assert.equal(summierbar(sp[2]), false);
  const csv = berichtCsv(sp, z);
  const zeilen = csv.trim().split("\r\n");
  assert.equal(zeilen.length, 5);
  assert.equal(zeilen.at(-1), "Summe;5;;1235,00;");
  assert.equal(berichtDateiname("Anfragen je Monat", { von: "2026-06-01", bis: "2026-10-31" }), "anfragen-je-monat-2026-06-01-2026-10-31.csv");
  assert.equal(berichtDateiname("Übersicht Größe"), "uebersicht-groesse.csv");
  assert.deepEqual(await ladeBericht(async () => [{ a: 1 }]), { status: "ok", zeilen: [{ a: 1 }] });
  assert.equal((await ladeBericht(() => new Promise((r) => setTimeout(() => r([]), 100)), { zeitlimitMs: 10 })).status, "zeitlimit");
  const fehler = await ladeBericht(async () => {
    throw Object.assign(new Error("x"), { code: "forbidden" });
  });
  assert.deepEqual(fehler, { status: "fehler", code: "forbidden" });
});

test("Liste: Kopfzelle aus Nr. + Titel, Personen-Spalten mit Avatar, Filter erkannt", () => {
  const sp = [
    { fieldname: "name", label: "Nr.", fieldtype: "Data" },
    { fieldname: "nachname", label: "Nachname", fieldtype: "Data" },
    { fieldname: "eingang", label: "Eingang", fieldtype: "Datetime" },
    { fieldname: "zugewiesen_an", label: "Zuständig", fieldtype: "Link", options: "User" },
    { fieldname: "status", label: "Status", fieldtype: "Select" },
  ];
  const a = zeilenAufbau(sp);
  assert.equal(a.titel.fieldname, "nachname");
  assert.equal(a.nr.fieldname, "name");
  assert.deepEqual(a.spalten.map((s) => s.fieldname), ["eingang", "zugewiesen_an", "status"]);
  assert.equal(zeilenAufbau(sp, { zusammenfassen: false }).titel, null);
  assert.equal(zeilenAufbau(sp.slice(1)).titel, null, "ohne Nr. vorne bleibt die Tabelle unverändert");
  assert.equal(zeilenAufbau(sp, { titelFeld: "eingang" }).titel.fieldname, "eingang");
  assert.equal(istPersonSpalte(sp[3]), true);
  assert.equal(istPersonSpalte({ fieldname: "berater", fieldtype: "Data" }), true);
  assert.equal(istPersonSpalte({ fieldname: "kunde", fieldtype: "Link", options: "PH Kontakt" }), false);
  assert.equal(personName("lena.moser@beispiel.invalid"), "Lena Moser");
  assert.equal(personName("Sarah Bösch"), "Sarah Bösch");
  assert.equal(hatFilter({ status: "Neu" }), true);
  assert.equal(hatFilter({ seite: "2", sort: "x" }), false);
  assert.equal(hatFilter({ f_zugewiesen_an: "ich" }), true);
});

test("Demo „seitenmuster“ ist registriert (nur Admin, nur Mock)", () => {
  assert.equal(DEMOS.seitenmuster.team, "P0-5b");
  assert.equal(demoFuer("seitenmuster", { admin: true, modus: "mock" })?.name, "seitenmuster");
  assert.equal(demoFuer("seitenmuster", { admin: false, modus: "mock" }), null);
  assert.equal(demoFuer("seitenmuster", { admin: true, modus: "frappe" }), null);
});

// ---------------------------------------------------------------- Gestaltungsregeln der eigenen Dateien
const WURZEL = path.resolve(import.meta.dirname, "../../src");
const EIGENE = [
  "components/Backoffice/Seitenkopf.js",
  "components/Backoffice/BereichStart.js",
  "components/Backoffice/Unternav.js",
  "components/Backoffice/ZweiKlickKnopf.js",
  "components/Backoffice/ZuTun",
  "components/Backoffice/Bericht",
  "components/Backoffice/Formular",
  "components/Backoffice/DataTable",
  "components/Backoffice/Kanban",
  "components/Backoffice/Demo/seitenmuster.js",
  "components/Backoffice/Demo/seitenmuster-teile.js",
  "lib/backoffice/aufgaben",
];
function dateien() {
  const out = [];
  for (const e of EIGENE) {
    const p = path.join(WURZEL, e);
    if (statSync(p).isDirectory()) for (const f of readdirSync(p)) out.push(path.join(p, f));
    else out.push(p);
  }
  return out.filter((f) => /\.(js|css)$/.test(f));
}

test("Eigene Dateien: keine Hex-Farben, keine Versalien, keine alten Rahmen-Muster", () => {
  for (const f of dateien()) {
    // Erlaubt ist nur der Wert eines <input type="color"> (wie die ESLint-Regel keine-hex-farbe).
    const s = readFileSync(f, "utf8").split(/\r?\n/).filter((z) => !z.includes('type="color"')).join(" ");
    const name = path.relative(WURZEL, f);
    assert.doesNotMatch(s, /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/i, `${name}: Hex-Farbe`);
    assert.doesNotMatch(s, /\buppercase\b|text-transform:\s*uppercase/, `${name}: Versalien`);
    assert.doesNotMatch(s, /rounded-\[10px\]\s+border|border border-bo-line/, `${name}: altes Kasten-Muster`);
  }
});

test("Eigene Dateien: alle bo-Farbklassen sind als Token definiert", () => {
  const globals = readFileSync(path.join(WURZEL, "app/globals.css"), "utf8");
  const token = new Set([...globals.matchAll(/--color-(bo-[a-z0-9-]+):/g)].map((m) => m[1]));
  for (const f of dateien().filter((x) => x.endsWith(".js"))) {
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(/\b(?:bg|text|from|to|border|decoration)-(bo-[a-z0-9-]+)(?:\/\d+)?!?/g)) {
      const t = m[1];
      if (["bo-hair"].includes(t)) continue;
      assert.ok(token.has(t), `${path.relative(WURZEL, f)}: unbekannter Token ${t}`);
    }
    for (const m of s.matchAll(/var\(--color-(bo-[a-z0-9-]+)\)/g)) assert.ok(token.has(m[1]), `${path.relative(WURZEL, f)}: unbekannter Token ${m[1]}`);
  }
  for (const f of dateien().filter((x) => x.endsWith(".css"))) {
    for (const m of readFileSync(f, "utf8").matchAll(/var\(--color-(bo-[a-z0-9-]+)/g)) assert.ok(token.has(m[1]), `${path.relative(WURZEL, f)}: unbekannter Token ${m[1]}`);
  }
});

test("Texte: keine Ausrufezeichen, keine Superlative, Umlaute statt Umschreibung", () => {
  const alle = JSON.stringify([ZUTUN.titel, ZUTUN.leerTitel, ZUTUN.leerText, ZUTUN.fehler, BEREICH_START, SEITE.mehr]);
  for (const f of dateien().filter((x) => /texte\.js$/.test(x))) {
    const s = readFileSync(f, "utf8");
    const literale = [...s.matchAll(/"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2]).join(" ");
    assert.doesNotMatch(literale, /!/, `${path.relative(WURZEL, f)}: Ausrufezeichen`);
    assert.doesNotMatch(literale, /\b(beste|optimal|perfekt|super|erfolgreich|einzigartig)\w*/i, `${path.relative(WURZEL, f)}: Floskel/Superlativ`);
    assert.doesNotMatch(literale, /\b(Aenderung\w*|Loeschen|Zurueck|fuer|ueber|Eintraege|Schluessel|moeglich|gewaehlt)\b/,`${path.relative(WURZEL, f)}: Umschreibung statt Umlaut`);
  }
  assert.ok(alle.length > 0);
});
