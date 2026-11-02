// tests/e2e/f5-preview-prod.spec.js — F5-shell-technik-release, Runde 1, P0 Preview.
// Die Design-Prototypen /<locale>/preview/{buehne,galerie,dreilaendereck} und
// die Projekt-Vorlage /de/projekte/vorlage (samt Demo-Dateien) sind in
// Produktion 404, solange der Server nicht mit DESIGN_PREVIEW=1 läuft
// (src/components/Preview/gate.js, gleiche Regel wie /de/preview/freigaben).
// Prod-Lauf: prod-check setzt DESIGN_PREVIEW_EXPECT=off.
// Dev-Server (ohne Variable): die Seiten antworten 200 und bleiben noindex.
//   BASE_URL=http://localhost:3100 DESIGN_PREVIEW_EXPECT=off PW_WORKERS=1 \
//     npx playwright test tests/e2e/f5-preview-prod.spec.js --project=desktop
import { test, expect } from "@playwright/test";

const REQ = { maxRedirects: 0, timeout: 90_000 };
// P6 Runde 2 (r2-technik P1-6): der Schalter wird selbst erkannt – ohne
// Zusatzvariable war der Lauf gegen den Prod-Build rot. Sonde: 404 auf
// /de/preview/buehne = Vorschau aus. DESIGN_PREVIEW_EXPECT=off|on erzwingt.
let previewProbe;
function previewOn(request) {
  const forced = process.env.DESIGN_PREVIEW_EXPECT;
  if (forced === "off") return Promise.resolve(false);
  if (forced === "on") return Promise.resolve(true);
  previewProbe ??= request.get("/de/preview/buehne", REQ).then((r) => r.status() !== 404);
  return previewProbe;
}
test.setTimeout(240_000);

const PAGES = [
  "/de/preview/buehne",
  "/de/preview/buehne/logo",
  "/de/preview/buehne/marken/minotti",
  "/de/preview/galerie",
  "/de/preview/galerie/marken/minotti",
  "/de/preview/dreilaendereck",
  "/de/preview/dreilaendereck/logo",
  "/de/preview/dreilaendereck/marken/minotti",
  "/de/projekte/vorlage",
];
const FILES = ["demo.mp4", "demo.webm", "demo.de.vtt", "demo-poster.svg"].map((f) => `/de/projekte/vorlage/${f}`);

test("andere Sprachen → 404 (immer)", async ({ request }) => {
  for (const l of ["en", "fr", "it"]) {
    for (const p of ["preview/buehne", "preview/galerie", "preview/dreilaendereck", "projekte/vorlage"]) {
      const res = await request.get(`/${l}/${p}`, REQ);
      expect(res.status(), `/${l}/${p}`).toBe(404);
    }
  }
});

test("Sitemap und llms.txt nennen die Vorschauen nicht", async ({ request }) => {
  for (const p of ["/sitemap.xml", "/sitemap-static.xml", "/llms.txt"]) {
    const res = await request.get(p, { timeout: 60_000 });
    if (!res.ok()) continue;
    const body = await res.text();
    for (const s of ["preview/buehne", "preview/galerie", "preview/dreilaendereck", "projekte/vorlage"]) {
      expect(body, `${p}: ${s}`).not.toContain(s);
    }
  }
});

test.describe("Schalter aus (Produktion)", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(await previewOn(request), "nur ohne DESIGN_PREVIEW (Produktion)");
  });

  test("Prototypen und Vorlage → 404, noindex", async ({ request }) => {
    for (const p of PAGES) {
      const res = await request.get(p, REQ);
      expect(res.status(), p).toBe(404);
      const html = await res.text();
      // Die 404 nennt keine Prototyp-Inhalte (Minotti-Bilder ohne Freigabe).
      expect(html, p).not.toMatch(/Prototyp|Projekt-Vorlage|Vorlage, nicht veröffentlicht/);
      expect(html, `${p} noindex`).toMatch(/<meta name="robots" content="[^"]*noindex/);
    }
  });

  test("Demo-Dateien der Vorlage → 404", async ({ request }) => {
    for (const p of FILES) {
      const res = await request.get(p, REQ);
      expect(res.status(), p).toBe(404);
    }
  });
});

test.describe("Schalter an (Entwicklung oder DESIGN_PREVIEW=1)", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await previewOn(request)), "nur mit Vorschau");
  });

  test("Prototypen und Vorlage → 200, noindex", async ({ request }) => {
    for (const p of ["/de/preview/buehne", "/de/preview/galerie", "/de/preview/dreilaendereck", "/de/projekte/vorlage"]) {
      const res = await request.get(p, REQ);
      expect(res.status(), p).toBe(200);
      expect(await res.text(), `${p} noindex`).toMatch(/<meta name="robots" content="[^"]*noindex/);
    }
  });
});
