"use client";
// Neue Karte im Showroom (Konzept §3.10): ein Formular – Person · Einwilligungen (mit Nachweis) · eingeklappt
// „Weitere Angaben“; rechts der Live-Satz „Legt an: …“. Doppelklick/Netzabbruch erzeugt nie zwei Karten
// (Idempotenz-Schlüssel je Formular). Entwurf in sessionStorage (für „An Kundin übergeben“ und Esc).

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import { Icon } from "../icons";
import { Bestaetigen } from "../Overlay";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import MiniKarte from "./MiniKarte";
import StufenKennzeichen from "./StufenKennzeichen";
import { Textfeld } from "./Dialoge";
import { NachweisAufnahme } from "./EinwilligungDialog";
import { kontaktSuchenAction, kundenmodusStandAction, kundenmodusStartenAction, neueKarteAction } from "@/lib/backoffice/kundenkarte/actions";
import { geburtstagParsen } from "@/lib/backoffice/kundenkarte/regeln";
import { DATENSCHUTZINFO_VERSION, T } from "@/lib/backoffice/kundenkarte/texte";

const ENTWURF = "ph-bo:kundenkarte:neu";
const LEER = { kontakt: null, vorname: "", nachname: "", email: "", telefon: "", plz: "", ort: "", sprache: "de", teilnahme: false, datenschutz: false, volljaehrig: false, auswertung: false, newsletter: false, geburtstag: "", interessen: "", berater: "", stufe: "", spaeter: false };

function lies() {
  try {
    return JSON.parse(sessionStorage.getItem(ENTWURF) || "null");
  } catch {
    return null;
  }
}
function schreibe(w) {
  try {
    if (w) sessionStorage.setItem(ENTWURF, JSON.stringify(w));
    else sessionStorage.removeItem(ENTWURF);
  } catch {
    /* Speicher gesperrt – Entwurf bleibt nur im Speicher der Seite */
  }
}

export default function NeueKarte({ version = "", kontaktStart = null, stufen = [], berater = [], leitung = false, kundenmodus = "" }) {
  const router = useRouter();
  const [w, setW] = useState(() => ({ ...LEER, kontakt: kontaktStart, stufe: stufen[0]?.name || "" }));
  const [geladen, setGeladen] = useState(false);
  const [datei, setDatei] = useState(null);
  const [km, setKm] = useState(kundenmodus ? { id: kundenmodus, bestaetigt: null } : null);
  const [mehrPerson, setMehrPerson] = useState(false);
  const [weitere, setWeitere] = useState(false);
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [ohneRecht, setOhneRecht] = useState(false);
  const [fehler, setFehler] = useState({});
  const [ergebnis, setErgebnis] = useState(null);
  const [verwerfen, setVerwerfen] = useState(false);
  const [laeuft, starte] = useTransition();
  const [uuid] = useState(() => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Math.random()}`.slice(2)));

  useEffect(() => {
    if (geladen) return;
    const e = kundenmodus ? lies() : null;
    if (e) setW((x) => ({ ...x, ...e })); // eslint-disable-line react-hooks/set-state-in-effect
    setGeladen(true);
  }, [geladen, kundenmodus]);
  useEffect(() => {
    if (!km?.id || km.bestaetigt) return undefined;
    let aktiv = true;
    const pruefe = async () => {
      const r = await kundenmodusStandAction({ sitzung: km.id });
      if (aktiv && r?.ok && r.bestaetigt) {
        setKm({ id: km.id, bestaetigt: r.bestaetigt });
        setW((x) => ({ ...x, auswertung: r.schalter?.auswertung ?? x.auswertung, newsletter: r.schalter?.newsletter ?? x.newsletter }));
      }
    };
    pruefe();
    const t = setInterval(pruefe, 2000);
    return () => {
      aktiv = false;
      clearInterval(t);
    };
  }, [km]);
  useEffect(() => {
    if (q.trim().length < 2) return undefined;
    const h = setTimeout(async () => {
      const r = await kontaktSuchenAction({ q });
      setTreffer(r?.treffer || []);
      if (r?.ohneRecht) setOhneRecht(true);
    }, 250);
    return () => clearTimeout(h);
  }, [q]);

  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const st = stufen.find((s) => s.name === w.stufe) || stufen[0];
  const person = w.kontakt ? w.kontakt.titel : [w.vorname, w.nachname].filter(Boolean).join(" ");
  const nachweisDa = !w.auswertung || Boolean(datei) || Boolean(km?.bestaetigt);
  const geb = geburtstagParsen(w.geburtstag);
  const sperre = !version ? T.neu.ohneVersion : w.kontakt?.karte ? T.neu.hatKarte(w.kontakt.karte) : w.kontakt && !w.kontakt.privat ? T.neu.geschaeft : null;
  const fehltPerson = !w.kontakt && (!w.vorname.trim() || !w.nachname.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.email));
  const fehltHaken = !w.teilnahme || !w.datenschutz || !w.volljaehrig;
  const grund = sperre || (fehltPerson ? "Vorname, Nachname und E-Mail eintragen oder Kontakt wählen." : fehltHaken ? T.neu.fehltHaken : !nachweisDa ? T.einwilligung.fehltNachweis : !geb.ok ? geb.message : null);
  const geaendert = useMemo(() => JSON.stringify({ ...w, stufe: "" }) !== JSON.stringify({ ...LEER, kontakt: kontaktStart }), [w, kontaktStart]);

  const ausstellen = () =>
    starte(async () => {
      setFehler({});
      const fd = new FormData();
      if (w.kontakt) fd.set("kontakt", w.kontakt.name);
      for (const k of ["vorname", "nachname", "email", "telefon", "plz", "ort", "sprache", "geburtstag", "interessen", "berater"]) fd.set(k, w[k] || "");
      if (leitung && w.stufe) fd.set("stufe", w.stufe);
      for (const k of ["teilnahme", "datenschutz", "volljaehrig", "auswertung", "newsletter", "spaeter"]) fd.set(k, w[k] ? "1" : "0");
      if (w.auswertung && km?.bestaetigt) fd.set("kundenmodus", km.id);
      else if (w.auswertung && datei) fd.set("datei", datei);
      fd.set("uuid", uuid);
      const r = await neueKarteAction(fd);
      if (!r?.ok) {
        setFehler({ allgemein: r?.message || T.fehler.allgemein, ...(r?.fehler || {}) });
        return;
      }
      schreibe(null);
      setErgebnis(r);
      router.refresh();
    });

  const anKundin = () =>
    starte(async () => {
      schreibe({ ...w });
      const r = await kundenmodusStartenAction({ zweck: "neu" });
      if (!r?.ok) return setFehler({ allgemein: r?.message || T.fehler.allgemein });
      router.push(`${r.href}?zurueck=${encodeURIComponent(`/kundenkarte/karten/neu?kundenmodus=${r.sitzung}`)}`);
    });

  if (ergebnis) {
    const s = stufen.find((x) => x.name === ergebnis.stufe) || st;
    return (
      <section className="bo-kachel mx-auto max-w-2xl" data-testid="kk-neu-ergebnis">
        <div className="bo-kk-ergebnis">
          <MiniKarte nr={ergebnis.karte} name={ergebnis.name || person} stufe={s?.stufenname || ""} farbe={s?.farbe} gross drehbar={false} />
          <ErgebnisKarte
            ohneKachel
            titel={ergebnis.doppelt ? T.ausstellen.doppelt(ergebnis.karte) : ergebnis.bereits ? `Karte ${ergebnis.karte} besteht bereits` : T.ausstellen.ergebnis(ergebnis.karte)}
            unter={ergebnis.status === "Beantragt" ? "Beantragt – aktiv bei Übergabe" : "Karte ist aktiv"}
            aktionen={[
              { titel: T.ausstellen.druck, href: `/kundenkarte/karten/${ergebnis.karte}?druck=1`, icon: "Printer" },
              { titel: T.ausstellen.oeffnen, href: `/kundenkarte/karten/${ergebnis.karte}`, icon: "CreditCard" },
            ]}
            weiter={{ titel: T.neu.naechste, href: "/kundenkarte/karten/neu" }}
          />
        </div>
      </section>
    );
  }

  return (
    <form
      className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!grund) ausstellen();
      }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !grund) {
          e.preventDefault();
          ausstellen();
        }
        if (e.key === "Escape" && geaendert) setVerwerfen(true);
      }}
      data-testid="kk-neu"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <section className="bo-kachel" aria-labelledby="kk-neu-person">
          <h2 id="kk-neu-person" className="bo-kachel__titel mb-4">
            {T.neu.person}
          </h2>
          {w.kontakt ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
              <Icon name="Contact" className="size-4" />
              <span className="flex-1 text-[15px] font-semibold">
                {w.kontakt.titel} <span className="font-normal text-bo-text-soft">{w.kontakt.ort}</span>
              </span>
              <Knopf size="s" variant="ghost" onClick={() => setze("kontakt", null)}>
                Ändern
              </Knopf>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {!ohneRecht && (
                <div className="relative">
                  <Textfeld label={T.neu.kontaktSuchen} wert={q} onWert={setQ} placeholder="Name oder Kontakt-Nummer" autoComplete="off" />
                  {treffer.length > 0 && q.trim().length >= 2 && (
                    <ul className="mt-2 flex flex-col gap-1" aria-label="Kontakte">
                      {treffer.map((k) => (
                        <li key={k.name}>
                          <button type="button" className="bo-kk-scan__treffer bg-bo-surface-2" onClick={() => (setze("kontakt", k), setQ(""), setTreffer([]))}>
                            <span className="flex-1 truncate">{k.titel}</span>
                            <span className="text-[12px] text-bo-text-soft">{[k.ort, k.karte ? `Karte ${k.karte}` : null, !k.privat ? "Firma" : null].filter(Boolean).join(" · ")}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-[13px] text-bo-text-soft">{ohneRecht ? "Neuen Kontakt anlegen – vorhandene Kontakte mit gleicher E-Mail werden beim Ausstellen verknüpft." : `oder ${T.neu.neuAnlegen}:`}</p>
              <div className="bo-kk-raster" data-spalten="2">
                <Textfeld label={T.neu.vorname} wert={w.vorname} onWert={(x) => setze("vorname", x)} pflicht autoComplete="off" fehler={fehler.vorname} testid="kk-neu-vorname" />
                <Textfeld label={T.neu.nachname} wert={w.nachname} onWert={(x) => setze("nachname", x)} pflicht autoComplete="off" fehler={fehler.nachname} testid="kk-neu-nachname" />
              </div>
              <Textfeld label={T.neu.email} type="email" wert={w.email} onWert={(x) => setze("email", x)} pflicht autoComplete="off" fehler={fehler.email} hilfe={T.neu.ohneEmail} testid="kk-neu-email" />
              <button type="button" className="inline-flex items-center gap-1.5 self-start text-[13px] text-bo-text-soft" aria-expanded={mehrPerson} onClick={() => setMehrPerson((x) => !x)}>
                <Icon name={mehrPerson ? "ChevronDown" : "ChevronRight"} className="size-3.5" />
                {T.neu.mehrPerson}
              </button>
              {mehrPerson && (
                <div className="bo-kk-raster" data-spalten="2">
                  <Textfeld label={T.neu.telefon} wert={w.telefon} onWert={(x) => setze("telefon", x)} />
                  <Textfeld label={T.neu.plz} wert={w.plz} onWert={(x) => setze("plz", x)} />
                  <Textfeld label={T.neu.ort} wert={w.ort} onWert={(x) => setze("ort", x)} />
                  <div>
                    <label htmlFor="kk-neu-sprache" className="bo-kk-label">
                      {T.neu.sprache}
                    </label>
                    <select id="kk-neu-sprache" className="bo-kk-feld" value={w.sprache} onChange={(e) => setze("sprache", e.target.value)}>
                      <option value="de">Deutsch</option>
                      <option value="en">Englisch</option>
                      <option value="fr">Französisch</option>
                      <option value="it">Italienisch</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          {sperre && w.kontakt && (
            <p className="bo-kk-warn mt-3">
              {sperre}
              {w.kontakt?.karte && (
                <Link href={`/kundenkarte/karten/${w.kontakt.karte}`} className="ml-2 underline">
                  öffnen
                </Link>
              )}
            </p>
          )}
        </section>

        <section className="bo-kachel" aria-labelledby="kk-neu-einw">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="kk-neu-einw" className="bo-kachel__titel">
              {T.neu.einwilligungen}
            </h2>
            <Knopf size="s" icon="Eye" onClick={anKundin} laedt={laeuft} disabled={!version} data-testid="kk-neu-an-kundin">
              {T.einwilligung.anKundin}
            </Knopf>
          </div>
          {km && <p className={`mb-3 text-[14px] ${km.bestaetigt ? "text-bo-salbei-text" : "text-bo-text-soft"}`}>{km.bestaetigt ? "Die Kundin hat im Kundenmodus bestätigt." : "Wartet auf die Bestätigung der Kundin …"}</p>}
          <div className="flex flex-col gap-2">
            {[
              ["teilnahme", T.neu.teilnahme(version || "–")],
              ["datenschutz", T.neu.datenschutz(DATENSCHUTZINFO_VERSION)],
              ["volljaehrig", T.neu.volljaehrig],
            ].map(([k, t]) => (
              <label key={k} className="bo-kk-haken">
                <input type="checkbox" checked={w[k]} onChange={(e) => setze(k, e.target.checked)} disabled={!version} data-testid={`kk-neu-${k}`} />
                <span className="flex-1">{t}</span>
                <span className="bo-kk-haken__pflicht">{T.neu.pflicht}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-bo-surface-2 p-4">
            <Schalter label={T.neu.auswertung} an={w.auswertung} onWechsel={(a) => setze("auswertung", a)} beschreibung={T.neu.auswertungNachweis} testid="kk-neu-auswertung" />
            {w.auswertung && !km?.bestaetigt && <NachweisAufnahme datei={datei} onDatei={setDatei} fehler={fehler.nachweis} />}
            <Schalter label={T.neu.newsletter} an={w.newsletter} onWechsel={(a) => setze("newsletter", a)} />
          </div>
        </section>

        <section className="bo-kachel" aria-labelledby="kk-neu-weitere">
          <button type="button" id="kk-neu-weitere" className="flex w-full items-center gap-2 text-left" aria-expanded={weitere} onClick={() => setWeitere((x) => !x)}>
            <Icon name={weitere ? "ChevronDown" : "ChevronRight"} className="size-4" />
            <span className="bo-kachel__titel">{T.neu.weitere}</span>
          </button>
          {weitere && (
            <div className="mt-4 flex flex-col gap-4">
              <div className="bo-kk-raster" data-spalten="2">
                <Textfeld label={T.neu.geburtstag} wert={w.geburtstag} onWert={(x) => setze("geburtstag", x)} placeholder="TT.MM." fehler={geb.ok ? undefined : geb.message} hilfe="leer = kein Gruß" />
                <div>
                  <label htmlFor="kk-neu-berater" className="bo-kk-label">
                    {T.neu.berater}
                  </label>
                  <select id="kk-neu-berater" className="bo-kk-feld" value={w.berater} onChange={(e) => setze("berater", e.target.value)}>
                    <option value="">–</option>
                    {berater.map((b) => (
                      <option key={b.wert} value={b.wert}>
                        {b.titel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Textfeld label={T.neu.interessen} wert={w.interessen} onWert={(x) => setze("interessen", x)} max={500} />
              {leitung && (
                <div>
                  <label htmlFor="kk-neu-stufe" className="bo-kk-label">
                    {T.neu.stufe}
                  </label>
                  <select id="kk-neu-stufe" className="bo-kk-feld" value={w.stufe} onChange={(e) => setze("stufe", e.target.value)}>
                    {stufen.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.stufenname}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Schalter label={T.neu.spaeter} an={w.spaeter} onWechsel={(a) => setze("spaeter", a)} />
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <section className="bo-kachel" aria-labelledby="kk-neu-legt">
          <h2 id="kk-neu-legt" className="bo-kachel__titel mb-4">
            {T.neu.legtAn}
          </h2>
          <div className="mb-4 flex justify-center">
            <MiniKarte nr="KK-······" name={person || "Neue Karte"} stufe={st?.stufenname || ""} farbe={st?.farbe} gross drehbar={false} />
          </div>
          <ul className="flex flex-col gap-2 text-[14px]" aria-live="polite" data-testid="kk-neu-legt">
            <li className="flex items-center gap-2">
              <Icon name="Contact" className="size-4 text-bo-text-soft" />
              {w.kontakt ? `Kontakt ${w.kontakt.titel}` : person ? `Kontakt ${person} (neu)` : "Kontakt –"}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="CreditCard" className="size-4 text-bo-text-soft" />
              Karte – {w.spaeter ? "beantragt, aktiv bei Übergabe" : "aktiv"}, <StufenKennzeichen stufe={st?.stufenname} farbe={st?.farbe} groesse="s" />
            </li>
            <li className="flex items-center gap-2">
              <Icon name="ScrollText" className="size-4 text-bo-text-soft" />
              Teilnahmebedingungen {version || "–"}
            </li>
            {w.auswertung && (
              <li className="flex items-center gap-2">
                <Icon name="Shield" className="size-4 text-bo-text-soft" />
                Einwilligung Auswertung ({km?.bestaetigt ? "Tablet" : datei ? "Foto/Datei" : "Nachweis fehlt"})
              </li>
            )}
          </ul>
          {fehler.allgemein && (
            <p className="bo-kk-fehler mt-3" role="alert">
              {fehler.allgemein}
            </p>
          )}
          <div className="mt-5">
            <Knopf type="submit" variant="primary" icon="CreditCard" kuerzel="Strg+Enter" laedt={laeuft} disabled={Boolean(grund)} grund={grund || undefined} className="w-full justify-center" data-testid="kk-neu-ausstellen">
              {T.neu.knopf}
            </Knopf>
          </div>
        </section>
      </aside>
      <Bestaetigen
        offen={verwerfen}
        titel={T.neu.verwerfen}
        bestaetigen="Verwerfen"
        gefaehrlich
        onAbbrechen={() => setVerwerfen(false)}
        onBestaetigen={() => {
          schreibe(null);
          setVerwerfen(false);
          router.push("/kundenkarte/karten");
        }}
      />
    </form>
  );
}
