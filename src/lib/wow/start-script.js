import { WOW_SEEN_KEY } from "./config.js";
import { START_DEADLINE } from "./timeline.js";

// Inline start script of the "Pause" stage (wow-spezifikation §2.2, §4):
// placed as the last child of the image frame, runs while the HTML is parsed
// – before the first paint.
//  - the "less than half in view" check reads the frame WHILE the HTML is
//    parsed (layout of the partial page only). Team Grün (Konsolidierung
//    30.10.2026): the Tempo variant in requestAnimationFrame was measured
//    SLOWER – the rAF callback forced the first style + layout of the WHOLE
//    page (LoAF: 455 ms FrameRequestCallback at 4× CPU) in front of the
//    first paint; LCP p75 Moto G4 ≈ 1,98 s (rAF) vs. ≈ 1,45 s (here), A/B on
//    the same build (qa-screenshots/konsolidierung/gruen.md);
//  - end state at once when the frame is less than half in view (small
//    phones, landscape, back navigation with a scroll position), when the
//    sequence already played in this session, with reduced motion or with the
//    stored "Ruhige Ansicht" (ph-calm-view, so the first frame is already the
//    room – the footer island applies it only after hydration);
//  - push r3 (Wächter #2): the stage WAITS on the paper with the construction
//    lines (data-wow-wait pauses every animation, data-wow-state="line" says
//    so) until WowControls starts the pen – photo decoded, page hydrated and
//    idle. No hydration task falls into the line phase any more;
//  - if the pen has not started START_DEADLINE ms after this script, the
//    script starts the sequence itself with the compositor pen
//    (data-wow-pen="wipe", timeline.js); if the photo is not decoded by then,
//    the end state is FADED in (data-wow-fade, 300 ms – awwwards #5);
//  - any input (pointer, key, wheel, touch) while it plays jumps to the room
//    at once (Wächter #6), also before hydration;
//  - Rat 9,5 (A13, recht 8, § 165 Abs 3 TKG): the "seen" entry is written
//    only on that first input – a passive visit stores nothing.
// data-wow-init tells WowControls that this script ran (client-side
// navigations do not run it; WowControls applies the same rule then).
// Budget 900 B (r2: 600 B; + input skip, deadline fade, calm view – Nachtrag
// in features/wow.md). CSP: the site's policy allows inline scripts
// (report-only); the hash is noted in features/wow.md for a strict policy.
export const START_SCRIPT = `(function(){var b=document.currentScript.parentNode,f=b.parentNode.dataset,s=0,r,w=window,y=function(){try{sessionStorage.setItem("${WOW_SEEN_KEY}",1)}catch(e){}x()},x=function(){if(f.wow=="play"){f.wow="still";f.wowFade="";f.wowState="room";delete f.wowWait}};f.wowInit="";"pointerdown keydown wheel touchstart".split(" ").forEach(function(e){w.addEventListener(e,y,{once:!0,passive:!0})});try{s=sessionStorage.getItem("${WOW_SEEN_KEY}")||localStorage.getItem("ph-calm-view")=="on"}catch(e){}if(s||matchMedia("(prefers-reduced-motion:reduce)").matches)return f.wow="still";f.wowState="line";f.wowWait="";r=b.getBoundingClientRect();if(Math.min(r.bottom,innerHeight)-Math.max(r.top,0)<r.height/2){f.wow="still";f.wowState="room";delete f.wowWait};setTimeout(function(){if("wowWait"in f){if(b.querySelector("img").complete){f.wowPen="wipe";delete f.wowWait}else x()}},${START_DEADLINE})})()`;
