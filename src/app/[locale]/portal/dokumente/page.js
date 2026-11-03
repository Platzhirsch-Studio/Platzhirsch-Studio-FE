import { Download, FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { tx } from "@/lib/portal/i18n";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { DOCUMENT_TYPE_KEYS, amountLabel } from "@/lib/portal/constants";
import { formatDate } from "@/lib/portal/format";
import { Badge, Card, Empty } from "@/components/Portal/Core/ui";
import { DevDataNotice, DocsPageHeader, FilterChips } from "@/components/Portal/Docs/SectionNav";
import PdfPreview from "@/components/Portal/Docs/PdfPreview";
import FilterSelects from "@/components/Portal/Docs/FilterSelects";
import { documentStatus, documentTypeLabel, focusRing } from "@/components/Portal/Docs/labels";
import { portalMetadata } from "@/lib/portal/metadata";
import { SITE_NAME } from "@/lib/site";

export const generateMetadata = portalMetadata({
  title: "Dokumente",
  robots: { index: false, follow: false },
});

const BASE = "/de/portal/dokumente";

function href({ typ, zahlung, projekt }) {
  const q = new URLSearchParams();
  if (typ) q.set("typ", typ);
  if (zahlung) q.set("zahlung", zahlung);
  if (projekt) q.set("projekt", projekt);
  const s = q.toString();
  return s ? `${BASE}?${s}` : BASE;
}

const one = (v) => (Array.isArray(v) ? v[0] : v);

export default async function DokumentePage({ searchParams }) {
  const sp = await searchParams;
  const t = await getTranslations();
  const demo = adapterName() === "mock";
  const portal = await getPortal(BASE);
  const [all, projects] = await Promise.all([portal.listDocuments(), portal.listProjects()]);

  // Unknown filter values are ignored (never passed to the adapter unchecked).
  const typ = DOCUMENT_TYPE_KEYS.includes(one(sp.typ)) ? one(sp.typ) : "";
  const zahlung = ["offen", "bezahlt"].includes(one(sp.zahlung)) ? one(sp.zahlung) : "";
  const projekt = projects.some((p) => p.id === one(sp.projekt)) ? one(sp.projekt) : "";

  const inProject = all.filter((d) => !projekt || d.projectId === projekt);
  const docs = inProject.filter(
    (d) => (!typ || d.type === typ) && (!zahlung || (d.type === "rechnung" && (zahlung === "bezahlt" ? d.status === "bezahlt" : d.status !== "bezahlt")))
  );
  const invoices = inProject.filter((d) => d.type === "rechnung");
  const openInvoices = invoices.filter((d) => d.status !== "bezahlt").length;
  const projectTitle = Object.fromEntries(projects.map((p) => [p.id, p.title]));

  const typeOptions = [
    { value: "", label: "Alle", count: inProject.length, href: href({ zahlung: "", projekt }) },
    ...DOCUMENT_TYPE_KEYS.map((k) => ({
      value: k,
      label: documentTypeLabel(k, true),
      count: inProject.filter((d) => d.type === k).length,
      href: href({ typ: k, projekt, zahlung: k === "rechnung" ? zahlung : "" }),
    })),
  ];

  return (
    <>
      {/* Druck 02.11.: Kopfzeile des Ausdrucks (Studio, Kundin, Stand); Filter und Knöpfe bleiben am Bildschirm,
          die Liste wird zur Tabelle Dokument / Nummer / Datum / Projekt / Betrag / Status. */}
      <p className="hidden border-b border-ink/10 pb-3 text-[13px] text-ink/70 print:block" data-dok-print-head="">
        {SITE_NAME} · Dokumente · {portal.customer.displayName} · Stand {formatDate(new Date().toISOString().slice(0, 10))}
        {projekt && projectTitle[projekt] ? ` · Projekt ${projectTitle[projekt]}` : ""}
      </p>
      <DevDataNotice show={demo} />
      <DocsPageHeader
        overline="Ihre Unterlagen"
        title="Dokumente"
        intro="Angebote, Auftragsbestätigungen, Lieferscheine und Rechnungen zu Ihren Projekten – jederzeit abrufbar und als PDF zum Herunterladen."
      />

      {docs.length > 0 && (
        <table className="hidden w-full border-collapse text-[13px] text-ink print:table" data-dok-print-tabelle="">
          <thead>
            <tr className="border-b border-ink/30 text-left text-ink/70">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Dokument
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Nummer
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Datum
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Projekt
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Betrag
              </th>
              <th scope="col" className="py-2 font-semibold">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={`${d.id}-druck`} className="border-b border-ink/10 align-top">
                <td className="py-2 pr-3">
                  <span className="block font-semibold">{documentTypeLabel(d.type)}</span>
                  {d.title}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap">{d.number}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{formatDate(d.date)}</td>
                <td className="py-2 pr-3">{projectTitle[d.projectId] || "–"}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{d.amount != null ? d.amount : demo ? amountLabel(d) : "siehe PDF"}</td>
                <td className="py-2 whitespace-nowrap">{documentStatus(d).label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Card aria-labelledby="dok-liste" className="overflow-hidden p-0! sm:p-0! print:hidden">
        <div className="space-y-4 border-b border-ink/10 p-5 sm:p-7">
          <h2 id="dok-liste" className="sr-only">
            Dokumentenliste
          </h2>
          <FilterChips label="Dokumentart" options={typeOptions} active={typ} />
          {/* N6 (R4): Zahlung und Projekt kompakt in einer Zeile statt zwei weiterer Chip-Reihen. */}
          <FilterSelects
            base={BASE}
            typ={typ}
            zahlung={zahlung}
            projekt={projekt}
            payment={
              (typ === "rechnung" || !typ) && invoices.length > 0
                ? [
                    { value: "", label: tx(t, "Portal.docs.paymentAll", "Alle Zahlungen") },
                    { value: "offen", label: tx(t, "Portal.docs.paymentOpen", "Offen"), count: openInvoices },
                    { value: "bezahlt", label: tx(t, "Portal.docs.paymentPaid", "Bezahlt"), count: invoices.length - openInvoices },
                  ]
                : null
            }
            projects={projects.length > 1 ? [{ value: "", label: tx(t, "Portal.docs.projectAll", "Alle Projekte") }, ...projects.map((p) => ({ value: p.id, label: p.title }))] : null}
          />
        </div>

        <p className="sr-only" role="status">
          {docs.length} {docs.length === 1 ? "Dokument" : "Dokumente"} angezeigt
        </p>

        {docs.length === 0 ? (
          <div className="p-5 sm:p-7">
            <Empty>
              {typ ? `Keine ${documentTypeLabel(typ, true)} in dieser Auswahl.` : "Noch keine Dokumente vorhanden."} Neue Dokumente erscheinen hier, sobald wir sie
              freigeben.
            </Empty>
          </div>
        ) : (
          <ul className="divide-y divide-ink/10">
            {docs.map((d) => {
              const st = documentStatus(d);
              const fileHref = `/api/portal/dokumente/${encodeURIComponent(d.id)}`;
              return (
                <li key={d.id} id={d.id} className="scroll-mt-32 p-5 target:bg-gold/10 sm:px-7">
                  <div className="flex gap-3 sm:gap-4">
                    <FileText size={20} className="mt-0.5 shrink-0 text-ink/75" aria-hidden="true" />
                    <div className="min-w-0 flex-1 lg:flex lg:items-start lg:justify-between lg:gap-8">
                     <div className="min-w-0 lg:flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-ink">{documentTypeLabel(d.type)}</span>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </p>
                      <h3 className="mt-1 text-[15px] text-ink">{d.title}</h3>
                      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px] text-ink/70">
                        <dt>Nummer</dt>
                        <dd className="break-all">{d.number}</dd>
                        <dt>Datum</dt>
                        <dd>{formatDate(d.date)}</dd>
                        {projectTitle[d.projectId] && (
                          <>
                            <dt>Projekt</dt>
                            <dd>{projectTitle[d.projectId]}</dd>
                          </>
                        )}
                        <dt>Betrag</dt>
                        <dd>{d.amount != null ? d.amount : demo ? amountLabel(d) : "siehe PDF"}</dd>
                      </dl>
                      {d.type === "rechnung" && d.status !== "bezahlt" && (
                        <p className="mt-2 text-[13px] text-ink/80">Zahlungsdetails stehen im PDF. Bei Fragen zur Rechnung erreichen Sie uns unter {portal.customer.advisor?.phone}.</p>
                      )}
                     </div>
                      <div className="mt-3 flex flex-wrap gap-2 lg:mt-0 lg:shrink-0 lg:justify-end">
                        {d.file ? (
                          <>
                            <PdfPreview href={fileHref} title={`${documentTypeLabel(d.type)} ${d.number}`} />
                            <a
                              href={`${fileHref}?download=1`}
                              download
                              className={`inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-deep ${focusRing}`}
                            >
                              <Download size={16} aria-hidden="true" /> PDF herunterladen
                            </a>
                          </>
                        ) : (
                          <p className="text-[13px] text-ink/70">PDF folgt.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="mt-5 text-[13px] leading-relaxed text-ink/70">
        Beträge erscheinen hier, sobald sie im Backoffice gepflegt sind; maßgeblich ist immer das PDF-Dokument. Die Dateien werden nur nach Anmeldung ausgeliefert und nicht
        zwischengespeichert.
      </p>
    </>
  );
}
