"""CAD-Metadaten ohne Bibliotheken (nur Dateikopf/ASCII-Kopfteil lesen) – getestet in tests/test_cad.py.

DXF: Kopf-Variablen $ACADVER, $INSUNITS, $EXTMIN/$EXTMAX (ASCII-DXF; Binär-DXF nur Version).
DWG: Versionskennung der ersten 6 Byte (AC1009 … AC1032).
IFC: STEP-Kopf FILE_SCHEMA, FILE_NAME (Programm/Autor ohne Personenfelder).
3DM: Rhino-Kopf "3D Geometry File Format" + Version. SKP: SketchUp-Kennung (UTF-16) + Version, soweit lesbar.
Eine echte Zeichnungsvorschau (DXF → SVG) ist späteres Ziel; heute: Metadaten + Symbol.
"""

import re

DWG_VERSIONEN = {
    "AC1.2": "R1.2", "AC1.40": "R1.40", "AC1.50": "R2.05", "AC2.10": "R2.10", "AC1002": "R2.5", "AC1003": "R2.6",
    "AC1004": "R9", "AC1006": "R10", "AC1009": "R11/R12", "AC1012": "R13", "AC1014": "R14", "AC1015": "AutoCAD 2000",
    "AC1018": "AutoCAD 2004", "AC1021": "AutoCAD 2007", "AC1024": "AutoCAD 2010", "AC1027": "AutoCAD 2013",
    "AC1032": "AutoCAD 2018",
}
INSUNITS = {0: "ohne Einheit", 1: "Zoll", 2: "Fuß", 4: "Millimeter", 5: "Zentimeter", 6: "Meter", 14: "Dezimeter"}
KOPF_BYTES = 256 * 1024


def _dxf_paare(text):
    zeilen = text.splitlines()
    for i in range(0, len(zeilen) - 1, 2):
        yield zeilen[i].strip(), zeilen[i + 1].strip()


def dxf_metadaten(kopf):
    if kopf.startswith(b"AutoCAD Binary DXF"):
        return {"format": "DXF (binär)"}
    text = kopf.decode("utf-8", errors="replace") if isinstance(kopf, (bytes, bytearray)) else str(kopf)
    out = {"format": "DXF"}
    var = None
    punkte = {}
    for code, wert in _dxf_paare(text):
        if code == "0" and wert == "ENDSEC" and var is not None:
            break
        if code == "9":
            var = wert
            continue
        if var == "$ACADVER" and code == "1":
            out["version"] = wert
            out["version_text"] = DWG_VERSIONEN.get(wert, wert)
        elif var == "$INSUNITS" and code == "70":
            try:
                out["einheit"] = INSUNITS.get(int(wert), str(wert))
            except ValueError:
                pass
        elif var in ("$EXTMIN", "$EXTMAX") and code in ("10", "20", "30"):
            try:
                punkte.setdefault(var, {})[code] = float(wert)
            except ValueError:
                pass
    if "$EXTMIN" in punkte and "$EXTMAX" in punkte:
        a, b = punkte["$EXTMIN"], punkte["$EXTMAX"]
        if "10" in a and "10" in b and "20" in a and "20" in b:
            out["ausdehnung"] = {"breite": round(b["10"] - a["10"], 3), "hoehe": round(b["20"] - a["20"], 3)}
    return out


def dwg_metadaten(kopf):
    kennung = bytes(kopf[:6]).decode("ascii", errors="replace")
    return {"format": "DWG", "version": kennung, "version_text": DWG_VERSIONEN.get(kennung, "unbekannt")}


def ifc_metadaten(kopf):
    text = kopf.decode("utf-8", errors="replace") if isinstance(kopf, (bytes, bytearray)) else str(kopf)
    out = {"format": "IFC"}
    m = re.search(r"FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'", text)
    if m:
        out["schema"] = m.group(1)
    m = re.search(r"FILE_NAME\s*\((.*?)\);", text, re.S)
    if m:
        werte = re.findall(r"'([^']*)'", m.group(1))
        # FILE_NAME(name, time_stamp, (author), (organization), preprocessor_version, originating_system, authorization)
        # Autor/Organisation (Personenangaben) werden bewusst nicht übernommen
        if len(werte) >= 2:
            out["zeitstempel"] = werte[1][:40]
        if len(werte) >= 6:
            out["programm"] = werte[-2][:120]
    return out


def rhino_metadaten(kopf):
    out = {"format": "3DM"}
    m = re.match(rb"3D Geometry File Format\s+(\d+)", bytes(kopf[:40]))
    if m:
        out["version"] = int(m.group(1))
    return out


def skp_metadaten(kopf):
    out = {"format": "SKP"}
    text = bytes(kopf[:200]).decode("utf-16-le", errors="ignore")
    if "SketchUp Model" in text:
        out["erkannt"] = True
        m = re.search(r"\{(\d+(?:\.\d+)*)\}", text)
        if m:
            out["version"] = m.group(1)
    return out


def metadaten(end, kopf):
    """Endung + Dateikopf (Bytes) → dict; unbekannte Endung → {}."""
    end = (end or "").lower()
    kopf = bytes(kopf or b"")[:KOPF_BYTES]
    try:
        if end == "dxf":
            return dxf_metadaten(kopf)
        if end == "dwg":
            return dwg_metadaten(kopf)
        if end == "ifc":
            return ifc_metadaten(kopf)
        if end == "3dm":
            return rhino_metadaten(kopf)
        if end == "skp":
            return skp_metadaten(kopf)
    except Exception:  # noqa: BLE001 – Metadaten sind Zusatz, nie Fehlerquelle
        return {"format": end.upper(), "fehler": "nicht lesbar"}
    return {}
