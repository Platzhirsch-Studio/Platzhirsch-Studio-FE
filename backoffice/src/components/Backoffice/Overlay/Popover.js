"use client";
// G-06 Popover, Menü, Kontextmenü im Lounge-Stil (Team P0-4).
// Schwebendes Material (blur 40, saturate 180 %, 0,5-px-Lichtkante, Schatten „float“), Radius 20,
// Einträge als Flächen ohne Linien. Liegt im Top-Layer ([popover="manual"]) und bleibt dabei im
// DOM beim Auslöser – funktioniert damit auch in Dialogen und Sheets. Flip + 8 px Abstand,
// unter 640 px Bottom-Sheet mit Griff. Öffnen mit sanfter Feder (.bo-menue aus bo-motion.css),
// Schließen sofort. Esc, Klick daneben und Tab hinaus schließen; der Fokus kehrt zum Auslöser zurück.

import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import cx from "../cx";
import { Icon } from "../icons";
import { halteFokus, useIsoLayoutEffect, useSchmal } from "./hilfen";
import { naechsterIndex, platziere, platziereAmPunkt, tippSuche } from "./logik";
import "./overlay.css";

const MenueKontext = createContext(null);

/**
 * Inneres Panel im Top-Layer. Positioniert sich am Anker (Element) oder Punkt (Kontextmenü).
 * @param {object} p
 * @param {boolean} p.offen
 * @param {() => void} p.onSchliessen
 * @param {{current: HTMLElement|null}} [p.anker]
 * @param {boolean} [p.ankerAusnehmen]  Klick auf den Anker zählt nicht als „daneben“ (Auslöser schaltet selbst)
 * @param {{x:number,y:number}|null} [p.punkt]
 * @param {"menu"|"dialog"} [p.rolle]
 * @param {string} [p.platzierung]
 * @param {string} [p.label]
 * @param {string} [p.labelledBy]
 * @param {boolean} [p.fokusfalle]
 * @param {number} [p.breite]  Mindestbreite in px
 * @param {string} [p.id]
 */
function SchwebePanel({ offen, onSchliessen, anker, ankerAusnehmen = true, punkt, rolle = "dialog", platzierung = "unten-start", label, labelledBy, fokusfalle = false, breite, id, className, testid, children }) {
  const huelle = useRef(null);
  const panel = useRef(null);
  const schmal = useSchmal();
  const tipp = useRef({ puffer: "", zeit: 0 });

  // Öffnen/Schließen im Top-Layer
  useIsoLayoutEffect(() => {
    const h = huelle.current;
    if (!h || typeof h.showPopover !== "function") return;
    if (offen && !h.matches(":popover-open")) h.showPopover();
    if (!offen && h.matches(":popover-open")) h.hidePopover();
  }, [offen]);

  // Lage berechnen (vor dem ersten Bild), bei Scroll/Größe nachführen
  useIsoLayoutEffect(() => {
    if (!offen) return;
    const lege = () => {
      const h = huelle.current;
      const p = panel.current;
      if (!h || !p) return;
      if (schmal) {
        h.style.removeProperty("left");
        h.style.removeProperty("top");
        return;
      }
      const vp = { w: window.innerWidth, h: window.innerHeight };
      const groesse = { w: p.offsetWidth, h: p.offsetHeight };
      let lage;
      if (punkt) lage = platziereAmPunkt({ punkt, panel: groesse, viewport: vp });
      else {
        const r = anker?.current?.getBoundingClientRect();
        if (!r) return;
        lage = platziere({ anker: { x: r.left, y: r.top, w: r.width, h: r.height }, panel: groesse, viewport: vp, platzierung });
        p.style.setProperty("max-height", `${lage.maxHoehe}px`);
      }
      h.style.setProperty("left", `${lage.x}px`);
      h.style.setProperty("top", `${lage.y}px`);
      h.style.setProperty("--bo-menue-ursprung", lage.ursprung);
      h.setAttribute("data-seite", lage.seite || "punkt");
    };
    lege();
    window.addEventListener("resize", lege);
    window.addEventListener("scroll", lege, true);
    return () => {
      window.removeEventListener("resize", lege);
      window.removeEventListener("scroll", lege, true);
    };
  }, [offen, anker, punkt, platzierung, schmal]);

  // Erster Fokus: Menü → erster Eintrag; Dialog → erstes Feld oder das Panel
  useEffect(() => {
    if (!offen) return;
    const p = panel.current;
    if (!p) return;
    if (rolle === "menu") {
      const punkte = menuePunkte(p);
      const erster = naechsterIndex(-1, punkte.length, 1, { gesperrt: (i) => punkte[i].getAttribute("aria-disabled") === "true" });
      const ziel = punkte[erster >= 0 ? erster : 0];
      (ziel || p).focus({ preventScroll: true });
    } else {
      const auto = p.querySelector("[autofocus], [data-autofokus]");
      (auto || p).focus({ preventScroll: true });
    }
  }, [offen, rolle]);

  // Klick daneben schließt (Auslöser ausgenommen – der schaltet selbst um)
  useEffect(() => {
    if (!offen) return;
    const weg = (e) => {
      const p = panel.current;
      if (p?.contains(e.target)) return;
      if (ankerAusnehmen && anker?.current?.contains(e.target)) return;
      onSchliessen({ grund: "daneben" });
    };
    document.addEventListener("pointerdown", weg, true);
    return () => document.removeEventListener("pointerdown", weg, true);
  }, [offen, onSchliessen, anker, ankerAusnehmen]);

  const schliessen = (opt = {}) => {
    onSchliessen(opt);
    const a = anker?.current;
    if (opt.fokus !== false && a && typeof a.focus === "function") a.focus({ preventScroll: true });
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      schliessen({ grund: "esc" });
      return;
    }
    if (e.key === "Tab") {
      if (fokusfalle) halteFokus(e, panel.current);
      else if (rolle === "menu") schliessen({ grund: "tab", fokus: false });
      return;
    }
    if (rolle !== "menu") return;
    const punkte = menuePunkte(panel.current);
    const n = punkte.length;
    const gesperrt = (i) => punkte[i]?.getAttribute("aria-disabled") === "true" && !punkte[i]?.dataset.fokussierbar;
    const jetzt = punkte.indexOf(document.activeElement);
    let ziel = -2;
    if (e.key === "ArrowDown") ziel = naechsterIndex(jetzt, n, 1, { umbruch: true, gesperrt });
    else if (e.key === "ArrowUp") ziel = naechsterIndex(jetzt, n, -1, { umbruch: true, gesperrt });
    else if (e.key === "Home" || e.key === "PageUp") ziel = naechsterIndex(-1, n, "anfang", { gesperrt });
    else if (e.key === "End" || e.key === "PageDown") ziel = naechsterIndex(-1, n, "ende", { gesperrt });
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const t = tipp.current;
      t.puffer = e.timeStamp - t.zeit < 600 ? t.puffer + e.key : e.key;
      t.zeit = e.timeStamp;
      ziel = tippSuche(
        punkte.map((p) => p.dataset.titel || p.textContent || ""),
        jetzt,
        t.puffer,
        gesperrt
      );
    }
    if (ziel !== -2) e.preventDefault();
    if (ziel >= 0) {
      punkte[ziel].focus({ preventScroll: false });
    }
  };

  const kontext = { schliessen };

  // Geschlossen: nichts im DOM (Schließen ist sofort, Q-H3 „Popover 120 / sofort“).
  if (!offen) return null;

  return (
    <div ref={huelle} popover="manual" id={id} className={cx("bo-ov-pop", !schmal && "bo-menue")} data-schmal={schmal ? "true" : undefined} data-testid={testid} onClick={schmal ? (e) => e.target === huelle.current && schliessen({ grund: "daneben" }) : undefined}>
      <div
        ref={panel}
        role={rolle}
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-modal={rolle === "dialog" && fokusfalle ? "true" : undefined}
        tabIndex={-1}
        data-rolle={rolle}
        className={cx("bo-ov-pop__panel bo-ov-material", schmal && "bo-menue", className)}
        style={breite && !schmal ? { minWidth: breite } : undefined}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          // Fokus verlässt das Panel ohne Fokusfalle (z. B. per Maus in ein anderes Feld) → schließen
          if (!offen || fokusfalle) return;
          const nach = e.relatedTarget;
          if (nach && !panel.current?.contains(nach) && !anker?.current?.contains(nach)) onSchliessen({ grund: "fokus" });
        }}
      >
        {schmal && <div className="bo-ov-griff" aria-hidden="true" onClick={() => schliessen({ grund: "griff" })} />}
        <MenueKontext.Provider value={kontext}>{typeof children === "function" ? children({ schliessen }) : children}</MenueKontext.Provider>
      </div>
    </div>
  );
}

function menuePunkte(el) {
  return el ? [...el.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')] : [];
}

/**
 * Popover an einem Auslöser (Menü oder kleiner Dialog).
 * Gesteuert über `offen` + `onOffen`, sonst eigener Zustand.
 *
 * @param {object} p
 * @param {(props: object) => import("react").ReactNode} p.ausloeser  bekommt ref, onClick, onKeyDown und ARIA-Props
 * @param {"menu"|"dialog"} [p.rolle]           Standard "dialog"; "menu" für Aktionslisten (role="menu")
 * @param {string} [p.platzierung]              "unten-start" | "unten-ende" | "unten-mitte" | "oben-…" | "rechts-…" | "links-…"
 * @param {string} p.label                      Name des Panels (aria-label)
 * @param {boolean} [p.fokusfalle]              Tab bleibt im Panel (Formular-Popover)
 * @param {number} [p.breite]                   Mindestbreite in px
 * @param {boolean} [p.offen]
 * @param {(offen: boolean) => void} [p.onOffen]
 * @param {import("react").ReactNode | ((api: {schliessen: () => void}) => import("react").ReactNode)} p.children
 */
export default function Popover({ ausloeser, rolle = "dialog", platzierung = "unten-start", label, fokusfalle = false, breite, offen: offenProp, onOffen, className, testid, children }) {
  const [offenEigen, setOffenEigen] = useState(false);
  const gesteuert = offenProp !== undefined;
  const offen = gesteuert ? offenProp : offenEigen;
  const setze = useCallback(
    (w) => {
      if (!gesteuert) setOffenEigen(w);
      onOffen?.(w);
    },
    [gesteuert, onOffen]
  );
  const anker = useRef(null);
  const id = useId();
  const panelId = `bo-pop-${id.replace(/:/g, "")}`;

  const props = {
    ref: anker,
    onClick: () => setze(!offen),
    onKeyDown: (e) => {
      if (rolle === "menu" && (e.key === "ArrowDown" || e.key === "ArrowUp") && !offen) {
        e.preventDefault();
        setze(true);
      }
    },
    "aria-expanded": offen,
    "aria-haspopup": rolle === "menu" ? "menu" : "dialog",
    "aria-controls": offen ? panelId : undefined,
  };

  return (
    <>
      {ausloeser(props)}
      <SchwebePanel id={panelId} offen={offen} onSchliessen={() => setze(false)} anker={anker} rolle={rolle} platzierung={platzierung} label={label} fokusfalle={fokusfalle} breite={breite} className={className} testid={testid}>
        {rolle === "menu" ? (api) => <div className="bo-ov-menue">{typeof children === "function" ? children(api) : children}</div> : children}
      </SchwebePanel>
    </>
  );
}

/**
 * Menü = Popover mit role="menu". Kinder: MenuePunkt, MenueTrenner, MenueGruppe.
 * @param {{ausloeser: Function, label: string, platzierung?: string, breite?: number, children: import("react").ReactNode}} p
 */
export function Menue({ breite = 240, ...p }) {
  return <Popover rolle="menu" breite={breite} {...p} />;
}

/**
 * Eintrag eines Menüs oder Kontextmenüs. Gesperrte Einträge bleiben lesbar und nennen ihren Grund
 * sichtbar (Q-I5) – nie Schein-Einträge ohne Wirkung.
 * @param {object} p
 * @param {string} [p.icon]           Name aus icons.js
 * @param {() => void} [p.onWaehlen]
 * @param {string} [p.href]           Link statt Aktion
 * @param {boolean} [p.gefaehrlich]   Ziegel-Schrift (Löschen, Stornieren)
 * @param {string} [p.kuerzel]        Tastenhinweis rechts („⌘C“, „E“)
 * @param {boolean} [p.deaktiviert]
 * @param {string} [p.grund]          sichtbarer Grund unter dem Titel (bei deaktiviert)
 * @param {boolean} [p.gewaehlt]      Häkchen rechts (menuitemradio)
 * @param {boolean} [p.offenLassen]   Menü bleibt nach Wahl offen
 */
export function MenuePunkt({ icon, onWaehlen, href, gefaehrlich = false, kuerzel, deaktiviert = false, grund, gewaehlt, offenLassen = false, testid, children }) {
  const ctx = useContext(MenueKontext);
  const grundId = useId();
  const titel = typeof children === "string" ? children : undefined;
  const gemeinsam = {
    role: gewaehlt === undefined ? "menuitem" : "menuitemradio",
    "aria-checked": gewaehlt === undefined ? undefined : !!gewaehlt,
    "aria-disabled": deaktiviert ? "true" : undefined,
    "aria-describedby": deaktiviert && grund ? grundId : undefined,
    "aria-keyshortcuts": kuerzel ? kuerzel.replace(/⌘/g, "Meta+").replace(/Strg\+?/g, "Control+") : undefined,
    tabIndex: -1,
    "data-titel": titel,
    "data-fokussierbar": deaktiviert && grund ? "true" : undefined,
    "data-gefaehrlich": gefaehrlich ? "true" : undefined,
    "data-testid": testid,
    className: "bo-ov-punkt",
  };
  const inhalt = (
    <>
      {icon && <Icon name={icon} className="bo-ov-punkt__icon" />}
      <span className="bo-ov-punkt__text">
        <span className="truncate">{children}</span>
        {deaktiviert && grund && (
          <span id={grundId} className="bo-ov-punkt__grund">
            {grund}
          </span>
        )}
      </span>
      {kuerzel && (
        <span className="bo-ov-punkt__kbd" aria-hidden="true">
          {kuerzel}
        </span>
      )}
      {gewaehlt && <Icon name="Check" className="bo-ov-punkt__haken" />}
    </>
  );
  const waehle = (e) => {
    if (deaktiviert) {
      e.preventDefault();
      return;
    }
    onWaehlen?.();
    if (!offenLassen) ctx?.schliessen({ grund: "gewaehlt" });
  };
  if (href && !deaktiviert) {
    return (
      <Link href={href} {...gemeinsam} onClick={waehle}>
        {inhalt}
      </Link>
    );
  }
  return (
    <button type="button" {...gemeinsam} onClick={waehle}>
      {inhalt}
    </button>
  );
}

/** Ruhiger Abstand mit Haarlinie zwischen Menügruppen. */
export function MenueTrenner() {
  return <hr role="separator" className="bo-ov-trenner" />;
}

/** Gruppe mit Bezeichnung (13/500, Satzschreibung – nie Versalien). */
export function MenueGruppe({ titel, children }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <div id={id} className="bo-ov-gruppe__titel">
        {titel}
      </div>
      {children}
    </div>
  );
}

/**
 * Kontextmenü an einem Bereich: Rechtsklick, langes Drücken (Touch, 500 ms), Umschalt+F10 oder
 * Kontextmenü-Taste. Material mit Unschärfe wie das Popover, am Zeiger positioniert.
 * Das Kind muss ein Element sein (z. B. Zeile, Karte); es bekommt aria-haspopup.
 * @param {{label: string, inhalt: import("react").ReactNode | ((api) => import("react").ReactNode), children: import("react").ReactElement, deaktiviert?: boolean, breite?: number}} p
 */
export function Kontextmenue({ label, inhalt, children, deaktiviert = false, breite = 240, testid }) {
  const [punkt, setPunkt] = useState(null);
  const anker = useRef(null);
  const lang = useRef(null);

  useEffect(() => () => clearTimeout(lang.current), []);

  if (deaktiviert || !isValidElement(children)) return children;

  // Ereignisse über eine Hülle ohne eigene Box (display: contents) – das Kind bleibt unverändert.
  const oeffne = (x, y, el) => {
    anker.current = el;
    setPunkt({ x, y });
  };
  const ziel = (e) => e.currentTarget.firstElementChild || e.target;

  return (
    <span
      style={{ display: "contents" }}
      onContextMenu={(e) => {
        if (e.defaultPrevented) return;
        e.preventDefault();
        oeffne(e.clientX, e.clientY, ziel(e));
      }}
      onKeyDown={(e) => {
        if (e.defaultPrevented) return;
        if ((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu") {
          e.preventDefault();
          const el = ziel(e);
          const r = el.getBoundingClientRect();
          oeffne(r.left + Math.min(24, r.width / 2), r.top + Math.min(r.height, 40), el);
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        const { clientX: x, clientY: y } = e;
        const el = ziel(e);
        clearTimeout(lang.current);
        lang.current = setTimeout(() => oeffne(x, y, el), 500);
      }}
      onPointerUp={() => clearTimeout(lang.current)}
      onPointerCancel={() => clearTimeout(lang.current)}
      onPointerMove={(e) => {
        if (e.pointerType === "touch" && (Math.abs(e.movementX) > 4 || Math.abs(e.movementY) > 4)) clearTimeout(lang.current);
      }}
    >
      {cloneElement(Children.only(children), { "aria-haspopup": "menu" })}
      <SchwebePanel offen={!!punkt} punkt={punkt} anker={anker} ankerAusnehmen={false} onSchliessen={() => setPunkt(null)} rolle="menu" label={label} breite={breite} testid={testid}>
        {(api) => <div className="bo-ov-menue">{typeof inhalt === "function" ? inhalt(api) : inhalt}</div>}
      </SchwebePanel>
    </span>
  );
}
