// „Meine Stücke & Pflege“ im Kundenportal (/de/portal/pflege), Service Nr. 4.
// Server-Komponente. Daten nur über getPortal() (Sitzung geprüft, nur eigene
// Datensätze); Aufbereitung rein in src/lib/service/pflege/portal.js.
// Pflege-Abos aus Frappe kommen, sobald der Adapter listCareSubscriptions()
// liefert (Schnittstelle: Marktresearch/digital/features/service-pflege-schnittstelle.md);
// bis dahin zeigt jedes Stück „Kein Pflege-Abo“ und den Anfrage-Link.
import Link from "next/link";
import { ArrowRight, Check, Info } from "lucide-react";
import { formatDate } from "@/lib/portal/format";
import { Badge, Empty } from "@/components/Portal/Core/ui";
import { focusRing } from "@/components/Portal/Docs/labels";
import { PORTAL_COPY as T } from "@/lib/service/pflege/copy";
import { materialCopy } from "@/lib/service/pflege/materials";

const mats = materialCopy("de");

function nextLabel(next) {
  if (next.kind === "geplant") return T.terminGeplant.replace("{date}", formatDate(next.date));
  if (next.kind === "faellig") return T.terminFaellig.replace("{date}", formatDate(next.date));
  if (next.kind === "abLieferung") return T.terminAbLieferung;
  return T.terminOffen;
}

function anfrageHref(entry, abo = false) {
  const params = new URLSearchParams();
  params.set("stueck", [entry.item.brand, entry.item.name].filter(Boolean).join(" ").slice(0, 120));
  if (entry.materials.length) params.set("material", entry.materials.join(","));
  if (abo) params.set("art", "abo");
  return `/de/pflege-service?${params.toString()}#anfrage`;
}

function Piece({ entry }) {
  const { item, pass, materials, care, abo, next } = entry;
  const headingId = `pflege-${item.id}`;
  return (
    <li>
      <article aria-labelledby={headingId} className="flex h-full flex-col border border-ink/10 bg-white p-5 sm:p-6">
        {item.brand && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">{item.brand}</p>}
        <h2 id={headingId} className="mt-2 font-display text-2xl text-ink">
          {item.name}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{T.status[item.status] || item.status}</Badge>
          <Badge tone={abo ? "gold" : "neutral"}>{abo ? T.aboAktiv : T.aboKeins}</Badge>
        </div>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink/80">
          <dt>{T.naechsterTermin}</dt>
          <dd className="text-ink">{nextLabel(next)}</dd>
          <dt>{T.material}</dt>
          <dd className="text-ink">{materials.length ? materials.map((m) => mats[m].title).join(", ") : T.materialUnbekannt}</dd>
        </dl>

        {care.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink">{T.herstellerHinweise}</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {care.map((line) => (
                <li key={line} className="flex gap-2">
                  <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {materials.map((m) => (
          <details key={m} className="mt-4 border-t border-ink/10 pt-3">
            <summary className={`flex min-h-11 cursor-pointer items-center text-sm font-semibold text-ink ${focusRing}`}>
              {T.anleitung}: {mats[m].title}
            </summary>
            <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
              {mats[m].alltag.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </details>
        ))}

        <div className="mt-auto flex flex-col gap-1 pt-5">
          <Link href={anfrageHref(entry, !abo)} prefetch={false} className={`inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-current ${focusRing}`}>
            {abo ? T.anfragen : T.aboAnfragen} <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {pass && (
            <Link href={`/de/portal/pass/${encodeURIComponent(pass.id)}`} className={`inline-flex min-h-11 items-center gap-1 text-sm text-ink/80 hover:text-ink ${focusRing}`}>
              {T.passLink} <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </article>
    </li>
  );
}

/** @param {{entries: ReturnType<import("@/lib/service/pflege/portal").buildCareEntries>}} props */
export default function MeineStuecke({ entries }) {
  return (
    <>
      {entries.length === 0 ? (
        <Empty>{T.empty}</Empty>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="pflege-stuecke">
          {entries.map((entry) => (
            <Piece key={`${entry.project.id}-${entry.item.id}`} entry={entry} />
          ))}
        </ul>
      )}
      <div className="mt-8 flex flex-col gap-3 bg-bone p-5 text-sm leading-relaxed text-ink/80 sm:flex-row sm:items-start">
        <Info size={20} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
        <div>
          <p>{T.hinweis}</p>
          <Link href="/de/pflege-service" className={`mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-ink ${focusRing}`}>
            {T.serviceLink} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
