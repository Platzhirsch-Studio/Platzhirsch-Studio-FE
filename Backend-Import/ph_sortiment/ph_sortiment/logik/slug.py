"""Slug-Bildung, identisch zu src/lib/legal/claims.js toBrandSlug (Ligaturen, NFD, Kleinbuchstaben)."""

import re
import unicodedata

_LIGATUREN = str.maketrans({"æ": "ae", "Æ": "Ae", "œ": "oe", "Œ": "Oe", "ß": "ss"})
_NICHT_ERLAUBT = re.compile(r"[^a-z0-9]+")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def slug(wert):
    """'Lyngby Porcelæn' → 'lyngby-porcelaen', 'Kähler' → 'kahler' (wie die Website)."""
    s = str(wert or "").translate(_LIGATUREN)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.lower().replace("&", "")
    s = _NICHT_ERLAUBT.sub("-", s)
    return s.strip("-")


def ist_slug(wert):
    return bool(SLUG_RE.match(str(wert or "")))


def produkt_slug(marke_slug, name):
    """Empfehlung der Website: '<marke>-<modell>' (schema.js KatalogProdukt.slug)."""
    n = slug(name)
    m = slug(marke_slug)
    if not n:
        return m
    return n if n.startswith(m + "-") or n == m else f"{m}-{n}"
