// Every text the header/footer client islands show, resolved on the server
// (R4-shell-perf). The islands receive plain strings as props instead of
// calling useShellCopy() in the browser: shellCopy.js (4 languages of
// fallback copy) stays out of the client bundle and no ICU message is
// compiled during hydration (intl-messageformat's locale resolution was the
// largest single function in the /de/kontakt CPU profile).
//
// `c` is the translator from useShellCopy() (server). Pure function, no hooks.
import { LANGUAGES } from "./shellCopy";
import { germanOnlySegments } from "./shellNav";
import { COUNT_TOKEN } from "./navMatch";
import { ownCalendarActive } from "../Booking/config.js";
import { terminLabel } from "../../lib/forms/terminLink.js";

// R6-shell-perf: note in the language lists on German-only pages (Ratgeber,
// Projekte, Schweiz-Hub, commerce, Bewerten …). The key
// Shell.header.germanOnlyNote is in src/messages/{de,en,fr,it}.json (merged
// by R6-i18n), so the former fallback table here is gone: one text, one place.

// Rat 9,5 B1 (UX1): with the own online calendar the Termin buttons of
// mobile menu and CTA bar lead to /termin and use the calendar word of
// terminLabel(); the
// content buttons „Termin anfragen“ stay with the form (/beratung). One word,
// one target (src/lib/forms/terminLink.js). `calendar` defaults to the server
// switch (both callers are Server Components).
export function shellLabels(c, locale, { calendar = ownCalendarActive() } = {}) {
  const termin = (msg) => (calendar ? terminLabel(locale, { calendar }) : msg);
  const current = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  return {
    germanOnly: germanOnlySegments(),
    selection: {
      label: c("header.selection"),
      count0: c("header.selectionCount", { count: 0 }),
      count1: c("header.selectionCount", { count: 1 }),
      countOther: c("header.selectionCount", { count: Number(COUNT_TOKEN) }),
    },
    language: {
      label: c("header.language"),
      current: c("header.languageCurrent", { name: current.name }),
      languages: LANGUAGES,
      germanOnlyNote: c("header.germanOnlyNote"),
    },
    search: {
      open: c("header.searchOpen"),
      label: c("header.searchLabel"),
      close: c("header.searchClose"),
      placeholder: c("header.searchPlaceholder"),
      submit: c("header.searchSubmit"),
    },
    menu: {
      open: c("header.menuOpen"),
      menu: c("header.menu"),
      close: c("header.menuClose"),
      panelClose: c("header.panelClose"),
      home: c("header.home"),
      mainNav: c("header.mainNav"),
      termin: termin(c("menu.termin")),
      call: c("menu.call"),
      visit: c("menu.visit"),
    },
    ctaBar: {
      label: c("ctaBar.label"),
      call: c("ctaBar.call"),
      termin: termin(c("ctaBar.termin")),
      ai: c("ctaBar.ai"),
      aiLabel: c("ctaBar.aiLabel"),
    },
  };
}
