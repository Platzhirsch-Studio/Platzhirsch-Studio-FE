# Sofaplaner: verbindliche Anforderungen des Inhabers

**Stand:** 27.10.2026 · gilt für Bau, QA und Abnahme des Minotti-Sofaplaners

## 1. Vollständiger Bauteil-Katalog
- **Alle** Minotti-Sofafamilien aus `src/lib/sofaplaner/minotti/*.json` sind im Planer wählbar, mit **allen** verfügbaren Elementen (Ecken, Anbau links/rechts, Mittelelemente, Chaise, Peninsula, Endelemente, Hocker, Rücken- und Armlehnenvarianten, Sockel/Füße, Bezugsarten, Kissen).
- Keine Familie und kein Element weglassen, weil es selten ist. Fehlt ein Maß, wird das Element trotzdem angezeigt, aber deutlich als „Maß im Showroom bestätigen“ markiert.

## 2. Einfach auswählbar für Kunden, keine Techniker-Oberfläche
- **Keine Schrauben, Beschläge, Verbinder oder internen Codes in der Hauptansicht.** Elementcodes nur in der Stückliste bzw. „Details für die Bestellung“.
- **Geführter Ablauf in wenigen Schritten:**
  1. **Modell wählen:** große Karten mit Name, Designer, Charakter in einem Satz, Filter (modular / feste Größe / Outdoor / Sofabett).
  2. **Form wählen:** Startvorschläge je Modell (gerade, Ecke links/rechts, U-Form, mit Chaise, mit Peninsula, Insel), damit niemand bei null beginnt.
  3. **Anpassen:** Elemente als bebilderte Kacheln mit Kurzbeschreibung und Maß („Ecke, 108 × 108 cm“), gruppiert nach Art. Nur passende Elemente werden angeboten; was nicht anschließbar ist, ist ausgegraut mit kurzer Begründung.
  4. **Ausführung:** Rücken, Armlehne, Sockel, Bezugsart (Stoff/Leder, fest/abnehmbar), Kissen, mit verständlichen Worten statt Fachbegriffen.
  5. **Im Raum prüfen:** Grundriss mit Maßen, Laufwege, 3D-Ansicht.
  6. **Zusammenfassung:** Bild, Gesamtmaße, Liste in Klartext, darunter aufklappbar die Bestell-Details mit Codes, „Im Showroom besprechen“.
- **„Einfach“ vs. „Experte“:** Standard ist der einfache Modus. Ein Schalter blendet für Berater und Architekten alle Elemente und Codes ein.
- Mobil vollständig per Touch bedienbar, Schritte als klare Abfolge, nie mehr als eine Hauptentscheidung pro Bildschirm.

## 3. Qualität
- Die QA prüft ausdrücklich: Findet ein Laie in unter 2 Minuten zu einem passenden Ecksofa seines Wunschmodells? Werden ungültige Kombinationen verständlich erklärt? Sind alle Familien wählbar?
