"use client";
// Navetta-„Kinosaal“: Die Fotos der Filmleiste liegen seitlich außerhalb des
// sichtbaren Ausschnitts (overflow hidden, Dolly per transform). Natives
// Lazy-Loading lädt solche abgeschnittenen Bilder erst, wenn sie hereingleiten –
// dann zieht ein leerer Rahmen durchs Bild. Sobald das Kapitel näher als einen
// Bildschirm ist, schalten wir die Bilder auf „eager“ (nur Tablet/Desktop, wo die
// Leiste sichtbar ist; auf Phones ist sie display:none und wird nie beobachtet).
import { useEffect } from "react";

export default function NavettaFilmVorlader({ selector = "[data-navetta-film]" }) {
  useEffect(() => {
    const film = document.querySelector(selector);
    if (!film || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        film.querySelectorAll('img[loading="lazy"]').forEach((img) => {
          img.loading = "eager";
        });
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(film);
    return () => io.disconnect();
  }, [selector]);
  return null;
}
