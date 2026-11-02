// Lädt ein SOG-Bündel über die geschützte Route und entpackt es im Browser.
// WebP wird über WebGL2 bit-genau dekodiert (kein Premultiply, keine
// Farbraum-Umrechnung): ein 2D-Canvas würde Werte mit kleinem Alpha verfälschen.
import { entpackeSog, pruefeMeta } from "@/lib/raumzwilling/sog";

async function bitmap(blob) {
  return createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
}

function leseUeberWebgl(bilder) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false });
  if (!gl) throw new Error("kein WebGL2");
  const out = {};
  try {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const fb = gl.createFramebuffer();
    for (const [name, bmp] of Object.entries(bilder)) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const px = new Uint8Array(bmp.width * bmp.height * 4);
      gl.readPixels(0, 0, bmp.width, bmp.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      out[name] = px;
      gl.deleteTexture(tex);
    }
    gl.deleteFramebuffer(fb);
  } finally {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return out;
}

function leseUeber2d(bilder) {
  const out = {};
  for (const [name, bmp] of Object.entries(bilder)) {
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    out[name] = new Uint8Array(ctx.getImageData(0, 0, bmp.width, bmp.height).data.buffer);
  }
  return out;
}

/**
 * @param {string} basis  z. B. /api/portal/raum/PRJ-2026-014/datei/splat
 * @param {(anteil:number)=>void} fortschritt
 */
export async function ladeSog(basis, fortschritt = () => {}, signal) {
  const metaRes = await fetch(`${basis}/meta`, { credentials: "same-origin", cache: "no-store", signal });
  if (!metaRes.ok) throw new Error(`meta ${metaRes.status}`);
  const meta = await metaRes.json();
  if (!pruefeMeta(meta)) throw new Error("Ungültige Splat-Beschreibung");
  const dateien = [...new Set([...meta.means.files, ...meta.quats.files, ...meta.scales.files, ...meta.sh0.files])];
  let fertig = 0;
  const bilder = {};
  await Promise.all(
    dateien.map(async (f) => {
      const r = await fetch(`${basis}/${f.replace(/\.webp$/, "")}`, { credentials: "same-origin", cache: "no-store", signal });
      if (!r.ok) throw new Error(`${f} ${r.status}`);
      bilder[f] = await bitmap(await r.blob());
      fertig++;
      fortschritt(fertig / dateien.length);
    })
  );
  let rgba;
  try {
    rgba = leseUeberWebgl(bilder);
  } catch {
    rgba = leseUeber2d(bilder);
  }
  Object.values(bilder).forEach((b) => b.close?.());
  return entpackeSog(meta, (n) => rgba[n]);
}
