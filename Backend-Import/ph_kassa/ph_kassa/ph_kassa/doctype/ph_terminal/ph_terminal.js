// PH Terminal – Buttons: Status abfragen, Kassa öffnen.
frappe.ui.form.on("PH Terminal", {
	refresh(frm) {
		const farben = { Unbekannt: "gray", Online: "green", Offline: "red", Beschaeftigt: "orange", Deaktiviert: "gray" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;

		frm.add_custom_button(__("Status abfragen"), () => {
			frm.call({ method: "status_abfragen", doc: frm.doc, freeze: true, freeze_message: __("Reader wird abgefragt …") }).then((r) => {
				frappe.show_alert({ message: __("Reader ist {0}", [__(r.message)]), indicator: farben[r.message] || "gray" });
				frm.reload_doc();
			});
		}, __("Aktionen"));

		frm.add_custom_button(__("Kassa öffnen"), () => {
			frappe.set_route("ph-kassa", frm.doc.kasse ? { kasse: frm.doc.kasse } : {});
		}, __("Aktionen"));

		if (frm.doc.testmodus) frm.dashboard.set_headline_alert(__("Testmodus: keine echten Kartenzahlungen."), "orange");
	},
});
