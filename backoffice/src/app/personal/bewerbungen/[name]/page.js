import Link from "next/link";
import { notFound } from "next/navigation";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Fehler from "@/components/Backoffice/Fehler";
import Avatar from "@/components/Backoffice/Avatar";
import Leer from "@/components/Backoffice/Leer";
import AkteTabs from "@/components/Backoffice/Akte/AkteTabs";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { BewerberAktionen, DokumentAnsicht, Sichtungsleiste, BewertungTab, DatenschutzTab } from "@/components/Backoffice/Personal/Bewerberakte";
import { EinstellenAssistentStart } from "@/components/Backoffice/Personal/EinstellenStart";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeBewerbung, ladePersonen } from "@/lib/backoffice/personal/daten";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { darfBewerbungen, darfVertraulich, istLeitung } from "@/lib/backoffice/personal/rollen";
import { primaerBewerbung, loeschfristInfo, BOARD_SPALTEN } from "@/lib/backoffice/personal/regeln";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { T } from "@/lib/backoffice/personal/texte";
import { langDatum, kurzDatum, tagKurz, relativTage } from "@/lib/backoffice/personal/zeit";
import "@/components/Backoffice/Personal/personal.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: p }) {
  const { name } = await p;
  return { title: `${decodeURIComponent(name)} · Bewerbungen · Personal` };
}

function Phasen({ status }) {
  const ende = ["Abgesagt", "Zurueckgezogen"].includes(status);
  const idx = BOARD_SPALTEN.indexOf(status);
  return (
    <ol className="bo-per-phasen" aria-label="Phase">
      {BOARD_SPALTEN.map((s, i) => (
        <li key={s} className="contents">
          {i > 0 && <span className="bo-per-phase__linie" data-erreicht={i <= idx ? "" : undefined} data-offen={i > idx ? "" : undefined} aria-hidden="true" />}
          <span className="bo-per-phase" data-erreicht={i <= idx ? "" : undefined} aria-current={i === idx ? "step" : undefined}>
            <span className="bo-per-phase__punkt" aria-hidden="true" />
            {statusText("bewerbung", s)}
          </span>
        </li>
      ))}
      {ende && (
        <li className="contents">
          <span className="bo-per-phase__linie" aria-hidden="true" />
          <span className="bo-per-phase" aria-current="step">
            <span className="bo-per-phase__punkt" aria-hidden="true" />
            {statusText("bewerbung", status)}
          </span>
        </li>
      )}
    </ol>
  );
}

// T5 Bewerberakte (Konzept § 5.6). ?modus=sichten → Sichtungsleiste; ?einstellen=1 → Assistent.
export default async function Bewerberakte({ params: p, searchParams }) {
  const { name: roh } = await p;
  const name = decodeURIComponent(roh);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/personal/bewerbungen/${roh}`, sp, darfBewerbungen);
  let d;
  try {
    d = await ladeBewerbung(ctx, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <PersonalHuelle ctx={ctx}>
        <Fehler code={istBackofficeError(err) ? err.code : "unavailable"} zurueckHref="/personal/bewerbungen" />
      </PersonalHuelle>
    );
  }
  const b = d.bewerbung;
  const personen = await ladePersonen(ctx).catch(() => []);
  const geloescht = Number(b.pseudonymisiert);
  const person = geloescht ? T.akte.geloescht(langDatum(String(b.unterlagen_geloescht_am).slice(0, 10))) : `${b.vorname || ""} ${b.nachname || ""}`.trim();
  const jetzt = `${ctx.heute} ${String(ctx.jetzt.getHours()).padStart(2, "0")}:${String(ctx.jetzt.getMinutes()).padStart(2, "0")}`;
  const offenVorbei = d.gespraeche.find((g) => g.status === "Geplant" && String(g.start).slice(0, 16) < jetzt) || null;
  const primaer = primaerBewerbung(b, ctx.rolle, { gespraechVorbeiOffen: Boolean(offenVorbei), hatEmail: Boolean(b.email) });
  const frist = loeschfristInfo(b, ctx.heute);
  const vertraulich = darfVertraulich(ctx.rolle);
  const tabs = [
    { id: "uebersicht", titel: T.akte.tabs.uebersicht },
    { id: "unterlagen", titel: T.akte.tabs.unterlagen, anzahl: (b.unterlagen || []).length },
    { id: "gespraeche", titel: T.akte.tabs.gespraeche, anzahl: d.gespraeche.length },
    ...(vertraulich ? [{ id: "bewertung", titel: T.akte.tabs.bewertung }] : []),
    { id: "datenschutz", titel: T.akte.tabs.datenschutz },
    { id: "verlauf", titel: T.akte.tabs.verlauf },
  ];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "uebersicht";
  const sichten = sp.modus === "sichten";
  const basis = `/personal/bewerbungen/${encodeURIComponent(name)}`;

  const personKachel = (
    <Kachel titel={T.akte.person} testid="per-akte-person">
      <dl className="bo-per-fakten">
        <div><dt>E-Mail</dt><dd>{b.email || "–"}</dd></div>
        <div><dt>Telefon</dt><dd>{b.telefon || "–"}</dd></div>
        <div><dt>Ort</dt><dd>{b.plz_ort || "–"}</dd></div>
        <div><dt>Verfügbar ab</dt><dd>{b.verfuegbar_ab ? langDatum(b.verfuegbar_ab) : "–"}</dd></div>
        <div><dt>Quelle</dt><dd>{b.quelle}</dd></div>
        <div><dt>Eingang</dt><dd>{`${langDatum(String(b.eingang).slice(0, 10))} ${String(b.eingang).slice(11, 16)}`}</dd></div>
      </dl>
      {b.anschreiben && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[13px] font-medium text-bo-text-soft">{T.akte.anschreiben}</summary>
          <div className="bo-per-vorschau mt-2" dangerouslySetInnerHTML={{ __html: String(b.anschreiben).replace(/<(?!\/?p>|br\s*\/?>)[^>]*>/g, "") }} />
        </details>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3" data-testid="per-akte-frist">
        <span className="text-[13px] text-bo-text-soft">{T.akte.loeschfrist}</span>
        <span className={`text-[14px] font-medium ${frist.warnung ? "text-bo-eiche-text" : ""}`}>{frist.datum ? `${langDatum(frist.datum)} · ${T.akte.restTage(frist.rest)}` : T.akte.loeschfristOffen}</span>
      </div>
    </Kachel>
  );

  let inhalt;
  if (geloescht) {
    inhalt = <Leer art="leer" titel={T.akte.geloescht(langDatum(String(b.unterlagen_geloescht_am).slice(0, 10)))} text="Nummer, Stelle, Status und Verlauf bleiben für die Statistik erhalten." icon="Shield" />;
  } else if (tab === "uebersicht") {
    inhalt = (
      <div className="bo-per-akte">
        <Kachel testid="per-akte-dokument">
          <DokumentAnsicht unterlagen={b.unterlagen || []} person={person} mock={ctx.client.modus !== "frappe"} />
        </Kachel>
        <div className="flex min-w-0 flex-col gap-6">{personKachel}</div>
      </div>
    );
  } else if (tab === "unterlagen") {
    inhalt = (
      <Kachel titel={T.akte.tabs.unterlagen}>
        {(b.unterlagen || []).length === 0 ? (
          <p className="text-[14px] text-bo-text-soft">{T.akte.keineUnterlagen}</p>
        ) : (
          <ul className="bo-per-zeilen">
            {b.unterlagen.map((u) => (
              <li key={u.name} className="bo-per-zeile">
                <span className="bo-per-zeile__icon" aria-hidden="true" />
                <span><span className="bo-per-zeile__titel">{u.bezeichnung || u.art}</span><span className="bo-per-zeile__unter">{`${u.art} · ${u.groesse_kb || "–"} kB · ${kurzDatum(String(u.hochgeladen_am).slice(0, 10))}`}</span></span>
                <a className="bo-per-link text-[13px]" href={`/api/datei?url=${encodeURIComponent(u.datei)}`} target="_blank" rel="noreferrer">{T.akte.neuerTab}</a>
              </li>
            ))}
          </ul>
        )}
      </Kachel>
    );
  } else if (tab === "gespraeche") {
    inhalt = (
      <Kachel titel={T.akte.tabs.gespraeche}>
        {d.gespraeche.length === 0 ? (
          <p className="text-[14px] text-bo-text-soft">{T.akte.keineGespraeche}</p>
        ) : (
          <ul className="bo-per-zeilen">
            {d.gespraeche.map((g) => (
              <li key={g.name} className="bo-per-zeile">
                <Avatar name={g.verantwortlichName} groesse={36} />
                <span><Link href={`/personal/gespraeche?panel=${encodeURIComponent(g.name)}&datum=${String(g.start).slice(0, 10)}`} className="bo-per-zeile__titel bo-per-link">{`${tagKurz(String(g.start).slice(0, 10))} ${kurzDatum(String(g.start).slice(0, 10))} ${String(g.start).slice(11, 16)} · ${g.modus}`}</Link><span className="bo-per-zeile__unter">{[g.verantwortlichName, g.ergebnis, g.naechster_schritt].filter(Boolean).join(" · ")}</span></span>
                <StatusBadge wert={g.status} text={statusText("gespraech", g.status)} ton={statusTon("gespraech", g.status)} groesse="m" />
              </li>
            ))}
          </ul>
        )}
      </Kachel>
    );
  } else if (tab === "bewertung") {
    inhalt = <Kachel titel={T.akte.tabs.bewertung}><BewertungTab b={b} darf={istLeitung(ctx.rolle)} /></Kachel>;
  } else if (tab === "datenschutz") {
    inhalt = <Kachel titel={T.akte.tabs.datenschutz}><DatenschutzTab b={b} frist={frist} monate={d.einst.loeschfrist_monate} leitung={istLeitung(ctx.rolle)} heute={ctx.heute} /></Kachel>;
  } else {
    inhalt = <Zeitleiste doctype="PH Bewerbung" name={b.name} docinfo={d.docinfo} darfSchreiben={!geloescht} feldLabels={{ status: "Status", zugewiesen_an: "Zuständig", absage_grund: "Absagegrund" }} />;
  }

  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={<span className="inline-flex items-center gap-4"><Avatar name={person} groesse={48} />{person}</span>}
        untertitel={`${b.stelle_titel || T.bewerbung.kennzeichen.initiativ} · ${b.quelle} · eingegangen ${relativTage(b.eingang, ctx.heute)}${d.zustaendigName ? ` · zuständig ${d.zustaendigName}` : ""}`}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.bewerbung.titel, href: "/personal/bewerbungen" }, { titel: person }]}
        titelZusatz={<StatusBadge wert={b.status} text={statusText("bewerbung", b.status)} ton={statusTon("bewerbung", b.status)} groesse="m" />}
        aktionen={geloescht ? null : <BewerberAktionen b={b} rolle={ctx.rolle} primaer={primaer} personen={personen} heute={ctx.heute} gespraechOffen={offenVorbei} absageText={d.einst.absage_text} />}
        unternav={<Phasen status={b.status} />}
      />
      <AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={sichten ? { modus: "sichten" } : {}} className="mb-6" />
      {inhalt}
      {sichten && !geloescht && <Sichtungsleiste b={b} folge={d.sichtung} rolle={ctx.rolle} />}
      {istLeitung(ctx.rolle) && ["Gespraech", "Angebot"].includes(b.status) && <EinstellenAssistentStart bewerbung={{ name: b.name, vorname: b.vorname, nachname: b.nachname, verfuegbar_ab: b.verfuegbar_ab, stelle: b.stelle, stelle_titel: b.stelle_titel }} uebrige={d.offeneDerStelle.length} offen={sp.einstellen === "1"} />}
    </PersonalHuelle>
  );
}
