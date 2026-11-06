"use client";
// Teilen-Dialog (Konzept §3.4/§4): Link für Externe mit Ablauf, optional Passwort und Download-Grenze, Hinweis
// „für wen“ (ohne E-Mail). Das Token erscheint nur in der Antwort von freigabelink_erstellen – danach nie wieder.
// Darunter aktive Links mit Widerrufen (Bestätigung, Q-C6) und – bei Projektdateien – die Portal-Freigabe
// (verzögerter Commit über den Aufrufer).

import { useEffect, useId, useState } from "react";
import { Check, Copy, KeyRound, Link2 } from "lucide-react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Bestaetigen from "../Bestaetigen";
import Segment from "../Segment";
import Schalter from "../Schalter";
import { Pille } from "../StatusBadge";
import { useToast } from "../Toast";
import { FREIGABE_STATUS } from "@/lib/backoffice/ablage/labels";
import { freigabeStatus } from "@/lib/backoffice/ablage/regeln";
import { dateiDetailAction, freigabelinkErstellenAction, freigabelinkWiderrufenAction } from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";
import { datumKurz } from "./zeit";

const TAGE = [1, 7, 14, 30];

export default function TeilenDialog({ datei, info, offen, onSchliessen, onGeaendert, portalErlaubt, onPortal, linkMailen = false }) {
  const id = useId();
  const { zeige } = useToast();
  const standard = Math.min(info?.freigabe_standard_tage || 7, info?.freigabe_max_tage || 90);
  const [tage, setTage] = useState(String(TAGE.includes(standard) ? standard : 7));
  const [mitPasswort, setMitPasswort] = useState(Boolean(info?.freigabe_passwort_pflicht));
  const [passwort, setPasswort] = useState("");
  const [max, setMax] = useState("");
  const [hinweis, setHinweis] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [kopiert, setKopiert] = useState(false);
  const [links, setLinks] = useState(null);
  const [widerruf, setWiderruf] = useState(null);
  const [portal, setPortal] = useState(Boolean(datei.portal_freigabe));

  const ladeLinks = async () => {
    const r = await dateiDetailAction({ datei: datei.datei });
    if (r.ok) setLinks((r.daten.alleLinks || []).filter((l) => l.status === "Aktiv"));
  };
  useEffect(() => {
    if (!offen) return undefined;
    let aktiv = true;
    dateiDetailAction({ datei: datei.datei }).then((r) => aktiv && r.ok && setLinks((r.daten.alleLinks || []).filter((l) => l.status === "Aktiv")));
    return () => {
      aktiv = false;
    };
  }, [offen, datei.datei]);

  const erstellen = async () => {
    if (mitPasswort && passwort.length < 6) return setFehler(T.teilen.fehlerPasswort);
    setLaeuft(true);
    setFehler(null);
    const r = await freigabelinkErstellenAction({ datei: datei.datei, tage: Number(tage), passwort: mitPasswort ? passwort : undefined, maxDownloads: Number(max) || undefined, hinweis });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    setErgebnis(r.daten);
    onGeaendert?.({ ...datei, freigabelinks_aktiv: (datei.freigabelinks_aktiv || 0) + 1 });
    zeige(T.toast.linkErstellt, { art: "ok" });
    ladeLinks();
  };

  const kopieren = async () => {
    if (!ergebnis?.url) return;
    try {
      await navigator.clipboard.writeText(ergebnis.url);
    } catch {
      document.getElementById(`${id}-link`)?.select();
      document.execCommand?.("copy");
    }
    setKopiert(true);
    zeige(T.toast.linkKopiert, { art: "ok" });
    setTimeout(() => setKopiert(false), 2000);
  };

  return (
    <>
      <Dialog
        offen={offen && !widerruf}
        onSchliessen={onSchliessen}
        titel={T.teilen.titel}
        text={datei.dateiname}
        groesse="md"
        sperren={laeuft}
        testid="abl-teilen"
        fuss={
          ergebnis ? (
            <Knopf variant="primary" onClick={onSchliessen}>
              {T.teilen.fertig}
            </Knopf>
          ) : (
            <>
              <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
                {T.dialog.abbrechen}
              </Knopf>
              <Knopf variant="primary" onClick={erstellen} laedt={laeuft} data-testid="abl-link-erstellen">
                {T.teilen.erstellen}
              </Knopf>
            </>
          )
        }
      >
        <div className="flex flex-col gap-5">
          {ergebnis ? (
            <section className="flex flex-col gap-3" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid size-7 place-items-center rounded-full bg-bo-salbei-soft text-bo-salbei-text">
                  <Check className="size-4" />
                </span>
                {T.teilen.erstellt}
                {ergebnis.passwort && <Pille material="messing">{T.teilen.mitPasswort}</Pille>}
              </p>
              {ergebnis.url ? (
                <div className="bo-abl-linkbox">
                  <Link2 className="size-4 shrink-0 text-bo-text-soft" aria-hidden="true" />
                  <input id={`${id}-link`} readOnly value={ergebnis.url} aria-label={T.teilen.link} data-testid="abl-link-url" onFocus={(e) => e.target.select()} />
                  <Knopf variant="primary" size="s" onClick={kopieren} data-testid="abl-link-kopieren">
                    {kopiert ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {kopiert ? T.teilen.kopiert : T.teilen.kopieren}
                  </Knopf>
                </div>
              ) : (
                <p className="bo-abl-hinweis" data-ton="eiche">
                  {T.teilen.keineBasisUrl}
                </p>
              )}
              <p className="text-[13px] text-bo-text-soft">
                {T.teilen.ablauf(datumKurz(ergebnis.ablauf))} · {T.teilen.nurJetzt}
              </p>
              <Knopf variant="secondary" size="s" disabled={!linkMailen} grund={!linkMailen ? `Noch nicht verfügbar – ${T.teilen.kopieren} und im eigenen Postfach senden` : undefined}>
                {T.teilen.perMail}
              </Knopf>
            </section>
          ) : (
            <section className="flex flex-col gap-4">
              <p className="text-sm text-bo-text-soft">{T.teilen.linkText}</p>
              <div className="flex flex-col gap-1.5">
                <span id={`${id}-tage`} className="text-[13px] font-medium text-bo-text-soft">
                  {T.teilen.gueltig}
                </span>
                <Segment label={T.teilen.gueltig} wert={tage} onWechsel={setTage} optionen={TAGE.filter((t) => t <= (info?.freigabe_max_tage || 90)).map((t) => ({ wert: String(t), titel: T.teilen.tage(t) }))} breit />
              </div>
              <Schalter label={T.teilen.passwort} beschreibung={info?.freigabe_passwort_pflicht ? T.teilen.passwortPflicht : T.teilen.passwortHinweis} an={mitPasswort} onWechsel={setMitPasswort} deaktiviert={Boolean(info?.freigabe_passwort_pflicht)} />
              {mitPasswort && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-bo-text-soft">{T.teilen.passwort}</span>
                  <span className="relative">
                    <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-bo-text-faint" aria-hidden="true" />
                    <input type="password" autoComplete="new-password" className="bo-input pl-9" value={passwort} onChange={(e) => (setPasswort(e.target.value), setFehler(null))} minLength={6} data-testid="abl-link-passwort" />
                  </span>
                </label>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-bo-text-soft">{T.teilen.maxDownloads}</span>
                  <select className="bo-input" value={max} onChange={(e) => setMax(e.target.value)}>
                    <option value="">{T.teilen.unbegrenzt}</option>
                    {[1, 3, 5, 10].map((n) => (
                      <option key={n} value={n}>
                        {T.teilen.malLaden(n)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-bo-text-soft">{T.teilen.hinweis}</span>
                  <input className="bo-input" value={hinweis} onChange={(e) => setHinweis(e.target.value)} placeholder={T.teilen.hinweisPlatzhalter} maxLength={140} />
                </label>
              </div>
              <p className="text-xs text-bo-text-faint">{T.teilen.hinweisText}</p>
              {fehler && (
                <p className="text-xs text-bo-ziegel-text" role="alert">
                  {fehler}
                </p>
              )}
            </section>
          )}

          <section className="flex flex-col gap-1" aria-labelledby={`${id}-aktiv`}>
            <h3 id={`${id}-aktiv`} className="text-[13px] font-medium text-bo-text-soft">
              {T.teilen.aktiv}
            </h3>
            {links === null ? (
              <div className="bo-skeleton h-12 rounded-2xl" />
            ) : links.length === 0 ? (
              <p className="py-2 text-sm text-bo-text-soft">{T.teilen.keineAktiv}</p>
            ) : (
              <ul>
                {links.map((l) => {
                  const st = freigabeStatus(l);
                  return (
                    <li key={l.freigabelink} className="bo-abl-linkzeile" data-testid="abl-link-zeile">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-bo-surface-2">
                        <Link2 className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{l.empfaenger_hinweis || T.teilen.link}</span>
                        <span className="block text-xs text-bo-text-soft tabular-nums">
                          {T.teilen.ablauf(datumKurz(l.ablauf))} · {T.teilen.downloads(l.downloads, l.max_downloads)}
                          {l.passwort ? ` · ${T.teilen.mitPasswort}` : ""}
                        </span>
                      </span>
                      <Pille material={FREIGABE_STATUS[st]?.material || "stein"}>{FREIGABE_STATUS[st]?.titel || st}</Pille>
                      <Knopf variant="ghost" size="s" onClick={() => setWiderruf(l)}>
                        {T.aktionen.widerrufen}
                      </Knopf>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(portalErlaubt?.an || portalErlaubt?.grund) && (
            <section className="bo-abl-eingelassen flex flex-col gap-2">
              <Schalter
                label={T.teilen.portalSchalter}
                beschreibung={portalErlaubt.an ? T.teilen.portalText : portalErlaubt.grund}
                an={portal}
                deaktiviert={!portalErlaubt.an}
                onWechsel={(an) => {
                  setPortal(an);
                  onPortal?.(an);
                }}
                testid="abl-portal-schalter"
              />
            </section>
          )}
        </div>
      </Dialog>
      <Bestaetigen
        offen={!!widerruf}
        titel={T.dialog.widerrufenFrage}
        text={T.dialog.widerrufenText}
        fakten={widerruf ? [{ label: T.teilen.hinweis, wert: widerruf.empfaenger_hinweis || "–" }, { label: T.teilen.gueltig, wert: datumKurz(widerruf.ablauf) }] : []}
        bestaetigen={T.aktionen.widerrufen}
        gefaehrlich
        onAbbrechen={() => setWiderruf(null)}
        onBestaetigen={async () => {
          const r = await freigabelinkWiderrufenAction({ freigabelink: widerruf.freigabelink });
          setWiderruf(null);
          if (!r.ok) return zeige(r.message, { art: "fehler" });
          zeige(T.toast.widerrufen, { art: "ok" });
          onGeaendert?.({ ...datei, freigabelinks_aktiv: Math.max(0, (datei.freigabelinks_aktiv || 1) - 1) });
          ladeLinks();
        }}
      />
    </>
  );
}
