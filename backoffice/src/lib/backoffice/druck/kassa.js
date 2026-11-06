// Druck – Bereich Kassa (Team B-KAS, Konzept §8). Reines Datenmodul für das Druck-Register (P0-5c): welche
// Formate die Kassa je Objekt anbietet und welches der Kiosk standardmäßig nimmt. Die Formatnamen stammen
// unverändert aus den Print Formats von ph_kassa (Backend-Import/ph_kassa/…/fixtures, vom Druck-Register geprüft).
// Druckrouten /druck/kassenbeleg/[name] usw. (Konzept §2.1) baut das Fundament; bis dahin nutzt die Kassa das
// Druckpanel (DruckKnopf) und am Kiosk den Server-Druck (page.beleg_drucken).

const kassa = Object.freeze({
  "PH Kassenbeleg": { formate: ["PH Kassenbeleg Bon 80mm", "PH Kassenbeleg A4"], kiosk: "PH Kassenbeleg Bon 80mm", verwaltung: "PH Kassenbeleg A4" },
  "PH Kassenabschluss": { formate: ["PH Kassenabschluss Protokoll"], kiosk: "PH Kassenabschluss Protokoll", verwaltung: "PH Kassenabschluss Protokoll" },
});

export default kassa;
