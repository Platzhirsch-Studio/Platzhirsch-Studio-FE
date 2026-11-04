"""Desk-Page ph-auftragsmappe: Daten liefert ph_projekte.api.auftragsmappe (Rechteprüfung dort)."""

import frappe


def get_context(context):
    context.no_cache = 1
    context.title = frappe._("Auftragsmappe")
