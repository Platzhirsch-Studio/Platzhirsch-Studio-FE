import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { Icon } from "@/components/Backoffice/icons";
import { KRUMEN, V, verwaltungsZugang } from "@/components/Backoffice/Kassa/Verwaltung";
import { VERWALTUNG } from "@/lib/backoffice/kassa/texte";

export const metadata = { title: "Berichte · Kassa" };
export const dynamic = "force-dynamic";

const ICON = { tageslosung: "ChartColumn", zahlart: "CreditCard", steuersatz: "Receipt", kassenbuch: "Wallet", differenzen: "Ruler", bediener: "Users", gutscheine: "Gift", anzahlungen: "Banknote", klaerfaelle: "TriangleAlert" };

// Berichte der Kassa (Team B-KAS, Konzept §4.10, T8): je Bericht eine schwebende Kachel. „Kassenkontrolle je
// Bediener“ und „Klärfälle“ nur für die Leitung.
export default async function Berichte() {
  const { session, leitung } = await verwaltungsZugang(`${V}/berichte`, "report");
  const liste = VERWALTUNG.berichte.liste.filter((b) => !b.nurLeitung || leitung);
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={VERWALTUNG.berichte.titel} untertitel="Auswertungen je Monat – als Tabelle und CSV für die Steuerberatung." krumen={[...KRUMEN, { titel: VERWALTUNG.berichte.titel }]} />
      <Bento testid="kassa-berichte">
        {liste.map((b) => (
          <Kachel key={b.slug} className="col-span-12 md:col-span-4" titel={b.titel} unter={b.text} href={`${V}/berichte/${b.slug}`} lift>
            <span className="mt-2 grid size-12 place-items-center rounded-full bg-bo-surface-2">
              <Icon name={ICON[b.slug] || "ChartColumn"} className="size-5" />
            </span>
          </Kachel>
        ))}
      </Bento>
      <p className="mt-6 text-[13px] text-bo-text-soft">
        Zahlen aus den Belegen und Abschlüssen. Für die Finanzverwaltung: <Link href={`${V}/dep`} className="underline">DEP-Export</Link>.
      </p>
    </Shell>
  );
}
