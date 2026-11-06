"use client";
// „+ Neue Ausgabe“ (P16): ein Klick legt die nächste Ausgabe an (Kennung = nächster freier Monat, Blockstruktur der
// letzten Ausgabe ohne Inhalt) und öffnet den Editor mit Fokus im Betreff. Rückgängig im Editor (Toast mit Aktion),
// weil hier nichts nach außen geht (sofort + Gegenaktion). Split-Menü: Leer beginnen · Kopie der letzten Ausgabe.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Menue, MenuePunkt } from "../Overlay";
import { useToast } from "../Toast";
import { ausgabeAnlegenAction } from "@/lib/backoffice/marketing/actions";
import { NEWSLETTER } from "@/lib/backoffice/marketing/texte";

export default function NeueAusgabe({ auto = false, gibtEs = null, primaer = true }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [laeuft, setLaeuft] = useState(false);
  const einmal = useRef(false);

  const anlegen = async (art = "struktur") => {
    if (laeuft) return;
    setLaeuft(true);
    const r = await ausgabeAnlegenAction({ art });
    setLaeuft(false);
    if (!r?.ok) {
      zeige(r?.message || "Nicht angelegt.", { art: "fehler" });
      return;
    }
    router.push(`/marketing/newsletter/${encodeURIComponent(r.name)}?angelegt=1&fokus=betreff`);
  };

  useEffect(() => {
    if (auto && !einmal.current) {
      einmal.current = true;
      if (gibtEs) zeige(NEWSLETTER.gibtEsSchon(gibtEs.monat), { art: "info", aktion: { titel: "Öffnen", onClick: () => router.push(`/marketing/newsletter/${encodeURIComponent(gibtEs.name)}`) } });
      else setTimeout(() => anlegen("struktur"), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return (
    <span className="inline-flex items-center gap-1">
      <Knopf variant={primaer ? "primary" : "secondary"} icon="Plus" laedt={laeuft} onClick={() => anlegen("struktur")} data-testid="neue-ausgabe">
        {NEWSLETTER.neueAusgabe}
      </Knopf>
      <Menue label="Weitere Arten" ausloeser={(p) => <Knopf {...p} variant={primaer ? "primary" : "secondary"} icon="ChevronDown" label="Weitere Arten anlegen" />}>
        <MenuePunkt icon="FileText" onWaehlen={() => anlegen("leer")}>
          {NEWSLETTER.leerBeginnen}
        </MenuePunkt>
        <MenuePunkt icon="RotateCcw" onWaehlen={() => anlegen("kopie")}>
          {NEWSLETTER.kopieLetzte}
        </MenuePunkt>
      </Menue>
    </span>
  );
}
