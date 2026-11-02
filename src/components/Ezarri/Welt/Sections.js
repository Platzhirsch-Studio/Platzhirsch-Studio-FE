// Abschnitte der Ezarri-Startseite und der Einsatz-Welten (Server-Komponenten).
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Horizon } from "@/components/ui";
import { imageSources } from "@/lib/ezarri/images";
import { ezarriCredit } from "@/lib/ezarri/config";
import { ezCopy, ezLang, ezT } from "@/lib/ezarri/lang";
import EzImage from "./EzImage";
import styles from "./ezarri.module.css";
import { CARD_LINK, IMAGE_HOVER, staggerStyle } from "@/lib/ezarri/motion";
import { festerCode } from "@/lib/ezarri/einheit";

// Musterkacheln der Wasserwirkung (QM r4): schmal als Zeile (Bild 4 rem links, Name rechts),
// ab 18 rem Blockbreite wieder als Kachel (Bild oben, Name darunter).
const MUSTER_ZEILE = "flex items-center gap-3 @[18rem]/ws:block";
const MUSTER_BILD = "w-16 shrink-0 @[18rem]/ws:w-auto";
const MUSTER_NAME = "block min-w-0 text-small leading-snug text-pretty [overflow-wrap:break-word] @[18rem]/ws:mt-1";

/**
 * Hero „Wasserlinie“: Bild 21:9 (Desktop) bzw. 4:5 (mobil) als <picture> mit
 * Art Direction. Mobil eine eigene 4:5-Fassung (nur Zuschnitt, Bildinhalt
 * unverändert, Konzept §1.1) mit srcset 480w/853w statt der hochskalierten
 * 600er-Querformat-Datei (QM Runde 2, P2-5). `image.mobil` = Basis der
 * Mobil-Dateien (<basis>-m480/-m853.{avif,webp}); fehlt sie, gilt das alte Verhalten.
 * Die Signatur-Linie liegt je Bild auf der Wasserkante (`linie` = {mobil, desktop}
 * in % der Bildhöhe, QM Runde 2, P3-1); ohne Angabe steht sie unter dem Bild.
 */
export function HeroImage({ image, alt, linie }) {
  const lang = ezLang(useLocale());
  const s = imageSources(image);
  if (!s) return null;
  const m = image.mobil;
  // R2 gesamtwerk P2 / technik P1-1: mobil 4:3 (H1 im ersten Bildschirm) mit eigener,
  // kleinerer LCP-Fassung (-q480/-q720 ≈ 10/21 KB AVIF statt -m853 ≈ 67 KB), nur Zuschnitt.
  const q = image.mobil43;
  const mobileSet = (ext) =>
    q ? `${q}-q480.${ext} 480w, ${q}-q720.${ext} 720w` : m ? `${m}-m480.${ext} 480w, ${m}-m853.${ext} 853w` : `${image.web}-600.${ext}`;
  return (
    <figure>
      {/* R8 (gesamtwerk P1-4): mobil 16:10, höchstens 40 svh – die H1 steht davor im ersten Bildschirm. */}
      <div className={`relative ${q ? "aspect-[16/10] max-h-[40svh] w-full" : "aspect-[4/5]"} overflow-hidden bg-linen md:aspect-[21/9] md:max-h-none`}>
        <picture>
          <source media="(min-width: 768px)" type="image/avif" srcSet={`${image.web}-1600.avif`} />
          <source media="(min-width: 768px)" type="image/webp" srcSet={`${image.web}-1600.webp`} />
          <source type="image/avif" srcSet={mobileSet("avif")} sizes="100vw" />
          <source type="image/webp" srcSet={mobileSet("webp")} sizes="100vw" />
          { }
          <img src={s.src} alt={alt} width={s.width} height={s.height} fetchPriority="high" decoding="async" className="absolute inset-0 size-full object-cover" />
        </picture>
        {linie && (
          <div className={styles.wasserlinie} style={{ "--ez-linie-m": linie.mobil, "--ez-linie-d": linie.desktop }}>
            <Horizon tone="dark" />
          </div>
        )}
      </div>
      {!linie && <Horizon className="mt-3" />}
      <figcaption className="mt-2 text-small text-text-soft">{ezarriCredit("bild", lang)}</figcaption>
    </figure>
  );
}

/**
 * Kachel einer Einsatz-Welt (1:1 Bild, Name, Zeile „n Mosaike geeignet · m mit Projektbild“).
 * `alt` beschreibt den Bildinhalt (copy.WELTEN[].bild.alt), nicht den Filterbegriff.
 */
export function WeltTile({ welt, image, alt, meta, count, headingLevel = 3, boxClassName, sizes = "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw" }) {
  const H = `h${headingLevel}`;
  const locale = useLocale();
  const { alt: altText } = ezCopy(locale);
  return (
    <article className="group relative">
      <EzImage
        image={image}
        alt={alt ?? altText.anwendung(null, welt.label)}
        ratio="1/1"
        sizes={sizes}
        boxClassName={boxClassName}
        imgClassName={IMAGE_HOVER}
      />
      <H className="mt-3 text-title text-text">
        <Link href={`/ezarri/${welt.id}`} className={`ph-stretched underline-offset-4 ${CARD_LINK}`}>
          {welt.label}
        </Link>
      </H>
      {/* QM r1 (ezarri-yacht): Teile („n Mosaike geeignet“, „m mit Projektbild“) stehen als
          eigene Zeilen ohne führenden Trennpunkt; jede Kachel reserviert zwei Zeilen (gleich hohe
          Kacheln, auch Fassade ohne Projektbild-Zahl); bei 200 % Text bricht der Text in der
          Kachel um, statt in die Nachbarkachel zu laufen.
          QM r4: break-word statt anywhere – bei großer Schrift steht die Kachel einspaltig, kein
          Wortbruch mehr („Projektbil|d“). */}
      <p className="min-h-[2lh] min-w-0 text-small tabular-nums text-text-soft [overflow-wrap:break-word]">
        {String(meta ?? ezT(locale)(`${count} Mosaike`, `${count} mosaics`, `${count} mosaïques`, `${count} mosaici`))
          .split(" · ")
          .map((teil, i) => (
            <span key={i} className="block">
              {teil}
            </span>
          ))}
      </p>
    </article>
  );
}

/**
 * Wasserwirkung als Streifen (Signature „Lichtnetz“ einmal je Seite, nur
 * über dem ersten Bild). items: [{w:{id,label}, image, mosaics:[card]}].
 * Ohne Interaktion lesbar: Jeder Streifen zeigt Bild, Text, 3 Mosaike, Link.
 */
export function WasserStreifen({ items, signature = true, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  const lang = ezLang(useLocale());
  const en = lang !== "de";
  const t = ezT(lang);
  const { WASSER, alt: altText } = ezCopy(lang);
  return (
    <>
      {signature && (
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter id="ez-lichtnetz">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="2" seed="7" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 9 -4" />
            <feComposite in="SourceGraphic" operator="in" />
          </filter>
        </svg>
      )}
      <ul className="grid grid-cols-1 gap-x-grid gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ w, image, imageName, mosaics }, i) => (
          // QM r1: Subgrid (6 Zeilen) – Mustermosaike und Link stehen in allen Spalten auf einer Linie,
          // auch wenn der Text einer Spalte eine Zeile länger ist (Türkisblau, Graugrün).
          // QM r2: KEIN @container am <li> – container-type erzwingt Layout-Containment, damit ignoriert
          // Chromium `subgrid` (Spuren je 1/6 Höhe → Bildspur h=0, Fotos weg). Der Container sitzt am Musterblock.
          <li key={w.id} className="reveal flex flex-col sm:row-span-6 sm:grid sm:grid-rows-subgrid sm:gap-y-0" style={staggerStyle(i, 3)}>
            <div className="relative overflow-hidden">
              <EzImage image={image} alt={altText.anwendung(imageName, en ? t("", `water effect ${w.label.toLowerCase()}`, `effet d’eau ${w.label.toLowerCase()}`, `effetto dell’acqua ${w.label.toLowerCase()}`) : `Wasserwirkung ${w.label}`)} ratio="3/2" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
              {signature && i === 0 && <span aria-hidden="true" className={styles.lichtnetz} />}
            </div>
            <p className="mt-4 text-overline uppercase text-see">{t("Wasserwirkung", "Water effect", "Effet d’eau", "Effetto dell’acqua")}</p>
            <H className="mt-1 text-title text-text">{w.label}</H>
            <p className="mt-2 max-w-measure text-body text-text-soft">{WASSER.texte[w.id]}</p>
            {mosaics.length === 0 ? <div aria-hidden="true" /> : (
              // QM r2 (iphone-se): Musterblock immer volle Spaltenbreite (vorher self-start → Breite nach Inhalt,
              // je Abschnitt andere Mustergrößen). 3 Muster: 3 Spalten; 4 Muster: 2 × 2, breit alle 4 in einer Reihe.
              // QM r4 (200 % Text, auch 1440 px): ist der Block schmaler als 18 rem, stehen die Muster als Liste
              // (kleines Bild links, Name rechts) – vorher brachen die Namen mitten im Wort („Sagitta|rius“).
              // Alle Namen in derselben Textfarbe (vorher waren die ohne eigene Seite heller grau).
              <div className="@container/ws mt-4 w-full min-w-0 sm:self-start">
              <ul className={`grid grid-cols-1 gap-3 ${mosaics.length === 4 ? "@[18rem]/ws:grid-cols-2 @[30rem]/ws:grid-cols-4" : "@[18rem]/ws:grid-cols-3"}`} aria-label={t(`Mosaike für ${w.label}`, `Mosaics for ${w.label.toLowerCase()} water`, `Mosaïques – effet ${w.label.toLowerCase()}`, `Mosaici – effetto ${w.label.toLowerCase()}`)}>
                {mosaics.map((m) => (
                  <li key={m.id} className="min-w-0">
                    {/* R5 seo P2-5: Nur indexierbare Mosaikseiten (Sitemap-Quelle isIndexableMosaik) sind hier Links; Beinahe-Dubletten (noindex) zeigen nur Bild und Namen – erreichbar bleiben sie über „Alle Mosaike für …“. */}
                    {m.indexierbar === false ? (
                      <div data-ez-mosaik-ohne-link="" className={MUSTER_ZEILE}>
                        <EzImage image={m.bild} alt="" ratio="1/1" sizes={mosaics.length === 4 ? "(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw" : "(min-width: 1024px) 120px, (min-width: 640px) 15vw, 30vw"} className={MUSTER_BILD} />
                        <span className={`${MUSTER_NAME} text-text`}>{festerCode(m.name)}</span>
                      </div>
                    ) : (
                      <Link href={`/ezarri/mosaike/${m.id}`} className={`group ${MUSTER_ZEILE}`}>
                        <EzImage image={m.bild} alt="" ratio="1/1" sizes={mosaics.length === 4 ? "(min-width: 1024px) 180px, (min-width: 640px) 22vw, 45vw" : "(min-width: 1024px) 120px, (min-width: 640px) 15vw, 30vw"} imgClassName={IMAGE_HOVER} className={MUSTER_BILD} />
                        <span className={`${MUSTER_NAME} text-text underline-offset-4 ${CARD_LINK}`}>{festerCode(m.name)}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              </div>
            )}
            <Link href={`/ezarri/mosaike?wasser=${w.id}`} className="mt-3 inline-flex min-h-11 items-center self-start justify-self-start text-ui text-text underline underline-offset-4">
              {t(`Alle Mosaike für ${w.label}`, `All mosaics for ${w.label.toLowerCase()} water`, `Toutes les mosaïques – effet ${w.label.toLowerCase()}`, `Tutti i mosaici – effetto ${w.label.toLowerCase()}`)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
