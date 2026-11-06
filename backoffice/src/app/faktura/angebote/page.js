import { fakturaKontext, alle, kontaktAuswahl, projektAuswahl } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { ANGEBOT_REITER, ANGEBOT_SPALTEN, angebotZeile } from "@/lib/backoffice/faktura/zeilen";
import { STATUS_WERTE, tonTabelle } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, LISTE, wertLabel } from "@/lib/backoffice/faktura/texte";
import { cent } from "@/lib/backoffice/format";
import Segment from "@/components/Backoffice/Segment";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";
import { AngebotKanban } from "@/components/Backoffice/Faktura/Kanbans";

export const metadata = { title: "Angebote · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/angebote (T2, ?ansicht=kanban T3) – 10-konzept-faktura § 3.2.
export default async function Angebote({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/angebote");
  const { client, rolle, heute, session } = ctx;
  const [daten, kontakte, projekte, bedingungen] = await Promise.all([alle(client, "PH Angebot"), rolle.schreibt ? kontaktAuswahl(client) : [], rolle.schreibt ? projektAuswahl(client) : [], alle(client, "PH Zahlungsbedingung", { fields: ["name", "titel", "standard"] })]);
  const kanban = params.ansicht === "kanban";
  const m = listenModell({
    daten,
    reiter: REITER.angebote,
    regeln: ANGEBOT_REITER,
    params,
    standard: "offen",
    rolle,
    extra: { heute, user: session.user },
    zeile: (a) => angebotZeile(a, { heute, rolle }),
    suchFelder: (a) => [a.name, a.titel, a.kunde_name, a.ort, a.projekt, a.brutto_cent],
    sortFeld: (r) => (r === "offen" || r === "bald" ? "gueltig_bis" : "datum"),
    richtung: (r) => (r === "offen" || r === "bald" ? "asc" : "desc"),
  });
  const summe = m.alleGefiltert.reduce((s, a) => s + (Number(a.brutto_cent) || 0), 0);
  const ansicht = (
    <Segment
      label="Ansicht"
      aktiv={kanban ? "kanban" : "liste"}
      optionen={[
        { wert: "liste", titel: LISTE.ansichtListe, href: "/faktura/angebote", icon: "Rows3" },
        { wert: "kanban", titel: LISTE.ansichtKanban, href: "/faktura/angebote?ansicht=kanban", icon: "Columns3" },
      ]}
    />
  );
  const spalten = ["Entwurf", "Gesendet", "Angenommen", "Abgelehnt"].map((s) => ({ status: s, karten: daten.filter((a) => a.status === s).slice(0, 60) }));
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Angebote"
      aktionen={
        <>
          {ansicht}
          {rolle.schreibt && <KopfAktion art="angebot" primaer daten={{ kontakte, projekte, bedingungen }} />}
        </>
      }
    >
      {kanban ? (
        <AngebotKanban spalten={spalten} toene={tonTabelle("PH Angebot")} />
      ) : (
        <FakturaListe
          liste="angebote"
          spalten={ANGEBOT_SPALTEN}
          zeilen={m.zeilen}
          reiter={m.reiter}
          aktiverReiter={m.aktiv}
          basis="/faktura/angebote"
          params={params}
          seite={m.seite}
          seiten={m.seiten}
          gesamt={m.gesamt}
          summe={`${m.zeilen.length} von ${m.gesamt} · Summe gefiltert ${cent(summe)}`}
          statusOptionen={STATUS_WERTE["PH Angebot"].map((s) => ({ wert: s, text: wertLabel(s) }))}
          darfCsv={rolle.darfCsv}
          leer={m.aktiv === "bald" ? { art: "erledigt", titel: LEER.angeboteBald } : { titel: LEER.angebote.titel, text: LEER.angebote.text, aktion: rolle.schreibt ? { titel: LEER.angebote.aktion, href: "/faktura/angebote?panel=angebot" } : null }}
          testid="angebote-liste"
        />
      )}
    </FakturaSeite>
  );
}
