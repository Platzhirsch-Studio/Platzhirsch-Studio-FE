import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, doctypeAusSegment, ladeMeta } from "@/lib/backoffice/frappe";
import { LAYOUT_FELDTYPEN, NICHT_ANZEIGEN } from "@/lib/backoffice/frappe/meta";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import DruckKnopf from "./DruckKnopf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Druckansicht" };

/**
 * Druckansicht: /druck/<slug>/<name>?format=<Druckformat>
 * Frappe-Modus: PDF über frappe.utils.print_format.download_pdf (Route /druck/…/pdf).
 * Mock: HTML-Vorschau mit Hinweis – die echten Druckformate (ph_basis.html) rendert Frappe.
 */
export default async function Druck({ params, searchParams }) {
  const { doctype: segment, name: rohName } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(rohName);
  const session = await requireSession(`/druck/${segment}/${rohName}`);
  const client = backoffice(session);
  const doctype = await doctypeAusSegment(client, segment);
  if (!doctype) notFound();
  const meta = await ladeMeta(client, doctype);
  await requireDocRecht(meta, "print");
  const doc = await client.getDoc(doctype, name);
  const format = typeof sp?.format === "string" ? sp.format : "Standard";
  const felder = meta.fields.filter((f) => !LAYOUT_FELDTYPEN.has(f.fieldtype) && !NICHT_ANZEIGEN.has(f.fieldtype) && !f.hidden && f.fieldtype !== "Table" && doc[f.fieldname] !== "" && doc[f.fieldname] !== null && doc[f.fieldname] !== undefined);
  const tabellen = meta.fields.filter((f) => f.fieldtype === "Table" && Array.isArray(doc[f.fieldname]) && doc[f.fieldname].length);
  const wert = (f, v) => (f.cent ? cent(v) : f.fieldtype === "Date" ? datum(v) : f.fieldtype === "Datetime" ? datumZeit(v) : f.fieldtype === "Check" ? (v ? "ja" : "nein") : String(v).replace(/<[^>]*>/g, ""));
  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <div className="bo-no-print mb-6 flex items-center justify-between rounded-bo border border-st-orange/50 bg-st-orange/10 px-3 py-2 text-xs text-bo-text">
        <span>
          {client.modus === "mock" ? "Vorschau aus Beispieldaten – das Druckformat (Jinja, ph_basis.html) rendert erst Frappe." : `Druckformat „${format}“ – PDF kommt von Frappe.`}
        </span>
        <span className="flex gap-2">
          {client.modus === "frappe" && (
            <a className="underline" href={`/druck/${meta.slug}/${encodeURIComponent(name)}/pdf?format=${encodeURIComponent(format)}`}>
              PDF
            </a>
          )}
          <DruckKnopf />
        </span>
      </div>
      <header className="mb-6 flex items-end justify-between border-b border-black/20 pb-3">
        <p className="bo-wortmarke text-lg">PLATZHIRSCH</p>
        <div className="text-right text-xs">
          <p className="font-semibold">{meta.name.replace(/^PH /, "")}</p>
          <p>{doc.name}</p>
          <p>{datum(doc.modified)}</p>
        </div>
      </header>
      <h1 className="text-xl font-semibold">{doc[meta.title_field] || doc.name}</h1>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {felder.map((f) => (
          <div key={f.fieldname} className="flex gap-2 border-b border-black/10 py-1">
            <dt className="w-40 shrink-0 text-black/60">{f.label}</dt>
            <dd className="min-w-0 break-words">{wert(f, doc[f.fieldname])}</dd>
          </div>
        ))}
      </dl>
      {tabellen.map((t) => (
        <section key={t.fieldname} className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">{t.label}</h2>
          <table className="w-full text-xs">
            <tbody>
              {doc[t.fieldname].map((z, i) => (
                <tr key={z.name || i} className="border-b border-black/10">
                  <td className="py-1 pr-2 text-black/60">{i + 1}</td>
                  {Object.entries(z)
                    .filter(([k, v]) => !["name", "doctype", "idx", "parent", "parentfield", "parenttype", "owner", "creation", "modified", "modified_by", "docstatus"].includes(k) && v !== "" && v !== null && typeof v !== "object")
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <td key={k} className="py-1 pr-2">
                        <span className="block text-[10px] text-black/50">{k}</span>
                        {/_cent$/.test(k) ? cent(v) : String(v)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <footer className="mt-10 text-[10px] text-black/50">Erstellt im Backoffice am {datumZeit(new Date())} von {session.name}. {client.modus === "mock" ? "TEST – Beispieldaten." : ""}</footer>
    </main>
  );
}
