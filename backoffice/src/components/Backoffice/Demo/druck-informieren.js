// Demo „druck-informieren“ (Team P0-5c) für /einstellungen?tab=system&baustein=druck-informieren – nur Admin, nur Mock
// (Prüfung im demo-register). Server-Teil: holt echte Beispiel-Datensätze aus dem Mock und die Rechte/Versandwege,
// damit Druckvorschau, Aufgabe „Leitung bitten“ und verzögertes Senden wirklich laufen (ohne Außenwirkung).

import { getSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { darfLeitungBitten, informierenVersand } from "../Informieren/server";
import { darfAnDieKassa } from "../AnDieKassa";
import DemoDruckInformierenTeile from "./druck-informieren-teile";

async function erster(client, doctype, felder = ["name"]) {
  try {
    const [d] = await client.getList(doctype, { fields: felder, limit: 1, orderBy: "modified desc" });
    return d || null;
  } catch {
    return null;
  }
}

export default async function DemoDruckInformieren() {
  const session = await getSession();
  if (!session) return null;
  const client = backoffice(session);
  const [rechnung, lieferschein, projekt, darfBitten, versand] = await Promise.all([
    erster(client, "PH Rechnung"),
    erster(client, "PH Lieferschein"),
    erster(client, "PH Projekt", ["name", "titel"]),
    darfLeitungBitten(session, client),
    informierenVersand(session),
  ]);
  return (
    <DemoDruckInformierenTeile
      modus={client.modus}
      rechnung={rechnung?.name || null}
      lieferschein={lieferschein?.name || null}
      projekt={projekt ? { name: projekt.name, titel: projekt.titel || projekt.name } : null}
      darfBitten={darfBitten}
      darfKassa={darfAnDieKassa(session)}
      versand={versand}
    />
  );
}
