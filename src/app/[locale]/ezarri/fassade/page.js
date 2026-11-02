// /de/ezarri/fassade – Einsatz-Welt (Team A, Konzept §3.2). Aufbau: src/components/Ezarri/Welt/EinsatzWelt.js
import EinsatzWelt, { einsatzMetadata } from "@/components/Ezarri/Welt/EinsatzWelt";

export async function generateMetadata({ params }) {
  return einsatzMetadata("fassade", params);
}

export default function Page({ params }) {
  return <EinsatzWelt id="fassade" params={params} />;
}
