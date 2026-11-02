// tests/unit/r5-recht-p6.test.mjs — Fix-Team P6, Runde 4 (Recht und Inhalt):
//   1 Datenschutz: E-Mail-Versand nur Resend + Platzhalter-Satz USA (DPF/SCC)
//   2 Datenschutz: Abschnitt „Bewerbungen“; Karriere ohne unbestätigte Person
//     und ohne „faire Bezahlung“, Bewerbungen an die allgemeine Adresse
//   3 Impressum: keine sichtbaren Platzhalter
//   4 News: Werbeversprechen in 4 Sprachen (Fixture + alle Live-News, wenn
//     das Backoffice erreichbar ist – nur GET, nichts wird gesendet)
//   5 News: Migrationsdatum nie als datePublished
//   6 Karriere-Share-Bild PNG statt AVIF
//   8 Ratgeber/Adventsabend: echte 404 über dynamicParams = false
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { dropPromiseSentences, newsDates, presentNews, sanitizeNewsText, untrustedNewsDays } from "../../src/lib/news/newsCopy.js";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

// ------------------------------------------------------------ 1 Mailversand
test("Datenschutz: E-Mail-Versand nennt nur Resend, Grundlage USA als Platzhalter-Satz", () => {
  const jsx = code("src/components/Datenschutz/datenschutz.js");
  const section = jsx.slice(jsx.indexOf('id="mailversand"'), jsx.indexOf('id="bewerbungen"'));
  assert.ok(section.length > 100);
  assert.doesNotMatch(section, /Postmark|je nach Einrichtung|\boder über das Mailkonto/i, "keine Oder-Formulierung");
  assert.match(section, /MAIL_SERVICE\.transferBasis/);
  const raw = read("src/components/Datenschutz/datenschutz.js");
  assert.match(raw, /provider: "resend"/);
  // Bewusst geändert (Inhaber-Entscheidung Nr. 11, 29.10.2026): Kanzlei hat
  // den Satz und die Erklärung freigegeben; AVV mit Resend bleibt Deploy-Auflage.
  assert.match(raw, /lawFirmConfirmed: true/, "Kanzlei-Freigabe des Satzes");
  assert.match(raw, /lawyerApproved: true/, "Kanzlei-Freigabe der Erklärung");
  assert.match(raw, /AV-Verträge ablegen: Anthropic \(Concierge\), Resend/, "AVV beim Inhaber offen");
  // Resend is the one service every mail path in the code knows.
  for (const f of ["src/lib/portal/mailer.js", "src/lib/stilfinder/mail.js", "src/lib/payments/mailer.js"]) assert.match(read(f), /api\.resend\.com/, f);
});

// ------------------------------------------------------------ 2 Bewerbungen
test("Datenschutz: Abschnitt Bewerbungen mit Zweck, lit. b und Speicherdauer-Vorschlag", () => {
  const jsx = code("src/components/Datenschutz/datenschutz.js");
  const section = jsx.slice(jsx.indexOf('id="bewerbungen"'), jsx.indexOf('id="rechte"'));
  assert.match(section, /Art\. 6 Abs\. 1 lit\. b DSGVO/);
  assert.match(section, /APPLICATION_RETENTION\.months/);
  assert.match(section, /Einwilligung/);
  assert.doesNotMatch(section, /\[/);
  assert.match(read("src/components/Datenschutz/datenschutz.js"), /APPLICATION_RETENTION = Object\.freeze\(\{ months: 7, ownerConfirmed: false \}\)/);
});

test("Karriere: keine unbestätigte Ansprechperson, allgemeine Adresse, keine „faire Bezahlung“", async () => {
  for (const f of ["src/components/Karriere/karriereposition.js", "src/components/Karriere/JobDetail.js"]) {
    assert.doesNotMatch(code(f), /Helmut|helmut/, f);
  }
  assert.match(read("src/components/Karriere/karriereposition.js"), /export const APPLICATION_EMAIL = EMAIL;/);
  assert.match(read("src/lib/site.js"), /export const EMAIL = "info@platzhirsch\.studio"/);
  // The bullet filter, run on the real message texts of all four languages.
  const src = read("src/components/Karriere/karriereposition.js");
  const re1 = new RegExp(src.match(/const UNCONFIRMED_BENEFIT = \/(.+)\/iu;/)[1].replace(/\\\\/g, "\\"), "iu");
  for (const locale of ["de", "en", "fr", "it"]) {
    const bullets = JSON.parse(read(`src/messages/${locale}.json`)).inhalt.career.bullets;
    const shown = bullets.map((b) => b.replace(re1, "").trim());
    assert.ok(!shown.some((b) => /fair|équitable|equa\b/i.test(b)), `${locale}: ${shown}`);
    assert.equal(shown.length, bullets.length);
  }
});

// ------------------------------------------------------------ 3 Impressum
test("Impressum: keine sichtbaren Platzhalter, keine Kammerdaten ohne Beleg", () => {
  const jsx = code("src/components/Impressum/impressum.js");
  const body = jsx.slice(jsx.indexOf("const Impressum = () =>"));
  assert.doesNotMatch(body, /\[|TODO|Blattlinie|null\}/);
  // 30.10.2026: Kammer aus WKO Firmen A–Z belegt (Quelle Pflicht).
  assert.match(jsx, /source: "WKO Firmen A–Z/);
  assert.match(jsx, /\{chamber && \(/);
  // Freigabe-Runde (Nr. 11): Blattlinie wie die Kammer nur mit belegtem Text.
  assert.match(jsx, /text: null/);
  assert.match(jsx, /\{blattlinie && \(/);
});

// ------------------------------------------------------------ 4 News-Werbeversprechen
const BANNED = {
  de: /garantiert|schon im April|unvergleichlich|weltweit|weltbekannt|ihren Outdoorbereich/i,
  en: /we can guarantee|as early as April|incomparabl|worldwide|world-renowned/i,
  fr: /nous vous garantissons|dès avril|incomparable|dans le monde entier|mondialement/i,
  it: /garantiamo|già ad aprile|incomparabil|in tutto il mondo/i,
};
const FIXTURE = {
  name: "N-T1",
  status: "Aktiv",
  daten: "2023-03-15",
  name1: "Der PLATZHIRSCH lässt Wünsche wahr werden",
  beschreibung:
    "Die italienische Marke Paola Lenti, gegründet 1994 in Meda, ist weltweit für ihren hochinnovativen Charakter bekannt. „Dieser Einrichtungsstil, den ClassiCon damit zur Verfügung stellt, ist unvergleichlich. Aber es begeistert uns auch die Bodenständigkeit.“ Diese Kollektion bietet ein unvergleichliches Wohnerlebnis.",
  beschreibung_en: "The Italian brand Paola Lenti is known worldwide for its highly innovative character. \"This interior design style that ClassiCon provides is incomparable. But we're also impressed.\" This newsletter focuses on the world-renowned Italian brand FLOS.",
  beschreibung_fr: "La marque italienne Paola Lenti est reconnue dans le monde entier pour son caractère résolument innovant. Le style d'aménagement intérieur proposé par ClassiCon est incomparable. Nous sommes également impressionnés.",
  beschreibung_it: "Il marchio italiano Paola Lenti è noto in tutto il mondo per il suo carattere fortemente innovativo. \"Lo stile di interior design offerto da ClassiCon è incomparabile. Ma siamo anche rimasti colpiti.\"",
  artikel_table: [{ beschreibung: "Wir lieben die bunte Vielfalt von PAOLA LENTI. Ihren persönlichen Wunsch können wir garantiert erfüllen und wenn Sie zeitnah bestellen, können Sie schon im April mit den ersten Sonnenstrahlen ihren Outdoorbereich genießen." }],
  artikel_table_en: [{ beschreibung: "We love PAOLA LENTI. We can guarantee to fulfill your personal wishes, and if you order promptly, you can enjoy your outdoor space as early as April." }],
  artikel_table_fr: [{ beschreibung: "On adore PAOLA LENTI. Nous vous garantissons de répondre à vos envies et, si vous commandez rapidement, vous pourrez profiter de votre espace extérieur dès avril." }],
  artikel_table_it: [{ beschreibung: "Amiamo PAOLA LENTI. Garantiamo di esaudire i vostri desideri personali e potrete godervi il vostro spazio esterno già ad aprile, con i primi raggi di sole." }],
};

function shownTexts(p) {
  const out = [];
  for (const [key, value] of Object.entries(p)) {
    const m = key.match(/^(?:name1|beschreibung|alt_text|metadata_description_de)$/) ? "de" : key.match(/^(?:name|beschreibung|alt_text|metadata_description)_(en|fr|it)$/)?.[1];
    if (m && typeof value === "string") out.push([m, key, value]);
    const t = key.match(/^artikel_table(?:_(en|fr|it))?$/);
    if (t && Array.isArray(value)) for (const row of value) if (typeof row?.beschreibung === "string") out.push([t[1] || "de", key, row.beschreibung]);
  }
  return out;
}

function assertClean(items) {
  for (const item of items) {
    const p = presentNews(item);
    if (!p || p.withheld || item.status !== "Aktiv") continue;
    for (const [lang, key, text] of shownTexts(p)) {
      assert.doesNotMatch(text, BANNED[lang], `${item.name1} ${key}`);
      assert.doesNotMatch(text, /\u0001|\u0002| {2,}\S/, `${item.name1} ${key}: Reste`);
    }
  }
}

test("News: Werbeversprechen in allen 4 Sprachen entfernt (Fixture)", () => {
  assertClean([FIXTURE]);
  const p = presentNews(FIXTURE);
  // whole sentences go, the quote marks stay balanced
  assert.match(p.beschreibung, /„Aber es begeistert uns auch die Bodenständigkeit\.“/);
  assert.match(p.beschreibung, /ein Wohnerlebnis/);
  assert.match(p.beschreibung, /ist für ihren hochinnovativen Charakter bekannt/);
  assert.equal(p.artikel_table[0].beschreibung, "Wir lieben die bunte Vielfalt von PAOLA LENTI.");
  assert.equal(p.artikel_table_fr[0].beschreibung, "On adore PAOLA LENTI.");
  assert.match(p.beschreibung_fr, /reconnue pour son caractère/);
  assert.match(p.beschreibung_it, /è noto per il suo carattere/);
  assert.match(p.beschreibung_en, /focuses on the Italian brand FLOS/);
  // manufacturer statements stay
  assert.equal(dropPromiseSentences("Materialien garantieren Möbel, die lange halten.", "de"), "Materialien garantieren Möbel, die lange halten.");
  // a headline is never dropped as a sentence
  assert.ok(presentNews({ ...FIXTURE, name1: "Garantiert schön" }).name1.length > 0);
  // spelling: formal address
  assert.equal(sanitizeNewsText("Genießen Sie ihren Outdoorbereich im Sommer.", "de"), "Genießen Sie Ihren Outdoorbereich im Sommer.");
  // dates and abbreviations do not split a sentence
  assert.equal(
    dropPromiseSentences("Am 6. Mai feiern wir, z. B. im Café. Das ist unvergleichlich. Danach geht es weiter.", "de"),
    "Am 6. Mai feiern wir, z. B. im Café. Danach geht es weiter."
  );
});

test("News: alle Live-News in 4 Sprachen ohne Werbeversprechen (nur wenn das Backoffice erreichbar ist)", async (t) => {
  let items;
  try {
    const res = await fetch("https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.news.api.news_data", {
      signal: AbortSignal.timeout(15_000),
    });
    items = res.ok ? (await res.json()).message : null;
  } catch {
    items = null;
  }
  if (!Array.isArray(items) || !items.length) return t.skip("Backoffice nicht erreichbar");
  assertClean(items);
});

// ------------------------------------------------------------ 5 Datum
test("News: Migrationsdatum bzw. Tag mit > 3 Artikeln wird kein datePublished", () => {
  const items = [
    ...Array.from({ length: 5 }, (_, i) => ({ name1: `A${i}`, status: "Aktiv", daten: "2024-02-02" })),
    { name1: "M", status: "Aktiv", daten: "2025-01-14" },
    { name1: "R", status: "Aktiv", daten: "2023-03-15" },
    { name1: "U", status: "Aktiv", daten: "2024-02-02", modified: "2024-06-01 10:00:00" },
  ];
  assert.ok(untrustedNewsDays(items).has("2024-02-02"));
  assert.deepEqual(newsDates(items[0], items), { published: null, modified: null });
  assert.deepEqual(newsDates(items[5], items), { published: null, modified: null });
  assert.equal(newsDates(items[6], items).published, "2023-03-15T00:00:00.000Z");
  assert.equal(newsDates(items[7], items).published, null);
  assert.equal(newsDates(items[7], items).modified, new Date("2024-06-01 10:00:00").toISOString());
  const page = read("src/app/[locale]/news/[title]/page.js");
  assert.match(page, /newsDates\(found, data\)/);
  assert.doesNotMatch(code("src/app/[locale]/news/[title]/page.js"), /toIsoOrNull\(news\?\.daten/);
});

// ------------------------------------------------------------ 6 Karriere-OG
test("Karriere: Share-Bild PNG 1200 × 630, kein AVIF in den Metadaten", () => {
  for (const f of ["src/app/[locale]/ueber-uns/karriere/page.js", "src/app/[locale]/ueber-uns/karriere/[slug]/page.js"]) {
    const src = code(f);
    assert.match(src, /shareImageMeta\(/, f);
    assert.doesNotMatch(src, /images: \[image|\.avif|bannerImageArbeiten1/, f);
  }
  const share = read("src/components/Karriere/shareImage.js");
  assert.match(share, /width: 1200, height: 630, type: "image\/png"/);
  assert.match(read("src/app/[locale]/ueber-uns/karriere/share-image/route.js"), /dynamicParams = false/);
});

// ------------------------------------------------------------ 8 404
test("Ratgeber und Adventsabend: echte 404 (Artikel: dynamicParams = false; Hubs: connection() vor notFound())", () => {
  const slug = code("src/app/[locale]/ratgeber/[slug]/page.js");
  assert.match(slug, /export const dynamicParams = false;/);
  assert.match(slug, /export function generateStaticParams\(/);
  for (const f of ["src/app/[locale]/ratgeber/page.js", "src/app/[locale]/adventsabend/page.js"]) {
    const src = code(f);
    assert.match(src, /import \{ connection \} from "next\/server";/, f);
    assert.match(src, /\{\s*await connection\(\);\s*notFound\(\);\s*\}/, f);
    assert.doesNotMatch(src, /dynamicParams/, f);
    // every notFound() is guarded by connection() (metadata step + page body),
    // so no 404 is ever prerendered as the cached empty shell
    const all = (src.match(/notFound\(\)/g) || []).length;
    assert.equal(all, 2, f);
    assert.equal((src.match(/await connection\(\);\s*notFound\(\)/g) || []).length, all, f);
  }
});
