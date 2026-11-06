// Unit-Tests Team P0-5c: Druck-Register und -Warteschlange (G-17), Kunden informieren (G-18),
// Leitung bitten (G-05), An der Kassa (G-19).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  DRUCKFORMATE,
  formateFuer,
  formatTitel,
  papierFuer,
  waehleFormat,
  druckHref,
  pdfHref,
  vorschauMassstab,
  neuerAuftrag,
  auftragWeiter,
  sammelAuftraege,
  gruppenStand,
  raeumeAuf,
  KIOSK_DRUCK,
  formatSchluessel,
} from "../../src/lib/backoffice/druck/index.js";
import {
  fuelleVorlage,
  kanaeleFuer,
  startKanal,
  normKanal,
  textZuHtml,
  pruefeInformieren,
  pruefeObjekt,
  leitungSchluessel,
  leitungsRolle,
  zeitKurz,
  istEmail,
  kassaHref,
  KASSA_VARIANTEN,
} from "../../src/components/Backoffice/Informieren/logik.js";
import { INFORMIEREN_TEXTE, LEITUNG_TEXTE, KASSA_TEXTE } from "../../src/components/Backoffice/Informieren/texte.js";
import { DRUCK_TEXTE } from "../../src/components/Backoffice/Druck/texte.js";
import { erlaubteArbeitsplaetze } from "../../src/lib/backoffice/auth/rechte.js";
import { BEREICHE } from "../../src/lib/backoffice/bereiche/index.js";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const BO = path.resolve(HIER, "../..");
const BACKEND = path.resolve(BO, "../Backend-Import");

function druckformateAusBackend() {
  const map = {};
  const lauf = (d) => {
    for (const e of readdirSync(d)) {
      if (e === "node_modules" || e === "__pycache__" || e === "referenz" || e.startsWith(".")) continue;
      const p = path.join(d, e);
      if (statSync(p).isDirectory()) lauf(p);
      else if (e.endsWith(".json")) {
        const n = p.split(path.sep).join("/");
        if (n.endsWith("fixtures/print_format.json")) for (const f of JSON.parse(readFileSync(p, "utf8"))) (map[f.doc_type] ||= []).push(f.name);
        else if (/\/print_format\/[^/]+\/[^/]+\.json$/.test(n)) {
          const f = JSON.parse(readFileSync(p, "utf8"));
          if (f.doctype === "Print Format") (map[f.doc_type] ||= []).push(f.name);
        }
      }
    }
  };
  lauf(BACKEND);
  return map;
}

// ------------------------------------------------------------------ Druck --

test("Druck-Register entspricht exakt den Druckformaten in Backend-Import (nichts erfunden, nichts vergessen)", () => {
  const backend = druckformateAusBackend();
  assert.ok(Object.keys(backend).length > 40, "Backend-Import nicht gefunden");
  const sortiert = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, [...v].sort()]).sort(([a], [b]) => a.localeCompare(b)));
  assert.deepEqual(sortiert(DRUCKFORMATE), sortiert(backend));
});

test("Formattitel ohne PH und DocType, mit Umlauten; Papierart erkannt", () => {
  assert.equal(formatTitel("PH Lieferschein Packliste", "PH Lieferschein"), "Packliste");
  assert.equal(formatTitel("PH Rechnung Standard", "PH Rechnung"), "Standard");
  assert.equal(formatTitel("PH Produktpass", "PH Produktpass"), "Standard");
  assert.equal(formatTitel("PH Inventur Zaehlliste", "PH Inventur"), "Zählliste");
  assert.equal(formatTitel("PH Kontoauszug Kunde", "PH Kontakt"), "Kontoauszug Kunde");
  assert.equal(formatTitel("PH Kundenkarte Begruessung", "PH Kundenkarte"), "Begrüßung");
  assert.equal(papierFuer("PH Kassenbeleg Bon 80mm"), "bon");
  assert.equal(papierFuer("PH Lagerort Platz-Etikett"), "etikett");
  assert.equal(papierFuer("PH Event Namensschilder"), "etikett");
  assert.equal(papierFuer("PH Rechnung Standard"), "a4");
  for (const [dt, namen] of Object.entries(DRUCKFORMATE)) {
    for (const n of namen) assert.doesNotMatch(formatTitel(n, dt), /^PH |ae|oe|Ue\b/, `${n}: Titel ${formatTitel(n, dt)}`);
  }
});

test("Formate je DocType: erstes ist Standard, Zusatz ohne Dubletten, unbekannt → Standard", () => {
  const f = formateFuer("PH Rechnung", ["PH Rechnung Standard", "PH Rechnung Kopie"]);
  assert.deepEqual(f.map((x) => x.name), ["PH Rechnung Standard", "PH Rechnung Anzahlung", "PH Rechnung Kopie"]);
  assert.equal(f[0].standard, true);
  assert.equal(f[1].standard, false);
  assert.deepEqual(formateFuer("PH Unbekannt"), [{ name: "Standard", titel: "Standard", papier: "a4", standard: true }]);
  assert.equal(waehleFormat(f, "PH Rechnung Anzahlung"), "PH Rechnung Anzahlung");
  assert.equal(waehleFormat(f, "Gibt es nicht"), "PH Rechnung Standard");
  assert.equal(formatSchluessel("PH Rechnung"), "ph-bo:druckformat:ph-rechnung");
});

test("Druck-Links: HTML-Ansicht und PDF über die vorhandenen Routen, Format kodiert", () => {
  assert.equal(druckHref("PH Rechnung", "RE-2026-00042", "PH Rechnung Anzahlung"), "/druck/ph-rechnung/RE-2026-00042?format=PH%20Rechnung%20Anzahlung");
  assert.equal(druckHref("PH Rechnung", "RE-2026-00042", "Standard"), "/druck/ph-rechnung/RE-2026-00042");
  assert.equal(pdfHref("PH Lieferschein", "LS 1/2", "PH Lieferschein Packliste"), "/druck/ph-lieferschein/LS%201%2F2/pdf?format=PH%20Lieferschein%20Packliste");
  assert.equal(druckHref("PH Beratungsgespraech", "BG-1"), "/druck/ph-beratungsgespraech/BG-1");
});

test("Vorschau-Maßstab: Breite füllt (max. 1,5), 100 % fest, Seite passt ganz hinein", () => {
  assert.equal(vorschauMassstab("100", { breite: 300, hoehe: 300 }), 1);
  assert.equal(vorschauMassstab("breite", { breite: 397, hoehe: 100 }), 0.5);
  assert.equal(vorschauMassstab("breite", { breite: 5000, hoehe: 100 }), 1.5);
  const s = vorschauMassstab("seite", { breite: 794, hoehe: 561.5 });
  assert.ok(Math.abs(s - 0.5) < 1e-9);
  assert.ok(vorschauMassstab("seite", { breite: 2000, hoehe: 2000 }) <= 1);
  assert.ok(vorschauMassstab("breite", { breite: 302, hoehe: 1 }, "bon") === 1);
});

test("Warteschlange: Auftrag, erlaubte Übergänge, Sammeldruck-Fortschritt, Aufräumen", () => {
  const jetzt = Date.UTC(2026, 10, 4, 9, 0);
  assert.throws(() => neuerAuftrag({ format: "x" }), TypeError);
  const a = neuerAuftrag({ doctype: "PH Rechnung", name: "RE-1", format: "PH Kassenbeleg Bon 80mm", kopien: 99 }, jetzt);
  assert.equal(a.zustand, "wartet");
  assert.equal(a.papier, "bon");
  assert.equal(a.kopien, 20);
  assert.equal(auftragWeiter(a, "gedruckt"), a, "wartet → gedruckt ist nicht erlaubt");
  const b = auftragWeiter(a, "druckt", { jetzt: jetzt + 1 });
  const c = auftragWeiter(b, "fehler", { fehler: "offline", jetzt: jetzt + 2 });
  assert.equal(c.zustand, "fehler");
  assert.equal(c.fehler, "offline");
  assert.equal(auftragWeiter(c, "wartet").fehler, null);
  const g = sammelAuftraege([{ doctype: "PH Lieferschein", name: "LS-1" }], ["PH Lieferschein Standard", "PH Lieferschein Packliste"], jetzt);
  assert.equal(g.length, 2);
  assert.equal(new Set(g.map((x) => x.id)).size, 2);
  const fertig = [auftragWeiter(auftragWeiter(g[0], "druckt"), "gedruckt"), g[1]];
  assert.deepEqual(gruppenStand(fertig, g[0].gruppe), { fertig: 1, gesamt: 2, fehler: 0 });
  const alt = { ...auftragWeiter(auftragWeiter(a, "druckt"), "gedruckt"), geaendert: jetzt - 8 * 86_400_000 };
  assert.deepEqual(raeumeAuf([alt, c], { jetzt }).map((x) => x.id), [c.id]);
});

test("Kiosk-Druckmenü: Lieferschein, Packliste, Etikett, Bon mit echten Formaten", () => {
  assert.deepEqual(KIOSK_DRUCK.map((k) => k.id), ["lieferschein", "packliste", "etikett", "bon"]);
  for (const k of KIOSK_DRUCK) if (k.format) assert.ok(DRUCKFORMATE[k.doctype]?.includes(k.format), k.format);
});

// ------------------------------------------------------------------ Informieren --

test("Vorlage füllen: Werte ersetzt, fehlende bleiben sichtbar und werden gemeldet", () => {
  const r = fuelleVorlage("Guten Tag {kunde}, neu: {termin} ({ort})", { kunde: "Familie Stadler", termin: "KW 48", ort: "" });
  assert.equal(r.text, "Guten Tag Familie Stadler, neu: KW 48 ({ort})");
  assert.deepEqual(r.fehlende, ["ort"]);
  assert.deepEqual(fuelleVorlage(null).fehlende, []);
});

test("Kanäle: E-Mail nur mit Adresse und Versandweg; Startkanal nach Vorliebe", () => {
  const mit = kanaeleFuer({ email: "a@beispiel.invalid" });
  assert.equal(mit.find((k) => k.id === "email").an, true);
  const ohne = kanaeleFuer({ email: "" });
  assert.deepEqual(ohne.find((k) => k.id === "email"), { id: "email", an: false, grund: "keine-email" });
  assert.equal(kanaeleFuer({ email: "a@beispiel.invalid" }, { versand: false }).find((k) => k.id === "email").grund, "kein-versand");
  assert.equal(startKanal(mit, "Telefon"), "telefon");
  assert.equal(startKanal(mit, "WhatsApp"), "email");
  assert.equal(startKanal(ohne, "E-Mail"), "telefon");
  assert.equal(normKanal("Brief/Post"), "brief");
  assert.equal(istEmail("kein mail"), false);
});

test("Text → HTML maskiert und setzt Absätze", () => {
  assert.equal(textZuHtml("Hallo <b>\nZeile 2\n\nAbsatz & Ende"), "<p>Hallo &lt;b&gt;<br>Zeile 2</p>\n<p>Absatz &amp; Ende</p>");
});

test("Eingaben prüfen: Pflichtfelder je Kanal, Längen, Objekt-Bezug", () => {
  const leer = pruefeInformieren({ kanal: "email", an: "x" }, INFORMIEREN_TEXTE);
  assert.equal(leer.ok, false);
  assert.ok(leer.fehler.betreff && leer.fehler.nachricht && leer.fehler.an);
  assert.equal(leer.fehler.betreff, INFORMIEREN_TEXTE.pflicht.betreff);
  const gut = pruefeInformieren({ kanal: "email", an: " a@beispiel.invalid ", betreff: " B ", nachricht: "N" });
  assert.deepEqual(gut, { ok: true, wert: { kanal: "email", betreff: "B", nachricht: "N", an: "a@beispiel.invalid" } });
  assert.equal(pruefeInformieren({ kanal: "telefon", nachricht: "" }).ok, false);
  assert.equal(pruefeInformieren({ kanal: "brief", nachricht: "Statusbericht gesendet" }).wert.an, null);
  assert.equal(pruefeInformieren({ kanal: "fax", nachricht: "x" }).ok, false);
  assert.equal(pruefeInformieren({ kanal: "email", an: "a@beispiel.invalid", betreff: "x".repeat(201), nachricht: "n" }).ok, false);
  assert.deepEqual(pruefeObjekt({ doctype: "PH Projekt", name: "PRJ-2026-021" }), { doctype: "PH Projekt", name: "PRJ-2026-021", titel: "PRJ-2026-021" });
  assert.equal(pruefeObjekt({ doctype: "User", name: "x" }), null);
  assert.equal(pruefeObjekt({ doctype: "PH Projekt", name: "a;drop" }), null);
});

// ------------------------------------------------------------------ Leitung bitten --

test("Leitung bitten: Kennung je Objekt/Aktion, Leitungsrolle aus dem Register", () => {
  assert.equal(leitungSchluessel({ bereich: "faktura", aktion: "freigeben", doctype: "PH Rechnung", name: "RE-1" }), "faktura:bitte:PH Rechnung:RE-1:freigeben");
  assert.equal(leitungsRolle("CRM"), "PH CRM Leitung");
  assert.equal(leitungsRolle(""), null);
  for (const b of BEREICHE) if (b.rollenName) assert.match(leitungsRolle(b.rollenName), /^PH .+ Leitung$/);
  assert.match(LEITUNG_TEXTE.aufgabenTitel("Rechnung freigeben", "RE-1"), /^Bitte: Rechnung freigeben – RE-1$/);
});

test("Zeit kurz: heute mit Uhrzeit, sonst Datum + Uhrzeit, ungültig leer", () => {
  const jetzt = new Date(2026, 10, 4, 15, 0);
  assert.equal(zeitKurz(new Date(2026, 10, 4, 9, 14), jetzt), "heute 09:14");
  assert.equal(zeitKurz(new Date(2026, 10, 3, 9, 14), jetzt), "03.11. 09:14");
  assert.equal(zeitKurz("2026-11-04 09:14:00", jetzt), "heute 09:14");
  assert.equal(zeitKurz("kaputt", jetzt), "");
});

// ------------------------------------------------------------------ An der Kassa --

test("An der Kassa: Link mit Kunde/Beleg/Art, ungültige Kennungen fallen weg, Recht wie /arbeitsplatz", () => {
  assert.equal(kassaHref({ kunde: "KT-2026-00012", beleg: "RE-2026-00042" }), "/kassa?kunde=KT-2026-00012&beleg=RE-2026-00042");
  assert.equal(kassaHref({ variante: "gutschein" }), "/kassa?art=gutschein");
  assert.equal(kassaHref({ kunde: "<script>", variante: "unbekannt" }), "/kassa");
  assert.deepEqual([...KASSA_VARIANTEN], ["zahlung", "erstattung", "gutschein"]);
  const kassa = (roles) => erlaubteArbeitsplaetze({ roles }).some((a) => a.slug === "kassa");
  assert.equal(kassa(["PH Kassa Mitarbeiter"]), true);
  assert.equal(kassa(["PH Faktura Mitarbeiter"]), false);
  assert.equal(kassa(["PH Backoffice-Admin"]), true);
  for (const v of KASSA_VARIANTEN) assert.ok(KASSA_TEXTE[v].frage && KASSA_TEXTE[v].aktion);
});

// ------------------------------------------------------------------ Texte --

test("Texte ohne Technikbegriffe und ohne Umschreibungen statt Umlauten", () => {
  const sammle = (o, aus = []) => {
    for (const v of Object.values(o)) {
      if (typeof v === "string") aus.push(v);
      else if (typeof v === "function") aus.push(String(v("X", "Y")));
      else if (v && typeof v === "object") sammle(v, aus);
    }
    return aus;
  };
  const alle = sammle({ INFORMIEREN_TEXTE, LEITUNG_TEXTE, KASSA_TEXTE, DRUCK_TEXTE });
  assert.ok(alle.length > 60);
  for (const t of alle) {
    assert.doesNotMatch(t, /DocType|Frappe-Desk|snake_case|\b500\b|Timeout|PH Aufgabe|ph_/i, t);
    assert.doesNotMatch(t, /fuer|ueber|koenn|moeglich|aender|loesch|pruef|naechst|rueck|kuendig|bestaetig|zaehl|gruess/i, t);
  }
});

test("Komponenten nutzen keine Hex-Farben und keine type=date-Felder", () => {
  const dateien = ["src/components/Backoffice/LeitungBitten.js", "src/components/Backoffice/AnDieKassa.js"];
  for (const ordner of ["src/components/Backoffice/Druck", "src/components/Backoffice/Informieren"]) for (const d of readdirSync(path.join(BO, ordner))) dateien.push(`${ordner}/${d}`);
  for (const d of dateien) {
    const text = readFileSync(path.join(BO, d), "utf8");
    assert.doesNotMatch(text, /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/, `${d}: Hex-Wert`);
    assert.doesNotMatch(text, /type="date"/, `${d}: type=date`);
  }
});
