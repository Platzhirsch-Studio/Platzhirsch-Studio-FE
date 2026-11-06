// Fähigkeiten des Bereichs Ablage (G-04, Konzept §9). Fehlt eine Backend-Methode, zeigt die Oberfläche den
// Ersatzweg statt eines Knopfs, der mit Fehler endet (Q-A7). Laufzeit-Schalter (Office-Vorschau, Portal,
// Direkt-Upload, Passwortpflicht) kommen aus `einstellungen_info` und sind keine Fähigkeiten.
// Mock-Schalter: BACKOFFICE_MOCK_FAEHIGKEITEN bzw. Cookie ph_bo_faehigkeiten („alle“, „keine“, „ablage.*“).

import { definiereFaehigkeiten } from "../faehigkeiten.js";

export const ABLAGE = definiereFaehigkeiten("ablage", {
  zip_download: {
    titel: "Mehrere Dateien als ZIP laden",
    probe: { methode: "ph_ablage.api.zip_herunterladen" },
    ersatz: { titel: "Dateien einzeln herunterladen", href: "/ablage" },
    grund: "Noch nicht verfügbar",
  },
  link_mailen: {
    titel: "Freigabelink per E-Mail aus der Ablage senden",
    probe: { methode: "ph_ablage.api.freigabelink_senden" },
    ersatz: { titel: "Link kopieren und im eigenen Postfach senden", href: "/ablage/freigaben" },
    grund: "Noch nicht verfügbar",
  },
  ordner_freigabe: {
    titel: "Ganzen Ordner per Link teilen",
    probe: { methode: "ph_ablage.api.ordner_freigabelink_erstellen" },
    erwartet: false,
  },
  speicherbelegung: {
    titel: "Bericht Speicherbelegung",
    probe: { methode: "ph_ablage.api.einstellungen_info" },
    recht: { bereich: "ablage", aktion: "export" },
  },
});
