"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Bestaetigen from "../Bestaetigen";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";
import { buchenAction, dokumentMethodeAction, loescheDokumentAction, workflowAktionAction } from "@/lib/backoffice/actions";
import { VORGANG } from "./texte";
import "./formular.css";

const RUECKFRAGE = /storn|lösch|loesch|spam|ablehn|verwerf|abbrech|widerruf|erstatt/i;

/**
 * Aktionsleiste eines Dokuments (Lounge: schwebende Karte Radius 24 ohne Rahmen, Team P0-5b): Status, erlaubte Workflow-Übergänge, Buchen/
 * Stornieren (submittable), registrierte Fachbereichs-Buttons (Dokumentmethoden),
 * Löschen, Druck. Irreversible Aktionen fragen nach.
 *
 * @param {{doctype:string, name:string, status?:string, ton?:string, docstatus?:number, transitions:Array<{action:string,nextState:string}>,
 *  aktionen?:Array<{id:string,titel:string,method?:string,href?:string,args?:object,gefaehrlich?:boolean}>,
 *  rechte:{write:boolean,delete:boolean,submit:boolean,cancel:boolean,print:boolean}, submittable:boolean, druckHref?:string, listeHref:string}} props
 */
export default function WorkflowLeiste({ doctype, name, status, ton, docstatus = 0, transitions = [], aktionen = [], rechte, submittable, druckHref, listeHref }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  const [frage, setFrage] = useState(null); // { titel, text, run }

  const laufe = (fn, erfolg) =>
    start(async () => {
      const r = await fn();
      setFrage(null);
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      if (erfolg) zeige(erfolg, { art: "ok" });
      if (r.weiter) router.push(r.weiter);
      else router.refresh();
    });

  const mitRueckfrage = (titel, text, fn, erfolg) => {
    if (RUECKFRAGE.test(titel)) setFrage({ titel, text, run: () => laufe(fn, erfolg) });
    else laufe(fn, erfolg);
  };

  return (
    <div className="bo-fo-vorgang" data-testid="workflow-leiste">
      <div className="flex min-w-0 items-center gap-3 text-[13px]">
        <span className="font-medium text-bo-text-soft">{VORGANG.status}</span>
        <StatusBadge wert={status} ton={ton} groesse="m" />
        {docstatus === 1 && <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-bo-fill-2 px-3 text-[13px] font-medium"><Icon name="Shield" className="size-3.5" /> {VORGANG.gebucht}</span>}
        {docstatus === 2 && <span className="inline-flex h-7 items-center rounded-pill bg-bo-ziegel-soft px-3 text-[13px] font-medium text-bo-ziegel-text">{VORGANG.storniert}</span>}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
        {transitions.map((t, i) => (
          <Knopf key={t.action} size="s" variant={i === 0 ? "primary" : "secondary"} disabled={pending} onClick={() => mitRueckfrage(t.action, VORGANG.setztStatus(anzeige(t.action), anzeige(String(t.nextState).replace(/^PH /, ""))), () => workflowAktionAction({ doctype, name, action: t.action }), VORGANG.ausgefuehrt(anzeige(t.action)))}>
            {anzeige(t.action)}
          </Knopf>
        ))}
        {submittable && docstatus === 0 && rechte.submit && (
          <Knopf size="s" variant="primary" disabled={pending} onClick={() => setFrage({ titel: VORGANG.buchen, text: VORGANG.buchenText, run: () => laufe(() => buchenAction({ doctype, name }), VORGANG.gebuchtToast) })}>
            {VORGANG.buchen}
          </Knopf>
        )}
        {submittable && docstatus === 1 && rechte.cancel && (
          <Knopf size="s" variant="danger" disabled={pending} onClick={() => setFrage({ titel: VORGANG.stornieren, text: VORGANG.stornierenText, run: () => laufe(() => buchenAction({ doctype, name, storno: true }), VORGANG.storniertToast) })}>
            {VORGANG.stornieren}
          </Knopf>
        )}
        {aktionen.map((a) =>
          a.href ? (
            <Knopf key={a.id} size="s" href={a.href}>
              {a.titel}
            </Knopf>
          ) : (
            <Knopf key={a.id} size="s" variant={a.gefaehrlich ? "danger" : "secondary"} disabled={pending} onClick={() => mitRueckfrage(a.titel, a.text || VORGANG.wirdAusgefuehrt(a.titel), () => dokumentMethodeAction({ doctype, name, method: a.method, args: a.args }), VORGANG.ausgefuehrt(a.titel))}>
              {a.titel}
            </Knopf>
          )
        )}
        {rechte.print && druckHref && (
          <Knopf size="s" variant="ghost" icon="Printer" href={druckHref} target="_blank" rel="noopener">
            {VORGANG.drucken}
          </Knopf>
        )}
        {rechte.delete && docstatus !== 1 && (
          <Knopf size="s" variant="danger" disabled={pending} onClick={() => setFrage({ titel: VORGANG.loeschen, text: VORGANG.loeschenText(doctypeLabel(doctype), name), run: () => laufe(async () => ({ ...(await loescheDokumentAction({ doctype, name })), weiter: listeHref }), VORGANG.geloescht) })}>
            {VORGANG.loeschen}
          </Knopf>
        )}
      </div>
      <Bestaetigen offen={!!frage} titel={frage?.titel || ""} text={frage?.text} gefaehrlich laeuft={pending} onBestaetigen={() => frage?.run()} onAbbrechen={() => setFrage(null)} />
    </div>
  );
}
