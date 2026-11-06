"use client";
// Dialoge rund um Rechnung und Gutschrift (10-konzept-faktura § 5.1–§ 5.4, § 5.8, § 5.13, § 5.16) im Lounge-Stil:
// Dialog md 560 (Material, Radius 32), eine Primäraktion in Tinte, Fakten als eingelassene Karte, Fehler unter dem Feld.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, Fakten, Sheet } from "../Overlay";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import Segment from "../Segment";
import BetragFeld from "../Eingabe/BetragFeld";
import Datumsfeld from "../Formular/Datumsfeld";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import AnDieKassa from "../AnDieKassa";
import { useToast } from "../Toast";
import { cent } from "@/lib/backoffice/format";
import { ART_LANG, STELLEN, ZAHLUNG, SENDEN, MAIL, GUTSCHRIFT, MAHNEN, AKTION, wertLabel, anredeBrief, fuelle, KASSA, FEHLER } from "@/lib/backoffice/faktura/texte";
import { spaeteRechnung, KANAL, zahlKanaele } from "@/lib/backoffice/faktura/regeln";
import { stellenAction, pflichtangabenAction, belegStatusAction, zahlungErfassenAction, bankTrefferAction, sendenAction, gutschriftAnlegenAction, erstattenAction, korrigierenAction, mahnenAction } from "@/lib/backoffice/faktura/actions";
import { Feld, Hinweis, FIcon } from "./teile";
import { neuerSchluessel, useVorgang, useEnterSperre, deutsch, heuteIso, plusTage } from "./hilfen";

const VORLAGE = { "PH Rechnung": MAIL.rechnung, "PH Gutschrift": MAIL.gutschrift, "PH Angebot": MAIL.angebot, "PH Auftragsbestaetigung": MAIL.auftrag, "PH Mahnung": MAIL.mahnung };
const ART_TITEL = { "PH Rechnung": "Rechnung", "PH Gutschrift": "Rechnungskorrektur", "PH Angebot": "Angebot", "PH Auftragsbestaetigung": "Auftragsbestätigung", "PH Mahnung": "Mahnung" };

function mailText(doctype, d, nummer) {
  const anrede = anredeBrief({ anrede: d.anrede, vorname: d.vorname, nachname: d.nachname, kontaktart: d.kontaktart, firma: d.firma }) || "Guten Tag";
  return fuelle(VORLAGE[doctype] || MAIL.rechnung, { anrede_brief: anrede.startsWith("Guten") && d.kunde ? `Guten Tag ${d.kunde}` : anrede, belegart: ART_LANG[d.art] || ART_TITEL[doctype], nummer, betrag: cent(d.zahlbar_cent ?? d.brutto_cent), faellig: deutsch(d.faellig), gueltig_bis: deutsch(d.gueltig_bis) });
}

// ------------------------------------------------------------------ Stellen --

/**
 * Stellen-Dialog (§ 5.1): Nummer nie vorab, Pflichtangaben live, Leistungsdatum mit Quelle, Datum nur Leitung,
 * Warnbänder, „Danach senden“ im selben Dialog, Statusprüfung bei Zeitüberschreitung, Ergebnis-Karte mit Häkchen.
 */
export function StellenDialog({ offen, onSchliessen, ziel, rolle, schalter = {}, onFertig }) {
  const router = useRouter();
  const d = ziel?.daten || {};
  const doctype = ziel?.doctype || "PH Rechnung";
  const gs = doctype === "PH Gutschrift";
  const [pruefung, setPruefung] = useState(null);
  const [geprueft, setGeprueft] = useState(false);
  const [anderes, setAnderes] = useState(false);
  const [datum, setDatum] = useState(heuteIso());
  const [ausfuhr, setAusfuhr] = useState(false);
  const [senden, setSenden] = useState(!!d.email);
  const [textOffen, setTextOffen] = useState(false);
  const [betreff, setBetreff] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [status, setStatus] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("stellen"));
  const v = useVorgang();
  const enterSperre = useEnterSperre(offen);
  const geoeffnet = useRef(null);

  useEffect(() => {
    if (!offen) geoeffnet.current = null;
    if (!offen || !ziel?.name) return undefined;
    let aktiv = true;
    // Zurücksetzen nur beim Öffnen (Dialog wird wiederverwendet; ein erneutes Rendern setzt Eingaben nie zurück)
    if (geoeffnet.current !== ziel.name) {
      geoeffnet.current = ziel.name;
      setErgebnis(null);
      setFehler(null);
      setStatus(null);
      setGeprueft(false);
      setSenden(!!d.email);
      setBetreff(SENDEN.betreffVorlage(ART_TITEL[doctype], "{nummer}"));
      setNachricht(mailText(doctype, d, "{nummer}"));
    }
    pflichtangabenAction({ doctype, name: ziel.name }).then((r) => aktiv && setPruefung(r));
    return () => {
      aktiv = false;
    };
  }, [offen, ziel?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const befunde = useMemo(() => (pruefung?.befunde || []).filter((b) => b.blockiert && !(b.bestaetigbar && geprueft)), [pruefung, geprueft]);
  const leistungBestaetigen = (pruefung?.befunde || []).some((b) => b.bestaetigbar);
  const spaet = !gs && d.leistungsdatum ? spaeteRechnung(datum, d.leistungsdatum) : null;
  const ausfuhrPflicht = !gs && d.ust_fall === "Ausfuhr" && !schalter.ausfuhr;
  const chBlock = !gs && ["CH", "LI"].includes(d.land) && d.montage_im_ausland && !schalter.ausfuhr;
  const sperrGrund = chBlock ? STELLEN.chMontage : befunde.length ? STELLEN.erstErgaenzen : ausfuhrPflicht && !ausfuhr ? STELLEN.ausfuhrCheck : null;
  const titel = befunde.length ? STELLEN.unvollstaendig(befunde.length) : gs ? `Gutschrift über ${cent(d.brutto_cent)} stellen?` : STELLEN.titel(cent(d.zahlbar_cent ?? d.brutto_cent), ART_LANG[d.art] === "Rechnung" || !d.art ? "Rechnung" : ART_LANG[d.art]);

  async function stellen() {
    setFehler(null);
    await v.start(async () => {
      const timer = setTimeout(() => setStatus("pruefen"), 10_000);
      let r;
      try {
        r = await stellenAction({ doctype, name: ziel.name, datum: anderes ? datum : undefined, leistungGeprueft: geprueft, senden, empfaenger: senden ? d.email : "", betreff: betreff.replace("{nummer}", ""), nachricht, idempotency: schluessel, ausfuhrBestaetigt: ausfuhr });
      } catch {
        setStatus("pruefen");
        const s = await belegStatusAction({ doctype, name: ziel.name });
        r = s.ok && s.docstatus === 1 ? { ok: true, name: s.name, nummer: s.name } : { ok: false, code: "unavailable", message: STELLEN.nichtGestellt };
      } finally {
        clearTimeout(timer);
      }
      setStatus(null);
      if (!r.ok) {
        setFehler(r.fehler?.length ? r.fehler.map((f) => f.text).join(" · ") : r.message);
        if (r.code === "invalid" && r.fehler) setPruefung({ ok: false, befunde: r.fehler });
        return;
      }
      setErgebnis(r);
      router.refresh();
      onFertig?.(r);
    });
  }

  const nummerHref = ergebnis ? `/faktura/${gs ? "gutschriften" : "rechnungen"}/${encodeURIComponent(ergebnis.nummer)}` : null;

  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="md"
      sperren={v.laeuft}
      titel={ergebnis ? "" : titel}
      testid="stellen-dialog"
      fuss={
        ergebnis ? null : (
          <>
            <Knopf variant="secondary" onClick={onSchliessen} disabled={v.laeuft}>
              {AKTION.abbrechen}
            </Knopf>
            <Knopf variant="primary" onClick={stellen} laedt={v.zeigen} disabled={!!sperrGrund || v.laeuft || !pruefung} grund={sperrGrund} title={AKTION.stellenTip} data-testid="stellen-primaer">
              {v.zeigen ? STELLEN.stellt : senden ? AKTION.stellenUndSenden : AKTION.stellenNur}
            </Knopf>
          </>
        )
      }
    >
      {ergebnis ? (
        <ErgebnisKarte
          ohneKachel
          titel={gs ? STELLEN.ergebnisGs(ergebnis.nummer, cent(ergebnis.brutto_cent)) : STELLEN.ergebnis(ergebnis.nummer, cent(ergebnis.brutto_cent))}
          unter={ergebnis.sendeFehler ? STELLEN.sendenFehler(ergebnis.sendeFehler) : ergebnis.gesendet ? STELLEN.gesendetAn(ergebnis.gesendet) : undefined}
          dokumente={[{ titel: `${ergebnis.nummer}.pdf`, info: "fixiert", icon: "FileText" }]}
          aktionen={[{ titel: AKTION.pdfOeffnen, href: `/druck/${gs ? "ph-gutschrift" : "ph-rechnung"}/${encodeURIComponent(ergebnis.nummer)}` }, { titel: AKTION.zurListe, href: gs ? "/faktura/gutschriften" : "/faktura/rechnungen" }]}
          weiter={{ titel: AKTION.oeffnen || "Öffnen", href: nummerHref }}
        />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sperrGrund) stellen();
          }}
          onKeyDown={(e) => enterSperre(e)}
          className="flex flex-col gap-4"
        >
          {befunde.length > 0 ? (
            <ul className="flex flex-col gap-1.5" data-testid="pflicht-fehlt">
              {befunde.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-fill px-3.5 py-2.5 text-[14px]">
                  <span className="flex items-center gap-2">
                    <FIcon name="TriangleAlert" className="size-4 text-bo-eiche-text" />
                    {b.text}
                  </span>
                  {ziel.name && (
                    <Knopf size="s" variant="ghost" href={`/faktura/${gs ? "gutschriften" : "rechnungen"}/${encodeURIComponent(ziel.name)}?tab=${b.tab}#${b.feld}`} iconRechts="ArrowRight">
                      {STELLEN.zumFeld}
                    </Knopf>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <Fakten
            eintraege={[
              { label: STELLEN.an, wert: d.adresse || d.kunde || "–" },
              { label: STELLEN.art, wert: [ART_LANG[d.art] || (gs ? "Gutschrift" : "Rechnung"), d.anzahlung_prozent ? `${d.anzahlung_prozent} %` : null, d.auftrag ? `zu ${d.auftrag}` : null].filter(Boolean).join(" · ") },
              {
                label: STELLEN.datum,
                wert: (
                  <span className="flex flex-wrap items-center gap-2">
                    {anderes ? <Datumsfeld value={datum} onChange={setDatum} aria-label={STELLEN.datum} kompakt /> : STELLEN.heute(deutsch(heuteIso()))}
                    {rolle?.leitung && !anderes && (
                      <Knopf size="s" variant="ghost" onClick={() => setAnderes(true)}>
                        {STELLEN.anderesDatum}
                      </Knopf>
                    )}
                  </span>
                ),
              },
              !gs && { label: STELLEN.leistung, wert: d.leistungsdatum ? STELLEN.leistungQuelle(deutsch(d.leistungsdatum), d.leistung_quelle || "ohne Quelle") : "–" },
              !gs && { label: STELLEN.faellig, wert: STELLEN.faelligIn(deutsch(plusTage(anderes ? datum : heuteIso(), d.zahlungsziel_tage || 14)), d.zahlungsziel_tage || 14) },
              { label: STELLEN.pflicht, wert: !pruefung ? "wird geprüft …" : befunde.length ? `${befunde.length} offen` : `✓ ${STELLEN.vollstaendig}` },
              { label: STELLEN.danach, wert: d.korrektur_von ? `${STELLEN.folgen} · ${STELLEN.korrekturFolgen(d.korrektur_von)}` : STELLEN.folgen },
            ].filter(Boolean)}
          />
          {leistungBestaetigen && <Schalter label={STELLEN.leistungGeprueft} beschreibung={STELLEN.leistungOhneQuelle} an={geprueft} onWechsel={setGeprueft} testid="leistung-geprueft" />}
          {spaet && <Hinweis ton="warnung">{STELLEN.spaet(spaet.leistungMonat, spaet.rechnungMonat, spaet.uvaMonat)}</Hinweis>}
          {chBlock && <Hinweis ton="gefahr">{STELLEN.chMontage}</Hinweis>}
          {ausfuhrPflicht && (
            <Hinweis ton="warnung">
              {STELLEN.ausfuhr}
              <span className="mt-2 block">
                <Schalter label={STELLEN.ausfuhrCheck} an={ausfuhr} onWechsel={setAusfuhr} groesse="s" />
              </span>
            </Hinweis>
          )}
          <div className="rounded-bo-karte bg-bo-surface-2 p-3.5">
            <Schalter label={d.email ? STELLEN.sendenAn(d.email) : STELLEN.drucken} an={senden} onWechsel={setSenden} testid="danach-senden" />
            {senden && d.email && (
              <button type="button" className="mt-2 text-[13px] font-medium text-bo-text-soft underline-offset-2 hover:underline" onClick={() => setTextOffen((o) => !o)} aria-expanded={textOffen}>
                {STELLEN.textAnsehen}
              </button>
            )}
            {senden && textOffen && (
              <div className="mt-3 flex flex-col gap-3">
                <Feld label={SENDEN.betreff} id="st-betreff">
                  <input id="st-betreff" className="bo-fk-feld" value={betreff} onChange={(e) => setBetreff(e.target.value)} />
                </Feld>
                <Feld label={SENDEN.nachricht} id="st-nachricht">
                  <textarea id="st-nachricht" className="bo-fk-feld" rows={6} value={nachricht} onChange={(e) => setNachricht(e.target.value)} />
                </Feld>
              </div>
            )}
          </div>
          {status === "pruefen" && <Hinweis ton="info">{STELLEN.pruefung}</Hinweis>}
          {fehler && (
            <Hinweis ton="gefahr" testid="stellen-fehler">
              {fehler}
            </Hinweis>
          )}
        </form>
      )}
    </Dialog>
  );
}

// ------------------------------------------------------------------ Zahlung --

/** Zahlung erfassen (§ 5.2): nur Überweisung (+ Stripe Link), Betrag ≤ offen, Bar/Karte als Hinweis zur Kassa. */
export function ZahlungDialog({ offen, onSchliessen, ziel, rolle, schalter = {}, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const d = ziel?.daten || {};
  const [betrag, setBetrag] = useState(d.offen_cent || 0);
  const [kanal, setKanal] = useState(KANAL.ueberweisung);
  const [datum, setDatum] = useState(heuteIso());
  const [hinweis, setHinweis] = useState("");
  const [fehler, setFehler] = useState(null);
  const [treffer, setTreffer] = useState(null);
  const [trotzdem, setTrotzdem] = useState(false);
  const [schluessel] = useState(() => neuerSchluessel("zahlung"));
  const v = useVorgang();
  const enterSperre = useEnterSperre(offen);

  useEffect(() => {
    if (!offen) return undefined;
    let aktiv = true;
    /* eslint-disable react-hooks/set-state-in-effect */
    setBetrag(d.offen_cent || 0);
    setFehler(null);
    setTrotzdem(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    bankTrefferAction({ betragCent: d.offen_cent }).then((r) => aktiv && setTreffer(r?.treffer || null));
    return () => {
      aktiv = false;
    };
  }, [offen, ziel?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const zuHoch = betrag > (d.offen_cent || 0) && !schalter.guthaben;
  const danach = Math.max((d.offen_cent || 0) - (betrag || 0), 0);

  async function buchen() {
    if (treffer && !trotzdem) {
      setTrotzdem(true);
      return;
    }
    await v.start(async () => {
      const r = await zahlungErfassenAction({ rechnung: ziel.name, betragCent: betrag, kanal, datum, hinweis, idempotency: schluessel });
      if (!r.ok) return setFehler(r.message);
      zeige(ZAHLUNG.gebucht(cent(betrag), ziel.name, r.status === "Bezahlt" ? "bezahlt" : "teilbezahlt"), { art: "ok" });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }

  if (offen && !(d.offen_cent > 0)) {
    return (
      <Dialog offen={offen} onSchliessen={onSchliessen} titel={ZAHLUNG.bezahlt} groesse="sm" art="bestaetigen" fuss={<Knopf onClick={onSchliessen}>{AKTION.schliessen}</Knopf>} />
    );
  }

  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="md"
      sperren={v.laeuft}
      titel={ZAHLUNG.titel(ziel?.name || "")}
      testid="zahlung-dialog"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen} disabled={v.laeuft}>
            {AKTION.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={buchen} laedt={v.zeigen} disabled={zuHoch || !betrag || v.laeuft} data-testid="zahlung-buchen">
            {v.zeigen ? ZAHLUNG.bucht : trotzdem ? `Trotzdem ${cent(betrag)} buchen` : AKTION.zahlungBuchen(cent(betrag))}
          </Knopf>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!zuHoch && betrag) buchen();
        }}
        onKeyDown={(e) => enterSperre(e)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Feld label={ZAHLUNG.betrag} id="z-betrag" fehler={zuHoch ? (schalter.guthaben ? null : ZAHLUNG.hoechstens(cent(d.offen_cent))) : fehler && /Höchstens|Betrag/.test(fehler) ? fehler : null} hilfe={ZAHLUNG.offen(cent(d.offen_cent))}>
            <BetragFeld id="z-betrag" value={betrag} onChange={(c) => setBetrag(c || 0)} testid="zahlung-betrag" />
          </Feld>
          <Feld label={ZAHLUNG.datum} id="z-datum">
            <Datumsfeld id="z-datum" value={datum} onChange={setDatum} />
          </Feld>
        </div>
        {schalter.stripeLink ? (
          <Feld label={ZAHLUNG.kanal}>
            <Segment label={ZAHLUNG.kanal} wert={kanal} onWechsel={setKanal} optionen={zahlKanaele(schalter).map((k) => ({ wert: k, titel: wertLabel(k) }))} />
          </Feld>
        ) : (
          <p className="text-[13px] text-bo-text-soft">
            {ZAHLUNG.kanal}: <span className="font-medium text-bo-text">{wertLabel(KANAL.ueberweisung)}</span> · {ZAHLUNG.stripeAus}
          </p>
        )}
        <Feld label={ZAHLUNG.hinweis} id="z-hinweis">
          <input id="z-hinweis" className="bo-fk-feld" value={hinweis} onChange={(e) => setHinweis(e.target.value)} maxLength={140} />
        </Feld>
        <p className="text-[14px] tabular-nums text-bo-text">{ZAHLUNG.danach(cent(danach), danach === 0 ? "Bezahlt" : "Teilbezahlt")}</p>
        <AnDieKassa variante="zahlung" darf={!!rolle} kunde={d.kontakt} beleg={ziel?.name} flaeche />
        {treffer && (
          <Hinweis ton="warnung" testid="bank-treffer">
            {rolle?.leitung ? ZAHLUNG.bankTreffer(cent(treffer.betrag_cent), deutsch(treffer.buchungsdatum)).replace(" – die Faktura-Leitung ordnet zu.", ".") : ZAHLUNG.bankTreffer(cent(treffer.betrag_cent), deutsch(treffer.buchungsdatum))}
            {rolle?.leitung && (
              <Link className="ml-1 font-medium underline underline-offset-2" href="/faktura/bank?r=offen">
                {ZAHLUNG.bankVerwenden}
              </Link>
            )}
            {trotzdem && <span className="mt-1 block font-medium">{ZAHLUNG.trotzdem}</span>}
          </Hinweis>
        )}
        {fehler && !/Höchstens/.test(fehler) && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </form>
    </Dialog>
  );
}

// ------------------------------------------------------------------- Senden --

/** Senden (§ 5.4): Reiter E-Mail · Post; Belehrung außerhalb des Showrooms gesetzt und gesperrt (R-07). */
export function SendenDialog({ offen, onSchliessen, ziel, schalter = {}, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const d = ziel?.daten || {};
  const doctype = ziel?.doctype || "PH Rechnung";
  const ohneMail = !d.email || d.brief;
  const [kanal, setKanal] = useState(ohneMail ? "Post" : "E-Mail");
  const [an, setAn] = useState(d.email || "");
  const [betreff, setBetreff] = useState(SENDEN.betreffVorlage(ART_TITEL[doctype], ziel?.name || ""));
  const [nachricht, setNachricht] = useState(mailText(doctype, d, ziel?.name || ""));
  const [fehler, setFehler] = useState(null);
  const pflichtBelehrung = ["PH Angebot", "PH Auftragsbestaetigung"].includes(doctype) && d.vertragsort && d.vertragsort !== "Showroom";
  const v = useVorgang();

  useEffect(() => {
    if (!offen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setKanal(ohneMail ? "Post" : "E-Mail");
    setAn(d.email || "");
    setBetreff(SENDEN.betreffVorlage(ART_TITEL[doctype], ziel?.name || ""));
    setNachricht(mailText(doctype, d, ziel?.name || ""));
    setFehler(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [offen, ziel?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  async function senden() {
    await v.start(async () => {
      const r = await sendenAction({ doctype, name: ziel.name, kanal, empfaenger: an, betreff, nachricht, belehrung: pflichtBelehrung });
      if (!r.ok) return setFehler(r.message);
      zeige(kanal === "Post" ? `${ziel.name} als per Post gesendet vermerkt` : SENDEN.gesendet(an), { art: "ok" });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }

  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="md"
      sperren={v.laeuft}
      titel={SENDEN.titel(ART_TITEL[doctype], ziel?.name || "")}
      testid="senden-dialog"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {AKTION.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={v.zeigen} disabled={v.laeuft} data-testid="senden-primaer">
            {kanal === "Post" ? SENDEN.postText : AKTION.senden}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segment label="Versand" wert={kanal} onWechsel={setKanal} optionen={[{ wert: "E-Mail", titel: SENDEN.email, deaktiviert: !d.email }, { wert: "Post", titel: SENDEN.post }]} />
        {kanal === "E-Mail" ? (
          <>
            <Feld label={SENDEN.an} id="s-an" fehler={fehler && /E-Mail/.test(fehler) ? fehler : null}>
              <input id="s-an" type="email" className="bo-fk-feld" value={an} onChange={(e) => setAn(e.target.value)} />
            </Feld>
            <Feld label={SENDEN.betreff} id="s-betreff">
              <input id="s-betreff" className="bo-fk-feld" value={betreff} onChange={(e) => setBetreff(e.target.value)} />
            </Feld>
            <Feld label={SENDEN.nachricht} id="s-nachricht">
              <textarea id="s-nachricht" className="bo-fk-feld" rows={7} value={nachricht} onChange={(e) => setNachricht(e.target.value)} />
            </Feld>
            <div className="flex items-center gap-3 rounded-bo-karte bg-bo-surface-2 px-3.5 py-3 text-[14px]">
              <FIcon name="FileText" className="size-5 text-bo-text-soft" />
              <span className="min-w-0 flex-1 truncate">{ziel?.name}.pdf</span>
              <span className="text-[12px] text-bo-text-faint">{SENDEN.anhang}</span>
            </div>
          </>
        ) : (
          <Hinweis ton="info">{ohneMail ? SENDEN.ohneMail : schalter.postVersand ? SENDEN.postText : SENDEN.postOhneSchalter}</Hinweis>
        )}
        {pflichtBelehrung && <Schalter label={SENDEN.belehrung} beschreibung={SENDEN.belehrungPflicht} an deaktiviert onWechsel={() => {}} />}
        {fehler && !/E-Mail/.test(fehler) && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

// --------------------------------------------------------------- Gutschrift --

export function GutschriftDialog({ offen, onSchliessen, ziel, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [art, setArt] = useState("Storno");
  const [grund, setGrund] = useState("");
  const [erstattung, setErstattung] = useState(ziel?.daten?.bezahlt_cent > 0 ? "Rückzahlung" : "Verrechnung mit offener Rechnung");
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();

  async function anlegen() {
    await v.start(async () => {
      const r = await gutschriftAnlegenAction({ rechnung: ziel.name, art, grund, erstattung });
      if (!r.ok) return setFehler(r.message);
      zeige(GUTSCHRIFT.angelegt(ziel.name), { art: "ok", aktion: { titel: "Öffnen", onClick: () => router.push(`/faktura/gutschriften/${encodeURIComponent(r.gutschrift)}`) } });
      onFertig?.(r);
      onSchliessen();
      router.push(`/faktura/gutschriften/${encodeURIComponent(r.gutschrift)}`);
    });
  }

  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="md"
      titel={GUTSCHRIFT.titel(ziel?.name || "")}
      testid="gutschrift-dialog"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {AKTION.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={anlegen} laedt={v.zeigen} disabled={!grund.trim() || v.laeuft} grund={!grund.trim() ? "Grund fehlt" : null}>
            {AKTION.anlegen}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Feld label={GUTSCHRIFT.art}>
          <Segment label={GUTSCHRIFT.art} wert={art} onWechsel={setArt} optionen={GUTSCHRIFT.arten.map((a) => ({ wert: a, titel: a }))} />
        </Feld>
        <Feld label={GUTSCHRIFT.grund} id="g-grund" fehler={fehler && /Grund/.test(fehler) ? fehler : null}>
          <textarea id="g-grund" className="bo-fk-feld" rows={3} value={grund} onChange={(e) => setGrund(e.target.value)} />
        </Feld>
        <Feld label={GUTSCHRIFT.erstattung}>
          <Segment label={GUTSCHRIFT.erstattung} wert={erstattung} onWechsel={setErstattung} optionen={GUTSCHRIFT.erstattungen.map((e) => ({ wert: e.wert, titel: e.titel }))} />
        </Feld>
        <p className="text-[13px] text-bo-text-soft">{KASSA.barErstattung}</p>
        {fehler && !/Grund/.test(fehler) && (
          <Hinweis ton="gefahr" testid="gutschrift-fehler">
            {fehler}
          </Hinweis>
        )}
      </div>
    </Dialog>
  );
}

export function ErstattenDialog({ offen, onSchliessen, ziel, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const rest = ziel?.daten?.rest_cent || 0;
  const [betrag, setBetrag] = useState(rest);
  const [datum, setDatum] = useState(heuteIso());
  const [fehler, setFehler] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("erstatten"));
  const v = useVorgang();
  async function buchen() {
    await v.start(async () => {
      const r = await erstattenAction({ gutschrift: ziel.name, betragCent: betrag, datum, idempotency: schluessel });
      if (!r.ok) return setFehler(r.message);
      zeige(GUTSCHRIFT.erstattet(cent(betrag)), { art: "ok" });
      router.refresh();
      onFertig?.(r);
      onSchliessen();
    });
  }
  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="sm"
      titel={`${cent(betrag)} erstatten?`}
      text={GUTSCHRIFT.erstattenTitel(ziel?.name || "")}
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {AKTION.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={buchen} laedt={v.zeigen} disabled={!betrag || betrag > rest || v.laeuft}>
            {AKTION.erstatten}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Feld label="Betrag" id="e-betrag" fehler={betrag > rest ? `Höchstens ${cent(rest)}` : null}>
          <BetragFeld id="e-betrag" value={betrag} onChange={(c) => setBetrag(c || 0)} />
        </Feld>
        <Feld label="Datum" id="e-datum">
          <Datumsfeld id="e-datum" value={datum} onChange={setDatum} />
        </Feld>
        <p className="text-[13px] text-bo-text-soft">Kanal: Überweisung · {KASSA.barErstattung}</p>
        {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

const KORREKTUR_GRUENDE = ["Adresse", "Steuerfall", "Positionen", "Leistungsdatum", "Sonstiges"];

export function KorrigierenDialog({ offen, onSchliessen, ziel, onFertig }) {
  const router = useRouter();
  const [grund, setGrund] = useState("Adresse");
  const [textGrund, setTextGrund] = useState("");
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();
  async function anlegen() {
    await v.start(async () => {
      const r = await korrigierenAction({ rechnung: ziel.name, grund: `${grund}${textGrund ? `: ${textGrund}` : ""}` });
      if (!r.ok) return setFehler(r.message);
      onFertig?.(r);
      onSchliessen();
      if (r.rechnung) router.push(`/faktura/rechnungen/${encodeURIComponent(r.rechnung)}`);
    });
  }
  return (
    <Dialog
      offen={offen}
      onSchliessen={() => !v.laeuft && onSchliessen()}
      groesse="md"
      titel={`${ziel?.name || ""} korrigieren`}
      text="Es entstehen ein Gutschrift-Entwurf und eine Kopie der Rechnung als Entwurf. Gestellt wird erst nach Prüfung."
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {AKTION.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={anlegen} laedt={v.zeigen} disabled={v.laeuft}>
            Korrektur-Entwurf anlegen
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segment label="Grund" wert={grund} onWechsel={setGrund} optionen={KORREKTUR_GRUENDE.map((g) => ({ wert: g, titel: g }))} />
        <Feld label="Beschreibung" id="k-text">
          <textarea id="k-text" className="bo-fk-feld" rows={3} value={textGrund} onChange={(e) => setTextGrund(e.target.value)} />
        </Feld>
        {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}
      </div>
    </Dialog>
  );
}

// ------------------------------------------------------------------- Mahnen --

/** Mahnen-Sheet (§ 5.16): ein Sheet für alle Einstiege, Vorschlag vorausgewählt, nicht versandte grau. */
export function MahnenSheet({ offen, onSchliessen, vorschlag = [], nur, onFertig }) {
  const router = useRouter();
  const { zeige } = useToast();
  const liste = useMemo(() => (nur ? vorschlag.filter((r) => r.name === nur) : vorschlag), [vorschlag, nur]);
  const [auswahl, setAuswahl] = useState(() => new Set(liste.filter((r) => r.waehlbar).map((r) => r.name)));
  const [entwurf, setEntwurf] = useState(false);
  const [frage, setFrage] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const [schluessel] = useState(() => neuerSchluessel("mahnen"));
  const v = useVorgang();

  useEffect(() => {
    if (!offen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setAuswahl(new Set(liste.filter((r) => r.waehlbar).map((r) => r.name)));
    setErgebnis(null);
    setFrage(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [offen, liste]);

  const gewaehlt = liste.filter((r) => auswahl.has(r.name));
  const post = gewaehlt.filter((r) => r.post).length;

  async function ausfuehren() {
    await v.start(async () => {
      const r = await mahnenAction({ rechnungen: [...auswahl], entwurf, idempotency: schluessel });
      setFrage(false);
      if (!r.ok && !r.angelegt) return zeige(r.message || FEHLER.unavailable, { art: "fehler" });
      setErgebnis(r);
      router.refresh();
      onFertig?.(r);
    });
  }

  const grundText = (r) => (r.grund === "sperre" ? MAHNEN.sperre(r.mahnsperre_grund || "–") : r.grund === "nichtVersandt" ? MAHNEN.nichtVersandt : r.grund === "mindest" ? "unter dem Mindestbetrag" : r.grund === "abstand" ? "Abstand zur letzten Mahnung" : r.grund === "hoechste" ? "höchste Stufe erreicht" : "");

  return (
    <>
      <Sheet
        offen={offen}
        onSchliessen={() => !v.laeuft && onSchliessen()}
        titel={MAHNEN.titel}
        unter={MAHNEN.stichtag(deutsch(heuteIso()))}
        groesse="lg"
        panel="mahnen"
        testid="mahnen-sheet"
        fuss={
          ergebnis ? null : (
            <Knopf variant="primary" onClick={() => setFrage(true)} disabled={!auswahl.size || v.laeuft} data-testid="mahnen-senden">
              {entwurf ? `${auswahl.size} als Entwurf anlegen` : AKTION.mahnungenSenden(auswahl.size)}
            </Knopf>
          )
        }
      >
        {ergebnis ? (
          <ErgebnisKarte ohneKachel primaer={false} titel={MAHNEN.ergebnis(ergebnis.angelegt, ergebnis.gesendet, ergebnis.post)} unter={ergebnis.fehler?.length ? `${ergebnis.fehler.length} nicht angelegt` : MAHNEN.ohneSpesen} aktionen={[{ titel: "Zu den Mahnungen", href: "/faktura/mahnungen" }]} />
        ) : liste.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-bo-text-soft">{MAHNEN.titel && "Heute ist nichts zu mahnen."}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1">
              {liste.map((r) => (
                <li key={r.name}>
                  <label className={`grid cursor-pointer grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-bo-zeile px-3 py-2.5 hover:bg-bo-fill ${r.waehlbar ? "" : "opacity-60"}`}>
                    <input
                      type="checkbox"
                      checked={auswahl.has(r.name)}
                      disabled={!r.waehlbar}
                      onChange={() =>
                        setAuswahl((s) => {
                          const n = new Set(s);
                          if (n.has(r.name)) n.delete(r.name);
                          else n.add(r.name);
                          return n;
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">
                        {r.name} · {r.kunde_name}
                      </span>
                      <span className="block truncate text-[13px] text-bo-text-soft">{r.waehlbar ? `${r.tage} Tage überfällig · ${MAHNEN.stufe(r.mahnstufe || 0, r.naechste)}${r.post ? " · Post" : ""}` : grundText(r)}</span>
                    </span>
                    <span className="text-right text-[14px] tabular-nums">{cent(r.offen_cent)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4 rounded-bo-karte bg-bo-surface-2 px-3.5 py-3 text-[13px] text-bo-text-soft">
              <Schalter label={MAHNEN.alsEntwurf} an={entwurf} onWechsel={setEntwurf} groesse="s" zeile={false} />
              {post > 0 && <span>{MAHNEN.ohneMail(post)}</span>}
              <span>{MAHNEN.ohneSpesen}</span>
            </div>
          </div>
        )}
      </Sheet>
      <Dialog
        offen={frage}
        onSchliessen={() => !v.laeuft && setFrage(false)}
        groesse="sm"
        art="bestaetigen"
        titel={entwurf ? `${auswahl.size} Mahnungen als Entwurf anlegen?` : MAHNEN.frage(auswahl.size, post)}
        sperren={v.laeuft}
        fuss={
          <>
            <Knopf variant="secondary" onClick={() => setFrage(false)}>
              {AKTION.abbrechen}
            </Knopf>
            <Knopf variant="primary" onClick={ausfuehren} laedt={v.zeigen} data-testid="mahnen-bestaetigen">
              {entwurf ? AKTION.anlegen : AKTION.senden}
            </Knopf>
          </>
        }
      />
    </>
  );
}
