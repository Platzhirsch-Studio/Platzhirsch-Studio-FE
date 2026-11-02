// R5-Fix P1 (ux P2): "Beratung & Termin" in the menu keeps the context of the
// page it is opened on (same helper as the header "Termin" button), and the
// brand pages link the appointment with the brand (?produkt=…). No form is sent.
import { test, expect } from "@playwright/test";

test("Desktop-Menü: Beratung & Termin mit Seitenkontext", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "Desktop-Megamenü");
  for (const [path, query] of [
    ["/de/yacht-interior", "thema=yacht"],
    ["/de/designermoebel-st-gallen", "ort=st-gallen"],
  ]) {
    await page.goto(path, { waitUntil: "load" });
    await page.locator("#ph-nav-trigger-services").click();
    const link = page.locator("a[data-termin-link]").first();
    await expect(link).toHaveAttribute("href", new RegExp(`/de/beratung\\?${query}$`));
  }
  // Without page context the link stays plain.
  await page.goto("/de/kontakt", { waitUntil: "load" });
  await page.locator("#ph-nav-trigger-services").click();
  await expect(page.locator("a[data-termin-link]").first()).toHaveAttribute("href", /\/de\/beratung$/);
});

test("Markenseite: H1 mit Kategorien, Termin mit Markenkontext", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop", "Serverantwort, einmal");
  const html = await (await request.get("/de/ueber-uns/marken/minotti", { timeout: 240_000 })).text();
  const h1 = html.match(/<h1[^>]*id="brand-title"[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "";
  expect(h1).toMatch(/^Minotti/);
  expect(h1.replace(/<[^>]+>/g, "")).toMatch(/^Minotti \S/);
  expect(html).toContain('href="/de/beratung?produkt=Minotti"');
});
