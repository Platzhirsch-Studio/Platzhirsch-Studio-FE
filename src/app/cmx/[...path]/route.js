import { NextResponse } from "next/server";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";

// File proxy for the new "Produkte New" backend (NEW_API_SERVER): the site
// links to /cmx/files/<name> and this route fetches <NEW_API_SERVER>/files/<name>,
// so the backend's address never reaches the browser.
//
// Deliberately a catch-all route, not a next.config.js rewrite: a plain
// rewrites() entry pointing straight at NEW_API_SERVER hangs ~20s then 500s
// on every real file (a bug in Next's external-rewrite proxying, not the
// backend), and a rewrite into this route via a query string didn't
// interpolate the catch-all segment. fetch() from a route handler works.
//
// Only public uploads are served: the path must start with files/ and end in
// an image, video or PDF extension. Anything else (/cmx/api/…, /cmx/app, …)
// is a 404 — this is not a general proxy to the backend.
//
// The type is decided by the file extension, not the backend's Content-Type:
// the backend (Werkzeug dev server) sends every file as
// application/octet-stream, even .webp images.
const TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  pdf: "application/pdf",
};
const TIMEOUT_MS = 15000;

const notFound = () => new NextResponse("Not found", { status: 404 });

export async function GET(req, { params }) {
  const { path } = await params;

  // Only /cmx/files/…, no empty / "." / ".." segments and no backslashes.
  if (
    !Array.isArray(path) ||
    path.length < 2 ||
    path[0] !== "files" ||
    path.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))
  ) {
    return notFound();
  }

  const extension = path[path.length - 1].split(".").pop().toLowerCase();
  const contentType = TYPES[extension];
  if (!contentType) return notFound();

  // Segments arrive decoded (file names often contain spaces); re-encode each.
  const externalUrl = `${NEW_API_SERVER}/${path.map(encodeURIComponent).join("/")}`;

  let response;
  try {
    response = await fetch(externalUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    console.error("cmx proxy: backend not reachable:", error);
    return new NextResponse("Bad gateway", { status: 502 });
  }

  if (!response.ok) {
    response.body?.cancel();
    return notFound();
  }

  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  // An SVG opened directly could run scripts on our domain — sandbox it.
  if (extension === "svg") headers["Content-Security-Policy"] = "sandbox";

  // Stream the file through instead of buffering it in memory. No
  // Content-Length: fetch() may already have decompressed the body, so the
  // backend's length wouldn't match.
  return new NextResponse(response.body, { status: 200, headers });
}
