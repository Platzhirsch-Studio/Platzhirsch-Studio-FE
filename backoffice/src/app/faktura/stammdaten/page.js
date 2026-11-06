import Link from "next/link";
import { fakturaKontext, alle, einstellungen, mahnEinstellungen } from "@/lib/backoffice/faktura/daten";
import { SCHWELLEN_TEXT } from "@/lib/backoffice/faktura/zuTun";
import { cent, datum } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteTabs } from "@/components/Backoffice/Akte";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import ZahlungsbedingungFormular from "@/components/Backoffice/Faktura/ZahlungsbedingungFormular";
import { Fakten, Hinweis } from "@/components/Backoffice/Faktura/teile";

export const metadata = { title: "Stammdaten · Faktura" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "zahlungsbedingungen", titel: "Zahlungsbedingungen" },
  { id: "bankkonten", titel: "Bankkonten" },
  { id: "einstellungen", titel: "Faktura-Einstellungen" },
  { id: "mahnwesen", titel: "Mahnwesen" },
  { id: "erinnerungen", titel: "Erinnerungen" },
];

// /faktura/stammdaten (T9, § 3.11): Zahlungsbedingungen mit Live-Satz und 100-%-Prüfung, Bankkonten, Einstellungen
// (Konten „mit Kanzlei abstimmen“), Mahnwesen ohne Mahnlauf-Knopf, Erinnerungs-Schwellen lesend.
export default async function Stammdaten({ searchParams }) {
  const sp = await searchParams;
  const ctx = await fakturaKontext("/faktura/stammdaten");
  const { client, rolle } = ctx;
  const tab = aktiverTab(TABS, sp?.tab);
  const [bed, konten, fe, me] = await Promise.all([alle(client, "PH Zahlungsbedingung"), alle(client, "PH Bankkonto"), einstellungen(client), mahnEinstellungen(client)]);
  return (
    <FakturaSeite ctx={ctx} titel="Stammdaten">
      <div className="flex flex-col gap-4 xl:gap-6">
        <AkteTabs tabs={TABS} aktiv={tab} basis="/faktura/stammdaten" params={sp || {}} param="tab" />
        {tab === "zahlungsbedingungen" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            {bed.map((b) => (
              <Kachel key={b.name} titel={b.titel} unter={Number(b.standard) ? "Standard" : undefined}>
                <ZahlungsbedingungFormular bedingung={b} darf={rolle.leitung} />
              </Kachel>
            ))}
            {rolle.leitung && (
              <Kachel titel="Neue Zahlungsbedingung">
                <ZahlungsbedingungFormular bedingung={{ titel: "", anzahlung_prozent: 0, teilzahlung_prozent: 0, zieltage: 14, skonto_promille: 0, skonto_tage: 0, text: "" }} darf neu />
              </Kachel>
            )}
          </div>
        )}
        {tab === "bankkonten" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            {konten.map((k) => (
              <Kachel key={k.name} titel={k.name} unter={Number(k.standard) ? "Standard" : undefined}>
                <Fakten eintraege={[{ label: "IBAN", wert: k.iban || "–" }, { label: "BIC", wert: k.bic || "–" }, { label: "Bank", wert: k.bank || "–" }, { label: "Währung", wert: k.waehrung || "EUR" }, { label: "Letzter Import", wert: k.letzter_import ? datum(k.letzter_import) : "–" }, { label: "Saldo", wert: cent(k.saldo_cent) }]} />
              </Kachel>
            ))}
          </div>
        )}
        {tab === "einstellungen" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <Kachel titel="Allgemein">
              <Fakten eintraege={[{ label: "Zahlungsziel", wert: `${fe.zahlungsziel_tage || 14} Tage` }, { label: "Angebote gültig", wert: `${fe.angebot_gueltig_tage || 30} Tage` }, { label: "Kleinbetragsgrenze", wert: cent(fe.kleinbetragsgrenze_cent || 40000) }, { label: "UID-Pflicht ab", wert: cent(fe.uid_pflicht_ab_cent || 1000000) }, { label: "Zahl-QR-Code", wert: Number(fe.epc_qr_aktiv) ? "aktiv" : "aus" }, { label: "Export-Format", wert: fe.export_format_standard || "–" }]} />
            </Kachel>
            <Kachel titel="Umsatzsteuer und Konten">
              <Fakten eintraege={[{ label: "Versteuerung", wert: Number(fe.ist_versteuerung) ? "Istversteuerung" : "Sollversteuerung" }, { label: "OSS", wert: Number(fe.oss_aktiv) ? `registriert ${fe.oss_registrierung || ""}` : "nicht registriert" }, { label: "Methode bestätigt", wert: Number(fe.methode_bestaetigt) ? `ja · ${datum(fe.methode_bestaetigt_am)}` : "noch nicht durch die Kanzlei" }, { label: "Erlöskonto 20 %", wert: fe.erloeskonto_20 || "–" }]} />
              <Hinweis ton="info" className="mt-3">Konten mit der Kanzlei abstimmen. Änderungen wirken erst im nächsten Export.</Hinweis>
            </Kachel>
          </div>
        )}
        {tab === "mahnwesen" && (
          <Kachel titel="Mahnwesen" unter="Der automatische Lauf legt Montag bis Freitag um 06:30 Entwürfe an.">
            <Fakten eintraege={[{ label: "Aktiv", wert: Number(me.aktiv) ? "ja" : "nein" }, { label: "Wartezeit vor Mahnung", wert: `${me.karenz_tage ?? 7} Tage` }, { label: "Mindestbetrag", wert: cent(me.mindestbetrag_cent ?? 1000) }, { label: "Stufen", wert: `${me.stufe1_tage ?? 7} · ${me.stufe2_tage ?? 21} · ${me.stufe3_tage ?? 35} Tage nach Fälligkeit` }, { label: "Abstand", wert: `${me.abstand_tage ?? 14} Tage` }, { label: "Frist", wert: `${me.frist_tage ?? 10} Tage` }, { label: "Gebühren und Zinsen", wert: "folgen mit dem Backend (Mahnspesen)" }]} />
            <p className="mt-3 text-[13px] text-bo-text-soft">
              Gemahnt wird aus den Rechnungen: <Link className="font-medium hover:underline" href="/faktura/rechnungen?r=ueberfaellig">Zum Mahnen</Link>
            </p>
          </Kachel>
        )}
        {tab === "erinnerungen" && (
          <Kachel titel="Erinnerungen" unter="Schwellen für „Zu tun“ (Einstellung folgt mit dem Backend)">
            <Fakten eintraege={SCHWELLEN_TEXT.map(([l, w]) => ({ label: l, wert: w }))} />
          </Kachel>
        )}
      </div>
    </FakturaSeite>
  );
}
