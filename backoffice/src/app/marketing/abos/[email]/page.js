// Alte Route: dauerhaft (308) auf die Personen-Akte.
import { permanentRedirect } from "next/navigation";

export default async function AboAlt({ params }) {
  const { email } = await params;
  permanentRedirect(`/marketing/empfaenger/${email}`);
}
