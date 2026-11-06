frappe.listview_settings["PH Meldebestand"] = {
	add_fields: ["unter_meldebestand", "status"],
	get_indicator(doc) {
		if (doc.status === "Inaktiv") return [__("Inaktiv"), "gray", "status,=,Inaktiv"];
		return doc.unter_meldebestand ? [__("Unter Meldebestand"), "orange", "unter_meldebestand,=,1"] : [__("Ausreichend"), "green", "unter_meldebestand,=,0"];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Alle jetzt prüfen"), () => frappe.call({ method: "ph_logistik.ph_logistik.nachbestellung.jetzt_pruefen", freeze: true }).then((r) => {
			frappe.show_alert({ message: __("{0} neue Vorschläge", [(r.message || {}).neu || 0]), indicator: "green" });
			listview.refresh();
		}));
		listview.page.add_inner_button(__("Bericht Nachbestellvorschlag"), () => frappe.set_route("query-report", "PH Nachbestellvorschlag"));
	},
};
