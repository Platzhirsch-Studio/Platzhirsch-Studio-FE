"use client";
// Bereich Marketing – kleine Client-Bausteine: „+ Neu ▾“, Status-Chips als Segment (Links mit Zählern, Q-B7),
// Kopieren-Knopf, Zeit relativ (hydrationssicher), Vorschau-Rahmen für Mails (iframe sandbox, Desktop/Mobil, Hell/Dunkel).
import { useEffect, useState } from "react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Menue, MenuePunkt } from "../Overlay";
import { useToast } from "../Toast";
import { NEWSLETTER } from "@/lib/backoffice/marketing/texte";
import "./marketing.css";

/** @param {{titel?:string, eintraege:Array<{titel:string, href:string, icon?:string}>, testid?:string, primaer?:boolean}} p */
export function NeuMenue({ titel = "Neu", eintraege = [], testid = "marketing-neu", primaer = true }) {
  if (!eintraege.length) return null;
  return (
    <Menue label={titel} ausloeser={(p) => <Knopf {...p} variant={primaer ? "primary" : "secondary"} icon="Plus" iconRechts="ChevronDown" data-testid={testid}>{titel}</Knopf>}>
      {eintraege.map((e) => (
        <MenuePunkt key={e.href} icon={e.icon} href={e.href}>
          {e.titel}
        </MenuePunkt>
      ))}
    </Menue>
  );
}

/** Status-Chips (1–9 außerhalb von Feldern über das Segment-Register) als Link-Segment mit Zählern. */
export function StatusChips({ label = "Status", optionen = [], aktiv, testid = "status-chips" }) {
  return <Segment label={label} optionen={optionen} aktiv={aktiv} testid={testid} />;
}

export function KopierKnopf({ text, titel = "Kopieren", ok = "Kopiert", size = "m", variant = "secondary", icon = "FileText", testid }) {
  const { zeige } = useToast();
  return (
    <Knopf
      size={size}
      variant={variant}
      icon={icon}
      data-testid={testid}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          zeige(ok, { art: "ok" });
        } catch {
          zeige("Kopieren nicht möglich – bitte markieren und kopieren.", { art: "warnung" });
        }
      }}
    >
      {titel}
    </Knopf>
  );
}

/** Mail-Vorschau im Rahmen: iframe sandbox + srcdoc, title mit Kontext; Umschalter Desktop/Mobil und Hell/Dunkel. */
export function MailVorschau({ html, titel, stand, fehler, onErneut, laedt = false, werkzeuge, hoehe = 560, testid = "mail-vorschau" }) {
  const [breite, setBreite] = useState("desktop");
  const [dunkel, setDunkel] = useState(false);
  const doc = html && dunkel ? html.replace('<body class="', '<body class="dunkel ') : html;
  return (
    <div className="bo-mar-vorschau" data-testid={testid}>
      <div className="bo-mar-vorschau__leiste">
        <Segment
          label="Breite"
          groesse="s"
          wert={breite}
          onWechsel={setBreite}
          optionen={[
            { wert: "desktop", titel: NEWSLETTER.desktop },
            { wert: "mobil", titel: NEWSLETTER.mobil },
          ]}
        />
        <Segment
          label="Darstellung"
          groesse="s"
          wert={dunkel ? "dunkel" : "hell"}
          onWechsel={(w) => setDunkel(w === "dunkel")}
          optionen={[
            { wert: "hell", titel: "Hell" },
            { wert: "dunkel", titel: "Dunkel" },
          ]}
        />
      </div>
      <div className="bo-mar-vorschau__rahmen" data-breite={breite} aria-busy={laedt || undefined}>
        {fehler ? (
          <div className="grid place-items-center gap-3 p-8 text-center" role="alert">
            <p className="bo-mar-titel">{NEWSLETTER.vorschauFehler}</p>
            <p className="bo-mar-unter">{fehler}</p>
            {onErneut && (
              <Knopf size="s" onClick={onErneut}>
                Erneut
              </Knopf>
            )}
          </div>
        ) : html ? (
          <iframe title={`${titel}, ${breite === "mobil" ? "Mobil-Breite" : "Desktop-Breite"}`} sandbox="" srcDoc={doc} style={{ height: hoehe }} />
        ) : (
          <div className="bo-skeleton w-full max-w-[600px] rounded-[14px]" style={{ height: hoehe }} aria-label="Vorschau lädt" />
        )}
      </div>
      <div className="bo-mar-vorschau__leiste">
        <span className="bo-mar-klein" aria-live="off">
          {laedt ? NEWSLETTER.aktualisiertGleich : stand ? `Stand ${stand}` : ""}
        </span>
        {werkzeuge}
      </div>
    </div>
  );
}

/** „vor 5 Min.“ erst nach dem Einhängen (kein Hydrationsunterschied), title absolut. */
export function Zeit({ wert, titel, format }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const f = () => setText(format ? format(wert) : "");
    f();
    const t = setInterval(f, 60_000);
    return () => clearInterval(t);
  }, [wert, format]);
  return (
    <span title={titel} suppressHydrationWarning>
      {text}
    </span>
  );
}
