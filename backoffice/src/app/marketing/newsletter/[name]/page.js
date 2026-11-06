// /marketing/newsletter/[name] – Ausgabe-Akte (10-konzept-marketing § 2.3, T5 mit Block-Editor).
// Kopf: Betreff als Titel, Status, Phase (Entwurf → Wartet auf Freigabe → Geplant → Versendet), Bereitschaft,
// genau eine Primäraktion. Reiter Inhalt · Empfänger & Versand · Protokoll · Verlauf (höchstens 4).
import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import AusgabeEditor from "@/components/Backoffice/Marketing/AusgabeEditor";
import AusgabeAktionen from "@/components/Backoffice/Marketing/AusgabeAktionen";
import VersandFormular from "@/components/Backoffice/Marketing/VersandFormular";
import { ListeKachel, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { ausgabeAkte, fensterAus, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { empfaengerAnzahl } from "@/lib/backoffice/marketing/methoden";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { bereitschaft, countdown, ersterDonnerstag, kurzDatum, langDatum, monatAusSlug } from "@/lib/backoffice/marketing/regeln";
import { NEWSLETTER, STATUS_TEXT, VERSANDWEG_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { datumZeit, zahl } from "@/lib/backoffice/format";
import { isoDatumZeit } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: seitentitel(`Ausgabe ${decodeURIComponent(name)}`) };
}

const PHASEN = ["Entwurf", "Freigabe", "Geplant", "Versendet"];

export default async function AusgabeSeite({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/newsletter/${roh}`, doctype: "PH Newsletter Ausgabe" });
  const akte = await ausgabeAkte(ctx.client, name).catch((err) => (err?.code === "not_found" ? null : Promise.reject(err)));
  if (!akte) notFound();
  const { doc, docinfo } = akte;
  const monat = monatAusSlug(doc.slug);
  const b = bereitschaft(doc.bloecke || []);
  const empfaenger = await empfaengerAnzahl(ctx.client, doc).catch(() => doc.empfaenger_anzahl || null);
  const fenster = fensterAus(ctx.einst);
  const vorschlag = isoDatumZeit(ersterDonnerstag(new Date(), { monat: /^\d{4}-\d{2}/.test(doc.slug) ? doc.slug.slice(0, 7) : undefined })).slice(0, 16);
  const eingefroren = ["Wird versendet", "Versendet", "Abgebrochen"].includes(doc.status);
  const nurLesen = eingefroren || !ctx.team;
  const tabs = [
    { id: "inhalt", titel: NEWSLETTER.tabs.inhalt },
    { id: "versand", titel: NEWSLETTER.tabs.versand },
    { id: "protokoll", titel: NEWSLETTER.tabs.protokoll, anzahl: akte.protokoll.length || undefined },
    { id: "verlauf", titel: NEWSLETTER.tabs.verlauf },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const phaseI = PHASEN.indexOf(doc.status === "Wird versendet" ? "Versendet" : doc.status);
  const teilfehler = doc.status === "Versendet" && Number(doc.fehler || 0) > 0;

  const band =
    doc.status === "Abgebrochen" ? (
      <Band ton="gefahr" titel={NEWSLETTER.abgebrochenBand(doc.abbruch_grund)} />
    ) : doc.status === "Versendet" ? (
      <Band ton="neutral" icon="Lock" titel={NEWSLETTER.eingefroren(datumZeit(doc.versendet_am))} text={teilfehler ? NEWSLETTER.teilfehler(zahl(doc.gesendet), zahl(doc.fehler)) : undefined} aktion={teilfehler ? <Link className="bo-mar-link text-[13px] font-medium underline underline-offset-2" href="?tab=protokoll&status=fehler">Protokoll</Link> : null} />
    ) : null;

  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/newsletter", titel: "Newsletter" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Newsletter", href: "/marketing/newsletter" }, { titel: monat }]}
        titel={doc.betreff && doc.betreff !== "(ohne Betreff)" ? `„${doc.betreff}“` : monat}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <span className="bo-mar-mono">{doc.name}</span>
            <Status gruppe="ausgabe" wert={doc.status} testid="ausgabe-status" />
            <span className="inline-flex items-center gap-1" aria-label={`Phase ${STATUS_TEXT.ausgabe[doc.status]}`}>
              {PHASEN.map((p, i) => (
                <span key={p} className="inline-block size-2 rounded-full" style={{ background: i <= phaseI ? "var(--color-bo-text)" : "var(--color-bo-line-strong)" }} aria-hidden="true" />
              ))}
            </span>
          </span>
        }
        aktionen={
          <AusgabeAktionen
            name={doc.name}
            doc={{ name: doc.name, slug: doc.slug, status: doc.status, versand_geplant: doc.versand_geplant, empfaenger_anzahl: doc.empfaenger_anzahl, gesendet: doc.gesendet, fehler: doc.fehler, zielgruppe: doc.zielgruppe, bloecke: (doc.bloecke || []).map((x) => ({ typ: x.typ, quelle: x.quelle })), modified: doc.modified }}
            bereit={b}
            leitung={ctx.leitung}
            team={ctx.team}
            letzteTestmail={akte.letzteTestmail}
            testmodus={ctx.testmodus}
            testadresse={ctx.einst.test_empfaenger || ctx.session.user}
            fenster={fenster}
            dialog={sp.dialog}
            vorschlag={vorschlag}
            empfaenger={empfaenger}
          />
        }
      />
      <div className="bo-mar-kopfzeile mb-6" data-testid="bereitschaft">
        <span className={b.bereit ? "bo-mar-ok font-medium" : "bo-mar-warn font-medium"} title={NEWSLETTER.regel}>
          {b.bereit ? NEWSLETTER.bereit(b.ok, b.gesamt) : NEWSLETTER.nichtBereit(b.fehlt)}
        </span>
        <span>· {empfaenger != null ? `${zahl(empfaenger)} Empfänger` : "Empfänger –"}</span>
        {doc.versand_geplant && doc.status === "Geplant" && (
          <span title={langDatum(doc.versand_geplant)} suppressHydrationWarning>
            · Versand {kurzDatum(doc.versand_geplant, { zeit: true })} ({NEWSLETTER.sendetIn(countdown(doc.versand_geplant))})
          </span>
        )}
      </div>
      {band && <div className="mb-6">{band}</div>}
      <AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/newsletter/${roh}`} params={{}} />
      <div className="mt-6">
        {tab === "inhalt" && <AusgabeEditor name={doc.name} doc={{ betreff: doc.betreff, bloecke: doc.bloecke, modified: doc.modified, slug: doc.slug, status: doc.status }} events={akte.events} nurLesen={nurLesen} />}
        {tab === "versand" && (
          <VersandFormular
            name={doc.name}
            doc={{ zielgruppe: doc.zielgruppe, zielgruppe_interesse: doc.zielgruppe_interesse, sprache: doc.sprache, segment: doc.segment, kampagne: doc.kampagne, versand_geplant: doc.versand_geplant, modified: doc.modified }}
            segmente={akte.segmente}
            interessen={akte.interessen}
            kampagnen={akte.kampagnen}
            empfaenger={empfaenger}
            fenster={fenster}
            nurLesen={nurLesen}
            darfTermin={ctx.leitung}
          />
        )}
        {tab === "versand" && (
          <Kachel className="mt-6" titel="Fakten">
            <dl className="bo-mar-fakten mt-2">
              <div>
                <dt>Versandweg</dt>
                <dd>{VERSANDWEG_TEXT[doc.versandweg || ctx.einst.versandweg] || "Versand über das System"}</dd>
              </div>
              <div>
                <dt>Freigegeben von</dt>
                <dd>{doc.freigegeben_von ? `${doc.freigegeben_von} · ${datumZeit(doc.freigegeben_am)}` : "–"}</dd>
              </div>
            </dl>
          </Kachel>
        )}
        {tab === "protokoll" && <Protokoll zeilen={akte.protokoll} status={sp.status} roh={roh} doc={doc} />}
        {tab === "verlauf" && <Zeitleiste doctype="PH Newsletter Ausgabe" name={doc.name} docinfo={docinfo} darfSchreiben={ctx.team} />}
      </div>
    </Rahmen>
  );
}

function Protokoll({ zeilen, status, roh, doc }) {
  if (!zeilen.length) return <p className="bo-mar-unter rounded-[20px] bg-(--color-bo-surface-2) p-6" data-testid="protokoll-leer">{NEWSLETTER.protokollLeer}</p>;
  const zaehler = {};
  for (const z of zeilen) zaehler[z.status] = (zaehler[z.status] || 0) + 1;
  const sicht = status ? zeilen.filter((z) => z.status === status || (status === "fehler" && /fehler|bounce|beschwerde/.test(z.status))) : zeilen;
  return (
    <ListeKachel
      label="Versandprotokoll"
      testid="protokoll"
      kopf={
        <span className="flex flex-wrap gap-2">
          <Link className="bo-mar-chip" aria-pressed={!status} href={`/marketing/newsletter/${roh}?tab=protokoll`}>
            Alle {zeilen.length}
          </Link>
          {Object.entries(zaehler).map(([s, n]) => (
            <Link key={s} className="bo-mar-chip" aria-pressed={status === s} href={`/marketing/newsletter/${roh}?tab=protokoll&status=${encodeURIComponent(s)}`}>
              {STATUS_TEXT.versand[s] || s} {n}
            </Link>
          ))}
        </span>
      }
      fuss={<span>Summe: {zahl(doc.gesendet || 0)} gesendet · {zahl(doc.fehler || 0)} Fehler</span>}
    >
      <div className="overflow-x-auto">
        <table className="bo-mar-tabelle">
          <thead>
            <tr>
              <th scope="col">E-Mail</th>
              <th scope="col">Status</th>
              <th scope="col">Gesendet</th>
              <th scope="col">Zugestellt</th>
              <th scope="col">Grund</th>
            </tr>
          </thead>
          <tbody>
            {sicht.map((z) => (
              <tr key={z.name}>
                <td>{z.email}</td>
                <td>
                  <Status gruppe="versand" wert={z.status} />
                </td>
                <td className="whitespace-nowrap">{z.gesendet_am ? kurzDatum(z.gesendet_am, { zeit: true }) : "–"}</td>
                <td className="whitespace-nowrap">{z.zugestellt_am ? kurzDatum(z.zugestellt_am, { zeit: true }) : "–"}</td>
                <td className="bo-mar-unter">{z.grund || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ListeKachel>
  );
}
