// src/lib/stilfinder/seoCopy.js – indexierbarer Text der Seite /de/stil-finder
// (mobil-code-seo, fix-03). Bisher lag im Server-HTML nur die Einleitung
// (~80 Wörter); die fünf Profile und die Fragen standen erst nach dem Start im
// Client. Suchanfrage laut SISTRIX (31.10.2026): „welcher einrichtungsstil
// passt zu mir“ DE 100/Monat, „einrichtungsstil finden“ 30, „welcher wohnstil
// passt zu mir“ 20, „wohnstil test“ 10 (AT/CH je ≤ 10).
//
// Jede Aussage ist aus dem Code abgeleitet (QUESTIONS, PROFILES, Einleitung
// und Fußnote der Ergebnisseite) – keine erfundenen Fakten. Ändert sich das
// Quiz, ändern sich die Antworten mit. Reines Modul, kein "@/".
//
// Mehrsprachigkeit (01.11.2026): `locale` (de|en|fr|it). FAQ-Texte aus
// ./intl/<locale>.js (PAGE.faq), Fragen/Profile mit dem Text-Overlay der Sprache.
import { QUESTIONS as BASE_QUESTIONS } from "../../components/Labs/Stilfinder/questions.js";
import { PROFILE_ORDER, PROFILES as BASE_PROFILES, resultHref } from "../../components/Labs/Stilfinder/profiles.js";
import { fmt, localizeProfiles, localizeQuestions } from "../../components/Labs/Stilfinder/localize.js";
import { stilfinderCopy } from "./intl/index.js";

const copyOf = (locale) => stilfinderCopy(locale) || stilfinderCopy("de");
const join = (list, and = "und") => (list.length > 1 ? `${list.slice(0, -1).join(", ")} ${and} ${list[list.length - 1]}` : list[0] || "");
// "Der Raum" → "Raum", "Der Rahmen · optional" → "Rahmen"; EN/FR/IT: q.topic aus dem Overlay
const topic = (q) => q.topic || q.overline.replace(/\s*·.*$/, "").replace(/^(Der|Die|Das)\s+/, "");

/** Die fünf Profile als Liste (Name, Leitsatz, Töne, Link ohne Antwort-Code). */
export function profileOverview(locale = "de") {
  const c = copyOf(locale);
  const profiles = localizeProfiles(BASE_PROFILES, c.profiles);
  return PROFILE_ORDER.map((k) => {
    const p = profiles[k];
    return { key: k, name: p.name, tagline: p.tagline, tones: p.palette.map((t) => t.name), href: resultHref(p, null, c.locale) };
  });
}

/** FAQ-Einträge [{ q, a }] – sichtbar UND als FAQPage-JSON-LD (gleiche Quelle). */
export function stilfinderFaq(locale = "de") {
  const c = copyOf(locale);
  const { faq } = c.page;
  const questions = localizeQuestions(BASE_QUESTIONS, c.questions);
  const profiles = localizeProfiles(BASE_PROFILES, c.profiles);
  const required = questions.filter((q) => !q.optional).map(topic);
  const optional = questions.filter((q) => q.optional).map(topic);
  const [open, close] = faq.quote;
  const names = PROFILE_ORDER.map((k) => `${open}${profiles[k].name}${close}`);
  return faq.items.map((it, i) =>
    i === 0
      ? {
          q: it.q,
          a: fmt(it.a, {
            count: required.length,
            topics: join(required, faq.and),
            optional: optional.length ? it.optional : "",
            n: PROFILE_ORDER.length,
            names: join(names, faq.and),
          }),
        }
      : { q: it.q, a: it.a },
  );
}
