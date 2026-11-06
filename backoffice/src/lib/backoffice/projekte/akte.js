import "server-only";
// Laden einer Unterakte des Projekts (Planung, Rendering, Aufmaß, Nachtrag) mit Prüfung, dass sie zum Projekt gehört.

import { notFound, redirect } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { istLeitung, projekteClient } from "./lesen.js";

export async function ladeUnterakte({ params, doctype, pfad }) {
  const { projekt: pRoh, name: nRoh } = await params;
  const projekt = decodeURIComponent(pRoh);
  const name = decodeURIComponent(nRoh);
  const session = await requireRecht("projekte", "read", `/projekte/${pRoh}/${pfad}/${nRoh}`);
  const client = projekteClient(session);
  let doc;
  let p;
  try {
    [doc, p] = await Promise.all([client.getDoc(doctype, name), client.getDoc("PH Projekt", projekt)]);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "forbidden") redirect("/kein-zugriff?bereich=projekte");
    notFound();
  }
  if (doc.projekt !== projekt) notFound();
  return { session, client, doc, projekt: p, leitung: istLeitung(session) };
}
