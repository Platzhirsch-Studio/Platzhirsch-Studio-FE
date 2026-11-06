frappe.query_reports["PH Nachbestellvorschlag"] = {
	filters: [
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "lieferant", label: __("Lieferant"), fieldtype: "Link", options: "PH Lieferant" },
		{ fieldname: "marke", label: __("Marke"), fieldtype: "Link", options: "PH Marke" },
		{ fieldname: "nur_unter", label: __("Nur unter Meldebestand"), fieldtype: "Check", default: 1 },
	],
	onload(report) {
		if (!frappe.user.has_role(["PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"])) return;
		report.page.add_inner_button(__("Vorschläge jetzt erzeugen"), () =>
			frappe.call({ method: "ph_logistik.ph_logistik.nachbestellung.jetzt_pruefen", freeze: true }).then(() => frappe.set_route("List", "PH Bestellvorschlag", { status: "Offen" })));
	},
};
