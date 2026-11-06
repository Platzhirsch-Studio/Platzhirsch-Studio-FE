import { redirect } from "next/navigation";

// /kunden ohne Kontakt → Liste „Kunden & Kontakte“ (kanonische Route der Kundenakte ist /kunden/[kontakt]).
export default function KundenIndex() {
  redirect("/crm/kontakte");
}
