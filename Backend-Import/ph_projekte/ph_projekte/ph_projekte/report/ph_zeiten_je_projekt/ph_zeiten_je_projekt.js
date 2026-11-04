frappe.query_reports["PH Zeiten je Projekt"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.add_months(frappe.datetime.get_today(), -3), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
		{ fieldname: "user", label: __("Mitarbeiter"), fieldtype: "Link", options: "User" },
		{ fieldname: "nach", label: __("Gruppieren nach"), fieldtype: "Select", options: ["Projekt", "Mitarbeiter", "Tätigkeit"], default: "Projekt" },
	],
};
