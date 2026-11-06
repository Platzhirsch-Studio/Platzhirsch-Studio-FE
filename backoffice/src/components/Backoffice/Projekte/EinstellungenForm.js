"use client";
// Einstellungen des Bereichs (10-konzept-projekte.md § 5.20) – nur Leitung. Abschnitte als Kacheln, iOS-Schalter,
// Speicherleiste unten (Strg/⌘+S), Konflikt über `modified`.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kachel, { Bento } from "../Kachel";
import Schalter from "../Schalter";
import Speicherleiste from "../Formular/Speicherleiste";
import { useToast } from "../Toast";
import { einstellungenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

const E = TEXTE.einstellungen;

function Zahl({ label, wert, onWert, einheit, fehler }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-bo-text-soft">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input className="bo-input w-32 tabular-nums" inputMode="decimal" value={wert ?? ""} onChange={(e) => onWert(e.target.value)} aria-invalid={!!fehler} />
        {einheit && <span className="text-[14px] text-bo-text-soft">{einheit}</span>}
      </span>
      {fehler && <span className="mt-1 block text-[12px] text-bo-danger-text">{fehler}</span>}
    </label>
  );
}

export default function EinstellungenForm({ start, modified, automationen = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [w, setW] = useState(start);
  const [stand, setStand] = useState(modified);
  const [fehler, setFehler] = useState({});
  const [pending, run] = useTransition();
  const geaendert = JSON.stringify(w) !== JSON.stringify(start);
  const setze = (k) => (v) => setW((a) => ({ ...a, [k]: v }));
  const speichern = () =>
    run(async () => {
      const r = await einstellungenAction({ werte: w, modified: stand });
      if (!r?.ok) {
        setFehler(r?.fehler || {});
        return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      }
      setStand(r.modified);
      setFehler({});
      zeige(E.gespeichert, { art: "ok" });
      router.refresh();
    });
  return (
    <form onSubmit={(e) => (e.preventDefault(), speichern())} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); speichern(); } }} className="flex flex-col gap-6" data-testid="einstellungen">
      <Bento einblenden={false}>
        <Kachel className="md:col-span-6" titel={E.abschnitte.rueck}>
          <div className="flex flex-wrap gap-6">
            <Zahl label="Erinnerung nach" einheit="Tagen" wert={w.feedback_erinnerung_tage} onWert={setze("feedback_erinnerung_tage")} fehler={fehler.feedback_erinnerung_tage} />
            <Zahl label="Sprachnotiz höchstens" einheit="MB" wert={w.max_audio_mb} onWert={setze("max_audio_mb")} fehler={fehler.max_audio_mb} />
          </div>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.abschnitte.portal}>
          <Zahl label="Anmeldelink gültig" einheit="Tage" wert={w.portal_token_tage} onWert={setze("portal_token_tage")} fehler={fehler.portal_token_tage} />
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.abschnitte.tagebuch}>
          <div className="flex flex-col gap-4">
            <Schalter label="Bautagebuch aktiv" an={!!Number(w.tagebuch_aktiv)} onWechsel={(v) => setze("tagebuch_aktiv")(v ? 1 : 0)} />
            <Zahl label="Fotos je Projekt höchstens" wert={w.max_fotos_je_projekt} onWert={setze("max_fotos_je_projekt")} fehler={fehler.max_fotos_je_projekt} />
          </div>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.abschnitte.montage}>
          <div className="flex flex-wrap gap-6">
            <Zahl label="Tagesstunden je Monteur" einheit="h" wert={w.montage_tagesstunden} onWert={setze("montage_tagesstunden")} fehler={fehler.montage_tagesstunden} />
            <Zahl label="Mangel-Erinnerung nach" einheit="Tagen" wert={w.maengel_erinnerung_tage} onWert={setze("maengel_erinnerung_tage")} fehler={fehler.maengel_erinnerung_tage} />
          </div>
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.abschnitte.referenzen}>
          <Schalter label="Referenz-Freigabe aktiv" beschreibung="Nur mit freigegebenem Einwilligungstext." an={!!Number(w.referenz_freigabe_aktiv)} onWechsel={(v) => setze("referenz_freigabe_aktiv")(v ? 1 : 0)} />
        </Kachel>
        <Kachel className="md:col-span-6" titel={E.abschnitte.liefer}>
          <Schalter label="Liefertermin automatisch an Kunden" beschreibung={E.lieferHinweis} an={!!Number(w.liefertermin_kunde_automatisch)} onWechsel={(v) => setze("liefertermin_kunde_automatisch")(v ? 1 : 0)} />
        </Kachel>
        <Kachel className="md:col-span-12" titel={E.abschnitte.texte}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[["haftungshinweis_fremdgewerke", "Haftungshinweis Fremdgewerke"], ["montagebericht_fusstext", "Fußtext Montagebericht"], ["abnahme_fusstext", "Fußtext Abnahmeprotokoll"]].map(([k, l]) => (
              <label key={k} className="block">
                <span className="text-[13px] font-medium text-bo-text-soft">{l}</span>
                <textarea className="bo-input mt-1 min-h-28 w-full" value={w[k] || ""} onChange={(e) => setze(k)(e.target.value)} />
              </label>
            ))}
          </div>
        </Kachel>
        <Kachel className="md:col-span-12" titel={E.abschnitte.automationen} unter="Alle Standard aus – der Inhaber gibt jede einzeln frei (Fragenliste).">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {automationen.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-[12px] font-semibold text-bo-text-soft tabular-nums">{a.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{a.titel}</span>
                  <span className="block text-[13px] text-bo-text-soft">{a.wirkung} · {a.art}</span>
                </span>
                <Schalter label={`${a.id} aktiv`} an={false} deaktiviert groesse="s" zeile={false} />
              </li>
            ))}
          </ul>
        </Kachel>
      </Bento>
      <Speicherleiste zuSpeichern={geaendert} geaendert={geaendert} laedt={pending} onSpeichern={speichern} onVerwerfen={() => setW(start)} />
    </form>
  );
}
