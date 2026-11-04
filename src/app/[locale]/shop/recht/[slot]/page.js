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
import { Link } from "@/i18n/navigation";
import { Container, Heading } from "@/components/ui";
import TestBanner from "@/components/Shop/TestBanner";
import { rechtUmbruch } from "@/components/Shop/keinUmbruch";
import { NOINDEX } from "@/lib/commerce/mode";
import { shopCopy } from "@/lib/shop/copy";
import { LANG_HINWEIS, legalSlot, legalSlotDraft, legalSlotReleased } from "@/lib/shop/legal";
import { WIDERRUF_PATH, WIDERRUF_URL } from "@/lib/shop/legalTexte";
import { shopMode } from "@/lib/shop/mode";
import { formatDatum } from "@/components/Katalog/preis";

// Offene Stellen im Entwurf („[PLATZHALTER: …]“) als deutlich markierte Lücke statt Fließtext (Optik-QA r2);
// sichtbar nur die neutrale Lücke „wird ergänzt“ (Inhaber-Entscheidung 02.11.), die Liste der offenen Angaben
// steht in Platzhirsch-Status/berichte/RECHT-PLATZHALTER-2026-11-02.md. Live gehen nur freigegebene Slots.
// Die Adresse der Online-Rücktrittsfunktion (WIDERRUF_URL, § 13a FAGG) wird als Link gesetzt.
const LUECKE = /(\[PLATZHALTER: [^\]]*\])/;
const LUECKE_TEXT = "wird ergänzt";
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TEIL = new RegExp(`(\\[PLATZHALTER: [^\\]]*\\]|${escapeRe(WIDERRUF_URL)})`);
function mitLuecken(text) {
  const teile = String(text).split(TEIL);
  if (teile.length === 1) return rechtUmbruch(text);
  return teile.map((t, i) => {
    if (LUECKE.test(t))
      return (
        <mark key={i} className="border border-dashed border-line-strong bg-stone px-1 text-small text-text" data-shop-recht-luecke="">
          {LUECKE_TEXT}
        </mark>
      );
    if (t === WIDERRUF_URL)
      return (
        <Link key={i} href={WIDERRUF_PATH} prefetch={false} className="underline underline-offset-4 break-all" data-shop-recht-widerruf-link="">
          {WIDERRUF_URL}
        </Link>
      );
    return rechtUmbruch(t);
  });
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
            {/* Marker „Entwurf“, solange legal.js status "entwurf" führt; bei freigegebenem Text mit offener
                Unternehmensangabe (Platzhalter, z. B. LetMeShip-Anschrift) stattdessen „Angabe wird ergänzt“. */}
            <span className="mr-2 border border-line-strong px-1">{s.status === "freigegeben" ? c.legalPending : c.draftMark}</span>
            Stand {formatDatum(s.stand, "de")}
          </p>
        )}
        {frei && (
          <p className="mt-4 text-small text-text-soft" data-shop-recht-stand={s.id}>
            Stand {formatDatum(s.stand, "de")}
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
        {/* § 13a FAGG: Schaltfläche „Vertrag widerrufen“ leicht zugänglich neben der Belehrung. */}
        {(slot === "widerruf" || slot === "widerrufsformular") && (
          <p className="mt-8">
            <Link href={WIDERRUF_PATH} prefetch={false} className="ph-press inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text hover:bg-action hover:text-paper" data-shop-recht-widerruf-button="">
              Vertrag widerrufen
            </Link>
          </p>
        )}
      </Container>
    </div>
  );
}
