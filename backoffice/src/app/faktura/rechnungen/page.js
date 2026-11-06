import { fakturaKontext, alle, mahnbare } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { RECHNUNG_REITER, RECHNUNG_SPALTEN, OP_SPALTEN, rechnungZeile, opFilter } from "@/lib/backoffice/faktura/zeilen";
import { altersband } from "@/lib/backoffice/faktura/betraege";
import { STATUS_WERTE } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, LISTE, wertLabel } from "@/lib/backoffice/faktura/texte";
import { cent } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";
import { AltersBand } from "@/components/Backoffice/Faktura/Bausteine";

export const metadata = { title: "Rechnungen · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/rechnungen (T2) mit Reiter „Offene Posten“ (10-konzept-faktura § 3.4).
export default async function Rechnungen({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/rechnungen");
  const { client, rolle, heute, schalter } = ctx;
  const daten = await alle(client, "PH Rechnung");
  const mahn = await mahnbare(client, heute, daten);
  const op = params.r === "offene-posten";
  const m = listenModell({
    daten: op && params.alter ? daten.filter((r) => opFilter(r, params.alter, heute)) : daten,
    reiter: REITER.rechnungen,
    regeln: RECHNUNG_REITER,
    params,
    standard: "offen",
    rolle,
    extra: { heute },
    zaehlerFuer: ["entwuerfe"],
    zeile: (r) => rechnungZeile(r, { heute, rolle }),
    suchFelder: (r) => [r.name, r.nummer, r.kunde_name, r.auftrag, r.ort, r.offen_cent, r.brutto_cent],
    sortFeld: (r) => (["offen", "ueberfaellig", "offene-posten"].includes(r) ? "faellig" : "datum"),
    richtung: (r) => (["offen", "ueberfaellig", "offene-posten"].includes(r) ? "asc" : "desc"),
  });
  const offenGesamt = m.alleGefiltert.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0);
  const zahlbar = m.alleGefiltert.reduce((s, r) => s + (Number(r.zahlbar_cent ?? r.brutto_cent) || 0), 0);
  const opDaten = daten.filter((r) => RECHNUNG_REITER["offene-posten"](r));
  const ueberfaellig = opDaten.filter((r) => RECHNUNG_REITER.ueberfaellig(r, heute)).reduce((s, r) => s + (Number(r.offen_cent) || 0), 0);
  const mahnAnzahl = mahn.filter((r) => r.waehlbar).length;

  const opKopf = op ? (
    <div className="flex flex-col gap-4 px-3 pb-4 pt-1" data-testid="op-kopf">
      <p className="text-[15px] tabular-nums">
        Offen gesamt <strong className="font-semibold">{cent(opDaten.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0))}</strong> · davon überfällig <strong className="font-semibold">{cent(ueberfaellig)}</strong> · {opDaten.length} Belege
      </p>
      <AltersBand segmente={altersband(opDaten, heute)} aktiv={params.alter} />
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-bo-text-soft">
        <span className="bo-tip" data-tip={schalter.stichtag ? undefined : LISTE.stichtagFolgt} aria-label={LISTE.stichtagFolgt}>
          <span className="inline-flex h-8 items-center rounded-pill bg-bo-fill px-3 text-bo-text-faint" aria-disabled={!schalter.stichtag}>
            {LISTE.stichtag}: {LISTE.standHeute(heute.split("-").reverse().join("."))}
          </span>
        </span>
        {!schalter.stichtag && <span>{LISTE.stichtagFolgt}</span>}
      </p>
    </div>
  ) : null;

  return (
    <FakturaSeite ctx={ctx} titel="Rechnungen" route="/faktura/rechnungen" mahnvorschlag={mahn} aktionen={rolle.schreibt ? <KopfAktion art="mahnen" anzahl={mahnAnzahl} primaer /> : null}>
      <FakturaListe
        liste="rechnungen"
        spalten={op ? OP_SPALTEN : RECHNUNG_SPALTEN}
        zeilen={m.zeilen}
        reiter={m.reiter}
        aktiverReiter={m.aktiv}
        basis="/faktura/rechnungen"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        summe={`${m.zeilen.length} von ${m.gesamt} · Zahlbar ${cent(zahlbar)} · Offen ${cent(offenGesamt)}`}
        statusOptionen={STATUS_WERTE["PH Rechnung"].map((s) => ({ wert: s, text: wertLabel(s) }))}
        massen={rolle.schreibt ? [{ id: "mahnen", titel: "Mahnen" }] : []}
        darfCsv={rolle.darfCsv}
        kopf={opKopf}
        leer={m.aktiv === "ueberfaellig" ? { art: "erledigt", titel: LEER.ueberfaellig } : m.aktiv === "offene-posten" ? { art: "erledigt", titel: LEER.offenePosten } : { titel: LEER.rechnungen.titel, text: LEER.rechnungen.text, aktion: { titel: LEER.rechnungen.aktion, href: "/faktura/auftraege" } }}
        testid="rechnungen-liste"
      />
    </FakturaSeite>
  );
}
