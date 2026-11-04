frappe.listview_settings["PH Tour"] = {
	add_fields: ["status", "datum", "fahrer", "anzahl_stopps", "anzahl_erledigt"],
	filters: [["status", "in", ["Geplant", "Freigegeben", "Unterwegs"]]],
	get_indicator(doc) {
		const farben = { Geplant: "blue", Freigegeben: "cyan", Unterwegs: "orange", Abgeschlossen: "green", Abgebrochen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Tour heute (mobil)"), () => frappe.set_route("ph-tour"));
	},
};
