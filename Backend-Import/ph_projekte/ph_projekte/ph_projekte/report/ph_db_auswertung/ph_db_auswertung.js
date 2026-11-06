frappe.query_reports["PH DB Auswertung"] = {
	filters: [
		{ fieldname: "gruppierung", label: __("Gruppierung"), fieldtype: "Select", options: ["Projektart", "Berater", "Marke", "Monat"], default: "Projektart", reqd: 1 },
		{ fieldname: "status", label: __("Phase (leer = laufend + abgeschlossen)"), fieldtype: "Select", options: ["", "Auftrag", "Bestellung", "Lieferung", "Montage", "Uebergabe", "Abgeschlossen"] },
		{ fieldname: "von", label: __("Eingang ab"), fieldtype: "Date" },
		{ fieldname: "basis", label: __("Basis laufend"), fieldtype: "Select", options: ["Prognose", "Ist"], default: "Prognose" },
	],
};
