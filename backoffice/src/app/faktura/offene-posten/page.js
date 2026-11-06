import { redirect } from "next/navigation";

// /faktura/offene-posten → Reiter „Offene Posten“ der Rechnungen (10-konzept-faktura § 3.4).
export default function OffenePosten() {
  redirect("/faktura/rechnungen?r=offene-posten");
}
