// Path data of the homepage pictograms (pure module – Pictos.js renders them,
// the sprite generator and node --test load them). R5-fix P2 (HTML size of
// /de): the paths live once in the static sprite PICTO_SPRITE instead of in
// the HTML and again in the RSC payload of every page that shows them.
// Regenerate after a change (tests/unit/r9-p2-html-size.test.mjs checks it):
//   node --input-type=module -e "import { pictoSprite } from './src/components/Home/pictoPaths.js'; import fs from 'node:fs'; fs.writeFileSync('public/Images/Home/pictos.svg', pictoSprite())"
export const PICTO_SPRITE = "/Images/Home/pictos.svg";

export const PATHS = {
  // 01 Kennenlernen – two cups on saucers (café, conversation)
  s1: "M7 23h12v6a6 6 0 0 1-12 0z M19 25h2.5a2.5 2.5 0 0 1 0 5H19 M5 38h16 M27 23h12v6a6 6 0 0 1-12 0z M39 25h2.5a2.5 2.5 0 0 1 0 5H39 M25 38h16 M13 17c-1.5-2 1.5-3 0-5 M33 17c-1.5-2 1.5-3 0-5",
  // 02 Vor Ort – room outline under the arc of the sun (light during the day)
  s2: "M8 42V24h32v18z M8 42h12 M28 42h12 M20 42a8 8 0 0 1 8-8 M10 15a14 9 0 0 1 28 0 M24 3v3 M11 9l2 2 M37 9l-2 2",
  // 03 Handzeichnung – pencil over a drawn line
  s3: "M31 6l9 9-19 19-11 2 2-11z M27 10l9 9 M12 25l9 9 M6 43c5-3 8 1 13-1s8-3 13-1",
  // 04 Modell – room model as an isometric box with an open wall
  s4: "M24 7l16 8v17l-16 9-16-9V15z M8 15l16 8 16-8 M24 23v18 M14 18v14 M34 18v14",
  // 05 3D-Planung – plan grid with a dimension chain
  s5: "M8 8h32v26H8z M16 8v26 M24 8v26 M32 8v26 M8 16h32 M8 25h32 M8 41h32 M8 38v6 M40 38v6",
  // 06 Rendering – frame with light falling on a room
  s6: "M6 9h36v30H6z M6 31l11-9 8 6 7-8 10 8 M34 18a3 3 0 1 0 0-.01",
  // 07 Umsetzung – the finished sofa in the room
  s7: "M7 33v-8a3 3 0 0 1 6 0v3h22v-3a3 3 0 0 1 6 0v8z M13 28v-7a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v7 M10 33v5 M38 33v5 M4 41h40",
  // Leistungen
  kitchen: "M6 22h36v18H6z M6 28h36 M18 28v12 M30 28v12 M12 16a2.5 2.5 0 1 0 0-.01 M20 16a2.5 2.5 0 1 0 0-.01 M30 8v8 M26 16h8",
  interior: "M24 4v7 M15 18a9 6 0 0 1 18 0z M10 42V31a4 4 0 0 1 8 0v4h12v-4a4 4 0 0 1 8 0v11z M14 42v3 M34 42v3",
  outdoor: "M7 19a17 11 0 0 1 34 0z M24 8v35 M16 43h16 M4 33h8 M36 33h8 M15 19c0-4 4-8 9-11 M33 19c0-4-4-8-9-11",
  // Hotel, Gastronomie & Objekt (Runde 2 P2): reception bell on the counter
  objekt: "M10 33a14 14 0 0 1 28 0z M24 19v-3 M20 16h8 M6 33h36 M6 38h36 M14 28a10 10 0 0 1 6-6",
  yacht: "M5 33h38l-6 8H11z M24 7v24 M24 9l13 20H24 M24 14l-10 15h10 M3 45c4 0 4-2 8-2s4 2 8 2 4-2 8-2 4 2 8 2 4-2 8-2",
};


/** Content of public/Images/Home/pictos.svg (vector-effect on the path itself: it is not inherited through <use>). */
export function pictoSprite() {
  const body = Object.entries(PATHS)
    .map(([id, d]) => `<path id="${id}" d="${d}" vector-effect="non-scaling-stroke"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>
`;
}

export const PICTO_NAMES = Object.keys(PATHS);
