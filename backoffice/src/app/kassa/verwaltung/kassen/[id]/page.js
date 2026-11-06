import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { Icon } from "@/components/Backoffice/icons";
import { Fakten, KRUMEN, V, verwaltungsZugang, zeit } from "@/components/Backoffice/Kassa/Verwaltung";
import { DocAktion, NullbelegKnopf, TrainingSchalter } from "@/components/Backoffice/Kassa/VerwaltungAktionen";
import { echtbetriebFehlt, kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { VERWALTUNG } from "@/lib/backoffice/kassa/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Kasse ${decodeURIComponent(id)}` };
}

const SCHRITT = { "AES-Schluessel erzeugt": "AES-Schlüssel erzeugt", "SEE bestellt": "Signatureinheit bestellt", "SEE registriert FinanzOnline": "Signatureinheit in FinanzOnline registriert", "Kasse registriert FinanzOnline": "Kasse in FinanzOnline registriert", "Startbeleg erstellt": "Startbeleg erstellt", "Startbeleg geprueft (BMF-App)": "Startbeleg mit der BMF-App geprüft" };

// Kassen-Akte (Team B-KAS, Konzept §5.3): Status, Signatureinheit, Einrichtung (Checkliste), Zähler, Terminals,
// Trainingsmodus mit Echtbetriebs-Schranke (§0.4) und die RKSV-Aktionen der Leitung.
export default async function KassenAkte({ params }) {
  const { id: roh } = await params;
  const id = decodeURIComponent(roh);
  const { session, client, leitung } = await verwaltungsZugang(`${V}/kassen/${roh}`);
  let k;
  try {
    k = await client.getDoc("PH Kasse", id);
  } catch {
    notFound();
  }
  const [faehig, terminals, kontext] = await Promise.all([
    kassaFaehigkeiten(session, { client }),
    client.getList("PH Terminal", { fields: ["name", "bezeichnung", "status", "testmodus", "letzter_kontakt"], filters: [["kasse", "=", id]], limit: 10 }).catch(() => []),
    rufe(client, "kontext", { kasse: id }).catch(() => null),
  ]);
  const checkliste = (k.registrierung || []).map((c) => ({ titel: SCHRITT[c.schritt] || c.schritt, erledigt: !!c.erledigt, datum: c.datum }));
  const fehlt = echtbetriebFehlt(faehig, checkliste);
  return (
    <Shell session={session} breit>
      <AkteKopf
        zurueck={{ titel: "Kassen", href: `${V}/kassen` }}
        krumen={[...KRUMEN, { titel: "Kassen", href: `${V}/kassen` }, { titel: k.bezeichnung || k.name }]}
        titel={k.bezeichnung || k.name}
        nummer={<span>{k.kassen_id} · {k.standort} </span>}
        status={k.trainings_modus ? <Pille material="messing">{VERWALTUNG.trainingAktiv}</Pille> : <StatusBadge wert={k.status} ton={k.status === "Aktiv" ? "gruen" : "grau"} />}
        betrag={kontext ? { cent: kontext.bargeld_bestand_cent, unter: "Bargeld in der Lade" } : null}
        aktionen={
          leitung ? (
            <div className="flex flex-wrap justify-end gap-2">
              <NullbelegKnopf kasse={k.name} />
              <DocAktion doctype="PH Kasse" name={k.name} methode="kette_pruefen" titel={VERWALTUNG.kasse.kette} icon="BadgeCheck" />
              <DocAktion doctype="PH Kasse" name={k.name} methode="dep_exportieren" titel={VERWALTUNG.kasse.dep} icon="Download" frage="Erzeugt ein Datenerfassungsprotokoll aller Belege des Zeitraums." deaktiviert={!faehig.dep_export?.an} grund={faehig.dep_export?.grund} variant="primary" />
            </div>
          ) : null
        }
        testid="kassen-akte"
      />
      <Bento>
        <Kachel className="col-span-12 md:col-span-5" titel={VERWALTUNG.kasse.training}>
          {leitung ? <TrainingSchalter kasse={k.name} an={!!k.trainings_modus} fehlt={fehlt} /> : <p className="text-[14px]">{k.trainings_modus ? VERWALTUNG.trainingAktiv : "Echtbetrieb"}</p>}
        </Kachel>
        <Kachel className="col-span-12 md:col-span-7" titel={VERWALTUNG.kasse.checkliste} unter={`${checkliste.filter((c) => c.erledigt).length} von ${checkliste.length} erledigt`}>
          <ul className="flex flex-col gap-2" data-testid="kasse-checkliste">
            {checkliste.map((c) => (
              <li key={c.titel} className="flex items-center gap-3 text-[14px]">
                <span className={`grid size-7 shrink-0 place-items-center rounded-full ${c.erledigt ? "bg-bo-salbei-soft text-bo-salbei-text" : "bg-bo-fill text-bo-text-soft"}`}>
                  <Icon name={c.erledigt ? "Check" : "CircleDashed"} className="size-4" />
                </span>
                <span className="flex-1">{c.titel}</span>
                <span className="text-[13px] text-bo-text-soft tabular-nums">{c.datum ? zeit(c.datum, false) : "offen"}</span>
              </li>
            ))}
          </ul>
          {leitung && (
            <div className="mt-4 flex flex-wrap gap-2">
              <DocAktion doctype="PH Kasse" name={k.name} methode="startbeleg_geprueft" titel={VERWALTUNG.kasse.startbeleg + " geprüft"} icon="CircleCheck" />
              <DocAktion doctype="PH Kasse" name={k.name} methode="jahresbeleg_geprueft" titel={VERWALTUNG.kasse.jahresbeleg} icon="CircleCheck" />
            </div>
          )}
        </Kachel>
        <Kachel className="col-span-12 md:col-span-6" titel={VERWALTUNG.kasse.signatur}>
          <Fakten eintraege={[["Signatureinheit", k.see || "–"], ["AES-Schlüssel", k.aes_schluessel_vorhanden ? "vorhanden" : "fehlt"], ["Startbeleg", k.startbeleg || "–"], ["Startbeleg erstellt", k.startbeleg_erstellt_am ? zeit(k.startbeleg_erstellt_am) : "–"], ["FinanzOnline registriert", k.finanzonline_registriert_am ? zeit(k.finanzonline_registriert_am, false) : "offen"], ["Letzter DEP-Export", k.dep_export_letzter ? zeit(k.dep_export_letzter) : "–"]]} />
          {leitung && (
            <div className="mt-4">
              <DocAktion doctype="PH Kasse" name={k.name} methode="see_ausfall_melden" titel={VERWALTUNG.kasse.seeAusfall} icon="ShieldAlert" frage="Belege werden mit dem Vermerk „Sicherheitseinrichtung ausgefallen“ erstellt, bis der Ausfall beendet ist. Über 48 Stunden ist eine Meldung in FinanzOnline nötig." />
            </div>
          )}
        </Kachel>
        <Kachel className="col-span-12 md:col-span-6" titel={VERWALTUNG.kasse.zaehler}>
          <Fakten eintraege={[["Belegnummer", k.belegnummer_zaehler], ["Letzter Beleg", k.letzter_beleg || "–"], ["Letzter Beleg am", k.letzter_beleg_am ? zeit(k.letzter_beleg_am) : "–"], ["Heute kassiert", kontext ? euro(kontext.heute_umsatz_cent) : "–"]]} />
        </Kachel>
        <Kachel className="col-span-12" titel="Terminals">
          {terminals.length === 0 ? (
            <p className="text-[14px] text-bo-text-soft">Kein Kartenterminal zugeordnet.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {terminals.map((t) => (
                <li key={t.name} className="flex items-center gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-3">
                  <Icon name="CreditCard" className="size-5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{t.bezeichnung}</span>
                    <span className="block text-[13px] text-bo-text-soft">{t.testmodus ? "Testmodus · " : ""}zuletzt {t.letzter_kontakt ? zeit(t.letzter_kontakt) : "–"}</span>
                  </span>
                  <StatusBadge wert={t.status} ton={t.status === "Online" ? "gruen" : t.status === "Offline" ? "orange" : "grau"} />
                  {leitung && <DocAktion doctype="PH Terminal" name={t.name} methode="status_abfragen" titel="Status" icon="RefreshCw" variant="ghost" />}
                </li>
              ))}
            </ul>
          )}
        </Kachel>
      </Bento>
    </Shell>
  );
}
