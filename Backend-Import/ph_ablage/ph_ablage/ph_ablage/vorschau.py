"""Hintergrundjobs je Version: Vorschau, CAD-Metadaten, Volltext, Prüfsumme (queue „long“, nie Ausnahmen nach außen).

Vorschau (eigenes Speicher-Objekt unter vorschau/<jahr>/<datei>/<version>-<sha8>.<art>):
  bild   → PNG-Thumbnail mit Pillow (Frappe-Abhängigkeit), EXIF-Drehung beachtet, Kantenlänge aus Einstellungen
  pdf    → erste Seite als PNG, wenn pypdfium2 installiert ist; sonst Status „Browser“ (PDF direkt anzeigen)
  office → PDF per LibreOffice headless (`soffice --headless --convert-to pdf`), nur wenn eingeschaltet und soffice
           auf dem Server gefunden wird; sonst „Nicht moeglich“
  cad    → Metadaten (utils/cad.py) + Symbol; DXF-Zeichnungsvorschau ist späteres Ziel
  video  → Posterbild per ffmpeg (optional, Einstellung), sonst „Nicht moeglich“
  text   → keine Vorschau nötig („Browser“)
"""

import io
import json
import os
import shutil
import subprocess
import tempfile

import frappe
from frappe.utils import cint, getdate

from ph_ablage import speicher
from ph_ablage.ph_ablage import dienste
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll
from ph_ablage.utils import cad, regeln, volltext

MB = 1024 * 1024
MAX_BILD_MB = 80
MAX_OFFICE_MB = 100


def einreihen(datei, version, pruefsumme=False, neu=False):
    frappe.enqueue("ph_ablage.ph_ablage.vorschau.verarbeiten", queue="long", timeout=1800, datei=datei, version=cint(version), pruefsumme=int(bool(pruefsumme)), enqueue_after_commit=True, job_id=f"ph_ablage:{datei}:{cint(version)}", deduplicate=not neu)


def verarbeiten(datei, version, pruefsumme=0):
    if not frappe.db.exists("PH Datei", datei):
        return
    doc = frappe.get_doc("PH Datei", datei)
    try:
        v = dienste.version_zeile(doc, version)
    except Exception:  # noqa: BLE001
        return
    e = einstellungen()
    if cint(pruefsumme):
        _pruefsumme(doc, v)
    try:
        _vorschau(doc, v, e)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Vorschau {datei} v{version}")
        _setze(doc, vorschau_status="Fehler")
    try:
        _volltext(doc, v, e)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"ph_ablage: Volltext {datei} v{version}")
        _setze(doc, volltext_status="fehler")
    frappe.db.commit()


def _setze(doc, **werte):
    frappe.db.set_value("PH Datei", doc.name, werte, update_modified=False)


def _version_setzen(v, **werte):
    frappe.db.set_value("PH Datei Version", v.name, werte, update_modified=False)


def _pruefsumme(doc, v):
    ist, _n = dienste.sha256_objekt(v.speicher, v.schluessel)
    if v.sha256 and ist != v.sha256:
        _version_setzen(v, geprueft=0)
        protokoll("Pruefsumme abweichend", datei=doc.name, version=v.version, hinweis=f"erwartet {v.sha256[:12]}…, ist {ist[:12]}…", automatisch=True)
        frappe.log_error(title=f"ph_ablage: Prüfsumme {doc.name} v{v.version} weicht ab")
    else:
        _version_setzen(v, geprueft=1, sha256=ist)
        if cint(doc.aktuelle_version) == cint(v.version) and not doc.sha256:
            _setze(doc, sha256=ist)


def _ziel(doc, v, endung):
    return dienste.vorschau_ziel(doc.name, getdate(doc.creation).year, v.version, v.sha256, endung)


def _ablegen(doc, v, daten, endung, mime):
    name = einstellungen().speicher_adapter or "lokal"
    schluessel = _ziel(doc, v, endung)
    speicher.speicher_fuer(name).put(schluessel, daten, mime)
    _version_setzen(v, vorschau_speicher=name, vorschau_schluessel=schluessel, vorschau_mime=mime)
    _setze(doc, vorschau_status="Fertig")


def _lesen(v, max_mb):
    return dienste.inhalt_lesen(v.speicher, v.schluessel, max_bytes=max_mb * MB)


def bild_thumbnail(daten, px):
    from PIL import Image, ImageOps

    with Image.open(io.BytesIO(daten)) as bild:
        bild = ImageOps.exif_transpose(bild)
        bild.thumbnail((px, px))
        if bild.mode not in ("RGB", "RGBA"):
            bild = bild.convert("RGBA" if "A" in bild.mode else "RGB")
        out = io.BytesIO()
        bild.save(out, format="PNG", optimize=True)
        return out.getvalue(), {"breite": bild.width, "hoehe": bild.height}


def _pdf_erste_seite(daten, px):
    try:
        import pypdfium2 as pdfium  # optional
    except Exception:  # noqa: BLE001
        pdfium = None
    if pdfium is None:
        return None
    pdf = pdfium.PdfDocument(daten)
    seite = pdf[0]
    bild = seite.render(scale=px / max(seite.get_width(), seite.get_height(), 1)).to_pil()
    out = io.BytesIO()
    bild.save(out, format="PNG")
    return out.getvalue()


def soffice_pfad(e=None):
    e = e or einstellungen()
    return shutil.which(e.soffice_pfad or "soffice") or shutil.which("libreoffice")


def office_nach_pdf(daten, endung, soffice, timeout=180):
    with tempfile.TemporaryDirectory(prefix="ph_ablage_") as tmp:
        quelle = os.path.join(tmp, f"eingabe.{endung}")
        with open(quelle, "wb") as f:
            f.write(daten)
        # eigenes Profil je Lauf: parallele Jobs blockieren sich nicht
        profil = "file://" + os.path.join(tmp, "profil").replace("\\", "/")
        subprocess.run([soffice, f"-env:UserInstallation={profil}", "--headless", "--norestore", "--convert-to", "pdf", "--outdir", tmp, quelle], check=True, timeout=timeout, capture_output=True)  # noqa: S603 – fester Befehl, keine Shell
        ziel = os.path.join(tmp, "eingabe.pdf")
        with open(ziel, "rb") as f:
            return f.read()


def _video_poster(daten, endung, px):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return None
    with tempfile.TemporaryDirectory(prefix="ph_ablage_") as tmp:
        quelle = os.path.join(tmp, f"eingabe.{endung}")
        ziel = os.path.join(tmp, "poster.png")
        with open(quelle, "wb") as f:
            f.write(daten)
        subprocess.run([ffmpeg, "-y", "-ss", "1", "-i", quelle, "-frames:v", "1", "-vf", f"scale='min({px},iw)':-2", ziel], check=True, timeout=120, capture_output=True)  # noqa: S603
        with open(ziel, "rb") as f:
            return f.read()


def _vorschau(doc, v, e):
    art = regeln.vorschau_art(doc.endung)
    px = cint(e.vorschau_px) or 512
    if not cint(e.vorschau_aktiv) or art in ("keine", "audio"):
        _setze(doc, vorschau_status="Keine")
        return
    if art == "text":
        _setze(doc, vorschau_status="Browser")
        return
    if art == "cad":
        kopf = _kopf(v)
        _setze(doc, metadaten_json=json.dumps(cad.metadaten(doc.endung, kopf), ensure_ascii=False), vorschau_status="Nicht moeglich")
        return
    if art == "bild":
        if cint(v.groesse) > MAX_BILD_MB * MB:
            _setze(doc, vorschau_status="Nicht moeglich")
            return
        try:
            png, masse = bild_thumbnail(_lesen(v, MAX_BILD_MB), px)
        except Exception:  # noqa: BLE001 – z. B. HEIC ohne Plugin
            _setze(doc, vorschau_status="Nicht moeglich")
            return
        _setze(doc, metadaten_json=json.dumps({"vorschau": masse}, ensure_ascii=False))
        _ablegen(doc, v, png, "png", "image/png")
        return
    if art == "pdf":
        png = None
        if cint(v.groesse) <= MAX_OFFICE_MB * MB:
            try:
                png = _pdf_erste_seite(_lesen(v, MAX_OFFICE_MB), px)
            except Exception:  # noqa: BLE001
                png = None
        if png:
            _ablegen(doc, v, png, "png", "image/png")
        else:
            _setze(doc, vorschau_status="Browser")
        return
    if art == "office":
        soffice = soffice_pfad(e) if cint(e.office_vorschau) else None
        if not soffice or cint(v.groesse) > MAX_OFFICE_MB * MB:
            _setze(doc, vorschau_status="Nicht moeglich")
            return
        pdf = office_nach_pdf(_lesen(v, MAX_OFFICE_MB), doc.endung, soffice)
        _ablegen(doc, v, pdf, "pdf", "application/pdf")
        return
    if art == "video":
        if not cint(e.video_poster) or cint(v.groesse) > 500 * MB:
            _setze(doc, vorschau_status="Nicht moeglich")
            return
        png = _video_poster(_lesen(v, 500), doc.endung, px)
        if png:
            _ablegen(doc, v, png, "png", "image/png")
        else:
            _setze(doc, vorschau_status="Nicht moeglich")


def _kopf(v):
    f = speicher.speicher_fuer(v.speicher).get(v.schluessel)
    try:
        return f.read(cad.KOPF_BYTES)
    finally:
        try:
            f.close()
        except Exception:  # noqa: BLE001
            pass


def _volltext(doc, v, e):
    if not cint(e.volltext_aktiv):
        _setze(doc, volltext_status="aus")
        return
    if cint(doc.aktuelle_version) != cint(v.version):
        return
    if cint(v.groesse) > cint(e.volltext_max_mb or 50) * MB:
        _setze(doc, volltext_status="nicht_unterstuetzt", volltext=None)
        return
    if doc.endung not in ("txt", "csv", "md", "json", "xml", "log", "pdf", "docx", "xlsx", "pptx", "odt", "ods", "odp"):
        _setze(doc, volltext_status="nicht_unterstuetzt", volltext=None)
        return
    text, status = volltext.text_aus(doc.endung, _lesen(v, cint(e.volltext_max_mb or 50)))
    _setze(doc, volltext=text, volltext_status=status)
