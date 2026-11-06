frappe.query_reports["PH Anfragen nach Kampagne"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3) },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today() },
		{ fieldname: "gruppe", label: __("Gruppieren nach"), fieldtype: "Select", options: "kampagne\nquelle\nmedium\nkanal", default: "kampagne" },
	],
};
