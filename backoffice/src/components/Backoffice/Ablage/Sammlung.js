"use client";
// Sammelansichten ohne Ordner (Konzept §3.4): Zuletzt (gruppiert Heute · Gestern · Diese Woche · Älter) und
// Papierkorb (Restzeit je Datei, Wiederherstellen mit Rückgängig, endgültig löschen nur Ablage-Leitung).
// Gleiches Raster/Panel wie die Drive-Seite, links der Ordnerbaum.

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Leer from "../Leer";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { useToast } from "../Toast";
import { resttage, zeitGruppe } from "@/lib/backoffice/ablage/regeln";
import { wiederherstellenVieleAction } from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";
import Dateien from "./Dateien";
import DateiPanel from "./DateiPanel";
import Ordnerbaum from "./Ordnerbaum";
import useDateiWerkzeug from "./DateiWerkzeug";

const GRUPPEN = [
  ["heute", "Heute"],
  ["gestern", "Gestern"],
  ["woche", "Diese Woche"],
  ["aelter", "Älter"],
];

export default function Sammlung({ variante, items: start, wurzeln, zaehler, info, user, rollen, schreiben, namen = {}, ordnerTitel = {}, ansicht = "raster", linkMailen, leer }) {
  const router = useRouter();
  const pfad = usePathname();
  const { zeige } = useToast();
  const [quelle, setQuelle] = useState(start);
  const [items, setItems] = useState(start);
  if (quelle !== start) {
    setQuelle(start);
    setItems(start);
  }
  const [panel, setPanel] = useState(null);
  const werkzeug = useDateiWerkzeug({
    info,
    rollen,
    user,
    schreiben,
    linkMailen,
    onGeaendert: (d) => setItems((l) => l.map((x) => (x.datei === d.datei ? { ...x, ...d } : x))),
    onEntfernt: (d) => {
      setItems((l) => l.filter((x) => x.datei !== d.datei));
      setPanel((p) => (p === d.datei ? null : p));
    },
  });
  const panelDatei = items.find((x) => x.datei === panel) || null;
  const korb = variante === "papierkorb";
  const zusatz = korb ? (d) => T.status.papierkorb(resttage(d.papierkorb_bis)) : undefined;
  const gemeinsam = { ansicht, aktiv: panel, onWaehle: (d) => setPanel((p) => (p === d.datei ? null : d.datei)), werkzeug, user, namen, info, mitOrdner: true, ordnerTitel, zusatz };

  const alleWiederherstellen = async () => {
    const liste = items.filter((d) => werkzeug.rechte(d).wiederherstellen.an).map((d) => d.datei);
    if (!liste.length) return;
    const r = await wiederherstellenVieleAction({ dateien: liste });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    zeige(`${r.daten.ok.length} Dateien wiederhergestellt`, { art: "ok" });
    router.refresh();
  };

  let inhalt;
  if (!items.length) inhalt = <Leer art={korb ? "erledigt" : "leer"} titel={leer.titel} text={leer.text || undefined} testid="abl-leer" />;
  else if (korb)
    inhalt = (
      <section className="bo-abl-abschnitt" aria-labelledby="abl-korb-titel">
        <div className="bo-abl-abschnitt__kopf">
          <h2 id="abl-korb-titel" className="bo-abl-abschnitt__titel">
            {T.inhalt.anzahl(items.length)}
          </h2>
          {schreiben && items.length > 1 && (
            <Knopf size="s" variant="ghost" icon="RotateCcw" onClick={alleWiederherstellen}>
              Alle wiederherstellen
            </Knopf>
          )}
        </div>
        <p className="bo-abl-hinweis px-1">{T.papierkorb.nurLeitung}</p>
        <Dateien items={items} {...gemeinsam} testid="abl-papierkorb" />
      </section>
    );
  else
    inhalt = GRUPPEN.map(([k, titel]) => {
      const teil = items.filter((d) => zeitGruppe(d.geaendert) === k);
      if (!teil.length) return null;
      return (
        <section key={k} className="bo-abl-abschnitt" aria-labelledby={`abl-gruppe-${k}`}>
          <div className="bo-abl-abschnitt__kopf">
            <h2 id={`abl-gruppe-${k}`} className="bo-abl-abschnitt__titel">
              {titel}
            </h2>
            <span className="bo-abl-abschnitt__unter">{T.inhalt.anzahl(teil.length)}</span>
          </div>
          <Dateien items={teil} {...gemeinsam} testid={`abl-zuletzt-${k}`} />
        </section>
      );
    });

  return (
    <div className="bo-abl-drive" data-panel={panelDatei ? "offen" : undefined}>
      <div className="hidden min-w-0 lg:block">
        <Ordnerbaum wurzeln={wurzeln} aktiv={null} href={(o) => `/ablage?ordner=${encodeURIComponent(o)}`} zaehler={zaehler} seite={variante} />
      </div>
      <div className="bo-abl-spalte">
        <div className="bo-abl-werkzeuge">
          <div className="bo-abl-werkzeuge__rechts">
            <Segment
              label={T.werkzeuge.ansicht}
              aktiv={ansicht}
              groesse="s"
              optionen={[
                { wert: "raster", titel: T.werkzeuge.raster, href: pfad, icon: "LayoutDashboard" },
                { wert: "liste", titel: T.werkzeuge.liste, href: `${pfad}?ansicht=liste`, icon: "Rows3" },
              ]}
            />
          </div>
        </div>
        {inhalt}
      </div>
      {panelDatei && <DateiPanel datei={panelDatei} info={info} user={user} namen={namen} werkzeug={werkzeug} onSchliessen={() => setPanel(null)} pfad={ordnerTitel[panelDatei.ordner] || null} />}
      {werkzeug.dialoge}
    </div>
  );
}
