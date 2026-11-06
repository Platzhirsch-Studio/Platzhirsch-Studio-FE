"use client";
// Öffnet den Einstellen-Assistenten aus der URL (?einstellen=1, z. B. Kanban-Zug nach „Eingestellt“) und entfernt den
// Parameter beim Schließen.

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useWechsel } from "./hooks";
import { EinstellenAssistent } from "./Assistenten";

export function EinstellenAssistentStart({ bewerbung, uebrige, offen: start }) {
  const router = useRouter();
  const pfad = usePathname();
  const [offen, setOffen] = useState(start);
  useWechsel(start, setOffen);
  return (
    <EinstellenAssistent
      offen={offen}
      bewerbung={bewerbung}
      uebrige={uebrige}
      onSchliessen={() => {
        setOffen(false);
        router.replace(pfad, { scroll: false });
      }}
    />
  );
}
