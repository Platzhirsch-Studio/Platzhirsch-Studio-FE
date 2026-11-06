"use client";
// Anträge (Konzept §3.2/§3.3): Liste mit Reitern ohne Kanban, Massenaktionen „Ablehnen …“ und „Als doppelt …“
// (kein Massen-Ausstellen); Antrag-Aktionen mit Dialog „Karte ausstellen“ (Kontaktlogik, berechneter Status,
// Ergebnis-Karte mit Nummer ohne Hochzählen).

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import Schalter from "../Schalter";
import { Icon } from "../icons";
import { Dialog, Menue, MenuePunkt } from "../Overlay";
import { useToast } from "../Toast";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import LeitungBitten from "../LeitungBitten";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import MiniKarte from "./MiniKarte";
import StufenKennzeichen from "./StufenKennzeichen";
import { AblehnenDialog, DoppeltDialog, Textfeld } from "./Dialoge";
import { antragAusstellenAction } from "@/lib/backoffice/kundenkarte/actions";
import { ANTRAG_STATUS, QUELLE, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { kartenstatusBeimAusstellen, mailFristText } from "@/lib/backoffice/kundenkarte/regeln";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import "../DataTable/datatable.css";
import "./kundenkarte.css";

function Hinweis({ h }) {
  if (!h) return <span className="text-bo-text-faint">–</span>;
  if (h.art === "karte")
    return (
      <Link href={`/kundenkarte/karten/${h.karte}`} className="text-[13px] font-medium text-bo-text underline decoration-bo-line-strong underline-offset-4">
        {T.antraege.karteBesteht(h.karte)}
      </Link>
    );
  return <span className="bo-kk-warn">{T.antraege.andererName(h.name)}</span>;
}

export function AntraegeListe({ zeilen = [], gesamt = 0, reiter, gesamtAlle = 0, darfSchreiben = false, params = {}, jetzt }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [dialog, setDialog] = useState(null);
  const offen = reiter !== "erledigt";
  const alle = zeilen.length > 0 && zeilen.every((z) => gewaehlt.has(z.name));
  const auswahl = zeilen.filter((z) => gewaehlt.has(z.name));
  const jetztD = useMemo(() => (jetzt ? new Date(jetzt) : new Date()), [jetzt]);

  if (!zeilen.length) {
    if (gesamtAlle === 0) return <Leer art="leer" titel={T.antraege.leerAlle} text="" icon="Inbox" testid="kk-antraege-leer" />;
    if (params.q || params.quelle) return <Leer art="gefiltert" titel={T.antraege.gefiltert} zuruecksetzenHref={`/kundenkarte/antraege${reiter !== "entscheiden" ? `?reiter=${reiter}` : ""}`} testid="kk-antraege-leer" />;
    return <Leer art="erledigt" titel={reiter === "entscheiden" ? T.antraege.leer : "Nichts in diesem Reiter."} text="" testid="kk-antraege-leer" />;
  }

  return (
    <div className="min-w-0">
      <div className="bo-dt" data-testid="kk-antraege-liste">
        <div className="bo-dt__kopf">
          <span className="bo-dt__zahl">{T.antraege.anzahl(zeilen.length, gesamt)}</span>
        </div>
        <div className="hidden md:block">
          <table className="bo-dt__tabelle">
            <caption className="bo-kk-sr">Anträge</caption>
            <thead>
              <tr>
                {darfSchreiben && offen && (
                  <th scope="col" className="w-10">
                    <input type="checkbox" aria-label="Alle auswählen" checked={alle} onChange={() => setGewaehlt(alle ? new Set() : new Set(zeilen.map((z) => z.name)))} />
                  </th>
                )}
                <th scope="col">{T.antraege.spalten.name}</th>
                <th scope="col">{T.antraege.spalten.quelle}</th>
                <th scope="col">{T.antraege.spalten.eingang}</th>
                <th scope="col">{T.antraege.spalten.status}</th>
                <th scope="col">{T.antraege.spalten.hinweis}</th>
                <th scope="col">
                  <span className="bo-kk-sr">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z) => (
                <tr key={z.name} data-gewaehlt={gewaehlt.has(z.name) ? "true" : undefined} data-testid={`kk-antrag-${z.name}`}>
                  {darfSchreiben && offen && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`${z.vorname} ${z.nachname} auswählen`}
                        checked={gewaehlt.has(z.name)}
                        onChange={() =>
                          setGewaehlt((g) => {
                            const n = new Set(g);
                            if (n.has(z.name)) n.delete(z.name);
                            else n.add(z.name);
                            return n;
                          })
                        }
                      />
                    </td>
                  )}
                  <td className="bo-dt__kopfzelle">
                    <Link href={`/kundenkarte/antraege/${z.name}`} className="bo-dt-objekt__titel bo-dt-objekt__link">
                      {z.vorname} {z.nachname}
                    </Link>
                    <span className="bo-kk-unter">
                      {[z.plz, z.ort].filter(Boolean).join(" ")}
                      {z.plz || z.ort ? " · " : ""}
                      <span className="bo-kk-mono font-normal">{z.name}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[14px]">{QUELLE[z.quelle] || z.quelle}</td>
                  <td className="whitespace-nowrap text-[14px] tabular-nums">
                    <time title={datumZeit(z.eingang)} suppressHydrationWarning>
                      {relativ(z.eingang, jetztD)}
                    </time>
                  </td>
                  <td>
                    <StatusBadge wert={z.status} text={statusLabel(ANTRAG_STATUS, z.status)} ton={statusTon(ANTRAG_STATUS, z.status)} groesse="xs" />
                    {reiter === "mail" && <span className="bo-kk-unter">{mailFristText(z, jetztD).replace("wartet auf Mail-Bestätigung · ", "")}</span>}
                    {reiter === "entscheiden" && z.wartetTage > 2 && <span className="bo-kk-warn mt-1">{T.antraege.wartetSeit(z.wartetTage)}</span>}
                    {reiter === "erledigt" && z.status === "Abgelehnt" && <span className="bo-kk-unter max-w-56 truncate">{String(z.entscheidung_grund || "").replace(/^\[([^\]]+)\].*/, "$1")}</span>}
                  </td>
                  <td>
                    <Hinweis h={z.hinweis} />
                  </td>
                  <td className="w-12 text-right">
                    <Menue label={`Aktionen ${z.name}`} platzierung="unten-ende" ausloeser={(p) => <Knopf {...p} variant="ghost" size="s" icon="Ellipsis" label={`Aktionen für ${z.vorname} ${z.nachname}`} />}>
                      <MenuePunkt icon="ArrowRight" href={`/kundenkarte/antraege/${z.name}`}>
                        Öffnen
                      </MenuePunkt>
                      {z.kontakt && (
                        <MenuePunkt icon="Contact" href={`/kunden/${encodeURIComponent(z.kontakt)}`}>
                          {T.akte.kundenakte}
                        </MenuePunkt>
                      )}
                      {darfSchreiben && offen && (
                        <>
                          <MenuePunkt icon="CreditCard" href={`/kundenkarte/antraege/${z.name}?ausstellen=1`}>
                            {T.ausstellen.titel}
                          </MenuePunkt>
                          <MenuePunkt icon="X" gefaehrlich onWaehlen={() => setDialog({ art: "ablehnen", antraege: [z.name] })}>
                            Ablehnen …
                          </MenuePunkt>
                          <MenuePunkt icon="Layers" onWaehlen={() => setDialog({ art: "doppelt", antraege: [z.name], karte: z.hinweis?.karte })} deaktiviert={z.hinweis?.art !== "karte"} grund="Keine vorhandene Karte erkannt.">
                            Als doppelt …
                          </MenuePunkt>
                        </>
                      )}
                    </Menue>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="bo-dt-karten md:hidden" data-testid="karten-liste">
          {zeilen.map((z) => (
            <li key={z.name} className="bo-dt-karte">
              <span className="min-w-0 flex-1">
                <Link href={`/kundenkarte/antraege/${z.name}`} className="block text-[15px] font-semibold">
                  {z.vorname} {z.nachname}
                </Link>
                <span className="bo-kk-unter">
                  {QUELLE[z.quelle]} · {relativ(z.eingang, jetztD)}
                </span>
                <span className="mt-1 inline-flex">
                  <StatusBadge wert={z.status} text={statusLabel(ANTRAG_STATUS, z.status)} ton={statusTon(ANTRAG_STATUS, z.status)} groesse="xs" />
                </span>
              </span>
              {darfSchreiben && reiter === "entscheiden" && (
                <Knopf size="s" href={`/kundenkarte/antraege/${z.name}?ausstellen=1`}>
                  {T.antraege.ausstellen}
                </Knopf>
              )}
            </li>
          ))}
        </ul>
      </div>
      {darfSchreiben && gewaehlt.size > 0 && (
        <div className="bo-dt-massen" role="region" aria-label={T.karten.auswahl(gewaehlt.size)} data-testid="kk-antraege-massen">
          <span className="text-[14px] font-semibold">{T.karten.auswahl(gewaehlt.size)}</span>
          <Knopf size="s" icon="X" onClick={() => setDialog({ art: "ablehnen", antraege: [...gewaehlt] })}>
            Ablehnen …
          </Knopf>
          <Knopf size="s" icon="Layers" disabled={!auswahl.some((z) => z.hinweis?.art === "karte")} onClick={() => setDialog({ art: "doppelt", antraege: auswahl.filter((z) => z.hinweis?.art === "karte").map((z) => z.name) })}>
            Als doppelt …
          </Knopf>
          <Knopf size="s" variant="ghost" icon="X" label="Auswahl aufheben" onClick={() => setGewaehlt(new Set())} />
        </div>
      )}
      {dialog?.art === "ablehnen" && (
        <AblehnenDialog
          antraege={dialog.antraege}
          onSchliessen={() => setDialog(null)}
          onFertig={(r) => {
            setDialog(null);
            setGewaehlt(new Set());
            zeige(`${r.erledigt} ${r.erledigt === 1 ? "Antrag" : "Anträge"} abgelehnt${r.uebersprungen ? ` · ${r.uebersprungen} übersprungen` : ""}`, { art: "ok" });
            router.refresh();
          }}
        />
      )}
      {dialog?.art === "doppelt" && (
        <DoppeltDialog
          antraege={dialog.antraege}
          karte={dialog.karte}
          onSchliessen={() => setDialog(null)}
          onFertig={(r) => {
            setDialog(null);
            setGewaehlt(new Set());
            zeige(`${r.erledigt} als doppelt markiert${r.uebersprungen ? ` · ${r.uebersprungen} übersprungen` : ""}`, { art: "ok" });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------- Ausstellen --

export function AusstellenDialog({ antrag, treffer, stufen = [], leitung = false, ohneMail = false, naechster, onSchliessen }) {
  const router = useRouter();
  const [kontakt, setKontakt] = useState(antrag.kontakt || treffer.vorauswahl || null);
  const [stufe, setStufe] = useState(antrag.startstufe || stufen[0]?.name || "");
  const [spaeter, setSpaeter] = useState(false);
  const [begruendung, setBegruendung] = useState("");
  const [fehler, setFehler] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const [laeuft, starte] = useTransition();
  const perMail = antrag.quelle === "website" && Boolean(antrag.bestaetigt_am);
  const status = kartenstatusBeimAusstellen({ quelle: antrag.quelle, sofortAktiv: !spaeter, perMailBestaetigt: perMail || ohneMail });
  const st = stufen.find((s) => s.name === stufe);
  const ausstellen = () =>
    starte(async () => {
      setFehler("");
      const r = await antragAusstellenAction({ antrag: antrag.name, kontakt: antrag.kontakt ? null : kontakt, stufe: leitung && stufe !== antrag.startstufe ? stufe : null, sofortAktiv: !spaeter, begruendung });
      if (!r?.ok) return setFehler(r?.message || T.fehler.allgemein);
      setErgebnis(r);
      router.refresh();
    });
  if (ergebnis) {
    return (
      <Dialog offen onSchliessen={onSchliessen} titel={ergebnis.doppelt ? T.doppelt.ergebnis : T.ausstellen.ergebnis(ergebnis.karte)} groesse="md" testid="kk-ausstellen-ergebnis">
        <div className="bo-kk-ergebnis">
          {!ergebnis.doppelt && <MiniKarte nr={ergebnis.karte} name={`${antrag.vorname} ${antrag.nachname}`} stufe={st?.stufenname || stufe} farbe={st?.farbe} gross drehbar={false} />}
          <ErgebnisKarte
            ohneKachel
            titel={ergebnis.doppelt ? T.ausstellen.doppelt(ergebnis.karte) : T.ausstellen.ergebnis(ergebnis.karte)}
            unter={ergebnis.doppelt ? undefined : ergebnis.status === "Beantragt" ? "Beantragt – aktiv bei Übergabe" : "Karte ist aktiv"}
            aktionen={ergebnis.doppelt ? [] : [{ titel: T.ausstellen.druck, href: `/kundenkarte/karten/${ergebnis.karte}?druck=1`, icon: "Printer" }, { titel: T.ausstellen.oeffnen, href: `/kundenkarte/karten/${ergebnis.karte}`, icon: "CreditCard" }]}
            weiter={naechster ? { titel: T.ausstellen.naechster, href: `/kundenkarte/antraege/${naechster}` } : { titel: "Zur Liste", href: "/kundenkarte/antraege" }}
          />
        </div>
      </Dialog>
    );
  }
  const keinKontakt = !antrag.kontakt && !kontakt;
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={ohneMail ? "Ohne Bestätigung ausstellen" : T.ausstellen.titel}
      text={`${antrag.vorname} ${antrag.nachname}`}
      groesse="md"
      sperren={laeuft}
      testid="kk-ausstellen"
      fuss={
        <>
          <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
          <Knopf variant="primary" laedt={laeuft} disabled={keinKontakt || (ohneMail && begruendung.trim().length < 5)} grund={keinKontakt ? T.ausstellen.waehlen : undefined} onClick={ausstellen} data-testid="kk-ausstellen-knopf">
            {T.ausstellen.knopf}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {!antrag.kontakt && (
          <fieldset>
            <legend className="bo-kk-label">{T.ausstellen.kontakt}</legend>
            <div className="flex flex-col gap-1.5" role="radiogroup">
              {treffer.treffer.map((t) => (
                <label key={t.name} className="bo-kk-haken py-2.5">
                  <input type="radio" name="kontakt" checked={kontakt === t.name} onChange={() => setKontakt(t.name)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{T.ausstellen.verknuepfen(`${t.titel}${t.plz || t.ort ? `, ${[t.plz, t.ort].filter(Boolean).join(" ")}` : ""}`)}</span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {t.zeichen.map((z) => (
                        <span key={z} className="bo-pille h-6 bg-bo-fill px-2 text-[12px] text-bo-text-soft">
                          {z}
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
              ))}
              <label className="bo-kk-haken py-2.5">
                <input type="radio" name="kontakt" checked={kontakt === "neu"} onChange={() => setKontakt("neu")} />
                {T.ausstellen.neu}
              </label>
            </div>
          </fieldset>
        )}
        <div>
          <p className="bo-kk-label">{T.ausstellen.stufe}</p>
          {leitung ? (
            <select className="bo-kk-feld" value={stufe} onChange={(e) => setStufe(e.target.value)} aria-label={T.ausstellen.stufe}>
              {stufen.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.stufenname}
                </option>
              ))}
            </select>
          ) : (
            <StufenKennzeichen stufe={st?.stufenname || stufe} farbe={st?.farbe} />
          )}
        </div>
        {antrag.quelle !== "website" && <Schalter label={T.ausstellen.spaeter} an={spaeter} onWechsel={setSpaeter} />}
        {ohneMail && <Textfeld label={T.ausstellen.begruendung} wert={begruendung} onWert={setBegruendung} pflicht mehrzeilig max={500} hilfe={T.ausstellen.begruendungHinweis} />}
        <p className="flex items-center gap-2 rounded-2xl bg-bo-surface-2 px-4 py-3 text-[14px]" aria-live="polite" data-testid="kk-live-satz">
          <Icon name="Info" className="size-4 text-bo-text-soft" />
          {T.ausstellen.satz(status, st?.stufenname || stufe)}
        </p>
        {fehler && (
          <p className="bo-kk-fehler" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Dialog>
  );
}

/** Aktionen der Antrag-Akte: Primär je Status (Strg/⌘+Enter), Menü Ablehnen/Doppelt, Leitung „Ohne Bestätigung …“. */
export function AntragAktionen({ antrag, treffer, stufen, leitung, darfSchreiben, darfBitten, karteDesKontakts, naechster, startAusstellen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const offen = ["Neu", "Bestaetigt"].includes(antrag.status);
  const wartetMail = antrag.status === "Neu" && Number(antrag.doi_noetig) === 1;
  const [dialog, setDialog] = useState(startAusstellen && offen && darfSchreiben && !wartetMail ? { art: "ausstellen" } : null);
  useKuerzel("akte", { "akte.primaer": () => (offen && darfSchreiben && !wartetMail ? setDialog({ art: "ausstellen" }) : false) });
  if (!offen || !darfSchreiben) return null;
  return (
    <div className="flex flex-wrap items-start justify-end gap-2">
      <Knopf variant="primary" icon="CreditCard" kuerzel="Strg+Enter" disabled={wartetMail} grund={wartetMail ? T.antrag.wartetMail : undefined} onClick={() => setDialog({ art: "ausstellen" })} data-testid="kk-antrag-primaer">
        {T.ausstellen.titel}
      </Knopf>
      {wartetMail && leitung && (
        <Knopf onClick={() => setDialog({ art: "ausstellen", ohneMail: true })} data-testid="kk-ohne-bestaetigung">
          {T.antrag.ohneBestaetigung}
        </Knopf>
      )}
      {wartetMail && !leitung && <LeitungBitten erlaubt={darfBitten} bereich="kundenkarte" bereichTitel="Kundenkarte" aktion="ohne-bestaetigung" aktionTitel="Ohne E-Mail-Bestätigung ausstellen" objekt={{ doctype: "PH Kundenkarte Antrag", name: antrag.name, titel: `${antrag.vorname} ${antrag.nachname}` }} />}
      <Menue label="Weitere Aktionen" platzierung="unten-ende" ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label="Weitere Aktionen" data-testid="kk-antrag-menue" />}>
        <MenuePunkt icon="X" gefaehrlich onWaehlen={() => setDialog({ art: "ablehnen" })}>
          Ablehnen …
        </MenuePunkt>
        <MenuePunkt icon="Layers" onWaehlen={() => setDialog({ art: "doppelt" })} deaktiviert={!karteDesKontakts} grund="Keine vorhandene Karte erkannt.">
          Als doppelt …
        </MenuePunkt>
      </Menue>
      {dialog?.art === "ausstellen" && <AusstellenDialog antrag={antrag} treffer={treffer} stufen={stufen} leitung={leitung} ohneMail={Boolean(dialog.ohneMail)} naechster={naechster} onSchliessen={() => setDialog(null)} />}
      {dialog?.art === "ablehnen" && <AblehnenDialog antraege={[antrag.name]} onSchliessen={() => setDialog(null)} onFertig={() => (setDialog(null), zeige(T.ablehnen.ergebnis, { art: "ok" }), router.refresh())} />}
      {dialog?.art === "doppelt" && <DoppeltDialog antraege={[antrag.name]} karte={karteDesKontakts} onSchliessen={() => setDialog(null)} onFertig={() => (setDialog(null), zeige(T.doppelt.ergebnis, { art: "ok" }), router.refresh())} />}
    </div>
  );
}
