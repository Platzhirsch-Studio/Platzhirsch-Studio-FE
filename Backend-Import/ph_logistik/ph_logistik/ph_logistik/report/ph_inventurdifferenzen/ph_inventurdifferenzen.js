frappe.query_reports["PH Inventurdifferenzen"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
	],
};
