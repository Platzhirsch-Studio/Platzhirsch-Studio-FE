"use client";
// Bar oder Karte? → An der Kassa (E1, § 3.3). Fundament-Baustein AnDieKassa + bis K2 die große Bestellnummer
// zum Eintippen an der Kassa und „Nummer kopieren“. Nie ein Bargeld-Feld im Backoffice.
import { useState } from "react";
import AnDieKassa from "@/components/Backoffice/AnDieKassa";
import Knopf from "@/components/Backoffice/Knopf";
import { T } from "@/lib/backoffice/shop/texte";
import ShopIcon from "./ShopIcon";

export default function KassaHinweis({ darf, beleg, kunde, variante = "zahlung", flaeche = false, mitNummer = false }) {
  const [kopiert, setKopiert] = useState(false);
  return (
    <div className="flex flex-col gap-3" data-testid="kassa-hinweis">
      <AnDieKassa darf={darf} variante={variante} beleg={beleg} kunde={kunde} flaeche={flaeche} />
      {mitNummer && beleg && (
        <div className="bo-shop-flaeche flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block text-[13px] text-bo-text-soft">{T.kassa.nummerSatz}</span>
            <span className="bo-shop-code bo-shop-code--gross" data-testid="kassa-nummer">{beleg}</span>
          </span>
          <Knopf onClick={async () => { try { await navigator.clipboard.writeText(beleg); } catch { /* ohne Zwischenablage */ } setKopiert(true); }}>
            <ShopIcon name="Copy" /> {kopiert ? T.toast.nummerKopiert : "Nummer kopieren"}
          </Knopf>
        </div>
      )}
    </div>
  );
}
