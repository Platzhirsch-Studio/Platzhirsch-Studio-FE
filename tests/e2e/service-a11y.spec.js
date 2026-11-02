// tests/e2e/service-a11y.spec.js – Services 3/4/10/12 auf dem Handy (QA Technik P2-6).
// Der Dateiname endet auf a11y.spec.js, damit die Projekte iphone und pixel
// (MOBILE_SPECS in playwright.config.js) ihn ausführen – ohne die gemeinsame
// Konfiguration zu ändern. Geprüft: axe WCAG 2.2 AA, kein Querscroll und die
// Abläufe Anmelden/Anfragen (Feldprüfung, nichts abgeschickt), Wunschliste
// reservieren und freiwilliger Beitrag (nur lokaler Dev-Speicher .data/,
// nie Backoffice), Tagebuch-Zugriffsschutz. Immer PW_WORKERS=1.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, measureOverflow } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function axeClean(page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

test.describe("Services mobil", () => {
  for (const path of ["/de/outdoor-winterservice", "/en/outdoor-winterservice", "/de/pflege-service"]) {
    test(`${path}: axe, kein Querscroll`, async ({ page }) => {
      await page.goto(path);
      await dismissCookieBanner(page);
      const o = await measureOverflow(page);
      expect(o.sw, o.wide.join("; ")).toBeLessThanOrEqual(o.vw);
      await axeClean(page);
    });
  }

  test("Winterlager: Anmeldung prüft Felder, Fokus aufs erste Feld, nichts gesendet", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/outdoor-winterservice#anmeldung");
    await dismissCookieBanner(page);
    const form = page.getByTestId("wl-form");
    await form.getByRole("button", { name: "Anmeldung senden" }).click();
    await expect(form.locator("#wl-variant")).toBeFocused(); // erstes Pflichtfeld: Variante
    await expect(form.locator("#wl-email")).toHaveAttribute("aria-invalid", "true");
    expect(blocked).toEqual([]);
  });

  test("Pflege: Anfrage prüft Felder, nichts gesendet", async ({ page }) => {
    const blocked = await blockFormSends(page);
    await page.goto("/de/pflege-service#anfrage");
    await dismissCookieBanner(page);
    const form = page.getByTestId("pflege-form");
    await form.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(form.locator("#pflege-vorname")).toHaveAttribute("aria-invalid", "true");
    expect(blocked).toEqual([]);
  });

  test("Wunschliste: Reservieren mit Hinweis, Beitrag ohne Pflicht-Einwilligung (nur Feldprüfung)", async ({ page, request }) => {
    const res = await request.post("/api/wunschliste", {
      data: { locale: "de", occasion: "einzug", title: "Mobil-Test", understood: true, items: [{ id: "m-1", name: "Arco", category: "Flos" }] },
    });
    expect(res.status()).toBe(201);
    const { shareUrl, adminToken } = await res.json();
    await page.goto(new URL(shareUrl).pathname);
    await dismissCookieBanner(page);
    await page.getByRole("button", { name: "Arco reservieren" }).click();
    await expect(page.getByText("keine Reservierung bei Platzhirsch")).toBeVisible();
    await expect(page.getByRole("link", { name: "Datenschutzerklärung" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Abbrechen" }).click().catch(() => {});
    let sent = false;
    page.on("request", (r) => {
      if (r.url().includes("/beitrag")) sent = true;
    });
    await page.getByRole("textbox", { name: "Ihr Name", exact: true }).fill("A");
    await page.getByRole("button", { name: "Beitrag anfragen" }).click();
    await expect(page.getByRole("textbox", { name: "Ihr Name", exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("checkbox", { name: /freiwillig/ })).not.toHaveAttribute("aria-invalid", "true");
    expect(sent).toBe(false);
    await expect(page.getByRole("link", { name: "Liste melden" })).toHaveAttribute("href", /^mailto:/);
    const o = await measureOverflow(page);
    expect(o.sw, o.wide.join("; ")).toBeLessThanOrEqual(o.vw);
    await axeClean(page);
    await request.post("/api/wunschliste/verwalten", { data: { token: adminToken, action: "delete" } });
  });

  test("Tagebuch: ohne Anmeldung kein Zugriff", async ({ request }) => {
    const res = await request.get("/de/portal/projekte/PRJ-2026-014/tagebuch", { maxRedirects: 0 });
    expect([302, 303, 307, 404]).toContain(res.status());
    const up = await request.post("/api/portal/tagebuch/PRJ-2026-014/foto", { multipart: { phase: "nachher" } });
    expect([401, 403]).toContain(up.status());
  });
});
