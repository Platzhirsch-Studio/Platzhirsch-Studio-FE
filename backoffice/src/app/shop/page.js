// /shop – Übersicht (T1; 10-konzept-shop § 4.1, MASTER Q-B4/Q-B5): oben Arbeit („Zu tun“, zwei Akzentkacheln),
// darunter höchstens vier Kennzahlen je Rolle und zwei Listen. Charts stehen im Bericht „Übersicht“.
import Link from "next/link";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { uebersichtDaten, positionenFuer } from "@/lib/backoffice/shop/daten";
import { shopKennzahlen, zuErledigen } from "@/lib/backoffice/shop/kennzahlen";
import { bestellZeile, docFuerAktion } from "@/lib/backoffice/shop/zeilen";
import { statusInfo } from "@/lib/backoffice/shop/status";
import { prueflisteFuer } from "@/lib/backoffice/shop/pruefliste";
import { istTest } from "@/lib/backoffice/shop/ansichten";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento, Akzentkachel } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import { Band } from "@/components/Backoffice/Akte";
import Knopf from "@/components/Backoffice/Knopf";
import { NeuMenue, ZuTunZeilen } from "@/components/Backoffice/Shop/Teile";
import { Thumb } from "@/components/Backoffice/Shop/Dialoge";
import ShopIcon from "@/components/Backoffice/Shop/ShopIcon";

export const metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopUebersicht() {
  const ctx = await zugang("/shop");
  const { client, session, leitung, geld, heute } = ctx;
  const d = await uebersichtDaten(client);
  const kz = shopKennzahlen(d, { heute });
  const nachName = Object.fromEntries(d.bestellungen.map((b) => [b.name, b]));
  const zuTun = zuErledigen(d, { heute, leitung, cent }).filter((z) => !z.id.startsWith("bezahlt:") || z.ruht >= 2).slice(0, 5).map((z) => ({ ...z, doc: z.doctype === "PH Bestellung" && nachName[z.nr] ? docFuerAktion(nachName[z.nr]) : null }));
  const zuTunAlle = zuErledigen(d, { heute, leitung, cent }).length;
  const neueste = d.bestellungen.filter((b) => !istTest("PH Bestellung", b)).sort((a, b) => String(b.angelegt).localeCompare(String(a.angelegt))).slice(0, 5);
  const pos = await positionenFuer(client, neueste.map((b) => b.name));
  const zeilen = neueste.map((b) => bestellZeile(b, { heute, positionen: pos, leitung }));
  const offeneWiderrufe = d.widerrufe.filter((w) => ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten"].includes(w.status)).sort((a, b) => String(a.erstattung_bis || "9").localeCompare(String(b.erstattung_bis || "9"))).slice(0, 4);
  const pruefliste = leitung && d.shop?.shop_modus === "live" ? await prueflisteFuer(client) : [];
  const nie = d.bestellungen.length === 0 && !d.fehler;

  return (
    <Rahmen session={session} modus={client.modus}>
      <Seitenkopf
        titel="Shop"
        ueber={`${datum(new Date())} · Bestellungen, Zahlungen, Gutscheine`}
        kennzahlen={[{ wert: kz.pruefen, text: "Prüfen", testid: "kz-pruefen" }, { wert: kz.widerrufe, text: "Widerrufe offen" }, ...(geld ? [{ wert: kz.freigabe, text: "Freigabe offen" }] : [])]}
        aktionen={<NeuMenue leitung={leitung} schreiben={ctx.schreiben} />}
      />
      <Erstbesuch text={T.erstbesuch.uebersicht} route="/shop" />
      {d.shop?.shop_modus && d.shop.shop_modus !== "live" && <Band ton="info" icon="Info" text={T.baender.testmodus(d.shop.testmodus_mail_an)} className="mb-6" testid="band-testmodus" />}
      {pruefliste.some((p) => !p.ok) && <Band ton="gefahr" text={T.baender.liveOffen} aktion={<Knopf size="s" href="/shop/einstellungen">Prüfliste</Knopf>} className="mb-6" />}
      {d.fehler && <Fehler code={d.fehler.code} kompakt className="mb-6" />}

      {nie ? (
        <Kachel titel="Shop einrichten" unter="Noch keine Bestellungen. Sie kommen von der Website oder entstehen hier als Telefonbestellung oder Reservierung." testid="einrichten">
          <ol className="bo-shop-zeilen">
            {[{ t: "Stripe-Schlüssel hinterlegen", ok: !!Number(d.stripe?.schluessel_vorhanden), href: "/shop/einstellungen?tab=stripe" }, { t: "Testbestellung auf der Website", ok: false, href: "/shop/bestellungen" }, { t: "Live schalten (Leitung)", ok: d.shop?.shop_modus === "live", href: "/shop/einstellungen" }].map((s) => (
              <li key={s.t} className="bo-shop-zeile">
                <span className="bo-shop-zeile__ico" data-ton={s.ok ? "salbei" : undefined}><ShopIcon name={s.ok ? "Check" : "Circle"} /></span>
                <span className="bo-shop-zeile__titel">{s.t}</span>
                <Knopf size="s" variant="ghost" href={s.href}>Öffnen</Knopf>
              </li>
            ))}
          </ol>
        </Kachel>
      ) : (
        <Bento>
          <Kachel className="md:col-span-6" titel="Zu tun" unter={zuTun.length ? `${zuTunAlle} ${zuTunAlle === 1 ? "Vorgang" : "Vorgänge"} nach Dringlichkeit` : "Heute"} werkzeuge={<Link href="/shop/bestellungen?ansicht=pruefen" className="text-[13px] font-medium text-bo-text-soft hover:text-bo-text">Alle</Link>} testid="kachel-zutun">
            <ZuTunZeilen zeilen={zuTun} />
          </Kachel>
          <Akzentkachel className="col-span-6 md:col-span-3" ton="cognac" titel="Zu packen" text={kz.zuPackenSeitGestern ? `${kz.zuPackenSeitGestern} davon seit gestern bezahlt.` : "Bezahlte Versandbestellungen."} zahl={kz.zuPacken} href="/shop/bestellungen?ansicht=zu-packen" oeffnenLabel="Zu packen öffnen" testid="akzent-packen" />
          <Akzentkachel className="col-span-6 md:col-span-3" ton="salbei" titel="Abholung" text={kz.abholungFristMorgen ? `${kz.abholungFristMorgen} mit Frist bis morgen.` : "Reserviert, bezahlt oder abholbereit."} zahl={kz.abholung} href="/shop/bestellungen?ansicht=abholung" oeffnenLabel="Abholungen öffnen" testid="akzent-abholung" />

          <Kennzahl className="md:col-span-3" titel="Bestellungen heute" wert={kz.bestellungenHeute} href="/shop/bestellungen" />
          <Kennzahl className="md:col-span-3" titel="Zahlung unterwegs" wert={kz.zahlungUnterwegs} zusatz={kz.aeltesteStunden !== null ? `älteste vor ${kz.aeltesteStunden} h` : undefined} href="/shop/bestellungen?status=offen,zahlung_ausstehend" />
          {geld && <Kennzahl className="md:col-span-3" titel="Eingänge Shop (Monat)" wert={kz.eingaengeMonat} format="cent-rund" zusatz={`Vormonat ${cent(kz.eingaengeVormonat)}`} href="/shop/berichte/umsatz" />}
          {geld && <Kennzahl className="md:col-span-3" titel="Gutschein-Restwert" wert={kz.gutscheinRest} format="cent-rund" zusatz={`${kz.gutscheinAnzahl} Gutscheine · ohne Verkauf ${cent(kz.gutscheinOhneVerkauf)}`} href="/shop/gutscheine?ansicht=offen" />}

          <Kachel className="md:col-span-8" titel="Neueste Bestellungen" unter={`${kz.bestellungenHeute} heute`} href="/shop/bestellungen" oeffnenLabel="Alle Bestellungen" testid="kachel-neueste">
            <ul className="bo-shop-zeilen">
              {zeilen.map((z) => (
                <li key={z.name} className="bo-shop-zeile" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto auto" }}>
                  <Thumb bild={z.zellen.objekt.bilder[0]} />
                  <span className="min-w-0">
                    <Link href={z.href} className="bo-shop-zeile__titel block truncate hover:underline" prefetch={false}>{z.zellen.objekt.titel}</Link>
                    <span className="bo-shop-unter">{z.zellen.objekt.unter} · {z.zellen.bestellt.text}</span>
                  </span>
                  <span className="hidden sm:inline-flex"><StatusBadge wert={z.zellen.status.wert} text={z.zellen.status.anzeige} ton={z.zellen.status.ton} groesse="m" /></span>
                  <span className="bo-shop-betrag sm:w-24">{z.zellen.gesamt.text}</span>
                </li>
              ))}
            </ul>
          </Kachel>
          <Kachel className="md:col-span-4" titel="Widerrufe" unter="nach Rückzahlungsfrist" href="/shop/widerrufe" oeffnenLabel="Widerruf & Retouren öffnen" testid="kachel-widerrufe">
            {offeneWiderrufe.length ? (
              <ul className="bo-shop-zeilen">
                {offeneWiderrufe.map((w) => (
                  <li key={w.name} className="bo-shop-zeile">
                    <span className="bo-shop-zeile__ico" data-ton="eiche"><ShopIcon name="Undo2" /></span>
                    <span className="min-w-0">
                      <Link href={`/shop/widerrufe/${encodeURIComponent(w.name)}`} className="bo-shop-zeile__titel block truncate hover:underline" prefetch={false}>{w.kunde_name}</Link>
                      <span className="bo-shop-unter">{statusInfo("PH Widerruf", w.status).anzeige}{w.erstattung_bis ? ` · Rückzahlung bis ${datum(w.erstattung_bis)}` : ""}</span>
                    </span>
                    <span />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[15px] text-bo-text-soft">{T.leer.widerrufeOffenLeer}</p>
            )}
            {leitung && d.stripe && (
              <p className="mt-4 text-[13px] text-bo-text-soft" data-testid="stripe-zeile">
                Stripe: {kz.stripe.fehler7} {kz.stripe.fehler7 === 1 ? "Fehler" : "Fehler"} in 7 Tagen · letzter Abgleich {kz.stripe.letzterAbgleich ? datumZeit(kz.stripe.letzterAbgleich) : "–"} · ohne Auszahlung {kz.stripe.ohneAuszahlung} · Streit {kz.stripe.streit}
              </p>
            )}
          </Kachel>
        </Bento>
      )}
    </Rahmen>
  );
}
