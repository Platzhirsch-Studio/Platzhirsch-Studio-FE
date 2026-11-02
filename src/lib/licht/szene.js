// Bodensee-Licht (N4) – Umrechnung Sonnenstand → Szenen-Koordinaten (three.js,
// y oben). Vereinbarung für alle Szenen: Die −Z-Achse der Szene schaut nach
// draußen in Richtung `fensterAzimut` (Kompassgrad, z. B. 225 = Südwest);
// +X liegt beim Hinausschauen rechts. Eine Szene, deren Fenster anders liegt,
// dreht einfach ihren Licht-Container (siehe SonnenLicht `drehung`).

const RAD = Math.PI / 180;

/** Einheitsvektor zur Sonne [x, y, z] in Szenen-Koordinaten. */
export function richtungInSzene(azimut, hoehe, fensterAzimut = 180) {
  const r = (azimut - fensterAzimut) * RAD;
  const h = hoehe * RAD;
  return [Math.cos(h) * Math.sin(r), Math.sin(h), -Math.cos(h) * Math.cos(r)];
}

/** Schattenkarte: mobil höchstens 1024², sonst 2048² (Akzeptanz N4 §5.4/4). */
export const SCHATTEN_MOBIL = 1024;
export const SCHATTEN_DESKTOP = 2048;
export const schattenGroesse = (mobil) => (mobil ? SCHATTEN_MOBIL : SCHATTEN_DESKTOP);

/** Lochau-HDRI vom Inhaber (Belichtungsreihe am See). Solange null: Szenen nutzen
 *  ihr vorhandenes CC0-HDR bzw. den physikalischen Himmel (LichtSzene). */
export const LOCHAU_HDRI = null;
/** Vorhandenes CC0-HDR (Poly Haven „Studio Small 09“, 256 × 128) als Rückfall. */
export const CC0_HDRI = "/labs/kuechenplaner/hdr/studio_small_09_256.hdr";
/** CC0-Texturen (ambientCG) aus dem Küchenplaner. */
export const TEXTUR_BASIS = "/labs/kuechenplaner";
