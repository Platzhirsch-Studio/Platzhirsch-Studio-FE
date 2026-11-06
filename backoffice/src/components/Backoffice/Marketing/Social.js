"use client";
// Social (10-konzept-marketing § 2.9): Kalender (Fundament-Kalender, Events als Hintergrund), Kanban (einziges Kanban
// des Bereichs; gesperrte Ziele halbtransparent mit Grund, Menü „Verschieben nach …“), Liste mit Massenaktionen.
// Datum setzen per Ziehen oder Dialog für jeden Status (verzögerter Commit). Neuer Beitrag am angeklickten Tag.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Kalender from "../Kalender/Kalender";
import Knopf from "../Knopf";
import { Dialog, Menue, MenuePunkt } from "../Overlay";
import Datumsfeld from "../Formular/Datumsfeld";
import useAktion from "./useAktion";
import { Bild, Status } from "./Bausteine";
import { socialAnlegenAction, socialDatumAction, socialWorkflowAction } from "@/lib/backoffice/marketing/actions";
import { kurzDatum, formatErlaubt } from "@/lib/backoffice/marketing/regeln";
import { SOCIAL, SOCIAL_FORMATE, SOCIAL_KANAELE, STATUS_TEXT } from "@/lib/backoffice/marketing/texte";

const SPALTEN = ["Idee", "Entwurf", "Wartet", "Freigegeben", "Geplant", "Veroeffentlicht"];

export function NeuerBeitragDialog({ datum: start, onSchliessen }) {
  const router = useRouter();
  const [w, setW] = useState({ titel: "", datum: start || new Date().toISOString().slice(0, 10), kanal: "Instagram", format: "Post" });
  const [fehler, setFehler] = useState({});
  const { sofort, laeuft } = useAktion();
  const los = async (oeffnen) => {
    const r = await sofort(() => socialAnlegenAction(w), { ok: SOCIAL.angelegt(w.titel), neuLaden: !oeffnen });
    if (r?.ok) {
      onSchliessen();
      if (oeffnen) router.push(`/marketing/social/${encodeURIComponent(r.name)}`);
    } else setFehler(r?.fehler || {});
  };
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={SOCIAL.neuTitel} groesse="sm" testid="beitrag-neu" fuss={<><Knopf onClick={() => los(true)} disabled={laeuft}>Anlegen und öffnen</Knopf><Knopf variant="primary" onClick={() => los(false)} laedt={laeuft} disabled={laeuft}>Anlegen</Knopf></>}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); los(false); }}>
        <label className="bo-mar-feld">
          <span>{SOCIAL.felder.titel}</span>
          <input className="bo-mar-eingabe" autoFocus value={w.titel} onChange={(e) => setW({ ...w, titel: e.target.value })} aria-invalid={fehler.titel ? "true" : undefined} data-testid="beitrag-titel" />
          {fehler.titel && <span className="bo-mar-feld__fehler">{fehler.titel}</span>}
        </label>
        <div className="bo-mar-felder">
          <div className="bo-mar-feld"><span>{SOCIAL.felder.datum_geplant}</span><Datumsfeld value={w.datum} onChange={(v) => setW({ ...w, datum: v })} aria-label={SOCIAL.felder.datum_geplant} /></div>
          <label className="bo-mar-feld">
            <span>{SOCIAL.felder.kanal}</span>
            <select className="bo-mar-eingabe" value={w.kanal} onChange={(e) => setW({ ...w, kanal: e.target.value, format: SOCIAL_FORMATE[e.target.value][0] })}>
              {SOCIAL_KANAELE.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label className="bo-mar-feld">
            <span>{SOCIAL.felder.format}</span>
            <select className="bo-mar-eingabe" value={w.format} onChange={(e) => setW({ ...w, format: e.target.value })}>
              {["Pin", "Board", "Post", "Reel", "Story", "Karussell", "Video"].map((f) => <option key={f} value={f} disabled={!formatErlaubt(w.kanal, f)}>{f}{!formatErlaubt(w.kanal, f) ? " (nicht für diesen Kanal)" : ""}</option>)}
            </select>
          </label>
        </div>
        <p className="bo-mar-klein">Der Beitrag beginnt als Idee. Freigegeben wird mit Bild und Bildrechten.</p>
      </form>
    </Dialog>
  );
}

export function NeuerBeitragKnopf({ auto = false }) {
  const [offen, setOffen] = useState(auto);
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} data-testid="neuer-beitrag">{SOCIAL.neu}</Knopf>
      {offen && <NeuerBeitragDialog onSchliessen={() => setOffen(false)} />}
    </>
  );
}

export function SocialKalender({ beitraege = [], events = [], datum, ansicht = "woche", darf }) {
  const router = useRouter();
  const [neu, setNeu] = useState(null);
  const { verzoegert } = useAktion();
  const eintraege = useMemo(
    () => [
      ...beitraege.map((b) => ({ id: b.name, quelle: "social", titel: `${b.titel}`, unter: `${b.kanal} · ${b.format}${b.anzeigeStatus === "Wartet" ? ` · ${SOCIAL.wartetChip}` : ""}`, start: `${b.datum_geplant} ${String(b.uhrzeit_geplant || "09:00").slice(0, 5)}`, ende: "", status: STATUS_TEXT.social[b.anzeigeStatus], href: `/marketing/social/${encodeURIComponent(b.name)}`, verschiebbar: darf && !["Veroeffentlicht", "Verworfen"].includes(b.status) })),
      ...events.map((e) => ({ id: `ev-${e.name}`, quelle: "event", titel: e.titel, start: e.uhrzeit_von ? `${e.datum} ${String(e.uhrzeit_von).slice(0, 5)}` : e.datum, ende: e.uhrzeit_bis ? `${e.datum} ${String(e.uhrzeit_bis).slice(0, 5)}` : "", ganztag: !e.uhrzeit_von, href: `/marketing/events/${encodeURIComponent(e.name)}`, verschiebbar: false })),
    ],
    [beitraege, events, darf]
  );
  return (
    <>
      <div className="bo-kachel" style={{ padding: 16 }} data-testid="social-kalender">
        <Kalender
          eintraege={eintraege}
          quellen={["social", "event"]}
          startAnsicht={ansicht}
          startDatum={datum}
          von="08:00"
          bis="20:00"
          hoehe={560}
          label="Redaktionsplan"
          onNeu={darf ? ({ tag }) => setNeu(tag) : undefined}
          onOeffnen={(e) => e.href && router.push(e.href)}
          onVerschieben={darf ? async (e, { start }) => {
            const tag = String(start).slice(0, 10);
            await verzoegert(() => socialDatumAction({ ziele: [{ name: e.id, datum: tag }] }), { text: SOCIAL.datumGesetzt(e.titel, kurzDatum(tag)) });
          } : undefined}
        />
      </div>
      {neu && <NeuerBeitragDialog datum={neu} onSchliessen={() => setNeu(null)} />}
    </>
  );
}

/** Erlaubte Ziele je Status (gespiegelt aus dem Workflow; Freigabe nur in der Akte mit D2). */
function zielGrund(b, nach, leitung) {
  const von = b.anzeigeStatus;
  if (von === nach) return "gleiche Spalte";
  if (von === "Idee" && nach === "Entwurf") return null;
  if (["Wartet", "Freigegeben"].includes(nach)) return "Freigabe nur in der Akte mit Bild und Bildrechten";
  if (nach === "Geplant") return von === "Freigegeben" ? null : "Zuerst freigeben";
  if (nach === "Veroeffentlicht") return "Nur über „Als veröffentlicht markieren …“ mit Adresse";
  if (nach === "Entwurf" && ["Freigegeben", "Geplant"].includes(von)) return leitung ? null : "Nur Leitung Marketing";
  if (nach === "Idee") return "Zurück zur Idee gibt es nicht";
  return "nicht möglich";
}

export function SocialKanban({ beitraege = [], leitung, darf }) {
  const [ziehe, setZiehe] = useState(null);
  const { sofort, verzoegert } = useAktion();
  const spalten = SPALTEN.map((s) => ({ s, karten: beitraege.filter((b) => b.anzeigeStatus === s) }));
  const verschiebe = async (b, nach) => {
    if (zielGrund(b, nach, leitung)) return;
    if (b.anzeigeStatus === "Idee" && nach === "Entwurf") return sofort(() => socialWorkflowAction({ namen: [b.name], aktion: "Ausarbeiten" }), { ok: SOCIAL.ausarbeitenToast(b.titel) });
    if (nach === "Entwurf") return sofort(() => socialWorkflowAction({ namen: [b.name], aktion: "Zurück auf Entwurf" }), { ok: "Zurück auf Entwurf" });
    if (nach === "Geplant") return verzoegert(() => socialDatumAction({ ziele: [{ name: b.name, datum: b.datum_geplant }] }), { text: `„${b.titel}“ geplant` });
  };
  return (
    <div className="bo-mar-kanban" data-testid="social-kanban">
      {spalten.map(({ s, karten }) => {
        const gesperrt = ziehe ? !!zielGrund(ziehe, s, leitung) : false;
        return (
          <section
            key={s}
            className="bo-mar-kanban__spalte"
            aria-label={STATUS_TEXT.social[s]}
            data-gesperrt={ziehe && gesperrt && ziehe.anzeigeStatus !== s ? "true" : undefined}
            onDragOver={(e) => { if (ziehe && !gesperrt) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (ziehe) verschiebe(ziehe, s); setZiehe(null); }}
          >
            <div className="bo-mar-kanban__kopf">
              <Status gruppe="social" wert={s} />
              <span className="bo-mar-klein tabular-nums">{karten.length}</span>
            </div>
            {karten.length === 0 ? (
              <div className="bo-mar-kanban__leer">leer</div>
            ) : (
              <ul className="flex flex-col gap-2">
                {karten.map((b) => (
                  <li key={b.name} draggable={darf} onDragStart={() => setZiehe(b)} onDragEnd={() => setZiehe(null)} className="bo-mar-social-karte" data-wartet={b.anzeigeStatus === "Wartet" ? "true" : undefined}>
                    <Bild src={b.bild} groesse={48} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/marketing/social/${encodeURIComponent(b.name)}`} className="bo-mar-link bo-mar-titel line-clamp-2 text-[14px]">{b.titel}</Link>
                      <p className="bo-mar-klein">{b.kanal} · {kurzDatum(b.datum_geplant)}</p>
                    </div>
                    {darf && (
                      <Menue label={`Verschieben ${b.titel}`} ausloeser={(p) => <Knopf {...p} size="s" variant="ghost" icon="Ellipsis" label={`Verschieben nach … ${b.titel}`} />}>
                        {SPALTEN.filter((z) => z !== b.anzeigeStatus).map((z) => {
                          const g = zielGrund(b, z, leitung);
                          return <MenuePunkt key={z} deaktiviert={!!g} grund={g || undefined} onWaehlen={() => verschiebe(b, z)}>{STATUS_TEXT.social[z]}</MenuePunkt>;
                        })}
                      </Menue>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function SocialListe({ beitraege = [], darf }) {
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [datum, setDatum] = useState(null);
  const { verzoegert } = useAktion();
  const auswahl = beitraege.filter((b) => gewaehlt.has(b.name));
  const verwerfbar = auswahl.filter((b) => ["Idee", "Entwurf"].includes(b.status));
  return (
    <>
      <div className="bo-mar-tabelle-huelle overflow-x-auto">
        <table className="bo-mar-tabelle" data-testid="social-liste">
          <thead>
            <tr>
              {darf && <th scope="col" className="w-8"><span className="sr-only">Auswahl</span></th>}
              <th scope="col">{SOCIAL.spalten.beitrag}</th>
              <th scope="col">{SOCIAL.spalten.datum}</th>
              <th scope="col">{SOCIAL.spalten.bildrechte}</th>
              <th scope="col" className="max-lg:hidden">{SOCIAL.spalten.zustaendig}</th>
              <th scope="col">{SOCIAL.spalten.status}</th>
            </tr>
          </thead>
          <tbody>
            {beitraege.map((b) => (
              <tr key={b.name} data-gewaehlt={gewaehlt.has(b.name) ? "true" : undefined}>
                {darf && <td><input type="checkbox" className="size-4 accent-current" checked={gewaehlt.has(b.name)} onChange={() => setGewaehlt((a) => { const n = new Set(a); if (n.has(b.name)) n.delete(b.name); else n.add(b.name); return n; })} aria-label={`${b.titel} auswählen`} /></td>}
                <td>
                  <div className="flex min-w-0 items-center gap-3">
                    <Bild src={b.bild} groesse={44} />
                    <div className="min-w-0">
                      <Link href={`/marketing/social/${encodeURIComponent(b.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel line-clamp-1">{b.titel}</Link>
                      <p className="bo-mar-unter">{b.kanal} · {b.format}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">{kurzDatum(b.datum_geplant)}</td>
                <td className={b.bildquelle_freigabe === "offen" ? "bo-mar-warn" : "bo-mar-ok"}>{b.bildquelle_freigabe === "offen" ? SOCIAL.bildrechteOffen : SOCIAL.bildrechteOk}</td>
                <td className="max-lg:hidden bo-mar-unter">{String(b.zustaendig || "–").split("@")[0]}</td>
                <td><Status gruppe="social" wert={b.anzeigeStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bo-mar-karten">
        {beitraege.map((b) => (
          <li key={b.name} className="bo-mar-karte-zeile">
            <Bild src={b.bild} groesse={48} />
            <div className="min-w-0 flex-1">
              <Link href={`/marketing/social/${encodeURIComponent(b.name)}`} className="bo-mar-link bo-mar-link--zeile bo-mar-titel line-clamp-1">{b.titel}</Link>
              <p className="bo-mar-klein">{b.kanal} · {kurzDatum(b.datum_geplant)}</p>
            </div>
            <Status gruppe="social" wert={b.anzeigeStatus} />
          </li>
        ))}
      </ul>
      {darf && auswahl.length > 0 && (
        <div className="bo-mar-auswahl bo-material-stark" role="toolbar" aria-label="Massenaktionen">
          <span className="bo-mar-auswahl__zahl">{auswahl.length} ausgewählt</span>
          <Knopf size="s" onClick={() => setDatum(auswahl[0].datum_geplant)}>{SOCIAL.datumSetzen}</Knopf>
          <Knopf size="s" disabled={!verwerfbar.length} grund={!verwerfbar.length ? "Nur Ideen und Entwürfe" : undefined} onClick={() => { verzoegert(() => socialWorkflowAction({ namen: verwerfbar.map((b) => b.name), aktion: "Verwerfen" }), { text: `${verwerfbar.length} verworfen` }); setGewaehlt(new Set()); }}>{SOCIAL.verwerfen}</Knopf>
        </div>
      )}
      <Dialog offen={!!datum} onSchliessen={() => setDatum(null)} titel={SOCIAL.datumSetzen} groesse="sm" fuss={<><Knopf onClick={() => setDatum(null)}>Abbrechen</Knopf><Knopf variant="primary" onClick={async () => { await verzoegert(() => socialDatumAction({ ziele: auswahl.map((b) => ({ name: b.name, datum })) }), { text: `Datum für ${auswahl.length} gesetzt` }); setDatum(null); setGewaehlt(new Set()); }}>Setzen</Knopf></>}>
        <div className="bo-mar-feld"><span>{SOCIAL.felder.datum_geplant}</span><Datumsfeld value={datum || ""} onChange={setDatum} aria-label="Datum" /></div>
      </Dialog>
    </>
  );
}
