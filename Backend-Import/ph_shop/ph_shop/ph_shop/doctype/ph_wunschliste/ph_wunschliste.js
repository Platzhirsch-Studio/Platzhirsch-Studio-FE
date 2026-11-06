// PH Wunschliste – Desk: Studio-Sperre bei Missbrauch (src/lib/wunschliste/config.js REPORT_EMAIL).
frappe.ui.form.on("PH Wunschliste", {
	refresh(frm) {
		if (frm.is_new()) return;
		frm.set_intro(__("Die Liste wird auf der Website gepflegt. Reservierungen und Beiträge nur dort ändern."), "blue");
		if (frm.doc.status === "Aktiv") {
			frm.add_custom_button(
				__("Sperren (Missbrauch)"),
				() => {
					const d = new frappe.ui.Dialog({
						title: __("Wunschliste sperren"),
						fields: [{ fieldname: "grund", fieldtype: "Small Text", label: __("Grund"), reqd: 1 }],
						primary_action_label: __("Sperren"),
						primary_action(v) {
							frappe.confirm(__("Der Teilen-Link antwortet danach mit 404. Fortfahren?"), () => {
								frm.call({ method: "sperren", doc: frm.doc, args: { grund: v.grund } }).then(() => {
									d.hide();
									frm.reload_doc();
								});
							});
						},
					});
					d.show();
				},
				__("Aktionen")
			);
		}
	},
});
