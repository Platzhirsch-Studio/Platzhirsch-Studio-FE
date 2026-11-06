import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Akzentkachel, Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Knopf from "@/components/Backoffice/Knopf";
import ZuTun from "@/components/Backoffice/ZuTun/ZuTun";
import { Balken } from "@/components/Backoffice/Charts";
import { Lieferart, Zeile, Chip, wunschText } from "@/components/Backoffice/Logistik/ui";
import quellen from "@/lib/backoffice/aufgaben/logistik";
import { auswertung, heute, kennzahlen, tourenWoche, zuPackenListe } from "@/lib/backoffice/logistik/daten";
import { tagKopf } from "@/lib/backoffice/logistik/plantafel";
import { UEBERSICHT as T, LEER } from "@/lib/backoffice/logistik/texte";
import { seite, testband } from "./_teile";

export const metadata = { title: "Logistik" };
export const dynamic = "force-dynamic";

// Übersicht (10-konzept-logistik § 4.1, E15): „Heute zu tun“ (max. 5) + 4 Kennzahlen + 2 Listen, Auswertung eingeklappt.
// Lounge: Bento auf Kalk, zwei Akzentkacheln höchstens, eine Hauptaktion in Tinte („Zum Packtisch“).
export default async function LogistikStart() {
  const { session, client } = await seite("/logistik");
  const [k, packen, woche, aus, test] = await Promise.all([kennzahlen(client), zuPackenListe(client), tourenWoche(client), auswertung(client), testband(client)]);
  const h = heute(client);
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.titel}
        ueber={T.ueber}
        aktionen={<Knopf variant="primary" icon="PackageCheck" href="/packtisch">{T.zumPacktisch}</Knopf>}
      />
      {test ? <p className="bo-log-hinweis mb-6" data-ton="see" data-testid="testmodus-band">{T.testmodus}</p> : null}
      <Bento testid="logistik-start">
        <ZuTun className="md:col-span-7" quellen={quellen} session={session} client={client} titel={T.heuteTitel} unter={T.heuteUnter} alleHref="/logistik/lieferscheine" testid="heute-zu-tun" />
        <Akzentkachel className="col-span-6 md:col-span-3" ton="cognac" titel={T.kennzahlen.zuPacken} text={k.zuPackenAlt ? T.seitGestern(k.zuPackenAlt) : "Lieferscheine im Entwurf"} zahl={k.zuPacken} href="/logistik/lieferscheine?ansicht=heute" testid="kz-zu-packen" />
        <Akzentkachel className="col-span-6 md:col-span-2" ton="salbei" titel={T.kennzahlen.tourenHeute} text={k.stopps !== null ? T.stopps(k.stopps) : undefined} zahl={k.tourenHeute} href="/logistik/touren?ansicht=plantafel&zeitraum=tag" testid="kz-touren" />
        <Kennzahl className="md:col-span-3" titel={T.kennzahlen.ohneEtikett} wert={k.ohneEtikett} href="/logistik/sendungen?status=Angelegt" hochzaehlen={false} />
        <Kennzahl className="md:col-span-3" titel={T.kennzahlen.unterwegs} wert={k.unterwegs} href="/logistik/sendungen?status=Unterwegs" hochzaehlen={false} />
        <Kachel className="md:col-span-6 md:row-span-2" titel={T.zuPackenTitel} unter={T.zuPackenUnter} href="/logistik/lieferscheine?ansicht=heute" testid="liste-zu-packen">
          {packen.length ? (
            <div className="bo-log-zeilen">
              {packen.map((l) => (
                <Zeile key={l.name} href={`/logistik/lieferscheine/${encodeURIComponent(l.name)}`} titel={l.kunde_name} unter={<><Lieferart wert={l.lieferart} /> · {l.liefer_ort || "–"}</>}
                  rechts={<>{l.zerbrechlich ? <Chip ton="messing">Glas</Chip> : null}<Chip ton={l.wunschtermin && l.wunschtermin <= h ? "cognac" : undefined}>{l.wunschtermin ? wunschText(l.wunschtermin, h) : "ohne Termin"}</Chip></>} />
              ))}
            </div>
          ) : (
            <p className="bo-log-cap">{LEER.packen}</p>
          )}
        </Kachel>
        <Kachel className="md:col-span-6" titel={T.tourenWoche} unter={T.tourenWocheUnter} href="/logistik/touren" testid="touren-woche">
          <div className="bo-log-zeilen">
            {woche.map((t) => (
              <Link key={t.tag} href={`/logistik/touren?ansicht=plantafel&zeitraum=tag&datum=${t.tag}`} className="bo-log-zeile">
                <span className="min-w-0">
                  <span className="bo-log-zeile__titel block">{tagKopf(t.tag)}{t.tag === h ? " · heute" : ""}</span>
                  <span className="bo-log-zeile__unter block">{t.touren ? `${t.touren} ${t.touren === 1 ? "Tour" : "Touren"}${t.stopps !== null ? ` · ${t.stopps} Stopps` : ""}${t.fahrzeuge.length ? ` · ${t.fahrzeuge.join(", ")}` : ""}` : T.keineTourTag}</span>
                </span>
              </Link>
            ))}
          </div>
        </Kachel>
      </Bento>
      <details className="bo-kachel mt-6" data-testid="auswertung">
        <summary className="flex cursor-pointer items-center justify-between gap-3">
          <span>
            <span className="bo-titel-kachel block">{T.auswertung}</span>
            <span className="bo-log-cap block">{T.auswertungUnter}</span>
          </span>
        </summary>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Balken kachel={false} titel="Lieferscheine je Woche" punkte={aus.wochen} hervorheben="letzter" laufend="letzter" />
          <Balken kachel={false} titel="Versandkosten und berechnet" punkte={aus.versand} format="cent-rund" />
          <Balken kachel={false} titel="Positionen je Lagerort" punkte={aus.orte} />
        </div>
      </details>
    </Shell>
  );
}
