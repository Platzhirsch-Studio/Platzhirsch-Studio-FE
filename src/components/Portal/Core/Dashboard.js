import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, Hammer, Mail, MapPin, PencilRuler, Phone, ShieldCheck } from "lucide-react";
import { APPOINTMENT_KINDS, DOCUMENT_TYPES, PROJECT_STEPS, TRADES, amountLabel } from "@/lib/portal/constants";
import { formatDate, formatShortDate, formatTimeRange, formatWeekday, greeting, relativeDays } from "@/lib/portal/format";
import StatusTimeline from "./StatusTimeline";
import { Badge, Card, CardHeading, Empty, Overline } from "./ui";

// Dashboard sections. Pure Server Components: data comes in as props from
// src/app/[locale]/portal/page.js.

const linkFocus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const stepLabel = (key) => PROJECT_STEPS.find((s) => s.key === key)?.label || key;

export function Greeting({ customer, stats }) {
  const parts = [
    `${stats.projects} ${stats.projects === 1 ? "Projekt" : "Projekte"}`,
    stats.newDocuments ? `${stats.newDocuments} ${stats.newDocuments === 1 ? "neues Dokument" : "neue Dokumente"}` : null,
    stats.unread ? `${stats.unread} ${stats.unread === 1 ? "ungelesene Nachricht" : "ungelesene Nachrichten"}` : null,
  ].filter(Boolean);
  return (
    <div className="mb-8 sm:mb-10">
      <h1 className="font-display text-[2rem] leading-tight text-ink sm:text-5xl">
        {greeting()}, <span className="whitespace-nowrap">{customer.displayName}</span>
      </h1>
      <p className="mt-3 text-[15px] text-ink/70">{parts.join(" · ")}</p>
    </div>
  );
}

export function CurrentProject({ project, others = [] }) {
  return (
    <Card aria-labelledby="current-project">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Overline>Aktuelles Projekt · {project.room}</Overline>
          <h2 id="current-project" className="mt-2 font-display text-2xl text-ink sm:text-3xl">
            {project.title}
          </h2>
          {project.summary && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/70">{project.summary}</p>}
        </div>
        <Link
          href={`/de/portal/projekte/${project.id}`}
          className={`ph-press inline-flex min-h-11 items-center border border-ink/20 px-4 text-sm text-ink transition-colors duration-(--duration-micro) ease-quiet hover:border-ink ${linkFocus}`}
        >
          Projekt öffnen
        </Link>
      </div>

      <div className="mt-6 sm:mt-8">
        <StatusTimeline steps={project.steps} labelledBy="current-project" />
      </div>

      {project.items?.length > 0 && (
        <div className="mt-7 border-t border-ink/10 pt-5">
          <h3 className="text-sm font-semibold text-ink">Positionen</h3>
          <ul className="mt-2 divide-y divide-ink/10">
            {project.items.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="text-ink">{item.name}</span>
                  <span className="text-ink/70"> · {item.brand}</span>
                </span>
                <span className="shrink-0 text-xs capitalize text-ink/70">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.trades?.length > 0 && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <h3 className="text-sm font-semibold text-ink">Gewerke – koordiniert vom Studio</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {project.trades.map((t) => (
              <li key={t.id} className="bg-bone px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{TRADES[t.trade] || t.trade}</span>
                  <Badge tone={t.status === "erledigt" ? "neutral" : t.status === "offen" ? "neutral" : "gold"}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-ink/70">{t.scope}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <h3 className="text-sm font-semibold text-ink">Weitere Projekte</h3>
          <ul className="mt-2 space-y-2">
            {others.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/de/portal/projekte/${p.id}`}
                  className={`flex min-h-11 items-center justify-between gap-3 px-1 text-sm transition-colors duration-(--duration-micro) ease-quiet hover:bg-bone ${linkFocus}`}
                >
                  <span className="text-ink">{p.title}</span>
                  <span className="text-xs text-ink/70">{stepLabel(p.currentStep)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function Appointments({ items }) {
  return (
    <Card aria-labelledby="dash-termine">
      <CardHeading id="dash-termine" title="Nächste Termine" href="/de/portal/termine" />
      {items.length === 0 ? (
        <Empty>Aktuell sind keine Termine geplant.</Empty>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex gap-4 bg-bone p-4">
              <div className="w-14 shrink-0 text-center">
                <CalendarDays size={18} className="mx-auto text-gold-text" aria-hidden="true" />
                <p className="mt-1 text-xs font-semibold text-ink">{formatWeekday(a.start)}</p>
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">{a.title}</p>
                <p className="text-ink/70">
                  {APPOINTMENT_KINDS[a.kind] || a.kind} · {formatTimeRange(a.start, a.end)} · {relativeDays(a.start)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-ink/70">
                  <MapPin size={14} aria-hidden="true" /> {a.location}
                </p>
                {a.status === "angefragt" && (
                  <p className="mt-1.5">
                    <Badge tone="gold">noch nicht bestätigt</Badge>
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Documents({ items }) {
  return (
    <Card aria-labelledby="dash-dokumente">
      <CardHeading id="dash-dokumente" title="Neue Dokumente" href="/de/portal/dokumente" />
      {items.length === 0 ? (
        <Empty>Noch keine Dokumente vorhanden.</Empty>
      ) : (
        <ul className="divide-y divide-ink/10">
          {items.map((d) => (
            <li key={d.id}>
              <Link
                href={`/de/portal/dokumente?typ=${d.type}#${d.id}`}
                className={`flex min-h-14 items-start gap-3 py-3 transition-colors duration-(--duration-micro) ease-quiet hover:bg-bone/60 ${linkFocus}`}
              >
                <FileText size={18} className="mt-0.5 shrink-0 text-ink/70" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{DOCUMENT_TYPES[d.type]?.label}</span>
                    {d.status === "neu" && <Badge tone="new">Neu</Badge>}
                  </span>
                  <span className="block text-ink/80">{d.title}</span>
                  <span className="block text-xs text-ink/70">
                    {d.number} · {formatDate(d.date)}
                    {d.amount == null && d.amountNote ? ` · Betrag: ${amountLabel(d)}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Messages({ items }) {
  return (
    <Card aria-labelledby="dash-nachrichten">
      <CardHeading id="dash-nachrichten" title="Nachrichten" href="/de/portal/nachrichten" />
      {items.length === 0 ? (
        <Empty>Keine Nachrichten.</Empty>
      ) : (
        <ul className="space-y-4">
          {items.map((m) => (
            <li key={m.id} className="text-sm">
              <p className="flex items-center gap-2 text-xs text-ink/70">
                {!m.read && m.from === "studio" && (
                  <span className="size-2 rounded-full bg-gold" aria-label="ungelesen" role="img" />
                )}
                <span className="font-semibold text-ink">{m.from === "studio" ? m.author : "Sie"}</span>
                <span>· {formatShortDate(m.sentAt)}</span>
              </p>
              <p className="mt-1 line-clamp-3 leading-relaxed text-ink/80">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const QUICK_LINKS = [
  { href: "/de/portal/pass", label: "Produktpass", text: "Pflege, Garantie und Service zu Ihren Stücken", Icon: ShieldCheck },
  { href: "/de/portal/gewerke", label: "Gewerke", text: "Wer wann an Ihrem Projekt arbeitet", Icon: Hammer },
  { href: "/de/portal/anfragen", label: "Neue Planung", text: "Ein weiterer Raum oder ein neues Vorhaben", Icon: PencilRuler },
];

/** Tile row to the areas that are not in the mobile bottom bar. */
export function QuickLinks() {
  return (
    <nav aria-label="Weitere Bereiche" className="mt-5 lg:mt-6">
      <ul className="grid gap-3 sm:grid-cols-3 lg:gap-6">
        {QUICK_LINKS.map(({ href, label, text, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              // Motion: ph-lift = 2 px lift on hover (mouse only, transform; never when calm).
              className={`ph-lift group flex h-full min-h-16 items-center gap-4 border border-ink/10 bg-white p-4 transition-colors duration-(--duration-micro) ease-quiet hover:border-ink/30 sm:p-5 ${linkFocus}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center bg-gold/15 text-gold-text">
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight text-ink">{label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink/75">{text}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-ink/60 transition-transform duration-(--duration-micro) ease-quiet group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Advisor({ advisor }) {
  if (!advisor) return null;
  return (
    <Card aria-labelledby="dash-kontakt" tone="dark">
      <h2 id="dash-kontakt" className="font-display text-xl">
        Ihr Kontakt im Studio
      </h2>
      <p className="mt-1 text-sm text-white/80">{advisor.name}</p>
      <ul className="mt-4 space-y-1 text-sm">
        <li>
          <a href={`tel:${advisor.phone.replace(/\s/g, "")}`} className={`inline-flex min-h-11 items-center gap-2 hover:underline ${linkFocus}`}>
            <Phone size={16} aria-hidden="true" /> {advisor.phone}
          </a>
        </li>
        <li>
          <a href={`mailto:${advisor.email}`} className={`inline-flex min-h-11 items-center gap-2 hover:underline ${linkFocus}`}>
            <Mail size={16} aria-hidden="true" /> {advisor.email}
          </a>
        </li>
      </ul>
    </Card>
  );
}
