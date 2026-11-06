frappe.query_reports["PH Inventurbewertung"] = {
	filters: [
		{ fieldname: "stichtag", label: __("Stichtag"), fieldtype: "Date", default: frappe.datetime.get_today(), reqd: 1 },
		{ fieldname: "lagerort", label: __("Lagerort"), fieldtype: "Link", options: "PH Lagerort" },
		{ fieldname: "methode", label: __("Methode (leer = Einstellungen)"), fieldtype: "Select", options: "\nGleitender Durchschnitt\nLetzter EK" },
		{ fieldname: "gruppierung", label: __("Anzeige"), fieldtype: "Select", options: "Position\nLagerort\nWarengruppe\nMarke\nBewertungsart", default: "Position" },
	],
	onload(report) {
		if (!frappe.user.has_role(["PH Logistik Leitung", "PH Geschäftsführung", "PH Backoffice-Admin", "System Manager"])) return;
		report.page.add_inner_button(__("Als Bewertung festhalten"), () => {
			const f = report.get_values();
			frappe.call({ method: "ph_logistik.ph_logistik.report.ph_inventurbewertung.ph_inventurbewertung.festhalten", args: { stichtag: f.stichtag, lagerort: f.lagerort, methode: f.methode }, freeze: true })
				.then((r) => frappe.set_route("Form", "PH Inventurbewertung", r.message));
		});
	},
};
