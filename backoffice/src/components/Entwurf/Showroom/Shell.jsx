"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import {
  Bell, Boxes, ChevronRight, FolderKanban, Home, Inbox, Monitor, Moon, Receipt, Search, Settings, ShoppingBag,
  Sun, Truck, Users, Wrench, CalendarDays, Plus,
} from "lucide-react";
import { ICH } from "./daten";
import { Monogramm, Wortmarke } from "./ui";

const BASIS = "/entwurf/showroom";

const NAV = [
  { group: null, items: [
    { href: BASIS, label: "Zentrale", icon: Home },
    { href: `${BASIS}/anfragen`, label: "Anfragen", icon: Inbox, count: 9 },
    { href: "#kalender", label: "Kalender", icon: CalendarDays },
  ] },
  { group: "Verkauf", items: [
    { href: `${BASIS}/kundenakte`, label: "Kunden", icon: Users },
    { href: "#projekte", label: "Projekte", icon: FolderKanban, count: 23 },
    { href: "#sortiment", label: "Sortiment", icon: Boxes },
    { href: `${BASIS}/kassa`, label: "Kassa", icon: ShoppingBag },
  ] },
  { group: "Betrieb", items: [
    { href: "#logistik", label: "Lieferung & Montage", icon: Truck },
    { href: "#service", label: "Service", icon: Wrench, count: 4 },
    { href: "#faktura", label: "Faktura", icon: Receipt },
  ] },
];

/** Hell/Dunkel/System – gilt nur für den Entwurfsbereich (.sr). */
const lesen = () => { try { const t = localStorage.getItem("sr-theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; } };
const abonnieren = (cb) => { window.addEventListener("sr-theme", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("sr-theme", cb); window.removeEventListener("storage", cb); }; };

export function useTheme() {
  const theme = useSyncExternalStore(abonnieren, lesen, () => "system");
  useEffect(() => {
    const root = document.querySelector(".sr");
    if (!root) return;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    // Vergleich der Display-Schrift (Jury Nr. 11): ?display=sans
    try {
      const d = new URLSearchParams(window.location.search).get("display");
      if (d === "sans") root.setAttribute("data-display", "sans"); else root.removeAttribute("data-display");
    } catch {}
  }, [theme]);
  const setTheme = (t) => {
    try { t === "system" ? localStorage.removeItem("sr-theme") : localStorage.setItem("sr-theme", t); } catch {}
    window.dispatchEvent(new Event("sr-theme"));
  };
  return [theme, setTheme];
}

export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();
  const opts = [
    { id: "light", icon: Sun, label: "Hell" },
    { id: "system", icon: Monitor, label: "System" },
    { id: "dark", icon: Moon, label: "Dunkel" },
  ];
  return (
    <div className="sr-theme" role="group" aria-label="Darstellung">
      {opts.map((o) => (
        <button key={o.id} type="button" aria-pressed={theme === o.id} aria-label={o.label} title={o.label} onClick={() => setTheme(o.id)}>
          <o.icon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export default function Shell({ crumbs = [], children, actions, fill = false }) {
  const path = usePathname();
  return (
    <div className="sr-app">
      <aside className="sr-side" aria-label="Hauptnavigation">
        <div className="sr-brand">
          <Link href={BASIS} className="sr-brand__link" aria-label="Platzhirsch Zentrale">
            <Wortmarke className="sr-brand__mark" />
            <Monogramm className="sr-brand__mono" />
          </Link>
          <div className="sr-brand__sub">Home Living · Lochau</div>
        </div>
        <nav className="sr-nav">
          {NAV.map((g, i) => (
            <div className="sr-nav__group" key={i}>
              {g.group && <div className="sr-nav__heading">{g.group}</div>}
              {g.items.map((it) => {
                const aktiv = it.href === BASIS ? path === BASIS : path?.startsWith(it.href);
                return (
                  <Link key={it.label} href={it.href} className="sr-nav__item" aria-current={aktiv ? "page" : undefined} title={it.label}>
                    <it.icon aria-hidden="true" />
                    <span className="sr-nav__label">{it.label}</span>
                    {it.count ? <span className="sr-nav__count">{it.count}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sr-side__foot">
          <ThemeSwitch />
          <a href="#profil" className="sr-me">
            <span className="sr-av" data-m={ICH.m} style={{ "--av": "30px" }}>{ICH.kurz}</span>
            <span className="sr-me__txt">
              <span className="sr-me__name">{ICH.name}</span>
              <span className="sr-me__role">{ICH.rolle}</span>
            </span>
            <Settings aria-hidden="true" className="sr-me__gear" />
          </a>
        </div>
      </aside>
      <main className={`sr-main${fill ? " sr-main--fill" : ""}`} id="inhalt">
        <header className="sr-top">
          <nav className="sr-crumbs" aria-label="Pfad">
            {crumbs.map((c, i) => (
              <span key={c} className="sr-crumbs__i">
                {i > 0 && <ChevronRight aria-hidden="true" />}
                {i === crumbs.length - 1 ? <b aria-current="page">{c}</b> : <span>{c}</span>}
              </span>
            ))}
          </nav>
          <div className="sr-top__right">
            {actions}
            <button type="button" className="sr-search" aria-label="Suchen oder Befehl ausführen">
              <Search aria-hidden="true" />
              <span className="sr-search__long">Suchen, springen, anlegen …</span>
              <span className="sr-search__short">Suchen …</span>
              <span className="sr-kbd">Strg K</span>
            </button>
            <button type="button" className="sr-iconbtn" aria-label="Neu anlegen"><Plus aria-hidden="true" /></button>
            <button type="button" className="sr-iconbtn" aria-label="Mitteilungen, 3 neu">
              <Bell aria-hidden="true" />
              <span className="sr-dotbadge" />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
