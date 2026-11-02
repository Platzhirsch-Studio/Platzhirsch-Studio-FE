// src/components/Video/InlineVideo.js — own video files (MP4/WebM) as a
// native <video> (R5-content, Masterplan AP7 Nr. 5, Bericht 12 C5,
// node_modules/next/dist/docs/01-app/02-guides/videos.md).
//
// Server Component, 0 KB client JS unless `ambient` is set.
//   - poster + preload="none": no video byte loads before "play"
//   - width/height → aspect-ratio, the box is reserved (no CLS)
//   - native controls: keyboard (Tab, Space/Enter, arrow keys) and screen
//     readers work in every browser; accessible name from `title`
//   - at least one caption track (<track>), optional transcript (<details>)
//   - never autoplays. `ambient` (muted loop without sound content) starts
//     only when the visitor allows motion: not with prefers-reduced-motion
//     and not with the "Ruhige Ansicht" switch (data-motion="reduced",
//     Design-Bibel §8.4). Controls stay, so it can always be paused (2.2.2).
//   - optional VideoObject JSON-LD (only with name, poster and uploadDate)
// Third-party video (YouTube) is NOT handled here: see YouTubeFacade.js.
// Not used on any public page yet; demo: /de/projekte/vorlage (noindex).
import JsonLd from "@/components/Reusable/JsonLd";
import { cx } from "@/components/ui";
import AmbientPlay from "./AmbientPlay";
import { inlineVideoProblems, sourceType, videoObjectSchema } from "./schema";

/**
 * @param {object}   props
 * @param {string}   props.id          stable id (DOM id, ambient starter)
 * @param {string}   props.title       accessible name, also the schema name
 * @param {{src:string,type?:string}[]} props.sources  MP4 (H.264) first is the widest support
 * @param {string}   props.poster      own image (public/…), required
 * @param {{src:string,srcLang:string,label:string,kind?:string,default?:boolean}[]} props.tracks
 * @param {number}   props.width       intrinsic width (aspect ratio)
 * @param {number}   props.height      intrinsic height
 * @param {string}  [props.caption]    visible caption under the video
 * @param {string}  [props.transcript] text version (WCAG 1.2.1/1.2.3)
 * @param {string}  [props.transcriptLabel]
 * @param {string}  [props.fallback]   text for browsers without <video>
 * @param {boolean} [props.ambient]    muted loop, starts only if motion is allowed
 * @param {object}  [props.schema]     { uploadDate, duration, description, inLanguage } → VideoObject
 * @param {string}  [props.siteUrl]    to make schema URLs absolute
 */
export default function InlineVideo({
  id,
  title,
  sources,
  poster,
  tracks = [],
  width,
  height,
  caption,
  transcript,
  transcriptLabel = "Text zum Video",
  fallback = "Ihr Browser kann dieses Video nicht abspielen.",
  ambient = false,
  schema,
  siteUrl,
  className = "",
}) {
  const problems = inlineVideoProblems({ sources, poster, tracks, title, width, height });
  if (problems.length) throw new Error(`InlineVideo "${id || title}": ${problems.join(", ")}`);

  const jsonLd = schema ? videoObjectSchema({ ...schema, name: title, poster, sources }, { siteUrl }) : null;
  const captionId = caption ? `${id}-caption` : undefined;

  return (
    <figure className={cx("m-0", className)}>
      <div className="relative w-full bg-surface-band" style={{ aspectRatio: `${width} / ${height}` }}>
        <video
          id={id}
          className="block h-full w-full object-cover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          controls
          preload="none"
          playsInline
          poster={poster}
          width={width}
          height={height}
          aria-label={title}
          aria-describedby={captionId}
          {...(ambient ? { muted: true, loop: true } : {})}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type || sourceType(s.src)} />
          ))}
          {tracks.map((t, i) => (
            <track
              key={t.src}
              src={t.src}
              kind={t.kind || "captions"}
              srcLang={t.srcLang}
              label={t.label}
              default={t.default ?? i === 0}
            />
          ))}
          {fallback}
        </video>
        {ambient && <AmbientPlay targetId={id} />}
      </div>
      {caption && (
        <figcaption id={captionId} className="mt-2 text-small text-text-soft">
          {caption}
        </figcaption>
      )}
      {transcript && (
        <details className="mt-3 border-t border-line pt-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-ui text-text underline-offset-4 hover:underline">
            {transcriptLabel}
          </summary>
          <p className="mt-2 max-w-measure whitespace-pre-line text-body text-text">{transcript}</p>
        </details>
      )}
      {jsonLd && <JsonLd data={jsonLd} />}
    </figure>
  );
}
