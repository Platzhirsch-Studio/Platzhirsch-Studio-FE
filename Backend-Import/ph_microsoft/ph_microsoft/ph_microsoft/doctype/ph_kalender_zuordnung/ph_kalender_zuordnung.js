// PH Kalender Zuordnung – Abgleich anstoßen, Delta-Fenster neu aufsetzen.
frappe.ui.form.on("PH Kalender Zuordnung", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Jetzt abgleichen"), () => {
			frm.call({ method: "jetzt_abgleichen", doc: frm.doc }).then(() => frappe.show_alert({ message: __("Abgleich eingereiht"), indicator: "blue" }));
		}, __("Aktionen"));
		frm.add_custom_button(__("Delta zurücksetzen"), () => {
			frm.call({ method: "delta_zuruecksetzen", doc: frm.doc }).then(() => frm.reload_doc());
		}, __("Aktionen"));
		if (frm.doc.status === "Fehler" && frm.doc.letzter_fehler) {
			frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.letzter_fehler), "red");
		}
	},
});
