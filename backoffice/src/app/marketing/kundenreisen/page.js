// /marketing/kundenreisen – Kundenreisen (10-konzept-marketing § 2.6, T2, unter „Mehr“; Leitung bearbeitet, Mitarbeiter lesend).
// Zustandszeile „Werbung heute …“; 0 Datensätze ist ein Fehlerzustand (die App liefert sieben mit).
import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { ReiseDuplizierenKnopf } from "@/components/Backoffice/Marketing/RegelEditoren";
import { fensterAus, marketingKontext, reisenListe } from "@/lib/backoffice/marketing/daten";
import { reiseStatus } from "@/lib/backoffice/marketing/status";
import { ausloeserSatz, grundlagen, kurzDatum, pruefeReise, werbefensterSatz } from "@/lib/backoffice/marketing/regeln";
import { ALLG, GRUNDLAGE_KURZ, REISEN, STATUS_TEXT, regelSatz, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Kundenreisen") };

const FELD = { lieferdatum: "Lieferung", kaufdatum: "Kauf", montage: "Montage" };

export default async function ReisenSeite({ searchParams }) {
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: "/marketing/kundenreisen", doctype: "PH Kundenreise" });
  const status = sp.status ? String(sp.status).split(",") : [];
  const { zeilen, vorlagen, zaehler, gesamt } = await reisenListe(ctx.client, { status });
  const automatik = !!Number(ctx.einst.automatik_aktiv || 0);
  const fenster = werbefensterSatz(new Date(), fensterAus(ctx.einst));
  const vorlagenListe = await ctx.client.getList("PH Mail Vorlage", { fields: ["name", "betreff", "html"], filters: [["art", "=", "Kundenreise"]], limit: 50 }).catch(() => []);
  return (
    <Rahmen ctx={ctx} band={automatik ? null : { ton: "info", inhalt: ALLG.automatikAus }}>
      <Seitenkopf
        titel={REISEN.titel}
        untertitel={REISEN.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: REISEN.titel }]}
        aktionen={<ReiseDuplizierenKnopf reisen={zeilen.map((r) => ({ name: r.name, titel: r.titel }))} leitung={ctx.leitung} vorlagen={vorlagenListe} />}
      />
      <p className="bo-mar-zustand" data-testid="werbefenster">
        <span className={fenster.ok ? "bo-mar-ok" : "bo-mar-warn"}>{fenster.satz}</span>
        <span>
          · {REISEN.automatik(automatik)}{" "}
          {ctx.leitung && (
            <Link className="bo-mar-link underline" href="/marketing/einstellungen">
              Einstellungen
            </Link>
          )}
        </span>
      </p>
      <div className="bo-mar-werkzeuge">
        <StatusChips aktiv={status.length === 1 ? status[0] : "alle"} optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: "/marketing/kundenreisen" }, ...["Aktiv", "Pausiert", "Entwurf"].map((s) => ({ wert: s, titel: STATUS_TEXT.reise[s], anzahl: zaehler[s] || 0, href: `/marketing/kundenreisen?status=${s}` }))]} />
      </div>
      {gesamt === 0 ? (
        <Fehler code="unavailable" titel="Kundenreisen fehlen" message={REISEN.fehltApp} />
      ) : zeilen.length === 0 ? (
        <Leer art="gefiltert" text={REISEN.gefiltert} zuruecksetzenHref="/marketing/kundenreisen" />
      ) : (
        <ListeKachel label={REISEN.titel} testid="reisen-liste">
          <div className="bo-mar-tabelle-huelle overflow-x-auto">
            <table className="bo-mar-tabelle">
              <thead>
                <tr>
                  <th scope="col">{REISEN.spalten.reise}</th>
                  <th scope="col">{REISEN.spalten.ausloeser}</th>
                  <th scope="col">{REISEN.spalten.grundlage}</th>
                  <th scope="col">{REISEN.spalten.regeln}</th>
                  <th scope="col">{REISEN.spalten.status}</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((r) => {
                  const f = pruefeReise(r, vorlagen.get(r.vorlage) || "");
                  const kanzlei = Number(r.werbung) && !Number(ctx.einst.kanzlei_fusszeilen_freigegeben || 0);
                  const st = reiseStatus(r, { automatik });
                  return (
                    <tr key={r.name}>
                      <td>
                        <Link href={`/marketing/kundenreisen/${encodeURIComponent(r.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{r.titel}</Link>
                        <p className="bo-mar-unter">{REISEN.gesendet(r.gesendet_gesamt || 0, r.letzter_versand ? kurzDatum(r.letzter_versand) : null)}</p>
                      </td>
                      <td className="bo-mar-unter">{(r.trigger || []).map((t) => ausloeserSatz(t, { feldText: FELD })).join(" · ") || "–"}</td>
                      <td>{grundlagen(r).map((g) => GRUNDLAGE_KURZ[g]).join(" · ") || "–"}</td>
                      <td>{f.length ? <span className="bo-mar-warn" title={f.map(regelSatz).join(" ")}>{REISEN.fehlerZahl(f.length)}</span> : kanzlei ? <span className="bo-mar-warn">{REISEN.kanzlei}</span> : <span className="bo-mar-ok">geprüft</span>}</td>
                      <td>
                        <Status gruppe="reise" wert={st} />
                        {st === "AktivWartet" && ctx.leitung && (
                          <p>
                            <Link className="bo-mar-link bo-mar-klein underline" href="/marketing/einstellungen">{REISEN.aktivWartet}</Link>
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="bo-mar-karten">
            {zeilen.map((r) => (
              <li key={r.name} className="bo-mar-karte-zeile">
                <div className="min-w-0 flex-1">
                  <Link href={`/marketing/kundenreisen/${encodeURIComponent(r.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">{r.titel}</Link>
                </div>
                <Status gruppe="reise" wert={reiseStatus(r, { automatik })} />
              </li>
            ))}
          </ul>
        </ListeKachel>
      )}
    </Rahmen>
  );
}
