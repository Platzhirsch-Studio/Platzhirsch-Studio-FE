import { redirect } from "next/navigation";

// Kurzer Weg zu den Datenschutzanfragen des CRM (10-konzept-crm § 3.11).
export default function DatenschutzIndex() {
  redirect("/crm/datenschutz");
}
