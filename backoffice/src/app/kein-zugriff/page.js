import Link from "next/link";
import { requireSession } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Fehler from "@/components/Backoffice/Fehler";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";

const AKTION = { read: "lesen", write: "bearbeiten", create: "anlegen", delete: "löschen", submit: "buchen", cancel: "stornieren", export: "exportieren", print: "drucken", arbeitsplatz: "Arbeitsplatz" };

export const metadata = { title: "Kein Zugriff" };

export default async function KeinZugriff({ searchParams }) {
  const session = await requireSession("/kein-zugriff");
  const sp = await searchParams;
  const was = sp?.doctype ? `„${doctypeLabel(sp.doctype)}“` : sp?.bereich ? `den Bereich „${anzeige(sp.bereich.charAt(0).toUpperCase() + sp.bereich.slice(1))}“` : "diese Seite";
  return (
    <Shell session={session}>
      <div className="mx-auto max-w-lg">
        <Fehler code="forbidden" titel="Keine Berechtigung" message={`Für ${was} fehlt die passende Rolle (${AKTION[sp?.aktion] || "lesen"}). Rollen vergibt die Backoffice-Administration unter „Benutzer“.`} />
        <p className="mt-4 text-sm">
          <Link href="/" className="underline">
            Zur Zentrale
          </Link>
        </p>
      </div>
    </Shell>
  );
}
