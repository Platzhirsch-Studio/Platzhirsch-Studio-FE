"""doc_events-Handler und Website-Aktualisierung (Revalidate) von ph_sortiment.

Website: POST <ph_website_revalidate_url>/revalidate/<pfad> mit Header X-Revalidate-Secret
(src/app/revalidate/{produkte,marken}/route.js) – gesendet ausschließlich über den Core-Helfer
ph_core.utils.website.revalidate (eigene Drossel + enqueue dort). Interne Tags (products, marken,
kategorien, collections) werden auf die Website-Pfade produkte/marken abgebildet.
"""

import time

import frappe

TAGS = ("products", "marken", "kategorien", "collections")
# internes Tag → Website-Pfad (ph_core.utils.website.PFADE): Kategorien/Kollektionen liegen unter /produkte
TAG_PFAD = {"products": "produkte", "marken": "marken", "kategorien": "produkte", "collections": "produkte"}


def website_aktualisieren(tag, sofort=False):
    """Revalidate für ein Tag anstoßen (gedrosselt). Rückgabe: 'enqueued' | 'gedrosselt' | 'aus' | 'nicht konfiguriert'."""
    from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

    if tag not in TAGS:
        return "aus"
    einst = einstellungen()
    api_cache_leeren()
    if not einst["website_revalidate_aktiv"] or frappe.flags.in_install or frappe.flags.in_migrate or frappe.flags.in_import or frappe.flags.in_test:
        return "aus"
    if not frappe.conf.get("ph_website_revalidate_url"):
        return "nicht konfiguriert"
    schluessel = f"ph_sortiment:revalidate:{tag}"
    cache = frappe.cache()
    if not sofort and cache.get_value(schluessel):
        return "gedrosselt"
    cache.set_value(schluessel, int(time.time()), expires_in_sec=int(einst["revalidate_drossel_sekunden"] or 60))
    frappe.enqueue("ph_sortiment.ph_sortiment.ereignisse.revalidate_senden", queue="short", tag=tag, enqueue_after_commit=True)
    return "enqueued"


def revalidate_senden(tag):
    """Hintergrund-Job: Website-Pfad über den Core-Helfer erneuern (Header/Drossel/Protokoll liegen in ph_core)."""
    try:
        from ph_core.utils.website import revalidate

        return revalidate(TAG_PFAD.get(tag, tag), grund=f"ph_sortiment {tag}")
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_sortiment revalidate {tag} fehlgeschlagen")


def api_cache_leeren():
    """Katalog-Cache der Website-API (api/__init__.py) verwerfen und Version hochzählen (ETag)."""
    try:
        cache = frappe.cache()
        cache.delete_keys("ph_sortiment:api:")
        cache.set_value("ph_sortiment:api:version", frappe.utils.now_datetime().strftime("%Y%m%d%H%M%S"))
    except Exception:  # noqa: BLE001
        pass


# ── doc_events fremder DocTypes ────────────────────────────────────────────

def anfrage_produkt_verknuepfen(doc, method=None):
    """PH Anfrage (ph_crm) gespeichert: Merklisten-Slugs mit PH Produkt verknüpfen (PLAN.md Zeile 3)."""
    try:
        geaendert = False
        for p in doc.get("produkte") or []:
            # Link-Feld ist das Custom Field ph_sortiment_produkt (fixtures/custom_field.json); produkt_slug bleibt Data (ph_crm)
            if not p.get("ph_sortiment_produkt") and p.produkt_slug and frappe.db.exists("PH Produkt", p.produkt_slug):
                p.ph_sortiment_produkt = p.produkt_slug
                frappe.db.set_value("PH Anfrage Produkt", p.name, "ph_sortiment_produkt", p.produkt_slug, update_modified=False)
                geaendert = True
                if not p.marke:
                    frappe.db.set_value("PH Anfrage Produkt", p.name, "marke", frappe.db.get_value("PH Produkt", p.produkt_slug, "marke"), update_modified=False)
        return geaendert
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_sortiment: Anfrage-Produkt-Verknüpfung fehlgeschlagen")
