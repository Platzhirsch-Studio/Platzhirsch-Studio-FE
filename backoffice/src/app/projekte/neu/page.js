import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backofficeService } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import ProjektNeu from "@/components/Backoffice/Projekte/ProjektNeu";
import { projekteClient } from "@/lib/backoffice/projekte/lesen";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Neues Projekt · Projekte" };

async function lies(client, doctype, opts) {
  try {
    return { zeilen: await client.getList(doctype, opts), gesperrt: false };
  } catch (err) {
    // Projekte-Rollen lesen PH Kontakt/PH Anfrage nicht (ph_crm-Rechte). Im Mock zeigt der Service-Client die Musterdaten;
    // im Frappe-Modus bleibt die Liste leer mit Hinweis (Backend-Lücke, Übergabe B-PRJ).
    if (err?.code === "forbidden" && client.modus !== "frappe") return { zeilen: await backofficeService().getList(doctype, opts), gesperrt: false };
    return { zeilen: [], gesperrt: true };
  }
}

/** Projekt anlegen (PA1, § 5.3). Vorbelegung über ?kontakt=&anfrage=&projektart=. */
export default async function NeuesProjekt({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "create", "/projekte/neu");
  const client = projekteClient(session);
  const [k, a] = await Promise.all([
    lies(client, "PH Kontakt", { fields: ["name", "vorname", "nachname", "firma", "ort", "plz", "strasse"], orderBy: "modified desc", limit: 300 }),
    lies(client, "PH Anfrage", { fields: ["name", "titel", "kontakt", "status"], filters: [["status", "not in", ["Abgeschlossen", "Verloren", "Spam"]]], orderBy: "modified desc", limit: 100 }),
  ]);
  const kontakte = k.zeilen.map((x) => ({ name: x.name, titel: x.firma || [x.vorname, x.nachname].filter(Boolean).join(" ") || x.name, ort: x.ort || "", plz: x.plz || "", strasse: x.strasse || "" }));
  return (
    <Shell session={session}>
      <Seitenkopf titel={TEXTE.neu.titel} untertitel={TEXTE.neu.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: TEXTE.neu.titel }]} zurueck="/projekte" />
      <ProjektNeu kontakte={kontakte} anfragen={a.zeilen} kontakteGesperrt={k.gesperrt} vorwahl={{ kontakt: sp.kontakt || "", anfrage: sp.anfrage || "", projektart: sp.projektart || "" }} />
    </Shell>
  );
}
