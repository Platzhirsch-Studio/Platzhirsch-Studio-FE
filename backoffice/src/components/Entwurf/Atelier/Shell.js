import Link from "next/link";
import { Bell, CalendarDays, ChevronDown, ChevronRight, FolderKanban, House, Inbox, Package, Plus, Receipt, Search, Store, Users, Wrench } from "lucide-react";
import { UserMenu } from "./ThemeRoot";

const B = "/entwurf/atelier";

const nav = [
  { key: "zentrale", label: "Heute", href: `${B}/zentrale`, Icon: House },
  { key: "anfragen", label: "Anfragen", href: `${B}/anfragen`, Icon: Inbox, count: 4 },
  { key: "kunden", label: "Kunden", href: `${B}/kunde`, Icon: Users },
  { key: "projekte", label: "Projekte", href: "#", Icon: FolderKanban, count: 26 },
  { key: "kalender", label: "Kalender", href: "#", Icon: CalendarDays },
  { key: "faktura", label: "Angebote & Rechnungen", href: "#", Icon: Receipt },
  { key: "sortiment", label: "Sortiment", href: "#", Icon: Package },
  { key: "kassa", label: "Kassa", href: `${B}/kassa`, Icon: Store },
  { key: "service", label: "Service", href: "#", Icon: Wrench, count: 3 },
];

const projekte = [
  { label: "Haus am Pfänderhang", c: "var(--at-mat-1)", href: `${B}/kunde` },
  { label: "Seehotel Lindenhof", c: "var(--at-mat-6)", href: "#" },
  { label: "Penthouse Seestraße", c: "var(--at-mat-2)", href: "#" },
  { label: "Yacht „Aurelia“", c: "var(--at-mat-5)", href: "#" },
];

export function Wortmarke({ sub }) {
  return (
    <span className="at-mark">
      <b>Platzhirsch</b>{sub ? <span>{sub}</span> : null}
    </span>
  );
}

// Kopfleiste: auf jeder Seite dieselbe Reihenfolge – Brotkrumen · Suche · Glocke · Neu.
export default function Shell({ active, crumbs = [], wide = false, children }) {
  return (
    <div className="at-shell">
      <aside className="at-side" aria-label="Hauptnavigation">
        <Link href={B} className="at-side-mark" aria-label="Platzhirsch Studio, Übersicht"><Wortmarke sub="Studio" /><span className="at-mono" aria-hidden="true">P</span></Link>
        <nav className="at-nav">
          {nav.map(({ key, label, href, Icon, count }) => (
            <Link key={key} href={href} aria-current={active === key ? "page" : undefined} title={label}>
              <Icon aria-hidden="true" /><span>{label}</span>{count ? <span className="count">{count}</span> : null}
            </Link>
          ))}
          <div className="at-nav-proj">
            <div className="at-nav-label">Meine Projekte</div>
            {projekte.map((p) => (
              <Link key={p.label} href={p.href}>
                <i className="dot" style={{ background: p.c }} aria-hidden="true" /><span>{p.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="at-side-foot"><UserMenu /></div>
      </aside>
      <div className="at-main">
        <header className="at-top">
          <div className={`at-top-in ${wide ? "wide" : ""}`}>
            <nav className="at-crumbs" aria-label="Brotkrumen">
              {crumbs.map((c, i) => (
                <span key={c} style={{ display: "contents" }}>
                  {i > 0 ? <ChevronRight aria-hidden="true" /> : null}
                  {i === crumbs.length - 1 ? <b aria-current="page">{c}</b> : <span>{c}</span>}
                </span>
              ))}
            </nav>
            <div className="at-top-actions">
              <button type="button" className="at-topsearch" aria-label="Suchen oder Befehl ausführen, Tastenkürzel Befehl K">
                <Search aria-hidden="true" /><span>Suchen</span><kbd className="at-kbd">⌘K</kbd>
              </button>
              <button type="button" className="at-iconbtn at-bell" aria-label="Mitteilungen, 2 neu">
                <Bell aria-hidden="true" /><i aria-hidden="true" />
              </button>
              <button type="button" className="at-btn primary at-new"><Plus aria-hidden="true" />Neu<ChevronDown className="dd" aria-hidden="true" /></button>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
