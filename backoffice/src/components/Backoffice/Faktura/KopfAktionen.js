"use client";
// Seitenkopf-Aktionen des Bereichs Faktura, die ein Sheet oder einen Dialog öffnen (Primäraktion je Seite, Q-C1):
// Angebot anlegen, Eingangsrechnung erfassen, Auszug importieren, Neuer Export, Neu ▾ (Bereichsstart), Mahnen (n).
// Öffnet über ?panel=… (Deep-Link, usePanel) – „Zu tun“ kann so direkt in die Aktion springen.

import { useEffect, useState } from "react";
import Knopf from "../Knopf";
import { Menue, MenuePunkt, usePanel } from "../Overlay";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { AKTION, SEITE } from "@/lib/backoffice/faktura/texte";
import { AngebotAnlegenDialog, ErNeuSheet, ImportSheet, ExportSheet } from "./DialogeVorgang";
import { useFaktura } from "./Aktionen";

/**
 * @param {{art:"angebot"|"er"|"import"|"export"|"neu"|"mahnen", primaer?:boolean, daten?:object, anzahl?:number}} p
 */
export default function KopfAktion({ art, primaer = true, daten = {}, anzahl }) {
  const { ausfuehren } = useFaktura();
  const panelName = { angebot: "angebot", er: "neu", import: "import", export: "export", neu: "neu-angebot" }[art] || art;
  const [offen, setOffen] = usePanel(panelName);
  const [angebotOffen, setAngebotOffen] = useState(false);
  const variant = primaer ? "primary" : "secondary";

  useKuerzel("akte", {
    "akte.primaer": () => {
      if (!primaer) return false;
      if (art === "mahnen") ausfuehren("mahnen-alle", {});
      else setOffen(true);
    },
  });

  useEffect(() => {
    if (art === "neu" && offen) {
      setAngebotOffen(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [art, offen]);

  if (art === "mahnen")
    return (
      <Knopf variant={variant} icon="TriangleAlert" onClick={() => ausfuehren("mahnen-alle", {})} data-testid="kopf-mahnen" disabled={!anzahl}>
        {`${AKTION.mahnen}${anzahl ? ` (${anzahl})` : ""}`}
      </Knopf>
    );

  if (art === "neu")
    return (
      <>
        <Menue label={SEITE.neu} ausloeser={(p) => <Knopf {...p} variant={variant} icon="Plus" iconRechts="ChevronDown" data-testid="kopf-neu">{SEITE.neu}</Knopf>}>
          <MenuePunkt icon="FileText" onWaehlen={() => setAngebotOffen(true)}>{SEITE.neuAngebot}</MenuePunkt>
          <MenuePunkt icon="Receipt" href="/faktura/auftraege?r=nicht-abgerechnet">{SEITE.neuRechnung}</MenuePunkt>
          <MenuePunkt icon="Inbox" href="/faktura/eingangsrechnungen?panel=neu">{SEITE.neuEr}</MenuePunkt>
        </Menue>
        {angebotOffen && <AngebotAnlegenDialog offen onSchliessen={() => { setAngebotOffen(false); setOffen(false); }} kontakte={daten.kontakte} projekte={daten.projekte} bedingungen={daten.bedingungen} />}
      </>
    );

  const titel = { angebot: AKTION.angebotAnlegen, er: AKTION.erErfassen, import: AKTION.importieren, export: AKTION.exportNeu }[art];
  const icon = { angebot: "Plus", er: "Plus", import: "Download", export: "Download" }[art];
  return (
    <>
      <Knopf variant={variant} icon={icon} onClick={() => setOffen(true)} kuerzel={primaer ? "⌘↵" : undefined} data-testid={`kopf-${art}`}>
        {titel}
      </Knopf>
      {art === "angebot" && offen && <AngebotAnlegenDialog offen onSchliessen={() => setOffen(false)} kontakte={daten.kontakte} projekte={daten.projekte} bedingungen={daten.bedingungen} vorgabe={daten.vorgabe} />}
      {art === "er" && <ErNeuSheet offen={offen} onSchliessen={() => setOffen(false)} projekte={daten.projekte} />}
      {art === "import" && <ImportSheet offen={offen} onSchliessen={() => setOffen(false)} konten={daten.konten} autoErlaubt={daten.autoErlaubt} />}
      {art === "export" && <ExportSheet offen={offen} onSchliessen={() => setOffen(false)} vorschlag={daten.vorschlag} pruefung={daten.pruefung} format={daten.format} />}
    </>
  );
}
