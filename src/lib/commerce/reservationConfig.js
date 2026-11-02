// src/lib/commerce/reservationConfig.js
// Feste Werte der Reservierungsanfrage, OHNE zod (Browser-Bundle).
// Schema: reservation.js. Keine "@/..."-Importe.

export const RESERVATION_NOTE_MAX = 1500;

export const RESERVATION_WAYS = Object.freeze([
  Object.freeze({ id: "abholung", label: "Abholung im Showroom Lochau" }),
  Object.freeze({ id: "lieferung", label: "Lieferung (Kosten nach Aufwand)" }),
]);

export const reservationWayLabel = (id) => (id === "lieferung" ? "Lieferung" : id === "abholung" ? "Abholung im Showroom Lochau" : String(id ?? ""));
