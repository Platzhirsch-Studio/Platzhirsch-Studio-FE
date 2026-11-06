frappe.query_reports["PH Pipeline"] = {
	filters: [
		{ fieldname: "gruppe", label: __("Gruppieren nach"), fieldtype: "Select", options: "status\nzustaendig\nmonat\nquelle\nkampagne", default: "status" },
		{ fieldname: "zugewiesen_an", label: __("Zuständig"), fieldtype: "Link", options: "User" },
	],
};
