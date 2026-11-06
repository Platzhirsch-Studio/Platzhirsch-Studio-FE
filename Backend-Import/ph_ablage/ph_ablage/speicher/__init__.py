"""Speicher-Adapter der Ablage – austauschbar, für Mitarbeiter unsichtbar.

    from ph_ablage.speicher import speicher_fuer, ADAPTER, konfig_schluessel
    s = speicher_fuer("s3")            # liest frappe.conf; Fehler NichtKonfiguriert → API 503 unavailable
    s.put(schluessel, stream, mime)

Jede PH Datei Version merkt sich ihren Adapter (`speicher`) – ein Wechsel in PH Ablage Einstellungen gilt nur
für neue Uploads; alte Versionen bleiben lesbar, bis `speicher_umziehen` sie kopiert hat.
Kein Modul hier importiert Frappe auf oberster Ebene (Tests ohne Site).
"""

import os

from ph_ablage.speicher.basis import NichtGefunden, NichtKonfiguriert, Speicher, SpeicherFehler  # noqa: F401

ADAPTER = ("lokal", "s3", "google_drive", "onedrive")
NUR_LESEN = ("frappe_datei",)

# site_config-Schlüsselnamen (nur Namen; Werte nie in Dateien/DocTypes) – Register Backend-Import/README.md §3
KONFIG = {
    "lokal": (),
    "s3": ("ph_ablage_s3_endpoint", "ph_ablage_s3_region", "ph_ablage_s3_bucket", "ph_ablage_s3_key", "ph_ablage_s3_secret"),
    "google_drive": ("ph_ablage_gdrive_service_account", "ph_ablage_gdrive_root_id"),
    "onedrive": ("ph_ablage_ms_tenant", "ph_ablage_ms_client_id", "ph_ablage_ms_client_secret", "ph_ablage_ms_drive_id"),
    "frappe_datei": (),
}
OPTIONAL = {"s3": ("ph_ablage_s3_boto3",), "onedrive": ("ph_ablage_ms_root_path", "ph_ablage_ms_token_von_ph_microsoft"), "lokal": ("ph_ablage_lokal_pfad",)}
LOKAL_ORDNER = "ph_ablage"


def konfig_schluessel(name):
    return tuple(KONFIG.get(name, ())) + tuple(OPTIONAL.get(name, ()))


def konfig_status(name, conf):
    """{schluessel: True/False} – nur ob gesetzt, nie Werte."""
    return {k: bool((conf or {}).get(k)) for k in konfig_schluessel(name)}


def erzeugen(name, conf, basis_pfad=None, session=None):
    """Adapter aus einem Konfigurations-Dict (frappe.conf oder Test-Dict)."""
    conf = conf or {}
    if name == "lokal":
        pfad = conf.get("ph_ablage_lokal_pfad") or basis_pfad
        return _lokal(pfad)
    if name == "s3":
        from ph_ablage.speicher.s3 import S3Speicher

        boto = None
        if conf.get("ph_ablage_s3_boto3"):
            boto = _boto3_client(conf)
        return S3Speicher(conf.get("ph_ablage_s3_endpoint"), conf.get("ph_ablage_s3_region"), conf.get("ph_ablage_s3_bucket"), conf.get("ph_ablage_s3_key"), conf.get("ph_ablage_s3_secret"), session=session, boto3_client=boto)
    if name == "google_drive":
        from ph_ablage.speicher.google_drive import GoogleDriveSpeicher

        return GoogleDriveSpeicher(conf.get("ph_ablage_gdrive_service_account"), conf.get("ph_ablage_gdrive_root_id"), session=session)
    if name == "onedrive":
        from ph_ablage.speicher.onedrive import OneDriveSpeicher

        return OneDriveSpeicher(conf.get("ph_ablage_ms_tenant"), conf.get("ph_ablage_ms_client_id"), conf.get("ph_ablage_ms_client_secret"), conf.get("ph_ablage_ms_drive_id"), conf.get("ph_ablage_ms_root_path") or "ph-ablage", session=session, token_quelle=_ms_token_quelle(conf))
    if name == "frappe_datei":
        from ph_ablage.speicher.frappe_datei import FrappeDateiSpeicher

        return FrappeDateiSpeicher()
    raise NichtKonfiguriert(name or "?", ["unbekannter Adapter"])


def _ms_token_quelle(conf):
    """ph_ablage_ms_token_von_ph_microsoft = 1 und ph_microsoft installiert → dessen App-Only-Token (Redis-Cache)."""
    if not conf.get("ph_ablage_ms_token_von_ph_microsoft"):
        return None
    try:
        import frappe

        if "ph_microsoft" not in frappe.get_installed_apps():
            return None
        from ph_microsoft.graph import graph_token
    except Exception:  # noqa: BLE001 – ph_microsoft optional
        return None
    return graph_token


def _lokal(pfad):
    from ph_ablage.speicher.lokal import LokalSpeicher

    if not pfad:
        raise NichtKonfiguriert("lokal", ["Site-Pfad"])
    return LokalSpeicher(pfad)


def _boto3_client(conf):
    try:
        import boto3
    except Exception:  # noqa: BLE001 – optional
        return None
    return boto3.client("s3", endpoint_url=str(conf.get("ph_ablage_s3_endpoint")).replace("/{bucket}", ""), region_name=conf.get("ph_ablage_s3_region"), aws_access_key_id=conf.get("ph_ablage_s3_key"), aws_secret_access_key=conf.get("ph_ablage_s3_secret"))


_CACHE = {}


def speicher_fuer(name):
    """Adapter für die aktuelle Site (frappe.conf). Instanzen je Site und Prozess wiederverwendet (Token-Cache)."""
    import frappe

    site = getattr(frappe.local, "site", None) or "-"
    schluessel = (site, name)
    if schluessel in _CACHE:
        return _CACHE[schluessel]
    basis = os.path.join(frappe.get_site_path("private", "files"), LOKAL_ORDNER) if name == "lokal" else None
    adapter = erzeugen(name, frappe.conf, basis_pfad=basis)
    _CACHE[schluessel] = adapter
    return adapter


def cache_leeren():
    _CACHE.clear()
