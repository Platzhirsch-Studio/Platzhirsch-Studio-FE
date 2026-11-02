// /[locale]/shop/recht/<slot> — Rechtstexte des Onlineshops (agb, widerruf,
// widerrufsformular, versand, datenschutz) aus src/lib/shop/legal.js.
// Nur bei SHOP_MODE test/live (sonst 404), immer noindex.
//   test: Entwurf sichtbar, mit Marker „Entwurf“ (interne Anmerkungen nie sichtbar, Optik-QA r3).
//   live: nur freigegebene Slots (live ist ohne Freigabe ohnehin gesperrt).
// Deutsch ist verbindlich; EN/FR/IT zeigen den deutschen Text mit Hinweis
// „Übersetzung folgt“ (LANG_HINWEIS).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import { Container, Heading } from "@/components/ui";
import TestBanner from "@/components/Shop/TestBanner";
import { rechtUmbruch } from "@/components/Shop/keinUmbruch";
import { NOINDEX } from "@/lib/commerce/mode";
import { shopCopy } from "@/lib/shop/copy";
import { LANG_HINWEIS, legalSlot, legalSlotDraft, legalSlotReleased } from "@/lib/shop/legal";
import { shopMode } from "@/lib/shop/mode";
import { formatDatum } from "@/components/Katalog/preis";

// Offene Stellen im Entwurf („[PLATZHALTER: …]“) als deutlich markierte interne Lücke statt Fließtext
// (Optik-QA r2). Der Inhalt bleibt sichtbar – live gehen nur freigegebene Slots (legalSlotReleased).
const LUECKE = /(\[PLATZHALTER: [^\]]*\])/;
const LUECKE_TEXT = "wird ergänzt";
function mitLuecken(text) {
  const teile = String(text).split(LUECKE);
  if (teile.length === 1) return rechtUmbruch(text);
  return teile.map((t, i) =>
    LUECKE.test(t) ? (
      <mark key={i} className="border border-dashed border-line-strong bg-stone px-1 text-small text-text" data-shop-recht-luecke="">
        {/* Optik-QA r3: ohne „Offen (vor Livegang)“ – neutral „wird ergänzt“; live gehen ohnehin nur freigegebene Slots. */}
        {t.slice(14, -1)} ({LUECKE_TEXT})
      </mark>
    ) : (
      rechtUmbruch(t)
    )
  );
}

export async function generateMetadata({ params }) {
  const { slot } = await params;
  const s = legalSlot(slot);
  return { title: `${s ? s.titel : "Rechtstexte"} | Platzhirsch Home Living`, robots: NOINDEX };
}

function Block({ b, titel }) {
  if (typeof b === "string") return <p>{mitLuecken(b)}</p>;
  // Gleichlautende Zwischenüberschrift direkt unter der H1 entfällt (Optik-QA r3: „Muster-Widerrufsformular“ doppelt).
  if (b?.h) return b.h === titel ? null : <h2 className="pt-4 text-title text-text">{b.h}</h2>;
  if (Array.isArray(b?.ul))
    return (
      <ul className="list-disc space-y-1 pl-5">
        {b.ul.map((x, i) => (
          <li key={i}>{mitLuecken(x)}</li>
        ))}
      </ul>
    );
  // Interne Redaktionsnotizen ({ note }) werden NIE angezeigt – auch nicht im Testmodus (Optik-QA r3, AGB-Seite).
  // Sie bleiben in src/lib/shop/legal.js für Kanzlei und Inhaber.
  return null;
}

export default async function ShopRechtPage({ params }) {
  const { locale, slot } = await params;
  setRequestLocale(locale);
  await connection();
  const mode = shopMode(process.env);
  if (mode === "off") notFound();
  const s = legalSlot(slot);
  if (!s) notFound();
  const frei = legalSlotReleased(s);
  const entwurf = !frei && legalSlotDraft(s);
  if (!frei && !(mode === "test" && entwurf)) notFound();
  const c = shopCopy(locale);
  const blocks = Array.isArray(s.text) ? s.text : [s.text];
  // „beigefügtes Muster-Widerrufsformular“ (Anhang I Teil A FAGG) direkt unter der Belehrung.
  const formular = slot === "widerruf" ? legalSlot("widerrufsformular") : null;
  const lang = LANG_HINWEIS[locale];
  return (
    <div className="bg-surface-raised pt-6 pb-section text-text md:pt-10">
      <Container size="text">
        {mode === "test" && <TestBanner text={c.testBanner} />}
        <Heading level={1} size="display-m" className="mt-8">
          {s.titel}
        </Heading>
        {entwurf && (
          <p className="mt-4 text-small text-text-soft" data-shop-recht-entwurf={s.id}>
            <span className="mr-2 border border-line-strong px-1">{c.draftMark}</span>
            {s.hinweis} · Stand {formatDatum(s.stand, "de")}
          </p>
        )}
        {lang && (
          <p className="mt-4 text-small text-text-soft" lang={locale}>
            {lang}
          </p>
        )}
        <div className="mt-8 max-w-measure space-y-3 text-body text-text [hanging-punctuation:none]" lang="de" data-shop-recht-text={s.id}>
          {blocks.map((b, i) => (
            <Block key={i} b={b} titel={s.titel} />
          ))}
          {formular &&
            (Array.isArray(formular.text) ? formular.text : []).map((b, i) => (
              <Block key={`f${i}`} b={b} titel={s.titel} />
            ))}
        </div>
      </Container>
    </div>
  );
}
