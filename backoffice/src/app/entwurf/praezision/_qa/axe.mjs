// Barrierefreiheits-Prüfung (axe) der vier Entwurfs-Screens, hell + dunkel.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const B = "http://localhost:3100/entwurf/praezision";
const browser = await chromium.launch();
for (const cs of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: cs, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const u of ["/", "/anfragen", "/kunde", "/kassa"]) {
    await page.setViewportSize(u === "/kassa" ? { width: 1180, height: 820 } : { width: 1440, height: 900 });
    await page.goto(B + u, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).exclude("nextjs-portal").analyze();
    for (const v of r.violations) {
      console.log(cs, u, v.id, v.impact, v.nodes.length, v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " :: " + (n.any[0]?.message || "")).join(" | "));
    }
  }
  await ctx.close();
}
await browser.close();
