"""Frappe-Anbindung des Graph-Clients: Konfiguration aus site_config.json, Token-Cache in Redis.

site_config-Schlüssel (nur Namen im Repo, README Abschnitt „site_config“):
  ph_ms_tenant_id, ph_ms_client_id, ph_ms_client_secret  – App-Registrierung „Platzhirsch Graph (App-Only)“
  ph_ms_cert_pem, ph_ms_cert_thumbprint                    – alternativ Zertifikat (empfohlen)
"""

import frappe

from ph_microsoft.graph.client import GraphClient
from ph_microsoft.graph.token import GraphTokenFehler, TokenQuelle

# Zeiten in Graph-Antworten (Kalender) in Site-Zeit; Mail-Zeitstempel bleiben UTC (…Z).
PREFER_WIEN = {"Prefer": 'outlook.timezone="Europe/Vienna"'}
_CACHE_KEY = "ph_microsoft:graph_client"


class _RedisCache:
    def get(self, key):
        return frappe.cache().get_value(key)

    def set(self, key, wert, sekunden):
        frappe.cache().set_value(key, wert, expires_in_sec=int(sekunden))


def konfiguration():
    c = frappe.conf
    return {
        "tenant_id": c.get("ph_ms_tenant_id"),
        "client_id": c.get("ph_ms_client_id"),
        "client_secret": c.get("ph_ms_client_secret"),
        "cert_pem": c.get("ph_ms_cert_pem"),
        "cert_thumbprint": c.get("ph_ms_cert_thumbprint"),
    }


def ist_konfiguriert():
    k = konfiguration()
    return bool(k["tenant_id"] and k["client_id"] and (k["client_secret"] or (k["cert_pem"] and k["cert_thumbprint"])))


def token_quelle():
    return TokenQuelle(cache=_RedisCache(), **konfiguration())


def graph_token(erzwingen=False):
    """App-Only-Access-Token (str) für andere Apps (ph_ablage: OneDrive/SharePoint). Nie protokollieren."""
    return token_quelle().token(erzwingen=erzwingen)


def graph_client():
    """GraphClient je Request (frappe.local) – Tests ersetzen ihn über frappe.flags.ph_ms_graph_client."""
    attrappe = getattr(frappe.flags, "ph_ms_graph_client", None)
    if attrappe is not None:
        return attrappe
    vorhanden = getattr(frappe.local, "ph_ms_graph_client", None)
    if vorhanden is None:
        vorhanden = GraphClient(token_quelle())
        frappe.local.ph_ms_graph_client = vorhanden
    return vorhanden


__all__ = ["GraphTokenFehler", "graph_client", "graph_token", "ist_konfiguriert", "PREFER_WIEN"]
