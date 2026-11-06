// Reiter der Auftragsmappe (10-konzept-projekte.md § 4.4, E1: genau 6). Server-Komponenten – sie bekommen die
// geladene Mappe und rendern nur. Leer-Zustände je Karte aus texte.js. Beträge nur, wenn `m.leitung`.

import Link from "next/link";
import Kachel, { Bento } from "../Kachel";
import Leer from "../Leer";
import Knopf from "../Knopf";
import { Pille } from "../StatusBadge";
import { Icon } from "../icons";
import Avatar, { AvatarReihe } from "../Avatar";
import { Fortschritt, ProjektStatus } from "./Teile";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import { lieferstatusMaterial } from "@/lib/backoffice/projekte/status";
import { datumKurz, euroRund, terminText } from "@/lib/backoffice/projekte/anzeige";
import { kwText, miniGantt, termineListe } from "@/lib/backoffice/projekte/mappe";
import { stunden } from "@/lib/backoffice/projekte/zeit";
import { maengelListe } from "@/lib/backoffice/projekte/maengel";
import { waehrungen } from "@/lib/backoffice/projekte/bezug";
import "./projekte.css";

const enc = encodeURIComponent;
const M = TEXTE.mappe;

function Bild({ src, alt = "" }) {
  if (!src) {
    return (
      <div className="bo-prj-objekt__bild" data-leer="" aria-hidden="true">
        <Icon name="FileText" className="size-6" />
      </div>
    );
  }
  return (
    <div className="bo-prj-objekt__bild">
      {/* eslint-disable-next-line @next/next/no-img-element -- Planungs-/Renderingvorschau */}
      <img src={src} alt={alt} decoding="async" />
    </div>
  );
}

// ------------------------------------------------------------------ 1 Übersicht --

export function TabUebersicht({ m, heute, empfehlungen, EmpfehlungListe, personen = {} }) {
  const termine = termineListe(m, heute).slice(0, 5);
  const gantt = miniGantt(m, heute);
  const aufgaben = (m.aufgaben || []).filter((a) => ["Offen", "In Arbeit"].includes(a.status));
  const minuten = (m.zeiten || []).reduce((s, z) => s + Number(z.dauer_min || 0), 0);
  const fotos = (m.fotos || []).slice(0, 6);
  return (
    <Bento>
      <Kachel className="md:col-span-7" titel={TEXTE.uebersicht.empfohlen} unter={empfehlungen.length ? `${empfehlungen.length === 1 ? "1 Punkt" : `${empfehlungen.length} Punkte`} in der Phase ${statusText("PH Projekt", m.projekt.status)}` : undefined} testid="karte-empfohlen">
        {empfehlungen.length ? EmpfehlungListe : <Leer art="erledigt" groesse="karte" titel={M.keinEmpfohlen} />}
      </Kachel>
      <Kachel className="md:col-span-5" titel={M.termine} unter={termine.length ? `${termine.length} kommende` : undefined} testid="karte-termine">
        {termine.length ? (
          <ul className="bo-prj-liste">
            {termine.map((t, i) => (
              <li key={`${t.art}-${i}`}>
                <span className="bo-prj-liste__ico" data-ton={t.art === "montage" ? "salbei" : t.art === "lieferung" ? "cognac" : t.art === "fremdgewerk" ? "eiche" : "see"} aria-hidden="true">
                  <Icon name={t.art === "montage" ? "Hammer" : t.art === "lieferung" ? "Truck" : t.art === "fremdgewerk" ? "Wrench" : "CalendarDays"} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  {t.href ? (
                    <Link href={t.href} className="bo-prj-titel block truncate text-[15px] leading-5">
                      {t.titel}
                    </Link>
                  ) : (
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{t.titel}</span>
                  )}
                </span>
                <span className="bo-prj-liste__zeit">{terminText(t.start, heute, { mitZeit: !t.ganztag })}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Leer groesse="karte" titel={M.termineLeer} />
        )}
      </Kachel>
      <Kachel className="md:col-span-12" titel={M.miniGantt} unter={M.miniGanttUnter} werkzeuge={<Knopf size="s" variant="ghost" href={`/projekte/liste?ansicht=zeitplan&projekt=${enc(m.projekt.name)}`}>{M.imZeitplan}</Knopf>} testid="mini-gantt">
        <MiniGantt g={gantt} />
      </Kachel>
      <Kachel className="md:col-span-5" titel={M.aufgaben} unter={aufgaben.length ? `${aufgaben.length} offen` : undefined} werkzeuge={<Knopf size="s" icon="Plus" href={`/projekte/aufgaben?projekt=${enc(m.projekt.name)}&neu=1`}>{M.aufgabeNeu}</Knopf>} testid="karte-aufgaben">
        {aufgaben.length ? (
          <ul className="bo-prj-liste">
            {aufgaben.slice(0, 5).map((a) => {
              const ueber = a.faellig && a.faellig < heute;
              return (
                <li key={a.name}>
                  {a.zugewiesen_an ? <Avatar name={personen[a.zugewiesen_an]?.name || a.zugewiesen_an} groesse={32} /> : <span className="bo-prj-liste__ico" aria-hidden="true"><Icon name="User" className="size-4" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{a.titel}</span>
                    <span className="bo-prj-unter block">{statusText("PH Projekt Aufgabe", a.status)}</span>
                  </span>
                  {a.faellig && <span className={`bo-prj-liste__zeit ${ueber ? "!text-bo-warning-text" : ""}`}>{ueber ? TEXTE.aufgaben.ueberfaellig : terminText(a.faellig, heute, { mitZeit: false })}</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <Leer art="erledigt" groesse="karte" titel={M.aufgabenLeer} />
        )}
      </Kachel>
      <Kachel className="md:col-span-3" titel={M.zeiten} unter={(m.zeiten || []).length ? `${(m.zeiten || []).length} Buchungen` : undefined} testid="karte-zeiten">
        {minuten ? (
          <>
            <p className="bo-zahl-gross tabular-nums">{stunden(minuten)} h</p>
            <p className="bo-prj-unter mt-2">{[...new Set((m.zeiten || []).map((z) => z.taetigkeit))].map((t) => statusText("PH Projektzeit", t)).join(" · ")}</p>
          </>
        ) : (
          <Leer groesse="karte" titel={M.zeitenLeer} />
        )}
      </Kachel>
      <Kachel className="md:col-span-4" titel={M.fotos} unter={(m.fotos || []).length ? `${(m.fotos || []).length} im Bautagebuch` : undefined} href={(m.fotos || []).length ? `/projekte/${enc(m.projekt.name)}?tab=dateien&ansicht=fotos` : undefined} testid="karte-fotos">
        {fotos.length ? (
          <div className="bo-prj-fotos">
            {fotos.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element -- Bautagebuch
              <img key={f.name} src={f.bild} alt={f.titel || ""} decoding="async" />
            ))}
          </div>
        ) : (
          <Leer groesse="karte" titel={M.fotosLeer} />
        )}
      </Kachel>
      {m.projekt.kurzbeschreibung && (
        <Kachel className="md:col-span-12" titel={M.beschreibung} dicht>
          <p className="max-w-[80ch] text-[15px] leading-[22px] text-bo-text-soft">{m.projekt.kurzbeschreibung}</p>
        </Kachel>
      )}
    </Bento>
  );
}

export function MiniGantt({ g }) {
  if (!g.zeilen.length) return <p className="text-[15px] text-bo-text-soft">Keine Termine in den nächsten acht Wochen.</p>;
  return (
    <div className="bo-prj-gantt" style={{ "--gantt-links": "120px" }}>
      <div className="bo-prj-gantt__kopf" aria-hidden="true">
        {g.kw.map((k) => (
          <span key={k.text} style={{ left: `${k.links}%` }}>
            {k.text}
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {g.zeilen.map((z) => (
          <li key={z.id} className="bo-prj-gantt__zeile">
            <span className="bo-prj-gantt__name">{z.titel}</span>
            <span className="bo-prj-gantt__spur">
              <span className="bo-prj-gantt__heute" style={{ left: `${g.heuteLinks}%` }} aria-hidden="true" />
              <span className="bo-prj-gantt__b bo-tip" data-art={z.art} data-tip={z.text} role="img" aria-label={z.text} style={{ left: `${z.links}%`, width: `${z.breite}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ 2 Positionen --

export function TabPositionen({ m, heute }) {
  const P = TEXTE.positionen;
  const pos = m.positionen || [];
  const raeume = [...new Set([...(m.raeume || []).map((r) => r.raum), ...pos.map((p) => p.raum || P.ohneRaum)])];
  const nachtraege = m.nachtraege || [];
  return (
    <div className="flex flex-col gap-6">
      <Kachel titel={P.titel} unter={pos.length ? `${pos.length} Positionen in ${raeume.length} Räumen` : undefined} testid="karte-positionen">
        {!pos.length ? (
          <Leer titel={P.leer} groesse="karte" />
        ) : (
          <div className="flex flex-col gap-6">
            {raeume.map((raum) => {
              const liste = pos.filter((p) => (p.raum || P.ohneRaum) === raum);
              if (!liste.length) return null;
              return (
                <section key={raum} className="bo-prj-raum" aria-label={raum}>
                  <div className="bo-prj-raum__kopf">
                    <h3 className="bo-titel-kachel">{raum}</h3>
                    <span className="bo-prj-unter">{liste.length} Positionen</span>
                  </div>
                  {liste.map((p) => {
                    const teil = p.lieferstatus === "teilgeliefert";
                    return (
                      <div key={p.name} className="bo-prj-pos" data-storniert={p.lieferstatus === "storniert" ? "" : undefined}>
                        <div className="min-w-0">
                          <p className="bo-prj-titel truncate">{p.bezeichnung}</p>
                          <p className="bo-prj-unter truncate">
                            {[p.marke, `${p.menge || 1} Stk.`, p.montage_art ? `Montage: ${p.montage_art}` : "", p.liefertermin ? `${P.liefertermin} ${datumKurz(p.liefertermin)} (${kwText(p.liefertermin)})` : ""].filter(Boolean).join(" · ")}
                          </p>
                          {Number(p.nachlieferung_noetig) ? <p className="mt-1 text-[13px] text-bo-warning-text">{P.nachlieferung(kwText(p.nachlieferung_termin), p.nachlieferung_grund)}</p> : null}
                        </div>
                        <Pille material={lieferstatusMaterial(p.lieferstatus)} groesse="sm">
                          {teil ? P.teilweise(p.menge_geliefert || 0, p.menge || 1) : P.lieferstatusText[p.lieferstatus] || p.lieferstatus || P.lieferstatusText.offen}
                        </Pille>
                        {m.leitung && p.preis_cent !== undefined ? <span className="text-right text-[15px] tabular-nums">{euroRund(Number(p.preis_cent) * (p.menge || 1))}</span> : <span />}
                      </div>
                    );
                  })}
                </section>
              );
            })}
            <p className="text-[12px] text-bo-text-soft">{P.mengeGanz}</p>
          </div>
        )}
      </Kachel>
      <Kachel titel={P.nachtraege} unter={nachtraege.length ? `${nachtraege.length} Nachträge` : undefined} testid="karte-nachtraege">
        {nachtraege.length ? (
          <ul className="bo-prj-liste">
            {nachtraege.map((n) => (
              <li key={n.name}>
                <span className="bo-prj-liste__ico" data-ton="eiche" aria-hidden="true">
                  <Icon name="Layers" className="size-4" />
                </span>
                <Link href={`/projekte/${enc(m.projekt.name)}/nachtraege/${enc(n.name)}`} className="min-w-0 flex-1">
                  <span className="bo-prj-titel block truncate text-[15px] leading-5">{n.titel || n.bezeichnung}</span>
                  <span className="bo-prj-unter block">{n.vorgelegt_am ? `vorgelegt ${terminText(n.vorgelegt_am, heute, { mitZeit: false })}` : "Entwurf"}</span>
                </Link>
                {m.leitung && n.differenz_cent !== undefined && <span className="tabular-nums text-[15px]">{Number(n.differenz_cent) >= 0 ? "+" : ""}{euroRund(n.differenz_cent)}</span>}
                <ProjektStatus doctype="PH Nachtrag" wert={n.status} />
              </li>
            ))}
          </ul>
        ) : (
          <Leer groesse="karte" titel={P.nachtraegeLeer} />
        )}
      </Kachel>
    </div>
  );
}

// ------------------------------------------------------------------ 3 Planung --

export function TabPlanung({ m, heute }) {
  const P = TEXTE.planung;
  const name = m.projekt.name;
  const varianten = [...new Set((m.renderings || []).map((r) => r.variante))];
  return (
    <div className="flex flex-col gap-6">
      <Kachel titel={P.aufmass} testid="karte-aufmass">
        {(m.aufmasse || []).length ? (
          <ul className="bo-prj-liste">
            {m.aufmasse.map((a) => (
              <li key={a.name}>
                <span className="bo-prj-liste__ico" data-ton="see" aria-hidden="true">
                  <Icon name="Ruler" className="size-4" />
                </span>
                <Link href={`/projekte/${enc(name)}/aufmass/${enc(a.name)}`} className="min-w-0 flex-1">
                  <span className="bo-prj-titel block truncate text-[15px] leading-5">{a.titel}</span>
                  <span className="bo-prj-unter block">{a.datum ? datumKurz(a.datum, { jahr: true }) : ""}{a.plausibilitaet ? ` · ${a.plausibilitaet}` : ""}</span>
                </Link>
                <ProjektStatus doctype="PH Aufmass" wert={a.status} />
              </li>
            ))}
          </ul>
        ) : (
          <Leer groesse="karte" titel={P.aufmassLeer} />
        )}
      </Kachel>
      <Kachel titel={P.planungen} unter={(m.planungen || []).length ? `${m.planungen.length} Versionen` : undefined} testid="karte-planungen">
        {(m.planungen || []).length ? (
          <div className="bo-prj-raster">
            {m.planungen.map((p) => (
              <article key={p.name} className="bo-prj-objekt">
                <Bild src={p.vorschau} alt={p.titel} />
                <div className="bo-prj-objekt__text">
                  <Link href={`/projekte/${enc(name)}/planung/${enc(p.name)}`} className="bo-prj-zeilenlink bo-prj-titel truncate">
                    {p.bezeichnung || p.titel} <span className="font-normal text-bo-text-soft">{P.version(p.version || 1)}</span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProjektStatus doctype="PH Planung" wert={p.status} />
                    <span className="text-[12px] text-bo-text-soft">{Number(p.kunde_sichtbar) ? M.kundeSieht : M.intern}</span>
                  </div>
                  {p.kunde_kommentar && <p className="bo-prj-eintrag__zitat text-[14px]">„{p.kunde_kommentar}“</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Leer groesse="karte" titel={P.planungenLeer} />
        )}
      </Kachel>
      <Kachel titel={P.renderings} unter={varianten.length ? `${varianten.length} Varianten` : undefined} testid="karte-renderings">
        {(m.renderings || []).length ? (
          <div className="bo-prj-raster">
            {m.renderings.map((r) => (
              <article key={r.name} className="bo-prj-objekt">
                <Bild src={r.bild} alt={r.titel} />
                <div className="bo-prj-objekt__text">
                  <Link href={`/projekte/${enc(name)}/renderings/${enc(r.name)}`} className="bo-prj-zeilenlink bo-prj-titel truncate">
                    {P.variante(r.variante)} {P.version(r.version || 1)} · {r.bezeichnung}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <ProjektStatus doctype="PH Rendering" wert={r.status} />
                    {Number(r.ki_generiert) ? <Pille material="messing" groesse="xs" punkt={false}>{P.kiGestuetzt}</Pille> : null}
                  </div>
                  <p className="bo-prj-unter">{TEXTE.rendering.votes(r.votes_up || 0, r.votes_down || 0)}{Number(r.feedback_offen) ? ` · ${P.offen(r.feedback_offen)}` : ""}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Leer groesse="karte" titel={P.renderingsLeer} />
        )}
      </Kachel>
      <p className="text-[12px] text-bo-text-soft">Stand {terminText(heute, heute, { mitZeit: false })}</p>
    </div>
  );
}

// ------------------------------------------------------------------ 4 Belege & Lieferung --

const BEZUG_LEER = {
  "app-fehlt": (was) => `${was} ist noch nicht eingerichtet – Belege erscheinen hier, sobald sie existieren.`,
  "nicht-verknuepft": (was) => `${was} sind mit diesem Projekt nicht verknüpft.`,
  fehler: () => "Gerade nicht abrufbar.",
  "kein-recht": () => "Kein Zugriff auf diese Belege.",
};

export function TabBelege({ m, heute }) {
  const abschnitte = [
    ["angebote", "Angebote", "Faktura"],
    ["auftraege", "Auftragsbestätigungen", "Faktura"],
    ["rechnungen", "Rechnungen", "Faktura"],
    ["herstellerbestellungen", "Herstellerbestellungen", "Sortiment"],
    ["lieferscheine", "Lieferscheine", "Logistik"],
  ];
  const alle = [...(m.angebote || []), ...(m.auftraege || []), ...(m.rechnungen || [])];
  const mehrereWaehrungen = waehrungen(alle).length > 1;
  return (
    <Bento>
      {abschnitte.map(([key, titel, app]) => {
        const zeilen = m[key] || [];
        const st = m.bezug?.[key];
        return (
          <Kachel key={key} className="md:col-span-6" titel={titel} unter={zeilen.length ? `${zeilen.length}` : app} testid={`belege-${key}`}>
            {st && st !== "ok" ? (
              <p className="text-[15px] leading-[22px] text-bo-text-soft">{BEZUG_LEER[st]?.(key === "herstellerbestellungen" ? "Bestellungen" : app) || ""}</p>
            ) : zeilen.length ? (
              <ul className="bo-prj-liste">
                {zeilen.map((z) => (
                  <li key={z.name} className={z.status === "Storniert" || z.docstatus === 2 ? "opacity-60" : undefined}>
                    <span className="bo-prj-liste__ico" data-ton="cognac" aria-hidden="true">
                      <Icon name={key === "lieferscheine" ? "Truck" : key === "herstellerbestellungen" ? "Package" : "Receipt"} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="bo-prj-titel block truncate text-[15px] leading-5">{z.name}{z.art ? ` · ${z.art}` : ""}</span>
                      <span className="bo-prj-unter block">{[z.status, z.datum ? datumKurz(z.datum, { jahr: true }) : "", z.bestaetigter_termin ? `bestätigt ${kwText(z.bestaetigter_termin)}` : ""].filter(Boolean).join(" · ")}</span>
                    </span>
                    {m.leitung && (z.brutto_cent ?? z.auftragswert_cent) !== undefined && <span className="tabular-nums text-[15px]">{euroRund(z.brutto_cent ?? z.auftragswert_cent)}{z.waehrung && z.waehrung !== "EUR" ? ` (${z.waehrung})` : ""}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-bo-text-soft">{key === "angebote" ? "Noch kein Angebot." : `Noch keine ${titel}.`}</p>
            )}
          </Kachel>
        );
      })}
      <Kachel className="md:col-span-6" titel={M.zahlungsstand} unter={M.zahlungsstandUnter} testid="zahlungsstand">
        {m.leitung ? (
          <p className="text-[15px] leading-[22px] text-bo-text-soft">{mehrereWaehrungen ? "Belege in mehreren Währungen – keine Summe." : (m.rechnungen || []).length ? `${m.rechnungen.length} Rechnungen, offen siehe Belege.` : "Noch keine Rechnungen."} Berechnete Projektsummen folgen mit der Faktura-Anbindung.</p>
        ) : (
          <p className="text-[15px] text-bo-text-soft">{TEXTE.fehler.nurLeitung}</p>
        )}
      </Kachel>
      <p className="col-span-full text-[12px] text-bo-text-soft">Belege nur mit Bezug auf dieses Projekt und denselben Kunden. Stand {terminText(heute, heute, { mitZeit: false })}.</p>
    </Bento>
  );
}

// ------------------------------------------------------------------ 5 Montage --

export function TabMontage({ m, heute, personen = {} }) {
  const name = m.projekt.name;
  const maengel = maengelListe({ montagen: m.montagen, abnahmen: m.abnahmen, gewerke: m.gewerke }, { heute });
  return (
    <div className="flex flex-col gap-6">
      <Kachel titel="Montageaufträge" unter={(m.montagen || []).length ? `${m.montagen.length}` : undefined} testid="karte-montagen">
        {(m.montagen || []).length ? (
          <ul className="bo-prj-liste">
            {m.montagen.map((x) => {
              const l = x.leistungen || [];
              const fertig = l.filter((y) => Number(y.erledigt)).length;
              return (
                <li key={x.name}>
                  <AvatarReihe personen={(x.team || []).map((t) => personen[t.user]?.name || t.user)} max={3} groesse={28} />
                  <Link href={`/projekte/montagen/${enc(x.name)}`} className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{terminText(x.start, heute)}{x.ende && String(x.ende).slice(0, 10) !== String(x.start).slice(0, 10) ? ` – ${datumKurz(x.ende)}` : x.ende ? `–${String(x.ende).slice(11, 16)}` : ""}</span>
                    <span className="bo-prj-unter block">{TEXTE.montagen.leistungen(fertig, l.length)}{(x.maengel || []).length ? ` · ${(x.maengel || []).length} Mängel` : ""}{x.fahrzeug ? ` · ${x.fahrzeug}` : ""}</span>
                  </Link>
                  <ProjektStatus doctype="PH Montageauftrag" wert={x.status} />
                </li>
              );
            })}
          </ul>
        ) : (
          <Leer groesse="karte" titel="Noch keine Montage geplant." />
        )}
      </Kachel>
      <Bento einblenden={false}>
        <Kachel className="md:col-span-6" titel="Fremdgewerke" testid="karte-gewerke">
          {(m.gewerke || []).length ? (
            <ul className="bo-prj-liste">
              {m.gewerke.map((g) => (
                <li key={g.name}>
                  <span className="bo-prj-liste__ico" data-ton="eiche" aria-hidden="true"><Icon name="Wrench" className="size-4" /></span>
                  <Link href={`/projekte/fremdgewerke?gewerk=${enc(g.name)}`} className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{g.gewerk} · {g.partner_text}</span>
                    <span className="bo-prj-unter block">{g.termin_von ? terminText(g.termin_von, heute) : "ohne Termin"}{g.abnahme_status ? ` · Abnahme ${statusText("*", g.abnahme_status)}` : ""}</span>
                  </Link>
                  <ProjektStatus doctype="PH Fremdgewerk" wert={g.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Leer groesse="karte" titel={TEXTE.fremdgewerke.leer} />
          )}
        </Kachel>
        <Kachel className="md:col-span-6" titel="Abnahmen" testid="karte-abnahmen">
          {(m.abnahmen || []).length ? (
            <ul className="bo-prj-liste">
              {m.abnahmen.map((a) => (
                <li key={a.name}>
                  <span className="bo-prj-liste__ico" data-ton="salbei" aria-hidden="true"><Icon name="PenTool" className="size-4" /></span>
                  <Link href={`/projekte/abnahmen/${enc(a.name)}`} className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{a.titel}</span>
                    <span className="bo-prj-unter block">{datumKurz(a.datum, { jahr: true })}{Number(a.maengel_offen) ? ` · ${TEXTE.abnahme.abschliessenGrund(Number(a.maengel_offen))}` : ""}</span>
                  </Link>
                  <ProjektStatus doctype="PH Abnahme" wert={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Leer groesse="karte" titel="Noch keine Abnahme." />
          )}
        </Kachel>
        <Kachel className="md:col-span-6" titel="Offene Mängel" unter={maengel.length ? `${maengel.length}` : undefined} href={maengel.length ? `/projekte/maengel?projekt=${enc(name)}` : undefined} testid="karte-maengel">
          {maengel.length ? (
            <ul className="bo-prj-liste">
              {maengel.slice(0, 4).map((x) => (
                <li key={x.id}>
                  <span className="bo-prj-liste__ico" data-ton={x.ueberfaellig ? "eiche" : undefined} aria-hidden="true"><Icon name="TriangleAlert" className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{x.beschreibung}</span>
                    <span className="bo-prj-unter block">{TEXTE.maengel.quelle[x.quelle]}{x.verantwortlich ? ` · ${x.verantwortlich}` : ""}</span>
                  </span>
                  <span className="bo-prj-liste__zeit">{x.ueberfaellig ? TEXTE.maengel.ueberfaellig(x.ueberfaellig) : x.frist ? `bis ${datumKurz(x.frist)}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Leer art="erledigt" groesse="karte" titel={TEXTE.maengel.leer} />
          )}
        </Kachel>
        <Kachel className="md:col-span-6" titel={TEXTE.produktpaesse.titel} testid="karte-produktpaesse">
          {(m.produktpaesse || []).length ? (
            <ul className="bo-prj-liste">
              {m.produktpaesse.map((p) => (
                <li key={p.name}>
                  <span className="bo-prj-liste__ico" data-ton="see" aria-hidden="true"><Icon name="BadgeCheck" className="size-4" /></span>
                  <Link href={`/projekte/produktpaesse/${enc(p.name)}`} className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate text-[15px] leading-5">{p.titel}</span>
                    <span className="bo-prj-unter block">{TEXTE.produktpaesse.garantie} {p.garantie_bis ? datumKurz(p.garantie_bis, { jahr: true }) : TEXTE.produktpaesse.keineAngabe}</span>
                  </Link>
                  <ProjektStatus doctype="PH Produktpass" wert={p.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Leer groesse="karte" titel={TEXTE.produktpaesse.leer} />
          )}
        </Kachel>
      </Bento>
    </div>
  );
}

// ------------------------------------------------------------------ 6 Dateien --

export function TabDateien({ m, ansicht = "dokumente", Umschalter, einstellungen = {} }) {
  const D = TEXTE.dokumente;
  const fotos = m.fotos || [];
  return (
    <Kachel titel={ansicht === "fotos" ? D.fotos : D.dokumente} werkzeuge={Umschalter} testid="karte-dateien">
      {ansicht === "fotos" ? (
        !Number(einstellungen.tagebuch_aktiv ?? 1) ? (
          <Leer groesse="karte" titel={D.tagebuchAus} />
        ) : fotos.length ? (
          <div className="bo-prj-fotos bo-prj-fotos--gross">
            {fotos.map((f) => (
              <figure key={f.name} className="flex flex-col gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- Bautagebuch */}
                <img src={f.bild} alt={f.titel || ""} decoding="async" />
                <figcaption className="text-[12px] text-bo-text-soft">{statusText("*", f.phase)} · {f.von === "kunde" ? "Kunde" : "Team"}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <Leer groesse="karte" titel={D.fotosLeer} />
        )
      ) : (m.dokumente || []).length ? (
        <div className="bo-prj-raster">
          {m.dokumente.map((d) => (
            <article key={d.name} className="bo-prj-objekt">
              <Bild src={/^image\//.test(d.mime || "") ? d.datei : ""} alt={d.titel} />
              <div className="bo-prj-objekt__text">
                <Link href={`/projekte/dokumente?dokument=${enc(d.name)}`} className="bo-prj-zeilenlink bo-prj-titel truncate">{d.titel}</Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Pille material="travertin" punkt={false} groesse="xs">{d.kategorie}</Pille>
                  <span className="text-[12px] text-bo-text-soft">{Number(d.kunde_sichtbar) ? M.kundeSieht : M.intern}{d.version > 1 ? ` · Version ${d.version}` : ""}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Leer groesse="karte" titel={D.leer} />
      )}
    </Kachel>
  );
}

export { Fortschritt };
