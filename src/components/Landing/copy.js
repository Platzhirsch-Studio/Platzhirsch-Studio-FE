// German copy of the landing building blocks added in Runde 2 (P3: USP,
// Objekt/Architekten, CTA context). Kept here – not in src/messages – until the
// "Recht & Texte" integration moves it into the `landing` namespace.
// Rules: Sie-Form, no superlatives, no invented projects or references, no
// prices ("auf Anfrage"), the seven step names exactly as on /arbeitsweise
// (src/lib/arbeitsweise/copy.js STEPS), "ein, zwei Tage" only as a condition.
// Pure module (no React), so node --test can import it.

// ux P1-5: nothing is booked, it is a request with a preferred date.
export const LOCAL_LANDING = {
  appointment: "Termin anfragen",
};

// Kern-USP as a short section on every landing/region page (Entscheidung Nr. 8,
// gesamtwerk P1-4, Durchdringungsplan §0 `ProcessStrip compact`).
export const PROCESS_NOTE = {
  eyebrow: "Unsere Arbeitsweise",
  heading: "Von Hand gezeichnet, dann in 3D geplant.",
  // Durchdringungsplan §0 `kurz`
  text: "Wir lernen Ihre Räume vor Ort kennen. Harald Menghin zeichnet Ihr Konzept von Hand und baut ein Modell. Danach planen wir in 3D, und Sie sehen Ihren Raum fotorealistisch, bevor etwas bestellt wird.",
  // Durchdringungsplan §0 `vorOrt`
  vorOrt: "Wenn Ihr Projekt es braucht, bleiben wir auch ein, zwei Tage vor Ort.",
  stepsLabel: "Die sieben Schritte",
  link: { href: "/arbeitsweise", label: "Unsere Arbeitsweise: von der Handzeichnung zum Rendering" },
};

// "Für Architektinnen & Planer" (ux P1-3) – interior design and St. Gallen.
// Only what the site already offers: planning data via the product pages
// ("Planungsdaten anfragen"), samples and materials in the showroom, the studio
// phone. No CAD/BIM promise, no trade conditions, no references.
export const PLANER = {
  id: "planer",
  eyebrow: "Für Architektinnen & Planer",
  heading: "Wir planen gern mit Ihnen zusammen.",
  text: "Sie planen ein Haus, eine Wohnung oder ein Objekt für Ihre Bauherrschaft? Wir ergänzen Ihre Planung um Möbel, Systeme und Licht und stimmen uns mit Ihnen ab, nicht an Ihnen vorbei.",
  points: [
    {
      title: "Zeichnung und Modell zur Abstimmung",
      text: "Harald Menghin zeichnet das Einrichtungskonzept von Hand und baut bei Bedarf ein Raummodell. Am Modell lassen sich Proportionen und Wege mit der Bauherrschaft schnell klären, danach folgt die 3D-Planung.",
    },
    {
      title: "Planungsdaten über die Produktseiten",
      text: "Auf den Produktseiten fragen Sie Maße, Datenblätter und Planungsdaten direkt beim jeweiligen Stück an.",
      link: { href: "/produkte", label: "Zu den Produkten" },
    },
    {
      title: "Muster und Material im Showroom",
      text: "Stoffe, Hölzer, Oberflächen und Leuchten sehen Sie im Original in Lochau, gern gemeinsam mit Ihrer Bauherrschaft.",
    },
  ],
  contactLabel: "Direkt ins Studio",
  contactNote: "Konditionen für Objekte und Planer auf Anfrage.",
  // Runde 5 (ux P1-3): only ?rolle=architekt (+ ort) – step 1 "Projekt meines
  // Architektur- oder Planungsbüros", step 2 open; no ?thema=objekt any more.
  cta: { rolle: "architekt", label: "Zusammenarbeit anfragen" },
};

// Durchdringungsplan §0: the seven step names (same order as /arbeitsweise).
export const PROCESS_STEPS = ["Kennenlernen", "Vor Ort", "Handzeichnung", "Modell", "3D-Planung", "Rendering", "Umsetzung"];

/**
 * /beratung link with context (ux P1-1). `thema` is read by
 * src/lib/forms/beratungContext.js (kueche, outdoor, neubau, objekt, …);
 * `rolle` and `ort` travel along for the message line once that schema reads
 * them. Unknown parameters are ignored there, so the link never breaks.
 * @param {{thema?: string, rolle?: string, ort?: string}} [ctx]
 * @param {string} [base="/beratung"] German consultation route
 */
export function beratungHref(ctx = {}, base = "/beratung") {
  const q = new URLSearchParams();
  for (const key of ["thema", "rolle", "ort"]) if (ctx[key]) q.set(key, ctx[key]);
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}
