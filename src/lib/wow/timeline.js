// Single source of every time in the "Pause" hero (wow-spezifikation §2).
// WowStage writes these as CSS custom properties (inline style), WowControls
// uses them for the state labels, tests/unit/wow-paths.test.mjs checks them.
//
// Push r3 – three acts instead of four, ONE timeline for every width
// (Antreiber awwwards #2 "drei Akte", Wächter #6 "überall ≤ 2,4 s"):
//   Linie → Licht → Raum. The card model is gone until Phase B brings a photo
//   of a real cardboard model. Phones draw only the "base" paths, on the same
//   clock.
// All values in ms from the moment the pen starts. Two pens (Wächter #2: no
// main-thread animation while hydration tasks run):
//  - "ink": the page is hydrated and idle (WowControls, requestIdleCallback
//    ≤ 600 ms) within START_DEADLINE ms of the start script → every stroke is
//    drawn with stroke-dashoffset (main thread, but the thread is free);
//  - "wipe": not hydrated by then (production Moto G 4× CPU: hydration at
//    ≈ 3.5 s, measured push r3) → the start script starts the sequence itself
//    and the line is revealed by a soft ink mask that travels from the window
//    side – two counter-moving transforms, compositor only, so the hydration
//    tasks (130–390 ms) cannot make it stutter.
// "Raum sichtbar" = release done: START_DEADLINE + room[1] = 850 + 1540 =
// 2390 ms after the start script at worst (start script ≈ first paint).

import { PAUSE_PATHS } from "./pause-paths.js";

export const TIMELINE = {
  // act 1 – the line: construction lines stand from the first paint (server
  // HTML, not drawn); the room in ONE stroke (fast – slow – fast), then the
  // wall edge, the fireplace and the two armchairs, each one stroke.
  line: [60, 900],
  // act 2 – evening light: a warm wedge (≤ 15 %) comes in on the window side
  // of the paper (never over the photo).
  light: [700, 960],
  // act 3 – the light carries the paper away: a soft ink mask travels from the
  // window side to the fireplace wall and frees the photo (compositor only:
  // two counter-moving transforms, see Pause.module.css .sweep / .sheet).
  room: [960, 1540],
  // registration: the line lies on the FULL photo with a warm core – push r4
  // (Wächter #4): 1400 ms, the extension goes into the rest phase only.
  hold: [1540, 2940],
  outro: [2940, 3240],
  end: 3240,
  // the warm core comes on while the mask passes the middle of the frame
  litIn: 1240,
  // explicit strokes [delay, duration] – one hand, one piece after another
  strokes: {
    room: [60, 420],
    "wall-top": [400, 160],
    fireplace: [470, 240],
    "chair-left": [520, 260],
    "chair-right": [600, 260],
    "chair-left-seam": [700, 150],
    "chair-left-foot": [740, 120],
    "chair-left-foot-2": [760, 120],
    "chair-right-seam": [760, 140],
    "chair-right-foot": [780, 120],
    "chair-right-foot-2": [780, 120],
  },
};

// After this the start script starts the "wipe" pen itself (same in dev and
// production). If the photo is not even decoded by then, the room is faded in.
export const START_DEADLINE = 850;

// The acts (data-wow-state: "line" while the stage waits on the paper, "room"
// at rest). Push r4: no visible labels any more (luxus-cd #3).
export const STATES = ["line", "light", "room"];
export const stateStarts = () => ({ line: 0, light: TIMELINE.light[0], room: TIMELINE.room[0] });

// Delay and duration of every pen stroke (guides are static).
export function strokeTimings() {
  const out = {};
  for (const p of PAUSE_PATHS) {
    if (p.kind === "guide") continue;
    const [delay, dur] = TIMELINE.strokes[p.id];
    out[p.id] = { delay, dur };
  }
  return out;
}

// CSS custom properties for the stage.
export function stageVars() {
  const t = TIMELINE;
  const ms = (n) => `${n}ms`;
  return {
    "--w-line-d": ms(t.line[0]),
    "--w-line-t": ms(t.line[1] - t.line[0]),
    "--w-light-d": ms(t.light[0]),
    "--w-light-t": ms(t.light[1] - t.light[0]),
    "--w-rel-d": ms(t.room[0]),
    "--w-rel-t": ms(t.room[1] - t.room[0]),
    "--w-lit-d": ms(t.litIn),
    "--w-outro-d": ms(t.outro[0]),
    "--w-outro-t": ms(t.outro[1] - t.outro[0]),
    "--w-end": ms(t.end),
  };
}
