import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { Balken, Donut } from "@/components/Backoffice/Charts";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, istLeitung, ladeKalkulation, ladeMaengel, ladeMappe, ladeMontagen, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { LAUFEND } from "@/lib/backoffice/projekte/status";
import { datumKurz, euroRund, prozentText, terminText } from "@/lib/backoffice/projekte/anzeige";
import { kwText } from "@/lib/backoffice/projekte/mappe";
import { hmm } from "@/lib/backoffice/projekte/zeit";
import { PHASEN, TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
const B = TEXTE.berichte;
const REPORTS = ["uebersicht", "projektstatus", "offene-maengel", "montagekapazitaet", "zeiten", "liefertermine", "nachkalkulation"];

export async function generateMetadata({ params }) {
  const { report } = await params;
  return { title: `${B[report] || B.titel} · Berichte · Projekte` };
}

/** Berichte (T8, § 5.19): Übersicht mit Diagrammen; Tabellen je Report; Nachkalkulation und Zeiten je Person nur Leitung. */
export default async function Bericht({ params }) {
  const { report } = await params;
  if (!REPORTS.includes(report)) notFound();
  const session = await requireRecht("projekte", "report", `/projekte/berichte/${report}`);
  const client = projekteClient(session);
  const heute = heuteIso();
  const leitung = istLeitung(session);
  const projekte = await client.getList("PH Projekt", { fields: ["name", "titel", "status", "projektart", "kunde_name", "liefertermin_geplant", "berater"], limit: 500 }).catch(() => []);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const optionen = REPORTS.filter((r) => r !== "nachkalkulation" || leitung).map((r) => ({ wert: r, titel: B[r], href: `/projekte/berichte/${r}` }));

  let inhalt = null;
  if (report === "uebersicht") {
    const [montagen, feedback] = await Promise.all([ladeMontagen(client, {}), client.getList("PH Rendering Feedback", { fields: ["erstellt_am", "von"], filters: [["von", "=", "kunde"]], limit: 1000 }).catch(() => [])]);
    const wochen = [];
    const d = new Date(`${heute}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * 7);
    for (let i = 0; i < 10; i++) {
      const v = new Date(d);
      v.setDate(d.getDate() + i * 7);
      const b = new Date(v);
      b.setDate(v.getDate() + 6);
      wochen.push([v.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]);
    }
    const inWoche = (x, [a, b]) => String(x || "").slice(0, 10) >= a && String(x || "").slice(0, 10) <= b;
    const arten = [...new Set(projekte.map((p) => p.projektart))];
    inhalt = (
      <Bento>
        <div className="md:col-span-7"><Balken titel={B.jePhase} untertitel="Anzahl je Phase, alle Projekte" punkte={[...PHASEN, "Abgebrochen"].map((s) => ({ label: statusText("PH Projekt", s), wert: projekte.filter((p) => p.status === s).length }))} hoehe={200} einblenden /></div>
        <div className="md:col-span-5"><Donut titel={B.jeArt} untertitel="laufende Projekte" teile={arten.map((a) => ({ label: statusText("PH Projekt", a), wert: projekte.filter((p) => p.projektart === a && LAUFEND.includes(p.status)).length })).filter((t) => t.wert)} einblenden /></div>
        <div className="md:col-span-6"><Balken titel={B.montagenJeWoche} untertitel="zehn Wochen, laufende Woche hervorgehoben" punkte={wochen.map((w) => ({ label: kwText(w[0]), wert: montagen.filter((m) => m.status !== "Abgebrochen" && inWoche(m.start, w)).length }))} hervorheben={7} laufend={null} hoehe={180} einblenden /></div>
        <div className="md:col-span-6"><Balken titel={B.rueckJeWoche} untertitel="Einträge von Kunden" punkte={wochen.map((w) => ({ label: kwText(w[0]), wert: feedback.filter((f) => inWoche(f.erstellt_am, w)).length }))} hervorheben={7} hoehe={180} einblenden /></div>
      </Bento>
    );
  } else if (report === "projektstatus") {
    inhalt = <Tabelle titel={B.projektstatus} unter={`${projekte.length} Projekte`} spalten={[{ titel: "Projekt" }, { titel: "Art" }, { titel: "Liefertermin", rechts: true }, { titel: "Phase" }]} zeilen={projekte.map((p) => ({ key: p.name, href: `/projekte/${encodeURIComponent(p.name)}`, titel: p.titel, unter: `${p.kunde_name} · ${p.name}`, zellen: [statusText("PH Projekt", p.projektart), p.liefertermin_geplant ? datumKurz(p.liefertermin_geplant, { jahr: true }) : "–", <ProjektStatus key="s" wert={p.status} />] }))} leer={<Leer groesse="karte" titel={B.leer} />} />;
  } else if (report === "offene-maengel") {
    const m = await ladeMaengel(client, { heute });
    inhalt = <Tabelle titel={B["offene-maengel"]} unter={`${m.length} offen`} spalten={[{ titel: "Mangel" }, { titel: "Quelle" }, { titel: "Frist", rechts: true }]} zeilen={m.map((x) => ({ key: x.id, titel: x.beschreibung, unter: pj[x.projekt]?.titel, zellen: [TEXTE.maengel.quelle[x.quelle], x.ueberfaellig ? TEXTE.maengel.ueberfaellig(x.ueberfaellig) : x.frist ? datumKurz(x.frist) : "–"] }))} leer={<Leer art="erledigt" groesse="karte" titel={TEXTE.maengel.leer} />} />;
  } else if (report === "montagekapazitaet") {
    const montagen = await ladeMontagen(client, {});
    const wochen = [];
    const d = new Date(`${heute}T12:00:00`);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    for (let i = 0; i < 8; i++) {
      const v = new Date(d);
      v.setDate(d.getDate() + i * 7);
      wochen.push(v.toISOString().slice(0, 10));
    }
    const std = (w) => montagen.filter((m) => m.status !== "Abgebrochen" && String(m.start).slice(0, 10) >= w && String(m.start).slice(0, 10) < new Date(new Date(`${w}T12:00:00`).getTime() + 7 * 86400000).toISOString().slice(0, 10)).reduce((s, m) => s + Number(m.stunden_geplant || 0) * Math.max(1, (m.team || []).length), 0);
    inhalt = <Balken titel={B.montagekapazitaet} untertitel="geplante Personenstunden je Woche · Kapazität 2 Monteure × 5 Tage × Tagesstunden (Einstellungen)" punkte={wochen.map((w) => ({ label: kwText(w), wert: std(w) }))} format="dezimal" hervorheben={0} hoehe={220} einblenden />;
  } else if (report === "zeiten") {
    const zeiten = await client.getList("PH Projektzeit", { fields: ["projekt", "user", "dauer_min", "taetigkeit"], limit: 2000 }).catch(() => []);
    const jeProjekt = Object.entries(zeiten.reduce((a, z) => ((a[z.projekt] = (a[z.projekt] || 0) + Number(z.dauer_min || 0)), a), {})).sort((a, b) => b[1] - a[1]);
    const leute = leitung ? await personen(client, zeiten.map((z) => z.user)) : {};
    const jePerson = leitung ? Object.entries(zeiten.reduce((a, z) => ((a[z.user] = (a[z.user] || 0) + Number(z.dauer_min || 0)), a), {})) : [];
    inhalt = (
      <Bento>
        <Tabelle className={leitung ? "md:col-span-7" : "md:col-span-12"} titel="Zeiten je Projekt" spalten={[{ titel: "Projekt" }, { titel: "Dauer", rechts: true }]} zeilen={jeProjekt.map(([p, m]) => ({ key: p, href: `/projekte/${encodeURIComponent(p)}`, titel: pj[p]?.titel || p, zellen: [hmm(m)] }))} leer={<Leer groesse="karte" titel={TEXTE.zeiten.leer} />} />
        {leitung && <Tabelle className="md:col-span-5" titel="Zeiten je Person" unter="nur Leitung" spalten={[{ titel: "Person" }, { titel: "Dauer", rechts: true }]} zeilen={jePerson.map(([u, m]) => ({ key: u, titel: leute[u]?.name || u, zellen: [hmm(m)] }))} leer={<Leer groesse="karte" titel={TEXTE.zeiten.leer} />} />}
      </Bento>
    );
  } else if (report === "liefertermine") {
    const bis = new Date(`${heute}T12:00:00`);
    bis.setDate(bis.getDate() + 30);
    const l = projekte.filter((p) => p.liefertermin_geplant && p.liefertermin_geplant >= heute && p.liefertermin_geplant <= bis.toISOString().slice(0, 10)).sort((a, b) => a.liefertermin_geplant.localeCompare(b.liefertermin_geplant));
    inhalt = <Tabelle titel={B.liefertermine} unter="nächste 30 Tage" spalten={[{ titel: "Projekt" }, { titel: "Liefertermin", rechts: true }, { titel: "Phase" }]} zeilen={l.map((p) => ({ key: p.name, href: `/projekte/${encodeURIComponent(p.name)}`, titel: p.titel, unter: p.kunde_name, zellen: [`${terminText(p.liefertermin_geplant, heute, { mitZeit: false })} · ${kwText(p.liefertermin_geplant)}`, <ProjektStatus key="s" wert={p.status} />] }))} leer={<Leer groesse="karte" titel={B.leer} />} />;
  } else if (report === "nachkalkulation") {
    if (!leitung) notFound();
    const laufend = projekte.filter((p) => LAUFEND.includes(p.status) || p.status === "Abgeschlossen").filter((p) => PHASEN.indexOf(p.status) >= 3);
    const zeilen = [];
    for (const p of laufend) {
      try {
        const m = await ladeMappe(client, p.name, { leitung });
        const k = await ladeKalkulation(client, m, { heute });
        zeilen.push({ p, k: k.kopf });
      } catch {
        // Projekt ohne Kalkulation: Zeile entfällt
      }
    }
    const TON = { gruen: "gruen", gelb: "orange", rot: "rot", "": "grau" };
    inhalt = <Tabelle titel={B.nachkalkulation} unter="Projekte ab Auftrag · Stand heute" spalten={[{ titel: "Projekt" }, { titel: "Erlös", rechts: true }, { titel: "Prognose Kosten", rechts: true }, { titel: "DB laufend", rechts: true }, { titel: "Ampel" }]} zeilen={zeilen.map(({ p, k }) => ({ key: p.name, href: `/projekte/${encodeURIComponent(p.name)}?tab=belege&ansicht=kalkulation`, titel: p.titel, unter: statusText("PH Projekt", p.status), zellen: [euroRund(k.erloes_cent), euroRund(k.prognose_kosten_cent), prozentText(k.db_laufend_prozent), <StatusBadge key="a" wert={k.ampel || "ohne"} ton={TON[k.ampel || ""]} text={TEXTE.kalkulation.ampel[k.ampel || ""]} />] }))} leer={<Leer groesse="karte" titel={B.leer} />} />;
  }

  return (
    <Shell session={session}>
      <Seitenkopf titel={B[report]} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: B.titel }, { titel: B[report] }]} unternav={<Segment label="Bericht" groesse="s" aktiv={report} optionen={optionen} />} />
      {inhalt}
    </Shell>
  );
}
