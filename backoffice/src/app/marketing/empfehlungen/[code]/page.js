// /marketing/empfehlungen/[code] – Empfehlungs-Akte (10-konzept-marketing § 2.10): eine Seite mit Schrittleiste inkl.
// „Geliefert und bezahlt“ (K6), Prüfampeln Storno · Lieferung · Zahlung · Frist (R8, bis P0-8 selbst berechnet),
// Storno-Band, Unternehmer-Hinweis, Gutschein … (D6) gesperrt bis S7 bzw. solange eine Ampel nicht grün ist.
import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import { AkteKopf, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Icon } from "@/components/Backoffice/icons";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Fakten, Status } from "@/components/Backoffice/Marketing/Bausteine";
import { Ampeln, EmpfehlungAktionen } from "@/components/Backoffice/Marketing/Empfehlungen";
import { empfehlungAkte, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { empfehlungAmpeln, empfehlungSchritt, kurzDatum } from "@/lib/backoffice/marketing/regeln";
import { EMPFEHLUNGEN, seitentitel } from "@/lib/backoffice/marketing/texte";
import { cent } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Empfehlung") };

export default async function EmpfehlungSeite({ params }) {
  const { code: roh } = await params;
  const code = decodeURIComponent(roh);
  const ctx = await marketingKontext({ pfad: `/marketing/empfehlungen/${roh}`, doctype: "PH Empfehlung" });
  const akte = await empfehlungAkte(ctx.client, code).catch((e) => (e?.code === "not_found" ? null : Promise.reject(e)));
  if (!akte) notFound();
  const { doc: e, docinfo, fakten } = akte;
  const ampeln = empfehlungAmpeln({ ab: fakten.ab, lieferscheine: fakten.lieferscheine, ruecktrittTage: Number(ctx.einst.empfehlung_ruecktritt_tage || 14), cent });
  const schritt = e.status === "Abgelehnt" || e.status === "Verfallen" ? -1 : empfehlungSchritt(e, { ampeln });
  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/empfehlungen", titel: "Empfehlungen" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Empfehlungen", href: "/marketing/empfehlungen" }, { titel: e.code }]}
        titel={`${e.code} · ${e.empfehler_name}`}
        nummer={<span className="bo-mar-kopfzeile mt-0"><Status gruppe="empfehlung" wert={e.status} testid="empfehlung-status" /></span>}
        aktionen={<EmpfehlungAktionen e={{ name: e.name, code: e.code, status: e.status, code_gesendet_am: e.code_gesendet_am, auftrag: e.auftrag, empfehler_name: e.empfehler_name }} ampeln={ampeln} faehig={ctx.an} leitung={ctx.leitung} team={ctx.team} auftraege={akte.auftraege} wert={ctx.einst.empfehlung_gutschein_cent} />}
      />
      {ampeln.storniert && <div className="mb-6"><Band ton="gefahr" titel={e.status === "Abgelehnt" ? EMPFEHLUNGEN.storniertBand : EMPFEHLUNGEN.storniertBandVorher} /></div>}
      <section className="bo-kachel mb-(--bo-bento-gap)" style={{ padding: 24 }} aria-label="Schritte">
        <ol className="bo-mar-schritte" data-testid="empfehlung-schritte">
          {EMPFEHLUNGEN.schritte.map((t, i) => (
            <li key={t} className="bo-mar-schritt" data-zustand={i < schritt ? "erledigt" : i === schritt ? "aktuell" : "offen"} aria-current={i === schritt ? "step" : undefined}>
              <span className="bo-mar-schritt__punkt">{i < schritt ? <Icon name="Check" className="size-3.5" /> : <span className="text-[12px] font-semibold">{i + 1}</span>}</span>
              <span className="bo-mar-schritt__text">{t}</span>
            </li>
          ))}
        </ol>
        <p className="bo-mar-unter mt-3">{EMPFEHLUNGEN.faelligSatz}</p>
      </section>
      <div className="bo-mar-akte">
        <div className="bo-mar-stapel">
          <Kachel titel="Prüfung vor dem Gutschein"><div className="mt-3"><Ampeln ampeln={ampeln} /></div></Kachel>
          <Kachel titel={EMPFEHLUNGEN.empfehler}>
            <div className="mt-3"><Fakten eintraege={[{ label: "Name", wert: e.empfehler_name }, { label: "E-Mail", wert: e.empfehler_email }, { label: EMPFEHLUNGEN.eigenerAuftrag, wert: e.empfehler_auftrag }, { label: "Code gesendet", wert: e.code_gesendet_am ? kurzDatum(e.code_gesendet_am, { zeit: true }) : EMPFEHLUNGEN.codeNichtGesendet }]} /></div>
            <p className="bo-mar-klein mt-4">{EMPFEHLUNGEN.unternehmer} – {EMPFEHLUNGEN.unternehmerHinweis}</p>
          </Kachel>
          <Kachel titel={EMPFEHLUNGEN.empfohlen}>
            <div className="mt-3"><Fakten eintraege={[{ label: "Name", wert: e.empfohlen_name || "–" }, { label: "E-Mail", wert: e.empfohlen_email || "–" }, { label: "Zuordnung", wert: Number(e.einwilligung_empfohlen || 0) ? EMPFEHLUNGEN.zustimmung(kurzDatum(e.einwilligung_zeit, { zeit: true })) : EMPFEHLUNGEN.keineZustimmung }, { label: "Anfrage", wert: e.anfrage ? <Link className="bo-mar-link" href={`/d/ph-anfrage/${encodeURIComponent(e.anfrage)}`}>{e.anfrage}</Link> : "–" }]} /></div>
          </Kachel>
          <Kachel titel={EMPFEHLUNGEN.auftrag}>
            <div className="mt-3"><Fakten eintraege={[{ label: "Auftragsbestätigung", wert: e.auftrag || "–" }, { label: "Status", wert: fakten.ab?.status || "–" }, { label: "Offen", wert: fakten.ab ? cent(fakten.ab.offen_cent || 0) : "–" }, { label: "Letzte Zustellung", wert: ampeln.letzteZustellung ? kurzDatum(ampeln.letzteZustellung, { jahr: true }) : "–" }, { label: "Vertragsart", wert: fakten.ab?.vertragsort || "–" }]} /></div>
          </Kachel>
        </div>
        <aside className="bo-mar-akte__rechts">
          <Kachel titel="Bezüge">
            <ul className="mt-2 flex flex-col gap-2 text-[14px]">
              <li><Link className="bo-mar-link" href={`/marketing/empfaenger/${encodeURIComponent(e.empfehler_email)}`}>Empfänger {e.empfehler_email}</Link></li>
              {e.empfehler_kontakt && <li><Link className="bo-mar-link" href={`/kunden/${encodeURIComponent(e.empfehler_kontakt)}`}>Kundenakte Empfehler</Link></li>}
              <li className="bo-mar-unter">Gutschein: {e.gutschein_code_letzte4 ? `…${e.gutschein_code_letzte4} · ${kurzDatum(e.gutschein_ausgegeben_am, { jahr: true })}` : "–"}</li>
            </ul>
          </Kachel>
          <Zeitleiste doctype="PH Empfehlung" name={e.name} docinfo={docinfo} darfSchreiben={ctx.team} />
        </aside>
      </div>
    </Rahmen>
  );
}
