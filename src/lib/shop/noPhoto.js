// src/lib/shop/noPhoto.js
// R5-produkt (P1): products without a backoffice image (bild_anhangen empty –
// 26.10.2026: 152 active pieces, 111 Brand van Egmond, 13 Next125, 28 others)
// get a neutral surface without any motif instead of an unrelated stock photo
// (an outdoor armchair on a ceiling lamp was misleading). No manufacturer
// image URLs as a stand-in: there is no image release for them.
//
// Text source: src/messages/*.json → shop.atelier.noPhoto (proposal in
// Marktresearch/digital/teamleiter/messages-r5-produkt.json, taken over in
// round 6). Until then this module is the fallback (same wording).
//
// Pure module (no "@/", no hooks): server pages, the client catalogue and
// node --test can all import it.

export const NO_PHOTO_TEXT = Object.freeze({
  de: "Für dieses Stück liegt noch kein Foto vor",
  en: "There is no photo of this piece yet",
  fr: "Nous n’avons pas encore de photo de cette pièce",
  it: "Per questo pezzo non abbiamo ancora una foto",
});

export const NO_PHOTO_KEY = "atelier.noPhoto";

/**
 * Localized hint. `t` = a next-intl translator for the "shop" namespace
 * (optional); its value wins once the key is in src/messages.
 */
export function noPhotoLabel(locale, t) {
  try {
    if (t?.has?.(NO_PHOTO_KEY)) return t(NO_PHOTO_KEY);
  } catch {
    // fall through to the module text
  }
  return NO_PHOTO_TEXT[locale] || NO_PHOTO_TEXT.de;
}

// Neutral share image (1200 × 630, typographic, no photo) of this locale,
// served by src/app/[locale]/produkte/kein-foto.png/route.js. The dotted path
// bypasses the proxy, so the German folder name is the URL in every locale.
export function noPhotoOgPath(locale) {
  return `/${NO_PHOTO_TEXT[locale] ? locale : "de"}/produkte/kein-foto.png`;
}

