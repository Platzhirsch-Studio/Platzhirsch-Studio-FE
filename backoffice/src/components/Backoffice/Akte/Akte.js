import Link from "next/link";
import cx from "../cx";
import Avatar from "../Avatar";
import { RundKnopf } from "../Knopf";
import { Icon } from "../icons";
import Kachel from "../Kachel";
import { cent } from "@/lib/backoffice/format";
import { TEXTE } from "@/lib/backoffice/akte/texte";
import { anteil, begrenzeKacheln } from "@/lib/backoffice/akte/geruest";
import "./akte.css";

// Akte-Gerüst (G-14, Team P0-5a) im Lounge-Stil – Seitentyp T5 (Kundenakte, Auftragsmappe, Belege).
// Vorbild: Entwurf „Lounge“ Kundenakte (art-direction/lounge.md §6 „Hero mit Glas-Kacheln“, §7 Nr. 3).
// Server- und Client-tauglich (keine Hooks). Die Reiter (AkteTabs) und die Vorgangsleiste sind
// Client-Komponenten und werden als Slot hineingegeben.
//
//   <AkteGeruest
//     kopf={<AkteKopf zurueck={{ href: "/projekte", titel: "Projekte" }} krumen={[…]} rechts={…} />}
//     hero={<AkteHero bild={{ src, alt }} ueber="Familie Brändle" titel="Haus am See" unter="Küche · Wohnen"
//             chips={[{ icon: "FileText", text: "PRJ-2026-021" }]} aktionen={<GlasKnopf …/>} kacheln={[…]} />}
//     band={<Band … />}                       // höchstens eines (waehleBand)
//     reiter={<AkteTabs … />}                 // höchstens 6, ?tab=
//     vorgang={<Vorgangsleiste … />}
//     rechts={<RechteSpalte aktivitaet={…} details={…} bezuege={<Bezuege …/>} />}
//     seiteAktiv={tab === "seite"}>          // unter 1280 px ersetzt die rechte Spalte den Inhalt
//     {Inhalt des aktiven Reiters}
//   </AkteGeruest>

/**
 * @param {object} p
 * @param {import("react").ReactNode} [p.kopf]
 * @param {import("react").ReactNode} [p.hero]
 * @param {import("react").ReactNode} [p.band]
 * @param {import("react").ReactNode} [p.reiter]
 * @param {import("react").ReactNode} [p.vorgang]   Vorgangsleiste (unter den Reitern, wie im Entwurf)
 * @param {boolean} [p.vorgangOben]                 Vorgangsleiste über den Reitern (Akten ohne Hero)
 * @param {import("react").ReactNode} [p.rechts]    rechte Spalte (ab 1280 px sichtbar)
 * @param {boolean} [p.seiteAktiv]                  Reiter „Aktivität und Details“ unter 1280 px gewählt
 */
export function AkteGeruest({ kopf, hero, band, reiter, vorgang, vorgangOben = false, rechts, seiteAktiv = false, className, testid, children }) {
  return (
    <div className={cx("bo-akte", className)} data-testid={testid}>
      {kopf}
      {hero}
      {band}
      {vorgangOben && vorgang}
      {reiter}
      {!vorgangOben && vorgang}
      <div className="bo-akte__koerper" data-mit-spalte={rechts ? "" : undefined} data-seite={seiteAktiv ? "an" : undefined}>
        <div className="bo-akte__haupt">{children}</div>
        {rechts && (
          <aside className="bo-akte__rechts" aria-label={TEXTE.akte.spalte}>
            {rechts}
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Kopf der Akte (≤ 2 Zeilen, Q-B6): Zurück-Rundknopf + Pfad (max. 3 Ebenen, Q-B9), rechts Chips
 * (Kundenkarte-Stufe, Status) oder Aktionen. Ohne Hero zusätzlich die Titelzeile (h1, Nummer,
 * Status, Betrag rechts, Primärknopf + ⋯).
 * @param {object} p
 * @param {{href:string, titel:string}} [p.zurueck]
 * @param {Array<{titel:string, href?:string}>} [p.krumen]  letzter Eintrag = aktuelle Seite
 * @param {import("react").ReactNode} [p.rechts]
 * @param {import("react").ReactNode} [p.titel]      nur ohne Hero: h1
 * @param {import("react").ReactNode} [p.nummer]     Nummer/Art unter dem Titel
 * @param {import("react").ReactNode} [p.status]     StatusBadge
 * @param {{cent?:number, text?:string, unter?:string}} [p.betrag]
 * @param {import("react").ReactNode} [p.aktionen]   höchstens ein Primärknopf + Menü „⋯“
 * @param {1|2} [p.ebene]                            Titel als h1 (Standard) oder h2 (eingebettet)
 */
export function AkteKopf({ zurueck, krumen = [], rechts, titel, nummer, status, betrag, aktionen, ebene = 1, className, testid }) {
  const H = ebene === 2 ? "h2" : "h1";
  const pfad = krumen.slice(-3);
  const betragText = betrag ? (Number.isFinite(betrag.cent) ? cent(betrag.cent) : betrag.text) : null;
  return (
    <header className={cx("bo-akte-kopf", className)} data-testid={testid}>
      <div className="bo-akte-kopf__zeile">
        <div className="bo-akte-kopf__l">
          {zurueck && <RundKnopf icon="ChevronLeft" label={TEXTE.akte.zurueck(zurueck.titel)} href={zurueck.href} />}
          {pfad.length > 0 && (
            <nav className="bo-akte-pfad" aria-label={TEXTE.akte.pfad}>
              <ol>
                {pfad.map((k, i) => {
                  const letzte = i === pfad.length - 1;
                  return (
                    <li key={`${k.titel}-${i}`}>
                      {letzte || !k.href ? (
                        <span aria-current={letzte ? "page" : undefined}>{k.titel}</span>
                      ) : (
                        <Link href={k.href}>{k.titel}</Link>
                      )}
                      {!letzte && <Icon name="ChevronRight" className="size-4" />}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </div>
        {(rechts || (!titel && aktionen)) && <div className="bo-akte-kopf__r">{rechts}{!titel && aktionen}</div>}
      </div>
      {titel && (
        <div className="bo-akte-kopf__titel">
          <div className="min-w-0">
            <H className="bo-akte-kopf__h1">{titel}</H>
            {(nummer || status) && (
              <p className="bo-akte-kopf__nr">
                {nummer}
                {status}
              </p>
            )}
          </div>
          <div className="flex items-end gap-6">
            {betragText && (
              <div className="bo-akte-kopf__betrag">
                <p className="bo-akte-kopf__betrag-zahl">{betragText}</p>
                {betrag.unter && <p className="bo-akte-kopf__betrag-unter">{betrag.unter}</p>}
              </div>
            )}
            {aktionen && <div className="bo-akte-kopf__aktionen">{aktionen}</div>}
          </div>
        </div>
      )}
    </header>
  );
}

/** Glas-Chip auf dem Bild (Nummer, Ort). */
export function GlasChip({ icon, children }) {
  return (
    <span className="bo-glas-chip">
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </span>
  );
}

/**
 * Glas-Pille als Aktion direkt auf dem Bild (Anrufen, E-Mail, Termin). `hell` = die eine
 * hervorgehobene Aktion (weiße Pille). Mit `href` ein Link, sonst ein Knopf (onClick, type).
 * `deaktiviert` + `grund` für Fähigkeiten (Grund als title + aria-describedby-Text).
 */
export function GlasKnopf({ icon, href, hell = false, deaktiviert = false, grund, onClick, type = "button", className, testid, children, ...rest }) {
  const klassen = cx("bo-glas-pille", className);
  const inhalt = (
    <>
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </>
  );
  if (href && !deaktiviert) {
    return (
      <Link href={href} className={klassen} data-hell={hell ? "" : undefined} data-testid={testid} {...rest}>
        {inhalt}
      </Link>
    );
  }
  return (
    <button type={type} className={klassen} data-hell={hell ? "" : undefined} onClick={deaktiviert ? undefined : onClick} aria-disabled={deaktiviert || undefined} title={deaktiviert ? grund : undefined} data-testid={testid} {...rest}>
      {inhalt}
    </button>
  );
}

/**
 * Glas-Kachel über dem Bild (AeroLink): Bezeichnung 12, Wert 24/600 (oder 17 bei Text), Unterzeile 12;
 * optional Balken (Anteil 0…1, z. B. bezahlt) oder Avatar oben rechts.
 * @param {object} p
 * @param {string} p.titel
 * @param {import("react").ReactNode} p.wert
 * @param {string} [p.unter]
 * @param {{anteil:number, label:string}} [p.balken]
 * @param {string|{name:string, kuerzel?:string, material?:string}} [p.person]
 * @param {boolean} [p.mittel]   Wert als Text (17/600) statt Zahl
 * @param {string} [p.href]
 */
export function GlasKachel({ titel, wert, unter, balken, person, mittel = false, href, testid }) {
  const p = typeof person === "string" ? { name: person } : person;
  const Tag = href ? Link : "div";
  const leer = wert === null || wert === undefined || wert === "";
  return (
    <Tag {...(href ? { href } : {})} className="bo-glas-kachel" data-testid={testid}>
      <span className="bo-glas-kachel__kopf">
        <span className="bo-glas-kachel__cap">{titel}</span>
        {p && <Avatar name={p.name} kuerzel={p.kuerzel} material={p.material} groesse={28} ring={false} />}
      </span>
      <span className="bo-glas-kachel__wert" data-mittel={mittel ? "" : undefined}>
        {leer ? "–" : wert}
      </span>
      {balken ? (
        <span className="bo-glas-kachel__balken" role="img" aria-label={balken.label}>
          <span style={{ width: `${Math.round(anteil(balken.anteil) * 100)}%` }} />
        </span>
      ) : (
        unter && <span className="bo-glas-kachel__unter">{unter}</span>
      )}
    </Tag>
  );
}

/**
 * Hero mit Bild und Glas-Kacheln (lounge.md §6): Bild 440 hoch, Abdunklung nur links/unten, Titel weiß
 * 48 (h1), oben links Glas-Chips, oben rechts Glas-Aktionen, unten rechts Glasplatte mit bis zu
 * 4 Glas-Kacheln (2 × 2). Ohne Bild: ruhige Travertin-Fläche mit Tinte-Text (Q-A6: kein Ersatzfoto).
 * Unter 1100 px wandert die Glasplatte unter den Titel, am Telefon zweispaltig.
 * @param {object} p
 * @param {{src:string, alt:string, position?:string}} [p.bild]
 * @param {import("react").ReactNode} p.titel          h1
 * @param {import("react").ReactNode} [p.ueber]        Zeile darüber (Kunde)
 * @param {import("react").ReactNode} [p.unter]        Zeile darunter (Bereiche, Ort)
 * @param {Array<{icon?:string, text:import("react").ReactNode}>} [p.chips]
 * @param {import("react").ReactNode} [p.aktionen]     GlasKnopf-Elemente (höchstens 3, eine `hell`)
 * @param {Array<object>} [p.kacheln]                  Props für GlasKachel (höchstens 4)
 * @param {1|2} [p.ebene]                              Überschrift h1 (Standard) oder h2 (eingebettet)
 */
export function AkteHero({ bild, titel, ueber, unter, chips = [], aktionen, kacheln = [], titelId, ebene = 1, className, testid }) {
  const H = ebene === 2 ? "h2" : "h1";
  const { kacheln: sicht } = begrenzeKacheln(kacheln);
  const ohneBild = !bild?.src;
  return (
    <section className={cx("bo-akte-hero", className)} data-ohne-bild={ohneBild ? "" : undefined} aria-labelledby={titelId} data-testid={testid}>
      {!ohneBild && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Projekt-/Raumbild aus der Ablage, Größe kommt vom Server */}
          <img src={bild.src} alt={bild.alt || ""} className="bo-akte-hero__bild" style={bild.position ? { objectPosition: bild.position } : undefined} fetchPriority="high" decoding="async" />
          <div className="bo-akte-hero__scrim" aria-hidden="true" />
        </>
      )}
      {(chips.length > 0 || aktionen) && (
        <div className="bo-akte-hero__oben">
          <div className="bo-akte-hero__chips">
            {chips.map((c, i) => (
              <GlasChip key={i} icon={c.icon}>
                {c.text}
              </GlasChip>
            ))}
          </div>
          {aktionen && (
            <div className="bo-akte-hero__aktionen" role="group" aria-label={TEXTE.akte.aktionen}>
              {aktionen}
            </div>
          )}
        </div>
      )}
      <div className="bo-akte-hero__titel">
        {ueber && <p className="bo-akte-hero__ueber">{ueber}</p>}
        <H id={titelId} className="bo-akte-hero__h1">
          {titel}
        </H>
        {unter && <p className="bo-akte-hero__unter">{unter}</p>}
      </div>
      {sicht.length > 0 && (
        <div className="bo-akte-hero__glas" data-anzahl={sicht.length} role="group" aria-label={TEXTE.akte.kacheln}>
          {sicht.map((k, i) => (
            <GlasKachel key={k.titel || i} {...k} />
          ))}
        </div>
      )}
    </section>
  );
}

const BAND_ICON = { gefahr: "ShieldAlert", warnung: "TriangleAlert", info: "Info", neutral: "Info" };

/**
 * Band (höchstens eines je Akte, Q-B6; Auswahl mit `waehleBand` aus lib/backoffice/akte/geruest).
 * Randlose Materialfläche mit Symbol im Kreis, Titel + Satz, optional eine Aktion rechts.
 * @param {object} p
 * @param {"gefahr"|"warnung"|"info"|"neutral"} [p.ton]
 * @param {string} [p.icon]
 * @param {import("react").ReactNode} [p.titel]
 * @param {import("react").ReactNode} [p.text]
 * @param {import("react").ReactNode} [p.aktion]
 */
export function Band({ ton = "info", icon, titel, text, aktion, className, testid }) {
  return (
    <div className={cx("bo-akte-band", className)} data-ton={ton} role={ton === "gefahr" ? "alert" : "status"} data-testid={testid}>
      <span className="bo-akte-band__ico" aria-hidden="true">
        <Icon name={icon || BAND_ICON[ton] || "Info"} className="size-4" />
      </span>
      <p className="bo-akte-band__text">
        {titel && <span className="bo-akte-band__titel">{titel}</span>}
        {titel && text && " – "}
        {text}
      </p>
      {aktion}
    </div>
  );
}

/**
 * Rechte Spalte (Q-B6: Aktivität · Details · Bezüge, ab 1280 px sichtbar, sticky). Jede gefüllte
 * Gruppe ist eine Kachel; zusätzliche Kacheln (Beträge, Größte Positionen) als Kinder davor.
 * @param {object} p
 * @param {import("react").ReactNode} [p.aktivitaet]
 * @param {import("react").ReactNode} [p.details]
 * @param {import("react").ReactNode} [p.bezuege]
 * @param {{aktivitaet?:object, details?:object, bezuege?:object}} [p.kachel]  zusätzliche Kachel-Props je Gruppe (werkzeuge, href …)
 */
export function RechteSpalte({ aktivitaet, details, bezuege, kachel = {}, children }) {
  return (
    <>
      {children}
      {aktivitaet && (
        <Kachel titel={TEXTE.akte.aktivitaet} {...kachel.aktivitaet}>
          {aktivitaet}
        </Kachel>
      )}
      {details && (
        <Kachel titel={TEXTE.akte.details} {...kachel.details}>
          {details}
        </Kachel>
      )}
      {bezuege && (
        <Kachel titel={TEXTE.akte.bezuege} {...kachel.bezuege}>
          {bezuege}
        </Kachel>
      )}
    </>
  );
}
