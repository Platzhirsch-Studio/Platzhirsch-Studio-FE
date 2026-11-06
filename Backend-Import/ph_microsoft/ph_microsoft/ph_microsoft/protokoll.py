"""PH Sync Protokoll schreiben – nie mit Token, Mailinhalt, Betreff oder Anhangnamen (Datensparsamkeit)."""

import re
import time

import frappe
from frappe.utils import now_datetime

_TOKENARTIG = re.compile(r"(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+|Bearer\s+\S+|validationToken=\S+|client_secret=\S+)")


def bereinigt(text, laenge=300):
    return _TOKENARTIG.sub("[entfernt]", str(text or ""))[:laenge]


def eintrag(bereich, aktion, ergebnis="OK", meldung=None, referenz_doctype=None, referenz_name=None, postfach=None, kontakt=None, anzahl=None, benutzer=None, dauer_ms=None, commit=False):
    """→ Name des Eintrags oder None. Wirft nie."""
    try:
        doc = frappe.get_doc({
            "doctype": "PH Sync Protokoll",
            "zeitpunkt": now_datetime(),
            "bereich": bereich,
            "aktion": str(aktion or "")[:140],
            "ergebnis": ergebnis,
            "meldung": bereinigt(meldung) or None,
            "referenz_doctype": referenz_doctype if referenz_doctype and frappe.db.exists("DocType", referenz_doctype) else None,
            "referenz_name": referenz_name if referenz_doctype else None,
            "postfach": postfach,
            "kontakt": kontakt,
            "anzahl": anzahl,
            "benutzer": benutzer if benutzer and benutzer != "Guest" and frappe.db.exists("User", benutzer) else None,
            "dauer_ms": dauer_ms,
        })
        doc.insert(ignore_permissions=True)
        if commit:
            festschreiben()
        return doc.name
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Microsoft: Sync-Protokoll konnte nicht geschrieben werden")
        return None


def festschreiben():
    """frappe.db.commit() – nicht in Tests (FrappeTestCase rollt zurück)."""
    if not frappe.flags.in_test:
        frappe.db.commit()


class Messung:
    """with Messung() as m: … → m.ms"""

    def __enter__(self):
        self._t = time.monotonic()
        return self

    def __exit__(self, *a):
        self.ms = int((time.monotonic() - self._t) * 1000)
        return False
