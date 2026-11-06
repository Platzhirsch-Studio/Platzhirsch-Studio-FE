frappe.query_reports["PH Kundenwert"] = {
	filters: [
		{ fieldname: "stufe", label: __("Stufe"), fieldtype: "Link", options: "PH Kundenkarte Stufe" },
		{ fieldname: "berater", label: __("Berater"), fieldtype: "Link", options: "User" },
		{ fieldname: "nur_mit_einwilligung", label: __("Nur mit Einwilligung zur Auswertung"), fieldtype: "Check", default: 0 },
	],
};
