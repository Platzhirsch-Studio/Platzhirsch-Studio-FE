"use client";
// YouTube only as a facade (R5-content, Masterplan AP7 Nr. 5, Bericht 12 C5,
// Masterplan Bau-Regel 9): nothing loads from YouTube or Google until
//   1. the visitor has given the "youtube" consent through ConsentEmbed
//      (src/components/Cookies/ConsentEmbed.js, imported, not changed), and
//   2. clicked "play" on our own poster.
// Only then the iframe on youtube-nocookie.com is created (with autoplay,
// because the click was the request to play).
//
// The poster is OUR image (public/…), never i.ytimg.com: a thumbnail from
// YouTube would already send the visitor's IP to Google before consent.
//
// ConsentEmbed reads its three texts from the "Cookies" namespace, where they
// are written for Google Maps. A nested NextIntlClientProvider gives it the
// video texts for this one embed (props, so every page passes them in its
// language); everything else ConsentEmbed does stays as it is.
// Open (INT / R5-release): "youtube" has no banner entry yet (Dienste-Register
// src/lib/legal/services.js, status "nicht eingesetzt") and the CSP has no
// frame-src for www.youtube-nocookie.com. Both are needed before first use.
import { useState } from "react";
import { NextIntlClientProvider, useLocale } from "next-intl";
import ConsentEmbed from "@/components/Cookies/ConsentEmbed";
import cx from "@/components/ui/cx";
import { isYouTubeId, youTubeEmbedUrl } from "./schema";

export const YOUTUBE_CONSENT_TEXTS_DE = Object.freeze({
  embedTitle: "YouTube-Video ist deaktiviert",
  embedText:
    "Mit dem Laden des Videos werden Daten an YouTube (Google) übermittelt, auch in die USA. Es gilt die Datenschutzerklärung von Google.",
  embedButton: "Video laden",
});

export default function YouTubeFacade({
  videoId,
  title,
  poster,
  width = 16,
  height = 9,
  start,
  playLabel = "Video abspielen",
  consentTexts = YOUTUBE_CONSENT_TEXTS_DE,
  className = "",
}) {
  const locale = useLocale();
  const [playing, setPlaying] = useState(false);
  if (!isYouTubeId(videoId)) throw new Error(`YouTubeFacade: ungültige Video-ID "${videoId}"`);
  if (!poster || /ytimg\.com|youtube\.com/i.test(poster)) throw new Error("YouTubeFacade: eigenes Poster-Bild nötig (kein YouTube-Thumbnail vor der Einwilligung)");

  return (
    <div className={cx("relative w-full bg-surface-band", className)} style={{ aspectRatio: `${width} / ${height}` }}>
      <NextIntlClientProvider locale={locale} messages={{ Cookies: consentTexts }}>
        <ConsentEmbed service="youtube">
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full border-0"
              src={youTubeEmbedUrl(videoId, { start })}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex h-full w-full items-end justify-start bg-cover bg-center p-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-focus"
              style={{ backgroundImage: `url(${JSON.stringify(poster)})` }}
            >
              <span className="inline-flex min-h-12 items-center gap-3 bg-action px-5 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet group-hover:bg-action-hover">
                <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-current">
                  <path d="M4 2.5v11l9-5.5z" />
                </svg>
                <span>
                  {playLabel}
                  <span className="sr-only">: {title}</span>
                </span>
              </span>
            </button>
          )}
        </ConsentEmbed>
      </NextIntlClientProvider>
    </div>
  );
}
