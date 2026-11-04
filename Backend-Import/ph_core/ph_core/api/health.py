"""Verbindungstest für die Website: GET /api/method/ph_core.api.health.ping (nur mit API-Token)."""

import frappe

from ph_core.api import ph_api


@frappe.whitelist(allow_guest=False, methods=["GET"])
@ph_api(limit_pro_minute=30)
def ping():
    from ph_core import __version__

    return {"ok": True, "app": "ph_core", "version": __version__, "testmodus": frappe.get_cached_value("PH Einstellungen", None, "testmodus")}
