// Gemeinsame Akte für Gutschrift, Mahnung und Export-Lauf (§ 4.4): Kopf mit Status und Betrag, höchstens ein Band,
// Reiter, Fakten, Positionen/Belege und Verlauf – gleiches Lounge-Gerüst wie Rechnung/Angebot/Auftrag.

import { AkteGeruest, AkteKopf, AkteTabs, Band, RechteSpalte } from "../Akte";
import Kachel from "../Kachel";
import Zeitleiste from "../Formular/Zeitleiste";
import { AkteAktionen } from "./AkteTeile";
import { Status, Fakten } from "./teile";

export default function EinfacheAkte({ testid, zurueck, krumen, titel, nummer, status, betrag, ziel, primaer, menue, rolle, band, tabs, tab, basis, params, details, docinfo, doctype, name, kinder }) {
  return (
    <AkteGeruest
      testid={testid}
      kopf={<AkteKopf zurueck={zurueck} krumen={krumen} titel={titel} nummer={nummer} status={<Status status={status} />} betrag={betrag} aktionen={<AkteAktionen ziel={ziel} primaer={primaer} menue={menue} rolle={rolle} />} />}
      band={band && <Band ton={band.ton} titel={band.titel} />}
      reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={params || {}} />}
      rechts={<RechteSpalte details={<Fakten eintraege={details} />} />}
    >
      {tab === "verlauf" ? (
        <Kachel titel="Verlauf">
          <Zeitleiste doctype={doctype} name={name} docinfo={docinfo} darfSchreiben={rolle.schreibt} />
        </Kachel>
      ) : (
        kinder
      )}
    </AkteGeruest>
  );
}
