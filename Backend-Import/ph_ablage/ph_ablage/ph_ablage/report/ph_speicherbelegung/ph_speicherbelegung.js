frappe.query_reports["PH Speicherbelegung"] = {
	filters: [
		{ fieldname: "gruppierung", label: __("Gruppierung"), fieldtype: "Select", options: "Bezug\nEndung\nSpeicher\nStammordner\nStatus", default: "Bezug", reqd: 1 },
		{ fieldname: "mit_papierkorb", label: __("Papierkorb einrechnen"), fieldtype: "Check", default: 0 },
	],
};
