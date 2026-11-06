// /shop/einstellungen – Shop-Einstellungen (T9; 10-konzept-shop § 4.10; Leitung, GF lesend). Reiter = Route
// (?tab=shop|versand|gutscheine|rechtstexte|stripe). Live schalten nur über den Block „Shop-Modus“ (E18).
import { zugang } from "@/lib/backoffice/shop/zugang";
import { einstellungen } from "@/lib/backoffice/shop/daten";
import { prueflisteFuer } from "@/lib/backoffice/shop/pruefliste";
import { darfEinstellungen } from "@/lib/backoffice/shop/rechte";
import { T } from "@/lib/backoffice/shop/texte";
import { datumZeit } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import { Band } from "@/components/Backoffice/Akte";
import { ShopModusBlock, EinstellungenForm } from "@/components/Backoffice/Shop/Einstellungen";

export const metadata = { title: "Einstellungen · Shop" };
export const dynamic = "force-dynamic";

const TABS = [["shop", "Shop"], ["versand", "Versand"], ["gutscheine", "Gutscheine"], ["rechtstexte", "Rechtstexte"], ["stripe", "Stripe"]];

export default async function ShopEinstellungen({ searchParams }) {
  const sp = await searchParams;
  const ctx = await zugang("/shop/einstellungen", darfEinstellungen);
  const { client, session, leitung } = ctx;
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab : "shop";
  const [eins, pruefliste] = await Promise.all([einstellungen(client), prueflisteFuer(client)]);
  const s = eins.shop || {};
  const st = eins.stripe || {};
  const felder = {
    shop: [
      { name: "testmodus_mail_an", label: "Mails im Testmodus an", typ: "text" },
      { name: "abholung_frist_tage", label: "Abholfrist (Tage)", typ: "zahl" },
      { name: "reservierung_frist_tage", label: "Reservierung gültig (Tage)", typ: "zahl" },
      { name: "zahlungslink_gueltig_stunden", label: "Zahlungslink gültig (Stunden)", typ: "zahl" },
      { name: "oss_aktiv", label: "Steuersatz des Lieferlands (OSS)", typ: "schalter", sensibel: "Ab jetzt wird der Steuersatz des Lieferlands berechnet – nur nach Abstimmung mit dem Steuerberater." },
    ],
    versand: [
      { name: "versand_pauschale_at_cent", label: "Pauschale Österreich", typ: "cent" },
      { name: "versand_pauschale_de_cent", label: "Pauschale Deutschland", typ: "cent" },
      { name: "versand_frei_ab_cent", label: "Versandfrei ab", typ: "cent" },
      { name: "auto_abschliessen_tage", label: "Automatisch abschließen nach (Tagen)", typ: "zahl", hinweis: "mindestens 28 Tage plus Laufzeit (0 = aus)" },
    ],
    gutscheine: [
      { name: "gutschein_art_standard", label: "Art", typ: "lesen", wert: "Mehrzweck", hinweis: "Einzweckgutscheine erst nach Steuerberater-Freigabe" },
      { name: "gutschein_gueltig_jahre", label: "Gültigkeit (Jahre)", typ: "zahl", hinweis: "0 = unbefristet (empfohlen). Befristung nur nach Rechtsprüfung." },
      { name: "gutschein_min_cent", label: "Mindestwert", typ: "cent" },
      { name: "gutschein_max_cent", label: "Höchstwert", typ: "cent" },
    ],
    rechtstexte: [
      { name: "rechtstexte_status", label: "Stand der Rechtstexte", typ: "segment", optionen: [{ wert: "kanzlei-offen", titel: "Kanzlei offen" }, { wert: "entwurf", titel: "Entwurf" }, { wert: "freigegeben", titel: "Freigegeben" }], hinweis: "Anhänge an die Bestellbestätigung nur bei „freigegeben“." },
      { name: "agb_stand", label: "AGB-Stand", typ: "lesen" },
      { name: "widerrufsbelehrung_stand", label: "Widerrufsbelehrung", typ: "lesen" },
      { name: "datenschutz_stand", label: "Datenschutz", typ: "lesen" },
    ],
    stripe: [
      { name: "testmodus", label: "Testmodus", typ: "schalter" },
      { name: "simulation", label: "Simulation (ohne Stripe)", typ: "schalter" },
      { name: "vier_augen_ab_cent", label: "Vier-Augen-Grenze für Erstattungen", typ: "cent", sensibel: "Erstattungen über dieser Grenze brauchen die Freigabe der Geschäftsführung." },
      { name: "auszahlung_abgleich_tage", label: "Ohne Auszahlung melden nach (Tagen)", typ: "zahl" },
      { name: "schluessel_vorhanden", label: "Geheimer Schlüssel", typ: "lesen", wert: Number(st.schluessel_vorhanden) ? "vorhanden" : "fehlt" },
      { name: "webhook_secret_vorhanden", label: "Webhook-Geheimnis", typ: "lesen", wert: Number(st.webhook_secret_vorhanden) ? "vorhanden" : "fehlt" },
      { name: "webhook_pfad", label: "Webhook-Pfad", typ: "lesen", breit: true },
      { name: "letzter_abgleich", label: "Letzter Abgleich", typ: "lesen", wert: st.letzter_abgleich ? datumZeit(st.letzter_abgleich) : "–" },
    ],
  };
  const werte = tab === "stripe" ? st : s;
  return (
    <Rahmen session={session} modus={client.modus}>
      <Seitenkopf titel="Einstellungen" krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Shop", href: "/shop" }, { titel: "Einstellungen" }]} unternav={<Segment label="Bereich" aktiv={tab} optionen={TABS.map(([w, t]) => ({ wert: w, titel: t, href: `/shop/einstellungen?tab=${w}` }))} />} />
      <Erstbesuch text={T.erstbesuch.einstellungen} route="/shop/einstellungen" />
      {s.shop_modus === "live" && pruefliste.some((p) => !p.ok) && leitung && <div className="mb-6"><Band ton="gefahr" text={T.baender.liveOffen} /></div>}
      {tab === "stripe" && s.shop_modus === "live" && Number(st.simulation) === 1 && <div className="mb-6"><Band ton="gefahr" text={T.baender.liveSimulation} /></div>}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <EinstellungenForm key={tab} art={tab === "stripe" ? "stripe" : "shop"} felder={felder[tab]} werte={werte} darf={leitung} />
        <ShopModusBlock modus={s.shop_modus} pruefliste={pruefliste} leitung={leitung} />
      </div>
    </Rahmen>
  );
}
