frappe.query_reports["PH Top-Seiten (Einblicke)"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), -30), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "limit", label: __("Anzahl"), fieldtype: "Int", default: 30 },
	],
};
