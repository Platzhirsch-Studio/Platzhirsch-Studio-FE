"""Import des statischen Herstellerkatalogs (JSON aus tools/export_katalog.mjs) mit Trockenlauf."""

import json
import os

import frappe
from frappe.utils import now_datetime

from ph_sortiment.logik.katalog import kategorie_doc, kategorien_aus_katalog, marke_doc, produkt_doc

GESCHUETZT = ("minotti",)  # nie anfassen (Arbeitsregel)
UEBERSPRINGBARE_FELDER = ("doctype", "import_quelle")


def _lade(datei):
    if isinstance(datei, dict):
        return datei
    if not os.path.exists(datei):
        frappe.throw(f"Datei nicht gefunden: {datei}")
    with open(datei, encoding="utf-8") as fh:
        return json.load(fh)


def _unterschied(doc, neu):
    """Felder (ohne Kindtabellen), die sich ändern würden."""
    out = {}
    for k, v in neu.items():
        if k in UEBERSPRINGBARE_FELDER or isinstance(v, (list, dict)):
            continue
        alt = doc.get(k)
        if str(alt or "") != str(v or ""):
            out[k] = (alt, v)
    return out


def importieren(datei, trockenlauf=1, nur_marke=None, bilder_freigeben=0, basis_url=None):
    """Haupteinstieg (bench execute). Rückgabe: Protokoll-dict. trockenlauf=1 schreibt nichts."""
    trockenlauf = int(trockenlauf or 0)
    daten = _lade(datei)
    from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

    basis = basis_url or einstellungen()["website_basis_url"]
    protokoll = {"trockenlauf": trockenlauf, "marken_neu": [], "marken_aktualisiert": [], "kategorien_neu": [], "produkte_neu": [], "produkte_aktualisiert": [], "ausfuehrungen": 0, "uebersprungen": [], "fehler": []}
    frappe.flags.in_import = True
    try:
        marken_namen = {}
        for m in daten.get("marken") or []:
            if m["slug"] in GESCHUETZT or (nur_marke and m["slug"] != nur_marke):
                continue
            d = marke_doc(m, basis)
            d.pop("import_quelle", None)
            name = frappe.db.get_value("PH Marke", {"slug": m["slug"]}, "name") or (m["name"] if frappe.db.exists("PH Marke", m["name"]) else None)
            marken_namen[m["slug"]] = name or m["name"]
            if name:
                doc = frappe.get_doc("PH Marke", name)
                diff = _unterschied(doc, {k: v for k, v in d.items() if k not in ("haendlerstatus", "haendler_wortlaut", "status")})
                if diff:
                    protokoll["marken_aktualisiert"].append({"marke": name, "felder": list(diff)})
                    if not trockenlauf:
                        for k in diff:
                            doc.set(k, d[k])
                        doc.import_stand = now_datetime()
                        doc.save(ignore_permissions=True)
            else:
                protokoll["marken_neu"].append(m["name"])
                if not trockenlauf:
                    d["import_stand"] = now_datetime()
                    if d["haendlerstatus"] != "Keiner":
                        d["haendler_notiz"] = "Händlerstatus laut Website-Claim-Guard (src/lib/legal/claims.js, Inhaber-Bestätigung 31.10.2026) – Vertrag/Beleg nachreichen."
                    frappe.get_doc(d).insert(ignore_permissions=True)

        for key, info in kategorien_aus_katalog(daten).items():
            if frappe.db.exists("PH Kategorie", key):
                continue
            protokoll["kategorien_neu"].append(key)
            if not trockenlauf:
                welten = [w for w in info["welten"] if w]
                frappe.get_doc(kategorie_doc(key, None, sorted(b for b in info["bereiche"] if b), welten[0] if welten else None)).insert(ignore_permissions=True)

        for p in daten.get("produkte") or []:
            if p["marke"] in GESCHUETZT or (nur_marke and p["marke"] != nur_marke):
                continue
            try:
                marke_name = marken_namen.get(p["marke"]) or frappe.db.get_value("PH Marke", {"slug": p["marke"]}, "name")
                if not marke_name:
                    protokoll["uebersprungen"].append({"slug": p["slug"], "grund": f"Marke {p['marke']} fehlt"})
                    continue
                d, optionen = produkt_doc(p, marke_name, basis=basis)
                if bilder_freigeben:
                    for b in d["bilder"]:
                        b["freigabe"] = "erteilt"
                        b["freigabe_datum"] = frappe.utils.today()
                if frappe.db.exists("PH Produkt", d["slug"]):
                    doc = frappe.get_doc("PH Produkt", d["slug"])
                    diff = _unterschied(doc, {k: v for k, v in d.items() if k not in ("status", "typ")})
                    kinder = {k: len(v) for k, v in d.items() if isinstance(v, list) and len(v) != len(doc.get(k) or [])}
                    if diff or kinder:
                        protokoll["produkte_aktualisiert"].append({"slug": d["slug"], "felder": list(diff), "tabellen": kinder})
                        if not trockenlauf:
                            for k in diff:
                                doc.set(k, d[k])
                            for k in kinder:
                                if k == "bilder":
                                    # Freigaben bestehender Bilder behalten (Schlüssel: Bild-URL)
                                    alte = {b.bild: b for b in doc.bilder}
                                    for b in d["bilder"]:
                                        if b["bild"] in alte and alte[b["bild"]].freigabe == "erteilt":
                                            b.update({"freigabe": "erteilt", "freigabe_datum": alte[b["bild"]].freigabe_datum, "freigabe_beleg": alte[b["bild"]].freigabe_beleg})
                                if k == "preise":
                                    # Preise sind Historie: nur neue Stände anhängen
                                    vorhanden = {(str(z.stand), z.preisart, z.variante_name or "") for z in doc.preise}
                                    for z in d["preise"]:
                                        if (str(z["stand"]), z["preisart"], z.get("variante_name") or "") not in vorhanden:
                                            doc.append("preise", z)
                                    continue
                                doc.set(k, d[k])
                            doc.import_stand = now_datetime()
                            doc.import_quelle = "katalog"
                            doc.save(ignore_permissions=True)
                else:
                    protokoll["produkte_neu"].append(d["slug"])
                    if not trockenlauf:
                        zub, verw = d.pop("zubehoer"), d.pop("verwandt")
                        d["import_stand"] = now_datetime()
                        doc = frappe.get_doc(d).insert(ignore_permissions=True)
                        # Querverweise erst nach dem Anlegen aller Produkte (zweiter Durchlauf unten)
                        protokoll.setdefault("_nachtrag", []).append((doc.name, zub, verw))
                if not trockenlauf:
                    for o in optionen:
                        name = f"{o['produkt']}::{o['gruppe_key']}::{o['option_id']}"
                        if frappe.db.exists("PH Produkt Ausfuehrung", name):
                            continue
                        frappe.get_doc(o).insert(ignore_permissions=True)
                        protokoll["ausfuehrungen"] += 1
                else:
                    protokoll["ausfuehrungen"] += len(optionen)
            except Exception as e:  # noqa: BLE001 – ein Produkt darf den Lauf nicht abbrechen
                protokoll["fehler"].append({"slug": p.get("slug"), "fehler": str(e)[:300]})
                frappe.log_error(title=f"Katalog-Import {p.get('slug')}")

        for name, zub, verw in protokoll.pop("_nachtrag", []):
            try:
                doc = frappe.get_doc("PH Produkt", name)
                doc.set("zubehoer", [z for z in zub if frappe.db.exists("PH Produkt", z["produkt"])])
                doc.set("verwandt", [v for v in verw if frappe.db.exists("PH Produkt", v["produkt"])])
                doc.save(ignore_permissions=True)
            except Exception as e:  # noqa: BLE001
                protokoll["fehler"].append({"slug": name, "fehler": f"Querverweise: {str(e)[:200]}"})

        if trockenlauf:
            frappe.db.rollback()
        else:
            frappe.db.commit()
            from ph_sortiment.ph_sortiment.tasks import zaehler_aktualisieren

            zaehler_aktualisieren()
    finally:
        frappe.flags.in_import = False
    protokoll["zusammenfassung"] = {k: (len(v) if isinstance(v, list) else v) for k, v in protokoll.items() if k != "zusammenfassung"}
    return protokoll


@frappe.whitelist()
def importieren_aus_anhang(file_url, trockenlauf=1, nur_marke=None):
    """Desk-Variante (Backoffice-Admin/Leitung): Datei aus dem Dateimanager importieren."""
    if not ({"System Manager", "PH Backoffice-Admin", "PH Sortiment Leitung"} & set(frappe.get_roles())):
        frappe.throw("Nur Leitung/Admin.")
    inhalt = frappe.get_doc("File", {"file_url": file_url}).get_content()
    if isinstance(inhalt, bytes):
        inhalt = inhalt.decode("utf-8")
    return importieren(json.loads(inhalt), trockenlauf=trockenlauf, nur_marke=nur_marke)
