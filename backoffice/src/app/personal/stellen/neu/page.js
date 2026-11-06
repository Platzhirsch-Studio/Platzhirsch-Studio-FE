import { redirect } from "next/navigation";

// Alte Route (Konzept § 3.1): /personal/stellen/neu → /personal/stellen?neu=1 (Neu-Dialog).
export default function StelleNeu() {
  redirect("/personal/stellen?neu=1");
}
