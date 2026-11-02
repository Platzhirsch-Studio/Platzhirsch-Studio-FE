"use client";
import { useSyncExternalStore } from "react";
import { getCookie, setCookie } from "cookies-next";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, PlayCircle } from "lucide-react";
import cx from "@/components/ui/cx";

// Consent gate for third-party embeds (Google Maps / Street View iframes).
// The cookie banner lists Google Maps as an opt-in "functional" service, but
// the iframes used to load unconditionally — i.e. before any consent (GDPR /
// TTDSG issue). The embed now renders only when `cookieConsent.<service>` is
// true; otherwise a placeholder with a one-click "load map" button that stores
// that single service consent (and keeps everything else as it was).
// `ph-consent-change` is dispatched by the cookie banner whenever consent is
// saved, so an open page updates without a reload. The consent is read with
// useSyncExternalStore (cookie + that event): nothing on the server, the
// cookie's value right after hydration – no effect-driven setState.
// Placeholder in the Neuauftritt (R3-shell): band surface, no radius, ink
// frame button that fills on hover – no gold on light (Design-Bibel §4.2).
const CONSENT_EVENT = "ph-consent-change";

// R6-shell-perf: placeholder icon and texts are props now. The defaults are
// unchanged (Cookies.embedTitle/embedText/embedButton, map pin), so the
// Google-Maps embeds and the banner texts stay exactly as they were. A video
// service gets a play icon by default (the YouTube placeholder showed a map
// pin); callers may pass their own title/text/label (e.g. the video texts of
// Video/YouTubeFacade.js) and an icon component, or icon={null} for none.
const DEFAULT_ICONS = { youtube: PlayCircle, vimeo: PlayCircle };

// R6-shell-perf (QM P2): Cookies.embed* in the message catalogue are the
// Google-Maps texts ("Google Maps ist deaktiviert", "Karte laden"). A video
// service without its own props therefore gets its own default texts from
// this table instead. Wording for YouTube = Video/YouTubeFacade.js (DE), plus
// EN/FR/IT. A nested NextIntlClientProvider that replaces the "Cookies"
// namespace (YouTubeFacade does that) still wins: its namespace has no
// banner keys, so ConsentEmbed then reads its embed* texts as before.
const VIDEO_TEXTS = {
  youtube: {
    de: {
      title: "YouTube-Video ist deaktiviert",
      text: "Mit dem Laden des Videos werden Daten an YouTube (Google) übermittelt, auch in die USA. Es gilt die Datenschutzerklärung von Google.",
      label: "Video laden",
    },
    en: {
      title: "YouTube video is disabled",
      text: "Loading the video sends data to YouTube (Google), including to the USA. Google's privacy policy applies.",
      label: "Load video",
    },
    fr: {
      title: "La vidéo YouTube est désactivée",
      text: "En chargeant la vidéo, des données sont transmises à YouTube (Google), y compris aux États-Unis. La politique de confidentialité de Google s’applique.",
      label: "Charger la vidéo",
    },
    it: {
      title: "Il video YouTube è disattivato",
      text: "Caricando il video, i dati vengono trasmessi a YouTube (Google), anche negli Stati Uniti. Si applica l'informativa sulla privacy di Google.",
      label: "Carica il video",
    },
  },
  vimeo: {
    de: {
      title: "Vimeo-Video ist deaktiviert",
      text: "Mit dem Laden des Videos werden Daten an Vimeo übermittelt, auch in die USA. Es gilt die Datenschutzerklärung von Vimeo.",
      label: "Video laden",
    },
    en: {
      title: "Vimeo video is disabled",
      text: "Loading the video sends data to Vimeo, including to the USA. Vimeo's privacy policy applies.",
      label: "Load video",
    },
    fr: {
      title: "La vidéo Vimeo est désactivée",
      text: "En chargeant la vidéo, des données sont transmises à Vimeo, y compris aux États-Unis. La politique de confidentialité de Vimeo s’applique.",
      label: "Charger la vidéo",
    },
    it: {
      title: "Il video Vimeo è disattivato",
      text: "Caricando il video, i dati vengono trasmessi a Vimeo, anche negli Stati Uniti. Si applica l'informativa sulla privacy di Vimeo.",
      label: "Carica il video",
    },
  },
};

/** Default texts for a service: Maps texts from the catalogue, video texts from VIDEO_TEXTS. */
export function defaultEmbedTexts(service, locale, t) {
  const video = VIDEO_TEXTS[service];
  // Global catalogue (has the banner keys) -> its embed* texts are Maps texts.
  if (video && t.has("bannerTitle")) return video[locale] || video.de;
  return { title: t("embedTitle"), text: t("embedText"), label: t("embedButton") };
}

function readConsent() {
  try {
    const raw = getCookie("cookieConsent");
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function subscribe(callback) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}
const deniedOnServer = () => false;

export default function ConsentEmbed({
  service = "googleMaps",
  className = "",
  title,
  text,
  label,
  icon,
  children,
}) {
  const t = useTranslations("Cookies");
  const locale = useLocale();
  const allowed = useSyncExternalStore(subscribe, () => Boolean(readConsent()[service]), deniedOnServer);

  const allow = () => {
    const current = readConsent();
    const next = { ...current, essential: true, [service]: true };
    // Category flag mirrors the banner's own rule (functional = Maps; the
    // googleTagManager switch controls nothing, C4).
    if (service === "googleMaps") next.functional = true;
    setCookie("cookieConsent", JSON.stringify(next), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: window.location.protocol === "https:",
    });
    // The event re-reads the cookie here and in the banner.
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
  };

  if (allowed) return children;

  const defaults = defaultEmbedTexts(service, locale, t);

  // icon: a component (lucide or own), null = none, undefined = per service.
  const Icon = icon === undefined ? DEFAULT_ICONS[service] || MapPin : icon;

  return (
    <div
      className={cx(
        "flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-band px-6 py-10 text-center text-text",
        className
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-7 text-text-soft" strokeWidth={1.5} />}
      <p className="text-ui font-medium">{title ?? defaults.title}</p>
      <p className="max-w-measure text-small text-text-soft">{text ?? defaults.text}</p>
      <button
        type="button"
        onClick={allow}
        className="mt-2 inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper"
      >
        {label ?? defaults.label}
      </button>
    </div>
  );
}
