import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteGeruest, AkteKopf, Band } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Fehler from "@/components/Backoffice/Fehler";
import { Icon } from "@/components/Backoffice/icons";
import { AntragAktionen } from "@/components/Backoffice/Kundenkarte/Antraege";
import { darfLeitungBitten } from "@/components/Backoffice/Informieren/server";
import { params, seitenStart } from "@/lib/backoffice/kundenkarte/seite";
import { alsFehler, ladeAntrag, ladeAntraege, ladeStufen, ladeBerater, beraterName } from "@/lib/backoffice/kundenkarte/daten";
import { ANTRAG_STATUS, QUELLE, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { darfSchreiben, istLeitung, zerlegeAblehnGrund, geburtstagAnzeige } from "@/lib/backoffice/kundenkarte/regeln";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params: p }) {
  const { name } = await p;
  return { title: `${decodeURIComponent(name)} · Kundenkarte` };
}

function Zeile({ ok, children, unter }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 grid size-6 flex-none place-items-center rounded-full ${ok ? "bg-bo-salbei-soft text-bo-salbei-text" : "bg-bo-fill text-bo-text-faint"}`} aria-hidden="true">
        <Icon name={ok ? "Check" : "Minus"} className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px]">
          {children}
          <span className="bo-kk-sr">{ok ? " – ja" : " – nein"}</span>
        </span>
        {unter && <span className="block text-[12px] text-bo-text-faint">{unter}</span>}
      </span>
    </li>
  );
}

export default async function AntragAkte({ params: p, searchParams }) {
  const { name: roh } = await p;
  const name = decodeURIComponent(roh);
  const sp = params(await searchParams);
  const ctx = await seitenStart(`/kundenkarte/antraege/${name}`, sp, { akte: true });
  let d;
  try {
    d = await ladeAntrag(ctx, name);
  } catch (err) {
    if (istBackofficeError(err) && (err.code === "not_found" || err.code === "forbidden")) notFound();
    const f = alsFehler(err);
    return (
      <Shell session={ctx.session}>
        <Fehler code={f.code} message={f.message} zurueckHref="/kundenkarte/antraege" />
      </Shell>
    );
  }
  const a = d.doc;
  const leitung = istLeitung(ctx.rolle);
  const [stufen, darfBitten, liste, berater] = await Promise.all([ladeStufen(ctx).catch(() => []), darfLeitungBitten(ctx.session, ctx.client).catch(() => false), ladeAntraege(ctx, { reiter: "entscheiden" }).catch(() => ({ zeilen: [] })), ladeBerater(ctx)]);
  const naechster = liste.zeilen.map((z) => z.name).find((n) => n !== a.name) || null;
  const abgelehnt = zerlegeAblehnGrund(a.entscheidung_grund);
  const band =
    a.status === "Abgelehnt"
      ? { ton: "neutral", titel: T.antrag.bandAbgelehnt(datum(a.entschieden_am), beraterName(berater, a.entschieden_durch), [abgelehnt.grund, abgelehnt.text].filter(Boolean).join(": ")) }
      : a.status === "Angenommen"
        ? { ton: "neutral", titel: T.antrag.bandAngenommen(a.kundenkarte), ziel: a.kundenkarte }
        : a.status === "Doppelt"
          ? { ton: "neutral", titel: T.antrag.bandDoppelt(a.doppelt_zu), ziel: a.doppelt_zu }
          : d.treffer.andererName
            ? { ton: "warnung", titel: T.antrag.andererNameBand(d.treffer.andererName.anzeige), text: "Beim Ausstellen bewusst „Neuen Kontakt anlegen“ oder die passende Person wählen." }
            : null;
  const offen = ["Neu", "Bestaetigt"].includes(a.status);
  const st = stufen.find((s) => s.name === a.startstufe);

  return (
    <Shell session={ctx.session}>
      <AkteGeruest
        testid="kk-antrag-akte"
        kopf={
          <AkteKopf
            zurueck={{ href: "/kundenkarte/antraege", titel: T.seiten.antraege }}
            krumen={[{ titel: T.bereich, href: "/kundenkarte" }, { titel: T.seiten.antraege, href: "/kundenkarte/antraege" }, { titel: a.name }]}
            titel={`${a.vorname} ${a.nachname}`}
            nummer={<span className="mr-2">{T.antrag.eingang(QUELLE[a.quelle] || a.quelle, datumZeit(a.eingang))}</span>}
            status={<StatusBadge wert={a.status} text={statusLabel(ANTRAG_STATUS, a.status)} ton={statusTon(ANTRAG_STATUS, a.status)} groesse="m" />}
            aktionen={<AntragAktionen antrag={a} treffer={d.treffer} stufen={stufen.filter((s) => s.aktiv)} leitung={leitung} darfSchreiben={darfSchreiben(ctx.rolle)} darfBitten={darfBitten} karteDesKontakts={d.karteDesKontakts} naechster={naechster} startAusstellen={sp.ausstellen === "1"} />}
          />
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} aktion={band.ziel ? <Link className="bo-knopf bo-knopf--secondary inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold" href={`/kundenkarte/karten/${band.ziel}`}>Karte öffnen</Link> : null} testid="kk-antrag-band" /> : null}
        rechts={
          <>
            <Kachel titel={T.antrag.kontakt} testid="kk-antrag-kontakt">
              {d.kontakt ? (
                <Link href={`/kunden/${encodeURIComponent(d.kontakt.name)}`} className="flex items-center gap-3 text-[14px] font-semibold">
                  <Icon name="Contact" className="size-4" />
                  {d.kontakt.titel}
                  <span className="font-normal text-bo-text-soft">{[d.kontakt.plz, d.kontakt.ort].filter(Boolean).join(" ")}</span>
                </Link>
              ) : (
                <>
                  <p className="text-[14px] text-bo-text-soft">{T.antrag.nichtVerknuepft}</p>
                  {d.treffer.treffer.length ? (
                    <>
                      <p className="mt-3 text-[13px] font-medium">{T.antrag.aehnlich(d.treffer.treffer.length)}</p>
                      <ul className="mt-1 flex flex-col gap-1">
                        {d.treffer.treffer.map((t) => (
                          <li key={t.name} className="rounded-xl bg-bo-surface-2 px-3 py-2 text-[13px]">
                            <span className="block font-medium">{t.titel}</span>
                            <span className="text-bo-text-soft">{[t.plz, t.ort].filter(Boolean).join(" ")} · {t.zeichen.join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="mt-2 text-[13px] text-bo-text-faint">{T.antrag.keinAehnlicher}</p>
                  )}
                </>
              )}
            </Kachel>
            <Kachel titel={T.antrag.karte}>
              {a.kundenkarte || a.doppelt_zu ? (
                <Link href={`/kundenkarte/karten/${a.kundenkarte || a.doppelt_zu}`} className="bo-kk-mono text-[15px] underline decoration-bo-line-strong underline-offset-4">
                  {a.kundenkarte || a.doppelt_zu}
                </Link>
              ) : d.karteDesKontakts ? (
                <p className="bo-kk-warn">{T.antraege.karteBesteht(d.karteDesKontakts)}</p>
              ) : (
                <p className="text-[14px] text-bo-text-soft">– {T.antrag.karteEntsteht}</p>
              )}
            </Kachel>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <Kachel titel={T.antrag.abschnittAntrag} testid="kk-antrag-daten">
            <dl className="bo-kk-fakten">
              <div>
                <dt>Name</dt>
                <dd>{[a.anrede, a.vorname, a.nachname].filter(Boolean).join(" ")}</dd>
              </div>
              <div>
                <dt>E-Mail</dt>
                <dd>{a.email || "–"}</dd>
              </div>
              <div>
                <dt>Telefon</dt>
                <dd>{a.telefon || "–"}</dd>
              </div>
              <div>
                <dt>Ort</dt>
                <dd>{[a.plz, a.ort].filter(Boolean).join(" ") || "–"}</dd>
              </div>
              <div>
                <dt>Sprache</dt>
                <dd>{{ de: "Deutsch", en: "Englisch", fr: "Französisch", it: "Italienisch" }[a.sprache] || "–"}</dd>
              </div>
              <div>
                <dt>Geburtstag</dt>
                <dd>{geburtstagAnzeige(a.geburtstag_tag_monat) || "–"}</dd>
              </div>
              <div>
                <dt>Interessen</dt>
                <dd>{a.interessen || "–"}</dd>
              </div>
              <div>
                <dt>Startstufe</dt>
                <dd>{st?.stufenname || a.startstufe || "–"}</dd>
              </div>
            </dl>
            {a.nachricht && (
              <blockquote className="mt-4 border-l-2 border-bo-cognac pl-4 text-[14px] italic text-bo-text-soft">„{a.nachricht}“</blockquote>
            )}
          </Kachel>
          <Kachel titel={T.antrag.abschnittEinwilligungen} unter={T.antrag.keineAenderung} testid="kk-antrag-einwilligungen">
            <ul>
              <Zeile ok={Number(a.vertragsdaten_akzeptiert) === 1}>{T.antrag.teilnahme(a.bedingungen_version)}</Zeile>
              <Zeile ok={Number(a.einwilligung_auswertung) === 1}>{T.antrag.auswertung(a.einwilligung_textversion)}</Zeile>
              <Zeile ok={Number(a.einwilligung_newsletter) === 1} unter={Number(a.einwilligung_newsletter) ? "Bestätigung per E-Mail durch Marketing" : undefined}>
                {T.antrag.newsletter}
              </Zeile>
              {a.quelle === "website" && <Zeile ok={Boolean(a.bestaetigt_am)}>{a.bestaetigt_am ? T.antrag.mailBestaetigt(datumZeit(a.bestaetigt_am)) : T.antrag.mailOffen}</Zeile>}
            </ul>
            <details className="mt-3 rounded-2xl bg-bo-surface-2 px-4 py-3">
              <summary className="cursor-pointer text-[13px] font-medium text-bo-text-soft">{T.antrag.nachweis}</summary>
              <dl className="bo-kk-fakten mt-3 font-mono text-[12px] text-bo-text-soft">
                <div>
                  <dt>Zeitpunkt</dt>
                  <dd className="text-[12px]">{a.einwilligung_zeitpunkt ? datumZeit(a.einwilligung_zeitpunkt) : "–"}</dd>
                </div>
                <div>
                  <dt>Kanal</dt>
                  <dd className="text-[12px]">{a.nachweis_art || (a.quelle === "website" ? "Website-Formular" : "–")}</dd>
                </div>
                <div>
                  <dt>Datei</dt>
                  <dd className="text-[12px]">{a.nachweis ? String(a.nachweis).split("/").pop() : "–"}</dd>
                </div>
                <div>
                  <dt>Bestätigt über</dt>
                  <dd className="text-[12px]">{a.bestaetigt_kanal || "–"}</dd>
                </div>
              </dl>
            </details>
          </Kachel>
          <Kachel titel={T.antrag.abschnittVerlauf}>
            <ol className="flex flex-col">
              {d.verlauf.map((v, i) => (
                <li key={i} className="flex items-baseline gap-3 py-1.5 text-[14px]">
                  <time className="w-36 flex-none text-[12px] tabular-nums text-bo-text-faint">{datumZeit(v.zeit)}</time>
                  <span>{v.text}</span>
                </li>
              ))}
            </ol>
          </Kachel>
          {!offen && a.status === "Abgelehnt" && <p className="text-[12px] text-bo-text-faint">Keine Nachricht an die Kundin – interne Dokumentation.</p>}
        </div>
      </AkteGeruest>
    </Shell>
  );
}
