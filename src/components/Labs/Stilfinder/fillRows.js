// Stil-Finder Moodboard (QM r3): Zellen je Kachel im 4er-Raster (md): groß 4, breit 2, sonst 1.
// Fällt eine Kachel weg (Bild nicht ladbar), endet das Raster trotzdem mit voller letzter
// Reihe – keine Waise allein in der letzten Reihe. Fehlen 3 bzw. 2 Zellen, werden eine bzw.
// zwei Einzelkacheln (vom Ende) zu Breitkacheln; fehlt 1 Zelle, entfällt die letzte
// Einzelkachel. So geht höchstens ein Stück verloren. Rein, node --test.
const cells = (it, i) => ((it.tile ? it.tile === "big" : i === 0) ? 4 : (it.tile ? it.tile === "wide" : i === 5) ? 2 : 1);

export function fillRows(list) {
  const out = [...list];
  const total = out.reduce((n, it, i) => n + cells(it, i), 0);
  const rem = total % 4;
  if (!rem) return out;
  const singles = out.map((it, i) => (cells(it, i) === 1 ? i : -1)).filter((i) => i >= 0);
  if (rem === 1) {
    if (singles.length) out.splice(singles[singles.length - 1], 1);
    return out;
  }
  const widen = 4 - rem; // 3 fehlen → 1 breiter, 2 fehlen → 2 breiter
  if (singles.length < widen) return out;
  for (const i of singles.slice(-widen)) out[i] = { ...out[i], tile: "wide" };
  return out;
}
