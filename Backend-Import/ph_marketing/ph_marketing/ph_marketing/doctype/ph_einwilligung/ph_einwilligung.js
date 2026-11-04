// PH Einwilligung – Nachweis; Buttons: Widerruf erfassen, Bestätigung mit Beleg (Leitung), Nachweis drucken.
frappe.ui.form.on("PH Einwilligung", {
	refresh(frm) {
		frm.page.clear_indicator();
		const farben = { Offen: "orange", Bestaetigt: "green", Widerrufen: "gray", Abgelaufen: "red" };
		if (frm.doc.status) frm.page.set_indicator(__(frm.doc.status), farben[frm.doc.status] || "gray");
		if (frm.is_new()) {
			frm.set_df_property("kanal", "description", __("Einträge aus dem Desk gelten als Nachweis mit Beleg (showroom/papier/telefon). Website-Einwilligungen kommen über die API mit Double-Opt-in."));
			return;
		}
		if (["Offen", "Bestaetigt"].includes(frm.doc.status)) {
			frm.add_custom_button(__("Widerruf erfassen"), () => {
				const d = new frappe.ui.Dialog({
					title: __("Widerruf"),
					fields: [
						{ fieldname: "kanal", fieldtype: "Select", label: __("Widerruf über"), options: ["antwort_mail", "telefon", "showroom", "backoffice"], default: "backoffice", reqd: 1 },
						{ fieldname: "grund", fieldtype: "Data", label: __("Grund (optional)") },
					],
					primary_action_label: __("Widerrufen"),
					primary_action(v) {
						frm.call({ method: "widerrufen", doc: frm.doc, args: v }).then(() => { d.hide(); frm.reload_doc(); });
					},
				});
				d.show();
			}, __("Aktionen"));
		}
		if (frm.doc.status === "Offen" && frappe.user.has_role("PH Marketing Leitung")) {
			frm.add_custom_button(__("Bestätigung mit Beleg"), () => {
				frappe.prompt({ fieldname: "beleg_hinweis", fieldtype: "Data", label: __("Beleg (z. B. Antwortmail vom …)"), reqd: 1 }, (v) => {
					frm.call({ method: "bestaetigen_mit_beleg", doc: frm.doc, args: v }).then(() => frm.reload_doc());
				}, __("Ohne Link bestätigen"));
			}, __("Aktionen"));
		}
		frm.add_custom_button(__("Nachweis drucken"), () => frappe.set_route("print", frm.doctype, frm.doc.name), __("Aktionen"));
		if (frm.doc.zweck === "newsletter") frm.add_custom_button(__("Newsletter-Abo"), () => frappe.set_route("Form", "PH Newsletter Abo", frm.doc.email));
	},
});
