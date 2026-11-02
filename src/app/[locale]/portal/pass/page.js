import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { formatDate } from "@/lib/portal/format";
import { Badge, Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader } from "@/components/Portal/Docs/SectionNav";
import { ITEM_STATUS, focusRing } from "@/components/Portal/Docs/labels";
import { listPasses } from "@/components/Portal/Docs/server/passes";
import PassVisual from "@/components/Portal/Docs/PassVisual";
import { portalMetadata } from "@/lib/portal/metadata";

export const generateMetadata = portalMetadata({
  title: "Produktpass",
  robots: { index: false, follow: false },
});

export default async function PassListPage() {
  const portal = await getPortal("/de/portal/pass");
  const passes = await listPasses(portal);

  return (
    <>
      <DevDataNotice show={adapterName() === "mock"} />
      <DocsPageHeader
        overline="Ihre Stücke"
        title="Produktpass"
        intro="Für jedes Stück, das Sie bei uns gekauft haben: Marke, Material, Pflege, Garantie und Service an einem Ort – vorbereitet auf den künftigen digitalen Produktpass der EU."
      />

      {passes.length === 0 ? (
        <Empty>Produktpässe entstehen, sobald ein Stück bestellt ist.</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {passes.map(({ pass, item, project, purchasedAt }) => (
            <li key={pass.id}>
              <Link
                href={`/de/portal/pass/${encodeURIComponent(pass.id)}`}
                className={`group flex h-full flex-col overflow-hidden border border-ink/10 bg-white transition-colors hover:border-ink/30 ${focusRing}`}
              >
                <PassVisual pass={pass} item={item} className="transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{pass.brand}</p>
                <h2 className="mt-2 font-display text-2xl text-ink">{pass.product}</h2>
                {item.variant && <p className="mt-1 line-clamp-2 text-sm text-ink/70">{item.variant}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{ITEM_STATUS[item.status] || item.status}</Badge>
                  {pass.serialNumber && <Badge tone="gold">Seriennr. erfasst</Badge>}
                </div>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-ink/75">
                  <dt>Projekt</dt>
                  <dd>{project.title}</dd>
                  <dt>Kaufdatum</dt>
                  <dd>{purchasedAt ? formatDate(purchasedAt) : "folgt"}</dd>
                </dl>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-ink">
                  Pass öffnen <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex gap-3 bg-bone p-5 text-sm leading-relaxed text-ink/80">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
        <p>
          Die Angaben stammen aus Auftrag und Herstellerunterlagen und werden bei der Übergabe vervollständigt (z. B. Seriennummer, Foto, Pflegeanleitung). Maßgeblich für
          Garantie und Gewährleistung sind Auftragsbestätigung und Herstellerbedingungen.
        </p>
      </div>
    </>
  );
}
