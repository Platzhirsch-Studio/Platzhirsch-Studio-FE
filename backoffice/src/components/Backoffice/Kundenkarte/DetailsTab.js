"use client";
// Tab „Details“ (Konzept §3.5.3): Einwilligung · Wallet & QR · Stammdaten · Intern (nur Leitung).
// Ein Speichermodell: Einzelfelder sofort + Rückgängig 8 s (Variante B), Notiz Autosave 1 s,
// Konflikt je Feld („Wurde gerade von … geändert – übernehmen / meinen Wert behalten“).

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { QrBild } from "./MiniKarte";
import { feldSetzenAction, notizSpeichernAction, walletErneuernAction } from "@/lib/backoffice/kundenkarte/actions";
import { KANAL } from "@/lib/backoffice/kundenkarte/labels";
import { geburtstagAnzeige } from "@/lib/backoffice/kundenkarte/regeln";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

function Abschnitt({ id, titel, werkzeuge, children }) {
  return (
    <section id={id} className="bo-kachel scroll-mt-28" aria-labelledby={`${id}-t`}>
      <div className="bo-kachel__kopf">
        <h3 id={`${id}-t`} className="bo-kachel__titel">
          {titel}
        </h3>
        {werkzeuge && <div className="bo-kachel__werkzeuge">{werkzeuge}</div>}
      </div>
      {children}
    </section>
  );
}

function Fakt({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children ?? "–"}</dd>
    </div>
  );
}

/** Einzelfeld sofort speichern mit Rückgängig und Konfliktanzeige. */
function SofortFeld({ karte, feld, label, wert: start, modified, optionen, platzhalter, darf, anzeige }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [wert, setWert] = useState(start || "");
  const [stand, setStand] = useState(modified);
  const [konflikt, setKonflikt] = useState(null);
  const [fehler, setFehler] = useState("");
  const [, starte] = useTransition();
  const speichern = (neu, mod = stand) =>
    starte(async () => {
      setFehler("");
      const r = await feldSetzenAction({ karte, feld, wert: neu, modified: mod });
      if (!r?.ok) {
        if (r?.code === "conflict") return setKonflikt({ aktuell: r.aktuell, modified: r.modified, meins: neu, text: r.message });
        return setFehler(r?.message || T.fehler.allgemein);
      }
      setStand(r.modified);
      setKonflikt(null);
      zeige(`${label} gespeichert`, {
        art: "ok",
        dauer: 8000,
        aktion: {
          titel: "Rückgängig",
          onClick: async () => {
            const z = await feldSetzenAction({ karte, feld, wert: r.alt ?? "" });
            if (z?.ok) {
              setWert(r.alt ?? "");
              setStand(z.modified);
              router.refresh();
            }
          },
        },
      });
    });
  if (!darf) return <Fakt label={label}>{anzeige ? anzeige(start) : start || "–"}</Fakt>;
  const id = `kk-feld-${feld}`;
  return (
    <div>
      <dt>
        <label htmlFor={id}>{label}</label>
      </dt>
      <dd className="mt-1">
        {optionen ? (
          <select id={id} className="bo-kk-feld" value={wert} data-konflikt={konflikt ? "" : undefined} onChange={(e) => (setWert(e.target.value), speichern(e.target.value))}>
            {optionen.map((o) => (
              <option key={o.wert} value={o.wert}>
                {o.titel}
              </option>
            ))}
          </select>
        ) : (
          <input id={id} className="bo-kk-feld" value={wert} placeholder={platzhalter} data-konflikt={konflikt ? "" : undefined} aria-invalid={fehler ? "true" : undefined} onChange={(e) => setWert(e.target.value)} onBlur={() => wert !== (anzeige ? anzeige(start) : start || "") && speichern(wert)} />
        )}
        {fehler && <p className="bo-kk-fehler">{fehler}</p>}
        {konflikt && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]" role="alert">
            <span>{konflikt.text}</span>
            <Knopf size="s" onClick={() => (setWert(konflikt.aktuell || ""), setStand(konflikt.modified), setKonflikt(null))}>
              {T.details.uebernehmen}
            </Knopf>
            <Knopf size="s" variant="ghost" onClick={() => speichern(konflikt.meins, konflikt.modified)}>
              {T.details.meinsBehalten}
            </Knopf>
          </div>
        )}
      </dd>
    </div>
  );
}

function Notiz({ karte, start }) {
  const [text, setText] = useState(start || "");
  const [status, setStatus] = useState({ art: "ruhe", zeit: null });
  const timer = useRef(null);
  const offen = useRef(false);
  const sende = async (t) => {
    offen.current = false;
    setStatus({ art: "laeuft" });
    const r = await notizSpeichernAction({ karte, text: t });
    setStatus(r?.ok ? { art: "ok", zeit: new Date() } : { art: "fehler" });
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div>
      <label htmlFor="kk-notiz" className="bo-kk-label">
        Interne Notiz
      </label>
      <textarea
        id="kk-notiz"
        className="bo-kk-feld"
        rows={3}
        value={text}
        maxLength={4000}
        onChange={(e) => {
          setText(e.target.value);
          offen.current = true;
          clearTimeout(timer.current);
          const t = e.target.value;
          timer.current = setTimeout(() => sende(t), 1000);
        }}
        onBlur={() => offen.current && (clearTimeout(timer.current), sende(text))}
      />
      <p className="bo-kk-hilfe" role="status">
        {status.art === "ok" ? T.details.gespeichert(status.zeit.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })) : status.art === "laeuft" ? "Speichert …" : status.art === "fehler" ? "Nicht gespeichert" : ""}
      </p>
    </div>
  );
}

export default function DetailsTab({ karte, berater = [], darfSchreiben = false, leitung = false, wallet, mitEmail = true }) {
  const { zeige } = useToast();
  const [, starte] = useTransition();
  const beraterName = (w) => berater.find((b) => b.wert === w)?.titel || (w ? String(w).split("@")[0] : "–");
  const qr = karte.qr_svg;
  const download = (art) => {
    if (!qr) return;
    const blob = new Blob([qr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    if (art === "svg") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${karte.name}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 640;
      const g = c.getContext("2d");
      g.fillStyle = "white";
      g.fillRect(0, 0, 640, 640);
      g.drawImage(img, 0, 0, 640, 640);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${karte.name}.png`;
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col gap-5" data-testid="kk-details">
      <nav aria-label={T.details.sprung} className="bo-kk-chips">
        {[
          ["einwilligung", T.details.einwilligung],
          ["wallet", T.details.wallet],
          ["stammdaten", T.details.stammdaten],
          ...(leitung ? [["intern", T.details.intern]] : []),
        ].map(([id, t]) => (
          <a key={id} href={`#${id}`} className="bo-kk-chip">
            {t}
          </a>
        ))}
      </nav>

      <Abschnitt id="einwilligung" titel={T.details.einwilligung}>
        <dl className="bo-kk-fakten">
          <Fakt label={T.details.stand}>{Number(karte.einwilligung_auswertung) ? "erteilt" : karte.einwilligung_widerrufen_am ? "beendet" : "nicht erteilt"}</Fakt>
          <Fakt label={T.details.textversion}>{karte.einwilligung_textversion || "–"}</Fakt>
          <Fakt label={T.details.zeitpunkt}>{karte.einwilligung_am ? datumZeit(karte.einwilligung_am) : "–"}</Fakt>
          <Fakt label={T.details.widerrufen}>{karte.einwilligung_widerrufen_am ? datumZeit(karte.einwilligung_widerrufen_am) : "–"}</Fakt>
          <SofortFeld karte={karte.name} feld="geburtstag_tag_monat" label={T.details.geburtstag} wert={geburtstagAnzeige(karte.geburtstag_tag_monat)} modified={karte.modified} platzhalter="TT.MM." darf={darfSchreiben} />
        </dl>
        <p className="bo-kk-hilfe mt-3">{T.details.geburtstagHinweis}. Nachweise liegen als private Anhänge an der Karte; Einwilligung erfassen und beenden über die Einstufung oben.</p>
      </Abschnitt>

      <Abschnitt
        id="wallet"
        titel={T.details.wallet}
        werkzeuge={
          darfSchreiben && wallet?.eingerichtet ? (
            <Knopf
              size="s"
              icon="RefreshCw"
              onClick={() =>
                starte(async () => {
                  const r = await walletErneuernAction({ karte: karte.name });
                  zeige(r?.ok ? T.akte.walletErneuert : T.akte.walletFehler, { art: r?.ok ? "ok" : "fehler" });
                })
              }
            >
              Pass erneuern
            </Knopf>
          ) : null
        }
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="grid size-40 place-items-center rounded-2xl bg-bo-surface-2">
            {qr ? <QrBild svg={qr} nr={karte.name} className="size-36" /> : <span className="px-4 text-center text-[13px] text-bo-text-soft">QR-Code wird vom Kundenkarten-Server erzeugt – hier noch nicht vorhanden.</span>}
          </div>
          <div className="min-w-0 flex-1 text-[14px]">
            {!mitEmail ? (
              <p>{T.details.walletOhneMail}</p>
            ) : wallet?.eingerichtet ? (
              <>
                <p>{wallet.text}</p>
                <p className="bo-kk-hilfe">{T.details.walletSatz}</p>
              </>
            ) : (
              <p className="text-bo-text-soft">{T.details.walletNicht}</p>
            )}
            {leitung && !wallet?.eingerichtet && (
              <Knopf size="s" variant="ghost" href="/kundenkarte/einstellungen#wallet" className="mt-2">
                Einstellungen öffnen
              </Knopf>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Knopf size="s" icon="Download" disabled={!qr} grund={!qr ? "Noch kein QR-Code vorhanden." : undefined} onClick={() => download("svg")}>
                {T.details.svg}
              </Knopf>
              <Knopf size="s" icon="Download" disabled={!qr} onClick={() => download("png")}>
                {T.details.png}
              </Knopf>
            </div>
            {karte.wallet_pass_aktualisiert && <p className="bo-kk-hilfe mt-2">Pass zuletzt erzeugt {datumZeit(karte.wallet_pass_aktualisiert)}</p>}
          </div>
        </div>
      </Abschnitt>

      <Abschnitt id="stammdaten" titel={T.details.stammdaten}>
        <dl className="bo-kk-fakten">
          <SofortFeld karte={karte.name} feld="kanal" label={T.details.kanal} wert={karte.kanal || "showroom"} modified={karte.modified} optionen={Object.entries(KANAL).map(([wert, titel]) => ({ wert, titel }))} darf={darfSchreiben} anzeige={(w) => KANAL[w] || w} />
          <SofortFeld karte={karte.name} feld="persoenlicher_berater" label={T.akte.berater} wert={karte.persoenlicher_berater || ""} modified={karte.modified} optionen={[{ wert: "", titel: "–" }, ...berater]} darf={darfSchreiben} anzeige={beraterName} />
          <Fakt label={T.details.ausgestellt}>{karte.ausgestellt_am ? datum(karte.ausgestellt_am) : "–"}</Fakt>
          <Fakt label={T.details.durch}>{karte.ausgestellt_durch ? beraterName(karte.ausgestellt_durch) : "–"}</Fakt>
          <Fakt label={T.details.uebergeben}>{karte.uebergeben_am ? datumZeit(karte.uebergeben_am) : "–"}</Fakt>
          <Fakt label={T.details.vorgaenger}>{karte.vorgaenger_karte || "–"}</Fakt>
          <Fakt label={T.details.nachfolger}>{karte.nachfolger_karte || "–"}</Fakt>
          <Fakt label="Kontakt">{karte.kontakt || "–"}</Fakt>
        </dl>
        <p className="bo-kk-hilfe mt-3 flex items-center gap-1.5">
          <Icon name="Lock" className="size-3.5" />
          {T.details.kontaktSatz}
        </p>
      </Abschnitt>

      {leitung && (
        <Abschnitt id="intern" titel={T.details.intern}>
          <Notiz karte={karte.name} start={karte.notizen_intern} />
        </Abschnitt>
      )}
    </div>
  );
}
