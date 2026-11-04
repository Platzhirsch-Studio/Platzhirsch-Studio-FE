"""Erstinstallation von ph_sortiment: Einstellungen und Website-Kategorien (src/lib/katalog/schema.js KATEGORIEN), idempotent."""

import frappe

from ph_sortiment.logik.katalog import kategorie_doc

# Spiegel von schema.js KATEGORIEN (Slug → Bereiche) mit deutschen Labels (src/messages/de.json katalog.kategorie).
KATEGORIEN = {
    "sauna": (["wellness", "objekt"], "Sauna"), "dampfbad": (["wellness", "objekt"], "Dampfbad"), "dampfbad-technik": (["wellness", "objekt"], "Dampfbad-Technik"),
    "dampfbad-sitz": (["wellness", "objekt", "bad"], "Dampfbad-Sitz"), "infrarot": (["wellness", "objekt"], "Infrarot"), "waermeliege": (["wellness", "objekt"], "Wärmeliege"),
    "ruheliege": (["wellness", "objekt"], "Ruheliege"), "hammam": (["wellness", "objekt"], "Hammam"), "erlebnisdusche": (["wellness", "objekt", "bad"], "Erlebnisdusche"),
    "whirlpool": (["wellness", "objekt"], "Whirlpool"), "swimspa": (["wellness", "objekt"], "Swim Spa"), "cold-plunge": (["wellness", "objekt"], "Cold Plunge"),
    "floating": (["wellness", "objekt"], "Floating"), "spa-kabine": (["wellness", "objekt"], "Spa-Kabine"), "salzvernebler": (["wellness", "objekt"], "Salzvernebler"),
    "zubehoer": (["wellness", "objekt", "bad"], "Zubehör"), "therapieliege": (["objekt"], "Therapieliege"), "behandlungsraum": (["objekt"], "Behandlungsraum"),
    "waschtisch": (["bad"], "Waschtisch"), "waschtischplatte": (["bad"], "Waschtischplatte"), "badewanne": (["bad"], "Badewanne"), "armatur": (["bad", "kueche"], "Armatur"),
    "dusche": (["bad", "objekt"], "Dusche"), "spiegel": (["bad"], "Spiegel"), "badmoebel": (["bad"], "Badmöbel"), "leuchte": (["bad", "wellness", "objekt", "kueche"], "Leuchte"),
    "wc": (["bad"], "WC"), "accessoire": (["bad"], "Bad-Accessoire"), "handtuchwaermer": (["bad"], "Handtuchwärmer"),
    "backofen": (["kueche"], "Backofen"), "dampfgarer": (["kueche"], "Dampfgarer"), "kompaktgeraet": (["kueche"], "Kompaktgerät"), "mikrowelle": (["kueche"], "Mikrowelle"),
    "kochfeld": (["kueche"], "Kochfeld"), "kochfeld-mit-abzug": (["kueche"], "Kochfeld mit Abzug"), "dunstabzug": (["kueche"], "Dunstabzug"), "kuehlen": (["kueche"], "Kühlen"),
    "gefrieren": (["kueche"], "Gefrieren"), "weinklima": (["kueche"], "Weinklima"), "geschirrspueler": (["kueche"], "Geschirrspüler"), "waermeschublade": (["kueche"], "Wärmeschublade"),
    "vakuumierschublade": (["kueche"], "Vakuumierschublade"), "kaffeevollautomat": (["kueche"], "Kaffeevollautomat"), "armatur-kochendwasser": (["kueche"], "Kochendwasser-Armatur"),
    "spuele": (["kueche"], "Spüle"), "kuechenzubehoer": (["kueche"], "Küchenzubehör"),
    "duftkerze": (["accessoires"], "Duftkerze"), "raumduft": (["accessoires"], "Raumduft"), "diffuser": (["accessoires"], "Diffuser"), "wohnaccessoire": (["accessoires"], "Wohnaccessoire"),
    "geschenkset": (["accessoires"], "Geschenkset"), "glas": (["accessoires"], "Glas"), "karaffe": (["accessoires"], "Karaffe"), "bar-zubehoer": (["accessoires"], "Bar-Zubehör"),
    "bildband": (["accessoires"], "Bildband"), "vase": (["accessoires"], "Vase"), "geschirr": (["accessoires"], "Geschirr"), "tragbare-leuchte": (["accessoires"], "Tragbare Leuchte"),
    "parfum": (["accessoires"], "Parfum"),
}
WELT_VON_BEREICH = {"kueche": "Kueche", "accessoires": "Accessoires"}


def after_install():
    einstellungen_anlegen()
    kategorien_anlegen()
    frappe.db.commit()


def einstellungen_anlegen():
    doc = frappe.get_single("PH Sortiment Einstellungen")
    if not doc.standard_lieferzeit_text_de:
        # Entwurf wie src/lib/shop/lieferzeit.js – Kanzlei gibt Wortlaut frei.
        doc.standard_lieferzeit_text_de = "Lieferzeit auf Anfrage"
        doc.standard_lieferzeit_text_en = "Delivery time on request"
        doc.standard_lieferzeit_text_fr = "Délai de livraison sur demande"
        doc.standard_lieferzeit_text_it = "Tempi di consegna su richiesta"
    doc.save(ignore_permissions=True)


def kategorien_anlegen():
    for i, (key, (bereiche, label)) in enumerate(KATEGORIEN.items()):
        if frappe.db.exists("PH Kategorie", key):
            continue
        welt = WELT_VON_BEREICH.get(bereiche[0], "Bad-Wellness")
        d = kategorie_doc(key, label, bereiche, welt)
        d["sortierung"] = i
        frappe.get_doc(d).insert(ignore_permissions=True)
