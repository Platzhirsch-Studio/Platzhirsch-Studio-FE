// Detail eines Atelier-Stücks (/de/atelierverkauf/[slug]). Server-Komponente.
// Foto, Maße, Zustandsbeschreibung, Preis mit Pflichtzusätzen, Hersteller-
// angaben (GPSR, falls im Sheet) und die Reservierungsanfrage.
// Keine Händler-Formulierung: "Ausstellungsstück aus unserem Showroom in
// Lochau" (Rechtspaket R-M2). Hinweis auf die gesonderte Zustimmung zum
// Zustand (§ 6 Abs 1 S 2 VGG) und volle Gewährleistung (W7).
import { Badge, Heading } from "@/components/ui";
import { formatDate } from "@/lib/commerce/priceRules";
import AtelierPhoto from "./AtelierPhoto";
import AtelierPrice from "./AtelierPrice";
import ReservationForm from "./ReservationForm";

function Fact({ term, children }) {
  if (!children) return null;
  return (
    <div className="grid gap-1 border-b border-line py-4 sm:grid-cols-3 sm:gap-4">
      <dt className="text-small text-text-soft">{term}</dt>
      <dd className="text-body text-text sm:col-span-2">{children}</dd>
    </div>
  );
}

export default function AtelierDetail({ item, demo = false, titleLevel = 1 }) {
  const period =
    item.ausstellungVon || item.ausstellungBis
      ? [formatDate(item.ausstellungVon), formatDate(item.ausstellungBis)].filter(Boolean).join(" bis ")
      : null;
  return (
    <div className="mx-auto grid max-w-page gap-y-12 gap-x-grid lg:grid-cols-12">
      <div className="lg:col-span-6">
        <AtelierPhoto item={item} priority />
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <p className="flex flex-wrap items-center gap-2">
          <Badge>Ausstellungsstück</Badge>
          {item.marke && <span className="text-overline uppercase text-text-accent">{item.marke}</span>}
        </p>
        <Heading level={titleLevel} size="display-l" className="mt-stack-s">
          {item.titel}
        </Heading>
        <p className="mt-stack-s text-body text-text-soft">Ausstellungsstück aus unserem Showroom in Lochau.</p>
        <AtelierPrice item={item} size="detail" className="mt-stack-m" />

        <dl className="mt-10 border-t border-line">
          <Fact term="Zustand">{item.zustand}</Fact>
          <Fact term="Maße">{item.masse}</Fact>
          <Fact term="Ausgestellt">{period}</Fact>
          <Fact term="Hersteller">{item.hersteller}</Fact>
          <Fact term="Gewährleistung">Gesetzliche Gewährleistung von zwei Jahren.</Fact>
        </dl>
        <p className="mt-4 max-w-measure text-small text-text-soft">
          Vor dem Kauf erhalten Sie eine schriftliche Zustandsbeschreibung mit Fotos. Die beschriebenen Abweichungen vom Neuzustand werden nur
          Teil des Vertrags, wenn Sie ihnen gesondert zustimmen.
        </p>

        <div id="reservieren" className="mt-12 scroll-mt-24 border-t border-line-strong pt-8">
          <Heading level={titleLevel + 1} size="title" className="mb-6">
            Reservierung anfragen
          </Heading>
          <ReservationForm slug={item.slug} title={item.titel} demo={demo} />
        </div>
      </div>
    </div>
  );
}
