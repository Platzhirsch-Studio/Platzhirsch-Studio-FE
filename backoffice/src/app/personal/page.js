import { Suspense } from "react";
import { redirect } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import { Bento } from "@/components/Backoffice/Kachel";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import NeuMenue from "@/components/Backoffice/Personal/NeuMenue";
import { ZuErledigenKachel, KennzahlenReihe, HeuteImHausKachel, QuellenKachel, KuerzlichKachel, KachelSkelett } from "@/components/Backoffice/Personal/Uebersicht";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { darfArtSehen, darfBearbeiten, darfBewerbungen, istLeitung } from "@/lib/backoffice/personal/rollen";
import { T } from "@/lib/backoffice/personal/texte";
import { tagTitel } from "@/lib/backoffice/personal/zeit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Übersicht · Personal" };

// T1 Übersicht (Konzept § 5.1). Reiner Selbstservice → 307 /personal/meins.
export default async function PersonalUebersicht({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal", sp);
  if (ctx.rolle === "selbst" || !ctx.rolle) redirect("/personal/meins");
  const neu = [
    darfBearbeiten(ctx.rolle) && { id: "bewerbung", href: "/personal/bewerbungen?neu=1" },
    (darfBearbeiten(ctx.rolle) || ctx.rolle === "admin") && { id: "stelle", href: "/personal/stellen?neu=1" },
    darfBearbeiten(ctx.rolle) && { id: "gespraech", href: "/personal/gespraeche?planen=1" },
    istLeitung(ctx.rolle) && { id: "abwesenheit", href: "/personal/team?ansicht=antraege&neu=abwesenheit" },
    istLeitung(ctx.rolle) && { id: "buchung", href: "/personal/team?ansicht=buchungen&neu=buchung" },
    (istLeitung(ctx.rolle) || ctx.rolle === "admin") && { id: "mitarbeiter", href: "/personal/team?ansicht=personen&neu=mitarbeiter" },
  ].filter(Boolean);
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf titel={T.bereich} ueber={tagTitel(ctx.heute)} krumen={[KRUMEN_BASIS[0], { titel: T.bereich }]} aktionen={<NeuMenue eintraege={neu} />} />
      <Erstbesuch text={T.erstbesuch.uebersicht} route="/personal" />
      <Bento testid="per-uebersicht">
        <Suspense fallback={<KachelSkelett className="md:col-span-12" hoehe={180} />}>
          <KennzahlenReihe ctx={ctx} />
        </Suspense>
        <Suspense fallback={<KachelSkelett className="md:col-span-7" hoehe={360} />}>
          <ZuErledigenKachel ctx={ctx} className={darfArtSehen(ctx.rolle) ? "md:col-span-7" : "md:col-span-12"} />
        </Suspense>
        {darfArtSehen(ctx.rolle) && (
          <Suspense fallback={<KachelSkelett className="md:col-span-5" hoehe={360} />}>
            <HeuteImHausKachel ctx={ctx} className="md:col-span-5" />
          </Suspense>
        )}
        {darfBewerbungen(ctx.rolle) && (
          <Suspense fallback={<KachelSkelett className="md:col-span-5" />}>
            <QuellenKachel ctx={ctx} className="md:col-span-5" />
          </Suspense>
        )}
        <Suspense fallback={<KachelSkelett className="md:col-span-7" />}>
          <KuerzlichKachel ctx={ctx} className={darfBewerbungen(ctx.rolle) ? "md:col-span-7" : "md:col-span-12"} />
        </Suspense>
      </Bento>
    </PersonalHuelle>
  );
}
