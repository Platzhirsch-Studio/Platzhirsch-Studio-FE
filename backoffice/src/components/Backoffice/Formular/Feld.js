"use client";
import cx from "../cx";
import { Icon } from "../icons";
import LinkFeld from "./LinkFeld";
import Datumsfeld from "./Datumsfeld";
import { centAlsEingabe } from "@/lib/backoffice/format";
import { anzeige, hilfetext } from "@/lib/backoffice/labels";
import { FORMULAR } from "./texte";
import "./formular.css";

/**
 * Ein Formularfeld nach Frappe-Feldtyp. Werte sind Strings (Form), Cent-Felder
 * werden als Euro angezeigt/eingegeben (Umrechnung in validierung.js).
 * Label und Optionstexte laufen durch anzeige() (Umlaute), die Werte bleiben unverändert.
 * Beschreibungen erscheinen nur als Hilfetext, technische Texte (hilfetext() → null) gar nicht.
 * Date/Datetime nutzen das deutsche <Datumsfeld> (Wert ISO).
 * @param {{feld:object, wert:any, onChange:(v:any)=>void, fehler?:string, nurLesen?:boolean, prefix?:string, ohneLabel?:boolean}} props
 */
export default function Feld({ feld, wert, onChange, fehler, nurLesen = false, prefix = "f", ohneLabel = false }) {
  const id = `${prefix}-${feld.fieldname}`;
  const label = anzeige(feld.label);
  const hilfe = ohneLabel ? null : hilfetext(feld.description);
  const beschr = [hilfe ? `${id}-hinweis` : null, fehler ? `${id}-fehler` : null].filter(Boolean).join(" ") || undefined;
  const gemeinsam = {
    id,
    name: feld.fieldname,
    disabled: nurLesen || !!feld.read_only,
    "aria-invalid": fehler ? true : undefined,
    "aria-describedby": beschr,
    "aria-label": ohneLabel ? label : undefined,
    required: !!feld.reqd && feld.fieldtype !== "Check",
  };
  const v = wert ?? "";
  let eingabe;
  switch (feld.fieldtype) {
    case "Check":
      eingabe = (
        <label className={cx("flex min-h-10 cursor-pointer items-center gap-3 text-[15px]", ohneLabel && "justify-center")}>
          <input type="checkbox" {...gemeinsam} required={false} checked={v === 1 || v === true || v === "1"} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="size-[18px] rounded-[5px]" />
          {!ohneLabel && <span>{label}</span>}
        </label>
      );
      break;
    case "Select":
      eingabe = (
        <select {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} className="bo-input">
          {(feld.auswahl || []).map((o, i) => (
            <option key={`${o}-${i}`} value={o}>
              {o === "" ? "–" : anzeige(o)}
            </option>
          ))}
        </select>
      );
      break;
    case "Link":
      eingabe = feld.options ? <LinkFeld ariaLabel={ohneLabel ? label : undefined} id={id} name={feld.fieldname} doctype={feld.options} value={v} onChange={onChange} disabled={gemeinsam.disabled} required={gemeinsam.required} invalid={!!fehler} describedBy={beschr} /> : <input type="text" {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} className="bo-input" />;
      break;
    case "Date":
      eingabe = <Datumsfeld id={id} value={String(v).slice(0, 10)} onChange={onChange} disabled={gemeinsam.disabled} required={gemeinsam.required} invalid={!!fehler} describedBy={beschr} aria-label={ohneLabel ? label : undefined} />;
      break;
    case "Datetime":
      eingabe = <Datumsfeld id={id} mitZeit zeitLabel={ohneLabel ? `${label} Uhrzeit` : "Uhrzeit"} value={String(v).slice(0, 16)} onChange={onChange} disabled={gemeinsam.disabled} required={gemeinsam.required} invalid={!!fehler} describedBy={beschr} aria-label={label} />;
      break;
    case "Time":
      eingabe = <input type="time" {...gemeinsam} value={String(v).slice(0, 5)} onChange={(e) => onChange(e.target.value)} className="bo-input" />;
      break;
    case "Int":
      eingabe = feld.cent ? (
        <div className="relative">
          <input type="text" inputMode="decimal" {...gemeinsam} value={typeof v === "number" ? centAlsEingabe(v) : v} onChange={(e) => onChange(e.target.value)} placeholder="0,00" className="bo-input pr-8 text-right tabular-nums" />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-bo-text-soft">
            €
          </span>
        </div>
      ) : (
        <input type="number" step="1" {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} className="bo-input tabular-nums" />
      );
      break;
    case "Float":
    case "Currency":
    case "Percent":
      eingabe = <input type="text" inputMode="decimal" {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} className="bo-input tabular-nums" />;
      break;
    case "Text":
    case "Small Text":
    case "Long Text":
    case "Text Editor":
    case "Markdown Editor":
    case "Code":
    case "JSON":
    case "HTML Editor":
      eingabe = <textarea {...gemeinsam} value={String(v).replace(/<[^>]*>/g, "")} onChange={(e) => onChange(e.target.value)} rows={feld.fieldtype === "Small Text" ? 3 : 6} className={cx("bo-input", (feld.fieldtype === "Code" || feld.fieldtype === "JSON") && "font-mono text-xs")} />;
      break;
    case "Attach":
    case "Attach Image":
      eingabe = (
        <div className="flex items-center gap-2">
          <input type="text" {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} placeholder="/private/files/…" className="bo-input" />
          {v && (
            <a href={`/api/datei?url=${encodeURIComponent(v)}`} className="whitespace-nowrap rounded-sm text-[13px] font-medium underline decoration-bo-line-strong underline-offset-[3px] hover:decoration-current" target="_blank" rel="noopener">
              {FORMULAR.oeffnen}
            </a>
          )}
        </div>
      );
      break;
    case "Color":
      eingabe = <input type="color" {...gemeinsam} value={v || "#8a7a66"} onChange={(e) => onChange(e.target.value)} className="h-10 w-16" />;
      break;
    case "Read Only":
      eingabe = <p className="bo-input">{String(v) || "–"}</p>;
      break;
    default:
      eingabe = <input type={feld.options === "Email" ? "email" : feld.options === "Phone" ? "tel" : feld.options === "URL" ? "url" : "text"} {...gemeinsam} value={v} onChange={(e) => onChange(e.target.value)} maxLength={feld.length || undefined} className="bo-input" />;
  }
  // Datum + Uhrzeit: eine Gruppe (fieldset/legend); das Datumsfeld heißt wie das Label, das Zeitfeld „Uhrzeit“.
  const gruppe = feld.fieldtype === "Datetime" && !ohneLabel;
  const Huelle = gruppe ? "fieldset" : "div";
  return (
    <Huelle className={cx("min-w-0", feld.fieldtype === "Check" && !ohneLabel && "sm:pt-6")}>
      {gruppe && (
        <legend id={`${id}-label`} className="bo-fo-label">
          {label}
          {feld.reqd ? <span aria-hidden="true" className="text-bo-danger-text"> *</span> : null}
        </legend>
      )}
      {feld.fieldtype !== "Check" && !ohneLabel && !gruppe && (
        <label htmlFor={id} id={`${id}-label`} className="bo-fo-label">
          {label}
          {feld.reqd ? <span aria-hidden="true" className="text-bo-danger-text"> *</span> : null}
        </label>
      )}
      {eingabe}
      {hilfe && (
        <p id={`${id}-hinweis`} className="bo-fo-hinweis">
          {hilfe}
        </p>
      )}
      {fehler && (
        <p id={`${id}-fehler`} role="alert" className="bo-fade bo-fo-fehler">
          <Icon name="AlertTriangle" className="mt-px size-3.5 shrink-0" />
          {fehler}
        </p>
      )}
    </Huelle>
  );
}
