frappe.query_reports["PH Shop Umsatz nach USt-Satz"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -1), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "nur_live", label: __("Nur Live-Bestellungen"), fieldtype: "Check", default: 1 },
	],
};
