import { redirect } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import EinstellungenForm from "@/components/Backoffice/Projekte/EinstellungenForm";
import { istLeitung, ladeEinstellungen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { AUTOMATIONEN } from "@/lib/backoffice/projekte/faehigkeiten";
import { euroRund } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Projekte" };
const FELDER = ["feedback_erinnerung_tage", "max_audio_mb", "max_fotos_je_projekt", "tagebuch_aktiv", "referenz_freigabe_aktiv", "portal_token_tage", "montage_tagesstunden", "maengel_erinnerung_tage", "liefertermin_kunde_automatisch", "haftungshinweis_fremdgewerke", "montagebericht_fusstext", "abnahme_fusstext"];

/** Einstellungen (T9, § 5.20) – nur Leitung. Kalkulationsparameter lesend (Pflege im Desk bzw. kalkulation_einstellungen_speichern). */
export default async function Einstellungen() {
  const session = await requireRecht("projekte", "read", "/projekte/einstellungen");
  if (!istLeitung(session)) redirect("/kein-zugriff?bereich=projekte&aktion=cancel");
  const client = projekteClient(session);
  const e = await ladeEinstellungen(client);
  const start = Object.fromEntries(FELDER.map((k) => [k, e[k] ?? ""]));
  return (
    <Shell session={session}>
      <Seitenkopf titel={TEXTE.einstellungen.titel} untertitel={TEXTE.einstellungen.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: TEXTE.einstellungen.titel }]} />
      <div className="flex flex-col gap-6">
        <EinstellungenForm start={start} modified={e.modified} automationen={AUTOMATIONEN} />
        <Kachel titel={TEXTE.einstellungen.abschnitte.kalkulation} unter="Kostensätze und Ziel-DB (lesend) – Werte sind Platzhalter, bis der Inhaber sie festlegt.">
          <ul className="bo-prj-liste">
            {(e.kostensaetze || []).map((k) => (
              <li key={k.name}>
                <span className="min-w-0 flex-1"><span className="bo-prj-titel block">{k.taetigkeit}</span><span className="bo-prj-unter">ab {k.gueltig_ab}{Number(k.platzhalter) ? " · Platzhalter" : ""}</span></span>
                <span className="tabular-nums">{euroRund(k.satz_cent)} / h</span>
              </li>
            ))}
            {(e.ziel_db || []).map((z) => (
              <li key={z.name}>
                <span className="min-w-0 flex-1"><span className="bo-prj-titel block">Ziel-DB {z.projektart}</span></span>
                <span className="tabular-nums">DB1 {z.ziel_db1} % · DB2 {z.ziel_db2} % · DB3 {z.ziel_db3} %</span>
              </li>
            ))}
          </ul>
        </Kachel>
      </div>
    </Shell>
  );
}
