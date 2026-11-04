frappe.listview_settings["PH Serviceeinsatz"] = {
	add_fields: ["status", "techniker", "datum", "art"],
	filters: [["status", "in", ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"]]],
	get_indicator(doc) {
		const f = { Geplant: "blue", Bestaetigt: "cyan", Unterwegs: "purple", "In Arbeit": "orange", Erledigt: "green", "Nicht angetroffen": "red", Abgebrochen: "gray" };
		return [__(doc.status), f[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Meine Einsätze"), () => { listview.filter_area.add([["PH Serviceeinsatz", "techniker", "=", frappe.session.user]]); });
	},
};
