// Maßzeichnung eines Mosaikblatts (Konzept §3.5 „DimensionDrawing“): SVG mit
// Steinraster aus steine_pro_blatt, Blattmaß und Steinmaß als HTML-Beschriftung
// (bleibt bei 375 px lesbar, skaliert mit dem Zoom). Fehlende Werte → null
// (die Detailseite zeigt dann die Lücke in den Fakten).
import { useLocale } from "next-intl";
import { ezT } from "@/lib/ezarri/werte";

const num = (s) => Number.parseFloat(String(s ?? "").replace(",", "."));
const pair = (s) => {
  const m = String(s ?? "").match(/([\d.,]+)\s*x\s*([\d.,]+)/i);
  return m ? [num(m[1]), num(m[2])] : null;
};
const fmtDe = (n) => String(n).replace(".", ",");
const fmtEn = (n) => String(n);

/** @param {{blatt?:string, steine?:string, stein?:string, fuge?:string, hexa?:boolean}} p */
export default function SheetDrawing({ blatt, steine, stein, fuge, hexa = false, legend }) {
  const locale = useLocale();
  const en = locale === "en";
  const t = ezT(locale);
  const fmt = en ? fmtEn : fmtDe;
  const b = pair(blatt);
  const s = pair(steine);
  if (!b || !s) return null;
  const [bw, bh] = b; // cm
  const [cols, rows] = s;
  if (!(bw > 0 && bh > 0 && cols > 0 && rows > 0 && cols <= 40 && rows <= 40)) return null;
  const W = 300;
  const H = Math.round((bh / bw) * W);
  const gap = Math.max(0.6, W / cols / 22);
  const cw = W / cols;
  const ch = H / rows;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = c * cw + (hexa && r % 2 ? cw / 2 : 0);
      if (hexa && r % 2 && c === cols - 1) continue;
      cells.push(<rect key={`${r}-${c}`} x={x + gap / 2} y={r * ch + gap / 2} width={cw - gap} height={ch - gap} />);
    }
  }
  return (
    <figure className="max-w-sm">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(`Mosaikblatt ${fmt(bw)} × ${fmt(bh)} cm mit ${cols} × ${rows} Steinen`, `Mosaic sheet ${fmt(bw)} × ${fmt(bh)} cm with ${cols} × ${rows} tiles`, `Plaque de mosaïque ${fmt(bw)} × ${fmt(bh)} cm avec ${cols} × ${rows} tesselles`, `Foglio di mosaico ${fmt(bw)} × ${fmt(bh)} cm con ${cols} × ${rows} tessere`)} className="w-full">
          <rect x="0" y="0" width={W} height={H} className="fill-stone-deep" />
          <g className="fill-surface-raised">{cells}</g>
        </svg>
        <span className="text-small tabular-nums text-text-soft [writing-mode:vertical-rl]">{fmt(bh)} cm</span>
      </div>
      <p className="mt-1 text-center text-small tabular-nums text-text-soft pr-8">{fmt(bw)} cm</p>
      <figcaption className="mt-3 text-small text-text-soft">
        {cols} × {rows} {t("Steine", "tiles", "tesselles", "tessere")}{stein ? ` · ${t("Stein", "tile", "tesselle", "tessera")} ${stein}` : ""}
        {fuge ? ` · ${t("Fuge", "joint", "joint", "fuga")} ${fuge}` : ""}
        {legend ? ` · ${legend}` : ""}
      </figcaption>
    </figure>
  );
}
