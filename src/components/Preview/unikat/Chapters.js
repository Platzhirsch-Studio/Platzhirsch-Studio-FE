// Prototyp „Die Linie wird Raum“ – die ruhigen Kapitel nach der Bühne.
// Server Component, 0 kB JavaScript. Inhalte und Links wie die Startseite
// (Messages HomePage, Claim-Guard für Minotti); KEINE Herstellerbilder – die
// Welten tragen kleine Striche im selben Bleistift wie die Bühne.
import { Button, LinkArrow, SmartLink } from "@/components/ui";
import { ADDRESS, DIRECTIONS_URL, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { brandHref } from "@/lib/content/brands";
import s from "./unikat.module.css";
import { worldGlyph } from "./drawing";

const MARKEN = "/ueber-uns/marken";

function Glyph({ id }) {
  return (
    <svg className={s.glyph} viewBox="0 0 120 80" aria-hidden="true" focusable="false">
      {worldGlyph(id).map((st, i) => (
        <path key={i} d={st.d} style={{ "--w": st.weight.toFixed(2) }} />
      ))}
    </svg>
  );
}

// Schlusswort farbig (Referenz-Stil): „Wir nehmen uns <Zeit.>“
function splitLast(title) {
  const i = title.trim().lastIndexOf(" ");
  return i < 0 ? { head: "", last: title } : { head: title.slice(0, i), last: title.slice(i + 1) };
}

function Head({ id, n, eyebrow, title, lead }) {
  return (
    <header className={s.chHead}>
      <p className={s.overline}>
        <span className={s.num}>{n}</span> · {eyebrow}
      </p>
      <h2 id={id} className={s.bigTitle}>
        {splitLast(title).head} <span className={s.accentWord}>{splitLast(title).last}</span>
      </h2>
      {lead && <p className={s.chLead}>{lead}</p>}
    </header>
  );
}

export default function Chapters({ copy, firstId }) {
  const { brands, worlds, house, cta } = copy;
  return (
    <div className={s.chapters}>
      {/* MARKEN */}
      <section id={firstId} className={s.chapter} aria-labelledby="u-brands" tabIndex={-1}>
        <Head id="u-brands" n="06" eyebrow={brands.eyebrow} title={brands.title} lead={brands.lead} />
        {brands.studio && (
          <div className={s.studio}>
            <h3 className={s.studioTitle}>{brands.studio.title}</h3>
            <p className={s.studioText}>{brands.studio.statement}</p>
            <div className={s.studioLinks}>
              <LinkArrow href={brands.studio.href}>Minotti in Lochau</LinkArrow>
              {brands.studio.evidenceUrl && (
                <a className={s.inlineLink} href={brands.studio.evidenceUrl} target="_blank" rel="noopener noreferrer">
                  Pressemeldung bei Minotti<span className="sr-only"> (öffnet in neuem Tab)</span>
                </a>
              )}
            </div>
          </div>
        )}
        <ul className={s.brandList}>
          {brands.list.map((b) => (
            <li key={b.slug}>
              <SmartLink href={brandHref(b, MARKEN)} className={s.brandLink}>
                {b.name}
              </SmartLink>
            </li>
          ))}
        </ul>
        <div className={s.chFoot}>
          <LinkArrow href={MARKEN}>{brands.all}</LinkArrow>
          <p className={s.small}>{brands.note}</p>
        </div>
      </section>

      {/* WELTEN */}
      <section className={s.chapter} aria-labelledby="u-worlds">
        <Head id="u-worlds" n="07" eyebrow={worlds.eyebrow} title={worlds.title} />
        <ul className={s.worlds}>
          {worlds.items.map((w) => (
            <li key={w.id} className={s.world}>
              <Glyph id={w.id} />
              <h3 className={s.worldTitle}>
                <SmartLink href={w.href} className={s.worldLink}>
                  {w.title}
                </SmartLink>
              </h3>
              <p className={s.worldText}>{w.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* HAUS & CAFÉ */}
      <section id="haus" className={`${s.chapter} ${s.house}`} aria-labelledby="u-house">
        <Head id="u-house" n="08" eyebrow={house.eyebrow} title={house.title} lead={house.text} />
        <div className={s.houseGrid}>
          <div>
            <h3 className={s.overline}>{house.hoursTitle}</h3>
            <ul className={s.hours}>
              {house.rows.map(([day, time]) => (
                <li key={day}>
                  <span>{day}</span>
                  <span className={s.num}>{time}</span>
                </li>
              ))}
            </ul>
            <p className={s.small}>{house.note}</p>
          </div>
          <div>
            <h3 className={s.overline}>{house.addressTitle}</h3>
            <address className={s.address}>
              Platzhirsch Home Living
              <br />
              {ADDRESS.street}
              <br />
              {ADDRESS.postalCode} {ADDRESS.city}, {ADDRESS.region}
            </address>
            <div className={s.actions}>
              <Button href={DIRECTIONS_URL} target="_blank" variant="secondary" arrow>
                {house.route}
              </Button>
              <Button href={PHONE_HREF} variant="ghost">
                <span className={s.num}>
                  {house.call}: {PHONE_DISPLAY}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TERMIN */}
      <section className={`${s.chapter} ${s.closing}`} aria-labelledby="u-cta">
        <svg className={s.closingLine} viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 40C180 22 320 52 520 34S860 18 1200 30" />
        </svg>
        <Head id="u-cta" n="09" eyebrow={cta.eyebrow} title={cta.title} lead={cta.text} />
        <div className={s.actions}>
          <Button href="/beratung" variant="primary" arrow>
            {cta.primary}
          </Button>
          <Button href={PHONE_HREF} variant="secondary">
            {cta.phone}
          </Button>
        </div>
      </section>
    </div>
  );
}
