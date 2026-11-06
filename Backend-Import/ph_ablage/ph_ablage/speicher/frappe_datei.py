"""Adapter „frappe_datei“ (nur lesen): verlinkte Bestandsdateien (Frappe File an PH Kontakt/PH Projekt/…,
PH Projekt Dokument). Schlüssel = Name des File-Datensatzes. Die Ablage kopiert diese Dateien nicht und löscht
sie nie – Löschen in der Ablage entfernt nur die Verknüpfung. `speicher_umziehen` kann sie später in den
eingestellten Speicher übernehmen (dann echte Kopie mit neuem Schlüssel)."""

import io

from ph_ablage.speicher.basis import NichtGefunden, Speicher, SpeicherFehler


class FrappeDateiSpeicher(Speicher):
    name = "frappe_datei"
    nur_lesen = True

    def put(self, schluessel, stream, mime="application/octet-stream"):
        raise SpeicherFehler("frappe_datei ist nur lesend")

    def _file(self, schluessel):
        import frappe

        if not frappe.db.exists("File", schluessel):
            raise NichtGefunden(schluessel)
        return frappe.get_doc("File", schluessel)

    def get(self, schluessel):
        f = self._file(schluessel)
        inhalt = f.get_content()
        return io.BytesIO(inhalt if isinstance(inhalt, bytes) else str(inhalt).encode())

    def delete(self, schluessel):
        return None  # verlinkte Bestandsdatei bleibt unangetastet

    def exists(self, schluessel):
        import frappe

        return bool(frappe.db.exists("File", schluessel))

    def head(self, schluessel):
        import frappe

        groesse = frappe.db.get_value("File", schluessel, "file_size")
        return {"groesse": groesse} if groesse is not None else None

    def list(self, prefix=""):
        return []

    def pruefen(self):
        return {"ok": True, "meldung": "Frappe-Dateien (nur lesend)"}
