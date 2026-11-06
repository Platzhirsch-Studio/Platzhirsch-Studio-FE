"use client";
// Aktionen der Bestellakte (§ 4.3, § 5.2): eine Primäraktion je Zustand (Senden … · AB einlesen · AB bestätigen ·
// Eingang buchen · Abschließen), Rest im Menü. Senden als Sheet mit Mail-Vorschau (verzögerter Commit 8 s),
// „Als gesendet markieren“ für Portal/Fax/Telefon, Termin ändern mit Pflichtgrund, Stornieren ab Gesendet nur
// Leitung mit Grund. Nie „Lieferung buchen“ (E8): der Status folgt aus dem Wareneingang.
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Knopf, { RundKnopf } from "../Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import Sheet from "../Overlay/Sheet";
import Dialog from "../Overlay/Dialog";
import Datumsfeld from "../Formular/Datumsfeld";
import useAktion from "./useAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { abNachfragenAction, alsGesendetAction, bestellungLieferantAction, bestellWorkflowAction, sendenAction, terminAction } from "@/lib/backoffice/sortiment/actions";
import { bestellPrimaer, bestellSperrgrund } from "@/lib/backoffice/sortiment/regeln";
import { BESTELLAKTE, MAIL, SENDEN } from "@/lib/backoffice/sortiment/texte";
import { sortimentDruckHref } from "@/lib/backoffice/druck/sortiment";

/**
 * @param {{b:object, lieferant:object|null, lieferanten:Array<{name:string, marke?:string}>, leitung:boolean, darfSchreiben:boolean}} p
 */
export default function BestellAktionen({ b, lieferant, lieferanten = [], leitung, darfSchreiben }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const { sofort, verzoegert, laeuft } = useAktion();
  const start = sp.get("dialog") || (sp.get("bearbeiten") === "lieferant" ? "lieferant" : null);
  const [offen, setOffen] = useState(start);
  const [empfaenger, setEmpfaenger] = useState(lieferant?.bestell_email || "");
  const [nachricht, setNachricht] = useState("");
  const [weg, setWeg] = useState(SENDEN.wege[0]);
  const [termin, setTermin] = useState(b.bestaetigter_termin || b.wunschtermin || "");
  const [grund, setGrund] = useState("");
  const [lf, setLf] = useState("");

  const zu = () => {
    setOffen(null);
    setGrund("");
    if (sp.get("dialog") || sp.get("bearbeiten")) {
      const q = new URLSearchParams(sp.toString());
      q.delete("dialog");
      q.delete("bearbeiten");
      router.replace(q.size ? `${pfad}?${q}` : pfad, { scroll: false });
    }
  };

  const basis = `/sortiment/bestellungen/${encodeURIComponent(b.name)}`;
  const primaer = bestellPrimaer(b);
  const sperre = (a) => bestellSperrgrund(b, a, { leitung, lieferant: lieferant || (empfaenger ? { bestell_email: empfaenger } : null) });

  useKuerzel("akte@sortiment", {
    "sortiment.akte-senden": () => b.status === "Entwurf" && setOffen("senden"),
    "sortiment.akte-ab": () => !sperre("abEinlesen") && router.push(`${basis}/ab`),
    "sortiment.akte-eingang": () => !sperre("eingang") && router.push(`/sortiment/wareneingang/neu?bestellung=${encodeURIComponent(b.name)}`),
  });

  if (!darfSchreiben) return null;

  const primaerKnopf = (() => {
    switch (primaer) {
      case "lieferant":
        return <Knopf variant="primary" icon="Truck" onClick={() => setOffen("lieferant")}>Lieferant zuordnen</Knopf>;
      case "senden": {
        const s = bestellSperrgrund(b, "senden", { leitung });
        return <Knopf variant="primary" icon="Mail" onClick={() => setOffen("senden")} disabled={!!s} grund={s || undefined} kuerzel="Umschalt+S" data-testid="bestellung-senden">{BESTELLAKTE.senden}</Knopf>;
      }
      case "abEinlesen":
        return <Knopf variant="primary" icon="ScanLine" href={`${basis}/ab`} kuerzel="Umschalt+A" data-testid="ab-einlesen">{BESTELLAKTE.abEinlesen}</Knopf>;
      case "klaeren":
        return <Knopf variant="primary" icon="ListFilter" href={`${basis}?tab=ab`}>Abweichungen klären</Knopf>;
      case "abBestaetigen": {
        const s = sperre("abBestaetigen");
        return <Knopf variant="primary" icon="CheckCheck" laedt={laeuft} disabled={!!s} grund={s || undefined} onClick={() => sofort(() => bestellWorkflowAction({ name: b.name, aktion: "AB freigeben" }), { ok: "AB bestätigt" })} data-testid="ab-bestaetigen">{BESTELLAKTE.abBestaetigen}</Knopf>;
      }
      case "eingang":
        return <Knopf variant="primary" icon="PackageCheck" href={`/sortiment/wareneingang/neu?bestellung=${encodeURIComponent(b.name)}`} kuerzel="Umschalt+W" data-testid="eingang-buchen">{BESTELLAKTE.eingangBuchen}</Knopf>;
      case "strecke":
        return <Knopf variant="primary" icon="Truck" disabled grund="Streckenlieferungen werden noch nicht unterstützt – Leitung bitten">{BESTELLAKTE.strecke}</Knopf>;
      case "abschliessen": {
        const s = sperre("abschliessen");
        return <Knopf variant="primary" icon="CircleCheck" laedt={laeuft} disabled={!!s} grund={s || undefined} onClick={() => sofort(() => bestellWorkflowAction({ name: b.name, aktion: "Abschließen" }), { ok: "Bestellung abgeschlossen" })}>{BESTELLAKTE.abschliessen}</Knopf>;
      }
      default:
        return null;
    }
  })();

  const stornoSperre = sperre("stornieren");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaerKnopf}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Weitere Aktionen" />}>
        {b.status === "Entwurf" && <MenuePunkt icon="Check" onWaehlen={() => setOffen("gesendet")}>{BESTELLAKTE.alsGesendet}</MenuePunkt>}
        {b.status === "Gesendet" && <MenuePunkt icon="Mail" onWaehlen={() => setOffen("nachfragen")}>{BESTELLAKTE.abNachfragen}</MenuePunkt>}
        {["Gesendet", "AB erhalten"].includes(b.status) && primaer !== "abEinlesen" && <MenuePunkt icon="ScanLine" href={`${basis}/ab`}>{BESTELLAKTE.abEinlesen}</MenuePunkt>}
        {["Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert"].includes(b.status) && <MenuePunkt icon="Calendar" onWaehlen={() => setOffen("termin")}>{BESTELLAKTE.terminAendern}</MenuePunkt>}
        <MenuePunkt icon="Download" href={`${basis}?tab=uebermittlung`}>{BESTELLAKTE.exportieren}</MenuePunkt>
        <MenuePunkt icon="Printer" href={sortimentDruckHref("PH Herstellerbestellung", b.name)}>{BESTELLAKTE.drucken}</MenuePunkt>
        {b.status === "Teilgeliefert" && <MenuePunkt icon="X" deaktiviert grund="Noch nicht verfügbar – Leitung bitten">{BESTELLAKTE.restStornieren}</MenuePunkt>}
        <MenueTrenner />
        {!["Abgeschlossen", "Storniert", "Geliefert", "Teilgeliefert"].includes(b.status) && (
          <MenuePunkt icon="Trash2" gefaehrlich deaktiviert={!!stornoSperre} grund={stornoSperre || undefined} onWaehlen={() => (b.status === "Entwurf" ? sofort(() => bestellWorkflowAction({ name: b.name, aktion: "Stornieren" }), { ok: "Entwurf storniert" }) : setOffen("storno"))}>
            {b.status === "Entwurf" ? BESTELLAKTE.stornieren : BESTELLAKTE.stornierenDialog}
          </MenuePunkt>
        )}
      </Menue>

      <Sheet
        offen={offen === "senden"}
        onSchliessen={zu}
        titel={SENDEN.titel(b.name)}
        unter={b.lieferant}
        groesse="lg"
        testid="senden-sheet"
        fuss={
          <>
            <Knopf variant="ghost" onClick={() => setOffen("gesendet")}>
              {SENDEN.anderer}
            </Knopf>
            <Knopf
              variant="primary"
              laedt={laeuft}
              onClick={async () => {
                const r = await verzoegert(() => sendenAction({ name: b.name, empfaenger, nachricht }), { text: SENDEN.gesendet(empfaenger || lieferant?.bestell_email || "Hersteller"), fehlerText: `Senden von ${b.name}` });
                if (r?.ok) zu();
              }}
              disabled={!empfaenger}
              grund={!empfaenger ? SENDEN.ohneEmail : undefined}
              data-testid="senden-bestaetigen"
            >
              {SENDEN.knopf}
            </Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bo-sor-feld">
            <label htmlFor="se-an">{SENDEN.an}</label>
            <input id="se-an" type="email" className="bo-sor-eingabe" value={empfaenger} onChange={(e) => setEmpfaenger(e.target.value)} />
            {!lieferant?.bestell_email && <span className="bo-sor-feld__hinweis">{SENDEN.ohneEmail}</span>}
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="se-text">{SENDEN.nachricht}</label>
            <textarea id="se-text" className="bo-sor-eingabe" value={nachricht} onChange={(e) => setNachricht(e.target.value)} placeholder={SENDEN.nachrichtHinweis} rows={4} />
          </div>
          {b.lieferadresse === "Kunde direkt" && <p className="rounded-[14px] bg-bo-fill px-4 py-3 text-[14px]">{BESTELLAKTE.kundendaten}</p>}
          {b.bezug_doctype === "PH Auftragsbestaetigung" && <p className="rounded-[14px] bg-bo-eiche-soft px-4 py-3 text-[14px] text-bo-eiche-text">{BESTELLAKTE.anzahlung}</p>}
          <div className="rounded-[20px] bg-bo-surface-2 p-5">
            <p className="bo-sor-klein">Vorschau der E-Mail</p>
            <p className="mt-2 text-[14px] font-semibold">{MAIL.bestellungBetreff(b.name)}</p>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-[22px] text-bo-text-soft">{nachricht || MAIL.bestellungText(b.name, b.lieferant)}</p>
            <p className="bo-sor-klein mt-3">Anhang: Bestellung {b.name}.pdf</p>
          </div>
        </div>
      </Sheet>

      <Dialog
        offen={offen === "gesendet"}
        onSchliessen={zu}
        titel={BESTELLAKTE.alsGesendet.replace(" …", "")}
        text="Für Bestellungen über Portal, Fax, Telefon oder persönlich."
        groesse="sm"
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>Abbrechen</Knopf>
            <Knopf variant="primary" laedt={laeuft} onClick={async () => (await sofort(() => alsGesendetAction({ name: b.name, weg }), { ok: SENDEN.markiert }))?.ok && zu()}>
              Als gesendet markieren
            </Knopf>
          </>
        }
      >
        <div className="bo-sor-feld">
          <label htmlFor="ag-weg">{SENDEN.weg}</label>
          <select id="ag-weg" className="bo-sor-eingabe" value={weg} onChange={(e) => setWeg(e.target.value)}>
            {SENDEN.wege.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
      </Dialog>

      <Dialog
        offen={offen === "termin"}
        onSchliessen={zu}
        titel="Termin ändern"
        text="Neuer bestätigter Liefertermin – der Grund steht im Verlauf."
        groesse="sm"
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>Abbrechen</Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={grund.trim().length < 3 || !termin} onClick={async () => (await sofort(() => terminAction({ name: b.name, termin, grund }), { ok: "Termin geändert" }))?.ok && zu()}>
              Speichern
            </Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bo-sor-feld">
            <span>Neuer Termin</span>
            <Datumsfeld value={termin} onChange={setTermin} aria-label="Neuer Termin" />
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="ta-grund">Grund</label>
            <input id="ta-grund" className="bo-sor-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} placeholder="z. B. Lieferverzug Werk" />
          </div>
        </div>
      </Dialog>

      <Dialog
        offen={offen === "nachfragen"}
        onSchliessen={zu}
        titel="AB nachfragen?"
        text={`Mail an ${lieferant?.bestell_email || b.lieferant} – Rückgängig 8 s.`}
        groesse="md"
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>Abbrechen</Knopf>
            <Knopf variant="primary" laedt={laeuft} onClick={async () => (await verzoegert(() => abNachfragenAction({ name: b.name, nachricht }), { text: "AB nachgefragt" }))?.ok && zu()}>
              Nachfragen
            </Knopf>
          </>
        }
      >
        <p className="whitespace-pre-line rounded-[16px] bg-bo-surface-2 p-4 text-[14px] leading-[22px] text-bo-text-soft">{MAIL.abNachfragen(b.name)}</p>
      </Dialog>

      <Dialog
        offen={offen === "storno"}
        onSchliessen={zu}
        titel={`${b.name} stornieren?`}
        text="Erst stornieren, wenn der Hersteller den Storno bestätigt hat. Der Beleg gehört in den Verlauf."
        groesse="sm"
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>Abbrechen</Knopf>
            <Knopf variant="danger-solid" laedt={laeuft} disabled={grund.trim().length < 5} onClick={async () => (await sofort(() => bestellWorkflowAction({ name: b.name, aktion: "Stornieren", grund }), { ok: "Bestellung storniert" }))?.ok && zu()}>
              Stornieren
            </Knopf>
          </>
        }
      >
        <div className="bo-sor-feld">
          <label htmlFor="st-grund">Grund (Pflicht)</label>
          <input id="st-grund" className="bo-sor-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} />
        </div>
      </Dialog>

      <Dialog
        offen={offen === "lieferant"}
        onSchliessen={zu}
        titel="Lieferant zuordnen"
        groesse="sm"
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>Abbrechen</Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={!lf} onClick={async () => (await sofort(() => bestellungLieferantAction({ name: b.name, lieferant: lf }), { ok: "Lieferant zugeordnet" }))?.ok && zu()}>
              Zuordnen
            </Knopf>
          </>
        }
      >
        <div className="bo-sor-feld">
          <label htmlFor="lf-wahl">Lieferant</label>
          <select id="lf-wahl" className="bo-sor-eingabe" value={lf} onChange={(e) => setLf(e.target.value)}>
            <option value="">Bitte wählen</option>
            {lieferanten.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name}
                {l.marke ? ` (${l.marke})` : ""}
              </option>
            ))}
          </select>
        </div>
      </Dialog>
    </div>
  );
}
