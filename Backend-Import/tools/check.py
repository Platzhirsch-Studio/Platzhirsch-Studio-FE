"""Prüft alle PH-Apps unter Backend-Import/.

Aufruf: python -I Backend-Import/tools/check.py [ordner] [--streng]

FEHLER (Exit 1): Python-Syntax, JSON-Validität, DocType-Pflichtfelder, Fixture-Form, Geheimnis-Scan,
  Nummernkreis-Abweichung (DocType-JSON ≠ ph_core/utils/naming.py), unbekannte Rollen, Workspace-Sequenzen,
  fehlende Druck-Teilvorlagen.
WARNUNG (Exit 0, mit --streng Exit 1): Befunde, die eine andere App beheben muss – doppelte Rollen-/
  Workflow-Fixtures, geteilte Nummernkreise, Link-Ziele außerhalb von required_apps, DocType-Namen in zwei
  Apps, Druckformate ohne ph_basis.html, Style-Konflikte bei Workflow States. Der Integrationsagent arbeitet
  diese Liste ab (INTEGRATION-BEFUNDE-CORE.md); danach --streng in die Routine aufnehmen.
"""

import ast
import json
import os
import py_compile
import re
import sys
from collections import defaultdict

if hasattr(sys.stdout, "reconfigure"):  # Windows-Konsole (cp1252) soll an Umlauten/Pfeilen nicht scheitern
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
STRENG = "--streng" in sys.argv
ROOT = os.path.abspath(ARGS[0] if ARGS else os.path.join(os.path.dirname(__file__), ".."))
SECRET_RE = re.compile(
    r"(sk_live_[0-9A-Za-z]{8,}|sk_test_[0-9A-Za-z]{16,}|rk_live_[0-9A-Za-z]{8,}|whsec_[0-9A-Za-z]{16,}|re_[0-9A-Za-z]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|token [0-9a-f]{15}:[0-9a-f]{15})"
)
ALLOWED_SECRET_HINTS = ("whsec_mock_platzhirsch", "sk_test_mock_platzhirsch")
DOCTYPE_REQUIRED = ("name", "module", "doctype", "fields", "field_order", "permissions")

# PLAN.md Abschnitt 2: Nummer = Workspace-sequence_id = Installationsreihenfolge.
APP_REIHENFOLGE = ["ph_core", "ph_crm", "ph_sortiment", "ph_projekte", "ph_shop", "ph_faktura", "ph_logistik", "ph_personal", "ph_marketing", "ph_kassa", "ph_service", "ph_kundenkarte", "ph_ablage", "ph_microsoft"]
APP_WORKSPACE = {"ph_core": "PH Zentrale", "ph_crm": "PH CRM", "ph_sortiment": "PH Sortiment", "ph_projekte": "PH Projekte", "ph_shop": "PH Shop", "ph_faktura": "PH Faktura", "ph_logistik": "PH Logistik", "ph_personal": "PH Personal", "ph_marketing": "PH Marketing", "ph_kassa": "PH Kassa", "ph_service": "PH Service", "ph_kundenkarte": "PH Kundenkarte", "ph_ablage": "PH Ablage", "ph_microsoft": "PH Microsoft"}
FRAPPE_ROLLEN = {"System Manager", "Administrator", "All", "Guest", "Desk User", "Website Manager", "Report Manager", "Dashboard Manager", "Workspace Manager", "Script Manager", "Newsletter Manager", "Blogger", "Knowledge Base Editor", "Knowledge Base Contributor", "Translator", "Prepared Report User", "Inbox User", "Accounts Manager", "Accounts User", "Sales User", "Sales Manager", "Purchase User", "HR Manager", "Employee"}
ERPNEXT_DOCTYPES = {"Customer", "Supplier", "Item", "Company", "Warehouse", "Sales Invoice", "Sales Order", "Quotation", "Delivery Note", "Purchase Order", "Purchase Receipt", "Payment Entry", "Holiday List", "Employee", "Lead", "Opportunity", "Account", "Cost Center", "Project", "Task", "Item Group", "Brand", "Price List", "UOM", "Mode of Payment", "Territory", "Customer Group", "Supplier Group", "Stock Entry", "Journal Entry", "Fiscal Year", "Address Template", "Terms and Conditions", "Sales Taxes and Charges Template", "Item Price"}
PRINT_OHNE_BASIS_OK = ("Etikett", "Namensschild", "Bon", "Label")

fehler = []
warnungen = []
py = js = 0

# Index über alle Apps
app_von_pfad = {}
doctype_besitz = defaultdict(list)          # DocType-Name → [app]
doctype_json = {}                           # DocType-Name → (app, rel, data)
rollen_definiert = defaultdict(list)        # Rolle → [app]
rollen_verwendet = defaultdict(set)         # Rolle → {(app, rel)}
required_apps = {}                          # app → [apps]
workspaces = []                             # (app, name, module, sequence_id)
wf_states_def = defaultdict(list)           # Name → [(app, style)]
wf_actions_def = defaultdict(list)          # Name → [app]
wf_states_used = defaultdict(set)           # Name → {app}
wf_actions_used = defaultdict(set)
link_ziele = []                             # (app, rel, feld, ziel)
print_formats = []                          # (app, name, html)
templates = set()                           # relative Pfade "templates/print/x.html" je App
nummernkreise = {}
geteilte_serien = {}
serien_abweichungen = []                    # (rel, doctype, serie_json, serie_register)


def app_name(path):
    rel = os.path.relpath(path, ROOT)
    erster = rel.split(os.sep)[0]
    return erster if erster.startswith("ph_") else None


def lade_nummernkreise():
    """NUMMERNKREISE/GETEILTE_SERIEN aus naming.py ohne Import (ast.literal_eval)."""
    p = os.path.join(ROOT, "ph_core", "ph_core", "utils", "naming.py")
    if not os.path.exists(p):
        return
    with open(p, encoding="utf-8") as f:
        baum = ast.parse(f.read())
    for knoten in baum.body:
        if isinstance(knoten, ast.Assign) and len(knoten.targets) == 1 and isinstance(knoten.targets[0], ast.Name):
            if knoten.targets[0].id == "NUMMERNKREISE":
                nummernkreise.update(ast.literal_eval(knoten.value))
            elif knoten.targets[0].id == "GETEILTE_SERIEN":
                geteilte_serien.update(ast.literal_eval(knoten.value))


def lade_hooks(app):
    p = os.path.join(ROOT, app, app, "hooks.py")
    if not os.path.exists(p):
        return
    with open(p, encoding="utf-8") as f:
        baum = ast.parse(f.read())
    for knoten in baum.body:
        if isinstance(knoten, ast.Assign) and isinstance(knoten.targets[0], ast.Name) and knoten.targets[0].id == "required_apps":
            try:
                required_apps[app] = [a for a in ast.literal_eval(knoten.value) if a != "frappe"]
            except Exception:  # noqa: BLE001
                required_apps[app] = []


def sammle_rollen(obj, app, rel):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("role", "allow_edit", "allowed") and isinstance(v, str) and v:
                rollen_verwendet[v].add((app, rel))
            elif k == "roles" and isinstance(v, list):
                for r in v:
                    if isinstance(r, str) and r:
                        rollen_verwendet[r].add((app, rel))
                    elif isinstance(r, dict) and r.get("role"):
                        rollen_verwendet[r["role"]].add((app, rel))
            else:
                sammle_rollen(v, app, rel)
    elif isinstance(obj, list):
        for x in obj:
            sammle_rollen(x, app, rel)


def pruefe_doctype(path, data, app):
    for key in DOCTYPE_REQUIRED:
        if key not in data:
            fehler.append(f"{path}: DocType ohne '{key}'")
    names = [f.get("fieldname") for f in data.get("fields", [])]
    if len(names) != len(set(names)):
        fehler.append(f"{path}: doppelte fieldnames")
    for fn in data.get("field_order", []):
        if fn not in names:
            fehler.append(f"{path}: field_order enthält unbekanntes Feld '{fn}'")
    for f in data.get("fields", []):
        fn = f.get("fieldname", "")
        if not fn or not re.match(r"^[a-z][a-z0-9_]*$", fn):
            fehler.append(f"{path}: ungültiger fieldname '{fn}'")
        if f.get("fieldtype") in ("Link", "Table", "Table MultiSelect"):
            if not f.get("options"):
                fehler.append(f"{path}: Feld '{fn}' ({f.get('fieldtype')}) ohne options")
            elif app:
                link_ziele.append((app, path, fn, f["options"]))
        if f.get("fieldtype") == "Dynamic Link":
            pass  # Ziel erst zur Laufzeit
    for ln in data.get("links", []) or []:
        if ln.get("link_doctype") and app:
            link_ziele.append((app, path, f"links:{ln.get('link_fieldname')}", ln["link_doctype"]))
    if not data.get("istable") and not data.get("issingle"):
        if not data.get("track_changes") and not data.get("in_create"):  # Protokoll-DocTypes (in_create) ohne Versionen
            fehler.append(f"{path}: track_changes fehlt")
        if "status" in names and not data.get("title_field"):
            fehler.append(f"{path}: title_field fehlt")
    if not data.get("istable") and not data.get("permissions"):
        fehler.append(f"{path}: keine permissions")
    # Nummernkreis: Feld naming_series.default muss im Register stehen (auch wenn autoname format:… ist)
    serie = None
    for f in data.get("fields", []):
        if f.get("fieldname") == "naming_series":
            serie = f.get("default") or (f.get("options") or "").split("\n")[0]
    dt = data.get("name")
    if serie:
        if nummernkreise and dt not in nummernkreise:
            fehler.append(f"{path}: Serie '{serie}' nicht in ph_core/utils/naming.py NUMMERNKREISE (ANFRAGEN-AN-CORE.md)")
        elif nummernkreise and nummernkreise[dt] != serie:
            serien_abweichungen.append((path, dt, serie, nummernkreise[dt]))
    elif str(data.get("autoname", "")).startswith("naming_series"):
        fehler.append(f"{path}: autoname naming_series ohne Feld naming_series")


def pruefe_fixture(rel, data, app):
    if not isinstance(data, list) or not all(isinstance(d, dict) and d.get("doctype") for d in data):
        fehler.append(f"{rel}: Fixture muss Liste von Dokumenten mit 'doctype' sein")
        return
    for d in data:
        dt = d.get("doctype")
        if dt == "Workspace":
            try:
                json.loads(d.get("content") or "[]")
            except Exception:  # noqa: BLE001
                fehler.append(f"{rel}: Workspace.content ist kein JSON-String")
            workspaces.append((app, d.get("name"), d.get("module"), d.get("sequence_id")))
        elif dt in ("Dashboard Chart", "Number Card") and d.get("filters_json"):
            try:
                json.loads(d["filters_json"])
            except Exception:  # noqa: BLE001
                fehler.append(f"{rel}: filters_json ungültig in {d.get('name')}")
        if dt == "Role":
            rollen_definiert[d.get("name")].append(app)
        elif dt == "Workflow State":
            wf_states_def[d.get("name")].append((app, d.get("style") or ""))
        elif dt == "Workflow Action Master":
            wf_actions_def[d.get("name")].append(app)
        elif dt == "Workflow":
            for s in d.get("states", []) or []:
                wf_states_used[s.get("state")].add(app)
            for t in d.get("transitions", []) or []:
                wf_states_used[t.get("state")].add(app)
                wf_states_used[t.get("next_state")].add(app)
                wf_actions_used[t.get("action")].add(app)
            if d.get("document_type"):
                link_ziele.append((app, rel, f"Workflow:{d.get('name')}", d["document_type"]))
        elif dt == "Custom Field":
            if d.get("dt"):
                link_ziele.append((app, rel, f"CustomField:{d.get('fieldname')}@dt", d["dt"]))
            if d.get("fieldtype") in ("Link", "Table", "Table MultiSelect") and d.get("options"):
                link_ziele.append((app, rel, f"CustomField:{d.get('fieldname')}", d["options"]))
        elif dt in ("Kanban Board",) and d.get("reference_doctype"):
            link_ziele.append((app, rel, f"Kanban:{d.get('name')}", d["reference_doctype"]))
        elif dt in ("Dashboard Chart", "Number Card") and d.get("document_type"):
            link_ziele.append((app, rel, f"{dt}:{d.get('name')}", d["document_type"]))
        elif dt == "Print Format":
            if d.get("doc_type"):
                link_ziele.append((app, rel, f"PrintFormat:{d.get('name')}", d["doc_type"]))
            print_formats.append((app, d.get("name"), d.get("html") or ""))
        elif dt in ("Client Script",) and d.get("dt"):
            link_ziele.append((app, rel, f"ClientScript:{d.get('name')}", d["dt"]))
        elif dt in ("Property Setter",) and d.get("doc_type"):
            link_ziele.append((app, rel, f"PropertySetter:{d.get('name')}", d["doc_type"]))
        elif dt == "Custom DocPerm" and d.get("parent"):
            link_ziele.append((app, rel, f"CustomDocPerm:{d.get('role')}", d["parent"]))
        elif dt == "Role Profile":
            for r in d.get("roles", []) or []:
                rollen_verwendet[r.get("role")].add((app, rel))


# ── Durchlauf ───────────────────────────────────────────────────────────────────────────────────
lade_nummernkreise()
for app in APP_REIHENFOLGE:
    if os.path.isdir(os.path.join(ROOT, app)):
        lade_hooks(app)

for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in ("node_modules", "__pycache__", ".git", "referenz")]
    for fn in filenames:
        path = os.path.join(dirpath, fn)
        rel = os.path.relpath(path, ROOT)
        app = app_name(path)
        if fn.endswith(".py"):
            py += 1
            try:
                py_compile.compile(path, doraise=True)
            except py_compile.PyCompileError as e:
                fehler.append(f"{rel}: {e.msg}")
        elif fn.endswith(".html") and app and f"{os.sep}templates{os.sep}print{os.sep}" in path:
            templates.add("templates/print/" + fn)
        elif fn.endswith(".json"):
            js += 1
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:  # noqa: BLE001
                fehler.append(f"{rel}: ungültiges JSON ({e})")
                continue
            if isinstance(data, dict) and data.get("doctype") == "DocType":
                pruefe_doctype(rel, data, app)
                if app:
                    doctype_besitz[data.get("name")].append(app)
                    doctype_json[data.get("name")] = (app, rel, data)
                    sammle_rollen(data.get("permissions", []), app, rel)
            elif os.sep + "fixtures" + os.sep in path or "/fixtures/" in path:
                pruefe_fixture(rel, data, app)
                sammle_rollen(data, app, rel)
            elif isinstance(data, dict) and data.get("doctype") == "Report" and app:
                sammle_rollen(data.get("roles", []), app, rel)
                if data.get("ref_doctype"):
                    link_ziele.append((app, rel, f"Report:{data.get('name')}", data["ref_doctype"]))
        if fn.endswith((".py", ".json", ".js", ".html", ".md", ".toml", ".txt", ".css")):
            try:
                with open(path, encoding="utf-8") as f:
                    text = f.read()
            except UnicodeDecodeError:
                fehler.append(f"{rel}: nicht UTF-8")
                continue
            for m in SECRET_RE.finditer(text):
                if not any(h in m.group(0) for h in ALLOWED_SECRET_HINTS):
                    fehler.append(f"{rel}: möglicher Schlüssel '{m.group(0)[:12]}…'")

# ── Querprüfungen ───────────────────────────────────────────────────────────────────────────────
# 1. DocType-Namen in zwei Apps (Installation der zweiten App bricht)
for dt, apps in sorted(doctype_besitz.items()):
    if len(apps) > 1:
        warnungen.append(f"DocType '{dt}' in mehreren Apps definiert: {apps} – PLAN.md entscheidet den Besitzer")

# 2. Rollen: jede verwendete Rolle genau einmal definiert (vorzugsweise ph_core)
for rolle, orte in sorted(rollen_verwendet.items()):
    if not rolle or rolle in FRAPPE_ROLLEN:
        continue
    if rolle not in rollen_definiert:
        apps = sorted({a for a, _ in orte})
        fehler.append(f"Rolle '{rolle}' wird verwendet ({', '.join(apps)}), ist aber in keiner App als Fixture definiert")
for rolle, apps in sorted(rollen_definiert.items()):
    if len(apps) > 1:
        warnungen.append(f"Rolle '{rolle}' als Fixture in mehreren Apps: {apps} – nur ph_core behalten")
    elif apps != ["ph_core"] and rolle.startswith("PH "):
        warnungen.append(f"Rolle '{rolle}' nur in {apps[0]} definiert – nach ph_core/fixtures/role.json übernehmen oder streichen")

# 3. Nummernkreise: Abweichungen (bei doppelt definierter DocType nur Warnung – Besitzerfrage zuerst) und geteilte Serien
for rel, dt, s_json, s_reg in serien_abweichungen:
    if len(doctype_besitz.get(dt, [])) > 1:
        warnungen.append(f"{rel}: Serie '{s_json}' weicht vom Register ab ('{s_reg}') – DocType '{dt}' ist doppelt definiert, Register folgt dem Besitzer laut PLAN.md")
    else:
        fehler.append(f"{rel}: Serie '{s_json}' weicht vom Register ab ('{s_reg}')")
serie_besitzer = defaultdict(list)
for dt, s in nummernkreise.items():
    serie_besitzer[s].append(dt)
for s, dts in serie_besitzer.items():
    if len(dts) > 1:
        hinweis = geteilte_serien.get(s, {}).get("vorschlag", "")
        warnungen.append(f"Nummernkreis '{s}' von mehreren DocTypes genutzt: {dts} (gemeinsamer Zähler) – {hinweis or 'eine Serie umbenennen'}")
for dt in nummernkreise:
    if doctype_json and dt not in doctype_json:
        warnungen.append(f"NUMMERNKREISE enthält '{dt}', aber keine DocType-JSON gefunden")

# 4. Workspace-Sequenzen: Haupt-Workspace je App = Nummer der App; keine doppelten Sequenzen
seq_gesehen = defaultdict(list)
for app, name, module, seq in workspaces:
    seq_gesehen[seq].append(name)
    erwartet = APP_REIHENFOLGE.index(app) + 1 if app in APP_REIHENFOLGE else None
    if name == APP_WORKSPACE.get(app) and erwartet is not None and float(seq or 0) != float(erwartet):
        fehler.append(f"Workspace '{name}' ({app}): sequence_id {seq}, erwartet {erwartet} (PLAN.md Abschnitt 2)")
for seq, names in seq_gesehen.items():
    if len(names) > 1:
        fehler.append(f"Workspace-sequence_id {seq} doppelt: {names}")
for app, ws in APP_WORKSPACE.items():
    if os.path.isdir(os.path.join(ROOT, app)) and not any(n == ws for _, n, _, _ in workspaces):
        fehler.append(f"{app}: Workspace '{ws}' fehlt")

# 5. Workflow States/Actions: verwendet → definiert; Mehrfachdefinition/Style-Konflikt → Warnung
for st, apps in sorted(wf_states_used.items()):
    if st and st not in wf_states_def:
        fehler.append(f"Workflow State '{st}' verwendet ({sorted(apps)}), aber nirgends als Fixture definiert")
for ac, apps in sorted(wf_actions_used.items()):
    if ac and ac not in wf_actions_def:
        fehler.append(f"Workflow Action '{ac}' verwendet ({sorted(apps)}), aber nirgends als Fixture definiert")
for st, defs in sorted(wf_states_def.items()):
    apps = [a for a, _ in defs]
    styles = {s for _, s in defs}
    if "ph_core" in apps and len(apps) > 1:
        andere = [a for a in apps if a != "ph_core"]
        warnungen.append(f"Workflow State '{st}' ist Core-Fixture, zusätzlich definiert in {andere} – dort entfernen" + (f" (Style-Konflikt: {sorted(styles)})" if len(styles) > 1 else ""))
    elif len(apps) > 1:
        warnungen.append(f"Workflow State '{st}' in mehreren Apps: {apps}" + (f" mit Style-Konflikt {sorted(styles)}" if len(styles) > 1 else " (gleicher Style – eine App behält ihn, oder nach ph_core)"))
for ac, apps in sorted(wf_actions_def.items()):
    if "ph_core" in apps and len(apps) > 1:
        warnungen.append(f"Workflow Action '{ac}' ist Core-Fixture, zusätzlich definiert in {[a for a in apps if a != 'ph_core']} – dort entfernen")
    elif len(apps) > 1:
        warnungen.append(f"Workflow Action '{ac}' in mehreren Apps: {apps} – eine App behält sie oder nach ph_core")

# 6. Link-Ziele gegen DocType-Besitz-Index und required_apps
def transitiv(app, gesehen=None):
    gesehen = gesehen if gesehen is not None else set()
    for r in required_apps.get(app, []):
        if r not in gesehen:
            gesehen.add(r)
            transitiv(r, gesehen)
    return gesehen


for app, rel, feld, ziel in link_ziele:
    besitzer = doctype_besitz.get(ziel)
    if not besitzer:
        if ziel.startswith("PH "):
            fehler.append(f"{rel}: '{feld}' zeigt auf '{ziel}', das keine App definiert")
        elif ziel in ERPNEXT_DOCTYPES:
            warnungen.append(f"{rel}: '{feld}' zeigt auf ERPNext-DocType '{ziel}' (nicht installiert)")
        continue
    erlaubt = {app, *required_apps.get(app, [])}
    if not any(b in erlaubt for b in besitzer):
        if any(b in transitiv(app) for b in besitzer):
            warnungen.append(f"{rel}: '{feld}' → '{ziel}' ({'/'.join(besitzer)}) – nur transitiv erreichbar; App in required_apps von {app} aufnehmen (CONVENTIONS 10)")
        else:
            warnungen.append(f"{rel}: '{feld}' → '{ziel}' ({'/'.join(besitzer)}) – HART: App nicht in required_apps von {app} {sorted(required_apps.get(app, []))} und wird später installiert")

# 7. required_apps konsistent mit Installationsreihenfolge (keine Abhängigkeit auf spätere App)
for app, reqs in required_apps.items():
    if app not in APP_REIHENFOLGE:
        continue
    for r in reqs:
        if r in APP_REIHENFOLGE and APP_REIHENFOLGE.index(r) > APP_REIHENFOLGE.index(app):
            fehler.append(f"{app}: required_apps enthält '{r}', das erst später installiert wird (PLAN.md Reihenfolge)")
        if r not in APP_REIHENFOLGE and r != "frappe":
            fehler.append(f"{app}: required_apps enthält unbekannte App '{r}'")

# 8. Druckformate: ph_basis.html direkt oder über eingebundene Teilvorlage
for app, name, html in print_formats:
    erbt = 'extends "templates/print/ph_basis.html"' in html
    for inc in re.findall(r'include\s+"(templates/print/[^"]+)"', html):
        if inc not in templates:
            fehler.append(f"{app}: Print Format '{name}' bindet fehlende Vorlage '{inc}' ein")
        else:
            erbt = True  # Teilvorlage existiert; ob sie erbt, prüft der nächste Block
    if not erbt and not any(k in (name or "") for k in PRINT_OHNE_BASIS_OK):
        warnungen.append(f"{app}: Print Format '{name}' erbt nicht von templates/print/ph_basis.html (CONVENTIONS 9)")
for app in APP_REIHENFOLGE:
    ordner = os.path.join(ROOT, app, app, "templates", "print")
    if not os.path.isdir(ordner) or app == "ph_core":
        continue
    for fn in os.listdir(ordner):
        if fn.endswith(".html"):
            with open(os.path.join(ordner, fn), encoding="utf-8") as f:
                inhalt = f.read()
            eigenstaendig = "<html" in inhalt.lower() or "<!doctype" in inhalt.lower() or "{% block inhalt" in inhalt
            if eigenstaendig and 'extends "templates/print/ph_basis.html"' not in inhalt and not any(k.lower() in fn.lower() for k in PRINT_OHNE_BASIS_OK):
                warnungen.append(f"{app}: templates/print/{fn} erbt nicht von ph_basis.html")

# ── Ausgabe ─────────────────────────────────────────────────────────────────────────────────────
print(f"geprüft: {py} Python-Dateien, {js} JSON-Dateien, {len(doctype_besitz)} DocTypes, {len(rollen_definiert)} Rollen, {len(link_ziele)} Verknüpfungen unter {ROOT}")
if warnungen:
    print(f"\n{len(warnungen)} WARNUNG(EN) – andere Apps betreffend (INTEGRATION-BEFUNDE-CORE.md):")
    print("\n".join(f"WARNUNG {x}" for x in warnungen))
if fehler:
    print(f"\n{len(fehler)} FEHLER:")
    print("\n".join(f"FEHLER {x}" for x in fehler))
    sys.exit(1)
if STRENG and warnungen:
    print("\n--streng: Warnungen gelten als Fehler")
    sys.exit(1)
print("\nOK – keine Fehler" + (f" ({len(warnungen)} Warnungen)" if warnungen else ""))
