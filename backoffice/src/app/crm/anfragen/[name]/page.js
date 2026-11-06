import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band, GlasKnopf, RechteSpalte, Vorgangsleiste } from "@/components/Backoffice/Akte";
import Knopf from "@/components/Backoffice/Knopf";
import { KontaktKnoepfe, CrmStatus } from "@/components/Backoffice/Crm/Teile";
import { AnfrageAktionen, AnfrageDetails, KundeZuordnen } from "@/components/Backoffice/Crm/AnfrageTeile";
import { beraterListe, istLeitung, ladeAnfrage, personName } from "@/lib/backoffice/crm/daten";
import { istMock } from "@/lib/backoffice/crm/backend";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { alterText, empfehlung, kurzDatum, terminZeit, vorgangsSchritte } from "@/lib/backoffice/crm/vorgang";
import { hrefFuer } from "@/lib/backoffice/crm/zuErledigen";
import { raumBild } from "@/lib/backoffice/crm/bilder";
import { aktiverTab, waehleBand } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Anfragen · CRM` };
}

const ohneArt = (t) => String(t || "").replace(/^[A-Za-zÄÖÜäöü]+:\s*/, "");

export default async function AnfrageAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/crm/anfragen/${roh}`);
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Anfrage");
  await requireDocRecht(meta, "read", `/crm/anfragen/${roh}`);

  let d;
  try {
    d = await ladeAnfrage(session, client, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} zurueckHref="/crm/anfragen" />
      </Shell>
    );
  }
  const { doc: a, termine, aufgaben, angebote, auftraege, gespraeche, kontakt, duplikat, abgeleitet, personen } = d;
  const person = personName(a);
  const leitung = istLeitung(session);
  const berater = await beraterListe(client);
  const emp = empfehlung(abgeleitet);
  const mock = istMock(client);
  const bild = raumBild(a.projektart || a.art, { mock });
  const nachfass = aufgaben.find((k) => ["Offen", "In Arbeit"].includes(k.status) && k.referenz_doctype === "PH Anfrage");
  const gesperrt = ["Gewonnen", "Verloren", "Spam"].includes(a.status) && !leitung;
  const aktivTermin = abgeleitet.termin;
  const schritte = vorgangsSchritte({ anfrage: a, termine, gespraeche, angebote, auftraege }, { href: hrefFuer });

  const tabs = [
    { id: "uebersicht", titel: T.anfrageAkte.tabs.uebersicht },
    { id: "anliegen", titel: T.anfrageAkte.tabs.anliegen, anzahl: d.docinfo?.attachments?.length || 0 },
    { id: "produkte", titel: T.anfrageAkte.tabs.produkte, anzahl: (a.produkte || []).length },
    { id: "herkunft", titel: T.anfrageAkte.tabs.herkunft },
    { id: "aktivitaet", titel: T.anfrageAkte.tabs.aktivitaet, anzahl: (d.docinfo?.comments?.length || 0) + (d.docinfo?.versions?.length || 0) },
  ];
  const tab = aktiverTab([...tabs, { id: "seite" }], sp?.tab);
  const band = waehleBand([
    abgeleitet.passtNicht && { rang: 1, ton: "warnung", titel: T.anfrageAkte.bandPasstNicht, text: `Angezeigt wird „${abgeleitet.text}“.` },
    duplikat && { rang: 2, ton: "info", titel: T.anfrageAkte.bandDuplikat(duplikat.name, datum(duplikat.eingang)), aktion: <Knopf size="s" variant="ghost" href={`/crm/anfragen/${encodeURIComponent(duplikat.name)}`}>{T.knopf.oeffnen}</Knopf> },
    a.upload_status === "offen" && { rang: 3, ton: "neutral", titel: T.anfrageAkte.bandUpload },
  ].filter(Boolean));
  const alt = alterText(a.eingang, { status: a.status });

  const aktionen = (
    <AnfrageAktionen
      anfrage={{ name: a.name, status: a.status, email: a.email, kontakt: a.kontakt, person: person || ohneArt(a.titel), zugewiesen_an: a.zugewiesen_an, ort_der_beratung: a.ort_der_beratung, projektart: a.projektart, wunschzeiten: a.wunschzeiten }}
      empfehlung={emp}
      berater={berater}
      ich={session.user}
      leitung={leitung}
      terminHref={aktivTermin ? `/crm/termine/${encodeURIComponent(aktivTermin.name)}` : null}
      angebotHref={abgeleitet.angebot ? `/d/ph-angebot/${encodeURIComponent(abgeleitet.angebot.name)}` : null}
    />
  );

  return (
    <Shell session={session}>
      <AkteGeruest
        testid="crm-anfrage-akte"
        seiteAktiv={tab === "seite"}
        kopf={<AkteKopf zurueck={{ href: "/crm/anfragen", titel: T.seiten.anfragen }} krumen={[{ titel: T.seiten.anfragen, href: "/crm/anfragen" }, { titel: person || a.name }]} rechts={<CrmStatus objekt="anfrage" wert={abgeleitet.status} text={abgeleitet.text} ton={abgeleitet.ton} />} />}
        hero={
          <AkteHero
            bild={bild || undefined}
            ueber={`${T.art[a.art] || a.art}${a.projektart ? ` · ${a.projektart}` : ""}`}
            titel={person || ohneArt(a.titel) || a.name}
            unter={[a.plz_ort, T.quelle[a.quelle] ? `über ${T.quelle[a.quelle]}` : "", a.kanal].filter(Boolean).join(" · ")}
            chips={[{ icon: "FileText", text: a.name }, ...(alt.wort ? [{ icon: "Clock", text: alt.text }] : [])]}
            aktionen={
              <>
                {a.telefon && <GlasKnopf icon="Phone" href={`tel:${a.telefon}`}>{T.knopf.anrufen}</GlasKnopf>}
                {a.email && <GlasKnopf icon="Mail" href={`mailto:${a.email}`}>E-Mail</GlasKnopf>}
              </>
            }
            kacheln={[
              { titel: "Eingang", wert: kurzDatum(a.eingang) || "–", unter: alt.text, mittel: true },
              { titel: "Budget-Hinweis", wert: a.budget_hinweis || "offen", unter: "Kundenangabe", mittel: true },
              { titel: "Nächster Termin", wert: aktivTermin ? terminZeit(aktivTermin.start) : T.akte.keinTermin, unter: aktivTermin ? T.modus[termine.find((t) => t.name === aktivTermin.name)?.modus] || "" : "", mittel: true, person: aktivTermin ? personen[termine.find((t) => t.name === aktivTermin.name)?.berater]?.name : undefined },
              { titel: "Erwartet netto", wert: a.wert_cent ? cent(a.wert_cent).replace(",00", "") : "–", unter: a.wahrscheinlichkeit_prozent ? `${a.wahrscheinlichkeit_prozent} % Wahrscheinlichkeit` : "noch offen" },
            ]}
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} text={band.text} aktion={band.aktion} />}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/crm/anfragen/${roh}`} params={{}} mitSeite rechts={<div className="flex items-center gap-2">{aktionen}</div>} />}
        vorgang={<Vorgangsleiste titel="Vorgang" schritte={schritte} />}
        rechts={
          <RechteSpalte
            details={<AnfrageDetails anfrage={a} nachfassen={nachfass?.faellig || ""} berater={berater} gesperrt={gesperrt} />}
            bezuege={
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium text-bo-text-soft">{T.anfrageAkte.kunde}</p>
                  {kontakt ? (
                    <a href={`/kunden/${encodeURIComponent(kontakt.name)}`} className="flex items-center justify-between gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-3 hover:bg-bo-fill-2" data-testid="crm-bezug-kunde">
                      <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{kontakt.titel}</span><span className="block truncate text-[13px] text-bo-text-soft">{[T.status.kontakt[kontakt.status], kontakt.ort].filter(Boolean).join(" · ")}</span></span>
                      <span aria-hidden="true">›</span>
                    </a>
                  ) : (
                    <KundeZuordnen anfrage={{ name: a.name, email: a.email, telefon: a.telefon, nachname: a.nachname, person }} />
                  )}
                </div>
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium text-bo-text-soft">{T.anfrageAkte.termine} · {termine.length}</p>
                  {termine.length === 0 ? <p className="text-[14px] text-bo-text-faint">Noch kein Termin.</p> : termine.slice(0, 4).map((t) => (
                    <a key={t.name} href={`/crm/termine/${encodeURIComponent(t.name)}`} className="flex items-center justify-between gap-3 rounded-[16px] px-2 py-1.5 hover:bg-bo-surface-2">
                      <span className="text-[14px] tabular-nums">{terminZeit(t.start)} · {T.modus[t.modus]}</span>
                      <CrmStatus objekt="termin" doc={t} groesse="sm" />
                    </a>
                  ))}
                </div>
                <div className="grid gap-2">
                  <p className="text-[13px] font-medium text-bo-text-soft">{T.anfrageAkte.aufgaben} · {aufgaben.filter((k) => ["Offen", "In Arbeit"].includes(k.status)).length} offen</p>
                  {aufgaben.slice(0, 4).map((k) => (
                    <p key={k.name} className="flex items-center justify-between gap-2 px-2 text-[14px]"><span className="min-w-0 truncate">{k.titel}</span><span className="text-[13px] text-bo-text-soft tabular-nums">{datum(k.faellig)}</span></p>
                  ))}
                </div>
                {angebote.length > 0 && (
                  <div className="grid gap-2">
                    <p className="text-[13px] font-medium text-bo-text-soft">{T.anfrageAkte.angebote}</p>
                    {angebote.filter((x) => x.status !== "Ersetzt").map((x) => <a key={x.name} href={`/d/ph-angebot/${encodeURIComponent(x.name)}`} className="px-2 text-[14px] hover:underline">{x.name} · {x.status}</a>)}
                  </div>
                )}
              </div>
            }
            kachel={{ details: { titel: T.anfrageAkte.details }, bezuege: { titel: T.anfrageAkte.bezuege } }}
          />
        }
      >
        {tab === "uebersicht" && (
          <div className="grid gap-6">
            <Kachel titel={T.anfrageAkte.anliegen} unter={[T.art[a.art], a.objektart, a.wunschzeiten ? `Wunsch: ${a.wunschzeiten}` : ""].filter(Boolean).join(" · ")}>
              <blockquote className="border-l-2 border-bo-line-strong pl-4 text-[17px] leading-[26px]" data-testid="crm-anliegen">{String(a.anliegen || "").replace(/<[^>]*>/g, "") || "–"}</blockquote>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <KontaktKnoepfe email={a.email} telefon={a.telefon} wer={person} />
                <span className="text-[14px] text-bo-text-soft">{[a.email, a.telefon].filter(Boolean).join(" · ")}</span>
              </div>
            </Kachel>
            <Kachel titel="Person" unter={kontakt ? "Kontaktdaten stehen in der Kundenakte" : "Noch ohne Kundenakte"}>
              <dl className="bo-crm-fakten">
                <div><dt>Name</dt><dd>{[a.anrede, a.vorname, a.nachname].filter(Boolean).join(" ") || "–"}</dd></div>
                <div><dt>Firma</dt><dd>{a.firma || "–"}</dd></div>
                <div><dt>{T.dialog.email}</dt><dd>{a.email || "–"}</dd></div>
                <div><dt>{T.dialog.telefon}</dt><dd>{a.telefon || "–"}</dd></div>
                <div><dt>{T.dialog.plzOrt}</dt><dd>{a.plz_ort || "–"}</dd></div>
                <div><dt>Sprache</dt><dd>{String(a.sprache || "de").toUpperCase()}</dd></div>
              </dl>
              {kontakt && <div className="mt-4"><Knopf size="s" variant="secondary" href={`/kunden/${encodeURIComponent(kontakt.name)}`} iconRechts="ArrowUpRight">In Kundenakte ändern</Knopf></div>}
            </Kachel>
          </div>
        )}
        {tab === "anliegen" && (
          <Kachel titel={T.anfrageAkte.tabs.anliegen}>
            <p className="whitespace-pre-line text-[15px] leading-[24px]">{String(a.anliegen || "").replace(/<[^>]*>/g, "")}</p>
            {a.upload_note && <p className="mt-4 text-[14px] text-bo-text-soft">{a.upload_note}</p>}
            <div className="mt-5">
              {(d.docinfo?.attachments || []).length === 0 ? <Leer groesse="karte" text={T.anfrageAkte.uploadsLeer} /> : (
                <ul className="grid gap-2">{d.docinfo.attachments.map((f) => <li key={f.name} className="rounded-[14px] bg-bo-surface-2 px-4 py-3 text-[14px]">{f.file_name}</li>)}</ul>
              )}
            </div>
          </Kachel>
        )}
        {tab === "produkte" && (
          <Kachel titel={T.anfrageAkte.tabs.produkte} unter="Aus der Merkliste der Website">
            {(a.produkte || []).length === 0 ? <Leer groesse="karte" text={T.anfrageAkte.produkteLeer} /> : (
              <ul className="grid gap-2">
                {a.produkte.map((p, i) => (
                  <li key={p.name || i} className="flex items-center justify-between gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-3">
                    <span className="min-w-0"><span className="block font-semibold">{p.titel || p.slug}</span><span className="block text-[13px] text-bo-text-soft">{[p.marke, p.hinweis].filter(Boolean).join(" · ")}</span></span>
                    <span className="tabular-nums">{p.menge || 1} ×</span>
                  </li>
                ))}
              </ul>
            )}
          </Kachel>
        )}
        {tab === "herkunft" && (
          <Kachel titel={T.anfrageAkte.tabs.herkunft} unter={T.anfrageAkte.herkunftHinweis}>
            <dl className="bo-crm-fakten">
              <div><dt>Quelle</dt><dd>{T.quelle[a.quelle] || a.quelle || "–"}</dd></div>
              <div><dt>Kanal</dt><dd>{a.kanal || "–"}</dd></div>
              <div><dt>Website-Seite</dt><dd>{a.referenz_website || "–"}</dd></div>
              <div><dt>Kampagne</dt><dd>{[a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(" / ") || "–"}</dd></div>
              <div><dt>Einwilligungstext</dt><dd>{a.einwilligung_text_version || "–"}</dd></div>
              <div><dt>Einwilligung am</dt><dd>{a.einwilligung_zeitpunkt ? datum(a.einwilligung_zeitpunkt) : "–"}</dd></div>
            </dl>
          </Kachel>
        )}
        {tab === "aktivitaet" && (
          <Zeitleiste doctype="PH Anfrage" name={a.name} docinfo={d.docinfo} darfSchreiben feldLabels={{ status: "Status", zugewiesen_an: "Zuständig", workflow_state: "Status", kontakt: "Kunde", naechster_schritt: "Vereinbart" }} />
        )}
      </AkteGeruest>
    </Shell>
  );
}
