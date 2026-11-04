// Listenansicht PH Zeiterfassung: Statusfarben, Standardfilter aktueller Monat.
frappe.listview_settings["PH Zeiterfassung"] = {
	add_fields: ["status", "dauer_text", "datum"],
	filters: [["datum", ">=", frappe.datetime.month_start()]],
	get_indicator(doc) {
		const farben = { Offen: "orange", Erfasst: "green", Korrigiert: "blue" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Kommen / Gehen"), () => {
			frappe.call({ method: "ph_personal.api.stempeln", freeze: true }).then((r) => {
				const m = r.message || {};
				frappe.show_alert({ message: m.meldung || __("Gebucht"), indicator: m.ok ? "green" : "orange" });
				listview.refresh();
			});
		});
	},
};
