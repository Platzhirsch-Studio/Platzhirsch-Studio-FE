import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Small presentational building blocks shared by all portal pages.

export function Overline({ children, className = "" }) {
  return <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-gold-text ${className}`}>{children}</p>;
}

export function Card({ as: Tag = "section", tone = "light", className = "", children, ...rest }) {
  const surface = tone === "dark" ? "border-walnut bg-walnut text-white" : "border-ink/10 bg-white";
  return (
    <Tag className={`border p-5 sm:p-7 ${surface} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeading({ id, title, href, linkLabel = "Alle ansehen" }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3">
      <h2 id={id} className="font-display text-xl text-ink sm:text-2xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm text-ink/80 underline decoration-ink/25 underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {linkLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-stone text-ink",
    new: "bg-ink text-white",
    gold: "bg-gold/20 text-gold-text",
    ai: "border border-ink/30 text-ink",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tones[tone]}`}>{children}</span>;
}

export function Empty({ children }) {
  return <p className="bg-bone px-4 py-5 text-sm text-ink/70">{children}</p>;
}

export function PrimaryButton({ children, className = "", ...rest }) {
  return (
    <button
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Narrow centred card for login/confirm pages. */
export function AuthPanel({ title, children }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card as="div" className="sm:p-9">
        <Overline>Mein Platzhirsch</Overline>
        <h1 className="mt-3 font-display text-display-m text-ink sm:text-4xl">{title}</h1>
        <div className="mt-5 space-y-5 text-[15px] leading-relaxed text-ink/80">{children}</div>
      </Card>
    </div>
  );
}

export function Notice({ tone = "info", children }) {
  const tones = {
    info: "border-ink/15 bg-bone text-ink",
    error: "border-red-700/30 bg-red-50 text-red-900",
    dev: "border-gold/50 bg-gold/10 text-ink",
  };
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
