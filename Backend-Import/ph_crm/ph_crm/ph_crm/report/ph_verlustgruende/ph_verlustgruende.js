frappe.query_reports["PH Verlustgruende"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12) },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today() },
		{ fieldname: "gruppe", label: __("Gruppieren nach"), fieldtype: "Select", options: "verloren_grund\nmitbewerber", default: "verloren_grund" },
	],
};
