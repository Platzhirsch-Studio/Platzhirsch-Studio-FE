frappe.ui.form.on("PH Serviceauftrag", {
	refresh(frm) {
		const f = { Angefragt: "blue", Angeboten: "orange", Beauftragt: "cyan", Abgeholt: "purple", Eingelagert: "yellow", "In Arbeit": "orange", Zurueckgebracht: "green", Abgerechnet: "gray", Storniert: "red" };
		frm.page.clear_indicator();
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), f[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		frm.add_custom_button(__("Übernahmeliste (PDF)"), () => frm.print_doc("PH Serviceauftrag Übernahmeliste"), __("Drucken"));
		if (!frm.doc.preis_cent) frm.dashboard.add_indicator(__("Preis auf Anfrage"), "orange");
	},
});
