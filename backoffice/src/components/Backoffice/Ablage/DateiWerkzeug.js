"use client";
// Aktionen an Dateien – ein Hook für Drive, Datei-Akte, Papierkorb, Freigaben und Akten-Slots (Konzept §4):
// Rechte/Gründe aus regeln.dateiAktionen, Undo nach Q-C3 (Papierkorb/Wiederherstellen sofort + Rückgängig,
// Portal = verzögerter Commit 8 s), Bestätigung nur nach Q-C6 (endgültig löschen, Sperre aufheben).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, FolderOpen, Search } from "lucide-react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Bestaetigen from "../Bestaetigen";
import { MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { AUFBEWAHRUNG, KLASSEN } from "@/lib/backoffice/ablage/labels";
import { aufbewahrenBis, dateiAktionen, stamm } from "@/lib/backoffice/ablage/regeln";
import {
  aufbewahrungAction, endgueltigLoeschenAction, entsperrenAction, loeschenAction, ordnerSucheAction, ordnerZweigAction, portalPlanenAction,
  sperrenAction, tagsAction, umbenennenAction, verschiebenAction, versionWiederherstellenAction, wiederherstellenAction,
} from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";
import TeilenDialog from "./TeilenDialog";
import { datumKurz } from "./zeit";

export const ladenHref = (d, { inline = false, version } = {}) => `/ablage/laden/${encodeURIComponent(d.datei)}${inline || version ? "?" : ""}${inline ? "inline=1" : ""}${inline && version ? "&" : ""}${version ? `v=${version}` : ""}`;

/**
 * @param {object} p
 * @param {object} p.info          infoFuerClient()
 * @param {string[]} p.rollen
 * @param {string} p.user
 * @param {boolean} p.schreiben
 * @param {(d:object)=>void} [p.onGeaendert]   Datei hat sich geändert (neue Antwort)
 * @param {(d:object)=>void} [p.onEntfernt]    Datei verlässt die aktuelle Liste (Papierkorb, Wiederherstellen, Verschieben)
 * @param {(datei:File, d:object)=>void} [p.onNeueVersion]
 * @param {boolean} [p.linkMailen]           Fähigkeit ablage.link_mailen an
 */
export default function useDateiWerkzeug({ info, rollen = [], user, schreiben, onGeaendert, onEntfernt, onNeueVersion, linkMailen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [dialog, setDialog] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const versionRef = useRef(null);
  const versionZiel = useRef(null);

  const rechte = useCallback((d) => dateiAktionen(d, { user, rollen, schreiben, portal: !!info?.portal }), [user, rollen, schreiben, info?.portal]);
  const fertig = useCallback(() => router.refresh(), [router]);
  const fehler = useCallback((r) => zeige(r?.message || T.toast.fehler, { art: "fehler" }), [zeige]);

  const h = useMemo(() => {
    const geaendert = (d) => {
      onGeaendert?.(d);
      fertig();
    };
    return {
      herunterladen: (d) => {
        window.location.href = ladenHref(d);
      },
      oeffnenInline: (d) => window.open(ladenHref(d, { inline: true }), "_blank", "noopener"),
      teilen: (d) => setDialog({ art: "teilen", d }),
      umbenennen: (d) => setDialog({ art: "umbenennen", d }),
      verschieben: (d) => setDialog({ art: "verschieben", d }),
      tags: (d) => setDialog({ art: "tags", d }),
      aufbewahrung: (d) => setDialog({ art: "aufbewahrung", d }),
      aufheben: (d) => setDialog({ art: "aufheben", d }),
      endgueltig: (d) => setDialog({ art: "endgueltig", d }),
      neueVersion: (d) => {
        versionZiel.current = d;
        versionRef.current?.click();
      },
      auschecken: async (d) => {
        const r = await sperrenAction({ datei: d.datei });
        if (!r.ok) return fehler(r);
        zeige(T.toast.ausgecheckt, { art: "ok" });
        geaendert(r.daten);
      },
      einchecken: async (d) => {
        const r = await entsperrenAction({ datei: d.datei });
        if (!r.ok) return fehler(r);
        zeige(T.toast.eingecheckt, { art: "ok" });
        geaendert(r.daten);
      },
      papierkorb: async (d) => {
        onEntfernt?.(d);
        const r = await loeschenAction({ datei: d.datei });
        if (!r.ok) {
          onGeaendert?.(d);
          fertig();
          return fehler(r);
        }
        zeige(T.toast.papierkorb(d.dateiname), {
          art: "ok",
          icon: "Trash2",
          aktion: {
            titel: T.toast.rueckgaengig,
            onClick: async () => {
              const z = await wiederherstellenAction({ datei: d.datei });
              if (!z.ok) return fehler(z);
              zeige(T.toast.rueckgaengigFertig, { art: "info" });
              geaendert(z.daten);
            },
          },
        });
        fertig();
      },
      wiederherstellen: async (d) => {
        onEntfernt?.(d);
        const r = await wiederherstellenAction({ datei: d.datei });
        if (!r.ok) {
          fertig();
          return fehler(r);
        }
        zeige(T.toast.wiederhergestellt(d.dateiname), {
          art: "ok",
          aktion: {
            titel: T.toast.rueckgaengig,
            onClick: async () => {
              const z = await loeschenAction({ datei: d.datei });
              if (!z.ok) return fehler(z);
              zeige(T.toast.rueckgaengigFertig, { art: "info" });
              fertig();
            },
          },
        });
        fertig();
      },
      portal: async (d, an = true) => {
        const r = await portalPlanenAction({ datei: d.datei, freigeben: an });
        if (!r.ok) return fehler(r);
        onGeaendert?.({ ...d, portal_freigabe: an ? 1 : 0 });
        starte(an ? T.toast.portal : T.toast.portalZurueck, {
          token: r.token,
          ms: r.ms,
          objekt: r.objekt,
          gruppe: "ablage.portal",
          fehlerText: an ? "Portal-Freigabe" : "Portal-Rücknahme",
          onVerworfen: () => onGeaendert?.(d),
          onFehler: () => onGeaendert?.(d),
        });
      },
      versionWiederherstellen: async (d, version) => {
        const r = await versionWiederherstellenAction({ datei: d.datei, version });
        if (!r.ok) return fehler(r);
        zeige(T.toast.versionWiederhergestellt(version), { art: "ok" });
        geaendert(r.daten);
      },
    };
  }, [fehler, fertig, onEntfernt, onGeaendert, starte, zeige]);

  /** Menüpunkte für „Mehr“ / Kontextmenü (ohne die Kreise des Panels). */
  const menue = useCallback(
    (d, { ohne = [] } = {}) => {
      const a = rechte(d);
      const punkt = (id, icon, titel, fn, extra = {}) => {
        if (ohne.includes(id)) return null;
        const r = a[id];
        if (!r?.an && !r?.grund) return null;
        return (
          <MenuePunkt key={id} icon={icon} onWaehlen={() => fn(d)} deaktiviert={!r.an} grund={r.grund || undefined} testid={`abl-menue-${id}`} {...extra}>
            {titel}
          </MenuePunkt>
        );
      };
      if (d.status === "Papierkorb") {
        return [punkt("wiederherstellen", "RotateCcw", T.aktionen.wiederherstellen, h.wiederherstellen), punkt("endgueltig", "Trash2", T.aktionen.endgueltig, h.endgueltig, { gefaehrlich: true })].filter(Boolean);
      }
      const eintraege = [
        punkt("herunterladen", "Download", T.aktionen.herunterladen, h.herunterladen),
        punkt("teilen", "Share2", T.aktionen.teilen, h.teilen),
        <MenueTrenner key="t1" />,
        punkt("umbenennen", "Pencil", T.aktionen.umbenennen, h.umbenennen),
        punkt("verschieben", "ArrowRight", T.aktionen.verschieben, h.verschieben),
        punkt("neueVersion", "RefreshCw", T.aktionen.neueVersion, h.neueVersion),
        a.einchecken.an ? punkt("einchecken", "CircleCheck", T.aktionen.einchecken, h.einchecken) : punkt("auschecken", "Lock", T.aktionen.auschecken, h.auschecken),
        a.aufheben.an ? punkt("aufheben", "Lock", T.aktionen.aufheben, h.aufheben) : null,
        punkt("tags", "Tag", T.aktionen.tags, h.tags),
        punkt("aufbewahrung", "Shield", T.aktionen.aufbewahrung, h.aufbewahrung),
        d.portal_freigabe ? punkt("portal", "Users", T.aktionen.portalZurueck, (x) => h.portal(x, false)) : punkt("portal", "Users", T.aktionen.portal, (x) => h.portal(x, true)),
        <MenueTrenner key="t2" />,
        punkt("papierkorb", "Trash2", T.aktionen.papierkorb, h.papierkorb, { gefaehrlich: true }),
      ].filter(Boolean);
      // Trenner nicht am Rand/doppelt
      return eintraege.filter((e, i, l) => e.type !== MenueTrenner || (i > 0 && i < l.length - 1 && l[i - 1].type !== MenueTrenner));
    },
    [h, rechte]
  );

  const schliessen = () => {
    if (!laeuft) setDialog(null);
  };

  const dialoge = (
    <>
      <input
        ref={versionRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && versionZiel.current) onNeueVersion?.(f, versionZiel.current);
        }}
      />
      {dialog?.art === "teilen" && <TeilenDialog datei={dialog.d} info={info} offen onSchliessen={() => setDialog(null)} onGeaendert={(d) => onGeaendert?.(d)} portalErlaubt={rechte(dialog.d).portal} onPortal={(an) => h.portal(dialog.d, an)} linkMailen={linkMailen} />}
      {dialog?.art === "umbenennen" && <UmbenennenDialog d={dialog.d} onSchliessen={schliessen} onFertig={(neu) => (setDialog(null), onGeaendert?.(neu), fertig(), zeige(T.toast.umbenannt(neu.dateiname), { art: "ok" }))} />}
      {dialog?.art === "verschieben" && (
        <VerschiebenDialog
          d={dialog.d}
          onSchliessen={schliessen}
          onFertig={(neu, ziel) => {
            setDialog(null);
            onEntfernt?.(dialog.d);
            fertig();
            zeige(T.toast.verschoben(ziel.titel), {
              art: "ok",
              aktion: {
                titel: T.toast.rueckgaengig,
                onClick: async () => {
                  const z = await verschiebenAction({ datei: neu.datei, ordner: dialog.d.ordner });
                  if (!z.ok) return fehler(z);
                  zeige(T.toast.rueckgaengigFertig, { art: "info" });
                  fertig();
                },
              },
            });
          }}
        />
      )}
      {dialog?.art === "tags" && <TagsDialog d={dialog.d} onSchliessen={schliessen} onFertig={(neu) => (setDialog(null), onGeaendert?.(neu), fertig(), zeige(T.toast.tags, { art: "ok" }))} />}
      {dialog?.art === "aufbewahrung" && <AufbewahrungDialog d={dialog.d} onSchliessen={schliessen} onFertig={(neu) => (setDialog(null), onGeaendert?.(neu), fertig(), zeige(T.toast.aufbewahrung(neu.aufbewahrungsklasse), { art: "ok" }))} />}
      <Bestaetigen
        offen={dialog?.art === "endgueltig"}
        titel={dialog?.art === "endgueltig" ? T.dialog.endgueltigFrage(dialog.d.dateiname) : ""}
        text={T.dialog.endgueltigText}
        bestaetigen="Endgültig löschen"
        gefaehrlich
        laeuft={laeuft}
        testid="abl-endgueltig"
        onAbbrechen={schliessen}
        onBestaetigen={async () => {
          const d = dialog.d;
          setLaeuft(true);
          const r = await endgueltigLoeschenAction({ datei: d.datei });
          setLaeuft(false);
          setDialog(null);
          if (!r.ok) return fehler(r);
          onEntfernt?.(d);
          zeige(T.toast.endgueltig(d.dateiname), { art: "ok" });
          fertig();
        }}
      />
      <Bestaetigen
        offen={dialog?.art === "aufheben"}
        titel={dialog?.art === "aufheben" ? T.dialog.aufhebenFrage(dialog.d.gesperrt_von || "") : ""}
        text={T.dialog.aufhebenText}
        bestaetigen="Aufheben"
        laeuft={laeuft}
        onAbbrechen={schliessen}
        onBestaetigen={async () => {
          const d = dialog.d;
          setLaeuft(true);
          const r = await entsperrenAction({ datei: d.datei, erzwingen: true });
          setLaeuft(false);
          setDialog(null);
          if (!r.ok) return fehler(r);
          zeige(T.toast.aufgehoben, { art: "ok" });
          onGeaendert?.(r.daten);
          fertig();
        }}
      />
    </>
  );

  return { h, rechte, menue, dialoge };
}

// ------------------------------------------------------------------ Dialoge --

function Feld({ id, label, hinweis, fehler, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-bo-text-soft">
        {label}
      </label>
      {children}
      {fehler ? (
        <p className="text-xs text-bo-ziegel-text" role="alert">
          {fehler}
        </p>
      ) : (
        hinweis && <p className="text-xs text-bo-text-faint">{hinweis}</p>
      )}
    </div>
  );
}

function UmbenennenDialog({ d, onSchliessen, onFertig }) {
  const [name, setName] = useState(stamm(d.dateiname));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const senden = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return setFehler(T.upload.nameLeer);
    setLaeuft(true);
    const r = await umbenennenAction({ datei: d.datei, dateiname: name.trim() });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    onFertig(r.daten);
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.umbenennen}
      sperren={laeuft}
      testid="abl-umbenennen"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
            {T.dialog.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft}>
            {T.dialog.umbenennen}
          </Knopf>
        </>
      }
    >
      <form onSubmit={senden}>
        <Feld id="abl-neuer-name" label={T.dialog.neuerName} hinweis={d.endung ? T.dialog.endungBleibt(d.endung) : null} fehler={fehler}>
          <input id="abl-neuer-name" className="bo-input" value={name} onChange={(e) => (setName(e.target.value), setFehler(null))} autoFocus maxLength={180} />
        </Feld>
      </form>
    </Dialog>
  );
}

function TagsDialog({ d, onSchliessen, onFertig }) {
  const [tags, setTags] = useState((d.tags || []).join(", "));
  const [text, setText] = useState(d.beschreibung || "");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const senden = async () => {
    setLaeuft(true);
    const r = await tagsAction({ datei: d.datei, tags: tags.split(/[,;\n]+/), beschreibung: text });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    onFertig(r.daten);
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.tagsTitel}
      groesse="md"
      sperren={laeuft}
      testid="abl-tags"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
            {T.dialog.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft}>
            {T.dialog.speichern}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Feld id="abl-tags-feld" label={T.dialog.tags} hinweis={T.dialog.tagsHinweis} fehler={fehler}>
          <input id="abl-tags-feld" className="bo-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Rendering, Kunde" />
        </Feld>
        <Feld id="abl-beschreibung" label={T.dialog.beschreibung}>
          <textarea id="abl-beschreibung" className="bo-input min-h-24" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        </Feld>
      </div>
    </Dialog>
  );
}

function AufbewahrungDialog({ d, onSchliessen, onFertig }) {
  const [klasse, setKlasse] = useState(d.aufbewahrungsklasse || "Allgemein");
  const [belegdatum, setBelegdatum] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const bis = aufbewahrenBis(klasse, belegdatum || new Date());
  const senden = async () => {
    setLaeuft(true);
    const r = await aufbewahrungAction({ datei: d.datei, klasse, belegdatum: belegdatum || undefined });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    onFertig(r.daten);
  };
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.aufbewahrungTitel}
      groesse="md"
      sperren={laeuft}
      testid="abl-aufbewahrung"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
            {T.dialog.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft}>
            {T.dialog.speichern}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-bo-text-soft">{T.dialog.klasse}</legend>
          {KLASSEN.map((k) => (
            <label key={k} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-bo-surface-2 px-4 py-3 has-[:checked]:bg-bo-fill-2 has-[:checked]:shadow-[inset_3px_0_0_var(--color-bo-text)]">
              <input type="radio" name="abl-klasse" value={k} checked={klasse === k} onChange={() => setKlasse(k)} className="mt-1 accent-[var(--color-bo-text)]" />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{k}</span>
                <span className="text-xs text-bo-text-soft">{AUFBEWAHRUNG[k].hinweis}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {AUFBEWAHRUNG[klasse].jahre > 0 && (
          <Feld id="abl-belegdatum" label={T.dialog.belegdatum} fehler={fehler}>
            <Datumsfeld id="abl-belegdatum" value={belegdatum} onChange={setBelegdatum} />
          </Feld>
        )}
        {klasse === "Beleg" && bis && (
          <p className="bo-abl-hinweis" data-ton="eiche">
            {T.dialog.belegFolge(datumKurz(bis))}
          </p>
        )}
        {fehler && AUFBEWAHRUNG[klasse].jahre === 0 && (
          <p className="text-xs text-bo-ziegel-text" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function VerschiebenDialog({ d, onSchliessen, onFertig }) {
  const [q, setQ] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [ebene, setEbene] = useState({ ordner: null, titel: T.baum.alleOrdner, kinder: null, pfad: [] });
  const [wahl, setWahl] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const lade = useCallback(async (ordner, titel, pfad) => {
    const r = await ordnerZweigAction({ ordner: ordner || undefined });
    setEbene({ ordner, titel, kinder: r.ok ? r.daten : [], pfad });
  }, []);
  const suchTimer = useRef(null);
  useEffect(() => {
    let aktiv = true;
    ordnerZweigAction({}).then((r) => aktiv && setEbene({ ordner: null, titel: T.baum.alleOrdner, kinder: r.ok ? r.daten : [], pfad: [] }));
    return () => {
      aktiv = false;
    };
  }, []);
  const suche = (wert) => {
    setQ(wert);
    clearTimeout(suchTimer.current);
    if (wert.trim().length < 2) return setTreffer(null);
    suchTimer.current = setTimeout(async () => {
      const r = await ordnerSucheAction({ q: wert });
      setTreffer(r.ok ? r.daten : []);
    }, 200);
  };
  const senden = async () => {
    if (!wahl) return;
    setLaeuft(true);
    const r = await verschiebenAction({ datei: d.datei, ordner: wahl.ordner });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    onFertig(r.daten, wahl);
  };
  const liste = treffer ?? ebene.kinder ?? [];
  return (
    <Dialog
      offen
      onSchliessen={onSchliessen}
      titel={T.dialog.verschieben}
      text={d.dateiname}
      groesse="md"
      sperren={laeuft}
      testid="abl-verschieben"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
            {T.dialog.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} disabled={!wahl || wahl.ordner === d.ordner}>
            {wahl ? `${T.dialog.verschieben} nach „${wahl.titel}“` : T.dialog.verschieben}
          </Knopf>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="bo-suche h-11">
          <Search className="size-4 text-bo-text-faint" aria-hidden="true" />
          <input value={q} onChange={(e) => suche(e.target.value)} placeholder={T.dialog.zielSuche} aria-label={T.dialog.zielSuche} />
        </label>
        {!treffer && ebene.pfad.length > 0 && (
          <nav className="bo-abl-pfad" aria-label={T.dialog.ziel}>
            <button type="button" className="bo-abl-chip" onClick={() => lade(null, T.baum.alleOrdner, [])}>
              {T.baum.alleOrdner}
            </button>
            {ebene.pfad.map((p, i) => (
              <button key={p.ordner} type="button" className="bo-abl-chip" onClick={() => lade(p.ordner, p.titel, ebene.pfad.slice(0, i + 1))}>
                {p.titel}
              </button>
            ))}
          </nav>
        )}
        <ul className="flex max-h-80 flex-col gap-1 overflow-auto" role="listbox" aria-label={T.dialog.ziel}>
          {liste.map((o) => {
            const gewaehlt = wahl?.ordner === o.ordner;
            return (
              <li key={o.ordner} className="flex items-center gap-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={gewaehlt}
                  onClick={() => setWahl({ ordner: o.ordner, titel: o.titel })}
                  className={`flex min-h-11 flex-1 items-center gap-3 rounded-xl px-3 text-left text-sm ${gewaehlt ? "bg-bo-text text-bo-surface" : "hover:bg-bo-fill"}`}
                >
                  {gewaehlt ? <FolderOpen className="size-4" /> : <Folder className="size-4 text-bo-text-soft" />}
                  <span className="min-w-0 flex-1 truncate">{o.titel}</span>
                  {o.pfad && treffer && <span className="truncate text-xs opacity-70">{o.pfad}</span>}
                </button>
                {!treffer && (o.hat_kinder || (o.kinder || []).length > 0) ? (
                  <Knopf variant="ghost" size="s" icon="ChevronRight" label={`${o.titel} öffnen`} onClick={() => lade(o.ordner, o.titel, [...ebene.pfad, { ordner: o.ordner, titel: o.titel }])} />
                ) : null}
              </li>
            );
          })}
          {liste.length === 0 && <li className="px-3 py-6 text-center text-sm text-bo-text-soft">{treffer ? T.leer.suche(q).titel : T.baum.leer}</li>}
        </ul>
        {fehler && (
          <p className="text-xs text-bo-ziegel-text" role="alert">
            {fehler}
          </p>
        )}
      </div>
    </Dialog>
  );
}
