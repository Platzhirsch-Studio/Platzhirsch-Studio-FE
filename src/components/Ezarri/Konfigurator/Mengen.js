"use client";
// Ezarri-Konfigurator – Mengen und nächste Schritte. Flächen aus geometry.areas()
// (identisch mit der 3D-Geometrie), Mengen aus dem Rechner-Kern von Team C
// (rechner/core.js → quantities), Faktoren laut Ezarri. Keine Preise.
import { formatZahl } from "@/lib/ezarri/rechner/core";
import { AKTIONEN } from "@/lib/ezarri/konfigurator/copy";
import { useKonfCopy } from "./useKonfCopy";
import { useGeaendert } from "@/lib/ezarri/useGeaendert";
import { wechselKlasse } from "@/lib/ezarri/motion";

// Welle 2: Wandnamen aus geometry.js (deutsch) für die englische Seite.
const WAND_EN = { "Längswände": "Long walls", "Stirnwand flach": "End wall, shallow", "Stirnwand tief": "End wall, deep", "Rückwand": "Back wall", "Seitenwand links": "Side wall, left", "Seitenwand rechts": "Side wall, right", "Rückwand Küche": "Kitchen back wall", Wand: "Wall" };

export function MengenTabelle({ flaechen, mengen, mixLabels, spezial, cornerName, coveName }) {
  const { SEITE, t, en, locale, X, credit } = useKonfCopy();
  const zahl = (v, d) => formatZahl(v, d, locale);
  const qm = (v) => `${zahl(v, 2)} m²`;
  const bewegt = useGeaendert(mengen?.m2, mengen?.kartons); // Zahlwechsel erst nach der ersten Änderung
  const rows = [
    ...(flaechen.boden ? [[t("Boden", "Floor"), qm(flaechen.boden)]] : []),
    ...flaechen.waende.map((w) => [X ? X.waende[w.label] ?? w.label : en ? WAND_EN[w.label] ?? w.label : w.label, qm(w.m2)]),
    ...(flaechen.treppe ? [[t("Treppe (Tritt- und Setzstufen)", "Steps (treads and risers)"), qm(flaechen.treppe)]] : []),
    ...(flaechen.bank ? [[t("Sitzbank", "Bench"), qm(flaechen.bank)]] : []),
    ...(flaechen.rinne ? [[t("Rinne bzw. Überlaufkante", "Gutter or overflow edge"), qm(flaechen.rinne)]] : []),
  ];
  return (
    <div className="space-y-5" data-ezk-mengen="">
      <table className="w-full border-collapse text-ui">
        <caption className="sr-only">{t("Flächen", "Areas")}</caption>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-line">
              <th scope="row" className="py-2 pr-3 text-left font-normal text-text-soft">
                {k}
              </th>
              <td className="py-2 text-right tabular-nums">{v}</td>
            </tr>
          ))}
          <tr className="border-b border-line">
            <th scope="row" className="py-2 pr-3 text-left font-medium">
              {t("Fläche netto", "Net area")}
            </th>
            <td className="py-2 text-right font-medium tabular-nums">{qm(mengen.netto)}</td>
          </tr>
          <tr className="border-b border-line">
            <th scope="row" className="py-2 pr-3 text-left font-normal text-text-soft">
              {t(`mit ${mengen.margeProzent} % Reserve`, `with ${mengen.margeProzent} % reserve`, "reserve", { p: mengen.margeProzent })}
            </th>
            <td className="py-2 text-right tabular-nums">{qm(mengen.mitMarge)}</td>
          </tr>
        </tbody>
      </table>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 bg-surface-raised p-4">
        <div>
          <dt className="text-small text-text-soft">{t("Bestellmenge", "Order quantity")}</dt>
          <dd className="text-title tabular-nums"><span key={mengen.m2} className={wechselKlasse(bewegt)}>{qm(mengen.m2)}</span></dd>
        </div>
        <div>
          <dt className="text-small text-text-soft">{t("Kartons", "Boxes")}</dt>
          <dd className="text-title tabular-nums"><span key={mengen.kartons} className={wechselKlasse(bewegt)}>{zahl(mengen.kartons, 0)}</span></dd>
        </div>
        <div>
          <dt className="text-small text-text-soft">{t("Blätter (Netze)", "Sheets")}</dt>
          <dd className="text-ui tabular-nums">{zahl(mengen.blaetter, 0)}</dd>
        </div>
        <div>
          <dt className="text-small text-text-soft">{t("Gewicht Mosaik ca.", "Mosaic weight approx.")}</dt>
          <dd className="text-ui tabular-nums">{zahl(mengen.kgMosaik, 0)} kg</dd>
        </div>
        <div>
          <dt className="text-small text-text-soft">{t("Kleber laut Ezarri", "Adhesive according to Ezarri")}</dt>
          <dd className="text-ui tabular-nums">{zahl(mengen.kgKleber, 0)} kg</dd>
        </div>
        <div>
          <dt className="text-small text-text-soft">{t("Fugenmasse laut Ezarri", "Grout according to Ezarri")}</dt>
          <dd className="text-ui tabular-nums">{zahl(mengen.kgFuge, 0)} kg</dd>
        </div>
        {spezial.corner && (
          <div>
            <dt className="text-small text-text-soft">{t("Corner (Kanten)", "Corner (edges)")}</dt>
            <dd className="text-ui tabular-nums">
              {zahl(mengen.lfmCorner, 1)} {t("lfm", "running m")}{cornerName ? ` · ${cornerName}` : ""}
            </dd>
          </div>
        )}
        {spezial.cove && (
          <div>
            <dt className="text-small text-text-soft">{t("Cove (Hohlkehlen)", "Cove (coves)")}</dt>
            <dd className="text-ui tabular-nums">
              {zahl(mengen.lfmCove, 1)} {t("lfm", "running m")}{coveName ? ` · ${coveName}` : ""}
            </dd>
          </div>
        )}
      </dl>

      {mengen.mischung.length > 1 && (
        <table className="w-full border-collapse text-ui">
          <caption className="mb-1 text-left text-small font-medium">{t("Kartons je Mosaik der Mischung", "Boxes per mosaic in the blend")}</caption>
          <tbody>
            {mengen.mischung.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  {mixLabels[m.id] || m.id} <span className="text-text-soft">({m.anteil} %)</span>
                </th>
                <td className="py-2 text-right tabular-nums">
                  {zahl(m.kartons, 0)} {t("Kartons", "boxes")}&nbsp;· {qm(m.m2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-small text-text-soft">
        {SEITE.hinweisDaten} {SEITE.hinweisVerlegung} {credit("daten")}.
      </p>
    </div>
  );
}

export { AKTIONEN };
