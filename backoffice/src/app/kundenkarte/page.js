import { Suspense } from "react";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import { Bento } from "@/components/Backoffice/Kachel";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Leer from "@/components/Backoffice/Leer";
import { EinrichtungKachel, UebersichtKennzahlen, ZuTunKachel, ZuletztKachel } from "@/components/Backoffice/Kundenkarte/Uebersicht";
import { KachelSkelett } from "@/components/Backoffice/Kundenkarte/Skelett";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { darfSchreiben, istLeitung } from "@/lib/backoffice/kundenkarte/regeln";
import { ladeEinstellungen, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Übersicht · Kundenkarte" };

export default async function KundenkarteUebersicht({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/kundenkarte", sp);
  const einst = await sicher(() => ladeEinstellungen(ctx));
  const ohneVersion = einst.ok && !einst.daten.bedingungen_version;
  const gesamt = ctx.sim === "leer" ? 0 : await ctx.client.count("PH Kundenkarte", {}).catch(() => 1);
  const neu = darfSchreiben(ctx.rolle) ? (
    <Knopf variant="primary" icon="Plus" href="/kundenkarte/karten/neu" kuerzel="Strg+Enter" disabled={ohneVersion} grund={ohneVersion ? T.neu.ohneVersion : undefined} data-testid="kk-neue-karte">
      {T.seiten.neu}
    </Knopf>
  ) : null;
  return (
    <Shell session={ctx.session}>
      <Seitenkopf
        titel={T.bereich}
        ueber={T.uebersicht.gruss}
        krumen={[KRUMEN_BASIS[0], { titel: T.bereich }]}
        aktionen={
          <div className="flex items-center gap-2">
            <RundKnopf icon="Settings" href="/kundenkarte/einstellungen" label={T.seiten.einstellungen} testid="kk-zahnrad" />
            {neu}
          </div>
        }
      />
      <Erstbesuch text={T.erstbesuch.uebersicht} route="/kundenkarte" />
      {gesamt === 0 ? (
        <Leer art="leer" titel={T.uebersicht.leerTitel} text={T.uebersicht.leerText} icon="CreditCard" aktion={neu} testid="kk-leer" />
      ) : (
        <Bento className="mt-2" testid="kk-uebersicht">
          {istLeitung(ctx.rolle) && (
            <Suspense fallback={null}>
              <EinrichtungKachel ctx={ctx} />
            </Suspense>
          )}
          <Suspense fallback={<KachelSkelett className="md:col-span-12" hoehe={420} />}>
            <UebersichtKennzahlen ctx={ctx} />
          </Suspense>
          <Suspense fallback={<KachelSkelett className="md:col-span-7" hoehe={260} />}>
            <ZuTunKachel ctx={ctx} className="md:col-span-7" />
          </Suspense>
          <Suspense fallback={<KachelSkelett className="md:col-span-5" hoehe={260} />}>
            <ZuletztKachel ctx={ctx} className="md:col-span-5" />
          </Suspense>
        </Bento>
      )}
    </Shell>
  );
}
