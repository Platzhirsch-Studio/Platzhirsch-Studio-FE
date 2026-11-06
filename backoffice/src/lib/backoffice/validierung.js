// zod-Schema aus DocType-Meta (reqd, Select-Optionen, Zahlen, Cent) und
// Umwandlung von Formulardaten (Strings) in Frappe-Werte. Reines Modul.

import { z } from "zod";
import { LAYOUT_FELDTYPEN, NICHT_ANZEIGEN } from "./frappe/feldtypen.js";
import { euroZuCent } from "./format.js";

export function bearbeitbareFelder(meta, { neu = false } = {}) {
  return meta.fields.filter((f) => {
    if (LAYOUT_FELDTYPEN.has(f.fieldtype) || NICHT_ANZEIGEN.has(f.fieldtype)) return false;
    if (f.hidden) return false;
    if (f.fieldname === "naming_series" && !neu) return false;
    if (f.read_only) return false;
    if (f.fieldname === "status" || f.fieldname === "workflow_state" || f.fieldname === "amended_from") return false;
    return true;
  });
}

/** Erzeugt das zod-Schema für die bearbeitbaren Felder. */
export function schemaAusMeta(meta, { neu = false } = {}) {
  const form = {};
  for (const f of bearbeitbareFelder(meta, { neu })) {
    let s;
    switch (f.fieldtype) {
      case "Check":
        s = z.union([z.boolean(), z.number(), z.string()]).transform((v) => (v === true || v === 1 || v === "1" || v === "on" ? 1 : 0));
        break;
      case "Int":
        s = f.cent
          ? z.union([z.number(), z.string()]).transform((v, ctx) => {
              if (typeof v === "number") return Math.round(v);
              const c = euroZuCent(v);
              if (Number.isNaN(c)) ctx.addIssue({ code: "custom", message: "Betrag in Euro, z. B. 1.234,50" });
              return c ?? null;
            })
          : z.union([z.number(), z.string()]).transform((v, ctx) => {
              if (v === "" || v === null || v === undefined) return null;
              const n = Number(String(v).replace(",", "."));
              if (!Number.isInteger(n)) ctx.addIssue({ code: "custom", message: "Ganze Zahl erwartet" });
              return n;
            });
        break;
      case "Float":
      case "Currency":
      case "Percent":
        s = z.union([z.number(), z.string()]).transform((v, ctx) => {
          if (v === "" || v === null || v === undefined) return null;
          const n = Number(String(v).replace(/\./g, "").replace(",", "."));
          if (Number.isNaN(n)) ctx.addIssue({ code: "custom", message: "Zahl erwartet" });
          return n;
        });
        break;
      case "Select": {
        const opts = (f.auswahl || []).map((o) => o ?? "");
        s = z.string().refine((v) => v === "" || opts.length === 0 || opts.includes(v), { message: "Ungültige Auswahl" });
        break;
      }
      case "Date":
        s = z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Datum im Format JJJJ-MM-TT" });
        break;
      case "Datetime":
        s = z
          .string()
          .transform((v) => {
            if (!v) return "";
            const x = v.replace("T", " ").slice(0, 19);
            return x.length === 16 ? `${x}:00` : x;
          })
          .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v), { message: "Datum/Zeit erwartet" });
        break;
      case "Table":
        s = z.array(z.record(z.string(), z.any())).default([]);
        break;
      default:
        s = z.string().max(f.length && f.length > 0 ? f.length : f.fieldtype === "Data" ? 140 : 100000);
        if (f.options === "Email") s = s.refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: "Ungültige E-Mail-Adresse" });
    }
    if (f.reqd) {
      if (f.fieldtype === "Table") s = s.refine((v) => v.length > 0, { message: "Mindestens eine Zeile" });
      else if (f.fieldtype === "Check") {
        // Pflicht-Check: muss nicht gesetzt sein (Frappe prüft reqd bei Check nicht)
      } else s = s.refine((v) => v !== "" && v !== null && v !== undefined, { message: "Pflichtfeld" });
    }
    form[f.fieldname] = s.optional();
  }
  return z.object(form).passthrough();
}

/**
 * Prüft Formularwerte gegen die Meta.
 * @returns {{ok:true, werte:object}|{ok:false, fehler:Record<string,string>}}
 */
export function validiere(meta, werte, { neu = false } = {}) {
  const schema = schemaAusMeta(meta, { neu });
  const eingabe = {};
  for (const f of bearbeitbareFelder(meta, { neu })) {
    if (!(f.fieldname in (werte || {}))) continue;
    const v = werte[f.fieldname];
    eingabe[f.fieldname] = v === null || v === undefined ? (f.fieldtype === "Table" ? [] : "") : v;
  }
  const r = schema.safeParse(eingabe);
  if (r.success) return { ok: true, werte: r.data };
  const fehler = {};
  for (const i of r.error.issues) {
    const k = String(i.path[0] ?? "_");
    if (!fehler[k]) fehler[k] = i.message;
  }
  return { ok: false, fehler };
}

/** FormData → flaches Objekt (Checkboxen fehlen, wenn nicht gesetzt → 0). */
export function formDataZuWerte(formData, meta) {
  const werte = {};
  for (const f of bearbeitbareFelder(meta, { neu: true })) {
    if (f.fieldtype === "Table") {
      const roh = formData.get(`__tabelle__${f.fieldname}`);
      try {
        werte[f.fieldname] = roh ? JSON.parse(String(roh)) : [];
      } catch {
        werte[f.fieldname] = [];
      }
      continue;
    }
    if (f.fieldtype === "Check") {
      werte[f.fieldname] = formData.has(f.fieldname) ? 1 : 0;
      continue;
    }
    if (formData.has(f.fieldname)) werte[f.fieldname] = String(formData.get(f.fieldname) ?? "");
  }
  return werte;
}
