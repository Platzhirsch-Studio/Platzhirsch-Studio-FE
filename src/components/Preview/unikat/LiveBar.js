"use client";
// Prototyp „Unikat“ – LIVE-Leiste mit echten bzw. berechneten Werten.
//   Sonne:    sonnenTag() für Lochau (NOAA, src/lib/licht/sonne.js) – „berechnet“
//   Café:     CAFE_PROFILE.openingHours (src/lib/seo/siteSchema.js), vom Server übergeben
//   Showroom: OPENING_HOURS (src/lib/site.js), vom Server übergeben
// Uhrzeit immer Europe/Vienna. Keine freien Termine (Kalender nicht live),
// keine Wetter-/Auslastungswerte. Server-HTML zeigt die festen Zeiten (fallback),
// der Browser ersetzt sie durch den Stand von heute – gleiche Höhe, kein Sprung.
import { useEffect, useState } from "react";
import { sonnenTag } from "@/lib/licht/sonne";
import { ortNachId } from "@/lib/licht/zustand";

const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const EN_TAGE = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function wien(now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "long", hourCycle: "h23" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return { datum: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), tag: EN_TAGE.indexOf(p.weekday) };
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const uhr = (min) => {
  const m = Math.round(min);
  return m % 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}` : `${Math.floor(m / 60)}`;
};
const uhrLang = (min) => `${Math.floor(min / 60)}:${String(Math.round(min) % 60).padStart(2, "0")}`;

function showroomStatus(rows, tag, min) {
  const heute = rows.find((r) => !r.closed && (r.days.length === 2 ? tag >= r.days[0] && tag <= r.days[1] : r.days.includes(tag)));
  if (heute && min < toMin(heute.from)) return `Showroom öffnet heute um ${uhr(toMin(heute.from))} Uhr`;
  if (heute && min < toMin(heute.to)) return `Showroom heute offen bis ${uhr(toMin(heute.to))} Uhr`;
  for (let i = 1; i <= 7; i++) {
    const t = (tag + i) % 7;
    const r = rows.find((x) => !x.closed && (x.days.length === 2 ? t >= x.days[0] && t <= x.days[1] : x.days.includes(t)));
    if (r) return `Showroom wieder offen ${i === 1 ? "morgen" : TAGE[t]} ab ${uhr(toMin(r.from))} Uhr`;
  }
  return "Showroom nach Vereinbarung";
}

function cafeStatus(cafe, tag, min) {
  const offen = (t) => cafe.days.includes(EN_TAGE[t]);
  const von = toMin(cafe.opens);
  const bis = toMin(cafe.closes);
  if (offen(tag) && min < von) return `Café öffnet heute um ${uhr(von)} Uhr`;
  if (offen(tag) && min < bis) return `Café heute geöffnet bis ${uhr(bis)} Uhr`;
  if (!offen(tag)) return `Café heute Ruhetag`;
  for (let i = 1; i <= 7; i++) if (offen((tag + i) % 7)) return `Café wieder offen ${i === 1 ? "morgen" : TAGE[(tag + i) % 7]} ab ${uhr(von)} Uhr`;
  return "";
}

function sonne(datum, min) {
  const t = sonnenTag(ortNachId("lochau"), datum);
  if (t.untergang == null) return "";
  if (min < t.aufgang) return `Sonnenaufgang ${uhrLang(t.aufgang)}`;
  if (min < t.untergang) return `Sonnenuntergang ${uhrLang(t.untergang)}`;
  return `Sonne untergegangen um ${uhrLang(t.untergang)}`;
}

export default function LiveBar({ showroom, cafe, fallback }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const update = () => {
      const w = wien();
      try {
        setItems([
          { k: "sonne", text: sonne(w.datum, w.min), note: "berechnet" },
          { k: "cafe", text: cafeStatus(cafe, w.tag, w.min) },
          { k: "showroom", text: showroomStatus(showroom, w.tag, w.min) },
        ]);
      } catch {
        /* Rechnung fehlgeschlagen: feste Zeiten bleiben stehen */
      }
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [showroom, cafe]);

  const list = items || fallback;
  return (
    <ul className="u-live-list">
      {list.map((it) => (
        <li key={it.k} data-k={it.k}>
          {it.text}
          {it.note && <span className="u-live-note"> ({it.note})</span>}
        </li>
      ))}
    </ul>
  );
}
