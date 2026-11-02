// QM content-legal r3 → Fixrunde (02.11.2026): hyphenation of Ratgeber text,
// news list order and copy fixes, legal typography, table rendering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { hyphenateDe, SOFT_HYPHEN } from "../../src/lib/text/hyphenateDe.js";
import { isDatedPast, pastYearLast } from "../../src/components/News/staleNews.js";
import { legalTypo } from "../../src/components/Impressum/legalTypo.js";
import { presentNews } from "../../src/lib/news/newsCopy.js";
import Blocks from "../../src/components/Ratgeber/Markdown.js";

const show = (s) => s.replaceAll(SOFT_HYPHEN, "·");

test("hyphenateDe: Silbentrennung langer Wörter, URLs und Mails bleiben unberührt", () => {
  assert.equal(show(hyphenateDe("mehrwertsteuerpflichtig")), "mehr·wert·steu·er·pflich·tig");
  assert.equal(show(hyphenateDe("Speditionssendung")), "Spe·di·ti·ons·sen·dung");
  assert.equal(show(hyphenateDe("Geschäftsführung")), "Ge·schäfts·füh·rung");
  // short words untouched
  assert.equal(hyphenateDe("Möbel aus Lochau"), "Möbel aus Lochau");
  const mixed = "siehe bazg.admin.ch/de/aufhebung oder info@platzhirsch.studio";
  assert.equal(hyphenateDe(mixed), mixed);
  assert.equal(hyphenateDe(null), null);
});

test("News: Beiträge mit vergangener Jahreszahl im Titel rücken ans Ende, Reihenfolge sonst stabil", () => {
  assert.equal(isDatedPast("Der Platzhirsch läutet die Gartensaison 2023 ein", 2026), true);
  assert.equal(isDatedPast("Salone del Mobile 2024 & Outdoor", 2026), true);
  assert.equal(isDatedPast("Öffnungszeiten Jahreswechsel 2023/2024", 2026), true);
  assert.equal(isDatedPast("Neuheiten 2025", 2026), false);
  assert.equal(isDatedPast("ClassiCon – Möbeldesign", 2026), false);
  assert.equal(isDatedPast("next125 Küchen", 2026), false);
  const list = ["A", "B 2023", "C", "D 2022", "E"].map((name1) => ({ name1 }));
  assert.deepEqual(pastYearLast(list, (i) => i.name1, 2026).map((i) => i.name1), ["A", "C", "E", "B 2023", "D 2022"]);
});

test("News-Texte: Tippfehler, alter Hausname und „Auffallend innovativ“ entschärft", () => {
  const n = presentNews({ name1: "Quasar – Auffallend innovatives Lichtdesign", beschreibung: "Inhaberin von Platzhirsch Home.Living. Jeds Jahr kommen neue Stücke hinzu. Auffallend schön." });
  assert.equal(n.name1, "Quasar – Innovatives Lichtdesign");
  assert.match(n.beschreibung, /Platzhirsch Home Living\. Jedes Jahr kommen/);
  assert.match(n.beschreibung, /Auffallend schön\./, "nur vor „innovativ“");
});

test("legalTypo: Tag und Monat bleiben zusammen („Stand: 29. Oktober 2026“)", () => {
  assert.equal(legalTypo("Stand: 29. Oktober 2026"), "Stand: 29. Oktober 2026");
  assert.equal(legalTypo("am 3. Mai"), "am 3. Mai");
  assert.equal(legalTypo("Schritt 3. Danach"), "Schritt 3. Danach");
});

test("Ratgeber-Tabellen: zweispaltig stapelt bei großer Schrift, Kopflinie an den Zellen", () => {
  const block = { type: "table", head: ["Schritt", "Betrag"], rows: [["Preis", "20.833 €"], ["Summe", "CHF 22.520"]] };
  const html = renderToStaticMarkup(createElement(Blocks, { blocks: [{ type: "heading", level: 2, id: "x", text: "Rechenbeispiel" }, block] }));
  assert.match(html, /@min-\[20rem\]:hidden/, "gestapelte Fassung unter 20 rem");
  assert.match(html, /hidden @min-\[20rem\]:block/, "Tabelle ab 20 rem");
  assert.match(html, /<th scope="col" class="border-b border-line-strong/, "Kopflinie an jeder Kopfzelle");
  assert.doesNotMatch(html, /<tr class="border-b/, "keine Zeilenrahmen (WebKit zeichnete sie nur unter Spalte 1)");
});

test("Ratgeber-Fließtext: weiche Trennstellen, Listen mit px-Einzug", () => {
  const html = renderToStaticMarkup(
    createElement(Blocks, { blocks: [{ type: "paragraph", text: "Die Ware ist mehrwertsteuerpflichtig." }, { type: "list", ordered: false, items: ["Speditionssendung"] }] })
  );
  assert.ok(html.includes(`mehr${SOFT_HYPHEN}wert`), "Trennstelle im Absatz");
  assert.match(html, /pl-\[22px\]/);
});
