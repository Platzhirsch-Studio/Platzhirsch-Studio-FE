# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoint consumed by the Next.js frontend
# (src/lib/api/fetchMaterialien.js) to render the material filter on the
# /produkte/shop/[category] listing pages from real CMS data.
#
# allow_guest=True — called with no Authorization header from the frontend.
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_material.api.<name>

import frappe


@frappe.whitelist(allow_guest=True)
def get_all_materialien_api():
	return frappe.db.sql(
		"""
		SELECT material_key,
			name_de, name_en, name_fr, name_it
		FROM `tabProdukte Material`
		ORDER BY material_key ASC
		""",
		as_dict=True,
	)
