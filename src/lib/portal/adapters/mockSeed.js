import "server-only";
import { AMOUNT_ON_REQUEST } from "../constants";

// Demo data for the mock adapter. Written once to /.data/portal/demo.json and
// edited there afterwards. Dates are relative to the moment of seeding so the
// dashboard always looks "current". Delete the file to re-seed.
//
// Content rules: no prices (amount null + placeholder), no invented partner
// companies or references – trades show "Partnerbetrieb (Name folgt)".

export const DEMO_EMAIL = "demo@kunde.example";
const DEMO_ID = "CUST-DEMO-0001";

function at(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour - 1, minute, 0, 0); // ~ Europe/Vienna (CET); good enough for demo data
  return d.toISOString();
}
const day = (days) => at(days).slice(0, 10);

function steps(currentKey, dates) {
  const keys = ["anfrage", "planung", "angebot", "auftrag", "bestellung", "lieferung", "montage", "uebergabe"];
  const current = keys.indexOf(currentKey);
  return keys.map((key, i) => ({
    key,
    state: i < current ? "erledigt" : i === current ? "aktiv" : "offen",
    date: dates[key] ?? null,
  }));
}

export function buildSeed() {
  const advisor = {
    name: "Ihr Platzhirsch-Beratungsteam",
    email: "info@platzhirsch.studio",
    phone: "+43 5574 46255",
  };

  const customers = [
    {
      id: DEMO_ID,
      email: DEMO_EMAIL,
      salutation: "Familie",
      firstName: "Anna",
      lastName: "Muster",
      displayName: "Familie Muster",
      phone: "+43 660 0000000",
      address: { street: "Musterweg 1", zip: "6900", city: "Bregenz", country: "AT" },
      advisor,
    },
  ];

  const projects = [
    {
      id: "PRJ-2026-014",
      customerId: DEMO_ID,
      title: "Wohnzimmer am See",
      room: "Wohnzimmer",
      summary: "Neue Sitzlandschaft mit Teppich nach Maß und Bogenleuchte über dem Lesesessel.",
      currentStep: "bestellung",
      steps: steps("bestellung", {
        anfrage: day(-62),
        planung: day(-48),
        angebot: day(-35),
        auftrag: day(-28),
        bestellung: day(-21),
        lieferung: day(16),
        montage: day(16),
        uebergabe: day(17),
      }),
      items: [
        {
          id: "POS-014-1",
          name: "Sofa Connery",
          brand: "Minotti",
          category: "Sofa",
          quantity: 1,
          variant: "Eckkombination, Bezug Stoff (Muster in Abstimmung)",
          status: "bestellt",
          productPassId: "PASS-014-1",
        },
        {
          id: "POS-014-2",
          name: "Teppich nach Maß",
          brand: "Paola Lenti",
          category: "Teppich",
          quantity: 1,
          variant: "Maß nach Aufmaß, Farbe nach Musterkarte",
          status: "bestellt",
          productPassId: "PASS-014-2",
        },
        {
          id: "POS-014-3",
          name: "Bogenleuchte Arco",
          brand: "Flos",
          category: "Leuchte",
          quantity: 1,
          variant: "Marmorsockel",
          status: "bestellt",
          productPassId: "PASS-014-3",
        },
      ],
      trades: [],
      createdAt: at(-62),
      updatedAt: at(-2),
    },
    {
      id: "PRJ-2026-021",
      customerId: DEMO_ID,
      title: "Binni Stein-Küche",
      room: "Küche",
      summary: "Küche mit Steinarbeitsplatte; Tischler, Elektriker, Installateur und Steinmetz werden vom Studio koordiniert.",
      currentStep: "angebot",
      steps: steps("angebot", {
        anfrage: day(-30),
        planung: day(-18),
        angebot: day(-1),
        auftrag: null,
        bestellung: null,
        lieferung: null,
        montage: null,
        uebergabe: null,
      }),
      items: [
        {
          id: "POS-021-1",
          name: "Küchenzeile mit Insel",
          brand: "Binni",
          category: "Küche",
          quantity: 1,
          variant: "Fronten und Griffleisten lt. Planung V2",
          status: "angeboten",
          productPassId: null,
        },
        {
          id: "POS-021-2",
          name: "Arbeitsplatte Naturstein",
          brand: "Steinmetz (Partnerbetrieb)",
          category: "Arbeitsplatte",
          quantity: 1,
          variant: "Gesteinssorte nach Bemusterung",
          status: "geplant",
          productPassId: null,
        },
      ],
      trades: [
        { id: "GW-021-1", trade: "tischler", company: "Partnerbetrieb (Name folgt)", status: "geplant", scope: "Korpusmontage, Passblenden, Nischenverkleidung", appointmentId: null },
        { id: "GW-021-2", trade: "elektriker", company: "Partnerbetrieb (Name folgt)", status: "offen", scope: "Anschlüsse Kochfeld, Backofen, Beleuchtung Insel", appointmentId: null },
        { id: "GW-021-3", trade: "installateur", company: "Partnerbetrieb (Name folgt)", status: "offen", scope: "Wasser/Abwasser Spüle und Geschirrspüler an der Insel", appointmentId: null },
        { id: "GW-021-4", trade: "steinmetz", company: "Partnerbetrieb (Name folgt)", status: "geplant", scope: "Aufmaß nach Korpusmontage, Arbeitsplatte und Rückwand", appointmentId: "TER-021-2" },
      ],
      createdAt: at(-30),
      updatedAt: at(-1),
    },
  ];

  const doc = (id, type, projectId, title, number, days, status, file = true) => ({
    id,
    customerId: DEMO_ID,
    type,
    projectId,
    title,
    number,
    date: at(days),
    status,
    amount: null,
    amountNote: AMOUNT_ON_REQUEST,
    file: file ? { name: `${number}.pdf`, mime: "application/pdf", size: 0, storageKey: `demo/${number}.pdf` } : null,
  });

  const documents = [
    doc("SAL-QTN-2026-00031", "angebot", "PRJ-2026-021", "Angebot Binni Stein-Küche, Planung V2", "SAL-QTN-2026-00031", -1, "neu"),
    doc("SAL-QTN-2026-00017", "angebot", "PRJ-2026-014", "Angebot Wohnzimmer", "SAL-QTN-2026-00017", -35, "angenommen"),
    doc("SAL-ORD-2026-00009", "auftragsbestaetigung", "PRJ-2026-014", "Auftragsbestätigung Wohnzimmer", "SAL-ORD-2026-00009", -28, "gelesen"),
    doc("ACC-SINV-2026-00004", "rechnung", "PRJ-2026-014", "Anzahlungsrechnung Wohnzimmer", "ACC-SINV-2026-00004", -27, "offen"),
  ];

  const appointments = [
    {
      id: "TER-021-1",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      kind: "planung",
      title: "Angebotsbesprechung Küche",
      start: at(3, 15, 0),
      end: at(3, 16, 30),
      location: "Showroom Lochau, Landstraße 11",
      status: "bestaetigt",
      note: "Bitte Fotos der Anschlüsse mitbringen, falls vorhanden.",
    },
    {
      id: "TER-021-2",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      kind: "aufmass",
      title: "Aufmaß Steinmetz (nach Freigabe)",
      start: at(24, 9, 0),
      end: at(24, 10, 0),
      location: "Bei Ihnen zu Hause",
      status: "angefragt",
    },
    {
      id: "TER-014-1",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-014",
      kind: "lieferung",
      title: "Lieferung und Montage Wohnzimmer",
      start: at(16, 8, 0),
      end: at(16, 12, 0),
      location: "Bei Ihnen zu Hause",
      status: "angefragt",
      note: "Termin vorbehaltlich der Liefermeldung des Herstellers.",
    },
  ];

  const pass = (id, itemId, product, brand, materials, care, note) => ({
    id,
    customerId: DEMO_ID,
    itemId,
    projectId: "PRJ-2026-014",
    product,
    brand,
    serialNumber: null,
    materials,
    care,
    warranty: { months: null, note },
    deliveredAt: null,
    attachments: [],
  });

  const productPasses = [
    pass("PASS-014-1", "POS-014-1", "Sofa Connery", "Minotti", ["Bezugsstoff lt. Auftrag"], ["Pflegehinweise des Herstellers folgen mit der Lieferung."], "Garantiebedingungen lt. Hersteller – werden bei Übergabe ergänzt."),
    pass("PASS-014-2", "POS-014-2", "Teppich nach Maß", "Paola Lenti", ["Material lt. Musterkarte"], ["Regelmäßig ohne Bürstenwalze saugen.", "Flecken sofort tupfen, nicht reiben."], "Garantiebedingungen lt. Hersteller – werden bei Übergabe ergänzt."),
    pass("PASS-014-3", "POS-014-3", "Bogenleuchte Arco", "Flos", ["Marmorsockel", "Edelstahl"], ["Marmor nur mit pH-neutralem Reiniger behandeln."], "Garantiebedingungen lt. Hersteller – werden bei Übergabe ergänzt."),
  ];

  const renderings = [
    {
      id: "REN-021-1",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      title: "Küche – Planung V1",
      version: 1,
      createdAt: at(-18),
      image: null,
      description: "Erste Planung mit Inselblock.",
      aiGenerated: false,
    },
    {
      id: "REN-021-2",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      title: "Küche – Planung V2, Stimmungsbild",
      version: 2,
      createdAt: at(-2),
      image: null,
      description: "Stimmungsbild zur Materialwirkung (KI-gestützt erstellt, nicht maßstäblich).",
      aiGenerated: true,
    },
  ];

  const messages = [
    {
      id: "MSG-3",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      from: "studio",
      author: advisor.name,
      body: "Das Angebot zur Küche ist online. Wir gehen es gerne beim Termin im Showroom gemeinsam durch.",
      sentAt: at(-1, 17, 10),
      read: false,
    },
    {
      id: "MSG-2",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-014",
      from: "studio",
      author: advisor.name,
      body: "Die Bestellung beim Hersteller ist bestätigt. Sobald die Liefermeldung da ist, fixieren wir den Liefertermin mit Ihnen.",
      sentAt: at(-6, 11, 40),
      read: true,
    },
    {
      id: "MSG-1",
      customerId: DEMO_ID,
      projectId: "PRJ-2026-021",
      from: "kunde",
      author: "Anna Muster",
      body: "Könnten wir bei der Insel noch eine Variante mit Sitzplatz an der Stirnseite sehen?",
      sentAt: at(-9, 20, 5),
      read: true,
    },
  ];

  return {
    version: 1,
    seededAt: new Date().toISOString(),
    customers,
    projects,
    documents,
    appointments,
    productPasses,
    renderings,
    messages,
    feedback: [],
    planningRequests: [],
  };
}
