// Paper share per video frame (Wow hero "Pause", push r4, Wächter #1): plays a
// recorded .webm in Chromium (Playwright's ffmpeg cannot write images) and,
// on every decoded frame (requestVideoFrameCallback), measures which share of
// the image frame's width is covered by the drawing paper (#faf8f4 with a
// faint grid). Four rows at 10, 25, 62 and 76 % of the frame height (clear of
// the slider grip and its label around 50 %, and of the phone button at the
// bottom); a column counts as paper when at least two rows are WARM white
// (all channels ≥ 228, red − blue 1…14: the paper is #faf8f4; the photo's
// window highlights are neutral or blue and score ≤ 1 %). Returns
// [{ t: media time s, share: 0…1 }].
// Used by tests/e2e/wow-hero.spec.js (WebKit) and qa-screenshots/wow/push-r4-video.mjs.
import { chromium } from "@playwright/test";
import fs from "node:fs";

export async function paperShares(video, frame) {
  const b = await chromium.launch();
  try {
    const page = await b.newPage();
    await page.route("http://wow.local/**", (r) =>
      r.request().url().endsWith("/v.webm")
        ? r.fulfill({ body: fs.readFileSync(video), contentType: "video/webm" })
        : r.fulfill({ body: '<video src="/v.webm" muted playsinline></video>', contentType: "text/html" }),
    );
    await page.goto("http://wow.local/");
    return await page.evaluate(
      (fr) =>
        new Promise((resolve) => {
          const v = document.querySelector("video");
          const out = [];
          const c = document.createElement("canvas");
          const g = c.getContext("2d", { willReadFrequently: true });
          const paper = (d, i) => {
            const r = d[i], gg = d[i + 1], bb = d[i + 2];
            return Math.min(r, gg, bb) >= 228 && r - bb >= 1 && r - bb <= 14;
          };
          const grab = (now, meta) => {
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            g.drawImage(v, 0, 0);
            const x0 = Math.max(0, Math.round(fr.x)), w = Math.min(c.width - x0, Math.round(fr.w));
            const rows = [0.1, 0.25, 0.62, 0.76].map((k) => g.getImageData(x0, Math.round(fr.y + fr.h * k), w, 1).data);
            let n = 0;
            for (let x = 0; x < w; x++) if (rows.filter((d) => paper(d, x * 4)).length >= 2) n++;
            out.push({ t: +meta.mediaTime.toFixed(3), share: w ? n / w : 0 });
            if (v.ended) return resolve(out);
            v.requestVideoFrameCallback(grab);
          };
          v.onended = () => setTimeout(() => resolve(out), 50);
          v.requestVideoFrameCallback(grab);
          v.play();
        }),
      frame,
    );
  } finally {
    await b.close();
  }
}
