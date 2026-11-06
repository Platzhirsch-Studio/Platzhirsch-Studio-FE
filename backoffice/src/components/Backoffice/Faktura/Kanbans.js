"use client";
// Kanban für Angebote und Eingangsrechnungen (§ 3.2, § 3.6) auf dem Fundament-Kanban (Lounge v2): nur erlaubte
// Ziele; Gesendet→Angenommen öffnet „Annehmen“, Gesendet→Abgelehnt den Grund (verzögerter Commit), Entwurf→Gesendet
// nur über „Senden“. ER: Erfasst→Sachlich geprüft, Sachlich geprüft→Freigegeben (Leitung, verzögerter Commit),
// Freigegeben→Bezahlt öffnet „Als bezahlt buchen“, exportierte ER lassen sich nicht ziehen.

import { useRouter } from "next/navigation";
import Kanban from "../Kanban/Kanban";
import { useToast } from "../Toast";
import { erAktionAction } from "@/lib/backoffice/faktura/actions";
import { ANGEBOT, ER } from "@/lib/backoffice/faktura/texte";
import { useFaktura } from "./Aktionen";

const ANGEBOT_ZIELE = {
  Entwurf: [{ nachStatus: "Gesendet", action: "senden" }],
  Gesendet: [
    { nachStatus: "Angenommen", action: "annehmen" },
    { nachStatus: "Abgelehnt", action: "ablehnen" },
  ],
};

export function AngebotKanban({ spalten, toene }) {
  const { ausfuehren } = useFaktura();
  return (
    <Kanban
      doctype="PH Angebot"
      spalten={spalten}
      titelFeld="titel"
      kartenFelder={[{ fieldname: "kunde_name", label: "Kunde" }, { fieldname: "brutto_cent", label: "Brutto", cent: true }, { fieldname: "zugewiesen_an", label: "Berater" }]}
      statusTon={toene}
      uebergaenge={ANGEBOT_ZIELE}
      hrefBasis="/faktura/angebote"
      onVerschiebe={async ({ name, nach, action }) => {
        const karte = spalten.flatMap((s) => s.karten).find((k) => k.name === name) || {};
        const ziel = { name, doctype: "PH Angebot", titel: karte.titel, daten: { kunde: karte.kunde_name, email: karte.email || "", vertragsort: karte.vertragsort, brutto_cent: karte.brutto_cent } };
        if (action === "senden") {
          ausfuehren("senden", ziel);
          return { ok: false, message: ANGEBOT.kanbanSenden };
        }
        ausfuehren(action, ziel);
        return { ok: true };
      }}
    />
  );
}

const ER_ZIELE = {
  Erfasst: [{ nachStatus: "Sachlich geprueft", action: "pruefen" }],
  "Sachlich geprueft": [
    { nachStatus: "Freigegeben", action: "freigeben" },
    { nachStatus: "Erfasst", action: "zurueck_an_erfassung" },
  ],
  Freigegeben: [
    { nachStatus: "Bezahlt", action: "als_bezahlt_buchen" },
    { nachStatus: "Erfasst", action: "zurueck_an_erfassung" },
  ],
};

export function ErKanban({ spalten, toene, leitung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ausfuehren } = useFaktura();
  const ziele = leitung ? ER_ZIELE : { Erfasst: ER_ZIELE.Erfasst, "Sachlich geprueft": [ER_ZIELE["Sachlich geprueft"][1]] };
  return (
    <Kanban
      doctype="PH Eingangsrechnung"
      spalten={spalten}
      titelFeld="titel"
      kartenFelder={[{ fieldname: "zahlbetrag_cent", label: "Zahlbetrag", cent: true }, { fieldname: "faellig", label: "Fällig", fieldtype: "Date" }]}
      statusTon={toene}
      uebergaenge={ziele}
      hrefBasis="/faktura/eingangsrechnungen"
      onVerschiebe={async ({ name, action }) => {
        const karte = spalten.flatMap((s) => s.karten).find((k) => k.name === name) || {};
        if (karte.export_status === "exportiert") return { ok: false, message: ER.exportiert(karte.export_lauf || "") };
        const ziel = { name, doctype: "PH Eingangsrechnung", titel: karte.titel, daten: { status: karte.status, zahlbetrag_cent: karte.zahlbetrag_cent, kostenOffen: karte.zuordnung_status === "Offen" } };
        if (action === "freigeben") {
          if (karte.zuordnung_status === "Offen") return { ok: false, message: ER.freigabeNurVollstaendig };
          ausfuehren("er-freigeben", ziel);
          return { ok: true };
        }
        if (action === "als_bezahlt_buchen") {
          ausfuehren("er-bezahlt", ziel);
          return { ok: true };
        }
        const r = await erAktionAction({ name, aktion: action });
        if (r.ok) {
          zeige(action === "pruefen" ? ER.geprueft(name) : `${name} zurück an Erfassung`, { art: "ok" });
          router.refresh();
        }
        return r;
      }}
    />
  );
}
