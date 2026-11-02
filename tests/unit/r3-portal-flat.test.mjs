// tests/unit/r3-portal-flat.test.mjs — Design-Bibel §6 (Radien überall 0, Pille nur
// für Zähler und Avatare; Schatten nur auf schwebenden Ebenen) für Portal und Upload.
// Quelltext-Prüfung, damit neue Radien in Portal/Upload/UploadClient sofort auffallen.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Integration 28.10.2026: /labs/upload-demo ist jetzt /upload/page.js (im Ordner src/app/[locale]/upload).
const DIRS = ["src/app/[locale]/portal", "src/components/Portal", "src/components/Upload", "src/app/[locale]/upload"];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
const files = DIRS.flatMap(walk);

// file → allowed rounded-full count (avatars, counter badge, unread/live dots, plan pins)
const PILL_OK = {
  "anfragen/page.js": 1, "nachrichten/page.js": 1, "Dashboard.js": 1, "PortalNav.js": 1,
  "StatusTimeline.js": 1, "AnnotatableImage.js": 3, "PlanungWorkspace.js": 1,
  // N2 Raumzwilling: nummerierte Kommentar-Pins (wie die Plan-Pins), Liste und Raumpunkt.
  "Kommentare.js": 1, "RaumViewer.js": 1, "SprachAufnahme.js": 1, // Aufnahme-Punkt (live dot)
};
// floating layers (dialogs, controls over images/3D)
// N2: RaumViewer.js trägt Pins über der 3D-Ansicht (schwebende Ebene).
const SHADOW_OK = new Set(["PortalNav.js", "PdfPreview.js", "AnnotatableImage.js", "BeforeAfter.js", "PlanungWorkspace.js", "Viewer3D.js", "Scene3D.js", "UploadHandoff.js", "RaumViewer.js"]);
const key = (f) => { const p = f.split(path.sep); return p.at(-1) === "page.js" ? `${p.at(-2)}/page.js` : p.at(-1); };

test("Portal/Upload: keine Radien außer Pille für Zähler, Avatare, Punkte und Pins", () => {
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const other = src.match(/(?<![\w-])(?:[a-z0-9-]+:)*rounded(?!-full\b)(?:-[\w.[\]]+)*/g) || [];
    // Handy-Rahmen der Service-Seite /upload (früher /labs/upload-demo).
    const allowedOther = /upload[\\/]page\.js$/.test(f) ? other.filter((t) => t.startsWith("sm:rounded-[")) : [];
    assert.deepEqual(other.filter((t) => !allowedOther.includes(t)), [], f);
    const pills = (src.match(/\brounded-full\b/g) || []).length;
    assert.ok(pills <= (PILL_OK[key(f)] || 0), `${f}: ${pills} × rounded-full`);
  }
});

test("Portal/Upload: Schatten nur auf schwebenden Ebenen", () => {
  for (const f of files) {
    if (SHADOW_OK.has(path.basename(f))) continue;
    assert.equal(/(?<![\w-])(?:[a-z0-9-]+:)*shadow(?:-[\w[\](),.#/]+)?(?=[\s"'`}])/.test(fs.readFileSync(f, "utf8")), false, f);
  }
});
