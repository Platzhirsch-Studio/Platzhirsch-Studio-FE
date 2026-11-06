import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Avatar from "@/components/Backoffice/Avatar";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { Pille } from "@/components/Backoffice/StatusBadge";
import TerminKalender from "@/components/Backoffice/Crm/TerminKalender";
import { CrmStatus } from "@/components/Backoffice/Crm/Teile";
import { NeuerTerminKnopf } from "@/components/Backoffice/Crm/Kopfknoepfe";
import { beraterListe, ladeTermine } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { materialFuerModus, terminStatus } from "@/lib/backoffice/crm/status";
import { terminZeit } from "@/lib/backoffice/crm/vorgang";
import { isoDatum } from "@/lib/backoffice/format";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termine · CRM" };

const SICHTEN = { woche: "Diese Woche", heute: "Heute", bestaetigen: "Zu bestätigen", meine: "Meine", "ohne-protokoll": "Ohne Protokoll" };

export default async function TerminSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/termine");
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Termin");
  await requireDocRecht(meta, "read", "/crm/termine");
  const ansicht = sp?.ansicht === "liste" ? "liste" : "kalender";
  const sicht = SICHTEN[sp?.sicht] ? sp.sicht : "woche";
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(sp?.datum || "") ? sp.datum : isoDatum(new Date());
  const kal = ["tag", "woche", "monat"].includes(sp?.kal) ? sp.kal : "woche";
  const basis = new Date(`${datum}T12:00:00`);
  const von = isoDatum(new Date(basis.getTime() - 40 * 86400000));
  const bis = isoDatum(new Date(basis.getTime() + 40 * 86400000));
  const heute = isoDatum(new Date());
  const inSieben = new Date();
  inSieben.setDate(inSieben.getDate() + 7);
  const listenBereich = sicht === "heute" ? { von: heute, bis: heute } : sicht === "woche" ? { von: heute, bis: isoDatum(inSieben) } : {};
  const [termine, berater] = await Promise.all([
    ansicht === "kalender" ? ladeTermine(session, client, { von, bis }) : ladeTermine(session, client, { ...listenBereich, sicht }),
    beraterListe(client),
  ]);
  const ohneEntfallen = termine.filter((t) => !["Storniert", "Abgelehnt"].includes(t.status));
  const eintraege = ohneEntfallen.map((t) => ({
    id: t.name, quelle: "termin", titel: t.person || t.titel, unter: `${T.modus[t.modus] || ""} · ${terminStatus(t).text}`, start: String(t.start).slice(0, 16), ende: String(t.ende || "").slice(0, 16),
    personen: t.beraterName ? [t.beraterName] : [], ort: T.modus[t.modus] || "", href: `/crm/termine/${encodeURIComponent(t.name)}`, status: terminStatus(t).text, verschiebbar: ["Unbestaetigt", "Bestaetigt"].includes(t.status),
  }));
  const href = (a, s) => `/crm/termine?ansicht=${a}${s && s !== "woche" ? `&sicht=${s}` : ""}`;
  const zuBestaetigen = termine.filter((t) => t.status === "Unbestaetigt" && Number(t.email_verifiziert)).length;

  return (
    <Shell session={session} breit>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.termine}
        kennzahlen={ansicht === "kalender" ? [{ wert: String(ohneEntfallen.filter((t) => String(t.start).startsWith(heute)).length), text: "heute" }, { wert: String(zuBestaetigen), text: "zu bestätigen" }] : []}
        aktionen={<><Segment label="Darstellung" aktiv={ansicht} groesse="s" optionen={[{ wert: "kalender", titel: T.termine.ansichten.kalender, href: href("kalender"), icon: "CalendarDays" }, { wert: "liste", titel: T.termine.ansichten.liste, href: href("liste"), icon: "Rows3" }]} /><NeuerTerminKnopf berater={berater} ich={session.user} /></>} />
      <Erstbesuch text={T.termine.erstbesuch} route="/crm/termine" />
      {ansicht === "kalender" ? (
        <Kachel flach className="p-4" testid="crm-termine-kalender">
          <TerminKalender eintraege={eintraege} datum={datum} ansicht={kal} berater={berater} ich={session.user} />
        </Kachel>
      ) : (
        <>
          <div className="mb-6"><Segment label="Ansicht" aktiv={sicht} optionen={Object.entries(SICHTEN).map(([k, v]) => ({ wert: k, titel: v, href: href("liste", k) }))} /></div>
          <Kachel flach testid="crm-termine-liste">
            {termine.length === 0 ? (
              <div className="p-6"><Leer art={sicht === "ohne-protokoll" ? "erledigt" : "leer"} text={sicht === "ohne-protokoll" ? T.termine.ohneProtokollLeer : T.termine.leerListe} /></div>
            ) : (
              <div className="bo-scroll-x px-3 py-5">
                <table className="bo-crm-tabelle">
                  <thead><tr><th>Beginn</th><th>Kunde</th><th>Modus</th><th className="hidden lg:table-cell"><span className="sr-only">Berater</span></th><th className="hidden xl:table-cell">E-Mail bestätigt</th><th>Status</th></tr></thead>
                  <tbody>
                    {termine.map((t) => (
                      <tr key={t.name} data-testid="crm-termin-zeile">
                        <td className="whitespace-nowrap tabular-nums"><Link href={`/crm/termine/${encodeURIComponent(t.name)}`} className="font-semibold hover:underline">{terminZeit(t.start)}</Link><span className="block text-[13px] text-bo-text-soft">{t.dauer_min || 60} min</span></td>
                        <td><span className="bo-crm-objekt"><Avatar name={t.person || t.titel} groesse={40} /><span className="min-w-0"><span className="bo-crm-objekt__titel">{t.person || t.titel}</span><span className="bo-crm-objekt__unter">{[t.thema, t.name].filter(Boolean).join(" · ")}</span></span></span></td>
                        <td><Pille material={materialFuerModus(t.modus)}>{T.modus[t.modus] || t.modus}</Pille></td>
                        <td className="hidden lg:table-cell">{t.beraterName ? <PersonZelle person={t.beraterName} groesse={24} /> : "–"}</td>
                        <td className="hidden xl:table-cell">{Number(t.email_verifiziert) ? "ja" : "nein"}</td>
                        <td><CrmStatus objekt="termin" doc={t} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Kachel>
        </>
      )}
    </Shell>
  );
}
