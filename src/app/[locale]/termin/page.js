// /[locale]/termin – Online-Kalender: Terminart, Tag + Uhrzeit, Kontakt, Bestätigung.
// Betriebsart aus src/lib/booking/config.js (terminMode): "mock" im Dev ohne
// Neustart (Testbetrieb, deutlich markiert, noindex), "frappe" mit Backoffice,
// "off" verweist auf /beratung und das Telefon (noindex).
// Pro Anfrage gerendert (connection): Schalter und Vorauswahl ?art=/?thema=/
// ?modus= stehen im ersten HTML. Der LCP ist die Überschrift (kein Bild).
// ?produkt= (Kopf-CTA auf Produktseiten, Navbar/HeaderCta) füllt das Anliegen vor.
// Der Kopf ist knapp gehalten, damit die erste Terminart im ersten Bildschirm
// anschneidet (QA UX P2-1); der Kern-USP steht unter den Karten (Schritt 1).
// id="anfrage": Footer-Knopf springt auf dieser Seite hierher (TerminContextLink).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import { Breadcrumbs, Container, Eyebrow, Heading, Lead, LinkArrow } from "@/components/ui";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import BookingWizard from "@/components/Termin/BookingWizard";
import { TERMIN_LOCALES, terminCopy, fill } from "@/lib/booking/copy";
import { outboxVisible, terminMode } from "@/lib/booking/config";
import { CITY_NAMES, attachmentLines, attachmentsOf, cleanText } from "@/lib/forms/beratungContext";
import { getTranslations } from "next-intl/server";
import TrustBlock from "@/components/Beratung/TrustBlock";
// Rat 9,5 B7 (T3): the studio drawing of the appointment, labelled „Schema des Studios“.
import { boardLabel } from "@/components/Beratung/t1Copy";
import { boardCardCount } from "@/lib/forms/boardCount";
import { schreibenHref, terminLabel } from "@/lib/forms/terminLink";
// Yacht team (31.10.2026): topic hint and "visit on board" note (src/lib/forms/topicHints.js).
import { anliegenHint, boardNote } from "@/lib/forms/topicHints";
import { uploadsAccepting } from "@/lib/upload/config";
import { ART_KEYS, THEMEN } from "@/lib/booking/types";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const c = terminCopy(locale);
  const live = terminMode() === "frappe";
  return {
    title: c.meta.title,
    description: c.meta.description,
    robots: live ? { index: true, follow: true } : { index: false, follow: true },
    alternates: { canonical: `/${locale}/termin`, languages: hreflangLanguages((l) => `/${l}/termin`) },
    openGraph: { type: "website", url: `/${locale}/termin`, title: c.meta.title, description: c.meta.description, siteName: "Platzhirsch Home Living", locale: ogLocale(locale) },
  };
}

const pick = (v, list) => (typeof v === "string" && list.includes(v) ? v : null);
const first = (v) => (Array.isArray(v) ? v[0] : v);

// Rat 9,5 B1/B2: /termin reads the same context as /beratung. Page topics
// (pathContext: sofa, interior, objekt …) map onto the planning topics of
// the calendar (lib/booking/types.js THEMEN); unknown values are ignored.
const TERMIN_THEMA = Object.freeze({
  kueche: "kueche",
  kuechen: "kueche",
  sofa: "wohnen",
  wohnen: "wohnen",
  interior: "wohnen",
  ezarri: "ezarri",
  mosaik: "ezarri",
  licht: "licht",
  yacht: "yacht",
  boot: "yacht",
  hotel: "hotel",
  objekt: "hotel",
  chalet: "hotel",
});
const PLANER_THEMA = { kuechenplaner: "kueche", sofaplaner: "wohnen", "stil-finder": "wohnen", ezarri: "ezarri", "bodensee-licht": "licht", yacht: "yacht" };

// QM content-legal r3 (desktop): the side column showed a line drawing captioned
// „Schema des Studios“ in a grey box – it read as a placeholder. Now the own
// photo of the showroom (aboutHome.jpg, rights cleared, Inhaber-Entscheidung
// Nr. 11 – the same picture as on /kontakt) with a short caption.
const STUDIO_PHOTO = "/Images/Home/aboutHome.jpg";
const STUDIO_PHOTO_COPY = {
  de: { alt: "Die Ausstellung in Lochau: helle Sofas, zwei Sessel und ein Kamin hinter Vorhängen", caption: "Die Ausstellung in Lochau, Landstraße 11" },
  en: { alt: "The showroom in Lochau: light sofas, two armchairs and a fireplace behind curtains", caption: "The showroom in Lochau, Landstraße 11" },
  fr: { alt: "Le showroom de Lochau : canapés clairs, deux fauteuils et une cheminée derrière des rideaux", caption: "Le showroom de Lochau, Landstraße 11" },
  it: { alt: "Lo showroom di Lochau: divani chiari, due poltrone e un camino dietro le tende", caption: "Lo showroom di Lochau, Landstraße 11" },
};

export default async function TerminPage({ params, searchParams }) {
  await connection();
  const { locale } = await params;
  if (!TERMIN_LOCALES.includes(locale)) notFound();
  const sp = (await searchParams) || {};
  const c = terminCopy(locale);
  const mode = terminMode();
  // Nur, was der Client braucht (Mail- und Verwaltungstexte bleiben auf dem Server).
  const { mail: _mail, manage: _manage, testraum: _testraum, meta: _meta, confirm: _confirm, einstieg: _einstieg, write: _write, ...clientCopy } = c;
  const rawThema = String(first(sp.thema) || "").split(",")[0].trim().toLowerCase();
  const thema = pick(TERMIN_THEMA[rawThema] || rawThema, THEMEN) || pick(PLANER_THEMA[String(first(sp.planer) || "")], THEMEN);
  // Context lines in the page language (the same texts as the /beratung wizard).
  const tCtx = await getTranslations({ locale, namespace: "MultiStepForm.context" });
  const ort = CITY_NAMES[String(first(sp.ort) || "").toLowerCase()] || null;
  const att = attachmentsOf(sp);
  const boardCount = att.ideenboard ? await boardCardCount(att.ideenboard) : null;
  if (boardCount === "gone") att.ideenboard = null;
  const produkt = typeof first(sp.produkt) === "string" && first(sp.produkt).trim() ? cleanText(first(sp.produkt), 120) : "";
  const tf = await getTranslations({ locale, namespace: "forms" });
  // Yacht team (31.10.2026): the topic line goes into "Ihr Anliegen" like on /beratung
  // ("Es geht um ein Boot oder eine Yacht."). It is the only trace of the topic
  // when the visitor books "Bei Ihnen vor Ort" (a visit on board): that type
  // carries no `thema` (BookingWizard sends thema only for "planung").
  const topicLine = thema === "yacht" && tCtx.has("themaYacht") ? tCtx("themaYacht") : "";
  const contextLines = [topicLine, produkt, ort && tCtx.has("ort") ? tCtx("ort", { ort }) : ""].filter(Boolean);
  const attach = attachmentLines(att, { locale, labels: { plan: tf("attach.labelPlan"), ideenboard: tf("attach.labelBoard") } });
  const attachNames = [att.plan ? tf("attach.plan") : null, att.ideenboard ? boardLabel(tf, typeof boardCount === "number" ? boardCount : null) : null].filter(Boolean);
  const initial = {
    art: pick(first(sp.art), ART_KEYS) || (thema ? "planung" : null),
    thema,
    modus: pick(first(sp.modus), ["studio", "video"]),
    anliegen: contextLines.join("\n"),
    // Rat 9,5 B2: attached on send below the visitor's text (not editable, named above the wizard).
    attach,
    // Yacht team: what the studio needs to qualify the request, and how to book a visit on board.
    anliegenHint: anliegenHint(thema, locale, 1000),
    topicNote: boardNote(thema, locale, c.arten?.vor_ort?.title),
  };
  // „Lieber schreiben“ → the form, with the same context (B1).
  const writeContext = Object.fromEntries(["thema", "planer", "ort", "produkt", "plan", "ideenboard"].map((k) => [k, first(sp[k])]).filter(([, v]) => typeof v === "string" && v));
  let uploads = false;
  try {
    uploads = uploadsAccepting();
  } catch {
    uploads = false;
  }
  const outboxHref = mode === "mock" && outboxVisible() ? `/${locale}/termin/postausgang` : null;

  return (
    <Container size="page" className="pt-5 pb-16 sm:pt-8 md:pt-16 md:pb-24">
      {/* Rat 9,5 B7/C3: from lg the studio drawing fills the right column (no empty
          half); on phones it stays out, so the first appointment card stands in the
          first screen (the eyebrow repeats the H1 there and is hidden too). */}
      {/* QM r3 (iPad quer): the drawing stood beside the heading only – from the
          step bar on, 300 px stayed empty right of the wizard. It is now a sticky
          side column next to heading AND wizard. */}
      <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-grid">
      <div className="min-w-0 lg:col-span-8">
      <div className="max-w-text">
        {/* QM r3: the breadcrumb like on every other page (from sm – on phones the
            first appointment card must stay in the first screen). */}
        <Breadcrumbs items={[{ label: homeCrumbLabel(locale), href: "/" }, { label: c.eyebrow }]} className="mb-stack-m max-sm:hidden" />
        <Eyebrow className="max-sm:hidden">{c.eyebrow}</Eyebrow>
        {/* Handy: H1 kleiner, Lead nur für Screenreader (die Karten darunter nennen
            dieselben drei Wege), damit die erste Terminart auch mit Cookie-Leiste im
            ersten Bildschirm steht (Abnahme Termin §5, iPhone DE/EN/FR/IT). */}
        <Heading level={1} className="mt-stack-s text-balance max-sm:mt-0 max-sm:text-[2.25rem] max-sm:leading-[1.08]">
          {c.title}
        </Heading>
        <Lead tone="soft" className="mt-stack-s max-sm:sr-only">
          {c.lead}
        </Lead>
        {mode === "mock" && (
          <p className="mt-4 border-l-2 border-notice pl-4 text-small text-text max-sm:mt-3" data-termin-testbetrieb>
            {c.testBanner}{" "}
            {outboxHref && (
              <a href={outboxHref} className="underline underline-offset-2">
                {c.outboxLink}
              </a>
            )}
          </p>
        )}
      </div>

      {mode === "off" ? (
        <div className="mt-12 max-w-text border-t border-line pt-8" data-termin-off>
          <Heading level={2} size="title">
            {c.off.title}
          </Heading>
          <p className="mt-stack-s text-body text-text-soft">{c.off.text}</p>
          <div className="mt-6 flex flex-col items-start gap-1">
            <LinkArrow href="/beratung">{c.off.cta}</LinkArrow>
            <LinkArrow href={PHONE_HREF}>{fill(c.off.phone, { phone: PHONE_DISPLAY })}</LinkArrow>
          </div>
        </div>
      ) : (
        <>
          {(attachNames.length > 0 || boardCount === "gone") && (
            <div data-termin-attachments="" className="mt-4 max-w-text border-l-2 border-line-strong pl-4 text-ui text-text">
              {attachNames.length > 0 && (
                <p>
                  {tf("attach.title")}: {attachNames.join(" · ")}
                </p>
              )}
              {boardCount === "gone" && <p className="text-small text-text-soft">{tf("attach.boardGone")}</p>}
            </div>
          )}
          <div id="anfrage" className="max-w-[60rem] scroll-mt-20 lg:scroll-mt-24">
            <BookingWizard locale={locale} copy={clientCopy} phone={PHONE_DISPLAY} initial={initial} test={mode === "mock"} uploads={uploads} />
          </div>
          {/* Rat 9,5 B1: the side path, one word, one target (src/lib/forms/terminLink.js). */}
          {/* QM content-legal: the 44 px LinkArrow inside running text stretched its
              line ("Lieber ohne festen / Termin?" on phones) – lead and link wrap as units. */}
          <p data-termin-write="" className="mt-10 flex max-w-text flex-wrap items-center gap-x-2 text-body text-text-soft">
            <span>{c.write.lead}</span>
            <LinkArrow href={schreibenHref(locale, { context: writeContext })} prefetch={false}>
              {terminLabel(locale, { kind: "write" })}
            </LinkArrow>
            <span className="mt-1 block w-full text-small">{c.write.hint}</span>
          </p>
          {/* Rat 9,5 B6: who you talk to, what happens next, hours, privacy. */}
          <TrustBlock locale={locale} variant="band" className="mt-12 max-w-[60rem]" />
        </>
      )}
      </div>
      <figure className="m-0 hidden lg:sticky lg:top-28 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:block">
        <div className="relative aspect-[4/5] max-h-[calc(100svh-12rem)] w-full overflow-hidden bg-linen">
          <Image
            src={STUDIO_PHOTO}
            alt={(STUDIO_PHOTO_COPY[locale] || STUDIO_PHOTO_COPY.de).alt}
            fill
            sizes="(min-width: 1440px) 900px, 60vw"
            quality={60}
            className="object-cover object-[35%_center]"
          />
        </div>
        <figcaption className="mt-2 text-small text-text-soft">{(STUDIO_PHOTO_COPY[locale] || STUDIO_PHOTO_COPY.de).caption}</figcaption>
      </figure>
      </div>
    </Container>
  );
}
