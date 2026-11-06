import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Avatar from "@/components/Backoffice/Avatar";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Leer from "@/components/Backoffice/Leer";
import { KRUMEN, V, verwaltungsZugang } from "@/components/Backoffice/Kassa/Verwaltung";
import { bedienerListe } from "@/lib/backoffice/auth/login";
import { rollenLabel } from "@/lib/backoffice/labels";
import { VERWALTUNG } from "@/lib/backoffice/kassa/texte";

export const metadata = { title: "Bediener · Kassa" };
export const dynamic = "force-dynamic";

// Bediener der Kassa (Team B-KAS, Konzept §4.11, T9): Personen mit Kassa-Rolle am Standort. PIN und Rollen pflegt
// die Benutzerverwaltung (ph_core); die Kassa zeigt keine Auswertung je Person (Personal: nur Name).
export default async function Bediener() {
  const { session, leitung } = await verwaltungsZugang(`${V}/bediener`, "cancel");
  const alle = await bedienerListe({ alleStandorte: true }).catch(() => []);
  const liste = alle.filter((b) => (b.roles || []).some((r) => /Kassa/.test(r)));
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={VERWALTUNG.bediener.titel} untertitel="Wer an der Kassa verkaufen und freigeben darf." krumen={[...KRUMEN, { titel: VERWALTUNG.bediener.titel }]} aktionen={leitung ? <Knopf href="/benutzer" icon="UserCog">Benutzer und PIN verwalten</Knopf> : null} />
      <Bento>
        <Kachel className="col-span-12" titel={`${liste.length} Personen`}>
          {liste.length === 0 ? (
            <Leer titel={VERWALTUNG.bediener.keine} groesse="karte" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="kassa-bediener">
              {liste.map((b) => (
                <li key={b.email} className="flex items-center gap-3 rounded-[20px] bg-bo-surface-2 p-3">
                  <Avatar name={b.name} groesse={44} ring={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{String(b.name).split(" (")[0]}</span>
                    <span className="block truncate text-[13px] text-bo-text-soft">{b.standort || "–"}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    {(b.roles || []).filter((r) => /Kassa/.test(r)).map((r) => (
                      <Pille key={r} material={/Leitung/.test(r) ? "cognac" : "stein"}>{rollenLabel(r)}</Pille>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Kachel>
      </Bento>
    </Shell>
  );
}
