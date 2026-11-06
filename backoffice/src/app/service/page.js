// Bereichsstart Service (T1, 10-konzept-service §2.1, §5) im Lounge-Stil: Heute-Leiste (Arbeitszähler, nur > 0),
// „Jetzt dran“ nach Server-Rang, Einsätze heute, Kennzahlen je Rolle, Charts nur Leitung/GF.
// Genau eine Hauptaktion in Tinte: „Servicefall melden“.
import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { ladeKatalog, ladeStart, personen, serviceClient } from "@/lib/backoffice/service/daten";
import { fallZeile } from "@/lib/backoffice/service/zeilen";
import { T } from "@/lib/backoffice/service/texte";
import { tagMonat, spanne } from "@/lib/backoffice/service/anzeige";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import { Balken, Donut } from "@/components/Backoffice/Charts";
import Avatar from "@/components/Backoffice/Avatar";
import { Icon } from "@/components/Backoffice/icons";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Knopf from "@/components/Backoffice/Knopf";
import { MeldenKnopf } from "@/components/Backoffice/Service/Melden";
import JetztDran from "@/components/Backoffice/Service/JetztDran";
import { EINSATZ_STATUS } from "@/lib/backoffice/service/labels";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service" };

const JETZT_MAX = 8;

function Chip({ href, ton, icon, children, testid }) {
  return (
    <Link href={href} className="bo-svc-chip" data-ton={ton} data-testid={testid}>
      <span className="bo-svc-chip__ico">
        <Icon name={icon} className="size-3.5" />
      </span>
      {children}
    </Link>
  );
}

export default async function ServiceStart() {
  const session = await requireRecht("service", "read", "/service");
  const client = serviceClient(session);
  const [d, katalog, p] = await Promise.all([ladeStart(client, session), ladeKatalog(client).catch(() => ({ bereiche: [], codes: [] })), personen(client)]);
  const s = d.sicht;
  const heute = new Date();
  const warn = Number(d.einst.fristwarnung_tage) || 60;
  const zeilen = d.jetztDran.slice(0, JETZT_MAX).map((f) => fallZeile(f, { heute, warnTage: warn, personen: p, leitung: s.leitung }));
  const h = d.heute;
  const chips = [
    h.reaktion > 0 && { href: "/service/faelle?reiter=reaktion", ton: "gefahr", icon: "TriangleAlert", text: T.start.chips.reaktion(h.reaktion), testid: "chip-reaktion" },
    h.maengelanzeige > 0 && { href: "/service/faelle?status=Geprueft,Entscheidung,In%20Bearbeitung", ton: "warn", icon: "Truck", text: T.start.chips.maengelanzeige(h.maengelanzeige) },
    h.regressfrist > 0 && { href: "/service/regress?reiter=frist", ton: "warn", icon: "Clock", text: T.start.chips.regressfrist(h.regressfrist) },
    s.leitung && h.kulanz > 0 && { href: "/service/faelle?status=Entscheidung", ton: "info", icon: "Hourglass", text: T.start.chips.kulanz(h.kulanz) },
    h.wartung > 0 && { href: "/service/vertraege?art=pflege&reiter=ueberfaellig", ton: "warn", icon: "Wrench", text: T.start.chips.wartung(h.wartung) },
  ].filter(Boolean);
  const k = d.kennzahlen;
  const offenAnzahl = d.jetztDran.length;

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.start.titel}
        ueber={new Date().toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" })}
        kennzahlen={[
          { wert: k.einsaetzeWoche ?? "–", text: T.start.kennzahlen.einsaetzeWoche },
          s.kosten || s.leitung ? { wert: k.durchlauf === null ? "–" : `${k.durchlauf} Tage`, text: k.durchlauf === null ? T.start.kennzahlen.durchlauf : `${T.start.kennzahlen.durchlauf} · ${T.start.kennzahlen.durchlaufBasis(k.durchlaufBasis)}` } : { wert: k.gewaehrleistung60, text: T.start.kennzahlen.gewaehrleistung.replace("60", String(warn)) },
        ]}
        aktionen={s.schreiben ? <MeldenKnopf katalog={katalog} telefonIstErstreaktion={!!Number(d.einst.telefon_ist_erstreaktion)} /> : null}
        unternav={
          chips.length ? (
            <div className="bo-svc-heute" aria-label={T.start.heute} data-testid="heute-leiste">
              {chips.map((c) => (
                <Chip key={c.text} {...c}>
                  {c.text}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="inline-flex items-center gap-2 text-[14px] text-bo-text-soft" data-testid="heute-leiste">
              <Icon name="Check" className="size-4 text-bo-salbei-text" />
              {T.start.heuteLeer}
            </p>
          )
        }
      />

      {d.nieFaelle ? (
        <Leer titel="Service" text={T.start.nieFaelle} aktion={s.schreiben ? <MeldenKnopf katalog={katalog} /> : null} testid="service-leer" />
      ) : (
        <Bento>
          <Kachel
            className="md:col-span-8"
            titel={T.start.jetztDran}
            unter={offenAnzahl ? `${offenAnzahl} offene Fälle · ${T.start.jetztDranUnter.toLowerCase()}` : T.start.jetztDranUnter}
            testid="kachel-jetzt-dran"
          >
            {d.fehler.faelle ? (
              <Fehler code="unavailable" kompakt />
            ) : zeilen.length ? (
              <JetztDran zeilen={zeilen} mehr={{ text: T.start.alleOffen(offenAnzahl), href: "/service/faelle" }} />
            ) : (
              <Leer art="erledigt" groesse="karte" text={T.start.allesErledigt} />
            )}
          </Kachel>

          <div className="grid min-w-0 grid-cols-2 content-start gap-(--bo-bento-gap) md:col-span-4">
            <Akzentkachel ton="cognac" titel={T.start.akzentReaktion} text={T.start.akzentReaktionText} zahl={h.reaktion} href="/service/faelle?reiter=reaktion" testid="akzent-reaktion" />
            <Akzentkachel ton="salbei" titel={T.start.akzentFaelle} text={T.start.akzentFaelleText} zahl={k.offen ?? 0} href="/service/faelle" testid="akzent-offen" />
            <Kachel className="col-span-2" titel={T.start.einsaetzeHeute(d.einsaetzeHeute.length)} unter={s.techniker ? "Eigene Einsätze" : "Alle Techniker"} werkzeuge={<Knopf size="s" variant="ghost" href="/service/einsaetze" iconRechts="ArrowRight">Woche</Knopf>} testid="kachel-einsaetze-heute">
              {d.einsaetzeHeute.length ? (
                <ul className="bo-svc-zeilen -mx-3">
                  {d.einsaetzeHeute.map((e) => (
                    <li key={e.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                      <span className="min-w-0">
                        <Link href={`/service/einsaetze/${encodeURIComponent(e.name)}`} className="bo-svc-zeile__link">
                          <span className="bo-svc-zeile__titel truncate">{e.kunde_name || e.titel}</span>
                        </Link>
                        <span className="bo-svc-zeile__unter">{[e.art, e.ort].filter(Boolean).join(" · ")}</span>
                        <span className="mt-1.5 flex items-center gap-2 text-[13px] text-bo-text-soft">
                          <Avatar name={e.technikerName} groesse={20} ring={false} dekorativ />
                          <span className="truncate">{e.technikerName}</span>
                        </span>
                      </span>
                      <span className="bo-svc-zeile__rechts flex-col items-end gap-1.5">
                        <span className="bo-svc-zeile__zeit">{spanne(e.zeit_von, e.zeit_bis)}</span>
                        <StatusBadge wert={e.status} text={EINSATZ_STATUS[e.status]?.text} ton={EINSATZ_STATUS[e.status]?.ton} groesse="xs" />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-bo-text-soft">{T.start.einsaetzeHeuteLeer}</p>
              )}
            </Kachel>
          </div>

          <Kennzahl className="md:col-span-3" titel={T.start.kennzahlen.gewaehrleistung.replace("60", String(warn))} wert={k.gewaehrleistung60} href="/service/faelle?reiter=gewaehrleistung" />
          <Kennzahl className="md:col-span-3" titel={T.start.kennzahlen.unterMindest} wert={k.unterMindest} href="/service/ersatzteile?reiter=unter" />
          {s.leitung || s.gf ? (
            <Kennzahl className="md:col-span-3" titel={T.start.kennzahlen.regressOffen} wert={k.regressOffen} format="cent-rund" href="/service/regress" />
          ) : (
            <Kennzahl className="md:col-span-3" titel={T.start.kennzahlen.unbestaetigt} wert={k.unbestaetigt} href="/service/einsaetze?ansicht=liste&reiter=unbestaetigt" />
          )}
          <Kennzahl className="md:col-span-3" titel={T.start.kennzahlen.erwartet} wert={k.erwartet} href="/service/ersatzteile?ansicht=bestellungen&reiter=erwartet" />

          <Kachel className="md:col-span-5" titel={T.start.gewaehrleistung14} unter="Offene Fälle, Frist nach Übergabe" testid="kachel-gewaehrleistung">
            {d.gewaehrleistung14.length ? (
              <ul className="bo-svc-zeilen -mx-3">
                {d.gewaehrleistung14.map((f) => (
                  <li key={f.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                    <span className="min-w-0">
                      <Link href={`/service/faelle/${encodeURIComponent(f.name)}`} className="bo-svc-zeile__link">
                        <span className="bo-svc-zeile__titel truncate">{f.kunde_name}</span>
                      </Link>
                      <span className="bo-svc-zeile__unter">{f.name}</span>
                    </span>
                    <span className="bo-svc-zeile__rechts">
                      <span className="bo-svc-gwl" data-ton="warn">
                        bis {tagMonat(f.gewaehrleistung_bis)} · {f.tage === 0 ? "heute" : `noch ${f.tage} Tage`}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-bo-text-soft">{T.start.gewaehrleistung14Leer}</p>
            )}
          </Kachel>

          {d.charts ? (
            <>
              <Balken className="md:col-span-7" titel={T.start.charts.jeMonat} untertitel="Gemeldet, letzte 12 Monate" punkte={d.charts.jeMonat} hervorheben={10} laufend="letzter" einblenden />
              <Donut className="md:col-span-6" titel={T.start.charts.nachArt} untertitel="Letzte 12 Monate" teile={d.charts.nachArt} einblenden />
              <Balken className="md:col-span-6" titel={T.start.charts.nachBereich} untertitel="Fehlerbereich, letzte 12 Monate" punkte={d.charts.nachBereich} einblenden />
            </>
          ) : (
            <Kachel className="md:col-span-7" titel={T.start.berichte} unter="Reklamationsquote, Fehlercodes, Regress, Kosten, Fristen" href="/service/berichte/quote">
              <p className="max-w-[52ch] text-[14px] leading-5 text-bo-text-soft">Auswertungen je Marke, Fehlercode und Zeitraum. Beträge netto.</p>
            </Kachel>
          )}
        </Bento>
      )}
    </Shell>
  );
}
