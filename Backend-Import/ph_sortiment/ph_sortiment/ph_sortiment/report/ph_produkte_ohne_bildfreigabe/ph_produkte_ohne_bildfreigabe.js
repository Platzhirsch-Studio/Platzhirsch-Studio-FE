frappe.query_reports["PH Produkte ohne Bildfreigabe"] = {
	filters: [
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["", "Entwurf", "Geprueft", "Aktiv", "Pausiert"] },
	],
};
