import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import Kachel from "@/components/Backoffice/Kachel";
import LeitungBitten from "@/components/Backoffice/LeitungBitten";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import MeinsNav from "@/components/Backoffice/Personal/MeinsNav";
import { MonatsTabelle } from "@/components/Backoffice/Personal/Zeiten";
import { params, seitenStart, KRUMEN_BASIS, monatAus, monatSchluessel } from "@/lib/backoffice/personal/seite";
import { ladeMonat, ladeFaehigkeiten, sicher } from "@/lib/backoffice/personal/daten";
import { druckHref } from "@/lib/backoffice/druck/index";
import { T } from "@/lib/backoffice/personal/texte";
import { monatName } from "@/lib/backoffice/personal/zeit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meine Zeiten · Personal" };

// T2 Meine Zeiten (Konzept § 5.2): heute inline bearbeitbar, Vergangenheit „Korrektur beantragen“, kein Saldo im
// laufenden Monat (E3), Konten nur mit Fähigkeit (E4).
export default async function MeineZeiten({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/meins/zeiten", sp);
  const { jahr, monat } = monatAus(sp, ctx.heute);
  const f = await ladeFaehigkeiten(ctx);
  const titel = `${monatName(monat)} ${jahr}`;
  const r = ctx.eigener ? await sicher(() => ladeMonat(ctx, ctx.eigener.name, jahr, monat, { mitKonto: f.konten.an, wochenstunden: ctx.eigener.wochenstunden })) : null;
  const nav = (
    <div className="flex items-center gap-2">
      <RundKnopf icon="ChevronLeft" href={`/personal/meins/zeiten?monat=${monatSchluessel(jahr, monat, -1)}`} label={T.zeiten.vorMonat} groesse="s" />
      <Knopf size="s" variant="secondary" href="/personal/meins/zeiten">
        {T.zeiten.heute}
      </Knopf>
      <RundKnopf icon="ChevronRight" href={`/personal/meins/zeiten?monat=${monatSchluessel(jahr, monat, 1)}`} label={T.zeiten.naechsterMonat} groesse="s" />
    </div>
  );
  const nachweis = ctx.eigener ? (
    f.zeitnachweisSelbst.an ? (
      <Knopf variant="secondary" icon="Printer" href={`${druckHref("PH Mitarbeiter", ctx.eigener.name, "PH Mitarbeiter Zeitnachweis")}&monat=${jahr}-${String(monat).padStart(2, "0")}`} data-testid="per-zeitnachweis">
        {T.zeiten.nachweis}
      </Knopf>
    ) : (
      <LeitungBitten erlaubt bereich="personal" bereichTitel="Personal" aktion="zeitnachweis" aktionTitel={`${T.zeiten.nachweisAnfordern} ${titel}`} objekt={{ doctype: "PH Mitarbeiter", name: ctx.eigener.name }} />
    )
  ) : null;
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf titel={T.zeiten.titel} untertitel={titel} krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.seiten.meins, href: "/personal/meins" }, { titel: T.zeiten.titel }]} zurueck={false} unternav={<MeinsNav aktiv="zeiten" />} aktionen={<div className="flex flex-wrap items-center gap-3">{nav}{nachweis}</div>} />
      {!ctx.eigener ? (
        <Kachel>
          <Leer art="leer" titel={T.stempel.ohneMitarbeiter} text={T.stempel.ohneMitarbeiterText} icon="User" />
        </Kachel>
      ) : !r.ok ? (
        <Fehler code={r.fehler.code} />
      ) : (
        <MonatsTabelle monat={r.daten} heute={ctx.heute} modus="selbst" konto={f.konten.an} korrektur={f.korrekturAntrag.an} monatName={monatName(monat)} />
      )}
    </PersonalHuelle>
  );
}
