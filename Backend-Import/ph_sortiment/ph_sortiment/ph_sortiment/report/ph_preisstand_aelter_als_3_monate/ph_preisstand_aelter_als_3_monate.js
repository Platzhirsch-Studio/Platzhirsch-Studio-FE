frappe.query_reports["PH Preisstand aelter als 3 Monate"] = {
	filters: [
		{ fieldname: "monate", label: __("Älter als (Monate)"), fieldtype: "Int", default: 3, reqd: 1 },
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
		{ fieldname: "nur_aktiv", label: __("Nur veröffentlichte Produkte"), fieldtype: "Check", default: 1 },
	],
};
