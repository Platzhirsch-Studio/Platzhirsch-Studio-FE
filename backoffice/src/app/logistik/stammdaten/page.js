import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Unternav from "@/components/Backoffice/Unternav";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { Chip, Fakten, Zeile, datumLang } from "@/components/Backoffice/Logistik/ui";
import { einstellungen, heute as tagHeute, testmodus } from "@/lib/backoffice/logistik/daten";
import { druckHref } from "@/lib/backoffice/druck";
import { cent } from "@/lib/backoffice/format";
import { STAMMDATEN as T } from "@/lib/backoffice/logistik/texte";
import { seite, werte } from "../_teile";

export const metadata = { title: "Stammdaten Logistik" };
export const dynamic = "force-dynamic";

const TABS = ["lagerorte", "fahrzeuge", "paketprofile", "packplaetze", "einstellungen"];

// Stammdaten (§ 4.14): Lagerorte (Plätze, Platzetiketten), Fahrzeuge (Service ≤ 14 Tage markiert), Paketprofile
// (Chip „Schätzung“, Banner), Packplätze (JTL-Profil je Gerät), Einstellungen (Leitung; keine Schlüssel in der UI).
// Bearbeiten über die generischen Formulare (Fundament), bis eigene Dialoge folgen.
export default async function Stammdaten({ searchParams }) {
  const params = werte(await searchParams);
  const { session, client, leitung } = await seite("/logistik/stammdaten");
  const tab = TABS.includes(params.tab) ? params.tab : "lagerorte";
  const eintraege = TABS.filter((t) => t !== "einstellungen" || leitung).map((t) => ({ titel: T.tabs[t], href: `/logistik/stammdaten?tab=${t}` }));
  const in14 = new Date(new Date(`${tagHeute(client)}T00:00:00Z`).getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
  let inhalt = null;
  if (tab === "lagerorte") {
    const orte = await Promise.all((await client.getList("PH Lagerort", { fields: ["name"], limit: 100 })).map((l) => client.getDoc("PH Lagerort", l.name)));
    inhalt = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {orte.map((o) => (
          <Kachel key={o.name} titel={o.name} unter={`${o.art}${Number(o.standard) ? " · Standard" : ""}${Number(o.aktiv) ? "" : " · inaktiv"}`} werkzeuge={(o.plaetze || []).length ? <Knopf size="s" icon="Tag" href={druckHref("PH Lagerort", o.name, "PH Lagerort Platz-Etikett")}>Platzetiketten</Knopf> : null} testid="lagerort">
            <p className="bo-log-cap mb-3">{[o.strasse, o.plz, o.ort].filter(Boolean).join(" ") || (o.fahrzeug ? `Fahrzeug ${o.fahrzeug}` : "–")}</p>
            <div className="flex flex-wrap gap-1.5">{(o.plaetze || []).map((p) => <Chip key={p.platz}>{p.platz}</Chip>)}</div>
            {o.art === "Fahrzeug" ? <p className="bo-log-cap mt-3">Fahrzeug-Lagerorte entstehen mit dem Fahrzeug und sind hier nur lesbar.</p> : null}
          </Kachel>
        ))}
      </div>
    );
  } else if (tab === "fahrzeuge") {
    const fz = await client.getList("PH Fahrzeug", { fields: ["*"], limit: 50 });
    inhalt = <Kachel titel={T.tabs.fahrzeuge}><div className="bo-log-zeilen">{fz.map((f) => <Zeile key={f.name} href={`/d/ph-fahrzeug/${encodeURIComponent(f.name)}?generisch=1`} titel={`${f.bezeichnung} · ${f.name}`} unter={`${f.art} · ${f.zuladung_kg} kg · ${f.ladevolumen_m3} m³`} rechts={f.naechster_service ? <Chip ton={f.naechster_service <= in14 ? "eiche" : undefined}>Service {datumLang(f.naechster_service)}</Chip> : null} />)}</div></Kachel>;
  } else if (tab === "paketprofile") {
    const pp = await client.getList("PH Paketprofil", { fields: ["*"], limit: 100 });
    const schaetzung = pp.filter((p) => !Number(p.geprueft)).length;
    inhalt = (
      <div className="flex flex-col gap-6">
        {schaetzung ? <p className="bo-log-hinweis" data-ton="eiche" data-testid="schaetzung-banner">{T.schaetzungBanner(schaetzung)}</p> : null}
        <Kachel titel={T.tabs.paketprofile}><div className="bo-log-zeilen">{pp.map((p) => <Zeile key={p.name} href={`/d/ph-paketprofil/${encodeURIComponent(p.name)}?generisch=1`} titel={p.bezeichnung} unter={`${p.laenge_cm} × ${p.breite_cm} × ${p.hoehe_cm} cm · Tara ${p.tara_g} g${p.gefahrgut_un ? ` · ${p.gefahrgut_un}` : ""}`} rechts={<>{!Number(p.geprueft) ? <Chip ton="eiche">{T.schaetzung}</Chip> : <Chip ton="salbei">gemessen</Chip>}{Number(p.versand_gesperrt) ? <Chip ton="ziegel">Versand gesperrt</Chip> : null}</>} />)}</div></Kachel>
      </div>
    );
  } else if (tab === "packplaetze") {
    const pl = await client.getList("PH Packplatz", { fields: ["*"], limit: 20 }).catch(() => []);
    inhalt = <Kachel titel={T.tabs.packplaetze}><div className="bo-log-zeilen">{pl.map((p) => <Zeile key={p.name} href={`/d/ph-packplatz/${encodeURIComponent(p.name)}?generisch=1`} titel={p.bezeichnung} unter={`${p.lagerort || "–"} · Gewicht ${Number(p.gewicht_pflicht) ? "Pflicht" : "optional"} · Toleranz ${p.gewicht_toleranz_promille} ‰ / ${p.gewicht_toleranz_min_g} g`} rechts={<>{Number(p.ton_fehler) ? <Chip ton="salbei">Ton</Chip> : null}{Number(p.mengen_bestaetigen) ? <Chip>Mengen bestätigen</Chip> : null}</>} />)}</div></Kachel>;
  } else if (leitung) {
    const e = await einstellungen(client);
    inhalt = (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Kachel titel="Versanddienst" werkzeuge={<Knopf size="s" icon="Pencil" href="/d/ph-logistik-einstellungen?generisch=1">Bearbeiten</Knopf>}>
          <Fakten eintraege={[{ label: "Testmodus", wert: testmodus(e) ? "an – Etiketten sind Muster" : "aus – kostenpflichtig" }, { label: "Umgebung", wert: e.letmeship_env }, { label: "Zugangsdaten", wert: Number(e.letmeship_konfiguriert) ? "hinterlegt" : "nicht hinterlegt" }, { label: "Dienstwahl", wert: e.dienst_wahl }, { label: "Versicherung ab", wert: cent(e.versicherung_ab_cent) }, { label: "Tracking-Intervall", wert: e.tracking_intervall_stunden ? `${e.tracking_intervall_stunden} h` : "–" }]} />
          <p className="bo-log-cap mt-4">{T.keineSchluessel}</p>
        </Kachel>
        <Kachel titel="Lager, Touren, Inventur">
          <Fakten eintraege={[{ label: "Standard-Lagerort", wert: e.standard_lagerort }, { label: "Packtisch-Lagerort", wert: e.packtisch_lagerort }, { label: "Reservierung (Tage)", wert: e.reservierung_tage_standard }, { label: "Abholcode Pflicht", wert: Number(e.abholcode_pflicht) ? "ja" : "nein" }, { label: "Fahrzeit Standard", wert: e.fahrt_min_standard ? `${e.fahrt_min_standard} min` : "–" }, { label: "Vier-Augen Inventur", wert: Number(e.inventur_vier_augen) ? "an" : "aus" }, { label: "Teilinventur", wert: Number(e.teilinventur_aktiv) ? "aktiv" : "aus" }, { label: "Bewertung", wert: e.bewertung_methode }]} />
        </Kachel>
      </div>
    );
  }
  return (
    <Shell session={session}>
      <Seitenkopf titel={T.titel} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.titel }]} unternav={<Unternav eintraege={eintraege} aktiv={`/logistik/stammdaten?tab=${tab}`} label="Stammdaten" />} />
      {inhalt}
    </Shell>
  );
}
