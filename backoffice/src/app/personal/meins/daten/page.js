import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import LeitungBitten from "@/components/Backoffice/LeitungBitten";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import MeinsNav from "@/components/Backoffice/Personal/MeinsNav";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeMitarbeiter, sicher } from "@/lib/backoffice/personal/daten";
import { T } from "@/lib/backoffice/personal/texte";
import { rolleInternText, ausmassText } from "@/lib/backoffice/personal/status";
import { langDatum } from "@/lib/backoffice/personal/zeit";
import { teamsVon } from "@/lib/backoffice/personal/regeln";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meine Daten · Personal" };

// T5 lesend (Konzept § 5.2): eigene Stammdaten ohne permlevel 1; „Änderung anfragen“ → Leitung bitten (bis A13).
export default async function MeineDaten({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/meins/daten", sp);
  const r = ctx.eigener ? await sicher(() => ladeMitarbeiter(ctx, ctx.eigener.name)) : null;
  const m = r?.ok ? r.daten.mitarbeiter : null;
  const zeilen = m
    ? [
        ["Name", m.titel],
        ["Rolle", rolleInternText(m.rolle_intern)],
        ["Teams", teamsVon(m).map((t) => T.team.teams[t]).join(", ") || "–"],
        ["Ausmaß", ausmassText(m.beschaeftigungsart)],
        ["Wochenstunden", m.wochenstunden ? `${String(m.wochenstunden).replace(".", ",")} h` : "Standard aus Einstellungen"],
        ["Eintritt", langDatum(m.eintritt)],
        ["E-Mail dienstlich", m.email_dienst || "–"],
        ["Telefon dienstlich", m.telefon_dienst || "–"],
        ["Führerscheinklassen", m.fuehrerschein_klassen || "–"],
      ]
    : [];
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf
        titel={T.seiten.meineDaten}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.seiten.meins, href: "/personal/meins" }, { titel: T.seiten.meineDaten }]}
        zurueck={false}
        unternav={<MeinsNav aktiv="daten" />}
        aktionen={m ? <LeitungBitten erlaubt bereich="personal" bereichTitel="Personal" aktion="daten" aktionTitel="Änderung meiner Daten" objekt={{ doctype: "PH Mitarbeiter", name: m.name }} /> : null}
      />
      {!m ? (
        <Kachel>
          <Leer art="leer" titel={T.stempel.ohneMitarbeiter} text={T.stempel.ohneMitarbeiterText} icon="User" />
        </Kachel>
      ) : (
        <Bento>
          <Kachel className="md:col-span-8" titel="Stammdaten" unter="Nur lesend – Änderungen übernimmt die Personal-Leitung" testid="per-meine-daten">
            <dl className="bo-per-fakten">
              {zeilen.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Kachel>
          <Kachel className="md:col-span-4" titel="Datenschutz" unter="Was die Kolleginnen und Kollegen sehen">
            <p className="text-[14px] leading-[21px] text-bo-text-soft">Im Teamkalender sehen andere nur „abwesend“ und den Zeitraum. Art, Grund und Krankmeldungen sehen die Personal-Leitung und die Geschäftsführung.</p>
          </Kachel>
        </Bento>
      )}
    </PersonalHuelle>
  );
}
