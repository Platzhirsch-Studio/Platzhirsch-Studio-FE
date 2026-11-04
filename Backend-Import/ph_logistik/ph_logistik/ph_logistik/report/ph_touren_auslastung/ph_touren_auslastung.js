frappe.query_reports["PH Touren Auslastung"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "fahrzeug", label: __("Fahrzeug"), fieldtype: "Link", options: "PH Fahrzeug" },
	],
};
