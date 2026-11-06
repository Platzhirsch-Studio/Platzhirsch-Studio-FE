// PH Postfach – Abholung anstoßen, Delta-Stand zurücksetzen.
frappe.ui.form.on("PH Postfach", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Jetzt abholen"), () => {
			frm.call({ method: "jetzt_abholen", doc: frm.doc }).then(() => frappe.show_alert({ message: __("Abholung eingereiht"), indicator: "blue" }));
		}, __("Aktionen"));
		frm.add_custom_button(__("Delta zurücksetzen"), () => {
			frappe.confirm(__("Die nächste Abholung liest die letzten Tage neu. Bereits zugeordnete Mails werden nicht doppelt angelegt. Fortfahren?"), () =>
				frm.call({ method: "delta_zuruecksetzen", doc: frm.doc }).then(() => frm.reload_doc()));
		}, __("Aktionen"));
		if (frm.doc.status === "Fehler" && frm.doc.letzter_fehler) {
			frm.dashboard.set_headline_alert(frappe.utils.escape_html(frm.doc.letzter_fehler), "red");
		}
	},
});
