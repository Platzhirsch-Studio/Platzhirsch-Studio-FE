import Kundendisplay from "@/components/Entwurf/Lounge/Kundendisplay";

export const metadata = { title: "Kundendisplay" };

const ZUSTAENDE = ["ruhe", "einkauf", "bezahlen", "danke"];

// Entwurf: Zustand per ?zustand=ruhe|einkauf|bezahlen|danke, Zahlart per ?zahlart=karte|bar.
// In der Bauphase: /kassa/display?kasse=K1, Zustand kommt live von der Kassa (SSE bzw. BroadcastChannel).
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const zustand = ZUSTAENDE.includes(sp?.zustand) ? sp.zustand : "ruhe";
  const zahlart = sp?.zahlart === "bar" ? "bar" : "karte";
  return <Kundendisplay zustand={zustand} zahlart={zahlart} />;
}
