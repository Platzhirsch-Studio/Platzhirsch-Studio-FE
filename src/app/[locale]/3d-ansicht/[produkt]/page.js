// /de/3d-ansicht/<path_field> — Produktseite des AR-Viewers (Labs, noindex).
// Server Component: Produktdaten live aus dem Backoffice (nur lesen), Stufe aus
// den Registern (src/lib/arviewer/*.json). Bühne, Maßleiste, AR und QR in
// ProductViewer (Client); 3D lädt erst auf Klick.
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Info, Ruler } from "lucide-react";
import ProductViewer from "@/components/Labs/ArViewer/ProductViewer";
import ArLaunch from "@/components/Labs/ArViewer/ArLaunch";
import MerkButton from "@/components/Labs/ArViewer/MerkButton";
import StageBadge from "@/components/Labs/ArViewer/Sortiment/StageBadge";
import RoomTips from "@/components/Labs/ArViewer/Sortiment/RoomTips";
import { getArProduct } from "@/lib/arviewer/catalog";
import { STUFEN, hatRaum } from "@/lib/arviewer/stage";
import { productsPath } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import { SITE_NAME } from "@/lib/site";

// Fix-Runde 1 (F2): Rechte-/Freigabe-Hinweise und der Inventur-Ausblick sind interne
// Informationen und erscheinen nur im internen Betrieb (ARVIEWER_INTERN=1).
const INTERN = process.env.ARVIEWER_INTERN === "1";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

async function load(params) {
  const { locale, produkt } = await params;
  if (locale !== "de") return null;
  try {
    return await getArProduct(produkt);
  } catch {
    return undefined; // Backoffice nicht erreichbar
  }
}

export async function generateMetadata({ params }) {
  const p = await load(params);
  // Einzelansichten: noindex, follow – der Inhalt steht kanonisch auf der
  // Produktseite; /de/3d-ansicht selbst ist indexierbar.
  const robots = { index: false, follow: true };
  if (!p) return { title: `Möbel in 3D & AR ansehen | ${SITE_NAME}`, robots };
  return {
    title: `${p.name} von ${p.brand} – ${STUFEN[p.stufe].titel} | ${SITE_NAME}`,
    description: `${p.brand} ${p.name}: ${STUFEN[p.stufe].text}`,
    robots,
  };
}

/** Asset für den schnellen AR-Start: Stufe 1 → Modell, 2a → AR-Foto, 2b → Raumbedarf. */
function quickAr(p) {
  if (p.model3d?.src) return { glb: p.model3d.src, usdz: p.model3d.iosSrc || null, poster: p.model3d.poster, art: "3d" };
  if (p.arFoto?.glb) return { glb: p.arFoto.glb, usdz: p.arFoto.usdz || null, poster: p.arFoto.poster, art: "ar-foto" };
  // raumbedarf + modell: für den Größen-Umschalter über dem Knopf (QA R2 P2-1.2)
  if (p.raumbedarf?.glb)
    return { glb: p.raumbedarf.glb, usdz: p.raumbedarf.usdz, poster: p.raumbedarf.poster, art: "raumbedarf", raumbedarf: p.raumbedarf, modell: p.dims?.modell || null };
  return null;
}

export default async function ArViewerProductPage({ params, searchParams }) {
  const p = await load(params);
  const sp = (await searchParams) || {};
  if (p === null) notFound();
  if (p === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <h1 className="font-display text-display-m">Das Produkt ist gerade nicht erreichbar.</h1>
        <p className="mt-3 text-ui text-text-soft">Bitte versuchen Sie es in einigen Minuten erneut.</p>
        <Link href="/de/3d-ansicht#sortiment" className={`mt-4 inline-flex min-h-11 items-center underline underline-offset-4 ${FOCUS}`}>
          Zum Sortiment
        </Link>
      </div>
    );
  }
  const s = STUFEN[p.stufe];
  const client = {
    id: p.id,
    name: p.name,
    brand: p.brand,
    alt: p.alt,
    stufe: p.stufe,
    images: p.images,
    dims: p.dims,
    dimsMeta: p.dimsMeta,
    arFoto: p.arFoto,
    model3d: p.model3d,
    raumbedarf: p.raumbedarf,
  };
  const ar = quickAr(p);
  const imRaum = hatRaum(p.stufe) && ar;
  const produktText = `${p.brand} ${p.name}`;
  const merk = {
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryKey: p.category,
    image: p.images[0] || null,
    url_slug: p.id,
    href: p.category ? productsPath("de", generateSlug(p.category), p.id) : undefined,
  };

  return (
    <div className="bg-surface text-text">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-10 md:px-12 md:pt-16 lg:px-20 lg:pt-20">
        <nav aria-label="Brotkrumen" className="text-small text-text-soft">
          <Link href="/de/3d-ansicht#sortiment" className={`-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 hover:text-text ${FOCUS}`}>
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
            Sortiment im AR-Viewer
          </Link>
        </nav>

        <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
          {/* Titel mobil über der Bühne, Desktop rechts */}
          <header className="lg:col-start-2 lg:row-start-1">
            <p className="text-overline uppercase text-text-soft">
              {p.brand} · {p.categoryLabel}
            </p>
            <h1 className="mt-2 font-display text-display-l text-balance">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StageBadge stufe={p.stufe} long />
            </div>
            {/* QA R1 P1-2: AR mit einem Tap, über dem Falz direkt unter dem Titel */}
            {imRaum && (
              <div className="mt-5" data-testid="arv-ar-launch">
                <ArLaunch
                  product={{ id: p.id, name: p.name, brand: p.brand, path: `/de/3d-ansicht/${p.id}` }}
                  ar={ar}
                  highlight={sp.von === "qr"}
                  token={typeof sp.t === "string" && /^[A-Za-z0-9_-]{16,32}$/.test(sp.t) ? sp.t : null}
                />
              </div>
            )}
            <p className="mt-3 max-w-[60ch] text-ui leading-relaxed text-text-soft">{s.text}</p>
            {p.hinweis && p.nurIntern && (
              <p className="mt-4 flex gap-2 border-l-2 border-notice bg-surface-raised px-3 py-2.5 text-small text-text">
                <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-notice" strokeWidth={1.75} />
                <span>{p.hinweis}</span>
              </p>
            )}
            {INTERN && p.gesperrt && <p className="mt-4 border-l-2 border-line-strong px-3 py-1 text-small text-text-soft">{p.gesperrt}</p>}
          </header>

          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <ProductViewer product={client} autoStart={sp.ar === "fallback"} />
          </div>

          <div className="lg:col-start-2 lg:row-start-2">
            {INTERN && p.ausblick.length > 0 && (
              <section aria-labelledby="arv-ausblick" className="border-t border-line pt-5">
                <h2 id="arv-ausblick" className="text-ui text-text">
                  Was als Nächstes kommt
                </h2>
                <ul className="mt-2 grid gap-2 text-small leading-relaxed text-text-soft">
                  {p.ausblick.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-text-soft" />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!p.dims && p.katalogMasse.length > 0 && (
              <section aria-labelledby="arv-katalogmasse" className="mt-6 border-t border-line pt-5">
                <h2 id="arv-katalogmasse" className="text-ui text-text">
                  Angabe im Katalog
                </h2>
                <p className="mt-1 text-small text-text-soft">Freitext aus unserem Katalog, noch nicht mit dem Hersteller abgeglichen. Nicht für AR verwendet.</p>
                <ul className="mt-2 grid gap-1 text-small tabular-nums text-text">
                  {p.katalogMasse.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </section>
            )}

            {!imRaum && (
              <section aria-labelledby="arv-passt" className="mt-6 border-t border-line pt-5" data-testid="arv-passt">
                <h2 id="arv-passt" className="text-title text-text">
                  Passt es in Ihren Raum?
                </h2>
                <p className="mt-2 text-small leading-relaxed text-text-soft">
                  Für dieses Produkt gibt es noch keine Ansicht im Raum. Wir klären die Maße mit {p.brand} und zeigen es Ihnen gern im
                  Showroom in Lochau.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/de/beratung?produkt=${encodeURIComponent(`Maße für ${produktText}`)}`}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 bg-action px-5 text-ui text-paper hover:bg-action-hover ${FOCUS}`}
                  >
                    <Ruler aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
                    Maße anfragen
                  </Link>
                  <Link
                    href={`/de/beratung?produkt=${encodeURIComponent(produktText)}`}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 border border-ink px-5 text-ui text-text hover:bg-ink hover:text-paper ${FOCUS}`}
                  >
                    <CalendarDays aria-hidden="true" className="size-[18px]" strokeWidth={1.5} />
                    Termin mit diesem Produkt
                  </Link>
                  <MerkButton product={merk} />
                </div>
              </section>
            )}

            {hatRaum(p.stufe) && (
              <section className="mt-6 border-t border-line pt-5">
                <RoomTips headingLevel={2} stufe={p.stufe} />
              </section>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap">
              {p.shopHref && (
                <Link
                  href={p.shopHref}
                  className={`inline-flex min-h-12 items-center justify-center border border-ink px-5 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-ink hover:text-paper ${FOCUS}`}
                >
                  Zur Produktseite
                </Link>
              )}
              <Link href={`/de/beratung?produkt=${encodeURIComponent(produktText)}`} className={`inline-flex min-h-12 items-center justify-center px-2 text-ui text-text underline underline-offset-4 ${FOCUS}`}>
                Im Showroom ansehen
              </Link>
            </div>
            {p.stufe === "raumbedarf" && (
              <p className="mt-6 text-small leading-relaxed text-text-soft">
                {p.raumbedarf?.profil?.art === "stufen"
                  ? "Raumbedarf mit Profil: Sitz, Rücken und – wo belegt – Armlehnen als helle Blöcke in den Maßen aus dem Datenblatt, erzeugt ohne jedes Herstellerbild. Die Form ist vereinfacht, Polster und Rundungen fehlen."
                  : p.raumbedarf?.profil?.art === "linien"
                    ? "Raumbedarf: ein heller Quader in den Maßen des Herstellers, Sitz- und Armlehnenhöhe als Linien – erzeugt ohne jedes Herstellerbild. Die Sitztiefe nennt das Datenblatt nicht eindeutig, deshalb zeigen wir keine genauere Form."
                    : "Raumbedarf: ein heller Quader in den Maßen des Herstellers, erzeugt ohne jedes Herstellerbild. Er zeigt Platzbedarf und Höhe, nicht die Form des Möbels."}
              </p>
            )}
            {p.stufe === "ar-foto" && (
              <p className="mt-6 text-small leading-relaxed text-text-soft">
                Bild: {p.brand}, für die AR-Ansicht freigestellt (BiRefNet, lokal). Die Grundfläche am Boden entspricht den Herstellermaßen,
                das Foto ist auf die Höhe skaliert und zeigt die Perspektive der Aufnahme.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
