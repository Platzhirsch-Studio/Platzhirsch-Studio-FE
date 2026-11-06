import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf, AkteTabs, Vorgangsleiste } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import Avatar from "@/components/Backoffice/Avatar";
import { Pille } from "@/components/Backoffice/StatusBadge";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import AbnahmeMitKunde from "@/components/Backoffice/Projekte/AbnahmeMitKunde";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, istLeitung, kontaktKurz, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz, terminText } from "@/lib/backoffice/projekte/anzeige";
import { istErledigt } from "@/lib/backoffice/projekte/maengel";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { TEXTE, fmtH, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Montageauftrag · Projekte" };
const MT = TEXTE.montage;
const STUFEN = ["Geplant", "Unterwegs", "In Arbeit", "Erledigt", "Abgenommen"];

/** Montageauftrag (T5, § 5.9): Status-Stufen, Übersicht, Leistungen, Fotos, Mängel, Bericht; Fertig → „Abnahme mit Kunde“. */
export default async function MontageAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(roh);
  const session = await requireRecht("projekte", "read", `/projekte/montagen/${roh}`);
  const client = projekteClient(session);
  const heute = heuteIso();
  let m;
  try {
    m = await client.getDoc("PH Montageauftrag", name);
  } catch {
    notFound();
  }
  const [p, transitions, abnahmen] = await Promise.all([
    client.getDoc("PH Projekt", m.projekt).catch(() => ({ name: m.projekt, titel: m.projekt })),
    client.getTransitions("PH Montageauftrag", name).catch(() => []),
    client.getList("PH Abnahme", { fields: ["name", "status"], filters: [["projekt", "=", m.projekt]], limit: 5 }).catch(() => []),
  ]);
  const kontakt = sp.ablauf === "abnahme" ? await kontaktKurz(client, p.name, p.kontakt) : null;
  const leute = await personen(client, [m.montageleiter, ...(m.team || []).map((t) => t.user), session.user]);
  const tabs = [
    { id: "uebersicht", titel: MT.tabs.uebersicht },
    { id: "leistungen", titel: MT.tabs.leistungen, anzahl: (m.leistungen || []).length || undefined },
    { id: "fotos", titel: MT.tabs.fotos, anzahl: (m.fotos || []).length || undefined },
    { id: "maengel", titel: MT.tabs.maengel, anzahl: (m.maengel || []).filter((x) => !istErledigt(x.status)).length || undefined },
    { id: "bericht", titel: MT.tabs.bericht },
  ];
  const tab = aktiverTab(tabs, sp.tab);
  const ablauf = sp.ablauf === "abnahme" && m.status === "Erledigt";
  const enc = encodeURIComponent;
  const i = STUFEN.indexOf(m.status);
  const schritte = STUFEN.map((s, k) => ({ id: s, titel: statusText("PH Montageauftrag", s), zustand: m.status === "Abgebrochen" ? "uebersprungen" : k < i ? "erledigt" : k === i ? (s === "Abgenommen" ? "erledigt" : "aktuell") : "offen" }));
  const vorwaerts = transitions.filter((t) => ["Losfahren", "Beginnen", "Erledigt melden"].includes(t.action));
  let primaer = null;
  if (m.status === "Erledigt") primaer = abnahmen.length ? <Knopf variant="primary" href={`/projekte/abnahmen/${enc(abnahmen[0].name)}`}>{MT.protokollOeffnen}</Knopf> : <Knopf variant="primary" href={`/projekte/montagen/${enc(name)}?ablauf=abnahme`} data-testid="abnahme-starten">{MT.abnahmeMitKunde}</Knopf>;
  else if (m.status === "Abgenommen" && abnahmen.length) primaer = <Knopf variant="primary" href={`/projekte/abnahmen/${enc(abnahmen[0].name)}`}>{MT.protokollOeffnen}</Knopf>;
  else if (vorwaerts[0]) primaer = <AktionKnopf variant="primary" art="montage" args={{ name, aktion: vorwaerts[0].action }} commitText={`${TEXTE.kiosk.wort[vorwaerts[0].action] || vorwaerts[0].action} gemeldet`}>{TEXTE.kiosk.wort[vorwaerts[0].action] || vorwaerts[0].action}</AktionKnopf>;

  let inhalt;
  if (ablauf) {
    inhalt = (
      <Kachel titel={MT.abnahmeMitKunde} unter={`${p.titel} · ${p.kunde_name || ""}`} className="mx-auto w-full max-w-[720px]">
        <AbnahmeMitKunde montage={{ name, titel: m.titel }} leistungen={m.leistungen || []} positionen={(p.positionen || []).filter((x) => x.lieferstatus !== "storniert" && (!x.montage_art || x.montage_art === "Eigenmontage")).map((x) => ({ bezeichnung: x.bezeichnung }))} kunde={p.kunde_name} email={kontakt?.email || ""} studioName={leute[session.user]?.name || session.name} datum={datumKurz(heute, { jahr: true })} />
      </Kachel>
    );
  } else if (tab === "leistungen") {
    inhalt = (
      <Kachel titel={MT.tabs.leistungen} unter={`${(m.leistungen || []).filter((x) => Number(x.erledigt)).length} von ${(m.leistungen || []).length} erledigt`}>
        {(m.leistungen || []).length ? (
          <ul className="flex flex-col gap-2">
            {m.leistungen.map((x) => (
              <li key={x.name} className="flex items-center gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className={`bo-prj-titel block ${Number(x.erledigt) ? "text-bo-text-soft line-through" : ""}`}>{x.beschreibung}</span>
                  <span className="bo-prj-unter">{x.dauer_h_geplant ? `${fmtH(x.dauer_h_geplant)} h geplant` : ""}{x.dauer_h_ist ? ` · ${fmtH(x.dauer_h_ist)} h ist` : ""}</span>
                </span>
                <AktionKnopf size="s" variant={Number(x.erledigt) ? "ghost" : "secondary"} icon={Number(x.erledigt) ? "Undo2" : "Check"} art="leistung" args={{ montage: name, zeile: x.name, erledigt: !Number(x.erledigt) }} ok={MT.leistungErledigt}>
                  {Number(x.erledigt) ? "Wieder öffnen" : "Erledigt"}
                </AktionKnopf>
              </li>
            ))}
          </ul>
        ) : (
          <Leer groesse="karte" titel={MT.leistungenLeer} />
        )}
      </Kachel>
    );
  } else if (tab === "fotos") {
    inhalt = (
      <Kachel titel={MT.tabs.fotos}>
        {(m.fotos || []).length ? (
          <div className="bo-prj-fotos bo-prj-fotos--gross">
            {m.fotos.map((f) => (
              <figure key={f.name} className="flex flex-col gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- Montagefoto */}
                <img src={f.bild} alt={f.hinweis || f.art} />
                <figcaption className="text-[12px] text-bo-text-soft">{f.art} · {Number(f.kunde_sichtbar) ? TEXTE.mappe.kundeSieht : TEXTE.mappe.intern}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Leer groesse="karte" titel={MT.fotosLeer} />
        )}
      </Kachel>
    );
  } else if (tab === "maengel") {
    inhalt = (
      <Kachel titel={MT.tabs.maengel}>
        {(m.maengel || []).length ? (
          <ul className="bo-prj-liste">
            {m.maengel.map((x) => (
              <li key={x.name}>
                <span className="min-w-0 flex-1">
                  <span className={`bo-prj-titel block ${istErledigt(x.status) ? "text-bo-text-soft line-through" : ""}`}>{x.beschreibung}</span>
                  <span className="bo-prj-unter block">{[x.verantwortlich, x.frist ? `Frist ${datumKurz(x.frist)}` : "", istErledigt(x.status) ? "behoben" : ""].filter(Boolean).join(" · ")}</span>
                </span>
                {!istErledigt(x.status) && <AktionKnopf size="s" icon="Check" art="mangel" args={{ quelle: "montage", doc: name, zeile: x.name, aktion: "erledigt" }} ok={TEXTE.abnahme.mangelErledigt}>{TEXTE.maengel.erledigt}</AktionKnopf>}
              </li>
            ))}
          </ul>
        ) : (
          <Leer art="erledigt" groesse="karte" titel={MT.maengelLeer} />
        )}
      </Kachel>
    );
  } else if (tab === "bericht") {
    inhalt = (
      <Kachel titel={MT.tabs.bericht} unter={`Sprache ${m.sprache_bericht || "de"}`} werkzeuge={<Knopf size="s" icon="Printer" href={`/druck/ph-montageauftrag/${enc(name)}?format=${enc("PH Montagebericht")}`}>Montagebericht</Knopf>}>
        {m.bericht ? <p className="max-w-[80ch] text-[15px] leading-[22px]">{String(m.bericht).replace(/<[^>]+>/g, "")}</p> : <Leer groesse="karte" titel={MT.berichtLeer} />}
        <p className="mt-4 text-[13px] text-bo-text-soft">{MT.leistungsnachweis}: {m.unterschrift_kunde ? `unterschrieben${m.unterschrift_name ? ` von ${m.unterschrift_name}` : ""}${m.unterschrift_am ? ` am ${datumKurz(m.unterschrift_am, { jahr: true })}` : ""}` : "noch keine Unterschrift"}</p>
      </Kachel>
    );
  } else {
    inhalt = (
      <Bento>
        <Kachel className="md:col-span-7" titel={MT.termin}>
          <dl className="bo-prj-fakten">
            <div><dt>{MT.termin}</dt><dd>{terminText(m.start, heute)}{m.ende ? `–${String(m.ende).slice(11, 16)}` : ""}</dd></div>
            <div><dt>{MT.ist}</dt><dd>{m.tatsaechlich_start ? `${String(m.tatsaechlich_start).slice(11, 16)}${m.tatsaechlich_ende ? `–${String(m.tatsaechlich_ende).slice(11, 16)}` : " · läuft"}` : "–"}</dd></div>
            <div><dt>{MT.stunden}</dt><dd className="tabular-nums">{fmtH(m.stunden_geplant || 0)} / {fmtH(m.stunden_ist || 0)} h</dd></div>
            <div><dt>{MT.fahrzeug}</dt><dd>{m.fahrzeug || "–"}</dd></div>
            <div className="col-span-2"><dt>{MT.ort}</dt><dd>{[m.strasse, [m.plz, m.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}{m.hinweis_ort ? ` · „${m.hinweis_ort}“` : ""}</dd></div>
            <div><dt>{MT.vorOrt}</dt><dd>{m.kunde_anwesend || "–"}{m.telefon_vor_ort ? <> · <a className="underline" href={`tel:${m.telefon_vor_ort.replace(/\s/g, "")}`}>{m.telefon_vor_ort}</a></> : null}</dd></div>
          </dl>
        </Kachel>
        <Kachel className="md:col-span-5" titel={MT.team}>
          <ul className="bo-prj-liste">
            {(m.team || []).map((t) => (
              <li key={t.name}>
                <Avatar name={leute[t.user]?.name || t.user} groesse={36} />
                <span className="min-w-0 flex-1"><span className="bo-prj-titel block">{leute[t.user]?.name || t.user}</span><span className="bo-prj-unter">{t.rolle}</span></span>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 mb-2 text-[13px] font-medium text-bo-text-soft">{MT.unterlagen}</h3>
          {(m.unterlagen || []).length ? (
            <div className="flex flex-wrap gap-2">{m.unterlagen.map((u) => <Pille key={u.name} material="travertin" punkt={false} groesse="sm">{u.titel}</Pille>)}</div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{MT.unterlagenLeer}</p>
          )}
        </Kachel>
      </Bento>
    );
  }

  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: "/projekte/montagen", titel: "Montagen" }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: "Montagen", href: "/projekte/montagen" }, { titel: name }]}
          titel={`Montage ${terminText(m.start, heute, { mitZeit: false })} · ${p.titel}`}
          nummer={<><span>{name}</span><a className="underline underline-offset-2" href={`/projekte/${enc(p.name)}`}>{p.titel}</a></>}
          status={<ProjektStatus doctype="PH Montageauftrag" wert={m.status} groesse="m" />}
          aktionen={primaer}
        />
        {!ablauf && <Vorgangsleiste titel="Status" schritte={schritte} kompakt mitText testid="montage-stufen" />}
        {!ablauf && <AkteTabs tabs={tabs} aktiv={tab} basis={`/projekte/montagen/${enc(name)}`} params={{}} />}
        {inhalt}
        {istLeitung(session) && !ablauf && m.status === "Abgebrochen" && <p className="text-[13px] text-bo-text-soft">Abbruch: {m.abbruch_grund}</p>}
      </div>
    </Shell>
  );
}
