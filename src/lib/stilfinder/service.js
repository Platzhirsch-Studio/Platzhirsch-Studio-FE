// src/lib/stilfinder/service.js
// Orchestrates one Moodboard request (server only):
//   validated request → profile + answers → catalogue (read only) → PDF →
//   mail (dev outbox, or the provider when explicitly enabled).
//
// Newsletter: the wish is only RECORDED (outbox meta, mail text). In Labs
// nothing goes to the backoffice – the live path would start the existing
// Double-Opt-in flow (Brevo, Rechtspaket 4.4) and is documented, not active.
//
// Storage: in production the PDF and the personal data are held in memory
// for the send only; nothing is written. In development the outbox keeps the
// mail for 7 days (outbox.js).
import "server-only";
import { cleanProductName, displayBrandName } from "@/lib/content/brands";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import { ownCalendarActive } from "@/components/Booking/config";
import { PROFILES, profileBySlug } from "@/components/Labs/Stilfinder/profiles";
import { QUESTIONS, isValidCode, scoreAnswers, seedFromCode } from "@/components/Labs/Stilfinder/questions";
import { IS_PRODUCTION, isLabsMode, mailMode } from "./config";
import { roomCandidates } from "./rooms";
import { ImageGateError, buildMoodboardPdf } from "./build";
import { catalogFor, loadImage, orderFinished, orderStarted, warmProfile } from "./warm";
import { renderInWorker } from "./pdfPool";
import { buildMoodboardMail, deliverMail, pdfFilename } from "./mail";
import { writeOutbox } from "./outbox";
import { PROJECT_TYPES, REGIONS, labelOf } from "./schema";

// Catalogue cache, shared image loader and the cache warm-up live in warm.js
// (light enough to be imported by the result page).
function personalResult(profile, code) {
  if (!code || !isValidCode(code)) return null;
  const scored = scoreAnswers(code);
  if (!scored || scored.primary !== profile.key) return null;
  return {
    shares: scored.shares
      .filter((s) => s.pct > 0)
      .map((s) => ({ name: PROFILES[s.key].name, pct: s.pct, color: PROFILES[s.key].palette[2].hex })),
    answers: QUESTIONS.map((q, i) => {
      const c = code[i];
      if (c === "x") return null;
      const opt = q.options[Number(c)];
      return { q: q.overline.replace(" · optional", ""), a: opt.sub ? `${opt.label} – ${opt.sub}` : opt.label };
    }).filter(Boolean),
  };
}

export class MoodboardError extends Error {
  constructor(code, status = 500) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/**
 * sendMoodboard(data) → { mode: "outbox"|"live", id?, pages, bytes, ms }
 * `data` = parsed moodboardRequestSchema.
 */
export async function sendMoodboard(data) {
  const profile = profileBySlug(data.profil);
  if (!profile) throw new MoodboardError("invalid_profile", 400);
  const mm = mailMode();
  if (IS_PRODUCTION && mm.mode !== "live") {
    // Production without configured delivery: never pretend a mail went out.
    console.error(`[stilfinder] Mailversand nicht aktiv (${mm.problems.join(", ") || "STILFINDER_MAIL_ENABLED/PROVIDER fehlt"})`);
    throw new MoodboardError("mail_unavailable", 503);
  }

  const labs = isLabsMode();
  orderStarted();
  try {
    return await buildAndSend({ data, profile, mm, labs });
  } finally {
    orderFinished();
  }
}

async function buildAndSend({ data, profile, mm, labs }) {
  const code = data.code && isValidCode(data.code) ? data.code : null;
  const tStart = Date.now();
  const tCatalog = Date.now();
  const { byBrand, cached } = await catalogFor(profile.key);
  const catalogMs = Date.now() - tCatalog;
  const roomRows = roomCandidates(profile.key, byBrand, seedFromCode(code || profile.slug));

  const customer = {
    name: data.name,
    projektLabel: labelOf(PROJECT_TYPES, data.projekt),
    regionLabel: labelOf(REGIONS, data.region),
  };
  // Display names are applied here (those helpers use @/ imports); the worker
  // gets plain, serialisable data only.
  const cleanRows = Object.fromEntries(
    Object.entries(roomRows).map(([room, list]) => [
      room,
      list.map((row) => ({ ...row, produkt_name: cleanProductName(row.produkt_name), marken: displayBrandName(row.marken) })),
    ])
  );
  const { img: _staticImport, ...hero } = profile.hero || {};
  const job = {
    profile: { ...profile, hero },
    customer,
    result: personalResult(profile, code),
    roomRows: cleanRows,
    labs,
    // pdf-lead fix-01: Termin hand-off like the result page (result link, /termin or /beratung)
    code,
    calendar: ownCalendarActive(),
    // pdf-lead fix-02: the PDF names the test postbox only when it is used
    delivery: mm.mode === "live" ? "live" : "outbox",
    server: NEW_API_SERVER,
    now: Date.now(),
    timings: { catalog: catalogMs, catalogCached: cached },
  };
  let pdf;
  let renderer = "worker";
  try {
    const tWorker = Date.now();
    pdf = await renderInWorker(job);
    pdf.timings = { ...pdf.timings, worker: Date.now() - tWorker, queueMs: pdf.queueMs, returnMs: pdf.returnMs, workerCold: pdf.workerCold, workerStartMs: pdf.workerStartMs };
  } catch (e) {
    if (String(e?.message).startsWith("image gate")) {
      // Bild-Tor (QA P1.1 c): no PDF with missing pictures – "busy", retry.
      warmProfile(profile.key);
      console.warn(`[stilfinder] ${e.message} (${profile.slug}) – 503, Kunde versucht es erneut`);
      throw new MoodboardError("busy", 503);
    }
    if (String(e?.message).includes("timeout")) throw e;
    // Worker could not start (e.g. file missing in an unusual deployment):
    // render inline – slower for other requests, but the customer gets the PDF.
    console.warn("[stilfinder] PDF-Worker nicht verfügbar, rendere im Hauptprozess:", e?.message || e);
    renderer = `inline (${String(e?.message || e).slice(0, 120)})`;
    try {
      pdf = await buildMoodboardPdf({ ...job, loadImage });
    } catch (err) {
      if (err instanceof ImageGateError) throw new MoodboardError("busy", 503);
      throw err;
    }
  }
  warmProfile(profile.key);
  const mail = buildMoodboardMail({ profile, name: data.name, newsletter: data.newsletter, labs, pages: pdf.pages, code, calendar: job.calendar });
  const filename = pdfFilename(profile);
  console.info(`[stilfinder] PDF ${profile.slug}: ${pdf.pages} Seiten, ${(pdf.bytes / 1024 / 1024).toFixed(1)} MB, ${pdf.ms} ms (Katalog ${catalogMs} ms${cached ? " Cache" : ""}, Bilder ${pdf.timings.images} ms, Worker ${pdf.timings.workerCold ? "kalt" : "warm"}, ${pdf.items.filter((i) => i.image).length}/${pdf.items.length})`);

  if (mm.mode === "live") {
    await deliverMail({ provider: mm.provider, to: data.email, mail, pdf: pdf.buffer, filename });
    return { mode: "live", pages: pdf.pages, bytes: pdf.bytes, ms: pdf.ms };
  }

  const { id } = await writeOutbox({
    pdf: pdf.buffer,
    mail,
    meta: {
      to: data.email,
      name: data.name,
      projekt: customer.projektLabel,
      region: customer.regionLabel,
      profile: profile.slug,
      code,
      newsletter: data.newsletter ? "angefragt – kein Eintrag, Anmeldelink in der Mail (kein Versand an das Backoffice)" : "nein",
      filename,
      pages: pdf.pages,
      bytes: pdf.bytes,
      ms: pdf.ms,
      timings: { ...pdf.timings, service: Date.now() - tStart },
      items: pdf.items,
      // QA Runde 3, P1.1: archive files of the scenes (not printed in the PDF)
      imageFiles: pdf.imageFiles,
      leads: pdf.leads,
      mailMode: mm.mode,
      renderer,
    },
  });
  return { mode: "outbox", id, pages: pdf.pages, bytes: pdf.bytes, ms: pdf.ms };
}
