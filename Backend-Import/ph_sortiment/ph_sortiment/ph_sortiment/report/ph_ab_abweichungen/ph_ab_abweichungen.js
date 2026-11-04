frappe.query_reports["PH AB Abweichungen"] = {
	filters: [
		{ fieldname: "von", label: __("Bestellt von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -6), reqd: 1 },
		{ fieldname: "bis", label: __("Bestellt bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "feld", label: __("Feld"), fieldtype: "Select", options: ["", "Preis", "Menge", "Termin", "Artikel"] },
		{ fieldname: "bewertung", label: __("Bewertung"), fieldtype: "Select", options: ["", "offen", "pruefen", "ok", "abgelehnt"] },
	],
};
