// Stil-Finder: material photos for the PDF preview on the result page
// (static imports → next/image with intrinsic size). Same files as the PDF
// (src/lib/stilfinder/materials, ambientCG CC0) and the same assignment as
// PROFILE_MATERIALS in src/lib/stilfinder/materials.js – keep both in sync.
// Client-safe: no node imports.
import eicheGeraeuchert from "../../../lib/stilfinder/materials/eiche-geraeuchert.jpg";
import boucle from "../../../lib/stilfinder/materials/boucle.jpg";
import travertin from "../../../lib/stilfinder/materials/travertin.jpg";
import nussbaum from "../../../lib/stilfinder/materials/nussbaum.jpg";
import leinenOliv from "../../../lib/stilfinder/materials/leinen-oliv.jpg";
import terrazzo from "../../../lib/stilfinder/materials/terrazzo.jpg";
import teak from "../../../lib/stilfinder/materials/teak.jpg";
import geflecht from "../../../lib/stilfinder/materials/geflecht.jpg";
import quarzit from "../../../lib/stilfinder/materials/quarzit.jpg";
import nussbaumDunkel from "../../../lib/stilfinder/materials/nussbaum-dunkel.jpg";
import samt from "../../../lib/stilfinder/materials/samt.jpg";
import calacatta from "../../../lib/stilfinder/materials/calacatta.jpg";
import eicheHell from "../../../lib/stilfinder/materials/eiche-hell.jpg";
import filz from "../../../lib/stilfinder/materials/filz.jpg";
import beton from "../../../lib/stilfinder/materials/beton.jpg";

export const PREVIEW_MATERIALS = {
  ruhe: [eicheGeraeuchert, boucle, travertin],
  warm: [nussbaum, leinenOliv, terrazzo],
  see: [teak, geflecht, quarzit],
  salon: [nussbaumDunkel, samt, calacatta],
  klar: [eicheHell, filz, beton],
};

// Visual P1-5: names for the swatches on the web moodboard, same order as
// PREVIEW_MATERIALS, labels as MATERIAL_TEXTURES in src/lib/stilfinder/materials.js.
export const PREVIEW_MATERIAL_LABELS = {
  ruhe: ["Eiche geräuchert", "Bouclé", "Travertin"],
  warm: ["Nussbaum geölt", "Leinen in Oliv", "Terrazzo"],
  see: ["Teak", "Geflecht", "Quarzit"],
  salon: ["Nussbaum poliert", "Samt Bordeaux", "Marmor mit Zeichnung"],
  klar: ["Eiche hell furniert", "Wollfilz", "Beton"],
};
