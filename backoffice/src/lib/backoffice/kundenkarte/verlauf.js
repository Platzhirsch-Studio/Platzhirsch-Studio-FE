// Verlauf in Menschensprache (Konzept §3.5.3 Tab Verlauf, Glossar §12.1). Reines Modul.

import { EREIGNIS_ART, KARTE_STATUS, sperrgrundLabel, statusLabel } from "./labels.js";

const kurzName = (wer) => {
  const s = String(wer || "");
  if (!s) return "";
  const lokal = s.split("@")[0];
  return lokal.charAt(0).toUpperCase() + lokal.slice(1);
};

/** → { titel, unter, icon, ton } für eine Verlaufszeile. */
export function verlaufZeile(e) {
  if (!e) return { titel: "", unter: "", icon: "Info" };
  if (e.art === "Einloesung") {
    const storniert = e.status === "Storniert";
    return {
      titel: `${e.titel} ${storniert ? "eingelöst – storniert" : "eingelöst"}`,
      unter: [e.beleg ? `zu Beleg ${e.beleg}` : "ohne Beleg", e.ort, kurzName(e.wer), storniert && e.storno ? `Storno: ${e.storno}` : ""].filter(Boolean).join(" · "),
      icon: storniert ? "Undo2" : "CheckCheck",
      ton: storniert ? "stein" : "salbei",
    };
  }
  if (e.art === "Kommentar") return { titel: "Kommentar", unter: [e.hinweis, kurzName(e.wer)].filter(Boolean).join(" · "), icon: "MessageSquare", ton: "travertin" };
  const def = EREIGNIS_ART[e.art] || EREIGNIS_ART.Hinweis;
  let titel = def.label;
  let unter = e.hinweis || "";
  switch (e.art) {
    case "Stufenwechsel":
      titel = `Stufe ${e.alt || "–"} → ${e.neu} (${e.automatisch ? "automatisch" : "von Hand"})`;
      break;
    case "Umsatz berechnet":
      titel = "Einstufung geprüft";
      unter = String(e.hinweis || "").replace(/Belege?/g, "Einkäufe");
      break;
    case "Sperrung":
      titel = `Gesperrt${e.wer ? ` von ${kurzName(e.wer)}` : ""}`;
      break;
    case "Ausgestellt":
      titel = e.neu === "Beantragt" ? "Karte beantragt" : "Karte ausgestellt";
      break;
    case "Kuendigung":
    case "Entsperrung":
    case "Uebergabe":
      if (e.alt && e.neu) unter = [`${statusLabel(KARTE_STATUS, e.alt)} → ${statusLabel(KARTE_STATUS, e.neu)}`, e.hinweis].filter(Boolean).join(" · ");
      break;
    default:
      break;
  }
  if (e.art !== "Sperrung" && e.wer && !e.automatisch) unter = [unter, kurzName(e.wer)].filter(Boolean).join(" · ");
  if (e.automatisch) unter = [unter, "automatisch"].filter(Boolean).join(" · ");
  return { titel, unter: unter.replace(/^(Verlust|Diebstahl|Beschaedigt)\b/, (m) => sperrgrundLabel(m)), icon: def.icon, ton: e.art === "Sperrung" ? "ziegel" : e.art === "Einwilligung" || e.art === "Widerruf" ? "see" : "eiche" };
}

export { kurzName };
