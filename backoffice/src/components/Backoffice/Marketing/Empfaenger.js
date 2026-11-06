"use client";
// Empfänger (10-konzept-marketing § 2.4): Personen-Liste mit Auswahl und Massenaktionen (Vorschau „n möglich,
// m übersprungen“), Einwilligungs-Liste, Dialoge Newsletter-Anmeldung (Zielweg L1 bzw. QR-Rückfall), Einwilligung
// erfassen (D3), Keine Werbung mehr (D4), Abmelden, Bestätigungsmail erneut, Widerruf. Endgültiges nur mit
// Bestätigen-Dialog und Fakten, nie mit Undo-Toast (§ 2.0.6).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Bestaetigen, Dialog } from "../Overlay";
import { Icon } from "../icons";
import useAktion from "./useAktion";
import { Status, ZweckChips } from "./Bausteine";
import {
  abmeldenAction, bestaetigungErneutAction, einwilligungErfassenAction, keineWerbungAction, newsletterAnmeldenAction, widerrufAction, csvExportAction,
} from "@/lib/backoffice/marketing/actions";
import { domainVorschlag, emailGueltig, keineWerbungPlan, vorschauBestaetigung, kurzDatum, langDatum } from "@/lib/backoffice/marketing/regeln";
import { ABMELDEN, ANMELDUNG, EINWILLIGUNG, EMPFAENGER, KANAL_TEXT, KEINE_WERBUNG, QUELLE_TEXT, SPRACHE_TEXT, ZWECKE, ZWECK_TEXT, ZWECKE_MIT_BESTAETIGUNG } from "@/lib/backoffice/marketing/texte";

// ------------------------------------------------------------------------------------------------ Personen

export function PersonenListe({ zeilen = [], darfSchreiben, leitung, faehig = {}, loeschTage = 30 }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);
  const { sofort, laeuft, zeige } = useAktion();
  const auswahl = zeilen.filter((z) => gewaehlt.has(z.email));
  const alle = zeilen.length > 0 && gewaehlt.size === zeilen.length;
  const umschalten = (e) =>
    setGewaehlt((alt) => {
      const n = new Set(alt);
      if (n.has(e)) n.delete(e);
      else n.add(e);
      return n;
    });
  const vorschau = useMemo(() => vorschauBestaetigung(auswahl.map((z) => z.abo || { email: z.email, status: "fehlt" })), [auswahl]);
  const tasten = (e, z) => {
    if (e.target.closest("input,button,select,textarea")) return;
    if ((e.key === " " || e.key.toLowerCase() === "x") && darfSchreiben) {
      e.preventDefault();
      umschalten(z.email);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      e.currentTarget.nextElementSibling?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.currentTarget.previousElementSibling?.focus();
    } else if (e.key === "Enter") e.currentTarget.querySelector("a.bo-mar-link--zeile")?.click();
  };
  const exportieren = async () => {
    const r = await csvExportAction({ liste: "empfaenger", zeilen: zeilen.map((z) => ({ name: z.name, email: z.email, newsletter: z.abo?.status || "", zwecke: z.zwecke.join(","), quelle: z.quelle })) });
    if (!r?.ok) return zeige(r?.message || "Nicht exportiert.", { art: "fehler" });
    const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = r.dateiname;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="bo-mar-liste__kopf">
        <span className="tabular-nums">{zeilen.length} angezeigt</span>
        <span className="flex items-center gap-3">
          {darfSchreiben && zeilen.length > 0 && (
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="size-4 accent-current" checked={alle} onChange={() => setGewaehlt(alle ? new Set() : new Set(zeilen.map((z) => z.email)))} />
              <span>Alle auswählen</span>
            </label>
          )}
          {leitung && (
            <Knopf size="s" variant="ghost" icon="Download" onClick={exportieren} data-testid="csv-export">
              CSV
            </Knopf>
          )}
        </span>
      </div>
      <div className="bo-mar-tabelle-huelle overflow-x-auto">
        <table className="bo-mar-tabelle">
          <thead>
            <tr>
              {darfSchreiben && (
                <th scope="col" className="w-8">
                  <span className="sr-only">Auswahl</span>
                </th>
              )}
              <th scope="col">{EMPFAENGER.spalten.person}</th>
              <th scope="col">{EMPFAENGER.spalten.newsletter}</th>
              <th scope="col">{EMPFAENGER.spalten.zwecke}</th>
              <th scope="col" className="max-lg:hidden">{EMPFAENGER.spalten.quelle}</th>
              <th scope="col" className="max-lg:hidden">{EMPFAENGER.spalten.zustellung}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => {
              const alt = Number(z.abo?.altbestand_ohne_doi || 0);
              const lang = z.abo?.status === "Angemeldet unbestaetigt" && z.stunden != null && z.stunden > 48;
              return (
                <tr key={z.email} tabIndex={-1} onKeyDown={(e) => tasten(e, z)} data-gewaehlt={gewaehlt.has(z.email) ? "true" : undefined} data-warn={lang ? "true" : undefined} data-testid="person-zeile">
                  {darfSchreiben && (
                    <td>
                      <input type="checkbox" className="size-4 accent-current" checked={gewaehlt.has(z.email)} onChange={() => umschalten(z.email)} aria-label={`${z.name || z.email} auswählen`} />
                    </td>
                  )}
                  <td>
                    <Link href={`/marketing/empfaenger/${encodeURIComponent(z.email)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel">
                      {z.name || z.email}
                    </Link>
                    {z.name && <p className="bo-mar-unter">{z.email}</p>}
                  </td>
                  <td>
                    {alt ? (
                      <span className="bo-mar-klein">{EMPFAENGER.altbestand}</span>
                    ) : z.abo ? (
                      <span className="flex flex-col items-start gap-0.5">
                        <Status gruppe="abo" wert={z.abo.status} />
                        {z.abo.status === "Angemeldet unbestaetigt" && z.stunden != null && (
                          <span className={lang ? "bo-mar-klein bo-mar-warn" : "bo-mar-klein"} title={EMPFAENGER.loeschtIn(Math.max(0, loeschTage - Math.floor(z.stunden / 24)))}>
                            {EMPFAENGER.seit(z.stunden)}
                            {lang ? ` · ${EMPFAENGER.linkAbgelaufen}` : ""}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="bo-mar-unter">–</span>
                    )}
                  </td>
                  <td>
                    <ZweckChips zwecke={z.zwecke} />
                  </td>
                  <td className="max-lg:hidden bo-mar-unter">{QUELLE_TEXT[z.abo?.quelle || z.quelle] || z.quelle || "–"}</td>
                  <td className="max-lg:hidden bo-mar-unter whitespace-nowrap" title={z.letzteZustellung ? langDatum(z.letzteZustellung) : undefined}>
                    {z.letzteZustellung ? kurzDatum(z.letzteZustellung) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="bo-mar-karten" data-testid="karten-liste">
        {zeilen.map((z) => (
          <li key={z.email} className="bo-mar-karte-zeile">
            <div className="min-w-0 flex-1">
              <Link href={`/marketing/empfaenger/${encodeURIComponent(z.email)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel block truncate">
                {z.name || z.email}
              </Link>
              <p className="bo-mar-klein truncate">{z.email}</p>
              <div className="mt-1">
                <ZweckChips zwecke={z.zwecke} />
              </div>
            </div>
            {z.abo && <Status gruppe="abo" wert={z.abo.status} />}
          </li>
        ))}
      </ul>
      {darfSchreiben && auswahl.length > 0 && (
        <div className="bo-mar-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen" data-testid="massenaktionen">
          <span className="bo-mar-auswahl__zahl">{EMPFAENGER.auswahl(auswahl.length)}</span>
          <Knopf size="s" onClick={() => setDialog("bestaetigung")} disabled={!faehig.bestaetigungStapel && auswahl.length > 1} grund={!faehig.bestaetigungStapel && auswahl.length > 1 ? "Noch nicht verfügbar – einzeln in der Personen-Akte" : undefined}>
            {EMPFAENGER.masse.bestaetigung}
          </Knopf>
          <Knopf size="s" onClick={() => setDialog("abmelden")}>
            {EMPFAENGER.masse.abmelden}
          </Knopf>
          <Knopf size="s" variant="ghost" icon="X" label="Auswahl aufheben" onClick={() => setGewaehlt(new Set())} />
        </div>
      )}
      <Bestaetigen
        offen={dialog === "bestaetigung"}
        titel={ABMELDEN.bestaetigungTitel(vorschau.moeglich.length)}
        text={EMPFAENGER.vorschauMoeglich(vorschau.moeglich.length, vorschau.uebersprungen.length, vorschau.gruende)}
        bestaetigen={ABMELDEN.bestaetigungKnopf}
        laeuft={laeuft}
        onAbbrechen={() => setDialog(null)}
        onBestaetigen={async () => {
          if (!vorschau.moeglich.length) return setDialog(null);
          await sofort(() => bestaetigungErneutAction({ emails: vorschau.moeglich }), { ok: (r) => EMPFAENGER.ergebnisBestaetigung(r.gesendet) });
          setDialog(null);
          setGewaehlt(new Set());
        }}
      />
      <AbmeldenDialog offen={dialog === "abmelden"} emails={auswahl.map((z) => z.email)} onSchliessen={() => setDialog(null)} onFertig={() => setGewaehlt(new Set())} />
    </>
  );
}

export function AbmeldenDialog({ offen, emails = [], onSchliessen, onFertig }) {
  const [kanal, setKanal] = useState("antwort_mail");
  const [grund, setGrund] = useState("");
  const { sofort, laeuft } = useAktion();
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={ABMELDEN.titel(emails.length)}
      text={ABMELDEN.text}
      groesse="sm"
      testid="abmelden-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            disabled={laeuft}
            onClick={async () => {
              const r = await sofort(() => abmeldenAction({ emails, kanal, grund }), { ok: (x) => EMPFAENGER.ergebnisAbmelden(x.abgemeldet) });
              if (r?.ok) {
                onSchliessen();
                onFertig?.();
              }
            }}
            data-testid="abmelden-bestaetigen"
          >
            {ABMELDEN.knopf}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bo-mar-feld">
          <span>{KEINE_WERBUNG.kanal}</span>
          <Segment label={KEINE_WERBUNG.kanal} wert={kanal} onWechsel={setKanal} optionen={Object.entries(KEINE_WERBUNG.kanaele).map(([w, t]) => ({ wert: w, titel: t }))} groesse="s" />
        </div>
        <label className="bo-mar-feld">
          <span>{KEINE_WERBUNG.grund}</span>
          <input className="bo-mar-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} />
        </label>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------------------------------------ Einwilligungen

export function EinwilligungsListe({ zeilen = [], darfSchreiben }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [frage, setFrage] = useState(false);
  const { sofort, laeuft } = useAktion();
  const auswahl = zeilen.filter((z) => gewaehlt.has(z.name));
  const moeglich = auswahl.filter((z) => ["Offen", "Bestaetigt"].includes(z.status));
  return (
    <>
      <div className="bo-mar-tabelle-huelle overflow-x-auto">
        <table className="bo-mar-tabelle">
          <thead>
            <tr>
              {darfSchreiben && (
                <th scope="col" className="w-8">
                  <span className="sr-only">Auswahl</span>
                </th>
              )}
              <th scope="col">{EMPFAENGER.spalten.person}</th>
              <th scope="col">{EMPFAENGER.spalten.zweck}</th>
              <th scope="col">{EMPFAENGER.spalten.status}</th>
              <th scope="col">{EMPFAENGER.spalten.kanal}</th>
              <th scope="col" className="max-lg:hidden">{EMPFAENGER.spalten.textversion}</th>
              <th scope="col">{EMPFAENGER.spalten.zeitpunkt}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.name} data-gewaehlt={gewaehlt.has(z.name) ? "true" : undefined} data-testid="einwilligung-zeile">
                {darfSchreiben && (
                  <td>
                    <input
                      type="checkbox"
                      className="size-4 accent-current"
                      checked={gewaehlt.has(z.name)}
                      onChange={() =>
                        setGewaehlt((a) => {
                          const n = new Set(a);
                          if (n.has(z.name)) n.delete(z.name);
                          else n.add(z.name);
                          return n;
                        })
                      }
                      aria-label={`${z.email} ${ZWECK_TEXT[z.zweck]} auswählen`}
                    />
                  </td>
                )}
                <td>
                  <Link href={`/marketing/empfaenger/${encodeURIComponent(z.email)}?tab=einwilligungen`} className="bo-mar-link bo-mar-link--zeile">
                    {z.email}
                  </Link>
                </td>
                <td>{ZWECK_TEXT[z.zweck] || z.zweck}</td>
                <td>
                  <Status gruppe="einwilligung" wert={z.status} />
                </td>
                <td className="bo-mar-unter">
                  {KANAL_TEXT[z.kanal] || z.kanal}
                  {z.erteilung_beleg ? " · Formular" : ""}
                </td>
                <td className="max-lg:hidden bo-mar-mono">{z.textversion}</td>
                <td className="whitespace-nowrap" title={langDatum(z.zeitpunkt)}>
                  {kurzDatum(z.zeitpunkt, { jahr: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bo-mar-karten">
        {zeilen.map((z) => (
          <li key={z.name} className="bo-mar-karte-zeile">
            <div className="min-w-0 flex-1">
              <p className="bo-mar-titel truncate">{z.email}</p>
              <p className="bo-mar-klein">
                {ZWECK_TEXT[z.zweck]} · {KANAL_TEXT[z.kanal]}
              </p>
            </div>
            <Status gruppe="einwilligung" wert={z.status} />
          </li>
        ))}
      </ul>
      {darfSchreiben && auswahl.length > 0 && (
        <div className="bo-mar-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen">
          <span className="bo-mar-auswahl__zahl">{EMPFAENGER.auswahl(auswahl.length)}</span>
          <Knopf size="s" icon="Printer" href={auswahl.length <= 50 ? `/druck/ph-einwilligung/${encodeURIComponent(auswahl[0].name)}?format=${encodeURIComponent("PH Einwilligung Nachweis")}` : undefined} disabled={auswahl.length > 50} grund={auswahl.length > 50 ? "Höchstens 50 auf einmal" : undefined}>
            {EMPFAENGER.masse.nachweis}
          </Knopf>
          <Knopf size="s" onClick={() => setFrage(true)} disabled={!moeglich.length}>
            {EMPFAENGER.masse.widerruf}
          </Knopf>
        </div>
      )}
      <Bestaetigen
        offen={frage}
        titel={`Widerruf für ${moeglich.length} ${moeglich.length === 1 ? "Einwilligung" : "Einwilligungen"} erfassen?`}
        text={`${EINWILLIGUNG.widerrufText}${auswahl.length - moeglich.length ? ` ${auswahl.length - moeglich.length} übersprungen (nicht wirksam).` : ""}`}
        bestaetigen={EINWILLIGUNG.widerrufKnopf}
        laeuft={laeuft}
        onAbbrechen={() => setFrage(false)}
        onBestaetigen={async () => {
          await sofort(() => widerrufAction({ namen: moeglich.map((m) => m.name), kanal: "backoffice" }), { ok: (r) => `${r.widerrufen} Widerrufe erfasst` });
          setFrage(false);
          setGewaehlt(new Set());
        }}
      />
    </>
  );
}

// ------------------------------------------------------------------------------------------------ Dialoge

/** Newsletter-Anmeldung (Zielweg L1 mit Bestätigungsmail) bzw. „Am Tablet selbst eintragen“ (QR) ohne Fähigkeit S1. */
export function AnmeldungDialog({ offen, onSchliessen, interessen = [], faehig = true, websiteUrl = "https://platzhirsch.studio", vorbelegt = "" }) {
  const [w, setW] = useState({ email: vorbelegt, anrede_name: "", sprache: "de", interessen: [], quelle: "showroom", hinweis: false });
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const vorschlag = domainVorschlag(w.email);
  const link = `${websiteUrl.replace(/\/$/, "")}/de/newsletter`;
  if (!faehig) {
    return (
      <Dialog offen={offen} onSchliessen={onSchliessen} titel={ANMELDUNG.qrTitel} text={ANMELDUNG.qrText} groesse="sm" testid="anmeldung-qr" fuss={<Knopf onClick={onSchliessen}>Schließen</Knopf>}>
        <div className="flex flex-col items-center gap-3">
          <QrMuster text={link} />
          <a className="bo-mar-link text-[15px] font-medium" href={link} target="_blank" rel="noreferrer">
            {link.replace(/^https?:\/\//, "")}
          </a>
          <p className="bo-mar-klein text-center">Noch nicht verfügbar – {ANMELDUNG.qrTitel.toLowerCase()} ist der Weg bis zum nächsten Backend-Stand.</p>
        </div>
      </Dialog>
    );
  }
  const senden = async () => {
    const f = {};
    if (!emailGueltig(w.email)) f.email = "E-Mail-Adresse prüfen";
    if (!w.hinweis) f.hinweis = "Bitte bestätigen";
    setFehler(f);
    if (Object.keys(f).length) return;
    const r = await sofort(() => newsletterAnmeldenAction(w), { ok: ANMELDUNG.ok(w.email) });
    if (r?.ok) onSchliessen();
    else setFehler(r?.fehler || {});
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={ANMELDUNG.titel}
      groesse="sm"
      testid="anmeldung-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} disabled={laeuft} data-testid="anmeldung-senden">
            {ANMELDUNG.knopf}
          </Knopf>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          senden();
        }}
      >
        <label className="bo-mar-feld">
          <span>{ANMELDUNG.email}</span>
          <input className="bo-mar-eingabe" type="email" autoFocus value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} aria-invalid={fehler.email ? "true" : undefined} data-testid="anmeldung-email" />
          {fehler.email && <span className="bo-mar-feld__fehler">{fehler.email}</span>}
          {vorschlag && (
            <button type="button" className="bo-mar-feld__hinweis text-left underline underline-offset-2" onClick={() => setW({ ...w, email: vorschlag })}>
              {ANMELDUNG.vorschlag(vorschlag.split("@")[1])}
            </button>
          )}
        </label>
        <div className="bo-mar-felder">
          <label className="bo-mar-feld">
            <span>{ANMELDUNG.name}</span>
            <input className="bo-mar-eingabe" value={w.anrede_name} onChange={(e) => setW({ ...w, anrede_name: e.target.value })} />
          </label>
          <label className="bo-mar-feld">
            <span>{ANMELDUNG.sprache}</span>
            <select className="bo-mar-eingabe" value={w.sprache} onChange={(e) => setW({ ...w, sprache: e.target.value })}>
              {Object.entries(SPRACHE_TEXT).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="bo-mar-feld">
          <span>{ANMELDUNG.interessen}</span>
          <span className="bo-mar-chips">
            {interessen.map((i) => (
              <button key={i.name} type="button" className="bo-mar-chip" aria-pressed={w.interessen.includes(i.name)} onClick={() => setW({ ...w, interessen: w.interessen.includes(i.name) ? w.interessen.filter((x) => x !== i.name) : [...w.interessen, i.name] })}>
                {i.interesse}
              </button>
            ))}
          </span>
        </div>
        <div className="bo-mar-feld">
          <span>{ANMELDUNG.quelle}</span>
          <Segment label={ANMELDUNG.quelle} groesse="s" wert={w.quelle} onWechsel={(q) => setW({ ...w, quelle: q })} optionen={[{ wert: "showroom", titel: "Showroom" }, { wert: "telefon", titel: "Telefon" }, { wert: "backoffice", titel: "Backoffice" }]} />
        </div>
        <p className="bo-mar-unter">{ANMELDUNG.satz}</p>
        <label className="bo-mar-haken">
          <input type="checkbox" checked={w.hinweis} onChange={(e) => setW({ ...w, hinweis: e.target.checked })} data-testid="anmeldung-hinweis" />
          <span>{ANMELDUNG.hinweisHaken}</span>
        </label>
        {fehler.hinweis && <span className="bo-mar-feld__fehler">{fehler.hinweis}</span>}
      </form>
    </Dialog>
  );
}

/** Dekoratives QR-Muster aus dem Text (Platzhalter; der Link darunter ist der Weg). */
function QrMuster({ text }) {
  const n = 21;
  let h = 2166136261;
  const zellen = [];
  for (let i = 0; i < n * n; i++) {
    h ^= text.charCodeAt(i % text.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    zellen.push(h % 3 === 0);
  }
  const ecke = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width="168" height="168" role="img" aria-label="QR-Code zur Anmeldeseite" className="rounded-[14px] bg-(--color-bo-surface) p-2">
      {zellen.map((v, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        const rand = ecke(x, y);
        const voll = rand ? x % 6 === 0 || y % 6 === 0 || x === n - 1 || y === n - 1 || ((x % 7 >= 2 && x % 7 <= 4) || (x >= n - 5 && x <= n - 3)) && ((y % 7 >= 2 && y % 7 <= 4) || (y >= n - 5 && y <= n - 3)) : v;
        return voll ? <rect key={i} x={x} y={y} width="1" height="1" fill="currentColor" /> : null;
      })}
    </svg>
  );
}

/** D3 – Einwilligung erfassen: Papier = Formular Pflicht, sofort wirksam mit Beleg; andere Kanäle mit Bestätigungsmail (S2). */
export function EinwilligungDialog({ offen, onSchliessen, vorbelegt = "", textversion = "nl-2026-10-29", kanaeleFaehig = false }) {
  const [w, setW] = useState({ email: vorbelegt, zweck: "einladungen", kanal: "papier", textversion });
  const [datei, setDatei] = useState(null);
  const [fehler, setFehler] = useState({});
  const { laeuft } = useAktion();
  const [sendet, setSendet] = useState(false);
  const router = useRouter();
  const { zeige } = useAktion();
  const kanalGesperrt = (k) => k !== "papier" && (!kanaeleFaehig || !ZWECKE_MIT_BESTAETIGUNG.includes(w.zweck));
  const zeit = new Date().toLocaleString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const senden = async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(w)) fd.set(k, v);
    if (datei) fd.set("datei", datei);
    setSendet(true);
    const r = await einwilligungErfassenAction(fd);
    setSendet(false);
    if (!r?.ok) {
      setFehler(r?.fehler || {});
      zeige(r?.message || "Nicht erfasst.", { art: r?.code === "invalid" ? "warnung" : "fehler" });
      return;
    }
    zeige(EINWILLIGUNG.ok(ZWECK_TEXT[w.zweck]), { art: "ok" });
    onSchliessen();
    router.refresh();
  };
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={EINWILLIGUNG.titel}
      groesse="md"
      testid="einwilligung-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" onClick={senden} laedt={sendet || laeuft} disabled={sendet || kanalGesperrt(w.kanal)} data-testid="einwilligung-speichern">
            {w.kanal === "papier" ? EINWILLIGUNG.knopfPapier : EINWILLIGUNG.knopfMail}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="bo-mar-feld">
          <span>{EINWILLIGUNG.person}</span>
          <input className="bo-mar-eingabe" type="email" autoFocus value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} aria-invalid={fehler.email ? "true" : undefined} />
          {fehler.email && <span className="bo-mar-feld__fehler">{fehler.email}</span>}
        </label>
        <label className="bo-mar-feld">
          <span>{EINWILLIGUNG.zweck}</span>
          <select className="bo-mar-eingabe" value={w.zweck} onChange={(e) => setW({ ...w, zweck: e.target.value })}>
            {ZWECKE.map((z) => (
              <option key={z} value={z}>
                {ZWECK_TEXT[z]}
              </option>
            ))}
          </select>
        </label>
        <div className="bo-mar-feld">
          <span>{EINWILLIGUNG.wie}</span>
          <Segment
            label={EINWILLIGUNG.wie}
            wert={w.kanal}
            onWechsel={(k) => !kanalGesperrt(k) && setW({ ...w, kanal: k })}
            optionen={["telefon", "showroom", "email", "papier"].map((k) => ({ wert: k, titel: KANAL_TEXT[k], deaktiviert: kanalGesperrt(k) }))}
            testid="einwilligung-kanal"
          />
          {["telefon", "showroom", "email"].some(kanalGesperrt) && <span className="bo-mar-feld__hinweis">{EINWILLIGUNG.kanalGesperrt}</span>}
          <span className="bo-mar-feld__hinweis bo-erscheinen">{w.kanal === "papier" ? EINWILLIGUNG.satzPapier : EINWILLIGUNG.satzMail}</span>
        </div>
        {w.kanal === "papier" && (
          <label className="bo-mar-feld">
            <span>{EINWILLIGUNG.formular}</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setDatei(e.target.files?.[0] || null)} aria-invalid={fehler.datei ? "true" : undefined} data-testid="einwilligung-datei" />
            {fehler.datei && <span className="bo-mar-feld__fehler">{fehler.datei}</span>}
          </label>
        )}
        <label className="bo-mar-feld">
          <span>{EINWILLIGUNG.textversion}</span>
          <input className="bo-mar-eingabe" value={w.textversion} onChange={(e) => setW({ ...w, textversion: e.target.value })} />
        </label>
        <p className="rounded-[16px] bg-(--color-bo-surface-2) px-4 py-3 text-[13px] leading-5" data-testid="einwilligung-zusammenfassung">
          {EINWILLIGUNG.wirdGespeichert(ZWECK_TEXT[w.zweck], KANAL_TEXT[w.kanal], w.textversion, zeit)}
        </p>
      </div>
    </Dialog>
  );
}

/** D4 – Keine Werbung mehr: ein Dialog mit Umfang; neutral (nicht rot), es ist das Recht des Kunden. */
export function KeineWerbungDialog({ offen, onSchliessen, email, abo, einwilligungen = [], gesperrt = false }) {
  const [umfang, setUmfang] = useState("alle");
  const [kanal, setKanal] = useState("antwort_mail");
  const [grund, setGrund] = useState("");
  const { sofort, laeuft } = useAktion();
  const plan = keineWerbungPlan({ abo, einwilligungen, umfang });
  const fakten = umfang === "newsletter" ? KEINE_WERBUNG.fakten.newsletter : `${KEINE_WERBUNG.fakten.alle(plan.zwecke)}${umfang === "kontakt" ? ` ${KEINE_WERBUNG.fakten.kontakt}` : ""}`;
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={KEINE_WERBUNG.titel(email)}
      groesse="md"
      testid="keine-werbung-dialog"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf
            variant="primary"
            laedt={laeuft}
            disabled={laeuft || gesperrt}
            onClick={async () => {
              const r = await sofort(() => keineWerbungAction({ email, umfang, kanal, grund }), { ok: KEINE_WERBUNG.ok(email), unter: undefined });
              if (r?.ok) onSchliessen();
            }}
            data-testid="keine-werbung-bestaetigen"
          >
            {KEINE_WERBUNG.knopf}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bo-mar-feld">
          <span>{KEINE_WERBUNG.umfang}</span>
          <div className="bo-mar-wahl">
            {Object.entries(KEINE_WERBUNG.umfaenge).map(([w, t]) => (
              <label key={w}>
                <input type="radio" name="umfang" value={w} checked={umfang === w} onChange={() => setUmfang(w)} />
                <b>{t}</b>
              </label>
            ))}
          </div>
        </div>
        <div className="bo-mar-feld">
          <span>{KEINE_WERBUNG.kanal}</span>
          <Segment label={KEINE_WERBUNG.kanal} groesse="s" wert={kanal} onWechsel={setKanal} optionen={Object.entries(KEINE_WERBUNG.kanaele).map(([w, t]) => ({ wert: w, titel: t }))} />
        </div>
        <label className="bo-mar-feld">
          <span>{KEINE_WERBUNG.grund}</span>
          <input className="bo-mar-eingabe" value={grund} onChange={(e) => setGrund(e.target.value)} />
        </label>
        <p className="flex gap-3 rounded-[16px] bg-(--color-bo-surface-2) px-4 py-3 text-[14px] leading-5" data-testid="keine-werbung-fakten">
          <Icon name="Info" className="mt-0.5 size-4 shrink-0" />
          <span>{fakten}</span>
        </p>
      </div>
    </Dialog>
  );
}

/** Dialog-Öffner über ?dialog=… (Palette, Übersicht „+ Neu“) für die Empfänger-Seite. */
export function EmpfaengerDialoge({ dialog, interessen, faehig, websiteUrl, textversion }) {
  const router = useRouter();
  const [offen, setOffen] = useState(dialog || null);
  const zu = () => {
    setOffen(null);
    router.replace("/marketing/empfaenger", { scroll: false });
  };
  const einmal = useRef(false);
  useEffect(() => {
    if (!einmal.current) einmal.current = true;
  }, []);
  return (
    <>
      <span className="inline-flex flex-wrap gap-2">
        <Knopf icon="Shield" onClick={() => setOffen("einwilligung")} data-testid="einwilligung-oeffnen">
          {EMPFAENGER.einwilligung}
        </Knopf>
        <Knopf variant="primary" icon="UserPlus" onClick={() => setOffen("anmeldung")} data-testid="anmeldung-oeffnen">
          {EMPFAENGER.anmeldung}
        </Knopf>
      </span>
      {offen === "anmeldung" && <AnmeldungDialog offen onSchliessen={zu} interessen={interessen} faehig={faehig.anmeldung} websiteUrl={websiteUrl} />}
      {offen === "einwilligung" && <EinwilligungDialog offen onSchliessen={zu} textversion={textversion} kanaeleFaehig={faehig.kanaele} />}
    </>
  );
}
