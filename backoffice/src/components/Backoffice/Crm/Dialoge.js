"use client";
// Dialoge des CRM (§ 2.4, § 3.3, § 5): nur wo eine Pflichtangabe, Außenwirkung oder Endgültigkeit es verlangt.
// Alle auf dem Fundament-Dialog (Material, Radius 32, Bottom-Sheet am Telefon), eine Primäraktion in Tinte.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import Datumsfeld from "../Formular/Datumsfeld";
import { Feld } from "./Teile";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import {
  anfrageAnlegenAction, aufgabeAnlegenAction, datenschutzErfassenAction, dublettenAction, kontaktAnlegenAction,
  kontaktStatusAction, mailSendenAction, terminAbsagenAction, verlorenAction,
} from "@/lib/backoffice/crm/actions";

const morgen = () => {
  const d = new Date(Date.now() + 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const heute = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Fuss({ abbrechen, primaer, laedt, onPrimaer, deaktiviert, testid }) {
  return (
    <>
      <Knopf variant="ghost" onClick={abbrechen}>{T.knopf.abbrechen}</Knopf>
      <Knopf variant="primary" onClick={onPrimaer} laedt={laedt} disabled={deaktiviert} data-testid={testid}>{primaer}</Knopf>
    </>
  );
}

// ------------------------------------------------------------- Verloren --

export function VerlorenDialog({ offen, onSchliessen, anfrage }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [grund, setGrund] = useState("");
  const [mitbewerber, setMitbewerber] = useState("");
  const [details, setDetails] = useState("");
  const [fehler, setFehler] = useState("");
  const senden = async () => {
    if (!grund) return setFehler(T.dialog.grundPflicht);
    const r = await fuehre(() => verlorenAction({ name: anfrage.name, grund, mitbewerber, details }), { text: T.toast.verloren, fehlerText: "Verloren", objekt: { doctype: "PH Anfrage", name: anfrage.name } });
    if (r?.ok) onSchliessen();
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.dialog.verlorenTitel(anfrage?.titelKurz || anfrage?.name || "")} groesse="sm" sperren={laeuft} testid="crm-verloren" fuss={<Fuss abbrechen={onSchliessen} primaer={T.knopf.verloren.replace(" …", "")} laedt={laeuft} onPrimaer={senden} testid="crm-verloren-senden" />}>
      <div className="grid gap-4">
        <Feld label={T.dialog.grundPflicht.replace("Bitte einen ", "").replace(" wählen", "")} fehler={fehler} eingelassen>
          <select value={grund} onChange={(e) => (setGrund(e.target.value), setFehler(""))} aria-invalid={!!fehler} data-testid="crm-verloren-grund">
            <option value="">–</option>
            {T.verlorenGruende.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Feld>
        {grund === "Mitbewerber" && (
          <Feld label={T.dialog.mitbewerber} eingelassen>
            <input value={mitbewerber} onChange={(e) => setMitbewerber(e.target.value)} />
          </Feld>
        )}
        <Feld label={T.dialog.details} eingelassen>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} />
        </Feld>
      </div>
    </Dialog>
  );
}

// -------------------------------------------------------------- Aufgabe --

export function AufgabeDialog({ offen, onSchliessen, bezug, kontakt, berater = [], ich }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [titel, setTitel] = useState("");
  const [faellig, setFaellig] = useState(morgen());
  const [zugewiesen, setZugewiesen] = useState(ich || "");
  const [fehler, setFehler] = useState("");
  const senden = async () => {
    if (!titel.trim()) return setFehler(T.dialog.aufgabeTitelFeld);
    const r = await fuehre(() => aufgabeAnlegenAction({ titel, faellig, zugewiesen, bezug, kontakt }), { text: T.toast.aufgabe(titel.trim()) });
    if (r?.ok) {
      setTitel("");
      onSchliessen();
    }
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.dialog.aufgabeTitel} groesse="sm" testid="crm-aufgabe" fuss={<Fuss abbrechen={onSchliessen} primaer={T.knopf.anlegen} laedt={laeuft} onPrimaer={senden} testid="crm-aufgabe-senden" />}>
      <div className="grid gap-4">
        <Feld label={T.dialog.aufgabeTitelFeld} fehler={fehler} eingelassen>
          <input value={titel} onChange={(e) => (setTitel(e.target.value), setFehler(""))} autoFocus data-testid="crm-aufgabe-titel" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && senden()} />
        </Feld>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bo-crm-feld">
            <span id="crm-aufgabe-faellig">{T.dialog.faellig}</span>
            <Datumsfeld value={faellig} onChange={setFaellig} gruppeLabelId="crm-aufgabe-faellig" aria-label={T.dialog.faellig} />
          </div>
          {berater.length > 0 && (
            <Feld label={T.dialog.zugewiesen} eingelassen>
              <select value={zugewiesen} onChange={(e) => setZugewiesen(e.target.value)}>
                {berater.map((b) => <option key={b.wert} value={b.wert}>{b.titel}</option>)}
              </select>
            </Feld>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// -------------------------------------------------------- Neue Anfrage --

const ARTEN_SEGMENT = ["Kontakt", "Beratung", "Produkt", "Termin", "Sonstige"];

export function NeueAnfrageDialog({ offen, onSchliessen }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const leer = { art: "Beratung", quelle: "telefon", anrede: "", vorname: "", nachname: "", email: "", telefon: "", plz_ort: "", firma: "", anliegen: "", datenschutzhinweis: "mündlich erteilt", kontakt: "" };
  const [w, setW] = useState(leer);
  const [fehler, setFehler] = useState({});
  const [dubletten, setDubletten] = useState(null);
  const setze = (k) => (e) => setW((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  useEffect(() => {
    if (!offen) return;
    const t = setTimeout(() => {
      try {
        const e = sessionStorage.getItem("ph-bo:crm:neue-anfrage");
        if (e) setW((x) => ({ ...x, ...JSON.parse(e) }));
      } catch {
        // Entwurf ist Komfort
      }
    }, 0);
    return () => clearTimeout(t);
  }, [offen]);
  useEffect(() => {
    if (!offen) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem("ph-bo:crm:neue-anfrage", JSON.stringify(w));
      } catch {
        // Speicher gesperrt
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [w, offen]);

  const pruefen = async () => {
    if (!w.email && !w.telefon) return;
    const r = await dublettenAction({ email: w.email, telefon: w.telefon, nachname: w.nachname });
    setDubletten(r.ok ? r.treffer : "fehler");
  };

  const senden = async (oeffnen) => {
    const r = await fuehre(() => anfrageAnlegenAction(w), { text: T.dialog.angelegt([w.vorname, w.nachname].filter(Boolean).join(" ") || w.nachname) });
    if (!r?.ok) return setFehler(r?.fehler || {});
    try {
      sessionStorage.removeItem("ph-bo:crm:neue-anfrage");
    } catch {
      // egal
    }
    setW(leer);
    onSchliessen();
    if (oeffnen) router.push(`/crm/anfragen/${encodeURIComponent(r.name)}`);
  };

  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.dialog.neueAnfrageTitel} groesse="md" testid="crm-neue-anfrage"
      fuss={<><Knopf variant="ghost" onClick={onSchliessen}>{T.knopf.abbrechen}</Knopf><Knopf variant="secondary" onClick={() => senden(true)} laedt={laeuft}>{T.knopf.anlegenOeffnen}</Knopf><Knopf variant="primary" onClick={() => senden(false)} laedt={laeuft} data-testid="crm-neue-anfrage-senden" kuerzel="Strg+Enter">{T.knopf.anlegen}</Knopf></>}>
      <div className="grid gap-4" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && senden(false)}>
        <Segment label="Art" wert={w.art} onWechsel={setze("art")} optionen={ARTEN_SEGMENT.map((a) => ({ wert: a, titel: T.art[a] }))} groesse="s" breit />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]">
          <Feld label={T.dialog.anrede} eingelassen>
            <select value={w.anrede} onChange={setze("anrede")}>
              <option value="">{T.dialog.keineAngabe}</option>
              {["Frau", "Herr", "Divers", "Firma"].map((a) => <option key={a}>{a}</option>)}
            </select>
          </Feld>
          <Feld label={T.dialog.vorname} eingelassen><input value={w.vorname} onChange={setze("vorname")} autoComplete="off" /></Feld>
          <Feld label={`${T.dialog.nachname} *`} fehler={fehler.nachname} eingelassen><input value={w.nachname} onChange={setze("nachname")} data-testid="crm-na-nachname" autoComplete="off" aria-invalid={!!fehler.nachname} /></Feld>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld label={`${T.dialog.email} *`} fehler={fehler.email} eingelassen hinweis="E-Mail oder Telefon">
            <input type="email" value={w.email} onChange={setze("email")} onBlur={pruefen} data-testid="crm-na-email" autoComplete="off" aria-invalid={!!fehler.email} />
          </Feld>
          <Feld label={T.dialog.telefon} eingelassen><input type="tel" value={w.telefon} onChange={setze("telefon")} onBlur={pruefen} autoComplete="off" /></Feld>
        </div>
        {Array.isArray(dubletten) && dubletten.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-[16px] bg-bo-eiche-soft px-4 py-3 text-[14px] text-bo-eiche-text" role="status">
            <span className="min-w-0 flex-1">{T.dialog.duplikat(`${dubletten[0].titel} (${dubletten[0].grund})`)}</span>
            <Knopf size="s" variant={w.kontakt === dubletten[0].name ? "primary" : "secondary"} onClick={() => setW((x) => ({ ...x, kontakt: dubletten[0].name }))}>{T.knopf.zuordnen}</Knopf>
          </div>
        )}
        {dubletten === "fehler" && <p className="text-[13px] text-bo-text-soft">Prüfung auf bestehende Kontakte nicht möglich.</p>}
        <Feld label={`${T.dialog.anliegen} *`} fehler={fehler.anliegen} eingelassen>
          <textarea value={w.anliegen} onChange={setze("anliegen")} rows={3} data-testid="crm-na-anliegen" aria-invalid={!!fehler.anliegen} />
        </Feld>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld label={T.dialog.plzOrt} eingelassen><input value={w.plz_ort} onChange={setze("plz_ort")} /></Feld>
          <Feld label="Quelle" eingelassen>
            <select value={w.quelle} onChange={setze("quelle")}>
              {["telefon", "showroom", "email", "empfehlung", "messe", "sonstige"].map((q) => <option key={q} value={q}>{T.quelle[q]}</option>)}
            </select>
          </Feld>
        </div>
        <div className="bo-crm-feld">
          <span>{T.dialog.datenschutzhinweis}</span>
          <Segment label={T.dialog.datenschutzhinweis} wert={w.datenschutzhinweis} onWechsel={setze("datenschutzhinweis")} optionen={T.dialog.dsOptionen.map((o) => ({ wert: o, titel: o }))} groesse="s" />
        </div>
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------- Neuer Kontakt --

export function NeuerKontaktDialog({ offen, onSchliessen }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const leer = { kontaktart: "Privat", anrede: "", vorname: "", nachname: "", firma: "", email: "", telefon: "", strasse: "", plz: "", ort: "" };
  const [w, setW] = useState(leer);
  const [fehler, setFehler] = useState({});
  const [bestehend, setBestehend] = useState(null);
  const setze = (k) => (e) => setW((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const senden = async (trotzdem = false) => {
    const r = await fuehre(() => kontaktAnlegenAction({ ...w, trotzdem }), { text: T.dialog.kontaktAngelegt([w.vorname, w.nachname].filter(Boolean).join(" ")) });
    if (r?.code === "conflict" && r.bestehend) return setBestehend(r.bestehend);
    if (!r?.ok) return setFehler(r?.fehler || {});
    setW(leer);
    setBestehend(null);
    onSchliessen();
    router.push(`/kunden/${encodeURIComponent(r.name)}`);
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.knopf.neuerKontakt} groesse="md" testid="crm-neuer-kontakt" fuss={<Fuss abbrechen={onSchliessen} primaer={T.knopf.anlegen} laedt={laeuft} onPrimaer={() => senden(false)} testid="crm-nk-senden" />}>
      <div className="grid gap-4">
        <Segment label={T.dialog.kontaktartLabel} wert={w.kontaktart} onWechsel={setze("kontaktart")} optionen={["Privat", "Geschaeft", "Architekt", "Partner"].map((a) => ({ wert: a, titel: T.kontaktart[a] }))} groesse="s" breit />
        {w.kontaktart !== "Privat" && <Feld label={T.dialog.firma} eingelassen><input value={w.firma} onChange={setze("firma")} /></Feld>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld label={T.dialog.vorname} eingelassen><input value={w.vorname} onChange={setze("vorname")} /></Feld>
          <Feld label={`${T.dialog.nachname} *`} fehler={fehler.nachname} eingelassen><input value={w.nachname} onChange={setze("nachname")} data-testid="crm-nk-nachname" /></Feld>
          <Feld label={T.dialog.email} eingelassen><input type="email" value={w.email} onChange={setze("email")} /></Feld>
          <Feld label={T.dialog.telefon} eingelassen><input type="tel" value={w.telefon} onChange={setze("telefon")} /></Feld>
          <Feld label={T.dialog.strasse} eingelassen className="sm:col-span-2"><input value={w.strasse} onChange={setze("strasse")} /></Feld>
          <Feld label={T.dialog.plz} eingelassen><input value={w.plz} onChange={setze("plz")} inputMode="numeric" /></Feld>
          <Feld label={T.dialog.ort} eingelassen><input value={w.ort} onChange={setze("ort")} /></Feld>
        </div>
        {bestehend?.length > 0 && (
          <div className="grid gap-2 rounded-[16px] bg-bo-eiche-soft px-4 py-3 text-[14px] text-bo-eiche-text" role="status">
            <p>{T.dialog.duplikat(`${bestehend[0].titel} (${bestehend[0].grund})`)}</p>
            <div className="flex flex-wrap gap-2">
              <Knopf size="s" variant="secondary" href={`/kunden/${encodeURIComponent(bestehend[0].name)}`}>{T.knopf.oeffnen}</Knopf>
              <Knopf size="s" variant="ghost" onClick={() => senden(true)}>Trotzdem anlegen</Knopf>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------- E-Mail --

export function MailDialog({ offen, onSchliessen, an = "", bezug, widerspruch = false, betreff: betreffStart = "", eigenesPostfach = true, grund }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [w, setW] = useState({ an, betreff: betreffStart, nachricht: "", vertragsbezogen: widerspruch });
  const [fehler, setFehler] = useState("");
  const zuletzt = useRef(an);
  useEffect(() => {
    if (zuletzt.current !== an) {
      zuletzt.current = an;
      setW((x) => ({ ...x, an }));
    }
  }, [an]);
  const senden = async () => {
    if (!w.an || !w.betreff) return setFehler(T.mails.senden.pflicht);
    const r = await fuehre(() => mailSendenAction({ an: w.an, betreff: w.betreff, nachricht: w.nachricht, bezug, vertragsbezogen: w.vertragsbezogen }), { text: T.mails.senden.gesendet(w.an), fehlerText: "E-Mail" });
    if (r?.ok) {
      setW({ an, betreff: "", nachricht: "", vertragsbezogen: widerspruch });
      onSchliessen();
    } else setFehler(r?.message || "");
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.mails.senden.titel} text={eigenesPostfach ? T.mails.senden.eigenesPostfach : undefined} groesse="md" testid="crm-mail"
      fuss={<Fuss abbrechen={onSchliessen} primaer={T.knopf.senden} laedt={laeuft} onPrimaer={senden} deaktiviert={!!grund} testid="crm-mail-senden" />}>
      <div className="grid gap-4">
        {grund && <p className="rounded-[16px] bg-bo-fill px-4 py-3 text-[13px] text-bo-text-soft">{grund}</p>}
        <Feld label={T.mails.senden.an} eingelassen><input type="email" value={w.an} onChange={(e) => setW((x) => ({ ...x, an: e.target.value }))} /></Feld>
        <Feld label={T.mails.senden.betreff} eingelassen fehler={fehler}><input value={w.betreff} onChange={(e) => (setW((x) => ({ ...x, betreff: e.target.value })), setFehler(""))} data-testid="crm-mail-betreff" /></Feld>
        <Feld label={T.mails.senden.text} eingelassen><textarea rows={8} value={w.nachricht} onChange={(e) => setW((x) => ({ ...x, nachricht: e.target.value }))} /></Feld>
        {widerspruch && <p className="text-[13px] text-bo-text-soft">{T.mails.senden.vertragsbezogenPflicht}</p>}
        <Schalter label={T.mails.senden.vertragsbezogen} an={w.vertragsbezogen} onWechsel={(v) => setW((x) => ({ ...x, vertragsbezogen: widerspruch ? true : v }))} deaktiviert={widerspruch} />
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------- Absagen --

export function AbsagenDialog({ offen, onSchliessen, termin, leitung = false }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [grund, setGrund] = useState("");
  const [mail, setMail] = useState(termin?.kundenmail !== "website" && !!termin?.email);
  const [ablehnen, setAblehnen] = useState(false);
  const [fehler, setFehler] = useState("");
  const senden = async () => {
    if (!grund.trim()) return setFehler("Bitte einen Grund angeben.");
    const r = await fuehre(() => terminAbsagenAction({ name: termin.name, grund, mail, ablehnen }), { text: T.toast.abgesagt, fehlerText: "Absagen" });
    if (r?.ok) onSchliessen();
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.termine.absagenTitel} groesse="sm" sperren={laeuft} testid="crm-absagen" fuss={<Fuss abbrechen={onSchliessen} primaer="Absagen" laedt={laeuft} onPrimaer={senden} testid="crm-absagen-senden" />}>
      <div className="grid gap-4">
        <Feld label={`${T.termine.grund} *`} fehler={fehler} eingelassen><textarea rows={3} value={grund} onChange={(e) => (setGrund(e.target.value), setFehler(""))} data-testid="crm-absagen-grund" /></Feld>
        {termin?.email && termin?.kundenmail !== "website" && <Schalter label={T.termine.kundeInformieren} an={mail} onWechsel={setMail} />}
        {leitung && termin?.status === "Unbestaetigt" && <Schalter label={T.termine.alsAnfrageAblehnen} an={ablehnen} onWechsel={setAblehnen} />}
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------- Widerspruch --

export function WiderspruchDialog({ offen, onSchliessen, kontakt }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [quelle, setQuelle] = useState("");
  const [fehler, setFehler] = useState("");
  const senden = async () => {
    if (!quelle) return setFehler("Bitte die Quelle wählen.");
    const r = await fuehre(() => kontaktStatusAction({ name: kontakt, aktion: "widerspruch", grund: quelle }), { text: T.toast.widerspruch });
    if (r?.ok) onSchliessen();
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={`${T.knopf.widerspruch}?`} text={T.dialog.widerspruchText} groesse="sm" testid="crm-widerspruch" fuss={<Fuss abbrechen={onSchliessen} primaer="Erfassen" laedt={laeuft} onPrimaer={senden} />}>
      <div className="bo-crm-feld">
        <span>{T.dialog.widerspruchQuelle} *</span>
        <Segment label={T.dialog.widerspruchQuelle} wert={quelle} onWechsel={(v) => (setQuelle(v), setFehler(""))} optionen={T.dialog.widerspruchQuellen.map((q) => ({ wert: q, titel: q }))} groesse="s" />
        {fehler && <em className="bo-crm-feld__fehler not-italic">{fehler}</em>}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------- Datenschutz --

export function DatenschutzDialog({ offen, onSchliessen, kontakt }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const [art, setArt] = useState("Auskunft");
  const [kanal, setKanal] = useState("E-Mail");
  const [eingang, setEingang] = useState(heute());
  const [beschreibung, setBeschreibung] = useState("");
  const senden = async () => {
    const r = await fuehre(() => datenschutzErfassenAction({ kontakt, art, kanal, eingang, beschreibung }), { text: T.toast.dsa });
    if (r?.ok) {
      onSchliessen();
      router.push(`/crm/datenschutz/${encodeURIComponent(r.name)}`);
    }
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.datenschutz.erfassen} groesse="md" testid="crm-dsa" fuss={<Fuss abbrechen={onSchliessen} primaer="Erfassen" laedt={laeuft} onPrimaer={senden} />}>
      <div className="grid gap-4">
        <Feld label={T.dialog.dsaArt} eingelassen>
          <select value={art} onChange={(e) => setArt(e.target.value)}>
            {Object.entries(T.dsaArt).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Feld>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bo-crm-feld"><span id="crm-dsa-eingang">{T.dialog.eingang}</span><Datumsfeld value={eingang} onChange={setEingang} gruppeLabelId="crm-dsa-eingang" aria-label={T.dialog.eingang} /></div>
          <Feld label={T.dialog.kanal} eingelassen>
            <select value={kanal} onChange={(e) => setKanal(e.target.value)}>
              {["E-Mail", "Brief", "Telefon", "Showroom", "Portal", "Website"].map((k) => <option key={k}>{k}</option>)}
            </select>
          </Feld>
        </div>
        <Feld label={T.dialog.beschreibung} eingelassen><textarea rows={3} value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} /></Feld>
      </div>
    </Dialog>
  );
}
