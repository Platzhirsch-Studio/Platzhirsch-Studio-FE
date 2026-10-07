# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt
#
# Whitelisted endpoints consumed by the Next.js frontend
# (src/lib/api/fetchProdukteDetails.js, fetchProdukteData.js, fetchProdukteByMarken.js,
# fetchProdukteDimension.js, fetchRelatedProducts.js, fetchAllProdukte.js). Every
# method here is called with
# NO Authorization header from the frontend, so all of them must stay allow_guest=True
# and must never leak fields from Inaktiv products/brands to anonymous visitors.
#
# Every query below selects an explicit column list (raw frappe.db.sql, no `SELECT *`,
# no frappe.get_doc().as_dict()) so each endpoint only ever sends the fields the
# frontend actually reads for that response shape — nothing extra, no Frappe internals
# (owner/creation/docstatus/...), no unused doctype fields.
#
# Base path once mounted: /api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte.api.<name>

import frappe


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _category_dict(row):
	"""Nest the three category-label override fields the frontend already expects
	at produkt.category.category_name_en/_fr/_it (see productCategories.js /
	getCategoryLabel). Returns None when nothing is set so the frontend's
	`produkt?.category?.[...]` falls through to its own client-side translation map."""
	values = {
		"category_name_en": row.get("category_name_en"),
		"category_name_fr": row.get("category_name_fr"),
		"category_name_it": row.get("category_name_it"),
	}
	if not any(values.values()):
		return None
	return values


def _remap_bild_row(row):
	"""bild_anhangen and produkt_name already match the frontend's per-row field
	names; only image_name needs re-keying to the camelCase `imageName` that
	ProdukteDetails.js reads (PhotoSwipe caption title). produkt_name here is the
	child row's OWN field (per-image alt-text override) — distinct from the parent
	Produkte doctype's product_name field, and not affected by that rename."""
	return {
		"name": row.get("name"),
		"bild_anhangen": row.get("bild_anhangen"),
		"produkt_name": row.get("produkt_name"),
		"imageName": row.get("image_name"),
	}


def _remap_pdf_row(row):
	"""Frappe fieldnames can't start with a digit, so the doctype stores
	attach_2d/attach_3d; the frontend (InformationProduct.js) reads file["2d"]/file["3d"]
	literally. Re-key here so the API contract matches what already ships."""
	return {
		"2d": row.get("attach_2d"),
		"3d": row.get("attach_3d"),
		"katalog": row.get("katalog"),
	}


def _fetch_bild_anhangen(parent_names):
	"""Batch-fetch gallery-image rows for one or more parent products in a single
	query (avoids N+1 queries when called for a list of products)."""
	if not parent_names:
		return {}
	placeholders = ", ".join(["%s"] * len(parent_names))
	rows = frappe.db.sql(
		f"""
		SELECT parent, name, bild_anhangen, produkt_name, image_name
		FROM `tabProdukte Bild`
		WHERE parent IN ({placeholders}) AND parenttype = 'Produkte'
		ORDER BY parent, idx ASC
		""",
		parent_names,
		as_dict=True,
	)
	by_parent = {}
	for row in rows:
		by_parent.setdefault(row["parent"], []).append(row)
	return by_parent


# ---------------------------------------------------------------------------
# 1) Full product detail — src/lib/api/fetchProdukteDetails.js -> fetchProductByPathField
#    POST body: { path_field, lang }
#    Response: { message: <product dict with only the fields the detail page reads> | null }
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def get_produkt_by_path_field_api(path_field=None, lang="de"):
	if not path_field:
		frappe.throw("path_field is required", frappe.MandatoryError)

	rows = frappe.db.sql(
		"""
		SELECT name, product_name, url_slug, marken, status, kategories, bannerbild,
			beschreibung, beschreibung_en, beschreibung_fr, beschreibung_it,
			mehr_beschreibung, mehr_beschreibung_en, mehr_beschreibung_fr, mehr_beschreibung_it,
			metadata_description_de, metadata_description_en, metadata_description_fr, metadata_description_it,
			category_name_en, category_name_fr, category_name_it
		FROM `tabProdukte`
		WHERE url_slug = %s
		LIMIT 1
		""",
		(path_field,),
		as_dict=True,
	)
	if not rows:
		return None

	data = rows[0]

	category = _category_dict(data)
	data.pop("category_name_en", None)
	data.pop("category_name_fr", None)
	data.pop("category_name_it", None)
	if category:
		data["category"] = category

	data["bild_anhangen"] = [
		_remap_bild_row(r)
		for r in frappe.db.sql(
			"""
			SELECT name, bild_anhangen, produkt_name, image_name
			FROM `tabProdukte Bild`
			WHERE parent = %s AND parenttype = 'Produkte'
			ORDER BY idx ASC
			""",
			(data["name"],),
			as_dict=True,
		)
	]

	data["pdf_produkte"] = [
		_remap_pdf_row(r)
		for r in frappe.db.sql(
			"""
			SELECT name, attach_2d, attach_3d, katalog
			FROM `tabProdukte PDF`
			WHERE parent = %s AND parenttype = 'Produkte'
			ORDER BY idx ASC
			""",
			(data["name"],),
			as_dict=True,
		)
	]

	data["additional_information"] = frappe.db.sql(
		"""
		SELECT name, gewicht, dimensions, material, farbe
		FROM `tabProdukte Additional Information`
		WHERE parent = %s AND parenttype = 'Produkte'
		ORDER BY idx ASC
		""",
		(data["name"],),
		as_dict=True,
	)

	return data


# ---------------------------------------------------------------------------
# 2) Lightweight catalogue — used for generateStaticParams()/the sitemap
#    src/lib/api/fetchProdukteDetails.js -> fetchAllProducts()
#    src/lib/api/fetchProdukteDimension.js -> fetchAllProductsForSitemap()
#    GET, no params.
#    Response: { message: [ {marken, url_slug, product_name, name, status, modified}, ... ] }
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def produkte_data_short_list():
	return frappe.db.sql(
		"""
		SELECT name, product_name, url_slug, marken, status, modified
		FROM `tabProdukte New`
		ORDER BY modified DESC
		""",
		as_dict=True,
	)


# ---------------------------------------------------------------------------
# 3) Products for one brand — the /produkte/[title] listing page
#    src/lib/api/fetchProdukteData.js (POST body {marken})
#    src/lib/api/fetchProdukteByMarken.js (GET ?marken=...)
#    Response: { message: [ <card-shape product dict>, ... ] }
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def get_produkte_by_marke_api(marken=None):
	if not marken:
		frappe.throw("marken is required", frappe.MandatoryError)

	products = frappe.db.sql(
		"""
		SELECT name, product_name, url_slug, marken, kategories, indoor_and_outdoor, status, modified
		FROM `tabProdukte New`
		WHERE marken = %s
		""",
		(marken,),
		as_dict=True,
	)
	if not products:
		return []

	images_by_parent = _fetch_bild_anhangen([p["name"] for p in products])
	for p in products:
		p["bild_anhangen"] = images_by_parent.get(p["name"], [])

	return products


# ---------------------------------------------------------------------------
# 3b) All active products across every brand — the /produkte/shop category-hub
#    and category-listing pages (src/lib/api/fetchAllProdukte.js). Same
#    card-shape response as get_produkte_by_marke_api, just not filtered to one
#    brand — the frontend derives each product's shop categoryKey itself by
#    stripping the "-{Brand}" suffix off `kategories` (see
#    src/lib/seo/productCategories.js -> deriveCategoryKey).
#    GET, no params. Response: { message: [ <card-shape product dict>, ... ] }
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def get_all_produkte_api():
	products = frappe.db.sql(
		"""
		SELECT name, product_name, url_slug, marken, kategories, indoor_and_outdoor, status, modified
		FROM `tabProdukte New`
		WHERE status = 'Aktiv'
		ORDER BY modified DESC
		""",
		as_dict=True,
	)
	if not products:
		return []

	images_by_parent = _fetch_bild_anhangen([p["name"] for p in products])
	for p in products:
		p["bild_anhangen"] = images_by_parent.get(p["name"], [])

	return products


# ---------------------------------------------------------------------------
# 4) Technical/dimension drawings — the "Technische Merkmale" grid
#    src/lib/api/fetchProdukteDimension.js -> fetchProductDimensions({name, product_name, path_field})
#    GET query params. Response: { message: [ {name, attach_image, alt_text_image}, ... ] }
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def product_dimensions_data(name=None, product_name=None, path_field=None):
	# path_field is the only field guaranteed unique; prefer it, then fall back.
	produkt_name_id = None
	if path_field:
		row = frappe.db.sql(
			"SELECT name FROM `tabProdukte` WHERE url_slug = %s LIMIT 1",
			(path_field,),
			as_dict=True,
		)
		produkt_name_id = row[0]["name"] if row else None
	if not produkt_name_id and name:
		row = frappe.db.sql(
			"SELECT name FROM `tabProdukte` WHERE name = %s LIMIT 1",
			(name,),
			as_dict=True,
		)
		produkt_name_id = row[0]["name"] if row else None
	if not produkt_name_id and product_name:
		row = frappe.db.sql(
			"SELECT name FROM `tabProdukte New` WHERE product_name = %s LIMIT 1",
			(product_name,),
			as_dict=True,
		)
		produkt_name_id = row[0]["name"] if row else None

	if not produkt_name_id:
		return []

	return frappe.db.sql(
		"""
		SELECT name, attach_image, alt_text_image
		FROM `tabProdukte Dimension`
		WHERE parent = %s AND parenttype = 'Produkte'
		ORDER BY idx ASC
		""",
		(produkt_name_id,),
		as_dict=True,
	)


# ---------------------------------------------------------------------------
# 5) Related products — the "you might also like" strip
#    src/lib/api/fetchRelatedProducts.js
#    GET ?marken=&kategories=&currentProductPath=&limit=4
#    Response: { message: [ {product_name, marken, kategories, url_slug, bild_anhangen}, ... ] }
#    bild_anhangen here is a flattened STRING (first gallery image path), unlike the
#    full child table returned by get_produkt_by_path_field_api — RelatedProducts.js
#    reads it directly as `product.bild_anhangen`.
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True)
def related_products(marken=None, kategories=None, currentProductPath=None, limit=4):
	if not marken or not kategories or not currentProductPath:
		frappe.throw("marken, kategories and currentProductPath are all required", frappe.MandatoryError)

	limit = int(limit or 4)

	def _fetch(extra_where, extra_params, exclude_names):
		rows = frappe.db.sql(
			f"""
			SELECT name FROM `tabProdukte`
			WHERE status = 'Aktiv' AND url_slug != %s {extra_where}
			LIMIT %s
			""",
			(currentProductPath, *extra_params, limit * 2),
			as_dict=True,
		)
		return [r["name"] for r in rows if r["name"] not in exclude_names]

	# Tier 1: same brand + same category. Tier 2: same brand, any category (fills the
	# rest). Keeps the strip populated even for brands with only one product per line.
	seen = set()
	ordered_names = []

	ordered_names += _fetch("AND marken = %s AND kategories = %s", (marken, kategories), seen)
	seen.update(ordered_names)

	if len(ordered_names) < limit:
		ordered_names += _fetch("AND marken = %s", (marken,), seen)
		seen.update(ordered_names)

	ordered_names = ordered_names[:limit]
	if not ordered_names:
		return []

	placeholders = ", ".join(["%s"] * len(ordered_names))
	rows_by_name = {
		r["name"]: r
		for r in frappe.db.sql(
			f"""
			SELECT name, product_name, marken, kategories, url_slug
			FROM `tabProdukte`
			WHERE name IN ({placeholders})
			""",
			ordered_names,
			as_dict=True,
		)
	}

	first_image_by_parent = {}
	for row in frappe.db.sql(
		f"""
		SELECT parent, bild_anhangen FROM `tabProdukte Bild`
		WHERE parent IN ({placeholders}) AND parenttype = 'Produkte'
		ORDER BY parent, idx ASC
		""",
		ordered_names,
		as_dict=True,
	):
		first_image_by_parent.setdefault(row["parent"], row["bild_anhangen"])

	products = []
	for name in ordered_names:
		r = rows_by_name.get(name)
		if not r:
			continue
		products.append({
			"product_name": r["product_name"],
			"marken": r["marken"],
			"kategories": r["kategories"],
			"url_slug": r["url_slug"],
			"bild_anhangen": first_image_by_parent.get(name),
		})

	return products
