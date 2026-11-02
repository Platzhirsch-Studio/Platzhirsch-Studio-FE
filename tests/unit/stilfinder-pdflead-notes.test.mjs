// node --test tests/unit/stilfinder-pdflead-notes.test.mjs
// pdf-lead fix-05: Bildnachweis nennt unveränderte Marken nur, wenn sie im PDF sind;
// „(Labs)“ in den PDF-Eigenschaften nur im Labs-Modus.
import { test } from "node:test";
import assert from "node:assert/strict";

const { imageTreatment, buildDocument } = await import("../../src/lib/stilfinder/document.js");

test("imageTreatment: Minotti nur, wenn ein Minotti-Bild im PDF ist", () => {
  assert.equal(imageTreatment([]), "Freisteller auf den Papierton gebracht, Szenen im Rahmen beschnitten.");
  assert.match(imageTreatment(["Minotti"]), /^Bilder von Minotti unverändert; andere Freisteller/);
});

function docFor({ labs, items }) {
  return buildDocument({
    profile: { key: "ruhe", name: "Italienische Ruhe", slug: "italienische-ruhe", tagline: "", keywords: [], palette: [{ name: "A", hex: "#ffffff" }, { name: "B", hex: "#eeeeee" }, { name: "C", hex: "#dddddd" }] },
    content: { introTitle: "", intro: [], traits: [], colorRoles: { base: [[0], ""], companion: [[1], ""], accent: [[2], ""] }, materials: {}, rooms: {}, combos: [], light: "" },
    customer: {},
    result: null,
    rooms: { wohnen: items, essen: [], kueche: [], schlafen: [], outdoor: [] },
    labs,
    dateLabel: "1. November 2026",
    facts: { hours: [], street: "", postalCode: "", city: "", region: "", country: "", phone: "", phoneHref: "", email: "", emailHref: "", legalName: "", impressum: "", datenschutz: "" },
    qr: {},
    links: { termin: "https://platzhirsch.studio/de/beratung", terminLabel: "" },
    images: { materials: {}, roomScenes: {} },
  }).doc;
}

test("PDF-Eigenschaften: Creator ohne „(Labs)“ nach Freigabe der Bilder", () => {
  assert.equal(docFor({ labs: true, items: [] }).props.creator, "Platzhirsch Stil-Finder (Labs)");
  assert.equal(docFor({ labs: false, items: [] }).props.creator, "Platzhirsch Stil-Finder");
});
