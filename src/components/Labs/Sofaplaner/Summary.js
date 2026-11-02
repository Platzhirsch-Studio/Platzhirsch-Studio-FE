"use client";
import { MEASURE_LABEL } from "../../../lib/sofaplaner/normalize.js";
import { sourceCopy } from "../../../lib/sofaplaner/copy/source.js";
import { useT } from "./useT";
import { bom, lookText, plainLabel, sideCode, sideLabel } from "./model";
import s from "./sofaplaner.module.css";

const cell = (v, missing, T) => (v == null ? <span className={s.missingCell}>{missing ? T("fehlt") : "–"}</span> : T.cm(v));

/** Step 6: plain-language list, then the order details (codes, measures, sources). */
export default function Summary({ plan, family, lookup }) {
  const T = useT();
  const SC = sourceCopy(T.locale);
  const { rows, extras } = bom(plan, lookup, family);
  const look = lookText(plan, family).map((l) => T.dyn(l));
  const missingRows = rows.filter((r) => r.el?.missing?.length);
  return (
    <div className={s.stack}>
      <h3 className={s.h3}>{T("Ihre Zusammenstellung")}</h3>
      <ul className={s.plainList} data-testid="sp-klartext">
        {rows.map((r) => (
          <li key={r.code}>
            {`${r.qty}\u00a0×`} {r.el ? plainLabel(r.el) : r.code}
            {/* QM r3: Maß als Einheit – „192 × 102 / cm“ brach vor der Einheit um */}
            {sideLabel(r.el) ? `, ${T.dyn(sideLabel(r.el))}` : ""} – <span className={s.nowrap}>{`${T.cm(r.el?.w)}\u00a0×\u00a0${T.cm(r.el?.d)}\u00a0cm`}</span>
            {r.el?.missing?.length ? <span className={s.tileMissing}> {T("Maß im Showroom bestätigen")}</span> : null}
          </li>
        ))}
        {extras.map((x, i) => (
          <li key={`x${i}`}>
            {x.qty} × {x.label}
            {x.detail ? ` (${T.dyn(x.detail)})` : ""}
          </li>
        ))}
        {look.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>

      <details className={s.more}>
        <summary>{T("Technische Details (Elementcodes, Maße, Quellen)")}</summary>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className={s.srOnly}>{T("Stückliste")}</caption>
            <thead>
              <tr>
                <th scope="col">{T("Anz.")}</th>
                <th scope="col">Element</th>
                <th scope="col">Code</th>
                <th scope="col">{T("B")}</th>
                <th scope="col">{T("T")}</th>
                <th scope="col">H</th>
                <th scope="col">{T("Sitz-H")}</th>
                <th scope="col">{T("Sitz-T")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const el = r.el || {};
                return (
                  <tr key={r.code}>
                    <td>{r.qty}</td>
                    <td>
                      {el.label || r.code}
                      {sideLabel(el) ? <span className={s.small}> {T.dyn(sideLabel(el))}{sideCode(el) ? ` (${sideCode(el)})` : ""}</span> : null}
                      {el.labelEn && !T.foreign ? <span className={s.small}> ({el.labelEn})</span> : null}
                    </td>
                    <td className={s.code}>
                      {r.code}
                      {el.official ? <span className={s.small}> {T("Hersteller-Nr.")} {el.official}</span> : <span className={s.small}> {T("(intern)")}</span>}
                    </td>
                    <td>{cell(el.w, true, T)}</td>
                    <td>{cell(el.d, true, T)}</td>
                    <td>{cell(el.h, true, T)}</td>
                    <td>{cell(el.sh, true, T)}</td>
                    <td>{el.sdText ? T.dyn(el.sdText) : cell(el.sd, el.role !== "loose", T)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!SC.brand ? (
          <p className={s.small}>{T("Maße in cm: Planungsmaße der Sofa-Typen (Rastermaße).")} {SC.showroom}</p>
        ) : (
        <p className={s.small}>
          {T(family.retrieved ? "Maße in cm laut Hersteller (Produktseite und technisches Datenblatt, Abruf {date})." : "Maße in cm laut Hersteller (Produktseite und technisches Datenblatt).", { date: family.retrieved })}{" "}
          {T("Codes sind Schlüssel des Planers; Minotti veröffentlicht keine Artikelnummern (wo vorhanden, steht die Elementnummer aus dem Datenblatt dabei).")}{" "}
          {T(rows.some((r) => r.el?.sideDerived) ? "SX/DX (teils aus dem Elementtyp abgeleitet): vor einer Bestellung am Datenblatt bestätigen." : "SX/DX (laut Datenblatt): vor einer Bestellung am Datenblatt bestätigen.")}
        </p>
        )}
        {missingRows.length > 0 && (
          <p className={s.small}>
            {T("Fehlende Maße:")} {missingRows.map((r) => `${r.el.label} (${r.el.missing.map((k) => T(MEASURE_LABEL[k])).join(", ")})`).join("; ")}.
          </p>
        )}
        {family.measureNote && <p className={s.small} lang={T.foreign ? "de" : undefined}>{T("Hinweis zu den Maßen:")} {family.measureNote}</p>}
        {family.missingInfo.length > 0 && (
          <>
            <h4 className={s.h4}>{T("Was der Hersteller nicht veröffentlicht")}</h4>
            <ul className={s.plainList} lang={T.foreign ? "de" : undefined}>
              {family.missingInfo.slice(0, 12).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </>
        )}
        {family.sources.length > 0 && <h4 className={s.h4}>{T("Quellen")}</h4>}
        <ul className={s.plainList}>
          {family.sources.slice(0, 8).map((u) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noopener noreferrer" className={s.srcLink}>
                {u.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
