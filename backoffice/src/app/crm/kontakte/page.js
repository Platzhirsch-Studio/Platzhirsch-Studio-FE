import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Icon } from "@/components/Backoffice/icons";
import { CrmStatus, KontaktKnoepfe } from "@/components/Backoffice/Crm/Teile";
import { NeuerKontaktKnopf } from "@/components/Backoffice/Crm/Kopfknoepfe";
import { ladeKontakte } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { relativ } from "@/lib/backoffice/format";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kunden & Kontakte · CRM" };

const SICHTEN = ["kunden", "interessenten", "meine", "partner", "firmen", "alle"];

export default async function KontakteSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/crm/kontakte");
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Kontakt");
  await requireDocRecht(meta, "read", "/crm/kontakte");
  const sicht = SICHTEN.includes(sp?.sicht) ? sp.sicht : "alle";
  const q = typeof sp?.q === "string" ? sp.q.slice(0, 80) : "";
  const d = await ladeKontakte(session, client, { sicht, q, seite: sp?.seite });
  const href = (s, extra = {}) => {
    const p = new URLSearchParams(Object.entries({ sicht: s === "alle" ? "" : s, q, ...extra }).filter(([, v]) => v));
    return `/crm/kontakte${p.toString() ? `?${p}` : ""}`;
  };
  const jetzt = new Date();
  const seiten = Math.max(1, Math.ceil(d.gesamt / d.groesse));

  return (
    <Shell session={session} breit>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.kontakte} kennzahlen={[{ wert: String(d.zaehler.kunden), text: T.kontakte.ansichten.kunden }, { wert: String(d.zaehler.interessenten), text: T.kontakte.ansichten.interessenten }]} aktionen={<NeuerKontaktKnopf />} />
      <Erstbesuch text={T.kontakte.erstbesuch} route="/crm/kontakte" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segment label="Ansicht der Kontakte" aktiv={sicht} optionen={SICHTEN.map((s) => ({ wert: s, titel: T.kontakte.ansichten[s], href: href(s), anzahl: d.zaehler[s] }))} />
        <form action="/crm/kontakte" method="get" role="search" className="ml-auto">
          {sicht !== "alle" && <input type="hidden" name="sicht" value={sicht} />}
          <label className="bo-suche flex h-10 w-[300px] max-w-full items-center gap-2 px-4">
            <Icon name="Search" className="size-4 text-bo-text-soft" />
            <span className="sr-only">Suchen</span>
            <input name="q" defaultValue={q} placeholder={T.kontakte.suche} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" data-testid="crm-kontakte-suche" />
          </label>
        </form>
      </div>
      <Kachel flach testid="crm-kontakte-liste">
        {d.liste.length === 0 ? (
          <div className="p-6"><Leer art={q || sicht !== "alle" ? "gefiltert" : "leer"} text={q ? `Kein Kontakt zu „${q}“.` : q || sicht !== "alle" ? T.kontakte.leerGefiltert : T.kontakte.leer} zuruecksetzenHref={q || sicht !== "alle" ? "/crm/kontakte" : undefined} /></div>
        ) : (
          <>
            <div className="bo-crm-tabelle-huelle bo-scroll-x px-3 pt-5">
              <table className="bo-crm-tabelle">
                <thead>
                  <tr>
                    <th>{T.kontakte.spalten.name}</th>
                    <th>{T.kontakte.spalten.kontakt}</th>
                    <th className="hidden lg:table-cell">{T.kontakte.spalten.art}</th>
                    <th className="hidden md:table-cell">{T.kontakte.spalten.ort}</th>
                    <th className="hidden xl:table-cell"><span className="sr-only">{T.kontakte.spalten.berater}</span></th>
                    <th className="hidden lg:table-cell">{T.kontakte.spalten.letzter}</th>
                    <th>{T.kontakte.spalten.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.liste.map((k) => (
                    <tr key={k.name} data-testid="crm-kontakt-zeile">
                      <td className="max-w-[340px]">
                        <Link href={`/kunden/${encodeURIComponent(k.name)}`} className="bo-crm-objekt">
                          <Avatar name={k.titel || k.nachname} groesse={48} />
                          <span className="min-w-0">
                            <span className="bo-crm-objekt__titel flex items-center gap-2">
                              <span className="truncate">{k.titel || k.name}</span>
                              {Number(k.nicht_kontaktieren) ? <Pille material="stein" groesse="s">{T.kontakte.widerspruch}</Pille> : null}
                              {k.anonymisiert_am ? <Pille material="stein" groesse="s" punkt={false}>{T.kontakte.anonymisiert}</Pille> : null}
                            </span>
                            <span className="bo-crm-objekt__unter">{[k.kontaktart === "Geschaeft" && k.personen ? T.kontakte.personen(k.personen) : k.firma, k.name].filter(Boolean).join(" · ")}</span>
                          </span>
                        </Link>
                      </td>
                      <td><KontaktKnoepfe email={k.email} telefon={k.telefon || k.mobil} wer={k.titel} /></td>
                      <td className="hidden whitespace-nowrap lg:table-cell">{T.kontaktart[k.kontaktart] || k.kontaktart}</td>
                      <td className="hidden whitespace-nowrap md:table-cell">{[k.plz, k.ort].filter(Boolean).join(" ") || "–"}</td>
                      <td className="hidden xl:table-cell">{k.beraterName ? <PersonZelle person={k.beraterName} groesse={24} nurAvatar /> : null}</td>
                      <td className="hidden whitespace-nowrap lg:table-cell">{k.letzter_kontakt ? `${relativ(k.letzter_kontakt, jetzt)}${k.letzter_kontakt_art ? ` · ${k.letzter_kontakt_art}` : ""}` : "–"}</td>
                      <td><CrmStatus objekt="kontakt" wert={k.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="bo-crm-karten px-3 pt-4">
              {d.liste.map((k) => (
                <li key={k.name}>
                  <Link href={`/kunden/${encodeURIComponent(k.name)}`} className="bo-crm-karte">
                    <Avatar name={k.titel} groesse={40} />
                    <span className="min-w-0"><span className="bo-crm-objekt__titel">{k.titel}</span><span className="bo-crm-objekt__unter">{k.ort || k.email || "–"}</span></span>
                    <CrmStatus objekt="kontakt" wert={k.status} groesse="sm" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 pt-3">
              <p className="text-[13px] text-bo-text-soft tabular-nums">{d.liste.length} von {d.gesamt} Kontakten</p>
              {seiten > 1 && (
                <div className="flex gap-2">
                  {d.seite > 1 && <Knopf size="s" variant="secondary" href={href(sicht, { seite: String(d.seite - 1) })} icon="ChevronLeft">{T.knopf.zurueck}</Knopf>}
                  {d.seite < seiten && <Knopf size="s" variant="secondary" href={href(sicht, { seite: String(d.seite + 1) })} iconRechts="ChevronRight">{T.knopf.weiter}</Knopf>}
                </div>
              )}
            </div>
          </>
        )}
      </Kachel>
    </Shell>
  );
}
