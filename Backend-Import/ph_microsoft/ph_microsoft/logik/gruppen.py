"""Entra-Gruppen → PH-Rollen (ohne Frappe).

Regel (Auftrag ph_microsoft, Punkt 1): Es werden nur Rollen hinzugefügt/entfernt, die in der
Zuordnungstabelle (PH Microsoft Einstellungen → Gruppen und Rollen) vorkommen. Rollen außerhalb der
Tabelle bleiben unberührt. Geschützte Rollen (System Manager, Administrator …) werden nie verwaltet.
Bei Gruppen-Überlauf (Token ohne groups-Liste) wird nichts geändert.
"""

GESCHUETZT = frozenset({"System Manager", "Administrator", "Guest", "All", "Desk User", "Workspace Manager", "Script Manager"})


def ist_geschuetzt(rolle):
    return str(rolle or "").strip() in GESCHUETZT


def zuordnung_normalisieren(zeilen):
    """[{gruppe_id, rolle, standort?}] → {gruppe_id_klein: {"rollen": set, "standort": str|None}}."""
    aus = {}
    for z in zeilen or []:
        gid = str((z.get("gruppe_id") if isinstance(z, dict) else getattr(z, "gruppe_id", "")) or "").strip().lower()
        rolle = str((z.get("rolle") if isinstance(z, dict) else getattr(z, "rolle", "")) or "").strip()
        standort = str((z.get("standort") if isinstance(z, dict) else getattr(z, "standort", "")) or "").strip() or None
        if not gid or not rolle or ist_geschuetzt(rolle):
            continue
        eintrag = aus.setdefault(gid, {"rollen": set(), "standort": None})
        eintrag["rollen"].add(rolle)
        eintrag["standort"] = eintrag["standort"] or standort
    return aus


def verwaltete_rollen(zuordnung):
    return set().union(*[e["rollen"] for e in zuordnung.values()]) if zuordnung else set()


def rollen_abgleich(aktuelle_rollen, gruppen, zuordnung):
    """→ (hinzufuegen, entfernen) als sortierte Listen. gruppen None = Überlauf → keine Änderung."""
    if gruppen is None or not zuordnung:
        return [], []
    gruppen = {str(g).lower() for g in gruppen}
    aktuell = set(aktuelle_rollen or [])
    soll = set()
    for gid in gruppen:
        if gid in zuordnung:
            soll |= zuordnung[gid]["rollen"]
    verwaltet = verwaltete_rollen(zuordnung)
    hinzu = {r for r in soll - aktuell if not ist_geschuetzt(r)}
    weg = {r for r in (aktuell & verwaltet) - soll if not ist_geschuetzt(r)}
    return sorted(hinzu), sorted(weg)


def hat_gemappte_gruppe(gruppen, zuordnung):
    return bool(gruppen) and any(str(g).lower() in zuordnung for g in gruppen)


def standort_aus_gruppen(gruppen, zuordnung):
    for g in sorted(str(x).lower() for x in (gruppen or [])):
        if g in zuordnung and zuordnung[g]["standort"]:
            return zuordnung[g]["standort"]
    return None
