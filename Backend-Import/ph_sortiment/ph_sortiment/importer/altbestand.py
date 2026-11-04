"""Migration aus dem alten Backoffice (App platzhirsch_studio) auf der Staging-Kopie (PLAN.md M2/M3).

Liest direkt per frappe.get_all die alten DocTypes (sie liegen auf der Staging-Site mit im Backup):
  Marken → PH Marke · Produkte Kategorie / Sub Kategorie → PH Kategorie · Produkte Farbe / Produkte
  Material → PH Merkmal · Produkte New (≈ 1.765) → PH Produkt (Status Entwurf; Bilder als File-Verweise,
  Freigabe offen – der Inhaber gibt je Marke frei).
Feldnamen der alten DocTypes aus dem Website-Code (src/lib/api/*.js, tools/wellness/export-frappe.mjs).
Unbekannte Felder werden tolerant übersprungen. Idempotent über sync_quelle. Minotti wird NICHT angefasst.
"""

import frappe
from frappe.utils import now_datetime, strip_html

from ph_sortiment.logik.slug import produkt_slug, slug as mk_slug

L = ("de", "en", "fr", "it")
SUFFIX = {"de": "", "en": "_en", "fr": "_fr", "it": "_it"}
GESCHUETZT = ("minotti",)


def _alt(doctype, fields=None, filters=None):
    if not frappe.db.exists("DocType", doctype):
        return []
    meta = frappe.get_meta(doctype)
    vorhanden = {f.fieldname for f in meta.fields} | {"name", "modified", "creation"}
    felder = [f for f in (fields or ["*"]) if f == "*" or f in vorhanden]
    return frappe.get_all(doctype, fields=felder or ["name"], filters=filters or {}, limit=100000)


def _kind(doctype, parent, parenttype, fields):
    if not frappe.db.exists("DocType", doctype):
        return []
    return frappe.get_all(doctype, filters={"parent": parent, "parenttype": parenttype}, fields=fields, order_by="idx asc")


def importieren(trockenlauf=1, nur_marke=None, limit=0):
    trockenlauf = int(trockenlauf or 0)
    protokoll = {"trockenlauf": trockenlauf, "marken": 0, "kategorien": 0, "merkmale": 0, "produkte": 0, "uebersprungen": [], "fehler": []}
    frappe.flags.in_import = True
    try:
        # Marken
        marken_map = {}
        for m in _alt("Marken", ["name", "name1", "logo", "status", "produkte", "produkte_en", "produkte_fr", "produkte_it", "bild_anhagen", "es_gibt_produkte", "grundungsjahr", "herkunftsland", "website", "beschreibung", "beschreibung_en", "beschreibung_fr", "beschreibung_it", "story", "story_en", "story_fr", "story_it"]):
            name1 = (m.get("name1") or m.name).strip()
            s = mk_slug(name1)
            if s in GESCHUETZT:
                marken_map[m.name] = frappe.db.get_value("PH Marke", {"slug": s}, "name") or name1
                continue
            if nur_marke and s != nur_marke:
                continue
            ziel = frappe.db.get_value("PH Marke", {"sync_quelle": m.name}, "name") or frappe.db.get_value("PH Marke", {"slug": s}, "name")
            d = {
                "doctype": "PH Marke", "marke": name1, "slug": s, "status": "Aktiv" if m.get("status") == "Aktiv" else "Pausiert",
                "logo": m.get("logo"), "bild_anhagen": m.get("bild_anhagen"), "gruendungsjahr": _int(m.get("grundungsjahr")), "land": m.get("herkunftsland"), "website": m.get("website"),
                "sync_quelle": m.name, "import_stand": now_datetime(), "welt": "Wohnen",
            }
            for loc in L:
                d[f"produkte_text_{loc}"] = m.get(f"produkte{SUFFIX[loc]}") or ""
                d[f"kurz_{loc}"] = strip_html(m.get(f"beschreibung{SUFFIX[loc]}") or "")[:1000]
                d[f"story_{loc}"] = m.get(f"story{SUFFIX[loc]}") or ""
            protokoll["marken"] += 1
            if not trockenlauf:
                if ziel:
                    doc = frappe.get_doc("PH Marke", ziel)
                    for k, v in d.items():
                        if k not in ("doctype", "status", "marke") and v not in (None, ""):
                            doc.set(k, v)
                    doc.flags.ignore_validate = False
                    doc.save(ignore_permissions=True)
                else:
                    doc = frappe.get_doc(d).insert(ignore_permissions=True)
                marken_map[m.name] = doc.name
            else:
                marken_map[m.name] = ziel or name1

        # Kategorien und Subkategorien
        kat_map = {}
        for k in _alt("Produkte Kategorie", ["name", "category_key", "image", "name_de", "name_en", "name_fr", "name_it", "alt_text_de", "alt_text_en", "alt_text_fr", "alt_text_it"]):
            key = mk_slug(k.get("category_key") or k.name)
            kat_map[k.name] = key
            kat_map[k.get("category_key") or ""] = key
            protokoll["kategorien"] += 1
            if trockenlauf or frappe.db.exists("PH Kategorie", key):
                continue
            d = {"doctype": "PH Kategorie", "key": key, "label_de": k.get("name_de") or k.name, "bild": k.get("image"), "welt": "Wohnen", "sync_quelle": k.name}
            for loc in L:
                d[f"label_{loc}"] = k.get(f"name_{loc}") or d["label_de"]
                d[f"alt_{loc}"] = k.get(f"alt_text_{loc}") or ""
            frappe.get_doc(d).insert(ignore_permissions=True)
        for k in _alt("Sub Kategorie", ["name", "category_key", "kategorie", "name_de", "name_en", "name_fr", "name_it"]):
            key = mk_slug(k.get("category_key") or k.name)
            protokoll["kategorien"] += 1
            if trockenlauf or frappe.db.exists("PH Kategorie", key):
                continue
            d = {"doctype": "PH Kategorie", "key": key, "label_de": k.get("name_de") or k.name, "uebergeordnet": kat_map.get(k.get("kategorie")), "welt": "Wohnen", "sync_quelle": k.name}
            for loc in L:
                d[f"label_{loc}"] = k.get(f"name_{loc}") or d["label_de"]
            frappe.get_doc(d).insert(ignore_permissions=True)

        # Merkmale
        for alt_dt, gruppe, keyfeld in (("Produkte Farbe", "Farbe", "color_key"), ("Produkte Material", "Material", "material_key")):
            for r in _alt(alt_dt, ["name", keyfeld, "name_de", "name_en", "name_fr", "name_it", "hex_code", "image"]):
                protokoll["merkmale"] += 1
                merkmal = (r.get("name_de") or r.name).strip()
                if trockenlauf or frappe.db.exists("PH Merkmal", merkmal) or frappe.db.exists("PH Merkmal", {"sync_quelle": r.name}):
                    continue
                d = {"doctype": "PH Merkmal", "merkmal": merkmal, "gruppe": gruppe, "key": mk_slug(r.get(keyfeld) or merkmal), "farbe_hex": r.get("hex_code"), "bild": r.get("image"), "sync_quelle": r.name}
                for loc in L:
                    d[f"label_{loc}"] = r.get(f"name_{loc}") or merkmal
                frappe.get_doc(d).insert(ignore_permissions=True)

        # Produkte New
        produkte = _alt("Produkte New", ["name", "produkt_name", "marken", "kategories", "sub_kategorie", "status", "collection", "designer", "path_field", "url_slug", "modified"] + [f"beschreibung{SUFFIX[l]}" for l in L] + [f"mehr_beschreibung{SUFFIX[l]}" for l in L] + [f"metadata_title_{l}" for l in L] + [f"metadata_description_{l}" for l in L])
        if limit:
            produkte = produkte[: int(limit)]
        for p in produkte:
            try:
                marke = marken_map.get(p.get("marken")) or p.get("marken")
                if not marke or mk_slug(marke) in GESCHUETZT:
                    protokoll["uebersprungen"].append({"alt": p.name, "grund": "Marke geschützt oder fehlt"})
                    continue
                if nur_marke and mk_slug(marke) != nur_marke:
                    continue
                kategorie = kat_map.get(p.get("kategories")) or mk_slug(p.get("kategories") or "")
                slug = mk_slug(p.get("path_field") or p.get("url_slug") or "") or produkt_slug(mk_slug(marke), p.get("produkt_name") or p.name)
                protokoll["produkte"] += 1
                if trockenlauf:
                    continue
                if not frappe.db.exists("PH Kategorie", kategorie):
                    frappe.get_doc({"doctype": "PH Kategorie", "key": kategorie or "sonstiges", "label_de": p.get("kategories") or "Sonstiges", "welt": "Wohnen", "sync_quelle": p.get("kategories")}).insert(ignore_permissions=True)
                    kategorie = kategorie or "sonstiges"
                d = {
                    "doctype": "PH Produkt", "slug": slug, "name_herstellerbezeichnung": p.get("produkt_name") or p.name, "marke": marke, "kategorie": kategorie,
                    "collection": p.get("collection"), "designer": p.get("designer"), "status": "Entwurf", "typ": "Katalog", "welt": "Wohnen",
                    "sync_quelle": p.name, "import_quelle": "platzhirsch_studio", "import_stand": now_datetime(), "website_sichtbar": 1,
                }
                for loc in L:
                    d[f"kurz_{loc}"] = strip_html(p.get(f"beschreibung{SUFFIX[loc]}") or "")[:1000]
                    d[f"beschreibung_{loc}"] = p.get(f"mehr_beschreibung{SUFFIX[loc]}") or ""
                    d[f"seo_title_{loc}"] = p.get(f"metadata_title_{loc}") or ""
                    d[f"seo_description_{loc}"] = p.get(f"metadata_description_{loc}") or ""
                d["bilder"] = [{"bild": b.get("bild_anhangen"), "typ": "freisteller", "freigabe": "offen", "reihenfolge": i, "quelle_url": "", "alt_de": d["name_herstellerbezeichnung"]} for i, b in enumerate(_kind("Bild Anhangen", p.name, "Produkte New", ["bild_anhangen"]) or _kind("Produkte New Bild", p.name, "Produkte New", ["bild_anhangen"])) if b.get("bild_anhangen")]
                d["dokumente"] = [{"datei": x.get("pdf") or x.get("pdf_produkte"), "art": "Datenblatt"} for x in (_kind("PDF Produkte", p.name, "Produkte New", ["pdf"]) or []) if (x.get("pdf") or x.get("pdf_produkte"))]
                for z in _kind("Additional Information", p.name, "Produkte New", ["dimensions", "gewicht"]) or []:
                    masse = []
                    for teil in (z.get("dimensions") or "").split(","):
                        if ":" in teil:
                            k, w = teil.split(":", 1)
                            key = {"länge": "laenge", "breite": "breite", "höhe": "hoehe", "tiefe": "tiefe", "durchmesser": "durchmesser", "sitzhöhe": "sitzhoehe"}.get(k.strip().lower())
                            if key:
                                masse.append({"key": key, "wert": w.strip()})
                        elif teil.strip():
                            masse.append({"key": "abmessung", "wert": teil.strip()})
                    if z.get("gewicht"):
                        masse.append({"key": "gewicht", "wert": z["gewicht"]})
                    d["masse"] = masse
                if p.get("sub_kategorie") and frappe.db.exists("PH Kategorie", mk_slug(p["sub_kategorie"])):
                    d["kategorien_weitere"] = [{"kategorie": mk_slug(p["sub_kategorie"])}]
                ziel = frappe.db.get_value("PH Produkt", {"sync_quelle": p.name}, "name") or (slug if frappe.db.exists("PH Produkt", slug) else None)
                if ziel:
                    doc = frappe.get_doc("PH Produkt", ziel)
                    for k, v in d.items():
                        if k in ("doctype", "status", "slug") or v in (None, "", []):
                            continue
                        if k == "bilder" and doc.bilder:
                            continue  # Freigaben nicht überschreiben
                        doc.set(k, v)
                    doc.save(ignore_permissions=True)
                else:
                    frappe.get_doc(d).insert(ignore_permissions=True)
            except Exception as e:  # noqa: BLE001
                protokoll["fehler"].append({"alt": p.name, "fehler": str(e)[:300]})
                frappe.log_error(title=f"Altbestand-Import {p.name}")
        if trockenlauf:
            frappe.db.rollback()
        else:
            frappe.db.commit()
            from ph_sortiment.ph_sortiment.tasks import zaehler_aktualisieren

            zaehler_aktualisieren()
    finally:
        frappe.flags.in_import = False
    return protokoll


def _int(v):
    try:
        return int(str(v).strip()[:4]) if v else None
    except ValueError:
        return None
