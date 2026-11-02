// Küchenplaner – Qualitätsstufen der 3D-Ansicht (ohne three.js, damit testbar).
// Start nach Gerät, danach regelt ein Bildzeit-Wächter herunter, wenn die Szene beim
// Drehen ruckelt. Nie wieder hoch in derselben Sitzung (kein Hin- und Herspringen).

/** 0 = sparsam, 1 = mittel (bisher „mobil“), 2 = hoch (bisher Desktop). */
export const TIERS = [
  { id: "sparsam", dpr: 1, ao: false, areaLights: false, pendantLights: false },
  { id: "mittel", dpr: [1, 1.5], ao: false, areaLights: false, pendantLights: false },
  { id: "hoch", dpr: [1, 1.75], ao: true, areaLights: true, pendantLights: true },
];

/** Startstufe aus groben Gerätemerkmalen (alle optional). */
export function initialTier({ coarse = false, width = 1280, cores = 8, saveData = false } = {}) {
  if (saveData) return 0;
  if (coarse || width < 768) return 1;
  if (cores && cores <= 2) return 1;
  return 2;
}

/**
 * Bildzeit-Wächter für frameloop="demand": misst nur Abstände zwischen direkt
 * aufeinanderfolgenden Bildern (Drehen, Dämpfung, Kamerafahrt). Pausen > gapMs
 * (Szene ruht) zählen nicht. Nach `n` Messungen: Median über dem Budget → true.
 */
export function createFrameBudget({ budgetMs = 1000 / 45, n = 40, gapMs = 120 } = {}) {
  let last = null;
  let samples = [];
  return function push(now) {
    const dt = last === null ? Infinity : now - last;
    last = now;
    if (!(dt < gapMs)) return false;
    samples.push(dt);
    if (samples.length < n) return false;
    const sorted = samples.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    samples = [];
    return median > budgetMs;
  };
}
