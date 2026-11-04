frappe.listview_settings["PH Aufgabe"] = {
	add_fields: ["status", "prioritaet", "faellig", "zugewiesen_an"],
	filters: [["status", "in", ["Offen", "In Arbeit"]]],
	get_indicator(doc) {
		const heute = frappe.datetime.get_today();
		if (["Offen", "In Arbeit"].includes(doc.status) && doc.faellig && doc.faellig < heute) return [__("Überfällig"), "red", `faellig,<,${heute}`];
		const farben = { Offen: "orange", "In Arbeit": "blue", Erledigt: "green", Verworfen: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Meine offenen"), () => {
			listview.filter_area.clear().then(() => listview.filter_area.add([["PH Aufgabe", "zugewiesen_an", "=", frappe.session.user], ["PH Aufgabe", "status", "in", ["Offen", "In Arbeit"]]]));
		});
	},
};
