// R2-qualitaetsnetz: false positives from the live claim check of 26.10.2026
// (FR press/cookie texts on brand pages, IT certificate of origin, "unico" = single).
// Run: node --test tests/unit/claims-r2.test.mjs
// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist jetzt belegter Händler
// (minotti.com, Minotti Studio by Platzhirsch). Beispiel für eine UNBELEGTE Marke ist in dieser
// Datei durchgehend Rimadesio, damit alle Schutz- und Falsch-Positiv-Prüfungen weiter greifen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findClaims, sanitizeClaims, hasDealerClaim } from "../../src/lib/legal/claims.js";

const dealer = (text, brandSlug = "rimadesio") => findClaims(text, { brandSlug }).filter((f) => f.type === "dealer");
const superl = (text) => findClaims(text, {}).filter((f) => f.type === "superlative");

test("R2-01 FR: 'autorisés à …' und 'être autorisés' sind Erlaubnis, kein Händler-Claim", () => {
  for (const s of [
    "En plus des communiqués, nous mettons à disposition des images, dans la mesure où nous sommes autorisés à les transmettre.",
    "Les contenus provenant par exemple de plateformes vidéo et de réseaux sociaux sont bloqués par défaut et peuvent être autorisés.",
    "We are authorised to share these images.",
    "Siamo autorizzati a trasmettere le immagini.",
    "I contenuti possono essere autorizzati.",
  ]) {
    assert.deepEqual(dealer(s, "sifas"), [], s);
  }
});

test("R2-02 Händler-Status mit 'autorisé' bleibt ein Verstoß", () => {
  assert.ok(hasDealerClaim("Revendeur autorisé Rimadesio."));
  assert.ok(dealer("Nous sommes le partenaire autorisé de Rimadesio.").length > 0);
  assert.ok(dealer("Rivenditore autorizzato Rimadesio.").length > 0);
  assert.ok(dealer("Authorized Rimadesio dealer.").length > 0);
});

test("R2-03 IT: 'da un certificato di origine' ist Produktangabe", () => {
  assert.deepEqual(dealer("Ogni pezzo è accompagnato da un certificato di origine 100% Made in Italy.", "poliform"), []);
  assert.ok(dealer("Siamo partner certificato Poliform.", "poliform").length > 0);
});

test("R2-03b zugelassene Betriebe und zertifizierte Materialien sind keine Händler-Claims", () => {
  assert.deepEqual(dealer("Les travaux de construction et de jardin sont réalisés par des entreprises agréées.", "solpuri"), []);
  assert.deepEqual(dealer("Gloster propone mobili da esterno in teak certificato, alluminio e corda.", "gloster"), []);
  assert.ok(dealer("Showroom agréé par Gloster.", "gloster").length > 0);
  assert.ok(dealer("Revendeur agréé Gloster.", "gloster").length > 0);
});

test("R2-04 'unico/unique' im Sinn von 'einzig' ist kein Superlativ", () => {
  for (const s of [
    "Living, cucina e outdoor, progettati come un unico progetto.",
    "Un unico progetto",
    "Living, cucina, notte, outdoor e luce da un’unica mano.",
    "Cuore del design è l'architetto Giuseppe Bavuso, unico designer che garantisce coerenza stilistica.",
    "Au cœur du design, l'architecte Giuseppe Bavuso, designer unique garantissant une cohérence stylistique.",
  ]) {
    assert.deepEqual(superl(s), [], s);
    assert.equal(sanitizeClaims(s, undefined, { locale: "it" }), s);
  }
});

test("R2-05 echte Superlative mit 'unique/unico' bleiben Verstöße", () => {
  assert.ok(superl("Avec une approche unique combinant matériaux nobles.").length > 0);
  assert.ok(superl("Un progetto unico nel suo genere.").length > 0);
  assert.ok(superl("Nous privilégions une collaboration qui donne vie à des idées uniques.").length > 0);
  assert.equal(sanitizeClaims("Un design unico.", undefined, { locale: "it" }), "Un design speciale.");
});
