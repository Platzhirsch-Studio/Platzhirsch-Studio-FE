frappe.query_reports["PH Stufenwechsel"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "kundenkarte", label: __("Karte"), fieldtype: "Link", options: "PH Kundenkarte" },
	],
};
