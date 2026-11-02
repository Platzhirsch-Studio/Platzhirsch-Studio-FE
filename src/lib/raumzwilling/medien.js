// src/lib/raumzwilling/medien.js — Prüfungen für Video und Audio (rein, getestet).

/**
 * Entfernt Ortsangaben aus MP4/MOV IN PLACE (gleiche Länge, Video bleibt
 * abspielbar): Inhalte von „©xyz“-Atomen (Apple/Android-GPS) und Werte des
 * QuickTime-Schlüssels „com.apple.quicktime.location.ISO6709“ werden mit
 * Leerzeichen überschrieben. Der Job-Runner exportiert Frames außerdem mit
 * ffmpeg -map_metadata -1, und das Original wird nach dem Job gelöscht.
 * @param {Uint8Array} buf  wird verändert
 * @returns {number} Anzahl bereinigter Stellen
 */
export function entferneVideoOrt(buf) {
  let treffer = 0;
  const xyz = [0xa9, 0x78, 0x79, 0x7a]; // ©xyz
  for (let i = 4; i + 8 <= buf.length; i++) {
    if (buf[i] === xyz[0] && buf[i + 1] === xyz[1] && buf[i + 2] === xyz[2] && buf[i + 3] === xyz[3]) {
      const groesse = ((buf[i - 4] << 24) | (buf[i - 3] << 16) | (buf[i - 2] << 8) | buf[i - 1]) >>> 0;
      if (groesse >= 12 && groesse < 512 && i - 4 + groesse <= buf.length) {
        // Kopf (4 Byte Länge + 4 Byte Typ) bleibt, Inhalt wird zu Leerzeichen.
        buf.fill(0x20, i + 4, i - 4 + groesse);
        treffer++;
        i += groesse - 5;
      }
    }
  }
  const schluessel = "com.apple.quicktime.location.ISO6709";
  const s = Array.from(schluessel, (c) => c.charCodeAt(0));
  for (let i = 0; i + s.length <= buf.length; i++) {
    let gleich = true;
    for (let k = 0; k < s.length; k++) {
      if (buf[i + k] !== s[k]) {
        gleich = false;
        break;
      }
    }
    if (!gleich) continue;
    // Der Wert steht im ilst-Teil als ISO-6709-Text (+47.5124+009.7461+402.123/).
    for (let j = i + s.length; j < Math.min(buf.length, i + 4096) - 8; j++) {
      if ((buf[j] === 0x2b || buf[j] === 0x2d) && buf[j + 1] >= 0x30 && buf[j + 1] <= 0x39) {
        let ende = j;
        while (ende < buf.length && ende - j < 64 && /[0-9+\-./]/.test(String.fromCharCode(buf[ende]))) ende++;
        if (ende - j >= 10 && buf[ende - 1] === 0x2f) {
          buf.fill(0x20, j, ende);
          treffer++;
          break;
        }
      }
    }
  }
  return treffer;
}

/** Container-Signatur einer Sprachnachricht passt zum Typ (wie im Planungsbereich). */
export function audioSignaturOk(bytes, ext) {
  const ascii = (from, to) => String.fromCharCode(...bytes.subarray(from, to));
  switch (ext) {
    case "webm":
      return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    case "ogg":
      return ascii(0, 4) === "OggS";
    case "m4a":
      return ascii(4, 8) === "ftyp";
    case "mp3":
      return ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case "wav":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
    default:
      return false;
  }
}

export const AUDIO_TYPEN = Object.freeze({
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
});
