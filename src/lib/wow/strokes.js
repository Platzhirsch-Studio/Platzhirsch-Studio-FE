// Which pen strokes the "Pause" hero may draw (R5-fix P2, technik P1-2).
//
// The photo (aboutHome.jpg) shows two armchairs that are probably Minotti
// pieces. Until the written image sign-off (wow-spezifikation §10 Nr. 1,
// Minotti rule "keine Veränderung") no line may lie over that furniture –
// neither the pencil underdrawing (UNDER), nor the pen and its warm core
// during the sequence, nor the resting registration (REST). Before this fix
// UNDER = PENS traced the armchairs from the first paint.
//
// Only the architecture is drawn: room, wall edge, fireplace. The armchair
// strokes come back with NEXT_PUBLIC_WOW_OVERLAY=1, set explicitly after the
// sign-off (the same switch as the hover overlay in config.js – here without
// the development default, so a dev review shows the production drawing).
// tests/unit/r9-p2-wow-furniture.test.mjs guards this.

export const FURNITURE_PREFIX = "chair";

export const isFurniture = (p) => String(p.id).startsWith(FURNITURE_PREFIX);

export const furnitureSignedOff = (env = process.env) => env.NEXT_PUBLIC_WOW_OVERLAY === "1";

// strokes: inkStrokes(PAUSE_PATHS) → { guides, pens, under, rest }
export function stageStrokes(strokes, signedOff = furnitureSignedOff()) {
  const guides = strokes.filter((p) => p.kind === "guide");
  const pens = strokes.filter((p) => p.kind !== "guide" && (signedOff || !isFurniture(p)));
  return { guides, pens, under: pens, rest: pens };
}
