import "server-only";

// Demo content of the planning area, ONLY used with PORTAL_ADAPTER=mock.
// It complements the core demo data (mockSeed.js, owned by the portal core)
// without touching it: one extra variant for the kitchen, two planning
// variants for the living room, and a short team thread per project.
// No real people, no prices, no product promises – placeholders only.

const TEAM = "Ihr Platzhirsch-Beratungsteam";

function at(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour - 1, minute, 0, 0);
  return d.toISOString();
}

/** Extra demo renderings per project (same shape as adapter Rendering). */
export function demoRenderings(projectId) {
  if (projectId === "PRJ-2026-021") {
    return [
      {
        id: "REN-021-3",
        projectId,
        title: "Küche – Planung V3, Insel mit Sitzplatz",
        version: 3,
        createdAt: at(-1, 16, 20),
        image: null,
        description: "Wie gewünscht: Insel verlängert, Sitzplatz für drei an der Stirnseite.",
        aiGenerated: false,
        demo: true,
      },
    ];
  }
  if (projectId === "PRJ-2026-014") {
    return [
      {
        id: "REN-014-1",
        projectId,
        title: "Wohnzimmer – Planung V1",
        version: 1,
        createdAt: at(-48),
        image: null,
        description: "Sitzlandschaft hell, Teppich in Naturton.",
        aiGenerated: false,
        demo: true,
      },
      {
        id: "REN-014-2",
        projectId,
        title: "Wohnzimmer – Planung V2",
        version: 2,
        createdAt: at(-40),
        image: null,
        description: "Bezug in Salbei, Leuchte über dem Lesesessel.",
        aiGenerated: false,
        demo: true,
      },
    ];
  }
  return [];
}

/** Demo thread entries (customerId is filled in by the store). */
export function demoThread(projectId, customerName) {
  if (projectId === "PRJ-2026-021") {
    return [
      {
        id: "PF-DEMO-021-1",
        kind: "annotation",
        from: "kunde",
        author: customerName,
        renderingId: "REN-021-1",
        point: { x: 22, y: 38 },
        body: "Hier wäre mir mehr Stauraum wichtig – eventuell ein Hochschrank?",
        createdAt: at(-15, 19, 30),
      },
      {
        id: "PF-DEMO-021-2",
        kind: "kommentar",
        from: "studio",
        author: TEAM,
        renderingId: "REN-021-1",
        parentId: "PF-DEMO-021-1",
        body: "Gute Idee. In Planung V2 haben wir links einen Hochschrank mit Vorratsauszügen eingeplant.",
        createdAt: at(-14, 9, 15),
      },
      {
        id: "PF-DEMO-021-3",
        kind: "kommentar",
        from: "studio",
        author: TEAM,
        renderingId: "REN-021-2",
        body: "Das Stimmungsbild zu V2 zeigt die Materialwirkung. Es ist KI-gestützt erstellt und nicht maßstäblich – die verbindlichen Maße stehen im Plan.",
        createdAt: at(-2, 11, 0),
      },
      {
        id: "PF-DEMO-021-4",
        kind: "kommentar",
        from: "studio",
        author: TEAM,
        renderingId: "REN-021-3",
        body: "Variante C mit Sitzplatz an der Stirnseite, wie besprochen. Setzen Sie gerne direkt Punkte ins Bild, wenn Ihnen etwas auffällt.",
        createdAt: at(-1, 16, 25),
      },
    ];
  }
  if (projectId === "PRJ-2026-014") {
    return [
      {
        id: "PF-DEMO-014-1",
        kind: "freigabe",
        from: "kunde",
        author: customerName,
        renderingId: "REN-014-2",
        body: "Genau so. Bitte das Angebot dazu.",
        createdAt: at(-37, 20, 10),
      },
      {
        id: "PF-DEMO-014-2",
        kind: "kommentar",
        from: "studio",
        author: TEAM,
        renderingId: "REN-014-2",
        parentId: "PF-DEMO-014-1",
        body: "Vielen Dank für die Freigabe. Das Angebot finden Sie unter Dokumente.",
        createdAt: at(-35, 9, 5),
      },
    ];
  }
  return [];
}
