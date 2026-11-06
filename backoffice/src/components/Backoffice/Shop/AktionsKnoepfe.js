"use client";
// Knöpfe und Menüs für Shop-Aktionen (Primär in Tinte, Sekundär ruhig, Rest unter „⋯“). Gesperrte Aktionen
// nennen ihren Grund sichtbar (Q-I5); während ein Commit aussteht, ist die Primäraktion gesperrt („Läuft noch“).
import { useEffect, useState, useSyncExternalStore } from "react";
import Knopf from "@/components/Backoffice/Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "@/components/Backoffice/Overlay";
import Ausstehend from "@/components/Backoffice/Ausstehend";
import { useAusstehend } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { T } from "@/lib/backoffice/shop/texte";
import { useShopAktionen } from "./ShopAktionen";

function useRest(v) {
  const [rest, setRest] = useState(null);
  useEffect(() => {
    if (!v?.frist) return;
    const f = () => setRest(Math.max(Math.ceil((v.frist - Date.now()) / 1000), 0));
    const start = setTimeout(f, 0);
    const t = setInterval(f, 1000);
    return () => {
      clearTimeout(start);
      clearInterval(t);
    };
  }, [v]);
  return v ? rest : null;
}

/** Ein Aktionsknopf. `aktion` = Eintrag aus primaer.js (id, titel, icon, deaktiviert, grund). */
export function AktionsKnopf({ aktion, doc, variant = "secondary", size = "m", kurz = false, testid, className }) {
  const { ausfuehren } = useShopAktionen();
  const objekt = { doctype: doc.doctype || "PH Bestellung", name: doc.name };
  const v = useAusstehend(objekt);
  const rest = useRest(v);
  const [laedt, setLaedt] = useState(false);
  if (!aktion) return null;
  const gesperrt = !!aktion.deaktiviert || !!v;
  const grund = v ? T.laeuftNoch(rest ?? 8) : aktion.deaktiviert ? aktion.grund : undefined;
  return (
    <Knopf
      variant={aktion.gefaehrlich && variant === "primary" ? "danger-solid" : variant}
      size={size}
      icon={aktion.icon}
      disabled={gesperrt}
      grund={kurz ? undefined : grund}
      title={grund}
      laedt={laedt}
      className={className}
      kuerzel={variant === "primary" ? "Strg+Enter" : undefined}
      data-testid={testid || `aktion-${aktion.id}`}
      onClick={async () => {
        setLaedt(true);
        try {
          await ausfuehren(aktion.id, doc, aktion.extra || {});
        } finally {
          setLaedt(false);
        }
      }}
    >
      {aktion.titel}
    </Knopf>
  );
}

/** Menü „⋯“ mit allen weiteren Aktionen; gesperrte mit Grund. */
export function AktionsMenue({ aktionen = [], doc, label = "Weitere Aktionen", testid = "aktionen-menue" }) {
  const { ausfuehren } = useShopAktionen();
  if (!aktionen.length) return null;
  const links = aktionen.filter((a) => a.klasse === "link");
  const rest = aktionen.filter((a) => a.klasse !== "link");
  return (
    <Menue label={label} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={label} data-testid={testid} />}>
      {rest.map((a) => (
        <MenuePunkt key={a.id} icon={a.icon} gefaehrlich={a.gefaehrlich} deaktiviert={a.deaktiviert} grund={a.deaktiviert ? a.grund : a.hinweis} onWaehlen={() => ausfuehren(a.id, doc, a.extra || {})}>
          {a.titel}
        </MenuePunkt>
      ))}
      {rest.length > 0 && links.length > 0 && <MenueTrenner />}
      {links.map((a) => (
        <MenuePunkt key={a.id} icon={a.icon} deaktiviert={a.deaktiviert} grund={a.deaktiviert ? a.grund : undefined} onWaehlen={() => ausfuehren(a.id, doc, a.extra || {})}>
          {a.titel}
        </MenuePunkt>
      ))}
    </Menue>
  );
}

const SCHMAL = "(max-width: 639px)";
function useSchmal() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(SCHMAL);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(SCHMAL).matches,
    () => false,
  );
}

/** Kopf-Aktionen einer Akte: Ausstehend-Pille · Sekundär · Primär · ⋯ (Tastatur: ⌘↵ Primär, „.“ Menü). */
export function AktenAktionen({ primaer, sekundaer = [], menue = [], doc }) {
  const objekt = { doctype: doc.doctype || "PH Bestellung", name: doc.name };
  const { ausfuehren } = useShopAktionen();
  const schmal = useSchmal();
  const sichtbar = schmal ? 0 : 2;
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && primaer && !primaer.deaktiviert && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        ausfuehren(primaer.id, doc, primaer.extra || {});
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [primaer, doc, ausfuehren]);
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" data-testid="akte-aktionen">
      <Ausstehend objekt={objekt} />
      {sekundaer.slice(0, sichtbar).map((a) => (
        <AktionsKnopf key={a.id} aktion={a} doc={doc} kurz />
      ))}
      {primaer && <AktionsKnopf aktion={primaer} doc={doc} variant="primary" testid="primaeraktion" />}
      <AktionsMenue aktionen={[...sekundaer.slice(sichtbar), ...menue]} doc={doc} />
    </div>
  );
}

/** Gesperrte Gründe der Kopfaktionen als ruhige Zeile unter dem Kopf (Q-I5, sichtbar statt nur Tooltip). */
export function SperrGruende({ aktionen = [] }) {
  const g = aktionen.filter((a) => a?.deaktiviert && a.grund);
  if (!g.length) return null;
  return (
    <ul className="mb-4 flex flex-wrap justify-end gap-x-4 gap-y-1 text-[12px] text-bo-text-soft" data-testid="sperrgruende">
      {g.map((a) => (
        <li key={a.id}>
          {a.titel}: {a.grund}
          {a.ersatzHref && (
            <>
              {" "}
              <a className="underline underline-offset-2" href={a.ersatzHref}>öffnen</a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
