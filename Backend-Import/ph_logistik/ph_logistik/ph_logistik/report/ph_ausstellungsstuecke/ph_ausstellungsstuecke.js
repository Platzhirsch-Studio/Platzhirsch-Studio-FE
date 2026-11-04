frappe.query_reports["PH Ausstellungsstuecke"] = {
	filters: [
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "mindestalter_tage", label: __("Mindestalter (Tage)"), fieldtype: "Int", default: 0 },
	],
};
