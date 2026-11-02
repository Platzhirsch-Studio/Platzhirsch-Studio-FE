// src/lib/upload/handoff.js — builds what the success screen shows: the
// mobile upload URL and its QR code (SVG, generated on the server so the
// qrcode package never reaches the browser bundle). The drawing itself (house
// QR with monogram, scan-tested) lives in ./qrSvg.js.
import "server-only";
import { SITE_URL } from "@/lib/site";
import { qrDataUrl } from "./qrSvg";

/**
 * Public origin for the QR link. A phone can't open "localhost", so in
 * development set UPLOAD_PUBLIC_BASE_URL=http://<LAN-IP>:3000 to test with a
 * real device; otherwise the request's own host is used.
 */
export function publicOrigin(headers) {
  if (process.env.UPLOAD_PUBLIC_BASE_URL) return process.env.UPLOAD_PUBLIC_BASE_URL.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return SITE_URL;
  const host = headers?.get("x-forwarded-host") || headers?.get("host");
  const proto = headers?.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function buildHandoff({ token, ref, expiresAt }, headers) {
  const url = `${publicOrigin(headers)}/de/upload/${token}`;
  return {
    url,
    ref,
    expiresAt: expiresAt.toISOString(),
    qr: qrDataUrl(url),
  };
}
