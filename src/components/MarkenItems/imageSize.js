// src/components/MarkenItems/imageSize.js
// Real pixel size of a backoffice image (QA Runde 1, P2-1/P2-2): the brand page
// sizes manufacturer images by their true aspect ratio instead of a fixed box,
// and shows the full-width room image only if the file is really wide enough.
//
// Only the header is read (JPEG SOF, PNG IHDR, WebP VP8/VP8L/VP8X, GIF), the
// download is cancelled as soon as the size is known. No npm dependency.
// Pure module (relative imports only) so it can be checked with plain node.

const MAX_BYTES = 256 * 1024;
const TIMEOUT_MS = 4000;

const u16be = (b, o) => (b[o] << 8) | b[o + 1];
const u16le = (b, o) => b[o] | (b[o + 1] << 8);
const u24le = (b, o) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
const u32be = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];

/**
 * Width/height from the first bytes of an image file.
 * @param {Uint8Array} b
 * @returns {{width: number, height: number} | null} null = unknown / need more bytes
 */
export function readImageSize(b) {
  if (!b || b.length < 24) return null;
  // PNG
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { width: u32be(b, 16), height: u32be(b, 20) };
  }
  // GIF
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { width: u16le(b, 6), height: u16le(b, 8) };
  }
  // WebP (RIFF....WEBP)
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 && b.length >= 30) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (chunk === "VP8X") return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
    if (chunk === "VP8 ") return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  // JPEG: walk the segments until a SOFn marker
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o += 1;
        continue;
      }
      const marker = b[o + 1];
      if (marker === 0xff) {
        o += 1;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        o += 2;
        continue;
      }
      const len = u16be(b, o + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) return { height: u16be(b, o + 5), width: u16be(b, o + 7) };
      o += 2 + len;
    }
    return null;
  }
  return null;
}

const memo = new Map();

/**
 * Size of a remote image, read from its header only. Never throws.
 * Deliberately a plain fetch (no cache option): `cache: "no-store"` would make
 * the ISR brand page dynamic, and the data cache would download the whole
 * file. Results are memoized per server process.
 * @param {string} url absolute URL
 * @returns {Promise<{width: number, height: number} | null>}
 */
export async function probeImageSize(url) {
  if (!url) return null;
  if (memo.has(url)) return memo.get(url);
  const job = (async () => {
    try {
      const res = await fetch(url, {
        headers: { Range: `bytes=0-${MAX_BYTES - 1}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok || !res.body) return null;
      const reader = res.body.getReader();
      let buf = new Uint8Array(0);
      let size = null;
      while (buf.length < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        const next = new Uint8Array(buf.length + value.length);
        next.set(buf);
        next.set(value, buf.length);
        buf = next;
        size = readImageSize(buf);
        if (size) break;
      }
      reader.cancel().catch(() => {});
      return size && size.width > 0 && size.height > 0 ? size : null;
    } catch {
      return null;
    }
  })();
  memo.set(url, job);
  const result = await job;
  // A failed probe (timeout, backend down) is retried on the next render.
  if (!result) memo.delete(url);
  return result;
}
