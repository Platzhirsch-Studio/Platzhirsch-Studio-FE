// /marketing/berichte – leitet auf den ersten Bericht (Newsletter-Entwicklung).
import { redirect } from "next/navigation";

export default function BerichteStart() {
  redirect("/marketing/berichte/newsletter-entwicklung");
}
