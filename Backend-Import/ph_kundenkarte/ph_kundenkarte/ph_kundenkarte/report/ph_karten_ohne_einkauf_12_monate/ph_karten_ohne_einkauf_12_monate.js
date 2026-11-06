frappe.query_reports["PH Karten ohne Einkauf 12 Monate"] = {
	filters: [
		{ fieldname: "monate", label: __("Monate ohne Einkauf"), fieldtype: "Int", default: 12, reqd: 1 },
		{ fieldname: "berater", label: __("Berater"), fieldtype: "Link", options: "User" },
		{ fieldname: "stufe", label: __("Stufe"), fieldtype: "Link", options: "PH Kundenkarte Stufe" },
		{ fieldname: "mit_ohne_einwilligung", label: __("Karten ohne Einwilligung mit auflisten"), fieldtype: "Check", default: 0 },
	],
};
