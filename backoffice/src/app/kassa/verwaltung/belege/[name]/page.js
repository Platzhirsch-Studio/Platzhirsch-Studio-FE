import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import { AkteKopf } from "@/components/Backoffice/Akte";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import { Fakten, KRUMEN, V, verwaltungsZugang, zeit } from "@/components/Backoffice/Kassa/Verwaltung";
import { DocAktion } from "@/components/Backoffice/Kassa/VerwaltungAktionen";
import { darfAnDieKassa } from "@/lib/backoffice/kassa/zugang";
import { euro, menge, STEUERSATZ_KURZ } from "@/lib/backoffice/kassa/betraege";
import { BELEGART_TITEL, POSITIONSART_TITEL, VERWALTUNG, ZAHLART_BACKEND_TITEL } from "@/lib/backoffice/kassa/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `Beleg ${decodeURIComponent(name)}` };
}

const STATUS_TON = { Signiert: "gruen", Ausfall: "orange", Nachsigniert: "tuerkis", Storniert: "grau", Entwurf: "grau" };

// Beleg-Akte (Team B-KAS, Konzept §5.1): Positionen, Zahlungen, Signatur/QR, Bezüge. Nur lesen – Storno und
// Rücknahme laufen an der Kassa (Freigabe am Ende). Druck Bon 80 mm / A4 über das Druckpanel des Fundaments.
export default async function BelegAkte({ params }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const { session, client } = await verwaltungsZugang(`${V}/belege/${roh}`);
  let doc;
  try {
    doc = await client.getDoc("PH Kassenbeleg", name);
  } catch {
    notFound();
  }
  const kiosk = darfAnDieKassa(session);
  const jeSatz = {};
  for (const p of doc.positionen || []) {
    const s = (jeSatz[p.steuersatz] ||= { netto: 0, ust: 0, brutto: 0 });
    s.netto += p.netto_cent || 0;
    s.ust += p.ust_cent || 0;
    s.brutto += p.brutto_cent || 0;
  }
  return (
    <Shell session={session} breit>
      <AkteKopf
        zurueck={{ titel: "Belege", href: `${V}/belege` }}
        krumen={[...KRUMEN, { titel: "Belege", href: `${V}/belege` }, { titel: `Beleg ${doc.belegnummer}` }]}
        titel={`${BELEGART_TITEL[doc.belegart] || doc.belegart} ${doc.belegnummer}`}
        nummer={<span className="tabular-nums">{doc.name} · {zeit(doc.datum_uhrzeit)} </span>}
        status={<StatusBadge wert={doc.status} ton={STATUS_TON[doc.status] || "grau"} storniert={!!doc.storniert_durch} />}
        betrag={{ cent: doc.gesamt_cent, unter: doc.trainings ? "Trainingsbeleg" : "Gesamt" }}
        aktionen={
          <div className="flex flex-wrap justify-end gap-2">
            <DocAktion doctype="PH Kassenbeleg" name={doc.name} methode="pruefen" titel={VERWALTUNG.beleg.pruefen} icon="BadgeCheck" erfolg={VERWALTUNG.beleg.geprueft} testid="beleg-pruefen" />
            <DruckKnopf doctype="PH Kassenbeleg" name={doc.name} titel={`Beleg ${doc.belegnummer}`} pdf={client.modus === "frappe"} />
            {kiosk && !doc.storniert_durch && doc.belegart === "Standard" && (
              <Knopf href={`/kassa/belege?beleg=${encodeURIComponent(doc.name)}`} variant="primary" icon="Wallet">
                An der Kassa öffnen
              </Knopf>
            )}
          </div>
        }
        testid="beleg-akte"
      />
      <Bento>
        <Kachel className="col-span-12 md:col-span-8" titel={VERWALTUNG.beleg.positionen} unter={`${(doc.positionen || []).length} Positionen`}>
          <ul className="-mx-2 flex flex-col" data-testid="beleg-positionen">
            {(doc.positionen || []).map((p) => (
              <li key={p.name || p.idx} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-2 py-3 [&+li]:border-t [&+li]:border-bo-line">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{p.bezeichnung}</span>
                  <span className="block text-[13px] tabular-nums text-bo-text-soft">
                    {[POSITIONSART_TITEL[p.art] !== "Artikel" ? POSITIONSART_TITEL[p.art] : null, `${menge(p.menge)} × ${euro(p.einzel_brutto_cent)}`, STEUERSATZ_KURZ[p.steuersatz], p.rabatt_grund ? `Rabatt: ${p.rabatt_grund}` : null, p.zusatz || null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="text-[15px] font-semibold tabular-nums">{euro(p.brutto_cent)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid gap-1 border-t border-bo-line pt-3 text-[13px] text-bo-text-soft">
            {Object.entries(jeSatz).map(([s, w]) => (
              <div key={s} className="flex justify-between tabular-nums">
                <dt>{STEUERSATZ_KURZ[s] || s} · netto {euro(w.netto)}</dt>
                <dd>USt. {euro(w.ust)}</dd>
              </div>
            ))}
          </dl>
        </Kachel>
        <Kachel className="col-span-12 md:col-span-4" titel={VERWALTUNG.beleg.zahlungen}>
          <ul className="flex flex-col gap-2">
            {(doc.zahlarten || []).map((z) => (
              <li key={z.name || z.idx} className="flex items-center justify-between rounded-[16px] bg-bo-surface-2 px-4 py-3">
                <span className="text-[15px]">
                  {ZAHLART_BACKEND_TITEL[z.zahlart] || z.zahlart}
                  {z.retour_cent ? <span className="block text-[13px] text-bo-text-soft tabular-nums">gegeben {euro(z.gegeben_cent)} · Rückgeld {euro(z.retour_cent)}</span> : null}
                </span>
                <span className="text-[15px] font-semibold tabular-nums">{euro(z.betrag_cent)}</span>
              </li>
            ))}
            {!(doc.zahlarten || []).length && <li className="text-[14px] text-bo-text-soft">Keine Zahlung (Nullbeleg oder Ausgleich über Gutschein).</li>}
          </ul>
        </Kachel>
        <Kachel className="col-span-12 md:col-span-6" titel="Angaben">
          <Fakten
            eintraege={[
              [VERWALTUNG.beleg.kasse, doc.kasse],
              [VERWALTUNG.beleg.datum, zeit(doc.datum_uhrzeit)],
              [VERWALTUNG.beleg.kunde, doc.kunde_name || "Laufkunde"],
              [VERWALTUNG.beleg.bediener, doc.bediener],
              doc.freigabe_von ? ["Freigabe von", `${doc.freigabe_von}${doc.freigabe_gruende ? ` (${doc.freigabe_gruende})` : ""}`] : null,
              doc.storno_von ? ["Storno von", doc.storno_von] : null,
              doc.storniert_durch ? ["Storniert durch", doc.storniert_durch] : null,
              doc.storno_grund ? ["Stornogrund", doc.storno_grund] : null,
              doc.kundenbeleg_email ? ["Beleg per E-Mail", doc.kundenbeleg_email] : null,
              doc.auftrag ? ["Auftrag", doc.auftrag] : null,
              doc.rechnung ? ["Rechnung", doc.rechnung] : null,
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {doc.trainings ? <Pille material="messing">Training</Pille> : null}
            {doc.see_ausgefallen ? <Pille material="eiche">Sicherheitseinrichtung ausgefallen</Pille> : null}
            {doc.nachsigniert ? <Pille material="see">Nachsigniert</Pille> : null}
          </div>
        </Kachel>
        <Kachel className="col-span-12 md:col-span-6" titel={VERWALTUNG.beleg.signatur} unter={VERWALTUNG.beleg.rksvGespeichert}>
          {doc.jws_compact ? (
            <div className="grid gap-3">
              <Fakten eintraege={[["Zertifikat", doc.zertifikat_seriennummer], ["ZDA", doc.zda_id]]} />
              <p className="text-[13px] text-bo-text-soft">{VERWALTUNG.beleg.qr}</p>
              <code className="block max-h-28 overflow-auto rounded-[14px] bg-bo-surface-2 p-3 text-[12px] leading-5 break-all">{doc.maschinenlesbarer_code}</code>
            </div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{VERWALTUNG.beleg.keineSignatur}</p>
          )}
        </Kachel>
      </Bento>
    </Shell>
  );
}
