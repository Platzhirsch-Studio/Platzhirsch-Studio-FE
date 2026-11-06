// Listenansicht PH Projekt: Phasenfarben, Standardfilter „laufend“.
frappe.listview_settings["PH Projekt"] = {
	add_fields: ["status", "projektart", "kunde_name", "liefertermin_geplant", "prioritaet", "planer"],
	filters: [["status", "not in", ["Abgeschlossen", "Abgebrochen"]]],
	get_indicator(doc) {
		const farben = { Anfrage: "blue", Planung: "cyan", Angebot: "orange", Auftrag: "purple", Bestellung: "yellow", Lieferung: "light-blue", Montage: "pink", Uebergabe: "green", Abgeschlossen: "gray", Abgebrochen: "red" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		// Schnellfilter „Meine Planungen“ (Planer = ich)
		listview.page.add_inner_button(__("Meine Planungen"), () => {
			listview.filter_area.clear(false).then(() => listview.filter_area.add([["PH Projekt", "planer", "=", frappe.session.user]]));
		});
		listview.page.add_inner_button(__("Auftragsmappe"), () => {
			const sel = listview.get_checked_items();
			if (sel.length !== 1) return frappe.msgprint(__("Bitte genau ein Projekt wählen."));
			frappe.set_route("ph-auftragsmappe", { projekt: sel[0].name });
		});
	},
};
