"use client";
// Einstellungen (Konzept §3.9): Stufen · Anträge · Texte · Wallet als Kacheln; Speicherleiste mit Strg/⌘+S.
// Mitarbeitende lesen nur. Kundentexte werden live geprüft.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Schalter from "../Schalter";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import Speicherleiste from "../Formular/Speicherleiste";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import MiniKarte from "./MiniKarte";
import { Textfeld } from "./Dialoge";
import { einstellungenSpeichernAction } from "@/lib/backoffice/kundenkarte/actions";
import { pruefeKundentext } from "@/lib/backoffice/kundenkarte/textpruefung";
import { EINWILLIGUNG_TEXTVERSION, DATENSCHUTZINFO_VERSION, T } from "@/lib/backoffice/kundenkarte/texte";

function Abschnitt({ id, titel, unter, children }) {
  return (
    <section id={id} className="bo-kachel scroll-mt-28" aria-labelledby={`${id}-t`}>
      <div className="bo-kachel__kopf">
        <div>
          <h2 id={`${id}-t`} className="bo-kachel__titel">
            {titel}
          </h2>
          {unter && <p className="bo-kachel__unter">{unter}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

const ohneHtml = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function Einstellungen({ werte: start, stufen = [], berater = [], leitung = false, wallet }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [w, setW] = useState(start);
  const [fehler, setFehler] = useState("");
  const [laeuft, starte] = useTransition();
  const geaendert = JSON.stringify(w) !== JSON.stringify(start);
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const speichern = () =>
    starte(async () => {
      setFehler("");
      const r = await einstellungenSpeichernAction({ werte: w, modified: start.modified });
      if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
      zeige(T.einstellungen.gespeichert, { art: "ok" });
      router.refresh();
    });
  useKuerzel("akte", { "akte.speichern": () => (leitung && geaendert ? speichern() : false) });
  const pruefBegruessung = pruefeKundentext(ohneHtml(w.text_begruessung));
  const pruefDatenschutz = pruefeKundentext(w.text_datenschutz_karte);
  const aus = !leitung;

  return (
    <div className="flex max-w-4xl flex-col gap-5" data-testid="kk-einstellungen">
      {aus && <p className="bo-kk-satz">{T.einstellungen.nurLesen}</p>}
      <Abschnitt id="stufen" titel={T.einstellungen.stufen}>
        <div className="bo-kk-raster" data-spalten="2">
          <div>
            <label className="bo-kk-label" htmlFor="kk-e-start">
              Startstufe
            </label>
            <select id="kk-e-start" className="bo-kk-feld" disabled={aus} value={w.startstufe || ""} onChange={(e) => setze("startstufe", e.target.value)}>
              {stufen.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.stufenname}
                </option>
              ))}
            </select>
          </div>
          <Textfeld label="Bewertungszeitraum (Monate)" type="number" min={1} max={36} wert={String(w.bewertungszeitraum_monate ?? 12)} onWert={(x) => setze("bewertungszeitraum_monate", Number(x) || 12)} disabled={aus} />
        </div>
        <Schalter label="Herabstufung erlaubt" an={Boolean(Number(w.herabstufung_erlaubt))} onWechsel={(a) => setze("herabstufung_erlaubt", a ? 1 : 0)} deaktiviert={aus} beschreibung={T.einstellungen.herabSatz} />
        <p className="flex items-center gap-2 text-[13px] text-bo-text-soft">
          <Icon name="Lock" className="size-3.5" />
          {T.einstellungen.nurMitEinwilligung}
        </p>
      </Abschnitt>

      <Abschnitt id="antraege" titel={T.einstellungen.antraege}>
        {!w.bedingungen_version && <p className="bo-kk-warn">{T.einstellungen.ohneVersion}</p>}
        <div className="bo-kk-raster" data-spalten="2">
          <Textfeld label="Version der Teilnahmebedingungen" wert={w.bedingungen_version || ""} onWert={(x) => setze("bedingungen_version", x)} disabled={aus} hilfe="z. B. 2026-11" testid="kk-e-version" />
          <div>
            <label className="bo-kk-label" htmlFor="kk-e-berater">
              Berater für neue Karten
            </label>
            <select id="kk-e-berater" className="bo-kk-feld" disabled={aus} value={w.berater_standard || ""} onChange={(e) => setze("berater_standard", e.target.value)}>
              <option value="">–</option>
              {berater.map((b) => (
                <option key={b.wert} value={b.wert}>
                  {b.titel}
                </option>
              ))}
            </select>
          </div>
          <Textfeld label="E-Mail-Bestätigung gültig (Stunden)" type="number" min={1} wert={String(w.doi_gueltig_stunden ?? 48)} onWert={(x) => setze("doi_gueltig_stunden", Number(x) || 48)} disabled={aus} />
        </div>
        <Schalter label="E-Mail-Bestätigung bei Website-Anträgen" an={Boolean(Number(w.doi_pflicht))} onWechsel={(a) => setze("doi_pflicht", a ? 1 : 0)} deaktiviert={aus} />
        <Schalter label="Website-Anträge nach Bestätigung automatisch annehmen" an={Boolean(Number(w.website_automatisch_annehmen))} onWechsel={(a) => setze("website_automatisch_annehmen", a ? 1 : 0)} deaktiviert={aus} beschreibung={T.einstellungen.autoSatz} />
      </Abschnitt>

      <Abschnitt id="texte" titel={T.einstellungen.texte} unter={`Einwilligungstext ${EINWILLIGUNG_TEXTVERSION} · Datenschutzinformation ${DATENSCHUTZINFO_VERSION}`}>
        <Textfeld label="Begrüßungsschreiben" mehrzeilig max={4000} rows={5} wert={ohneHtml(w.text_begruessung)} onWert={(x) => setze("text_begruessung", `<p>${x.replace(/</g, "&lt;")}</p>`)} disabled={aus} fehler={pruefBegruessung.ok ? undefined : pruefBegruessung.text} hilfe={T.stufen.textHinweis} />
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <Textfeld label="Datenschutztext auf der Kartenrückseite" mehrzeilig max={400} wert={w.text_datenschutz_karte || ""} onWert={(x) => setze("text_datenschutz_karte", x)} disabled={aus} fehler={pruefDatenschutz.ok ? undefined : pruefDatenschutz.text} />
          <div className="flex flex-col items-center gap-2">
            <span className="bo-kk-label">Vorschau Rückseite</span>
            <MiniKarte nr="KK-7K3QX9" stufe="Platzhirsch" datenschutz={w.text_datenschutz_karte} gross />
            <span className="text-[12px] text-bo-text-faint">antippen zum Drehen</span>
          </div>
        </div>
      </Abschnitt>

      <Abschnitt id="wallet" titel={T.einstellungen.wallet} unter="Die Karte funktioniert ohne Pass.">
        {wallet && (
          <dl className="bo-kk-fakten">
            <div>
              <dt>Apple Wallet</dt>
              <dd>{wallet.apple?.konfiguriert ? T.einstellungen.eingerichtet : T.einstellungen.nichtEingerichtet}</dd>
            </div>
            <div>
              <dt>Google Wallet</dt>
              <dd>{wallet.google?.konfiguriert ? T.einstellungen.eingerichtet : T.einstellungen.nichtEingerichtet}</dd>
            </div>
          </dl>
        )}
        <div className="bo-kk-raster" data-spalten="2">
          <Textfeld label="Pass-Kennung (Apple)" wert={w.wallet_pass_type_id || ""} onWert={(x) => setze("wallet_pass_type_id", x)} disabled={aus} />
          <Textfeld label="Team-Kennung (Apple)" wert={w.wallet_team_id || ""} onWert={(x) => setze("wallet_team_id", x)} disabled={aus} />
          <Textfeld label="Organisation" wert={w.wallet_organisation || ""} onWert={(x) => setze("wallet_organisation", x)} disabled={aus} />
        </div>
        <p className="bo-kk-hilfe">Zertifikate und Schlüssel richtet der Administrator auf dem Server ein – sie stehen nie hier.</p>
      </Abschnitt>

      {fehler && (
        <p className="bo-kk-fehler" role="alert">
          {fehler}
        </p>
      )}
      {leitung && <Speicherleiste zuSpeichern={geaendert} geaendert={geaendert} laedt={laeuft} onSpeichern={speichern} onVerwerfen={() => setW(start)} />}
    </div>
  );
}
