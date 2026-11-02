// StationList – alle Stationen und Stücke des Rundgangs als Liste (WCAG 2.2 AA:
// Alternative zum Canvas, Akzeptanz 4). Server-gerendert: die Texte stehen im
// HTML, auch für Suchmaschinen und ohne JavaScript. <details> ist ohne Skript
// bedienbar; die Stücke führen direkt zu Produktseite und Terminwunsch.
import { Link } from "@/i18n/navigation";
import s from "./showroom.module.css";

export default function StationList({ tour, t, beratungPath }) {
  const n = tour.stations.length;
  return (
    <details className={s.list} id="stationen">
      <summary className={s.listSummary}>
        <span>{t.liste}</span>
        <span className={s.listCount}>{n}</span>
      </summary>
      <ol className={s.listItems}>
        {tour.stations.map((st, i) => (
          <li key={st.id} className={s.listItem}>
            <p className={s.listMeta}>
              {t.station(i + 1, n)} · {t.zonen[st.zone] || st.zone}
            </p>
            <h3 className={s.listTitle}>{st.titel}</h3>
            <p className={s.listText}>{st.text}</p>
            {st.hotspots.length > 0 && (
              <ul className={s.listPieces}>
                {st.hotspots.map((h) => (
                  <li key={h.id}>
                    <p className={s.pieceLabel}>{h.label}</p>
                    {(h.dealer || h.masse) && <p className={s.pieceMeta}>{[h.dealer, h.masse].filter(Boolean).join(" · ")}</p>}
                    <p className={s.pieceLinks}>
                      {h.productLink && h.aktionen.includes("produkt") && (
                        <Link href={h.productLink.href} locale={h.productLink.locale}>
                          {t.aktionen.produkt}
                        </Link>
                      )}
                      {h.arLink && h.aktionen.includes("ar") && (
                        <Link href={h.arLink.href} locale={h.arLink.locale}>
                          {t.aktionen.ar}
                        </Link>
                      )}
                      {h.aktionen.includes("termin") && (
                        <Link href={`${beratungPath}?produkt=${encodeURIComponent(`${t.terminPrefix}: ${h.label}`)}`}>{t.aktionen.termin}</Link>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
