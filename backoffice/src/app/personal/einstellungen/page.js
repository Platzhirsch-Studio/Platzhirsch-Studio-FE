import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Formular from "@/components/Backoffice/Formular/Formular";
import Fehler from "@/components/Backoffice/Fehler";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeEinstellungen, sicher } from "@/lib/backoffice/personal/daten";
import { ladeMeta, ladeKinderMeta } from "@/lib/backoffice/frappe";
import { darfEinstellungen, darfEinstellungenSchreiben } from "@/lib/backoffice/personal/rollen";
import { einstellungenSpeichernAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Personal" };

// T9 Einstellungen (Konzept § 5.12): Formular aus den Metadaten von PH Personal Einstellungen, Strg/⌘+S,
// Feldfehler aus validate (Löschfrist mindestens 6 Monate, GlBG § 15). Hinweisfelder zu Server-Schlüsseln entfallen.
export default async function Einstellungen({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/einstellungen", sp, darfEinstellungen);
  const r = await sicher(() => ladeEinstellungen(ctx));
  const metaRoh = await ladeMeta(ctx.client, "PH Personal Einstellungen");
  const meta = { ...metaRoh, fields: metaRoh.fields.filter((f) => f.fieldname !== "hinweis_schluessel") };
  const kinderMeta = await ladeKinderMeta(ctx.client, meta);
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf titel={T.einstellungen.titel} untertitel={T.einstellungen.unter} krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.einstellungen.titel }]} />
      {!r.ok ? <Fehler code={r.fehler.code} /> : <Formular meta={meta} kinderMeta={kinderMeta} doc={{ ...r.daten, name: "PH Personal Einstellungen" }} neu={false} nurLesen={!darfEinstellungenSchreiben(ctx.rolle)} listeHref="/personal" onSpeichern={einstellungenSpeichernAction} />}
    </PersonalHuelle>
  );
}
