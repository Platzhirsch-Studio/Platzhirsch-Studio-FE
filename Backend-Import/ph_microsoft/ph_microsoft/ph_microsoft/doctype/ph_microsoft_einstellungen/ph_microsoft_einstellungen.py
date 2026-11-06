"""PH Microsoft Einstellungen (Single). Geheimnisse liegen nur in site_config.json (ph_ms_*)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_microsoft.logik.gruppen import ist_geschuetzt
from ph_microsoft.logik.jwt_pruefung import ist_guid


class PHMicrosoftEinstellungen(Document):
    def validate(self):
        self.tenant_id = (self.tenant_id or "").strip().lower() or None
        self.backoffice_client_id = (self.backoffice_client_id or "").strip() or None
        if self.tenant_id and not ist_guid(self.tenant_id):
            frappe.throw(_("Tenant-ID muss eine GUID sein (Entra Admin Center → Übersicht → Mandanten-ID)."))
        if self.backoffice_client_id and not ist_guid(self.backoffice_client_id):
            frappe.throw(_("Client-ID muss eine GUID sein (App-Registrierung → Anwendungs-ID)."))
        if self.sso_aktiv and not (self.tenant_id and self.backoffice_client_id):
            frappe.throw(_("Für die Microsoft-Anmeldung sind Tenant-ID und Client-ID nötig."))
        gesehen = set()
        for z in self.gruppen_rollen or []:
            z.gruppe_id = (z.gruppe_id or "").strip().lower()
            if not ist_guid(z.gruppe_id):
                frappe.throw(_("Zeile {0}: Gruppen-ID muss die Objekt-ID (GUID) der Entra-Gruppe sein.").format(z.idx))
            if ist_geschuetzt(z.rolle):
                frappe.throw(_("Zeile {0}: Die Rolle {1} darf nicht über Gruppen vergeben werden.").format(z.idx, z.rolle))
            if (z.gruppe_id, z.rolle) in gesehen:
                frappe.throw(_("Zeile {0}: Zuordnung doppelt.").format(z.idx))
            gesehen.add((z.gruppe_id, z.rolle))
        url = (self.webhook_basis_url or "").strip().rstrip("/")
        if url and not url.startswith("https://"):
            frappe.throw(_("Die Webhook-Adresse muss mit https:// beginnen (Microsoft verlangt TLS)."))
        self.webhook_basis_url = url or None
        for feld, mindest in (("sso_rate_limit_pro_minute", 1), ("anhang_max_mb", 1), ("unzugeordnet_tage", 1), ("sync_tage_zukunft", 1), ("protokoll_aufbewahrung_tage", 7)):
            if self.get(feld) is not None and int(self.get(feld) or 0) < mindest:
                self.set(feld, mindest)
        if int(self.toleranz_sekunden or 0) > 600:
            self.toleranz_sekunden = 600

    def on_update(self):
        from ph_microsoft.ph_microsoft.einstellungen import cache_leeren

        cache_leeren()

    @frappe.whitelist()
    def verbindung_testen(self):
        """Holt ein App-Only-Token und liest (falls angelegt) das erste Postfach. Zeigt nie das Token."""
        self.check_permission("write")
        from ph_microsoft.graph.client import GraphFehler
        from ph_microsoft.graph.token import GraphTokenFehler
        from ph_microsoft.ph_microsoft.graph_dienst import graph_client, graph_token, ist_konfiguriert

        if not ist_konfiguriert():
            return {"ok": False, "meldung": _("site_config: ph_ms_tenant_id, ph_ms_client_id und Secret oder Zertifikat fehlen.")}
        try:
            graph_token(erzwingen=True)
            pf = frappe.db.get_value("PH Postfach", {"aktiv": 1}, "adresse")
            if pf:
                graph_client().get(f"/users/{pf}", params={"$select": "id,mail"})
            return {"ok": True, "meldung": _("Token erhalten") + (_(", Postfach {0} erreichbar").format(pf) if pf else "")}
        except GraphTokenFehler as e:
            return {"ok": False, "meldung": _("Token-Abruf fehlgeschlagen: {0}").format(e.code)}
        except GraphFehler as e:
            return {"ok": False, "meldung": _("Graph antwortet {0} ({1}) – Berechtigung/Application Access Policy prüfen.").format(e.status, e.code)}

    @frappe.whitelist()
    def abos_pruefen(self):
        self.check_permission("write")
        frappe.enqueue("ph_microsoft.ph_microsoft.abos.pruefen", queue="short", job_id="ph_ms_abos_pruefen", deduplicate=True)
        return {"ok": True}
