import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import MeinsNav from "@/components/Backoffice/Personal/MeinsNav";
import MeinBereichAktionen from "@/components/Backoffice/Personal/MeinBereich";
import { MeineAbwesenheiten } from "@/components/Backoffice/Personal/Abwesenheit";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeEigeneAbwesenheiten, ladeFaehigkeiten, ladeKonto, ladeMitarbeiterListe, sicher } from "@/lib/backoffice/personal/daten";
import { istLeitung } from "@/lib/backoffice/personal/rollen";
import { T } from "@/lib/backoffice/personal/texte";
import { tageZahl } from "@/lib/backoffice/personal/zeit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meine Abwesenheiten · Personal" };

// T2 Meine Abwesenheiten (Konzept § 5.2): Liste aller eigenen Anträge und Krankmeldungen, Kontobalken nur mit konten.
export default async function MeineAbwesenheitenSeite({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/meins/urlaub", sp);
  const f = await ladeFaehigkeiten(ctx);
  const r = await sicher(() => ladeEigeneAbwesenheiten(ctx));
  const k = ctx.eigener && f.konten.an ? await sicher(() => ladeKonto(ctx)) : null;
  const ma = ctx.eigener ? await ladeMitarbeiterListe(ctx).catch(() => []) : [];
  const darfVertretung = istLeitung(ctx.rolle) || ctx.rolle === "sachbearbeitung" || f.vertretungSelbstservice.an;
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf
        titel={T.meins.abwesenheiten}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.seiten.meins, href: "/personal/meins" }, { titel: T.meins.abwesenheiten }]}
        zurueck={false}
        unternav={<MeinsNav aktiv="urlaub" />}
        kennzahlen={k?.ok ? [{ wert: tageZahl(k.daten.urlaub.rest), text: T.meins.rest(k.daten.urlaub.jahr) }] : []}
        aktionen={ctx.eigener ? <MeinBereichAktionen heute={ctx.heute} eigener={ctx.eigener.name} darfVertretung={darfVertretung} vertretungen={ma.filter((m) => m.status === "Aktiv").map((m) => ({ name: m.name, titel: m.titel }))} konto={k?.ok ? k.daten : null} bestehende={r.ok ? r.daten.filter((a) => a.quelle === "abw").map((a) => ({ ...a, mitarbeiter: ctx.eigener.name })) : []} primaer start={["urlaub", "krank"].includes(sp.sheet) ? sp.sheet : null} krankAn={f.krankmeldung.an} /> : null}
      />
      <Kachel testid="per-meine-urlaub">
        {!ctx.eigener ? (
          <Leer art="leer" titel={T.stempel.ohneMitarbeiter} text={T.stempel.ohneMitarbeiterText} icon="User" />
        ) : !r.ok ? (
          <Fehler code={r.fehler.code} kompakt />
        ) : r.daten.length === 0 ? (
          <Leer art="leer" titel={T.meins.keineAntraege(ctx.heute.slice(0, 4))} text={T.meins.keineAntraegeText} icon="CalendarDays" />
        ) : (
          <MeineAbwesenheiten liste={r.daten} heute={ctx.heute} stornoGenehmigt={f.stornoGenehmigtSelbst.an} leitungBitten />
        )}
      </Kachel>
    </PersonalHuelle>
  );
}
