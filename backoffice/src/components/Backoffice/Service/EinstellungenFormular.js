"use client";
// Einstellungen Service (10-konzept-service §2.13): Karten je Thema, Speicherleiste haftet bei Änderungen,
// Strg+S speichert. Fristen nur nach Rücksprache mit der Kanzlei (Hinweis), Vorlagen lesend.
import { useEffect, useMemo, useState } from "react";
import Kachel, { Bento } from "../Kachel";
import Schalter from "../Schalter";
import BetragFeld from "../Eingabe/BetragFeld";
import Speicherleiste from "../Formular/Speicherleiste";
import { Band } from "../Akte";
import { useAktion } from "./useAktion";
import { einstellungenAction } from "@/lib/backoffice/service/actions";
import { PRIORITAETEN } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

const KARTEN = [
  { id: "fristen", felder: [["gewaehrleistung_monate", "Gewährleistung (Monate)"], ["vermutung_verbraucher_monate", "Vermutung Verbraucher (Monate)"], ["vermutung_unternehmer_monate", "Vermutung Unternehmer (Monate)"], ["fristwarnung_tage", "Warnung vor Fristende (Tage)"]], lesen: [["verjaehrung_monate", "Verjährung nach Fristende (Monate, § 10 Abs 2 VGG)"], ["regress_monate", "Regress nach Erfüllung (Monate, § 933b ABGB)"]] },
  { id: "sla", felder: [["reaktion_werktage", "Reaktion (Werktage)"], ["sla_reaktion_normal", "Reaktion normal"], ["sla_reaktion_hoch", "Reaktion hoch"], ["sla_reaktion_dringend", "Reaktion dringend"], ["sla_loesung_normal", "Lösung normal"], ["sla_loesung_hoch", "Lösung hoch"], ["sla_loesung_dringend", "Lösung dringend"], ["sla_warn_werktage", "Warnung vor SLA-Ende (Werktage)"]], schalter: [["telefon_ist_erstreaktion", "Telefonische Meldung gilt als Erstreaktion"]] },
  { id: "eskalation", felder: [["eskalation_tage", "Eskalation ohne Bewegung (Tage)"]], betrag: [["kulanz_schwelle_cent", "Kulanz-Freigabe ab (brutto)"]], auswahl: [["standard_prioritaet", "Standard-Priorität", PRIORITAETEN]] },
  { id: "einsatz", felder: [["einsatz_takt_min", "Abrechnungstakt (Minuten)"], ["einsatz_puffer_min", "Puffer vor/nach Einsatz (Minuten)"]], zeit: [["techniker_tag_von", "Techniker-Tag von"], ["techniker_tag_bis", "Techniker-Tag bis"]] },
  { id: "teile", felder: [["ersatzteil_ueberfaellig_tage", "Bestellung überfällig nach (Tagen)"]], schalter: [["ersatzteil_bestand_fuehren", "Bestand führen"], ["mindestbestand_warnung", "Warnung unter Mindestbestand"]] },
  { id: "regress", betrag: [["regress_toleranz_cent", "Toleranz beim Abgleich"]] },
  { id: "pflege", felder: [["erinnerung_tage_vorher", "Erinnerung vor Termin (Tage)"], ["wartung_karenz_tage", "Karenz bis überfällig (Tage)"], ["nachkauf_tage_nach", "Nachkauf-Hinweis nach (Tagen)"], ["wartung_vorlauf_tage", "Automatische Planung Vorlauf (Tage)"]], schalter: [["wartung_automatisch", "Wartungen automatisch planen"]] },
  { id: "portal", felder: [["portal_fotos_max", "Fotos je Meldung"], ["portal_foto_max_mb", "Foto max. MB"], ["portal_videos_max", "Videos je Meldung"], ["portal_video_max_mb", "Video max. MB"]], schalter: [["portal_sichtbar_standard", "Fälle standardmäßig im Portal"]] },
];

/** @param {{werte:object, leitung:boolean, vorlagen:Array<[string,string]>}} p */
export default function EinstellungenFormular({ werte: start, leitung, vorlagen = [] }) {
  const { ausfuehren, laeuft } = useAktion();
  const [w, setW] = useState(start);
  const [basis, setBasis] = useState(start);
  const [fehler, setFehler] = useState({});
  const geaendert = useMemo(() => Object.fromEntries(Object.entries(w).filter(([k, v]) => String(v ?? "") !== String(basis[k] ?? ""))), [w, basis]);
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const speichern = () => ausfuehren(einstellungenAction, { werte: geaendert }, { ok: T.einstellungen.gespeichert, onOk: () => (setBasis(w), setFehler({})), onFehler: (r) => r.fehler && setFehler(r.fehler) });
  useEffect(() => {
    const t = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && Object.keys(geaendert).length && leitung) {
        e.preventDefault();
        speichern();
      }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  });
  const zahl = ([k, label]) => (
    <label key={k} className="bo-svc-feld" data-fehler={fehler[k] ? "" : undefined}>
      <span>{label}</span>
      <input type="number" min={0} value={w[k] ?? ""} disabled={!leitung} onChange={(e) => setze(k, e.target.value)} />
      {fehler[k] && <span className="bo-svc-fehler">{fehler[k]}</span>}
    </label>
  );
  return (
    <div className="grid gap-(--bo-bento-gap)">
      {!leitung && <Band ton="info" titel={T.einstellungen.nurLeitung} />}
      <Bento>
        {KARTEN.map((k) => (
          <Kachel key={k.id} className="md:col-span-6" titel={T.einstellungen.karten[k.id]} unter={k.id === "fristen" ? T.einstellungen.kanzlei : undefined}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(k.felder || []).map(zahl)}
              {(k.lesen || []).map(([f, label]) => (
                <div key={f} className="bo-svc-feld">
                  <span>{label}</span>
                  <p className="text-[15px] tabular-nums">{w[f] ?? "–"}</p>
                </div>
              ))}
              {(k.betrag || []).map(([f, label]) => (
                <div key={f} className="bo-svc-feld">
                  <span>{label}</span>
                  <BetragFeld value={Number(w[f]) || 0} onChange={(c) => setze(f, c ?? 0)} disabled={!leitung} aria-label={label} />
                </div>
              ))}
              {(k.auswahl || []).map(([f, label, opts]) => (
                <label key={f} className="bo-svc-feld">
                  <span>{label}</span>
                  <select value={w[f] || ""} disabled={!leitung} onChange={(e) => setze(f, e.target.value)}>
                    {opts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              {(k.zeit || []).map(([f, label]) => (
                <label key={f} className="bo-svc-feld" data-fehler={fehler[f] ? "" : undefined}>
                  <span>{label}</span>
                  <input value={String(w[f] || "").slice(0, 5)} disabled={!leitung} inputMode="numeric" onChange={(e) => setze(f, e.target.value)} />
                </label>
              ))}
            </div>
            {(k.schalter || []).length > 0 && (
              <div className="mt-4 grid gap-2">
                {k.schalter.map(([f, label]) => (
                  <Schalter key={f} label={label} an={!!Number(w[f])} deaktiviert={!leitung} onWechsel={(v) => setze(f, v ? 1 : 0)} />
                ))}
              </div>
            )}
          </Kachel>
        ))}
        <Kachel className="md:col-span-12" titel={T.einstellungen.karten.kommunikation} unter="E-Mail-Vorlagen der App (Pflege im Frappe-Desk durch die Verwaltung)">
          <ul className="grid gap-2 sm:grid-cols-2">
            {vorlagen.map(([k, v]) => (
              <li key={k} className="bo-svc-karte flex items-center justify-between gap-3 text-[14px]">
                <span className="text-bo-text-soft">{k}</span>
                <span className="font-medium">{v || "–"}</span>
              </li>
            ))}
          </ul>
        </Kachel>
      </Bento>
      {leitung && <Speicherleiste zuSpeichern={Object.keys(geaendert).length > 0} geaendert={Object.keys(geaendert).length > 0} laedt={laeuft} onSpeichern={speichern} onVerwerfen={() => setW(basis)} />}
    </div>
  );
}
