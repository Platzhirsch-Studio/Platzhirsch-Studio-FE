// src/lib/upload/frappeAdapter.js — NOT ACTIVE. Plan for attaching finished
// uploads to the inquiry document in the Frappe/ERPNext backoffice
// (backoffice.platzhirsch.studio). We have no write access yet; this file
// documents the exact calls so the backoffice team can enable an API user.
//
// Needed on the Frappe side:
//   - API user with key/secret (env FRAPPE_API_KEY / FRAPPE_API_SECRET), role
//     allowed to create "File" and to write the inquiry doctypes:
//       Anfrage Produkt  (create via ...doctype.anfrage_produkt.api.create_anfrage)
//       Beratung Anfrage (route /api/beratung_anfrage)
//       Kontakt          (route /api/kontakt)
//   - The create endpoints should return the document `name`, so the upload
//     token can carry it as `ref` instead of our own PH-… reference.
//   - Optional custom field on each doctype: `upload_status` (Select:
//     offen/eingegangen), `upload_note` (Small Text).
//
// Upload of one file (multipart, private file — never is_private=0):
//   POST {BASE}/api/method/upload_file
//   Authorization: token <key>:<secret>
//   form-data: file=<binary>, file_name, is_private=1,
//              doctype=<Anfrage-Doctype>, docname=<ref>, folder=Home/Attachments
// Note: PUT /api/resource/<doctype>/<name> {upload_note, upload_status}
// Large videos (> ~100 MB): store in S3 and attach only the link as a File
// with file_url (Frappe file size limit "max_file_size" in System Settings).
import "server-only";

export const frappeAdapter = {
  enabled: Boolean(process.env.FRAPPE_API_KEY && process.env.FRAPPE_API_SECRET),

  async pushSession() {
    throw new Error("Frappe-Anbindung noch nicht freigeschaltet (siehe Kommentar oben).");
  },
};
