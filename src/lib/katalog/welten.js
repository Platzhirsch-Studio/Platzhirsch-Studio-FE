// src/lib/katalog/welten.js
// Zwei „Welten“ des Herstellerkatalogs mit denselben Komponenten:
//   bad-wellness    → /bad-wellness/produkte, /bad-wellness/marke/<marke>, /bad-wellness/produkte/<slug>
//   kuechengeraete  → /kuechengeraete/produkte, /kuechengeraete/marke/<marke>, /kuechengeraete/produkte/<slug>
//   accessoires     → /accessoires/produkte, /accessoires/marke/<marke>, … (Nr. 27, Baobab Collection)
//   dazu je Welt /<welt>/kategorie/<kategorie> und Paginierung …/seite/<n> (Nr. 25).
// Entscheidung (31.10.2026): die Produkte hängen unter der Seite, von der
// Besucher kommen (Breadcrumb, Beratungs-Thema, Kontext bleiben stimmig); ein
// gemeinsamer /katalog-Pfad hätte eine dritte, inhaltlich leere Hub-Seite
// gebraucht. Gleicher deutscher Pfad in allen vier Sprachen (keine
// Pfad-Übersetzung, kein Eintrag in proxy.js/deOnlyRedirects.cjs).
// Rein, ohne "@/"-Importe.

export const KATALOG_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

export const WELTEN = Object.freeze({
  "bad-wellness": Object.freeze({
    id: "bad-wellness",
    basePath: "/bad-wellness",
    bereiche: Object.freeze(["bad", "wellness", "objekt"]),
    /** Messages-Schlüssel unter katalog.welt.* */
    key: "badWellness",
    /** Bestehende Weltseite (Breadcrumb); null = keine eigene Seite, Übersicht ist der Einstieg. */
    hub: "/bad-wellness",
  }),
  kuechengeraete: Object.freeze({
    id: "kuechengeraete",
    basePath: "/kuechengeraete",
    bereiche: Object.freeze(["kueche"]),
    key: "kuechengeraete",
    hub: "/kuechengeraete",
  }),
  // Inhaber-Entscheidung Nr. 27 (31.10.2026): Baobab Collection – Duftkerzen,
  // Raumdüfte, Diffuser, Accessoires. Eigene Welt unter /accessoires. Seit der
  // Shop-Startseite (Shop-Team 31.10.2026) ist /accessoires die Weltseite (hub):
  // Breadcrumb „Startseite / Accessoires / Alle Produkte / …“. Gleiche Komponenten wie oben.
  accessoires: Object.freeze({
    id: "accessoires",
    basePath: "/accessoires",
    bereiche: Object.freeze(["accessoires"]),
    key: "accessoires",
    hub: "/accessoires",
  }),
});

export const WELT_IDS = Object.freeze(Object.keys(WELTEN));

/** Welt eines Bereichs ("kueche" → kuechengeraete, "accessoires" → accessoires, sonst bad-wellness). */
export function weltOfBereich(bereich) {
  if (bereich === "kueche") return "kuechengeraete";
  if (bereich === "accessoires") return "accessoires";
  return "bad-wellness";
}

export const produktePath = (welt) => `${WELTEN[welt].basePath}/produkte`;
export const markePath = (welt, marke) => `${WELTEN[welt].basePath}/marke/${marke}`;
export const produktPath = (welt, slug) => `${WELTEN[welt].basePath}/produkte/${slug}`;
export const kategoriePath = (welt, kategorie) => `${WELTEN[welt].basePath}/kategorie/${kategorie}`;
/** Seite n einer Liste: Seite 1 = Basispfad, sonst <basis>/seite/<n>. */
export const seitePath = (base, n) => (n > 1 ? `${base}/seite/${n}` : base);

/**
 * Thema für den Beratungsweg (?thema=…, TOPICS in src/lib/forms/beratungContext.js).
 * Bad → "bad", Wellness → "wellness", Objekt → "wellness,objekt", Küche → "kueche".
 */
export function beratungThema(bereich) {
  if (bereich === "bad") return "bad";
  if (bereich === "objekt") return "wellness,objekt";
  if (bereich === "kueche") return "kueche";
  if (bereich === "accessoires") return "accessoires";
  return "wellness";
}
