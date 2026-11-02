// /de/upload — service page "Fotos per Handy senden" (menu: Planen & Erleben,
// Inhaber-Entscheidung Nr. 9: the item stays, the page is a finished page).
// r1-recht-inhalt P0-4 / r1-technik P0-1: no demo, no test link, no demo
// reference, no consent text on this page. It explains the service and leads
// to Beratung/Kontakt.
//   - uploadsAccepting() false (Löschfrist not confirmed by the owner): the
//     way that works today, documents by e-mail; the personal QR link is not
//     mentioned, because no form hands one out.
//   - uploadsAccepting() true: the QR link after an inquiry, as built.
// No session, no token, no secret is touched here, so a missing
// UPLOAD_TOKEN_SECRET can never turn this page into a 500.
// Feature doc: Marktresearch/digital/features/handy-upload.md
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { UPLOAD_CONFIG, uploadsAccepting } from "@/lib/upload/config";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { portalMetadata } from "@/lib/portal/metadata";

export const dynamic = "force-dynamic";

// Service-Seite, bleibt noindex (SEO-Gutachten: Upload, Portal, Druck).
// portalMetadata: EN/FR/IT bekommen den 404-Titel (WCAG 2.4.2, r5-portal-labs).
export const generateMetadata = portalMetadata({
  title: "Fotos per Handy senden | Platzhirsch Home Living",
  description: "Fotos, Grundriss und ein kurzer Raum-Rundgang helfen uns, Ihre Beratung in Lochau vorzubereiten. So senden Sie uns Ihre Unterlagen.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
});

const STEPS_TODAY = [
  ["Anfrage senden", "Über die Beratungs- oder Kontaktanfrage, mit ein paar Sätzen zu Ihrem Vorhaben."],
  ["Unterlagen mailen", `Fotos und Pläne senden Sie direkt vom Handy an ${EMAIL}, gern mit Ihrem Namen im Betreff. Ein Video zeigen Sie uns beim Termin.`],
  ["Vorbereitet beraten", "Wir sehen uns Ihre Unterlagen vor dem Gespräch an, im Showroom in Lochau oder bei Ihnen vor Ort."],
];

const STEPS_LINK = [
  ["Anfrage senden", "Über die Produkt-, Beratungs- oder Kontaktanfrage."],
  ["QR-Code scannen", `Die Bestätigung zeigt einen persönlichen Link, ${UPLOAD_CONFIG.tokenTtlDays} Tage gültig.`],
  ["Raum zeigen", "Fotos direkt aus der Kamera, ein kurzer Video-Rundgang, Grundriss als PDF, eine Notiz."],
  ["Vorbereitet beraten", "Wir sehen Ihre Unterlagen bei Ihrer Anfrage, vor dem ersten Gespräch."],
];

const WISHES = [
  "Den Raum aus zwei, drei Ecken, bei Tageslicht",
  "Fenster, Türen, Heizkörper und Steckdosen",
  "Möbel und Stücke, die bleiben sollen",
  "Grundriss oder Skizze mit Maßen, auch von Hand gezeichnet",
];

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
const btn = `inline-flex min-h-12 items-center justify-center gap-2 px-5 text-[15px] font-medium tracking-wide ${focus}`;
const textLink = `font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current ${focus}`;

export default async function UploadServicePage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const accepting = uploadsAccepting();
  const steps = accepting ? STEPS_LINK : STEPS_TODAY;

  return (
    <div className="bg-bone text-ink" data-upload-service={accepting ? "link" : "mail"}>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pt-20 lg:pt-28" aria-labelledby="upload-title">
        <p className="text-overline uppercase text-gold-text">Service · Fotos per Handy</p>
        <h1 id="upload-title" className="font-display mt-3 text-display-l text-balance">Fotos per Handy senden</h1>
        <p className="mt-5 max-w-2xl text-lead text-ink/85 text-pretty">
          Fotos Ihrer Räume, ein Grundriss und ein kurzer Rundgang helfen uns, die Beratung vorzubereiten. So sehen wir
          vor dem ersten Gespräch, wie Ihr Raum wirkt, wo Fenster und Anschlüsse liegen und was bleiben soll.
        </p>

        <h2 className="mt-12 text-lg font-semibold">So geht es</h2>
        <ol className={`mt-4 grid border-t border-line-strong sm:grid-cols-2 ${steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          {steps.map(([title, text], i) => (
            <li key={title} className="border-b border-line py-5 sm:pr-6 lg:border-b-0">
              <span className="text-sm font-semibold tabular-nums text-gold-text" aria-hidden="true">0{i + 1}</span>
              <p className="mt-2 text-base font-medium">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/85">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line bg-paper" aria-labelledby="upload-wishes">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="upload-wishes" className="font-display text-display-m text-balance">Was uns hilft</h2>
            <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-ink/85">
              {WISHES.map((w) => (
                <li key={w} className="flex gap-3">
                  <span className="mt-[0.6em] size-1.5 shrink-0 bg-gold-text" aria-hidden="true" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-ink/85">
              Bitte fotografieren Sie keine Personen ohne deren Einverständnis, keine Ausweise und keine Dokumente.
            </p>
          </div>
          <div className="lg:border-l lg:border-line lg:pl-16">
            <h2 className="font-display text-display-m text-balance">Aus Fotos wird ein Konzept</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink/85">
              Mit Ihren Fotos und Maßen bereitet Harald Menghin das Gespräch vor. Das Konzept zeichnet er von Hand,
              erst dann folgen 3D-Planung und Rendering.
            </p>
            <p className="mt-4">
              <Link href="/de/arbeitsweise" className={textLink}>
                Unsere Arbeitsweise
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="upload-next">
        <h2 id="upload-next" className="font-display text-display-m text-balance">Erst anfragen, dann zeigen</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/85">
          {accepting
            ? "Nach dem Absenden einer Anfrage zeigt Ihnen die Bestätigung den QR-Code für Ihren persönlichen Upload-Link."
            : "Schicken Sie uns zuerst Ihre Anfrage. Ihre Fotos und Pläne ordnen wir ihr dann zu."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/de/beratung" className={`${btn} bg-ink text-white hover:bg-ink-deep`}>
            Beratung anfragen
          </Link>
          <Link href="/de/kontakt" className={`${btn} border border-ink/30 bg-white text-ink hover:border-ink`}>
            Kontakt
          </Link>
        </div>
        <ul className="mt-6 flex flex-col gap-1 text-[15px] sm:flex-row sm:gap-8" aria-label="Direkt erreichen">
          <li>
            <a href={PHONE_HREF} className={`inline-flex min-h-11 items-center gap-2 ${textLink}`}>
              <Phone size={17} aria-hidden="true" /> {PHONE_DISPLAY}
            </a>
          </li>
          <li>
            <a href={EMAIL_HREF} className={`inline-flex min-h-11 items-center gap-2 break-all ${textLink}`}>
              <Mail size={17} aria-hidden="true" /> {EMAIL}
            </a>
          </li>
        </ul>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink/80">
          Ihre Unterlagen nutzen wir nur für Ihre Anfrage. Mehr dazu in der{" "}
          <Link href="/de/datenschutz" className={textLink}>
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
