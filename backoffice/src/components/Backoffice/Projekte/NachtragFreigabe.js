"use client";
// Nachtrag – Freigabe vor Ort mit Unterschrift (10-konzept-projekte.md § 5.12): ohne Unterschrift und Namen nicht
// speicherbar; Portal-Vorlage erst mit Fähigkeit projekte.nachtrag_portal. Signaturfeld immer hell (§ 3.9).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Unterschrift from "../Eingabe/Unterschrift";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { nachtragFreigabeAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export default function NachtragFreigabe({ name, kunde, erklaerung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [sig, setSig] = useState(null);
  const [nameKunde, setNameKunde] = useState(kunde || "");
  const [pending, start] = useTransition();
  const los = () =>
    start(async () => {
      const r = await nachtragFreigabeAction({ name, unterschrift: sig, nameKunde });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige("Nachtrag freigegeben", { art: "ok" });
      router.refresh();
    });
  return (
    <div className="flex flex-col gap-4" data-testid="nachtrag-freigabe">
      <div className="bo-prj-signatur-hell">
        <Unterschrift erklaerung={erklaerung} name={nameKunde} onUebernommen={(e) => setSig(e.png)} />
      </div>
      <label className="block">
        <span className="text-[13px] font-medium text-bo-text-soft">{TEXTE.abnahme.nameKunde}</span>
        <input className="bo-input mt-1 w-full" value={nameKunde} onChange={(e) => setNameKunde(e.target.value)} />
      </label>
      <div className="flex items-center justify-end gap-2">
        <Knopf variant="primary" laedt={pending} disabled={!sig || !nameKunde.trim()} grund={!sig ? TEXTE.nachtrag.unterschriftPflicht : undefined} onClick={los} data-testid="nachtrag-freigeben">
          {TEXTE.nachtrag.freigabeVorOrt}
        </Knopf>
      </div>
    </div>
  );
}
