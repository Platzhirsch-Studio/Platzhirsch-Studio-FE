"""Filterfelder der Produktkarte und Material/Farbe im Detail – reine Logik ohne Frappe.

Website: src/lib/shop/shopProducts.js liest `subCategoryKeys`, `colorKeys`, `materialKeys`,
`indoor_and_outdoor` aus der Karte (Filter in /produkte/[category], src/components/ShopCatalog/shopCatalog.js);
die Detailseite liest `additional_information[0].material/farbe` (Freitext). Bis hierher bildete der
Website-Adapter beides selbst (src/lib/backend/katalog.js mapPhProduktDetail, gleiche Regeln wie hier).
Lücke ph_sortiment 1/2 in Marktresearch/digital/backoffice/60-website-backend-umstellung.md.
"""

FARBE_GRUPPE = "Farbe"
MATERIAL_GRUPPEN = ("Material", "Oberflaeche", "Stoff", "Leder", "Holz")
INDOOR, OUTDOOR = "Indoor", "Outdoor"  # Werte wie im Altbestand (Produkte New.indoor_and_outdoor)


def indoor_outdoor(bereich=None, welt=None):
    """bereich „outdoor“ oder Welt „Outdoor“ → Outdoor, sonst Indoor."""
    return OUTDOOR if (str(bereich or "").lower() == "outdoor" or str(welt or "") == "Outdoor") else INDOOR


def _eindeutig(werte):
    gesehen, out = set(), []
    for w in werte:
        if w and w not in gesehen:
            gesehen.add(w)
            out.append(w)
    return out


def filterfelder(weitere_kategorien, merkmal_zeilen, sub_keys, merkmal_info, bereich=None, welt=None):
    """Kartenfelder für die Website-Filter.

    weitere_kategorien: Namen (= Keys) aus PH Produkt.kategorien_weitere
    merkmal_zeilen:     Zeilen aus PH Produkt.merkmale als dict {merkmal, gruppe}
    sub_keys:           Menge der sichtbaren Unterkategorien (PH Kategorie mit uebergeordnet, Aktiv, website_sichtbar)
    merkmal_info:       {PH Merkmal.name: {"key": …, "gruppe": …}} – nur aktive, sichtbare Merkmale
    → {subCategoryKeys, colorKeys, materialKeys, indoor_and_outdoor}; Keys wie color_key/material_key
      aus get_all_farben_api/get_all_materialien_api (key oder name).
    """
    farben, materialien = [], []
    for z in merkmal_zeilen or []:
        info = merkmal_info.get(z.get("merkmal") or "")
        if not info:
            continue
        gruppe = info.get("gruppe") or z.get("gruppe")
        key = info.get("key") or z.get("merkmal")
        if gruppe == FARBE_GRUPPE:
            farben.append(key)
        elif gruppe in MATERIAL_GRUPPEN:
            materialien.append(key)
    return {
        "subCategoryKeys": _eindeutig(k for k in (weitere_kategorien or []) if k in sub_keys),
        "colorKeys": _eindeutig(farben),
        "materialKeys": _eindeutig(materialien),
        "indoor_and_outdoor": indoor_outdoor(bereich, welt),
    }


def material_farbe_text(merkmale):
    """Freitext wie der alte Endpunkt: deutsche Merkmaltexte je Gruppe, eindeutig, mit „, “ verbunden.
    merkmale: [{de, gruppe}] (Detailform). → (material | None, farbe | None)"""
    def text(pred):
        werte = _eindeutig(str(m.get("de") or "").strip() for m in merkmale or [] if pred(m.get("gruppe")))
        return ", ".join(werte) or None

    return text(lambda g: g in MATERIAL_GRUPPEN), text(lambda g: g == FARBE_GRUPPE)


def wechselkurs_konfiguration(posten, oss_aktiv, kurs=None, kurs_datum=None):
    """PH Wechselkurs Einstellungen → Konfiguration im Schema der Website
    (src/components/Labs/Dreilaender/pricing.js configSchema; Website mischt mit DEFAULT_CONFIG).

    posten: [{posten, min_cent, max_cent, freigegeben, quelle}] mit posten ∈ POSTEN.
    Beträge kommen als Cent, die Website rechnet in ganzen Einheiten (EUR bzw. CHF).
    """
    cfg = {"version": 1, "ossActive": bool(oss_aktiv)}
    lieferung = {}
    for p in posten or []:
        ziel = POSTEN.get(p.get("posten"))
        if not ziel:
            continue
        mn, mx = int(p.get("min_cent") or 0), int(p.get("max_cent") or 0)
        bereich = {"min": mn / 100, "max": max(mx, mn) / 100, "approved": bool(p.get("freigegeben"))}
        if p.get("quelle"):
            bereich["source"] = str(p["quelle"])[:300]
        if ziel[0] == "deliveryEur":
            lieferung[ziel[1]] = bereich
        else:
            cfg[ziel[0]] = bereich
    if lieferung:
        cfg["deliveryEur"] = lieferung
    if kurs and kurs_datum:
        cfg["fallbackRate"] = {"rate": round(float(kurs), 6), "date": str(kurs_datum)[:10]}
    return cfg


# Posten der Kindtabelle → Pfad im Website-Schema (Währung: Lieferung EUR, sonst CHF)
POSTEN = {
    "Lieferung CH": ("deliveryEur", "CH"),
    "Lieferung FL": ("deliveryEur", "FL"),
    "Lieferung DE": ("deliveryEur", "DE"),
    "Lieferung AT": ("deliveryEur", "AT"),
    "Verzollung CH": ("customsFeeChf", None),
    "Eigentransport CH": ("selfTransportChf", None),
}
