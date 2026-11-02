// QM shell-home r3 (FR "Planifier"): a column link to the same page as the
// room's overview link ("Conseil et rendez-vous →") stood twice in a row in
// the menus. The menus drop such repeats (the footer keeps its own list);
// columns left empty disappear. Pure, no imports (node --test,
// tests/unit/qm-shell-home-r3.test.mjs).
const bare = (href) => String(href || "").split("#")[0].split("?")[0];

export function menuColumns(room) {
  const top = new Set([room?.all?.href, ...(room?.extra || []).map((l) => l.href)].filter(Boolean).map(bare));
  return (room?.columns || [])
    .map((column) => ({ ...column, links: (column.links || []).filter((l) => !top.has(bare(l.href))) }))
    .filter((column) => column.links.length > 0);
}
