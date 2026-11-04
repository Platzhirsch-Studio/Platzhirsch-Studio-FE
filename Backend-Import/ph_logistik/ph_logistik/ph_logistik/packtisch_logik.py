"""Reine Packtisch-Logik (kein Frappe-Import): Scan-Zuordnung, Paketvorschlag, Gewicht, Versicherungswert.

Positionen sind dicts mit: name, produkt, beschreibung, menge, menge_gepackt, ean, slug, seriennummer,
zerbrechlich, einzel_cent, paketprofil. Profile: dicts wie PH Paketprofil (key, laenge_cm, …, glas, zerbrechlich, max_stueck).
"""


def normalisiere_code(code):
    return "".join(ch for ch in str(code or "").strip() if not ch.isspace()).lower()


def scan_treffer(code, positionen):
    """Erste offene Position, die zum Scan passt (EAN, Seriennummer, Slug, Produkt-Name, Zeilenname).
    QR-Codes der Website enthalten ggf. eine URL mit dem Slug am Ende → letzter Pfadteil zählt auch."""
    c = normalisiere_code(code)
    if not c:
        return None
    kandidaten = {c}
    if "/" in c:
        kandidaten.add(c.rstrip("/").rsplit("/", 1)[-1].split("?")[0])
    offen = [p for p in positionen if int(p.get("menge_gepackt") or 0) < int(p.get("menge") or 0)]
    for feld in ("ean", "seriennummer", "slug", "produkt", "name"):
        for p in offen:
            if normalisiere_code(p.get(feld)) in kandidaten:
                return p
    return None


def abhaken(position, anzahl=1):
    """menge_gepackt um anzahl erhöhen (max. menge). → neue menge_gepackt, vollstaendig"""
    menge = int(position.get("menge") or 0)
    neu = min(menge, int(position.get("menge_gepackt") or 0) + int(anzahl))
    return neu, neu >= menge


def alles_gepackt(positionen):
    return bool(positionen) and all(int(p.get("menge_gepackt") or 0) >= int(p.get("menge") or 0) for p in positionen)


def zerbrechlich_gesamt(positionen, profile_by_key=None):
    profile_by_key = profile_by_key or {}
    for p in positionen:
        if p.get("zerbrechlich"):
            return True
        pr = profile_by_key.get(p.get("paketprofil"))
        if pr and (pr.get("zerbrechlich") or pr.get("glas")):
            return True
    return False


def warenwert_cent(positionen):
    return sum(int(p.get("einzel_cent") or 0) * int(p.get("menge") or 0) for p in positionen)


def versicherung(positionen, profile_by_key, glas_immer=True, ab_cent=50000):
    """K17 (31.10.2026): zerbrechlich/Glas → versichert, Versicherungswert = Warenwert.
    Zusätzlich ab Warenwert-Grenze (Einstellungen). → (versichern, versicherungswert_cent)"""
    wert = warenwert_cent(positionen)
    glas = any((profile_by_key.get(p.get("paketprofil")) or {}).get("glas") for p in positionen) or zerbrechlich_gesamt(positionen, profile_by_key)
    versichern = (glas_immer and glas) or (ab_cent and wert >= int(ab_cent))
    return bool(versichern), wert if versichern else 0


def paket_vorschlag(positionen, profile_by_key):
    """Je Position ein Paket (Vereinfachung wie config.js paketeOf: einzeln verpackt, Menge je Zeile),
    Profil aus der Position, Stück über max_stueck → weitere Pakete. Ohne Profil: Paket ohne Maße (Nutzer ergänzt)."""
    pakete = []
    nr = 0
    for p in positionen:
        pr = profile_by_key.get(p.get("paketprofil")) or {}
        menge = int(p.get("menge") or 0)
        max_st = max(int(pr.get("max_stueck") or 1), 1)
        rest = menge
        while rest > 0:
            nr += 1
            st = min(rest, max_st)
            rest -= st
            pakete.append(
                {
                    "paket_nr": nr,
                    "paketprofil": pr.get("key") or p.get("paketprofil"),
                    "laenge_cm": pr.get("laenge_cm"),
                    "breite_cm": pr.get("breite_cm"),
                    "hoehe_cm": pr.get("hoehe_cm"),
                    "gewicht_g": _gewicht(pr, st),
                    "zerbrechlich": int(bool(p.get("zerbrechlich") or pr.get("zerbrechlich") or pr.get("glas"))),
                    "inhalt": f"{st}× {p.get('beschreibung') or p.get('produkt') or ''}"[:140],
                    "position": p.get("name"),
                }
            )
    return pakete


def _gewicht(pr, stueck):
    if not pr:
        return None
    max_art = int(pr.get("max_artikel_gewicht_g") or 0)
    tara = int(pr.get("tara_g") or 0)
    max_st = max(int(pr.get("max_stueck") or 1), 1)
    if max_art and tara and max_st > 1:
        return int(round(max_art / max_st * stueck + tara))
    return int(pr.get("gewicht_g") or 0) or None


def gesamtgewicht_g(pakete):
    return sum(int(p.get("gewicht_g") or 0) for p in pakete)


def pakete_vollstaendig(pakete):
    return bool(pakete) and all(int(p.get(k) or 0) > 0 for p in pakete for k in ("laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g"))


def versandfaehig(pakete, profile_by_key):
    """Gesperrte Profile (Gefahrgut) → nicht versandfähig; Grund zurückgeben."""
    for p in pakete:
        pr = profile_by_key.get(p.get("paketprofil")) or {}
        if pr.get("versand_gesperrt"):
            return False, pr["versand_gesperrt"]
    if not pakete_vollstaendig(pakete):
        return False, "Paketmaße oder Gewicht fehlen."
    return True, None
