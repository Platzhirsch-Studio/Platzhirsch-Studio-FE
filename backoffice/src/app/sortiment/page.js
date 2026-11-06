import { Suspense } from "react";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import ZuTunListe from "@/components/Backoffice/Sortiment/ZuTunListe";
import NeuMenue from "@/components/Backoffice/Sortiment/NeuMenue";
import { ProduktBild } from "@/components/Backoffice/Sortiment/Bausteine";
import { freigabenLaden, kettenZaehler, sortimentKontext, startKennzahlen, vorschlaegeListe, zuTunGruppen } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, START, VORSCHLAEGE } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istSortiment } from "@/lib/backoffice/sortiment/rollen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sortiment" };

export default async function SortimentStart() {
  const { session, client, meta, leitung } = await sortimentKontext({ pfad: "/sortiment", doctype: "PH Produkt" });
  const [k, gruppen, kette, vorschlaege, freigaben] = await Promise.all([
    startKennzahlen(client),
    zuTunGruppen(client, session, { max: 3 }).catch(() => null),
    kettenZaehler(client),
    vorschlaegeListe(client).catch(() => null),
    leitung ? freigabenLaden(client).catch(() => null) : null,
  ]);
  const team = istSortiment(session);
  const zahl = (s) => (s.ok ? s.wert : null);
  const offenFreigabe = freigaben ? freigaben.bilder.length + freigaben.preise.length + freigaben.lieferzeiten.length : null;
  const wartet = gruppen?.find((g) => g.id === "wartetVeroeffentlichung")?.anzahl ?? 0;
  const abOffen = kette.find((s) => s.status === "Gesendet")?.anzahl ?? 0;
  const neu = [
    darfDoc(session, meta, "create") && team && { titel: "Produkt", href: "/sortiment/produkte?neu=produkt", icon: "Package" },
    team && { titel: "Herstellerbestellung", href: "/sortiment/bestellungen/neu", icon: "ScrollText" },
    team && { titel: "Wareneingang", href: "/sortiment/wareneingang/neu", icon: "PackageCheck" },
    team && { titel: "Preisliste", href: "/sortiment/preislisten/neu", icon: "Receipt" },
  ].filter(Boolean);

  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={START.titel}
        untertitel={START.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: START.titel }]}
        kennzahlen={[
          { wert: zahl(k.veroeffentlicht) ?? "–", text: START.kennzahlen.veroeffentlicht, testid: "kz-veroeffentlicht" },
          { wert: zahl(k.offen) ?? "–", text: START.kennzahlen.offeneBestellungen },
          { wert: zahl(k.markenOhne) ?? "–", text: START.kennzahlen.markenOhneStatus },
        ]}
        aktionen={<NeuMenue eintraege={neu} />}
      />
      <Erstbesuch text="Je Zeile ein Schritt. Die Website zeigt Änderungen erst nach dem Rückgängig-Fenster." route="/sortiment" />
      <Bento>
        <div className="flex min-w-0 flex-col gap-(--bo-bento-gap) md:col-span-12 xl:col-span-7">
          {gruppen ? <ZuTunListe gruppen={gruppen} /> : <Kachel titel={START.zuTun}><p className="bo-sor-unter">Nicht geladen – Seite neu laden.</p></Kachel>}
        </div>
        <div className="grid min-w-0 grid-cols-2 content-start gap-(--bo-bento-gap) md:col-span-12 xl:col-span-5">
          <Akzentkachel ton="cognac" className="col-span-2 sm:col-span-1" titel={START.akzentAbTitel} text={START.akzentAbText} zahl={abOffen} href="/sortiment/bestellungen?segment=unterwegs" testid="akzent-ab" />
          {leitung ? (
            <Akzentkachel ton="salbei" className="col-span-2 sm:col-span-1" titel={START.akzentFreigabeTitel} text={START.akzentFreigabeText} zahl={offenFreigabe ?? 0} href="/sortiment/freigaben" testid="akzent-freigaben" />
          ) : (
            <Akzentkachel ton="salbei" className="col-span-2 sm:col-span-1" titel={GLOSSAR.produktStatus.Geprueft} text={START.akzentFreigabeTeam} zahl={wartet} href="/sortiment/produkte?sicht=wartet" />
          )}
          <Kachel className="col-span-2" titel={START.ketteTitel} unter={START.ketteUnter} href="/sortiment/bestellungen?ansicht=kanban" oeffnenLabel="Bestellungen als Kanban öffnen">
            <ol className="bo-sor-kette mt-2" aria-label={START.ketteTitel}>
              {kette.map((s) => (
                <li key={s.status} className="contents">
                  <Link href={`/sortiment/bestellungen?segment=${{ Entwurf: "entwurf", Gesendet: "unterwegs", "AB erhalten": "ab" }[s.status] || "lieferung"}`} className="bo-sor-kette__stufe" data-aktiv={s.anzahl > 0 && s.status === "AB erhalten" ? "true" : undefined}>
                    <span className="bo-sor-kette__knoten">{s.anzahl}</span>
                    <span className="bo-sor-kette__name">{GLOSSAR.bestellStatus[s.status]}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Kachel>
          <Suspense>
            <Kennzahl className="col-span-1" titel={START.kennzahlen.shopOhnePreis} wert={zahl(k.shopOhnePreis)} href="/sortiment/produkte?sicht=shop" />
          </Suspense>
          <Kennzahl className="col-span-1" titel="Neu veröffentlicht" wert={zahl(k.neu30)} zusatz="in 30 Tagen" href="/sortiment/produkte?status=Aktiv" />
          {vorschlaege && <Kachel className="col-span-2" titel={START.vorschlaegeTitel} unter={START.vorschlaegeUnter} href="/sortiment/bestellvorschlaege" oeffnenLabel="Bestellvorschläge öffnen">
            {vorschlaege.length === 0 ? (
              <p className="bo-sor-unter">{START.vorschlaegeLeer}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {vorschlaege.slice(0, 3).map((v) => (
                  <li key={v.name} className="flex items-center gap-3 rounded-[14px] px-1 py-1.5">
                    <ProduktBild src={v.bild} alt="" groesse={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{v.produkt_name || v.titel}</span>
                      <span className="bo-sor-klein block truncate">{VORSCHLAEGE.verfuegbarText(v.verfuegbar, v.meldebestand)}</span>
                    </span>
                    <span className="text-[15px] font-medium tabular-nums">+{v.vorschlag_menge}</span>
                  </li>
                ))}
              </ul>
            )}
          </Kachel>}
        </div>
      </Bento>
    </Shell>
  );
}
