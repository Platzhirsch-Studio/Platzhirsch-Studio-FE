// Prototyp "Dreiländereck" – Logo, Farben, Schrift auf einer Seite.
import { notFound } from "next/navigation";
import s from "@/components/Preview/dreilaendereck/dl.module.css";
import { Logo, LogoMark } from "@/components/Preview/dreilaendereck/Logo";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Logo & Gestaltung – Prototyp Dreiländereck",
  description: "Logo-Konzept, Farben und Schriften des Design-Prototyps Dreiländereck. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const COLORS = [
  { name: "Kalk", token: "--dl-paper", hex: "#f7f2ea", use: "Seitenhintergrund" },
  { name: "Leinen", token: "--dl-linen", hex: "#efe7da", use: "ruhige Bänder" },
  { name: "Sand", token: "--dl-sand", hex: "#e4d8c5", use: "Termin, Platzhalter" },
  { name: "Ton", token: "--dl-clay", hex: "#cdb89b", use: "Linien, Illustration" },
  { name: "See", token: "--dl-lake", hex: "#36596a", use: "Fokus, Links, Karte (6,7 : 1 auf Kalk)" },
  { name: "Ziegel", token: "--dl-brick", hex: "#a0502e", use: "einziger gefüllter Button (5,7 : 1 mit Weiß)" },
  { name: "Tinte", token: "--dl-ink", hex: "#2a2622", use: "Text (13,5 : 1 auf Kalk)" },
  { name: "Espresso", token: "--dl-espresso", hex: "#2b2420", use: "eine dunkle Fläche je Seite: Abende" },
];

export default async function LogoPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  return (
    <>
      <section className={s.section} aria-labelledby="dl-logo-title">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Erscheinungsbild</p>
              <h1 id="dl-logo-title" className={s.h1}>
                „Vier Enden“ – <span className={s.italic}>ein Hirsch am See.</span>
              </h1>
            </div>
            <p className={s.lead} style={{ margin: 0 }}>
              Der Name bleibt, das Zeichen wird ruhiger. Eine Abendsonne auf dem Horizont, darunter die Wellen des
              Bodensees, darüber ein Geweih mit genau vier Enden: Österreich, Deutschland, Schweiz, Liechtenstein.
            </p>
          </div>

          <div className={s.logoStage}>
            <Logo variant="stacked" />
          </div>

          <div className={s.logoGrid} style={{ marginTop: 16 }}>
            <div style={{ background: "var(--dl-linen)" }}>
              <Logo />
              <span className={s.small}>Querformat für Header und E-Mail</span>
            </div>
            <div style={{ background: "var(--dl-espresso)", color: "var(--dl-on-dark)" }}>
              <LogoMark size={88} title="Bildmarke hell auf Espresso" />
              <span style={{ color: "var(--dl-on-dark-soft)" }}>Bildmarke für Favicon, Stempel, Tasse</span>
            </div>
            <div style={{ background: "var(--dl-brick)", color: "#fff" }}>
              <Logo variant="stacked" tagline={false} />
              <span>Einladung, Schaufenster</span>
            </div>
          </div>
          <style>{`[data-preview] .${s.logoGrid} svg{width:min(240px,80%);height:auto}`}</style>
        </div>
      </section>

      <section className={`${s.sectionTight} ${s.bgLinen}`} aria-labelledby="dl-colors">
        <div className={s.container}>
          <h2 id="dl-colors" className={s.h2} style={{ marginBottom: 32 }}>
            Farben: Bodensee-Licht
          </h2>
          <ul className={s.swatches} style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {COLORS.map((c) => (
              <li key={c.token} className={s.swatch}>
                <div style={{ background: c.hex }} />
                <div>
                  <strong>{c.name}</strong> <code>{c.hex}</code>
                  <br />
                  <span className={s.small}>{c.use}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.sectionTight} aria-labelledby="dl-type">
        <div className={s.container}>
          <h2 id="dl-type" className={s.h2} style={{ marginBottom: 32 }}>
            Schrift
          </h2>
          <div className={s.split} style={{ alignItems: "start" }}>
            <div>
              <p className={s.overline}>Display · Fraunces (OFL), Achse „SOFT“</p>
              <p className={s.display} style={{ margin: 0 }}>
                Abende <span className={s.italic}>am See</span>
              </p>
              <p className={s.small}>Ab 28 px, Gewicht 350–400, weiche Serifen. Kursiv für den zweiten Gedanken einer Zeile.</p>
            </div>
            <div>
              <p className={s.overline}>Text &amp; UI · Instrument Sans (OFL)</p>
              <p className={s.lead} style={{ color: "var(--dl-ink)" }}>
                Ausstellung und Café in Lochau, fünf Minuten von Lindau. Wir planen mit Ihnen Wohnen, Küche und Outdoor.
              </p>
              <p className={s.small}>
                17 px Fließtext, Zeilenhöhe 1,6, max. 68 Zeichen. Versalien nur für Overlines (12 px, Sperrung 0,16 em).
                Ziffern tabellarisch für Zeiten und Maße.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
