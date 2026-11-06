// Kontrast-/A11y-Prüfung Entwurf „Lounge“: node src/components/Entwurf/Lounge/axe.mjs
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const B = "http://localhost:3100/entwurf/lounge";
const U = ["", "/anfragen", "/kundenakte", "/kassa", "/packtisch", "/kundendisplay?zustand=einkauf"];
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme, reducedMotion: "reduce" });
  for (const u of U) {
    const p = await ctx.newPage();
    await p.goto(B + u, { waitUntil: "networkidle" });
    await p.waitForTimeout(400);
    const r = await new AxeBuilder({ page: p }).include(".lg").withTags(["wcag2a", "wcag2aa"]).analyze();
    const v = r.violations.map((x) => `${x.id}(${x.nodes.length}): ${x.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    console.log(scheme, u || "/", v.length ? "\n  " + v.join("\n  ") : "ok");
    await p.close();
  }
  await ctx.close();
}
await browser.close();
