import "server-only";
import { findClaims } from "@/lib/legal/claims";
import { generateSlug } from "@/lib/slugify";

// QA step for the CMS news copy (QA Runde 1, P2-3). The backoffice texts still
// use advertising language the Bibel (§1 voice) and the UWG audit rule out:
// superlatives via findClaims (src/lib/legal/claims.js) plus the house-voice
// words below. Findings are REPORTED (dev console), never rewritten silently –
// the editorial list for the backoffice is in
// Marktresearch/digital/redesign/inhaltsseiten.md.
const VOICE = /(?<![\p{L}])(exklusiv\p{L}*|luxus\p{L}*|luxuriös\p{L}*|perfekt\p{L}*|traum\p{L}*|einzigartig\p{L}*)/giu;

const FIELDS = ["name1", "beschreibung", "metadata_description_de"];

/** [{ slug, field, word, sentence }] for the German CMS fields of all items. */
export function newsCopyFindings(items) {
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const slug = generateSlug(item?.name1);
    const texts = FIELDS.map((field) => [field, item?.[field]]);
    (item?.artikel_table || []).forEach((row, i) => texts.push([`artikel_table[${i}].beschreibung`, row?.beschreibung]));
    for (const [field, text] of texts) {
      if (typeof text !== "string" || !text.trim()) continue;
      for (const f of findClaims(text, { locale: "de" })) out.push({ slug, field, word: f.match, sentence: f.sentence });
      for (const m of text.matchAll(VOICE)) out.push({ slug, field, word: m[0] });
    }
  }
  return out;
}

let reported = false;

/** Dev only, once per server process: list the findings in the console. */
export function reportNewsCopy(items) {
  if (reported || process.env.NODE_ENV === "production") return;
  reported = true;
  const findings = newsCopyFindings(items);
  if (findings.length === 0) return;
  const bySlug = new Map();
  for (const f of findings) bySlug.set(f.slug, [...(bySlug.get(f.slug) || []), `${f.field}: „${f.word}“`]);
  console.warn(
    `[news-copy] ${findings.length} Fundstellen mit Werbesprache in ${bySlug.size} CMS-Beiträgen (im Backoffice bereinigen, Slug nicht ändern):\n` +
      [...bySlug].map(([slug, list]) => `  - ${slug}: ${[...new Set(list)].join(", ")}`).join("\n")
  );
}
