frappe.ui.form.on("PH Logistik Einstellungen", {
	refresh(frm) {
		if (!frm.doc.letmeship_konfiguriert) frm.dashboard.set_headline_alert(__("Keine LetMeShip-Zugangsdaten in site_config.json (ph_letmeship_api_id / ph_letmeship_api_password) – es läuft der Mock."), "orange");
		else if (frm.doc.letmeship_testmodus) frm.dashboard.set_headline_alert(__("Testmodus aktiv: Mock-Client, keine echten Aufrufe."), "blue");
		else frm.dashboard.set_headline_alert(__("LetMeShip {0} aktiv – echte Buchungen!", [frm.doc.letmeship_env]), frm.doc.letmeship_env === "live" ? "red" : "orange");
		frm.add_custom_button(__("Packtisch öffnen"), () => frappe.set_route("ph-packtisch"));
	},
});
