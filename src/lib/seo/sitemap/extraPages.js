// src/lib/seo/sitemap/extraPages.js
// German-only pages that are indexable today but are not in LANDING_PAGES
// (src/lib/content/landingPages.js, owned by the regions package and not
// edited here). getStaticEntries() lists them in /sitemap-static.xml and
// /llms.txt lists them under "Regionen und Leistungen".
//
// Rules (R1-seo, Marktresearch/digital/teamleiter/r1-R1-seo.md):
// - Only pages checked on 26.10.2026 with curl: HTTP 200, <meta robots
//   "index, follow">, canonical pointing at the page itself.
// - Region pages only when the doorway audit found at least 4 facts that no
//   other region page has (`facts`, checked by tests/unit/sitemap.test.mjs
//   against src/lib/seo/sitemap/doorwayAudit.js).
//   Kempten (2) and Ravensburg (3) are left out until they have more.
// - /outdoor-gartenplanung is noindex until the legal review → not listed.
// - /yacht-interior is indexable again since the integration (Inhaber-
//   Entscheidung Nr. 9): the Navetta 42 chapter is left out until Minotti and
//   Custom Line release the photos (src/lib/yacht/navetta.js). llms line = the
//   page's schema.description.
// - Former /labs pages at their fixed URLs (integration 28.10.2026, kind
//   "werkzeug"): index, follow, canonical to themselves. Not listed: /upload
//   and /portal (service and login pages stay noindex, SEO-Gutachten P1),
//   /arbeitsweise (noindex until Harald's real material is there,
//   robotsForLaunch), /showroom (own rule, showroomSitemapPaths()), Ezarri
//   (own list, getEzarriEntries()).
// - `lastModified` = the date the page file really changed (the files are
//   untracked, so the file modification date). Never new Date(). Bump it when
//   the page's copy changes.
// - German only: the other locales 404, so no hreflang alternates – EXCEPT
//   entries with `locales` (Welle 2, Inhaber Nr. 13: Yacht and Sofaplaner
//   also in English): listed once per locale with hreflang de/en/x-default.
// - MULTILINGUAL_PAGES (below): new pages in several languages that are not
//   German-only (Hotel & Objekt, Architekten); same listing rule.
// - `llms` is one factual line for /llms.txt: no dealer claims, no superlatives.
// Once a page moves into LANDING_PAGES it is skipped here automatically
// (getStaticEntries de-duplicates by path); then delete it from this list.
//
// Runde 2 (technik P1-7/P2-9, seo P0-1/P1-3/P1-4, recht P1-3):
// - /arbeitsweise (Kern-USP) is listed as soon as the page is index,follow
//   (robotsForLaunch() in src/lib/arbeitsweise/media.js – the same switch).
// - /concierge only while the concierge really answers (rule "concierge",
//   conciergeIndexable() in src/lib/concierge/config.js), otherwise the page
//   is noindex and must not be in sitemap or llms.txt.
// - The /ki-assistenten line names the appointment request only while
//   request_appointment is offered (APPOINTMENT_OFFERED, src/lib/agent/tools.js,
//   like instructionsFor() in jsonrpc.js).
// Callers use visibleExtraPages({ conciergeAvailable, appointmentOffered }).
//
// Pure module (relative imports only), so node --test can load it.
import { robotsForLaunch } from "../../arbeitsweise/media.js";
import { SOURCE_COPY, sourceCopyFor } from "../../sofaplaner/consent.js";
import { katalogPfade, produkteByKategorie, produkteByMarke, produkteByWelt, produktBySlug, letzterStand } from "../../katalog/index.js";

/** llms line of /ki-assistenten, depending on the appointment switch. */
export function kiAssistentenLlms(appointmentOffered = false) {
  return appointmentOffered
    ? "Katalog, Showroom, Arbeitsweise, Ezarri-Glasmosaik und Terminwunsch als Werkzeuge; Endpunkt https://platzhirsch.studio/api/agent/mcp"
    : "Katalog, Showroom, Arbeitsweise und Ezarri-Glasmosaik als Werkzeuge; Termin über die Terminanfrage https://platzhirsch.studio/de/beratung; Endpunkt https://platzhirsch.studio/api/agent/mcp";
}

export const EXTRA_PAGES = [
  {
    path: "/arbeitsweise",
    kind: "leistung",
    label: "Arbeitsweise: von der Handzeichnung zum Rendering",
    lastModified: "2026-11-02", // QM-Endabnahme 02.11.: page.js angepasst (vorher 30.10. Rat 9,5 A15 fitTitle/clampDescription)
    rule: "arbeitsweise",
    // Rat 9,5 A1 (T6): die Seite ist in allen vier Sprachen index,follow mit
    // eigener Canonical → einmal je Sprache in sitemap-static mit hreflang.
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "How we work: from hand drawing to rendering",
      llms: "How Harald Menghin plans: first meeting, survey on site, hand drawing, scale model, 3D planning, photorealistic rendering, implementation.",
    },
    llms: "Wie Harald Menghin plant: Kennenlernen, Aufnahme vor Ort, Handzeichnung, Raummodell im Maßstab, 3D-Planung, fotorealistisches Rendering, Umsetzung.",
  },
  {
    path: "/yacht-interior",
    kind: "leistung",
    label: "Yacht-Interieur am Bodensee", // Schreibweise wie H1 und Navigation
    lastModified: "2026-11-03", // 03.11.: KI-Bilder entfernt (Inhaber-Entscheidung Nr. 42); vorher 02.11. QM-Endabnahme, 01.11. FR/IT, 31.10. texte-seo-ki
    locales: ["de", "en", "fr", "it"], // Welle 2 EN, seit 01.11.2026 auch FR/IT (yachtLanguages())
    // English line for /llms.txt (same facts as the German page, en-yacht-sofa-bau.md).
    en: {
      label: "Yacht interior design on Lake Constance",
      llms: "Yacht interior design and boat furnishing for owners, boatyards and marine upholsterers on Lake Constance – deck, saloon, cabins and boathouse with outdoor furniture, fabrics and light, concept drawn by hand. Measuring, making and fitting by marine upholsterer and yard; Platzhirsch coordinates the dates. Visits on board, in winter storage or at the Lochau showroom.",
    },
    llms: "Yacht-Interieur und Bootsausstattung für Eigner, Werften und Bootssattler am Bodensee – Deck, Salon, Kabinen und Bootshaus mit Outdoor-Möbeln, Stoffen und Licht, Konzept von Hand gezeichnet. Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft; Platzhirsch koordiniert die Termine. Termin an Bord, im Winterlager oder im Showroom Lochau.",
  },
  {
    // Rat 9,5 B15 (T6): Regionen-Hub, Elternseite der Regionsseiten (src/lib/seo/regionen.js).
    path: "/regionen",
    kind: "hub",
    label: "Regionen: Einrichten im Dreiländereck",
    lastModified: "2026-11-02", // QM-Endabnahme 02.11.: page.js angepasst
    llms: "Übersicht der Regionsseiten für Vorarlberg, den deutschen Bodensee, die Ostschweiz und Liechtenstein, mit Anfahrt nach Lochau.",
  },
  {
    path: "/leistungen",
    kind: "werkzeug",
    label: "Leistungen und Planer online",
    lastModified: "2026-11-02", // Sprach-Integration: EN/FR/IT (landingKern/leistungen.js)
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Services and online planners",
      llms: "Overview: advice, how we work from hand drawing to rendering, online planners, 3D views and services.",
    },
    llms: "Überblick: Beratung, Arbeitsweise von der Handzeichnung zum Rendering, Online-Planer, 3D-Ansichten und Services.",
  },
  {
    // SEO-Landingpage Outdoor-Küche (02.11.2026): DE Master in page.js, EN/FR/IT
    // über landingKern/outdoorKueche.js – index, follow, eigene Canonical je
    // Sprache, hreflang reziprok (kein Eintrag in deOnlyRedirects.cjs).
    // Markenneutral, kein Händlersatz, keine Preise.
    path: "/outdoor-kueche",
    kind: "leistung",
    label: "Outdoor-Küche planen in Vorarlberg",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Outdoor kitchens in Vorarlberg",
      llms: "Outdoor kitchens made to measure for garden and terrace, drawn by hand in Lochau and planned in 3D; grill, hob, sink and cooling planned in; delivery and installation on request, Switzerland with export and customs clearance.",
    },
    llms: "Outdoor-Küchen nach Maß für Garten und Terrasse, in Lochau von Hand gezeichnet und in 3D geplant; Grill, Kochfeld, Spüle und Kühlung eingeplant; Lieferung und Montage auf Wunsch, Schweiz mit Ausfuhr und Verzollung.",
  },
  // Kaufwörter-Seiten Bad & Wellness (02.11.2026): DE Master in page.js, EN/FR/IT
  // über landingKern/whirlpool.js, swimspa.js, sauna.js – index, follow, eigene
  // Canonical je Sprache, hreflang reziprok (kein Eintrag in deOnlyRedirects.cjs).
  // Händlersatz nur über den Claim-Guard auf der Seite, hier markenneutral; keine Preise.
  {
    path: "/whirlpool-kaufen",
    kind: "leistung",
    label: "Whirlpool kaufen in Vorarlberg",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Buy a hot tub in Vorarlberg",
      llms: "Outdoor hot tub and private spa with Aquavia Spa and Starpool, drawn by hand in Lochau and planned in 3D with base and connections; delivery and installation on request in Austria, Germany, Switzerland and Liechtenstein, Switzerland with export and customs clearance.",
    },
    llms: "Outdoor-Whirlpool und Privat-Spa mit Aquavia Spa und Starpool, in Lochau von Hand gezeichnet und in 3D mit Untergrund und Anschlüssen geplant; Lieferung und Montage auf Anfrage in Österreich, Deutschland, der Schweiz und Liechtenstein, Schweiz mit Ausfuhr und Verzollung.",
  },
  {
    path: "/swim-spa",
    kind: "leistung",
    label: "Swim Spa kaufen in Vorarlberg",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Buy a swim spa in Vorarlberg",
      llms: "Swim spas by Aquavia Spa with counter-current system, 400 to 600 cm long, for garden and home, drawn by hand in Lochau and planned in 3D; delivery and installation on request in Austria, Germany, Switzerland and Liechtenstein, Switzerland with export and customs clearance.",
    },
    llms: "Swimspas von Aquavia Spa mit Gegenstromanlage, 400 bis 600 cm lang, für Garten und Haus, in Lochau von Hand gezeichnet und in 3D geplant; Lieferung und Montage auf Anfrage in Österreich, Deutschland, der Schweiz und Liechtenstein, Schweiz mit Ausfuhr und Verzollung.",
  },
  {
    path: "/sauna-kaufen",
    kind: "leistung",
    label: "Sauna kaufen in Vorarlberg",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Buy a sauna in Vorarlberg",
      llms: "Saunas for the home and outdoor saunas by Starpool, infrared cabins and steam rooms, heated loungers by Soleum and Fabio Alemanno, drawn by hand in Lochau and planned in 3D; delivery and installation on request in Austria, Germany, Switzerland and Liechtenstein, Switzerland with export and customs clearance.",
    },
    llms: "Sauna für zuhause und Außensauna von Starpool, Infrarotkabinen und Dampfbäder, beheizte Liegen von Soleum und Fabio Alemanno, in Lochau von Hand gezeichnet und in 3D geplant; Lieferung und Montage auf Anfrage in Österreich, Deutschland, der Schweiz und Liechtenstein, Schweiz mit Ausfuhr und Verzollung.",
  },
  {
    path: "/kuechenplaner",
    kind: "werkzeug",
    label: "Küchenplaner online",
    lastModified: "2026-11-02", // Sprach-Integration EN/FR/IT; Optik/Motion-QA 01.11.; vorher 31.10. SEO Küchenplaner
    locales: ["de", "en", "fr", "it"], // wie kpLanguages() (src/lib/kuechenplaner/seo.js); /druck bleibt noindex, nicht gelistet
    en: {
      label: "Online kitchen planner",
      llms: "Design your kitchen online in 3D, without signing up: room with sloped ceiling, units on a 60 cm or 55 cm grid, ergonomics check with sources, parts list and PDF. Then refined by hand in Lochau; prices on request.",
    },
    llms: "Küche im Browser planen, ohne Anmeldung: Grundform oder freie Raumform mit Fenstern, Anschlüssen und Dachschräge, Module im 60- oder 55-cm-Raster (SMS), Fronten und Arbeitsplatten in 3D, Prüfung von Laufwegen und Arbeitshöhe mit Quellen, Stückliste und PDF. Danach plant Harald Menghin von Hand im Studio in Lochau weiter; Preise auf Anfrage.",
  },
  {
    path: "/sofaplaner",
    kind: "werkzeug",
    label: SOURCE_COPY.seoName,
    lastModified: "2026-11-02", // Sprach-Integration FR/IT; Optik/Motion-QA 01.11.; vorher 31.10. SEO Sofaplaner
    locales: ["de", "en", "fr", "it"], // Welle 2 EN, seit 01.11.2026 auch FR/IT (sofaLanguages())
    // Brand name only with the manufacturer's consent (sourceCopyFor, R8 recht P0-1).
    en: { label: sourceCopyFor("en").seoName, llms: `${sourceCopyFor("en").leadShort.replace(/.$/, "")}; prices on request.` },
    llms: SOURCE_COPY.llms || `${SOURCE_COPY.leadShort.replace(/\.$/, "")}; Preise auf Anfrage.`,
  },
  {
    path: "/stil-finder",
    kind: "werkzeug",
    label: "Stil-Finder",
    lastModified: "2026-11-02", // Sprach-Integration EN/FR/IT; vorher 31.10. Wording sechs Bildfragen
    // Nur das Quiz; die Ergebnisseiten /stil-finder/ergebnis/<profil> bleiben noindex.
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Style Finder",
      llms: "Six picture questions on space, material, colour, form, everyday life and light, one optional question on the project; result with colour palette, brands and moodboard.",
    },
    llms: "Sechs Bildfragen zu Raum, Material, Farbe, Form, Alltag und Licht, eine optionale Frage zum Vorhaben; Ergebnis mit Farbpalette, Marken und Moodboard.",
  },
  {
    path: "/3d-ansicht",
    kind: "werkzeug",
    label: "Möbel in 3D und AR ansehen",
    lastModified: "2026-11-02",
    llms: "Ausgewählte Möbel in 3D drehen, Maße einblenden und per Handy in Originalgröße in den eigenen Raum stellen.",
  },
  {
    path: "/bodensee-licht",
    kind: "werkzeug",
    label: "Bodensee-Licht",
    lastModified: "2026-11-02",
    llms: "Sonnenstand nach Ort, Fensterrichtung, Datum und Uhrzeit, berechnet nach NOAA, in Küche und am Pool.",
  },
  {
    path: "/dreilaender-rechner",
    kind: "werkzeug",
    label: "Dreiländer-Rechner",
    lastModified: "2026-11-02", // Sprach-Integration EN/FR/IT (dreilaender/copy-intl.js)
    locales: ["de", "en", "fr", "it"],
    en: {
      label: "Three-country calculator",
      llms: "Driving times from Lochau and estimates for buying from Switzerland, Liechtenstein and Germany; no tax advice.",
    },
    llms: "Fahrzeiten ab Lochau und Richtwerte für den Kauf aus der Schweiz, Liechtenstein und Deutschland; keine Steuerberatung.",
  },
  {
    path: "/concierge",
    kind: "werkzeug",
    label: "KI-Concierge",
    lastModified: "2026-11-02",
    rule: "concierge",
    llms: "Fragen zu Sortiment, Marken und Showroom an ein gekennzeichnetes KI-System, mit Übergabe an das Team.",
  },
  {
    path: "/ki-assistenten",
    kind: "werkzeug",
    label: "Platzhirsch für KI-Assistenten (MCP-Server)",
    lastModified: "2026-11-02",
    rule: "appointment",
    llms: kiAssistentenLlms(false),
  },
  {
    path: "/designermoebel-liechtenstein",
    kind: "region",
    label: "Designermöbel Liechtenstein",
    lastModified: "2026-11-02",
    llms: "Für Vaduz, Schaan und das Unterland: Anfahrt rund 40 Minuten, Schweizer Zoll- und Mehrwertsteuergebiet (8,1 %), Ausfuhr und Zollstelle Tisis/Schaanwald.",
    facts: [
      "Fahrzeit Vaduz/Schaan rund 40 Minuten, Route A14 oder A13",
      "Liechtenstein im Schweizer Zoll- und MWST-Gebiet, 8,1 %",
      "Zollstelle Tisis/Schaanwald Mo–Fr 7.30–16.30 (WKO 07/2025)",
      "Montage in FL: EWR-Meldeverfahren ohne achttägige Wartefrist",
      "Regionale Begriffe: Vaduz, Schaan, Unterland",
    ],
  },
  {
    path: "/designermoebel-rheintal",
    kind: "region",
    label: "Designermöbel Rheintal",
    lastModified: "2026-11-02",
    llms: "Für Widnau, Heerbrugg, Altstätten, Au und St. Margrethen: Anfahrt rund 30 Minuten, Rückerstattung der österreichischen Umsatzsteuer, Einfuhr in die Schweiz und Zollstellen.",
    facts: [
      "Fahrzeit rund 30 Minuten über Au–Lustenau oder St. Margrethen–Höchst",
      "Zollstellen Höchst/St. Margrethen und Hohenems/Diepoldsau mit Zeiten",
      "Wertfreigrenze CHF 150 pro Person und Tag",
      "Montage: eigene Melderegeln, alternativ Schreiner aus der Region",
      "Regionale Begriffe: Widnau, Heerbrugg, Altstätten, Stockwerkeigentum",
    ],
  },
  {
    path: "/designermoebel-arlberg",
    kind: "region",
    label: "Designermöbel Arlberg",
    lastModified: "2026-11-02", // Welle 2: Querverweis Hotel & Objekt
    llms: "Einrichtung für Chalets, Ferienwohnungen und Hotels in Lech, Zürs, Warth und St. Anton: Anfahrt von Lech rund 75 bis 90 Minuten, Planung vor der Wintersaison.",
    facts: [
      "Fahrzeit von Lech rund 75 Minuten bis eineinhalb Stunden",
      "Objekte: Chalet, Ferienwohnung, Hotel; Eigentümer oft mit Wohnsitz in DE/CH",
      "Planung im Frühjahr/Sommer vor der Wintersaison",
      "Selbst bewohnt oder vermietet: Stoffe und Robustheit",
      "Terrasse am Berg: Paola Lenti, Tuuci, Umbrosa; Zufahrt je nach Jahreszeit",
    ],
  },
  {
    path: "/designermoebel-konstanz",
    kind: "region",
    label: "Designermöbel Konstanz",
    lastModified: "2026-11-02",
    llms: "Für Konstanz und den westlichen Bodensee: Anreise rund eine Stunde um den See oder mit der Fähre Konstanz–Meersburg, Umsatzsteuer für Kundinnen und Kunden aus Deutschland.",
    facts: [
      "Fahrzeit rund eine Stunde",
      "Keine Brücke: Nordufer oder Autofähre Konstanz–Meersburg",
      "Mit Möbeln im Auto: Route über das deutsche Ufer, keine Zollgrenze",
      "Regionale Begriffe: westlicher Bodensee",
    ],
  },
  {
    path: "/designermoebel-feldkirch",
    kind: "region",
    label: "Designermöbel Feldkirch",
    lastModified: "2026-11-02",
    llms: "Für Feldkirch, Rankweil, Götzis und das Vorarlberger Oberland: rund 35 Kilometer über die A14, Einkauf innerhalb Österreichs.",
    facts: [
      "Entfernung rund 35 km über die Rheintalautobahn A14",
      "Einkauf innerhalb Österreichs, ohne Zoll, österreichische Rechnung",
      "Mit dem Zug über Bregenz",
      "Regionale Begriffe: Rankweil, Götzis, Frastanz, Walgau, Oberland",
    ],
  },
  {
    path: "/designermoebel-appenzell",
    kind: "region",
    label: "Designermöbel Appenzell",
    lastModified: "2026-11-02",
    llms: "Für Appenzell Ausserrhoden und Innerrhoden: Anfahrt rund 30 bis 45 Minuten, Selbstausfuhr mit Rückerstattung und Einfuhr in die Schweiz.",
    facts: [
      "Fahrzeit rund 30 bis 45 Minuten je nach Ort",
      "Regionale Begriffe: Appenzellerland, Ausserrhoden, Innerrhoden",
      "Marken nach Haustyp: ältere Häuser mit Holz und niedrigen Räumen, Dachschrägen",
      "Vorbereitung: Lift- und Treppenhausmasse im Stockwerkeigentum",
    ],
  },
];

export const EXTRA_PAGE_PATHS = EXTRA_PAGES.map((page) => page.path);

/**
 * Welle 2 (Inhaber 29.10.2026): indexable pages in German AND English that are
 * not German-only (so they are not part of EXTRA_PAGE_PATHS, which feeds the
 * German-only list of the language switch). FR/IT: Architekten 404 – not listed
 * for FR/IT. Hotel & Objekt: all four languages since 01.11.2026 (Inhaber).
 * `llms`: one factual line, no dealer claims, no superlatives, no references.
 */
export const MULTILINGUAL_PAGES = [
  {
    path: "/hotel-objekt",
    kind: "leistung",
    label: "Hotel & Objekt: Hotels, Chalets und Gastronomie einrichten",
    // FR/IT seit 01.11.2026 (Inhaber): eigene übersetzte Seiten, hreflang reziprok.
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    llms: "Einrichtung von Hotels, Chalets, Ferienwohnungen und Gastronomie: Handzeichnung, Modell, 3D, Musterzimmer im eigenen Haus, Montage im Saisonfenster; Projektanfrage direkt auf der Seite.",
    en: {
      label: "Hotels & projects: furnishing hotels, chalets and restaurants",
      llms: "Furnishing hotels, chalets, holiday apartments and restaurants: hand drawing, model, 3D, a sample room in the client's own building, installation between seasons; project enquiry on the page.",
    },
  },
  {
    path: "/architekten",
    kind: "leistung",
    label: "Für Architekten und Bauträger",
    lastModified: "2026-11-02", // Sprach-Integration: FR/IT (architekten/copy-intl.js)
    locales: ["de", "en", "fr", "it"],
    llms: "Für Architekturbüros und Bauträger: Planungsdaten über die Hersteller anfragen, Material- und Ezarri-Muster bestellen, Projektanfrage an das Team in Lochau.",
    en: {
      label: "For architects and developers",
      llms: "For architecture practices and developers: request planning data via the manufacturers, order material and Ezarri samples, project enquiry to the team in Lochau.",
    },
  },
  // Inhaber-Entscheidung Nr. 18 (Einhängen 31.10.2026): Küchengeräte in allen
  // vier Sprachen unter demselben Pfad (kein Eintrag in deOnlyRedirects.cjs).
  // Keine Händler-/Partner-Aussage, keine Preise (src/lib/kueche/geraete.js).
  {
    path: "/kuechengeraete",
    kind: "leistung",
    label: "Küchengeräte, die wir einplanen",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    llms: "Geräte von Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker in der Küchenplanung: eingeplant, geliefert und montiert über das Studio in Lochau; keine Preise online.",
    en: {
      label: "Kitchen appliances we plan in",
      llms: "Appliances by Gaggenau, Miele, V-ZUG, BORA, Liebherr and Quooker as part of the kitchen plan: planned in, delivered and installed via the studio in Lochau; no prices online.",
    },
  },
  // Inhaber-Entscheidungen Nr. 19–21 (Einhängen 31.10.2026): Bad & Wellness in
  // allen vier Sprachen unter demselben Pfad (kein Eintrag in deOnlyRedirects.cjs).
  // Keine Händleraussage hier (die kommt nur über den Claim-Guard auf der Seite),
  // keine Preise, keine Wirkversprechen (src/lib/wellness/marken.js).
  {
    path: "/bad-wellness",
    kind: "leistung",
    label: "Bad & Wellness – geplant wie ein Raum",
    lastModified: "2026-11-02",
    locales: ["de", "en", "fr", "it"],
    llms: "Planung von Bad, Private Spa, Whirlpool und Wärmeliegen von Hand und in 3D, Lieferung und Montage mit den Gewerken; Marken Agape, Dornbracht, antoniolupi, Starpool, Soleum, Fabio Alemanno, Aquavia Spa, Naggura; keine Preise online.",
    en: {
      label: "Bath & wellness – planned like a room",
      llms: "Planning of bathrooms, private spas, hot tubs and heated loungers by hand and in 3D, delivery and installation with the trades; brands Agape, Dornbracht, antoniolupi, Starpool, Soleum, Fabio Alemanno, Aquavia Spa, Naggura; no prices online.",
    },
  },
  // Kundenkarte (Inhaber 04.11.2026, Stufe 1 ohne Geldwert): alle vier Sprachen
  // unter demselben Pfad, index,follow, hreflang reziprok. /kundenkarte/bedingungen
  // (Entwurf, noindex) und /kundenkarte/bestaetigen (noindex) bleiben draußen.
  // Keine Nachlässe, kein Guthaben, keine Schwellen in Euro (src/lib/kundenkarte/copy.js).
  {
    path: "/kundenkarte",
    kind: "leistung",
    label: "Kundenkarte: Leistungen statt Punkte",
    lastModified: "2026-11-04",
    locales: ["de", "en", "fr", "it"],
    llms: "Die Platzhirsch Kundenkarte ohne Guthaben und Punkte: persönlicher Berater, Produktpass und Garantiefristen im Portal, Pflege-Service, Lieferung und Montage je nach Stufe, Einladungen vor der öffentlichen Ankündigung; Anmeldung mit Bestätigung per E-Mail.",
    en: {
      label: "Customer card: services instead of points",
      llms: "The Platzhirsch customer card without credit or points: personal advisor, product passport and warranty periods in the portal, care service, delivery and installation depending on the tier, invitations before the public announcement; sign-up with e-mail confirmation.",
    },
  },
  // Reklamation melden (04.11.2026): alle vier Sprachen unter demselben Pfad, index,follow.
  // Die Link-Seiten /newsletter/bestaetigen, /newsletter/abmelden und
  // /adventsabend/absagen sind noindex und bleiben draußen.
  {
    path: "/service/reklamation",
    kind: "leistung",
    label: "Reklamation melden",
    lastModified: "2026-11-04",
    locales: ["de", "en", "fr", "it"],
    llms: "Formular für Reklamationen zu Produkten von Platzhirsch Home Living: Mangel, Transportschaden, Montagefehler, Garantiefall oder Pflegefrage melden, mit Bestell- oder Projektnummer; das Team prüft den Fall und meldet sich.",
    en: {
      label: "Report a complaint",
      llms: "Form for complaints about products from Platzhirsch Home Living: report a defect, transport damage, installation fault, warranty case or care question, with order or project number; the team reviews the case and gets back to you.",
    },
  },
];

/**
 * EXTRA_PAGES as listed today: rule pages only while indexable, the
 * /ki-assistenten line in the wording of the appointment switch.
 * @param {{conciergeAvailable?: boolean, appointmentOffered?: boolean, arbeitsweiseIndexable?: boolean}} [opts]
 */
export function visibleExtraPages({
  conciergeAvailable = false,
  appointmentOffered = false,
  arbeitsweiseIndexable = robotsForLaunch().index,
} = {}) {
  return EXTRA_PAGES.filter((page) => {
    if (page.rule === "concierge") return conciergeAvailable;
    if (page.rule === "arbeitsweise") return arbeitsweiseIndexable;
    return true;
  }).map((page) => (page.rule === "appointment" ? { ...page, llms: kiAssistentenLlms(appointmentOffered) } : page));
}

/**
 * Herstellerkatalog (31.10.2026, src/lib/katalog): Übersicht, Marken-, Kategorie-
 * (inkl. Folgeseiten …/seite/<n>, Nr. 25) und Produktseiten unter /bad-wellness/…,
 * /kuechengeraete/… und /accessoires/… (Nr. 27), in allen vier
 * Sprachen unter demselben Pfad (wie /bad-wellness). Nur Seiten, die es gibt:
 * eine Welt ohne Produkte und Marken ohne Produkte fehlen (die Seiten sind 404).
 * lastModified = das jüngste Prüfdatum (`stand`) der betroffenen Produkte –
 * nie new Date(). Keine llms-Zeilen (Produktseiten sind Herstellerangaben).
 * @returns {{path: string, typ: string, locales: string[], lastModified: string}[]}
 */
export function katalogSitemapPages() {
  return katalogPfade().map((e) => {
    const list =
      e.typ === "produkt" ? [produktBySlug(e.slug)] : e.typ === "marke" ? produkteByMarke(e.marke, e.welt) : e.typ === "kategorie" ? produkteByKategorie(e.welt, e.kategorie) : produkteByWelt(e.welt);
    return { path: e.path, typ: e.typ, locales: ["de", "en", "fr", "it"], lastModified: letzterStand(list) };
  });
}
