import Image from "next/image";
import { Container, Eyebrow, Heading, LinkArrow } from "@/components/ui";

// "Hinter dem Stück": brand and designer next to each other, server-rendered
// (previously a client toggle on a dark panel – the product page has no
// inverse surface now, Bibel §4 "max. one dark area"). The brand gets its CMS
// photograph (3:2); the designer is text only – the old static designer
// "portraits" were room photos and would mislead.
export default function BrandDesignerShowcase({ designerName, designerInfo, brandName, brandInfo, brandPageHref, labels }) {
  const hasBrand = Boolean(brandInfo);
  const hasDesigner = Boolean(designerInfo);
  if (!hasBrand && !hasDesigner) return null;

  return (
    <Container>
      <section aria-labelledby="about-title" className="border-t border-line py-section">
        <Eyebrow className="mb-stack-s">{labels.eyebrow}</Eyebrow>
        <Heading id="about-title" level={2} size="display-m">
          {[hasBrand && brandName, hasDesigner && designerName].filter(Boolean).join(" · ")}
        </Heading>

        <div className={`mt-12 grid gap-16 ${hasBrand && hasDesigner ? "lg:grid-cols-12 lg:gap-grid" : ""}`}>
          {hasBrand && (
            <article className={hasDesigner ? "lg:col-span-7" : "lg:grid lg:grid-cols-12 lg:gap-grid"}>
              {brandInfo.image && (
                <div className={`relative aspect-[3/2] overflow-hidden bg-linen ${hasDesigner ? "" : "lg:col-span-7"}`}>
                  <Image src={brandInfo.image} alt={brandName} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                </div>
              )}
              <div className={hasDesigner ? "mt-6" : "mt-6 lg:col-span-5 lg:mt-0"}>
                <p className="text-overline uppercase text-text-soft">{labels.brand}</p>
                <h3 className="mt-2 text-title text-text">{brandName}</h3>
                {(brandInfo.founded || brandInfo.country) && (
                  <p className="tabular mt-1 text-small text-text-soft">
                    {[brandInfo.founded && `${labels.founded} ${brandInfo.founded}`, brandInfo.country].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-4 max-w-measure text-body text-text-soft">{brandInfo.bio}</p>
                {brandPageHref && (
                  <LinkArrow href={brandPageHref} className="mt-4">
                    {labels.viewBrandPage}
                  </LinkArrow>
                )}
              </div>
            </article>
          )}

          {hasDesigner && (
            <article className={hasBrand ? "lg:col-span-4 lg:col-start-9" : ""}>
              <p className="text-overline uppercase text-text-soft">{labels.designer}</p>
              <h3 className="mt-2 text-title text-text">{designerName}</h3>
              {/* The static designer bios exist in English only. */}
              <p lang="en" className="mt-4 max-w-measure text-body text-text-soft">
                {designerInfo.bio}
              </p>
            </article>
          )}
        </div>
      </section>
    </Container>
  );
}
