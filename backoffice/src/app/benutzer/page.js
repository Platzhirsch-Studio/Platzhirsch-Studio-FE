import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { istAdmin } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import BenutzerTabelle from "./BenutzerTabelle";

export const metadata = { title: "Benutzer" };
export const dynamic = "force-dynamic";

const PH_ROLLEN = [
  "PH Geschäftsführung", "PH Backoffice-Admin", "PH Buchhaltung extern",
  ...["CRM", "Sortiment", "Projekte", "Shop", "Faktura", "Logistik", "Personal", "Marketing", "Kassa", "Service", "Kundenkarte"].flatMap((b) => [`PH ${b} Mitarbeiter`, `PH ${b} Leitung`]),
  "PH Montage", "PH Techniker", "PH Personal Selbstservice",
];

// Benutzer + Rollen lesend; Admin weist Rollen zu (Frappe User.roles).
export default async function Benutzer() {
  const session = await requireRecht("zentrale", "read", "/benutzer");
  const client = backoffice(session);
  const admin = istAdmin(session);
  let benutzer = [];
  let fehler = null;
  try {
    const liste = await client.getList("User", { fields: ["name", "email", "full_name", "enabled"], filters: [["enabled", "=", 1]], orderBy: "full_name asc", limit: 200 });
    benutzer = await Promise.all(
      liste.map(async (u) => {
        try {
          const doc = await client.getDoc("User", u.name);
          return { ...u, rollen: (doc.roles || []).map((r) => r.role).filter((r) => /^PH |System Manager/.test(r)) };
        } catch {
          return { ...u, rollen: [] };
        }
      })
    );
  } catch (err) {
    fehler = err;
  }
  return (
    <Shell session={session}>
      <Seitenkopf titel="Benutzer und Rollen" untertitel={admin ? "Rollen wirken sofort auf das Benutzerkonto. Bearbeiten über das Menü am Zeilenende." : "Nur lesend. Rollen vergibt die Backoffice-Administration."} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Benutzer" }]} />
      {fehler ? (
        <Fehler code={istBackofficeError(fehler) ? fehler.code : "unavailable"} message={istBackofficeError(fehler) ? fehler.message : undefined} />
      ) : (
        <BenutzerTabelle benutzer={benutzer} admin={admin} alleRollen={PH_ROLLEN} />
      )}
    </Shell>
  );
}
