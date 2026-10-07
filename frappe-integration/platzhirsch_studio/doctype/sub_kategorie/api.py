# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoint consumed by the Next.js frontend
# (src/lib/api/fetchSubKategorien.js) to render the subcategory filter on the
# /produkte/shop/[category] listing pages (e.g. Chandeliers -> wall-mounted /
# ceiling-mounted / floor-standing) from real CMS data.
#
# allow_guest=True — called with no Authorization header from the frontend.
# Selects an explicit column list (no `SELECT *`) so the response only ever
# carries the fields the filter actually reads. Rows with no `kategorie` set
# are excluded — they can't be shown under any category's filter panel.
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.sub_kategorie.api.<name>

import frappe


@frappe.whitelist(allow_guest=True)
def get_all_sub_kategorien_api():
	return frappe.db.sql(
		"""
		SELECT category_key, kategorie,
			name_de, name_en, name_fr, name_it
		FROM `tabSub Kategorie`
		WHERE kategorie IS NOT NULL AND kategorie != ''
		ORDER BY kategorie ASC, category_key ASC
		""",
		as_dict=True,
	)
