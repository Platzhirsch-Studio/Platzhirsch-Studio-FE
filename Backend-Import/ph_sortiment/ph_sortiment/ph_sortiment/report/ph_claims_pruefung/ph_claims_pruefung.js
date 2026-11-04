frappe.query_reports["PH Claims-Pruefung"] = {
	filters: [{ fieldname: "nur_befunde", label: __("Nur Marken mit Befund"), fieldtype: "Check", default: 1 }],
	formatter(value, row, column, data, default_formatter) {
		value = default_formatter(value, row, column, data);
		if (column.fieldname === "ampel" && data) {
			const farbe = { rot: "red", gelb: "orange", grün: "green" }[data.ampel] || "gray";
			return `<span class="indicator-pill ${farbe}">${frappe.utils.escape_html(data.ampel)}</span>`;
		}
		return value;
	},
};
