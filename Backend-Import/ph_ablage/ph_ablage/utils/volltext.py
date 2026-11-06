"""Text für die Volltextsuche aus Dateiinhalten – ohne Pflichtbibliotheken (getestet in tests/test_volltext.py).

TXT/CSV/MD/JSON/XML: Dekodierung. DOCX/XLSX/PPTX/ODT/ODS/ODP: ZIP + XML-Textknoten per Regex (stdlib, kein
XML-Parser → keine Entity-Expansion), je ZIP-Eintrag höchstens MAX_EINTRAG Bytes (Zip-Bomben). PDF: pypdf, wenn
installiert (Frappe bringt pypdf mit), sonst übersprungen. python-docx/openpyxl werden nicht benötigt.
"""

import html
import io
import re
import zipfile

MAX_TEXT = 100_000
MAX_EINTRAG = 20 * 1024 * 1024
MAX_EINTRAEGE = 200

_OOXML = {
    "docx": (r"word/(document|header\d*|footer\d*|footnotes)\.xml", r"<w:t[^>]*>([^<]*)</w:t>", r"</w:p>"),
    "pptx": (r"ppt/slides/slide\d+\.xml", r"<a:t>([^<]*)</a:t>", r"</a:p>"),
    "xlsx": (r"xl/sharedStrings\.xml", r"<t[^>]*>([^<]*)</t>", r"</si>"),
}
_ODF = (r"content\.xml", r"<text:[a-z]+[^>]*>([^<]*)", r"</text:p>")


def _normalisieren(text):
    text = html.unescape(text)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()[:MAX_TEXT]


def _zip_text(daten, muster_datei, muster_text, absatz):
    teile = []
    with zipfile.ZipFile(io.BytesIO(daten)) as z:
        eintraege = [i for i in z.infolist() if re.fullmatch(muster_datei, i.filename)][:MAX_EINTRAEGE]
        eintraege.sort(key=lambda i: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", i.filename)])
        for info in eintraege:
            if info.file_size > MAX_EINTRAG:
                continue
            with z.open(info) as f:
                xml = f.read(MAX_EINTRAG).decode("utf-8", errors="replace")
            xml = re.sub(absatz, "\n", xml)
            # Absatzmarken als eigene Treffer erhalten, dann nur Textknoten übernehmen
            for zeile in xml.split("\n"):
                stuecke = re.findall(muster_text, zeile)
                if stuecke:
                    teile.append(" ".join(s for s in stuecke if s.strip()) if absatz == r"</si>" else "".join(stuecke))
            if sum(len(t) for t in teile) > MAX_TEXT:
                break
    return "\n".join(teile)


def _pdf_text(daten):
    try:
        from pypdf import PdfReader
    except Exception:  # noqa: BLE001 – optional
        return None
    teile = []
    reader = PdfReader(io.BytesIO(daten))
    for seite in reader.pages[:200]:
        try:
            teile.append(seite.extract_text() or "")
        except Exception:  # noqa: BLE001
            continue
        if sum(len(t) for t in teile) > MAX_TEXT:
            break
    return "\n".join(teile)


def text_aus(end, daten):
    """→ (text | None, status) mit status 'ok' | 'leer' | 'nicht_unterstuetzt' | 'bibliothek_fehlt' | 'fehler'."""
    end = (end or "").lower()
    daten = bytes(daten or b"")
    try:
        if end in ("txt", "csv", "md", "json", "xml", "log"):
            for kodierung in ("utf-8", "cp1252", "latin-1"):
                try:
                    roh = daten.decode(kodierung)
                    break
                except UnicodeDecodeError:
                    continue
            if end == "xml":
                roh = re.sub(r"<[^>]+>", " ", roh)
            text = roh
        elif end in _OOXML:
            text = _zip_text(daten, *_OOXML[end])
        elif end in ("odt", "ods", "odp"):
            text = _zip_text(daten, *_ODF)
        elif end == "pdf":
            text = _pdf_text(daten)
            if text is None:
                return None, "bibliothek_fehlt"
        else:
            return None, "nicht_unterstuetzt"
    except (zipfile.BadZipFile, ValueError, KeyError, OSError):
        return None, "fehler"
    except Exception:  # noqa: BLE001 – defekte Dateien dürfen den Job nie abbrechen
        return None, "fehler"
    text = _normalisieren(text or "")
    return (text, "ok") if text else (None, "leer")
