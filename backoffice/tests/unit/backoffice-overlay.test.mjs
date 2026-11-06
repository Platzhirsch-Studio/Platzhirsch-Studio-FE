// Unit-Tests der Overlay-Logik (Team P0-4, G-06 · G-07 · G-08).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  platziere,
  platziereAmPunkt,
  naechsterIndex,
  naechsterZoom,
  begrenzeVerschiebung,
  zieheEntscheidung,
  gummiband,
  tooltipVerzoegerung,
  panelUrl,
  panelAusSuche,
  tippSuche,
  medienArt,
  darfHerunterladen,
  breiteFuer,
  istSchmal,
  zerlegePlatzierung,
} from "../../src/components/Backoffice/Overlay/logik.js";

const VP = { w: 1440, h: 900 };

test("platziere: unten-start mit 8 px Abstand", () => {
  const l = platziere({ anker: { x: 100, y: 100, w: 120, h: 40 }, panel: { w: 240, h: 200 }, viewport: VP });
  assert.equal(l.x, 100);
  assert.equal(l.y, 148);
  assert.equal(l.seite, "unten");
  assert.equal(l.ursprung, "left top");
});

test("platziere: kippt nach oben, wenn unten kein Platz", () => {
  const l = platziere({ anker: { x: 100, y: 800, w: 120, h: 40 }, panel: { w: 240, h: 300 }, viewport: VP });
  assert.equal(l.seite, "oben");
  assert.equal(l.y, 800 - 8 - 300);
  assert.equal(l.ursprung, "left bottom");
});

test("platziere: ende-Ausrichtung und Rand rechts", () => {
  const l = platziere({ anker: { x: 1380, y: 20, w: 44, h: 44 }, panel: { w: 280, h: 100 }, viewport: VP, platzierung: "unten-ende" });
  assert.equal(l.x, 1380 + 44 - 280);
  const r = platziere({ anker: { x: 1400, y: 20, w: 30, h: 30 }, panel: { w: 280, h: 100 }, viewport: VP });
  assert.equal(r.x, 1440 - 8 - 280, "in den Sichtbereich geschoben");
});

test("platziere: seitlich und mittig", () => {
  const l = platziere({ anker: { x: 16, y: 400, w: 48, h: 48 }, panel: { w: 120, h: 32 }, viewport: VP, platzierung: "rechts-mitte" });
  assert.equal(l.seite, "rechts");
  assert.equal(l.x, 72);
  assert.equal(l.y, 408);
  assert.deepEqual(zerlegePlatzierung("quatsch"), { seite: "unten", ausrichtung: "start" });
});

test("platziereAmPunkt: kippt an rechter und unterer Kante", () => {
  assert.deepEqual(platziereAmPunkt({ punkt: { x: 200, y: 200 }, panel: { w: 240, h: 200 }, viewport: VP }), { x: 200, y: 200, ursprung: "left top" });
  const k = platziereAmPunkt({ punkt: { x: 1400, y: 850 }, panel: { w: 240, h: 200 }, viewport: VP });
  assert.equal(k.x, 1160);
  assert.equal(k.y, 650);
  assert.equal(k.ursprung, "right bottom");
});

test("naechsterIndex: Grenzen, Umbruch, gesperrte Einträge, Anfang/Ende", () => {
  assert.equal(naechsterIndex(0, 5, 1), 1);
  assert.equal(naechsterIndex(4, 5, 1), 4);
  assert.equal(naechsterIndex(4, 5, 1, { umbruch: true }), 0);
  assert.equal(naechsterIndex(0, 5, -1, { umbruch: true }), 4);
  assert.equal(naechsterIndex(-1, 5, 1), 0);
  assert.equal(naechsterIndex(0, 5, 1, { gesperrt: (i) => i === 1 }), 2);
  assert.equal(naechsterIndex(3, 5, "anfang", { gesperrt: (i) => i === 0 }), 1);
  assert.equal(naechsterIndex(0, 5, "ende"), 4);
  assert.equal(naechsterIndex(0, 0, 1), -1);
});

test("Zoom 1×/2× und begrenzte Verschiebung", () => {
  assert.equal(naechsterZoom(1, "+"), 2);
  assert.equal(naechsterZoom(2, "-"), 1);
  assert.equal(naechsterZoom(1, "wechsel"), 2);
  assert.deepEqual(begrenzeVerschiebung({ dx: 999, dy: -999, zoom: 2, breite: 800, hoehe: 600 }), { dx: 400, dy: -300 });
  assert.deepEqual(begrenzeVerschiebung({ dx: 50, dy: 50, zoom: 1, breite: 800, hoehe: 600 }), { dx: 0, dy: 0 });
});

test("Sheet ziehen: Schwelle 30 % bzw. Wurf", () => {
  assert.equal(zieheEntscheidung({ dy: 200, vy: 0, hoehe: 600 }), "schliessen");
  assert.equal(zieheEntscheidung({ dy: 100, vy: 0.1, hoehe: 600 }), "zurueck");
  assert.equal(zieheEntscheidung({ dy: 40, vy: 0.9, hoehe: 600 }), "schliessen");
  assert.equal(zieheEntscheidung({ dy: 10, vy: 2, hoehe: 600 }), "zurueck");
  assert.equal(zieheEntscheidung({ dy: 100, vy: 0, hoehe: 200 }), "schliessen", "mind. 96 px");
  assert.equal(gummiband(50), 50);
  assert.ok(gummiband(-100) > -100 && gummiband(-100) < 0);
});

test("Tooltip: 400 ms, in der Gruppe sofort", () => {
  assert.equal(tooltipVerzoegerung(null, 1000), 400);
  assert.equal(tooltipVerzoegerung(900, 1000), 0);
  assert.equal(tooltipVerzoegerung(500, 1000), 400);
});

test("panelUrl setzt und entfernt ?panel=, andere Parameter bleiben", () => {
  assert.equal(panelUrl("http://h/crm/anfragen?status=Neu#x", "vorschau"), "/crm/anfragen?status=Neu&panel=vorschau#x");
  assert.equal(panelUrl("/crm/anfragen?panel=vorschau&status=Neu", null), "/crm/anfragen?status=Neu");
  assert.equal(panelUrl("/crm", "Böse Werte!"), "/crm", "ungültige Namen werden nicht gesetzt");
  assert.equal(panelAusSuche("?panel=notiz"), "notiz");
  assert.equal(panelAusSuche("?panel=%3Cx%3E"), null);
});

test("tippSuche: ab der aktuellen Stelle, Umbruch, gesperrt übersprungen", () => {
  const t = ["Bearbeiten", "Duplizieren", "Drucken", "Stornieren"];
  assert.equal(tippSuche(t, 0, "d"), 1);
  assert.equal(tippSuche(t, 1, "d"), 2);
  assert.equal(tippSuche(t, 2, "d"), 1);
  assert.equal(tippSuche(t, 0, "dr"), 2);
  assert.equal(tippSuche(t, 0, "d", (i) => i === 1), 2);
  assert.equal(tippSuche(t, 0, "x"), -1);
});

test("Lightbox: Medienart und Download nur mit Recht und Freigabe", () => {
  assert.equal(medienArt({ src: "/a/b.PDF?x=1" }), "pdf");
  assert.equal(medienArt({ src: "/a/b.jpg" }), "bild");
  assert.equal(medienArt({ src: "blob:x", typ: "pdf" }), "pdf");
  assert.equal(darfHerunterladen({ src: "/a.jpg" }, false), false);
  assert.equal(darfHerunterladen({ src: "/a.jpg" }, true), true);
  assert.equal(darfHerunterladen({ src: "/a.jpg", freigabe: { download: false } }, true), false);
  assert.equal(darfHerunterladen({ src: "/a.jpg", download: false }, true), false);
});

test("Größen: Dialog 400/560/800, Sheet 400/480/640, schmal < 640", () => {
  assert.deepEqual(["sm", "md", "lg"].map((g) => breiteFuer(g, "dialog")), [400, 560, 800]);
  assert.deepEqual(["sm", "md", "lg"].map((g) => breiteFuer(g, "sheet")), [400, 480, 640]);
  assert.equal(breiteFuer("xl"), 560);
  assert.equal(istSchmal(639), true);
  assert.equal(istSchmal(640), false);
});

test("Overlay-Dateien: keine Hex-Farben, keine Versalien, Material mit Unschärfe", () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../src/components/Backoffice/Overlay");
  for (const d of ["Popover.js", "Tooltip.js", "Dialog.js", "Sheet.js", "Lightbox.js", "hilfen.js", "texte.js", "../Bestaetigen.js"]) {
    const t = readFileSync(path.join(dir, d), "utf8");
    assert.doesNotMatch(t, /#[0-9a-fA-F]{3,8}\b/, `${d}: Hex-Farbe`);
    assert.doesNotMatch(t, /\buppercase\b/, `${d}: Versalien`);
  }
  const css = readFileSync(path.join(dir, "overlay.css"), "utf8");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "overlay.css: Hex-Farbe");
  assert.match(css, /\.bo-ov-material \{[^}]*backdrop-filter: blur\(40px\) saturate\(180%\)/);
  assert.match(css, /\.bo-ov-griff::before \{[^}]*width: 40px;[^}]*height: 5px;/);
  assert.match(css, /\.bo-ov-tip\[popover\] \{[^}]*max-width: 240px/);
});
