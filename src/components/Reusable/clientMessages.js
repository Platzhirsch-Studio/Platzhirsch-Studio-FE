// Messages for NextIntlClientProvider (R4-shell-perf, TBT).
//
// layout.js used to hand the WHOLE message file (≈ 60 KB JSON per locale) to
// the client provider, so every page carried it inline in the RSC payload and
// parsed it during hydration. Server Components read their texts through
// next-intl's request config (src/i18n/config.js) and never need the provider,
// so the namespaces below – read ONLY by Server Components today – are left
// out of the client copy.
//
// Deny-list, not allow-list: a NEW namespace (integrator merges, new
// packages) reaches the client by default, nothing breaks silently.
// tests/unit/r4-shell.test.mjs walks every module reachable from a
// "use client" file and fails as soon as one of these names shows up there –
// then remove it from this list.
export const SERVER_ONLY_NAMESPACES = [
  "inhalt",
  "HomePage",
  "about",
  "ProductsMenu",
  "brandCategory",
  "markenIndex",
  "landing",
  "ContactSection",
  "partners",
  "Slider",
  "press",
  // F5 (Runde 1, Perf mobil): read only by Server Components or by own copy
  // modules (checked with the precise read test in tests/unit/r4-shell.test.mjs).
  // Together ≈ 57 KB of the former 78 KB client copy (de), i.e. RSC payload
  // and hydration parse work on EVERY page. Portal and Labs stay: their
  // client islands read Portal.* / Labs.* via tx().
  "Upload",
  "ezarri",
  "Arbeitsweise",
  "payments",
  "marken",
  "Showroom",
  "Home",
  "Wow",
  "presse",
  "newsletter",
  "ReviewNotice",
  "booking",
  "brand",
  "news",
  "partner",
  // Service Nr. 10 (Integration 29.10.2026, ≈ 8 KB): the client hook
  // useWlCopy reads the four-language table src/lib/wunschliste/copy.js
  // (same texts, tests/unit/wunschliste.test.mjs); server pages read here.
  "wunschliste",
  // Online-Kalender (≈ 20 KB je Sprache): Seiten unter /[locale]/termin
  // reichen die Texte als Props weiter (src/lib/booking/copy.js, gleiche
  // Texte, tests/unit/booking-termin.test.mjs), kein Client liest termin.*.
  "termin",
  // WhatsApp-Beratung (Nr. 15, ≈ 3 KB je Sprache): Einstiege, Hinweis,
  // MobileCtaBar und Concierge lesen die gleiche Tabelle src/lib/whatsapp/copy.js
  // (sie steckt ohnehin im Bundle, link.js baut daraus den vorbelegten Text;
  // Gleichstand: tests/unit/whatsapp.test.mjs).
  "whatsapp",
  // Winterlager & Pflege (Service 3, Konsolidierung 29.10.2026, ≈ 13 KB je
  // Sprache): /[locale]/outdoor-winterservice reads its texts on the server
  // (src/lib/service/winterlager/copy.js, same DE/EN texts as
  // serviceWinterlager.*, tests/unit/winterlager.test.mjs) and passes them
  // as props; no client module reads serviceWinterlager.*.
  "serviceWinterlager",
  // Tempo-Runde Shell (qa-screenshots/tempo/shell.md, ≈ 0,3 KB): the 404 texts
  // are rendered on the server only (src/app/not-found.js reads the JSON,
  // [locale]/[slug] LOCALIZED_404 uses getTranslations); NotFoundLocales only
  // picks one of the server-rendered blocks.
  "error404",
  // Küchengeräte (Inhaber-Entscheidung Nr. 18, Übernahme 30.10.2026, ≈ 4 KB je
  // Sprache): /[locale]/kuechengeraete is a Server Component
  // (KuechengeraetePage.js, useTranslations on the server); no client reads it.
  "kuechengeraete",
  // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21, Einhängen 31.10.2026,
  // ≈ 9 KB je Sprache): /[locale]/bad-wellness is a Server Component
  // (BadWellnessPage.js, bwText() on the server); no client reads it.
  "badWellness",
  // Herstellerkatalog (Bad & Wellness / Küchengeräte, 31.10.2026, ≈ 6 KB je
  // Sprache): Seiten unter /bad-wellness/… und /kuechengeraete/… sind Server
  // Components (src/components/Katalog/*); die Inseln KatalogFilter und
  // MerkenButton bekommen ihre Texte als Props.
  "katalog",
  // SEO-Team A (GEO W2/W5, 31.10.2026, ≈ 9 KB je Sprache): Faktenblock „Auf
  // einen Blick“ und FAQ-Blöcke (src/components/Reusable/SeoFaq.js,
  // src/components/About/FactsBlock.js) are async Server Components.
  "seoGeo",
];

// Sub-keys left out of the client copy (namespace stays, this key goes).
// Portal.tagebuch (Service Nr. 12, ≈ 7 KB): the portal is German-only and the
// client islands fall back to the identical DE table in
// src/components/Portal/Tagebuch/texte.js (tagebuchT → tx). Take it off this
// list once the portal is translated.
// ideenboard.seite (Pinterest/Ideenboard, ≈ 5 KB): nur /[locale]/ideenboard;
// die Seite bekommt die Texte als Prop vom Server (getPinCopy). Im Client
// bleiben nur die kurzen Insel-Texte (ideenboard.add … nav, ≈ 0,4 KB).
// Cookies.einblicke (Besucher-Einblicke, eigene Heatmap, ≈ 2 KB je Sprache):
// the consent banner loads the same texts lazily from
// src/lib/einblicke/consentCopy.js, and only while NEXT_PUBLIC_EINBLICKE runs
// the feature (equality: tests/unit/einblicke.test.mjs).
// Footer.openingHours + Footer.tagline (Konsolidierung 29.10.2026, ≈ 0,5 KB
// je Sprache): the footer is a Server Component; the only client reader of
// Footer.* is BareShell (imprint, privacy). Frees room for the new menu/footer
// labels (Hotel & Objekt, Empfehlen, Newsletter-Archiv, Winterlager) in the
// 35-KB budget (tests/unit/f5-shell-technik.test.mjs).
// Shell.nav + Shell.menu + Shell.ctaBar (Tempo-Runde Shell, ≈ 2,8 KB je
// Sprache, RSC payload of EVERY page): header, menus, footer and CTA bar are
// Server Components and resolve Shell.* on the server (shellLabels.js →
// props); <Breadcrumbs> (Shell.nav) is rendered by Server Components only.
// The one client reader of Shell is the slim upload shell (BareShell.js:
// header.skip, bare.back, footer.legal – those keys stay).
// tests/unit/tempo-shell.test.mjs checks both.
export const SERVER_ONLY_SUBKEYS = [
  ["Footer", "openingHours"],
  ["Footer", "tagline"],
  ["Shell", "nav"],
  ["Shell", "menu"],
  ["Shell", "ctaBar"],
  ["Portal", "tagebuch"],
  ["ideenboard", "seite"],
  ["Cookies", "einblicke"],
  // forms.trust (Rat 9,5 B6, Übernahme 30.10.2026): the trust block
  // (src/components/Beratung/TrustBlock.js) is an async Server Component.
  ["forms", "trust"],
];

/** Copy of `messages` without the server-only namespaces. */
export function pickClientMessages(messages) {
  if (!messages || typeof messages !== "object") return messages;
  const out = {};
  for (const [key, value] of Object.entries(messages)) {
    if (!SERVER_ONLY_NAMESPACES.includes(key)) out[key] = value;
  }
  for (const [ns, sub] of SERVER_ONLY_SUBKEYS) {
    if (out[ns] && typeof out[ns] === "object" && sub in out[ns]) {
      const { [sub]: _omit, ...rest } = out[ns];
      out[ns] = rest;
    }
  }
  return out;
}
