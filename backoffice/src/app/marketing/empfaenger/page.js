// /marketing/empfaenger – Personen · Einwilligungen (10-konzept-marketing § 2.4, T2; ersetzt „Abos“ und „Einwilligungen“).
// Eine Zeile je Adresse (Abo + Einwilligungen + Kontakt), Filter in der URL, Massenaktionen mit Vorschau.
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { EinwilligungsListe, EmpfaengerDialoge, PersonenListe } from "@/components/Backoffice/Marketing/Empfaenger";
import { einwilligungenListe, interessenListe, marketingKontext, personenListe, SEITE } from "@/lib/backoffice/marketing/daten";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { EMPFAENGER, ERSTBESUCH, KANAL_TEXT, QUELLE_TEXT, SPRACHE_TEXT, STATUS_TEXT, ZWECKE, ZWECK_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Empfänger") };

export default async function EmpfaengerSeite({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/empfaenger", doctype: "PH Newsletter Abo" });
  const ansicht = params.ansicht === "einwilligungen" ? "einwilligungen" : "personen";
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const seite = Math.max(1, Number(params.seite) || 1);
  const interessen = await interessenListe(ctx.client);
  const dialog = ["anmeldung", "einwilligung"].includes(params.dialog) ? params.dialog : null;
  const link = (extra) => `/marketing/empfaenger?${new URLSearchParams({ ...(ansicht === "einwilligungen" ? { ansicht } : {}), ...extra })}`;

  let inhalt;
  if (ansicht === "personen") {
    const { zeilen, gesamt, zaehler } = await personenListe(ctx.client, { status, zweck: params.zweck, quelle: params.quelle, sprache: params.sprache, q: params.q, seite });
    const alleAnzahl = Object.values(zaehler).reduce((a, b) => a + b, 0);
    const seiten = Math.max(1, Math.ceil(gesamt / SEITE));
    inhalt = (
      <>
        <div className="bo-mar-werkzeuge">
          <StatusChips
            aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"}
            optionen={[{ wert: "alle", titel: "Alle", anzahl: alleAnzahl, href: link({}) }, ...CHIP_REIHE.abo.map((s) => ({ wert: s, titel: STATUS_TEXT.abo[s], anzahl: zaehler[s] || 0, href: link({ status: s }) }))]}
          />
          <FilterForm
            basis="/marketing/empfaenger"
            params={params}
            behalten={["status"]}
            suche={{ name: "q", platzhalter: "Name oder E-Mail" }}
            auswahl={[
              { name: "zweck", label: "Zweck", alle: "Alle Zwecke", optionen: ZWECKE.map((z) => ({ wert: z, titel: ZWECK_TEXT[z] })) },
              { name: "quelle", label: "Quelle", alle: "Alle Quellen", optionen: ["website", "showroom", "event", "shop", "backoffice", "import"].map((q) => ({ wert: q, titel: QUELLE_TEXT[q] })) },
              { name: "sprache", label: "Sprache", alle: "Alle Sprachen", optionen: Object.entries(SPRACHE_TEXT).map(([k, v]) => ({ wert: k, titel: v })) },
            ]}
            zuruecksetzen="/marketing/empfaenger"
          />
        </div>
        {alleAnzahl === 0 ? (
          <Leer titel="Noch keine Empfänger" text={EMPFAENGER.leer} testid="empfaenger-leer" />
        ) : zeilen.length === 0 ? (
          <Leer art="gefiltert" text={EMPFAENGER.gefiltert} zuruecksetzenHref="/marketing/empfaenger" testid="empfaenger-gefiltert" />
        ) : (
          <ListeKachel
            label={EMPFAENGER.personen}
            testid="personen-liste"
            fuss={
              <>
                <span className="tabular-nums">
                  {Math.min(gesamt, (seite - 1) * SEITE + 1)}–{Math.min(gesamt, seite * SEITE)} von {gesamt}
                </span>
                <span className="flex gap-2">
                  {seite > 1 && <Knopf size="s" href={link({ ...params, seite: String(seite - 1) })}>Zurück</Knopf>}
                  {seite < seiten && <Knopf size="s" href={link({ ...params, seite: String(seite + 1) })}>Weiter</Knopf>}
                </span>
              </>
            }
          >
            <PersonenListe zeilen={zeilen} darfSchreiben={ctx.team} leitung={ctx.leitung} faehig={ctx.an} loeschTage={Number(ctx.einst.unbestaetigt_loeschen_tage || 30)} />
          </ListeKachel>
        )}
      </>
    );
  } else {
    const { zeilen, zaehler, gesamt } = await einwilligungenListe(ctx.client, { status, zweck: params.zweck, kanal: params.kanal, q: params.q });
    inhalt = (
      <>
        <div className="bo-mar-werkzeuge">
          <StatusChips
            aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"}
            optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: link({}) }, ...CHIP_REIHE.einwilligung.map((s) => ({ wert: s, titel: STATUS_TEXT.einwilligung[s], anzahl: zaehler[s] || 0, href: link({ status: s }) }))]}
          />
          <FilterForm
            basis="/marketing/empfaenger"
            params={params}
            behalten={["status", "ansicht"]}
            suche={{ name: "q", platzhalter: "E-Mail" }}
            auswahl={[
              { name: "zweck", label: "Zweck", alle: "Alle Zwecke", optionen: ZWECKE.map((z) => ({ wert: z, titel: ZWECK_TEXT[z] })) },
              { name: "kanal", label: "Kanal", alle: "Alle Kanäle", optionen: Object.entries(KANAL_TEXT).map(([k, v]) => ({ wert: k, titel: v })) },
            ]}
            zuruecksetzen="/marketing/empfaenger?ansicht=einwilligungen"
          />
        </div>
        {gesamt === 0 ? (
          <Leer titel="Noch keine Einwilligungen" text={EMPFAENGER.leerEinwilligungen} />
        ) : zeilen.length === 0 ? (
          <Leer art="gefiltert" text={EMPFAENGER.gefiltertEinw} zuruecksetzenHref="/marketing/empfaenger?ansicht=einwilligungen" />
        ) : (
          <ListeKachel label={EMPFAENGER.einwilligungen} testid="einwilligungen-liste" kopf={<span className="tabular-nums">{zeilen.length} Einträge</span>}>
            <EinwilligungsListe zeilen={zeilen} darfSchreiben={ctx.team} />
          </ListeKachel>
        )}
      </>
    );
  }

  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.empfaenger, route: "/marketing/empfaenger" }}>
      <Seitenkopf
        titel={EMPFAENGER.titel}
        untertitel={EMPFAENGER.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: EMPFAENGER.titel }]}
        aktionen={ctx.team ? <EmpfaengerDialoge dialog={dialog} interessen={interessen} faehig={ctx.an} websiteUrl={ctx.einst.website_url} textversion={ctx.einst.einwilligung_textversion} /> : null}
        unternav={
          <StatusChips
            label="Ansicht"
            testid="ansicht"
            aktiv={ansicht}
            optionen={[
              { wert: "personen", titel: EMPFAENGER.personen, href: "/marketing/empfaenger" },
              { wert: "einwilligungen", titel: EMPFAENGER.einwilligungen, href: "/marketing/empfaenger?ansicht=einwilligungen" },
            ]}
          />
        }
      />
      {inhalt}
    </Rahmen>
  );
}
