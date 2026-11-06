"""PH Wunschliste – teilbare Wunschliste der Website (src/lib/wunschliste/model.js, Datensatz-Version 1).

Die Website schreibt den ganzen Datensatz (ph_shop.api.create_wishlist / update_wishlist); Regeln für
Reservieren, Beitrag, Teilen-Link drehen und Widerruf liegen dort. Hier: Titel, Zähler, Studio-Sperre,
Aufbewahrung (abgelaufene Listen löscht der Scheduler, config.js RETENTION_DEFAULT_MONTHS).
Gespeichert sind nur Hashes (share_hash, admin_hash, storno_hash); Klartext-Schlüssel kennt nur der Browser.
"""

from zoneinfo import ZoneInfo

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint, get_datetime, get_system_timezone, now_datetime

from ph_shop import wunschliste as wl


class PHWunschliste(Document):
    def before_insert(self):
        self.quelle = self.quelle or "website"
        self.erstellt_am = self.erstellt_am or now_datetime()
        self.status = self.status or "Aktiv"

    def validate(self):
        if self.anlass not in wl.OCCASIONS:
            frappe.throw(_("Unbekannter Anlass {0}.").format(self.anlass))
        for f in ("share_hash", "admin_hash"):
            if not wl.HASH_RE.match(str(self.get(f) or "")):
                frappe.throw(_("{0} muss ein SHA-256-Hash sein.").format(self.meta.get_label(f)))
        if not self.is_new() and self.has_value_changed("admin_hash"):
            frappe.throw(_("Der Verwaltungs-Hash einer Liste ist unveränderlich."))
        self.anzahl_stuecke = len(self.positionen or [])
        self.anzahl_reserviert = sum(1 for p in self.positionen or [] if cint(p.reserviert))
        self.beitraege_angefragt = sum(1 for b in self.beitraege or [] if b.status in ("angefragt", "offen"))
        self.beitraege_bezahlt_cent = sum(cint(b.bezahlt_cent or b.betrag_cent) for b in self.beitraege or [] if b.status == "bezahlt")
        self.titel = f"{self.ref or self.name or ''} · {self.listen_titel or ''}".strip(" ·")[:140]

    @frappe.whitelist()
    def sperren(self, grund=None):
        """Sperre durch das Studio (Missbrauchsmeldung an REPORT_EMAIL): Teilen-Link antwortet 404.
        Wieder aktivieren kann nur der Ersteller (Website „restore“ erzeugt dabei einen neuen Link)."""
        self.check_permission("write")
        if self.status == "Widerrufen":
            return self.status
        self.db_set("status", "Widerrufen")
        self.add_comment("Info", _("Vom Studio gesperrt: {0}").format(grund or "–"))
        return "Widerrufen"


def zeit_ein(iso):
    """ISO 8601 der Website → naive Datetime in Site-Zeitzone."""
    if not iso:
        return None
    dt = get_datetime(iso)
    if dt.tzinfo:
        dt = dt.astimezone(ZoneInfo(get_system_timezone())).replace(tzinfo=None)
    return dt


def zeit_aus(wert):
    """Datetime der Site → ISO 8601 mit Offset (Website rechnet mit new Date())."""
    if not wert:
        return None
    dt = get_datetime(wert)
    return (dt if dt.tzinfo else dt.replace(tzinfo=ZoneInfo(get_system_timezone()))).isoformat()


def als_record(doc, email_maskieren=True):
    return wl.werte_zu_record(doc.as_dict(), zeit_aus, email_maskieren=email_maskieren)


def abgelaufene_loeschen():
    """Scheduler (täglich): Listen nach laeuft_ab_am löschen – Aufbewahrung endet (Art. 5 Abs 1 lit e DSGVO).
    Beiträge mit ausgestelltem Gutschein bleiben über den Gutschein nachvollziehbar (PH Gutschein)."""
    for name in frappe.get_all("PH Wunschliste", {"laeuft_ab_am": ("<", now_datetime())}, pluck="name", limit=500):
        try:
            frappe.delete_doc("PH Wunschliste", name, ignore_permissions=True, force=True)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"PH Wunschliste {name}: Löschen nach Ablauf")
