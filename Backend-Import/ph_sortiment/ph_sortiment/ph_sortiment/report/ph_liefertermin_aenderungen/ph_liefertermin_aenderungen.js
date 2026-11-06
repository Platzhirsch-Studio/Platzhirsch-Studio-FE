frappe.query_reports["PH Liefertermin Aenderungen"] = {
	filters: [
		{ fieldname: "von", label: __("Geändert von"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), -30), reqd: 1 },
		{ fieldname: "bis", label: __("Geändert bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "nur_offen", label: __("Nur Kunde nicht informiert"), fieldtype: "Check" },
	],
};
