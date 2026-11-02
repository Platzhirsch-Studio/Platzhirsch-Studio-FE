// Stil-Finder – Server-Teil unter dem Quiz (mobil-code-seo, fix-03): die fünf
// Wohnstile als crawlbare Liste mit Link aufs Profil und eine kurze FAQ.
// Sichtbarer Text und FAQPage-JSON-LD aus derselben Quelle
// (src/lib/stilfinder/seoCopy.js, Regel wie SeoFaq.js). Kein Client-JS,
// keine Messages (Seite nur Deutsch) – das Client-Budget bleibt unberührt.
import Link from "next/link";
import JsonLd from "@/components/Reusable/JsonLd";
import { faqPageSchema } from "@/lib/seo/faqSchema";
import { SITE_URL } from "@/lib/seo/pageMetadata";
import { profileOverview, stilfinderFaq } from "@/lib/stilfinder/seoCopy";
import { stilfinderCopy } from "@/lib/stilfinder/intl";
import { kernW } from "./kernW";

// Mehrsprachigkeit (01.11.2026): `locale` (de|en|fr|it), Texte serverseitig aus
// src/lib/stilfinder/intl – weiterhin keine Messages, kein Client-JS.
export default function StilfinderSeoInfo({ locale = "de" }) {
  const t = (stilfinderCopy(locale) || stilfinderCopy("de")).page.seo;
  const profiles = profileOverview(locale);
  const faq = stilfinderFaq(locale);
  return (
    <section aria-labelledby="sf-stile" className="border-t border-ink/10 bg-[#faf8f4] px-gutter py-16 text-ink md:py-24" data-sf-seo="">
      <JsonLd data={faqPageSchema(`${SITE_URL}/${locale}/stil-finder`, locale, faq)} />
      <div className="mx-auto grid max-w-page gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.eyebrow}</p>
          <h2 id="sf-stile" className="font-display mt-3 text-3xl sm:text-4xl">
            {kernW(t.title) /* QM r5: Bodoni-W ohne Kerning („W ohnstile“) */}
          </h2>
          <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {profiles.map((p) => (
              <li key={p.key}>
                <Link href={p.href} className="group flex min-h-14 flex-col gap-1 py-4 outline-offset-4">
                  <span className="font-display text-xl group-hover:underline group-hover:underline-offset-4">{kernW(p.name)}</span>
                  <span className="text-sm text-ink/80">{p.tagline}</span>
                  <span className="text-xs text-ink/75">{t.tones} {p.tones.join(", ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <h2 className="font-display text-3xl sm:text-4xl">{kernW(t.faqTitle)}</h2>
          <dl className="mt-8 border-t border-ink/10">
            {faq.map((it) => (
              <div key={it.q} className="border-b border-ink/10 py-5">
                <dt className="font-medium">{it.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink/80">{it.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
