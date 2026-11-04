"""Status ↔ Workflow-Zustand synchron halten.

Konvention: Feld `status` ist read_only und wird vom Workflow (update_field) gesetzt. Server-Methoden
(API der Website, Scheduler, Buttons) ändern den Status direkt – dann muss `workflow_state`
mitziehen, sonst zeigt das Formular falsche Aktionen. Zustandsnamen sind global und heißen
„PH <Status>“ (CONVENTIONS.md, Abschnitt 2).
"""

import frappe


def workflow_aktiv(doctype):
    return bool(frappe.db.get_value("Workflow", {"document_type": doctype, "is_active": 1}, "name"))


def zustand_fuer(status):
    return f"PH {status}" if status else None


def status_setzen(doc, status, kommentar=None, **weitere):
    """Status + workflow_state ohne Workflow-Übergangsprüfung setzen (nur für Server-Logik)."""
    werte = {"status": status, **weitere}
    if workflow_aktiv(doc.doctype) and frappe.db.exists("Workflow State", zustand_fuer(status)):
        werte["workflow_state"] = zustand_fuer(status)
    doc.db_set(werte, notify=True)
    if kommentar:
        doc.add_comment("Info", kommentar)


def vor_speichern_abgleichen(doc):
    """In validate() aufrufen: neue Dokumente bekommen den passenden Zustand; bei geändertem Status
    ohne Zustandswechsel (z. B. Kanban-Drag) wird der Zustand nachgezogen, damit Frappe den Übergang
    prüft."""
    if not doc.meta.has_field("workflow_state") and not frappe.db.has_column(doc.doctype, "workflow_state"):
        return
    zustand = zustand_fuer(doc.status)
    if not zustand or not frappe.db.exists("Workflow State", zustand):
        return
    if doc.is_new():
        doc.workflow_state = zustand
        return
    alt = doc.get_doc_before_save()
    if alt and alt.status != doc.status and alt.get("workflow_state") == doc.get("workflow_state"):
        doc.workflow_state = zustand
