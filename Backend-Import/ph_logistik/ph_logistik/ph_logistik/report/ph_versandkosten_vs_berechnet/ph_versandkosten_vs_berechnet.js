frappe.query_reports["PH Versandkosten vs berechnet"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "carrier", label: __("Carrier"), fieldtype: "Data" },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Sendung", "Carrier", "Monat"], default: "Sendung" },
	],
};
