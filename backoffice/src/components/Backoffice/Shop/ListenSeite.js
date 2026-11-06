// Gemeinsames Gerüst der Shop-Listen (T2; § 3.5): Seitenkopf mit leichten Zahlen, Erstbesuch, Filterzeile mit
// Arbeitsansichten, Tabelle in Kachel mit drei Leerzuständen (nie Daten · gefiltert · erledigt), Fehler je Liste.
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import ShopFilter from "./ShopFilter";
import ShopListe from "./ShopListe";

/**
 * @param {{titel:string, basis:string, params:object, r:object, liste:string, spalten:object[], zeilen:object[], fehler?:object,
 *  kennzahlen?:object[], aktionen?:any, erstbesuch?:string, leer:{nie:string, filter:string, erledigt?:string, nieAktion?:any},
 *  status?:object[], chips?:object[], suche?:string, massen?:object[], unternav?:any, darfExport?:boolean, krumen?:object[], summe?:string, ueber?:string, kopf?:boolean}} p
 */
export default function ListenSeite({ titel, basis, params, r, liste, spalten, zeilen, fehler, kennzahlen = [], aktionen, erstbesuch, leer, status = [], chips = [], suche, massen = [], unternav, darfExport = false, krumen, summe, kopf = true }) {
  const leerZustand = r.nieDaten ? (
    <Leer art="leer" titel={leer.nie} aktion={leer.nieAktion} />
  ) : r.gefiltert ? (
    <Leer art="gefiltert" titel={leer.filter} zuruecksetzenHref={`${basis}?${new URLSearchParams(Object.entries({ ansicht: params.ansicht, segment: params.segment, tab: params.tab }).filter(([, v]) => v)).toString()}`} />
  ) : (
    <Leer art="erledigt" titel={leer.erledigt || leer.filter} />
  );
  return (
    <>
      {kopf && <Seitenkopf titel={titel} krumen={krumen || [{ titel: "Zentrale", href: "/" }, { titel: "Shop", href: "/shop" }, { titel }]} kennzahlen={kennzahlen} aktionen={aktionen} unternav={unternav} />}
      {erstbesuch && <Erstbesuch text={erstbesuch} route={basis} />}
      <ShopFilter basis={basis} params={params} ansichten={r.ansichten} ansicht={r.ansicht} status={status} chips={chips} suche={suche} />
      {fehler ? (
        <Fehler code={fehler.code} message={fehler.message} />
      ) : (
        <ShopListe liste={liste} spalten={spalten} zeilen={zeilen} gesamt={r.gesamt} seite={r.seite} seiten={r.seiten} basis={basis} params={params} massen={massen} summe={summe} darfExport={darfExport} leer={leerZustand} arbeit={r.arbeit} />
      )}
    </>
  );
}
