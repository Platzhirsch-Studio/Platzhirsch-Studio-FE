// /marketing – Übersicht (10-konzept-marketing § 2.1, T1). Lounge-Bento: Seitenkopf mit leichten Zahlen,
// „Zu tun“ zuerst (Leitung: Freigaben), höchstens zwei Akzentkacheln, Karten Nächste Ausgabe · Diese Woche ·
// Nächstes Event, „Mehr Zahlen“ eingeklappt. Jede Kachel zeichnet ihren Fehler selbst (Q-E1).
import { Suspense } from "react";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import Aufklapper from "@/components/Backoffice/Marketing/Aufklapper";
import { NeuMenue } from "@/components/Backoffice/Marketing/Kleinteile";
import { DieseWocheKarte, ErsteSchritteKachel, MehrZahlenInhalt, NaechsteAusgabeKarte, NaechstesEventKarte, ZuTunKachel } from "@/components/Backoffice/Marketing/Start";
import { ersteSchritte, marketingKontext, mehrZahlen, sicher, startKarten, startKennzahlen, zuTun } from "@/lib/backoffice/marketing/daten";
import { ERSTBESUCH, START, seitentitel } from "@/lib/backoffice/marketing/texte";
import { zahl } from "@/lib/backoffice/format";
import { isoTag } from "@/lib/backoffice/marketing/regeln";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Übersicht") };

export default async function MarketingStart() {
  const ctx = await marketingKontext({ pfad: "/marketing", doctype: "PH Newsletter Ausgabe" });
  const { client, leitung, team } = ctx;
  const [zt, k, karten, erst, wartend] = await Promise.all([
    sicher(zuTun(ctx), []),
    startKennzahlen(client),
    sicher(startKarten(client), null),
    ersteSchritte(client),
    sicher(client.count("PH Newsletter Ausgabe", { filters: [["status", "=", "Freigabe"]] }), 0),
  ]);
  const heuteGeplant = karten.ok ? karten.wert.woche.filter((w) => w.art === "social" && w.status === "Geplant" && w.datum === isoTag(new Date())).length : 0;
  const neu = [
    team && { titel: START.neuMenue.ausgabe, href: "/marketing/newsletter?neu=ausgabe", icon: "Mail" },
    team && { titel: START.neuMenue.beitrag, href: "/marketing/social?neu=beitrag", icon: "Share2" },
    leitung && { titel: START.neuMenue.event, href: "/marketing/events?neu=event", icon: "Ticket" },
    team && { titel: START.neuMenue.kampagne, href: "/marketing/kampagnen?neu=kampagne", icon: "Megaphone" },
    team && { titel: START.neuMenue.anmeldung, href: "/marketing/empfaenger?dialog=anmeldung", icon: "UserPlus" },
    team && { titel: START.neuMenue.einwilligung, href: "/marketing/empfaenger?dialog=einwilligung", icon: "Shield" },
    team && { titel: START.neuMenue.empfehlung, href: "/marketing/empfehlungen?neu=code", icon: "Gift" },
  ].filter(Boolean);
  const ev = k.event;

  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.start, route: "/marketing" }}>
      <Seitenkopf
        titel={START.titel}
        untertitel={START.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: START.titel }]}
        kennzahlen={[
          { wert: k.aktiv != null ? zahl(k.aktiv) : "–", text: k.vormonat != null ? `${START.kennzahlen.abos} · ${START.vormonat(k.vormonat)}` : START.kennzahlen.abos, testid: "kz-abos" },
          { wert: k.unbestaetigt != null ? zahl(k.unbestaetigt) : "–", text: START.kennzahlen.unbestaetigt, testid: "kz-unbestaetigt" },
          { wert: ev ? (ev.kapazitaet ? `${ev.belegt} / ${ev.kapazitaet}` : ev.belegt) : "–", text: ev ? `${START.kennzahlen.anmeldungen} · ${ev.titel}` : START.kennzahlen.anmeldungen, testid: "kz-event" },
        ]}
        aktionen={<NeuMenue titel={START.neu} eintraege={neu} />}
      />
      <Bento>
        <div className="flex min-w-0 flex-col gap-(--bo-bento-gap) md:col-span-12 xl:col-span-7">
          {erst.zeigen ? <ErsteSchritteKachel stand={erst} /> : zt.ok ? <ZuTunKachel zeilen={zt.wert} leitung={leitung} /> : <Kachel titel={START.zuTun}><p className="bo-mar-unter">Konnte nicht geladen werden – Seite neu laden.</p></Kachel>}
          {karten.ok ? <NaechsteAusgabeKarte ausgabe={karten.wert.ausgabe} naechsterMonat={karten.wert.naechsterMonat} darfAnlegen={team} /> : <Kachel titel={START.naechsteAusgabe}><p className="bo-mar-unter">Konnte nicht geladen werden.</p></Kachel>}
        </div>
        <div className="grid min-w-0 grid-cols-2 content-start gap-(--bo-bento-gap) md:col-span-12 xl:col-span-5">
          {leitung ? (
            <Akzentkachel ton="cognac" className="col-span-2 sm:col-span-1" titel={START.akzentFreigabe} text={START.akzentFreigabeText} zahl={wartend.ok ? wartend.wert + (zt.ok ? zt.wert.filter((z) => z.id.startsWith("soc-")).length : 0) : 0} href="/marketing/newsletter?status=Freigabe" testid="akzent-freigabe" />
          ) : (
            <Akzentkachel ton="cognac" className="col-span-2 sm:col-span-1" titel={START.kennzahlen.beitraege} text="Geplante Beiträge im Redaktionsplan dieser Woche." zahl={k.beitraege ?? 0} href="/marketing/social" testid="akzent-beitraege" />
          )}
          <Akzentkachel ton="salbei" className="col-span-2 sm:col-span-1" titel={START.akzentBeitraege} text={START.akzentBeitraegeText} zahl={heuteGeplant} href="/marketing/social?ansicht=liste&status=Geplant" testid="akzent-heute" />
          {karten.ok && <DieseWocheKarte className="col-span-2" eintraege={karten.wert.woche} />}
        </div>
        {karten.ok && <NaechstesEventKarte className="md:col-span-12" event={karten.wert.event} darfAnlegen={leitung} />}
      </Bento>
      <div className="mt-(--bo-bento-gap)">
        <Aufklapper schluessel="mehr-zahlen" titel={START.mehrZahlen} unter={START.mehrZahlenUnter} testid="mehr-zahlen-aufklapper">
          <Suspense fallback={<p className="bo-mar-unter">Lädt …</p>}>
            <MehrZahlenLaden client={client} />
          </Suspense>
        </Aufklapper>
      </div>
    </Rahmen>
  );
}

async function MehrZahlenLaden({ client }) {
  const r = await sicher(mehrZahlen(client), null);
  return <MehrZahlenInhalt daten={r.wert} />;
}
