// „Braucht Leitung“ (10-konzept-projekte.md § 5.1): AB vorhanden ohne Beauftragung, Referenzen eingereicht,
// Nachträge freigegeben ohne AB-Anpassung, Montage fertig ohne Abnahme. Server-Komponente, eigene Kachel.

import Link from "next/link";
import Kachel from "../Kachel";
import Leer from "../Leer";
import { Icon } from "../icons";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import { terminText } from "@/lib/backoffice/projekte/anzeige";
import "./projekte.css";

const enc = encodeURIComponent;
const sicher = async (fn) => {
  try {
    return await fn();
  } catch {
    return [];
  }
};

export default async function BrauchtLeitung({ client, heute, className }) {
  const [referenzen, nachtraege, fertig, angebot, abs] = await Promise.all([
    sicher(() => client.getList("PH Referenz", { fields: ["name", "titel", "projekt", "eingereicht_am"], filters: [["status", "=", "Eingereicht"]], limit: 20 })),
    sicher(() => client.getList("PH Nachtrag", { fields: ["name", "titel", "projekt", "entscheidung_am"], filters: [["status", "=", "Freigegeben"], ["uebernommen", "=", 0]], limit: 20 })),
    sicher(() => client.getList("PH Montageauftrag", { fields: ["name", "titel", "projekt", "ende"], filters: [["status", "=", "Erledigt"]], limit: 20 })),
    sicher(() => client.getList("PH Projekt", { fields: ["name", "titel"], filters: [["status", "=", "Angebot"]], limit: 100 })),
    sicher(() => client.getList("PH Auftragsbestaetigung", { fields: ["name", "projekt", "status"], filters: [["status", "!=", "Storniert"]], limit: 300 })),
  ]);
  const mitAb = new Set(abs.map((a) => a.projekt).filter(Boolean));
  const eintraege = [
    ...angebot.filter((p) => mitAb.has(p.name)).map((p) => ({ id: `ab:${p.name}`, icon: "Receipt", ton: "cognac", titel: `${p.titel} – AB vorhanden, Beauftragen?`, href: `/projekte/${enc(p.name)}`, zeit: "" })),
    ...nachtraege.map((n) => ({ id: `nt:${n.name}`, icon: "Layers", ton: "eiche", titel: `${n.titel} – AB noch nicht angepasst`, href: `/projekte/objekt/nachtraege/${enc(n.name)}`, zeit: n.entscheidung_am ? terminText(n.entscheidung_am, heute, { mitZeit: false }) : "" })),
    ...fertig.map((m) => ({ id: `mo:${m.name}`, icon: "PenTool", ton: "see", titel: `${m.titel} – fertig, Abnahme offen`, href: `/projekte/montagen/${enc(m.name)}`, zeit: m.ende ? terminText(m.ende, heute, { mitZeit: false }) : "" })),
    ...referenzen.map((r) => ({ id: `re:${r.name}`, icon: "Star", ton: "salbei", titel: `Referenz „${r.titel}“ prüfen`, href: `/projekte/referenzen/${enc(r.name)}`, zeit: r.eingereicht_am ? terminText(r.eingereicht_am, heute, { mitZeit: false }) : "" })),
  ];
  return (
    <Kachel titel={TEXTE.uebersicht.brauchtLeitung} unter={eintraege.length ? `${eintraege.length} Vorgänge warten auf eine Entscheidung` : undefined} className={className} testid="braucht-leitung">
      {eintraege.length ? (
        <ul className="bo-prj-liste">
          {eintraege.slice(0, 5).map((e) => (
            <li key={e.id}>
              <span className="bo-prj-liste__ico" data-ton={e.ton} aria-hidden="true">
                <Icon name={e.icon} className="size-4" />
              </span>
              <Link href={e.href} className="min-w-0 flex-1 focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none">
                <span className="bo-prj-titel block truncate text-[15px] leading-5">{e.titel}</span>
              </Link>
              {e.zeit && <span className="bo-prj-liste__zeit">{e.zeit}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <Leer art="erledigt" groesse="karte" titel={TEXTE.uebersicht.brauchtLeitungLeer} />
      )}
    </Kachel>
  );
}
