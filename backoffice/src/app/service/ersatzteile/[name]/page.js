// Ersatzteil-Akte (T5, 10-konzept-service §2.6): Bestandskarte, Bewegungen, Verwendung in Fällen.
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { datumLang, euro } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { Pille } from "@/components/Backoffice/StatusBadge";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import { Fakten } from "@/components/Backoffice/Service/Teile";
import { BewegungKnopf } from "@/components/Backoffice/Service/TeileAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Ersatzteil` };
}

export default async function ErsatzteilAkte({ params }) {
  const name = decodeURIComponent((await params).name);
  const session = await requireRecht("service", "read", `/service/ersatzteile/${encodeURIComponent(name)}`);
  const client = serviceClient(session);
  const s = sicht(session);
  let t;
  try {
    t = await client.getDoc("PH Ersatzteil", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const ohne = !Number(t.bestand_fuehren) || !!t.produkt || t.kategorie === "Pflegemittel";
  const faelle = await client.getList("PH Servicefall", { fields: ["name", "kunde_name", "status", "produkt_name"], filters: [["produkt_name", "!=", ""]], limit: 300 }).catch(() => []);
  const verwendung = [];
  for (const f of faelle) {
    const doc = client.modus !== "frappe" ? client.tabelle("PH Servicefall").get(f.name) : null;
    if (doc?.ersatzteile?.some((z) => z.ersatzteil === name)) verwendung.push(f);
  }
  const unter = !ohne && Number(t.verfuegbar) < Number(t.mindestbestand);
  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/ersatzteile", titel: T.ersatzteile.titel }}
          krumen={[{ titel: "Service", href: "/service" }, { titel: T.ersatzteile.titel, href: "/service/ersatzteile" }, { titel: name }]}
          titel={t.bezeichnung}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {name} · {t.hersteller_nr} · {t.kategorie}
              </span>
              <Pille material={t.status === "Aktiv" ? "salbei" : "eiche"}>{t.status}</Pille>
              {ohne && <Pille material="stein">{T.ersatzteile.bestandLogistik}</Pille>}
            </span>
          }
          aktionen={s.schreiben ? <BewegungKnopf primaer teil={{ name, titel: t.bezeichnung, bestand: t.bestand }} gesperrt={ohne} grund={ohne ? T.ersatzteile.bestandLogistik : undefined} /> : null}
        />
        <Bento>
          <Kennzahl className="md:col-span-3" titel="Bestand" wert={ohne ? null : Number(t.bestand)} />
          <Kennzahl className="md:col-span-3" titel="Reserviert" wert={ohne ? null : Number(t.reserviert)} />
          <Kennzahl className="md:col-span-3" titel="Verfügbar" wert={ohne ? null : Number(t.verfuegbar)} zusatz={unter ? T.ersatzteile.unterMindest : undefined} ton={unter ? "cognac" : undefined} />
          <Kennzahl className="md:col-span-3" titel="Mindestbestand" wert={ohne ? null : Number(t.mindestbestand)} />
          <Kachel className="md:col-span-7" titel={T.ersatzteile.tabs.stamm}>
            <Fakten eintraege={[{ label: "Marke", wert: t.marke }, { label: "Lieferant", wert: t.lieferant }, { label: "Lagerplatz", wert: t.lagerplatz }, { label: "Einheit", wert: t.einheit }, { label: "Lieferzeit", wert: t.lieferzeit_tage ? `${t.lieferzeit_tage} Tage` : null }, { label: "VK", wert: euro(t.vk_cent) }, s.kosten && { label: "EK", wert: <NurIntern>{euro(t.ek_cent)}</NurIntern> }, { label: "Passend für", wert: t.passend_fuer }]} />
          </Kachel>
          <Kachel className="md:col-span-5" titel={T.ersatzteile.tabs.verwendung} unter={`${verwendung.length} Fälle`}>
            {verwendung.length ? (
              <ul className="grid gap-2 text-[14px]">
                {verwendung.map((f) => (
                  <li key={f.name}>
                    <Link className="underline" href={`/service/faelle/${encodeURIComponent(f.name)}`}>
                      {f.name}
                    </Link>{" "}
                    · {f.kunde_name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-bo-text-soft">Noch in keinem Fall verwendet.</p>
            )}
          </Kachel>
          <Kachel className="md:col-span-12" titel={T.ersatzteile.tabs.bewegungen} unter={`${(t.bewegungen || []).length} Buchungen`}>
            {(t.bewegungen || []).length ? (
              <ul className="bo-svc-zeilen -mx-3">
                {[...t.bewegungen].reverse().map((b, i) => (
                  <li key={i} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                    <span className="min-w-0">
                      <span className="bo-svc-zeile__titel">{b.art}</span>
                      <span className="bo-svc-zeile__unter">
                        {datumLang(b.datum)}
                        {b.hinweis ? ` · ${b.hinweis}` : ""}
                      </span>
                    </span>
                    <span className="bo-svc-zeile__zeit">{Number(b.menge) > 0 && b.art !== "Inventur" ? `+${b.menge}` : b.menge}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-bo-text-soft">Noch keine Bewegung.</p>
            )}
          </Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
