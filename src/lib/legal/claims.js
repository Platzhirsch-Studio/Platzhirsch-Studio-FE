// src/lib/legal/claims.js
// Claim-Guard (UWG § 2 irreführende Geschäftspraktiken, § 1 PAngV-Umfeld).
//
// Platzhirsch darf sich nur dort "Händler", "offizieller Partner" o. Ä. nennen,
// wo der Hersteller das belegt. Stand 31.10.2026: ClassiCon (Händlerlocator),
// Ezarri (Händlervertrag), Minotti (Minotti-Pressemeldung „Minotti Studio by
// Platzhirsch Home Living“), sieben Bad-&-Wellness-Marken und sechs
// Küchengeräte-Marken sowie Baobab Collection, Riedel, Cire Trudon, Flos, Tom
// Dixon, Zalto, Assouline, Kähler und Lyngby Porcelæn (Händlerstatus laut Inhaber), siehe CLAIM_REGISTER. Superlative ("größte", "führend",
// "Nr. 1", "einzigartig") sind ohne Beleg ebenfalls tabu.
//
// Reine Logik: keine '@/'-Aliase, kein 'server-only', keine Abhängigkeiten.
// Läuft in Server- und Client-Komponenten, in node --test und in tools/checks.

/** Marken (Slug), für die ein Händler-Claim belegt ist. */
// Ezarri seit 28.10.2026: Händlervertrag und Nutzungserlaubnis laut Inhaber in
// den Firmenakten (Inhaber-Entscheidung Nr. 7, „wie bei ClassiCon erlaubt“).
// Seit 31.10.2026 (Inhaber-Entscheidungen Nr. 19–22): Minotti (öffentlicher
// Beleg auf minotti.com, „Minotti Studio by Platzhirsch Home Living“) sowie die
// Bad-&-Wellness-Marken mit Liefervereinbarung laut Inhaber. Seit 31.10.2026
// (Inhaber-Entscheidung Nr. 24, ersetzt die Einschränkung aus Nr. 18) auch die
// Küchengeräte-Marken Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker
// (Slugs wie src/lib/kueche/geraete.js).
export const VERIFIED_DEALER_BRANDS = Object.freeze([
  "classicon", "ezarri", "minotti",
  "starpool", "soleum", "fabio-alemanno", "aquavia-spa", "naggura", "dornbracht", "antoniolupi",
  "gaggenau", "miele", "v-zug", "bora", "liebherr", "quooker",
  // Accessoire-Welt (Inhaber-Entscheidungen Nr. 27/28, 31.10.2026): Händlerstatus
  // laut Inhaber bestätigt; Slugs wie src/lib/katalog/marken/.
  "baobab-collection", "riedel", "cire-trudon",
  // Inhaber-Entscheidung Nr. 32 (31.10.2026): Flos und Tom Dixon (Backoffice-
  // Markenseiten) sowie die Accessoire-Marken Zalto, Assouline, Kähler und
  // Lyngby Porcelæn – Händlerstatus laut Inhaber, Firmenakten.
  "flos", "tom-dixon", "zalto", "assouline", "kahler", "lyngby-porcelaen",
]);

/**
 * Belegte Claims. Jeder Eintrag braucht eine öffentlich prüfbare Quelle und
 * ein Prüfdatum. Neue Einträge nur mit schriftlichem Beleg des Herstellers.
 */
export const CLAIM_REGISTER = Object.freeze([
  Object.freeze({
    id: "classicon-dealer",
    brandSlug: "classicon",
    brandName: "ClassiCon",
    claim: "dealer",
    wording: "contract",
    text: "Platzhirsch Home Living ist im Händlerverzeichnis von ClassiCon gelistet.",
    evidenceUrl: "https://www.classicon.com/de/haendler.html",
    verifiedAt: "2026-10-26",
    note: "Der Eintrag nennt die Firmenbuch-Hausnummer, nicht die der Website (Marktresearch/16-markenluecken-verifiziert.md, Rechtspaket W1).",
  }),
  Object.freeze({
    id: "ezarri-dealer",
    brandSlug: "ezarri",
    brandName: "Ezarri",
    claim: "dealer",
    wording: "contract",
    text: "Platzhirsch Home Living ist Vertragshändler von Ezarri.",
    // Kein öffentlicher Händlerlocator: Beleg ist der schriftliche Händlervertrag.
    evidenceUrl: "https://www.ezarri.com/de",
    evidence: "Händlervertrag und schriftliche Nutzungserlaubnis, Firmenakten (Inhaber-Bestätigung 28.10.2026)",
    verifiedAt: "2026-10-28",
    note: "Inhaber-Entscheidung Nr. 7 (Marktresearch/digital/teamleiter/inhaber-entscheidungen.md). Wortlaut vor dem Deploy mit dem Vertrag abgleichen.",
  }),
  Object.freeze({
    id: "minotti-studio",
    brandSlug: "minotti",
    brandName: "Minotti",
    claim: "dealer",
    text: "Platzhirsch Home Living betreibt in Lochau das „Minotti Studio by Platzhirsch Home Living“.",
    evidenceUrl: "https://www.minotti.com/de/%C3%B6sterreichminotti-weiht-das-neue-minotti-studio-by-platzhirsch-home-living-ein",
    evidence: "Minotti-Pressemeldung zur Eröffnung des Minotti Studio by Platzhirsch Home Living (ca. 400 m², Lochau; Artikel Juli 2019); Inhaber bestätigt laufende Partnerschaft 31.10.2026",
    verifiedAt: "2026-10-31",
    note: "Inhaber-Entscheidung Nr. 22. Formulierung nah am Minotti-Wortlaut halten; Markenrichtlinien von Minotti beachten. Die Fläche (ca. 400 m²) ist Stand 2019 und wird NICHT als heutiger Stand genannt.",
    // Belegter Wortlaut statt „Vertragshändler“: Studio-Name wie in der Pressemeldung,
    // Jahr der Eröffnung (6. Juni, Meldung Juli 2019), gestaltet vom Minotti Studio.
    wording: "studio",
    showEvidenceLink: true,
    // Geschütztes Leerzeichen (NBSP, U+00A0) vor dem Gedankenstrich: der Strich bleibt in der Überschrift am Zeilenende.
    title: Object.freeze({
      de: "Minotti Studio by Platzhirsch Home Living – seit 2019 in Lochau",
      en: "Minotti Studio by Platzhirsch Home Living – in Lochau since 2019",
      fr: "Minotti Studio by Platzhirsch Home Living – à Lochau depuis 2019",
      it: "Minotti Studio by Platzhirsch Home Living – a Lochau dal 2019",
    }),
    pageTitle: "Minotti Studio by Platzhirsch Home Living – Lochau",
    statement: Object.freeze({
      de: "Minotti hat das Minotti Studio by Platzhirsch Home Living in Lochau 2019 eröffnet; gestaltet hat es das hauseigene Kreativstudio von Minotti.",
      en: "Minotti opened the Minotti Studio by Platzhirsch Home Living in Lochau in 2019; it was designed by Minotti’s in-house creative studio.",
      fr: "En 2019, Minotti a inauguré le Minotti Studio by Platzhirsch Home Living à Lochau, conçu par le studio de création interne de Minotti.",
      it: "Nel 2019 Minotti ha inaugurato il Minotti Studio by Platzhirsch Home Living a Lochau, progettato dallo studio creativo interno di Minotti.",
    }),
  }),
  ...[
    ["starpool", "Starpool"], ["soleum", "Soleum"], ["fabio-alemanno", "Fabio Alemanno"],
    ["aquavia-spa", "Aquavia Spa"], ["naggura", "Naggura"], ["dornbracht", "Dornbracht"], ["antoniolupi", "antoniolupi"],
  ].map(([brandSlug, brandName]) => Object.freeze({
    id: `${brandSlug}-dealer`,
    brandSlug,
    brandName,
    claim: "dealer",
    // Liefervereinbarung: „Händler“, nicht „Vertragshändler“ (kein Vertriebsvertrag belegt).
    wording: "dealer",
    text: `Platzhirsch Home Living ist Händler von ${brandName}.`,
    evidenceUrl: null,
    evidence: "Liefervereinbarung und Bildfreigabe laut Inhaber, Firmenakten (Inhaber-Bestätigung 31.10.2026)",
    verifiedAt: "2026-10-31",
    note: "Inhaber-Entscheidungen Nr. 19 und 21. Kein öffentlicher Händlerlocator geprüft; Vertrag vor dem Deploy ablegen.",
  })),
  // Küchengeräte (Inhaber-Entscheidung Nr. 24, 31.10.2026): Händlerstatus und
  // Bildfreigabe laut Inhaber; Wortwahl „Händler“ wie bei Bad & Wellness.
  ...[
    ["gaggenau", "Gaggenau"], ["miele", "Miele"], ["v-zug", "V-ZUG"],
    ["bora", "BORA"], ["liebherr", "Liebherr"], ["quooker", "Quooker"],
  ].map(([brandSlug, brandName]) => Object.freeze({
    id: `${brandSlug}-dealer`,
    brandSlug,
    brandName,
    claim: "dealer",
    wording: "dealer",
    text: `Platzhirsch Home Living ist Händler von ${brandName}.`,
    evidenceUrl: null,
    evidence: "Liefervereinbarung/Händlerstatus und Bildfreigabe laut Inhaber, Firmenakten (Inhaber-Bestätigung 31.10.2026)",
    verifiedAt: "2026-10-31",
    note: "Inhaber-Entscheidung Nr. 24 (ersetzt Nr. 18). Kein öffentlicher Händlerlocator geprüft; Vertrag vor dem Deploy ablegen. Keine Showroom-Aussage, keine Preise.",
  })),
  // Accessoire-Welt (Inhaber-Entscheidungen Nr. 27/28, 31.10.2026): Händlerstatus
  // laut Inhaber mit den Herstellern besprochen und bestätigt, Herstellerbilder
  // erlaubt; Wortwahl „Händler“ wie bei Bad & Wellness.
  ...[
    ["baobab-collection", "Baobab Collection", 27], ["riedel", "Riedel", 28], ["cire-trudon", "Cire Trudon", 28],
  ].map(([brandSlug, brandName, nr]) => Object.freeze({
    id: `${brandSlug}-dealer`,
    brandSlug,
    brandName,
    claim: "dealer",
    wording: "dealer",
    text: `Platzhirsch Home Living ist Händler von ${brandName}.`,
    evidenceUrl: null,
    evidence: "Händlerstatus und Bildfreigabe laut Inhaber, Firmenakten (Inhaber-Bestätigung 31.10.2026)",
    verifiedAt: "2026-10-31",
    note: `Inhaber-Entscheidung Nr. ${nr}. Kein öffentlicher Händlerlocator geprüft; Bestätigung vor dem Deploy ablegen. Keine Showroom-Aussage über einzelne Produkte ohne Beleg.`,
  })),
  // Inhaber-Entscheidung Nr. 32 (31.10.2026): Händlerstatus laut Inhaber,
  // Wortwahl „Händler“ wie bei Bad & Wellness.
  ...[
    ["flos", "Flos"], ["tom-dixon", "Tom Dixon"], ["zalto", "Zalto"],
    ["assouline", "Assouline"], ["kahler", "Kähler"], ["lyngby-porcelaen", "Lyngby Porcelæn"],
  ].map(([brandSlug, brandName]) => Object.freeze({
    id: `${brandSlug}-dealer`,
    brandSlug,
    brandName,
    claim: "dealer",
    wording: "dealer",
    text: `Platzhirsch Home Living ist Händler von ${brandName}.`,
    evidenceUrl: null,
    evidence: "Händlerstatus laut Inhaber, Firmenakten (Inhaber-Bestätigung 31.10.2026)",
    verifiedAt: "2026-10-31",
    note: "Inhaber-Entscheidung Nr. 32. Kein öffentlicher Händlerlocator geprüft; Bestätigung vor dem Deploy ablegen.",
  })),
]);

/** Marken, deren Name im Text den "Marken-Kontext" herstellt. */
export const KNOWN_BRANDS = Object.freeze([
  "Minotti", "Poliform", "Rimadesio", "Flos", "Paola Lenti", "Tom Dixon",
  "ClassiCon", "Tréca", "Treca", "Eichholtz", "Gloster", "Tonon", "next125",
  "B&B Italia", "Cassina", "Vitra", "Walter Knoll", "Baxter", "Moooi",
  "Marset", "Lodes", "Roda", "Bocci", "Tuuci", "cc-tapis", "Jan Kath",
  "Living Divani", "Molteni", "Molteni&C", "Fritz Hansen", "Knoll", "Kettal",
  "Dedon", "Porro", "Flexform", "Poltrona Frau", "Giorgetti", "Gubi",
  "Artemide", "Louis Poulsen", "Vibia", "Occhio", "Bulthaup", "Next125",
  "Schüller", "Eggersmann", "Gaggenau", "Miele", "Thermador", "USM",
  "Thonet", "Hay", "Muuto", "Carl Hansen", "Ethimo", "Manutti", "Fermob",
  "Wittmann", "Rolf Benz", "COR", "de Sede", "Zanotta", "Kartell",
  "Magis", "Driade", "Edra", "Arper", "Andreu World", "Golran", "Bolia",
  "Starpool", "Soleum", "Fabio Alemanno", "Aquavia", "Aquavia Spa", "Naggura", "Dornbracht", "antoniolupi", "Agape",
  "V-ZUG", "BORA", "Liebherr", "Quooker",
  "Baobab Collection", "Riedel", "Cire Trudon",
  "Zalto", "Assouline", "Kähler", "Kahler", "Lyngby Porcelæn", "Lyngby Porcelaen",
]);

const LOCALES = ["de", "en", "fr", "it"];

// Unicode-taugliche Wortgrenzen (\b kennt kein ä/ö/ü/é).
const L = "\\p{L}\\p{N}";
const pre = `(?<![${L}])`;
const post = `(?![${L}])`;

// --- Händler-/Offiziell-Formulierungen -------------------------------------
// Bewusst als Wort-Teil (z. B. "Fachhändler", "Minotti-Händler", "Vertragshändlerin").
const DEALER_SOURCES = [
  `[${L}-]*händler[${L}]*`,
  `[${L}-]*haendler[${L}]*`,
  `offiziell[${L}]*`,
  `autorisiert[${L}]*`,
  `vertragspartner[${L}]*`,
  `vertriebspartner[${L}]*`,
  `vertrieb(?:s|e)?`,
  `exklusivpartner[${L}]*`,
  `exklusive[nmrs]? (?:[${L}-]+ )?partner(?:in|innen|s|n)?`,
  `premium-?partner(?:in|innen|s|n)?`,
  `flagship[${L}-]*`,
  // Zertifiziert/lizenziert nur als Status-Aussage ("zertifizierter Partner",
  // "von Minotti zertifiziert"), nicht als Produktangabe ("FSC-zertifiziertes Holz").
  `(?:zertifiziert|lizenziert)(?:e[nmrs]?)? (?:[${L}-]+ )?(?:partner|händler|haendler|fachhändler|fachgeschäft|fachhandel|studio|showroom|ausstellung|verkaufsstelle|vertrieb|einrichtungshaus)[${L}]*`,
  `(?:von|durch|by|par|da) (?:[${L}&-]+ ){1,3}(?:zertifiziert|lizenziert|certified|licensed|certifiée?s?|agréée?s?|certificat[oaie]|autorizzat[oaie])`,
  // EN
  `dealer(?:s|ship|ships)?`,
  `retailer(?:s)?`,
  `stockist(?:s)?`,
  `official(?:ly)?`,
  `authori[sz]ed`,
  `contract(?:ual)? partner(?:s)?`,
  `reseller(?:s)?`,
  `distributor(?:s)?`,
  `(?:exclusive|premium|certified|licensed) (?:[${L}-]+ )?(?:partner|dealer|retailer|reseller|stockist|distributor|showroom|studio|store)(?:s)?`,
  // FR
  `revendeur(?:s|se|ses)?`,
  `distributeur(?:s)?`,
  `concessionnaire(?:s)?`,
  `officiel(?:le|les|s)?`,
  `partenaire(?:s)? (?:exclusi(?:f|ve|fs|ves)|premium|privilégiée?s?|certifiée?s?|agréée?s?)`,
  `agréé(?:e|s|es)?`,
  `autorisé(?:e|s|es)?`,
  // IT
  `rivenditor[ei]`,
  `distributor[ei]`,
  `concessionari[oa]?`,
  `ufficial[ei]`,
  `partner (?:esclusiv[oi]|premium|certificat[oi])`,
  `autorizzat[oaie]`,
];
const DEALER_RE = new RegExp(`${pre}(?:${DEALER_SOURCES.join("|")})${post}`, "giu");

// Erlaubte Verwendungen von "offiziell" ohne Händler-Aussage.
const EXEMPT_RE = new RegExp(
  [
    `offizielle[nr]? (?:[${L}&-]+ ){0,2}(?:website|webseite|internetseite|homepage|regeln|teilnahmebedingungen|spielregeln)`,
    `official (?:[${L}&-]+ ){0,2}(?:website|site|web ?site|homepage|rules)`,
    `site (?:web |internet )?officiel(?: (?:de |d')?[${L}&-]+)?`,
    `règlement officiel`,
    `règles officielles`,
    `sito (?:web |internet )?ufficiale`,
    `regolamento ufficiale`,
    `regole ufficiali`,
    // Hersteller-Angaben ("offizieller Einstiegspreis", "offizielles Datenblatt").
    `offiziell(?:e[nmrs]?)? (?:[${L}&-]+ ){0,2}[${L}-]*(?:preis[${L}]*|angaben?|datenbl[aä]tt[${L}]*|verzeichnis[${L}]*|locator|produktseiten?|katalog[${L}]*)`,
    `official (?:[${L}&-]+ ){0,2}(?:price[${L}]*|list price|data ?sheet[${L}]*|catalogue|catalog|product page[${L}]*|directory|locator)`,
    // Historische Fakten ("offiziell 1970 gegründet", "officially launched in 2019").
    `offiziell(?:e[nmrs]?)? (?:[${L}.&-]+ ){0,4}(?:gegründet|eröffnet|vorgestellt|präsentiert|lanciert|eingeführt|eingeweiht|registriert|eingetragen|gestartet|enthüllt|gründung|eröffnung|markteinführung|vorstellung|premiere)`,
    `officially (?:[${L}.&-]+ ){0,3}(?:founded|opened|launched|established|introduced|presented|unveiled|registered|inaugurated|started|released)`,
    `official (?:launch|opening|founding|premiere|release|presentation|inauguration)`,
    // Meta-Wörter: sprechen ÜBER Händler-Aussagen, behaupten keine.
    `[${L}-]*h(?:ä|ae)ndler-?(?:verzeichnis|locator|suche|behauptung|status|aussage|angabe|netz|liste|seite|vertrag|vereinbarung)[${L}]*`,
    `dealer (?:locator|directory|claim[${L}]*|status|agreement)`,
    // Prüfzeichen sind Produktangaben, keine Händler-Aussagen ("von FSC zertifiziert").
    `(?:von|durch|by|par|da) (?:der |dem |den |the |la |le |l')?(?:fsc|pefc|tüv|oeko-tex|öko-tex|iso|din|gs|greenguard|blauen? engel|eu[- ]ecolabel|cradle to cradle|c2c|ral|catas|lga)(?:[${L}-]*)? (?:[${L}-]+ ){0,2}(?:zertifiziert|lizenziert|certified|licensed|certifiée?s?|certificat[oaie])`,
    // R2: Erlaubnis statt Status ("autorisés à les transmettre", "peuvent être
    // autorisés", "authorised to", "autorizzati a"), z. B. Presse- und Cookie-Texte.
    `autorisée?s? (?:à|a)`,
    `(?:être|été|sont|est|soit|soient) autorisée?s?`,
    `authori[sz]ed to`,
    `autorizzat[oaie] (?:a|ad)`,
    `(?:essere|stato|stati|sono|è|viene|vengono) autorizzat[oaie]`,
    // Herkunfts-/Echtheitsnachweis eines Produkts ("da un certificato di origine").
    `certificat[oi] (?:di |d'|d’)(?:origine|autenticità|garanzia|conformità|qualità)`,
    // Zugelassene Handwerksbetriebe bzw. zertifizierte Materialien, nicht wir als Händler
    // ("réalisés par des entreprises agréées", "teak certificato").
    `(?:entreprises?|artisans?|professionnels?|installateurs?|techniciens?|organismes?|sociétés?) (?:[${L}-]+ )?agréée?s?`,
    `(?:teak|legno|legni|legname|materiali?|tessuti?|pelle|cotone|alluminio|acciaio|marmo|vetro|lana) certificat[oaie]`,
  ]
    .map((s) => `${pre}${s}${post}`)
    .join("|"),
  "giu",
);

// --- Superlative ------------------------------------------------------------
// Feste Wendungen, die kein Superlativ sind und deren Sinn ein Ersatz zerstören
// würde: Unikat ("pièce unique", "pezzo unico", "unique piece", "one-off"),
// Einheitsgröße/-preis, Funktionsbezeichnungen ("team leader").
const SUPERLATIVE_EXEMPT_RE = new RegExp(
  [
    `pi(?:è|e)ces? uniques?`,
    `exemplaires? uniques?`,
    `mod(?:è|e)les? uniques?`,
    `(?:taille|prix|sens|tarif|guichet) unique`,
    `pezz[oi] unic[oi]`,
    `esemplar[ei] unic[oi]`,
    `(?:taglia|copia|opera) unica`,
    `(?:taglie|copie|opere) uniche`,
    `unique (?:pieces?|items?|one-offs?|copies|copy|edition)`,
    // R2: "unico/unique" im Sinn von "einzig, ein einziger" (Zahl, kein Werturteil):
    // "un unico progetto", "da un'unica mano", "unico designer", "designer unique".
    `un(?: |'|’)unic[oa]`,
    `unic[oa] (?:designer|progettista|architetto|interlocutore|referente|fornitore|responsabile)`,
    `(?:designer|architecte|interlocuteur|contact|fournisseur|responsable) unique`,
    `(?:team|project|projekt|group|gruppen|tour|workshop|squad|shift|section|band|thought|chef d'équipe et|capo|chef de)[ -]leaders?`,
    `leaders? (?:d'|di |de |of )?(?:équipe|squadra|team|projet|progetto|project)`,
  ]
    .map((s) => `${pre}${s}${post}`)
    .join("|"),
  "giu",
);

// replace: Ersatz (String oder Funktion); null = Satz wird entfernt (Rang-Claims).
const SUPERLATIVES = [
  // DE
  { id: "de-groesste", re: `gr(?:ö|oe)(?:ß|ss)t(e[nrsm]?)?`, replace: (m, s) => keepCase(m, "groß" + (s || "e")) },
  { id: "de-marktfuehrer", re: `marktf(?:ü|ue)hrer(?:in|s)?`, replace: (m) => keepCase(m, "Fachgeschäft") },
  { id: "de-fuehrend", re: `f(?:ü|ue)hrend(e[nrsm]?)?`, replace: (m, s) => keepCase(m, "renommiert" + (s || "")) },
  { id: "de-einzigartig", re: `einzigartig(e[nrsm]?)?`, replace: (m, s) => keepCase(m, "besonder" + (s || "s")) },
  { id: "de-nr1", re: `(?:nr\\.|nummer)\\s?(?:1|eins)`, replace: null },
  // EN
  { id: "en-largest", re: `(the\\s)?(?:largest|biggest)`, replace: (m, the) => keepCase(m, the ? "a large" : "large") },
  { id: "en-market-leader", re: `market[- ]leader(s)?`, replace: (m, s) => keepCase(m, "specialist" + (s || "")) },
  { id: "en-leader", re: `leader(s)?`, replace: (m, s) => keepCase(m, "specialist" + (s || "")) },
  { id: "en-leading", re: `leading(?!-)`, replace: (m) => keepCase(m, "renowned") },
  { id: "en-unique", re: `unique(ly)?`, replace: (m, ly) => keepCase(m, ly ? "distinctively" : "distinctive") },
  { id: "en-unrivalled", re: `unrivall?ed`, replace: (m) => keepCase(m, "remarkable") },
  { id: "en-number-one", re: `(?:number one|no\\.\\s?1|#1)`, replace: null },
  // FR
  { id: "fr-plus-grand", re: `(le|la|les)\\splus\\sgrand(e?s?)`, replace: (m, art, s) => keepCase(m, ({ le: "un", la: "une", les: "de" })[art.toLowerCase()] + " grand" + (s || "")) },
  { id: "fr-premier-plan", re: `de\\spremier\\splan`, replace: (m) => keepCase(m, "reconnu") },
  { id: "fr-leader", re: `leader(s)?`, replace: (m, s) => keepCase(m, "spécialiste" + (s || "")) },
  { id: "fr-unique", re: `unique(s)?`, replace: (m, s) => keepCase(m, "remarquable" + (s || "")) },
  { id: "fr-numero1", re: `(?:numéro|n°)\\s?(?:1|un)`, replace: null },
  // IT
  { id: "it-piu-grande", re: `(il|la|i|le)\\spiù\\sgrand([ei])`, replace: (m, art, s) => keepCase(m, ({ il: "un grande", la: "una grande", i: "grandi", le: "grandi" })[art.toLowerCase()] ?? "grand" + s) },
  { id: "it-leader", re: `leader`, replace: (m) => keepCase(m, "specialista") },
  { id: "it-unico", re: `unic([oaie]|he)`, replace: (m, s) => keepCase(m, s === "o" || s === "a" ? "speciale" : "speciali") },
  { id: "it-numero1", re: `(?:numero|n\\.)\\s?(?:1|uno)`, replace: null },
].map((s) => ({ ...s, lang: s.id.slice(0, 2), regex: new RegExp(`${pre}${s.re}${post}`, "giu") }));

// Muster der Zielsprache zuerst anwenden ("unique" ist EN und FR, "leader" EN/FR/IT).
function superlativesFor(locale) {
  return [...SUPERLATIVES.filter((s) => s.lang === locale), ...SUPERLATIVES.filter((s) => s.lang !== locale)];
}

// Groß-/Kleinschreibung des Originals übernehmen.
function keepCase(original, replacement) {
  if (!original) return replacement;
  if (original === original.toUpperCase() && /\p{L}{2}/u.test(original)) return replacement.toUpperCase();
  const first = original.charAt(0);
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement.charAt(0).toLowerCase() + replacement.slice(1);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normiert einen Marken-Namen bzw. Slug ("Tréca" -> "treca", "Paola Lenti" -> "paola-lenti"). */
export function toBrandSlug(name) {
  return String(name ?? "")
    // Ligaturen zerfallen bei NFD nicht ("Lyngby Porcelæn" -> "lyngby-porcelaen").
    .replace(/æ/g, "ae").replace(/Æ/g, "Ae").replace(/œ/g, "oe").replace(/Œ/g, "Oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Andere Schreibweisen derselben belegten Marke (Backoffice-Name ↔ Katalog-Slug).
 * Nur Aliase, keine neuen Belege: das Ziel muss im Register stehen.
 */
export const DEALER_BRAND_ALIASES = Object.freeze({ baobab: "baobab-collection" });
const canonicalDealerSlug = (brandSlugOrName) => {
  const slug = toBrandSlug(brandSlugOrName);
  return DEALER_BRAND_ALIASES[slug] || slug;
};

export function isVerifiedDealerBrand(brandSlugOrName) {
  return VERIFIED_DEALER_BRANDS.includes(canonicalDealerSlug(brandSlugOrName));
}

function brandRegex(names) {
  const list = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length).map(escapeRe);
  return new RegExp(`${pre}(?:${list.join("|")})(?![\\p{L}])`, "giu");
}
const DEFAULT_BRAND_RE = brandRegex(KNOWN_BRANDS);

/** Marken, die in einem Satz genannt werden (als Slugs). */
export function brandsIn(sentence, extraBrands = []) {
  const re = extraBrands.length ? brandRegex([...KNOWN_BRANDS, ...extraBrands]) : DEFAULT_BRAND_RE;
  re.lastIndex = 0;
  const found = new Set();
  for (const m of sentence.matchAll(re)) found.add(toBrandSlug(m[0]));
  return [...found];
}

// Satz-Trenner: Satzzeichen + Leerraum + Großbuchstabe/Anführung, aber nicht
// nach üblichen Abkürzungen ("z. B.", "Nr.", "ca."). Zeilenumbrüche trennen immer.
const SENTENCE_SPLIT_RE =
  /(?<=[.!?…])(?<!(?:^|[\s(])(?:\p{L}|bzw|ca|Nr|No|inkl|evtl|usw|etc|St|Dr|vgl|ggf)\.)\s+(?=[\p{Lu}"„«“‚(\d])|\n+/u;

/** Teilt Text in Sätze; Trennzeichen bleiben erhalten, join("") ergibt das Original. */
export function splitSentences(text) {
  const out = [];
  const re = new RegExp(SENTENCE_SPLIT_RE.source, "gu");
  let last = 0;
  for (const m of String(text).matchAll(re)) {
    out.push({ text: text.slice(last, m.index), sep: m[0] });
    last = m.index + m[0].length;
  }
  out.push({ text: text.slice(last), sep: "" });
  return out;
}

function maskExempt(sentence) {
  return sentence.replace(EXEMPT_RE, (m) => " ".repeat(m.length));
}

function maskSuperlativeExempt(sentence) {
  return sentence.replace(SUPERLATIVE_EXEMPT_RE, (m) => " ".repeat(m.length));
}

// Geschützte Wendungen für die Ersetzung durch Platzhalter tauschen und danach
// zurücksetzen (die Ersetzung ändert Längen, deshalb kein Maskieren mit Leerzeichen).
const PROTECT_OPEN = "";
const PROTECT_CLOSE = "";
function protectSuperlativeExempt(sentence, store) {
  return sentence.replace(SUPERLATIVE_EXEMPT_RE, (m) => {
    store.push(m);
    return `${PROTECT_OPEN}${store.length - 1}${PROTECT_CLOSE}`;
  });
}
function restoreProtected(text, store) {
  return text.replace(new RegExp(`${PROTECT_OPEN}(\\d+)${PROTECT_CLOSE}`, "g"), (_, i) => store[Number(i)]);
}

/** Rohe Treffer für Händler-Wörter in einem Satz (ohne Kontextprüfung). */
function dealerHits(sentence) {
  const masked = maskExempt(sentence);
  DEALER_RE.lastIndex = 0;
  return [...masked.matchAll(DEALER_RE)].map((m) => ({ match: m[0], index: m.index }));
}

/**
 * Findet Claim-Verstöße in einem Text.
 * @param {string} text
 * @param {{brandSlug?: string, brands?: string[]}} [opts] brandSlug = Text steht im
 *   Kontext dieser Marke (z. B. Markenseite); brands = zusätzliche Markennamen.
 * @returns {{type:'dealer'|'superlative', id:string, match:string, sentence:string, brands:string[]}[]}
 */
export function findClaims(text, opts = {}) {
  const { brandSlug, brands = [] } = opts;
  const findings = [];
  if (!text || typeof text !== "string") return findings;
  const ctxSlug = brandSlug ? toBrandSlug(brandSlug) : null;

  for (const { text: sentence } of splitSentences(text)) {
    if (!sentence.trim()) continue;
    // Händler-Claims: nur im Marken-Kontext.
    const hits = dealerHits(sentence);
    if (hits.length) {
      const named = brandsIn(sentence, brands);
      const compound = hits.some((h) => /[\p{L}\p{N}]-(?:händler|haendler)/iu.test(h.match));
      const context = ctxSlug ? [ctxSlug, ...named] : named;
      if (context.length || compound) {
        const unverified = context.filter((s) => !VERIFIED_DEALER_BRANDS.includes(s));
        // Nur belegte Marken genannt -> erlaubt. Kompositum ohne erkannte Marke -> Verstoß.
        if (unverified.length || (!context.length && compound)) {
          for (const h of hits) {
            findings.push({ type: "dealer", id: "dealer", match: h.match, sentence: sentence.trim(), brands: unverified });
          }
        }
      }
    }
    // Superlative: immer (gleiche Fundstelle nur einmal, z. B. "unique" EN/FR).
    const seen = new Set();
    const supMasked = maskSuperlativeExempt(sentence);
    for (const s of superlativesFor(opts.locale || guessLocale(sentence))) {
      s.regex.lastIndex = 0;
      for (const m of supMasked.matchAll(s.regex)) {
        const key = `${m.index}:${m[0].length}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({ type: "superlative", id: s.id, match: m[0], sentence: sentence.trim(), brands: [] });
      }
    }
  }
  return findings;
}

// --- Unbelegte Werbeaussagen in Herstellertexten (Runde 2, recht P1-1/P1-2) --
// Diese Wörter sind nicht immer Superlative, in übernommenen Herstellertexten
// aber fast immer ungeprüfte Tatsachen- oder Qualitätsbehauptungen, die wir uns
// zu eigen machen würden (§ 2 UWG): „perfekte Proportionen“, „Gefertigt
// ausschließlich in Italien“, „traditioneller Exzellenz“, „weltweit“.
// Nur für Herstellerprosa (story, craft, approach; manufacturerText.js), NICHT
// für eigene Texte (Datenschutz: „ausschließlich technisch notwendige …“).
const UNPROVEN_CLAIM_SOURCES = [
  // DE
  `perfekt[${L}]*`,
  `perfektion[${L}]*`,
  `exzellen[${L}]*`,
  `ausschlie(?:ß|ss)lich`,
  `weltweit[${L}]*`,
  `weltbekannt[${L}]*`,
  // EN
  `perfect(?:ly|ion|ed)?`,
  `excellence`,
  `exclusively`,
  `worldwide`,
  `world-?famous`,
  // FR
  `parfait(?:e|s|es|ement)?`,
  `perfection`,
  `exclusivement`,
  `dans le monde entier`,
  `mondialement`,
  // IT
  `perfett(?:[oaie]|amente)`,
  `perfezione`,
  `eccellenz[ae]`,
  `esclusivamente`,
  `in tutto il mondo`,
];
const UNPROVEN_CLAIM_RE = new RegExp(`${pre}(?:${UNPROVEN_CLAIM_SOURCES.join("|")})${post}`, "iu");

/** true, wenn der Text perfekt*, Perfektion, Exzellenz, ausschließlich, weltweit (DE/EN/FR/IT) enthält. */
export function hasUnprovenClaim(text) {
  return typeof text === "string" && UNPROVEN_CLAIM_RE.test(text);
}

// Pauschales Länderversprechen („liefern in ganz Österreich“), Entscheidung Nr. 3:
// Lieferung und Montage nur „auf Wunsch“/„auf Anfrage“.
const COUNTRY_PROMISE_RE = new RegExp(
  [
    `in ganz (?:österreich|oesterreich|deutschland|europa|der schweiz|liechtenstein)`,
    `(?:österreich|oesterreich|europa|deutschland)weit`,
    `(?:throughout|across|all over) (?:austria|germany|europe|switzerland)`,
    `nationwide`,
    `(?:dans|à travers) toute l['’]?(?:autriche|allemagne|europe|suisse)`,
    `partout en (?:autriche|allemagne|europe|suisse)`,
    `in tutta (?:l['’])?(?:austria|germania|europa|svizzera)`,
  ]
    .map((s) => `${pre}${s}${post}`)
    .join("|"),
  "iu",
);
const ON_REQUEST_RE = /auf (?:wunsch|anfrage)|on request|upon request|sur demande|su richiesta/iu;

/** true, wenn der Text ein Länderversprechen ohne „auf Wunsch/auf Anfrage“ macht. */
export function hasCountryPromise(text) {
  return typeof text === "string" && COUNTRY_PROMISE_RE.test(text) && !ON_REQUEST_RE.test(text);
}

// R8 (recht P0-2, Entscheidung Nr. 3): Länderversprechen in Backoffice-Sätzen
// werden nicht nur erkannt, sondern ersetzt – „bis zur Lieferung und Montage in
// ganz Österreich“ → „bis zur Lieferung und Montage auf Wunsch“. Ketten wie
// „in ganz Österreich und der Schweiz“ fallen als Ganzes weg. Je Sprache die
// Formulierung der Entscheidung („auf Wunsch“).
const C_DE = String.raw`(?:österreich|oesterreich|deutschland|europa|der schweiz|die schweiz|schweiz|liechtenstein|südtirol|italien)`;
const C_EN = String.raw`(?:austria|germany|europe|switzerland|liechtenstein|italy)`;
const C_FR = String.raw`(?:l['’]\s?)?(?:autriche|allemagne|europe|suisse|liechtenstein|italie)`;
const C_IT = String.raw`(?:l['’]\s?)?(?:austria|germania|europa|svizzera|liechtenstein|italia)`;
const chain = (c, and) => String.raw`(?:(?:,|\s+(?:${and}))\s+(?:(?:in|nach|en)\s+)?(?:ganz\s+|tutta\s+|toute\s+)?(?:(?:la|le|les)\s+)?${c})*`;
const SOFTEN = [
  {
    re: new RegExp(String.raw`${pre}(?:in ganz ${C_DE}${chain(C_DE, "und|sowie|oder")}|(?:österreich|oesterreich|europa|deutschland|welt)weit)${post}`, "giu"),
    by: "auf Wunsch",
  },
  { re: new RegExp(String.raw`${pre}(?:(?:throughout|across|all over) ${C_EN}${chain(C_EN, "and|or")}|nationwide|worldwide)${post}`, "giu"), by: "on request" },
  {
    re: new RegExp(String.raw`${pre}(?:(?:dans|à travers) toute ${C_FR}${chain(C_FR, "et|ou")}|partout en ${C_FR}|dans le monde entier)${post}`, "giu"),
    by: "sur demande",
  },
  { re: new RegExp(String.raw`${pre}(?:in tutta ${C_IT}${chain(C_IT, "e|o")}|in tutto il mondo)${post}`, "giu"), by: "su richiesta" },
];

/**
 * Ersetzt pauschale Länder-/Weltversprechen eines Satzes durch „auf Wunsch“
 * (on request / sur demande / su richiesta). Alle vier Sprachmuster greifen,
 * damit auch ein deutscher Satz auf /en bereinigt wird.
 * @param {string} text
 * @returns {string}
 */
export function softenCountryPromise(text) {
  if (typeof text !== "string" || !text) return text;
  let out = text;
  for (const { re, by } of SOFTEN) out = out.replace(re, by);
  // doppelte Ersetzung („auf Wunsch, auf Wunsch“) zusammenfassen
  return out.replace(/(auf Wunsch|on request|sur demande|su richiesta)(?:\s*,?\s*\1)+/giu, "$1").replace(/\s{2,}/g, " ");
}

/** true, wenn der Text eine Händler-/Offiziell-Formulierung enthält (außer "Offizielle Website/Regeln").
 *  Mit brandSlug einer belegten Marke (ClassiCon) immer false. */
export function hasDealerClaim(text, brandSlug) {
  if (!text || typeof text !== "string") return false;
  if (brandSlug && isVerifiedDealerBrand(brandSlug)) return false;
  return splitSentences(text).some(({ text: s }) => dealerHits(s).length > 0);
}

const NEUTRAL = {
  de: (b) => `${b} in unserer Ausstellung in Lochau`,
  en: (b) => `${b} in our showroom in Lochau`,
  fr: (b) => `${b} dans notre showroom à Lochau`,
  it: (b) => `${b} nel nostro showroom a Lochau`,
};

// Händler-Satz der belegten Marken (CLAIM_REGISTER) in vier Sprachen. Ersetzt
// Backoffice-Sätze wie „Ihr offizieller ClassiCon Händler in Vorarlberg“: kein
// „offiziell“, kein Gebiet, das nach Exklusivität klingt (recht P2-8).
// Wortwahl je Register-Eintrag (wording): "contract" = Vertragshändler
// (ClassiCon, Ezarri), "dealer" = Händler (Liefervereinbarung, Bad & Wellness),
// "studio" = eigener, belegter Wortlaut im Eintrag (statement, Minotti).
// EN/FR/IT haben nur ein Wort für beide Händler-Arten.
const DEALER_NOUN_DE = { contract: "Vertragshändler", dealer: "Händler" };
const DEALER_STATEMENT = {
  de: (b, wording = "contract") => `Platzhirsch Home Living ist ${DEALER_NOUN_DE[wording] || DEALER_NOUN_DE.contract} von ${b}.`,
  // Welle 2: "an Ezarri dealer" (article before a vowel), "a ClassiCon dealer".
  en: (b) => `Platzhirsch Home Living is ${/^[AEIOU]/i.test(b) ? "an" : "a"} ${b} dealer.`,
  fr: (b) => `Platzhirsch Home Living est revendeur ${b}.`,
  it: (b) => `Platzhirsch Home Living è rivenditore ${b}.`,
};

/** Wort für den Händlerstatus belegter Marken in Titeln (src/lib/marken/brandTitle.js). */
export const DEALER_TITLE_WORD = Object.freeze({ de: "Vertragshändler", en: "dealer", fr: "revendeur", it: "rivenditore" });

const registerEntry = (brandSlugOrName) => {
  const slug = canonicalDealerSlug(brandSlugOrName);
  return CLAIM_REGISTER.find((c) => c.brandSlug === slug && c.claim === "dealer") || null;
};
const wordingOf = (entry) => entry?.wording || "contract";

/** Titel-Wort einer belegten Marke („Vertragshändler“/„Händler“ bzw. dealer …), sonst "". */
export function dealerTitleWord(brandSlugOrName, locale = "de") {
  const entry = registerEntry(brandSlugOrName);
  if (!entry || wordingOf(entry) === "studio") return "";
  if (locale === "de" || !DEALER_TITLE_WORD[locale]) return DEALER_NOUN_DE[wordingOf(entry)];
  return DEALER_TITLE_WORD[locale];
}

/**
 * Belegter Studio-Wortlaut einer Marke (Inhaber-Entscheidung Nr. 22: Minotti),
 * sonst null: { title, statement, pageTitle, evidenceUrl, showEvidenceLink }.
 */
export function dealerStudio(brandSlugOrName, locale = "de") {
  const entry = registerEntry(brandSlugOrName);
  if (!entry || wordingOf(entry) !== "studio") return null;
  const pick = (o) => (o ? o[locale] || o.de : "");
  return {
    title: pick(entry.title),
    statement: pick(entry.statement),
    pageTitle: entry.pageTitle || "",
    evidenceUrl: entry.evidenceUrl || null,
    showEvidenceLink: Boolean(entry.showEvidenceLink && entry.evidenceUrl),
  };
}

const AND = { de: "und", en: "and", fr: "et", it: "e" };
// Italienisch: „ed“ vor Vokal („ClassiCon ed Ezarri“).
const joinList = (names, and) => {
  if (names.length < 2) return names[0];
  const last = names[names.length - 1];
  const conj = and === "e" && /^[aeiouàèéìòù]/i.test(last) ? "ed" : and;
  return `${names.slice(0, -1).join(", ")} ${conj} ${last}`;
};

/** Händler-Sätze aller belegten Marken (llms.txt), aus CLAIM_REGISTER:
 *  „Platzhirsch Home Living ist Vertragshändler von ClassiCon und Ezarri und Händler von Starpool, … . Minotti hat 2019 …“ */
export function verifiedDealersSentence() {
  const dealers = CLAIM_REGISTER.filter((c) => c.claim === "dealer");
  const by = (w) => dealers.filter((c) => wordingOf(c) === w).map((c) => c.brandName);
  const parts = [
    by("contract").length && `${DEALER_NOUN_DE.contract} von ${joinList(by("contract"), "und")}`,
    by("dealer").length && `${DEALER_NOUN_DE.dealer} von ${joinList(by("dealer"), "und")}`,
  ].filter(Boolean);
  const studios = dealers.filter((c) => wordingOf(c) === "studio").map((c) => c.statement?.de).filter(Boolean);
  return [parts.length ? `Platzhirsch Home Living ist ${parts.join(" und ")}.` : "", ...studios].filter(Boolean).join(" ");
}

/** Händler-Satz für eine belegte Marke (Studio-Marken: belegter Wortlaut), sonst "". */
export function dealerStatement(brandSlugOrName, locale = "de") {
  const entry = registerEntry(brandSlugOrName);
  if (!entry) return "";
  if (wordingOf(entry) === "studio") return entry.statement?.[locale] || entry.statement?.de || "";
  return (DEALER_STATEMENT[locale] || DEALER_STATEMENT.de)(entry.brandName, wordingOf(entry));
}

/** Ein Händler-Satz für mehrere belegte Marken („… Vertragshändler von ClassiCon und Ezarri.“).
 *  Nicht belegte Marken fallen still heraus; ohne belegte Marke "". (Welle 2)
 *  Marken mit eigener Wortwahl („Händler“, Studio) bekommen ihren eigenen Satz. */
export function dealerStatementList(brandSlugsOrNames, locale = "de") {
  const entries = [...new Set((brandSlugsOrNames || []).map(registerEntry).filter(Boolean))];
  if (!entries.length) return "";
  const and = AND[locale] || AND.de;
  const sentences = [];
  for (const w of ["contract", "dealer"]) {
    const names = entries.filter((c) => wordingOf(c) === w).map((c) => c.brandName);
    if (names.length) sentences.push((DEALER_STATEMENT[locale] || DEALER_STATEMENT.de)(joinList(names, and), w));
  }
  for (const c of entries.filter((e) => wordingOf(e) === "studio")) sentences.push(dealerStatement(c.brandSlug, locale));
  return sentences.filter(Boolean).join(" ");
}

/** Neutrale Ersatzformulierung: "[Marke] in unserer Ausstellung in Lochau" (de/en/fr/it). */
export function neutralDealerText(brandName, locale = "de") {
  const loc = LOCALES.includes(locale) ? locale : "de";
  const name = String(brandName ?? "").trim() || { de: "Die Marke", en: "The brand", fr: "La marque", it: "Il marchio" }[loc];
  return NEUTRAL[loc](name);
}

function guessLocale(text) {
  const t = ` ${text.toLowerCase()} `;
  const score = {
    de: (t.match(/ (und|der|die|das|ihr|unser|wir|für|mit) /g) || []).length,
    en: (t.match(/ (and|the|your|our|we|for|with) /g) || []).length,
    fr: (t.match(/ (et|le|la|les|votre|notre|nous|pour|avec|des) /g) || []).length,
    it: (t.match(/ (e|il|la|le|vostro|nostro|noi|per|con|dei) /g) || []).length,
  };
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(score).sort((a, b) => b[1] - a[1])[0][0]
    : "de";
}

function displayName(slug, sentence) {
  const fromText = KNOWN_BRANDS.find((b) => toBrandSlug(b) === slug && sentence.toLowerCase().includes(b.toLowerCase()));
  if (fromText) return fromText;
  const known = KNOWN_BRANDS.find((b) => toBrandSlug(b) === slug);
  if (known) return known;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const TAG = "\uE000"; // Platzhalter für Inline-HTML-Tags (bleiben vollständig erhalten)
const BLOCK_TAG_RE =
  /(<\/?(?:p|div|li|ul|ol|h[1-6]|br|hr|section|article|blockquote|table|thead|tbody|tfoot|tr|td|th|dl|dt|dd|figure|figcaption|header|footer|aside|nav|main|pre)\b[^>]*>)/i;
const HTML_RE = /<\/?[a-z][^>]*>/i;

// Bereinigt reinen Text (ggf. mit TAG-Platzhaltern). state.neutralUsed gilt über den ganzen Eingabetext.
function sanitizePlain(text, ctxSlug, locale, opts, state) {
  const out = [];
  for (const part of splitSentences(text)) {
    let sentence = part.text;
    // Tags eines ersetzten oder entfernten Satzes bleiben erhalten (keine kaputte Verschachtelung).
    const tags = (sentence.match(new RegExp(TAG, "g")) || []).join("");
    const plain = sentence.replaceAll(TAG, "");
    const dealer = findClaims(plain, { brandSlug: ctxSlug ?? undefined, brands: opts.brands }).filter((f) => f.type === "dealer");
    if (dealer.length) {
      const slug = dealer[0].brands[0] || ctxSlug;
      const name = slug && slug === ctxSlug && opts.brandName ? opts.brandName : slug ? displayName(slug, plain) : "";
      const trailing = (plain.match(/([.!?…:])\s*$/) || ["", ""])[1];
      if (!state.neutralUsed) {
        const lead = plain.match(/^\s*/)[0];
        sentence = lead + neutralDealerText(name, locale) + trailing + tags;
        state.neutralUsed = true;
      } else {
        sentence = tags;
      }
    }
    const store = [];
    sentence = protectSuperlativeExempt(sentence, store);
    let dropSentence = false;
    for (const s of superlativesFor(locale)) {
      s.regex.lastIndex = 0;
      if (!s.regex.test(sentence)) continue;
      if (s.replace === null) {
        dropSentence = true;
        break;
      }
      s.regex.lastIndex = 0;
      // args: match, ...groups, offset, input
      sentence = sentence.replace(s.regex, (...args) => s.replace(...args.slice(0, -2)));
    }
    sentence = restoreProtected(sentence, store);
    if (dropSentence) sentence = tags;
    out.push(sentence.replaceAll(TAG, "").trim() ? sentence + part.sep : sentence);
  }
  return out
    .join("")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1");
}

/**
 * Entfernt bzw. neutralisiert Claims.
 * - Händler-/Offiziell-/Autorisiert-/Vertragspartner-/Exklusiv-/Premium-Partner-/
 *   Zertifiziert-/Flagship-Sätze im Marken-Kontext einer nicht belegten Marke
 *   werden durch neutralDealerText(Marke, locale) ersetzt (pro Text höchstens
 *   einmal, weitere solche Sätze entfallen).
 * - Superlative werden durch neutrale Wörter ersetzt; Rang-Claims
 *   ("Nr. 1", "number one", "numéro 1", "numero uno") entfernen den Satz.
 *   Feste Wendungen bleiben ("pièce unique", "pezzo unico", "team leader").
 * - "Offizielle Website/Regeln", "offiziell 1970 gegründet" bleiben stehen.
 *   ClassiCon-Händlersätze bleiben.
 * - HTML (Backoffice-Richtext) ist erlaubt: Block-Tags (<p>, <li>, <br>, <h2> …)
 *   trennen Sätze, alle Tags bleiben erhalten; nur Text wird verändert.
 * @param {string} text Klartext oder HTML
 * @param {string} [brandSlug] Slug der Marke, in deren Kontext der Text steht.
 * @param {{locale?: 'de'|'en'|'fr'|'it', brandName?: string, brands?: string[]}} [opts]
 */
export function sanitizeClaims(text, brandSlug, opts = {}) {
  if (!text || typeof text !== "string") return text ?? "";
  const ctxSlug = brandSlug ? toBrandSlug(brandSlug) : null;
  const locale = opts.locale && LOCALES.includes(opts.locale) ? opts.locale : guessLocale(text.replace(/<[^>]+>/g, " "));
  const state = { neutralUsed: false };

  if (!HTML_RE.test(text)) {
    return sanitizePlain(text.replaceAll(TAG, ""), ctxSlug, locale, opts, state)
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
  }

  // HTML: an Block-Tags teilen (ungerade Indizes = Tags), Inline-Tags als Platzhalter.
  return text
    .split(new RegExp(BLOCK_TAG_RE.source, "gi"))
    .map((chunk, i) => {
      if (i % 2 === 1 || !chunk.trim()) return chunk;
      const inline = [];
      const masked = chunk.replaceAll(TAG, "").replace(/<[^>]*>/g, (m) => (inline.push(m), TAG));
      const lead = masked.match(/^\s*/)[0];
      const tail = masked.match(/\s*$/)[0];
      const body = sanitizePlain(masked.trim(), ctxSlug, locale, opts, state).trim();
      let k = 0;
      return (lead + body + tail).replace(new RegExp(TAG, "g"), () => inline[k++] ?? "");
    })
    .join("");
}
