"""Foto-Nachreichung der Website-Reklamation ohne Portal-Login – reine Logik ohne Frappe.

Methode: ph_service.api.add_service_photo(referenz, email, foto_base64, mime, dateiname).
Regeln (Koordinator 04.11.2026, 60-website-backend-umstellung.md Abschnitt 8):
  * Servicefall per Referenz + E-Mail; Vergleich über Hashes in konstanter Zeit, bei Nichtübereinstimmung
    dieselbe Antwort wie bei unbekannter Referenz (keine Auskunft).
  * Inhaltstyp am Dateikopf (utils/medien.py); `mime` des Browsers darf dem nicht widersprechen.
  * höchstens MAX_DATEIEN Dateien je Fall, nur innerhalb von FRIST_TAGE nach der Meldung.
"""

import hashlib
import hmac
from datetime import timedelta

from ph_service.utils.medien import BILD, PDF, VIDEO

MAX_DATEIEN = 10
FRIST_TAGE = 14
MIME_TYP = {"image": BILD, "video": VIDEO, "application/pdf": PDF}


def email_hash(email):
    return hashlib.sha256(str(email or "").strip().lower().encode()).hexdigest()


def email_passt(gespeichert, angegeben):
    """Konstanter Vergleich der sha256 der normalisierten Adressen; leere Werte passen nie."""
    if not str(gespeichert or "").strip() or not str(angegeben or "").strip():
        return False
    return hmac.compare_digest(email_hash(gespeichert), email_hash(angegeben))


def in_frist(gemeldet_am, jetzt, tage=FRIST_TAGE):
    """True, solange jetzt ≤ gemeldet_am + tage. Ohne Meldezeit: False."""
    return bool(gemeldet_am) and jetzt <= gemeldet_am + timedelta(days=tage)


def mime_passt(mime, medientyp):
    """Browser-MIME (optional) gegen den am Inhalt erkannten Medientyp. Leer = passt."""
    m = str(mime or "").strip().lower().split(";")[0]
    if not m:
        return True
    erwartet = MIME_TYP.get(m) or MIME_TYP.get(m.split("/")[0])
    return erwartet == medientyp


def platz_frei(vorhanden, grenze=MAX_DATEIEN):
    return int(vorhanden or 0) < int(grenze)
