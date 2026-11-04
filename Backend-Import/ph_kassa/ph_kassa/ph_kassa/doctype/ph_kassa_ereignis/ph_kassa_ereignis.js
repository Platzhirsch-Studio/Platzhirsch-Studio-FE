// PH Kassa Ereignis – FinanzOnline-Meldung bestätigen.
frappe.ui.form.on("PH Kassa Ereignis", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", Beendet: "blue", Gemeldet: "green", Erledigt: "green" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) return;
		if (frm.doc.meldung_finanzonline_noetig && !frm.doc.gemeldet_am) {
			frm.dashboard.set_headline_alert(__("Meldepflicht: Ausfall > 48 h binnen einer Woche in FinanzOnline melden (RKSV § 17)."), "red");
			frm.add_custom_button(__("Als gemeldet markieren"), () => frm.call({ method: "als_gemeldet_markieren", doc: frm.doc }).then(() => frm.reload_doc()), __("Aktionen"));
		}
		if (frm.doc.beleg) frm.add_custom_button(__("Beleg öffnen"), () => frappe.set_route("Form", "PH Kassenbeleg", frm.doc.beleg));
	},
});
