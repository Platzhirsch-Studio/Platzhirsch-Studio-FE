// src/lib/service/pflege/materials.js – Materialien des Pflege-Service.
//
// Fachliche Grundlage (nur belegte, allgemeine Regeln; die Pflegeanleitung des
// Herstellers hat immer Vorrang):
//   - Ratgeber src/content/ratgeber/designmoebel-pflegen-leder-stoff-holz.md
//     (DGM/VDL über Nordkurier, BoConcept, Kvadrat, Innes, TEAM 7, Kärcher,
//     Cosentino) – wird auf der Seite nur verlinkt.
//   - Poliform, „Certificate of Origin and Warranty“ (poliform.it/en/?p=230841):
//     Schäden durch mangelhafte Pflege oder unsachgemäßen Gebrauch und
//     Reparaturen durch nicht autorisierte Personen gelten nicht als
//     Herstellungsfehler; Pflegeempfehlungen stehen in der Anleitung zum Produkt.
//   - Minotti: Pflegeanleitungen liegen im Händlerbereich von minotti.com
//     (Login für autorisierte Händler/Architekten). Das Studio legt die
//     Original-PDFs je Modell vor; bis dahin nennt die Seite keine
//     Minotti-spezifischen Mittel oder Verfahren.
//
// Keine "@/..."-Importe: node --test lädt die Datei direkt.

export const MATERIAL_KEYS = Object.freeze(["leder", "stoff", "holz", "stein"]);

// Wörter in Produktpass (materials), Variante und Kategorie → Material.
// Reihenfolge = Priorität bei der Anzeige. Nur Kleinbuchstaben.
const MATCH = Object.freeze({
  leder: ["leder", "leather", "nubuk", "nubuck", "anilin", "aniline", "wildleder", "suede", "velours"],
  stoff: ["stoff", "bezugsstoff", "fabric", "textil", "bouclé", "boucle", "leinen", "linen", "samt", "velvet", "wolle", "wool", "teppich", "rug", "polster"],
  holz: ["holz", "wood", "eiche", "oak", "nussbaum", "walnut", "esche", "furnier", "veneer", "massivholz", "teak"],
  stein: ["marmor", "marble", "naturstein", "stein", "stone", "granit", "granite", "travertin", "travertine", "kalkstein", "limestone"],
});

/**
 * Materialien eines Stücks aus freien Texten (Produktpass, Variante, Kategorie).
 * @param {...(string|string[]|null|undefined)} texts
 * @returns {string[]} Teilmenge von MATERIAL_KEYS in fester Reihenfolge
 */
export function materialsOf(...texts) {
  const hay = texts
    .flat()
    .filter((t) => typeof t === "string")
    .join(" | ")
    .toLowerCase();
  if (!hay) return [];
  return MATERIAL_KEYS.filter((key) =>
    MATCH[key].some((word) => new RegExp(`(^|[^a-zäöüß])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(hay))
  );
}

/**
 * Leistungen und Pflegeanleitung je Material (DE/EN).
 * `leistungen`: was der Service umfasst (Grundstruktur laut Auftrag, Umfang im
 * Detail legt der Inhaber fest). `grenzen`: was wir ehrlich NICHT machen.
 * `alltag`: kurze Pflegeanleitung für das Portal (aus dem Ratgeber, belegt).
 */
export const MATERIALS = Object.freeze({
  de: {
    leder: {
      title: "Leder",
      intro: "Glattleder, Anilin- und Semianilinleder, Nubuk.",
      leistungen: [
        "Reinigung mit einem Mittel, das zur Lederart passt",
        "Pflege von Glatt- und Anilinleder, damit es nicht austrocknet",
        "Nubuk und Velours werden nicht eingecremt, sondern gebürstet und imprägniert",
      ],
      // Erst nach Klärung der Gewerbefrage (Frage E, service-recht-vorschlag.md)
      // sichtbar: PFLEGE_CONFIG.ausbesserungenFreigegeben (QA Recht P1-3).
      ausbesserung: "Farbauffrischung auf Anfrage, nach Prüfung der Lederart",
      grenzen: "Tiefe Kratzer und Risse lassen sich mit Pflege nicht beheben. Das sagen wir Ihnen vor dem Termin.",
      alltag: [
        "Wöchentlich mit einem weichen, trockenen Tuch abstauben.",
        "Flüssigkeiten sofort abtupfen, nicht reiben.",
        "Keine Lösungs- oder Scheuermittel verwenden.",
        "Etwa 30 cm Abstand zum Heizkörper, Luftfeuchtigkeit 40 bis 60 Prozent.",
        "Neue Pflegemittel zuerst an einer verdeckten Stelle testen.",
      ],
    },
    stoff: {
      title: "Stoff",
      intro: "Polsterstoffe wie Wolle, Leinen, Bouclé und Samt, auch Teppiche.",
      leistungen: [
        "Tiefenreinigung, wenn das Pflegeetikett bzw. Pflegeblatt des Stoffherstellers eine Nassreinigung erlaubt",
        "Fleckenbehandlung nach Art des Flecks und des Stoffs",
        "Imprägnierung, wenn der Stoffhersteller sie zulässt",
      ],
      grenzen: "Erlaubt das Pflegeetikett keine Nassreinigung, wird nur gesaugt und gebürstet. Abnehmbare Bezüge waschen wir nicht in der Maschine.",
      alltag: [
        "Regelmäßig mit einer passenden Düse saugen, auch in den Nähten.",
        "Flecken sofort abtupfen, von außen nach innen.",
        "Keine konzentrierten Waschmittel, keine Bleiche, kein Ammoniak.",
        "Vor jeder Reinigung das Pflegeetikett prüfen.",
      ],
    },
    holz: {
      title: "Holz und Furnier",
      intro: "Geöltes und lackiertes Massivholz, Furnier.",
      leistungen: [
        "Pflege geölter Flächen mit dem Öl, das der Hersteller vorsieht",
        "Reinigung lackierter Flächen",
      ],
      ausbesserung: "Kleine Ausbesserungen wie leichte Wasserränder in geölten Flächen, nach Rücksprache",
      grenzen: "Furnier schleifen wir nicht ab. Größere Schäden sind Tischlerarbeit, das klären wir vorher mit Ihnen.",
      alltag: [
        "Geöltes Holz trocken oder nur leicht feucht abwischen.",
        "Geölte Flächen: keine Mikrofasertücher, keine fettlösenden Reiniger. Generell keine Dampfreiniger.",
        "Nachölen nach Herstellerangabe, oft alle ein bis zwei Jahre.",
        "Ölgetränkte Tücher nach Gebrauch ausspülen und entsorgen (Selbstentzündung).",
      ],
    },
    stein: {
      title: "Marmor und Naturstein",
      intro: "Tischplatten und Sockel aus Marmor, Travertin oder Granit.",
      leistungen: [
        "Reinigung mit einem pH-neutralen Mittel",
        "Imprägnierung nach Angabe des Herstellers",
      ],
      ausbesserung: "Kleine Ausbesserungen nach Rücksprache",
      grenzen: "Matte Ätzflecken und tiefe Kratzer sind Arbeit für den Steinmetz. Das sagen wir Ihnen ehrlich vorab.",
      alltag: [
        "Marmor ist kalkhaltig: kein Essig, keine Zitrone, keine sauren Reiniger.",
        "Untersetzer verwenden, Verschüttetes sofort abwischen.",
        "Zum Reinigen ein pH-neutrales Mittel verwenden.",
      ],
    },
  },
  en: {
    leder: {
      title: "Leather",
      intro: "Smooth, aniline and semi-aniline leather, nubuck.",
      leistungen: [
        "Cleaning with a product that suits the type of leather",
        "Conditioning of smooth and aniline leather so it does not dry out",
        "Nubuck and suede are not creamed but brushed and protected",
      ],
      ausbesserung: "Colour refresh on request, after checking the type of leather",
      grenzen: "Deep scratches and tears cannot be fixed with care. We tell you before the appointment.",
      alltag: [
        "Dust weekly with a soft, dry cloth.",
        "Blot liquids at once, do not rub.",
        "Never use solvents or abrasive cleaners.",
        "Keep about 30 cm from radiators, humidity at 40 to 60 percent.",
        "Test any new care product on a hidden spot first.",
      ],
    },
    stoff: {
      title: "Fabric",
      intro: "Upholstery fabrics such as wool, linen, bouclé and velvet, also rugs.",
      leistungen: [
        "Deep cleaning if the care label or the fabric maker's care sheet allows wet cleaning",
        "Stain treatment matched to the stain and the fabric",
        "Protective treatment if the fabric maker allows it",
      ],
      grenzen: "If the care label does not allow wet cleaning, the fabric is only vacuumed and brushed. We do not machine-wash removable covers.",
      alltag: [
        "Vacuum regularly with a suitable nozzle, also along the seams.",
        "Blot stains at once, from the outside in.",
        "No concentrated detergents, no bleach, no ammonia.",
        "Check the care label before any cleaning.",
      ],
    },
    holz: {
      title: "Wood and veneer",
      intro: "Oiled and lacquered solid wood, veneer.",
      leistungen: [
        "Care of oiled surfaces with the oil the maker specifies",
        "Cleaning of lacquered surfaces",
      ],
      ausbesserung: "Small repairs such as light water marks in oiled surfaces, after consultation",
      grenzen: "We do not sand veneer. Larger damage is a job for a cabinetmaker; we agree this with you first.",
      alltag: [
        "Wipe oiled wood dry or only slightly damp.",
        "Oiled surfaces: no microfibre cloths, no grease-dissolving cleaners. No steam cleaners on any wood.",
        "Re-oil as the maker specifies, often every one to two years.",
        "Rinse and dispose of oil-soaked cloths after use (risk of self-ignition).",
      ],
    },
    stein: {
      title: "Marble and natural stone",
      intro: "Table tops and bases in marble, travertine or granite.",
      leistungen: [
        "Cleaning with a pH-neutral product",
        "Sealing as the maker specifies",
      ],
      ausbesserung: "Small repairs after consultation",
      grenzen: "Dull etch marks and deep scratches are work for a stonemason. We tell you honestly in advance.",
      alltag: [
        "Marble contains lime: no vinegar, no lemon, no acidic cleaners.",
        "Use coasters and wipe up spills at once.",
        "Clean with a pH-neutral product.",
      ],
    },
  },
});

/** Material-Texte in der Sprache (Fallback DE). */
export function materialCopy(locale = "de") {
  return MATERIALS[locale] || MATERIALS.de;
}

/**
 * Leistungen eines Materials für die Seite. Ausbesserungen/Farbauffrischung
 * erscheinen nur, wenn die Gewerbefrage geklärt ist (Frage E im
 * Rechtsvorschlag: Ausbesserungen an Leder, Polster, Holz und Stein können
 * reglementierte Handwerke sein) – QA Recht P1-3.
 */
export function leistungenVon(m, freigegeben = false) {
  if (!m) return [];
  return freigegeben && m.ausbesserung ? [...m.leistungen, m.ausbesserung] : [...m.leistungen];
}
