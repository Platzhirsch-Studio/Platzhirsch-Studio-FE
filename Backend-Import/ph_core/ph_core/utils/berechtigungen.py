"""Berechtigungsmatrix-Vorlage für DocType-JSONs (CONVENTIONS.md, Abschnitt 5).

Bau-Agenten erzeugen den `permissions`-Block mit standard_permissions("CRM") und
fügen ihn in die JSON-Datei ein (Werte kopieren, nicht zur Laufzeit aufrufen).
"""

VOLL = {"read": 1, "write": 1, "create": 1, "delete": 1, "submit": 0, "cancel": 0, "amend": 0, "print": 1, "email": 1, "export": 1, "report": 1, "share": 1}


def _perm(role, **override):
    p = {"role": role, **VOLL}
    p.update(override)
    return p


def standard_permissions(bereich, submittable=False, website_create=False, website_read=False, website_write=False):
    """Rollen: System Manager (alles), PH Backoffice-Admin (alles ohne submit/cancel),
    PH Geschäftsführung (lesen, Berichte), PH <Bereich> Leitung (alles inkl. submit/cancel/amend),
    PH <Bereich> Mitarbeiter (lesen, anlegen, bearbeiten; kein Löschen, kein Storno),
    optional PH Website Integration (create/read/write je nach Schnittstelle, nie delete)."""
    s = {"submit": 1, "cancel": 1, "amend": 1} if submittable else {}
    perms = [
        _perm("System Manager", **s),
        _perm("PH Backoffice-Admin"),
        _perm("PH Geschäftsführung", write=0, create=0, delete=0),
        _perm(f"PH {bereich} Leitung", **s),
        _perm(f"PH {bereich} Mitarbeiter", delete=0, **({"submit": 1} if submittable else {})),
    ]
    if website_create or website_read or website_write:
        perms.append(
            _perm("PH Website Integration", read=int(website_read or website_write or website_create), write=int(website_write), create=int(website_create), delete=0, print=0, email=0, export=0, report=0, share=0)
        )
    return perms


if __name__ == "__main__":
    import json
    import sys

    bereich = sys.argv[1] if len(sys.argv) > 1 else "CRM"
    print(json.dumps(standard_permissions(bereich, website_create=True), indent=1, ensure_ascii=False))
