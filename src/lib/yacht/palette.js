// src/lib/yacht/palette.js
// Colours of the 3D "Werfthalle" and the SVG poster. three.js needs literal
// colour values, so they live here once (not in components). Each value is a
// design token from src/app/globals.css (@theme) or a material tone derived
// from it; comments name the source.

export const TOKENS = {
  paper: "#faf8f4", // --color-paper
  bone: "#f7f5f1", // --color-bone
  stone: "#ece8e1", // --color-stone
  linen: "#e6e1d8", // --color-linen
  stoneDeep: "#d8d2c8", // --color-stone-deep
  pebble: "#8a8174", // --color-pebble
  inkSoft: "#5c636a", // --color-ink-soft
  ink: "#30373e", // --color-ink
  inkDeep: "#1f252b", // --color-ink-deep
  walnut: "#3f3129", // --color-walnut
  see: "#4f6b68", // --color-see
  brass400: "#d1b250", // --color-brass-400
  brass500: "#9a7a2a", // --color-brass-500
};

/** Material tones (3D). `warm` = 2,700 K window light in the evening. */
export const MATERIAL_TONES = {
  gelcoat: "#f3f0ea", // paper, a touch warmer for the clearcoat
  holz: "#6e3a22", // varnished mahogany (runabout)
  lärche: "#a39886", // weathered larch (houseboat)
  glass: "#a9bcbd", // see, lightened
  window: TOKENS.inkDeep,
  teak: "#a8794f", // oiled teak
  hardtop: TOKENS.stone,
  metal: "#b9bcbe", // stainless
  wood: "#8a6a4f", // interior joinery
  sole: "#cbb99e", // interior floor (light oak)
  wall: "#d3cabd", // bulkheads: stone-deep, a touch warmer – reads against the floor, never as a white plane
  sail: TOKENS.paper,
  cradle: TOKENS.inkSoft,
  antifouling: TOKENS.ink,
  bootStripe: TOKENS.brass500,
  warm: "#ffb46b", // 2,700 K
  bedding: "#f4f1ec", // white linen (bone, a touch warmer)
  lamp: "#efe6d6", // battery lamp shade (opal glass) – glows warm in the evening
  tile: "#b9c4c1", // bath floor tiles (see, lightened) – tells the bath apart from the cabin
  ceramic: TOKENS.paper, // basin, WC, shower tray
  mirror: "#c9d2d3", // mirror (metal-like, low roughness)
};

/** Hall (scene) colours for day and evening ("Seelicht"). */
export const HALL = {
  tag: { bg: TOKENS.stone, floor: TOKENS.bone, grid: TOKENS.stoneDeep, fog: TOKENS.stone },
  abend: { bg: TOKENS.inkDeep, floor: "#262d34", grid: TOKENS.ink, fog: TOKENS.inkDeep },
};
