// Web-Fassung einer Newsletter-Ausgabe „Post aus Lochau“ (Archiv
// /de/newsletter/archiv/[ausgabe]). Server-Komponente, rendert NUR sichtbare
// Blöcke (lib/kundenbetreuung/newsletter/newsletter.js sichtbareBloecke).
// `vorschau` (nur Entwicklungsserver) zeigt leere Slots als klar markierte
// Platzhalter „Inhalt folgt“, damit Inhaber und Team sehen, was fehlt; in
// Produktion gibt es keinen Platzhalter.
// Liegt unter components/Empfehlen, weil das Team Kundenbetreuung nur diesen
// Komponentenordner hat (Dateiliste Welle 2).
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { inhaltZeile, offeneSlots, sichtbareBloecke } from "@/lib/kundenbetreuung/newsletter/newsletter";

const overline = "text-overline uppercase text-text-accent";
const inlineLink = "underline underline-offset-4 decoration-line-strong hover:decoration-current";
const stripLocale = (url) => String(url || "").replace(/^\/de(?=\/|$)/, "") || "/";

const SLOT_NAMEN = { neueStuecke: "Neu in der Ausstellung", skizze: "Haralds Skizze des Monats" };

function Bild({ bild, priority = false }) {
  return (
    <Image
      src={bild.src}
      alt={bild.alt}
      width={1200}
      height={800}
      sizes="(min-width: 1024px) 720px, 100vw"
      priority={priority}
      className="h-auto w-full bg-surface-raised"
    />
  );
}

function Block({ b }) {
  switch (b.typ) {
    case "neueStuecke":
      return (
        <section aria-labelledby={`nl-${b.typ}`} className="border-t border-line pt-10">
          <h2 id={`nl-${b.typ}`} className={overline}>
            {b.titel}
          </h2>
          <ul className="mt-6 space-y-10">
            {b.eintraege.map((e) => (
              <li key={e.name}>
                <Bild bild={e.bild} />
                <h3 className="mt-4 text-title">
                  {e.name}
                  {e.marke ? <span className="text-text-soft"> · {e.marke}</span> : null}
                </h3>
                <p className="mt-2 max-w-measure text-body">{e.text}</p>
                {e.url && (
                  <p className="mt-2">
                    <Link href={stripLocale(e.url)} className={inlineLink}>
                      Im Showroom ansehen
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      );
    case "skizze":
      return (
        <section aria-labelledby="nl-skizze" className="border-t border-line pt-10">
          <h2 id="nl-skizze" className={overline}>
            {b.titel}
          </h2>
          <figure className="mt-6">
            <Bild bild={b.bild} />
            <figcaption className="mt-4">
              {b.titelSkizze && <span className="block text-title">{b.titelSkizze}</span>}
              <span className="mt-2 block max-w-measure text-body">{b.text}</span>
              {b.projekt && <span className="mt-2 block text-small text-text-soft">{b.projekt}</span>}
            </figcaption>
          </figure>
        </section>
      );
    case "termine":
      return (
        <section aria-labelledby="nl-termine" className="border-t border-line pt-10">
          <h2 id="nl-termine" className={overline}>
            {b.titel}
          </h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {b.eintraege.map((e) => (
              <li key={`${e.datum}-${e.titel}`} className="py-4">
                <p className="tabular text-small text-text-accent">
                  <time dateTime={e.datum}>{e.datumLabel || e.datum}</time>
                </p>
                <h3 className="mt-1 text-title">{e.titel}</h3>
                {e.text && <p className="mt-1 text-body text-text-soft">{e.text}</p>}
                {e.url && (
                  <p className="mt-2">
                    <Link href={stripLocale(e.url)} className={inlineLink}>
                      Zur Anmeldung
                    </Link>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      );
    case "gutZuWissen":
    case "arbeitsweise":
      return (
        <section aria-labelledby={`nl-${b.typ}`} className="border-t border-line pt-10">
          <h2 id={`nl-${b.typ}`} className="font-display text-display-m">
            {b.titel}
          </h2>
          <p className="mt-stack-s max-w-measure text-body">{b.text}</p>
          {b.url && (
            <p className="mt-3">
              <Link href={stripLocale(b.url)} className={inlineLink}>
                {b.linkLabel || "Mehr dazu"}
              </Link>
            </p>
          )}
        </section>
      );
    default:
      return null;
  }
}

/** @param {{ ausgabe: object, vorschau?: boolean }} props */
export default function NewsletterAusgabe({ ausgabe, vorschau = false }) {
  const bloecke = sichtbareBloecke(ausgabe);
  const brief = bloecke.find((b) => b.typ === "brief");
  const rest = bloecke.filter((b) => b.typ !== "brief");
  const zeile = inhaltZeile(ausgabe);
  const offen = vorschau ? offeneSlots(ausgabe) : [];
  return (
    <article aria-labelledby="nl-titel" className="space-y-10">
      <header>
        <p className={overline}>Post aus Lochau · {ausgabe.monat}</p>
        <h1 id="nl-titel" className="mt-stack-s font-display text-display-l">
          {brief?.titel || ausgabe.betreff}
        </h1>
        {brief && (
          <div className="mt-stack-m max-w-measure space-y-4 text-lead">
            <p>Guten Tag,</p>
            {brief.absaetze.map((t) => (
              <p key={t.slice(0, 24)}>{t}</p>
            ))}
            {zeile && <p>{zeile}</p>}
            <p>
              Herzlich
              <br />
              {brief.absender}
            </p>
          </div>
        )}
      </header>
      {offen.map((typ) => (
        // Druck 02.11.: Platzhalter sind Entwicklungsstand – nicht im Ausdruck.
        <div key={typ} role="note" className="border border-dashed border-line-strong bg-surface-raised p-6 print:hidden">
          <p className="text-ui text-text">Platzhalter (nur Vorschau): {SLOT_NAMEN[typ]}</p>
          <p className="mt-1 text-small text-text-soft">
            Material folgt. Ohne echtes Material erscheint dieser Block nicht in Mail und Archiv.
          </p>
        </div>
      ))}
      {rest.map((b) => (
        <Block key={b.typ} b={b} />
      ))}
    </article>
  );
}
