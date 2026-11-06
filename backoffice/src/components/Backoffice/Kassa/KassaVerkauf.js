"use client";
// Kassa – Verkauf (Team B-KAS, Konzept §3.1–§3.15, Lounge §7.4 „Kassa iPad quer“). Zustandsautomat
// Bon → Zahlmaske → Ergebnis (+ „Zahlung erhalten – Beleg offen“), Entwurf-Spiegel in IndexedDB, Kundendisplay
// über den Kanal des Fundaments (BroadcastChannel/SSE), Scan in jedem Zustand nach §2.6, Tasten nach §2.5.
// Gestaltung exakt nach entwurf-lounge/kassa: Material-Statuszeile (KioskShell), Suchfeld + runde Kategorien +
// Produktkacheln links, schwebender Warenkorb rechts mit Kundin, Vorteils-Chips, Summe, Zahlart-Segment und EINEM
// Primärknopf; Bezahlt-Sheet mit gezeichnetem Häkchen.

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Mail, Printer, Receipt, ScrollText, Wallet } from "lucide-react";
import KioskShell, { useKiosk } from "../Kiosk/KioskShell";
import { useToast, useToastAnker } from "../Toast";
import Schalter from "../Schalter";
import BetragFeld from "../Eingabe/BetragFeld";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { useKundendisplaySender } from "@/lib/backoffice/kanal/browser";
import { bonReducer, bonSummen, idempotenzSchluessel, leererBon, mengeVon, positionenFuerServer, zahlartenFuerServer } from "@/lib/backoffice/kassa/bon";
import { erkennen, scanErlaubt } from "@/lib/backoffice/kassa/codes";
import { rechnungsfrageNoetig } from "@/lib/backoffice/kassa/regeln";
import { euro, euroSprache, STEUERSAETZE } from "@/lib/backoffice/kassa/betraege";
import { GUTSCHEIN_WERTE } from "@/lib/backoffice/kassa/katalog";
import { KIOSK, fehlerText } from "@/lib/backoffice/kassa/texte";
import { belegDatenAction, belegDruckenAction, belegMailenAction, codeAction, karteAction, kassierenAction, sucheAction, tagesstartAction } from "@/lib/backoffice/kassa/actions";
import { Kategorien, Produkte, Suchfeld } from "./Sortiment";
import Korb, { stufeName } from "./Korb";
import Zahlmaske from "./Zahlmaske";
import Sheet, { Haken } from "./Sheet";
import Freigabe from "./Freigabe";
import { lese, loesche, schluessel, schreibe, verfuegbar } from "./speicher";
import "./kassa.css";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };

/** Kopfzeile der Statuszeile: „Kassa 1 · Showroom Lochau · Bon 52“. */
export default function KassaVerkauf(props) {
  const { kontext } = props;
  const [kopf, setKopf] = useState({ status: null, baender: [], scanAus: false, kontextText: "" });
  const scanRef = useRef(null);
  const kasse = kontext.kasse_doc;
  const naechste = (kontext.letzter_beleg?.belegnummer || 0) + 1;
  return (
    <KioskShell
      titel={kasse?.bezeichnung || KIOSK.titel}
      geraet={kasse?.standort ? { name: kasse.standort } : props.geraet}
      benutzer={props.benutzer}
      kontext={kopf.kontextText || KIOSK.bon(naechste)}
      kopfSlot={<KopfKnoepfe />}
      status={kopf.status}
      baender={kopf.baender}
      onScan={(c, e) => scanRef.current?.(c, e)}
      scanAus={kopf.scanAus}
      hilfe={KIOSK.hilfe}
      toastAnker="#kassa-meldungen"
      zurueckHref="/arbeitsplatz"
    >
      <Inhalt {...props} setKopf={setKopf} scanRef={scanRef} />
    </KioskShell>
  );
}

function KopfKnoepfe() {
  const router = useRouter();
  const k = [
    { href: "/kassa/belege", label: `${KIOSK.belege} (F7)`, I: Receipt, id: "belege" },
    { href: "/kassa/bargeld", label: `${KIOSK.bargeld} (F8)`, I: Banknote, id: "bargeld" },
    { href: "/kassa/abschluss", label: `${KIOSK.abschluss} (F9)`, I: ScrollText, id: "abschluss" },
  ];
  return k.map(({ href, label, I, id }) => (
    <button key={id} type="button" className="bo-rund bo-ziel" aria-label={label} onClick={() => router.push(href)} data-testid={`kassa-kopf-${id}`}>
      <I aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </button>
  ));
}

function zahlartenListe(kontext, faehig) {
  return [
    { wert: "karte", titel: "Karte", icon: "CreditCard", deaktiviert: !kontext.terminals?.length },
    { wert: "bar", titel: "Bar", icon: "Banknote" },
    { wert: "gutschein", titel: "Gutschein", icon: "Gift" },
    { wert: "rechnung", titel: "Rechnung", icon: "FileText", grund: faehig.ueberweisung?.an ? null : `${faehig.ueberweisung?.grund || "Noch nicht verfügbar"} – ${faehig.ueberweisung?.ersatz || ""}`.replace(/ – $/, "") },
  ];
}

function kundeAusTreffer(k) {
  return { kontakt: k.kontakt, titel: k.titel, untertitel: k.untertitel || "", email: k.email || "", auftraege: k.auftraege || [], rechnungen: k.rechnungen || [], kartennummer: k.kartennummer || "", stufe: k.stufe || "", vorteile: k.vorteile || [] };
}

function Inhalt({ kontext, katalog, kategorien, schnelltasten, leitung, faehig, benutzer, simuliere, start, setKopf, scanRef }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ansagen } = useKiosk();
  useToastAnker("#kassa-meldungen");
  const kasse = kontext.kasse;
  const einst = kontext.einstellungen || {};
  const [bon, dispatch] = useReducer(bonReducer, undefined, () => leererBon());
  const [modus, setModus] = useState("bon"); // bon | zahlung | ergebnis | ohneBeleg
  const [zahlart, setZahlart] = useState(kontext.terminals?.length ? "karte" : "bar");
  const [kat, setKat] = useState("alle");
  const [menge, setMenge] = useState(1);
  const [kundenfilter, setKundenfilter] = useState(false);
  const [bucht, setBucht] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const [freigabe, setFreigabe] = useState(null); // {gruende, wiederhole(f)}
  const [dialog, setDialog] = useState(null); // freitext | gutschein | anzahlung | rechnungsfrage | zeile
  const [zahlStand, setZahlStand] = useState(null);
  const [scanGutschein, setScanGutschein] = useState(null);
  const [ohneBeleg, setOhneBeleg] = useState(null); // {entwurf, key, versuch}
  const [tagesstart, setTagesstart] = useState(!kontext.tagesstart?.bestaetigt);
  const [geparkt, setGeparkt] = useState([]);
  const [speicherOk, setSpeicherOk] = useState(true);
  const [grob, setGrob] = useState(false);
  const such = useRef(null);
  const geladen = useRef(false);
  const summe = useMemo(() => bonSummen(bon), [bon]);
  const zahlarten = useMemo(() => zahlartenListe(kontext, faehig), [kontext, faehig]);
  const gewaehlt = zahlarten.find((z) => z.wert === zahlart);
  const kassierenGrund = gewaehlt?.grund || null;
  const gesperrt = !!kontext.gesperrt || modus === "ohneBeleg";
  const entwurfKey = schluessel.entwurf(kasse, benutzer?.email || benutzer?.name || "");

  // ------------------------------------------------------- Entwurf-Spiegel
  useEffect(() => {
    setGrob(window.matchMedia?.("(pointer: coarse)").matches || false); // eslint-disable-line react-hooks/set-state-in-effect -- Zeigerart erst nach dem Einhängen bekannt
    let aus = false;
    (async () => {
      const [e, p, o] = await Promise.all([lese(entwurfKey), lese(schluessel.geparkt(kasse)), lese(schluessel.ohneBeleg(kasse))]);
      if (aus) return;
      setSpeicherOk(verfuegbar() !== false);
      if (o?.entwurf) {
        setOhneBeleg({ ...o, versuch: 3 });
        setModus("ohneBeleg");
      } else if (e?.positionen?.length) dispatch({ typ: "laden", bon: e });
      if (Array.isArray(p)) setGeparkt(p);
      geladen.current = true;
    })();
    return () => {
      aus = true;
    };
  }, [entwurfKey, kasse]);
  useEffect(() => {
    if (!geladen.current) return;
    const t = setTimeout(() => {
      if (bon.positionen.length || bon.kunde) schreibe(entwurfKey, bon);
      else loesche(entwurfKey);
    }, 1000);
    return () => clearTimeout(t);
  }, [bon, entwurfKey]);

  // --------------------------------------------------------------- Kunde
  const kundeSetzen = useCallback(async (k) => {
    dispatch({ typ: "kunde", kunde: k });
    if (k.kartennummer && !k.vorteile?.length) {
      const r = await karteAction({ kartennummer: k.kartennummer });
      if (r.ok && r.daten.code === "ok") dispatch({ typ: "kunde", kunde: { ...k, stufe: r.daten.stufe, vorteile: r.daten.vorteile || [] } });
    }
    if (k.stufe) zeige(KIOSK.scan.karteErkannt(stufeName(k.stufe)), { art: "ok" });
  }, [zeige]);

  // ------------------------------------------------- AnDieKassa (?kunde=&beleg=)
  useEffect(() => {
    if (!start?.kunde) return;
    sucheAction({ q: start.kunde }).then((r) => {
      const k = r.ok ? r.daten.kunden.find((x) => x.kontakt === start.kunde) || r.daten.kunden[0] : null;
      if (k) kundeSetzen(kundeAusTreffer(k));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const karteGescannt = useCallback(
    async (treffer) => {
      if (!treffer) return zeige(KIOSK.suche.unbekannt(""), { art: "warnung" });
      if (treffer.code && treffer.code !== "ok") return zeige(treffer.hinweis || KIOSK.scan.karteGesperrt, { art: "warnung" });
      let k = { kontakt: treffer.kontakt || "", titel: treffer.name, stufe: treffer.stufe, kartennummer: treffer.kartennummer, vorteile: treffer.vorteile || [], auftraege: [], rechnungen: [], email: "" };
      if (treffer.kontakt) {
        const r = await sucheAction({ q: treffer.kontakt });
        const t = r.ok ? r.daten.kunden.find((x) => x.kontakt === treffer.kontakt) : null;
        if (t) k = { ...k, email: t.email, auftraege: t.auftraege, rechnungen: t.rechnungen, untertitel: t.untertitel };
      }
      dispatch({ typ: "kunde", kunde: k });
      zeige(KIOSK.scan.karteErkannt(stufeName(k.stufe)), { art: "ok" });
      ansagen(KIOSK.scan.karteErkannt(k.stufe));
    },
    [zeige, ansagen]
  );

  // ------------------------------------------------------------ Positionen
  const artikelHinzu = useCallback(
    (p, m = menge) => {
      if (gesperrt || modus !== "bon") return;
      if (!p.einzel_brutto_cent && p.einzel_brutto_cent !== 0) return;
      dispatch({ typ: "artikel", position: { art: "Artikel", produkt: p.produkt, bezeichnung: p.bezeichnung, marke: p.marke, bild: p.bild, einzel_brutto_cent: p.einzel_brutto_cent ?? p.betrag_cent, steuersatz: p.steuersatz || "Normal 20" }, menge: m });
      setMenge(1);
      const neu = mengeVon(bon, p.produkt) + m;
      ansagen(KIOSK.ansage.hinzu(p.bezeichnung, neu, bon.positionen.length + (mengeVon(bon, p.produkt) ? 0 : 1), euroSprache(summe.gesamt_cent + m * (p.einzel_brutto_cent || 0))));
    },
    [gesperrt, modus, menge, bon, summe.gesamt_cent, ansagen]
  );

  const kachelTipp = (p) => {
    if (p.aktion === "Gutschein Verkauf") return setDialog({ art: "gutschein", wert: p.betrag_cent });
    if (p.aktion === "Freitext") return setDialog({ art: "freitext", betrag: p.betrag_cent, bezeichnung: p.bezeichnung });
    artikelHinzu({ produkt: p.produkt, bezeichnung: p.bezeichnung, marke: p.marke, bild: p.bild, einzel_brutto_cent: p.betrag_cent, steuersatz: p.steuersatz });
  };

  const eintraege = useMemo(() => {
    const st = schnelltasten.filter((s) => kat === "alle" || s.kategorie === kat);
    if (kat === "alle") return st;
    const da = new Set(st.map((s) => s.produkt));
    const mehr = katalog.filter((p) => p.kategorie === kat && !da.has(p.produkt) && p.einzel_brutto_cent > 0).slice(0, 24).map((p) => ({ name: p.produkt, aktion: "Produkt", produkt: p.produkt, bezeichnung: p.bezeichnung, marke: p.marke, betrag_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz, bild: p.bild, kategorie: p.kategorie, lager: p.lager }));
    return [...st, ...mehr];
  }, [schnelltasten, katalog, kat]);

  const naechsterKunde = useCallback(() => {
    dispatch({ typ: "leeren" });
    setErgebnis(null);
    setModus("bon");
    setZahlStand(null);
    setScanGutschein(null);
    setZahlart(kontext.terminals?.length ? "karte" : "bar");
    setTimeout(() => such.current?.fokus(), 30);
  }, [kontext.terminals]);

  // ------------------------------------------------------------------ Scan
  const scan = async (code) => {
      const e = erkennen(code);
      const zustand = dialog || freigabe ? "dialog" : modus === "zahlung" ? (zahlStand?.karte === "wartet" || zahlStand?.karte === "bezahlt" ? "karte" : "zahlmaske") : modus === "ergebnis" ? "ergebnis" : modus === "ohneBeleg" ? "karte" : "bon";
      const lokaleKarte = /^[A-Z]{2,3}-[0-9A-Z]{6}$/.test(code.trim().toUpperCase()) && !/^AB-|^RE-/.test(code.trim().toUpperCase());
      const erlaubt = scanErlaubt(lokaleKarte && e.art === "suche" ? "kundenkarte" : e.art, zustand);
      if (!erlaubt.wirkt) return zeige(KIOSK.scan[erlaubt.hinweis], { art: "info" });
      if (zustand === "ergebnis") naechsterKunde();
      if (e.art === "gutschein") {
        if (modus === "zahlung") setScanGutschein(e.wert + "#" + Date.now());
        else zeige(KIOSK.scan.gutscheinImBon, { art: "info", aktion: { titel: KIOSK.scan.jetztEinloesen, onClick: () => bon.positionen.length && (setZahlart("gutschein"), setModus("zahlung"), setScanGutschein(e.wert + "#" + Date.now())) } });
        return;
      }
      if (e.art === "ean") {
        const p = katalog.find((x) => x.ean === e.wert);
        if (p) return artikelHinzu(p);
      }
      if (e.art === "kassenbeleg" || e.art === "rksv_qr") return router.push(`/kassa/belege?beleg=${encodeURIComponent(e.art === "kassenbeleg" ? e.wert : code)}`);
      const r = await codeAction({ code });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      const t = r.daten;
      if (t.art === "kundenkarte") return karteGescannt(t.treffer);
      if (t.art === "ean" || t.art === "suche") {
        const p = (t.art === "ean" ? t.treffer : t.treffer?.produkte)?.[0];
        if (p) return artikelHinzu({ ...p, bild: p.bild || katalog.find((x) => x.produkt === p.produkt)?.bild || "" });
        const k = t.treffer?.kunden?.[0];
        if (k) return kundeSetzen(kundeAusTreffer(k));
      }
      if (t.art === "auftrag" || t.art === "rechnung" || t.art === "bestellung") {
        const s = await sucheAction({ q: code });
        const k = s.ok ? s.daten.kunden[0] : null;
        if (k?.kontakt) return kundeSetzen(kundeAusTreffer(k));
      }
      zeige(KIOSK.suche.unbekannt(code), { art: "warnung" });
  };
  useEffect(() => {
    scanRef.current = (c) => scan(c);
  });

  // ------------------------------------------------------- Kassieren/Buchen
  const kassierenStarten = () => {
    if (!bon.positionen.length || gesperrt || kassierenGrund) return;
    if (rechnungsfrageNoetig({ positionen: summe.positionen, kontakt: bon.kunde?.kontakt, antwort: bon.rechnungsantwort, rechnung: bon.rechnung }, einst)) return setDialog({ art: "rechnungsfrage" });
    setModus("zahlung");
  };

  const entwurf = (zeilen, gesamt) => ({
    kasse,
    positionen: positionenFuerServer(bon),
    zahlarten: zahlartenFuerServer(gesamt, zeilen),
    kontakt: bon.kunde?.kontakt || undefined,
    auftrag: bon.auftrag || undefined,
    rechnung: bon.rechnung || undefined,
    zahlungsplan_position: bon.zahlungsplan_position || undefined,
    kundenkarte: bon.kunde?.kartennummer || undefined,
    vorteile: bon.vorgemerkt,
    empfaenger: bon.rechnungsantwort?.empfaenger || undefined,
  });

  const buchen = async (zeilen, opt = {}, fg = null, wiederholung = null) => {
      setBucht(true);
      const gesamt = summe.gesamt_cent;
      const e = wiederholung?.entwurf || entwurf(zeilen, gesamt);
      const key = wiederholung?.key || idempotenzSchluessel(kasse, bon.entwurf_uuid);
      const r = await kassierenAction({ entwurf: e, idempotencyKey: key, freigabe: fg, simuliere });
      setBucht(false);
      if (r.ok) {
        const d = r.daten;
        const vorteilTitel = (bon.kunde?.vorteile || []).filter((v) => bon.vorgemerkt.includes(v.vorteil)).map((v) => v.titel);
        const neu = { ...d, zeilen, gegeben: opt.gegeben ?? null, vorteile: vorteilTitel, email: bon.kunde?.email || "", gesamt: d.gesamt_cent ?? gesamt, positionen: bon.positionen, kunde: bon.kunde };
        setErgebnis(neu);
        setFreigabe(null);
        setOhneBeleg(null);
        loesche(schluessel.ohneBeleg(kasse));
        loesche(entwurfKey);
        setModus("ergebnis");
        ansagen(KIOSK.ansage.beleg(d.belegnummer, d.rueckgeld_cent ? euroSprache(d.rueckgeld_cent) : ""));
        belegDatenAction({ name: d.beleg }).then((b) => b.ok && setErgebnis((x) => (x && x.beleg === d.beleg ? { ...x, qr: b.daten.maschinenlesbarer_code || "" } : x)));
        return { ok: true };
      }
      if (r.code === "freigabe") {
        setFreigabe({ gruende: r.daten?.gruende || [], wiederhole: (f) => buchen(zeilen, opt, f, { entwurf: e, key }) });
        return { ok: false, message: fg ? r.message : undefined };
      }
      if (fg && (r.code === "auth" || r.code === "forbidden")) return { ok: false, message: r.message };
      const karteBezahlt = e.zahlarten.some((z) => z.zahlart === "Karte Stripe Terminal" && z.terminal_payment_intent);
      if (karteBezahlt && (r.code === "unavailable" || r.code === "conflict")) {
        const o = { entwurf: e, key, versuch: (wiederholung?.versuch || 0) + 1, gesamt };
        setOhneBeleg(o);
        schreibe(schluessel.ohneBeleg(kasse), { entwurf: e, key, gesamt });
        setModus("ohneBeleg");
        return { ok: false };
      }
      zeige(`${KIOSK.fehler.buchen}: ${fehlerText(r.code, r.message)}`, { art: "fehler" });
      return { ok: false, message: r.message };
  };
  const buchenRef = useRef(buchen);
  useEffect(() => {
    buchenRef.current = buchen;
  });

  // „Zahlung erhalten – Beleg offen“: 3 automatische Versuche (2 / 4 / 8 s), dann „Erneut buchen“.
  useEffect(() => {
    if (modus !== "ohneBeleg" || !ohneBeleg || ohneBeleg.versuch > 3 || bucht) return;
    const t = setTimeout(() => buchenRef.current(null, {}, null, ohneBeleg), 2000 * 2 ** (ohneBeleg.versuch - 1));
    return () => clearTimeout(t);
  }, [modus, ohneBeleg, bucht]);


  // ----------------------------------------------------------- Parken
  const parken = async () => {
    if (!bon.positionen.length) return;
    const liste = [...geparkt, { ...bon, geparkt_am: new Date().toISOString(), von: benutzer?.name || "" }].slice(-12);
    setGeparkt(liste);
    await schreibe(schluessel.geparkt(kasse), liste);
    dispatch({ typ: "leeren" });
    zeige(KIOSK.korb.geparkt, { art: "ok" });
  };
  const verwerfen = () => {
    const alt = bon;
    dispatch({ typ: "leeren" });
    zeige(KIOSK.korb.verworfen, { art: "info", aktion: { titel: "Rückgängig", onClick: () => dispatch({ typ: "laden", bon: alt }) } });
  };

  // --------------------------------------------------------------- Tasten
  const offenAuftrag = bon.kunde?.auftraege?.find((a) => a.anzahlung_offen_cent > 0);
  useKuerzel("kiosk-kassa@kassa", {
    "kassa.kunde": () => {
      setKundenfilter(true);
      such.current?.fokus();
    },
    "kassa.tippen": () => such.current?.tippen(),
    "kassa.freitext": () => modus === "bon" && !gesperrt && setDialog({ art: "freitext" }),
    "kassa.anzahlung": () => (offenAuftrag ? setDialog({ art: "anzahlung", art2: "Anzahlung", auftrag: offenAuftrag.auftrag, offen_cent: offenAuftrag.anzahlung_offen_cent }) : (setKundenfilter(true), such.current?.fokus())),
    "kassa.gutschein": () => modus === "bon" && !gesperrt && faehig.gutschein_verkauf?.an && setDialog({ art: "gutschein" }),
    "kassa.belege": () => router.push("/kassa/belege"),
    "kassa.bargeld": () => router.push("/kassa/bargeld"),
    "kassa.abschluss": () => router.push("/kassa/abschluss"),
    "kassa.zahlart": () => modus === "bon" && bon.positionen.length && (setZahlart("bar"), kassierenStarten()),
    "kassa.parken": () => modus === "bon" && parken(),
    "kassa.retoure": () => router.push("/kassa/belege?retoure=1"),
    "kassa.rabatt": () => bon.aktiv && setDialog({ art: "zeile", id: bon.aktiv }),
    "kassa.zeilenmenue": () => bon.aktiv && setDialog({ art: "zeile", id: bon.aktiv }),
    "kassa.zeile-hoch": () => {
      if (modus !== "bon" || !bon.positionen.length) return false;
      const z = bon.positionen.at(-1);
      dispatch({ typ: "aktiv", id: z.id });
      requestAnimationFrame(() => document.querySelector(`[data-id="${z.id}"]`)?.focus());
    },
  });

  // F12 / Strg+Enter = Hauptaktion (Fundament „kiosk.primaer“): Bon → Kassieren, Ergebnis → Nächster Kunde.
  // In der Zahlmaske wirkt die Taste dort (Kassieren mit 300-ms-Sperre); hier läuft das Ereignis weiter.
  const primaer = () => (modus === "bon" ? kassierenStarten() : modus === "ergebnis" ? naechsterKunde() : false);
  useKuerzel("kiosk", { "kiosk.primaer": primaer, "kiosk.primaer-enter": primaer });

  // ---------------------------------------------------- Kopfzeile/Bänder
  useEffect(() => {
    const baender = [];
    if (modus === "ohneBeleg") baender.push({ art: "zahlung-ohne-beleg", text: KIOSK.ohneBeleg.titel });
    if (kontext.gesperrt) baender.push({ art: "gesperrt", text: KIOSK.fehler.gesperrt });
    if (kontext.trainings) baender.push({ art: "training", text: KIOSK.echtbetrieb });
    if (kontext.abschluss_heute?.status === "Gezaehlt" && modus === "bon") baender.push({ art: "info", ton: "info", icon: "ScrollText", text: KIOSK.abschluss.offenBand, aktion: kontext.leitung ? { titel: KIOSK.abschluss.leitungUebernehmen, onClick: () => router.push("/kassa/abschluss") } : undefined });
    if (kontext.vortag_offen && modus === "bon") baender.push({ art: "info", ton: "warnung", icon: "CalendarDays", text: KIOSK.abschluss.vortagBand(new Date(`${kontext.vortag_offen.datum}T12:00:00`).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" })), aktion: kontext.leitung ? { titel: KIOSK.abschluss.nachholen, onClick: () => router.push(`/kassa/abschluss?datum=${kontext.vortag_offen.datum}`) } : undefined });
    if (!speicherOk) baender.push({ art: "warteschlange", ton: "warnung", text: "Entwurf wird nicht gesichert" });
    const status = kontext.gesperrt ? { text: KIOSK.gesperrt, ton: "warnung" } : kontext.trainings ? { text: KIOSK.training, ton: "warnung" } : { text: KIOSK.bereit, ton: "ok" };
    const naechste = (kontext.letzter_beleg?.belegnummer || 0) + 1;
    setKopf({ status, baender, scanAus: false, kontextText: ergebnis ? KIOSK.ergebnis.beleg(ergebnis.belegnummer) : KIOSK.bon(naechste) });
  }, [modus, kontext, speicherOk, ergebnis, setKopf, router]);

  // ------------------------------------------------------- Kundendisplay
  const displayBedient = useRef(false);
  const senden = useKundendisplaySender(kasse, { anrede: einst.kundendisplay_anrede ? "vorname" : "aus" });
  useEffect(() => {
    if (!einst.kundendisplay_aktiv && einst.kundendisplay_aktiv !== undefined) return;
    const kk = bon.kunde?.stufe ? { stufe: stufeName(bon.kunde.stufe), vorteile: (bon.kunde.vorteile || []).map((v) => ({ titel: v.titel, eingeloest: bon.vorgemerkt.includes(v.vorteil) })) } : null;
    const pos = bon.positionen.map((p) => ({ titel: p.bezeichnung, unter: p.marke || "", menge: p.menge, einzel_cent: p.einzel_brutto_cent, betrag_cent: Math.round(p.einzel_brutto_cent * p.menge), bild: p.bild && p.bild.startsWith("/entwurf/") ? p.bild : "", neu: p.id === bon.neu }));
    const ust = summe.ust_cent;
    if (modus === "ergebnis" && ergebnis) {
      const bar = ergebnis.zeilen?.some((z) => z.art === "bar");
      senden({ zustand: "danke", positionen: [], gesamt_cent: ergebnis.gesamt, rueckgeld_cent: ergebnis.rueckgeld_cent, zahlart: bar ? "bar" : "karte", kundenkarte: ergebnis.vorteile?.length ? { stufe: stufeName(ergebnis.kunde?.stufe) || "Platzhirsch", vorteile: ergebnis.vorteile.map((t) => ({ titel: t, eingeloest: true })) } : null, qr: ergebnis.beleg ? `beleg:${ergebnis.beleg}` : "", training: !!ergebnis.trainings });
    } else if (modus === "zahlung" && zahlStand) {
      const bar = zahlStand.art === "bar";
      senden({ zustand: "bezahlen", positionen: pos.slice(-6), anzahl: bon.positionen.length, gesamt_cent: summe.gesamt_cent, zahlart: bar ? "bar" : zahlStand.art === "gutschein" ? "gutschein" : "karte", gegeben_cent: bar ? zahlStand.gegeben : null, rueckgeld_cent: bar ? zahlStand.rueckgeld : null, kundenkarte: kk, ust_cent: ust, training: !!kontext.trainings });
    } else if (bon.positionen.length) {
      senden({ zustand: "einkauf", positionen: pos.slice(-6), anzahl: bon.positionen.length, zwischensumme_cent: summe.gesamt_cent, ust_cent: ust, gesamt_cent: summe.gesamt_cent, kundenkarte: kk, training: !!kontext.trainings });
    } else {
      // Ruhebild erst mit der ersten Bedienung senden (der keepalive-POST des Kanals hält sonst „networkidle“ der
      // QA-Werkzeuge offen); bis dahin zeigt das Display ohnehin das Ruhebild.
      const los = () => senden({ zustand: "ruhe", positionen: [], text: einst.kundendisplay_text || "" });
      if (displayBedient.current) los();
      else {
        const erst = () => {
          displayBedient.current = true;
          los();
        };
        window.addEventListener("pointerdown", erst, { once: true });
        window.addEventListener("keydown", erst, { once: true });
        return () => {
          window.removeEventListener("pointerdown", erst);
          window.removeEventListener("keydown", erst);
        };
      }
    }
  }, [bon, summe, modus, zahlStand, ergebnis, senden, einst.kundendisplay_aktiv, einst.kundendisplay_anrede, einst.kundendisplay_text, kontext.trainings]);

  // -------------------------------------------------------------- Ansicht
  const zahlungAktiv = modus === "zahlung";
  const bonGesperrt = gesperrt || zahlungAktiv || modus === "ergebnis";

  return (
    <div className="bo-ka bo-ka--voll" data-testid="kassa-verkauf" data-modus={modus}>
      <div className="bo-ka-verkauf">
        <section className="bo-ka-sort" aria-label={KIOSK.sortiment}>
          {tagesstart && !bon.positionen.length && modus === "bon" && !kontext.gesperrt && (
            <div className="bo-ka-tagesstart" data-testid="kassa-tagesstart">
              <span className="bo-ka-rund" aria-hidden="true" style={{ boxShadow: "none", background: "var(--salbei-bg)", color: "var(--salbei-fg)" }}>
                <Wallet {...S} />
              </span>
              <span className="flex-1">
                <span className="block bo-ka-muted text-[13px]">{KIOSK.tagesstart.titel} · {KIOSK.tagesstart.text}</span>
                <span className="bo-ka-tagesstart__betrag">{euro(kontext.bargeld_bestand_cent)}</span>
              </span>
              <button type="button" className="bo-ka-zweit bo-ka-zweit--rand" onClick={() => router.push("/kassa/bargeld?tagesstart=1")}>
                {KIOSK.tagesstart.anders}
              </button>
              <button
                type="button"
                className="bo-ka-zweit"
                style={{ background: "var(--ink)", color: "var(--on-ink)" }}
                onClick={async () => {
                  const r = await tagesstartAction({ kasse, wertCent: kontext.bargeld_bestand_cent });
                  if (r.ok) {
                    setTagesstart(false);
                    zeige(KIOSK.tagesstart.bestaetigt(euro(kontext.bargeld_bestand_cent)), { art: "ok" });
                  } else zeige(r.message, { art: "fehler" });
                }}
                data-testid="kassa-tagesstart-ok"
              >
                {KIOSK.tagesstart.stimmt}
              </button>
            </div>
          )}
          <Suchfeld
            ref={such}
            gesperrt={bonGesperrt}
            menge={menge}
            onMenge={(n) => {
              setMenge(Math.max(1, Math.min(99, n)));
              if (n > 1) setTimeout(() => setMenge(1), 20000);
            }}
            onArtikel={(a) => artikelHinzu({ ...a, bild: a.bild || katalog.find((x) => x.produkt === a.produkt)?.bild || "" })}
            onKunde={(k) => kundeSetzen(kundeAusTreffer(k))}
            onCode={(c) => scan(c)}
            kundenfilter={kundenfilter}
            setKundenfilter={setKundenfilter}
            grob={grob}
          />
          <Kategorien kategorien={kategorien} aktiv={kat} onWahl={setKat} />
          <Produkte eintraege={eintraege} mengeVon={(id) => mengeVon(bon, id)} onTipp={kachelTipp} gesperrt={bonGesperrt} />
          <div id="kassa-meldungen" className="relative" />
        </section>

        {modus === "zahlung" ? (
          <Zahlmaske
            gesamt={summe.gesamt_cent}
            start={zahlart === "rechnung" ? "bar" : zahlart}
            kontext={kontext}
            zahlarten={zahlarten.filter((z) => z.wert !== "rechnung")}
            onBuchen={(zeilen, opt) => buchen(zeilen, opt)}
            onZurueck={() => {
              setModus("bon");
              setZahlStand(null);
            }}
            onStand={setZahlStand}
            bucht={bucht}
            scanGutschein={scanGutschein ? scanGutschein.split("#")[0] : null}
            ansagen={ansagen}
            zeige={zeige}
          />
        ) : modus === "ohneBeleg" && ohneBeleg ? (
          <aside className="bo-ka-korb" aria-label={KIOSK.ohneBeleg.titel} data-testid="kassa-ohne-beleg">
            <div className="bo-ka-ohnebeleg" role="alert">
              <b>{KIOSK.ohneBeleg.titel}</b>
              <span>{KIOSK.ohneBeleg.text}</span>
              <span className="bo-ka-num">{euro(ohneBeleg.gesamt)}</span>
              <span>{ohneBeleg.versuch <= 3 ? KIOSK.ohneBeleg.versuch(ohneBeleg.versuch, 3) : KIOSK.ohneBeleg.gesichert}</span>
            </div>
            <div className="flex-1" />
            <button type="button" className="bo-ka-pay" disabled={bucht} onClick={() => buchen(null, {}, null, { ...ohneBeleg, versuch: 4 })} data-testid="kassa-erneut-buchen">
              <span>{KIOSK.ohneBeleg.erneut}</span>
              <span className="bo-ka-num">{euro(ohneBeleg.gesamt)}</span>
            </button>
          </aside>
        ) : (
          <Korb
            bon={bon}
            summe={summe}
            zahlart={zahlart}
            setZahlart={setZahlart}
            zahlarten={zahlarten}
            gesperrt={bonGesperrt}
            kassierenGrund={bon.positionen.length ? kassierenGrund : null}
            onKassieren={kassierenStarten}
            onMenge={(id, d) => dispatch({ typ: "menge", id, delta: d })}
            onEntfernen={(id) => {
              const p = bon.positionen.find((x) => x.id === id);
              dispatch({ typ: "entfernen", id });
              if (p) ansagen(KIOSK.ansage.entfernt(p.bezeichnung));
            }}
            onAktiv={(id) => dispatch({ typ: "aktiv", id })}
            onKundeEntfernen={() => dispatch({ typ: "kunde-weg" })}
            onKundeSuchen={() => {
              setKundenfilter(true);
              such.current?.fokus();
            }}
            onVorteil={(id) => dispatch({ typ: "vorteil", id })}
            onOffen={(o) => setDialog({ art: "anzahlung", art2: o.art, auftrag: o.auftrag, rechnung: o.rechnung, offen_cent: o.offen_cent, steuersatz: o.steuersatz })}
            onMenue={(m) => {
              if (m === "freitext") setDialog({ art: "freitext" });
              else if (m === "gutschein") setDialog({ art: "gutschein" });
              else if (m === "parken") parken();
              else if (m === "verwerfen") verwerfen();
              else if (m === "display") window.open(`/kassa/display?kasse=${encodeURIComponent(kasse)}`, "kundendisplay", "popup,width=1280,height=800");
            }}
            geparktAnzahl={geparkt.length}
            faehig={faehig}
            sucheFokus={() => such.current?.fokus()}
            onZeile={(id) => setDialog({ art: "zeile", id })}
          />
        )}
      </div>

      <Ergebnis ergebnis={modus === "ergebnis" ? ergebnis : null} onWeiter={naechsterKunde} zeige={zeige} />
      <Freigabe
        key={freigabe ? freigabe.gruende.join() : "zu"}
        offen={!!freigabe}
        gruende={freigabe?.gruende || []}
        zusammenfassung={`${KIOSK.korb.gesamt} ${euro(summe.gesamt_cent)}`}
        leitung={leitung}
        onFreigabe={(f) => freigabe.wiederhole(f)}
        onAbbrechen={() => setFreigabe(null)}
      />
      <Dialoge dialog={dialog} setDialog={setDialog} bon={bon} dispatch={dispatch} einst={einst} faehig={faehig} weiterZurZahlung={() => setModus("zahlung")} />
    </div>
  );
}

// ------------------------------------------------------------------ Ergebnis

function Ergebnis({ ergebnis, onWeiter, zeige }) {
  if (!ergebnis) return null;
  return <ErgebnisSheet key={ergebnis.beleg} ergebnis={ergebnis} onWeiter={onWeiter} zeige={zeige} />;
}

function ErgebnisSheet({ ergebnis, onWeiter, zeige }) {
  const [mail, setMail] = useState({ an: false, adresse: ergebnis.email || "" });
  const [druck, setDruck] = useState(ergebnis.druck?.modus && ergebnis.druck.modus !== "keiner" ? (ergebnis.druck.modus === "fehler" ? "fehler" : "gedruckt") : null);
  const bar = ergebnis.zeilen?.find((z) => z.art === "bar");
  const karte = ergebnis.zeilen?.some((z) => z.art === "karte");
  const gs = ergebnis.zeilen?.some((z) => z.art === "gutschein");
  const art = [karte && KIOSK.ergebnis.kartenzahlung, bar && KIOSK.ergebnis.barzahlung, gs && KIOSK.ergebnis.gutscheinzahlung].filter(Boolean).join(" + ");
  const senden = async (an) => {
    setMail((m) => ({ ...m, an }));
    if (!an || !mail.adresse) return;
    const r = await belegMailenAction({ beleg: ergebnis.beleg, email: mail.adresse });
    zeige(r.ok ? KIOSK.ergebnis.mailGesendet(mail.adresse) : r.message, { art: r.ok ? "ok" : "fehler" });
    if (!r.ok) setMail((m) => ({ ...m, an: false }));
  };
  return (
    <Sheet offen onSchliessen={onWeiter} label={KIOSK.ergebnis.titel} testid="kassa-ergebnis" kopf={<Haken />}>
      <p className="bo-ka-muted text-[13px]">
        {art} · {KIOSK.ergebnis.beleg(ergebnis.belegnummer)}
      </p>
      <p className="bo-ka-sheet__betrag" data-testid="kassa-ergebnis-betrag">{euro(ergebnis.gesamt)}</p>
      {ergebnis.trainings ? <p className="bo-ka-hinweis" data-ton="warnung">{KIOSK.ergebnis.training}</p> : null}
      {ergebnis.wiederholung && <p className="bo-ka-hinweis">{KIOSK.ergebnis.wiederholung}</p>}
      {bar && ergebnis.rueckgeld_cent > 0 && (
        <div className="bo-ka-sheet__rueck" data-testid="kassa-ergebnis-rueckgeld">
          <span>{KIOSK.ergebnis.rueckgeld}</span>
          <b>{euro(ergebnis.rueckgeld_cent)}</b>
        </div>
      )}
      <p className="bo-ka-sheet__text">
        {KIOSK.ergebnis.titel}.{ergebnis.vorteile?.length ? ` ${ergebnis.vorteile.map((v) => KIOSK.ergebnis.vorteil(v)).join(" · ")} ✓` : ""}
      </p>
      {(ergebnis.hinweise || []).map((h) => (
        <p key={h} className="bo-ka-hinweis" data-ton="warnung">{h}</p>
      ))}
      {(ergebnis.gutschein_codes || []).map((g) => (
        <div key={g.code} className="w-full" data-testid="kassa-gutschein-code">
          <p className="bo-ka-label">{KIOSK.ergebnis.gutscheinCode} · {euro(g.wert_cent)}</p>
          <p className="bo-ka-code">{g.code}</p>
          <p className="bo-ka-grund">{KIOSK.ergebnis.gutscheinHinweis}</p>
        </div>
      ))}
      {druck === "fehler" && <p className="bo-ka-hinweis" data-ton="warnung">{KIOSK.ergebnis.druckFehler}</p>}
      <div className="bo-ka-sheet__opts">
        {ergebnis.email ? (
          <div className="bo-ka-opt">
            <Schalter label={KIOSK.ergebnis.mail(ergebnis.email)} an={mail.an} onWechsel={senden} testid="kassa-mail-schalter" />
          </div>
        ) : (
          <div className="bo-ka-opt" data-scan="nein">
            <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
            <input className="flex-1 bg-transparent outline-none text-[15px] min-w-0" type="email" inputMode="email" placeholder={KIOSK.ergebnis.mailOhne} aria-label={KIOSK.ergebnis.mailAdresse} value={mail.adresse} onChange={(e) => setMail({ an: false, adresse: e.target.value })} data-scan="nein" data-testid="kassa-mail-adresse" />
            <button type="button" className="bo-ka-zweit" style={{ height: 40 }} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.adresse)} onClick={() => senden(true)}>
              {KIOSK.ergebnis.mailSenden}
            </button>
          </div>
        )}
        <div className="bo-ka-opt">
          <span className="inline-flex items-center gap-2">
            <Printer size={18} strokeWidth={1.75} aria-hidden="true" />
            {druck === "gedruckt" ? KIOSK.ergebnis.gedruckt : KIOSK.ergebnis.drucken}
          </span>
          <button
            type="button"
            className="bo-ka-zweit"
            style={{ height: 40 }}
            onClick={async () => {
              const r = await belegDruckenAction({ beleg: ergebnis.beleg });
              setDruck(r.ok ? "gedruckt" : "fehler");
            }}
          >
            {KIOSK.ergebnis.nachdruck}
          </button>
        </div>
      </div>
      <button type="button" className="bo-ka-primaer" style={{ height: 56 }} onClick={onWeiter} data-autofokus data-testid="kassa-naechster">
        {KIOSK.ergebnis.naechster}
      </button>
    </Sheet>
  );
}

// ------------------------------------------------------------------- Dialoge

function Dialoge(props) {
  if (!props.dialog) return null;
  return <EinDialog key={JSON.stringify(props.dialog)} {...props} />;
}

function EinDialog({ dialog, setDialog, bon, dispatch, einst, faehig, weiterZurZahlung }) {
  const zu = () => setDialog(null);
  const [werte, setWerte] = useState({});
  const set = (k, v) => setWerte((w) => ({ ...w, [k]: v }));

  if (dialog.art === "freitext") {
    const betrag = werte.betrag ?? dialog.betrag ?? null;
    const ok = (werte.bezeichnung ?? dialog.bezeichnung ?? "").trim().length >= 2 && betrag > 0;
    return (
      <Sheet offen onSchliessen={zu} titel={KIOSK.freitext.titel} breit testid="kassa-freitext">
        <label className="bo-ka-label" htmlFor="ft-bez">{KIOSK.freitext.bezeichnung}</label>
        <input id="ft-bez" className="bo-ka-eingabe" data-scan="nein" data-autofokus defaultValue={dialog.bezeichnung || ""} onChange={(e) => set("bezeichnung", e.target.value)} />
        <label className="bo-ka-label" htmlFor="ft-betrag">{KIOSK.freitext.betrag}</label>
        <BetragFeld id="ft-betrag" value={betrag} onChange={(c) => set("betrag", c)} className="bo-ka-eingabe" />
        <p className="bo-ka-label">{KIOSK.freitext.steuer}</p>
        <div className="bo-ka-chips" role="radiogroup" aria-label={KIOSK.freitext.steuer}>
          {["Normal 20", "Ermaessigt-1 10", "Ermaessigt-2 13"].map((s) => (
            <button key={s} type="button" role="radio" aria-checked={(werte.steuersatz || "Normal 20") === s} className="bo-ka-chip" onClick={() => set("steuersatz", s)}>
              {STEUERSAETZE[s] / 100} %
            </button>
          ))}
        </div>
        <div className="bo-ka-reihe" style={{ marginTop: 8 }}>
          <button type="button" className="bo-ka-zweit" onClick={zu}>{KIOSK.abbrechen}</button>
          <button type="button" className="bo-ka-primaer" disabled={!ok} onClick={() => {
            dispatch({ typ: "freitext", position: { bezeichnung: (werte.bezeichnung ?? dialog.bezeichnung).trim(), einzel_brutto_cent: betrag, steuersatz: werte.steuersatz || "Normal 20" } });
            zu();
          }} data-testid="kassa-freitext-ok">{KIOSK.freitext.uebernehmen}</button>
        </div>
      </Sheet>
    );
  }

  if (dialog.art === "gutschein") {
    const uebernehmen = (cent) => {
      dispatch({ typ: "gutschein-verkauf", position: { bezeichnung: "Geschenkgutschein", einzel_brutto_cent: cent, steuersatz: einst.gutschein_art === "Einzweck" ? einst.standard_steuersatz || "Normal 20" : "Null 0" } });
      zu();
    };
    return (
      <Sheet offen onSchliessen={zu} titel={KIOSK.gutscheinVerkauf.titel} breit testid="kassa-gutschein-verkauf">
        {!faehig.gutschein_verkauf?.an && <p className="bo-ka-hinweis" data-ton="warnung">{faehig.gutschein_verkauf?.grund}</p>}
        <p className="bo-ka-label">{KIOSK.gutscheinVerkauf.wert}</p>
        <div className="bo-ka-schnell">
          {GUTSCHEIN_WERTE.map((w) => (
            <button key={w} type="button" onClick={() => uebernehmen(w)} disabled={!faehig.gutschein_verkauf?.an} data-testid="kassa-gutschein-wert">
              {euro(w).replace(",00", "")}
            </button>
          ))}
        </div>
        <label className="bo-ka-label" htmlFor="gs-anders" style={{ marginTop: 8 }}>{KIOSK.gutscheinVerkauf.anderer}</label>
        <BetragFeld id="gs-anders" value={werte.betrag ?? null} onChange={(c) => set("betrag", c)} className="bo-ka-eingabe" />
        <div className="bo-ka-reihe" style={{ marginTop: 8 }}>
          <button type="button" className="bo-ka-zweit" onClick={zu}>{KIOSK.abbrechen}</button>
          <button type="button" className="bo-ka-primaer" disabled={!(werte.betrag > 0) || !faehig.gutschein_verkauf?.an} onClick={() => uebernehmen(werte.betrag)}>
            {KIOSK.gutscheinVerkauf.uebernehmen(werte.betrag > 0 ? euro(werte.betrag) : "")}
          </button>
        </div>
      </Sheet>
    );
  }

  if (dialog.art === "anzahlung") {
    const betrag = werte.betrag ?? dialog.offen_cent ?? null;
    return (
      <Sheet offen onSchliessen={zu} titel={dialog.art2 === "Teilzahlung" ? `Zahlung auf ${dialog.rechnung}` : `${KIOSK.anzahlung.titel} ${dialog.auftrag || ""}`} breit testid="kassa-anzahlung">
        <p className="bo-ka-sheet__text">{KIOSK.korb.offen(dialog.art2 === "Teilzahlung" ? "Rechnung" : "Anzahlung", dialog.auftrag || dialog.rechnung, euro(dialog.offen_cent))}</p>
        <label className="bo-ka-label" htmlFor="az-betrag">{KIOSK.anzahlung.betrag}</label>
        <BetragFeld id="az-betrag" value={betrag} onChange={(c) => set("betrag", c)} className="bo-ka-eingabe" />
        {betrag > dialog.offen_cent && <p className="bo-ka-hinweis" data-ton="warnung">Mehr als offen – braucht Freigabe der Leitung.</p>}
        <div className="bo-ka-reihe" style={{ marginTop: 8 }}>
          <button type="button" className="bo-ka-zweit" onClick={zu}>{KIOSK.abbrechen}</button>
          <button type="button" className="bo-ka-primaer" disabled={!(betrag > 0)} onClick={() => {
            const teil = dialog.art2 === "Teilzahlung";
            dispatch({ typ: "anzahlung", art: teil ? "Teilzahlung" : "Anzahlung", auftrag: dialog.auftrag || null, rechnung: dialog.rechnung || null, position: { bezeichnung: teil ? `Zahlung ${dialog.rechnung}` : `Anzahlung ${dialog.auftrag}`, einzel_brutto_cent: betrag, steuersatz: dialog.steuersatz || einst.steuersatz_anzahlung || "Normal 20", bezug: dialog.auftrag || dialog.rechnung } });
            zu();
          }} data-testid="kassa-anzahlung-ok">{KIOSK.anzahlung.uebernehmen(betrag > 0 ? euro(betrag) : "")}</button>
        </div>
      </Sheet>
    );
  }

  if (dialog.art === "rechnungsfrage") {
    const e = werte.empfaenger || {};
    const ok = e.name?.trim() && e.strasse?.trim() && e.ort?.trim();
    return (
      <Sheet offen onSchliessen={zu} titel={KIOSK.rechnungsfrage.titel} text={KIOSK.rechnungsfrage.text(euro(einst.barverkauf_rechnung_ab_cent || 40000))} breit testid="kassa-rechnungsfrage">
        {!werte.ja ? (
          <div className="bo-ka-stapel">
            <button type="button" className="bo-ka-primaer" data-autofokus onClick={() => {
              dispatch({ typ: "rechnungsantwort", antwort: { art: "privat" } });
              zu();
              weiterZurZahlung();
            }} data-testid="kassa-privatkauf">{KIOSK.rechnungsfrage.nein}</button>
            <button type="button" className="bo-ka-zweit bo-ka-zweit--voll" onClick={() => set("ja", true)} data-testid="kassa-firma">{KIOSK.rechnungsfrage.ja}</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2" data-scan="nein">
            {[["name", KIOSK.rechnungsfrage.firma], ["strasse", KIOSK.rechnungsfrage.strasse], ["plz", KIOSK.rechnungsfrage.plz], ["ort", KIOSK.rechnungsfrage.ort], ["uid", KIOSK.rechnungsfrage.uid], ["email", KIOSK.rechnungsfrage.email]].map(([k, l]) => (
              <label key={k} className="block">
                <span className="bo-ka-label">{l}</span>
                <input className="bo-ka-eingabe" data-scan="nein" value={e[k] || ""} onChange={(x) => set("empfaenger", { ...e, [k]: x.target.value })} />
              </label>
            ))}
            {!faehig.kunde_anlegen?.an && <p className="bo-ka-hinweis" data-ton="warnung">{faehig.kunde_anlegen?.ersatz}</p>}
            <div className="bo-ka-reihe">
              <button type="button" className="bo-ka-zweit" onClick={() => set("ja", false)}>{KIOSK.abbrechen}</button>
              <button type="button" className="bo-ka-primaer" disabled={!ok || !faehig.kunde_anlegen?.an} onClick={() => {
                dispatch({ typ: "rechnungsantwort", antwort: { art: "firma", empfaenger: { name: e.name.trim(), firma: e.name.trim(), strasse: e.strasse.trim(), plz: (e.plz || "").trim(), ort: e.ort.trim(), uid: (e.uid || "").trim(), email: (e.email || "").trim(), ist_unternehmer: true } } });
                zu();
                weiterZurZahlung();
              }}>{KIOSK.rechnungsfrage.weiter}</button>
            </div>
          </div>
        )}
      </Sheet>
    );
  }

  if (dialog.art === "zeile") {
    const p = bon.positionen.find((x) => x.id === dialog.id);
    if (!p) return null;
    const rabatt = werte.rabatt ?? (p.rabatt_promille ? p.rabatt_promille / 10 : 0);
    const grund = werte.grund ?? p.rabatt_grund ?? "";
    const listen = p.listenpreis_cent || p.einzel_brutto_cent;
    return (
      <Sheet offen onSchliessen={zu} titel={p.bezeichnung} breit testid="kassa-zeilenblatt">
        <div className="bo-ka-feld">
          <span className="bo-ka-feld__label">{KIOSK.korb.menge("")}</span>
          <span className="bo-ka-stepper" style={{ height: 48 }}>
            <button type="button" style={{ width: 48, height: 48 }} aria-label={KIOSK.korb.weniger} onClick={() => dispatch({ typ: "menge", id: p.id, delta: -1 })}>−</button>
            <span className="bo-ka-num" style={{ minWidth: 40, fontSize: 20 }}>{p.menge}</span>
            <button type="button" style={{ width: 48, height: 48 }} aria-label={KIOSK.korb.mehr} onClick={() => dispatch({ typ: "menge", id: p.id, delta: 1 })}>+</button>
          </span>
        </div>
        {p.art === "Artikel" && (
          <>
            <p className="bo-ka-label" style={{ marginTop: 8 }}>Rabatt · Leitung (ab {(einst.rabatt_freigabe_ab_promille || 100) / 10} %)</p>
            {!faehig.rabattfelder?.an ? (
              <p className="bo-ka-hinweis" data-ton="warnung">{faehig.rabattfelder?.grund}</p>
            ) : (
              <>
                <div className="bo-ka-chips" role="radiogroup" aria-label="Rabatt">
                  {[0, 5, 10, 15, 20].map((r) => (
                    <button key={r} type="button" role="radio" aria-checked={rabatt === r} className="bo-ka-chip" onClick={() => set("rabatt", r)}>
                      {r ? `${r} %` : "Kein"}
                    </button>
                  ))}
                </div>
                {rabatt > 0 && (
                  <div className="bo-ka-chips" role="radiogroup" aria-label="Grund">
                    {["Ausstellungsstück", "Kleiner Mangel", "Kundenkarte", "Mengenrabatt"].map((g) => (
                      <button key={g} type="button" role="radio" aria-checked={grund === g} className="bo-ka-chip" onClick={() => set("grund", g)}>
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
        <div className="bo-ka-reihe" style={{ marginTop: 8 }}>
          <button type="button" className="bo-ka-zweit bo-ka-zweit--gefahr" onClick={() => {
            dispatch({ typ: "entfernen", id: p.id });
            zu();
          }}>{KIOSK.korb.entfernen}</button>
          <button type="button" className="bo-ka-primaer" disabled={rabatt > 0 && !grund} onClick={() => {
            if (rabatt > 0) dispatch({ typ: "zeile", id: p.id, werte: { listenpreis_cent: listen, rabatt_promille: rabatt * 10, rabatt_grund: grund, einzel_brutto_cent: listen - Math.round((listen * rabatt) / 100) } });
            else if (p.listenpreis_cent) dispatch({ typ: "zeile", id: p.id, werte: { einzel_brutto_cent: p.listenpreis_cent, listenpreis_cent: undefined, rabatt_promille: undefined, rabatt_grund: undefined } });
            zu();
          }}>{KIOSK.freitext.uebernehmen}</button>
        </div>
      </Sheet>
    );
  }
  return null;
}
