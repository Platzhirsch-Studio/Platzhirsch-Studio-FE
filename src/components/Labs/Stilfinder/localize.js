// Stil-Finder – sprachabhängige Texte zusammensetzen (Mehrsprachigkeit 01.11.2026).
// Reines Modul (kein React, keine "@/..."-Importe): Client-Komponenten, Server-
// Komponenten und node --test laden es.
//
// questions.js und profiles.js bleiben die eine Quelle für Gewichte, Bilder und
// Farben (deutscher Mastertext). Für EN/FR/IT legt der Server ein Text-Overlay
// darüber (src/lib/stilfinder/intl/<locale>.js); ohne Overlay (DE) bleibt alles
// unverändert.

/** "{name} …" → Werte einsetzen; unbekannte Platzhalter bleiben stehen. */
export function fmt(tpl, vars = {}) {
  return String(tpl ?? "").replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m));
}

/**
 * Wie fmt(), aber `nodes` dürfen React-Elemente sein (Link, strong …): liefert
 * ein Array aus Strings und Elementen. Die Elemente brauchen einen eigenen `key`.
 */
export function rich(tpl, nodes = {}, vars = {}) {
  return String(tpl ?? "")
    .split(/(\{\w+\})/g)
    .map((part) => {
      const m = /^\{(\w+)\}$/.exec(part);
      if (!m) return part;
      if (Object.prototype.hasOwnProperty.call(nodes, m[1])) return nodes[m[1]];
      if (Object.prototype.hasOwnProperty.call(vars, m[1])) return String(vars[m[1]]);
      return part;
    })
    .filter((part) => part !== "");
}

/** Ein Profil mit Text-Overlay (Name, Leitsatz, Text, Stichworte, Tonnamen, Bild-Alt, Tipp). */
export function localizeProfile(base, ov) {
  if (!base || !ov) return base;
  return {
    ...base,
    name: ov.name ?? base.name,
    tagline: ov.tagline ?? base.tagline,
    text: ov.text ?? base.text,
    keywords: ov.keywords ?? base.keywords,
    tip: ov.tip ?? base.tip,
    palette: base.palette.map((c, i) => ({ ...c, name: ov.palette?.[i] ?? c.name })),
    hero: { ...base.hero, alt: ov.alt ?? base.hero.alt },
  };
}

/** Eine Frage mit Text-Overlay (Überzeile, Titel, Hinweis, Optionen: label/alt/sub). */
export function localizeQuestion(base, ov) {
  if (!base || !ov) return base;
  return {
    ...base,
    overline: ov.overline ?? base.overline,
    title: ov.title ?? base.title,
    ...(base.hint || ov.hint ? { hint: ov.hint ?? base.hint } : {}),
    topic: ov.topic,
    options: base.options.map((o, i) => {
      const t = ov.options?.[i] || {};
      return {
        ...o,
        label: t.label ?? o.label,
        ...(o.alt !== undefined ? { alt: t.alt ?? o.alt } : {}),
        ...(o.sub !== undefined ? { sub: t.sub ?? o.sub } : {}),
      };
    }),
  };
}

/** PROFILES-Map in der Sprache des Overlays (oder unverändert). */
export function localizeProfiles(profiles, overlay) {
  if (!overlay) return profiles;
  return Object.fromEntries(Object.entries(profiles).map(([k, p]) => [k, localizeProfile(p, overlay[k])]));
}

/** QUESTIONS-Liste in der Sprache des Overlays (oder unverändert). */
export function localizeQuestions(questions, overlay) {
  if (!overlay) return questions;
  return questions.map((q) => localizeQuestion(q, overlay[q.id]));
}

/** Optionsliste [{value,label}] mit übersetzten Labels ({ value: label }). */
export function localizeOptions(list, labels) {
  if (!labels) return list;
  return list.map((o) => ({ ...o, label: labels[o.value] ?? o.label }));
}

/**
 * QM r3: Zahl und Einheit bleiben zusammen („etwa 65 / cm“ brach vor der Einheit um):
 * Leerzeichen zwischen Ziffer und cm/mm/m/m²/%/€ wird ein geschütztes Leerzeichen.
 * Strings ohne solche Stellen kommen unverändert zurück; Nicht-Strings ebenso.
 */
export function nbUnits(text) {
  if (typeof text !== "string") return text;
  return text.replace(/(\d) (cm|mm|m²|m|%|€|kg)(?=$|[\s.,;:!?)–-])/g, "$1\u00a0$2");
}
