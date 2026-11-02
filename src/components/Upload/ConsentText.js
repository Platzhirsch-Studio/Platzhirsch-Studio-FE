// Consent wording for the mobile upload page (version: CONSENT_VERSION in
// lib/upload/config.js — change the version whenever this text changes, the
// stored consent records it). Two levels (QA round 1, P2-3): one short
// sentence next to the checkbox, the full text in an expandable <details>.
// Legal review: see feature doc, "Rechtliches".
import { EMAIL, SITE_NAME } from "@/lib/site";
import { UPLOAD_CONFIG } from "@/lib/upload/config";

export function ConsentShort() {
  return <>Ich bin einverstanden, dass {SITE_NAME} meine Dateien nur für diese Anfrage nutzt.</>;
}

export function ConsentDetails({ refCode }) {
  // Shown only while uploadsAccepting() (confirmed Löschfrist, r1 P0-4), so
  // the period is the decided one; never a bracket placeholder.
  const days = `${UPLOAD_CONFIG.retentionDays} Tage`;
  return (
    <>
      <p>
        Ich willige ein, dass {SITE_NAME} (Lochau) die hier hochgeladenen Fotos, Videos, Pläne und meine Notiz
        ausschließlich zur Bearbeitung meiner Anfrage{refCode ? ` (${refCode})` : ""} speichert und verwendet.
      </p>
      <p className="mt-2">
        Speicherdauer: {days} nach Ablauf dieses Links, außer die Unterlagen werden für einen Auftrag benötigt.
        Die Einwilligung ist freiwillig und jederzeit widerrufbar per E-Mail an {EMAIL}; Ihre Anfrage gilt auch
        ohne Upload. Bitte keine Aufnahmen von Personen ohne deren Einverständnis.
      </p>
      <p className="mt-2">
        Mehr in der{" "}
        <a href="/de/datenschutz" target="_blank" rel="noopener" className="font-medium text-gold-text underline">
          Datenschutzerklärung
        </a>
        .
      </p>
    </>
  );
}
