frappe.query_reports["PH Kommissionsware"] = {
	filters: [
		{ fieldname: "kommission", label: __("Kommission (Projekt/AB)"), fieldtype: "Data" },
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "nur_gesperrt", label: __("Nur gesperrte"), fieldtype: "Check" },
	],
};
