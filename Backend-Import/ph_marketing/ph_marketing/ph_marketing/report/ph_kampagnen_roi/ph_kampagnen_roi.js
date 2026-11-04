frappe.query_reports["PH Kampagnen-ROI"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -12), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "kanal", label: __("Kanal"), fieldtype: "Select", options: ["", "Meta", "Pinterest", "Google", "Newsletter", "Print", "Event", "Social organisch", "Empfehlung", "Sonstige"] },
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["", "Entwurf", "Aktiv", "Pausiert", "Beendet"] },
	],
};
