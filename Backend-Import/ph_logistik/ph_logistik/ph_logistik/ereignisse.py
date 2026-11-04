"""doc_events-Handler für DocTypes anderer Apps (hooks.doc_events). Nie Fehler werfen."""

import frappe


def wareneingang_aktualisiert(doc, method=None):
    """PH Wareneingang (ph_sortiment, Felder geprüft 04.11.: status Offen|Teilweise|Vollstaendig|Reklamiert; Position produkt,
    menge_erhalten, zustand ok|Transportschaden|beschaedigt|falsch|fehlt) → Wareneingangsbewegungen je Position (idempotent über Schlüssel).
    Lagerort: Custom Field ph_logistik_lagerort der Position, sonst Standard-Lagerort."""
    try:
        if doc.get("status") not in ("Teilweise", "Vollstaendig"):
            return
        from ph_logistik.ph_logistik.bestand import buche
        from ph_logistik.ph_logistik.doctype.ph_lagerort.ph_lagerort import standard_lagerort

        std = standard_lagerort()
        for p in doc.get("positionen") or []:
            menge = int(p.get("menge_erhalten") or 0)
            produkt = p.get("produkt")
            if menge <= 0 or not produkt or p.get("zustand") in ("falsch", "fehlt"):
                continue
            lo = p.get("ph_logistik_lagerort") or std
            if not lo:
                continue
            buche("Wareneingang", produkt, menge, lagerort_nach=lo, bezug_doctype="PH Wareneingang", bezug=doc.name, idempotency_key=f"we:{doc.name}:{p.name}:{menge}", grund=f"Wareneingang {doc.name}", quelle="backoffice")
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Wareneingang buchen")


def retoure_aktualisiert(doc, method=None):
    """PH Retoure (ph_shop) Status Geprueft → Positionen mit wiedereinlagern=1 als Retoure-Bewegung ins Standardlager."""
    try:
        if doc.get("status") != "Geprueft":
            return
        from ph_logistik.ph_logistik.bestand import buche
        from ph_logistik.ph_logistik.doctype.ph_lagerort.ph_lagerort import standard_lagerort

        lo = standard_lagerort()
        if not lo:
            return
        # PH Retoure Position (ph_shop, geprüft 04.11.): slug, bezeichnung, menge, zustand (neu|geoeffnet|beschaedigt), wiedereinlagern
        for p in doc.get("positionen") or []:
            if not p.get("wiedereinlagern") or not p.get("slug"):
                continue
            produkt = frappe.db.get_value("PH Produkt", {"slug": p.get("slug")}, "name") if frappe.db.exists("DocType", "PH Produkt") else None
            if not produkt:
                continue
            buche("Retoure", produkt, int(p.get("menge") or 1), lagerort_nach=lo, bezug_doctype="PH Retoure", bezug=doc.name, idempotency_key=f"ret:{doc.name}:{p.name}", grund=f"Retoure {doc.name} ({p.get('zustand') or ''})", zustand="B-Ware" if p.get("zustand") in ("geoeffnet", "beschaedigt") else "Neu")
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Retoure einlagern")
