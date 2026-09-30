"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";

/* Last moment the notice may appear: end of the day of the vernissage,
   04.09.2026, in local Austrian time (CEST = UTC+2 in September). */
const LAST_SHOWN_AT = new Date("2026-09-04T23:59:59+02:00").getTime();

const STORAGE_KEY = "ps_vernissage_notice_seen";
const SHOW_EVERY_MS = 7 * 24 * 60 * 60 * 1000; // once a week per visitor
const OPEN_DELAY_MS = 500; // first thing the visitor sees, ahead of the cookie bar

/* localStorage throws in Safari private mode and when storage is disabled,
   so every access is guarded. A failure just means the notice shows again. */
function readLastSeen() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const value = Number(raw);
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

function writeLastSeen(timestamp) {
    try {
        window.localStorage.setItem(STORAGE_KEY, String(timestamp));
    } catch {
        /* storage unavailable – the notice will simply reappear */
    }
}

const VernissagePopup = () => {
    const pathname = usePathname();
    const locale = getLocaleFromPath(pathname);
    const t = useTranslations("Vernissage");

    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // drives the entry transition
    const closeButtonRef = useRef(null);
    const previouslyFocused = useRef(null);

    const dismiss = useCallback(() => {
        writeLastSeen(Date.now());
        setIsVisible(false);
        setIsOpen(false);
    }, []);

    // Decide whether to open. Runs client-side only, so no hydration mismatch.
    useEffect(() => {
        const now = Date.now();
        if (now > LAST_SHOWN_AT) return;
        if (now - readLastSeen() < SHOW_EVERY_MS) return;

        const timer = setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    // Escape to close, focus handling and background scroll lock.
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocused.current = document.activeElement;
        closeButtonRef.current?.focus();

        const raf = requestAnimationFrame(() => setIsVisible(true));

        const onKeyDown = (event) => {
            if (event.key === "Escape") dismiss();
        };
        document.addEventListener("keydown", onKeyDown);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused.current?.focus?.();
        };
    }, [isOpen, dismiss]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                }`}
            onClick={dismiss}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="vernissage-popup-title"
                onClick={(event) => event.stopPropagation()}
                className={`relative isolate w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-linear-to-b from-[#272d34] via-[#30373e] to-[#23282e] shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
            >
                {/* Abstract gold ground, echoing the homepage section */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 720 480"
                    preserveAspectRatio="xMidYMid slice"
                    fill="none"
                    aria-hidden="true"
                >
                    <defs>
                        <radialGradient id="vnp-glow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#d1b250" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#d1b250" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="90" cy="60" r="240" fill="url(#vnp-glow)" />
                    <g stroke="#d1b250" strokeOpacity="0.25" fill="none">
                        <circle cx="640" cy="70" r="150" strokeWidth="1" />
                        <circle cx="640" cy="70" r="210" strokeWidth="0.5" />
                        <path d="M-30 360 Q 180 280 380 350 T 760 300" strokeWidth="1" />
                    </g>
                </svg>

                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={dismiss}
                    aria-label={t("close")}
                    className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-[#d1b250] transition-colors duration-300"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>

                <div className="relative grid grid-cols-1 sm:grid-cols-5">
                    <div className="relative hidden sm:block sm:col-span-2 min-h-[420px]">
                        <Image
                            src="/Images/Vernissage/kaja-el-attar-lebensbaum.jpg"
                            alt={t("altArtworkOne")}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 0px, 40vw"
                        />
                    </div>

                    <div className="sm:col-span-3 p-6 sm:p-8 lg:p-12">
                        <span className="flex items-center gap-3 mb-4">
                            <span className="h-px w-8 bg-[#d1b250]/60" />
                            <span className="text-xs tracking-[0.3em] text-[#d1b250] uppercase">
                                {t("heading")}
                            </span>
                        </span>

                        <h2
                            id="vernissage-popup-title"
                            className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4"
                        >
                            {t("popupTitle")}
                        </h2>

                        <p className="text-white/70 mb-6">{t("popupText")}</p>

                        <div className="flex flex-col gap-3 text-sm text-white/90 mb-8">
                            <span className="flex items-center gap-3">
                                <CalendarDays className="w-4 h-4 shrink-0 text-[#d1b250]" aria-hidden="true" />
                                {t("date")}
                            </span>
                            <span className="flex items-center gap-3">
                                <Clock className="w-4 h-4 shrink-0 text-[#d1b250]" aria-hidden="true" />
                                {t("time")}
                            </span>
                            <span className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 shrink-0 text-[#d1b250]" aria-hidden="true" />
                                {t("location")}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                            <Link
                                href="/news/vernissage-platzhirsch-home-living-kaja-el-attar"
                                locale={locale}
                                onClick={dismiss}
                                className="inline-flex items-center justify-center px-6 py-3 bg-[#d1b250] text-[#30373e] uppercase tracking-wider text-sm font-medium hover:bg-white transition-colors duration-300"
                            >
                                {t("popupCta")}
                            </Link>
                            <button
                                type="button"
                                onClick={dismiss}
                                className="inline-flex items-center justify-center px-6 py-3 text-white/70 uppercase tracking-wider text-sm hover:text-[#d1b250] transition-colors duration-300"
                            >
                                {t("popupDismiss")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VernissagePopup;
