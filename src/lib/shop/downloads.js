// src/lib/shop/downloads.js
// Download list of the product page (R4-produkt, masterplan AP4).
// Pure module (no "@/"): loaded by node --test (tests/unit/r4-produkt.test.mjs).
// `tc` is the page's shop translator (keys atelier.download*).

// Manufacturer documents from the "pdf_produkte" child table, linked through
// the /cmx file proxy (nothing is copied or hosted here). Backoffice row shape
// (survey 26.10.2026, 520 of 1,765 products): { "2d": "/files/….pdf",
// "3d": null, "katalog": "/files/….pdf" } – each filled column is one
// document, labelled by its kind. Older/unknown row shapes: any string field
// holding a .pdf path counts, a title-ish field (titel/title/bezeichnung/
// beschreibung/name1) names it, else the file name. Only .pdf (the proxy
// serves nothing else).
const DOWNLOAD_KINDS = [
  ["2d", "download2d"],
  ["3d", "download3d"],
  ["katalog", "downloadKatalog"],
];
const PDF = /\.pdf(\?.*)?$/i;

function cmxHref(path) {
  const clean = path.trim();
  return /^https?:\/\//i.test(clean) ? clean : `/cmx${clean.startsWith("/") ? "" : "/"}${clean}`;
}

function fileNameOf(path) {
  let name = path.trim().split("/").pop() || "";
  try {
    name = decodeURIComponent(name);
  } catch {
    /* keep the raw name */
  }
  return name.replace(/\?.*$/, "");
}

// "ClassiCon katalog.pdf" → "ClassiCon" (the kind label already says
// "Katalog"); first letter upper-case, brand casing kept (QM P3-2).
const readableName = (fileName) => {
  const words = fileName.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const kept = words.filter((w) => !/^(katalog|catalog|catalogue|catalogo)$/i.test(w));
  const name = (kept.length ? kept : words).join(" ");
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export function extractDownloads(detail, tc) {
  const rows = Array.isArray(detail?.pdf_produkte) ? detail.pdf_produkte : [];
  const seen = new Set();
  const out = [];
  const push = (path, kindLabel, title) => {
    if (typeof path !== "string" || !PDF.test(path.trim())) return;
    const href = cmxHref(path);
    if (seen.has(href)) return;
    seen.add(href);
    const fileName = fileNameOf(path);
    out.push({ href, fileName, kindLabel, title: title || readableName(fileName) || "PDF" });
  };
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const kinds = DOWNLOAD_KINDS.filter(([col]) => col in row);
    if (kinds.length) {
      for (const [col, key] of kinds) push(row[col], tc(`atelier.${key}`));
      continue;
    }
    const path = Object.values(row).find((v) => typeof v === "string" && PDF.test(v.trim()));
    const titled = [row.titel, row.title, row.bezeichnung, row.beschreibung, row.name1].find(
      (v) => typeof v === "string" && v.trim() && !PDF.test(v.trim())
    );
    push(path, null, titled?.trim());
  }
  // Label: the kind ("Produktdatenblatt") when it is unique on the page, else
  // kind + file name ("Katalog: ClassiCon Brochure Eileen Gray Rug Collection").
  const kindCount = out.reduce((m, d) => m.set(d.kindLabel, (m.get(d.kindLabel) || 0) + 1), new Map());
  return out.map(({ href, fileName, kindLabel, title }) => {
    const name = !kindLabel ? title : kindCount.get(kindLabel) === 1 && kindLabel !== tc("atelier.downloadKatalog") ? kindLabel : `${kindLabel}: ${title}`;
    return { href, fileName, label: tc("atelier.downloadFile", { name }) };
  });
}
