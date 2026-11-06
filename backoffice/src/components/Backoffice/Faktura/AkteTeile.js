"use client";
// Client-Teile der Faktura-Akten: Primäraktion + „⋯“-Menü (jede Aktion genau 1× sichtbar + 1× im Menü, gesperrte
// Einträge mit Grund und „Leitung bitten“, § 2.6), Aktion aus der URL (?aktion=…), Positionen-Editor im Entwurf
// (Autosave 1 s, „Gespeichert 14:02“, Q-D1), Schalter „Empfänger ist Unternehmer“, Präsentationsmodus.

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import LeitungBitten from "../LeitungBitten";
import BetragFeld from "../Eingabe/BetragFeld";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { cent } from "@/lib/backoffice/format";
import { belegSummen } from "@/lib/backoffice/faktura/betraege";
import { AKTION, AKTE, LEER, RECHT } from "@/lib/backoffice/faktura/texte";
import { belegSpeichernAction } from "@/lib/backoffice/faktura/actions";
import { UebernehmenDialog } from "./DialogeVorgang";
import { useFaktura } from "./Aktionen";

/**
 * @param {{ziel:object, primaer?:{id:string,titel:string,href?:string}|null, menue?:Array<{id:string,titel:string,icon?:string,href?:string,deaktiviert?:boolean,grund?:string,gefaehrlich?:boolean,trenner?:boolean}>,
 *   leitungBitten?:{aktion:string, aktionTitel:string}|null, rolle:object}} p
 */
export function AkteAktionen({ ziel, primaer, menue = [], leitungBitten = null, rolle = {} }) {
  const { ausfuehren } = useFaktura();
  const sp = useSearchParams();
  const gestartet = useRef(false);
  useKuerzel("akte", { "akte.primaer": () => (primaer ? ausfuehren(primaer.id, { ...ziel, href: primaer.href }) : false) });
  useKuerzel("akte@faktura", Object.fromEntries(menue.filter((m) => !m.deaktiviert && m.kuerzelId).map((m) => [m.kuerzelId, () => ausfuehren(m.id, ziel)])));
  // Einstieg aus Zu tun / Kanban: ?aktion=<id> öffnet die Aktion einmal.
  useEffect(() => {
    const a = sp.get("aktion");
    if (!a || gestartet.current) return;
    gestartet.current = true;
    const ok = [primaer, ...menue].some((m) => m && m.id === a && !m.deaktiviert);
    if (ok && a !== "uebernehmen") ausfuehren(a, ziel);
  }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="flex items-center gap-2">
      {primaer && (
        <Knopf variant="primary" href={primaer.href} onClick={primaer.href ? undefined : () => ausfuehren(primaer.id, ziel)} kuerzel="⌘↵" data-testid="akte-primaer">
          {primaer.titel}
        </Knopf>
      )}
      {(menue.length > 0 || leitungBitten) && (
        <Menue label={AKTION.aktionen || "Aktionen"} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label="Weitere Aktionen" data-testid="akte-menue" />}>
          {menue.map((m, i) =>
            m.trenner ? (
              <MenueTrenner key={`t${i}`} />
            ) : (
              <MenuePunkt key={m.id + i} icon={m.icon} href={m.deaktiviert ? undefined : m.href} onWaehlen={m.href || m.deaktiviert ? undefined : () => ausfuehren(m.id, ziel)} deaktiviert={m.deaktiviert} grund={m.grund} gefaehrlich={m.gefaehrlich} kuerzel={m.taste}>
                {m.titel}
              </MenuePunkt>
            )
          )}
          {leitungBitten && <LeitungBitten variante="menue" erlaubt={rolle.schreibt && !rolle.leitung} bereich="faktura" bereichTitel="Faktura" aktion={leitungBitten.aktion} aktionTitel={leitungBitten.aktionTitel} objekt={{ doctype: ziel.doctype, name: ziel.name }} />}
        </Menue>
      )}
    </span>
  );
}

/** Öffnet den Übernehmen-Dialog auf der Angebotsakte (eigener Zustand, da er das ganze Angebot braucht). */
export function UebernehmenStart({ angebot, bedingung, aktiv }) {
  const sp = useSearchParams();
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    if (sp.get("aktion") === "uebernehmen" && aktiv) setOffen(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [sp, aktiv]);
  if (!aktiv) return null;
  return (
    <>
      <Knopf variant="primary" onClick={() => setOffen(true)} kuerzel="⌘↵" data-testid="uebernehmen-start">
        {AKTION.alsAuftrag}
      </Knopf>
      {offen && <UebernehmenDialog offen onSchliessen={() => setOffen(false)} angebot={angebot} bedingung={bedingung} />}
    </>
  );
}

const EINHEITEN = ["Stk", "Std", "Pausch", "m", "m²", "lfm", "Set", "Tag"];
const SAETZE = [200, 130, 100, 0];

/** Positionen im Entwurf (Tabelle wie eine Tabellenkalkulation, Autosave 1 s, Live-Summe). */
export function PositionenEditor({ doctype, name, positionen: start = [], modified: modStart }) {
  const router = useRouter();
  const [zeilen, setZeilen] = useState(() => start.map((p, i) => ({ ...p, _k: `${i}-${p.pos}` })));
  const [status, setStatus] = useState({ art: "ruhe", text: "" });
  const mod = useRef(modStart);
  const timer = useRef(null);
  const summe = belegSummen(zeilen);

  function planeSpeichern(neu) {
    clearTimeout(timer.current);
    setStatus({ art: "wartet", text: "Ungespeichert" });
    timer.current = setTimeout(async () => {
      setStatus({ art: "laeuft", text: "Speichert …" });
      const r = await belegSpeichernAction({ doctype, name, werte: { positionen: neu.map(({ _k, ...p }) => p) }, modified: mod.current });
      if (r.ok) {
        mod.current = r.modified;
        setStatus({ art: "ok", text: `Gespeichert ${r.gespeichert}` });
        router.refresh();
      } else setStatus({ art: "fehler", text: r.code === "conflict" ? r.message : "Nicht gespeichert – neuer Versuch in 5 s" });
    }, 1000);
  }
  const aendere = (i, feld, wert) => {
    const neu = zeilen.map((z, j) => (j === i ? { ...z, [feld]: wert } : z));
    setZeilen(neu);
    planeSpeichern(neu);
  };
  const neueZeile = () => {
    const neu = [...zeilen, { _k: `n${Date.now()}`, art: "Produkt", bezeichnung: "", menge: 1, einheit: "Stk", einzel_netto_cent: 0, rabatt_promille: 0, ust_satz_promille: 200 }];
    setZeilen(neu);
  };
  const entferne = (i) => {
    const neu = zeilen.filter((_, j) => j !== i);
    setZeilen(neu);
    planeSpeichern(neu);
  };

  return (
    <div className="flex flex-col gap-3" data-testid="positionen-editor">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[13px] ${status.art === "fehler" ? "text-bo-ziegel-text" : "text-bo-text-soft"}`} aria-live="polite" data-testid="autosave">
          {status.text || "Änderungen werden automatisch gespeichert"}
        </span>
        <Knopf size="s" variant="secondary" icon="Plus" onClick={neueZeile} data-testid="position-hinzu">
          {AKTION.positionHinzu}
        </Knopf>
      </div>
      {zeilen.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-bo-text-soft">{LEER.positionen}</p>
      ) : (
        <div className="bo-scroll-x overflow-x-auto">
          <table className="bo-fk-pos min-w-[860px]">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Bezeichnung</th>
                <th className="w-24">Menge</th>
                <th className="w-28">Einheit</th>
                <th className="w-36">Einzelpreis netto</th>
                <th className="w-24">Rabatt %</th>
                <th className="w-24">USt</th>
                <th className="w-32 text-right">Netto</th>
                <th className="w-12">
                  <span className="sr-only">Entfernen</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z, i) => {
                const netto = Math.round((Number(z.menge) || 0) * (Number(z.einzel_netto_cent) || 0) * (1 - (Number(z.rabatt_promille) || 0) / 1000));
                return (
                  <tr key={z._k} data-alternativ={z.alternativ ? "" : undefined}>
                    <td className="tabular-nums text-bo-text-faint">{i + 1}</td>
                    <td>
                      <input className="bo-fk-feld" aria-label={`Bezeichnung Zeile ${i + 1}`} value={z.bezeichnung || ""} onChange={(e) => aendere(i, "bezeichnung", e.target.value)} aria-invalid={!String(z.bezeichnung || "").trim() || undefined} />
                    </td>
                    <td>
                      <input className="bo-fk-feld text-right tabular-nums" inputMode="decimal" aria-label={`Menge Zeile ${i + 1}`} value={String(z.menge ?? "").replace(".", ",")} onChange={(e) => aendere(i, "menge", Number(e.target.value.replace(",", ".")) || 0)} />
                    </td>
                    <td>
                      <select className="bo-fk-feld" aria-label={`Einheit Zeile ${i + 1}`} value={z.einheit || "Stk"} onChange={(e) => aendere(i, "einheit", e.target.value)}>
                        {EINHEITEN.map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <BetragFeld aria-label={`Einzelpreis Zeile ${i + 1}`} value={z.einzel_netto_cent} onChange={(c) => aendere(i, "einzel_netto_cent", c || 0)} />
                    </td>
                    <td>
                      <input className="bo-fk-feld text-right tabular-nums" inputMode="decimal" aria-label={`Rabatt Zeile ${i + 1}`} value={(Number(z.rabatt_promille) || 0) / 10 || ""} onChange={(e) => aendere(i, "rabatt_promille", Math.round((Number(e.target.value.replace(",", ".")) || 0) * 10))} />
                    </td>
                    <td>
                      <select className="bo-fk-feld" aria-label={`USt Zeile ${i + 1}`} value={z.ust_satz_promille ?? 200} onChange={(e) => aendere(i, "ust_satz_promille", Number(e.target.value))}>
                        {SAETZE.map((x) => (
                          <option key={x} value={x}>
                            {x / 10} %
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right tabular-nums font-medium">{z.alternativ ? AKTE.alternativ : cent(netto)}</td>
                    <td>
                      <Knopf size="s" variant="ghost" icon="Trash2" label={`Zeile ${i + 1} entfernen`} onClick={() => entferne(i)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-right text-[14px] tabular-nums text-bo-text-soft">
        Netto {cent(summe.netto_cent)} · USt {cent(summe.ust_cent)} · <span className="font-semibold text-bo-text">Brutto {cent(summe.brutto_cent)}</span>
      </p>
    </div>
  );
}

/** Schalter „Empfänger ist Unternehmer“ im Entwurf (P-07, sofort gespeichert). */
export function UnternehmerSchalter({ doctype, name, an, modified }) {
  const router = useRouter();
  const [wert, setWert] = useState(!!an);
  return (
    <Schalter
      label={AKTE.unternehmer}
      beschreibung="Bestimmt, ob die UID des Empfängers ab 10.000 € Pflicht ist."
      an={wert}
      onWechsel={async (x) => {
        setWert(x);
        const r = await belegSpeichernAction({ doctype, name, werte: { empfaenger_unternehmer: x ? 1 : 0 }, modified });
        if (r.ok) router.refresh();
        else setWert(!x);
      }}
      groesse="s"
    />
  );
}

/** Hinweis „Nur Faktura-Leitung“ für Mitarbeiter in der Akte (statt Link auf Seiten ohne Recht, § 2.6). */
export function NurLeitung({ text = RECHT.nurLeitung }) {
  return <span className="text-[12px] text-bo-text-faint">{text}</span>;
}
