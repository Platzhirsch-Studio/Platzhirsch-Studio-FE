import Link from "next/link";
import { Suspense } from "react";
import cx from "../cx";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Icon } from "../icons";
import { sichtbareQuellen, zaehleQuelle, zeileAus } from "@/lib/backoffice/aufgaben";
import { ErneutKnopf, ZuTunAktion } from "./Client";
import { ZUTUN_MAX } from "./logik";
import { ZUTUN } from "./texte";
import "./zutun.css";

// „Zu tun“ (MASTER G-11, Q-B4, Q-E2; Lounge §6 Kachel, §7.1 „Heute“-Spalte; Team P0-5b). Server-Komponente:
// eine schwebende Kachel, darin je Quelle eine eingelassene Zeile – Symbolkreis in Materialfläche, Satz mit
// Zahl (15/600), Nebenzeile (13), genau ein Knopf. Jede Quelle lädt in ihrem eigenen <Suspense> (Skelett in
// Zeilenform); Quellen mit 0 entfallen; Fehler/Zeitlimit treffen nur die eigene Zeile. Höchstens 5 Zeilen,
// darüber „Alle anzeigen“. Ohne offene Zeile: „Alles erledigt“ mit ruhigem Häkchen (ohne Aktion).
// Leer- und „Alle“-Zustand entscheidet CSS (:has) – so streamt jede Zeile für sich, ohne Client-Zustand.

/**
 * @param {object} p
 * @param {object[]} p.quellen           Definitionen aus lib/backoffice/aufgaben (Register, generisch oder eigene)
 * @param {object} [p.session]           Sitzung (Rechte je Quelle, Kontext für zaehle)
 * @param {object} [p.client]            backoffice(session) – Kontext für zaehle
 * @param {string} [p.titel]
 * @param {string} [p.unter]
 * @param {string} [p.alleHref]          Ziel „Alle anzeigen“ (ab der 6. Zeile sichtbar); ohne: keine Kürzung
 * @param {"alle"|"mir"|"team"} [p.sicht]
 * @param {string} [p.sichtBasis]        mit Basis-URL erscheinen die Filter-Chips „Alle · Für mich · Team“ (?zutun=)
 * @param {number} [p.zeitlimitMs]
 */
export default function ZuTun({ quellen = [], session, client, titel = ZUTUN.titel, unter = ZUTUN.unter, alleHref, sicht = "alle", sichtBasis, zeitlimitMs, className, testid = "zutun" }) {
  const liste = sichtbareQuellen(quellen, { session, sicht });
  const ctx = { session, client };
  return (
    <section className={cx("bo-kachel bo-zutun", alleHref && "bo-zutun--gekuerzt", className)} aria-labelledby={`${testid}-titel`} data-testid={testid}>
      <div className="bo-kachel__kopf">
        <div className="min-w-0">
          <h2 id={`${testid}-titel`} className="bo-kachel__titel">
            {titel}
          </h2>
          {unter && <p className="bo-kachel__unter">{unter}</p>}
        </div>
        {sichtBasis && (
          <div className="bo-kachel__werkzeuge">
            <Segment
              label={ZUTUN.filterLabel}
              groesse="s"
              aktiv={sicht}
              optionen={["alle", "mir", "team"].map((s) => ({ wert: s, titel: ZUTUN.sichten[s], href: s === "alle" ? sichtBasis : `${sichtBasis}${sichtBasis.includes("?") ? "&" : "?"}zutun=${s}` }))}
            />
          </div>
        )}
      </div>
      <ol className="bo-zutun__liste">
        {liste.map((def) => (
          <Suspense key={def.id} fallback={<ZeileSkelett />}>
            <ZuTunZeile def={def} ctx={ctx} zeitlimitMs={zeitlimitMs} />
          </Suspense>
        ))}
      </ol>
      <div className="bo-zutun__leer" data-testid={`${testid}-leer`}>
        <span aria-hidden="true" className="bo-zutun__haken">
          <Icon name="Check" className="size-5" />
        </span>
        <span>
          <span className="block text-[15px] leading-[22px] font-semibold">{ZUTUN.leerTitel}</span>
          <span className="block text-[13px] leading-[18px] text-bo-text-soft">{ZUTUN.leerText}</span>
        </span>
      </div>
      {alleHref && (
        <div className="bo-zutun__alle">
          <Knopf href={alleHref} size="s" variant="ghost" iconRechts="ArrowRight">
            {ZUTUN.alle}
          </Knopf>
        </div>
      )}
    </section>
  );
}

/** Eine Zeile: zählt die Quelle (mit Zeitlimit), 0 → nichts, Fehler → Hinweis mit „Erneut“. */
export async function ZuTunZeile({ def, ctx, zeitlimitMs }) {
  const r = await zaehleQuelle(def, ctx, zeitlimitMs ? { zeitlimitMs } : undefined);
  if (r.status === "ok" && r.n === 0) return null;
  if (r.status !== "ok") {
    return (
      <li className="bo-zutun__zeile is-fehler" data-zutun-zeile="fehler" data-quelle={def.id}>
        <span aria-hidden="true" className="bo-zutun__ico" data-ton="ziegel">
          <Icon name="TriangleAlert" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="bo-zutun__satz">{ZUTUN.fehler}</span>
          <span className="bo-zutun__unter">{r.status === "zeitlimit" ? ZUTUN.zeitlimit : def.titel || def.id}</span>
        </span>
        <ErneutKnopf />
      </li>
    );
  }
  const z = zeileAus(def, r.n, ctx);
  return (
    <li className="bo-zutun__zeile" data-zutun-zeile="" data-quelle={z.id}>
      <span aria-hidden="true" className="bo-zutun__ico" data-ton={z.ton}>
        <Icon name={z.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        {z.knopf.href ? (
          <Link href={z.knopf.href} className="bo-zutun__satz bo-zutun__link" tabIndex={-1}>
            {z.satz}
          </Link>
        ) : (
          <span className="bo-zutun__satz">{z.satz}</span>
        )}
        {z.unter && <span className="bo-zutun__unter">{z.unter}</span>}
      </span>
      <span className="bo-zutun__zahl" aria-hidden="true">
        {z.n}
      </span>
      {z.knopf.action ? (
        <ZuTunAktion titel={z.knopf.titel} id={z.id} action={z.knopf.action} />
      ) : (
        <Knopf href={z.knopf.href} size="s" variant="secondary" aria-label={`${z.knopf.titel}: ${z.satz}`}>
          {z.knopf.titel}
        </Knopf>
      )}
    </li>
  );
}

function ZeileSkelett() {
  return (
    <li className="bo-zutun__zeile" data-zutun-laedt="" aria-busy="true" aria-label={ZUTUN.laedt}>
      <span className="bo-skeleton size-10 shrink-0 rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="bo-skeleton h-3.5 w-3/5 rounded-pill" />
        <span className="bo-skeleton h-3 w-2/5 rounded-pill" />
      </span>
      <span className="bo-skeleton h-8 w-20 rounded-pill" />
    </li>
  );
}

export { ZUTUN_MAX };
