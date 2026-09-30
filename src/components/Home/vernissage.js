"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocaleFromPath } from "@/utils/getLocaleFromPath";
import FadeInView from "@/components/Reusable/FadeInView";

const ARTIST_URL = "https://kajaelattar.de/de/";

/* DOM order is mobile order: the two artworks side by side, the Platzhirsch
   interior full width beneath them. `sm:order-*` restores the invitation
   layout (artwork – interior – artwork) from the small breakpoint up. */
const images = [
    {
        src: "/Images/Vernissage/kaja-el-attar-lebensbaum.jpg",
        altKey: "altArtworkOne",
        direction: "left",
        cell: "col-span-1 sm:order-1",
        ratio: "aspect-3/4",
        offset: "lg:translate-y-8",
        sizes: "(max-width: 640px) 50vw, 33vw",
    },
    {
        src: "/Images/Vernissage/kaja-el-attar-schriftbild.jpg",
        altKey: "altArtworkTwo",
        direction: "right",
        cell: "col-span-1 sm:order-3",
        ratio: "aspect-3/4",
        offset: "lg:translate-y-8",
        sizes: "(max-width: 640px) 50vw, 33vw",
    },
    {
        src: "/Images/Vernissage/minotti-wohnwelt.jpg",
        altKey: "altInterior",
        direction: "bottom",
        cell: "col-span-2 sm:col-span-1 sm:order-2",
        ratio: "aspect-4/3 sm:aspect-3/4",
        offset: "lg:-translate-y-6",
        sizes: "(max-width: 640px) 100vw, 33vw",
    },
];

/* Abstract ground: gold arcs, a soft glow and scattered dots echoing the
   dotted brushwork in the artworks. Purely decorative, hidden from AT. */
const AbstractBackdrop = () => (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
        >
            <defs>
                <radialGradient id="vn-glow-a" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d1b250" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#d1b250" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="vn-glow-b" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8fd6b4" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#8fd6b4" stopOpacity="0" />
                </radialGradient>
                <pattern
                    id="vn-hatch"
                    width="26"
                    height="26"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(35)"
                >
                    <line x1="0" y1="0" x2="0" y2="26" stroke="#d1b250" strokeWidth="0.6" />
                </pattern>
            </defs>

            <circle cx="180" cy="120" r="460" fill="url(#vn-glow-a)" />
            <circle cx="1290" cy="820" r="420" fill="url(#vn-glow-b)" />

            <rect x="980" y="-40" width="520" height="420" fill="url(#vn-hatch)" opacity="0.35" />

            <g stroke="#d1b250" strokeOpacity="0.28" fill="none">
                <circle cx="1180" cy="150" r="230" strokeWidth="1" />
                <circle cx="1180" cy="150" r="330" strokeWidth="0.5" />
                <circle cx="120" cy="760" r="270" strokeWidth="1" />
                <path d="M-60 640 Q 360 470 760 620 T 1520 540" strokeWidth="1.2" />
                <path d="M-60 700 Q 360 530 760 680 T 1520 600" strokeWidth="0.5" />
            </g>

            <g fill="#d1b250" fillOpacity="0.45">
                <circle cx="300" cy="205" r="3" />
                <circle cx="352" cy="168" r="2" />
                <circle cx="404" cy="228" r="2.5" />
                <circle cx="1052" cy="612" r="3" />
                <circle cx="1104" cy="668" r="2" />
                <circle cx="1006" cy="672" r="2.5" />
                <circle cx="720" cy="60" r="2" />
                <circle cx="768" cy="96" r="3" />
            </g>
        </svg>
    </div>
);

const VernissageSection = () => {
    const pathname = usePathname();
    const locale = getLocaleFromPath(pathname);
    const t = useTranslations("Vernissage");

    return (
        <section className="relative isolate overflow-hidden bg-linear-to-b from-[#272d34] via-[#30373e] to-[#23282e]">
            <AbstractBackdrop />

            <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 lg:py-24">
                <FadeInView
                    as="div"
                    direction="bottom"
                    duration={800}
                    distance={30}
                    className="text-center flex flex-col items-center"
                >
                    <span className="flex items-center gap-4 mb-5">
                        <span className="h-px w-10 bg-[#d1b250]/60" />
                        <span className="text-sm tracking-[0.3em] text-[#d1b250] uppercase">
                            {t("heading")}
                        </span>
                        <span className="h-px w-10 bg-[#d1b250]/60" />
                    </span>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl mb-5 max-w-3xl font-bold text-center text-white">
                        {t("title")}
                    </h2>
                    <p className="text-white/70 text-lg max-w-2xl mb-12 lg:mb-16 italic">
                        {t("subtitle")}
                    </p>
                </FadeInView>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-8 lg:px-6">
                    {images.map((image, index) => (
                        <FadeInView
                            key={image.src}
                            as="div"
                            direction={image.direction}
                            duration={800}
                            distance={30}
                            delay={index * 120}
                            className={`transition-transform duration-500 ${image.cell} ${image.offset}`}
                        >
                            <div
                                className={`group relative w-full ${image.ratio} overflow-hidden p-px bg-linear-to-br from-[#d1b250]/50 via-transparent to-[#d1b250]/20`}
                            >
                                <Image
                                    src={image.src}
                                    alt={t(image.altKey)}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes={image.sizes}
                                />
                            </div>
                        </FadeInView>
                    ))}
                </div>

                <FadeInView
                    as="div"
                    direction="bottom"
                    duration={800}
                    distance={30}
                    delay={260}
                    className="mt-14 lg:mt-20 flex flex-col items-center"
                >
                    <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-0 text-white/90">
                        <span className="flex items-center gap-2 sm:px-6">
                            <CalendarDays className="w-5 h-5 text-[#d1b250]" aria-hidden="true" />
                            {t("date")}
                        </span>
                        <span className="hidden sm:block h-5 w-px bg-white/20" />
                        <span className="flex items-center gap-2 sm:px-6">
                            <Clock className="w-5 h-5 text-[#d1b250]" aria-hidden="true" />
                            {t("time")}
                        </span>
                        <span className="hidden sm:block h-5 w-px bg-white/20" />
                        <span className="flex items-center gap-2 sm:px-6">
                            <MapPin className="w-5 h-5 text-[#d1b250]" aria-hidden="true" />
                            {t("location")}
                        </span>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <Link
                            href="/news/vernissage-platzhirsch-home-living-kaja-el-attar"
                            locale={locale}
                            prefetch={true}
                            className="inline-flex items-center justify-center px-8 py-3 bg-[#d1b250] text-[#30373e] uppercase tracking-wider text-sm font-medium hover:bg-white transition-colors duration-300"
                        >
                            {t("cta")}
                        </Link>
                        <a
                            href={ARTIST_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-8 py-3 border border-white/40 text-white uppercase tracking-wider text-sm hover:border-[#d1b250] hover:text-[#d1b250] transition-colors duration-300"
                        >
                            {t("artistLink")}
                        </a>
                    </div>
                </FadeInView>
            </div>
        </section>
    );
};

export default VernissageSection;
