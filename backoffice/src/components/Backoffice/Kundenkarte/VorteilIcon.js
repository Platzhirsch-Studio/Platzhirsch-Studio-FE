// Symbol je Vorteil-Art (Konzept §3.5.3): truck · wrench · droplets · calendar-heart · life-buoy · user-round ·
// circle-dot. Benannte lucide-Importe (nur diese sieben im Bundle). Server- und client-tauglich.

import { CalendarHeart, CircleDot, Droplets, LifeBuoy, Truck, UserRound, Wrench } from "lucide-react";

const ICONS = { Lieferung: Truck, Montage: Wrench, Pflege: Droplets, Event: CalendarHeart, Service: LifeBuoy, Persoenlich: UserRound, Sonstiges: CircleDot };

export function VorteilIcon({ art, className = "size-5" }) {
  const C = ICONS[art] || CircleDot;
  return <C aria-hidden="true" className={className} strokeWidth={1.75} />;
}

export default VorteilIcon;
