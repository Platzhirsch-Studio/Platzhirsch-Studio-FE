// /[locale]/ideenboard/<shareId> – geteiltes Ideenboard, nur lesen.
// noindex, nofollow, kein Referrer (der geheime Link soll nicht über
// Referer-Header weiterwandern). Unbekannte, widerrufene oder abgelaufene
// Links: freundliche Seite mit 404-Inhalt (notFound()).
// Die Seite wird pro Anfrage gerendert (Speicher lesen), nie gecacht.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { Container, Eyebrow, Heading, Lead } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import BoardCardMedia from "@/components/Pinterest/BoardCardMedia";
import PinterestSave from "@/components/Pinterest/PinterestSave";
import CopyToMine from "@/components/Pinterest/CopyToMine";
import { getSharedBoard } from "@/lib/ideenboard/service";
import { TOKEN_RE } from "@/lib/ideenboard/config";
import { cardSource, pinnable } from "@/lib/ideenboard/model";
import { fmt } from "@/lib/pinterest/copy";
import { getPinCopy } from "@/lib/pinterest/copyServer";
import { routing } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = (await getPinCopy(locale)).ideenboard;
  return {
    title: t.meta.sharedTitle,
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default async function SharedBoardPage({ params }) {
  await connection();
  const { locale, shareId } = await params;
  if (!routing.locales.includes(locale) || !TOKEN_RE.test(shareId || "")) notFound();
  setRequestLocale(locale);
  const board = await getSharedBoard(shareId).catch(() => null);
  if (!board) notFound();
  const t = (await getPinCopy(locale)).ideenboard;
  let date = board.updatedAt;
  try {
    date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(board.updatedAt));
  } catch {
    /* ISO bleibt */
  }

  return (
    <div className="bg-surface text-text" data-ideenboard-shared="">
      <Container as="header" className="pt-10 pb-8 md:pt-14 lg:pt-16">
        <Eyebrow>{t.shared.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s max-w-[20ch] text-balance">
          {t.shared.title}
        </Heading>
        <Lead className="mt-stack-m max-w-measure print:hidden">{t.shared.lead}</Lead>
        <p className="mt-4 text-small tabular-nums text-text-soft">
          {fmt(t.shared.updated, { date })} · {board.cards.length === 1 ? t.countOne : fmt(t.count, { n: board.cards.length })}
          {/* Druck 02.11.: Adresse der geteilten Pinnwand nur im Ausdruck. */}
          <span className="hidden print:inline">
            {" "}
            · {SITE_URL}/{locale}/ideenboard/{shareId}
          </span>
        </p>
        <div className="-ml-3 mt-4 flex flex-wrap items-center gap-x-2 print:hidden">
          <CopyToMine cards={board.cards} labels={{ copyToMine: t.shared.copyToMine, copied: t.shared.copied }} />
          <Link href="/ideenboard" className="inline-flex min-h-11 items-center px-3 text-small underline underline-offset-4">
            {t.shared.own}
          </Link>
        </div>
      </Container>
      <Container className="pb-section">
        {/* Druck 02.11.: drei Karten je Reihe, keine Karte über den Seitenumbruch, Merken-Knopf nicht im Ausdruck. */}
        <ol className="grid grid-cols-1 gap-x-grid gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-y-6 print:pt-6">
          {board.cards.map((c) => {
            // Quelle immer nennen – auch bei Herstellerbildern die Marke
            // (QA Recht P2-5); Merken nur mit Recht UND eigenem Ziel.
            const source = cardSource(c);
            const canPinHere = pinnable(c) && Boolean(c.href);
            return (
              <li key={c.id} data-card-type={c.type} className="print:break-inside-avoid">
                <article aria-labelledby={`sb-${c.id}`}>
                  <BoardCardMedia card={c} />
                  <p className="mt-3 text-overline uppercase text-text-accent">{t.types[c.type] || c.type}</p>
                  <h2 id={`sb-${c.id}`} className={c.type === "notiz" ? "sr-only" : "mt-1 text-title"}>
                    {c.href ? (
                      <a href={c.href} className="underline-offset-4 hover:underline">
                        {c.title}
                      </a>
                    ) : (
                      c.title
                    )}
                  </h2>
                  {c.subtitle && <p className="mt-1 text-small text-text-soft">{c.subtitle}</p>}
                  {source && <p className="mt-1 text-small text-text-soft">{fmt(t.card.source, { quelle: source })}</p>}
                  {c.note && c.type !== "notiz" && <p className="mt-3 border-l-2 border-line-strong pl-4 text-body whitespace-pre-line">{c.note}</p>}
                  {canPinHere && (
                    <div className="-ml-3 mt-2 print:hidden">
                      <PinterestSave url={c.href} media={c.image} title={c.title} brand={c.type === "moebel" ? c.subtitle : c.quelle === "Ezarri" ? "Ezarri" : undefined} room={c.room} />
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </Container>
    </div>
  );
}
