// tools/images/lib.mjs – gemeinsame Bausteine für embed-rights.mjs und
// watermark.mjs (Bilder-SEO, 31.10.2026). Ohne neue Pakete: XMP wird
// VERLUSTFREI in die Datei gesetzt (JPEG: APP1-Segment, PNG: iTXt-Chunk),
// die Bilddaten bleiben Byte für Byte gleich. Für WebP/AVIF gibt es keinen
// verlustfreien Weg mit den vorhandenen Mitteln (sharp withXmp kodiert neu) →
// dort nur Trockenlauf + Anleitung (exiftool/Lightroom).
//
// Schutzregel: nur Dateien, die im Urheber-Register (src/lib/seo/imageRights.js)
// als EIGEN stehen. Herstellerbilder werden nie angefasst.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { ownImage, isManufacturerImage, copyrightNoticeOf, copyrightZeichenErlaubt, imageRights, RIGHTS_HOLDER, SITE_URL } from "../../src/lib/seo/imageRights.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const PUBLIC = path.join(ROOT, "public");
/** Originale ohne Wasserzeichen/vor Änderungen – außerhalb von public/, wird nie ausgeliefert. */
export const ORIGINALS = path.join(ROOT, "assets-originals");

const XMP_HEADER = Buffer.from("http://ns.adobe.com/xap/1.0/\0", "latin1");

/**
 * Register-Eintrag eines eigenen Fotos, sonst Fehler (Herstellerbild, nicht
 * eingetragen, außerhalb von public/).
 */
export function requireOwn(src, register = imageRights()) {
  const rel = String(src || "").replace(/\\/g, "/").replace(/^.*?\/public(?=\/)/, "");
  if (!rel.startsWith("/") || rel.includes("..")) throw new Error(`${src}: Pfad wie im <img src> angeben (z. B. /Images/Home/aboutHome.jpg)`);
  if (isManufacturerImage(rel)) throw new Error(`${rel}: Herstellerbild/fremde Quelle – verweigert (bleibt unverändert, „Bild: <Marke>“)`);
  const entry = ownImage(rel, register);
  if (!entry) throw new Error(`${rel}: steht nicht als eigenes Foto im Urheber-Register (src/lib/seo/imageRights.js) – verweigert`);
  return { rel, entry, file: path.join(PUBLIC, rel) };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Rechteinhaber (plus:CopyrightOwner) „Platzhirsch Home Living“ NUR bei
 * bestätigten exklusiven Rechten (Inhaber-Entscheidung Nr. 31).
 */
const ownerOf = (entry) => (copyrightZeichenErlaubt(entry) ? entry.rechteinhaber : "");

/** Felder, die geschrieben werden (IPTC-Photo-Metadata-Namen → Wert). */
export function rightsFields(entry) {
  return {
    "Credit Line (photoshop:Credit)": entry.creditText,
    "Copyright Notice (dc:rights)": copyrightNoticeOf(entry),
    "Creator (dc:creator)": entry.urheber || entry.fotograf || "",
    "Copyright Owner (plus:CopyrightOwner)": ownerOf(entry),
    "Web Statement of Rights (xmpRights:WebStatement)": entry.lizenzSeite ? `${SITE_URL}${entry.lizenzSeite}` : "",
  };
}

/** Kennung der von diesem Werkzeug geschriebenen rdf:Description (für erneute Läufe). */
export const OWN_XMP_NS = "https://platzhirsch.studio/ns/rechte/1.0/";
const OWN_DESC_RE = /<rdf:Description\b[^>]*xmlns:phr="https:\/\/platzhirsch\.studio\/ns\/rechte\/1\.0\/"[^>]*>[\s\S]*?<\/rdf:Description>\s*/g;
const NS = 'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:plus="http://ns.useplus.org/ldf/xmp/1.0/"';

/** Vorhandenes XMP ohne die eigene (früher geschriebene) Beschreibung. */
export const foreignXmp = (xmp) => String(xmp || "").replace(OWN_DESC_RE, "");
/** Steht die Eigenschaft (Element- oder Attributform) schon im fremden XMP? */
const hasProp = (xmp, prop) => new RegExp(`<${prop}[\\s>/]|\\s${prop}\\s*=`).test(xmp);

/**
 * XMP-Paket (IPTC Core/Extension) für einen Register-Eintrag.
 *
 * Mit vorhandenem XMP (`existing`, z. B. vom Fotografen) wird NICHTS davon
 * entfernt oder überschrieben: Die eigenen Angaben kommen als zusätzliche
 * rdf:Description dazu, und jede Eigenschaft, die schon vorhanden ist
 * (dc:creator, dc:rights, photoshop:Credit …), wird ausgelassen (§ 90c UrhG).
 * Ein früherer Lauf dieses Werkzeugs (Kennung xmlns:phr) wird ersetzt.
 */
export function xmpPacket(entry, existing = null) {
  const notice = copyrightNoticeOf(entry);
  const owner = ownerOf(entry);
  const creator = entry.urheber || entry.fotograf || "";
  const parts = [
    ["photoshop:Credit", entry.creditText ? `<photoshop:Credit>${esc(entry.creditText)}</photoshop:Credit>` : ""],
    ["dc:rights", notice ? `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(notice)}</rdf:li></rdf:Alt></dc:rights>` : ""],
    ["dc:creator", creator ? `<dc:creator><rdf:Seq><rdf:li>${esc(creator)}</rdf:li></rdf:Seq></dc:creator>` : ""],
    ["plus:CopyrightOwner", owner ? `<plus:CopyrightOwner><rdf:Seq><rdf:li rdf:parseType="Resource"><plus:CopyrightOwnerName>${esc(owner)}</plus:CopyrightOwnerName></rdf:li></rdf:Seq></plus:CopyrightOwner>` : ""],
    ["xmpRights:WebStatement", entry.lizenzSeite ? `<xmpRights:WebStatement>${esc(`${SITE_URL}${entry.lizenzSeite}`)}</xmpRights:WebStatement>` : ""],
  ];
  const fremd = foreignXmp(existing);
  const merge = fremd.includes("</rdf:RDF>");
  const chosen = parts.filter(([prop, xml]) => xml && !(merge && hasProp(fremd, prop))).map(([, xml]) => xml);
  const desc = [`<rdf:Description rdf:about="" xmlns:phr="${OWN_XMP_NS}" phr:werkzeug="tools/images/embed-rights.mjs" ${NS}>`, ...chosen, "</rdf:Description>"].join("\n");
  if (merge) {
    const at = fremd.lastIndexOf("</rdf:RDF>");
    return `${fremd.slice(0, at)}${desc}\n${fremd.slice(at)}`;
  }
  return [
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>',
    '<x:xmpmeta xmlns:x="adobe:ns:meta/">',
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">',
    desc,
    "</rdf:RDF>",
    "</x:xmpmeta>",
    '<?xpacket end="w"?>',
  ].join("\n");
}

/** Liest vorhandene XMP aus JPEG (APP1) – oder null. */
export function jpegXmp(buf) {
  for (const seg of jpegSegments(buf)) if (seg.marker === 0xe1 && buf.subarray(seg.start + 4, seg.start + 4 + XMP_HEADER.length).equals(XMP_HEADER)) return buf.subarray(seg.start + 4 + XMP_HEADER.length, seg.end).toString("utf8");
  return null;
}

/** Segmente vor den Bilddaten (bis SOS). */
function jpegSegments(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("keine JPEG-Datei");
  const out = [];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`JPEG-Struktur unerwartet bei Byte ${i}`);
    const marker = buf[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // SOS / EOI
    const len = buf.readUInt16BE(i + 2);
    out.push({ marker, start: i, end: i + 2 + len });
    i += 2 + len;
  }
  return out;
}

/**
 * Setzt XMP verlustfrei in ein JPEG: vorhandenes XMP-APP1 wird ersetzt, alle
 * anderen Segmente (EXIF, IPTC/APP13 mit dem Copyright des Fotografen, ICC)
 * und die Bilddaten bleiben unverändert.
 */
export function jpegWithXmp(buf, xmp) {
  const payload = Buffer.concat([XMP_HEADER, Buffer.from(xmp, "utf8")]);
  if (payload.length + 2 > 0xffff) throw new Error("XMP zu groß für ein APP1-Segment");
  const seg = Buffer.alloc(4);
  seg[0] = 0xff;
  seg[1] = 0xe1;
  seg.writeUInt16BE(payload.length + 2, 2);
  const app1 = Buffer.concat([seg, payload]);
  const segs = jpegSegments(buf);
  const isXmp = (s) => s.marker === 0xe1 && buf.subarray(s.start + 4, s.start + 4 + XMP_HEADER.length).equals(XMP_HEADER);
  // nach APP0 (JFIF) und APP1 (EXIF) einfügen, wie es exiftool tut
  let insertAt = 2;
  for (const s of segs) {
    if ((s.marker === 0xe0 || (s.marker === 0xe1 && !isXmp(s))) && s.start === insertAt) insertAt = s.end;
  }
  const chunks = [buf.subarray(0, insertAt), app1];
  let pos = insertAt;
  for (const s of segs) {
    if (s.start < insertAt) continue;
    if (isXmp(s)) {
      chunks.push(buf.subarray(pos, s.start));
      pos = s.end;
    }
  }
  chunks.push(buf.subarray(pos));
  return Buffer.concat(chunks);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC_TABLE[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Setzt XMP verlustfrei in ein PNG (iTXt „XML:com.adobe.xmp“, vorhandenes wird ersetzt). */
export function pngWithXmp(buf, xmp) {
  const sig = buf.subarray(0, 8);
  if (!sig.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("keine PNG-Datei");
  const key = "XML:com.adobe.xmp";
  const data = Buffer.concat([Buffer.from(key, "latin1"), Buffer.from([0, 0, 0, 0, 0]), Buffer.from(xmp, "utf8")]);
  const type = Buffer.from("iTXt", "latin1");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  const chunk = Buffer.concat([len, type, data, crc]);
  const out = [sig];
  let i = 8;
  let inserted = false;
  while (i < buf.length) {
    const l = buf.readUInt32BE(i);
    const t = buf.toString("latin1", i + 4, i + 8);
    const end = i + 12 + l;
    const isXmp = t === "iTXt" && buf.toString("latin1", i + 8, i + 8 + key.length) === key;
    if (!isXmp) out.push(buf.subarray(i, end));
    if (t === "IHDR" && !inserted) {
      out.push(chunk);
      inserted = true;
    }
    i = end;
  }
  return Buffer.concat(out);
}

/** Format nach Dateikopf. */
export function formatOf(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf.subarray(0, 4).toString("latin1") === "\x89PNG") return "png";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  if (buf.subarray(4, 12).toString("latin1").startsWith("ftypavi")) return "avif";
  return "unbekannt";
}

/** Vorhandene Rechte-Angaben in der Datei (EXIF Copyright, IPTC 2:116/2:80/2:110), soweit lesbar. */
export function existingNotices(meta) {
  const found = {};
  const iptc = meta?.iptc;
  if (iptc) {
    for (let i = 0; i < iptc.length - 4; i++) {
      if (iptc[i] === 0x1c && iptc[i + 1] === 2) {
        const tag = iptc[i + 2];
        const len = iptc.readUInt16BE(i + 3);
        const val = iptc.toString("latin1", i + 5, i + 5 + len);
        if (tag === 116) found["IPTC Copyright Notice (2:116)"] = val;
        if (tag === 80) found["IPTC By-line (2:80)"] = val;
        if (tag === 110) found["IPTC Credit (2:110)"] = val;
        i += 4 + len;
      }
    }
  }
  if (meta?.exif) {
    const m = /Exif\0\0(II|MM)/.exec(meta.exif.toString("latin1"));
    if (m) {
      const b = meta.exif;
      const off = m.index + 6;
      const le = m[1] === "II";
      const r16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
      const r32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
      try {
        const ifd = r32(off + 4);
        const n = r16(off + ifd);
        for (let k = 0; k < n; k++) {
          const e = off + ifd + 2 + k * 12;
          const tag = r16(e);
          if (tag !== 0x8298 && tag !== 0x013b) continue;
          const count = r32(e + 4);
          const at = count <= 4 ? e + 8 : off + r32(e + 8);
          const val = b.toString("latin1", at, at + count).replace(/\0+$/, "");
          found[tag === 0x8298 ? "EXIF Copyright" : "EXIF Artist"] = val;
        }
      } catch {
        /* unlesbar – ignorieren */
      }
    }
  }
  // Fremdes XMP (ohne die eigene Beschreibung): Urheber und Copyright des Fotografen
  if (meta?.xmp) {
    const x = foreignXmp(Buffer.isBuffer(meta.xmp) ? meta.xmp.toString("utf8") : meta.xmp);
    for (const [prop, key] of [
      ["dc:creator", "XMP Creator (dc:creator)"],
      ["dc:rights", "XMP Copyright Notice (dc:rights)"],
      ["photoshop:Credit", "XMP Credit (photoshop:Credit)"],
    ]) {
      const el = new RegExp(`<${prop}>([\\s\\S]*?)</${prop}>`).exec(x);
      const attr = new RegExp(`\\s${prop}\\s*=\\s*"([^"]*)"`).exec(x);
      if (el) found[key] = [...el[1].matchAll(/<rdf:li[^>]*>([^<]*)<\/rdf:li>/g)].map((m) => m[1]).join("; ") || el[1].trim();
      else if (attr) found[key] = attr[1];
    }
  }
  return found;
}

export { RIGHTS_HOLDER, imageRights, fs };
