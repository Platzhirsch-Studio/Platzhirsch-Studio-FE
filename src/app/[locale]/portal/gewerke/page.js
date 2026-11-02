import Link from "next/link";
import { CalendarDays, Mail, Phone } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { formatDate, formatTimeRange } from "@/lib/portal/format";
import { Badge, Card, Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import { TRADE_STATUS, TRADE_STATUS_ORDER, focusRing, tradeLabel } from "@/components/Portal/Docs/labels";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Gewerke",
  robots: { index: false, follow: false },
});

/** Four-step progress for one trade (offen -> erledigt). */
function TradeProgress({ status, label }) {
  const idx = TRADE_STATUS_ORDER.indexOf(status);
  return (
    <div>
      <ol className="grid grid-cols-4 gap-1" aria-label={`Fortschritt ${label}`}>
        {TRADE_STATUS_ORDER.map((s, i) => (
          <li key={s} className="min-w-0">
            <span aria-hidden="true" className={`block h-1.5 ${i <= idx ? "bg-gold" : "bg-ink/10"}`} />
            <span className={`mt-1 block truncate text-xs ${i === idx ? "font-semibold text-ink" : "text-ink/75"}`}>
              {TRADE_STATUS[s].label}
              {i === idx && <span className="sr-only"> (aktueller Stand)</span>}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function GewerkePage() {
  const portal = await getPortal("/de/portal/gewerke");
  const [projects, appointments] = await Promise.all([portal.listProjects(), portal.listAppointments()]);
  const byId = Object.fromEntries(appointments.map((a) => [a.id, a]));
  const advisor = portal.customer.advisor;
  const withTrades = projects.filter((p) => p.trades?.length);
  const without = projects.filter((p) => !p.trades?.length);

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader
        overline="Alles aus einer Hand"
        title="Gewerke"
        intro="Wer arbeitet wann an Ihrem Projekt? Wir koordinieren Tischler, Elektriker, Installateur, Steinmetz und weitere Handwerker – Sie haben einen Ansprechpartner: uns."
      />

      {withTrades.length === 0 && <Empty>Für Ihre Projekte sind keine weiteren Gewerke eingeplant.</Empty>}

      <div className="space-y-6">
        {withTrades.map((p) => {
          const done = p.trades.filter((t) => t.status === "erledigt").length;
          return (
            <Card key={p.id} aria-labelledby={`gw-${p.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{p.room}</p>
                  <h2 id={`gw-${p.id}`} className="mt-1 font-display text-2xl text-ink">
                    {p.title}
                  </h2>
                </div>
                <p className="text-sm text-ink/70">
                  {done} von {p.trades.length} Gewerken erledigt
                </p>
              </div>

              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {p.trades.map((t) => {
                  const st = TRADE_STATUS[t.status] || { label: t.status, tone: "neutral" };
                  const appt = t.appointmentId ? byId[t.appointmentId] : null;
                  const contact = t.contact; // optional {name, phone, email} once partners are confirmed
                  return (
                    <li key={t.id} className="flex flex-col gap-3 border border-ink/10 bg-bone/60 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-ink">{tradeLabel(t.trade)}</h3>
                          <p className="text-sm text-ink/70">{t.company}</p>
                        </div>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-ink/80">{t.scope}</p>
                      <TradeProgress status={t.status} label={tradeLabel(t.trade)} />
                      {appt && (
                        <Link
                          href={`/de/portal/termine#${appt.id}`}
                          className={`flex min-h-11 items-center gap-2 bg-white px-3 text-sm text-ink hover:bg-white/70 ${focusRing}`}
                        >
                          <CalendarDays size={16} className="shrink-0 text-gold-text" aria-hidden="true" />
                          <span className="min-w-0">
                            {formatDate(appt.start)}, {formatTimeRange(appt.start, appt.end)}
                            {appt.status === "angefragt" && <span className="text-ink/70"> · noch nicht bestätigt</span>}
                          </span>
                        </Link>
                      )}
                      <div className="border-t border-ink/10 pt-3 text-[13px] text-ink/80">
                        <p className="font-semibold text-ink">Ansprechpartner</p>
                        {contact?.name ? (
                          <p>
                            {contact.name}
                            {contact.phone && <> · {contact.phone}</>}
                          </p>
                        ) : (
                          <p>Koordination über {advisor?.name || "Ihr Beratungsteam"} – Sie müssen den Betrieb nicht selbst kontaktieren.</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}

        {without.length > 0 && (
          <Card aria-labelledby="gw-ohne">
            <h2 id="gw-ohne" className="font-display text-xl text-ink">
              Projekte ohne weitere Gewerke
            </h2>
            <ul className="mt-3 space-y-1 text-sm text-ink/80">
              {without.map((p) => (
                <li key={p.id}>
                  {p.title} – Lieferung und Montage übernimmt unser Team.
                </li>
              ))}
            </ul>
          </Card>
        )}

        {advisor && (
          <Card tone="dark" aria-labelledby="gw-kontakt">
            <h2 id="gw-kontakt" className="font-display text-xl">
              Ihre zentrale Koordination
            </h2>
            <p className="mt-1 text-sm text-white/80">{advisor.name}</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 text-sm">
              <li>
                <a href={`tel:${advisor.phone.replace(/\s/g, "")}`} className={`inline-flex min-h-11 items-center gap-2 hover:underline ${focusRing}`}>
                  <Phone size={16} aria-hidden="true" /> {advisor.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${advisor.email}`} className={`inline-flex min-h-11 items-center gap-2 hover:underline ${focusRing}`}>
                  <Mail size={16} aria-hidden="true" /> {advisor.email}
                </a>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
