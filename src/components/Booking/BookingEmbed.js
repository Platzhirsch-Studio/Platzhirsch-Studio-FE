// src/components/Booking/BookingEmbed.js
// Online appointment behind the BOOKING_PROVIDER switch (config.js).
// "none" (default): renders nothing. "link": a quiet band with a link that
// opens the provider in a new window. "frappe": the same band, linking to our
// own calendar /[locale]/termin in the same tab (no third party at all).
// Nothing of a provider is loaded before that click – no iframe, no script,
// no prefetch (Recht 14 F8: calendar only after a click, AVV/EU region
// before switching it on). No WhatsApp here while the number is missing (E8).
// Server component; texts from the messages (`booking.*`) or the fallback
// table in src/lib/forms/leadsCopy.js.
//
// variant="top" (Nachbessern Online-Kalender): the entry „Termin online wählen“
// at the top of /beratung, shown whenever our own calendar is usable
// (ownCalendarActive: terminMode "frappe" or "mock"), independent of
// BOOKING_PROVIDER. The enquiry form stays right below as the alternative.
// Texts: termin.einstieg (src/lib/booking/copy.js = src/messages/*.json).
// The default (bottom) band then steps aside for "frappe" (no second entry).
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { Button, Heading } from "@/components/ui";
import { leadsCopy } from "@/lib/forms/leadsCopy";
import { terminCopy } from "@/lib/booking/copy";
import { bookingConfig, ownCalendarActive } from "./config";
import { withContext } from "@/lib/forms/pathContext";
import { terminLabel } from "@/lib/forms/terminLink";

// Rat 9,5 B1: the entry keeps the request context (?thema=, ?produkt=, ?plan= …)
// and uses the same word as every other calendar link („Termin wählen“).
function TopEntry({ locale, context = {} }) {
  const e = terminCopy(locale).einstieg;
  const href = withContext("/termin", context);
  return (
    <section aria-labelledby="termin-online-oben" className="border-b border-line bg-surface-band max-lg:mt-6" data-termin-einstieg>
      {/* Phones (prüfung-technik P1, r5-conv-p3: first wizard option within
          500 px, also with the cookie bar): only the button in a slim band;
          heading stays for screen readers (section name), the text from md up. */}
      <div className="mx-auto flex w-full max-w-page flex-col gap-5 px-gutter py-1.5 md:flex-row md:items-center md:justify-between md:py-10">
        <div className="max-w-text max-md:sr-only">
          <Heading level={2} size="title" id="termin-online-oben">
            <span className="inline-flex items-center gap-3">
              <CalendarDays aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
              {e.title}
            </span>
          </Heading>
          <p className="mt-stack-s text-body text-text-soft">{e.text}</p>
        </div>
        <Button href={href} prefetch={false} variant="secondary" arrow data-booking-provider="own" className="w-full max-md:min-h-11! md:w-auto md:shrink-0 md:whitespace-nowrap">
          {terminLabel(locale, { calendar: true }) || e.cta}
        </Button>
      </div>
    </section>
  );
}

export default async function BookingEmbed({ locale, config = bookingConfig(), variant = "band", calendarActive = ownCalendarActive(), context = {} }) {
  if (variant === "top") return calendarActive ? <TopEntry locale={locale} context={context} /> : null;
  if (!config || (config.provider !== "link" && config.provider !== "frappe")) return null;
  if (config.provider === "frappe" && calendarActive) return null;
  const t = await getTranslations({ locale });
  const copy = (key, vars) => leadsCopy(t, locale, `booking.${key}`, vars);
  const own = config.provider === "frappe";

  return (
    <section aria-labelledby="termin-online" className="border-t border-line bg-surface-band">
      <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-gutter py-12 md:flex-row md:items-center md:justify-between md:py-16">
        <div className="max-w-text">
          <Heading level={2} size="title" id="termin-online">
            <span className="inline-flex items-center gap-3">
              <CalendarDays aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
              {copy("title")}
            </span>
          </Heading>
          <p className="mt-stack-s text-body text-text-soft">{copy("text")}</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {own ? (
            <Button href={config.path} variant="secondary" arrow data-booking-provider="frappe" className="w-full md:w-auto">
              {copy("cta")}
            </Button>
          ) : (
            <>
              <Button
                href={config.url}
                variant="secondary"
                target="_blank"
                rel="noopener noreferrer"
                data-booking-provider="link"
                aria-describedby="termin-online-hinweis"
                className="w-full md:w-auto"
              >
                {copy("cta")}
              </Button>
              {/* Linked to the button (WCAG 3.2.5 / G201): screen readers announce the new window. */}
              <p id="termin-online-hinweis" className="text-small text-text-soft">{copy("note", { host: config.host })}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
