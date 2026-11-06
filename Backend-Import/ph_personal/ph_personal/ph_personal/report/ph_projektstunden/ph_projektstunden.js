frappe.query_reports["PH Projektstunden"] = {
	filters: [
		{ fieldname: "von", label: __("Von"), fieldtype: "Date", default: frappe.datetime.month_start(), reqd: 1 },
		{ fieldname: "bis", label: __("Bis"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "projekt_doctype", label: __("Bezug (Art)"), fieldtype: "Select", options: ["", "PH Projekt", "PH Auftragsbestaetigung", "PH Serviceauftrag"] },
		{ fieldname: "projekt", label: __("Projekt / Auftrag"), fieldtype: "Data" },
		{ fieldname: "taetigkeit", label: __("Tätigkeit"), fieldtype: "Select", options: ["", "Montage", "Planung", "Service", "Showroom", "Fahrt", "Lager", "Verwaltung"] },
		{ fieldname: "mitarbeiter", label: __("Mitarbeiter"), fieldtype: "Link", options: "PH Mitarbeiter" },
		{ fieldname: "gruppierung", label: __("Gruppierung"), fieldtype: "Select", options: ["Projekt, Tätigkeit, Mitarbeiter", "Projekt", "Projekt, Tätigkeit"], default: "Projekt, Tätigkeit, Mitarbeiter" },
	],
};
