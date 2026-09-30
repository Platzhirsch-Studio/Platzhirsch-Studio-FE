# Copyright (c) 2026, Platzhirsch Home Living
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Produkte(Document):
	def validate(self):
		self.url_slug = (self.url_slug or "").strip()
		if not self.url_slug:
			frappe.throw("URL Slug is required.")

		# url_slug is the last URL segment for every locale, so it must be
		# unique across the WHOLE doctype, not just per brand.
		duplicate = frappe.db.exists(
			"Produkte",
			{"url_slug": self.url_slug, "name": ["!=", self.name]},
		)
		if duplicate:
			frappe.throw(f"Another product already uses url_slug '{self.url_slug}': {duplicate}")
