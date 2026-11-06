"use client";
// Aktions-Zentrale des Shops: eine ID → genau ein Muster (§ 3.2). Undo (verzögerter Commit 8 s, Toast mit
// „Rückgängig“, gleichartige zusammengefasst), Geld/Bestätigung (Dialog), Feldwert (sofort), Link, Kassa.
// Liste, Kanban, Akte und Übersicht rufen dieselbe Funktion `ausfuehren(id, doc)` – gleiche Regeln überall.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Backoffice/Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import Bestaetigen from "@/components/Backoffice/Bestaetigen";
import { Dialog } from "@/components/Backoffice/Overlay";
import Knopf from "@/components/Backoffice/Knopf";
import DruckPanel from "@/components/Backoffice/Druck/DruckPanel";
import { cent } from "@/lib/backoffice/format";
import { abholfristVergleich, heute, plusTage } from "@/lib/backoffice/shop/fristen";
import { T } from "@/lib/backoffice/shop/texte";
import { vormerkenAction, aktionAction, massenVormerkenAction, massenAktionAction } from "@/lib/backoffice/shop/actions";
import { ZahlungErfassen, GutscheinEinloesen, Stornieren, ErstattenZahlung, Teilerstattung, ErsatzLiefern, SollIst, VersendetMini, GrundDialog, WiderrufErfassen, PruefungAbschliessen, WiderrufErstatten, DatumDialog, EinmalCode } from "./Dialoge";
import KassaHinweis from "./KassaHinweis";

const Kontext = createContext(null);

/** Hook: { ausfuehren(id, doc, extra?), massen(id, namen) } */
export function useShopAktionen() {
  const k = useContext(Kontext);
  if (!k) throw new Error("useShopAktionen braucht <ShopAktionen>");
  return k;
}

const UNDO = new Set(["packen", "abholbereit", "uebergeben", "abschliessen", "abschliessen-jetzt", "bestaetigung", "zahlungslink-senden", "zahlungslink-neu", "abholcode", "widerruf-bestaetigen", "retoure-anlegen", "ware-erhalten", "retoure-eingang", "pdf-senden", "gutschein-mail", "anzahlung-link", "zurueck-offen"]);
const SOFORT = new Set(["risiko-geprueft", "steuerfall-geklaert", "zustelldatum", "ereignis-erneut", "abgleichen", "schluessel-pruefen"]);
const STRIPE = (pi, test) => `https://dashboard.stripe.com/${test ? "test/" : ""}payments/${encodeURIComponent(pi || "")}`;

/**
 * @param {{darfKassa?:boolean, leitung?:boolean, gf?:boolean, pdf?:boolean, children:any}} p
 */
export default function ShopAktionen({ darfKassa = false, leitung = false, pdf = false, children }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [dialog, setDialog] = useState(null); // { art, doc, extra }
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const zu = useCallback(() => {
    setDialog(null);
    setFehler(null);
  }, []);
  const fertig = useCallback(() => {
    setDialog(null);
    setFehler(null);
    router.refresh();
  }, [router]);

  const undo = useCallback(async (id, doc, args) => {
    const aktion = id === "abschliessen-jetzt" ? "abschliessen" : id;
    const r = await vormerkenAction({ aktion, name: doc.name, args });
    if (!r.ok) {
      zeige(r.message, { art: r.code === "invalid" ? "warnung" : "fehler" });
      return false;
    }
    starte(r.text, {
      token: r.token, ms: r.ms, objekt: r.objekt, gruppe: `shop.${aktion}`,
      sammel: (n) => (aktion === "packen" ? T.toast.sammel(n, T.verben.packen) : aktion === "abholbereit" ? T.toast.sammel(n, T.verben.abholbereit) : aktion === "abschliessen" ? T.toast.sammel(n, T.verben.abschliessen) : `${n} Aktionen ausstehend`),
      fehlerText: `${r.text?.split(" ")[0] || "Aktion"} ${doc.name}`,
      onErfolg: () => router.refresh(), onVerworfen: () => router.refresh(), onFehler: () => router.refresh(),
    });
    router.refresh();
    return true;
  }, [router, starte, zeige]);

  const sofort = useCallback(async (id, doc, args = {}) => {
    setLaeuft(true);
    const r = await aktionAction({ aktion: id, name: doc?.name || "PH Stripe Einstellungen", doctype: doc?.doctype, args });
    setLaeuft(false);
    if (!r.ok) {
      setFehler(r.message);
      zeige(r.message, { art: "fehler" });
      return null;
    }
    const texte = { "risiko-geprueft": T.toast.risikoGeprueft, "steuerfall-geklaert": "Steuerfall geklärt – Packen frei", zustelldatum: "Zustelldatum übernommen", "ereignis-erneut": "Ereignis erneut verarbeitet", abgleichen: "Auszahlung abgeglichen", "schluessel-pruefen": "Schlüssel geprüft" };
    zeige(texte[id] || "Erledigt", { art: "ok" });
    router.refresh();
    return r.ergebnis;
  }, [router, zeige]);

  const ausfuehren = useCallback(async (id, doc, extra = {}) => {
    setFehler(null);
    if (id === "abholbereit" && doc.abholung_bis && doc.status === "reserviert") {
      // § 6.2: neue Frist kürzer als vereinbart → Bestätigung statt stillem Undo
      const neu = plusTage(heute(), doc.abholungFristTage || 7);
      if (abholfristVergleich(doc.abholung_bis, neu).art === "kuerzer" && !extra.bestaetigt) return setDialog({ art: "frist", doc, extra: { neu } });
    }
    if (UNDO.has(id)) return undo(id, doc, extra.args);
    if (SOFORT.has(id)) return sofort(id, doc, extra.args);
    switch (id) {
      case "direkt-uebergeben":
      case "versendet":
      case "zahlung-erfassen":
      case "gutschein-einloesen":
      case "stornieren":
      case "stornieren-ohne":
      case "erstatten":
      case "teilstorno":
      case "ersatz":
      case "geprueft":
      case "widerruf-erfassen":
      case "rechnung":
      case "uebergabe-zuruecknehmen":
      case "an-die-kassa":
      case "rueckerstatten":
      case "freigabe-ablehnen":
      case "ankuendigung-stornieren":
      case "als-bezahlt":
      case "auszahlung-zuordnen":
      case "gutschein-sperren":
      case "gutschein-entsperren":
      case "gutschein-ersetzen":
      case "einloesung-zuruecknehmen":
      case "gueltigkeit":
      case "anrechnen":
      case "kauf-erstatten":
      case "doppelte-erstatten":
      case "widerruf-erstatten":
      case "widerruf-ablehnen":
      case "widerruf-zuordnen":
      case "pruefung-abschliessen":
      case "retoure-erstatten":
      case "retoure-ablehnen":
      case "drucken":
        return setDialog({ art: id, doc, extra });
      case "freigeben":
        return sofort("freigeben", doc, {});
      case "stripe-oeffnen":
        if (doc.payment_intent) window.open(STRIPE(doc.payment_intent, doc.modus === "test" || Number(doc.livemode) === 0), "_blank", "noopener");
        return;
      case "email":
      case "kunde-informieren": {
        const betreff = id === "email" ? `Ihre Bestellung ${doc.name}` : `Ihre Reservierung ${doc.name} liegt bereit`;
        const text = id === "email" ? "" : `Guten Tag,\n\nIhre reservierte Ware liegt im Showroom für Sie bereit${doc.abholung_bis ? ` (bis ${doc.abholung_bis.split("-").reverse().join(".")})` : ""}. Bezahlt wird bei Abholung an der Kassa.\n\nFreundliche Grüße\nPlatzhirsch Home Living`;
        window.location.href = `mailto:${encodeURIComponent(doc.kunde_email || "")}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(text)}`;
        return;
      }
      case "kundenakte":
        if (doc.kontakt) router.push(`/d/ph-kontakt/${encodeURIComponent(doc.kontakt)}`);
        return;
      case "zahlung-oeffnen":
        if (doc.zahlung_ref) router.push(`/shop/zahlungen/${encodeURIComponent(doc.zahlung_ref)}`);
        return;
      case "retoure-oeffnen":
        if (doc.retoure) router.push(`/shop/retouren/${encodeURIComponent(doc.retoure)}`);
        return;
      case "reklamation":
        router.push(`/d/ph-servicefall/neu`);
        return;
      default:
        zeige(T.nichtVerfuegbar, { art: "info" });
    }
  }, [undo, sofort, router, zeige]);

  const massen = useCallback(async (id, namen) => {
    if (SOFORT.has(id)) {
      const r = await massenAktionAction({ aktion: id, namen });
      const ok = (r.ergebnisse || []).filter((e) => e.ok).length;
      zeige(`${ok} von ${namen.length} erledigt`, { art: ok === namen.length ? "ok" : "warnung" });
      router.refresh();
      return r;
    }
    const r = await massenVormerkenAction({ aktion: id, namen });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    for (const g of r.geplant) {
      starte(id === "packen" ? T.toast.gepackt(g.name) : id === "abholbereit" ? T.toast.abholbereit(g.name) : id === "abschliessen" ? T.toast.abgeschlossen(g.name) : `${g.name}`, {
        token: g.token, ms: g.ms, objekt: g.objekt, gruppe: `shop.${id}`,
        sammel: (n) => T.toast.sammel(n, T.verben[id] || "bearbeitet"),
        fehlerText: g.name, onErfolg: () => router.refresh(), onVerworfen: () => router.refresh(),
      });
    }
    if (r.skip.length) zeige(`${r.geplant.length} von ${r.geplant.length + r.skip.length} möglich – ${r.skip.length} übersprungen`, { art: "warnung", unter: r.skip.map((s) => `${s.name}: ${s.grund}`).join(" · ") });
    router.refresh();
    return r;
  }, [router, starte, zeige]);

  const wert = useMemo(() => ({ ausfuehren, massen, leitung, darfKassa }), [ausfuehren, massen, leitung, darfKassa]);
  const d = dialog?.doc;
  const weiterUndo = async (r) => {
    if (r?.undo) {
      const ok = await undo(r.undo, d, r.args);
      if (ok) zu();
    } else fertig();
  };

  return (
    <Kontext.Provider value={wert}>
      {children}
      {dialog?.art === "frist" && (
        <Bestaetigen offen titel="Abholfrist verkürzen?" text={`Frist verkürzt sich von ${d.abholung_bis.split("-").reverse().join(".")} auf ${dialog.extra.neu.split("-").reverse().join(".")} – Kunde erhält das neue Datum.`} bestaetigen="Trotzdem melden" onAbbrechen={zu} onBestaetigen={() => (zu(), ausfuehren("abholbereit", d, { bestaetigt: true }))} />
      )}
      {dialog?.art === "direkt-uebergeben" && (
        <Bestaetigen offen titel={`${d.name} direkt übergeben?`} text="Der Kunde steht da. Er erhält zusätzlich die Abholbereit-Mail." fakten={[{ label: "Kunde", wert: d.kunde_name }, { label: "Bezahlt", wert: cent(d.betrag_bezahlt_cent) }]} bestaetigen="Übergeben" onAbbrechen={zu} onBestaetigen={async () => { const ok = await undo("direkt-uebergeben", d, {}); if (ok) zu(); }} />
      )}
      {dialog?.art === "versendet" && <VersendetMini doc={d} onSchliessen={zu} onFertig={weiterUndo} />}
      {dialog?.art === "zahlung-erfassen" && <ZahlungErfassen doc={d} darfKassa={darfKassa} onSchliessen={zu} onFertig={fertig} />}
      {(dialog?.art === "gutschein-einloesen" || dialog?.art === "anrechnen") && <GutscheinEinloesen doc={dialog.art === "anrechnen" ? null : d} gutschein={dialog.art === "anrechnen" ? d : null} darfKassa={darfKassa} onSchliessen={zu} onFertig={fertig} />}
      {(dialog?.art === "stornieren" || dialog?.art === "stornieren-ohne") && <Stornieren doc={d} darfKassa={darfKassa} onSchliessen={zu} onFertig={fertig} />}
      {(dialog?.art === "erstatten" || dialog?.art === "teilstorno") && <Teilerstattung doc={d} teilstorno={dialog.art === "teilstorno"} onSchliessen={zu} onFertig={weiterUndo} />}
      {dialog?.art === "ersatz" && <ErsatzLiefern doc={d} onSchliessen={zu} onFertig={weiterUndo} />}
      {dialog?.art === "geprueft" && <SollIst doc={d} onSchliessen={zu} onFertig={fertig} />}
      {dialog?.art === "widerruf-erfassen" && <WiderrufErfassen doc={d} onSchliessen={zu} onFertig={weiterUndo} />}
      {dialog?.art === "rechnung" && (
        <Bestaetigen offen titel={`Rechnung zu ${d.name} erstellen?`} text="Die Rechnungsnummer wird vergeben. Leistungsdatum ist der Versand bzw. die Übergabe." fakten={[{ label: "Betrag", wert: cent(d.gesamt_cent) }]} bestaetigen="Rechnung erstellen" laeuft={laeuft} onAbbrechen={zu} onBestaetigen={async () => { if (await sofort("rechnung", d)) fertig(); }} />
      )}
      {dialog?.art === "uebergabe-zuruecknehmen" && <GrundDialog titel={`Übergabe ${d.name} zurücknehmen?`} text="Die Bestellung geht zurück auf „Abholbereit“." min={5} bestaetigen="Zurücknehmen" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("uebergabe-zuruecknehmen", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "an-die-kassa" && (
        <Dialog offen titel={T.kassa.satz} groesse="md" onSchliessen={zu} fuss={<div className="flex w-full justify-end"><Knopf variant="primary" onClick={zu}>Fertig</Knopf></div>}>
          <KassaHinweis darf={darfKassa} beleg={d.name} kunde={d.kontakt} variante={dialog.extra?.variante || "zahlung"} mitNummer />
          <p className="bo-shop-hinweis mt-3">Offen {cent(d.offen_cent)}. Nach der Zahlung an der Kassa steht die Bestellung hier als bezahlt.</p>
        </Dialog>
      )}
      {dialog?.art === "rueckerstatten" && <ErstattenZahlung zahlung={d} darfKassa={darfKassa} onSchliessen={zu} onFertig={fertig} />}
      {dialog?.art === "freigabe-ablehnen" && <GrundDialog titel={`Erstattung ${d.name} ablehnen?`} min={5} bestaetigen="Ablehnen" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("freigabe-ablehnen", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "ankuendigung-stornieren" && <GrundDialog titel={`Ankündigung ${d.name} stornieren?`} text="Die angekündigte Zahlung wird nicht gebucht." bestaetigen="Stornieren" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("ankuendigung-stornieren", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "als-bezahlt" && <Bestaetigen offen titel={`Zahlung über ${cent(d.betrag_cent)} buchen?`} text="Danach ist sie gesperrt; korrigiert wird nur per Erstattung." bestaetigen="Buchen" laeuft={laeuft} onAbbrechen={zu} onBestaetigen={async () => { if (await sofort("als-bezahlt", d)) fertig(); }} />}
      {dialog?.art === "auszahlung-zuordnen" && <GrundDialog titel={`Auszahlung zu ${d.name} zuordnen`} text="Kennung der Stripe-Auszahlung (po_…)." bestaetigen="Zuordnen" laeuft={laeuft} fehler={fehler} min={4} onSchliessen={zu} onGrund={async (g) => { if (await sofort("auszahlung-zuordnen", d, { auszahlung: g })) fertig(); }} />}
      {dialog?.art === "gutschein-sperren" && <GrundDialog titel={`Gutschein ····-${d.code_letzte4} sperren?`} text="Gesperrte Gutscheine lassen sich nirgends einlösen." chips={T.gruende.sperren} bestaetigen="Sperren" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g, chip) => { if (await sofort("gutschein-sperren", d, { grund: g, sperrgrund_art: chip || "Sonstiges" })) fertig(); }} />}
      {dialog?.art === "gutschein-entsperren" && <GrundDialog titel={`Gutschein ····-${d.code_letzte4} entsperren?`} bestaetigen="Entsperren" laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("gutschein-entsperren", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "gutschein-ersetzen" && !dialog.extra?.code && (
        <Bestaetigen offen titel={`Gutschein ····-${d.code_letzte4} ersetzen?`} text={`Er wird gesperrt und durch einen neuen Code über ${cent(d.rest_cent)} ersetzt.`} bestaetigen="Ersetzen" laeuft={laeuft} onAbbrechen={zu} onBestaetigen={async () => { const r = await sofort("gutschein-ersetzen", d); if (r) setDialog({ art: "gutschein-ersetzen", doc: d, extra: { code: r.code, gutschein: r.gutschein, betrag: r.rest_cent } }); }} />
      )}
      {dialog?.art === "gutschein-ersetzen" && dialog.extra?.code && <EinmalCode code={dialog.extra.code} betrag={dialog.extra.betrag} gutschein={dialog.extra.gutschein} onFertig={() => (setDialog(null), router.push(`/shop/gutscheine/${encodeURIComponent(dialog.extra.gutschein)}`))} />}
      {dialog?.art === "einloesung-zuruecknehmen" && <GrundDialog titel={`Einlösung ${dialog.extra.beleg} zurücknehmen?`} text={`${cent(dialog.extra.betrag_cent)} gehen zurück auf den Gutschein.`} min={5} bestaetigen="Zurücknehmen" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("einloesung-zuruecknehmen", d, { grund: g, beleg: dialog.extra.beleg, beleg_doctype: dialog.extra.beleg_doctype })) fertig(); }} />}
      {dialog?.art === "gueltigkeit" && <DatumDialog titel="Gültigkeit verlängern" wert={d.gueltig_bis} hinweis="Der Status „Abgelaufen“ bleibt bis zur Server-Erweiterung; Einlösung nach Freigabe der Leitung." laeuft={laeuft} fehler={fehler} onSchliessen={zu} onDatum={async (v) => { if (await sofort("gueltigkeit", d, { gueltig_bis: v })) fertig(); }} />}
      {dialog?.art === "kauf-erstatten" && <GrundDialog titel={`Gutscheinkauf ${d.name} erstatten?`} text={`Ungenutzte Gutscheine werden auf „Erstattet“ gesetzt; eingelöste Anteile sind nicht erstattbar – erstattbar höchstens ${cent(d.erstattbar_cent)}.`} chips={["Widerruf", "Kulanz"]} bestaetigen={`${cent(d.erstattbar_cent)} erstatten`} laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("kauf-erstatten", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "doppelte-erstatten" && <Bestaetigen offen titel={`${cent(d.doppelt_cent)} doppelt bezahlt erstatten?`} fakten={(d.doppelt || []).map((x) => ({ label: String(x.zeit || "").slice(0, 16).replace(" ", " · "), wert: cent(x.betrag_cent) }))} bestaetigen={`${cent(d.doppelt_cent)} erstatten`} laeuft={laeuft} onAbbrechen={zu} onBestaetigen={async () => { if (await sofort("doppelte-erstatten", d)) fertig(); }} />}
      {dialog?.art === "widerruf-erstatten" && <WiderrufErstatten widerruf={d} bestellung={dialog.extra.bestellung} nachweis={dialog.extra.nachweis} onSchliessen={zu} onFertig={fertig} />}
      {dialog?.art === "widerruf-ablehnen" && <GrundDialog titel={`Widerruf ${d.name} ablehnen?`} chips={T.gruende.ablehnenWiderruf} min={5} erlaubt={(c) => c !== "Frist überschritten" || !!dialog.extra?.fristErlaubt} bestaetigen="Ablehnen" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g, chip) => { if (await sofort("widerruf-ablehnen", d, { grund: g, grundArt: chip, fristErlaubt: !!dialog.extra?.fristErlaubt })) fertig(); }} />}
      {dialog?.art === "widerruf-zuordnen" && <GrundDialog titel={`Widerruf ${d.name} zuordnen`} text="Bestellnummer (PH-S-…)." min={8} bestaetigen="Zuordnen" laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("widerruf-zuordnen", d, { bestellung: g.trim() })) fertig(); }} />}
      {dialog?.art === "pruefung-abschliessen" && <PruefungAbschliessen retoure={d} leitung={leitung} onSchliessen={zu} onFertig={fertig} />}
      {dialog?.art === "retoure-erstatten" && <Bestaetigen offen titel={`${cent(d.erstattungsbetrag_cent)} zur Retoure ${d.name} erstatten?`} text="Weg wie bei der Bestellung: Karte zurück auf die Zahlungsart, Gutschein auf den Gutschein." bestaetigen={`${cent(d.erstattungsbetrag_cent)} erstatten`} laeuft={laeuft} onAbbrechen={zu} onBestaetigen={async () => { if (await sofort("retoure-erstatten", d)) fertig(); }} />}
      {dialog?.art === "retoure-ablehnen" && <GrundDialog titel={`Retoure ${d.name} ablehnen?`} min={5} bestaetigen="Ablehnen" gefaehrlich laeuft={laeuft} fehler={fehler} onSchliessen={zu} onGrund={async (g) => { if (await sofort("retoure-ablehnen", d, { grund: g })) fertig(); }} />}
      {dialog?.art === "drucken" && <DruckPanel offen onSchliessen={zu} doctype={d.doctype || "PH Bestellung"} name={d.name} titel={`${d.name}`} pdf={pdf} testdaten={d.modus === "test" || Number(d.test) === 1} />}
    </Kontext.Provider>
  );
}
