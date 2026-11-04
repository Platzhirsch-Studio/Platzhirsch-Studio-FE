frappe.query_reports["PH Social Redaktionsplan"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), -14), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), 60), reqd: 1 },
		{ fieldname: "kanal", label: __("Kanal"), fieldtype: "Select", options: ["", "Pinterest", "Instagram", "LinkedIn", "YouTube", "Facebook"] },
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["", "Idee", "Entwurf", "Freigegeben", "Geplant", "Veroeffentlicht"] },
	],
};
