"use client";
// „Zu tun“ des Bereichs Faktura (§ 3.1): oben über die volle Breite, höchstens 8 Zeilen, jede Zeile Symbolform +
// Typ-Wort + Satz + Betrag + genau eine Aktion. Enter öffnet den Beleg, ⇧↵ oder der Knopf führt die Aktion aus.
// Erledigte Zeilen blenden aus (160 ms). Keine Zeile → „Alles erledigt“ (Häkchen, ohne Aktion).

import Link from "next/link";
import { useState } from "react";
import Knopf from "../Knopf";
import Leer from "../Leer";
import { cent } from "@/lib/backoffice/format";
import { LEER } from "@/lib/backoffice/faktura/texte";
import { useFaktura } from "./Aktionen";
import { FIcon } from "./teile";

const FLAECHE = { see: "bg-bo-see-soft text-bo-see-text", eiche: "bg-bo-eiche-soft text-bo-eiche-text", cognac: "bg-bo-cognac-soft text-bo-cognac-text", ziegel: "bg-bo-ziegel-soft text-bo-ziegel-text", stein: "bg-bo-fill-2 text-bo-text-soft", salbei: "bg-bo-salbei-soft text-bo-salbei-text" };

export default function ZuTunListe({ zeilen = [], ersteSchritte = false, testid = "faktura-zutun" }) {
  const { ausfuehren } = useFaktura();
  const [weg, setWeg] = useState(() => new Set());
  const sichtbar = zeilen.filter((z) => !weg.has(z.id));

  if (!sichtbar.length && ersteSchritte) {
    return (
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" data-testid="erste-schritte">
        {[
          ["Firmendaten prüfen", "/einstellungen"],
          ["Zahlungsbedingungen", "/faktura/stammdaten?tab=zahlungsbedingungen"],
          ["Bankkonto", "/faktura/stammdaten?tab=bankkonten"],
          ["Erstes Angebot", "/faktura/angebote?panel=angebot"],
        ].map(([t, h], i) => (
          <li key={t}>
            <Link href={h} className="flex items-center gap-3 rounded-bo-zeile bg-bo-surface-2 px-4 py-3 text-[14px] font-medium hover:bg-bo-fill-2">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-bo-surface text-[13px] tabular-nums">{i + 1}</span>
              {t}
            </Link>
          </li>
        ))}
      </ol>
    );
  }
  if (!sichtbar.length) return <Leer art="erledigt" titel={LEER.zuTunErledigt} groesse="karte" />;

  return (
    <ul className="bo-fk-zutun" data-testid={testid}>
      {sichtbar.map((z) => (
        <li
          key={z.id}
          className="bo-fk-zutun__zeile"
          data-zutun-zeile=""
          data-weg={weg.has(z.id) || undefined}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              ausfuehren(z.aktion.id, { name: z.aktion.daten?.name || z.aktion.daten?.auftrag, href: z.aktion.href, daten: z.aktion.daten });
            } else if (e.key === "Enter" && z.href) {
              e.preventDefault();
              window.location.assign(z.href);
            }
          }}
        >
          <span className={`bo-fk-zutun__symbol ${FLAECHE[z.ton] || FLAECHE.stein}`} aria-hidden="true">
            <FIcon name={z.icon} className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-bo-text-soft">{z.typ}</span>
            {z.href ? (
              <Link href={z.href} className="block truncate text-[15px] font-semibold text-bo-text hover:underline">
                {z.satz}
              </Link>
            ) : (
              <span className="block truncate text-[15px] font-semibold text-bo-text">{z.satz}</span>
            )}
          </span>
          <span className="bo-fk-zutun__betrag text-right text-[15px] tabular-nums text-bo-text">{z.betrag_cent ? cent(z.betrag_cent) : ""}</span>
          <span className="bo-fk-zutun__aktion">
            <Knopf
              size="m"
              variant="secondary"
              href={z.aktion.href}
              onClick={
                z.aktion.href
                  ? undefined
                  : async () => {
                      const ok = await ausfuehren(z.aktion.id, { name: z.aktion.daten?.name || z.aktion.daten?.auftrag, daten: z.aktion.daten?.zeilen ? z.aktion.daten : { ...z.aktion.daten, zeilen: z.aktion.daten?.zeilen } });
                      if (ok && z.aktion.id === "er-freigeben") setWeg((s) => new Set(s).add(z.id));
                    }
              }
              data-testid={`zutun-${z.id}`}
            >
              {z.aktion.titel}
            </Knopf>
          </span>
        </li>
      ))}
    </ul>
  );
}
