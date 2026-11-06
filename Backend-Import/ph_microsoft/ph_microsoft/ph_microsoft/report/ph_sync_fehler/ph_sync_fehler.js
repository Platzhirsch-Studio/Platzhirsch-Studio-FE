frappe.query_reports["PH Sync Fehler"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_days(frappe.datetime.get_today(), -7) },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today() },
		{ fieldname: "bereich", label: __("Bereich"), fieldtype: "Select", options: "\nSSO\nMail\nKalender\nKontakte\nAbo" },
		{ fieldname: "mit_abgelehnt", label: __("Abgelehnte Anmeldungen/Webhooks zeigen"), fieldtype: "Check", default: 0 },
	],
};
