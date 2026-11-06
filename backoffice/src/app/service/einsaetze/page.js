// Einsätze (T4/T3/T2, 10-konzept-service §2.4): Woche als Ressourcen-Raster (Techniker × Tage), Kanban, Liste.
// Umplanen und Absagen in der Einsatz-Akte (verzögerter Commit bzw. Dialog); Kanban Geplant → Bestätigt direkt.
import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { kalenderwoche, verschiebe, wochenStart } from "@/lib/backoffice/datum";
import { ladeEinsaetze, personen, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { einsatzZeile } from "@/lib/backoffice/service/zeilen";
import { EINSATZ_STATUS } from "@/lib/backoffice/service/labels";
import { tagKurz, tagMonat, datumLang } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import { Status } from "@/components/Backoffice/Service/Teile";
import ListeKachel from "@/components/Backoffice/Service/ListeKachel";
import ServiceKanban from "@/components/Backoffice/Service/ServiceKanban";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einsätze · Service" };

export default async function Einsaetze({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("service", "read", "/service/einsaetze");
  const client = serviceClient(session);
  const s = sicht(session);
  const ansicht = ["woche", "kanban", "liste"].includes(sp.ansicht) ? sp.ansicht : "woche";
  const heute = isoDatum();
  const start = wochenStart(/^\d{4}-\d{2}-\d{2}$/.test(sp.woche || "") ? sp.woche : heute);
  const tage = Array.from({ length: 6 }, (_, i) => verschiebe(start, { tage: i }));
  const p = await personen(client);
  const filter = ansicht === "woche" ? {} : {};
  const { einsaetze, techniker } = await ladeEinsaetze(client, ansicht === "woche" ? { von: tage[0], bis: tage[5], ...filter } : { filter: ansicht === "kanban" ? [["status", "in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit", "Nicht angetroffen"]]] : [] });
  const nurMeine = s.techniker || sp.meine === "1";
  const liste = (nurMeine ? einsaetze.filter((e) => e.techniker === session.user || e.techniker_2 === session.user) : einsaetze).map((e) => einsatzZeile(e, { personen: p }));
  const reiter = ["alle", "unbestaetigt", "folge"].includes(sp.reiter) ? sp.reiter : "alle";
  const href = (aend) => {
    const q = new URLSearchParams(Object.entries({ ansicht: ansicht === "woche" ? "" : ansicht, woche: sp.woche || "", reiter: sp.reiter || "", meine: sp.meine || "", ...aend }).filter(([, v]) => v));
    return `/service/einsaetze${q.toString() ? `?${q}` : ""}`;
  };

  let inhalt;
  if (ansicht === "woche") {
    const personenListe = [...new Map([...techniker.map((t) => [t.email, t.name]), ...liste.map((e) => [e.techniker, e.technikerName])]).entries()].filter(([email]) => !nurMeine || email === session.user);
    inhalt = (
      <Kachel titel={`KW ${kalenderwoche(start)} · ${tagMonat(tage[0])}–${tagMonat(tage[5])}`} unter={`${liste.length} Einsätze · Techniker-Tag laut Einstellungen`} werkzeuge={<span className="flex gap-2"><RundKnopf icon="ChevronLeft" label="Vorige Woche" href={href({ woche: verschiebe(start, { tage: -7 }) })} groesse="s" /><Knopf size="s" variant="secondary" href={href({ woche: "" })}>{T.einsaetze.heute}</Knopf><RundKnopf icon="ChevronRight" label="Nächste Woche" href={href({ woche: verschiebe(start, { tage: 7 }) })} groesse="s" /></span>} testid="einsatz-woche">
        {!techniker.length && <p className="mb-4 text-[14px] text-bo-text-soft">{T.einsaetze.keineTechniker}</p>}
        {!liste.length && <p className="mb-4 rounded-bo-zeile bg-bo-fill px-4 py-3 text-[14px] text-bo-text-soft">{T.einsaetze.leerWoche}</p>}
        <div className="bo-scroll-x -mx-2 overflow-x-auto px-2">
          <div className="bo-svc-woche" style={{ "--tage": tage.length }} role="grid" aria-label="Einsätze der Woche je Techniker">
            <div className="bo-svc-woche__kopf" role="columnheader">Techniker</div>
            {tage.map((t) => (
              <div key={t} className="bo-svc-woche__kopf" role="columnheader" data-heute={t === heute ? "" : undefined}>
                {tagKurz(t)}
              </div>
            ))}
            {personenListe.map(([email, name]) => (
              <div key={email} className="contents" role="row">
                <div className="bo-svc-woche__person" role="rowheader">
                  <Avatar name={name} groesse={32} />
                  <span className="min-w-0 text-[14px] font-medium leading-5">{name.replace(/\s*\(.*\)$/, "")}</span>
                </div>
                {tage.map((t) => {
                  const hier = liste.filter((e) => e.techniker === email && e.datum === t);
                  return (
                    <div key={t} className="bo-svc-woche__zelle" role="gridcell" data-heute={t === heute ? "" : undefined} aria-label={`${name}, ${tagKurz(t)}: ${hier.length} Einsätze`}>
                      {hier.map((e) => (
                        <Link key={e.name} href={`/service/einsaetze/${encodeURIComponent(e.name)}`} className="bo-svc-einsatz" data-art={e.art} data-status={e.status}>
                          <span className="bo-svc-einsatz__zeit">{e.zeit}</span>
                          <span className="bo-svc-einsatz__kunde">{e.titel}</span>
                          <span className="bo-svc-einsatz__unter">
                            {e.art} · {EINSATZ_STATUS[e.status]?.text}
                          </span>
                          {(e.neuInformieren || (e.unbestaetigt && t >= heute)) && <span className="bo-svc-einsatz__kennz">{e.neuInformieren ? T.einsaetze.neuInformieren : T.einsaetze.unbestaetigt}</span>}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Kachel>
    );
  } else if (ansicht === "kanban") {
    const karte = (e) => ({ name: e.name, titel: e.titel, unter: `${e.tag} · ${e.zeit}`, href: `/service/einsaetze/${encodeURIComponent(e.name)}`, chips: [{ text: e.art }, e.neuInformieren ? { text: T.einsaetze.neuInformieren, ton: "warn" } : e.unbestaetigt ? { text: T.einsaetze.unbestaetigt, ton: "warn" } : null].filter(Boolean), person: e.technikerName, hinweis: e.unter.split(" · ").slice(1).join(" · ") });
    const spalten = ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit", "Nicht angetroffen"].map((st) => ({ status: st, titel: EINSATZ_STATUS[st].text, ton: EINSATZ_STATUS[st].ton, karten: liste.filter((e) => e.status === st).map(karte) }));
    inhalt = liste.length ? <ServiceKanban art="einsatz" spalten={spalten} ziele={{ Geplant: ["Bestaetigt", "Nicht angetroffen"], Bestaetigt: ["Nicht angetroffen"], Unterwegs: ["Nicht angetroffen"], "In Arbeit": ["Nicht angetroffen"] }} nurLesen={!s.schreiben} /> : <Leer text={T.einsaetze.leerKanban} />;
  } else {
    const gefiltert = liste.filter((e) => (reiter === "unbestaetigt" ? e.unbestaetigt && e.datum >= heute : reiter === "folge" ? einsaetze.find((x) => x.name === e.name)?.folgeeinsatz_noetig && !einsaetze.find((x) => x.name === e.name)?.folgeeinsatz : true)).sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
    inhalt = (
      <>
        <div className="mb-4">
          <Segment label="Reiter" aktiv={reiter} groesse="s" optionen={[{ wert: "alle", titel: "Alle", href: href({ reiter: "" }) }, { wert: "unbestaetigt", titel: "Unbestätigt", href: href({ reiter: "unbestaetigt" }) }, { wert: "folge", titel: "Folgeeinsatz nötig", href: href({ reiter: "folge" }) }]} />
        </div>
        {gefiltert.length ? (
          <ListeKachel
            spalten={[{ titel: "Einsatz" }, { titel: "Datum" }, { titel: "Techniker", nurAb: "lg" }, { titel: "Status" }, { titel: "Ergebnis", nurAb: "xl" }, { titel: "Fall / Vertrag", nurAb: "xl" }]}
            zeilen={gefiltert.map((e) => ({ key: e.name, href: `/service/einsaetze/${encodeURIComponent(e.name)}`, titel: e.titel, unter: `${e.name} · ${e.art}`, icon: "Wrench", zellen: [`${datumLang(e.datum)} ${e.zeit}`, e.technikerName, <Status key="s" wert={e.status} map={EINSATZ_STATUS} groesse="sm" />, e.ergebnis || "–", e.servicefall || e.pflege || "–"] }))}
            fuss={<span>{gefiltert.length} Einsätze</span>}
          />
        ) : (
          <Leer art="erledigt" text={reiter === "unbestaetigt" ? "Alle Einsätze sind bestätigt." : reiter === "folge" ? "Kein Folgeeinsatz offen." : "Noch keine Einsätze."} />
        )}
      </>
    );
  }

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.einsaetze.titel}
        krumen={[{ titel: "Service", href: "/service" }, { titel: T.einsaetze.titel }]}
        kennzahlen={[{ wert: liste.filter((e) => e.datum === heute).length, text: "heute" }, { wert: liste.filter((e) => e.unbestaetigt && e.datum >= heute).length, text: T.einsaetze.unbestaetigt }]}
        aktionen={
          <>
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "woche", titel: T.einsaetze.ansichten.woche, href: href({ ansicht: "" }) }, { wert: "kanban", titel: T.einsaetze.ansichten.kanban, href: href({ ansicht: "kanban" }) }, { wert: "liste", titel: T.einsaetze.ansichten.liste, href: href({ ansicht: "liste" }) }]} />
            {s.schreiben && !s.techniker && (
              <Knopf variant="primary" icon="CalendarPlus" href="/service/einsaetze/neu">
                {T.einsaetze.planen}
              </Knopf>
            )}
          </>
        }
      />
      {inhalt}
    </Shell>
  );
}
