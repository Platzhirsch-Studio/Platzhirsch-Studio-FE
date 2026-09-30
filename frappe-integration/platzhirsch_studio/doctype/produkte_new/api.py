# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoint consumed by the Next.js frontend
# (src/lib/api/fetchAllProdukte.js) to power the /produkte/shop category-hub
# and category-listing pages, which browse the catalog by category instead of
# by brand (see src/app/[locale]/produkte/shop/**).
#
# Drop this file into the SAME folder as the existing "Produkte New" doctype
# in your app (it already has its own .json/.py — this just adds api.py
# alongside them, same as every other doctype in this repo).
#
# allow_guest=True — called with no Authorization header from the frontend.
# Selects an explicit column list (no `SELECT *`) so the response only ever
# carries the fields the shop pages actually read. farbe/material/
# sub_kategorie are Table MultiSelect fields, not real columns on this
# doctype, so raw SQL can't select them here — those still need a
# per-product detail fetch (see fetchAllProdukte.js's comments).
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.<name>

import frappe


@frappe.whitelist(allow_guest=True)
def get_all_produkte_api():
	return frappe.db.sql(
		"""
		SELECT name, produkt_name, path_field, marken, kategories,
			indoor_and_outdoor, status, designer
		FROM `tabProdukte New`
		WHERE status = 'Aktiv'
		ORDER BY modified DESC
		""",
		as_dict=True,
	)
