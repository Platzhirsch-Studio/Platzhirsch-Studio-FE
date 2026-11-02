"use client";
// Prototyp „Unikat“ – Raum-Starter (Glas-Karte im Hero).
// Raum (Radio-Gruppe), Raumgröße (Slider, nur Kontext für die Anfrage) und Stil
// (Chips) → sofort: Welten, Marken und 3 Produkte aus dem statischen Katalog.
// Die Auswahl ist auf dem Server vorbereitet (starterData.js); hier wird nur
// gewählt. Keine Preise, keine Ersparnis-/Zeitangaben.
// Server-HTML = Startzustand (Wohnzimmer, 30 m², Natürlich): ohne JS sichtbar.
import { useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./unikat.module.css";

const GROESSE = { min: 8, max: 120, step: 1, start: 30 };

export default function RaumStarter({ raeume, stile, beratungPath }) {
  const uid = useId();
  const [raumId, setRaumId] = useState(raeume[0].id);
  const [stilId, setStilId] = useState(stile[0].id);
  const [qm, setQm] = useState(GROESSE.start);
  const raum = raeume.find((r) => r.id === raumId) || raeume[0];
  const stil = stile.find((x) => x.id === stilId) || stile[0];
  const result = raum.vorschlaege[stil.id];

  const href = useMemo(() => {
    const q = new URLSearchParams({ thema: raum.thema, produkt: `Raum-Starter: ${raum.label}, ca. ${qm} m², Stil ${stil.label}` });
    return `/de${beratungPath}?${q.toString()}`;
  }, [raum, stil, qm, beratungPath]);

  const fill = ((qm - GROESSE.min) / (GROESSE.max - GROESSE.min)) * 100;

  return (
    <form className={s.starter} aria-labelledby={`${uid}-t`} onSubmit={(e) => e.preventDefault()}>
      <div className={s.starterHead}>
        <p className={s.starterEyebrow}>Raum-Starter</p>
        <h2 id={`${uid}-t`} className={s.starterTitle}>
          Womit beginnen wir?
        </h2>
      </div>

      <fieldset className={s.field}>
        <legend className={s.fieldLabel}>Raum</legend>
        <div className={s.segment}>
          {raeume.map((r) => (
            <label key={r.id} className={s.segOpt}>
              <input type="radio" name={`${uid}-raum`} value={r.id} checked={r.id === raumId} onChange={() => setRaumId(r.id)} />
              <span>{r.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={s.field}>
        <div className={s.fieldRow}>
          <label htmlFor={`${uid}-qm`} className={s.fieldLabel}>
            Raumgröße
          </label>
          <output htmlFor={`${uid}-qm`} className={s.fieldValue}>
            {qm} <small>m²</small>
          </output>
        </div>
        <input
          id={`${uid}-qm`}
          className={s.range}
          type="range"
          min={GROESSE.min}
          max={GROESSE.max}
          step={GROESSE.step}
          value={qm}
          aria-valuetext={`${qm} Quadratmeter`}
          onChange={(e) => setQm(Number(e.target.value))}
          style={{ "--fill": `${fill}%` }}
        />
      </div>

      <fieldset className={s.field}>
        <legend className={s.fieldLabel}>Stil</legend>
        <div className={s.chips}>
          {stile.map((x) => (
            <label key={x.id} className={s.chip}>
              <input type="radio" name={`${uid}-stil`} value={x.id} checked={x.id === stilId} onChange={() => setStilId(x.id)} />
              <span>{x.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={s.result} aria-live="polite">
        <p className={s.resultLabel}>
          {raum.poolNote}
          {result.exact ? `, passend zu „${stil.label}“ nach Herstellerangaben` : ""}
        </p>
        <ul className={s.products}>
          {result.cards.map((c) => (
            <li key={c.slug}>
              <Link href={c.href} className={s.product} prefetch={false}>
                <span className={s.productImg}>
                  <Image src={c.image.src} alt={c.image.alt} width={160} height={160} sizes="96px" quality={70} />
                </span>
                <span className={s.productName}>
                  <span className={s.productBrand}>{c.marke}</span>
                  {c.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={s.resultMeta}>
          <span className={s.metaKey}>Welten</span>{" "}
          {raum.welten.map((w, i) => (
            <span key={w.href}>
              {i > 0 && " · "}
              <Link href={`/de${w.href}`} prefetch={false}>
                {w.label}
              </Link>
            </span>
          ))}
        </p>
        <p className={s.resultMeta}>
          <span className={s.metaKey}>Marken</span>{" "}
          {raum.marken.map((m, i) => (
            <span key={m.href}>
              {i > 0 && " · "}
              <Link href={`/de${m.href}`} prefetch={false}>
                {m.name}
              </Link>
            </span>
          ))}
        </p>
      </div>

      <a className={s.starterCta} href={href}>
        Planung mit diesen Angaben anfragen
        <span aria-hidden="true">→</span>
      </a>
      <p className={s.starterNote}>Ein Anfang, keine Planung. Raumgröße und Stil gehen als Notiz in Ihre Anfrage.</p>
    </form>
  );
}
