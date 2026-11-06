frappe.query_reports["PH Inventur Abdeckung"] = {
	filters: [
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "nur_offen", label: __("Nur im Geschäftsjahr noch nicht gezählt"), fieldtype: "Check", default: 0 },
	],
	onload(report) {
		report.page.add_inner_button(__("Teilinventur anlegen"), () => {
			const lo = report.get_values().lagerort;
			frappe.prompt(
				[{ fieldname: "lagerort", fieldtype: "Link", options: "PH Lagerort", label: __("Lagerort"), reqd: 1, default: lo }, { fieldname: "anzahl", fieldtype: "Int", label: __("Plätze") }],
				(v) => frappe.call({ method: "ph_logistik.ph_logistik.inventur_plan.teilinventur_anlegen", args: v, freeze: true }).then((r) => frappe.set_route("Form", "PH Inventur", r.message)),
				__("Teilinventur"),
			);
		});
	},
};
