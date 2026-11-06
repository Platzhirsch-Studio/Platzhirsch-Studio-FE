frappe.query_reports["PH Reklamationen je Lieferant"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
	],
};
