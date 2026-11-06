frappe.query_reports["PH AB Merker offen"] = {
	filters: [
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "merker", label: __("AB-Merker"), fieldtype: "Select", options: ["", "offen", "abweichung", "bestaetigt", "geklaert"] },
		{ fieldname: "alle", label: __("Alle Merker zeigen"), fieldtype: "Check" },
	],
};
