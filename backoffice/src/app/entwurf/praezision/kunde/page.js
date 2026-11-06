import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import Shell from "@/components/Entwurf/Praezision/Shell";
import Kundenakte from "@/components/Entwurf/Praezision/Kundenakte";

export const metadata = { title: "Kundenakte" };

export default function Kunde() {
  return (
    <Shell
      aktiv="kunden"
      crumbs={["Kunden", "Johanna & Felix Ostermann"]}
      aktionen={
        <>
          <span className="t3 num" style={{ fontSize: 12, marginRight: 4 }}>3 / 412</span>
          <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Vorheriger Kunde"><ChevronUp /></button>
          <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Nächster Kunde"><ChevronDown /></button>
          <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Weitere Aktionen"><MoreHorizontal /></button>
        </>
      }
    >
      <Kundenakte />
    </Shell>
  );
}
