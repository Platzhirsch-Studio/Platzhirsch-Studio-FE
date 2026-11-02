// /de/concierge – KI-Concierge (früher /de/labs/concierge, 308). German only, indexable.
// Fix-Runde 1 (F2): Ohne API-Schlüssel (bzw. bei Not-Aus) im Produktions-Build
// kein „nicht verfügbar“-Chat, sondern ein sinnvoller Ersatz (Termin, Telefon,
// Kontakt) und noindex. Der seitenweite Knopf blendet sich dann ebenfalls aus
// (src/components/Concierge/Launcher.js, /api/labs/status).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Concierge from "@/components/Labs/Concierge/Concierge";
import { WerkzeugJsonLd, werkzeugOg } from "@/components/Labs/werkzeugSeo";
import { allowDevMock, conciergeLive, getMode } from "@/lib/concierge/config";
import { getShowroomInfo } from "@/lib/concierge/showroom";
import StartButton from "./StartButton";

const TITLE = "KI-Concierge für Wohnfragen | Platzhirsch Home Living";
// Runde 2 (technik P1-7, seo P1-3): ohne nutzbare KI kein „KI-Concierge“ in
// Title und Überzeile, sondern neutral – und die Seite fehlt in Sitemap und
// llms.txt (conciergeIndexable(), dieselbe Regel).
const TITLE_OFF = "Fragen an unser Team | Platzhirsch Home Living";
const DESCRIPTION_OFF =
  "Fragen zu Sofas, Leuchten, Outdoor-Möbeln und Marken beantwortet unser Team im Showroom mit Café in Lochau – persönlich, am Telefon oder per E-Mail.";
const DESCRIPTION =
  "Fragen zu Sofas, Leuchten, Outdoor-Möbeln und Marken an ein gekennzeichnetes KI-System – mit Übergabe an das Team im Showroom Lochau.";

/**
 * Ohne echte KI (kein ANTHROPIC_API_KEY, erzwungener Mock oder Not-Aus,
 * conciergeLive()) → Ersatzseite mit Hinweis und „Termin anfragen“, in JEDER
 * Umgebung (Runde 4, ux P0-1/Concierge-Gating: kein Mock vor Kunden, auch
 * nicht im Dev-Server). Nur zum Testen öffnet ?mock=1 den Chat im Mock-Modus,
 * wenn der Server den Mock zulässt (Dev-Server oder CONCIERGE_MOCK=1, z. B.
 * tests/e2e/labs-concierge.spec.js); in Produktion ohne Mock wirkungslos.
 */
const mockAllowed = () => allowDevMock() || getMode() === "mock";
const devMockRequested = (sp) => sp?.mock === "1" && mockAllowed();
const fallbackMode = (sp) => !conciergeLive() && !devMockRequested(sp);

export async function generateMetadata({ searchParams }) {
  await connection(); // Laufzeit-Umgebung (API-Schlüssel), nicht Build-Zeit
  const off = fallbackMode(await searchParams);
  return {
    title: off ? TITLE_OFF : TITLE,
    description: off ? DESCRIPTION_OFF : DESCRIPTION,
    // Feste URL seit der Integration (Inhaber-Entscheidung Nr. 9): indexierbar, nur Deutsch –
    // außer der Concierge ist nicht nutzbar (dann noindex, follow).
    // Runde 4: auch der Mock (?mock=1) ist nie indexierbar – nur echte KI.
    robots: off || !conciergeLive() ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: "https://platzhirsch.studio/de/concierge" },
    ...werkzeugOg("concierge", off ? { title: "Fragen an unser Team", description: DESCRIPTION_OFF } : { title: "KI-Concierge für Wohnfragen", description: DESCRIPTION }),
  };
}

const POINTS = [
  ["Katalog statt Fantasie", "Produkte, Marken und Kollektionen kommen live aus dem Katalog – mit Bild und Link."],
  ["Ehrlich bei Grenzen", "Keine Preise, keine Lieferzeiten, keine Steuer- oder Zollauskünfte – dafür das Team."],
  ["Übergabe an Menschen", "Ein Klick zur Terminanfrage, mit einer Notiz Ihrer Wünsche zum Kopieren."],
];

const BTN =
  "inline-flex min-h-11 items-center justify-center bg-ink px-5 text-sm font-medium text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const BTN_LIGHT =
  "inline-flex min-h-11 items-center justify-center border border-ink/40 px-5 text-sm font-medium text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function Ersatz({ info }) {
  const tel = `tel:${String(info.phone).replace(/[^\d+]/g, "")}`;
  return (
    <section aria-labelledby="concierge-ersatz" className="border border-ink/15 bg-white p-6 md:p-8" data-concierge-ersatz="">
      <h2 id="concierge-ersatz" className="font-display text-2xl leading-tight md:text-3xl">
        Fragen Sie unser Team direkt.
      </h2>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink/85" data-concierge-hinweis="">
        Unser digitaler Concierge ist gerade nicht eingeschaltet. Das Team in Lochau beantwortet Ihre Fragen gern selbst.
      </p>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink/85">
        Ob Sofa, Leuchte, Outdoor oder eine bestimmte Marke: Wir beraten Sie persönlich – im Showroom mit Café in Lochau, am
        Telefon oder per E-Mail. Preise nennen wir auf Anfrage.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/de/beratung" className={BTN}>
          Termin anfragen
        </Link>
        <a href={tel} className={BTN_LIGHT}>
          Anrufen: {info.phone}
        </a>
        <Link href="/de/kontakt" className={BTN_LIGHT}>
          Kontakt
        </Link>
      </div>
      <dl className="mt-8 grid gap-4 border-t border-ink/10 pt-6 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Showroom</dt>
          <dd className="mt-1 text-ink/80">{info.address}</dd>
          <dd className="mt-1">
            <a href={info.directions} className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              Anfahrt
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Öffnungszeiten</dt>
          {info.openingHours.map((h) => (
            <dd key={h.days} className="mt-1 text-ink/80">
              {h.days}: {h.time}
            </dd>
          ))}
        </div>
        <div>
          <dt className="font-semibold">E-Mail</dt>
          <dd className="mt-1">
            <a href={`mailto:${info.email}`} className="underline underline-offset-2">
              {info.email}
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default async function ConciergePage({ params, searchParams }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  // Mode depends on runtime env (API key / mock flag), not on build time.
  await connection();
  const mode = getMode();
  const info = getShowroomInfo();
  const showroom = { phone: info.phone, email: info.email, directions: info.directions, hours: info.openingHours };
  const off = fallbackMode(await searchParams);

  // Runde 4: kein zweites <main> (das Layout liefert es), nur ein Abschnitt.
  return (
    <div className="bg-[#faf8f4] text-ink" data-concierge-page={off ? "ersatz" : "chat"}>
      {!off && <WerkzeugJsonLd id="concierge" description={DESCRIPTION} />}
      {/* Fix-Runde 1 (F2): Ränder wie die übrigen Werkzeugseiten (Design-Bibel: 80 px ab Desktop). */}
      {/* R8 (ux P2-6): mobil steht das Werkzeug direkt unter H1 und Lead, die
          Erklärpunkte folgen danach. Ab md: Text links (zwei Zeilen), Werkzeug rechts. */}
      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 pb-28 pt-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-[auto_1fr] md:gap-x-14 md:gap-y-0 md:px-12 md:pb-20 md:pt-16 lg:px-20 lg:pt-20">
        <div className="md:col-start-1 md:row-start-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-text">{off ? "Fragen an unser Team" : "KI-Concierge"}</p>
          <h1 className="font-display mt-3 text-[2rem] leading-tight md:mt-4 md:text-5xl">
            {off ? "Ihre Wohnfragen," : "Ihr Concierge"}
            <br />
            <span className="italic">{off ? "persönlich beantwortet." : "für Wohnfragen."}</span>
          </h1>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed md:mt-6">
            {off
              ? "Fragen zu Sofas, Leuchten, Outdoor-Möbeln oder einer Marke beantwortet Ihnen unser Team im Showroom in Lochau – persönlich, am Telefon oder per E-Mail."
              : "Fragen Sie in Ihrer Sprache nach Sofas, Leuchten, Outdoor-Möbeln oder einer Marke. Der Concierge sucht passende Stücke aus unserem Katalog und verbindet Sie mit unserem Team im Showroom in Lochau."}
          </p>
          {!off && <StartButton className={`${BTN} mt-5 md:hidden`} />}
        </div>
        <div className="md:col-start-2 md:row-span-2 md:row-start-1">
          {off ? <Ersatz info={info} /> : <Concierge mode={mode} devMock={allowDevMock()} showroom={showroom} />}
        </div>
        <div className="md:col-start-1 md:row-start-2">
          {!off && (
            <>
              <ul className="space-y-5 border-t border-ink/15 pt-6 md:mt-8">
                {POINTS.map(([title, text]) => (
                  <li key={title}>
                    <p className="text-[15px] font-semibold">{title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink/80">{text}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-[12px] leading-relaxed text-ink/75">
                Hinweis nach Art. 50 KI-Verordnung: Der Concierge ist ein KI-System. Antworten werden automatisch erzeugt
                und sind als KI gekennzeichnet.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
