// Seitenhülle des Prototyps: Hinweisleiste, Header, Footer. Server Component,
// 0 kB JavaScript – das mobile Menü ist ein natives <details>.
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import s from "./dl.module.css";
import { fraunces, instrumentSans } from "./fonts";
import { Logo } from "./Logo";
import { BASE, HOUSE, LINKS, NAV } from "./content";

function Header() {
  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.headerInner}`}>
        <Link href={BASE} className={s.logoLink} aria-label="Platzhirsch Home Living – Startseite des Prototyps">
          <Logo />
        </Link>
        <nav aria-label="Hauptnavigation" className={s.nav}>
          {NAV.map((item) => (
            <Link key={item.label} href={`${BASE}${item.href}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={s.headerActions}>
          <Link href={LINKS.termin} className={s.btn}>
            Termin vereinbaren
          </Link>
          <details className={s.menu}>
            <summary>
              <Menu size={18} aria-hidden="true" />
              Menü
            </summary>
            <nav aria-label="Mobile Navigation" className={s.menuPanel}>
              {NAV.map((item) => (
                <Link key={item.label} href={`${BASE}${item.href}`}>
                  {item.label}
                </Link>
              ))}
              <Link href={LINKS.termin}>Termin vereinbaren</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerGrid}>
          <div>
            <Logo variant="stacked" className={s.footerLogo} />
            <p className={s.small} style={{ marginTop: 20, maxWidth: "26em" }}>
              Showroom und Café in Lochau am Bodensee. Wohnen, Küche und Outdoor für Österreich, Deutschland, die Schweiz
              und Liechtenstein.
            </p>
          </div>
          <div>
            <h2>Besuch</h2>
            <address style={{ fontStyle: "normal" }}>
              {HOUSE.street}
              <br />
              {HOUSE.city}
              <br />
              {HOUSE.region}
            </address>
            <p style={{ margin: "12px 0 0" }}>
              <a href={HOUSE.mapsHref} className={s.textLink} rel="noopener" target="_blank">
                Route planen
              </a>
            </p>
          </div>
          <div>
            <h2>Öffnungszeiten</h2>
            <ul className={s.num}>
              {HOUSE.hours.map((h) => (
                <li key={h.days}>
                  {h.days}: {h.time}
                </li>
              ))}
            </ul>
            <p className={s.small} style={{ margin: "10px 0 0" }}>
              {HOUSE.hoursNote}
            </p>
          </div>
          <div>
            <h2>Kontakt</h2>
            <ul>
              <li>
                <a href={HOUSE.phoneHref} className={s.textLink}>
                  {HOUSE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${HOUSE.email}`} className={s.textLink}>
                  {HOUSE.email}
                </a>
              </li>
              <li>
                <Link href={LINKS.newsletter} className={s.textLink}>
                  Einladungen per Newsletter
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>© {HOUSE.name} · Design-Prototyp „Dreiländereck“, nicht öffentlich</span>
          <span>
            <Link href={`${BASE}/logo`} className={s.textLink}>
              Logo &amp; Gestaltung
            </Link>
            {" · "}
            <Link href="/de/impressum" className={s.textLink}>
              Impressum
            </Link>
            {" · "}
            <Link href="/de/datenschutz" className={s.textLink}>
              Datenschutz
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function Shell({ children }) {
  return (
    <div className={`${s.root} ${fraunces.variable} ${instrumentSans.variable}`} data-preview="dreilaendereck">
      <a href="#dl-main" className={s.skip}>
        Zum Inhalt springen
      </a>
      <p className={s.banner} style={{ margin: 0 }}>
        Design-Prototyp „Dreiländereck“ – nicht indexiert, Inhalte teils Platzhalter.{" "}
        <Link href="/de" className={s.textLink}>
          Zur aktuellen Website <ArrowRight size={13} aria-hidden="true" style={{ display: "inline", verticalAlign: "-2px" }} />
        </Link>
      </p>
      <Header />
      <div id="dl-main" tabIndex={-1}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
