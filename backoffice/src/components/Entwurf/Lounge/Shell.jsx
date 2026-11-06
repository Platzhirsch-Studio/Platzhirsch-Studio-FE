"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Bell, CalendarDays, FolderKanban, Home, Inbox, Moon, Plus, Receipt, Search, ShoppingBag, Sun, Truck, Wrench,
} from "lucide-react";
import { BASIS, ICH } from "./daten";
import { Av, Rund, Wortmarke } from "./ui";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };

// Schwebende Symbolleiste: Hauptbereiche. Pillen-Reiter oben: Unterbereiche des aktiven Bereichs.
const RAIL = [
  { id: "zentrale", href: BASIS, label: "Zentrale", icon: Home },
  { id: "verkauf", href: `${BASIS}/anfragen`, label: "Verkauf", icon: Inbox, badge: 7 },
  { id: "projekte", href: `${BASIS}/kundenakte`, label: "Projekte", icon: FolderKanban },
  { id: "kalender", href: "#kalender", label: "Kalender", icon: CalendarDays },
  { id: "logistik", href: "#logistik", label: "Lieferung & Montage", icon: Truck },
  { id: "service", href: "#service", label: "Service", icon: Wrench },
  { id: "faktura", href: "#faktura", label: "Faktura", icon: Receipt },
  { id: "kassa", href: `${BASIS}/kassa`, label: "Kassa", icon: ShoppingBag },
];

const REITER = {
  zentrale: ["Übersicht", "Meine Aufgaben", "Kalender", "Berichte"],
  verkauf: ["Anfragen", "Kontakte", "Beratungen", "Angebote"],
  projekte: ["Projekte", "Planung", "Bestellungen", "Montage"],
};

/* --- Hell/Dunkel/System nur für .lg ----------------------------------- */
const lesen = () => { try { const t = localStorage.getItem("lg-theme"); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; } };
const abo = (cb) => { window.addEventListener("lg-theme", cb); window.addEventListener("storage", cb); return () => { window.removeEventListener("lg-theme", cb); window.removeEventListener("storage", cb); }; };

export function useTheme() {
  const theme = useSyncExternalStore(abo, lesen, () => "system");
  useEffect(() => {
    const root = document.querySelector(".lg");
    if (!root) return;
    if (theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
  }, [theme]);
  const setTheme = (t) => {
    try { t === "system" ? localStorage.removeItem("lg-theme") : localStorage.setItem("lg-theme", t); } catch {}
    window.dispatchEvent(new Event("lg-theme"));
  };
  return [theme, setTheme];
}

export function ThemeKnopf() {
  const [theme, setTheme] = useTheme();
  const wechseln = () => {
    const dunkel = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dunkel ? "light" : "dark");
  };
  return (
    <Rund label="Hell oder dunkel" onClick={wechseln}>
      <span className="lg-theme-ico lg-theme-ico--moon"><Moon {...S} /></span>
      <span className="lg-theme-ico lg-theme-ico--sun"><Sun {...S} /></span>
    </Rund>
  );
}

/** Glas-Kopfzeile wird beim Scrollen zum Material. */
function useScrolled() {
  const [s, setS] = useState(false);
  useEffect(() => {
    const f = () => setS(window.scrollY > 8);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return s;
}

export default function Shell({ bereich = "zentrale", reiter, children }) {
  const path = usePathname();
  const scrolled = useScrolled();
  const tabs = REITER[bereich] || [];
  const aktivTab = reiter || tabs[0];
  return (
    <div className="lg-app">
      <a href="#inhalt" className="lg-skip">Zum Inhalt springen</a>
      <nav className="lg-rail lg-material" aria-label="Hauptbereiche">
        <Link href={BASIS} className="lg-rail__logo" aria-label="Platzhirsch Zentrale">P</Link>
        <div className="lg-rail__items">
          {RAIL.map((r) => {
            const on = r.id === bereich || (r.href !== BASIS && path?.startsWith(r.href) && r.href.startsWith("/"));
            return (
              <Link key={r.id} href={r.href} className={`lg-rail__item${on ? " is-on" : ""}`} aria-current={on ? "page" : undefined} aria-label={r.label} title={r.label}>
                <r.icon {...S} />
                {r.badge ? <span className="lg-badge lg-badge--dot" aria-hidden="true" /> : null}
                <span className="lg-tip" role="presentation">{r.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="lg-rail__foot">
          <ThemeKnopf />
          <Av kurz={ICH.kurz} size={40} />
        </div>
      </nav>

      <header className={`lg-top${scrolled ? " is-scrolled" : ""}`}>
        <Link href={BASIS} className="lg-top__brand" aria-label="Platzhirsch Home Living, Zentrale"><Wortmarke /></Link>
        {tabs.length > 0 && (
          <nav className="lg-tabs" aria-label="Unterbereiche">
            {tabs.map((t) => (
              <a key={t} href={`#${t}`} className={`lg-tabs__i${t === aktivTab ? " is-on" : ""}`} aria-current={t === aktivTab ? "page" : undefined}>{t}</a>
            ))}
          </nav>
        )}
        <div className="lg-top__tools">
          <Rund label="Suchen (Strg K)"><Search {...S} /></Rund>
          <Rund label="Mitteilungen, 3 neu" badge={3}><Bell {...S} /></Rund>
          <Rund label="Neu anlegen"><Plus {...S} /></Rund>
        </div>
      </header>

      <main id="inhalt" className="lg-main">{children}</main>
    </div>
  );
}
