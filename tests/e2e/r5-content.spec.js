// R5-content: Projekte-Vorlage (noindex, empty state, DE only) and the
// InlineVideo demo (poster, captions, preload=none, no autoplay, keyboard).
//   npx playwright test tests/e2e/r5-content.spec.js --project=desktop
// Nothing external loads: the demo clip is served by the app itself.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function axe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.length}`);
}

// Runde 3 P5 (gesamtwerk P2, recht P2): bewusst geändert – kein öffentlicher
// Leerzustand mehr. Solange kein Projekt freigegeben ist: 307 auf /de/arbeitsweise.
// Runde 4 P5 (seo P2-6): bewusst 308 statt 307 (permanentRedirect).
test("/de/projekte: 308 to /de/arbeitsweise while no project is released", async ({ request }) => {
  const res = await request.get("/de/projekte", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(new URL(res.headers().location, "http://x").pathname).toBe("/de/arbeitsweise");
});

// E.21 (P6 Runde 2, src/lib/seo/deOnlyRedirects.cjs): EN/FR/IT addresses of the
// German-only /projekte tree now 308 to /de/…; unknown slugs stay 404.
test("other locales redirect to /de or 404, unknown slugs are 404", async ({ request }) => {
  for (const path of ["/en/projekte", "/fr/projekte", "/it/projekte", "/en/projekte/vorlage"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect([404, 308], path).toContain(res.status());
    if (res.status() === 308) expect(res.headers().location, path).toMatch(/\/de\/projekte/);
  }
  expect((await request.get("/de/projekte/gibt-es-nicht")).status()).toBe(404);
});

test("projects are not in sitemap or llms.txt", async ({ request }) => {
  for (const path of ["/sitemap-static.xml", "/llms.txt"]) {
    const res = await request.get(path);
    if (res.status() !== 200) continue;
    expect(await res.text(), path).not.toContain("/projekte");
  }
});

test("/de/projekte/vorlage: InlineVideo demo is accessible and never autoplays", async ({ page }) => {
  const media = [];
  page.on("request", (r) => /demo\.(mp4|webm)/.test(r.url()) && media.push(r.url()));
  await page.emulateMedia({ reducedMotion: "reduce" });
  const res = await page.goto("/de/projekte/vorlage");
  expect(res.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  const video = page.locator("video#projekt-vorlage-video");
  await expect(video).toHaveAttribute("preload", "none");
  await expect(video).toHaveAttribute("poster", /demo-poster\.svg$/);
  await expect(video).toHaveAttribute("controls", "");
  await expect(video).not.toHaveAttribute("autoplay", /.*/);
  await expect(video).toHaveAccessibleName("Testclip der Video-Vorlage");
  await expect(video.locator("track")).toHaveAttribute("kind", "captions");
  // MP4 (H.264) first: WebKit/older iOS pick it, WebM-only blocked "load" in WebKit.
  const types = await video.locator("source").evaluateAll((els) => els.map((e) => e.getAttribute("type")));
  expect(types).toEqual(["video/mp4", "video/webm"]);
  expect(await video.evaluate((v) => v.paused)).toBe(true);
  expect(media, "no video bytes before play").toEqual([]);

  // Keyboard: the native player is reachable with Tab.
  await video.focus();
  expect(await video.evaluate((v) => document.activeElement === v)).toBe(true);

  expect(await axe(page)).toEqual([]);
});

test("demo clips support byte ranges (Safari)", async ({ request }) => {
  for (const [file, type] of [["demo.mp4", "video/mp4"], ["demo.webm", "video/webm"]]) {
    const res = await request.get(`/de/projekte/vorlage/${file}`, { headers: { Range: "bytes=0-99" } });
    expect(res.status(), file).toBe(206);
    expect(res.headers()["content-type"], file).toBe(type);
    expect(res.headers()["content-range"], file).toMatch(/^bytes 0-99\/\d+$/);
    expect((await res.body()).length, file).toBe(100);
  }
  expect((await request.get("/en/projekte/vorlage/demo.mp4")).status()).toBe(404);
  const vtt = await request.get("/de/projekte/vorlage/demo.de.vtt");
  expect(await vtt.text()).toMatch(/^WEBVTT/);
});
