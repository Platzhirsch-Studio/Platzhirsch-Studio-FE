import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Segment from "@/components/Backoffice/Segment";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Leer from "@/components/Backoffice/Leer";
import ZuTun from "@/components/Backoffice/ZuTun/ZuTun";
import { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import { ProjektTabelle } from "@/components/Backoffice/Projekte/Teile";
import BrauchtLeitung from "@/components/Backoffice/Projekte/BrauchtLeitung";
import MaengelKachel from "@/components/Backoffice/Projekte/MaengelKachel";
import ZUTUN_PROJEKTE from "@/lib/backoffice/aufgaben/projekte";
import { heuteIso, istLeitung, projekteClient, ladeMaengel, ladeProjektZeilen, ladeRueckmeldungen } from "@/lib/backoffice/projekte/lesen";
import { LAUFEND } from "@/lib/backoffice/projekte/status";
import { tagTitel } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projekte" };

const T = TEXTE.uebersicht;

function woche(heute) {
  const d = new Date(`${heute}T12:00:00`);
  const mo = new Date(d);
  mo.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const so = new Date(mo);
  so.setDate(mo.getDate() + 6);
  return [mo.toISOString().slice(0, 10), so.toISOString().slice(0, 10)];
}

/** Übersicht (T1, 10-konzept-projekte.md § 5.1): Zu tun, vier Kennzahlen je Rolle, Meine Projekte. Keine Charts (E16). */
export default async function ProjekteUebersicht({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte");
  const client = projekteClient(session);
  const heute = heuteIso();
  const leitung = istLeitung(session) || session.roles.includes("PH Geschäftsführung");
  const umfang = sp.umfang === "meine" || sp.umfang === "alle" ? sp.umfang : leitung ? "alle" : "meine";
  const [mo, so] = woche(heute);

  const [zeilen, rueck, maengel, montagenWoche, aufgaben] = await Promise.all([
    ladeProjektZeilen(client, session, { heute, filters: [["status", "in", LAUFEND]], mitEmpfohlen: true, nurMeine: umfang === "meine" }),
    ladeRueckmeldungen(client, { heute }),
    ladeMaengel(client, { heute }),
    client.count("PH Montageauftrag", { filters: [["start", "between", [`${mo} 00:00:00`, `${so} 23:59:59`]], ["status", "!=", "Abgebrochen"]] }).catch(() => null),
    client.count("PH Projekt Aufgabe", { filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]], ["faellig", "<=", heute]] }).catch(() => null),
  ]);
  const meine = new Set(zeilen.map((z) => z.name));
  const rueckSicht = umfang === "meine" ? rueck.filter((r) => meine.has(r.projekt)) : rueck;
  const maengelSicht = umfang === "meine" ? maengel.filter((m) => meine.has(m.projekt)) : maengel;
  const ueberfaellig = rueckSicht.filter((r) => r.ueberfaellig).length;
  const sortiert = [...zeilen].sort((a, b) => String(a.termin?.start || "9999").localeCompare(String(b.termin?.start || "9999"))).slice(0, 8);
  const umfangLinks = [
    { wert: "meine", titel: T.umfangMeine, href: "/projekte?umfang=meine" },
    { wert: "alle", titel: T.umfangAlle, href: "/projekte?umfang=alle" },
  ];

  return (
    <Shell session={session}>
      <Seitenkopf
        ueber={tagTitel(heute)}
        titel={T.titel}
        untertitel={zeilen.length ? `${zeilen.length} laufende Projekte${umfang === "meine" ? " mit dir im Team" : ""}` : undefined}
        aktionen={
          <>
            <Segment label="Umfang" optionen={umfangLinks} aktiv={umfang} testid="umfang" />
            <Knopf variant="primary" icon="Plus" href="/projekte/neu" kuerzel="N">
              {T.neu}
            </Knopf>
          </>
        }
      />
      <Bento testid="projekte-uebersicht">
        <ZuTun quellen={ZUTUN_PROJEKTE} session={session} client={client} titel={T.zuTun} unter={T.zuTunUnter} className="md:col-span-6" testid="projekte-zutun" />
        <Akzentkachel className="col-span-6 md:col-span-3" ton="cognac" titel={TEXTE.akzent.rueckTitel} text={TEXTE.kennzahl.rueckmeldungenUeber(ueberfaellig)} zahl={rueckSicht.length} href="/projekte/rueckmeldungen" testid="kennzahl-rueckmeldungen" />
        <Akzentkachel className="col-span-6 md:col-span-3" ton="salbei" titel={TEXTE.akzent.montageTitel} text={TEXTE.akzent.montageText} zahl={montagenWoche} href="/projekte/montagen" testid="kennzahl-montagen" />
        {leitung ? (
          <BrauchtLeitung client={client} heute={heute} className="md:col-span-6" />
        ) : (
          <Kennzahl className="md:col-span-3" titel={TEXTE.kennzahl.aufgaben} wert={aufgaben} href="/projekte/aufgaben?sicht=mir" testid="kennzahl-aufgaben" />
        )}
        <MaengelKachel maengel={maengelSicht} heute={heute} className={leitung ? "md:col-span-6" : "md:col-span-9"} />
        <ProjektTabelle
          className="md:col-span-12"
          titel={umfang === "meine" ? T.meine : T.alle}
          unter={`${zeilen.length} Projekte · sortiert nach nächstem Termin`}
          zeilen={sortiert}
          heute={heute}
          mitEmpfohlen
          alleHref="/projekte/liste"
          leer={
            umfang === "meine" ? (
              <Leer groesse="karte" titel={T.meineLeer} aktion={<Knopf href="/projekte?umfang=alle">{T.alleProjekte}</Knopf>} />
            ) : (
              <Leer groesse="karte" titel={T.leer} aktion={<Knopf variant="primary" href="/projekte/neu">{T.neu}</Knopf>} nebenaktion={<Knopf variant="ghost" href="/crm/anfragen">{T.zuAnfragen}</Knopf>} />
            )
          }
        />
      </Bento>
    </Shell>
  );
}

