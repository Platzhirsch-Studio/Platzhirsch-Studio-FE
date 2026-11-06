import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc, istAdmin } from "@/lib/backoffice/auth/rechte";
import { backofficeMode } from "@/lib/backoffice/config";
import { DEMO_TEXTE, DEMOS_MIT_H1, demoFuer, demoListe } from "@/lib/backoffice/demo-register";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { NUMMERNMUSTER } from "@/lib/backoffice/suche/register";
import { beispielAusSerie } from "@/lib/backoffice/suche/muster";
import { doctypeLabel } from "@/lib/backoffice/labels";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import { firmaFehlt } from "@/lib/backoffice/zentrale/daten";
import { darfKalkulation, darfMicrosoftStatus, kalkulationLaden, microsoftStatus } from "@/lib/backoffice/zentrale/dienste";
import { EINSTELLUNGEN as T } from "@/lib/backoffice/zentrale/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Icon } from "@/components/Backoffice/icons";
import { EinstellungenFormular, KalkulationEditor, SchalterMitWirkung, Schliesstage, StandardFirmaKnopf } from "@/components/Backoffice/Zentrale/Einstellungen";
import "@/components/Backoffice/Zentrale/zentrale.css";

export const metadata = { title: "Einstellungen · Zentrale · Platzhirsch Backoffice" };
export const dynamic = "force-dynamic";

const REITER = ["firma", "allgemein", "website", "kalender", "kalkulation", "microsoft", "ablage", "system"];
const LAENDER = ["Vorarlberg", "Tirol", "Salzburg", "Oberösterreich", "Niederösterreich", "Wien", "Burgenland", "Steiermark", "Kärnten"];
const KRUMEN = [{ titel: "Zentrale", href: "/" }, { titel: "Verwaltung", href: "/verwaltung" }, { titel: T.titel }];

function fehlerDaten(err) {
  return { code: istBackofficeError(err) ? err.code : "unavailable", message: istBackofficeError(err) ? err.message : undefined };
}

async function versuch(fn) {
  try {
    return { daten: await fn() };
  } catch (err) {
    return { fehler: fehlerDaten(err) };
  }
}

// Baustein-Demos des Fundaments (MASTER § 4, demo-register.js): nur Admin, nur Mock – unverändert eingebunden.
async function DemoSeite({ session, demo }) {
  const Demo = (await demo.laden()).default;
  return (
    <Shell session={session} breit>
      <nav aria-label={DEMO_TEXTE.bausteine} className="mb-4">
        <Knopf variant="ghost" size="s" href="/einstellungen?tab=system" icon="ChevronLeft">{DEMO_TEXTE.zurueck}</Knopf>
      </nav>
      {DEMOS_MIT_H1.has(demo.name) ? null : <h1 className="sr-only">{`${DEMO_TEXTE.baustein}: ${demo.titel.split(" (")[0]}`}</h1>}
      <Demo />
    </Shell>
  );
}

/** Einstellungen (10-konzept-zentrale § 3.9): Reiter als Segment, je Reiter eigene Kacheln. Admin schreibt, GF liest (Firma schreibt). */
export default async function Einstellungen({ searchParams }) {
  const sp = (await searchParams) || {};
  const session = await requireRecht("zentrale", "read", "/einstellungen");
  const admin = istAdmin(session);
  const reiter = REITER.includes(sp.tab) ? sp.tab : "firma";
  if (reiter === "system" && typeof sp.baustein === "string") {
    const demo = demoFuer(sp.baustein, { admin, modus: backofficeMode() });
    if (demo) return <DemoSeite session={session} demo={demo} />;
  }
  const client = backoffice(session);
  const metaE = await ladeMeta(client, "PH Einstellungen").catch(() => null);
  const schreibtE = metaE ? darfDoc(session, metaE, "write") : false;

  const tabs = (
    <Segment
      label={T.reiterLabel}
      aktiv={reiter}
      optionen={REITER.filter((r) => r !== "kalkulation" || darfKalkulation(session) || admin).map((r) => ({ wert: r, titel: T.reiter[r], href: `/einstellungen?tab=${r}`, testid: `reiter-${r}` }))}
      testid="einstellungen-reiter"
    />
  );

  let inhalt;
  if (reiter === "firma") inhalt = await FirmaReiter({ client, session, sp });
  else if (reiter === "allgemein" || reiter === "website") inhalt = await EinstellungenReiter({ client, reiter, schreibt: schreibtE });
  else if (reiter === "kalender") inhalt = await KalenderReiter({ client, schreibt: schreibtE });
  else if (reiter === "kalkulation") inhalt = await KalkulationReiter({ client, session });
  else if (reiter === "microsoft") inhalt = await SingleReiter({ client, session, doctype: "PH Microsoft Einstellungen", admin });
  else if (reiter === "ablage") inhalt = await SingleReiter({ client, session, doctype: "PH Ablage Einstellungen", admin });
  else inhalt = <SystemReiter admin={admin} />;

  return (
    <Shell session={session} breit>
      <Seitenkopf titel={T.titel} untertitel={schreibtE ? T.unterAdmin : T.unterLesen} krumen={KRUMEN} unternav={<div className="bo-scroll-x -mx-1 max-w-full overflow-x-auto px-1 pb-1">{tabs}</div>} />
      {inhalt}
    </Shell>
  );
}

// ------------------------------------------------------------------------------------------------ Firma

async function FirmaReiter({ client, session, sp }) {
  const meta = await ladeMeta(client, "PH Firma").catch(() => null);
  const r = await versuch(() => client.getList("PH Firma", { fields: ["name", "firmenname", "standard", "modified"], orderBy: "standard desc", limit: 20 }));
  if (r.fehler) return <Fehler code={r.fehler.code} message={r.fehler.message} />;
  if (!r.daten.length) {
    return <Leer titel={T.firmaLeer} aktion={meta && darfDoc(session, meta, "create") ? <Knopf variant="primary" icon="Plus" href="/d/ph-firma/neu">{T.firmaAnlegen}</Knopf> : undefined} icon="Building2" />;
  }
  const gewaehlt = r.daten.find((f) => f.name === sp.firma) || r.daten.find((f) => Number(f.standard)) || r.daten[0];
  const doc = await client.getDoc("PH Firma", gewaehlt.name);
  const schreibt = meta ? darfDoc(session, meta, "write") : false;
  const steuer = session.roles.some((x) => ["PH Geschäftsführung", "PH Backoffice-Admin", "System Manager", "PH Faktura Leitung"].includes(x));
  const fehlt = firmaFehlt(doc);
  const felder = (namen) => namen.map(([name, label, extra = {}]) => ({ name, label, ...extra }));
  const werte = Object.fromEntries(["firmenname", "marke", "kurzname", "rechtsform", "geschaeftsfuehrung", "strasse", "plz", "ort", "land", "telefon", "email", "website", "uid", "firmenbuchnummer", "firmenbuchgericht", "steuernummer", "bank", "iban", "bic", "zahlungsziel_tage", "fusszeile"].map((k) => [k, doc[k] ?? ""]));
  if (!steuer) delete werte.steuernummer;
  return (
    <div className="flex flex-col gap-6">
      {r.daten.length > 1 && (
        <nav aria-label={T.firmen} className="flex flex-wrap gap-2">
          {r.daten.map((f) => (
            <Link key={f.name} href={`/einstellungen?tab=firma&firma=${encodeURIComponent(f.name)}`} className="zb-chip" data-ton={f.name === gewaehlt.name ? "sand" : undefined} aria-current={f.name === gewaehlt.name ? "page" : undefined}>
              {f.firmenname || f.name}
              {Number(f.standard) ? <Icon name="BadgeCheck" className="size-4" /> : null}
            </Link>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.01em]">{doc.firmenname || doc.name}</h2>
        {Number(doc.standard) ? <Pille material="salbei">{T.standard}</Pille> : schreibt ? <StandardFirmaKnopf name={doc.name} titel={doc.firmenname || doc.name} /> : null}
      </div>
      {fehlt.length > 0 && (
        <p className="zb-band" role="status" data-testid="firma-fehlt">
          <Icon name="TriangleAlert" className="mt-0.5 size-4 shrink-0" />
          {T.firmaFehlt(fehlt.join(", "))}
        </p>
      )}
      <EinstellungenFormular
        ziel={{ art: "firma", name: doc.name }}
        modified={doc.modified}
        nurLesen={!schreibt}
        werte={werte}
        abschnitte={[
          { titel: "Identität", felder: felder([["firmenname", "Firmenname (Rechtsträger)"], ["marke", "Marke"], ["kurzname", "Kurzname (Anzeige)"], ["rechtsform", "Rechtsform", { typ: "select", optionen: ["", "GmbH", "GmbH & Co KG", "AG", "Einzelunternehmen", "Sonstige"] }], ["geschaeftsfuehrung", "Geschäftsführung", { voll: true }]]) },
          { titel: "Anschrift", felder: felder([["strasse", "Straße und Nummer"], ["plz", "PLZ"], ["ort", "Ort"], ["land", "Land", { typ: "select", optionen: ["Österreich", "Deutschland", "Schweiz", "Liechtenstein", "Andere"], hilfe: "Für Österreich prüft die UID das Format ATU und 8 Ziffern." }], ["telefon", "Telefon"], ["email", "E-Mail", { typ: "email" }], ["website", "Website"]]) },
          { titel: "Register und Steuer", felder: felder([["uid", "UID-Nummer"], ["firmenbuchnummer", "Firmenbuchnummer"], ["firmenbuchgericht", "Firmenbuchgericht"], ...(steuer ? [["steuernummer", "Steuernummer (Finanzamt)", { hilfe: T.steuernummerVerborgen }]] : [])]) },
          { titel: "Bankverbindung", felder: felder([["bank", "Bank"], ["iban", "IBAN", { hilfe: "Wird ohne Leerzeichen gespeichert." }], ["bic", "BIC"], ["zahlungsziel_tage", "Zahlungsziel (Tage)", { typ: "zahl" }], ["fusszeile", "Fußzeile der Belege", { typ: "text", voll: true }]]) },
        ]}
      />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Allgemein / Website

async function EinstellungenReiter({ client, reiter, schreibt }) {
  const r = await versuch(() => client.getDoc("PH Einstellungen", "PH Einstellungen"));
  if (r.fehler) return <Fehler code={r.fehler.code} message={r.fehler.message} />;
  const e = r.daten;
  if (reiter === "allgemein") {
    const firmen = await client.getList("PH Firma", { fields: ["name"], limit: 20 }).catch(() => []);
    return (
      <div className="flex flex-col gap-6">
        <Kachel titel={T.schalterMitWirkung}>
          <SchalterMitWirkung art="testmodus" an={!!Number(e.testmodus)} nurLesen={!schreibt} />
        </Kachel>
        <EinstellungenFormular
          ziel={{ art: "einstellungen", reiter: "allgemein" }}
          modified={e.modified}
          nurLesen={!schreibt}
          werte={{ standard_firma: e.standard_firma || "", website_url: e.website_url || "", team_email: e.team_email || "", fehler_email: e.fehler_email || "" }}
          abschnitte={[
            {
              titel: T.reiter.allgemein,
              felder: [
                { name: "standard_firma", label: "Standardfirma", typ: "select", optionen: ["", ...firmen.map((f) => f.name)] },
                { name: "website_url", label: "Website", hilfe: "Adresse beginnt mit https://" },
                { name: "team_email", label: "Team-Postfach", typ: "email" },
                { name: "fehler_email", label: "Postfach für Integrationsfehler", typ: "email", hilfe: T.integrationsHinweis },
              ],
            },
          ]}
          kinder={
            <dl className="zb-def">
              <div><dt>Zeitzone</dt><dd>{e.zeitzone || "Europe/Vienna"} · {T.nurLesend}</dd></div>
              <div><dt>Sprachen der Website</dt><dd>{e.sprachen || "de,en,fr,it"} · {T.nurLesend}</dd></div>
            </dl>
          }
        />
      </div>
    );
  }
  const api = !!Number(e.api_aktiv);
  return (
    <div className="flex flex-col gap-6">
      {!api && (
        <p className="zb-band" role="status" data-testid="api-aus-band">
          <Icon name="TriangleAlert" className="mt-0.5 size-4 shrink-0" />
          {T.apiAusBand}
        </p>
      )}
      <Kachel titel={T.schalterMitWirkung}>
        <SchalterMitWirkung art="api" an={api} nurLesen={!schreibt} />
      </Kachel>
      <EinstellungenFormular
        ziel={{ art: "einstellungen", reiter: "website" }}
        modified={e.modified}
        nurLesen={!schreibt}
        werte={Object.fromEntries(["api_rate_limit_pro_minute", "api_rate_limit_gast_pro_minute", "api_rate_limit_gesamt_pro_minute", "api_idempotenz_tage", "api_protokoll_aufbewahrung_tage", "api_protokoll_nutzdaten", "website_revalidate_aktiv", "website_revalidate_drossel_sekunden", "website_revalidate_secret_name"].map((k) => [k, e[k] ?? ""]))}
        abschnitte={[
          {
            titel: "API für die Website",
            felder: [
              { name: "api_rate_limit_pro_minute", label: "Ratenbegrenzung je Methode und Client (pro Minute)", typ: "zahl" },
              { name: "api_rate_limit_gast_pro_minute", label: "Ratenbegrenzung Gast-Methoden je IP (pro Minute)", typ: "zahl" },
              { name: "api_rate_limit_gesamt_pro_minute", label: "Obergrenze je Benutzer über alle Clients (pro Minute)", typ: "zahl" },
              { name: "api_idempotenz_tage", label: "Idempotenz-Schlüssel gültig (Tage)", typ: "zahl" },
              { name: "api_protokoll_aufbewahrung_tage", label: "API-Protokoll aufbewahren (Tage)", typ: "zahl", hilfe: "Mindestens 7 Tage." },
              { name: "api_protokoll_nutzdaten", label: "Nutzdaten im Protokoll speichern", typ: "check", hilfe: T.nutzdatenHinweis },
            ],
          },
          {
            titel: "Website-Cache",
            felder: [
              { name: "website_revalidate_aktiv", label: "Website-Cache nach Änderungen erneuern", typ: "check" },
              { name: "website_revalidate_drossel_sekunden", label: "Drosselung je Pfad (Sekunden)", typ: "zahl" },
              { name: "website_revalidate_secret_name", label: "Schlüsselname des Geheimnisses", hilfe: "Nur der Name aus der Serverkonfiguration, beginnt mit ph_ – nie der Wert." },
            ],
          },
        ]}
        kinder={
          <dl className="zb-def">
            <div className="sm:col-span-2"><dt>Bekannte Pfade der Website</dt><dd>{e.website_revalidate_pfade || "–"}</dd></div>
          </dl>
        }
      />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Kalender

async function KalenderReiter({ client, schreibt }) {
  const r = await versuch(() => client.getDoc("PH Einstellungen", "PH Einstellungen"));
  if (r.fehler) return <Fehler code={r.fehler.code} message={r.fehler.message} />;
  const e = r.daten;
  return <Schliesstage zeilen={e.betriebsruhe || []} bundesland={e.feiertage_bundesland} laender={LAENDER} modified={e.modified} nurLesen={!schreibt} />;
}

// ------------------------------------------------------------------------------------------------ Kalkulation

async function KalkulationReiter({ client, session }) {
  if (!darfKalkulation(session)) return <Leer art="recht" titel={T.kalkulationNurLeitung} />;
  const r = await versuch(() => kalkulationLaden(client));
  if (r.fehler) return <Fehler code={r.fehler.code} message={r.fehler.message} />;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="zb-leise max-w-[80ch]">{T.kalkulationUnter}</p>
        <Pille material={r.daten.eingerichtet ? "salbei" : "eiche"}>{r.daten.eingerichtet ? T.eingerichtet : T.nichtEingerichtet}</Pille>
      </div>
      <KalkulationEditor daten={r.daten} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Microsoft / Ablage

const MS_ABSCHNITTE = [
  { titel: "Anmeldung (Entra ID)", felder: [["sso_aktiv", "Microsoft-Anmeldung aktiv", "check"], ["tenant_id", "Tenant-ID (Verzeichnis-ID)"], ["backoffice_client_id", "Client-ID der App „Platzhirsch Backoffice“"], ["toleranz_sekunden", "Uhrzeit-Toleranz (s)", "zahl"], ["sso_rate_limit_pro_minute", "Rate-Limit je IP und Minute", "zahl"], ["auto_benutzer_anlegen", "Benutzer automatisch anlegen", "check"], ["rollen_aus_gruppen", "Rollen bei jeder Anmeldung aus Gruppen abgleichen", "check"]] },
  { titel: "Mail", felder: [["webhook_basis_url", "Öffentliche HTTPS-Adresse des Frappe-Servers"], ["interne_domains", "Interne Domains", "text"], ["mail_sync_aktiv", "Mail-Abgleich aktiv", "check"], ["anhaenge_uebernehmen", "Anhänge zugeordneter Mails speichern", "check"], ["anhang_max_mb", "Anhang höchstens (MB)", "zahl"], ["unzugeordnet_tage", "Liste „nicht zugeordnet“: Tage", "zahl"], ["kundenmails_ueber_exchange", "1:1-Kundenmails über Exchange", "check"]] },
  { titel: "Kalender", felder: [["kalender_sync_aktiv", "Kalender-Abgleich aktiv", "check"], ["kalender_termin", "Termine (CRM)", "check"], ["kalender_montage", "Montageaufträge (Projekte)", "check"], ["kalender_service", "Serviceeinsätze (Service)", "check"], ["teams_fuer_video", "Teams-Besprechung für Videotermine", "check"], ["belegt_als_event", "Fremde Outlook-Termine als „Belegt“ spiegeln", "check"], ["aufgabe_bei_verschiebung", "Aufgabe bei Verschiebung in Outlook", "check"], ["sync_tage_vergangenheit", "Abgleich Tage zurück", "zahl"], ["sync_tage_zukunft", "Abgleich Tage voraus", "zahl"]] },
  { titel: "Kontakte und Protokoll", felder: [["kontakte_sync_aktiv", "Kontakte → Outlook-Kontakte (einseitig)", "check"], ["kontakte_postfach", "Team-Postfach für den Kontaktordner", "email"], ["kontakte_ordner", "Kontaktordner"], ["protokoll_aufbewahrung_tage", "Abgleichsprotokoll aufbewahren (Tage)", "zahl"]] },
];

const ABLAGE_ABSCHNITTE = [
  { titel: "Speicher", felder: [["speicher_adapter", "Speicher-Adapter für neue Uploads", "select", ["lokal", "s3", "google_drive", "onedrive"]], ["speicher_praefix", "Schlüssel-Präfix im Speicher"], ["presign_sekunden", "Gültigkeit Download-/Upload-Links (Sekunden)", "zahl"], ["upload_token_stunden", "Upload-Token gültig (Stunden)", "zahl"], ["chunk_mb", "Teilgröße beim Hochladen (MB)", "zahl"], ["max_groesse_mb", "Höchstgröße je Datei (MB)", "zahl"], ["s3_pruefsumme_nachrechnen", "S3: Prüfsumme nach Direkt-Upload nachrechnen", "check"]] },
  { titel: "Dateitypen", felder: [["erlaubte_endungen", "Erlaubte Endungen", "text"], ["gesperrte_endungen", "Gesperrte Endungen", "text"], ["duplikat_verhalten", "Bei gleicher Prüfsumme im Ordner", "select", ["melden", "verwerfen"]]] },
  { titel: "Ordner, Papierkorb und Bearbeitung", felder: [["automatische_ordner", "Ordner für Kontakt, Projekt, Lieferant, Mitarbeiter, Servicefall automatisch anlegen", "check"], ["papierkorb_tage", "Papierkorb-Frist (Tage)", "zahl"], ["sperre_stunden", "Bearbeitungssperre Standard (Stunden)", "zahl"]] },
  { titel: "Vorschau und Volltext", felder: [["vorschau_aktiv", "Vorschauen erzeugen", "check"], ["vorschau_px", "Vorschau-Kantenlänge (px)", "zahl"], ["office_vorschau", "Office → PDF im Hintergrund", "check"], ["soffice_pfad", "Pfad zu soffice"], ["video_poster", "Video-Posterbild", "check"], ["volltext_aktiv", "Volltext für PDF, DOCX, XLSX, PPTX, TXT", "check"], ["volltext_max_mb", "Volltext nur bis Dateigröße (MB)", "zahl"]] },
  { titel: "Freigabelinks", felder: [["freigabe_basis_url", "Basis-Adresse der Freigabeseite"], ["freigabe_standard_tage", "Standard-Gültigkeit (Tage)", "zahl"], ["freigabe_max_tage", "Höchste Gültigkeit (Tage)", "zahl"], ["freigabe_passwort_pflicht", "Passwort für Freigabelinks verpflichtend", "check"]] },
];

async function SingleReiter({ client, session, doctype, admin }) {
  const ms = doctype === "PH Microsoft Einstellungen";
  const r = await versuch(() => client.getDoc(doctype, doctype));
  if (r.fehler) return <Fehler code={r.fehler.code} message={r.fehler.message} />;
  const e = r.daten;
  const abschnitte = (ms ? MS_ABSCHNITTE : ABLAGE_ABSCHNITTE).map((a) => ({ titel: a.titel, felder: a.felder.map(([name, label, typ, optionen]) => ({ name, label, typ, optionen })) }));
  const werte = Object.fromEntries(abschnitte.flatMap((a) => a.felder).map((f) => [f.name, e[f.name] ?? ""]));
  const status = ms && darfMicrosoftStatus(session) ? await versuch(() => microsoftStatus(client)) : null;
  const zeit = (t) => (t ? `${relativ(t)} (${datumZeit(t)})` : T.msNie);
  return (
    <div className="flex flex-col gap-6">
      <p className="zb-leise max-w-[80ch]">{ms ? T.microsoftUnter : T.ablageUnter}</p>
      {ms && (
        <Kachel titel={T.msStatus} unter={T.msGeheimnis} testid="microsoft-status">
          {!status ? (
            <p className="zb-leise">{T.msNurAdmin}</p>
          ) : status.fehler ? (
            <Fehler kompakt code={status.fehler.code} message={status.fehler.message} />
          ) : (
            <>
              <p className="zb-band mb-4" data-ton={status.daten.konfiguriert ? "ok" : "info"}>
                <Icon name={status.daten.konfiguriert ? "Check" : "Info"} className="mt-0.5 size-4 shrink-0" />
                {status.daten.konfiguriert ? T.msKonfiguriert : T.msNichtKonfiguriert}
              </p>
              <dl className="zb-def zb-def--3">
                <div><dt>{T.msLetzterMail}</dt><dd>{zeit(status.daten.letzte_mail_sync)}</dd></div>
                <div><dt>{T.msLetzterKalender}</dt><dd>{zeit(status.daten.letzte_kalender_sync)}</dd></div>
                <div><dt>{T.msLetzteAbo}</dt><dd>{zeit(status.daten.letzte_abo_pruefung)}</dd></div>
                <div><dt>{T.msFehler24}</dt><dd>{status.daten.fehler_24h}</dd></div>
                <div><dt>{T.msKonflikte24}</dt><dd>{status.daten.konflikte_24h}</dd></div>
                <div><dt>{T.msAbos}</dt><dd>{status.daten.abos_aktiv} · {status.daten.abos_laufen_ab_24h} {T.msAbosAblauf} · {status.daten.abos_gestoert} {T.msAbosGestoert}</dd></div>
                <div><dt>{T.msPostfaecher}</dt><dd>{status.daten.postfaecher_aktiv}</dd></div>
                <div><dt>{T.msKalender}</dt><dd>{status.daten.kalender_aktiv}</dd></div>
                {e.letzter_fehler ? <div><dt>{T.msLetzterFehler}</dt><dd>{e.letzter_fehler}</dd></div> : null}
              </dl>
            </>
          )}
        </Kachel>
      )}
      {!ms && e.konfig_status && (
        <Kachel titel={T.ablageStatus}>
          <p className="zb-leise whitespace-pre-line">{e.konfig_status}</p>
        </Kachel>
      )}
      <EinstellungenFormular ziel={{ art: "single", doctype }} modified={e.modified} nurLesen={!admin} werte={werte} abschnitte={abschnitte} testid={ms ? "microsoft-formular" : "ablage-formular"} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ System

function SystemReiter({ admin }) {
  const demos = demoListe({ admin, modus: backofficeMode() });
  const kreise = NUMMERNMUSTER.filter((n, i, a) => n.serie && a.findIndex((x) => x.serie === n.serie && x.doctype === n.doctype) === i).slice(0, 80);
  return (
    <div className="flex flex-col gap-6">
      {demos.length > 0 && (
        <section aria-labelledby="zb-bausteine" data-testid="demo-uebersicht">
          <h2 id="zb-bausteine" className="mb-1 text-[22px] leading-7 font-semibold tracking-[-0.01em]">{T.bausteine}</h2>
          <p className="zb-leise mb-5">{T.bausteineText}</p>
          <Bento>
            {demos.map((d) => (
              <Kachel key={d.name} titel={d.titel.split(" (")[0]} unter={`${DEMO_TEXTE.team} ${d.team}`} href={d.href} oeffnenLabel={`${DEMO_TEXTE.oeffnen}: ${d.titel.split(" (")[0]}`} lift className="md:col-span-6 lg:col-span-4">
                <p className="line-clamp-2 text-[13px] leading-[18px] text-bo-text-soft">{d.titel.includes(" (") ? d.titel.slice(d.titel.indexOf(" (") + 2, -1) : ""}</p>
              </Kachel>
            ))}
          </Bento>
        </section>
      )}
      <Kachel titel={T.nummernkreise} testid="nummernkreise">
        <p className="zb-band mb-4" data-ton="info">{T.nummernkreiseBand}</p>
        <div className="zb-scroll">
          <table className="zb-tabelle">
            <thead>
              <tr>
                <th scope="col">{T.objekt}</th>
                <th scope="col">{T.serie}</th>
                <th scope="col">{T.beispiel}</th>
              </tr>
            </thead>
            <tbody>
              {kreise.map((n) => (
                <tr key={`${n.doctype}-${n.serie}`}>
                  <td>{doctypeLabel(n.doctype)}</td>
                  <td className="font-mono text-[13px]">{n.serie}</td>
                  <td className="font-mono text-[13px] whitespace-nowrap">{safeBeispiel(n.serie)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kachel>
      <Kachel titel={T.zugangsschluessel}>
        <p className="zb-leise">{T.schluesselFehlt}</p>
      </Kachel>
    </div>
  );
}

function safeBeispiel(serie) {
  try {
    return beispielAusSerie(serie) || "–";
  } catch {
    return "–";
  }
}
