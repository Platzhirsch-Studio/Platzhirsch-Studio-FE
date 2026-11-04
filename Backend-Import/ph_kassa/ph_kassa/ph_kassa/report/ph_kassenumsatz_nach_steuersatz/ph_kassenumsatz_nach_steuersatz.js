frappe.query_reports["PH Kassenumsatz nach Steuersatz"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -1), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "kasse", label: __("Kasse"), fieldtype: "Link", options: "PH Kasse" },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Steuersatz", "Monat und Steuersatz"], default: "Steuersatz" },
	],
};
