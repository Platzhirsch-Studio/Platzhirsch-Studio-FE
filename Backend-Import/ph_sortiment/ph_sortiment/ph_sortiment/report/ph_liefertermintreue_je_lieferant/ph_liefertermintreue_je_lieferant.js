frappe.query_reports["PH Liefertermintreue je Lieferant"] = {
	filters: [
		{ fieldname: "von", label: __("Bestellt von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bestellt bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
	],
};
