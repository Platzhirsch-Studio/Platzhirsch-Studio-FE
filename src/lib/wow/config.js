// Switches of the "Pause" hero (wow-spezifikation §2.3, §4, §5, §10).

// The armchair contour ON the photo while "Termin wählen" is hovered or
// focused lays a line over furniture in the own photo (probably Minotti
// pieces). Owner sign-off in the image register is still open (§10 Nr. 1) →
// OFF in production until NEXT_PUBLIC_WOW_OVERLAY=1 is set after that sign-off;
// on in development so the team can review it. Push r3: the loupe is gone (the
// comparison slider replaces it); at rest the contour is never shown
// (luxus-cd #2 "Restkontur am linken Sessel").
export const WOW_OVERLAY_INTERACTIONS =
  (process.env.NEXT_PUBLIC_WOW_OVERLAY ?? (process.env.NODE_ENV === "production" ? "0" : "1")) === "1";

// LCP fallback rule (§5): if the production-scale measurement on phones
// reports an LCP above 2.0 s or a different LCP element, set this to false –
// phones then start in the end state, only ≥ 640 px plays the sequence.
export const WOW_MOBILE_SEQUENCE = true;

// "A" = abstracted line graphic (now). "B" = Harald's recorded pen strokes
// (public/wow/strokes-harald.json) – only with his written consent and the
// confirmed title.
export const WOW_PHASE = "A";

export const WOW_IMAGE = "/Images/Home/aboutHome.jpg";

// sessionStorage key: the sequence plays once per session.
export const WOW_SEEN_KEY = "ph-wow-pause";

// Comparison slider (push r4, luxus-cd #3 / Wächter #2 / awwwards #2): at
// rest the photo stands alone (cut 0 – no paper strip, no handle at the edge).
// Once, when the sequence comes to rest by itself, the edge glides to
// WOW_INVITE % and springs back (an invitation, compositor only, not with
// reduced motion); "Die Linie zeigen" opens the comparison at WOW_OPEN %.
// Shares of the frame width in %.
export const WOW_INVITE = 35;
export const WOW_OPEN = 50;
// duration of the invitation (ms): out 40 %, hold 15 %, back 45 %
export const WOW_INVITE_MS = 1400;
