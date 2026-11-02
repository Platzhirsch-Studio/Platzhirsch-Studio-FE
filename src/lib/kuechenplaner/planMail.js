// src/lib/kuechenplaner/planMail.js
// Lead-Übergabe (Küchenplaner-Team): „Link an mich mailen“ – Weiterplanen auf
// einem anderen Gerät oder später, ohne Konto und ohne dass die Website etwas
// speichert oder sendet: ein mailto:-Link ohne Empfänger öffnet das eigene
// Mailprogramm, die Besucherin trägt ihre Adresse selbst ein.
// Nur Links dieser Website auf den Planer (planLink), sonst null.
// Rein, ohne "@/"-Importe (node --test tests/unit/kp-lead-planmail.test.mjs).
import { planLink } from "./planTermin.js";

export const MAIL_SUBJECT = "Meine Küchenplanung – Platzhirsch Home Living";

/** mailto:?subject=…&body=… mit dem Teilen-Link, oder null bei fremdem/ungültigem Link. */
// Sprachen (01.11.2026): optional t = Übersetzer (src/lib/kuechenplaner/i18n.js), sonst deutsch.
export function planMailHref(shareUrl, { origin, t = (s) => s } = {}) {
  const link = planLink(shareUrl, origin ? { origin } : undefined);
  if (!link) return null;
  const body = [
    t("Meine Küchenplanung aus dem 3D-Küchenplaner – zum Weiterplanen öffnen:"),
    link,
    "",
    t("Der Link enthält die komplette Planung, aber keine persönlichen Daten."),
  ].join("\n");
  // encodeURIComponent statt URLSearchParams: Mailprogramme lesen „+“ nicht als Leerzeichen.
  return `mailto:?subject=${encodeURIComponent(t(MAIL_SUBJECT))}&body=${encodeURIComponent(body)}`;
}
