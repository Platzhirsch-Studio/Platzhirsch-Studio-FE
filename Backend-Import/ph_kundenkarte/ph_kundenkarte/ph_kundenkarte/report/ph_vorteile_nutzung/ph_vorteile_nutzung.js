frappe.query_reports["PH Vorteile Nutzung"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "art", label: __("Art"), fieldtype: "Select", options: ["", "Lieferung", "Montage", "Pflege", "Event", "Service", "Persoenlich", "Sonstiges"] },
	],
};
