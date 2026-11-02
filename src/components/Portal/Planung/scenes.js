// Procedural demo scenes for the planning gallery and the 3D view.
// Used as long as a rendering has no real image file (image === null), which
// is the case for all demo data. Shared by server and client (no imports).
//
// A scene is a palette + room type. The same definition drives the SVG
// "visualisation" (RoomVisual) and the 3D room (Scene3D), so A/B/C look
// consistent in 2D and 3D. These are explicitly placeholders, not renderings
// of real products – the UI labels them "Platzhalter-Visualisierung".

export const SCENES = {
  "kueche-bestand": {
    room: "kueche",
    label: "Bestand (Skizze)",
    wall: "#dcd9d3", floor: "#b9b3a8", front: "#c9c4ba", top: "#a8a297", accent: "#8f8a80", metal: "#9a968f", light: 0.35,
    island: false,
  },
  "kueche-a": {
    room: "kueche",
    label: "Nussbaum & Kalkstein",
    wall: "#efe9df", floor: "#c8b89d", front: "#6b4a33", top: "#e6e1d8", accent: "#d1b250", metal: "#30373e", light: 0.8,
    island: true, seats: 0,
  },
  "kueche-b": {
    room: "kueche",
    label: "Graphit & Marmor",
    wall: "#e9e6e1", floor: "#9c958b", front: "#30373e", top: "#f4f2ee", accent: "#c9a96a", metal: "#d6d2ca", light: 0.7,
    island: true, seats: 0,
  },
  "kueche-c": {
    room: "kueche",
    label: "Eiche hell, Insel mit Sitzplatz",
    wall: "#f3efe8", floor: "#d8c7a8", front: "#c7a77c", top: "#3f3129", accent: "#7a5f17", metal: "#3f3129", light: 0.9,
    island: true, seats: 3,
  },
  "wohnen-bestand": {
    room: "wohnen",
    label: "Bestand (Skizze)",
    wall: "#dedbd5", floor: "#bdb6aa", sofa: "#a9a59d", rug: "#c8c3b9", accent: "#8f8a80", metal: "#9a968f", light: 0.35,
  },
  "wohnen-a": {
    room: "wohnen",
    label: "Leinen & Nussbaum",
    wall: "#efe9df", floor: "#b99a74", sofa: "#d9d0c1", rug: "#ece8e1", accent: "#d1b250", metal: "#cfcac1", light: 0.85,
  },
  "wohnen-b": {
    room: "wohnen",
    label: "Salbei & Travertin",
    wall: "#ebe8e0", floor: "#a88a66", sofa: "#8b977f", rug: "#e2d8c6", accent: "#7a5f17", metal: "#e6e1d8", light: 0.8,
  },
  "wohnen-c": {
    room: "wohnen",
    label: "Cognac & Graphit",
    wall: "#e7e3dc", floor: "#6f5a47", sofa: "#9a5b34", rug: "#30373e", accent: "#d1b250", metal: "#d6d2ca", light: 0.75,
  },
};

const ORDER = { kueche: ["kueche-a", "kueche-b", "kueche-c"], wohnen: ["wohnen-a", "wohnen-b", "wohnen-c"] };

export function roomTypeOf(projectRoom = "") {
  return /küche|kueche|kitchen/i.test(projectRoom) ? "kueche" : "wohnen";
}

/** Scene for the n-th variant (0-based) of a room. */
export function sceneFor(roomType, index) {
  const list = ORDER[roomType] || ORDER.wohnen;
  return list[index % list.length];
}

export const beforeSceneFor = (roomType) => `${roomType}-bestand`;

export const VARIANT_LETTERS = ["A", "B", "C", "D", "E", "F"];
