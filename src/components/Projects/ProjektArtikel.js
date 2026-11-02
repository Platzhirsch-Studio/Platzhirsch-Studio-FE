// src/components/Projects/ProjektArtikel.js — one Referenzprojekt in the fixed
// format of Bericht 12 C3 (Server Component):
//   1. title (Ort + Typologie + Haltung)  2. fact line  3. Die Ausgangslage
//   4. Unsere Lösung (≤ 3 rooms)  5. Im Projekt (product links)  6. quote
//   7. duration + appointment CTA
// `projekt` is a validated entry of src/lib/content/projekte.js. With
// `vorlage` the same layout renders placeholder slots instead of photos
// (template preview /de/projekte/vorlage). Design-Bibel tokens only: no
// radius, no shadow, one filled button per view.
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Breadcrumb, TerminCta, linkClass, overlineClass } from "@/components/Ratgeber/RatgeberParts";
import SaveActions from "@/components/Pinterest/SaveActions";
import { KETTE_STUFEN, PROJEKTE_PATH } from "@/lib/content/projekte";

const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function formatYearMonth(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ""));
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : String(ym || "");
}

function BildPlatz({ ratio = "3 / 2", label }) {
  return (
    <div
      className="flex w-full items-center justify-center border border-dashed border-line-strong bg-surface-band px-4 text-center text-small text-text-soft"
      style={{ aspectRatio: ratio }}
    >
      {label}
    </div>
  );
}

// Pinterest + Ideenboard (Inhaber-Entscheidung Nr. 14): eigene Projektfotos
// (bildSchema: nutzungsrecht Web/Social). Der Merken-Link erscheint nur, wenn
// die Einwilligung der Bauherrschaft den Kanal nennt (einwilligung.umfang
// enthält "pinterest", QA Recht P1-1) und die Allowlist
// src/lib/pinterest/rights.js das Bild freigibt. „Zum Ideenboard“ bleibt
// (privat). Nicht in der Vorlage.
const pinterestErlaubt = (projekt) => Boolean(projekt?.einwilligung?.umfang?.includes("pinterest"));
function Bild({ bild, vorlage, label, sizes, projekt, raum }) {
  if (vorlage || !bild) return <BildPlatz label={label} />;
  return (
    <figure className="m-0">
      <Image
        src={bild.src}
        alt={bild.alt}
        width={bild.width}
        height={bild.height}
        sizes={sizes}
        className="h-auto w-full"
      />
      <figcaption className="mt-2 text-small text-text-soft">Foto: {bild.fotograf}</figcaption>
      {projekt && (
        <SaveActions
          compact
          pinterest={pinterestErlaubt(projekt)}
          card={{ type: "projekt", title: raum ? `${projekt.titel}: ${raum}` : projekt.titel, subtitle: projekt.ort, href: `${PROJEKTE_PATH}/${projekt.slug}`, image: bild.src, room: raum }}
          pin={{ title: bild.alt, room: raum || projekt.typologie, brand: projekt.ort, kiStufe: bild.ki }}
        />
      )}
    </figure>
  );
}

// Rat 9,5 (B19): Skizze → Modell → Rendering → Foto of one room (Kern-USP,
// Entscheidung Nr. 8). Only stages that exist; the rendering is labelled as a
// visualisation. In the template preview all four stages are slots.
const STUFE = {
  skizze: { label: "Skizze", note: "Handzeichnung: Harald Menghin" },
  modell: { label: "Modell", note: "Modell: Harald Menghin" },
  rendering: { label: "Rendering", note: "Visualisierung aus der Planung, kein Foto" },
  foto: { label: "Fertiger Raum", note: "" },
};
function Kette({ projekt, vorlage }) {
  const k = projekt.kette || {};
  const stufen = vorlage ? KETTE_STUFEN : KETTE_STUFEN.filter((s) => k[s]);
  if (!vorlage && stufen.length < 2) return null;
  return (
    <section aria-labelledby="kette" className="lg:col-span-10 lg:col-start-2" data-projekt-kette="">
      <h2 id="kette" className="font-display text-display-m text-text">Vom Strich zum Raum{k.raum ? `: ${k.raum}` : ""}</h2>
      <ol className="mt-stack-m grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-grid">
        {stufen.map((s, i) => (
          <li key={s}>
            <Bild bild={k[s]} vorlage={vorlage} projekt={vorlage ? undefined : projekt} raum={k.raum} label={`Bildplatz: ${STUFE[s].label}, 3:2`} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
            <p className="mt-2 text-ui text-text">
              <span aria-hidden="true" className="mr-2 tabular text-text-soft">{String(i + 1).padStart(2, "0")}</span>
              {STUFE[s].label}
            </p>
            {STUFE[s].note && <p className="text-small text-text-soft">{STUFE[s].note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ProjektArtikel({ projekt, vorlage = false, children }) {
  const p = projekt;
  const facts = [
    ["Ort", p.ort],
    ["Typologie", p.typologie],
    ...(p.flaecheQm ? [["Fläche", `${p.flaecheQm} m²`]] : []),
    ["Leistungen", p.leistungen.join(" · ")],
    ["Zeitraum", vorlage ? p.zeitraumText : `${formatYearMonth(p.zeitraum.von)} bis ${formatYearMonth(p.zeitraum.bis)}`],
    ...(p.architekt
      ? [["Architektur", p.architekt.url ? <a key="a" href={p.architekt.url} className={linkClass} rel="noopener">{p.architekt.name}</a> : p.architekt.name]]
      : []),
  ];

  return (
    <article className="bg-surface text-text" aria-labelledby="projekt-titel">
      <header className="px-gutter pt-10 pb-10 md:pt-14 lg:pt-16">
        <div className="mx-auto max-w-page">
          <Breadcrumb items={[{ name: "Startseite", href: "/" }, { name: "Projekte", href: "/projekte" }, { name: vorlage ? "Vorlage" : p.titel }]} />
          <p className={`${overlineClass} mt-10`}>Projekt</p>
          <h1 id="projekt-titel" className="mt-stack-s max-w-[22ch] font-display text-display-l text-text">
            {p.titel}
          </h1>
          <dl className="mt-stack-m grid max-w-measure grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-4 text-body">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-text-soft">{k}</dt>
                <dd className="m-0 text-text">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="px-gutter pb-16 md:pb-24">
        <div className="mx-auto grid max-w-page gap-x-grid gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <Bild bild={p.bilder?.[0]} vorlage={vorlage} projekt={p} label="Bildplatz: Totale, eigenes Foto, 3:2" sizes="(min-width: 1024px) 1200px, 100vw" />
          </div>

          <section aria-labelledby="ausgangslage" className="lg:col-span-7 lg:col-start-2">
            <h2 id="ausgangslage" className="font-display text-display-m text-text">Die Ausgangslage</h2>
            <p className="mt-stack-s max-w-measure text-lead text-text">{p.ausgangslage}</p>
          </section>

          {(vorlage || p.kette) && <Kette projekt={p} vorlage={vorlage} />}

          <section aria-labelledby="loesung" className="lg:col-span-10 lg:col-start-2">
            <h2 id="loesung" className="font-display text-display-m text-text">Unsere Lösung</h2>
            <div className="mt-stack-m grid gap-10 md:grid-cols-3 md:gap-grid">
              {p.loesung.map((l, i) => (
                <div key={l.raum}>
                  <Bild bild={p.bilder?.[i + 1]} vorlage={vorlage} projekt={p} raum={l.raum} label={`Bildplatz: ${l.raum}`} sizes="(min-width: 768px) 33vw, 100vw" />
                  <h3 className="mt-4 text-title text-text">{l.raum}</h3>
                  <p className="mt-2 text-body text-text">{l.text}</p>
                </div>
              ))}
            </div>
          </section>

          {p.produkte?.length > 0 && (
            <section aria-labelledby="im-projekt" className="lg:col-span-7 lg:col-start-2">
              <h2 id="im-projekt" className="font-display text-display-m text-text">Im Projekt</h2>
              <ul className="mt-stack-s flex flex-col gap-2 text-body">
                {p.produkte.map((x) => (
                  <li key={x.href}>
                    {vorlage ? x.name : <Link href={x.href} className={linkClass}>{x.name}</Link>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.zitat && (
            <figure className="m-0 border-l-2 border-line-strong pl-6 lg:col-span-7 lg:col-start-2">
              <blockquote className="m-0 font-display text-title text-text">„{p.zitat.text}“</blockquote>
              <figcaption className="mt-3 text-small text-text-soft">{p.zitat.von}</figcaption>
            </figure>
          )}

          {children && <div className="lg:col-span-10 lg:col-start-2">{children}</div>}

          <div className="lg:col-span-10 lg:col-start-2">
            <TerminCta headingId="projekt-termin" heading={vorlage ? p.ctaTitel : "Ihr Projekt am Bodensee?"}>
              {vorlage
                ? p.ctaText
                : `Von der ersten Skizze bis zur Montage: ${formatYearMonth(p.zeitraum.von)} bis ${formatYearMonth(p.zeitraum.bis)}. Erzählen Sie uns von Ihrem Vorhaben, im Showroom in Lochau oder am Telefon.`}
            </TerminCta>
          </div>
        </div>
      </div>
    </article>
  );
}
