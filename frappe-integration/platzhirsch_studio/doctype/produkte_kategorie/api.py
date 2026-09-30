# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoint consumed by the Next.js frontend
# (src/lib/api/fetchKategorien.js) to render the /produkte/shop category-hub
# tiles (ShopCategoryGrid) from real CMS data instead of the static
# CATEGORY_I18N map + the old getShopCategories() in
# src/lib/data/staticShopProducts.js (see produkte_kategorie.json's own
# description for the intended migration path).
#
# allow_guest=True — called with no Authorization header from the frontend.
# Selects an explicit column list (no `SELECT *`) so the response only ever
# carries the fields the shop-hub tile actually reads.
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_kategorie.api.<name>

import frappe


@frappe.whitelist(allow_guest=True)
def get_all_kategorien_api():
	return frappe.db.sql(
		"""
		SELECT category_key, image,
			name_de, name_en, name_fr, name_it,
			alt_text_de, alt_text_en, alt_text_fr, alt_text_it
		FROM `tabProdukte Kategorie`
		ORDER BY category_key ASC
		""",
		as_dict=True,
	)
