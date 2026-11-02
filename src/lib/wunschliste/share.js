// src/lib/wunschliste/share.js — Teilen-Link und QR-Code (Server).
// Der QR-Code nutzt die Hauszeichnung des Handy-Uploads (src/lib/upload/qrSvg.js,
// scan-geprüft), damit das qrcode-Paket nie ins Browser-Bundle kommt.
import "server-only";
import { publicOrigin } from "@/lib/upload/handoff";
import { qrDataUrl } from "@/lib/upload/qrSvg";
import { localeOf } from "./copy";

export const sharePath = (locale, shareId) => `/${localeOf(locale)}/wunschliste/${shareId}`;
// Der Verwaltungsschlüssel steht im #Fragment: Browser schicken ihn nie an
// den Server, in Logs und Referrer taucht er nicht auf.
export const managePath = (locale, adminToken) => `/${localeOf(locale)}/wunschliste/verwalten#${adminToken}`;

export function shareBundle({ locale, shareId, adminToken }, headers) {
  const origin = process.env.WUNSCHLISTE_PUBLIC_BASE_URL?.replace(/\/$/, "") || publicOrigin(headers);
  const out = {};
  if (shareId) {
    out.shareUrl = `${origin}${sharePath(locale, shareId)}`;
    out.qr = qrDataUrl(out.shareUrl);
  }
  if (adminToken) out.manageUrl = `${origin}${managePath(locale, adminToken)}`;
  return out;
}
