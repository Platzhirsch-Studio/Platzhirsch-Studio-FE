// Technik: Einsatz-Karte mit Statusknopf (verzögert), Fotos, „Nicht angetroffen“ und Abschluss in vier Schirmen.
import { notFound } from "next/navigation";
import { kioskZugang } from "../../../kiosk";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { serviceClient } from "@/lib/backoffice/service/daten";
import { TechnikEinsatz } from "@/components/Backoffice/Service/Technik";

export const metadata = { title: "Einsatz · Technik" };
export const dynamic = "force-dynamic";

export default async function TechnikEinsatzSeite({ params }) {
  const name = decodeURIComponent((await params).name);
  const { session, geraet, benutzer } = await kioskZugang("technik");
  const client = serviceClient(session);
  let e;
  try {
    e = await client.getDoc("PH Serviceeinsatz", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  // Fall ohne Kosten (Techniker liest Fälle ohne permlevel-1-Felder)
  const fall = e.servicefall ? await client.getDoc("PH Servicefall", e.servicefall).catch(() => null) : null;
  const sauber = fall ? Object.fromEntries(Object.entries(fall).filter(([k]) => !/kosten|notiz_intern|_cent$/.test(k))) : null;
  const code = fall?.fehlercode ? await client.getDoc("PH Fehlercode", fall.fehlercode).catch(() => null) : null;
  const teile = (fall?.ersatzteile || []).filter((t) => ["Aus Bestand", "Eingetroffen", "Bestellt"].includes(t.status)).map((t) => ({ ersatzteil: t.ersatzteil, bezeichnung: t.bezeichnung, menge: t.menge || 1, status: t.status }));
  return <TechnikEinsatz einsatz={e} fall={sauber} code={code ? { pruefhinweis: code.pruefhinweis, standardloesung: code.standardloesung } : null} teile={teile} benutzer={benutzer} geraet={geraet} />;
}
