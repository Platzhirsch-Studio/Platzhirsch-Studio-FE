import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import Fehler from "@/components/Backoffice/Fehler";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { KRUMEN_BASIS, params, seitenStart } from "@/lib/backoffice/ablage/seite";
import { ladeInfo, sicher } from "@/lib/backoffice/ablage/daten";
import { groesseText } from "@/lib/backoffice/ablage/regeln";
import { STANDARD_GESPERRT } from "@/lib/backoffice/ablage/labels";
import { T } from "@/lib/backoffice/ablage/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen · Ablage" };

const E = T.einstellungen;

function Zeile({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 shadow-[inset_0_var(--bo-hair,1px)_0_var(--color-bo-line)] first:shadow-none">
      <dt className="text-sm text-bo-text-soft">{label}</dt>
      <dd className="text-right text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

const anAus = (w) => <Pille material={w ? "salbei" : "stein"}>{w ? E.an : E.aus}</Pille>;

export default async function AblageEinstellungen({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/ablage/einstellungen", sp, { leitung: true });
  const r = await sicher(() => ladeInfo(ctx));
  const kopf = (
    <Seitenkopf
      titel={E.titel}
      krumen={[...KRUMEN_BASIS, { titel: E.titel }]}
      untertitel="Grenzen und Standards der Ablage. Zugangsdaten des Speichers stehen nur auf dem Server."
      aktionen={
        <Knopf variant="secondary" icon="Pencil" href="/d/ph-ablage-einstellungen?generisch=1">
          {E.bearbeiten}
        </Knopf>
      }
    />
  );
  if (!r.ok)
    return (
      <Shell session={ctx.session}>
        {kopf}
        <Fehler code={r.fehler.code} message={r.fehler.message} />
      </Shell>
    );
  const i = r.daten;
  const gesperrt = i.gesperrte_endungen?.length ? i.gesperrte_endungen : STANDARD_GESPERRT;
  return (
    <Shell session={ctx.session}>
      {kopf}
      <Bento testid="abl-einstellungen">
        <Kachel className="md:col-span-6" titel={E.speicher}>
          <dl>
            <Zeile label="Anbieter">{E.adapter[i.adapter] || i.adapter}</Zeile>
            <Zeile label={E.direkt}>{anAus(i.direkt_upload)}</Zeile>
            {i.konfig_status !== undefined && <Zeile label="Zustand">{i.konfig_status ? <Pille material="salbei">gesetzt</Pille> : <Pille material="eiche">fehlt</Pille>}</Zeile>}
          </dl>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.grenzen}>
          <dl>
            <Zeile label={E.maxGroesse}>{groesseText(i.max_bytes)}</Zeile>
            <Zeile label={E.teil}>{groesseText(i.chunk_bytes)}</Zeile>
            <Zeile label={E.papierkorb}>{E.tage(i.papierkorb_tage)}</Zeile>
            <Zeile label={E.sperre}>{E.stunden(i.sperre_stunden)}</Zeile>
          </dl>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.freigabe}>
          <dl>
            <Zeile label={E.standardTage}>{E.tage(i.freigabe_standard_tage)}</Zeile>
            <Zeile label={E.maxTage}>{E.tage(i.freigabe_max_tage)}</Zeile>
            <Zeile label={E.passwortPflicht}>{anAus(i.freigabe_passwort_pflicht)}</Zeile>
            <Zeile label={E.portal}>{anAus(i.portal)}</Zeile>
          </dl>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.vorschau}>
          <dl>
            <Zeile label={E.office}>{anAus(i.office_vorschau)}</Zeile>
            <Zeile label={E.erlaubt}>{i.erlaubte_endungen?.length ? i.erlaubte_endungen.join(", ") : E.alleErlaubt}</Zeile>
          </dl>
          <p className="pt-3 text-[13px] text-bo-text-soft">{E.endungen}</p>
          <p className="pt-1 text-[13px] leading-5">{gesperrt.map((e) => `.${e}`).join("  ")}</p>
        </Kachel>
        <Kachel className="md:col-span-12" titel={E.klassen} unter="Fristen sind Vorschläge – Bestätigung durch die Steuerberatung offen">
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {(i.aufbewahrungsklassen || []).map((k) => (
              <li key={k.klasse} className="bo-abl-eingelassen flex flex-col gap-1">
                <span className="text-sm font-semibold">{k.klasse}</span>
                <span className="text-xs text-bo-text-soft">{k.hinweis}</span>
              </li>
            ))}
          </ul>
        </Kachel>
      </Bento>
    </Shell>
  );
}
