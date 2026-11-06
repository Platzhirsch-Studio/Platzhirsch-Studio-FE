"use client";
// Ausgabe-Akte, Reiter Inhalt (10-konzept-marketing § 2.3): Betreff + Block-Editor mit Server-Autosave (1,5 s Ruhe,
// beim Verlassen sofort, Konflikt über `modified`), Bereitschaft je Block („dabei“ / „optional, leer“ / „unvollständig“),
// Blockmenü als Zeiger-Alternative zum Ziehen (Nach oben · Nach unten · An den Anfang · Duplizieren · Entfernen mit
// Rückgängig), Tastatur ⌘/Strg+Shift+↑/↓. Bildfeld nur mit „Eigenes Foto von Platzhirsch“ (P13). Live-Vorschau rechts
// (iframe sandbox), neu nach jedem Speichern; unter 1 280 px Segment „Schreiben | Vorschau“.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GripVertical } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { useToast } from "../Toast";
import { useAutosave } from "../Formular/useAutosave";
import { SpeicherAnzeige } from "../Formular/Speicherleiste";
import { Icon } from "../icons";
import { MailVorschau } from "./Kleinteile";
import { ausgabeBildAction, ausgabeSpeichernAction, ausgabeVerwerfenAction, ausgabeVorschauAction } from "@/lib/backoffice/marketing/actions";
import { blockZustand, monatAusSlug, stripHtml } from "@/lib/backoffice/marketing/regeln";
import { BLOCK_REIHE, BLOCK_TEXT, NEWSLETTER } from "@/lib/backoffice/marketing/texte";

let zaehler = 0;
const schluessel = () => `b${++zaehler}`;
const mitSchluessel = (bloecke = []) => bloecke.map((b) => ({ ...b, _k: b._k || schluessel() }));
const ohneSchluessel = (bloecke) => bloecke.map(({ _k, sichtbar: _s, idx: _i, parent: _p, parenttype: _pt, parentfield: _pf, doctype: _d, ...b }) => b);

/**
 * @param {{name:string, doc:object, events:object[], nurLesen:boolean, eingefroren?:string|null}} p
 */
export default function AusgabeEditor({ name, doc, events = [], nurLesen = false }) {
  const router = useRouter();
  const sp = useSearchParams();
  const { zeige } = useToast();
  const [betreff, setBetreff] = useState(doc.betreff === "(ohne Betreff)" ? "" : doc.betreff || "");
  const [bloecke, setBloecke] = useState(() => mitSchluessel(doc.bloecke || []));
  const modified = useRef(doc.modified);
  const [vorschau, setVorschau] = useState({ html: null, stand: null, fehler: null, laedt: true, betreff: "" });
  const [ansicht, setAnsicht] = useState("schreiben");
  const [markiert, setMarkiert] = useState(null);
  const betreffRef = useRef(null);
  const blockRefs = useRef(new Map());

  const ladeVorschau = useCallback(async (anzeigen = true) => {
    if (anzeigen) setVorschau((v) => ({ ...v, laedt: true }));
    const r = await ausgabeVorschauAction({ name });
    if (!r?.ok) setVorschau((v) => ({ ...v, laedt: false, fehler: r?.message || NEWSLETTER.vorschauFehler }));
    else setVorschau({ html: r.html, betreff: r.betreff, stand: new Date().toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }), fehler: null, laedt: false });
  }, [name]);

  useEffect(() => {
    Promise.resolve().then(() => ladeVorschau(false));
  }, [ladeVorschau]);

  // Rückgängig nach „+ Neue Ausgabe“ (Toast im Editor, weil die Liste beim Navigieren abgebaut wird).
  useEffect(() => {
    if (sp.get("angelegt") === "1") {
      zeige(NEWSLETTER.angelegt(monatAusSlug(doc.slug)), {
        art: "ok",
        aktion: {
          titel: "Rückgängig",
          onClick: async () => {
            const r = await ausgabeVerwerfenAction({ name });
            if (r?.ok) router.push("/marketing/newsletter");
            else zeige(r?.message || "Nicht verworfen.", { art: "fehler" });
          },
        },
      });
      router.replace(`/marketing/newsletter/${encodeURIComponent(name)}`, { scroll: false });
    }
    if (sp.get("fokus") === "betreff") betreffRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speichern = useCallback(
    async (werte) => {
      const r = await ausgabeSpeichernAction({ name, modified: modified.current, felder: { betreff: werte.betreff || "(ohne Betreff)" }, bloecke: ohneSchluessel(werte.bloecke) });
      if (r?.ok) {
        modified.current = r.modified;
        if (r.zurueck) zeige(NEWSLETTER.bearbeitetZurueck, { art: "info" });
        router.refresh();
        ladeVorschau();
      } else if (r?.code === "conflict" && r.serverstand) {
        // Rückfall ohne Anwesenheit (E8): Serverstand übernehmen, lokale Änderungen je Block behalten.
        modified.current = r.serverstand.modified;
        zeige("Die Ausgabe wurde inzwischen geändert – deine Änderungen werden erneut gespeichert.", { art: "warnung" });
      }
      return r;
    },
    [name, router, zeige, ladeVorschau]
  );
  const autosave = useAutosave({ speichern, verzoegerung: 1500, aktiv: !nurLesen, startZeit: doc.modified ? String(doc.modified).slice(11, 16) : null });

  const aendern = (neuBetreff, neuBloecke) => {
    if (nurLesen) return;
    autosave.aendern({ betreff: neuBetreff, bloecke: neuBloecke });
  };
  const setzeBlock = (k, felder) => {
    setBloecke((alt) => {
      const neu = alt.map((b) => (b._k === k ? { ...b, ...felder } : b));
      aendern(betreff, neu);
      return neu;
    });
  };
  const verschiebe = (k, art) => {
    setBloecke((alt) => {
      const i = alt.findIndex((b) => b._k === k);
      if (i < 0) return alt;
      const neu = [...alt];
      const [b] = neu.splice(i, 1);
      const ziel = art === "hoch" ? Math.max(0, i - 1) : art === "runter" ? Math.min(alt.length - 1, i + 1) : 0;
      neu.splice(ziel, 0, b);
      aendern(betreff, neu);
      requestAnimationFrame(() => blockRefs.current.get(k)?.querySelector("[data-blockkopf]")?.focus());
      return neu;
    });
  };
  const duplizieren = (k) =>
    setBloecke((alt) => {
      const i = alt.findIndex((b) => b._k === k);
      const kopie = { ...alt[i], _k: schluessel() };
      delete kopie.name;
      const neu = [...alt.slice(0, i + 1), kopie, ...alt.slice(i + 1)];
      aendern(betreff, neu);
      return neu;
    });
  const entfernen = (k) => {
    const alt = bloecke;
    const i = alt.findIndex((b) => b._k === k);
    const weg = alt[i];
    const neu = alt.filter((b) => b._k !== k);
    setBloecke(neu);
    aendern(betreff, neu);
    zeige(NEWSLETTER.blockEntfernt(BLOCK_TEXT[weg.typ]), {
      art: "ok",
      aktion: {
        titel: "Rückgängig",
        onClick: () => {
          const zurueck = [...neu.slice(0, i), weg, ...neu.slice(i)];
          setBloecke(zurueck);
          aendern(betreff, zurueck);
        },
      },
    });
  };
  const hinzu = (typ) => {
    const b = { _k: schluessel(), typ, absender: typ === "brief" ? "Susanne Messmer" : "", titel: typ === "termine" ? "Termine" : "" };
    const neu = [...bloecke, b];
    setBloecke(neu);
    aendern(betreff, neu);
    requestAnimationFrame(() => blockRefs.current.get(b._k)?.querySelector("textarea,input")?.focus());
  };
  const standard = () => {
    const neu = mitSchluessel(["brief", "neueStuecke", "skizze", "termine", "gutZuWissen"].map((typ) => ({ typ, absender: typ === "brief" ? "Susanne Messmer" : "" })));
    setBloecke(neu);
    aendern(betreff, neu);
  };

  // Sprung zum fehlenden Teil (Kopfzeile „Noch nicht bereit“ → ?block=n)
  useEffect(() => {
    const ziel = sp.get("block");
    if (ziel == null) return;
    const b = bloecke[Number(ziel)];
    if (!b) return;
    requestAnimationFrame(() => {
      setMarkiert(b._k);
      setAnsicht("schreiben");
      const el = blockRefs.current.get(b._k);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector("textarea,input")?.focus();
    });
    const t = setTimeout(() => setMarkiert(null), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const tasten = (e, k) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      verschiebe(k, e.key === "ArrowUp" ? "hoch" : "runter");
    }
  };

  const editor = (
    <div className="bo-mar-stapel" data-testid="block-editor">
      <div className="bo-kachel" style={{ padding: 20 }}>
        <label className="bo-mar-feld">
          <span>{NEWSLETTER.felder.betreff}</span>
          <input
            ref={betreffRef}
            className="bo-mar-eingabe bo-mar-eingabe--titel"
            value={betreff}
            maxLength={140}
            disabled={nurLesen}
            placeholder="Worum geht es in diesem Monat?"
            onChange={(e) => {
              setBetreff(e.target.value);
              aendern(e.target.value, bloecke);
            }}
            onBlur={() => autosave.jetzt()}
            data-testid="betreff"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <SpeicherAnzeige autosave={autosave} />
          {vorschau.betreff && <span className="bo-mar-klein">Vorschauzeile wird aus den Blöcken gebildet</span>}
        </div>
      </div>
      {bloecke.length === 0 ? (
        <div className="bo-kachel flex flex-col items-start gap-3" style={{ padding: 24 }}>
          <p className="bo-mar-titel">{NEWSLETTER.bloeckeLeer}</p>
          {!nurLesen && (
            <Knopf icon="Plus" onClick={standard}>
              {NEWSLETTER.standardBloecke}
            </Knopf>
          )}
        </div>
      ) : (
        bloecke.map((b, i) => (
          <BlockKarte
            key={b._k}
            block={b}
            index={i}
            anzahl={bloecke.length}
            name={name}
            events={events}
            nurLesen={nurLesen}
            markiert={markiert === b._k}
            refSetzen={(el) => (el ? blockRefs.current.set(b._k, el) : blockRefs.current.delete(b._k))}
            onFeld={(f) => setzeBlock(b._k, f)}
            onBlur={() => autosave.jetzt()}
            onVerschiebe={(art) => verschiebe(b._k, art)}
            onDuplizieren={() => duplizieren(b._k)}
            onEntfernen={() => entfernen(b._k)}
            onTaste={(e) => tasten(e, b._k)}
          />
        ))
      )}
      {!nurLesen && (
        <div>
          <Menue label="Block hinzufügen" ausloeser={(p) => <Knopf {...p} icon="Plus" iconRechts="ChevronDown" data-testid="block-hinzu">{NEWSLETTER.blockHinzu}</Knopf>}>
            {BLOCK_REIHE.map((t) => (
              <MenuePunkt key={t} onWaehlen={() => hinzu(t)}>
                {BLOCK_TEXT[t]}
              </MenuePunkt>
            ))}
          </Menue>
        </div>
      )}
    </div>
  );

  const vorschauBlock = (
    <div className="bo-kachel" style={{ padding: 20 }}>
      <MailVorschau
        html={vorschau.html}
        titel={NEWSLETTER.vorschauTitel(monatAusSlug(doc.slug), "Vorschau")}
        stand={vorschau.stand}
        laedt={vorschau.laedt}
        fehler={vorschau.fehler}
        onErneut={ladeVorschau}
        werkzeuge={
          vorschau.html ? (
            <Knopf
              size="s"
              variant="ghost"
              icon="Download"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([vorschau.html], { type: "text/html" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = `post-aus-lochau-${doc.slug}.html`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              {NEWSLETTER.html}
            </Knopf>
          ) : null
        }
      />
      {vorschau.betreff && (
        <p className="bo-mar-unter mt-3">
          <b className="font-medium text-(--color-bo-text)">{vorschau.betreff}</b>
        </p>
      )}
    </div>
  );

  return (
    <div className="min-w-0">
      <div className="mb-4 xl:hidden">
        <Segment
          label="Ansicht"
          wert={ansicht}
          onWechsel={setAnsicht}
          optionen={[
            { wert: "schreiben", titel: NEWSLETTER.schreiben },
            { wert: "vorschau", titel: NEWSLETTER.vorschau },
          ]}
        />
      </div>
      <div className="bo-mar-akte bo-mar-akte--breit">
        <div className={ansicht === "vorschau" ? "max-xl:hidden" : ""}>{editor}</div>
        <div className={`bo-mar-akte__rechts ${ansicht === "schreiben" ? "max-xl:hidden" : ""}`}>{vorschauBlock}</div>
      </div>
    </div>
  );
}

function BlockKarte({ block: b, index, anzahl, name, events, nurLesen, markiert, refSetzen, onFeld, onBlur, onVerschiebe, onDuplizieren, onEntfernen, onTaste }) {
  const zustand = blockZustand(b);
  const { zeige } = useToast();
  const [eigen, setEigen] = useState(true);
  const [kunde, setKunde] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [bildFehler, setBildFehler] = useState(null);
  const id = `blk-${b._k}`;
  const zeichen = stripHtml(b.text).length;
  const slot = ["neueStuecke", "skizze"].includes(b.typ);
  const offeneEvents = useMemo(() => events.filter((e) => ["Offen", "Ausgebucht"].includes(e.status)), [events]);

  const bildHochladen = async (datei) => {
    if (!datei) return;
    setBildFehler(null);
    if (!eigen) {
      setBildFehler(NEWSLETTER.eigenesFotoHinweis);
      return;
    }
    setLaedt(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("datei", datei);
    const r = await ausgabeBildAction(fd);
    setLaedt(false);
    if (!r?.ok) {
      setBildFehler(r?.fehler?.datei || r?.message || "Upload fehlgeschlagen – erneut versuchen");
      return;
    }
    onFeld({ bild: r.url, bildquelle: "eigen" });
    zeige("Bild übernommen", { art: "ok" });
  };

  return (
    <section ref={refSetzen} className="bo-mar-block" data-zustand={zustand.art} data-markiert={markiert ? "true" : undefined} aria-labelledby={`${id}-t`} onKeyDown={onTaste} data-testid={`block-${b.typ}`}>
      <div className="bo-mar-block__kopf">
        <span className="bo-mar-block__griff" aria-hidden="true">
          <GripVertical className="size-4" strokeWidth={1.75} />
        </span>
        <h3 id={`${id}-t`} className="bo-mar-block__titel" tabIndex={-1} data-blockkopf>
          {BLOCK_TEXT[b.typ] || b.typ}
        </h3>
        <span className={zustand.art === "dabei" ? "bo-mar-ok inline-flex items-center gap-1 text-[12px] font-medium" : zustand.art === "leer" ? "bo-mar-klein inline-flex items-center gap-1" : "bo-mar-warn inline-flex items-center gap-1 text-[12px] font-medium"} data-testid="block-zustand">
          <Icon name={zustand.art === "dabei" ? "Check" : zustand.art === "leer" ? "CircleDashed" : "Clock"} className="size-3.5" />
          {zustand.art === "dabei" ? NEWSLETTER.blockDabei : zustand.art === "leer" ? NEWSLETTER.blockOptional : NEWSLETTER.blockUnvollstaendig(zustand.grund)}
        </span>
        {!nurLesen && (
          <Menue label={`Blockmenü ${BLOCK_TEXT[b.typ]}`} ausloeser={(p) => <Knopf {...p} size="s" variant="ghost" icon="Ellipsis" label={`Blockmenü ${BLOCK_TEXT[b.typ]}`} />}>
            <MenuePunkt icon="ArrowUp" deaktiviert={index === 0} kuerzel="⌘⇧↑" onWaehlen={() => onVerschiebe("hoch")}>
              {NEWSLETTER.blockMenue.hoch}
            </MenuePunkt>
            <MenuePunkt icon="ArrowDown" deaktiviert={index === anzahl - 1} kuerzel="⌘⇧↓" onWaehlen={() => onVerschiebe("runter")}>
              {NEWSLETTER.blockMenue.runter}
            </MenuePunkt>
            <MenuePunkt icon="ChevronUp" deaktiviert={index === 0} onWaehlen={() => onVerschiebe("anfang")}>
              {NEWSLETTER.blockMenue.anfang}
            </MenuePunkt>
            <MenuePunkt icon="Layers" onWaehlen={onDuplizieren}>
              {NEWSLETTER.blockMenue.duplizieren}
            </MenuePunkt>
            <MenueTrenner />
            <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={onEntfernen}>
              {NEWSLETTER.blockMenue.entfernen}
            </MenuePunkt>
          </Menue>
        )}
      </div>
      {zustand.art === "leer" && slot && <p className="bo-mar-klein -mt-2">Ohne Bild bleibt der Block weg.</p>}
      <div className="bo-mar-felder">
        {b.typ === "brief" && (
          <label className="bo-mar-feld">
            <span>{NEWSLETTER.felder.absender}</span>
            <input className="bo-mar-eingabe" value={b.absender || ""} disabled={nurLesen} onChange={(e) => onFeld({ absender: e.target.value })} onBlur={onBlur} />
          </label>
        )}
        {b.typ !== "brief" && (
          <label className="bo-mar-feld">
            <span>{NEWSLETTER.felder.titel}</span>
            <input className="bo-mar-eingabe" value={b.titel || ""} disabled={nurLesen} onChange={(e) => onFeld({ titel: e.target.value })} onBlur={onBlur} />
          </label>
        )}
        {b.typ === "termine" && (
          <label className="bo-mar-feld">
            <span>{NEWSLETTER.felder.event}</span>
            <select className="bo-mar-eingabe" value={b.event || ""} disabled={nurLesen} onChange={(e) => onFeld({ event: e.target.value })} onBlur={onBlur}>
              <option value="">Kein Event – Text unten</option>
              {events.map((e) => (
                <option key={e.name} value={e.name} disabled={!offeneEvents.includes(e)} aria-disabled={!offeneEvents.includes(e)}>
                  {e.titel} · {String(e.datum).split("-").reverse().join(".")}
                  {!offeneEvents.includes(e) ? " (nicht veröffentlicht)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="bo-mar-feld voll">
          <span>{NEWSLETTER.felder.text}</span>
          <textarea className="bo-mar-eingabe" value={stripHtmlFuerFeld(b.text)} disabled={nurLesen} rows={b.typ === "brief" ? 6 : 3} onChange={(e) => onFeld({ text: e.target.value })} onBlur={onBlur} data-testid={`text-${b.typ}`} />
          {zeichen >= 1200 && <span className="bo-mar-feld__hinweis">{NEWSLETTER.langFuerMail(zeichen)}</span>}
        </label>
        {slot && (
          <>
            <div className="bo-mar-feld voll">
              <span>{NEWSLETTER.felder.bild}</span>
              <div className="flex flex-wrap items-center gap-4">
                {b.bild ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.bild} alt={b.bild_alt || ""} className="h-16 w-24 rounded-[14px] object-cover" />
                ) : (
                  <span className="grid h-16 w-24 place-items-center rounded-[14px] bg-(--color-bo-fill) text-(--color-bo-text-faint)">
                    <Icon name="Eye" className="size-5" />
                  </span>
                )}
                {!nurLesen && (
                  <label className="bo-knopf bo-knopf--secondary inline-flex cursor-pointer items-center gap-2" aria-busy={laedt || undefined}>
                    <Icon name="Download" className="size-4" />
                    <span>{b.bild ? "Bild ersetzen" : "Bild wählen"}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => bildHochladen(e.target.files?.[0])} />
                  </label>
                )}
                {b.bild && !nurLesen && (
                  <Knopf size="s" variant="ghost" icon="X" onClick={() => onFeld({ bild: "", bildquelle: "" })}>
                    Entfernen
                  </Knopf>
                )}
              </div>
              {bildFehler && (
                <span className="bo-mar-feld__fehler" role="alert">
                  {bildFehler}
                </span>
              )}
              <label className="bo-mar-haken mt-2">
                <input type="checkbox" checked={eigen} disabled={nurLesen} onChange={(e) => setEigen(e.target.checked)} />
                <span>{NEWSLETTER.eigenesFoto}</span>
              </label>
              {!eigen && <span className="bo-mar-feld__hinweis">{NEWSLETTER.eigenesFotoHinweis}</span>}
              <label className="bo-mar-haken">
                <input type="checkbox" checked={kunde} disabled={nurLesen} onChange={(e) => setKunde(e.target.checked)} />
                <span>{NEWSLETTER.kundenprojekt}</span>
              </label>
              {kunde && <span className="bo-mar-feld__hinweis">Der Freigabe-Dialog fragt die Einwilligung „Foto-Referenz“ ab.</span>}
            </div>
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.bild_alt}</span>
              <input className="bo-mar-eingabe" value={b.bild_alt || ""} disabled={nurLesen} onChange={(e) => onFeld({ bild_alt: e.target.value })} onBlur={onBlur} aria-invalid={b.bild && !b.bild_alt ? "true" : undefined} />
            </label>
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.marke}</span>
              <input className="bo-mar-eingabe" value={b.marke || ""} disabled={nurLesen} onChange={(e) => onFeld({ marke: e.target.value })} onBlur={onBlur} />
              <span className="bo-mar-feld__hinweis">{NEWSLETTER.markeHinweis}</span>
            </label>
          </>
        )}
        {b.typ !== "brief" && b.typ !== "arbeitsweise" && (
          <>
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.url}</span>
              <input className="bo-mar-eingabe" type="url" value={b.url || ""} disabled={nurLesen} onChange={(e) => onFeld({ url: e.target.value })} onBlur={onBlur} />
            </label>
            <label className="bo-mar-feld">
              <span>{NEWSLETTER.felder.link_label}</span>
              <input className="bo-mar-eingabe" value={b.link_label || ""} disabled={nurLesen} onChange={(e) => onFeld({ link_label: e.target.value })} onBlur={onBlur} />
            </label>
          </>
        )}
      </div>
    </section>
  );
}

/** Editor zeigt Absätze als Text (Absätze durch Leerzeile); gespeichert wird Text, die Vorschau bildet Absätze. */
function stripHtmlFuerFeld(t) {
  const s = String(t ?? "");
  if (!/<[a-z][\s\S]*>/i.test(s)) return s;
  return s.replace(/<\/p>\s*<p>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}
