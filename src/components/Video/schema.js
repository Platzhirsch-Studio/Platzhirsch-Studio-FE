// src/components/Video/schema.js — pure helpers for InlineVideo and
// YouTubeFacade (R5-content, Masterplan AP7 Nr. 5, Bericht 12 C5).
// No "@/" imports, no React: unit-tested with node --test
// (tests/unit/r5-content.test.mjs).

const ISO_DURATION = /^P(?!$)(?:\d+D)?(?:T(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?)?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/;

/** Absolute URL for schema.org (relative paths are resolved against siteUrl). */
export function absoluteUrl(src, siteUrl) {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  if (!siteUrl) return undefined;
  return `${siteUrl.replace(/\/$/, "")}/${String(src).replace(/^\//, "")}`;
}

/**
 * schema.org VideoObject, or null when a required field is missing.
 * Google requires name, thumbnailUrl and uploadDate; description, duration
 * (ISO 8601, e.g. "PT1M5S") and contentUrl/embedUrl are recommended.
 * We never guess a value: no upload date → no schema.
 */
export function videoObjectSchema(video, { siteUrl } = {}) {
  if (!video) return null;
  const name = video.name?.trim();
  const thumbnailUrl = absoluteUrl(video.poster, siteUrl);
  const uploadDate = video.uploadDate;
  if (!name || !thumbnailUrl || !uploadDate || !ISO_DATE.test(uploadDate)) return null;
  if (video.duration && !ISO_DURATION.test(video.duration)) return null;
  const contentUrl = absoluteUrl(video.sources?.[0]?.src, siteUrl);
  const embedUrl = video.youTubeId && isYouTubeId(video.youTubeId) ? `https://www.youtube-nocookie.com/embed/${video.youTubeId}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    ...(video.description ? { description: video.description } : {}),
    thumbnailUrl,
    uploadDate,
    ...(video.duration ? { duration: video.duration } : {}),
    ...(contentUrl ? { contentUrl } : {}),
    ...(embedUrl ? { embedUrl } : {}),
    ...(video.inLanguage ? { inLanguage: video.inLanguage } : {}),
  };
}

/** YouTube video ids are 11 characters of [A-Za-z0-9_-]. */
export function isYouTubeId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);
}

/**
 * Embed URL on the privacy-enhanced host. `autoplay=1` is set because the
 * iframe only exists after the visitor clicked "play" (user-initiated).
 */
export function youTubeEmbedUrl(id, { start } = {}) {
  if (!isYouTubeId(id)) throw new Error(`Ungültige YouTube-ID: ${id}`);
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
  if (Number.isInteger(start) && start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** Media type for a <source> when none is given. */
export function sourceType(src) {
  const ext = String(src).split("?")[0].split(".").pop().toLowerCase();
  return { mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", ogv: "video/ogg" }[ext];
}

/**
 * Checks the props of InlineVideo. Returns a list of problems (empty = fine).
 * Accessibility rules (Design-Bibel §14): a poster, at least one caption
 * track, an accessible name; dimensions so the box is reserved (CLS).
 */
export function inlineVideoProblems({ sources, poster, tracks, title, width, height }) {
  const problems = [];
  if (!Array.isArray(sources) || !sources.length || sources.some((s) => !s?.src)) problems.push("sources fehlt");
  if (!poster) problems.push("poster fehlt");
  if (!title?.trim()) problems.push("title fehlt");
  const captions = (tracks || []).filter((t) => t?.src && (t.kind === "captions" || t.kind === "subtitles" || !t.kind));
  if (!captions.length) problems.push("Untertitelspur fehlt");
  if (captions.some((t) => !t.srcLang || !t.label)) problems.push("Untertitelspur ohne srcLang/label");
  if (!(width > 0 && height > 0)) problems.push("width/height fehlen");
  return problems;
}
