import { Plus, Upload } from "lucide-react";
import Shell from "@/components/Entwurf/Praezision/Shell";
import AnfragenAnsicht from "@/components/Entwurf/Praezision/AnfragenAnsicht";
import { Kbd } from "@/components/Entwurf/Praezision/ui";

export const metadata = { title: "Anfragen" };

export default function Anfragen() {
  return (
    <Shell
      aktiv="anfragen"
      fest
      crumbs={["Verkauf", "Anfragen"]}
      aktionen={
        <>
          <button type="button" className="pz-btn pz-btn--ghost"><Upload aria-hidden />Import</button>
          <button type="button" className="pz-btn pz-btn--primary" style={{ marginRight: 4 }}><Plus aria-hidden />Neue Anfrage <Kbd>C</Kbd></button>
        </>
      }
    >
      <AnfragenAnsicht />
    </Shell>
  );
}
