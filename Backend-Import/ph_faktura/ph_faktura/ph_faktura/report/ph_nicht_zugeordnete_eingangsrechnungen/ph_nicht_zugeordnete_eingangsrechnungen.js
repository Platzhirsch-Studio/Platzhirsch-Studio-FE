frappe.query_reports["PH Nicht zugeordnete Eingangsrechnungen"] = {
	filters: [
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["", "Erfasst", "Sachlich geprueft", "Freigegeben", "Bezahlt"] },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "von", label: __("Datum ab"), fieldtype: "Date" },
	],
};
