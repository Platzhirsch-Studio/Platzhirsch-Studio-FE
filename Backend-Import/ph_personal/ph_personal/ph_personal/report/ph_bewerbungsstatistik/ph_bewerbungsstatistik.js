frappe.query_reports["PH Bewerbungsstatistik"] = {
	filters: [
		{ fieldname: "von", label: __("Eingang von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Eingang bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Stelle", "Quelle"], default: "Stelle" },
		{ fieldname: "stelle", label: __("Nur Stelle"), fieldtype: "Link", options: "PH Stelle" },
	],
};
