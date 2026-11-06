"use client";
// Termin-Akte (§ 3.7): Primärknopf je Status (Bestätigen ▾ · Protokoll schreiben · Raum öffnen · Verschieben),
// Menü ⋯ mit Absagen/Verschieben/Nicht erschienen/Ohne Protokoll/Wieder bestätigen, Countdown „reserviert bis“.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf, { RundKnopf } from "../Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { AbsagenDialog, AufgabeDialog } from "./Dialoge";
import { VerschiebenDialog } from "./TerminDialoge";
import { useCrmAktion } from "./useCrmAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { meetAction, protokollSchreibenAction, terminAbschliessenAction, terminBestaetigenAction, wiederBestaetigenAction } from "@/lib/backoffice/crm/actions";

export function TerminAktionen({ termin, berater = [], ich, leitung, jetzt: jetztIso }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const [dialog, setDialog] = useState(null);
  const t = termin;
  const objekt = { doctype: "PH Termin", name: t.name };
  const gestartet = new Date(String(t.start).replace(" ", "T")) <= (jetztIso ? new Date(jetztIso) : new Date());
  const bestaetigen = (mail) => fuehre(() => terminBestaetigenAction({ name: t.name, mail }), { text: mail && t.email ? T.toast.bestaetigtMail(t.email.replace(/^(.).*@/, "$1***@")) : T.toast.bestaetigt, fehlerText: "Bestätigen", objekt });
  const protokoll = async () => {
    if (t.beratungsgespraech) return router.push(`/crm/gespraeche/${encodeURIComponent(t.beratungsgespraech)}`);
    const r = await fuehre(() => protokollSchreibenAction({ termin: t.name }), { fehlerText: T.knopf.protokoll });
    if (r?.ok && r.name) router.push(`/crm/gespraeche/${encodeURIComponent(r.name)}`);
  };
  useKuerzel("akte", { "crm.bestaetigen": () => t.status === "Unbestaetigt" && bestaetigen(true), "crm.umbuchen": () => setDialog("verschieben"), "crm.absagen": () => setDialog("absagen"), "crm.aufgabe": () => setDialog("aufgabe") });

  let primaer = null;
  if (t.status === "Unbestaetigt") primaer = <Knopf variant="primary" icon="Check" laedt={laeuft} onClick={() => bestaetigen(true)} kuerzel="Umschalt+B" data-testid="crm-termin-bestaetigen">{T.knopf.bestaetigen}</Knopf>;
  else if (t.status === "Bestaetigt" && gestartet) primaer = <Knopf variant="primary" icon="PenTool" laedt={laeuft} onClick={protokoll} data-testid="crm-termin-protokoll">{T.knopf.protokoll}</Knopf>;
  else if (t.status === "Bestaetigt" && t.modus === "Video" && t.meet_url) primaer = <Knopf variant="primary" icon="Monitor" href={t.meet_url}>{T.knopf.raumOeffnen}</Knopf>;
  else if (t.status === "Bestaetigt") primaer = <Knopf variant="primary" icon="CalendarDays" onClick={() => setDialog("verschieben")}>{T.knopf.verschieben}</Knopf>;
  else if (t.status === "Erledigt" && !t.beratungsgespraech) primaer = <Knopf variant="primary" icon="PenTool" laedt={laeuft} onClick={protokoll}>{T.knopf.protokollAnlegen}</Knopf>;

  const aktiv = ["Unbestaetigt", "Bestaetigt"].includes(t.status);
  return (
    <div className="flex items-center gap-2">
      {primaer}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Weitere Aktionen" testid="crm-termin-menue" />}>
        {t.status === "Unbestaetigt" && <MenuePunkt icon="Check" onWaehlen={() => bestaetigen(false)}>{T.knopf.ohneMail}</MenuePunkt>}
        {aktiv && <MenuePunkt icon="CalendarDays" kuerzel="Umschalt+U" onWaehlen={() => setDialog("verschieben")}>{T.knopf.verschieben}</MenuePunkt>}
        {t.status === "Bestaetigt" && <MenuePunkt icon="CircleCheck" onWaehlen={() => fuehre(() => terminAbschliessenAction({ termin: t.name }), { text: T.toast.abgeschlossen, objekt })}>{T.knopf.ohneProtokoll}</MenuePunkt>}
        {t.status === "Bestaetigt" && <MenuePunkt icon="CircleX" onWaehlen={() => fuehre(() => terminAbschliessenAction({ termin: t.name, art: "nicht-erschienen" }), { text: T.toast.nichtErschienen, objekt })}>{T.knopf.nichtErschienen}</MenuePunkt>}
        {t.status === "Nicht erschienen" && (leitung ? <MenuePunkt icon="RotateCcw" onWaehlen={() => fuehre(() => wiederBestaetigenAction({ termin: t.name }), { text: T.toast.bestaetigt })}>{T.knopf.wiederBestaetigen}</MenuePunkt> : <MenuePunkt icon="RotateCcw" deaktiviert grund="Nur die Leitung">{T.knopf.wiederBestaetigen}</MenuePunkt>)}
        {aktiv && t.modus === "Video" && !t.meet_url && <MenuePunkt icon="Monitor" onWaehlen={() => fuehre(() => meetAction({ termin: t.name }), { text: "Videoraum erzeugt" })}>{T.knopf.raumErzeugen}</MenuePunkt>}
        <MenuePunkt icon="CheckSquare" kuerzel="Umschalt+A" onWaehlen={() => setDialog("aufgabe")}>{T.knopf.aufgabeAnlegen}</MenuePunkt>
        {aktiv && <MenueTrenner />}
        {aktiv && <MenuePunkt icon="X" gefaehrlich kuerzel="Umschalt+X" onWaehlen={() => setDialog("absagen")}>{T.knopf.absagen}</MenuePunkt>}
      </Menue>
      {dialog === "absagen" && <AbsagenDialog offen onSchliessen={() => setDialog(null)} termin={t} leitung={leitung} />}
      {dialog === "verschieben" && <VerschiebenDialog offen onSchliessen={() => setDialog(null)} termin={t} berater={berater} />}
      {dialog === "aufgabe" && <AufgabeDialog offen onSchliessen={() => setDialog(null)} bezug={objekt} kontakt={t.kontakt} berater={berater} ich={ich} />}
    </div>
  );
}

/** Countdown „reserviert bis 10:42“ – Ansage nur bei 5 min, 1 min, abgelaufen. */
export function Countdown({ bis }) {
  const [rest, setRest] = useState(null);
  useEffect(() => {
    const ziel = new Date(String(bis).replace(" ", "T")).getTime();
    const f = () => setRest(Math.round((ziel - Date.now()) / 1000));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, [bis]);
  const zeit = String(bis).slice(11, 16);
  if (rest == null) return <span className="text-[13px] text-bo-text-soft">{T.termine.reserviert(zeit)}</span>;
  const m = Math.floor(Math.abs(rest) / 60);
  const s = Math.abs(rest) % 60;
  return (
    <span className="text-[13px] tabular-nums text-bo-text-soft" aria-live="off">
      {T.termine.reserviert(zeit)} {rest <= 0 ? `(${T.termine.abgelaufen})` : `· noch ${m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${String(s).padStart(2, "0")}`}`}
    </span>
  );
}
