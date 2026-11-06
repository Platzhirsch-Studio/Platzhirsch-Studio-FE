"use client";
// Anfrage-Akte (§ 3.4): Kopf-Aktionen (eine Empfehlung in Tinte + Menü ⋯), Details-Panel mit Autosave je Feld,
// Kunde zuordnen (Vorschläge aus der Dublettenprüfung zuerst, letzter Eintrag „Neu anlegen“).

import { useEffect, useState } from "react";
import Knopf, { RundKnopf } from "../Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Datumsfeld from "../Formular/Datumsfeld";
import { VerlorenDialog, AufgabeDialog, MailDialog } from "./Dialoge";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { useCrmAktion } from "./useCrmAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { annehmenAction, anfrageFeldAction, dublettenAction, gewonnenAction, kundeZuordnenAction, nachfassenAction, spamAction, zurueckAufNeuAction } from "@/lib/backoffice/crm/actions";
import { centAlsEingabe, euroZuCent } from "@/lib/backoffice/format";

/** Kopfaktionen der Anfrage. `empfehlung` aus vorgang.empfehlung(). */
export function AnfrageAktionen({ anfrage, empfehlung, berater = [], ich, leitung, terminHref, angebotHref }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [dialog, setDialog] = useState(null);
  const objekt = { doctype: "PH Anfrage", name: anfrage.name };
  const offen = ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"].includes(anfrage.status);
  useKuerzel("akte", { "crm.termin": () => setDialog("termin"), "crm.aufgabe": () => setDialog("aufgabe"), "crm.mail": () => anfrage.email && setDialog("mail") });

  let primaer = null;
  if (empfehlung?.id === "annehmen") primaer = <Knopf variant="primary" icon="Check" laedt={laeuft} kuerzel="Strg+Enter" onClick={() => fuehre(() => annehmenAction({ namen: [anfrage.name] }), { text: T.toast.angenommen, fehlerText: "Annehmen", objekt })} data-testid="crm-akte-primaer">{T.knopf.annehmen}</Knopf>;
  else if (empfehlung?.id === "termin" || empfehlung?.id === "neuerTermin") primaer = <Knopf variant="primary" icon="CalendarPlus" onClick={() => setDialog("termin")} data-testid="crm-akte-primaer">{empfehlung.titel}</Knopf>;
  else if (empfehlung?.id === "terminOeffnen" && terminHref) primaer = <Knopf variant="primary" icon="CalendarDays" href={terminHref} data-testid="crm-akte-primaer">Termin öffnen</Knopf>;
  else if (empfehlung?.id === "angebotOeffnen" && angebotHref) primaer = <Knopf variant="primary" icon="FileText" href={angebotHref} data-testid="crm-akte-primaer">{T.knopf.angebotOeffnen}</Knopf>;

  return (
    <div className="flex items-center gap-2">
      {primaer}
      <Menue label="Weitere Aktionen" ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label="Weitere Aktionen" testid="crm-akte-menue" />}>
        <MenuePunkt icon="CalendarPlus" kuerzel="Umschalt+T" onWaehlen={() => setDialog("termin")}>{T.knopf.termin}</MenuePunkt>
        <MenuePunkt icon="CheckSquare" kuerzel="Umschalt+A" onWaehlen={() => setDialog("aufgabe")}>{T.knopf.aufgabeAnlegen}</MenuePunkt>
        <MenuePunkt icon="Mail" deaktiviert={!anfrage.email} grund={anfrage.email ? undefined : "Keine E-Mail-Adresse in der Anfrage"} onWaehlen={() => setDialog("mail")}>{T.knopf.mailSchreiben}</MenuePunkt>
        <MenuePunkt icon="FileText" href={`/d/ph-angebot/neu?anfrage=${encodeURIComponent(anfrage.name)}${anfrage.kontakt ? `&kontakt=${encodeURIComponent(anfrage.kontakt)}` : ""}`}>{T.knopf.angebotAnlegen}</MenuePunkt>
        {anfrage.status === "Angebot" && <MenuePunkt icon="BadgeCheck" onWaehlen={() => fuehre(() => gewonnenAction({ name: anfrage.name }), { text: T.knopf.gewonnen })}>{T.knopf.gewonnen}</MenuePunkt>}
        <MenueTrenner />
        {offen && <MenuePunkt icon="CircleX" onWaehlen={() => setDialog("verloren")}>{T.knopf.verloren}</MenuePunkt>}
        {anfrage.status === "Neu" && <MenuePunkt icon="ShieldAlert" gefaehrlich onWaehlen={() => fuehre(() => spamAction({ namen: [anfrage.name] }), { text: T.toast.spam, fehlerText: "Spam", objekt })}>{T.knopf.spam}</MenuePunkt>}
        {["Qualifiziert", "Verloren", "Spam"].includes(anfrage.status) && (leitung
          ? <MenuePunkt icon="RotateCcw" onWaehlen={() => fuehre(() => zurueckAufNeuAction({ name: anfrage.name }), { text: "Zurück auf Neu" })}>{T.knopf.zurueckAufNeu}</MenuePunkt>
          : <MenuePunkt icon="RotateCcw" deaktiviert grund="Nur die Leitung – bitte über „Leitung bitten“ in der Glocke anfragen">{T.knopf.zurueckAufNeu}</MenuePunkt>)}
        <MenuePunkt icon="Printer" onWaehlen={() => window.print()}>{T.knopf.drucken}</MenuePunkt>
      </Menue>
      {dialog === "verloren" && <VerlorenDialog offen onSchliessen={() => setDialog(null)} anfrage={{ ...anfrage, titelKurz: anfrage.person }} />}
      {dialog === "aufgabe" && <AufgabeDialog offen onSchliessen={() => setDialog(null)} bezug={objekt} kontakt={anfrage.kontakt} berater={berater} ich={ich} />}
      {dialog === "mail" && <MailDialog offen onSchliessen={() => setDialog(null)} an={anfrage.email} bezug={anfrage.kontakt ? { doctype: "PH Kontakt", name: anfrage.kontakt } : objekt} betreff={`Ihre Anfrage bei Platzhirsch`} />}
      {dialog === "termin" && <TerminAnlegenDialog offen onSchliessen={() => setDialog(null)} anfrage={{ name: anfrage.name, titel: anfrage.person, email: anfrage.email, modus: anfrage.ort_der_beratung, zugewiesen_an: anfrage.zugewiesen_an, thema: anfrage.projektart, wunschzeiten: anfrage.wunschzeiten }} berater={berater} ich={ich} />}
    </div>
  );
}

/** Ein Feld mit Autosave beim Verlassen (Speicheranzeige § 2.7 je Feld). */
export function AutoFeld({ label, wert, onSpeichern, art = "text", optionen = [], gesperrt, hinweis, testid }) {
  const [w, setW] = useState(wert ?? "");
  const [vorher, setVorher] = useState(wert);
  const [status, setStatus] = useState("");
  if (vorher !== wert) {
    setVorher(wert);
    setW(wert ?? "");
  }
  const speichern = async (neu) => {
    if (String(neu ?? "") === String(wert ?? "")) return;
    setStatus("speichert");
    const r = await onSpeichern(neu);
    setStatus(r?.ok ? "gespeichert" : "fehler");
  };
  const anzeige = status === "speichert" ? "Speichert …" : status === "gespeichert" ? "Gespeichert" : status === "fehler" ? "Nicht gespeichert" : "";
  return (
    <div className="bo-crm-feld" data-eingelassen="">
      <span className="flex items-center justify-between gap-2">{label}{anzeige && <em className={`not-italic text-[12px] ${status === "fehler" ? "text-bo-danger-text" : "text-bo-text-faint"}`} role="status">{anzeige}</em>}</span>
      {art === "select" ? (
        <select value={w} disabled={gesperrt} onChange={(e) => (setW(e.target.value), speichern(e.target.value))} data-testid={testid}>
          {optionen.map((o) => <option key={o.wert} value={o.wert}>{o.titel}</option>)}
        </select>
      ) : art === "datum" ? (
        <Datumsfeld value={w} onChange={(v) => (setW(v), speichern(v))} disabled={gesperrt} aria-label={label} />
      ) : (
        <input value={w} disabled={gesperrt} onChange={(e) => setW(e.target.value)} onBlur={() => speichern(w)} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} data-testid={testid} inputMode={art === "betrag" ? "decimal" : undefined} />
      )}
      {hinweis && <em className="bo-crm-feld__hinweis not-italic">{hinweis}</em>}
    </div>
  );
}

/** Details-Panel der Anfrage (Autosave je Feld). */
export function AnfrageDetails({ anfrage, nachfassen, berater = [], gesperrt }) {
  const { zeige } = useCrmAktion();
  const feld = (f) => async (wert) => {
    const r = await anfrageFeldAction({ name: anfrage.name, feld: f, wert });
    if (!r?.ok) zeige(r?.message || T.fehler.unbekannt, { art: "fehler" });
    return r;
  };
  const A = T.anfrageAkte.felder;
  return (
    <div className="grid gap-4" data-testid="crm-anfrage-details">
      {gesperrt && <p className="rounded-[14px] bg-bo-fill px-3 py-2 text-[13px] text-bo-text-soft">{T.anfrageAkte.gesperrt}</p>}
      <AutoFeld label={A.zustaendig} art="select" wert={anfrage.zugewiesen_an || ""} gesperrt={gesperrt} onSpeichern={feld("zugewiesen_an")} optionen={[{ wert: "", titel: T.anfragen.niemand }, ...berater, ...(anfrage.zugewiesen_an && !berater.some((b) => b.wert === anfrage.zugewiesen_an) ? [{ wert: anfrage.zugewiesen_an, titel: anfrage.zugewiesen_an }] : [])]} testid="crm-feld-zustaendig" />
      <AutoFeld label={A.prioritaet} art="select" wert={anfrage.prioritaet || "Normal"} gesperrt={gesperrt} onSpeichern={feld("prioritaet")} optionen={["Normal", "Hoch", "Niedrig"].map((p) => ({ wert: p, titel: p }))} />
      <AutoFeld label={A.nachfassen} art="datum" wert={nachfassen || ""} gesperrt={gesperrt} onSpeichern={(d) => (d ? nachfassenAction({ anfrage: anfrage.name, datum: d }) : Promise.resolve({ ok: true }))} />
      <AutoFeld label={A.vereinbart} wert={anfrage.naechster_schritt || ""} gesperrt={gesperrt} onSpeichern={feld("naechster_schritt")} />
      <AutoFeld label={A.ort} art="select" wert={anfrage.ort_der_beratung || ""} gesperrt={gesperrt} onSpeichern={feld("ort_der_beratung")} optionen={[{ wert: "", titel: "–" }, ...["Showroom", "Vor Ort", "Video", "Offen"].map((o) => ({ wert: o, titel: o }))]} />
      <AutoFeld label={A.budget} wert={anfrage.budget_hinweis || ""} gesperrt={gesperrt} onSpeichern={feld("budget_hinweis")} hinweis={T.anfrageAkte.budgetHinweis} />
      <AutoFeld label={A.wert} art="betrag" wert={centAlsEingabe(anfrage.wert_cent)} gesperrt={gesperrt} onSpeichern={(v) => feld("wert_cent")(euroZuCent(v) || 0)} />
    </div>
  );
}

/** Kunde zuordnen (§ 3.4): Vorschläge aus find_duplicates, sonst neu aus der Anfrage. */
export function KundeZuordnen({ anfrage }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [vorschlaege, setVorschlaege] = useState(null);
  useEffect(() => {
    let weg = false;
    dublettenAction({ email: anfrage.email, telefon: anfrage.telefon, nachname: anfrage.nachname }).then((r) => !weg && setVorschlaege(r?.ok ? r.treffer : []));
    return () => {
      weg = true;
    };
  }, [anfrage.email, anfrage.telefon, anfrage.nachname]);
  return (
    <div className="grid gap-2" data-testid="crm-kunde-zuordnen">
      <p className="text-[14px] text-bo-text-soft">{T.anfrageAkte.keinKunde}</p>
      {vorschlaege?.slice(0, 2).map((v) => (
        <div key={v.name} className="flex items-center justify-between gap-3 rounded-[16px] bg-bo-surface-2 px-4 py-3">
          <span className="min-w-0 text-[14px]"><strong className="font-semibold">{v.titel}</strong> <span className="text-bo-text-soft">· {v.grund}</span></span>
          <Knopf size="s" variant="secondary" laedt={laeuft} onClick={() => fuehre(() => kundeZuordnenAction({ anfrage: anfrage.name, kontakt: v.name }), { text: T.toast.kundeZugeordnet(v.titel) })}>{T.knopf.zuordnen}</Knopf>
        </div>
      ))}
      <div>
        <Knopf size="s" variant="ghost" icon="UserPlus" laedt={laeuft} onClick={() => fuehre(() => kundeZuordnenAction({ anfrage: anfrage.name, neu: true }), { text: T.toast.kundeZugeordnet(anfrage.person || "") })} data-testid="crm-kunde-neu">{T.knopf.neuAnlegen}</Knopf>
      </div>
    </div>
  );
}
