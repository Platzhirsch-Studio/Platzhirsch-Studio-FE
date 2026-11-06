"use client";
// Aktionen der Produktakte (§ 4.1, § 5.1): genau eine Primäraktion je Zustand, Rest im Menü „⋯“; gesperrte
// Aktionen nennen ihren Grund sichtbar (Q-I5). Preis erfassen/bestätigen als Sheet (§ 5.6 preis_hinzufuegen):
// Team → Freigabe offen (sofort), Leitung → freigegeben als verzögerter Commit (Website folgt nach 8 s).
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Knopf from "../Knopf";
import { RundKnopf } from "../Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Sheet from "../Overlay/Sheet";
import BetragFeld from "../Eingabe/BetragFeld";
import Datumsfeld from "../Formular/Datumsfeld";
import WorkflowDialog from "./WorkflowDialog";
import useAktion from "./useAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { preisErfassenAction, produktSichtbarkeitAction, websiteAktualisierenAction } from "@/lib/backoffice/sortiment/actions";
import { produktUebergaenge, isoTag } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, PREIS_SHEET, WORKFLOW_TOAST, BEREICH } from "@/lib/backoffice/sortiment/texte";
import { cent } from "@/lib/backoffice/format";
import { sortimentDruckHref } from "@/lib/backoffice/druck/sortiment";

/**
 * @param {{produkt:{name:string, titel:string, status:string, aktueller_preis_cent?:number, preisart?:string, verkauf_online?:number, website_sichtbar?:number},
 *   leitung:boolean, darfSchreiben:boolean, sperren:Record<string,string|null>, websiteUrl?:string}} p
 */
export default function ProduktAktionen({ produkt, leitung, darfSchreiben, sperren = {} }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const { sofort, verzoegert } = useAktion();
  const [dialog, setDialog] = useState(sp.get("dialog") === "veroeffentlichen" && leitung ? "Veröffentlichen" : null);
  const [preis, setPreis] = useState(sp.get("preis") === "bestaetigen" ? "bestaetigen" : sp.get("preis") === "erfassen" ? "erfassen" : null);

  const uebergaenge = produktUebergaenge(produkt.status, { leitung: true });
  const primaerAktion = { Entwurf: "Prüfen", Geprueft: "Veröffentlichen", Pausiert: "Reaktivieren" }[produkt.status];
  const primaerGrund = primaerAktion ? sperren[primaerAktion] || null : null;
  const primaerNurLeitung = primaerAktion && uebergaenge.find((t) => t.aktion === primaerAktion)?.leitung && !leitung;

  useKuerzel("akte@sortiment", {
    "sortiment.akte-preis": () => darfSchreiben && setPreis("erfassen"),
  });

  const sichtbarkeit = (feld, wert, text) => verzoegert(() => produktSichtbarkeitAction({ namen: [produkt.name], feld, wert }), { text });

  if (!darfSchreiben) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaerAktion && !primaerNurLeitung && (
        <Knopf variant="primary" onClick={() => setDialog(primaerAktion)} disabled={!!primaerGrund} grund={primaerGrund || undefined} data-testid="produkt-primaer">
          {GLOSSAR.produktAktion[primaerAktion]}
          {primaerAktion === "Veröffentlichen" ? " …" : ""}
        </Knopf>
      )}
      {primaerNurLeitung && <span className="bo-sor-unter">{BEREICH.leitungEntscheidet}</span>}
      {produkt.status === "Aktiv" && (
        <Knopf variant="primary" icon="Tag" onClick={() => setPreis("erfassen")} data-testid="produkt-primaer">
          {PREIS_SHEET.erfassen}
        </Knopf>
      )}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Weitere Aktionen" />}>
        {produkt.status !== "Aktiv" && <MenuePunkt icon="Tag" onWaehlen={() => setPreis("erfassen")}>{PREIS_SHEET.erfassen}</MenuePunkt>}
        {produkt.aktueller_preis_cent > 0 && <MenuePunkt icon="RefreshCw" onWaehlen={() => setPreis("bestaetigen")}>{PREIS_SHEET.bestaetigen}</MenuePunkt>}
        <MenueTrenner />
        {uebergaenge
          .filter((t) => t.aktion !== primaerAktion)
          .map((t) => (
            <MenuePunkt key={t.aktion} deaktiviert={(t.leitung && !leitung) || !!sperren[t.aktion]} grund={t.leitung && !leitung ? BEREICH.nurLeitung : sperren[t.aktion] || undefined} gefaehrlich={t.aktion === "Auslaufen lassen"} onWaehlen={() => setDialog(t.aktion)}>
              {GLOSSAR.produktAktion[t.aktion]}
            </MenuePunkt>
          ))}
        <MenueTrenner />
        <MenuePunkt icon="Eye" onWaehlen={() => sichtbarkeit("website_sichtbar", produkt.website_sichtbar === 0 ? 1 : 0, produkt.website_sichtbar === 0 ? "Eingeblendet · Website folgt" : "Ausgeblendet · Website folgt")}>
          {produkt.website_sichtbar === 0 ? "Auf der Website einblenden" : "Auf der Website ausblenden"}
        </MenuePunkt>
        <MenuePunkt icon="ShoppingBag" onWaehlen={() => sichtbarkeit("verkauf_online", produkt.verkauf_online ? 0 : 1, produkt.verkauf_online ? "Aus dem Shop genommen · Website folgt" : "Im Shop · Website folgt")}>
          {produkt.verkauf_online ? "Nicht mehr im Shop" : "Im Shop anbieten"}
        </MenuePunkt>
        <MenuePunkt icon="RefreshCw" onWaehlen={() => sofort(() => websiteAktualisierenAction({ produkt: produkt.name }), { ok: (r) => (r.status === "gedrosselt" ? WORKFLOW_TOAST.websiteGedrosselt : WORKFLOW_TOAST.website), neuLaden: false })}>
          Website jetzt aktualisieren
        </MenuePunkt>
        <MenuePunkt icon="Printer" href={sortimentDruckHref("PH Produkt", produkt.name)}>
          Datenblatt drucken
        </MenuePunkt>
      </Menue>
      {dialog && <WorkflowDialog offen namen={[produkt.name]} aktion={dialog} onSchliessen={() => setDialog(null)} />}
      <PreisSheet
        key={preis || "zu"}
        offen={!!preis}
        art={preis}
        produkt={produkt}
        leitung={leitung}
        onSchliessen={() => {
          setPreis(null);
          if (sp.get("preis")) {
            const q = new URLSearchParams(sp.toString());
            q.delete("preis");
            router.replace(q.size ? `${pfad}?${q}` : pfad, { scroll: false });
          }
        }}
      />
    </div>
  );
}

/** Preis erfassen / bestätigen (Sheet 480). */
export function PreisSheet({ offen, art, produkt, leitung, onSchliessen }) {
  const { sofort, verzoegert, laeuft } = useAktion();
  const heute = isoTag();
  const [werte, setWerte] = useState(() => ({ betrag: art === "bestaetigen" ? produkt.aktueller_preis_cent || null : null, preisart: produkt.preisart === "UVP" ? "UVP" : "Verkaufspreis", stand: heute, quelle: "Herstellerliste", quelle_url: "" }));
  const [fehler, setFehler] = useState({});

  async function speichern() {
    const f = {};
    if (!werte.betrag) f.betrag = PREIS_SHEET.betragFehlt;
    if (["Herstellershop", "Herstellerliste"].includes(werte.quelle) && !/^https?:\/\/\S+$/.test(werte.quelle_url)) f.quelle_url = PREIS_SHEET.quelleUrlPflicht;
    setFehler(f);
    if (Object.keys(f).length) return;
    const args = { produkt: produkt.name, brutto_cent: werte.betrag, preisart: werte.preisart, stand: werte.stand, quelle: werte.quelle, quelle_url: werte.quelle_url };
    const fn = () => preisErfassenAction(args);
    const r = leitung ? await verzoegert(fn, { text: `${PREIS_SHEET.gespeichert(cent(werte.betrag))} · Website folgt` }) : await sofort(fn, { ok: `${PREIS_SHEET.gespeichert(cent(werte.betrag))} · Freigabe offen` });
    if (r?.ok) onSchliessen();
    else if (r?.fehler) setFehler(r.fehler);
  }

  return (
    <Sheet
      offen={offen}
      onSchliessen={onSchliessen}
      titel={art === "bestaetigen" ? PREIS_SHEET.bestaetigen : PREIS_SHEET.erfassen}
      unter={produkt.titel}
      groesse="md"
      testid="preis-sheet"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>
            Abbrechen
          </Knopf>
          <Knopf variant="primary" onClick={speichern} laedt={laeuft} data-testid="preis-speichern">
            {PREIS_SHEET.speichern}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {art === "bestaetigen" && <p className="rounded-[14px] bg-bo-fill px-4 py-3 text-[14px]">{PREIS_SHEET.bestaetigenText}</p>}
        <div className="bo-sor-feld">
          <label htmlFor="ps-betrag">{PREIS_SHEET.betrag}</label>
          <BetragFeld id="ps-betrag" value={werte.betrag} onChange={(c) => setWerte((w) => ({ ...w, betrag: c }))} fehler={fehler.betrag} />
        </div>
        <div className="bo-sor-feld">
          <label htmlFor="ps-art">{PREIS_SHEET.preisart}</label>
          <select id="ps-art" className="bo-sor-eingabe" value={werte.preisart} onChange={(e) => setWerte((w) => ({ ...w, preisart: e.target.value }))}>
            {["Verkaufspreis", "UVP", "Herstellerpreis", "Angebot"].map((a) => (
              <option key={a} value={a}>
                {GLOSSAR.preisart[a]}
              </option>
            ))}
          </select>
          {werte.preisart === "UVP" && <span className="bo-sor-feld__hinweis">{PREIS_SHEET.uvpBasis}</span>}
        </div>
        <div className="bo-sor-feld">
          <span id="ps-stand-l">{PREIS_SHEET.stand}</span>
          <Datumsfeld id="ps-stand" value={werte.stand} onChange={(v) => setWerte((w) => ({ ...w, stand: v }))} aria-label={PREIS_SHEET.stand} />
        </div>
        <div className="bo-sor-feld">
          <label htmlFor="ps-quelle">{PREIS_SHEET.quelle}</label>
          <select id="ps-quelle" className="bo-sor-eingabe" value={werte.quelle} onChange={(e) => setWerte((w) => ({ ...w, quelle: e.target.value }))}>
            {Object.entries(GLOSSAR.preisQuelle).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {["Herstellershop", "Herstellerliste"].includes(werte.quelle) && (
          <div className="bo-sor-feld">
            <label htmlFor="ps-url">{PREIS_SHEET.quelleUrl}</label>
            <input id="ps-url" type="url" inputMode="url" className="bo-sor-eingabe" placeholder="https://" value={werte.quelle_url} onChange={(e) => setWerte((w) => ({ ...w, quelle_url: e.target.value }))} aria-invalid={fehler.quelle_url ? "true" : undefined} />
            {fehler.quelle_url && <span className="bo-sor-feld__fehler">{fehler.quelle_url}</span>}
          </div>
        )}
        <p className="bo-sor-klein">{leitung ? PREIS_SHEET.leitungHinweis : PREIS_SHEET.teamHinweis}</p>
      </div>
    </Sheet>
  );
}
