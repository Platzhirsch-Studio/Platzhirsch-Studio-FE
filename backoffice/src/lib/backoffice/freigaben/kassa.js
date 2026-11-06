// Freigabe-Arten – Bereich Kassa (Team B-KAS, G-15). Bewusst leer: Kassa-Freigaben laufen „am Ende“ im selben
// Dialog am Kiosk (Leitung tippt Kachel + PIN, Konzept §3.11) und werden sofort gebucht – es gibt keine
// wartenden Anträge für Glocke/Zentrale. Kommt später ein asynchroner Fall (z. B. Storno-Antrag aus der
// Verwaltung), wird er hier eingetragen und die Importzeile an P0-7/L0 gemeldet.

const arten = [];

export default arten;
