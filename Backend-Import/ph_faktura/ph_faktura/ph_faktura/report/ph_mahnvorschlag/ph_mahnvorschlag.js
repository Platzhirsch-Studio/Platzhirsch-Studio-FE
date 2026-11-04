frappe.query_reports["PH Mahnvorschlag"] = {
	filters: [
		{ fieldname: "stichtag", label: __("Stichtag"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
	],
};
