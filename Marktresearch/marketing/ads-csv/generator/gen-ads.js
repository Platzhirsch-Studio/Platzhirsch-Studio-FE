// Generator für Google-Ads-Editor-CSVs (Platzhirsch). Aufruf: node gen-ads.js <outDir> <appendixMd>
const fs = require("fs");
const path = require("path");
const OUT = process.argv[2];
const APPX = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });

const BASE = "https://platzhirsch.studio";
const errors = [];
const FORBIDDEN = /offiziell|autorisiert|vertragshändler|händler|nr\.? ?1|größte|grösste|\bbeste[nrs]?\b|\bstore\b|flagship|exklusiv|garantie|günstig|rabatt|!/i;

// ---------- Regionen ----------
const REGIONS = {
  AT: {
    code: "AT", name: "AT-Vorarlberg-Arlberg", ch: false,
    regH: ["Showroom in Lochau", "Für Vorarlberg und Arlberg", "Planung in ganz Vorarlberg"],
    regLong: "Vorarlberg und vom Arlberg",
    cities: ["vorarlberg", "bregenz", "dornbirn", "feldkirch", "bludenz", "lustenau", "lech"],
    brandCities: ["vorarlberg", "bregenz", "dornbirn"],
    genericUrl: "/de/designermoebel-bregenz",
    kitchenUrl: "/de/kuechen-vorarlberg",
    sitelinkRegion: { t: "Designermöbel Bregenz", d1: "Showroom in Lochau bei Bregenz", d2: "Wohnen, Küche und Outdoor", u: "/de/designermoebel-bregenz" },
    locations: ["Vorarlberg, Austria", "Landeck District, Tyrol, Austria", "Reutte District, Tyrol, Austria"],
  },
  DE: {
    code: "DE", name: "DE-Sued-Bodensee-Allgaeu", ch: false,
    regH: ["Lochau, direkt bei Lindau", "Für Lindau, Allgäu, Bodensee", "Kurz über die Grenze"],
    regLong: "Lindau und dem Allgäu",
    cities: ["lindau", "friedrichshafen", "ravensburg", "konstanz", "kempten", "allgäu", "wangen"],
    brandCities: ["lindau", "bodensee", "allgäu"],
    genericUrl: "/de/designermoebel-lindau",
    kitchenUrl: "/de/kuechen-vorarlberg",
    sitelinkRegion: { t: "Showroom für Lindau", d1: "In Lochau, nahe der Grenze", d2: "Termin online anfragen", u: "/de/designermoebel-lindau" },
    locations: ["Lindau, Bavaria, Germany", "Landkreis Lindau (Bodensee), Bavaria, Germany", "Bodenseekreis, Baden-Wurttemberg, Germany", "Landkreis Ravensburg, Baden-Wurttemberg, Germany", "Landkreis Konstanz, Baden-Wurttemberg, Germany", "Kempten, Bavaria, Germany", "Landkreis Oberallgäu, Bavaria, Germany"],
  },
  CH: {
    code: "CH", name: "CH-Ost", ch: true,
    regH: ["Für die Ostschweiz", "Am Bodensee bei Bregenz", "Offerte persönlich besprechen"],
    regLong: "der Ostschweiz",
    cities: ["st gallen", "rheintal", "appenzell", "thurgau", "rorschach", "chur", "ostschweiz"],
    brandCities: ["st gallen", "ostschweiz", "schweiz"],
    genericUrl: "/de/designermoebel-st-gallen",
    kitchenUrl: "/de/kuechen-vorarlberg",
    sitelinkRegion: { t: "Für St. Gallen", d1: "Showroom in Lochau am Bodensee", d2: "Beratung nach Vereinbarung", u: "/de/designermoebel-st-gallen" },
    locations: ["Canton of St. Gallen, Switzerland", "Appenzell Ausserrhoden, Switzerland", "Appenzell Innerrhoden, Switzerland", "Canton of Thurgau, Switzerland", "Chur, Grisons, Switzerland"],
  },
  FL: {
    code: "FL", name: "FL-Liechtenstein", ch: true,
    regH: ["Für Liechtenstein", "Am Bodensee bei Bregenz", "Offerte persönlich besprechen"],
    regLong: "Liechtenstein",
    cities: ["liechtenstein", "vaduz", "schaan"],
    brandCities: ["liechtenstein"],
    genericUrl: "/de/designermoebel-liechtenstein",
    kitchenUrl: "/de/kuechen-vorarlberg",
    sitelinkRegion: { t: "Für Liechtenstein", d1: "Showroom in Lochau am Bodensee", d2: "Beratung nach Vereinbarung", u: "/de/designermoebel-liechtenstein" },
    locations: ["Liechtenstein"],
  },
};

// ---------- gemeinsame Bausteine ----------
const COMMON_A = ["Platzhirsch Home Living", "Showroom mit Café", "Persönliche Planung", "Jetzt Termin vereinbaren", "Beratung ohne Zeitdruck"];
const COMMON_B = ["Platzhirsch Lochau", "Termin online anfragen", "Wohnen, Küche, Outdoor", "Termin nach Vereinbarung", "Landstraße 9 in Lochau"];
const DESC_COMMON_A = [
  "Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee.",
  "Wohnen, Küche, Outdoor aus einer Hand. Für Kunden aus {REGLONG}.",
];
const DESC_COMMON_B = [
  "Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung.",
  "Einrichtungsstudio am Bodensee für Kundinnen und Kunden aus {REGLONG}.",
];

// ---------- Themen / Anzeigengruppen ----------
// kw: Liste [keyword, exactAuch?]; regional: Keywords mit {CITY}; neg: AG-Negatives (Phrase)
const AG = {
  minotti: {
    name: "Minotti", url: "/de/ueber-uns/marken/minotti", p1: "Minotti", p2: "Showroom",
    kw: [["minotti", 1], ["minotti sofa", 1], ["minotti möbel", 1], ["minotti couch", 1], ["minotti sessel", 1], ["minotti kaufen", 1], ["minotti ausstellung", 1], ["minotti sofa preis", 0], ["minotti lawrence", 0], ["minotti hamilton", 0], ["minotti connery", 0], ["minotti torii", 0], ["minotti freeman", 0], ["minotti yang", 0]],
    brandRegional: "minotti {CITY}",
    neg: ["minotti cucine", "cucine", "küche", "outdoor"],
    hA: ["Minotti-Sofas live erleben", "Minotti in Lochau erleben", "Minotti probesitzen", "Minotti-Ausstellung Lochau", "Sofas, Sessel und Tische", "Stoffe und Leder vor Ort", "Italienisches Design am See"],
    hB: ["Wohnen mit Minotti planen", "Minotti und mehr im Showroom", "Ihr Wohnzimmer mit Minotti", "Minotti-Sofa in Ruhe wählen", "Raumplanung inklusive", "Sofa, Teppich, Licht planen", "Einrichten am Bodensee"],
    dA: ["Minotti-Sofas und -Sessel im Showroom in Lochau erleben. Mit Café, ohne Zeitdruck.", "Wir planen Ihr Wohnzimmer mit Minotti persönlich, vom Grundriss bis zum Bezugsstoff."],
    dB: ["Minotti, Poliform, Flos und mehr: im Showroom kombinieren und mit uns planen.", "Probesitzen statt bestellen: Minotti-Modelle live sehen und Bezüge vergleichen."],
  },
  poliform: {
    name: "Poliform-Wohnen", url: "/de/ueber-uns/marken/poliform", p1: "Poliform", p2: "Wohnen",
    kw: [["poliform", 1], ["poliform möbel", 1], ["poliform schrank", 1], ["poliform kleiderschrank", 1], ["poliform begehbarer kleiderschrank", 1], ["poliform bett", 1], ["poliform sofa", 1], ["poliform senzafine", 0], ["poliform ubik", 0], ["poliform kaufen", 1]],
    brandRegional: "poliform {CITY}",
    neg: ["küche", "kitchen", "varenna"],
    hA: ["Poliform live erleben", "Poliform-Schränke ansehen", "Poliform in Lochau erleben", "Kleiderschrank nach Maß", "Begehbare Schränke planen", "Betten, Sofas und Schränke", "Italienisches Design am See"],
    hB: ["Wohnen mit Poliform planen", "Poliform und mehr im Showroom", "Schranksysteme planen", "Ankleide nach Maß planen", "Raumplanung inklusive", "Schlafzimmer mit Poliform", "Einrichten am Bodensee"],
    dA: ["Poliform-Schränke, Betten und Sofas im Showroom in Lochau erleben und planen lassen.", "Begehbarer Kleiderschrank oder Wohnwand: Wir planen Poliform passend zu Ihrem Raum."],
    dB: ["Poliform, Minotti, Rimadesio und mehr: im Showroom vergleichen und mit uns planen.", "Wir messen, planen und begleiten Ihr Projekt persönlich. Termin online anfragen."],
  },
  rimadesio: {
    name: "Rimadesio", url: "/de/ueber-uns/marken/rimadesio", p1: "Rimadesio", p2: "Showroom",
    kw: [["rimadesio", 1], ["rimadesio schrank", 1], ["rimadesio schiebetüren", 1], ["rimadesio schiebetür", 1], ["rimadesio regal", 1], ["rimadesio kleiderschrank", 1], ["rimadesio begehbarer kleiderschrank", 0], ["rimadesio abacus", 0], ["rimadesio velaris", 0], ["rimadesio möbel", 1]],
    brandRegional: "rimadesio {CITY}",
    neg: [],
    hA: ["Rimadesio live erleben", "Rimadesio in Lochau ansehen", "Schiebetüren aus Glas", "Glas und Aluminium", "Schränke und Regale", "Raumteiler nach Maß", "Italienisches Design am See"],
    hB: ["Mit Rimadesio planen", "Rimadesio im Showroom", "Schiebetüren planen lassen", "Ankleide nach Maß planen", "Raumplanung inklusive", "Regale und Raumteiler", "Einrichten am Bodensee"],
    dA: ["Rimadesio-Schiebetüren, Schränke und Regale im Showroom in Lochau ansehen und planen.", "Glas, Aluminium, Maßarbeit: Wir planen Rimadesio passend zu Grundriss und Raumhöhe."],
    dB: ["Rimadesio, Poliform, Minotti und mehr: im Showroom vergleichen und mit uns planen.", "Wir messen, planen und begleiten Ihr Projekt persönlich. Termin online anfragen."],
  },
  treca: {
    name: "Treca", url: "/de/ueber-uns/marken/treca", p1: "Treca", p2: "Betten",
    kw: [["treca paris", 1], ["treca matratze", 1], ["treca bett", 1], ["treca boxspringbett", 1], ["treca interiors", 1], ["treca matratzen", 1]],
    brandRegional: "treca {CITY}",
    neg: [],
    hA: ["Treca-Betten probeliegen", "Treca in Lochau erleben", "Matratzen in Ruhe testen", "Betten aus Paris", "Bett und Matratze wählen", "Schlafzimmer planen", "Beratung zum Liegegefühl"],
    hB: ["Treca im Showroom", "Treca-Matratze probeliegen", "Schlafzimmer komplett planen", "Bett, Stoff und Kopfteil", "Raumplanung inklusive", "Probeliegen nach Termin", "Einrichten am Bodensee"],
    dA: ["Treca-Betten und Matratzen im Showroom in Lochau probeliegen und in Ruhe vergleichen.", "Härtegrad, Bezug, Kopfteil: Wir beraten Sie persönlich zum passenden Treca-Bett."],
    dB: ["Schlafzimmer komplett planen: Bett, Schrank, Licht und Textilien aus einer Hand.", "Probeliegen mit Termin: Wir nehmen uns Zeit. Termin online anfragen."],
  },
  wohnenGeneric: {
    name: "Designermoebel-Region", urlKey: "genericUrl", p1: "Designmoebel", p2: "Showroom",
    regionalOnly: ["designermöbel {CITY}", "designmöbel {CITY}", "einrichtungshaus {CITY}", "designer sofa {CITY}", "italienische möbel {CITY}", "einrichtungsberatung {CITY}", "interior design {CITY}"],
    neg: ["minotti", "poliform", "rimadesio", "treca", "küche", "outdoor", "garten"],
    hA: ["Designermöbel am Bodensee", "Italienisches Design am See", "Sofas, Schränke, Leuchten", "Minotti, Poliform und mehr", "Einrichtung aus einer Hand", "Ausstellung in Lochau", "Raumplanung inklusive"],
    hB: ["Ihr Einrichtungsstudio", "Wohnen, Licht und Textil", "Design live erleben", "Möbel in Ruhe ansehen", "Einrichten am Bodensee", "Flos, ClassiCon, Tom Dixon", "Persönlich beraten lassen"],
    dA: ["Designermöbel von Minotti, Poliform, Rimadesio und mehr im Showroom in Lochau.", "Wir planen Wohnräume persönlich: Möbel, Licht, Teppiche und Textilien aus einer Hand."],
    dB: ["Sofas, Leuchten, Schränke und Outdoor: im Showroom mit Café vergleichen und planen.", "Vom ersten Gespräch bis zum fertigen Raum: Termin online anfragen und vorbeikommen."],
  },
  poliformKueche: {
    name: "Kueche-Poliform-Varenna", url: "/de/ueber-uns/marken/poliform", p1: "Kueche", p2: "Poliform",
    kw: [["poliform küche", 1], ["poliform küchen", 1], ["varenna küche", 1], ["varenna poliform", 1], ["poliform varenna küche", 1], ["poliform kitchen", 0], ["poliform küche preis", 0]],
    brandRegional: "poliform küche {CITY}",
    neg: ["comer see", "lago di como", "hotel", "urlaub", "ferienwohnung", "fähre", "villa", "wetter"],
    hA: ["Poliform-Küchen erleben", "Varenna-Küchen ansehen", "Poliform-Küche planen", "Küche und Wohnen vereint", "Italienische Designküche", "Küchenplanung im Showroom", "Geräte und Stein beraten"],
    hB: ["Ihre Küche mit Poliform", "Varenna im Showroom", "Küche und Wohnraum planen", "Planung in Ruhe", "Küche, Esstisch, Licht", "Grundriss mitbringen", "Küche am Bodensee planen"],
    dA: ["Poliform- und Varenna-Küchen im Showroom in Lochau erleben und persönlich planen.", "Wir planen Küche und Wohnraum zusammen, damit Fronten, Tisch und Licht zusammenpassen."],
    dB: ["Grundriss mitbringen: Wir planen Ihre Poliform-Küche mit Geräten und Arbeitsplatte.", "Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen."],
  },
  next125: {
    name: "Kueche-next125-Schueller", url: "/de/ueber-uns/marken/next125", p1: "Kueche", p2: "next125",
    kw: [["next125", 1], ["next125 küche", 1], ["next125 küchen", 1], ["next 125 küche", 1], ["schüller küche", 1], ["schüller küchen", 1], ["next125 kaufen", 0], ["schüller küche kaufen", 0]],
    brandRegional: "next125 {CITY}",
    neg: ["ersatzteile", "griffe", "aufbauanleitung", "montageanleitung", "125ccm", "motorrad", "roller"],
    hA: ["next125-Küchen ansehen", "Schüller-Küchen planen", "next125 in Lochau erleben", "Moderne Küche planen", "Küchenplanung im Showroom", "Geräte und Stein beraten", "Grundriss mitbringen"],
    hB: ["Ihre Küche mit next125", "Schüller im Showroom", "Küche und Wohnraum planen", "Planung in Ruhe", "Küche, Esstisch, Licht", "Küche am Bodensee planen", "Fronten live vergleichen"],
    dA: ["next125- und Schüller-Küchen im Showroom in Lochau ansehen und persönlich planen.", "Fronten, Arbeitsplatte, Geräte: Wir planen Ihre Küche passend zu Raum und Alltag."],
    dB: ["Grundriss mitbringen: Wir planen Ihre Küche mit Geräten, Licht und Arbeitsplatte.", "Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen."],
  },
  binni: {
    name: "Designkueche-Steinplatte", url: "/de/kuechen-vorarlberg", p1: "Kueche", p2: "Steinplatte",
    kw: [["küche mit steinarbeitsplatte", 1], ["küche mit steinplatte", 1], ["küche mit marmorarbeitsplatte", 1], ["küche mit marmor arbeitsplatte", 0], ["küche mit keramikarbeitsplatte", 1], ["küche mit keramik arbeitsplatte", 0], ["küche mit naturstein arbeitsplatte", 1], ["küche mit granitarbeitsplatte", 0], ["designküche mit stein", 1], ["designküche preis", 0], ["moderne küche mit steinarbeitsplatte", 0]],
    regionalOnly: ["designküche {CITY}", "küche mit stein {CITY}"],
    neg: ["selber machen", "diy", "reinigen", "pflege", "fleck", "kratzer", "zuschnitt", "restposten", "reste", "nachträglich", "nur arbeitsplatte", "steinmetz", "erfahrungen nachteile", "ikea", "nobilia", "poliform", "next125", "schüller"],
    hA: ["Designküche mit Steinplatte", "Echte Steinarbeitsplatte", "Marmor, Keramik oder Quarz", "Küche mit Stein planen", "Steinmuster vor Ort", "Gefertigt im Kosovo", "Planung im Showroom"],
    hB: ["Stein-Küche in Ruhe planen", "Manufakturpartner Binni", "Arbeitsplatte aus Stein", "Küche samt Steinplatte", "Grundriss mitbringen", "Küche am Bodensee planen", "Steinarten vergleichen"],
    dA: ["Designküchen mit echter Steinarbeitsplatte, geplant in Lochau und gefertigt im Kosovo.", "Marmor, Keramik oder Quarz: Wir zeigen Ihnen die Unterschiede an echten Mustern."],
    dB: ["Gefertigt von unserem Manufakturpartner Binni im Kosovo, geplant von Platzhirsch.", "Grundriss mitbringen: Wir planen Ihre Küche mit Stein, Geräten und Licht."],
  },
  kuecheGeneric: {
    name: "Kuechenstudio-Region", urlKey: "kitchenUrl", p1: "Kueche", p2: "Planung",
    regionalOnly: ["küchenstudio {CITY}", "küchenplanung {CITY}", "designküche {CITY}", "küche kaufen {CITY}", "küchenbauer {CITY}", "einbauküche {CITY}"],
    neg: ["ikea", "nobilia", "gebrauchte küche", "küchenzeile", "miniküche", "single küche", "poliform", "next125", "schüller"],
    hA: ["Küchenstudio am Bodensee", "Küchenplanung in Lochau", "Poliform, next125, Schüller", "Designküche planen", "Küche und Wohnen vereint", "Geräte und Stein beraten", "Grundriss mitbringen"],
    hB: ["Ihre neue Küche planen", "Küchen live vergleichen", "Küche, Esstisch, Licht", "Planung in Ruhe", "Fronten und Steinmuster", "Küche am Bodensee planen", "Küche mit Steinplatte"],
    dA: ["Küchen von Poliform, next125 und Schüller im Showroom in Lochau ansehen und planen.", "Wir planen Küche und Wohnraum zusammen: Fronten, Arbeitsplatte, Geräte und Licht."],
    dB: ["Grundriss mitbringen: Wir zeichnen Ihre Küche und besprechen Geräte und Stein.", "Küchenplanung mit Termin: Wir nehmen uns Zeit für Ihr Projekt. Jetzt anfragen."],
  },
  outdoorSchirme: {
    name: "Outdoor-Tuuci-Umbrosa", url: "/de/produkte/parasols", p1: "Outdoor", p2: "Sonnenschirme",
    kw: [["tuuci", 1], ["tuuci sonnenschirm", 1], ["tuuci schirm", 1], ["umbrosa", 1], ["umbrosa sonnenschirm", 1], ["umbrosa paraflex", 1], ["umbrosa icarus", 0], ["design sonnenschirm", 1], ["sonnenschirm gastronomie", 1], ["großschirm gastronomie", 0], ["sonnenschirm hotel terrasse", 0]],
    neg: ["ersatzteile", "bezug ersatz", "ständer gebraucht", "obi", "hornbach", "aldi", "lidl", "tchibo", "dehner", "hagebau"],
    hA: ["Tuuci-Sonnenschirme ansehen", "Umbrosa-Schirme erleben", "Design-Sonnenschirme", "Schirme für Hotel und Terrasse", "Terrasse am See planen", "Outdoor im Showroom", "Beratung für Gastronomie"],
    hB: ["Großschirme für Terrassen", "Sonnenschutz planen lassen", "Tuuci und Umbrosa vergleichen", "Für Garten und Gastronomie", "Planung für Hotelterrassen", "Outdoor am Bodensee", "Lounge, Schirm, Heizung"],
    dA: ["Sonnenschirme von Tuuci und Umbrosa im Showroom in Lochau ansehen und beraten lassen.", "Für Garten, Terrasse und Gastronomie: Wir planen Sonnenschutz passend zum Ort."],
    dB: ["Hotel oder Restaurant? Wir planen Schirme, Lounge und Heizung für Ihre Terrasse.", "Outdoor mit Tuuci, Umbrosa, Paola Lenti und Heatsail: Termin online anfragen."],
  },
  outdoorMoebel: {
    name: "Outdoor-Moebel-Lenti-Gloster-Heatsail", url: "/de/produkte/lounge-furniture-daybeds", p1: "Outdoor", p2: "Lounge",
    kw: [["paola lenti", 1], ["paola lenti outdoor", 1], ["paola lenti lounge", 1], ["gloster gartenmöbel", 1], ["gloster outdoor möbel", 1], ["gloster teak", 0], ["heatsail", 1], ["heatsail heizstrahler", 1], ["design gartenmöbel", 1], ["outdoor loungemöbel design", 0]],
    regionalOnly: ["gartenmöbel {CITY}", "outdoor möbel {CITY}", "loungemöbel {CITY}"],
    neg: ["gloster meteor", "gloster gladiator", "flugzeug", "gloucester", "obi", "hornbach", "aldi", "lidl", "tchibo", "dehner", "hagebau", "polyrattan", "gebraucht"],
    hA: ["Outdoor-Lounges erleben", "Paola Lenti live ansehen", "Gloster-Gartenmöbel", "Heatsail für die Terrasse", "Design-Gartenmöbel", "Terrasse am See planen", "Outdoor im Showroom"],
    hB: ["Ihre Terrasse planen lassen", "Lounge, Schirm, Heizung", "Für Garten und Gastronomie", "Planung für Hotelterrassen", "Outdoor am Bodensee", "Stoffe für draußen ansehen", "Outdoor in Ruhe planen"],
    dA: ["Outdoor-Möbel von Paola Lenti, Gloster und Heatsail im Showroom in Lochau erleben.", "Lounge, Esstisch, Sonnenschirm, Heizung: Wir planen Ihre Terrasse als Ganzes."],
    dB: ["Hotel oder Restaurant? Wir planen Lounge, Schirme und Heizung für Ihre Terrasse.", "Outdoor mit Paola Lenti, Gloster, Tuuci und Heatsail: Termin online anfragen."],
  },
};

const THEMES = {
  Wohnen: ["minotti", "poliform", "rimadesio", "treca", "wohnenGeneric"],
  Kueche: ["poliformKueche", "next125", "binni", "kuecheGeneric"],
  Outdoor: ["outdoorSchirme", "outdoorMoebel"],
};

// ---------- Kampagnen ----------
// Budget (Monat, EUR) je Stufe 1/2/3
const BUDGET = {
  "PH-S1-Eigene-Marke": [150, 250, 300],
  "AT-Vorarlberg-Arlberg|Wohnen": [400, 550, 850], "AT-Vorarlberg-Arlberg|Kueche": [300, 450, 700], "AT-Vorarlberg-Arlberg|Outdoor": [0, 200, 350],
  "DE-Sued-Bodensee-Allgaeu|Wohnen": [450, 650, 950], "DE-Sued-Bodensee-Allgaeu|Kueche": [350, 500, 750], "DE-Sued-Bodensee-Allgaeu|Outdoor": [0, 200, 350],
  "CH-Ost|Wohnen": [0, 200, 450], "CH-Ost|Kueche": [0, 150, 300], "CH-Ost|Outdoor": [0, 0, 150],
  "FL-Liechtenstein|Alle": [0, 100, 150],
};

const chify = (s) => s.replace(/ß/g, "ss");
const fill = (s, r) => s.replace(/\{REGLONG\}/g, r.regLong);
const campaigns = []; // {name, region, theme, ags:[agKey]}
for (const r of Object.values(REGIONS)) {
  if (r.code === "FL") campaigns.push({ name: `PH-S2-${r.name}-Alle`, key: `${r.name}|Alle`, region: r, theme: "Alle", ags: [...THEMES.Wohnen, ...THEMES.Kueche, ...THEMES.Outdoor] });
  else for (const [t, ags] of Object.entries(THEMES)) campaigns.push({ name: `PH-S2-${r.name}-${t}`, key: `${r.name}|${t}`, region: r, theme: t, ags });
}

function check(kind, text, max, ctx) {
  if (text.length > max) errors.push(`${kind} ${text.length}>${max}: "${text}" (${ctx})`);
  if (FORBIDDEN.test(text)) errors.push(`${kind} verbotenes Wort: "${text}" (${ctx})`);
}

const csvEsc = (v) => { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
const writeCsv = (file, header, rows) => fs.writeFileSync(path.join(OUT, file), "﻿" + [header, ...rows].map((r) => r.map(csvEsc).join(",")).join("\r\n") + "\r\n", "utf8");

const rowsCamp = [], rowsLoc = [], rowsAG = [], rowsKw = [], rowsNeg = [], rowsAds = [], rowsSl = [], rowsCo = [], rowsSn = [], rowsCall = [];
const SCHEDULE = "(Monday[06:00-23:00]);(Tuesday[06:00-23:00]);(Wednesday[06:00-23:00]);(Thursday[06:00-23:00]);(Friday[06:00-23:00]);(Saturday[07:00-23:00]);(Sunday[08:00-23:00])";

const ACCOUNT_NEG = ["gebraucht", "gebrauchte", "second hand", "ebay", "willhaben", "kleinanzeigen", "ricardo", "tutti", "anibis", "ikea", "xxxlutz", "möbelix", "kika", "leiner", "höffner", "segmüller", "pfister", "conforama", "jysk", "günstig", "billig", "replica", "replik", "nachbau", "dupe", "fake", "kopie", "imitat", "job", "jobs", "stellenangebot", "stellenangebote", "karriere", "ausbildung", "lehre", "praktikum", "gehalt", "pdf", "kostenlos", "gratis", "lieferant werden", "wikipedia", "logo", "aktie", "lebenslauf", "designer biografie"];

function addAssets(cname, r) {
  const t = (s) => (r.ch ? chify(s) : s);
  const sl = [
    { t: "Termin vereinbaren", d1: "Beratung im Showroom Lochau", d2: "Online anfragen", u: "/de/beratung" },
    { t: "Unsere Marken", d1: "Minotti, Poliform, Rimadesio", d2: "Flos, ClassiCon, Paola Lenti", u: "/de/ueber-uns/marken" },
    { t: "Küchenplanung", d1: "Poliform, next125, Schüller", d2: "Planung im Showroom", u: "/de/kuechen-vorarlberg" },
    { t: "Outdoor und Terrasse", d1: "Tuuci, Umbrosa, Paola Lenti", d2: "Für Garten, Hotel, Restaurant", u: "/de/produkte/parasols" },
    { t: "Anfahrt und Kontakt", d1: "Landstraße 9, 6911 Lochau", d2: "Showroom mit Café", u: "/de/kontakt" },
    r.sitelinkRegion,
  ];
  for (const s of sl) {
    const x = { t: t(s.t), d1: t(s.d1), d2: t(s.d2) };
    check("Sitelink", x.t, 25, cname); check("SL-Beschr.", x.d1, 35, cname); check("SL-Beschr.", x.d2, 35, cname);
    rowsSl.push([cname, x.t, x.d1, x.d2, BASE + s.u]);
  }
  const co = ["Showroom mit Café", "Persönliche Planung", "Termin online anfragen", "Wohnen, Küche, Outdoor", "Beratung ohne Zeitdruck", "Termin nach Vereinbarung", r.code === "FL" ? "Kunden aus Liechtenstein" : r.code === "CH" ? "Kunden aus der Ostschweiz" : "Am Bodensee in Lochau"];
  for (const c of co) { const x = t(c); check("Callout", x, 25, cname); rowsCo.push([cname, x]); }
  const sn = ["Minotti", "Poliform", "Rimadesio", "Flos", "ClassiCon", "Paola Lenti", "Tom Dixon", "Tuuci"];
  rowsSn.push([cname, "Marken", sn.join(";")]);
  rowsSn.push([cname, "Sortiment", ["Sofas", "Küchen", "Schränke", "Betten", "Leuchten", "Outdoor-Möbel"].join(";")]);
  rowsCall.push([cname, "AT", "+43 5574 46255", "(Tuesday[10:00-18:00]);(Wednesday[10:00-18:00]);(Thursday[10:00-18:00]);(Friday[10:00-18:00]);(Saturday[10:00-14:00])"]);
}

function addCampaign(cname, r, key, langs = "de") {
  const b = BUDGET[key];
  rowsCamp.push([cname, "Search", "Google search", (b[0] / 30.4).toFixed(2), (b[1] / 30.4).toFixed(2), (b[2] / 30.4).toFixed(2), "Daily", "Maximize conversions", "Paused", langs, "Presence", SCHEDULE, "Doesn't have EU political ads", b.join("/")]);
  for (const loc of r ? r.locations : Object.values(REGIONS).flatMap((x) => x.locations)) rowsLoc.push([cname, loc, ""]);
  for (const n of ACCOUNT_NEG) rowsNeg.push([cname, "", n, "Negative Phrase"]);
}

// S1 Eigene Marke
{
  const cname = "PH-S1-Eigene-Marke";
  addCampaign(cname, null, cname);
  const ag = "Platzhirsch-Marke";
  rowsAG.push([cname, ag, "Enabled"]);
  for (const k of ["platzhirsch lochau", "platzhirsch home living", "platzhirsch studio", "platzhirsch möbel", "platzhirsch einrichtung", "platzhirsch bregenz", "platzhirsch.studio", "platzhirsch küchen", "platzhirsch showroom", "platzhirsch café lochau"]) {
    rowsKw.push([cname, ag, k, "Phrase"]); rowsKw.push([cname, ag, k, "Exact"]);
  }
  for (const n of ["bier", "brauerei", "jagd", "hirsch kaufen", "geweih", "tracht", "lederhose", "spiel", "film", "bedeutung", "gasthaus", "gasthof", "pension", "app", "wien", "münchen", "berlin", "hamburg"]) rowsNeg.push([cname, "", n, "Negative Phrase"]);
  const hA = ["Platzhirsch Home Living", "Platzhirsch in Lochau", "Showroom mit Café", "Wohnen, Küche, Outdoor", "Minotti, Poliform und mehr", "Persönliche Planung", "Jetzt Termin vereinbaren", "Termin online anfragen", "Landstraße 9 in Lochau", "Einrichten am Bodensee", "Beratung ohne Zeitdruck", "Termin nach Vereinbarung", "Designküchen und Möbel", "Outdoor für Garten und Hotel", "Italienisches Design am See"];
  const hB = ["Platzhirsch Lochau", "Platzhirsch Home Living", "Einrichtungsstudio mit Café", "Showroom am Bodensee", "Sofas, Küchen, Leuchten", "Design live erleben", "Raumplanung inklusive", "Küche und Wohnen vereint", "Flos, ClassiCon, Tom Dixon", "Rimadesio und Treca", "Tuuci, Umbrosa, Paola Lenti", "Termin online anfragen", "Persönlich beraten lassen", "Möbel in Ruhe ansehen", "Für AT, DE, CH und FL"];
  const dA = ["Platzhirsch Home Living: Einrichtungsstudio mit Café in Lochau am Bodensee.", "Minotti, Poliform, Rimadesio, Flos und mehr im Showroom erleben und planen lassen.", "Termin online anfragen und in Ruhe vergleichen. Landstraße 9, 6911 Lochau am Bodensee.", "Wohnen, Küche und Outdoor aus einer Hand. Termine auch nach Vereinbarung."];
  const dB = ["Showroom mit Café in Lochau. Termine auch außerhalb der Öffnungszeiten nach Vereinbarung.", "Wir planen Wohnräume persönlich: Möbel, Licht, Küche und Outdoor aus einer Hand.", "Kundinnen und Kunden aus Österreich, Deutschland, der Schweiz und Liechtenstein.", "Jetzt Termin online anfragen: Wir melden uns persönlich bei Ihnen."];
  for (const [hs, ds, p2] of [[hA, dA, "Showroom"], [hB, dB, "Termin"]]) {
    hs.forEach((h) => check("Headline", h, 30, cname)); ds.forEach((d) => check("Beschreibung", d, 90, cname));
    if (new Set(hs).size !== 15) errors.push(`Doppelte Headlines in ${cname}`);
    rowsAds.push([cname, ag, "Responsive search ad", ...hs, ...ds, "Platzhirsch", p2, BASE + "/de", "Paused"]);
  }
  addAssets(cname, REGIONS.AT);
}

for (const c of campaigns) {
  const r = c.region;
  addCampaign(c.name, r, c.key);
  addAssets(c.name, r);
  for (const k of c.ags) {
    const a = AG[k];
    const agName = a.name;
    rowsAG.push([c.name, agName, "Enabled"]);
    const kws = [];
    for (const [kw, ex] of a.kw || []) { kws.push([kw, "Phrase"]); if (ex) kws.push([kw, "Exact"]); }
    if (a.brandRegional) for (const city of r.brandCities) kws.push([a.brandRegional.replace("{CITY}", city), "Phrase"]);
    for (const tpl of a.regionalOnly || []) for (const city of r.cities) { const kw = tpl.replace("{CITY}", city); kws.push([kw, "Phrase"]); kws.push([kw, "Exact"]); }
    for (const [kw, mt] of kws) rowsKw.push([c.name, agName, r.ch ? chify(kw) : kw, mt]);
    for (const n of a.neg) rowsNeg.push([c.name, agName, n, "Negative Phrase"]);
    if (c.theme === "Alle") { /* Kein theme-weiter Ausschluss in FL */ }
    const url = BASE + (a.urlKey ? r[a.urlKey] : a.url);
    const hA = [...a.hA, ...r.regH, ...COMMON_A].map((h) => (r.ch ? chify(h) : h));
    const hB = [...a.hB, ...r.regH, ...COMMON_B].map((h) => (r.ch ? chify(h) : h));
    const dA = [...a.dA, ...DESC_COMMON_A].map((d) => { d = fill(d, r); return r.ch ? chify(d) : d; });
    const dB = [...a.dB, ...DESC_COMMON_B].map((d) => { d = fill(d, r); return r.ch ? chify(d) : d; });
    for (const [hs, ds, tag] of [[hA, dA, "A"], [hB, dB, "B"]]) {
      const ctx = `${c.name} / ${agName} / RSA ${tag}`;
      hs.forEach((h) => check("Headline", h, 30, ctx)); ds.forEach((d) => check("Beschreibung", d, 90, ctx));
      if (hs.length !== 15 || new Set(hs).size !== 15) errors.push(`Headlines != 15 eindeutig: ${ctx}`);
      if (ds.length !== 4) errors.push(`Beschreibungen != 4: ${ctx}`);
      check("Pfad", a.p1, 15, ctx); check("Pfad", a.p2, 15, ctx);
      rowsAds.push([c.name, agName, "Responsive search ad", ...hs, ...ds, a.p1, a.p2, url, "Paused"]);
    }
  }
}

const H = Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`);
const D = Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`);
writeCsv("01-kampagnen.csv", ["Campaign", "Campaign Type", "Networks", "Budget Stufe1", "Budget Stufe2", "Budget Stufe3", "Budget type", "Bid Strategy Type", "Campaign Status", "Languages", "Location targeting", "Ad Schedule", "EU political ads", "Monatsbudget EUR S1/S2/S3"], rowsCamp);
writeCsv("02-standorte.csv", ["Campaign", "Location", "Bid Modifier"], rowsLoc);
writeCsv("03-anzeigengruppen.csv", ["Campaign", "Ad Group", "Ad Group Status"], rowsAG);
writeCsv("04-keywords.csv", ["Campaign", "Ad Group", "Keyword", "Criterion Type"], rowsKw);
writeCsv("05-negative-keywords.csv", ["Campaign", "Ad Group", "Keyword", "Criterion Type"], rowsNeg);
writeCsv("06-anzeigen-rsa.csv", ["Campaign", "Ad Group", "Ad type", ...H, ...D, "Path 1", "Path 2", "Final URL", "Status"], rowsAds);
writeCsv("07-sitelinks.csv", ["Campaign", "Sitelink text", "Description line 1", "Description line 2", "Final URL"], rowsSl);
writeCsv("08-callouts.csv", ["Campaign", "Callout text"], rowsCo);
writeCsv("09-snippets.csv", ["Campaign", "Header", "Values"], rowsSn);
writeCsv("10-anruf-assets.csv", ["Campaign", "Country code", "Phone number", "Ad Schedule"], rowsCall);
writeCsv("11-negativliste-konto.csv", ["Keyword", "Criterion Type"], ACCOUNT_NEG.map((n) => [n, "Negative Phrase"]));

// ---------- Anhang für das Markdown ----------
const md = [];
const L = (s) => `${s} (${s.length})`;
md.push("## Anhang A – Anzeigentexte je Anzeigengruppe (Vorlage AT, mit Zeichenzahl)\n");
md.push("Die Regionen DE, CH und FL tauschen nur die drei Regions-Headlines (Abschnitt 6.2) und den Regionsnamen in Beschreibung 4; CH und FL schreiben „ss“ statt „ß“. Alle Varianten stehen vollständig in `06-anzeigen-rsa.csv`.\n");
const r = REGIONS.AT;
for (const k of Object.keys(AG)) {
  const a = AG[k];
  md.push(`### ${a.name}\n`);
  md.push(`Ziel-URL: \`${a.urlKey ? r[a.urlKey] : a.url}\` (AT) · Pfad: \`/${a.p1}/${a.p2}\`\n`);
  md.push("| # | RSA A – Produkt | RSA B – Planung/Service |\n|---|---|---|");
  const hA = [...a.hA, ...r.regH, ...COMMON_A], hB = [...a.hB, ...r.regH, ...COMMON_B];
  for (let i = 0; i < 15; i++) md.push(`| H${i + 1} | ${L(hA[i])} | ${L(hB[i])} |`);
  const dA = [...a.dA, ...DESC_COMMON_A].map((d) => fill(d, r)), dB = [...a.dB, ...DESC_COMMON_B].map((d) => fill(d, r));
  for (let i = 0; i < 4; i++) md.push(`| D${i + 1} | ${L(dA[i])} | ${L(dB[i])} |`);
  md.push("");
}
md.push("## Anhang B – Keywords je Anzeigengruppe (Vorlage AT)\n");
md.push("P = Phrase (\"…\"), E = Exact ([…]). Regionale Keywords werden pro Region mit den Orten aus Abschnitt 6.1 erzeugt.\n");
md.push("| Anzeigengruppe | Keywords | Regional (Muster) | AG-Negatives (Phrase) |\n|---|---|---|---|");
for (const k of Object.keys(AG)) {
  const a = AG[k];
  const kw = (a.kw || []).map(([w, e]) => `${w} (${e ? "P+E" : "P"})`).join(", ") || "–";
  const reg = [a.brandRegional, ...(a.regionalOnly || [])].filter(Boolean).join(", ") || "–";
  md.push(`| ${a.name} | ${kw} | ${reg} | ${a.neg.join(", ") || "–"} |`);
}
md.push("");
fs.writeFileSync(APPX, md.join("\n"), "utf8");

const stats = { campaigns: rowsCamp.length, adgroups: rowsAG.length, keywords: rowsKw.length, negatives: rowsNeg.length, rsas: rowsAds.length, sitelinks: rowsSl.length, callouts: rowsCo.length };
console.log(JSON.stringify(stats));
if (errors.length) { console.log("FEHLER:\n" + errors.join("\n")); process.exit(1); }
console.log("OK – alle Längen und Wortprüfungen bestanden");
