import "server-only";
// Auslieferung von Dateien an den Browser (Download, Inline-Ansicht, Vorschaubild) – Q-A1: der Browser bekommt
// nie eine Frappe-Adresse. Frappe-Modus: `art = "direkt"` (vorsignierte S3-URL) → 302 dorthin; `art = "proxy"`
// (ph_ablage.api.herunterladen) → wir holen die Bytes mit der Sitzung des Mitarbeiters und reichen sie durch.
// Mock-Modus: Bytes aus dem Prozessspeicher (hochgeladen) bzw. Beispielinhalte (Bilder aus public/entwurf/lounge).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { DT } from "./labels";
import * as speicher from "./speicher";

const BILD_RE = /^\/entwurf\/lounge\/[a-z0-9-]+\.(jpg|jpeg|webp|png)$/;
const BILD_MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", png: "image/png" };

function disposition(dateiname, inline) {
  const name = String(dateiname || "datei").replace(/[\r\n"]/g, "_");
  const ascii = name.replace(/[^\x20-\x7e]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/** Nur Rasterbilder, PDF, Text, Video/Audio dürfen inline laufen – alles andere (z. B. SVG, XML) als Download. */
const INLINE_RE = /^(image\/(jpeg|png|webp|gif|avif|bmp)|application\/pdf|text\/plain|video\/|audio\/)/i;

function antwort(body, { mime, dateiname, inline, cache }) {
  const typ = mime || "application/octet-stream";
  const darfInline = inline && INLINE_RE.test(typ);
  const headers = {
    "Content-Type": typ,
    "Content-Disposition": disposition(dateiname, darfInline),
    "Cache-Control": cache || "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (/^text\//i.test(typ)) headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
  return new Response(body, { headers });
}

async function mockInhalt(client, schluessel) {
  const [datei, version] = String(schluessel).split(":");
  const blob = speicher.hole(`${datei}:${Number(version) || 1}`);
  if (blob) return { bytes: blob.bytes, mime: blob.mime };
  const d = client.tabelle(DT.datei).get(datei);
  if (!d) return null;
  if (d._mock_bild && BILD_RE.test(d._mock_bild)) {
    const bytes = await readFile(path.join(process.cwd(), "public", d._mock_bild));
    const end = d._mock_bild.split(".").pop();
    return { bytes, mime: BILD_MIME[end] || "image/jpeg" };
  }
  if (d.endung === "pdf") return { bytes: speicher.beispielPdf(d.dateiname), mime: "application/pdf" };
  return { bytes: speicher.beispielText(d.dateiname), mime: d.vorschau_art === "text" ? "text/plain; charset=utf-8" : d.mime || "application/octet-stream" };
}

/**
 * @param {object} p
 * @param {object} p.client          backoffice(session) bzw. Service-Client
 * @param {{url:string, art?:string, dateiname?:string, mime?:string}} p.link   Antwort von download_link/vorschau_link/freigabe_aufloesen
 * @param {boolean} [p.inline]
 * @param {string} [p.cache]
 */
export async function liefereAus({ client, link, inline = false, cache }) {
  if (!link?.url) return new Response("Nicht gefunden", { status: 404 });
  if (String(link.url).startsWith("mock:")) {
    const inhalt = await mockInhalt(client, link.url.slice(5));
    if (!inhalt) return new Response("Nicht gefunden", { status: 404 });
    return antwort(inhalt.bytes, { mime: inhalt.mime, dateiname: link.dateiname, inline, cache });
  }
  if (link.art === "direkt" && /^https:\/\//.test(link.url)) {
    return new Response(null, { status: 302, headers: { Location: link.url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  }
  // Proxy: Pfad relativ zum Frappe-Server (absolute Frappe-Adressen werden auf den Pfad gekürzt).
  let pfad = String(link.url);
  try {
    if (/^https?:\/\//.test(pfad)) {
      const u = new URL(pfad);
      pfad = `${u.pathname}${u.search}`;
    }
  } catch {
    return new Response("Ungültige Adresse", { status: 400 });
  }
  if (!pfad.startsWith("/api/method/") && !pfad.startsWith("/private/files/") && !pfad.startsWith("/files/")) return new Response("Ungültige Adresse", { status: 400 });
  const r = await client.request(pfad, { raw: true, timeoutMs: 120000 });
  return antwort(r.body, { mime: link.mime || r.headers.get("content-type"), dateiname: link.dateiname, inline, cache });
}
