"use client";
// Technik mobil (10-konzept-service §7, Kiosk T7): Telefon 390 px und iPad, Tab-Kapsel unten (Heute · Woche ·
// Suche · Ich), Einsatz-Karte mit genau einem Primärknopf (56 px), Abschluss in vier Schirmen, „Technik kassiert nicht“.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import KioskShell from "../Kiosk/KioskShell";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import Unterschrift from "../Eingabe/Unterschrift";
import FotoAufnahme from "../Eingabe/FotoAufnahme";
import { Haken } from "../motion";
import { Icon } from "../icons";
import { Sheet } from "../Overlay";
import { useAktion } from "./useAktion";
import { bedarfAction, einsatzAbschliessenAction, einsatzStatusAction, nichtAngetroffenAction } from "@/lib/backoffice/service/actions";
import { EINSATZ_ERGEBNISSE, EINSATZ_STATUS, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { dauerText, spanne, tagKurz } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

function EinsatzKarteKurz({ e }) {
  return (
    <Link href={`/technik/einsatz/${encodeURIComponent(e.name)}`} className="bo-svc-tk__karte" data-testid="technik-karte">
      <span className="flex items-center justify-between gap-3">
        <span className="bo-svc-tk__zeit">{spanne(e.zeit_von, e.zeit_bis) || "ganztägig"}</span>
        <StatusBadge wert={e.status} text={EINSATZ_STATUS[e.status]?.text} ton={EINSATZ_STATUS[e.status]?.ton} groesse="m" />
      </span>
      <span className="mt-2 block text-[17px] font-semibold">{e.kunde_name || e.titel}</span>
      <span className="block text-[15px] text-bo-text-soft">{[e.art, e.ort].filter(Boolean).join(" · ")}</span>
      {e.status === "Geplant" && !e.bestaetigt_kunde_am && <span className="bo-svc-einsatz__kennz mt-2">{T.technik.unbestaetigt}</span>}
      {e.mitzubringen && (
        <span className="mt-2 block text-[14px]">
          {T.technik.mitnehmen}: {e.mitzubringen}
        </span>
      )}
    </Link>
  );
}

/** Start „Heute/Woche/Suche/Ich“. */
export function TechnikStart({ heute, woche, benutzer, geraet, alle, heuteIso }) {
  const [tab, setTab] = useState("heute");
  const [q, setQ] = useState("");
  const treffer = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s.length < 2 ? [] : woche.filter((e) => `${e.kunde_name} ${e.titel} ${e.servicefall} ${e.name} ${e.ort}`.toLowerCase().includes(s));
  }, [q, woche]);
  const tage = useMemo(() => {
    const g = new Map();
    for (const e of woche) (g.get(e.datum) || g.set(e.datum, []).get(e.datum)).push(e);
    return [...g.entries()].sort();
  }, [woche]);
  return (
    <KioskShell titel={T.technik.titel} geraet={geraet} benutzer={benutzer} kontext={tagKurz(heuteIso)} idleMs={60 * 60_000} hilfe={[{ taste: "F5", text: "Aktualisieren" }]}>
      <div className="mx-auto w-full max-w-[720px] px-4 pt-4">
        {alle && <p className="mb-3 rounded-bo-zeile bg-bo-fill px-4 py-3 text-[14px] text-bo-text-soft">Keine eigenen Einsätze – Ansicht aller Techniker (Service).</p>}
        <div className="bo-svc-tk" role="tabpanel" aria-label={T.technik.tabs[tab]}>
          {tab === "heute" && (heute.length ? heute.map((e) => <EinsatzKarteKurz key={e.name} e={e} />) : <p className="bo-svc-tk__karte text-[16px] text-bo-text-soft">{T.technik.heuteLeer}</p>)}
          {tab === "woche" &&
            (tage.length ? (
              tage.map(([d, l]) => (
                <section key={d} className="grid gap-2">
                  <h2 className="px-1 pt-2 text-[15px] font-semibold">{tagKurz(d)}</h2>
                  {l.map((e) => (
                    <EinsatzKarteKurz key={e.name} e={e} />
                  ))}
                </section>
              ))
            ) : (
              <p className="bo-svc-tk__karte text-[16px] text-bo-text-soft">{T.technik.wocheLeer}</p>
            ))}
          {tab === "suche" && (
            <>
              <label className="bo-suche h-14 w-full">
                <Icon name="Search" className="size-5" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.technik.suche} aria-label={T.technik.suche} className="text-[16px]" />
              </label>
              {treffer.map((e) => (
                <EinsatzKarteKurz key={e.name} e={e} />
              ))}
              {q.trim().length >= 2 && !treffer.length && <p className="px-1 text-[15px] text-bo-text-soft">{T.technik.sucheLeer(q)}</p>}
            </>
          )}
          {tab === "ich" && (
            <div className="bo-svc-tk__karte grid gap-4">
              <p className="text-[17px] font-semibold">{benutzer?.name}</p>
              <p className="text-[15px] text-bo-text-soft">{T.technik.erstbesuch}</p>
              <p className="text-[15px]">{T.technik.kassiertNicht}</p>
              <Knopf size="kiosk" variant="secondary" href="/wechsel" icon="UserCog">
                {T.technik.ich.bediener}
              </Knopf>
            </div>
          )}
        </div>
      </div>
      <nav className="bo-svc-tk__tabs" role="tablist" aria-label="Technik">
        {Object.entries(T.technik.tabs).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="bo-svc-tk__tab" onClick={() => setTab(k)}>
            <Icon name={{ heute: "Calendar", woche: "CalendarDays", suche: "Search", ich: "User" }[k]} className="size-5" />
            {t}
          </button>
        ))}
      </nav>
    </KioskShell>
  );
}

/** Einsatz-Karte mit Primärknopf und Abschluss-Assistent. */
export function TechnikEinsatz({ einsatz: e, fall, code, teile, benutzer, geraet }) {
  const router = useRouter();
  const { ausfuehren, laeuft } = useAktion();
  const [abschluss, setAbschluss] = useState(false);
  const [nicht, setNicht] = useState(false);
  const [bedarf, setBedarf] = useState(false);
  const [hinweis, setHinweis] = useState("");
  const [bedarfText, setBedarfText] = useState("");
  const adresse = [e.strasse, [e.plz, e.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const primaer =
    ["Geplant", "Bestaetigt"].includes(e.status) ? { m: "unterwegs", t: T.technik.unterwegs, ok: T.technik.gemeldet.unterwegs } : e.status === "Unterwegs" ? { m: "starten", t: T.technik.starten, ok: T.technik.gemeldet.starten } : e.status === "In Arbeit" ? { m: "abschliessen", t: T.technik.abschliessen } : null;
  return (
    <KioskShell titel={T.technik.titel} geraet={geraet} benutzer={benutzer} kontext={e.name} zurueckHref="/technik" idleMs={e.status === "In Arbeit" ? 0 : 60 * 60_000}>
      <div className="mx-auto grid w-full max-w-[720px] gap-3 px-4 pb-6 pt-4">
        <section className="bo-svc-tk__karte">
          <span className="flex items-center justify-between gap-3">
            <span className="bo-svc-tk__zeit">{spanne(e.zeit_von, e.zeit_bis)}</span>
            <StatusBadge wert={e.status} text={EINSATZ_STATUS[e.status]?.text} ton={EINSATZ_STATUS[e.status]?.ton} groesse="m" />
          </span>
          <h1 className="mt-2 text-[22px] font-semibold leading-7">{e.kunde_name || e.titel}</h1>
          <p className="text-[15px] text-bo-text-soft">
            {e.art} · {tagKurz(e.datum)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Knopf size="kiosk" variant="secondary" icon="MapPin" href={`https://maps.google.com/?q=${encodeURIComponent(adresse)}`} target="_blank" rel="noopener noreferrer">
              {T.technik.route}
            </Knopf>
            <Knopf size="kiosk" variant="secondary" icon="Phone" href={fall?.kunde_telefon ? `tel:${String(fall.kunde_telefon).replace(/\s/g, "")}` : undefined} disabled={!fall?.kunde_telefon}>
              {T.technik.anrufen}
            </Knopf>
          </div>
          <p className="mt-3 text-[15px]">{adresse}</p>
        </section>
        {fall && (
          <section className="bo-svc-tk__karte grid gap-2">
            <p className="text-[13px] font-medium text-bo-text-soft">Fall {fall.name} · {fall.art}</p>
            <p className="text-[16px] font-semibold">{fall.fehlercode ? `${fall.fehlercode} ${fall.fehlercode_bezeichnung}` : fall.produkt_name}</p>
            <p className="text-[15px]">{String(fall.beschreibung || "").replace(/<[^>]+>/g, "")}</p>
            {code?.pruefhinweis && (
              <p className="bo-svc-karte text-[15px]">
                <b className="block text-[13px] font-medium text-bo-text-soft">{T.melden.pruefhinweis}</b>
                {code.pruefhinweis}
              </p>
            )}
          </section>
        )}
        {(e.mitzubringen || e.hinweis_intern) && (
          <section className="bo-svc-tk__karte grid gap-2 text-[15px]">
            {e.mitzubringen && (
              <p>
                <b className="block text-[13px] font-medium text-bo-text-soft">{T.technik.mitnehmen}</b>
                {e.mitzubringen}
              </p>
            )}
            {e.hinweis_intern && <p>{e.hinweis_intern}</p>}
          </section>
        )}
        {["Unterwegs", "In Arbeit"].includes(e.status) && (
          <section className="bo-svc-tk__karte">
            <FotoAufnahme label={T.technik.fotoVorher} ziel={{ doctype: "PH Serviceeinsatz", name: e.name }} warteschlange max={6} />
          </section>
        )}
        <section className="bo-svc-tk__karte grid gap-2 text-[15px]">
          <p>{T.technik.kassiertNicht}</p>
          <Knopf size="l" variant="ghost" icon="MessageSquare" onClick={() => setBedarf(true)}>
            {T.technik.bedarf}
          </Knopf>
        </section>
        {e.status === "Erledigt" && <p className="bo-svc-tk__karte text-[16px]">{T.technik.erledigt(String(e.abfahrt || "").slice(11, 16))}</p>}
        <div className="bo-svc-tk__primaer grid gap-3">
          {["Unterwegs", "In Arbeit"].includes(e.status) && (
            <Knopf size="l" variant="ghost" onClick={() => setNicht(true)}>
              {T.technik.nichtAngetroffen}
            </Knopf>
          )}
          {primaer && (
            <Knopf
              size="kiosk"
              variant="primary"
              laedt={laeuft}
              className="w-full"
              data-testid="technik-primaer"
              onClick={() => (primaer.m === "abschliessen" ? setAbschluss(true) : ausfuehren(einsatzStatusAction, { name: e.name, methode: primaer.m, verzoegert: true }, { ok: primaer.ok }))}
            >
              {primaer.t}
            </Knopf>
          )}
        </div>
      </div>
      {nicht && (
        <Sheet offen onSchliessen={() => setNicht(false)} titel={T.technik.nichtAngetroffen} groesse="sm" fuss={<Knopf size="kiosk" variant="primary" laedt={laeuft} disabled={!hinweis.trim()} onClick={() => ausfuehren(nichtAngetroffenAction, { name: e.name, hinweis }, { ok: "Gemeldet", onOk: () => setNicht(false) })}>{T.aktionen.senden}</Knopf>}>
          <div className="grid gap-3">
            <div className="bo-svc-chips">
              {T.technik.nichtAngetroffenChips.map((c) => (
                <button key={c} type="button" className="bo-svc-wahl bo-svc-wahl--gross" aria-pressed={hinweis === c} onClick={() => setHinweis(c)}>
                  {c}
                </button>
              ))}
            </div>
            <label className="bo-svc-feld">
              <span>Hinweis</span>
              <input value={hinweis} onChange={(x) => setHinweis(x.target.value)} />
            </label>
          </div>
        </Sheet>
      )}
      {bedarf && (
        <Sheet offen onSchliessen={() => setBedarf(false)} titel={T.technik.bedarf} groesse="sm" fuss={<Knopf size="kiosk" variant="primary" laedt={laeuft} disabled={!bedarfText.trim()} onClick={() => ausfuehren(bedarfAction, { name: e.name, text: bedarfText }, { ok: "Ans Büro gemeldet", onOk: () => setBedarf(false) })}>{T.aktionen.senden}</Knopf>}>
          <label className="bo-svc-feld">
            <span>Was braucht die Kundin bzw. der Kunde?</span>
            <textarea rows={3} value={bedarfText} onChange={(x) => setBedarfText(x.target.value)} />
          </label>
        </Sheet>
      )}
      {abschluss && <Abschluss einsatz={e} fall={fall} code={code} teile={teile} onSchliessen={() => setAbschluss(false)} onFertig={() => router.push("/technik")} />}
    </KioskShell>
  );
}

const PAUSEN = [0, 15, 30, 45, 60];

function Abschluss({ einsatz: e, fall, code, teile, onSchliessen, onFertig }) {
  const { ausfuehren, laeuft } = useAktion();
  const [s, setS] = useState(0);
  const [ergebnis, setErgebnis] = useState("");
  const [pause, setPause] = useState(0);
  const [verbraucht, setVerbraucht] = useState(() => teile.map((t) => ({ ...t, menge: t.status === "Aus Bestand" || t.status === "Eingetroffen" ? t.menge : 0 })));
  const [bericht, setBericht] = useState("");
  const [art, setArt] = useState("Unterschrift");
  const [png, setPng] = useState(null);
  const [name, setName] = useState(fall?.kunde_name || e.kunde_name || "");
  const [senden, setSenden] = useState(false);
  const [fertig, setFertig] = useState(false);
  const [jetzt] = useState(() => Date.now());
  const ankunft = e.ankunft ? new Date(String(e.ankunft).replace(" ", "T")) : null;
  const minuten = ankunft ? Math.max(0, Math.round((jetzt - ankunft.getTime()) / 60000) - pause) : null;
  const kannWeiter = s === 0 ? !!ergebnis : s === 3 ? (art === "Unterschrift" ? !!png : art === "Verweigert" ? !!bericht.trim() : true) : true;
  const abschliessen = () =>
    ausfuehren(einsatzAbschliessenAction, { name: e.name, ergebnis, bericht, unterschrift: png, unterschrift_name: name, pause_min: pause, unterschrift_art: art, bericht_senden: senden, verbraucht: verbraucht.filter((v) => v.menge > 0).map((v) => ({ ersatzteil: v.ersatzteil, bezeichnung: v.bezeichnung, menge: v.menge, aus_bestand: v.status === "Aus Bestand" })) }, { ok: T.technik.abschluss.erfolg, onOk: () => setFertig(true), ohneRefresh: true });
  return (
    <Sheet offen onSchliessen={onSchliessen} titel={T.technik.abschluss.schritt(s + 1)} groesse="lg" vollseite testid="technik-abschluss"
      fuss={
        fertig ? (
          <Knopf size="kiosk" variant="primary" className="w-full" onClick={onFertig}>
            {T.technik.abschluss.naechster}
          </Knopf>
        ) : (
          <div className="flex w-full gap-2">
            {s > 0 && (
              <Knopf size="kiosk" variant="secondary" onClick={() => setS(s - 1)}>
                {T.aktionen.zurueck}
              </Knopf>
            )}
            <Knopf size="kiosk" variant="primary" className="flex-1" disabled={!kannWeiter} laedt={laeuft} onClick={() => (s < 3 ? setS(s + 1) : abschliessen())} data-testid="abschluss-weiter">
              {s < 3 ? T.aktionen.weiter : T.technik.abschluss.fertig}
            </Knopf>
          </div>
        )
      }
    >
      {fertig ? (
        <div className="bo-erfolg grid justify-items-center gap-3 py-8 text-center" role="status">
          <Haken groesse={64} />
          <p className="text-[22px] font-semibold">{T.technik.abschluss.erfolg}</p>
          {(ergebnis === "Weiterer Einsatz noetig" || ergebnis === "Ersatzteil noetig") && <p className="text-[15px] text-bo-text-soft">{T.technik.abschluss.folge}: das Büro plant den Folgeeinsatz.</p>}
        </div>
      ) : s === 0 ? (
        <div className="grid gap-2" role="radiogroup" aria-label={T.technik.abschluss.ergebnis}>
          {EINSATZ_ERGEBNISSE.map((x) => (
            <button key={x} type="button" role="radio" aria-checked={ergebnis === x} className="bo-svc-wahl bo-svc-wahl--gross" onClick={() => setErgebnis(x)}>
              {ergebnis === x && <Icon name="Check" className="size-5" />}
              {anzeigeText(x)}
            </button>
          ))}
        </div>
      ) : s === 1 ? (
        <div className="grid gap-4">
          {verbraucht.length ? (
            verbraucht.map((v, i) => (
              <div key={i} className="bo-svc-karte flex items-center justify-between gap-3">
                <span className="min-w-0 text-[15px]">
                  {v.bezeichnung}
                  <span className="block text-[13px] text-bo-text-soft">{anzeigeText(v.status)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Knopf size="l" variant="secondary" icon="Minus" label="Weniger" onClick={() => setVerbraucht((l) => l.map((x, j) => (j === i ? { ...x, menge: Math.max(0, x.menge - 1) } : x)))} />
                  <span className="w-8 text-center text-[18px] tabular-nums">{v.menge}</span>
                  <Knopf size="l" variant="secondary" icon="Plus" label="Mehr" onClick={() => setVerbraucht((l) => l.map((x, j) => (j === i ? { ...x, menge: x.menge + 1 } : x)))} />
                </span>
              </div>
            ))
          ) : (
            <p className="text-[15px] text-bo-text-soft">Keine Ersatzteile am Fall.</p>
          )}
          <div className="grid gap-2">
            <span className="bo-svc-label">{T.technik.abschluss.pause}</span>
            <div className="bo-svc-chips" role="radiogroup" aria-label={T.technik.abschluss.pause}>
              {PAUSEN.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={pause === p} className="bo-svc-wahl" style={{ minHeight: 48 }} onClick={() => setPause(p)}>
                  {p} min
                </button>
              ))}
            </div>
            {minuten !== null && <p className="text-[15px]">{T.technik.abschluss.arbeitszeit(dauerText(minuten))}</p>}
          </div>
        </div>
      ) : s === 2 ? (
        <div className="grid gap-3">
          <label className="bo-svc-feld">
            <span>{T.technik.abschluss.bericht}</span>
            <textarea rows={6} value={bericht} onChange={(x) => setBericht(x.target.value)} />
            <span className="bo-svc-hinweis">{T.technik.abschluss.berichtHinweis}</span>
          </label>
          {(code?.standardloesung || fall?.standardloesung) && (
            <Knopf size="l" variant="secondary" onClick={() => setBericht((b) => `${b ? `${b}\n` : ""}${code?.standardloesung || fall.standardloesung}`)}>
              {T.technik.abschluss.standard}
            </Knopf>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={T.technik.abschluss.bestaetigung}>
            {["Unterschrift", "Name bestätigt", "Kunde abwesend", "Verweigert"].map((a) => (
              <button key={a} type="button" role="radio" aria-checked={art === a} className="bo-svc-wahl" style={{ minHeight: 48 }} onClick={() => setArt(a)}>
                {a}
              </button>
            ))}
          </div>
          {art === "Unterschrift" && <Unterschrift erklaerung="Arbeiten wie beschrieben ausgeführt." name={name} onUebernommen={(r) => setPng(r?.png || r?.dataUrl || "unterschrieben")} />}
          {art === "Verweigert" && <p className="bo-svc-hinweis" data-ton="warn">Bitte im Bericht festhalten, warum.</p>}
          <label className="bo-svc-feld">
            <span>{T.technik.abschluss.name}</span>
            <input value={name} onChange={(x) => setName(x.target.value)} />
          </label>
          {fall?.kunde_email && (
            <label className="flex items-center gap-3 text-[15px]">
              <input type="checkbox" className="size-6 accent-(--color-bo-action)" checked={senden} onChange={(x) => setSenden(x.target.checked)} />
              {T.technik.abschluss.berichtSenden}
            </label>
          )}
        </div>
      )}
    </Sheet>
  );
}
