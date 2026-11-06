frappe.query_reports["PH Projektkalkulation"] = {
	filters: [
		{ fieldname: "projekt", label: __("Projekt"), fieldtype: "Link", options: "PH Projekt" },
		{ fieldname: "status", label: __("Phase"), fieldtype: "Select", options: ["", "Anfrage", "Planung", "Angebot", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"] },
		{ fieldname: "projektart", label: __("Projektart"), fieldtype: "Select", options: ["", "Wohnung", "Haus", "Kueche", "Bad", "Hotel", "Objekt", "Yacht", "Outdoor"] },
	],
};
