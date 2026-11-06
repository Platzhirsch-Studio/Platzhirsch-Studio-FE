import { notFound, redirect } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { projekteClient } from "@/lib/backoffice/projekte/lesen";

const ARTEN = { planung: "PH Planung", renderings: "PH Rendering", aufmass: "PH Aufmass", nachtraege: "PH Nachtrag", aufgabe: "PH Projekt Aufgabe" };

/** Kanonische Route ohne Projektnamen (bereiche/projekte.js): Projekt nachschlagen, dann 307 unter das Projekt. */
export default async function ObjektZuProjekt({ params }) {
  const { art, name } = await params;
  const doctype = ARTEN[art];
  if (!doctype) notFound();
  const session = await requireRecht("projekte", "read", `/projekte/objekt/${art}/${name}`);
  let projekt = null;
  try {
    projekt = await projekteClient(session).getValue(doctype, decodeURIComponent(name), "projekt");
  } catch {
    notFound();
  }
  if (!projekt) notFound();
  if (art === "aufgabe") redirect(`/projekte/${encodeURIComponent(projekt)}`);
  redirect(`/projekte/${encodeURIComponent(projekt)}/${art}/${name}`);
}
