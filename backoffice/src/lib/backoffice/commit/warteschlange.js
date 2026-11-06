// Verzögerter Commit – Client-Warteschlange (G-03, Q-C3…Q-C5; Team P0-3). Reines Modul ohne React,
// mit Uhr und Server-Aufrufen als Parameter (Unit-Tests mit falscher Uhr).
//
// Ein „Vorgang“ = ein Undo-Toast mit einem oder mehreren Tokens (Zusammenfassen gleichartiger über `gruppe`).
// Der Timer hier ist die einzige Wahrheit (nie animationend). Anhalten bei Hover/Fokus/Berührung ist
// gedeckelt (PAUSE_MAX_MS), damit der Client immer vor dem Server-Nachlauf entscheidet.
//
// Regeln:
//   - Queue je Datensatz: Ein neuer Vorgang am selben Objekt führt ausstehende Tokens dieses Objekts
//     vorher aus (Q-C4 „Folgeaktion ruft flush()“).
//   - flush(objekt?) führt sofort aus (Navigation, Folgeaktion); beaconAlle() übergibt alles an
//     navigator.sendBeacon (pagehide/visibilitychange) – nie still verworfen.
//   - Rückgängig: verwerfen(tokens); Netzfehler → bis zu drei Wiederholungen (1/2/4 s).

import { COMMIT_MS, PAUSE_MAX_MS, objektSchluessel } from "./konstanten.js";

const STANDARD_UHR = {
  jetzt: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (t) => clearTimeout(t),
};

const NETZ = { ok: false, code: "netz" };

/**
 * @param {object} o
 * @param {(tokens:string[]) => Promise<{ergebnisse?:object[]}>} o.ausfuehren   commitAction
 * @param {(tokens:string[]) => Promise<{ergebnisse?:object[]}>} o.verwerfen    verwerfeCommit
 * @param {(tokens:string[]) => boolean} [o.beacon]                             navigator.sendBeacon
 * @param {typeof STANDARD_UHR} [o.uhr]
 * @param {number} [o.standardMs]
 * @param {number} [o.maxPauseMs]
 * @param {number[]} [o.wiederholung]  Wartezeiten für erneutes Verwerfen nach Netzfehler
 */
export function erzeugeWarteschlange({ ausfuehren, verwerfen, beacon = () => false, uhr = STANDARD_UHR, standardMs = COMMIT_MS, maxPauseMs = PAUSE_MAX_MS, wiederholung = [1000, 2000, 4000] } = {}) {
  /** @type {Map<number, any>} */
  const vorgaenge = new Map();
  const hoerer = new Set();
  const abos = new Set();
  let nr = 0;
  let version = 0;
  let schnapp = { version: 0, vorgaenge: [] };

  function info(v) {
    const jetzt = uhr.jetzt();
    const rest = v.pausiertSeit ? v.rest : Math.max(0, v.frist - jetzt);
    return {
      id: v.id,
      text: v.text,
      gruppe: v.gruppe || null,
      anzahl: v.posten.length,
      ms: v.ms,
      frist: v.pausiertSeit ? jetzt + v.rest : v.frist,
      rest,
      pausiert: !!v.pausiertSeit,
      zustand: v.zustand,
      lauf: v.lauf,
      objekte: v.posten.map((p) => p.objekt).filter(Boolean),
      tokens: v.posten.map((p) => p.token),
    };
  }

  function melde(ereignis) {
    version += 1;
    schnapp = null;
    for (const fn of abos) {
      try {
        fn();
      } catch {
        // Abonnenten dürfen die Queue nie stören.
      }
    }
    if (ereignis) {
      for (const fn of hoerer) {
        try {
          fn(ereignis);
        } catch {
          // ebenso
        }
      }
    }
  }

  function rufe(fn, arg) {
    if (typeof fn !== "function") return;
    try {
      fn(arg);
    } catch {
      // Bereichs-Rückruf darf die Queue nicht anhalten.
    }
  }

  function stoppe(v) {
    if (v.timer) uhr.clearTimeout(v.timer);
    if (v.kappe) uhr.clearTimeout(v.kappe);
    v.timer = null;
    v.kappe = null;
  }

  function stelle(v, ms) {
    stoppe(v);
    v.frist = uhr.jetzt() + ms;
    v.timer = uhr.setTimeout(() => {
      v.timer = null;
      fuehreAus(v);
    }, ms);
  }

  function ergebnisFuer(antwort, token) {
    const liste = Array.isArray(antwort?.ergebnisse) ? antwort.ergebnisse : [];
    const r = liste.find((x) => x && x.token === token);
    if (r) return r;
    if (antwort && antwort.ok === false && antwort.code) return { token, ok: false, code: antwort.code, message: antwort.message };
    return { token, ok: false, code: "netz" };
  }

  /** Posten ausführen; `still` = Teil-Flush ohne eigenen Toast. */
  async function fuehreAusPosten(v, posten, { still = false } = {}) {
    const tokens = posten.map((p) => p.token);
    let antwort;
    try {
      antwort = await ausfuehren(tokens);
    } catch {
      antwort = NETZ;
    }
    const ergebnisse = posten.map((p) => ({ posten: p, r: ergebnisFuer(antwort, p.token) }));
    const fehler = ergebnisse.filter((e) => !e.r.ok && e.r.code !== "netz");
    const netz = ergebnisse.filter((e) => e.r.code === "netz");
    for (const { posten: p, r } of ergebnisse) {
      if (r.ok) rufe(p.onErfolg, r);
      else if (r.code !== "netz") rufe(p.onFehler, r);
    }
    const art = fehler.length ? "fehler" : netz.length ? "netz" : "fertig";
    melde({ art, vorgang: { ...info(v), still }, ergebnisse: ergebnisse.map(({ posten: p, r }) => ({ ...r, objekt: p.objekt, fehlerText: p.fehlerText })) });
    return ergebnisse.map((e) => e.r);
  }

  async function fuehreAus(v) {
    if (v.zustand !== "wartet") return v.laeuft || [];
    stoppe(v);
    v.zustand = "laeuft";
    melde(null);
    v.laeuft = fuehreAusPosten(v, v.posten).finally(() => {
      v.zustand = "erledigt";
      vorgaenge.delete(v.id);
      melde(null);
    });
    return v.laeuft;
  }

  function wartende(schluessel) {
    return [...vorgaenge.values()].filter((v) => v.zustand === "wartet" && (!schluessel || v.posten.some((p) => p.objekt === schluessel)));
  }

  /**
   * Vorgang starten (Token kommt aus planeCommit der Bereichs-Action).
   * @param {string} text  Toast-Text („Anfrage angenommen“)
   * @param {{token?:string, tokens?:string[], ms?:number, objekt?:object|string, gruppe?:string, sammel?:(n:number)=>string,
   *          fehlerText?:string, onErfolg?:Function, onFehler?:Function, onVerworfen?:Function}} o
   * @returns {number} Vorgangs-ID (= Toast)
   */
  function starte(text, o = {}) {
    const tokens = (o.tokens || (o.token ? [o.token] : [])).filter((t) => typeof t === "string" && t);
    if (!tokens.length) throw new TypeError("starte() braucht ein Token aus planeCommit().");
    const objekt = objektSchluessel(o.objekt);
    const ms = Number(o.ms) > 0 ? Number(o.ms) : standardMs;
    const posten = tokens.map((token) => ({ token, objekt, objektRoh: o.objekt || null, fehlerText: o.fehlerText || null, onErfolg: o.onErfolg, onFehler: o.onFehler, onVerworfen: o.onVerworfen }));
    // Queue je Datensatz: ältere ausstehende Änderungen desselben Objekts zuerst speichern.
    if (objekt) flush(objekt);
    const gleich = o.gruppe ? [...vorgaenge.values()].find((v) => v.zustand === "wartet" && v.gruppe === o.gruppe) : null;
    if (gleich) {
      gleich.posten.push(...posten);
      gleich.ms = Math.max(gleich.ms, ms);
      gleich.sammel = o.sammel || gleich.sammel;
      gleich.text = gleich.sammel ? gleich.sammel(gleich.posten.length) : text;
      gleich.lauf += 1;
      gleich.pauseSumme = 0;
      if (gleich.pausiertSeit) {
        gleich.rest = gleich.ms;
        gleich.pausiertSeit = uhr.jetzt();
      } else stelle(gleich, gleich.ms);
      melde({ art: "aktualisiert", vorgang: info(gleich) });
      return gleich.id;
    }
    const v = { id: ++nr, text, gruppe: o.gruppe || null, sammel: o.sammel || null, ms, posten, zustand: "wartet", frist: 0, rest: ms, pausiertSeit: null, pauseSumme: 0, lauf: 1, timer: null, kappe: null, laeuft: null };
    vorgaenge.set(v.id, v);
    stelle(v, ms);
    melde({ art: "neu", vorgang: info(v) });
    return v.id;
  }

  function pausiere(id) {
    const v = vorgaenge.get(id);
    if (!v || v.zustand !== "wartet" || v.pausiertSeit) return;
    const jetzt = uhr.jetzt();
    v.rest = Math.max(0, v.frist - jetzt);
    if (v.timer) uhr.clearTimeout(v.timer);
    v.timer = null;
    v.pausiertSeit = jetzt;
    const erlaubt = Math.max(0, maxPauseMs - v.pauseSumme);
    v.kappe = uhr.setTimeout(() => {
      v.kappe = null;
      fortsetzen(id, { gedeckelt: true });
    }, erlaubt);
    melde({ art: "pausiert", vorgang: info(v) });
  }

  function fortsetzen(id, { gedeckelt = false } = {}) {
    const v = vorgaenge.get(id);
    if (!v || v.zustand !== "wartet" || !v.pausiertSeit) return;
    v.pauseSumme += uhr.jetzt() - v.pausiertSeit;
    if (gedeckelt) v.pauseSumme = maxPauseMs;
    v.pausiertSeit = null;
    stelle(v, v.rest);
    melde({ art: "fortgesetzt", vorgang: { ...info(v), gedeckelt } });
  }

  async function verwerfeMitWiederholung(tokens) {
    for (let i = 0; ; i++) {
      let antwort;
      try {
        antwort = await verwerfen(tokens);
      } catch {
        antwort = NETZ;
      }
      const offen = tokens.filter((t) => ergebnisFuer(antwort, t).code === "netz");
      if (!offen.length || i >= wiederholung.length) return antwort;
      await new Promise((r) => uhr.setTimeout(r, wiederholung[i]));
    }
  }

  /** Rückgängig für den ganzen Vorgang. */
  async function rueckgaengig(id) {
    const v = vorgaenge.get(id);
    if (!v || v.zustand !== "wartet") return null;
    stoppe(v);
    v.zustand = "verwirft";
    melde(null);
    const antwort = await verwerfeMitWiederholung(v.posten.map((p) => p.token));
    const ergebnisse = v.posten.map((p) => ({ posten: p, r: ergebnisFuer(antwort, p.token) }));
    for (const { posten: p, r } of ergebnisse) {
      if (r.ok) rufe(p.onVerworfen, r);
      else if (r.status === "ausgefuehrt" || r.status === "laeuft") rufe(p.onErfolg, r);
      else if (r.status === "fehlgeschlagen") rufe(p.onFehler, r);
    }
    vorgaenge.delete(v.id);
    v.zustand = "erledigt";
    const ok = ergebnisse.every((e) => e.r.ok);
    const netz = ergebnisse.some((e) => e.r.code === "netz");
    melde({ art: ok ? "verworfen" : netz ? "verwerfenNetz" : "verwerfenZuSpaet", vorgang: info(v), ergebnisse: ergebnisse.map((e) => e.r) });
    return ergebnisse.map((e) => e.r);
  }

  /** „Jetzt ausführen“ für einen Vorgang. */
  function jetzt(id) {
    const v = vorgaenge.get(id);
    return v ? fuehreAus(v) : Promise.resolve([]);
  }

  /**
   * Ausstehendes sofort ausführen – alles oder nur ein Objekt (Folgeaktion am selben Datensatz).
   * @returns {Promise<object[]>} Ergebnisse
   */
  async function flush(objekt) {
    const schluessel = objekt ? objektSchluessel(objekt) : null;
    const laufend = [...vorgaenge.values()].filter((v) => v.zustand === "laeuft" && (!schluessel || v.posten.some((p) => p.objekt === schluessel))).map((v) => v.laeuft);
    const jobs = [];
    for (const v of wartende(schluessel)) {
      const passend = schluessel ? v.posten.filter((p) => p.objekt === schluessel) : v.posten;
      if (passend.length === v.posten.length) {
        jobs.push(fuehreAus(v));
        continue;
      }
      // Teil eines zusammengefassten Vorgangs: nur diese Posten, der Rest wartet weiter.
      v.posten = v.posten.filter((p) => p.objekt !== schluessel);
      if (v.sammel) v.text = v.sammel(v.posten.length);
      melde({ art: "aktualisiert", vorgang: info(v) });
      jobs.push(fuehreAusPosten(v, passend, { still: true }));
    }
    const alle = await Promise.all([...laufend, ...jobs]);
    return alle.flat();
  }

  /** Seite wird verlassen/verborgen: alles per Beacon übergeben (Server führt aus; Netz weg → Nachlauf). */
  function beaconAlle() {
    const liste = wartende(null);
    const tokens = liste.flatMap((v) => v.posten.map((p) => p.token));
    if (!tokens.length) return 0;
    let gesendet = false;
    try {
      gesendet = !!beacon(tokens);
    } catch {
      gesendet = false;
    }
    for (const v of liste) {
      stoppe(v);
      v.zustand = "erledigt";
      vorgaenge.delete(v.id);
      melde({ art: "gesendet", vorgang: info(v), gesendet });
    }
    return tokens.length;
  }

  /** Ausstehender Vorgang zu einem Objekt (wartet oder läuft) – für `Ausstehend`. */
  function ausstehend(objekt) {
    const s = objektSchluessel(objekt);
    if (!s) return null;
    for (const v of vorgaenge.values()) {
      if ((v.zustand === "wartet" || v.zustand === "laeuft" || v.zustand === "verwirft") && v.posten.some((p) => p.objekt === s)) return info(v);
    }
    return null;
  }

  function vorgang(id) {
    const v = vorgaenge.get(id);
    return v ? info(v) : null;
  }

  /** Jüngster wartender Vorgang (Kürzel Z / Strg+Z). */
  function juengster() {
    const w = wartende(null);
    return w.length ? info(w[w.length - 1]) : null;
  }

  function schnappschuss() {
    if (!schnapp) schnapp = { version, vorgaenge: [...vorgaenge.values()].map(info) };
    return schnapp;
  }

  return {
    starte,
    pausiere,
    fortsetzen,
    rueckgaengig,
    jetzt,
    flush,
    beaconAlle,
    ausstehend,
    vorgang,
    juengster,
    anzahl: () => wartende(null).length,
    schnappschuss,
    abonniere(fn) {
      abos.add(fn);
      return () => abos.delete(fn);
    },
    hoere(fn) {
      hoerer.add(fn);
      return () => hoerer.delete(fn);
    },
    entsorge() {
      for (const v of vorgaenge.values()) stoppe(v);
    },
  };
}

/**
 * Zeilen, die aus dem Filter fallen, bleiben stehen, solange ihr Commit aussteht (Q-C5).
 * @param {any[]} neu                       aktuelle Zeilen (vom Server)
 * @param {{zeile:any, index:number}[]} merk zuletzt angezeigte, ausstehende Zeilen mit Position
 * @param {Set<string>} offen               Objekt-Schlüssel mit ausstehendem Commit
 * @param {(zeile:any)=>string} schluesselVon  Zeile → Objekt-Schlüssel („PH Anfrage:AN-…“)
 */
export function behalteZeilen(neu, merk, offen, schluesselVon) {
  const liste = Array.isArray(neu) ? [...neu] : [];
  const da = new Set(liste.map(schluesselVon));
  for (const { zeile, index } of merk || []) {
    const s = schluesselVon(zeile);
    if (!offen.has(s) || da.has(s)) continue;
    liste.splice(Math.min(Math.max(0, index), liste.length), 0, zeile);
    da.add(s);
  }
  return liste;
}
