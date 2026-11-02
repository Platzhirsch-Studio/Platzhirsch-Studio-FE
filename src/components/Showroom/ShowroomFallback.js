"use client";
// ShowroomFallback – Rundgang ohne 3D: Video (AV1 + H.264) und Fotos der
// Stationen mit denselben Texten (Akzeptanz 5). Greift bei fehlendem WebGL2,
// bei Ladefehlern und bei „Als Video ansehen“. Kein Autoplay, preload "none"
// außer Metadaten: das Video lädt erst auf Klick (Datenmenge mobil).
import ShowroomPoster from "./ShowroomPoster";
import s from "./showroom.module.css";

export default function ShowroomFallback({ tour, t, reason, onBack }) {
  const v = tour.video;
  const fotos = tour.stations.filter((x) => x.foto);
  return (
    <div className={s.fallback}>
      {reason === "webgl" && <p className={s.fallbackNote} role="status">{t.keinWebgl}</p>}
      {reason === "fehler" && <p className={s.fallbackNote} role="status">{t.fehler}</p>}
      {v?.h264 || v?.av1 ? (
        <figure className={s.videoBox}>
          <video controls playsInline preload="none" poster={v.poster || tour.poster?.webp || undefined} width={v.width} height={v.height} aria-describedby="showroom-video-text">
            {v.av1 && <source src={v.av1} type='video/mp4; codecs="av01.0.08M.08"' />}
            {v.h264 && <source src={v.h264} type="video/mp4" />}
          </video>
          <figcaption id="showroom-video-text" className={s.videoText}>
            {t.videoText}
          </figcaption>
        </figure>
      ) : (
        <div className={s.videoBox}>
          <ShowroomPoster poster={tour.poster} alt={t.videoTitel} />
        </div>
      )}
      {fotos.length > 0 && (
        <section aria-labelledby="showroom-fotos" className={s.fotos}>
          <h3 id="showroom-fotos" className={s.fotosTitle}>{t.fotos}</h3>
          <ul>
            {fotos.map((x) => (
              <li key={x.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Stationsfoto aus public/showroom */}
                <img src={x.foto.src} alt={x.foto.alt} width={x.foto.width} height={x.foto.height} loading="lazy" />
                <p className={s.fotoTitle}>{x.titel}</p>
                <p className={s.fotoText}>{x.text}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {onBack && (
        <button type="button" className={s.videoBtnOnDark} onClick={onBack}>
          {t.zurueckZu3d}
        </button>
      )}
    </div>
  );
}
