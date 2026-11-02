// /de/ezarri/kueche – Einsatz-Welt (Team A, Konzept §3.2). Aufbau: src/components/Ezarri/Welt/EinsatzWelt.js
import EinsatzWelt, { einsatzMetadata } from "@/components/Ezarri/Welt/EinsatzWelt";

export async function generateMetadata({ params }) {
  return einsatzMetadata("kueche", params);
}

export default function Page({ params }) {
  return <EinsatzWelt id="kueche" params={params} />;
}
