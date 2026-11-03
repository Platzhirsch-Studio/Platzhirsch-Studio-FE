import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { demoNoticeText } from "@/lib/portal/demoNotice";
import { focusRing } from "./labels";

// Page heading for Dokumente, Termine, Produktpass, Gewerke and Neue Planung.
// Server Component. The former second pill navigation is gone: every area is
// in the one portal navigation (Core/navItems.js). Optional back link sits in
// one row with the overline so the H1 stays in the first screen on phones.
export function DocsPageHeader({ overline, title, intro, back, children }) {
  return (
    <div className="mb-6 sm:mb-9">
      {(back || overline) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {back && (
            <Link href={back.href} className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink print:hidden ${focusRing}`}>
              <ArrowLeft size={16} aria-hidden="true" /> {back.label}
            </Link>
          )}
          {back && overline && <span aria-hidden="true" className="text-ink/30">·</span>}
          {overline && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{overline}</p>}
        </div>
      )}
      <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">{title}</h1>
      {intro && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/75">{intro}</p>}
      {children}
    </div>
  );
}

/** Filter chip row built from links (works without JavaScript). */
export function FilterChips({ label, options, active }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-m-1 flex gap-2 overflow-x-auto p-1 [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none] sm:flex-wrap sm:m-0 sm:overflow-visible sm:p-0 sm:[mask-image:none]"
    >
      {options.map((o) => {
        const on = o.value === active;
        return (
          <Link
            key={o.value || "alle"}
            href={o.href}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border px-4 text-sm whitespace-nowrap transition-colors ${focusRing} ${
              on ? "border-gold bg-gold/15 font-semibold text-ink" : "border-ink/15 bg-white text-ink/80 hover:border-ink/40"
            }`}
          >
            {o.label}
            {typeof o.count === "number" && <span className="text-xs text-ink/70">{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

// Demo hint (mock adapter). N7 (R6): "lokale Entwicklungsumgebung" only on the
// dev server; a production build with a demo session says "Demo-Zugang".
export function DevDataNotice({ show }) {
  const t = useTranslations();
  if (!show) return null;
  return (
    <p className="mb-4 border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-ink sm:mb-6 sm:px-4 sm:py-3 sm:text-sm">
      {demoNoticeText(t)}
    </p>
  );
}
