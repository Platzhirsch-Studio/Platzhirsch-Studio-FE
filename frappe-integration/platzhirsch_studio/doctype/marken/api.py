# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoint consumed by the Next.js frontend
# (src/lib/api/fetchMarkenData.js -> fetchRawMarkenData(), the single source every
# other helper in that file, the sitemap, and every brand-story/product-listing page
# builds on). Called with NO Authorization header, so it must stay allow_guest=True.
#
# Unlike Produkte's endpoints, this one deliberately returns EVERY brand regardless
# of `status` — the frontend does its own "Aktiv" filtering (and 404s the detail page
# for Inaktiv brands), matching how fetchRawMarkenData() is already consumed today.
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.marken.api.marken_data

import frappe


@frappe.whitelist(allow_guest=True)
def marken_data():
	brands = frappe.db.sql(
		"""
		SELECT name, name1, status, es_gibt_produkte, grundungsjahr, herkunftsland, grunder,
			firmenlink, logo,
			beschreibung, beschreibung_en, beschreibung_fr, beschreibung_it,
			produkte, produkte_en, produkte_fr, produkte_it,
			metadata_description_de, metadata_description_en, metadata_description_fr, metadata_description_it,
			modified
		FROM `tabMarken`
		ORDER BY modified DESC
		""",
		as_dict=True,
	)
	if not brands:
		return []

	images_by_parent = {}
	for row in frappe.db.sql(
		"""
		SELECT parent, name, bild_anhagen, modified
		FROM `tabMarken Bild`
		WHERE parenttype = 'Marken'
		ORDER BY parent, idx ASC
		""",
		as_dict=True,
	):
		parent = row.pop("parent")
		images_by_parent.setdefault(parent, []).append(row)

	for brand in brands:
		brand["bild_anhagen"] = images_by_parent.get(brand["name"], [])

	return brands
