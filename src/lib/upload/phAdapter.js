// src/lib/upload/phAdapter.js – Upload-Anhänge an eine PH Anfrage (Gruppe "upload",
// ph_crm.api.attach_upload). Gegenstück zum gesperrten frappeAdapter.js.
//
// Backend (Backend-Import/ph_crm/ph_crm/api/__init__.py attach_upload):
//   POST multipart: referenz, file (≤ 100 MB), file_name, note, content_type, size
//   oder JSON:      referenz, file_url (https), file_name, note
//   Endungen jpg jpeg png webp heic heif pdf mp4 mov m4v webm dwg dxf zip; immer privat.
//   → { referenz, file, file_url, upload_anzahl }
//   Fehler: invalid 400 (referenz/file/file_name/file_url), 413 zu groß, not_found 404.
// `referenz` = Antwort von create_anfrage/create_contact (data.message.name bzw.
// .referenz, src/lib/backend/forms.js mapPhInquiryResult).
//
// Noch NICHT verdrahtet: upload/service.js saveNote() hat dafür einen TODO
// (Übertragung beim Absenden). Bis der Upload-Ablauf das Anfrage-Dokument
// kennt, bleibt der Adapter ungenutzt – Verhalten der Website unverändert.
// Rein (relative Importe; fetch wird übergeben).
import { phCall, resolveBackend } from "../backend/config.js";

export const PH_UPLOAD_METHOD = "ph_crm.api.attach_upload";
export const PH_UPLOAD_EXT = Object.freeze(["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf", "mp4", "mov", "m4v", "webm", "dwg", "dxf", "zip"]);

const extOf = (name) => String(name || "").toLowerCase().split(".").pop();

/** ph-Antwort → Ergebnis der Website. */
export function fromPhUpload(m = {}) {
  return { ok: true, ref: m.referenz || "", fileId: m.file || null, fileUrl: m.file_url || null, count: Number(m.upload_anzahl || 0) };
}

export function createPhUploadAdapter(cfg, { fetchImpl = globalThis.fetch } = {}) {
  return {
    kind: "ph",
    enabled: Boolean(cfg),
    /**
     * @param {{ referenz: string, fileName: string, data?: Blob|Uint8Array|ArrayBuffer, fileUrl?: string, contentType?: string, note?: string }} input
     * @returns {Promise<{ok:true, ref, fileId, fileUrl, count}|{ok:false, code}>}
     */
    async attach({ referenz, fileName, data, fileUrl, contentType, note } = {}) {
      if (!cfg) return { ok: false, code: "not_configured" };
      if (!referenz) return { ok: false, code: "invalid" };
      if (!PH_UPLOAD_EXT.includes(extOf(fileName))) return { ok: false, code: "invalid" };
      let r;
      if (fileUrl) {
        r = await phCall(cfg, PH_UPLOAD_METHOD, { params: { referenz, file_url: fileUrl, file_name: fileName, note: note || undefined }, fetchImpl, timeoutMs: 60_000 });
      } else {
        if (data == null) return { ok: false, code: "invalid" };
        const blob = data instanceof Blob ? data : new Blob([data], { type: contentType || "application/octet-stream" });
        const form = new FormData();
        form.set("referenz", referenz);
        form.set("file_name", fileName);
        if (note) form.set("note", note);
        if (contentType) form.set("content_type", contentType);
        form.set("size", String(blob.size));
        form.set("file", blob, fileName);
        // multipart: Content-Type setzt fetch selbst (Boundary).
        r = await phCall(cfg, PH_UPLOAD_METHOD, { body: form, fetchImpl, timeoutMs: 120_000 });
      }
      return r.ok ? fromPhUpload(r.message) : { ok: false, code: r.code };
    },
  };
}

/** Adapter der Gruppe "upload" oder null (alt: es gibt keinen Upload ans Backend). */
export function phUploadAdapter(env = process.env, o = {}) {
  const backend = resolveBackend("upload", env);
  if (backend.generation !== "ph") return null;
  return createPhUploadAdapter(backend.ph || null, o);
}
