"use client";
// Texte des Konfigurators in der Sprache der Seite (Welle 2, Englisch).
// Eigenes Modul, damit Stage, Picker, Mengen … es ohne Kreis-Import nutzen.
// FR/IT (01.11.2026): Texte kommen vom Server über <ToolCopyProvider> (ToolCopy.js);
// t(de, en, key, vars) liest dort UI[de] bzw. UI_TPL[key]. X = kleine Tabellen
// (Ecken, Wände, Typen, Legenden, Credits) oder null auf de/en.
import { useMemo } from "react";
import { useLocale } from "next-intl";
import * as KONF_DE from "@/lib/ezarri/konfigurator/copy";
import * as KONF_EN from "@/lib/ezarri/konfigurator/copy.en";
import { fill, makeT } from "@/lib/ezarri/konfigurator/intl";
import { ezarriCredit } from "@/lib/ezarri/config";
import { useToolCopy } from "./ToolCopy";

/**
 * Welle 2 (Englisch): Texte des Konfigurators je Sprache. Beide Fassungen sind
 * klein (je ~6 KB); der Server rendert de und en parallel, deshalb ein Hook
 * statt Modul-Zustand.
 */
// Stabile Funktionen (gleiche Referenz je Sprache) – sicher in Hook-Abhängigkeiten.
const T_DE = (de) => de;
const T_EN = (_de, en) => en;

const CREDIT_DE = (kind) => ezarriCredit(kind, "de");
const CREDIT_EN = (kind) => ezarriCredit(kind, "en");

/** zusammenfassung() aus den Vorlagen (wie copy-intl.js, ohne Server-Import). */
function zusammenfassungAus(Z) {
  return ({ szene, becken, mixText, fugeName, formatLabel }) => {
    const m = (v) => String(v).replace(".", ",");
    const ort = fill(Z[szene] || Z.kueche, { l: m(becken.l), b: m(becken.b), tFlach: m(becken.tFlach), tTief: m(becken.tTief) });
    return fill(Z.satz, { ort, mixText, fugeName, formatLabel });
  };
}

export function useKonfCopy() {
  const locale = useLocale();
  const intl = useToolCopy()?.KONF || null;
  const fremd = useMemo(() => {
    if (!intl) return null;
    const X = intl.LISTEN;
    return { ...intl, X, t: makeT(intl), zusammenfassung: zusammenfassungAus(intl.ZUSAMMENFASSUNG), credit: (kind) => X.credit[kind] || ezarriCredit(kind, "de") };
  }, [intl]);
  if (fremd) return { ...fremd, en: false, locale };
  const en = locale === "en";
  return { ...(en ? KONF_EN : KONF_DE), en, locale, t: en ? T_EN : T_DE, X: null, credit: en ? CREDIT_EN : CREDIT_DE };
}
