import { requireSession } from "@/lib/backoffice/auth/dal";
import { darfGeraeteVerwalten } from "@/lib/backoffice/auth/rechte";
import { geraeteListe } from "@/lib/backoffice/auth/geraet";
import { DRUCKFORMATE, formatTitel, papierFuer } from "@/lib/backoffice/druck/index";
import { doctypeLabel } from "@/lib/backoffice/labels";
import { DRUCKZENTRALE as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import FaehigkeitHinweis from "@/components/Backoffice/FaehigkeitHinweis";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Druck · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const REITER = ["warteschlange", "formate", "drucker"];
const PAPIER_TEXT = { a4: "A4", bon: "Bon 80 mm", etikett: "Etikett" };

/** Druckzentrale (10-konzept-zentrale § 3.14): Warteschlange (alle), Druckformate und Drucker (Leitung/Admin). */
export default async function Druck({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireSession("/druck");
  const leitung = darfGeraeteVerwalten(session);
  const reiter = REITER.includes(sp.tab) && (sp.tab === "warteschlange" || leitung) ? sp.tab : "warteschlange";
  let inhalt;
  if (reiter === "formate") {
    const zeilen = Object.entries(DRUCKFORMATE);
    inhalt = (
      <Kachel titel={T.reiter.formate} testid="druck-formate">
        {zeilen.length === 0 ? (
          <p className="zb-leise">{T.formateLeer}</p>
        ) : (
          <div className="zb-scroll">
            <table className="zb-tabelle">
              <thead>
                <tr>
                  <th scope="col">{T.objekt}</th>
                  <th scope="col">{T.formate}</th>
                  <th scope="col">{T.papier}</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map(([dt, formate]) => (
                  <tr key={dt}>
                    <td className="zb-stark">{doctypeLabel(dt)}</td>
                    <td>
                      <span className="flex flex-wrap gap-1.5">
                        {formate.map((f, i) => (
                          <Pille key={f} material={i === 0 ? "salbei" : "stein"} groesse="sm">
                            {formatTitel(f, dt)}
                            {i === 0 ? ` · ${T.standard}` : ""}
                          </Pille>
                        ))}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{[...new Set(formate.map((f) => PAPIER_TEXT[papierFuer(f)]))].join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kachel>
    );
  } else if (reiter === "drucker") {
    const geraete = (await geraeteListe({ session }).catch(() => [])).filter((g) => g.drucker);
    inhalt =
      geraete.length === 0 ? (
        <Leer titel={T.druckerLeer} icon="Printer" aktion={<Knopf href="/geraete" icon="Monitor">{T.zuDenGeraeten}</Knopf>} />
      ) : (
        <Kachel titel={T.reiter.drucker}>
          <ul className="zb-liste">
            {geraete.map((g) => (
              <li key={g.geraet} className="zb-liste__i">
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{g.geraetename}</span>
                  <span className="zb-leise block">{[g.drucker, g.drucker_typ].filter(Boolean).join(" · ")}</span>
                </span>
                <Pille material="stein">{g.typ}</Pille>
              </li>
            ))}
          </ul>
        </Kachel>
      );
  } else {
    inhalt = (
      <div className="flex flex-col gap-6">
        <Leer titel={T.warteschlangeLeer} icon="Printer" />
        <Kachel titel={T.testseite}>
          <p className="zb-leise mb-3">{T.testseiteText}</p>
          <Knopf icon="Printer" disabled grund={<FaehigkeitHinweis status={{ an: false, ersatz: { titel: "Beleg aus einer Akte drucken (Strg+P)", href: "/" } }} />}>
            {T.testseite}
          </Knopf>
        </Kachel>
      </div>
    );
  }
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.titel}
        untertitel={T.unter}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Verwaltung", href: "/verwaltung" }, { titel: T.titel }]}
        unternav={<Segment label={T.titel} aktiv={reiter} optionen={REITER.filter((r) => r === "warteschlange" || leitung).map((r) => ({ wert: r, titel: T.reiter[r], href: `/druck?tab=${r}` }))} />}
      />
      {!leitung && <p className="zb-leise mb-4">{T.nurLeitung}</p>}
      {inhalt}
    </Shell>
  );
}
