import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice } from "@/lib/backoffice/frappe";
import { darf } from "@/lib/backoffice/auth/rechte";
import { redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import { Pille } from "@/components/Backoffice/StatusBadge";
import MailsListe from "@/components/Backoffice/Crm/MailsListe";
import { ladeMails } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";

export const dynamic = "force-dynamic";
// Titel ohne das Wort „Posteingang“ (10-konzept-crm § 15); der Slug bleibt aus dem Register.
export const metadata = { title: "E-Mails" };

export default async function MailsSeite({ searchParams }) {
  const sp = await searchParams;
  const session = await requireSession("/posteingang");
  if (!darf(session, "posteingang", "read") && !darf(session, "crm", "read")) redirect("/kein-zugriff?bereich=posteingang&aktion=read");
  const client = backoffice(session);
  const postfach = typeof sp?.postfach === "string" ? sp.postfach : undefined;
  const d = await ladeMails(session, client, { postfach });
  return (
    <Shell session={session} breit>
      <Seitenkopf ueber={M_UEBER} titel={T.mails.titel} untertitel={T.mails.regel} kennzahlen={[{ wert: String(d.gesamt), text: T.mails.ueber.toLowerCase() }]} titelZusatz={d.testdaten ? <Pille material="eiche">{T.mails.testdaten}</Pille> : null} />
      {d.fehler?.nichtVerbunden ? (
        <Kachel><Leer text={T.mails.nichtVerbunden} groesse="seite" testid="crm-mails-nicht-verbunden" /></Kachel>
      ) : d.fehler ? (
        <Fehler code={d.fehler.code} message={d.fehler.message} />
      ) : (
        <MailsListe mails={d.mails} zaehler={d.zaehler} faehig={{ zuordnen: d.faehig.zuordnen, sperren: d.faehig.sperren, kontaktNeu: d.faehig.kontaktNeu }} jetzt={new Date().toISOString()} />
      )}
    </Shell>
  );
}

const M_UEBER = "Outlook · Exchange";
