frappe.query_reports["PH Servicekosten"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Monat", "Marke", "Art", "Fehlerbereich", "Entscheidung"], default: "Monat" },
	],
};
