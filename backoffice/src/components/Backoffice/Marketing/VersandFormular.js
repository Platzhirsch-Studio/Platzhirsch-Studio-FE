"use client";
// Ausgabe-Akte, Reiter „Empfänger & Versand“ (10-konzept-marketing § 2.3): Zielgruppe als Segment (Alle aktiven Abos ·
// Interesse · Sprache · Zielgruppe · Testadresse – keine Auswahl nach Anrede/Geschlecht, R12), Empfängerzahl, Satz zu
// Unbestätigten, „Empfänger anzeigen“ (Seitenblick), Versandtermin mit Sperrtag-Sperre und Werbefenster-Hinweis,
// Kampagne, Sprache. Feldwerte speichern sofort (Toast nur bei Fehler).
import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Sheet } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { ausgabeSpeichernAction, empfaengerListeAction } from "@/lib/backoffice/marketing/actions";
import { pruefeVersandtermin } from "@/lib/backoffice/marketing/regeln";
import { NEWSLETTER, SPRACHE_TEXT, ZIELGRUPPE_TEXT, QUELLE_TEXT } from "@/lib/backoffice/marketing/texte";
import { zahl } from "@/lib/backoffice/format";

const isoMinute = (v) => (v ? String(v).slice(0, 16).replace("T", " ") : "");

export default function VersandFormular({ name, doc, segmente = [], interessen = [], kampagnen = [], empfaenger, fenster, nurLesen = false, darfTermin = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [werte, setWerte] = useState({ zielgruppe: doc.zielgruppe, zielgruppe_interesse: doc.zielgruppe_interesse || "", sprache: doc.sprache || "de", segment: doc.segment || "", kampagne: doc.kampagne || "", versand_geplant: isoMinute(doc.versand_geplant) });
  const [modified, setModified] = useState(doc.modified);
  const [fehler, setFehler] = useState({});
  const [liste, setListe] = useState(null);
  const termin = pruefeVersandtermin(werte.versand_geplant, fenster);

  const speichere = async (neu) => {
    const alle = { ...werte, ...neu };
    setWerte(alle);
    if (alle.zielgruppe === "Segment" && !alle.segment) return setFehler({ segment: NEWSLETTER.segmentFehlt });
    if (alle.zielgruppe === "Interesse" && !alle.zielgruppe_interesse) return setFehler({ zielgruppe_interesse: NEWSLETTER.interesseFehlt });
    setFehler({});
    const r = await ausgabeSpeichernAction({ name, modified, felder: neu });
    if (!r?.ok) {
      setFehler(r?.fehler || {});
      zeige(r?.message || "Nicht gespeichert.", { art: "fehler" });
      return;
    }
    setModified(r.modified);
    if (r.zurueck) zeige(NEWSLETTER.bearbeitetZurueck, { art: "info" });
    router.refresh();
  };

  return (
    <div className="bo-mar-akte">
      <div className="bo-mar-stapel">
        <section className="bo-kachel" style={{ padding: 24 }} aria-labelledby="vf-zg">
          <h2 id="vf-zg" className="bo-titel-kachel">{NEWSLETTER.felder.zielgruppe}</h2>
          <div className="mt-4">
            <Segment
              label={NEWSLETTER.felder.zielgruppe}
              wert={werte.zielgruppe}
              onWechsel={(w) => !nurLesen && speichere({ zielgruppe: w })}
              optionen={Object.keys(ZIELGRUPPE_TEXT).map((k) => ({ wert: k, titel: ZIELGRUPPE_TEXT[k], deaktiviert: nurLesen }))}
            />
          </div>
          <div className="bo-mar-felder mt-5">
            {werte.zielgruppe === "Interesse" && (
              <label className="bo-mar-feld">
                <span>Interesse</span>
                <select className="bo-mar-eingabe" value={werte.zielgruppe_interesse} disabled={nurLesen} onChange={(e) => speichere({ zielgruppe_interesse: e.target.value })} aria-invalid={fehler.zielgruppe_interesse ? "true" : undefined}>
                  <option value="">Wählen …</option>
                  {interessen.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.interesse}
                    </option>
                  ))}
                </select>
                {fehler.zielgruppe_interesse && <span className="bo-mar-feld__fehler">{fehler.zielgruppe_interesse}</span>}
              </label>
            )}
            {werte.zielgruppe === "Segment" && (
              <label className="bo-mar-feld">
                <span>Zielgruppe</span>
                <select className="bo-mar-eingabe" value={werte.segment} disabled={nurLesen} onChange={(e) => speichere({ segment: e.target.value, zielgruppe: "Segment" })} aria-invalid={fehler.segment ? "true" : undefined}>
                  <option value="">Wählen …</option>
                  {segmente.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.titel}
                    </option>
                  ))}
                </select>
                {fehler.segment && <span className="bo-mar-feld__fehler">{fehler.segment}</span>}
              </label>
            )}
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.sprache}</span>
              <select className="bo-mar-eingabe" value={werte.sprache} disabled={nurLesen} onChange={(e) => speichere({ sprache: e.target.value })}>
                {Object.entries(SPRACHE_TEXT).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="bo-zahl-gross tabular-nums" data-testid="empfaenger-zahl">{empfaenger != null ? zahl(empfaenger) : "–"}</p>
              <p className="bo-mar-unter">Empfänger · {NEWSLETTER.zielgruppeSatz}</p>
            </div>
            <Knopf
              icon="Users"
              onClick={async () => {
                setListe({ laedt: true, zeilen: [] });
                const r = await empfaengerListeAction({ name });
                setListe(r?.ok ? { laedt: false, zeilen: r.zeilen } : { laedt: false, zeilen: [], fehler: r?.message });
              }}
            >
              {NEWSLETTER.empfaengerAnzeigen}
            </Knopf>
          </div>
        </section>
        <section className="bo-kachel" style={{ padding: 24 }} aria-labelledby="vf-vs">
          <h2 id="vf-vs" className="bo-titel-kachel">Versand</h2>
          <div className="bo-mar-felder mt-4">
            <div className="bo-mar-feld">
              <span id="vf-termin">{NEWSLETTER.felder.versand_geplant}</span>
              <Datumsfeld value={werte.versand_geplant} onChange={(v) => setWerte((w) => ({ ...w, versand_geplant: v }))} mitZeit gruppeLabelId="vf-termin" disabled={nurLesen || !darfTermin} invalid={termin.gesperrt && !!werte.versand_geplant} />
              {werte.versand_geplant && termin.gesperrt ? <span className="bo-mar-feld__fehler">{termin.grund}</span> : termin.hinweis ? <span className="bo-mar-feld__hinweis">{termin.hinweis}</span> : !darfTermin ? <span className="bo-mar-feld__hinweis">Den Termin legt die Leitung bei der Freigabe fest.</span> : null}
              {darfTermin && !nurLesen && werte.versand_geplant !== isoMinute(doc.versand_geplant) && !termin.gesperrt && (
                <span>
                  <Knopf size="s" onClick={() => speichere({ versand_geplant: werte.versand_geplant })}>
                    Termin übernehmen
                  </Knopf>
                </span>
              )}
            </div>
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.kampagne}</span>
              <select className="bo-mar-eingabe" value={werte.kampagne} disabled={nurLesen} onChange={(e) => speichere({ kampagne: e.target.value })}>
                <option value="">Keine</option>
                {kampagnen.map((k) => (
                  <option key={k.name} value={k.name}>
                    {k.titel}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>
      <Sheet offen={!!liste} onSchliessen={() => setListe(null)} titel={NEWSLETTER.empfaengerAnzeigen} unter={liste ? `${liste.zeilen.length} Personen (höchstens 200 angezeigt)` : ""} groesse="md">
        {liste?.laedt ? (
          <p className="bo-mar-unter">Lädt …</p>
        ) : liste?.fehler ? (
          <p className="bo-mar-gefahr">{liste.fehler}</p>
        ) : (
          <ul className="flex flex-col gap-1" data-testid="empfaenger-liste">
            {(liste?.zeilen || []).map((z) => (
              <li key={z.email} className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2 hover:bg-(--color-bo-fill)">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">{z.name || z.email}</span>
                  <span className="bo-mar-klein block truncate">{z.email}</span>
                </span>
                <span className="bo-mar-klein shrink-0">
                  {SPRACHE_TEXT[z.sprache] || z.sprache}
                  {z.quelle ? ` · ${QUELLE_TEXT[z.quelle] || z.quelle}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}
