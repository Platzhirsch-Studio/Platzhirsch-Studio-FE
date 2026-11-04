frappe.query_reports["PH Einwilligungen nach Zweck"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "kanal", label: __("Kanal"), fieldtype: "Select", options: ["", "website", "showroom", "telefon", "email", "whatsapp", "papier", "backoffice"] },
	],
};
