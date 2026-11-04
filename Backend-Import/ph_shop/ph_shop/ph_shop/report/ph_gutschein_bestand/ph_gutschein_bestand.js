frappe.query_reports["PH Gutschein Bestand"] = {
	filters: [
		{ fieldname: "stichtag", label: __("Stichtag"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "mit_test", label: __("Testgutscheine einbeziehen"), fieldtype: "Check", default: 0 },
	],
};
