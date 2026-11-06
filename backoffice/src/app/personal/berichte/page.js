import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { Icon } from "@/components/Backoffice/icons";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeFaehigkeiten } from "@/lib/backoffice/personal/daten";
import { darfBerichte } from "@/lib/backoffice/personal/rollen";
import { T } from "@/lib/backoffice/personal/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Berichte · Personal" };

// Übersicht der Berichte (Konzept § 5.11). Monatsstunden und Abwesenheiten nur mit Fähigkeit „Konten“.
export default async function Berichte({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/berichte", sp, darfBerichte);
  const f = await ladeFaehigkeiten(ctx);
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf titel={T.berichte.titel} krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.berichte.titel }]} />
      <Bento testid="per-berichte">
        {T.berichte.liste.map((b) => {
          const gesperrt = ["monatsstunden", "abwesenheiten"].includes(b.id) && !f.konten.an;
          return (
            <Kachel key={b.id} className="md:col-span-6" titel={b.titel} unter={gesperrt ? T.berichte.gesperrt : b.unter} href={`/personal/berichte/${b.id}`} oeffnenLabel={`${b.titel} öffnen`} testid={`per-bericht-${b.id}`}>
              <span className="grid size-12 place-items-center rounded-full bg-bo-fill-2 text-bo-text-soft" aria-hidden="true"><Icon name={b.icon} className="size-5" /></span>
            </Kachel>
          );
        })}
      </Bento>
    </PersonalHuelle>
  );
}
