import Image from "next/image";
import Link from "next/link";
import Kachel, { Akzentkachel } from "../Kachel";
import Knopf, { PfeilKnopf, RundKnopf } from "../Knopf";
import Avatar, { AvatarReihe } from "../Avatar";
import { Pille } from "../StatusBadge";
import Leer from "../Leer";
import Zahl from "../Charts/Zahl";
import { Icon } from "../icons";
import FreigabeEintrag from "../Shell/FreigabeEintrag";
import { cent, datum, relativ } from "@/lib/backoffice/format";
import { anzeige, doctypeLabel } from "@/lib/backoffice/labels";
import { ZENTRALE } from "@/lib/backoffice/zentrale/texte";

// Kacheln der Zentrale im Lounge-Stil (lounge.md § 7.1, Entwurf components/Entwurf/Lounge/Zentrale.jsx).
// Server Components; Daten kommen fertig aus lib/backoffice/zentrale/daten.js ({ status, … }).
// Jede Kachel zeichnet ihre Zustände selbst: ok · leer (ruhiger Satz) · fehler („Nicht geladen“) · recht (nichts).

function NichtGeladen({ titel }) {
  return (
    <Kachel titel={titel}>
      <p className="zb-leise" role="status">
        {ZENTRALE.nichtGeladen} · <Link href="/" className="underline underline-offset-2">{ZENTRALE.erneut}</Link>
      </p>
    </Kachel>
  );
}

// ------------------------------------------------------------------------------------------------ Heute

export function HeuteSpalte({ daten }) {
  const d = daten || {};
  const titel = d.art === "montagen" ? ZENTRALE.montagenHeute(d.anzahl || 0) : ZENTRALE.termine(d.anzahl || 0);
  if (d.status === "fehler") return <NichtGeladen titel={ZENTRALE.heute} />;
  const a = d.aktiv;
  return (
    <section className="bo-kachel zb-heute" aria-labelledby="zb-heute-t" data-testid="zentrale-heute">
      <div className="bo-kachel__kopf">
        <div className="min-w-0">
          <p className="zb-cap">{ZENTRALE.heute}</p>
          <h2 id="zb-heute-t" className="zb-h3">
            {d.status === "leer" ? ZENTRALE.keineTermine : titel}
          </h2>
        </div>
        {d.alleHref && <RundKnopf icon="CalendarDays" label={ZENTRALE.terminOeffnen} href={d.alleHref} groesse="s" />}
      </div>
      {d.status === "leer" || !a ? (
        <div className="zb-now">
          <p className="zb-leise">{d.vorbei ? ZENTRALE.termineVorbei : ZENTRALE.keineTermineText}</p>
        </div>
      ) : (
        <article className="zb-now" aria-label={ZENTRALE.aktiverTermin} data-testid="zentrale-heute-aktiv">
          <div className="zb-now__wer">
            <Avatar name={a.kunde} groesse={48} dekorativ />
            <div className="min-w-0">
              <h3 className="zb-now__name line-clamp-2">{a.kunde}</h3>
              <p className="zb-now__art">{a.art}</p>
            </div>
          </div>
          <dl className="zb-now__fakten">
            <div>
              <dt>{ZENTRALE.zeit}</dt>
              <dd>{a.bis ? `${a.von} – ${a.bis}` : a.von || "–"}</dd>
            </div>
            <div className="min-w-0">
              <dt>{ZENTRALE.ort}</dt>
              <dd className="truncate">{a.ort || "–"}</dd>
            </div>
          </dl>
          {a.laeuft && <p className="zb-laeuft">{ZENTRALE.laeuftJetzt}</p>}
          {a.notiz && (
            <p className="zb-now__notiz">
              <Icon name="MapPin" className="mt-px size-4 shrink-0" />
              <span className="line-clamp-2">{a.notiz}</span>
            </p>
          )}
          <div className="zb-now__akt">
            <Knopf variant="primary" icon="Play" href={a.href} className="flex-1">
              {d.art === "montagen" ? ZENTRALE.terminOeffnen : ZENTRALE.beratungStarten}
            </Knopf>
            <RundKnopf icon="Clock" label={ZENTRALE.terminOeffnen} href={a.href} groesse="s" />
          </div>
        </article>
      )}
      {d.folgend?.length > 0 && (
        <ul className="zb-next" aria-label={ZENTRALE.folgetermine}>
          {d.folgend.map((f) => (
            <li key={f.name}>
              <Link href={f.href} className="zb-next__i">
                <span className="min-w-0">
                  <span className="zb-next__name block truncate">{f.kunde}</span>
                  <span className="zb-next__art block truncate" data-ton={f.modus === "Showroom" ? "cognac" : f.modus === "Video" ? "see" : undefined}>
                    {[f.art, f.modus].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="zb-next__zeit">{f.von}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Braucht deine Antwort

export function WartetKachel({ daten }) {
  const d = daten || {};
  if (d.status === "fehler") return <NichtGeladen titel={ZENTRALE.wartet} />;
  if (d.status !== "ok") {
    return (
      <section className="bo-kachel" aria-labelledby="zb-wartet-t" data-testid="zentrale-wartet">
        <p className="zb-cap" id="zb-wartet-t">{ZENTRALE.wartet}</p>
        <div className="mt-4 flex items-start gap-3">
          <span className="inline-grid size-10 shrink-0 place-items-center rounded-full bg-bo-salbei-soft text-bo-salbei-text">
            <Icon name="Check" className="size-5" />
          </span>
          <div>
            <p className="text-[17px] leading-6 font-semibold">{ZENTRALE.wartetLeer}</p>
            <p className="zb-leise mt-1 max-w-[46ch]">{ZENTRALE.wartetLeerText}</p>
          </div>
        </div>
      </section>
    );
  }
  if (d.art === "freigabe" && d.freigabe) {
    return (
      <section className="bo-kachel" aria-labelledby="zb-wartet-t" data-testid="zentrale-wartet">
        <p className="zb-cap" id="zb-wartet-t">{ZENTRALE.wartet}</p>
        <div className="mt-3 min-w-0">
          <FreigabeEintrag eintrag={d.freigabe} />
        </div>
        {d.mehr > 0 && (
          <div className="bo-kachel__fuss">
            <p className="zb-leise">+{d.mehr}</p>
            <PfeilKnopf href="/benachrichtigungen" label="Alle Freigaben" />
          </div>
        )}
      </section>
    );
  }
  return (
    <article className="bo-kachel bo-kachel--lift" aria-labelledby="zb-wartet-t" data-testid="zentrale-wartet">
      <p className="zb-cap" id="zb-wartet-t">{ZENTRALE.wartet}</p>
      <blockquote className="zb-wartet__q">{d.text}</blockquote>
      {(d.von || d.bezug) && (
        <p className="zb-wartet__von">
          {d.von}
          {d.von && d.bezug ? <span aria-hidden="true"> · </span> : null}
          {d.bezug && <b>{d.bezug}</b>}
        </p>
      )}
      <div className="bo-kachel__fuss">
        <AvatarReihe personen={d.personen || []} max={3} groesse={32} />
        <PfeilKnopf href={d.href} label={ZENTRALE.wartet} />
      </div>
    </article>
  );
}

// ------------------------------------------------------------------------------------------------ Akzente

export function AkzentKachel({ daten }) {
  if (!daten) return null;
  return <Akzentkachel ton={daten.ton} titel={daten.titel} text={daten.text} zahl={daten.zahl} href={daten.href} oeffnenLabel={`${daten.titel}: ${daten.text}`} testid={`zentrale-akzent-${daten.ton}`} />;
}

// ------------------------------------------------------------------------------------------------ Pipeline

function tausender(c) {
  if (!Number.isFinite(c)) return "–";
  const t = c / 100_000;
  if (t >= 1000) return `${(t / 1000).toLocaleString("de-AT", { maximumFractionDigits: 2 })} Mio €`;
  return `${Math.round(t).toLocaleString("de-AT")} T€`;
}

export function PipelineKachel({ daten }) {
  const d = daten || {};
  if (d.status === "recht") return null;
  if (d.status === "fehler") return <NichtGeladen titel={ZENTRALE.pipeline} />;
  const max = Math.max(1, ...(d.stufen || []).map((s) => s.n));
  // Hervorhebung wie im Entwurf: die Stufe „Angebot“ (dort entscheidet sich der Abschluss), Rest 16 % Tinte.
  const hi = (d.stufen || []).findIndex((s) => s.status === "Angebot");
  return (
    <section className="bo-kachel" aria-labelledby="zb-pipe-t" data-testid="zentrale-pipeline">
      <div className="bo-kachel__kopf">
        <div className="min-w-0">
          <h2 id="zb-pipe-t" className="bo-kachel__titel">{ZENTRALE.pipeline}</h2>
          <p className="bo-kachel__unter">{d.offenWertCent ? ZENTRALE.pipelineUnter(tausender(d.offenWertCent)) : ZENTRALE.pipelineOhneWert}</p>
        </div>
        <RundKnopf icon="ArrowUpRight" label={ZENTRALE.pipelineOeffnen} href="/d/ph-anfrage" groesse="s" />
      </div>
      {d.status === "leer" ? (
        <p className="zb-leise">{ZENTRALE.noch}</p>
      ) : (
        <>
          <div className="zb-pipe__sum">
            <div>
              <span className="zb-gross"><Zahl wert={d.offen} /></span>
              <span className="zb-leise">{ZENTRALE.vorgaenge}</span>
            </div>
            <div title={ZENTRALE.abschlussquoteHilfe}>
              <span className="zb-gross">{d.quote === null ? "–" : <><Zahl wert={d.quote} /><small> %</small></>}</span>
              <span className="zb-leise">{d.quote === null ? ZENTRALE.noch : ZENTRALE.abschlussquote}</span>
            </div>
            <div>
              <span className="zb-gross">{d.dauer === null ? "–" : <><Zahl wert={d.dauer} /><small> {ZENTRALE.tage}</small></>}</span>
              <span className="zb-leise">{ZENTRALE.bisAuftrag}</span>
            </div>
          </div>
          <ol className="zb-pipe__reihen">
            {(d.stufen || []).map((s, i) => (
              <li key={s.status} className="zb-pipe__reihe" style={{ "--i": i }}>
                <span className="zb-pipe__label">{s.titel}</span>
                <span className="zb-pipe__spur" role="img" aria-label={`${s.titel}: ${s.n} ${ZENTRALE.vorgaenge}${s.wertCent ? `, ${cent(s.wertCent)}` : ""}`}>
                  <span className="zb-pipe__balken" style={{ "--w": `${(s.n / max) * 100}%` }} data-hi={i === hi || undefined} />
                </span>
                <span className="zb-pipe__n">{s.n}</span>
                <span className="zb-pipe__wert">{s.wertCent ? tausender(s.wertCent) : "–"}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Umsatz

export function UmsatzKachel({ daten }) {
  const d = daten || {};
  if (d.status === "recht") return null;
  if (d.status === "fehler") return <NichtGeladen titel={ZENTRALE.umsatz} />;
  const max = Math.max(1, ...(d.punkte || []).map((p) => Math.abs(p.cent)));
  return (
    <section className="bo-kachel" aria-labelledby="zb-ums-t" data-testid="zentrale-umsatz">
      <div className="bo-kachel__kopf">
        <div className="min-w-0">
          <h2 id="zb-ums-t" className="bo-kachel__titel">{ZENTRALE.umsatz}</h2>
          <p className="bo-kachel__unter">{ZENTRALE.umsatzUnter}</p>
        </div>
        {d.trend !== null && d.trend !== undefined && <span className="zb-trend" data-ton={d.trend < 0 ? "ab" : "auf"}>{ZENTRALE.umsatzTrend(d.trend)}</span>}
      </div>
      {d.status === "leer" ? (
        <div className="flex min-h-40 flex-1 items-center justify-center rounded-[20px] bg-bo-surface-2 p-6 text-center">
          <p className="zb-leise">{ZENTRALE.noch}</p>
        </div>
      ) : (
        <>
          <p className="zb-gross">
            {Math.round(d.summeCent / 100_000).toLocaleString("de-AT")}
            <small> T€ {ZENTRALE.umsatzSeit(d.seit)}</small>
          </p>
          <div className="zb-balken" style={{ "--n": d.punkte.length }} role="group" aria-label={`${ZENTRALE.umsatz}: ${d.punkte.map((p) => `${p.label} ${cent(p.cent)}`).join(", ")}`}>
            {d.punkte.map((p, i) => {
              const h = `${Math.max(0, (p.cent / max) * 100)}%`;
              return (
                <div key={p.monat} className="zb-balken__spalte" tabIndex={0} aria-label={`${p.label}: ${cent(p.cent)}${p.laufend ? ` (${ZENTRALE.laufend})` : ""}`} style={{ "--h": h, "--i": i }}>
                  <span className="zb-balken__tip">{cent(p.cent).replace(/,\d\d\s€$/, " €")}</span>
                  <span className="zb-balken__bar" data-hi={p.bezug || undefined} data-lauf={p.laufend || undefined} />
                  <span className="zb-balken__m" data-hi={p.bezug || undefined}>{p.label}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Projekte

export function ProjekteKachel({ daten, sucheHref = "/d/ph-projekt" }) {
  const d = daten || {};
  if (d.status === "recht") return null;
  if (d.status === "fehler") return <NichtGeladen titel={ZENTRALE.projekte} />;
  return (
    <section className="bo-kachel zb-proj" aria-labelledby="zb-proj-t" data-testid="zentrale-projekte">
      <div className="bo-kachel__kopf flex-wrap">
        <div className="min-w-0">
          <h2 id="zb-proj-t" className="bo-kachel__titel">{ZENTRALE.projekte}</h2>
          <p className="bo-kachel__unter">{d.status === "ok" ? ZENTRALE.projekteUnter(d.gesamt, d.mitTermin) : ZENTRALE.keineProjekte}</p>
        </div>
        <div className="bo-kachel__werkzeuge">
          <form action={sucheHref} method="get" role="search" className="hidden sm:block">
            <label className="bo-suche w-56">
              <Icon name="Search" className="size-4 shrink-0" />
              <input type="search" name="q" placeholder={ZENTRALE.projektSuche} aria-label={ZENTRALE.projekteDurchsuchen} />
            </label>
          </form>
          <PfeilKnopf href={sucheHref} label={ZENTRALE.alleProjekte} />
        </div>
      </div>
      {d.status !== "ok" ? (
        <div className="px-1 pb-3">
          <Leer groesse="karte" titel={ZENTRALE.keineProjekte} text={ZENTRALE.keineProjekteText} icon="FolderKanban" />
        </div>
      ) : (
        <>
          <div className="zb-proj__tabelle zb-scroll">
            <table className="zb-tabelle">
              <thead>
                <tr>
                  <th scope="col">{ZENTRALE.spalteProjekt}</th>
                  <th scope="col">{ZENTRALE.spalteStufe}</th>
                  <th scope="col">{ZENTRALE.spalteTeam}</th>
                  <th scope="col">{ZENTRALE.spalteNaechster}</th>
                  <th scope="col" className="r">{ZENTRALE.spalteWert}</th>
                </tr>
              </thead>
              <tbody>
                {d.zeilen.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <Link href={p.href} className="zb-zelle-proj">
                        <span className="zb-thumb">
                          <Image src={p.bild.src} alt={p.bild.symbol ? "" : p.bild.alt} fill sizes="56px" title={p.bild.symbol ? ZENTRALE.symbolbild(p.bild.art) : undefined} />
                        </span>
                        <span className="min-w-0">
                          <span className="zb-stark block truncate text-[15px]">{p.titel}</span>
                          <span className="zb-leise block truncate">{p.kunde}</span>
                        </span>
                      </Link>
                    </td>
                    <td><Pille material={p.material}>{p.stufe}</Pille></td>
                    <td><AvatarReihe personen={p.team} max={3} groesse={28} /></td>
                    <td>
                      <p className="zb-zelle-next">{p.naechster || "–"}</p>
                      <span className="zb-fortschritt" role="img" aria-label={ZENTRALE.fortschritt(p.fortschritt)}>
                        <span style={{ "--w": `${p.fortschritt}%` }} />
                      </span>
                    </td>
                    <td className="r zb-stark">{p.wertCent ? cent(p.wertCent).replace(/,00\s€$/, " €") : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="zb-proj__karten px-1 pb-3">
            {d.zeilen.map((p) => (
              <li key={p.name}>
                <Link href={p.href} className="zb-proj__karte">
                  <span className="zb-thumb">
                    <Image src={p.bild.src} alt="" fill sizes="56px" />
                  </span>
                  <span className="min-w-0">
                    <span className="zb-stark block truncate">{p.titel}</span>
                    <span className="zb-leise block truncate">{[p.stufe, p.naechster].filter(Boolean).join(" · ")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Aktivität

export function AktivitaetKachel({ daten, titel = ZENTRALE.aktivitaet, alleHref = "/protokoll" }) {
  const d = daten || {};
  if (d.status === "recht") return null;
  if (d.status === "fehler") return <NichtGeladen titel={titel} />;
  return (
    <section className="bo-kachel" aria-labelledby="zb-akt-t" data-testid="zentrale-aktivitaet">
      <div className="bo-kachel__kopf">
        <h2 id="zb-akt-t" className="bo-kachel__titel">{titel}</h2>
        {alleHref && (
          <Link href={alleHref} className="rounded-sm text-[13px] font-medium text-bo-text-soft hover:text-bo-text">
            {ZENTRALE.alle}
          </Link>
        )}
      </div>
      {d.status !== "ok" ? (
        <p className="zb-leise">{ZENTRALE.keineAktivitaet}</p>
      ) : (
        <ol className="zb-akt">
          {d.zeilen.map((e) => (
            <li key={`${e.doctype}-${e.name}`} className="zb-akt__i">
              <Avatar name={e.vonName || e.von} groesse={36} />
              <div className="min-w-0">
                <p className="zb-akt__txt">
                  <b>{e.vorname}</b> · {anzeige(e.zusammenfassung || "Geändert")} ·{" "}
                  <Link href={e.href}>{e.titel}</Link>
                </p>
                <p className="zb-leise truncate">
                  {doctypeLabel(e.doctype)} · <time dateTime={String(e.modified || "")} suppressHydrationWarning>{relativ(e.modified)}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Kennzahlen (2×2 bzw. Streifen)

export function KennzahlenKachel({ daten = [], titel = "Kennzahlen" }) {
  if (!daten.length) return null;
  return (
    <section className="bo-kachel" aria-labelledby="zb-kz-t" data-testid="zentrale-kennzahlen">
      <div className="bo-kachel__kopf">
        <h2 id="zb-kz-t" className="bo-kachel__titel">{titel}</h2>
      </div>
      <ul className="zb-kz">
        {daten.map((k) => (
          <li key={k.id} className="min-w-0">
            <Link href={k.href} className="zb-kz__i h-full">
              <span className="zb-kz__t">{k.titel}</span>
              <span className="zb-kz__w">{k.wert === null || k.wert === undefined ? "–" : k.format === "cent" ? cent(k.wert).replace(/,\d\d\s€$/, " €") : <Zahl wert={k.wert} />}</span>
              {(k.wert === null || k.wert === undefined) && <span className="zb-leise">{ZENTRALE.noch}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ Admin

export function BetriebKachel({ daten }) {
  const d = daten || {};
  if (d.status !== "ok") return <NichtGeladen titel={ZENTRALE.betrieb} />;
  return (
    <section className="bo-kachel" aria-labelledby="zb-betrieb-t" data-testid="zentrale-betrieb">
      <div className="bo-kachel__kopf">
        <div>
          <h2 id="zb-betrieb-t" className="bo-kachel__titel">{ZENTRALE.betrieb}</h2>
          <p className="bo-kachel__unter">{ZENTRALE.betriebUnter}</p>
        </div>
      </div>
      <ul className="zb-pruef">
        {d.punkte.map((p) => (
          <li key={p.id}>
            <Link href={p.href} className="zb-pruef__i">
              <span className="zb-pruef__sym" data-ok={p.ok === true ? "ja" : p.ok === false ? "nein" : "offen"}>
                <Icon name={p.ok === true ? "Check" : p.ok === false ? "TriangleAlert" : "CircleDashed"} className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="zb-pruef__titel block">{p.titel}</span>
                <span className="zb-pruef__text block">{p.text}</span>
              </span>
              <Icon name="ChevronRight" className="size-4 text-bo-text-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IntegrationKachel({ daten, geraeteAlt = 0 }) {
  const d = daten || {};
  if (d.status === "recht") return null;
  if (d.status !== "ok") return <NichtGeladen titel={ZENTRALE.integration} />;
  return (
    <Kachel titel={ZENTRALE.integration} unter={ZENTRALE.integrationUnter} href="/protokoll?tab=api" oeffnenLabel="API-Protokoll öffnen" testid="zentrale-integration" fuss={geraeteAlt ? <p className="zb-leise">{ZENTRALE.geraeteAlt(geraeteAlt)}</p> : null}>
      <dl className="zb-pipe__sum mb-0">
        <div>
          <dd className="zb-gross"><Zahl wert={d.gesamt} /></dd>
          <dt className="zb-leise">{ZENTRALE.aufrufe}</dt>
        </div>
        <div>
          <dd className="zb-gross">{d.fehler}</dd>
          <dt className="zb-leise">{ZENTRALE.fehler24}</dt>
        </div>
        <div>
          <dd className="zb-gross">{d.rate}</dd>
          <dt className="zb-leise">{ZENTRALE.rateLimit}</dt>
        </div>
      </dl>
    </Kachel>
  );
}

// ------------------------------------------------------------------------------------------------ Kanzlei / Selbstservice / Kiosk

export function ExternKachel({ art, daten }) {
  if (art === "export") {
    const l = daten?.laeufe;
    return (
      <Kachel titel={ZENTRALE.exportLaeufe} unter={ZENTRALE.exportLaeufeText} href="/d/ph-export-lauf" testid="zentrale-extern-export">
        {!l ? <p className="zb-leise">{ZENTRALE.noch}</p> : l.length === 0 ? <p className="zb-leise">{ZENTRALE.noch}</p> : (
          <ul className="zb-liste">
            {l.map((x) => (
              <li key={x.name}>
                <Link href={`/d/ph-export-lauf/${encodeURIComponent(x.name)}`} className="zb-liste__i">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{datum(x.zeitraum_von)} – {datum(x.zeitraum_bis)}</span>
                    <span className="zb-leise block">{x.name}</span>
                  </span>
                  <Pille material={x.status === "Bestaetigt" ? "salbei" : x.status === "Uebergeben" ? "see" : "stein"}>{anzeige(x.status)}</Pille>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kachel>
    );
  }
  if (art === "posten") {
    const p = daten?.posten;
    return (
      <Kachel titel={ZENTRALE.offenePosten} unter={ZENTRALE.offenePostenText} href="/d/ph-rechnung?status=Gestellt,Teilbezahlt,Ueberfaellig,Gemahnt" testid="zentrale-extern-posten">
        {!p ? <p className="zb-leise">{ZENTRALE.noch}</p> : (
          <>
            <p className="zb-gross">{cent(p.cent)}</p>
            <p className="zb-leise mt-2">{`${p.anzahl} Rechnungen · ${p.ueberfaellig} überfällig${p.anzahlungenCent ? ` · Anzahlungsanforderungen ${cent(p.anzahlungenCent)}` : ""}`}</p>
          </>
        )}
      </Kachel>
    );
  }
  const a = daten?.abschluesse;
  return (
    <Kachel titel={ZENTRALE.kassenbuch} unter={ZENTRALE.kassenbuchText} href="/d/ph-kassenabschluss" testid="zentrale-extern-kassa">
      {!a || a.length === 0 ? <p className="zb-leise">{ZENTRALE.noch}</p> : (
        <ul className="zb-liste">
          {a.map((x) => (
            <li key={x.name}>
              <Link href={`/d/ph-kassenabschluss/${encodeURIComponent(x.name)}`} className="zb-liste__i">
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">{datum(x.datum)}</span>
                  <span className="zb-leise block">{anzeige(x.status)}</span>
                </span>
                <span className="text-[14px] font-semibold tabular-nums">{x.umsatz_cent === null || x.umsatz_cent === undefined ? "–" : cent(x.umsatz_cent)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export function VerweisKachel({ titel, text, href, icon = "ArrowUpRight", testid }) {
  return (
    <Kachel titel={titel} href={href} lift testid={testid}>
      <span className="zb-hub__sym" aria-hidden="true">
        <Icon name={icon} className="size-5" />
      </span>
      <p className="zb-leise max-w-[40ch]">{text}</p>
    </Kachel>
  );
}
