// src/lib/stilfinder/document.js
// The Moodboard PDF as a @react-pdf/renderer document (A4 landscape, a
// presentation). Written with createElement (no JSX), so node --test can
// render it without a build step.
//
// Gestaltung nach Design-Bibel: Papierton #faf8f4 als Grund, Bodoni Moda nur
// für Titel, Instrument Sans für Text, Haarlinien statt Schatten, 0 Radien
// (Ausnahme: die Farbkreise des Moodboards), Messing nur als Linie/Overline auf
// dem EINEN dunklen Kapitel (Showroom & Café), auf Hell Akzenttext in
// brass-700. Viel Weißraum.
//
// Bildregeln (QA Runde 1, P1.5):
//   - fester Rahmen je Seite (Auswahl 4:5, oben bündig);
//   - Szenenbilder füllen den Rahmen (cover);
//   - Freisteller sitzen mit 12 % Luft auf dem Papierton (das Weiß ist in
//     build.js per Multiplikation auf den Papierton gebracht);
//   - Bilder geschützter Marken (PROTECTED_BRANDS, z. B. Minotti) werden NIE
//     beschnitten oder getönt: contain auf einer Tonfläche (Passepartout).
import { createElement as h } from "react";
import { Document, Font, Image, Link, Page, Path, Svg, Text, View } from "@react-pdf/renderer";
import path from "node:path";
import { FONT_DIR } from "./config.js";
import { KI_NOTE, KI_SHORT, ROOM_META, ROOM_ORDER, ROOM_TIPS, CARE, PLANNING, LIGHT_LAYERS, colorRoles, colorUseText, personalLine } from "./content.js";
import { codes, textOn } from "./palette.js";
import { lightFits } from "./rooms.js";
import { WORDMARK, TAGLINE } from "../../components/Brand/brandPaths.js";

// ---------- tokens (Design-Bibel §4.1) ----------
const C = {
  paper: "#faf8f4",
  bone: "#f7f5f1",
  plate: "#efebe4",
  stone: "#ece8e1",
  linen: "#e6e1d8",
  stoneDeep: "#d8d2c8",
  pebble: "#8a8174",
  inkSoft: "#5c636a",
  ink: "#30373e",
  inkDeep: "#1f252b",
  walnut: "#3f3129",
  brass400: "#d1b250",
  brass500: "#9a7a2a",
  brass700: "#7a5f17",
  white: "#ffffff",
  line: "#dfdedb", // Design-Bibel "line": ink 12 % on bone
};

const W = 841.89;
const H = 595.28;
const MX = 52; // side margin (grid)
const MT = 46;
const GAP_AFTER_TITLE = 18; // QA P2.2: 14–18 pt between Bodoni title and text

let fontsReady = false;
export function registerFonts() {
  if (fontsReady) return;
  const f = (n) => path.join(FONT_DIR, n);
  Font.register({
    family: "Bodoni",
    fonts: [
      { src: f("bodoni-moda-latin-400-normal.ttf"), fontWeight: 400 },
      { src: f("bodoni-moda-latin-500-normal.ttf"), fontWeight: 500 },
      { src: f("bodoni-moda-latin-400-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "Instrument",
    fonts: [
      { src: f("instrument-sans-latin-400-normal.ttf"), fontWeight: 400 },
      { src: f("instrument-sans-latin-500-normal.ttf"), fontWeight: 500 },
      { src: f("instrument-sans-latin-600-normal.ttf"), fontWeight: 600 },
    ],
  });
  // German compounds: no automatic (English) hyphenation.
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

// ---------- text primitives ----------
const T = {
  overline: { fontFamily: "Instrument", fontWeight: 500, fontSize: 7.5, letterSpacing: 1.3, textTransform: "uppercase", color: C.brass700 },
  display: { fontFamily: "Bodoni", fontWeight: 400, fontSize: 46, lineHeight: 1.12, color: C.ink },
  h2: { fontFamily: "Bodoni", fontWeight: 400, fontSize: 32, lineHeight: 1.14, color: C.ink },
  h3: { fontFamily: "Bodoni", fontWeight: 500, fontSize: 20, lineHeight: 1.2, color: C.ink },
  lead: { fontFamily: "Instrument", fontWeight: 400, fontSize: 12.5, lineHeight: 1.5, color: C.ink },
  body: { fontFamily: "Instrument", fontWeight: 400, fontSize: 10, lineHeight: 1.55, color: C.ink },
  small: { fontFamily: "Instrument", fontWeight: 400, fontSize: 8, lineHeight: 1.45, color: C.inkSoft },
  label: { fontFamily: "Instrument", fontWeight: 500, fontSize: 9.5, lineHeight: 1.35, color: C.ink },
  italic: { fontFamily: "Bodoni", fontStyle: "italic", fontWeight: 400, fontSize: 17, lineHeight: 1.3, color: C.ink },
};

const tx = (style, children, extra) => h(Text, { style: extra ? [style, extra] : style }, children);
const box = (style, ...children) => h(View, { style }, ...children);
const hair = (color = C.stoneDeep, extra) => h(View, { style: [{ height: 0.6, backgroundColor: color }, extra || {}] });
const pad2 = (n) => String(n).padStart(2, "0");
const link = (src, style, children) => h(Link, { src, style: [{ textDecoration: "none" }, ...(Array.isArray(style) ? style : [style])] }, children);

// ---------- brand marks (outlines from components/Brand) ----------
function Wordmark({ width = 150, color = C.ink }) {
  const w = Math.ceil(WORDMARK.width);
  return h(
    Svg,
    { viewBox: `0 -1 ${w} 26.5`, style: { width, height: (width * 26.5) / w } },
    h(Path, { d: WORDMARK.d, fill: color, stroke: color, strokeWidth: 0.7 })
  );
}
function Tagline({ width = 120, color = C.ink }) {
  const w = Math.ceil(TAGLINE.width);
  return h(Svg, { viewBox: `0 0 ${w} 7`, style: { width, height: (width * 7) / w } }, h(Path, { d: TAGLINE.d, fill: color }));
}
function Monogram({ height = 40, color = C.ink }) {
  const s = { stroke: color, strokeWidth: 3.2, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  return h(
    Svg,
    { viewBox: "0 0 48 60", style: { width: height * 0.8, height } },
    h(Path, { d: "M15 57V26M33 57V26", ...s }),
    h(Path, { d: "M15 26h6.5a7 7 0 0 1 0 14H15", ...s }),
    h(Path, { d: "M15 47.5h18", ...s }),
    h(Path, { d: "M15 26C15 16.5 11 10 6 3.5M33 26C33 16.5 37 10 42 3.5", ...s }),
    h(Path, { d: "M14.4 20.5L21 16.7M33.6 20.5L27 16.7", ...s })
  );
}

// ---------- page frame ----------
function creditLineFor(ctx, credits, creditText) {
  const labs = ctx.labs ? " Labs: Bildrechte vor öffentlicher Nutzung klären." : "";
  if (creditText) return `${creditText}${labs}`;
  const brands = [...new Set(credits.filter(Boolean))];
  return brands.length ? `Bilder: ${brands.join(", ")} (Herstellerbilder).${labs}` : null;
}

function Frame({ ctx, n, dark = false, credits = [], creditText = null, ki = false, bare = false, children, bg, id, bookmark, footLeft = MX, footRight = MX, footLight = false }) {
  const fg = dark || footLight ? C.stoneDeep : C.inkSoft;
  const creditLine = creditLineFor(ctx, credits, creditText);
  // narrow footer: a bleed picture on the left or (Abnahme Runde 3) the right
  const narrow = footLeft > MX || footRight > MX;
  return h(
    Page,
    {
      size: "A4",
      orientation: "landscape",
      bookmark: bookmark || undefined,
      style: { backgroundColor: bg || (dark ? C.walnut : C.paper), fontFamily: "Instrument", color: dark ? C.paper : C.ink },
    },
    id ? h(View, { id, style: { position: "absolute", top: 0, left: 0, width: 1, height: 1 } }) : null,
    children,
    // narrow footer (pages with a bleed picture on the left): credits and KI
    // note sit above the footer row, full width, so they do not wrap 6×
    !bare && narrow && (creditLine || ki)
      ? h(
          View,
          { style: { position: "absolute", left: footLeft, right: footRight, bottom: 48 } },
          creditLine ? tx([T.small, { fontSize: 6.4, color: fg }], creditLine) : null,
          ki ? tx([T.small, { fontSize: 6.4, color: fg }], `${KI_SHORT} · Hinweise auf Seite ${ctx.notesPage}`) : null
        )
      : null,
    bare
      ? null
      : h(
          View,
          { style: { position: "absolute", left: footLeft, right: footRight, bottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" } },
          h(
            View,
            { style: { width: narrow ? 230 : 190 } },
            tx([T.small, { fontSize: 6.8, letterSpacing: 0.9, textTransform: "uppercase", color: fg }], "Platzhirsch Home Living"),
            tx([T.small, { fontSize: 6.8, color: fg }], ctx.footerLine)
          ),
          h(
            View,
            { style: { flex: 1, paddingHorizontal: 16 } },
            narrow ? null : creditLine ? tx([T.small, { fontSize: 6.4, color: fg, textAlign: "center" }], creditLine) : null,
            narrow ? null : ki ? tx([T.small, { fontSize: 6.4, color: fg, textAlign: "center" }], `${KI_SHORT} · Hinweise auf Seite ${ctx.notesPage}`) : null
          ),
          tx([T.small, { fontSize: 7.5, width: 54, textAlign: "right", color: fg, fontWeight: 500 }], `${pad2(n)} / ${pad2(ctx.total)}`)
        )
  );
}

// ---------- images ----------
/**
 * Picture in a fixed frame (width × height in pt). See the rules at the top.
 *   kind "auto": product rules; "cover": own photos/materials (may crop).
 */
// Feinschliff P3.3: a small cut-out in a large tile (Helsinki Trolley,
// Mini HEB, Westside Sofa) filled < 20 % of it. Non-protected cut-outs are
// trimmed to the piece (images.js toneToPaper); here the air around them
// shrinks step by step until the piece covers CUTOUT_TARGET of the tile.
// Protected brands (Minotti) keep the fixed passepartout: no change.
export const CUTOUT_TARGET = 0.35;
export const CUTOUT_PADS = [0.12, 0.08, 0.05, 0.03];
/** Share of a width × height tile covered by a contained cut-out with padding share `pad`. */
export function tileCoverage(img, width, height, pad) {
  if (!img?.width || !img?.height) return 0;
  const p = Math.round(Math.min(width, height) * pad);
  const iw = width - 2 * p;
  const ih = height - 2 * p;
  const a = img.width / img.height;
  const fw = Math.min(iw, ih * a);
  const fh = fw / a;
  const fill = img.fill ?? img.stats?.coverage ?? 0;
  return (fill * fw * fh) / (width * height);
}
/** Padding share for a non-protected cut-out: the largest that reaches CUTOUT_TARGET, else the smallest. */
export function cutoutPad(img, width, height) {
  for (const pad of CUTOUT_PADS) if (tileCoverage(img, width, height, pad) >= CUTOUT_TARGET) return pad;
  return CUTOUT_PADS[CUTOUT_PADS.length - 1];
}

function Pic({ img, width, height, item, kind = "auto", style, plate }) {
  const frame = { width, height, overflow: "hidden", ...(style || {}) };
  if (!img) return box([frame, { backgroundColor: plate || C.plate }]);
  const src = { data: img.data, format: "jpg" };
  const isProtected = Boolean(item?.protected);
  if (kind === "cover" || (!isProtected && !img.cutout)) {
    return box(frame, h(Image, { src, style: { width, height, objectFit: "cover" } }));
  }
  if (img.cutout) {
    // cut-out: 12 % air; protected cut-outs keep their white ground → white
    // passepartout with a hairline, so it reads as a deliberate mount
    const pad = Math.round(Math.min(width, height) * (isProtected ? 0.12 : cutoutPad(img, width, height)));
    const bg = isProtected ? C.white : C.bone;
    return box(
      [frame, { backgroundColor: bg, padding: pad, borderWidth: isProtected ? 0.6 : 0, borderColor: C.linen }],
      h(Image, { src, style: { width: "100%", height: "100%", objectFit: "contain" } })
    );
  }
  // protected scene: never cropped – contained on a tone plate
  return box([frame, { backgroundColor: plate || C.plate, justifyContent: "center" }], h(Image, { src, style: { width: "100%", height: "100%", objectFit: "contain" } }));
}

function Qr({ png, size = 46, dark = false }) {
  if (!png) return null;
  return box(
    { width: size + 8, height: size + 8, padding: 4, backgroundColor: dark ? C.paper : C.white },
    h(Image, { src: { data: png, format: "png" }, style: { width: size, height: size } })
  );
}

function ProductCaption({ item, qrSize = 40, width }) {
  return box(
    { flexDirection: "row", alignItems: "flex-start", marginTop: 10, width },
    box(
      { flex: 1, paddingRight: 10 },
      tx([T.overline, { fontSize: 6.8 }], item.brand),
      tx([T.label, { marginTop: 3 }], item.name),
      tx([T.small, { marginTop: 2 }], item.categoryLabel),
      link(item.url, [T.small, { marginTop: 4, color: C.ink, textDecoration: "underline" }], "Im Katalog ansehen")
    ),
    h(Qr, { png: item.qr, size: qrSize })
  );
}

function PaletteStrip({ palette, height = 4, width }) {
  return box({ flexDirection: "row", width, height }, ...palette.map((c) => box({ flex: 1, backgroundColor: c.hex })));
}

function Dots({ palette, size = 40, gap = 14, labels = true, color = C.ink }) {
  return box(
    { flexDirection: "row" },
    ...palette.map((c, i) =>
      box(
        { width: size + 18, marginLeft: i ? gap - 18 + 18 : 0, alignItems: "center" },
        box({ width: size, height: size, borderRadius: size / 2, backgroundColor: c.hex, borderWidth: 0.6, borderColor: C.stoneDeep }),
        labels ? tx([T.small, { marginTop: 6, color, textAlign: "center", fontSize: 7.4 }], c.name) : null
      )
    )
  );
}

function Header({ overline, title, sub, width = 420, dark }) {
  return box(
    { width },
    tx([T.overline, dark ? { color: C.brass400 } : {}], overline),
    tx([T.h2, { marginTop: 10 }, dark ? { color: C.paper } : {}], title),
    sub ? tx([T.lead, { marginTop: GAP_AFTER_TITLE, color: dark ? C.stoneDeep : C.inkSoft }], sub) : null
  );
}

// ---------- pages ----------
function Cover({ ctx, n }) {
  const { profile, customer } = ctx;
  return h(
    Frame,
    { ctx, n, bare: true, bookmark: "Titel", id: "titel" },
    box(
      { flexDirection: "row", height: H },
      box(
        { width: W * 0.54, height: H, backgroundColor: C.stone },
        ctx.images.hero ? h(Pic, { img: ctx.images.hero, width: W * 0.54, height: H, kind: "cover" }) : null
      ),
      box(
        { flex: 1, paddingHorizontal: 44, paddingTop: 50, paddingBottom: 30, justifyContent: "space-between" },
        box(
          {},
          h(Monogram, { height: 38 }),
          tx([T.overline, { marginTop: 34 }], "Persönliches Moodboard · Stil-Finder"),
          tx([T.display, { fontSize: 50, marginTop: 14 }], profile.name),
          tx([T.italic, { marginTop: 14, color: C.inkSoft }], profile.tagline),
          box({ marginTop: 24 }, h(PaletteStrip, { palette: profile.palette, height: 5, width: 180 }))
        ),
        box(
          {},
          tx([T.overline, { color: C.inkSoft }], "Zusammengestellt für"),
          tx([T.h3, { marginTop: 6, fontSize: 22 }], customer.name || "Sie"),
          tx([T.small, { marginTop: 6 }], [customer.projektLabel, customer.regionLabel, ctx.dateLabel].filter(Boolean).join(" · ")),
          hair(C.stoneDeep, { marginTop: 22, marginBottom: 16 }),
          h(Wordmark, { width: 168 }),
          box({ marginTop: 5 }, h(Tagline, { width: 130, color: C.inkSoft })),
          tx([T.small, { marginTop: 12, fontSize: 6.2 }], `Titelbild: ${ctx.images.heroCredit}.${ctx.labs ? " Labs: Bildrechte vor öffentlicher Nutzung klären." : ""}`)
        )
      )
    )
  );
}

function Contents({ ctx, n }) {
  const rows = ctx.toc;
  const line = { fontSize: 11, lineHeight: 1.3 };
  return h(
    Frame,
    { ctx, n, id: "inhalt", bookmark: "Inhalt" },
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT + 10 },
      box(
        { width: 260, paddingRight: 30 },
        tx(T.overline, "Inhalt"),
        tx([T.h2, { marginTop: 10 }], "Ihr Stil, Seite für Seite."),
        tx([T.body, { marginTop: GAP_AFTER_TITLE, color: C.inkSoft }], "Diese Präsentation führt von Ihrem Profil über Farbe und Material in jeden Raum Ihres Zuhauses und endet dort, wo es weitergeht: bei uns im Studio in Lochau."),
        tx([T.small, { marginTop: 12 }], "Jeder Eintrag ist verlinkt. Im PDF-Programm finden Sie die Kapitel auch als Lesezeichen.")
      ),
      box(
        { flex: 1, paddingLeft: 30 },
        ...rows.map((r, i) =>
          link(
            `#${r.id}`,
            { flexDirection: "row", alignItems: "flex-end", paddingVertical: 7, borderBottomWidth: 0.6, borderBottomColor: C.stoneDeep, color: C.ink },
            [
              h(Text, { key: "n", style: [T.body, line, { width: 34, color: C.brass700, fontWeight: 500 }] }, pad2(i + 1)),
              h(Text, { key: "t", style: [T.body, line, { flex: 1 }] }, r.title),
              h(Text, { key: "p", style: [T.body, line, { width: 40, textAlign: "right", fontWeight: 500 }] }, pad2(r.page)),
            ]
          )
        )
      )
    )
  );
}

function Editorial({ ctx, n }) {
  const { content, customer, profile } = ctx;
  const hello = customer.name ? `Guten Tag, ${customer.name},` : "Guten Tag,";
  const pic = ctx.introPic;
  const picW = 236;
  const picH = Math.round(picW * (4 / 3));
  return h(
    Frame,
    { ctx, n, ki: true, id: "einleitung", bookmark: "Einleitung", credits: pic?.item ? [pic.item.brand] : [], creditText: pic && !pic.item ? `Bild: ${pic.credit}.` : null, footRight: picW + 30 },
    box(
      { flexDirection: "row", paddingLeft: MX, paddingTop: MT + 20, height: H },
      box(
        { width: 250, paddingRight: 28 },
        tx(T.overline, "Einleitung"),
        tx([T.display, { fontSize: 38, marginTop: 14 }], content.introTitle),
        // QA Runde 2, P2.5: no tagline quote here (it stood five times in the PDF)
        box({ marginTop: 26 }, h(PaletteStrip, { palette: profile.palette, height: 4, width: 120 }))
      ),
      box(
        { flex: 1, paddingTop: 6, paddingRight: 34 },
        tx([T.lead, { marginBottom: 14 }], hello),
        ...content.intro.map((p) => tx([T.body, { fontSize: 10.6, marginBottom: 12 }], p)),
        tx([T.body, { fontSize: 10.6, marginBottom: 12 }], ctx.personal),
        tx([T.body, { fontSize: 10.6, marginTop: 6 }], "Herzliche Grüße aus Lochau"),
        tx([T.label, { marginTop: 2 }], "Ihr Team von Platzhirsch Home Living")
      ),
      // right: picture 3:4, bleeding off the right and bottom edge
      box(
        { width: picW, height: H - MT - 20, justifyContent: "space-between" },
        box({ paddingTop: 6 }, tx([T.overline, { color: C.inkSoft }], "Ihr Profil in Stichworten"), tx([T.italic, { fontSize: 14, marginTop: 8, color: C.inkSoft }], profile.keywords.slice(0, 3).join(" · "))),
        pic ? box({ position: "absolute", right: 0, bottom: -0, width: picW, height: picH }, h(Pic, { img: pic.img, item: pic.item, width: picW, height: picH, kind: pic.item ? "auto" : "cover" })) : null
      )
    )
  );
}

function Analysis({ ctx, n }) {
  const { result, content, profile } = ctx;
  const personal = Boolean(result?.answers?.length || result?.shares?.length);
  return h(
    Frame,
    { ctx, n, ki: true, id: "analyse", bookmark: "Stilprofil-Analyse" },
    box(
      { paddingHorizontal: MX, paddingTop: MT },
      h(Header, { overline: "Stilprofil-Analyse", title: `Was „${profile.name}“ ausmacht`, width: 600 }),
      box(
        { flexDirection: "row", marginTop: 26 },
        box(
          { width: 340, paddingRight: 34 },
          ...content.traits.map(([t, d], i) =>
            box(
              { flexDirection: "row", paddingVertical: 11, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
              tx([T.small, { width: 26, color: C.brass700, fontWeight: 500 }], pad2(i + 1)),
              box({ flex: 1 }, tx(T.label, t), tx([T.body, { marginTop: 3 }], d))
            )
          ),
          box(
            { borderTopWidth: 0.6, borderTopColor: C.stoneDeep, paddingTop: 12 },
            tx([T.overline, { color: C.inkSoft }], "Stichworte"),
            box({ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }, ...profile.keywords.map((k) => box({ borderWidth: 0.6, borderColor: C.pebble, paddingHorizontal: 7, paddingVertical: 3, marginRight: 5, marginBottom: 5 }, tx([T.small, { color: C.ink }], k))))
          )
        ),
        personal
          ? box(
              { flex: 1, paddingLeft: 10 },
              result?.shares?.length
                ? box(
                    { marginBottom: 22 },
                    tx([T.overline, { color: C.inkSoft }], "Ihre Mischung"),
                    box({ flexDirection: "row", height: 8, marginTop: 10 }, ...result.shares.map((s) => box({ width: `${s.pct}%`, backgroundColor: s.color }))),
                    ...result.shares.map((s) =>
                      box(
                        { flexDirection: "row", alignItems: "center", marginTop: 6 },
                        box({ width: 7, height: 7, backgroundColor: s.color, marginRight: 7 }),
                        tx([T.body, { flex: 1 }], s.name),
                        tx([T.body, { width: 40, textAlign: "right" }], `${s.pct} %`)
                      )
                    )
                  )
                : null,
              tx([T.overline, { color: C.inkSoft }], "Ihre Antworten"),
              box(
                { marginTop: 6 },
                ...(result.answers || []).map((a) =>
                  box(
                    { flexDirection: "row", paddingVertical: 4.5, borderBottomWidth: 0.6, borderBottomColor: C.linen },
                    tx([T.small, { width: 92 }], a.q),
                    tx([T.body, { flex: 1, fontSize: 9.5 }], a.a)
                  )
                )
              ),
              tx([T.small, { marginTop: 10 }], "Regelbasierte Auswertung, keine KI. Die Antworten werden nicht gespeichert.")
            )
          : // P3.1: without an answer code the right column shows the palette large
            box(
              { flex: 1, paddingLeft: 10 },
              tx([T.overline, { color: C.inkSoft }], "Ihre Palette"),
              box(
                { flexDirection: "row", height: 230, marginTop: 10 },
                ...profile.palette.map((c, i) =>
                  box({ flex: 1, marginLeft: i ? 4 : 0, backgroundColor: c.hex, justifyContent: "flex-end", padding: 8 }, tx([T.small, { color: textOn(c.hex), fontWeight: 500 }], c.name))
                )
              ),
              tx([T.small, { marginTop: 10 }], "So entsteht Ihr Profil: Ihre Antworten im Stil-Finder werden nach festen Regeln gewichtet (keine KI). Das Profil mit den meisten Punkten bestimmt diese Präsentation.")
            )
      )
    )
  );
}

// ---- Moodboard spread (QA P1.2): collage, bleed, 8 pictures ----
function MoodboardA({ ctx, n }) {
  const g = 4;
  const m = ctx.mood;
  const x2 = 396 + g;
  const w2 = 214;
  const x3 = x2 + w2 + g;
  const w3 = W - x3;
  const tile = (t, x, y, w, hh) =>
    box({ position: "absolute", left: x, top: y, width: w, height: hh }, h(Pic, { img: t?.img, item: t?.item, width: w, height: hh, kind: t?.kind || "auto", plate: C.stone }));
  return h(
    Frame,
    { ctx, n, bare: true, id: "moodboard", bookmark: "Moodboard" },
    tile(m.hero, 0, 0, 396, H),
    tile(m.p1, x2, 0, w2, 300),
    tile(m.mat1, x2, 300 + g, w2, H - 300 - g),
    tile(m.mat2, x3, 0, w3, 190),
    tile(m.p2, x3, 190 + g, w3, 200),
    tile(m.p3, x3, 394 + g, w3, H - 394 - g),
    box(
      { position: "absolute", left: 22, bottom: 22, width: 300, backgroundColor: C.paper, paddingHorizontal: 16, paddingVertical: 13 },
      tx([T.overline, { fontSize: 6.8 }], `Moodboard · ${ctx.profile.name}`),
      tx([T.italic, { fontSize: 15, marginTop: 5 }], ctx.profile.tagline),
      tx([T.small, { fontSize: 6, marginTop: 7 }], `${pad2(n)} / ${pad2(ctx.total)} · ${ctx.moodCredit}${ctx.labs ? " Labs: Bildrechte vor öffentlicher Nutzung klären." : ""}`)
    )
  );
}

function MoodboardB({ ctx, n }) {
  const m = ctx.mood;
  const { profile } = ctx;
  const rx = 540;
  const rw = W - rx;
  return h(
    Frame,
    { ctx, n, creditText: ctx.moodCredit, footRight: rw + 24 },
    box(
      { position: "absolute", left: rx, top: 0, width: rw, height: 344 },
      h(Pic, { img: m.p4?.img, item: m.p4?.item, width: rw, height: 344, kind: m.p4?.kind || "auto", plate: C.stone })
    ),
    box({ position: "absolute", left: rx, top: 348, width: rw, height: H - 348 }, h(Pic, { img: m.mat3?.img, width: rw, height: H - 348, kind: "cover" })),
    box(
      { paddingLeft: MX, paddingTop: MT, width: rx - 30 },
      tx(T.overline, "Moodboard"),
      tx([T.h2, { marginTop: 10 }], "Ihre Welt in Bildern"),
      tx([T.body, { marginTop: GAP_AFTER_TITLE, color: C.inkSoft, width: 380 }], "Räume, Stücke aus unserem Katalog und Materialmuster, zusammengestellt nach Ihrem Profil. Alles Weitere zeigen die folgenden Seiten im Detail."),
      box(
        { marginTop: 24 },
        ...profile.keywords.slice(0, 3).map((k, i) => tx([T.italic, { fontSize: 30, lineHeight: 1.18, color: i === 1 ? C.brass700 : C.ink }], k))
      ),
      // QA Runde 2, P2.5: a material line of this profile instead of the tagline
      ctx.materialLine ? box({ marginTop: 22, borderLeftWidth: 1, borderLeftColor: C.brass500, paddingLeft: 14, width: 380 }, tx([T.overline, { color: C.inkSoft }], "Ihre Materialien"), tx([T.italic, { fontSize: 14, marginTop: 5, color: C.inkSoft }], ctx.materialLine)) : null,
      box({ marginTop: 28 }, h(Dots, { palette: profile.palette, size: 40, gap: 16 }))
    )
  );
}

function PalettePage({ ctx, n }) {
  const { profile } = ctx;
  return h(
    Frame,
    { ctx, n, id: "palette", bookmark: "Farbpalette" },
    box(
      { paddingHorizontal: MX, paddingTop: MT },
      h(Header, { overline: "Farbpalette", title: "Die Töne Ihres Zuhauses", width: 520 }),
      box(
        { flexDirection: "row", marginTop: 26, height: 330 },
        ...profile.palette.map((c, i) => {
          const k = codes(c.hex);
          const fg = textOn(c.hex);
          return box(
            { flex: 1, marginLeft: i ? 6 : 0, backgroundColor: c.hex, padding: 14, justifyContent: "flex-end" },
            tx([T.h3, { color: fg, fontSize: 19 }], c.name),
            box({ marginTop: 10, height: 0.6, backgroundColor: fg }),
            tx([T.small, { color: fg, marginTop: 8, fontWeight: 500 }], `HEX ${k.hex}`),
            tx([T.small, { color: fg, marginTop: 2 }], `RGB ${k.rgb}`),
            tx([T.small, { color: fg, marginTop: 2 }], `CMYK ${k.cmyk}`)
          );
        })
      ),
      tx([T.small, { marginTop: 10 }], "CMYK rechnerisch umgerechnet, ohne Farbprofil. Für Wandfarben, Lacke und Stoffe vergleichen wir im Studio mit echten Mustern – Farben wirken am Bildschirm, im Druck und im Raum unterschiedlich.")
    )
  );
}

// QA Runde 2, P2.3: graphic and text from one source (content.colorRoles),
// block widths proportional 6 : 3 : 1 (the accent keeps a minimum width).
const COLOR_AREA_W = W - 2 * MX - 290;
export function colorBlockWidths(total = COLOR_AREA_W, gap = 8, minW = 44) {
  const free = total - 2 * gap;
  const accent = Math.max(minW, free * 0.1);
  const rest = free - accent;
  return [rest * (6 / 9), rest * (3 / 9), accent];
}

function ColorUse({ ctx, n }) {
  const { profile, content } = ctx;
  const roles = colorRoles(content, profile.palette);
  const widths = colorBlockWidths();
  return h(
    Frame,
    { ctx, n, ki: true },
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT },
      box(
        { width: 290, paddingRight: 34 },
        h(Header, { overline: "Farbe im Raum", title: "Wie viel wovon?", width: 270 }),
        tx([T.body, { fontSize: 10.6, marginTop: GAP_AFTER_TITLE }], colorUseText(content, profile.palette)),
        tx([T.small, { marginTop: 14 }], "Die Regel 60 – 30 – 10 ist ein Ausgangspunkt, kein Gesetz. Sie hilft, damit ein Raum ruhig bleibt und trotzdem Charakter hat.")
      ),
      box(
        { width: COLOR_AREA_W },
        box({ flexDirection: "row", height: 300 }, ...roles.map((r, i) => box({ width: widths[i], marginLeft: i ? 8 : 0 }, ...r.tones.map((c) => box({ flex: 1, backgroundColor: c.hex }))))),
        // labels in three equal columns under the blocks, each with its tones
        box(
          { flexDirection: "row", marginTop: 14 },
          ...roles.map((r, i) =>
            box(
              { flex: 1, marginLeft: i ? 14 : 0, paddingTop: 8, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
              tx([T.h3, { fontSize: 19 }], `${r.pct} %`),
              tx([T.label, { marginTop: 2 }], r.title),
              box(
                { flexDirection: "row", flexWrap: "wrap", marginTop: 5 },
                ...r.tones.map((c) => box({ flexDirection: "row", alignItems: "center", marginRight: 8, marginTop: 2 }, box({ width: 8, height: 8, backgroundColor: c.hex, borderWidth: 0.5, borderColor: C.stoneDeep, marginRight: 4 }), tx([T.small, { color: C.ink }], c.name)))
              ),
              tx([T.small, { marginTop: 4 }], r.desc)
            )
          )
        )
      )
    )
  );
}

const MATERIAL_NAMES = { holz: "Holz", stein: "Stein", textil: "Textil", metall: "Metall" };
const MATERIAL_TONES = { holz: [3, 2], stein: [1, 0], textil: [0, 2], metall: [4, 3] };

// P1.3: one material per page. Abnahme Runde 3, P3.3: the four pages no
// longer share one layout – A photo bleeding left, B photo bleeding right,
// C photo over the full width with a paper card, D a sample board (photo
// plus the two palette tones as sample cards, like the boards in the studio).
export const MATERIAL_LAYOUTS = ["left", "right", "card", "board"];

function MaterialText({ ctx, k, index, img, width, top = MT + 16, fontSize = 54, swatches = true }) {
  const { content, profile } = ctx;
  const [text, picks] = content.materials[k];
  const tones = MATERIAL_TONES[k].map((j) => profile.palette[j]);
  return box(
    { width, paddingTop: top },
    tx(T.overline, `Materialwelt · ${pad2(index + 1)} von 04`),
    tx([T.display, { fontSize, marginTop: 10 }], MATERIAL_NAMES[k]),
    tx([T.body, { fontSize: 11.2, marginTop: GAP_AFTER_TITLE }], text),
    box(
      { marginTop: 22, borderTopWidth: 0.6, borderTopColor: C.stoneDeep, paddingTop: 12 },
      tx([T.overline, { color: C.inkSoft }], "Passt zu Ihnen"),
      ...picks.map((p) => tx([T.italic, { fontSize: 19, marginTop: 6 }], p))
    ),
    !swatches
      ? null
      : box(
      { marginTop: 22, flexDirection: "row", flexWrap: "wrap" },
      ...tones.map((t, i) =>
        box({ flexDirection: "row", alignItems: "center", marginLeft: i ? 18 : 0 }, box({ width: 14, height: 14, backgroundColor: t.hex, borderWidth: 0.6, borderColor: C.stoneDeep }), tx([T.small, { marginLeft: 6 }], `${t.name} ${t.hex.toUpperCase()}`))
      )
    ),
    tx([T.small, { marginTop: 18 }], img ? "Materialfoto als Stimmung (frei lizenzierte Textur). Echte Muster zum Anfassen liegen im Studio." : "Echte Muster zum Anfassen liegen im Studio.")
  );
}

const materialChip = (img, pos) =>
  img ? box({ position: "absolute", ...pos, backgroundColor: C.paper, paddingHorizontal: 9, paddingVertical: 5 }, tx([T.small, { fontSize: 7, color: C.ink, fontWeight: 500 }], img.label)) : null;

function MaterialPage({ ctx, n, k, index }) {
  const { profile } = ctx;
  const img = ctx.images.materials?.[k];
  const layout = MATERIAL_LAYOUTS[index % MATERIAL_LAYOUTS.length];
  const strip = 12;
  const tones = MATERIAL_TONES[k].map((j) => profile.palette[j]);
  const frameBase = {
    ctx,
    n,
    ki: true,
    creditText: img ? ctx.images.materialCreditShort : null,
    id: index === 0 ? "material" : undefined,
    bookmark: index === 0 ? "Materialwelt" : undefined,
  };
  const toneStrip = (pos, width) => box({ position: "absolute", ...pos, width, height: strip, flexDirection: "row" }, ...tones.map((t) => box({ flex: 1, backgroundColor: t.hex })));

  if (layout === "left" || layout === "right") {
    const pw = 400;
    const left = layout === "left";
    const side = left ? { left: 0 } : { right: 0 };
    return h(
      Frame,
      { ...frameBase, ...(left ? { footLeft: pw + 48 } : { footRight: pw + 48 }) },
      box({ position: "absolute", ...side, top: 0, width: pw, height: H - strip }, h(Pic, { img, width: pw, height: H - strip, kind: "cover", plate: tones[0].hex })),
      toneStrip({ ...side, bottom: 0 }, pw),
      materialChip(img, left ? { left: 18, top: 18 } : { right: 18, top: 18 }),
      box({ marginLeft: left ? pw + 48 : MX, marginRight: left ? MX : pw + 48 }, h(MaterialText, { ctx, k, index, img }))
    );
  }

  if (layout === "card") {
    // photo over the full width, the text on a paper card; the footer keeps a paper band
    const band = 64;
    const cw = 330;
    return h(
      Frame,
      frameBase,
      box({ position: "absolute", left: 0, top: 0, width: W, height: H - band }, h(Pic, { img, width: W, height: H - band, kind: "cover", plate: tones[0].hex })),
      toneStrip({ left: 0, top: H - band }, W),
      materialChip(img, { left: 18, top: 18 }),
      box(
        { position: "absolute", right: MX, top: 36, width: cw, backgroundColor: C.paper, paddingHorizontal: 28, paddingBottom: 26, borderWidth: 0.5, borderColor: C.line },
        h(MaterialText, { ctx, k, index, img, top: 26, fontSize: 48 })
      )
    );
  }

  // "board": a sample board on the right – the material photo and the two
  // palette tones as cards with name and code
  const pw = 236;
  const ph = 330;
  const cw = 150;
  const chh = (ph - 10) / 2;
  const bx = W - MX - pw - 12 - cw;
  const card = (t, i) =>
    box(
      { key: t.hex, width: cw, height: chh, marginTop: i ? 10 : 0, backgroundColor: t.hex, borderWidth: 0.6, borderColor: C.stoneDeep, justifyContent: "flex-end", padding: 10 },
      box({ backgroundColor: C.paper, paddingHorizontal: 7, paddingVertical: 4, alignSelf: "flex-start" }, tx([T.small, { fontSize: 7, color: C.ink, fontWeight: 500 }], `${t.name} ${t.hex.toUpperCase()}`))
    );
  return h(
    Frame,
    frameBase,
    box(
      { position: "absolute", left: bx, top: MT + 16 },
      tx([T.overline, { color: C.inkSoft, marginBottom: 10 }], "Musterbrett"),
      box(
        { flexDirection: "row" },
        box({ width: pw }, h(Pic, { img, width: pw, height: ph, kind: "cover", plate: tones[0].hex }), img ? tx([T.small, { marginTop: 8, color: C.ink, fontWeight: 500 }], img.label) : null),
        box({ marginLeft: 12 }, ...tones.map(card))
      )
    ),
    box({ marginLeft: MX, marginRight: W - bx + 40 }, h(MaterialText, { ctx, k, index, img, swatches: false }))
  );
}

function RoomsDivider({ ctx, n }) {
  return h(
    Frame,
    { ctx, n, bg: C.bone, id: "raeume", bookmark: "Raum für Raum" },
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT + 40, height: H - 80 },
      box(
        { width: 360 },
        tx(T.overline, "Kapitel"),
        tx([T.display, { fontSize: 64, marginTop: 14 }], "Raum für Raum"),
        tx([T.lead, { marginTop: GAP_AFTER_TITLE + 4, color: C.inkSoft, width: 320 }], "Fünf Räume, jeweils bis zu vier Stücke aus unserem Online-Katalog, die zu Ihrem Profil passen. Jeder QR-Code führt zum Stück im Katalog.")
      ),
      box(
        { flex: 1, paddingLeft: 60, paddingTop: 10 },
        ...ROOM_ORDER.map((r, i) =>
          link(
            `#raum-${r}`,
            { flexDirection: "row", alignItems: "flex-end", paddingVertical: 12, borderBottomWidth: 0.6, borderBottomColor: C.stoneDeep, color: C.ink },
            [
              h(Text, { key: "n", style: [T.body, { width: 40, color: C.brass700, fontWeight: 500, fontSize: 11, lineHeight: 1.6 }] }, pad2(i + 1)),
              h(Text, { key: "t", style: [T.h3, { flex: 1, fontSize: 24, fontWeight: 400 }] }, ROOM_META[r].title),
              h(Text, { key: "p", style: [T.body, { width: 40, textAlign: "right", fontSize: 11, lineHeight: 1.6 }] }, pad2(ctx.roomPages[r])),
            ]
          )
        )
      )
    )
  );
}

// P1.5: room hero bleeds on the left half (top, bottom, left).
function RoomLead({ ctx, n, room, idx }) {
  const items = ctx.rooms[room] || [];
  const lead = items[0];
  const meta = ROOM_META[room];
  const img = lead?.img;
  const frameProps = { ctx, n, ki: true, credits: lead ? [lead.brand] : [], id: `raum-${room}`, bookmark: `${pad2(idx + 1)} ${meta.title}` };
  const tips = ROOM_TIPS[room];
  const caption = lead
    ? box({ borderTopWidth: 0.6, borderTopColor: C.ink, paddingTop: 2 }, tx([T.overline, { color: C.inkSoft, marginTop: 6 }], "Im Bild"), h(ProductCaption, { item: lead, qrSize: 36 }))
    : tx([T.small], "Für diesen Raum zeigen wir Ihnen Stücke gern im Studio.");

  // Protected landscape scene (never cropped, e.g. Minotti): the photo keeps
  // its ratio and bleeds top and left over 62 % of the width; the planning
  // values run in three columns underneath, title and text on the right.
  if (lead && img && lead.protected && !img.cutout && img.width > img.height) {
    const lw = Math.round(W * 0.62);
    const bandH = Math.min(360, Math.round((lw * img.height) / img.width));
    const colW = (lw - MX - 24 - 2 * 16) / 3;
    return h(
      Frame,
      frameProps,
      box({ position: "absolute", left: 0, top: 0, width: lw, height: bandH }, h(Image, { src: { data: img.data, format: "jpg" }, style: { width: lw, height: bandH } })),
      box(
        { position: "absolute", left: MX, top: bandH + 22, width: lw - MX - 24 },
        tx([T.overline, { color: C.inkSoft, marginBottom: 6 }], "Richtwerte für die Planung"),
        box(
          { flexDirection: "row" },
          ...tips.map(([t, d], i) => box({ width: colW, marginLeft: i ? 16 : 0, paddingTop: 7, borderTopWidth: 0.6, borderTopColor: C.stoneDeep }, tx(T.label, t), tx([T.body, { marginTop: 2, color: C.inkSoft, fontSize: 9.2 }], d)))
        )
      ),
      box(
        { marginLeft: lw + 36, marginRight: MX, paddingTop: MT, height: H - 76, justifyContent: "space-between" },
        box(
          {},
          tx(T.overline, `${meta.overline} · ${ctx.profile.name}`),
          tx([T.display, { fontSize: 44, marginTop: 10 }], meta.title),
          tx([T.body, { fontSize: 10.6, marginTop: GAP_AFTER_TITLE }], ctx.content.rooms[room]),
          box({ marginTop: 18 }, h(PaletteStrip, { palette: ctx.profile.palette, height: 3 }))
        ),
        caption
      )
    );
  }

  // Default: the left half bleeds (top, bottom, left). QA Runde 3, P2.1/2.2:
  // a cut-out hero never sits alone on an empty half page – the layout
  // (leadLayout in buildDocument) puts a scene of the profile behind it.
  const pw = W / 2;
  const L = ctx.leads?.[room] || { mode: lead ? "cutout" : "empty" };
  const sceneImg = L.scene?.img;
  let left = null;
  let credit = null;
  let capOverline = "Im Bild";
  if (L.mode === "inset" || L.mode === "scene-only") {
    left = [h(Pic, { key: "s", img: sceneImg, width: pw, height: H, kind: "cover" }), sceneTag("s2", { left: 0, bottom: 0 })];
    if (L.mode === "inset") {
      // flush with the lower edge and the inner edge of the picture, paper
      // tone, 0.5 pt hairline, 8 pt inner padding
      const { w, h: ih } = L.inset;
      const bgInset = lead.protected ? C.white : C.bone;
      left.push(
        h(
          View,
          { key: "i", style: { position: "absolute", right: 0, bottom: 0, width: w, height: ih, backgroundColor: bgInset, borderTopWidth: 0.5, borderLeftWidth: 0.5, borderColor: C.line, padding: INSET_PAD } },
          h(Image, { src: { data: img.data, format: "jpg" }, style: { width: "100%", height: "100%", objectFit: "contain" } })
        )
      );
      capOverline = "Im Bild: das Stück im Einschub";
    } else capOverline = `Ihr Stück für diesen Raum · Abbildung Seite ${pad2(n + 1)}`;
    credit = lead ? `Bilder: ${lead.brand} (Herstellerbild). Raumstimmung: ${L.scene.credit}.` : `Raumstimmung: ${L.scene.credit}.`;
  } else if (lead) {
    left = h(Pic, { img, item: lead, width: pw, height: H, plate: C.stone });
  }
  const caption2 = lead
    ? box({ borderTopWidth: 0.6, borderTopColor: C.ink, paddingTop: 2 }, tx([T.overline, { color: C.inkSoft, marginTop: 6 }], capOverline), h(ProductCaption, { item: lead, qrSize: 36 }))
    : caption;
  return h(
    Frame,
    { ...frameProps, ...(credit ? { credits: [], creditText: credit } : {}), footLeft: pw + 40 },
    box({ position: "absolute", left: 0, top: 0, width: pw, height: H, backgroundColor: C.stone }, left),
    box(
      { marginLeft: pw + 40, marginRight: MX, paddingTop: MT, height: H - 84, justifyContent: "space-between" },
      box(
        {},
        tx(T.overline, `${meta.overline} · ${ctx.profile.name}`),
        tx([T.display, { fontSize: 50, marginTop: 10 }], meta.title),
        tx([T.body, { fontSize: 10.8, marginTop: GAP_AFTER_TITLE }], ctx.content.rooms[room]),
        box(
          { marginTop: 16 },
          tx([T.overline, { color: C.inkSoft, marginBottom: 4 }], "Richtwerte für die Planung"),
          ...tips.map(([t, d]) => box({ paddingVertical: 6, borderTopWidth: 0.6, borderTopColor: C.stoneDeep }, tx(T.label, t), tx([T.body, { marginTop: 1, color: C.inkSoft, fontSize: 9.4 }], d)))
        )
      ),
      caption2
    )
  );
}

// small "Raumstimmung" tag in the corner of a scene (QA Runde 3, P2.2)
function sceneTag(key, pos) {
  return h(View, { key, style: { position: "absolute", ...pos, backgroundColor: C.paper, paddingHorizontal: 8, paddingVertical: 4 } }, tx([T.small, { fontSize: 6.8, color: C.inkSoft, letterSpacing: 0.6, textTransform: "uppercase" }], "Raumstimmung"));
}

// ---- lead layout (QA Runde 3, P2.1/P2.2) ----
const LEAD_PW = W / 2;
export const INSET_PAD = 8;
export const INSET_MIN_COVERAGE = 0.35;
/** Inset frame for a cut-out of aspect a (w/h): landscape pieces wide, others upright. */
export function insetFrame(a) {
  if (a >= 1.15) {
    const w = 270;
    const ih = Math.max(130, Math.min(230, Math.round((w - 2 * INSET_PAD) / a + 2 * INSET_PAD)));
    return { w, h: ih };
  }
  const ih = 240;
  const w = Math.max(150, Math.min(240, Math.round((ih - 2 * INSET_PAD) * a + 2 * INSET_PAD)));
  return { w, h: ih };
}
/** Share of the inset covered by the piece: its own fill × the contained area. */
export function insetCoverage(img, frame) {
  const a = img.width / img.height;
  const iw = frame.w - 2 * INSET_PAD;
  const ihh = frame.h - 2 * INSET_PAD;
  const fw = Math.min(iw, ihh * a);
  const fh = fw / a;
  const fill = img.fill ?? img.stats?.coverage ?? 0;
  return (fill * fw * fh) / (frame.w * frame.h);
}
/**
 * leadLayout(lead, scene) → { mode, scene?, inset?, coverage? }
 *   "protected-band"  Minotti landscape scene (never cropped)
 *   "scene-hero"      the hero itself is a scene: bleeds
 *   "inset"           scene of the profile + the cut-out flush at the bottom
 *   "scene-only"      scene of the profile; the cut-out covers < 35 % of any
 *                     inset, so it moves to the selection page
 *   "cutout"          no scene available (should not happen: ROOM_SCENES)
 *   "empty"           no piece
 */
export function leadLayout(lead, scene) {
  const img = lead?.img;
  if (!lead || !img) return scene ? { mode: "scene-only", scene, noPiece: true } : { mode: "empty" };
  if (lead.protected && !img.cutout && img.width > img.height) return { mode: "protected-band" };
  if (!img.cutout) return { mode: lead.protected ? "protected-scene" : "scene-hero" };
  if (!scene?.img) return { mode: "cutout" };
  const inset = insetFrame(img.width / img.height);
  const coverage = insetCoverage(img, inset);
  return coverage >= INSET_MIN_COVERAGE ? { mode: "inset", scene, inset, coverage } : { mode: "scene-only", scene, coverage };
}

// Abnahme Runde 3, Restliste 2: no empty "Mehr im Studio" tile. The grid
// follows the number of pieces: 4 (hero here) or 3 columns, with 2 pieces two
// large frames, with 1 piece the frame plus a short note beside it.
export const SELECTION_MAX_FRAME_H = 330;
export function selectionGrid(count, heroHere = false) {
  if (count >= 3) return { slots: heroHere && count >= 4 ? 4 : 3, note: false };
  return { slots: 2, note: count < 2 };
}

function RoomProducts({ ctx, n, room }) {
  // QA Runde 3, P2.2: when the lead page shows only the scene, the hero opens
  // this page and the selection runs in four columns
  const heroHere = ctx.leads?.[room]?.mode === "scene-only";
  const items = (ctx.rooms[room] || []).slice(heroHere ? 0 : 1, 4);
  const { slots, note } = selectionGrid(items.length, heroHere);
  const meta = ROOM_META[room];
  const colW = (W - 2 * MX - (slots - 1) * 18) / slots;
  // one frame per page: 4:5; only when most pictures are protected landscape
  // scenes (never cropped) a 4:3 frame avoids large empty plates
  const protLandscape = items.filter((it) => it.protected && it.img && !it.img.cutout && it.img.width > it.img.height).length;
  const ratio = protLandscape >= 2 ? 3 / 4 : 5 / 4;
  const frameH = Math.min(SELECTION_MAX_FRAME_H, Math.round(colW * ratio));
  const studioNote = (key) =>
    box(
      { key, width: colW, marginLeft: items.length ? 18 : 0, paddingTop: 18, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
      tx([T.h3, { fontSize: 20 }], "Mehr im Studio"),
      tx([T.body, { marginTop: 8, width: 300 }], "Weitere Stücke für diesen Raum zeigen wir Ihnen gern bei einem Termin in Lochau – mit Mustern und Ausführungen zum Vergleichen.")
    );
  return h(
    Frame,
    { ctx, n, credits: items.map((i) => i.brand) },
    box(
      { paddingHorizontal: MX, paddingTop: MT },
      box(
        { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
        h(Header, { overline: `${meta.overline} · Stücke aus dem Katalog`, title: `${meta.title}: die Auswahl`, width: 460 }),
        tx([T.small, { width: 230, textAlign: "right" }], "Ausführungen, Bezüge und Maße besprechen wir persönlich. Ob ein Stück ausgestellt ist, klären wir vor Ihrem Besuch.")
      ),
      box(
        { flexDirection: "row", marginTop: 22, alignItems: "flex-start" },
        ...items.slice(0, slots).map((item, i) =>
          box({ key: item.id, width: colW, marginLeft: i ? 18 : 0 }, h(Pic, { img: item.img, item, width: colW, height: frameH }), h(ProductCaption, { item, qrSize: 36, width: colW }))
        ),
        note ? studioNote("note") : null
      )
    )
  );
}

// P1.6: every combination as a small collage (3:4 + two 1:1), on paper tone.
function ComboGroup({ items: given, width, maxH = 9999, height = null }) {
  const g = 4;
  if (height) return h(ComboColumn, { items: given, width, height, g });
  // P3.4: a rug texture never leads a collage (small tile instead)
  const items = [...given];
  const li = items.findIndex((it) => it && !isRug(it));
  if (li > 0) items.unshift(items.splice(li, 1)[0]);
  const lead = items[0];
  if (lead?.protected && lead.img && !lead.img.cutout && lead.img.width > lead.img.height) {
    // never cropped: the lead keeps its landscape ratio, two 4:3 tiles below
    const bh = Math.round((width * lead.img.height) / lead.img.width);
    const sw = (width - g) / 2;
    const sh = Math.min(Math.round(sw * 0.75), Math.max(80, maxH - bh - g));
    return box(
      { width },
      h(Pic, { img: lead.img, item: lead, width, height: bh }),
      box({ flexDirection: "row", marginTop: g }, h(Pic, { img: items[1]?.img, item: items[1], width: sw, height: sh }), box({ marginLeft: g }, h(Pic, { img: items[2]?.img, item: items[2], width: sw, height: sh })))
    );
  }
  const s = Math.floor((width - 3 - g) / 2.5);
  const bw = width - s - g;
  const bh = 2 * s + g;
  const [a, b, c] = items;
  return box(
    { flexDirection: "row", width, height: bh },
    h(Pic, { img: a?.img, item: a, width: bw, height: bh }),
    box({ marginLeft: g }, h(Pic, { img: b?.img, item: b, width: s, height: s }), box({ marginTop: g }, h(Pic, { img: c?.img, item: c, width: s, height: s })))
  );
}

// Abnahme Runde 3, P3.2: the first combination fills the full page height on
// the right (bleeds top, right, bottom): the lead on top, two pieces below.
// A protected landscape lead (Minotti) keeps its ratio, never cropped.
// Feinschliff P3.4: a rug texture (Lisière) took 60 % of the column and the
// coffee tables beside it were tiny. A rug is never the lead and never a
// large tile: it becomes a narrow strip under the other piece. Wide cut-outs
// (sofas, low tables) get a full-width tile instead of a tall half (P3.3).
export const COMBO_RUG_STRIP = 0.26;
const isRug = (it) => it?.category === "rugs";
const isWideCut = (it) => it?.img?.cutout && it.img.width > it.img.height * 1.5;
export function comboColumnPlan(items) {
  const list = items.filter(Boolean);
  const leadIdx = list.findIndex((it) => !isRug(it));
  if (leadIdx > 0) list.unshift(list.splice(leadIdx, 1)[0]);
  const [a, ...rest] = list;
  const rug = rest.find(isRug);
  const others = rest.filter((it) => it !== rug);
  if (rug && others.length) return { a, bottom: "strip", piece: others[0], rug };
  const [b, c] = rest;
  if (b && c && (isWideCut(b) || isWideCut(c))) return { a, bottom: "stack", b, c };
  return { a, bottom: c ? "row" : "single", b, c };
}
function ComboColumn({ items, width, height, g }) {
  const plan = comboColumnPlan(items);
  const { a } = plan;
  const protectedBand = a?.protected && a.img && !a.img.cutout && a.img.width > a.img.height;
  const topH = protectedBand ? Math.min(Math.round((width * a.img.height) / a.img.width), Math.round(height * 0.62)) : Math.round(height * 0.6);
  const sw = (width - g) / 2;
  const sh = height - topH - g;
  let bottom;
  if (plan.bottom === "strip") {
    const rh = Math.round(sh * COMBO_RUG_STRIP);
    bottom = box({ marginTop: g }, h(Pic, { img: plan.piece.img, item: plan.piece, width, height: sh - rh - g }), box({ marginTop: g }, h(Pic, { img: plan.rug.img, item: plan.rug, width, height: rh })));
  } else if (plan.bottom === "stack") {
    const hh = Math.floor((sh - g) / 2);
    bottom = box({ marginTop: g }, h(Pic, { img: plan.b.img, item: plan.b, width, height: hh }), box({ marginTop: g }, h(Pic, { img: plan.c.img, item: plan.c, width, height: sh - hh - g })));
  } else {
    const { b, c } = plan;
    bottom = box({ flexDirection: "row", marginTop: g }, h(Pic, { img: b?.img, item: b, width: c ? sw : width, height: sh }), c ? box({ marginLeft: g }, h(Pic, { img: c.img, item: c, width: sw, height: sh })) : null);
  }
  return box({ width, height }, h(Pic, { img: a?.img, item: a, width, height: topH }), bottom);
}

function ComboText({ c, i, ctx }) {
  return box(
    {},
    tx([T.small, { marginTop: 12, color: C.brass700, fontWeight: 500 }], pad2(i + 1)),
    tx([T.h3, { marginTop: 4 }], c.title),
    tx([T.body, { marginTop: 6 }], c.text),
    box(
      { marginTop: 8 },
      ...c.items.map((it) => h(Link, { key: it.id, src: it.url, style: [T.small, { color: C.ink, marginTop: 2, textDecoration: "none" }] }, `${it.brand} · ${it.name} · ${ROOM_META[it.room]?.title || ""}, Seite ${it.page}`))
    )
  );
}

export const COMBO_A_WIDTH = 430;
function CombosA({ ctx, n }) {
  const [c] = ctx.combos;
  const gw = COMBO_A_WIDTH;
  return h(
    Frame,
    { ctx, n, ki: true, credits: c ? c.items.map((i) => i.brand) : [], id: "kombinationen", bookmark: "Kombinationen", footRight: c ? gw + 36 : MX },
    c ? box({ position: "absolute", right: 0, top: 0, width: gw, height: H }, h(ComboGroup, { items: c.items, width: gw, height: H })) : null,
    box(
      { paddingLeft: MX, paddingRight: c ? gw + 44 : MX, paddingTop: MT },
      h(Header, { overline: "Kombinationsvorschläge", title: "Was gut zusammengeht", width: 320, sub: "Drei Zusammenstellungen aus Ihrer Auswahl: Stücke, die sich in Farbe und Material antworten, oft über die Räume hinweg." }),
      c ? h(ComboText, { c, i: 0, ctx }) : null,
      box({ marginTop: 22, width: 160 }, h(PaletteStrip, { palette: ctx.profile.palette, height: 3 }))
    )
  );
}

function CombosB({ ctx, n }) {
  const list = ctx.combos.slice(1, 3);
  const cw = (W - 2 * MX - 30) / 2;
  return h(
    Frame,
    { ctx, n, ki: true, credits: list.flatMap((c) => c.items.map((i) => i.brand)) },
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT },
      ...list.map((c, i) => box({ width: cw, marginLeft: i ? 30 : 0 }, h(ComboGroup, { items: c.items, width: cw, maxH: 330 }), h(ComboText, { c, i: i + 1, ctx })))
    )
  );
}

function LightPage({ ctx, n }) {
  // QA Runde 3, P2.4: own lamp → a lamp of the selection (with its page) →
  // a scene with light → dark block with a material photo (last resort)
  const L = ctx.light || {};
  const lamp = L.item || null;
  const pw = 300;
  const ph = Math.round(pw * 1.25);
  const credit = L.mode === "scene" ? `Bild: ${L.scene.credit}.` : L.mode === "dark" && L.img ? ctx.images.materialCreditShort : null;
  return h(
    Frame,
    { ctx, n, ki: true, credits: lamp ? [lamp.brand] : [], creditText: credit, id: "licht", bookmark: "Licht" },
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT },
      box(
        { flex: 1, paddingRight: 36 },
        h(Header, { overline: "Licht", title: "Licht in drei Schichten", width: 420 }),
        tx([T.body, { fontSize: 10.8, marginTop: GAP_AFTER_TITLE }], ctx.content.light),
        box(
          { marginTop: 16 },
          ...LIGHT_LAYERS.map(([t, d], i) =>
            box(
              { flexDirection: "row", paddingVertical: 9, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
              tx([T.small, { width: 26, color: C.brass700, fontWeight: 500 }], pad2(i + 1)),
              box({ flex: 1 }, tx(T.label, t), tx([T.body, { marginTop: 2 }], d))
            )
          )
        ),
        tx([T.small, { marginTop: 10 }], "Kelvin-Angaben sind Richtwerte. Elektroplanung und Anschlüsse stimmen wir mit Ihrer Elektrofachkraft ab.")
      ),
      box(
        { width: pw },
        lamp
          ? [
              h(Pic, { key: "i", img: lamp.img, item: lamp, width: pw, height: ph - 60 }),
              h(ProductCaption, { key: "c", item: lamp, qrSize: 36, width: pw }),
              L.mode === "reuse" ? tx([T.small, { marginTop: 4 }], `Aus Ihrer Auswahl: ${ROOM_META[lamp.room]?.title || ""}, Seite ${lamp.page}`) : null,
            ]
          : L.mode === "scene"
            ? [h(Pic, { key: "s", img: L.scene.img, width: pw, height: ph - 20, kind: "cover" }), tx([T.small, { key: "t", marginTop: 8 }], "Raumstimmung: Licht als Teil der Einrichtung.")]
            : box(
                { width: pw, height: ph - 20, backgroundColor: C.inkDeep },
                L.img ? h(Pic, { img: L.img, width: pw, height: ph - 110, kind: "cover" }) : null,
                box({ flex: 1, justifyContent: "flex-end", padding: 20 }, tx([T.italic, { color: C.paper }], "Licht macht aus einem Raum einen Ort."))
              )
      )
    )
  );
}

// P3.4: lists with a detail picture band, so the page closes calmly.
function ListPage({ ctx, n, overline, title, intro, rows, ki = true, img, id, bookmark }) {
  const half = Math.ceil(rows.length / 2);
  const col = (list, offset) =>
    box(
      { flex: 1, marginLeft: offset ? 30 : 0 },
      ...list.map(([t, d], i) =>
        box(
          { flexDirection: "row", paddingVertical: 9, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
          tx([T.small, { width: 26, color: C.brass700, fontWeight: 500 }], pad2(i + 1 + offset)),
          box({ flex: 1 }, tx(T.label, t), tx([T.body, { marginTop: 3, fontSize: 9.4 }], d))
        )
      )
    );
  const bandH = 96;
  return h(
    Frame,
    { ctx, n, ki, creditText: img ? ctx.images.materialCreditShort : null, id, bookmark },
    box(
      { paddingHorizontal: MX, paddingTop: MT },
      h(Header, { overline, title, sub: intro, width: 560 }),
      box({ flexDirection: "row", marginTop: 18 }, col(rows.slice(0, half), 0), col(rows.slice(half), half))
    ),
    img ? box({ position: "absolute", left: MX, right: MX, bottom: 52, height: bandH }, h(Pic, { img, width: W - 2 * MX, height: bandH, kind: "cover" })) : null
  );
}

// P2.5: dark divider with a bleed showroom photo, no hairline, text on the grid.
function DarkDivider({ ctx, n }) {
  const img = ctx.images.showroomDark;
  return h(
    Frame,
    { ctx, n, dark: true, creditText: img ? `Bild: ${ctx.images.showroomDarkCredit}.` : null, id: "showroom", bookmark: "Showroom & Café" },
    img ? box({ position: "absolute", left: 0, top: 0, width: W, height: H }, h(Pic, { img, width: W, height: H, kind: "cover" })) : null,
    box({ position: "absolute", left: 0, top: 0, width: W, height: H, backgroundColor: C.walnut, opacity: img ? 0.6 : 1 }),
    box(
      { paddingLeft: MX, paddingTop: 150 },
      tx([T.overline, { color: C.brass400 }], "Showroom & Café · Lochau am Bodensee"),
      tx([T.display, { color: C.paper, fontSize: 64, marginTop: 16 }], "Nehmen Sie Platz."),
      tx([T.italic, { color: C.stone, marginTop: GAP_AFTER_TITLE, fontSize: 18 }], "Erst ein Kaffee. Dann das Sofa."),
      box({ marginTop: 56 }, h(Monogram, { height: 44, color: C.brass400 }))
    )
  );
}

function ShowroomPage({ ctx, n }) {
  const f = ctx.facts;
  return h(
    Frame,
    { ctx, n, dark: true, creditText: ctx.images.showroom ? `Bild: ${ctx.images.showroomCredit}.` : null },
    box(
      { flexDirection: "row", paddingLeft: MX, paddingTop: MT, height: H - 70 },
      box(
        { flex: 1, paddingRight: 40 },
        tx([T.overline, { color: C.brass400 }], "Showroom & Café"),
        tx([T.h2, { color: C.paper, marginTop: 10 }], "Ihr Stil, zum Anfassen."),
        tx([T.body, { color: C.stoneDeep, fontSize: 11, marginTop: GAP_AFTER_TITLE }], "Ausstellung und Café liegen im selben Haus. Bringen Sie diese Präsentation mit: So beginnen wir bei Ihrem Profil statt bei null. Probesitzen, Bezüge vergleichen, Muster mitnehmen – in Ruhe und ohne Eile."),
        box(
          { marginTop: 22, flexDirection: "row" },
          box(
            { flex: 1 },
            tx([T.overline, { color: C.brass400 }], "Öffnungszeiten Showroom"),
            ...f.hours.map(([d, t]) =>
              box({ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.6, borderBottomColor: "#5a4a40" }, tx([T.body, { color: C.stoneDeep }], d), tx([T.body, { color: C.paper }], t))
            ),
            tx([T.small, { color: C.stoneDeep, marginTop: 6 }], "Außerhalb der Öffnungszeiten nach Vereinbarung.")
          ),
          box(
            { flex: 1, paddingLeft: 26 },
            tx([T.overline, { color: C.brass400 }], "Adresse"),
            tx([T.body, { color: C.paper, marginTop: 6 }], "Platzhirsch Home Living"),
            tx([T.body, { color: C.paper }], f.street),
            tx([T.body, { color: C.paper }], `${f.postalCode} ${f.city}, ${f.region}`),
            link(f.phoneHref, [T.body, { color: C.stoneDeep, marginTop: 8, textDecoration: "underline" }], f.phone),
            link(f.emailHref, [T.body, { color: C.stoneDeep, textDecoration: "underline" }], f.email)
          )
        )
      ),
      box(
        { width: 360 },
        ctx.images.showroom ? h(Pic, { img: ctx.images.showroom, width: 360, height: H - MT, kind: "cover" }) : box({ width: 360, height: H - MT, backgroundColor: C.inkDeep })
      )
    )
  );
}

// Abnahme Runde 3, P3.1: the lower half of the page was empty since round 1.
// Now three steps (how the appointment works) and a band with the profile's
// four material photos close the page.
export const TERMIN_STEPS = [
  ["Termin anfragen", "Über den QR-Code, per Telefon oder E-Mail – im Studio in Lochau oder per Video."],
  ["Gespräch im Studio", "Wir beginnen bei Ihrem Profil: Probesitzen, Bezüge vergleichen, Muster ansehen."],
  ["Weiterplanen", "Mit Grundriss, Maßen und Ihrer Auswahl wird aus dem Moodboard Schritt für Schritt ein Plan."],
];
function NextStep({ ctx, n }) {
  const f = ctx.facts;
  const mats = ["holz", "stein", "textil", "metall"].map((k) => ctx.images.materials?.[k]).filter(Boolean);
  const bandH = 92;
  const bandW = (W - 2 * MX - (mats.length - 1) * 6) / Math.max(1, mats.length);
  return h(
    Frame,
    { ctx, n, id: "termin", bookmark: "Nächster Schritt: Termin", creditText: mats.length ? ctx.images.materialCreditShort : null },
    box(
      { position: "absolute", left: MX, right: MX, top: 368, flexDirection: "row" },
      ...TERMIN_STEPS.map(([t, d], i) =>
        box(
          { flex: 1, marginLeft: i ? 24 : 0, paddingTop: 10, borderTopWidth: 0.6, borderTopColor: C.stoneDeep },
          box({ flexDirection: "row" }, tx([T.small, { width: 24, color: C.brass700, fontWeight: 500 }], pad2(i + 1)), tx(T.label, t)),
          tx([T.body, { marginTop: 4, marginLeft: 24, fontSize: 9.4, color: C.inkSoft }], i === 2 && ctx.planningPage ? `${d} Was Sie mitbringen, steht auf Seite ${ctx.planningPage}.` : d)
        )
      )
    ),
    mats.length
      ? box(
          { position: "absolute", left: MX, right: MX, bottom: 52, height: bandH, flexDirection: "row" },
          ...mats.map((m, i) =>
            box(
              { key: m.key, width: bandW, height: bandH, marginLeft: i ? 6 : 0 },
              h(Pic, { img: m, width: bandW, height: bandH, kind: "cover" }),
              box({ position: "absolute", left: 8, bottom: 8, backgroundColor: C.paper, paddingHorizontal: 7, paddingVertical: 3 }, tx([T.small, { fontSize: 6.8, color: C.ink, fontWeight: 500 }], m.label))
            )
          )
        )
      : null,
    box(
      { flexDirection: "row", paddingHorizontal: MX, paddingTop: MT + 20 },
      box(
        { flex: 1, paddingRight: 50 },
        tx(T.overline, "Nächster Schritt"),
        tx([T.display, { fontSize: 44, marginTop: 12 }], "Lassen Sie uns gemeinsam weiterplanen."),
        tx([T.lead, { marginTop: GAP_AFTER_TITLE, color: C.inkSoft }], `Wählen Sie einen Termin im Studio in Lochau, per Video oder rufen Sie uns an. Wir beginnen direkt bei „${ctx.profile.name}“.`),
        box(
          { marginTop: 26, flexDirection: "row" },
          box({ flex: 1 }, tx([T.overline, { color: C.inkSoft }], "Telefon"), link(f.phoneHref, [T.label, { marginTop: 4, fontSize: 12, textDecoration: "underline" }], f.phone)),
          box({ flex: 1.3 }, tx([T.overline, { color: C.inkSoft }], "E-Mail"), link(f.emailHref, [T.label, { marginTop: 4, fontSize: 12, textDecoration: "underline" }], f.email)),
          box({ flex: 1.3 }, tx([T.overline, { color: C.inkSoft }], "Adresse"), tx([T.label, { marginTop: 4, fontSize: 12 }], `${f.street}, ${f.postalCode} ${f.city}`))
        )
      ),
      box(
        { width: 230, alignItems: "center", backgroundColor: C.bone, paddingVertical: 28, paddingHorizontal: 20 },
        tx([T.overline, { textAlign: "center" }], "Termin anfragen"),
        box({ marginTop: 16 }, h(Qr, { png: ctx.qr.termin, size: 140 })),
        link(ctx.links.termin, [T.small, { marginTop: 14, color: C.ink, textAlign: "center", textDecoration: "underline" }], ctx.links.terminLabel),
        tx([T.small, { marginTop: 8, textAlign: "center" }], "QR-Code mit der Handykamera scannen.")
      )
    )
  );
}

// P2.4: privacy wording = form = mail (marked for the lawyer in the feature doc).
export const PRIVACY_PDF =
  "Sie haben diese Präsentation über den Stil-Finder angefordert. Ihre Angaben verwenden wir nur für diesen Versand und speichern sie danach nicht. Einen Newsletter erhalten Sie nur, wenn Sie ihn gesondert bestellt und per Link bestätigt haben.";

// pdf-lead fix-05: name the unaltered brands only when they are in this PDF
// (the sentence said "Bilder von Minotti unverändert" in every profile).
export function imageTreatment(protectedBrands = []) {
  const rest = "Freisteller auf den Papierton gebracht, Szenen im Rahmen beschnitten.";
  return protectedBrands.length ? `Bilder von ${protectedBrands.join(", ")} unverändert; andere ${rest}` : `${rest[0].toUpperCase()}${rest.slice(1)}`;
}

function Notes({ ctx, n }) {
  const f = ctx.facts;
  const credits = ctx.allCredits;
  const nt = [T.body, { fontSize: 8.4, marginTop: 4 }];
  // QA Runde 3, P1.1: picture credits as collective lines (no file names, they
  // live in meta.json), the KI block in the middle column under privacy, so
  // no column reaches the footer.
  return h(
    Frame,
    { ctx, n, id: "hinweise", bookmark: "Hinweise und Impressum" },
    box(
      { paddingHorizontal: MX, paddingTop: MT },
      h(Header, { overline: "Hinweise", title: "Bildnachweis, KI und Datenschutz", width: 620 }),
      box(
        { flexDirection: "row", marginTop: 22 },
        box(
          { flex: 1, paddingRight: 22 },
          tx(T.label, "Bildnachweis"),
          tx(nt, `Produktabbildungen: ${credits.join(", ")}. Quelle: Platzhirsch-Online-Katalog (platzhirsch.studio), Abbildungen der jeweiligen Hersteller. ${imageTreatment(ctx.protectedBrands)}`),
          tx(nt, `Titelbild: ${ctx.images.heroCredit}. Showroom: ${ctx.images.showroomCredit}.`),
          ctx.extraCredits.length ? tx(nt, ctx.extraCredits.join(" ")) : null,
          tx(nt, ctx.images.materialCredit),
          ctx.labs ? tx([T.body, { fontSize: 8.4, marginTop: 6, color: C.brass700 }], "Labs-Prototyp: Bildrechte vor öffentlicher Nutzung klären.") : null
        ),
        box(
          { flex: 1, paddingHorizontal: 22, borderLeftWidth: 0.6, borderLeftColor: C.stoneDeep },
          tx(T.label, "Datenschutz"),
          tx(nt, PRIVACY_PDF),
          // pdf-lead fix-02: only when the mail really went to the test postbox
          // (was tied to the image-rights flag, so a sent PDF claimed "not sent")
          ctx.delivery !== "live" ? tx(nt, "Testbetrieb (Labs): Statt eines Versands liegt die Mail bis zu 7 Tage in einem internen Testpostfach und wird dann gelöscht.") : null,
          tx(nt, "Die QR-Codes enthalten nur Links auf platzhirsch.studio, ohne Nachverfolgung."),
          link(f.datenschutz, [T.body, { fontSize: 8.4, marginTop: 4, textDecoration: "underline" }], "platzhirsch.studio/de/datenschutz"),
          tx([T.label, { marginTop: 12 }], "Kennzeichnung KI-Inhalte"),
          tx(nt, KI_NOTE),
          tx(nt, `Seiten mit solchen Texten tragen unten den Vermerk „${KI_SHORT}“. Bilder, Produktdaten und die Auswertung Ihrer Antworten stammen nicht aus KI.`)
        ),
        box(
          { flex: 1, paddingLeft: 22, borderLeftWidth: 0.6, borderLeftColor: C.stoneDeep },
          tx(T.label, "Impressum"),
          tx(nt, `Platzhirsch Home Living · ${f.legalName}`),
          tx([T.body, { fontSize: 8.4 }], `${f.street}, ${f.postalCode} ${f.city}, ${f.country}`),
          box(
            { flexDirection: "row" },
            link(f.phoneHref, [T.body, { fontSize: 8.4, textDecoration: "underline" }], f.phone),
            tx([T.body, { fontSize: 8.4 }], " · "),
            link(f.emailHref, [T.body, { fontSize: 8.4, textDecoration: "underline" }], f.email)
          ),
          link(f.impressum, [T.body, { fontSize: 8.4, marginTop: 4, textDecoration: "underline" }], "Vollständiges Impressum: platzhirsch.studio/de/impressum"),
          tx([T.label, { marginTop: 12 }], "Unverbindlich"),
          tx(nt, "Diese Präsentation ist eine Anregung. Sie enthält keine Preise und kein Angebot. Ausführungen, Maße, Verfügbarkeit und Lieferzeiten klären wir pro Stück. Farbtöne können abweichen."),
          tx([T.small, { marginTop: 10 }], `Erstellt am ${ctx.dateLabel} · Profil ${ctx.profile.name} · Fonts: Bodoni Moda, Instrument Sans (SIL OFL 1.1)`)
        )
      )
    )
  );
}

function BackCover({ ctx, n }) {
  const f = ctx.facts;
  return h(
    Frame,
    { ctx, n, bare: true, bg: C.stone },
    box(
      { height: H, alignItems: "center", justifyContent: "center" },
      h(Monogram, { height: 54 }),
      box({ marginTop: 26 }, h(Wordmark, { width: 230 })),
      box({ marginTop: 8 }, h(Tagline, { width: 180, color: C.inkSoft })),
      box({ marginTop: 34 }, h(PaletteStrip, { palette: ctx.profile.palette, height: 4, width: 160 })),
      box(
        { marginTop: 30, flexDirection: "row" },
        // P3.6: non-breaking spaces, react-pdf drops plain ones at text-node edges
        tx([T.small], `${f.street} · ${f.postalCode} ${f.city} · `),
        link(f.phoneHref, [T.small], f.phone),
        tx([T.small], " · "),
        link("https://platzhirsch.studio", [T.small], "platzhirsch.studio")
      )
    )
  );
}

// ---------- assembling ----------
/** Picks the collage pictures: room heroes first, croppable before protected. */
function moodboardPictures(input) {
  const pool = ROOM_ORDER.flatMap((r) => (input.rooms[r] || []).map((it, i) => ({ it, rank: i }))).filter(({ it }) => it.img);
  pool.sort((a, b) => a.rank - b.rank || Number(a.it.protected) - Number(b.it.protected));
  const seen = new Set();
  const picks = [];
  for (const { it } of pool) {
    if (picks.length >= 4) break;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    picks.push({ img: it.img, item: it });
  }
  const mats = input.images.materials || {};
  const mat = (k) => (mats[k] ? { img: mats[k], kind: "cover" } : null);
  // QA Runde 3, P3.4: the two tall tiles (p1, p4) take scenes or cut-outs
  // that fill their picture; small cut-outs go to the low tiles
  const full = (p) => (!p.img.cutout ? 1 : (p.img.fill ?? p.img.stats?.coverage ?? 0));
  const byFill = [...picks].sort((a, b) => full(b) - full(a));
  const [t1, t2, ...low] = byFill;
  return {
    hero: input.images.hero ? { img: input.images.hero, kind: "cover" } : picks[0] || null,
    p1: t1 || null,
    p2: low[0] || null,
    p3: low[1] || null,
    p4: t2 || t1 || null,
    mat1: mat("holz"),
    mat2: mat("textil"),
    mat3: mat("stein"),
    brands: [...new Set(picks.map((p) => p.item.brand))],
  };
}

function introPicture(input, exclude = new Set()) {
  // QA Runde 2, P1.2 b: a fixed archive picture per profile, used nowhere else
  if (input.images.intro?.img) return { img: input.images.intro.img, item: null, credit: input.images.intro.credit };
  const scene = (it) => it.img && !it.img.cutout && !it.protected && it.category !== "rugs" && !exclude.has(it.id);
  // a room hero that is not the first room (the moodboard shows those)
  for (const r of ["kueche", "essen", "schlafen", "wohnen", "outdoor"]) {
    const it = input.rooms[r]?.[0];
    if (it && scene(it)) return { img: it.img, item: it };
  }
  for (const r of ROOM_ORDER) for (const it of input.rooms[r] || []) if (scene(it)) return { img: it.img, item: it };
  for (const r of ROOM_ORDER) for (const it of input.rooms[r] || []) if (it.img && !it.img.cutout && !it.protected) return { img: it.img, item: it };
  const m = input.images.materials?.textil;
  return m ? { img: m, item: null, credit: input.images.materialCreditShort } : null;
}

/**
 * One collective line for the archive pictures (QA Runde 3, P1.1): the pages
 * instead of the file names, e.g. "Raumszenen S. 3, 14, 16, 22: …".
 */
export function archiveCreditLine(pages) {
  const list = [...new Set(pages)].filter(Boolean).sort((a, b) => a - b);
  if (!list.length) return null;
  return `Einleitungsbild und Raumszenen S. ${list.join(", ")}: Website-Archiv Platzhirsch, Herstellerbilder; Hersteller vor öffentlicher Nutzung bestätigen.`;
}

/** "Nussbaum poliert, Marmor mit Zeichnung, Samt Bordeaux und Messing" from the profile's material photos. */
function materialLine(materials) {
  const names = ["holz", "stein", "textil", "metall"].map((k) => materials?.[k]?.label).filter(Boolean);
  if (!names.length) return null;
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} und ${names.at(-1)}.` : `${names[0]}.`;
}

/**
 * Builds the page plan (also used for the table of contents and the page
 * count) and returns the <Document>.
 */
export function buildDocument(input) {
  registerFonts();
  input.images = { materialCreditShort: "Materialfoto: ambientCG.com (CC0).", ...input.images };
  const plan = [];
  const add = (key, render, toc, id) => plan.push({ key, render, toc, id });
  add("cover", (c, n) => h(Cover, { ctx: c, n }));
  add("contents", (c, n) => h(Contents, { ctx: c, n }));
  add("intro", (c, n) => h(Editorial, { ctx: c, n }), "Einleitung", "einleitung");
  add("analysis", (c, n) => h(Analysis, { ctx: c, n }), "Stilprofil-Analyse", "analyse");
  add("mood-a", (c, n) => h(MoodboardA, { ctx: c, n }), "Ihr Moodboard", "moodboard");
  add("mood-b", (c, n) => h(MoodboardB, { ctx: c, n }));
  add("palette", (c, n) => h(PalettePage, { ctx: c, n }), "Farbpalette mit Farbcodes", "palette");
  add("coloruse", (c, n) => h(ColorUse, { ctx: c, n }));
  ["holz", "stein", "textil", "metall"].forEach((k, i) =>
    add(`mat-${k}`, (c, n) => h(MaterialPage, { ctx: c, n, k, index: i }), i === 0 ? "Materialwelt: Holz, Stein, Textil, Metall" : null, i === 0 ? "material" : null)
  );
  add("rooms", (c, n) => h(RoomsDivider, { ctx: c, n }), "Raum für Raum: Wohnen, Essen, Küche, Schlafen, Outdoor", "raeume");
  ROOM_ORDER.forEach((r, i) => {
    add(`room-${r}`, (c, n) => h(RoomLead, { ctx: c, n, room: r, idx: i }));
    add(`room-${r}-p`, (c, n) => h(RoomProducts, { ctx: c, n, room: r }));
  });
  add("combos-a", (c, n) => h(CombosA, { ctx: c, n }), "Kombinationsvorschläge", "kombinationen");
  add("combos-b", (c, n) => h(CombosB, { ctx: c, n }));
  add("light", (c, n) => h(LightPage, { ctx: c, n }), "Licht", "licht");
  add("care", (c, n) => h(ListPage, { ctx: c, n, overline: "Pflege", title: "Damit es schön bleibt", intro: "Allgemeine Hinweise. Für jedes Stück gilt die Pflegeanleitung des Herstellers, die wir Ihnen mitgeben.", rows: CARE, img: c.images.materials?.stein, id: "pflege", bookmark: "Pflege und Planung" }), "Pflege- und Planungs-Tipps", "pflege");
  add("planning", (c, n) => h(ListPage, { ctx: c, n, overline: "Planung", title: "Gut vorbereitet zum Termin", intro: "Je mehr wir vorher wissen, desto konkreter wird das erste Gespräch.", rows: PLANNING, img: c.images.materials?.holz }));
  add("dark", (c, n) => h(DarkDivider, { ctx: c, n }), "Showroom & Café", "showroom");
  add("showroom", (c, n) => h(ShowroomPage, { ctx: c, n }));
  add("next", (c, n) => h(NextStep, { ctx: c, n }), "Nächster Schritt: Termin", "termin");
  add("notes", (c, n) => h(Notes, { ctx: c, n }), "Bildnachweis, KI-Hinweis, Datenschutz, Impressum", "hinweise");
  add("back", (c, n) => h(BackCover, { ctx: c, n }));

  const pageOf = (key) => plan.findIndex((p) => p.key === key) + 1;
  const roomItems = Object.values(input.rooms).flat();
  const allCredits = [...new Set([...roomItems, ...(input.lamp ? [input.lamp] : [])].map((i) => i.brand))];
  const roomPages = Object.fromEntries(ROOM_ORDER.map((r) => [r, pageOf(`room-${r}`)]));
  // lead layout per room (QA Runde 3, P2.1/P2.2): a scene behind every
  // cut-out hero – the profile's room scene, else a scene of the selection
  const leads = Object.fromEntries(
    ROOM_ORDER.map((r) => {
      const list = input.rooms[r] || [];
      let sc = input.images.roomScenes?.[r] || null;
      if (!sc?.img) {
        const other = list.slice(1).find((it) => it.img && !it.img.cutout && !it.protected);
        sc = other ? { img: other.img, credit: `${other.brand}, ${other.name} (Herstellerbild)`, item: other } : null;
      }
      return [r, leadLayout(list[0], sc)];
    })
  );
  // rooms carry their key and their actual page, for the combo references
  // (QA Runde 2, P2.1: the hero stands on the lead page, the others one later)
  for (const r of ROOM_ORDER)
    (input.rooms[r] || []).forEach((it, i) => {
      it.room = r;
      it.page = i === 0 && leads[r].mode !== "scene-only" ? roomPages[r] : roomPages[r] + 1;
    });
  // light page (QA Runde 3, P2.4)
  // Feinschliff P3.1: a reused room lamp should fit the light text of the profile
  const roomLamps = ROOM_ORDER.flatMap((r) => input.rooms[r] || []).filter((it) => it.category === "lamps" && it.img);
  const roomLamp = roomLamps.find((it) => lightFits(input.profile?.key, it)) || roomLamps[0];
  const light = input.lamp?.img
    ? { mode: "own", item: input.lamp }
    : roomLamp
      ? { mode: "reuse", item: roomLamp }
      : input.images.lightScene?.img
        ? { mode: "scene", scene: input.images.lightScene }
        : { mode: "dark", img: input.images.materials?.metall || null };
  // archive pictures: pages for the collective credit line, files for meta.json
  const archive = [];
  if (input.images.intro?.img) archive.push({ page: pageOf("intro"), file: input.images.intro.file, use: "Einleitung" });
  for (const r of ROOM_ORDER) {
    const L = leads[r];
    if ((L.mode === "inset" || L.mode === "scene-only") && L.scene?.file) archive.push({ page: roomPages[r], file: L.scene.file, use: `Raumszene ${ROOM_META[r].title}` });
  }
  if (light.mode === "scene") archive.push({ page: pageOf("light"), file: light.scene.file, use: "Licht" });
  const pick = (ref) => {
    const [room, idx] = ref.split(":");
    return input.rooms[room]?.[Number(idx)] || null;
  };
  // the large tile of each combination gets a room scene, not a cut-out
  // Abnahme Runde 3, P3.2: a rug scene is a texture, not a room – it leads only
  // when there is no other scene (the large tile now fills half the page)
  const sceneFirst = (items) => {
    const scene = (it) => it.img && !it.img.cutout;
    const order = [(it) => scene(it) && !it.protected && it.category !== "rugs", (it) => scene(it) && it.category !== "rugs", scene];
    let j = -1;
    for (const test of order) if (j < 0) j = items.findIndex(test);
    return j > 0 ? [items[j], ...items.filter((_, k) => k !== j)] : items;
  };
  const combos = (input.content.combos || []).map(([title, text, refs]) => ({ title, text, items: sceneFirst(refs.map(pick).filter(Boolean)) }));
  const mood = moodboardPictures(input);
  const ctx = {
    ...input,
    total: plan.length,
    notesPage: pageOf("notes"),
    planningPage: pageOf("planning"),
    roomPages,
    combos,
    mood,
    // P2.2: the Labs sentence is added once (Frame or the moodboard caption)
    moodCredit: `Bilder: ${[mood.hero && input.images.hero ? "Titelbild siehe Hinweise" : null, ...mood.brands].filter(Boolean).join(", ")}; Materialfotos ambientCG.com (CC0).`,
    materialLine: materialLine(input.images.materials),
    extraCredits: [archiveCreditLine(archive.map((a) => a.page))].filter(Boolean),
    leads,
    light,
    introPic: introPicture(input, new Set([mood.p1, mood.p2, mood.p3, mood.p4].filter((p) => p?.item).map((p) => p.item.id))),
    personal: personalLine(input.customer, { roomsPage: roomPages.wohnen, planningPage: pageOf("planning") }),
    toc: plan.map((p, i) => (p.toc ? { title: p.toc, page: i + 1, id: p.id } : null)).filter(Boolean),
    allCredits,
    protectedBrands: [...new Set([...roomItems, ...(input.lamp ? [input.lamp] : [])].filter((i) => i.protected && i.img).map((i) => i.brand))],
    footerLine: input.customer.name ? `Moodboard für ${input.customer.name} · ${input.profile.name}` : `Moodboard · ${input.profile.name}`,
  };
  const doc = h(
    Document,
    {
      title: `Moodboard ${input.profile.name} – Platzhirsch Home Living`,
      author: "Platzhirsch Home Living",
      subject: `Persönliches Stilprofil „${input.profile.name}“ aus dem Stil-Finder`,
      keywords: "Moodboard, Stil-Finder, Einrichtung, Lochau, Bodensee",
      creator: input.labs === false ? "Platzhirsch Stil-Finder" : "Platzhirsch Stil-Finder (Labs)",
      producer: "Platzhirsch Stil-Finder",
      language: "de-AT",
      pageMode: "useOutlines",
    },
    ...plan.map((p, i) => p.render(ctx, i + 1))
  );
  return {
    doc,
    pages: plan.length,
    plan: plan.map((p) => p.key),
    combos,
    layout: {
      leads: Object.fromEntries(Object.entries(leads).map(([r, L]) => [r, { mode: L.mode, coverage: L.coverage ?? null, scene: L.scene?.file || null, page: roomPages[r] }])),
      light: { mode: light.mode, item: light.item?.name || null },
      imageFiles: [
        { use: "Titelbild", file: input.profile.hero?.src || null, credit: input.images.heroCredit },
        ...archive,
      ],
    },
  };
}
