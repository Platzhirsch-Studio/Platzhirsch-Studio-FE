"use client";
// Glocke v2 (G-15): runder Knopf mit Cognac-Zähler (federt nur bei Zunahme), Panel als schwebendes
// Material mit Reitern „Für mich · Team · System“ (Segment mit gleitendem Indikator), Gruppen
// Heute/Gestern/Älter, Freigaben als FreigabeEintrag. Tasten (Kontext „glocke“): ↑↓ wählen, Enter
// öffnen, ←→ Reiter, R gelesen, Umschalt+R alle gelesen, F Freigabe öffnen, Esc schließt.
// Aktualisierung: /api/ereignisse (SSE, startet 4 s nach dem Laden, ereignisstrom.js), Rückfall Polling 60 s.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Popover from "../Overlay/Popover";
import Segment from "../Segment";
import { Icon } from "../icons";
import cx from "../cx";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { GLOCKE_TABS, gruppiereNachTag, zaehlerSteigt } from "@/lib/backoffice/benachrichtigungen";
import { gelesenAction, glockeLadenAction } from "./aktionen";
import FreigabeEintrag from "./FreigabeEintrag";
import { useEreignisse } from "./ereignisstrom";
import { TEXTE } from "./texte";

const ICON = { aufgabe: "CheckSquare", freigabe: "BadgeCheck", mitteilung: "Bell" };

/** Laufende Nummer je Eintrag über alle Gruppen (Tastatur-Auswahl). */
function nummeriere(gruppen) {
  let i = 0;
  return gruppen.map((g) => ({ ...g, eintraege: g.eintraege.map((e) => ({ ...e, i: i++ })) }));
}

/**
 * @param {{start:{anzahl:number, tabs:object, stand:string}, aufgabenHref?:string|null}} props
 */
export default function Glocke({ start, aufgabenHref = "/d/ph-aufgabe" }) {
  const router = useRouter();
  const [glocke, setGlocke] = useState(start);
  const [offen, setOffen] = useState(false);
  const [tab, setTab] = useState("fuer-mich");
  const [aktiv, setAktiv] = useState(0);
  const [pop, setPop] = useState(0);
  const [fehler, setFehler] = useState(false);
  const liste = useRef(null);
  const anzahlRef = useRef(start?.anzahl ?? 0);

  const uebernehme = useCallback((neu) => {
    if (zaehlerSteigt(anzahlRef.current, neu.anzahl)) setPop((p) => p + 1);
    anzahlRef.current = neu.anzahl;
    setGlocke(neu);
  }, []);

  const laden = useCallback(async () => {
    const r = await glockeLadenAction().catch(() => null);
    if (r?.ok) {
      setFehler(false);
      uebernehme(r.glocke);
    } else setFehler(true);
  }, [uebernehme]);

  // Ereignisstrom: bei geändertem Stand die Liste nachladen.
  useEreignisse({
    onGlocke: (z) => {
      if (z?.stand && z.stand !== glocke?.stand) laden();
    },
  });

  const eintraege = glocke?.tabs?.[tab] || [];
  const gruppen = nummeriere(gruppiereNachTag(eintraege));
  const flach = gruppen.flatMap((g) => g.eintraege);
  const zaehler = Object.fromEntries(GLOCKE_TABS.map((t) => [t, (glocke?.tabs?.[t] || []).filter((e) => !e.gelesen).length]));

  const markiere = useCallback(
    async (ids) => {
      if (!ids.length) return;
      setGlocke((g) => {
        const tabs = Object.fromEntries(Object.entries(g.tabs).map(([k, l]) => [k, l.map((e) => (ids.includes(e.id) ? { ...e, gelesen: true } : e))]));
        const anzahl = tabs["fuer-mich"].filter((e) => !e.gelesen).length;
        anzahlRef.current = anzahl;
        return { ...g, tabs, anzahl };
      });
      await gelesenAction({ ids }).catch(() => null);
    },
    []
  );

  const oeffne = (e) => {
    if (!e) return;
    if (!e.gelesen) markiere([e.id]);
    if (e.href) {
      setOffen(false);
      router.push(e.href);
    }
  };

  const wechsleTab = (richtung) => {
    const i = GLOCKE_TABS.indexOf(tab);
    setTab(GLOCKE_TABS[(i + richtung + GLOCKE_TABS.length) % GLOCKE_TABS.length]);
    setAktiv(0);
  };

  useKuerzel(
    "glocke",
    {
      "glocke.naechste": () => setAktiv((a) => Math.min(flach.length - 1, a + 1)),
      "glocke.vorige": () => setAktiv((a) => Math.max(0, a - 1)),
      "glocke.oeffnen": (ev) => {
        if (ev.target?.closest?.("button, a, textarea, input")) return false;
        oeffne(flach[aktiv]);
      },
      "glocke.tab-links": () => wechsleTab(-1),
      "glocke.tab-rechts": () => wechsleTab(1),
      "glocke.gelesen": () => flach[aktiv] && markiere([flach[aktiv].id]),
      "glocke.alle-gelesen": () => markiere(flach.filter((e) => !e.gelesen).map((e) => e.id)),
      "glocke.freigeben": () => {
        const f = flach.findIndex((e) => e.art === "freigabe");
        if (f >= 0) setAktiv(f);
        return f >= 0 ? undefined : false;
      },
      "glocke.schliessen": () => setOffen(false),
    },
    { aktiv: offen }
  );

  useEffect(() => {
    if (!offen) return;
    liste.current?.querySelector(`[data-index="${aktiv}"]`)?.scrollIntoView({ block: "nearest" });
  }, [aktiv, offen]);

  const anzahl = glocke?.anzahl ?? 0;
  const erledigt = (id) => {
    setGlocke((g) => {
      const tabs = Object.fromEntries(Object.entries(g.tabs).map(([k, l]) => [k, l.filter((e) => e.id !== id)]));
      return { ...g, tabs, anzahl: tabs["fuer-mich"].filter((e) => !e.gelesen).length };
    });
  };

  return (
    <Popover
      label={TEXTE.glocke}
      platzierung="unten-ende"
      breite={400}
      offen={offen}
      onOffen={(o) => {
        setOffen(o);
        if (o) {
          setAktiv(0);
          laden();
        }
      }}
      testid="glocke-panel"
      ausloeser={(p) => (
        <button {...p} type="button" className="bo-rund bo-tip bo-ziel bo-schale-werkzeug" aria-label={TEXTE.glockeLabel(anzahl)} data-tip={TEXTE.glocke} data-testid="glocke">
          <Icon name="Bell" className="size-5" />
          {anzahl > 0 && (
            <span key={pop} aria-hidden="true" className={cx("bo-rund__badge", pop > 0 && "bo-anim-pop")}>
              {anzahl > 99 ? "99+" : anzahl}
            </span>
          )}
        </button>
      )}
    >
      <div className="bo-schale-glocke">
        <div className="bo-schale-glocke__kopf">
          <h2 className="bo-titel-kachel">{TEXTE.glocke}</h2>
          {zaehler[tab] > 0 && (
            <button type="button" className="bo-schale-textknopf" onClick={() => markiere(eintraege.filter((e) => !e.gelesen).map((e) => e.id))}>
              {TEXTE.alleGelesen}
            </button>
          )}
        </div>
        <Segment
          label={TEXTE.glocke}
          wert={tab}
          onWechsel={(w) => {
            setTab(w);
            setAktiv(0);
          }}
          groesse="s"
          breit
          optionen={GLOCKE_TABS.map((t) => ({ wert: t, titel: TEXTE.glockeTabs[t], anzahl: zaehler[t] || undefined, testid: `glocke-tab-${t}` }))}
        />
        <div ref={liste} className="bo-schale-glocke__liste" role="list" aria-label={TEXTE.glockeTabs[tab]}>
          {fehler && !flach.length && <p className="bo-schale-leer">{TEXTE.glockeFehler}</p>}
          {!fehler && !flach.length && (
            <p className="bo-schale-leer">
              <span className="bo-schale-symbol" aria-hidden="true">
                <Icon name="Check" className="size-4" />
              </span>
              {TEXTE.glockeLeer[tab]}
            </p>
          )}
          {gruppen.map((g) => (
            <section key={g.schluessel} aria-label={TEXTE.glockeGruppen[g.schluessel]} className="bo-schale-glocke__gruppe">
              <h3 className="bo-schale-gruppentitel">{TEXTE.glockeGruppen[g.schluessel]}</h3>
              {g.eintraege.map((e) => {
                const { i } = e;
                if (e.art === "freigabe") {
                  return (
                    <div key={e.id} role="listitem" data-index={i} data-aktiv={i === aktiv ? "true" : undefined} className="bo-schale-glocke__frei" onPointerEnter={() => setAktiv(i)}>
                      <FreigabeEintrag eintrag={e} onErledigt={erledigt} />
                    </div>
                  );
                }
                const Tag = e.href ? Link : "div";
                return (
                  <div key={e.id} role="listitem" data-index={i}>
                    <Tag
                      {...(e.href ? { href: e.href, onClick: () => { if (!e.gelesen) markiere([e.id]); setOffen(false); } } : {})}
                      className="bo-schale-zeile"
                      data-aktiv={i === aktiv ? "true" : undefined}
                      onPointerEnter={() => setAktiv(i)}
                    >
                      <span className={cx("bo-schale-symbol", e.dringend && "bo-schale-symbol--warn")} aria-hidden="true">
                        <Icon name={ICON[e.art] || "Bell"} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="bo-schale-zeile__titel">{e.titel}</span>
                        {e.hinweis && <span className="bo-schale-klein block truncate">{e.hinweis}</span>}
                      </span>
                      {!e.gelesen && (
                        <span className="bo-schale-neu">
                          <span className="sr-only">{TEXTE.neuPunkt}</span>
                        </span>
                      )}
                    </Tag>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
        <div className="bo-schale-glocke__fuss">
          {aufgabenHref && (
            <Link href={aufgabenHref} className="bo-schale-textknopf" onClick={() => setOffen(false)}>
              {TEXTE.alleAufgaben}
            </Link>
          )}
          <span className="bo-schale-tasten" aria-hidden="true">
            {TEXTE.glockeTasten}
          </span>
        </div>
      </div>
    </Popover>
  );
}

