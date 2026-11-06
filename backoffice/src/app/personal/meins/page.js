import { Suspense } from "react";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import MeinsNav from "@/components/Backoffice/Personal/MeinsNav";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import Fehler from "@/components/Backoffice/Fehler";
import LeitungBitten from "@/components/Backoffice/LeitungBitten";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { StempelKarte } from "@/components/Backoffice/Personal/Stempel";
import { MeineAbwesenheiten } from "@/components/Backoffice/Personal/Abwesenheit";
import MeinBereichAktionen from "@/components/Backoffice/Personal/MeinBereich";
import { KachelSkelett } from "@/components/Backoffice/Personal/Uebersicht";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeStempel, ladeEigeneAbwesenheiten, ladeWoche, ladeKonto, ladeFaehigkeiten, ladeAbwesenheiten, ladeMitarbeiterListe, sicher } from "@/lib/backoffice/personal/daten";
import { T, tageszeit } from "@/lib/backoffice/personal/texte";
import { hm, tagKurz, tagTitel, saldoText, tageZahl, plusTage, wochenStartIso, zeitraumText } from "@/lib/backoffice/personal/zeit";
import { darfBearbeiten, istLeitung } from "@/lib/backoffice/personal/rollen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mein Bereich · Personal" };

async function Abwesenheiten({ ctx, f }) {
  const r = await sicher(() => ladeEigeneAbwesenheiten(ctx, { limit: 20 }));
  if (!r.ok) return <Fehler code={r.fehler.code} kompakt />;
  const offen = r.daten.filter((a) => a.status === "Beantragt" || a.status === "Gemeldet" || a.von >= ctx.heute);
  const liste = [...offen, ...r.daten.filter((a) => !offen.includes(a)).slice(0, 3)].slice(0, 6);
  if (!liste.length) return <Leer art="leer" groesse="karte" titel={T.meins.keineAntraege(ctx.heute.slice(0, 4))} text={T.meins.keineAntraegeText} icon="CalendarDays" testid="per-meins-leer" />;
  return <MeineAbwesenheiten liste={liste} heute={ctx.heute} stornoGenehmigt={f.stornoGenehmigtSelbst.an} leitungBitten />;
}

async function Woche({ ctx }) {
  const r = await sicher(() => ladeWoche(ctx));
  if (!r.ok) return <Fehler code={r.fehler.code} kompakt />;
  return (
    <ol className="bo-per-woche" aria-label={T.meins.dieseWoche}>
      {r.daten.map((t) => (
        <li key={t.datum} className="bo-per-woche__chip" data-heute={t.datum === ctx.heute ? "" : undefined} aria-current={t.datum === ctx.heute ? "date" : undefined}>
          <span>{tagKurz(t.datum)}</span>
          <strong suppressHydrationWarning>{t.laeuft ? T.meins.laeuft : t.min != null ? hm(t.min) : "–"}</strong>
        </li>
      ))}
    </ol>
  );
}

async function TeamWoche({ ctx }) {
  const mo = wochenStartIso(ctx.heute);
  const r = await sicher(() => ladeAbwesenheiten(ctx, { von: mo, bis: plusTage(mo, 6), status: ["Genehmigt"], teamSelbstservice: true }));
  if (!r.ok) return <Fehler code={r.fehler.code} kompakt />;
  const fremd = r.daten.filter((a) => a.mitarbeiter !== ctx.eigener?.name);
  if (!fremd.length) return <p className="py-4 text-[14px] text-bo-text-soft">{T.meins.teamLeer}</p>;
  return (
    <ul className="bo-per-zeilen">
      {fremd.map((a) => (
        <li key={a.name} className="bo-per-zeile">
          <Avatar name={a.mitarbeiter_name} groesse={36} />
          <span className="bo-per-zeile__titel">{a.mitarbeiter_name}</span>
          <span className="text-[13px] text-bo-text-soft">{`${T.zeiten.abwesend} ${zeitraumText(a.von, a.bis)}`}</span>
        </li>
      ))}
    </ul>
  );
}

// T1 Mein Bereich (Konzept § 5.2): Telefon ausdrücklich zugelassen; Stempelkarte zuerst.
export default async function MeinBereich({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/meins", sp);
  const name = ctx.eigener?.vorname || ctx.session.name?.split(" ")[0] || "";
  const kopf = (aktionen) => <Seitenkopf variante="gruss" titel={<>{tageszeit(ctx.jetzt.getHours())},<br />{name}</>} ueber={tagTitel(ctx.heute)} krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.seiten.meins }]} aktionen={aktionen} unternav={<MeinsNav aktiv="heute" />} />;
  if (!ctx.eigener) {
    return (
      <PersonalHuelle ctx={ctx}>
        {kopf(null)}
        <Kachel testid="per-ohne-mitarbeiter">
          <Leer art="leer" titel={T.stempel.ohneMitarbeiter} text={T.stempel.ohneMitarbeiterText} icon="User" aktion={<LeitungBitten erlaubt bereich="personal" bereichTitel="Personal" aktion="verknuepfen" aktionTitel="Benutzer mit Mitarbeiter-Datensatz verknüpfen" objekt={{ doctype: "User", name: ctx.user }} />} />
        </Kachel>
      </PersonalHuelle>
    );
  }
  const [stempel, f, konto, alleMa, eigene] = await Promise.all([
    ladeStempel(ctx),
    ladeFaehigkeiten(ctx),
    null,
    darfBearbeiten(ctx.rolle) || ctx.rolle === "selbst" ? ladeMitarbeiterListe(ctx).catch(() => []) : [],
    ladeEigeneAbwesenheiten(ctx).catch(() => []),
  ]);
  const k = f.konten.an ? await sicher(() => ladeKonto(ctx)) : null;
  const darfVertretung = istLeitung(ctx.rolle) || ctx.rolle === "sachbearbeitung" || f.vertretungSelbstservice.an;
  void konto;
  return (
    <PersonalHuelle ctx={ctx}>
      {kopf(<MeinBereichAktionen heute={ctx.heute} eigener={ctx.eigener.name} darfVertretung={darfVertretung} vertretungen={alleMa.filter((m) => m.status === "Aktiv").map((m) => ({ name: m.name, titel: m.titel }))} konto={k?.ok ? k.daten : null} bestehende={eigene.filter((a) => a.quelle === "abw").map((a) => ({ ...a, mitarbeiter: ctx.eigener.name }))} start={["urlaub", "krank"].includes(sp.sheet) ? sp.sheet : null} krankAn={f.krankmeldung.an} />)}
      <Erstbesuch text={T.erstbesuch.meins} route="/personal/meins" />
      <Bento testid="per-meins">
        <Kachel className="md:col-span-5" titel={T.zeiten.heute} testid="per-meins-heute">
          <StempelKarte stempel={stempel} />
        </Kachel>
        <Kachel className="md:col-span-7" titel={T.meins.abwesenheiten} href="/personal/meins/urlaub" oeffnenLabel={T.meins.alleAnzeigen} testid="per-meins-abwesenheiten">
          <Suspense fallback={<div className="bo-skeleton h-40 rounded-2xl" />}>
            <Abwesenheiten ctx={ctx} f={f} />
          </Suspense>
        </Kachel>
        <Kachel className={k?.ok ? "md:col-span-7" : "md:col-span-12"} titel={T.meins.dieseWoche} href="/personal/meins/zeiten" oeffnenLabel={T.stempel.meineZeiten} testid="per-meins-woche">
          <Suspense fallback={<div className="bo-skeleton h-16 rounded-2xl" />}>
            <Woche ctx={ctx} />
          </Suspense>
        </Kachel>
        {k?.ok && (
          <Kachel className="md:col-span-5" titel={T.meins.konto} testid="per-meins-konto">
            <dl className="bo-per-fakten">
              <div>
                <dt>{T.meins.saldo(k.daten.monat)}</dt>
                <dd className="bo-zahl-gross">{saldoText(k.daten.saldoMin)}</dd>
              </div>
              <div>
                <dt>{T.meins.rest(k.daten.urlaub.jahr)}</dt>
                <dd className="bo-zahl-gross">{T.meins.tage(tageZahl(k.daten.urlaub.rest))}</dd>
              </div>
            </dl>
          </Kachel>
        )}
        {f.teamSelbstservice.an && (
          <Kachel className="md:col-span-12" titel={T.meins.team} testid="per-meins-team">
            <Suspense fallback={<KachelSkelett hoehe={120} />}>
              <TeamWoche ctx={ctx} />
            </Suspense>
          </Kachel>
        )}
      </Bento>
    </PersonalHuelle>
  );
}
