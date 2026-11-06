// PH Bewertung – Veröffentlichen/Ausblenden (nur Leitung; Server prüft). Kein Gating: Ausblenden nur aus festen Gründen.
frappe.ui.form.on("PH Bewertung", {
	refresh(frm) {
		if (frm.is_new()) return;
		if (frm.doc.status !== "Veroeffentlicht") {
			frm.add_custom_button(
				__("Veröffentlichen"),
				() => {
					if (frm.doc.quelle !== "Google" && !frm.doc.einwilligung_veroeffentlichung) {
						frappe.msgprint(__("Für direkte Rückmeldungen fehlt die Einwilligung zur Veröffentlichung."));
						return;
					}
					frappe.confirm(__("Rückmeldung öffentlich zeigen (Name maskiert)?"), () =>
						frm.call({ method: "veroeffentlichen", doc: frm.doc }).then(() => frm.reload_doc())
					);
				},
				__("Aktionen")
			);
		}
		if (frm.doc.status !== "Ausgeblendet") {
			frm.add_custom_button(
				__("Ausblenden"),
				() => {
					const d = new frappe.ui.Dialog({
						title: __("Ausblenden"),
						fields: [
							{
								fieldname: "grund",
								fieldtype: "Select",
								label: __("Grund"),
								reqd: 1,
								options: ["Rechtsverletzung", "Spam", "Kein Kundenbezug", "Widerruf der Einwilligung"],
								description: __("Nie wegen weniger Sterne (Google-Richtlinie, UWG)."),
							},
						],
						primary_action_label: __("Ausblenden"),
						primary_action(v) {
							d.hide();
							frm.call({ method: "ausblenden", doc: frm.doc, args: { grund: v.grund } }).then(() => frm.reload_doc());
						},
					});
					d.show();
				},
				__("Aktionen")
			);
		}
	},
});
