import { notFound } from "next/navigation";
import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Knopf from "@/components/Backoffice/Knopf";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { AkteGeruest, AkteKopf, AkteTabs, Band, RechteSpalte, Vorgangsleiste } from "@/components/Backoffice/Akte";
import { CrmStatus, KontaktKnoepfe } from "@/components/Backoffice/Crm/Teile";
import { Countdown, TerminAktionen } from "@/components/Backoffice/Crm/TerminTeile";
import { beraterListe, istLeitung, ladeTermin, personName } from "@/lib/backoffice/crm/daten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { materialFuerModus } from "@/lib/backoffice/crm/status";
import { terminZeit, uhrzeit, vorgangsSchritte } from "@/lib/backoffice/crm/vorgang";
import { hrefFuer } from "@/lib/backoffice/crm/zuErledigen";
import { aktiverTab, waehleBand } from "@/lib/backoffice/akte/geruest";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Termine · CRM` };
}

export default async function TerminAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/crm/termine/${roh}`);
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Termin");
  await requireDocRecht(meta, "read", `/crm/termine/${roh}`);
  let d;
  try {
    d = await ladeTermin(session, client, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return <Shell session={session}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} zurueckHref="/crm/termine" /></Shell>;
  }
  const { doc: t, anfrage, kontakt, gespraech, personen } = d;
  const leitung = istLeitung(session);
  const berater = await beraterListe(client);
  const person = personName(t) || kontakt?.titel || t.titel;
  const website = t.quelle === "website";
  const tabs = [
    { id: "uebersicht", titel: T.termine.tabs.uebersicht },
    { id: "kunde", titel: T.termine.tabs.kunde },
    ...(website ? [{ id: "buchung", titel: T.termine.tabs.buchung }] : []),
    { id: "aktivitaet", titel: T.termine.tabs.aktivitaet, anzahl: (d.docinfo?.comments?.length || 0) + (d.docinfo?.versions?.length || 0) },
  ];
  const tab = aktiverTab([...tabs, { id: "seite" }], sp?.tab);
  const schritte = vorgangsSchritte({ anfrage, termine: d.termine, gespraeche: gespraech ? [gespraech] : [] }, { href: hrefFuer });
  const band = waehleBand([
    t.status === "Unbestaetigt" && Number(t.email_verifiziert) && { rang: 1, ton: "info", titel: T.termine.bandBestaetigen },
    t.status === "Unbestaetigt" && !t.email && { rang: 2, ton: "warnung", titel: T.termine.ohneMailTelefon },
  ].filter(Boolean));
  const jetzt = new Date().toISOString();

  return (
    <Shell session={session}>
      <AkteGeruest
        testid="crm-termin-akte"
        vorgangOben
        seiteAktiv={tab === "seite"}
        kopf={
          <AkteKopf
            zurueck={{ href: "/crm/termine", titel: T.seiten.termine }}
            krumen={[{ titel: T.seiten.termine, href: "/crm/termine" }, { titel: terminZeit(t.start) }]}
            titel={`${terminZeit(t.start)} · ${person}`}
            nummer={<span className="flex flex-wrap items-center gap-2"><Pille material={materialFuerModus(t.modus)}>{T.modus[t.modus]}</Pille><span>{t.name}</span>{t.reserviert_bis && t.status === "Unbestaetigt" ? <Countdown bis={t.reserviert_bis} /> : null}</span>}
            status={<CrmStatus objekt="termin" doc={t} />}
            aktionen={<TerminAktionen termin={{ name: t.name, status: t.status, start: t.start, modus: t.modus, email: t.email, kundenmail: t.kundenmail, meet_url: t.meet_url, beratungsgespraech: t.beratungsgespraech, kontakt: t.kontakt, berater: t.berater, dauer_min: t.dauer_min }} berater={berater} ich={session.user} leitung={leitung} jetzt={jetzt} />}
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} />}
        vorgang={<Vorgangsleiste titel="Vorgang" schritte={schritte} />}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/crm/termine/${roh}`} params={{}} mitSeite />}
        rechts={
          <RechteSpalte
            details={
              <dl className="grid gap-3 text-[14px]" data-testid="crm-termin-details">
                <div className="flex items-center justify-between gap-3"><dt className="text-bo-text-soft">Berater</dt><dd>{t.berater ? <PersonZelle person={personen[t.berater]?.name || t.berater} groesse={24} /> : "–"}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-bo-text-soft">Thema</dt><dd>{t.thema || "–"}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-bo-text-soft">Terminart</dt><dd>{t.terminart || "–"}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-bo-text-soft">Quelle</dt><dd>{T.quelle[t.quelle] || t.quelle || "–"}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-bo-text-soft">Kundenmail</dt><dd>{t.kundenmail === "website" ? "über die Website" : "vom Backoffice"}</dd></div>
                {leitung && t.notiz_intern ? <div data-intern=""><dt className="text-bo-text-soft">{T.akte.intern}</dt><dd>{String(t.notiz_intern).replace(/<[^>]*>/g, "")}</dd></div> : null}
              </dl>
            }
            bezuege={
              <div className="grid gap-2">
                {kontakt && <Link href={`/kunden/${encodeURIComponent(kontakt.name)}`} className="rounded-[16px] bg-bo-surface-2 px-4 py-3 hover:bg-bo-fill-2"><span className="block text-[13px] text-bo-text-soft">{T.knopf.kundenakte}</span><span className="block font-semibold">{kontakt.titel}</span></Link>}
                {anfrage && <Link href={hrefFuer("PH Anfrage", anfrage.name)} className="rounded-[16px] px-4 py-2 hover:bg-bo-surface-2"><span className="block text-[13px] text-bo-text-soft">Anfrage</span><span className="block">{anfrage.name}</span></Link>}
                {gespraech && <Link href={hrefFuer("PH Beratungsgespraech", gespraech.name)} className="rounded-[16px] px-4 py-2 hover:bg-bo-surface-2"><span className="block text-[13px] text-bo-text-soft">Gesprächsprotokoll</span><span className="block">{gespraech.titel || gespraech.name}</span></Link>}
                {d.aufgaben.length > 0 && <p className="px-4 text-[13px] text-bo-text-soft">{d.aufgaben.length} Aufgabe(n)</p>}
              </div>
            }
            kachel={{ details: { titel: T.anfrageAkte.details }, bezuege: { titel: T.akte.bezuege } }}
          />
        }
      >
        {tab === "uebersicht" && (
          <Kachel titel={`${uhrzeit(t.start)}–${uhrzeit(t.ende)} (${t.dauer_min || 60} min)`} unter={[T.modus[t.modus], t.thema ? `Thema ${t.thema}` : "", t.puffer_min ? `Puffer ${t.puffer_min} min` : ""].filter(Boolean).join(" · ")}>
            {t.anliegen ? <blockquote className="border-l-2 border-bo-line-strong pl-4 text-[17px] leading-[26px]">{t.anliegen}</blockquote> : <p className="text-[14px] text-bo-text-soft">Kein Anliegen angegeben.</p>}
            {t.modus === "Video" && (
              <div className="mt-5 rounded-[20px] bg-bo-surface-2 p-4">
                <p className="text-[13px] text-bo-text-soft">{T.termine.videoraum}</p>
                {t.meet_url ? <a href={t.meet_url} className="font-semibold hover:underline">{t.meet_url}</a> : <p className="text-[14px]">{T.termine.keinRaum}</p>}
              </div>
            )}
            {t.storno_grund && <p className="mt-4 text-[14px] text-bo-text-soft">Grund: {t.storno_grund}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3"><KontaktKnoepfe email={t.email} telefon={t.telefon} wer={person} /><span className="text-[14px] text-bo-text-soft">{[t.email, t.telefon].filter(Boolean).join(" · ")}</span></div>
          </Kachel>
        )}
        {tab === "kunde" && (
          <Kachel titel={kontakt?.titel || person} unter={kontakt ? T.status.kontakt[kontakt.status] : "Noch ohne Kundenakte – wird beim Protokoll angelegt"}>
            <dl className="bo-crm-fakten">
              <div><dt>{T.dialog.email}</dt><dd>{kontakt?.email || t.email || "–"}</dd></div>
              <div><dt>{T.dialog.telefon}</dt><dd>{kontakt?.telefon || t.telefon || "–"}</dd></div>
              <div><dt>{T.dialog.ort}</dt><dd>{kontakt ? [kontakt.plz, kontakt.ort].filter(Boolean).join(" ") : t.plz_ort || "–"}</dd></div>
              <div><dt>Sprache</dt><dd>{String(t.sprache || "de").toUpperCase()}</dd></div>
            </dl>
            {kontakt && <div className="mt-4"><Knopf size="s" variant="secondary" href={`/kunden/${encodeURIComponent(kontakt.name)}`} iconRechts="ArrowUpRight">{T.knopf.kundenakte}</Knopf></div>}
          </Kachel>
        )}
        {tab === "buchung" && (
          <Kachel titel={T.termine.tabs.buchung} unter={T.termine.buchungHinweis}>
            <dl className="bo-crm-fakten">
              <div><dt>E-Mail bestätigt</dt><dd>{Number(t.email_verifiziert) ? "ja" : "nein"}</dd></div>
              <div><dt>Reserviert bis</dt><dd>{t.reserviert_bis ? datumZeit(t.reserviert_bis) : "–"}</dd></div>
              <div><dt>Linkversion</dt><dd>{t.link_version || "–"}</dd></div>
              <div><dt>Einwilligung Video</dt><dd>{Number(t.einwilligung_video) ? `ja · ${t.einwilligung_text_version || ""}` : "–"}</dd></div>
              <div><dt>Einwilligung am</dt><dd>{t.einwilligung_zeitpunkt ? datum(t.einwilligung_zeitpunkt) : "–"}</dd></div>
              <div><dt>Zeitzone</dt><dd>{t.zeitzone || "Europe/Vienna"}</dd></div>
            </dl>
          </Kachel>
        )}
        {tab === "aktivitaet" && (
          <Zeitleiste doctype="PH Termin" name={t.name} docinfo={d.docinfo} darfSchreiben feldLabels={{ status: "Status", start: "Beginn", berater: "Berater", workflow_state: "Status" }} />
        )}
      </AkteGeruest>
    </Shell>
  );
}
