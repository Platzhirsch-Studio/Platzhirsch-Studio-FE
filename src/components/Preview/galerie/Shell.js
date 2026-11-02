import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import { BASE, NAV, SITE, STUDIO } from "./content";
import { galerieSans, galerieSerif } from "./fonts";
import s from "./galerie.module.css";

const MENU_ITEMS = [
  ...NAV,
  { label: "Minotti", href: `${BASE}/marken/minotti` },
  { label: "Kontakt", href: `${BASE}#termin` },
];

function Header() {
  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href={BASE} className={s.headerLogo} aria-label="Platzhirsch Home Living – Startseite des Prototyps">
          <Logo descriptor={false} title="Platzhirsch" />
        </Link>
        <nav className={s.nav} aria-label="Hauptnavigation">
          <ul className={s.navList}>
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={s.navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.headerActions}>
          <a href={SITE.termin} className={`${s.button} ${s.buttonGhost} ${s.headerCta}`}>
            Termin
          </a>
          <MobileMenu items={MENU_ITEMS} cta={{ href: SITE.termin, label: "Termin vereinbaren" }} />
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerTop}>
          <div style={{ display: "grid", gap: 28, alignContent: "start" }}>
            <Logo className={s.footerLogo} />
            <p className={`${s.small} ${s.muted}`} style={{ maxWidth: "26em", margin: 0 }}>
              Einrichtungshaus mit Café in Lochau am Bodensee – Wohnen, Küche und Outdoor, geplant als ein Projekt.
            </p>
          </div>
          <div className={s.footerCols}>
            <div className={s.footerCol}>
              <p className={s.overline}>Besuch</p>
              <address>
                {STUDIO.street}
                <br />
                {STUDIO.city}
                <br />
                {STUDIO.region}
              </address>
              <a href={STUDIO.maps} rel="noopener noreferrer" target="_blank">
                Route planen
              </a>
            </div>
            <div className={s.footerCol}>
              <p className={s.overline}>Öffnungszeiten</p>
              {STUDIO.hours.map(([d, h]) => (
                <span key={d}>
                  {d}: <span className={s.num}>{h}</span>
                </span>
              ))}
            </div>
            <div className={s.footerCol}>
              <p className={s.overline}>Kontakt</p>
              <a href={STUDIO.phoneHref}>{STUDIO.phone}</a>
              <a href={`mailto:${STUDIO.email}`}>{STUDIO.email}</a>
              <a href={SITE.termin}>Termin vereinbaren</a>
            </div>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span className={s.muted}>Design-Prototyp „Galerie“ · nicht indexiert · Stand Oktober 2026</span>
          <span style={{ display: "flex", gap: 24 }}>
            <a href={SITE.impressum}>Impressum</a>
            <a href={SITE.datenschutz}>Datenschutz</a>
            <Link href="/de">Zur aktuellen Website</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

// Page frame of the prototype: own header, own footer, own fonts. The live
// shell is hidden via a :has([data-galerie]) rule in galerie.module.css.
export default function Shell({ children }) {
  return (
    <div data-galerie="" className={`${s.root} ${galerieSerif.variable} ${galerieSans.variable}`}>
      <a href="#galerie-main" className={s.skip}>
        Zum Inhalt springen
      </a>
      <Header />
      <div id="galerie-main" tabIndex={-1}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
