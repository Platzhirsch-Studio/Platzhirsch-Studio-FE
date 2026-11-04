frappe.query_reports["PH Zahllauf Vorschlag"] = {
	filters: [
		{ fieldname: "stichtag", label: __("Fällig bis"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), 7), reqd: 1 },
	],
};
