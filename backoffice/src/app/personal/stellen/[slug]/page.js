import Link from "next/link";
import { notFound } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Fehler from "@/components/Backoffice/Fehler";
import Avatar from "@/components/Backoffice/Avatar";
import Formular from "@/components/Backoffice/Formular/Formular";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import { Icon } from "@/components/Backoffice/icons";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { StelleWorkflowKnoepfe } from "@/components/Backoffice/Personal/Stellen";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeStelle } from "@/lib/backoffice/personal/daten";
import { ladeMeta, ladeKinderMeta } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { darfStellen, darfVertraulich, darfBearbeiten } from "@/lib/backoffice/personal/rollen";
import { stelleCheckliste, entgeltSatz, gueltigInfo } from "@/lib/backoffice/personal/regeln";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { stelleSpeichernAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { langDatum } from "@/lib/backoffice/personal/zeit";
import { anzeige } from "@/lib/backoffice/labels";
import "@/components/Backoffice/Personal/personal.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: p }) {
  const { slug } = await p;
  return { title: `${decodeURIComponent(slug)} · Personal` };
}

// T5 Stellenakte (Konzept § 5.4): Kopf mit Status + GlBG-Kennzeichen, Checkliste mit Sprunglinks statt Band,
// Formular aus den Metadaten (Stelle · Englisch · Französisch · Italienisch · Entgelt · Veröffentlichung),
// Entwurf/Pausiert speichern automatisch, aktive Stellen nur über die Speicherleiste. Rechts: Website, Bewerbungen,
// Verlauf.
export default async function Stellenakte({ params: p, searchParams }) {
  const { slug } = await p;
  const name = decodeURIComponent(slug);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/personal/stellen/${slug}`, sp, darfStellen);
  let daten;
  try {
    daten = await ladeStelle(ctx, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <PersonalHuelle ctx={ctx}>
        <Fehler code={istBackofficeError(err) ? err.code : "unavailable"} zurueckHref="/personal/stellen" />
      </PersonalHuelle>
    );
  }
  const { stelle: s, docinfo, transitions, bewerbungen } = daten;
  const metaRoh = await ladeMeta(ctx.client, "PH Stelle");
  const UMBENENNEN = { slug: T.stellen.adresse, website_url: "Link auf der Website" };
  const felder = metaRoh.fields.filter((f) => darfVertraulich(ctx.rolle) || !f.permlevel).map((f) => (UMBENENNEN[f.fieldname] ? { ...f, label: UMBENENNEN[f.fieldname], description: T.stellen.adresseHilfe } : f));
  const meta = { ...metaRoh, fields: felder };
  const kinderMeta = await ladeKinderMeta(ctx.client, meta);
  const check = stelleCheckliste(s);
  const offen = check.filter((c) => c.blockiert);
  const g = gueltigInfo(s, ctx.heute);
  const nurLesen = !darfBearbeiten(ctx.rolle) && ctx.rolle !== "admin";
  const autosave = ["Entwurf", "Pausiert", "Archiviert"].includes(s.status);
  const satz = entgeltSatz(s);
  const neu = bewerbungen.filter((b) => b.status === "Eingegangen").length;
  const eingestellt = bewerbungen.filter((b) => b.status === "Eingestellt");
  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={s.titel}
        untertitel={`${s.kategorie} · ${anzeige(s.beschaeftigungsart)}`}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.stellen.titel, href: "/personal/stellen" }, { titel: s.titel }]}
        titelZusatz={
          <span className="inline-flex flex-wrap items-center gap-2">
            <StatusBadge wert={s.status} text={statusText("stelle", s.status)} ton={statusTon("stelle", s.status)} groesse="m" />
            {!offen.length && (
              <span className="bo-per-kennzeichen" data-ton="salbei" data-testid="per-glbg-ok">
                <Icon name="Check" className="size-3.5" />
                {T.stellen.glbgOk}
              </span>
            )}
          </span>
        }
        aktionen={
          <div className="flex flex-wrap items-center gap-2">
            <DruckKnopf doctype="PH Stelle" name={s.name} titel={`${T.stellen.aushang}: ${s.titel}`} format="PH Stelle Aushang" pdf={ctx.client.modus === "frappe"} knopf={{ variant: "ghost", children: T.stellen.aushang }} />
            {!nurLesen && <StelleWorkflowKnoepfe stelle={{ name: s.name, titel: s.titel, status: s.status }} aktionen={transitions.map((t) => t.action)} checklisteOffen={offen.length > 0} besetztDurch={eingestellt.length === 1 ? eingestellt[0].name : null} />}
          </div>
        }
      />
      {check.length > 0 && (
        <Kachel className="mb-6" titel={T.stellen.checkliste} dicht testid="per-glbg-checkliste">
          <ul className="flex flex-col gap-2">
            {check.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
                <span className="flex items-center gap-3 text-[14px]">
                  <span className={`grid size-6 place-items-center rounded-full ${c.blockiert ? "bg-bo-eiche-soft text-bo-eiche-text" : "bg-bo-messing-soft text-bo-messing-text"}`} aria-hidden="true">
                    <Icon name={c.blockiert ? "CircleDashed" : "Info"} className="size-3.5" />
                  </span>
                  {T.stellen.check[c.id]}
                  <span className="bo-per-sr">{c.blockiert ? "blockiert Veröffentlichen" : "Hinweis"}</span>
                </span>
                <a href={`#feld-${c.feld}`} className="bo-per-link text-[13px]">
                  {T.stellen.zumTab}
                </a>
              </li>
            ))}
          </ul>
        </Kachel>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0" data-testid="per-stelle-formular">
          <Formular meta={meta} kinderMeta={kinderMeta} doc={s} neu={false} nurLesen={nurLesen} listeHref="/personal/stellen" nachSpeichernBasis="/personal/stellen" autosave={autosave} onSpeichern={stelleSpeichernAction} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <Kachel titel={T.stellen.websiteKachel} unter={s.status === "Aktiv" ? `…/de/karriere/${s.name}` : statusText("stelle", s.status)} testid="per-stelle-website">
            <dl className="bo-per-fakten">
              <div>
                <dt>{T.stellen.adresse}</dt>
                <dd className="text-[13px]" title={T.stellen.adresseHilfe}>
                  /karriere/{s.name}
                </dd>
              </div>
              <div>
                <dt>{T.stellen.spalten.gueltig}</dt>
                <dd>{g ? `${langDatum(s.gueltig_bis)} · ${T.stellen.tageRest(g.rest)}` : "–"}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <p className="mb-1 text-[12px] text-bo-text-soft">{T.stellen.entgeltVorschau}</p>
              <p className="bo-per-vorschau" data-testid="per-entgelt-satz">
                {satz || T.stellen.entgeltFehltSatz}
              </p>
            </div>
          </Kachel>
          {bewerbungen.length > 0 || neu ? (
            <Kachel titel={T.stellen.tabs.bewerbungen} unter={`${bewerbungen.length} · neu ${neu}`} href={`/personal/bewerbungen?stelle=${encodeURIComponent(s.name)}`} oeffnenLabel="Bewerbungen dieser Stelle" testid="per-stelle-bewerbungen">
              <ul className="bo-per-zeilen">
                {bewerbungen.slice(0, 5).map((b) => (
                  <li key={b.name} className="bo-per-zeile">
                    <Avatar name={Number(b.pseudonymisiert) ? "–" : `${b.vorname} ${b.nachname}`} groesse={32} />
                    <Link href={`/personal/bewerbungen/${encodeURIComponent(b.name)}`} className="bo-per-link truncate text-[14px]">
                      {Number(b.pseudonymisiert) ? "Personendaten gelöscht" : `${b.vorname} ${b.nachname}`}
                    </Link>
                    <StatusBadge wert={b.status} text={statusText("bewerbung", b.status)} ton={statusTon("bewerbung", b.status)} groesse="xs" />
                  </li>
                ))}
              </ul>
            </Kachel>
          ) : (
            <Kachel titel={T.stellen.tabs.bewerbungen} testid="per-stelle-bewerbungen">
              <p className="text-[14px] text-bo-text-soft">{T.stellen.keineBewerbungen}</p>
            </Kachel>
          )}
          <Zeitleiste doctype="PH Stelle" name={s.name} docinfo={docinfo} darfSchreiben={!nurLesen} feldLabels={Object.fromEntries(meta.fields.filter((f) => f.label).map((f) => [f.fieldname, anzeige(f.label)]))} />
        </aside>
      </div>
    </PersonalHuelle>
  );
}
