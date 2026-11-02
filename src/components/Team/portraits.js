// Portraits of the team (QA Runde 1, P1-2). The backoffice currently gives
// three people the same showroom photo (with a cut-off manufacturer sign)
// instead of a portrait. An image that more than one active member shares is
// therefore treated as "no own portrait": the page shows a quiet initials tile
// instead (PortraitTile). Once the portraits are uploaded (shot list,
// Marktresearch/digital/redesign/inhaltsseiten.md §8) they appear automatically.
// Pure logic: no hooks, safe in server components and in node --test.

/** Members with `portrait` = "/cms…" path or null (no own portrait). */
export function withPortraits(team) {
  const list = Array.isArray(team) ? team.filter((m) => m?.status === "Aktiv") : [];
  const count = new Map();
  for (const m of list) if (m?.image) count.set(m.image, (count.get(m.image) || 0) + 1);
  return list.map((m) => ({
    ...m,
    portrait: m?.image && count.get(m.image) === 1 ? `/cms${m.image}` : null,
  }));
}

/** "Susanne Messmer" → "SM" (first and last name part). */
export function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return `${first}${last}`.toUpperCase();
}

/**
 * Portraits for page openings / teasers: the members with an own portrait.
 * @returns {Array<{name: string, src: string}>}
 */
export function portraitsOf(team) {
  return withPortraits(team)
    .filter((m) => m.portrait)
    .map((m) => ({ name: m.title || "", src: m.portrait }));
}
