"use client";
// Team-Werkzeug: Boden, Wand, Maßstab (zwei Punkte oder A4), Prüfstrecke,
// Stücke aus dem Katalog als weiche Volumen, Haralds Skizze, Freigabe/Link.
// Kein nachgebautes Design – nur Quader in Herstellermaßen.
import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Check, Plus, RotateCw, Save, Search, Trash2 } from "lucide-react";
import { abstand, meterText } from "@/lib/raumzwilling/massstab";
import { MASSQUELLEN, neueVolumenId, pruefePlatzierung } from "@/lib/raumzwilling/platzierung";
import { RAUM_STATUS } from "@/lib/raumzwilling/config";
import VolumenTabelle from "./VolumenTabelle";
import Grundriss from "./Grundriss";

const RaumViewer = dynamic(() => import("./RaumViewer"), { ssr: false, loading: () => <div className="grid h-[60vh] place-items-center border border-ink/15 bg-stone text-sm">3D-Ansicht wird vorbereitet …</div> });

const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const knopf = `inline-flex min-h-11 items-center justify-center gap-1.5 border px-4 text-sm ${fokus}`;
const primaer = `${knopf} border-ink bg-ink font-semibold text-white hover:bg-ink-deep disabled:opacity-50`;
const sekundaer = `${knopf} border-ink/25 bg-white text-ink hover:border-ink`;
const feld = `min-h-11 w-full border border-pebble bg-white px-3 text-[15px] text-ink ${fokus}`;

const WERKZEUGE = [
  { key: "boden", label: "1 Boden", punkte: 3, hilfe: "Drei Punkte auf dem Boden antippen, möglichst weit auseinander." },
  { key: "wand", label: "2 Wand", punkte: 2, hilfe: "Zwei Punkte unten an einer Wand antippen. Diese Wand wird „hinten“ im Grundriss." },
  { key: "massstab", label: "3 Maßstab", punkte: 2, hilfe: "Zwei Punkte einer bekannten Strecke antippen (z. B. Türlaibung) und das echte Maß eintragen." },
  { key: "a4", label: "3b A4-Blatt", punkte: 4, hilfe: "Die vier Ecken des A4-Blatts der Reihe nach antippen." },
  { key: "pruefen", label: "Prüfstrecke", punkte: 2, hilfe: "Zwei Punkte antippen: Das Werkzeug zeigt die Strecke in Metern (Abgleich mit einem bekannten Maß)." },
  { key: "stuecke", label: "4 Stücke", punkte: 1, hilfe: "Stück suchen und hinzufügen. Tippen auf den Boden setzt das gewählte Stück dorthin." },
  { key: "skizze", label: "5 Skizze", punkte: 0, hilfe: "Scan oder Foto von Haralds Originalzeichnung hochladen." },
  { key: "freigabe", label: "6 Freigabe", punkte: 0, hilfe: "Status setzen, Raum-Link für Kunden ohne Portal erzeugen." },
];

async function post(url, body, method = "POST") {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.details?.join(" · ") || data.error || "Fehler");
  return data;
}

export default function RaumEditor({ projektId, raum: start, demo }) {
  const router = useRouter();
  const [raum, setRaum] = useState(start);
  const [werkzeug, setWerkzeug] = useState(start.transform ? "stuecke" : "boden");
  const [punkte, setPunkte] = useState([]);
  const [meter, setMeter] = useState("0,90");
  const [bezeichnung, setBezeichnung] = useState("Türlaibung");
  const [wandName, setWandName] = useState(start.grundriss?.waende?.hinten || "Fensterwand");
  const [volumen, setVolumen] = useState(start.platzierung?.volumen || []);
  const [auswahl, setAuswahl] = useState(null);
  const [geaendert, setGeaendert] = useState(false);
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [hand, setHand] = useState({ name: "", marke: "", w: "", d: "", h: "", quelle: "" });
  const [meldung, setMeldung] = useState("");
  const [fehler, setFehler] = useState("");
  const [link, setLink] = useState(null);
  const [grund, setGrund] = useState("");
  const [arbeitet, setArbeitet] = useState(false);
  const wz = WERKZEUGE.find((w) => w.key === werkzeug);
  const hinweise = useMemo(() => pruefePlatzierung({ volumen }, raum.grundriss), [volumen, raum.grundriss]);
  const gewaehlt = volumen.find((v) => v.id === auswahl);

  const melde = (m) => {
    setFehler("");
    setMeldung(m);
  };
  const scheitere = (e) => {
    setMeldung("");
    setFehler(e.message || String(e));
  };

  const onPick = useCallback(
    (p) => {
      if (!p) {
        setFehler("Dort liegt kein Punkt des Raums. Bitte genauer auf eine Fläche tippen.");
        return;
      }
      setFehler("");
      if (werkzeug === "stuecke") {
        if (!auswahl) return setMeldung("Erst ein Stück in der Liste wählen, dann auf den Boden tippen.");
        setVolumen((vs) => vs.map((v) => (v.id === auswahl ? { ...v, x: Math.round(p.welt[0] * 100) / 100, z: Math.round(p.welt[2] * 100) / 100 } : v)));
        setGeaendert(true);
        return;
      }
      setPunkte((ps) => [...(ps.length >= wz.punkte ? [] : ps), p]);
    },
    [werkzeug, wz, auswahl]
  );

  async function anwenden() {
    setArbeitet(true);
    try {
      const m = punkte.map((p) => p.modell);
      let body;
      if (werkzeug === "boden") body = { art: "boden", punkte: m };
      else if (werkzeug === "wand") body = { art: "wand", a: m[0], b: m[1], name: wandName };
      else if (werkzeug === "massstab") body = { art: "zwei-punkt", a: m[0], b: m[1], meter: Number(String(meter).replace(",", ".")), bezeichnung };
      else if (werkzeug === "a4") body = { art: "a4", ecken: m };
      const r = await post(`/api/portal/raum/${projektId}/massstab`, body);
      setRaum((x) => ({ ...x, transform: r.transform, massstab: r.massstab, grundriss: r.grundriss, standpunkte: r.standpunkte }));
      setPunkte([]);
      melde(werkzeug === "boden" ? "Boden gesetzt." : werkzeug === "wand" ? "Wand ausgerichtet." : `Maßstab gesetzt (Faktor ${r.transform.faktor.toFixed(4).replace(".", ",")}). Raum ${meterText(r.grundriss.x1 - r.grundriss.x0)} × ${meterText(r.grundriss.z1 - r.grundriss.z0)}.`);
    } catch (e) {
      scheitere(e);
    } finally {
      setArbeitet(false);
    }
  }

  async function sucheStart(e) {
    e.preventDefault();
    setTreffer(null);
    try {
      const r = await fetch(`/api/portal/raum/katalog?q=${encodeURIComponent(suche)}`, { credentials: "same-origin" }).then((x) => x.json());
      setTreffer(r);
    } catch (err) {
      scheitere(err);
    }
  }

  function fuegeHinzu(t) {
    const m = t.masse;
    const v = {
      id: neueVolumenId(),
      produktId: t.id || null,
      name: t.name,
      marke: t.marke || null,
      w: m.w,
      d: m.d,
      h: m.h,
      quelle: m.quelle,
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
      notiz: null,
    };
    setVolumen((vs) => [...vs, v]);
    setAuswahl(v.id);
    setGeaendert(true);
    melde(`${t.name} hinzugefügt. Auf den Boden tippen, um es zu setzen, oder Werte unten ändern.`);
  }

  function handHinzu(e) {
    e.preventDefault();
    const n = (s) => Number(String(s).replace(",", "."));
    if (!hand.name || !(n(hand.w) >= 5 && n(hand.d) >= 5 && n(hand.h) >= 5) || !hand.quelle.trim()) {
      return setFehler("Name, Breite, Tiefe, Höhe (cm) und die Quelle der Maße angeben.");
    }
    fuegeHinzu({ name: hand.name, marke: hand.marke || null, masse: { w: n(hand.w), d: n(hand.d), h: n(hand.h), quelle: { art: "hand", text: hand.quelle.trim(), url: null } } });
    setHand({ name: "", marke: "", w: "", d: "", h: "", quelle: "" });
  }

  const aendere = (patch) => {
    setVolumen((vs) => vs.map((v) => (v.id === auswahl ? { ...v, ...patch } : v)));
    setGeaendert(true);
  };

  async function speichern() {
    setArbeitet(true);
    try {
      const r = await post(`/api/portal/raum/${projektId}/platzierung`, { version: 1, volumen }, "PUT");
      setGeaendert(false);
      melde(`Planung gespeichert (${r.platzierung.volumen.length} Stücke).${r.hinweise.length ? ` Hinweise: ${r.hinweise.map((h) => h.text).join(" ")}` : ""}`);
    } catch (e) {
      scheitere(e);
    } finally {
      setArbeitet(false);
    }
  }

  async function skizzeHoch(e) {
    e.preventDefault();
    setArbeitet(true);
    try {
      const fd = new FormData(e.currentTarget);
      const res = await fetch(`/api/portal/raum/${projektId}/skizze`, { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Hochladen fehlgeschlagen");
      setRaum((x) => ({ ...x, skizzen: [...(x.skizzen || []), data.skizze] }));
      e.currentTarget?.reset?.();
      melde("Skizze hochgeladen. Sie erscheint im Portal in der Ebene „Skizze“.");
    } catch (err) {
      scheitere(err);
    } finally {
      setArbeitet(false);
    }
  }

  async function skizzeWeg(id) {
    const res = await fetch(`/api/portal/raum/${projektId}/skizze?id=${id}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) setRaum((x) => ({ ...x, skizzen: x.skizzen.filter((s) => s.id !== id) }));
  }

  async function aktion(body, text) {
    setArbeitet(true);
    try {
      const r = await post(`/api/portal/raum/${projektId}/aktion`, body);
      if (body.aktion === "link") setLink(r);
      if (body.aktion === "status") setRaum((x) => ({ ...x, status: r.status }));
      if (body.aktion === "demo-zuruecksetzen") {
        router.push(`/de/portal/raum/team`);
        return;
      }
      melde(text);
    } catch (e) {
      scheitere(e);
    } finally {
      setArbeitet(false);
    }
  }

  // Prüfstrecke / Maßstab-Vorschau
  const strecke = punkte.length === 2 ? abstand(punkte[0].modell, punkte[1].modell) * (raum.transform?.faktor || 1) : null;
  const markierungen = punkte.map((p) => ({ welt: p.welt }));
  const pickAktiv = wz.punkte > 0;

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Werkzeuge" className="flex flex-wrap gap-2">
        {WERKZEUGE.map((w) => (
          <button
            key={w.key}
            role="tab"
            type="button"
            aria-selected={werkzeug === w.key}
            onClick={() => {
              setWerkzeug(w.key);
              setPunkte([]);
              setMeldung("");
              setFehler("");
            }}
            className={`${knopf} ${werkzeug === w.key ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink/50"}`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-3">
          {raum.splat ? (
            <RaumViewer
              basis={`/api/portal/raum/${projektId}/datei/splat`}
              transform={raum.transform}
              standpunkte={raum.standpunkte || []}
              volumen={volumen}
              auswahl={auswahl}
              kommentare={raum.kommentare || []}
              markierungen={markierungen}
              pickAktiv={pickAktiv}
              onPick={onPick}
              onVolumenKlick={setAuswahl}
              hoehe="min(62vh, 600px)"
              label="3D-Ansicht für das Team"
            />
          ) : (
            <p className="bg-bone p-4 text-sm">Für diesen Raum gibt es noch keinen Splat. Job starten: node tools/raumzwilling/run.mjs {projektId}</p>
          )}
          <p className="text-sm text-ink/80">{wz.hilfe}</p>
          <div aria-live="polite" className="space-y-2">
            {meldung && <p className="border border-success/40 bg-success/10 px-3 py-2 text-sm text-ink">{meldung}</p>}
            {fehler && (
              <p role="alert" className="border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
                {fehler}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-5" role="tabpanel" aria-label={wz.label}>
          {["boden", "wand", "massstab", "a4", "pruefen"].includes(werkzeug) && (
            <div className="space-y-3 border border-ink/10 bg-white p-4">
              <p className="text-sm text-ink">
                Punkte: {punkte.length} von {wz.punkte}
                {punkte.length > 0 && (
                  <button type="button" onClick={() => setPunkte([])} className={`ml-3 text-sm underline underline-offset-4 ${fokus}`}>
                    zurücksetzen
                  </button>
                )}
              </p>
              {werkzeug === "wand" && (
                <div>
                  <label htmlFor="e-wand" className="mb-1 block text-sm font-semibold">
                    Name der Wand
                  </label>
                  <input id="e-wand" value={wandName} onChange={(e) => setWandName(e.target.value)} className={feld} maxLength={30} />
                </div>
              )}
              {werkzeug === "massstab" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="e-meter" className="mb-1 block text-sm font-semibold">
                      Echtes Maß (m)
                    </label>
                    <input id="e-meter" inputMode="decimal" value={meter} onChange={(e) => setMeter(e.target.value)} className={feld} />
                  </div>
                  <div>
                    <label htmlFor="e-bez" className="mb-1 block text-sm font-semibold">
                      Was wurde gemessen?
                    </label>
                    <input id="e-bez" value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} className={feld} maxLength={60} />
                  </div>
                </div>
              )}
              {strecke !== null && (
                <p className="text-sm text-ink" data-testid="strecke">
                  {raum.transform ? `Strecke im Raum: ${meterText(strecke, 3)}` : `Strecke (Modell-Einheiten): ${strecke.toFixed(3)}`}
                </p>
              )}
              {werkzeug !== "pruefen" && (
                <button type="button" disabled={punkte.length !== wz.punkte || arbeitet} onClick={anwenden} className={primaer}>
                  <Check size={15} aria-hidden="true" /> Übernehmen
                </button>
              )}
              {raum.massstab && (
                <p className="text-xs text-ink/70">
                  Aktueller Maßstab: {raum.massstab.quelle === "a4" ? "A4-Blatt" : `${raum.massstab.bezeichnung || "Strecke"} = ${String(raum.massstab.meter).replace(".", ",")} m`} · Faktor {raum.transform?.faktor?.toFixed(4).replace(".", ",")}
                </p>
              )}
            </div>
          )}

          {werkzeug === "stuecke" && (
            <div className="space-y-4">
              <form onSubmit={sucheStart} className="flex gap-2" role="search">
                <label htmlFor="e-suche" className="sr-only">
                  Katalog durchsuchen
                </label>
                <input id="e-suche" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="z. B. Lota, Bibendum, Andersen" className={feld} />
                <button type="submit" className={primaer} aria-label="Suchen">
                  <Search size={15} aria-hidden="true" />
                </button>
              </form>
              {treffer && (
                <div>
                  <p className="mb-2 text-xs text-ink/70">{treffer.quelle === "register" ? "Backoffice nicht erreichbar: Treffer aus dem Register geprüfter Herstellermaße." : "Treffer aus dem Katalog. Maße aus dem Register geprüfter Herstellerangaben."}</p>
                  <ul className="max-h-72 divide-y divide-ink/10 overflow-y-auto border border-ink/10 bg-white">
                    {treffer.treffer.length === 0 && <li className="p-3 text-sm">Keine Treffer.</li>}
                    {treffer.treffer.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0 text-sm">
                          <p className="font-semibold text-ink">
                            {t.marke ? `${t.marke} · ` : ""}
                            {t.name}
                          </p>
                          <p className="text-xs text-ink/70">{t.masse ? `B ${t.masse.w} × T ${t.masse.d} × H ${t.masse.h} cm · ${MASSQUELLEN.hersteller}` : "Maße fehlen – unten von Hand eintragen"}</p>
                        </div>
                        <button type="button" disabled={!t.masse} onClick={() => fuegeHinzu(t)} className={sekundaer} aria-label={`${t.name} hinzufügen`}>
                          <Plus size={15} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <details className="border border-ink/10 bg-white p-3">
                <summary className={`min-h-6 cursor-pointer text-sm font-semibold ${fokus}`}>Stück von Hand (Maße fehlen im Register)</summary>
                <form onSubmit={handHinzu} className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["name", "Name"],
                    ["marke", "Marke (optional)"],
                    ["w", "Breite cm"],
                    ["d", "Tiefe cm"],
                    ["h", "Höhe cm"],
                    ["quelle", "Quelle der Maße"],
                  ].map(([k, l]) => (
                    <div key={k}>
                      <label htmlFor={`h-${k}`} className="mb-1 block text-xs font-semibold">
                        {l}
                      </label>
                      <input id={`h-${k}`} value={hand[k]} onChange={(e) => setHand((h) => ({ ...h, [k]: e.target.value }))} className={feld} inputMode={["w", "d", "h"].includes(k) ? "decimal" : undefined} />
                    </div>
                  ))}
                  <button type="submit" className={`${sekundaer} sm:col-span-2`}>
                    <Plus size={15} aria-hidden="true" /> Hinzufügen
                  </button>
                </form>
              </details>
              {gewaehlt && (
                <div className="space-y-3 border border-ink bg-white p-4">
                  <p className="font-semibold text-ink">
                    {gewaehlt.marke ? `${gewaehlt.marke} · ` : ""}
                    {gewaehlt.name}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["x", "x (m)", 0.05],
                      ["z", "z (m)", 0.05],
                      ["rotY", "Drehung (°)", 15],
                    ].map(([k, l, s]) => (
                      <div key={k}>
                        <label htmlFor={`v-${k}`} className="mb-1 block text-xs font-semibold">
                          {l}
                        </label>
                        <input id={`v-${k}`} type="number" step={s} value={gewaehlt[k]} onChange={(e) => aendere({ [k]: Number(e.target.value) })} className={feld} />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => aendere({ rotY: (((gewaehlt.rotY + 90) % 360) + 360) % 360 })} className={sekundaer}>
                      <RotateCw size={15} aria-hidden="true" /> 90° drehen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVolumen((vs) => vs.filter((v) => v.id !== auswahl));
                        setAuswahl(null);
                        setGeaendert(true);
                      }}
                      className={sekundaer}
                    >
                      <Trash2 size={15} aria-hidden="true" /> Entfernen
                    </button>
                  </div>
                  <div>
                    <label htmlFor="v-notiz" className="mb-1 block text-xs font-semibold">
                      Notiz für den Kunden (optional)
                    </label>
                    <input id="v-notiz" value={gewaehlt.notiz || ""} maxLength={300} onChange={(e) => aendere({ notiz: e.target.value || null })} className={feld} />
                  </div>
                </div>
              )}
              {hinweise.length > 0 && (
                <ul className="space-y-1 text-sm text-notice">
                  {hinweise.map((h, i) => (
                    <li key={i}>Hinweis: {h.text}</li>
                  ))}
                </ul>
              )}
              <button type="button" disabled={!geaendert || arbeitet} onClick={speichern} className={primaer}>
                <Save size={15} aria-hidden="true" /> Planung speichern
              </button>
            </div>
          )}

          {werkzeug === "skizze" && (
            <div className="space-y-4">
              <form onSubmit={skizzeHoch} className="space-y-3 border border-ink/10 bg-white p-4">
                <div>
                  <label htmlFor="s-bild" className="mb-1 block text-sm font-semibold">
                    Scan oder Foto der Originalzeichnung
                  </label>
                  <input id="s-bild" name="bild" type="file" accept="image/*" required className="block w-full text-sm" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="s-titel" className="mb-1 block text-sm font-semibold">
                      Titel
                    </label>
                    <input id="s-titel" name="titel" required maxLength={80} className={feld} placeholder="Grundriss mit Sitzgruppe" />
                  </div>
                  <div>
                    <label htmlFor="s-datum" className="mb-1 block text-sm font-semibold">
                      Gezeichnet am
                    </label>
                    <input id="s-datum" name="datum" type="date" required className={feld} />
                  </div>
                </div>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" name="echt" value="ja" required className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
                  <span>Das ist ein Scan oder Foto einer echten Handzeichnung von Harald Menghin. Kein KI-Bild, kein Rendering.</span>
                </label>
                <button type="submit" disabled={arbeitet} className={primaer}>
                  Skizze hochladen
                </button>
              </form>
              {(raum.skizzen || []).length > 0 && (
                <ul className="space-y-2">
                  {raum.skizzen.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 bg-white p-3 text-sm">
                      <span>
                        {s.titel} · {s.datum}
                      </span>
                      <button type="button" onClick={() => skizzeWeg(s.id)} className={sekundaer} aria-label={`Skizze ${s.titel} entfernen`}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {werkzeug === "freigabe" && (
            <div className="space-y-4">
              <div className="space-y-2 border border-ink/10 bg-white p-4">
                <p className="text-sm">
                  Status: <strong>{RAUM_STATUS[raum.status]?.label}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!raum.splat || arbeitet} onClick={() => aktion({ aktion: "status", status: "bereit" }, "Raum ist für den Kunden sichtbar.")} className={sekundaer}>
                    Raum freigeben
                  </button>
                  <button type="button" disabled={!raum.standbilder?.length || arbeitet} onClick={() => aktion({ aktion: "status", status: "nur-fotos" }, "Nur Standbilder und Grundriss sichtbar.")} className={sekundaer}>
                    Nur Fotos + Grundriss
                  </button>
                </div>
                <label htmlFor="f-grund" className="mt-2 block text-sm font-semibold">
                  Bitte um neue Aufnahme, Grund
                </label>
                <input id="f-grund" value={grund} onChange={(e) => setGrund(e.target.value)} className={feld} maxLength={300} placeholder="z. B. Die Fensterseite fehlt im Video." />
                <button type="button" disabled={!grund.trim() || arbeitet} onClick={() => aktion({ aktion: "status", status: "bitte-wiederholen", grund }, "Bitte um neue Aufnahme gesetzt.")} className={sekundaer}>
                  Um neue Aufnahme bitten
                </button>
              </div>
              <div className="space-y-2 border border-ink/10 bg-white p-4">
                <p className="text-sm font-semibold">Raum-Link (wenn das Portal nicht genutzt werden kann)</p>
                <p className="text-xs text-ink/75">Funktioniert genau einmal, danach 14 Tage auf diesem Gerät. Nur für diesen Raum. Wird nicht automatisch versendet.</p>
                <button type="button" disabled={arbeitet} onClick={() => aktion({ aktion: "link" }, "Link erzeugt.")} className={sekundaer}>
                  Link erzeugen
                </button>
                {link && (
                  <p className="break-all bg-bone p-2 font-mono text-xs" data-testid="raum-link">
                    {link.url}
                  </p>
                )}
              </div>
              {demo && (
                <button type="button" onClick={() => aktion({ aktion: "demo-zuruecksetzen" }, "Demo zurückgesetzt.")} className={`${sekundaer} text-xs`}>
                  Demo-Raum zurücksetzen (nur Entwicklung)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <section aria-labelledby="e-plan" className="grid gap-6 border border-ink/10 bg-white p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <h2 id="e-plan" className="mb-3 font-display text-xl text-ink">
            Planung {geaendert && <span className="text-sm font-normal text-notice">(nicht gespeichert)</span>}
          </h2>
          <VolumenTabelle volumen={volumen} grundriss={raum.grundriss} auswahl={auswahl} onAuswahl={setAuswahl} caption="Stücke" />
        </div>
        <Grundriss grundriss={raum.grundriss} volumen={volumen} kommentare={raum.kommentare || []} auswahl={auswahl} />
      </section>
    </div>
  );
}
