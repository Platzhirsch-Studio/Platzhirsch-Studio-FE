frappe.query_reports["PH Regressstatus"] = {
	filters: [
		{ fieldname: "status", label: __("Status"), fieldtype: "Select", options: ["", "Offen", "Gemeldet", "Anerkannt", "Abgelehnt", "Verrechnet"] },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "alle", label: __("Auch abgeschlossene"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "tage_frist" && data && data.tage_frist !== null && data.tage_frist !== undefined) {
			const farbe = data.tage_frist < 0 ? "#b91c1c" : data.tage_frist <= 14 ? "#b45309" : "#15803d";
			value = `<span style="color:${farbe};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
