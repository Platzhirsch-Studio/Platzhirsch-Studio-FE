// src/components/Freigaben/data.server.js — collects what the Freigabe-Cockpit
// shows, by importing the owning modules. Read only: no write, no fetch, no
// form. The only file reads are the Ratgeber Markdown (the same files
// lib/ratgeber reads; the [prüfen] places are filtered out of the built
// article, so the raw text is needed to list them) and the source lines where
// a release is set technically. If a source file is missing (e.g. a deploy
// without src/), the cockpit shows the file name without a line.
import "server-only";
import { liveBlockers, shopMode, shopModeRequested } from "@/lib/shop/mode";
import fs from "node:fs";
import path from "node:path";
import { listRatgeber } from "@/lib/ratgeber";
import { parseFrontmatter } from "@/lib/ratgeber/frontmatter";
import { getProductCopyDraft } from "@/lib/productCopy/server";
import { START_LIST } from "@/lib/productCopy/startList";
import { imageOverrides } from "@/components/Landing/imagery";
import { LANDING_PAGE_SLUGS, landingPagePath } from "@/lib/content/landingPages";
import { DOCS, docCounts, legalPreviewEnabled } from "@/components/LegalDrafts";
import * as CH from "@/lib/ch/content";
import { listFreigegebeneProjekte } from "@/lib/content/projekte";
import { bookingConfig } from "@/components/Booking/config";
import { sendReleased } from "@/components/Labs/Kuechenplaner/release";
import { hasSessionSecret } from "@/lib/portal/config";
import { mailReady } from "@/lib/portal/mailer";
import {
  commerceStatus,
  imageRows,
  legalLiveStatus,
  legalRows,
  lineOf,
  linesOf,
  productCopyRows,
  ratgeberRows,
  schweizOpen,
  switchRows,
} from "./model";

const ROOT = process.cwd();
const RATGEBER_DIR = path.join(ROOT, "src", "content", "ratgeber");

// Landing pages with their own page files (not in LANDING_PAGES).
const EXTRA_LANDING = ["/yacht-interior", "/outdoor-gartenplanung", "/designermoebel-kempten", "/designermoebel-liechtenstein"];

// F5 (Runde 1): `rel` is one of the few fixed source paths below, read only
// for the line numbers in the (preview-only) cockpit. Turbopack cannot see
// that and traced the whole project (21 062 files) into the server output of
// every route that shares this module. turbopackIgnore keeps it out of the
// file tracing (build warning "Dynamic filesystem access", docs
// 05-config/01-next-config-js/output.md); a missing file yields null and the
// cockpit shows the file name without a line, as before.
function readSource(rel) {
  try {
    return fs.readFileSync(path.join(/*turbopackIgnore: true*/ ROOT, rel), "utf8");
  } catch {
    return null;
  }
}

function ratgeberSources() {
  let files = [];
  try {
    files = fs.readdirSync(RATGEBER_DIR).filter((f) => f.endsWith(".md")).sort();
  } catch {
    return [];
  }
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(RATGEBER_DIR, file), "utf8");
    const slug = parseFrontmatter(raw).data?.slug || file.replace(/\.md$/, "");
    return { file, slug, raw };
  });
}

/** "datei:zeile" (or just the file if the line was not found). */
function at(rel, pattern) {
  const line = lineOf(readSource(rel), pattern);
  return line ? `${rel}:${line}` : rel;
}

export function loadCockpit(env = process.env) {
  const ratgeber = ratgeberRows(listRatgeber(), ratgeberSources());
  const produkte = productCopyRows(getProductCopyDraft(), START_LIST);
  const bilder = imageRows([...LANDING_PAGE_SLUGS.map(landingPagePath), ...EXTRA_LANDING], imageOverrides);
  const recht = legalRows(DOCS, docCounts);
  const rechtLive = legalLiveStatus();
  const commerce = commerceStatus(env);
  const schweiz = schweizOpen(CH);
  const projekte = listFreigegebeneProjekte().length;

  const imagerySrc = readSource("src/components/Landing/imagery.js");
  const releasedLines = linesOf(imagerySrc, /released:\s*false/);

  const switches = switchRows({
    voucher: commerce.voucher,
    voucherRequested: commerce.voucherRequested,
    atelier: commerce.atelier,
    shop: { mode: shopMode(env), requested: shopModeRequested(env), open: liveBlockers(env).length },
    commercePreview: commerce.previewOn,
    legalPreview: legalPreviewEnabled(env),
    planerSenden: sendReleased(),
    booking: bookingConfig(env).provider,
    portalLogin: hasSessionSecret(),
    portalMail: mailReady(),
  });

  const where = {
    ratgeber: "src/content/ratgeber/<datei>.md",
    produkte: "node src/lib/productCopy/approve.mjs --key <kategorie/slug> --by \"Name\"",
    produkteData: "src/content/productCopy/de.json",
    produkteCheck: at("src/lib/productCopy/approvals.js", /^export function isEntryApproved/),
    bilder: releasedLines.length ? `src/components/Landing/imagery.js:${releasedLines.join(", ")}` : "src/components/Landing/imagery.js",
    gutscheinTerms: at("src/lib/commerce/voucherTerms.js", /^export const TERMS_STATUS/),
    voucherMode: at("src/lib/commerce/mode.js", /^export function voucherMode\(/),
    atelierMode: at("src/lib/commerce/mode.js", /^export function atelierMode\(/),
    schweizRobots: at("src/app/[locale]/einkaufen-aus-der-schweiz/page.js", /robots:\s*\{/),
    schweizContent: "src/lib/ch/content.js",
    projekte: at("src/lib/content/projekte.js", /^export const PROJEKTE\s*=/),
    recht: "src/components/LegalDrafts/docs/<dokument>.js (Kanzlei-Fassung) · Live-Seiten src/components/Datenschutz, src/components/Impressum",
    rechtLive: "src/components/LegalDrafts/liveStatus.js",
    impressumFields: at("src/components/Impressum/impressum.js", /^export const CHAMBER/),
    blattlinie: at("src/components/Impressum/impressum.js", /^export const BLATTLINIE/),
    gutscheinFields: at("src/lib/commerce/voucherTermsFields.js", /^export const TERMS_OWNER_FIELDS/),
  };

  return { ratgeber, produkte, bilder, recht, rechtLive, commerce, schweiz, projekte, switches, where, legalPreview: legalPreviewEnabled(env) };
}
