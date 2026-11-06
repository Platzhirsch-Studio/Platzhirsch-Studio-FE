import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { darf, darfGeraeteVerwalten, istAdmin } from "@/lib/backoffice/auth/rechte";
import { geraeteListe } from "@/lib/backoffice/auth/geraet";
import { integration } from "@/lib/backoffice/zentrale/daten";
import { VERWALTUNG as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import { Icon } from "@/components/Backoffice/icons";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Verwaltung · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

async function zahl(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/** Verwaltung als ein Ort (10-konzept-zentrale § 2.2): Karten nur mit Recht, Zähler aus je einer Abfrage (Fehler → Zähler entfällt). */
export default async function Verwaltung() {
  const session = await requireRecht("zentrale", "read", "/verwaltung");
  const client = backoffice(session);
  const admin = istAdmin(session);
  const gf = darf(session, "zentrale", "write");
  const leitung = darfGeraeteVerwalten(session);
  const jetzt = new Date();
  const [aktiv, geraete, integ] = await Promise.all([
    admin || gf ? zahl(() => client.count("User", { filters: [["enabled", "=", 1]] })) : null,
    leitung ? zahl(() => geraeteListe({ session })) : null,
    admin || gf ? zahl(() => integration(client, session, jetzt)) : null,
  ]);
  const alt = Array.isArray(geraete) ? geraete.filter((g) => !g.zuletzt_gesehen || jetzt.getTime() - Date.parse(String(g.zuletzt_gesehen).replace(" ", "T")) > 86_400_000).length : 0;
  const karten = [
    (admin || gf) && { titel: T.benutzer, text: aktiv === null ? "" : T.benutzerZahl(aktiv, 0), href: "/benutzer", icon: "Users" },
    leitung && { titel: T.geraete, text: Array.isArray(geraete) ? T.geraeteZahl(geraete.length, alt) : "", href: "/geraete", icon: "Monitor" },
    (admin || gf) && { titel: T.einstellungen, text: T.einstellungenText, href: "/einstellungen", icon: "Settings" },
    (admin || gf) && { titel: T.protokoll, text: integ?.status === "ok" ? T.protokollZahl(integ.fehler) : "", href: "/protokoll", icon: "ScrollText" },
    { titel: T.druck, text: T.druckText, href: "/druck", icon: "Printer" },
  ].filter(Boolean);
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.titel} untertitel={T.unter} krumen={[{ titel: "Zentrale", href: "/" }, { titel: T.titel }]} />
      <div className="mb-6 md:hidden">
        <p className="zb-band" data-ton="info">
          {T.telefon}
        </p>
      </div>
      <div className="zb-hub" data-testid="verwaltung-hub">
        {karten.map((k) => (
          <Kachel key={k.href} titel={k.titel} href={k.href} oeffnenLabel={`${k.titel} öffnen`} lift testid={`verwaltung-${k.href.slice(1)}`}>
            <span className="zb-hub__sym" aria-hidden="true">
              <Icon name={k.icon} className="size-5" />
            </span>
            {k.text && <p className="zb-hub__zahl">{k.text}</p>}
          </Kachel>
        ))}
      </div>
    </Shell>
  );
}
