// Server-Einstieg der WhatsApp-Beratung: liest die Konfiguration auf dem
// Server (src/lib/whatsapp/config.js) und rendert den Client-Einstieg nur,
// wenn eine Nummer gesetzt ist (oder im Dev-Server für die Vorschau).
// Ohne Nummer im Produktions-Build: null – kein Element, kein wa.me im HTML.
//
// Tempo-Runde Shell (qa-screenshots/tempo/shell.md): die kurzen Texte der
// Auslöser (Knopf, Abschnitt, CTA-Leiste) löst der Server in der Seitensprache
// auf und reicht sie als `labels` weiter. So liegt die Vier-Sprachen-Tabelle
// src/lib/whatsapp/copy.js nicht mehr im Shell-Bundle jeder Seite; nur der
// Hinweis (WhatsAppHint, lädt erst beim Öffnen) liest sie noch selbst.
import { entryProps } from "@/lib/whatsapp/config";
import { whatsappCopy } from "@/lib/whatsapp/copy";
import WhatsAppEntry from "./WhatsAppEntry";

/** Texte der Auslöser, die WhatsAppEntry und MobileCtaBar zeigen. */
export const ENTRY_LABEL_KEYS = Object.freeze([
  "open",
  "openProduct",
  "kontaktEyebrow",
  "kontaktTitle",
  "kontaktText",
  "beratungTitle",
  "beratungText",
  "bar",
  "barLabel",
]);

/** { open, openProduct, …, bar, barLabel } in der Sprache `locale`. */
export function whatsappLabels(locale) {
  const t = whatsappCopy(locale);
  return Object.fromEntries(ENTRY_LABEL_KEYS.map((k) => [k, t[k]]));
}

/** Props für Client-Komponenten (MobileCtaBar, WhatsAppEntry) oder null. */
export function whatsappProps(locale) {
  const props = entryProps(locale);
  return props ? { ...props, labels: whatsappLabels(locale) } : null;
}

export default function WhatsApp({ locale, ...rest }) {
  const props = whatsappProps(locale);
  if (!props) return null;
  return <WhatsAppEntry {...props} {...rest} />;
}
