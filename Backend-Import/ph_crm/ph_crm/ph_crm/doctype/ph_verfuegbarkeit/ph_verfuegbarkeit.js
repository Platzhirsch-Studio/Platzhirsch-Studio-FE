// PH Verfuegbarkeit – Wochenplan: Standardwerte und Schnellkopie auf weitere Tage.
frappe.ui.form.on("PH Verfuegbarkeit", {
	setup(frm) {
		frm.set_query("user", () => ({ filters: { enabled: 1, user_type: "System User" } }));
	},
	onload(frm) {
		if (frm.is_new()) {
			if (!frm.doc.user) frm.set_value("user", frappe.session.user);
			if (!frm.doc.von) frm.set_value("von", "10:00:00");
			if (!frm.doc.bis) frm.set_value("bis", "18:00:00");
		}
	},
	refresh(frm) {
		if (frm.is_new()) return;
		frm.add_custom_button(__("Auf weitere Wochentage kopieren"), () => {
			const d = new frappe.ui.Dialog({
				title: __("Kopieren"),
				fields: [{ fieldname: "tage", fieldtype: "MultiSelectPills", label: __("Wochentage"), get_data: () => ["0 Montag", "1 Dienstag", "2 Mittwoch", "3 Donnerstag", "4 Freitag", "5 Samstag", "6 Sonntag"].filter((t) => t !== frm.doc.wochentag) }],
				primary_action_label: __("Anlegen"),
				primary_action(v) {
					const tage = v.tage || [];
					Promise.all(tage.map((t) => frappe.db.insert({ doctype: "PH Verfuegbarkeit", user: frm.doc.user, wochentag: t, von: frm.doc.von, bis: frm.doc.bis, modus: frm.doc.modus, gueltig_von: frm.doc.gueltig_von, gueltig_bis: frm.doc.gueltig_bis }))).then(() => {
						d.hide();
						frappe.show_alert({ message: __("{0} Verfügbarkeiten angelegt", [tage.length]), indicator: "green" });
					});
				},
			});
			d.show();
		}, __("Aktionen"));
	},
});
