import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PencilRuler } from "lucide-react";
import { adapterName } from "@/lib/portal/config";
import { portalMetadata } from "@/lib/portal/metadata";
import { Badge, Card, Overline } from "@/components/Portal/Core/ui";
import { DATUM_ZEIT, RAUM_CONFIG, RAUM_STATUS } from "@/lib/raumzwilling/config";
import { raumSeite } from "@/lib/raumzwilling/access";
import { oeffentlicheSicht } from "@/lib/raumzwilling/zugriff";
import Aufnahmehilfe from "@/components/Portal/Raum/Aufnahmehilfe";
import VideoUpload from "@/components/Portal/Raum/VideoUpload";
import RaumAnsicht from "@/components/Portal/Raum/RaumAnsicht";
import LoeschenBereich from "@/components/Portal/Raum/LoeschenBereich";

// /de/portal/raum/<projekt> – der Raum des Kunden als Zwilling.
// Zugriff: Portal-Session (eigenes Projekt), Team-Cookie oder einmaliger Raum-Link.

export const generateMetadata = portalMetadata({ title: "Ihr Raum", robots: { index: false, follow: false }, referrer: "no-referrer" });

export default async function RaumSeite({ params, searchParams }) {
  const { locale, projekt } = await params;
  if (locale !== "de") notFound();
  const e = await raumSeite(projekt, `/de/portal/raum/${projekt}`);
  if (e.nichtGefunden) notFound();
  const sp = await searchParams;
  const rolle = e.zugriff.rolle;
  const raum = oeffentlicheSicht(e.raum, rolle);
  const status = raum?.status || "aufnahme-offen";
  const s = RAUM_STATUS[status];
  const titel = raum?.titel || e.projekt?.room || "Ihr Raum";
  const kannVideo = e.zugriff.rechte.includes("video");
  const hatInhalt = raum && (raum.splat || raum.standbilder?.length || raum.kommentare?.length || raum.video);

  return (
    <>
      {adapterName() === "mock" && rolle !== "gast" && (
        <p className="mb-4 border border-gold/50 bg-gold/10 px-3 py-2 text-xs text-ink sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">Demo-Daten: Antworten des Teams sind Beispieltexte. Keine Preise.</p>
      )}

      <header className="mb-5 lg:mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {rolle !== "gast" && (
            <Link
              href={rolle === "team" ? "/de/portal/raum/team" : "/de/portal/raum"}
              className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <ArrowLeft size={16} aria-hidden="true" /> {rolle === "team" ? "Alle Räume (Team)" : "Alle Räume"}
            </Link>
          )}
          <span aria-hidden="true" className="text-ink/30">
            ·
          </span>
          <Overline>Ihr Raum als Zwilling</Overline>
        </div>
        <h1 className="mt-1 font-display text-[2rem] leading-tight text-ink sm:mt-2 sm:text-5xl">{titel}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={s.tone}>{s.label}</Badge>
          <Badge>Projekt {projekt}</Badge>
          {rolle === "team" && (
            <Link
              href={`/de/portal/raum/${projekt}/bearbeiten`}
              className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <PencilRuler size={15} aria-hidden="true" /> Im Team-Werkzeug bearbeiten
            </Link>
          )}
          {rolle === "kunde" && (
            <Link href={`/de/portal/projekte/${projekt}`} className="inline-flex min-h-11 items-center px-2 text-sm text-ink/80 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              Zum Projekt
            </Link>
          )}
        </div>
      </header>

      {(status === "aufnahme-offen" || status === "bitte-wiederholen") && (
        <div className="space-y-6">
          {status === "bitte-wiederholen" && raum?.qualitaet?.gruende?.length > 0 && (
            <Card aria-labelledby="wiederholen-titel" className="border-notice/40">
              <h2 id="wiederholen-titel" className="font-display text-xl text-ink sm:text-2xl">
                Bitte noch einmal aufnehmen
              </h2>
              <p className="mt-2 text-[15px] text-ink/85">Aus diesem Video entsteht kein guter Raum. Lieber noch einmal kurz filmen als ein ungenauer Raum:</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-[15px] text-ink">
                {raum.qualitaet.gruende.map((g) => (
                  <li key={g.code}>{g.text}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card aria-labelledby="video-titel">
            <h2 id="video-titel" className="font-display text-xl text-ink sm:text-2xl">
              Ihr Raumvideo
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/80">
              Mit einem Handyvideo von etwa 90 Sekunden bauen wir Ihren Raum in 3D. Das dauert bei uns im Studio meist {RAUM_CONFIG.jobMinutes.min} bis {RAUM_CONFIG.jobMinutes.max} Minuten Rechenzeit; wir melden uns hier, sobald er bereit ist.
            </p>
            <div className="mt-5">
              <Aufnahmehilfe />
            </div>
            <div className="mt-6 border-t border-ink/10 pt-6">{kannVideo ? <VideoUpload projektId={projekt} /> : <p className="text-sm text-ink/80">Das Video sendet die Kundin oder der Kunde über das Portal.</p>}</div>
          </Card>
        </div>
      )}

      {status === "in-arbeit" && (
        <Card aria-labelledby="arbeit-titel">
          <h2 id="arbeit-titel" className="font-display text-xl text-ink sm:text-2xl">
            Wir bauen Ihren Raum
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink/80">
            Ihr Video ist angekommen{raum?.video?.empfangen ? ` (${DATUM_ZEIT.format(new Date(raum.video.empfangen))} Uhr)` : ""}. Auf einem Rechner in unserem Studio entsteht daraus der 3D-Raum; danach setzt Ihr Beratungsteam den Maßstab und die besprochenen Stücke. Sie finden den Raum dann hier.
          </p>
          <ol className="mt-4 space-y-2 text-sm text-ink/85">
            <li>1. Bilder prüfen: Ist das Video hell und ruhig genug? Wenn nicht, bitten wir Sie hier um eine neue Aufnahme.</li>
            <li>2. Raum berechnen (meist {RAUM_CONFIG.jobMinutes.min} bis {RAUM_CONFIG.jobMinutes.max} Minuten).</li>
            <li>3. Maßstab setzen und Stücke einplanen (durch Ihr Team).</li>
          </ol>
          <p className="mt-4 text-sm text-ink/75">Ortsangaben im Video haben wir entfernt. Das Originalvideo löschen wir nach der Verarbeitung.</p>
        </Card>
      )}

      {(status === "bereit" || status === "nur-fotos") && raum && <RaumAnsicht projektId={projekt} raum={raum} rolle={rolle} />}

      {hatInhalt && e.zugriff.rechte.includes("loeschen") && (
        <div className="mt-6 lg:mt-8">
          <LoeschenBereich projektId={projekt} loeschenAm={raum.loeschenAm} bitteBestaetigen={sp?.loeschen === "bestaetigen"} />
        </div>
      )}
    </>
  );
}
