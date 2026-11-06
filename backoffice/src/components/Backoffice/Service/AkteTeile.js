// Teile der Akte Servicefall (10-konzept-service §3.1–§3.3): Phasenleiste, SLA-Zeile, Fristband, Zeitleiste.
// Server-tauglich (ohne Hooks). Fristband als SVG mit vollem Satz als aria-label und Tabelle in <details>.
import cx from "../cx";
import { Icon } from "../icons";
import Avatar from "../Avatar";
import { PHASEN, phaseIndex } from "@/lib/backoffice/service/labels";
import { meldezustand } from "@/lib/backoffice/service/regeln";
import { alsDatum, tageBis } from "@/lib/backoffice/service/fristen";
import { datumLang, tagMonat, zeitpunkt, personName, uhr } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

/** Sechs Phasen; „Einsatz geplant“ als Unterzeile der Phase 4; Datum aus dem Verlauf (ereignis Status). */
export function Phasenleiste({ fall, einsatzText }) {
  const aktuell = phaseIndex(fall.status);
  const datum = {};
  for (const v of fall.verlauf || []) if (v.ereignis === "Status" && v.status && !datum[v.status]) datum[v.status] = v.zeit;
  datum.Gemeldet ||= fall.gemeldet_am;
  return (
    <>
      <ol className="bo-svc-phasen" aria-label={T.akte.phasen} data-testid="phasenleiste">
        {PHASEN.map((p, i) => {
          const zustand = i < aktuell ? "erledigt" : i === aktuell ? "aktuell" : "offen";
          return (
            <li key={p.id} className="bo-svc-phase" data-zustand={zustand} aria-current={zustand === "aktuell" ? "step" : undefined}>
              <span className="bo-svc-phase__linie" aria-hidden="true" />
              <span className="bo-svc-phase__punkt" aria-hidden="true">
                {zustand === "erledigt" && <Icon name="Check" className="size-3.5" />}
              </span>
              <span className="bo-svc-phase__text">
                {p.titel}
                <span className="bo-svc-phase__datum">{datum[p.id] ? tagMonat(datum[p.id]) : zustand === "offen" ? "" : "–"}</span>
                {p.id === "In Bearbeitung" && fall.status === "Einsatz geplant" && einsatzText && <span className="bo-svc-phase__datum">{einsatzText}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-[14px] text-bo-text-soft sm:hidden">{T.akte.schritt(Math.max(1, aktuell + 1), PHASEN.length, PHASEN[Math.max(0, aktuell)]?.titel || "")}</p>
    </>
  );
}

/** SLA-Zeile (N5): Lösung bis … · im Plan / gefährdet / überschritten. */
export function SlaZeile({ fall }) {
  const bis = fall.frist_loesung ? tagMonat(fall.frist_loesung) : null;
  if (["Erledigt", "Geschlossen"].includes(fall.status)) return <p className="text-[13px] text-bo-text-soft">{T.akte.sla.erfuellt}</p>;
  if (fall.status === "Abgelehnt" || !bis) return null;
  if (fall.sla_status === "Verletzt" || Number(fall.sla_loesung_verletzt))
    return (
      <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bo-ziegel-text" data-testid="sla-zeile">
        <Icon name="TriangleAlert" className="size-3.5" />
        {T.akte.sla.verletzt}
      </p>
    );
  if (fall.sla_status === "Gefaehrdet")
    return (
      <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-bo-eiche-text" data-testid="sla-zeile">
        <Icon name="Clock" className="size-3.5" />
        {T.akte.sla.gefaehrdet(bis)}
      </p>
    );
  if (fall.sla_status === "Pausiert") return <p className="text-[13px] text-bo-text-soft">{T.akte.sla.pausiert}</p>;
  return (
    <p className="text-[13px] text-bo-text-soft" data-testid="sla-zeile">
      {T.akte.sla.imPlan(bis)}
    </p>
  );
}

const MELDE_TEXT = {
  vermutung: "rechtzeitig gemeldet · Vermutung (Beweislast Platzhirsch)",
  gewaehrleistung: "rechtzeitig gemeldet · innerhalb der Gewährleistung (Beweislast Kunde)",
  abgelaufen: "bei Meldung abgelaufen",
  unbekannt: "Übergabe fehlt – Frist unbekannt · Datum eintragen",
};

/**
 * Fristband (§3.2): Zeile 1 Anspruchsstand bei Meldung, Zeile 2 Warnung ab heute; Strahl von Übergabe bis
 * max(Verjährung, Garantie) mit Vermutung (hell), Gewährleistung (voll), Verjährung (schraffiert), Raute Meldung, Linie heute.
 */
export function Fristband({ fall, kompakt = false, heute = new Date() }) {
  const mz = meldezustand(fall);
  const start = alsDatum(fall.uebergabe_datum || fall.kaufdatum);
  const gwl = alsDatum(fall.gewaehrleistung_bis);
  if (!start || !gwl) {
    return (
      <div className="bo-svc-frist" data-testid="fristband">
        <div className="h-3 rounded-pill bg-bo-fill-2" aria-hidden="true" />
        <p className="bo-svc-frist__satz text-bo-text-soft">{MELDE_TEXT.unbekannt}</p>
      </div>
    );
  }
  const verm = alsDatum(fall.beweislast_bis) || start;
  const verj = alsDatum(fall.verjaehrung_bis) || gwl;
  const gar = alsDatum(fall.garantie_bis);
  const ende = new Date(Math.max(verj, gar || 0));
  const span = ende - start || 1;
  const x = (d) => Math.max(0, Math.min(100, ((d - start) / span) * 100));
  const meldung = alsDatum(mz.stichtag);
  const h = alsDatum(heute);
  const W = 1000;
  const px = (d) => (x(d) / 100) * W;
  const restVerj = tageBis(fall.verjaehrung_bis, heute);
  const satz = `${fall.kundentyp === "Unternehmer" ? "Unternehmer" : "Verbraucher"} · Übergabe ${datumLang(fall.uebergabe_datum || fall.kaufdatum)} · Gewährleistung bis ${datumLang(fall.gewaehrleistung_bis)} · Vermutung bis ${datumLang(fall.beweislast_bis)} · Verjährung der Geltendmachung ${datumLang(fall.verjaehrung_bis)}${gar ? ` · Garantie bis ${datumLang(fall.garantie_bis)}` : ""}. Gemeldet ${datumLang(mz.stichtag)}: ${MELDE_TEXT[mz.zustand]}.`;
  return (
    <div className="bo-svc-frist" data-testid="fristband">
      <svg viewBox={`0 0 ${W} ${gar ? 64 : 46}`} role="img" aria-label={satz}>
        <defs>
          <pattern id="bo-svc-schraffur" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="bo-svc-frist__schraffur" />
          </pattern>
        </defs>
        <rect x="0" y="14" width={W} height="12" rx="6" className="bo-svc-frist__strahl" />
        <rect x="0" y="14" width={px(verm)} height="12" rx="6" className="bo-svc-frist__vermutung" />
        <rect x={px(verm)} y="14" width={Math.max(0, px(gwl) - px(verm))} height="12" className="bo-svc-frist__gwl" />
        <rect x={px(gwl)} y="14" width={Math.max(0, px(verj) - px(gwl))} height="12" className="bo-svc-frist__verj" />
        {gar && <rect x="0" y="40" width={px(gar)} height="8" rx="4" className="bo-svc-frist__garantie" />}
        {[verm, gwl].map((d, i) => (
          <line key={i} x1={px(d)} x2={px(d)} y1="10" y2="30" className="bo-svc-frist__grenze" />
        ))}
        {meldung && <rect x={px(meldung) - 6} y="14" width="12" height="12" transform={`rotate(45 ${px(meldung)} 20)`} className="bo-svc-frist__meldung" />}
        {h >= start && h <= ende && <line x1={px(h)} x2={px(h)} y1="4" y2="36" className="bo-svc-frist__heute" />}
      </svg>
      {!kompakt && (
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-bo-text-faint" aria-hidden="true">
          <span>{tagMonat(fall.uebergabe_datum || fall.kaufdatum)}</span>
          <span>heute</span>
          <span>{tagMonat(ende.toISOString())}</span>
        </div>
      )}
      <p className="bo-svc-frist__satz" data-ton={mz.zustand === "abgelaufen" ? "gefahr" : undefined}>
        Gemeldet {datumLang(mz.stichtag)} · {MELDE_TEXT[mz.zustand]}
        {mz.paragraf ? ` · ${mz.paragraf}` : ""}
      </p>
      <p className="bo-svc-frist__satz2" data-ton={restVerj !== null && restVerj >= 0 && restVerj <= 60 ? "warn" : undefined}>
        Verjährung der Geltendmachung {datumLang(fall.verjaehrung_bis)}
        {fall.uebergabe_quelle ? ` · Übergabe ${datumLang(fall.uebergabe_datum)} aus ${fall.uebergabe_quelle}` : ""}
      </p>
      {fall.art === "Garantie" && mz.zustand !== "abgelaufen" && <p className="bo-svc-frist__satz2">{T.dialog.pruefen.garantieHinweis}</p>}
      {!kompakt && (
        <details>
          <summary>Fristen als Liste</summary>
          <table>
            <thead>
              <tr>
                <th>Frist</th>
                <th>bis</th>
                <th>Rechtsgrundlage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vermutung (Beweislast Platzhirsch)</td>
                <td>{datumLang(fall.beweislast_bis)}</td>
                <td>{fall.kundentyp === "Unternehmer" ? "§ 924 ABGB" : "§ 11 VGG"}</td>
              </tr>
              <tr>
                <td>Gewährleistung</td>
                <td>{datumLang(fall.gewaehrleistung_bis)}</td>
                <td>{fall.kundentyp === "Unternehmer" ? "§ 933 ABGB" : "§ 10 VGG"}</td>
              </tr>
              <tr>
                <td>Verjährung der Geltendmachung</td>
                <td>{datumLang(fall.verjaehrung_bis)}</td>
                <td>{fall.kundentyp === "Unternehmer" ? "§ 933 Abs 3 ABGB" : "§ 10 Abs 2 VGG"}</td>
              </tr>
              {gar && (
                <tr>
                  <td>Herstellergarantie</td>
                  <td>{datumLang(fall.garantie_bis)}</td>
                  <td>§ 9b KSchG</td>
                </tr>
              )}
              {fall.regress_frist_bis && (
                <tr>
                  <td>Regress gegen den Lieferanten</td>
                  <td>{datumLang(fall.regress_frist_bis)}</td>
                  <td>§ 933b ABGB</td>
                </tr>
              )}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

const ICON = { Status: "CircleCheck", Kommunikation: "Mail", Einsatz: "Wrench", Ersatzteil: "Package", Regress: "Banknote", Kulanz: "Hourglass", Eskalation: "TriangleAlert", Frist: "Clock", SLA: "Clock", Notiz: "MessageSquare", Kommentar: "MessageSquare" };

/** Zeitleiste aus Verlauf + Kommentaren, nach Tag gruppiert (neueste oben). */
export function Zeitleiste({ verlauf = [], kommentare = [], personen = {}, max = null, testid = "zeitleiste" }) {
  const eintraege = [
    ...verlauf.map((v) => ({ zeit: v.zeit, art: v.ereignis || "Notiz", titel: v.hinweis || v.status, von: v.von })),
    ...kommentare.map((k) => ({ zeit: k.creation, art: "Kommentar", titel: String(k.content || "").replace(/<[^>]+>/g, ""), von: k.owner || k.comment_email })),
  ]
    .filter((e) => e.zeit)
    .sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  const liste = max ? eintraege.slice(0, max) : eintraege;
  if (!liste.length) return <p className="text-[14px] text-bo-text-soft">{T.akte.verlaufLeer}</p>;
  const kopfTage = liste.map((e, i) => {
    const neu = String(e.zeit).slice(0, 10);
    return !max && (i === 0 || neu !== String(liste[i - 1].zeit).slice(0, 10)) ? neu : null;
  });
  return (
    <ol className="bo-svc-zeit" data-testid={testid}>
      {liste.map((e, i) => {
        const kopf = kopfTage[i];
        return (
          <li key={i}>
            {kopf && <p className="bo-svc-tag">{datumLang(kopf)}</p>}
            <div className="bo-svc-zeit__eintrag">
              <span className="bo-svc-zeit__ico" data-art={e.art}>
                <Icon name={ICON[e.art] || "Info"} className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="bo-svc-zeit__titel block">{e.titel}</span>
                {e.von && (
                  <span className="bo-svc-zeit__text mt-1 flex items-center gap-1.5">
                    <Avatar name={personName(e.von, personen)} groesse={18} ring={false} dekorativ />
                    {personName(e.von, personen)}
                  </span>
                )}
              </span>
              <span className="bo-svc-zeit__uhr">{max ? zeitpunkt(e.zeit) : uhr(String(e.zeit).slice(11))}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export { cx };
