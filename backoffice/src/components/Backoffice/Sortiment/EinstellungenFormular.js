"use client";
// Einstellungen Sortiment (§ 3.14): Gruppen als Kacheln, iOS-Schalter, Zahlenfelder; Leitung speichert,
// das Team sieht lesend. GLN mit Prüfziffer (für IWOfurn/EDI-Export).
import { useState } from "react";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import useAktion from "./useAktion";
import { einstellungenAction } from "@/lib/backoffice/sortiment/actions";
import { glnGueltig } from "@/lib/backoffice/sortiment/uebermittlung";
import { EINSTELLUNGEN } from "@/lib/backoffice/sortiment/texte";

const GRUPPEN = {
  website: ["website_revalidate_aktiv", "revalidate_drossel_sekunden", "claim_guard_aktiv"],
  preise: ["preis_max_monate_verkaufspreis", "preis_max_monate_uvp", "preisliste_schwelle_prozent"],
  ab: ["ab_toleranz_preis_prozent", "ab_toleranz_termin_tage"],
  bestellung: ["eigene_gln", "standard_lieferadresse"],
};
const SCHALTER = ["website_revalidate_aktiv", "claim_guard_aktiv"];

export default function EinstellungenFormular({ werte: start, darfSchreiben }) {
  const [werte, setWerte] = useState(start);
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const geaendert = JSON.stringify(werte) !== JSON.stringify(start);
  const glnFehler = werte.eigene_gln && !glnGueltig(werte.eigene_gln) ? EINSTELLUNGEN.glnUngueltig : null;
  const speichern = async () => {
    if (glnFehler) return;
    const r = await sofort(() => einstellungenAction(werte), { ok: EINSTELLUNGEN.gespeichert });
    if (r?.fehler) setFehler(r.fehler);
  };
  return (
    <div className="flex flex-col gap-(--bo-bento-gap)">
      {!darfSchreiben && <p className="bo-sor-unter rounded-[16px] bg-bo-fill px-4 py-3">{EINSTELLUNGEN.teamLesend}</p>}
      <div className="grid grid-cols-1 gap-(--bo-bento-gap) lg:grid-cols-2">
        {Object.entries(GRUPPEN).map(([g, felder]) => (
          <section key={g} className="bo-kachel">
            <h2 className="bo-titel-kachel mb-4">{EINSTELLUNGEN.gruppen[g]}</h2>
            <div className="flex flex-col gap-4">
              {felder.map((f) =>
                SCHALTER.includes(f) ? (
                  <Schalter key={f} label={EINSTELLUNGEN.felder[f]} an={!!werte[f]} onWechsel={(an) => setWerte((w) => ({ ...w, [f]: an ? 1 : 0 }))} deaktiviert={!darfSchreiben} />
                ) : (
                  <div key={f} className="bo-sor-feld">
                    <label htmlFor={`es-${f}`}>{EINSTELLUNGEN.felder[f]}</label>
                    {f === "standard_lieferadresse" ? (
                      <textarea id={`es-${f}`} rows={3} className="bo-sor-eingabe" value={werte[f] || ""} onChange={(e) => setWerte((w) => ({ ...w, [f]: e.target.value }))} disabled={!darfSchreiben} />
                    ) : (
                      <input id={`es-${f}`} inputMode="numeric" className="bo-sor-eingabe" value={werte[f] ?? ""} onChange={(e) => setWerte((w) => ({ ...w, [f]: f === "eigene_gln" ? e.target.value.replace(/\D/g, "").slice(0, 13) : e.target.value.replace(/\D/g, "") }))} disabled={!darfSchreiben} aria-invalid={(f === "eigene_gln" && glnFehler) || fehler[f] ? "true" : undefined} />
                    )}
                    {f === "eigene_gln" && glnFehler && <span className="bo-sor-feld__fehler">{glnFehler}</span>}
                    {fehler[f] && <span className="bo-sor-feld__fehler">{fehler[f]}</span>}
                  </div>
                )
              )}
            </div>
          </section>
        ))}
      </div>
      {darfSchreiben && (
        <div className="bo-material-stark sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-full px-5 py-2.5 shadow-(--bo-sh-float)">
          <span className="bo-sor-unter">{geaendert ? "Ungespeichert" : "Keine Änderungen"}</span>
          <span className="flex gap-2">
            <Knopf variant="ghost" disabled={!geaendert} onClick={() => setWerte(start)}>
              Verwerfen
            </Knopf>
            <Knopf variant="primary" disabled={!geaendert || !!glnFehler} laedt={laeuft} onClick={speichern}>
              {EINSTELLUNGEN.speichern}
            </Knopf>
          </span>
        </div>
      )}
    </div>
  );
}
