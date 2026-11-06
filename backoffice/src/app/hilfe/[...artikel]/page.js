import { notFound } from "next/navigation";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { ladeArtikel } from "@/lib/backoffice/hilfe";
import { BEREICHE } from "@/lib/backoffice/bereiche/index";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import HilfeArtikel from "@/components/Backoffice/Shell/HilfeArtikel";

export const dynamic = "force-dynamic";

/** /hilfe/<bereich>/<seite> → backoffice/hilfe/<bereich>/<seite>.md */
export default async function HilfeSeite({ params }) {
  const { artikel: teile = [] } = await params;
  const schluessel = teile.map((t) => decodeURIComponent(t)).join("/");
  const session = await requireSession(`/hilfe/${schluessel}`);
  const artikel = await ladeArtikel(schluessel);
  if (!artikel) notFound();
  const bereich = BEREICHE.find((b) => b.slug === teile[0]);
  return (
    <Shell session={session}>
      <Seitenkopf titel={artikel.titel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Hilfe", href: "/hilfe" }, { titel: bereich?.titel || artikel.titel }]} />
      <Kachel className="max-w-3xl">
        <HilfeArtikel bloecke={artikel.bloecke} />
      </Kachel>
    </Shell>
  );
}

export async function generateMetadata({ params }) {
  const { artikel: teile = [] } = await params;
  const a = await ladeArtikel(teile.map((t) => decodeURIComponent(t)).join("/"));
  return { title: a ? `${a.titel} · Hilfe` : "Hilfe" };
}
