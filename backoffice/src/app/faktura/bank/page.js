import Link from "next/link";
import { redirect } from "next/navigation";
import { fakturaKontext, alle } from "@/lib/backoffice/faktura/daten";
import { listenModell, paramsAus } from "@/lib/backoffice/faktura/listen";
import { BANK_REITER, BANK_SPALTEN, bankZeile } from "@/lib/backoffice/faktura/zeilen";
import { RE_OFFEN } from "@/lib/backoffice/faktura/status";
import { REITER, LEER, BANK, FILTER } from "@/lib/backoffice/faktura/texte";
import { cent, datum } from "@/lib/backoffice/format";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import FakturaListe from "@/components/Backoffice/Faktura/FakturaListe";
import KopfAktion from "@/components/Backoffice/Faktura/KopfAktionen";

export const metadata = { title: "Bank · Faktura" };
export const dynamic = "force-dynamic";

// /faktura/bank (T2, nur Leitung; StB/GF lesend) – 10-konzept-faktura § 3.5. „Zuordnen“ nur bei „Sicher“ als
// verzögerter Commit (8 s, F-33), „Prüfen“ öffnet den Peek/Dialog, Enter bucht nie.
export default async function Bank({ searchParams }) {
  const params = paramsAus(await searchParams);
  const ctx = await fakturaKontext("/faktura/bank");
  const { client, rolle, schalter } = ctx;
  if (!rolle.darfBank) redirect("/kein-zugriff?bereich=faktura&aktion=bank");
  const [umsaetze, rechnungen, ers, konten] = await Promise.all([
    alle(client, "PH Bankumsatz"),
    alle(client, "PH Rechnung", { fields: ["name", "kunde_name", "offen_cent", "zahlbar_cent", "brutto_cent", "faellig", "mahnstufe", "status", "docstatus"], filters: [["docstatus", "=", 1]] }),
    alle(client, "PH Eingangsrechnung", { fields: ["name", "lieferant_name", "zahlbetrag_cent", "brutto_cent", "faellig", "status"] }),
    alle(client, "PH Bankkonto", { fields: ["name", "iban", "saldo_cent", "letzter_import", "waehrung"] }),
  ]);
  const belege = Object.fromEntries([...rechnungen, ...ers.map((e) => ({ ...e, kunde_name: e.lieferant_name, offen_cent: e.zahlbetrag_cent }))].map((b) => [b.name, b]));
  const offeneBelege = [
    ...rechnungen.filter((r) => RE_OFFEN.includes(r.status) && Number(r.offen_cent) > 0).map((r) => ({ doctype: "PH Rechnung", name: r.name, kunde: r.kunde_name, offen_cent: Number(r.offen_cent), faellig: r.faellig })),
    ...ers.filter((e) => e.status === "Freigegeben").map((e) => ({ doctype: "PH Eingangsrechnung", name: e.name, kunde: e.lieferant_name, offen_cent: Number(e.zahlbetrag_cent || e.brutto_cent), faellig: e.faellig })),
  ];
  const m = listenModell({
    daten: params.richtung ? umsaetze.filter((u) => u.richtung === params.richtung) : umsaetze,
    reiter: REITER.bank,
    regeln: BANK_REITER,
    params,
    standard: "offen",
    rolle,
    zaehlerFuer: ["offen", "teilweise"],
    zeile: (b) => bankZeile(b, { rolle, belege }),
    suchFelder: (b) => [b.auftraggeber, b.verwendungszweck, b.vorschlag_beleg, b.betrag_cent, b.iban_gegen],
    datumFeld: "buchungsdatum",
    sortFeld: "buchungsdatum",
    richtung: "desc",
  });
  const offen = umsaetze.filter((u) => ["Offen", "Teilweise"].includes(u.status));
  const ein = offen.filter((u) => Number(u.betrag_cent) > 0).reduce((s, u) => s + Number(u.betrag_cent), 0);
  const aus = offen.filter((u) => Number(u.betrag_cent) < 0).reduce((s, u) => s + Number(u.betrag_cent), 0);
  const konto = konten[0];
  return (
    <FakturaSeite
      ctx={ctx}
      titel="Bank"
      ueber={konto ? `${konto.name}${konto.iban ? ` · … ${konto.iban.replace(/\s/g, "").slice(-4)}` : ""}` : undefined}
      route="/faktura/bank"
      offeneBelege={offeneBelege}
      kennzahlen={konto ? [{ wert: cent(konto.saldo_cent), text: `Saldo lt. Auszug ${datum(konto.letzter_import)}` }] : []}
      aktionen={rolle.leitung ? <KopfAktion art="import" primaer daten={{ konten, autoErlaubt: schalter.zuordnungLoesen }} /> : null}
    >
      <FakturaListe
        liste="bank"
        spalten={BANK_SPALTEN}
        zeilen={m.zeilen}
        reiter={m.reiter}
        aktiverReiter={m.aktiv}
        basis="/faktura/bank"
        params={params}
        seite={m.seite}
        seiten={m.seiten}
        gesamt={m.gesamt}
        summe={BANK.summe(offen.length, cent(ein), `−${cent(Math.abs(aus))}`)}
        massen={rolle.leitung ? [{ id: "sicher-zuordnen", titel: "Sichere zuordnen" }] : []}
        darfCsv={rolle.darfCsv}
        suchHinweis="Name, Zweck, Betrag"
        leer={m.aktiv === "offen" && umsaetze.length ? { art: "erledigt", titel: LEER.bankErledigt } : { titel: LEER.bank.titel, text: LEER.bank.text, aktion: rolle.leitung ? { titel: LEER.bank.aktion, href: "/faktura/bank?panel=import" } : null }}
        statusOptionen={[]}
        testid="bank-liste"
      />
      <p className="mt-3 text-[13px] text-bo-text-soft">
        {FILTER.richtung}:{" "}
        <Link className="font-medium hover:underline" href="/faktura/bank?richtung=Eingang">
          {FILTER.eingang}
        </Link>{" "}
        ·{" "}
        <Link className="font-medium hover:underline" href="/faktura/bank?richtung=Ausgang">
          {FILTER.ausgang}
        </Link>{" "}
        ·{" "}
        <Link className="font-medium hover:underline" href="/faktura/bank/importe">
          {BANK.importe}
        </Link>
      </p>
    </FakturaSeite>
  );
}
