// Prototyp „Unikat“ – LIVE-Leiste, Foto-Hero mit Raum-Starter, Marken-Lauftext
// und Zahlen-Band. Server Components; Client nur LiveBar und RaumStarter.
// Stil-Richtung (Inhaber 31.10.2026): modern-technisch wie die Referenz
// oekovolt.com (nur Stil, nichts übernommen), aber Interior statt Industrie –
// Messing statt Grün, Instrument Sans schwer, Bodoni nur als Akzent.
import Image from "next/image";
import Link from "next/link";
import s from "./unikat.module.css";
import LiveBar from "./LiveBar";
import RaumStarter from "./RaumStarter";

const nf = new Intl.NumberFormat("de-AT");

/** Überschrift mit farbigem Schlusswort. */
export function BigTitle({ id, as: Tag = "h2", lead, accent, className = "" }) {
  return (
    <Tag id={id} className={`${s.bigTitle} ${className}`}>
      {lead} <span className={s.accentWord}>{accent}</span>
    </Tag>
  );
}

export function Live({ showroom, cafe, fallback }) {
  return (
    <div className={s.live} role="region" aria-label="Heute in Lochau">
      <div className={s.liveInner}>
        <span className={s.liveTag}>
          <span className={s.liveDot} aria-hidden="true" />
          Live
        </span>
        <LiveBar showroom={showroom} cafe={cafe} fallback={fallback} />
        <a className={s.livePhone} href="tel:+43557446255">
          +43 5574 46255
        </a>
      </div>
    </div>
  );
}

export function Hero({ copy, starter }) {
  const { hero } = copy;
  return (
    <section className={s.hero} aria-labelledby="u-hero-title">
      <div className={s.heroMedia}>
        <Image src="/Images/Home/aboutHome.jpg" alt={hero.imageAlt} fill preload sizes="100vw" quality={72} className={s.heroImg} />
      </div>
      <div className={s.heroShade} aria-hidden="true" />
      <div className={s.heroInner}>
        <div className={s.heroText}>
          <p className={s.pill}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {hero.pill}
          </p>
          <p className={s.heroKicker}>{hero.kicker}</p>
          <h1 id="u-hero-title" className={s.heroTitle}>
            <span>{hero.title[0]}</span> <span className={s.heroAccent}>
              {hero.title[1].replace(/Raum.$/, "")}
              <em>Raum.</em>
            </span>
          </h1>
          <p className={s.heroLead}>{hero.lead}</p>
          <div className={s.heroCtas}>
            <Link href="/de/beratung" className={s.btnPrimary} prefetch={false}>
              {hero.cta}
              <span aria-hidden="true">→</span>
            </Link>
            <a href="#haus" className={s.btnGhost}>
              {hero.secondary}
            </a>
          </div>
          <ul className={s.trust}>
            {hero.trust.map((t) => (
              <li key={t}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
                  <path d="m8.5 12 2.4 2.4 4.6-4.8" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className={s.heroCard}>
          <RaumStarter raeume={starter.raeume} stile={starter.stile} beratungPath="/beratung" />
        </div>
      </div>
    </section>
  );
}

export function Marquee({ names }) {
  const row = (hidden) => (
    <ul className={s.marqueeRow} aria-hidden={hidden || undefined}>
      {names.map((n, i) => (
        <li key={n} className={i % 3 === 1 ? s.mqItalic : undefined}>
          {n}
        </li>
      ))}
    </ul>
  );
  return (
    <section className={s.marquee} aria-label="Marken in Ausstellung und Katalog">
      <div className={s.marqueeTrack}>
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

export function Zahlen({ z }) {
  const tiles = [
    { v: z.produkte, l: "Produkte im Online-Katalog" },
    { v: z.katalogMarken, l: "Hersteller im Online-Katalog" },
    { v: z.welten.length, l: "Welten im Online-Katalog" },
    { v: 4, l: "Sprachen: Deutsch, Englisch, Französisch, Italienisch" },
  ];
  return (
    <section className={s.zahlen} aria-labelledby="u-zahlen">
      <div className={s.wrap}>
        <div className={s.zahlenHead}>
          <h2 id="u-zahlen" className={s.zahlenTitle}>
            Platzhirsch in <span className={s.accentOnDark}>Zahlen</span>
          </h2>
          <p className={s.zahlenNote}>Zur Laufzeit gezählt aus dem Online-Katalog und dem Marken-Register{z.stand ? ` · Stand ${z.stand.split("-").reverse().join(".")}` : ""}</p>
        </div>
        <ul className={s.tiles}>
          {tiles.map((t, i) => (
            <li key={t.l} className={s.tile}>
              <span className={`${s.tileNum} ${i === 0 ? s.accentOnDark : ""}`}>{nf.format(t.v)}</span>
              <span className={s.tileLabel}>{t.l}</span>
            </li>
          ))}
        </ul>
        <ul className={s.weltChips} aria-label="Produkte je Welt">
          {z.welten.map((w) => (
            <li key={w.id}>
              <Link href={`/de${w.href}`} className={s.weltChip} prefetch={false}>
                {w.label} <span className={s.weltCount}>{nf.format(w.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
