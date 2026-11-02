// src/lib/portal/demoNotice.js — R6-portal-labs (N7)
// Text des Demo-Hinweises über den Portal-Seiten (Portal/Docs/SectionNav.js,
// DevDataNotice). Nur der Dev-Server spricht von der „lokalen
// Entwicklungsumgebung“; ein Produktions-Build mit Demo-Sitzung (Mock-Adapter,
// z. B. Abnahme über SHOOT_PORTAL_SECRET) zeigt den neutralen „Demo-Zugang“.
// Rein und ohne "@/"-Importe: direkt mit node --test prüfbar.
import { tx } from "./i18n.js";

export const DEMO_NOTICE = {
  dev: { key: "Portal.demo.dev", de: "Demo-Daten aus der lokalen Entwicklungsumgebung – keine echten Kundendaten, keine Preise." },
  access: { key: "Portal.demo.access", de: "Demo-Zugang mit Beispieldaten – keine echten Kundendaten, keine Preise." },
};

/** "dev" nur im Dev-Server (next dev), sonst "access". */
export function demoNoticeKind(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "production" ? "access" : "dev";
}

// Hinweiszeile im generierten Demo-PDF (Portal/Docs/server/files.js). Gleiche
// Weiche wie das Banner: nur der Dev-Server nennt die Entwicklungsdaten.
export const DEMO_PDF_NOTICE = {
  dev: "DEMO-DOKUMENT – kein rechtsgültiger Beleg. Erzeugt aus lokalen Entwicklungsdaten; das Original kommt später als PDF aus dem Backoffice (ERPNext).",
  access: "DEMO-DOKUMENT – kein rechtsgültiger Beleg. Demo-Zugang mit Beispieldaten; das Original kommt später als PDF aus dem Backoffice (ERPNext).",
};

/** Text der Hinweiszeile im Demo-PDF, abhängig von demoNoticeKind(). */
export function demoPdfNoticeText(nodeEnv) {
  return DEMO_PDF_NOTICE[demoNoticeKind(nodeEnv)];
}

/** Fertiger Text über tx(): Messages, wenn übernommen, sonst der DE-Text. */
export function demoNoticeText(t, nodeEnv) {
  const { key, de } = DEMO_NOTICE[demoNoticeKind(nodeEnv)];
  return tx(t, key, de);
}
