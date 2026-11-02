import { CalendarPlus, MapPin } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { formatDate, formatTimeRange, formatWeekday, relativeDays } from "@/lib/portal/format";
import { Badge, Card, Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader, FilterChips } from "@/components/Portal/Docs/SectionNav";
import { AppointmentChangeForm } from "@/components/Portal/Docs/Forms";
import { APPOINTMENT_STATUS, focusRing, kindLabel } from "@/components/Portal/Docs/labels";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Termine",
  robots: { index: false, follow: false },
});

const BASE = "/de/portal/termine";
const KIND_FILTERS = ["aufmass", "lieferung", "montage", "service"];
const ICS = "/api/portal/dokumente/kalender";

/** Request-time split into upcoming / past (pages here are always dynamic). */
function splitByTime(list) {
  const now = Date.now();
  return { upcoming: list.filter((a) => Date.parse(a.end) >= now), past: list.filter((a) => Date.parse(a.end) < now).reverse() };
}

const one = (v) => (Array.isArray(v) ? v[0] : v);

function AppointmentCard({ a, projectTitle, past }) {
  const st = APPOINTMENT_STATUS[a.status] || { label: a.status, tone: "neutral" };
  return (
    <li id={a.id} className="scroll-mt-32 border border-ink/10 bg-white p-5 target:ring-2 target:ring-gold sm:p-6">
      <div className="flex gap-4">
        <div className="w-20 shrink-0 bg-bone px-1 py-2 text-center">
          <p lang="de" className="text-[11px] uppercase tracking-wide text-ink/70 hyphens-auto [overflow-wrap:anywhere]">{kindLabel(a.kind)}</p>
          <p className="mt-0.5 text-sm font-semibold leading-tight text-ink">{formatWeekday(a.start)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <Badge tone={st.tone}>{st.label}</Badge>
            {!past && <span className="text-xs text-ink/70">{relativeDays(a.start)}</span>}
          </p>
          <h3 className="mt-1.5 text-base font-semibold text-ink">{a.title}</h3>
          <p className="mt-0.5 text-sm text-ink/80">
            {formatDate(a.start)} · {formatTimeRange(a.start, a.end)}
          </p>
          <p className="mt-1 flex items-start gap-1 text-sm text-ink/70">
            <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {a.location}
          </p>
          {projectTitle && <p className="mt-1 text-[13px] text-ink/70">Projekt: {projectTitle}</p>}
          {a.note && <p className="mt-2 bg-bone px-3 py-2 text-[13px] text-ink/80">{a.note}</p>}
        </div>
      </div>

      {!past && a.status !== "abgesagt" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-ink/10 pt-4">
          <a
            href={`${ICS}?termin=${encodeURIComponent(a.id)}`}
            className={`inline-flex min-h-11 items-center gap-2 self-start border border-ink/20 px-4 text-sm text-ink hover:border-ink ${focusRing}`}
          >
            <CalendarPlus size={16} aria-hidden="true" /> In Kalender übernehmen (.ics)
          </a>
          <details className="group bg-bone/70 open:bg-bone">
            <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold text-ink ${focusRing}`}>
              Termin ändern oder absagen
              <span aria-hidden="true" className="transition-transform group-open:rotate-45 motion-reduce:transition-none">
                +
              </span>
            </summary>
            <div className="px-4 pb-4 pt-1">
              <AppointmentChangeForm appointmentId={a.id} />
            </div>
          </details>
        </div>
      )}
    </li>
  );
}

export default async function TerminePage({ searchParams }) {
  const sp = await searchParams;
  const portal = await getPortal(BASE);
  const [all, projects] = await Promise.all([portal.listAppointments(), portal.listProjects()]);
  const art = KIND_FILTERS.includes(one(sp.art)) ? one(sp.art) : "";
  const projectTitle = Object.fromEntries(projects.map((p) => [p.id, p.title]));

  // Delivery and installation are often one appointment ("Lieferung und Montage").
  const matches = (a) => !art || a.kind === art || (art === "montage" && /montage/i.test(a.title));
  const list = all.filter(matches);
  const { upcoming, past } = splitByTime(list);

  const options = [
    { value: "", label: "Alle", href: BASE },
    ...KIND_FILTERS.map((k) => ({ value: k, label: kindLabel(k), href: `${BASE}?art=${k}`, count: all.filter((a) => a.kind === k || (k === "montage" && /montage/i.test(a.title))).length })),
  ];

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader
        overline="Ihre Termine"
        title="Termine"
        intro="Aufmaß, Lieferung, Montage und Service auf einen Blick. Übernehmen Sie Termine in Ihren Kalender oder wünschen Sie eine Änderung – wir bestätigen jede Änderung persönlich."
      >
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={ICS} className={`inline-flex min-h-11 items-center gap-2 bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-deep ${focusRing}`}>
            <CalendarPlus size={16} aria-hidden="true" /> Alle Termine exportieren (.ics)
          </a>
        </div>
      </DocsPageHeader>

      <div className="mb-6">
        <FilterChips label="Terminart" options={options} active={art} />
      </div>

      <section aria-labelledby="ter-kommend">
        <h2 id="ter-kommend" className="mb-3 font-display text-2xl text-ink">
          Kommende Termine
        </h2>
        {upcoming.length === 0 ? (
          <Empty>Keine kommenden Termine{art ? ` der Art „${kindLabel(art)}“` : ""}. Sobald wir einen Termin vorschlagen, erscheint er hier.</Empty>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} a={a} projectTitle={projectTitle[a.projectId]} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="ter-vergangen" className="mt-10">
          <h2 id="ter-vergangen" className="mb-3 font-display text-2xl text-ink">
            Vergangene Termine
          </h2>
          <ul className="space-y-4 opacity-90">
            {past.map((a) => (
              <AppointmentCard key={a.id} a={a} projectTitle={projectTitle[a.projectId]} past />
            ))}
          </ul>
        </section>
      )}

      <Card className="mt-10" aria-labelledby="ter-hinweis">
        <h2 id="ter-hinweis" className="font-display text-xl text-ink">
          Gut zu wissen
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink/80">
          <li>„Noch nicht bestätigt“ heißt: Der Termin hängt z. B. von der Liefermeldung des Herstellers ab. Wir melden uns, sobald er fix ist.</li>
          <li>Der Kalender-Export enthält eine Erinnerung einen Tag vorher. Bei Änderungen bitte erneut exportieren.</li>
          <li>Kurzfristig erreichen Sie uns unter {portal.customer.advisor?.phone}.</li>
        </ul>
      </Card>
    </>
  );
}
