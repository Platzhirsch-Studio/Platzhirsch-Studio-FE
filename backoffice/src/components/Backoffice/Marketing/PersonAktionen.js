"use client";
// Personen-Akte (10-konzept-marketing § 2.4): Primär „Keine Werbung mehr …“ (D4, Shift+W), `⋯` mit Nur Newsletter
// abbestellen, Einwilligung erfassen, Bestätigungsmail erneut (nur zulässig), Adresse ändern (gesperrt bis Backend),
// Nachweis, Auskunft (Seitenblick), Daten löschen (Leitung, Tippfeld). Inline: Interessen, Name für Anrede, Sprache.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen, Dialog, Menue, MenuePunkt, MenueTrenner, Sheet } from "../Overlay";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import useAktion from "./useAktion";
import { AbmeldenDialog, EinwilligungDialog, KeineWerbungDialog } from "./Empfaenger";
import { aboFelderAction, auskunftAction, bestaetigungErneutAction, datenLoeschenAction, widerrufAction } from "@/lib/backoffice/marketing/actions";
import { bestaetigungErneut, loeschenErlaubt, kurzDatum } from "@/lib/backoffice/marketing/regeln";
import { EINWILLIGUNG, PERSON, SPRACHE_TEXT, ZWECK_TEXT, STATUS_TEXT, KANAL_TEXT } from "@/lib/backoffice/marketing/texte";

export function PersonAktionen({ email, abo, einwilligungen, leitung, team, faehig, gesperrt, textversion, dsgvoHref }) {
  const router = useRouter();
  const [offen, setOffen] = useState(null);
  const [tipp, setTipp] = useState("");
  const [auskunft, setAuskunft] = useState(null);
  const { sofort, laeuft } = useAktion();
  const be = bestaetigungErneut(abo);
  useKuerzel("akte@marketing", { "marketing.keine-werbung": () => team && !gesperrt && setOffen("keine") });
  if (!team) return null;
  return (
    <div className="bo-mar-aktionen">
      <Menue label="Weitere Aktionen" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" data-testid="person-menue" />}>
        <MenuePunkt icon="Mail" deaktiviert={!abo || ["Abgemeldet", "Bounce", "Beschwerde"].includes(abo?.status)} grund={!abo ? "Kein Newsletter-Abo" : undefined} onWaehlen={() => setOffen("abmelden")}>
          {PERSON.nurNewsletter}
        </MenuePunkt>
        <MenuePunkt icon="Shield" onWaehlen={() => setOffen("einwilligung")}>
          {PERSON.einwilligungErfassen}
        </MenuePunkt>
        <MenuePunkt icon="RefreshCw" deaktiviert={!be.ok} grund={be.ok ? undefined : be.grund === "kurz" ? PERSON.zuletztVor(be.minuten) : PERSON.nurUnbestaetigt} onWaehlen={() => sofort(() => bestaetigungErneutAction({ emails: [email] }), { ok: "Bestätigungsmail erneut gesendet" })}>
          {PERSON.bestaetigungErneut}
        </MenuePunkt>
        <MenuePunkt icon="Pencil" deaktiviert={!faehig.adresse} grund={!faehig.adresse ? `Noch nicht verfügbar – ${PERSON.adresseHilfe}` : undefined}>
          {PERSON.adresseAendern}
        </MenuePunkt>
        <MenueTrenner />
        <MenuePunkt icon="FileText" onWaehlen={async () => {
          setAuskunft({ laedt: true });
          const r = await auskunftAction({ email });
          setAuskunft(r?.ok ? { daten: r.daten } : { fehler: r?.message });
        }}>
          {PERSON.auskunft}
        </MenuePunkt>
        <MenuePunkt icon="ShieldAlert" deaktiviert={!faehig.dsgvo} grund={!faehig.dsgvo ? "Noch nicht verfügbar – Anfrage im CRM erfassen" : undefined} href={faehig.dsgvo ? dsgvoHref : undefined}>
          {PERSON.dsgvoAnfrage}
        </MenuePunkt>
        {leitung && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="Trash2" gefaehrlich deaktiviert={!loeschenErlaubt(abo)} grund={!loeschenErlaubt(abo) ? PERSON.loeschenNurStatus : undefined} onWaehlen={() => setOffen("loeschen")}>
              {PERSON.datenLoeschen}
            </MenuePunkt>
          </>
        )}
      </Menue>
      <span className="inline-flex flex-col items-end">
        <Knopf variant="primary" onClick={() => setOffen("keine")} disabled={gesperrt} kuerzel="shift+w" data-testid="keine-werbung">
          {PERSON.keineWerbung}
        </Knopf>
      </span>
      {offen === "keine" && <KeineWerbungDialog offen onSchliessen={() => { setOffen(null); router.refresh(); }} email={email} abo={abo} einwilligungen={einwilligungen} />}
      {offen === "abmelden" && <AbmeldenDialog offen emails={[email]} onSchliessen={() => setOffen(null)} />}
      {offen === "einwilligung" && <EinwilligungDialog offen onSchliessen={() => setOffen(null)} vorbelegt={email} textversion={textversion} kanaeleFaehig={faehig.kanaele} />}
      <Dialog
        offen={offen === "loeschen"}
        onSchliessen={() => setOffen(null)}
        titel={PERSON.loeschenTitel(email)}
        text={PERSON.loeschenText}
        groesse="sm"
        art="bestaetigen"
        rolle="alertdialog"
        fuss={
          <>
            <Knopf onClick={() => setOffen(null)} autoFocus>
              Abbrechen
            </Knopf>
            <Knopf
              variant="danger-solid"
              disabled={tipp.trim().toLowerCase() !== "löschen" || laeuft}
              laedt={laeuft}
              onClick={async () => {
                const r = await sofort(() => datenLoeschenAction({ email, bestaetigung: tipp }), { ok: PERSON.geloescht, neuLaden: false });
                if (r?.ok) router.push("/marketing/empfaenger");
              }}
            >
              Löschen
            </Knopf>
          </>
        }
      >
        <label className="bo-mar-feld">
          <span>{PERSON.loeschenTippen}</span>
          <input className="bo-mar-eingabe" value={tipp} onChange={(e) => setTipp(e.target.value)} />
        </label>
      </Dialog>
      <Sheet offen={!!auskunft} onSchliessen={() => setAuskunft(null)} titel={PERSON.auskunftTitel} unter={email} groesse="md">
        {auskunft?.laedt ? (
          <p className="bo-mar-unter">Lädt …</p>
        ) : auskunft?.fehler ? (
          <p className="bo-mar-gefahr">{auskunft.fehler}</p>
        ) : auskunft?.daten ? (
          <div className="flex flex-col gap-4 text-[14px]" data-testid="auskunft">
            <section>
              <h3 className="bo-mar-titel">Newsletter</h3>
              <p className="bo-mar-unter">{auskunft.daten.abo ? `${STATUS_TEXT.abo[auskunft.daten.abo.status]} · angemeldet ${kurzDatum(auskunft.daten.abo.angemeldet_am, { jahr: true })}` : "Kein Abo"}</p>
            </section>
            <section>
              <h3 className="bo-mar-titel">Einwilligungen</h3>
              <ul className="mt-1 flex flex-col gap-1">
                {(auskunft.daten.einwilligungen || []).map((w) => (
                  <li key={w.name} className="bo-mar-unter">
                    {ZWECK_TEXT[w.zweck]} · {STATUS_TEXT.einwilligung[w.status]} · {KANAL_TEXT[w.kanal]} · {w.textversion}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="bo-mar-titel">Zustellungen</h3>
              <p className="bo-mar-unter">{(auskunft.daten.zustellungen || []).length} Einträge</p>
            </section>
            <section>
              <h3 className="bo-mar-titel">Events</h3>
              <p className="bo-mar-unter">{(auskunft.daten.events || []).map((e) => `${e.event} (${e.datum})`).join(", ") || "–"}</p>
            </section>
            <p className="bo-mar-klein">{PERSON.auskunftVollstaendig}</p>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

/** Inline-Felder des Abos (sofort gespeichert, Toast nur bei Fehler). */
export function AboFelder({ email, abo, interessen = [], nurLesen }) {
  const [w, setW] = useState({ anrede_name: abo?.anrede_name || "", sprache: abo?.sprache || "de", interessen: (abo?.interessen || []).map((i) => i.interesse) });
  const { zeige } = useAktion();
  const speichern = async (felder) => {
    const r = await aboFelderAction({ email, felder });
    if (!r?.ok) zeige(r?.message || "Nicht gespeichert.", { art: "fehler" });
  };
  if (!abo) return null;
  return (
    <div className="bo-mar-felder mt-4">
      <div className="bo-mar-feld voll">
        <span>{PERSON.interessen}</span>
        <span className="bo-mar-chips">
          {interessen.map((i) => {
            const an = w.interessen.includes(i.name);
            return (
              <button
                key={i.name}
                type="button"
                className="bo-mar-chip"
                aria-pressed={an}
                disabled={nurLesen}
                onClick={() => {
                  const neu = an ? w.interessen.filter((x) => x !== i.name) : [...w.interessen, i.name];
                  setW({ ...w, interessen: neu });
                  speichern({ interessen: neu });
                }}
              >
                {i.interesse}
              </button>
            );
          })}
        </span>
      </div>
      <label className="bo-mar-feld">
        <span>{PERSON.anredeName}</span>
        <input className="bo-mar-eingabe" value={w.anrede_name} disabled={nurLesen} onChange={(e) => setW({ ...w, anrede_name: e.target.value })} onBlur={() => speichern({ anrede_name: w.anrede_name })} />
      </label>
      <label className="bo-mar-feld">
        <span>{PERSON.sprache}</span>
        <select className="bo-mar-eingabe" value={w.sprache} disabled={nurLesen} onChange={(e) => { setW({ ...w, sprache: e.target.value }); speichern({ sprache: e.target.value }); }}>
          {Object.entries(SPRACHE_TEXT).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Widerruf einer einzelnen Einwilligung (Bestätigung mit Fakten, endgültig). */
export function WiderrufKnopf({ name, zweck }) {
  const [frage, setFrage] = useState(false);
  const { sofort, laeuft } = useAktion();
  return (
    <>
      <Knopf size="s" variant="ghost" onClick={() => setFrage(true)}>
        Widerruf …
      </Knopf>
      <Bestaetigen
        offen={frage}
        titel={EINWILLIGUNG.widerrufTitel(ZWECK_TEXT[zweck])}
        text={EINWILLIGUNG.widerrufText}
        bestaetigen={EINWILLIGUNG.widerrufKnopf}
        laeuft={laeuft}
        onAbbrechen={() => setFrage(false)}
        onBestaetigen={async () => {
          await sofort(() => widerrufAction({ namen: [name], kanal: "backoffice" }), { ok: EINWILLIGUNG.widerrufen(ZWECK_TEXT[zweck]) });
          setFrage(false);
        }}
      />
    </>
  );
}
