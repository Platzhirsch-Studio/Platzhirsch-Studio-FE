// /[locale]/shop/bestellung?b=<Bestellnummer>&k=<Token> — Bestellbestätigung
// und Status (Rücksprung von Stripe Checkout bzw. nach der Reservierung).
// Zeigt den Stand aus der lokalen Ablage (.data/shop, vom Webhook gesetzt),
// Tracking-Link sobald die Sendung angelegt ist. Nur SHOP_MODE test/live.
// Shop-Feeling (31.10.2026): Titel je Sprache, Datum, Zahlungsart, „Wie es
// weitergeht“ (Versand/Abholung/Zahlung offen), Rechtstexte (Slots) und
// „Weiter einkaufen“. Keine Lieferzeit (kommt nur aus der Konfiguration).
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import AutoRefresh from "@/components/Payments/AutoRefresh";
import ClearCartOnMount from "@/components/Shop/ClearCartOnMount";
import TestBanner from "@/components/Shop/TestBanner";
import { NOINDEX } from "@/lib/commerce/mode";
import { trackingLink } from "@/lib/commerce/shipping/letmeship";
import { textOf } from "@/lib/katalog/schema";
import { fillCopy, shopCopy } from "@/lib/shop/copy";
// euroKurz: „€ 119“ wie auf Produktseite und Kachel (Cent nur, wenn vorhanden).
import { euroKurz as euro } from "@/lib/shop/format";
import { shopMode } from "@/lib/shop/mode";
import { SHOP_LEGAL, legalSlotDraft, legalSlotReleased } from "@/lib/shop/legal";
import { shopOrder } from "@/lib/shop/server";
import { UST_NORMALSATZ_AT } from "@/lib/shop/ust";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: `${shopCopy(locale).orderTitle} | Platzhirsch Home Living`, robots: NOINDEX };
}

const DATUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

const DONE = ["bezahlt", "versandbereit", "reserviert"];

export default async function BestellungPage({ params, searchParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { b, k } = await searchParams;
  await connection();
  const mode = shopMode(process.env);
  if (mode === "off") notFound();
  const c = shopCopy(locale);
  const o = await shopOrder(b, k);
  const track = o?.sendung?.awb && !o.sendung.mock ? trackingLink(o.sendung.carrier, o.sendung.awb) : null;
  // USt je Satz aus der Bestellung (ust.js); ältere Bestellungen ohne Aufteilung: eine Zeile zum AT-Normalsatz.
  const ustPosten = o?.summen?.ust?.posten?.length ? o.summen.ust.posten : o ? [{ satz: UST_NORMALSATZ_AT, ustCent: o.summen.mwstCent }] : [];
  const title = !o ? c.notFound : o.status === "reserviert" ? c.thanksReserve : DONE.includes(o.status) ? c.thanks : `${c.orderTitle} ${o.id}`;
  return (
    <div className="bg-surface-raised pt-6 pb-section text-text md:pt-10">
      <Container size="text">
        {(mode === "test" || o?.testmodus) && <TestBanner text={c.testBanner} />}
        <Heading level={1} size="display-m" className="mt-8">
          {title}
        </Heading>
        {o && (
          <>
            {DONE.includes(o.status) && <ClearCartOnMount orderId={o.id} />}
            {["offen", "zahlung_ausstehend"].includes(o.status) && <AutoRefresh />}
            <dl className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-body" data-shop-bestellung={o.id}>
              <dt className="text-text-soft">{c.orderNo}</dt>
              <dd className="tabular">{o.id}</dd>
              {o.angelegt && (
                <>
                  <dt className="text-text-soft">{c.orderDate}</dt>
                  <dd className="tabular">{new Intl.DateTimeFormat(DATUM[locale] || "de-AT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(o.angelegt))}</dd>
                </>
              )}
              <dt className="text-text-soft">{c.status}</dt>
              <dd data-shop-status={o.status}>{c.statuses[o.status] || o.status}</dd>
              <dt className="text-text-soft">{c.delivery}</dt>
              <dd>{o.lieferart === "abholung" ? c.pickup : `${c.shipping} (${c.countries[o.land] || o.land})`}</dd>
              <dt className="text-text-soft">{c.payment}</dt>
              <dd data-shop-zahlart={o.zahlung}>{o.zahlung === "vorort" ? c.payOnSite : c.payOnline}</dd>
            </dl>
            <dl className="mt-8 max-w-md divide-y divide-line border-y border-line bg-surface text-body">
              {o.zeilen.map((z, i) => (
                <div key={i} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-text-soft">
                    {z.menge} × {z.markeName} {z.name}
                    {z.varianteName ? ` (${textOf(z.varianteName, locale)})` : ""}
                    {z.ustSatz != null && <span className="block text-small" data-shop-zeile-ust={z.ustSatz}>{fillCopy(c.inclVatRate, { satz: z.ustSatz })}</span>}
                  </dt>
                  <dd className="tabular">{euro(z.summeCent, locale)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-text-soft">
                  {c.shippingCost}
                  {o.versand?.versichert ? ` · ${c.insured}` : ""}
                </dt>
                <dd className="tabular">{euro(o.summen.versandCent, locale)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3 font-medium">
                <dt>{c.total}</dt>
                <dd className="tabular" data-shop-gesamt={o.summen.gesamtCent}>
                  {euro(o.summen.gesamtCent, locale)}
                </dd>
              </div>
              {ustPosten.map((p) => (
                <div key={p.satz} className="flex justify-between gap-4 px-4 py-3 text-small text-text-soft" data-shop-ust-satz={p.satz}>
                  <dt>
                    {c.vatIncluded} ({p.satz} %)
                  </dt>
                  <dd className="tabular">{euro(p.ustCent, locale)}</dd>
                </div>
              ))}
            </dl>
            {o.sendung?.awb && (
              <div className="mt-8 text-body" data-shop-tracking={o.sendung.awb}>
                <p className="text-text-soft">{c.tracking}</p>
                {track ? (
                  <a href={track} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {o.sendung.carrier} {o.sendung.awb}
                  </a>
                ) : (
                  <p>
                    {o.sendung.awb}
                    {o.sendung.mock ? ` · ${c.trackingMock}` : ""}
                  </p>
                )}
              </div>
            )}
            <section className="mt-10 max-w-measure" aria-labelledby="bestellung-weiter" data-shop-weiter="">
              <h2 id="bestellung-weiter" className="text-title text-text">
                {c.confirmNext}
              </h2>
              <p className="mt-3 text-body text-text">
                {["offen", "zahlung_ausstehend"].includes(o.status) ? c.confirmPending : o.lieferart === "abholung" ? `${c.confirmPickup}${o.zahlung === "vorort" ? ` ${c.payOnSiteInfo}` : ""}` : DONE.includes(o.status) ? c.confirmShip : c.statuses[o.status] || o.status}
              </p>
              <p className="mt-3 text-small text-text-soft">{c.confirmKeep}</p>
            </section>
            <div className="mt-8 text-small" data-shop-recht="">
              <p className="text-text-soft">{c.legalTitle}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {SHOP_LEGAL.map((s) => (
                  <li key={s.id} data-shop-recht-slot={s.id}>
                    {(legalSlotReleased(s) || (o.testmodus && legalSlotDraft(s))) && s.path ? (
                      <span>
                        <Link href={s.path} prefetch={false} className="underline underline-offset-4">
                          {s.titel}
                        </Link>
                        {!legalSlotReleased(s) && (
                          <span className="ml-2 border border-line-strong px-1 text-text-soft" data-shop-recht-entwurf="">
                            {c.legalPending}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-text">
                        {s.titel}: <span className="border border-line-strong px-1">{c.legalPending}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {o.testmodus && <p className="mt-8 text-small text-text-soft">{c.noMail}</p>}
          </>
        )}
        <Link href="/accessoires/produkte" prefetch={false} className="ph-press mt-10 inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper">
          {c.continueShopping}
        </Link>
      </Container>
    </div>
  );
}
