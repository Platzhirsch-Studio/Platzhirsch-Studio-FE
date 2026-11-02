// Prototyp "Dreiländereck" – Markenseite am Beispiel Minotti.
// Stammdaten (Herkunft, Gründung, Gründer, Bilder) und Katalog aus dem
// Backoffice; Texte eigen. KEINE Händler-Behauptung (das CMS-Feld
// dealers_description_de wird bewusst nicht verwendet).
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowDown, Phone } from "lucide-react";
import s from "@/components/Preview/dreilaendereck/dl.module.css";
import { loadMinottiBrand, loadMinottiCatalog } from "@/components/Preview/dreilaendereck/data";
import { BASE, HOUSE, LINKS } from "@/components/Preview/dreilaendereck/content";
import { designPreviewEnabled, previewMetadata } from "@/components/Preview/gate";

// F5: metadata only while the preview is on (Preview/gate.js).
export const generateMetadata = previewMetadata({
  title: "Minotti – Prototyp Dreiländereck",
  description: "Markenseite Minotti im Design-Prototyp Dreiländereck. Nicht öffentlich.",
  robots: { index: false, follow: false },
});

const FAQ = [
  {
    q: "Kann ich Minotti in Lochau sehen und probesitzen?",
    a: "Ja. In unserer Ausstellung zeigen wir Sofas und Möbel von Minotti. Welche Stücke gerade ausgestellt sind, sagen wir Ihnen gern vorab am Telefon.",
  },
  {
    q: "Was kostet ein Sofa von Minotti?",
    a: "Das hängt stark von Modell, Größe, Elementen und Bezug ab. Nach der Beratung erhalten Sie von uns ein Angebot für Ihre Zusammenstellung.",
  },
  {
    q: "Liefern Sie auch nach Deutschland, in die Schweiz und nach Liechtenstein?",
    a: "In Österreich liefern und montieren wir. Für Adressen in Deutschland, der Schweiz und Liechtenstein klären wir Lieferung und Montage im Gespräch individuell.",
  },
];

export default async function MinottiPage({ params }) {
  const { locale } = await params;
  if (locale !== "de" || !designPreviewEnabled()) notFound(); // F5: also here, else the page streams into the 404

  const [brand, catalog] = await Promise.all([loadMinottiBrand(), loadMinottiCatalog()]);
  const heroImage = brand?.images?.[2] || brand?.images?.[0] || "/Images/Vernissage/minotti-wohnwelt.jpg";
  const detailImages = (brand?.images || []).filter((i) => i !== heroImage).slice(0, 2);

  return (
    <>
      <section className={s.brandHero} aria-labelledby="dl-brand-title">
        <div className={s.heroImage}>
          <Image
            src={heroImage}
            alt="Wohnraum mit einem hellen Sofa von Minotti"
            fill
            preload
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className={`${s.container} ${s.brandHeroText} ${s.heroIn}`}>
          <p className={s.overline}>
            {[brand?.origin, brand?.founded && `seit ${brand.founded}`].filter(Boolean).join(" · ") || "Italien"}
          </p>
          <h1 id="dl-brand-title" className={s.display}>
            Minotti
          </h1>
          <p className={s.lead}>
            Großzügige Volumen, genaue Nähte, ruhige Linien. In unserer Ausstellung in Lochau erleben Sie Minotti im Raum –
            Probesitzen ausdrücklich erwünscht.
          </p>
          <div className={s.heroActions}>
            <Link href={LINKS.termin} className={s.btnLight}>
              Minotti bei uns erleben <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
            </Link>
            <a href="#kollektion" className={s.btnGhost} style={{ color: "#fff", borderColor: "rgb(255 255 255 / 0.5)" }}>
              Auswahl ansehen <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <nav aria-label="Brotkrumen" className={`${s.container} ${s.crumbs}`}>
        <ol>
          <li>
            <Link href={BASE}>Start</Link>
          </li>
          <li>
            <Link href={`${BASE}#marken`}>Marken</Link>
          </li>
          <li aria-current="page">Minotti</li>
        </ol>
      </nav>

      <section className={s.sectionTight} aria-label="Fakten zur Marke">
        <div className={s.container}>
          <dl className={s.facts}>
            <div>
              <dt>Herkunft</dt>
              <dd>{brand?.origin || "Italien"}</dd>
            </div>
            <div>
              <dt>Gegründet</dt>
              <dd className={s.num}>{brand?.founded || "–"}</dd>
            </div>
            <div>
              <dt>Gründer</dt>
              <dd>{brand?.founder || "–"}</dd>
            </div>
            <div>
              <dt>Im Katalog</dt>
              <dd className={s.num}>{catalog.total ? `${catalog.total} Produkte` : "–"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={s.section} style={{ paddingTop: 24 }} aria-labelledby="dl-brand-story">
        <div className={s.container}>
          <div className={s.split}>
            <div className={s.reveal}>
              <p className={s.overline}>Die Marke</p>
              <h2 id="dl-brand-story" className={s.h2}>
                Aus einer Werkstatt in Meda <span className={s.italic}>in die Wohnzimmer der Welt.</span>
              </h2>
              <p className={s.text} style={{ marginTop: 24 }}>
                {brand?.founder || "Alberto Minotti"} gründete das Unternehmen {brand?.founded || 1948} in Meda bei
                Mailand. Daraus ist eine Marke geworden, die für großzügige Sofas, präzise Polsterarbeit und ruhige
                Proportionen steht – gefertigt in Italien.
              </p>
              <p className={s.text}>
                Bei uns sehen Sie Minotti nicht im Katalog, sondern im Raum: zusammen mit Teppichen, Leuchten und Tischen,
                so wie es später bei Ihnen zu Hause stehen könnte. Wir planen die Zusammenstellung, wählen mit Ihnen Bezüge
                und Maße und kümmern uns um Lieferung und Montage.
              </p>
              {brand?.approach && (
                <blockquote className={s.quote} style={{ marginTop: 32, paddingLeft: 20, borderLeft: "1px solid var(--dl-hair-strong)" }}>
                  {brand.approach}
                </blockquote>
              )}
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {detailImages.map((src, i) => (
                <div key={src} className={`${s.media} ${s.r32} ${s.mask}`}>
                  <Image
                    src={src}
                    alt={i === 0 ? "Minotti-Sofas in einem Außenbereich" : "Wohnsituation mit Möbeln von Minotti"}
                    fill
                    sizes="(min-width: 900px) 44vw, 100vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="kollektion" className={`${s.section} ${s.bgLinen}`} aria-labelledby="dl-brand-edit">
        <div className={s.container}>
          <div className={s.sectionHead}>
            <div>
              <p className={s.overline}>Auswahl</p>
              <h2 id="dl-brand-edit" className={s.h2}>
                Sofas von Minotti
              </h2>
            </div>
            <div>
              <p className={s.lead} style={{ margin: "0 0 20px" }}>
                Eine kleine Auswahl aus dem Katalog. Fragen Sie uns, welche Modelle Sie in Lochau probesitzen können.
              </p>
              <ul className={s.chips} aria-label="Minotti im Katalog nach Kategorie">
                {catalog.categories.slice(0, 8).map((c) => (
                  <li key={c.key}>
                    {c.label}
                    <span className={s.num}>{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={s.productGrid}>
            {catalog.edit.map((p, i) => (
              <Link key={p.slug} href={`${BASE}/produkt/${p.slug}`} className={`${s.productCard} ${s.reveal}`}>
                <div className={`${s.media} ${s.r43}`}>
                  <Image
                    src={p.image}
                    alt={`Minotti ${p.name}`}
                    fill
                    sizes="(min-width: 900px) 23vw, 50vw"
                    loading={i < 4 ? undefined : "lazy"}
                  />
                </div>
                <h3>{p.name}</h3>
                <p>{p.category} · Preis auf Anfrage</p>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 48 }}>
            <Link href={`${LINKS.produkte}/sofas-couches?marke=minotti`} className={s.btnGhost}>
              Alle Minotti-Sofas im Katalog <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
            </Link>
          </p>
        </div>
      </section>

      <section className={s.section} aria-labelledby="dl-brand-visit">
        <div className={`${s.container} ${s.cta}`}>
          <div>
            <p className={s.overline}>Im Showroom</p>
            <h2 id="dl-brand-visit" className={s.h2}>
              Ein Sofa kauft man nicht vom Foto.
            </h2>
            <p className={s.lead} style={{ marginTop: 20 }}>
              Sitzhöhe, Tiefe, Polster, Leder oder Stoff: Das entscheiden Sie am besten im Sitzen. Vereinbaren Sie einen
              Termin – wir legen Bezugsmuster bereit.
            </p>
            <div className={s.ctaActions}>
              <Link href={LINKS.termin} className={s.btn}>
                Termin vereinbaren <ArrowRight size={18} aria-hidden="true" className={s.arrow} />
              </Link>
              <a href={HOUSE.phoneHref} className={s.btnGhost}>
                <Phone size={18} aria-hidden="true" /> {HOUSE.phone}
              </a>
            </div>
          </div>
          <div className={`${s.placeholder} ${s.r45}`} role="img" aria-label="Platzhalter für eigene Fotos der Minotti-Stücke in der Ausstellung">
            <div>
              Foto folgt:
              <br />
              Minotti in unserer Ausstellung
              <br />
              <span className={s.small}>(eigene Aufnahme, kein Herstellerbild)</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.sectionTight} ${s.bgLinen}`} aria-labelledby="dl-brand-faq">
        <div className={s.container}>
          <h2 id="dl-brand-faq" className={s.h2} style={{ marginBottom: 32 }}>
            Häufige Fragen zu Minotti
          </h2>
          <div className={s.pdpSections}>
            {FAQ.map((f) => (
              <details key={f.q} style={{ borderBottom: "1px solid var(--dl-hair)", padding: "20px 0" }}>
                <summary className={s.h3} style={{ cursor: "pointer", fontSize: "1.3rem" }}>
                  {f.q}
                </summary>
                <p className={s.text} style={{ marginTop: 12 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
          <p className={s.legal} style={{ marginTop: 40 }}>
            Platzhirsch Home Living zeigt und plant mit Möbeln von Minotti. Minotti ist eine Marke des gleichnamigen
            Herstellers; Produktbilder: Hersteller.
          </p>
        </div>
      </section>
    </>
  );
}
