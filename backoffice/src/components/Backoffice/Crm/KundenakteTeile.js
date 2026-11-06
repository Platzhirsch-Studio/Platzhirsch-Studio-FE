"use client";
// Kundenakte (§ 4): Kopfaktionen (Glas-Knöpfe auf dem Hero + Menü ⋯), Details-Panel mit Autosave je Feld,
// Composer für interne Kommentare (Strg/⌘+Enter), Filter-Chips der Zeitleiste.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { GlasKnopf } from "../Akte";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { AufgabeDialog, MailDialog, WiderspruchDialog, DatenschutzDialog } from "./Dialoge";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { AutoFeld } from "./AnfrageTeile";
import { useCrmAktion } from "./useCrmAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { kommentarAction, kontaktFeldAction, kontaktStatusAction } from "@/lib/backoffice/crm/actions";

/** Glas-Aktionen auf dem Hero + Menü; Dialoge darunter. */
export function KundenakteAktionen({ kontakt, berater = [], ich, mailFaehig = true, mailGrund }) {
  const [dialog, setDialog] = useState(null);
  const { fuehre } = useCrmAktion();
  const k = kontakt;
  const widerspruch = !!Number(k.nicht_kontaktieren);
  useKuerzel("akte", { "crm.termin": () => setDialog("termin"), "crm.aufgabe": () => setDialog("aufgabe"), "crm.mail": () => k.email && setDialog("mail") });
  return (
    <>
      {(k.telefon || k.mobil) && <GlasKnopf icon="Phone" href={`tel:${String(k.telefon || k.mobil).replace(/[^\d+]/g, "")}`}>{T.knopf.anrufen}</GlasKnopf>}
      {k.email ? <GlasKnopf icon="Mail" onClick={() => setDialog("mail")} testid="crm-akte-mail">E-Mail</GlasKnopf> : <GlasKnopf icon="Mail" deaktiviert grund={T.mails.senden.ohneMail}>E-Mail</GlasKnopf>}
      <GlasKnopf icon="CalendarDays" hell onClick={() => setDialog("termin")} testid="crm-akte-termin">{T.knopf.terminKurz}</GlasKnopf>
      <Menue label="Weitere Aktionen" ausloeser={(p) => <button type="button" {...p} className="bo-glas grid size-10 place-items-center rounded-pill" aria-label="Weitere Aktionen" data-testid="crm-kundenakte-menue"><span aria-hidden="true">···</span></button>}>
        <MenuePunkt icon="CheckSquare" kuerzel="Umschalt+A" onWaehlen={() => setDialog("aufgabe")}>{T.knopf.aufgabeAnlegen}</MenuePunkt>
        <MenuePunkt icon="Inbox" href={`/crm/anfragen?neu=1`}>{T.knopf.neueAnfrage}</MenuePunkt>
        <MenuePunkt icon="FileText" href={`/d/ph-angebot/neu?kontakt=${encodeURIComponent(k.name)}`}>{T.knopf.angebotAnlegen}</MenuePunkt>
        {k.status === "Interessent" && <MenuePunkt icon="BadgeCheck" onWaehlen={() => fuehre(() => kontaktStatusAction({ name: k.name, aktion: "kunde" }), { text: T.toast.kunde })}>{T.knopf.alsKunde}</MenuePunkt>}
        <MenueTrenner />
        {!widerspruch && <MenuePunkt icon="ShieldAlert" onWaehlen={() => setDialog("widerspruch")}>{T.knopf.widerspruch}</MenuePunkt>}
        <MenuePunkt icon="Shield" onWaehlen={() => setDialog("dsa")}>{T.knopf.datenschutzanfrage}</MenuePunkt>
        <MenuePunkt icon="Undo2" deaktiviert grund="Noch nicht verfügbar – Kommentar und Aufgabe an die Faktura">{T.knopf.ruecktritt}</MenuePunkt>
        <MenuePunkt icon="Users" deaktiviert grund="Nur die Leitung, über den Hinweis „ähnlicher Kontakt“">{T.knopf.zusammenfuehren}</MenuePunkt>
      </Menue>
      {dialog === "mail" && <MailDialog offen onSchliessen={() => setDialog(null)} an={k.email} bezug={{ doctype: "PH Kontakt", name: k.name }} widerspruch={widerspruch} grund={mailFaehig ? undefined : mailGrund} />}
      {dialog === "termin" && <TerminAnlegenDialog offen onSchliessen={() => setDialog(null)} kontakt={{ name: k.name, titel: k.titel, email: k.email }} berater={berater} ich={ich} />}
      {dialog === "aufgabe" && <AufgabeDialog offen onSchliessen={() => setDialog(null)} bezug={{ doctype: "PH Kontakt", name: k.name }} kontakt={k.name} berater={berater} ich={ich} />}
      {dialog === "widerspruch" && <WiderspruchDialog offen onSchliessen={() => setDialog(null)} kontakt={k.name} />}
      {dialog === "dsa" && <DatenschutzDialog offen onSchliessen={() => setDialog(null)} kontakt={k.name} />}
    </>
  );
}

/** Details-Panel (§ 4.4) – Autosave je Feld; Intern (permlevel 1) nur Leitung/GF. */
export function KontaktDetails({ kontakt, berater = [], leitung }) {
  const { zeige } = useCrmAktion();
  const k = kontakt;
  const feld = (f) => async (wert) => {
    const r = await kontaktFeldAction({ name: k.name, feld: f, wert });
    if (!r?.ok) zeige(r?.message || T.fehler.unbekannt, { art: "fehler" });
    return r;
  };
  const gesperrt = !!k.anonymisiert_am;
  return (
    <div className="grid gap-4" data-testid="crm-kontakt-details">
      <AutoFeld label="Berater" art="select" wert={k.berater || ""} onSpeichern={feld("berater")} gesperrt={gesperrt} optionen={[{ wert: "", titel: "–" }, ...berater, ...(k.berater && !berater.some((b) => b.wert === k.berater) ? [{ wert: k.berater, titel: k.berater }] : [])]} />
      <AutoFeld label="Bevorzugt" art="select" wert={k.kommunikation_bevorzugt || "E-Mail"} onSpeichern={feld("kommunikation_bevorzugt")} gesperrt={gesperrt} optionen={["E-Mail", "Telefon", "WhatsApp", "Brief"].map((x) => ({ wert: x, titel: x }))} />
      <AutoFeld label={T.dialog.email} wert={k.email || ""} onSpeichern={feld("email")} gesperrt={gesperrt} testid="crm-kontakt-email" />
      <AutoFeld label={T.dialog.telefon} wert={k.telefon || ""} onSpeichern={feld("telefon")} gesperrt={gesperrt} />
      <AutoFeld label="Mobil" wert={k.mobil || ""} onSpeichern={feld("mobil")} gesperrt={gesperrt} />
      <AutoFeld label={T.dialog.strasse} wert={k.strasse || ""} onSpeichern={feld("strasse")} gesperrt={gesperrt} />
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
        <AutoFeld label={T.dialog.plz} wert={k.plz || ""} onSpeichern={feld("plz")} gesperrt={gesperrt} />
        <AutoFeld label={T.dialog.ort} wert={k.ort || ""} onSpeichern={feld("ort")} gesperrt={gesperrt} />
      </div>
      <AutoFeld label="Sprache" art="select" wert={k.sprache || "de"} onSpeichern={feld("sprache")} gesperrt={gesperrt} optionen={[["de", "Deutsch"], ["en", "Englisch"], ["fr", "Französisch"], ["it", "Italienisch"]].map(([wert, titel]) => ({ wert, titel }))} />
      {leitung && (
        <div data-intern="">
          <AutoFeld label={T.akte.intern} wert={String(k.notizen || "").replace(/<[^>]*>/g, "")} onSpeichern={feld("notizen")} hinweis={T.akte.internHinweis} />
        </div>
      )}
    </div>
  );
}

/** Composer für interne Kommentare (§ 4.6). */
export function Composer({ kontakt }) {
  const [text, setText] = useState("");
  const { fuehre, laeuft } = useCrmAktion();
  const router = useRouter();
  const senden = async () => {
    if (!text.trim()) return;
    const r = await fuehre(() => kommentarAction({ doctype: "PH Kontakt", name: kontakt, inhalt: text }), { text: T.toast.kommentar });
    if (r?.ok) {
      setText("");
      router.refresh();
    }
  };
  return (
    <div className="grid gap-2 rounded-[20px] bg-bo-surface-2 p-3" data-testid="crm-composer">
      <label className="sr-only" htmlFor="crm-composer">{T.akte.composer}</label>
      <textarea id="crm-composer" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={T.akte.composerPlatzhalter} className="w-full resize-y rounded-[14px] bg-bo-surface px-3.5 py-2.5 text-[15px] leading-[22px] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-bo-focus)]" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && senden()} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-bo-text-soft">{T.akte.composerHinweis}</p>
        <Knopf size="s" variant="primary" laedt={laeuft} disabled={!text.trim()} onClick={senden} kuerzel="Strg+Enter">{T.knopf.speichern}</Knopf>
      </div>
    </div>
  );
}

