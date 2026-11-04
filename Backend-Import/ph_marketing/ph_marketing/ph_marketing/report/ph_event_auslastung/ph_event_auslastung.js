frappe.query_reports["PH Event-Auslastung"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), 6), reqd: 1 },
	],
};
