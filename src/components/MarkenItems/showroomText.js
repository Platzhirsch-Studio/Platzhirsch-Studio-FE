// src/components/MarkenItems/showroomText.js
// Re-Export (R3-marken-seo): Der Händler- und Stimmfilter liegt jetzt zentral
// in src/lib/legal/manufacturerText.js. Diese Datei bleibt nur, damit
// bestehende Importe (produkte/[category]/[product]/page.js, R3-produkt)
// unverändert weiterlaufen. Neuer Code importiert aus "@/lib/legal/manufacturerText".
export {
  VERIFIED_DEALER_SLUGS,
  NEUTRAL_TEXT,
  cleanProse,
  hasDeliveryClaim,
  hasVoiceViolation,
  isVerifiedDealer,
  leadProse,
  resolveShowroomText,
  sanitizeManufacturerText,
  sentences,
  // Alter Name: breite Wortsuche ohne Marken-Kontext (≠ hasDealerClaim in claims.js).
  hasDealerWording as hasDealerClaim,
} from "../../lib/legal/manufacturerText.js";
