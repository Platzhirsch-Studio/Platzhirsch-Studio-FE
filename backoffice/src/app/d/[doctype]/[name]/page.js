import { notFound, redirect } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, doctypeAusSegment, ladeKinderMeta, ladeMeta, ladeWorkflow } from "@/lib/backoffice/frappe";
import { statusTon } from "@/lib/backoffice/frappe/meta";
import { darfDoc, istAdmin } from "@/lib/backoffice/auth/rechte";
import { bereich as bereichDaten, umleitungFuerD } from "@/lib/backoffice/bereiche/index";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Fehler from "@/components/Backoffice/Fehler";
import Formular from "@/components/Backoffice/Formular/Formular";
import WorkflowLeiste from "@/components/Backoffice/Formular/WorkflowLeiste";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";
import { datumZeit } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: name === "neu" ? "Neu" : decodeURIComponent(name) };
}

/**
 * Generisches Formular: /d/<slug>/<name> (oder /neu). Meta → Tabs/Abschnitte/Felder,
 * Workflow-Leiste, Zeitleiste. Fachbereiche registrieren eigene Buttons über
 * `aktionen` (siehe README) auf ihren eigenen Seiten.
 */
export default async function GenerischesFormular({ params, searchParams }) {
  const { doctype: segment, name: rohName } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(rohName);
  const session = await requireSession(`/d/${segment}/${rohName}`);
  const client = backoffice(session);
  const doctype = await doctypeAusSegment(client, segment);
  if (!doctype) notFound();
  const meta = await ladeMeta(client, doctype);
  const neu = name === "neu" && !meta.issingle;
  await requireDocRecht(meta, neu ? "create" : "read", `/d/${segment}/${rohName}`);
  if (meta.istable) notFound();
  // Q-B8: registrierte Bereichsakte gewinnt (307), Admins behalten mit ?generisch=1 das generische Formular.
  const umleitung = meta.issingle ? null : umleitungFuerD({ doctype, name, query: Object.fromEntries(Object.entries(sp || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])), admin: istAdmin(session) });
  if (umleitung) redirect(umleitung);

  const basis = `/d/${meta.slug}`;
  const b = bereichDaten(meta.bereich);
  const krumen = [{ titel: "Zentrale", href: "/" }, ...(b && b.slug !== "zentrale" ? [{ titel: b.titel, href: b.startseite }] : []), { titel: doctypeLabel(meta.name), href: basis }, { titel: neu ? "Neu" : name }];

  let doc = null;
  let docinfo = {};
  let transitions = [];
  let fehler = null;
  if (!neu) {
    try {
      const r = await client.getDocMitInfo(doctype, meta.issingle ? doctype : name);
      doc = r.doc;
      docinfo = r.docinfo || {};
      if (!doc) notFound();
      if (await ladeWorkflow(client, doctype)) transitions = await client.getTransitions(doctype, doc.name);
    } catch (err) {
      if (istBackofficeError(err) && err.code === "not_found") notFound();
      fehler = err;
    }
  }
  const kinderMeta = await ladeKinderMeta(client, meta);
  const rechte = {
    write: darfDoc(session, meta, "write"),
    delete: darfDoc(session, meta, "delete"),
    submit: darfDoc(session, meta, "submit"),
    cancel: darfDoc(session, meta, "cancel"),
    print: darfDoc(session, meta, "print"),
  };
  const nurLesen = neu ? false : !rechte.write || doc?.docstatus === 2 || (doc?.docstatus === 1 && !meta.fields.some((f) => f.allow_on_submit));
  const titel = neu ? `Neu: ${doctypeLabel(meta.name)}` : doc?.[meta.title_field] || name;

  return (
    <Shell session={session}>
      <Seitenkopf titel={titel} untertitel={neu ? undefined : `${doctypeLabel(meta.name)} · ${doc?.name || name}`} hilfe={neu ? meta.description : undefined} krumen={krumen} />
      {fehler ? (
        <Fehler code={istBackofficeError(fehler) ? fehler.code : "unavailable"} message={istBackofficeError(fehler) ? fehler.message : undefined} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-4">
            {!neu && (
              <WorkflowLeiste
                doctype={doctype}
                name={doc.name}
                status={doc.status}
                ton={statusTon(meta, doc.status, client.index)}
                docstatus={doc.docstatus || 0}
                transitions={transitions}
                rechte={rechte}
                submittable={meta.is_submittable}
                druckHref={`/druck/${meta.slug}/${encodeURIComponent(doc.name)}`}
                listeHref={basis}
              />
            )}
            <Formular meta={meta} kinderMeta={kinderMeta} doc={doc} neu={neu} nurLesen={nurLesen} listeHref={basis} nachSpeichernBasis={basis} />
          </div>
          {!neu && (
            <aside className="min-w-0 space-y-4">
              <Zeitleiste doctype={doctype} name={doc.name} docinfo={docinfo} darfSchreiben={rechte.write} feldLabels={Object.fromEntries(meta.fields.filter((f) => f.label).map((f) => [f.fieldname, anzeige(f.label)]))} />
              <dl className="grid gap-2 rounded-[10px] border border-bo-line bg-bo-surface p-4 text-xs text-bo-text-soft">
                <div className="min-w-0">
                  <dt>Angelegt</dt>
                  <dd className="truncate text-bo-text">
                    {datumZeit(doc.creation)} · {doc.owner}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt>Geändert</dt>
                  <dd className="truncate text-bo-text">
                    {datumZeit(doc.modified)} · {doc.modified_by}
                  </dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      )}
    </Shell>
  );
}
