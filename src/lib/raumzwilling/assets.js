// src/lib/raumzwilling/assets.js — server-only Fassade für assets-node.mjs
// (Splat-Bündel und Standbilder schreiben/lesen mit sharp). Die Tools unter
// tools/raumzwilling/ importieren assets-node.mjs direkt.
import "server-only";
export { schreibeSogBuendel, leseSogBuendel, schreibeStandbilder, berechneDemoLage, standpunkteFuer, weltSplats } from "./assets-node.mjs";
