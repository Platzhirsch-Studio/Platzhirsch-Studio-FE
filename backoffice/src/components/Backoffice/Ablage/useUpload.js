"use client";
// Upload-Schlange der Ablage (Konzept §3.2): Vorprüfung gegen einstellungen_info, SHA-256 im Browser (streamend),
// upload_start → Teile über POST /ablage/hochladen (bzw. Direkt-PUT zur vorsignierten Speicher-URL) →
// upload_abschliessen. Fortschritt je Datei, Abbrechen, Erneut, Wiederholung bei Netzfehlern (1/2/4 s),
// Fortsetzen nach `conflict` am gemeldeten Offset. Höchstens zwei Dateien gleichzeitig.

import { useEffect, useRef, useState } from "react";
import { sha256Datei } from "@/lib/backoffice/ablage/sha256";
import { WIEDERHOLUNG_MS, uploadAnteil, uploadVorpruefung } from "@/lib/backoffice/ablage/regeln";
import { uploadAbschliessenAction, uploadStartAction } from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";

const MAX_TEIL = 4 * 1024 * 1024;
const GLEICHZEITIG = 2;
let laufendeNr = 0;

const warte = (ms, signal) =>
  new Promise((ok, nein) => {
    const t = setTimeout(ok, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      nein(new DOMException("Abgebrochen", "AbortError"));
    });
  });

/** XHR mit Fortschritt (fetch kennt keinen Upload-Fortschritt). → { status, json } */
function sende({ url, methode = "POST", body, header = {}, onFortschritt, signal }) {
  return new Promise((ok, nein) => {
    const x = new XMLHttpRequest();
    x.open(methode, url);
    for (const [k, v] of Object.entries(header || {})) x.setRequestHeader(k, v);
    x.upload.onprogress = (e) => e.lengthComputable && onFortschritt?.(e.loaded);
    x.onload = () => {
      let json = null;
      try {
        json = x.responseText ? JSON.parse(x.responseText) : null;
      } catch {
        json = null;
      }
      ok({ status: x.status, json });
    };
    x.onerror = () => ok({ status: 0, json: null });
    x.onabort = () => nein(new DOMException("Abgebrochen", "AbortError"));
    signal?.addEventListener("abort", () => x.abort());
    x.send(body);
  });
}

/** Eine Datei hochladen (Prüfsumme → Start → Teile/Direkt → Abschluss). Wirft bei Fehlern. */
async function ladeHoch(e, { setze, signal }) {
  // 1) Prüfsumme
  setze(e.id, { zustand: "pruefe", anteil: 0, meldung: null });
  const sha = await sha256Datei(e.datei, { signal, onFortschritt: (p) => setze(e.id, { anteil: uploadAnteil({ pruefung: p, groesse: e.datei.size }) }) });
  // 2) Start
  const r = await uploadStartAction({ ordner: e.ordner, datei: e.zielDatei || undefined, dateiname: e.datei.name, groesse: e.datei.size, mime: e.datei.type || undefined, sha256: sha, kommentar: e.kommentar || undefined });
  if (!r.ok) throw Object.assign(new Error(r.ablage === "unavailable" ? T.upload.speicherFehlt : r.message), { fachlich: true });
  const start = r.daten;
  const dups = start.duplikate || [];
  setze(e.id, { zustand: "sendet", datei_id: start.datei, duplikate: dups });
  // 3) Bytes
  if (start.ziel?.art === "direkt" && start.ziel.url) {
    const a = await sende({ url: start.ziel.url, methode: start.ziel.methode || "PUT", header: start.ziel.header, body: e.datei, signal, onFortschritt: (n) => setze(e.id, { anteil: uploadAnteil({ pruefung: 1, gesendet: n, groesse: e.datei.size }) }) });
    if (a.status < 200 || a.status >= 300) throw Object.assign(new Error(T.upload.fehler), { fachlich: true });
  } else {
    const teil = Math.max(64 * 1024, Math.min(Number(start.ziel?.chunk_bytes) || MAX_TEIL, MAX_TEIL));
    let offset = 0;
    let versuch = 0;
    while (offset < e.datei.size) {
      const stueck = e.datei.slice(offset, offset + teil);
      const a = await sende({
        url: `/ablage/hochladen?token=${encodeURIComponent(start.token)}&offset=${offset}`,
        body: stueck,
        header: { "Content-Type": "application/octet-stream" },
        signal,
        onFortschritt: (n) => setze(e.id, { anteil: uploadAnteil({ pruefung: 1, gesendet: offset + n, groesse: e.datei.size }) }),
      });
      if (a.status >= 200 && a.status < 300 && a.json?.ok) {
        offset = Number(a.json.daten?.erhalten ?? offset + stueck.size);
        versuch = 0;
        continue;
      }
      if (a.json?.code === "conflict" && Number.isFinite(Number(a.json?.daten?.erhalten))) {
        offset = Number(a.json.daten.erhalten);
        continue;
      }
      if ((a.status === 0 || a.status >= 500) && versuch < WIEDERHOLUNG_MS.length) {
        await warte(WIEDERHOLUNG_MS[versuch++], signal);
        continue;
      }
      throw Object.assign(new Error(a.json?.message || T.upload.fehler), { fachlich: true });
    }
  }
  // 4) Abschluss
  setze(e.id, { zustand: "schliesst", anteil: 1 });
  const f = await uploadAbschliessenAction({ token: start.token, sha256: sha, ordner: e.ordner });
  if (!f.ok) throw Object.assign(new Error(f.message), { fachlich: true });
  const d = f.daten;
  setze(e.id, { zustand: "fertig", anteil: 1, ergebnis: d, duplikate: d.duplikate || dups, verworfen: !!d.verworfen });
  return d;
}

/**
 * @param {{info: object, onFertig?: (datei: object, eintrag: object) => void}} opt
 */
export default function useUpload({ info, onFertig } = {}) {
  const [eintraege, setEintraege] = useState([]);
  const laeufe = useRef(new Map());
  const warteschlange = useRef([]);
  const aktiv = useRef(0);
  const onFertigRef = useRef(onFertig);
  useEffect(() => {
    onFertigRef.current = onFertig;
  });

  const setze = (id, werte) => setEintraege((l) => l.map((e) => (e.id === id ? { ...e, ...(typeof werte === "function" ? werte(e) : werte) } : e)));

  async function lauf(e) {
    const ctrl = new AbortController();
    laeufe.current.set(e.id, ctrl);
    try {
      const d = await ladeHoch(e, { setze, signal: ctrl.signal });
      onFertigRef.current?.(d, e);
    } catch (err) {
      if (err?.name === "AbortError") setze(e.id, { zustand: "abgebrochen", meldung: T.upload.abgebrochen });
      else setze(e.id, { zustand: "fehler", meldung: err?.fachlich ? err.message : T.upload.fehler });
    } finally {
      laeufe.current.delete(e.id);
      aktiv.current -= 1;
      naechster();
    }
  }

  function naechster() {
    while (aktiv.current < GLEICHZEITIG && warteschlange.current.length) {
      const e = warteschlange.current.shift();
      aktiv.current += 1;
      lauf(e);
    }
  }

  /** Dateien einreihen. `zielDatei` = neue Version einer bestehenden Datei. */
  function starte(dateien, { ordner, ordnerTitel, zielDatei, kommentar } = {}) {
    const neu = [...dateien].map((datei) => {
      const fehler = uploadVorpruefung(datei, info || {}, T.upload);
      return { id: `u${++laufendeNr}`, datei, name: datei.name, groesse: datei.size, ordner, ordnerTitel, zielDatei, kommentar, zustand: fehler ? "fehler" : "wartet", anteil: 0, meldung: fehler };
    });
    setEintraege((l) => [...l.filter((x) => !["fertig", "abgebrochen"].includes(x.zustand)), ...neu]);
    for (const e of neu) if (e.zustand === "wartet") warteschlange.current.push(e);
    naechster();
    return neu.length;
  }

  function abbrechen(id) {
    const c = laeufe.current.get(id);
    if (c) c.abort();
    else {
      warteschlange.current = warteschlange.current.filter((e) => e.id !== id);
      setze(id, { zustand: "abgebrochen", meldung: T.upload.abgebrochen });
    }
  }

  function erneut(id) {
    const e = eintraege.find((x) => x.id === id);
    if (!e || !e.datei) return;
    const neu = { ...e, zustand: "wartet", anteil: 0, meldung: null };
    setze(id, neu);
    warteschlange.current.push(neu);
    naechster();
  }

  function leeren() {
    setEintraege((l) => l.filter((e) => ["wartet", "pruefe", "sendet", "schliesst"].includes(e.zustand)));
  }

  useEffect(() => {
    const laufend = laeufe.current;
    return () => {
      for (const c of laufend.values()) c.abort();
    };
  }, []);

  return { eintraege, starte, abbrechen, erneut, leeren };
}
