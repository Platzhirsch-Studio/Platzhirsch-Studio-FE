"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Home, Inbox, Users, CalendarDays, PenTool, FileText, Package, Truck, Wrench, Store, Ship, BarChart3,
  Settings, ChevronRight, ChevronDown, Sun, Moon, Monitor, Bell, Plus, ArrowRight, CornerDownLeft, UserRound, Building2, Hash, Sparkles,
} from "lucide-react";
import { useThema } from "./PzRoot";
import { Av, Kbd } from "./ui";
import { ICH } from "./daten";

const BASIS = "/entwurf/praezision";

const NAV = [
  { gruppe: null, items: [
    { id: "zentrale", label: "Zentrale", icon: Home, href: BASIS },
    { id: "eingang", label: "Posteingang", icon: Inbox, count: 4 },
    { id: "kalender", label: "Kalender", icon: CalendarDays },
  ] },
  { gruppe: "Verkauf", items: [
    { id: "anfragen", label: "Anfragen", icon: Sparkles, href: `${BASIS}/anfragen`, neu: true },
    { id: "kunden", label: "Kunden", icon: Users, href: `${BASIS}/kunde` },
    { id: "planung", label: "Planung", icon: PenTool, count: 11 },
    { id: "angebote", label: "Angebote & Aufträge", icon: FileText },
  ] },
  { gruppe: "Betrieb", items: [
    { id: "sortiment", label: "Sortiment", icon: Package },
    { id: "logistik", label: "Lieferung & Montage", icon: Truck },
    { id: "service", label: "Service", icon: Wrench, count: 3 },
    { id: "kassa", label: "Kassa", icon: Store, href: `${BASIS}/kassa` },
  ] },
  { gruppe: "Objekte", items: [
    { id: "yacht", label: "Yacht & Hotel", icon: Ship },
    { id: "berichte", label: "Berichte", icon: BarChart3 },
  ] },
];

export function ThemaSchalter() {
  const { thema, setThema } = useThema();
  const naechstes = { system: "light", light: "dark", dark: "system" }[thema];
  const Icon = thema === "light" ? Sun : thema === "dark" ? Moon : Monitor;
  const name = { system: "System", light: "Hell", dark: "Dunkel" }[thema];
  return (
    <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" onClick={() => setThema(naechstes)} aria-label={`Darstellung: ${name}. Wechseln`} title={`Darstellung: ${name}`}>
      <Icon />
    </button>
  );
}

function Seitenleiste({ aktiv, onSuche }) {
  return (
    <nav className="pz-side" aria-label="Hauptnavigation">
      <Link href={BASIS} className="pz-brand" aria-label="Platzhirsch Backoffice – Zentrale, Standort Lochau">
        <span className="pz-brand-mono" aria-hidden>P</span>
        <span className="pz-brand-name">Platzhirsch</span>
        <span className="pz-brand-sub">Lochau <ChevronDown aria-hidden /></span>
      </Link>
      <button type="button" className="pz-search" onClick={onSuche} aria-label="Suchen oder Befehl ausführen (Strg K)">
        <Search size={15} aria-hidden />
        <span>Suchen …</span>
        <Kbd>{["⌘", "K"]}</Kbd>
      </button>
      {NAV.map((g, gi) => (
        <div key={gi}>
          {g.gruppe && <div className="pz-navlabel">{g.gruppe}</div>}
          <div className="pz-navgroup">
            {g.items.map((it) => {
              const Icon = it.icon;
              const inhalt = (
                <>
                  <Icon aria-hidden />
                  <span>{it.label}</span>
                  {it.count ? <span className="pz-count pz-hide-narrow">{it.count}</span> : null}
                  {it.neu ? <span className="pz-dotnew pz-hide-narrow" aria-label="neue Einträge" /> : null}
                </>
              );
              return it.href ? (
                <Link key={it.id} href={it.href} className="pz-nav" aria-current={aktiv === it.id ? "page" : undefined} title={it.label}>{inhalt}</Link>
              ) : (
                <a key={it.id} href="#" className="pz-nav" onClick={(e) => e.preventDefault()} title={it.label}>{inhalt}</a>
              );
            })}
          </div>
        </div>
      ))}
      <div className="pz-side-foot">
        <a href="#" className="pz-nav" onClick={(e) => e.preventDefault()} title="Einstellungen"><Settings aria-hidden /><span>Einstellungen</span></a>
        <div className="pz-user">
          <Av kurz={ICH.kurz} ton={ICH.ton} size={28} />
          <div className="pz-user-txt">
            <div className="pz-user-name">{ICH.name}</div>
            <div className="pz-user-role">{ICH.rolle}</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

const BEFEHLE = [
  { gruppe: "Vorschläge", items: [
    { icon: Plus, titel: "Neue Anfrage anlegen", kbd: ["C"] },
    { icon: CalendarDays, titel: "Termin vereinbaren", kbd: ["T"] },
    { icon: Store, titel: "Kassa öffnen", href: `${BASIS}/kassa`, kbd: ["G", "K"] },
  ] },
  { gruppe: "Kunden & Objekte", items: [
    { icon: UserRound, titel: "Johanna & Felix Ostermann", sub: "Privat · Bregenz", href: `${BASIS}/kunde` },
    { icon: Building2, titel: "Hotel Lindwurm am See", sub: "Hotel · Hard" },
  ] },
  { gruppe: "Vorgänge", items: [
    { icon: Hash, titel: "AB-0412 Penthouse Seestraße", sub: "142.600 €" },
    { icon: Hash, titel: "ANG-0415 Küche Märk", sub: "22.760 €" },
  ] },
  { gruppe: "Navigation", nurSuche: true, items: [
    { icon: Sparkles, titel: "Gehe zu Anfragen", href: `${BASIS}/anfragen`, kbd: ["G", "A"] },
    { icon: Home, titel: "Gehe zur Zentrale", href: BASIS, kbd: ["G", "Z"] },
  ] },
];

function Befehlspalette({ offen, schliessen }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  const gefiltert = useMemo(() => {
    const t = q.trim().toLowerCase();
    return BEFEHLE.map((g) => ({ ...g, items: g.items.filter((i) => !t || i.titel.toLowerCase().includes(t) || (i.sub || "").toLowerCase().includes(t)) })).filter((g) => g.items.length && (t || !g.nurSuche));
  }, [q]);
  const flach = gefiltert.flatMap((g) => g.items);

  useEffect(() => {
    if (offen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [offen]);

  if (!offen) return null;

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, flach.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === "Escape") schliessen();
    if (e.key === "Enter" && flach[sel]?.href) window.location.href = flach[sel].href;
  };

  const startIndex = gefiltert.map((_, gi) => gefiltert.slice(0, gi).reduce((n, g) => n + g.items.length, 0));
  return (
    <div className="pz-scrim" onMouseDown={(e) => e.target === e.currentTarget && schliessen()}>
      <div className="pz-cmd" role="dialog" aria-modal="true" aria-label="Befehlspalette">
        <div className="pz-cmd-in">
          <Search aria-hidden />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} placeholder="Kunde, Vorgang, Artikel oder Befehl …" aria-label="Suchen" role="combobox" aria-expanded="true" aria-controls="pz-cmd-list" />
          <Kbd>Esc</Kbd>
        </div>
        <div className="pz-cmd-list" id="pz-cmd-list" role="listbox">
          {gefiltert.map((g, gi) => (
            <div key={g.gruppe} role="group" aria-label={g.gruppe}>
              <div className="pz-cmd-group">{g.gruppe}</div>
              {g.items.map((it, ii) => {
                const i = startIndex[gi] + ii;
                const Icon = it.icon;
                return (
                  <div key={it.titel} className="pz-cmd-item" role="option" aria-selected={sel === i} onMouseEnter={() => setSel(i)} onClick={() => it.href && (window.location.href = it.href)}>
                    <Icon aria-hidden />
                    <b>{it.titel}</b>
                    {it.sub && <span>{it.sub}</span>}
                    <span className="end">{it.kbd ? <Kbd>{it.kbd}</Kbd> : sel === i ? <ArrowRight size={14} aria-hidden /> : null}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="pz-cmd-foot">
          <span><Kbd>{["↑", "↓"]}</Kbd> wählen</span>
          <span><Kbd><CornerDownLeft size={10} /></Kbd> öffnen</span>
          <span>Platzhirsch</span>
        </div>
      </div>
    </div>
  );
}

export default function Shell({ aktiv, crumbs = [], aktionen, children, fest = false }) {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Vorführmodus ?palette=1
      if (new URL(window.location.href).searchParams.get("palette") === "1") setPalette(true);
    } catch {}
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pz-app">
      <Seitenleiste aktiv={aktiv} onSuche={() => setPalette(true)} />
      <main className={`pz-main${fest ? " pz-main--fest" : ""}`} id="inhalt">
        <header className="pz-top">
          <div className="pz-crumbs">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "contents" }}>
                {i > 0 && <ChevronRight aria-hidden />}
                {i === crumbs.length - 1 ? <b>{c}</b> : <span>{c}</span>}
              </span>
            ))}
          </div>
          <div className="pz-top-right">
            {aktionen}
            <button type="button" className="pz-btn pz-btn--ghost pz-btn--icon" aria-label="Benachrichtigungen, 2 neu" title="Benachrichtigungen"><Bell /></button>
            <ThemaSchalter />
          </div>
        </header>
        {children}
      </main>
      <Befehlspalette offen={palette} schliessen={() => setPalette(false)} />
    </div>
  );
}
