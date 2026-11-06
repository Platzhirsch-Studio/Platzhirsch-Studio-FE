import { notFound } from "next/navigation";
import { fakturaKontext, ladeBeleg, kontaktVon, alle } from "@/lib/backoffice/faktura/daten";
import { summenblock, zahlungsplanAus } from "@/lib/backoffice/faktura/betraege";
import { angebotPrimaer, angebotBand, belegkette } from "@/lib/backoffice/faktura/akte";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { tageZwischen } from "@/lib/backoffice/faktura/betraege";
import { AKTE, ANGEBOT, AKTION, AUFTRAG, wertLabel } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import { AkteGeruest, AkteKopf, AkteTabs, Band, Vorgangsleiste, RechteSpalte } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import KundenmodusKnopf from "@/components/Backoffice/Kundenmodus/KundenmodusKnopf";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import { Summenblock, PositionenLesend } from "@/components/Backoffice/Faktura/Bausteine";
import { AkteAktionen, PositionenEditor, UebernehmenStart } from "@/components/Backoffice/Faktura/AkteTeile";
import { Status, Signal, Fakten, Hinweis } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Angebote · Faktura` };
}

// Angebotsakte (T5, § 4.2): Primär je Zustand, Präsentation über den Kundenmodus des Fundaments (DoD Faktura),
// Einkauf/Marge/Notiz nur intern (NurIntern), Übernehmen-Dialog mit Alternativen/Zahlungsplan/Terminen.
export default async function AngebotAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/angebote/${roh}`);
  const { client, rolle, heute } = ctx;
  const beleg = await ladeBeleg(client, "PH Angebot", name, rolle);
  if (!beleg) notFound();
  const { doc: a, docinfo } = beleg;
  const [kontakt, bedingungen, auftrag] = await Promise.all([kontaktVon(client, a.kontakt), alle(client, "PH Zahlungsbedingung"), a.auftragsbestaetigung ? client.getDoc("PH Auftragsbestaetigung", a.auftragsbestaetigung).catch(() => null) : null]);
  const bedingung = bedingungen.find((b) => b.name === a.zahlungsbedingung) || bedingungen.find((b) => Number(b.standard) === 1) || {};
  const st = statusAnzeige("PH Angebot", a.status);
  const tabs = AKTE.tabs.angebot.map((t) => ({ ...t, anzahl: t.id === "positionen" ? (a.positionen || []).length : undefined }));
  const tab = aktiverTab(tabs, sp?.tab);
  const band = angebotBand(a);
  const t = a.gueltig_bis ? tageZwischen(heute, a.gueltig_bis) : null;
  const ziel = { name: a.name, doctype: "PH Angebot", titel: a.titel, daten: { kunde: a.kunde_name, email: kontakt.email || a.email || "", vertragsort: a.vertragsort, brutto_cent: a.brutto_cent, gueltig_bis: a.gueltig_bis, anrede: kontakt.anrede, vorname: kontakt.vorname, nachname: kontakt.nachname, kontaktart: kontakt.kontaktart, firma: a.firma } };
  const primaer = angebotPrimaer(a, rolle);
  const menue = rolle.schreibt
    ? [
        a.status === "Entwurf" || a.status === "Gesendet" ? { id: "senden", titel: AKTION.senden, icon: "Mail", taste: "⇧S" } : null,
        ["Entwurf", "Gesendet"].includes(a.status) ? { id: "annehmen", titel: AKTION.annehmen, icon: "BadgeCheck" } : null,
        a.status === "Gesendet" ? { id: "ablehnen", titel: AKTION.ablehnen, icon: "CircleX" } : null,
        ["Gesendet", "Abgelehnt", "Abgelaufen"].includes(a.status) ? { id: "neue-version", titel: AKTION.neueVersion, icon: "Layers", ...(a.status !== "Gesendet" && !rolle.leitung ? { deaktiviert: true, grund: "Nur Faktura-Leitung" } : {}) } : null,
        { trenner: true, id: "t" },
        { id: "pdf", titel: AKTION.pdf, icon: "FileText", href: `/druck/ph-angebot/${encodeURIComponent(a.name)}` },
        a.projekt ? { id: "projekt", titel: AKTION.projekt, icon: "FolderKanban", href: `/d/ph-projekt/${encodeURIComponent(a.projekt)}`, taste: "⇧P" } : null,
        a.kontakt ? { id: "kunde", titel: AKTION.kundenakte, icon: "Contact", href: `/d/ph-kontakt/${encodeURIComponent(a.kontakt)}`, taste: "⇧K" } : null,
      ].filter(Boolean)
    : [];
  const plan = zahlungsplanAus(bedingung, a.brutto_cent);
  const s = summenblock({ ...a, docstatus: 0 });
  const basis = `/faktura/angebote/${encodeURIComponent(a.name)}`;
  const neueVersionAktion = primaer?.id === "neue-version";

  return (
    <FakturaSeite ctx={ctx} titel={a.name} ohneKopf>
      <div className="bo-fk-praesentation">
        <AkteGeruest
          testid="angebot-akte"
          vorgangOben
          kopf={
            <AkteKopf
              zurueck={{ href: "/faktura/angebote", titel: "Angebote" }}
              krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Angebote", href: "/faktura/angebote" }, { titel: a.name }]}
              titel={<span className={a.status === "Ersetzt" ? "line-through decoration-1" : undefined}>{a.titel || a.name}</span>}
              nummer={`${a.status === "Entwurf" ? "Entwurf" : a.name} · v${a.version || 1} · ${a.kunde_name || "–"}`}
              status={
                <span className="flex flex-wrap items-center gap-2">
                  <Status status={st} />
                  {a.status === "Gesendet" && t !== null && t >= 0 && t <= 7 && <Signal signal={{ art: "bald", icon: "Clock", text: `gültig ${t === 0 ? "bis heute" : `noch ${t} Tage`}` }} />}
                </span>
              }
              betrag={{ cent: a.brutto_cent, unter: a.gueltig_bis ? `gültig bis ${datum(a.gueltig_bis)}` : undefined }}
              aktionen={
                <span className="flex flex-wrap items-center gap-2">
                  <KundenmodusKnopf size="m" />
                  <DruckKnopf doctype="PH Angebot" name={a.name} titel={`Angebot ${a.name}`} pdf={client.modus === "frappe"} />
                  {primaer?.id === "uebernehmen" ? (
                    <>
                      <UebernehmenStart angebot={a} bedingung={bedingung} aktiv />
                      <AkteAktionen ziel={ziel} primaer={null} menue={menue} rolle={rolle} />
                    </>
                  ) : (
                    <AkteAktionen ziel={ziel} primaer={neueVersionAktion ? { ...primaer, id: "neue-version" } : primaer} menue={menue} rolle={rolle} />
                  )}
                </span>
              }
            />
          }
          band={band && <Band ton={band.ton} titel={band.titel} />}
          vorgang={<Vorgangsleiste titel={AKTE.belegkette} kompakt mitText schritte={belegkette({ angebot: a, auftrag, rechnungen: [], aktuell: "angebot" })} />}
          reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={sp || {}} />}
          rechts={
            <RechteSpalte
              details={
                <Fakten
                  eintraege={[
                    { label: "Kunde", wert: a.kunde_name },
                    { label: "Berater", wert: String(a.zugewiesen_an || "").split("@")[0] || "–" },
                    { label: "Projekt", wert: a.projekt || null },
                    { label: "Vorgänger", wert: a.vorgaenger || null },
                    { label: "Nachfolger", wert: a.nachfolger || null },
                    { label: "Auftrag", wert: a.auftragsbestaetigung || null },
                  ]}
                />
              }
            />
          }
        >
          {tab === "uebersicht" && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
              <Kachel titel="Beträge" titelId="h-b">
                <Summenblock s={{ ...s, offen: a.brutto_cent }} zahlbalken={false} />
                {Number(a.alternativ_cent) > 0 && <p className="mt-3 text-[13px] text-bo-text-soft">{ANGEBOT.alternativ}: {cent(a.alternativ_cent)}</p>}
              </Kachel>
              <Kachel titel={AUFTRAG.zahlungsplan} unter={bedingung.titel || ""} titelId="h-zp">
                <ul className="flex flex-col gap-2 text-[14px]">
                  {plan.map((z, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-surface-2 px-3.5 py-2.5">
                      <span>
                        {z.art} {z.prozent} % · bei {z.faellig_bei}
                      </span>
                      <span className="tabular-nums">{cent(z.betrag_cent)}</span>
                    </li>
                  ))}
                </ul>
                {a.vertragsort && a.vertragsort !== "Showroom" && <Hinweis ton="info" className="mt-3">{`Vertragsort ${a.vertragsort}: Widerrufsbelehrung wird beim Senden beigelegt.`}</Hinweis>}
              </Kachel>
            </div>
          )}
          {tab === "positionen" && (
            <Kachel titel="Positionen" titelId="h-pos">
              {a.status === "Entwurf" && rolle.schreibt ? (
                <PositionenEditor doctype="PH Angebot" name={a.name} positionen={a.positionen || []} modified={a.modified} />
              ) : (
                <>
                  <PositionenLesend positionen={a.positionen || []} />
                  {rolle.permlevel1 && (
                    <NurIntern als="p" className="mt-3 block text-[13px] text-bo-text-soft">
                      Einkauf {cent((a.positionen || []).filter((p) => !p.alternativ).reduce((x, p) => x + (Number(p.einkauf_cent) || 0) * (Number(p.menge) || 1), 0))} · Marge{" "}
                      {cent((a.netto_cent || 0) - (a.positionen || []).filter((p) => !p.alternativ).reduce((x, p) => x + (Number(p.einkauf_cent) || 0) * (Number(p.menge) || 1), 0))}
                    </NurIntern>
                  )}
                </>
              )}
            </Kachel>
          )}
          {tab === "konditionen" && (
            <Kachel titel="Konditionen" titelId="h-k">
              <Fakten
                eintraege={[
                  { label: "Zahlungsbedingung", wert: bedingung.titel || a.zahlungsbedingung || "–" },
                  { label: "Lieferzeit", wert: a.lieferzeit_text || "nach Bestätigung durch den Hersteller" },
                  { label: "Vertragsort", wert: a.vertragsort || "Showroom" },
                  { label: "Steuerfall", wert: wertLabel(a.ust_fall) || "Inland" },
                  { label: "Sprache", wert: "Deutsch" },
                  { label: "Währung", wert: "EUR" },
                ]}
              />
            </Kachel>
          )}
          {tab === "texte" && (
            <Kachel titel="Texte" titelId="h-t">
              <Fakten eintraege={[{ label: "Einleitung", wert: a.einleitung || "Standardtext aus den Stammdaten" }, { label: "Schluss", wert: a.schluss || "Standardtext aus den Stammdaten" }]} />
              {rolle.permlevel1 && a.notiz_intern && (
                <NurIntern als="p" className="mt-3 block text-[13px] text-bo-text-soft">
                  {AKTE.notiz}: {a.notiz_intern}
                </NurIntern>
              )}
            </Kachel>
          )}
          {tab === "verlauf" && (
            <Kachel titel="Verlauf" titelId="h-v">
              <Fakten eintraege={[{ label: "Gesendet", wert: a.gesendet_am ? `${datum(a.gesendet_am)} · ${wertLabel(a.versandkanal) || "E-Mail"}` : "–" }, { label: "Angenommen", wert: a.angenommen_am ? datum(a.angenommen_am) : "–" }, { label: "Abgelehnt", wert: a.abgelehnt_grund ? wertLabel(a.abgelehnt_grund) : "–" }]} />
              <div className="mt-4">
                <Zeitleiste doctype="PH Angebot" name={a.name} docinfo={docinfo} darfSchreiben={rolle.schreibt} />
              </div>
            </Kachel>
          )}
        </AkteGeruest>
      </div>
    </FakturaSeite>
  );
}
