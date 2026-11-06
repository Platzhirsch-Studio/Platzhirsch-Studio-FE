import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import { KRUMEN, V, verwaltungsZugang } from "@/components/Backoffice/Kassa/Verwaltung";
import { EinstellungFeld } from "@/components/Backoffice/Kassa/VerwaltungAktionen";
import { STANDARD_EINSTELLUNGEN } from "@/lib/backoffice/kassa/einstellungen";
import { VERWALTUNG } from "@/lib/backoffice/kassa/texte";

export const metadata = { title: "Einstellungen · Kassa" };
export const dynamic = "force-dynamic";

const GRUPPEN = [
  {
    titel: "Verkauf",
    felder: [
      { feld: "barverkauf_rechnung_ab_cent", typ: "cent", titel: "Rechnungsfrage ab", beschreibung: "Über diesem Betrag fragt die Kassa „Rechnung auf eine Firma?“ (§ 11 UStG)." },
      { feld: "rabatt_freigabe_ab_promille", typ: "promille", titel: "Rabatt ohne Leitung bis", beschreibung: "Darüber braucht ein Rabatt die Freigabe der Leitung." },
      { feld: "gutschein_art", typ: "select", titel: "Gutscheine", optionen: ["Mehrzweck", "Einzweck"], beschreibung: "Mehrzweck: Verkauf ohne Umsatzsteuer, Einlösung als Zahlart." },
      { feld: "karte_automatisch_buchen", typ: "check", titel: "Nach Kartenzahlung automatisch buchen" },
    ],
  },
  {
    titel: "Storno und Rücknahme",
    felder: [
      { feld: "storno_mitarbeiter_bis_cent", typ: "cent", titel: "Storno ohne Leitung bis", beschreibung: "Eigene Belege von heute; 0 € = jedes Storno braucht die Leitung." },
      { feld: "retoure_bar_nur_leitung", typ: "check", titel: "Bar-Rückzahlung nur mit Leitung" },
      { feld: "retoure_standard", typ: "select", titel: "Rückzahlung standardmäßig", optionen: ["Gutschein", "Original-Zahlart", "Bar"] },
    ],
  },
  {
    titel: "Tagesabschluss",
    felder: [
      { feld: "differenz_toleranz_cent", typ: "cent", titel: "Toleranz ohne Grund", beschreibung: "Differenzen bis zu diesem Betrag brauchen keinen Grund." },
      { feld: "differenz_warnung_cent", typ: "cent", titel: "Hinweis an die Leitung ab" },
      { feld: "abschluss_unterschrift_pflicht", typ: "check", titel: "Unterschrift beim Abschluss" },
    ],
  },
  {
    titel: "Bon und Kundendisplay",
    felder: [
      { feld: "automatisch_drucken", typ: "check", titel: "Bon automatisch drucken" },
      { feld: "bon_kopfzeile", typ: "text", titel: "Kopfzeile am Bon" },
      { feld: "bon_fusstext", typ: "text", titel: "Fußtext am Bon" },
      { feld: "beleg_email_betreff", typ: "text", titel: "Betreff der Beleg-E-Mail" },
      { feld: "kundendisplay_aktiv", typ: "check", titel: "Kundendisplay" },
      { feld: "kundendisplay_text", typ: "text", titel: "Text im Ruhebild" },
      { feld: "kundendisplay_anrede", typ: "check", titel: "Vorname am Kundendisplay zeigen", beschreibung: "Standard aus: das Display zeigt keine Namen." },
    ],
  },
];

// Einstellungen der Kassa (Team B-KAS, Konzept §4.9, T9 Single). Jede Änderung wird sofort gespeichert; nur
// die Leitung darf ändern, alle mit Leserecht sehen die Werte.
export default async function Einstellungen() {
  const { session, client, leitung } = await verwaltungsZugang(`${V}/einstellungen`);
  const doc = await client.getDoc("PH Kassa Einstellungen", "PH Kassa Einstellungen").catch(() => ({}));
  const werte = { ...STANDARD_EINSTELLUNGEN, ...Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== "" && v !== null && v !== undefined)) };
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={VERWALTUNG.einstellungen.titel} untertitel={leitung ? "Änderungen gelten sofort an allen Kassen." : "Nur die Kassa-Leitung kann Werte ändern."} krumen={[...KRUMEN, { titel: VERWALTUNG.einstellungen.titel }]} />
      <Bento testid="kassa-einstellungen">
        {GRUPPEN.map((g) => (
          <Kachel key={g.titel} className="col-span-12 md:col-span-6" titel={g.titel}>
            <div className="flex flex-col divide-y divide-bo-line">
              {g.felder.map((f) => (
                <EinstellungFeld key={f.feld} {...f} wert={werte[f.feld]} darf={leitung} />
              ))}
            </div>
          </Kachel>
        ))}
      </Bento>
    </Shell>
  );
}
