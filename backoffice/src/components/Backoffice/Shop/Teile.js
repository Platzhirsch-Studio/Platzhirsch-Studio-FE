"use client";
// Kleine Client-Bausteine des Shops: „+ Neu ▾“, Zu-tun-Zeilen mit genau einem Knopf, Zwei-Klick-Freigabe,
// Vorschau-Schließen, Erstbesuch-Hülle.
import Link from "next/link";
import Knopf from "@/components/Backoffice/Knopf";
import { Menue, MenuePunkt } from "@/components/Backoffice/Overlay";
import ZweiKlickKnopf from "@/components/Backoffice/ZweiKlickKnopf";
import { cent } from "@/lib/backoffice/format";
import ShopIcon from "./ShopIcon";
import { useShopAktionen } from "./ShopAktionen";

/** „+ Neu ▾“: Telefonbestellung · Showroom-Reservierung · Gutschein ohne Verkauf (Leitung). Taste N öffnet das Menü der Shell. */
export function NeuMenue({ leitung = false, schreiben = true }) {
  if (!schreiben) return null;
  return (
    <Menue label="Neu" ausloeser={(p) => <Knopf {...p} variant="primary" icon="Plus" iconRechts="ChevronDown" data-testid="shop-neu">Neu</Knopf>}>
      <MenuePunkt icon="Phone" href="/shop/bestellungen?neu=telefon">Telefonbestellung</MenuePunkt>
      <MenuePunkt icon="Store" href="/shop/bestellungen?neu=showroom">Showroom-Reservierung</MenuePunkt>
      <MenuePunkt icon="Ticket" href={leitung ? "/shop/gutscheine?neu=1" : undefined} deaktiviert={!leitung} grund={leitung ? undefined : "Nur Shop-Leitung – Verkauf an der Kassa"}>Gutschein ohne Verkauf</MenuePunkt>
    </Menue>
  );
}

/** Zu tun (§ 4.1): Symbolkreis in Materialfläche · Satz · Nummer · genau ein Knopf. */
export function ZuTunZeilen({ zeilen = [] }) {
  const { ausfuehren } = useShopAktionen();
  if (!zeilen.length) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center" data-testid="zutun-leer">
        <span className="bo-shop-zeile__ico" data-ton="salbei" aria-hidden="true"><ShopIcon name="Check" className="size-5" /></span>
        <p className="text-[15px] text-bo-text-soft">Alles erledigt – nichts zu packen, keine Abholung offen.</p>
      </div>
    );
  }
  return (
    <ul className="bo-shop-zeilen bo-staffel" data-testid="zutun">
      {zeilen.map((z) => (
        <li key={z.id} className="bo-shop-zeile" data-zutun-zeile="">
          <span className="bo-shop-zeile__ico" data-ton={z.ton} aria-hidden="true"><ShopIcon name={z.icon} /></span>
          <span className="min-w-0">
            <span className="bo-shop-zeile__titel block truncate">{z.titel} <Link href={z.href} className="bo-shop-zelle-nr ml-1 hover:underline" prefetch={false}>{z.nr}</Link></span>
            <span className="bo-shop-unter" data-ton={z.ruht >= 2 ? "warn" : undefined}>{z.text}</span>
          </span>
          {z.aktion && z.doc ? (
            <Knopf size="s" variant="secondary" onClick={() => ausfuehren(z.aktion, z.doc)} data-testid={`zutun-${z.aktion}`}>{z.knopf}</Knopf>
          ) : (
            <Knopf size="s" variant="ghost" href={z.href}>{z.knopf}</Knopf>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Freigabe der Geschäftsführung (§ 3.4): Zwei-Klick mit Betrag, Ablehnen mit Pflichtgrund. */
export function FreigabeKnoepfe({ doc, betragCent, eigen = false }) {
  const { ausfuehren } = useShopAktionen();
  return (
    <span className="flex flex-wrap items-center gap-2">
      <ZweiKlickKnopf verb={`${cent(betragCent)} freigeben`} icon="BadgeCheck" disabled={eigen} grund={eigen ? "Eigener Antrag – zweite Person nötig" : undefined} onBestaetigt={() => ausfuehren("freigeben", doc)} testid="freigeben">
        Freigeben
      </ZweiKlickKnopf>
      <Knopf variant="ghost" onClick={() => ausfuehren("freigabe-ablehnen", doc)} disabled={eigen}>Ablehnen</Knopf>
    </span>
  );
}

/** Ein Aktionsknopf für Bänder (Band-Aktion = ID aus primaer.js). */
export function BandKnopf({ id, titel, doc, variant = "secondary" }) {
  const { ausfuehren } = useShopAktionen();
  return (
    <Knopf size="s" variant={variant} onClick={() => ausfuehren(id, doc)} data-testid={`band-${id}`}>
      {titel}
    </Knopf>
  );
}
