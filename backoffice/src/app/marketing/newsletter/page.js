// /marketing/newsletter – Ausgaben (10-konzept-marketing § 2.2, T2, nur Liste – kein Kanban, E7).
// Spalten: Ausgabe (Monat + Betreff + Nummer), Versand, Empfänger, Zugestellt/Fehler, Status. Endzustände unten.
// Filter in der URL (Status-Chips, Jahr, Suche). „+ Neue Ausgabe“ legt mit einem Klick an.
import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import NeueAusgabe from "@/components/Backoffice/Marketing/NeueAusgabe";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { ausgabenListe, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { ALLG, ERSTBESUCH, NEWSLETTER, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { kurzDatum, langDatum, monatAusSlug, naechsteKennung } from "@/lib/backoffice/marketing/regeln";
import { zahl } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Newsletter") };

export default async function NewsletterListe({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/newsletter", doctype: "PH Newsletter Ausgabe" });
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const { zeilen, zaehler, gesamt, jahre, slugs } = await ausgabenListe(ctx.client, { status, jahr: params.jahr, q: params.q });
  const gefiltert = status.length || params.jahr || params.q;
  const neueKennung = naechsteKennung(slugs, new Date());
  const vorhanden = ctx.leitung || ctx.team;
  const basis = (s) => `/marketing/newsletter?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(params.jahr ? { jahr: params.jahr } : {}), ...(params.q ? { q: params.q } : {}) })}`;

  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.newsletter, route: "/marketing/newsletter" }}>
      <Seitenkopf
        titel={NEWSLETTER.titel}
        untertitel={NEWSLETTER.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: NEWSLETTER.titel }]}
        kennzahlen={[
          { wert: zaehler.Freigabe || 0, text: STATUS_TEXT.ausgabe.Freigabe },
          { wert: zaehler.Versendet || 0, text: "Versendet" },
        ]}
        aktionen={vorhanden ? <NeueAusgabe auto={params.neu === "ausgabe"} gibtEs={null} /> : null}
      />
      <div className="bo-mar-werkzeuge">
        <StatusChips
          aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"}
          optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: basis("") }, ...CHIP_REIHE.ausgabe.map((s) => ({ wert: s, titel: STATUS_TEXT.ausgabe[s], anzahl: zaehler[s] || 0, href: basis(s) }))]}
        />
        <FilterForm
          basis="/marketing/newsletter"
          params={params}
          behalten={["status"]}
          suche={{ name: "q", platzhalter: "Monat, Betreff, Nummer" }}
          auswahl={[{ name: "jahr", label: "Jahr", alle: "Alle Jahre", optionen: jahre.map((j) => ({ wert: j, titel: j })) }]}
          zuruecksetzen="/marketing/newsletter"
        />
      </div>

      {gesamt === 0 ? (
        <Leer art="leer" titel="Noch keine Ausgabe" text={NEWSLETTER.leer} aktion={vorhanden ? <Knopf variant="primary" icon="Plus" href="/marketing/newsletter?neu=ausgabe">{NEWSLETTER.neueAusgabe}</Knopf> : undefined} testid="newsletter-leer" />
      ) : zeilen.length === 0 ? (
        <Leer art="gefiltert" text={status.length ? NEWSLETTER.gefiltert(status.map((s) => STATUS_TEXT.ausgabe[s]).join(", ")) : "Keine Ausgabe mit diesen Filtern."} zuruecksetzenHref="/marketing/newsletter" testid="newsletter-gefiltert" />
      ) : (
        <ListeKachel label={NEWSLETTER.titel} testid="newsletter-liste" kopf={<span className="tabular-nums">{NEWSLETTER.anzahl(zeilen.length)}</span>} fuss={<span>Nächste freie Kennung: {monatAusSlug(neueKennung)}</span>}>
          <div className="bo-mar-tabelle-huelle overflow-x-auto">
            <table className="bo-mar-tabelle">
              <thead>
                <tr>
                  <th scope="col">{NEWSLETTER.spalten.ausgabe}</th>
                  <th scope="col">{NEWSLETTER.spalten.versand}</th>
                  <th scope="col" className="r">{NEWSLETTER.spalten.empfaenger}</th>
                  <th scope="col" className="r">{NEWSLETTER.spalten.zustellung}</th>
                  <th scope="col">{NEWSLETTER.spalten.status}</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((a) => {
                  const versand = a.versendet_am || a.versand_geplant;
                  return (
                    <tr key={a.name} data-testid="ausgabe-zeile">
                      <td>
                        <Link href={`/marketing/newsletter/${encodeURIComponent(a.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">
                          {monatAusSlug(a.slug)}
                        </Link>
                        <p className="bo-mar-unter line-clamp-1">
                          {a.betreff && a.betreff !== "(ohne Betreff)" ? `„${a.betreff}“` : "Betreff fehlt"} · <span className="bo-mar-mono">{a.name}</span>
                        </p>
                      </td>
                      <td className="whitespace-nowrap" title={versand ? langDatum(versand) : undefined}>
                        {versand ? kurzDatum(versand, { zeit: true }) : <span className="bo-mar-unter">–</span>}
                      </td>
                      <td className="r bo-mar-zahl">{a.empfaenger_anzahl ? zahl(a.empfaenger_anzahl) : "–"}</td>
                      <td className="r bo-mar-zahl">{["Versendet", "Wird versendet"].includes(a.status) ? `${zahl(a.gesendet || 0)} / ${zahl(a.fehler || 0)}` : "–"}</td>
                      <td>
                        <Status gruppe="ausgabe" wert={a.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="bo-mar-karten" data-testid="karten-liste">
            {zeilen.map((a) => (
              <li key={a.name} className="bo-mar-karte-zeile">
                <div className="min-w-0 flex-1">
                  <Link href={`/marketing/newsletter/${encodeURIComponent(a.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">
                    {monatAusSlug(a.slug)}
                  </Link>
                  <p className="bo-mar-unter line-clamp-1">{a.betreff || "–"}</p>
                  <p className="bo-mar-klein">{a.versendet_am || a.versand_geplant ? kurzDatum(a.versendet_am || a.versand_geplant, { zeit: true }) : ALLG.keineWerte}</p>
                </div>
                <Status gruppe="ausgabe" wert={a.status} />
              </li>
            ))}
          </ul>
        </ListeKachel>
      )}
    </Rahmen>
  );
}
