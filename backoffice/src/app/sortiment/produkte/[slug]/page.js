import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band, GlasChip, GlasKachel } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import { Checkliste, Fakten, ProduktBild, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import ProduktAktionen from "@/components/Backoffice/Sortiment/ProduktAktionen";
import { produktAkte, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { aufWebsite, bilderZustand, checkliste, haendlerwortTreffer, preisZustand, sperrgrund, tiefstpreis30, ustSatz, gueltigBis } from "@/lib/backoffice/sortiment/regeln";
import { AKTE_PRODUKT, anzeigeWert, GLOSSAR, PRODUKTE } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { cent, datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { istFreisteller } from "@/components/Backoffice/Sortiment/Bausteine";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${decodeURIComponent(slug)} · Sortiment` };
}

const TABS = ["produkt", "preise", "ausfuehrungen", "texte", "verlauf"];

export default async function ProduktAkte({ params, searchParams }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const pfad = `/sortiment/produkte/${encodeURIComponent(name)}`;
  const { session, client, meta, leitung, ek } = await sortimentKontext({ pfad, doctype: "PH Produkt" });
  let a;
  try {
    a = await produktAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={err?.code || "unavailable"} zurueckHref="/sortiment/produkte" />
      </Shell>
    );
  }
  const p = a.doc;
  const tab = TABS.includes(sp.tab) ? sp.tab : "produkt";
  const punkte = checkliste(p, { marke: a.marke, kategorie: a.kategorie });
  const sperren = Object.fromEntries(["Prüfen", "Veröffentlichen", "Reaktivieren", "Pausieren", "Zurück auf Entwurf", "Auslaufen lassen"].map((x) => [x, sperrgrund(p, x, { marke: a.marke, kategorie: a.kategorie, leitung: true })]));
  const pz = preisZustand(p);
  const bz = bilderZustand(p);
  const raumbild = p.bild_hauptbild && !istFreisteller(p.bild_hauptbild) ? p.bild_hauptbild : null;
  const sichtbar = aufWebsite(p);
  const preise = [...(p.preise || [])].sort((x, y) => String(y.ab).localeCompare(String(x.ab)));
  const tiefst = tiefstpreis30(p.preise || [], {});
  const darfSchreiben = darfDoc(session, meta, "write");
  const treffer = haendlerwortTreffer(`${p.kurz_de || ""} ${p.beschreibung_de || ""}`, a.marke?.haendlerstatus || "Keiner");
  const offenePreise = preise.filter((x) => !x.freigegeben).length;

  const band = treffer.length
    ? { ton: "warnung", titel: AKTE_PRODUKT.haendlerwort, text: AKTE_PRODUKT.haendlerwortTreffer(treffer[0]) }
    : pz.art === "veraltet" && p.status === "Aktiv"
      ? { ton: "warnung", titel: PRODUKTE.veraltetChip, text: PRODUKTE.preisVeraltet(datum(pz.bis || pz.stand)) }
      : null;

  const gruppen = [...new Set(a.ausfuehrungen.map((x) => x.gruppe_key))];

  return (
    <Shell session={session}>
      <AkteGeruest
        kopf={
          <AkteKopf className="bo-sor-kopf"
            zurueck={{ href: "/sortiment/produkte", titel: PRODUKTE.titel }}
            krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: PRODUKTE.titel, href: "/sortiment/produkte" }, { titel: p.titel }]}
            rechts={
              <span className="flex flex-wrap items-center gap-2">
                <Status gruppe="produkt" wert={p.status} />
                {p.verkauf_online ? <Pille material="see">{PRODUKTE.imShop}</Pille> : null}
                {p.website_sichtbar === 0 ? <Pille material="stein">{PRODUKTE.ausgeblendet}</Pille> : null}
              </span>
            }
          />
        }
        hero={
          <AkteHero
            bild={raumbild ? { src: raumbild, alt: p.titel } : undefined}
            ueber={p.marke}
            titel={p.titel}
            unter={[p.kategorie, p.hersteller_artikelnr, GLOSSAR.typ[p.typ]].filter(Boolean).join(" · ")}
            chips={[{ icon: "Package", text: anzeigeWert("welt", p.welt) }, ...(p.collection ? [{ icon: "Layers", text: p.collection }] : [])]}
            aktionen={<ProduktAktionen produkt={{ name: p.name, titel: p.titel, status: p.status, aktueller_preis_cent: p.aktueller_preis_cent, preisart: p.preisart, verkauf_online: p.verkauf_online, website_sichtbar: p.website_sichtbar }} leitung={leitung} darfSchreiben={darfSchreiben} sperren={sperren} />}
            kacheln={[
              { titel: AKTE_PRODUKT.preis, wert: pz.art === "anfrage" ? PRODUKTE.aufAnfrage : pz.cent ? cent(pz.cent) : "–", unter: pz.stand ? AKTE_PRODUKT.preisMitStand(datum(pz.stand)) : "Noch kein Preis" },
              { titel: AKTE_PRODUKT.lieferzeit, wert: p.sofort_lieferbar ? AKTE_PRODUKT.sofort : AKTE_PRODUKT.lieferzeitWochen(p.lieferzeit_wochen_von, p.lieferzeit_wochen_bis), mittel: true, unter: p.lieferzeit_freigegeben ? AKTE_PRODUKT.lieferzeitFrei : AKTE_PRODUKT.lieferzeitOffen },
              { titel: AKTE_PRODUKT.bilder, wert: `${bz.frei} / ${bz.n}`, unter: "freigegeben", balken: bz.n ? { anteil: bz.frei / bz.n, label: `${bz.frei} von ${bz.n} freigegeben` } : undefined },
              { titel: "Website", wert: sichtbar ? "sichtbar" : "nicht sichtbar", mittel: true, unter: sichtbar ? "für Kunden sichtbar" : p.status !== "Aktiv" ? "nicht veröffentlicht" : p.website_sichtbar === 0 ? "ausgeblendet" : !p.bild_freigegeben ? "Bild ohne Freigabe" : "Preis fehlt" },
            ]}
          />
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} /> : null}
        reiter={
          <AkteTabs
            basis={pfad}
            params={sp}
            aktiv={tab}
            tabs={[
              { id: "produkt", titel: AKTE_PRODUKT.tabs.produkt },
              { id: "preise", titel: AKTE_PRODUKT.tabs.preise, anzahl: offenePreise || undefined },
              { id: "ausfuehrungen", titel: AKTE_PRODUKT.tabs.ausfuehrungen, anzahl: a.ausfuehrungen.length || undefined },
              { id: "texte", titel: AKTE_PRODUKT.tabs.texte },
              { id: "verlauf", titel: AKTE_PRODUKT.tabs.verlauf },
            ]}
          />
        }
        rechts={
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={AKTE_PRODUKT.checkliste} unter={AKTE_PRODUKT.checklisteUnter(punkte.filter((x) => x.ok).length, punkte.length)} testid="checkliste">
              <Checkliste punkte={punkte} />
              <p className="bo-sor-klein mt-3">{AKTE_PRODUKT.websiteGrund}</p>
            </Kachel>
            <Kachel titel={AKTE_PRODUKT.verknuepfungen} unter={AKTE_PRODUKT.verknuepfungenUnter}>
              {a.bestellungen.length === 0 ? (
                <p className="bo-sor-unter">{AKTE_PRODUKT.keineVerknuepfung}</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {a.bestellungen.map((b) => (
                    <li key={b.name}>
                      <Link href={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`} className="flex items-center justify-between gap-3 rounded-[12px] px-2 py-2 hover:bg-bo-fill">
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium tabular-nums">{b.name}</span>
                          <span className="bo-sor-klein block truncate">{[b.lieferant, b.kommission].filter(Boolean).join(" · ")}</span>
                        </span>
                        <Status gruppe="bestellung" wert={b.status} groesse="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          </div>
        }
      >
        {tab === "produkt" && (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={AKTE_PRODUKT.bilder} unter={AKTE_PRODUKT.bilderUnter(bz.n, bz.frei)} werkzeuge={bz.n > bz.frei ? <Link className="bo-sor-zutun__alle" href={`/sortiment/freigaben?art=bilder&marke=${encodeURIComponent(p.marke)}`}>Zu den Freigaben</Link> : null}>
              {(p.bilder || []).length === 0 ? (
                <Leer groesse="karte" titel="Noch keine Bilder" text={AKTE_PRODUKT.bilderLeer} icon="Package" />
              ) : (
                <div className="bo-sor-galerie">
                  {p.bilder.map((b) => (
                    <figure key={b.name}>
                      <ProduktBild src={b.bild} alt={b.alt_de || p.titel} fuellen typ={b.typ} />
                      <figcaption className="flex items-center justify-between gap-2">
                        <span className="bo-sor-klein">{anzeigeWert("bildTyp", b.typ)}</span>
                        <Status gruppe="bildFreigabe" wert={b.freigabe || "offen"} groesse="xs" />
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </Kachel>
            <Kachel titel={AKTE_PRODUKT.stammdaten}>
              <Fakten
                spalten={3}
                eintraege={[
                  { label: "Marke", wert: <Link className="underline-offset-2 hover:underline" href={`/sortiment/marken/${encodeURIComponent(p.marke)}`}>{p.marke}</Link> },
                  { label: "Händlerstatus", wert: anzeigeWert("haendlerstatus", a.marke?.haendlerstatus) },
                  { label: "Kategorie", wert: p.kategorie },
                  { label: "Art.-Nr.", wert: p.hersteller_artikelnr || "–" },
                  { label: "EAN", wert: p.ean || "–" },
                  { label: "USt", wert: ustSatz(a.kategorie?.ust_klasse ?? p.ust_klasse) === null ? "offen" : `${ustSatz(a.kategorie?.ust_klasse ?? p.ust_klasse)} %` },
                  { label: "Welt", wert: anzeigeWert("welt", p.welt) },
                  { label: "Design", wert: p.designer || "–" },
                  { label: "Grundpreis", wert: p.grundpreis_einheit ? `${p.grundpreis_menge} ${p.grundpreis_einheit}` : a.kategorie?.grundpreis_pflicht ? "fehlt" : "nicht nötig" },
                ]}
              />
            </Kachel>
            <Kachel titel={AKTE_PRODUKT.website}>
              <Fakten
                eintraege={[
                  { label: "Website", wert: sichtbar ? AKTE_PRODUKT.websiteSichtbar : AKTE_PRODUKT.websiteNicht },
                  { label: "Shop", wert: p.verkauf_online ? "im Shop" : "nicht im Shop" },
                  { label: "Lieferzeit", wert: `${p.sofort_lieferbar ? AKTE_PRODUKT.sofort : AKTE_PRODUKT.lieferzeitWochen(p.lieferzeit_wochen_von, p.lieferzeit_wochen_bis)} · ${p.lieferzeit_freigegeben ? AKTE_PRODUKT.lieferzeitFrei : AKTE_PRODUKT.lieferzeitOffen}` },
                  { label: "Veröffentlicht am", wert: datum(p.veroeffentlicht_am) },
                ]}
              />
            </Kachel>
          </div>
        )}

        {tab === "preise" && (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={AKTE_PRODUKT.preiseTitel} unter={AKTE_PRODUKT.preiseUnter}>
              <div className="mb-5 flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <p className="bo-sor-klein">{AKTE_PRODUKT.preis}</p>
                  <p className="bo-sor-preiszahl">{pz.art === "anfrage" ? PRODUKTE.aufAnfrage : pz.cent ? cent(pz.cent) : "–"}</p>
                  {p.preisart === "UVP" && pz.stand && <p className="bo-sor-klein mt-1">{AKTE_PRODUKT.preisUvpText(datum(pz.stand))}</p>}
                </div>
                <div>
                  <p className="bo-sor-klein">{AKTE_PRODUKT.tiefstpreis}</p>
                  <p className="text-[22px] leading-7 font-medium tabular-nums">{tiefst ? cent(tiefst) : "–"}</p>
                  {!tiefst && <p className="bo-sor-klein">{AKTE_PRODUKT.tiefstpreisFehlt}</p>}
                </div>
                <div>
                  <p className="bo-sor-klein">{AKTE_PRODUKT.gueltigBis}</p>
                  <p className="text-[22px] leading-7 font-medium tabular-nums">{pz.stand ? datum(gueltigBis(pz.stand, p.preisart)) : "–"}</p>
                </div>
              </div>
              {preise.length === 0 ? (
                <Leer groesse="karte" titel={AKTE_PRODUKT.preiseLeer} icon="Tag" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="bo-sor-tabelle">
                    <thead>
                      <tr>
                        <th scope="col">{AKTE_PRODUKT.ab}</th>
                        <th scope="col">Preisart</th>
                        <th scope="col" className="r">Betrag</th>
                        <th scope="col">{AKTE_PRODUKT.quelle}</th>
                        <th scope="col">Freigabe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preise.map((x) => (
                        <tr key={x.name}>
                          <td className="bo-sor-nr">{datum(x.ab)}</td>
                          <td>{GLOSSAR.preisartKurz[x.preisart] || x.preisart}</td>
                          <td className="r bo-sor-zahl font-medium">{cent(x.brutto_cent)}</td>
                          <td className="bo-sor-unter">{anzeigeWert("preisQuelle", x.quelle)} · Stand {datum(x.stand)}</td>
                          <td>{x.freigegeben ? <Pille material="salbei" groesse="sm">{AKTE_PRODUKT.freigegeben}</Pille> : <Pille material="eiche" groesse="sm">{AKTE_PRODUKT.freigabeOffen}</Pille>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Kachel>
            <Kachel titel={AKTE_PRODUKT.einkauf}>
              {ek ? (
                <NurIntern>
                  <Fakten eintraege={[{ label: "EK netto", wert: cent(p.einkaufspreis_cent) }, { label: "Kalkulation", wert: a.marke?.kalkulationsfaktor_promille ? `Faktor ${(a.marke.kalkulationsfaktor_promille / 1000).toLocaleString("de-AT")}` : "–" }]} />
                </NurIntern>
              ) : (
                <p className="bo-sor-unter">{AKTE_PRODUKT.einkaufNurLeitung}</p>
              )}
            </Kachel>
          </div>
        )}

        {tab === "ausfuehrungen" && (
          <Kachel titel={AKTE_PRODUKT.tabs.ausfuehrungen} unter={a.ausfuehrungen.length ? `${gruppen.length} Gruppen · ${a.ausfuehrungen.length} Optionen` : undefined}>
            {a.ausfuehrungen.length === 0 ? (
              <Leer groesse="karte" titel="Keine Ausführungen" text={AKTE_PRODUKT.ausfuehrungenLeer} icon="Layers" />
            ) : (
              <div className="flex flex-col gap-6">
                {gruppen.map((g) => (
                  <section key={g}>
                    <h3 className="bo-titel-kachel mb-2">{(p.ausfuehrungen || []).find((x) => x.gruppe_key === g)?.gruppe_de || g}</h3>
                    <ul className="flex flex-wrap gap-2">
                      {a.ausfuehrungen
                        .filter((x) => x.gruppe_key === g)
                        .map((x) => (
                          <li key={x.name} className="inline-flex items-center gap-2 rounded-[14px] bg-bo-fill px-3 py-2 text-[14px]">
                            {x.farbe_hex ? <span className="bo-sor-farbe" style={{ background: x.farbe_hex }} aria-hidden="true" /> : null}
                            <span className="font-medium">{x.name_de}</span>
                            <span className="bo-sor-klein">{[x.code, x.preisgruppe].filter(Boolean).join(" · ")}</span>
                            {x.standard ? <Pille material="stein" groesse="xs">Standard</Pille> : null}
                          </li>
                        ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Kachel>
        )}

        {tab === "texte" && (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={AKTE_PRODUKT.texteDe} unter={treffer.length ? AKTE_PRODUKT.haendlerwortTreffer(treffer[0]) : AKTE_PRODUKT.haendlerwortOk}>
              <Fakten
                spalten={2}
                eintraege={[
                  { label: AKTE_PRODUKT.kurztext, wert: p.kurz_de || "–" },
                  { label: AKTE_PRODUKT.seoTitel, wert: p.seo_title_de ? `${p.seo_title_de} (${AKTE_PRODUKT.zeichen(p.seo_title_de.length, 60)})` : "–" },
                  { label: AKTE_PRODUKT.beschreibung, wert: p.beschreibung_de ? String(p.beschreibung_de).replace(/<[^>]+>/g, " ").trim() : "–" },
                  { label: AKTE_PRODUKT.seoBeschreibung, wert: p.seo_description_de || "–" },
                ]}
              />
            </Kachel>
            <Kachel titel={AKTE_PRODUKT.uebersetzungen}>
              <ul className="flex flex-wrap gap-2">
                {["en", "fr", "it"].map((s) => (
                  <li key={s}>
                    <Pille material={p[`kurz_${s}`] ? "salbei" : "eiche"}>{`${s.toUpperCase() === "EN" ? "Englisch" : s === "fr" ? "Französisch" : "Italienisch"}: ${p[`kurz_${s}`] ? AKTE_PRODUKT.vorhanden : AKTE_PRODUKT.fehlt}`}</Pille>
                  </li>
                ))}
              </ul>
            </Kachel>
          </div>
        )}

        {tab === "verlauf" && (
          <Kachel titel={AKTE_PRODUKT.tabs.verlauf}>
            <Zeitleiste doctype="PH Produkt" name={p.name} docinfo={a.docinfo} darfSchreiben={darfSchreiben} />
          </Kachel>
        )}
      </AkteGeruest>
    </Shell>
  );
}

