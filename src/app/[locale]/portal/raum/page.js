import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPortal } from "@/lib/portal/dal";
import { adapterName } from "@/lib/portal/config";
import { portalMetadata } from "@/lib/portal/metadata";
import { Badge, Card, Empty, Overline } from "@/components/Portal/Core/ui";
import { RAUM_STATUS } from "@/lib/raumzwilling/config";
import { leseRaum } from "@/lib/raumzwilling/store";
import { stelleDemoBereit } from "@/lib/raumzwilling/seed";

// /de/portal/raum – „Ihr Raum als Zwilling“: Übersicht der Räume aller Projekte.

export const generateMetadata = portalMetadata({ title: "Ihr Raum", robots: { index: false, follow: false } });

const SCHRITTE = [
  ["Sie filmen", "Etwa 90 Sekunden mit dem Handy, langsam durch den Raum. Die Aufnahmehilfe zeigt, wie."],
  ["Wir bauen Ihren Raum", "Auf einem Rechner in unserem Studio entsteht daraus ein 3D-Raum, den Sie drehen und begehen. Nicht in einer fremden Cloud."],
  ["Wir planen darin", "Ihr Beratungsteam setzt die besprochenen Stücke in echten Herstellermaßen in Ihren Raum."],
  ["Harald zeichnet", "Harald Menghin zeichnet Ihr Konzept von Hand. Seine Skizze liegt als eigene Ebene neben Ihrem Raum."],
];

export default async function RaumUebersicht({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const portal = await getPortal("/de/portal/raum");
  const sp = await searchParams;
  const projekte = await portal.listProjects();
  const eintraege = await Promise.all(
    projekte.map(async (p) => {
      await stelleDemoBereit(portal.customerId, p.id, p);
      const raum = await leseRaum(p.id);
      return { p, raum: raum && raum.customerId === portal.customerId ? raum : null };
    })
  );
  const geloescht = typeof sp?.geloescht === "string" ? sp.geloescht : null;

  return (
    <>
      <header className="mb-6 lg:mb-8">
        <Overline>Ihr Raum als Zwilling</Overline>
        <h1 className="mt-2 font-display text-[2rem] leading-tight text-ink sm:text-5xl">Wir kennen Ihren Raum, bevor wir klingeln.</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/80">
          Aus einem kurzen Handyvideo entsteht Ihr Raum als 3D-Modell, fotoecht und mit Maßen. Darin planen wir mit Ihnen, und Harald Menghin zeichnet Ihr Konzept von Hand. Den Termin vor Ort ersetzt das nicht: Wir kommen trotzdem, aber besser vorbereitet.
        </p>
      </header>

      {adapterName() === "mock" && (
        <p className="mb-5 border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-ink">Demo-Daten: Der gezeigte Raum ist ein synthetischer Testraum, keine Aufnahme. Keine Preise.</p>
      )}
      {geloescht && (
        <p role="status" className="mb-5 border border-success/40 bg-success/10 px-4 py-3 text-sm text-ink">
          Der Raum zu Projekt {geloescht} ist gelöscht: 3D-Raum, Standbilder, Kommentare und Sprachnachrichten.
        </p>
      )}

      <Card className="mb-6" aria-labelledby="raeume-titel">
        <h2 id="raeume-titel" className="mb-4 font-display text-xl text-ink sm:text-2xl">
          Ihre Räume
        </h2>
        {eintraege.length === 0 ? (
          <Empty>Sobald Sie ein Projekt bei uns haben, können Sie hier Ihren Raum filmen und ansehen.</Empty>
        ) : (
          <ul className="divide-y divide-ink/10">
            {eintraege.map(({ p, raum }) => {
              const status = raum?.status || "aufnahme-offen";
              const s = RAUM_STATUS[status];
              return (
                <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink">{p.room || p.title}</p>
                    <p className="text-sm text-ink/70">
                      {p.title} · Projekt {p.id}
                    </p>
                    <div className="mt-2">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                  </div>
                  <Link
                    href={`/de/portal/raum/${p.id}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    {status === "bereit" || status === "nur-fotos" ? "Raum ansehen" : status === "in-arbeit" ? "Stand ansehen" : "Raumvideo senden"}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card aria-labelledby="ablauf-titel">
        <h2 id="ablauf-titel" className="mb-4 font-display text-xl text-ink sm:text-2xl">
          So entsteht Ihr Raum
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCHRITTE.map(([t, x], i) => (
            <li key={t} className="border-t-2 border-ink pt-3">
              <p className="text-xs font-semibold tracking-[0.2em] text-gold-text">0{i + 1}</p>
              <p className="mt-1 font-semibold text-ink">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/80">{x}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-ink/75">Maße aus Video, Aufmaß vor Bestellung. Ihre Aufnahme sehen nur Sie und Ihr Beratungsteam, und Sie können sie jederzeit löschen.</p>
      </Card>
    </>
  );
}
