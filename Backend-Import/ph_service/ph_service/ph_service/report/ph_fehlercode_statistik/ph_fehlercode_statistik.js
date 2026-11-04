frappe.query_reports["PH Fehlercode-Statistik"] = {
	tree: true,
	name_field: "code",
	parent_field: "parent_code",
	initial_depth: 1,
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "bereich", label: __("Fehlerbereich"), fieldtype: "Link", options: "PH Fehlerbereich" },
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
	],
};
