// Mega-menu panel contents as an HTML string (R6-shell-perf, TBT).
//
// The desktop panels hold ~270 DOM nodes with ~70 links on EVERY page – a
// third of the DOM of /de/kontakt – and they are closed (hidden) at load and
// display:none below 1280 px. As React elements every one of those nodes was
// part of the RSC payload and was hydrated on every phone, for a menu that
// phones never show. Built here on the server as one string and set with
// dangerouslySetInnerHTML, the links stay in the server HTML (crawlers, no-JS
// visitors, the same markup as before) but React keeps ONE element per panel.
// Navigation: the links were plain <a> before (one delegated client
// navigation on the <nav>, Reusable/LinkDelegate.js), so nothing changes
// there. aria-current is set by DesktopNav from `data-nav-path` after
// hydration and on every route change (the layout is not re-rendered).
//
// R4 technik P1-2: no longer built on the server per page. navbar.js hands
// slim data (desktopRooms below) to DesktopNav, which calls megaPanelHtml()
// lazily on the first open. Pure, no React; escapes every text and attribute.
import { localizeHref } from "./navMatch";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ESC[ch]);

// Same markup lucide-react renders for <ArrowRight className="ph-arrow size-4 shrink-0" strokeWidth={1.5} aria-hidden />.
const ARROW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ph-arrow size-4 shrink-0" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>';

// QM shell-home r3 (laptop 1280): as inline-flex a wrapped label ("Über unsere /
// Küchengeräte") took the full column width and left the arrow far from the
// text. Now one inline run: the arrow follows the last word (nbsp), 44 px via
// padding (10 + 22.4 + 10 px plus the line box).
const ARROW_SVG_INLINE = ARROW_SVG.replace("ph-arrow size-4 shrink-0", "ph-arrow ml-1.5 inline-block size-4 align-[-0.2em]");
const ARROW_LINK =
  "group inline-block min-h-11 py-2.5 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";
// Optik shell-home: py-2.5 – one-line links stay 44 px (22.4 + 20), a link
// that wraps at 1280 px gets the same 10 px above and below its text as its
// neighbours, so the column rhythm stays even.
const COLUMN_LINK =
  "inline-flex min-h-11 items-center py-2.5 text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current aria-[current=page]:text-text-accent";
const COMPACT_LINK =
  "inline-flex min-h-9 items-center text-ui font-normal text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current aria-[current=page]:text-text-accent";

/** Path used for aria-current: no locale, hash or query; null = never current. */
export function navPath(link) {
  if (!link || link.external || typeof link.href !== "string" || link.href.includes("#")) return null;
  return link.href.split("?")[0].replace(/\/+$/, "") || "/";
}

function anchor(link, locale, className, inner) {
  const path = navPath(link);
  // data-termin-link: DesktopNav adds the page context to this href (R5 ux P2).
  const termin = link.context ? ` data-termin-link=""` : "";
  return `<a href="${esc(localizeHref(link.href, locale))}"${path ? ` data-nav-path="${esc(path)}"` : ""}${termin} class="${className}">${inner}</a>`;
}

// The last word and the arrow never part ("Küchen ansehen / →").
function arrowInner(label) {
  const text = String(label ?? "");
  const at = text.lastIndexOf(" ");
  const head = at > 0 ? `${esc(text.slice(0, at))} ` : "";
  return `<span>${head}<span class="whitespace-nowrap">${esc(at > 0 ? text.slice(at + 1) : text)}${ARROW_SVG_INLINE}</span></span>`;
}
const arrowLink = (link, locale) => anchor(link, locale, ARROW_LINK, arrowInner(link.label));

/** Inner HTML of one room's panel (everything inside .panelInner). */
export function megaPanelHtml(room, locale) {
  const cols = Math.min(Math.max(room.columns.length, 3), 5);
  // compact (Marken, Inhaber 31.10.2026: vier Gruppen mit bis zu 11 Marken):
  // 36 px statt 44 px Zeilenhöhe, damit das Panel bei 1280 × 720 nicht scrollt
  // (Zielgröße bleibt über WCAG 2.5.8, 24 px).
  // QM r3: 15 px column links below 1440 px (five columns at 1280 px).
  const linkClass = room.compact ? COMPACT_LINK : `${COLUMN_LINK} ${room.typographic ? "text-lead" : "text-ui font-normal max-[1439.98px]:text-[0.9375rem]"}`;
  const intro =
    `<div class="col-span-2 pr-6 min-[1440px]:col-span-3 min-[1440px]:pr-8">` +
    `<p class="text-overline uppercase text-text-accent">${esc(room.title || room.label)}</p>` +
    `<p class="mt-stack-s max-w-[28ch] text-body text-text-soft">${esc(room.intro)}</p>` +
    `<div class="mt-stack-m">${arrowLink(room.all, locale)}</div>` +
    (room.extra || []).map((link) => `<div>${arrowLink(link, locale)}</div>`).join("") +
    `</div>`;
  // `auto` tracks: each column first gets its max-content width, the rest is
  // shared out – "Chaiselongues & Daybeds" no longer wraps at 1280 px.
  // QM shell-home r3: below 1440 px the intro takes 2 of 12 columns (not 3)
  // and the gaps are 24/32 px – five columns ("Wohnen") had too little room
  // at 1280 px ("Sideboards & / Kommoden", "TV- & / Lowboards").
  const columns =
    `<div class="col-span-10 grid gap-x-5 gap-y-8 border-l border-line pl-6 min-[1440px]:col-span-9 min-[1440px]:gap-x-grid min-[1440px]:pl-10" style="grid-template-columns:repeat(${cols}, auto)">` +
    room.columns
      .map(
        (column) =>
          `<div>${column.title ? `<p class="text-small text-text-soft">${esc(column.title)}</p>` : ""}` +
          `<ul${column.title ? ' class="mt-2"' : ""}>` +
          column.links.map((link) => `<li>${anchor(link, locale, linkClass, esc(link.label))}</li>`).join("") +
          `</ul></div>`
      )
      .join("") +
    `</div>`;
  return intro + columns;
}

/**
 * Slim data the desktop island receives per room (R4 technik P1-2, RSC
 * payload): labels and hrefs only. The panel HTML is NOT sent any more – as a
 * prop it travelled twice with every page (once as server HTML, once escaped
 * in the RSC payload, together ≈ 77 KB on /de). DesktopNav builds it with
 * megaPanelHtml() above the first time a panel opens (same markup, same
 * escaping), so phones – which never show these panels – neither download nor
 * hydrate it. hrefs stay without locale (findActiveRoom shape).
 */
export function desktopRooms(rooms) {
  const link = (l) =>
    l ? { label: l.label, href: l.href, ...(l.external ? { external: true } : {}), ...(l.shared ? { shared: true } : {}), ...(l.context ? { context: true } : {}) } : l;
  return rooms.map((room) => ({
    id: room.id,
    label: room.label,
    // Voller Name für Panel-Überschrift und Mobilmenü (z. B. „Accessoires · Shop“ zum Kopfzeilen-Label „Shop“).
    ...(room.title ? { title: room.title } : {}),
    ...(room.navShort ? { navShort: room.navShort } : {}),
    intro: room.intro,
    ...(room.typographic ? { typographic: true } : {}),
    ...(room.compact ? { compact: true } : {}),
    all: link(room.all),
    extra: (room.extra || []).map(link),
    columns: room.columns.map((col) => ({ title: col.title || null, links: col.links.map(link) })),
  }));
}
