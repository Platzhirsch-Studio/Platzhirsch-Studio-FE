import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { ladeEinstellungen } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · CRM" };

const TAGE = ["0 Montag", "1 Dienstag", "2 Mittwoch", "3 Donnerstag", "4 Freitag", "5 Samstag"];
const TABS = ["verfuegbarkeit", "terminarten", "automationen"];
const AUTOMATIONEN = [
  ["auto_ruhend", "Ruhende Anfragen melden", "Anfragen ohne Bewegung erscheinen nach den eingestellten Tagen in „Zu erledigen“."],
  ["auto_termin_abschluss", "Termine ohne Protokoll erinnern", "Nach dem Termin erinnert das System an das Protokoll."],
  ["auto_no_show", "Nicht erschienen → Aufgabe", "Legt eine Aufgabe „anrufen, neuen Termin anbieten“ an."],
  ["auto_vortag", "Erinnerung am Vortag", "Kunden bekommen am Vortag eine Erinnerung."],
  ["auto_gewonnen", "Gewonnen mit Auftrag", "Setzt die Anfrage auf Gewonnen, sobald ein Auftrag da ist."],
  ["auto_duplikat", "Doppelte Anfragen erkennen", "Markiert ähnliche Anfragen innerhalb der eingestellten Tage."],
];

export default async function CrmEinstellungen({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("crm", "read", "/crm/einstellungen");
  const client = backoffice(session);
  const tab = TABS.includes(sp?.tab) ? sp.tab : "verfuegbarkeit";
  const d = await ladeEinstellungen(session, client);
  const fensterText = (user, tag) => d.verfuegbarkeit.filter((v) => v.user === user && v.wochentag === tag && Number(v.aktiv ?? 1)).map((v) => `${String(v.von).slice(0, 5)}–${String(v.bis).slice(0, 5)}${v.modus ? ` ${v.modus}` : ""}`).join(" · ");
  const admin = d.leitung;
  return (
    <Shell session={session}>
      <Seitenkopf ueber={T.ueber} titel={T.seiten.einstellungen} untertitel={admin ? "Gilt sofort für die Website-Buchung." : T.einstellungen.nurLeitung} />
      <div className="mb-6"><Segment label="Bereich" aktiv={tab} optionen={TABS.map((t) => ({ wert: t, titel: T.einstellungen.tabs[t], href: `/crm/einstellungen?tab=${t}` }))} /></div>
      {tab === "verfuegbarkeit" && (
        <Kachel titel={T.einstellungen.tabs.verfuegbarkeit} unter="Wochenmuster je Berater (Fenster als Text, ohne Schraffur)" werkzeuge={admin ? <Knopf size="s" variant="secondary" icon="Plus" href="/d/ph-verfuegbarkeit/neu">Fenster anlegen</Knopf> : null} testid="crm-verfuegbarkeit">
          {d.verfuegbarkeit.length === 0 ? <Leer groesse="karte" text={T.einstellungen.verfuegbarkeitLeer} /> : (
            <div className="bo-scroll-x">
              <div className="bo-crm-woche" role="table" aria-label="Verfügbarkeit">
                <div className="bo-crm-woche__kopf" role="columnheader">Berater</div>
                {TAGE.map((t) => <div key={t} className="bo-crm-woche__kopf" role="columnheader">{t.slice(2)}</div>)}
                {d.berater.filter((b) => d.verfuegbarkeit.some((v) => v.user === b.wert)).map((b) => (
                  <div key={b.wert} role="row" className="contents">
                    <div role="rowheader" className="flex items-center gap-2 font-semibold"><Avatar name={b.titel} groesse={28} />{b.titel}</div>
                    {TAGE.map((t) => {
                      const txt = fensterText(b.wert, t);
                      return <div key={t} role="cell" className="bo-crm-woche__zelle tabular-nums" data-leer={txt ? undefined : "true"}>{txt || "frei"}</div>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 text-[13px] text-bo-text-soft">Ausnahmen einer Woche (Urlaub, Krankenstand) gehören in die Abwesenheiten im Bereich Personal.</p>
        </Kachel>
      )}
      {tab === "terminarten" && (
        <Kachel titel={T.einstellungen.tabs.terminarten} werkzeuge={admin ? <Knopf size="s" variant="secondary" icon="Plus" href="/d/ph-terminart/neu">Terminart anlegen</Knopf> : null} testid="crm-terminarten">
          {d.terminarten.length === 0 ? <Leer groesse="karte" text={T.einstellungen.terminartenLeer} /> : (
            <ul className="grid gap-1">
              {d.terminarten.map((t) => (
                <li key={t.name}>
                  <Link href={`/d/ph-terminart/${encodeURIComponent(t.name)}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-3 py-3 hover:bg-bo-surface-2">
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{t.titel_de || t.titel || t.name}</span><span className="block truncate text-[13px] text-bo-text-soft">{[t.modus || "alle Modi", t.dauer_min ? `${t.dauer_min} min` : "", t.bestaetigung === "manuell" ? "Bestätigung von Hand" : "automatisch bestätigt"].filter(Boolean).join(" · ")}</span></span>
                    <span className="flex gap-2">{Number(t.aktiv) ? <Pille material="salbei">aktiv</Pille> : <Pille material="stein">aus</Pille>}{Number(t.website_sichtbar) ? <Pille material="see">Website</Pille> : null}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
      )}
      {tab === "automationen" && (
        <Kachel titel={T.einstellungen.tabs.automationen} unter="Laufen im Hintergrund von ph_crm" werkzeuge={admin ? <Knopf size="s" variant="secondary" href="/d/ph-termin-einstellungen">Bearbeiten</Knopf> : null}>
          <ul className="grid gap-2">
            {AUTOMATIONEN.map(([feld, titel, text]) => {
              const an = d.einstellungen ? Number(d.einstellungen[feld] ?? 0) === 1 : null;
              return (
                <li key={feld} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-3">
                  <span className="min-w-0"><span className="block text-[15px] font-semibold">{titel}</span><span className="block text-[13px] text-bo-text-soft">{text}</span></span>
                  <Pille material={an ? "salbei" : "stein"}>{an == null ? "unbekannt" : an ? "an" : "aus"}</Pille>
                </li>
              );
            })}
          </ul>
        </Kachel>
      )}
    </Shell>
  );
}
