"use client";
// Anfragenliste (§ 3.2) im Lounge-Stil wie entwurf-lounge „Anfragen“: Tabelle in schwebender Kachel mit
// luftigen Zeilen (72), Avatar/Bild, Status als weiche Pille, je Zeile genau ein Aktionsknopf + Menü ⋯;
// Vorschau rechts als schwebende Karte (sticky, ab 1280 px; darunter öffnet die Zeile die Akte).
// Auswahl → Massenaktionen als Material-Kapsel. Tastatur: ↑/↓ (Zeile), Enter (Akte), Leertaste (Vorschau),
// Umschalt+W (Annehmen, Register crm.annehmen).

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Kachel from "../Kachel";
import Knopf, { RundKnopf, PfeilKnopf } from "../Knopf";
import Avatar from "../Avatar";
import PersonZelle from "../PersonZelle";
import Leer from "../Leer";
import StatusBadge from "../StatusBadge";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Dialog from "../Overlay/Dialog";
import Datumsfeld from "../Formular/Datumsfeld";
import { KontaktKnoepfe } from "./Teile";
import { VerlorenDialog, AufgabeDialog } from "./Dialoge";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { useCrmAktion } from "./useCrmAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { alterText, faelligText, kurzDatum, empfehlung } from "@/lib/backoffice/crm/vorgang";
import { raumBild } from "@/lib/backoffice/crm/bilder";
import { annehmenAction, nachfassenAction, spamAction, zuweisenAction } from "@/lib/backoffice/crm/actions";
import "./crm.css";

const ohneArt = (t) => String(t || "").replace(/^[A-Za-zÄÖÜäöü]+:\s*/, "");
const ortVon = (a) => String(a.plz_ort || "").replace(/^\d{4,5}\s*/, "");

function MiniReise({ abgeleitet }) {
  const s = abgeleitet?.status;
  const stufe = { Neu: 0, Qualifiziert: 0, "Termin vereinbart": 1, Angebot: 3, Gewonnen: 4 }[s] ?? 0;
  const labels = ["Anfrage", "Termin", "Gespräch", "Angebot", "Auftrag"];
  return (
    <div className="grid gap-2" role="img" aria-label={`Vorgang: ${labels[stufe]}`}>
      <div className="bo-crm-minireise">
        {labels.map((l, i) => (
          <span key={l} style={{ display: "contents" }}>
            {i > 0 && <i />}
            <span data-zustand={i < stufe ? "erledigt" : i === stufe ? "aktuell" : "offen"} />
          </span>
        ))}
      </div>
      <p className="text-[13px] font-medium text-bo-cognac-text">{labels[stufe]}</p>
    </div>
  );
}

function Vorschau({ a, onSchliessen, onAktion, mock }) {
  if (!a) return null;
  const bild = raumBild(a.projektart || a.art, { mock });
  const emp = empfehlung(a.abgeleitet);
  return (
    <aside className="bo-crm-vorschau bo-panel" aria-label={T.vorschau.label(ohneArt(a.titel) || a.person)} data-testid="crm-vorschau">
      <div className="bo-crm-vorschau__bild">
        {/* eslint-disable-next-line @next/next/no-img-element -- Raumbild aus public/entwurf/lounge (Sortiment, Mock) */}
        {bild ? <img src={bild.src} alt={bild.alt} style={{ objectPosition: bild.position }} /> : null}
        <div className="bo-crm-vorschau__glas">
          <span className="bo-glas rounded-pill px-3 py-1.5 text-[13px] font-semibold">{T.art[a.art] || a.art}</span>
          {a.budget_hinweis && <span className="bo-glas rounded-pill px-3 py-1.5 text-[13px] font-semibold">{a.budget_hinweis}</span>}
        </div>
        <div className="bo-crm-vorschau__zu"><RundKnopf icon="X" label={T.knopf.schliessen} groesse="s" onClick={onSchliessen} /></div>
      </div>
      <div className="grid gap-5 px-6 pb-6 pt-3">
        <div className="flex items-center gap-4">
          <Avatar name={a.person || a.titel} groesse={56} />
          <div className="min-w-0">
            <p className="text-[13px] text-bo-text-soft tabular-nums">{a.name} · {kurzDatum(a.eingang)}</p>
            <h2 className="truncate text-[22px] font-semibold leading-7 tracking-[-0.01em]">{a.person || ohneArt(a.titel)}</h2>
            <p className="truncate text-[13px] text-bo-text-soft">{[ortVon(a), T.quelle[a.quelle] ? `über ${T.quelle[a.quelle]}` : ""].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="bo-crm-aktionskreise">
          <div className="bo-crm-aktionskreis"><RundKnopf icon="Phone" label={T.knopf.anrufen} href={a.telefon ? `tel:${a.telefon}` : undefined} disabled={!a.telefon} />{T.knopf.anrufen}</div>
          <div className="bo-crm-aktionskreis"><RundKnopf icon="Mail" label="E-Mail" href={a.email ? `mailto:${a.email}` : undefined} disabled={!a.email} />E-Mail</div>
          <div className="bo-crm-aktionskreis"><RundKnopf icon="CalendarPlus" label={T.knopf.terminKurz} onClick={() => onAktion("termin", a)} />{T.knopf.terminKurz}</div>
          <div className="bo-crm-aktionskreis"><RundKnopf icon="Ellipsis" label={T.knopf.mehr} href={`/crm/anfragen/${encodeURIComponent(a.name)}`} />{T.knopf.mehr}</div>
        </div>
        {a.anliegen && (
          <div className="bo-crm-zitat">
            <p className="mb-1 text-[13px] text-bo-text-soft">{T.vorschau.wunsch}</p>
            <p className="line-clamp-5">{String(a.anliegen).replace(/<[^>]*>/g, "")}</p>
          </div>
        )}
        <dl className="bo-crm-fakten">
          <div><dt>{T.vorschau.fakten.ort}</dt><dd>{a.ort_der_beratung || "–"}</dd></div>
          <div><dt>{T.vorschau.fakten.art}</dt><dd>{a.projektart || T.art[a.art]}</dd></div>
          <div><dt>{T.vorschau.fakten.quelle}</dt><dd>{T.quelle[a.quelle] || a.quelle || "–"}</dd></div>
          <div><dt>{T.vorschau.fakten.zustaendig}</dt><dd>{a.zustaendigName ? <PersonZelle person={a.zustaendigName} groesse={24} /> : T.anfragen.niemand}</dd></div>
        </dl>
        <div className="grid gap-2">
          <p className="text-[13px] text-bo-text-soft">{T.vorschau.vorgang}</p>
          <MiniReise abgeleitet={a.abgeleitet} />
        </div>
        <div className="flex items-center gap-3">
          {emp && emp.id !== "terminOeffnen" && emp.id !== "angebotOeffnen" ? (
            <Knopf variant="primary" size="l" className="flex-1" icon={emp.id === "annehmen" ? "Check" : "CalendarPlus"} onClick={() => onAktion(emp.id === "annehmen" ? "annehmen" : "termin", a)} data-testid="crm-vorschau-primaer">{emp.titel}</Knopf>
          ) : (
            <Knopf variant="primary" size="l" className="flex-1" href={`/crm/anfragen/${encodeURIComponent(a.name)}`}>{T.knopf.oeffnen}</Knopf>
          )}
          <PfeilKnopf href={`/crm/anfragen/${encodeURIComponent(a.name)}`} label={`${a.person || a.name} öffnen`} />
        </div>
      </div>
    </aside>
  );
}

/**
 * @param {{liste:object[], gesamt:number, seite:number, groesse:number, basisQuery:string, berater:Array<{wert,titel}>, ich:string, leitung:boolean, mock:boolean, filterAktiv:boolean, sicht:string}} p
 */
export default function AnfragenListe({ liste, gesamt, seite, groesse, basisQuery = "", berater = [], ich, mock = false, filterAktiv = false, sicht, jetzt: jetztIso }) {
  const jetzt = useMemo(() => (jetztIso ? new Date(jetztIso) : new Date()), [jetztIso]);
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const [aktiv, setAktiv] = useState(liste[0]?.name || null);
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // {art, anfrage}
  const [nachfassen, setNachfassen] = useState("");
  const aktuelle = useMemo(() => liste.find((a) => a.name === aktiv) || null, [liste, aktiv]);

  const breit = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;
  const aktion = useCallback(
    async (art, a) => {
      if (!a) return;
      if (art === "annehmen") return fuehre(() => annehmenAction({ namen: [a.name] }), { text: (n) => (n > 1 ? T.toast.angenommenN(n) : T.toast.angenommen), fehlerText: "Annehmen", objekt: { doctype: "PH Anfrage", name: a.name } });
      if (art === "spam") return fuehre(() => spamAction({ namen: [a.name] }), { text: T.toast.spam, fehlerText: "Spam", objekt: { doctype: "PH Anfrage", name: a.name } });
      if (art === "mir") return fuehre(() => zuweisenAction({ doctype: "PH Anfrage", namen: [a.name], user: ich }), { text: T.toast.zugewiesen("dich") });
      if (art === "oeffnen") return router.push(`/crm/anfragen/${encodeURIComponent(a.name)}`);
      if (art === "nachfassen") setNachfassen(a.nachfassen?.faellig || "");
      setDialog({ art, anfrage: a });
    },
    [fuehre, ich, router]
  );

  useKuerzel("liste", { "crm.annehmen": () => (aktuelle?.status === "Neu" ? (aktion("annehmen", aktuelle), true) : false) });

  const masse = async (art) => {
    const namen = [...gewaehlt];
    if (!namen.length) return;
    if (art === "annehmen") await fuehre(() => annehmenAction({ namen: namen.filter((n) => liste.find((a) => a.name === n)?.status === "Neu") }), { text: (n) => (n > 1 ? T.toast.angenommenN(n) : T.toast.angenommen), fehlerText: "Annehmen" });
    if (art === "spam") await fuehre(() => spamAction({ namen }), { text: T.toast.spam, fehlerText: "Spam" });
    if (art === "mir") await fuehre(() => zuweisenAction({ doctype: "PH Anfrage", namen, user: ich }), { text: T.toast.zugewiesen("dich") });
    setGewaehlt(new Set());
  };

  const tasten = (e, a, i) => {
    if (e.target.closest("a, button, input, [data-kontaktweg]")) return;
    if (e.key === "Enter") {
      e.preventDefault();
      aktion("oeffnen", a);
    } else if (e.key === " ") {
      e.preventDefault();
      setAktiv(a.name);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const ziel = e.currentTarget.parentElement?.children[i + (e.key === "ArrowDown" ? 1 : -1)];
      ziel?.focus();
      if (ziel && breit()) setAktiv(liste[i + (e.key === "ArrowDown" ? 1 : -1)]?.name || aktiv);
    }
  };

  const klick = (e, a) => {
    if (e.target.closest("a, button, input, label, [data-kontaktweg]")) return;
    if (breit()) setAktiv(a.name);
    else aktion("oeffnen", a);
  };

  const knopfFuer = (a) => {
    const emp = empfehlung(a.abgeleitet);
    if (!emp) return null;
    if (emp.id === "annehmen") return <Knopf size="s" variant="secondary" onClick={() => aktion("annehmen", a)} laedt={laeuft && aktiv === a.name} data-testid="crm-zeile-annehmen">{T.knopf.annehmen}</Knopf>;
    if (emp.id === "termin" || emp.id === "neuerTermin") return <Knopf size="s" variant="secondary" onClick={() => aktion("termin", a)}>{emp.id === "termin" ? T.knopf.terminKurz : T.knopf.neuerTermin}</Knopf>;
    return <Knopf size="s" variant="ghost" href={`/crm/anfragen/${encodeURIComponent(a.name)}`}>{T.knopf.oeffnen}</Knopf>;
  };

  const menue = (a) => (
    <Menue label={`Aktionen für ${a.person || a.name}`} ausloeser={(p) => <RundKnopf {...p} icon="Ellipsis" label={`Aktionen für ${a.person || a.name}`} groesse="s" flach />}>
      {a.status === "Neu" && <MenuePunkt icon="Check" onWaehlen={() => aktion("annehmen", a)}>{T.knopf.annehmen}</MenuePunkt>}
      <MenuePunkt icon="User" onWaehlen={() => aktion("mir", a)}>Mir zuweisen</MenuePunkt>
      <MenuePunkt icon="CalendarPlus" onWaehlen={() => aktion("termin", a)}>{T.knopf.termin}</MenuePunkt>
      <MenuePunkt icon="CheckSquare" onWaehlen={() => aktion("aufgabe", a)}>{T.knopf.aufgabeAnlegen}</MenuePunkt>
      <MenuePunkt icon="Clock" onWaehlen={() => aktion("nachfassen", a)}>{T.anfragen.spalten.nachfassen} …</MenuePunkt>
      <MenueTrenner />
      {["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"].includes(a.status) && <MenuePunkt icon="CircleX" onWaehlen={() => aktion("verloren", a)}>{T.knopf.verloren}</MenuePunkt>}
      {a.status === "Neu" && <MenuePunkt icon="ShieldAlert" gefaehrlich onWaehlen={() => aktion("spam", a)}>{T.knopf.spam}</MenuePunkt>}
      <MenuePunkt icon="ArrowUpRight" href={`/crm/anfragen/${encodeURIComponent(a.name)}`}>{T.knopf.oeffnen}</MenuePunkt>
    </Menue>
  );

  const seiten = Math.max(1, Math.ceil(gesamt / groesse));
  const seiteHref = (s) => `/crm/anfragen?${basisQuery}${basisQuery ? "&" : ""}seite=${s}`;

  if (!liste.length) {
    return (
      <Kachel testid="crm-anfragen-leer">
        <Leer art={filterAktiv ? "gefiltert" : sicht === "neu" ? "erledigt" : "leer"} text={filterAktiv ? T.anfragen.leerGefiltert : sicht === "neu" ? T.anfragen.leerNeu : T.anfragen.leer} zuruecksetzenHref={filterAktiv ? "/crm/anfragen" : undefined} groesse="seite" />
      </Kachel>
    );
  }

  return (
    <div className="bo-crm-raster" data-mit-vorschau={aktuelle ? "true" : "false"}>
      <Kachel flach className="min-w-0" testid="crm-anfragen-liste">
        <div className="bo-crm-tabelle-huelle bo-scroll-x px-3 pt-5">
          <table className="bo-crm-tabelle">
            <thead>
              <tr>
                <th className="w-10"><span className="sr-only">Auswahl</span></th>
                <th>{T.anfragen.spalten.anfrage}</th>
                <th>{T.anfragen.spalten.kontakt}</th>
                <th>{T.anfragen.spalten.eingang}</th>
                <th className="hidden xl:table-cell"><span className="sr-only">{T.anfragen.spalten.zustaendig}</span></th>
                <th className="hidden 2xl:table-cell">{T.anfragen.spalten.nachfassen}</th>
                <th>{T.anfragen.spalten.status}</th>
                <th><span className="sr-only">{T.anfragen.spalten.aktion}</span></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a, i) => {
                const alt = alterText(a.eingang, { status: a.status, jetzt });
                const nf = a.nachfassen ? faelligText(a.nachfassen.faellig, jetzt) : null;
                const bild = raumBild(a.projektart || a.art, { mock });
                return (
                  <tr key={a.name} tabIndex={0} data-aktiv={aktiv === a.name && aktuelle ? "true" : undefined} data-gewaehlt={gewaehlt.has(a.name) ? "true" : undefined} onClick={(e) => klick(e, a)} onDoubleClick={() => aktion("oeffnen", a)} onKeyDown={(e) => tasten(e, a, i)} data-testid="crm-anfrage-zeile" data-name={a.name}>
                    <td>
                      <input type="checkbox" aria-label={`${a.person || a.name} auswählen`} checked={gewaehlt.has(a.name)} onChange={(e) => setGewaehlt((g) => {
                        const n = new Set(g);
                        if (e.target.checked) n.add(a.name);
                        else n.delete(a.name);
                        return n;
                      })} />
                    </td>
                    <td className="max-w-[300px]">
                      <div className="bo-crm-objekt">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Raumbild (Mock) */}
                        {bild ? <span className="bo-crm-bild"><img src={bild.src} alt="" style={{ objectPosition: bild.position }} /></span> : <Avatar name={a.person || a.titel} groesse={48} />}
                        <span className="min-w-0">
                          <Link href={`/crm/anfragen/${encodeURIComponent(a.name)}`} className="bo-crm-objekt__titel hover:underline" tabIndex={-1}>{a.person || ohneArt(a.titel)}</Link>
                          <span className="bo-crm-objekt__unter">{[T.art[a.art] || a.art, ortVon(a), a.name].filter(Boolean).join(" · ")}</span>
                        </span>
                      </div>
                    </td>
                    <td><KontaktKnoepfe email={a.email} telefon={a.telefon} wer={a.person} /></td>
                    <td className="whitespace-nowrap tabular-nums">{alt.wort ? <>{alt.text.split(" · ")[0]} · <span className="bo-crm-wort" data-ton={alt.wort === T.alter.ueberfaellig ? "ziegel" : undefined}>{alt.wort}</span></> : alt.text}</td>
                    <td className="hidden xl:table-cell">{a.zustaendigName ? <PersonZelle person={a.zustaendigName} groesse={24} nurAvatar /> : <span className="text-[13px] text-bo-text-faint" aria-label={T.anfragen.niemand}>–</span>}</td>
                    <td className="hidden whitespace-nowrap 2xl:table-cell">{nf ? <span className={nf.wort ? "bo-crm-wort" : ""}>{nf.text}</span> : <span className="text-bo-text-faint">–</span>}</td>
                    <td><StatusBadge wert={a.abgeleitet.status} text={a.abgeleitet.text} ton={a.abgeleitet.ton} groesse="m" /></td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">{knopfFuer(a)}{menue(a)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="bo-crm-karten px-3 pt-4">
          {liste.map((a) => (
            <li key={a.name}>
              <Link href={`/crm/anfragen/${encodeURIComponent(a.name)}`} className="bo-crm-karte">
                <Avatar name={a.person || a.titel} groesse={40} />
                <span className="min-w-0">
                  <span className="bo-crm-objekt__titel">{a.person || ohneArt(a.titel)}</span>
                  <span className="bo-crm-objekt__unter">{alterText(a.eingang, { status: a.status, jetzt }).text}</span>
                </span>
                <StatusBadge wert={a.abgeleitet.status} text={a.abgeleitet.text} ton={a.abgeleitet.ton} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 pt-3">
          <p className="text-[13px] text-bo-text-soft tabular-nums" data-testid="crm-anfragen-gesamt">{T.anfragen.anzahl(Math.min(gesamt, (seite - 1) * groesse + liste.length), gesamt)}</p>
          {seiten > 1 && (
            <div className="flex items-center gap-2">
              {seite > 1 && <Knopf size="s" variant="secondary" href={seiteHref(seite - 1)} icon="ChevronLeft">{T.knopf.zurueck}</Knopf>}
              {seite < seiten && <Knopf size="s" variant="secondary" href={seiteHref(seite + 1)} iconRechts="ChevronRight">{T.knopf.weiter}</Knopf>}
            </div>
          )}
        </div>
      </Kachel>

      {aktuelle && (
        <div className="bo-crm-vorschau-spalte min-w-0">
          <Vorschau a={aktuelle} onSchliessen={() => setAktiv(null)} onAktion={aktion} mock={mock} />
        </div>
      )}

      {gewaehlt.size > 0 && (
        <div className="bo-material-stark fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-pill px-3 py-2 shadow-(--bo-sh-float)" role="toolbar" aria-label="Auswahl" data-testid="crm-massen">
          <span className="px-2 text-[14px] font-medium tabular-nums">{gewaehlt.size} ausgewählt</span>
          <Knopf size="s" variant="secondary" onClick={() => masse("annehmen")}>{T.knopf.annehmen}</Knopf>
          <Knopf size="s" variant="secondary" onClick={() => masse("mir")}>Mir zuweisen</Knopf>
          <Knopf size="s" variant="secondary" onClick={() => masse("spam")}>{T.knopf.spam}</Knopf>
          <RundKnopf icon="X" label="Auswahl aufheben" groesse="s" onClick={() => setGewaehlt(new Set())} />
        </div>
      )}

      {dialog?.art === "verloren" && <VerlorenDialog offen onSchliessen={() => setDialog(null)} anfrage={{ ...dialog.anfrage, titelKurz: ohneArt(dialog.anfrage.titel) }} />}
      {dialog?.art === "aufgabe" && <AufgabeDialog offen onSchliessen={() => setDialog(null)} bezug={{ doctype: "PH Anfrage", name: dialog.anfrage.name }} kontakt={dialog.anfrage.kontakt} berater={berater} ich={ich} />}
      {dialog?.art === "termin" && <TerminAnlegenDialog offen onSchliessen={() => setDialog(null)} anfrage={{ name: dialog.anfrage.name, titel: dialog.anfrage.person || ohneArt(dialog.anfrage.titel), email: dialog.anfrage.email, modus: dialog.anfrage.ort_der_beratung, zugewiesen_an: dialog.anfrage.zugewiesen_an, thema: dialog.anfrage.projektart, wunschzeiten: dialog.anfrage.wunschzeiten }} berater={berater} ich={ich} />}
      {dialog?.art === "nachfassen" && (
        <Dialog offen onSchliessen={() => setDialog(null)} titel={T.anfragen.spalten.nachfassen} groesse="sm"
          fuss={<><Knopf variant="ghost" onClick={() => setDialog(null)}>{T.knopf.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} disabled={!nachfassen} onClick={async () => {
            const r = await fuehre(() => nachfassenAction({ anfrage: dialog.anfrage.name, datum: nachfassen }), { text: T.toast.nachfassen(nachfassen.split("-").reverse().join(".")) });
            if (r?.ok) setDialog(null);
          }}>{T.knopf.speichern}</Knopf></>}>
          <div className="bo-crm-feld"><span id="crm-nf-datum">{T.anfragen.spalten.nachfassen}</span><Datumsfeld value={nachfassen} onChange={setNachfassen} gruppeLabelId="crm-nf-datum" aria-label={T.anfragen.spalten.nachfassen} /></div>
        </Dialog>
      )}
    </div>
  );
}
