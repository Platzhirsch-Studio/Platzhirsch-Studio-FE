frappe.query_reports["PH Shop Umsatz"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -1), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Tag", "Monat"], default: "Tag" },
		{ fieldname: "nur_live", label: __("Nur Live-Zahlungen"), fieldtype: "Check", default: 1 },
	],
};
