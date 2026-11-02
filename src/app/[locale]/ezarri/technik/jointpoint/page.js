// /de/ezarri/technik/jointpoint – JointPoint erklärt (Team A, Konzept §3.7).
// Erklärgrafik als eigenes SVG (keine Ezarri-Grafik). Herstellerangaben „laut Ezarri“.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { article } from "@/components/Ezarri/Welt/schema";

const PATH = "/ezarri/technik/jointpoint";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { JOINTPOINT, TECHNIK } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: JOINTPOINT.seoTitle, description: JOINTPOINT.description });
}

// Drei Blätter im Schnitt: Netz, Papier, JointPoint (eigene, schematische Zeichnung).
function Schnitt({ variant, label }) {
  const stones = [0, 1, 2, 3];
  return (
    <figure className="flex flex-col gap-3">
      <svg viewBox="0 0 200 120" role="img" aria-label={label} className="w-full bg-surface-raised">
        <rect x="0" y="96" width="200" height="24" className="fill-stone-deep" />
        {stones.map((i) => (
          <rect key={i} x={12 + i * 46} y="40" width="40" height="50" className="fill-paper stroke-ink" strokeWidth="1" />
        ))}
        {variant === "netz" && <path d="M8 92 H192 M8 95 H192" className="stroke-ink-soft" strokeWidth="2" strokeDasharray="3 3" />}
        {variant === "papier" && <rect x="8" y="30" width="184" height="8" className="fill-pebble" />}
        {variant === "joint" && [0, 1, 2].map((i) => <rect key={i} x={51 + i * 46} y="58" width="7" height="12" className="fill-see" />)}
      </svg>
      <figcaption className="text-small text-text-soft">{label}</figcaption>
    </figure>
  );
}

export default async function JointPointPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { JOINTPOINT, TECHNIK } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <>
      <PageHead
        crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb, href: "/ezarri/technik" }, { label: JOINTPOINT.crumb })}
        eyebrow={TECHNIK.eyebrow}
        title={JOINTPOINT.title}
        lead={JOINTPOINT.lead}
        jsonLd={[article({ locale, path: PATH, headline: JOINTPOINT.title, description: JOINTPOINT.description })]}
      />
      <Container className="pb-section">
        <section aria-labelledby="ez-jp-grafik">
          <Heading id="ez-jp-grafik" level={2} size="title">
            {JOINTPOINT.grafik.title}
          </Heading>
          <div className="mt-6 grid gap-grid sm:grid-cols-3">
            <Schnitt variant="netz" label={JOINTPOINT.grafik.netz} />
            <Schnitt variant="papier" label={JOINTPOINT.grafik.papier} />
            <Schnitt variant="joint" label={JOINTPOINT.grafik.joint} />
          </div>
          <p className="mt-3 text-small text-text-soft">{t("Schematische Zeichnung von Platzhirsch, nicht maßstäblich. Unten das Kleberbett.", "Schematic drawing by Platzhirsch, not to scale. The adhesive bed is at the bottom.", "Dessin schématique de Platzhirsch, pas à l’échelle. En bas, le lit de colle.", "Disegno schematico di Platzhirsch, non in scala. In basso il letto di adesivo.")}</p>
        </section>
        <dl className="mt-section grid gap-x-grid gap-y-8 sm:grid-cols-2">
          {JOINTPOINT.punkte.map(([titel, text]) => (
            <div key={titel} className="border-t border-line pt-4">
              <dt className="text-title text-text">{titel}</dt>
              <dd className="mt-2 max-w-measure text-body text-text-soft">{text}</dd>
            </div>
          ))}
        </dl>
        <CreditNote kinds={["daten"]} className="mt-10" />
      </Container>
      <Schluss />
    </>
  );
}
