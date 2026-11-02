// /de/ezarri/pool – Einsatz-Welt (Team A, Konzept §3.2). Aufbau: src/components/Ezarri/Welt/EinsatzWelt.js
import EinsatzWelt, { einsatzMetadata } from "@/components/Ezarri/Welt/EinsatzWelt";

export async function generateMetadata({ params }) {
  return einsatzMetadata("pool", params);
}

export default function Page({ params }) {
  return <EinsatzWelt id="pool" params={params} />;
}
