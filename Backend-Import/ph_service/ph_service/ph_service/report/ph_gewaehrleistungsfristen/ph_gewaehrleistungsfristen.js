frappe.query_reports["PH Gewährleistungsfristen"] = {
	filters: [
		{ fieldname: "tage", label: __("Fenster (Tage)"), fieldtype: "Int", default: 60 },
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
		{ fieldname: "alle", label: __("Auch abgeschlossene Fälle"), fieldtype: "Check", default: 0 },
	],
	formatter(value, row, column, data, default_formatter) {
		if (column.fieldname === "ampel" && data) {
			const f = { gruen: "#15803d", gelb: "#ca8a04", orange: "#c2410c", rot: "#b91c1c", grau: "#9ca3af" }[data.ampel] || "#9ca3af";
			return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${f}" title="${frappe.utils.escape_html(data.fristen_status || "")}"></span>`;
		}
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "tage_rest" && data && data.tage_rest !== null && data.tage_rest !== undefined) {
			const farbe = data.tage_rest < 0 ? "#b91c1c" : data.tage_rest <= 30 ? "#b45309" : "#111827";
			value = `<span style="color:${farbe};font-weight:600">${value}</span>`;
		}
		return value;
	},
};
