"""Vertragsprüfung über alle PH-Apps (statisch, ohne Frappe/Bench).

Aufruf:  python -I Backend-Import/tools/contracts.py [--json] [--app ph_x] [--kategorie a,b,…] [--warnungen]

Kategorien (Buchstaben wie im Integrationsauftrag):
  a  DocType-Index: Link/Table/Dynamic-Link-Ziele, Custom-Field-/Property-Setter-/Client-Script-Fixtures
  b  Cross-App-Aufrufe: get_attr/enqueue/call/xcall, Imports, method: "…" in JS, Scheduler, doc_events, Jinja –
     Ziel vorhanden, whitelisted, Signatur passt
  c  Feldnamen-Zugriffe (get_value/get_all/set_value/get_doc/new_doc, JS frm.doc/set_value) gegen DocType-JSON
  d  Workflow State / Workflow Action Master über Apps (Doppelungen, Stil-Konflikte, fehlende Definitionen)
  e  Rollen in Permissions/Workflows/Fixtures/Code gegen Rollen-Fixtures
  f  required_apps vs. tatsächliche Abhängigkeiten, Zyklen, Installationsreihenfolge
  g  pyproject-Abhängigkeiten vs. Imports (stripe, qrcode, …)

Exit-Code 1 bei Fehlern. Warnungen sind Hinweise, die begründet bleiben dürfen (INTEGRATION-BERICHT).
"""

from __future__ import annotations

import ast
import json
import os
import re
import sys
import tomllib
from collections import defaultdict
from dataclasses import dataclass, field

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INSTALL_ORDER = [
    "ph_core", "ph_crm", "ph_sortiment", "ph_projekte", "ph_shop", "ph_faktura",
    "ph_logistik", "ph_personal", "ph_marketing", "ph_kassa", "ph_service",
]

# Frappe-Standard-DocTypes, auf die PH-Apps verlinken dürfen (ohne ERPNext).
FRAPPE_DOCTYPES = {
    "User", "Role", "File", "Contact", "Address", "Country", "Currency", "Language", "Email Template", "ToDo", "Event",
    "Communication", "Workflow", "Workflow State", "Workflow Action Master", "Workflow Action", "DocType", "Module Def",
    "Print Format", "Letter Head", "Email Account", "Email Queue", "Comment", "Tag", "Note", "Notification", "Web Page",
    "Website Settings", "System Settings", "Number Card", "Dashboard Chart", "Report", "Page", "Kanban Board", "Workspace",
    "Custom Field", "Property Setter", "Client Script", "Server Script", "Custom DocPerm", "DocPerm", "DocField",
    "Activity Log", "Error Log", "Version", "Newsletter", "Email Group", "Email Group Member", "Contact Email",
    "Contact Phone", "Web Form", "Webhook", "Scheduled Job Type", "Translation", "Gender", "Salutation", "Deleted Document",
    "Has Role", "User Permission", "Document Naming Rule", "Series", "Auto Repeat", "Assignment Rule", "Energy Point Log",
    "Prepared Report", "Data Import", "Website Theme", "Blog Post", "Access Log", "Integration Request", "Calendar View",
    "Document Share", "Route History", "Email Unsubscribe", "Unhandled Email", "Notification Log", "System Console",
    "Dashboard", "Onboarding Step", "Module Onboarding", "Form Tour", "Domain", "Portal Settings", "Web Template",
    "Website Slideshow", "Installed Application", "Package", "Log Settings", "Session Default", "Recorder",
    "Global Search Settings", "Website Script", "Website Route Meta", "Company",  # Company nur in Jinja-Platzhaltern
}
# Standardfelder jeder Tabelle (frappe.model.default_fields + child_table_fields + optional_fields)
STANDARD_FIELDS = {
    "name", "owner", "creation", "modified", "modified_by", "docstatus", "idx", "parent", "parentfield", "parenttype",
    "_user_tags", "_comments", "_assign", "_liked_by", "_seen", "doctype", "amended_from", "naming_series", "*",
}
# Attribute/Methoden von frappe.model.document.Document, die kein Feld sind
DOCUMENT_API = {
    "save", "insert", "submit", "cancel", "delete", "reload", "append", "extend", "remove", "get", "set", "update",
    "db_set", "db_update", "db_insert", "flags", "meta", "as_dict", "as_json", "run_method", "check_permission",
    "has_permission", "add_comment", "add_tag", "remove_tag", "get_tags", "notify_update", "is_new", "get_doc_before_save",
    "has_value_changed", "load_from_db", "get_title", "get_url", "set_onload", "get_onload", "queue_action",
    "run_notifications", "get_all_children", "get_value", "get_valid_dict", "validate", "before_save", "before_insert",
    "after_insert", "on_update", "on_submit", "on_cancel", "on_trash", "after_delete", "before_submit", "before_cancel",
    "set_user_and_timestamp", "set_docstatus", "set_new_name", "set_title_field", "set_parent_in_children", "set_name_in_children",
    "get_latest", "check_if_latest", "check_docstatus_transition", "update_children", "update_child_table", "rename",
    "add_viewed", "add_seen", "reset_seen", "run_before_save_methods", "run_post_save_methods", "lock", "unlock",
    "round_floats_in", "get_signature", "get_liked_by", "set_indicator", "get_invalid_links", "validate_value",
    "precision", "get_formatted", "get_field", "get_parentfield_of_doctype", "get_table_field_doctype", "set_fetch_from_value",
    "copy_attachments_from_amended_from", "fix_numeric_types", "get_db_value", "db_get", "get_assigned_users",
    "apply_fetch_from", "validate_workflow", "validate_update_after_submit", "ignore_in_setter", "init_child_tables",
    "init_valid_columns", "is_child_table_same", "get_all_children", "get_children", "ignore_permissions", "docname",
    "get_permlevel_access", "has_permlevel_access_to", "get_doc_before_save", "send_mail", "add_subscriber",
    "get_latest", "as_dict", "get_docinfo", "get_assigned_users", "add_assign", "get_url", "in_format_data",
    "get_url", "get_formatted", "flags", "__dict__", "run_trigger", "set_user_and_timestamp", "update_if_missing",
    "save_version", "deferred_insert", "get_title", "__class__", "set_title", "throw", "queue_action",
    "submit_or_cancel", "db_set_single", "get_last_doc", "load_doc_before_save", "_doc_before_save", "_action",
    "get_lock", "run_before_validate", "is_locked", "get_latest", "autoname", "modified", "workflow_state",
}
JS_FORM_EVENTS = {
    "setup", "onload", "refresh", "validate", "before_save", "after_save", "before_submit", "on_submit", "before_cancel",
    "after_cancel", "before_discard", "after_discard", "onload_post_render", "timeline_refresh", "before_load", "on_update",
    "before_workflow_action", "after_workflow_action", "before_print", "on_tab_change",
}
FRAPPE_STD_ROLES = {
    "System Manager", "Administrator", "Guest", "All", "Desk User", "Website Manager", "Blogger", "Report Manager",
    "Script Manager", "Dashboard Manager", "Workspace Manager", "Newsletter Manager", "Inbox User", "Translator",
    "Knowledge Base Editor", "Knowledge Base Contributor", "Prepared Report User", "Accounts Manager",
}
# Pakete, die Frappe v15/v16 selbst mitbringt (keine eigene pyproject-Abhängigkeit nötig)
FRAPPE_PROVIDED = {
    "requests", "cryptography", "pytz", "dateutil", "jinja2", "PIL", "lxml", "bleach", "babel", "markdown2", "pypdf",
    "redis", "click", "werkzeug", "croniter", "email_reply_parser", "phonenumbers", "pyotp", "png", "xlrd", "openpyxl",
    "num2words", "bs4", "semantic_version", "passlib", "psutil", "rq", "zxcvbn", "ldap3", "oauthlib", "requests_oauthlib",
    "pydantic", "markdownify", "html2text", "chardet", "dropbox", "boto3", "tenacity", "RestrictedPython", "sqlparse",
    "PyPDF2", "pyqrcode",  # pyqrcode: Frappe-Abhängigkeit, gemeinsame SVG-QR-Bibliothek (Core ph_qr_svg)
}
IMPORT_TO_PACKAGE = {"PIL": "pillow", "dateutil": "python-dateutil", "jwt": "pyjwt", "yaml": "pyyaml", "bs4": "beautifulsoup4", "png": "pypng"}
STDLIB = set(sys.stdlib_module_names)
ROLE_RE = re.compile(r"^PH [A-ZÄÖÜ][\wäöüÄÖÜß\- ]*$")
ROLE_WORDS = ("Mitarbeiter", "Leitung", "Geschäftsführung", "Backoffice-Admin", "Website Integration", "Buchhaltung", "Techniker", "Montage", "Verkauf", "Selbstservice")


@dataclass
class DocTypeInfo:
    name: str
    app: str
    module: str
    path: str
    fields: dict = field(default_factory=dict)  # fieldname -> field dict
    istable: bool = False
    issingle: bool = False
    is_submittable: bool = False
    autoname: str = ""
    permissions: list = field(default_factory=list)
    custom_fields: dict = field(default_factory=dict)  # fieldname -> (app, fielddict)

    def all_fields(self):
        return set(self.fields) | set(self.custom_fields) | STANDARD_FIELDS

    def has_field(self, fn):
        return fn in self.fields or fn in self.custom_fields or fn in STANDARD_FIELDS


@dataclass
class FuncInfo:
    module: str
    name: str
    node: ast.AST
    whitelisted: bool = False
    is_method: bool = False
    decorators: list = field(default_factory=list)


class Pruefung:
    def __init__(self):
        self.befunde = []  # (kategorie, stufe, app, ort, text)
        self.apps = {}  # app -> dict(hooks)
        self.doctypes: dict[str, DocTypeInfo] = {}
        self.modules: dict[str, ast.Module] = {}  # dotted module -> AST
        self.module_files: dict[str, str] = {}
        self.funcs: dict[str, FuncInfo] = {}  # dotted path (module.func or module.Class.method)
        self.module_names: dict[str, set] = {}  # dotted module -> top-level names
        self.roles_defined: dict[str, str] = {}  # role -> app
        self.workflow_states: dict[str, list] = defaultdict(list)  # name -> [(app, style)]
        self.workflow_actions: dict[str, list] = defaultdict(list)
        self.workflows: dict[str, list] = {}  # document_type -> [(app, workflow doc)]
        self.custom_fields_by_dt = defaultdict(list)  # dt -> [(app, cf)]
        self.required: dict[str, list] = {}
        self.deps_found: dict[str, dict] = defaultdict(lambda: defaultdict(set))  # app -> dep_app -> {reasons}
        self.pyproject_deps: dict[str, set] = {}
        self.third_party_imports: dict[str, dict] = defaultdict(dict)  # app -> pkg -> (optional, ort)
        self.controller_attrs: dict[str, set] = defaultdict(set)  # DocType -> Methoden/Attribute des Controllers

    # ------------------------------------------------------------------ Hilfen
    def melde(self, kat, stufe, app, ort, text):
        self.befunde.append((kat, stufe, app, ort, text))

    def fehler(self, kat, app, ort, text):
        self.melde(kat, "FEHLER", app, ort, text)

    def warnung(self, kat, app, ort, text):
        self.melde(kat, "WARNUNG", app, ort, text)

    def rel(self, path):
        return os.path.relpath(path, ROOT).replace("\\", "/")

    def app_of_doctype(self, dt):
        info = self.doctypes.get(dt)
        return info.app if info else None

    def transitive_required(self, app):
        seen, stack = set(), list(self.required.get(app, []))
        while stack:
            a = stack.pop()
            if a in seen or a == "frappe":
                continue
            seen.add(a)
            stack.extend(self.required.get(a, []))
        return seen

    # ------------------------------------------------------------- Einlesen
    def lade_apps(self):
        for app in sorted(os.listdir(ROOT)):
            hooks = os.path.join(ROOT, app, app, "hooks.py")
            if not app.startswith("ph_") or not os.path.isfile(hooks):
                continue
            ns = {"__file__": hooks, "__name__": f"{app}.hooks"}
            try:
                with open(hooks, encoding="utf-8") as f:
                    exec(compile(f.read(), hooks, "exec"), ns)  # eigene Dateien, keine Fremddaten
            except Exception as e:  # noqa: BLE001
                self.fehler("f", app, self.rel(hooks), f"hooks.py nicht ausführbar: {e}")
                ns = {}
            self.apps[app] = ns
            self.required[app] = [a for a in ns.get("required_apps", []) if a != "frappe"]
            pp = os.path.join(ROOT, app, "pyproject.toml")
            deps = set()
            if os.path.isfile(pp):
                try:
                    with open(pp, "rb") as f:
                        data = tomllib.load(f)
                    for d in data.get("project", {}).get("dependencies", []):
                        deps.add(re.split(r"[<>=!~\[; ]", d.strip(), 1)[0].lower())
                except Exception as e:  # noqa: BLE001
                    self.fehler("g", app, self.rel(pp), f"pyproject.toml ungültig: {e}")
            self.pyproject_deps[app] = deps

    def lade_doctypes(self):
        for app in self.apps:
            for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, app, app)):
                dirnames[:] = [d for d in dirnames if d not in ("__pycache__", "node_modules")]
                if os.path.basename(os.path.dirname(dirpath)) != "doctype":
                    continue
                for fn in filenames:
                    if not fn.endswith(".json"):
                        continue
                    path = os.path.join(dirpath, fn)
                    try:
                        with open(path, encoding="utf-8") as f:
                            data = json.load(f)
                    except Exception:  # noqa: BLE001
                        continue
                    if not isinstance(data, dict) or data.get("doctype") != "DocType":
                        continue
                    name = data.get("name")
                    if name in self.doctypes:
                        self.fehler("a", app, self.rel(path), f"DocType '{name}' doppelt (auch in {self.doctypes[name].app})")
                        continue
                    self.doctypes[name] = DocTypeInfo(
                        name=name, app=app, module=data.get("module", ""), path=self.rel(path),
                        fields={f["fieldname"]: f for f in data.get("fields", []) if f.get("fieldname")},
                        istable=bool(data.get("istable")), issingle=bool(data.get("issingle")),
                        is_submittable=bool(data.get("is_submittable")), autoname=data.get("autoname") or "",
                        permissions=data.get("permissions", []),
                    )

    def lade_fixtures(self):
        for app in self.apps:
            fdir = os.path.join(ROOT, app, app, "fixtures")
            if not os.path.isdir(fdir):
                continue
            for fn in sorted(os.listdir(fdir)):
                if not fn.endswith(".json"):
                    continue
                path = os.path.join(fdir, fn)
                try:
                    with open(path, encoding="utf-8") as f:
                        docs = json.load(f)
                except Exception:  # noqa: BLE001
                    continue
                if not isinstance(docs, list):
                    continue
                for d in docs:
                    if not isinstance(d, dict):
                        continue
                    dt = d.get("doctype")
                    ort = f"{self.rel(path)}:{d.get('name') or d.get('fieldname') or ''}"
                    if dt == "Role":
                        self.roles_defined.setdefault(d.get("role_name") or d.get("name"), app)
                    elif dt == "Workflow State":
                        self.workflow_states[d.get("name") or d.get("workflow_state_name")].append((app, d.get("style") or "", ort))
                    elif dt == "Workflow Action Master":
                        self.workflow_actions[d.get("name") or d.get("workflow_action_name")].append((app, ort))
                    elif dt == "Workflow":
                        self.workflows.setdefault(d.get("document_type"), []).append((app, d, ort))
                    elif dt == "Custom Field":
                        self.custom_fields_by_dt[d.get("dt")].append((app, d, ort))

        # Custom Fields in den Index übernehmen (Kollisionen prüfen)
        for dt, lst in self.custom_fields_by_dt.items():
            info = self.doctypes.get(dt)
            if not info and dt not in FRAPPE_DOCTYPES:
                for app, d, ort in lst:
                    self.fehler("a", app, ort, f"Custom Field '{d.get('fieldname')}' zeigt auf unbekannten DocType '{dt}'")
                continue
            seen = {}
            for app, d, ort in lst:
                fn = d.get("fieldname")
                if not fn:
                    self.fehler("a", app, ort, f"Custom Field auf '{dt}' ohne fieldname")
                    continue
                if info and fn in info.fields:
                    self.fehler("a", app, ort, f"Custom Field '{fn}' kollidiert mit Standardfeld von '{dt}' ({info.app})")
                if fn in seen:
                    self.fehler("a", app, ort, f"Custom Field '{dt}.{fn}' doppelt definiert (auch {seen[fn]})")
                seen[fn] = app
                if info:
                    info.custom_fields[fn] = (app, d)
                if info and info.app != app:
                    self.deps_found[app][info.app].add(f"Custom Field {dt}.{fn}")
                if d.get("fieldtype") in ("Link", "Table", "Table MultiSelect"):
                    self._pruefe_ziel(app, ort, d.get("options"), f"Custom Field {dt}.{fn}")
                if d.get("insert_after") and info and not info.has_field(d["insert_after"]) and d["insert_after"] not in info.custom_fields:
                    self.warnung("a", app, ort, f"Custom Field '{dt}.{fn}': insert_after '{d['insert_after']}' existiert nicht in '{dt}'")

    def lade_module(self):
        for app in self.apps:
            base = os.path.join(ROOT, app)
            for dirpath, dirnames, filenames in os.walk(base):
                dirnames[:] = [d for d in dirnames if d not in ("__pycache__", "node_modules", ".git")]
                for fn in filenames:
                    if not fn.endswith(".py"):
                        continue
                    path = os.path.join(dirpath, fn)
                    relmod = os.path.relpath(path, base).replace("\\", "/")[:-3]
                    if relmod.endswith("/__init__"):
                        relmod = relmod[: -len("/__init__")]
                    dotted = relmod.replace("/", ".")
                    try:
                        with open(path, encoding="utf-8") as f:
                            tree = ast.parse(f.read(), filename=path)
                    except SyntaxError as e:
                        self.fehler("b", app, self.rel(path), f"Syntaxfehler: {e}")
                        continue
                    self.modules[dotted] = tree
                    self.module_files[dotted] = path
                    names = set()
                    for node in tree.body:
                        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            names.add(node.name)
                            self.funcs[f"{dotted}.{node.name}"] = FuncInfo(dotted, node.name, node, self._whitelisted(node), False, self._decos(node))
                        elif isinstance(node, ast.ClassDef):
                            names.add(node.name)
                            for sub in node.body:
                                if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)):
                                    self.funcs[f"{dotted}.{node.name}.{sub.name}"] = FuncInfo(dotted, sub.name, sub, self._whitelisted(sub), True, self._decos(sub))
                        elif isinstance(node, (ast.Assign, ast.AnnAssign)):
                            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                            for t in targets:
                                for n in ast.walk(t):
                                    if isinstance(n, ast.Name):
                                        names.add(n.id)
                        elif isinstance(node, (ast.Import, ast.ImportFrom)):
                            for a in node.names:
                                names.add((a.asname or a.name).split(".")[0])
                        elif isinstance(node, ast.Try):
                            for sub in node.body + [h for hh in node.handlers for h in hh.body]:
                                if isinstance(sub, (ast.Import, ast.ImportFrom)):
                                    for a in sub.names:
                                        names.add((a.asname or a.name).split(".")[0])
                                elif isinstance(sub, (ast.FunctionDef, ast.ClassDef)):
                                    names.add(sub.name)
                                elif isinstance(sub, ast.Assign):
                                    for t in sub.targets:
                                        if isinstance(t, ast.Name):
                                            names.add(t.id)
                    self.module_names[dotted] = names

    def lade_controller_attrs(self):
        """Methoden, Properties und self.x-Attribute der Controller-Klassen (sind keine Felder, aber erlaubt)."""
        def sammle(name, node):
            for sub in ast.walk(node):
                if isinstance(sub, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    self.controller_attrs[name].add(sub.name)
                elif isinstance(sub, ast.Attribute) and isinstance(sub.value, ast.Name) and sub.value.id == "self" and isinstance(sub.ctx, ast.Store):
                    self.controller_attrs[name].add(sub.attr)
            for sub in node.body:
                if isinstance(sub, ast.Assign):
                    for t in sub.targets:
                        if isinstance(t, ast.Name):
                            self.controller_attrs[name].add(t.id)

        for name, info in self.doctypes.items():
            pyfile = info.path[:-5] + ".py"
            dotted = pyfile.split("/", 1)[1][:-3].replace("/", ".")
            tree = self.modules.get(dotted)
            if tree is None:
                continue
            for node in tree.body:
                if isinstance(node, ast.ClassDef):
                    sammle(name, node)
                    for b in node.bases:
                        bn = ast.unparse(b).split(".")[-1]
                        if bn == "Document":
                            continue
                        for m2, t2 in self.modules.items():
                            if not m2.startswith(info.app + "."):
                                continue
                            for n2 in t2.body:
                                if isinstance(n2, ast.ClassDef) and n2.name == bn:
                                    sammle(name, n2)

    @staticmethod
    def _decos(node):
        out = []
        for d in node.decorator_list:
            out.append(ast.unparse(d))
        return out

    @staticmethod
    def _whitelisted(node):
        for d in node.decorator_list:
            s = ast.unparse(d)
            if "whitelist" in s:
                return True
        return False

    # ------------------------------------------------------- Auflösung Pfade
    def resolve(self, dotted):
        """Dotted Pfad → (FuncInfo | 'module' | 'class' | 'name' | None, modul)."""
        parts = dotted.split(".")
        for i in range(len(parts), 0, -1):
            mod = ".".join(parts[:i])
            if mod in self.modules:
                rest = parts[i:]
                if not rest:
                    return "module", mod
                key = f"{mod}.{'.'.join(rest)}"
                if key in self.funcs:
                    return self.funcs[key], mod
                if len(rest) == 1 and rest[0] in self.module_names[mod]:
                    return "name", mod
                if len(rest) == 2 and rest[0] in self.module_names[mod]:
                    return "name", mod  # Klassenattribut / Methodenname nicht gefunden → tolerant
                return None, mod
        return None, None

    def _pruefe_ziel(self, app, ort, ziel, kontext):
        if not ziel:
            self.fehler("a", app, ort, f"{kontext}: Link/Table ohne options")
            return
        if ziel in self.doctypes:
            owner = self.doctypes[ziel].app
            if owner != app:
                self.deps_found[app][owner].add(kontext)
            return
        if ziel in FRAPPE_DOCTYPES:
            return
        self.fehler("a", app, ort, f"{kontext}: Ziel-DocType '{ziel}' existiert weder in der PH-Familie noch in Frappe-Standard")

    # ---------------------------------------------------------- Kategorie a
    def pruefe_doctypes(self):
        for name, info in self.doctypes.items():
            for fn, f in info.fields.items():
                ft = f.get("fieldtype")
                if ft in ("Link", "Table", "Table MultiSelect"):
                    self._pruefe_ziel(info.app, f"{info.path}:{fn}", f.get("options"), f"{name}.{fn} ({ft})")
                    if ft in ("Table", "Table MultiSelect") and f.get("options") in self.doctypes and not self.doctypes[f["options"]].istable:
                        self.fehler("a", info.app, f"{info.path}:{fn}", f"{name}.{fn}: Kindtabelle '{f['options']}' ist nicht istable")
                elif ft == "Dynamic Link":
                    ref = f.get("options")
                    if not ref or ref not in info.fields:
                        self.fehler("a", info.app, f"{info.path}:{fn}", f"{name}.{fn}: Dynamic Link verweist auf fehlendes Feld '{ref}'")
                    else:
                        rf = info.fields[ref]
                        if rf.get("fieldtype") == "Link" and rf.get("options") != "DocType":
                            self.fehler("a", info.app, f"{info.path}:{fn}", f"{name}.{fn}: Dynamic-Link-Paar '{ref}' muss Link auf DocType sein (ist {rf.get('options')})")
                        elif rf.get("fieldtype") == "Select":
                            for opt in (rf.get("options") or "").splitlines():
                                opt = opt.strip()
                                if opt and opt not in self.doctypes and opt not in FRAPPE_DOCTYPES:
                                    self.fehler("a", info.app, f"{info.path}:{ref}", f"{name}.{ref}: Dynamic-Link-Option '{opt}' ist kein bekannter DocType")
                                elif opt in self.doctypes and self.doctypes[opt].app != info.app:
                                    self.deps_found[info.app][self.doctypes[opt].app].add(f"Dynamic Link {name}.{ref}")
                        elif rf.get("fieldtype") not in ("Link", "Select", "Data"):
                            self.warnung("a", info.app, f"{info.path}:{fn}", f"{name}.{fn}: Dynamic-Link-Paar '{ref}' hat Typ {rf.get('fieldtype')}")
                if f.get("fetch_from"):
                    src, _, srcfield = f["fetch_from"].partition(".")
                    sf = info.fields.get(src) or (info.custom_fields.get(src) or (None, None))[1]
                    if not sf:
                        self.fehler("a", info.app, f"{info.path}:{fn}", f"{name}.{fn}: fetch_from-Quelle '{src}' fehlt")
                    elif sf.get("fieldtype") == "Link" and sf.get("options") in self.doctypes:
                        if not self.doctypes[sf["options"]].has_field(srcfield):
                            self.fehler("c", info.app, f"{info.path}:{fn}", f"{name}.{fn}: fetch_from '{f['fetch_from']}' – Feld '{srcfield}' fehlt in '{sf['options']}'")
            # Serien im Namen
            if info.autoname.startswith("naming_series:") and "naming_series" not in info.fields:
                self.fehler("a", info.app, info.path, f"{name}: autoname naming_series ohne Feld naming_series")

        # Fixture-Ziele
        for app in self.apps:
            fdir = os.path.join(ROOT, app, app, "fixtures")
            if not os.path.isdir(fdir):
                continue
            for fn in sorted(os.listdir(fdir)):
                if not fn.endswith(".json"):
                    continue
                path = os.path.join(fdir, fn)
                try:
                    with open(path, encoding="utf-8") as f:
                        docs = json.load(f)
                except Exception:  # noqa: BLE001
                    continue
                for d in docs if isinstance(docs, list) else []:
                    dt = d.get("doctype")
                    ort = f"{self.rel(path)}:{d.get('name') or ''}"
                    ziel = None
                    if dt == "Property Setter":
                        ziel = d.get("doc_type")
                        if ziel in self.doctypes and d.get("doctype_or_field") == "DocField" and not self.doctypes[ziel].has_field(d.get("field_name") or ""):
                            self.fehler("a", app, ort, f"Property Setter: Feld '{d.get('field_name')}' fehlt in '{ziel}'")
                    elif dt == "Client Script":
                        ziel = d.get("dt")
                    elif dt == "Kanban Board":
                        ziel = d.get("reference_doctype")
                        if ziel in self.doctypes and d.get("field_name") and not self.doctypes[ziel].has_field(d["field_name"]):
                            self.fehler("c", app, ort, f"Kanban Board: field_name '{d['field_name']}' fehlt in '{ziel}'")
                    elif dt in ("Dashboard Chart", "Number Card"):
                        ziel = d.get("document_type")
                        if ziel in self.doctypes:
                            for key in ("based_on", "value_based_on", "group_by_based_on", "aggregate_function_based_on", "timeseries_field"):
                                if d.get(key) and not self.doctypes[ziel].has_field(d[key]):
                                    self.fehler("c", app, ort, f"{dt} '{d.get('name')}': Feld '{d[key]}' ({key}) fehlt in '{ziel}'")
                            try:
                                flt = json.loads(d.get("filters_json") or "[]")
                            except Exception:  # noqa: BLE001
                                flt = []
                            for row in flt if isinstance(flt, list) else []:
                                if isinstance(row, list) and len(row) >= 3:
                                    fdt, ffield = (row[0], row[1]) if len(row) >= 4 else (ziel, row[0])
                                    tinfo = self.doctypes.get(fdt)
                                    if tinfo and not tinfo.has_field(ffield):
                                        self.fehler("c", app, ort, f"{dt} '{d.get('name')}': Filterfeld '{ffield}' fehlt in '{fdt}'")
                        if d.get("method") and dt == "Number Card":
                            self._pruefe_aufruf_pfad(app, ort, d["method"], "Number Card method", whitelist=True)
                    elif dt == "Print Format":
                        ziel = d.get("doc_type")
                    elif dt == "Custom DocPerm":
                        ziel = d.get("parent")
                    elif dt == "Workflow":
                        ziel = d.get("document_type")
                    elif dt == "Workspace":
                        for s in d.get("shortcuts", []) or []:
                            if s.get("type") == "DocType" and s.get("link_to") and s["link_to"] not in self.doctypes and s["link_to"] not in FRAPPE_DOCTYPES:
                                self.fehler("a", app, ort, f"Workspace-Shortcut '{s.get('label')}' zeigt auf unbekannten DocType '{s['link_to']}'")
                        for ln in d.get("links", []) or []:
                            if ln.get("type") == "Link" and ln.get("link_type") == "DocType" and ln.get("link_to") and ln["link_to"] not in self.doctypes and ln["link_to"] not in FRAPPE_DOCTYPES:
                                self.fehler("a", app, ort, f"Workspace-Link '{ln.get('label')}' zeigt auf unbekannten DocType '{ln['link_to']}'")
                    if ziel is not None:
                        if ziel not in self.doctypes and ziel not in FRAPPE_DOCTYPES:
                            self.fehler("a", app, ort, f"{dt} zeigt auf unbekannten DocType '{ziel}'")
                        elif ziel in self.doctypes and self.doctypes[ziel].app != app:
                            self.deps_found[app][self.doctypes[ziel].app].add(f"{dt} auf {ziel}")
                    if dt == "Client Script" and d.get("script"):
                        self._pruefe_js_text(app, ort, d["script"], form_dt=d.get("dt"))
                    if dt == "Workflow":
                        for s in d.get("states", []):
                            if s.get("update_field") and ziel in self.doctypes and not self.doctypes[ziel].has_field(s["update_field"]):
                                self.fehler("c", app, ort, f"Workflow '{d.get('name')}': update_field '{s['update_field']}' fehlt in '{ziel}'")
                            if s.get("update_field") and ziel in self.doctypes and s.get("update_value") is not None:
                                fdef = self.doctypes[ziel].fields.get(s["update_field"])
                                if fdef and fdef.get("fieldtype") == "Select":
                                    opts = [o.strip() for o in (fdef.get("options") or "").splitlines()]
                                    if s["update_value"] not in opts:
                                        self.fehler("c", app, ort, f"Workflow '{d.get('name')}': update_value '{s['update_value']}' ist keine Select-Option von {ziel}.{s['update_field']}")
                        if d.get("workflow_state_field") and d["workflow_state_field"] != "workflow_state" and ziel in self.doctypes and not self.doctypes[ziel].has_field(d["workflow_state_field"]):
                            self.fehler("c", app, ort, f"Workflow '{d.get('name')}': workflow_state_field '{d['workflow_state_field']}' fehlt in '{ziel}'")
        # Reports
        for app in self.apps:
            for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, app, app)):
                dirnames[:] = [d for d in dirnames if d != "__pycache__"]
                if os.path.basename(os.path.dirname(dirpath)) not in ("report", "page"):
                    continue
                for fn in filenames:
                    if fn.endswith(".json"):
                        path = os.path.join(dirpath, fn)
                        try:
                            with open(path, encoding="utf-8") as f:
                                d = json.load(f)
                        except Exception:  # noqa: BLE001
                            continue
                        if d.get("doctype") == "Report":
                            ziel = d.get("ref_doctype")
                            if ziel and ziel not in self.doctypes and ziel not in FRAPPE_DOCTYPES:
                                self.fehler("a", app, self.rel(path), f"Report '{d.get('name')}': ref_doctype '{ziel}' unbekannt")
                            for r in d.get("roles", []):
                                self._pruefe_rolle(app, self.rel(path), r.get("role"))
                            if d.get("query"):
                                self._pruefe_sql(app, self.rel(path), d["query"])
                        elif d.get("doctype") == "Page":
                            for r in d.get("roles", []):
                                self._pruefe_rolle(app, self.rel(path), r.get("role"))

    # ---------------------------------------------------------- Kategorie b
    def _pruefe_aufruf_pfad(self, app, ort, pfad, kontext, whitelist=False, call=None, allow_missing_module=False):
        """Prüft, ob ein dotted Pfad in der Familie auflösbar ist; liefert FuncInfo oder None."""
        if not pfad or not re.match(r"^[A-Za-z_][\w]*(\.[\w]+)+$", pfad):
            return None
        top = pfad.split(".")[0]
        if top == "frappe" or top not in self.apps:
            if top.startswith("ph_"):
                self.fehler("b", app, ort, f"{kontext}: App '{top}' unbekannt ({pfad})")
            return None
        if top != app:
            self.deps_found[app][top].add(f"{kontext} {pfad}")
        res, mod = self.resolve(pfad)
        if res is None:
            if mod is None:
                self.fehler("b", app, ort, f"{kontext}: Modul für '{pfad}' nicht gefunden")
            else:
                self.fehler("b", app, ort, f"{kontext}: '{pfad}' – Funktion/Name fehlt in Modul {mod}")
            return None
        if isinstance(res, FuncInfo):
            if whitelist and not res.whitelisted:
                self.fehler("b", app, ort, f"{kontext}: '{pfad}' ist nicht @frappe.whitelist()")
            if call is not None:
                self._pruefe_signatur(app, ort, pfad, res, call, kontext)
            return res
        if res == "module" and call is not None:
            self.fehler("b", app, ort, f"{kontext}: '{pfad}' ist ein Modul, keine Funktion")
        return None

    def _pruefe_signatur(self, app, ort, pfad, fi: FuncInfo, call, kontext, skip_first=None):
        """call: ast.Call oder dict(pos=int, kw=set, spread=bool)."""
        node = fi.node
        a = node.args
        if isinstance(call, ast.Call):
            pos = len([x for x in call.args if not isinstance(x, ast.Starred)])
            spread = any(isinstance(x, ast.Starred) for x in call.args) or any(k.arg is None for k in call.keywords)
            kw = {k.arg for k in call.keywords if k.arg}
        else:
            pos, kw, spread = call["pos"], set(call["kw"]), call.get("spread", False)
        params = [p.arg for p in a.posonlyargs + a.args]
        if fi.is_method or (skip_first and params and params[0] in ("self", "cls")):
            if params and params[0] in ("self", "cls"):
                params = params[1:]
        if skip_first == "doc" and params and params[0] in ("doc", "self"):
            params = params[1:]
        kwonly = [p.arg for p in a.kwonlyargs]
        n_defaults = len(a.defaults)
        required_pos = params[: max(0, len(params) - n_defaults)]
        kw_defaults = {p.arg for p, d in zip(a.kwonlyargs, a.kw_defaults) if d is not None}
        required_kw = [p for p in kwonly if p not in kw_defaults]
        all_named = set(params) | set(kwonly)
        if pos > len(params) and not a.vararg:
            self.fehler("b", app, ort, f"{kontext}: '{pfad}' nimmt {len(params)} Positionsargumente, Aufruf übergibt {pos} (Signatur: {self._sig(fi)})")
        unknown = kw - all_named
        if unknown and not a.kwarg:
            self.fehler("b", app, ort, f"{kontext}: '{pfad}' kennt Argument(e) {sorted(unknown)} nicht (Signatur: {self._sig(fi)})")
        if not spread:
            missing = [p for p in required_pos[pos:] if p not in kw] + [p for p in required_kw if p not in kw]
            if missing:
                self.fehler("b", app, ort, f"{kontext}: '{pfad}' – Pflichtargument(e) {missing} fehlen (Signatur: {self._sig(fi)})")

    @staticmethod
    def _sig(fi: FuncInfo):
        a = fi.node.args
        parts = []
        n_def = len(a.defaults)
        pa = a.posonlyargs + a.args
        for i, p in enumerate(pa):
            if i >= len(pa) - n_def:
                parts.append(f"{p.arg}=…")
            else:
                parts.append(p.arg)
        if a.vararg:
            parts.append("*" + a.vararg.arg)
        elif a.kwonlyargs:
            parts.append("*")
        for p, d in zip(a.kwonlyargs, a.kw_defaults):
            parts.append(f"{p.arg}=…" if d is not None else p.arg)
        if a.kwarg:
            parts.append("**" + a.kwarg.arg)
        return f"{fi.name}({', '.join(parts)})"

    def pruefe_hooks(self):
        for app, ns in self.apps.items():
            ort = f"{app}/{app}/hooks.py"
            for key in ("after_install", "before_install", "after_migrate", "before_migrate", "boot_session"):
                v = ns.get(key)
                for p in ([v] if isinstance(v, str) else (v or [])):
                    self._pruefe_aufruf_pfad(app, ort, p, f"hooks.{key}")
            for ev, lst in (ns.get("scheduler_events") or {}).items():
                items = lst
                if ev == "cron":
                    items = [p for l in lst.values() for p in l]
                for p in items:
                    self._pruefe_aufruf_pfad(app, ort, p, f"scheduler_events[{ev}]")
            for dt, evs in (ns.get("doc_events") or {}).items():
                if dt != "*" and dt not in self.doctypes and dt not in FRAPPE_DOCTYPES:
                    self.fehler("b", app, ort, f"doc_events auf unbekannten DocType '{dt}'")
                elif dt in self.doctypes and self.doctypes[dt].app != app:
                    self.deps_found[app][self.doctypes[dt].app].add(f"doc_events {dt}")
                for ev, handlers in evs.items():
                    for p in ([handlers] if isinstance(handlers, str) else handlers):
                        fi = self._pruefe_aufruf_pfad(app, ort, p, f"doc_events[{dt}.{ev}]")
                        if fi and not fi.node.args.vararg:
                            n = len(fi.node.args.args) + len(fi.node.args.posonlyargs)
                            if n < 2 and not fi.node.args.kwarg:
                                self.fehler("b", app, ort, f"doc_events[{dt}.{ev}]: '{p}' braucht Signatur (doc, method), hat {self._sig(fi)}")
            for p in (ns.get("jinja") or {}).get("methods", []):
                self._pruefe_aufruf_pfad(app, ort, p, "jinja.methods")
            for p in (ns.get("jinja") or {}).get("filters", []):
                self._pruefe_aufruf_pfad(app, ort, p, "jinja.filters")
            for key in ("ph_stripe_art_handler", "ph_shop_rechnung_erstellen", "ph_shop_lieferschein_erstellen"):
                for p in ns.get(key) or []:
                    # ph_stripe_art_handler: Liste von {art: "dotted.path"} (ph_shop.stripe_webhook._fremd_handler)
                    for pfad in (p.values() if isinstance(p, dict) else [p]):
                        self._pruefe_aufruf_pfad(app, ort, pfad, f"hooks.{key}")
            for key in ("override_whitelisted_methods", "override_doctype_class"):
                for k, v in (ns.get(key) or {}).items():
                    self._pruefe_aufruf_pfad(app, ort, v, f"hooks.{key}[{k}]")
            for key in ("calendars",):
                for dt in ns.get(key) or []:
                    if dt not in self.doctypes:
                        self.fehler("a", app, ort, f"hooks.{key}: unbekannter DocType '{dt}'")
            for fx in ns.get("fixtures") or []:
                if isinstance(fx, dict) and fx.get("dt") in ("Workflow State", "Workflow Action Master", "Role") and fx.get("filters"):
                    for flt in fx["filters"]:
                        if len(flt) == 3 and flt[1] == "in":
                            for nm in flt[2]:
                                if fx["dt"] == "Workflow State" and nm not in self.workflow_states:
                                    self.warnung("d", app, ort, f"hooks.fixtures: Workflow State '{nm}' gefiltert, aber in keiner workflow_state.json definiert")
                                if fx["dt"] == "Workflow Action Master" and nm not in self.workflow_actions:
                                    self.warnung("d", app, ort, f"hooks.fixtures: Workflow Action Master '{nm}' gefiltert, aber in keiner workflow_action_master.json definiert")
                                if fx["dt"] == "Role" and nm not in self.roles_defined:
                                    self.fehler("e", app, ort, f"hooks.fixtures: Rolle '{nm}' gefiltert, aber nicht in role.json")

    # ------------------------------------------------------ Python-Analyse
    def pruefe_python(self):
        for dotted, tree in self.modules.items():
            app = dotted.split(".")[0]
            path = self.module_files[dotted]
            ort0 = self.rel(path)
            is_test = "/tests/" in ort0 or os.path.basename(path).startswith("test_")
            stufe = "WARNUNG" if is_test else "FEHLER"
            analyzer = PyAnalyzer(self, app, dotted, ort0, stufe)
            analyzer.visit(tree)
            # Drittpakete
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    if isinstance(node, ast.ImportFrom):
                        if node.level:
                            continue
                        tops = [(node.module or "").split(".")[0]]
                    else:
                        tops = [a.name.split(".")[0] for a in node.names]
                    for top in tops:
                        if not top or top in STDLIB or top == "frappe" or top in self.apps or top in ("__future__",):
                            if top in self.apps and top != app:
                                optional = analyzer.is_guarded(node)
                                self.deps_found[app][top].add(("Import (optional) " if optional else "Import ") + (node.module if isinstance(node, ast.ImportFrom) else top))
                                if not optional and top not in self.transitive_required(app) and top != "ph_core":
                                    self.fehler("f", app, f"{ort0}:{node.lineno}", f"unbedingter Import aus '{top}', das nicht in required_apps steht")
                            continue
                        optional = analyzer.is_guarded(node)
                        prev = self.third_party_imports[app].get(top)
                        if prev is None or (prev[0] and not optional):
                            self.third_party_imports[app][top] = (optional, f"{ort0}:{node.lineno}")

    # ---------------------------------------------------------- JS-Analyse
    def pruefe_js(self):
        for app in self.apps:
            for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, app, app)):
                dirnames[:] = [d for d in dirnames if d not in ("__pycache__", "node_modules")]
                for fn in filenames:
                    if fn.endswith(".js") or fn.endswith(".html"):
                        path = os.path.join(dirpath, fn)
                        with open(path, encoding="utf-8", errors="replace") as f:
                            text = f.read()
                        form_dt = None
                        if fn.endswith(".js") and os.path.basename(os.path.dirname(dirpath)) == "doctype":
                            dtname = fn[:-3].removesuffix("_list").removesuffix("_calendar").removesuffix("_tree").removesuffix("_dashboard")
                            for name, info in self.doctypes.items():
                                if os.path.basename(os.path.dirname(info.path)) == dtname and info.app == app:
                                    form_dt = name if not fn.endswith("_list.js") else None
                                    break
                        self._pruefe_js_text(app, self.rel(path), text, form_dt=form_dt)

    def _pruefe_js_text(self, app, ort, text, form_dt=None):
        # frappe.ui.form.on("DT", …) → Formular-DocType
        m = re.search(r"frappe\.ui\.form\.on\(\s*[\"']([^\"']+)[\"']", text)
        if m:
            form_dt = m.group(1)
            if form_dt not in self.doctypes and form_dt not in FRAPPE_DOCTYPES:
                self.fehler("a", app, ort, f"frappe.ui.form.on auf unbekannten DocType '{form_dt}'")
            elif form_dt in self.doctypes and self.doctypes[form_dt].app != app:
                self.deps_found[app][self.doctypes[form_dt].app].add(f"Client Script {form_dt}")
        # Methodenaufrufe
        for mm in re.finditer(r"(get_events_)?method\s*:\s*[\"']([\w.]+)[\"']", text):
            pfad = mm.group(2)
            obj = self._umschliessendes_objekt(text, mm.start())
            keys, unbekannt = self._js_args(obj)
            kw = None if unbekannt else keys
            if mm.group(1) or ort.endswith("_calendar.js"):
                kw = None  # Kalender: start/end/filters liefert Frappe
            doc_call = re.search(r"\bdoc\s*:\s*frm\.doc", obj or "") is not None
            if "." not in pfad:
                dt = form_dt
                if dt and dt in self.doctypes:
                    fi = self._finde_doc_methode(dt, pfad)
                    if not fi:
                        self.fehler("b", app, ort, f"Dokumentmethode '{pfad}' fehlt im Controller von '{dt}'")
                    else:
                        if not fi.whitelisted:
                            self.fehler("b", app, ort, f"Dokumentmethode '{dt}.{pfad}' ist nicht @frappe.whitelist()")
                        if kw is not None:
                            self._pruefe_signatur(app, ort, f"{dt}.{pfad}", fi, {"pos": 0, "kw": kw}, "frm.call")
                continue
            if pfad.startswith("frappe."):
                continue
            if pfad.split(".")[0] not in self.apps:
                continue
            call = {"pos": 0, "kw": kw or set(), "spread": kw is None}
            if doc_call:
                fi = self._pruefe_aufruf_pfad(app, ort, pfad, "JS method", whitelist=True)
                if fi:
                    self._pruefe_signatur(app, ort, pfad, fi, call, "JS method (doc)", skip_first="doc")
            else:
                self._pruefe_aufruf_pfad(app, ort, pfad, "JS method", whitelist=True, call=call)
        for mm in re.finditer(r"frappe\.(?:xcall|call)\(\s*[\"']([\w.]+)[\"']\s*(?:,\s*(\{))?", text):
            pfad = mm.group(1)
            if pfad.startswith("frappe."):
                continue
            kw = set()
            spread = False
            if mm.group(2):
                body = self._klammer_inhalt(text, mm.end() - 1)
                if body is not None:
                    kw, spread = self._js_keys(body)
            else:
                # Jinja/Python-Form: frappe.call("pfad", a=1, b=2)
                klammer = text[mm.end(): mm.end() + 400].split(")")[0]
                kw = set(re.findall(r",\s*([A-Za-z_]\w*)\s*=", klammer))
                if "**" in klammer or not kw:
                    spread = True
            self._pruefe_aufruf_pfad(app, ort, pfad, "frappe.call/xcall", whitelist=True, call={"pos": 0, "kw": kw, "spread": spread})
        for mm in re.finditer(r"frappe\.(?:set_route|new_doc)\(\s*(?:[\"']Form[\"']\s*,\s*)?[\"'](PH [^\"']+)[\"']", text):
            dt = mm.group(1)
            if dt not in self.doctypes:
                self.fehler("a", app, ort, f"JS verweist auf unbekannten DocType '{dt}'")
            elif self.doctypes[dt].app != app:
                self.deps_found[app][self.doctypes[dt].app].add(f"JS Route {dt}")
        # Feldzugriffe im Formular
        if form_dt and form_dt in self.doctypes:
            info = self.doctypes[form_dt]
            felder = set()
            for mm in re.finditer(r"\bfrm\.doc\.([a-z_][a-z0-9_]*)", text):
                felder.add(mm.group(1))
            for mm in re.finditer(r"\bfrm\.(?:set_value|set_df_property|toggle_display|toggle_reqd|toggle_enable|set_query|refresh_field|get_field|add_fetch)\(\s*[\"']([a-z_][a-z0-9_]*)[\"']", text):
                felder.add(mm.group(1))
            for mm in re.finditer(r"\bfrm\.set_query\(\s*[\"']([a-z_][a-z0-9_]*)[\"']\s*,\s*[\"']([a-z_][a-z0-9_]*)[\"']", text):
                # set_query(feld, kindtabelle, ...): Feld gehoert zur Kindtabelle
                felder.discard(mm.group(1))
                felder.add(mm.group(2))
                tdef = info.fields.get(mm.group(2)) or (info.custom_fields.get(mm.group(2)) or (None, {}))[1]
                child = tdef.get("options") if tdef else None
                if child in self.doctypes and not self.doctypes[child].has_field(mm.group(1)):
                    self.fehler("c", app, ort, f"JS set_query: Feld '{child}.{mm.group(1)}' existiert nicht")
            for mm in re.finditer(r"\bfrm\.fields_dict\.([a-z_][a-z0-9_]*)", text):
                felder.add(mm.group(1))
            for mm in re.finditer(r"\bfrm\.fields_dict\[\s*[\"']([a-z_][a-z0-9_]*)[\"']", text):
                felder.add(mm.group(1))
            for fnm in sorted(felder):
                if fnm.startswith("__") or fnm in ("letter_head", "select_print_heading", "language", "print_heading"):
                    continue
                if not info.has_field(fnm) and not (fnm == "workflow_state" and form_dt in self.workflows):
                    self.fehler("c", app, ort, f"JS greift auf Feld '{form_dt}.{fnm}' zu, das es nicht gibt")
        # frappe.db.get_value / get_list / set_value im JS
        for mm in re.finditer(r"frappe\.db\.(get_value|set_value|get_list|get_doc|exists|count|get_single_value)\(\s*[\"'](PH [^\"']+)[\"']\s*,", text):
            dt = mm.group(2)
            if dt not in self.doctypes:
                self.fehler("a", app, ort, f"JS frappe.db.{mm.group(1)} auf unbekannten DocType '{dt}'")
                continue
            if self.doctypes[dt].app != app:
                self.deps_found[app][self.doctypes[dt].app].add(f"JS frappe.db {dt}")
            segment = text[mm.end(): mm.end() + 600]
            felder = set()
            if mm.group(1) in ("get_value", "set_value", "get_single_value"):
                # dritter Parameter: "feld" | ["a","b"] | {feld: wert}
                rest = segment
                if mm.group(1) != "get_single_value":
                    # Namen überspringen (erstes Argument bis Komma auf Tiefe 0)
                    depth = 0
                    i = 0
                    while i < len(rest):
                        c = rest[i]
                        if c in "([{":
                            depth += 1
                        elif c in ")]}":
                            if depth == 0:
                                break
                            depth -= 1
                        elif c == "," and depth == 0:
                            rest = rest[i + 1:]
                            break
                        i += 1
                m3 = re.match(r"\s*([\"'])([a-z_][a-z0-9_]*)\1", rest)
                if m3:
                    felder.add(m3.group(2))
                m4 = re.match(r"\s*\[([^\]]*)\]", rest)
                if m4:
                    felder |= set(re.findall(r"[\"']([a-z_][a-z0-9_]*)[\"']", m4.group(1)))
                m5 = re.match(r"\s*\{([^}]*)\}", rest)
                if m5 and mm.group(1) == "set_value":
                    felder |= set(re.findall(r"(?:^|[,{]\s*)([a-z_][a-z0-9_]*)\s*:", m5.group(1)))
            else:
                fm = re.search(r"\bfields\s*:\s*\[([^\]]*)\]", segment)
                if fm:
                    felder |= set(re.findall(r"[\"']([a-z_][a-z0-9_]*)[\"']", fm.group(1)))
                fl = re.search(r"\bfilters\s*:\s*\{([^}]*)\}", segment)
                if fl:
                    felder |= set(re.findall(r"(?:^|[,{]\s*)([a-z_][a-z0-9_]*)\s*:", fl.group(1)))
            for fnm in felder:
                if not self.doctypes[dt].has_field(fnm) and not (fnm == "workflow_state" and dt in self.workflows):
                    self.fehler("c", app, ort, f"JS frappe.db.{mm.group(1)}: Feld '{dt}.{fnm}' existiert nicht")
        # Rollen im JS
        for mm in re.finditer(r"[\"'](PH [A-ZÄÖÜ][^\"']{2,40})[\"']", text):
            s = mm.group(1)
            if any(s.endswith(w) for w in ROLE_WORDS) and re.search(r"has_role|roles|user_roles|includes\(", text[max(0, mm.start() - 80): mm.end() + 40]):
                self._pruefe_rolle(app, ort, s)

    @staticmethod
    def _js_keys(body):
        """Schluessel eines JS-Objektliterals auf oberster Ebene (Tiefe 0), inkl. Shorthand { a, b }."""
        keys, depth, i, n = set(), 0, 0, len(body)
        spread = False
        erwarte_key = True
        while i < n:
            c = body[i]
            if c in "\"'`":
                q = c
                i += 1
                while i < n and body[i] != q:
                    if body[i] == "\\":
                        i += 1
                    i += 1
            elif c in "{[(":
                depth += 1
            elif c in "}])":
                depth -= 1
            elif depth == 0:
                if c == ",":
                    erwarte_key = True
                elif c == ":":
                    erwarte_key = False
                elif body.startswith("...", i):
                    spread = True
                    erwarte_key = False
                    i += 3
                    continue
                elif erwarte_key:
                    m = re.match(r"[A-Za-z_$][\w$]*", body[i:])
                    if m and not body[i:].startswith(("function", "async", "get ", "set ")):
                        keys.add(m.group(0))
                        i += len(m.group(0))
                        erwarte_key = False
                        continue
            i += 1
        return keys, spread

    def _umschliessendes_objekt(self, text, pos):
        depth, j = 0, pos - 1
        while j >= 0:
            c = text[j]
            if c in "}])":
                depth += 1
            elif c in "{[(":
                if depth == 0:
                    break
                depth -= 1
            j -= 1
        if j < 0 or text[j] != "{":
            return None
        return self._klammer_inhalt(text, j)

    def _js_args(self, body):
        """Schluessel des args-Objekts auf Tiefe 0 eines Objektliterals. Liefert (keys, unbekannt)."""
        if body is None:
            return set(), True
        depth, i, n = 0, 0, len(body)
        while i < n:
            c = body[i]
            if c in "\"'`":
                q = c
                i += 1
                while i < n and body[i] != q:
                    if body[i] == "\\":
                        i += 1
                    i += 1
            elif c in "{[(":
                depth += 1
            elif c in "}])":
                depth -= 1
            elif depth == 0 and body.startswith("args", i) and (i == 0 or not (body[i - 1].isalnum() or body[i - 1] in "_$.")):
                m = re.match(r"args\s*:\s*", body[i:])
                if m:
                    k = i + m.end()
                    if k < n and body[k] == "{":
                        inner = self._klammer_inhalt(body, k)
                        if inner is None:
                            return set(), True
                        return self._js_keys(inner)
                    return set(), True
            i += 1
        return set(), False

    @staticmethod
    def _klammer_inhalt(text, start):
        """text[start] ist '{' – liefert Inhalt bis zur passenden Klammer."""
        depth = 0
        for i in range(start, len(text)):
            c = text[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[start + 1: i]
        return None

    def _finde_doc_methode(self, dt, methode):
        info = self.doctypes.get(dt)
        if not info:
            return None
        pyfile = info.path[:-5] + ".py"
        dotted = pyfile.split("/", 1)[1][:-3].replace("/", ".")
        for key, fi in self.funcs.items():
            if fi.module == dotted and fi.is_method and fi.name == methode:
                return fi
        return None

    # ---------------------------------------------------------- Kategorie c (Python-Seite in PyAnalyzer)
    def pruefe_feld(self, app, ort, dt, feld, kontext, stufe="FEHLER"):
        """Feldname gegen DocType prüfen; tolerant bei Ausdrücken."""
        if not isinstance(feld, str):
            return
        info = self.doctypes.get(dt)
        if not info:
            return
        if info.app != app:
            self.deps_found[app][info.app].add(f"{kontext} {dt}")
        f = feld.strip()
        if not f or f == "*":
            return
        f = re.sub(r"\s+(?:as|AS)\s+\w+$", "", f)
        f = re.sub(r"\s+(?:asc|desc|ASC|DESC)$", "", f)
        if "`tab" in f or "(" in f or "." in f or " " in f or f.startswith("`"):
            # Ausdrücke: innere Spalten derselben Tabelle
            for col in re.findall(r"`tab([^`]+)`\.`?([a-z_][a-z0-9_]*)`?", f):
                t, c = col
                if t in self.doctypes and not self.doctypes[t].has_field(c) and not (c == "workflow_state" and t in self.workflows):
                    self.melde("c", stufe, app, ort, f"{kontext}: Spalte '{t}.{c}' existiert nicht")
            return
        if info.has_field(f):
            return
        if f == "workflow_state" and dt in self.workflows:
            return
        self.melde("c", stufe, app, ort, f"{kontext}: Feld '{dt}.{f}' existiert nicht")

    def _pruefe_sql(self, app, ort, sql, stufe="FEHLER"):
        for t, c in re.findall(r"`tab([^`]+)`\.`([a-z_][a-z0-9_]*)`", sql):
            if t in self.doctypes:
                if self.doctypes[t].app != app:
                    self.deps_found[app][self.doctypes[t].app].add(f"SQL {t}")
                if not self.doctypes[t].has_field(c) and not (c == "workflow_state" and t in self.workflows):
                    self.melde("c", stufe, app, ort, f"SQL: Spalte '{t}.{c}' existiert nicht")
        for t in re.findall(r"`tab([^`]+)`", sql):
            if t.startswith("PH ") and t not in self.doctypes:
                self.melde("a", stufe, app, ort, f"SQL: Tabelle 'tab{t}' – DocType unbekannt")

    # ---------------------------------------------------------- Kategorie d
    def pruefe_workflows(self):
        for name, lst in self.workflow_states.items():
            if len(lst) > 1:
                styles = {s for _, s, _ in lst}
                apps = sorted({a for a, _, _ in lst})
                if len(styles) > 1:
                    self.fehler("d", apps[0], lst[0][2], f"Workflow State '{name}' in {apps} mit unterschiedlichem style {sorted(styles)} – ein Besitzer, andere entfernen")
                else:
                    self.fehler("d", apps[0], lst[0][2], f"Workflow State '{name}' doppelt definiert in {apps} – ein Besitzer, andere aus Fixture entfernen")
        for name, lst in self.workflow_actions.items():
            if len(lst) > 1:
                apps = sorted({a for a, _ in lst})
                self.fehler("d", apps[0], lst[0][1], f"Workflow Action Master '{name}' doppelt definiert in {apps} – ein Besitzer, andere aus Fixture entfernen")
        # Workflows: referenzierte States/Actions müssen definiert und vorher installiert sein
        for dt, lst in self.workflows.items():
            if len(lst) > 1:
                self.fehler("d", lst[0][0], lst[0][2], f"Mehrere Workflows für '{dt}' in {[a for a, _, _ in lst]}")
            for app, wf, ort in lst:
                order_idx = INSTALL_ORDER.index(app) if app in INSTALL_ORDER else 99
                for s in wf.get("states", []):
                    st = s.get("state")
                    if st not in self.workflow_states:
                        self.fehler("d", app, ort, f"Workflow '{wf.get('name')}': State '{st}' in keiner workflow_state.json")
                    else:
                        owners = [a for a, _, _ in self.workflow_states[st]]
                        if not any(INSTALL_ORDER.index(o) <= order_idx for o in owners if o in INSTALL_ORDER):
                            self.fehler("d", app, ort, f"Workflow '{wf.get('name')}': State '{st}' wird erst von {owners} angelegt (nach {app} in der Installationsreihenfolge)")
                        elif not any(o == app or o in self.transitive_required(app) or o == "ph_core" for o in owners):
                            self.warnung("d", app, ort, f"Workflow '{wf.get('name')}': State '{st}' gehört {owners}, das nicht in required_apps von {app} steht (Reihenfolge laut PLAN reicht)")
                    self._pruefe_rolle(app, ort, s.get("allow_edit"))
                for t in wf.get("transitions", []):
                    ac = t.get("action")
                    if ac not in self.workflow_actions:
                        self.fehler("d", app, ort, f"Workflow '{wf.get('name')}': Action '{ac}' in keiner workflow_action_master.json")
                    else:
                        owners = [a for a, _ in self.workflow_actions[ac]]
                        if not any(INSTALL_ORDER.index(o) <= order_idx for o in owners if o in INSTALL_ORDER):
                            self.fehler("d", app, ort, f"Workflow '{wf.get('name')}': Action '{ac}' wird erst von {owners} angelegt (nach {app})")
                    self._pruefe_rolle(app, ort, t.get("allowed"))
                    states = {s.get("state") for s in wf.get("states", [])}
                    for key in ("state", "next_state"):
                        if t.get(key) not in states:
                            self.fehler("d", app, ort, f"Workflow '{wf.get('name')}': Übergang nutzt State '{t.get(key)}', der nicht in states[] steht")
            # hooks-Filter müssen alle eigenen Fixture-Namen enthalten (sonst wird beim Export verloren / Import unvollständig)
        for app, ns in self.apps.items():
            filt_states, filt_actions = set(), set()
            for fx in ns.get("fixtures") or []:
                if isinstance(fx, dict) and fx.get("filters"):
                    for flt in fx["filters"]:
                        if len(flt) == 3 and flt[1] == "in":
                            if fx["dt"] == "Workflow State":
                                filt_states |= set(flt[2])
                            if fx["dt"] == "Workflow Action Master":
                                filt_actions |= set(flt[2])
            own_states = {n for n, lst in self.workflow_states.items() if any(a == app for a, _, _ in lst)}
            own_actions = {n for n, lst in self.workflow_actions.items() if any(a == app for a, _ in lst)}
            for n in sorted(own_states - filt_states):
                self.warnung("d", app, f"{app}/{app}/hooks.py", f"Workflow State '{n}' in workflow_state.json, aber nicht im hooks-Fixture-Filter")
            for n in sorted(own_actions - filt_actions):
                self.warnung("d", app, f"{app}/{app}/hooks.py", f"Workflow Action Master '{n}' in workflow_action_master.json, aber nicht im hooks-Fixture-Filter")

    # ---------------------------------------------------------- Kategorie e
    def _pruefe_rolle(self, app, ort, rolle):
        if not rolle or not isinstance(rolle, str):
            return
        if rolle in FRAPPE_STD_ROLES or rolle in self.roles_defined:
            owner = self.roles_defined.get(rolle)
            if owner and owner != app and owner != "ph_core" and owner not in self.transitive_required(app):
                self.warnung("e", app, ort, f"Rolle '{rolle}' gehört {owner}, das nicht in required_apps von {app} steht")
            return
        self.fehler("e", app, ort, f"Rolle '{rolle}' ist in keiner role.json definiert")

    def pruefe_rollen(self):
        for name, info in self.doctypes.items():
            for p in info.permissions:
                self._pruefe_rolle(info.app, f"{info.path}:permissions", p.get("role"))
        for app in self.apps:
            fdir = os.path.join(ROOT, app, app, "fixtures")
            if not os.path.isdir(fdir):
                continue
            for fn in sorted(os.listdir(fdir)):
                if not fn.endswith(".json"):
                    continue
                path = os.path.join(fdir, fn)
                try:
                    with open(path, encoding="utf-8") as f:
                        docs = json.load(f)
                except Exception:  # noqa: BLE001
                    continue
                for d in docs if isinstance(docs, list) else []:
                    ort = f"{self.rel(path)}:{d.get('name') or ''}"
                    for r in d.get("roles", []) or []:
                        self._pruefe_rolle(app, ort, r.get("role") if isinstance(r, dict) else r)
                    if d.get("doctype") == "Custom DocPerm":
                        self._pruefe_rolle(app, ort, d.get("role"))
                    if d.get("doctype") == "Role" and d.get("name") and not ROLE_RE.match(d["name"]):
                        self.warnung("e", app, ort, f"Rollenname '{d['name']}' ohne Präfix 'PH '")

    # ---------------------------------------------------------- Kategorie f
    def pruefe_abhaengigkeiten(self):
        # Zyklen
        for app in self.apps:
            stack, seen = [(app, [app])], set()
            while stack:
                cur, pfad = stack.pop()
                for nxt in self.required.get(cur, []):
                    if nxt == app:
                        self.fehler("f", app, f"{app}/{app}/hooks.py", f"Zyklus in required_apps: {' → '.join(pfad + [nxt])}")
                    elif nxt not in seen:
                        seen.add(nxt)
                        stack.append((nxt, pfad + [nxt]))
        for app in self.apps:
            ort = f"{app}/{app}/hooks.py"
            for req in self.required.get(app, []):
                if req not in self.apps:
                    self.fehler("f", app, ort, f"required_apps nennt unbekannte App '{req}'")
                elif app in INSTALL_ORDER and req in INSTALL_ORDER and INSTALL_ORDER.index(req) > INSTALL_ORDER.index(app):
                    self.fehler("f", app, ort, f"required_apps '{req}' steht in der Installationsreihenfolge (PLAN) NACH {app}")
            trans = self.transitive_required(app)
            for dep, reasons in sorted(self.deps_found.get(app, {}).items()):
                if dep == app or dep == "ph_core" or dep in trans:
                    continue
                hard = [r for r in reasons if not r.startswith("Import (optional)") and not r.startswith("Code (optional)")]
                sample = sorted(hard or reasons)[:4]
                if hard:
                    if any(r.split(" ")[0] in ("Link", "Table", "Dynamic") or "(Link)" in r or "(Table)" in r for r in hard):
                        self.fehler("f", app, ort, f"harte Abhängigkeit von '{dep}' (nicht in required_apps): {sample}")
                    else:
                        self.warnung("f", app, ort, f"Abhängigkeit von '{dep}' ohne required_apps-Eintrag (nur Code/Fixture, zur Laufzeit abgefangen?): {sample}")
            if app in INSTALL_ORDER:
                idx = INSTALL_ORDER.index(app)
                for dep in self.deps_found.get(app, {}):
                    if dep in INSTALL_ORDER and INSTALL_ORDER.index(dep) > idx:
                        reasons = sorted(self.deps_found[app][dep])[:3]
                        hard = [r for r in reasons if "(optional)" not in r]
                        if hard:
                            self.warnung("f", app, ort, f"{app} nutzt '{dep}', das laut PLAN erst später installiert wird: {hard}")

    # ---------------------------------------------------------- Kategorie g
    def pruefe_pyproject(self):
        for app, imports in self.third_party_imports.items():
            deps = self.pyproject_deps.get(app, set())
            for top, (optional, ort) in sorted(imports.items()):
                pkg = IMPORT_TO_PACKAGE.get(top, top).lower()
                if pkg in deps:
                    continue
                if top == "qrcode" and app != "ph_kassa" and not (app == "ph_core" and optional):
                    self.fehler("g", app, ort, "Import 'qrcode' – nur ph_kassa (PNG im Bon); SVG-QR gemeinsam über pyqrcode / Core-Jinja ph_qr_svg")
                    continue
                if top in FRAPPE_PROVIDED:
                    continue
                if optional:
                    self.warnung("g", app, ort, f"optionaler Import '{top}' (try/except) ohne pyproject-Abhängigkeit '{pkg}'")
                else:
                    self.fehler("g", app, ort, f"Import '{top}' ohne pyproject-Abhängigkeit '{pkg}'")
            for pkg in sorted(deps):
                used = {IMPORT_TO_PACKAGE.get(t, t).lower() for t in imports}
                if pkg not in used and pkg not in ("frappe",):
                    self.warnung("g", app, f"{app}/pyproject.toml", f"Abhängigkeit '{pkg}' deklariert, aber nirgends importiert")

    # ---------------------------------------------------------------- Lauf
    def lauf(self):
        self.lade_apps()
        self.lade_doctypes()
        self.lade_module()
        self.lade_controller_attrs()
        self.lade_fixtures()
        self.pruefe_doctypes()
        self.pruefe_hooks()
        self.pruefe_python()
        self.pruefe_js()
        self.pruefe_workflows()
        self.pruefe_rollen()
        self.pruefe_abhaengigkeiten()
        self.pruefe_pyproject()
        # Duplikate entfernen
        seen, out = set(), []
        for b in self.befunde:
            if b not in seen:
                seen.add(b)
                out.append(b)
        self.befunde = out


DOC_FACTORIES = {"get_doc", "new_doc", "get_cached_doc", "get_single", "get_last_doc"}


class PyAnalyzer(ast.NodeVisitor):
    """Sammelt frappe.*-Aufrufe mit DocType-Literalen und prüft Felder/Signaturen."""

    def __init__(self, p: Pruefung, app, dotted, ort, stufe):
        self.p, self.app, self.dotted, self.ort, self.stufe = p, app, dotted, ort, stufe
        self.doc_vars = {}  # var -> doctype (innerhalb Funktion)
        self.attr_vars = {}  # var -> dotted path (frappe.get_attr)
        self.imports = {}  # local name -> dotted path (fremde Apps)
        self.guarded = set()  # Zeilen in try/if-Blöcken
        self.form_dt = None
        self._funcstack = []
        self._guard_depth = 0

    # ---- Hilfen
    def ort_(self, node):
        return f"{self.ort}:{getattr(node, 'lineno', 0)}"

    def is_guarded(self, node):
        return node.lineno in self.guarded

    def _mark_guarded(self, node):
        for n in ast.walk(node):
            if hasattr(n, "lineno"):
                self.guarded.add(n.lineno)

    @staticmethod
    def _str(node):
        return node.value if isinstance(node, ast.Constant) and isinstance(node.value, str) else None

    def _dt_of_call(self, call):
        """DocType-Literal des ersten Arguments (oder dict{"doctype": …})."""
        if call.args:
            a0 = call.args[0]
            s = self._str(a0)
            if s:
                return s
            if isinstance(a0, ast.Dict):
                for k, v in zip(a0.keys, a0.values):
                    if self._str(k) == "doctype":
                        return self._str(v)
        for k in call.keywords:
            if k.arg == "doctype":
                return self._str(k.value)
        return None

    def _felder_aus(self, node, out):
        if node is None:
            return
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            out.append(node.value)
        elif isinstance(node, (ast.List, ast.Tuple, ast.Set)):
            for e in node.elts:
                self._felder_aus(e, out)
        elif isinstance(node, ast.Dict):
            for k in node.keys:
                s = self._str(k)
                if s:
                    out.append(s)

    def _filter_felder(self, node, dt, out):
        if isinstance(node, ast.Dict):
            for k in node.keys:
                s = self._str(k)
                if s:
                    out.append((dt, s))
        elif isinstance(node, (ast.List, ast.Tuple)):
            for e in node.elts:
                if isinstance(e, (ast.List, ast.Tuple)):
                    parts = [self._str(x) for x in e.elts]
                    if len(parts) >= 4 and parts[0]:
                        out.append((parts[0], parts[1]))
                    elif len(parts) >= 3 and parts[0]:
                        out.append((dt, parts[0]))
                    elif len(parts) == 2 and parts[0]:
                        out.append((dt, parts[0]))

    # ---- Besuch
    def visit_Try(self, node):
        self._guard_depth += 1
        for n in node.body:
            self._mark_guarded(n)
        self.generic_visit(node)
        self._guard_depth -= 1

    def visit_If(self, node):
        test = ast.unparse(node.test)
        if "exists" in test or "installed" in test or "get_installed_apps" in test or "HAS_" in test or "has_" in test or "import" in test.lower() or "get_attr" in test or "get_hooks" in test or "_verfuegbar" in test or "_vorhanden" in test or "ist_installiert" in test or "app_installiert" in test or "installiert" in test:
            for n in node.body:
                self._mark_guarded(n)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        saved = (self.doc_vars, self.attr_vars)
        self.doc_vars, self.attr_vars = dict(self.doc_vars), dict(self.attr_vars)
        # Parameter namens doc mit Annotation? nein – aber Konvention: ereignisse(doc, method) → doc_events-DocType
        self._funcstack.append(node)
        self.generic_visit(node)
        self._funcstack.pop()
        self.doc_vars, self.attr_vars = saved

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_ClassDef(self, node):
        # Controller: class PHXyz(Document) → self.<feld> gegen DocType prüfen
        saved = dict(self.doc_vars)
        dt = None
        for name, info in self.p.doctypes.items():
            if info.path[:-5] + ".py" == self.ort and info.app == self.app:
                if re.sub(r"[^a-z0-9]", "", name.lower()) == node.name.lower():
                    dt = name
        if dt:
            self.doc_vars["self"] = dt
        self.generic_visit(node)
        self.doc_vars = saved

    def visit_Import(self, node):
        for a in node.names:
            top = a.name.split(".")[0]
            if top in self.p.apps and top != self.app:
                self.imports[a.asname or a.name.split(".")[0]] = a.name if a.asname else top
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        if node.module and not node.level:
            top = node.module.split(".")[0]
            if top in self.p.apps and top != self.app:
                for a in node.names:
                    if a.name == "*":
                        continue
                    self.imports[a.asname or a.name] = f"{node.module}.{a.name}"
                    res, mod = self.p.resolve(f"{node.module}.{a.name}")
                    if res is None:
                        self.p.melde("b", self.stufe, self.app, self.ort_(node), f"Import: '{node.module}.{a.name}' nicht gefunden" + (f" (Modul {mod} existiert, Name fehlt)" if mod else " (Modul fehlt)"))
            elif top == self.app:
                for a in node.names:
                    if a.name == "*":
                        continue
                    res, mod = self.p.resolve(f"{node.module}.{a.name}")
                    if res is None:
                        self.p.melde("b", self.stufe, self.app, self.ort_(node), f"Import (eigene App): '{node.module}.{a.name}' nicht gefunden" + (f" (Modul {mod} existiert, Name fehlt)" if mod else " (Modul fehlt)"))
        self.generic_visit(node)

    def visit_Assign(self, node):
        v = node.value
        if isinstance(v, ast.Call):
            fn = ast.unparse(v.func)
            if fn in {f"frappe.{x}" for x in DOC_FACTORIES}:
                dt = self._dt_of_call(v)
                for t in node.targets:
                    if isinstance(t, ast.Name) and dt:
                        self.doc_vars[t.id] = dt
            elif fn == "frappe.get_attr" and v.args and self._str(v.args[0]):
                for t in node.targets:
                    if isinstance(t, ast.Name):
                        self.attr_vars[t.id] = self._str(v.args[0])
            elif fn == "frappe.qb.DocType" and v.args and self._str(v.args[0]):
                for t in node.targets:
                    if isinstance(t, ast.Name):
                        self.doc_vars[t.id] = self._str(v.args[0])
        elif isinstance(v, ast.Name) and v.id in self.doc_vars:
            for t in node.targets:
                if isinstance(t, ast.Name):
                    self.doc_vars[t.id] = self.doc_vars[v.id]
        # doc.feld = … (Schreibzugriff)
        for t in node.targets:
            if isinstance(t, ast.Attribute) and isinstance(t.value, ast.Name) and t.value.id in self.doc_vars:
                self._pruefe_attr(t)
        self.generic_visit(node)

    def visit_Attribute(self, node):
        if isinstance(node.value, ast.Name) and node.value.id in self.doc_vars:
            self._pruefe_attr(node)
        self.generic_visit(node)

    def _pruefe_attr(self, node):
        dt = self.doc_vars[node.value.id]
        info = self.p.doctypes.get(dt)
        if not info:
            return
        a = node.attr
        if a.startswith("_") or a in DOCUMENT_API or info.has_field(a) or a in self.p.controller_attrs.get(dt, ()):
            return
        if a == "workflow_state" and dt in self.p.workflows:
            return
        self.p.melde("c", self.stufe, self.app, self.ort_(node), f"{node.value.id}.{a}: Feld '{a}' existiert nicht in '{dt}'")

    def visit_Call(self, node):
        fn = ast.unparse(node.func)
        p = self.p
        ort = self.ort_(node)
        stufe = self.stufe
        kontext_optional = self.is_guarded(node)

        def feld(dt, f, kontext):
            p.pruefe_feld(self.app, ort, dt, f, kontext, stufe)

        def dt_bekannt(dt, kontext):
            if dt and dt.startswith("PH ") and dt not in p.doctypes:
                p.melde("a", stufe, self.app, ort, f"{kontext}: unbekannter DocType '{dt}'")
                return False
            if dt in p.doctypes and p.doctypes[dt].app != self.app:
                p.deps_found[self.app][p.doctypes[dt].app].add(("Code (optional) " if kontext_optional else "Code ") + f"{kontext} {dt}")
            return dt in p.doctypes

        # --- frappe.db.get_value / get_values / set_value / get_single_value / get_cached_value
        if fn in ("frappe.db.get_value", "frappe.db.get_values", "frappe.get_cached_value", "frappe.db.set_value", "frappe.get_value"):
            dt = self._dt_of_call(node)
            if dt_bekannt(dt, fn):
                args = list(node.args)
                kws = {k.arg: k.value for k in node.keywords}
                filters = args[1] if len(args) > 1 else kws.get("filters")
                third = args[2] if len(args) > 2 else kws.get("fieldname")
                if fn == "frappe.db.set_value":
                    third = args[2] if len(args) > 2 else kws.get("field")
                out = []
                self._felder_aus(third, out)
                for f in out:
                    feld(dt, f, fn)
                ff = []
                if isinstance(filters, ast.Dict):
                    self._filter_felder(filters, dt, ff)
                for d2, f in ff:
                    feld(d2, f, fn + " filters")
                if fn == "frappe.db.get_value" and isinstance(filters, ast.Dict) and dt in p.doctypes and p.doctypes[dt].issingle:
                    pass
        elif fn == "frappe.db.get_single_value":
            dt = self._dt_of_call(node)
            if dt_bekannt(dt, fn) and len(node.args) > 1:
                feld(dt, self._str(node.args[1]), fn)
        # --- get_all / get_list / count / exists / delete
        elif fn in ("frappe.get_all", "frappe.get_list", "frappe.db.get_all", "frappe.db.get_list", "frappe.db.count", "frappe.db.exists", "frappe.db.delete", "frappe.db.get_value_count", "frappe.get_last_doc", "frappe.db.sql_list"):
            dt = self._dt_of_call(node)
            if dt_bekannt(dt, fn):
                kws = {k.arg: k.value for k in node.keywords}
                out = []
                self._felder_aus(kws.get("fields"), out)
                if fn in ("frappe.get_all", "frappe.get_list", "frappe.db.get_all", "frappe.db.get_list") and len(node.args) > 2:
                    self._felder_aus(node.args[2], out)
                for f in out:
                    feld(dt, f, fn + " fields")
                ff = []
                filters = kws.get("filters") or kws.get("or_filters")
                if fn in ("frappe.db.exists", "frappe.db.count", "frappe.db.delete") and len(node.args) > 1:
                    filters = node.args[1]
                elif len(node.args) > 1 and fn not in ("frappe.db.exists",):
                    filters = node.args[1]
                if isinstance(filters, (ast.Dict, ast.List, ast.Tuple)):
                    self._filter_felder(filters, dt, ff)
                if "or_filters" in kws:
                    self._filter_felder(kws["or_filters"], dt, ff)
                for d2, f in ff:
                    feld(d2, f, fn + " filters")
                ob = self._str(kws.get("order_by"))
                if ob:
                    for part in ob.split(","):
                        feld(dt, part.strip(), fn + " order_by")
                gb = self._str(kws.get("group_by"))
                if gb:
                    feld(dt, gb, fn + " group_by")
        # --- get_doc / new_doc mit dict
        elif fn in {f"frappe.{x}" for x in DOC_FACTORIES}:
            dt = self._dt_of_call(node)
            if dt_bekannt(dt, fn):
                if node.args and isinstance(node.args[0], ast.Dict):
                    for k in node.args[0].keys:
                        s = self._str(k)
                        if s and s != "doctype":
                            feld(dt, s, fn)
                for k in node.keywords:
                    if k.arg not in ("doctype", "for_update", "as_dict"):
                        feld(dt, k.arg, fn)
        elif fn == "frappe.qb.DocType":
            dt = self._dt_of_call(node)
            dt_bekannt(dt, fn)
        # --- get_attr / enqueue / call
        elif fn == "frappe.get_attr":
            s = self._str(node.args[0]) if node.args else None
            if s:
                p._pruefe_aufruf_pfad(self.app, ort, s, "frappe.get_attr")
        elif fn in ("frappe.enqueue", "frappe.enqueue_doc"):
            s = self._str(node.args[0]) if node.args else None
            if not s:
                for k in node.keywords:
                    if k.arg == "method":
                        s = self._str(k.value)
            if s and fn == "frappe.enqueue":
                known = {"queue", "timeout", "is_async", "now", "enqueue_after_commit", "job_name", "job_id", "deduplicate", "at_front", "on_success", "on_failure", "method"}
                kw = {k.arg for k in node.keywords if k.arg and k.arg not in known}
                spread = any(k.arg is None for k in node.keywords)
                pos = max(0, len(node.args) - 1)
                p._pruefe_aufruf_pfad(self.app, ort, s, "frappe.enqueue", call={"pos": pos, "kw": kw, "spread": spread})
        elif fn in ("frappe.call", "frappe.xcall"):
            s = self._str(node.args[0]) if node.args else None
            if s and not s.startswith("frappe."):
                kw = {k.arg for k in node.keywords if k.arg}
                spread = any(k.arg is None for k in node.keywords) or any(isinstance(a, ast.Starred) for a in node.args)
                p._pruefe_aufruf_pfad(self.app, ort, s, fn, call={"pos": len(node.args) - 1, "kw": kw, "spread": spread})
        elif fn == "frappe.db.sql" or fn == "frappe.db.multisql":
            if node.args:
                a0 = node.args[0]
                if isinstance(a0, ast.Constant) and isinstance(a0.value, str):
                    p._pruefe_sql(self.app, ort, a0.value, stufe)
                elif isinstance(a0, ast.JoinedStr):
                    p._pruefe_sql(self.app, ort, "".join(v.value for v in a0.values if isinstance(v, ast.Constant)), stufe)
        elif fn in ("frappe.has_role", "frappe.get_roles"):
            pass
        elif fn == "frappe.get_hooks":
            pass
        elif fn in ("frappe.model.delete_doc", "frappe.delete_doc", "frappe.rename_doc", "frappe.get_meta", "frappe.db.set_single_value", "frappe.copy_doc"):
            dt = self._dt_of_call(node)
            dt_bekannt(dt, fn)
            if fn == "frappe.db.set_single_value" and dt in p.doctypes and len(node.args) > 1:
                feld(dt, self._str(node.args[1]), fn)
                if isinstance(node.args[1], ast.Dict):
                    for k in node.args[1].keys:
                        feld(dt, self._str(k), fn)
        # --- Aufruf einer importierten Fremdfunktion / get_attr-Variable
        func = node.func
        if isinstance(func, ast.Name):
            target = self.attr_vars.get(func.id) or self.imports.get(func.id)
            if target:
                res, mod = p.resolve(target)
                if isinstance(res, FuncInfo):
                    p._pruefe_signatur(self.app, ort, target, res, node, "Aufruf")
        elif isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name) and func.value.id in self.imports:
            target = f"{self.imports[func.value.id]}.{func.attr}"
            res, mod = p.resolve(target)
            if res is None and mod:
                p.melde("b", stufe, self.app, ort, f"Aufruf '{target}': Name fehlt in Modul {mod}")
            elif isinstance(res, FuncInfo):
                p._pruefe_signatur(self.app, ort, target, res, node, "Aufruf")
        elif isinstance(func, ast.Call) and ast.unparse(func.func) == "frappe.get_attr" and func.args and self._str(func.args[0]):
            target = self._str(func.args[0])
            res, mod = p.resolve(target)
            if isinstance(res, FuncInfo):
                p._pruefe_signatur(self.app, ort, target, res, node, "frappe.get_attr(...)()")
        # --- Dokumentmethoden auf bekannten Variablen: doc.append("tabelle", {...}) / doc.get("feld") / doc.db_set("feld")/doc.set("feld")
        if isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name) and func.value.id in self.doc_vars:
            dt = self.doc_vars[func.value.id]
            if func.attr == "append" and node.args and self._str(node.args[0]):
                tbl = self._str(node.args[0])
                feld(dt, tbl, "doc.append")
                info = p.doctypes.get(dt)
                fdef = info.fields.get(tbl) if info else None
                child = fdef.get("options") if fdef else None
                if child in p.doctypes and len(node.args) > 1 and isinstance(node.args[1], ast.Dict):
                    for k in node.args[1].keys:
                        s = self._str(k)
                        if s:
                            feld(child, s, f"doc.append({tbl})")
            elif func.attr in ("get", "db_set", "set", "get_value", "has_value_changed", "get_doc_before_save") and node.args and self._str(node.args[0]):
                s = self._str(node.args[0])
                if func.attr == "get" and (s in STANDARD_FIELDS or " " in s):
                    pass
                else:
                    feld(dt, s, f"doc.{func.attr}")
                if func.attr == "db_set" and isinstance(node.args[0], ast.Dict):
                    for k in node.args[0].keys:
                        feld(dt, self._str(k), "doc.db_set")
            elif func.attr in ("db_set", "update", "set") and node.args and isinstance(node.args[0], ast.Dict):
                for k in node.args[0].keys:
                    s = self._str(k)
                    if s:
                        feld(dt, s, f"doc.{func.attr}")
        # --- frappe.has_role / "Rolle" in frappe.get_roles()
        self.generic_visit(node)

    def visit_Compare(self, node):
        # "PH X Leitung" in frappe.get_roles(...)
        if isinstance(node.left, ast.Constant) and isinstance(node.left.value, str) and node.comparators:
            r = ast.unparse(node.comparators[0])
            if "get_roles" in r or "roles" in r:
                self.p._pruefe_rolle(self.app, self.ort_(node), node.left.value)
        self.generic_visit(node)

    def visit_Constant(self, node):
        # Rollen-Literale in has_role / roles-Listen
        self.generic_visit(node)


def main(argv):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
    as_json = "--json" in argv
    nur_app = None
    kats = None
    mit_warnungen = "--warnungen" in argv or "--alles" in argv
    for i, a in enumerate(argv):
        if a == "--app" and i + 1 < len(argv):
            nur_app = argv[i + 1]
        if a == "--kategorie" and i + 1 < len(argv):
            kats = set(argv[i + 1].split(","))
    p = Pruefung()
    p.lauf()
    befunde = [b for b in p.befunde if (not nur_app or b[2] == nur_app) and (not kats or b[0] in kats)]
    befunde.sort(key=lambda b: (b[0], b[1] != "FEHLER", b[2], b[3], b[4]))
    if as_json:
        print(json.dumps([{"kategorie": k, "stufe": s, "app": a, "ort": o, "text": t} for k, s, a, o, t in befunde], ensure_ascii=False, indent=1))
    else:
        counts = defaultdict(lambda: [0, 0])
        for k, s, a, o, t in befunde:
            counts[k][0 if s == "FEHLER" else 1] += 1
        for k, s, a, o, t in befunde:
            if s == "FEHLER" or mit_warnungen:
                print(f"[{k}] {s:7} {a:13} {o}: {t}")
        print()
        print(f"DocTypes: {len(p.doctypes)} · Module: {len(p.modules)} · Funktionen: {len(p.funcs)} · Rollen: {len(p.roles_defined)} · Workflow States: {len(p.workflow_states)} · Actions: {len(p.workflow_actions)}")
        for k in sorted(counts):
            print(f"Kategorie {k}: {counts[k][0]} Fehler, {counts[k][1]} Warnungen")
        fehler = sum(c[0] for c in counts.values())
        warn = sum(c[1] for c in counts.values())
        print(f"GESAMT: {fehler} Fehler, {warn} Warnungen" + ("" if mit_warnungen else " (Warnungen mit --warnungen anzeigen)"))
    return 1 if any(b[1] == "FEHLER" for b in befunde) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
