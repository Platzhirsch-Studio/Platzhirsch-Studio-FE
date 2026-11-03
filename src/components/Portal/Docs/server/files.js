import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { adapterName, DATA_DIR } from "@/lib/portal/config";
import { amountLabel } from "@/lib/portal/constants";
import { demoPdfNoticeText } from "@/lib/portal/demoNotice";
import { formatDate } from "@/lib/portal/format";
import { ADDRESS, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME } from "@/lib/site";
import { documentStatus, documentTypeLabel } from "../labels";
import { renderSimplePdf } from "./pdf";

// Resolves the bytes of a portal document. Called only AFTER the document was
// found through the customer-scoped adapter (ownership already checked).
//
// mock:   /.data/portal/files/<storageKey> if present (gitignored, never
//         public/), otherwise a generated, clearly marked demo PDF.
// frappe: GET {FRAPPE_URL}/api/method/frappe.utils.print_format.download_pdf
//         ?doctype=<DOCUMENT_TYPES[type].doctype>&name=<doc.id>&format=<print format>
//         with the integration user's token – to be added together with the
//         Frappe adapter (see Marktresearch/digital/features/kundenportal.md).

const FILES_DIR = path.join(DATA_DIR, "files");

async function readLocal(storageKey) {
  if (!storageKey || !/^[A-Za-z0-9_\-./]+$/.test(storageKey)) return null;
  const file = path.resolve(FILES_DIR, storageKey);
  if (!file.startsWith(FILES_DIR + path.sep)) return null; // no traversal
  try {
    return await readFile(file);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

/** Demo-PDF (Mock-Adapter); exportiert für die Druckmuster (Druck 02.11.). */
export function demoPdf(doc, project, customer) {
  const st = documentStatus(doc);
  return renderSimplePdf({
    // Druck 02.11.: Fußzeile mit Aussteller und Adresse wie auf dem Gutschein
    footer: [`${SITE_NAME} · ${LEGAL_NAME} · ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`, `${PHONE_DISPLAY} · platzhirsch.studio/de/portal`],
    title: `${documentTypeLabel(doc.type)} ${doc.number}`,
    lines: [
      { text: "PLATZHIRSCH HOME LIVING", size: 10, bold: true, color: [0.48, 0.37, 0.09], gap: 0 },
      { text: "Mein Platzhirsch – Kundenportal", size: 9, color: [0.4, 0.42, 0.45], gap: 2 },
      { text: documentTypeLabel(doc.type), size: 22, bold: true, gap: 34 },
      { text: doc.title, size: 13, gap: 4 },
      { text: `Nummer: ${doc.number}`, gap: 18 },
      { text: `Datum: ${formatDate(doc.date)}` },
      { text: `Status: ${st.label}` },
      { text: `Projekt: ${project ? `${project.title} (${project.room})` : "–"}` },
      { text: `Kunde: ${customer.displayName}` },
      { text: `Betrag: ${amountLabel(doc)}`, bold: true, gap: 14 },
      {
        text: demoPdfNoticeText(),
        size: 10,
        color: [0.55, 0.15, 0.1],
        gap: 30,
      },
    ],
  });
}

const MIME_BY_EXT = { ".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** Attachment of an owned record (e.g. product-pass photo). Allow-listed types only. */
export async function loadAttachment(storageKey) {
  if (adapterName() !== "mock") return null; // Frappe: private File, proxied with the integration token later
  const mime = MIME_BY_EXT[path.extname(String(storageKey)).toLowerCase()];
  if (!mime) return null;
  const body = await readLocal(storageKey);
  return body ? { body, mime, name: path.basename(storageKey).replace(/[^A-Za-z0-9._-]/g, "_") } : null;
}

/** @returns {Promise<{body:Buffer, mime:string, name:string}|null>} */
export async function loadDocumentFile(doc, { project, customer }) {
  if (!doc.file) return null;
  if (adapterName() !== "mock") return null; // Frappe proxy not connected yet
  const local = await readLocal(doc.file.storageKey);
  const safeName = (doc.file.name || `${doc.number}.pdf`).replace(/[^A-Za-z0-9._-]/g, "_");
  if (local) return { body: local, mime: doc.file.mime || "application/pdf", name: safeName };
  return { body: demoPdf(doc, project, customer), mime: "application/pdf", name: safeName };
}
