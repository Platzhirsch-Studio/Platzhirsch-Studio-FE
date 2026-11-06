// /shop/bestellungen/neu → 307 auf den Dialog „Telefonbestellung“ (10-konzept-shop § 2.1).
import { redirect } from "next/navigation";

export default function NeueBestellungUmleitung() {
  redirect("/shop/bestellungen?neu=telefon");
}
