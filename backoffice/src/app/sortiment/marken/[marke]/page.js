import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Fakten, PreisZelle, ProduktBild, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import MarkeAktionen from "@/components/Backoffice/Sortiment/MarkeAktionen";
import { markeAkte, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { bilderZustand, tageZwischen, isoTag } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, MARKEN } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).marke)} · Marken` };
}

const TABS = ["uebersicht", "produkte", "haendler", "verlauf"];

export default async function MarkeAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).marke);
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const pfad = `/sortiment/marken/${encodeURIComponent(name)}`;
  const { session, client, meta } = await sortimentKontext({ pfad, doctype: "PH Marke" });
  let a;
  try {
    a = await markeAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={err?.code || "unavailable"} zurueckHref="/sortiment/marken" />
      </Shell>
    );
  }
  const m = a.doc;
  const tab = TABS.includes(sp.tab) ? sp.tab : "uebersicht";
  const offenBilder = a.produkte.reduce((x, p) => x + (Number(p.bilder_offen) || 0), 0);
  const restVertrag = m.vertrag_gueltig_bis ? tageZwischen(isoTag(), m.vertrag_gueltig_bis) : null;
  const band = m.status !== "Aktiv" ? { ton: "neutral", titel: `Marke ${GLOSSAR.markeStatus[m.status]}`, text: "Produkte dieser Marke lassen sich nicht veröffentlichen." } : restVertrag !== null && restVertrag <= 60 ? { ton: "warnung", titel: MARKEN.vertrag, text: `Läuft in ${restVertrag} Tagen aus (${datum(m.vertrag_gueltig_bis)}).` } : null;

  return (
    <Shell session={session}>
      <AkteGeruest
        kopf={<AkteKopf className="bo-sor-kopf" zurueck={{ href: "/sortiment/marken", titel: MARKEN.titel }} krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: MARKEN.titel, href: "/sortiment/marken" }, { titel: m.marke || m.name }]} rechts={<Status gruppe="haendler" wert={m.haendlerstatus} />} />}
        hero={
          <AkteHero
            bild={m.bild_anhagen && !/\/p-/.test(m.bild_anhagen) ? { src: m.bild_anhagen, alt: m.marke } : undefined}
            ueber={GLOSSAR.welt[m.welt]}
            titel={m.marke || m.name}
            unter={[m.land, m.lieferant || MARKEN.ohneLieferant].filter(Boolean).join(" · ")}
            aktionen={<MarkeAktionen marke={m.name} email={m.bestell_email} lieferant={m.lieferant} bildfreigabeOffen={m.bildfreigabe_status !== "schriftlich erteilt"} darfSchreiben={darfDoc(session, meta, "write")} />}
            kacheln={[
              { titel: "Produkte", wert: String(a.produkte.length), unter: `${a.produkte.filter((p) => p.status === "Aktiv").length} veröffentlicht` },
              { titel: "Bildfreigabe", wert: GLOSSAR.bildfreigabeMarke[m.bildfreigabe_status] || "–", mittel: true, unter: m.bildfreigabe_datum ? `seit ${datum(m.bildfreigabe_datum)}` : `${offenBilder} Bilder offen` },
              { titel: "Offene Bestellungen", wert: String(a.offen.length), unter: m.bestellweg ? GLOSSAR.bestellweg[m.bestellweg] : "Bestellweg offen" },
              { titel: MARKEN.vertrag, wert: m.vertrag_gueltig_bis ? datum(m.vertrag_gueltig_bis) : "–", mittel: true, unter: m.vertrag_gueltig_bis ? "gültig bis" : "kein Vertrag" },
            ]}
          />
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} /> : null}
        reiter={<AkteTabs basis={pfad} params={sp} aktiv={tab} tabs={[{ id: "uebersicht", titel: MARKEN.tabs.uebersicht }, { id: "produkte", titel: MARKEN.tabs.produkte, anzahl: a.produkte.length }, { id: "haendler", titel: MARKEN.tabs.haendler }, { id: "verlauf", titel: "Verlauf" }]} />}
        rechts={
          <Kachel titel={MARKEN.bestellweg}>
            <Fakten
              spalten={1}
              eintraege={[
                { label: "Lieferant", wert: m.lieferant ? <Link className="underline-offset-2 hover:underline" href={`/sortiment/lieferanten/${encodeURIComponent(m.lieferant)}`}>{m.lieferant}</Link> : MARKEN.ohneLieferant },
                { label: MARKEN.bestellweg, wert: GLOSSAR.bestellweg[m.bestellweg] || "–" },
                { label: MARKEN.bestellEmail, wert: m.bestell_email || "–" },
                { label: MARKEN.kundennummer, wert: m.kundennummer_bei_lieferant || "–" },
                { label: "Lieferzeit Standard", wert: m.lieferzeit_wochen_standard ? `${m.lieferzeit_wochen_standard} Wochen` : "–" },
              ]}
            />
          </Kachel>
        }
      >
        {tab === "uebersicht" && (
          <Kachel titel="Offene Bestellungen">
            {!a.offen.length ? (
              <p className="bo-sor-unter">Keine offenen Bestellungen.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {a.offen.map((b) => (
                  <li key={b.name}>
                    <Link href={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`} className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 hover:bg-bo-fill">
                      <span>
                        <span className="block text-[14px] font-medium tabular-nums">{b.name}</span>
                        <span className="bo-sor-klein">{[b.kommission || "Lager", b.bestaetigter_termin ? `Termin ${datum(b.bestaetigter_termin)}` : null].filter(Boolean).join(" · ")}</span>
                      </span>
                      <Status gruppe="bestellung" wert={b.status} groesse="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Kachel>
        )}
        {tab === "produkte" && (
          <Kachel titel={MARKEN.tabs.produkte}>
            {!a.produkte.length ? (
              <Leer groesse="karte" titel="Noch keine Produkte dieser Marke" icon="Package" />
            ) : (
              <ul className="flex flex-col gap-1">
                {a.produkte.map((p) => (
                  <li key={p.name} className="bo-sor-karte-zeile">
                    <ProduktBild src={p.bild_hauptbild} alt="" groesse={48} zustand={bilderZustand(p).art} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/sortiment/produkte/${encodeURIComponent(p.name)}`} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
                        {p.titel}
                      </Link>
                      <p className="bo-sor-unter">{p.kategorie}</p>
                    </div>
                    <Status gruppe="produkt" wert={p.status} groesse="sm" />
                    <PreisZelle produkt={p} />
                  </li>
                ))}
              </ul>
            )}
          </Kachel>
        )}
        {tab === "haendler" && (
          <Kachel titel={MARKEN.tabs.haendler}>
            <Fakten
              eintraege={[
                { label: "Händlerstatus", wert: GLOSSAR.haendlerstatus[m.haendlerstatus] },
                { label: "Geprüft am", wert: datum(m.haendler_geprueft_am) },
                { label: "Beleg", wert: m.haendler_beleg_url ? <a className="underline underline-offset-2" href={m.haendler_beleg_url} target="_blank" rel="noreferrer noopener">Herstellerseite</a> : "–" },
                { label: MARKEN.vertrag, wert: m.vertrag_gueltig_bis ? `${datum(m.vertrag_gueltig_von)} – ${datum(m.vertrag_gueltig_bis)}` : "–" },
                { label: "Bildfreigabe", wert: <Pille material={m.bildfreigabe_status === "schriftlich erteilt" ? "salbei" : "eiche"}>{GLOSSAR.bildfreigabeMarke[m.bildfreigabe_status] || "–"}</Pille> },
                { label: "Freigabe vom", wert: datum(m.bildfreigabe_datum) },
              ]}
            />
          </Kachel>
        )}
        {tab === "verlauf" && (
          <Kachel titel="Verlauf">
            <Zeitleiste doctype="PH Marke" name={m.name} docinfo={a.docinfo} darfSchreiben={false} />
          </Kachel>
        )}
      </AkteGeruest>
    </Shell>
  );
}
