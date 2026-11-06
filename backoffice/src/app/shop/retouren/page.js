// /shop/retouren → 307 auf Widerruf & Retouren, Segment Retouren (10-konzept-shop § 2.1).
import { redirect } from "next/navigation";

export default function RetourenUmleitung() {
  redirect("/shop/widerrufe?segment=retouren");
}
