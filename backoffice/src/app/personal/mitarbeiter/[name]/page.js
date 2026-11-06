import { notFound } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Fehler from "@/components/Backoffice/Fehler";
import Avatar from "@/components/Backoffice/Avatar";
import Leer from "@/components/Backoffice/Leer";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import AkteTabs from "@/components/Backoffice/Akte/AkteTabs";
import Formular from "@/components/Backoffice/Formular/Formular";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { MonatsTabelle } from "@/components/Backoffice/Personal/Zeiten";
import { AustrittKnopf } from "@/components/Backoffice/Personal/Assistenten";
import { MitarbeiterAbwesenheitKnopf } from "@/components/Backoffice/Personal/MitarbeiterAktionen";
import { params, seitenStart, KRUMEN_BASIS, monatAus, monatSchluessel } from "@/lib/backoffice/personal/seite";
import { ladeMitarbeiter, ladeMonat, ladeAbwesenheiten, ladeFaehigkeiten, sicher } from "@/lib/backoffice/personal/daten";
import { ladeMeta, ladeKinderMeta } from "@/lib/backoffice/frappe";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { darfTeam, darfVertraulich, istLeitung, darfUhrzeitenSehen } from "@/lib/backoffice/personal/rollen";
import { statusText, statusTon, rolleInternText, ausmassText, artText } from "@/lib/backoffice/personal/status";
import { mitarbeiterSpeichernAction } from "@/lib/backoffice/personal/actions";
import { druckHref } from "@/lib/backoffice/druck/index";
import { T } from "@/lib/backoffice/personal/texte";
import { langDatum, monatName, zeitraumText } from "@/lib/backoffice/personal/zeit";
import "@/components/Backoffice/Personal/personal.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personalakte · Personal" };

// T5 Personalakte (Konzept § 5.9): Standard-Reiter Zeiten, Uhrzeiten nur Leitung/GF, Vertrauliches nur permlevel 1.
export default async function Personalakte({ params: p, searchParams }) {
  const { name: roh } = await p;
  const name = decodeURIComponent(roh);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/personal/mitarbeiter/${roh}`, sp, (r, c) => darfTeam(r) || c.eigener?.name === name);
  let d;
  try {
    d = await ladeMitarbeiter(ctx, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return <PersonalHuelle ctx={ctx}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} zurueckHref="/personal/team?ansicht=personen" /></PersonalHuelle>;
  }
  const m = d.mitarbeiter;
  const leitung = istLeitung(ctx.rolle);
  const vertraulich = darfVertraulich(ctx.rolle);
  const tabs = [
    { id: "zeiten", titel: T.akteMa.tabs.zeiten },
    { id: "stammdaten", titel: T.akteMa.tabs.stammdaten },
    { id: "abwesenheit", titel: T.akteMa.tabs.abwesenheit },
    ...(vertraulich ? [{ id: "vertraulich", titel: T.akteMa.tabs.vertraulich }, { id: "dokumente", titel: T.akteMa.tabs.dokumente, anzahl: (m.dokumente || []).length }] : []),
    { id: "verlauf", titel: T.akteMa.tabs.verlauf },
  ];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "zeiten";
  const basis = `/personal/mitarbeiter/${encodeURIComponent(name)}`;
  const f = await ladeFaehigkeiten(ctx);
  const { jahr, monat } = monatAus(sp, ctx.heute);
  let inhalt;
  if (tab === "zeiten") {
    if (!darfUhrzeitenSehen(ctx.rolle) && ctx.eigener?.name !== name) {
      inhalt = <Leer art="recht" titel="Uhrzeiten sehen Leitung und Geschäftsführung" text="Ist-Stunden je Woche stehen im Team-Kalender." />;
    } else {
      const r = await sicher(() => ladeMonat(ctx, name, jahr, monat, { mitKonto: f.konten.an && vertraulich, wochenstunden: m.wochenstunden }));
      inhalt = (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <RundKnopf icon="ChevronLeft" label={T.zeiten.vorMonat} groesse="s" href={`${basis}?monat=${monatSchluessel(jahr, monat, -1)}`} />
            <span className="min-w-32 text-center text-[15px] font-semibold">{`${monatName(monat)} ${jahr}`}</span>
            <RundKnopf icon="ChevronRight" label={T.zeiten.naechsterMonat} groesse="s" href={`${basis}?monat=${monatSchluessel(jahr, monat, 1)}`} />
          </div>
          {r.ok ? <MonatsTabelle monat={r.daten} heute={ctx.heute} modus={leitung ? "leitung" : "lesen"} konto={f.konten.an && vertraulich} korrektur={false} monatName={monatName(monat)} mitarbeiter={name} /> : <Fehler code={r.fehler.code} kompakt />}
        </div>
      );
    }
  } else if (tab === "stammdaten") {
    const metaRoh = await ladeMeta(ctx.client, "PH Mitarbeiter");
    const meta = { ...metaRoh, fields: metaRoh.fields.filter((x) => !x.permlevel && !["dokumente"].includes(x.fieldname)) };
    const kinderMeta = await ladeKinderMeta(ctx.client, meta);
    inhalt = (
      <div className="flex flex-col gap-4">
        <p className="bo-per-band-hinweis">{T.akteMa.wochenstundenHinweis}</p>
        <Formular meta={meta} kinderMeta={kinderMeta} doc={m} neu={false} nurLesen={!(leitung || ctx.rolle === "admin" || ctx.rolle === "sachbearbeitung")} listeHref="/personal/team?ansicht=personen" onSpeichern={mitarbeiterSpeichernAction} />
      </div>
    );
  } else if (tab === "abwesenheit") {
    const r = await sicher(() => ladeAbwesenheiten(ctx, { von: `${Number(ctx.heute.slice(0, 4)) - 1}-01-01`, bis: `${Number(ctx.heute.slice(0, 4)) + 1}-12-31`, mitarbeiter: name, status: ["Beantragt", "Genehmigt", "Abgelehnt", "Storniert"] }));
    inhalt = (
      <Kachel titel={T.akteMa.tabs.abwesenheit} werkzeuge={leitung ? <MitarbeiterAbwesenheitKnopf mitarbeiter={{ name, titel: m.titel }} heute={ctx.heute} /> : null}>
        {!r.ok ? <Fehler code={r.fehler.code} kompakt /> : r.daten.length === 0 ? <p className="text-[14px] text-bo-text-soft">{T.akteMa.abwesenheitLeer}</p> : (
          <ul className="bo-per-zeilen">
            {r.daten.sort((a, b) => String(b.von).localeCompare(String(a.von))).map((a) => (
              <li key={a.name} className="bo-per-zeile">
                <span className="bo-per-zeile__icon" data-ton={a.quelle === "krank" ? "stein" : "salbei"} aria-hidden="true" />
                <span><span className="bo-per-zeile__titel">{`${a.maskiert ? T.zeiten.abwesend : artText(a.art)} ${zeitraumText(a.von, a.bis)}`}</span>{a.ablehnungsgrund && <span className="bo-per-zeile__unter">{a.ablehnungsgrund}</span>}</span>
                <StatusBadge wert={a.status} text={statusText(a.quelle === "krank" ? "krank" : "abwesenheit", a.status)} ton={statusTon(a.quelle === "krank" ? "krank" : "abwesenheit", a.status)} groesse="m" />
              </li>
            ))}
          </ul>
        )}
      </Kachel>
    );
  } else if (tab === "vertraulich") {
    const felder = [["Geburtsdatum", m.geburtsdatum ? langDatum(m.geburtsdatum) : ""], ["Privatadresse", m.privatadresse], ["Telefon privat", m.telefon_privat], ["E-Mail privat", m.email_privat], ["Notfallkontakt", [m.notfallkontakt_name, m.notfallkontakt_beziehung, m.notfallkontakt_telefon].filter(Boolean).join(" · ")], ["Personalnummer Lohnverrechnung", m.lohnverrechnung_personalnummer], ["Hinweise", m.hinweise_vertraulich]].filter(([, v]) => v);
    inhalt = (
      <Kachel titel={T.akteMa.tabs.vertraulich} testid="per-vertraulich">
        <p className="bo-per-band-hinweis mb-4">{T.akteMa.vertraulichBand}</p>
        {felder.length ? <dl className="bo-per-fakten">{felder.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> : <p className="text-[14px] text-bo-text-soft">{T.akteMa.vertraulichLeer}</p>}
      </Kachel>
    );
  } else if (tab === "dokumente") {
    inhalt = <Kachel titel={T.akteMa.tabs.dokumente}>{(m.dokumente || []).length ? <ul className="bo-per-zeilen">{m.dokumente.map((x) => <li key={x.name} className="bo-per-zeile"><span className="bo-per-zeile__icon" aria-hidden="true" /><span className="bo-per-zeile__titel">{x.bezeichnung || x.art || x.name}</span><span /></li>)}</ul> : <p className="text-[14px] text-bo-text-soft">{T.akteMa.dokumenteLeer}</p>}</Kachel>;
  } else {
    inhalt = <Zeitleiste doctype="PH Mitarbeiter" name={name} docinfo={d.docinfo} darfSchreiben={leitung} feldLabels={{ status: "Status", austritt: "Austritt", wochenstunden: "Wochenstunden" }} />;
  }
  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={<span className="inline-flex items-center gap-4"><Avatar name={m.titel} groesse={56} />{m.titel}</span>}
        untertitel={`${rolleInternText(m.rolle_intern)} · ${ausmassText(m.beschaeftigungsart)} · ${T.akteMa.seit(langDatum(m.eintritt))} · ${m.user ? T.akteMa.benutzer : T.akteMa.ohneBenutzer}`}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.team.titel, href: "/personal/team?ansicht=personen" }, { titel: m.titel }]}
        titelZusatz={<StatusBadge wert={m.status} text={statusText("mitarbeiter", m.status)} ton={statusTon("mitarbeiter", m.status)} groesse="m" />}
        aktionen={
          <div className="flex flex-wrap items-center gap-2">
            {m.bewerbung && <Knopf variant="ghost" href={`/personal/bewerbungen/${encodeURIComponent(m.bewerbung)}`}>{T.akteMa.bewerbung}</Knopf>}
            {leitung && <Knopf variant="ghost" icon="Printer" href={`${druckHref("PH Mitarbeiter", name, "PH Mitarbeiter Zeitnachweis")}&monat=${jahr}-${String(monat).padStart(2, "0")}`}>{T.akteMa.zeitnachweis}</Knopf>}
            {leitung && m.status !== "Ausgetreten" && <AustrittKnopf mitarbeiter={{ name, titel: m.titel, eintritt: m.eintritt }} offeneBuchungen={d.offeneBuchungen} heute={ctx.heute} />}
            {leitung && <MitarbeiterAbwesenheitKnopf mitarbeiter={{ name, titel: m.titel }} heute={ctx.heute} primaer />}
          </div>
        }
      />
      {m.austritt && <p className="bo-per-band-hinweis mb-4" data-ton="eiche">{`Austritt ${langDatum(m.austritt)}`}</p>}
      <AkteTabs tabs={tabs} aktiv={tab} basis={basis} className="mb-6" />
      {inhalt}
    </PersonalHuelle>
  );
}
