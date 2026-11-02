import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import s from "./buehne.module.css";
import { text } from "./fonts";
import { LogoHorizontal, LogoStacked } from "./Logo";
import SmoothScroll from "./SmoothScroll";
import { BASE, CONTACT, HOURS } from "./content";

const NAV = [
  { href: `${BASE}#raeume`, label: "Räume" },
  { href: `${BASE}/marken/minotti`, label: "Marken" },
  { href: `${BASE}#showroom`, label: "Showroom" },
  { href: `${BASE}#service`, label: "Service" },
];

function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerBg} aria-hidden="true" />
      <div className={`${s.container} ${s.headerInner}`}>
        <nav aria-label="Hauptnavigation (Prototyp)" className={s.nav}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={s.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* mobile: native <details> menu, works without JS */}
        <details className={s.menu}>
          <summary aria-label="Menü öffnen">
            <span aria-hidden="true">☰</span> Menü
          </summary>
          <nav aria-label="Hauptnavigation mobil (Prototyp)" className={s.menuPanel}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href={`${BASE}#termin`} className={s.gold}>
              Termin vereinbaren
            </Link>
          </nav>
        </details>
        <Link href={BASE} className={s.logo} aria-label="Platzhirsch – zur Startseite des Prototyps">
          <LogoHorizontal className="h-9 w-auto sm:h-11" />
        </Link>
        <div className={s.headerRight}>
          <Link href={`${BASE}#termin`} className={`${s.btnGhost} ${s.headerCta}`}>
            Termin
          </Link>
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
            <LogoStacked className="h-auto w-56 text-[#efe9df]" />
            <p className={`${s.muted} mt-6 max-w-sm`}>
              Einrichtungsstudio mit Café am Bodensee. Wohnen, Küche, Schlafen und Outdoor – geplant als ein Projekt.
            </p>
          </div>
          <div>
            <h2>Besuch</h2>
            <address className="not-italic">
              {CONTACT.street}
              <br />
              {CONTACT.city}
            </address>
            <ul className="mt-4">
              {HOURS.map((h) => (
                <li key={h.days}>
                  <span className={s.muted}>{h.days}</span> {h.time}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Kontakt</h2>
            <ul>
              <li>
                <a href={CONTACT.telHref}>{CONTACT.tel}</a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.mail}`}>{CONTACT.mail}</a>
              </li>
              <li>
                <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram <ArrowUpRight aria-hidden="true" className="inline h-4 w-4" />
                  <span className="sr-only">(öffnet in neuem Tab)</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2>Prototyp</h2>
            <ul>
              <li>
                <Link href={BASE}>Startseite</Link>
              </li>
              <li>
                <Link href={`${BASE}/marken/minotti`}>Markenseite Minotti</Link>
              </li>
              <li>
                <Link href={`${BASE}/produkt/sofas-lawrence`}>Produktseite Lawrence</Link>
              </li>
              <li>
                <Link href={`${BASE}/logo`}>Logo-Konzept</Link>
              </li>
              <li>
                <Link href="/de">Zur aktuellen Website</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className={s.bigMark} aria-hidden="true">
          PLATZHIRSCH
        </p>
        <hr className={s.hairline} />
        <p className={`${s.muted} mt-6 text-sm`}>
          Design-Prototyp „Bühne“ · nicht öffentlich, nicht indexiert · Stand Oktober 2026
        </p>
      </div>
    </footer>
  );
}

export default function Shell({ children }) {
  return (
    <div className={`${s.root} ${text.variable}`}>
      <p className={s.ribbon}>Design-Prototyp „Bühne“ – interne Vorschau, Inhalte teilweise Platzhalter</p>
      <Header />
      {children}
      <Footer />
      <SmoothScroll />
    </div>
  );
}
