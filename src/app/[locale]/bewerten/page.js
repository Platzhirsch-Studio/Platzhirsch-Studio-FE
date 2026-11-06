// /de/bewerten — short URL for Google reviews (target of the QR card handed
// out at delivery, assembly and pick-up). German only; other locales 404.
// noindex: this is a utility page, not a search landing page.
//
// Google rules: every customer sees the same page and the same options
// (no "review gating", no question "Were you satisfied?" before the link),
// and there is no incentive of any kind for leaving a review.
//
// Design-Bibel: role tokens only (surface, text, action, line), no radius, no
// shadow, sentence-case buttons (text-ui, no uppercase tracking), exactly one
// filled button per view; the second path is `secondary` (1 px ink frame).
//
// Runde 2 (Bericht 60, „Website-Anbindung Runde 2“): Übersicht veröffentlichter
// Bewertungen (ph_marketing.api.get_bewertungen, kurz gecacht; alt/ohne Zugang:
// Leerzustand, nichts Erfundenes) und – nur mit Gruppe "bewertung" auf ph und
// Zugang – das direkte Bewertungsformular (create_bewertung über
// /de/bewerten/senden). Beides steht NACH dem Google-Link; alle sehen dieselben
// Wege, unabhängig von der Sternezahl.
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { EMAIL, EMAIL_HREF, GBP, PHONE_DISPLAY, PHONE_HREF, SITE_NAME, SITE_URL } from "@/lib/site";
import ReviewNotice from "@/components/Legal/ReviewNotice";
import ReviewLink from "./ReviewLink";
import { ogLocale } from "@/lib/seo/pageMetadata";
import BewertungForm from "@/components/Bewerten/BewertungForm";
import BewertungListe from "@/components/Bewerten/BewertungListe";
import { bewertungFormAvailable, loadBewertungen } from "@/lib/bewertungen/backend";
import { bewertungCopy } from "@/lib/bewertungen/copy";

// Review link from src/lib/site.js (GBP.reviewUrl, one source for page, QR
// card and mails). Until the Place-ID is entered there, it is the profile cid
// link: it opens the profile directly instead of a search list, and the
// customer taps "Rezension schreiben".
const GOOGLE_REVIEW_URL = GBP.reviewUrl;
const HAS_DIRECT_REVIEW_LINK = GOOGLE_REVIEW_URL.includes("writereview");

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  const title = `Bewerten Sie uns | ${SITE_NAME}`;
  const description =
    "Danke für Ihr Vertrauen. Hier können Sie Platzhirsch Home Living auf Google bewerten oder uns Ihre Rückmeldung direkt schicken.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/de/bewerten` },
    // A page openGraph replaces the layout one, so it repeats the layout image.
    openGraph: {
      type: "website",
      url: `${SITE_URL}/de/bewerten`,
      title,
      description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: "/Images/Home/aboutHome.jpg", alt: SITE_NAME }],
    },
  };
}

const btnBase =
  "inline-flex h-12 w-full items-center justify-center gap-2 px-8 text-ui transition-colors duration-(--duration-micro) ease-quiet sm:w-auto lg:h-13";
const btnPrimary = `${btnBase} bg-action text-text-inverse hover:bg-action-hover`;
const btnSecondary = `${btnBase} border border-action text-text hover:bg-action hover:text-text-inverse`;
const inlineLink = "underline underline-offset-4 decoration-line-strong hover:decoration-text";

export default async function BewertenPage({ params, searchParams }) {
  const { locale } = await params;
  // Quelle der Bewertung: Mail-Links tragen utm_source=email (src/lib/kundenbetreuung/reisen.js),
  // die QR-Karte im Showroom zeigt auf die nackte URL /de/bewerten.
  const sp = (await searchParams) || {};
  const utm = String(sp.utm_source || "").toLowerCase();
  const quelle = utm === "email" ? "mail" : utm ? "direkt" : "qr";
  if (locale !== "de") notFound();
  const c = bewertungCopy(locale);
  const formular = bewertungFormAvailable();
  const liste = await loadBewertungen();

  return (
    <div className="bg-surface text-text">
      <section aria-labelledby="bw-titel" className="px-gutter pt-10 pb-16 md:pt-14 md:pb-24 lg:pt-16">
        <div className="mx-auto grid max-w-page gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:col-start-2">
            <p className="text-overline uppercase text-text-accent">{SITE_NAME} · Lochau</p>
            <h1 id="bw-titel" className="font-display text-display-l mt-stack-s">
              Danke für Ihr Vertrauen
            </h1>
            <p className="mt-stack-m max-w-measure text-lead">
              Wir hoffen, Sie fühlen sich mit Ihren neuen Möbeln wohl. Wie war es mit uns, von der Beratung bis zur
              Lieferung? Ihre ehrliche Meinung hilft anderen bei der Entscheidung und uns dabei, besser zu werden.
            </p>

            <div className="mt-stack-m">
              <ReviewLink
                href={GOOGLE_REVIEW_URL}
                className={btnPrimary}
                aria-describedby="bw-google-hinweis bw-bewertungs-hinweis"
              >
                Auf Google bewerten
                <span aria-hidden="true">↗</span>
              </ReviewLink>
              <p id="bw-google-hinweis" className="mt-2 max-w-measure text-small text-text-soft">
                {HAS_DIRECT_REVIEW_LINK
                  ? "Öffnet das Bewertungsformular von Google in einem neuen Fenster."
                  : "Öffnet unser Google-Profil in einem neuen Fenster. Dort auf „Rezension schreiben“ tippen."}
              </p>
              {/* Review-source notice (AP2 Nr. 6, R4-recht-consent). */}
              <ReviewNotice variant="link" id="bw-bewertungs-hinweis" className="mt-3" />
            </div>
          </div>
        </div>
      </section>

      <div className="px-gutter" aria-hidden="true">
        <div className="mx-auto h-px max-w-page bg-line-strong" />
      </div>

      <section aria-labelledby="bw-liste" className="px-gutter py-section">
        <div className="mx-auto grid max-w-page gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:col-start-2">
            <BewertungListe data={liste} locale={locale} headingId="bw-liste" />
          </div>
        </div>
      </section>

      <div className="px-gutter" aria-hidden="true">
        <div className="mx-auto h-px max-w-page bg-line-strong" />
      </div>

      {formular && (
        <section aria-labelledby="bw-formular" className="px-gutter py-section" data-bewertung-bereich>
          <div className="mx-auto grid max-w-page gap-x-grid lg:grid-cols-12">
            <div className="lg:col-span-7 lg:col-start-2">
              <h2 id="bw-formular" className="font-display text-display-m">
                {c.formTitle}
              </h2>
              <p className="mt-stack-m mb-stack-m max-w-measure text-body">{c.formIntro}</p>
              <BewertungForm locale={locale} copy={c} phone={PHONE_DISPLAY} email={EMAIL} quelle={quelle} />
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="bw-direkt" className="px-gutter py-section">
        <div className="mx-auto grid max-w-page gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:col-start-2">
            <h2 id="bw-direkt" className="font-display text-display-m">
              Lieber direkt an uns?
            </h2>
            <p className="mt-stack-m max-w-measure text-body">
              Lob, Kritik oder eine offene Frage zur Lieferung: Schreiben Sie uns gerne persönlich. Wir lesen jede
              Nachricht und melden uns.
            </p>
            <div className="mt-stack-m flex flex-col gap-3 sm:flex-row">
              <a
                href={`${EMAIL_HREF}?subject=${encodeURIComponent("Feedback zu meinem Einkauf")}`}
                className={btnSecondary}
              >
                E-Mail schreiben
              </a>
              <Link href="/kontakt" className={btnSecondary}>
                Zur Kontaktseite
              </Link>
            </div>
            <p className="mt-6 text-small text-text-soft">
              <a href={EMAIL_HREF} className={`${inlineLink} inline-flex min-h-11 items-center`}>
                {EMAIL}
              </a>
              <span aria-hidden="true"> · </span>
              <a href={PHONE_HREF} className={`${inlineLink} inline-flex min-h-11 items-center tabular`}>
                {PHONE_DISPLAY}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
