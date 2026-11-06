"use client";
// Zeilenknopf „Einlösung zurücknehmen“ (Leitung, Pflichtgrund) in der Gutscheinakte (§ 5.3).
import Knopf from "@/components/Backoffice/Knopf";
import { useShopAktionen } from "./ShopAktionen";

export default function EinloesungZurueck({ doc, beleg, belegDoctype, betrag }) {
  const { ausfuehren } = useShopAktionen();
  return (
    <Knopf size="s" variant="ghost" onClick={() => ausfuehren("einloesung-zuruecknehmen", doc, { beleg, beleg_doctype: belegDoctype, betrag_cent: betrag })}>
      Zurücknehmen
    </Knopf>
  );
}
