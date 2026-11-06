"use client";
// Stand 04.11.2026 (B-FAK).
// Aktions-Host des Bereichs Faktura: ein Ort für alle Dialoge, Sheets und verzögerten Commits. Listen, Zu tun und
// Akten rufen `ausfuehren(id, ziel)` – so ist jede Aktion genau einmal implementiert (§ 2.1 „jede Aktion 1× sichtbar
// + 1× im ⋯“). Umkehrbares läuft als verzögerter Commit 8 s mit Rückgängig (E3), Geldwirksames über Dialoge (§ 2.3).

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useVerzoegerterCommit, useCommitEreignis } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useToast } from "../Toast";
import { Dialog } from "../Overlay";
import Knopf from "../Knopf";
import { cent } from "@/lib/backoffice/format";
import { BANK, ER, ANGEBOT, MAHNEN, AKTION } from "@/lib/backoffice/faktura/texte";
import { bankZuordnenPlanen, bankWiederOeffnenAction, bankSicherZuordnenAction, erFreigebenPlanen, angebotAblehnenPlanen, mahnungErledigtPlanen, mahnsperrePlanen, zahllaufVormerkenPlanen, exportStatusAction, auftragAktionAction, mahnungStatusAction, neueVersionAction, anzahlungenAbziehenAction, uneinbringlichAction } from "@/lib/backoffice/faktura/actions";
import { StellenDialog, ZahlungDialog, SendenDialog, GutschriftDialog, ErstattenDialog, KorrigierenDialog, MahnenSheet } from "./DialogeBeleg";
import { IgnorierenDialog, ZuordnenDialog, ErAktionDialog, AnnehmenDialog, AnzahlungDialog, RuecktrittDialog } from "./DialogeVorgang";
import { Feld } from "./teile";
import { useVorgang } from "./hilfen";

const Kontext = createContext(null);

export function useFaktura() {
  return useContext(Kontext) || { ausfuehren: () => {}, versteckt: new Set(), rolle: {}, schalter: {} };
}

/**
 * @param {{rolle:object, schalter:object, mahnvorschlag?:object[], offeneBelege?:object[], children:any}} p
 */
export default function FakturaAktionen({ rolle = {}, schalter = {}, mahnvorschlag = [], offeneBelege = [], auftragRechnungen = [], children }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [offen, setOffen] = useState(null); // { id, ziel }
  const [versteckt, setVersteckt] = useState(() => new Set());
  const [grund, setGrund] = useState("");
  const v = useVorgang();

  useCommitEreignis((e) => {
    if (e?.art === "fertig" || e?.art === "fehler") router.refresh();
  });

  const verstecke = useCallback((name, an = true) => setVersteckt((s) => {
    const n = new Set(s);
    if (an) n.add(name);
    else n.delete(name);
    return n;
  }), []);

  /** Verzögerter Commit: planen → Zeile optimistisch ausblenden → Undo-Toast 8 s. */
  const commit = useCallback(async (planen, args, { text, name, gruppe, sammel, ausblenden = true }) => {
    const r = await planen(args);
    if (!r.ok) {
      zeige(r.code === "conflict" ? `${r.message}` : r.message, { art: r.code === "conflict" ? "warnung" : "fehler", aktion: r.beleg ? { titel: "Ansehen", onClick: () => router.push(`/faktura/rechnungen/${encodeURIComponent(r.beleg)}`) } : undefined });
      if (r.code === "conflict" && ausblenden) verstecke(name);
      return false;
    }
    if (ausblenden) verstecke(name);
    starte(text, { token: r.token, ms: r.ms, objekt: r.objekt, gruppe, sammel, fehlerText: text, onVerworfen: () => verstecke(name, false), onFehler: () => verstecke(name, false) });
    return true;
  }, [starte, zeige, verstecke, router]);

  const ausfuehren = useCallback(async (id, ziel = {}) => {
    const d = ziel.daten || {};
    switch (id) {
      // --- Bank (verzögerter Commit, F-33)
      case "zuordnen": {
        const v0 = d.vorschlag;
        if (!v0) return setOffen({ id: "zuordnen-dialog", ziel });
        return commit(bankZuordnenPlanen, { umsatz: ziel.name, belegDoctype: v0.doctype, beleg: v0.beleg, betragCent: Math.min(d.rest_cent, d.beleg?.offen_cent ?? d.rest_cent) }, { text: BANK.zugeordnet(v0.beleg, cent(Math.min(d.rest_cent, d.beleg?.offen_cent ?? d.rest_cent))), name: ziel.name, gruppe: "faktura.bank", sammel: (n) => `${n} Zuordnungen` });
      }
      case "zuordnen-mit": // aus dem Dialog: { beleg, betrag }
        return commit(bankZuordnenPlanen, { umsatz: ziel.name, belegDoctype: ziel.beleg.doctype, beleg: ziel.beleg.name, betragCent: ziel.betrag }, { text: BANK.zugeordnet(ziel.beleg.name, cent(ziel.betrag)), name: ziel.name, gruppe: "faktura.bank" });
      case "pruefen":
        return setOffen({ id: "zuordnen-dialog", ziel });
      case "ignorieren":
        return setOffen({ id: "ignorieren", ziel });
      case "wieder": {
        const r = await bankWiederOeffnenAction({ umsatz: ziel.name });
        zeige(r.ok ? BANK.geoeffnet : r.message, { art: r.ok ? "ok" : "fehler" });
        return router.refresh();
      }
      case "sicher-zuordnen":
        return setOffen({ id: "sicher-zuordnen", ziel });
      // --- Rechnung
      case "stellen":
      case "gs-stellen":
        return setOffen({ id: "stellen", ziel: { ...ziel, doctype: id === "gs-stellen" ? "PH Gutschrift" : ziel.doctype || "PH Rechnung" } });
      case "zahlung":
        return setOffen({ id: "zahlung", ziel });
      case "senden":
      case "nachfassen":
        return setOffen({ id: "senden", ziel });
      case "mahnen":
        return setOffen({ id: "mahnen", ziel });
      case "mahnen-alle":
        return setOffen({ id: "mahnen", ziel: {} });
      case "gutschrift":
        return setOffen({ id: "gutschrift", ziel });
      case "erstatten":
        return setOffen({ id: "erstatten", ziel });
      case "korrigieren":
        return setOffen({ id: "korrigieren", ziel });
      case "mahnsperre":
        setGrund("");
        return setOffen({ id: "mahnsperre", ziel });
      // --- Mahnung
      case "ma-erledigt":
        return commit(mahnungErledigtPlanen, { name: ziel.name }, { text: `${ziel.name} erledigt`, name: ziel.name, ausblenden: false });
      case "ma-senden": {
        if (d.kanal === "Post") {
          const r = await mahnungStatusAction({ name: ziel.name, aktion: "senden" });
          zeige(r.ok ? `${ziel.name} als per Post gesendet vermerkt` : r.message, { art: r.ok ? "ok" : "fehler" });
          return router.refresh();
        }
        return setOffen({ id: "senden", ziel: { ...ziel, doctype: "PH Mahnung" } });
      }
      // --- Eingangsrechnung
      case "er-freigeben":
        return commit(erFreigebenPlanen, { name: ziel.name }, { text: ER.freigegeben(ziel.name), name: ziel.name, gruppe: "faktura.er", sammel: (n) => `${n} Eingangsrechnungen freigegeben` });
      case "er-pruefen":
        return setOffen({ id: "er-aktion", ziel, aktion: "pruefen" });
      case "er-ablehnen":
        return setOffen({ id: "er-aktion", ziel, aktion: "ablehnen" });
      case "er-bezahlt":
        return setOffen({ id: "er-aktion", ziel, aktion: "als_bezahlt_buchen" });
      case "zahllauf":
        return commit(zahllaufVormerkenPlanen, { namen: ziel.namen || [ziel.name], wert: true }, { text: ER.vorgemerkt((ziel.namen || [ziel.name]).length), name: "__zahllauf", ausblenden: false });
      // --- Angebot
      case "annehmen":
        return setOffen({ id: "annehmen", ziel });
      case "ablehnen":
        setGrund("Preis");
        return setOffen({ id: "ablehnen", ziel });
      case "uebernehmen":
        return router.push(`/faktura/angebote/${encodeURIComponent(ziel.name)}?aktion=uebernehmen`);
      // --- Auftrag
      case "anzahlung":
        return setOffen({ id: "anzahlung", ziel });
      case "herstellerbestellungen":
      case "lieferung": {
        const r = await auftragAktionAction({ name: ziel.name, aktion: id === "lieferung" ? "lieferung_melden" : "herstellerbestellungen_erzeugen", vollstaendig: true });
        zeige(r.ok ? (id === "lieferung" ? "Lieferung gemeldet" : "Herstellerbestellungen erzeugt") : r.message, { art: r.ok ? "ok" : "fehler" });
        return router.refresh();
      }
      case "teilrechnung":
      case "schlussrechnung":
        return router.push(`/faktura/auftraege/${encodeURIComponent(ziel.name)}/abrechnen?art=${id === "teilrechnung" ? "teil" : "schluss"}`);
      case "ruecktritt":
        return setOffen({ id: "ruecktritt", ziel });
      case "storno-auftrag":
        return setOffen({ id: "storno-auftrag", ziel });
      // --- Export
      case "ex-erzeugen":
      case "ex-uebergeben":
      case "ex-verwerfen":
      case "ex-bestaetigt": {
        const aktion = { "ex-erzeugen": "erzeugen", "ex-uebergeben": "als_uebergeben", "ex-bestaetigt": "bestaetigen", "ex-verwerfen": "verwerfen" }[id];
        const r = await exportStatusAction({ name: ziel.name, aktion });
        zeige(r.ok ? `${ziel.name} aktualisiert` : r.message, { art: r.ok ? "ok" : "fehler" });
        return router.refresh();
      }
      case "neue-version": {
        const r = await neueVersionAction({ name: ziel.name });
        if (!r.ok) return zeige(r.message, { art: "fehler" });
        zeige(ANGEBOT.neueVersion(r.name), { art: "ok" });
        return router.push(`/faktura/angebote/${encodeURIComponent(r.name)}?tab=positionen`);
      }
      case "anzahlungen-abziehen": {
        const r = await anzahlungenAbziehenAction({ name: ziel.name });
        zeige(r.ok ? (r.blockiert?.length ? `${r.blockiert.length} Anzahlung noch nicht vollständig bezahlt – nur Vereinnahmtes abgezogen` : "Anzahlungen abgezogen") : r.message, { art: r.ok ? (r.blockiert?.length ? "warnung" : "ok") : "fehler" });
        return router.refresh();
      }
      case "uneinbringlich":
        setGrund("");
        return setOffen({ id: "uneinbringlich", ziel });
      default:
        if (ziel.href) return router.push(ziel.href);
        if (ziel.aktionHref) return router.push(ziel.aktionHref);
        return undefined;
    }
  }, [commit, router, zeige]);

  const wert = useMemo(() => ({ ausfuehren, versteckt, rolle, schalter, verstecke }), [ausfuehren, versteckt, rolle, schalter, verstecke]);
  const zu = () => setOffen(null);
  const o = offen || {};

  return (
    <Kontext.Provider value={wert}>
      {children}
      <StellenDialog offen={o.id === "stellen"} onSchliessen={zu} ziel={o.ziel} rolle={rolle} schalter={schalter} />
      <ZahlungDialog offen={o.id === "zahlung"} onSchliessen={zu} ziel={o.ziel} rolle={rolle} schalter={schalter} />
      <SendenDialog offen={o.id === "senden"} onSchliessen={zu} ziel={o.ziel} schalter={schalter} />
      {o.id === "gutschrift" && <GutschriftDialog offen onSchliessen={zu} ziel={o.ziel} />}
      {o.id === "erstatten" && <ErstattenDialog offen onSchliessen={zu} ziel={o.ziel} />}
      {o.id === "korrigieren" && <KorrigierenDialog offen onSchliessen={zu} ziel={o.ziel} />}
      <MahnenSheet offen={o.id === "mahnen"} onSchliessen={zu} vorschlag={mahnvorschlag} nur={o.ziel?.name} />
      {o.id === "ignorieren" && <IgnorierenDialog offen onSchliessen={zu} ziel={o.ziel} />}
      {o.id === "zuordnen-dialog" && <ZuordnenDialog offen onSchliessen={zu} ziel={o.ziel} offeneBelege={offeneBelege} onZuordnen={({ beleg, betrag }) => ausfuehren("zuordnen-mit", { ...o.ziel, beleg, betrag })} />}
      {o.id === "er-aktion" && <ErAktionDialog offen onSchliessen={zu} ziel={o.ziel} aktion={o.aktion} />}
      {o.id === "annehmen" && <AnnehmenDialog offen onSchliessen={zu} ziel={o.ziel} />}
      {o.id === "anzahlung" && (
        <AnzahlungDialog
          offen
          onSchliessen={zu}
          ziel={o.ziel}
          onWeiter={(rechnung, nurEntwurf) => {
            if (nurEntwurf) {
              zeige(`Anzahlungsrechnung ${rechnung} als Entwurf angelegt`, { art: "ok", aktion: { titel: "Öffnen", onClick: () => router.push(`/faktura/rechnungen/${encodeURIComponent(rechnung)}`) } });
              router.refresh();
              return zu();
            }
            const z = (o.ziel?.daten?.zeilen || []).find((x) => x.art === "Anzahlung") || {};
            setOffen({ id: "stellen", ziel: { doctype: "PH Rechnung", name: rechnung, daten: { ...o.ziel.daten, art: "Anzahlungsrechnung", auftrag: o.ziel.name, brutto_cent: z.betrag_cent, zahlbar_cent: z.betrag_cent, anzahlung_prozent: z.prozent, email: o.ziel.daten?.email || "", adresse: o.ziel.daten?.kunde } } });
          }}
        />
      )}
      {(o.id === "ruecktritt" || o.id === "storno-auftrag") && <RuecktrittDialog offen onSchliessen={zu} ziel={o.ziel} storno={o.id === "storno-auftrag"} rechnungen={auftragRechnungen} />}

      {/* Rückfrage „Sichere zuordnen (n)“ (§ 2.3): danach sofort, Korrektur über „Zuordnung lösen“ */}
      <Dialog
        offen={o.id === "sicher-zuordnen"}
        onSchliessen={zu}
        groesse="sm"
        art="bestaetigen"
        titel={BANK.sammelFrage(o.ziel?.namen?.length || 0, cent(o.ziel?.summe || 0))}
        sperren={v.laeuft}
        fuss={
          <>
            <Knopf variant="secondary" onClick={zu}>{AKTION.abbrechen}</Knopf>
            <Knopf variant="primary" laedt={v.zeigen} onClick={() => v.start(async () => {
              const r = await bankSicherZuordnenAction({ umsaetze: o.ziel.namen });
              zeige(`${r.zugeordnet || 0} Umsätze zugeordnet${r.fehler?.length ? ` · ${r.fehler.length} übersprungen` : ""}`, { art: r.ok ? "ok" : "fehler" });
              router.refresh();
              zu();
            })} data-testid="sicher-bestaetigen">{AKTION.zuordnen}</Knopf>
          </>
        }
      >
        <ul className="max-h-48 overflow-auto text-left text-[13px] text-bo-text-soft">{(o.ziel?.zeilen || []).map((z) => <li key={z.name}>{z.zellen?.vorschlag} · {z.zellen?.betrag}</li>)}</ul>
      </Dialog>

      {/* Angebot ablehnen: Grund vor dem Undo-Toast (§ 2.3) */}
      <Dialog offen={o.id === "ablehnen"} onSchliessen={zu} groesse="sm" titel={`${o.ziel?.name || ""} ablehnen`} fuss={<><Knopf variant="secondary" onClick={zu}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={async () => { zu(); await commit(angebotAblehnenPlanen, { name: o.ziel.name, grund }, { text: ANGEBOT.abgelehnt(o.ziel.name), name: o.ziel.name, ausblenden: false }); }}>{AKTION.ablehnen}</Knopf></>}>
        <Feld label="Grund">
          <div className="flex flex-col gap-1">{ANGEBOT.ablehnGruende.map((g) => <label key={g} className="flex items-center gap-2.5 rounded-bo-zeile px-3 py-2 text-[14px] hover:bg-bo-fill"><input type="radio" name="ablehnen" checked={grund === g} onChange={() => setGrund(g)} /> {g === "Keine Rueckmeldung" ? "Keine Rückmeldung" : g}</label>)}</div>
        </Feld>
      </Dialog>

      {/* Uneinbringlich (Leitung, Schalter): Rückfrage mit Grund, rot (§ 4.1) */}
      <Dialog offen={o.id === "uneinbringlich"} onSchliessen={zu} groesse="sm" titel={`${o.ziel?.name || ""} als uneinbringlich buchen?`} text={o.ziel?.daten?.offen_cent ? `Offen ${cent(o.ziel.daten.offen_cent)}` : undefined} fuss={<><Knopf variant="secondary" onClick={zu} autoFocus>{AKTION.abbrechen}</Knopf><Knopf variant="danger-solid" disabled={!grund.trim()} onClick={async () => { const r = await uneinbringlichAction({ rechnung: o.ziel.name, grund }); zeige(r.ok ? `${o.ziel.name} als uneinbringlich gebucht` : r.message, { art: r.ok ? "ok" : "fehler" }); zu(); router.refresh(); }}>Buchen</Knopf></>}>
        <Feld label="Grund" id="un-grund"><input id="un-grund" className="bo-fk-feld" value={grund} onChange={(e) => setGrund(e.target.value)} /></Feld>
      </Dialog>

      {/* Mahnsperre: Grund im Popover Pflicht, verzögerter Commit */}
      <Dialog offen={o.id === "mahnsperre"} onSchliessen={zu} groesse="sm" titel={o.ziel?.daten?.mahnsperre ? `Mahnsperre für ${o.ziel?.name} aufheben?` : `Mahnsperre für ${o.ziel?.name || ""}`} fuss={<><Knopf variant="secondary" onClick={zu}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" disabled={!o.ziel?.daten?.mahnsperre && !grund.trim()} onClick={async () => { const an = !o.ziel?.daten?.mahnsperre; zu(); await commit(mahnsperrePlanen, { name: o.ziel.name, wert: an, grund }, { text: an ? MAHNEN.sperreGesetzt(o.ziel.name) : MAHNEN.sperreAufgehoben(o.ziel.name), name: o.ziel.name, ausblenden: false }); }}>{o.ziel?.daten?.mahnsperre ? "Aufheben" : "Sperren"}</Knopf></>}>
        {!o.ziel?.daten?.mahnsperre && <Feld label={MAHNEN.sperreGrund} id="ms-grund"><input id="ms-grund" className="bo-fk-feld" value={grund} onChange={(e) => setGrund(e.target.value)} /></Feld>}
      </Dialog>
    </Kontext.Provider>
  );
}
