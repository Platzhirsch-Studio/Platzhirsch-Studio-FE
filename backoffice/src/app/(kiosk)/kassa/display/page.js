import Kundendisplay from "@/components/Backoffice/Kassa/Kundendisplay";
import { kassaClient } from "@/lib/backoffice/kassa/daten";
import { rufe } from "@/lib/backoffice/kassa/frappe";
import { DISPLAY_VORSCHAU, DISPLAY_BILDER } from "@/lib/backoffice/kassa/display";
import { getGeraet } from "@/lib/backoffice/auth/dal";
import { IS_PRODUCTION } from "@/lib/backoffice/config";
import { kioskZugang } from "../../kiosk";

export const metadata = { title: "Kundendisplay" };
export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

// Kundendisplay (Team B-KAS, Konzept §2.1/§9, Lounge §10): /kassa/display?kasse=KASSE-LOCHAU-01.
// Eigenes Layout ohne Kopf, Gerätebindung über die Kiosk-Sitzung; Inhalt kommt live von der Kassa.
// ?vorschau=ruhe|einkauf|bezahlen|danke[&zahlart=bar] zeigt Musterdaten (nur außerhalb der Produktion, Abnahme).
export default async function KundendisplaySeite({ searchParams }) {
  const sp = await searchParams;
  const { session } = await kioskZugang("kassa");
  const geraet = await getGeraet().catch(() => null);
  const kontext = await rufe(kassaClient(session), "kontext", { kasse: NAME.test(sp?.kasse || "") ? sp.kasse : geraet?.kasse || undefined }).catch(() => null);
  const kasse = kontext?.kasse || sp?.kasse || "";
  const vorschau = !IS_PRODUCTION && DISPLAY_VORSCHAU[sp?.vorschau] ? DISPLAY_VORSCHAU[sp.vorschau](sp?.zahlart === "bar") : null;
  return (
    <Kundendisplay
      kasse={kasse}
      titel={kontext?.kasse_doc?.bezeichnung || "Kassa"}
      standort={kontext?.kasse_doc?.standort || ""}
      bilder={DISPLAY_BILDER}
      text={kontext?.einstellungen?.kundendisplay_text || ""}
      vorschau={vorschau}
    />
  );
}
