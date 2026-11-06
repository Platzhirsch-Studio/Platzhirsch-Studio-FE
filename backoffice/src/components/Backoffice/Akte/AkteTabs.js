"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import cx from "../cx";
import Segment from "../Segment";
import Knopf from "../Knopf";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import { begrenzeTabs, tabHref } from "@/lib/backoffice/akte/geruest";
import "./akte.css";

// Reiter der Akte (G-14 `AkteTabs`, Team P0-5a): iOS-Segment wie im Entwurf „Lounge“ (Kapsel,
// gleitender Tinte-Indikator, Zähler gedimmt), höchstens 6 Reiter (Q-B6), Zustand in der URL
// (`?tab=`, Q-B7; der erste Reiter ohne Parameter), `Alt+1…6` über das Kürzel-Register (Kontext
// „akte“). Inhalte laden „lazy“, weil die Seite nur den aktiven Reiter rendert.
// Unter 1280 px erscheint rechts daneben „Details“ als eigener Reiter (`?tab=seite`) für die rechte
// Spalte (Q-B6 „darunter als Tab“); ab 1280 px ist die Spalte sichtbar und der Knopf verschwindet.

/**
 * @param {object} p
 * @param {Array<{id:string, titel:string, anzahl?:number}>} p.tabs   höchstens 6 (Rest wird nicht gezeigt)
 * @param {string} p.aktiv          aktive Reiter-Id (aus searchParams.tab, siehe aktiverTab())
 * @param {string} p.basis          Pfad der Akte
 * @param {Record<string,string>} [p.params]  übrige Suchparameter (bleiben erhalten)
 * @param {string} [p.param]       Suchparameter des Reiters (Standard „tab“)
 * @param {boolean} [p.mitSeite]    Reiter „Details“ unter 1280 px (wenn die Akte eine rechte Spalte hat)
 * @param {import("react").ReactNode} [p.rechts]   rechts in der Zeile (z. B. Stufen-Pille)
 */
export default function AkteTabs({ tabs = [], aktiv, basis, params = {}, param = "tab", mitSeite = false, rechts, className, testid = "akte-tabs" }) {
  const router = useRouter();
  const { tabs: sicht } = useMemo(() => begrenzeTabs(tabs), [tabs]);
  const erster = sicht[0]?.id;
  const optionen = sicht.map((t) => ({ wert: t.id, titel: t.titel, anzahl: t.anzahl, href: tabHref(basis, t.id, params, erster, param), testid: `akte-tab-${t.id}` }));

  const kuerzel = {};
  sicht.forEach((t, i) => {
    kuerzel[`akte.tab-${i + 1}`] = () => router.push(tabHref(basis, t.id, params, erster, param), { scroll: false });
  });
  useKuerzel("akte", kuerzel);

  const seiteAn = aktiv === "seite";
  return (
    <div className={cx("bo-akte__reiter", className)} data-testid={testid}>
      <div className="bo-akte__reiter-l">
        <Segment label={TEXTE.akte.reiter} optionen={optionen} aktiv={seiteAn ? null : aktiv} />
        {mitSeite && (
          <Knopf
            variant={seiteAn ? "primary" : "secondary"}
            size="m"
            href={tabHref(basis, "seite", params, erster, param)}
            icon="Rows3"
            className="bo-akte__nur-schmal"
            aria-current={seiteAn ? "page" : undefined}
            data-testid="akte-tab-seite"
          >
            {TEXTE.akte.seiteKurz}
          </Knopf>
        )}
      </div>
      {rechts}
    </div>
  );
}
