// R3-shell: opening hours from ONE source (src/lib/site.js) and the shell
// contracts that other code relies on. Run: node --test tests/unit/r3-shell.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPENING_HOURS,
  openingDays,
  openingDaysLabel,
  openingHoursLine,
  openingHoursSpecification,
  weekdayName,
} from "../../src/lib/site.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Öffnungszeiten: Werte unverändert (Di–Fr 10–18, Sa 10–14, So/Mo zu)", () => {
  assert.deepEqual(OPENING_HOURS, [
    { days: [2, 5], from: "10:00", to: "18:00" },
    { days: [6], from: "10:00", to: "14:00" },
    { days: [0, 1], closed: true },
  ]);
  assert.deepEqual(openingDays(OPENING_HOURS[0]), [2, 3, 4, 5]);
  assert.deepEqual(openingDays(OPENING_HOURS[2]), [0, 1]);
});

test("JSON-LD openingHoursSpecification = bisheriger Wert aus layout.js", () => {
  assert.deepEqual(openingHoursSpecification(), [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "18:00",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "14:00" },
  ]);
});

test("Wochentage und Zeile in 4 Sprachen", () => {
  assert.equal(weekdayName("de", 2), "Dienstag");
  assert.equal(weekdayName("it", 6), "sabato");
  assert.equal(openingDaysLabel("de", OPENING_HOURS[0]), "Dienstag – Freitag");
  assert.equal(openingDaysLabel("de", OPENING_HOURS[2]), "Sonntag, Montag");
  for (const locale of ["de", "en", "fr", "it"]) {
    const line = openingHoursLine(locale);
    assert.match(line, /10:00–18:00 · .+ 10:00–14:00$/, locale);
  }
});

test("Footer, Kontakt, Mobilmenü und JSON-LD lesen die Zeiten aus lib/site.js", () => {
  const times = /"1[048]:00"/;
  const footer = read("src/components/Reusable/Footer.js");
  assert.match(footer, /OPENING_HOURS[\s\S]*from "@\/lib\/site"/);
  assert.doesNotMatch(footer, times);
  const kontakt = read("src/components/Kontakt/copy.js");
  assert.match(kontakt, /export \{ OPENING_HOURS \} from "@\/lib\/site"/);
  assert.doesNotMatch(kontakt, times);
  const layout = read("src/app/[locale]/layout.js");
  assert.match(layout, /"openingHoursSpecification": openingHoursSpecification\(\)/);
  assert.doesNotMatch(layout, times);
  // QM shell-home r5: the menu line in the house format, still from OPENING_HOURS.
  assert.match(read("src/components/Navbar/MobileMenu.js"), /menuHoursLine\(locale\)/);
  assert.match(read("src/components/Navbar/menuHours.js"), /OPENING_HOURS/);
});

test("Adresse bleibt Landstraße 11", () => {
  assert.match(read("src/lib/site.js"), /street: "Landstraße 11"/);
});

test("Consent: Cookie-Name, Ereignis und Knopf-Texte bleiben (Tests und ConsentEmbed hängen daran)", () => {
  const banner = read("src/components/Cookies/cookiecomponent.js");
  const embed = read("src/components/Cookies/ConsentEmbed.js");
  assert.match(banner, /const CONSENT_COOKIE = "cookieConsent"/);
  assert.match(banner, /const CONSENT_EVENT = "ph-consent-change"/);
  assert.match(embed, /const CONSENT_EVENT = "ph-consent-change"/);
  assert.match(embed, /getCookie\("cookieConsent"\)/);
  for (const key of ["acceptAll", "rejectAll", "customize", "bannerTitle", "savePreferences"]) {
    assert.match(banner, new RegExp(`t\\("${key}"\\)`), key);
  }
  assert.match(banner, /role="region"/);
  // Design-Bibel: no radius, no shadow, no gold on the banner and the embed.
  const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const src of [banner, embed, read("src/components/Cookies/cookieItem.js")]) {
    assert.doesNotMatch(code(src), /rounded|shadow-|#d1b250|gold|blue-|gray-|#30373e/);
  }
  const de = JSON.parse(read("src/messages/de.json")).Cookies;
  assert.equal(de.rejectAll, "Weiter ohne Einwilligung");
  assert.equal(de.bannerTitle, "Cookie-Einstellungen");
});

test("Keine setState-in-effect-Muster mehr in Consent und Merkliste", () => {
  for (const file of ["src/components/Cookies/cookiecomponent.js", "src/components/Cookies/ConsentEmbed.js", "src/context/CartContext.js"]) {
    const src = read(file);
    assert.match(src, /useSyncExternalStore/, file);
    assert.doesNotMatch(src, /set-state-in-effect -- |eslint-disable.*set-state-in-effect/, file);
  }
  const cart = read("src/context/CartContext.js");
  assert.match(cart, /localStorage\.getItem\("cart"\)/);
  assert.match(cart, /localStorage\.setItem\("cart"/);
});

test("/upload bekommt die schlanke Hülle", () => {
  const layout = read("src/app/[locale]/client-layout.js");
  assert.match(layout, /const BARE_ROUTES = \['upload'\]/);
  assert.match(layout, /<BareShell>/);
  const bare = read("src/components/Reusable/BareShell.js");
  assert.doesNotMatch(bare, /from "[^"]*(Navbar\/navbar|\/Footer|MobileCtaBar|cookiecomponent)"/);
});

test("messages-r3-shell.json: gleiche Schlüssel in allen 4 Sprachen", () => {
  const msgs = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r3-shell.json"));
  const keys = (o, p = "") =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const de = keys(msgs.de);
  assert.ok(de.length > 0);
  for (const locale of ["en", "fr", "it"]) assert.deepEqual(keys(msgs[locale]), de, locale);
});
