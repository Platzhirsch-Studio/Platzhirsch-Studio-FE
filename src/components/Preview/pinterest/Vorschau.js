// src/components/Preview/pinterest/Vorschau.js — Vorschau „Pinterest-Kanal“
// (Inhaber-Entscheidung Nr. 14): Profil-Mockup, Boards mit Cover, Beispiel-Pins
// im Pinterest-Raster, Serie „Von der Skizze zum Raum“, Redaktionsplan,
// Kennzahlen und Checkliste für den Inhaber. Nur Anzeige: kein Formular,
// kein Skript von Pinterest, keine Verbindung nach außen, nichts wird
// veröffentlicht. Server Component. Konzept:
// Marktresearch/digital/marketing/pinterest/00-konzept.md
import Image from "next/image";
import { Monogram } from "@/components/Brand";
import { Badge, Container, Eyebrow, Heading, Lead } from "@/components/ui";
import { BOARDS, CHECKLISTE, KENNZAHLEN, KEYWORDS, PINS, PLAN, PROFIL, SERIE, boardById, pinBild, pinById } from "./data";

const SECTIONS = [
  ["#profil", "Profil"],
  ["#boards", "Boards"],
  ["#pins", "Beispiel-Pins"],
  ["#serie", "Skizze → Raum"],
  ["#plan", "Redaktionsplan"],
  ["#checkliste", "Checkliste"],
];

const linkCls = "underline decoration-line-strong underline-offset-4 hover:decoration-current";

function Section({ id, eyebrow, title, intro, band = false, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`scroll-mt-24 border-t border-line py-12 md:py-16 ${band ? "bg-surface-band" : ""}`}>
      <Container>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading level={2} id={`${id}-h`} className="mt-stack-s">
          {title}
        </Heading>
        {intro ? <p className="mt-4 max-w-measure text-body text-text-soft">{intro}</p> : null}
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}

function PinBild({ pin, sizes, priority = false, className = "" }) {
  return (
    <Image
      src={pinBild(pin.id, true)}
      alt={pin.layout === "slot" ? `Platzhalter: ${pin.slot}` : `Pin-Entwurf „${pin.titel}“: ${pin.alt}`}
      width={600}
      height={900}
      sizes={sizes}
      priority={priority}
      className={`block aspect-[2/3] h-auto w-full bg-linen object-cover ${className}`}
    />
  );
}

function SlotCover({ hinweis }) {
  return (
    <div className="flex aspect-[2/3] w-full flex-col items-center justify-center border-2 border-dashed border-line-control bg-linen p-4 text-center">
      <span className="text-ui text-text">Bild folgt</span>
      <span className="mt-2 text-small text-text-soft">{hinweis}</span>
    </div>
  );
}

function Profil() {
  const cover = ["p01", "p16", "p07"].map(pinById);
  return (
    <div className="border border-line bg-surface-raised">
      <div className="grid grid-cols-3 gap-1" aria-hidden="true">
        {cover.map((p) => (
          <Image key={p.id} src={pinBild(p.id, true)} alt="" width={600} height={900} sizes="(min-width: 1024px) 300px, 33vw" className="aspect-[4/3] h-auto w-full object-cover" />
        ))}
      </div>
      <div className="flex flex-col items-center px-5 pb-8 text-center">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-pill border border-line bg-paper">
          <Monogram size={56} title="Profilbild: Platzhirsch-Monogramm" />
        </div>
        <p className="mt-4 font-display text-display-m text-text">{PROFIL.name}</p>
        <p className="mt-1 text-small text-text-soft">
          @{PROFIL.handle} · {PROFIL.website}
        </p>
        <p className="mt-4 max-w-[52ch] text-body text-text">{PROFIL.bio}</p>
        <p className="mt-3 text-small text-text-soft">{PROFIL.ort}</p>
        <p className="mt-4 text-small text-text-soft">Unternehmenskonto · Domain bestätigt (nach Freigabe) · Follower: Start bei 0</p>
      </div>
    </div>
  );
}

function Boards() {
  return (
    <ul className="grid grid-cols-2 gap-x-grid gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {BOARDS.map((b) => {
        const pins = PINS.filter((p) => p.board === b.id);
        const cover = b.cover === "slot" ? null : pinById(b.cover);
        return (
          <li key={b.id} className="min-w-0">
            {cover ? <PinBild pin={cover} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" /> : <SlotCover hinweis={b.slotHinweis} />}
            <h3 className="mt-3 text-title text-text">{b.titel}</h3>
            <p className="text-small text-text-soft" lang="en">
              EN: {b.titelEn}
            </p>
            <p className="mt-2 text-small text-text">{b.beschreibung}</p>
            <p className="mt-2 text-small text-text-soft">
              {pins.length} Beispiel-Pin{pins.length === 1 ? "" : "s"} · Ziel <code className="break-all">{b.ziel}</code>
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Pins() {
  return (
    <ul className="columns-2 gap-x-4 md:columns-3 lg:columns-4 xl:columns-5">
      {PINS.map((p, i) => {
        const b = boardById(p.board);
        return (
          <li key={p.id} className="mb-6 break-inside-avoid">
            <a href={pinBild(p.id)} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" aria-label={`${p.titel} – Pin in voller Größe öffnen (1000 × 1500)`}>
              <PinBild pin={p} priority={i < 2} sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
            </a>
            <p className="mt-2 text-small font-medium text-text">{p.titel}</p>
            <p className="text-small text-text-soft">
              {b.titel} · {p.layout === "slot" ? "Slot: Haralds Material" : `Bild: ${p.credit}`}
            </p>
            <details className="mt-1 text-small text-text-soft">
              <summary className="min-h-11 cursor-pointer py-2 text-text">Pin-Text und Rechte</summary>
              <p className="mt-1 text-text">{p.beschreibung}</p>
              <p className="mt-1">
                Link: <code className="break-all">platzhirsch.studio{p.ziel}</code>
              </p>
              {p.bearbeitung ? <p className="mt-1">Bearbeitung: {p.bearbeitung}</p> : null}
              {p.hinweis ? <p className="mt-1 text-notice">Prüfen: {p.hinweis}</p> : null}
            </details>
          </li>
        );
      })}
    </ul>
  );
}

function Serie() {
  const slots = PINS.filter((p) => p.board === "skizze");
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <ol className="lg:col-span-7">
        {SERIE.map((s) => (
          <li key={s.nr} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line py-4">
            <span className="font-display text-display-m leading-none text-text-soft tabular-nums" aria-hidden="true">
              {s.nr}
            </span>
            <div>
              <h3 className="text-title text-text">
                <span className="sr-only">Schritt {s.nr}: </span>
                {s.schritt}
              </h3>
              <p className="mt-1 text-small text-text">{s.material}</p>
              <p className="mt-1 text-small text-text-soft">Format: {s.format}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="lg:col-span-5">
        <ul className="grid grid-cols-3 gap-3">
          {slots.map((p) => (
            <li key={p.id}>
              <PinBild pin={p} sizes="(min-width: 1024px) 13vw, 30vw" />
              <p className="mt-2 text-small text-text">{p.titel}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-l-2 border-brass-500 pl-4">
          <p className="text-small font-medium text-text">Video-Pin, 15 Sekunden (2:3, ohne Ton verständlich)</p>
          <p className="mt-1 text-small text-text-soft">
            0–4 s Hand zeichnet · 4–8 s Modell wird gedreht · 8–11 s Rendering, beschriftet „Visualisierung“ · 11–15 s fertiger Raum aus derselben Perspektive, Schluss-Tafel „Von Hand gezeichnet. Digital geplant.“
          </p>
          <p className="mt-2 text-small text-text-soft">Nur echtes Material von Harald. Keine KI-Skizzen, keine erzeugten Räume.</p>
        </div>
      </div>
    </div>
  );
}

function Plan() {
  return (
    <>
      <div className="overflow-x-auto" role="region" aria-labelledby="plan-h" tabIndex={0}>
        <table className="w-full min-w-[44rem] border-collapse text-left text-small">
          <caption className="sr-only">Redaktionsplan, 12 Wochen ab Freigabe, 3 bis 5 Pins pro Woche</caption>
          <thead>
            <tr className="border-b border-line-strong">
              <th scope="col" className="py-3 pr-4 font-medium">KW</th>
              <th scope="col" className="py-3 pr-4 font-medium">Woche ab</th>
              <th scope="col" className="py-3 pr-4 font-medium">Thema</th>
              <th scope="col" className="py-3 pr-4 font-medium">Pins</th>
              <th scope="col" className="py-3 pr-4 font-medium">Formate</th>
              <th scope="col" className="py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {PLAN.map((w) => (
              <tr key={`${w.kw}-${w.start}`} className="border-b border-line align-top">
                <td className="py-3 pr-4 tabular-nums">{w.kw}</td>
                <td className="py-3 pr-4 tabular-nums">{w.start}</td>
                <td className="py-3 pr-4">{w.fokus}</td>
                <td className="py-3 pr-4">
                  {w.pins.length} · {w.pins.map((id) => pinById(id)?.titel || id).join(", ")}
                </td>
                <td className="py-3 pr-4">{w.formate}</td>
                <td className="py-3">{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-measure text-small text-text-soft">
        Rhythmus: Di, Do, Sa jeweils ein Pin, in starken Wochen zusätzlich Mo/Fr. Jeder Pin verlinkt auf eine passende Seite von platzhirsch.studio. Ein Pin pro Bild und Board, neue Pins statt Wiederholungen.
      </p>
    </>
  );
}

function Keywords() {
  return (
    <dl className="mt-10 grid gap-x-grid gap-y-4 md:grid-cols-2">
      {KEYWORDS.map((k) => (
        <div key={k.board} className="border-t border-line pt-3">
          <dt className="text-small font-medium text-text">{k.board}</dt>
          <dd className="text-small text-text">{k.de}</dd>
          <dd className="text-small text-text-soft" lang="en">
            EN: {k.en}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Vorschau() {
  const bereit = PINS.filter((p) => p.layout !== "slot").length;
  const slots = PINS.length - bereit;
  return (
    <div className="bg-surface pb-16">
      <Container className="pt-10 md:pt-16">
        <div className="flex flex-wrap gap-2">
          <Badge tone="band">Vorschau · nicht veröffentlicht</Badge>
          <Badge>noindex</Badge>
        </div>
        <Eyebrow className="mt-6">Inhaber-Entscheidung Nr. 14 · Stand 29.10.2026</Eyebrow>
        <Heading level={1} className="mt-stack-s">
          Pinterest-Kanal
        </Heading>
        <Lead className="mt-stack-m max-w-measure">
          So könnte der Kanal von Platzhirsch aussehen: 8 Boards, {PINS.length} Beispiel-Pins im Format 2:3 und ein Redaktionsplan für 12 Wochen. Konzept und Startpaket kommen von uns, die Pflege übernimmt Ihr Team.
        </Lead>
        <p className="mt-4 max-w-measure text-small text-text-soft">
          {bereit} Pins aus Ezarri-Bildern und einem eigenen Foto, {slots} Platzhalter für Haralds Material (Lieferung 30.10.). Keine Minotti-, Poliform- oder Custom-Line-Bilder, keine KI-Räume. Nichts davon ist auf Pinterest hochgeladen.
        </p>
        <nav aria-label="Abschnitte" className="mt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SECTIONS.map(([href, label]) => (
              <li key={href}>
                <a href={href} className={`inline-flex min-h-11 items-center text-ui ${linkCls}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Section id="profil" eyebrow="Profil" title="So sieht das Profil aus" intro="Unternehmenskonto mit Monogramm als Profilbild, Bio in Sie-Form, bestätigte Website. Zahlen erscheinen erst nach dem Start.">
        <div className="mx-auto max-w-3xl">
          <Profil />
        </div>
      </Section>

      <Section id="boards" eyebrow="Boards" title="Acht Boards nach Räumen und Themen" intro="Titel und Beschreibungen sind auf Suchbegriffe ausgerichtet (Deutsch, zweite Sprache Englisch). Boards ohne freigegebene Bilder starten mit einem Platzhalter und bleiben bis zum ersten echten Pin geheim." band>
        <Boards />
        <Keywords />
        <p className="mt-4 text-small text-text-soft">Suchbegriffe sind Hypothesen aus der Recherche und werden vor dem Start in Pinterest Trends (Deutschland/Österreich) geprüft.</p>
      </Section>

      <Section id="pins" eyebrow="Beispiel-Pins" title="Startpaket im Pinterest-Raster" intro="1000 × 1500 Pixel, ruhige Typo nach Design-Bibel: Titel in Bodoni, Text nie direkt auf dem Bild. Bildquelle steht auf jedem Pin. Antippen öffnet den Pin in voller Größe.">
        <Pins />
      </Section>

      <Section id="serie" eyebrow="Serie" title="Von der Skizze zum Raum" intro="Unser Kern: Harald zeichnet von Hand, baut ein Modell, erst dann folgen 3D-Planung und Rendering. Auf Pinterest als Karussell (bis 5 Bilder), 15-s-Video und Einzel-Pins je Schritt – ein Projekt pro Folge." band>
        <Serie />
      </Section>

      <Section id="plan" eyebrow="Redaktionsplan" title="12 Wochen, 3 bis 5 Pins pro Woche" intro="Start nach Ihrer Freigabe (Annahme: Montag, 16.11.2026). „Slot“ heißt: wartet auf Haralds Material oder das eigene Shooting.">
        <Plan />
        <h3 className="mt-12 text-title text-text">Woran wir den Erfolg messen</h3>
        <ul className="mt-4 grid gap-x-grid gap-y-3 md:grid-cols-2">
          {KENNZAHLEN.map((k) => (
            <li key={k.kennzahl} className="border-t border-line pt-3 text-small">
              <span className="font-medium text-text">{k.kennzahl}</span>
              <span className="block text-text-soft">{k.warum}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="checkliste" eyebrow="Für den Inhaber" title="Checkliste vor dem ersten Pin" intro="Sieben Punkte, die nur Sie entscheiden oder erledigen können. Erst danach wird etwas veröffentlicht." band>
        <ol className="grid gap-x-grid gap-y-6 md:grid-cols-2">
          {CHECKLISTE.map((c, i) => (
            <li key={c.titel} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-line-strong pt-4">
              <span className="flex h-8 w-8 items-center justify-center border border-line-control text-small tabular-nums text-text" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h3 className="text-title text-text">{c.titel}</h3>
                <p className="mt-1 text-small text-text">{c.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-small text-text-soft">
          Konzept, Quellen und Arbeitsablauf: <code className="break-all">Marktresearch/digital/marketing/pinterest/00-konzept.md</code>
        </p>
      </Section>
    </div>
  );
}
