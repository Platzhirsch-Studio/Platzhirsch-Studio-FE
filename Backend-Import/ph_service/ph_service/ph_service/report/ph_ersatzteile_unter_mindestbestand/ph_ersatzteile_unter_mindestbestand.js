frappe.query_reports["PH Ersatzteile unter Mindestbestand"] = {
	filters: [
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
		{ fieldname: "alle", label: __("Alle mit Bestandsführung"), fieldtype: "Check", default: 0 },
	],
};
