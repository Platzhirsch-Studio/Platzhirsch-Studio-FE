// Regress-Akte (T5, 10-konzept-service §2.8): Primär je Status, Abgleich Soll/Ist (N19), Fristtext nach R-03.
// Buchhaltung extern liest nur Regress-Felder (Fallnummer als Text, kein Fall-Leserecht).
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { ladeMeta } from "@/lib/backoffice/frappe";
import { darf } from "@/lib/backoffice/auth/rechte";
import { ladeEinstellungen, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { ABGLEICH, REGRESS_STATUS } from "@/lib/backoffice/service/labels";
import { regressFristText } from "@/lib/backoffice/service/zeilen";
import { datumLang, euro } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import { AkteKopf, Band } from "@/components/Backoffice/Akte";
import { Fakten, Status } from "@/components/Backoffice/Service/Teile";
import { RegressAktionen } from "@/components/Backoffice/Service/VertragAktionen";
import "@/components/Backoffice/Service/service.css";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Regress` };
}

export default async function RegressAkte({ params }) {
  const name = decodeURIComponent((await params).name);
  const s0 = await requireSession(`/service/regress/${encodeURIComponent(name)}`);
  const client = serviceClient(s0);
  const session = await requireDocRecht(await ladeMeta(client, "PH Lieferantenregress"), "read", `/service/regress/${encodeURIComponent(name)}`);
  const s = sicht(session);
  let r;
  try {
    r = await client.getDoc("PH Lieferantenregress", name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  }
  const einst = await ladeEinstellungen(client);
  const f = regressFristText(r);
  const soll = Number(r.betrag_anerkannt_cent) || Number(r.betrag_gefordert_cent) || 0;
  const ist = Number(r.betrag_erhalten_cent) || 0;
  const fallLesen = darf(session, "service", "read");
  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/regress", titel: "Regress" }}
          krumen={[{ titel: "Service", href: "/service" }, { titel: "Regress", href: "/service/regress" }, { titel: name }]}
          titel={r.lieferant}
          nummer={
            <span className="flex flex-wrap items-center gap-3">
              <span className="tabular-nums">
                {name} · {r.form}
              </span>
              <Status wert={r.status} map={REGRESS_STATUS} />
              <span className="bo-svc-gwl" data-ton={f.ton}>
                {f.text}
              </span>
            </span>
          }
          aktionen={<RegressAktionen regress={r} leitung={s.leitung} darf={s.schreiben} toleranzCent={Number(einst.regress_toleranz_cent) || 100} />}
        />
        {r.abgleich_status === "Unterdeckung" && <Band ton="warnung" titel={T.regress.fehlt(euro(Math.abs(r.differenz_cent)))} text={s.leitung ? "Differenz ausbuchen über „Weitere Aktionen“." : "Die Leitung entscheidet über das Ausbuchen."} />}
        {r.abgleich_status === "Ueberdeckung" && <Band ton="warnung" titel={T.regress.mehr(euro(r.differenz_cent))} />}
        <Bento>
          <Kennzahl className="md:col-span-4" titel="Gefordert" wert={Number(r.betrag_gefordert_cent)} format="cent" />
          <Kennzahl className="md:col-span-4" titel="Anerkannt" wert={Number(r.betrag_anerkannt_cent) || null} format="cent" />
          <Kennzahl className="md:col-span-4" titel="Erhalten" wert={ist || null} format="cent" zusatz={r.abgleich_status ? ABGLEICH[r.abgleich_status]?.text : undefined} />
          <Kachel className="md:col-span-7" titel="Abgleich" unter={T.regress.sollIst(euro(soll), euro(ist), soll > ist ? euro(soll - ist) : "")}>
            <div className="h-3 overflow-hidden rounded-pill bg-bo-fill-2" role="img" aria-label={`Erhalten ${euro(ist)} von ${euro(soll)}`}>
              <div className="h-full rounded-pill bg-bo-salbei" style={{ width: `${soll ? Math.min(100, (ist / soll) * 100) : 0}%` }} />
            </div>
            <Fakten className="mt-5" eintraege={[{ label: "Gutschriftnummer", wert: r.gutschrift_nummer }, { label: "Gutschrift vom", wert: datumLang(r.gutschrift_datum) }, { label: "Quote", wert: r.quote_promille ? `${(r.quote_promille / 10).toLocaleString("de-AT")} %` : null }, { label: "Ausgebucht", wert: r.ausgebucht_grund }]} />
          </Kachel>
          <Kachel className="md:col-span-5" titel="Regress">
            <Fakten
              spalten={1}
              eintraege={[
                { label: "Servicefall", wert: fallLesen ? <Link className="underline" href={`/service/faelle/${encodeURIComponent(r.servicefall)}`}>{r.servicefall}</Link> : r.servicefall },
                { label: "Gemeldet am", wert: datumLang(r.gemeldet_am) },
                { label: "Referenz des Lieferanten", wert: r.lieferant_referenz },
                { label: "Regressfrist", wert: `${datumLang(r.frist_bis)} (§ 933b ABGB)` },
                { label: "Antwort des Lieferanten", wert: r.antwort_lieferant },
                { label: "Ablehnungsgrund", wert: r.ablehnungsgrund },
              ]}
            />
          </Kachel>
          <Kachel className="md:col-span-12" titel="Beschreibung">
            <p className="text-[14px] leading-6">{r.beschreibung || "–"}</p>
            <p className="bo-svc-hinweis mt-4">{T.regress.waehrung}</p>
          </Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
