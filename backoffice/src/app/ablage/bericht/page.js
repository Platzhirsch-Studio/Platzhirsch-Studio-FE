import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Fehler from "@/components/Backoffice/Fehler";
import { Bento } from "@/components/Backoffice/Kachel";
import { Balken, Donut, KeineDaten } from "@/components/Backoffice/Charts";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { ladeBericht, sicher } from "@/lib/backoffice/ablage/daten";
import { groesseText } from "@/lib/backoffice/ablage/regeln";
import { BEZUG } from "@/lib/backoffice/ablage/labels";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bericht · Ablage" };

const kurz = (n) => (n >= 1024 ** 3 ? `${Math.round(n / 1024 ** 3)} GB` : n >= 1024 ** 2 ? `${Math.round(n / 1024 ** 2)} MB` : groesseText(n));

const KW = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - tag);
  const jahr = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `KW ${Math.ceil(((t - jahr) / 86_400_000 + 1) / 7)}`;
};

export default async function AblageBericht({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage/bericht", sp, { leitung: true });
  const r = await sicher(() => ladeBericht(ctx));
  if (!r.ok) {
    return (
      <Shell session={ctx.session}>
        <Seitenkopf titel={T.bericht.titel} krumen={[...KRUMEN_BASIS, { titel: T.bericht.titel }]} />
        <Fehler code={r.fehler.code} message={r.fehler.message} />
      </Shell>
    );
  }
  const b = r.daten;
  const groesse = (w) => groesseText(w);
  return (
    <Shell session={ctx.session} breit>
      <Seitenkopf titel={T.bericht.titel} krumen={[...KRUMEN_BASIS, { titel: T.bericht.titel }]} untertitel="Speicherbelegung und Uploads – nur aus den Daten der Ablage" />
      <Bento testid="abl-bericht">
        <Kennzahl className="md:col-span-3" titel={T.bericht.dateien} wert={b.dateien} testid="abl-kz-dateien" />
        <Kennzahl className="md:col-span-3" titel={T.bericht.belegt} wert={b.belegt ? b.belegtText : null} testid="abl-kz-belegt" />
        <Kennzahl className="md:col-span-3" titel={T.bericht.freigaben} wert={b.freigaben} href="/ablage/freigaben" />
        <Kennzahl className="md:col-span-3" titel={T.bericht.papierkorb} wert={b.papierkorb} href="/ablage/papierkorb" />
        {b.wochen.some((w) => w.wert > 0) ? (
          <Balken className="md:col-span-6" titel={T.bericht.uploads} untertitel="Letzte 8 Wochen, laufende schraffiert" punkte={b.wochen.map((w) => ({ label: KW(w.von), wert: w.wert }))} hervorheben={b.wochen.length - 2} laufend="letzter" einblenden />
        ) : (
          <KeineDaten className="md:col-span-6" titel={T.bericht.uploads} text={T.bericht.keineWerte} />
        )}
        {b.jeBezug.length ? (
          <Donut className="md:col-span-6" titel={T.bericht.jeBezug} teile={b.jeBezug.map((x) => ({ label: BEZUG[x.schluessel]?.mehrzahl || "Allgemein", wert: x.wert }))} format={groesse} mitte={kurz(b.belegt)} einblenden />
        ) : (
          <KeineDaten className="md:col-span-6" titel={T.bericht.jeBezug} text={T.bericht.keineWerte} />
        )}
        {b.jeEndung.length ? (
          <Balken className="md:col-span-12" titel={T.bericht.jeEndung} punkte={b.jeEndung.map((x) => ({ label: x.schluessel, wert: x.wert }))} format={groesse} hervorheben={0} einblenden />
        ) : (
          <KeineDaten className="md:col-span-12" titel={T.bericht.jeEndung} text={T.bericht.keineWerte} />
        )}
      </Bento>
    </Shell>
  );
}
