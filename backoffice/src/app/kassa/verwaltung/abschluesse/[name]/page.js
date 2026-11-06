import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import { Fakten, KRUMEN, V, verwaltungsZugang, zeit } from "@/components/Backoffice/Kassa/Verwaltung";
import { DocAktion } from "@/components/Backoffice/Kassa/VerwaltungAktionen";
import { kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { darfAnDieKassa } from "@/lib/backoffice/kassa/zugang";
import { differenzWort } from "@/lib/backoffice/kassa/abschluss";
import { euro, STEUERSATZ_KURZ } from "@/lib/backoffice/kassa/betraege";
import { ABSCHLUSS_STATUS_TITEL, VERWALTUNG } from "@/lib/backoffice/kassa/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `Abschluss ${decodeURIComponent(name)}` };
}

const TON = { Offen: "blau", Gezaehlt: "orange", Abgeschlossen: "gruen", Korrigiert: "lila" };

// Abschluss-Akte (Team B-KAS, Konzept §5.2): Soll/Ist/Differenz, Zählprotokoll, Umsatz je Steuersatz, Bargeld-
// Bewegungen. Abschließen läuft am Kiosk (Leitung per Bedienerwechsel); „Wieder öffnen“ nur mit Fähigkeit.
export default async function AbschlussAkte({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const { session, client, leitung } = await verwaltungsZugang(`${V}/abschluesse/${roh}`);
  let a;
  try {
    a = await client.getDoc("PH Kassenabschluss", name);
  } catch {
    notFound();
  }
  const faehig = await kassaFaehigkeiten(session, { client });
  const toleranz = 100;
  return (
    <Shell session={session} breit>
      <AkteKopf
        zurueck={{ titel: "Abschlüsse", href: `${V}/abschluesse` }}
        krumen={[...KRUMEN, { titel: "Abschlüsse", href: `${V}/abschluesse` }, { titel: a.name }]}
        titel={`Tagesabschluss ${zeit(a.datum, false)}`}
        nummer={<span className="tabular-nums">{a.name} · {a.kasse} </span>}
        status={<StatusBadge wert={a.status} text={ABSCHLUSS_STATUS_TITEL[a.status]} ton={TON[a.status] || "grau"} />}
        betrag={{ cent: a.umsatz_cent, unter: "Umsatz" }}
        aktionen={
          <div className="flex flex-wrap justify-end gap-2">
            <DruckKnopf doctype="PH Kassenabschluss" name={a.name} titel={`Abschluss ${a.name}`} pdf={client.modus === "frappe"} />
            {leitung && <DocAktion doctype="PH Kassenabschluss" name={a.name} methode="neu_berechnen" titel={VERWALTUNG.abschluss.neuBerechnen} icon="RefreshCw" />}
            {leitung && a.status === "Abgeschlossen" && (
              <DocAktion doctype="PH Kassenabschluss" name={a.name} methode="oeffnen" args={{ grund: "Korrektur aus der Verwaltung" }} titel={VERWALTUNG.abschluss.oeffnen} icon="Undo2" frage="Der Tag wird wieder geöffnet; neue Belege und eine neue Zählung sind möglich. Die Differenz wird beim nächsten Abschluss neu gebucht." deaktiviert={!faehig.abschluss_oeffnen?.an} grund={faehig.abschluss_oeffnen?.grund} />
            )}
            {leitung && a.status === "Gezaehlt" && darfAnDieKassa(session) && (
              <Knopf href="/kassa/abschluss" variant="primary" icon="Lock">
                {VERWALTUNG.abschluss.zuKiosk}
              </Knopf>
            )}
          </div>
        }
        testid="abschluss-akte"
      />
      <Bento>
        <Kennzahl className="col-span-6 md:col-span-3" titel="Soll" wert={a.bargeld_soll_cent} format="cent" />
        <Kennzahl className="col-span-6 md:col-span-3" titel="Ist (gezählt)" wert={a.status === "Offen" ? null : a.bargeld_ist_cent} format="cent" />
        <Kennzahl className="col-span-6 md:col-span-3" titel="Differenz" wert={a.status === "Offen" ? null : a.differenz_cent} format="cent" zusatz={a.status === "Offen" ? "Noch nicht gezählt" : differenzWort(a.differenz_cent || 0, toleranz)} ton={Math.abs(a.differenz_cent || 0) > toleranz ? "cognac" : undefined} />
        <Kennzahl className="col-span-6 md:col-span-3" titel="Belege" wert={a.belege_anzahl} zusatz={`${a.stornos_anzahl || 0} Storno · ${a.trainings_anzahl || 0} Training`} />
        <Kachel className="col-span-12 md:col-span-6" titel="Bargeld">
          <Fakten
            eintraege={[
              ["Anfangsbestand", euro(a.bargeld_anfang_cent)],
              ["Bar-Einnahmen", euro(a.bar_einnahmen_cent)],
              ["Bar-Ausgaben", euro(a.bar_ausgaben_cent)],
              ["Einlagen", euro(a.einlagen_cent)],
              ["Entnahmen", euro(a.entnahmen_cent)],
              ["Soll", euro(a.bargeld_soll_cent)],
              a.differenz_grund ? ["Grund der Differenz", a.differenz_grund] : null,
              a.differenz_buchung ? ["Differenzbuchung", a.differenz_buchung] : null,
            ]}
          />
        </Kachel>
        <Kachel className="col-span-12 md:col-span-6" titel="Umsatz">
          <Fakten
            eintraege={[
              ["Karte", euro(a.karten_cent)],
              ["Gutschein", euro(a.gutschein_cent)],
              ["Anzahlungen", euro(a.anzahlungen_cent)],
              ["Gutscheine verkauft", euro(a.gutschein_verkauf_cent)],
              ["Retouren", euro(a.retouren_cent)],
              ["Gezählt von", a.von_user || "–"],
              ["Abgeschlossen von", a.freigegeben_von || "–"],
              ["Abgeschlossen am", a.geschlossen_am ? zeit(a.geschlossen_am) : "–"],
            ]}
          />
        </Kachel>
        <Kachel className="col-span-12 md:col-span-7" titel={VERWALTUNG.abschluss.zaehlung} unter={a.unterschrift_name ? `Unterschrieben: ${a.unterschrift_name}` : undefined}>
          {(a.zaehlprotokoll || []).filter((z) => z.anzahl).length === 0 ? (
            <p className="text-[14px] text-bo-text-soft">Noch nicht gezählt.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {(a.zaehlprotokoll || []).filter((z) => z.anzahl).map((z) => (
                <li key={z.stueckelung_cent} className="flex justify-between border-b border-bo-line py-2 text-[14px] tabular-nums">
                  <span>{z.anzahl} × {z.stueckelung_cent >= 100 ? `${z.stueckelung_cent / 100} €` : `${z.stueckelung_cent} Cent`}</span>
                  <span className="font-medium">{euro(z.summe_cent)}</span>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
        <Kachel className="col-span-12 md:col-span-5" titel={VERWALTUNG.abschluss.jeSatz}>
          <ul className="flex flex-col gap-2">
            {(a.umsatz_je_satz || []).map((s) => (
              <li key={s.steuersatz} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-[14px] bg-bo-surface-2 px-3 py-2.5 text-[14px] tabular-nums">
                <span>
                  {STEUERSATZ_KURZ[s.steuersatz] || s.steuersatz}
                  <span className="block text-[12px] text-bo-text-soft">netto {euro(s.netto_cent)} · USt. {euro(s.ust_cent)}</span>
                </span>
                <span className="font-semibold">{euro(s.brutto_cent)}</span>
              </li>
            ))}
            {!(a.umsatz_je_satz || []).length && <li className="text-[14px] text-bo-text-soft">Kein Umsatz.</li>}
          </ul>
        </Kachel>
      </Bento>
    </Shell>
  );
}
