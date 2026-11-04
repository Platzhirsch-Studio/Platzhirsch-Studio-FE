frappe.query_reports["PH Bestandsliste"] = {
	filters: [
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "nur_ausstellung", label: __("Nur Ausstellungsstücke"), fieldtype: "Check", default: 0 },
		{ fieldname: "mit_wert", label: __("Mit Einkaufswert (Leitung)"), fieldtype: "Check", default: 0 },
	],
};
