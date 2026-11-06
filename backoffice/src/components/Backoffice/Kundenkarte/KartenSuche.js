"use client";
// KartenSuche (Konzept §2.3, §10): Such- und Scanfeld (data-scan="ja"). Navigation nur bei Enter;
// vollständige Nummer → erste Zeile „Karte KK-… öffnen ↵“. Unbekannt → Shake 240 ms + Satz bleibt stehen,
// bis neu getippt wird. Kamera-Scan (iPad) über den Fundament-Baustein KameraScan.

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../icons";
import { RundKnopf } from "../Knopf";
import KameraScan from "../Eingabe/KameraScan";
import { useScanFeld } from "../Eingabe/ScanTor";
import StufenKennzeichen from "./StufenKennzeichen";
import { karteSuchenAction } from "@/lib/backoffice/kundenkarte/actions";
import { istKartennummer, normalisiereKartennummer } from "@/lib/backoffice/kundenkarte/kartennummer";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export default function KartenSuche({ start = "", basis = "/kundenkarte/karten", params = {}, mitListe = true, autoFocus = false, onKarte, testid = "kk-suche" }) {
  const router = useRouter();
  const id = useId();
  const feld = useRef(null);
  const [q, setQ] = useState(start);
  const [treffer, setTreffer] = useState([]);
  const [aktiv, setAktiv] = useState(0);
  const [meldung, setMeldung] = useState("");
  const [wackelt, setWackelt] = useState(false);
  const [kamera, setKamera] = useState(false);
  const [, starte] = useTransition();
  const nummer = istKartennummer(q) ? normalisiereKartennummer(q) : null;

  const oeffne = (nr) => {
    if (onKarte) onKarte(nr);
    else router.push(`/kundenkarte/karten/${nr}`);
  };

  const pruefe = (wert) => {
    starte(async () => {
      const r = await karteSuchenAction({ q: wert });
      if (r?.href) {
        setMeldung("");
        oeffne(r.karte);
      } else if (r?.unbekannt) {
        setMeldung(T.karten.unbekannt(r.unbekannt));
        setWackelt(false);
        requestAnimationFrame(() => setWackelt(true));
      } else if (r?.treffer?.length === 1 && !onKarte && mitListe) {
        router.push(`/kundenkarte/karten/${r.treffer[0].name}`);
      } else if (mitListe && !onKarte) {
        const sp = new URLSearchParams({ ...params, q: wert });
        sp.delete("seite");
        router.push(`${basis}?${sp.toString()}`);
      } else if (r?.treffer?.length) {
        setTreffer(r.treffer);
      }
    });
  };

  useScanFeld(feld, (code) => {
    setQ(code);
    pruefe(code);
  });

  // Vorschläge beim Tippen (nur Anzeige – Navigation erst mit Enter)
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2 || nummer) return undefined;
    const h = setTimeout(async () => {
      const r = await karteSuchenAction({ q: t });
      setTreffer(r?.treffer || []);
      setAktiv(0);
    }, 220);
    return () => clearTimeout(h);
  }, [q, nummer]);

  const sichtbar = q.trim().length >= 2 && !nummer ? treffer : [];
  const zeilen = [...(nummer ? [{ art: "nummer", name: nummer }] : []), ...sichtbar.map((t) => ({ art: "karte", ...t }))];
  const offen = zeilen.length > 0 && q.trim().length > 0;

  const taste = (e) => {
    if (e.key === "ArrowDown" && offen) {
      e.preventDefault();
      setAktiv((a) => Math.min(zeilen.length - 1, a + 1));
    } else if (e.key === "ArrowUp" && offen) {
      e.preventDefault();
      setAktiv((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const z = zeilen[aktiv];
      if (z && z.art === "karte" && !nummer) oeffne(z.name);
      else pruefe(q.trim());
    } else if (e.key === "Escape") {
      setTreffer([]);
    }
  };

  return (
    <div className="bo-kk-scan" data-testid={testid}>
      <div className={`relative min-w-0 flex-1 ${wackelt ? "bo-kk-shake" : ""}`} onAnimationEnd={() => setWackelt(false)}>
        <Icon name="ScanBarcode" className="bo-kk-scan__lupe size-5" />
        <input
          ref={feld}
          id={id}
          className="bo-kk-scan__feld"
          type="search"
          data-scan="ja"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder={T.karten.suche}
          aria-label={T.karten.suche}
          aria-invalid={meldung ? "true" : undefined}
          aria-describedby={meldung ? `${id}-m` : undefined}
          aria-expanded={offen}
          aria-controls={offen ? `${id}-l` : undefined}
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={offen ? `${id}-o${aktiv}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMeldung("");
          }}
          onKeyDown={taste}
          data-testid={`${testid}-feld`}
        />
        {offen && (
          <ul id={`${id}-l`} role="listbox" className="bo-kk-scan__liste" aria-label="Treffer">
            {zeilen.map((z, i) => (
              <li key={`${z.art}-${z.name}`} id={`${id}-o${i}`} role="option" aria-selected={i === aktiv} className="bo-kk-scan__treffer cursor-pointer" onMouseDown={(e) => e.preventDefault()} onClick={() => (z.art === "nummer" ? pruefe(z.name) : oeffne(z.name))}>
                  {z.art === "nummer" ? (
                    <>
                      <Icon name="CreditCard" className="size-4 text-bo-text-soft" />
                      <span className="font-medium">{T.karten.oeffnenZeile(z.name)}</span>
                    </>
                  ) : (
                    <>
                      <span className="bo-kk-mono w-24 flex-none text-[13px]">{z.name}</span>
                      <span className="min-w-0 flex-1 truncate">{z.kunde_name}</span>
                      <StufenKennzeichen stufe={z.stufe} groesse="s" />
                    </>
                  )}
              </li>
            ))}
          </ul>
        )}
        {meldung && (
          <p id={`${id}-m`} className="bo-kk-scan__meldung" role="status" data-testid={`${testid}-meldung`}>
            {meldung}
          </p>
        )}
      </div>
      <RundKnopf icon="ScanLine" label={T.karten.kamera} onClick={() => setKamera(true)} testid={`${testid}-kamera`} />
      <KameraScan
        offen={kamera}
        onSchliessen={() => setKamera(false)}
        onScan={(code) => {
          setKamera(false);
          setQ(code);
          pruefe(code);
        }}
        titel="Kundenkarte scannen"
      />
    </div>
  );
}
