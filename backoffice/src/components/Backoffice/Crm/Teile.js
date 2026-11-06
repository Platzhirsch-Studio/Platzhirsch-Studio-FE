// Kleine Bausteine des CRM ohne Zustand (server- und client-tauglich): Kontaktknöpfe, Status, Feld-Hülle,
// Symbolkreis. Gestaltung in crm.css (Lounge: Fläche statt Rahmen, Ziele ≥ 44 px).

import { Mail, Phone, Smartphone } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import { statusAnzeige, terminStatus } from "@/lib/backoffice/crm/status";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import "./crm.css";

/** Mail/Telefon-Knöpfe (Sicht 32, Treffer 44); leer → gedimmt mit Hinweis, nie toter Link. */
export function KontaktKnoepfe({ email, telefon, mobil, wer = "", mitMobil = false }) {
  return (
    <span className="bo-crm-kontaktweg" data-kontaktweg="">
      {email ? (
        <a href={`mailto:${email}`} aria-label={T.anfragen.mailAn(wer || email)} className="bo-tip" data-tip={email}>
          <Mail className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </a>
      ) : (
        <span data-leer="" role="img" aria-label={`${T.dialog.email}: ${T.anfragen.keinKontaktweg}`}>
          <Mail className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      {telefon ? (
        <a href={`tel:${String(telefon).replace(/[^\d+]/g, "")}`} aria-label={T.anfragen.anrufen(wer || telefon)} className="bo-tip" data-tip={telefon}>
          <Phone className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </a>
      ) : (
        <span data-leer="" role="img" aria-label={`${T.dialog.telefon}: ${T.anfragen.keinKontaktweg}`}>
          <Phone className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      {mitMobil && mobil && (
        <a href={`tel:${String(mobil).replace(/[^\d+]/g, "")}`} aria-label={T.anfragen.anrufen(`${wer} (mobil)`)} className="bo-tip" data-tip={mobil}>
          <Smartphone className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </a>
      )}
    </span>
  );
}

/** Status eines CRM-Objekts als Pille (Punkt/Symbol + Wort). */
export function CrmStatus({ objekt, wert, doc, groesse = "m", text, ton }) {
  const a = objekt === "termin" && doc ? terminStatus(doc) : statusAnzeige(objekt, wert);
  return <StatusBadge wert={a.wert} text={text || a.text} ton={ton || a.ton} groesse={groesse} />;
}

/** Symbol im weichen Materialkreis (Zeilen, Zeitleiste). */
export function Symbol({ icon, ton, children }) {
  return (
    <span className="bo-crm-symbol" data-ton={ton} aria-hidden="true">
      {children || <Icon name={icon} className="size-4" />}
    </span>
  );
}

/** Feld-Hülle mit Label, Hinweis und Fehler (Eingabe selbst als Kind). */
export function Feld({ label, hinweis, fehler, eingelassen = false, className, children, id }) {
  return (
    <label className={`bo-crm-feld ${className || ""}`} data-eingelassen={eingelassen ? "" : undefined} htmlFor={id}>
      <span>{label}</span>
      {children}
      {fehler ? <em className="bo-crm-feld__fehler not-italic" role="alert">{fehler}</em> : hinweis ? <em className="bo-crm-feld__hinweis not-italic">{hinweis}</em> : null}
    </label>
  );
}

/** Leichte Kennzahl (Seitenkopf-Muster ohne Kachel). */
export function Leicht({ wert, text }) {
  return (
    <div className="min-w-0">
      <p className="bo-zahl-gross tabular-nums">{wert}</p>
      <p className="text-[13px] text-bo-text-soft">{text}</p>
    </div>
  );
}
