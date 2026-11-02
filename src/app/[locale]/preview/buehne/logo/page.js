import { notFound } from "next/navigation";
import s from "@/components/Preview/buehne/buehne.module.css";
import { AntlerMark, LogoHorizontal, LogoStacked } from "@/components/Preview/buehne/Logo";
import { NOINDEX } from "@/components/Preview/buehne/content";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Logo-Konzept | Prototyp Platzhirsch",
  robots: NOINDEX,
});

const COLORS = [
  { name: "Nacht", hex: "#0E0D0C", use: "Grundfläche, Video- und Bildbühne" },
  { name: "Kohle", hex: "#171513", use: "Zweite Fläche, Footer, Showroom-Band" },
  { name: "Knochen", hex: "#EFE9DF", use: "Text und Logo auf Dunkel" },
  { name: "Stein", hex: "#B9AE9F", use: "Fließtext sekundär (9,3:1 auf Nacht)" },
  { name: "Gold", hex: "#D1B250", use: "Akzent: Bildmarke, Fokus, CTA (9,6:1 auf Nacht)" },
];

export default async function LogoPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  return (
    <div className="pt-32">
      <section className={s.container} aria-labelledby="logo-title">
        <p className={s.overline}>Erscheinungsbild · Konzept</p>
        <h1 id="logo-title" className={`${s.display} ${s.h1} mt-5`}>
          Die Krone <span className={s.italic}>auf dem Punkt.</span>
        </h1>
        <p className={`${s.lead} mt-8`}>
          Die Bildmarke zeigt ein Geweih aus einer einzigen, feinen Linie – der Hirsch. Es ruht auf einem goldenen
          Punkt – der Platz, unser Haus in Lochau. Die Wortmarke steht in einer weit gesperrten Bodoni: italienische
          Eleganz, ruhig statt laut. Der Name „Platzhirsch“ bleibt, der Ton wird leiser.
        </p>
      </section>

      <section className={`${s.container} mt-16`} aria-label="Logo-Varianten">
        <div className={s.logoBoard}>
          <div className={s.logoTile}>
            <LogoStacked className="w-full max-w-xs text-[#efe9df]" />
          </div>
          <div className={s.logoTileLight}>
            <LogoStacked className="w-full max-w-xs" color="#1a1715" />
          </div>
          <div className={s.logoTileGold}>
            <div className="text-center">
              <AntlerMark className="mx-auto h-28 w-28" accent="#0e0d0c" title="Bildmarke einfarbig" />
              <p className="mt-4 text-xs tracking-[0.3em] uppercase">Bildmarke · Favicon · Prägung</p>
            </div>
          </div>
          <div className={`${s.logoTile} md:col-span-3`}>
            <LogoHorizontal className="w-full max-w-2xl text-[#efe9df]" />
          </div>
        </div>
      </section>

      <section className={`${s.container} ${s.section}`} aria-labelledby="palette-title">
        <h2 id="palette-title" className={`${s.display} ${s.h2}`}>
          Farben
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLORS.map((c) => (
            <li key={c.hex}>
              <div className="aspect-4/3 border border-[rgba(239,233,223,0.14)]" style={{ background: c.hex }} />
              <p className="mt-3 font-medium">{c.name}</p>
              <p className={`${s.muted} text-sm`}>
                {c.hex} · {c.use}
              </p>
            </li>
          ))}
        </ul>

        <h2 className={`${s.display} ${s.h2} mt-24`}>Schrift</h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div>
            <p className={s.overline}>Display · Bodoni Moda</p>
            <p className={`${s.display} mt-4`} style={{ fontSize: "clamp(3rem,6vw,5.5rem)" }}>
              Aa <span className={s.italic}>Wohnen</span>
            </p>
            <p className={`${s.muted} mt-3 text-sm`}>Headlines, Raumnamen, Zahlen. OFL, über next/font selbst gehostet.</p>
          </div>
          <div>
            <p className={s.overline}>Text · Instrument Sans</p>
            <p className="mt-4" style={{ fontSize: "clamp(3rem,6vw,5.5rem)", lineHeight: 1 }}>
              Aa Küche
            </p>
            <p className={`${s.muted} mt-3 text-sm`}>
              Fließtext, Navigation, Labels. Ruhige Grotesk statt Montserrat (Vorschlag aus Bauplan 01).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
