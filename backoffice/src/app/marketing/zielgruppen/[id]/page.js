// /marketing/zielgruppen/[id] – Regel-Editor als Sätze mit Live-Vorschau (10-konzept-marketing § 2.5). „neu“ legt an.
import { notFound } from "next/navigation";
import { AkteKopf } from "@/components/Backoffice/Akte";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Status } from "@/components/Backoffice/Marketing/Bausteine";
import { SegmentEditor } from "@/components/Backoffice/Marketing/RegelEditoren";
import { marketingKontext } from "@/lib/backoffice/marketing/daten";
import { ZIELGRUPPEN, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Zielgruppe") };

export default async function ZielgruppeSeite({ params }) {
  const { id: roh } = await params;
  const id = decodeURIComponent(roh);
  const ctx = await marketingKontext({ pfad: `/marketing/zielgruppen/${roh}`, doctype: "PH Segment" });
  const seg = id === "neu" ? null : await ctx.client.getDoc("PH Segment", id).catch(() => null);
  if (id !== "neu" && !seg) notFound();
  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/zielgruppen", titel: ZIELGRUPPEN.titel }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: ZIELGRUPPEN.titel, href: "/marketing/zielgruppen" }, { titel: seg?.titel || ZIELGRUPPEN.neu }]}
        titel={seg?.titel || ZIELGRUPPEN.neu}
        nummer={seg ? <Status gruppe="segment" wert={seg.status} /> : null}
      />
      <SegmentEditor seg={seg} leitung={ctx.leitung} darf={ctx.team} einladungenGesperrt={!ctx.an.einladungen} />
    </Rahmen>
  );
}
