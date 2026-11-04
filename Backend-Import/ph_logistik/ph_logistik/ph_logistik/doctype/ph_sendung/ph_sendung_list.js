frappe.listview_settings["PH Sendung"] = {
	add_fields: ["status", "richtung", "carrier", "tracking_nr", "env"],
	filters: [["status", "in", ["Angelegt", "Etikett", "Unterwegs", "Problem"]]],
	get_indicator(doc) {
		const farben = { Angelegt: "blue", Etikett: "cyan", Unterwegs: "orange", Zugestellt: "green", Problem: "red", Storniert: "gray" };
		return [__(doc.status), farben[doc.status] || "gray", `status,=,${doc.status}`];
	},
	onload(listview) {
		listview.page.add_inner_button(__("Tracking aller offenen Sendungen"), () => {
			frappe.call({ method: "ph_logistik.ph_logistik.tasks.tracking_aktualisieren", args: { sofort: 1 }, freeze: true }).then((r) => {
				frappe.show_alert({ message: __("{0} Sendungen abgeglichen", [r.message || 0]), indicator: "green" });
				listview.refresh();
			});
		});
	},
};
