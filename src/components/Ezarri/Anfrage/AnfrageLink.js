// src/components/Ezarri/Anfrage/AnfrageLink.js – Einstieg in die Ezarri-Anfrage (Team C).
// Vertrag §7.4 Nr. 5: URL /ezarri/anfrage?art=muster|beratung|angebot&ref=id1,id2&k=<state>
// (erweitert: &m=<Mischung>&fu=<Fuge>&f=<Format>&m2=…&r=<Rechner>)
// Server-sicher (kein "use client"): Katalog (Team A) und Konfigurator (Team B)
// importieren anfrageHref() oder <AnfrageLink>.
//
// Props von <AnfrageLink> (alle optional außer children):
//   art       "muster" | "beratung" | "angebot"      (Standard "muster")
//   refs      string[]  Referenz-IDs aus data.js, z. B. ["2512-c", "dune"] (max. 6)
//   k         string    Konfig-Zustand von Team B (encodeState), wird durchgereicht
//   m         string    Custom-Mix-Mischung "37-70.38-30" (url.encodeMix)
//   fu        string    Fugenfarbe der Mischung ("1" … "7", Ezarri-Konfigurator)
//   f         "25" | "50" | "hexa"  Format der Mischung (Muster im richtigen Format)
//   m2        number    Fläche in m² (Rechner), wird ins Formular übernommen
//   rechner   string    Query-String des Rechners (url.encodeRechner)
//   projekt   "pool" | "wellness" | "bad" | "kueche" | "fassade" | "anderes"
//   quelle    "katalog" | "konfigurator" | "rechner" | "custom-mix"
//   variant   Button-Variante ("primary" | "secondary" | "ghost" | "link"), Standard "secondary"
//   arrow     Pfeil am Knopf
//   ...rest   weitere Props für den Link (className, aria-*)
import { Button } from "@/components/ui";

const ARTEN = new Set(["muster", "beratung", "angebot"]);
const PROJEKTE = new Set(["pool", "wellness", "bad", "kueche", "fassade", "anderes"]);
const QUELLEN = new Set(["katalog", "konfigurator", "rechner", "custom-mix"]);

/**
 * Pfad der Anfrage (ohne Locale; SmartLink/next-intl setzt /de davor).
 * @returns {string} z. B. "/ezarri/anfrage?art=muster&ref=2512-c,dune"
 */
export function anfrageHref({ art = "muster", refs = [], k, m, fu, f, m2, rechner, projekt, quelle } = {}) {
  const p = new URLSearchParams();
  p.set("art", ARTEN.has(art) ? art : "muster");
  const ids = [...new Set((refs || []).map((r) => String(r).trim().toLowerCase()).filter((r) => /^[a-z0-9][a-z0-9-]{0,48}$/.test(r)))].slice(0, 6);
  if (ids.length) p.set("ref", ids.join(","));
  if (k && /^[A-Za-z0-9_-]{1,1200}$/.test(k)) p.set("k", k);
  if (m && /^[\d.-]{3,80}$/.test(m)) p.set("m", m);
  if (fu && /^[1-7]$/.test(String(fu))) p.set("fu", String(fu));
  if (f && ["25", "50", "hexa"].includes(String(f))) p.set("f", String(f));
  if (Number.isFinite(Number(m2)) && Number(m2) > 0) p.set("m2", String(Math.round(Number(m2) * 100) / 100));
  if (rechner && rechner.length <= 600) p.set("r", rechner);
  if (PROJEKTE.has(projekt)) p.set("projekt", projekt);
  if (QUELLEN.has(quelle)) p.set("quelle", quelle);
  // Kommas lesbar lassen (ref=a,b statt a%2Cb)
  return `/ezarri/anfrage?${p.toString().replace(/%2C/g, ",")}`;
}

export default function AnfrageLink({ art, refs, k, m, fu, f, m2, rechner, projekt, quelle, variant = "secondary", arrow = false, children, ...rest }) {
  return (
    <Button href={anfrageHref({ art, refs, k, m, fu, f, m2, rechner, projekt, quelle })} variant={variant} arrow={arrow} {...rest}>
      {children}
    </Button>
  );
}
